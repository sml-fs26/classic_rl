/* Finite-horizon dynamic programming over the 4-state Recycling Robot MDP.
 *
 *   This is a FINITE-HORIZON problem (a work shift of N = 8 steps, gamma = 1),
 *   so the value function carries a "steps-remaining" index k:
 *
 *     V_0(s)      = 0                              (shift over: no future)
 *     V_k(s)      = max_a Q_k(s, a)                (k >= 1 steps remain)
 *     Q_k(s, a)   = sum_{s'} p(s'|s,a) [ R + V_{k-1}(s') ]   (terminal s' -> 0)
 *
 *   We back up IN TIME from the last step (k = 1) outward to the start of the
 *   shift (k = N). The optimal action is stable for every k >= 2; only the
 *   final-step column (k = 1) differs (the safe +1 WAIT wins at low/mid there).
 *   So the "converged" Q-table the page renders as the headline board is the
 *   k = N layer, and the DP-fill scene animates the layers k = 1 .. N.
 *
 *   Lever order is window.Moves.MOVE_IDS = [search, wait, recharge], matching
 *   window.DATA.Qstar / the gauge widget. Reads window.Battle (aliased to
 *   window.Robot) and window.Moves (aliased to window.Levers). */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;   // [{lv:1},{lv:2},{lv:3},{lv:4}]
  const N = STATES.length;                             // 4
  const MOVE_IDS = window.Moves.MOVE_IDS;              // [search, wait, recharge]
  const A = MOVE_IDS.length;                           // 3
  const SHIFT = window.Battle.SHIFT;                   // 8

  function makeV() { return new Float64Array(N); }

  /* One-step Q-value of lever m at state s, given the NEXT-step value array
     Vnext (V_{k-1}), indexed by stateIndex. */
  function qValueWith(s, m, Vnext, gamma) {
    const succ = window.Battle.successorsFromBuckets(s, m);
    let q = 0;
    for (const { sNext, p, reward } of succ) {
      let vN = 0;
      if (!sNext.terminal) vN = Vnext[window.Battle.stateIndex(sNext)];
      q += p * (reward + gamma * vN);
    }
    return q;
  }

  /* One backup step: given V_{k-1} (Vnext) produce V_k + greedy policy_k. */
  function backupStep(Vnext, gamma) {
    const Vk = new Float64Array(N);
    const Qk = new Float64Array(N * A);
    const pol = new Array(N);
    let maxDelta = 0;
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity, bestM = null;
      for (let ai = 0; ai < A; ai++) {
        const q = qValueWith(s, MOVE_IDS[ai], Vnext, gamma);
        Qk[i * A + ai] = q;
        if (q > best) { best = q; bestM = MOVE_IDS[ai]; }   // strict >: ties keep the FIRST (search>wait>recharge)
      }
      Vk[i] = best;
      pol[i] = bestM;
      const d = Math.abs(Vk[i] - Vnext[i]);
      if (d > maxDelta) maxDelta = d;
    }
    return { Vk, Qk, pol, maxDelta };
  }

  /* Full finite-horizon solve over `horizon` steps. Returns the layers:
       Vlayers[k]  = V_k   (k = 0..horizon)            Float64Array[N]
       Qlayers[k]  = Q_k   (k = 1..horizon)            Float64Array[N*A]
       policies[k] = greedy policy at k steps remaining (k = 1..horizon)
       policyStableFrom = smallest k* such that policies[k]==policies[k+1]
                          for all k >= k* (the policy "converges" after this)
     The headline (converged) layer is k = horizon. */
  function finiteHorizon(horizon, gamma) {
    const g = gamma == null ? 1 : gamma;
    const Vlayers = [makeV()];                  // V_0 = 0
    const Qlayers = [null];                      // no Q_0
    const policies = [null];                      // no policy_0
    const deltas = [Infinity];
    for (let k = 1; k <= horizon; k++) {
      const { Vk, Qk, pol, maxDelta } = backupStep(Vlayers[k - 1], g);
      Vlayers.push(Vk);
      Qlayers.push(Qk);
      policies.push(pol);
      deltas.push(maxDelta);
    }
    /* When does the argmax policy stop changing? */
    let stableFrom = horizon;
    for (let k = horizon; k >= 2; k--) {
      if (policyDiff(policies[k], policies[k - 1]) === 0) stableFrom = k - 1;
      else break;
    }
    return { Vlayers, Qlayers, policies, deltas, horizon: horizon, gamma: g, stableFrom };
  }

  /* Convenience: the converged (headline) solution = the k=horizon layer. */
  function converged(horizon, gamma) {
    const fh = finiteHorizon(horizon == null ? SHIFT : horizon, gamma);
    const k = fh.horizon;
    return {
      V: fh.Vlayers[k],
      Q: fh.Qlayers[k],
      policy: fh.policies[k],
      lastStepPolicy: fh.policies[1],
      stableFrom: fh.stableFrom,
      layers: fh,
    };
  }

  /* Greedy policy from a Q layer (strict >, ties keep search>wait>recharge). */
  function greedyFromQ(Q) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      let best = -Infinity, bestM = null;
      for (let ai = 0; ai < A; ai++) {
        const q = Q[i * A + ai];
        if (q > best) { best = q; bestM = MOVE_IDS[ai]; }
      }
      out[i] = bestM;
    }
    return out;
  }

  function policyDiff(p1, p2) {
    if (!p1 || !p2) return N;
    let n = 0;
    for (let i = 0; i < N; i++) if (p1[i] !== p2[i]) n++;
    return n;
  }
  function leversUsed(policy) {
    const set = new Set();
    for (let i = 0; i < N; i++) set.add(policy[i]);
    return set.size;
  }
  function leverFrequencies(policy) {
    const c = {};
    for (const m of MOVE_IDS) c[m] = 0;
    for (let i = 0; i < N; i++) c[policy[i]] = (c[policy[i]] || 0) + 1;
    return c;
  }

  /* Lever usage across all rungs x all shift steps (the "16/14/2" tally). */
  function leverUsageOverShift(fh) {
    const c = {};
    for (const m of MOVE_IDS) c[m] = 0;
    for (let k = 1; k <= fh.horizon; k++) {
      for (let i = 0; i < N; i++) c[fh.policies[k][i]]++;
    }
    return c;
  }

  window.Bellman = {
    STATES, N, MOVE_IDS, A, SHIFT,
    qValueWith, backupStep, finiteHorizon, converged, greedyFromQ,
    policyDiff, leversUsed, leverFrequencies, leverUsageOverShift,
  };
})();

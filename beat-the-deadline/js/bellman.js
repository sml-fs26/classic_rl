/* Value iteration over the 9-state Gambler's Ruin MDP.
 *
 *   V(s) = max_a { sum_{s'} p(s'|s,a) * [ R(s,a,s') + gamma * V(s') ] }   (s playable)
 *   V(RUIN) = 0      (absorbing, you lost)
 *   V(GOAL) = 1      (absorbing, the +1 was paid on entry; encoded as the
 *                     reward on the transition INTO goal, so terminals stay 0
 *                     here and the goal's value shows up through the reward).
 *
 *   Synchronous backups; 9 states; gamma = 1 (every episode terminates).
 *   The reward is baked into successors (+1 only on the transition that lands
 *   exactly on $10), so the backup is just max_a sum p * (r + gamma * V(s')).
 *
 *   CLAMPED ACTIONS: window.Gambler.successors returns [] for an illegal
 *   stake (a > capital, or a would overshoot the goal). An empty successor
 *   list scores that action minus Infinity, so it is never the argmax and the
 *   Q-table renders it as unavailable. At least one stake is always legal at
 *   every interior rung, so V is always finite.
 *
 *   Reused unchanged from the pricing/Pokemon builds except for the
 *   empty-successors -> minus Infinity guard. Reads window.Battle (aliased to
 *   window.Gambler) and window.Moves (aliased to window.Stakes). */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;
  const N = STATES.length;       // 9
  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;     // 3

  function makeV() { return new Float64Array(N); }

  /* Q-value of stake m at state s. Returns minus Infinity if the stake is
     clamped (no successors), so it can never win an argmax. */
  function qValue(s, m, V, gamma) {
    const succ = window.Battle.successorsFromBuckets(s, m);
    if (!succ || succ.length === 0) return -Infinity;
    let q = 0;
    for (const { sNext, p, reward } of succ) {
      let vNext = 0;
      if (!sNext.terminal) vNext = V[window.Battle.stateIndex(sNext)];
      q += p * (reward + gamma * vNext);
    }
    return q;
  }

  function bellmanSweep(V, gamma) {
    const Vnew = new Float64Array(N);
    let maxDelta = 0;
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
        if (q > best) best = q;
      }
      Vnew[i] = best;
      const d = Math.abs(Vnew[i] - V[i]);
      if (d > maxDelta) maxDelta = d;
    }
    return { Vnew, maxDelta };
  }

  function valueIteration(gamma, opts) {
    const o = opts || {};
    const tol = o.tol != null ? o.tol : 1e-4;
    const maxIters = o.maxIters || 100;
    const recordHistory = o.recordHistory !== false;

    let V = makeV();
    const history = [];
    if (recordHistory) history.push({ iter: 0, maxDelta: Infinity, V: Array.from(V) });

    let iters = 0;
    for (let k = 1; k <= maxIters; k++) {
      const { Vnew, maxDelta } = bellmanSweep(V, gamma);
      V = Vnew;
      iters = k;
      if (recordHistory) history.push({ iter: k, maxDelta, V: Array.from(V) });
      if (maxDelta < tol) break;
    }

    const policy = greedyPolicy(V, gamma);
    return { V, policy, iters, history };
  }

  /* Greedy policy. Ties are broken toward the LARGER stake (so the bold
     middle reads as a clean band; matches the proposal's tie-break rule).
     MOVE_IDS is in ascending bet order [bet1,bet2,bet3], so iterating with
     `>=` keeps the last (largest) stake on a tie. */
  function greedyPolicy(V, gamma) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity, bestM = null;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
        if (q >= best) { best = q; bestM = m; }   // >= : larger stake wins ties
      }
      out[i] = bestM;
    }
    return out;
  }

  function qFromV(V, gamma) {
    /* 9 x 3 Q-table, indexed [stateIdx * 3 + moveIdx]. Clamped stakes hold
       minus Infinity (serialised downstream as null for display). */
    const Q = new Float64Array(N * A);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      for (let ai = 0; ai < A; ai++) {
        Q[i * A + ai] = qValue(s, MOVE_IDS[ai], V, gamma);
      }
    }
    return Q;
  }

  function policyDiff(p1, p2) {
    let n = 0;
    for (let i = 0; i < N; i++) if (p1[i] !== p2[i]) n++;
    return n;
  }

  function movesUsed(policy) {
    const set = new Set();
    for (let i = 0; i < N; i++) set.add(policy[i]);
    return set.size;
  }

  function moveFrequencies(policy) {
    const c = {};
    for (const m of MOVE_IDS) c[m] = 0;
    for (let i = 0; i < N; i++) c[policy[i]] = (c[policy[i]] || 0) + 1;
    return c;
  }

  window.Bellman = {
    STATES, N, MOVE_IDS, A,
    qValue, bellmanSweep, valueIteration, greedyPolicy,
    qFromV, policyDiff, movesUsed, moveFrequencies,
  };
})();

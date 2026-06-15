/* Value iteration over the 25-state Trial Clock MDP.
 *
 *   V(s) = max_a { sum_{s'} p(s'|s,a) * [ R(s,a,s') + gamma * V(s') ] }   (s playable)
 *   V(CONVERT) = V(ABANDON) = V(EXPIRY) = 0   (the +20 / -5 are paid on the
 *     transition INTO the terminal, encoded as the reward in successors, so the
 *     terminals themselves carry no extra value here).
 *
 *   Synchronous backups; 25 states; gamma = 1 (the trial always terminates
 *   within 5 days, so returns are bounded without discounting). The reward is
 *   baked into successors (+20 only on the BUY transition, -1 on every NUDGE,
 *   -5 on the ABANDON transition, 0 otherwise), so the backup is just
 *   max_a sum p * (r + gamma * V(s')).
 *
 *   NO CLAMPED ACTIONS: every lever is legal in every cell (window.Trial never
 *   returns an empty successor list), so V is always finite and the empty-list
 *   guard from the gambler build is kept only as a harmless safety net.
 *
 *   Because the clock counts DOWN, this is a finite-horizon problem: the
 *   optimal lever depends on days-left, so value iteration is equivalent to
 *   backward induction (the day-1 column settles first, then day-2 from it, and
 *   so on). Synchronous sweeps converge in MAX_DAYS sweeps; the DP scene
 *   replays the per-sweep fill so the staircase draws itself column by column.
 *
 *   Reused from the gambler/pricing/Pokemon builds. Reads window.Battle
 *   (aliased to window.Trial) and window.Moves (aliased to window.Levers). */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;
  const N = STATES.length;       // 25
  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;     // 3

  function makeV() { return new Float64Array(N); }

  /* Q-value of lever m at state s. Returns minus Infinity only if a lever ever
     had no successors (never happens here), so it can never win an argmax. */
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

  /* Greedy policy. MOVE_IDS is [nudge, nothing, push]; iterating with `>` keeps
     the FIRST (left-most) lever on an exact tie. There are NO exact Q ties in
     this MDP's optimal solution (verified in the precompute), so the tie-break
     never actually fires -- the policy is uniquely determined. */
  function greedyPolicy(V, gamma) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity, bestM = null;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
        if (q > best) { best = q; bestM = m; }   // > : first lever wins exact ties
      }
      out[i] = bestM;
    }
    return out;
  }

  function qFromV(V, gamma) {
    /* 25 x 3 Q-table, indexed [stateIdx * 3 + moveIdx]. */
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

/* Value iteration over the 15-state Stale-by-Sundown MDP.
 *
 *   V(s) = max_a { sum_{s'} p(s'|s,a) * [ R(s,a,s') + gamma * V(s') ] }   (s playable)
 *   V(CLEARED) = 0      (absorbing win; sale revenue already banked)
 *   V(SPOILED) = 0      (absorbing loss; the -6 was paid on the transition IN,
 *                        encoded as the reward on the edge into SPOILED, so the
 *                        terminal itself stays 0 here)
 *
 *   Synchronous backups; 15 states; gamma = 0.75 (every episode terminates at
 *   CLEARED or SPOILED, but the discount supplies the "by sundown" deadline
 *   pressure). The reward is baked into successors, so the backup is just
 *   max_a sum p * (r + gamma * V(s')).
 *
 *   All three levers (HOLD/DISCOUNT/DUMP) are legal at every shelf state, so
 *   there are no clamped actions; the Q-table is a clean 15 x 3. (The
 *   empty-successors -> -Infinity guard is kept for interface parity with the
 *   sibling engines.)
 *
 *   Reused from the gambler/Pokemon builds. Reads window.Battle (aliased to
 *   window.Bakery) and window.Moves (aliased to window.Levers). The greedy
 *   tie-break here favors the EARLIER action in MOVE_IDS order
 *   [HOLD, DISCOUNT, DUMP] (premium > act-now > cut-loss), so a tie reads as the
 *   higher-margin lever -- the bakery's natural preference. The proposal board
 *   has a strict winner in every cell, so the tie-break never actually fires;
 *   the precompute asserts this. */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;
  const N = STATES.length;       // 15
  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;     // 3

  function makeV() { return new Float64Array(N); }

  /* Q-value of lever m at state s. Returns -Infinity if the lever has no
     successors (never happens here; kept for parity). */
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

  /* Greedy policy. Ties break toward the EARLIER lever in MOVE_IDS order
     (HOLD, DISCOUNT, DUMP), i.e. the higher-margin lever wins a tie. MOVE_IDS
     is [HOLD, DISCOUNT, DUMP], so iterating with strict `>` keeps the first
     (earliest) lever that attains the max. */
  function greedyPolicy(V, gamma) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity, bestM = null;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
        if (q > best) { best = q; bestM = m; }    // strict > : earlier lever wins ties
      }
      out[i] = bestM;
    }
    return out;
  }

  function qFromV(V, gamma) {
    /* 15 x 3 Q-table, indexed [stateIdx * 3 + moveIdx]. */
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

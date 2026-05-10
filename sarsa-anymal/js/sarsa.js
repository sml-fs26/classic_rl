/* SARSA primitives. Pure functions — caller owns the Q-table object.

   The notebook's helpers `epsilon_greedy_action`, `get_q_value`, `set_q_value`
   are reproduced here in array form. State here is just (r, c). The Q-table is
   a plain Float32Array of length M*N*4 (action order = MDP.ACTIONS = up,down,left,right).
*/
(function () {
  const ACTIONS = window.MDP ? window.MDP.ACTIONS : ['up', 'down', 'left', 'right'];
  const A = ACTIONS.length; /* 4 */

  function makeQ(M, N) {
    /* Float32Array zero-initialised. Indexing: idx(r, c, a) = (r*N + c)*A + a */
    return new Float32Array(M * N * A);
  }

  function idx(N, r, c, a) {
    return (r * N + c) * A + a;
  }

  function get(Q, M, N, r, c, a) {
    return Q[idx(N, r, c, a)];
  }

  function set(Q, M, N, r, c, a, v) {
    Q[idx(N, r, c, a)] = v;
  }

  /* All four Q-values for one state, in ACTIONS order. */
  function row(Q, N, r, c) {
    const base = (r * N + c) * A;
    return [Q[base], Q[base + 1], Q[base + 2], Q[base + 3]];
  }

  /* max_a Q(s,a). */
  function maxQ(Q, N, r, c) {
    const base = (r * N + c) * A;
    let m = Q[base];
    for (let a = 1; a < A; a++) {
      if (Q[base + a] > m) m = Q[base + a];
    }
    return m;
  }

  /* argmax_a Q(s,a) with random tiebreak. Returns action *string*. */
  function argmaxQ(Q, N, r, c, rng) {
    const base = (r * N + c) * A;
    let m = Q[base];
    for (let a = 1; a < A; a++) {
      if (Q[base + a] > m) m = Q[base + a];
    }
    const ties = [];
    for (let a = 0; a < A; a++) {
      if (Q[base + a] === m) ties.push(a);
    }
    const k = ties.length === 1 ? 0 : Math.floor((rng ? rng() : Math.random()) * ties.length);
    return ACTIONS[ties[k]];
  }

  /* Argmax index 0..3, no tiebreak (returns first). For arrow rendering. */
  function argmaxIndex(Q, N, r, c) {
    const base = (r * N + c) * A;
    let m = Q[base], k = 0;
    for (let a = 1; a < A; a++) {
      if (Q[base + a] > m) { m = Q[base + a]; k = a; }
    }
    return k;
  }

  /* ε-greedy action selection. */
  function pickEpsGreedy(Q, N, r, c, eps, rng) {
    if (rng() < eps) {
      return ACTIONS[Math.floor(rng() * A)];
    }
    return argmaxQ(Q, N, r, c, rng);
  }

  /* The SARSA update.

       Q(s, a) ← Q(s, a) + α · [ r + γ · Q(s', a') − Q(s, a) ]

     If `terminal` is truthy, the bootstrap term `γ Q(s', a')` is dropped:
       Q(s, a) ← Q(s, a) + α · [ r − Q(s, a) ]
     This matches the convention in the notebook (terminal states have value 0)
     and is what the recap teaser depends on. Returns the TD error for telemetry. */
  function update(Q, N, s, a, r, sNext, aNext, alpha, gamma, terminal) {
    const aIdx = ACTIONS.indexOf(a);
    const aNextIdx = ACTIONS.indexOf(aNext);
    const baseS = (s.r * N + s.c) * A;
    const qSA = Q[baseS + aIdx];
    let target;
    if (terminal) {
      target = r;
    } else {
      const baseSNext = (sNext.r * N + sNext.c) * A;
      target = r + gamma * Q[baseSNext + aNextIdx];
    }
    const tdError = target - qSA;
    Q[baseS + aIdx] = qSA + alpha * tdError;
    return { tdError, target, prev: qSA, next: Q[baseS + aIdx] };
  }

  /* Heatmap-friendly statistics over a Q snapshot. */
  function stats(Q) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < Q.length; i++) {
      if (Q[i] < lo) lo = Q[i];
      if (Q[i] > hi) hi = Q[i];
    }
    if (!Number.isFinite(lo)) lo = 0;
    if (!Number.isFinite(hi)) hi = 0;
    return { lo, hi };
  }

  window.SARSA = {
    ACTIONS,
    A,
    makeQ, idx, get, set, row, maxQ, argmaxQ, argmaxIndex,
    pickEpsGreedy, update, stats,
  };
})();

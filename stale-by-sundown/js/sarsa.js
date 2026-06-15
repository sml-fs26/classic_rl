/* SARSA primitives for the 15-state, 3-action Stale-by-Sundown MDP.
 *
 *   Q-table: 15 shelf states ((units 1..3) x (tier FRESH..STALE)) x 3 levers
 *   (HOLD/DISCOUNT/DUMP) = 45 values, indexed as stateIdx * 3 + leverIdx,
 *   stateIdx = (units-1)*5 + tierIndex.
 *   Reward model: +5 HOLD sale, +2 DISCOUNT sale, -3 DUMP, -6 on tipping into
 *   SPOILED, 0 on CLEARED. gamma = 0.75. The SARSA update at a terminal drops
 *   the bootstrap.
 *
 *   All three levers are legal at every state (no clamped actions), so
 *   e-greedy is over all 3 levers everywhere.
 *
 *   This file is used by both the runtime (the SARSA scene) and the precompute
 *   (which mirrors the algorithm in Node for offline training). Reads
 *   window.Moves (aliased to window.Levers) and window.Bakery (aliased to
 *   window.Battle). The model-free learner here is ON-POLICY SARSA with a
 *   GLIE schedule (annealing epsilon + Robbins-Monro step), which converges to
 *   the DP-optimal board on all 15 cells; see CLAUDE.md and the precompute. The
 *   off-policy Q-learning update is also exposed for completeness / the honest
 *   on-policy nuance. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;       // [HOLD, DISCOUNT, DUMP]
  const A = ACTIONS.length;                     // 3
  const N = window.Bellman.N;                   // 15
  const G = window.Bakery;

  function makeQ() { return new Float32Array(N * A); }
  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  /* Legal action INDICES at a state, all three levers, always. */
  function legalIdxs(_stateIdx) { return [0, 1, 2]; }

  /* Greedy over the legal levers. During LEARNING this uses a random tie-break
     (keeps exploration unbiased); the reporting helper argmaxPolicy below uses
     a deterministic earlier-lever tie-break to match the DP greedy. */
  function argmaxQ(Q, stateIdx, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity;
    for (const a of L) { if (Q[base + a] > m) m = Q[base + a]; }
    const ties = [];
    for (const a of L) if (Q[base + a] === m) ties.push(a);
    const k = ties.length <= 1 ? 0 : Math.floor((rng ? rng() : Math.random()) * ties.length);
    return ACTIONS[ties[k]];
  }

  function pickEpsGreedy(Q, stateIdx, eps, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    if (L.length === 0) return ACTIONS[0];
    if (eps > 0 && rng() < eps) return ACTIONS[L[Math.floor(rng() * L.length)]];
    return argmaxQ(Q, stateIdx, rng, L);
  }

  /* On-policy SARSA update: bootstrap with the ACTUAL next action a'. */
  function update(Q, stateIdx, a, r, stateNextIdx, aNext, alpha, gamma, terminal) {
    const aIdx = ACTIONS.indexOf(a);
    const baseS = stateIdx * A;
    const qSA = Q[baseS + aIdx];
    let target;
    if (terminal) {
      target = r;
    } else {
      const aNextIdx = ACTIONS.indexOf(aNext);
      target = r + gamma * Q[stateNextIdx * A + aNextIdx];
    }
    const tdErr = target - qSA;
    Q[baseS + aIdx] = qSA + alpha * tdErr;
    return tdErr;
  }

  /* Max Q over the legal levers at a state (for the off-policy bootstrap). */
  function maxLegalQ(Q, stateIdx) {
    const L = legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity;
    for (const a of L) if (Q[base + a] > m) m = Q[base + a];
    return m === -Infinity ? 0 : m;
  }

  /* Off-policy Q-learning update: bootstrap with the GREEDY next value. Kept
     for completeness and the on-policy nuance shown in scene 11; the headline
     learner is on-policy SARSA (which here converges to Q* under GLIE). */
  function qLearningUpdate(Q, stateIdx, a, r, stateNextIdx, alpha, gamma, terminal) {
    const aIdx = ACTIONS.indexOf(a);
    const baseS = stateIdx * A;
    const qSA = Q[baseS + aIdx];
    const target = terminal ? r : (r + gamma * maxLegalQ(Q, stateNextIdx));
    const tdErr = target - qSA;
    Q[baseS + aIdx] = qSA + alpha * tdErr;
    return tdErr;
  }

  function snapshot(Q) {
    const out = new Array(Q.length);
    for (let i = 0; i < Q.length; i++) out[i] = Math.round(Q[i] * 10000) / 10000;
    return out;
  }
  function fromSnapshot(arr) {
    if (arr instanceof Float32Array) return arr;
    if (Array.isArray(arr)) return Float32Array.from(arr);
    return new Float32Array(N * A);
  }

  /* Greedy policy from a learned Q. Ties break toward the EARLIER lever (to
     match the DP greedy). A state whose Q-values are all exactly 0 (never
     visited) is left null. */
  function argmaxPolicy(Q) {
    const out = new Array(N);
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let m = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Q[base + a] !== 0) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }   // strict > : earlier lever wins ties
      }
      out[s] = allZero ? null : ACTIONS[k];
    }
    return out;
  }

  window.SARSA = {
    ACTIONS, A, N,
    makeQ, idx, row, legalIdxs, argmaxQ, maxLegalQ,
    pickEpsGreedy, update, qLearningUpdate, snapshot, fromSnapshot, argmaxPolicy,
  };
})();

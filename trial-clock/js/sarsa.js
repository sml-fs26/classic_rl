/* SARSA primitives for the 25-state, 3-action Trial Clock MDP.
 *
 *   Q-table: 25 (tier, day) cells x 3 levers (nudge / nothing / push) = 75
 *   values, indexed as stateIdx * 3 + leverIdx, stateIdx = tier * 5 + (day-1).
 *   Reward model: -1 per NUDGE, +20 on CONVERT, -5 on ABANDON, 0 otherwise.
 *   gamma = 1. The SARSA update at a terminal drops the bootstrap (the trial
 *   ended: CONVERT / ABANDON / EXPIRY).
 *
 *   Every lever is legal in every cell, so the legal set is always all three;
 *   there are no clamped cells to skip. (legalIdxs is kept for interface
 *   parity with the reused engine and always returns [0,1,2].)
 *
 *   THIS MDP USES ON-POLICY SARSA as its model-free learner. Because days-left
 *   is part of the state (so the finite horizon is fully observed) and the
 *   reward gaps are clean, on-policy SARSA with a Robbins-Monro decaying step
 *   size converges to the SAME optimal staircase that DP gives, verified
 *   25/25 across many seeds in the precompute. (Off-policy Q-learning's update
 *   is kept below for completeness / a future side-by-side, but the headline
 *   learner here is SARSA, matching most gallery siblings.)
 *
 *   Used by both the runtime (the SARSA scene) and the precompute (which mirrors
 *   the algorithm in Node for offline training). Reads window.Moves (aliased to
 *   window.Levers) and window.Trial. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;       // [nudge, nothing, push]
  const A = ACTIONS.length;                     // 3
  const N = window.Bellman.N;                   // 25
  const G = window.Trial;

  function makeQ() { return new Float32Array(N * A); }
  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  /* Legal action INDICES at a given state index. Every lever is always legal
     in this MDP, so this is always [0, 1, 2]. */
  function legalIdxs(_stateIdx) { return [0, 1, 2]; }

  /* Greedy over the (always all) legal levers. Ties broken toward the FIRST
     lever (ACTIONS order + `>=` collecting exact ties for a fair random pick),
     matching the DP tie-break; there are no exact ties in the optimal solution. */
  function argmaxQ(Q, stateIdx, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity, best = L[0];
    for (const a of L) { if (Q[base + a] >= m) { m = Q[base + a]; best = a; } }
    const ties = [];
    for (const a of L) if (Q[base + a] === m) ties.push(a);
    const k = ties.length <= 1 ? 0 : Math.floor((rng ? rng() : Math.random()) * ties.length);
    return ACTIONS[ties.length ? ties[k] : best];
  }

  function pickEpsGreedy(Q, stateIdx, eps, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    if (L.length === 0) return ACTIONS[0];
    if (eps > 0 && rng() < eps) return ACTIONS[L[Math.floor(rng() * L.length)]];
    return argmaxQ(Q, stateIdx, rng, L);
  }

  /* On-policy SARSA update: bootstrap with the ACTUAL next lever a'. This is the
     headline learner for this MDP. */
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

  /* Max Q over the (always all) legal levers at a state (for the off-policy
     bootstrap, kept for completeness). */
  function maxLegalQ(Q, stateIdx) {
    const L = legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity;
    for (const a of L) if (Q[base + a] > m) m = Q[base + a];
    return m === -Infinity ? 0 : m;
  }

  /* Off-policy Q-learning update: bootstrap with the GREEDY next value. Not the
     headline learner here (SARSA already recovers the optimal staircase), but
     kept so a future variant can show the on-policy / off-policy contrast. */
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

  /* Greedy policy from a learned Q. A cell whose Q-values are all exactly 0
     (never visited) is left null. */
  function argmaxPolicy(Q) {
    const out = new Array(N);
    for (let s = 0; s < N; s++) {
      const L = legalIdxs(s);
      const base = s * A;
      let m = -Infinity, k = L[0], allZero = true;
      for (const a of L) {
        if (Q[base + a] !== 0) allZero = false;
        if (Q[base + a] >= m) { m = Q[base + a]; k = a; }
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

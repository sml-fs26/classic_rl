/* TD-control primitives for the 23-state, 4-action Windy Treasure Cave MDP.
 *
 *   Q-table: 23 non-terminal tiles x 4 headings = 92 values, indexed as
 *   stateIdx * 4 + actionIdx (stateIdx from window.Cave.stateIndex, row-major
 *   over the playable tiles). Reward model: -1 per ordinary step, +10 / -10 on
 *   the step that lands on gold / pit. gamma = 1. The TD update at a terminal
 *   drops the bootstrap (target = r).
 *
 *   All four headings are always legal in the cave, so eps-greedy ranges over
 *   the full action set at every tile (no clamping, unlike the Gambler ladder).
 *
 *   This file is used by both the runtime (the model-free scene) and the
 *   precompute (which mirrors the algorithm in Node for offline training).
 *   It carries BOTH classic updates so scene 11 can teach the on-policy /
 *   off-policy split:
 *     - update()         on-policy SARSA: bootstrap on the ACTUAL next action a'
 *     - qLearningUpdate() off-policy Q-learning: bootstrap on max_a' Q(s',a')
 *
 *   Reads window.Moves (aliased to window.Actions) and window.Cave. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;       // [UP, DOWN, LEFT, RIGHT]
  const A = ACTIONS.length;                     // 4
  const N = window.Bellman.N;                   // 23
  const C = window.Cave;

  function makeQ() { return new Float32Array(N * A); }
  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  /* All action indices are legal at every tile. */
  function legalIdxs(_stateIdx) {
    const out = [];
    for (let a = 0; a < A; a++) out.push(a);
    return out;
  }

  /* Greedy over all headings. Random tie-break among exact ties (keeps the
     learning unbiased; the DP oracle owns the deterministic display tie-break). */
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

  /* Max Q over all headings at a state (for the off-policy bootstrap). */
  function maxLegalQ(Q, stateIdx) {
    const base = stateIdx * A;
    let m = -Infinity;
    for (let a = 0; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
    return m === -Infinity ? 0 : m;
  }

  /* Off-policy Q-learning update: bootstrap with max_{a'} Q(s', a'). */
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

  /* Greedy policy from a learned Q. A tile whose Q row is all exactly 0 (never
     visited) is left null. */
  function argmaxPolicy(Q) {
    const out = new Array(N);
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let m = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
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

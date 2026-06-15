/* SARSA primitives for the Snakes & Ladders MDP.
 *
 *   Q-table: 100 squares × 3 dice = 300 values, indexed as (s-1)*3 + dieIdx.
 *   Reward model: -1 per non-terminal step, 0 at terminal (s=100). The SARSA
 *   update at terminal drops the bootstrap term.
 *
 *   ε-greedy over Q(s, ·). Action set: ['d4', 'd6', 'd8'].
 *
 *   This file is used by both the runtime (scene 4) and the precompute (which
 *   mirrors the algorithm in Node for offline training). Keeping them in sync
 *   is mandatory, the precompute writes the data that scene 4 reads back.
 */
(function () {
  const ACTIONS = (window.Dice && window.Dice.DIE_IDS) || ['d4', 'd6', 'd8'];
  const A = ACTIONS.length;

  function makeQ() { return new Float32Array(100 * A); }

  function idx(s, aIdx) {
    return (s - 1) * A + aIdx;
  }

  function get(Q, s, a) {
    return Q[idx(s, ACTIONS.indexOf(a))];
  }

  function row(Q, s) {
    const base = (s - 1) * A;
    return { d4: Q[base], d6: Q[base + 1], d8: Q[base + 2] };
  }

  function maxQ(Q, s) {
    const base = (s - 1) * A;
    let m = Q[base];
    for (let a = 1; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
    return m;
  }

  function argmaxQ(Q, s, rng) {
    const base = (s - 1) * A;
    let m = Q[base];
    for (let a = 1; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
    const ties = [];
    for (let a = 0; a < A; a++) if (Q[base + a] === m) ties.push(a);
    const k = ties.length === 1 ? 0 : Math.floor((rng ? rng() : Math.random()) * ties.length);
    return ACTIONS[ties[k]];
  }

  function pickEpsGreedy(Q, s, eps, rng) {
    if (rng() < eps) return ACTIONS[Math.floor(rng() * A)];
    return argmaxQ(Q, s, rng);
  }

  function update(Q, s, a, r, sNext, aNext, alpha, gamma, terminal) {
    const aIdx = ACTIONS.indexOf(a);
    const baseS = (s - 1) * A;
    const qSA = Q[baseS + aIdx];
    let target;
    if (terminal) {
      target = r;
    } else {
      const baseSNext = (sNext - 1) * A;
      const aNextIdx = ACTIONS.indexOf(aNext);
      target = r + gamma * Q[baseSNext + aNextIdx];
    }
    const tdErr = target - qSA;
    Q[baseS + aIdx] = qSA + alpha * tdErr;
    return tdErr;
  }

  /* Snapshot Q (typed array) into a plain array of plain numbers. */
  function snapshot(Q) {
    const out = new Array(Q.length);
    for (let i = 0; i < Q.length; i++) out[i] = Math.round(Q[i] * 10000) / 10000;
    return out;
  }

  function fromSnapshot(arr) {
    if (arr instanceof Float32Array) return arr;
    if (Array.isArray(arr)) return Float32Array.from(arr);
    return new Float32Array(100 * A);
  }

  window.SARSA = {
    ACTIONS, A,
    makeQ, idx, get, row, maxQ, argmaxQ,
    pickEpsGreedy, update, snapshot, fromSnapshot,
  };
})();

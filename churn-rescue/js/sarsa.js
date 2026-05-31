/* SARSA primitives for the 25-state, 3-action Churn Rescue MDP.
 *
 *   Q-table: 25 states (tier x months-left) x 3 levers = 75 values,
 *   indexed as stateIdx * 3 + leverIdx (leverIdx order: nothing,
 *   checkin, offer). Reward model: -cost per month (0 / -1 / -4), plus
 *   the terminal lump (+20 RENEWED, -20 CHURNED). The SARSA update at a
 *   terminal drops the bootstrap term. gamma = 1.
 *
 *   epsilon-greedy over Q(s, .). Action set: MOVE_IDS = the three levers
 *   (aliased from window.Levers via window.Moves).
 *
 *   This file is used by both the runtime (scene 11) and the precompute
 *   (which mirrors the algorithm in Node for offline training).
 */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;
  const A = ACTIONS.length;
  const N = window.Bellman.N;

  function makeQ() { return new Float32Array(N * A); }

  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  function maxQ(Q, stateIdx) {
    const base = stateIdx * A;
    let m = Q[base];
    for (let a = 1; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
    return m;
  }

  function argmaxQ(Q, stateIdx, rng) {
    const base = stateIdx * A;
    let m = Q[base];
    for (let a = 1; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
    const ties = [];
    for (let a = 0; a < A; a++) if (Q[base + a] === m) ties.push(a);
    const k = ties.length === 1 ? 0 : Math.floor((rng ? rng() : Math.random()) * ties.length);
    return ACTIONS[ties[k]];
  }

  function pickEpsGreedy(Q, stateIdx, eps, rng) {
    if (rng() < eps) return ACTIONS[Math.floor(rng() * A)];
    return argmaxQ(Q, stateIdx, rng);
  }

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

  function argmaxPolicy(Q) {
    const out = new Array(N);
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let m = Q[base], k = 0;
      for (let a = 1; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      let allZero = true;
      for (let a = 0; a < A; a++) if (Q[base + a] !== 0) { allZero = false; break; }
      out[s] = allZero ? null : ACTIONS[k];
    }
    return out;
  }

  window.SARSA = {
    ACTIONS, A, N,
    makeQ, idx, row, maxQ, argmaxQ,
    pickEpsGreedy, update, snapshot, fromSnapshot, argmaxPolicy,
  };
})();

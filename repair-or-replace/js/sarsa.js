/* SARSA primitives for the 4-state, 3-action Repair-or-Replace MDP.
 *
 *   Q-table: 4 states × 3 actions = 12 values, indexed stateIdx * 3 + actionIdx.
 *   Continuing task (no terminals), discounted at gamma = 0.9; the update
 *   always bootstraps on Q(s', a').
 *
 *   ε-greedy over Q(s, ·). Action set: MOVE_IDS = RUN / SERVICE / REPLACE.
 *
 *   Used by the SARSA scene to learn the three bands from experience, with
 *   no model of the breakdown odds.
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
      let m = Q[base], k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Q[base + a] !== 0) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      }
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

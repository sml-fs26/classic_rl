/* SARSA primitives for the 9-state, 3-lever Critical Spare MDP.
 *
 *   Q-table: 9 states (health x spares) x 3 levers = 27 values, indexed
 *   stateIdx * 3 + leverIdx (stateIdx = health * 3 + spares; leverIdx in the
 *   order window.Levers.LEVER_IDS = [run, order, replace], the same order
 *   window.Bellman.qFromV / window.DATA.Qstar use).
 *
 *   gamma = 0.9, no terminal states (the SARSA episode is a fixed-length
 *   rollout; a long horizon makes the truncation negligible at gamma=0.9).
 *
 *   e-greedy is taken over the LEGAL levers only: REPLACE is proposed only when
 *   a spare is on hand (window.Machine.availableLeverIds). The agent never
 *   proposes a clamped lever, so the learned Q on illegal cells stays at its
 *   init value (rendered unavailable, matching DP).
 *
 *   Used by both the runtime (the SARSA scene) and the precompute (which mirrors
 *   the algorithm in Node for offline training). Reads window.Moves (aliased to
 *   window.Levers) and window.Machine.
 *
 *   NOTE on the model-free choice: on THIS MDP the optimal policy is decisive
 *   (e.g. ORDER beats RUN by ~0.75 at (AGING, 0 spares); REPLACE clearly beats
 *   RUN with a spare in hand), so ON-POLICY SARSA, with a GLIE-annealed
 *   epsilon and a Robbins-Monro step size, converges to the exact DP optimal
 *   policy on ALL 9 states, robust across seeds (verified in the precompute).
 *   So the headline learner here is genuinely SARSA (unlike the Gambler's-Ruin
 *   cartridge, whose tiny Q-gaps forced the off-policy split). The off-policy
 *   qLearningUpdate is kept for parity / an optional contrast. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;       // [run, order, replace]
  const A = ACTIONS.length;                     // 3
  const N = window.Bellman.N;                   // 9
  const M = window.Machine;

  function makeQ() { return new Float32Array(N * A); }
  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  /* Legal lever INDICES at a given state index. */
  function legalIdxs(stateIdx) {
    const st = M.stateFromIndex(stateIdx);
    const ids = M.availableLeverIds(st);
    const out = [];
    for (const id of ids) out.push(ACTIONS.indexOf(id));
    return out;
  }

  /* Greedy over the legal levers only. Ties break toward the LATER lever
     (ACTIONS order [run,order,replace] + `>=`), matching the DP tie-break, but
     we also collect exact ties for a fair random break so learning stays
     unbiased. */
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
    if (L.length === 0) return ACTIONS[0];        // should never happen
    if (eps > 0 && rng() < eps) return ACTIONS[L[Math.floor(rng() * L.length)]];
    return argmaxQ(Q, stateIdx, rng, L);
  }

  /* On-policy SARSA update: bootstrap with the ACTUAL next lever a'. This is the
     headline learner the runtime + precompute use. */
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

  /* Max Q over the LEGAL levers at a state (for the off-policy bootstrap). */
  function maxLegalQ(Q, stateIdx) {
    const L = legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity;
    for (const a of L) if (Q[base + a] > m) m = Q[base + a];
    return m === -Infinity ? 0 : m;
  }

  /* Off-policy Q-learning update: bootstrap with the GREEDY next value. Kept for
     parity / an optional live contrast; not the headline learner here. */
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

  /* Greedy policy from a learned Q, restricted to legal levers. A state whose
     legal Q-values are all exactly 0 (never visited) is left null. */
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

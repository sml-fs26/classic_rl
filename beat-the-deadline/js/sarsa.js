/* TD-control primitives for the 25-state, 2-action Beat-the-Deadline MDP.
 *
 *   Q-table: 25 states (p,h) x 2 levers (WAIT, SEND) = 50 values, indexed as
 *   stateIdx * 2 + actionIdx, with stateIdx = p*5 + h (window.Dock.stateIndex)
 *   and actionIdx in window.Actions.ACTION_IDS order [wait, send].
 *   Reward model lives in window.Dock (SEND pays 5*min(p,4)-10 on-time / -10
 *   late; a blown WAIT pays -5p; an empty dock pays 0). gamma = 1. The update
 *   at a terminal drops the bootstrap.
 *
 *   eps-greedy is taken over the LEGAL levers only: at (p,h), WAIT is legal
 *   iff h >= 1 and SEND iff p >= 1 (window.Dock.availableActionIds). The agent
 *   never proposes a clamped lever, so the learned Q on illegal cells stays at
 *   its init value (we render those cells unavailable, matching DP).
 *
 *   This file ships BOTH classic TD-control updates so scene 11 can teach the
 *   on-policy / off-policy split honestly (see CLAUDE.md):
 *     update()          on-policy SARSA: bootstrap on the ACTUAL next lever a'.
 *     qLearningUpdate() off-policy Q-learning: bootstrap on the BEST next lever.
 *
 *   Used by both the runtime (the TD scene) and the precompute (which mirrors
 *   the algorithm in Node). Reads window.Moves (aliased to window.Actions),
 *   window.Dock, and window.Bellman. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;       // [wait, send]
  const A = ACTIONS.length;                     // 2
  const N = window.Bellman.N;                   // 25
  const D = window.Dock;
  const NH = D.NH;                              // 5

  function makeQ() { return new Float32Array(N * A); }
  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  /* Legal action INDICES at a given state index (p = floor/NH, h = mod NH). */
  function legalIdxs(stateIdx) {
    const p = Math.floor(stateIdx / NH);
    const h = stateIdx % NH;
    const ids = D.availableActionIds(p, h);
    const out = [];
    for (const id of ids) out.push(ACTIONS.indexOf(id));
    return out;
  }

  /* Greedy over the legal levers only. Ties broken toward SEND (the safe
     lever, the LAST id in ACTIONS) via `>=`, matching the DP tie-break (the
     only Q* tie, at (4,4), resolves to SEND). */
  function argmaxQ(Q, stateIdx, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    const base = stateIdx * A;
    if (L.length === 0) return ACTIONS[0];
    let m = -Infinity, best = L[0];
    for (const a of L) { if (Q[base + a] >= m) { m = Q[base + a]; best = a; } }
    return ACTIONS[best];
  }

  function pickEpsGreedy(Q, stateIdx, eps, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    if (L.length === 0) return ACTIONS[0];        // empty-dock corner; harmless
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

  /* Max Q over the LEGAL levers at a state (for the off-policy bootstrap). */
  function maxLegalQ(Q, stateIdx) {
    const L = legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity;
    for (const a of L) if (Q[base + a] > m) m = Q[base + a];
    return m === -Infinity ? 0 : m;
  }

  /* Off-policy Q-learning update: bootstrap with the GREEDY next value
     max_{a' legal} Q(s', a'). This is the learner the runtime + precompute use
     as the headline, because it converges to the OPTIMAL diagonal regardless
     of the exploration rate. On-policy SARSA (update() above) learns the value
     of the eps-soft policy it follows; on the thin-order (p=1) cells the WAIT/
     SEND gaps are tiny and a stray exploratory WAIT genuinely strands the
     load, so SARSA leans CAUTIOUS (ships a touch earlier than DP) there. That
     cautious-vs-optimal contrast is itself the teaching point; see the TD
     scene + CLAUDE.md. */
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

  /* Greedy policy from a learned Q, restricted to legal levers. A decision
     state (p>=1, h>=1) whose legal Q-values are all exactly 0 (never visited)
     is left null. Non-decision states (p=0, or h=0 forced SEND) are not part
     of the learned-policy comparison. */
  function argmaxPolicy(Q) {
    const out = new Array(N);
    for (let s = 0; s < N; s++) {
      const L = legalIdxs(s);
      if (L.length === 0) { out[s] = null; continue; }
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

/* SARSA primitives for the 9-state, 3-action Gambler's Ruin MDP.
 *
 *   Q-table: 9 capital rungs ($1..$9) x 3 stakes ($1/$2/$3) = 27 values,
 *   indexed as stateIdx * 3 + stakeIdx (stateIdx = capital - 1).
 *   Reward model: 0 on every step except +1 on the flip that lands exactly
 *   on $10. gamma = 1. The SARSA update at a terminal drops the bootstrap.
 *
 *    e-greedy is taken over the LEGAL stakes only: at capital c a stake a is
 *   legal iff a <= c and a <= 10 - c (window.Gambler.availableStakeIds). The
 *   agent never proposes a clamped bet, so the learned Q on illegal cells
 *   stays at its init value (we render those cells unavailable, matching DP).
 *
 *   This file is used by both the runtime (the SARSA scene) and the
 *   precompute (which mirrors the algorithm in Node for offline training).
 *   Reads window.Moves (aliased to window.Stakes) and window.Gambler. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;       // [bet1, bet2, bet3]
  const A = ACTIONS.length;                     // 3
  const N = window.Bellman.N;                   // 9
  const G = window.Gambler;

  function makeQ() { return new Float32Array(N * A); }
  function idx(stateIdx, aIdx) { return stateIdx * A + aIdx; }

  function row(Q, stateIdx) {
    const base = stateIdx * A;
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[base + a];
    return r;
  }

  /* Legal action INDICES at a given state index (capital = stateIdx + 1). */
  function legalIdxs(stateIdx) {
    const cap = stateIdx + 1;
    const ids = G.availableStakeIds(cap);
    const out = [];
    for (const id of ids) out.push(ACTIONS.indexOf(id));
    return out;
  }

  /* Greedy over the legal stakes only. Ties broken toward the larger stake
     (ACTIONS ascending + `>=`), matching the DP tie-break. */
  function argmaxQ(Q, stateIdx, rng, legals) {
    const L = legals || legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity, best = L[0];
    for (const a of L) { if (Q[base + a] >= m) { m = Q[base + a]; best = a; } }
    /* collect exact ties for a fair random break (keeps learning unbiased) */
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

  /* Max Q over the LEGAL stakes at a state (for the off-policy bootstrap). */
  function maxLegalQ(Q, stateIdx) {
    const L = legalIdxs(stateIdx);
    const base = stateIdx * A;
    let m = -Infinity;
    for (const a of L) if (Q[base + a] > m) m = Q[base + a];
    return m === -Infinity ? 0 : m;
  }

  /* Off-policy Q-learning update: bootstrap with the GREEDY next value
     max_{a' legal} Q(s', a'). This is the learner the runtime + precompute
     use, because it converges to the OPTIMAL (bold-middle) policy regardless
     of the exploration rate. On-policy SARSA (update() above) instead learns
     the value of the eps-soft policy it follows, which on this rigged-coin
     MDP genuinely favors timid bets (exploration occasionally derails a bold
     run), so it does NOT recover the bold middle. That contrast (cautious
     on-policy vs optimal off-policy) is itself a teaching point; see the
     SARSA scene + CLAUDE.md. */
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

  /* Greedy policy from a learned Q, restricted to legal stakes. A state whose
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

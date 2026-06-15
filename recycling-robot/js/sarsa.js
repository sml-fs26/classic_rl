/* Model-free TD control for the finite-horizon Recycling Robot MDP.
 *
 *   Because this is a FINITE-HORIZON problem (the optimal action can depend on
 *   steps-remaining), the learned Q-table is indexed by (battery rung, steps
 *   remaining k, lever):
 *
 *       Q[ (stateIdx * SHIFT + (k-1)) * A + leverIdx ]
 *
 *   with stateIdx = battery level - 1 (low=0..full=3), k in 1..SHIFT, leverIdx
 *   in window.Moves.MOVE_IDS order [search, wait, recharge]. A row Q[s,k,*] is
 *   the three lever values with k steps left in the shift.
 *
 *   Two classic updates live here, used SIDE BY SIDE in scene 11 to teach the
 *   on-policy / off-policy split honestly:
 *
 *     - On-policy SARSA (update): bootstrap with the ACTUAL next lever a'. On
 *       this MDP it learns the value of the eps-soft policy it follows and, at
 *       the marginal `high` rung (SEARCH 15.44 vs WAIT 14.89, gap 0.55), it
 *       turns CAUTIOUS -- an exploratory misstep from high can cascade toward
 *       stranding, so the on-policy value of SEARCH-at-high is pulled below the
 *       safe levers. SARSA therefore does NOT recover the DP-optimal policy.
 *
 *     - Off-policy Q-learning (qLearningUpdate): bootstrap with the GREEDY next
 *       value max_a' Q(s', k-1, a'). It learns the value of optimal play
 *       regardless of exploration and converges to the DP oracle exactly.
 *
 *   This file is used by both the runtime (the TD scene) and the precompute
 *   (which mirrors the algorithm in Node). Reads window.Moves (aliased to
 *   window.Levers) and window.Robot. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;        // [search, wait, recharge]
  const A = ACTIONS.length;                      // 3
  const N = window.Bellman.N;                    // 4 playable rungs
  const SHIFT = window.Robot.SHIFT;              // 8
  const R = window.Robot;

  /* Q is a flat Float32Array of length N * SHIFT * A. */
  function makeQ() { return new Float32Array(N * SHIFT * A); }
  function base(stateIdx, k) { return (stateIdx * SHIFT + (k - 1)) * A; }
  function idx(stateIdx, k, aIdx) { return base(stateIdx, k) + aIdx; }

  /* The three lever values at (stateIdx, k). */
  function row(Q, stateIdx, k) {
    const b = base(stateIdx, k);
    const r = {};
    for (let a = 0; a < A; a++) r[ACTIONS[a]] = Q[b + a];
    return r;
  }

  /* Greedy lever at (stateIdx, k). Strict >, ties keep search>wait>recharge
     to match the DP tie-break. rng only used to break EXACT ties fairly. */
  function argmaxQ(Q, stateIdx, k, rng) {
    const b = base(stateIdx, k);
    let m = -Infinity, best = 0;
    for (let a = 0; a < A; a++) { if (Q[b + a] > m) { m = Q[b + a]; best = a; } }
    const ties = [];
    for (let a = 0; a < A; a++) if (Q[b + a] === m) ties.push(a);
    if (ties.length <= 1) return ACTIONS[best];
    const j = Math.floor((rng ? rng() : Math.random()) * ties.length);
    return ACTIONS[ties[j]];
  }

  function pickEpsGreedy(Q, stateIdx, k, eps, rng) {
    if (eps > 0 && rng() < eps) return ACTIONS[Math.floor(rng() * A)];
    return argmaxQ(Q, stateIdx, k, rng);
  }

  /* Max Q over levers at (stateIdx, k) -- the off-policy bootstrap. */
  function maxQ(Q, stateIdx, k) {
    const b = base(stateIdx, k);
    let m = -Infinity;
    for (let a = 0; a < A; a++) if (Q[b + a] > m) m = Q[b + a];
    return m;
  }

  /* On-policy SARSA update. The bootstrap uses the ACTUAL next lever aNext at
     (stateNextIdx, kNext). `terminal` true => no future (stranded OR shift
     over), so the target is just r. */
  function update(Q, stateIdx, k, a, r, stateNextIdx, kNext, aNext, alpha, gamma, terminal) {
    const aIdx = ACTIONS.indexOf(a);
    const b = base(stateIdx, k);
    const qSA = Q[b + aIdx];
    let target;
    if (terminal) {
      target = r;
    } else {
      const aNextIdx = ACTIONS.indexOf(aNext);
      target = r + gamma * Q[base(stateNextIdx, kNext) + aNextIdx];
    }
    const tdErr = target - qSA;
    Q[b + aIdx] = qSA + alpha * tdErr;
    return tdErr;
  }

  /* Off-policy Q-learning update. The bootstrap uses the GREEDY next value. */
  function qLearningUpdate(Q, stateIdx, k, a, r, stateNextIdx, kNext, alpha, gamma, terminal) {
    const aIdx = ACTIONS.indexOf(a);
    const b = base(stateIdx, k);
    const qSA = Q[b + aIdx];
    const target = terminal ? r : (r + gamma * maxQ(Q, stateNextIdx, kNext));
    const tdErr = target - qSA;
    Q[b + aIdx] = qSA + alpha * tdErr;
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
    return makeQ();
  }

  /* Greedy policy at a chosen steps-remaining k (default the start of shift):
     one lever per rung. A rung whose Q row is all-zero (never visited) is left
     null so the scene can show it "unsolved". */
  function argmaxPolicyAtK(Q, k) {
    const kk = k == null ? SHIFT : k;
    const out = new Array(N);
    for (let s = 0; s < N; s++) {
      const b = base(s, kk);
      let m = -Infinity, best = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Q[b + a] !== 0) allZero = false;
        if (Q[b + a] > m) { m = Q[b + a]; best = a; }
      }
      out[s] = allZero ? null : ACTIONS[best];
    }
    return out;
  }

  /* The 4x3 Q layer at steps-remaining k, flattened [stateIdx*A + leverIdx],
     for the gauge widget (which expects a single N*A table). */
  function layerAtK(Q, k) {
    const kk = k == null ? SHIFT : k;
    const out = new Float32Array(N * A);
    for (let s = 0; s < N; s++) {
      const b = base(s, kk);
      for (let a = 0; a < A; a++) out[s * A + a] = Q[b + a];
    }
    return out;
  }

  window.SARSA = {
    ACTIONS, A, N, SHIFT,
    makeQ, base, idx, row, argmaxQ, maxQ,
    pickEpsGreedy, update, qLearningUpdate, snapshot, fromSnapshot,
    argmaxPolicyAtK, layerAtK,
  };
})();

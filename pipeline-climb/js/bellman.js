/* Value iteration over the 9-state Pokemon battle MDP.
 *
 *   V(s) = max_a { Σ p(s'|s,a) · [ R(s,a,s') + γ · V(s') ] }    for s non-terminal
 *   V(WIN)  = 0   (absorbing; reward was already paid on entry)
 *   V(LOSS) = 0
 *
 * Synchronous backups; 9 states; cap at 100 iters; tol 1e-4. The reward is
 * baked into successors (-1 per step, +10 win, -10 loss) so the backup is
 * just max_a Σ p · (r + γ · V(s')). */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;
  const N = STATES.length;       // 9
  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;     // 4

  function makeV() { return new Float64Array(N); }

  function bellmanSweep(V, gamma) {
    const Vnew = new Float64Array(N);
    let maxDelta = 0;
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity;
      for (const m of MOVE_IDS) {
        const succ = window.Battle.successorsFromBuckets(s, m);
        let q = 0;
        for (const { sNext, p, reward } of succ) {
          let vNext = 0;
          if (!sNext.terminal) {
            vNext = V[window.Battle.stateIndex(sNext)];
          }
          q += p * (reward + gamma * vNext);
        }
        if (q > best) best = q;
      }
      Vnew[i] = best;
      const d = Math.abs(Vnew[i] - V[i]);
      if (d > maxDelta) maxDelta = d;
    }
    return { Vnew, maxDelta };
  }

  function valueIteration(gamma, opts) {
    const o = opts || {};
    const tol = o.tol != null ? o.tol : 1e-4;
    const maxIters = o.maxIters || 100;
    const recordHistory = o.recordHistory !== false;

    let V = makeV();
    const history = [];
    if (recordHistory) history.push({ iter: 0, maxDelta: Infinity, V: Array.from(V) });

    let iters = 0;
    for (let k = 1; k <= maxIters; k++) {
      const { Vnew, maxDelta } = bellmanSweep(V, gamma);
      V = Vnew;
      iters = k;
      if (recordHistory) history.push({ iter: k, maxDelta, V: Array.from(V) });
      if (maxDelta < tol) break;
    }

    const policy = greedyPolicy(V, gamma);
    return { V, policy, iters, history };
  }

  function greedyPolicy(V, gamma) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity, bestM = MOVE_IDS[0];
      for (const m of MOVE_IDS) {
        const succ = window.Battle.successorsFromBuckets(s, m);
        let q = 0;
        for (const { sNext, p, reward } of succ) {
          let vNext = 0;
          if (!sNext.terminal) vNext = V[window.Battle.stateIndex(sNext)];
          q += p * (reward + gamma * vNext);
        }
        if (q > best) { best = q; bestM = m; }
      }
      out[i] = bestM;
    }
    return out;
  }

  function qFromV(V, gamma) {
    /* 9 × 4 Q-table, indexed [stateIdx * 4 + moveIdx]. */
    const Q = new Float64Array(N * A);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      for (let ai = 0; ai < A; ai++) {
        const m = MOVE_IDS[ai];
        const succ = window.Battle.successorsFromBuckets(s, m);
        let q = 0;
        for (const { sNext, p, reward } of succ) {
          let vNext = 0;
          if (!sNext.terminal) vNext = V[window.Battle.stateIndex(sNext)];
          q += p * (reward + gamma * vNext);
        }
        Q[i * A + ai] = q;
      }
    }
    return Q;
  }

  function policyDiff(p1, p2) {
    let n = 0;
    for (let i = 0; i < N; i++) if (p1[i] !== p2[i]) n++;
    return n;
  }

  function movesUsed(policy) {
    const set = new Set();
    for (let i = 0; i < N; i++) set.add(policy[i]);
    return set.size;
  }

  function moveFrequencies(policy) {
    const c = {};
    for (const m of MOVE_IDS) c[m] = 0;
    for (let i = 0; i < N; i++) c[policy[i]] = (c[policy[i]] || 0) + 1;
    return c;
  }

  window.Bellman = {
    STATES, N, MOVE_IDS, A,
    bellmanSweep, valueIteration, greedyPolicy,
    qFromV, policyDiff, movesUsed, moveFrequencies,
  };
})();

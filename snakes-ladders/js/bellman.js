/* Value iteration on the Snakes & Ladders MDP.
 *
 *   V(s) = max_d { -1 + γ · E_{r ~ d}[V(s')] }   for s ≠ 100
 *   V(100) = 0
 *
 *   `s'` is the post-jump destination after rolling die `d` from state `s`,
 *   handling overshoot. Action set: {d4, d6, d8}.
 *
 *   Because S&L has cycles (snakes), the recursion is not unfoldable in one
 *   sweep, we iterate until max-|ΔV| < tol or iter == maxIters. This is the
 *   real lesson Spooky House couldn't carry.
 */
(function () {
  const DIE_IDS = (window.Dice && window.Dice.DIE_IDS) || ['d4', 'd6', 'd8'];

  /* One Bellman sweep over all 100 squares. Returns { Vnew, maxDelta }. */
  function bellmanSweep(V, gamma) {
    const Vnew = new Float64Array(101);
    let maxDelta = 0;
    /* Terminal V(100) = 0 stays. */
    for (let s = 1; s <= 99; s++) {
      let best = -Infinity;
      for (const d of DIE_IDS) {
        const successors = window.MDP.successors(s, d);
        let expV = 0;
        for (const { sNext, p } of successors) {
          expV += p * V[sNext];
        }
        const q = -1 + gamma * expV;
        if (q > best) best = q;
      }
      Vnew[s] = best;
      const delta = Math.abs(Vnew[s] - V[s]);
      if (delta > maxDelta) maxDelta = delta;
    }
    return { Vnew, maxDelta };
  }

  /* Full value iteration. Returns:
       { V, policy, iters, history } where history[i] = { iter, maxDelta, V }.
     The history array is full-length so the scrubber in scene 2 can replay
     the sweep. Iterations are capped at maxIters; convergence at tol. */
  function valueIteration(gamma, opts) {
    const o = opts || {};
    const tol = o.tol != null ? o.tol : 1e-4;
    const maxIters = o.maxIters || 200;
    const recordHistory = o.recordHistory !== false;

    let V = new Float64Array(101);
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

  /* For a converged V, compute the argmax die at each square (and per-square
     Q-row for the slider scene). Returns { policy: number→dieId,
     Q: number→{d4, d6, d8} }. */
  function greedyPolicy(V, gamma) {
    const policy = {};
    const Q = {};
    for (let s = 1; s <= 99; s++) {
      let best = -Infinity;
      let bestDie = 'd6';
      const qRow = {};
      for (const d of DIE_IDS) {
        const successors = window.MDP.successors(s, d);
        let expV = 0;
        for (const { sNext, p } of successors) expV += p * V[sNext];
        const q = -1 + gamma * expV;
        qRow[d] = q;
        if (q > best) { best = q; bestDie = d; }
      }
      policy[s] = bestDie;
      Q[s] = qRow;
    }
    return { policy, Q };
  }

  /* Count how many squares differ between two policies. Square 100 (terminal)
     is excluded. */
  function policyDiff(p1, p2) {
    let n = 0;
    for (let s = 1; s <= 99; s++) {
      if (p1[s] !== p2[s]) n++;
    }
    return n;
  }

  /* Count how many distinct dice the policy uses. */
  function diceUsed(policy) {
    const used = new Set();
    for (let s = 1; s <= 99; s++) used.add(policy[s]);
    return used.size;
  }

  /* Per-die occupancy of policy. */
  function dieFrequencies(policy) {
    const counts = { d4: 0, d6: 0, d8: 0 };
    for (let s = 1; s <= 99; s++) {
      const d = policy[s];
      if (counts.hasOwnProperty(d)) counts[d]++;
    }
    return counts;
  }

  window.Bellman = {
    bellmanSweep, valueIteration, greedyPolicy,
    policyDiff, diceUsed, dieFrequencies,
  };
})();

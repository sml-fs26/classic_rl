/* Value iteration over the 9-state Critical Spare MDP.
 *
 *   V(s) = max_a { sum_{s'} p(s'|s,a) * [ R(s,a,s') + gamma * V(s') ] }
 *
 *   No terminal states (the operation is ongoing); discount gamma = 0.9 keeps
 *   the fixed point finite and every value single-digit. Synchronous backups,
 *   9 states. The holding cost is already folded into the rewards returned by
 *   window.Machine.successors, so the backup is the plain
 *   max_a sum p * (r + gamma * V(s')).
 *
 *   CLAMPED ACTIONS: window.Machine.successors returns [] for an illegal lever
 *   (REPLACE with an empty bin). An empty successor list scores that action
 *   -Infinity, so it is never the argmax and renders as unavailable. RUN and
 *   ORDER are always legal, so V is always finite.
 *
 *   Engine-agnostic: reads window.Battle (aliased to window.Machine) and
 *   window.Moves (aliased to window.Levers); reused unchanged from the gallery
 *   builds except for the empty-successors -> -Infinity guard. */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;
  const N = STATES.length;       // 9
  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;     // 3

  function makeV() { return new Float64Array(N); }

  /* Q-value of lever m at state s. -Infinity if the lever is clamped. */
  function qValue(s, m, V, gamma) {
    const succ = window.Battle.successorsFromBuckets(s, m);
    if (!succ || succ.length === 0) return -Infinity;
    let q = 0;
    for (const { sNext, p, reward } of succ) {
      let vNext = 0;
      if (!sNext.terminal) vNext = V[window.Battle.stateIndex(sNext)];
      q += p * (reward + gamma * vNext);
    }
    return q;
  }

  function bellmanSweep(V, gamma) {
    const Vnew = new Float64Array(N);
    let maxDelta = 0;
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
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
    const maxIters = o.maxIters || 1000;
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

  /* Greedy policy. Ties break toward the LATER lever in MOVE_IDS order
     [run, order, replace] (iterate with `>=`), so REPLACE wins a RUN tie -- it
     matches the proposal's "spend the protection" grid. (There are in fact no
     exact ties at the fixed point; this only fixes the rule deterministically.) */
  function greedyPolicy(V, gamma) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity, bestM = null;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
        if (q >= best) { best = q; bestM = m; }
      }
      out[i] = bestM;
    }
    return out;
  }

  function qFromV(V, gamma) {
    /* 9 x 3 Q-table, indexed [stateIdx * 3 + moveIdx]. Clamped levers hold
       -Infinity (serialised downstream as null for display). */
    const Q = new Float64Array(N * A);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      for (let ai = 0; ai < A; ai++) {
        Q[i * A + ai] = qValue(s, MOVE_IDS[ai], V, gamma);
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
    qValue, bellmanSweep, valueIteration, greedyPolicy,
    qFromV, policyDiff, movesUsed, moveFrequencies,
  };
})();

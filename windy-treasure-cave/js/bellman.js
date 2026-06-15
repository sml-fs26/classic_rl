/* Value iteration over the 23-state Windy Treasure Cave MDP.
 *
 *   V(s) = max_a { sum_{s'} p(s'|s,a) * [ R(s,a,s') + gamma * V(s') ] }   (s playable)
 *   V(GOLD) = 0, V(PIT) = 0   (absorbing; the +10 / -10 is paid as the reward
 *                              on the transition INTO the terminal, so terminals
 *                              stay 0 here and show up through the reward).
 *
 *   Synchronous backups; 23 non-terminal states; gamma = 1 (every episode
 *   terminates). The reward is baked into successors (-1 for an ordinary step,
 *   or the +10/-10 bonus on the step that lands on gold/pit), so the backup is
 *   max_a sum p * (r + gamma * V(s')).
 *
 *   All four headings are always legal in the cave (a wall just keeps you put),
 *   so unlike the Gambler ladder there are no clamped actions and V is always
 *   finite. The empty-successors -> minus Infinity guard is kept (harmless)
 *   for parity with the shared engine shape.
 *
 *   TIE-BREAK for the optimal policy: at a tile where several headings achieve
 *   the max Q (the cave has a few exact UP==RIGHT ties), prefer the heading
 *   whose INTENDED target tile is closest (Manhattan) to the gold, i.e. the
 *   move that makes progress toward the prize, then a fixed order
 *   UP > RIGHT > DOWN > LEFT. This is a principled, position-aware rule; it
 *   reproduces the proposal's drawn arrow field at every tile that has a unique
 *   argmax, and resolves the genuine ties consistently. (The proposal's hand
 *   drawing makes an arbitrary per-cell choice at the three exact-tie tiles;
 *   both arrows are equally optimal there. See precompute + CLAUDE.md.)
 *
 *   Reads window.Battle (aliased to window.Cave) and window.Moves (aliased to
 *   window.Actions). */
(function () {
  const STATES = window.Battle.NON_TERMINAL_STATES;
  const N = STATES.length;       // 23
  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;     // 4
  const Cave = window.Battle;

  function makeV() { return new Float64Array(N); }

  /* Q-value of heading m at state s. Returns minus Infinity if the heading has
     no successors (never happens in the cave), so it can never win an argmax. */
  function qValue(s, m, V, gamma) {
    const succ = Cave.successorsFromBuckets(s, m);
    if (!succ || succ.length === 0) return -Infinity;
    let q = 0;
    for (const { sNext, p, reward } of succ) {
      let vNext = 0;
      if (!sNext.terminal) vNext = V[Cave.stateIndex(sNext)];
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

  /* Manhattan distance of a tile to the gold. */
  function distToGold(r, c) {
    return Math.abs(r - Cave.GOLD.row) + Math.abs(c - Cave.GOLD.col);
  }
  /* The tile a heading INTENDS to reach from (r,c) (wall-bump => stay). */
  function intendedTile(r, c, m) {
    const v = window.Actions.vecOf(m);
    const t = Cave.moveTo(r, c, v[0], v[1]);
    return [t.r, t.c];
  }
  const TIE_RANK = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };

  /* Greedy policy with the progress-toward-gold tie-break described in the
     file header. */
  function greedyPolicy(V, gamma) {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = STATES[i];
      let best = -Infinity;
      for (const m of MOVE_IDS) {
        const q = qValue(s, m, V, gamma);
        if (q > best) best = q;
      }
      /* collect the headings within machine-eps of the max */
      const tied = [];
      for (const m of MOVE_IDS) {
        if (Math.abs(qValue(s, m, V, gamma) - best) < 1e-9) tied.push(m);
      }
      out[i] = resolveTie(s, tied);
    }
    return out;
  }

  /* Resolve a set of tied headings at state s: minimize intended distance to
     gold, then the fixed rank UP>RIGHT>DOWN>LEFT. */
  function resolveTie(s, tied) {
    if (tied.length === 1) return tied[0];
    let bestM = tied[0], bestD = Infinity, bestRank = Infinity;
    for (const m of tied) {
      const [tr, tc] = intendedTile(s.row, s.col, m);
      const d = distToGold(tr, tc);
      const rank = TIE_RANK[m];
      if (d < bestD - 1e-9 || (Math.abs(d - bestD) < 1e-9 && rank < bestRank)) {
        bestD = d; bestRank = rank; bestM = m;
      }
    }
    return bestM;
  }

  /* All headings (within eps) that achieve the max Q at state index i, used
     by the renderer to draw a faint secondary arrow at genuine tie tiles. */
  function tiedActionsAt(i, V, gamma) {
    const s = STATES[i];
    let best = -Infinity;
    for (const m of MOVE_IDS) { const q = qValue(s, m, V, gamma); if (q > best) best = q; }
    const tied = [];
    for (const m of MOVE_IDS) if (Math.abs(qValue(s, m, V, gamma) - best) < 1e-9) tied.push(m);
    return tied;
  }

  function qFromV(V, gamma) {
    /* N x 4 Q-table, indexed [stateIdx * 4 + moveIdx]. All cells finite. */
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
    qValue, bellmanSweep, valueIteration, greedyPolicy, resolveTie, tiedActionsAt,
    qFromV, policyDiff, movesUsed, moveFrequencies,
    distToGold, intendedTile,
  };
})();

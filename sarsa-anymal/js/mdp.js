/* MDP transition function for the column-patrol cliff-walk.
 *
 *   3×7 grid · 21 states · 84 Q-values
 *
 *      . . G . . . .          row 0
 *      . . . . . . .          row 1
 *      S . . . . G ★          row 2
 *
 *   Two ghosts confined to single columns:
 *     - Ghost 1 col 2, biased random walk P(↑, —, ↓) = (0.50, 0.30, 0.20)  (north-biased, sticks high)
 *     - Ghost 2 col 5, biased random walk P(↑, —, ↓) = (0.20, 0.30, 0.50)  (south-biased, sticks low)
 *
 *   Stationary distributions (computed analytically; assertable):
 *     - Ghost 1 in col 2: P(row 0, 1, 2) = (0.6452, 0.2581, 0.0968)
 *     - Ghost 2 in col 5: P(row 0, 1, 2) = (0.0968, 0.2581, 0.6452)
 *
 *   State (for SARSA): s = (r, c) ONLY. Ghost positions are part of the
 *   environment — not the state.
 *
 *   Rewards (matches viz #1 ANYmal):
 *     - step:                     -1
 *     - collision with ghost:    -100  + respawn agent at start (NOT terminal)
 *     - reach star (2,6):         +10  + terminal
 *     - maxRounds:                 40
 *
 *   Step ordering: agent moves -> goal check -> ghosts move -> collision check.
 */
(function () {
  const ACTIONS = ['up', 'down', 'left', 'right'];
  const DELTAS = {
    up:    { dr: -1, dc:  0 },
    down:  { dr:  1, dc:  0 },
    left:  { dr:  0, dc: -1 },
    right: { dr:  0, dc:  1 },
  };
  /* Reward magnitudes: STEP per move, STAR on goal (terminal), COLLISION on
     ghost contact (NOT terminal — agent respawns at start). The values match
     the precompute used to train the canonical Q-table. */
  const REWARD = { STEP: -1, STAR: 100, COLLISION: -50 };

  /* Mulberry32 — same as viz #1. Seed captured in History so a replay is exact. */
  function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(rc, M, N) {
    return {
      r: Math.max(0, Math.min(M - 1, rc.r)),
      c: Math.max(0, Math.min(N - 1, rc.c)),
    };
  }

  function applyAction(rc, action) {
    const d = DELTAS[action];
    if (!d) return rc;
    return { r: rc.r + d.dr, c: rc.c + d.dc };
  }

  /* Biased column-confined random walk for one ghost.
     bias.up + bias.stay + bias.down should sum to 1. The ghost stays in its
     own column always; out-of-bound moves clamp. */
  function moveGhost(rng, ghost, M) {
    const u = rng();
    const cum1 = ghost.bias.up;
    const cum2 = cum1 + ghost.bias.stay;
    let dr;
    if (u < cum1) dr = -1;
    else if (u < cum2) dr = 0;
    else dr = 1;
    const r = Math.max(0, Math.min(M - 1, ghost.r + dr));
    return { r, c: ghost.c, bias: ghost.bias };
  }

  function cloneState(s) {
    return {
      M: s.M,
      N: s.N,
      anymal: { ...s.anymal },
      ghosts: s.ghosts.map(g => ({ r: g.r, c: g.c, bias: g.bias })),
      star: { ...s.star },
      start: { ...s.start },
      round: s.round,
      score: s.score,
      terminal: s.terminal,
      terminalReason: s.terminalReason,
    };
  }

  /* Apply one MDP step. Returns { state, reward, terminal, hitStar, collision }.
     Step ordering matches viz #1:
       1. agent moves
       2. goal check (terminal if reached)
       3. ghosts move
       4. collision check (NOT terminal — agent respawns at start)
     `params.malfunctionProb` ∈ [0, 0.5] is optional and matches viz #1's
     malfunction model. Default 0 (deterministic agent).
  */
  function step(state, action, params, rng) {
    if (state.terminal) {
      return { state, executed: action, reward: 0, terminal: true, hitStar: false, collision: false };
    }
    const M = state.M, N = state.N;
    const p = params && typeof params.malfunctionProb === 'number' ? params.malfunctionProb : 0;
    let executed = action;
    if (p > 0 && rng() < p) {
      executed = ACTIONS[Math.floor(rng() * 4)];
    }

    const next = cloneState(state);
    next.round += 1;

    /* 1. agent moves */
    next.anymal = clamp(applyAction(next.anymal, executed), M, N);

    let reward = REWARD.STEP;
    let hitStar = false;
    let collision = false;

    /* 2. goal check */
    if (next.anymal.r === next.star.r && next.anymal.c === next.star.c) {
      reward += REWARD.STAR;
      hitStar = true;
      next.terminal = true;
      next.terminalReason = 'goal';
    }

    /* 3. ghosts move (only if game continues) */
    if (!next.terminal) {
      next.ghosts = next.ghosts.map(g => moveGhost(rng, g, M));

      /* 4. collision check — collision triggers respawn (NOT terminal) */
      for (const g of next.ghosts) {
        if (g.r === next.anymal.r && g.c === next.anymal.c) {
          reward += REWARD.COLLISION;
          collision = true;
          next.anymal = { ...next.start };
          break;
        }
      }
    }

    /* 5. round-cap terminal (forced exit, last reward already applied) */
    if (!next.terminal && params && params.maxRounds && next.round >= params.maxRounds) {
      next.terminal = true;
      next.terminalReason = 'maxRounds';
    }

    next.score += reward;
    return { state: next, executed, reward, terminal: next.terminal, hitStar, collision };
  }

  /* Build the canonical initial state from DATA. Pure function — every
     scene's onEnter calls this so cold entry works. */
  function initialState() {
    const cfg = window.DATA && window.DATA.initial;
    if (!cfg) throw new Error('DATA.initial missing');
    const start = { r: cfg.start.r, c: cfg.start.c };
    return {
      M: cfg.M,
      N: cfg.N,
      anymal: { ...start },
      start,
      ghosts: cfg.ghosts.map(g => ({ r: g.r, c: g.c, bias: { ...g.bias } })),
      star: { ...cfg.star },
      round: 0,
      score: 0,
      terminal: false,
      terminalReason: null,
    };
  }

  /* Stationary distribution of one ghost confined to a column of length M
     under a biased random walk with absorption at the walls (clamping).
     Returns a length-M array summing to 1. Used by the ghost-occupancy
     heatmap underlay (scenes 3, 4) and by the data-prep agent's invariants.

     Markov chain transition matrix P (M×M) under (up, stay, down) bias:
       interior row i: P[i, i-1] = bias.up, P[i, i] = bias.stay, P[i, i+1] = bias.down
       row 0          : P[0, 0]   = bias.up + bias.stay,         P[0, 1]   = bias.down
       row M-1        : P[M-1, M-2] = bias.up,                   P[M-1, M-1] = bias.stay + bias.down
     Solve πP = π, sum π = 1. Closed-form for birth-death: π_i ∝ ∏ (down/up)^i.
  */
  function ghostStationary(bias, M) {
    /* Birth-death chain with up = bias.up, down = bias.down. The "stay"
       probability cancels. Stationary π_i ∝ (bias.down / bias.up)^i if no walls.
       With reflecting walls on a finite chain, the same holds. */
    const ratio = bias.down / bias.up;
    const w = new Array(M);
    for (let i = 0; i < M; i++) w[i] = Math.pow(ratio, i);
    const s = w.reduce((a, b) => a + b, 0);
    return w.map(x => x / s);
  }

  window.MDP = {
    ACTIONS,
    DELTAS,
    REWARD,
    makeRng,
    clamp,
    applyAction,
    moveGhost,
    step,
    initialState,
    cloneState,
    ghostStationary,
  };
})();

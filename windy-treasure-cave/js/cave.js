/* MDP transitions for the Windy Treasure Cave (the analog of gambler.js).
 *
 *   State s: the explorer's TILE on a 5x5 floor plan, s = (row, col) with
 *     row, col in {0,1,2,3,4}. 25 tiles; two are terminal (value baked in,
 *     not playable): the GOLD chest at (0,4) (+10) and the PIT at (2,2)
 *     (-10). That leaves 23 PLAYABLE interior tiles. The whole state space
 *     IS the cave map -- every value / optimal arrow is drawn on the board.
 *   Action a: one of 4 compass headings (UP/DOWN/LEFT/RIGHT = the direction
 *     attempted). All four are always legal (a wall just keeps you in place).
 *   Transition: pick a heading, then ROLL the wind die (a d10). With p = 0.7
 *     you step where you aimed; with p = 0.15 a gust shoves you one tile to
 *     your LEFT-perpendicular; with p = 0.15 to your RIGHT-perpendicular.
 *     A move into a wall keeps you on your tile (still a step). The wind is
 *     the only stochastic element.
 *   Reward: -1 per step (the torch burns), but the TERMINAL-landing step pays
 *     only its bonus: +10 the instant you reach the gold, -10 the instant you
 *     fall in the pit (the -1 torch cost is NOT also charged on that final
 *     step). gamma = 1 (every episode terminates, returns are bounded).
 *     [This "terminal reward replaces the step cost" convention is the one
 *      under which the proposal's V-star / Q-star numbers hold EXACTLY; the
 *      precompute asserts that.]
 *
 *   Indexing mirrors the Gambler/Pokemon engines so bellman.js / sarsa.js and
 *   the board widget reuse unchanged. The board is two-dimensional here:
 *     stateIndex(s) = row * COLS + col, restricted to the 23 NON-terminal
 *     tiles via a dense remap (NON_TERMINAL_STATES is built in row-major
 *     order skipping the gold/pit), so Q[stateIndex] aligns. ROWS = 5,
 *     COLS = 5 (but the Q-table has 23 live rows).
 *
 *   Two transition shapes, same names as the old window.Battle:
 *     sample(state, actionId, rng) -> { sNext, reward, terminal, log }
 *        one wind roll (playtest + SARSA).
 *     successors(state, actionId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the three wind outcomes (value iteration).
 *
 *   Exposed as window.Cave; aliased to window.Battle for the reused engine
 *   files. New scene code should read window.Cave. */
(function () {
  const ROWS = 5, COLS = 5;
  const GOLD = { row: 0, col: 4 };      // +10 terminal
  const PIT  = { row: 2, col: 2 };      // -10 terminal
  const START = { row: 4, col: 0 };     // spawn tile (far corner)
  const GOLD_R = 10;                     // gold bonus
  const PIT_R  = -10;                    // pit penalty
  const STEP_R = -1;                     // torch cost per (non-terminal) step

  /* Wind die probabilities (a d10): 0.7 intended, 0.15 left, 0.15 right. */
  const P_MAIN = 0.7, P_LEFT = 0.15, P_RIGHT = 0.15;

  const Actions = window.Actions;
  const ACTION_IDS = Actions.ACTION_IDS;
  const ACTION_BY_ID = Actions.ACTION_BY_ID;
  const PERP = Actions.PERP;

  /* ---------- Tile classification ---------- */
  function isGold(r, c) { return r === GOLD.row && c === GOLD.col; }
  function isPit(r, c)  { return r === PIT.row && c === PIT.col; }
  function isTerminalRC(r, c) { return isGold(r, c) || isPit(r, c); }
  function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

  /* Bonus collected on ENTERING a tile (0 unless that tile is terminal). */
  function bonus(r, c) {
    if (isGold(r, c)) return GOLD_R;
    if (isPit(r, c))  return PIT_R;
    return 0;
  }

  /* ---------- Board geometry ---------- */
  function row(s) { return s && !s.terminal ? s.row : (s ? s.row : 0); }
  function col(s) { return s && !s.terminal ? s.col : (s ? s.col : 0); }

  /* Playable (non-terminal) tiles, row-major, skipping gold + pit. The Q-table
     has one row per entry. A dense index map keeps Q compact. */
  const NON_TERMINAL_STATES = [];
  const INDEX_OF = {};                    // "r,c" -> dense index 0..22
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isTerminalRC(r, c)) continue;
      INDEX_OF[r + ',' + c] = NON_TERMINAL_STATES.length;
      NON_TERMINAL_STATES.push({ row: r, col: c, terminal: false });
    }
  }
  const N = NON_TERMINAL_STATES.length;  // 23

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    const k = INDEX_OF[s.row + ',' + s.col];
    return k == null ? -1 : k;
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    const t = NON_TERMINAL_STATES[i];
    return { row: t.row, col: t.col, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.goal ? 'GOLD' : 'PIT';
    return 'r' + s.row + 'c' + s.col;
  }

  function initialState() { return { row: START.row, col: START.col, terminal: false }; }

  /* Terminal-state constructor for a landed tile. */
  function makeState(r, c) {
    if (isGold(r, c)) return { row: r, col: c, terminal: true, goal: true,  pit: false };
    if (isPit(r, c))  return { row: r, col: c, terminal: true, goal: false, pit: true };
    return { row: r, col: c, terminal: false };
  }

  /* All four headings are always legal here (no clamping). Kept for parity
     with the Gambler engine's API so shared code can call them. */
  function availableActionIds(_r, _c) { return ACTION_IDS.slice(); }
  function isLegal(_r, _c, actionId) { return !!ACTION_BY_ID[actionId]; }

  /* ---------- Apply a displacement with wall-bump (stay if out of bounds) ---------- */
  function moveTo(r, c, dr, dc) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) return { r, c, bumped: true };   // wall: stay put
    return { r: nr, c: nc, bumped: false };
  }

  /* The three wind outcomes for (tile, heading): intended + two gusts.
     Returns [{ dest:{r,c,bumped}, dir:'main'|'left'|'right', p }]. */
  function windOutcomes(r, c, actionId) {
    const vec = Actions.vecOf(actionId);
    const perp = PERP[actionId];
    return [
      { dir: 'main',  p: P_MAIN,  dest: moveTo(r, c, vec[0], vec[1]) },
      { dir: 'left',  p: P_LEFT,  dest: moveTo(r, c, perp.left[0],  perp.left[1]) },
      { dir: 'right', p: P_RIGHT, dest: moveTo(r, c, perp.right[0], perp.right[1]) },
    ];
  }

  /* ---------- One wind roll (one sample) ---------- */
  function sample(state, actionId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { action: actionId, dir: 'main', bumped: false, rBefore: state.row, cBefore: state.col } };
    }
    const r = state.row, c = state.col;
    const outs = windOutcomes(r, c, actionId);
    const u = rng();
    let pick = outs[0], acc = 0;
    for (const o of outs) { acc += o.p; if (u < acc) { pick = o; break; } }
    const nr = pick.dest.r, nc = pick.dest.c;
    const sNext = makeState(nr, nc);
    const reward = sNext.terminal ? bonus(nr, nc) : STEP_R;
    const log = {
      action: actionId,
      dir: pick.dir,                 // 'main' | 'left' | 'right'
      bumped: pick.dest.bumped,
      rBefore: r, cBefore: c,
      rAfter: nr, cAfter: nc,
      goal: !!sNext.goal, pit: !!sNext.pit, terminal: !!sNext.terminal,
      die: rollFaceFor(pick.dir, u),  // the d10 face that produced this (display only)
    };
    return { sNext, reward, terminal: !!sNext.terminal, log };
  }

  /* Map a wind outcome to a representative d10 face (1-7 main, 8-9 left,
     10 right) for the on-screen die. Deterministic-ish from the draw. */
  function rollFaceFor(dir, u) {
    if (dir === 'main')  return 1 + Math.floor(Math.min(0.69999, Math.max(0, u)) / 0.7 * 7);   // 1..7
    if (dir === 'left')  return 8 + (u < 0.775 ? 0 : 1);                                          // 8..9
    return 10;                                                                                     // right
  }

  /* ---------- Successor enumeration (value iteration) ---------- */
  /* Returns the three wind outcomes for a heading. Outcomes that land on the
     SAME tile (e.g. two wall-bumps, or a bump that returns to start) are kept
     separate; the Bellman backup sums their probabilities anyway. */
  function successors(state, actionId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const r = state.row, c = state.col;
    const outs = windOutcomes(r, c, actionId);
    const succ = [];
    for (const o of outs) {
      const nr = o.dest.r, nc = o.dest.c;
      const sNext = makeState(nr, nc);
      const reward = sNext.terminal ? bonus(nr, nc) : STEP_R;
      succ.push({ sNext, p: o.p, reward });
    }
    return succ;
  }
  function successorsFromBuckets(s, actionId) { return successors(s, actionId); }

  /* ---------- Mulberry32 (shared with the precompute) ---------- */
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

  /* ---------- Display helpers ---------- */
  function stateLabel(s) {
    if (!s) return '';
    if (s.terminal) return s.goal ? 'GOLD' : 'PIT';
    return '(' + s.row + ',' + s.col + ')';
  }

  window.Cave = {
    ROWS, COLS, N,
    GOLD, PIT, START,
    GOLD_R, PIT_R, STEP_R,
    P_MAIN, P_LEFT, P_RIGHT,
    NON_TERMINAL_STATES,
    isGold, isPit, isTerminalRC, inBounds, bonus,
    row, col, stateIndex, stateFromIndex, stateKey, makeState,
    initialState, sample, successors, successorsFromBuckets,
    windOutcomes, moveTo,
    makeRng,
    stateLabel,
    availableActionIds, isLegal,
    ACTION_IDS, ACTION_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Cave;
})();

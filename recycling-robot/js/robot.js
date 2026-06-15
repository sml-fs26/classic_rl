/* MDP transitions for the Recycling Robot (the model behind every scene).
 *
 *   State s: the robot's BATTERY LEVEL, an integer rung
 *       empty = 0 (terminal, STRANDED), low = 1, mid = 2, high = 3, full = 4.
 *     A vertical 5-segment GAUGE. `empty` is the absorbing "stranded" terminal
 *     (value 0; entering it already paid the rescue cost). That leaves 4
 *     PLAYABLE interior rungs (low/mid/high/full) you actually decide from.
 *     The whole Q-table is 4 rows on one screen as a single tall column.
 *   Action a: one of 3 levers (search/wait/recharge). All three are legal at
 *     every playable rung, so there are NO clamped actions (clean 4x3 table).
 *   Transition:
 *     SEARCH  -> roll the battery-drain die: -1 rung w.p. 0.70, -2 rungs w.p.
 *                0.30. A drain that reaches `empty` STRANDS the robot (terminal).
 *     WAIT    -> stays on the same rung (deterministic, no die).
 *     RECHARGE-> jumps straight to `full` (deterministic, no die).
 *   Reward:
 *     SEARCH  -> +3 at full/high, +2 at mid/low (the trash collected). If that
 *                same SEARCH strands the robot, it STILL collected the bag this
 *                step, then pays the rescue: r = searchReward(s) + STRAND, where
 *                STRAND = -10. (From `low` BOTH drains strand, so SEARCH-from-low
 *                is a certain 2 + (-10) = -8.)
 *     WAIT    -> +1 (a token: it tidied its own dock).
 *     RECHARGE-> 0 (pure investment in future capacity).
 *   Horizon: a work SHIFT of N = 8 steps. gamma = 1 (the shift length is the
 *     horizon, so returns are bounded without discounting). This is a
 *     FINITE-HORIZON MDP: the optimal action can depend on steps-remaining, and
 *     it does on the very last step (WAIT beats RECHARGE at low/mid then).
 *
 *   Indexing mirrors the gambler/Pokemon engines so bellman.js / sarsa.js / the
 *   gauge widget reuse unchanged. There is ONE axis (battery), so the "board"
 *   is a single column:
 *     stateIndex(s) = level - 1   in 0..3  (low=0, mid=1, high=2, full=3)
 *     NON_TERMINAL_STATES is built in the same order. ROWS = 4, COLS = 1.
 *     The widget renders full (top) .. low (bottom) so the gauge climbs upward.
 *
 *   Two transition shapes, same names as the gambler's window.Battle:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal, log }
 *        one die roll (playtest + SARSA).
 *     successors(state, leverId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the drain outcomes (value iteration).
 *
 *   Exposed as window.Robot; aliased to window.Battle for the reused engine
 *   files. New scene code should read window.Robot. */
(function () {
  const EMPTY = 0, LOW = 1, MID = 2, HIGH = 3, FULL = 4;
  const N_LEVELS = 4;                 // playable rungs: low/mid/high/full
  const SHIFT = 8;                    // N: steps in a work shift
  const STRAND = -10;                 // rescue cost when the robot strands at empty
  const DRAIN = [                     // the battery-drain die (SEARCH only)
    { delta: -1, p: 0.70 },
    { delta: -2, p: 0.30 },
  ];

  const LEVEL_NAMES = { 0: 'empty', 1: 'low', 2: 'mid', 3: 'high', 4: 'full' };

  /* Levers come from window.Levers (loaded first). */
  const LEVER_BY_ID = window.Levers.LEVER_BY_ID;
  const LEVER_IDS   = window.Levers.LEVER_IDS;

  /* Trash collected on a SEARCH at battery level lv: +3 at full/high, +2 at
     mid/low (the riskier low reach hauls less). */
  function searchReward(lv) { return lv >= HIGH ? 3 : 2; }

  /*, Board geometry (one column of 4 rungs), */
  /* full sits at the TOP (row 0), low at the BOTTOM (row 3), so the rendered
     gauge climbs upward. */
  function levelOf(s) { return (s && !s.terminal) ? s.lv : 0; }
  function row(s) { return FULL - levelOf(s); }          // full -> row 0, low -> row 3
  function col(_s) { return 0; }                          // single column

  /* Playable states in index order: low..full -> index 0..3. */
  const NON_TERMINAL_STATES = [];
  for (let lv = LOW; lv <= FULL; lv++) NON_TERMINAL_STATES.push({ lv: lv, terminal: false });

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.lv - 1;                  // low..full -> 0..3
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N_LEVELS) return null;
    return { lv: i + 1, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return 'STRANDED';
    return 'b' + s.lv;
  }

  function initialState() { return { lv: FULL, terminal: false }; }   // a fresh full battery

  /* All three levers are legal at every playable rung. Kept for API parity
     with the gambler (whose stakes could be clamped). */
  function availableLeverIds(_lv) { return LEVER_IDS.slice(); }
  function isLegal(_lv, leverId) { return !!LEVER_BY_ID[leverId]; }

  /*, Build the next state from a drain outcome, */
  function drainTo(lv, delta) {
    const lv2 = lv + delta;
    if (lv2 <= EMPTY) return { terminal: true, stranded: true };
    return { lv: lv2, terminal: false };
  }

  /*, One die roll (one sample), */
  function sample(state, leverId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { lever: leverId, lvBefore: 0, lvAfter: 0, drain: 0, stranded: true } };
    }
    const lv = state.lv;

    if (leverId === 'wait') {
      return { sNext: { lv: lv, terminal: false }, reward: 1, terminal: false,
        log: { lever: 'wait', lvBefore: lv, lvAfter: lv, drain: 0, stranded: false, reward: 1 } };
    }
    if (leverId === 'recharge') {
      return { sNext: { lv: FULL, terminal: false }, reward: 0, terminal: false,
        log: { lever: 'recharge', lvBefore: lv, lvAfter: FULL, drain: 0, stranded: false, reward: 0 } };
    }
    /* SEARCH: roll the drain die. */
    const u = rng();
    const delta = u < DRAIN[0].p ? DRAIN[0].delta : DRAIN[1].delta;   // -1 (0.7) else -2
    const sNext = drainTo(lv, delta);
    const haul = searchReward(lv);
    const stranded = !!sNext.stranded;
    const reward = stranded ? (haul + STRAND) : haul;
    const log = {
      lever: 'search',
      lvBefore: lv,
      lvAfter: sNext.terminal ? 0 : sNext.lv,
      drain: delta, stranded: stranded, haul: haul, reward: reward,
    };
    return { sNext, reward, terminal: !!sNext.terminal, log };
  }

  /*, Successor enumeration (value iteration), */
  function successors(state, leverId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const lv = state.lv;
    if (leverId === 'wait') {
      return [{ sNext: { lv: lv, terminal: false }, p: 1, reward: 1 }];
    }
    if (leverId === 'recharge') {
      return [{ sNext: { lv: FULL, terminal: false }, p: 1, reward: 0 }];
    }
    /* SEARCH: enumerate both drain outcomes. */
    const haul = searchReward(lv);
    const out = [];
    for (const { delta, p } of DRAIN) {
      const sNext = drainTo(lv, delta);
      const reward = sNext.stranded ? (haul + STRAND) : haul;
      out.push({ sNext, p, reward });
    }
    return out;
  }
  function successorsFromBuckets(s, leverId) { return successors(s, leverId); }

  /*, Mulberry32 (shared with the precompute), */
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

  /*, Display helpers, */
  function level(s) { return s && !s.terminal ? s.lv : 0; }
  function stateLabel(s) {
    if (!s) return '';
    if (s.terminal) return 'STRANDED';
    return LEVEL_NAMES[s.lv];
  }

  window.Robot = {
    EMPTY, LOW, MID, HIGH, FULL,
    N: N_LEVELS, SHIFT, STRAND,
    DRAIN, LEVEL_NAMES,
    /* Grid dims for the gauge widget: 4 rows x 1 col. */
    ROWS: N_LEVELS, COLS: 1,
    NON_TERMINAL_STATES,
    row, col, stateIndex, stateFromIndex, stateKey,
    initialState, sample, successors, successorsFromBuckets,
    searchReward, drainTo,
    makeRng,
    level, levelOf, stateLabel,
    availableLeverIds, isLegal,
    LEVER_IDS, LEVER_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Robot;
})();

/* MDP transitions for Last-Minute Pricing (replaces the Pokemon battle.js).
 *
 *   State s: (units left u in {1..5}, days to deadline d in {1..4}).
 *     A 5x4 board of 20 PLAYABLE states. Two ways to end (off-grid, like the
 *     old WIN/LOSS terminals): the DEADLINE (d hits 0; leftover units score
 *     nothing) and SOLD OUT (u hits 0; episode ends early). Both terminals
 *     have value 0.
 *   Action a: one of 3 price levers (premium / standard / firesale).
 *   Transition: set a lever, draw demand k (units that want to buy today),
 *     sell min(k, u). Time always ticks down one day; inventory drops by what
 *     sold. The demand draw is the only stochastic element. No opponent.
 *   Reward: r = price * units sold today. All non-negative. gamma = 1
 *     (finite 4-day horizon, so returns are bounded without discounting).
 *
 *   Board indexing mirrors the Pokemon engine so bellman.js / sarsa.js /
 *   the Q-table widget reuse unchanged:
 *     row r = 5 - u   (r=0 -> 5 units at top, r=4 -> 1 unit at bottom)
 *     col c = 4 - d   (c=0 -> 4 days at left, c=3 -> 1 day; d=0 is off-grid)
 *     stateIndex(s) = r * NUM_DAYS + c  in 0..19, equal to the position in
 *     NON_TERMINAL_STATES (built in the same order), so Q[stateIndex] aligns.
 *
 *   Two transition shapes, same names as the old window.Battle:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal, log }
 *        one stochastic demand draw (playtest + SARSA).
 *     successors(state, leverId)  -> [ { sNext, p, reward } ]
 *        full enumeration over demand outcomes (value iteration).
 *
 *   Exposed as window.Pricing; aliased to window.Battle for the reused
 *   engine files. New scene code should read window.Pricing. */
(function () {
  const NUM_UNITS = 5;     // u in 1..5
  const NUM_DAYS  = 4;     // d in 1..4 (playable); d=0 is the deadline terminal
  const N = NUM_UNITS * NUM_DAYS;   // 20 playable states

  /* Levers come from window.Levers (loaded first). */
  const LEVER_BY_ID = window.Levers.LEVER_BY_ID;
  const LEVER_IDS   = window.Levers.LEVER_IDS;

  /* ---------- Board geometry ---------- */
  function row(s) { return NUM_UNITS - s.u; }      // 0..4, units 5..1 top..bottom
  function col(s) { return NUM_DAYS  - s.d; }      // 0..3, days 4..1 left..right

  /* Playable states in index order (row-major: units 5..1, days 4..1). */
  const NON_TERMINAL_STATES = [];
  for (let r = 0; r < NUM_UNITS; r++) {
    for (let c = 0; c < NUM_DAYS; c++) {
      NON_TERMINAL_STATES.push({ u: NUM_UNITS - r, d: NUM_DAYS - c, terminal: false });
    }
  }

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return row(s) * NUM_DAYS + col(s);
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    const r = Math.floor(i / NUM_DAYS), c = i % NUM_DAYS;
    return { u: NUM_UNITS - r, d: NUM_DAYS - c, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.soldout ? 'SOLDOUT' : 'DEADLINE';
    return s.u + '|' + s.d;
  }

  function initialState() { return { u: 5, d: 4, terminal: false }; }

  /* ---------- Build the next state from a sale ---------- */
  function step(u, d, sold) {
    const u2 = u - sold;
    const d2 = d - 1;
    if (u2 <= 0) return { terminal: true, soldout: true,  win: false, lose: false };
    if (d2 <= 0) return { terminal: true, deadline: true, win: false, lose: false };
    return { u: u2, d: d2, terminal: false };
  }

  /* ---------- RNG sampling helper ---------- */
  function sampleDist(rng, dist) {
    const u = rng();
    let cum = 0;
    for (const kp of dist) { cum += kp[1]; if (u < cum) return kp[0]; }
    return dist[dist.length - 1][0];
  }

  /* Rewards are paid on the transition; terminal states are worth 0. Kept
     for API parity with the old engine. */
  function rewardFor(sNext) { return 0; }

  /* ---------- One-day sample (one demand draw) ---------- */
  function sample(state, leverId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { lever: leverId, k: 0, sold: 0, price: 0,
               uBefore: state.u || 0, dBefore: state.d || 0, uAfter: state.u || 0, dAfter: 0 } };
    }
    const lever = LEVER_BY_ID[leverId];
    const k = sampleDist(rng, lever.demand);
    const sold = Math.min(k, state.u);
    const reward = lever.price * sold;
    const sNext = step(state.u, state.d, sold);
    const log = {
      lever: leverId, k: k, sold: sold, price: lever.price,
      uBefore: state.u, dBefore: state.d,
      uAfter: sNext.terminal ? (sNext.soldout ? 0 : state.u - sold) : sNext.u,
      dAfter: sNext.terminal ? (sNext.deadline ? 0 : state.d - 1) : sNext.d,
      soldout: !!sNext.soldout, deadline: !!sNext.deadline,
    };
    return { sNext, reward, terminal: !!sNext.terminal, log };
  }

  /* ---------- Successor enumeration (value iteration) ---------- */
  function successors(state, leverId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const lever = LEVER_BY_ID[leverId];
    const out = new Map();
    function add(sN, p, reward) {
      const k = stateKey(sN) + '#' + reward;   // same dest + same reward aggregate
      const cur = out.get(k);
      if (cur) cur.p += p;
      else out.set(k, { sNext: sN, p: p, reward: reward });
    }
    for (const kp of lever.demand) {
      const k = kp[0], p = kp[1];
      const sold = Math.min(k, state.u);
      const reward = lever.price * sold;
      add(step(state.u, state.d, sold), p, reward);
    }
    return Array.from(out.values());
  }
  function successorsFromBuckets(s, leverId) { return successors(s, leverId); }

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
  function unitsLeft(s) { return s && !s.terminal ? s.u : 0; }
  function daysLeft(s)  { return s && !s.terminal ? s.d : 0; }
  function stateLabel(s) {
    if (!s) return '';
    if (s.terminal) return s.soldout ? 'SOLD OUT' : 'MIDNIGHT';
    return s.u + 'u / ' + s.d + 'd';
  }

  window.Pricing = {
    NUM_UNITS, NUM_DAYS, N,
    /* Grid dims for the Q-table widget (5 rows x 4 cols). */
    ROWS: NUM_UNITS, COLS: NUM_DAYS,
    NON_TERMINAL_STATES,
    row, col, stateIndex, stateFromIndex, stateKey,
    initialState, step, sample, successors, successorsFromBuckets,
    rewardFor, makeRng,
    unitsLeft, daysLeft, stateLabel,
    LEVER_IDS, LEVER_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Pricing;
})();

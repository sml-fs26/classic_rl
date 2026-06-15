/* MDP transitions for Trial Clock (the Pokemon battle.js analogue).
 *
 *   State s: a single trial user's situation on two axes.
 *     - adoption TIER:  0 = none, 1, 2, 3, 4 = ACTIVATED (hit the "aha" moment)
 *     - DAYS left:      5, 4, 3, 2, 1
 *     One state = (tier, days). 5 tiers x 5 days = 25 PLAYABLE cells, rendered
 *     as one 5x5 board (rows = tier 4 on top .. 0 on the bottom, columns =
 *     days 5 on the left .. 1 on the right). Three TERMINALS (value baked in,
 *     not playable): CONVERT (paid, +20), ABANDON (soured/bailed, -5), EXPIRY
 *     (trial ran out at days=0, 0).
 *   Action a: one of 3 growth levers (nudge / nothing / push). Every lever is
 *     legal in every cell (no clamping) -> a clean 25x3 Q-table.
 *   Transition: the two visible dice.
 *     - DO NOTHING : deterministic, a day ticks off. (tier, d) -> (tier, d-1).
 *     - ONBOARD NUDGE : the Adoption Coin flips, p = 1/2. Heads -> (tier+1, d-1)
 *       (capped at tier 4); tails -> (tier, d-1). Either way a day burns.
 *     - PAYWALL PUSH : the Conversion Wheel spins, sized by tier
 *       (p_BUY, p_IGNORE, p_ABANDON). BUY -> CONVERT; IGNORE -> (tier, d-1);
 *       ABANDON -> ABANDON. Cold users have a big ABANDON wedge; ACTIVATED
 *       users have a big BUY wedge.
 *     If d-1 reaches 0 on a non-terminating outcome, the trial EXPIRES (0).
 *   Reward: +20 on CONVERT, -1 on every NUDGE (guidance is not free), 0 on DO
 *     NOTHING, -5 on an early ABANDON, 0 on EXPIRY. gamma = 1 (a 5-day horizon;
 *     no need to discount within the trial). The trial is strictly episodic.
 *
 *   Indexing mirrors the Pokemon/pricing/gambler engines so bellman.js /
 *   sarsa.js / the board widget reuse unchanged:
 *     stateIndex(s) = tier * 5 + (days - 1)   in 0..24
 *       (tier 0 day 1 -> index 0 ; tier 4 day 5 -> index 24)
 *     NON_TERMINAL_STATES is built in the same order, so Q[stateIndex] aligns.
 *     ROWS = 5 (tiers), COLS = 5 (days).
 *
 *   Two transition shapes, same names as the old window.Battle:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal, log }
 *        one realized dice roll (playtest + SARSA).
 *     successors(state, leverId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the dice outcomes (value iteration).
 *
 *   The Adoption-Coin probability and the Conversion-Wheel wedges are FIXED
 *   (this MDP has no slider). Exposed as window.Trial; aliased to window.Battle
 *   for the reused engine files. New scene code should read window.Trial. */
(function () {
  const MAX_TIER = 4;              // tier 4 = ACTIVATED
  const MAX_DAYS = 5;              // trial starts with 5 days
  const N_TIERS  = MAX_TIER + 1;   // 5
  const N_DAYS   = MAX_DAYS;       // 5
  const N = N_TIERS * N_DAYS;      // 25 playable cells

  /* Rewards. */
  const R_CONVERT = 20;
  const R_ABANDON = -5;
  const R_NUDGE   = -1;
  const R_NOTHING = 0;
  const R_EXPIRY  = 0;

  /* Adoption Coin: fair. */
  const P_ADOPT = 0.5;

  /* Conversion Wheel by tier: [p_BUY, p_IGNORE, p_ABANDON]. Willingness to pay
     rises with adoption; the early-push ABANDON risk falls to zero only once
     the user is genuinely hooked. */
  const WHEEL = {
    0: { buy: 0.0, ignore: 0.5, abandon: 0.5 },
    1: { buy: 0.2, ignore: 0.6, abandon: 0.2 },
    2: { buy: 0.4, ignore: 0.5, abandon: 0.1 },
    3: { buy: 0.6, ignore: 0.4, abandon: 0.0 },
    4: { buy: 0.8, ignore: 0.2, abandon: 0.0 },
  };
  function wheel(tier) { return WHEEL[tier] || WHEEL[0]; }

  /* Levers come from window.Levers (loaded first). */
  const LEVER_BY_ID = window.Levers.LEVER_BY_ID;
  const LEVER_IDS   = window.Levers.LEVER_IDS;

  /*, Board geometry (5 tiers x 5 days) ----------
     row(s): tier 4 (ACTIVATED) at the TOP -> row 0; tier 0 (none) -> row 4.
     col(s): days 5 on the LEFT -> col 0; days 1 -> col 4. */
  function row(s) { return MAX_TIER - tierOf(s); }
  function col(s) { return MAX_DAYS - daysOf(s); }
  function tierOf(s) { return (s && !s.terminal) ? s.tier : 0; }
  function daysOf(s) { return (s && !s.terminal) ? s.days : 0; }

  /* Playable states in index order: tier-major, days ascending. */
  const NON_TERMINAL_STATES = [];
  for (let t = 0; t < N_TIERS; t++) {
    for (let d = 1; d <= N_DAYS; d++) NON_TERMINAL_STATES.push({ tier: t, days: d, terminal: false });
  }

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.tier * N_DAYS + (s.days - 1);
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    return { tier: Math.floor(i / N_DAYS), days: (i % N_DAYS) + 1, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.convert ? 'CONVERT' : (s.abandon ? 'ABANDON' : 'EXPIRY');
    return 't' + s.tier + 'd' + s.days;
  }

  function initialState() { return { tier: 0, days: MAX_DAYS, terminal: false }; }  // fresh signup

  /* Terminal constructors. */
  function convert() { return { terminal: true, convert: true,  abandon: false, expiry: false }; }
  function abandon() { return { terminal: true, convert: false, abandon: true,  expiry: false }; }
  function expiry()  { return { terminal: true, convert: false, abandon: false, expiry: true  }; }

  /* The next non-terminal cell after a day ticks off, or EXPIRY if the clock
     runs out. */
  function tickTo(tier, days) {
    const nd = days - 1;
    if (nd <= 0) return expiry();
    return { tier: tier, days: nd, terminal: false };
  }

  /* Every lever is legal everywhere -> the full set, always. */
  function availableLeverIds(_tier, _days) { return LEVER_IDS.slice(); }
  function isLegal(_tier, _days, leverId) { return !!LEVER_BY_ID[leverId]; }

  /*, One realized dice roll (one sample), */
  function sample(state, leverId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { lever: leverId, tierBefore: 0, daysBefore: 0 } };
    }
    const t = state.tier, d = state.days;
    const lever = LEVER_BY_ID[leverId] ? leverId : 'nothing';
    const base = { lever: lever, tierBefore: t, daysBefore: d };

    if (lever === 'nothing') {
      const sNext = tickTo(t, d);
      return { sNext, reward: R_NOTHING, terminal: !!sNext.terminal,
        log: Object.assign(base, { kind: 'wait',
          tierAfter: sNext.terminal ? t : sNext.tier, daysAfter: d - 1,
          outcome: sNext.terminal ? 'expiry' : 'wait' }) };
    }

    if (lever === 'nudge') {
      const heads = rng() < P_ADOPT;                 // heads = the feature lands
      const newTier = heads ? Math.min(t + 1, MAX_TIER) : t;
      const sNext = tickTo(newTier, d);
      return { sNext, reward: R_NUDGE, terminal: !!sNext.terminal,
        log: Object.assign(base, { kind: 'coin', heads: heads,
          tierAfter: sNext.terminal ? newTier : sNext.tier, daysAfter: d - 1,
          outcome: sNext.terminal ? 'expiry' : (heads ? 'adopt' : 'stay') }) };
    }

    /* push: spin the Conversion Wheel. */
    const w = wheel(t);
    const u = rng();
    if (u < w.buy) {
      return { sNext: convert(), reward: R_CONVERT, terminal: true,
        log: Object.assign(base, { kind: 'wheel', wedge: 'buy', outcome: 'convert' }) };
    }
    if (u < w.buy + w.ignore) {
      const sNext = tickTo(t, d);
      return { sNext, reward: 0, terminal: !!sNext.terminal,
        log: Object.assign(base, { kind: 'wheel', wedge: 'ignore',
          tierAfter: sNext.terminal ? t : sNext.tier, daysAfter: d - 1,
          outcome: sNext.terminal ? 'expiry' : 'ignore' }) };
    }
    return { sNext: abandon(), reward: R_ABANDON, terminal: true,
      log: Object.assign(base, { kind: 'wheel', wedge: 'abandon', outcome: 'abandon' }) };
  }

  /*, Successor enumeration (value iteration) ----------
     Returns every outcome of a lever with its probability and reward. No lever
     is ever clamped, so this never returns []. */
  function successors(state, leverId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const t = state.tier, d = state.days;
    const lever = LEVER_BY_ID[leverId] ? leverId : 'nothing';

    if (lever === 'nothing') {
      return [{ sNext: tickTo(t, d), p: 1, reward: R_NOTHING }];
    }
    if (lever === 'nudge') {
      const up = Math.min(t + 1, MAX_TIER);
      return [
        { sNext: tickTo(up, d), p: P_ADOPT,     reward: R_NUDGE },
        { sNext: tickTo(t,  d), p: 1 - P_ADOPT, reward: R_NUDGE },
      ];
    }
    const w = wheel(t);
    const out = [];
    if (w.buy > 0)     out.push({ sNext: convert(),    p: w.buy,     reward: R_CONVERT });
    if (w.ignore > 0)  out.push({ sNext: tickTo(t, d), p: w.ignore,  reward: 0 });
    if (w.abandon > 0) out.push({ sNext: abandon(),    p: w.abandon, reward: R_ABANDON });
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
  function tierLabel(t) {
    return t === MAX_TIER ? 'ACTIVATED' : (t === 0 ? 'none' : String(t));
  }
  function stateLabel(s) {
    if (!s) return '';
    if (s.terminal) return s.convert ? 'CONVERT' : (s.abandon ? 'ABANDON' : 'EXPIRY');
    return 'T' + s.tier + ' · ' + s.days + 'd';
  }

  window.Trial = {
    MAX_TIER, MAX_DAYS, N_TIERS, N_DAYS, N,
    R_CONVERT, R_ABANDON, R_NUDGE, R_NOTHING, R_EXPIRY,
    P_ADOPT, WHEEL, wheel,
    /* Grid dims for the board widget: 5 rows x 5 cols. */
    ROWS: N_TIERS, COLS: N_DAYS,
    NON_TERMINAL_STATES,
    row, col, tierOf, daysOf, stateIndex, stateFromIndex, stateKey,
    initialState, convert, abandon, expiry, tickTo,
    sample, successors, successorsFromBuckets,
    makeRng,
    tierLabel, stateLabel,
    availableLeverIds, isLegal,
    LEVER_IDS, LEVER_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Trial;
})();

/* MDP transitions for Stale by Sundown (the bakery markdown problem).
 *
 *   State s = the situation on the shelf = (units on shelf, freshness tier).
 *     units in {1, 2, 3}; tier in {FRESH, OK, AGING, OLD, STALE}. That is
 *     3 x 5 = 15 NON-TERMINAL states, drawn as a 5-row (age) x 3-col (stock)
 *     display case. Two terminals (value baked in, not playable):
 *       CLEARED, the shelf went empty (the win), value 0
 *       SPOILED, a stale unit aged out unsold (the loss), value baked into
 *                   the -6 reward on the transition INTO it.
 *
 *   Action a = one of 3 levers (window.Levers):
 *     HOLD     keep the full price (best margin, slowest to sell)
 *     DISCOUNT cut the price (thinner margin, demand jumps)
 *     DUMP     write off the whole batch and restock FRESH (same unit count)
 *   All three are ALWAYS legal at every shelf state.
 *
 *   Transition P, the visible "did a customer buy?" meter:
 *     HOLD / DISCOUNT: with prob pbuy(tier, lever) a customer BUYS -> one unit
 *       sells, the rest of the batch KEEPS its tier (a modelling
 *       simplification: the whole batch shares one freshness tier). If units
 *       was 1, the shelf is now empty -> CLEARED. Otherwise -> (units-1, tier).
 *       With prob 1 - pbuy NO ONE buys -> nothing sells and the WHOLE batch
 *       ages one tier (FRESH->OK->AGING->OLD->STALE); a STALE no-sale tips
 *       into SPOILED.
 *     DUMP is deterministic: pay the -3 write-off, the batch resets to FRESH
 *       at the same unit count.
 *
 *   Reward r = the till change: +5 on a HOLD sale, +2 on a DISCOUNT sale,
 *     -3 to DUMP, a -6 spoilage hit on tipping into SPOILED, 0 on CLEARED
 *     (you are simply done, the sale revenue already banked). gamma = 0.75
 *     supplies the "by sundown" deadline pressure.
 *
 *   Indexing mirrors the Pokemon/gambler engines so bellman.js / sarsa.js /
 *   the display-case widget reuse unchanged:
 *     stateIndex(s) = (units-1)*5 + tierIndex   in 0..14
 *     ROWS = 5 (tiers, FRESH at top), COLS = 3 (units 1..3).
 *     row(s) = tierIndex (0 = FRESH at the warm top .. 4 = STALE at the grey
 *     bottom); col(s) = units - 1.
 *     NON_TERMINAL_STATES is built in stateIndex order so Q[stateIndex] aligns.
 *
 *   Two transition shapes, same names as the old window.Battle:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal, log }
 *        one customer slot (playtest + SARSA).
 *     successors(state, leverId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the buy / no-buy outcomes (value iteration).
 *
 *   Exposed as window.Bakery; aliased to window.Battle / window.Gambler for the
 *   reused engine files. New scene code should read window.Bakery. */
(function () {
  const TIERS = ['FRESH', 'OK', 'AGING', 'OLD', 'STALE'];
  const UNITS = [1, 2, 3];
  const NTIER = TIERS.length;          // 5
  const NUNIT = UNITS.length;          // 3
  const N = NTIER * NUNIT;             // 15 playable states
  let GAMMA = 0.75;

  /* The buy-probability meter: pbuy[lever][tier]. HOLD demand collapses with
     age; DISCOUNT demand stays high until STALE. These are POSTED (the model
     is known) so the DP scene can compute Q* exactly. */
  const PBUY = {
    HOLD:     { FRESH: 0.55, OK: 0.42, AGING: 0.28, OLD: 0.15, STALE: 0.05 },
    DISCOUNT: { FRESH: 0.80, OK: 0.78, AGING: 0.74, OLD: 0.62, STALE: 0.25 },
  };
  const R_SALE  = { HOLD: 5, DISCOUNT: 2 };
  const R_DUMP  = -3;
  const R_SPOIL = -6;

  function tierIndex(t) { return TIERS.indexOf(t); }
  function nextTier(t) { const i = tierIndex(t); return i + 1 < NTIER ? TIERS[i + 1] : null; } // STALE -> null = SPOILED
  function buyProb(leverId, tier) { return (PBUY[leverId] && PBUY[leverId][tier] != null) ? PBUY[leverId][tier] : 0; }

  /*, State helpers, */
  function makeState(units, tier) { return { units, tier, terminal: false }; }
  const TERM_CLEARED = { terminal: true, cleared: true, spoiled: false };
  const TERM_SPOILED = { terminal: true, cleared: false, spoiled: true };

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return (s.units - 1) * NTIER + tierIndex(s.tier);
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    const u = Math.floor(i / NTIER) + 1;
    const t = TIERS[i % NTIER];
    return makeState(u, t);
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.cleared ? 'CLEARED' : 'SPOILED';
    return s.units + ',' + s.tier;
  }

  /* Board geometry: 5 rows (tiers) x 3 cols (units). FRESH at the top. */
  function row(s) { return (s && !s.terminal) ? tierIndex(s.tier) : 0; }
  function col(s) { return (s && !s.terminal) ? (s.units - 1) : 0; }

  /* Playable states in stateIndex order. */
  const NON_TERMINAL_STATES = [];
  for (let i = 0; i < N; i++) NON_TERMINAL_STATES.push(stateFromIndex(i));

  function initialState() { return makeState(3, 'FRESH'); }   // a fresh tray of 3

  /* All three levers are always legal here. Kept for interface parity with the
     gambler engine (sarsa.js calls availableStakeIds / availableBets). */
  const ALL_LEVERS = window.Levers.LEVER_IDS.slice();
  function availableStakeIds(_u) { return ALL_LEVERS.slice(); }
  function availableBets(_u) { return ALL_LEVERS.slice(); }
  function isLegal(_u, _leverId) { return true; }

  /*, One customer slot (one sample), */
  function sample(state, leverId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { lever: leverId, sold: false, aged: false, cleared: !!state.cleared, spoiled: !!state.spoiled } };
    }
    const u = state.units, t = state.tier;
    if (leverId === 'DUMP') {
      const sNext = makeState(u, 'FRESH');
      return { sNext, reward: R_DUMP, terminal: false,
        log: { lever: 'DUMP', sold: false, aged: false, dumped: true, tierBefore: t, tierAfter: 'FRESH', unitsBefore: u, unitsAfter: u } };
    }
    const pbuy = buyProb(leverId, t);
    const bought = rng() < pbuy;
    if (bought) {
      const rsale = R_SALE[leverId];
      if (u === 1) {
        return { sNext: TERM_CLEARED, reward: rsale, terminal: true,
          log: { lever: leverId, sold: true, aged: false, cleared: true, tierBefore: t, unitsBefore: u, unitsAfter: 0 } };
      }
      const sNext = makeState(u - 1, t);
      return { sNext, reward: rsale, terminal: false,
        log: { lever: leverId, sold: true, aged: false, tierBefore: t, tierAfter: t, unitsBefore: u, unitsAfter: u - 1 } };
    }
    /* no buy -> the whole batch ages one tier; STALE -> SPOILED */
    const nt = nextTier(t);
    if (nt === null) {
      return { sNext: TERM_SPOILED, reward: R_SPOIL, terminal: true,
        log: { lever: leverId, sold: false, aged: true, spoiled: true, tierBefore: t, unitsBefore: u } };
    }
    const sNext = makeState(u, nt);
    return { sNext, reward: 0, terminal: false,
      log: { lever: leverId, sold: false, aged: true, tierBefore: t, tierAfter: nt, unitsBefore: u, unitsAfter: u } };
  }

  /*, Successor enumeration (value iteration), */
  function successors(state, leverId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const u = state.units, t = state.tier;
    if (leverId === 'DUMP') {
      return [{ sNext: makeState(u, 'FRESH'), p: 1, reward: R_DUMP }];
    }
    const pbuy = buyProb(leverId, t);
    const rsale = R_SALE[leverId];
    const out = [];
    /* buy -> sell one unit, batch keeps tier */
    if (u === 1) out.push({ sNext: TERM_CLEARED, p: pbuy, reward: rsale });
    else out.push({ sNext: makeState(u - 1, t), p: pbuy, reward: rsale });
    /* no buy -> batch ages a tier; STALE -> SPOILED */
    const nt = nextTier(t);
    if (nt === null) out.push({ sNext: TERM_SPOILED, p: 1 - pbuy, reward: R_SPOIL });
    else out.push({ sNext: makeState(u, nt), p: 1 - pbuy, reward: 0 });
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
  function stateLabel(s) {
    if (!s) return '';
    if (s.terminal) return s.cleared ? 'CLEARED' : 'SPOILED';
    return s.units + 'x ' + s.tier;
  }
  function setGamma(g) { GAMMA = g; }
  function gamma() { return GAMMA; }

  window.Bakery = {
    TIERS, UNITS, NTIER, NUNIT, N,
    /* Grid dims for the display-case widget: 5 rows x 3 cols. */
    ROWS: NTIER, COLS: NUNIT,
    PBUY, R_SALE, R_DUMP, R_SPOIL,
    NON_TERMINAL_STATES,
    makeState, TERM_CLEARED, TERM_SPOILED,
    tierIndex, nextTier, buyProb,
    row, col, stateIndex, stateFromIndex, stateKey,
    initialState, sample, successors, successorsFromBuckets,
    makeRng,
    stateLabel,
    availableStakeIds, availableBets, isLegal,
    setGamma, gamma,
    LEVER_IDS: window.Levers.LEVER_IDS,
    LEVER_BY_ID: window.Levers.LEVER_BY_ID,
  };

  /* Legacy aliases for the reused engine (bellman.js reads window.Battle.*;
     some shared code references window.Gambler). */
  window.Battle = window.Bakery;
  window.Gambler = window.Bakery;
})();

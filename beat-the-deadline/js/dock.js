/* MDP transitions for Beat the Deadline (the loading-dock dispatch problem).
 *
 *   State s = (p, h):
 *     p = pallets waiting on the dock, p in {0,1,2,3,4}  (4 = a full truck-load)
 *     h = hours left until the deadline, h in {0,1,2,3,4}
 *     => 5 x 5 = 25 states, drawable as one grid (the Pokemon footprint).
 *     Board layout: rows = pallets (p = 4 at top, p = 0 at bottom),
 *                   columns = hours-left (h = 0 at left, h = 4 at right).
 *
 *   Action a in {WAIT, SEND} (window.Actions):
 *     SEND -> dispatch now. TERMINAL (the order window ends). Pays
 *             5*min(p,4) - 10 on an on-time ship (h >= 1), or -10 on the
 *             forced LATE ship at the h = 0 wall (5p - 10 - 5p = -10).
 *             Illegal at p = 0 (nothing to ship).
 *     WAIT -> hold one hour. Two dice:
 *             (1) deadline-risk die: w.p. miss(h) the shipment is BLOWN this
 *                 hour -> TERMINAL, reward -5p (the whole held load stranded).
 *             (2) if it survives (w.p. 1 - miss(h)): the clock ticks h -> h-1
 *                 and the arrival die rolls, w.p. 0.6 a pallet slides on
 *                 (p -> min(p+1, 4)), else p unchanged. Reward 0 on this
 *                 transition (the payoff comes when you finally SEND). Lands
 *                 in the non-terminal state (p', h-1).
 *             Illegal at h = 0 (the clock has expired -> forced SEND).
 *
 *   miss(h): deadline-blown probability, climbing as the clock runs down.
 *     h = 4 -> 0.0,  h = 3 -> 0.2,  h = 2 -> 0.4,  h = 1 -> 0.6.
 *
 *   Reward constants: deliver value +5 per pallet, truck cost -10 per
 *   dispatch, blown/late penalty -5 per held pallet. gamma = 1 (the deadline
 *   bounds the horizon, so no discount is needed).
 *
 *   Indexing mirrors the sibling engines so bellman.js / sarsa.js / the board
 *   widget reuse unchanged:
 *     stateIndex(p, h) = p * 5 + h   in 0..24
 *     NON_TERMINAL_STATES is built in the same order, so Q[stateIndex]
 *     aligns. ROWS = 5 (pallets), COLS = 5 (hours).
 *
 *   Two transition shapes, same names as the sibling window.Battle:
 *     sample(state, actionId, rng) -> { sNext, reward, terminal, log }
 *        one rolled outcome (playtest + TD learning). WAIT rolls both dice.
 *     successors(state, actionId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the outcomes (value iteration). A clamped
 *        (illegal) action returns [] so the Bellman backup scores it
 *        -Infinity and never picks it.
 *
 *   The arrival probability and the deadline-risk schedule are MUTABLE via
 *   setArrivalProb(q) / setMissSchedule(arr) so a "what if" slider can drag
 *   them; defaults are the spec values.
 *
 *   Exposed as window.Dock; aliased to window.Battle for the reused engine.
 *   New scene code should read window.Dock. */
(function () {
  const PMAX = 4;        // truck capacity (p = 4 is a full load)
  const HMAX = 4;        // hours on the clock at the start of a window
  const NP = PMAX + 1;   // 5 pallet levels
  const NH = HMAX + 1;   // 5 hour levels
  const N = NP * NH;     // 25 states

  /* Reward constants. */
  const VAL_PER_PALLET = 5;    // +5 delivered per pallet on an on-time ship
  const TRUCK_COST     = 10;   // -10 fixed truck cost per dispatch
  const LATE_PENALTY   = 5;    // -5 per held pallet if blown / shipped late

  /* Arrival probability (a pallet slides on during a surviving WAIT). */
  let ARRIVAL_P = 0.6;
  function setArrivalProb(q) { ARRIVAL_P = Math.max(0, Math.min(1, q)); }
  function arrivalProb() { return ARRIVAL_P; }

  /* Deadline-blown probability by hours-left. miss[h] for h = 0..4.
     h = 0 never WAITs (forced SEND) so miss[0] is unused; kept for shape. */
  let MISS = [0.0, 0.6, 0.4, 0.2, 0.0];   // index = h
  function setMissSchedule(arr) { if (Array.isArray(arr) && arr.length === NH) MISS = arr.slice(); }
  function missProb(h) { return MISS[h] || 0; }

  const ACTION_BY_ID = window.Actions.ACTION_BY_ID;
  const ACTION_IDS   = window.Actions.ACTION_IDS;   // [wait, send]

  /*, Board geometry (5 pallet rows x 5 hour cols), */
  /* Row 0 is the TOP of the rendered board (p = 4); row 4 is the bottom
     (p = 0). Col 0 is the leftmost (h = 0); col 4 the rightmost (h = 4). */
  function row(s) { return PMAX - palletsOf(s); }   // p=4 -> row 0, p=0 -> row 4
  function col(s) { return hoursOf(s); }            // h=0 -> col 0, h=4 -> col 4
  function palletsOf(s) { return (s && !s.terminal) ? s.p : 0; }
  function hoursOf(s)   { return (s && !s.terminal) ? s.h : 0; }

  /* Playable states in index order: stateIndex(p,h) = p*5 + h. */
  const NON_TERMINAL_STATES = [];
  for (let p = 0; p <= PMAX; p++) {
    for (let h = 0; h <= HMAX; h++) NON_TERMINAL_STATES.push({ p: p, h: h, terminal: false });
  }

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.p * NH + s.h;
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    return { p: Math.floor(i / NH), h: i % NH, terminal: false };
  }
  function stateFromPH(p, h) { return { p: p, h: h, terminal: false }; }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.kind ? s.kind.toUpperCase() : 'END';
    return 'p' + s.p + 'h' + s.h;
  }

  function initialState() { return { p: 2, h: 4, terminal: false }; }   // a fresh window

  /* Which levers are legal at (p, h):
       SEND legal iff p >= 1   (something to ship)
       WAIT legal iff h >= 1   (clock not expired)
     At least one is always legal at every state with (p>=1 or h>=1); the
     (0,0) corner is a degenerate empty/expired state (nothing happens). */
  function availableActionIds(p, h) {
    const out = [];
    if (h >= 1) out.push('wait');
    if (p >= 1) out.push('send');
    return out;
  }
  function availableActionIdsForState(s) {
    return s && !s.terminal ? availableActionIds(s.p, s.h) : [];
  }
  function isLegal(p, h, actionId) {
    if (actionId === 'wait') return h >= 1;
    if (actionId === 'send') return p >= 1;
    return false;
  }

  /*, SEND reward, */
  /* On-time ship (h >= 1): deliver value minus the fixed truck cost.
     Forced late ship at the wall (h = 0): 5p - 10 - 5p = -10. */
  function sendReward(p, h) {
    if (h <= 0) return VAL_PER_PALLET * Math.min(p, PMAX) - TRUCK_COST - LATE_PENALTY * p;
    return VAL_PER_PALLET * Math.min(p, PMAX) - TRUCK_COST;
  }
  function blownReward(p) { return -LATE_PENALTY * p; }

  /*, One rolled outcome (one sample), */
  function sample(state, actionId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { action: actionId, p: 0, h: 0 } };
    }
    const p = state.p, h = state.h;
    /* Empty-dock row (p = 0): nothing to ship or strand -> a value-0 terminal. */
    if (p === 0) {
      return { sNext: { terminal: true, kind: 'empty', goal: false, p: 0, h: h, reward: 0 },
        reward: 0, terminal: true, log: { action: actionId, empty: true, p: 0, h: h, reward: 0 } };
    }
    let id = actionId;
    /* Fall back to a legal lever if asked to play an illegal one, so a stray
       click never breaks the episode. */
    if (!isLegal(p, h, id)) {
      const legal = availableActionIds(p, h);
      id = legal[legal.length - 1] || 'send';
    }

    if (id === 'send') {
      const reward = sendReward(p, h);
      return {
        sNext: { terminal: true, kind: 'sent', goal: true, p: p, h: h, reward: reward },
        reward: reward, terminal: true,
        log: { action: 'send', late: h <= 0, p: p, h: h, delivered: Math.min(p, PMAX), reward: reward },
      };
    }

    /* WAIT: roll the deadline-risk die first, then (if survived) the arrival die. */
    const blown = rng() < missProb(h);
    if (blown) {
      const reward = blownReward(p);
      return {
        sNext: { terminal: true, kind: 'blown', goal: false, p: p, h: h, reward: reward },
        reward: reward, terminal: true,
        log: { action: 'wait', blown: true, arrived: false, p: p, h: h, reward: reward, missP: missProb(h) },
      };
    }
    const arrived = rng() < ARRIVAL_P;
    const pNext = arrived ? Math.min(p + 1, PMAX) : p;
    const hNext = h - 1;
    const sNext = { p: pNext, h: hNext, terminal: false };
    return {
      sNext: sNext, reward: 0, terminal: false,
      log: { action: 'wait', blown: false, arrived: arrived, p: p, h: h,
             pNext: pNext, hNext: hNext, reward: 0, missP: missProb(h) },
    };
  }

  /*, Successor enumeration (value iteration), */
  /* Returns the full outcome distribution for a LEGAL action; an illegal
     action returns [] so the backup scores it -Infinity (unavailable). */
  function successors(state, actionId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const p = state.p, h = state.h;
    /* Empty-dock row (p = 0): nothing waiting, nothing at stake. Both levers
       resolve to a value-0 terminal (no pallets to ship, none to strand), so
       V*(0, .) = 0 and this muted edge row never competes with the interior.
       Spec lists this row's policy as "--" (no interesting decision); the
       board widget renders it muted accordingly. */
    if (p === 0) return [{ sNext: { terminal: true, kind: 'empty' }, p: 1, reward: 0 }];
    if (!isLegal(p, h, actionId)) return [];

    if (actionId === 'send') {
      const reward = sendReward(p, h);
      return [{ sNext: { terminal: true, kind: 'sent' }, p: 1, reward: reward }];
    }

    /* WAIT */
    const out = [];
    const m = missProb(h);
    if (m > 0) out.push({ sNext: { terminal: true, kind: 'blown' }, p: m, reward: blownReward(p) });
    const survive = 1 - m;
    if (survive > 0) {
      const hNext = h - 1;
      const pUp = Math.min(p + 1, PMAX);
      out.push({ sNext: { p: pUp, h: hNext, terminal: false }, p: survive * ARRIVAL_P,     reward: 0 });
      out.push({ sNext: { p: p,   h: hNext, terminal: false }, p: survive * (1 - ARRIVAL_P), reward: 0 });
    }
    return out;
  }
  function successorsFromBuckets(s, actionId) { return successors(s, actionId); }

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
    if (s.terminal) return s.kind === 'blown' ? 'BLOWN' : 'SENT';
    return '(' + s.p + ',' + s.h + ')';
  }

  window.Dock = {
    PMAX, HMAX, NP, NH, N,
    VAL_PER_PALLET, TRUCK_COST, LATE_PENALTY,
    /* Grid dims for the board widget: 5 rows (pallets) x 5 cols (hours). */
    ROWS: NP, COLS: NH,
    NON_TERMINAL_STATES,
    row, col, palletsOf, hoursOf, stateIndex, stateFromIndex, stateFromPH, stateKey,
    initialState, sample, successors, successorsFromBuckets,
    makeRng,
    stateLabel, sendReward, blownReward,
    availableActionIds, availableActionIdsForState, isLegal,
    setArrivalProb, arrivalProb, setMissSchedule, missProb,
    ACTION_IDS, ACTION_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Dock;
})();

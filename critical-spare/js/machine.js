/* MDP transitions for Critical Spare (the gallery's machine-maintenance game).
 *
 *   State s = (health, spares):
 *     health  in {HEALTHY (0), AGING (1), FAILING (2)} -- a condition gauge.
 *     spares  in {0, 1, 2}                              -- parts in the bin.
 *   That is 3 x 3 = 9 states. The whole world fits in a 3x3 MAINTENANCE GRID:
 *   health labels the rows (HEALTHY top, FAILING bottom), spares the columns
 *   (0 / 1 / 2 left to right). Each cell carries up to three lever-values, so
 *   the entire Q-table is one compact board. There are NO terminal states:
 *   this is an ongoing operation, optimised with discount gamma = 0.9 (the
 *   on-screen "12-turn quarter" is the narrative wrapper; the maths is the
 *   clean infinite-horizon discounted return so every value is single-digit
 *   and hand-checkable).
 *
 *   Action a = one of three levers (window.Levers):
 *     RUN     -- keep producing this turn (earn, but risk a breakdown).
 *     ORDER   -- buy one spare into the bin (pay; earns nothing this turn).
 *     REPLACE -- consume a spare to refurbish the machine to HEALTHY (planned
 *                swap; only legal when spares >= 1; clamped otherwise).
 *
 *   Transition (the visible dice):
 *     RUN spins a FAILURE DIE whose red slice grows with wear:
 *        P(fail) = 0% if HEALTHY, 30% if AGING, 70% if FAILING.
 *       - fail with a spare on hand: the spare is auto-consumed in a rushed
 *         EMERGENCY swap, machine -> HEALTHY, reward -3.
 *       - fail with an EMPTY bin: WAITING-FOR-PART downtime, machine ->
 *         FAILING, spares stay 0, reward -8.
 *       - no failure (+3 revenue): the machine ages one notch on a COIN FLIP
 *         (HEALTHY->{HEALTHY,AGING} 50/50; AGING->{AGING,FAILING} 50/50;
 *         FAILING->FAILING). Spares unchanged.
 *     ORDER (reward -2): spares -> min(spares + 1, 2); health unchanged.
 *     REPLACE (reward 0): spares - 1; machine -> HEALTHY; (health otherwise
 *                unchanged is moot -- it becomes HEALTHY).
 *     HOLDING COST -1 x (spares in the bin) is added to EVERY turn's reward,
 *     whatever the action.
 *
 *   Indexing mirrors the gallery engines so bellman.js / sarsa.js / the grid
 *   widget reuse unchanged:
 *     stateIndex(s) = health * 3 + spares   in 0..8
 *     NON_TERMINAL_STATES is built in that order, so Q[stateIndex] aligns.
 *     ROWS = 3 (health), COLS = 3 (spares).
 *
 *   Two transition shapes, same names as the gallery's window.Battle:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal:false, log }
 *        one rolled turn (playtest + SARSA).
 *     successors(state, leverId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the dice (value iteration). A clamped lever
 *        returns [] so the Bellman backup scores it -Infinity and never picks
 *        it.
 *
 *   Exposed as window.Machine; aliased to window.Battle for the reused engine
 *   files. New scene code should read window.Machine. */
(function () {
  const NH = 3;                       // health levels
  const NS = 3;                       // spare slots (0..2)
  const N  = NH * NS;                 // 9 states
  const GAMMA = 0.9;
  const HEALTH = ['HEALTHY', 'AGING', 'FAILING'];
  const HEALTH_SHORT = ['H', 'A', 'F'];
  const P_FAIL = [0.0, 0.30, 0.70];   // failure prob on RUN, by health

  const LEVER_BY_ID = window.Levers.LEVER_BY_ID;
  const LEVER_IDS   = window.Levers.LEVER_IDS;

  /* ---------- State helpers ---------- */
  function mk(h, s) { return { h: h, s: s, terminal: false }; }
  function stateIndex(st) { return (st && !st.terminal) ? st.h * NS + st.s : -1; }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    return mk(Math.floor(i / NS), i % NS);
  }
  function stateKey(st) { return st ? ('h' + st.h + 's' + st.s) : ''; }

  /* Grid geometry: health = row (HEALTHY top = row 0), spares = column. */
  function row(st) { return st ? st.h : 0; }
  function col(st) { return st ? st.s : 0; }

  const NON_TERMINAL_STATES = [];
  for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) NON_TERMINAL_STATES.push(mk(h, s));

  function initialState() { return mk(0, 0); }   // HEALTHY, empty bin -- the cold start

  /* ---------- Legality ---------- */
  /* RUN and ORDER always; REPLACE only when a spare is on hand. */
  function availableLeverIds(st) {
    const out = ['run', 'order'];
    if (st && st.s >= 1) out.push('replace');
    return out;
  }
  function availableLeverIdsHS(h, s) { return availableLeverIds(mk(h, s)); }
  function isLegal(st, leverId) {
    if (leverId === 'replace') return !!st && st.s >= 1;
    return leverId === 'run' || leverId === 'order';
  }

  /* ---------- Successor enumeration (value iteration) ----------
     Holding cost -1 * spares is folded into every reward. A clamped lever
     (REPLACE with an empty bin) returns [] so the backup treats it as
     -Infinity (unavailable). */
  function successors(st, leverId) {
    if (!st || st.terminal) return [{ sNext: st, p: 1, reward: 0 }];
    const h = st.h, s = st.s;
    const hold = -1 * s;
    if (leverId === 'order') {
      return [{ sNext: mk(h, Math.min(s + 1, 2)), p: 1, reward: -2 + hold }];
    }
    if (leverId === 'replace') {
      if (s < 1) return [];                                  // clamped
      return [{ sNext: mk(0, s - 1), p: 1, reward: 0 + hold }];
    }
    /* RUN */
    const pf = P_FAIL[h];
    const out = [];
    if (pf > 0) {
      if (s >= 1) out.push({ sNext: mk(0, s - 1), p: pf, reward: -3 + hold });  // emergency swap
      else        out.push({ sNext: mk(2, 0),     p: pf, reward: -8 + hold });  // downtime
    }
    const pnf = 1 - pf;
    if (pnf > 0) {
      if (h === 0) {
        out.push({ sNext: mk(0, s), p: pnf * 0.5, reward: 3 + hold });
        out.push({ sNext: mk(1, s), p: pnf * 0.5, reward: 3 + hold });
      } else if (h === 1) {
        out.push({ sNext: mk(1, s), p: pnf * 0.5, reward: 3 + hold });
        out.push({ sNext: mk(2, s), p: pnf * 0.5, reward: 3 + hold });
      } else {
        out.push({ sNext: mk(2, s), p: pnf, reward: 3 + hold });
      }
    }
    return out;
  }
  function successorsFromBuckets(st, leverId) { return successors(st, leverId); }

  /* ---------- One rolled turn (one sample) ---------- */
  function sample(st, leverId, rng) {
    const h = st.h, s = st.s;
    const hold = -1 * s;
    if (leverId === 'order') {
      const sNext = mk(h, Math.min(s + 1, 2));
      return { sNext, reward: -2 + hold, terminal: false,
        log: { lever: 'order', kind: 'order', hBefore: h, sBefore: s, hAfter: sNext.h, sAfter: sNext.s, reward: -2 + hold } };
    }
    if (leverId === 'replace') {
      const legal = s >= 1;
      const sNext = legal ? mk(0, s - 1) : mk(h, s);
      const r = legal ? (0 + hold) : (0 + hold);
      return { sNext, reward: r, terminal: false,
        log: { lever: 'replace', kind: legal ? 'replace' : 'noop', hBefore: h, sBefore: s, hAfter: sNext.h, sAfter: sNext.s, reward: r } };
    }
    /* RUN: roll the failure die. */
    const pf = P_FAIL[h];
    const failed = rng() < pf;
    if (failed) {
      if (s >= 1) {
        const sNext = mk(0, s - 1);
        return { sNext, reward: -3 + hold, terminal: false,
          log: { lever: 'run', kind: 'emergency', failed: true, hBefore: h, sBefore: s, hAfter: 0, sAfter: s - 1, reward: -3 + hold } };
      }
      const sNext = mk(2, 0);
      return { sNext, reward: -8 + hold, terminal: false,
        log: { lever: 'run', kind: 'downtime', failed: true, hBefore: h, sBefore: s, hAfter: 2, sAfter: 0, reward: -8 + hold } };
    }
    /* survived: +3, age on a coin flip */
    let h2 = h;
    let aged = false;
    if (h === 0) { aged = rng() < 0.5; h2 = aged ? 1 : 0; }
    else if (h === 1) { aged = rng() < 0.5; h2 = aged ? 2 : 1; }
    else { h2 = 2; }
    const sNext = mk(h2, s);
    return { sNext, reward: 3 + hold, terminal: false,
      log: { lever: 'run', kind: 'survive', failed: false, aged: aged, hBefore: h, sBefore: s, hAfter: h2, sAfter: s, reward: 3 + hold } };
  }

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
  function healthName(h) { return HEALTH[h] || ''; }
  function healthShort(h) { return HEALTH_SHORT[h] || ''; }
  function stateLabel(st) {
    if (!st) return '';
    return HEALTH[st.h] + ' / ' + st.s + ' SP';
  }
  function pFail(h) { return P_FAIL[h]; }

  window.Machine = {
    NH, NS, N, GAMMA, HEALTH, HEALTH_SHORT, P_FAIL,
    ROWS: NH, COLS: NS,
    NON_TERMINAL_STATES,
    mk, stateIndex, stateFromIndex, stateKey, row, col,
    initialState, successors, successorsFromBuckets, sample,
    makeRng,
    availableLeverIds, availableLeverIdsHS, isLegal,
    healthName, healthShort, stateLabel, pFail,
    LEVER_IDS, LEVER_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Machine;
})();

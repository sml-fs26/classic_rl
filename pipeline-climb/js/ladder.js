/* The Pipeline Climb MDP: a lead climbing a 5-rung ladder.
 *
 *   State `s`: the lead's pipeline stage, one of 5 living rungs
 *     COLD(0) CURIOUS(1) ENGAGED(2) EVALUATING(3) READY(4).
 *   Two off-grid terminals: SIGNED (+30, deal won) and LOST (-10, dropped out).
 *   Action `a`: one of 3 levers (NURTURE / DEMO / HARD CLOSE), soft to aggressive.
 *
 *   Transition (the visible STAGE DIE): after every lever the world rolls a
 *   3-faced die that reads UP a rung / STAY / DOWN a rung. The per-stage
 *   odds are printed next to the die so the randomness is honest.
 *     - UP from READY stays READY (top of the ladder).
 *     - DOWN from COLD drops out to LOST (-10).
 *     - HARD CLOSE below READY is the burn branch (.05 up / .20 stay / .75 down).
 *     - HARD CLOSE at READY: .70 -> SIGNED(+30) / .10 stay / .20 cool (down to EVALUATING).
 *
 *   Reward: -1 per touch (rep time), paid on every NON-terminating move; the
 *   terminating touch pays +30 (SIGNED) or -10 (LOST) INSTEAD of -1. gamma = 1.
 *
 *   This module mirrors the Pokemon-battle MDP surface so the reused
 *   bellman.js (value iteration) and sarsa.js run unchanged. Two shapes:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal, log }
 *        one stochastic draw (playtest, SARSA, trajectory tape).
 *     successors(state, leverId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the 3 die faces (value iteration).
 *
 *   Exposed as window.Pipeline and aliased to window.Battle so bellman.js
 *   (reads window.Battle.NON_TERMINAL_STATES / successorsFromBuckets /
 *   stateIndex) and sarsa.js work without edits, with A = 3.
 */
(function () {

  /* ---------- Rungs (the 5 living states) ---------- */
  const NUM_RUNGS = 5;
  const RUNGS = ['cold', 'curious', 'engaged', 'evaluating', 'ready'];
  const RUNG_IDX = { cold: 0, curious: 1, engaged: 2, evaluating: 3, ready: 4 };
  const RUNG_DISPLAY = ['COLD', 'CURIOUS', 'ENGAGED', 'EVALUATING', 'READY'];
  const COLD = 0;
  const READY = NUM_RUNGS - 1;     // 4

  /* Terminal payoffs. */
  const SIGNED_REWARD = +30;
  const LOST_REWARD   = -10;
  const TOUCH_REWARD  = -1;        // every non-terminating move
  const GAMMA         = 1;

  /* ---------- The STAGE DIE: up/stay/down per stage x lever ----------
     Rows are rungs 0..4; each entry is [pUp, pStay, pDown].
     HARD CLOSE at READY is special-cased in successors()/sample() because
     its UP face means SIGNED (a terminal), not a rung step. The .05/.20/.75
     row below stands in for the burn branch at COLD..EVALUATING; the READY
     row's three numbers are .70 (-> SIGNED) / .10 stay / .20 cool (down). */
  const STAGE_DIE = {
    nurture: [
      [0.60, 0.30, 0.10],   // COLD
      [0.45, 0.40, 0.15],   // CURIOUS
      [0.35, 0.45, 0.20],   // ENGAGED
      [0.25, 0.50, 0.25],   // EVALUATING
      [0.10, 0.60, 0.30],   // READY
    ],
    demo: [
      [0.25, 0.30, 0.45],   // COLD
      [0.65, 0.25, 0.10],   // CURIOUS
      [0.65, 0.25, 0.10],   // ENGAGED
      [0.60, 0.30, 0.10],   // EVALUATING
      [0.25, 0.55, 0.20],   // READY
    ],
    hardclose: [
      [0.05, 0.20, 0.75],   // COLD        (burn)
      [0.05, 0.20, 0.75],   // CURIOUS     (burn)
      [0.05, 0.20, 0.75],   // ENGAGED     (burn)
      [0.05, 0.20, 0.75],   // EVALUATING  (burn)
      [0.70, 0.10, 0.20],   // READY       .70 SIGNED / .10 stay / .20 cool
    ],
  };

  /* ---------- States ---------- */
  function initialState() { return { rung: COLD, terminal: false }; }

  /* The 5 non-terminal states, index order 0..4 (COLD..READY). */
  const NON_TERMINAL_STATES = [];
  for (let r = 0; r < NUM_RUNGS; r++) {
    NON_TERMINAL_STATES.push({ rung: r, terminal: false });
  }

  /* Index a state by its rung. Terminals are off-grid (-1). */
  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.rung;
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= NUM_RUNGS) return null;
    return { rung: i, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.signed ? 'SIGNED' : (s.lost ? 'LOST' : 'T?');
    return String(s.rung);
  }
  function rungName(idx) {
    if (idx < 0 || idx >= NUM_RUNGS) return '';
    return RUNG_DISPLAY[idx];
  }

  /* Terminal-state constructors (off-grid). */
  function signedState() { return { terminal: true, signed: true, lost: false }; }
  function lostState()   { return { terminal: true, signed: false, lost: true }; }

  /* ---------- successors(state, leverId): full enumeration ----------
     Returns the three die-face branches with aggregated probabilities.
     sNext is either a terminal ({signed:true}/{lost:true}) or a living
     {rung, terminal:false}. Reward is baked in: -1 on a non-terminating
     face, +30 on SIGNED, -10 on LOST. */
  function successors(state, leverId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const r = state.rung;
    const [pUp, pStay, pDown] = STAGE_DIE[leverId][r];

    const out = [];

    /* Special case: HARD CLOSE at READY. UP face -> SIGNED (+30, terminal);
       STAY -> stays READY (-1); DOWN -> cools to EVALUATING (-1). */
    if (leverId === 'hardclose' && r === READY) {
      if (pUp > 0)   out.push({ sNext: signedState(), p: pUp, reward: SIGNED_REWARD });
      if (pStay > 0) out.push({ sNext: { rung: READY, terminal: false }, p: pStay, reward: TOUCH_REWARD });
      if (pDown > 0) out.push({ sNext: { rung: READY - 1, terminal: false }, p: pDown, reward: TOUCH_REWARD });
      return out;
    }

    /* UP face: climb a rung, clamped at READY (UP from READY stays READY). */
    if (pUp > 0) {
      const up = Math.min(READY, r + 1);
      out.push({ sNext: { rung: up, terminal: false }, p: pUp, reward: TOUCH_REWARD });
    }
    /* STAY face: same rung. */
    if (pStay > 0) {
      out.push({ sNext: { rung: r, terminal: false }, p: pStay, reward: TOUCH_REWARD });
    }
    /* DOWN face: drop a rung; DOWN from COLD drops out to LOST (-10). */
    if (pDown > 0) {
      if (r === COLD) {
        out.push({ sNext: lostState(), p: pDown, reward: LOST_REWARD });
      } else {
        out.push({ sNext: { rung: r - 1, terminal: false }, p: pDown, reward: TOUCH_REWARD });
      }
    }
    return out;
  }
  /* Alias name expected by the reused bellman.js. */
  function successorsFromBuckets(s, leverId) { return successors(s, leverId); }

  /* ---------- sample(state, leverId, rng): one stochastic draw ----------
     Rolls the STAGE DIE once and returns the resulting transition plus a
     rich `log` the scenes use to narrate the die (face, from/to rung,
     signed/lost). face is 'up' | 'stay' | 'down'. */
  function sample(state, leverId, rng) {
    if (state.terminal) {
      return {
        sNext: state, reward: 0, terminal: true,
        log: { lever: leverId, face: null, fromRung: -1, toRung: -1,
               signed: !!state.signed, lost: !!state.lost },
      };
    }

    const r = state.rung;
    const [pUp, pStay] = STAGE_DIE[leverId][r];
    const u = rng();
    let face;
    if (u < pUp) face = 'up';
    else if (u < pUp + pStay) face = 'stay';
    else face = 'down';

    const log = {
      lever: leverId, face,
      fromRung: r, toRung: r,
      signed: false, lost: false,
    };

    /* HARD CLOSE at READY: UP -> SIGNED, STAY -> READY, DOWN -> EVALUATING. */
    if (leverId === 'hardclose' && r === READY) {
      if (face === 'up') {
        log.signed = true; log.toRung = -1;
        return { sNext: signedState(), reward: SIGNED_REWARD, terminal: true, log };
      }
      if (face === 'stay') {
        log.toRung = READY;
        return { sNext: { rung: READY, terminal: false }, reward: TOUCH_REWARD, terminal: false, log };
      }
      log.toRung = READY - 1;       // cool
      return { sNext: { rung: READY - 1, terminal: false }, reward: TOUCH_REWARD, terminal: false, log };
    }

    if (face === 'up') {
      const up = Math.min(READY, r + 1);
      log.toRung = up;
      return { sNext: { rung: up, terminal: false }, reward: TOUCH_REWARD, terminal: false, log };
    }
    if (face === 'stay') {
      log.toRung = r;
      return { sNext: { rung: r, terminal: false }, reward: TOUCH_REWARD, terminal: false, log };
    }
    /* DOWN. */
    if (r === COLD) {
      log.lost = true; log.toRung = -1;
      return { sNext: lostState(), reward: LOST_REWARD, terminal: true, log };
    }
    log.toRung = r - 1;
    return { sNext: { rung: r - 1, terminal: false }, reward: TOUCH_REWARD, terminal: false, log };
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

  window.Pipeline = {
    /* dimensions / vocabulary */
    NUM_RUNGS, RUNGS, RUNG_IDX, RUNG_DISPLAY, COLD, READY,
    SIGNED_REWARD, LOST_REWARD, TOUCH_REWARD, GAMMA,
    STAGE_DIE,
    NON_TERMINAL_STATES,
    /* states */
    initialState, signedState, lostState,
    stateIndex, stateFromIndex, stateKey, rungName,
    /* transitions */
    sample, successors, successorsFromBuckets,
    /* rng */
    makeRng,
  };
  /* Alias so the reused engine (bellman.js, sarsa.js) reads it as Battle. */
  window.Battle = window.Pipeline;
})();

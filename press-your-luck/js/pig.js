/* Press Your Luck (Pig) - the MDP engine.
 *
 *   Two-player race to TARGET banked points against a FIXED rival ("the
 *   house holds at 20"). Pinning the rival makes this a single-agent MDP
 *   with a genuinely 2-D state, and a state value is literally a WIN
 *   PROBABILITY (gamma = 1, reward +1 for winning the game, 0 for losing).
 *
 *   EXACT STATE on my turn: (my, riv, pot)
 *     my  = my banked score
 *     riv = rival banked score
 *     pot = current turn-pot (at risk this turn, not yet banked)
 *
 *   ACTIONS: ROLL or HOLD.
 *     ROLL: a fair d6. Faces 2..6 add the face value to the pot and my turn
 *           continues. A 1 busts: pot -> 0, the turn passes to the rival,
 *           my banked score is unchanged.
 *     HOLD: my += pot, the turn passes to the rival.
 *
 *   THE RIVAL (fixed): on its turn it rolls until its turn-pot reaches 20
 *   OR it can win (riv + rpot >= TARGET), then it holds; it busts on a 1.
 *
 *   COUPLING: my value bootstraps on the rival-turn outcome, which in turn
 *   bootstraps back on my start-of-turn value. We resolve it by value
 *   iteration over Vmy[my][riv] = the win prob at the START of my turn
 *   (pot = 0). ~40 sweeps reach a fixed point at TARGET = 50.
 *
 *   This module is aliased to window.Battle so the reused bellman.js /
 *   sarsa.js read its NON_TERMINAL_STATES / stateIndex / successors over the
 *   18-cell DISPLAY abstraction:
 *     pot bucket p in {0, 1-5, 6-10, 11-15, 16-20, 21+}  (6 buckets)
 *     standing  c in {BEHIND, EVEN, AHEAD}               (3 buckets)
 *     stateIndex = potBucket * 3 + standing               (18 cells)
 *   The display MDP is a coarse projection used only for the DP scene and
 *   the SARSA target; the exact-state DP above is the ground truth.
 */
(function () {
  const TARGET = 50;          // race to 50 banked points
  const BUST_FACE = 1;        // a rolled 1 wipes the turn-pot
  const RIVAL_HOLD = 20;      // the house holds at 20
  const ROLL_FACES = [1, 2, 3, 4, 5, 6];
  const ROLL_GAIN = [2, 3, 4, 5, 6];     // non-bust faces add their value
  const P_FACE = 1 / 6;

  /*, Display bucketing, */
  /* Pot buckets: 0 / 1-5 / 6-10 / 11-15 / 16-20 / 21+  -> 0..5.
     Representative (midpoint) pot per bucket, used to project the exact
     optimal action onto each display cell. Bucket 0 is the empty pot. */
  const POT_BUCKETS = 6;
  const POT_BUCKET_LABELS = ['0', '1-5', '6-10', '11-15', '16-20', '21+'];
  const POT_BUCKET_REP = [0, 3, 8, 13, 18, 24];   // representative pot per bucket

  function bucketOfPot(pot) {
    if (pot <= 0) return 0;
    if (pot <= 5) return 1;
    if (pot <= 10) return 2;
    if (pot <= 15) return 3;
    if (pot <= 20) return 4;
    return 5;
  }

  /* Standing: BEHIND (0) / EVEN (1) / AHEAD (2), from banked scores. */
  const STANDINGS = 3;
  const STANDING_LABELS = ['BEHIND', 'EVEN', 'AHEAD'];
  function standingOf(my, riv) {
    if (my < riv) return 0;   // BEHIND
    if (my > riv) return 2;   // AHEAD
    return 1;                 // EVEN
  }
  /* Representative (my, riv) per standing, used to project the exact DP
     onto display cells. Mid-game scores well below TARGET so the projected
     policy reflects the canonical mid-game frontier. */
  const STANDING_REP = [
    { my: 10, riv: 25 },   // BEHIND
    { my: 20, riv: 20 },   // EVEN
    { my: 25, riv: 10 },   // AHEAD
  ];

  /* 18-cell display index: potBucket * 3 + standing (row-major over the
     6x3 board, pot bucket 0 at the bottom .. 21+ at the top). */
  function displayIndex(potBucket, standing) { return potBucket * STANDINGS + standing; }
  function decodeDisplayIndex(i) {
    return { potBucket: Math.floor(i / STANDINGS), standing: i % STANDINGS };
  }
  /* Representative exact state (my, riv, pot) for a display cell - the
     standing's representative scores + the bucket's representative pot. */
  function repStateForCell(i) {
    const { potBucket, standing } = decodeDisplayIndex(i);
    const rep = STANDING_REP[standing];
    return { my: rep.my, riv: rep.riv, pot: POT_BUCKET_REP[potBucket] };
  }

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

  /* ===================================================================
     EXACT-STATE WIN-PROBABILITY DYNAMIC PROGRAMMING
     ===================================================================
     Vmy[my][riv] = win prob at the START of my turn (pot 0), both banked
     scores < TARGET. Iterated to a fixed point. Everything else
     (Vturn, rivalTurnValue, Q) is computed against a frozen Vmy snapshot.
  */

  let _Vmy = null;            // Float64Array length TARGET*TARGET (my*TARGET+riv)
  let _solved = false;

  /* Per-snapshot memo tables. Vmy is frozen while we evaluate Vturn /
     rivCont against it, so these caches are valid until Vmy changes. They
     are cleared at the start of each sweep (and on solve()). Without them
     the pot/rpot recursions fan out exponentially. */
  let _memoRiv = new Map();   // key (my*TARGET+riv)*64 + rpot -> P(I win)
  let _memoTurn = new Map();  // key (my*TARGET+riv)*128 + pot  -> {roll,hold}
  function clearMemo() { _memoRiv.clear(); _memoTurn.clear(); }

  function vmyIdx(my, riv) { return my * TARGET + riv; }
  function getVmy(my, riv) {
    /* Terminal banked scores are absorbing and never the "start of my
       turn" - guard anyway so the recursions stay total. */
    if (my >= TARGET) return 1;
    if (riv >= TARGET) return 0;
    return _Vmy ? _Vmy[vmyIdx(my, riv)] : 0;
  }

  /* RivCont(my, riv, rpot): P(I win) when it is the rival's turn, the
     rival is mid-turn with pot rpot, and now decides per its fixed rule.
     Reads the frozen Vmy snapshot for the my-turn continuation. */
  function rivCont(my, riv, rpot) {
    /* Rival's rule: hold once rpot >= RIVAL_HOLD or it can win. */
    const rivalHolds = (rpot >= RIVAL_HOLD) || (riv + rpot >= TARGET);
    if (rivalHolds) {
      const rivNew = riv + rpot;
      if (rivNew >= TARGET) return 0;       // rival wins -> I lose
      return getVmy(my, rivNew);            // back to my turn at pot 0
    }
    const mk = (my * TARGET + riv) * 64 + rpot;
    const cached = _memoRiv.get(mk);
    if (cached !== undefined) return cached;
    /* Rival rolls. */
    let v = 0;
    // bust (face 1): rival pot wiped, turn passes to me, riv unchanged.
    v += P_FACE * getVmy(my, riv);
    for (const f of ROLL_GAIN) {
      v += P_FACE * rivCont(my, riv, rpot + f);
    }
    _memoRiv.set(mk, v);
    return v;
  }
  function rivalTurnValue(my, riv) { return rivCont(my, riv, 0); }

  /* Vturn(my, riv, pot): optimal value DURING my turn with the current pot
     (before I decide), against the frozen Vmy snapshot. Once banking would
     win outright (my + pot >= TARGET) the optimal value is 1 and we stop -
     this also bottoms out the ROLL recursion, since the pot grows by >= 2
     each roll and eventually crosses TARGET. */
  function vturn(my, riv, pot) {
    if (my + pot >= TARGET) return 1;                 // hold and win
    const q = qExact(my, riv, pot);
    return q.roll > q.hold ? q.roll : q.hold;
  }

  /* Q(my, riv, pot) -> { roll, hold } against the frozen Vmy snapshot. */
  function qExact(my, riv, pot) {
    const mk = (my * TARGET + riv) * 128 + pot;
    const cached = _memoTurn.get(mk);
    if (cached !== undefined) return cached;
    /* HOLD: bank the pot. */
    const myAfter = my + pot;
    let qHold;
    if (myAfter >= TARGET) qHold = 1;                 // banking wins outright
    else qHold = rivalTurnValue(myAfter, riv);        // turn passes to rival

    /* ROLL: a fair d6. */
    let qRoll = 0;
    // bust (face 1): pot -> 0, turn passes to rival, my unchanged.
    qRoll += P_FACE * rivalTurnValue(my, riv);
    for (const f of ROLL_GAIN) {
      // face 2..6: pot grows, my turn continues -> optimal continuation.
      // vturn caps at 1 once my + pot crosses TARGET, so this terminates.
      qRoll += P_FACE * vturn(my, riv, pot + f);
    }
    const out = { roll: qRoll, hold: qHold };
    _memoTurn.set(mk, out);
    return out;
  }

  /* One full sweep updating Vmy[my][riv] = Vturn(my, riv, 0). Returns the
     max absolute change so the driver can watch convergence. */
  function sweepVmy() {
    clearMemo();                 // memo is keyed to the current (frozen) Vmy
    const next = new Float64Array(TARGET * TARGET);
    let maxDelta = 0;
    for (let my = 0; my < TARGET; my++) {
      for (let riv = 0; riv < TARGET; riv++) {
        const v = vturn(my, riv, 0);
        next[vmyIdx(my, riv)] = v;
        const d = Math.abs(v - _Vmy[vmyIdx(my, riv)]);
        if (d > maxDelta) maxDelta = d;
      }
    }
    _Vmy = next;
    return maxDelta;
  }

  /* Solve the exact win-prob DP to a fixed point. Idempotent: returns the
     cached solution once solved (cold scene entry just calls solve()). */
  function solve(opts) {
    if (_solved && !(opts && opts.force)) return { sweeps: 0, cached: true };
    const o = opts || {};
    const maxSweeps = o.maxSweeps || 80;
    const tol = o.tol != null ? o.tol : 1e-9;
    _Vmy = new Float64Array(TARGET * TARGET);   // win prob seeded to 0
    let sweeps = 0;
    for (let k = 1; k <= maxSweeps; k++) {
      const d = sweepVmy();
      sweeps = k;
      if (d < tol) break;
    }
    /* The memo now holds values computed against the PRE-final Vmy (it was
       cleared at the top of the last sweep, then filled, then Vmy was
       swapped). Clear it so the public accessors recompute against the
       final, converged Vmy. */
    clearMemo();
    _solved = true;
    return { sweeps, cached: false };
  }

  /* Public exact-state accessors (solve lazily on first call). */
  function winProb(my, riv, pot) {
    if (!_solved) solve();
    if (my >= TARGET) return 1;
    if (riv >= TARGET) return 0;
    return vturn(my, riv, pot || 0);
  }
  function Q(my, riv, pot) {
    if (!_solved) solve();
    return qExact(my, riv, pot || 0);
  }
  /* Smallest pot at which HOLD beats ROLL for a representative standing -
     the hold-threshold used to draw the staircase. Returns Infinity if the
     agent never prefers holding below TARGET (the "rolls on forever" case). */
  function holdThreshold(my, riv) {
    if (!_solved) solve();
    const cap = TARGET - my + 6;
    for (let pot = 1; pot <= cap; pot++) {
      const q = qExact(my, riv, pot);
      if (q.hold >= q.roll) return pot;
    }
    return Infinity;
  }

  /* ===================================================================
     PLAYABLE GAME (one stochastic draw per decision)
     ===================================================================
  */
  function initialState() { return { my: 0, riv: 0, pot: 0, turn: 'me', terminal: false }; }

  /* sample(state, leverId, rng): apply ONE of my decisions.
     Returns { sNext, reward, terminal, win, lose, log }.
     - On HOLD or a bust, the turn passes to the rival; sNext.turn = 'rival'
       and the caller should run rivalTurn() to resolve it. We do NOT bake
       the rival's turn into sample() so scene animations can stage them. */
  function sample(state, leverId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true, win: !!state.win, lose: !!state.lose,
        log: { lever: leverId, busted: false, face: 0, gain: 0 } };
    }
    const my = state.my, riv = state.riv, pot = state.pot;
    if (leverId === 'hold') {
      const myAfter = my + pot;
      if (myAfter >= TARGET) {
        return { sNext: { my: myAfter, riv, pot: 0, turn: 'done', terminal: true, win: true, lose: false },
          reward: 1, terminal: true, win: true, lose: false,
          log: { lever: 'hold', busted: false, face: 0, gain: 0, banked: pot, myAfter } };
      }
      return { sNext: { my: myAfter, riv, pot: 0, turn: 'rival', terminal: false },
        reward: 0, terminal: false, win: false, lose: false,
        log: { lever: 'hold', busted: false, face: 0, gain: 0, banked: pot, myAfter } };
    }
    /* ROLL: a fair d6. */
    const face = 1 + Math.floor((rng ? rng() : Math.random()) * 6);
    if (face === BUST_FACE) {
      return { sNext: { my, riv, pot: 0, turn: 'rival', terminal: false },
        reward: 0, terminal: false, win: false, lose: false,
        log: { lever: 'roll', busted: true, face: 1, gain: 0 } };
    }
    return { sNext: { my, riv, pot: pot + face, turn: 'me', terminal: false },
      reward: 0, terminal: false, win: false, lose: false,
      log: { lever: 'roll', busted: false, face, gain: face, pot: pot + face } };
  }

  /* step(state, leverId, rng): alias used by scenes that prefer the name. */
  function step(state, leverId, rng) { return sample(state, leverId, rng); }

  /* rivalTurn(my, riv, rng): play the rival's whole fixed-rule turn.
     Returns the resulting banked scores and whether the rival won, plus a
     per-roll log the animation can replay. After this it is my turn again
     at pot 0 (unless the rival won). */
  function rivalTurn(my, riv, rng) {
    let rpot = 0;
    const rolls = [];
    while (true) {
      const rivalHolds = (rpot >= RIVAL_HOLD) || (riv + rpot >= TARGET);
      if (rivalHolds) {
        const rivNew = riv + rpot;
        rolls.push({ kind: 'hold', rpot, rivNew });
        const rivalWon = rivNew >= TARGET;
        return {
          my, riv: rivNew, pot: 0,
          turn: rivalWon ? 'done' : 'me',
          terminal: rivalWon, win: false, lose: rivalWon,
          rivalWon, rolls,
        };
      }
      const face = 1 + Math.floor((rng ? rng() : Math.random()) * 6);
      if (face === BUST_FACE) {
        rolls.push({ kind: 'bust', face: 1, rpotBefore: rpot });
        return { my, riv, pot: 0, turn: 'me', terminal: false, win: false, lose: false,
          rivalWon: false, rolls };
      }
      rpot += face;
      rolls.push({ kind: 'roll', face, rpot });
    }
  }

  /* ===================================================================
     DISPLAY-MDP SURFACE for the reused bellman.js / sarsa.js / qtable.js
     ===================================================================
     The 18-cell bucketed MDP. NON_TERMINAL_STATES are the 18 display
     cells; stateIndex maps a display cell to 0..17. successors() over the
     bucketed MDP is intentionally NOT exposed for a literal Bellman sweep
     (the bucketed dynamics are non-Markov); the DP scene animates the
     stored exact oracle instead. We DO expose the bucketing + a sample
     over buckets so SARSA can observe (potBucket, standing) while playing
     the real game.
  */
  const NUM_BUCKETS = POT_BUCKETS;          // qtable.js reads NUM_BUCKETS
  const NON_TERMINAL_STATES = [];
  for (let i = 0; i < POT_BUCKETS * STANDINGS; i++) {
    const { potBucket, standing } = decodeDisplayIndex(i);
    NON_TERMINAL_STATES.push({ potBucket, standing, terminal: false });
  }

  /* stateIndex over the 18-cell display grid. Accepts either a display
     state {potBucket, standing} or an exact state {my, riv, pot}. */
  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    if (s.potBucket != null && s.standing != null) {
      return displayIndex(s.potBucket, s.standing);
    }
    return displayIndex(bucketOfPot(s.pot || 0), standingOf(s.my, s.riv));
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= POT_BUCKETS * STANDINGS) return null;
    const { potBucket, standing } = decodeDisplayIndex(i);
    return { potBucket, standing, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.win ? 'WIN' : (s.lose ? 'LOSS' : 'T?');
    const idx = stateIndex(s);
    return idx >= 0 ? String(idx) : '';
  }

  /* Map an exact game state to its observed (bucketed) display index - what
     SARSA sees while playing the real game vs the rival. */
  function observeIndex(state) {
    return displayIndex(bucketOfPot(state.pot || 0), standingOf(state.my, state.riv));
  }

  window.Pig = {
    /* constants */
    TARGET, RIVAL_HOLD, BUST_FACE, ROLL_FACES, ROLL_GAIN, P_FACE,
    POT_BUCKETS, POT_BUCKET_LABELS, POT_BUCKET_REP,
    STANDINGS, STANDING_LABELS, STANDING_REP,
    NUM_BUCKETS, NON_TERMINAL_STATES,

    /* exact-state DP */
    solve, winProb, Q, holdThreshold,
    rivalTurnValue,

    /* playable game */
    initialState, sample, step, rivalTurn,

    /* bucketing helpers */
    bucketOfPot, standingOf, displayIndex, decodeDisplayIndex, repStateForCell,
    stateIndex, stateFromIndex, stateKey, observeIndex,

    /* rng */
    makeRng,
  };

  /* Alias to window.Battle for the reused engine modules. */
  window.Battle = window.Pig;
})();

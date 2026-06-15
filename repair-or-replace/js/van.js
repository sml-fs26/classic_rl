/* The Repair-or-Replace MDP: one delivery van wearing out, week by week.
 *
 *   State `s`: the van's condition, one of 4 wear levels
 *     HEALTHY(0) WORN(1) SHAKY(2) FAILING(3).
 *   No terminal states: the fleet runs forever, discounted at gamma = 0.9.
 *   Action `a`: one of 3 calls (RUN / SERVICE / REPLACE), cheap to expensive.
 *
 *   Transition + reward:
 *     RUN      earn this week's profit REV_RUN[s]; with probability P_BD[s]
 *              the van BREAKS DOWN (-280 on top of the profit) and is dumped
 *              to FAILING; otherwise it degrades 0-2 levels (DEGR[s]).
 *     SERVICE  -50, a week in the shop (no profit); wear improves 0-2 levels
 *              (SERV_UP[s]), strong on a merely-worn van, weak on a
 *              clapped-out one.
 *     REPLACE  -130, a week offline, condition resets to HEALTHY.
 *
 *   This file is the JS port of precompute/value_iteration.py (the verified
 *   source-of-truth model). precompute/build-datasets.js loads this exact
 *   file and ASSERTS the verified Q* grid, so the numbers cannot drift.
 *
 *   Two shapes, mirroring the sibling gallery engines:
 *     sample(state, actionId, rng) -> { sNext, reward, terminal:false, log }
 *        one stochastic draw (playtest, SARSA, trajectory tape).
 *     successors(state, actionId)  -> [ { sNext, p, reward } ]
 *        full enumeration (value iteration).
 *
 *   Exposed as window.Van and aliased to window.Battle so the reused
 *   bellman.js (reads window.Battle.NON_TERMINAL_STATES / stateIndex /
 *   successorsFromBuckets) and sarsa.js work without edits, with A = 3.
 */
(function () {

  /*, Wear levels (the 4 states), */
  const NUM_STATES = 4;
  const STATES = ['healthy', 'worn', 'shaky', 'failing'];
  const STATE_IDX = { healthy: 0, worn: 1, shaky: 2, failing: 3 };
  const STATE_DISPLAY = ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];
  const HEALTHY = 0;
  const FAILING = NUM_STATES - 1;   // 3

  /*, Dynamics & rewards (locked; mirrors value_iteration.py), */
  /* RUN: weekly delivery profit by condition. The steep cliff WORN(72) ->
     SHAKY(40) is what makes the SERVICE|REPLACE frontier well-crossed. */
  const REV_RUN = [95, 72, 40, 16];
  /* Breakdown chance per week if RUN; spikes at SHAKY. A breakdown costs
     BREAKDOWN_COST on top of the profit and dumps the van to FAILING. */
  const P_BD = [0.02, 0.08, 0.28, 0.55];
  const BREAKDOWN_COST = 280;
  /* Non-breakdown degradation while running: [stay, down1, down2]
     (capped at FAILING). */
  const DEGR = [
    [0.35, 0.55, 0.10],   // HEALTHY
    [0.30, 0.55, 0.15],   // WORN
    [0.45, 0.55, 0.00],   // SHAKY
    [0.65, 0.35, 0.00],   // FAILING
  ];
  /* SERVICE: a week in the shop, no profit. [stay, up1, up2] toward HEALTHY.
     Strong on a merely-worn van, weak on a clapped-out one (this is what
     makes REPLACE decisively beat SERVICE at SHAKY). */
  const C_SERVICE = 50;
  const SERV_UP = [
    [1.00, 0.00, 0.00],   // HEALTHY (no need)
    [0.05, 0.70, 0.25],   // WORN
    [0.45, 0.50, 0.05],   // SHAKY, often fails to help: the cliff
    [0.55, 0.42, 0.03],   // FAILING, mostly stuck
  ];
  /* REPLACE: a week offline, capital cost, resets to HEALTHY. */
  const C_REPLACE = 130;

  const GAMMA = 0.9;

  /*, States, */
  function initialState() { return { wear: HEALTHY, terminal: false }; }

  /* The 4 states, index order 0..3 (HEALTHY..FAILING). No terminals. */
  const NON_TERMINAL_STATES = [];
  for (let w = 0; w < NUM_STATES; w++) {
    NON_TERMINAL_STATES.push({ wear: w, terminal: false });
  }

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.wear;
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= NUM_STATES) return null;
    return { wear: i, terminal: false };
  }
  function stateKey(s) { return s ? String(s.wear) : ''; }
  function stateName(idx) {
    if (idx < 0 || idx >= NUM_STATES) return '';
    return STATE_DISPLAY[idx];
  }

  /*, successors(state, actionId): full enumeration ----------
     Returns every branch with its probability and baked-in reward,
     mirroring trans() in precompute/value_iteration.py exactly. */
  function successors(state, actionId) {
    const s = state.wear;
    const out = [];
    if (actionId === 'run') {
      const p = P_BD[s];
      if (p > 0) {
        out.push({ sNext: { wear: FAILING, terminal: false }, p,
                   reward: REV_RUN[s] - BREAKDOWN_COST });
      }
      const rest = 1 - p;
      const row = DEGR[s];
      for (let d = 0; d < 3; d++) {
        if (row[d] > 0) {
          out.push({ sNext: { wear: Math.min(FAILING, s + d), terminal: false },
                     p: rest * row[d], reward: REV_RUN[s] });
        }
      }
    } else if (actionId === 'service') {
      const row = SERV_UP[s];
      for (let u = 0; u < 3; u++) {
        if (row[u] > 0) {
          out.push({ sNext: { wear: Math.max(0, s - u), terminal: false },
                     p: row[u], reward: -C_SERVICE });
        }
      }
    } else {  // replace
      out.push({ sNext: { wear: HEALTHY, terminal: false }, p: 1, reward: -C_REPLACE });
    }
    return out;
  }
  /* Alias name expected by the reused bellman.js. */
  function successorsFromBuckets(s, actionId) { return successors(s, actionId); }

  /*, sample(state, actionId, rng): one stochastic draw ----------
     Returns the transition plus a rich `log` the scenes use to narrate the
     week (breakdown flag, wear from/to, profit or cost, what the world did).
     log.face is one of:
       'breakdown'                          RUN rolled a failure
       'wear0' | 'wear1' | 'wear2'          RUN survived, degraded 0/1/2 levels
       'fix0'  | 'fix1'  | 'fix2'           SERVICE improved 0/1/2 levels
       'new'                                REPLACE
     Draw order is fixed (breakdown roll first, then degradation) so a
     recorded per-step seed replays the exact same outcome. */
  function sample(state, actionId, rng) {
    const s = state.wear;
    const log = {
      action: actionId, face: null,
      fromWear: s, toWear: s,
      breakdown: false, reward: 0,
    };

    if (actionId === 'run') {
      const u = rng();
      if (u < P_BD[s]) {
        log.face = 'breakdown';
        log.breakdown = true;
        log.toWear = FAILING;
        log.reward = REV_RUN[s] - BREAKDOWN_COST;
        return { sNext: { wear: FAILING, terminal: false },
                 reward: log.reward, terminal: false, log };
      }
      const row = DEGR[s];
      const v = rng();
      let d = 0;
      if (v < row[0]) d = 0;
      else if (v < row[0] + row[1]) d = 1;
      else d = 2;
      const to = Math.min(FAILING, s + d);
      log.face = 'wear' + d;
      log.toWear = to;
      log.reward = REV_RUN[s];
      return { sNext: { wear: to, terminal: false },
               reward: log.reward, terminal: false, log };
    }

    if (actionId === 'service') {
      const row = SERV_UP[s];
      const v = rng();
      let u = 0;
      if (v < row[0]) u = 0;
      else if (v < row[0] + row[1]) u = 1;
      else u = 2;
      const to = Math.max(0, s - u);
      log.face = 'fix' + u;
      log.toWear = to;
      log.reward = -C_SERVICE;
      return { sNext: { wear: to, terminal: false },
               reward: log.reward, terminal: false, log };
    }

    /* REPLACE: deterministic reset. */
    log.face = 'new';
    log.toWear = HEALTHY;
    log.reward = -C_REPLACE;
    return { sNext: { wear: HEALTHY, terminal: false },
             reward: log.reward, terminal: false, log };
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

  window.Van = {
    /* dimensions / vocabulary */
    NUM_STATES, STATES, STATE_IDX, STATE_DISPLAY, HEALTHY, FAILING,
    REV_RUN, P_BD, BREAKDOWN_COST, DEGR, C_SERVICE, SERV_UP, C_REPLACE, GAMMA,
    NON_TERMINAL_STATES,
    /* states */
    initialState, stateIndex, stateFromIndex, stateKey, stateName,
    /* transitions */
    sample, successors, successorsFromBuckets,
    /* rng */
    makeRng,
  };
  /* Alias so the reused engine (bellman.js, sarsa.js) reads it as Battle. */
  window.Battle = window.Van;
})();

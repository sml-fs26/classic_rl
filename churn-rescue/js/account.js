/* MDP transitions for Churn Rescue: the tier x months-left account MDP.
 *
 *   State s = (tier, m):
 *     tier  in {cliff=0, at-risk=1, lukewarm=2, healthy=3, thriving=4}
 *     m     in {1..5}  months-left until the contract comes up for renewal
 *   5 x 5 = 25 non-terminal states. Two off-grid terminals:
 *     RENEWED  (+20)   the contract reached month 0 still subscribed
 *     CHURNED  (-20)   the account left
 *   stateIndex = tier*5 + (m-1), in {0..24}.
 *
 *   Action a (lever): one of DO NOTHING (cost 0), CHECK-IN (cost 1),
 *   BIG OFFER (cost 4). See js/levers.js for the menu.
 *
 *   Transition each month (the two visible dice, resolved in sequence):
 *     1. pay the lever cost (debited as a negative reward).
 *     2. flip the RETENTION COIN  P(STAY | tier, lever)
 *          = min( base[tier] + lift[lever][tier], 0.99 ).
 *        tails  => CHURNED (-20, done).
 *     3. heads => roll the ENGAGEMENT DIE to nudge the tier (up / same /
 *        down, clamped to 0..4) and decrement m. If the new m == 0 =>
 *        RENEWED (+20, done); else continue to next month.
 *
 *   Reward (gamma = 1): -cost per month, plus the terminal lump (+20 on
 *   RENEWED, -20 on CHURNED). The return of an episode is therefore the
 *   sum of the lever costs paid plus the single terminal lump. Finite
 *   horizon: m strictly decrements on STAY, so the MDP is acyclic in m
 *   and exact by one backward pass m = 1..5 (no self-loops).
 *
 *   Two transition shapes are exposed:
 *     sample(state, leverId, rng) -> { sNext, reward, terminal, log }
 *        one stochastic draw, for SARSA + the scene-2 manual playtest.
 *     successors(state, leverId) -> [ { sNext, p, reward } ]
 *        full enumeration over coin(stay/churn) x die(up/same/down),
 *        for value iteration / Bellman backups.
 *
 *   Aliased to window.Battle so the reused bellman.js + sarsa.js +
 *   qtable.js (which read window.Battle.NON_TERMINAL_STATES /
 *   successorsFromBuckets / stateIndex and window.Moves.MOVE_IDS) work
 *   unchanged. A = 3, MOVE_IDS order: nothing, checkin, offer.
 */
(function () {

  const NUM_TIERS = 5;
  const NUM_MONTHS = 5;                 // m in {1..5}
  /* Tier names, index 0..4 = cliff..thriving (bottom row to top row). */
  const TIERS = ['cliff', 'at-risk', 'lukewarm', 'healthy', 'thriving'];
  const TIER_IDX = { cliff: 0, 'at-risk': 1, lukewarm: 2, healthy: 3, thriving: 4 };

  const RENEW_REWARD = +20;
  const CHURN_REWARD = -20;

  /*, The frozen model (do NOT retune without re-validating
     the at-risk m3->m4 notch; see proposal "Risks")., */

  /* Retention-coin base P(STAY) by tier, index cliff..thriving. */
  const BASE_STAY = [0.50, 0.68, 0.82, 0.93, 0.985];

  /* Coin lift added by each lever, per tier (cliff..thriving). DO NOTHING
     adds nothing. CHECK-IN adds a little. BIG OFFER lifts a lot only
     where there is headroom (low tiers); on thriving it adds ~0. */
  const COIN_LIFT = {
    nothing: [0.00, 0.00, 0.00, 0.00, 0.00],
    checkin: [0.08, 0.12, 0.10, 0.05, 0.01],
    offer:   [0.38, 0.26, 0.12, 0.05, 0.01],
  };
  const STAY_CAP = 0.99;

  /* Engagement-die next-tier nudge if they STAY, as [up, same, down].
     DO NOTHING sags; CHECK-IN is the growth lever (climbs tiers);
     BIG OFFER is a stay-spike (only a modest climb). */
  const DIE = {
    nothing: { up: 0.12, same: 0.48, down: 0.40 },
    checkin: { up: 0.40, same: 0.45, down: 0.15 },
    offer:   { up: 0.25, same: 0.60, down: 0.15 },
  };

  /* Lever cost lookup, read from the levers module (single source of
     truth) with a hard-coded fallback so this file is self-contained in
     Node-free contexts that only load account.js. */
  const COST = { nothing: 0, checkin: 1, offer: 4 };
  function costOf(leverId) {
    if (window.Levers && window.Levers.LEVER_BY_ID && window.Levers.LEVER_BY_ID[leverId]) {
      return window.Levers.LEVER_BY_ID[leverId].cost;
    }
    return COST[leverId] != null ? COST[leverId] : 0;
  }

  function pStay(tier, leverId) {
    const lift = (COIN_LIFT[leverId] || COIN_LIFT.nothing)[tier] || 0;
    return Math.min(STAY_CAP, BASE_STAY[tier] + lift);
  }
  function clampTier(t) { return t < 0 ? 0 : (t > NUM_TIERS - 1 ? NUM_TIERS - 1 : t); }

  /*, Initial state. Lukewarm, 4 months to renewal., */
  function initialState() { return { tier: 2, m: 4, terminal: false }; }
  function initialScalar() { return initialState(); }   // legacy alias

  /*, One-month sample (one coin flip + one die roll) ----------
     rng() yields a uniform in [0, 1). The coin is consumed first, then
     (only on STAY) the die: animate coin THEN die in that order. The log
     carries everything a scene needs to narrate the month. */
  function sample(state, leverId, rng) {
    const cost = costOf(leverId);
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        renewed: !!state.renewed, churned: !!state.churned,
        log: { lever: leverId, cost: 0, stay: null, coin: rng ? rng() : 0,
               dieFace: null, fromTier: state.tier, toTier: state.tier,
               fromM: state.m, toM: state.m, renewed: !!state.renewed, churned: !!state.churned } };
    }

    const fromTier = state.tier;
    const fromM = state.m;
    const stayP = pStay(fromTier, leverId);

    /* Coin: STAY iff coin < P(STAY). */
    const coin = rng();
    const stay = coin < stayP;

    const log = {
      lever: leverId, cost: cost,
      stay: stay, coin: coin,
      dieFace: null,
      fromTier: fromTier, toTier: fromTier,
      fromM: fromM, toM: fromM,
      renewed: false, churned: false,
    };

    if (!stay) {
      log.churned = true;
      const sNext = { terminal: true, churned: true, renewed: false };
      return { sNext, reward: -cost + CHURN_REWARD, terminal: true,
        renewed: false, churned: true, log };
    }

    /* Die: nudge the tier up / same / down. */
    const die = DIE[leverId] || DIE.nothing;
    const u = rng();
    let face, dt;
    if (u < die.up) { face = 'up'; dt = +1; }
    else if (u < die.up + die.same) { face = 'same'; dt = 0; }
    else { face = 'down'; dt = -1; }
    const toTier = clampTier(fromTier + dt);
    log.dieFace = face;
    log.toTier = toTier;

    const toM = fromM - 1;
    log.toM = toM;

    if (toM === 0) {
      log.renewed = true;
      const sNext = { terminal: true, renewed: true, churned: false };
      return { sNext, reward: -cost + RENEW_REWARD, terminal: true,
        renewed: true, churned: false, log };
    }

    const sNext = { tier: toTier, m: toM, terminal: false };
    return { sNext, reward: -cost, terminal: false, renewed: false, churned: false, log };
  }

  /*, Successors enumeration (for value iteration) ----------
     Branches: coin (stay / churn) x die (up / same / down). On CHURN the
     die never rolls (one branch). Reward bakes in the cost and the
     terminal lump. Probabilities aggregate per destination key. */
  function successors(state, leverId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const cost = costOf(leverId);
    const fromTier = state.tier;
    const fromM = state.m;
    const stayP = pStay(fromTier, leverId);
    const die = DIE[leverId] || DIE.nothing;

    const out = new Map();
    function key(sN) {
      if (sN.terminal) return sN.renewed ? 'RENEWED' : 'CHURNED';
      return sN.tier + '|' + sN.m;
    }
    function add(sN, p, reward) {
      if (p <= 0) return;
      const k = key(sN);
      const cur = out.get(k);
      if (cur) cur.p += p;
      else out.set(k, { sNext: sN, p, reward });
    }

    /* CHURN branch. */
    add({ terminal: true, churned: true, renewed: false }, 1 - stayP, -cost + CHURN_REWARD);

    /* STAY branch, split by the die face. */
    const toM = fromM - 1;
    const faces = [['up', +1], ['same', 0], ['down', -1]];
    for (const [name, dt] of faces) {
      const pFace = die[name];
      const pBranch = stayP * pFace;
      const toTier = clampTier(fromTier + dt);
      if (toM === 0) {
        add({ terminal: true, renewed: true, churned: false }, pBranch, -cost + RENEW_REWARD);
      } else {
        add({ tier: toTier, m: toM, terminal: false }, pBranch, -cost);
      }
    }

    return Array.from(out.values());
  }
  function successorsFromBuckets(s, m) { return successors(s, m); }   // alias

  /*, Indexing over the 25 non-terminal states ----------
     Index order is tier*5 + (m-1): row-major with tier as the row
     (cliff=0..thriving=4) and m-1 as the column (m=1 left..m=5 right). */
  const NON_TERMINAL_STATES = [];
  for (let t = 0; t < NUM_TIERS; t++) {
    for (let mm = 1; mm <= NUM_MONTHS; mm++) {
      NON_TERMINAL_STATES.push({ tier: t, m: mm, terminal: false });
    }
  }

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.tier * NUM_MONTHS + (s.m - 1);
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= NUM_TIERS * NUM_MONTHS) return null;
    return { tier: Math.floor(i / NUM_MONTHS), m: (i % NUM_MONTHS) + 1, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.renewed ? 'RENEWED' : (s.churned ? 'CHURNED' : 'T?');
    return s.tier + '|' + s.m;
  }
  function tierName(idx) {
    if (idx < 0 || idx >= NUM_TIERS) return '?';
    return TIERS[idx].toUpperCase();
  }

  /*, Mulberry32: shared with the precompute., */
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

  /* Public surface. */
  window.Churn = {
    NUM_TIERS, NUM_MONTHS,
    TIERS, TIER_IDX,
    RENEW_REWARD, CHURN_REWARD,
    BASE_STAY, COIN_LIFT, STAY_CAP, DIE,
    NON_TERMINAL_STATES,
    pStay, costOf,
    initialState, initialScalar,
    sample,
    successors, successorsFromBuckets,
    stateIndex, stateFromIndex, stateKey,
    tierName,
    makeRng,
  };

  /* Alias so the reused bellman.js / sarsa.js / qtable.js keep working.
     Those files read NON_TERMINAL_STATES, successorsFromBuckets,
     stateIndex, makeRng, and (qtable) NUM_BUCKETS / BUCKETS. We expose
     NUM_BUCKETS = NUM_TIERS and BUCKETS = TIERS so a generic Q-grid can
     mount unchanged if a scene reuses qtable.js. */
  window.Battle = Object.assign({}, window.Churn, {
    NUM_BUCKETS: NUM_TIERS,
    BUCKETS: TIERS.slice(),
    bucketName: tierName,
  });
})();

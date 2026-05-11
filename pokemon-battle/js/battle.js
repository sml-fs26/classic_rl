/* MDP transitions for the Pikachu-vs-Charmander battle.
 *
 *   State `s`: (your_HP_bucket, opp_HP_bucket), each in {full, mid, low}.
 *   Terminal: either side at 0 HP (you-win or you-faint).
 *   Action `a`: one of 4 Pikachu moves.
 *   Opponent: Charmander uses Ember every turn (deterministic).
 *   Speed: Pikachu (90) > Charmander (65), so Pikachu always moves first.
 *
 * Two transition shapes are needed:
 *   sample(state, move, rng) → { state_next, reward, terminal, log }
 *      for SARSA + the manual scene-1 battle (one stochastic draw).
 *   successors(state, move) → array of { sNext, p, reward, terminal }
 *      for value iteration (full enumeration over outcome buckets).
 *
 * The damage roll is bucketised so the successors() enumeration stays small:
 * we discretise the [0.85, 1.0] uniform multiplier into 3 equal-probability
 * sub-buckets and enumerate them. This keeps `successors()` to ≤ 6 branches
 * per (state, move) — tractable for VI, true enough for the agent.
 */
(function () {
  const BUCKETS = ['full', 'mid', 'low'];        // 3 buckets per Pokemon
  const BUCKET_IDX = { full: 0, mid: 1, low: 2 };

  /* Damage scaling — keep in sync with precompute/build-datasets.js. */
  const DAMAGE_MUL = 0.35;

  /* HP thresholds: "real" HP is conceptually 100. Buckets:
       full ≥ 60, 25 ≤ mid < 60, 0 < low < 25, 0 = fainted.
     Pikachu and Charmander share the threshold scheme. */
  const PIKA_MAX_HP = 100;
  const CHARM_MAX_HP = 100;

  function hpToBucket(hp) {
    if (hp <= 0) return 'fainted';
    if (hp >= 60) return 'full';
    if (hp >= 25) return 'mid';
    return 'low';
  }

  /* Bucket representative HP used by the simulator when we don't have a true
     scalar HP (e.g. when value iteration projects future states). For scene-1
     manual play we maintain a real scalar HP and only bucket at the boundary.
     These representatives are picked so that one Thunderbolt-hit (~28 dmg) crosses
     a bucket from `full` to `mid` and one more crosses to `low`; one Thunder hit
     (~52 dmg) can cross two buckets at once. Mirrors precompute/build-datasets.js. */
  function bucketToHp(b) {
    if (b === 'fainted') return 0;
    if (b === 'full') return 80;
    if (b === 'mid')  return 45;
    if (b === 'low')  return 18;
    return 0;
  }

  /* Reward model:
       -1 per non-terminal turn (encourages fast wins),
       +10 if opponent faints (we win),
       -10 if Pikachu faints (we lose). */
  function rewardFor(stateNext) {
    if (stateNext.terminal) {
      if (stateNext.win) return +10;
      if (stateNext.lose) return -10;
    }
    return -1;
  }

  /* Sample one full turn: Pikachu attacks, then (if still alive) Charmander
     attacks back. Damage uses the discretised multiplier (3 sub-buckets). */
  function sample(state, moveId, rng) {
    const move = window.Moves.MOVE_BY_ID[moveId];
    const opp = window.Moves.OPP_MOVE;

    let yourHp = state.yourHp;
    let oppHp  = state.oppHp;
    const log = { yourHp0: yourHp, oppHp0: oppHp, move: moveId };

    /* Pikachu moves first. */
    const hit1 = rng() < move.accuracy;
    let oppDmg = 0;
    if (hit1) {
      /* Damage = power × multiplier; multiplier ~ U[0.85, 1.0] → sample one
         of the 3 sub-bucket means {0.875, 0.925, 0.975}. */
      const mul = pickMul(rng);
      oppDmg = Math.max(1, Math.round(move.power * DAMAGE_MUL * mul));
      oppHp  = Math.max(0, oppHp - oppDmg);
    }
    log.hit1 = hit1;
    log.oppDmg = oppDmg;
    log.oppHp1 = oppHp;

    /* If opponent fainted, the battle ends — Charmander doesn't counter. */
    if (oppHp <= 0) {
      const next = { yourHp, oppHp: 0, terminal: true, win: true, lose: false };
      log.yourDmg = 0;
      log.yourHp1 = yourHp;
      return { state: next, reward: rewardFor(next), terminal: true, win: true, lose: false, log };
    }

    /* Charmander uses Ember. */
    const mulO = pickMul(rng);
    const yourDmg = Math.max(1, Math.round(opp.power * DAMAGE_MUL * mulO));
    yourHp = Math.max(0, yourHp - yourDmg);
    log.yourDmg = yourDmg;
    log.yourHp1 = yourHp;

    const win = oppHp <= 0;
    const lose = yourHp <= 0;
    const next = { yourHp, oppHp, terminal: win || lose, win, lose };
    return { state: next, reward: rewardFor(next), terminal: next.terminal, win, lose, log };
  }

  function pickMul(rng) {
    const r = rng();
    if (r < 1/3) return 0.875;
    if (r < 2/3) return 0.925;
    return 0.975;
  }

  /* Initial scalar HP state for a new battle. */
  function initialScalar() {
    return { yourHp: PIKA_MAX_HP, oppHp: CHARM_MAX_HP, terminal: false, win: false, lose: false };
  }

  /* ------------------------------------------------------------ *
   * Bucketed MDP used by Value Iteration and SARSA.               *
   * State enumerated as a string key "your|opp" with each in       *
   *   {full, mid, low}. 9 non-terminal states; 2 terminals.        *
   * ------------------------------------------------------------ */
  const NON_TERMINAL_STATES = [];
  for (const y of BUCKETS) for (const o of BUCKETS) NON_TERMINAL_STATES.push({ your: y, opp: o });
  const TERMINAL_WIN  = { your: '*',     opp: 'fainted', terminal: true, win: true };
  const TERMINAL_LOSS = { your: 'fainted', opp: '*',     terminal: true, lose: true };

  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.win ? 'WIN' : (s.lose ? 'LOSS' : 'T?');
    return s.your + '|' + s.opp;
  }

  /* Damage applied as a deterministic mean: 0.925 multiplier × 0.35 × power.
     We then bucket the new HP. Each combination has probability 1/3 of being
     the sample, but in expectation we use the mean — the variance across
     sub-buckets is small enough that the bucketed transition flattens to a
     deterministic step in most cases. For VI we still enumerate the 3
     sub-bucket outcomes to preserve some stochasticity. */
  function damageOutcomes(move) {
    /* Returns three { dmg, p } outcomes. */
    return [0.875, 0.925, 0.975].map(mul => ({
      dmg: Math.max(1, Math.round(move.power * DAMAGE_MUL * mul)),
      p: 1 / 3,
    }));
  }

  /* Compute the bucketed successors of (s, move) under sampled damage.
     Probabilities aggregate by destination bucket. */
  function successorsFromBuckets(s, moveId) {
    const move = window.Moves.MOVE_BY_ID[moveId];
    const opp = window.Moves.OPP_MOVE;
    if (s.terminal) {
      return [{ sNext: s, p: 1, reward: 0 }];
    }
    const yourHp = bucketToHp(s.your);
    const oppHp  = bucketToHp(s.opp);

    const out = new Map();
    const pHit = move.accuracy;
    const pMiss = 1 - pHit;

    function add(key, val) {
      const cur = out.get(key);
      if (!cur) out.set(key, val);
      else { cur.p += val.p; }
    }

    function bucketKey(sNext) {
      if (sNext.terminal) return sNext.win ? 'WIN' : 'LOSS';
      return sNext.your + '|' + sNext.opp;
    }

    /* Outcome branch: (hit?) × (damage sub-bucket) × (counter damage sub-bucket).
       If Pikachu's hit ends the fight, no counter — collapse over counter
       sub-buckets. */
    function branch(pHitBranch, dmgList) {
      for (const { dmg: oppDmg, p: pDmg } of dmgList) {
        const oppHpNew = Math.max(0, oppHp - oppDmg);
        if (oppHpNew <= 0) {
          /* Win. */
          const key = 'WIN';
          add(key, {
            sNext: { ...TERMINAL_WIN },
            p: pHitBranch * pDmg,
            reward: +10,
          });
          continue;
        }
        /* Charmander counters. */
        for (const { dmg: yourDmg, p: pDmg2 } of damageOutcomes(opp)) {
          const yourHpNew = Math.max(0, yourHp - yourDmg);
          let sNext;
          if (yourHpNew <= 0) {
            sNext = { ...TERMINAL_LOSS };
          } else {
            sNext = {
              your: hpToBucket(yourHpNew),
              opp:  hpToBucket(oppHpNew),
              terminal: false,
            };
          }
          add(bucketKey(sNext), {
            sNext,
            p: pHitBranch * pDmg * pDmg2,
            reward: yourHpNew <= 0 ? -10 : -1,
          });
        }
      }
    }

    /* Hit branch */
    if (pHit > 0) branch(pHit, damageOutcomes(move));

    /* Miss branch: Pikachu deals 0, Charmander still counters. */
    if (pMiss > 0) {
      for (const { dmg: yourDmg, p: pDmg2 } of damageOutcomes(opp)) {
        const yourHpNew = Math.max(0, yourHp - yourDmg);
        let sNext;
        if (yourHpNew <= 0) {
          sNext = { ...TERMINAL_LOSS };
        } else {
          sNext = {
            your: hpToBucket(yourHpNew),
            opp:  hpToBucket(oppHp),
            terminal: false,
          };
        }
        add(bucketKey(sNext), {
          sNext,
          p: pMiss * pDmg2,
          reward: yourHpNew <= 0 ? -10 : -1,
        });
      }
    }

    return Array.from(out.values());
  }

  /* Reverse lookup: take a non-terminal bucket state s = {your, opp}, return
     its index 0..8 over NON_TERMINAL_STATES order. Used by the 9×4 Q-table. */
  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return BUCKET_IDX[s.your] * 3 + BUCKET_IDX[s.opp];
  }
  function stateFromIndex(i) {
    if (i < 0 || i > 8) return null;
    return { your: BUCKETS[Math.floor(i / 3)], opp: BUCKETS[i % 3], terminal: false };
  }

  /* Mulberry32 — shared seed source for runtime + precompute parity. */
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

  window.Battle = {
    BUCKETS, BUCKET_IDX, NON_TERMINAL_STATES,
    TERMINAL_WIN, TERMINAL_LOSS,
    PIKA_MAX_HP, CHARM_MAX_HP,
    hpToBucket, bucketToHp, rewardFor,
    sample, initialScalar,
    successorsFromBuckets,
    stateIndex, stateFromIndex, stateKey,
    makeRng,
  };
})();

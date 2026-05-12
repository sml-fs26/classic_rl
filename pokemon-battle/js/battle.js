/* MDP transitions for the Pikachu-vs-Charmander battle — 5-bucket variant.
 *
 *   State `s`: (your_HP_bucket, opp_HP_bucket), each in {0..4} = {full, high,
 *   mid, low, critical}. Bucket 5 = fainted = terminal (off-grid).
 *   Action `a`: one of 4 Pikachu moves.
 *   Opponent: Charmander uses Ember every turn (deterministic).
 *   Speed: Pikachu always moves first (matches Gen-1 base speed).
 *
 *   The simulator is fully discrete now — no more continuous HP underneath.
 *   Each move has an explicit probability distribution over bucket-delta
 *   damage (conditional on hitting). Accuracy gates whether the hit branch
 *   triggers. The world the agent sees IS the world it lives in: no hidden
 *   continuous state, no abstraction lossiness. Markov holds.
 *
 *   Why 5 buckets and not 3: the previous 3-bucket world hid most of the
 *   battlefield variance from the policy. 5 buckets give 25 non-terminal
 *   states, fine enough to expose state-dependent move preference and still
 *   tractable as a tabular Q-table on screen.
 *
 *   Two transition shapes are needed:
 *     sample(state, move, rng) → { sNext, reward, terminal, log }
 *        for SARSA + scene 1's manual battle (one stochastic draw).
 *     successors(state, move) → array of { sNext, p, reward, terminal }
 *        for value iteration (full enumeration over outcome buckets).
 */
(function () {

  const NUM_BUCKETS = 5;
  const BUCKETS = ['full', 'high', 'mid', 'low', 'critical'];
  const BUCKET_IDX = { full: 0, high: 1, mid: 2, low: 3, critical: 4 };
  const FAINTED = NUM_BUCKETS;       // bucket index that means "off the bottom"

  /* Damage distributions — bucket-delta given a hit. Each move's expected
     damage shapes the optimal policy:
       Quick Attack:  E[d] = 0.45  — too weak alone (Ember outpaces)
       Thunderbolt :  E[d] = 1.50  — reliable workhorse
       Iron Tail   :  E[d] = 0.98 (acct accuracy)  — medium with miss tax
       Thunder     :  E[d] = 1.71 (acct accuracy)  — biggest but variance
     Ember on Pikachu :  E[d] = 0.55  — Pikachu lives ~9 turns on average. */
  const HIT_DAMAGE_DIST = {
    quick_attack: [[0, 0.55], [1, 0.45]],
    thunderbolt:  [[1, 0.50], [2, 0.50]],
    iron_tail:    [[1, 0.70], [2, 0.30]],
    thunder:      [[2, 0.50], [3, 0.50]],
  };
  /* Ember calibrated so random policy ~ break-even — gives SARSA something
     to actually learn instead of winning trivially from episode 0. */
  const EMBER_DIST = [[0, 0.20], [1, 0.55], [2, 0.25]];

  /* ---------- RNG sampling helpers ---------- */
  function sampleDist(rng, dist) {
    const u = rng();
    let cum = 0;
    for (const [d, p] of dist) {
      cum += p;
      if (u < cum) return d;
    }
    return dist[dist.length - 1][0];
  }

  /* Reward model:
       -1 per non-terminal turn (encourages fast wins),
       +10 if opponent faints (we win),
       -10 if Pikachu faints (we lose). */
  function rewardFor(sNext) {
    if (sNext.terminal) return sNext.win ? +10 : -10;
    return -1;
  }

  /* Initial battle state. Both Pokemon at full HP (bucket 0). */
  function initialState() {
    return { your: 0, opp: 0, terminal: false };
  }
  /* Kept for backwards compat with any callers expecting the old name. */
  function initialScalar() { return initialState(); }

  /* ---------- One-turn sample (discrete) ----------
     The agent picks moveId; Pikachu attacks first (matches game speed); if
     Charmander still alive, it counters with Ember. Returns the full log
     so scene 1's dialog can describe what happened. */
  function sample(state, moveId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true, win: !!state.win, lose: !!state.lose,
        log: { move: moveId, hit1: false, oppDelta: 0, yourDelta: 0,
               oppBefore: state.opp, oppAfter: state.opp, yourBefore: state.your, yourAfter: state.your }};
    }

    const move = window.Moves.MOVE_BY_ID[moveId];
    const opp = window.Moves.OPP_MOVE;

    let your = state.your;
    let oppB = state.opp;
    const log = {
      move: moveId,
      yourBefore: your, oppBefore: oppB,
      hit1: false, oppDelta: 0, yourDelta: 0,
      yourAfter: your, oppAfter: oppB,
    };

    /* Pikachu first. */
    const hit1 = rng() < move.accuracy;
    let oppDelta = 0;
    if (hit1) {
      oppDelta = sampleDist(rng, HIT_DAMAGE_DIST[moveId]);
      oppB = Math.min(FAINTED, oppB + oppDelta);
    }
    log.hit1 = hit1;
    log.oppDelta = oppDelta;
    log.oppAfter = oppB;

    if (oppB >= FAINTED) {
      const sNext = { terminal: true, win: true, lose: false };
      return { sNext, reward: +10, terminal: true, win: true, lose: false, log };
    }

    /* Charmander counters with Ember (always 100% acc). */
    const yourDelta = sampleDist(rng, EMBER_DIST);
    your = Math.min(FAINTED, your + yourDelta);
    log.yourDelta = yourDelta;
    log.yourAfter = your;

    if (your >= FAINTED) {
      const sNext = { terminal: true, win: false, lose: true };
      return { sNext, reward: -10, terminal: true, win: false, lose: true, log };
    }

    const sNext = { your, opp: oppB, terminal: false };
    return { sNext, reward: -1, terminal: false, win: false, lose: false, log };
  }

  /* ---------- Successors enumeration (for value iteration) ----------
     Returns the full discrete branch tree of (move outcome × counter outcome)
     with probabilities aggregated per destination state. */
  function successors(state, moveId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const move = window.Moves.MOVE_BY_ID[moveId];
    const pHit = move.accuracy;
    const pMiss = 1 - pHit;

    const out = new Map();
    function key(sN) {
      if (sN.terminal) return sN.win ? 'WIN' : 'LOSS';
      return sN.your + '|' + sN.opp;
    }
    function add(sN, p, reward) {
      const k = key(sN);
      const cur = out.get(k);
      if (cur) cur.p += p;
      else out.set(k, { sNext: sN, p, reward });
    }

    /* Hit branch */
    if (pHit > 0) {
      for (const [oppD, pO] of HIT_DAMAGE_DIST[moveId]) {
        const oppNew = Math.min(FAINTED, state.opp + oppD);
        if (oppNew >= FAINTED) {
          add({ terminal: true, win: true }, pHit * pO, +10);
          continue;
        }
        /* Charmander counters. */
        for (const [yD, pY] of EMBER_DIST) {
          const yNew = Math.min(FAINTED, state.your + yD);
          if (yNew >= FAINTED) {
            add({ terminal: true, lose: true }, pHit * pO * pY, -10);
          } else {
            add({ your: yNew, opp: oppNew, terminal: false }, pHit * pO * pY, -1);
          }
        }
      }
    }

    /* Miss branch: Pikachu deals 0; Charmander still counters. */
    if (pMiss > 0) {
      for (const [yD, pY] of EMBER_DIST) {
        const yNew = Math.min(FAINTED, state.your + yD);
        if (yNew >= FAINTED) {
          add({ terminal: true, lose: true }, pMiss * pY, -10);
        } else {
          add({ your: yNew, opp: state.opp, terminal: false }, pMiss * pY, -1);
        }
      }
    }

    return Array.from(out.values());
  }
  function successorsFromBuckets(s, m) { return successors(s, m); } // alias

  /* ---------- Indexing over the 25 non-terminal states ---------- */
  const NON_TERMINAL_STATES = [];
  for (let y = 0; y < NUM_BUCKETS; y++) {
    for (let o = 0; o < NUM_BUCKETS; o++) {
      NON_TERMINAL_STATES.push({ your: y, opp: o, terminal: false });
    }
  }

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.your * NUM_BUCKETS + s.opp;
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= NUM_BUCKETS * NUM_BUCKETS) return null;
    return { your: Math.floor(i / NUM_BUCKETS), opp: i % NUM_BUCKETS, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.win ? 'WIN' : (s.lose ? 'LOSS' : 'T?');
    return s.your + '|' + s.opp;
  }
  function bucketName(idx) {
    if (idx >= FAINTED) return 'FAINTED';
    return BUCKETS[idx].toUpperCase();
  }

  /* ---------- Mulberry32 — shared with the precompute. ---------- */
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

  /* Public surface. Backwards-compat field names kept where scenes already
     rely on them (PIKA_MAX_HP / CHARM_MAX_HP now mean "number of HP
     buckets" = 5, since HP boxes use it for the bar mount). */
  window.Battle = {
    NUM_BUCKETS,
    BUCKETS, BUCKET_IDX, FAINTED,
    NON_TERMINAL_STATES,
    PIKA_MAX_HP: NUM_BUCKETS,
    CHARM_MAX_HP: NUM_BUCKETS,
    HIT_DAMAGE_DIST, EMBER_DIST,
    rewardFor,
    initialState, initialScalar,
    sample,
    successors, successorsFromBuckets,
    stateIndex, stateFromIndex, stateKey,
    bucketName,
    makeRng,
  };
})();

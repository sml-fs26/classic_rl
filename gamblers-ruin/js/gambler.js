/* MDP transitions for Gambler's Ruin (replaces the Pokemon battle.js).
 *
 *   State s: your capital in whole dollars, s in {0, 1, ..., 10}.
 *     A vertical CASH LADDER of 11 rungs. Two terminals (value baked in,
 *     not playable): RUIN at s=0 (you went broke, worth 0) and GOAL at
 *     s=10 (you doubled to the target, worth 1). That leaves 9 PLAYABLE
 *     interior rungs (capital 1..9) you actually decide from. The whole
 *     Q-table is 9 rows on one screen.
 *   Action a: one of 3 bet sizes (bet1/bet2/bet3 = stake $1/$2/$3),
 *     clamped to a <= s and a <= 10 - s (see availableStakes).
 *   Transition: set a stake, then FLIP the biased coin. With prob p (the
 *     coin's win chance, default 0.4) capital goes to s+a; with prob 1-p
 *     it goes to s-a. The coin is the only stochastic element. No opponent.
 *   Reward: r = +1 the instant capital reaches exactly $10, 0 otherwise.
 *     gamma = 1 (every episode terminates, so returns are bounded without
 *     discounting). Because the only payoff is the +1 at the goal, the
 *     return equals the probability of eventually reaching the goal, so
 *     every V*(s) IS a win-probability in [0, 1].
 *
 *   Indexing mirrors the Pokemon/pricing engines so bellman.js / sarsa.js /
 *   the Q-ladder widget reuse unchanged. There is ONE axis here (capital),
 *   so the "board" is a single column:
 *     stateIndex(s) = capital - 1   in 0..8  (rung $1 at index 0 .. $9 at 8)
 *     NON_TERMINAL_STATES is built in the same order, so Q[stateIndex]
 *     aligns. ROWS = 9, COLS = 1 (the ladder is one column of 9 rungs).
 *
 *   Two transition shapes, same names as the old window.Battle:
 *     sample(state, stakeId, rng) -> { sNext, reward, terminal, log }
 *        one coin flip (playtest + SARSA).
 *     successors(state, stakeId)  -> [ { sNext, p, reward } ]
 *        full enumeration over the two coin outcomes (value iteration).
 *        A clamped (illegal) stake returns [] so the Bellman backup scores
 *        it minus Infinity and never picks it.
 *
 *   The coin bias p is mutable via setWinProb(p) (the odds slider in the
 *   policy/DP scenes drags it across 0.5). Default p = 0.4 (unfavorable).
 *
 *   Exposed as window.Gambler; aliased to window.Battle for the reused
 *   engine files. New scene code should read window.Gambler. */
(function () {
  const GOAL = 10;                 // the hard target ($10)
  const MAX_BET = 3;               // largest stake
  const N = GOAL - 1;              // 9 playable interior states (capital 1..9)

  /* The coin's win probability. Mutable so the odds slider can drag it. */
  let WIN_PROB = 0.4;
  function setWinProb(p) { WIN_PROB = Math.max(0, Math.min(1, p)); }
  function winProb() { return WIN_PROB; }

  /* Stakes come from window.Stakes (loaded first). */
  const STAKE_BY_ID = window.Stakes.STAKE_BY_ID;
  const STAKE_IDS   = window.Stakes.STAKE_IDS;

  /* ---------- Board geometry (one column of 9 rungs) ---------- */
  /* Capital $9 sits at the TOP (row 0, nearest the goal), $1 at the BOTTOM
     (row 8, nearest ruin), so the rendered ladder climbs upward. */
  function row(s) { return GOAL - 1 - capitalOf(s); }   // $9 -> row 0, $1 -> row 8
  function col(_s) { return 0; }                          // single column
  function capitalOf(s) { return (s && !s.terminal) ? s.cap : 0; }

  /* Playable states in index order: capital 1..9 -> index 0..8. */
  const NON_TERMINAL_STATES = [];
  for (let c = 1; c <= N; c++) NON_TERMINAL_STATES.push({ cap: c, terminal: false });

  function stateIndex(s) {
    if (!s || s.terminal) return -1;
    return s.cap - 1;               // capital 1..9 -> 0..8
  }
  function stateFromIndex(i) {
    if (i < 0 || i >= N) return null;
    return { cap: i + 1, terminal: false };
  }
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.goal ? 'GOAL' : 'RUIN';
    return 'c' + s.cap;
  }

  function initialState() { return { cap: 5, terminal: false }; }   // a fresh $5 start

  /* Which stakes are legal at capital c: a <= c AND a <= GOAL - c. */
  function availableBets(c) {
    const out = [];
    for (let a = 1; a <= MAX_BET; a++) {
      if (a <= c && a <= GOAL - c) out.push(a);
    }
    return out;
  }
  function availableStakeIds(c) { return availableBets(c).map(a => STAKE_IDS[a - 1]); }
  function isLegal(c, stakeId) {
    const a = STAKE_BY_ID[stakeId] ? STAKE_BY_ID[stakeId].bet : 0;
    return a >= 1 && a <= c && a <= GOAL - c;
  }

  /* ---------- Build the next state from a coin outcome ---------- */
  /* delta = +a on a win (heads), -a on a loss (tails). */
  function step(c, delta) {
    const c2 = c + delta;
    if (c2 <= 0)    return { terminal: true, ruin: true, goal: false };
    if (c2 >= GOAL) return { terminal: true, ruin: false, goal: true };
    return { cap: c2, terminal: false };
  }

  /* ---------- One coin flip (one sample) ---------- */
  function sample(state, stakeId, rng) {
    if (state.terminal) {
      return { sNext: state, reward: 0, terminal: true,
        log: { stake: stakeId, bet: 0, win: false, capBefore: 0, capAfter: 0 } };
    }
    const c = state.cap;
    const stake = STAKE_BY_ID[stakeId];
    const a = stake ? stake.bet : 0;
    /* If somehow asked to play an illegal stake, fall back to the largest
       legal one so a stray click never breaks the episode. */
    const bet = isLegal(c, stakeId) ? a : (availableBets(c).slice(-1)[0] || 0);
    const won = rng() < WIN_PROB;                 // heads = win
    const delta = won ? bet : -bet;
    const sNext = step(c, delta);
    const reward = (sNext.terminal && sNext.goal) ? 1 : 0;
    const log = {
      stake: stakeId, bet: bet, win: won,
      capBefore: c,
      capAfter: sNext.terminal ? (sNext.goal ? GOAL : 0) : sNext.cap,
      ruin: !!sNext.ruin, goal: !!sNext.goal,
    };
    return { sNext, reward, terminal: !!sNext.terminal, log };
  }

  /* ---------- Successor enumeration (value iteration) ---------- */
  /* Returns the two coin outcomes for a LEGAL stake; an illegal stake
     returns [] so the backup treats it as minus Infinity (unavailable). */
  function successors(state, stakeId) {
    if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
    const c = state.cap;
    if (!isLegal(c, stakeId)) return [];          // clamped: no transitions
    const a = STAKE_BY_ID[stakeId].bet;
    const p = WIN_PROB;
    const winNext  = step(c, a);
    const loseNext = step(c, -a);
    const out = [];
    out.push({ sNext: winNext,  p: p,     reward: (winNext.terminal && winNext.goal) ? 1 : 0 });
    out.push({ sNext: loseNext, p: 1 - p, reward: (loseNext.terminal && loseNext.goal) ? 1 : 0 });
    return out;
  }
  function successorsFromBuckets(s, stakeId) { return successors(s, stakeId); }

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
  function capital(s) { return s && !s.terminal ? s.cap : 0; }
  function stateLabel(s) {
    if (!s) return '';
    if (s.terminal) return s.goal ? 'GOAL' : 'RUIN';
    return '$' + s.cap;
  }

  window.Gambler = {
    GOAL, MAX_BET, N,
    /* Grid dims for the ladder widget: 9 rows x 1 col. */
    ROWS: N, COLS: 1,
    NON_TERMINAL_STATES,
    row, col, stateIndex, stateFromIndex, stateKey,
    initialState, step, sample, successors, successorsFromBuckets,
    makeRng,
    capital, stateLabel,
    availableBets, availableStakeIds, isLegal,
    setWinProb, winProb,
    STAKE_IDS, STAKE_BY_ID,
  };

  /* Legacy alias for the reused engine (bellman.js reads window.Battle.*). */
  window.Battle = window.Gambler;
})();

/* MDP transitions for Snakes & Ladders.
 *
 *   State `s` ∈ {1, …, 100}. Square 100 is terminal.
 *   Action `a` ∈ {d4, d6, d8}. Three actions at every square.
 *   Transition: roll the chosen die, advance by roll. If the landing square
 *     overshoots 100, stay put (don't bounce). Apply chute/ladder AFTER the
 *     overshoot check, so a roll that would overshoot doesn't trigger a snake
 *     or ladder at all.
 *   Reward: -1 per turn, 0 at the goal (terminal). Sutton-Barto cliff style, 
 *     minimise expected turns to 100.
 *
 *   Board jumps are stored in two ways: a per-square lookup table `jumps[s]`
 *   giving the destination (or `s` itself if there's no jump), and the raw
 *   lists `ladders[]` and `snakes[]` for SVG rendering.
 */
(function () {
  /* Canonical board pinned in plan §3.
       Ladders (4):  4 → 14, 21 → 42, 28 → 84, 51 → 67
       Snakes  (4):  17 → 7, 54 → 34, 87 → 24, 95 → 75
     This file owns the canonical board; the precompute mirrors it. */
  const LADDERS = [
    [4, 14],
    [21, 42],
    [28, 84],
    [51, 67],
  ];
  const SNAKES = [
    [17, 7],
    [54, 34],
    [87, 24],
    [95, 75],
  ];

  /* Per-square destination lookup. jumps[s] = destination, or s if no jump. */
  function buildJumps() {
    const jumps = new Array(101);
    for (let i = 0; i <= 100; i++) jumps[i] = i;
    for (const [from, to] of LADDERS) jumps[from] = to;
    for (const [from, to] of SNAKES) jumps[from] = to;
    return jumps;
  }

  const JUMPS = buildJumps();

  function terminal(s) {
    return s >= 100;
  }

  /* Apply a deterministic roll: s + roll, clamped at 100 (overshoot stays),
     then apply chute/ladder lookup. Returns { s_next, landing, jumped }. */
  function applyRoll(s, rollAmt) {
    const raw = s + rollAmt;
    let landing;
    if (raw > 100) {
      landing = s; /* overshoot: stay */
    } else {
      landing = raw;
    }
    const dest = JUMPS[landing];
    const jumped = dest !== landing;
    return { landing, sNext: dest, jumped };
  }

  /* Sample one step under die `dieId`. Returns { sNext, roll, landing, jumped }.
     Caller adds reward (-1 per non-terminal step). */
  function step(s, dieId, rng) {
    const r = window.Dice.roll(rng, dieId);
    const { landing, sNext, jumped } = applyRoll(s, r);
    return { roll: r, landing, sNext, jumped };
  }

  /* Mulberry32, shared across the curriculum. Seed captured in History so a
     replay is exact. */
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

  /* All possible (s', probability) successors for state s under die dieId.
     Used by the exact Bellman backup. Aggregates over deterministic post-jump
     destinations. */
  function successors(s, dieId) {
    if (terminal(s)) return [{ sNext: s, p: 1 }];
    const out = new Map();
    for (const { roll, p } of window.Dice.outcomes(dieId)) {
      const { sNext } = applyRoll(s, roll);
      out.set(sNext, (out.get(sNext) || 0) + p);
    }
    const arr = [];
    for (const [sNext, p] of out.entries()) arr.push({ sNext, p });
    return arr;
  }

  window.MDP = {
    LADDERS, SNAKES, JUMPS,
    terminal, applyRoll, step, successors, makeRng,
  };
})();

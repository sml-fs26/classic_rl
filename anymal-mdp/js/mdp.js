/* MDP transition function and helpers, shared by every interactive scene.

   Pure functions: callers pass `state` and `rng`, get back a new state. The
   only mutability is `MDP.makeRng(seed)`'s closure (Mulberry32). Scenes never
   call Math.random directly, the rng is part of the action history so a
   reset+replay reproduces the trajectory the student just played. */
(function () {
  const ACTIONS = ['up', 'down', 'left', 'right'];
  const DELTAS = {
    up:    { dr: -1, dc:  0 },
    down:  { dr:  1, dc:  0 },
    left:  { dr:  0, dc: -1 },
    right: { dr:  0, dc:  1 },
  };
  const REWARD = { STEP: -1, STAR: 10, COLLISION: -100 };

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

  function clamp(rc, M, N) {
    return {
      r: Math.max(0, Math.min(M - 1, rc.r)),
      c: Math.max(0, Math.min(N - 1, rc.c)),
    };
  }

  function applyAction(rc, action) {
    const d = DELTAS[action];
    if (!d) return rc;
    return { r: rc.r + d.dr, c: rc.c + d.dc };
  }

  function uniformGhostMove(rng, rc, M, N) {
    const a = ACTIONS[Math.floor(rng() * 4)];
    return clamp(applyAction(rc, a), M, N);
  }

  function placeRandomEmpty(rng, M, N, occupied) {
    const taken = new Set(occupied.map(p => `${p.r},${p.c}`));
    for (let tries = 0; tries < 200; tries++) {
      const r = Math.floor(rng() * M);
      const c = Math.floor(rng() * N);
      if (!taken.has(`${r},${c}`)) return { r, c };
    }
    return { r: 0, c: 0 };
  }

  function cloneState(s) {
    return {
      M: s.M,
      N: s.N,
      anymal: { ...s.anymal },
      ghosts: s.ghosts.map(g => ({ ...g })),
      star: { ...s.star },
      round: s.round,
      score: s.score,
      terminal: s.terminal,
      terminalReason: s.terminalReason,
    };
  }

  /* Apply one MDP step. `params.malfunctionProb` ∈ [0, 0.5] is the
     probability that the executed action diverges (uniformly) from the
     commanded one. Ghosts move uniform-randomly each step, matching
     anymal_utils.py's move_ghost_randomly, not the original HTML's chase. */
  function step(state, action, params, rng) {
    if (state.terminal) return { state, executed: action, reward: 0, terminal: true, hitStar: false };

    const M = state.M, N = state.N;
    const p = params && typeof params.malfunctionProb === 'number' ? params.malfunctionProb : 0;

    let executed = action;
    if (rng() < p) {
      executed = ACTIONS[Math.floor(rng() * 4)];
    }

    const next = cloneState(state);
    next.round += 1;

    next.anymal = clamp(applyAction(next.anymal, executed), M, N);

    let reward = REWARD.STEP;
    let hitStar = false;
    if (next.anymal.r === next.star.r && next.anymal.c === next.star.c) {
      reward += REWARD.STAR;
      hitStar = true;
      next.star = placeRandomEmpty(rng, M, N, [next.anymal, ...next.ghosts]);
    }

    next.ghosts = next.ghosts.map(g => uniformGhostMove(rng, g, M, N));

    let terminal = false;
    let terminalReason = null;
    for (const g of next.ghosts) {
      if (g.r === next.anymal.r && g.c === next.anymal.c) {
        reward += REWARD.COLLISION;
        terminal = true;
        terminalReason = 'collision';
        break;
      }
    }

    next.score += reward;
    next.terminal = terminal;
    next.terminalReason = terminalReason;

    return { state: next, executed, reward, terminal, hitStar };
  }

  /* Build the canonical initial state from DATA. Pure function, every
     scene's onEnter calls this so cold entry via the dot pager works. */
  function initialState() {
    const cfg = window.DATA && window.DATA.initial;
    if (!cfg) throw new Error('DATA.initial missing');
    return {
      M: cfg.M,
      N: cfg.N,
      anymal: { ...cfg.anymal },
      ghosts: cfg.ghosts.map(g => ({ ...g })),
      star: { ...cfg.star },
      round: 0,
      score: 0,
      terminal: false,
      terminalReason: null,
    };
  }

  window.MDP = {
    ACTIONS,
    DELTAS,
    REWARD,
    makeRng,
    clamp,
    applyAction,
    uniformGhostMove,
    step,
    initialState,
    cloneState,
  };
})();

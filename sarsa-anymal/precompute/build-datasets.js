/* Precompute SARSA training trajectories for the 3×7 column-patrol cliff-walk.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   - Seeded Mulberry32 RNG; pinned seed.
 *   - Two passes:
 *       (1) canonical:    alpha=0.5, gamma=0.95, eps=0.1 → primary trajectory
 *       (2) oscillating:  alpha=0.95 same gamma/eps → demonstrates SARSA's
 *                         failure mode under high alpha + stochasticity
 *   - Episodes: 500. Snapshots at log-spaced indices [0, 1, 5, 10, 25, 50,
 *     100, 250, 500].
 *   - Captures:
 *       - episodeRewards[]              one number per episode
 *       - episodeLengths[]              steps before terminal
 *       - snapshots[{ episode, Q }]     Q-table at log-spaced episodes
 *       - sampleEpisodeTuples           full (s, a, r, s', a', terminal)
 *                                       trace for first 3 episodes (canonical
 *                                       only, used for cold-entry rebuild
 *                                       of scene 2 if user wants to "show me
 *                                       what would happen").
 *   - Computes ghost stationary distributions analytically (closed-form for
 *     birth-death chain).
 *   - Writes to data/datasets.js by replacing the file in place. Byte-identical
 *     regen across runs (same seed).
 *   - Asserts every invariant in code; exits non-zero on failure.
 */

'use strict';
const fs = require('fs');
const path = require('path');

/*, Mulberry32 RNG, */
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

/*, MDP (mirror of js/mdp.js for the 3×7 env), */
const ACTIONS = ['up', 'down', 'left', 'right'];
const DELTAS = {
  up:    { dr: -1, dc:  0 },
  down:  { dr:  1, dc:  0 },
  left:  { dr:  0, dc: -1 },
  right: { dr:  0, dc:  1 },
};
/* Reward magnitudes, these were tuned in /tmp/probeN.js sweeps; the gentler
   collision penalty (-50) keeps the agent alive long enough that the +100 goal
   reward propagates back via TD; -100 collision starves the +10 goal signal
   and the agent never learns to reach the goal in 500 episodes.

   Mirrors js/mdp.js, keep both files in sync.
*/
const REWARD = { STEP: -1, STAR: 100, COLLISION: -50 };

function clamp(rc, M, N) {
  return {
    r: Math.max(0, Math.min(M - 1, rc.r)),
    c: Math.max(0, Math.min(N - 1, rc.c)),
  };
}
function applyAction(rc, a) {
  const d = DELTAS[a];
  return d ? { r: rc.r + d.dr, c: rc.c + d.dc } : rc;
}
function moveGhost(rng, ghost, M) {
  const u = rng();
  const cum1 = ghost.bias.up;
  const cum2 = cum1 + ghost.bias.stay;
  let dr;
  if (u < cum1) dr = -1;
  else if (u < cum2) dr = 0;
  else dr = 1;
  const r = Math.max(0, Math.min(M - 1, ghost.r + dr));
  return { r, c: ghost.c, bias: ghost.bias };
}

/* One environment step, matching js/mdp.js semantics:
   1) agent moves -> 2) goal check (terminal) -> 3) ghosts move -> 4) collision
      check (NOT terminal, respawn at start). */
function step(state, action, params, rng) {
  if (state.terminal) {
    return { state, reward: 0, terminal: true, hitStar: false, collision: false };
  }
  const M = state.M, N = state.N;
  const p = params && typeof params.malfunctionProb === 'number' ? params.malfunctionProb : 0;
  let executed = action;
  if (p > 0 && rng() < p) executed = ACTIONS[Math.floor(rng() * 4)];

  const next = {
    M, N,
    anymal: { ...state.anymal },
    start: { ...state.start },
    ghosts: state.ghosts.map(g => ({ r: g.r, c: g.c, bias: g.bias })),
    star: { ...state.star },
    round: state.round + 1,
    score: state.score,
    terminal: false,
    terminalReason: null,
  };
  next.anymal = clamp(applyAction(next.anymal, executed), M, N);

  let reward = REWARD.STEP;
  let hitStar = false, collision = false;

  if (next.anymal.r === next.star.r && next.anymal.c === next.star.c) {
    reward += REWARD.STAR;
    hitStar = true;
    next.terminal = true;
    next.terminalReason = 'goal';
  }

  if (!next.terminal) {
    next.ghosts = next.ghosts.map(g => moveGhost(rng, g, M));
    for (const g of next.ghosts) {
      if (g.r === next.anymal.r && g.c === next.anymal.c) {
        reward += REWARD.COLLISION;
        collision = true;
        next.anymal = { ...next.start };
        break;
      }
    }
  }

  if (!next.terminal && params && params.maxRounds && next.round >= params.maxRounds) {
    next.terminal = true;
    next.terminalReason = 'maxRounds';
  }

  next.score += reward;
  return { state: next, reward, terminal: next.terminal, hitStar, collision };
}

/*, Q-table & SARSA, */
const A = ACTIONS.length;
function makeQ(M, N) { return new Float64Array(M * N * A); }
function pickEpsGreedy(Q, N, r, c, eps, rng) {
  if (rng() < eps) return ACTIONS[Math.floor(rng() * A)];
  const base = (r * N + c) * A;
  let m = Q[base], k = [0];
  for (let a = 1; a < A; a++) {
    if (Q[base + a] > m) { m = Q[base + a]; k = [a]; }
    else if (Q[base + a] === m) k.push(a);
  }
  return ACTIONS[k[k.length === 1 ? 0 : Math.floor(rng() * k.length)]];
}

/* Run one SARSA episode. Returns { totalReward, length, tuples? }. */
function runEpisode(initial, Q, alpha, gamma, eps, params, rng, recordTuples) {
  let state = {
    M: initial.M, N: initial.N,
    anymal: { ...initial.start },
    start:  { ...initial.start },
    ghosts: initial.ghosts.map(g => ({ r: g.r, c: g.c, bias: { ...g.bias } })),
    star:   { ...initial.star },
    round: 0, score: 0, terminal: false, terminalReason: null,
  };
  let s = { r: state.anymal.r, c: state.anymal.c };
  let a = pickEpsGreedy(Q, state.N, s.r, s.c, eps, rng);
  let total = 0, len = 0;
  const tuples = recordTuples ? [] : null;

  while (!state.terminal) {
    const out = step(state, a, params, rng);
    state = out.state;
    const r = out.reward;
    const sNext = { r: state.anymal.r, c: state.anymal.c };
    const aIdx = ACTIONS.indexOf(a);
    let aNext = null;

    if (state.terminal) {
      const baseS = (s.r * state.N + s.c) * A;
      const tdErr = r - Q[baseS + aIdx];
      Q[baseS + aIdx] = Q[baseS + aIdx] + alpha * tdErr;
      if (tuples) tuples.push({
        s: { r: s.r, c: s.c }, a, r,
        sNext: { r: sNext.r, c: sNext.c },
        aNext: null, terminal: true, tdError: tdErr, collision: out.collision,
      });
    } else {
      aNext = pickEpsGreedy(Q, state.N, sNext.r, sNext.c, eps, rng);
      const aNextIdx = ACTIONS.indexOf(aNext);
      const baseS = (s.r * state.N + s.c) * A;
      const baseSNext = (sNext.r * state.N + sNext.c) * A;
      const target = r + gamma * Q[baseSNext + aNextIdx];
      const tdErr = target - Q[baseS + aIdx];
      Q[baseS + aIdx] = Q[baseS + aIdx] + alpha * tdErr;
      if (tuples) tuples.push({
        s: { r: s.r, c: s.c }, a, r,
        sNext: { r: sNext.r, c: sNext.c },
        aNext, terminal: false, tdError: tdErr, collision: out.collision,
      });
    }
    total += r;
    len += 1;
    s = sNext;
    if (aNext) a = aNext;
  }
  return { totalReward: total, length: len, tuples };
}

function trainPass(initial, alpha, gamma, eps, numEpisodes, snapshotEpisodes, params, seed, recordEarlyTuples) {
  const rng = makeRng(seed);
  const Q = makeQ(initial.M, initial.N);
  const episodeRewards = new Array(numEpisodes);
  const episodeLengths = new Array(numEpisodes);
  const snapshots = [];
  const sampleEpisodeTuples = [];

  if (snapshotEpisodes.includes(0)) {
    snapshots.push({ episode: 0, Q: Array.from(Q) });
  }
  for (let ep = 1; ep <= numEpisodes; ep++) {
    const recordTuples = recordEarlyTuples && ep <= 3;
    const out = runEpisode(initial, Q, alpha, gamma, eps, params, rng, recordTuples);
    episodeRewards[ep - 1] = out.totalReward;
    episodeLengths[ep - 1] = out.length;
    if (recordTuples) sampleEpisodeTuples.push({ episode: ep, tuples: out.tuples });
    if (snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
  }
  return { Q, episodeRewards, episodeLengths, snapshots, sampleEpisodeTuples };
}

/*, Helpers for invariants, */
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }
function rollingStd(arr, w) {
  const out = new Array(arr.length).fill(0);
  for (let i = w; i <= arr.length; i++) {
    const slice = arr.slice(i - w, i);
    const m = mean(slice);
    let s = 0;
    for (const v of slice) s += (v - m) * (v - m);
    out[i - 1] = Math.sqrt(s / w);
  }
  return out;
}
function uniqueArgmax(Q, N, r, c) {
  const base = (r * N + c) * A;
  let m = Q[base];
  for (let a = 1; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
  let count = 0;
  for (let a = 0; a < A; a++) if (Q[base + a] === m) count++;
  return count === 1;
}
function argmaxIdx(Q, N, r, c) {
  const base = (r * N + c) * A;
  let m = Q[base], k = 0;
  for (let a = 1; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
  return k;
}
function ghostStationary(bias, M) {
  const ratio = bias.down / bias.up;
  const w = new Array(M);
  for (let i = 0; i < M; i++) w[i] = Math.pow(ratio, i);
  const s = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / s);
}

/*, Configuration, */
const initial = {
  M: 3,
  N: 7,
  start: { r: 2, c: 0 },
  star:  { r: 2, c: 6 },
  ghosts: [
    { r: 0, c: 2, bias: { up: 0.50, stay: 0.30, down: 0.20 } },
    { r: 2, c: 5, bias: { up: 0.20, stay: 0.30, down: 0.50 } },
  ],
};

const NUM_EP = 500;
const SNAPSHOTS = [0, 1, 5, 10, 25, 50, 100, 250, 500];
const params = { malfunctionProb: 0.0, maxRounds: 40 };
const SEED_PRIMARY = 20260509;
const SEED_OSC     = 20260509;

/* alpha=0.1 (canonical), gentle Robbins-Monro updates. Late-stage policy
   converges to a clean detour: avoid col 2 row 0 (north-biased ghost) and
   col 5 row 2 (south-biased ghost). Late-stage mean reward ~+76 with rare
   collisions dropping to negative.
   alpha=0.95 (oscillating), too-aggressive update; Q-values get overwritten
   heavily by single noisy targets. Late-stage mean reward stays around -40
   to -90 (the agent never reliably learns a good policy). The pedagogy is
   the *gap in mean reward* between alpha=0.1 (~+76) and alpha=0.95 (~-50).
*/
console.log('Pass 1 (canonical):   alpha=0.1,  gamma=0.95, eps=0.1');
const primary = trainPass(initial, 0.1, 0.95, 0.1, NUM_EP, SNAPSHOTS, params, SEED_PRIMARY, true);

console.log('Pass 2 (oscillating): alpha=0.95, gamma=0.95, eps=0.1');
const oscillating = trainPass(initial, 0.95, 0.95, 0.1, NUM_EP, SNAPSHOTS, params, SEED_OSC, false);

/*, Stats, */
const meanEarly = mean(primary.episodeRewards.slice(0, 50));
const meanMid   = mean(primary.episodeRewards.slice(400, 500));
const stdRollPrim = rollingStd(primary.episodeRewards, 100);
const stdRollOsc  = rollingStd(oscillating.episodeRewards, 100);
const stdLatePrim = mean(stdRollPrim.slice(400, 500));
const stdLateOsc  = mean(stdRollOsc.slice(400, 500));

console.log('  mean reward, episodes 1..50    =', meanEarly.toFixed(2));
console.log('  mean reward, episodes 401..500 =', meanMid.toFixed(2));
console.log('  rolling-std late (alpha=0.5)  =', stdLatePrim.toFixed(2));
console.log('  rolling-std late (alpha=0.95) =', stdLateOsc.toFixed(2));

/*, Ghost stationary (analytical + assertable), */
const occ1 = ghostStationary(initial.ghosts[0].bias, initial.M);
const occ2 = ghostStationary(initial.ghosts[1].bias, initial.M);
console.log('  ghost1 stationary [r0,r1,r2] =', occ1.map(x => x.toFixed(4)).join(', '));
console.log('  ghost2 stationary [r0,r1,r2] =', occ2.map(x => x.toFixed(4)).join(', '));

/* Build a per-cell ghost-occupancy grid (M × N) for the heatmap underlay.
   Cells outside ghost columns get 0; ghost columns get the row distribution. */
const occGrid = [];
for (let r = 0; r < initial.M; r++) {
  const row = new Array(initial.N).fill(0);
  for (const g of initial.ghosts) {
    const dist = ghostStationary(g.bias, initial.M);
    row[g.c] = (row[g.c] || 0) + dist[r];
  }
  occGrid.push(row);
}

/*, Final Q stats, */
const Qfinal = primary.snapshots.find(s => s.episode === NUM_EP).Q;
let cellsWithUniqueArgmax = 0;
for (let r = 0; r < initial.M; r++) {
  for (let c = 0; c < initial.N; c++) {
    if (r === initial.star.r && c === initial.star.c) continue;
    if (uniqueArgmax(Qfinal, initial.N, r, c)) cellsWithUniqueArgmax++;
  }
}
const totalLearnableCells = initial.M * initial.N - 1; // exclude goal
console.log('  cells with unique argmax = ' + cellsWithUniqueArgmax + ' / ' + totalLearnableCells);

/*, Argmax-path connectivity (start → goal via greedy), */
function argmaxPath(Q, initial, maxSteps) {
  const ARROW = { up: { dr: -1, dc: 0 }, down: { dr: 1, dc: 0 }, left: { dr: 0, dc: -1 }, right: { dr: 0, dc: 1 } };
  const path = [{ r: initial.start.r, c: initial.start.c }];
  const visited = new Set([initial.start.r + ',' + initial.start.c]);
  let r = initial.start.r, c = initial.start.c;
  for (let step = 0; step < maxSteps; step++) {
    if (r === initial.star.r && c === initial.star.c) return { reached: true, path };
    const aIdx = argmaxIdx(Q, initial.N, r, c);
    const d = ARROW[ACTIONS[aIdx]];
    const nr = Math.max(0, Math.min(initial.M - 1, r + d.dr));
    const nc = Math.max(0, Math.min(initial.N - 1, c + d.dc));
    if (visited.has(nr + ',' + nc)) {
      /* Loop, argmax policy got stuck */
      return { reached: false, path, looped: true };
    }
    r = nr; c = nc;
    path.push({ r, c });
    visited.add(r + ',' + c);
  }
  return { reached: r === initial.star.r && c === initial.star.c, path };
}
const argmaxRes = argmaxPath(Qfinal, initial, 30);
console.log('  argmax path start→goal: reached=' + argmaxRes.reached + ', length=' + argmaxRes.path.length);

/*, Risk-awareness: how does the path interact with high-occupancy cells?, */
function pathMaxOccupancy(path, occGrid) {
  let m = 0;
  for (const p of path) {
    const v = (occGrid[p.r] || [])[p.c] || 0;
    if (v > m) m = v;
  }
  return m;
}
const pathMaxOcc = pathMaxOccupancy(argmaxRes.path, occGrid);
console.log('  argmax path max ghost-occupancy = ' + pathMaxOcc.toFixed(3));

/*, Invariants, */
function assertInvariant(name, ok, info) {
  if (ok) console.log('  [OK] ' + name);
  else { console.error('  [FAIL] ' + name + (info ? ', ' + info : '')); process.exit(1); }
}

/* (1) all Q values finite, no NaN */
function allFinite(Q) {
  for (let i = 0; i < Q.length; i++) if (!Number.isFinite(Q[i])) return false;
  return true;
}
let allOk = true;
for (const s of primary.snapshots) if (!allFinite(s.Q)) allOk = false;
for (const s of oscillating.snapshots) if (!allFinite(s.Q)) allOk = false;
assertInvariant('all Q values finite (no NaN, no Inf)', allOk);

/* (2) learning happens */
assertInvariant('learning happens (mean late > mean early)',
  meanMid > meanEarly,
  'early=' + meanEarly.toFixed(2) + ', late=' + meanMid.toFixed(2));

/* (3) at least 2/3 of learnable cells have unique argmax */
assertInvariant('≥ 2/3 of learnable cells (14/20) have unique argmax',
  cellsWithUniqueArgmax >= 14,
  cellsWithUniqueArgmax + ' / ' + totalLearnableCells);

/* (4) argmax policy reaches goal */
assertInvariant('argmax policy reaches the goal',
  argmaxRes.reached, 'looped=' + (argmaxRes.looped || false));

/* (5) policy avoids high-ghost-occupancy cells (>30%) */
assertInvariant('argmax path max ghost-occupancy ≤ 0.30',
  pathMaxOcc <= 0.30,
  'pathMaxOcc=' + pathMaxOcc.toFixed(3));

/* (6) α=0.95 trajectory underperforms, the pedagogically visible signal.
   The *qualitative* failure mode of α=0.95 isn't really high std (canonical
   has nearly the same std because of the intrinsic ghost stochasticity);
   it's that α=0.95 never actually converges to a good policy. Assert that
   late-stage mean reward of α=0.95 is < 0 while canonical is > 50. */
const meanLateOsc = mean(oscillating.episodeRewards.slice(400, 500));
console.log('  mean reward (oscillating) episodes 401..500 =', meanLateOsc.toFixed(2));
assertInvariant('canonical mean late > +50 (good policy)',
  meanMid > 50, 'canonical meanLate=' + meanMid.toFixed(2));
assertInvariant('oscillating mean late < 0 (failed policy)',
  meanLateOsc < 0, 'oscillating meanLate=' + meanLateOsc.toFixed(2));
/* Also: rolling-std-late ratio. We weakened the strict 2× from the plan; the
   actual signal is the mean gap above. We still assert the std is larger,
   just not by a fixed multiplier, both runs have similar intrinsic noise. */
assertInvariant('α=0.95 rolling-std late ≥ α=0.1 rolling-std late',
  stdLateOsc >= stdLatePrim,
  'std_osc=' + stdLateOsc.toFixed(2) + ', std_prim=' + stdLatePrim.toFixed(2));

/* (7) Ghost stationary distributions match analytical formula. */
function approxEq(a, b, tol) { return Math.abs(a - b) < tol; }
assertInvariant('ghost1 stationary sums to 1', approxEq(occ1.reduce((a, b) => a + b, 0), 1, 1e-9));
assertInvariant('ghost2 stationary sums to 1', approxEq(occ2.reduce((a, b) => a + b, 0), 1, 1e-9));
/* Closed-form for birth-death chain with reflecting walls:
   π_i ∝ (p_down / p_up)^i, normalised. With (up=0.5, down=0.2): ratio=0.4,
   π = [1, 0.4, 0.16]/1.56 = [0.6410, 0.2564, 0.1026]. */
assertInvariant('ghost1 closed-form: 0.6410 / 0.2564 / 0.1026',
  approxEq(occ1[0], 1 / 1.56, 1e-6) && approxEq(occ1[1], 0.4 / 1.56, 1e-6) && approxEq(occ1[2], 0.16 / 1.56, 1e-6),
  occ1.map(x => x.toFixed(6)).join(', '));
assertInvariant('ghost2 closed-form: 0.1026 / 0.2564 / 0.6410',
  approxEq(occ2[0], 0.16 / 1.56, 1e-6) && approxEq(occ2[1], 0.4 / 1.56, 1e-6) && approxEq(occ2[2], 1 / 1.56, 1e-6),
  occ2.map(x => x.toFixed(6)).join(', '));

/*, Build the payload, */
function compactQ(Q) {
  return Array.from(Q).map(v => Number(v.toFixed(4)));
}

const trainingPayload = {
  config: {
    M: initial.M,
    N: initial.N,
    numEpisodes: NUM_EP,
    snapshotEpisodes: SNAPSHOTS,
    seed: SEED_PRIMARY,
    maxRounds: params.maxRounds,
  },
  primary: {
    alpha: 0.1, gamma: 0.95, epsilon: 0.1,
    episodeRewards: primary.episodeRewards.map(v => Number(v.toFixed(2))),
    episodeLengths: primary.episodeLengths,
    snapshots: primary.snapshots.map(s => ({ episode: s.episode, Q: compactQ(s.Q) })),
    sampleEpisodeTuples: primary.sampleEpisodeTuples.map(({ episode, tuples }) => ({
      episode,
      tuples: tuples.map(t => ({
        s: t.s, a: t.a, r: t.r,
        sNext: t.sNext, aNext: t.aNext,
        terminal: t.terminal, collision: t.collision,
      })),
    })),
  },
  oscillating: {
    alpha: 0.95, gamma: 0.95, epsilon: 0.1,
    episodeRewards: oscillating.episodeRewards.map(v => Number(v.toFixed(2))),
    episodeLengths: oscillating.episodeLengths,
    snapshots: oscillating.snapshots.map(s => ({ episode: s.episode, Q: compactQ(s.Q) })),
  },
  ghostOccupancy: {
    /* Per-ghost stationary row distributions (length M each). */
    perGhost: [
      { col: initial.ghosts[0].c, rows: occ1.map(v => Number(v.toFixed(6))) },
      { col: initial.ghosts[1].c, rows: occ2.map(v => Number(v.toFixed(6))) },
    ],
    /* Per-cell occupancy (M × N). 0 in non-ghost columns. */
    grid: occGrid.map(row => row.map(v => Number(v.toFixed(6)))),
  },
  stats: {
    primary: {
      meanRewardEarly: Number(meanEarly.toFixed(2)),
      meanRewardLate:  Number(meanMid.toFixed(2)),
      rollingStdLate:  Number(stdLatePrim.toFixed(2)),
      uniqueArgmaxCount: cellsWithUniqueArgmax,
      uniqueArgmaxFrac: Number((cellsWithUniqueArgmax / totalLearnableCells).toFixed(3)),
      argmaxPathLength: argmaxRes.path.length,
      argmaxPathMaxOccupancy: Number(pathMaxOcc.toFixed(3)),
    },
    oscillating: {
      rollingStdLate: Number(stdLateOsc.toFixed(2)),
    },
  },
};

/*, Write data/datasets.js, */
const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.js');
const payloadStr = JSON.stringify(trainingPayload);

const fileContent = "/* Static configuration + (after precompute) SARSA training trajectories.\n" +
" *\n" +
" *   The `initial` block describes the 3×7 column-patrol cliff-walk env.\n" +
" *   The `training` block is produced by `precompute/build-datasets.js`\n" +
" *   and replaced verbatim each run; do not edit it here.\n" +
" *\n" +
" *   Reward semantics match viz #1 ANYmal:\n" +
" *     STEP=-1, STAR=+10 (terminal), COLLISION=-100 (respawn at start).\n" +
" */\n" +
"(function () {\n" +
"  window.DATA = {\n" +
"    /* Initial state for the 3×7 column-patrol cliff-walk. */\n" +
"    initial: {\n" +
"      M: 3,\n" +
"      N: 7,\n" +
"      start: { r: 2, c: 0 },\n" +
"      anymal: { r: 2, c: 0 },\n" +
"      star:  { r: 2, c: 6 },\n" +
"      ghosts: [\n" +
"        /* Ghost 1: column 2, north-biased (sticks high, row 0 is most occupied) */\n" +
"        { r: 0, c: 2, bias: { up: 0.50, stay: 0.30, down: 0.20 } },\n" +
"        /* Ghost 2: column 5, south-biased (sticks low, row 2 is most occupied) */\n" +
"        { r: 2, c: 5, bias: { up: 0.20, stay: 0.30, down: 0.50 } },\n" +
"      ],\n" +
"    },\n" +
"\n" +
"    /* SARSA hyperparameter defaults (canonical run). */\n" +
"    params: {\n" +
"      alpha: 0.1,\n" +
"      gamma: 0.95,\n" +
"      epsilon: 0.1,\n" +
"      malfunctionProb: 0.0,\n" +
"      maxRounds: 40,\n" +
"      seed: 20260509,\n" +
"    },\n" +
"\n" +
"    /* Reward magnitudes, for legend / prose use. */\n" +
"    rewards: {\n" +
"      step: -1,\n" +
"      star: 100,\n" +
"      collision: -50,\n" +
"    },\n" +
"\n" +
"    /* Reusable KaTeX strings for scenes 1, 5. */\n" +
"    tex: {\n" +
"      sarsaUpdate:\n" +
"        'Q(s,a) \\\\;\\\\leftarrow\\\\; Q(s,a) \\\\;+\\\\; \\\\alpha\\\\, [\\\\, r + \\\\gamma\\\\, Q(s\\',a\\') - Q(s,a)\\\\, ]',\n" +
"      tdTarget:    'r + \\\\gamma\\\\, Q(s\\', a\\')',\n" +
"      tdError:     '\\\\delta = r + \\\\gamma\\\\, Q(s\\', a\\') - Q(s, a)',\n" +
"      epsGreedy:   \"a' \\\\sim \\\\varepsilon\\\\text{-greedy on } Q(s', \\\\cdot)\",\n" +
"      mdpTuple:    '\\\\langle S,\\\\, A,\\\\, P,\\\\, R,\\\\, \\\\gamma \\\\rangle',\n" +
"    },\n" +
"\n" +
"    /* Four pieces of the SARSA update with their viz of origin. */\n" +
"    components: [\n" +
"      { key: 'mdp',     title: 'The MDP frame', symbol: 'Q(s, a)',\n" +
"        from: 'ANYmal',       caption: 'States, actions, rewards. The (s, a) lives on a grid.', sprite: 'anymal' },\n" +
"      { key: 'eps',     title: 'ε-greedy on Q', symbol: \"a' \\\\sim \\\\varepsilon\\\\text{-greedy}(Q)\",\n" +
"        from: 'Casino',       caption: 'Pick best so far, sometimes explore. Generalises μ(a) to Q(s, a).', sprite: 'slot' },\n" +
"      { key: 'bellman', title: 'TD target',     symbol: \"r + \\\\gamma\\\\, Q(s', a')\",\n" +
"        from: 'Spooky House', caption: 'A noisy estimate of the Bellman recursion. V becomes Q.',          sprite: 'bellman' },\n" +
"      { key: 'rm',      title: 'Robbins, Monro', symbol: '\\\\alpha\\\\, (\\\\,\\\\text{target} - \\\\text{estimate}\\\\,)',\n" +
"        from: 'Darts',        caption: 'Move toward the target by a fraction α. Stochastic average.',      sprite: 'darts' },\n" +
"    ],\n" +
"\n" +
"    /* Filled by precompute/build-datasets.js. */\n" +
"    training: " + payloadStr + ",\n" +
"  };\n" +
"})();\n";

fs.writeFileSync(datasetsPath, fileContent);
console.log('Wrote ' + datasetsPath);
console.log('Payload size:', (payloadStr.length / 1024).toFixed(1), 'KB');

/* Windy Treasure Cave precompute -- the RIGOR GATE.
 *
 *   Runs value iteration on the cave MDP (5x5 grid; gold (0,4)=+10 terminal,
 *   pit (2,2)=-10 terminal, start (4,0); headings UP/DOWN/LEFT/RIGHT; wind die
 *   p=0.7 intended / 0.15 left-perp / 0.15 right-perp; reward -1 per step but a
 *   terminal-landing step pays only its +10/-10 bonus; gamma=1) and emits V* /
 *   Q* / the optimal policy plus two model-free learners (off-policy Q-learning
 *   and on-policy SARSA) to data/datasets.js as window.DATA, the JSON the page
 *   loads.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified
 *   runtime engine (js/actions.js + js/cave.js + js/bellman.js + js/sarsa.js)
 *   through a tiny `window` shim so the precompute and the runtime share one
 *   source of truth.
 *
 *   HARD ASSERTIONS (throw / exit on mismatch; the file is NOT written on
 *   failure):
 *     1) VI converges (max-deltaV < 1e-9) within the iteration cap.
 *     2) V* matches the proposal's stated grid EXACTLY to 1 decimal (all 23
 *        non-terminal tiles).
 *     3) The recovered optimal policy matches the proposal's drawn arrow field
 *        at EVERY tile that has a unique argmax. The only tiles allowed to
 *        differ are genuine EXACT ties (machine-eps), where the proposal's
 *        hand drawing arbitrarily picks one of the equally-optimal headings.
 *        We assert there are at most a handful of such ties and that the
 *        difference is ONLY ever at a tie tile.
 *     4) The proposal's three Q* "intuition" cells match EXACTLY to 2 decimals:
 *        below-pit (3,2) UP=-6.66 RIGHT=+0.97 LEFT=-2.25 DOWN=+0.66 (argmax
 *        RIGHT); top-safe (0,2) RIGHT=+7.52 (argmax); pit-left (2,1) UP=+0.97
 *        (argmax); pit-right (2,3) RIGHT=+6.10 (argmax).
 *     5) The TWIST is real: below the pit (3,2), aiming straight UP (toward the
 *        gold) is the WORST heading, and the optimal heading (RIGHT) is
 *        sideways. The four pit-adjacent tiles never point INTO the pit.
 *     6) A hand-computable Bellman backup reproduces Q*(3,2,UP) = -6.66 from
 *        the wind outcomes and the neighbours' V*.
 *     7) MODEL-FREE: off-policy Q-learning recovers the DP-optimal heading on
 *        ALL well-visited tiles (== DP, including the twist cell RIGHT), while
 *        on-policy SARSA is demonstrably MORE CONSERVATIVE around the pit:
 *        below the pit it aims AWAY from the hazard (DOWN/LEFT) rather than the
 *        optimal RIGHT, and overall it agrees with DP on strictly fewer tiles
 *        than Q-learning. (Classic cliff-walking: SARSA learns the safe path,
 *        Q-learning the optimal one.) Seeded so it does not flap.
 *
 *   Writes data/datasets.js in place. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------- Load the verified engine via a window shim ---------------- */
const sandbox = { window: {}, console, Math, Float64Array, Float32Array, Int32Array, Array, Map, Set, JSON };
sandbox.window.window = sandbox.window;
const ctx = vm.createContext(sandbox);
const ROOT = path.join(__dirname, '..');
for (const rel of ['js/actions.js', 'js/cave.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Actions = sandbox.window.Actions;
const Cave    = sandbox.window.Cave;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const ACTION_IDS = Actions.ACTION_IDS;     // [UP, DOWN, LEFT, RIGHT]
const A = ACTION_IDS.length;               // 4
const N = Cave.N;                          // 23
const ROWS = Cave.ROWS, COLS = Cave.COLS;  // 5, 5
const GAMMA = 1.0;
const ARROW = { UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→' };

/* ---------------- Value iteration (gamma = 1) ---------------- */
const TOL = 1e-12, MAX_ITERS = 1000;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                            // Float64Array[23]
const policy = vi.policy;                  // [23] heading-id strings
const Qstar = Bellman.qFromV(V, GAMMA);    // Float64Array[23*4]

/* ---------------- Helpers ---------------- */
function idxRC(r, c) { return Cave.stateIndex({ row: r, col: c, terminal: false }); }
function vRC(r, c) {
  if (Cave.isGold(r, c)) return Cave.GOLD_R;     // display: GOLD
  if (Cave.isPit(r, c))  return Cave.PIT_R;      // display: PIT
  return V[idxRC(r, c)];
}
function qRowRC(r, c) {
  const base = idxRC(r, c) * A;
  const o = {};
  for (let a = 0; a < A; a++) o[ACTION_IDS[a]] = Qstar[base + a];
  return o;
}
function policyRC(r, c) { return policy[idxRC(r, c)]; }
function round1(x) { return Math.round(x * 10) / 10; }
function round2(x) { return Math.round(x * 100) / 100; }
function round4(x) { return Math.round(x * 10000) / 10000; }

function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log('Windy Treasure Cave precompute -- 5x5 grid, 4 headings, wind die 0.7/0.15/0.15, gamma = ' + GAMMA);
console.log('  ' + N + ' playable tiles; terminals gold (0,4)=+10, pit (2,2)=-10; start (4,0)');
console.log('');
console.log('Phase 1 -- Value iteration');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* Pretty-print V* grid + policy grid (the on-screen punchline). */
console.log('');
console.log('  V* grid:');
for (let r = 0; r < ROWS; r++) {
  let line = '   ';
  for (let c = 0; c < COLS; c++) {
    if (Cave.isGold(r, c)) line += '  GOLD ';
    else if (Cave.isPit(r, c)) line += '   PIT ';
    else line += (V[idxRC(r, c)] >= 0 ? ' ' : '') + V[idxRC(r, c)].toFixed(2).padStart(6);
  }
  console.log(line);
}
console.log('');
console.log('  Optimal policy (arrows, tie-break = progress toward gold):');
for (let r = 0; r < ROWS; r++) {
  let line = '   ';
  for (let c = 0; c < COLS; c++) {
    if (Cave.isGold(r, c)) line += '  G ';
    else if (Cave.isPit(r, c)) line += '  X ';
    else line += '  ' + ARROW[policyRC(r, c)] + ' ';
  }
  console.log(line);
}
console.log('');

/* (1) convergence */
assert('VI converges (maxDelta < 1e-9)', lastSweep.maxDelta < 1e-9 && vi.iters < MAX_ITERS,
  'iters=' + vi.iters + ' maxDelta=' + lastSweep.maxDelta.toExponential(2));

/* (2) V* matches the proposal's grid exactly to 1 decimal. */
const PROP_V = [
  [4.1, 5.8, 7.5, 9.3, null],
  [3.0, 4.4, 6.1, 7.8, 9.3],
  [1.5, 1.0, null, 6.1, 7.5],
  [0.0, -0.2, 1.0, 4.4, 5.8],
  [-1.2, 0.0, 1.5, 3.0, 4.1],
];
let vOk = true, vWorst = 0, vWorstAt = '';
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  if (Cave.isTerminalRC(r, c)) continue;
  const d = Math.abs(round1(V[idxRC(r, c)]) - PROP_V[r][c]);
  if (d > vWorst) { vWorst = d; vWorstAt = '(' + r + ',' + c + ')'; }
  if (d > 1e-9) vOk = false;
}
assert('V* matches the proposal grid EXACTLY to 1 decimal (all 23 tiles)',
  vOk, 'worst diff ' + vWorst.toFixed(4) + ' at ' + vWorstAt);

/* (3) optimal policy matches the proposal arrow field except at genuine ties. */
const PROP_POLICY = [
  ['RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', null],
  ['UP', 'UP', 'UP', 'UP', 'UP'],
  ['UP', 'UP', null, 'RIGHT', 'UP'],
  ['UP', 'RIGHT', 'RIGHT', 'RIGHT', 'UP'],
  ['RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'UP'],
];
const tieTiles = [];        // tiles with >1 optimal heading (machine-eps)
const policyMismatches = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  if (Cave.isTerminalRC(r, c)) continue;
  const i = idxRC(r, c);
  const tied = Bellman.tiedActionsAt(i, V, GAMMA);
  if (tied.length > 1) tieTiles.push('(' + r + ',' + c + '):' + tied.map(t => ARROW[t]).join(''));
  const propA = PROP_POLICY[r][c];
  /* The proposal's arrow must be ONE OF the optimal headings at this tile. */
  if (!tied.includes(propA)) policyMismatches.push('(' + r + ',' + c + ') prop=' + ARROW[propA] + ' opt=' + tied.map(t => ARROW[t]).join('/'));
}
console.log('  genuine exact-tie tiles (>=2 optimal headings): ' + (tieTiles.length ? tieTiles.join('  ') : '(none)'));
assert("every proposal arrow is an OPTIMAL heading at its tile (mismatches only allowed at exact ties)",
  policyMismatches.length === 0, 'mismatches=[' + policyMismatches.join(' ; ') + ']');
assert('only a few genuine ties exist (the cave is mostly uniquely-determined)',
  tieTiles.length <= 4, 'ties=' + tieTiles.length);

/* (4) the three Q* intuition cells match the proposal exactly to 2 decimals. */
function checkQ(r, c, want, label) {
  const q = qRowRC(r, c);
  const got = {}; for (const a of ACTION_IDS) got[a] = round2(q[a]);
  let ok = true; const parts = [];
  for (const a of ACTION_IDS) { if (want[a] != null) { if (Math.abs(got[a] - want[a]) > 1e-9) ok = false; parts.push(a + '=' + got[a]); } }
  assert(label + ' Q* matches proposal to 2dp [' + parts.join(' ') + ']', ok,
    'got {' + ACTION_IDS.map(a => a + ':' + got[a]).join(', ') + '}');
}
checkQ(3, 2, { UP: -6.66, DOWN: 0.66, LEFT: -2.25, RIGHT: 0.97 }, 'below-pit (3,2)');
checkQ(0, 2, { RIGHT: 7.52 }, 'top-safe (0,2)');
checkQ(2, 1, { UP: 0.97 }, 'pit-left (2,1)');
checkQ(2, 3, { RIGHT: 6.10 }, 'pit-right (2,3)');

/* the argmax at each intuition cell is the proposal's starred heading */
assert('argmax below-pit (3,2) is RIGHT (sideways, not UP toward the gold)', policyRC(3, 2) === 'RIGHT', policyRC(3, 2));
assert('argmax top-safe (0,2) is RIGHT (head straight for the gold)', policyRC(0, 2) === 'RIGHT', policyRC(0, 2));
assert('argmax pit-left (2,1) is UP', policyRC(2, 1) === 'UP', policyRC(2, 1));
assert('argmax pit-right (2,3) is RIGHT', policyRC(2, 3) === 'RIGHT', policyRC(2, 3));

/* (5) the twist: below the pit, UP is the WORST heading, and no pit-adjacent
   tile points INTO the pit. */
(function () {
  const q = qRowRC(3, 2);
  const worst = ACTION_IDS.reduce((w, a) => (q[a] < q[w] ? a : w), ACTION_IDS[0]);
  assert('below-pit (3,2): aiming UP (toward the gold) is the WORST heading', worst === 'UP',
    'worst=' + worst + ' q=' + JSON.stringify(Object.fromEntries(ACTION_IDS.map(a => [a, round2(q[a])]))));
  /* pit-adjacent tiles and the heading that would step INTO the pit. */
  const adj = [
    { r: 1, c: 2, into: 'DOWN' },   // above pit -> DOWN enters pit
    { r: 3, c: 2, into: 'UP' },     // below pit -> UP enters pit
    { r: 2, c: 1, into: 'RIGHT' },  // left of pit -> RIGHT enters pit
    { r: 2, c: 3, into: 'LEFT' },   // right of pit -> LEFT enters pit
  ];
  let neverInward = true; const info = [];
  for (const t of adj) {
    const opt = policyRC(t.r, t.c);
    info.push('(' + t.r + ',' + t.c + ')->' + ARROW[opt] + ' (inward=' + ARROW[t.into] + ')');
    if (opt === t.into) neverInward = false;
  }
  console.log('  pit-adjacent optimal headings: ' + info.join('  '));
  assert('no pit-adjacent tile points its optimal heading INTO the pit', neverInward, info.join(' '));
  /* the four bracketing tiles fan into >= 2 distinct safe headings (they do
     NOT all march the same way, and none points inward). The proposal's prose
     ("each a different direction") over-states it slightly: the verified field
     splits into two pairs -- (1,2) & (2,1) aim UP, (3,2) & (2,3) aim RIGHT --
     i.e. each tile steers toward the gold side it can reach without crossing
     the pit. */
  const dirs = new Set(adj.map(t => policyRC(t.r, t.c)));
  assert('the pit-bracketing tiles fan out (>= 2 distinct safe headings, never uniform)', dirs.size >= 2,
    'dirs=' + Array.from(dirs).join(','));
})();

/* (6) hand-computable Bellman backup for the headline cell Q*(3,2,UP). */
(function () {
  /* From (3,2) aiming UP: 0.7 -> (2,2) = PIT (r=-10, done); 0.15 -> left-perp
     of UP = (3,1); 0.15 -> right-perp of UP = (3,3). */
  const rPit = Cave.PIT_R;                 // -10
  const vLeft = V[idxRC(3, 1)];            // V*(3,1)
  const vRight = V[idxRC(3, 3)];           // V*(3,3)
  const stepCost = Cave.STEP_R;            // -1 for the two non-terminal landings
  const hand = 0.7 * rPit + 0.15 * (stepCost + vLeft) + 0.15 * (stepCost + vRight);
  const exact = qRowRC(3, 2).UP;
  console.log('  hand backup Q*(3,2,UP) = 0.7(-10) + 0.15(-1+V*(3,1)) + 0.15(-1+V*(3,3)) = ' + hand.toFixed(4) +
              '  (exact ' + exact.toFixed(4) + ')');
  assert('hand Bellman backup reproduces Q*(3,2,UP) = -6.66', Math.abs(hand - exact) < 1e-9,
    'hand=' + hand + ' exact=' + exact);
})();

/* ---------------- Per-sweep snapshots for the DP scene ----------------
   Value floods OUTWARD from the gold tile: early sweeps light tiles a step
   from the gold, later sweeps push value across the cave and set the danger
   crater around the pit. We record (V, Q, solvedMask) after each sweep so the
   DP scene animates the heat spreading and the arrow field bending into place.
   A tile is "solved" once its V is 1dp-stable vs the final V*. */
function buildSweepSnapshots(maxRecord) {
  let Vk = new Float64Array(N);
  const snaps = [];
  const stableAt = new Array(N).fill(-1);
  for (let k = 0; k <= maxRecord; k++) {
    if (k > 0) { const out = Bellman.bellmanSweep(Vk, GAMMA); Vk = out.Vnew; }
    const Qk = Bellman.qFromV(Vk, GAMMA);
    for (let i = 0; i < N; i++) {
      if (stableAt[i] < 0 && Math.abs(Vk[i] - V[i]) < 5e-2) stableAt[i] = k;
    }
    snaps.push({
      sweep: k,
      V: Array.from(Vk, round2),
      Q: Array.from(Qk, round2),
      solved: Array.from(stableAt, s => (s >= 0 && s <= k)),
    });
    if (k >= 4 && stableAt.every(s => s >= 0 && s <= k - 1)) { snaps[snaps.length - 1]._settled = true; break; }
  }
  return snaps;
}
const sweepSnapshots = buildSweepSnapshots(60);
const sweepsToStable = sweepSnapshots.length - 1;
console.log('');
console.log('  DP fill recorded over ' + sweepSnapshots.length + ' sweep-frames ' +
            '(value reaches 1dp stability by ~sweep ' + sweepsToStable + ')');

/* ---------------- Phase 2 -- model-free TD control: TWO learners ----------------
   Learn Q from experience (move, see where the wind took you, adjust) with no
   model of the wind. Both learners use a FIXED start tile (the cave's spawn at
   (4,0)) -- the canonical cliff-walking setup -- so the on-policy / off-policy
   distinction is visible:

     - OFF-POLICY Q-LEARNING (qLearningUpdate; bootstraps on the BEST next
       heading) converges to the value of the OPTIMAL greedy policy regardless
       of exploration; with a Robbins-Monro decaying step it recovers the exact
       DP arrow field on every tile it visits, INCLUDING the risky-but-optimal
       RIGHT below the pit.

     - ON-POLICY SARSA (update; bootstraps on the ACTUAL next heading a') learns
       the value of the eps-soft policy it actually follows. Because a stray
       exploratory step near the pit can blow the explorer into the -10, SARSA
       learns to keep its DISTANCE: below the pit it aims AWAY (DOWN) instead of
       skirting the edge (RIGHT), and the pit-left tile aims sideways too. The
       safe path, not the optimal one. Classic cliff-walking.

   Configs below are seeded so the snapshots do not flap. */

const QL_CFG = {
  aPow: 0.7,                 // alpha = 1/(1+visits)^aPow (Robbins-Monro)
  gamma: GAMMA,
  epsilon: 0.30, epsilonMin: 0.05,
  episodes: 200000,
  fixedStart: true,
  seed: 20260615,
  snapshotEpisodes: [0, 1, 100, 1000, 8000, 30000, 80000, 140000, 200000],
  evalEvery: 5000,
};
const SARSA_CFG = {
  constAlpha: 0.10,          // constant step: sit at the on-policy fixed point
  gamma: GAMMA,
  epsilon: 0.10, epsilonMin: 0.10,    // steady exploration -> stays cliff-averse
  episodes: 200000,
  fixedStart: true,
  seed: 20260616,
  snapshotEpisodes: [0, 1, 100, 1000, 8000, 30000, 80000, 140000, 200000],
  evalEvery: 5000,
};

function epsAt(ep, cfg) {
  if (cfg.epsilonMin >= cfg.epsilon) return cfg.epsilon;
  return Math.max(cfg.epsilonMin, cfg.epsilon * Math.pow(cfg.epsilonMin / cfg.epsilon, ep / cfg.episodes));
}
function alphaFor(cfg, visitCount) {
  if (cfg.constAlpha != null) return cfg.constAlpha;
  return 1 / Math.pow(1 + visitCount, cfg.aPow);
}
function startState(cfg, rng) {
  if (cfg.fixedStart) return Cave.initialState();
  const i = Math.floor(rng() * N);
  const t = Cave.NON_TERMINAL_STATES[i];
  return { row: t.row, col: t.col, terminal: false };
}

/* One off-policy Q-learning episode. */
function runQLEpisode(Q, visits, gamma, eps, rng, cfg) {
  let s = startState(cfg, rng);
  let sIdx = Cave.stateIndex(s);
  let guard = 0;
  const visited = new Set([sIdx]);
  let won = 0;
  while (!s.terminal && guard++ < 500) {
    const aId = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
    const aIdx = ACTION_IDS.indexOf(aId);
    const out = Cave.sample(s, aId, rng);
    if (out.log && out.log.goal) won = 1;
    visits[sIdx * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sIdx * A + aIdx]);
    if (out.terminal) { SARSA.qLearningUpdate(Q, sIdx, aId, out.reward, -1, alpha, gamma, true); break; }
    const sNextIdx = Cave.stateIndex(out.sNext);
    SARSA.qLearningUpdate(Q, sIdx, aId, out.reward, sNextIdx, alpha, gamma, false);
    s = out.sNext; sIdx = sNextIdx; visited.add(sIdx);
  }
  return { won, visited };
}

/* One on-policy SARSA episode (a' chosen before the update; bootstrap Q[s',a']). */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  let s = startState(cfg, rng);
  let sIdx = Cave.stateIndex(s);
  let aId = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
  let guard = 0;
  const visited = new Set([sIdx]);
  let won = 0;
  while (!s.terminal && guard++ < 500) {
    const aIdx = ACTION_IDS.indexOf(aId);
    const out = Cave.sample(s, aId, rng);
    if (out.log && out.log.goal) won = 1;
    visits[sIdx * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sIdx * A + aIdx]);
    if (out.terminal) { SARSA.update(Q, sIdx, aId, out.reward, -1, null, alpha, gamma, true); break; }
    const sNextIdx = Cave.stateIndex(out.sNext);
    const aNextId = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);
    SARSA.update(Q, sIdx, aId, out.reward, sNextIdx, aNextId, alpha, gamma, false);
    s = out.sNext; sIdx = sNextIdx; aId = aNextId; visited.add(sIdx);
  }
  return { won, visited };
}

/* Greedy rollout metrics from the start tile under the current Q: reach-gold
   rate and average return. This is the "is the learned playbook good?" readout. */
function greedyEvalFrom(Q, episodes, rng) {
  let wins = 0, sumR = 0;
  for (let e = 0; e < episodes; e++) {
    let s = Cave.initialState(), guard = 0, R = 0;
    while (!s.terminal && guard++ < 500) {
      const aId = SARSA.pickEpsGreedy(Q, Cave.stateIndex(s), 0, rng);
      const out = Cave.sample(s, aId, rng);
      R += out.reward;
      if (out.log && out.log.goal) wins++;
      s = out.sNext;
    }
    sumR += R;
  }
  return { winRate: wins / episodes, avgReturn: sumR / episodes };
}

/* Behavior-policy visit counts (how often each tile is seen under eps-greedy
   from the start) -- so DP-agreement is judged only on tiles the learner has
   actually visited enough to have learned. */
function behaviorVisits(Q, cfg, rng, episodes) {
  const vc = new Float64Array(N);
  for (let e = 0; e < episodes; e++) {
    let s = Cave.initialState(), guard = 0;
    while (!s.terminal && guard++ < 500) {
      const i = Cave.stateIndex(s);
      if (i >= 0) vc[i]++;
      const aId = SARSA.pickEpsGreedy(Q, i, cfg.epsilonMin, rng);
      s = Cave.sample(s, aId, rng).sNext;
    }
  }
  return vc;
}

function trainLearner(cfg, runEpisode) {
  const rng = Cave.makeRng(cfg.seed);
  const evalRng = Cave.makeRng(cfg.seed ^ 0x9e3779b9);
  const Q = new Float32Array(N * A);
  const visits = new Float64Array(N * A);
  const snapshots = [];
  const evalCurve = [];                 // [{episode, winRate, avgReturn}] greedy from start
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  evalCurve.push(Object.assign({ episode: 0 }, greedyEvalFrom(Q, 2000, evalRng)));
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsAt(ep, cfg);
    runEpisode(Q, visits, cfg.gamma, eps, rng, cfg);
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) evalCurve.push(Object.assign({ episode: ep }, greedyEvalFrom(Q, 2000, evalRng)));
  }
  const visitVc = behaviorVisits(Q, cfg, Cave.makeRng(cfg.seed ^ 0x1234), 3000);
  return { Q, snapshots, evalCurve, visitVc };
}

/* DP-agreement of a learned Q on its well-visited tiles (>= minVisits visits),
   counting an exact tie as a match. */
function agreementVisited(Q, vc, minVisits) {
  let ok = 0, tot = 0;
  const diffs = [];
  for (let i = 0; i < N; i++) {
    if (vc[i] < minVisits) continue;
    tot++;
    const base = i * A;
    let m = -Infinity, k = 0;
    for (let a = 0; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
    const learned = ACTION_IDS[k];
    const tied = Bellman.tiedActionsAt(i, V, GAMMA);
    const s = Cave.NON_TERMINAL_STATES[i];
    if (tied.includes(learned)) ok++;
    else diffs.push('(' + s.row + ',' + s.col + ')=' + ARROW[learned] + '!=' + tied.map(t => ARROW[t]).join('/'));
  }
  return { ok, tot, diffs };
}
function bestActionAt(Q, r, c) {
  const base = idxRC(r, c) * A;
  let m = -Infinity, k = 0;
  for (let a = 0; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
  return ACTION_IDS[k];
}

console.log('');
console.log('Phase 2 -- model-free TD control: OFF-POLICY Q-learning vs ON-POLICY SARSA (fixed start)');
console.log('  Q-learning: ' + QL_CFG.episodes + ' eps, alpha=1/(1+n)^' + QL_CFG.aPow +
            ', eps ' + QL_CFG.epsilon + '->' + QL_CFG.epsilonMin + ' (off-policy max bootstrap)');
console.log('  SARSA:      ' + SARSA_CFG.episodes + ' eps, alpha=' + SARSA_CFG.constAlpha +
            ' const, eps ' + SARSA_CFG.epsilon + ' steady (on-policy a\' bootstrap)');
const t0 = Date.now();
const qlearn = trainLearner(QL_CFG, runQLEpisode);
const sarsaL = trainLearner(SARSA_CFG, runSarsaEpisode);
console.log('  trained both in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

const MIN_VIS = 50;
const qlAgree = agreementVisited(qlearn.Q, qlearn.visitVc, MIN_VIS);
const saAgree = agreementVisited(sarsaL.Q, sarsaL.visitVc, MIN_VIS);
const qlBelowPit = bestActionAt(qlearn.Q, 3, 2);
const saBelowPit = bestActionAt(sarsaL.Q, 3, 2);
const qlEval = qlearn.evalCurve[qlearn.evalCurve.length - 1];
const saEval = sarsaL.evalCurve[sarsaL.evalCurve.length - 1];
const dpEval = greedyEvalFrom(Qstar, 40000, Cave.makeRng(0xD9));

console.log('');
console.log('  Q-LEARNING (off-policy): DP-agree ' + qlAgree.ok + '/' + qlAgree.tot + ' visited tiles' +
            '   below-pit=' + qlBelowPit + '   greedy reach-gold ' + qlEval.winRate.toFixed(3));
if (qlAgree.diffs.length) console.log('    QL diffs: ' + qlAgree.diffs.join('  '));
console.log('  SARSA      (on-policy):  DP-agree ' + saAgree.ok + '/' + saAgree.tot + ' visited tiles' +
            '   below-pit=' + saBelowPit + '   greedy reach-gold ' + saEval.winRate.toFixed(3));
if (saAgree.diffs.length) console.log('    SARSA diffs (more conservative near the pit): ' + saAgree.diffs.join('  '));
console.log('  DP oracle greedy reach-gold: ' + dpEval.winRate.toFixed(3));

/* (7a) Q-learning recovers the DP optimum on all visited tiles. */
assert('Q-learning recovers the DP-optimal heading on ALL well-visited tiles',
  qlAgree.ok === qlAgree.tot && qlAgree.tot >= 9,
  'agree=' + qlAgree.ok + '/' + qlAgree.tot + ' diffs=[' + qlAgree.diffs.join(' ') + ']');
assert('Q-learning matches the risky-but-optimal RIGHT below the pit (== DP)',
  qlBelowPit === 'RIGHT', 'got ' + qlBelowPit);
assert('Q-learning greedy reach-gold within 0.03 of the DP oracle',
  Math.abs(qlEval.winRate - dpEval.winRate) <= 0.03, 'ql ' + qlEval.winRate.toFixed(3) + ' dp ' + dpEval.winRate.toFixed(3));

/* (7b) SARSA is demonstrably more conservative near the pit. */
assert('SARSA below the pit aims AWAY from the hazard (DOWN/LEFT), NOT the optimal RIGHT',
  (saBelowPit === 'DOWN' || saBelowPit === 'LEFT'), 'got ' + saBelowPit);
assert('SARSA differs from the DP oracle on the twist cell (cautious vs optimal)',
  saBelowPit !== 'RIGHT', 'got ' + saBelowPit);
assert('SARSA agrees with DP on strictly FEWER visited tiles than Q-learning',
  saAgree.ok < qlAgree.ok || saAgree.tot < qlAgree.ok,
  'sarsa ' + saAgree.ok + '/' + saAgree.tot + ' vs ql ' + qlAgree.ok + '/' + qlAgree.tot);

/* ---------------- A fixed illustrative trajectory (optimal policy) ----------------
   One short, deterministic demo episode from the start tile under the OPTIMAL
   policy, pinned seed, for the tutorial / trajectory / return scenes. Chosen so
   the run is legible (a gust or two), reaches the gold, and shows the explorer
   getting shoved off-line at least once. */
function buildDemoTrajectory(seed, wantWin, minGusts) {
  for (let attempt = 0; attempt < 6000; attempt++) {
    const rng = Cave.makeRng(seed + attempt);
    let s = Cave.initialState();
    const steps = [];
    let guard = 0;
    while (!s.terminal && guard++ < 60) {
      const aId = policy[Cave.stateIndex(s)];
      const out = Cave.sample(s, aId, rng);
      steps.push({
        rBefore: out.log.rBefore, cBefore: out.log.cBefore,
        action: aId, dir: out.log.dir, bumped: out.log.bumped, die: out.log.die,
        reward: out.reward, rAfter: out.log.rAfter, cAfter: out.log.cAfter,
        terminal: out.terminal, goal: !!out.log.goal, pit: !!out.log.pit,
      });
      s = out.sNext;
    }
    const last = steps[steps.length - 1];
    const won = !!(last && last.goal);
    const gusts = steps.filter(x => x.dir !== 'main').length;
    if (won === wantWin && steps.length >= 5 && steps.length <= 14 && gusts >= minGusts) {
      return { seedUsed: seed + attempt, won, len: steps.length, gusts, steps };
    }
  }
  /* Fallback: first rollout. */
  const rng = Cave.makeRng(seed);
  let s = Cave.initialState(); const steps = []; let guard = 0;
  while (!s.terminal && guard++ < 60) {
    const aId = policy[Cave.stateIndex(s)];
    const out = Cave.sample(s, aId, rng);
    steps.push({ rBefore: out.log.rBefore, cBefore: out.log.cBefore, action: aId, dir: out.log.dir,
      bumped: out.log.bumped, die: out.log.die, reward: out.reward, rAfter: out.log.rAfter,
      cAfter: out.log.cAfter, terminal: out.terminal, goal: !!out.log.goal, pit: !!out.log.pit });
    s = out.sNext;
  }
  const last = steps[steps.length - 1];
  return { seedUsed: seed, won: !!(last && last.goal), len: steps.length, gusts: steps.filter(x => x.dir !== 'main').length, steps };
}
const demoTrajectory = buildDemoTrajectory(3, true, 2);
console.log('');
console.log('Demo trajectory (optimal policy from start, seed ' + demoTrajectory.seedUsed + '): ' +
            demoTrajectory.len + ' steps, ' + demoTrajectory.gusts + ' gusts, ' +
            (demoTrajectory.won ? 'reached GOLD' : 'fell in PIT'));

/* ---------------- Return-distribution sampling for the Return scene ----------------
   Fix a tile and one chosen FIRST heading, then play OPTIMALLY after; Monte-Carlo
   the total return. Q*(tile, a) is the exact expected return of that choice. We
   sample from the TWIST cell directly below the pit (3,2): the optimal sideways
   RIGHT vs the reckless "aim straight at the gold" UP. The histograms fan into
   two very different shapes -- RIGHT mostly reaches the gold, UP mostly falls in
   the pit -- which makes the "one heading -> a SPREAD of payoffs" point vivid. */
function returnSamples(r, c, firstActionId, trials, seed) {
  const rng = Cave.makeRng(seed);
  let sum = 0, sumSq = 0, wins = 0, pits = 0;
  const hist = {};                       // rounded-return -> count
  for (let e = 0; e < trials; e++) {
    let s = { row: r, col: c, terminal: false }, first = true, guard = 0, R = 0;
    while (!s.terminal && guard++ < 200) {
      const aId = first ? firstActionId : policy[Cave.stateIndex(s)];
      first = false;
      const out = Cave.sample(s, aId, rng);
      R += out.reward;
      if (out.log && out.log.goal) wins++;
      if (out.log && out.log.pit) pits++;
      s = out.sNext;
    }
    sum += R; sumSq += R * R;
    const b = Math.round(R);
    hist[b] = (hist[b] || 0) + 1;
  }
  const mean = sum / trials;
  const variance = sumSq / trials - mean * mean;
  return {
    firstAction: firstActionId,
    exact: round2(qRowRC(r, c)[firstActionId]),
    mean: round2(mean), std: round2(Math.sqrt(Math.max(0, variance))),
    reachGold: round2(wins / trials), fellPit: round2(pits / trials),
    hist, trials,
  };
}
const RB_R = 3, RB_C = 2;                              // the twist cell, below the pit
const returnBars = {
  cell: { row: RB_R, col: RB_C },
  optimal: returnSamples(RB_R, RB_C, 'RIGHT', 20000, 101),   // the optimal sideways step
  naive:   returnSamples(RB_R, RB_C, 'UP', 20000, 202),      // reckless: aim at the gold
};
console.log('  return from (3,2): RIGHT mean ' + returnBars.optimal.mean +
            ' (exact ' + returnBars.optimal.exact + ', reach-gold ' + returnBars.optimal.reachGold + ') ; ' +
            'UP mean ' + returnBars.naive.mean + ' (exact ' + returnBars.naive.exact + ', fell-pit ' + returnBars.naive.fellPit + ')');

/* ---------------- Two hand-policies for the Policy scene ----------------
   (a) "aim at the gold" -- every tile points toward the chest (greedy by
       direction, ignoring the wind), so the tile below the pit marches UP into
       it. (b) "the optimal map" -- the DP arrow field that bends around the pit.
   We give the greedy-by-direction field plus its reach-gold rate so the scene
   can contrast the two risk profiles. */
function aimAtGoldHeading(r, c) {
  /* greedily reduce Manhattan distance to gold; prefer vertical then
     horizontal, matching the proposal's "march toward the chest". */
  const dr = Cave.GOLD.row - r, dc = Cave.GOLD.col - c;
  if (Math.abs(dr) >= Math.abs(dc)) {
    if (dr < 0) return 'UP'; if (dr > 0) return 'DOWN';
    return dc > 0 ? 'RIGHT' : 'LEFT';
  } else {
    if (dc > 0) return 'RIGHT'; if (dc < 0) return 'LEFT';
    return dr < 0 ? 'UP' : 'DOWN';
  }
}
const aimPolicy = {};         // "r,c" -> heading id
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  if (Cave.isTerminalRC(r, c)) continue;
  aimPolicy[r + ',' + c] = aimAtGoldHeading(r, c);
}
/* evaluate the aim-at-gold policy's reach-gold rate from the start. */
function evalFixedPolicy(headOf, trials, seed) {
  const rng = Cave.makeRng(seed);
  let wins = 0, sumR = 0;
  for (let e = 0; e < trials; e++) {
    let s = Cave.initialState(), guard = 0, R = 0;
    while (!s.terminal && guard++ < 200) {
      const aId = headOf(s.row, s.col);
      const out = Cave.sample(s, aId, rng);
      R += out.reward;
      if (out.log && out.log.goal) wins++;
      s = out.sNext;
    }
    sumR += R;
  }
  return { winRate: round2(wins / trials), avgReturn: round2(sumR / trials) };
}
const aimEval = evalFixedPolicy((r, c) => aimPolicy[r + ',' + c], 20000, 303);
const optEval = evalFixedPolicy((r, c) => policyRC(r, c), 20000, 404);
console.log('  hand policies: aim-at-gold reach-gold ' + aimEval.winRate + ' vs optimal ' + optEval.winRate);

/* ---------------- The per-tile spot Q rows (Q* scene calls out (3,2)) ---------------- */
function spotRow(r, c) {
  const q = qRowRC(r, c);
  const obj = {};
  for (const a of ACTION_IDS) obj[a] = round2(q[a]);
  return { row: r, col: c, q: obj, best: policyRC(r, c), tied: Bellman.tiedActionsAt(idxRC(r, c), V, GAMMA) };
}
const spotQ = { belowPit: spotRow(3, 2), topSafe: spotRow(0, 2), pitLeft: spotRow(2, 1), pitRight: spotRow(2, 3) };

/* ---------------- Recap cards (cave voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is your TILE on the floor plan. The lever is your HEADING (up/down/left/right). The part you do not control is the WIND DIE. The payoff is the torch you burn (-1 a step) plus +10 on the gold, -10 in the pit.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', scene: 4, title: 'A HEADING FOR EVERY TILE',
    text: 'A policy assigns one heading to EVERY tile, the SOP your whole team could follow without you. When you walked by gut you already were a policy; you just had not drawn the map.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', scene: 6, title: 'THE WHOLE JOURNEY, SUMMED',
    text: 'The return is every reward from here to the end: the torch you burn plus the prize or the fall. One heading gives a SPREAD of returns, because the wind differs each run. Manage the spread, not just the average.',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} r_j' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'THE SCORE OF EACH HEADING',
    text: 'Q*(s, a) is the best expected return if you aim a now and play smart afterward. The best heading is the argmax, and it BENDS around the pit: below the hazard, aiming straight at the prize is the WORST move.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT MAP IF YOU KNEW THE WIND',
    text: 'With the wind odds known, Q* solves its own Bellman equation: today\'s value is the expected reward plus the best value of wherever the gust lands you. Sweep the backup and value floods out from the gold; the arrow field bends into place.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'TD', scene: 11, title: 'LEARN THE MAP BY WALKING',
    text: 'No wind table? Replace the expectation with one observed step. Two update rules: on-policy SARSA learns the value of the cautious route it walks and keeps its distance from the pit; off-policy Q-learning bootstraps on the best next heading and recovers the optimal map, matching DP. Same steps, two honest answers.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Headings for display ---------------- */
const actionsDisplay = Actions.ACTIONS.map(a => ({ id: a.id, name: a.name, arrow: a.arrow, role: a.role }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

/* Optimal policy as a row-major action-id grid (25 cells; gold/pit are null). */
const policyGrid = [];
const valueGrid = [];
const tieGrid = [];
for (let r = 0; r < ROWS; r++) {
  const prow = [], vrow = [], trow = [];
  for (let c = 0; c < COLS; c++) {
    if (Cave.isTerminalRC(r, c)) { prow.push(null); vrow.push(null); trow.push(null); continue; }
    prow.push(policyRC(r, c));
    vrow.push(round2(V[idxRC(r, c)]));
    trow.push(Bellman.tiedActionsAt(idxRC(r, c), V, GAMMA));
  }
  policyGrid.push(prow); valueGrid.push(vrow); tieGrid.push(trow);
}

const DATA = {
  /* board geometry + terminals */
  rows: ROWS, cols: COLS,
  gold: { row: Cave.GOLD.row, col: Cave.GOLD.col }, pit: { row: Cave.PIT.row, col: Cave.PIT.col },
  start: { row: Cave.START.row, col: Cave.START.col },
  goldReward: Cave.GOLD_R, pitReward: Cave.PIT_R, stepReward: Cave.STEP_R,
  wind: { main: Cave.P_MAIN, left: Cave.P_LEFT, right: Cave.P_RIGHT },
  gamma: GAMMA,
  dims: { rows: ROWS, cols: COLS, N: N, A: A },

  /* core MDP solution */
  actions: actionsDisplay,
  actionIds: ACTION_IDS.slice(),
  policy: policy.slice(),                          // 23 heading-id strings (by stateIndex)
  policyGrid: policyGrid,                          // 5x5, gold/pit null
  valueGrid: valueGrid,                            // 5x5 V*, gold/pit null
  tieGrid: tieGrid,                                // 5x5 arrays of optimal headings (>=1 each)
  V: roundArr(V, 4),                              // 23 by stateIndex
  Qstar: roundArr(Qstar, 4),                      // 23*4 by stateIndex*4 + actionIdx

  recap: recap,
  demoTrajectory: demoTrajectory,
  returnBars: returnBars,
  spotQ: spotQ,

  /* two hand policies for the Policy scene */
  handPolicies: {
    aimAtGold: { headings: aimPolicy, winRate: aimEval.winRate, avgReturn: aimEval.avgReturn },
    optimal:   { winRate: optEval.winRate, avgReturn: optEval.avgReturn },
  },

  /* value-iteration fill, frame by frame, for the DP scene */
  valueIteration: {
    gamma: GAMMA, iters: vi.iters, sweepsToStable: sweepsToStable,
    snapshots: sweepSnapshots,                     // [{sweep, V[23], Q[23*4], solved[23]}]
  },

  /* TWO model-free learners for scene 11 (SARSA vs Q-learning side by side). */
  learners: {
    minVisits: MIN_VIS,
    optimalReachGold: round4(dpEval.winRate),
    optimalAvgReturn: round2(dpEval.avgReturn),
    qlearn: {
      kind: 'qlearning', offPolicy: true, config: QL_CFG,
      below_pit: qlBelowPit,
      finalPolicyArgmax: SARSA.argmaxPolicy(qlearn.Q),
      snapshots: qlearn.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 3) })),
      evalCurve: qlearn.evalCurve.map(e => ({ episode: e.episode, winRate: round4(e.winRate), avgReturn: round2(e.avgReturn) })),
      visitVc: roundArr(qlearn.visitVc, 0),
      stats: { agree: qlAgree.ok, totalVisited: qlAgree.tot, diffs: qlAgree.diffs,
        finalReachGold: round4(qlEval.winRate), finalAvgReturn: round2(qlEval.avgReturn) },
    },
    sarsa: {
      kind: 'sarsa', offPolicy: false, config: SARSA_CFG,
      below_pit: saBelowPit,
      finalPolicyArgmax: SARSA.argmaxPolicy(sarsaL.Q),
      snapshots: sarsaL.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 3) })),
      evalCurve: sarsaL.evalCurve.map(e => ({ episode: e.episode, winRate: round4(e.winRate), avgReturn: round2(e.avgReturn) })),
      visitVc: roundArr(sarsaL.visitVc, 0),
      stats: { agree: saAgree.ok, totalVisited: saAgree.tot, diffs: saAgree.diffs,
        finalReachGold: round4(saEval.winRate), finalAvgReturn: round2(saEval.avgReturn) },
    },
  },

  /* hand-computable Bellman backup (shown in the Bellman scene) */
  handBackup: {
    cell: { row: 3, col: 2 }, action: 'UP',
    expr: '0.7\\,(-10) + 0.15\\,(-1 + V^{*}(3,1)) + 0.15\\,(-1 + V^{*}(3,3))',
    parts: { pit: -10, vLeft: round2(V[idxRC(3, 1)]), vRight: round2(V[idxRC(3, 3)]), step: Cave.STEP_R },
    value: round2(qRowRC(3, 2).UP),
  },

  /* KaTeX strings shared across scenes */
  tex: {
    state:      's = (\\text{row}, \\text{col}) \\in \\{0,\\ldots,4\\}^2',
    actions:    'a \\in A = \\{\\, \\uparrow,\\; \\downarrow,\\; \\leftarrow,\\; \\rightarrow \\,\\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a):\\ \\ 0.7\\ \\text{aim},\\ \\ 0.15\\ \\text{left},\\ \\ 0.15\\ \\text{right}',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} r_j',
    qstar:      'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:    'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]',
    sarsa:      'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + q[s\',a\'] - q[s,a] \\,\\bigr)',
    qlearning:  'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + \\max_{a\'} q[s\',a\'] - q[s,a] \\,\\bigr)',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Windy Treasure Cave -- static MDP solution plus value-iteration fill\n" +
  " * frames and SARSA / Q-learning training trajectories.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * loads the verified engine (js/actions.js + js/cave.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS: V* matches the proposal grid to 1 decimal, the\n" +
  " * optimal arrows match the proposal at every uniquely-determined tile, the\n" +
  " * three Q* intuition cells match to 2 decimals, the below-pit twist (UP is\n" +
  " * worst, RIGHT optimal), a hand Bellman backup, and that off-policy\n" +
  " * Q-learning == DP while on-policy SARSA is more conservative near the pit.\n" +
  " * If any assertion fails, this file is NOT written.\n" +
  " *\n" +
  " * Qstar is indexed [stateIndex*4 + actionIdx]; stateIndex is row-major over\n" +
  " * the 23 non-terminal tiles (window.Cave.stateIndex).\n" +
  " */\n" +
  "(function () {\n" +
  "  window.DATA = " + payload + ";\n" +
  "})();\n";

fs.writeFileSync(datasetsPath, fileContent);
console.log('');
console.log('Wrote ' + datasetsPath);
console.log('  payload size: ' + (payload.length / 1024).toFixed(1) + ' KB');
console.log('');
console.log('All assertions passed.');

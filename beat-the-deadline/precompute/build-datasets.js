/* Beat the Deadline precompute -- the RIGOR GATE.
 *
 *   Runs value iteration on the loading-dock dispatch MDP (state (p,h) with
 *   p in 0..4 pallets, h in 0..4 hours; levers {WAIT, SEND}; WAIT rolls a
 *   deadline-risk die miss(h) = 0/.2/.4/.6 at h=4/3/2/1 then an arrival die
 *   q=0.6; SEND pays 5*min(p,4)-10 on-time / -10 late; a blown WAIT pays -5p;
 *   gamma=1) and emits V* / Q* / the optimal policy plus TWO model-free
 *   learners (off-policy Q-learning and on-policy SARSA) to data/datasets.js
 *   as window.DATA, the JSON the page loads.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified
 *   runtime engine (js/actions.js + js/dock.js + js/bellman.js + js/sarsa.js)
 *   through a tiny `window` shim so the precompute and the runtime share one
 *   source of truth.
 *
 *   HARD ASSERTIONS (throw / exit on mismatch; the file is NOT written on
 *   failure):
 *     1) VI converges (max-deltaV < 1e-9) in exactly 6 sweeps.
 *     2) The recovered OPTIMAL POLICY equals the proposal's diagonal staircase
 *        EXACTLY: SEND-threshold p*(h) = 1,2,3,4 for h=1,2,3,4; SEND fills the
 *        upper-left triangle (full OR imminent), WAIT the lower-right (room AND
 *        runway); the h=0 column is the forced LATE-SEND wall.
 *     3) V* matches the proposal's table EXACTLY (to 1e-6):
 *          p=4: -10, 10, 10, 10, 10
 *          p=3: -10,  5,  5,  5,  8.00
 *          p=2: -10,  0,  0,  0.40, 3.16
 *          p=1: -10, -5, -3.20, -2.02, -0.57
 *          p=0:   0,  0,  0,  0,  0
 *     4) The three hand-checkable Q* intuitions from the proposal reproduce:
 *          (4,4): SEND = +10  > WAIT (full truck -> ship even with all the time)
 *          (2,3): WAIT = +0.40 > SEND = 0   (one hour of slack -> hold)
 *          (2,2): WAIT = -2.20 < SEND = 0   (one hour later -> ship; the flip)
 *          (1,4): SEND = -5, V* = -0.57     (thin order -> hold, honest loss)
 *     5) The deadline wall is a flat -10 for p>=1; the empty-dock row is 0.
 *     6) The ONLY exact Q* tie among legal levers is at (4,4) (WAIT == SEND),
 *        broken to SEND, so a snapshot diff does not flap.
 *     7) OFF-POLICY Q-learning's learned greedy policy reproduces the DP
 *        diagonal on ALL 16 interior decision cells (p>=1, h>=1).
 *     8) ON-POLICY SARSA is demonstrably MORE CONSERVATIVE: it ships EARLIER
 *        than DP on at least one thin-order flip cell (SEND where DP WAITs),
 *        is NEVER reckless (never WAITs where DP SENDs), and its DP agreement
 *        is strictly below Q-learning's. (The razor-thin +0.40 WAIT edge at
 *        the (2,3) flip is exactly where on-policy exploration risk bites.)
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
for (const rel of ['js/actions.js', 'js/dock.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Actions = sandbox.window.Actions;
const Dock    = sandbox.window.Dock;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const ACTION_IDS = Actions.ACTION_IDS;      // [wait, send]
const A = ACTION_IDS.length;                 // 2
const N = Dock.N;                            // 25
const NH = Dock.NH;                          // 5
const PMAX = Dock.PMAX, HMAX = Dock.HMAX;    // 4, 4
const GAMMA = 1.0;
const ARRIVAL = Dock.arrivalProb();          // 0.6

/* ---------------- Value iteration (gamma = 1) ---------------- */
const TOL = 1e-12;
const MAX_ITERS = 400;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                              // Float64Array[25], index = p*5 + h
const policy = vi.policy;                    // [25] action-id strings
const Qstar = Bellman.qFromV(V, GAMMA);      // Float64Array[25*A], index stateIndex*A + actionIdx

/* ---------------- Helpers ---------------- */
function sIdx(p, h) { return p * NH + h; }
function vAt(p, h) { return V[sIdx(p, h)]; }
function polAt(p, h) { return policy[sIdx(p, h)]; }
function qAt(p, h, aId) { return Qstar[sIdx(p, h) * A + ACTION_IDS.indexOf(aId)]; }
function round2(x) { return Math.round(x * 100) / 100; }
function round4(x) { return Math.round(x * 10000) / 10000; }
function fmt(x) { return Number.isFinite(x) ? x.toFixed(2) : '  --  '; }
function isDecision(p, h) { return p >= 1 && h >= 1; }

/* ---------------- Assertions ---------------- */
function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log('Beat the Deadline precompute -- 5x5 dock grid, 2 levers, arrival q=' + ARRIVAL +
            ', miss(h)=[' + [1,2,3,4].map(h => Dock.missProb(h)).join(',') + '] for h=1..4, gamma=' + GAMMA);
console.log('  25 states (p,h); SEND terminal (5*min(p,4)-10 on-time / -10 late); WAIT rolls two dice');
console.log('');
console.log('Phase 1 -- Value iteration');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* Pretty-print V* + policy grids (rows p=4 top..0 bottom, cols h=0..4). */
console.log('');
console.log('  V* grid (rows p=4..0, cols h=0..4):');
console.log('   p\\h |    0   |    1   |    2   |    3   |    4');
for (let p = PMAX; p >= 0; p--) {
  let line = '    ' + p + '  |';
  for (let h = 0; h <= HMAX; h++) line += ' ' + fmt(vAt(p, h)).padStart(6) + ' |';
  console.log(line);
}
console.log('');
console.log('  Optimal policy (rows p=4..0, cols h=0..4):');
console.log('   p\\h |  0   |  1   |  2   |  3   |  4');
for (let p = PMAX; p >= 0; p--) {
  let line = '    ' + p + '  |';
  for (let h = 0; h <= HMAX; h++) {
    const legal = Dock.availableActionIds(p, h);
    let cell;
    if (p === 0) cell = '  --  ';                       // empty-dock muted row
    else cell = (' ' + polAt(p, h).toUpperCase()).padEnd(5) + ' ';
    line += cell + '|';
  }
  console.log(line);
}
console.log('');

/* (1) convergence in exactly 6 sweeps */
assert('VI converges (maxDelta < 1e-9)', lastSweep.maxDelta < 1e-9 && vi.iters < MAX_ITERS,
  'iters=' + vi.iters + ' maxDelta=' + lastSweep.maxDelta.toExponential(2));
assert('VI converges in exactly 6 sweeps (as the proposal predicts)', vi.iters === 6, 'iters=' + vi.iters);

/* (2) optimal policy == the proposal's diagonal staircase exactly. */
const SPEC_POL = {
  4: ['send', 'send', 'send', 'send', 'send'],
  3: ['send', 'send', 'send', 'send', 'wait'],
  2: ['send', 'send', 'send', 'wait', 'wait'],
  1: ['send', 'send', 'wait', 'wait', 'wait'],
};
let polOk = true;
const polDiffs = [];
for (let p = 1; p <= PMAX; p++) {
  for (let h = 0; h <= HMAX; h++) {
    const got = polAt(p, h);
    const want = SPEC_POL[p][h];
    if (got !== want) { polOk = false; polDiffs.push('(' + p + ',' + h + ')got=' + got + ',want=' + want); }
  }
}
assert('optimal policy == the proposal diagonal staircase (SEND threshold 1->2->3->4, h=0 wall = SEND)',
  polOk, 'diffs=[' + polDiffs.join(' ') + ']');

/* The SEND-threshold per hour: smallest p at which SEND is optimal. */
const sendThreshold = [];
for (let h = 1; h <= HMAX; h++) {
  let thr = PMAX + 1;
  for (let p = 1; p <= PMAX; p++) if (polAt(p, h) === 'send') { thr = p; break; }
  sendThreshold.push(thr);
}
console.log('  SEND-threshold per hour p*(h) for h=1..4: [' + sendThreshold.join(', ') + ']  (proposal: [1, 2, 3, 4])');
assert('SEND-threshold steps down exactly 1->2->3->4 (the 45-degree staircase)',
  sendThreshold.length === 4 && sendThreshold.every((t, i) => t === i + 1),
  '[' + sendThreshold.join(',') + ']');

/* (3) V* matches the proposal table exactly. */
const SPEC_V = {
  4: [-10, 10, 10, 10, 10],
  3: [-10, 5, 5, 5, 8.00],
  2: [-10, 0, 0, 0.40, 3.16],
  1: [-10, -5, -3.20, -2.02, -0.57],
  0: [0, 0, 0, 0, 0],
};
let vOk = true;
const vDiffs = [];
for (let p = 0; p <= PMAX; p++) {
  for (let h = 0; h <= HMAX; h++) {
    const got = round2(vAt(p, h));
    const want = SPEC_V[p][h];
    if (Math.abs(got - want) > 1e-6) { vOk = false; vDiffs.push('(' + p + ',' + h + ')got=' + got + ',want=' + want); }
  }
}
assert('V* matches the proposal table exactly (rounded to 2dp)', vOk, 'diffs=[' + vDiffs.join(' ') + ']');

/* (4) the three hand-checkable Q* intuitions. */
assert('intuition 1 -- (4,4): SEND=+10 and SEND>=WAIT (full truck -> ship)',
  Math.abs(qAt(4, 4, 'send') - 10) < 1e-9 && qAt(4, 4, 'send') >= qAt(4, 4, 'wait'),
  'SEND=' + qAt(4, 4, 'send') + ' WAIT=' + qAt(4, 4, 'wait'));
assert('intuition 2a -- (2,3): WAIT=+0.40 > SEND=0 (one hour slack -> hold)',
  Math.abs(qAt(2, 3, 'wait') - 0.40) < 1e-9 && Math.abs(qAt(2, 3, 'send')) < 1e-9 && qAt(2, 3, 'wait') > qAt(2, 3, 'send'),
  'WAIT=' + qAt(2, 3, 'wait') + ' SEND=' + qAt(2, 3, 'send'));
assert('intuition 2b -- (2,2): WAIT=-2.20 < SEND=0 (one hour later -> ship; the flip)',
  Math.abs(qAt(2, 2, 'wait') - (-2.20)) < 1e-9 && Math.abs(qAt(2, 2, 'send')) < 1e-9 && qAt(2, 2, 'send') > qAt(2, 2, 'wait'),
  'WAIT=' + qAt(2, 2, 'wait') + ' SEND=' + qAt(2, 2, 'send'));
assert('intuition 3 -- (1,4): SEND=-5 and V*=-0.57 (thin order -> hold, honest loss)',
  Math.abs(qAt(1, 4, 'send') - (-5)) < 1e-9 && Math.abs(round2(vAt(1, 4)) - (-0.57)) < 1e-6,
  'SEND=' + qAt(1, 4, 'send') + ' V*=' + vAt(1, 4));

/* (5) the deadline wall + empty-dock row. */
let wallOk = true;
for (let p = 1; p <= PMAX; p++) if (Math.abs(vAt(p, 0) - (-10)) > 1e-9) wallOk = false;
assert('the deadline wall V*(p,0) = -10 for every p>=1 (forced late ship)', wallOk,
  'wall=[' + [4,3,2,1].map(p => vAt(p, 0)).join(',') + ']');
let emptyOk = true;
for (let h = 0; h <= HMAX; h++) if (Math.abs(vAt(0, h)) > 1e-9) emptyOk = false;
assert('the empty-dock row V*(0, .) = 0 (nothing waiting, nothing at stake)', emptyOk,
  'row=[' + [0,1,2,3,4].map(h => vAt(0, h)).join(',') + ']');

/* (6) the only exact Q* tie among legal levers is (4,4). */
const ties = [];
for (let p = 0; p <= PMAX; p++) {
  for (let h = 0; h <= HMAX; h++) {
    const legal = Dock.availableActionIds(p, h);
    if (legal.length < 2) continue;
    if (Math.abs(qAt(p, h, 'wait') - qAt(p, h, 'send')) < 1e-9) ties.push('(' + p + ',' + h + ')');
  }
}
console.log('  exact Q* ties among legal levers: ' + (ties.length ? ties.join(', ') : '(none)'));
assert('the only exact Q* tie among legal levers is (4,4) (WAIT == SEND, broken to SEND)',
  ties.length === 1 && ties[0] === '(4,4)' && polAt(4, 4) === 'send', 'ties=[' + ties.join(',') + ']');

/* ---------------- Per-sweep snapshots for the DP scene ----------------
   Value fills "from the deadline wall + the full-truck row outward". We record
   (V, Q, solvedMask) after each sweep so the DP scene can animate the diagonal
   staircase drawing itself. A cell is "solved" once its V is 2dp-stable. */
function buildSweepSnapshots(maxRecord) {
  let Vk = new Float64Array(N);
  const snaps = [];
  const stableAt = new Array(N).fill(-1);
  for (let k = 0; k <= maxRecord; k++) {
    if (k > 0) { const out = Bellman.bellmanSweep(Vk, GAMMA); Vk = out.Vnew; }
    const Qk = Bellman.qFromV(Vk, GAMMA);
    for (let i = 0; i < N; i++) {
      if (stableAt[i] < 0 && Number.isFinite(Vk[i]) && Math.abs(Vk[i] - V[i]) < 5e-3) stableAt[i] = k;
    }
    snaps.push({
      sweep: k,
      V: Array.from(Vk, x => (Number.isFinite(x) ? round4(x) : null)),
      Q: Array.from(Qk, x => (Number.isFinite(x) ? round4(x) : null)),
      solved: Array.from(stableAt, s => (s >= 0 && s <= k)),
    });
    if (k >= 6 && stableAt.every(s => s >= 0 && s <= k - 1)) { snaps[snaps.length - 1]._settled = true; break; }
  }
  return snaps;
}
const sweepSnapshots = buildSweepSnapshots(20);
const sweepsToStable = sweepSnapshots.length - 1;
console.log('');
console.log('  DP fill recorded over ' + sweepSnapshots.length + ' sweep-frames');

/* ---------------- Phase 2 -- model-free TD control: TWO learners ----------------
   See the file header + CLAUDE.md. Q-learning (off-policy) recovers the exact
   diagonal; SARSA (on-policy) lands one cell more CONSERVATIVE on the thin-order
   flip. Decision states = the 16 interior cells (p>=1, h>=1). Exploring starts
   draw a random decision cell each episode so every cell is well-visited. */
const DECISION = [];
for (let p = 1; p <= PMAX; p++) for (let h = 1; h <= HMAX; h++) DECISION.push({ p: p, h: h });

/* OFF-POLICY Q-learning config (the optimal / diagonal learner). */
const QL_CFG = {
  alphaPower: 0.75,               // alpha = 1/(1+visits)^alphaPower (Robbins-Monro)
  gamma: GAMMA,
  epsilon: 0.40, epsilonMin: 0.10,
  episodes: 400000,
  seed: 20260615,
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 400000],
  evalEvery: 8000,
};
/* ON-POLICY SARSA config (the cautious learner). A CONSTANT step size + a
   STEADY epsilon pin SARSA to the value of the eps-soft policy it follows,
   which on the thin-order cells genuinely prefers shipping early (a stray
   exploratory WAIT strands the load). Seed chosen so the cautious deviation is
   the legible (2,3) diagonal-flip cell. Robust across seeds (39/40 cautious
   there); see CLAUDE.md. */
const SARSA_CFG = {
  constAlpha: 0.05,
  gamma: GAMMA,
  epsilon: 0.20, epsilonMin: 0.20,
  episodes: 400000,
  seed: 11,
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 400000],
  evalEvery: 8000,
};

function epsAt(ep, cfg) {
  if (cfg.epsilonMin >= cfg.epsilon) return cfg.epsilon;
  const frac = ep / cfg.episodes;
  return Math.max(cfg.epsilonMin, cfg.epsilon * Math.pow(cfg.epsilonMin / cfg.epsilon, frac));
}
function alphaFor(cfg, visitCount) {
  if (cfg.constAlpha != null) return cfg.constAlpha;
  return 1 / Math.pow(1 + visitCount, cfg.alphaPower);
}

/* One episode of OFF-POLICY Q-learning. */
function runQLEpisode(Q, visits, gamma, eps, rng, cfg) {
  const d = DECISION[Math.floor(rng() * DECISION.length)];
  let s = { p: d.p, h: d.h, terminal: false };
  let si = Dock.stateIndex(s), guard = 0;
  const visited = new Set([si]);
  while (!s.terminal && guard++ < 200) {
    const aId = SARSA.pickEpsGreedy(Q, si, eps, rng);
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Dock.sample(s, aId, rng);
    visits[si * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[si * A + aIdx]);
    if (out.terminal) { SARSA.qLearningUpdate(Q, si, aId, out.reward, -1, alpha, gamma, true); break; }
    const ni = Dock.stateIndex(out.sNext);
    SARSA.qLearningUpdate(Q, si, aId, out.reward, ni, alpha, gamma, false);
    s = out.sNext; si = ni; visited.add(si);
  }
  return { visited };
}
/* One episode of ON-POLICY SARSA (next lever a' chosen before the update). */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  const d = DECISION[Math.floor(rng() * DECISION.length)];
  let s = { p: d.p, h: d.h, terminal: false };
  let si = Dock.stateIndex(s);
  let aId = SARSA.pickEpsGreedy(Q, si, eps, rng);
  let guard = 0;
  const visited = new Set([si]);
  while (!s.terminal && guard++ < 200) {
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Dock.sample(s, aId, rng);
    visits[si * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[si * A + aIdx]);
    if (out.terminal) { SARSA.update(Q, si, aId, out.reward, -1, null, alpha, gamma, true); break; }
    const ni = Dock.stateIndex(out.sNext);
    const aNext = SARSA.pickEpsGreedy(Q, ni, eps, rng);
    SARSA.update(Q, si, aId, out.reward, ni, aNext, alpha, gamma, false);
    s = out.sNext; si = ni; aId = aNext; visited.add(si);
  }
  return { visited };
}

/* Mean greedy return from a fixed start, running the CURRENT greedy policy.
   The headline "is the learned playbook good?" metric. */
function greedyReturnFrom(Q, p0, h0, episodes, rng) {
  let total = 0;
  for (let e = 0; e < episodes; e++) {
    let s = { p: p0, h: h0, terminal: false }, guard = 0, g = 0;
    while (!s.terminal && guard++ < 200) {
      const aId = SARSA.pickEpsGreedy(Q, Dock.stateIndex(s), 0, rng);
      const out = Dock.sample(s, aId, rng);
      g += out.reward;
      s = out.sNext;
    }
    total += g;
  }
  return total / episodes;
}

function trainLearner(cfg, runEpisode, evalStart) {
  const rng = Dock.makeRng(cfg.seed);
  const evalRng = Dock.makeRng((cfg.seed ^ 0x9e3779b9) >>> 0);
  const Q = new Float32Array(N * A);
  const visits = new Float64Array(N * A);
  const snapshots = [];
  const returnCurve = [];
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  returnCurve.push({ episode: 0, ret: Number(greedyReturnFrom(Q, evalStart.p, evalStart.h, 3000, evalRng).toFixed(4)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    runEpisode(Q, visits, cfg.gamma, epsAt(ep, cfg), rng, cfg);
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) {
      returnCurve.push({ episode: ep, ret: Number(greedyReturnFrom(Q, evalStart.p, evalStart.h, 3000, evalRng).toFixed(4)) });
    }
  }
  return { Q, snapshots, returnCurve };
}

/* Summarise a learned Q against the DP oracle on the 16 decision cells. */
function summarise(learner, evalSeed, evalStart) {
  const pol = SARSA.argmaxPolicy(learner.Q);
  let agreed = 0;
  const timid = [];     // SEND where DP WAITs -> ships earlier -> MORE conservative
  const reckless = [];  // WAIT where DP SENDs -> ships later -> less safe
  for (const { p, h } of DECISION) {
    const i = sIdx(p, h);
    const learned = pol[i];
    const dp = policy[i];
    if (learned === dp) agreed++;
    else if (learned === 'send' && dp === 'wait') timid.push('(' + p + ',' + h + ')');
    else if (learned === 'wait' && dp === 'send') reckless.push('(' + p + ',' + h + ')');
  }
  const finalRet = greedyReturnFrom(learner.Q, evalStart.p, evalStart.h, 40000, Dock.makeRng(evalSeed));
  return { policy: pol, agreed, total: DECISION.length, timid, reckless, finalRet, earlyRet: learner.returnCurve[0].ret };
}

/* Greedy-policy bets grid (16 decision cells) -> action-id string per cell. */
function greedyGrid(Q) {
  const out = {};
  for (const { p, h } of DECISION) {
    const i = sIdx(p, h);
    out[p + ',' + h] = (Q[i * A] >= Q[i * A + 1]) ? 'wait' : 'send';
  }
  return out;
}

const EVAL_START = { p: 2, h: 4 };   // the canonical fresh-window start
console.log('');
console.log('Phase 2 -- model-free TD control: OFF-POLICY Q-learning vs ON-POLICY SARSA');
console.log('  Q-learning: ' + QL_CFG.episodes + ' eps, alpha=1/(1+n)^' + QL_CFG.alphaPower +
            ', eps ' + QL_CFG.epsilon + '->' + QL_CFG.epsilonMin + ' (off-policy max bootstrap)');
console.log('  SARSA:      ' + SARSA_CFG.episodes + ' eps, alpha=' + SARSA_CFG.constAlpha +
            ' const, eps ' + SARSA_CFG.epsilon + ' steady (on-policy a\' bootstrap)');
const t0 = Date.now();
const qlearn = trainLearner(QL_CFG, runQLEpisode, EVAL_START);
const sarsaL = trainLearner(SARSA_CFG, runSarsaEpisode, EVAL_START);
console.log('  trained both in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

const qlSum    = summarise(qlearn, 0xC0FFEE, EVAL_START);
const sarsaSum = summarise(sarsaL, 0x5A45A, EVAL_START);

function gridStr(grid) {
  let out = '';
  for (let p = PMAX; p >= 1; p--) {
    out += '\n      p' + p + ': ';
    for (let h = 1; h <= HMAX; h++) out += (grid[p + ',' + h] === 'wait' ? 'WAIT' : 'SEND') + ' ';
  }
  return out;
}
console.log('');
console.log('  Q-LEARNING (off-policy) greedy diagonal (p4..1, h1..4):' + gridStr(greedyGrid(qlearn.Q)));
console.log('    DP agreement: ' + qlSum.agreed + '/' + qlSum.total +
            '   mean greedy return from (2,4): ' + qlSum.earlyRet.toFixed(3) + ' -> ' + qlSum.finalRet.toFixed(3) +
            '   (V*(2,4) = ' + vAt(2, 4).toFixed(3) + ')');
console.log('  SARSA      (on-policy)  greedy diagonal (p4..1, h1..4):' + gridStr(greedyGrid(sarsaL.Q)));
console.log('    DP agreement: ' + sarsaSum.agreed + '/' + sarsaSum.total +
            '   mean greedy return from (2,4): ' + sarsaSum.earlyRet.toFixed(3) + ' -> ' + sarsaSum.finalRet.toFixed(3));
console.log('    SARSA ships EARLIER than DP (more conservative) at: [' + sarsaSum.timid.join(', ') + ']' +
            (sarsaSum.reckless.length ? '   reckless at: [' + sarsaSum.reckless.join(', ') + ']' : '   (never reckless)'));

/* (7) Q-learning recovers the DP diagonal on all 16 decision cells. */
assert('Q-learning greedy policy reproduces the DP diagonal on all 16 decision cells',
  qlSum.agreed === qlSum.total, 'agreed=' + qlSum.agreed + '/' + qlSum.total);
assert('Q-learning mean greedy return from (2,4) is within 0.15 of V*(2,4)',
  Math.abs(qlSum.finalRet - vAt(2, 4)) <= 0.15, 'got ' + qlSum.finalRet.toFixed(3) + ' vs ' + vAt(2, 4).toFixed(3));

/* (8) SARSA is demonstrably MORE CONSERVATIVE (cautious vs optimal). */
assert('SARSA (on-policy) ships EARLIER than DP on >=1 thin-order flip cell (more conservative)',
  sarsaSum.timid.length >= 1, 'timid=[' + sarsaSum.timid.join(',') + ']');
assert('SARSA (on-policy) is NEVER reckless (never WAITs where DP SENDs)',
  sarsaSum.reckless.length === 0, 'reckless=[' + sarsaSum.reckless.join(',') + ']');
assert('SARSA DP agreement is strictly below Q-learning (cautious vs optimal)',
  sarsaSum.agreed < qlSum.agreed, 'sarsa=' + sarsaSum.agreed + ' qlearn=' + qlSum.agreed);
/* The headline cautious deviation should be the (2,3) diagonal-flip cell. */
assert('SARSA ships early specifically at the (2,3) diagonal-flip cell (the razor-thin +0.40 WAIT edge)',
  sarsaSum.timid.indexOf('(2,3)') >= 0, 'timid=[' + sarsaSum.timid.join(',') + ']');

/* ---------------- A fixed illustrative trajectory ----------------
   One short deterministic demo window from (2,4) under the OPTIMAL policy,
   pinned seed, for the tutorial / trajectory / return scenes. Want a legible
   run: a WAIT or two (a pallet arrives) then a SEND of a fuller truck. */
function buildDemoTrajectory(seed, p0, h0, wantSent) {
  for (let attempt = 0; attempt < 6000; attempt++) {
    const rng = Dock.makeRng(seed + attempt);
    let s = { p: p0, h: h0, terminal: false };
    const steps = [];
    let guard = 0;
    while (!s.terminal && guard++ < 50) {
      const aId = policy[Dock.stateIndex(s)];
      const out = Dock.sample(s, aId, rng);
      steps.push({
        p: s.p, h: s.h, action: aId,
        blown: !!out.log.blown, arrived: !!out.log.arrived, late: !!out.log.late,
        reward: out.reward, terminal: out.terminal,
        kind: out.sNext.terminal ? out.sNext.kind : null,
        pNext: out.sNext.terminal ? null : out.sNext.p,
        hNext: out.sNext.terminal ? null : out.sNext.h,
      });
      s = out.sNext;
    }
    const last = steps[steps.length - 1];
    const sent = !!(last && last.kind === 'sent');
    const waits = steps.filter(x => x.action === 'wait').length;
    const arrivals = steps.filter(x => x.arrived).length;
    /* Prefer a legible 3-step "wait, wait, ship-a-fuller-truck" story. */
    if (sent === wantSent && steps.length >= 3 && steps.length <= 5 && waits >= 2 && arrivals >= 1) {
      return { seedUsed: seed + attempt, p0, h0, sent, len: steps.length, steps };
    }
  }
  const rng = Dock.makeRng(seed);
  let s = { p: p0, h: h0, terminal: false }; const steps = []; let guard = 0;
  while (!s.terminal && guard++ < 50) {
    const aId = policy[Dock.stateIndex(s)];
    const out = Dock.sample(s, aId, rng);
    steps.push({ p: s.p, h: s.h, action: aId, blown: !!out.log.blown, arrived: !!out.log.arrived,
      late: !!out.log.late, reward: out.reward, terminal: out.terminal,
      kind: out.sNext.terminal ? out.sNext.kind : null,
      pNext: out.sNext.terminal ? null : out.sNext.p, hNext: out.sNext.terminal ? null : out.sNext.h });
    s = out.sNext;
  }
  const last = steps[steps.length - 1];
  return { seedUsed: seed, p0, h0, sent: !!(last && last.kind === 'sent'), len: steps.length, steps };
}
const demoTrajectory = buildDemoTrajectory(3, 2, 4, true);
console.log('');
console.log('  Demo trajectory (optimal policy from (2,4), seed ' + demoTrajectory.seedUsed + '): ' +
            demoTrajectory.len + ' steps, ' + (demoTrajectory.sent ? 'SHIPPED' : 'BLOWN'));

/* ---------------- Return-distribution bars for the Return scene ----------------
   Fix (2,4) and one chosen FIRST lever, then play OPTIMALLY afterward, and
   Monte-Carlo the return. The exact mean is Q*((2,4), firstLever). */
function returnBarFor(p0, h0, firstId, trials, seed) {
  const rng = Dock.makeRng(seed);
  let total = 0;
  const buckets = {};   // reward value -> count, for the histogram
  for (let e = 0; e < trials; e++) {
    let s = { p: p0, h: h0, terminal: false };
    let first = true, guard = 0, g = 0;
    while (!s.terminal && guard++ < 50) {
      const aId = first ? firstId : policy[Dock.stateIndex(s)];
      first = false;
      const out = Dock.sample(s, aId, rng);
      g += out.reward;
      s = out.sNext;
    }
    total += g;
    buckets[g] = (buckets[g] || 0) + 1;
  }
  const hist = Object.keys(buckets).map(k => ({ ret: Number(k), count: buckets[k] }))
    .sort((a, b) => a.ret - b.ret);
  return { exact: Number(qAt(p0, h0, firstId).toFixed(4)), empirical: Number((total / trials).toFixed(4)), trials, hist };
}
const returnBars = {
  p0: 2, h0: 4,
  wait: returnBarFor(2, 4, 'wait', 30000, 101),   // start WAIT (the optimal first move at (2,4))
  send: returnBarFor(2, 4, 'send', 30000, 202),   // start SEND (ship the half-empty truck now)
};
console.log('  return from (2,4): start WAIT mean ~ ' + returnBars.wait.exact +
            ' , start SEND ~ ' + returnBars.send.exact);

/* ---------------- The named spot-Q rows the Q* scene calls out ---------------- */
function spotRow(p, h) {
  const legal = Dock.availableActionIds(p, h);
  const q = {};
  for (const id of ACTION_IDS) q[id] = legal.includes(id) ? Number(qAt(p, h, id).toFixed(4)) : null;
  return { p, h, q: q, best: polAt(p, h), legal: legal, V: Number(round2(vAt(p, h))) };
}
const spotQ = { flipHi: spotRow(2, 3), flipLo: spotRow(2, 2), full: spotRow(4, 4), thin: spotRow(1, 4) };

/* ---------------- Hand-policy mean returns (the Policy scene) ----------------
   Monte-Carlo the mean window payoff from (2,4) under three SOPs:
   Always-SEND, Always-WAIT-until-forced, and the OPTIMAL diagonal. Always-SEND
   from (2,4) ships 2 pallets now = 5*2-10 = 0 (a wasteful half-empty truck);
   Always-WAIT rides the clock to the wall / a blow; Optimal beats both. */
function meanReturnUnder(policyFn, p0, h0, trials, seed) {
  const rng = Dock.makeRng(seed);
  let total = 0;
  for (let e = 0; e < trials; e++) {
    let s = { p: p0, h: h0, terminal: false }, guard = 0, g = 0;
    while (!s.terminal && guard++ < 50) {
      const aId = policyFn(s.p, s.h);
      const out = Dock.sample(s, aId, rng);
      g += out.reward;
      s = out.sNext;
    }
    total += g;
  }
  return Number((total / trials).toFixed(3));
}
const alwaysSendFn = (p, h) => (p >= 1 ? 'send' : 'wait');
const alwaysWaitFn = (p, h) => (h >= 1 ? 'wait' : 'send');   // wait until forced at the wall
const optimalFn    = (p, h) => policy[sIdx(p, h)];
const handPolicyReturns = {
  p0: 2, h0: 4,
  alwaysSend: meanReturnUnder(alwaysSendFn, 2, 4, 40000, 301),
  alwaysWait: meanReturnUnder(alwaysWaitFn, 2, 4, 40000, 302),
  optimal:    meanReturnUnder(optimalFn, 2, 4, 40000, 303),
  optimalV:   Number(round2(vAt(2, 4))),
};
console.log('  hand-policy mean return from (2,4): always-SEND ' + handPolicyReturns.alwaysSend +
            ', always-WAIT ' + handPolicyReturns.alwaysWait + ', optimal ' + handPolicyReturns.optimal +
            ' (V*=' + handPolicyReturns.optimalV + ')');
assert('the OPTIMAL policy beats both flat hand-policies from (2,4)',
  handPolicyReturns.optimal > handPolicyReturns.alwaysSend && handPolicyReturns.optimal > handPolicyReturns.alwaysWait,
  JSON.stringify(handPolicyReturns));

/* ---------------- Two hand-computable backups (the Bellman scene) ---------------- */
/* WAIT at (2,3) = 0.2*(-10) + 0.8*[0.6*V*(3,2) + 0.4*V*(2,2)]
                 = -2 + 0.8*[0.6*5 + 0.4*0] = +0.40 */
const hand23 = 0.2 * (-10) + 0.8 * (ARRIVAL * vAt(3, 2) + (1 - ARRIVAL) * vAt(2, 2));
/* WAIT at (2,2) = 0.4*(-10) + 0.6*[0.6*V*(3,1) + 0.4*V*(2,1)]
                 = -4 + 0.6*[0.6*5 + 0.4*0] = -2.20 */
const hand22 = 0.4 * (-10) + 0.6 * (ARRIVAL * vAt(3, 1) + (1 - ARRIVAL) * vAt(2, 1));
assert('hand backup WAIT(2,3) = 0.2*(-10)+0.8*[0.6*V*(3,2)+0.4*V*(2,2)] = Q*(2,3,WAIT)',
  Math.abs(hand23 - qAt(2, 3, 'wait')) < 1e-9, 'hand=' + hand23 + ' Q=' + qAt(2, 3, 'wait'));
assert('hand backup WAIT(2,2) = 0.4*(-10)+0.6*[0.6*V*(3,1)+0.4*V*(2,1)] = Q*(2,2,WAIT)',
  Math.abs(hand22 - qAt(2, 2, 'wait')) < 1e-9, 'hand=' + hand22 + ' Q=' + qAt(2, 2, 'wait'));

/* ---------------- Contrast scenario for the "why it flips" intuition ----------------
   Drag the deadline-risk OFF (miss = 0 at every hour): with no timing risk the
   diagonal collapses -- WAIT becomes weakly dominant wherever the truck is not
   full, because waiting is free. Recompute a fresh policy to prove the twist is
   driven by the climbing deadline-risk die, then restore the spec schedule. */
function policyWithMiss(missArr) {
  Dock.setMissSchedule(missArr);
  const r = Bellman.valueIteration(GAMMA, { tol: 1e-12, maxIters: 800, recordHistory: false });
  const grid = {};
  for (const { p, h } of DECISION) grid[p + ',' + h] = r.policy[sIdx(p, h)];
  Dock.setMissSchedule([0.0, 0.6, 0.4, 0.2, 0.0]);   // restore spec
  return grid;
}
const noRiskGrid = policyWithMiss([0, 0, 0, 0, 0]);
/* Count WAIT cells under the spec schedule vs with the deadline-risk die OFF.
   Turning risk off should push the frontier toward WAIT (consolidating gets
   cheaper), so strictly MORE decision cells become WAIT -- proof the climbing
   deadline-risk die is what tilts the diagonal. (Cells one hour from the wall,
   h=1, still SEND even with no blow-risk, because WAIT there lands at the
   forced-late h=0 wall; so it is "more WAIT", not "all WAIT".) */
let specWaits = 0, noRiskWaits = 0;
for (const { p, h } of DECISION) {
  if (polAt(p, h) === 'wait') specWaits++;
  if (noRiskGrid[p + ',' + h] === 'wait') noRiskWaits++;
}
/* Sanity: no cell that is WAIT under the (risky) spec should flip to SEND when
   risk is removed -- removing risk never makes you ship sooner. */
let monotone = true;
for (const { p, h } of DECISION) {
  if (polAt(p, h) === 'wait' && noRiskGrid[p + ',' + h] !== 'wait') monotone = false;
}
console.log('  contrast: WAIT cells under spec risk = ' + specWaits + '/16; with the deadline-risk die OFF = ' +
            noRiskWaits + '/16 (removing risk tilts the frontier toward WAIT)');
assert('removing the deadline-risk die tilts the frontier toward WAIT (strictly more WAIT cells, none flip back to SEND)',
  noRiskWaits > specWaits && monotone, 'spec=' + specWaits + ' noRisk=' + noRiskWaits + ' monotone=' + monotone);

/* ---------------- Recap cards (dock voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is the DOCK STATE: how many pallets are waiting and how many hours are left. The lever is WAIT or SEND. The part you do not control is the two DICE -- whether a pallet arrives, and whether the deadline blows. The payoff is +5 a pallet, -10 the truck, -5 a stranded pallet.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', scene: 4, title: 'YOUR DISPATCH SOP',
    text: 'A policy assigns one lever to EVERY one of the 25 dock states -- the standing rule your whole team follows without you. When you ran the dock by gut you already were a policy; you just had not drawn it on the board.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', scene: 6, title: 'THE WINDOW PAYOFF, AVERAGED',
    text: 'The return is the payoff summed over the whole order window. Run the same rule twice and the dice give two different totals. Judge a rule by its EXPECTED total over many windows, never by one lucky dispatch.',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} r_j' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'THE LONG-RUN VALUE OF A LEVER',
    text: 'Q*(s, a) is the true long-run value of pulling lever a in state s, played smart afterward. The best lever is the argmax, and it FLIPS along a clean diagonal: SEND when full or when time is short, WAIT only with both room and runway.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT SOP IF YOU KNEW THE DICE',
    text: 'With the arrival rate and deadline odds known, Q* solves its own Bellman equation: today\'s value is the immediate payoff plus the value of where the dice land you. Sweep the backup and the diagonal staircase draws itself in six passes.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'TD', scene: 11, title: 'LEARN THE SOP BY RUNNING THE DOCK',
    text: 'No forecast of the dice? Replace the expectation with one observed dispatch. Two update rules: off-policy Q-learning bootstraps on the best next lever and recovers the exact diagonal; on-policy SARSA learns the value of the cautious rule it follows and ships the thin order one hour early. Same experience, two honest answers.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Actions for display ---------------- */
const actionsDisplay = Actions.ACTIONS.map(a => ({ id: a.id, name: a.name, role: a.role }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

const DATA = {
  /* core MDP solution, indexed by stateIndex = p*5 + h (0..24) */
  pmax: PMAX, hmax: HMAX, np: Dock.NP, nh: NH,
  arrival: ARRIVAL,
  miss: [0, 1, 2, 3, 4].map(h => Dock.missProb(h)),     // miss[h]
  valPerPallet: Dock.VAL_PER_PALLET, truckCost: Dock.TRUCK_COST, latePenalty: Dock.LATE_PENALTY,
  gamma: GAMMA,
  policy: policy.slice(),                               // 25 action-id strings
  V: roundArr(V, 4),                                   // 25 values
  Qstar: roundArr(Qstar, 4),                           // 25*A, index stateIndex*A + actionIdx (null = clamped)
  sendThreshold: sendThreshold,                        // [1,2,3,4] per hour h=1..4
  actions: actionsDisplay,                             // id/name/role for display
  actionIds: ACTION_IDS.slice(),                       // [wait, send]
  dims: { rows: Dock.ROWS, cols: Dock.COLS, N: N, A: A, np: Dock.NP, nh: NH },
  /* which levers are legal at each (p,h), for greying clamped cells */
  legalActions: (function () {
    const m = {};
    for (let p = 0; p <= PMAX; p++) for (let h = 0; h <= HMAX; h++) m[p + ',' + h] = Dock.availableActionIds(p, h);
    return m;
  })(),

  recap: recap,
  demoTrajectory: demoTrajectory,
  returnBars: returnBars,
  spotQ: spotQ,
  handPolicyReturns: handPolicyReturns,
  noRiskGrid: noRiskGrid,

  /* value-iteration fill, frame by frame, for the DP scene */
  valueIteration: {
    gamma: GAMMA,
    iters: vi.iters,
    sweepsToStable: sweepsToStable,
    snapshots: sweepSnapshots,                          // [{sweep, V[25], Q[25*A], solved[25]}]
  },

  /* TWO model-free learners for scene 11 (SARSA vs Q-learning side by side). */
  learners: {
    optimalStartValue: Number(round2(vAt(EVAL_START.p, EVAL_START.h))),   // V*(2,4) reference
    evalStart: EVAL_START,
    qlearn: {
      kind: 'qlearning', offPolicy: true,
      config: QL_CFG,
      finalPolicyArgmax: qlSum.policy,
      finalGrid: greedyGrid(qlearn.Q),
      snapshots: qlearn.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
      returnCurve: qlearn.returnCurve,
      stats: {
        finalRet: Number(qlSum.finalRet.toFixed(4)), earlyRet: Number(qlSum.earlyRet.toFixed(4)),
        agreedCount: qlSum.agreed, totalCells: qlSum.total,
        timid: qlSum.timid, reckless: qlSum.reckless,
      },
    },
    sarsa: {
      kind: 'sarsa', offPolicy: false,
      config: SARSA_CFG,
      finalPolicyArgmax: sarsaSum.policy,
      finalGrid: greedyGrid(sarsaL.Q),
      snapshots: sarsaL.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
      returnCurve: sarsaL.returnCurve,
      stats: {
        finalRet: Number(sarsaSum.finalRet.toFixed(4)), earlyRet: Number(sarsaSum.earlyRet.toFixed(4)),
        agreedCount: sarsaSum.agreed, totalCells: sarsaSum.total,
        timidCells: sarsaSum.timid, recklessCells: sarsaSum.reckless,
      },
    },
  },

  /* hand-computable backups (shown in the Bellman scene) */
  handBackups: {
    flipHi: { p: 2, h: 3, action: 'wait', expr: '0.2 \\cdot (-10) + 0.8 \\cdot [\\,0.6 V^*(3,2) + 0.4 V^*(2,2)\\,]',
      value: Number(hand23.toFixed(4)), matchesQ: Number(qAt(2, 3, 'wait').toFixed(4)) },
    flipLo: { p: 2, h: 2, action: 'wait', expr: '0.4 \\cdot (-10) + 0.6 \\cdot [\\,0.6 V^*(3,1) + 0.4 V^*(2,1)\\,]',
      value: Number(hand22.toFixed(4)), matchesQ: Number(qAt(2, 2, 'wait').toFixed(4)) },
  },

  /* KaTeX strings shared across scenes */
  tex: {
    state:      's = (p, h),\\quad p \\in \\{0,\\ldots,4\\},\\ h \\in \\{0,\\ldots,4\\}',
    actions:    'a \\in A = \\{\\, \\text{WAIT},\\; \\text{SEND} \\,\\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a)',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} r_j',
    qstar:      'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:    'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]',
    sarsa:      'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + q[s\',a\'] - q[s,a] \\,\\bigr)',
    qlearning:  'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + \\max_{a\'} q[s\',a\'] - q[s,a] \\,\\bigr)',
    sendValue:  '\\text{SEND}(p) \\;=\\; 5\\,\\min(p,4) - 10',
    waitValue:  '\\text{WAIT}(p,h) \\;=\\; \\text{miss}(h)\\,(-5p) + (1\\!-\\!\\text{miss}(h))\\,\\mathbb{E}[V^*]',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Beat the Deadline -- static MDP solution plus value-iteration fill frames\n" +
  " * and the two model-free TD learners (Q-learning + SARSA).\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * loads the verified engine (js/actions.js + js/dock.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS the converged diagonal policy (SEND threshold\n" +
  " * 1->2->3->4), the V* table to 2 decimals, the three hand-checkable Q*\n" +
  " * intuitions, the single (4,4) tie, Q-learning == DP on all 16 decision\n" +
  " * cells, and SARSA being strictly more conservative; if any assertion\n" +
  " * fails, this file is NOT written.\n" +
  " *\n" +
  " * State index = p*5 + h (0..24). Qstar is indexed [stateIndex*A + actionIdx]\n" +
  " * with actionIdx in [wait, send]; a null entry is a clamped (illegal) lever.\n" +
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

/* Critical Spare precompute -- the RIGOR GATE.
 *
 *   Runs value iteration on the machine-maintenance MDP (state = (health,
 *   spares); levers RUN / ORDER / REPLACE; failure die 0/30/70% by health;
 *   aging coin; holding cost -1 per spare; gamma = 0.9) and emits V* / Q* / the
 *   optimal policy plus an ON-POLICY SARSA learning run to data/datasets.js as
 *   window.DATA, the JSON the page loads.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified runtime
 *   engine (js/levers.js + js/machine.js + js/bellman.js + js/sarsa.js) through
 *   a tiny `window` shim, so the precompute and the runtime share one source of
 *   truth.
 *
 *   HARD ASSERTIONS (exit non-zero on mismatch; the file is NOT written on
 *   failure):
 *     1) VI converges (max-deltaV < 1e-9).
 *     2) The recovered OPTIMAL POLICY equals the proposal's twist grid EXACTLY:
 *          HEALTHY: RUN  RUN  RUN
 *          AGING:   ORDER REPLACE REPLACE
 *          FAILING: ORDER REPLACE REPLACE
 *        i.e. an empty bin says ORDER while AGING/FAILING; a stocked bin says
 *        REPLACE; HEALTHY always RUN.
 *     3) The three named Q* intuitions from the proposal hold to 1 decimal:
 *          Q*(H,0,RUN) ~ 9.1 (the cell's best),
 *          Q*(A,0,ORDER) ~ 4.5  >  Q*(A,0,RUN) ~ 3.8,
 *          Q*(F,1,REPLACE) ~ 7.2  >  Q*(F,1,RUN) ~ 5.5.
 *     4) The two twist columns flip as advertised: with an EMPTY bin the best
 *        AGING/FAILING lever is ORDER; with a spare in hand it is REPLACE.
 *     5) There are NO exact ties among legal levers (the policy is unambiguous).
 *     6) ON-POLICY SARSA's learned greedy policy reproduces the DP optimal lever
 *        on ALL 9 states, and its greedy mean discounted return from (H,0) lands
 *        within tolerance of V*(H,0).
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
for (const rel of ['js/levers.js', 'js/machine.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Levers  = sandbox.window.Levers;
const Machine = sandbox.window.Machine;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const LEVER_IDS = Levers.LEVER_IDS;        // [run, order, replace]
const A = LEVER_IDS.length;                 // 3
const N = Machine.N;                        // 9
const NS = Machine.NS;                      // 3
const GAMMA = Machine.GAMMA;                // 0.9
const HEALTH = Machine.HEALTH;              // ['HEALTHY','AGING','FAILING']

/* ---------------- Value iteration ---------------- */
const TOL = 1e-12;
const MAX_ITERS = 4000;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                             // Float64Array[9], index = h*3 + s
const policy = vi.policy;                   // [9] lever-id strings
const Qstar = Bellman.qFromV(V, GAMMA);     // Float64Array[9*A]

/* ---------------- Helpers ---------------- */
function sIdx(h, s) { return h * NS + s; }
function vAt(h, s) { return V[sIdx(h, s)]; }
function qAt(h, s, leverId) { return Qstar[sIdx(h, s) * A + LEVER_IDS.indexOf(leverId)]; }
function bestLeverAt(h, s) { return policy[sIdx(h, s)]; }
function round3(x) { return Math.round(x * 1000) / 1000; }
function round4(x) { return Math.round(x * 10000) / 10000; }
function fmt(x) { return Number.isFinite(x) ? x.toFixed(3) : '  --  '; }

function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log('Critical Spare precompute -- 3x3 maintenance grid, 3 levers, gamma = ' + GAMMA);
console.log('  states = (health {HEALTHY,AGING,FAILING}) x (spares {0,1,2}); failure die 0/30/70%; hold -1/spare');
console.log('');
console.log('Phase 1 -- Value iteration');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* Pretty-print the recovered table (the on-screen punchline). */
console.log('');
console.log('   state          |  RUN     ORDER   REPLACE |  V*    | best');
for (let h = 0; h < 3; h++) for (let s = 0; s < NS; s++) {
  const bId = bestLeverAt(h, s);
  const star = id => (id === bId ? '*' : ' ');
  const qr = id => (Machine.isLegal(Machine.mk(h, s), id) ? fmt(qAt(h, s, id)) : '  --  ');
  console.log('  ' + (HEALTH[h] + ',sp=' + s).padEnd(14) + ' | ' +
    qr('run') + star('run') + ' ' + qr('order') + star('order') + ' ' + qr('replace') + star('replace') +
    ' | ' + vAt(h, s).toFixed(3).padStart(6) + ' | ' + Levers.nameOf(bId));
}
console.log('');

/* (1) convergence */
assert('VI converges (maxDelta < 1e-9)', lastSweep.maxDelta < 1e-9 && vi.iters < MAX_ITERS,
  'iters=' + vi.iters + ' maxDelta=' + lastSweep.maxDelta.toExponential(2));

/* (2) optimal policy == the proposal twist grid EXACTLY. */
const SPEC_GRID = [
  /* HEALTHY */ ['run',   'run',     'run'],
  /* AGING   */ ['order', 'replace', 'replace'],
  /* FAILING */ ['order', 'replace', 'replace'],
];
let gridOk = true;
const gotGrid = [];
for (let h = 0; h < 3; h++) {
  const rowArr = [];
  for (let s = 0; s < NS; s++) {
    const got = bestLeverAt(h, s);
    rowArr.push(got);
    if (got !== SPEC_GRID[h][s]) gridOk = false;
  }
  gotGrid.push(rowArr);
}
assert('optimal policy == proposal twist grid (H:RUN; A/F empty:ORDER, stocked:REPLACE)',
  gridOk, 'got ' + JSON.stringify(gotGrid));

/* (3) the three named Q* intuitions (to 1 decimal). */
const qH0run = qAt(0, 0, 'run');
const qA0ord = qAt(1, 0, 'order'), qA0run = qAt(1, 0, 'run');
const qF1rep = qAt(2, 1, 'replace'), qF1run = qAt(2, 1, 'run');
assert('Q*(HEALTHY,0,RUN) ~ 9.1 and is the cell best',
  Math.abs(round3(qH0run) - 9.137) < 0.05 && Math.abs(qH0run - vAt(0, 0)) < 1e-9,
  'Q=' + qH0run.toFixed(4) + ' V=' + vAt(0, 0).toFixed(4));
assert('Q*(AGING,0,ORDER) ~ 4.5 > Q*(AGING,0,RUN) ~ 3.8',
  Math.abs(round3(qA0ord) - 4.501) < 0.05 && Math.abs(round3(qA0run) - 3.751) < 0.05 && qA0ord > qA0run,
  'ORDER=' + qA0ord.toFixed(4) + ' RUN=' + qA0run.toFixed(4));
assert('Q*(FAILING,1,REPLACE) ~ 7.2 > Q*(FAILING,1,RUN) ~ 5.5',
  Math.abs(round3(qF1rep) - 7.224) < 0.05 && Math.abs(round3(qF1run) - 5.507) < 0.05 && qF1rep > qF1run,
  'REPLACE=' + qF1rep.toFixed(4) + ' RUN=' + qF1run.toFixed(4));

/* (4) the twist columns flip with the bin, at the SAME health. */
let flipOk = true;
const flipInfo = [];
for (let h = 1; h <= 2; h++) {                       // AGING, FAILING
  const empty = bestLeverAt(h, 0);                   // expect ORDER
  const stocked = bestLeverAt(h, 1);                 // expect REPLACE
  flipInfo.push(HEALTH[h] + ': bin0=' + empty + ' bin1=' + stocked);
  if (empty !== 'order' || stocked !== 'replace') flipOk = false;
}
assert('the twist flips with the bin: empty -> ORDER, stocked -> REPLACE (AGING & FAILING)',
  flipOk, flipInfo.join('  '));

/* (5) no exact ties among legal levers (unambiguous policy). */
const ties = [];
for (let h = 0; h < 3; h++) for (let s = 0; s < NS; s++) {
  const ids = Machine.availableLeverIds(Machine.mk(h, s));
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    if (qAt(h, s, ids[i]) === qAt(h, s, ids[j])) ties.push(HEALTH[h] + ',sp=' + s + ':' + ids[i] + '==' + ids[j]);
  }
}
assert('no exact Q* ties among legal levers (the policy is unambiguous)',
  ties.length === 0, 'ties=[' + ties.join(',') + ']');

/* ---------------- Per-sweep snapshots for the DP scene ----------------
   The grid fills region by region: HEALTHY locks to RUN almost immediately,
   empty-bin AGING/FAILING settle on ORDER, spare-in-hand AGING/FAILING settle
   on REPLACE. We record (V, Q, solvedMask) after each sweep so the DP scene can
   animate the heat-map filling in. A cell is "solved" once its V is 3dp-stable. */
function buildSweepSnapshots(maxRecord) {
  let Vk = new Float64Array(N);
  const snaps = [];
  const stableAt = new Array(N).fill(-1);
  for (let k = 0; k <= maxRecord; k++) {
    if (k > 0) { const out = Bellman.bellmanSweep(Vk, GAMMA); Vk = out.Vnew; }
    const Qk = Bellman.qFromV(Vk, GAMMA);
    for (let i = 0; i < N; i++) {
      if (stableAt[i] < 0 && Math.abs(Vk[i] - V[i]) < 5e-3) stableAt[i] = k;
    }
    snaps.push({
      sweep: k,
      V: Array.from(Vk, round4),
      Q: Array.from(Qk, x => (Number.isFinite(x) ? round4(x) : null)),
      solved: Array.from(stableAt, s => (s >= 0 && s <= k)),
    });
    if (k >= 6 && stableAt.every(s => s >= 0 && s <= k - 1)) { snaps[snaps.length - 1]._settled = true; break; }
  }
  return snaps;
}
const sweepSnapshots = buildSweepSnapshots(80);
const sweepsToStable = sweepSnapshots.length - 1;
console.log('');
console.log('  DP fill recorded over ' + sweepSnapshots.length + ' sweep-frames ' +
            '(policy regions appear within the first few sweeps; values 3dp-stable by ~sweep ' + sweepsToStable + ')');

/* ---------------- Phase 2 -- model-free TD control: ON-POLICY SARSA ----------------
   Learn Q from experience (roll a turn, observe the outcome, adjust) with NO
   model of the failure die or the aging coin. The headline learner is on-policy
   SARSA: it bootstraps on the lever it ACTUALLY plays next. With a GLIE-annealed
   epsilon (0.5 to 0.05) and a Robbins-Monro step size (alpha = 1/(1+visits)^0.75)
   it converges to the exact DP optimal policy on all 9 states, because on THIS
   MDP the optimal lever is decisive in every cell, so the on-policy value of the
   eps-soft policy still ranks the optimal lever first. Deterministic given the
   seed so snapshots do not flap. */
const SARSA_CFG = {
  alphaPower: 0.75,               // alpha = 1/(1+visits)^alphaPower (Robbins-Monro)
  gamma: GAMMA,
  epsilon: 0.50,
  epsilonMin: 0.05,
  episodes: 400000,
  horizon: 60,                    // gamma^60 ~ 0.0018: truncation negligible
  exploringStarts: true,
  seed: 20260615,
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 300000, 400000],
  evalEvery: 10000,
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

/* One episode of ON-POLICY SARSA (fixed-length rollout, no terminal). */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  let sIdx0 = cfg.exploringStarts ? Math.floor(rng() * N) : 0;
  let s = Machine.stateFromIndex(sIdx0);
  let sIdx = sIdx0;
  let aId = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
  const visited = new Set([sIdx]);
  for (let t = 0; t < cfg.horizon; t++) {
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Machine.sample(s, aId, rng);
    const sNext = out.sNext, reward = out.reward;
    visits[sIdx * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sIdx * A + aIdx]);
    const sNextIdx = Machine.stateIndex(sNext);
    const aNextId = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);   // on-policy a'
    SARSA.update(Q, sIdx, aId, reward, sNextIdx, aNextId, alpha, gamma, false);
    s = sNext; sIdx = sNextIdx; aId = aNextId; visited.add(sIdx);
  }
  return { visited };
}

/* Mean DISCOUNTED return of running the CURRENT greedy policy from (HEALTHY,0).
   The headline "is the learned playbook good?" metric for the SARSA scene; it
   should converge toward V*(HEALTHY,0). */
function greedyReturnFrom(Q, startIdx, episodes, horizon, gamma, rng) {
  let tot = 0;
  for (let e = 0; e < episodes; e++) {
    let s = Machine.stateFromIndex(startIdx), disc = 1, g = 0;
    for (let t = 0; t < horizon; t++) {
      const aId = SARSA.pickEpsGreedy(Q, Machine.stateIndex(s), 0, rng);
      const out = Machine.sample(s, aId, rng);
      g += disc * out.reward; disc *= gamma; s = out.sNext;
    }
    tot += g;
  }
  return tot / episodes;
}

function trainSarsa(cfg) {
  const rng = Machine.makeRng(cfg.seed);
  const evalRng = Machine.makeRng(cfg.seed ^ 0x9e3779b9);
  const Q = new Float32Array(N * A);
  const visits = new Float64Array(N * A);
  const visitCounts = new Int32Array(N);
  const snapshots = [];
  const valueCurve = [];            // [{episode, ret}] greedy mean discounted return from (H,0)
  const START = sIdx(0, 0);
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  valueCurve.push({ episode: 0, ret: Number(greedyReturnFrom(Q, START, 3000, 200, cfg.gamma, evalRng).toFixed(4)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsAt(ep, cfg);
    const o = runSarsaEpisode(Q, visits, cfg.gamma, eps, rng, cfg);
    for (const i of o.visited) visitCounts[i]++;
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) {
      valueCurve.push({ episode: ep, ret: Number(greedyReturnFrom(Q, START, 3000, 200, cfg.gamma, evalRng).toFixed(4)) });
    }
  }
  return { Q, visitCounts: Array.from(visitCounts), snapshots, valueCurve };
}

function summariseSarsa(learner, evalSeed) {
  const learnedPolicy = SARSA.argmaxPolicy(learner.Q);
  let agreed = 0;
  const disagreements = [];
  for (let i = 0; i < N; i++) {
    const got = learnedPolicy[i];
    const dp = policy[i];
    if (got === dp) agreed++;
    else disagreements.push(Machine.stateLabel(Machine.stateFromIndex(i)) + '(learned=' + Levers.nameOf(got) + ', dp=' + Levers.nameOf(dp) + ')');
  }
  const finalReturn = greedyReturnFrom(learner.Q, sIdx(0, 0), 40000, 200, GAMMA, Machine.makeRng(evalSeed));
  const earlyReturn = learner.valueCurve[0].ret;
  return { policy: learnedPolicy, agreed, disagreements, finalReturn, earlyReturn };
}

console.log('');
console.log('Phase 2 -- model-free TD control: ON-POLICY SARSA');
console.log('  ' + SARSA_CFG.episodes + ' episodes, horizon ' + SARSA_CFG.horizon +
            ', alpha=1/(1+n)^' + SARSA_CFG.alphaPower + ', eps ' + SARSA_CFG.epsilon + ' to ' + SARSA_CFG.epsilonMin + ' (GLIE)');
const t0 = Date.now();
const sarsaL = trainSarsa(SARSA_CFG);
console.log('  trained in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
const sarsaSum = summariseSarsa(sarsaL, 0xC0FFEE);

const dpBets = policy.map(id => Levers.nameOf(id));
const learnedBets = sarsaSum.policy.map(id => Levers.nameOf(id));
console.log('');
console.log('  SARSA learned grid:  [' + learnedBets.join(', ') + ']');
console.log('  DP optimal grid:     [' + dpBets.join(', ') + ']');
console.log('  DP agreement: ' + sarsaSum.agreed + '/' + N +
            '   greedy return from (H,0): ' + sarsaSum.earlyReturn.toFixed(3) + ' to ' + sarsaSum.finalReturn.toFixed(3) +
            '   (V*(H,0) = ' + vAt(0, 0).toFixed(3) + ')');
if (sarsaSum.disagreements.length) console.log('  SARSA diverges from DP at: ' + sarsaSum.disagreements.join(', '));

/* (6) SARSA recovers the DP optimum on all 9 states + return matches. */
assert('SARSA greedy policy reproduces the DP optimal lever on ALL 9 states',
  sarsaSum.agreed === N, 'agreed=' + sarsaSum.agreed + '/' + N + ' diffs=[' + sarsaSum.disagreements.join(',') + ']');
assert('SARSA greedy mean discounted return from (H,0) is within 0.5 of V*(H,0)',
  Math.abs(sarsaSum.finalReturn - vAt(0, 0)) <= 0.5, 'got ' + sarsaSum.finalReturn.toFixed(3) + ' vs ' + vAt(0, 0).toFixed(3));
assert('SARSA greedy return from (H,0) improved over training',
  sarsaSum.finalReturn >= sarsaSum.earlyReturn, 'early ' + sarsaSum.earlyReturn + ' final ' + sarsaSum.finalReturn);

/* ---------------- A fixed illustrative trajectory ----------------
   One short, deterministic demo quarter from (HEALTHY,0) under the OPTIMAL
   policy, pinned seed, for the trajectory / return scenes. Picked so it shows
   the twist in action: aging, an ORDER, then a REPLACE, and at least one rolled
   failure so the felt risk is visible. */
function buildDemoTrajectory(seed, startIdx, turns) {
  for (let attempt = 0; attempt < 8000; attempt++) {
    const rng = Machine.makeRng(seed + attempt);
    let s = Machine.stateFromIndex(startIdx);
    const steps = [];
    for (let t = 0; t < turns; t++) {
      const leverId = policy[Machine.stateIndex(s)];
      const out = Machine.sample(s, leverId, rng);
      steps.push({
        hBefore: out.log.hBefore, sBefore: out.log.sBefore,
        lever: leverId, kind: out.log.kind,
        failed: !!out.log.failed, aged: !!out.log.aged,
        reward: out.reward,
        hAfter: out.log.hAfter, sAfter: out.log.sAfter,
      });
      s = out.sNext;
    }
    const usedOrder = steps.some(x => x.lever === 'order');
    const usedReplace = steps.some(x => x.lever === 'replace');
    const aFail = steps.some(x => x.failed);
    if (usedOrder && usedReplace && aFail) {
      return { seedUsed: seed + attempt, startIdx, turns, steps };
    }
  }
  const rng = Machine.makeRng(seed);
  let s = Machine.stateFromIndex(startIdx); const steps = [];
  for (let t = 0; t < turns; t++) {
    const leverId = policy[Machine.stateIndex(s)];
    const out = Machine.sample(s, leverId, rng);
    steps.push({ hBefore: out.log.hBefore, sBefore: out.log.sBefore, lever: leverId, kind: out.log.kind,
      failed: !!out.log.failed, aged: !!out.log.aged, reward: out.reward, hAfter: out.log.hAfter, sAfter: out.log.sAfter });
    s = out.sNext;
  }
  return { seedUsed: seed, startIdx, turns, steps };
}
const demoTrajectory = buildDemoTrajectory(11, sIdx(0, 0), 12);
console.log('');
console.log('Demo quarter (optimal policy from HEALTHY/0, seed ' + demoTrajectory.seedUsed + '): ' +
            demoTrajectory.turns + ' turns, total reward ' +
            demoTrajectory.steps.reduce((a, x) => a + x.reward, 0));

/* ---------------- Return-distribution bars for the Return scene ----------------
   Fix (AGING, 0 spares) and a chosen FIRST lever, then play OPTIMALLY for a
   12-turn quarter; build a histogram of the (undiscounted) quarter totals. The
   empty-bin AGING cell is the twist's jewel: ORDER (acquire protection) beats
   RUN (gamble into a 30%-and-rising failure with no protection), and the RUN
   tail is fatter (an empty-bin failure books -8). */
function quarterReturnDist(startIdx, firstLeverId, trials, turns, seed) {
  const rng = Machine.makeRng(seed);
  const totals = [];
  let sum = 0;
  for (let e = 0; e < trials; e++) {
    let s = Machine.stateFromIndex(startIdx), first = true, g = 0;
    for (let t = 0; t < turns; t++) {
      const leverId = first ? firstLeverId : policy[Machine.stateIndex(s)];
      first = false;
      const out = Machine.sample(s, leverId, rng);
      g += out.reward; s = out.sNext;
    }
    totals.push(g); sum += g;
  }
  const lo = Math.min.apply(null, totals), hi = Math.max.apply(null, totals);
  const nb = 16;
  const bins = new Array(nb).fill(0);
  const span = Math.max(1, hi - lo);
  for (const g of totals) { let b = Math.floor((g - lo) / span * (nb - 1)); if (b < 0) b = 0; if (b >= nb) b = nb - 1; bins[b]++; }
  return { mean: Number((sum / trials).toFixed(3)), lo, hi, nb, bins, trials };
}
const returnBars = {
  startIdx: sIdx(1, 0),                                // AGING, empty bin
  turns: 12,
  order: quarterReturnDist(sIdx(1, 0), 'order', 20000, 12, 101),   // pre-order: acquire protection
  run:   quarterReturnDist(sIdx(1, 0), 'run',   20000, 12, 202),   // gamble: run it
};
console.log('  return from (AGING,0): start ORDER quarter-mean ~ ' + returnBars.order.mean +
            ' , start RUN ~ ' + returnBars.run.mean + ' (worst RUN quarter ' + returnBars.run.lo + ')');

/* ---------------- Named spot-Q rows the Q* scene calls out ---------------- */
function spotRow(h, s) {
  const ids = Machine.availableLeverIds(Machine.mk(h, s));
  const obj = {};
  for (const id of LEVER_IDS) obj[id] = ids.includes(id) ? Number(qAt(h, s, id).toFixed(4)) : null;
  return { h, s, label: Machine.stateLabel(Machine.mk(h, s)), q: obj, best: bestLeverAt(h, s), legal: ids };
}
const spotQ = {
  h0s0: spotRow(0, 0),   // HEALTHY, empty -> RUN
  h1s0: spotRow(1, 0),   // AGING, empty -> ORDER
  h2s0: spotRow(2, 0),   // FAILING, empty -> ORDER
  h2s1: spotRow(2, 1),   // FAILING, 1 spare -> REPLACE
};

/* ---------------- Recap cards (machine-maintenance voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is two gauges you already watch: machine HEALTH and SPARES on hand. The lever is RUN / ORDER / REPLACE. The part you do not control is the failure die (and the aging coin). The payoff is this turn\'s cash: +3 to run, -2 to order, -8 for downtime, -3 for a rushed swap, -1 per spare held.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POL', scene: 4, title: 'YOUR MAINTENANCE PLAYBOOK',
    text: 'A policy assigns one lever to EVERY one of the nine situations, the SOP your whole crew could follow without you. "run-to-failure" and "always-stocked" are two such doctrines, each one heat-map over the grid.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RTN', scene: 6, title: 'THE QUARTER, AS A DISTRIBUTION',
    text: 'The return is the cash summed over the rest of the horizon. Run the same playbook twice and you get two different quarters: that is the dice, not bad management. Judge a doctrine by its whole distribution, never one quarter.',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} \\gamma^{\\,j-i} r_j' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'A LEVER\'S LIFETIME VALUE',
    text: 'Q*(s, a) is the true long-run value of pulling lever a here, then playing smart forever after: the number you wish sat on every dashboard. The argmax (the star) FLIPS with the situation: RUN it, pre-order, or swap now.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT PLAYBOOK IF YOU KNEW THE ODDS',
    text: 'With a perfect model of the failure odds and aging, Q* solves its own Bellman equation: a lever\'s value is the cash it pays now plus the value of where it leaves you. Sweep the backup and the twist heat-map fills itself in.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\gamma\\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'TD', scene: 11, title: 'LEARN THE PLAYBOOK BY RUNNING IT',
    text: 'No model of the failure odds? Replace the expectation with one observed turn: after each lever-pull, compare what you expected to what happened, and nudge. With exploration to keep testing the unproven lever, SARSA homes in on the exact same twist heat-map, with no model ever given.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + \\gamma\\,q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Levers for display ---------------- */
const leversDisplay = Levers.LEVERS.map(l => ({ id: l.id, name: l.name, role: l.role }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

const DATA = {
  gamma: GAMMA,
  health: HEALTH,
  healthShort: Machine.HEALTH_SHORT,
  pFail: Machine.P_FAIL,
  dims: { rows: Machine.ROWS, cols: Machine.COLS, NH: Machine.NH, NS: Machine.NS, N: N, A: A },
  policy: policy.slice(),                          // 9 lever-id strings, index h*3+s
  V: roundArr(V, 4),                               // 9 values
  Qstar: roundArr(Qstar, 4),                       // 9*A, index stateIdx*A + leverIdx (null = clamped)
  levers: leversDisplay,
  leverIds: LEVER_IDS.slice(),
  legalLevers: (function () { const m = {}; for (let h = 0; h < 3; h++) for (let s = 0; s < NS; s++) m[h * NS + s] = Machine.availableLeverIds(Machine.mk(h, s)); return m; })(),
  rewards: { run: 3, order: -2, downtime: -8, emergency: -3, holding: -1, replace: 0 },

  recap: recap,
  demoTrajectory: demoTrajectory,
  returnBars: returnBars,
  spotQ: spotQ,

  valueIteration: {
    gamma: GAMMA,
    iters: vi.iters,
    sweepsToStable: sweepsToStable,
    snapshots: sweepSnapshots,                     // [{sweep, V[9], Q[9*A], solved[9]}]
  },

  /* ON-POLICY SARSA learner for scene 11. */
  learner: {
    kind: 'sarsa', offPolicy: false,
    config: SARSA_CFG,
    optimalStartValue: Number(vAt(0, 0).toFixed(4)),  // V*(HEALTHY,0)
    finalPolicy: sarsaSum.policy,
    snapshots: sarsaL.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
    valueCurve: sarsaL.valueCurve,
    visitCounts: sarsaL.visitCounts,
    stats: {
      finalReturn: Number(sarsaSum.finalReturn.toFixed(4)),
      earlyReturn: Number(sarsaSum.earlyReturn.toFixed(4)),
      agreedCount: sarsaSum.agreed, totalStates: N,
      disagreements: sarsaSum.disagreements,
    },
  },

  /* hand-computable backups shown in the Bellman scene. */
  handBackups: {
    /* Q*(FAILING, 1, REPLACE): deterministic. Pay 0 (minus holding 1), land in
       (HEALTHY, 0), worth gamma * V*(HEALTHY,0). */
    repF1: {
      label: 'Q*(FAILING, 1 spare, REPLACE)',
      expr: '(0 - 1) + 0.9 \\cdot V^{*}(\\text{HEALTHY}, 0)',
      value: Number(qAt(2, 1, 'replace').toFixed(4)),
      vNext: Number(vAt(0, 0).toFixed(4)),
    },
    /* Q*(AGING, 0, ORDER): deterministic. Pay 2 (holding 0 since bin empty),
       land in (AGING, 1), worth gamma * V*(AGING,1). */
    ordA0: {
      label: 'Q*(AGING, 0 spares, ORDER)',
      expr: '-2 + 0.9 \\cdot V^{*}(\\text{AGING}, 1)',
      value: Number(qAt(1, 0, 'order').toFixed(4)),
      vNext: Number(vAt(1, 1).toFixed(4)),
    },
  },

  tex: {
    state:      's = (\\,\\text{health},\\ \\text{spares}\\,)',
    actions:    'a \\in A = \\{\\ \\text{RUN},\\ \\text{ORDER},\\ \\text{REPLACE}\\ \\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a)\\ :\\quad \\text{failure die} + \\text{aging coin}',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} \\gamma^{\\,j-i} r_j',
    qstar:      'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:    'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\gamma\\max_{a\'} Q^{*}(S\',a\') \\,]',
    sarsa:      'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + \\gamma\\,q[s\',a\'] - q[s,a] \\,\\bigr)',
    gammaVal:   '\\gamma = 0.9',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Critical Spare -- static MDP solution plus value-iteration fill frames and\n" +
  " * an on-policy SARSA training trajectory.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script loads\n" +
  " * the verified engine (js/levers.js + js/machine.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS the converged twist grid (HEALTHY:RUN; AGING/\n" +
  " * FAILING empty-bin:ORDER, stocked-bin:REPLACE), the three named Q*\n" +
  " * intuitions, the no-ties property, and that ON-POLICY SARSA reproduces the DP\n" +
  " * optimum on all 9 states; if any assertion fails, this file is NOT written.\n" +
  " *\n" +
  " * Qstar is indexed [stateIdx*A + leverIdx], stateIdx = health*3 + spares,\n" +
  " * leverIdx in [run, order, replace]; a null entry is a clamped (illegal) lever.\n" +
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

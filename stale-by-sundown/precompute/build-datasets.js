/* Stale by Sundown precompute -- the RIGOR GATE.
 *
 *   Runs value iteration on the bakery markdown MDP (units 1..3 x tier
 *   FRESH..STALE = 15 states; levers HOLD/DISCOUNT/DUMP; the posted buy-meter;
 *   rewards +5 HOLD sale / +2 DISCOUNT sale / -3 DUMP / -6 SPOILED / 0 CLEARED;
 *   gamma = 0.75) and emits V* / Q* / the optimal policy plus an on-policy SARSA
 *   learning run to data/datasets.js as window.DATA, the JSON the page loads.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified runtime
 *   engine (js/levers.js + js/bakery.js + js/bellman.js + js/sarsa.js) through a
 *   tiny `window` shim so the precompute and the runtime share one source of
 *   truth.
 *
 *   HARD ASSERTIONS (throw / exit on mismatch; the file is NOT written on
 *   failure):
 *     1) VI converges (max-deltaV < 1e-9) within the iteration cap.
 *     2) The recovered OPTIMAL POLICY board equals the proposal's twist EXACTLY:
 *          FRESH  -> HOLD HOLD HOLD
 *          OK     -> HOLD HOLD HOLD
 *          AGING  -> HOLD DISCOUNT DISCOUNT
 *          OLD    -> DISCOUNT DISCOUNT DISCOUNT
 *          STALE  -> DUMP DUMP DUMP
 *        (green cap, amber middle, red floor; only AGING wiggles at 1 unit.)
 *     3) The three hand-checkable Q* intuitions match the proposal to 2 dp:
 *          (1,STALE): HOLD -5.45, DISCOUNT -4.00, DUMP -0.18 (best)
 *          (2,OLD)  : HOLD  1.73, DISCOUNT  2.17 (best), DUMP 1.33
 *          (2,FRESH): HOLD  5.77 (best), DISCOUNT 4.51, DUMP 1.33
 *     4) The (1,STALE)->DUMP backup reproduces: -3 + 0.75*V(1,FRESH), with
 *        V(1,FRESH) ~ 3.76.
 *     5) Every cell of the board has a STRICT winner (no exact Q* ties), so the
 *        rendered policy + a snapshot diff do not flap.
 *     6) The age axis dominates: 4 of the 5 tier-rows pick the same lever across
 *        all 3 unit columns (only AGING differs by stock).
 *     7) ON-POLICY SARSA (GLIE: annealing epsilon + Robbins-Monro step,
 *        exploring starts) reproduces the DP-optimal board on ALL 15 cells, and
 *        does so robustly across several seeds. Constant-epsilon SARSA is also
 *        run to SHOW the on-policy cautious bias (it under-discounts), but the
 *        GLIE learner is the headline and the one asserted == DP.
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
for (const rel of ['js/levers.js', 'js/bakery.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Levers  = sandbox.window.Levers;
const Bakery  = sandbox.window.Bakery;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const LEVER_IDS = Levers.LEVER_IDS;        // [HOLD, DISCOUNT, DUMP]
const A = LEVER_IDS.length;                 // 3
const N = Bakery.N;                         // 15
const TIERS = Bakery.TIERS;                 // [FRESH, OK, AGING, OLD, STALE]
const UNITS = Bakery.UNITS;                 // [1,2,3]
const GAMMA = 0.75;

/* ---------------- Value iteration ---------------- */
const TOL = 1e-13;
const MAX_ITERS = 500;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                             // Float64Array[15], index = stateIndex
const policy = vi.policy;                   // [15] lever-id strings
const Qstar = Bellman.qFromV(V, GAMMA);     // Float64Array[15*A]

/* ---------------- Helpers ---------------- */
function sIdx(u, t) { return (u - 1) * TIERS.length + TIERS.indexOf(t); }
function vAt(u, t) { return V[sIdx(u, t)]; }
function qRow(u, t) {
  const base = sIdx(u, t) * A;
  const r = {};
  for (let a = 0; a < A; a++) r[LEVER_IDS[a]] = Qstar[base + a];
  return r;
}
function bestLever(u, t) { return policy[sIdx(u, t)]; }
function round2(x) { return Math.round(x * 100) / 100; }
function round3(x) { return Math.round(x * 1000) / 1000; }
function round4(x) { return Math.round(x * 10000) / 10000; }
function fmt(x) { return Number.isFinite(x) ? x.toFixed(2).padStart(6) : '  --  '; }

/* ---------------- Assertions ---------------- */
function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log('Stale by Sundown precompute -- 15-state bakery markdown MDP, 3 levers, gamma = ' + GAMMA);
console.log('  states = (units 1..3) x (tier FRESH..STALE); terminals CLEARED (0), SPOILED (-6 on entry)');
console.log('');
console.log('Phase 1 -- Value iteration');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* Pretty-print the recovered board + Q rows. */
console.log('');
console.log('   state      |  HOLD    DISC    DUMP   |  V*     | best');
for (const t of TIERS) {
  for (const u of UNITS) {
    const r = qRow(u, t);
    const best = bestLever(u, t);
    const star = id => (id === best ? '*' : ' ');
    console.log(
      '  (' + u + ',' + t.padEnd(5) + ') | ' +
      fmt(r.HOLD) + star('HOLD') + ' ' +
      fmt(r.DISCOUNT) + star('DISCOUNT') + ' ' +
      fmt(r.DUMP) + star('DUMP') + ' | ' +
      vAt(u, t).toFixed(3).padStart(6) + ' | ' + best);
  }
}
console.log('');
console.log('Optimal playbook board (rows = tier, cols = units 1..3):');
console.log('  tier   |  u=1        u=2        u=3');
for (const t of TIERS) {
  console.log('  ' + t.padEnd(5) + '|  ' + UNITS.map(u => bestLever(u, t).padEnd(9)).join('  '));
}
console.log('');

/* (1) convergence */
assert('VI converges (maxDelta < 1e-9)', lastSweep.maxDelta < 1e-9 && vi.iters < MAX_ITERS,
  'iters=' + vi.iters + ' maxDelta=' + lastSweep.maxDelta.toExponential(2));

/* (2) optimal policy board == the proposal's twist EXACTLY */
const SPEC_BOARD = {
  FRESH: ['HOLD', 'HOLD', 'HOLD'],
  OK:    ['HOLD', 'HOLD', 'HOLD'],
  AGING: ['HOLD', 'DISCOUNT', 'DISCOUNT'],
  OLD:   ['DISCOUNT', 'DISCOUNT', 'DISCOUNT'],
  STALE: ['DUMP', 'DUMP', 'DUMP'],
};
let boardOk = true; const boardDiffs = [];
for (const t of TIERS) for (let i = 0; i < UNITS.length; i++) {
  const got = bestLever(UNITS[i], t);
  if (got !== SPEC_BOARD[t][i]) { boardOk = false; boardDiffs.push('(' + UNITS[i] + ',' + t + ') got ' + got + ' want ' + SPEC_BOARD[t][i]); }
}
assert('optimal policy board == proposal twist EXACTLY (HOLD cap / DISCOUNT middle / DUMP floor)',
  boardOk, boardDiffs.join('; '));

/* (3) the three hand-checkable Q* intuitions match the proposal to 2 dp */
const SPEC_Q = {
  '1,STALE': { HOLD: -5.45, DISCOUNT: -4.00, DUMP: -0.18, best: 'DUMP' },
  '2,OLD':   { HOLD: 1.73,  DISCOUNT: 2.17,  DUMP: 1.33,  best: 'DISCOUNT' },
  '2,FRESH': { HOLD: 5.77,  DISCOUNT: 4.51,  DUMP: 1.33,  best: 'HOLD' },
};
let qOk = true; const qInfo = [];
for (const key of Object.keys(SPEC_Q)) {
  const [us, ts] = key.split(','); const u = +us;
  const r = qRow(u, ts);
  for (const lev of LEVER_IDS) {
    if (Math.abs(round2(r[lev]) - SPEC_Q[key][lev]) > 1e-9) { qOk = false; qInfo.push(key + '.' + lev + '=' + round2(r[lev]) + ' want ' + SPEC_Q[key][lev]); }
  }
  if (bestLever(u, ts) !== SPEC_Q[key].best) { qOk = false; qInfo.push(key + ' best=' + bestLever(u, ts) + ' want ' + SPEC_Q[key].best); }
}
assert('three hand-checkable Q* intuitions match proposal to 2 dp ((1,STALE)/(2,OLD)/(2,FRESH))',
  qOk, qInfo.join('; '));

/* (4) the (1,STALE)->DUMP backup reproduces: -3 + 0.75*V(1,FRESH), V(1,FRESH)~3.76 */
const vFresh1 = vAt(1, 'FRESH');
const dumpBackup = -3 + GAMMA * vFresh1;
assert('(1,STALE) DUMP backup = -3 + 0.75*V(1,FRESH) reproduces Q*(1,STALE,DUMP)',
  Math.abs(dumpBackup - qRow(1, 'STALE').DUMP) < 1e-12,
  'backup=' + dumpBackup.toFixed(4) + ' vs Q=' + qRow(1, 'STALE').DUMP.toFixed(4));
assert('V(1,FRESH) ~ 3.76 (the proposal\'s DUMP-reset value)',
  Math.abs(round2(vFresh1) - 3.76) < 1e-9, 'V(1,FRESH)=' + vFresh1.toFixed(4));

/* (5) every cell has a STRICT winner (no exact Q* ties among the 3 levers) */
const tieCells = [];
for (const t of TIERS) for (const u of UNITS) {
  const r = qRow(u, t);
  const vals = LEVER_IDS.map(l => r[l]).sort((a, b) => b - a);
  if (Math.abs(vals[0] - vals[1]) < 1e-9) tieCells.push('(' + u + ',' + t + ')');
}
assert('every board cell has a STRICT winner (no exact Q* ties)',
  tieCells.length === 0, 'ties at ' + tieCells.join(', '));

/* (6) the AGE axis dominates: 4 of 5 tier-rows pick the same lever across all
   3 unit columns; only AGING differs by stock. */
const stockSensitiveRows = TIERS.filter(t => {
  const a = bestLever(1, t), b = bestLever(2, t), c = bestLever(3, t);
  return !(a === b && b === c);
});
assert('age drives the policy: exactly one tier-row (AGING) is stock-sensitive',
  stockSensitiveRows.length === 1 && stockSensitiveRows[0] === 'AGING',
  'stock-sensitive rows = [' + stockSensitiveRows.join(', ') + ']');

/* ---------------- Per-sweep snapshots for the DP scene ----------------
   The case fills "from the terminals inward": STALE (the spoilage cliff) locks
   first, then OLD/AGING, then the FRESH/OK cap. We record (V, Q, solvedMask)
   after each sweep so the DP scene animates value spreading band by band. A
   cell is "solved" once its V has reached three-decimal stability vs V*. */
function buildSweepSnapshots(maxRecord) {
  let Vk = new Float64Array(N);
  const snaps = [];
  const stableAt = new Array(N).fill(-1);
  for (let k = 0; k <= maxRecord; k++) {
    if (k > 0) { const out = Bellman.bellmanSweep(Vk, GAMMA); Vk = out.Vnew; }
    const Qk = Bellman.qFromV(Vk, GAMMA);
    for (let i = 0; i < N; i++) {
      if (stableAt[i] < 0 && Math.abs(Vk[i] - V[i]) < 5e-4) stableAt[i] = k;
    }
    snaps.push({
      sweep: k,
      V: Array.from(Vk, round4),
      Q: Array.from(Qk, round4),
      solved: Array.from(stableAt, s => (s >= 0 && s <= k)),
    });
    if (k >= 4 && stableAt.every(s => s >= 0 && s <= k - 1)) { snaps[snaps.length - 1]._settled = true; break; }
  }
  return snaps;
}
const sweepSnapshots = buildSweepSnapshots(60);
const sweepsToStable = sweepSnapshots.length - 1;
console.log('  DP fill recorded over ' + sweepSnapshots.length + ' sweep-frames ' +
            '(value reaches 3dp stability by ~sweep ' + sweepsToStable + ')');

/* ---------------- Phase 2 -- model-free TD control: ON-POLICY SARSA ----------------
   We learn Q from experience (sell/age/adjust) with NO model of the buy-meter.
   The HEADLINE learner is ON-POLICY SARSA with a GLIE schedule: the bootstrap
   uses the next lever a' we ACTUALLY pick (eps-greedy), epsilon ANNEALS toward
   0, and the step size decays Robbins-Monro. Under GLIE, on-policy SARSA's fixed
   point becomes Q*, so the learned board converges to the DP oracle on all 15
   cells, robustly across seeds.

   We ALSO run a CONSTANT-epsilon SARSA learner to show the honest on-policy
   nuance: with steady exploration, SARSA learns the value of the exploratory
   policy it follows and ends up slightly CAUTIOUS (it under-values a few HOLD
   cells, discounting earlier than DP would). As exploration anneals, that bias
   vanishes -- which is exactly the GLIE story on screen. */

function epsGLIE(ep, cfg) {
  if (cfg.constEps != null) return cfg.constEps;
  const frac = ep / cfg.episodes;
  return Math.max(cfg.epsMin, cfg.eps0 * Math.pow(cfg.epsMin / cfg.eps0, frac));
}
function alphaFor(cfg, visitCount) {
  if (cfg.constAlpha != null) return cfg.constAlpha;
  return 1 / Math.pow(1 + visitCount, cfg.alphaPow);
}

/* One episode of ON-POLICY SARSA, exploring start. */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  const u0 = 1 + Math.floor(rng() * UNITS.length);
  const t0 = TIERS[Math.floor(rng() * TIERS.length)];
  let s = Bakery.makeState(u0, t0);
  let sI = Bakery.stateIndex(s);
  let aId = SARSA.pickEpsGreedy(Q, sI, eps, rng);
  let guard = 0;
  while (!s.terminal && guard++ < 500) {
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Bakery.sample(s, aId, rng);
    visits[sI * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sI * A + aIdx]);
    if (out.terminal) { SARSA.update(Q, sI, aId, out.reward, -1, null, alpha, gamma, true); break; }
    const sNextIdx = Bakery.stateIndex(out.sNext);
    const aNextId = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);   // on-policy a'
    SARSA.update(Q, sI, aId, out.reward, sNextIdx, aNextId, alpha, gamma, false);
    s = out.sNext; sI = sNextIdx; aId = aNextId;
  }
}

/* Mean discounted return of running the CURRENT greedy policy from a fixed
   start, the headline "is the learned playbook good?" metric. */
function greedyReturnFrom(Q, u0, t0, episodes, rng) {
  let sum = 0;
  for (let e = 0; e < episodes; e++) {
    let s = Bakery.makeState(u0, t0), guard = 0, g = 0, disc = 1;
    while (!s.terminal && guard++ < 500) {
      const aId = SARSA.pickEpsGreedy(Q, Bakery.stateIndex(s), 0, rng);
      const out = Bakery.sample(s, aId, rng);
      g += disc * out.reward; disc *= GAMMA;
      s = out.sNext;
    }
    sum += g;
  }
  return sum / episodes;
}

/* Train, recording Q snapshots + an agreement-with-DP curve. Deterministic. */
function trainSarsa(cfg) {
  const rng = Bakery.makeRng(cfg.seed);
  const evalRng = Bakery.makeRng(cfg.seed ^ 0x9e3779b9);
  const Q = new Float32Array(N * A);
  const visits = new Float64Array(N * A);
  const snapshots = [];
  const agreeCurve = [];
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  agreeCurve.push({ episode: 0, agree: agreementWithDP(Q), ret: Number(greedyReturnFrom(Q, 3, 'FRESH', 1500, evalRng).toFixed(4)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsGLIE(ep, cfg);
    runSarsaEpisode(Q, visits, GAMMA, eps, rng, cfg);
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) {
      agreeCurve.push({ episode: ep, agree: agreementWithDP(Q), ret: Number(greedyReturnFrom(Q, 3, 'FRESH', 1500, evalRng).toFixed(4)) });
    }
  }
  return { Q, snapshots, agreeCurve };
}

/* Count of the 15 cells whose greedy lever matches the DP oracle. */
function agreementWithDP(Q) {
  const learned = SARSA.argmaxPolicy(Q);
  let n = 0;
  for (let i = 0; i < N; i++) if (learned[i] === policy[i]) n++;
  return n;
}
function summariseSarsa(Q) {
  const learned = SARSA.argmaxPolicy(Q);
  const board = {};
  const diffs = [];
  for (const t of TIERS) {
    board[t] = UNITS.map(u => learned[sIdx(u, t)]);
    for (let i = 0; i < UNITS.length; i++) {
      const got = learned[sIdx(UNITS[i], t)];
      if (got !== policy[sIdx(UNITS[i], t)]) diffs.push('(' + UNITS[i] + ',' + t + ') learned=' + got + ' dp=' + policy[sIdx(UNITS[i], t)]);
    }
  }
  return { learned, board, diffs, agreed: agreementWithDP(Q) };
}

/* GLIE config -- the headline learner (converges to Q*). */
const SARSA_GLIE = {
  kind: 'sarsa-glie',
  eps0: 0.30, epsMin: 0.02, alphaPow: 0.70,
  gamma: GAMMA, episodes: 300000, seed: 20260615,
  snapshotEpisodes: [0, 200, 1000, 5000, 20000, 60000, 150000, 300000],
  evalEvery: 5000,
};
/* Constant-epsilon config -- shown as the cautious on-policy contrast. */
const SARSA_CONST = {
  kind: 'sarsa-const',
  constEps: 0.10, constAlpha: 0.05,
  gamma: GAMMA, episodes: 300000, seed: 20260616,
  snapshotEpisodes: [0, 200, 1000, 5000, 20000, 60000, 150000, 300000],
  evalEvery: 5000,
};

console.log('');
console.log('Phase 2 -- model-free TD control: ON-POLICY SARSA');
console.log('  GLIE   : ' + SARSA_GLIE.episodes + ' eps, eps ' + SARSA_GLIE.eps0 + '->' + SARSA_GLIE.epsMin +
            ' (anneal), alpha=1/(1+n)^' + SARSA_GLIE.alphaPow + ' (Robbins-Monro), exploring starts');
console.log('  const  : ' + SARSA_CONST.episodes + ' eps, eps=' + SARSA_CONST.constEps +
            ' steady, alpha=' + SARSA_CONST.constAlpha + ' const (the cautious on-policy contrast)');
const t0 = Date.now();
const glie = trainSarsa(SARSA_GLIE);
const cst  = trainSarsa(SARSA_CONST);
console.log('  trained both in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

const glieSum = summariseSarsa(glie.Q);
const cstSum  = summariseSarsa(cst.Q);

console.log('');
console.log('  GLIE SARSA  board (rows tier, cols units): agreement ' + glieSum.agreed + '/15');
for (const t of TIERS) console.log('    ' + t.padEnd(5) + ' ' + glieSum.board[t].map(x => x.padEnd(9)).join(' '));
console.log('  CONST SARSA board: agreement ' + cstSum.agreed + '/15' + (cstSum.diffs.length ? '  (cautious diffs: ' + cstSum.diffs.join(', ') + ')' : ''));
console.log('  GLIE agreement curve: ' + glie.agreeCurve.map(p => p.episode + ':' + p.agree).join('  '));

/* (7a) GLIE SARSA reproduces the DP board on ALL 15 cells (the headline). */
assert('GLIE on-policy SARSA reproduces the DP-optimal board on all 15 cells',
  glieSum.agreed === N, 'agreed=' + glieSum.agreed + '/' + N + ' diffs=[' + glieSum.diffs.join('; ') + ']');

/* (7b) GLIE robustness: perfect across several extra seeds, so the scene's
   converged board is not a lucky draw. */
let robustOk = true; const robustInfo = [];
for (const seed of [101, 202, 303, 404, 505]) {
  const r = trainSarsa(Object.assign({}, SARSA_GLIE, { seed, snapshotEpisodes: [0], evalEvery: 1e9 }));
  const ag = agreementWithDP(r.Q);
  robustInfo.push(seed + ':' + ag);
  if (ag !== N) robustOk = false;
}
assert('GLIE SARSA recovers the full board across 5 extra seeds (robust, not a lucky draw)',
  robustOk, 'per-seed agreement = [' + robustInfo.join(', ') + ']');

/* (7c) the greedy return of the GLIE-learned policy from (3,FRESH) lands close
   to the DP value V*(3,FRESH). */
const glieFinalRet = greedyReturnFrom(glie.Q, 3, 'FRESH', 40000, Bakery.makeRng(0xC0FFEE));
const glieEarlyRet = glie.agreeCurve[0].ret;
assert('GLIE-learned greedy return from (3,FRESH) is within 0.15 of V*(3,FRESH)',
  Math.abs(glieFinalRet - vAt(3, 'FRESH')) <= 0.15,
  'got ' + glieFinalRet.toFixed(3) + ' vs V*=' + vAt(3, 'FRESH').toFixed(3));
assert('GLIE-learned greedy return improved over training',
  glieFinalRet >= glieEarlyRet - 1e-6, 'early ' + glieEarlyRet + ' final ' + glieFinalRet.toFixed(3));

/* (7d) constant-eps SARSA is demonstrably MORE CAUTIOUS than DP: it differs on
   at least one cell, discounting where DP would still HOLD. This is the honest
   on-policy nuance; it is seeded so it does not flap. */
assert('constant-epsilon SARSA is more cautious than DP (>=1 cell differs)',
  cstSum.agreed < N && cstSum.diffs.length >= 1,
  'agreement ' + cstSum.agreed + '/' + N + ' diffs=[' + cstSum.diffs.join('; ') + ']');

/* ---------------- A fixed illustrative trajectory ----------------
   One short, deterministic demo day under the OPTIMAL policy from (3,FRESH),
   pinned seed, for the tutorial / trajectory / return scenes. Want a legible
   run that shows an age tick and a sale or two and ends terminal. */
function buildDemoTrajectory(seed, u0, t0Tier, wantCleared) {
  for (let attempt = 0; attempt < 6000; attempt++) {
    const rng = Bakery.makeRng(seed + attempt);
    let s = Bakery.makeState(u0, t0Tier);
    const steps = []; let guard = 0;
    while (!s.terminal && guard++ < 60) {
      const leverId = policy[Bakery.stateIndex(s)];
      const out = Bakery.sample(s, leverId, rng);
      steps.push({
        unitsBefore: s.units, tierBefore: s.tier,
        lever: leverId, reward: out.reward,
        sold: !!out.log.sold, aged: !!out.log.aged, dumped: !!out.log.dumped,
        terminal: out.terminal, cleared: !!(out.sNext.cleared), spoiled: !!(out.sNext.spoiled),
        unitsAfter: out.sNext.terminal ? 0 : out.sNext.units,
        tierAfter: out.sNext.terminal ? null : out.sNext.tier,
      });
      s = out.sNext;
    }
    const last = steps[steps.length - 1];
    const cleared = !!(last && last.cleared);
    const ages = steps.filter(x => x.aged).length;
    if (cleared === wantCleared && steps.length >= 4 && steps.length <= 9 && ages >= 1) {
      return { seedUsed: seed + attempt, u0, t0: t0Tier, cleared, len: steps.length, steps };
    }
  }
  const rng = Bakery.makeRng(seed);
  let s = Bakery.makeState(u0, t0Tier); const steps = []; let guard = 0;
  while (!s.terminal && guard++ < 60) {
    const leverId = policy[Bakery.stateIndex(s)];
    const out = Bakery.sample(s, leverId, rng);
    steps.push({ unitsBefore: s.units, tierBefore: s.tier, lever: leverId, reward: out.reward,
      sold: !!out.log.sold, aged: !!out.log.aged, dumped: !!out.log.dumped, terminal: out.terminal,
      cleared: !!(out.sNext.cleared), spoiled: !!(out.sNext.spoiled),
      unitsAfter: out.sNext.terminal ? 0 : out.sNext.units, tierAfter: out.sNext.terminal ? null : out.sNext.tier });
    s = out.sNext;
  }
  const last = steps[steps.length - 1];
  return { seedUsed: seed, u0, t0: t0Tier, cleared: !!(last && last.cleared), len: steps.length, steps };
}
const demoTrajectory = buildDemoTrajectory(3, 3, 'FRESH', true);
console.log('');
console.log('Demo trajectory (optimal policy from 3x FRESH, seed ' + demoTrajectory.seedUsed + '): ' +
            demoTrajectory.len + ' hours, ' + (demoTrajectory.cleared ? 'CLEARED' : 'SPOILED'));

/* ---------------- Return-distribution bars for the Return scene ----------------
   Fix the (2,FRESH) start and one chosen FIRST lever, then play OPTIMALLY after,
   and Monte-Carlo the discounted return. The MEAN must equal Q*(2,FRESH,lever).
   We bin the outcomes into a small histogram for the visual. */
function returnDistFor(u0, t0Tier, firstLever, trials, seed) {
  const rng = Bakery.makeRng(seed);
  const outs = [];
  let sum = 0, sumSq = 0, mn = Infinity, mx = -Infinity;
  for (let e = 0; e < trials; e++) {
    let s = Bakery.makeState(u0, t0Tier);
    let first = true, guard = 0, g = 0, disc = 1;
    while (!s.terminal && guard++ < 60) {
      const leverId = first ? firstLever : policy[Bakery.stateIndex(s)];
      first = false;
      const out = Bakery.sample(s, leverId, rng);
      g += disc * out.reward; disc *= GAMMA;
      s = out.sNext;
    }
    outs.push(g); sum += g; sumSq += g * g; if (g < mn) mn = g; if (g > mx) mx = g;
  }
  const mean = sum / trials;
  const sd = Math.sqrt(Math.max(0, sumSq / trials - mean * mean));
  /* histogram: 24 bins across a fixed [-7, 9] range so all three levers share an axis */
  const LO = -7, HI = 9, BINS = 32;
  const hist = new Array(BINS).fill(0);
  for (const g of outs) {
    let b = Math.floor((g - LO) / (HI - LO) * BINS);
    b = Math.max(0, Math.min(BINS - 1, b));
    hist[b]++;
  }
  return {
    firstLever, trials,
    exactQ: Number(qRow(u0, t0Tier)[firstLever].toFixed(4)),
    mean: Number(mean.toFixed(4)), sd: Number(sd.toFixed(4)),
    min: Number(mn.toFixed(4)), max: Number(mx.toFixed(4)),
    histLo: LO, histHi: HI, hist,
  };
}
const returnDist = {
  u0: 2, t0: 'FRESH',
  hold:     returnDistFor(2, 'FRESH', 'HOLD', 20000, 101),
  discount: returnDistFor(2, 'FRESH', 'DISCOUNT', 20000, 202),
  dump:     returnDistFor(2, 'FRESH', 'DUMP', 20000, 303),
};
console.log('  return from (2,FRESH): HOLD mean ' + returnDist.hold.mean + ' sd ' + returnDist.hold.sd +
            ' (min ' + returnDist.hold.min + ') | DISCOUNT mean ' + returnDist.discount.mean + ' sd ' + returnDist.discount.sd +
            ' | DUMP mean ' + returnDist.dump.mean);
/* sanity: each forced-first-lever Monte-Carlo mean should match the exact Q* */
for (const k of ['hold', 'discount', 'dump']) {
  const rd = returnDist[k];
  if (Math.abs(rd.mean - rd.exactQ) > 0.08) {
    console.error('  [warn] return-dist mean for ' + k + ' (' + rd.mean + ') drifts from Q* (' + rd.exactQ + ')');
  }
}
assert('HOLD-first return spread is wider than DISCOUNT-first (the risk contrast)',
  returnDist.hold.sd > returnDist.discount.sd,
  'HOLD sd=' + returnDist.hold.sd + ' DISCOUNT sd=' + returnDist.discount.sd);
assert('HOLD-first mean return exceeds DISCOUNT-first (higher average, scarier downside)',
  returnDist.hold.mean > returnDist.discount.mean,
  'HOLD mean=' + returnDist.hold.mean + ' DISCOUNT mean=' + returnDist.discount.mean);

/* ---------------- The named spot-Q rows the Q* scene tours ---------------- */
function spotRow(u, t) {
  const r = qRow(u, t);
  const obj = {};
  for (const id of LEVER_IDS) obj[id] = Number(r[id].toFixed(4));
  return { units: u, tier: t, q: obj, best: bestLever(u, t), v: Number(vAt(u, t).toFixed(4)) };
}
/* the tour marches down the age axis: FRESH/OK -> HOLD, AGING/OLD -> DISCOUNT,
   STALE -> DUMP. (2,FRESH), (2,AGING), (2,OLD), (1,STALE) tell the whole story. */
const spotTour = [spotRow(2, 'FRESH'), spotRow(2, 'AGING'), spotRow(2, 'OLD'), spotRow(1, 'STALE')];

/* ---------------- gamma contrast for the risk note ----------------
   The clean HOLD->DISCOUNT->DUMP flip lives around gamma=0.75. Show the board at
   a very patient gamma (0.97): the DISCOUNT band shrinks toward HOLD. */
function boardAtGamma(g) {
  const r = Bellman.valueIteration(g, { tol: 1e-12, maxIters: 1000, recordHistory: false });
  const b = {};
  for (const t of TIERS) b[t] = UNITS.map(u => r.policy[sIdx(u, t)]);
  return b;
}
const patientBoard = boardAtGamma(0.97);
console.log('  contrast: optimal board at gamma=0.97 (very patient):');
for (const t of TIERS) console.log('    ' + t.padEnd(5) + ' ' + patientBoard[t].map(x => x.padEnd(9)).join(' '));
/* count DISCOUNT cells at 0.75 vs 0.97 -- the patient board should have fewer */
function countLever(board, lev) { let n = 0; for (const t of TIERS) for (const x of board[t]) if (x === lev) n++; return n; }
const discAtBase = (function () { const b = {}; for (const t of TIERS) b[t] = UNITS.map(u => bestLever(u, t)); return countLever(b, 'DISCOUNT'); })();
const discAtPatient = countLever(patientBoard, 'DISCOUNT');
assert('a very patient gamma (0.97) shrinks the DISCOUNT band (gamma does real work)',
  discAtPatient < discAtBase, 'DISCOUNT cells: gamma0.75=' + discAtBase + ' gamma0.97=' + discAtPatient);

/* ---------------- Recap cards (bakery voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is your SHELF (how many units, how fresh). The lever is your move (HOLD / DISCOUNT / DUMP). The part you do not control is whether the next customer BUYS. The payoff is the till change, summed to closing.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', scene: 4, title: 'YOUR MARKDOWN PLAYBOOK',
    text: 'A policy assigns one lever to EVERY shelf state, the SOP your whole team could run without you. When you ran the shop by gut you already were a policy; you just had not written it down.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', scene: 6, title: 'A SPREAD, NOT A POINT',
    text: 'The return is the day\'s till, later money discounted. One lever does not give one payoff -- it gives a DISTRIBUTION. HOLD has the higher average and the scary downside; judge a strategy by its long-run average, not one lucky afternoon.',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i}\\, \\gamma^{\\,j-i}\\, r_j' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'THE HONEST SCORECARD',
    text: 'Q*(s, a) is the true long-run value of pulling lever a in situation s, assuming you play smart afterward. The best lever is the star, and it MARCHES down the age axis: HOLD while fresh, DISCOUNT once aging, DUMP when stale.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT PLAYBOOK FROM A KNOWN MODEL',
    text: 'With the buy-meter posted, Q* solves its own Bellman equation: a lever\'s value is what it pays this hour plus the value of where it leaves you. Sweep the backup and the case fills band by band -- green cap, amber middle, red floor.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'SARSA', scene: 11, title: 'LEARN THE PLAYBOOK BY PLAYING',
    text: 'No posted odds? Replace the expectation with one real day on the floor: nudge a lever\'s score toward (what you saw + the score of the lever you played next). Explore a little, keep score, and the same green/amber/red playbook emerges from experience.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + \\gamma\\, q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Levers for display ---------------- */
const leversDisplay = Levers.LEVERS.map(l => ({ id: l.id, name: l.name, role: l.role, sale: l.sale }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

const DATA = {
  gamma: GAMMA,
  tiers: TIERS.slice(),
  units: UNITS.slice(),
  leverIds: LEVER_IDS.slice(),
  levers: leversDisplay,
  pbuy: Bakery.PBUY,
  rewards: { holdSale: 5, discountSale: 2, dump: -3, spoiled: -6, cleared: 0 },
  dims: { rows: Bakery.ROWS, cols: Bakery.COLS, N: N, A: A },

  policy: policy.slice(),                          // 15 lever-id strings, stateIndex order
  V: roundArr(V, 4),                               // 15 values
  Qstar: roundArr(Qstar, 4),                       // 15*A, [stateIndex*A + leverIdx]

  recap: recap,
  demoTrajectory: demoTrajectory,
  returnDist: returnDist,
  spotTour: spotTour,
  patientBoard: patientBoard,

  /* hand-computable edge backup shown in the Bellman scene */
  handBackup: {
    state: '1,STALE', lever: 'DUMP',
    expr: '-3 + 0.75 * V(1,FRESH)',
    vFresh1: Number(vFresh1.toFixed(4)),
    value: Number(dumpBackup.toFixed(4)),
    matchesQ: Number(qRow(1, 'STALE').DUMP.toFixed(4)),
    /* also the cliff comparison the proposal calls out */
    holdQ: Number(qRow(1, 'STALE').HOLD.toFixed(4)),
    discountQ: Number(qRow(1, 'STALE').DISCOUNT.toFixed(4)),
  },

  /* value-iteration fill, frame by frame, for the DP scene */
  valueIteration: {
    gamma: GAMMA,
    iters: vi.iters,
    sweepsToStable: sweepsToStable,
    snapshots: sweepSnapshots,                     // [{sweep, V[15], Q[15*A], solved[15]}]
  },

  /* model-free learners for scene 11: the GLIE headline (converges to Q*) + the
     constant-eps cautious contrast, each with snapshots + an agreement curve. */
  learners: {
    dpReturnFrom3Fresh: Number(vAt(3, 'FRESH').toFixed(4)),
    glie: {
      kind: 'sarsa-glie', onPolicy: true,
      config: SARSA_GLIE,
      finalBoard: glieSum.board,
      finalAgreed: glieSum.agreed,
      snapshots: glie.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
      agreeCurve: glie.agreeCurve,
      finalReturn: Number(glieFinalRet.toFixed(4)),
    },
    constEps: {
      kind: 'sarsa-const', onPolicy: true,
      config: SARSA_CONST,
      finalBoard: cstSum.board,
      finalAgreed: cstSum.agreed,
      diffs: cstSum.diffs,
      snapshots: cst.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
      agreeCurve: cst.agreeCurve,
    },
  },

  /* KaTeX strings shared across scenes */
  tex: {
    state:      's \\;=\\; (\\text{units},\\ \\text{freshness})',
    actions:    'a \\in A = \\{\\, \\text{HOLD},\\; \\text{DISCOUNT},\\; \\text{DUMP} \\,\\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a)',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i}\\, \\gamma^{\\,j-i}\\, r_j',
    qstar:      'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:    'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\gamma\\, \\max_{a\'} Q^{*}(S\',a\') \\,]',
    sarsa:      'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + \\gamma\\, q[s\',a\'] - q[s,a] \\,\\bigr)',
    gammaDef:   '\\gamma \\;=\\; 0.75',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Stale by Sundown -- static MDP solution plus value-iteration fill frames\n" +
  " * and on-policy SARSA training trajectories.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * loads the verified engine (js/levers.js + js/bakery.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS the converged policy board (HOLD cap / DISCOUNT\n" +
  " * middle / DUMP floor) EXACTLY, the three hand-checkable Q* intuitions, the\n" +
  " * (1,STALE) DUMP backup, the no-tie + age-dominates structure, and that GLIE\n" +
  " * on-policy SARSA recovers all 15 cells (robust across seeds). If any\n" +
  " * assertion fails, this file is NOT written.\n" +
  " *\n" +
  " * Qstar is indexed [stateIndex*A + leverIdx], stateIndex = (units-1)*5 +\n" +
  " * tierIndex, leverIdx over [HOLD, DISCOUNT, DUMP].\n" +
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

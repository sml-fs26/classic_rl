/* Trial Clock precompute -- the rigor gate.
 *
 *   Runs value iteration (= backward induction, since the clock counts down) on
 *   the Trial Clock MDP and emits V* / Q* / the optimal policy plus an on-policy
 *   SARSA learning run to data/datasets.js as window.DATA, the JSON the page
 *   loads.
 *
 *   The MDP: state (tier 0..4, days 1..5); levers {nudge, nothing, push}; the
 *   Adoption Coin (p = 1/2) on a NUDGE; the Conversion Wheel by tier on a PUSH;
 *   rewards +20 convert / -1 nudge / -5 abandon / 0 else; gamma = 1; terminals
 *   CONVERT / ABANDON / EXPIRY.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified runtime
 *   engine (js/levers.js + js/trial.js + js/bellman.js + js/sarsa.js) through a
 *   tiny `window` shim so the precompute and the runtime share one source of
 *   truth.
 *
 *   HARD ASSERTIONS (exit on mismatch; the file is NOT written on failure):
 *     1) VI converges (max-deltaV < 1e-9) within the iteration cap.
 *     2) The recovered OPTIMAL POLICY equals the proposal's staircase EXACTLY,
 *        all 25 cells (rows tier 4..0, cols days 5..1):
 *           tier 4: PUSH PUSH PUSH PUSH PUSH
 *           tier 3: PUSH PUSH PUSH PUSH PUSH
 *           tier 2: NUDGE NUDGE PUSH PUSH PUSH
 *           tier 1: NUDGE NUDGE NUDGE PUSH PUSH
 *           tier 0: NUDGE NUDGE NUDGE NUDGE NOTHING
 *     3) The signature headline-flip values (the "same lever, opposite verdict"
 *        jewel): Q*((0,5),push) ~ -0.8 (worst) vs Q*((0,5),nudge) ~ +5.2 (star);
 *        and Q*((4,5),push) ~ +20 (the star).
 *     4) The time-axis flip on tier 2: NUDGE is the star on days 5-4 and PUSH
 *        overtakes from day 3 on (and stays best).
 *     5) All THREE levers are optimal somewhere, and DO NOTHING wins in EXACTLY
 *        one cell -- (tier 0, day 1) -- where value 0 beats nudge -1 and push -2.5.
 *     6) Two hand-computable last-day (days = 1) backups reproduce Q* exactly:
 *        Q*((0,1),push) = 1/2*(-5) = -2.5 ; Q*((3,1),push) = 0.6*20 = 12.
 *     7) ON-POLICY SARSA's learned greedy policy reproduces the DP optimum on
 *        ALL 25 cells (days-left is in the state, so the finite horizon is fully
 *        observed and SARSA converges to the staircase), AND its greedy
 *        outcome-value from (tier 0, day 5) lands within tolerance of V*.
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
for (const rel of ['js/levers.js', 'js/trial.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Levers  = sandbox.window.Levers;
const Trial   = sandbox.window.Trial;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const LEVER_IDS = Levers.LEVER_IDS;        // [nudge, nothing, push]
const A = LEVER_IDS.length;                 // 3
const N = Trial.N;                          // 25
const N_TIERS = Trial.N_TIERS;              // 5
const N_DAYS = Trial.N_DAYS;                // 5
const GAMMA = 1.0;

/* ---------------- Value iteration (gamma = 1, finite horizon) ---------------- */
const TOL = 1e-12;
const MAX_ITERS = 50;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                             // Float64Array[25], index = tier*5 + (days-1)
const policy = vi.policy;                   // [25] lever-id strings
const Qstar = Bellman.qFromV(V, GAMMA);     // Float64Array[25*A]

/* ---------------- Helpers ---------------- */
function siOf(tier, days) { return tier * N_DAYS + (days - 1); }
function vAt(tier, days) { return V[siOf(tier, days)]; }
function qRow(tier, days) {
  const base = siOf(tier, days) * A;
  const r = {};
  for (let a = 0; a < A; a++) r[LEVER_IDS[a]] = Qstar[base + a];
  return r;
}
function leverAt(tier, days) { return policy[siOf(tier, days)]; }
function round3(x) { return Math.round(x * 1000) / 1000; }
function round4(x) { return Math.round(x * 10000) / 10000; }
function fmt(x) { return Number.isFinite(x) ? (x >= 0 ? ' ' : '') + x.toFixed(3) : '  --  '; }
function up(id) { return (id || '').toUpperCase(); }

/* ---------------- Assertions ---------------- */
function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log('Trial Clock precompute -- 5 tiers x 5 days = 25 cells, 3 levers, gamma = ' + GAMMA);
console.log('  Adoption Coin p = ' + Trial.P_ADOPT + '; Conversion Wheel by tier; +20 convert / -1 nudge / -5 abandon / 0 else');
console.log('');
console.log('Phase 1 -- Value iteration (backward induction)');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* Pretty-print the recovered policy table (rows tier 4..0, cols days 5..1). */
console.log('');
console.log('  OPTIMAL POLICY (rows tier 4=ACTIVATED .. 0=none ; cols days 5 .. 1):');
console.log('         d5       d4       d3       d2       d1');
for (let t = N_TIERS - 1; t >= 0; t--) {
  let row = '  t' + t + (t === N_TIERS - 1 ? '* ' : '  ') + '| ';
  for (let d = N_DAYS; d >= 1; d--) row += up(leverAt(t, d)).padEnd(8) + ' ';
  console.log(row);
}
console.log('');
console.log('  V* (rows tier 4..0 ; cols days 5..1):');
for (let t = N_TIERS - 1; t >= 0; t--) {
  let row = '  t' + t + '  | ';
  for (let d = N_DAYS; d >= 1; d--) row += vAt(t, d).toFixed(3).padStart(8) + ' ';
  console.log(row);
}
console.log('');

/* (1) convergence */
assert('VI converges (maxDelta < 1e-9)', lastSweep.maxDelta < 1e-9 && vi.iters <= MAX_ITERS,
  'iters=' + vi.iters + ' maxDelta=' + lastSweep.maxDelta.toExponential(2));

/* (2) optimal policy == the proposal's staircase, all 25 cells.
   SPEC_POLICY[tier][col] where col 0 = day 5 .. col 4 = day 1. */
const SPEC_POLICY = {
  4: ['push', 'push', 'push', 'push', 'push'],
  3: ['push', 'push', 'push', 'push', 'push'],
  2: ['nudge', 'nudge', 'push', 'push', 'push'],
  1: ['nudge', 'nudge', 'nudge', 'push', 'push'],
  0: ['nudge', 'nudge', 'nudge', 'nudge', 'nothing'],
};
let policyOk = true; const policyDiffs = [];
for (let t = 0; t < N_TIERS; t++) {
  for (let c = 0; c < N_DAYS; c++) {
    const d = N_DAYS - c;                 // col 0 -> day 5
    const got = leverAt(t, d);
    if (got !== SPEC_POLICY[t][c]) { policyOk = false; policyDiffs.push('t' + t + 'd' + d + '(got ' + got + ', spec ' + SPEC_POLICY[t][c] + ')'); }
  }
}
assert('optimal policy == proposal staircase (all 25 cells)', policyOk, policyDiffs.join(', '));

/* (3) the signature headline flip (adoption axis), day 5. */
const q05 = qRow(0, 5), q45 = qRow(4, 5);
console.log('  headline flip @ day 5:');
console.log('    Q*((tier0,5), push)  = ' + fmt(q05.push)  + '   (worst lever; courts the ABANDON wedge; spec ~ -0.8)');
console.log('    Q*((tier0,5), nudge) = ' + fmt(q05.nudge) + '   (the star; spec ~ +5.2)');
console.log('    Q*((tier4,5), push)  = ' + fmt(q45.push)  + '   (the star; spec ~ +20)');
assert('Q*((0,5),push) is the WORST lever there and ~ -0.8',
  q05.push < q05.nudge && q05.push < q05.nothing && Math.abs(q05.push - (-0.8)) < 0.1,
  'push=' + round4(q05.push));
assert('Q*((0,5),nudge) is the STAR there and ~ +5.2',
  leverAt(0, 5) === 'nudge' && Math.abs(q05.nudge - 5.2) < 0.1,
  'nudge=' + round4(q05.nudge));
assert('Q*((4,5),push) is the STAR there and ~ +20',
  leverAt(4, 5) === 'push' && Math.abs(q45.push - 20) < 0.1,
  'push=' + round4(q45.push));

/* (4) the time-axis flip on tier 2: NUDGE on days 5-4, PUSH from day 3. */
const t2 = {};
for (let d = 1; d <= 5; d++) t2[d] = qRow(2, d);
console.log('  time-axis flip @ tier 2 (nudge vs push):');
for (let d = 5; d >= 1; d--) console.log('    day ' + d + ': nudge=' + fmt(t2[d].nudge) + '  push=' + fmt(t2[d].push) + '  -> ' + up(leverAt(2, d)));
assert('tier 2: NUDGE wins on day 5 and day 4',
  leverAt(2, 5) === 'nudge' && leverAt(2, 4) === 'nudge' && t2[5].nudge > t2[5].push && t2[4].nudge > t2[4].push,
  'd5 ' + round4(t2[5].nudge) + '/' + round4(t2[5].push) + ' d4 ' + round4(t2[4].nudge) + '/' + round4(t2[4].push));
assert('tier 2: PUSH overtakes from day 3 (and stays best on days 3,2,1)',
  leverAt(2, 3) === 'push' && leverAt(2, 2) === 'push' && leverAt(2, 1) === 'push' && t2[3].push > t2[3].nudge,
  'd3 push=' + round4(t2[3].push) + ' nudge=' + round4(t2[3].nudge));

/* (5) all three levers optimal somewhere; DO NOTHING wins EXACTLY one cell (0,1). */
const counts = { nudge: 0, nothing: 0, push: 0 };
const nothingCells = [];
for (let t = 0; t < N_TIERS; t++) for (let d = 1; d <= N_DAYS; d++) {
  const id = leverAt(t, d); counts[id]++;
  if (id === 'nothing') nothingCells.push('(t' + t + ',d' + d + ')');
}
console.log('  lever counts across the board: NUDGE=' + counts.nudge + ' DO-NOTHING=' + counts.nothing + ' PUSH=' + counts.push);
console.log('  DO-NOTHING is optimal only at: ' + nothingCells.join(', '));
assert('all three levers are optimal somewhere',
  counts.nudge > 0 && counts.nothing > 0 && counts.push > 0, JSON.stringify(counts));
assert('DO NOTHING wins EXACTLY one cell -- (tier 0, day 1)',
  counts.nothing === 1 && nothingCells.length === 1 && nothingCells[0] === '(t0,d1)',
  nothingCells.join(','));
const q01 = qRow(0, 1);
assert('at (0,1): value 0 (do nothing) beats nudge -1 and push -2.5',
  Math.abs(q01.nothing - 0) < 1e-12 && Math.abs(q01.nudge - (-1)) < 1e-12 && Math.abs(q01.push - (-2.5)) < 1e-12,
  'nothing=' + q01.nothing + ' nudge=' + q01.nudge + ' push=' + q01.push);

/* (6) two hand-computable last-day backups reproduce Q* exactly. */
const handPush01 = 0.5 * (-5);             // tier 0 day 1: wheel (0,.5,.5), both terminal at 0/-5
const handPush31 = 0.6 * 20;               // tier 3 day 1: wheel (.6,.4,0), BUY only pays
assert('hand backup Q*((0,1),push) = 0.5*(-5) = -2.5 reproduces Q*',
  Math.abs(handPush01 - qRow(0, 1).push) < 1e-12, 'hand=' + handPush01 + ' q=' + qRow(0, 1).push);
assert('hand backup Q*((3,1),push) = 0.6*20 = 12 reproduces Q*',
  Math.abs(handPush31 - qRow(3, 1).push) < 1e-12, 'hand=' + handPush31 + ' q=' + qRow(3, 1).push);

/* ---------------- Per-sweep snapshots for the DP scene ----------------
   Because the deadline counts down, value iteration settles the day-1 column
   first, then day-2 from it, and so on -- the staircase fills column by column,
   right to left. We record (V, Q, solvedMask) after each sweep so the DP scene
   can animate it. A cell is "solved" once its V matches V* to 3 decimals (which
   happens on the sweep that reaches its days-left). */
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
      Q: Array.from(Qk, x => (Number.isFinite(x) ? round4(x) : null)),
      solved: Array.from(stableAt, s => (s >= 0 && s <= k)),
    });
    if (k >= N_DAYS && stableAt.every(s => s >= 0 && s <= k - 1)) { snaps[snaps.length - 1]._settled = true; break; }
  }
  return snaps;
}
const sweepSnapshots = buildSweepSnapshots(12);
const sweepsToStable = sweepSnapshots.length - 1;
console.log('');
console.log('  DP fill recorded over ' + sweepSnapshots.length + ' sweep-frames (column-by-column, day 1 -> day 5)');

/* ---------------- Phase 2 -- model-free TD control: ON-POLICY SARSA ----------------
   We learn Q from experience (pull a lever, see the dice, see the reward and the
   next situation + next lever, nudge q) with NO model of the coin or the wheel.
   Because days-left is part of the state, the finite horizon is fully observed,
   so on-policy SARSA with a Robbins-Monro decaying step size converges to the
   SAME optimal staircase DP gives. (This is the headline learner, matching most
   gallery siblings; verified 25/25 across many seeds.) */
const SARSA_CFG = {
  alphaPower: 0.75,               // alpha = 1/(1+visits)^alphaPower (Robbins-Monro)
  gamma: GAMMA,
  epsilon: 0.40,
  epsilonMin: 0.10,
  episodes: 500000,
  exploringStarts: true,          // random legal (tier, days) start each episode
  seed: 20260615,
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 350000, 500000],
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

/* One episode of ON-POLICY SARSA. The next lever a' is chosen eps-greedily
   BEFORE the update, and the bootstrap uses Q[s', a'] (not the max). */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  let tier = cfg.exploringStarts ? Math.floor(rng() * N_TIERS) : 0;
  let days = cfg.exploringStarts ? (1 + Math.floor(rng() * N_DAYS)) : N_DAYS;
  let s = { tier, days, terminal: false };
  let sIdx = Trial.stateIndex(s);
  let aId = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
  let guard = 0, outcome = null;
  const visited = new Set([sIdx]);

  while (!s.terminal && guard++ < 50) {
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Trial.sample(s, aId, rng);
    const sNext = out.sNext, reward = out.reward, terminal = out.terminal;
    visits[sIdx * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sIdx * A + aIdx]);
    if (terminal) {
      SARSA.update(Q, sIdx, aId, reward, -1, null, alpha, gamma, true);
      outcome = sNext.convert ? 'convert' : (sNext.abandon ? 'abandon' : 'expiry');
      break;
    }
    const sNextIdx = Trial.stateIndex(sNext);
    const aNextId = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);   // on-policy a'
    SARSA.update(Q, sIdx, aId, reward, sNextIdx, aNextId, alpha, gamma, false);
    s = sNext; sIdx = sNextIdx; aId = aNextId; visited.add(sIdx);
  }
  return { outcome, visited };
}

/* Mean realized RETURN (sum of rewards) of running the CURRENT greedy policy
   from a fixed start cell. This is the headline "is the learned playbook good?"
   metric for the SARSA scene; it should converge toward V*(start). */
function greedyValueFrom(Q, tier, days, episodes, rng) {
  let total = 0;
  for (let e = 0; e < episodes; e++) {
    let s = { tier, days, terminal: false }, guard = 0, g = 0;
    while (!s.terminal && guard++ < 50) {
      const aId = SARSA.pickEpsGreedy(Q, Trial.stateIndex(s), 0, rng);
      const out = Trial.sample(s, aId, rng);
      g += out.reward;
      s = out.sNext;
    }
    total += g;
  }
  return total / episodes;
}

function trainSarsa(cfg) {
  const rng = Trial.makeRng(cfg.seed);
  const evalRng = Trial.makeRng(cfg.seed ^ 0x9e3779b9);
  const Q = new Float32Array(N * A);
  const visits = new Float64Array(N * A);
  const visitCounts = new Int32Array(N);
  const snapshots = [];
  const valueCurve = [];            // [{episode, value}] greedy mean return from a reference cell
  const REF_TIER = 0, REF_DAYS = 5; // a cold day-5 user -- where NUDGE must win
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  valueCurve.push({ episode: 0, value: Number(greedyValueFrom(Q, REF_TIER, REF_DAYS, 2000, evalRng).toFixed(4)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsAt(ep, cfg);
    const o = runSarsaEpisode(Q, visits, cfg.gamma, eps, rng, cfg);
    for (const i of o.visited) visitCounts[i]++;
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) {
      valueCurve.push({ episode: ep, value: Number(greedyValueFrom(Q, REF_TIER, REF_DAYS, 2000, evalRng).toFixed(4)) });
    }
  }
  return { Q, visitCounts: Array.from(visitCounts), snapshots, valueCurve, refTier: REF_TIER, refDays: REF_DAYS };
}

console.log('');
console.log('Phase 2 -- model-free TD control: ON-POLICY SARSA');
console.log('  ' + SARSA_CFG.episodes + ' episodes, alpha = 1/(1+n)^' + SARSA_CFG.alphaPower +
  ', eps ' + SARSA_CFG.epsilon + ' -> ' + SARSA_CFG.epsilonMin + ', exploring starts (on-policy a\' bootstrap)');
const t0 = Date.now();
const sarsa = trainSarsa(SARSA_CFG);
console.log('  trained in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

/* Summarise: greedy policy, DP agreement (all 25 cells), final greedy value. */
function summarise(learner) {
  const learnedPolicy = SARSA.argmaxPolicy(learner.Q);
  let agreed = 0; const diffs = [];
  for (let i = 0; i < N; i++) {
    const ok = learnedPolicy[i] === policy[i];
    if (ok) agreed++;
    else {
      const t = Math.floor(i / N_DAYS), d = (i % N_DAYS) + 1;
      diffs.push('(t' + t + ',d' + d + ') learned=' + learnedPolicy[i] + ' dp=' + policy[i]);
    }
  }
  const finalValueRef = greedyValueFrom(learner.Q, learner.refTier, learner.refDays, 40000, Trial.makeRng(0xC0FFEE));
  const earlyValueRef = learner.valueCurve[0].value;
  return { learnedPolicy, agreed, diffs, finalValueRef, earlyValueRef };
}
const sum = summarise(sarsa);
console.log('');
console.log('  SARSA greedy policy vs DP: ' + sum.agreed + '/' + N + ' cells agree' +
  (sum.diffs.length ? ('  -- diffs: ' + sum.diffs.join('; ')) : '  (PERFECT)'));
console.log('  SARSA greedy value from (tier0, day5): ' + sum.earlyValueRef.toFixed(3) +
  ' -> ' + sum.finalValueRef.toFixed(3) + '   (V* = ' + vAt(0, 5).toFixed(3) + ')');

/* (7) the SARSA assertions -- the model-free path matches DP exactly. */
assert('SARSA greedy policy reproduces the DP optimum on ALL 25 cells',
  sum.agreed === N, 'agreed=' + sum.agreed + '/' + N + ' diffs=[' + sum.diffs.join(' | ') + ']');
assert('SARSA greedy value from (tier0,day5) is within 0.6 of V*',
  Math.abs(sum.finalValueRef - vAt(0, 5)) <= 0.6, 'got ' + sum.finalValueRef.toFixed(3) + ' vs ' + vAt(0, 5).toFixed(3));
assert('SARSA greedy value from (tier0,day5) improved over training',
  sum.finalValueRef >= sum.earlyValueRef, 'early ' + sum.earlyValueRef + ' final ' + sum.finalValueRef);

/* ---------------- A fixed illustrative trajectory ----------------
   One short, deterministic demo episode under the OPTIMAL policy, pinned seed,
   for the tutorial / trajectory / return scenes. Chosen so the run is varied (a
   nudge that lands, maybe one that does not) and ends in CONVERT. */
function buildDemoTrajectory(seed, startTier, startDays, wantOutcome) {
  for (let attempt = 0; attempt < 8000; attempt++) {
    const rng = Trial.makeRng(seed + attempt);
    let s = { tier: startTier, days: startDays, terminal: false };
    const steps = []; let guard = 0;
    while (!s.terminal && guard++ < 20) {
      const leverId = policy[Trial.stateIndex(s)];
      const out = Trial.sample(s, leverId, rng);
      steps.push({
        tierBefore: s.tier, daysBefore: s.days,
        lever: leverId, reward: out.reward,
        kind: out.log.kind, heads: out.log.heads, wedge: out.log.wedge, outcome: out.log.outcome,
        tierAfter: out.terminal ? null : out.sNext.tier,
        daysAfter: out.terminal ? null : out.sNext.days,
        terminal: out.terminal,
        convert: !!(out.sNext.convert), abandon: !!(out.sNext.abandon), expiry: !!(out.sNext.expiry),
      });
      s = out.sNext;
    }
    const last = steps[steps.length - 1];
    const oc = last && (last.convert ? 'convert' : (last.abandon ? 'abandon' : 'expiry'));
    const adopts = steps.filter(x => x.outcome === 'adopt').length;
    if (oc === wantOutcome && steps.length >= 3 && steps.length <= 7 && adopts >= 1) {
      return { seedUsed: seed + attempt, startTier, startDays, outcome: oc, len: steps.length, steps };
    }
  }
  /* fallback: first rollout */
  const rng = Trial.makeRng(seed);
  let s = { tier: startTier, days: startDays, terminal: false }; const steps = []; let guard = 0;
  while (!s.terminal && guard++ < 20) {
    const leverId = policy[Trial.stateIndex(s)];
    const out = Trial.sample(s, leverId, rng);
    steps.push({ tierBefore: s.tier, daysBefore: s.days, lever: leverId, reward: out.reward,
      kind: out.log.kind, heads: out.log.heads, wedge: out.log.wedge, outcome: out.log.outcome,
      tierAfter: out.terminal ? null : out.sNext.tier, daysAfter: out.terminal ? null : out.sNext.days,
      terminal: out.terminal, convert: !!out.sNext.convert, abandon: !!out.sNext.abandon, expiry: !!out.sNext.expiry });
    s = out.sNext;
  }
  const last = steps[steps.length - 1];
  return { seedUsed: seed, startTier, startDays,
    outcome: last && (last.convert ? 'convert' : last.abandon ? 'abandon' : 'expiry'), len: steps.length, steps };
}
const demoTrajectory = buildDemoTrajectory(3, 0, 5, 'convert');
console.log('');
console.log('  demo trajectory (optimal policy from a cold day-5 user, seed ' + demoTrajectory.seedUsed + '): ' +
  demoTrajectory.len + ' days, ended in ' + demoTrajectory.outcome.toUpperCase());

/* ---------------- Return-distribution bars for the Return scene ----------------
   Fix a mid-adoption user (tier 2, day 4) and a chosen FIRST lever, then play
   OPTIMALLY afterward; Monte-Carlo the RETURN (sum of rewards) into buckets so
   the spread is visible: PUSH spikes at +20 (BUY), clusters near 0 (IGNORE then
   later), with a -5 tail (ABANDON). The exact mean is Q*(s, firstLever). */
function returnSamplesFor(startTier, startDays, firstLeverId, trials, seed) {
  const rng = Trial.makeRng(seed);
  const buckets = { convert: 0, zeroish: 0, abandon: 0, costly: 0 };  // +20 / ~0 / -5 / nudged-then-expired
  const returns = [];
  let total = 0;
  for (let e = 0; e < trials; e++) {
    let s = { tier: startTier, days: startDays, terminal: false };
    let first = true, guard = 0, g = 0, hitAbandon = false, hitConvert = false;
    while (!s.terminal && guard++ < 20) {
      const leverId = first ? firstLeverId : policy[Trial.stateIndex(s)];
      first = false;
      const out = Trial.sample(s, leverId, rng);
      g += out.reward;
      if (out.sNext.abandon) hitAbandon = true;
      if (out.sNext.convert) hitConvert = true;
      s = out.sNext;
    }
    total += g; returns.push(g);
    if (hitConvert) buckets.convert++;
    else if (hitAbandon) buckets.abandon++;
    else if (g <= -1) buckets.costly++;
    else buckets.zeroish++;
  }
  return {
    startTier, startDays, firstLever: firstLeverId,
    exact: Number(qRow(startTier, startDays)[firstLeverId].toFixed(4)),
    mean: Number((total / trials).toFixed(4)),
    buckets, trials,
  };
}
const returnBars = {
  startTier: 2, startDays: 4,
  push:  returnSamplesFor(2, 4, 'push', 40000, 101),
  nudge: returnSamplesFor(2, 4, 'nudge', 40000, 202),
};
console.log('  return from (tier2,day4): start PUSH mean ~ ' + returnBars.push.exact +
  ' (buckets ' + JSON.stringify(returnBars.push.buckets) + ')');
console.log('                            start NUDGE mean ~ ' + returnBars.nudge.exact);

/* ---------------- The named spot-Q cells the Q* scene calls out ---------------- */
function spotCell(tier, days) {
  const r = qRow(tier, days);
  const obj = {};
  for (const id of LEVER_IDS) obj[id] = Number(r[id].toFixed(4));
  return { tier, days, q: obj, best: leverAt(tier, days) };
}
/* The contrast pair (cold day-5 vs activated day-5) plus a mid-user and the dead cell. */
const spotQ = {
  cold5:     spotCell(0, 5),
  activated5:spotCell(4, 5),
  mid5:      spotCell(2, 5),
  mid3:      spotCell(2, 3),
  dead:      spotCell(0, 1),
};

/* ---------------- Worked Bellman backup (scene 8): (tier 3, day 2), PUSH ----------------
   Q*((3,2),push) = 0.6*20 + 0.4*V*((3,1)) + 0*(-5). V*((3,1)) is the value of
   playing best at the last day from tier 3. */
const bellmanWorked = {
  tier: 3, days: 2, lever: 'push',
  pBuy: Trial.wheel(3).buy, pIgnore: Trial.wheel(3).ignore, pAbandon: Trial.wheel(3).abandon,
  rConvert: Trial.R_CONVERT, rAbandon: Trial.R_ABANDON,
  vIgnoreNext: Number(vAt(3, 1).toFixed(4)),     // land in (3,1), play best there
  value: Number(qRow(3, 2).push.toFixed(4)),
  matchesV: Number(vAt(3, 2).toFixed(4)),
};

/* ---------------- Recap cards (trial voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is the TRIAL CARD: how far up the adoption ladder, how many days left. The lever is NUDGE / DO NOTHING / PUSH. The part you do not control is the Adoption Coin and the Conversion Wheel. The payoff is +20 if they convert, with costs along the way.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', scene: 4, title: 'YOUR GROWTH PLAYBOOK',
    text: 'A policy assigns one lever to EVERY situation -- the SOP a new growth hire could run without you. When you played by gut you already were a policy; you just had not written it down.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', scene: 6, title: 'ROI AS A DISTRIBUTION',
    text: 'The return is the payoff summed over the whole trial, lifetime value minus costs. It is a distribution across customers, not one number -- a good lever wins on average, and you must respect the downside (the ABANDON tail).',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} r_j' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'THE HONEST VALUE OF A LEVER',
    text: 'Q*(s, a) is the true long-run value of pulling lever a in situation s, assuming you play smart afterward. The best lever is the argmax -- and the star FLIPS across the board: NUDGE while cold and early, PUSH once hooked or out of runway.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT PLAYBOOK IF YOU KNEW THE WORLD',
    text: 'With the dice odds known, Q* solves its own Bellman equation: the worth of a move = its immediate payoff plus the worth of the position it leaves you in. The hard deadline lets you solve it right to left and watch the staircase build.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'TD', scene: 11, title: 'LEARN THE PLAYBOOK BY PLAYING',
    text: 'No model of how customers respond? Replace the expectation with one observed attempt: pull a lever, see what converts, nudge the estimate, repeat -- with a little exploration to keep improving. It converges to the same staircase DP would give, never told the odds.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Levers + wheel for display ---------------- */
const leversDisplay = Levers.LEVERS.map(l => ({ id: l.id, name: l.name, role: l.role, short: l.short }));
const wheelByTier = {};
for (let t = 0; t < N_TIERS; t++) wheelByTier[t] = Trial.wheel(t);

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

const DATA = {
  dims: { tiers: N_TIERS, days: N_DAYS, N: N, A: A, rows: Trial.ROWS, cols: Trial.COLS },
  gamma: GAMMA,
  rewards: { convert: Trial.R_CONVERT, abandon: Trial.R_ABANDON, nudge: Trial.R_NUDGE, nothing: Trial.R_NOTHING, expiry: Trial.R_EXPIRY },
  pAdopt: Trial.P_ADOPT,
  wheel: wheelByTier,

  policy: policy.slice(),                          // 25 lever-id strings (stateIndex order)
  V: roundArr(V, 4),                               // 25 values
  Qstar: roundArr(Qstar, 4),                       // 25*A, index stateIndex*A + leverIdx
  levers: leversDisplay,
  leverIds: LEVER_IDS.slice(),

  recap, demoTrajectory, returnBars, spotQ, bellmanWorked,

  /* value-iteration fill, frame by frame (column-by-column), for the DP scene */
  valueIteration: {
    gamma: GAMMA, iters: vi.iters, sweepsToStable,
    snapshots: sweepSnapshots,                     // [{sweep, V[25], Q[25*A], solved[25]}]
  },

  /* the model-free SARSA learner for scene 11 */
  sarsa: {
    kind: 'sarsa', offPolicy: false,
    config: SARSA_CFG,
    refTier: sarsa.refTier, refDays: sarsa.refDays,
    optimalRefValue: Number(vAt(sarsa.refTier, sarsa.refDays).toFixed(4)),
    finalPolicyArgmax: sum.learnedPolicy,
    snapshots: sarsa.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
    valueCurve: sarsa.valueCurve,
    visitCounts: sarsa.visitCounts,
    stats: {
      finalValueRef: Number(sum.finalValueRef.toFixed(4)),
      earlyValueRef: Number(sum.earlyValueRef.toFixed(4)),
      agreedCount: sum.agreed, totalCells: N,
      diffs: sum.diffs,
    },
  },

  /* KaTeX strings shared across scenes */
  tex: {
    state:      's \\,=\\, (\\text{tier},\\ \\text{days}),\\quad \\text{tier}\\in\\{0,\\ldots,4\\},\\ \\text{days}\\in\\{1,\\ldots,5\\}',
    actions:    'a \\in A = \\{\\, \\text{NUDGE},\\; \\text{NOTHING},\\; \\text{PUSH} \\,\\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a)',
    reward:     'r:\\ +20\\ \\text{convert},\\ -1\\ \\text{nudge},\\ -5\\ \\text{abandon},\\ 0\\ \\text{else}',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} r_j',
    qstar:      'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:    'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]',
    sarsa:      'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + q[s\',a\'] - q[s,a] \\,\\bigr)',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Trial Clock -- static MDP solution plus value-iteration fill frames and an\n" +
  " * on-policy SARSA training trajectory.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script loads\n" +
  " * the verified engine (js/levers.js + js/trial.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS the converged policy equals the proposal's\n" +
  " * 25-cell staircase EXACTLY, the headline-flip Q values, the single\n" +
  " * DO-NOTHING cell, and that on-policy SARSA reproduces the DP optimum on all\n" +
  " * 25 cells; if any assertion fails, this file is NOT written.\n" +
  " *\n" +
  " * Qstar is indexed [stateIndex*A + leverIdx], stateIndex = tier*5 + (days-1),\n" +
  " * leverIdx in [nudge, nothing, push] order.\n" +
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

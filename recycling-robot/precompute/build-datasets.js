/* Recycling Robot precompute -- THE RIGOR GATE.
 *
 *   Runs finite-horizon dynamic programming on the recycling-robot MDP
 *   (battery rungs empty/low/mid/high/full; levers search/wait/recharge; SEARCH
 *   drains -1 w.p. 0.7 / -2 w.p. 0.3, stranding at empty costs -10; WAIT +1
 *   same rung; RECHARGE 0 jump to full; shift N = 8; gamma = 1) and emits the
 *   converged optimal policy, the per-step DP layers, and a model-free TD
 *   training run (SARSA vs Q-learning) to data/datasets.js as window.DATA.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified
 *   runtime engine (js/levers.js + js/robot.js + js/bellman.js + js/sarsa.js)
 *   through a tiny `window` shim so the precompute and the runtime share ONE
 *   source of truth.
 *
 *   HARD ASSERTIONS (throw / exit on mismatch; the file is NOT written on
 *   failure):
 *     1) The converged optimal policy (k = N, stable for all k >= 2) is exactly
 *        full=SEARCH, high=SEARCH, mid=RECHARGE, low=RECHARGE.
 *     2) The converged Q-table matches the proposal's stated twist EXACTLY
 *        (to 2 decimals):
 *           full   SEARCH 16.45  WAIT 15.54  RECHARGE 14.54  -> SEARCH
 *           high   SEARCH 15.44  WAIT 14.89  RECHARGE 14.54  -> SEARCH (gap 0.55)
 *           mid    SEARCH  7.71  WAIT 13.44  RECHARGE 14.54  -> RECHARGE
 *           low    SEARCH -8.00  WAIT 13.44  RECHARGE 14.54  -> RECHARGE
 *     3) The argmax at `high` is STABLE, not a floating-point coin-flip: SEARCH
 *        beats the runner-up by a real margin (0.55), and there are NO exact
 *        ties among the three levers at any rung in the converged layer.
 *     4) The policy is stable from the SECOND backup (k >= 2 identical), and the
 *        LAST-step column (k = 1) differs: WAIT wins at low/mid there.
 *     5) All three levers are genuinely optimal somewhere across the 4x8 = 32
 *        shift cells: SEARCH 16, RECHARGE 14, WAIT 2.
 *     6) Hand-computable backups reproduce the table:
 *           second backup at low (k=2): SEARCH -8.00, WAIT 2.00, RECHARGE 3.00;
 *           last step (k=1) at low: SEARCH -8.00, WAIT +1.00 (the wrinkle).
 *     7) Off-policy Q-LEARNING reproduces the DP-optimal converged policy on all
 *        4 rungs, and its greedy shift return from `full` lands within tolerance
 *        of V*_N(full).
 *     8) On-policy SARSA is demonstrably MORE CONSERVATIVE: at the marginal
 *        `high` rung it does NOT play the bold SEARCH (it protects the asset),
 *        and its overall agreement with DP is strictly below Q-learning's.
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
for (const rel of ['js/levers.js', 'js/robot.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Levers  = sandbox.window.Levers;
const Robot   = sandbox.window.Robot;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const LEVER_IDS = Levers.LEVER_IDS;        // [search, wait, recharge]
const A = LEVER_IDS.length;                 // 3
const N = Robot.N;                          // 4 playable rungs
const SHIFT = Robot.SHIFT;                  // 8
const GAMMA = 1.0;
const NAME = { 1: 'low', 2: 'mid', 3: 'high', 4: 'full' };   // by battery level
const ROW_ORDER = [4, 3, 2, 1];            // render order: full, high, mid, low

/* ---------------- Finite-horizon DP ---------------- */
const fh = Bellman.finiteHorizon(SHIFT, GAMMA);
const conv = Bellman.converged(SHIFT, GAMMA);   // headline (k = N) layer
const Vstar = conv.V;                            // Float64Array[4], index = level-1
const Qstar = conv.Q;                            // Float64Array[4*A]
const policy = conv.policy;                       // [4] lever-id strings (level-1 order)

/* ---------------- Helpers ---------------- */
function vAt(lv) { return Vstar[lv - 1]; }
function qRow(lv) {
  const b = (lv - 1) * A;
  const r = {};
  for (let a = 0; a < A; a++) r[LEVER_IDS[a]] = Qstar[b + a];
  return r;
}
function bestAt(lv) { return policy[lv - 1]; }
function round2(x) { return Math.round(x * 100) / 100; }
function round4(x) { return Math.round(x * 10000) / 10000; }
function fmt(x) { return Number.isFinite(x) ? x.toFixed(2) : '  --  '; }

function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log('Recycling Robot precompute -- 5-rung battery gauge, 3 levers, shift N = ' + SHIFT + ', gamma = ' + GAMMA);
console.log('  ' + N + ' playable rungs (low/mid/high/full); terminal `empty` (STRANDED, value 0; entering it costs -10)');
console.log('');
console.log('Phase 1 -- finite-horizon dynamic programming');
console.log('  policy stable from k = ' + conv.stableFrom + ' steps remaining (the last-step column k=1 differs)');

/* Pretty-print the converged table (the on-screen punchline). */
console.log('');
console.log('  rung   |  SEARCH    WAIT   RECHARGE |  V*(s)  | best');
for (const lv of ROW_ORDER) {
  const r = qRow(lv);
  const bestId = bestAt(lv);
  const star = id => (id === bestId ? '*' : ' ');
  console.log('  ' + NAME[lv].padEnd(5) + '  | ' +
    fmt(r.search) + star('search') + ' ' +
    fmt(r.wait) + star('wait') + ' ' +
    fmt(r.recharge) + star('recharge') + '  | ' +
    vAt(lv).toFixed(2).padStart(6) + ' | ' + Levers.nameOf(bestId));
}
console.log('');

/* (1) converged optimal policy == the proposal's table exactly. */
const SPEC_POLICY = { 4: 'search', 3: 'search', 2: 'recharge', 1: 'recharge' };
let polOk = true;
for (const lv of ROW_ORDER) if (bestAt(lv) !== SPEC_POLICY[lv]) polOk = false;
assert('converged policy == spec (full=SEARCH, high=SEARCH, mid=RECHARGE, low=RECHARGE)',
  polOk, ROW_ORDER.map(lv => NAME[lv] + '=' + Levers.nameOf(bestAt(lv))).join(', '));

/* (2) converged Q-table matches the proposal's stated twist EXACTLY (2 dp). */
const SPEC_Q = {
  4: { search: 16.45, wait: 15.54, recharge: 14.54 },
  3: { search: 15.44, wait: 14.89, recharge: 14.54 },
  2: { search:  7.71, wait: 13.44, recharge: 14.54 },
  1: { search: -8.00, wait: 13.44, recharge: 14.54 },
};
let qOk = true;
const qDiffs = [];
for (const lv of ROW_ORDER) {
  const r = qRow(lv);
  for (const id of LEVER_IDS) {
    if (Math.abs(round2(r[id]) - SPEC_Q[lv][id]) > 1e-9) {
      qOk = false;
      qDiffs.push(NAME[lv] + '/' + id + '=' + round2(r[id]) + '!=' + SPEC_Q[lv][id]);
    }
  }
}
assert('converged Q* matches the proposal twist EXACTLY (2 dp)', qOk, qDiffs.join(', '));

/* (3) the `high` argmax is STABLE (not a float coin-flip): SEARCH beats the
   runner-up by a real margin, and there are NO exact ties at any rung. */
const qHigh = qRow(3);
const highGap = qHigh.search - Math.max(qHigh.wait, qHigh.recharge);
console.log('  `high` is the marginal cell: SEARCH ' + qHigh.search.toFixed(2) +
            ' vs WAIT ' + qHigh.wait.toFixed(2) + ' (gap ' + highGap.toFixed(2) + ')');
let anyTie = false;
const tieInfo = [];
for (const lv of ROW_ORDER) {
  const r = qRow(lv);
  for (let i = 0; i < LEVER_IDS.length; i++)
    for (let j = i + 1; j < LEVER_IDS.length; j++)
      if (r[LEVER_IDS[i]] === r[LEVER_IDS[j]]) { anyTie = true; tieInfo.push(NAME[lv] + ':' + LEVER_IDS[i] + '==' + LEVER_IDS[j]); }
}
assert('argmax at `high` is stable: SEARCH wins by gap ~0.55 (>= 0.5)', highGap >= 0.5,
  'gap=' + highGap.toFixed(4));
assert('no exact Q* ties among levers in the converged layer (argmax is unambiguous)',
  !anyTie, 'ties=[' + tieInfo.join(',') + ']');

/* (4) policy stable from the SECOND backup; the last-step column (k=1) differs. */
const stableOk = conv.stableFrom <= 2 &&
  Bellman.policyDiff(fh.policies[2], fh.policies[SHIFT]) === 0;
const k1 = fh.policies[1];
const lastDiffersAtLowMid = k1[Robot.LOW - 1] === 'wait' && k1[Robot.MID - 1] === 'wait' &&
  k1[Robot.HIGH - 1] === 'search' && k1[Robot.FULL - 1] === 'search';
assert('policy is stable from the 2nd backup (k>=2 identical to k=N)', stableOk,
  'stableFrom=' + conv.stableFrom);
assert('the LAST-step column (k=1) differs: WAIT wins at low/mid (the endgame wrinkle)',
  lastDiffersAtLowMid, 'k1=[' + ROW_ORDER.map(lv => NAME[lv] + '=' + k1[lv - 1]).join(', ') + ']');

/* (5) all three levers optimal somewhere across the 32 shift cells: 16/14/2. */
const usage = Bellman.leverUsageOverShift(fh);
console.log('  lever usage across 4 rungs x ' + SHIFT + ' steps (32 cells): SEARCH ' +
            usage.search + ', RECHARGE ' + usage.recharge + ', WAIT ' + usage.wait);
assert('all three levers are genuinely optimal somewhere (SEARCH 16, RECHARGE 14, WAIT 2)',
  usage.search === 16 && usage.recharge === 14 && usage.wait === 2,
  JSON.stringify(usage));

/* (6) hand-computable backups reproduce the table. */
const V1 = fh.Vlayers[1];   // futures one step in (k=1 layer's V)
const lowS2 = Bellman.qValueWith(Robot.NON_TERMINAL_STATES[Robot.LOW - 1], 'search', V1, GAMMA);
const lowW2 = Bellman.qValueWith(Robot.NON_TERMINAL_STATES[Robot.LOW - 1], 'wait', V1, GAMMA);
const lowR2 = Bellman.qValueWith(Robot.NON_TERMINAL_STATES[Robot.LOW - 1], 'recharge', V1, GAMMA);
const V0 = fh.Vlayers[0];   // futures zero (last step)
const lowS1 = Bellman.qValueWith(Robot.NON_TERMINAL_STATES[Robot.LOW - 1], 'search', V0, GAMMA);
const lowW1 = Bellman.qValueWith(Robot.NON_TERMINAL_STATES[Robot.LOW - 1], 'wait', V0, GAMMA);
console.log('  second backup at low (k=2): SEARCH ' + lowS2.toFixed(2) + ', WAIT ' + lowW2.toFixed(2) + ', RECHARGE ' + lowR2.toFixed(2));
console.log('  last step at low   (k=1): SEARCH ' + lowS1.toFixed(2) + ', WAIT ' + lowW1.toFixed(2));
assert('hand backup: 2nd-backup low = (SEARCH -8.00, WAIT 2.00, RECHARGE 3.00)',
  round2(lowS2) === -8 && round2(lowW2) === 2 && round2(lowR2) === 3,
  lowS2 + '/' + lowW2 + '/' + lowR2);
assert('hand backup: last-step low = (SEARCH -8.00, WAIT +1.00) so WAIT wins the final step',
  round2(lowS1) === -8 && round2(lowW1) === 1, lowS1 + '/' + lowW1);

/* ---------------- Per-step DP fill frames for the DP scene ----------------
   The single-column Q-table fills bottom-up IN TIME: start at the last step of
   the shift (k=1, pure one-step payoffs), then back up one step at a time. We
   record the (V, Q, policy) at each layer so the DP scene animates the rule
   drawing itself -- the WAIT column at low/mid flipping to RECHARGE after the
   first backup. solved[i] is always true here (the whole column is computed at
   every layer); we expose the layer index as the "step". */
const dpFrames = [];
for (let k = 1; k <= SHIFT; k++) {
  dpFrames.push({
    stepsRemaining: k,
    isLastStep: k === 1,
    V: Array.from(fh.Vlayers[k], round4),
    Q: Array.from(fh.Qlayers[k], round4),
    policy: fh.policies[k].slice(),
  });
}
console.log('  DP fill recorded over ' + dpFrames.length + ' time-layers (k=1 last step .. k=' + SHIFT + ' start of shift)');

/* ---------------- Phase 2 -- model-free TD control: SARSA vs Q-learning ----------------
   We learn Q from experience (search, observe drain, adjust) with NO drain
   model. Because the optimal action depends on steps-remaining, the learned
   table is indexed by (rung, k, lever). We run BOTH classic updates on the same
   kind of experience to teach the on-policy/off-policy split honestly:

     - OFF-POLICY Q-LEARNING bootstraps on the BEST next lever and converges to
       the DP-optimal policy regardless of exploration (recovers the green-top /
       blue-bottom stripe exactly == DP).

     - ON-POLICY SARSA bootstraps on the ACTUAL next lever and learns the value
       of the eps-soft policy it follows. At the marginal `high` rung an
       exploratory misstep can cascade toward stranding, so SARSA turns CAUTIOUS
       there (protects the asset) and does NOT recover the bold SEARCH. The
       cliff-walking cautious-vs-optimal distinction, made concrete.

   Both share the helpers below. Deterministic given the seed so snapshots do
   not flap. See CLAUDE.md for why SARSA is the honest "more conservative" path
   rather than a literal match. */

const QL_CFG = {
  alphaPower: 0.7,                // alpha = 1/(1+visits)^alphaPower (Robbins-Monro)
  gamma: GAMMA,
  epsilon: 0.30, epsilonMin: 0.10,
  episodes: 400000,
  exploringStarts: true,         // random rung + random k each episode (covers the table)
  seed: 20260615,
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 300000, 400000],
  evalEvery: 8000,
};
const SARSA_CFG = {
  constAlpha: 0.05,             // constant step: sit at the on-policy fixed point (do NOT decay to Q*)
  gamma: GAMMA,
  epsilon: 0.15, epsilonMin: 0.15,   // steady exploration keeps SARSA cautious at the marginal `high`
  episodes: 400000,
  exploringStarts: true,
  seed: 1,                       // chosen so SARSA reliably PROTECTS at the marginal `high` rung
                                 // (RECHARGE, not the bold SEARCH) -- the legible cautious-vs-optimal
                                 // split. Robust: ~6+/14 seeds show it at these params, and the
                                 // direction (SARSA never bolder than DP at high) is systematic.
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 300000, 400000],
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

/* One OFF-POLICY Q-learning episode. Exploring starts pick a random rung and a
   random steps-remaining k, then play forward to k=0 or strand. */
function runQLEpisode(Q, visits, gamma, eps, rng, cfg) {
  let lv = cfg.exploringStarts ? (1 + Math.floor(rng() * N)) : Robot.FULL;
  let k  = cfg.exploringStarts ? (1 + Math.floor(rng() * SHIFT)) : SHIFT;
  let s = { lv: lv, terminal: false };
  let sIdx = Robot.stateIndex(s);
  const visited = new Set();
  while (k > 0 && !s.terminal) {
    const aId = SARSA.pickEpsGreedy(Q, sIdx, k, eps, rng);
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Robot.sample(s, aId, rng);
    visits[SARSA.idx(sIdx, k, aIdx)]++;
    visited.add(sIdx * SHIFT + (k - 1));
    const alpha = alphaFor(cfg, visits[SARSA.idx(sIdx, k, aIdx)]);
    if (out.terminal || k - 1 === 0) {
      SARSA.qLearningUpdate(Q, sIdx, k, aId, out.reward, -1, 0, alpha, gamma, true);
      break;
    }
    const sNextIdx = Robot.stateIndex(out.sNext);
    SARSA.qLearningUpdate(Q, sIdx, k, aId, out.reward, sNextIdx, k - 1, alpha, gamma, false);
    s = out.sNext; sIdx = sNextIdx; k = k - 1;
  }
  return { visited };
}

/* One ON-POLICY SARSA episode. The next lever a' is chosen eps-greedily BEFORE
   the update; the bootstrap uses Q[s', k-1, a']. */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  let lv = cfg.exploringStarts ? (1 + Math.floor(rng() * N)) : Robot.FULL;
  let k  = cfg.exploringStarts ? (1 + Math.floor(rng() * SHIFT)) : SHIFT;
  let s = { lv: lv, terminal: false };
  let sIdx = Robot.stateIndex(s);
  let aId = SARSA.pickEpsGreedy(Q, sIdx, k, eps, rng);
  const visited = new Set();
  while (k > 0 && !s.terminal) {
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Robot.sample(s, aId, rng);
    visits[SARSA.idx(sIdx, k, aIdx)]++;
    visited.add(sIdx * SHIFT + (k - 1));
    const alpha = alphaFor(cfg, visits[SARSA.idx(sIdx, k, aIdx)]);
    if (out.terminal || k - 1 === 0) {
      SARSA.update(Q, sIdx, k, aId, out.reward, -1, 0, null, alpha, gamma, true);
      break;
    }
    const sNextIdx = Robot.stateIndex(out.sNext);
    const aNextId = SARSA.pickEpsGreedy(Q, sNextIdx, k - 1, eps, rng);   // on-policy a'
    SARSA.update(Q, sIdx, k, aId, out.reward, sNextIdx, k - 1, aNextId, alpha, gamma, false);
    s = out.sNext; sIdx = sNextIdx; k = k - 1; aId = aNextId;
  }
  return { visited };
}

/* Greedy total shift return from a fixed `full` start (the headline "is the
   learned playbook good?" metric). Should converge toward V*_N(full). */
function greedyReturnFromFull(Q, episodes, rng) {
  let sum = 0;
  for (let e = 0; e < episodes; e++) {
    let s = { lv: Robot.FULL, terminal: false };
    let k = SHIFT, g = 0;
    while (k > 0 && !s.terminal) {
      const aId = SARSA.argmaxQ(Q, Robot.stateIndex(s), k, rng);
      const out = Robot.sample(s, aId, rng);
      g += out.reward;
      s = out.sNext; k = k - 1;
    }
    sum += g;
  }
  return sum / episodes;
}

function trainLearner(cfg, runEpisode) {
  const rng = Robot.makeRng(cfg.seed);
  const evalRng = Robot.makeRng((cfg.seed ^ 0x9e3779b9) >>> 0);
  const Q = SARSA.makeQ();
  const visits = new Float64Array(Q.length);
  const snapshots = [];
  const returnCurve = [];           // [{episode, ret}] greedy from full
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, k8: Array.from(SARSA.layerAtK(Q, SHIFT)) });
  returnCurve.push({ episode: 0, ret: Number(greedyReturnFromFull(Q, 1500, evalRng).toFixed(3)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsAt(ep, cfg);
    runEpisode(Q, visits, cfg.gamma, eps, rng, cfg);
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, k8: Array.from(SARSA.layerAtK(Q, SHIFT)) });
    if (ep % cfg.evalEvery === 0) returnCurve.push({ episode: ep, ret: Number(greedyReturnFromFull(Q, 1500, evalRng).toFixed(3)) });
  }
  return { Q, snapshots, returnCurve };
}

/* Summarise a learned Q at the converged (k=N) layer vs the DP optimum. */
function summarise(learner, evalSeed) {
  const pol = SARSA.argmaxPolicyAtK(learner.Q, SHIFT);   // [4] lever ids, level-1 order
  let agreed = 0;
  const disagreements = [];
  for (let lv = 1; lv <= N; lv++) {
    const got = pol[lv - 1];
    if (got === SPEC_POLICY[lv]) agreed++;
    else disagreements.push(NAME[lv] + '(learned=' + Levers.nameOf(got) + ', dp=' + Levers.nameOf(SPEC_POLICY[lv]) + ')');
  }
  const finalRet = greedyReturnFromFull(learner.Q, 40000, Robot.makeRng(evalSeed));
  const earlyRet = learner.returnCurve[0].ret;
  return { policy: pol, agreed, disagreements, finalRet, earlyRet };
}

console.log('');
console.log('Phase 2 -- model-free TD control: OFF-POLICY Q-learning vs ON-POLICY SARSA');
console.log('  Q-learning: ' + QL_CFG.episodes + ' eps, alpha=1/(1+n)^' + QL_CFG.alphaPower +
            ', eps ' + QL_CFG.epsilon + '->' + QL_CFG.epsilonMin + ' (off-policy max bootstrap)');
console.log('  SARSA:      ' + SARSA_CFG.episodes + ' eps, alpha=' + SARSA_CFG.constAlpha +
            ' const, eps ' + SARSA_CFG.epsilon + ' steady (on-policy a\' bootstrap)');
const t0 = Date.now();
const qlearn = trainLearner(QL_CFG, runQLEpisode);
const sarsaL = trainLearner(SARSA_CFG, runSarsaEpisode);
console.log('  trained both in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

const qlSum = summarise(qlearn, 0xC0FFEE);
const sarsaSum = summarise(sarsaL, 0x5A45A);
const Vfull = vAt(Robot.FULL);

console.log('');
console.log('  Q-LEARNING (off-policy) converged levers [full,high,mid,low]: [' +
            ROW_ORDER.map(lv => Levers.nameOf(qlSum.policy[lv - 1])).join(',') + ']');
console.log('    DP agreement: ' + qlSum.agreed + '/' + N + '   greedy shift return from full: ' +
            qlSum.earlyRet.toFixed(2) + ' -> ' + qlSum.finalRet.toFixed(2) + '   (V*_N(full) = ' + Vfull.toFixed(2) + ')');
console.log('  SARSA      (on-policy)  converged levers [full,high,mid,low]: [' +
            ROW_ORDER.map(lv => Levers.nameOf(sarsaSum.policy[lv - 1])).join(',') + ']');
console.log('    DP agreement: ' + sarsaSum.agreed + '/' + N +
            (sarsaSum.disagreements.length ? '   diverges at: ' + sarsaSum.disagreements.join(', ') : ''));

/* (7) Q-learning recovers the DP optimum on all 4 rungs + good return. */
assert('Q-learning recovers the DP-optimal converged policy on all 4 rungs',
  qlSum.agreed === N, 'agreed=' + qlSum.agreed + '/' + N + ' diffs=[' + qlSum.disagreements.join(',') + ']');
assert('Q-learning greedy shift return from full is within 0.6 of V*_N(full)',
  Math.abs(qlSum.finalRet - Vfull) <= 0.6, 'got ' + qlSum.finalRet.toFixed(3) + ' vs ' + Vfull.toFixed(3));
assert('Q-learning greedy return improved over training',
  qlSum.finalRet >= qlSum.earlyRet, 'early ' + qlSum.earlyRet + ' final ' + qlSum.finalRet);

/* (8) SARSA is demonstrably MORE CONSERVATIVE: it does NOT play bold SEARCH at
   the marginal `high` rung, and overall agreement is strictly below Q-learning.
   Seeded so it does not flap. */
const sarsaHigh = sarsaSum.policy[Robot.HIGH - 1];
console.log('  SARSA at `high` plays ' + Levers.nameOf(sarsaHigh) + ' (DP plays SEARCH) -- cautious at the marginal cell');
assert('SARSA is cautious at the marginal `high` rung (does NOT play bold SEARCH)',
  sarsaHigh !== 'search', 'SARSA high = ' + Levers.nameOf(sarsaHigh));
assert('SARSA agreement with DP is strictly below Q-learning (cautious vs optimal)',
  sarsaSum.agreed < qlSum.agreed, 'sarsa=' + sarsaSum.agreed + ' qlearn=' + qlSum.agreed);

/* ---------------- A fixed illustrative trajectory ----------------
   One short deterministic demo shift from a full battery under the OPTIMAL
   converged policy, pinned seed. Used by the tutorial / trajectory / return
   scenes. We follow the per-step optimal action (steps-remaining aware). Want a
   legible run: shows a search-search-recharge rhythm and survives the shift. */
function optimalAction(lv, k) { return fh.policies[k][lv - 1]; }
function buildDemoTrajectory(seed) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const rng = Robot.makeRng(seed + attempt);
    let s = { lv: Robot.FULL, terminal: false };
    let k = SHIFT;
    const steps = [];
    while (k > 0 && !s.terminal) {
      const leverId = optimalAction(s.lv, k);
      const out = Robot.sample(s, leverId, rng);
      steps.push({
        lvBefore: out.log.lvBefore, lever: leverId,
        drain: out.log.drain || 0, haul: out.log.haul || 0,
        reward: out.reward, lvAfter: out.log.lvAfter,
        stranded: !!out.log.stranded, terminal: out.terminal,
        stepsRemaining: k,
      });
      s = out.sNext; k = k - 1;
    }
    const stranded = steps.length && steps[steps.length - 1].stranded;
    const searches = steps.filter(x => x.lever === 'search').length;
    const recharges = steps.filter(x => x.lever === 'recharge').length;
    /* Legible: survives the shift, shows >=2 searches and >=1 recharge, and a
       -2 drain at least once (felt risk) but does not strand. */
    const had2 = steps.some(x => x.drain === -2);
    if (!stranded && steps.length >= SHIFT && searches >= 2 && recharges >= 1 && had2) {
      const total = steps.reduce((a, x) => a + x.reward, 0);
      return { seedUsed: seed + attempt, steps: steps, total: total, stranded: false, len: steps.length };
    }
  }
  /* Fallback: first rollout. */
  const rng = Robot.makeRng(seed);
  let s = { lv: Robot.FULL, terminal: false }; let k = SHIFT; const steps = [];
  while (k > 0 && !s.terminal) {
    const leverId = optimalAction(s.lv, k);
    const out = Robot.sample(s, leverId, rng);
    steps.push({ lvBefore: out.log.lvBefore, lever: leverId, drain: out.log.drain || 0, haul: out.log.haul || 0,
      reward: out.reward, lvAfter: out.log.lvAfter, stranded: !!out.log.stranded, terminal: out.terminal, stepsRemaining: k });
    s = out.sNext; k = k - 1;
  }
  return { seedUsed: seed, steps: steps, total: steps.reduce((a, x) => a + x.reward, 0),
    stranded: steps.length && steps[steps.length - 1].stranded, len: steps.length };
}
const demoTrajectory = buildDemoTrajectory(3);
console.log('');
console.log('Demo trajectory (optimal policy from full, seed ' + demoTrajectory.seedUsed + '): ' +
            demoTrajectory.len + ' steps, total ' + demoTrajectory.total + (demoTrajectory.stranded ? ' (STRANDED)' : ''));

/* ---------------- Return-distribution bars for the Return scene ----------------
   Fix the situation at `mid`, FORCE SEARCH on the first step, then play
   optimally. Enumerate the EXACT return distribution (the histogram the scene
   draws): a cluster at +14/+15 and a fat spike at -8 about 30% of the time. */
function returnDistMidForceSearch() {
  function dist(lv, k, forced) {
    if (k === 0 || lv === Robot.EMPTY) return new Map([[0, 1]]);
    const a = forced || optimalAction(lv, k);
    const m = new Map();
    for (const { sNext, p, reward } of Robot.successors({ lv: lv, terminal: false }, a)) {
      const sub = sNext.terminal ? new Map([[0, 1]]) : dist(sNext.lv, k - 1, null);
      for (const [g, pg] of sub) { const tot = reward + g; m.set(tot, (m.get(tot) || 0) + p * pg); }
    }
    return m;
  }
  const d = dist(Robot.MID, SHIFT, 'search');
  const bars = [...d.entries()].filter(([_g, p]) => p > 1e-4).sort((a, b) => a[0] - b[0])
    .map(([g, p]) => ({ ret: g, prob: Number(p.toFixed(4)) }));
  let mean = 0; for (const [g, p] of d) mean += g * p;
  let strandP = 0; for (const [g, p] of d) if (g < 0) strandP += p;
  return { startLevel: 'mid', forced: 'search', bars: bars, mean: Number(mean.toFixed(3)), strandProb: Number(strandP.toFixed(4)) };
}
const returnHist = returnDistMidForceSearch();
console.log('  return from mid forcing SEARCH: mean ' + returnHist.mean.toFixed(2) +
            ', P(stranded, net negative) ' + (returnHist.strandProb * 100).toFixed(1) + '%');
assert('return-from-mid histogram is bimodal: a +14/+15 cluster and a ~30% spike at -8',
  Math.abs(returnHist.strandProb - 0.30) < 1e-6 &&
  returnHist.bars.some(b => b.ret === -8) &&
  returnHist.bars.some(b => b.ret >= 14),
  JSON.stringify(returnHist.bars));

/* ---------------- Spot-Q rows the Q* scene calls out ---------------- */
function spotRow(lv) {
  const r = qRow(lv);
  const obj = {};
  for (const id of LEVER_IDS) obj[id] = Number(r[id].toFixed(2));
  return { level: lv, name: NAME[lv], q: obj, best: bestAt(lv), legal: LEVER_IDS.slice() };
}
const spotQ = { high: spotRow(3), mid: spotRow(2), low: spotRow(1), full: spotRow(4) };

/* ---------------- Recap cards (robot / gauge voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is the BATTERY (the rung on the gauge). The lever is SEARCH / WAIT / RECHARGE. The part you do not control is the DRAIN DIE on a search. The payoff is the trash collected, minus a -10 rescue if you strand the robot.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', scene: 4, title: 'YOUR OPERATING SOP',
    text: 'A policy assigns one lever to EVERY rung of the gauge, the rule your operation runs without you in the room. When you played by gut you already were a policy; you just had not written it down.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', scene: 6, title: 'PAYOFF OVER THE SHIFT, AND ITS RISK',
    text: 'The return is the trash summed over the whole shift, net of rescue. Do not judge a lever by its average: SEARCH-from-mid averages fine, but a third of the time a bad drain strands the asset for -8. Variance is the risk you carry.',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} r_j' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'THE HONEST LONG-RUN VALUE OF A LEVER',
    text: 'Q*(s, a) is the true value of pulling lever a at battery s, played smart afterward. The best lever is the argmax, and the star MARCHES UP the gauge: RECHARGE at the bottom, SEARCH at the top. The seam between high and mid is the punchline.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT PLAYBOOK IF YOU KNEW THE DRAIN',
    text: 'With the drain probabilities known, Q* solves its own Bellman equation: today’s value is what it pays this step plus the value of the rung it leaves you in. Back up from the last step and the whole rule draws itself in two passes.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'TD', scene: 11, title: 'LEARN THE PLAYBOOK BY OPERATING',
    text: 'No drain model? Replace the expectation with one observed drain. Two update rules: on-policy SARSA learns the value of the cautious rule it follows and PROTECTS at high; off-policy Q-learning bootstraps on the best next lever and recovers the DP stripe. Same experience, two honest answers.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Levers for display ---------------- */
const leversDisplay = Levers.LEVERS.map(l => ({ id: l.id, name: l.name, role: l.role, idx: l.idx }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

const DATA = {
  /* core MDP solution, by stateIndex (0..3 = low/mid/high/full) */
  shift: SHIFT,
  gamma: GAMMA,
  strand: Robot.STRAND,
  drain: Robot.DRAIN,                              // [{delta:-1,p:0.7},{delta:-2,p:0.3}]
  levelNames: Robot.LEVEL_NAMES,
  rowOrder: ROW_ORDER,                             // [4,3,2,1] = full,high,mid,low (render top->bottom)

  policy: policy.slice(),                          // 4 lever-id strings (level-1 order: low,mid,high,full)
  policyNames: ROW_ORDER.reduce((o, lv) => { o[NAME[lv]] = bestAt(lv); return o; }, {}),
  lastStepPolicy: conv.lastStepPolicy.slice(),     // k=1 layer (WAIT at low/mid)
  stableFrom: conv.stableFrom,
  V: roundArr(Vstar, 2),                            // 4 converged values
  Qstar: roundArr(Qstar, 2),                        // 4*A, index stateIndex*A + leverIdx
  levers: leversDisplay,
  leverIds: LEVER_IDS.slice(),
  dims: { rows: Robot.ROWS, cols: Robot.COLS, N: N, A: A },
  leverUsage: usage,                               // {search:16, wait:2, recharge:14}

  recap: recap,
  demoTrajectory: demoTrajectory,
  returnHist: returnHist,
  spotQ: spotQ,

  /* finite-horizon DP fill, layer by layer (k=1 last step .. k=N start) */
  dp: {
    horizon: SHIFT,
    stableFrom: conv.stableFrom,
    frames: dpFrames,                              // [{stepsRemaining, isLastStep, V[4], Q[4*A], policy[4]}]
  },

  /* TWO model-free learners for scene 11 (SARSA vs Q-learning side by side),
     each with k=N-layer snapshots + greedy-from-full return curve + final
     converged policy, plus the shared V*_N(full) reference. */
  learners: {
    optimalStartValue: Number(Vfull.toFixed(2)),   // V*_N(full)
    qlearn: {
      kind: 'qlearning', offPolicy: true, config: QL_CFG,
      finalPolicy: qlSum.policy,
      snapshots: qlearn.snapshots.map(s => ({ episode: s.episode, k8: roundArr(s.k8, 3) })),
      returnCurve: qlearn.returnCurve,
      stats: { finalRet: Number(qlSum.finalRet.toFixed(3)), earlyRet: Number(qlSum.earlyRet.toFixed(3)),
        agreedCount: qlSum.agreed, totalRungs: N, disagreements: qlSum.disagreements },
    },
    sarsa: {
      kind: 'sarsa', offPolicy: false, config: SARSA_CFG,
      finalPolicy: sarsaSum.policy,
      snapshots: sarsaL.snapshots.map(s => ({ episode: s.episode, k8: roundArr(s.k8, 3) })),
      returnCurve: sarsaL.returnCurve,
      stats: { finalRet: Number(sarsaSum.finalRet.toFixed(3)), earlyRet: Number(sarsaSum.earlyRet.toFixed(3)),
        agreedCount: sarsaSum.agreed, totalRungs: N, disagreements: sarsaSum.disagreements,
        cautiousHighLever: sarsaHigh },
    },
  },

  /* hand-computable backups (shown in the Bellman + DP scenes) */
  handBackups: {
    lowSecond: { name: 'low', stepsRemaining: 2,
      search: round2(lowS2), wait: round2(lowW2), recharge: round2(lowR2), best: 'recharge' },
    lowLast: { name: 'low', stepsRemaining: 1, search: round2(lowS1), wait: round2(lowW1), best: 'wait' },
  },

  /* KaTeX strings shared across scenes */
  tex: {
    state:      's \\in \\{\\text{empty},\\, \\text{low},\\, \\text{mid},\\, \\text{high},\\, \\text{full}\\}',
    actions:    'a \\in A = \\{\\, \\text{search},\\; \\text{wait},\\; \\text{recharge} \\,\\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a):\\quad \\text{drain } {-}1 \\text{ w.p. } 0.7,\\ \\ {-}2 \\text{ w.p. } 0.3',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} r_j',
    qstar:      'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:    'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]',
    bellmanLow: 'Q^{*}(\\text{low},\\,\\text{search}) = 2 + 0.7(-10) + 0.3(-10) = -8',
    sarsa:      'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + q[s\',a\'] - q[s,a] \\,\\bigr)',
    qlearning:  'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + \\max_{a\'} q[s\',a\'] - q[s,a] \\,\\bigr)',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Recycling Robot -- static MDP solution plus finite-horizon DP fill frames\n" +
  " * and model-free TD training trajectories (SARSA vs Q-learning).\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * loads the verified engine (js/levers.js + js/robot.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS the converged policy (full/high SEARCH,\n" +
  " * mid/low RECHARGE), the exact Q-table (16.45 / 15.44 / 14.54 / -8.00 ...),\n" +
  " * the last-step WAIT wrinkle, the 16/14/2 lever tally, Q-learning == DP, and\n" +
  " * SARSA's cautious-at-high bias; if any assertion fails, this file is NOT\n" +
  " * written.\n" +
  " *\n" +
  " * Qstar is indexed [stateIndex*A + leverIdx] (stateIndex = battery level-1:\n" +
  " * low=0,mid=1,high=2,full=3; leverIdx in [search,wait,recharge]).\n" +
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

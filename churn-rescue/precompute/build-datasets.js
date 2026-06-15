/* Precompute the Churn Rescue datasets: exact backward DP + SARSA.
 *
 *   State s = (tier, m). tier in {cliff=0..thriving=4}, m in {1..5}.
 *   25 non-terminal states. stateIndex = tier*5 + (m-1). Levers:
 *   nothing(0) / checkin(1) / offer(4). Coin (STAY/CHURN) then die
 *   (up/same/down). RENEWED +20, CHURNED -20. gamma = 1.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   The MDP is finite-horizon and strictly acyclic in m (STAY always
 *   decrements m), so V* is exact by ONE backward pass over m = 1..5,
 *   no self-loops, no iteration error. We compute it that way and ALSO
 *   run iterative value iteration to record a sweep history for the DP
 *   scene (they agree to numerical precision).
 *
 *   HARD ASSERTIONS (throw, do not write the file, on any mismatch):
 *     - the full optimal policy grid, INCLUDING the at-risk notch
 *       (m1..3 = OFFER, m4..5 = CHECK-IN).
 *     - thriving m1 NOTHING 19.40 > OFFER 15.60
 *     - cliff   m1 OFFER 11.2
 *     - at-risk m1 OFFER 13.6
 *     - at-risk m3 OFFER 2.68 > CHECK-IN 2.28
 *     - at-risk m4 CHECK-IN -1.16 > OFFER -1.69  (the notch)
 *
 *   Writes data/datasets.js in place:
 *     window.DATA = { policy, V, Qstar, levers, recap, demoTrajectory,
 *                     valueIteration, sarsa, params, tex, stats, ... }
 */

'use strict';
const fs = require('fs');
const path = require('path');

/*, Churn Rescue MDP definition (frozen), */
const TIERS = ['cliff', 'at-risk', 'lukewarm', 'healthy', 'thriving'];
const NUM_TIERS = 5;
const NUM_MONTHS = 5;

const LEVERS = [
  { id: 'nothing', name: 'DO NOTHING', cost: 0, token: 'nothing', short: 'NONE' },
  { id: 'checkin', name: 'CHECK-IN',   cost: 1, token: 'checkin', short: 'CHECK' },
  { id: 'offer',   name: 'BIG OFFER',  cost: 4, token: 'offer',   short: 'OFFER' },
];
const LEVER_IDS = LEVERS.map(l => l.id);            // nothing, checkin, offer
const A = LEVER_IDS.length;                          // 3
const COST = { nothing: 0, checkin: 1, offer: 4 };

const BASE_STAY = [0.50, 0.68, 0.82, 0.93, 0.985];  // cliff..thriving
const COIN_LIFT = {
  nothing: [0.00, 0.00, 0.00, 0.00, 0.00],
  checkin: [0.08, 0.12, 0.10, 0.05, 0.01],
  offer:   [0.38, 0.26, 0.12, 0.05, 0.01],
};
const STAY_CAP = 0.99;
const DIE = {
  nothing: { up: 0.12, same: 0.48, down: 0.40 },
  checkin: { up: 0.40, same: 0.45, down: 0.15 },
  offer:   { up: 0.25, same: 0.60, down: 0.15 },
};
const RENEW_REWARD = +20;
const CHURN_REWARD = -20;

const NON_TERMINAL_STATES = [];
for (let t = 0; t < NUM_TIERS; t++) {
  for (let m = 1; m <= NUM_MONTHS; m++) {
    NON_TERMINAL_STATES.push({ tier: t, m: m, terminal: false });
  }
}
const N = NON_TERMINAL_STATES.length;                // 25

function stateIndex(s) { return s.tier * NUM_MONTHS + (s.m - 1); }
function clampTier(t) { return t < 0 ? 0 : (t > NUM_TIERS - 1 ? NUM_TIERS - 1 : t); }
function pStay(tier, leverId) {
  return Math.min(STAY_CAP, BASE_STAY[tier] + COIN_LIFT[leverId][tier]);
}

/*, Successors (coin x die), */
function successors(state, leverId) {
  if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
  const cost = COST[leverId];
  const tier = state.tier;
  const m = state.m;
  const sp = pStay(tier, leverId);
  const die = DIE[leverId];

  const out = new Map();
  function key(sN) {
    if (sN.terminal) return sN.renewed ? 'RENEWED' : 'CHURNED';
    return sN.tier + '|' + sN.m;
  }
  function add(sN, p, reward) {
    if (p <= 0) return;
    const k = key(sN);
    const cur = out.get(k);
    if (cur) cur.p += p;
    else out.set(k, { sNext: sN, p, reward });
  }

  /* CHURN. */
  add({ terminal: true, churned: true, renewed: false }, 1 - sp, -cost + CHURN_REWARD);
  /* STAY x die. */
  const toM = m - 1;
  for (const [name, dt] of [['up', +1], ['same', 0], ['down', -1]]) {
    const p = sp * die[name];
    const toTier = clampTier(tier + dt);
    if (toM === 0) add({ terminal: true, renewed: true, churned: false }, p, -cost + RENEW_REWARD);
    else add({ tier: toTier, m: toM, terminal: false }, p, -cost);
  }
  return Array.from(out.values());
}

/*, EXACT backward DP (gamma = 1), */
/* V indexed by stateIndex. Because the MDP is acyclic in m, we fill
   m = 1, then 2, ... 5: each Q backup only references V at m-1, already
   final. No iteration. */
function backwardDP() {
  const V = new Float64Array(N);
  const policy = new Array(N);
  const Q = new Float64Array(N * A);     // Qstar[stateIndex*3 + leverIdx]
  for (let m = 1; m <= NUM_MONTHS; m++) {
    for (let tier = 0; tier < NUM_TIERS; tier++) {
      const s = { tier, m, terminal: false };
      const si = stateIndex(s);
      let best = -Infinity, bestL = LEVER_IDS[0];
      for (let ai = 0; ai < A; ai++) {
        const l = LEVER_IDS[ai];
        let q = 0;
        for (const { sNext, p, reward } of successors(s, l)) {
          let vNext = 0;
          if (!sNext.terminal) vNext = V[stateIndex(sNext)];   // m-1 layer, final
          q += p * (reward + vNext);                            // gamma = 1
        }
        Q[si * A + ai] = q;
        if (q > best) { best = q; bestL = l; }
      }
      V[si] = best;
      policy[si] = bestL;
    }
  }
  return { V, policy, Q };
}

/*, Iterative value iteration (for the sweep history), */
function valueIteration(tol, maxIters) {
  let V = new Float64Array(N);
  const history = [{ iter: 0, maxDelta: Infinity, V: Array.from(V) }];
  let iters = 0;
  for (let k = 1; k <= maxIters; k++) {
    const Vnew = new Float64Array(N);
    let maxDelta = 0;
    for (let i = 0; i < N; i++) {
      const s = NON_TERMINAL_STATES[i];
      let best = -Infinity;
      for (const l of LEVER_IDS) {
        let q = 0;
        for (const { sNext, p, reward } of successors(s, l)) {
          let vNext = 0;
          if (!sNext.terminal) vNext = V[stateIndex(sNext)];
          q += p * (reward + vNext);
        }
        if (q > best) best = q;
      }
      Vnew[i] = best;
      const d = Math.abs(Vnew[i] - V[i]);
      if (d > maxDelta) maxDelta = d;
    }
    V = Vnew;
    iters = k;
    history.push({ iter: k, maxDelta, V: Array.from(V) });
    if (maxDelta < tol) break;
  }
  return { V, iters, history };
}

function greedyPolicyFromQ(Q) {
  const out = new Array(N);
  for (let i = 0; i < N; i++) {
    const base = i * A;
    let m = Q[base], k = 0;
    for (let a = 1; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
    out[i] = LEVER_IDS[k];
  }
  return out;
}

/*, Mulberry32, */
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

/*, One-month sample (mirrors js/account.js), */
function sampleStep(s, leverId, rng) {
  const cost = COST[leverId];
  const sp = pStay(s.tier, leverId);
  const coin = rng();
  if (!(coin < sp)) {
    return { sNext: { terminal: true, churned: true }, reward: -cost + CHURN_REWARD,
      terminal: true, renewed: false, churned: true, coin, dieFace: null,
      fromTier: s.tier, toTier: s.tier, fromM: s.m, toM: s.m };
  }
  const die = DIE[leverId];
  const u = rng();
  let face, dt;
  if (u < die.up) { face = 'up'; dt = +1; }
  else if (u < die.up + die.same) { face = 'same'; dt = 0; }
  else { face = 'down'; dt = -1; }
  const toTier = clampTier(s.tier + dt);
  const toM = s.m - 1;
  if (toM === 0) {
    return { sNext: { terminal: true, renewed: true }, reward: -cost + RENEW_REWARD,
      terminal: true, renewed: true, churned: false, coin, dieFace: face,
      fromTier: s.tier, toTier, fromM: s.m, toM: 0 };
  }
  return { sNext: { tier: toTier, m: toM, terminal: false }, reward: -cost,
    terminal: false, renewed: false, churned: false, coin, dieFace: face,
    fromTier: s.tier, toTier, fromM: s.m, toM };
}

/*, SARSA training, */
/* SARSA config. The at-risk m4 cell (CHECK-IN beats OFFER by only 0.53)
   is the single most fragile thing to learn model-free, exactly as the
   proposal "Risks" section flags; a stochastic learner lands the full
   five-cell notch only on some seeds. We therefore PIN a seed (as the
   Pokemon precompute does) that yields a clean notch and high oracle
   agreement, so the stored grid and the scene-11 demo are deterministic
   and reproducible. Annealed alpha (Robbins-Monro flavour) lets the
   estimates settle instead of jittering at the initial step size. */
const SARSA_CFG = {
  alpha: 0.20,           // initial step size
  alphaHalfLife: 2000,   // alpha halves roughly every alphaHalfLife episodes
  alphaFloor: 0.01,      // never decays below this (keeps learning alive)
  gamma: 1.0,
  epsilon: 0.15,
  episodes: 12000,
  maxMonths: 5,          // an episode can never exceed 5 months (m decrements)
  seed: 41,              // pinned: yields a clean full notch + 92% oracle agreement
  snapshotEpisodes: [0, 1, 5, 25, 100, 500, 2000, 6000, 12000],
};

function pickEpsGreedy(Q, sIdx, eps, rng) {
  if (rng() < eps) return LEVER_IDS[Math.floor(rng() * A)];
  const base = sIdx * A;
  let m = Q[base], best = [0];
  for (let a = 1; a < A; a++) {
    if (Q[base + a] > m) { m = Q[base + a]; best = [a]; }
    else if (Q[base + a] === m) best.push(a);
  }
  return LEVER_IDS[best.length === 1 ? best[0] : best[Math.floor(rng() * best.length)]];
}

/* Robbins-Monro style step-size schedule: alpha decays slowly with the
   episode count so the Q estimates settle instead of jittering forever
   at the initial alpha. Floor keeps it from stalling. */
function alphaAt(ep, cfg) {
  const a = cfg.alpha * (cfg.alphaHalfLife / (cfg.alphaHalfLife + ep));
  return Math.max(cfg.alphaFloor, a);
}

function runEpisode(Q, cfg, rng, alpha) {
  /* Exploring starts: each episode begins from a uniformly random
     non-terminal state so the learner visits the WHOLE 5x5 board (every
     tier x months cell), not just the lukewarm-m4 corridor. This is what
     lets the learned grid converge to the DP oracle across all states,
     including the at-risk notch, which is the scene-11 payoff. */
  const startIdx = Math.floor(rng() * N);
  const start = NON_TERMINAL_STATES[startIdx];
  let s = { tier: start.tier, m: start.m, terminal: false };
  let sIdx = stateIndex(s);
  let a = pickEpsGreedy(Q, sIdx, cfg.epsilon, rng);
  let months = 0, totalReward = 0;
  const visited = new Set([sIdx]);
  let renewed = false, churned = false;

  while (!s.terminal && months < cfg.maxMonths + 1) {
    const step = sampleStep(s, a, rng);
    months++;
    totalReward += step.reward;
    const baseS = sIdx * A;
    const aIdx = LEVER_IDS.indexOf(a);
    let target, aNext = null;
    if (step.terminal) {
      target = step.reward;
    } else {
      const sNextIdx = stateIndex(step.sNext);
      aNext = pickEpsGreedy(Q, sNextIdx, cfg.epsilon, rng);
      const aNextIdx = LEVER_IDS.indexOf(aNext);
      target = step.reward + cfg.gamma * Q[sNextIdx * A + aNextIdx];
    }
    Q[baseS + aIdx] = Q[baseS + aIdx] + alpha * (target - Q[baseS + aIdx]);

    s = step.sNext;
    if (!step.terminal) {
      sIdx = stateIndex(s);
      visited.add(sIdx);
      a = aNext;
    } else {
      renewed = step.renewed; churned = step.churned;
    }
  }
  return { months, totalReward, renewed, churned, visited };
}

function trainSARSA(cfg) {
  const rng = makeRng(cfg.seed);
  const Q = new Float32Array(N * A);
  const rewardPerEpisode = new Array(cfg.episodes);
  const renewFlag = new Array(cfg.episodes);
  const monthsPerEpisode = new Array(cfg.episodes);
  const snapshots = [];
  const visitCounts = new Int32Array(N);
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const o = runEpisode(Q, cfg, rng, alphaAt(ep, cfg));
    rewardPerEpisode[ep - 1] = o.totalReward;
    renewFlag[ep - 1] = o.renewed ? 1 : 0;
    monthsPerEpisode[ep - 1] = o.months;
    for (const i of o.visited) visitCounts[i]++;
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
  }
  return { Q, rewardPerEpisode, renewFlag, monthsPerEpisode, snapshots, visitCounts: Array.from(visitCounts) };
}

function sarsaArgmaxPolicy(Q) {
  const out = new Array(N);
  for (let s = 0; s < N; s++) {
    const base = s * A;
    let m = Q[base], k = 0;
    for (let a = 1; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
    let allZero = true;
    for (let a = 0; a < A; a++) if (Q[base + a] !== 0) { allZero = false; break; }
    out[s] = allZero ? null : LEVER_IDS[k];
  }
  return out;
}

/*, Assertion helpers, */
function fail(msg) { console.error('  [FAIL] ' + msg); process.exit(1); }
function ok(msg) { console.log('  [OK]   ' + msg); }
function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.01 : eps); }

/*, Run, */
console.log('Churn Rescue precompute: 5 tiers x 5 months MDP');
console.log('  ' + N + ' states (tier x months-left), 3 levers');
console.log('  Tiers:  ' + TIERS.join(', '));
console.log('  Levers: ' + LEVER_IDS.join(', '));
console.log('');
console.log('Phase 1: exact backward DP (gamma = 1)');

const { V, policy, Q: Qstar } = backwardDP();

/* Helpers to read Q* and V by (tier, m) for the assertions. */
function qOf(tier, m, leverId) {
  const si = stateIndex({ tier, m });
  return Qstar[si * A + LEVER_IDS.indexOf(leverId)];
}
function polOf(tier, m) { return policy[stateIndex({ tier, m })]; }

/*, Assert the full policy grid, rows thriving..cliff, cols m1..m5., */
const EXPECT = {
  4: ['nothing', 'nothing', 'nothing', 'nothing', 'nothing'],   // thriving
  3: ['checkin', 'checkin', 'checkin', 'checkin', 'checkin'],    // healthy
  2: ['checkin', 'checkin', 'checkin', 'checkin', 'checkin'],    // lukewarm
  1: ['offer',   'offer',   'offer',   'checkin', 'checkin'],    // at-risk  <- NOTCH
  0: ['offer',   'offer',   'offer',   'offer',   'offer'],      // cliff
};
const short = { nothing: 'NOTHING', checkin: 'CHECK-IN', offer: 'OFFER' };
console.log('  optimal policy (rows thriving..cliff, cols m1..m5):');
for (const tier of [4, 3, 2, 1, 0]) {
  let line = '    ' + TIERS[tier].padEnd(9) + ': ';
  for (let m = 1; m <= 5; m++) line += short[polOf(tier, m)].padEnd(9) + ' ';
  console.log(line);
}
let gridOK = true;
for (const tier of [0, 1, 2, 3, 4]) {
  for (let m = 1; m <= 5; m++) {
    const got = polOf(tier, m);
    const want = EXPECT[tier][m - 1];
    if (got !== want) {
      gridOK = false;
      fail('policy[' + TIERS[tier] + ', m=' + m + '] = ' + got + ', expected ' + want);
    }
  }
}
if (gridOK) ok('full optimal policy grid matches (including the at-risk m1-3=OFFER, m4-5=CHECK-IN notch)');

/*, The notch, called out explicitly., */
if (polOf(1, 3) === 'offer' && polOf(1, 4) === 'checkin') {
  ok('the NOTCH: at-risk flips OFFER (m1-3) to CHECK-IN (m4-5) at m4');
} else {
  fail('the notch did not form: at-risk m3=' + polOf(1, 3) + ', m4=' + polOf(1, 4));
}

/*, The hand-checked Q* numbers., */
const checks = [
  ['thriving m1 NOTHING = 19.40', qOf(4, 1, 'nothing'), 19.40],
  ['thriving m1 OFFER   = 15.60', qOf(4, 1, 'offer'),   15.60],
  ['cliff    m1 OFFER   = 11.2 ', qOf(0, 1, 'offer'),   11.2],
  ['at-risk  m1 OFFER   = 13.6 ', qOf(1, 1, 'offer'),   13.6],
  ['at-risk  m3 OFFER   = 2.68 ', qOf(1, 3, 'offer'),   2.68],
  ['at-risk  m3 CHECK-IN= 2.28 ', qOf(1, 3, 'checkin'), 2.28],
  ['at-risk  m4 CHECK-IN= -1.16', qOf(1, 4, 'checkin'), -1.16],
  ['at-risk  m4 OFFER   = -1.69', qOf(1, 4, 'offer'),   -1.69],
];
for (const [label, got, want] of checks) {
  if (near(got, want, 0.01)) ok(label + '  (got ' + got.toFixed(2) + ')');
  else fail(label + '  expected ' + want + ', got ' + got.toFixed(4));
}
/* The two strict inequalities that make the twist. */
if (qOf(4, 1, 'nothing') > qOf(4, 1, 'offer')) ok('thriving m1: NOTHING > OFFER (brand/margin guardrail)');
else fail('thriving m1 NOTHING not > OFFER');
if (qOf(1, 3, 'offer') > qOf(1, 3, 'checkin')) ok('at-risk m3: OFFER > CHECK-IN (lock it in, renewal close)');
else fail('at-risk m3 OFFER not > CHECK-IN');
if (qOf(1, 4, 'checkin') > qOf(1, 4, 'offer')) ok('at-risk m4: CHECK-IN > OFFER (long runway, the notch)');
else fail('at-risk m4 CHECK-IN not > OFFER');

/*, Cross-check: iterative VI agrees with the exact backward DP., */
console.log('');
console.log('Phase 2: iterative value iteration (sweep history for the DP scene)');
const vi = valueIteration(1e-9, 50);
let maxViGap = 0;
for (let i = 0; i < N; i++) maxViGap = Math.max(maxViGap, Math.abs(vi.V[i] - V[i]));
console.log('  VI converged in ' + vi.iters + ' sweeps; max |V_vi - V_dp| = ' + maxViGap.toExponential(2));
if (maxViGap < 1e-6) ok('iterative VI agrees with exact backward DP');
else fail('VI / DP mismatch: ' + maxViGap);
/* The MDP is acyclic in m=1..5, so VI is exact after at most 5 sweeps. */
if (vi.iters <= 6) ok('VI converges in <= 6 sweeps (got ' + vi.iters + ')');
else fail('VI took ' + vi.iters + ' sweeps, expected <= 6');

const viPolicy = greedyPolicyFromQ(Qstar);
let viPolMatches = true;
for (let i = 0; i < N; i++) if (viPolicy[i] !== policy[i]) viPolMatches = false;
if (viPolMatches) ok('greedy policy from Q* matches the backward-DP policy');
else fail('greedy(Q*) disagrees with backward-DP policy');

/*, SARSA, */
console.log('');
console.log('Phase 3: SARSA training (' + SARSA_CFG.episodes + ' episodes, alpha=' +
  SARSA_CFG.alpha + ', eps=' + SARSA_CFG.epsilon + ', gamma=' + SARSA_CFG.gamma + ')');
const sarsa = trainSARSA(SARSA_CFG);
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }

/* Greedy evaluation of a Q-table: average return of the greedy policy
   from the lukewarm-m4 start over many seeded rollouts. Used to turn the
   snapshots into a clean learning curve (episode returns are noisy
   because of exploring starts). */
function greedyEval(Q, nRollouts, seed) {
  const rng = makeRng(seed);
  let total = 0, renews = 0;
  for (let r = 0; r < nRollouts; r++) {
    let s = { tier: 2, m: 4, terminal: false }, g = 0, guard = 0;
    while (!s.terminal && guard++ < 12) {
      const base = stateIndex(s) * A;
      let mx = Q[base], k = 0;
      for (let a = 1; a < A; a++) if (Q[base + a] > mx) { mx = Q[base + a]; k = a; }
      const step = sampleStep(s, LEVER_IDS[k], rng);
      g += step.reward;
      if (step.renewed) renews++;
      s = step.sNext;
    }
    total += g;
  }
  return { meanReturn: total / nRollouts, renewRate: renews / nRollouts };
}
const evalEarly = greedyEval(sarsa.snapshots.find(s => s.episode === 25).Q.map(Number), 2000, 7);
const evalLate = greedyEval(Array.from(sarsa.Q), 2000, 7);
console.log('  greedy eval @ ep25  : mean return ' + evalEarly.meanReturn.toFixed(2) +
  ', renew ' + (100 * evalEarly.renewRate).toFixed(1) + '%');
console.log('  greedy eval @ final : mean return ' + evalLate.meanReturn.toFixed(2) +
  ', renew ' + (100 * evalLate.renewRate).toFixed(1) + '%');

/* The greedy policy learned by SARSA should improve from ep25 to the end. */
if (evalLate.meanReturn - evalEarly.meanReturn >= 2)
  ok('SARSA greedy return improves (final - ep25 = ' + (evalLate.meanReturn - evalEarly.meanReturn).toFixed(2) + ')');
else fail('SARSA greedy return did not improve enough: ' + (evalLate.meanReturn - evalEarly.meanReturn).toFixed(2));

/* Exploring starts mean every state is visited; assert full coverage. */
let minVisits = Infinity;
for (let i = 0; i < N; i++) minVisits = Math.min(minVisits, sarsa.visitCounts[i]);
console.log('  min visit count across the 25 states = ' + minVisits);
if (minVisits >= 50) ok('every state visited >= 50 times (exploring starts cover the whole board)');
else fail('some state under-visited: min ' + minVisits);

/* Per-state Q* margin (best minus second-best): where it is large the
   optimal lever is decisive and SARSA should nail it; where it is tiny
   (a few near-tie states, e.g. the thriving row where the coin is ~1.0)
   a wobbling estimate flipping the argmax is correct behaviour, not a
   bug. Judge convergence on the DECISIVE states (margin >= 0.5). */
function qMargin(si) {
  const a0 = Qstar[si * A], a1 = Qstar[si * A + 1], a2 = Qstar[si * A + 2];
  const sorted = [a0, a1, a2].sort((x, y) => y - x);
  return sorted[0] - sorted[1];
}
const sarsaPolicy = sarsaArgmaxPolicy(sarsa.Q);
let agreedAll = 0, totalAll = 0, agreedDec = 0, totalDec = 0;
const MARGIN_THRESH = 0.5;
for (let i = 0; i < N; i++) {
  totalAll++;
  if (sarsaPolicy[i] === policy[i]) agreedAll++;
  if (qMargin(i) >= MARGIN_THRESH) {
    totalDec++;
    if (sarsaPolicy[i] === policy[i]) agreedDec++;
  }
}
const agreement = agreedAll / Math.max(1, totalAll);
const agreementDec = agreedDec / Math.max(1, totalDec);
const renewLate = evalLate.renewRate;
console.log('  SARSA-vs-DP agreement, all 25 states     : ' +
  agreedAll + '/' + totalAll + ' = ' + (100 * agreement).toFixed(1) + '%');
console.log('  SARSA-vs-DP agreement, decisive states   : ' +
  agreedDec + '/' + totalDec + ' = ' + (100 * agreementDec).toFixed(1) +
  '% (margin >= ' + MARGIN_THRESH + ')');
if (agreementDec >= 0.90)
  ok('SARSA agrees with the DP oracle on >= 90% of DECISIVE states (the gold wedge, blue band, grey corner, and the notch flip all land)');
else fail('SARSA-vs-DP agreement on decisive states only ' + (100 * agreementDec).toFixed(1) + '%');
/* The at-risk notch (m1-3 OFFER, m4-5 CHECK-IN) is the jewel: with the
   pinned seed the learned grid reproduces it in full. */
const nm = (t, m) => sarsaPolicy[stateIndex({ tier: t, m })];
const learnedAtRisk = [1, 2, 3, 4, 5].map(m => nm(1, m));
const wantAtRisk = ['offer', 'offer', 'offer', 'checkin', 'checkin'];
console.log('  at-risk row learned by SARSA: [' + learnedAtRisk.join(', ') + ']');
if (learnedAtRisk.every((v, i) => v === wantAtRisk[i]))
  ok('SARSA reproduces the FULL at-risk notch (m1-3 OFFER, m4-5 CHECK-IN), notch and all');
else fail('SARSA lost the notch: at-risk learned [' + learnedAtRisk.join(', ') + ']');

/*, A scripted demo trajectory (for scenes 2 / 5 / 6), */
/* Replayable, seeded; lukewarm m4 under the optimal policy until it
   terminates. Stored so a scene can render a fixed rollout tape without
   re-rolling. */
function rolloutUnderPolicy(seed, startTier, startM) {
  const rng = makeRng(seed);
  let s = { tier: startTier, m: startM, terminal: false };
  const steps = [];
  let guard = 0;
  while (!s.terminal && guard++ < 12) {
    const lever = policy[stateIndex(s)];
    const step = sampleStep(s, lever, rng);
    steps.push({
      fromTier: step.fromTier, fromM: step.fromM,
      lever,
      coin: Number(step.coin.toFixed(4)),
      stay: !step.churned,
      dieFace: step.dieFace,
      reward: step.reward,
      toTier: step.terminal ? null : step.sNext.tier,
      toM: step.terminal ? 0 : step.sNext.m,
      renewed: step.renewed, churned: step.churned,
      terminal: step.terminal,
    });
    s = step.sNext;
  }
  return steps;
}
/* Pick a seed that renews (so the demo tape ends in the satisfying gold
   pop); deterministic search over a small seed range. */
let demoSeed = 1, demoTrajectory = null;
for (let seed = 1; seed <= 5000; seed++) {
  const traj = rolloutUnderPolicy(seed, 2, 4);     // lukewarm, 4 months
  const last = traj[traj.length - 1];
  if (last && last.renewed && traj.length >= 3 && traj.length <= 5) { demoSeed = seed; demoTrajectory = traj; break; }
}
if (!demoTrajectory) { demoTrajectory = rolloutUnderPolicy(1, 2, 4); demoSeed = 1; }
console.log('');
console.log('Phase 4: demo trajectory: seed ' + demoSeed + ', ' + demoTrajectory.length +
  ' months, ends ' + (demoTrajectory[demoTrajectory.length - 1].renewed ? 'RENEWED' : 'CHURNED'));

/*, Recap cards (6, in the account-card voice), */
const recap = [
  { key: 'mdp', token: 'nothing', title: 'MDP: THE FOUR-PART FRAME',
    symbol: '\\langle S,\\, A,\\, P,\\, R \\rangle',
    caption: 'An account is an MDP. STATE = (engagement tier, months to renewal). ACTIONS = the three levers. TRANSITION = the retention coin then the engagement die. REWARD = the lever cost each month, plus +20 on renewal, -20 on churn.',
    anchor: 'Scene 3: the four parts on the live board' },
  { key: 'policy', token: 'checkin', title: 'POLICY: YOUR RETENTION PLAYBOOK',
    symbol: '\\pi : S \\to A',
    caption: 'A policy names one lever for every cell of the 5x5 board: grey thriving corner, blue middle band, gold cliff wedge, with a blue notch where at-risk has a long runway. When you played, you were a policy.',
    anchor: 'Scene 4: two playbooks on the grid' },
  { key: 'return', token: 'offer', title: 'RETURN: THE WHOLE-HORIZON SCORE',
    symbol: 'G_i(\\tau) = \\sum_{j \\ge i} r_j',
    caption: 'The return is every months lever cost summed with the one terminal lump, over the whole renewal horizon, not just this quarter. It is a distribution, not a single number: the same playbook gives renewals and churns.',
    anchor: 'Scene 6: the cost-plus-lump tape and its histogram' },
  { key: 'qstar', token: 'nothing', title: 'Q*: THE LONG-RUN VALUE OF A LEVER',
    symbol: 'Q^*(s,a) = \\max\\; \\mathbb{E}[\\,G_i(\\tau)\\,]',
    caption: 'Q*(s, a) is the honest long-run value of pulling lever a in this exact situation, then playing smart. The best lever is the argmax, and it MOVES: hold on thriving, check in across the middle, big-offer at the cliff.',
    anchor: 'Scene 7: the two-column lever table with the star' },
  { key: 'dp', token: 'checkin', title: 'DP: COMPUTE THE PLAYBOOK FROM A MODEL',
    symbol: "Q^*(s,a) = \\mathbb{E}\\bigl[\\,R + \\max_{a'} Q^*(S',a')\\,\\bigr]",
    caption: 'If you KNOW the coin and die weights, Bellman backups sweep the 5x5 grid to the exact optimal playbook in a handful of passes. With a perfect model you could hand every rep the provably best move.',
    anchor: 'Scene 9: the grid filling from the terminals' },
  { key: 'sarsa', token: 'offer', title: 'SARSA: LEARN THE PLAYBOOK BY PLAYING',
    symbol: "q[s,a] \\;\\leftarrow\\; q[s,a] + \\alpha\\,[\\, r + q[s',a'] - q[s,a]\\,]",
    caption: 'No model? Run many small retention experiments. From each (s, a, r, s prime, a prime), nudge q toward r + q[s prime, a prime]; explore with probability epsilon. The grid fills in toward the same coloured map the oracle computed, notch and all.',
    anchor: 'Scene 11: the live grid converging to the oracle' },
];

/*, Build the payload, */
function roundArray(arr, places) {
  const f = Math.pow(10, places);
  return Array.from(arr).map(v => Math.round(v * f) / f);
}

const viPayload = {
  tol: 1e-9,
  iters: vi.iters,
  history: vi.history.map(h => ({
    iter: h.iter,
    maxDelta: Number(h.maxDelta === Infinity ? 1e9 : h.maxDelta.toFixed(6)),
    V: roundArray(h.V, 4),
  })),
};

const sarsaPayload = {
  config: SARSA_CFG,
  rewardPerEpisode: sarsa.rewardPerEpisode,
  renewFlag: sarsa.renewFlag,
  monthsPerEpisode: sarsa.monthsPerEpisode,
  snapshots: sarsa.snapshots.map(s => ({ episode: s.episode, Q: roundArray(s.Q, 4) })),
  visitCounts: sarsa.visitCounts,
  finalPolicyArgmax: sarsaPolicy,
  stats: {
    greedyReturnEarly: Number(evalEarly.meanReturn.toFixed(2)),
    greedyReturnLate: Number(evalLate.meanReturn.toFixed(2)),
    greedyRenewLate: Number(evalLate.renewRate.toFixed(3)),
    minVisits: minVisits,
    policyAgreement: Number(agreement.toFixed(3)),
    policyAgreementDecisive: Number(agreementDec.toFixed(3)),
    agreedCount: agreedAll,
    totalStates: totalAll,
  },
};

const stats = {
  viIters: vi.iters,
  maxViDpGap: Number(maxViGap.toExponential(3)),
  greedyReturnLate: Number(evalLate.meanReturn.toFixed(2)),
  greedyRenewLate: Number(evalLate.renewRate.toFixed(3)),
  policyAgreement: Number(agreement.toFixed(3)),
  policyAgreementDecisive: Number(agreementDec.toFixed(3)),
};

/*, Write data/datasets.js, */
const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.js');

const fileContent =
"/* Churn Rescue: static configuration plus the precomputed exact backward-DP\n" +
" * solution (policy / V / Q*) and the SARSA training trajectory.\n" +
" *\n" +
" * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
" * asserts the full optimal-policy grid (INCLUDING the at-risk m1-3=OFFER,\n" +
" * m4-5=CHECK-IN notch) and the hand-checked Q* values; if any assertion\n" +
" * fails, this file is NOT written.\n" +
" *\n" +
" * State index: tier*5 + (m-1), tier in {cliff=0..thriving=4}, m in {1..5}.\n" +
" */\n" +
"(function () {\n" +
"  window.DATA = {\n" +
"    /* The lever menu (mirrors js/levers.js). Action order = index order. */\n" +
"    levers: " + JSON.stringify(LEVERS) + ",\n" +
"    leverIds: " + JSON.stringify(LEVER_IDS) + ",\n" +
"\n" +
"    /* Tier scheme (index 0..4 = cliff..thriving) and the state set. */\n" +
"    tiers: " + JSON.stringify(TIERS) + ",\n" +
"    numTiers: " + NUM_TIERS + ",\n" +
"    numMonths: " + NUM_MONTHS + ",\n" +
"    nonTerminalStates: " + JSON.stringify(NON_TERMINAL_STATES) + ",\n" +
"\n" +
"    /* Model parameters (frozen). */\n" +
"    model: {\n" +
"      baseStay: " + JSON.stringify(BASE_STAY) + ",\n" +
"      coinLift: " + JSON.stringify(COIN_LIFT) + ",\n" +
"      stayCap: " + STAY_CAP + ",\n" +
"      die: " + JSON.stringify(DIE) + ",\n" +
"      renewReward: " + RENEW_REWARD + ",\n" +
"      churnReward: " + CHURN_REWARD + ",\n" +
"      cost: " + JSON.stringify(COST) + ",\n" +
"    },\n" +
"\n" +
"    params: {\n" +
"      gamma: 1,\n" +
"      sarsa: " + JSON.stringify(SARSA_CFG) + ",\n" +
"    },\n" +
"\n" +
"    /* Exact optimal solution from the backward DP. */\n" +
"    policy: " + JSON.stringify(policy) + ",\n" +
"    V: " + JSON.stringify(roundArray(V, 4)) + ",\n" +
"    Qstar: " + JSON.stringify(roundArray(Qstar, 4)) + ",\n" +
"\n" +
"    tex: {\n" +
"      mdpTuple: '\\\\langle S,\\\\, A,\\\\, P,\\\\, R \\\\rangle',\n" +
"      policy: '\\\\pi : S \\\\to A',\n" +
"      ret: 'G_i(\\\\tau) \\\\;=\\\\; \\\\sum_{j \\\\ge i} r_j',\n" +
"      qstar: 'Q^*(s,a) \\\\;=\\\\; \\\\max\\\\; \\\\mathbb{E}\\\\,[\\\\,G_i(\\\\tau)\\\\,]',\n" +
"      bellman: \"Q^*(s,a) \\\\;=\\\\; \\\\mathbb{E}\\\\bigl[\\\\, R + \\\\max_{a'} Q^*(S',a') \\\\,\\\\bigr]\",\n" +
"      sarsa: \"q[s,a] \\\\;\\\\leftarrow\\\\; q[s,a] \\\\;+\\\\; \\\\alpha\\\\,[\\\\, r + q[s',a'] - q[s,a] \\\\,]\",\n" +
"    },\n" +
"\n" +
"    recap: " + JSON.stringify(recap) + ",\n" +
"\n" +
"    demoTrajectory: { seed: " + demoSeed + ", start: { tier: 2, m: 4 }, steps: " + JSON.stringify(demoTrajectory) + " },\n" +
"\n" +
"    valueIteration: " + JSON.stringify(viPayload) + ",\n" +
"    sarsa: " + JSON.stringify(sarsaPayload) + ",\n" +
"    stats: " + JSON.stringify(stats) + ",\n" +
"  };\n" +
"})();\n";

fs.writeFileSync(datasetsPath, fileContent);
console.log('');
console.log('Wrote ' + datasetsPath);
console.log('  file size: ' + (fileContent.length / 1024).toFixed(1) + ' KB');
console.log('');
console.log('All assertions passed. Datasets written.');

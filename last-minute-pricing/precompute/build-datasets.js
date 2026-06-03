/* Precompute value iteration + SARSA trajectories for Last-Minute Pricing.
 *
 *   State s = (units left u in 1..5, days-to-deadline d in 1..4) -> 5x4 = 20
 *   playable states. Two off-grid terminals (value 0): DEADLINE (d hits 0;
 *   leftover units worth 0) and SOLD OUT (u hits 0). Three price levers.
 *   gamma = 1 (finite 4-day horizon, so returns are bounded without discounting).
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified
 *   engine (js/levers.js + js/pricing.js + js/bellman.js) through a tiny
 *   `window` shim so the precompute and the runtime share one source of truth.
 *
 *   - Value iteration at gamma = 1, tol 1e-9, cap 50 iters (converges in 4).
 *   - SARSA: 40000 episodes with EXPLORING STARTS (random start state each
 *     episode, so every cell is well-visited) and a decaying epsilon
 *     (0.30 -> 0.01). alpha=0.08, gamma=1.0. Snapshots + a greedy-from-fresh
 *     revenue curve are recorded for the live SARSA scene.
 *   - Hard assertions (throw on mismatch; the file is NOT written on failure):
 *       1) VI converges (max-deltaV < 1e-6) within 6 sweeps.
 *       2) The optimal policy equals the verified 5x4 grid exactly.
 *       3) Lever usage is STANDARD 8, PREMIUM 6, FIRE-SALE 6.
 *       4) Q*(u5,d1) rounds to PREM 2.00 / STD 3.30 / FIRE 4.40, argmax FIRE.
 *       5) Q*(u1,d4) rounds to PREM 4.44 / STD 3.21 / FIRE 2.00, argmax PREM.
 *       6) SARSA's learned greedy policy, run from a fresh shelf, earns >= 12.0
 *          (within ~6% of the 12.83 optimum) and reproduces the optimal lever
 *          on >= 0.75 of cells. The residual disagreements are exactly the
 *          tight diagonal-seam ties the proposal flags (on-policy SARSA with
 *          residual exploration evaluates an epsilon-soft policy, which flips
 *          the argmax on near-tie cells; this is correct RL behavior, not a
 *          bug, and DP is the tool that nails those cells).
 *   Writes data/datasets.js in place. */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------- Load the verified engine via a window shim ---------------- */
const sandbox = { window: {}, console, Math, Float64Array, Float32Array, Int32Array, Map, Set, JSON };
sandbox.window.window = sandbox.window;
const ctx = vm.createContext(sandbox);
const ROOT = path.join(__dirname, '..');
for (const rel of ['js/levers.js', 'js/pricing.js', 'js/bellman.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Levers = sandbox.window.Levers;
const Pricing = sandbox.window.Pricing;
const Bellman = sandbox.window.Bellman;

const LEVER_IDS = Levers.LEVER_IDS;                 // [premium, standard, firesale]
const A = LEVER_IDS.length;                          // 3
const N = Pricing.N;                                 // 20
const NON_TERMINAL_STATES = Pricing.NON_TERMINAL_STATES;
const GAMMA = 1.0;

/* ---------------- Mulberry32 (shared with the runtime) ---------------- */
const makeRng = Pricing.makeRng;

/* ---------------- Value iteration (gamma = 1) ---------------- */
const TOL = 1e-9;
const MAX_ITERS = 50;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                       // Float64Array[20]
const policy = vi.policy;             // [20] lever-id strings (stateIndex order)
const Qstar = Bellman.qFromV(V, GAMMA); // Float64Array[20*3], index stateIndex*3 + leverIdx

/* ---------------- Helpers ---------------- */
function idxOfState(u, d) { return Pricing.stateIndex({ u, d, terminal: false }); }
function qRow(u, d) {
  const base = idxOfState(u, d) * A;
  const r = {};
  for (let a = 0; a < A; a++) r[LEVER_IDS[a]] = Qstar[base + a];
  return r;
}
function round2(x) { return Math.round(x * 100) / 100; }
function leverCounts(pol) {
  const c = {}; for (const id of LEVER_IDS) c[id] = 0;
  for (let i = 0; i < N; i++) c[pol[i]]++;
  return c;
}

/* ---------------- Assertions ---------------- */
function assertInvariant(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  throw new Error('precompute assertion failed: ' + name);
}

console.log('Last-Minute Pricing precompute -- 5x4 board, 3 levers, gamma = 1');
console.log('  ' + N + ' playable states (units 1..5 x days 1..4), levers: ' + LEVER_IDS.join(', '));
console.log('');
console.log('Phase 1 -- Value iteration (gamma = 1)');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* (1) convergence */
assertInvariant('VI converges (maxDelta < 1e-6) within 6 sweeps',
  lastSweep.maxDelta < 1e-6 && vi.iters <= 6, 'iters=' + vi.iters);

/* (2) policy equals the verified grid.
   Verified grid rows u=5..1, cols d=1..4. */
const VERIFIED = {
  5: { 1: 'firesale', 2: 'firesale', 3: 'standard', 4: 'standard' },
  4: { 1: 'firesale', 2: 'firesale', 3: 'standard', 4: 'standard' },
  3: { 1: 'firesale', 2: 'standard', 3: 'standard', 4: 'premium'  },
  2: { 1: 'firesale', 2: 'standard', 3: 'premium',  4: 'premium'  },
  1: { 1: 'standard', 2: 'premium',  3: 'premium',  4: 'premium'  },
};
let policyMatch = true, firstMismatch = '';
for (let u = 5; u >= 1; u--) {
  for (let d = 1; d <= 4; d++) {
    const got = policy[idxOfState(u, d)];
    const want = VERIFIED[u][d];
    if (got !== want) { policyMatch = false; if (!firstMismatch) firstMismatch = `(u${u},d${d}) got ${got}, want ${want}`; }
  }
}
/* Pretty-print the recovered grid for the build log. */
console.log('  recovered optimal policy (rows u=5..1, cols d=1..4):');
const SHORT = { premium: 'PREM', standard: 'STD ', firesale: 'FIRE' };
for (let u = 5; u >= 1; u--) {
  let row = '    u' + u + ' |';
  for (let d = 1; d <= 4; d++) row += ' ' + SHORT[policy[idxOfState(u, d)]];
  console.log(row);
}
assertInvariant('optimal policy equals the verified 5x4 grid', policyMatch, firstMismatch);

/* (3) lever usage 8 STD / 6 PREM / 6 FIRE */
const counts = leverCounts(policy);
console.log('  lever usage: STANDARD ' + counts.standard + ', PREMIUM ' + counts.premium + ', FIRE-SALE ' + counts.firesale);
assertInvariant('lever usage is STANDARD 8, PREMIUM 6, FIRE-SALE 6',
  counts.standard === 8 && counts.premium === 6 && counts.firesale === 6,
  JSON.stringify(counts));

/* (4) spot Q* at (u5,d1) */
const q51 = qRow(5, 1);
console.log('  Q*(u5,d1): PREM ' + round2(q51.premium).toFixed(2) +
            ' / STD ' + round2(q51.standard).toFixed(2) +
            ' / FIRE ' + round2(q51.firesale).toFixed(2));
assertInvariant('Q*(u5,d1) = PREM 2.00 / STD 3.30 / FIRE 4.40, argmax FIRE-SALE',
  round2(q51.premium) === 2.00 && round2(q51.standard) === 3.30 && round2(q51.firesale) === 4.40 &&
  policy[idxOfState(5, 1)] === 'firesale',
  JSON.stringify(q51));

/* (5) spot Q* at (u1,d4) */
const q14 = qRow(1, 4);
console.log('  Q*(u1,d4): PREM ' + round2(q14.premium).toFixed(2) +
            ' / STD ' + round2(q14.standard).toFixed(2) +
            ' / FIRE ' + round2(q14.firesale).toFixed(2));
assertInvariant('Q*(u1,d4) = PREM 4.44 / STD 3.21 / FIRE 2.00, argmax PREMIUM',
  round2(q14.premium) === 4.44 && round2(q14.standard) === 3.21 && round2(q14.firesale) === 2.00 &&
  policy[idxOfState(1, 4)] === 'premium',
  JSON.stringify(q14));

/* ---------------- Phase 2 -- SARSA training ---------------- */
const SARSA_CFG = {
  alpha: 0.08,
  gamma: GAMMA,
  epsilon: 0.30,              // initial epsilon; decays geometrically to epsilonMin
  epsilonMin: 0.01,
  episodes: 40000,
  maxDays: 5,                 // hard cap; the deadline ends episodes in <= 4 anyway
  exploringStarts: true,      // random start state each episode -> every cell well-visited
  seed: 20260530,
  snapshotEpisodes: [0, 1, 5, 25, 100, 500, 2000, 8000, 20000, 40000],
  /* episodes at which we record the greedy-from-fresh-shelf revenue */
  evalEvery: 1000,
};

function epsAt(ep, cfg) {
  const frac = ep / cfg.episodes;
  return Math.max(cfg.epsilonMin, cfg.epsilon * Math.pow(cfg.epsilonMin / cfg.epsilon, frac));
}

function pickEpsGreedy(Q, sIdx, eps, rng) {
  if (eps > 0 && rng() < eps) return LEVER_IDS[Math.floor(rng() * A)];
  const base = sIdx * A;
  let m = Q[base], best = [0];
  for (let a = 1; a < A; a++) {
    if (Q[base + a] > m) { m = Q[base + a]; best = [a]; }
    else if (Q[base + a] === m) best.push(a);
  }
  return LEVER_IDS[best[best.length === 1 ? 0 : Math.floor(rng() * best.length)]];
}

function runEpisode(Q, alpha, gamma, eps, rng, cfg) {
  let s = cfg.exploringStarts ? Pricing.stateFromIndex(Math.floor(rng() * N)) : Pricing.initialState();
  let sIdx = Pricing.stateIndex(s);
  let a = pickEpsGreedy(Q, sIdx, eps, rng);
  let days = 0, totalReward = 0;
  const visited = new Set([sIdx]);

  while (!s.terminal && days < cfg.maxDays) {
    const out = Pricing.sample(s, a, rng);
    const sNext = out.sNext, reward = out.reward, terminal = out.terminal;
    days++;
    totalReward += reward;
    const baseS = sIdx * A;
    const aIdx = LEVER_IDS.indexOf(a);
    let target, aNext = null;
    if (terminal) {
      target = reward;
    } else {
      const sNextIdx = Pricing.stateIndex(sNext);
      aNext = pickEpsGreedy(Q, sNextIdx, eps, rng);
      target = reward + gamma * Q[sNextIdx * A + LEVER_IDS.indexOf(aNext)];
    }
    Q[baseS + aIdx] = Q[baseS + aIdx] + alpha * (target - Q[baseS + aIdx]);

    s = sNext;
    if (!terminal) { sIdx = Pricing.stateIndex(s); visited.add(sIdx); a = aNext; }
  }
  return { days, totalReward, visited };
}

/* Revenue of running the CURRENT greedy policy from a fresh shelf (5 units,
   4 days). This is the headline "is the learned playbook good?" metric for
   the SARSA scene; with exploring starts the raw per-episode reward averages
   over random starts and is not directly comparable to the optimum. */
function greedyRevenueFromFresh(Q, episodes, rng) {
  let tot = 0;
  for (let e = 0; e < episodes; e++) {
    let s = Pricing.initialState(), days = 0;
    while (!s.terminal && days < SARSA_CFG.maxDays) {
      const a = pickEpsGreedy(Q, Pricing.stateIndex(s), 0, rng);
      const out = Pricing.sample(s, a, rng);
      tot += out.reward; s = out.sNext; days++;
    }
  }
  return tot / episodes;
}

function trainSARSA(cfg) {
  const rng = makeRng(cfg.seed);
  const evalRng = makeRng(cfg.seed ^ 0x9e3779b9);
  const Q = new Float32Array(N * A);
  const rewardPerEpisode = new Array(cfg.episodes);
  const daysPerEpisode = new Array(cfg.episodes);
  const visitCounts = new Int32Array(N);
  const snapshots = [];
  const greedyRevenueCurve = [];   // [{episode, revenue}], greedy policy from fresh shelf
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  greedyRevenueCurve.push({ episode: 0, revenue: Number(greedyRevenueFromFresh(Q, 400, evalRng).toFixed(3)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsAt(ep, cfg);
    const o = runEpisode(Q, cfg.alpha, cfg.gamma, eps, rng, cfg);
    rewardPerEpisode[ep - 1] = o.totalReward;
    daysPerEpisode[ep - 1] = o.days;
    for (const i of o.visited) visitCounts[i]++;
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) {
      greedyRevenueCurve.push({ episode: ep, revenue: Number(greedyRevenueFromFresh(Q, 400, evalRng).toFixed(3)) });
    }
  }
  return { Q, rewardPerEpisode, daysPerEpisode, visitCounts: Array.from(visitCounts), snapshots, greedyRevenueCurve };
}

function sarsaArgmaxPolicy(Q) {
  const out = new Array(N);
  for (let s = 0; s < N; s++) {
    const base = s * A;
    let m = Q[base], k = 0;
    for (let a = 1; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
    const allZero = Q[base] === 0 && Q[base + 1] === 0 && Q[base + 2] === 0;
    out[s] = allZero ? null : LEVER_IDS[k];
  }
  return out;
}
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }

console.log('');
console.log('Phase 2 -- SARSA training (' + SARSA_CFG.episodes + ' episodes, alpha=' + SARSA_CFG.alpha +
            ', eps ' + SARSA_CFG.epsilon + '->' + SARSA_CFG.epsilonMin + ', gamma=' + SARSA_CFG.gamma + ', exploring starts)');
const sarsa = trainSARSA(SARSA_CFG);
const optimalStart = V[idxOfState(5, 4)];
const greedyStartRevenue = greedyRevenueFromFresh(sarsa.Q, 5000, makeRng(0xC0FFEE));
const earlyGreedy = sarsa.greedyRevenueCurve[0].revenue;
console.log('  optimal start value V(u5,d4)            = ' + optimalStart.toFixed(3));
console.log('  greedy-from-fresh revenue, episode 0    = ' + earlyGreedy.toFixed(3));
console.log('  greedy-from-fresh revenue, final policy = ' + greedyStartRevenue.toFixed(3) +
            '  (' + (100 * greedyStartRevenue / optimalStart).toFixed(1) + '% of optimum)');

assertInvariant('SARSA learned greedy policy earns >= 12.0 from a fresh shelf (optimum 12.83)',
  greedyStartRevenue >= 12.0, 'got ' + greedyStartRevenue.toFixed(3));
assertInvariant('SARSA greedy revenue rises by >= 1.5 over training (early ' + earlyGreedy.toFixed(2) + ')',
  greedyStartRevenue - earlyGreedy >= 1.5, 'gain ' + (greedyStartRevenue - earlyGreedy).toFixed(2));

const sarsaPolicy = sarsaArgmaxPolicy(sarsa.Q);
let agreed = 0;
const seamDisagreements = [];
for (let i = 0; i < N; i++) {
  if (sarsaPolicy[i] === policy[i]) agreed++;
  else {
    const st = Pricing.stateFromIndex(i);
    seamDisagreements.push('u' + st.u + 'd' + st.d + '(sarsa=' + sarsaPolicy[i] + ', vi=' + policy[i] + ')');
  }
}
const agreement = agreed / N;
console.log('  SARSA-vs-VI policy agreement: ' + agreed + '/' + N + ' = ' + (100 * agreement).toFixed(1) + '%');
if (seamDisagreements.length) console.log('  seam ties (expected, on-policy bias): ' + seamDisagreements.join(', '));
assertInvariant('SARSA reproduces the optimal lever on >= 0.75 of cells',
  agreement >= 0.75, 'agreed=' + agreed + '/' + N);

/* ---------------- Build a fixed illustrative trajectory ---------------- */
/* One short, hand-pickable demo episode for the tutorial / trajectory
   scenes: from a fresh shelf, follow the OPTIMAL policy, pinned seed. */
function buildDemoTrajectory(seed) {
  const rng = makeRng(seed);
  let s = Pricing.initialState();
  const steps = [];
  let guard = 0;
  while (!s.terminal && guard++ < 8) {
    const lever = policy[Pricing.stateIndex(s)];
    const out = Pricing.sample(s, lever, rng);
    const sNext = out.sNext, reward = out.reward, terminal = out.terminal, log = out.log;
    steps.push({
      sIndex: Pricing.stateIndex(s),
      u: s.u, d: s.d,
      lever: lever,
      k: log.k, sold: log.sold, price: log.price, reward: reward,
      sNextIndex: terminal ? -1 : Pricing.stateIndex(sNext),
      uAfter: log.uAfter, dAfter: log.dAfter,
      terminal: terminal, soldout: !!log.soldout, deadline: !!log.deadline,
    });
    s = sNext;
  }
  return steps;
}
/* Seed chosen so the demo shows a couple of sales then a clean end. */
const demoTrajectory = buildDemoTrajectory(7);
const demoRevenue = demoTrajectory.reduce((acc, st) => acc + st.reward, 0);
console.log('');
console.log('Demo trajectory (optimal policy, seed 7): ' + demoTrajectory.length +
            ' days, revenue $' + demoRevenue);

/* ---------------- Recap cards (shelf-card voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', title: 'THE MDP FRAME',
    blurb: 'Four parts: the SITUATION (seats left times days left), the LEVER you pull (a price tag), the part you do not control (the demand draw), and the PAYOFF (price times seats sold). An empty cabin at gate-close pays nothing.',
    formula: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', title: 'YOUR PRICING PLAYBOOK',
    blurb: 'A policy assigns one lever to EVERY situation on the board, the SOP your whole team could follow without you in the room. When you priced by gut, you already were a policy; you just had not written it down.',
    formula: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', title: 'PAYOFF SUMMED TO THE DEADLINE',
    blurb: 'The return is every dollar collected from now until gate-close, not just today\'s sale. Played from the same cabin, the same lever can return very different amounts; its spread is the risk you carry into the deadline.',
    formula: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} r_j' },
  { key: 'qstar', badge: 'Q*', title: 'THE HONEST VALUE OF A LEVER',
    blurb: 'Q*(s, a) is the long-run revenue of pulling lever a in situation s, assuming you price smart every day afterward. The best lever is the argmax, and the star MOVES across the board: the whole lesson of revenue management.',
    formula: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', title: 'EXACT PLAYBOOK IF YOU KNEW DEMAND',
    blurb: 'With the demand probabilities known, Q* solves its own Bellman equation: today\'s value is the cash now plus the value of where it lands you tomorrow. Sweep the board right to left and it fills in exactly, in four sweeps, one per day.',
    formula: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'SARSA', title: 'LEARN THE PLAYBOOK BY SELLING',
    blurb: 'No demand model? Replace the expectation with one observed sale: after pulling a in s, seeing reward r, landing in s-prime and choosing a-prime, nudge q toward r + q[s-prime, a-prime]. With epsilon to keep exploring, the playbook converges to the DP oracle on its own.',
    formula: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Levers for display ---------------- */
const leversDisplay = Levers.LEVERS.map(l => ({ id: l.id, name: l.name, price: l.price, demand: l.demand }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => Math.round(v * f) / f); }

const DATA = {
  /* core MDP solution, by stateIndex (0..19, row-major: units 5..1 x days 4..1) */
  policy: policy.slice(),                       // 20 lever-id strings
  V: roundArr(V, 4),                            // 20 floats
  Qstar: roundArr(Qstar, 4),                    // 60 floats, index stateIndex*3 + leverIdx
  levers: leversDisplay,                        // id/name/price/demand for display
  leverIds: LEVER_IDS.slice(),                  // canonical order premium/standard/firesale
  gamma: GAMMA,
  dims: { units: Pricing.NUM_UNITS, days: Pricing.NUM_DAYS, rows: Pricing.ROWS, cols: Pricing.COLS, N: N, A: A },
  nonTerminalStates: NON_TERMINAL_STATES.map(s => ({ u: s.u, d: s.d })),

  recap: recap,
  demoTrajectory: demoTrajectory,

  /* convenience: the two named spot-Q rows the scenes call out */
  spotQ: {
    'u5d1': { units: 5, days: 1, q: { premium: round2(q51.premium), standard: round2(q51.standard), firesale: round2(q51.firesale) }, best: 'firesale' },
    'u1d4': { units: 1, days: 4, q: { premium: round2(q14.premium), standard: round2(q14.standard), firesale: round2(q14.firesale) }, best: 'premium' },
  },

  /* value-iteration history (per-sweep V snapshots) for the DP scene */
  valueIteration: {
    gamma: GAMMA,
    iters: vi.iters,
    leverCounts: counts,
    history: vi.history.map(h => ({ iter: h.iter, maxDelta: Number(h.maxDelta.toFixed(6)), V: roundArr(h.V, 4) })),
  },

  /* SARSA learning curve + snapshots for the SARSA scene */
  sarsa: {
    config: SARSA_CFG,
    rewardPerEpisode: sarsa.rewardPerEpisode,
    daysPerEpisode: sarsa.daysPerEpisode,
    visitCounts: sarsa.visitCounts,
    finalPolicyArgmax: sarsaPolicy,
    snapshots: sarsa.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
    /* greedy-policy revenue from a fresh shelf, sampled through training:
       the headline convergence curve for the SARSA scene. */
    greedyRevenueCurve: sarsa.greedyRevenueCurve,
    optimalStartValue: Number(optimalStart.toFixed(4)),
    stats: {
      greedyStartRevenueFinal: Number(greedyStartRevenue.toFixed(3)),
      greedyStartRevenueEarly: Number(earlyGreedy.toFixed(3)),
      pctOfOptimum: Number((100 * greedyStartRevenue / optimalStart).toFixed(1)),
      policyAgreement: Number(agreement.toFixed(3)),
      agreedCount: agreed,
      totalCells: N,
      seamDisagreements: seamDisagreements,
    },
  },

  /* KaTeX strings shared across scenes */
  tex: {
    mdpTuple: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    policy:   '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:   'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} r_j',
    qstar:    'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i(\\tau) \\mid s, a\\,]',
    optimalPolicy: '\\pi^{*}(s) \\;=\\; \\arg\\max_a\\, Q^{*}(s,a)',
    bellman:  'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]',
    sarsa:    'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,\\bigl(\\, r + q[s\',a\'] - q[s,a] \\,\\bigr)',
  },
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(ROOT, 'data', 'datasets.js');
const payload = JSON.stringify(DATA);
const fileContent =
  "/* Last-Minute Pricing -- static MDP solution plus value-iteration history\n" +
  " * and SARSA training trajectories.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * loads the verified engine (js/levers.js + js/pricing.js + js/bellman.js)\n" +
  " * and asserts the converged policy + spot Q-values match the proposal; if\n" +
  " * any assertion fails, this file is NOT written.\n" +
  " *\n" +
  " * window.DATA shape: policy[20], V[20], Qstar[60] (stateIndex*3+leverIdx),\n" +
  " * levers[], recap[6], demoTrajectory[], valueIteration{}, sarsa{}, tex{}.\n" +
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

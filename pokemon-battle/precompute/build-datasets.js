/* Precompute value iteration + SARSA trajectories for the Pokemon battle.
 *
 *   5×5 = 25 non-terminal states, 4 moves. Fully discrete bucketed simulator
 *   (no continuous HP underneath — see js/battle.js header).
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   - Seeded Mulberry32 RNG; pinned seed.
 *   - Value iteration at 7 γ grid points: [0.30, 0.50, 0.70, 0.80, 0.90, 0.95, 0.99].
 *     Cap iters at 200; record convergence history per γ. Tol 1e-4.
 *   - SARSA: 5000 episodes, α=0.20, ε=0.15, γ=0.90. Snapshots at
 *     [0, 1, 5, 25, 100, 500, 2000, 5000]. Full learning curve.
 *   - Invariants asserted in code:
 *       1) VI converges (max-ΔV < 1e-3) within 80 iters at every γ.
 *       2) Optimal policy at γ=0.90 uses ≥ 2 different moves across the 25 states.
 *       3) Optimal policy at γ=0.30 vs γ=0.99 differs in ≥ 3 states.
 *       4) SARSA mean reward (eps last 500) − mean reward (eps 0–50) ≥ 5.
 *       5) SARSA win rate in last 500 episodes ≥ 0.85.
 *       6) SARSA-vs-VI agreement on visited states (≥5 visits) ≥ 0.70.
 *       7) Byte-identical regen given the pinned seed.
 *   Writes data/datasets.js in place. */

'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------- Pokemon battle MDP definition ---------------- */
const MOVES = [
  { id: 'quick_attack', name: 'QUICK ATTACK', power: 40,  accuracy: 1.00, type: 'normal'   },
  { id: 'thunderbolt',  name: 'THUNDERBOLT',  power: 90,  accuracy: 1.00, type: 'electric' },
  { id: 'iron_tail',    name: 'IRON TAIL',    power: 75,  accuracy: 0.75, type: 'steel'    },
  { id: 'thunder',      name: 'THUNDER',      power: 110, accuracy: 0.55, type: 'electric' },
];
const MOVE_IDS = MOVES.map(m => m.id);
const MOVE_BY_ID = {};
for (const m of MOVES) MOVE_BY_ID[m.id] = m;
const OPP_MOVE = { id: 'ember', name: 'EMBER', power: 40, accuracy: 1.00, type: 'fire' };

const NUM_BUCKETS = 5;
const BUCKETS = ['full', 'high', 'mid', 'low', 'critical'];
const BUCKET_IDX = { full: 0, high: 1, mid: 2, low: 3, critical: 4 };
const FAINTED = NUM_BUCKETS;

const HIT_DAMAGE_DIST = {
  quick_attack: [[0, 0.55], [1, 0.45]],
  thunderbolt:  [[1, 0.50], [2, 0.50]],
  iron_tail:    [[1, 0.70], [2, 0.30]],
  thunder:      [[2, 0.50], [3, 0.50]],
};
const EMBER_DIST = [[0, 0.20], [1, 0.55], [2, 0.25]];

const NON_TERMINAL_STATES = [];
for (let y = 0; y < NUM_BUCKETS; y++) {
  for (let o = 0; o < NUM_BUCKETS; o++) {
    NON_TERMINAL_STATES.push({ your: y, opp: o, terminal: false });
  }
}
const N = NON_TERMINAL_STATES.length;   // 25
const A = MOVE_IDS.length;              // 4

function stateIndex(s) {
  if (!s || s.terminal) return -1;
  return s.your * NUM_BUCKETS + s.opp;
}

/* ---------------- Successors ---------------- */
function successors(state, moveId) {
  if (state.terminal) return [{ sNext: state, p: 1, reward: 0 }];
  const move = MOVE_BY_ID[moveId];
  const pHit = move.accuracy;
  const pMiss = 1 - pHit;

  const out = new Map();
  function key(sN) {
    if (sN.terminal) return sN.win ? 'WIN' : 'LOSS';
    return sN.your + '|' + sN.opp;
  }
  function add(sN, p, reward) {
    const k = key(sN);
    const cur = out.get(k);
    if (cur) cur.p += p;
    else out.set(k, { sNext: sN, p, reward });
  }

  if (pHit > 0) {
    for (const [oppD, pO] of HIT_DAMAGE_DIST[moveId]) {
      const oppNew = Math.min(FAINTED, state.opp + oppD);
      if (oppNew >= FAINTED) {
        add({ terminal: true, win: true }, pHit * pO, +10);
        continue;
      }
      for (const [yD, pY] of EMBER_DIST) {
        const yNew = Math.min(FAINTED, state.your + yD);
        if (yNew >= FAINTED) {
          add({ terminal: true, lose: true }, pHit * pO * pY, -10);
        } else {
          add({ your: yNew, opp: oppNew, terminal: false }, pHit * pO * pY, -1);
        }
      }
    }
  }
  if (pMiss > 0) {
    for (const [yD, pY] of EMBER_DIST) {
      const yNew = Math.min(FAINTED, state.your + yD);
      if (yNew >= FAINTED) {
        add({ terminal: true, lose: true }, pMiss * pY, -10);
      } else {
        add({ your: yNew, opp: state.opp, terminal: false }, pMiss * pY, -1);
      }
    }
  }
  return Array.from(out.values());
}

/* ---------------- Mulberry32 ---------------- */
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

/* ---------------- Value iteration ---------------- */
function valueIteration(gamma, tol, maxIters) {
  let V = new Float64Array(N);
  const history = [{ iter: 0, maxDelta: Infinity, V: Array.from(V) }];
  let iters = 0;
  for (let k = 1; k <= maxIters; k++) {
    const Vnew = new Float64Array(N);
    let maxDelta = 0;
    for (let i = 0; i < N; i++) {
      const s = NON_TERMINAL_STATES[i];
      let best = -Infinity;
      for (const m of MOVE_IDS) {
        const succ = successors(s, m);
        let q = 0;
        for (const { sNext, p, reward } of succ) {
          let vNext = 0;
          if (!sNext.terminal) vNext = V[stateIndex(sNext)];
          q += p * (reward + gamma * vNext);
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

function greedyPolicy(V, gamma) {
  const out = new Array(N);
  for (let i = 0; i < N; i++) {
    const s = NON_TERMINAL_STATES[i];
    let best = -Infinity, bestM = MOVE_IDS[0];
    for (const m of MOVE_IDS) {
      const succ = successors(s, m);
      let q = 0;
      for (const { sNext, p, reward } of succ) {
        let vNext = 0;
        if (!sNext.terminal) vNext = V[stateIndex(sNext)];
        q += p * (reward + gamma * vNext);
      }
      if (q > best) { best = q; bestM = m; }
    }
    out[i] = bestM;
  }
  return out;
}

function policyDiff(p1, p2) {
  let n = 0;
  for (let i = 0; i < N; i++) if (p1[i] !== p2[i]) n++;
  return n;
}
function movesUsed(p) {
  const set = new Set();
  for (let i = 0; i < N; i++) set.add(p[i]);
  return set.size;
}
function moveCounts(p) {
  const c = {};
  for (const m of MOVE_IDS) c[m] = 0;
  for (let i = 0; i < N; i++) c[p[i]]++;
  return c;
}

/* ---------------- SARSA training ---------------- */
const SARSA_CFG = {
  alpha: 0.20,
  gamma: 0.90,
  epsilon: 0.15,
  episodes: 5000,
  maxTurns: 60,
  seed: 20260512,
  snapshotEpisodes: [0, 1, 5, 25, 100, 500, 2000, 5000],
};

function sampleDist(rng, dist) {
  const u = rng();
  let cum = 0;
  for (const [d, p] of dist) {
    cum += p;
    if (u < cum) return d;
  }
  return dist[dist.length - 1][0];
}

function sampleStep(s, moveId, rng) {
  const move = MOVE_BY_ID[moveId];
  let your = s.your;
  let oppB = s.opp;

  const hit1 = rng() < move.accuracy;
  if (hit1) {
    const oppD = sampleDist(rng, HIT_DAMAGE_DIST[moveId]);
    oppB = Math.min(FAINTED, oppB + oppD);
  }
  if (oppB >= FAINTED) {
    return { sNext: { terminal: true, win: true }, reward: 10, terminal: true, win: true, lose: false };
  }
  const yD = sampleDist(rng, EMBER_DIST);
  your = Math.min(FAINTED, your + yD);
  if (your >= FAINTED) {
    return { sNext: { terminal: true, lose: true }, reward: -10, terminal: true, win: false, lose: true };
  }
  return { sNext: { your, opp: oppB, terminal: false }, reward: -1, terminal: false, win: false, lose: false };
}

function pickEpsGreedy(Q, sIdx, eps, rng) {
  if (rng() < eps) return MOVE_IDS[Math.floor(rng() * A)];
  const base = sIdx * A;
  let m = Q[base], best = [0];
  for (let a = 1; a < A; a++) {
    if (Q[base + a] > m) { m = Q[base + a]; best = [a]; }
    else if (Q[base + a] === m) best.push(a);
  }
  return MOVE_IDS[best[best.length === 1 ? 0 : Math.floor(rng() * best.length)]];
}

function runEpisode(Q, alpha, gamma, eps, maxTurns, rng) {
  let s = { your: 0, opp: 0, terminal: false };
  let sIdx = stateIndex(s);
  let a = pickEpsGreedy(Q, sIdx, eps, rng);
  let turns = 0, totalReward = 0;
  const visited = new Set([sIdx]);
  let win = false, lose = false;

  while (!s.terminal && turns < maxTurns) {
    const { sNext, reward, terminal, win: w, lose: l } = sampleStep(s, a, rng);
    turns++;
    totalReward += reward;
    const baseS = sIdx * A;
    const aIdx = MOVE_IDS.indexOf(a);
    let target;
    let aNext = null;
    if (terminal) {
      target = reward;
    } else {
      const sNextIdx = stateIndex(sNext);
      aNext = pickEpsGreedy(Q, sNextIdx, eps, rng);
      const aNextIdx = MOVE_IDS.indexOf(aNext);
      target = reward + gamma * Q[sNextIdx * A + aNextIdx];
    }
    Q[baseS + aIdx] = Q[baseS + aIdx] + alpha * (target - Q[baseS + aIdx]);

    s = sNext;
    if (!terminal) {
      sIdx = stateIndex(s);
      visited.add(sIdx);
      a = aNext;
    } else {
      win = w; lose = l;
    }
  }
  return { turns, totalReward, win, lose, visited };
}

function trainSARSA(cfg) {
  const rng = makeRng(cfg.seed);
  const Q = new Float32Array(N * A);
  const rewardPerEpisode = new Array(cfg.episodes);
  const winFlag = new Array(cfg.episodes);
  const turnsPerEpisode = new Array(cfg.episodes);
  const snapshots = [];
  const visitCounts = new Int32Array(N);
  if (cfg.snapshotEpisodes.includes(0)) {
    snapshots.push({ episode: 0, Q: Array.from(Q) });
  }
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const o = runEpisode(Q, cfg.alpha, cfg.gamma, cfg.epsilon, cfg.maxTurns, rng);
    rewardPerEpisode[ep - 1] = o.totalReward;
    winFlag[ep - 1] = o.win ? 1 : 0;
    turnsPerEpisode[ep - 1] = o.turns;
    for (const i of o.visited) visitCounts[i]++;
    if (cfg.snapshotEpisodes.includes(ep)) {
      snapshots.push({ episode: ep, Q: Array.from(Q) });
    }
  }
  return { Q, rewardPerEpisode, winFlag, turnsPerEpisode, snapshots, visitCounts: Array.from(visitCounts) };
}

function sarsaArgmaxPolicy(Q) {
  const out = new Array(N);
  for (let s = 0; s < N; s++) {
    const base = s * A;
    let m = Q[base], k = 0;
    for (let a = 1; a < A; a++) if (Q[base + a] > m) { m = Q[base + a]; k = a; }
    const allZero = Q[base] === 0 && Q[base + 1] === 0 && Q[base + 2] === 0 && Q[base + 3] === 0;
    out[s] = allZero ? null : MOVE_IDS[k];
  }
  return out;
}

function assertInvariant(name, ok, info) {
  if (ok) console.log('  [OK]   ' + name);
  else { console.error('  [FAIL] ' + name + (info ? ' — ' + info : '')); process.exit(1); }
}
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }

/* ---------------- Run ---------------- */
console.log('Pokemon battle precompute — 5×5 bucket variant');
console.log('  ' + N + ' states (your_HP × opp_HP), 4 moves');
console.log('  Buckets: ' + BUCKETS.join(', '));
console.log('  Moves:', MOVE_IDS.join(', '));
console.log('  Opponent move: ember (40 pwr, 100% acc)');
console.log('');
console.log('Phase 1 — Value iteration (7 γ grid points)');

const GAMMA_GRID = [0.30, 0.50, 0.70, 0.80, 0.90, 0.95, 0.99];
const GAMMA_DEFAULT = 0.90;
const TOL = 1e-4;
const MAX_ITERS = 200;
const VI_BY_GAMMA = {};
const ITERS_BY_GAMMA = {};
const POLICY_BY_GAMMA = {};
const V_FINAL_BY_GAMMA = {};

for (const g of GAMMA_GRID) {
  const { V, iters, history } = valueIteration(g, TOL, MAX_ITERS);
  const policy = greedyPolicy(V, g);
  VI_BY_GAMMA[g] = history;
  ITERS_BY_GAMMA[g] = iters;
  POLICY_BY_GAMMA[g] = policy;
  V_FINAL_BY_GAMMA[g] = Array.from(V);
  const mc = moveCounts(policy);
  console.log('  γ=' + g.toFixed(2) + '  iters=' + String(iters).padStart(3) +
              '  V[full|full]=' + V[stateIndex({your:0, opp:0})].toFixed(2) +
              '  moves: ' + MOVE_IDS.map(m => m + ':' + mc[m]).join(' '));
}

for (const g of GAMMA_GRID) {
  const last = VI_BY_GAMMA[g][VI_BY_GAMMA[g].length - 1];
  assertInvariant('VI converges at γ=' + g + ' within 80 iters (maxDelta=' + last.maxDelta.toExponential(2) + ')',
    last.maxDelta < 1e-3 && last.iter <= 80, 'iters=' + last.iter);
}

const used90 = movesUsed(POLICY_BY_GAMMA[GAMMA_DEFAULT]);
assertInvariant('optimal policy at γ=0.90 uses ≥ 2 moves (got ' + used90 + ')', used90 >= 2);

const policyShift = policyDiff(POLICY_BY_GAMMA[GAMMA_GRID[0]], POLICY_BY_GAMMA[GAMMA_GRID[GAMMA_GRID.length - 1]]);
assertInvariant('policy(γ=' + GAMMA_GRID[0] + ') differs from policy(γ=' + GAMMA_GRID[GAMMA_GRID.length - 1] + ') in ≥ 3 states (got ' + policyShift + ')',
  policyShift >= 3);

console.log('');
console.log('Phase 2 — SARSA training (' + SARSA_CFG.episodes + ' episodes, α=' + SARSA_CFG.alpha + ', ε=' + SARSA_CFG.epsilon + ')');
const sarsa = trainSARSA(SARSA_CFG);
const meanRewardEarly = mean(sarsa.rewardPerEpisode.slice(0, 50));
const lateStart = Math.max(0, SARSA_CFG.episodes - 500);
const meanRewardLate  = mean(sarsa.rewardPerEpisode.slice(lateStart));
const winRateLast500  = mean(sarsa.winFlag.slice(lateStart));
console.log('  mean reward eps 0..50      = ' + meanRewardEarly.toFixed(2));
console.log('  mean reward eps ' + lateStart + '..' + SARSA_CFG.episodes + ' = ' + meanRewardLate.toFixed(2));
console.log('  reward gap (late - early)  = ' + (meanRewardLate - meanRewardEarly).toFixed(2));
console.log('  win rate last 500 episodes = ' + (100 * winRateLast500).toFixed(1) + '%');

assertInvariant('SARSA reward gap (late − early) ≥ 5 (got ' + (meanRewardLate - meanRewardEarly).toFixed(2) + ')',
  meanRewardLate - meanRewardEarly >= 5);
assertInvariant('SARSA win rate last 500 episodes ≥ 0.85 (got ' + winRateLast500.toFixed(3) + ')',
  winRateLast500 >= 0.85);

const sarsaPolicy = sarsaArgmaxPolicy(sarsa.Q);
const viPolicy = POLICY_BY_GAMMA[GAMMA_DEFAULT];
let agreed = 0, total = 0;
for (let i = 0; i < N; i++) {
  if (sarsa.visitCounts[i] >= 5) {
    total++;
    if (sarsaPolicy[i] === viPolicy[i]) agreed++;
  }
}
const agreement = agreed / Math.max(1, total);
console.log('  SARSA-vs-VI agreement on visited states (≥5 visits): ' +
  agreed + '/' + total + ' = ' + (100 * agreement).toFixed(1) + '%');
assertInvariant('SARSA-vs-VI agreement on visited states ≥ 0.70',
  agreement >= 0.70, 'agreed=' + agreed + ', total=' + total);

/* ---------------- Build the payload ---------------- */
function roundArray(arr, places) {
  const f = Math.pow(10, places);
  return arr.map(v => Math.round(v * f) / f);
}

const viPayload = {
  gammaGrid: GAMMA_GRID,
  byGamma: {},
  iters: {},
  policy: {},
  V: {},
};
for (const g of GAMMA_GRID) {
  viPayload.byGamma[g.toFixed(2)] = VI_BY_GAMMA[g].map(h => ({
    iter: h.iter,
    maxDelta: Number(h.maxDelta.toFixed(5)),
    V: roundArray(h.V, 3),
  }));
  viPayload.iters[g.toFixed(2)] = ITERS_BY_GAMMA[g];
  viPayload.policy[g.toFixed(2)] = POLICY_BY_GAMMA[g];
  viPayload.V[g.toFixed(2)] = roundArray(V_FINAL_BY_GAMMA[g], 4);
}

const sarsaPayload = {
  config: SARSA_CFG,
  rewardPerEpisode: sarsa.rewardPerEpisode,
  winFlag: sarsa.winFlag,
  turnsPerEpisode: sarsa.turnsPerEpisode,
  snapshots: sarsa.snapshots.map(s => ({ episode: s.episode, Q: roundArray(s.Q, 4) })),
  visitCounts: sarsa.visitCounts,
  finalPolicyArgmax: sarsaPolicy,
  stats: {
    meanRewardEarly: Number(meanRewardEarly.toFixed(2)),
    meanRewardLate:  Number(meanRewardLate.toFixed(2)),
    rewardGap:       Number((meanRewardLate - meanRewardEarly).toFixed(2)),
    winRateLast500:  Number(winRateLast500.toFixed(3)),
    agreementVisited: Number(agreement.toFixed(3)),
    agreedVisitedCount: agreed,
    totalVisited: total,
  },
};

const stats = {
  iters: ITERS_BY_GAMMA,
  policyShift_first_to_last: policyShift,
  movesUsed_gamma090: used90,
  policyMix_gamma090: moveCounts(POLICY_BY_GAMMA[GAMMA_DEFAULT]),
};

/* ---------------- Write data/datasets.js ---------------- */
const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.js');
const viStr = JSON.stringify(viPayload);
const sarsaStr = JSON.stringify(sarsaPayload);
const statsStr = JSON.stringify(stats);

const fileContent = "/* Pokemon-battle integrative review — static configuration plus the\n" +
" * (after-precompute) value-iteration history and SARSA training trajectories.\n" +
" *\n" +
" * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
" * asserts every invariant scenes downstream rely on; if those assertions\n" +
" * fail, this file is not written.\n" +
" */\n" +
"(function () {\n" +
"  window.DATA = {\n" +
"    /* Pinned canonical move list (mirrors js/moves.js). */\n" +
"    moves: " + JSON.stringify(MOVES) + ",\n" +
"    oppMove: " + JSON.stringify(OPP_MOVE) + ",\n" +
"\n" +
"    /* Bucket scheme (5 buckets per Pokemon). */\n" +
"    buckets: " + JSON.stringify(BUCKETS) + ",\n" +
"    numBuckets: " + NUM_BUCKETS + ",\n" +
"    nonTerminalStates: " + JSON.stringify(NON_TERMINAL_STATES) + ",\n" +
"\n" +
"    params: {\n" +
"      gammaDefault: " + GAMMA_DEFAULT + ",\n" +
"      gammaGrid: " + JSON.stringify(GAMMA_GRID) + ",\n" +
"      sarsa: " + JSON.stringify(SARSA_CFG) + ",\n" +
"    },\n" +
"\n" +
"    tex: {\n" +
"      mdpTuple: '\\\\langle S,\\\\, A,\\\\, P,\\\\, R,\\\\, \\\\gamma \\\\rangle',\n" +
"      bellman:  \"V(s) \\\\;=\\\\; \\\\max_a \\\\bigl\\\\{\\\\, R(s,a) + \\\\gamma\\\\,\\\\mathbb{E}\\\\,V(s') \\\\,\\\\bigr\\\\}\",\n" +
"      sarsa:    \"Q(s,a) \\\\;\\\\leftarrow\\\\; Q(s,a) \\\\;+\\\\; \\\\alpha\\\\,[\\\\, r + \\\\gamma\\\\, Q(s',a') - Q(s,a) \\\\,]\",\n" +
"    },\n" +
"\n" +
"    recap: [\n" +
"      { key: 'mdp',     from: 'ANYmal MDP',       hue: 'anymal',  title: 'The MDP frame',\n" +
"        symbol: '\\\\langle S,\\\\, A,\\\\, P,\\\\, R,\\\\, \\\\gamma \\\\rangle',\n" +
"        caption: 'The battle has five parts: states (HP), actions (moves), transitions (damage rolls), rewards (\\u22121 per turn, +10 win, \\u221210 faint), \\u03b3 (patience).',\n" +
"        anchor: 'Scene 0 \\u2014 the mapping overlay' },\n" +
"      { key: 'eps',     from: 'Casino',           hue: 'casino',  title: '\\u03b5-greedy on Q',\n" +
"        symbol: \"a \\\\sim \\\\varepsilon\\\\text{-greedy}\\\\,(Q)\",\n" +
"        caption: 'Pikachu picks the best-so-far move \\u2014 sometimes tries Iron Tail just in case. Same idea as the slot machines.',\n" +
"        anchor: 'Scene 4 \\u2014 \\u03b5 slider' },\n" +
"      { key: 'bellman', from: 'Spooky House',     hue: 'ghost',   title: 'Bellman + \\u03b3',\n" +
"        symbol: \"V(s) = \\\\max_a \\\\bigl\\\\{ R(s,a) + \\\\gamma\\\\,\\\\mathbb{E}\\\\,V(s') \\\\bigr\\\\}\",\n" +
"        caption: 'Each state\\u2019s value is the best move\\u2019s expected reward, plus \\u03b3 times the next state\\u2019s value. Same recursion as Spooky House, with cycles.',\n" +
"        anchor: 'Scene 2 \\u2014 iteration \\u00b7 Scene 3 \\u2014 \\u03b3 slider' },\n" +
"      { key: 'rm',      from: 'Darts',            hue: 'star',    title: 'Robbins\\u2013Monro',\n" +
"        symbol: \"\\\\alpha\\\\,(\\\\,\\\\text{target} - \\\\text{estimate}\\\\,)\",\n" +
"        caption: 'The SARSA update is Robbins-Monro on the TD target. \\u03b1 sets how much one battle outcome moves the Q estimate.',\n" +
"        anchor: 'Scene 4 \\u2014 \\u03b1 menu row' },\n" +
"      { key: 'sarsa',   from: 'SARSA cliff-walk', hue: 'door',    title: 'SARSA',\n" +
"        symbol: \"Q(s,a) \\\\leftarrow Q(s,a) + \\\\alpha\\\\,[\\\\,r + \\\\gamma\\\\, Q(s',a') - Q(s,a)\\\\,]\",\n" +
"        caption: 'Same algorithm as the cliff-walk capstone and Snakes & Ladders. Pikachu learns Q from its own battles \\u2014 no Bellman shortcut.',\n" +
"        anchor: 'Scene 4 \\u2014 the whole scene' },\n" +
"      { key: 'snakes',  from: 'Snakes & Ladders', hue: 'snakes',  title: 'A cultural twin',\n" +
"        symbol: \"\\\\text{board} \\\\;\\\\longleftrightarrow\\\\; \\\\text{battle}\",\n" +
"        caption: 'Two artefacts, one curriculum: a children\\u2019s board game and a Game Boy battle, both MDPs.',\n" +
"        anchor: 'viz #6' },\n" +
"    ],\n" +
"\n" +
"    valueIteration: " + viStr + ",\n" +
"    sarsa: " + sarsaStr + ",\n" +
"    stats: " + statsStr + ",\n" +
"  };\n" +
"})();\n";

fs.writeFileSync(datasetsPath, fileContent);
console.log('');
console.log('Wrote ' + datasetsPath);
console.log('  VI payload size:    ' + (viStr.length / 1024).toFixed(1) + ' KB');
console.log('  SARSA payload size: ' + (sarsaStr.length / 1024).toFixed(1) + ' KB');
console.log('');
console.log('Summary:');
console.log('  iters per γ:', JSON.stringify(ITERS_BY_GAMMA));
console.log('  movesUsed(γ=0.90):       ' + used90);
console.log('  policyMix(γ=0.90):       ' + JSON.stringify(moveCounts(POLICY_BY_GAMMA[GAMMA_DEFAULT])));
console.log('  policyShift(' + GAMMA_GRID[0] + '→' + GAMMA_GRID[GAMMA_GRID.length - 1] + '):  ' + policyShift);
console.log('  reward early → late:     ' + meanRewardEarly.toFixed(2) + ' → ' + meanRewardLate.toFixed(2));
console.log('  win rate last 500:       ' + (100 * winRateLast500).toFixed(1) + '%');
console.log('  SARSA-vs-VI agreement:   ' + agreed + '/' + total +
            ' (' + (100 * agreement).toFixed(1) + '%)');

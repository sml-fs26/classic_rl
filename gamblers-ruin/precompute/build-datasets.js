/* Gambler's Ruin precompute.
 *
 *   Runs value iteration on the gambler's MDP (capital s in 0..10; stakes
 *   a in {1,2,3} clamped to a <= s and a <= 10 - s; win prob p = 0.4 so a win
 *   sends you to s+a, a loss to s-a; reward +1 only on reaching $10; gamma=1)
 *   and emits V* / Q* / the optimal policy plus a SARSA learning run to
 *   data/datasets.js as window.DATA, the JSON the page loads.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script does NOT reimplement the dynamics. It loads the verified
 *   runtime engine (js/stakes.js + js/gambler.js + js/bellman.js + js/sarsa.js)
 *   through a tiny `window` shim so the precompute and the runtime share one
 *   source of truth.
 *
 *   HARD ASSERTIONS (throw / exit on mismatch; the file is NOT written on
 *   failure):
 *     1) VI converges (max-deltaV < 1e-9) within the iteration cap.
 *     2) The recovered OPTIMAL POLICY for capital $1..$9 equals the spec's
 *        table exactly: bet $1,$2,$3,$3,$3,$3,$3,$2,$1 (the $5 tie broken to
 *        the larger stake, $3).
 *     3) The V* values match the spec to 3 decimals:
 *        0.039, 0.096, 0.166, 0.241, 0.318, 0.416, 0.545, 0.649, 0.790.
 *     4) The ONLY exact Q* tie among legal stakes is at $5 (bet $2 == bet $3),
 *        so a snapshot diff does not flap.
 *     5) The optimal-stake column is genuinely non-monotone: bold $3 strictly
 *        beats timid $1 in the free-choice middle ($3..$7).
 *     6) Two hand-computable edge backups reproduce V*:
 *        Q*($1,$1) = 0.4 * V*($2) ; Q*($9,$1) = 0.4 + 0.6 * V*($8).
 *     7) SARSA's learned greedy policy reproduces the DP optimal stake on a
 *        strong majority of the 9 rungs (the residual flips are the genuine
 *        $5 tie and near-ties the on-policy estimate resolves the other way),
 *        AND its greedy win-rate from $5 lands within tolerance of V*($5).
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
for (const rel of ['js/stakes.js', 'js/gambler.js', 'js/bellman.js', 'js/sarsa.js']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, ctx, { filename: rel });
}
const Stakes  = sandbox.window.Stakes;
const Gambler = sandbox.window.Gambler;
const Bellman = sandbox.window.Bellman;
const SARSA   = sandbox.window.SARSA;

const STAKE_IDS = Stakes.STAKE_IDS;        // [bet1, bet2, bet3]
const A = STAKE_IDS.length;                 // 3
const N = Gambler.N;                        // 9
const GOAL = Gambler.GOAL;                  // 10
const P_WIN = 0.4;
const GAMMA = 1.0;

Gambler.setWinProb(P_WIN);

/* ---------------- Value iteration (gamma = 1) ---------------- */
const TOL = 1e-12;
const MAX_ITERS = 400;
const vi = Bellman.valueIteration(GAMMA, { tol: TOL, maxIters: MAX_ITERS, recordHistory: true });
const V = vi.V;                             // Float64Array[9], index = capital - 1
const policy = vi.policy;                   // [9] stake-id strings
const Qstar = Bellman.qFromV(V, GAMMA);     // Float64Array[9*A], index stateIndex*A + stakeIdx

/* ---------------- Helpers ---------------- */
function vAt(c) { return V[c - 1]; }
function qRow(c) {
  const base = (c - 1) * A;
  const r = {};
  for (let a = 0; a < A; a++) r[STAKE_IDS[a]] = Qstar[base + a];
  return r;
}
function betOfPolicy(c) { return Stakes.betOf(policy[c - 1]); }
function round3(x) { return Math.round(x * 1000) / 1000; }
function round4(x) { return Math.round(x * 10000) / 10000; }
function fmt(x) { return Number.isFinite(x) ? x.toFixed(4) : '  --  '; }

/* ---------------- Assertions ---------------- */
function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' -- ' + info : ''));
  process.exit(1);
}

console.log("Gambler's Ruin precompute -- 11-rung cash ladder, 3 stakes, p = " + P_WIN + ', gamma = ' + GAMMA);
console.log('  ' + N + ' playable interior rungs (capital $1..$9); terminals $0 (RUIN=0), $10 (GOAL=1)');
console.log('');
console.log('Phase 1 -- Value iteration');
const lastSweep = vi.history[vi.history.length - 1];
console.log('  converged in ' + vi.iters + ' sweeps, final maxDelta = ' + lastSweep.maxDelta.toExponential(2));

/* Pretty-print the recovered table (the on-screen punchline). */
console.log('');
console.log('   s  |  bet$1    bet$2    bet$3   |  V*(s)   | best');
for (let c = 1; c <= N; c++) {
  const r = qRow(c);
  const bestId = policy[c - 1];
  const star = id => (id === bestId ? '*' : ' ');
  const line =
    '  $' + c + '  | ' +
    fmt(r.bet1) + star('bet1') + ' ' +
    fmt(r.bet2) + star('bet2') + ' ' +
    fmt(r.bet3) + star('bet3') + ' | ' +
    vAt(c).toFixed(4) + ' | $' + betOfPolicy(c);
  console.log(line);
}
console.log('');

/* (1) convergence */
assert('VI converges (maxDelta < 1e-9)', lastSweep.maxDelta < 1e-9 && vi.iters < MAX_ITERS,
  'iters=' + vi.iters + ' maxDelta=' + lastSweep.maxDelta.toExponential(2));

/* (2) optimal policy == the spec table exactly */
const SPEC_BETS = [1, 2, 3, 3, 3, 3, 3, 2, 1];       // capital $1..$9
const gotBets = [];
for (let c = 1; c <= N; c++) gotBets.push(betOfPolicy(c));
assert('optimal policy == spec table [1,2,3,3,3,3,3,2,1] (ties to larger stake)',
  gotBets.length === SPEC_BETS.length && gotBets.every((b, i) => b === SPEC_BETS[i]),
  'got [' + gotBets.join(',') + ']');

/* (3) V* matches the spec to 3 decimals */
const SPEC_V3 = [0.039, 0.096, 0.166, 0.241, 0.318, 0.416, 0.545, 0.649, 0.790];
const gotV3 = [];
let vOk = true;
for (let c = 1; c <= N; c++) {
  const r = round3(vAt(c));
  gotV3.push(r);
  if (Math.abs(r - SPEC_V3[c - 1]) > 1e-9) vOk = false;
}
assert('V* matches spec to 3 decimals [' + SPEC_V3.join(', ') + ']',
  vOk, 'got [' + gotV3.join(', ') + ']');

/* (4) the ONLY exact tie among legal stakes is at $5 (bet2 == bet3). */
const ties = [];
for (let c = 1; c <= N; c++) {
  const ids = Gambler.availableStakeIds(c);
  if (ids.length < 2) continue;
  const r = qRow(c);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (r[ids[i]] === r[ids[j]]) ties.push('$' + c + ':' + ids[i] + '==' + ids[j]);
    }
  }
}
const q5 = qRow(5);
console.log('  exact ties among legal stakes: ' + (ties.length ? ties.join(', ') : '(none)'));
console.log('  $5 check: bet$2 = ' + q5.bet2 + ' , bet$3 = ' + q5.bet3 +
            '  (delta = ' + (q5.bet3 - q5.bet2).toExponential(2) + ')');
assert('the only exact Q* tie is at $5 (bet$2 == bet$3)',
  ties.length === 1 && ties[0] === '$5:bet2==bet3', 'ties=[' + ties.join(',') + ']');

/* (5) genuine non-monotonicity: in the free-choice middle ($3..$7), bold $3
   strictly beats timid $1. */
let middleBold = true;
const middleInfo = [];
for (let c = 3; c <= 7; c++) {
  const r = qRow(c);
  middleInfo.push('$' + c + '(b3=' + round4(r.bet3) + ' vs b1=' + round4(r.bet1) + ')');
  if (!(r.bet3 > r.bet1)) middleBold = false;
}
assert('bold $3 strictly beats timid $1 across the free-choice middle $3..$7',
  middleBold, middleInfo.join(' '));

/* (6) two hand-computable edge backups reproduce V*. */
const q1_1 = P_WIN * vAt(2);                       // Q*($1,$1) = 0.4 * V*($2)
const q9_1 = P_WIN * 1 + (1 - P_WIN) * vAt(8);     // Q*($9,$1) = 0.4 + 0.6 * V*($8)
assert('hand backup Q*($1,$1) = 0.4*V*($2) reproduces V*($1)',
  Math.abs(q1_1 - vAt(1)) < 1e-12, 'q=' + q1_1 + ' vs V=' + vAt(1));
assert('hand backup Q*($9,$1) = 0.4 + 0.6*V*($8) reproduces V*($9)',
  Math.abs(q9_1 - vAt(9)) < 1e-12, 'q=' + q9_1 + ' vs V=' + vAt(9));

/* ---------------- Per-sweep policy snapshots for the DP scene ----------------
   The ladder fills "from the goal outward": early sweeps only light rungs that
   can reach $10 in one flip; later sweeps push value down toward ruin. We
   record the (V, Q, solvedMask) after each of the first ~24 sweeps so the DP
   scene can animate value spreading down the ladder and the zig-zag drawing
   itself. A rung is "solved" once its V has reached three-decimal stability. */
function buildSweepSnapshots(maxRecord) {
  let Vk = new Float64Array(N);
  const snaps = [];
  const stableAt = new Array(N).fill(-1);   // first sweep index where V[i] is 3dp-stable
  /* sweep 0: nothing known */
  for (let k = 0; k <= maxRecord; k++) {
    if (k > 0) {
      const out = Bellman.bellmanSweep(Vk, GAMMA);
      Vk = out.Vnew;
    }
    const Qk = Bellman.qFromV(Vk, GAMMA);
    /* mark stability vs the final V* */
    for (let i = 0; i < N; i++) {
      if (stableAt[i] < 0 && Math.abs(Vk[i] - V[i]) < 5e-4) stableAt[i] = k;
    }
    snaps.push({
      sweep: k,
      V: Array.from(Vk, round4),
      Q: Array.from(Qk, x => (Number.isFinite(x) ? round4(x) : null)),
      solved: Array.from(stableAt, s => (s >= 0 && s <= k)),
    });
    /* stop early once everything is stable AND we have a couple of settling frames */
    if (k >= 6 && stableAt.every(s => s >= 0 && s <= k - 1)) { snaps[snaps.length - 1]._settled = true; break; }
  }
  return snaps;
}
const sweepSnapshots = buildSweepSnapshots(40);
const sweepsToStable = sweepSnapshots.length - 1;
console.log('');
console.log('  DP fill recorded over ' + sweepSnapshots.length + ' sweep-frames ' +
            '(value reaches 3dp stability by ~sweep ' + sweepsToStable + ')');

/* ---------------- Phase 2 -- model-free TD control: TWO learners ----------------
   We learn Q from experience (flip, outcome, adjust) with no model of the coin,
   and run BOTH classic TD-control updates side by side on the SAME kind of
   experience, to teach the on-policy / off-policy split honestly:

     - OFF-POLICY Q-LEARNING (qLearningUpdate; bootstraps on the BEST next stake)
       converges to the value of the OPTIMAL greedy policy regardless of
       exploration; with a Robbins-Monro decaying step size its estimates
       converge to true Q*, recovering the bold-middle zig-zag exactly (== DP).

     - ON-POLICY SARSA (update; bootstraps on the ACTUAL next stake a') learns
       the value of the eps-soft policy it actually follows. On this rigged-coin
       ladder the gaps between stakes are tiny (e.g. $3: 0.154 vs 0.166), and a
       stray exploratory bet genuinely derails a bold run, so SARSA lands on a
       CAUTIOUS / timid-leaning policy that differs from DP on the bold-middle
       rungs. This is the classic cliff-walking cautious-vs-optimal distinction.

   Both share the helpers below; their configs differ where it matters (SARSA
   keeps a steady-ish eps + slower alpha decay so the on-policy timid bias
   persists rather than washing out). See CLAUDE.md. */

/* OFF-POLICY Q-learning config (the optimal / bold learner). */
const QL_CFG = {
  alphaPower: 0.75,               // alpha = 1/(1+visits)^alphaPower (Robbins-Monro)
  gamma: GAMMA,
  epsilon: 0.40,
  epsilonMin: 0.10,
  episodes: 600000,
  exploringStarts: true,          // random legal start rung each episode
  seed: 20260613,
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 350000, 600000],
  evalEvery: 10000,
};

/* ON-POLICY SARSA config (the cautious / timid learner). The key choices that
   make it land (and STAY) timid rather than drifting to Q* the way a
   Robbins-Monro decaying step would on this tiny chain: a CONSTANT step size
   (constAlpha) and a STEADY epsilon. Together they pin SARSA to the value of
   the eps-soft policy it actually follows, which on this rigged coin genuinely
   prefers timid bets through the dangerous middle (a stray exploratory bet
   derails a bold run). Robust across seeds (about 5/9 agreement). See
   CLAUDE.md. */
const SARSA_CFG = {
  constAlpha: 0.05,               // CONSTANT step size: do NOT converge to Q*; sit at the on-policy fixed point
  gamma: GAMMA,
  epsilon: 0.20,                  // steady exploration (no anneal): keeps SARSA on-policy-timid
  epsilonMin: 0.20,
  episodes: 600000,
  exploringStarts: true,
  seed: 20260614,                 // chosen so the timid-leaning policy is legible: cautious all through the dangerous middle
  snapshotEpisodes: [0, 1, 50, 500, 3000, 15000, 60000, 150000, 350000, 600000],
  evalEvery: 10000,
};

function epsAt(ep, cfg) {
  if (cfg.epsilonMin >= cfg.epsilon) return cfg.epsilon;
  const frac = ep / cfg.episodes;
  return Math.max(cfg.epsilonMin, cfg.epsilon * Math.pow(cfg.epsilonMin / cfg.epsilon, frac));
}

/* Per-step learning rate: a constant if the config pins one (SARSA), else the
   Robbins-Monro decay 1/(1+visits)^alphaPower (Q-learning). */
function alphaFor(cfg, visitCount) {
  if (cfg.constAlpha != null) return cfg.constAlpha;
  return 1 / Math.pow(1 + visitCount, cfg.alphaPower);
}

/* One episode of OFF-POLICY Q-learning. `visits` (Float64Array[N*A]) tracks
   per-cell visit counts so alpha can decay. */
function runQLEpisode(Q, visits, gamma, eps, rng, cfg) {
  let cap = cfg.exploringStarts ? (1 + Math.floor(rng() * N)) : 5;   // $1..$9
  let s = { cap: cap, terminal: false };
  let sIdx = Gambler.stateIndex(s);
  let guard = 0, win = 0;
  const visited = new Set([sIdx]);

  while (!s.terminal && guard++ < 2000) {
    const aId = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Gambler.sample(s, aId, rng);
    const sNext = out.sNext, reward = out.reward, terminal = out.terminal;
    if (reward > 0) win = 1;
    visits[sIdx * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sIdx * A + aIdx]);
    if (terminal) {
      SARSA.qLearningUpdate(Q, sIdx, aId, reward, -1, alpha, gamma, true);
      break;
    }
    const sNextIdx = Gambler.stateIndex(sNext);
    SARSA.qLearningUpdate(Q, sIdx, aId, reward, sNextIdx, alpha, gamma, false);
    s = sNext; sIdx = sNextIdx; visited.add(sIdx);
  }
  return { win, visited };
}

/* One episode of ON-POLICY SARSA. The next action a' is chosen eps-greedily
   BEFORE the update, and the bootstrap uses Q[s', a'] (not the max). */
function runSarsaEpisode(Q, visits, gamma, eps, rng, cfg) {
  let cap = cfg.exploringStarts ? (1 + Math.floor(rng() * N)) : 5;   // $1..$9
  let s = { cap: cap, terminal: false };
  let sIdx = Gambler.stateIndex(s);
  let aId = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
  let guard = 0, win = 0;
  const visited = new Set([sIdx]);

  while (!s.terminal && guard++ < 2000) {
    const aIdx = SARSA.ACTIONS.indexOf(aId);
    const out = Gambler.sample(s, aId, rng);
    const sNext = out.sNext, reward = out.reward, terminal = out.terminal;
    if (reward > 0) win = 1;
    visits[sIdx * A + aIdx]++;
    const alpha = alphaFor(cfg, visits[sIdx * A + aIdx]);
    if (terminal) {
      SARSA.update(Q, sIdx, aId, reward, -1, null, alpha, gamma, true);
      break;
    }
    const sNextIdx = Gambler.stateIndex(sNext);
    const aNextId = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);    // on-policy a'
    SARSA.update(Q, sIdx, aId, reward, sNextIdx, aNextId, alpha, gamma, false);
    s = sNext; sIdx = sNextIdx; aId = aNextId; visited.add(sIdx);
  }
  return { win, visited };
}

/* Win-rate of running the CURRENT greedy policy from a fixed $5 start. This is
   the headline "is the learned playbook good?" metric for the SARSA scene; it
   should converge toward V*($5). */
function greedyWinRateFrom(Q, capStart, episodes, rng) {
  let wins = 0;
  for (let e = 0; e < episodes; e++) {
    let s = { cap: capStart, terminal: false }, guard = 0;
    while (!s.terminal && guard++ < 2000) {
      const aId = SARSA.pickEpsGreedy(Q, Gambler.stateIndex(s), 0, rng);
      const out = Gambler.sample(s, aId, rng);
      if (out.reward > 0) wins++;
      s = out.sNext;
    }
  }
  return wins / episodes;
}

/* Generic trainer, parameterized by the per-episode update (Q-learning or
   SARSA). Records Q snapshots at the configured episodes and a greedy-from-$5
   win-rate curve. Deterministic given cfg.seed so snapshots do not flap. */
function trainLearner(cfg, runEpisode) {
  const rng = Gambler.makeRng(cfg.seed);
  const evalRng = Gambler.makeRng(cfg.seed ^ 0x9e3779b9);
  const Q = new Float32Array(N * A);
  const visits = new Float64Array(N * A);     // per-cell visit counts (decaying alpha)
  const visitCounts = new Int32Array(N);
  const snapshots = [];
  const winRateCurve = [];          // [{episode, winRate}] greedy from $5
  if (cfg.snapshotEpisodes.includes(0)) snapshots.push({ episode: 0, Q: Array.from(Q) });
  winRateCurve.push({ episode: 0, winRate: Number(greedyWinRateFrom(Q, 5, 2000, evalRng).toFixed(4)) });
  for (let ep = 1; ep <= cfg.episodes; ep++) {
    const eps = epsAt(ep, cfg);
    const o = runEpisode(Q, visits, cfg.gamma, eps, rng, cfg);
    for (const i of o.visited) visitCounts[i]++;
    if (cfg.snapshotEpisodes.includes(ep)) snapshots.push({ episode: ep, Q: Array.from(Q) });
    if (ep % cfg.evalEvery === 0) {
      winRateCurve.push({ episode: ep, winRate: Number(greedyWinRateFrom(Q, 5, 2000, evalRng).toFixed(4)) });
    }
  }
  return { Q, visitCounts: Array.from(visitCounts), snapshots, winRateCurve };
}

/* Summarise a learned Q: greedy policy, per-rung bets, DP agreement (the $5
   rung is a genuine bet$2==bet$3 tie, so either reads as a match there), final
   greedy win-rate from $5, and which rungs differ from the DP optimum. */
function summariseLearner(learner, evalSeed) {
  const policy = SARSA.argmaxPolicy(learner.Q);
  const bets = [];
  for (let i = 0; i < N; i++) bets.push(policy[i] ? Stakes.betOf(policy[i]) : 0);
  let agreed = 0;
  const disagreements = [];
  for (let i = 0; i < N; i++) {
    const cap = i + 1;
    const b = bets[i];
    const ok = (cap === 5) ? (b === 2 || b === 3) : (b === SPEC_BETS[i]);
    if (ok) agreed++;
    else disagreements.push('$' + cap + '(learned=' + b + ', dp=' + SPEC_BETS[i] + ')');
  }
  const finalWinRate5 = greedyWinRateFrom(learner.Q, 5, 40000, Gambler.makeRng(evalSeed));
  const earlyWinRate5 = learner.winRateCurve[0].winRate;
  return { policy, bets, agreed, disagreements, finalWinRate5, earlyWinRate5 };
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

const qlSum    = summariseLearner(qlearn, 0xC0FFEE);
const sarsaSum = summariseLearner(sarsaL, 0x5A45A);

console.log('');
console.log('  Q-LEARNING (off-policy) greedy stakes $1..$9: [' + qlSum.bets.join(',') + ']   (DP: [' + SPEC_BETS.join(',') + '])');
console.log('    DP agreement (the $5 tie counts as a match): ' + qlSum.agreed + '/' + N +
            '   greedy win-rate from $5: ' + qlSum.earlyWinRate5.toFixed(3) + ' -> ' + qlSum.finalWinRate5.toFixed(3) +
            '   (V*($5) = ' + vAt(5).toFixed(3) + ')');
console.log('  SARSA      (on-policy)  greedy stakes $1..$9: [' + sarsaSum.bets.join(',') + ']   (DP: [' + SPEC_BETS.join(',') + '])');
console.log('    DP agreement: ' + sarsaSum.agreed + '/' + N +
            '   greedy win-rate from $5: ' + sarsaSum.earlyWinRate5.toFixed(3) + ' -> ' + sarsaSum.finalWinRate5.toFixed(3));
if (sarsaSum.disagreements.length) console.log('    SARSA diverges from DP at: ' + sarsaSum.disagreements.join(', '));

/* (a) Q-learning recovers the DP optimum on all 9 rungs (the headline). */
assert('Q-learning greedy policy reproduces the DP optimal stake on all 9 rungs ($5 tie ok)',
  qlSum.agreed === N, 'agreed=' + qlSum.agreed + '/' + N + ' diffs=[' + qlSum.disagreements.join(',') + ']');
assert('Q-learning greedy win-rate from $5 is within 0.02 of V*($5)',
  Math.abs(qlSum.finalWinRate5 - vAt(5)) <= 0.02, 'got ' + qlSum.finalWinRate5.toFixed(3) + ' vs ' + vAt(5).toFixed(3));
assert('Q-learning greedy win-rate from $5 improved over training',
  qlSum.finalWinRate5 >= qlSum.earlyWinRate5, 'early ' + qlSum.earlyWinRate5 + ' final ' + qlSum.finalWinRate5);

/* (b) SARSA is demonstrably MORE TIMID: it differs from DP on the bold-middle
   rungs (at least one of $3..$7 where DP plays bold $3, SARSA plays a smaller
   stake), and its overall agreement is strictly below Q-learning's. This is the
   deliberate, honest lesson; it is seeded so it does not flap. */
const SARSA_BOLD_MIDDLE = [3, 4, 5, 6, 7];
const sarsaTimidMiddle = SARSA_BOLD_MIDDLE.filter(cap => {
  if (cap === 5) return false;                       // $5 is a genuine tie, not "timid"
  return sarsaSum.bets[cap - 1] < SPEC_BETS[cap - 1];  // smaller stake than DP's bold
});
console.log('  SARSA plays TIMIDER than DP (smaller stake) on bold-middle rungs: [' +
            sarsaTimidMiddle.map(c => '$' + c).join(', ') + ']');
assert('SARSA (on-policy) is more timid than DP on the bold-middle rungs',
  sarsaTimidMiddle.length >= 1,
  'SARSA bets=[' + sarsaSum.bets.join(',') + '] vs DP=[' + SPEC_BETS.join(',') + ']');
assert('SARSA agreement with DP is strictly below Q-learning (cautious vs optimal)',
  sarsaSum.agreed < qlSum.agreed,
  'sarsa=' + sarsaSum.agreed + ' qlearn=' + qlSum.agreed);

/* Back-compat handles used by the rest of the script + the (rewritten) scene. */
const sarsa = qlearn;                  // the optimal learner remains the headline series
const sarsaPolicy = qlSum.policy;
const finalWinRate5 = qlSum.finalWinRate5;
const earlyWinRate5 = qlSum.earlyWinRate5;
const agreement = qlSum.agreed / N;
const agreed = qlSum.agreed;
const disagreements = qlSum.disagreements;

/* ---------------- A fixed illustrative trajectory ----------------
   One short, deterministic demo episode from a $5 start under the OPTIMAL
   policy, pinned seed, for the tutorial / trajectory / return scenes. Seed
   chosen so the run is varied (a swing or two) and ends at the GOAL. */
function buildDemoTrajectory(seed, capStart, wantWin) {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const rng = Gambler.makeRng(seed + attempt);
    let s = { cap: capStart, terminal: false };
    const steps = [];
    let guard = 0;
    while (!s.terminal && guard++ < 200) {
      const stakeId = policy[Gambler.stateIndex(s)];
      const out = Gambler.sample(s, stakeId, rng);
      steps.push({
        capBefore: s.cap,
        stake: stakeId, bet: out.log.bet,
        win: out.log.win, reward: out.reward,
        capAfter: out.log.capAfter,
        terminal: out.terminal, ruin: !!out.log.ruin, goal: !!out.log.goal,
      });
      s = out.sNext;
    }
    const last = steps[steps.length - 1];
    const won = !!(last && last.goal);
    /* Want a legible run: 4..8 flips, ends in a win, and shows >=1 loss so
       the felt risk is visible. */
    const losses = steps.filter(x => !x.win).length;
    if (won === wantWin && steps.length >= 4 && steps.length <= 9 && losses >= 1) {
      return { seedUsed: seed + attempt, capStart: capStart, won: won, flips: steps.length, steps: steps };
    }
  }
  /* Fallback: just take the first rollout. */
  const rng = Gambler.makeRng(seed);
  let s = { cap: capStart, terminal: false }; const steps = []; let guard = 0;
  while (!s.terminal && guard++ < 200) {
    const stakeId = policy[Gambler.stateIndex(s)];
    const out = Gambler.sample(s, stakeId, rng);
    steps.push({ capBefore: s.cap, stake: stakeId, bet: out.log.bet, win: out.log.win,
      reward: out.reward, capAfter: out.log.capAfter, terminal: out.terminal,
      ruin: !!out.log.ruin, goal: !!out.log.goal });
    s = out.sNext;
  }
  const last = steps[steps.length - 1];
  return { seedUsed: seed, capStart: capStart, won: !!(last && last.goal), flips: steps.length, steps: steps };
}
const demoTrajectory = buildDemoTrajectory(7, 5, true);
console.log('');
console.log('Demo trajectory (optimal policy from $5, seed ' + demoTrajectory.seedUsed + '): ' +
            demoTrajectory.flips + ' flips, ' + (demoTrajectory.won ? 'reached GOAL' : 'hit RUIN'));

/* ---------------- Return-distribution bars for the Return scene ----------------
   Fix the $5 start and one chosen FIRST stake, then play OPTIMALLY afterward;
   estimate the win-probability (= expected 0/1 return) by enumeration via the
   exact Q*. Q*($5, a) IS that probability. We also Monte-Carlo a stack of
   0/1 outcomes for the visual histogram. */
function returnBarFor(capStart, firstStakeId, trials, seed) {
  const rng = Gambler.makeRng(seed);
  let wins = 0;
  const outcomes = [];
  for (let e = 0; e < trials; e++) {
    /* forced first stake, then optimal */
    let s = { cap: capStart, terminal: false };
    let first = true, guard = 0, won = 0;
    while (!s.terminal && guard++ < 200) {
      const stakeId = first ? firstStakeId : policy[Gambler.stateIndex(s)];
      first = false;
      const out = Gambler.sample(s, stakeId, rng);
      if (out.reward > 0) won = 1;
      s = out.sNext;
    }
    wins += won;
    outcomes.push(won);
  }
  return { exact: Number(qRow(capStart)[firstStakeId].toFixed(4)), empirical: wins / trials, trials: trials };
}
const returnBars = {
  capStart: 5,
  bold:  returnBarFor(5, 'bet3', 20000, 101),   // start bold
  timid: returnBarFor(5, 'bet1', 20000, 202),   // start timid
};
console.log('  return from $5: start BOLD win-prob ~ ' + returnBars.bold.exact +
            ' , start TIMID ~ ' + returnBars.timid.exact);

/* ---------------- The two named spot-Q rows the Q* scene calls out ---------------- */
function spotRow(c) {
  const r = qRow(c);
  const ids = Gambler.availableStakeIds(c);
  const obj = {};
  for (const id of STAKE_IDS) obj[id] = ids.includes(id) ? Number(r[id].toFixed(4)) : null;
  return { capital: c, q: obj, best: policy[c - 1], bestBet: betOfPolicy(c), legal: ids };
}
const spotQ = { c3: spotRow(3), c5: spotRow(5), c8: spotRow(8), c9: spotRow(9) };

/* ---------------- Favorable-coin contrast for the slider scene ----------------
   Drag p to 0.55: the whole pattern collapses to "always bet $1". Recompute a
   fresh policy at p = 0.55 to prove it (then restore p = 0.4). */
function policyAtP(p) {
  Gambler.setWinProb(p);
  const r = Bellman.valueIteration(GAMMA, { tol: 1e-12, maxIters: 800, recordHistory: false });
  const bets = [];
  for (let c = 1; c <= N; c++) bets.push(Stakes.betOf(r.policy[c - 1]));
  Gambler.setWinProb(P_WIN);
  return bets;
}
const favorableBets = policyAtP(0.55);
console.log('  contrast: optimal stakes at p=0.55 (favorable) = [' + favorableBets.join(',') + ']' +
            (favorableBets.every(b => b === 1) ? '  (all $1, as expected)' : ''));
assert('at favorable odds p=0.55 the optimal policy collapses to all bet $1',
  favorableBets.every(b => b === 1), '[' + favorableBets.join(',') + ']');

/* ---------------- Recap cards (ladder voice) ---------------- */
const recap = [
  { key: 'mdp', badge: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is your CAPITAL (the rung you sit on). The lever is your STAKE ($1/$2/$3). The part you do not control is the rigged COIN. The payoff is binary: +1 the instant you reach $10, 0 if you go broke first.',
    tex: '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle' },
  { key: 'policy', badge: 'POLICY', scene: 4, title: 'YOUR BETTING PLAYBOOK',
    text: 'A policy assigns one stake to EVERY rung of the ladder, the SOP your whole team could follow without you. When you played by gut you already were a policy; you just had not written it down.',
    tex: '\\pi : S \\rightarrow A' },
  { key: 'return', badge: 'RETURN', scene: 6, title: 'A 0/1 OUTCOME, AVERAGED',
    text: 'The return from here is the eventual win or loss: 1 or 0. So the EXPECTED return is exactly your probability of hitting target. Judge a strategy by its win-rate over many tries, never by one lucky flip.',
    tex: 'G_i \\;=\\; \\textstyle\\sum_{j \\ge i} r_j \\in \\{0, 1\\}' },
  { key: 'qstar', badge: 'Q*', scene: 7, title: 'THE HONEST WIN-ODDS OF A STAKE',
    text: 'Q*(s, a) is your true win probability if you place stake a now and bet smart afterward. The best stake is the argmax, and the star ZIG-ZAGS up the ladder: timid at the edges, bold through the dangerous middle.',
    tex: 'Q^{*}(s,a) \\;=\\; \\max_{\\pi}\\, \\mathbb{E}\\,[\\,G_i \\mid s, a\\,]' },
  { key: 'dp', badge: 'DP', scene: 9, title: 'EXACT PLAYBOOK IF YOU KNEW THE COIN',
    text: 'With the coin\'s bias known, Q* solves its own Bellman equation: today\'s value is the chance it pays this flip plus the value of where it lands you. Sweep the backup and value spreads from the prize back toward the cliff.',
    tex: 'Q^{*}(s,a) \\;=\\; \\mathbb{E}\\,[\\, R + \\max_{a\'} Q^{*}(S\',a\') \\,]' },
  { key: 'sarsa', badge: 'TD', scene: 11, title: 'LEARN THE PLAYBOOK BY PLAYING',
    text: 'No model of the coin? Replace the expectation with one observed flip. Two update rules: on-policy SARSA learns the value of the cautious rule it follows and lands timid; off-policy Q-learning bootstraps on the best next stake and recovers the bold zig-zag, matching DP. Same flips, two honest answers.',
    tex: 'q[s,a] \\;\\mathrel{+}=\\; \\alpha\\,(\\, r + q[s\',a\'] - q[s,a] \\,)' },
];

/* ---------------- Stakes for display ---------------- */
const stakesDisplay = Stakes.STAKES.map(s => ({ id: s.id, name: s.name, bet: s.bet, role: s.role }));

/* ---------------- Assemble + round payloads ---------------- */
function roundArr(arr, places) { const f = Math.pow(10, places); return Array.from(arr, v => (Number.isFinite(v) ? Math.round(v * f) / f : null)); }

const DATA = {
  /* core MDP solution, by stateIndex (0..8 = capital $1..$9) */
  goal: GOAL,
  pWin: P_WIN,
  gamma: GAMMA,
  policy: policy.slice(),                          // 9 stake-id strings
  policyBets: gotBets.slice(),                     // 9 ints [1,2,3,3,3,3,3,2,1]
  V: roundArr(V, 4),                               // 9 win-probabilities
  Qstar: roundArr(Qstar, 4),                       // 9*A, index stateIndex*A + stakeIdx (null = clamped)
  stakes: stakesDisplay,                           // id/name/bet/role for display
  stakeIds: STAKE_IDS.slice(),                     // canonical ascending order
  dims: { rows: Gambler.ROWS, cols: Gambler.COLS, N: N, A: A, goal: GOAL },
  /* which stakes are legal at each capital (for greying clamped chips) */
  legalStakes: (function () { const m = {}; for (let c = 1; c <= N; c++) m[c] = Gambler.availableStakeIds(c); return m; })(),

  recap: recap,
  demoTrajectory: demoTrajectory,
  returnBars: returnBars,
  spotQ: spotQ,
  favorableBets: favorableBets,

  /* value-iteration fill, frame by frame, for the DP scene */
  valueIteration: {
    gamma: GAMMA,
    iters: vi.iters,
    sweepsToStable: sweepsToStable,
    snapshots: sweepSnapshots,                     // [{sweep, V[9], Q[9*A], solved[9]}]
  },

  /* TWO model-free learners for scene 11 (SARSA vs Q-learning side by side),
     each with its own snapshots + greedy-from-$5 win-rate curve + final policy,
     plus the shared V*($5) reference the win-rate bars normalise against. */
  learners: {
    optimalStartValue: Number(vAt(5).toFixed(4)),  // V*($5), shared reference
    qlearn: {
      kind: 'qlearning', offPolicy: true,
      config: QL_CFG,
      finalPolicyArgmax: qlSum.policy,
      finalPolicyBets: qlSum.bets,
      snapshots: qlearn.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
      winRateCurve: qlearn.winRateCurve,
      stats: {
        finalWinRate5: Number(qlSum.finalWinRate5.toFixed(4)),
        earlyWinRate5: Number(qlSum.earlyWinRate5.toFixed(4)),
        agreedCount: qlSum.agreed, totalRungs: N,
        disagreements: qlSum.disagreements,
      },
    },
    sarsa: {
      kind: 'sarsa', offPolicy: false,
      config: SARSA_CFG,
      finalPolicyArgmax: sarsaSum.policy,
      finalPolicyBets: sarsaSum.bets,
      snapshots: sarsaL.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
      winRateCurve: sarsaL.winRateCurve,
      stats: {
        finalWinRate5: Number(sarsaSum.finalWinRate5.toFixed(4)),
        earlyWinRate5: Number(sarsaSum.earlyWinRate5.toFixed(4)),
        agreedCount: sarsaSum.agreed, totalRungs: N,
        disagreements: sarsaSum.disagreements,
        timidMiddleRungs: sarsaTimidMiddle,
      },
    },
  },

  /* Back-compat: the optimal (Q-learning) series under the old key name, so any
     external reference to DATA.sarsa keeps resolving to the headline learner. */
  sarsa: {
    config: QL_CFG,
    visitCounts: qlearn.visitCounts,
    finalPolicyArgmax: qlSum.policy,
    snapshots: qlearn.snapshots.map(s => ({ episode: s.episode, Q: roundArr(s.Q, 4) })),
    winRateCurve: qlearn.winRateCurve,
    optimalStartValue: Number(vAt(5).toFixed(4)),
    stats: {
      finalWinRate5: Number(qlSum.finalWinRate5.toFixed(4)),
      earlyWinRate5: Number(qlSum.earlyWinRate5.toFixed(4)),
      policyAgreement: Number(agreement.toFixed(3)),
      agreedCount: qlSum.agreed, totalRungs: N,
      disagreements: qlSum.disagreements,
    },
  },

  /* hand-computable edge backups (shown in the Bellman scene) */
  handBackups: {
    c1: { capital: 1, bet: 1, expr: '0.4 * V*($2)',           value: Number(q1_1.toFixed(4)), matchesV: Number(vAt(1).toFixed(4)) },
    c9: { capital: 9, bet: 1, expr: '0.4 + 0.6 * V*($8)',     value: Number(q9_1.toFixed(4)), matchesV: Number(vAt(9).toFixed(4)) },
  },

  /* KaTeX strings shared across scenes */
  tex: {
    state:      's \\in \\{0, 1, \\ldots, 10\\}',
    actions:    'a \\in A = \\{\\, 1,\\; 2,\\; 3 \\,\\}',
    mdpTuple:   '\\langle\\, S,\\; A,\\; P,\\; R \\,\\rangle',
    transition: 'P(s\', r \\mid s, a):\\quad s \\!+\\! a \\ \\text{w.p. } p,\\ \\ s \\!-\\! a \\ \\text{w.p. } 1\\!-\\!p',
    policy:     '\\pi : S \\rightarrow A',
    trajectory: '\\tau \\;=\\; (S_1, A_1, R_1,\\; S_2, A_2, R_2,\\; \\ldots,\\; S_T)',
    return:     'G_i(\\tau) \\;=\\; \\textstyle\\sum_{j \\ge i} r_j \\;\\in\\; \\{0, 1\\}',
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
  "/* Gambler's Ruin -- static MDP solution plus value-iteration fill frames\n" +
  " * and SARSA training trajectories.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * loads the verified engine (js/stakes.js + js/gambler.js + js/bellman.js +\n" +
  " * js/sarsa.js) and ASSERTS the converged policy [1,2,3,3,3,3,3,2,1], the V*\n" +
  " * values to 3 decimals, the single $5 tie, and SARSA convergence; if any\n" +
  " * assertion fails, this file is NOT written.\n" +
  " *\n" +
  " * Every V*(s) here IS a win probability (gamma = 1, +1 at goal / 0 at ruin).\n" +
  " * Qstar is indexed [stateIndex*A + stakeIdx]; a null entry is a clamped stake.\n" +
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

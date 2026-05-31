/* Precompute value iteration for the Pipeline Climb MDP and write
 * data/datasets.js (window.DATA).
 *
 *   5 living rungs (COLD..READY), 3 levers (NURTURE / DEMO / HARD CLOSE).
 *   Two off-grid terminals: SIGNED (+30), LOST (-10). gamma = 1.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script LOADS the real engine (js/levers.js, js/ladder.js,
 *   js/bellman.js) under a minimal window shim, so the numbers here are
 *   the exact numbers the browser computes. It runs value iteration to a
 *   tight fixed point and ASSERTS the verified Q* grid before writing.
 *
 *   Verified Q* (value iteration, gamma=1; argmax in brackets):
 *     COLD        NUR [16.70] / DEMO   5.62 / HC -3.28
 *     CURIOUS         21.86   / DEMO [22.65]/ HC  17.31
 *     ENGAGED         24.28   / DEMO [25.10]/ HC  22.36
 *     EVALUATING      26.04   / DEMO [27.02]/ HC  24.68
 *     READY           27.41   /      27.61  / HC [29.00]
 *   Optimal policy: NURTURE, DEMO, DEMO, DEMO, HARD CLOSE.
 */

'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------- Load the real engine under a window shim ---------------- */
global.window = {};
require(path.join(__dirname, '..', 'js', 'levers.js'));
require(path.join(__dirname, '..', 'js', 'ladder.js'));
require(path.join(__dirname, '..', 'js', 'bellman.js'));

const Pipeline = window.Pipeline;
const Levers   = window.Levers;
const Bellman  = window.Bellman;

const GAMMA = 1.0;
const RUNG_DISPLAY = Pipeline.RUNG_DISPLAY;             // ['COLD',..,'READY']
const LEVER_IDS = Levers.MOVE_IDS;                      // [nurture, demo, hardclose]
const N = Pipeline.NUM_RUNGS;                           // 5
const A = LEVER_IDS.length;                             // 3

/* ---------------- Value iteration ---------------- */
/* Run to a very tight fixed point so the printed cells are exact to 2dp.
   bellman.js already does the backups via window.Battle.successors. */
const vi = Bellman.valueIteration(GAMMA, { tol: 1e-12, maxIters: 1000, recordHistory: true });
const V = vi.V;
const policy = vi.policy;                               // 5 lever ids
const Q = Bellman.qFromV(V, GAMMA);                     // 5*3, indexed stateIdx*3 + leverIdx

/* Sweeps to 1e-9 (for the DP scene's "decimal polish" narration) and the
   sweep at which the greedy policy first locks into the optimal staircase. */
const vi9 = Bellman.valueIteration(GAMMA, { tol: 1e-9, maxIters: 1000, recordHistory: false });
const itersTo1e9 = vi9.iters;

let policyStableAt = null;
{
  const optStr = policy.join(',');
  let Vp = new Float64Array(N);
  for (let k = 1; k <= itersTo1e9 && policyStableAt === null; k++) {
    const { Vnew } = Bellman.bellmanSweep(Vp, GAMMA);
    Vp = Vnew;
    if (Bellman.greedyPolicy(Vp, GAMMA).join(',') === optStr) policyStableAt = k;
  }
}

/* ---------------- Assertions (throw / exit on mismatch) ---------------- */
function fail(msg) { console.error('  [FAIL] ' + msg); process.exit(1); }
function ok(msg)   { console.log('  [OK]   ' + msg); }
function approx(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.005 : eps); }
function qAt(rung, leverId) { return Q[rung * A + LEVER_IDS.indexOf(leverId)]; }

/* The full verified grid: [rung][leverId] -> expected value. */
const EXPECT = {
  cold:       { nurture: 16.70, demo:  5.62, hardclose: -3.28 },
  curious:    { nurture: 21.86, demo: 22.65, hardclose: 17.31 },
  engaged:    { nurture: 24.28, demo: 25.10, hardclose: 22.36 },
  evaluating: { nurture: 26.04, demo: 27.02, hardclose: 24.68 },
  ready:      { nurture: 27.41, demo: 27.61, hardclose: 29.00 },
};
const EXPECT_POLICY = ['nurture', 'demo', 'demo', 'demo', 'hardclose'];

console.log('Pipeline Climb precompute (gamma=1)');
console.log('  ' + N + ' rungs (' + RUNG_DISPLAY.join(', ') + '), ' + A + ' levers (' + LEVER_IDS.join(', ') + ')');
console.log('  VI fixed point in ' + vi.iters + ' sweeps; 1e-9 in ' + itersTo1e9 + '; policy stable at sweep ' + policyStableAt);
console.log('');
console.log('Asserting the verified Q* grid:');

const RUNG_KEY = Pipeline.RUNGS;                        // ['cold',...,'ready']
for (let s = 0; s < N; s++) {
  const key = RUNG_KEY[s];
  for (const lid of LEVER_IDS) {
    const got = qAt(s, lid);
    const exp = EXPECT[key][lid];
    if (!approx(got, exp)) {
      fail('Q*(' + RUNG_DISPLAY[s] + ', ' + lid + ') = ' + got.toFixed(2) + ' expected ' + exp.toFixed(2));
    }
  }
  ok(RUNG_DISPLAY[s].padEnd(11) + ' : ' +
     LEVER_IDS.map(l => l + ' ' + (qAt(s, l) >= 0 ? '+' : '') + qAt(s, l).toFixed(2)).join('  '));
}

/* Headline cells called out in the proposal. */
if (!approx(qAt(0, 'nurture'), 16.70)) fail('headline Q*(COLD, NURTURE) != 16.70');
if (!approx(qAt(0, 'hardclose'), -3.28)) fail('headline Q*(COLD, HARD CLOSE) != -3.28');
if (qAt(0, 'hardclose') >= 0) fail('Q*(COLD, HARD CLOSE) should be the only NEGATIVE cell');
ok('headline cells: Q*(COLD,NURTURE)=+16.70, Q*(COLD,HARD CLOSE)=-3.28 (only negative cell)');

if (policy.join(',') !== EXPECT_POLICY.join(',')) {
  fail('optimal policy ' + policy.join(',') + ' != ' + EXPECT_POLICY.join(','));
}
ok('optimal policy: ' + policy.map((l, i) => RUNG_DISPLAY[i] + '->' + l.toUpperCase()).join(', '));

/* The COLD-NURTURE hand-arithmetic: 0.60*(-1+V*(CURIOUS)) + 0.30*(-1+V*(COLD)) + 0.10*(-10). */
{
  const vCur = V[1], vCold = V[0];
  const hand = 0.60 * (-1 + vCur) + 0.30 * (-1 + vCold) + 0.10 * (-10);
  if (!approx(hand, 16.70)) fail('COLD-NURTURE hand arithmetic = ' + hand.toFixed(2) + ' != 16.70');
  ok('COLD-NURTURE hand check: 0.60*(-1+' + vCur.toFixed(2) + ') + 0.30*(-1+' + vCold.toFixed(2) + ') + 0.10*(-10) = ' + hand.toFixed(2));
}

/* ---------------- Demo trajectory (the optimal staircase in action) ----------------
   One illustrative signed run that climbs COLD->...->READY->SIGNED under the
   optimal policy, hand-built (not sampled) so the trajectory scene has a clean
   canonical tape: see, act, get paid. Each step records the lever pulled, the
   die face, the rung moved to, and the reward. */
const demoTrajectory = (function () {
  const steps = [];
  const plan = [
    { rung: 0, lever: 'nurture',   face: 'up', to: 1,  reward: -1 },   // COLD -> CURIOUS
    { rung: 1, lever: 'demo',      face: 'up', to: 2,  reward: -1 },   // CURIOUS -> ENGAGED
    { rung: 2, lever: 'demo',      face: 'up', to: 3,  reward: -1 },   // ENGAGED -> EVALUATING
    { rung: 3, lever: 'demo',      face: 'up', to: 4,  reward: -1 },   // EVALUATING -> READY
    { rung: 4, lever: 'hardclose', face: 'up', to: -1, reward: 30, signed: true }, // READY -> SIGNED
  ];
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    steps.push({
      i: i + 1,
      fromRung: p.rung,
      lever: p.lever,
      face: p.face,
      toRung: p.to,
      reward: p.reward,
      signed: !!p.signed,
      lost: false,
      terminal: !!p.signed,
    });
  }
  const totalReturn = steps.reduce((s, st) => s + st.reward, 0);   // -4 + 30 = +26
  return { start: 0, policy: 'optimal', steps, totalReturn };
})();
if (demoTrajectory.totalReturn !== 26) fail('demo trajectory return = ' + demoTrajectory.totalReturn + ' != 26');
ok('demo trajectory: COLD->CURIOUS->ENGAGED->EVALUATING->READY->SIGNED, return = +' + demoTrajectory.totalReturn);

/* ---------------- Round helpers ---------------- */
function round2(x) { return Math.round(x * 100) / 100; }
const Vout = Array.from(V).map(round2);                 // 5
const Qout = Array.from(Q).map(round2);                 // 15

/* ---------------- Recap cards (6, ladder voice) ----------------
   One per concept, tied back to the ladder. KaTeX `symbol` strings use
   standard LaTeX; the JSON.stringify below escapes them for the file.
   `hue` maps to a per-card CSS token in the recap scene. */
const recap = [
  {
    key: 'mdp', hue: 'mdp', title: 'The MDP frame',
    symbol: '\\langle S,\\, A,\\, P,\\, R,\\, \\gamma \\rangle',
    caption: 'Your CRM has been an MDP all along: the situation (which rung the lead is on), the lever you pull, the odds the lead warms or cools, and the payoff. Five rungs, three levers.',
    anchor: 'Scene 3: the formalization',
  },
  {
    key: 'policy', hue: 'policy', title: 'Policy = your playbook',
    symbol: '\\pi : S \\rightarrow A',
    caption: 'A policy is one chosen lever per rung, your SOP. A good one changes its mind as the lead warms: nurture cold, demo the middle, close only when ready.',
    anchor: 'Scene 4: two hand-policies',
  },
  {
    key: 'return', hue: 'return', title: 'Return over the deal',
    symbol: 'G_i(\\tau) = \\sum_{j \\ge i} r_j',
    caption: 'The payoff summed over the whole deal, not just this touch, and it varies run to run. One lever from one rung gives a distribution of payoffs, not a single number.',
    anchor: 'Scene 6: the return histogram',
  },
  {
    key: 'qstar', hue: 'qstar', title: 'Q* = the lever scorecard',
    symbol: 'Q^*(s, a) = \\max_\\pi \\mathbb{E}\\,[\\,G_i(\\tau)\\,]',
    caption: 'The true long-run value of pulling lever a in situation s, if you play smart after. The star walks up the ladder: the SAME HARD CLOSE is +29 at READY and -3.28 at COLD.',
    anchor: 'Scene 7: the star-staircase',
  },
  {
    key: 'dp', hue: 'dp', title: 'DP: compute it if you know the odds',
    symbol: 'Q^*(s, a) = \\mathbb{E}\\,[\\,R + \\max_{a\'} Q^*(S\', a\')\\,]',
    caption: 'With the printed STAGE-DIE odds you can fill the whole scorecard by repeated Bellman backups. The greedy playbook locks in within about three sweeps. You usually do not have the odds.',
    anchor: 'Scene 9: filling Q* with DP',
  },
  {
    key: 'sarsa', hue: 'sarsa', title: 'SARSA: learn it by playing',
    symbol: 'q[s,a] \\leftarrow q[s,a] + \\alpha\\,(\\,r + q[s\',a\'] - q[s,a]\\,)',
    caption: 'No printed odds needed: nudge each lever score toward what just happened, exploring a little. The star-staircase emerges from experience: trial, outcome, adjust.',
    anchor: 'Scene 11: the live SARSA demo',
  },
];

/* ---------------- Levers payload (mirrors js/levers.js, for the data layer) ---------------- */
const leversPayload = Levers.LEVERS.map(l => ({
  id: l.id, name: l.name, commitment: l.commitment, tone: l.tone, gloss: l.gloss,
}));

/* ---------------- Build the payload ---------------- */
const payload = {
  /* Static MDP config (mirrors js/ladder.js + js/levers.js). */
  rungs: Pipeline.RUNGS,
  rungDisplay: RUNG_DISPLAY,
  numRungs: N,
  levers: leversPayload,
  leverIds: LEVER_IDS,
  nonTerminalStates: Pipeline.NON_TERMINAL_STATES,
  stageDie: Pipeline.STAGE_DIE,
  rewards: {
    signed: Pipeline.SIGNED_REWARD,
    lost: Pipeline.LOST_REWARD,
    touch: Pipeline.TOUCH_REWARD,
    gamma: GAMMA,
  },

  /* Solved MDP. */
  policy,                         // 5 lever ids (COLD..READY)
  V: Vout,                        // 5 state values (= max-lever Q)
  Qstar: Qout,                    // 5*3, indexed stateIndex*3 + leverIdx

  /* Convergence facts narrated by the DP scene. */
  convergence: {
    itersFixedPoint: vi.iters,
    itersTo1e9,
    policyStableAt,
  },

  demoTrajectory,
  recap,
};

/* ---------------- Emit data/datasets.js ---------------- */
const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.js');
const payloadStr = JSON.stringify(payload, null, 2)
  .split('\n').map((line, i) => (i === 0 ? line : '  ' + line)).join('\n');

const fileContent =
  '/* Pipeline Climb: precomputed MDP solution (value iteration, gamma=1).\n' +
  ' *\n' +
  ' * Regenerate with `node precompute/build-datasets.js`. The build script\n' +
  ' * loads the real engine (js/levers.js, js/ladder.js, js/bellman.js) and\n' +
  ' * ASSERTS the verified Q* grid before writing; if those assertions fail,\n' +
  ' * this file is not written. DO NOT hand-edit.\n' +
  ' *\n' +
  ' * window.DATA shape:\n' +
  ' *   policy      5 lever ids (COLD..READY)\n' +
  ' *   V           5 state values\n' +
  ' *   Qstar       5*3 values, indexed stateIndex*3 + leverIdx\n' +
  ' *   levers      lever metadata (id/name/commitment/tone/gloss)\n' +
  ' *   recap       6 concept cards (ladder voice)\n' +
  ' *   demoTrajectory  one canonical signed run under the optimal policy\n' +
  ' *   stageDie / rewards / convergence  the MDP odds + facts\n' +
  ' */\n' +
  '(function () {\n' +
  '  window.DATA = ' + payloadStr + ';\n' +
  '})();\n';

fs.writeFileSync(datasetsPath, fileContent);
console.log('');
console.log('Wrote ' + datasetsPath + ' (' + (fileContent.length / 1024).toFixed(1) + ' KB)');
console.log('');
console.log('Summary:');
console.log('  policy     : ' + policy.join(', '));
console.log('  V          : ' + Vout.map((v, i) => RUNG_DISPLAY[i] + '=' + v).join('  '));
console.log('  iters      : fixed-point ' + vi.iters + ', 1e-9 ' + itersTo1e9 + ', policy-stable ' + policyStableAt);
console.log('  demo return: +' + demoTrajectory.totalReturn);

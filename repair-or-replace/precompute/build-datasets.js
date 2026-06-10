/* Precompute value iteration for the Repair-or-Replace MDP and write
 * data/datasets.js (window.DATA).
 *
 *   4 wear states (HEALTHY..FAILING), 3 actions (RUN / SERVICE / REPLACE).
 *   Continuing task, gamma = 0.9 (no terminal states).
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   This script LOADS the real engine (js/actions.js, js/van.js,
 *   js/bellman.js) under a minimal window shim, so the numbers here are
 *   the exact numbers the browser computes. It runs value iteration to a
 *   tight fixed point and ASSERTS the verified Q* grid before writing.
 *   The Python reference precompute/value_iteration.py is the design
 *   contract; this file must stay in lockstep with it.
 *
 *   Verified Q* (gamma = 0.9; argmax in brackets):
 *     HEALTHY   RUN [311.0] / SERVICE 229.9 / REPLACE 149.9
 *     WORN          203.4   / SERVICE [226.1] / REPLACE 149.9
 *     SHAKY          96.5   / SERVICE 126.4 / REPLACE [149.9]   <- still runs!
 *     FAILING        -3.1   / SERVICE  86.9 / REPLACE [149.9]
 *   Optimal policy: RUN, SERVICE, REPLACE, REPLACE.
 *   gamma sweep: 0.4 -> RUN RUN SVC SVC; 0.6 -> RUN RUN SVC NEW;
 *                0.8 -> RUN SVC NEW NEW (both frontiers slide left).
 */

'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------- Load the real engine under a window shim ---------------- */
global.window = {};
require(path.join(__dirname, '..', 'js', 'actions.js'));
require(path.join(__dirname, '..', 'js', 'van.js'));
require(path.join(__dirname, '..', 'js', 'bellman.js'));

const Van     = window.Van;
const Actions = window.Actions;
const Bellman = window.Bellman;

const GAMMA = Van.GAMMA;                                // 0.9
const STATE_DISPLAY = Van.STATE_DISPLAY;                // ['HEALTHY',..,'FAILING']
const ACTION_IDS = Actions.MOVE_IDS;                    // [run, service, replace]
const N = Van.NUM_STATES;                               // 4
const A = ACTION_IDS.length;                            // 3

/* ---------------- Value iteration ---------------- */
const vi = Bellman.valueIteration(GAMMA, { tol: 1e-12, maxIters: 100000, recordHistory: false });
const V = vi.V;
const policy = vi.policy;                               // 4 action ids
const Q = Bellman.qFromV(V, GAMMA);                     // 4*3, indexed stateIdx*3 + actionIdx

/* Sweep count to 1e-9 (the DP scene narrates convergence) and the sweep at
   which the greedy policy first locks into the optimal bands. A short
   per-sweep V history feeds the DP scene's stepper. */
const vi9 = Bellman.valueIteration(GAMMA, { tol: 1e-9, maxIters: 100000, recordHistory: false });
const itersTo1e9 = vi9.iters;

let policyStableAt = null;
const dpHistory = [];                                   // [{iter, V:[4], policy:[4 ids|null]}]
{
  const optStr = policy.join(',');
  let Vp = new Float64Array(N);
  dpHistory.push({ iter: 0, V: Array.from(Vp), policy: [null, null, null, null] });
  for (let k = 1; k <= itersTo1e9; k++) {
    const { Vnew } = Bellman.bellmanSweep(Vp, GAMMA);
    Vp = Vnew;
    const pol = Bellman.greedyPolicy(Vp, GAMMA);
    if (policyStableAt === null && pol.join(',') === optStr) policyStableAt = k;
    if (k <= 30) {
      dpHistory.push({
        iter: k,
        V: Array.from(Vp).map(v => Math.round(v * 100) / 100),
        policy: pol,
      });
    }
  }
}

/* ---------------- Assertions (throw / exit on mismatch) ---------------- */
function fail(msg) { console.error('  [FAIL] ' + msg); process.exit(1); }
function ok(msg)   { console.log('  [OK]   ' + msg); }
function approx(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.05 : eps); }
function qAt(s, actionId) { return Q[s * A + ACTION_IDS.indexOf(actionId)]; }

/* The verified grid from precompute/value_iteration.py (1 dp). */
const EXPECT = {
  healthy: { run: 311.0, service: 229.9, replace: 149.9 },
  worn:    { run: 203.4, service: 226.1, replace: 149.9 },
  shaky:   { run:  96.5, service: 126.4, replace: 149.9 },
  failing: { run:  -3.1, service:  86.9, replace: 149.9 },
};
const EXPECT_POLICY = ['run', 'service', 'replace', 'replace'];

console.log('Repair or Replace precompute (gamma=' + GAMMA + ')');
console.log('  ' + N + ' states (' + STATE_DISPLAY.join(', ') + '), ' + A + ' actions (' + ACTION_IDS.join(', ') + ')');
console.log('  VI fixed point in ' + vi.iters + ' sweeps; 1e-9 in ' + itersTo1e9 + '; policy stable at sweep ' + policyStableAt);
console.log('');
console.log('Asserting the verified Q* grid:');

const STATE_KEY = Van.STATES;                           // ['healthy',...,'failing']
for (let s = 0; s < N; s++) {
  const key = STATE_KEY[s];
  for (const aid of ACTION_IDS) {
    const got = qAt(s, aid);
    const exp = EXPECT[key][aid];
    if (!approx(got, exp)) {
      fail('Q*(' + STATE_DISPLAY[s] + ', ' + aid + ') = ' + got.toFixed(2) + ' expected ' + exp.toFixed(1));
    }
  }
  ok(STATE_DISPLAY[s].padEnd(8) + ' : ' +
     ACTION_IDS.map(a => a + ' ' + (qAt(s, a) >= 0 ? '+' : '') + qAt(s, a).toFixed(1)).join('  '));
}

if (policy.join(',') !== EXPECT_POLICY.join(',')) {
  fail('optimal policy ' + policy.join(',') + ' != ' + EXPECT_POLICY.join(','));
}
ok('optimal policy: ' + policy.map((a, i) => STATE_DISPLAY[i] + '->' + a.toUpperCase()).join(', '));

/* The design contract from value_iteration.py: the surprise + both margins. */
if (!(qAt(2, 'replace') > qAt(2, 'service') + 15)) fail('SHAKY replace margin too thin');
if (!(qAt(1, 'service') > qAt(1, 'run') + 15 && qAt(1, 'service') > qAt(1, 'replace') + 15)) {
  fail('WORN service margin too thin');
}
if (!(qAt(3, 'run') < 0)) fail('Q*(FAILING, RUN) should be negative');
ok('surprise: REPLACE beats SERVICE at SHAKY by +' + (qAt(2, 'replace') - qAt(2, 'service')).toFixed(1) +
   '; RUN at FAILING is ' + qAt(3, 'run').toFixed(1) + ' (loses money)');

/* ---------------- The gamma sweep (scene 6 slider) ----------------
   Re-solve for a dense grid of gammas; both frontiers must slide left as
   patience rises. Assert the three signpost rows from the plan. */
function solveAt(gamma) {
  const r = Bellman.valueIteration(gamma, { tol: 1e-12, maxIters: 200000, recordHistory: false });
  const q = Bellman.qFromV(r.V, gamma);
  return {
    gamma: Math.round(gamma * 100) / 100,
    policy: r.policy,
    V: Array.from(r.V).map(v => Math.round(v * 10) / 10),
    Q: Array.from(q).map(v => Math.round(v * 10) / 10),
  };
}
const gammaSweep = [];
for (let g = 0; g <= 99; g++) gammaSweep.push(solveAt(g / 100));

function sweepPolicyAt(g) {
  return gammaSweep[Math.round(g * 100)].policy.join(',');
}
if (sweepPolicyAt(0.4) !== 'run,run,service,service') fail('gamma=0.4 policy != RUN RUN SVC SVC: ' + sweepPolicyAt(0.4));
if (sweepPolicyAt(0.6) !== 'run,run,service,replace') fail('gamma=0.6 policy != RUN RUN SVC NEW: ' + sweepPolicyAt(0.6));
if (sweepPolicyAt(0.8) !== 'run,service,replace,replace') fail('gamma=0.8 policy != RUN SVC NEW NEW: ' + sweepPolicyAt(0.8));
if (sweepPolicyAt(0.9) !== 'run,service,replace,replace') fail('gamma=0.9 policy != optimal bands');
ok('gamma sweep signposts: 0.4 -> RUN RUN SVC SVC; 0.6 -> RUN RUN SVC NEW; 0.8+ -> RUN SVC NEW NEW');

/* Monotonicity: as gamma rises, the policy at each state only ever moves
   toward the bigger-commitment action (run -> service -> replace). */
const RANK = { run: 0, service: 1, replace: 2 };
for (let s = 0; s < N; s++) {
  let prev = -1;
  for (const pt of gammaSweep) {
    const r = RANK[pt.policy[s]];
    if (r < prev) fail('policy at ' + STATE_DISPLAY[s] + ' regressed as gamma rose (g=' + pt.gamma + ')');
    prev = r;
  }
}
ok('both frontiers slide monotonically left as gamma rises (' + gammaSweep.length + ' grid points)');

/* ---------------- Demo trajectory (scene 5's canonical tape) ----------------
   One illustrative six-week run under the optimal bands, hand-built (not
   sampled) so the trajectory scene has a clean canonical tape that shows all
   three actions, the wear drift, and the SHAKY replace. Faces use the
   engine's log vocabulary (wearD / fixU / new). */
const demoTrajectory = (function () {
  const plan = [
    { wear: 0, action: 'run',     face: 'wear1', to: 1, reward:  95 },  // HEALTHY -> WORN
    { wear: 1, action: 'service', face: 'fix1',  to: 0, reward: -50 },  // WORN -> HEALTHY
    { wear: 0, action: 'run',     face: 'wear0', to: 0, reward:  95 },  // HEALTHY stays
    { wear: 0, action: 'run',     face: 'wear1', to: 1, reward:  95 },  // HEALTHY -> WORN
    { wear: 1, action: 'run',     face: 'wear1', to: 2, reward:  72 },  // WORN -> SHAKY (drifted past the line)
    { wear: 2, action: 'replace', face: 'new',   to: 0, reward: -130 }, // SHAKY -> brand-new van
  ];
  const steps = plan.map((p, i) => ({
    i: i + 1,
    fromWear: p.wear,
    action: p.action,
    face: p.face,
    toWear: p.to,
    reward: p.reward,
    breakdown: false,
  }));
  const totalReturn = steps.reduce((s, st) => s + st.reward, 0);
  let discounted = 0;
  for (let i = 0; i < steps.length; i++) discounted += Math.pow(GAMMA, i) * steps[i].reward;
  return {
    start: 0, policy: 'optimal-bands', steps,
    totalReturn,
    discountedReturn: Math.round(discounted * 100) / 100,
  };
})();
/* Sanity: every step in the tape must be a possible transition of the engine. */
for (const st of demoTrajectory.steps) {
  const succ = Van.successors({ wear: st.fromWear, terminal: false }, st.action);
  const hit = succ.find(b => b.sNext.wear === st.toWear && Math.abs(b.reward - st.reward) < 1e-9);
  if (!hit) fail('demo trajectory step ' + st.i + ' is not a legal transition');
}
if (demoTrajectory.totalReturn !== 177) fail('demo trajectory raw total = ' + demoTrajectory.totalReturn + ' != 177');
ok('demo trajectory: 6 weeks, all three actions, raw total +' + demoTrajectory.totalReturn +
   ', discounted ' + demoTrajectory.discountedReturn);

/* ---------------- Round helpers ---------------- */
function round1(x) { return Math.round(x * 10) / 10; }
const Vout = Array.from(V).map(round1);                 // 4
const Qout = Array.from(Q).map(round1);                 // 12

/* ---------------- Recap cards (6, Bessie's voice) ---------------- */
const recap = [
  {
    key: 'mdp', hue: 'mdp', title: 'The MDP frame',
    symbol: '\\langle S,\\, A,\\, P,\\, R,\\, \\gamma \\rangle',
    caption: 'The fleet sheet has been an MDP all along: the state (how worn the van is), the action you pick each week, the odds of wear and breakdown, and the money. Four states, three actions.',
    anchor: 'Scene 3: the formalization',
  },
  {
    key: 'policy', hue: 'policy', title: 'Policy = your maintenance playbook',
    symbol: '\\pi : S \\rightarrow A',
    caption: 'A policy is one chosen action per wear state, your standing order. A good one changes its mind as the van ages: run it young, shop it worn, scrap it shaky.',
    anchor: 'Scene 4: the 4-cell playbook',
  },
  {
    key: 'return', hue: 'return', title: 'Return over the van’s life',
    symbol: 'G_i = \\sum_{j \\ge i} \\gamma^{\\,j-i}\\, r_j',
    caption: 'The money summed over every week ahead, future weeks discounted by gamma. Patience is a dial: short-sighted owners patch forever; patient owners replace while it still starts.',
    anchor: 'Scene 6: the gamma slider',
  },
  {
    key: 'qstar', hue: 'qstar', title: 'Q* = the action scorecard',
    symbol: 'Q^*(s, a) = \\max_\\pi \\mathbb{E}\\,[\\,G \\mid s, a\\,]',
    caption: 'The true long-run value of each call in each state, if you play smart afterwards. Twelve cells, three bands, and the stars say: scrap the van at SHAKY, while it still runs.',
    anchor: 'Scene 7: the 12-cell scorecard',
  },
  {
    key: 'dp', hue: 'dp', title: 'DP: compute it if you know the odds',
    symbol: 'Q^*(s, a) = \\mathbb{E}\\,[\\,R + \\gamma \\max_{a\'} Q^*(S\', a\')\\,]',
    caption: 'With the wear and breakdown odds printed, repeated Bellman backups fill the whole scorecard; the bands lock in within a handful of sweeps. You usually do not have the odds.',
    anchor: 'Scene 9: filling Q* with DP',
  },
  {
    key: 'sarsa', hue: 'sarsa', title: 'SARSA: learn it from the logbook',
    symbol: 'q[s,a] \\leftarrow q[s,a] + \\alpha\\,(\\,r + \\gamma\\, q[s\',a\'] - q[s,a]\\,)',
    caption: 'No odds needed: nudge each cell toward what last week actually paid, exploring a little. The same three bands emerge from nothing but driving, billing, and breakdowns.',
    anchor: 'Scene 11: the live SARSA demo',
  },
];

/* ---------------- Actions payload (mirrors js/actions.js) ---------------- */
const actionsPayload = Actions.ACTIONS.map(a => ({
  id: a.id, name: a.name, commitment: a.commitment, tone: a.tone, gloss: a.gloss,
}));

/* ---------------- Build the payload ---------------- */
const payload = {
  /* Static MDP config (mirrors js/van.js + js/actions.js). */
  states: Van.STATES,
  stateDisplay: STATE_DISPLAY,
  numStates: N,
  actions: actionsPayload,
  actionIds: ACTION_IDS,
  nonTerminalStates: Van.NON_TERMINAL_STATES,
  model: {
    revRun: Van.REV_RUN,
    pBreakdown: Van.P_BD,
    breakdownCost: Van.BREAKDOWN_COST,
    degrade: Van.DEGR,
    serviceCost: Van.C_SERVICE,
    serviceUp: Van.SERV_UP,
    replaceCost: Van.C_REPLACE,
    gamma: GAMMA,
  },

  /* Solved MDP at gamma = 0.9. */
  policy,                         // 4 action ids (HEALTHY..FAILING)
  V: Vout,                        // 4 state values (= max-action Q)
  Qstar: Qout,                    // 4*3, indexed stateIndex*3 + actionIdx

  /* Convergence facts narrated by the DP scene. */
  convergence: {
    itersFixedPoint: vi.iters,
    itersTo1e9,
    policyStableAt,
    dpHistory,                    // first 30 sweeps: V + greedy policy
  },

  /* gamma slider data: policy / V / Q at every gamma in 0.00..0.99. */
  gammaSweep,

  demoTrajectory,
  recap,
};

/* ---------------- Emit data/datasets.js ---------------- */
const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.js');
const payloadStr = JSON.stringify(payload, null, 2)
  .split('\n').map((line, i) => (i === 0 ? line : '  ' + line)).join('\n');

const fileContent =
  '/* Repair or Replace: precomputed MDP solution (value iteration, gamma=0.9).\n' +
  ' *\n' +
  ' * Regenerate with `node precompute/build-datasets.js`. The build script\n' +
  ' * loads the real engine (js/actions.js, js/van.js, js/bellman.js) and\n' +
  ' * ASSERTS the verified Q* grid, the optimal bands, the SHAKY surprise and\n' +
  ' * the gamma-sweep signposts before writing; if any assertion fails, this\n' +
  ' * file is not written. DO NOT hand-edit.\n' +
  ' *\n' +
  ' * window.DATA shape:\n' +
  ' *   policy        4 action ids (HEALTHY..FAILING) = RUN/SERVICE/REPLACE/REPLACE\n' +
  ' *   V             4 state values\n' +
  ' *   Qstar         4*3 values, indexed stateIndex*3 + actionIdx\n' +
  ' *   gammaSweep    100 solved points (gamma 0.00..0.99): {gamma, policy, V, Q}\n' +
  ' *   model         the MDP numbers (profits, breakdown odds, costs)\n' +
  ' *   demoTrajectory  one canonical six-week run under the optimal bands\n' +
  ' *   convergence   sweep counts + first-30-sweep DP history\n' +
  ' *   recap         6 concept cards\n' +
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
console.log('  V          : ' + Vout.map((v, i) => STATE_DISPLAY[i] + '=' + v).join('  '));
console.log('  iters      : fixed-point ' + vi.iters + ', 1e-9 ' + itersTo1e9 + ', policy-stable ' + policyStableAt);
console.log('  demo tape  : raw +' + demoTrajectory.totalReturn + ', discounted ' + demoTrajectory.discountedReturn);

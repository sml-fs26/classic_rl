/* Press Your Luck (Pig) precompute.
 *
 *   Runs the EXACT-STATE win-probability dynamic program vs the fixed
 *   "house holds at 20" rival (TARGET = 50, gamma = 1), projects the exact
 *   optimal action onto the 18-cell display grid (pot bucket x standing),
 *   and writes data/datasets.js as window.DATA.
 *
 *   Run with:  node precompute/build-datasets.js
 *
 *   The engine itself lives in js/pig.js (window.Pig); we require it here
 *   (with a minimal window shim) so the precompute and the runtime share a
 *   single source of truth for the DP. The reused bellman/sarsa are not
 *   exercised here: the bucketed display MDP is non-Markov, so the DP scene
 *   animates the stored oracle fill rather than re-deriving it in-page.
 *
 *   ASSERTIONS (throw / exit on mismatch):
 *     1) At pot = 18, the optimal lever is ROLL for BEHIND and EVEN but
 *        HOLD for AHEAD (the state-dependent twist).
 *     2) The hold-threshold ordering is AHEAD < EVEN < BEHIND (the climbing
 *        staircase) at the representative standings.
 *     3) The projected 18-cell oracle shows at least one HOLD cell and at
 *        least one ROLL cell (two regions exist), and the AHEAD column
 *        holds at a strictly lower pot bucket than the BEHIND column.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function round(x, places) { const f = Math.pow(10, places); return Math.round(x * f) / f; }

/*, Load the engine with a minimal window shim., */
global.window = global.window || {};
require(path.join(__dirname, '..', 'js', 'actions.js'));
require(path.join(__dirname, '..', 'js', 'pig.js'));
const Pig = global.window.Pig;
const Levers = global.window.Levers;
const LEVER_IDS = Levers.LEVER_IDS;              // ['roll','hold']

const TARGET = Pig.TARGET;
const RIVAL_HOLD = Pig.RIVAL_HOLD;

/*, Solve the exact-state DP., */
console.log('Press Your Luck precompute - exact-state win-prob DP');
console.log('  TARGET = ' + TARGET + ', rival holds at ' + RIVAL_HOLD + ', gamma = 1');
const t0 = Date.now();
const solveInfo = Pig.solve({ maxSweeps: 80, tol: 1e-11 });
console.log('  converged in ' + solveInfo.sweeps + ' sweeps (' + (Date.now() - t0) + ' ms)');
console.log('  winProb at start (0, 0) = ' + Pig.winProb(0, 0, 0).toFixed(4));
console.log('');

/*, Project the exact optimal action onto the 18-cell display grid. ----
   For each cell (pot bucket, standing) we use the standing's representative
   (my, riv) scores and the bucket's representative pot. oraclePolicy holds
   18 lever ids; oracleQ holds 18 * 2 win-prob values laid out as
   [cellIndex * 2 + leverIndex]. */
const NCELLS = Pig.POT_BUCKETS * Pig.STANDINGS;   // 18
const oraclePolicy = new Array(NCELLS);
const oracleQ = new Array(NCELLS * 2);
for (let i = 0; i < NCELLS; i++) {
  const rep = Pig.repStateForCell(i);
  const q = Pig.Q(rep.my, rep.riv, rep.pot);
  oracleQ[i * 2 + 0] = round(q.roll, 4);
  oracleQ[i * 2 + 1] = round(q.hold, 4);
  oraclePolicy[i] = (q.roll >= q.hold) ? 'roll' : 'hold';
}

/*, The twist at pot = 18, projected on the three representative
   standings (BEHIND / EVEN / AHEAD)., */
const REP = Pig.STANDING_REP;   // [{my,riv} BEHIND, EVEN, AHEAD]
function qAt(rep, pot) {
  const q = Pig.Q(rep.my, rep.riv, pot);
  return { roll: round(q.roll, 4), hold: round(q.hold, 4), best: (q.roll >= q.hold ? 'roll' : 'hold') };
}
const twist = {
  pot: 18,
  behind: Object.assign({ my: REP[0].my, riv: REP[0].riv }, qAt(REP[0], 18)),
  even:   Object.assign({ my: REP[1].my, riv: REP[1].riv }, qAt(REP[1], 18)),
  ahead:  Object.assign({ my: REP[2].my, riv: REP[2].riv }, qAt(REP[2], 18)),
};

/*, Hold-threshold staircase (smallest pot where HOLD beats ROLL). ----
   Computed for each representative standing, plus a small ladder of own
   scores so a scene can draw the climbing frontier. Infinity is serialised
   as null (the "rolls on past TARGET" case). */
function thrAt(my, riv) {
  const t = Pig.holdThreshold(my, riv);
  return Number.isFinite(t) ? t : null;
}
const staircase = {
  behind: thrAt(REP[0].my, REP[0].riv),
  even:   thrAt(REP[1].my, REP[1].riv),
  ahead:  thrAt(REP[2].my, REP[2].riv),
  /* ladder rows used for the staircase plot: representative own scores. */
  ladder: [
    { own: 10, ahead: thrAt(10, 0), even: thrAt(10, 10), behind: thrAt(10, 25) },
    { own: 15, ahead: thrAt(15, 0), even: thrAt(15, 15), behind: thrAt(15, 30) },
    { own: 20, ahead: thrAt(20, 5), even: thrAt(20, 20), behind: thrAt(20, 35) },
    { own: 25, ahead: thrAt(25, 10), even: thrAt(25, 25), behind: thrAt(25, 40) },
  ],
  breakEven: 20,
};

/*, DP-fill snapshots for the DP scene. ----
   We project the partially-converged exact Q onto the 18-cell policy at a
   handful of sweep counts. Each capped re-solve runs the value iteration
   from scratch for `k` sweeps, so the projected policy reflects the state
   of belief after k backups. (The exact-state recursion has no per-cell
   "fill order"; the 18-cell snapshots show the policy regions settling.) */
const SNAPSHOT_SWEEPS = [1, 2, 3, 5, 8, 14, solveInfo.sweeps];
const sweepSnapshots = [];
for (const k of SNAPSHOT_SWEEPS) {
  Pig.solve({ maxSweeps: k, tol: -1, force: true });   // exactly k sweeps
  const policy = new Array(NCELLS);
  const q = new Array(NCELLS * 2);
  for (let i = 0; i < NCELLS; i++) {
    const rep = Pig.repStateForCell(i);
    const qq = Pig.Q(rep.my, rep.riv, rep.pot);
    q[i * 2 + 0] = round(qq.roll, 4);
    q[i * 2 + 1] = round(qq.hold, 4);
    policy[i] = (qq.roll >= qq.hold) ? 'roll' : 'hold';
  }
  sweepSnapshots.push({ sweep: k, policy, Q: q });
}
/* Re-solve to the true fixed point so post-build accessors are exact. */
Pig.solve({ maxSweeps: 80, tol: 1e-11, force: true });

/*, One fixed illustrative game (demoTrajectory). ----
   A single seeded rollout of MY decisions vs the rival, following the exact
   optimal policy, recorded turn by turn so the trajectory scene can replay
   it deterministically. */
/* Seed chosen so the illustrative game is varied and legible: I follow the
   exact optimal policy, bank a few times (the chunk), eat a bust (the felt
   risk), the standing flips, and I win a genuine race rather than a blowout. */
const DEMO_SEED = 20;
function buildDemoTrajectory(seed) {
  const rng = Pig.makeRng(seed);
  let st = Pig.initialState();
  const steps = [];
  let guard = 0;
  while (!st.terminal && guard < 400) {
    guard++;
    if (st.turn === 'me') {
      const q = Pig.Q(st.my, st.riv, st.pot);
      const lever = (q.roll >= q.hold) ? 'roll' : 'hold';
      const before = { my: st.my, riv: st.riv, pot: st.pot };
      const res = Pig.sample(st, lever, rng);
      steps.push({
        who: 'me', lever, before,
        face: res.log.face || 0,
        busted: !!res.log.busted,
        banked: res.log.banked || 0,
        after: { my: res.sNext.my, riv: res.sNext.riv, pot: res.sNext.pot },
        reward: res.reward,
        terminal: !!res.terminal,
        win: !!res.win,
      });
      st = res.sNext;
    } else if (st.turn === 'rival') {
      const res = Pig.rivalTurn(st.my, st.riv, rng);
      steps.push({
        who: 'rival',
        before: { my: st.my, riv: st.riv },
        rolls: res.rolls,
        after: { my: res.my, riv: res.riv, pot: 0 },
        rivalWon: !!res.rivalWon,
        terminal: !!res.terminal,
      });
      st = res;
    } else break;
  }
  return {
    seed,
    target: TARGET,
    finalMy: st.my,
    finalRiv: st.riv,
    iWon: st.my >= TARGET,
    turns: steps.length,
    steps,
  };
}
const demoTrajectory = buildDemoTrajectory(DEMO_SEED);

/*, Recap: six concept cards in the table-card voice., */
const recap = [
  {
    key: 'mdp', label: 'MDP', scene: 3, title: 'THE FOUR-PART FRAME',
    text: 'The situation is (pot, standing). The lever is ROLL or HOLD. The part you do not control is the die. The payoff is binary: +1 if you reach ' + TARGET + ' first, 0 if the rival does.',
  },
  {
    key: 'policy', label: 'POLICY', scene: 4, title: 'YOUR PLAYBOOK',
    text: 'A policy assigns one lever to every cell of the board. The naive playbook banks at 20 and ignores the scoreboard. The good one reads your standing.',
  },
  {
    key: 'return', label: 'RETURN', scene: 6, title: 'THE WIN, NOT THE GAME',
    text: 'The return from here is the eventual win or loss: 1 or 0. Judge a lever by its win RATE over many games, never by one lucky roll.',
  },
  {
    key: 'qstar', label: 'Q*', scene: 7, title: 'THE HONEST WIN-ODDS',
    text: 'Q*(s, lever) is the true long-run win probability of pulling that lever now, then playing smart. At pot 18 the best lever flips on standing alone: ROLL when behind, HOLD when ahead.',
  },
  {
    key: 'dp', label: 'DP', scene: 9, title: 'THE EXACT PLAYBOOK',
    text: 'Knowing the die (a flat 1/6) and pinning the rival makes this a single-agent MDP. Sweep the Bellman backup to a fixed point and the climbing staircase draws itself.',
  },
  {
    key: 'sarsa', label: 'SARSA', scene: 11, title: 'LEARN IT BY PLAYING',
    text: 'Drop the model. Play game after game, nudge the table toward what actually happened, and the same press-when-behind, bank-when-ahead rule emerges on its own.',
  },
];

/* =================== ASSERTIONS =================== */
function assert(name, ok, info) {
  if (ok) { console.log('  [OK]   ' + name); return; }
  console.error('  [FAIL] ' + name + (info ? ' - ' + info : ''));
  process.exit(1);
}

console.log('Assertions:');
/* 1) The twist at pot = 18. */
assert('pot=18 BEHIND -> ROLL (roll ' + twist.behind.roll + ' >= hold ' + twist.behind.hold + ')',
  twist.behind.best === 'roll', 'best=' + twist.behind.best);
assert('pot=18 EVEN -> ROLL (roll ' + twist.even.roll + ' >= hold ' + twist.even.hold + ')',
  twist.even.best === 'roll', 'best=' + twist.even.best);
assert('pot=18 AHEAD -> HOLD (hold ' + twist.ahead.hold + ' > roll ' + twist.ahead.roll + ')',
  twist.ahead.best === 'hold', 'best=' + twist.ahead.best);

/* 2) Hold-threshold ordering AHEAD < EVEN < BEHIND (null = +inf for BEHIND). */
const aT = staircase.ahead, eT = staircase.even, bT = staircase.behind;
const bTcmp = (bT == null) ? Infinity : bT;
assert('hold-threshold AHEAD (' + aT + ') < EVEN (' + eT + ')', aT != null && eT != null && aT < eT);
assert('hold-threshold EVEN (' + eT + ') < BEHIND (' + (bT == null ? 'inf' : bT) + ')', eT < bTcmp);

/* 3) Two regions on the projected board + AHEAD holds lower than BEHIND. */
const nHold = oraclePolicy.filter(a => a === 'hold').length;
const nRoll = oraclePolicy.filter(a => a === 'roll').length;
assert('projected board has both HOLD (' + nHold + ') and ROLL (' + nRoll + ') cells', nHold > 0 && nRoll > 0);
/* Smallest pot bucket that holds, per column. */
function firstHoldBucket(standing) {
  for (let pb = 0; pb < Pig.POT_BUCKETS; pb++) {
    if (oraclePolicy[Pig.displayIndex(pb, standing)] === 'hold') return pb;
  }
  return Pig.POT_BUCKETS;   // never holds
}
const ahHold = firstHoldBucket(2), evHold = firstHoldBucket(1), beHold = firstHoldBucket(0);
assert('AHEAD column holds at a lower pot bucket than BEHIND (ahead@' + ahHold + ' < behind@' + beHold + ')',
  ahHold < beHold);
assert('staircase is monotone on the board: AHEAD@' + ahHold + ' <= EVEN@' + evHold + ' <= BEHIND@' + beHold,
  ahHold <= evHold && evHold <= beHold);

console.log('');

/* =================== WRITE data/datasets.js =================== */
const DATA = {
  target: TARGET,
  rivalHold: RIVAL_HOLD,
  gamma: 1,
  /* The 18-cell display grid description. */
  potBuckets: Pig.POT_BUCKETS,
  potBucketLabels: Pig.POT_BUCKET_LABELS,
  potBucketRep: Pig.POT_BUCKET_REP,
  standings: Pig.STANDINGS,
  standingLabels: Pig.STANDING_LABELS,
  standingRep: Pig.STANDING_REP,
  levers: Levers.LEVERS.map(l => ({ id: l.id, name: l.name })),
  leverIds: LEVER_IDS,

  /* The DP oracle (DP scene + SARSA convergence target). */
  oraclePolicy,                 // 18 lever ids
  oracleQ,                      // 18 * 2 win-prob values, [cell*2 + leverIdx]
  sweepSnapshots,               // staged 18-cell fill for the DP animation

  /* The twist + staircase (the jewel). */
  twist: { pot18: { behind: twist.behind, even: twist.even, ahead: twist.ahead } },
  staircase,

  /* Win prob at the start of the game. */
  startWinProb: round(Pig.winProb(0, 0, 0), 4),

  /* Six recap concept cards + one fixed illustrative game. */
  recap,
  demoTrajectory,

  /* KaTeX strings used across the formula scenes. */
  tex: {
    state: 's = (\\text{pot bucket } p,\\ \\text{standing } c)',
    actions: 'A = \\{\\, \\textsf{ROLL},\\ \\textsf{HOLD} \\,\\}',
    return: 'G_i(\\tau) = \\sum_{j \\ge i} r_j \\in \\{0, 1\\}',
    qstar: 'Q^*(s, a) = \\max\\ \\mathbb{E}\\,[\\,G_i(\\tau)\\,]',
    bellman: "Q^*(s, a) = \\mathbb{E}\\,[\\, R + \\max_{a'} Q^*(S', a') \\,]",
    sarsa: "q[s,a] \\leftarrow q[s,a] + \\alpha\\,[\\, r + q[s',a'] - q[s,a] \\,]",
    breakEven: '\\tfrac{2+3+4+5+6}{6} = 3.33 = 20 \\cdot \\tfrac{1}{6}',
  },
};

const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.js');
const fileContent =
  "/* Press Your Luck (Pig) - exact-state win-probability DP results.\n" +
  " *\n" +
  " * Regenerate with `node precompute/build-datasets.js`. The build script\n" +
  " * asserts the twist (pot=18: ROLL behind/even, HOLD ahead) and the\n" +
  " * climbing hold-threshold staircase (AHEAD < EVEN < BEHIND); if those\n" +
  " * assertions fail, this file is not written.\n" +
  " *\n" +
  " * A state value here IS a win probability (gamma = 1, +1 win / 0 loss).\n" +
  " */\n" +
  "(function () {\n" +
  "  window.DATA = " + JSON.stringify(DATA, null, 2).replace(/\n/g, '\n  ') + ";\n" +
  "})();\n";

fs.writeFileSync(datasetsPath, fileContent);
console.log('Wrote ' + datasetsPath + ' (' + (fileContent.length / 1024).toFixed(1) + ' KB)');
console.log('');
console.log('Summary:');
console.log('  twist @ pot 18:   BEHIND ' + twist.behind.best.toUpperCase() +
            ' / EVEN ' + twist.even.best.toUpperCase() +
            ' / AHEAD ' + twist.ahead.best.toUpperCase());
console.log('  hold thresholds:  AHEAD ' + aT + ' < EVEN ' + eT + ' < BEHIND ' + (bT == null ? 'never' : bT));
console.log('  projected board:  ' + nHold + ' HOLD cells, ' + nRoll + ' ROLL cells');
console.log('  demo game:        ' + demoTrajectory.turns + ' turns, ' +
            (demoTrajectory.iWon ? 'I WON' : 'RIVAL WON') +
            ' (' + demoTrajectory.finalMy + ' vs ' + demoTrajectory.finalRiv + ')');

#!/usr/bin/env node
/* build-datasets.js — generate `data/datasets.js` for the Spooky House viz.
 *
 * Pedagogical invariants this script enforces (any of which would tank the
 * lesson if it slipped through):
 *
 *   I1.  Greedy-local total reward < optimal total reward, gap >= 3.
 *        Scene 2 needs a meaningful gap; if greedy ties or wins, the
 *        comparison falls flat.
 *
 *   I2.  Optimal path under γ = 1.0 differs from optimal path under at
 *        least one γ ∈ {0.7, 0.5}.  Without this, scene 5's slider does
 *        nothing visible.
 *
 *   I3.  Every V value finite and >= 0.  (With non-negative rewards and
 *        γ ∈ [0, 1] this is automatic, but assert in code so a future
 *        edit that switches to signed rewards or off-by-one indexing fails
 *        loudly.)
 *
 *   I4.  All rewards in {1..9}, all integers.  Matches the notebook's
 *        `random.randint(1, 9)` and the 9-step purple intensity ramp.
 *
 *   I5.  The reward at start (0,0) is not the maximum on the grid.  This
 *        is a soft pedagogical constraint — if the start happens to be
 *        the peak, the manual scene's "is this the best" question loses
 *        bite, because the student naturally lingers there.
 *
 * Determinism: a seeded Mulberry32 RNG, with the seed pinned at the top of
 * the file. We iterate over a small candidate-seed range until the first
 * seed satisfies all hard invariants — the chosen seed is then frozen via
 * CHOSEN_SEED. The byte-identical regen requirement of the SKILL holds
 * because the script always runs the same loop and stops at the same seed.
 *
 * Usage:
 *   node precompute/build-datasets.js
 * Run from the spooky-house/ directory. Writes data/datasets.js.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const M = 5;
const N = 5;
const REWARD_MIN = 1;
const REWARD_MAX = 9;

/* Iterate seeds starting from this anchor; pin the first seed that meets
   every invariant. Seeds 1..200 give a healthy search space at zero CPU
   cost for a 5×5 grid. */
const SEED_ANCHOR = 0xA77ECA55;  /* arbitrary but pinned */

/* --------- Mulberry32 (6-line seeded RNG) ----------------------------- */
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid(seed) {
  const rng = mulberry32(seed);
  const rewards = [];
  for (let r = 0; r < M; r++) {
    const row = [];
    for (let c = 0; c < N; c++) {
      row.push(REWARD_MIN + Math.floor(rng() * (REWARD_MAX - REWARD_MIN + 1)));
    }
    rewards.push(row);
  }
  return rewards;
}

/* --------- Bellman computations (mirror of js/bellman.js) -------------- */
function computeV(rewards, gamma) {
  const V = [];
  for (let r = 0; r < M; r++) V.push(new Array(N).fill(0));
  for (let r = M - 1; r >= 0; r--) {
    for (let c = N - 1; c >= 0; c--) {
      const reward = rewards[r][c];
      const downValid = r + 1 < M;
      const rightValid = c + 1 < N;
      let best = 0;
      if (!downValid && !rightValid) best = 0;
      else if (!downValid) best = V[r][c + 1];
      else if (!rightValid) best = V[r + 1][c];
      else best = Math.max(V[r + 1][c], V[r][c + 1]);
      V[r][c] = reward + gamma * best;
    }
  }
  return V;
}

function computeOptimalPath(V) {
  const path = [];
  let r = 0, c = 0;
  path.push({ r, c });
  while (r < M - 1 || c < N - 1) {
    const downValid = r + 1 < M;
    const rightValid = c + 1 < N;
    let goDown;
    if (!downValid) goDown = false;
    else if (!rightValid) goDown = true;
    else goDown = V[r + 1][c] > V[r][c + 1]; /* ties → right */
    if (goDown) r += 1; else c += 1;
    path.push({ r, c });
  }
  return path;
}

function computeGreedyLocalPath(rewards) {
  const path = [];
  let r = 0, c = 0;
  path.push({ r, c });
  while (r < M - 1 || c < N - 1) {
    const downValid = r + 1 < M;
    const rightValid = c + 1 < N;
    let goDown;
    if (!downValid) goDown = false;
    else if (!rightValid) goDown = true;
    else goDown = rewards[r + 1][c] > rewards[r][c + 1]; /* ties → right */
    if (goDown) r += 1; else c += 1;
    path.push({ r, c });
  }
  return path;
}

function pathReward(rewards, path) {
  return path.reduce((acc, { r, c }) => acc + rewards[r][c], 0);
}

function pathsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].r !== b[i].r || a[i].c !== b[i].c) return false;
  }
  return true;
}

function gridMax(rewards) {
  let m = -Infinity;
  for (let r = 0; r < M; r++) for (let c = 0; c < N; c++) {
    if (rewards[r][c] > m) m = rewards[r][c];
  }
  return m;
}

/* --------- Invariant checks ------------------------------------------- */
function checkInvariants(rewards) {
  const reasons = [];

  /* I4: rewards in {1..9} */
  for (let r = 0; r < M; r++) for (let c = 0; c < N; c++) {
    const v = rewards[r][c];
    if (!Number.isInteger(v) || v < REWARD_MIN || v > REWARD_MAX) {
      reasons.push(`I4 fail: rewards[${r}][${c}] = ${v}`);
    }
  }

  const V1 = computeV(rewards, 1.0);
  const V09 = computeV(rewards, 0.9);
  const V07 = computeV(rewards, 0.7);
  const V05 = computeV(rewards, 0.5);

  /* I3: every V finite, >= 0 */
  for (const grid of [V1, V09, V07, V05]) {
    for (let r = 0; r < M; r++) for (let c = 0; c < N; c++) {
      const v = grid[r][c];
      if (!Number.isFinite(v) || v < 0) {
        reasons.push(`I3 fail: V[${r}][${c}] = ${v}`);
      }
    }
  }

  const optPath = computeOptimalPath(V1);
  const greedyPath = computeGreedyLocalPath(rewards);
  const optScore = pathReward(rewards, optPath);
  const greedyScore = pathReward(rewards, greedyPath);

  /* I1: greedy < optimal by at least 3 */
  if (!(greedyScore + 3 <= optScore)) {
    reasons.push(`I1 fail: greedy=${greedyScore}, optimal=${optScore}, gap=${optScore - greedyScore}`);
  }

  /* I2: at least one γ in {0.7, 0.5} flips the optimal path vs γ=1 */
  const optPath07 = computeOptimalPath(V07);
  const optPath05 = computeOptimalPath(V05);
  const flipped = !pathsEqual(optPath, optPath07) || !pathsEqual(optPath, optPath05);
  if (!flipped) {
    reasons.push(`I2 fail: optimal path is identical for γ ∈ {1.0, 0.7, 0.5}`);
  }

  /* I5: start cell is not the global maximum */
  const startReward = rewards[0][0];
  if (startReward === gridMax(rewards)) {
    reasons.push(`I5 fail: start (0,0) is the global max (${startReward})`);
  }

  return {
    pass: reasons.length === 0,
    reasons,
    V1, V09, V07, V05,
    optPath, optPath07, optPath05,
    greedyPath,
    optScore, greedyScore,
  };
}

/* --------- Search for the canonical seed ------------------------------- */
function findGoodSeed() {
  for (let i = 0; i < 1024; i++) {
    const seed = (SEED_ANCHOR + i) >>> 0;
    const rewards = makeGrid(seed);
    const check = checkInvariants(rewards);
    if (check.pass) return { seed, offset: i, rewards, check };
  }
  throw new Error('No seed in [SEED_ANCHOR, SEED_ANCHOR+1024) satisfies all invariants.');
}

/* --------- Emit data/datasets.js -------------------------------------- */
function emit(rewards, check, seed, offset) {
  const optPath09 = computeOptimalPath(check.V09);
  const v1 = check.V1;
  const lines = [];
  lines.push('/* data/datasets.js — auto-generated by precompute/build-datasets.js.');
  lines.push(' *');
  lines.push(' * Reward grid is 5×5, values in {1..9}, drawn from a Mulberry32 RNG');
  lines.push(' * seeded with `params.seed`.  Pedagogical invariants asserted by the');
  lines.push(' * generator (see precompute/build-datasets.js): greedy-local is at');
  lines.push(' * least 3 spookiness behind optimal; the optimal path flips for some');
  lines.push(' * γ in {0.5, 0.7}; every V is finite and non-negative.');
  lines.push(' *');
  lines.push(` * Canonical seed: 0x${seed.toString(16).toUpperCase()} ` +
             `(SEED_ANCHOR + ${offset}).`);
  lines.push(' */');
  lines.push('(function () {');
  lines.push('  window.DATA = {');
  lines.push('    grid: {');
  lines.push(`      M: ${M},`);
  lines.push(`      N: ${N},`);
  lines.push('      rewards: [');
  for (let r = 0; r < M; r++) {
    lines.push(`        [${rewards[r].join(', ')}],`);
  }
  lines.push('      ],');
  lines.push('      start: { r: 0, c: 0 },');
  lines.push(`      goal:  { r: ${M - 1}, c: ${N - 1} },`);
  lines.push('    },');
  lines.push('');
  lines.push('    /* Pedagogical reference values, computed at build time so the');
  lines.push('       data-prep agent can document them. Scenes recompute V at');
  lines.push('       runtime via Bellman.computeV(rewards, gamma) — this block');
  lines.push('       exists for the precompute audit trail, not as a runtime cache. */');
  lines.push('    reference: {');
  lines.push(`      optimalScore:    ${check.optScore},`);
  lines.push(`      greedyScore:     ${check.greedyScore},`);
  lines.push(`      optimalGap:      ${check.optScore - check.greedyScore},`);
  lines.push(`      optimalPath:     ${JSON.stringify(check.optPath)},`);
  lines.push(`      greedyPath:      ${JSON.stringify(check.greedyPath)},`);
  lines.push(`      optimalPathG09:  ${JSON.stringify(optPath09)},`);
  lines.push(`      optimalPathG07:  ${JSON.stringify(check.optPath07)},`);
  lines.push(`      optimalPathG05:  ${JSON.stringify(check.optPath05)},`);
  lines.push('    },');
  lines.push('');
  lines.push('    params: {');
  lines.push(`      seed:        ${seed},`);
  lines.push('      gammaPresets: [1.0, 0.9, 0.7, 0.5],');
  lines.push('      gammaDefault: 1.0,');
  lines.push('    },');
  lines.push('');
  lines.push('    /* Reusable KaTeX strings. */');
  lines.push('    tex: {');
  lines.push("      bellman:        'V(r,\\\\,c) \\\\;=\\\\; R(r,\\\\,c) \\\\;+\\\\; \\\\max\\\\bigl(V(r+1,\\\\,c),\\\\; V(r,\\\\,c+1)\\\\bigr)',");
  lines.push("      bellmanGamma:   'V(r,\\\\,c) \\\\;=\\\\; R(r,\\\\,c) \\\\;+\\\\; \\\\gamma \\\\cdot \\\\max\\\\bigl(V(r+1,\\\\,c),\\\\; V(r,\\\\,c+1)\\\\bigr)',");
  lines.push("      stateTuple:     's = (r,\\\\,c)',");
  lines.push("      actionSet:      'A = \\\\{\\\\rightarrow,\\\\; \\\\downarrow\\\\}',");
  lines.push("      policyFromV:    '\\\\pi(s) \\\\;=\\\\; \\\\arg\\\\max_{a} \\\\, V(s\\\\\\'(s,a))',");
  lines.push('    },');
  lines.push('  };');
  lines.push('})();');
  lines.push('');
  return lines.join('\n');
}

function main() {
  const { seed, offset, rewards, check } = findGoodSeed();
  const out = emit(rewards, check, seed, offset);
  const dest = path.resolve(__dirname, '..', 'data', 'datasets.js');
  fs.writeFileSync(dest, out, 'utf8');

  /* Friendly summary on stdout. */
  console.log('Spooky House — data/datasets.js generated.');
  console.log(`  seed:           0x${seed.toString(16).toUpperCase()}`);
  console.log(`  seed offset:    +${offset}`);
  console.log(`  optimal score:  ${check.optScore}`);
  console.log(`  greedy  score:  ${check.greedyScore}`);
  console.log(`  gap:            ${check.optScore - check.greedyScore}`);
  console.log(`  reward grid:`);
  for (const row of rewards) {
    console.log('    ' + row.map(v => String(v).padStart(2, ' ')).join('  '));
  }
  console.log(`  V (γ=1.0):`);
  for (const row of check.V1) {
    console.log('    ' + row.map(v => String(v).padStart(3, ' ')).join('  '));
  }
  console.log(`  optimal path γ=1.0:  ${check.optPath.map(p => `(${p.r},${p.c})`).join(' → ')}`);
  console.log(`  optimal path γ=0.7:  ${check.optPath07.map(p => `(${p.r},${p.c})`).join(' → ')}`);
  console.log(`  optimal path γ=0.5:  ${check.optPath05.map(p => `(${p.r},${p.c})`).join(' → ')}`);
  console.log(`  greedy   path:       ${check.greedyPath.map(p => `(${p.r},${p.c})`).join(' → ')}`);
  console.log(`  written:        ${path.relative(process.cwd(), dest)}`);
}

main();

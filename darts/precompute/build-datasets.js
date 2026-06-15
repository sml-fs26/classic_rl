/* Build the canonical Darts dataset and write it as data/datasets.js.

   Run: `node precompute/build-datasets.js` from classic_rl/darts/.

   Produces a deterministic 300-throw scenario reused across scenes 3-4 so
   the three estimator traces in scene 4 compare apples-to-apples (same
   bullseye oscillation, same player jitter). The seed is pinned at the top.

   The script asserts every invariant downstream scenes rely on, in code,
   so the data telling the intended story is verified at build time, 
   not at "screenshot looks ok" time. */

'use strict';

const fs = require('fs');
const path = require('path');

/*, rng, */

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
function gaussian(rng) {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

/*, params */

/* Pinned seeds. The bullseye oscillates around a fixed centre via AR(1), 
   no drift. Seed picked so the oscillation is visible (std ≥ 3) and the
   running mean stays near the initial centre (|drift| ≤ 2). */
const SEED_BULLSEYE   = 0x42A1B71B;   // bullseye oscillation
const SEED_PLAYER     = 0x42A1B702;   // player jitter
const SEED_SCORENOISE = 0x42A1B703;   // score-noise

const T = 300;          // total throw count, covers scenes 2-4
const NOISE_STD = 6;    // Gaussian noise on the score, std in score units
const OBS_NOISE_STD = 7;  // noise on the loudspeaker's announcement of target_score
                           //, without this, the α trade-off has no signal to
                           //   demonstrate (large-α tracks any noiseless target).
const PLAYER_JITTER_STD = 6;   // how the (passive) thrower scatters around bullseye

/*, bullseye dynamics */

function randomBullseyeStart(rng) {
  return rng() < 0.5
    ? 10 + rng() * 15
    : 75 + rng() * 15;
}

function oscillateStep(rng, pos, mean) {
  const noise = clamp(gaussian(rng) * 2, -5, 5);
  const a = 0.85;
  const next = mean + a * (pos - mean) + noise;
  return clamp(next, 10, 90);
}

/*, precompute scenario */

const rngB = makeRng(SEED_BULLSEYE);
const rngP = makeRng(SEED_PLAYER);
const rngS = makeRng(SEED_SCORENOISE);

let bullseye = randomBullseyeStart(rngB);
const bullseyeMean = bullseye;  // oscillation centre; captured once
const bullseyeTrace = [];      // bullseye_pos at the moment of each throw (truth)
const playerTrace = [];        // player_pos at the moment of each throw (visual only)
const scoreTrace = [];         // observed score (with noise on score)
const observationTrace = [];   // noisy loudspeaker announcement: target_score + obs noise.
                                // This is what the estimator sees.
const rngO = makeRng(SEED_BULLSEYE ^ 0xDEADBEEF);  // separate stream for obs noise

for (let i = 0; i < T; i++) {
  // Oscillate bullseye one step around its captured mean (no drift).
  bullseye = oscillateStep(rngB, bullseye, bullseyeMean);
  bullseyeTrace.push(bullseye);

  // Loudspeaker: announces target_score = bullseye_pos + Gaussian noise,
  // clamped to [0, 100]. This is what the algorithm consumes.
  const obs = clamp(bullseye + gaussian(rngO) * OBS_NOISE_STD, 0, 100);
  observationTrace.push(obs);

  // Passive thrower: aims at bullseye + Gaussian jitter, clamped [2, 98].
  const player = clamp(bullseye + gaussian(rngP) * PLAYER_JITTER_STD, 2, 98);
  playerTrace.push(player);

  // Score with Gaussian noise, clipped to [0, 100].
  const base = Math.max(0, 100 - 2 * Math.abs(player - bullseye));
  const noisy = clamp(base + gaussian(rngS) * NOISE_STD, 0, 100);
  scoreTrace.push(noisy);
}

/*, run the three estimators */

/* Mirror of js/estimators.js, we rebuild the traces here too so we can
   assert tracking-error invariants. The observation stream is the
   bullseye trajectory (`target_score`); the estimator's job is to track
   the bullseye through drift and noise from the loudspeaker's after-the-fact
   announcement. */
function runEstimator(initial, observations, alphaFn) {
  let x = initial;
  const trace = [];
  for (let i = 0; i < observations.length; i++) {
    const n = i + 1;
    const alpha = alphaFn(n);
    const obs = observations[i];
    x = x + alpha * (obs - x);
    trace.push(x);
  }
  return trace;
}

const initialEstimate = 50;

/* The three estimators of scene 4. For the decay schedule we use the
   notebook's `α(t) = α_0/(1 + t/τ)` form because it's what the student
   implements; α_n = 1/n is the "sample mean" of scene 2. Scenes 2 and 4
   will refer to both forms in their captions. */
const ALPHA_SMALL = 0.04;
const ALPHA_LARGE = 0.65;
const DECAY_ALPHA0 = 0.7;
const DECAY_TAU = 25;

const traceSampleMean = runEstimator(initialEstimate, observationTrace, n => 1 / n);
const traceFixedSmall = runEstimator(initialEstimate, observationTrace, _n => ALPHA_SMALL);
const traceFixedLarge = runEstimator(initialEstimate, observationTrace, _n => ALPHA_LARGE);
const traceDecay      = runEstimator(initialEstimate, observationTrace, n => DECAY_ALPHA0 / (1 + n / DECAY_TAU));

/* Scene 3 uses the canonical fixed-α 0.1 ("just right" RM). */
const ALPHA_DEFAULT = 0.1;
const traceRMDefault = runEstimator(initialEstimate, observationTrace, _n => ALPHA_DEFAULT);

/*, invariant assertions */

function assert(cond, msg) {
  if (!cond) {
    console.error('INVARIANT FAILED:', msg);
    process.exit(1);
  } else {
    console.log('  ✓ ' + msg);
  }
}

function range(arr) { return Math.max(...arr) - Math.min(...arr); }
function mae(traceA, traceB) {
  let s = 0;
  for (let i = 0; i < traceA.length; i++) s += Math.abs(traceA[i] - traceB[i]);
  return s / traceA.length;
}
function endError(trace) {
  // tracking error over the last 50 throws, the tail behavior matters
  // most for "does the estimate track the drifting target".
  let s = 0;
  for (let i = trace.length - 50; i < trace.length; i++) {
    s += Math.abs(trace[i] - bullseyeTrace[i]);
  }
  return s / 50;
}
function meanError(trace, skip) {
  // mean tracking error over the whole run (skipping the warm-up).
  const start = typeof skip === 'number' ? skip : 0;
  let s = 0, n = 0;
  for (let i = start; i < trace.length; i++) {
    s += Math.abs(trace[i] - bullseyeTrace[i]);
    n++;
  }
  return s / Math.max(1, n);
}

console.log('\nDataset invariants:');

// 1. No NaN, no Infinity anywhere.
const allArrays = [
  bullseyeTrace, playerTrace, scoreTrace, observationTrace,
  traceSampleMean, traceFixedSmall, traceFixedLarge, traceDecay, traceRMDefault,
];
const allFinite = allArrays.every(a => a.every(v => Number.isFinite(v)));
assert(allFinite, 'every value is finite');

// 2a. Bullseye oscillates visibly: std ≥ 3 over 300 throws.
const bsTraceMean = bullseyeTrace.reduce((s, v) => s + v, 0) / bullseyeTrace.length;
const bsStd = Math.sqrt(
  bullseyeTrace.reduce((s, v) => s + (v - bsTraceMean) ** 2, 0) / bullseyeTrace.length
);
assert(bsStd >= 3, `bullseye oscillation std ≥ 3 (got ${bsStd.toFixed(2)})`);

// 2b. Bullseye stays stationary (running mean within ±2 of initial centre).
assert(
  Math.abs(bsTraceMean - bullseyeMean) <= 2,
  `bullseye stationary: |mean − initial| ≤ 2 (mean=${bsTraceMean.toFixed(2)}, init=${bullseyeMean.toFixed(2)})`
);

// 3. Bullseye stays clamped to [10, 90].
const bsMin = Math.min(...bullseyeTrace);
const bsMax = Math.max(...bullseyeTrace);
assert(bsMin >= 10 - 1e-9 && bsMax <= 90 + 1e-9,
  `bullseye in [10, 90] (got [${bsMin.toFixed(1)}, ${bsMax.toFixed(1)}])`);

// 4. (Sample-mean vs RM-α=0.1 invariant intentionally dropped.)
//    With the bullseye drifting, the sample mean was a *failure mode* and
//    we asserted RM beat it. With the bullseye oscillating around a fixed
//    centre (AR(1), no drift), the trade-off depends on the AR coefficient
//    in subtle ways: sample mean converges to the centre while RM with
//    moderate α tracks the oscillation. Neither is universally "better", 
//    it depends what the student is asked to estimate. The decay-vs-fixed
//    invariants below still encode the "decay is goldilocks" lesson.
const errSampleMean = endError(traceSampleMean);
const errRMDefault  = endError(traceRMDefault);

// 5. Decay (notebook schedule) has the lowest *overall* tracking error
//    among the three estimators, this is the curriculum claim of scene 4
//    ("decay wins"). We measure mean error over the post-warm-up window
//    [n=20, n=300]; in this window decay should dominate both fixed-α
//    extremes by at least 10%.
const errSmallTail = endError(traceFixedSmall);
const errDecayTail = endError(traceDecay);
const errLargeTail = endError(traceFixedLarge);
const errSmall = meanError(traceFixedSmall, 20);
const errDecayMean = meanError(traceDecay, 20);
const errLarge = meanError(traceFixedLarge, 20);
assert(
  errDecayMean <= errSmall * 0.90,
  `decay mean error ≤ 0.90 × small-α mean error ` +
  `(decay=${errDecayMean.toFixed(2)} vs small=${errSmall.toFixed(2)})`
);

// 6. Large-α has noticeably higher *mean* error than decay over the full
//    post-warm-up window. With oscillation (no drift) the tail values
//    converge, large-α and decay both end up ~3.3 error, but over the
//    whole run, decay's early tracking + late smoothing wins by a wider
//    margin than tail-only comparison would suggest.
assert(
  errLarge >= errDecayMean * 1.20,
  `large-α mean error ≥ 1.2× decay mean error ` +
  `(large=${errLarge.toFixed(2)} vs decay=${errDecayMean.toFixed(2)})`
);

// 7. Player trace stays clamped to [2, 98].
const pMin = Math.min(...playerTrace);
const pMax = Math.max(...playerTrace);
assert(pMin >= 2 - 1e-9 && pMax <= 98 + 1e-9,
  `player_pos in [2, 98] (got [${pMin.toFixed(1)}, ${pMax.toFixed(1)}])`);

// 8. Scores stay in [0, 100].
const sMin = Math.min(...scoreTrace);
const sMax = Math.max(...scoreTrace);
assert(sMin >= 0 - 1e-9 && sMax <= 100 + 1e-9,
  `score in [0, 100] (got [${sMin.toFixed(1)}, ${sMax.toFixed(1)}])`);

console.log('\nDataset summary:');
console.log(`  T = ${T}`);
console.log(`  bullseye oscillation: centre ${bullseyeMean.toFixed(1)}, std ${bsStd.toFixed(2)}, running mean ${bsTraceMean.toFixed(2)}`);
console.log(`  tail tracking error (mean over last 50 throws):`);
console.log(`    sample mean (α_n = 1/n)   : ${errSampleMean.toFixed(2)}`);
console.log(`    fixed small α = ${ALPHA_SMALL}      : ${errSmall.toFixed(2)}`);
console.log(`    fixed large α = ${ALPHA_LARGE}      : ${errLarge.toFixed(2)}`);
console.log(`    decay α₀=${DECAY_ALPHA0} τ=${DECAY_TAU} : ${errDecayTail.toFixed(2)}`);
console.log(`    fixed α = ${ALPHA_DEFAULT} (scene 3) : ${errRMDefault.toFixed(2)}`);

/*, emit JS, */

function fmtArr(arr, prec = 4) {
  return '[' + arr.map(v => v.toFixed(prec)).join(', ') + ']';
}

const out = `/* Auto-generated by precompute/build-datasets.js. DO NOT EDIT BY HAND.
   Re-generate with: node precompute/build-datasets.js   */
(function () {
  window.DATA = {
    /* Pinned seeds and parameters. */
    seeds: {
      bullseye:    ${SEED_BULLSEYE},
      player:      ${SEED_PLAYER},
      scoreNoise:  ${SEED_SCORENOISE},
      manual:      0x42A1B7C1,
    },

    params: {
      T: ${T},
      noiseStd: ${NOISE_STD},
      obsNoiseStd: ${OBS_NOISE_STD},
      playerJitterStd: ${PLAYER_JITTER_STD},
      initialEstimate: ${initialEstimate},
      sceneCounts: {
        manual: 25,
        sampleMean: 200,
        rm: 200,
        tradeoff: 300,
      },
    },

    /* α schedules used in scenes 3 and 4. */
    alpha: {
      defaultRM: ${ALPHA_DEFAULT},
      fixedSmall: ${ALPHA_SMALL},
      fixedLarge: ${ALPHA_LARGE},
      decayAlpha0: ${DECAY_ALPHA0},
      decayTau: ${DECAY_TAU},
    },

    /* Canonical 300-step scenario, shared across scenes 2-4. The
       observation each estimator sees is bullseyeTrace[i] (the
       "loudspeaker announcement", target_score). The player
       trace is purely visual. */
    bullseyeTrace:    ${fmtArr(bullseyeTrace)},
    observationTrace: ${fmtArr(observationTrace)},
    playerTrace:      ${fmtArr(playerTrace)},
    scoreTrace:       ${fmtArr(scoreTrace, 2)},

    /* Pre-baked estimator traces, useful as a cross-check and for cold
       entry into scene 4 without running the simulation. */
    estimatorTraces: {
      sampleMean:  ${fmtArr(traceSampleMean)},
      fixedSmall:  ${fmtArr(traceFixedSmall)},
      fixedLarge:  ${fmtArr(traceFixedLarge)},
      decay:       ${fmtArr(traceDecay)},
      rmDefault:   ${fmtArr(traceRMDefault)},
    },

    /* Recap card content. */
    recap: [
      { label: 'estimate',    body: 'a number that updates each round' },
      { label: 'target',      body: 'the noisy thing we approach' },
      { label: 'learning rate', body: 'α, the size of each step' },
      { label: 'decay',       body: 'let α shrink to fine-tune' },
      { label: 'TD update',   body: 'next: SARSA = Robbins-Monro on a TD target', muted: true },
    ],

    /* Reusable KaTeX strings. */
    tex: {
      rmUpdate:       '\\\\hat{x}_{n+1} \\\\;=\\\\; \\\\hat{x}_n \\\\;+\\\\; \\\\alpha_n \\\\,(s_n - \\\\hat{x}_n)',
      rmConditionA:   '\\\\sum_{n=1}^{\\\\infty} \\\\alpha_n \\\\;=\\\\; \\\\infty',
      rmConditionB:   '\\\\sum_{n=1}^{\\\\infty} \\\\alpha_n^{2} \\\\;<\\\\; \\\\infty',
      sampleMean:     '\\\\hat{\\\\mu}_n \\\\;=\\\\; \\\\tfrac{1}{n}\\\\sum_{k=1}^{n} s_k',
      decaySchedule:  '\\\\alpha_n \\\\;=\\\\; \\\\frac{\\\\alpha_0}{1 + n/\\\\tau}',
      score:          '\\\\text{score} \\\\;=\\\\; \\\\max\\\\!\\\\bigl(0,\\\\, 100 - 2\\\\,|\\\\text{player\\\\_pos} - \\\\text{bullseye\\\\_pos}|\\\\bigr)',
    },
  };
})();
`;

const outPath = path.join(__dirname, '..', 'data', 'datasets.js');
fs.writeFileSync(outPath, out);
console.log(`\nWrote ${outPath} (${out.length} bytes).`);

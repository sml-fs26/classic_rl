/* Darts model — pure functions + tiny class for the bullseye oscillation.

   Mirrors `darts_utils.py`'s `DartsInTheDark` semantics so the Python notebook
   exercise and this viz speak the same vocabulary: `target_score` is the
   bullseye's position, `current_score` is the player's position. The score is
   a triangular `max(0, 100 - 2|d|)` of the distance, with optional Gaussian
   noise on the score (clipped to [0, 100]).

   The bullseye oscillates randomly around a fixed centre (AR(1), no drift) —
   a stationary process. The notebook's classical `DartsInTheDark` uses a
   random walk; the viz uses oscillation so the lesson focuses on noise, not
   non-stationarity.

   RNG: Mulberry32. No CDN seedrandom dependency. The same `seed` produces a
   byte-identical trajectory across reloads. */
(function () {

  /* ------------------------------------------------------------------ rng -- */

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

  /* Box-Muller. Two rng() calls per draw; we discard the second. Adequate
     for our purposes — no rejection-sampling subtlety required. */
  function gaussian(rng) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /* ------------------------------------------------------------------ math - */

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  /* The score function from darts_utils.py. */
  function rawScore(playerPos, bullseyePos) {
    return Math.max(0, 100 - 2 * Math.abs(playerPos - bullseyePos));
  }

  /* Add Gaussian noise to the score, clipped to [0, 100]. Matches the
     `noise_std` parameter of the Python class (which the original HTML
     pinned to 0; we always have noise on). */
  function noisyScore(playerPos, bullseyePos, rng, noiseStd) {
    const base = rawScore(playerPos, bullseyePos);
    const noise = noiseStd > 0 ? gaussian(rng) * noiseStd : 0;
    return clamp(base + noise, 0, 100);
  }

  /* -------------------------------------------------------------- bullseye - */

  /* Initial bullseye position, matching the Python (`10-25` or `75-90`
     uniform). The two-mode start makes the manual scene less trivial. */
  function randomBullseyeStart(rng) {
    return rng() < 0.5
      ? 10 + rng() * 15
      : 75 + rng() * 15;
  }

  /* One oscillation step around `mean`: AR(1) with mean reversion (a=0.85)
     plus a clipped Gaussian noise. Stationary — the long-run mean is
     `mean`, no drift. Replaces darts_utils.py's random-walk `drift_step`. */
  function oscillateStep(rng, pos, mean) {
    const noise = clamp(gaussian(rng) * 2, -5, 5);
    const a = 0.85;
    const next = mean + a * (pos - mean) + noise;
    return clamp(next, 10, 90);
  }

  /* --------------------------------------------------------------- factory - */

  /* Build a fresh world from a seed. The world owns the rng and the
     bullseye trajectory; callers ask for a single "throw" by passing the
     player position and noise level. The world ticks the bullseye once per
     throw, just as in darts_utils.py. */
  function createWorld(seed, opts) {
    const noiseStd = (opts && typeof opts.noiseStd === 'number') ? opts.noiseStd : 6;
    const rng = makeRng(seed);
    let bullseyePos = randomBullseyeStart(rng);
    const bullseyeMean = bullseyePos;   // capture once; oscillation centre
    let round = 0;

    return {
      get bullseyePos() { return bullseyePos; },
      get bullseyeMean() { return bullseyeMean; },
      get round() { return round; },
      noiseStd,

      /* Shoot at `playerPos`. Oscillates the bullseye one step first, then
         returns the result dict with the field names the notebook uses
         (target_score, current_score). */
      shoot(playerPos) {
        round += 1;
        bullseyePos = oscillateStep(rng, bullseyePos, bullseyeMean);
        const score = noisyScore(playerPos, bullseyePos, rng, noiseStd);
        return {
          round,
          score,
          player_pos: playerPos,
          bullseye_pos: bullseyePos,
          target_score: bullseyePos,   // notebook vocabulary
          current_score: playerPos,    // notebook vocabulary
        };
      },

      /* For autoplay scenes that need to advance the bullseye without
         scoring (kept under the legacy name for backward-compat — the
         implementation now oscillates). */
      oscillateBullseye() {
        bullseyePos = oscillateStep(rng, bullseyePos, bullseyeMean);
        return bullseyePos;
      },
    };
  }

  window.Darts = {
    makeRng,
    gaussian,
    clamp,
    rawScore,
    noisyScore,
    randomBullseyeStart,
    oscillateStep,
    createWorld,
  };
})();

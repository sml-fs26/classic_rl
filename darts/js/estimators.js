/* Estimators — pure functions over a stream of (player_pos, score) pairs.

   The Robbins-Monro update we teach in scenes 3 and 4 is

     x_{n+1} = x_n + α_n · (s_n - x_n)

   where x_n is the running estimate of *bullseye position* and s_n is the
   nth observation. The "observation" here is the player's position when
   the score was high — concretely, we use a score-weighted target:

     s_n = player_pos_n + (gradient hint)

   For pedagogical simplicity (and to match the notebook's "current_pos →
   target_score" framing) the simplest viable observation is *the player's
   own position when the score was high*, treated as a noisy sample of the
   bullseye. Here the autoplay heuristic is:

     player_pos_n  =  current estimate + small jitter

   so the observations cluster around the estimate, and the score is
   informative about *whether the estimate is well-aligned with the true
   bullseye*. The estimator updates use the noisy observation `s_n` directly.

   For the trade-off scene 4 we drive three estimators from the **same**
   observation stream, so the differences are entirely in the schedule
   `α_n`, not in the data — this makes the comparison fair. */

(function () {

  /* Sample-mean estimator: x_{n+1} = x_n + (1/(n+1)) · (s_n - x_n)
     (the classic incremental average). Same algebra, different framing —
     we expose this as a separate function for scene 2's "the sample mean
     fails" caption to read sensibly. */
  function sampleMean(prevEstimate, observation, n) {
    const alpha = 1 / (n + 1);
    return prevEstimate + alpha * (observation - prevEstimate);
  }

  /* Fixed-α RM update. */
  function rmFixed(prevEstimate, observation, alpha) {
    return prevEstimate + alpha * (observation - prevEstimate);
  }

  /* Decaying-α RM update: α_n = 1/n. This is the canonical RM schedule —
     it satisfies Σα_n = ∞ and Σα_n² < ∞ — and (with α_n = 1/n) is exactly
     equivalent to the empirical mean from the Casino viz. n is 1-indexed:
     n = 1 for the first throw. */
  function rmDecay(prevEstimate, observation, n) {
    const alpha = 1 / Math.max(1, n);
    return prevEstimate + alpha * (observation - prevEstimate);
  }

  /* Run a stream of observations through a callback that returns (newEstimate, alpha).
     Returns the trace (one entry per observation): { estimate, alpha }. */
  function runEstimator(initialEstimate, observations, updater) {
    let x = initialEstimate;
    const trace = [];
    for (let i = 0; i < observations.length; i++) {
      const n = i + 1;
      const obs = observations[i];
      const next = updater(x, obs, n);
      x = next.estimate;
      trace.push({ estimate: next.estimate, alpha: next.alpha });
    }
    return trace;
  }

  /* Convenience wrappers returning the (estimate, alpha) shape. */
  function makeSampleMeanUpdater() {
    return function (x, obs, n) {
      const alpha = 1 / n;
      return { estimate: x + alpha * (obs - x), alpha };
    };
  }

  function makeFixedAlphaUpdater(alpha) {
    return function (x, obs /*, n */) {
      return { estimate: x + alpha * (obs - x), alpha };
    };
  }

  function makeDecayUpdater() {
    return function (x, obs, n) {
      const alpha = 1 / n;
      return { estimate: x + alpha * (obs - x), alpha };
    };
  }

  window.Estimators = {
    sampleMean,
    rmFixed,
    rmDecay,
    runEstimator,
    makeSampleMeanUpdater,
    makeFixedAlphaUpdater,
    makeDecayUpdater,
  };
})();

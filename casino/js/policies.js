/* Policies for the multi-armed bandit.

   Three exported functions, each returning a function:
     greedy(rng)                       -> (bandit, t) -> arm
     epsGreedy(eps, rng)               -> (bandit, t) -> arm
     epsGreedyDecay(eps0, decay, rng)  -> (bandit, t) -> arm

   The closure-bound rng makes the policy itself a function of (bandit, t)
   only — exactly the contract the notebook's strategy_func uses. Tie-breaking
   matches the notebook's `random.choice(best_machines)`: among arms that share
   the maximum empirical probability, pick uniform-randomly.

   Note on tie-breaking on the very first pull (all empirical = 0): every arm
   ties, so greedy starts with a uniform-random choice. That's the right
   behaviour — it matches the Python code and also avoids a deterministic
   start that would mislead students about why early luck matters.

   `decisionMode` returned alongside the arm tells the scene whether the
   choice was an explore step or an exploit step (for the scene-4 badge). */

(function () {

  function argmaxRandomTiebreak(values, rng) {
    let max = values[0];
    for (let i = 1; i < values.length; i++) if (values[i] > max) max = values[i];
    const ties = [];
    for (let i = 0; i < values.length; i++) if (values[i] === max) ties.push(i);
    if (ties.length === 1) return ties[0];
    return ties[Math.floor(rng() * ties.length)];
  }

  /* Returns a function (bandit, t) -> { arm, mode, eps }
     where mode is 'explore' or 'exploit'. */
  function greedy(rng) {
    return function (bandit) {
      const arm = argmaxRandomTiebreak(bandit.empiricalRow(), rng);
      return { arm, mode: 'exploit', eps: 0 };
    };
  }

  function epsGreedy(eps, rng) {
    return function (bandit) {
      if (rng() < eps) {
        const arm = Math.floor(rng() * bandit.K);
        return { arm, mode: 'explore', eps };
      }
      const arm = argmaxRandomTiebreak(bandit.empiricalRow(), rng);
      return { arm, mode: 'exploit', eps };
    };
  }

  /* eps(t) = eps0 * decay^t. Mirrors the notebook's `epsilon_greedy_with_decay`. */
  function epsGreedyDecay(eps0, decay, rng) {
    return function (bandit, t) {
      const e = eps0 * Math.pow(decay, t);
      if (rng() < e) {
        const arm = Math.floor(rng() * bandit.K);
        return { arm, mode: 'explore', eps: e };
      }
      const arm = argmaxRandomTiebreak(bandit.empiricalRow(), rng);
      return { arm, mode: 'exploit', eps: e };
    };
  }

  /* Pure utility: pick uniform-random arm. Used by scene 2's "explore" button. */
  function uniformRandom(rng, K) {
    return Math.floor(rng() * K);
  }

  /* Pure utility: pick arg-max-empirical arm with tie-break. Used by scene 2's
     "exploit" button (the lecturer wants this to match the policy classes
     above so students see one consistent recipe). */
  function argMaxEmpirical(bandit, rng) {
    return argmaxRandomTiebreak(bandit.empiricalRow(), rng);
  }

  window.Policies = {
    greedy,
    epsGreedy,
    epsGreedyDecay,
    uniformRandom,
    argMaxEmpirical,
    argmaxRandomTiebreak,
  };
})();

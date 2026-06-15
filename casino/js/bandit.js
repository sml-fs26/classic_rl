/* Bernoulli multi-armed bandit, mirroring the structure of casino_utils.py.

   The notebook teaches:
     class SlotMachine:
       win_probability        # hidden ground truth
       total_pulls, total_wins
       def pull() -> 0 or 1
       def get_empirical_probability() -> wins / pulls (0 if never pulled)

   This JS module wraps a list of those into a Bandit object, plus a seeded
   Mulberry32 RNG so the same seed reproduces a trajectory exactly. Scenes
   never call Math.random, the rng is part of each scene's state, and a
   reset+replay sequence rebuilds the bandit from scratch.

   Vocabulary pinned to match the notebook:
       empirical(arm)    ↔ get_empirical_probability()  (0 when pulls = 0)
       pulls(arm)        ↔ total_pulls
       wins(arm)         ↔ total_wins
       optimalArm()      ↔ argmax(probs)
       totalReward       ↔ state.total_reward         */

(function () {

  /* Mulberry32, identical to anymal-mdp/js/mdp.js so behaviour matches the
     sibling viz when seeds are reused (e.g. the same Mulberry32 generator
     drives ε-greedy in scene 4 as drives random ghost moves in ANYmal). */
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

  function argmaxArr(arr) {
    let best = 0;
    for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
    return best;
  }

  /* Construct a bandit. probs is the array of *true* win probabilities
     (hidden from the student). Caller passes its own rng so two scenes
     can share a seed (scene 3 → scene 4 greedy replay). */
  function create(probs, rng) {
    const K = probs.length;
    const pulls = new Array(K).fill(0);
    const wins  = new Array(K).fill(0);
    let totalReward = 0;
    let round = 0;
    const optimalArm = argmaxArr(probs);
    const optimal = probs[optimalArm];

    function pull(arm) {
      if (arm < 0 || arm >= K) throw new Error('arm out of range: ' + arm);
      const r = rng() < probs[arm] ? 1 : 0;
      pulls[arm] += 1;
      wins[arm]  += r;
      totalReward += r;
      round += 1;
      return r;
    }

    function empirical(arm) {
      if (pulls[arm] === 0) return 0;
      return wins[arm] / pulls[arm];
    }

    /* Empirical row across all arms, convenience for the policy modules. */
    function empiricalRow() {
      const out = new Array(K);
      for (let i = 0; i < K; i++) out[i] = empirical(i);
      return out;
    }

    /* Realised cumulative regret at the current round:
         R(t) = t * mu_star  -  sum_{tau<=t} r_tau
       where mu_star is the largest true probability. Note this can DROP
       on a single trajectory whenever a pull pays out, Bernoulli rewards
       give increments of (mu_star - 1) ≈ -0.2 on a win. Useful when you
       want honest per-realisation noise on the chart. */
    function cumulativeRegret() {
      return round * optimal - totalReward;
    }

    /* Cumulative pseudo-regret at the current round:
         R̄(t) = sum_a pulls[a] * (mu_star - probs[a])
       Each term is >= 0, so this is monotone non-decreasing in t, the
       version you want when the audience expects "regret can only grow".
       Equivalent to sum_{tau<=t} (mu_star - mu(a_tau)) where mu(a_tau)
       is the TRUE mean of the chosen arm at step tau (not the realised
       reward r_tau). */
    function cumulativePseudoRegret() {
      let r = 0;
      for (let i = 0; i < K; i++) r += pulls[i] * (optimal - probs[i]);
      return r;
    }

    function reset() {
      for (let i = 0; i < K; i++) { pulls[i] = 0; wins[i] = 0; }
      totalReward = 0;
      round = 0;
    }

    /* Snapshot for cold-entry rebuilders. */
    function snapshot() {
      return {
        pulls: pulls.slice(),
        wins:  wins.slice(),
        empirical: empiricalRow(),
        totalReward,
        round,
        regret: cumulativeRegret(),
      };
    }

    return {
      K,
      probs,
      optimalArm,
      optimal,
      pull,
      empirical,
      empiricalRow,
      pulls(arm)  { return pulls[arm]; },
      wins(arm)   { return wins[arm];  },
      pullsAll()  { return pulls.slice(); },
      winsAll()   { return wins.slice(); },
      totalReward() { return totalReward; },
      round()      { return round; },
      cumulativeRegret,
      cumulativePseudoRegret,
      reset,
      snapshot,
    };
  }

  /* Convenience: build a bandit from DATA.bandit.probs with a seed. */
  function fromData(seed) {
    const cfg = window.DATA && window.DATA.bandit;
    if (!cfg) throw new Error('DATA.bandit missing');
    const rng = makeRng(seed >>> 0);
    return { bandit: create(cfg.probs, rng), rng };
  }

  window.Bandit = { create, makeRng, fromData };
})();

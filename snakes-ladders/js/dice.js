/* Three dice, the action space of the Snakes & Ladders MDP.
 *
 * Each die has uniform integer faces 1..N. The pedagogy: lower-variance dice
 * (d4) are "safe", small steps, less chance to land in trouble; higher-variance
 * dice (d8) are "risky", bigger expected jumps but bigger spread.
 *
 *   d4: mean 2.5, var ≈ 1.25
 *   d6: mean 3.5, var ≈ 2.92
 *   d8: mean 4.5, var ≈ 5.25
 *
 * Outcomes are the action's probability distribution over rolls, used by
 * Bellman backups (full expectation) and by SARSA (sample one roll).
 */
(function () {
  const DICE = {
    d4: { id: 'd4', sides: 4, mean: 2.5, label: 'd4' },
    d6: { id: 'd6', sides: 6, mean: 3.5, label: 'd6' },
    d8: { id: 'd8', sides: 8, mean: 4.5, label: 'd8' },
  };

  const DIE_IDS = ['d4', 'd6', 'd8'];

  /* Sample a roll 1..sides uniformly from rng() in [0, 1). */
  function roll(rng, dieId) {
    const d = DICE[dieId];
    if (!d) throw new Error('Unknown die: ' + dieId);
    return 1 + Math.floor(rng() * d.sides);
  }

  /* Enumerate outcomes for an exhaustive Bellman backup. Returns an array of
     { roll, p } pairs. */
  function outcomes(dieId) {
    const d = DICE[dieId];
    const p = 1 / d.sides;
    const out = [];
    for (let r = 1; r <= d.sides; r++) out.push({ roll: r, p });
    return out;
  }

  window.Dice = { DICE, DIE_IDS, roll, outcomes };
})();

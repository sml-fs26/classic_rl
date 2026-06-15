/* Levers: the action space of the Trial Clock MDP.
 *
 * Three growth levers, the three a growth team actually pulls each day of a
 * free trial:
 *
 *   id        name            role     colour
 *   nudge     ONBOARD NUDGE   build    teal   (steer them to the next feature)
 *   nothing   DO NOTHING      hold     grey   (let the trial ride, spend nothing)
 *   push      PAYWALL PUSH    ask      gold   (surface the upgrade offer)
 *
 * Unlike a pricing draw, the lever is NOT itself a probabilistic pick: it
 * just selects which on-screen randomizer fires. NUDGE flips the Adoption
 * Coin, PUSH spins the Conversion Wheel, DO NOTHING is deterministic. The
 * stochastic dice live in trial.js, not here.
 *
 * Every lever is ALWAYS available at every (tier, day): there are no clamped
 * actions in this MDP (at tier 4 a NUDGE simply keeps you at tier 4). So the
 * Q-table is a clean 25x3 with no greyed cells.
 *
 * Mirrors the shape of the reused engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Levers. */
(function () {
  const LEVERS = [
    { id: 'nudge',   name: 'ONBOARD NUDGE', role: 'build', short: 'NUDGE' },
    { id: 'nothing', name: 'DO NOTHING',    role: 'hold',  short: 'WAIT'  },
    { id: 'push',    name: 'PAYWALL PUSH',  role: 'ask',   short: 'PUSH'  },
  ];

  const LEVER_IDS  = LEVERS.map(l => l.id);            // [nudge, nothing, push]
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  function shortOf(id) { const l = LEVER_BY_ID[id]; return l ? l.short : id; }

  window.Levers = {
    LEVERS, LEVER_IDS, LEVER_BY_ID, shortOf,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
  };
})();

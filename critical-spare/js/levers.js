/* Levers: the action space of the Critical Spare MDP.
 *
 * Three levers a plant manager can pull each turn:
 *
 *   id        name          role        colour
 *   run       RUN           produce     green   (earn, risk a breakdown)
 *   order     ORDER         stock       blue    (buy a spare into the bin)
 *   replace   REPLACE NOW   planned     gold    (consume a spare, refresh)
 *
 * RUN and ORDER are always available. REPLACE needs a spare on hand
 * (spares >= 1); when the bin is empty REPLACE is clamped out (greyed,
 * never chosen). The single stochastic element, the failure die on RUN,
 * plus the aging coin, lives in machine.js, not here.
 *
 * Mirrors the shape of the gallery engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Levers. */
(function () {
  const LEVERS = [
    { id: 'run',     name: 'RUN',     role: 'produce' },
    { id: 'order',   name: 'ORDER',   role: 'stock'   },
    { id: 'replace', name: 'REPLACE', role: 'planned' },
  ];

  const LEVER_IDS  = LEVERS.map(l => l.id);            // [run, order, replace]
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  function nameOf(id) { const l = LEVER_BY_ID[id]; return l ? l.name : id; }

  window.Levers = {
    LEVERS, LEVER_IDS, LEVER_BY_ID,
    nameOf,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
  };
})();

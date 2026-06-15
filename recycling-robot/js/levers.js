/* Levers: the action space of the Recycling Robot MDP.
 *
 * Three levers a manager can pull each step of the shift:
 *
 *   id         label      role       colour
 *   search     SEARCH     work       green   (#009E73)  pays well, drains the battery
 *   wait       WAIT       idle       amber   (#E6A817)  a crumb, no drain, no risk
 *   recharge   RECHARGE   protect    blue    (#0072B2)  pays nothing now, refills to full
 *
 * Unlike the gambler's stake, a lever is NOT a number you scale: it is a
 * categorical choice. The single stochastic element -- the battery-drain die
 * on a SEARCH -- lives in robot.js, not here. SEARCH is the only lever with a
 * die; WAIT and RECHARGE are deterministic.
 *
 * Every lever is legal at every PLAYABLE rung (low/mid/high/full), so unlike
 * the gambler there are no clamped actions -- the Q-table is a clean 4x3.
 *
 * Mirrors the shape of the reused engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Levers. */
(function () {
  const LEVERS = [
    { id: 'search',   name: 'SEARCH',   role: 'work',    idx: 0 },
    { id: 'wait',     name: 'WAIT',     role: 'idle',    idx: 1 },
    { id: 'recharge', name: 'RECHARGE', role: 'protect', idx: 2 },
  ];

  const LEVER_IDS  = LEVERS.map(l => l.id);          // [search, wait, recharge]
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  function nameOf(id) { const l = LEVER_BY_ID[id]; return l ? l.name : id; }
  function idxOf(id)  { const l = LEVER_BY_ID[id]; return l ? l.idx : -1; }

  window.Levers = {
    LEVERS, LEVER_IDS, LEVER_BY_ID,
    nameOf, idxOf,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
  };
})();

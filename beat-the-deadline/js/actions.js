/* Actions: the action space of the Beat-the-Deadline MDP.
 *
 * Two levers a dispatcher can pull each hour:
 *
 *   id      label   role
 *   wait    WAIT    hold the load one more hour to consolidate (the clock
 *                   ticks down; an arrival die may add a pallet; a deadline-
 *                   risk die may blow the shipment). The move with dice.
 *   send    SEND    dispatch the current load now; pay the fixed truck cost
 *                   regardless of fullness; the shipment is guaranteed on
 *                   time. Safe, deterministic.
 *
 * A lever is clamped out (illegal, greyed on screen) at a state (p, h):
 *   WAIT  is illegal at h = 0  (the clock has expired -> forced SEND, late).
 *   SEND  is illegal at p = 0  (the dock is empty -> nothing to ship).
 * (At p = 0 the only non-edge transition is WAIT; at h = 0 the only legal
 * lever is SEND.)
 *
 * The action SET stays a constant {WAIT, SEND} so the Q-table is a clean
 * 2-column board; clamped actions are marked unavailable (Q = -Infinity in
 * the backup, so they are never chosen) and rendered disabled.
 *
 * Mirrors the shape of the reused engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Actions. */
(function () {
  const ACTIONS = [
    { id: 'wait', name: 'WAIT', role: 'hold'    },
    { id: 'send', name: 'SEND', role: 'dispatch' },
  ];

  const ACTION_IDS = ACTIONS.map(a => a.id);
  const ACTION_BY_ID = {};
  for (const a of ACTIONS) ACTION_BY_ID[a.id] = a;

  window.Actions = {
    ACTIONS, ACTION_IDS, ACTION_BY_ID,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). The reused engine
     iterates MOVE_IDS for the Q-table columns in this exact order. */
  window.Moves = {
    MOVE_IDS: ACTION_IDS,
    MOVE_BY_ID: ACTION_BY_ID,
  };
})();

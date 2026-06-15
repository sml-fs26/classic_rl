/* Actions: the action space of the Windy Treasure Cave MDP.
 *
 * Four compass headings, the direction the explorer ATTEMPTS to walk:
 *
 *   id      label     vec (drow, dcol)   role
 *   UP       UP        (-1,  0)          north
 *   DOWN     DOWN      (+1,  0)          south
 *   LEFT     LEFT      ( 0, -1)          west
 *   RIGHT    RIGHT     ( 0, +1)          east
 *
 * Unlike Gambler's Ruin (where stakes get clamped by capital), here all four
 * headings are ALWAYS legal at every non-terminal tile, walking into a wall
 * just keeps you in place (and still costs a step). So the action set is a
 * constant {UP, DOWN, LEFT, RIGHT}: a clean 4-column Q-table per tile.
 *
 * The wind shoves you to the LEFT- or RIGHT-perpendicular of your heading.
 * "Left / right" are the explorer's own left/right while facing that way (the
 * leaves on screen streak the way you were shoved). The perpendiculars are
 * fixed per heading and live here so the MDP (cave.js) and the renderer share
 * one definition:
 *
 *   facing UP    : left = LEFT (col-1),  right = RIGHT (col+1)
 *   facing DOWN  : left = RIGHT (col+1), right = LEFT  (col-1)
 *   facing LEFT  : left = DOWN (row+1),  right = UP    (row-1)
 *   facing RIGHT : left = UP   (row-1),  right = DOWN  (row+1)
 *
 * Mirrors the shape of the reused engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Actions. */
(function () {
  const ACTIONS = [
    { id: 'UP',    name: 'UP',    arrow: '↑', vec: [-1,  0], role: 'north' },
    { id: 'DOWN',  name: 'DOWN',  arrow: '↓', vec: [ 1,  0], role: 'south' },
    { id: 'LEFT',  name: 'LEFT',  arrow: '←', vec: [ 0, -1], role: 'west'  },
    { id: 'RIGHT', name: 'RIGHT', arrow: '→', vec: [ 0,  1], role: 'east'  },
  ];

  /* Left- and right-perpendicular displacement vectors per heading (the gust
     directions). Player-relative: "left" is the explorer's own left. */
  const PERP = {
    UP:    { left: [ 0, -1], right: [ 0,  1] },
    DOWN:  { left: [ 0,  1], right: [ 0, -1] },
    LEFT:  { left: [ 1,  0], right: [-1,  0] },
    RIGHT: { left: [-1,  0], right: [ 1,  0] },
  };

  const ACTION_IDS = ACTIONS.map(a => a.id);          // [UP, DOWN, LEFT, RIGHT]
  const ACTION_BY_ID = {};
  for (const a of ACTIONS) ACTION_BY_ID[a.id] = a;

  function vecOf(id)   { const a = ACTION_BY_ID[id]; return a ? a.vec : [0, 0]; }
  function arrowOf(id) { const a = ACTION_BY_ID[id]; return a ? a.arrow : '?'; }
  function perpOf(id)  { return PERP[id] || { left: [0, 0], right: [0, 0] }; }

  window.Actions = {
    ACTIONS, ACTION_IDS, ACTION_BY_ID, PERP,
    vecOf, arrowOf, perpOf,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: ACTION_IDS,
    MOVE_BY_ID: ACTION_BY_ID,
  };
})();

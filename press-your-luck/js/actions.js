/* Press Your Luck - the action space (the two levers).
 *
 *   The Pig MDP has exactly two clean levers per turn:
 *     ROLL - risk the turn-pot for more (the "push" lever, burnt-orange).
 *     HOLD - bank the turn-pot into your score, ending your turn (the
 *            "bank it" lever, deep blue/teal).
 *
 *   This module is the analogue of the Pokemon `moves.js`. It exposes the
 *   canonical lever list under window.Levers AND mirrors it onto
 *   window.Moves so the reused bellman.js / sarsa.js / qtable.js (which all
 *   read window.Moves.MOVE_IDS / MOVE_BY_ID) keep working verbatim.
 *
 *   Lever colours are CSS tokens, not inline categorical colours: each
 *   lever carries a `tokenClass` ("lever-roll" / "lever-hold") that the
 *   scene CSS maps to --c-roll / --c-hold (retinted under the CRT theme).
 */
(function () {
  const LEVERS = [
    { id: 'roll', name: 'ROLL', tokenClass: 'lever-roll', glyph: '↑', blurb: 'push' },
    { id: 'hold', name: 'HOLD', tokenClass: 'lever-hold', glyph: '▼', blurb: 'bank it' },
  ];

  const LEVER_IDS = LEVERS.map(l => l.id);            // ['roll', 'hold']
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  /* Inline SVG icon per lever - cheap pixel-art glyphs, no external asset.
     ROLL is an up-arrow (push for more); HOLD is a down-into-vault chevron
     (lock it in). Both inherit currentColor so the CRT retint is automatic. */
  function leverIconSvg(id) {
    if (id === 'roll') {
      return '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
        '<polygon points="6,1 10,6 7,6 7,11 5,11 5,6 2,6" fill="currentColor"/></svg>';
    }
    if (id === 'hold') {
      return '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
        '<rect x="2" y="2" width="8" height="2" fill="currentColor"/>' +
        '<polygon points="6,11 2,6 5,6 5,4 7,4 7,6 10,6" fill="currentColor"/></svg>';
    }
    return '';
  }

  window.Levers = { LEVERS, LEVER_IDS, LEVER_BY_ID, leverIconSvg };

  /* Alias for the reused engine modules (bellman / sarsa / qtable read
     window.Moves). MOVE_IDS / MOVE_BY_ID are the load-bearing fields. */
  window.Moves = {
    MOVES: LEVERS,
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
    leverIconSvg,
  };
})();

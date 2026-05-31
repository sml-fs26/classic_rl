/* Lever definitions: the action space of the Pipeline Climb MDP.
 *
 * Three levers, ordered soft to aggressive (the on-screen menu reads
 * left to right in that order):
 *
 *   id          name           commitment   business meaning
 *   nurture     NURTURE        low          send content, a soft touch
 *   demo        DEMO           mid          book the call, show value
 *   hardclose   HARD CLOSE     high         send the contract, ask to sign
 *
 * Each lever rolls the STAGE DIE (UP a rung / STAY / DOWN a rung); the
 * per-stage odds live in js/ladder.js (window.Pipeline). Every touch
 * costs -1 of rep time; the terminating touch pays +30 (SIGNED) or
 * -10 (LOST) instead.
 *
 * Colour identity (CSS tokens, retinted under the crt theme):
 *   NURTURE = calm-blue, DEMO = amber, HARD CLOSE = hot-red.
 *
 * Exposed as window.Levers and aliased to window.Moves so the reused
 * bellman.js / sarsa.js (which read window.Moves.MOVE_IDS / MOVE_BY_ID)
 * work unchanged with A = 3 actions.
 */
(function () {
  const LEVERS = [
    { id: 'nurture',   name: 'NURTURE',    commitment: 'low',  tone: 'calm-blue', gloss: 'a soft touch'   },
    { id: 'demo',      name: 'DEMO',       commitment: 'mid',  tone: 'amber',     gloss: 'book the call'  },
    { id: 'hardclose', name: 'HARD CLOSE', commitment: 'high', tone: 'hot-red',   gloss: 'send the contract' },
  ];

  const MOVE_IDS = LEVERS.map(l => l.id);          // [nurture, demo, hardclose]
  const MOVE_BY_ID = {};
  for (const l of LEVERS) MOVE_BY_ID[l.id] = l;

  /* Short labels for the cramped Q-table columns / trajectory tape. */
  const SHORT_LABEL = {
    nurture:   'NURTURE',
    demo:      'DEMO',
    hardclose: 'CLOSE',
  };
  function shortLabel(id) { return SHORT_LABEL[id] || id; }

  /* CSS-token class used to colour a lever's button / Q-column / chip.
     Returns a class name, never an inline colour (per the viz contract). */
  function toneClass(id) {
    const l = MOVE_BY_ID[id];
    return l ? ('lever-' + l.id) : '';
  }

  /* Inline-SVG glyph per lever: cheap pixel-art, no extra asset.
     NURTURE = a small envelope (soft outreach), DEMO = a play/call
     triangle (book the call), HARD CLOSE = a stamped contract page.
     currentColor so the glyph inherits the lever's token colour. */
  function leverIconSvg(id) {
    if (id === 'nurture') {
      return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
        '<rect x="2" y="4" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M2 4 L8 9 L14 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
    }
    if (id === 'demo') {
      return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
        '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<polygon points="6,5 6,11 11,8" fill="currentColor"/></svg>';
    }
    if (id === 'hardclose') {
      return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
        '<rect x="3" y="2" width="10" height="12" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" stroke-width="1.2"/>' +
        '<line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1.2"/>' +
        '<circle cx="10.5" cy="11.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    }
    return '';
  }

  window.Levers = {
    LEVERS, MOVE_IDS, MOVE_BY_ID,
    shortLabel, toneClass, leverIconSvg,
  };
  /* Alias so reused engine code (bellman.js, sarsa.js) keeps working. */
  window.Moves = window.Levers;
})();

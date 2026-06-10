/* Action definitions: the action space of the Repair-or-Replace MDP.
 *
 * Three actions on the one delivery van, ordered cheap to expensive:
 *
 *   id        name      commitment   fleet meaning
 *   run       RUN       low          drive the route, earn this week's profit
 *   service   SERVICE   mid          a week in the shop (-50), wear improves
 *   replace   REPLACE   high         buy new (-130), condition resets to HEALTHY
 *
 * RUN also rolls the hidden breakdown odds (a breakdown costs -280 and dumps
 * the van to FAILING); the per-state numbers live in js/van.js (window.Van).
 *
 * Colour identity (CSS tokens, retinted under the crt theme):
 *   RUN = calm-blue, SERVICE = amber, REPLACE = hot-red.
 *
 * Exposed as window.Actions and aliased to window.Moves so the reused
 * bellman.js / sarsa.js (which read window.Moves.MOVE_IDS / MOVE_BY_ID)
 * work unchanged with A = 3 actions.
 */
(function () {
  const ACTIONS = [
    { id: 'run',     name: 'RUN',     commitment: 'low',  tone: 'calm-blue', gloss: 'drive the route'  },
    { id: 'service', name: 'SERVICE', commitment: 'mid',  tone: 'amber',     gloss: 'a week in the shop' },
    { id: 'replace', name: 'REPLACE', commitment: 'high', tone: 'hot-red',   gloss: 'buy a new van'    },
  ];

  const MOVE_IDS = ACTIONS.map(a => a.id);          // [run, service, replace]
  const MOVE_BY_ID = {};
  for (const a of ACTIONS) MOVE_BY_ID[a.id] = a;

  /* Short labels for the cramped Q-table columns / trajectory tape. */
  const SHORT_LABEL = {
    run:     'RUN',
    service: 'SVC',
    replace: 'NEW',
  };
  function shortLabel(id) { return SHORT_LABEL[id] || id; }

  /* CSS-token class used to colour an action's button / Q-column / chip.
     Returns a class name, never an inline colour (per the viz contract). */
  function toneClass(id) {
    const a = MOVE_BY_ID[id];
    return a ? ('lever-' + a.id) : '';
  }

  /* Inline-SVG glyph per action: cheap pixel-art, no extra asset.
     RUN = a road with a forward arrow, SERVICE = a wrench,
     REPLACE = a price-tagged sparkle (new purchase).
     currentColor so the glyph inherits the action's token colour. */
  function leverIconSvg(id) {
    if (id === 'run') {
      return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
        '<line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="1.6"/>' +
        '<line x1="3" y1="13" x2="6" y2="13" stroke="currentColor" stroke-width="3" stroke-dasharray="2 2"/>' +
        '<path d="M3 7 L10 7 M10 7 L7 4 M10 7 L7 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    }
    if (id === 'service') {
      return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
        '<path d="M10.5 2.5 a4 4 0 0 0 -4.6 5.6 L2.5 11.5 l2 2 L7.9 10.1 a4 4 0 0 0 5.6 -4.6 L11 8 9 6 Z"' +
        ' fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    }
    if (id === 'replace') {
      return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
        '<path d="M8 1.5 L9.4 6 L14 6.4 L10.4 9.2 L11.6 14 L8 11.2 L4.4 14 L5.6 9.2 L2 6.4 L6.6 6 Z"' +
        ' fill="currentColor"/></svg>';
    }
    return '';
  }

  window.Actions = {
    ACTIONS, LEVERS: ACTIONS, MOVE_IDS, MOVE_BY_ID,
    shortLabel, toneClass, leverIconSvg,
  };
  /* Alias so reused engine code (bellman.js, sarsa.js) keeps working. */
  window.Moves = window.Actions;
})();

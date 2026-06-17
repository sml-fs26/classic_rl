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

  /* Inline-SVG glyph per action: clean line-art, no extra asset.
     RUN = a steering wheel (operate / drive it this week),
     SERVICE = a wrench (a week in the shop),
     REPLACE = a sparkle (a brand-new van).
     currentColor so the glyph inherits the action's token colour. The same
     three shapes are baked (in identity colours) into slides/img/action/*.pdf
     for the lecture deck, so viz and slides share one visual vocabulary. */
  function leverIconSvg(id) {
    if (id === 'run') {
      return '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.1"/>' +
        '<circle cx="12" cy="12" r="2.5" fill="currentColor"/>' +
        '<g stroke="currentColor" stroke-width="2.1" stroke-linecap="round">' +
        '<line x1="12" y1="9.5" x2="12" y2="3.4"/>' +
        '<line x1="14.1" y1="13.2" x2="18.9" y2="16.1"/>' +
        '<line x1="9.9" y1="13.2" x2="5.1" y2="16.1"/></g></svg>';
    }
    if (id === 'service') {
      return '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"' +
        ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    }
    if (id === 'replace') {
      return '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
        '<path d="M12 2.6l1.95 5.95a2 2 0 0 0 1.3 1.3L21.4 12l-5.95 1.95a2 2 0 0 0-1.3 1.3L12 21.4l-1.95-5.95a2 2 0 0 0-1.3-1.3L2.6 12l5.95-1.95a2 2 0 0 0 1.3-1.3z"' +
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

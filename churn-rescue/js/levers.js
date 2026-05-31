/* Churn Rescue lever definitions: the action space of the account MDP.
 *
 * Three levers you pull at the start of each month, ordered left to right
 * from cheap/passive to expensive/aggressive (mirrors the Pokemon
 * weak-reliable to strong-risky idiom):
 *
 *   id        name         cost   colour token   what it is
 *   nothing   DO NOTHING    0     grey           protect margin, no touch
 *   checkin   CHECK-IN      1     blue           low-cost human touch / QBR nudge
 *   offer     BIG OFFER     4     gold           deep discount / free upgrade
 *
 * Each lever does two things every month (see js/account.js):
 *   1. lifts the RETENTION COIN P(STAY) by coinLift[tier] (offer only
 *      lifts where there is headroom; on a thriving account it adds ~0).
 *   2. biases the ENGAGEMENT DIE (up / same / down) for next month.
 *      CHECK-IN is the GROWTH lever (climbs tiers), BIG OFFER is a
 *      stay-spike (only a modest climb), DO NOTHING sags.
 *
 * The numeric coin lifts and die faces live in account.js (the model);
 * this file is the menu: ids, display names, costs, colour tokens, and
 * the rendering glyphs. It is aliased to window.Moves so the reused
 * bellman.js / sarsa.js (which read window.Moves.MOVE_IDS) keep working
 * unchanged. The lever order IS the action order, A = 3.
 */
(function () {
  /* cost is the per-month debit (paid as a negative reward). */
  const LEVERS = [
    { id: 'nothing', name: 'DO NOTHING', cost: 0, token: 'nothing', short: 'NONE' },
    { id: 'checkin', name: 'CHECK-IN',   cost: 1, token: 'checkin', short: 'CHECK' },
    { id: 'offer',   name: 'BIG OFFER',  cost: 4, token: 'offer',   short: 'OFFER' },
  ];

  const LEVER_IDS = LEVERS.map(l => l.id);          // ['nothing','checkin','offer']
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  /* Per-lever colour token: a CSS class, never an inline colour. The
     stylesheet maps .lever-nothing / .lever-checkin / .lever-offer to
     grey / blue / gold and retints them under the CRT theme. */
  function tokenClass(leverId) {
    const l = LEVER_BY_ID[leverId];
    return 'lever-' + (l ? l.token : 'nothing');
  }

  function costOf(leverId) {
    const l = LEVER_BY_ID[leverId];
    return l ? l.cost : 0;
  }

  /* Inline SVG glyph per lever: cheap pixel-art, no extra asset.
       nothing : a flat "hold / pause" bar pair
       checkin : a speech bubble (the human touch)
       offer   : a price tag (the discount) */
  function leverIconSvg(leverId) {
    if (leverId === 'nothing') {
      return '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">' +
        '<rect x="3" y="2" width="2" height="8" fill="currentColor"/>' +
        '<rect x="7" y="2" width="2" height="8" fill="currentColor"/></svg>';
    }
    if (leverId === 'checkin') {
      return '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">' +
        '<path d="M1 2 H11 V8 H6 L3 11 V8 H1 Z" fill="currentColor"/></svg>';
    }
    if (leverId === 'offer') {
      return '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">' +
        '<path d="M1 5 L6 1 H11 V6 L6 11 Z" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<circle cx="8.3" cy="3.7" r="0.9" fill="currentColor"/></svg>';
    }
    return '';
  }

  /* Render the lever-button sub-line: a cost pill ("-4" / "FREE") plus
     the glyph. Reused by the tutorial and the playtest so any change
     propagates. The minus sign uses the real "−" so it sits inside
     the Press Start 2P glyph set cleanly. */
  function leverSubHtml(leverId) {
    const l = LEVER_BY_ID[leverId];
    if (!l) return '';
    const costLabel = l.cost === 0 ? 'FREE' : ('−' + l.cost);
    return (
      '<span class="lever-stats">' +
        '<span class="cost-pill ' + tokenClass(leverId) + '">' +
          leverIconSvg(leverId) + ' ' + costLabel +
        '</span>' +
      '</span>'
    );
  }

  window.Levers = {
    LEVERS, LEVER_IDS, LEVER_BY_ID,
    tokenClass, costOf, leverIconSvg, leverSubHtml,
  };

  /* Alias so reused engine code (bellman.js, sarsa.js, qtable.js) that
     reads window.Moves.MOVE_IDS / MOVE_BY_ID keeps working verbatim.
     MOVE_IDS order is the action order: nothing, checkin, offer. */
  window.Moves = {
    MOVES: LEVERS,
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
    leverIconSvg, leverSubHtml, tokenClass, costOf,
  };
})();

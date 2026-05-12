/* Pokemon move definitions — the action space of Pikachu's MDP.
 *
 * IMPORTANT: the displayed `power` field is decorative — chosen for Pokemon-
 * canon recognisability — and is NOT what drives damage in the discrete MDP.
 * The actual damage is a per-move bucket-drop distribution defined in
 * `battle.js` (HIT_DAMAGE_DIST). `accuracy` IS real and used as the hit prob.
 *
 *   id           power  acc   ON HIT: bucket-drop distribution (in battle.js)
 *   quick_attack  55   1.00   Δ0 55% / Δ1 45%   — E[Δ|hit] = 0.45
 *   thunderbolt   80   1.00   Δ1 50% / Δ2 50%   — E[Δ|hit] = 1.50
 *   iron_tail    100   0.85   Δ1 70% / Δ2 30%   — E[Δ|hit] = 1.30 (E[Δ] = 1.11)
 *   thunder      150   0.55   Δ2 50% / Δ3 50%   — E[Δ|hit] = 2.50 (E[Δ] = 1.38)
 *
 * Opponent move (Charmander):
 *   ember         80   1.00   Δ0 20% / Δ1 55% / Δ2 25%  (~0.55 buckets/turn)
 *
 * The discrepancy between PWR and bucket-drop is intentional: the on-screen
 * PWR/ACC strip preserves the Gen-1 Pokemon vibe, and a second line
 * ("ON HIT: Δ1 70% · Δ2 30%") surfaces what the MDP actually does so
 * students can reason about the algorithm without being misled by flavour
 * numbers. See `moveSubHtml()` below. */
(function () {
  const MOVES = [
    { id: 'quick_attack', name: 'QUICK ATTACK', power: 55,  accuracy: 1.00, type: 'normal'   },
    { id: 'thunderbolt',  name: 'THUNDERBOLT',  power: 80,  accuracy: 1.00, type: 'electric' },
    { id: 'iron_tail',    name: 'IRON TAIL',    power: 100, accuracy: 0.85, type: 'steel'    },
    { id: 'thunder',      name: 'THUNDER',      power: 150, accuracy: 0.55, type: 'electric' },
  ];

  const MOVE_IDS = MOVES.map(m => m.id);
  const MOVE_BY_ID = {};
  for (const m of MOVES) MOVE_BY_ID[m.id] = m;

  const OPP_MOVE = { id: 'ember', name: 'EMBER', power: 80, accuracy: 1.00, type: 'fire' };

  /* Inline SVG icon per type — cheap pixel-art glyphs, no extra asset. */
  function typeIconSvg(type) {
    if (type === 'electric') {
      return '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
        '<polygon points="6,1 2,7 5,7 4,11 10,5 7,5 8,1" fill="#181818"/></svg>';
    }
    if (type === 'normal') {
      return '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
        '<ellipse cx="6" cy="6" rx="4.5" ry="3" fill="none" stroke="#181818" stroke-width="1.6"/></svg>';
    }
    if (type === 'steel') {
      return '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
        '<rect x="3" y="3" width="6" height="6" fill="none" stroke="#181818" stroke-width="1.6"/>' +
        '<rect x="5" y="1" width="2" height="2" fill="#181818"/>' +
        '<rect x="5" y="9" width="2" height="2" fill="#181818"/>' +
        '<rect x="1" y="5" width="2" height="2" fill="#181818"/>' +
        '<rect x="9" y="5" width="2" height="2" fill="#181818"/></svg>';
    }
    if (type === 'fire') {
      return '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
        '<path d="M6 1 C4 4, 4 5, 5 7 C4 6, 3 7, 4 9 C4 10, 5 11, 6 11 C7 11, 9 10, 9 8 C9 6, 7 6, 7 4 C7 3, 6 2, 6 1Z" fill="#181818"/></svg>';
    }
    return '';
  }

  /* Format the actual bucket-drop distribution for display on the move button.
     Reads `window.Battle.HIT_DAMAGE_DIST` lazily (Battle loads after Moves in
     index.html). Returns "DROPS 1 (50%) / 2 (50%)" — or with an "ON HIT:"
     prefix when accuracy < 100% to flag that the distribution is conditional
     on the move landing.

     Pure ASCII so every character stays inside Press Start 2P's glyph set
     (Δ falls back to the system font and looks misaligned).

     This line tells the truth about the MDP. The PWR/ACC strip above is the
     Pokemon-canon flavour; this one is what the agent actually faces. */
  function dropPatternStr(moveId) {
    const dist = window.Battle && window.Battle.HIT_DAMAGE_DIST && window.Battle.HIT_DAMAGE_DIST[moveId];
    if (!dist || !dist.length) return '';
    const move = MOVE_BY_ID[moveId];
    const prefix = (move && move.accuracy < 1) ? 'ON HIT: ' : '';
    const parts = dist.map(([d, p]) => d + ' (' + Math.round(p * 100) + '%)');
    return prefix + 'DROPS ' + parts.join(' / ');
  }

  /* Render the full inner-HTML of a move button. Two rows under the name:
       row 1 (.move-stats): type-pill · PWR · ACC      — Pokemon-canon flavour
       row 2 (.move-drop):  DROPS X (P%) / Y (Q%)      — MDP truth
     Both scene 1 (live battle) and the tutorial's step-4 demo call this so
     any change propagates to both without drift. */
  function moveSubHtml(moveId) {
    const m = MOVE_BY_ID[moveId];
    if (!m) return '';
    return (
      '<span class="move-stats">' +
        '<span class="type-pill ' + m.type + '">' + typeIconSvg(m.type) + ' ' + m.type + '</span>' +
        '<span>PWR ' + m.power + '</span>' +
        '<span>ACC ' + Math.round(m.accuracy * 100) + '%</span>' +
      '</span>' +
      '<span class="move-drop">' + dropPatternStr(moveId) + '</span>'
    );
  }

  window.Moves = { MOVES, MOVE_IDS, MOVE_BY_ID, OPP_MOVE, typeIconSvg, dropPatternStr, moveSubHtml };
})();

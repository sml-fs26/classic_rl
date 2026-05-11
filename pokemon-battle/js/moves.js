/* Pokemon move definitions — the action space of Pikachu's MDP.
 *
 * Four moves chosen to span the risk axis: a low-power-always-hits move, a
 * reliable workhorse, a medium-risk move, and a glass-cannon move. The
 * pedagogy: ε-greedy SARSA must learn which power/accuracy trade-off pays out
 * given (your HP, opp HP). Charmander's only move (Ember) is opponent-only
 * and not exposed to the agent.
 *
 *   id           power  acc   type      note
 *   quick_attack  40    1.00  normal    priority (first regardless of speed)
 *   thunderbolt   90    1.00  electric  reliable workhorse
 *   iron_tail     75    0.75  steel     medium-risk
 *   thunder      110    0.70  electric  high risk / high reward
 *
 * Opponent move (Charmander):
 *   ember         40    1.00  fire      always hits Pikachu for ~40 dmg
 */
(function () {
  /* Move powers + accuracies are mirrored in precompute/build-datasets.js. The
     tuning is set so that one Thunderbolt-hit crosses an HP bucket (~28 dmg)
     and one Thunder-hit can cross two buckets (~52 dmg), so the high-variance
     Thunder is interesting at low γ but reckless at high γ. */
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

  window.Moves = { MOVES, MOVE_IDS, MOVE_BY_ID, OPP_MOVE, typeIconSvg };
})();

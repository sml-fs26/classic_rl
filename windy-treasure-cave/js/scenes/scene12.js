/* Scene 12, Recap.
 *   One card per concept (MDP, policy, return, Q*, DP, TD), each with its hue
 *   chip + formula + cave gloss, plus a closing line. A small optimal-map board
 *   anchors the "strategy is a map" message. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const recap = D.recap || [];
  const BADGE_HUE = { mdp: 'mdp', policy: 'policy', return: 'return', qstar: 'qstar', dp: 'dp', sarsa: 'sarsa' };

  window.scenes.scene12 = function (root) {
    root.className = 'scene scene-pad sc12';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene12.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene12.lede') + '</p>' +
      '<div class="sc12-grid" id="sc12-grid"></div>' +
      '<div class="scene-row sc12-close-row">' +
        '<div class="sc12-board-host"></div>' +
        '<div class="poke-box sc12-close grow">' + T('scene12.close') + '</div>' +
      '</div>' +
      '<p class="sc12-credits muted">' + T('scene12.credits') + '</p>';

    const grid = root.querySelector('#sc12-grid');
    grid.innerHTML = recap.map(card => {
      const hue = BADGE_HUE[card.key] || 'mdp';
      return '<div class="card sc12-card sc12-card-' + hue + '">' +
        '<div class="sc12-card-head"><span class="sc12-chip sc12-chip-' + hue + '">' + T('scene12.badge.' + card.key) + '</span>' +
          '<span class="sc12-card-title">' + T('scene12.card.' + card.key + '.title') + '</span></div>' +
        '<div class="sc12-card-tex" id="sc12-tex-' + card.key + '"></div>' +
        '<div class="sc12-card-body">' + T('scene12.card.' + card.key + '.text') + '</div>' +
      '</div>';
    }).join('');
    recap.forEach(card => { const host = root.querySelector('#sc12-tex-' + card.key); if (host && card.tex) window.Katex.render(card.tex, host, true); });

    /* the optimal map, small, as the closing anchor */
    const board = window.CaveBoard.mount(root.querySelector('.sc12-board-host'), { size: 'sm' });
    board.setArrows(D.policyGrid || [], { ties: D.tieGrid });

    return {};
  };
})();

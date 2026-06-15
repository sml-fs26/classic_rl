/* Scene 12 -- Recap. Six cards, one concept each (MDP, policy, return, Q*, DP,
   SARSA), in the maintenance visual language, from window.DATA.recap. A small
   glyph per card plus its formula. Closing line ties back to the twist + a
   "replay the optimal policy" button loops the heat-map grid. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const D = window.DATA || {};
  const recap = D.recap || [];
  const NS = M.NS;

  function glyphFor(key) {
    if (key === 'qstar' || key === 'dp') {
      /* the twist heat-map: 9 swatches in the optimal lever colours, 3x3 */
      const pol = D.policy || [];
      let s = '<div class="sc12-mini-grid">';
      for (let st = 0; st < 9; st++) {
        const id = pol[st] || 'run';
        s += '<span class="sc12-mini-cell lever-fill-' + id + '" title="' + M.stateLabel(M.stateFromIndex(st)) + '"></span>';
      }
      return s + '</div>';
    }
    if (key === 'policy') {
      return '<div class="sc12-policy">' +
        '<span class="lever-fill-run sc12-sw"></span><span class="sc12-arrow">→</span>' +
        '<span class="lever-fill-order sc12-sw"></span><span class="sc12-arrow">→</span>' +
        '<span class="lever-fill-replace sc12-sw"></span></div>';
    }
    if (key === 'return') {
      return '<div class="sc12-tape"><span class="sc12-r-pos">+3</span><span class="sc12-or">…</span><span class="sc12-r-neg">-8</span></div>';
    }
    if (key === 'sarsa') {
      return '<div class="sc12-die-mini"><span class="sc12-die-badge">30%</span></div>';
    }
    /* mdp: four mini tiles */
    return '<div class="sc12-tuple"><span>S</span><span>A</span><span>P</span><span>R</span></div>';
  }

  function loc(key, fallback) {
    const v = T(key);
    return (v && v !== key) ? v : fallback;
  }

  window.scenes.scene12 = function (root) {
    root.className = 'scene scene-pad sc12';
    let cards = '';
    for (const c of recap) {
      const title = loc('recap.' + c.key + '.title', c.title);
      const text = loc('recap.' + c.key + '.text', c.text);
      cards +=
        '<div class="card sc12-card">' +
          '<div class="sc12-card-head"><span class="sc12-badge ' + c.key + '">' + c.badge + '</span>' +
            '<span class="sc12-card-title">' + title + '</span></div>' +
          '<div class="sc12-glyph">' + glyphFor(c.key) + '</div>' +
          '<p class="sc12-blurb">' + text + '</p>' +
          '<div class="formula-block sc12-f" data-tex="' + encodeURIComponent(c.tex) + '"></div>' +
        '</div>';
    }
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene12.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene12.sub') + '</p>' +
      '<div class="sc12-grid">' + cards + '</div>' +
      '<div class="scene-row center sc12-replay-wrap">' +
        '<div class="sc12-replay-grid-host"></div>' +
      '</div>' +
      '<p class="sc12-close">' + T('scene12.close') + '</p>' +
      '<p class="sc12-bridge muted">' + T('scene12.bridge') + '</p>' +
      '<div class="cs-btn-row sc12-replay-row"><button class="cs-btn primary sc12-replay" type="button">' + T('scene12.replay') + '</button></div>';

    root.querySelectorAll('.sc12-f').forEach((el) => {
      const tex = decodeURIComponent(el.dataset.tex || '');
      window.Katex.render(tex, el, true);
    });

    /* the looping optimal-policy heat-map */
    const grid = window.Grid.mount(root.querySelector('.sc12-replay-grid-host'), { variant: 'qtable', legend: true });
    const byState = {};
    for (let st = 0; st < M.N; st++) byState[st] = (D.policy || [])[st] || 'run';
    grid.paintPolicy(byState, { animate: false });

    const rb = root.querySelector('.sc12-replay');
    if (rb) rb.addEventListener('click', () => grid.paintPolicy(byState, { animate: true }));

    return { onEnter() {} };
  };
})();

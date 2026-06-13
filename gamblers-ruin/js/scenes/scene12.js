/* Scene 12 -- Recap. Six cards, one concept each (MDP, policy, return, Q*, DP,
   learning), in the cash-ladder visual language, from window.DATA.recap. A
   small glyph per card plus its formula. Closing line + replay. Cold-entry
   safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const recap = D.recap || [];

  function glyphFor(key) {
    if (key === 'qstar') {
      /* the zig-zag column: 9 swatches in the optimal stake colours */
      const bets = D.policyBets || [1, 2, 3, 3, 3, 3, 3, 2, 1];
      let s = '<div class="sc12-zig">';
      for (let i = bets.length - 1; i >= 0; i--) {
        const id = window.Stakes.idForBet(bets[i]);
        s += '<span class="sc12-zig-cell stake-fill-' + id + '" title="$' + (i + 1) + '"></span>';
      }
      return s + '</div>';
    }
    if (key === 'policy') {
      return '<div class="sc12-policy"><span class="stake-fill-bet1 sc12-sw"></span><span class="sc12-arrow">→</span>' +
             '<span class="stake-fill-bet3 sc12-sw"></span></div>';
    }
    if (key === 'return') {
      return '<div class="sc12-tape"><span class="sc12-r0">0</span><span class="sc12-or">or</span><span class="sc12-r1">1</span></div>';
    }
    if (key === 'dp') {
      let s = '<div class="sc12-mini">';
      for (let i = 0; i < 9; i++) s += '<span class="sc12-mini-cell"></span>';
      return s + '</div>';
    }
    if (key === 'sarsa') {
      return '<div class="sc12-coin-mini"><span class="sc12-coin-badge">40/60</span></div>';
    }
    /* mdp: four mini tiles */
    return '<div class="sc12-tuple"><span>S</span><span>A</span><span>P</span><span>R</span></div>';
  }

  /* Prefer an i18n string when present (so a JP toggle translates the recap
     cards), else fall back to the English baked into window.DATA.recap. */
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
      '<p class="sc12-close">' + T('scene12.close') + '</p>' +
      '<p class="sc12-bridge muted">' + T('scene12.bridge') + '</p>' +
      '<div class="gr-btn-row sc12-replay-row"><button class="gr-btn primary sc12-replay" type="button">' + T('scene12.replay') + '</button></div>';

    root.querySelectorAll('.sc12-f').forEach((el) => {
      const tex = decodeURIComponent(el.dataset.tex || '');
      window.Katex.render(tex, el, true);
    });
    const rb = root.querySelector('.sc12-replay');
    if (rb) rb.addEventListener('click', () => window.GR && window.GR.goTo(0));

    return { onEnter() {} };
  };
})();

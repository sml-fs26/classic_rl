/* Scene 12, Recap. Six dock-themed cards, one concept each (MDP, policy,
   return, Q*, DP, TD), from window.DATA.recap, each with a small dock glyph and
   its formula. Closing line + replay-from-the-top. Cold-entry safe.
   Card copy prefers an i18n string (recap.<key>.title / .text) so a future JP
   translation slots in, else falls back to the English baked into DATA.recap. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const recap = D.recap || [];

  function loc(key, fallback) {
    const v = T(key);
    return (v && v !== key) ? v : fallback;
  }

  function glyphFor(key) {
    if (key === 'mdp') {
      return '<div class="sc12-tuple"><span>S</span><span>A</span><span>P</span><span>R</span></div>';
    }
    if (key === 'policy') {
      /* a 3x3 patch of the diagonal staircase: send-blue upper-left, wait-amber lower-right */
      let s = '<div class="sc12-mini-board">';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const send = (c <= (2 - r));   // upper-left triangle = SEND
        s += '<span class="sc12-mb-cell ' + (send ? 'tint-send' : 'tint-wait') + '"></span>';
      }
      return s + '</div>';
    }
    if (key === 'return') {
      return '<div class="sc12-tape"><span class="sc12-r-neg">&minus;10</span><span class="sc12-or">or</span><span class="sc12-r-pos">+5</span></div>';
    }
    if (key === 'qstar') {
      /* the diagonal frontier in miniature (5x5) */
      let s = '<div class="sc12-frontier">';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const send = (c <= (3 - r));
        s += '<span class="sc12-fr-cell ' + (send ? 'tint-send' : 'tint-wait') + '"></span>';
      }
      return s + '</div>';
    }
    if (key === 'dp') {
      let s = '<div class="sc12-sweep">';
      for (let i = 0; i < 9; i++) s += '<span class="sc12-sw-cell"></span>';
      return s + '</div>';
    }
    /* sarsa / TD: the two dice */
    return '<div class="sc12-dice-mini"><span class="sc12-dm green"></span><span class="sc12-dm red"></span></div>';
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
          '<div class="formula-block sc12-f" data-tex="' + encodeURIComponent(c.tex || '') + '"></div>' +
        '</div>';
    }
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene12.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene12.lede') + '</p>' +
      '<div class="sc12-grid">' + cards + '</div>' +
      '<p class="sc12-close">' + T('scene12.close') + '</p>' +
      '<div class="btd-btn-row sc12-replay-row"><button class="btd-btn primary sc12-replay" type="button">' + T('scene12.replay') + '</button></div>';

    root.querySelectorAll('.sc12-f').forEach((el) => {
      const tex = decodeURIComponent(el.dataset.tex || '');
      if (tex && window.Katex) window.Katex.render(tex, el, true);
    });
    const rb = root.querySelector('.sc12-replay');
    if (rb) rb.addEventListener('click', () => window.BTD && window.BTD.goTo(0));

    return { onEnter() {} };
  };
})();

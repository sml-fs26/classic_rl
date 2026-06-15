/* Scene 12 -- Recap. Six cards, one concept each (MDP, policy, return, Q*, DP,
   SARSA), in the Trial-Clock visual language, from window.DATA.recap. A small
   glyph per card plus its formula. Closing line + replay. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const recap = D.recap || [];
  const N_DAYS = (window.Trial && window.Trial.N_DAYS) || 5;
  const N_TIERS = (window.Trial && window.Trial.N_TIERS) || 5;

  function glyphFor(key) {
    if (key === 'qstar' || key === 'dp') {
      /* a mini 5x5 staircase coloured by the optimal lever */
      const pol = D.policy || [];
      let s = '<div class="sc12-mini-board">';
      for (let t = N_TIERS - 1; t >= 0; t--) {
        for (let d = N_DAYS; d >= 1; d--) {
          const si = t * N_DAYS + (d - 1);
          const id = pol[si] || 'nothing';
          s += '<span class="sc12-mini-cell lever-fill-' + id + '"></span>';
        }
      }
      return s + '</div>';
    }
    if (key === 'policy') {
      return '<div class="sc12-policy"><span class="lever-fill-nudge sc12-sw"></span><span class="sc12-arrow">→</span>' +
             '<span class="lever-fill-push sc12-sw"></span></div>';
    }
    if (key === 'return') {
      return '<div class="sc12-tape"><span class="sc12-r0">-5</span><span class="sc12-or">…</span><span class="sc12-r1">+20</span></div>';
    }
    if (key === 'sarsa') {
      return '<div class="sc12-coin-mini"><span class="sc12-coin-badge">½</span></div>';
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
      '<p class="sc12-close">' + T('scene12.close') + '</p>' +
      '<p class="sc12-bridge muted">' + T('scene12.bridge') + '</p>' +
      '<div class="tc-btn-row sc12-replay-row"><button class="tc-btn primary sc12-replay" type="button">' + T('scene12.replay') + '</button></div>';

    root.querySelectorAll('.sc12-f').forEach((el) => {
      const tex = decodeURIComponent(el.dataset.tex || '');
      window.Katex.render(tex, el, true);
    });
    const rb = root.querySelector('.sc12-replay');
    if (rb) rb.addEventListener('click', () => window.TC && window.TC.goTo(0));

    return { onEnter() {} };
  };
})();

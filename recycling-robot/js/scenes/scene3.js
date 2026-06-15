/* Scene 3 -- Formalization / what makes this an MDP.
 *   The four parts reveal one at a time over the gauge the learner just played:
 *   State (battery), Action (lever), Transition (the drain die, 70/30), Reward
 *   (+3/+2 search, +1 wait, 0 recharge, -10 strand). NEXT advances the reveal,
 *   then yields to the engine. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene3.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene3.lede') + '</p>' +
      '<div class="sc3-grid">' +
        '<div class="sc3-icon-host"></div>' +
        '<div class="sc3-cards">' +
          card('state', 'S', T('scene3.state.h'), T('scene3.state.b'), window.DATA.tex.state) +
          card('action', 'A', T('scene3.action.h'), T('scene3.action.b'), window.DATA.tex.actions) +
          card('trans', 'P', T('scene3.trans.h'), T('scene3.trans.b'), window.DATA.tex.transition) +
          card('reward', 'R', T('scene3.reward.h'), T('scene3.reward.b'), '') +
        '</div>' +
      '</div>' +
      '<div class="formula-card sc3-tuple"><div class="formula-label">' + T('scene3.tuple') + '</div><div class="sc3-tuple-tex"></div></div>' +
      '<p class="footnote">' + T('scene3.hint') + '</p>';

    function card(key, tag, h, b, tex) {
      return '<div class="sc3-card" data-card="' + key + '" hidden>' +
        '<div class="sc3-card-tag">' + tag + '</div>' +
        '<div class="sc3-card-body"><div class="sc3-card-h">' + h + '</div><div class="sc3-card-b">' + b + '</div>' +
        (tex ? '<div class="sc3-card-tex"></div>' : '') +
        '</div></div>';
    }

    const gauge = window.Gauge.mount(root.querySelector('.sc3-icon-host'), { variant: 'icon', level: R.MID });
    window.Katex.render(window.DATA.tex.mdpTuple, root.querySelector('.sc3-tuple-tex'), true);
    /* render the per-card formulas now (hidden until revealed) */
    const texByCard = { state: window.DATA.tex.state, action: window.DATA.tex.actions, trans: window.DATA.tex.transition };
    root.querySelectorAll('.sc3-card').forEach(c => {
      const key = c.dataset.card;
      const holder = c.querySelector('.sc3-card-tex');
      if (holder && texByCard[key]) window.Katex.render(texByCard[key], holder, false);
    });

    const cards = Array.from(root.querySelectorAll('.sc3-card'));
    let shown = 0;
    function revealNext() {
      if (shown >= cards.length) return false;
      cards[shown].hidden = false;
      cards[shown].classList.add('sc3-pop');
      /* pose the gauge to echo the part being introduced */
      if (shown === 1) gauge.pulse();
      shown++;
      if (window.SFX) window.SFX.play('cursor');
      return true;
    }
    function hideLast() {
      if (shown <= 0) return false;
      shown--; cards[shown].hidden = true; return true;
    }
    /* reveal the first immediately */
    revealNext();
    if (window.RR && window.RR.run) { revealNext(); revealNext(); revealNext(); }

    return {
      onNextKey() { return revealNext(); },
      onPrevKey() { return hideLast(); },
    };
  };
})();

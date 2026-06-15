/* Scene 12 -- Recap.
 *   Six cards, one concept each, in the robot-and-gauge visual language: MDP,
 *   Policy, Return, Q*, DP, TD. Each card carries its badge, a KaTeX line, and
 *   the manager gloss. A click on a card jumps to its scene. Closing line. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene12 = function (root) {
    root.className = 'scene scene-pad sc12';
    const recap = window.DATA.recap;
    let cards = '';
    for (const c of recap) {
      cards +=
        '<button class="sc12-card" data-scene="' + c.scene + '" data-key="' + c.key + '" type="button">' +
          '<div class="sc12-badge sc12-badge-' + c.key + '">' + c.badge + '</div>' +
          '<div class="sc12-card-title">' + T('recap.' + c.key + '.title') + '</div>' +
          '<div class="sc12-card-tex" data-tex="' + encodeURIComponent(c.tex) + '"></div>' +
          '<div class="sc12-card-text">' + T('recap.' + c.key + '.text') + '</div>' +
        '</button>';
    }
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene12.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene12.lede') + '</p>' +
      '<div class="sc12-gauge-host"></div>' +
      '<div class="sc12-cards">' + cards + '</div>' +
      '<div class="poke-box sc12-close">' + T('scene12.close') + '</div>' +
      '<p class="sc12-by">' + T('scene0.by') + '</p>';

    window.Gauge.mount(root.querySelector('.sc12-gauge-host'), { variant: 'icon', level: window.Robot.FULL });

    root.querySelectorAll('.sc12-card-tex').forEach(el => {
      const tex = decodeURIComponent(el.dataset.tex || '');
      if (tex) window.Katex.render(tex, el, false);
    });
    root.querySelectorAll('.sc12-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.scene, 10);
        if (Number.isFinite(n) && window.RR) window.RR.goTo(n);
      });
    });

    return { onNextKey() { return false; }, onPrevKey() { return false; } };
  };
})();

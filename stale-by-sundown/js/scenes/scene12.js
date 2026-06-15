/* Scene 12 -- Recap. Six cards, each a pastry-case panel pointing back at one
   concept: MDP, Policy, Return, Q*, DP, SARSA. Each carries its KaTeX one-liner,
   a plain-language gloss, and a jump-back button to the scene that taught it.
   Closing line: the croissant was tiny on purpose. Reads DATA.recap. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const RECAP = D.recap || [];

  window.scenes.scene12 = function (root) {
    root.className = 'scene scene-pad sc12';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene12.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene12.lede') + '</p>' +
      '<div class="sc12-grid" id="sc12-grid"></div>' +
      '<div class="poke-box sc12-close">' + T('scene12.close') + '</div>' +
      '<p class="sc12-by muted">' + T('scene12.by') + '</p>';

    const grid = root.querySelector('#sc12-grid');
    grid.innerHTML = RECAP.map((c, i) =>
      '<div class="sc12-card sc12-' + c.key + '" data-scene="' + c.scene + '" style="animation-delay:' + (i * 60) + 'ms">' +
        '<div class="sc12-card-head"><span class="sc12-badge sc12-badge-' + c.key + '">' + T('scene12.badge.' + c.key) + '</span>' +
          '<span class="sc12-card-title">' + T('scene12.title.' + c.key) + '</span></div>' +
        '<div class="sc12-formula" id="sc12-f-' + c.key + '"></div>' +
        '<div class="sc12-card-text">' + T('scene12.text.' + c.key) + '</div>' +
        '<button class="poke-btn sc12-jump" data-scene="' + c.scene + '" type="button">' + T('scene12.revisit', { n: c.scene }) + '</button>' +
      '</div>').join('');

    RECAP.forEach(c => { const host = document.getElementById('sc12-f-' + c.key); if (host && c.tex) window.Katex.render(c.tex, host, true); });
    root.querySelectorAll('.sc12-jump').forEach(b => b.addEventListener('click', () => { const s = parseInt(b.dataset.scene, 10); if (window.SBS) window.SBS.goTo(s); }));

    return { onEnter() {} };
  };
})();

/* Scene 0 — MARKOV KOMBAT II title screen.
 *
 *   MARKOV KOMBAT II wordmark + SHAO KAHN-VERGENCE subtitle + idle
 *   LIU KANG-MAX silhouette + PRESS START.  The MDP overlay that used
 *   to be a second phase here lives in its own scene (sceneMdpOverlay)
 *   after the tutorial + trial battle — so students experience one
 *   round of kombat before we name the three ingredients.
 *
 *   Pressing START or hitting NEXT yields to the scene engine and
 *   advances to scene 1 (PRAKTICE MODE).
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const T = (k) => (window.I18N ? window.I18N.t(k) : '');
    const titleWrap = document.createElement('div');
    titleWrap.className = 'sc0-title-wrap';
    titleWrap.innerHTML = `
      <h1 class="poke-title">${T('title.pokemon') || 'MARKOV KOMBAT II'}</h1>
      <div class="sc0-subtitle">${T('title.subtitle') || 'SHAO KAHN-VERGENCE'}</div>
      <div class="sc0-tagline">FINISH HIM — OPTIMALLY.</div>
      <div class="sc0-pika-wrap">
        <div class="mk-fighter mk-fighter-liu" aria-label="LIU KANG-MAX"></div>
      </div>
      <button class="sc0-start" type="button">${T('title.start') || '▶ PRESS START'}</button>
      <div class="sc0-credits">${T('title.credits') || 'SML · ETH ZURICH · CLASSIC RL #8'}</div>
      <div class="sc0-credits sc0-credits-by">${T('title.by') || 'BY CARLOS COTRINI'}</div>
    `;
    root.appendChild(titleWrap);

    const startBtn = titleWrap.querySelector('.sc0-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.PokeViz) window.PokeViz.goTo(window.PokeViz.getCurrentScene() + 1);
      });
    }

    return {
      onEnter() {},
    };
  };
})();

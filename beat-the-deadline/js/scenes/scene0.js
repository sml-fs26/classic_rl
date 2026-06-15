/* Scene 0 -- Title / hook.
 *   A loading-dock tile at dusk (2 pallets, 4 hours), the truck waiting, and a
 *   PRESS START prompt. START reveals the manager framing + a BEGIN button that
 *   yields to the engine (-> scene 1). Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene0 = function (root) {
    root.className = 'scene scene-pad sc0';
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'sc0-wrap';
    wrap.innerHTML =
      '<h1 class="sc0-title">' + T('scene0.title') + '</h1>' +
      '<p class="sc0-tagline">' + T('scene0.tagline') + '</p>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-tile-host"></div>' +
      '</div>' +
      '<button class="btd-btn primary sc0-start" type="button">' + T('scene0.start') +
        ' <span class="sc0-start-hint">' + T('scene0.startHint') + '</span></button>' +
      '<div class="sc0-reveal" hidden>' +
        '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
        '<button class="btd-btn primary sc0-begin" type="button">' + T('scene0.begin') + ' &rsaquo;</button>' +
      '</div>' +
      '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
      '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
      '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>';
    root.appendChild(wrap);

    /* Hero dock tile: 2 pallets, 4 hours; a pallet "loops on" on START. */
    const tile = window.DockBoard.mount(wrap.querySelector('.sc0-tile-host'), { variant: 'icon', p: 2, h: 4 });

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = wrap.querySelector('.sc0-reveal');
      if (rev) rev.hidden = false;
      const startBtn = wrap.querySelector('.sc0-start');
      if (startBtn) startBtn.style.display = 'none';
      /* a pallet slides on, the clock ticks: a single illustrative WAIT outcome. */
      tile.setState(3, 3); tile.pulse();
      if (window.SFX) window.SFX.play('arrive');
    }

    const startBtn = wrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = wrap.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.BTD && window.BTD.goTo(1));

    if (window.BTD && window.BTD.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

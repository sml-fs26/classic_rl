/* Scene 0 -- Title / hook.
 *   A pastry case at dawn: a single FRESH croissant steaming under a hanging
 *   OPEN sign, the title, and a blinking OPEN THE SHOP prompt. Clicking reveals
 *   the manager framing + a BEGIN prompt that yields to the engine (-> scene 1).
 *   Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene0 = function (root) {
    root.className = 'scene scene-pad sc0';
    root.innerHTML =
      '<div class="sc0-wrap">' +
        '<div class="sc0-sign">' + T('scene0.open') + '</div>' +
        '<h1 class="poke-title sc0-title">' + T('scene0.title') + '</h1>' +
        '<p class="sc0-tagline">' + T('scene0.tagline') + '</p>' +
        '<div class="sc0-stage">' +
          '<div class="sc0-case"><div class="sc0-croissant"></div><div class="sc0-pricetag">CHF</div></div>' +
        '</div>' +
        '<button class="poke-btn primary sc0-start" type="button">' + T('scene0.start') + '</button>' +
        '<div class="sc0-reveal" hidden>' +
          '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
          '<button class="poke-btn primary sc0-begin" type="button">' + T('scene0.begin') + ' &rsaquo;</button>' +
        '</div>' +
        '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
        '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
        '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>' +
      '</div>';

    const croi = root.querySelector('.sc0-croissant');
    if (croi) croi.innerHTML = window.Croissant.svg('FRESH', { px: 8 });

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = root.querySelector('.sc0-reveal'); if (rev) rev.hidden = false;
      const startBtn = root.querySelector('.sc0-start'); if (startBtn) startBtn.style.display = 'none';
      if (window.SFX) window.SFX.play('chaching');
    }
    const startBtn = root.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = root.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.SBS && window.SBS.goTo(1));

    if (window.SBS && window.SBS.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

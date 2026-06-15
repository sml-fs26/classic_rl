/* Scene 0, Title / hook.
 *   The little robot beside its 5-segment battery gauge (full), the drain die
 *   with its 70/30 badge, the tagline + START. START reveals the manager
 *   framing + a BEGIN prompt that yields to the engine (-> scene 1). A soft
 *   demo: the gauge ticks down a pip. Cold-entry safe; honours &run. */
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
        '<div class="sc0-gauge-host"></div>' +
        '<div class="sc0-die-host"></div>' +
      '</div>' +
      '<button class="rr-btn primary sc0-start" type="button">' + T('scene0.start') + '</button>' +
      '<div class="sc0-reveal" hidden>' +
        '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
        '<button class="rr-btn primary sc0-begin" type="button">BEGIN &rsaquo;</button>' +
      '</div>' +
      '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
      '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
      '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>';
    root.appendChild(wrap);

    /* Hero robot + gauge, full battery. */
    const gauge = window.Gauge.mount(wrap.querySelector('.sc0-gauge-host'), { variant: 'icon', level: window.Robot.FULL });

    /* The drain die, idly showing -1. */
    const die = window.Die.mount(wrap.querySelector('.sc0-die-host'), { badge: true });

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = wrap.querySelector('.sc0-reveal');
      if (rev) rev.hidden = false;
      const startBtn = wrap.querySelector('.sc0-start');
      if (startBtn) startBtn.style.display = 'none';
      /* one illustrative drain so the gauge reads as "ticking down". */
      die.roll(window.Robot.makeRng(11), -1).then(() => {
        gauge.drainTo(window.Robot.HIGH, { spark: true });
        if (window.SFX) window.SFX.play('spark');
      });
    }

    const startBtn = wrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = wrap.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.RR && window.RR.goTo(1));

    if (window.RR && window.RR.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

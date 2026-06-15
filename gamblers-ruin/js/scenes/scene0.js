/* Scene 0, Title / hook.
 *   The cash ladder rising from a dark RUIN slab to a gold $10 GOAL, a token
 *   on a fresh starting rung, and the rigged coin with its 40/60 badge.
 *   Tagline + START. START reveals the manager framing and a BEGIN prompt that
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
        '<div class="sc0-ladder-host"></div>' +
        '<div class="sc0-coin-host"></div>' +
      '</div>' +
      '<button class="gr-btn primary sc0-start" type="button">' + T('scene0.start') + '</button>' +
      '<div class="sc0-reveal" hidden>' +
        '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
        '<button class="gr-btn primary sc0-begin" type="button">BEGIN &rsaquo;</button>' +
      '</div>' +
      '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
      '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
      '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>';
    root.appendChild(wrap);

    /* Hero ladder with a token at $5. */
    const ladder = window.QLadder.mount(wrap.querySelector('.sc0-ladder-host'), { variant: 'icon' });
    ladder.setToken(5);

    /* The rigged coin, idly showing $; a soft demo flip on START. */
    const coin = window.Coin.mount(wrap.querySelector('.sc0-coin-host'), { badge: T('coin.badge') });

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = wrap.querySelector('.sc0-reveal');
      if (rev) rev.hidden = false;
      const startBtn = wrap.querySelector('.sc0-start');
      if (startBtn) startBtn.style.display = 'none';
      /* one illustrative flip + token nudge so the coin reads as "rigged". */
      coin.flip(false).then(() => { ladder.setToken(3); ladder.pulseToken(); });
    }

    const startBtn = wrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = wrap.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.GR && window.GR.goTo(1));

    if (window.GR && window.GR.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

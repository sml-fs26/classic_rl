/* Scene 0 -- Title / hook.
 *   A single Trial Card center-screen: a fresh signup at the bottom rung of the
 *   adoption ladder, the Trial Clock ticking down from 5, beside the Adoption
 *   Coin. Tagline + START. START reveals the manager framing and a BEGIN prompt
 *   that yields to the engine (-> scene 1). Cold-entry safe; honours &run. */
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
        '<div class="sc0-card-host"></div>' +
        '<div class="sc0-coin-host"></div>' +
      '</div>' +
      '<button class="tc-btn primary sc0-start" type="button">' + T('scene0.start') + '</button>' +
      '<div class="sc0-reveal" hidden>' +
        '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
        '<button class="tc-btn primary sc0-begin" type="button">BEGIN &rsaquo;</button>' +
      '</div>' +
      '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
      '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
      '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>';
    root.appendChild(wrap);

    /* Hero Trial Card: a cold day-5 user. */
    const card = window.TrialCard.mount(wrap.querySelector('.sc0-card-host'), {});
    card.setState(0, 5);

    /* The Adoption Coin, idle; a soft demo flip on START. */
    const coin = window.Coin.mount(wrap.querySelector('.sc0-coin-host'), { badge: T('coin.badge') });

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = wrap.querySelector('.sc0-reveal');
      if (rev) rev.hidden = false;
      const startBtn = wrap.querySelector('.sc0-start');
      if (startBtn) startBtn.style.display = 'none';
      /* one illustrative nudge: the coin lands heads, the user climbs one rung,
         a day burns -- the loop in miniature. */
      coin.flip(true).then(() => { card.setState(1, 4); card.pulse(); });
    }

    const startBtn = wrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = wrap.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.TC && window.TC.goTo(1));

    if (window.TC && window.TC.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

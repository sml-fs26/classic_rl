/* Scene 0: REPAIR OR REPLACE title screen.
 *
 *   The poster. The wordmark drops in letter by letter on a first visit
 *   (localStorage flag 'repair-or-replace.sc0-seen' makes later visits
 *   plain, so the ceremony stays a moment, not a tax). Below it: the
 *   recurring state-icon (VanCard, lg) with OLD BESSIE at HEALTHY wear,
 *   a teaser row of the three calls (RUN / SERVICE / REPLACE), the
 *   one-line dilemma, and a blinking PRESS START.
 *
 *   The manager framing is set in one breath (one van, one call a week,
 *   the ledger keeps score) before any notation appears. START fades the
 *   poster briefly and hands off to the pager (scene 1, the tutorial).
 *   The START button is [data-run-primary] so &run drives the deck
 *   headlessly. Title music is driven by the pager; not touched here.
 *
 *   Uses only window.VanCard, window.Actions, window.VanViz. No engine
 *   math here; the van just rests at HEALTHY with cosmetic miles.
 */
(function () {
  window.scenes = window.scenes || {};

  const SEEN_KEY = 'repair-or-replace.sc0-seen';
  function isFirstVisit() {
    try { return !localStorage.getItem(SEEN_KEY); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_e) {}
  }
  function reduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  /* Collapse all staging under &run / &instant (headless capture) and
     under prefers-reduced-motion. */
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') || reduced();
  }

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad', 'scene0-scene');
    root.innerHTML = '';

    const ceremony = isFirstVisit() && !instantMode();

    const wrap = document.createElement('div');
    wrap.className = 'sc0-wrap' + (ceremony ? ' sc0-first' : '');

    /* Two stacked wordmark lines, per-letter spans so the first-visit
       drop can stagger. The letter index runs across both lines. */
    const LINES = ['REPAIR', 'OR REPLACE'];
    let titleHtml = '';
    let li = 0;
    for (const line of LINES) {
      titleHtml += '<span class="sc0-line">';
      for (const ch of line) {
        if (ch === ' ') { titleHtml += '<span class="sc0-sp">&nbsp;</span>'; continue; }
        titleHtml += '<span class="sc0-letter" style="--i:' + li + '">' + ch + '</span>';
        li++;
      }
      titleHtml += '</span>';
    }

    wrap.innerHTML =
      '<h1 class="poke-title sc0-title">' + titleHtml + '</h1>' +
      '<div class="sc0-subtitle">ONE VAN. THREE CALLS. EVERY WEEK.</div>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-van-host" aria-label="OLD BESSIE, your delivery van"></div>' +
        '<div class="sc0-levers"></div>' +
      '</div>' +
      '<div class="poke-box sc0-tagline">Run her, shop her, or buy new. ' +
        'Every week is one call, and the fleet ledger keeps the score.</div>' +
      '<button class="poke-btn sc0-start" type="button" data-run-primary>' +
        '<span class="sc0-chevron">&#9654;</span>' +
        '<span class="sc0-start-label">PRESS START</span>' +
      '</button>' +
      '<div class="sc0-credits">SML &middot; ETH ZURICH &middot; CLASSIC RL</div>' +
      '<div class="sc0-credits sc0-credits-by">BY CARLOS COTRINI</div>';
    root.appendChild(wrap);

    /* The recurring state-icon, hero size, factory-fresh. Miles are
       cosmetic flavor only; every real number lives in DATA/Van. */
    const vanHost = wrap.querySelector('.sc0-van-host');
    let card = null;
    if (window.VanCard && vanHost) {
      card = window.VanCard.mount(vanHost, { wear: 0, size: 'lg', miles: 48213, name: 'OLD BESSIE' });
    } else if (vanHost) {
      vanHost.textContent = 'OLD BESSIE';
    }

    /* Teaser row: the three calls, tinted by their lever tokens. */
    const levers = wrap.querySelector('.sc0-levers');
    const acts = (window.Actions && window.Actions.ACTIONS) || [];
    levers.innerHTML = acts.map((a) =>
      '<span class="sc0-lever ' + (window.Actions ? window.Actions.toneClass(a.id) : '') + '">' +
        '<span class="sc0-lever-ic">' + (window.Actions ? window.Actions.leverIconSvg(a.id) : '') + '</span>' +
        '<span class="sc0-lever-name">' + a.name + '</span>' +
      '</span>').join('');

    /* START: brief poster fade, then hand off to the pager. The pager's
       delegated .poke-btn click handler plays the cursor blip. */
    let advancing = false;
    function start() {
      if (advancing) return;
      advancing = true;
      const go = () => { if (window.VanViz) window.VanViz.goTo(1); };
      if (instantMode()) { go(); return; }
      wrap.classList.add('sc0-dissolving');
      setTimeout(go, 320);
    }
    wrap.querySelector('.sc0-start').addEventListener('click', start);

    if (ceremony) markSeen();

    return {
      /* Re-assert the resting poster if we return to the title (dot
         pager / replay) so the van is never left mid-dissolve. */
      onEnter() {
        advancing = false;
        wrap.classList.remove('sc0-dissolving');
        if (card) card.set(0);
      },
      /* Right arrow on the title fires the same ceremony as START. */
      onNextKey() { start(); return true; },
    };
  };
})();

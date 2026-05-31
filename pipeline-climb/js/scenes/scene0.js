/* Scene 0: PIPELINE CLIMB title screen.
 *
 *   The hook. The wordmark drops in letter by letter on a first visit
 *   (localStorage flag 'pipeline-climb.sc0-seen' makes later visits
 *   plain, so the ceremony stays a moment, not a tax). Below it: the
 *   recurring state-icon (LadderCard, lg) with a single living lead
 *   resting on the bottom COLD rung, its warmth bar pulsing cold-blue;
 *   the one-line tagline; and a blinking PRESS START.
 *
 *   The manager framing is set in one breath (this deal is about timing
 *   your push) before any notation appears. START dissolves the board
 *   (a brief fade on the ladder + title) and yields to the scene engine,
 *   which advances to scene 1 (the tutorial). The START button is
 *   [data-run-primary] so &run drives the deck headlessly.
 *
 *   Uses only window.LadderCard, window.I18N, window.SFX. No engine
 *   math here; the lead just sits at COLD (rung 0).
 */
(function () {
  window.scenes = window.scenes || {};

  const SEEN_KEY = 'pipeline-climb.sc0-seen';
  function isFirstVisit() {
    try { return !localStorage.getItem(SEEN_KEY); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_e) {}
  }

  window.scenes.scene0 = function (root) {
    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    root.classList.add('scene-pad', 'sc0-scene');
    root.innerHTML = '';

    const firstVisit = isFirstVisit();
    const titleText = T('scene.title0') || 'PIPELINE CLIMB';

    const wrap = document.createElement('div');
    wrap.className = 'sc0-title-wrap' + (firstVisit ? ' sc0-first-visit' : '');

    /* Per-letter spans so the first-visit drop can stagger; a space gets
       a dedicated class so the gap survives without an animatable glyph. */
    let titleHtml = '';
    let li = 0;
    for (let i = 0; i < titleText.length; i++) {
      const ch = titleText[i];
      if (ch === ' ') {
        titleHtml += '<span class="sc0-title-space">&nbsp;</span>';
      } else {
        titleHtml += '<span class="sc0-title-letter" style="--i:' + li + '">' + ch + '</span>';
        li++;
      }
    }

    wrap.innerHTML =
      '<h1 class="sc0-title">' + titleHtml + '</h1>' +
      '<div class="sc0-subtitle">' + T('scene0.subtitle') + '</div>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-ladder-host" aria-label="' + T('scene0.lead_label') + '"></div>' +
        '<div class="sc0-lead-tag">' + T('scene0.lead_label') + '</div>' +
      '</div>' +
      '<div class="poke-box sc0-tagline">' + T('scene0.tagline') + '</div>' +
      '<button class="poke-btn sc0-start" type="button" data-run-primary>' +
        '<span class="sc0-start-chevron">▶</span>' +
        '<span class="sc0-start-label">' + T('scene0.start') + '</span>' +
      '</button>' +
      '<div class="sc0-credits">' + T('scene0.credits') + '</div>' +
      '<div class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</div>';
    root.appendChild(wrap);

    /* The recurring state-icon: a single living lead resting on COLD.
       Large size so the title screen reads as "meet the board". The
       cold-blue warmth pulse is a CSS animation keyed off .sc0-ladder-host
       so it does not fight the LadderCard widget's own DOM. */
    const ladderHost = wrap.querySelector('.sc0-ladder-host');
    let card = null;
    if (window.LadderCard && ladderHost) {
      card = window.LadderCard.mount(ladderHost, { rung: 0, size: 'lg' });
    } else if (ladderHost) {
      ladderHost.textContent = 'COLD';
    }

    const startBtn = wrap.querySelector('.sc0-start');
    let advancing = false;
    function advance() {
      if (advancing) return;
      advancing = true;
      if (window.SFX) window.SFX.play('cursor');
      /* The board dissolves into the empty ladder before the page turns:
         dim the ladder + fade the title, then hand off to the pager. */
      wrap.classList.add('sc0-dissolving');
      const go = () => {
        if (window.PipeViz) window.PipeViz.goTo(window.PipeViz.getCurrentScene() + 1);
      };
      const reduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { go(); return; }
      setTimeout(go, 320);
    }
    if (startBtn) startBtn.addEventListener('click', advance);

    if (firstVisit) markSeen();

    return {
      /* Re-assert the resting state if we return to the title (e.g. via
         the dot-pager) so the lead is never left blank. */
      onEnter() {
        advancing = false;
        wrap.classList.remove('sc0-dissolving');
        if (card) card.set(0);
      },
    };
  };
})();

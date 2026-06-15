/* Scene 0: CHURN RESCUE title / hook.
 *
 *   A single COOLING account card sits centre-stage: it starts THRIVING
 *   and drifts down the engagement bar (green to amber) while the renewal
 *   countdown ticks 5, 4, 3 mo., dramatising "this customer is drifting."
 *   Under it: the wordmark, the hook line, and a blinking PRESS START.
 *   Pressing START (or NEXT) dissolves the card into the EMPTY 5x5
 *   retention map, the board the whole experience will fill, then yields
 *   to the pager and advances to the tutorial.
 *
 *   Course-viz contract: never auto-run on a bare onEnter; the &run hash
 *   flag triggers the primary button (START) for headless capture.
 *
 *   First visit (per localStorage) plays the full drift ceremony; revisits
 *   land on the already-cooled card so the moment stays a beat, not a tax.
 *   The recurring widgets are reused as-is: AccountCard for the hero card,
 *   QTable for the empty board it dissolves into.
 */
(function () {
  window.scenes = window.scenes || {};

  const SEEN_KEY = 'churn-rescue.sc0-seen';
  function isFirstVisit() {
    try { return !localStorage.getItem(SEEN_KEY); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_e) {}
  }
  function prefersReduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad', 'sc0-scene');
    root.innerHTML = '';
    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

    /* The cooling drift: start thriving with the longest runway, then
       step down one tier per beat to lukewarm while the countdown ticks.
       Pulled from the engine so the months/tiers stay authoritative. */
    const NUM_MONTHS = (window.Churn && window.Churn.NUM_MONTHS) || 5;
    const DRIFT = [
      { tier: 4, m: NUM_MONTHS },     /* THRIVING, long runway */
      { tier: 3, m: NUM_MONTHS - 1 }, /* HEALTHY */
      { tier: 2, m: NUM_MONTHS - 2 }, /* LUKEWARM, 3 mo. to renewal */
    ];
    const START = DRIFT[0];
    const END = DRIFT[DRIFT.length - 1];

    /*, DOM skeleton, */
    const wrap = document.createElement('div');
    wrap.className = 'sc0-title-wrap';

    /* Hero stage: the cooling account card (built with AccountCard). */
    const stage = document.createElement('div');
    stage.className = 'sc0-stage';
    const cardHost = document.createElement('div');
    cardHost.className = 'sc0-card-host';
    stage.appendChild(cardHost);

    /* Board host (hidden until START): the empty retention map the card
       dissolves into. */
    const boardHost = document.createElement('div');
    boardHost.className = 'sc0-board-host';

    const title = document.createElement('h1');
    title.className = 'sc0-title';
    title.textContent = T('scene.title0');

    const hook = document.createElement('div');
    hook.className = 'sc0-subtitle';
    hook.textContent = T('scene0.hook');

    const start = document.createElement('button');
    start.className = 'poke-btn sc0-start';
    start.type = 'button';
    start.innerHTML =
      '<span class="sc0-start-chevron">&#9654;</span>' +
      '<span class="sc0-start-label">' + T('scene0.start') + '</span>';

    const credits = document.createElement('div');
    credits.className = 'sc0-credits';
    credits.textContent = T('scene0.credits');

    wrap.appendChild(stage);
    wrap.appendChild(boardHost);
    wrap.appendChild(title);
    wrap.appendChild(hook);
    wrap.appendChild(start);
    wrap.appendChild(credits);
    root.appendChild(wrap);

    /*, The hero account card, */
    const firstVisit = isFirstVisit();
    const card = window.AccountCard.mount(cardHost, {
      tier: firstVisit ? START.tier : END.tier,
      m: firstVisit ? START.m : END.m,
      size: 'full',
    });

    /* The cooling drift: tick the engagement bar down one tier per beat
       (reusing the card's own tickTier transition) and decrement the
       countdown alongside it, so the card visibly drifts toward the exit.
       Loops gently so a paused title screen keeps breathing. A cursor
       blip marks each sag. */
    let driftTimer = null;
    let driftIdx = 0;
    let started = false;          /* set once START fires */

    function clearDrift() {
      if (driftTimer) { clearTimeout(driftTimer); driftTimer = null; }
    }

    function driftStep() {
      if (started) return;
      driftIdx++;
      if (driftIdx < DRIFT.length) {
        const next = DRIFT[driftIdx];
        card.tickTier(next.tier);
        card.set({ m: next.m });
        if (window.SFX) window.SFX.play('tick');
        driftTimer = setTimeout(driftStep, 1500);
      } else {
        /* Hold the cooled card a beat, then reset to thriving and drift
           again: a slow, hypnotic loop that says "cooling" without ever
           churning on the title screen. */
        driftTimer = setTimeout(() => {
          if (started) return;
          driftIdx = 0;
          card.set(START);
          driftTimer = setTimeout(driftStep, 1500);
        }, 2600);
      }
    }

    function beginDrift() {
      if (started || prefersReduced() || !firstVisit) return;
      driftIdx = 0;
      card.set(START);
      driftTimer = setTimeout(driftStep, 1400);
    }

    /*, START: dissolve the card into the empty retention map, */
    let advancing = false;
    function advance() {
      if (advancing) return;
      advancing = true;
      started = true;
      clearDrift();
      markSeen();
      if (window.SFX) window.SFX.play('cursor');

      const goNext = () => {
        if (window.ChurnViz) {
          window.ChurnViz.goTo(window.ChurnViz.getCurrentScene() + 1);
        }
      };

      if (prefersReduced()) { goNext(); return; }

      /* Reveal the empty board behind/below, fade the title furniture, and
         dissolve the hero card; then advance. The empty map is the real
         QTable widget with every cell blanked (reset), so the board the
         student is about to fill is the same board, introduced here. */
      try {
        const map = window.QTable.mount(boardHost);
        if (map && map.reset) map.reset();
      } catch (_e) { /* if the widget is unavailable, just advance */ }

      wrap.classList.add('sc0-dissolving');
      let done = false;
      const finish = () => { if (done) return; done = true; goNext(); };
      cardHost.addEventListener('animationend', finish, { once: true });
      /* Fallback for headless capture / missing animationend. */
      setTimeout(finish, 1100);
    }

    start.addEventListener('click', advance);

    /* &run: headless capture triggers the primary button (START). Never
       auto-run on a bare onEnter otherwise. */
    function maybeRun() {
      if (/[#&?]run\b/.test(window.location.hash)) {
        setTimeout(() => start.click(), 150);
      }
    }

    /* The pager calls the builder on first paint but only fires onEnter on
       RE-entry, so kick the cooling drift (and read the &run flag) here, at
       build time, and guard onEnter so a revisit restarts the drift without
       double-scheduling. */
    beginDrift();
    maybeRun();

    return {
      onEnter() {
        if (!started && !driftTimer) beginDrift();
        maybeRun();
      },
      onLeave() { started = true; clearDrift(); },
    };
  };
})();

/* Scene 1 - Tutorial: "How it works".
 *
 * Three annotated panels, NO theory, walked with the LEFT / RIGHT keys (or
 * the on-screen page buttons). Every step has a prominent SKIP TUTORIAL
 * button that jumps straight to the playtest (scene 2). Vocabulary only:
 * rung, lever, touch, STAGE DIE, signed / lost.
 *
 *   Panel 1: THE LADDER + warmth bar. "The situation now" - which rung the
 *            lead sits on. Uses LadderCard; a looping demo walks the lead up
 *            the five rungs so the warmth ramp reads.
 *   Panel 2: THE THREE LEVERS. NURTURE / DEMO / HARD CLOSE, the only buttons;
 *            each costs the rep one touch (-1). A soft-to-aggressive axis
 *            strip under them.
 *   Panel 3: THE STAGE DIE rolling once + the two endings. Uses StageDie
 *            (a live UP roll, the card hops a rung) and two ending cards:
 *            green SIGNED (+30), grey LOST (-10).
 *
 * Cold-entry safe: reads everything from window.Pipeline / window.Levers /
 * window.DATA and the shared widgets. No autorun on onEnter; &run rolls the
 * panel-3 die once via [data-run-primary].
 *
 * Registers window.scenes.scene1 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* Step ids drive i18n lookups: tut.step.<id>.title / .dialog. */
  const STEPS = [
    { id: 'ladder', render: renderLadderPanel },
    { id: 'levers', render: renderLeversPanel },
    { id: 'die',    render: renderDiePanel    },
  ];

  window.scenes.scene1 = function (root) {
    root.classList.add('scene-pad', 'tut-scene');
    root.innerHTML = '';

    /*, Top bar: step counter + SKIP button, */
    const topbar = document.createElement('div');
    topbar.className = 'tut-topbar';
    root.appendChild(topbar);

    const counter = document.createElement('div');
    counter.className = 'tut-step-counter';
    topbar.appendChild(counter);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tut-skip-btn';
    topbar.appendChild(skipBtn);
    skipBtn.addEventListener('click', () => { window.location.hash = '#scene=2'; });

    /*, Section title, */
    const header = document.createElement('h2');
    header.className = 'poke-section-title tut-section-title';
    root.appendChild(header);

    /*, Demo area (changes per step), */
    const demoHost = document.createElement('div');
    demoHost.className = 'tut-demo';
    root.appendChild(demoHost);

    /*, Dialog at the bottom, */
    const dialogHost = document.createElement('div');
    dialogHost.className = 'tut-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /*, Page nav (PREV PAGE / NEXT PAGE) + hint, */
    const nav = document.createElement('div');
    nav.className = 'tut-nav';
    nav.innerHTML =
      '<button type="button" class="tut-page-btn tut-prev">&#9664; ' + T('tut.page.prev') + '</button>' +
      '<span class="tut-nav-hint">' + T('tut.nav.hint') + '</span>' +
      '<button type="button" class="tut-page-btn tut-next">' + T('tut.page.next') + ' &#9654;</button>';
    root.appendChild(nav);
    const prevPageBtn = nav.querySelector('.tut-prev');
    const nextPageBtn = nav.querySelector('.tut-next');
    prevPageBtn.addEventListener('click', () => step(cursor - 1));
    nextPageBtn.addEventListener('click', () => {
      if (cursor < STEPS.length - 1) step(cursor + 1);
      else window.location.hash = '#scene=2';
    });

    /*, Step engine, */
    let cursor = 0;
    let stopLoop = null;          /* teardown for the panel-1 climbing loop */

    function step(c) {
      if (c < 0) { window.location.hash = '#scene=0'; return; }
      if (c > STEPS.length - 1) { window.location.hash = '#scene=2'; return; }
      if (stopLoop) { stopLoop(); stopLoop = null; }
      cursor = c;
      const s = STEPS[c];
      counter.textContent = T('tut.step_of', { i: c + 1, total: STEPS.length });
      header.textContent = T('tut.step.' + s.id + '.title').toUpperCase();
      demoHost.innerHTML = '';
      const teardown = s.render(demoHost);
      if (typeof teardown === 'function') stopLoop = teardown;
      dialog.say(T('tut.step.' + s.id + '.dialog'));
      skipBtn.textContent = (c === STEPS.length - 1) ? T('tut.go_to_playtest') : T('tut.skip');
      nextPageBtn.innerHTML = (c === STEPS.length - 1)
        ? (T('tut.go_to_playtest') + ' &#9654;')
        : (T('tut.page.next') + ' &#9654;');
    }

    /* Optional `#...&tut=N` deep-link to an internal panel (headless capture). */
    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]tut=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < STEPS.length) ? n : 0;
    }
    step(readInitialStep());

    return {
      onEnter() { step(readInitialStep()); },
      onLeave() { if (stopLoop) { stopLoop(); stopLoop = null; } },
      onNextKey() {
        if (cursor < STEPS.length - 1) { step(cursor + 1); return true; }
        return false;        /* fall through: advance to scene 2 (playtest) */
      },
      onPrevKey() {
        if (cursor > 0) { step(cursor - 1); return true; }
        return false;        /* fall through: back to scene 0 (title) */
      },
    };
  };

  /* =========================================================================
     Panel renderers - each fills the demo host; may return a teardown fn.
     ========================================================================= */

  /* Panel 1: the ladder + warmth bar. A big LadderCard with the lead
     climbing rung by rung on a loop, plus a callout column naming the bottom
     (COLD) and top (READY) ends + the warmth ramp. */
  function renderLadderPanel(host) {
    const NR = (window.Pipeline && window.Pipeline.NUM_RUNGS) || 5;

    const wrap = document.createElement('div');
    wrap.className = 'tut-panel tut-ladder-panel';

    const cardHost = document.createElement('div');
    cardHost.className = 'tut-ladder-card';
    wrap.appendChild(cardHost);
    const card = window.LadderCard.mount(cardHost, { size: 'lg', rung: 0 });

    /* Annotated side column: the two named ends + the warmth legend. */
    const side = document.createElement('div');
    side.className = 'tut-ladder-side';
    side.innerHTML =
      '<div class="tut-callout tut-callout-top">' +
        '<span class="tut-callout-tag">' + T('rung.ready') + '</span>' +
        '<span class="tut-callout-txt">' + T('tut.ladder.top') + '</span>' +
      '</div>' +
      '<div class="tut-warm-legend">' +
        '<span class="tut-warm-swatch lc-warm-0"></span>' +
        '<span class="tut-warm-swatch lc-warm-1"></span>' +
        '<span class="tut-warm-swatch lc-warm-2"></span>' +
        '<span class="tut-warm-swatch lc-warm-3"></span>' +
        '<span class="tut-warm-swatch lc-warm-4"></span>' +
        '<span class="tut-warm-legend-label">' + T('tut.ladder.warmth') + '</span>' +
      '</div>' +
      '<div class="tut-callout tut-callout-bot">' +
        '<span class="tut-callout-tag">' + T('rung.cold') + '</span>' +
        '<span class="tut-callout-txt">' + T('tut.ladder.bot') + '</span>' +
      '</div>';
    wrap.appendChild(side);

    host.appendChild(wrap);

    /* Climbing loop: walk 0..4 then back to 0, ~900 ms per rung. Pure
       cosmetic; teardown clears the timer on panel change. */
    const reduce = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let r = 0, dir = 1, timer = null;
    function tick() {
      card.set(r);
      r += dir;
      if (r >= NR - 1) { r = NR - 1; dir = -1; }
      else if (r <= 0 && dir < 0) { r = 0; dir = 1; }
      timer = setTimeout(tick, 900);
    }
    if (reduce) { card.set(2); }     /* a mid rung, static, when motion is off */
    else tick();
    return function teardown() { if (timer) { clearTimeout(timer); timer = null; } };
  }

  /* Panel 2: the three levers as the only buttons, soft to aggressive,
     each tagged with its -1 touch cost + a one-line business gloss. */
  function renderLeversPanel(host) {
    const levers = (window.DATA && window.DATA.levers) ||
      (window.Levers && window.Levers.LEVERS) || [];
    const touch = (window.Pipeline && window.Pipeline.TOUCH_REWARD != null)
      ? window.Pipeline.TOUCH_REWARD : -1;

    const wrap = document.createElement('div');
    wrap.className = 'tut-panel tut-levers-panel';

    const menu = document.createElement('div');
    menu.className = 'tut-lever-menu';
    for (const l of levers) {
      const tone = (window.Levers && window.Levers.toneClass(l.id)) || '';
      const icon = (window.Levers && window.Levers.leverIconSvg(l.id)) || '';
      const btn = document.createElement('div');     /* display-only (tutorial) */
      btn.className = 'tut-lever-btn ' + tone;
      btn.innerHTML =
        '<span class="tut-lever-icon">' + icon + '</span>' +
        '<span class="tut-lever-name">' + T('lever.' + l.id) + '</span>' +
        '<span class="tut-lever-gloss">' + T('tut.lever.' + l.id) + '</span>' +
        '<span class="tut-lever-cost">' + touch + ' ' + T('vocab.touch') + '</span>';
      menu.appendChild(btn);
    }
    wrap.appendChild(menu);

    /* Soft to aggressive axis under the three buttons. */
    const axis = document.createElement('div');
    axis.className = 'tut-lever-axis';
    axis.innerHTML =
      '<span class="tut-axis-l">' + T('tut.levers.axis.l') + '</span>' +
      '<span class="tut-axis-line"></span>' +
      '<span class="tut-axis-r">' + T('tut.levers.axis.r') + '</span>';
    wrap.appendChild(axis);

    host.appendChild(wrap);
    return null;
  }

  /* Panel 3: the STAGE DIE rolling once + the two endings. */
  function renderDiePanel(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-panel tut-die-panel';

    /* Left: a small ladder + the die; ROLL replays one UP hop. */
    const left = document.createElement('div');
    left.className = 'tut-die-left';

    const ladderHost = document.createElement('div');
    ladderHost.className = 'tut-die-ladder';
    left.appendChild(ladderHost);
    const card = window.LadderCard.mount(ladderHost, { size: 'md', rung: 1, compact: true });

    const dieCol = document.createElement('div');
    dieCol.className = 'tut-die-col';
    const dieHost = document.createElement('div');
    dieHost.className = 'tut-die-host';
    dieCol.appendChild(dieHost);
    const die = window.StageDie.mount(dieHost);

    const rollBtn = document.createElement('button');
    rollBtn.type = 'button';
    rollBtn.className = 'tut-roll-btn';
    rollBtn.setAttribute('data-run-primary', '');
    rollBtn.textContent = T('tut.die.roll');
    dieCol.appendChild(rollBtn);
    left.appendChild(dieCol);
    wrap.appendChild(left);

    /* The three faces legend (UP / STAY / DOWN). */
    const faces = document.createElement('div');
    faces.className = 'tut-die-faces';
    faces.innerHTML =
      '<span class="tut-face tut-face-up">' + T('die.up') + '</span>' +
      '<span class="tut-face tut-face-stay">' + T('die.stay') + '</span>' +
      '<span class="tut-face tut-face-down">' + T('die.down') + '</span>';
    left.appendChild(faces);

    /* Right: the two endings - SIGNED (+30) and LOST (-10). */
    const endings = document.createElement('div');
    endings.className = 'tut-endings';

    const signed = document.createElement('div');
    signed.className = 'tut-ending tut-ending-signed';
    signed.appendChild(makeMiniLadder({ terminal: true, signed: true }));
    signed.insertAdjacentHTML('beforeend',
      '<div class="tut-ending-title">' + T('vocab.signed') + '</div>' +
      '<div class="tut-ending-reward">+' + (window.Pipeline ? window.Pipeline.SIGNED_REWARD : 30) + '</div>' +
      '<div class="tut-ending-txt">' + T('tut.die.signed') + '</div>');

    const lost = document.createElement('div');
    lost.className = 'tut-ending tut-ending-lost';
    lost.appendChild(makeMiniLadder({ terminal: true, lost: true }));
    lost.insertAdjacentHTML('beforeend',
      '<div class="tut-ending-title">' + T('vocab.lost') + '</div>' +
      '<div class="tut-ending-reward">' + (window.Pipeline ? window.Pipeline.LOST_REWARD : -10) + '</div>' +
      '<div class="tut-ending-txt">' + T('tut.die.lost') + '</div>');

    endings.appendChild(signed);
    endings.appendChild(lost);
    wrap.appendChild(endings);

    host.appendChild(wrap);

    /* ROLL: replay one UP hop (CURIOUS -> ENGAGED) so the demo always shows
       a warm, clean result. The card resets, the die rolls UP, then the card
       hops a rung when the land settles. */
    let busy = false;
    function doRoll() {
      if (busy) return;
      busy = true;
      rollBtn.disabled = true;
      card.set(1);
      const log = { lever: 'demo', face: 'up', fromRung: 1, toRung: 2, signed: false, lost: false };
      die.roll(log).then(() => {
        card.set(2);
        busy = false;
        rollBtn.disabled = false;
      });
    }
    rollBtn.addEventListener('click', doRoll);
    return null;
  }

  /* A small static LadderCard for the ending cards (compact, terminal). */
  function makeMiniLadder(state) {
    const h = document.createElement('div');
    h.className = 'tut-mini-ladder';
    const c = window.LadderCard.mount(h, { size: 'sm', compact: true });
    c.setState(state);
    return h;
  }

})();

/* Scene 0 - TITLE / hook for Press Your Luck.
 *
 *   Two phases:
 *     (A) TITLE. The PRESS YOUR LUCK wordmark drops in (first visit only),
 *         a six-sided die tumbles forever over a glowing pot whose top
 *         "danger" chip pulses hot-red, the tagline reads under it, and a
 *         single PRESS START button blinks.
 *     (B) BOARD TEASE. One press settles the die, dissolves the title, and
 *         reveals the empty 6x3 board (pot bucket x standing) - the whole
 *         set of situations to come - with the manager hook. No theory yet,
 *         just the stakes. NEXT then advances to the tutorial.
 *
 *   The die uses the shared Die widget; the pot is the TableCard pot meter.
 *   Both reconstruct from window.Pig / window.DATA, so cold entry works.
 *
 *   localStorage 'pyl.sc0-seen' marks repeat visits as plain (no letter
 *   stagger) so the ceremony stays a moment, not a tax.
 *
 *   &run auto-presses START for headless capture (board-tease phase).
 */
(function () {
  window.scenes = window.scenes || {};

  function isFirstVisit() {
    try { return !localStorage.getItem('pyl.sc0-seen'); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem('pyl.sc0-seen', '1'); } catch (_e) {}
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad', 'sc0-scene');
    root.innerHTML = '';

    const T = (k) => (window.I18N ? window.I18N.t(k) : k);
    const firstVisit = isFirstVisit();

    /*, PHASE A: title, */
    const titleWrap = document.createElement('div');
    titleWrap.className = 'sc0-title-wrap' + (firstVisit ? ' sc0-first-visit' : '');

    /* Per-letter spans on line 1 so the first-visit drop can stagger. */
    const w1 = T('scene0.word1');
    let w1Html = '';
    for (let i = 0; i < w1.length; i++) {
      const ch = w1[i];
      const safe = ch === ' ' ? '&nbsp;' : ch;
      w1Html += '<span class="sc0-letter" style="--i:' + i + '">' + safe + '</span>';
    }
    const w2 = T('scene0.word2');
    let w2Html = '';
    for (let i = 0; i < w2.length; i++) {
      const ch = w2[i];
      const safe = ch === ' ' ? '&nbsp;' : ch;
      w2Html += '<span class="sc0-letter" style="--i:' + (w1.length + i) + '">' + safe + '</span>';
    }

    titleWrap.innerHTML =
      '<h1 class="sc0-title">' +
        '<span class="sc0-title-line sc0-title-1">' + w1Html + '</span>' +
        '<span class="sc0-title-line sc0-title-2">' + w2Html + '</span>' +
      '</h1>' +
      '<div class="sc0-subtitle">' + T('scene0.subtitle') + '</div>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-glow"></div>' +
        '<div class="sc0-pot-host"></div>' +
        '<div class="sc0-die-host"></div>' +
      '</div>' +
      '<div class="sc0-tagline">' + T('scene0.tagline') + '</div>' +
      '<button class="sc0-start" type="button">' +
        '<span class="sc0-start-chevron">▶</span>' +
        '<span class="sc0-start-label">' + T('scene0.start') + '</span>' +
      '</button>' +
      '<div class="sc0-starthint">' + T('scene0.starthint') + '</div>' +
      '<div class="sc0-credits">' + T('scene0.credits') + '</div>' +
      '<div class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</div>';
    root.appendChild(titleWrap);

    /* The glowing pot: a TableCard pot meter filled into the danger band so
       the hot-red top chip pulses (CSS owns the pulse). We hide its standing
       badge here - the title shows only "a pot, climbing into danger". */
    const potHost = titleWrap.querySelector('.sc0-pot-host');
    let potCard = null;
    if (window.TableCard) {
      potCard = window.TableCard.mount(potHost, { compact: false });
      const nb = (window.Pig && window.Pig.POT_BUCKETS) || 6;
      potCard.set({ potBucket: nb - 1, my: 0, riv: 0 });   // full into the 21+ danger band
    }

    /* The tumbling die: rolls forever on the title, drawing the eye to the
       randomness. We stop it the moment START is pressed. */
    const dieHost = titleWrap.querySelector('.sc0-die-host');
    let die = null;
    if (window.Die) die = window.Die.mount(dieHost, { rng: Math.random });

    let tumbleTimer = null;
    function startTumble() {
      if (!die || reducedMotion()) { if (die) die.show(5); return; }
      const loop = () => {
        const face = 2 + Math.floor(Math.random() * 5);   // 2..6, never the bust on the hook loop
        die.roll(face, { duration: 760, silent: true }).then(() => {
          tumbleTimer = setTimeout(loop, 520);
        });
      };
      loop();
    }
    function stopTumble() {
      if (tumbleTimer) { clearTimeout(tumbleTimer); tumbleTimer = null; }
    }

    /*, PHASE B: board tease, */
    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      stopTumble();
      if (window.SFX) window.SFX.play('cursor');

      /* Settle the die on a 5, then dissolve the whole title and swap in
         the empty board. A short fade keeps it a "moment". */
      const settle = die ? die.roll(5, { duration: 420, silent: true }) : Promise.resolve();
      const fadeMs = reducedMotion() ? 0 : 340;
      settle.then(() => {
        titleWrap.classList.add('sc0-dissolve');
        setTimeout(buildBoardTease, fadeMs);
      });
    }

    function buildBoardTease() {
      root.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'sc0-board-wrap';

      const head = document.createElement('div');
      head.className = 'sc0-board-head';
      head.textContent = T('scene0.title');
      wrap.appendChild(head);

      const hook = document.createElement('div');
      hook.className = 'poke-box sc0-hook';
      hook.innerHTML = T('scene0.hook') + '<span class="triangle"></span>';
      wrap.appendChild(hook);

      const boardHost = document.createElement('div');
      boardHost.className = 'sc0-board-host';
      wrap.appendChild(boardHost);

      const cap = document.createElement('div');
      cap.className = 'poke-caption sc0-board-cap';
      cap.textContent = T('scene0.boardtease');
      wrap.appendChild(cap);

      root.appendChild(wrap);

      /* The empty 6x3 board: every cell "unknown" (dimmed), mini table-cards
         showing the representative pot/standing per cell. This is the set of
         situations the rest of the deck fills in. */
      if (window.QTable) {
        const board = window.QTable.mount(boardHost, { miniCards: true, showQ: false });
        board.reset();   // all cells dimmed / no winning lever yet
      }

      if (!reducedMotion()) {
        wrap.classList.add('sc0-board-in');
      }
    }

    /*, wiring, */
    const startBtn = titleWrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);

    /* Click the die for a quick easter-egg roll while on the title. */
    if (dieHost) {
      dieHost.addEventListener('click', (e) => {
        if (revealed) return;
        e.stopPropagation();
      });
    }

    if (firstVisit) markSeen();

    /* Builder body runs on the FIRST build of the scene (goTo only calls
       onEnter on RE-entries). So kick off the tumble here, and honour the
       &run auto-trigger for headless capture. */
    startTumble();
    if (window.PYL && window.PYL.run) {
      /* Let the first-visit ceremony settle a beat, then reveal the board. */
      setTimeout(reveal, firstVisit ? 250 : 0);
    }

    return {
      onEnter() {
        if (!revealed) startTumble();
        /* &run: jump straight to the board tease for headless capture. */
        if (window.PYL && window.PYL.run && !revealed) reveal();
      },
      onLeave() { stopTumble(); },
      /* On the title phase, the down-arrow / NEXT first reveals the board;
         a second NEXT advances. Once revealed, fall through to advance. */
      onNextKey() {
        if (!revealed) { reveal(); return true; }
        return false;
      },
    };
  };
})();

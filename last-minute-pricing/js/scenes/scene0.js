/* Scene 0 -- Title / hook for Last-Minute Pricing.
 *
 *   The retro-pixel title ceremony in the shelf-card visual language:
 *     - a wall CLOCK whose hand sweeps toward MIDNIGHT,
 *     - beside it a SHELF of five glowing tickets (the perishable thing),
 *     - the tagline "Empty seats expire worthless at midnight.",
 *     - a single PRESS START prompt.
 *
 *   Pressing START dissolves the clock + shelf and reveals the empty
 *   5x4 board -- every situation (units left x days to deadline) the
 *   learner could be in -- with a dark MIDNIGHT gutter on the right.
 *   A BEGIN button then yields to the scene engine (-> scene 1).
 *
 *   First-visit ceremony staggers the title drop; localStorage marks
 *   later visits as plain so the moment stays a moment, not a tax.
 *
 *   Cold entry safe: builds entirely from window.Pricing dims + DATA;
 *   no dependency on any prior scene. Honours &run (auto-START for
 *   headless capture) and prefers-reduced-motion. */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  function isFirstVisit() {
    try { return !localStorage.getItem('pricing-viz.sc0-seen'); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem('pricing-viz.sc0-seen', '1'); } catch (_e) {}
  }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* A pixel wall-clock as inline SVG. The minute hand carries the
     `--clock-sweep` driven sweep (see CSS); the 12 marker reads
     MIDNIGHT. Colours all come from theme tokens. */
  function clockSVG() {
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x1 = 50 + Math.sin(a) * 40, y1 = 50 - Math.cos(a) * 40;
      const x2 = 50 + Math.sin(a) * 45, y2 = 50 - Math.cos(a) * 45;
      const major = (i % 3 === 0);
      ticks += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
        '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
        '" stroke="var(--ticket-edge)" stroke-width="' + (major ? 2.4 : 1.2) + '"/>';
    }
    return (
      '<svg class="sc0-clock-svg" viewBox="0 0 100 100" aria-hidden="true">' +
        '<circle cx="50" cy="50" r="47" fill="var(--card-bg)" stroke="var(--rule)" stroke-width="3"/>' +
        ticks +
        /* "12 = MIDNIGHT" emphasis pip */
        '<circle cx="50" cy="8" r="3.2" fill="var(--lever-firesale)"/>' +
        /* hour hand (short, fixed near midnight) */
        '<line class="sc0-clock-hour" x1="50" y1="50" x2="50" y2="26" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>' +
        /* minute hand (sweeps) */
        '<line class="sc0-clock-min" x1="50" y1="50" x2="50" y2="14" stroke="var(--lever-firesale)" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="50" cy="50" r="3.4" fill="var(--ink)"/>' +
      '</svg>'
    );
  }

  /* The hero shelf: a single large shelf-card at a full shelf (5 units,
     4 days). Uses the shared widget so the icon language is identical
     to every later scene. */
  function buildHeroShelf(host) {
    if (window.ShelfCard) {
      const card = window.ShelfCard.render({ u: 5, d: 4 }, { size: 'lg', label: false });
      card.classList.add('sc0-hero-card');
      host.appendChild(card);
    }
  }

  /* The empty 5x4 board reveal: rows = units (5 top .. 1 bottom),
     cols = days (d=4 left .. d=1 right) + a dark MIDNIGHT gutter.
     Decorative only -- no Q values shown (the learner has not played
     yet). Mirrors qtable.css board geometry without QTable internals. */
  function buildBoard(host) {
    const P = window.Pricing;
    const ROWS = (P && P.ROWS) || 5;
    const COLS = (P && P.COLS) || 4;

    const board = document.createElement('div');
    board.className = 'sc0-board';

    /* Column heads: day numbers d=4..1 then the MIDNIGHT gutter head. */
    const heads = document.createElement('div');
    heads.className = 'sc0-board-heads';
    heads.style.setProperty('--cols', String(COLS));
    let headsHtml = '<div class="sc0-corner"></div>';
    for (let c = 0; c < COLS; c++) {
      const d = COLS - c; // 4..1
      headsHtml += '<div class="sc0-col-head">d' + d + '</div>';
    }
    headsHtml += '<div class="sc0-col-head sc0-gutter-head">0</div>';
    heads.innerHTML = headsHtml;
    board.appendChild(heads);

    /* Grid body: one row per unit count, plus row heads + midnight gutter. */
    const body = document.createElement('div');
    body.className = 'sc0-board-body';
    body.style.setProperty('--cols', String(COLS));

    let cellIdx = 0;
    for (let r = 0; r < ROWS; r++) {
      const u = ROWS - r; // 5..1
      const rowHead = document.createElement('div');
      rowHead.className = 'sc0-row-head';
      rowHead.textContent = 'u' + u;
      body.appendChild(rowHead);

      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'sc0-cell';
        cell.style.setProperty('--i', String(cellIdx++));
        body.appendChild(cell);
      }
      /* midnight gutter cell for this row */
      const gut = document.createElement('div');
      gut.className = 'sc0-gutter-cell';
      body.appendChild(gut);
    }
    board.appendChild(body);

    /* Axis labels. */
    const axDays = document.createElement('div');
    axDays.className = 'sc0-axis sc0-axis-days';
    axDays.textContent = T('scene0.daysAxis');
    board.appendChild(axDays);

    const axUnits = document.createElement('div');
    axUnits.className = 'sc0-axis sc0-axis-units';
    axUnits.textContent = T('scene0.unitsAxis');
    board.appendChild(axUnits);

    host.appendChild(board);
  }

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad', 'sc0-scene');
    root.innerHTML = '';

    const firstVisit = isFirstVisit();

    /* ---------------- PHASE 1: TITLE ---------------- */
    const titleWrap = document.createElement('div');
    titleWrap.className = 'sc0-title-wrap' + (firstVisit ? ' sc0-first' : '');

    const titleText = T('scene0.title');
    let titleHtml = '';
    for (let i = 0; i < titleText.length; i++) {
      const ch = titleText[i];
      const safe = ch === ' ' ? '&nbsp;' : ch;
      titleHtml += '<span class="sc0-title-letter" style="--i:' + i + '">' + safe + '</span>';
    }

    titleWrap.innerHTML =
      '<h1 class="poke-title sc0-title">' + titleHtml + '</h1>' +
      '<div class="sc0-subtitle">' + T('scene0.subtitle') + '</div>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-clock-wrap">' +
          clockSVG() +
          '<div class="sc0-clock-label">' + T('scene0.clockLabel') + '</div>' +
          '<div class="sc0-midnight-chip">' + T('scene0.midnight') + '</div>' +
        '</div>' +
        '<div class="sc0-shelf-wrap">' +
          '<div class="sc0-shelf-host"></div>' +
          '<div class="sc0-shelf-label">' + T('scene0.shelfLabel') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sc0-tagline">' + T('scene0.tagline') + '</div>' +
      '<button class="sc0-start" type="button">' +
        '<span class="sc0-start-chevron">▶</span>' +
        '<span class="sc0-start-label">' + T('scene0.start') + '</span>' +
      '</button>' +
      '<div class="sc0-hook">' + T('scene0.hook') + '</div>' +
      '<div class="sc0-credits">' + T('scene0.credits') + '</div>' +
      '<div class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</div>';
    root.appendChild(titleWrap);

    buildHeroShelf(titleWrap.querySelector('.sc0-shelf-host'));

    /* ---------------- PHASE 2: BOARD (built lazily) ---------------- */
    let boardWrap = null;
    let phase = 1;

    function buildBoardPhase() {
      boardWrap = document.createElement('div');
      boardWrap.className = 'sc0-board-wrap';
      boardWrap.innerHTML =
        '<div class="sc0-board-title">' + T('scene0.boardLabel') + '</div>' +
        '<div class="sc0-board-host"></div>' +
        '<div class="sc0-board-sub poke-caption">' + T('scene0.boardSub') + '</div>' +
        '<button class="sc0-board-go" type="button">' +
          '<span class="sc0-start-chevron">▶</span>' +
          '<span>' + T('scene0.boardGo') + '</span>' +
        '</button>';
      root.appendChild(boardWrap);
      buildBoard(boardWrap.querySelector('.sc0-board-host'));

      const goBtn = boardWrap.querySelector('.sc0-board-go');
      if (goBtn) {
        goBtn.addEventListener('click', () => {
          if (window.SFX) window.SFX.play('cursor');
          if (window.PriceViz) window.PriceViz.goTo(window.PriceViz.getCurrentScene() + 1);
        });
      }
      /* fade-in trigger on next frame */
      requestAnimationFrame(() => boardWrap.classList.add('sc0-board-in'));
    }

    /* The signature transition: the clock dissolves into the board. */
    function dissolveToBoard() {
      if (phase !== 1) return;
      phase = 2;
      if (window.SFX) window.SFX.play('thunder');

      const doSwap = () => {
        titleWrap.style.display = 'none';
        buildBoardPhase();
      };

      if (reduced()) { doSwap(); return; }
      titleWrap.classList.add('sc0-dissolve');
      setTimeout(doSwap, 620);
    }

    const startBtn = titleWrap.querySelector('.sc0-start');
    if (startBtn) {
      startBtn.addEventListener('click', dissolveToBoard);
    }

    if (firstVisit) markSeen();

    /* Headless capture: &run auto-fires START so the board reveal is
       screenshot-able. Never auto-advance on a normal onEnter. Fired on
       both cold construction (main.js builds but does NOT call onEnter on
       first entry) and on revisit onEnter, but only acts in phase 1. */
    function maybeAutorun() {
      if (window.PRICING_AUTORUN && phase === 1) {
        setTimeout(dissolveToBoard, reduced() ? 0 : 120);
      }
    }
    maybeAutorun();

    return {
      onEnter() { maybeAutorun(); },
      /* Right-arrow on the title consumes the key to fire the START
         dissolve first; on the board it falls through so the pager
         advances to scene 1. */
      onNextKey() {
        if (phase === 1) { dissolveToBoard(); return true; }
        return false;
      },
      onPrevKey() {
        /* If we are on the board, back up to the title rather than
           leaving the scene. */
        if (phase === 2) {
          phase = 1;
          if (boardWrap) { boardWrap.remove(); boardWrap = null; }
          titleWrap.style.display = '';
          titleWrap.classList.remove('sc0-dissolve');
          return true;
        }
        return false;
      },
    };
  };
})();

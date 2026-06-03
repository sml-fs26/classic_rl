/* shelfCard.js -- the recurring STATE-ICON for Last-Minute Pricing.
 *
 *   A "shelf card" renders one MDP state s = (seats left u, days-to-departure d)
 *   so the learner builds one mental picture across every scene: HOW MANY
 *   SEATS, HOW MUCH TIME. It is the pricing analogue of the Pokemon HP-bar
 *   sprite pair, and it replaces js/hpbar.js + js/sprite.js.
 *
 *   THEME -- a last-minute airline fare desk: an empty seat is worth real
 *   money today and exactly $0 the moment the gate closes. (The structural
 *   class names below -- .shelf-*, .cal-* -- are kept for back-compat with the
 *   scene animations that target them; only what they RENDER is a seat / a
 *   departure board.)
 *
 *   Composition:
 *     - a vertical STACK of NUM_UNITS seat slots; the bottom u are still
 *       FOR SALE (bright gold), the rest are sold (greyed). The empty seat is
 *       the perishable thing, drawn as an inline-SVG pixel seat (no PNG).
 *     - a DEPARTURE BOARD of NUM_DAYS day tiles; the leftmost d are still
 *       biddable (lit amber digits), elapsed days are flipped dim. The last
 *       tile is the departing plane: the deadline is GATE CLOSED.
 *
 *   All colour comes from CSS tokens (--ticket-*, --pip-*, --lever-*), so the
 *   CRT theme retints automatically and no categorical colour is inlined.
 *
 *   API (window.ShelfCard):
 *     render(state, opts) -> HTMLElement
 *        state: { u, d }  OR  { terminal:true, soldout?:true, deadline?:true }
 *        opts:  { size?: 'mini'|'sm'|'md'|'lg', label?: bool, lever?: leverId|null }
 *           label  -> append a "Nu / Md" caption (default true; forced off for
 *                     the 'mini' size so it stays compact in a Q-table cell)
 *           lever  -> tint the card frame with that lever's colour (optional)
 *     mount(host, opts) -> handle { set(u, d), setState(state), el(), size }
 *        Mounts a live shelf card into `host` and returns a handle whose
 *        .set(u, d) re-renders in place (cheap; scenes call it on the demand
 *        draw). `opts` is the same options object as render(); plus the
 *        initial state can be passed inline as { u, d } on opts. The 'mini'
 *        size is the Q-table-cell form (no caption, compact slots).
 *     ticketSVG(filled) -> SVG string for a single ticket (filled | greyed)
 *     pipSVG(on)         -> SVG string for a single day-pip (lit | spent)
 *     fromIndex(i, opts) -> render the state at stateIndex i (uses window.Pricing)
 *
 *   This is a foundation widget: it renders the static icon and supports a
 *   cheap in-place .set() so scenes can drive it during the DEMAND-DRAW
 *   animation (see js/deck.js for the shared flip/slide-off/crumble VFX). */
(function () {
  const NUM_UNITS = (window.Pricing && window.Pricing.NUM_UNITS) || 5;
  const NUM_DAYS  = (window.Pricing && window.Pricing.NUM_DAYS)  || 4;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Normalise the requested size; 'mini' is the Q-table-cell form (alias of
     a dedicated tiny variant) and never shows a caption. */
  function normSize(size) {
    if (size === 'mini' || size === 'xs') return 'mini';
    if (size === 'sm' || size === 'lg') return size;
    return 'md';
  }

  /* A single pixel airplane seat as inline SVG (side profile). `filled` picks
     the for-sale (bright) vs sold (greyed) token set. Geometry: a headrest +
     reclined seat back + cushion -- a chunky chair silhouette that still reads
     at the tiny Q-table size. Class name kept as `shelf-ticket` so the scene
     sell / crumble animations keep targeting it. */
  function seatSVG(filled) {
    const fill = filled ? 'var(--ticket-fill)' : 'var(--ticket-gone)';
    const edge = filled ? 'var(--ticket-edge)' : 'var(--ticket-gone-edge)';
    const cls = 'shelf-ticket' + (filled ? ' is-live' : ' is-gone');
    return (
      '<svg class="' + cls + '" viewBox="0 0 48 18" preserveAspectRatio="none" aria-hidden="true">' +
        /* headrest cap */
        '<rect x="9" y="1"  width="13" height="4"  fill="' + fill + '" stroke="' + edge + '" stroke-width="2"/>' +
        /* seat back */
        '<rect x="11" y="3" width="10" height="12" fill="' + fill + '" stroke="' + edge + '" stroke-width="2"/>' +
        /* seat cushion */
        '<rect x="11" y="11" width="26" height="5" fill="' + fill + '" stroke="' + edge + '" stroke-width="2"/>' +
      '</svg>'
    );
  }
  /* Back-compat alias: callers/exports still reference ticketSVG. */
  const ticketSVG = seatSVG;

  /* One day-pip (a calendar tear-off square). Retained for back-compat;
     the day ribbon now uses the X-off calendar below. */
  function pipSVG(on) {
    const fill = on ? 'var(--pip-on)' : 'var(--pip-off)';
    return (
      '<svg class="shelf-pip ' + (on ? 'is-on' : 'is-off') + '" viewBox="0 0 14 16" aria-hidden="true">' +
        '<rect x="1" y="3" width="12" height="12" fill="' + fill + '" stroke="var(--ticket-edge)" stroke-width="1.5"/>' +
        '<rect x="3" y="1" width="2" height="3" fill="var(--ticket-edge)"/>' +
        '<rect x="9" y="1" width="2" height="3" fill="var(--ticket-edge)"/>' +
      '</svg>'
    );
  }

  /* A hand-stamped red X, overlaid on an elapsed calendar day. */
  function xSVG() {
    return (
      '<svg class="cal-x-mark" viewBox="0 0 20 20" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M3 3 L17 17 M17 3 L3 17" stroke="var(--cal-x-ink)" stroke-width="4" ' +
          'stroke-linecap="round" fill="none"/>' +
      '</svg>'
    );
  }

  /* A departing plane for the GATE CLOSED (deadline) tile. Top-view jet
     pointing up-and-away. Class name kept as `cal-moon-mark` for CSS sizing. */
  function planeSVG() {
    return (
      '<svg class="cal-moon-mark" viewBox="0 0 16 16" aria-hidden="true">' +
        '<path d="M8 1 L9 6 L15 9.5 L9 10 L9 13 L11 15 L8 14 L5 15 L7 13 L7 10 ' +
          'L1 9.5 L7 6 Z" fill="var(--cal-moon)"/>' +
      '</svg>'
    );
  }
  /* Back-compat alias: exports still reference moonSVG. */
  const moonSVG = planeSVG;

  /* Build the DEPARTURE BOARD row for a state: NUM_DAYS day tiles (the
     earliest `elapsed` are flipped dim; the rest are lit) plus the GATE
     tile (the departing plane). days-to-departure = the lit tiles = d. */
  function boardHTML(ud, terminalDeadline) {
    const elapsed = Math.max(0, NUM_DAYS - ud.d);   // departed => ud.d 0 => all elapsed
    let cells = '';
    for (let i = 0; i < NUM_DAYS; i++) {
      const flown = i < elapsed;
      cells += '<div class="cal-cell ' + (flown ? 'is-x' : 'is-open') + '" data-day="' + (i + 1) + '">' +
                 '<span class="cal-num">' + (i + 1) + '</span>' +
               '</div>';
    }
    cells += '<div class="cal-cell cal-midnight' + (terminalDeadline ? ' is-active' : '') + '">' +
               planeSVG() + '</div>';
    return '<div class="shelf-calendar" role="img" aria-label="' + ud.d + ' days to departure">' + cells + '</div>';
  }
  /* Back-compat alias: exports still reference calendarHTML. */
  const calendarHTML = boardHTML;

  function captionFor(state) {
    if (state.terminal) {
      if (state.soldout) return T('vocab.soldout');
      return T('vocab.midnight');
    }
    const uWord = state.u === 1 ? T('vocab.unit') : T('vocab.units');
    const dWord = state.d === 1 ? T('vocab.day') : T('vocab.days');
    return state.u + ' ' + uWord + ' · ' + state.d + ' ' + dWord;
  }

  /* Resolve { u, d } (and terminal flags) for whatever the caller passed. */
  function resolveUD(state) {
    const u = state.terminal ? (state.soldout ? 0 : (state.u || 0)) : (state.u || 0);
    const d = state.terminal ? (state.deadline ? 0 : (state.d || 0)) : (state.d || 0);
    return { u, d };
  }

  /* Build the inner markup (stack + ribbon + optional caption) for a state. */
  function innerHTML(state, showLabel) {
    const ud = resolveUD(state);

    /* Seat stack: top slots empty, bottom u slots still for sale (the cabin
       fills up from the bottom). */
    let seats = '';
    for (let row = 0; row < NUM_UNITS; row++) {
      const slotFromBottom = NUM_UNITS - row;        // NUM_UNITS..1
      const live = slotFromBottom <= ud.u;
      seats += '<div class="shelf-slot">' + seatSVG(live) + '</div>';
    }

    /* Departure board: lit day tiles for days still to go; elapsed days are
       flipped dim; the last tile is the departing plane (GATE CLOSED). */
    const board = boardHTML(ud, !!(state.terminal && state.deadline));

    return (
      '<div class="shelf-body">' +
        '<div class="shelf-stack" role="img" aria-label="' + ud.u + ' seats left">' + seats + '</div>' +
        '<div class="shelf-ribbon">' + board + '</div>' +
      '</div>' +
      (showLabel ? '<div class="shelf-caption">' + captionFor(state) + '</div>' : '')
    );
  }

  /* Apply the frame classes (size, terminal, lever tint) to a card element. */
  function applyFrame(card, state, size, lever) {
    card.className = 'shelf-card shelf-' + size +
      (state.terminal ? ' is-terminal' + (state.soldout ? ' is-soldout' : ' is-midnight') : '');
    if (lever) card.setAttribute('data-lever', lever);
    else card.removeAttribute('data-lever');
  }

  function render(state, opts) {
    state = state || {};
    opts = opts || {};
    const size = normSize(opts.size);
    /* 'mini' never carries a caption (it lives in a packed Q-cell). */
    const showLabel = size === 'mini' ? false : (opts.label !== false);

    const card = document.createElement('div');
    applyFrame(card, state, size, opts.lever);
    card.innerHTML = innerHTML(state, showLabel);
    return card;
  }

  /* Mount a live, re-settable shelf card into `host`. */
  function mount(host, opts) {
    opts = opts || {};
    const size = normSize(opts.size);
    const showLabel = size === 'mini' ? false : (opts.label !== false);
    let lever = opts.lever || null;
    /* Seed state: explicit {u,d} on opts, else terminal flags, else 0/0. */
    let state = (opts.state) ? opts.state
              : { u: (opts.u != null ? opts.u : 0), d: (opts.d != null ? opts.d : 0) };

    const card = render(state, { size: size, label: showLabel ? undefined : false, lever: lever });
    if (host) { host.appendChild(card); }

    function setState(next) {
      const prevUD = resolveUD(state || {});
      state = next || {};
      const nextUD = resolveUD(state);
      applyFrame(card, state, size, lever);
      card.innerHTML = innerHTML(state, showLabel);
      /* If a day just elapsed, flip the tile that passed (the highest
         newly-elapsed cell) on the departure board. */
      const prevElapsed = Math.max(0, NUM_DAYS - prevUD.d);
      const newElapsed  = Math.max(0, NUM_DAYS - nextUD.d);
      if (newElapsed > prevElapsed) {
        const cell = card.querySelector('.cal-cell[data-day="' + newElapsed + '"]');
        if (cell) cell.classList.add('is-stamping');
      }
    }
    function set(u, d) { setState({ u: u, d: d }); }
    function setLever(id) { lever = id || null; applyFrame(card, state, size, lever); }

    return { set, setState, setLever, el: function () { return card; }, size: size };
  }

  function fromIndex(i, opts) {
    const P = window.Pricing;
    if (!P) return render({}, opts);
    const s = P.stateFromIndex(i);
    return render(s || {}, opts);
  }

  window.ShelfCard = {
    render, mount, fromIndex, NUM_UNITS, NUM_DAYS,
    seatSVG, planeSVG, boardHTML,
    /* legacy aliases (same functions, old names) */
    ticketSVG, pipSVG, xSVG, moonSVG, calendarHTML,
  };
})();

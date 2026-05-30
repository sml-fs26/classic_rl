/* shelfCard.js -- the recurring STATE-ICON for Last-Minute Pricing.
 *
 *   A "shelf card" renders one MDP state s = (units left u, days-to-deadline d)
 *   so the learner builds one mental picture across every scene: HOW MUCH
 *   STOCK, HOW MUCH TIME. It is the pricing analogue of the Pokemon HP-bar
 *   sprite pair, and it replaces js/hpbar.js + js/sprite.js.
 *
 *   Composition:
 *     - a vertical STACK of NUM_UNITS ticket slots; the bottom u are live
 *       (bright gold), the rest are sold/empty (greyed). Tickets are the
 *       perishable thing, drawn as inline-SVG pixel tickets (no PNG).
 *     - a COUNTDOWN RIBBON of NUM_DAYS day-pips; the leftmost d are still on
 *       the clock (lit), the rest are spent (dim). The deadline is MIDNIGHT.
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

  /* A single pixel ticket as inline SVG. `filled` picks the live vs sold
     token set. Geometry: a stub-edged admission ticket with two notches. */
  function ticketSVG(filled) {
    const fill = filled ? 'var(--ticket-fill)' : 'var(--ticket-gone)';
    const edge = filled ? 'var(--ticket-edge)' : 'var(--ticket-gone-edge)';
    const cls = 'shelf-ticket' + (filled ? ' is-live' : ' is-gone');
    return (
      '<svg class="' + cls + '" viewBox="0 0 48 20" preserveAspectRatio="none" aria-hidden="true">' +
        '<rect x="1" y="1" width="46" height="18" fill="' + fill + '" stroke="' + edge + '" stroke-width="2"/>' +
        /* perforation line */
        '<line x1="34" y1="2" x2="34" y2="18" stroke="' + edge + '" stroke-width="1.5" stroke-dasharray="2 2"/>' +
        /* two notches */
        '<circle cx="34" cy="1" r="2.4" fill="var(--bg)"/>' +
        '<circle cx="34" cy="19" r="2.4" fill="var(--bg)"/>' +
      '</svg>'
    );
  }

  /* One day-pip (a calendar tear-off square). */
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

    /* Ticket stack: top slots empty, bottom u slots live (a shelf fills up
       from the bottom). */
    let tickets = '';
    for (let row = 0; row < NUM_UNITS; row++) {
      const slotFromBottom = NUM_UNITS - row;        // NUM_UNITS..1
      const live = slotFromBottom <= ud.u;
      tickets += '<div class="shelf-slot">' + ticketSVG(live) + '</div>';
    }

    /* Day ribbon: NUM_DAYS pips, leftmost d lit. */
    let pips = '';
    for (let i = 0; i < NUM_DAYS; i++) pips += pipSVG(i < ud.d);

    return (
      '<div class="shelf-body">' +
        '<div class="shelf-stack" role="img" aria-label="' + ud.u + ' units left">' + tickets + '</div>' +
        '<div class="shelf-ribbon" role="img" aria-label="' + ud.d + ' days left">' +
          '<div class="shelf-pips">' + pips + '</div>' +
          '<div class="shelf-midnight" aria-hidden="true"></div>' +
        '</div>' +
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
      state = next || {};
      applyFrame(card, state, size, lever);
      card.innerHTML = innerHTML(state, showLabel);
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

  window.ShelfCard = { render, mount, fromIndex, ticketSVG, pipSVG, NUM_UNITS, NUM_DAYS };
})();

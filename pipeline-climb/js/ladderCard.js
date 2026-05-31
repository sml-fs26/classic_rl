/* The recurring STATE-ICON: a thermometer-on-a-ladder.
 *
 *   Five stacked rungs (READY at the top, COLD at the bottom), the lead
 *   avatar (a small contact-card silhouette) sitting on its current rung,
 *   and a warmth bar filling cold-blue -> orange -> hot-red up the ladder.
 *   SIGNED renders a green stamped contract; LOST renders a greyed,
 *   struck-through card sliding off the bottom.
 *
 *   Pure CSS / inline-SVG, no asset. The same glyph is meant to recur
 *   everywhere a "state" appears (trajectory boxes, atop the Q* table,
 *   on each Q-cell) so the learner builds exactly one mental picture.
 *
 *   Colours come from CSS tokens (.lc-warm-* / .lc-rung-*), never inline,
 *   so both themes (light paper / crt neon) restyle it.
 *
 *   API:
 *     LadderCard.mount(host, opts) -> { setState, host }
 *       opts.size    'sm' | 'md' | 'lg'   (default 'md')
 *       opts.compact boolean             (drop rung labels)
 *     ctrl.setState(state)
 *       state = { rung: 0..4, terminal:false }  living lead
 *             | { terminal:true, signed:true }  SIGNED
 *             | { terminal:true, lost:true }     LOST
 */
(function () {
  const NUM_RUNGS = (window.Pipeline && window.Pipeline.NUM_RUNGS) || 5;
  const RUNG_DISPLAY = (window.Pipeline && window.Pipeline.RUNG_DISPLAY) ||
    ['COLD', 'CURIOUS', 'ENGAGED', 'EVALUATING', 'READY'];

  function T(key, fallback) {
    if (window.I18N) { const s = window.I18N.t(key); if (s && s !== key) return s; }
    return fallback;
  }
  function rungLabel(i) {
    const keys = ['rung.cold', 'rung.curious', 'rung.engaged', 'rung.evaluating', 'rung.ready'];
    return T(keys[i], RUNG_DISPLAY[i]);
  }

  /* Small contact-card silhouette (the lead avatar), currentColor-driven. */
  function avatarSvg() {
    return '<svg class="lc-avatar-svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
      '<circle cx="8" cy="5" r="3" fill="currentColor"/>' +
      '<path d="M2.5 14 C2.5 10.5, 5 9, 8 9 C11 9, 13.5 10.5, 13.5 14 Z" fill="currentColor"/></svg>';
  }
  /* Green stamped contract (SIGNED). */
  function contractSvg() {
    return '<svg class="lc-contract-svg" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">' +
      '<rect x="4" y="2" width="16" height="20" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<line x1="7" y1="6" x2="17" y2="6" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="1.2"/>' +
      '<circle cx="16" cy="17" r="4" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
      '<path d="M14 17 l1.5 1.6 l3 -3.4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  }
  /* Greyed struck-through card (LOST). */
  function lostCardSvg() {
    return '<svg class="lc-lost-svg" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">' +
      '<rect x="4" y="5" width="16" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<circle cx="9" cy="10" r="2" fill="currentColor"/>' +
      '<line x1="13" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2"/></svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('ladder-card', 'lc-size-' + (o.size || 'md'));
    if (o.compact) host.classList.add('lc-compact');
    host.innerHTML = '';

    /* The ladder: rung 0 (COLD) at the bottom, so render top-down READY..COLD. */
    const ladder = document.createElement('div');
    ladder.className = 'lc-ladder';

    const rungNodes = [];
    for (let display = NUM_RUNGS - 1; display >= 0; display--) {
      const rung = document.createElement('div');
      rung.className = 'lc-rung lc-warm-' + display;   // warmth token by height
      rung.dataset.rung = String(display);
      rung.innerHTML =
        '<span class="lc-rung-bar"></span>' +
        (o.compact ? '' : '<span class="lc-rung-label">' + rungLabel(display) + '</span>') +
        '<span class="lc-rung-seat"></span>';
      ladder.appendChild(rung);
      rungNodes[display] = rung;
    }
    host.appendChild(ladder);

    /* The terminal overlay (SIGNED / LOST), hidden until a terminal state. */
    const terminalLayer = document.createElement('div');
    terminalLayer.className = 'lc-terminal';
    terminalLayer.hidden = true;
    host.appendChild(terminalLayer);

    function clearAvatar() {
      for (let i = 0; i < NUM_RUNGS; i++) {
        const seat = rungNodes[i].querySelector('.lc-rung-seat');
        seat.innerHTML = '';
        rungNodes[i].classList.remove('lc-current');
      }
    }

    function setState(state) {
      if (!state) return;
      if (state.terminal) {
        ladder.classList.add('lc-dim');
        terminalLayer.hidden = false;
        if (state.signed) {
          terminalLayer.className = 'lc-terminal lc-signed';
          terminalLayer.innerHTML = contractSvg() +
            '<span class="lc-terminal-label">' + T('vocab.signed', 'SIGNED') + '</span>';
        } else {
          terminalLayer.className = 'lc-terminal lc-lost';
          terminalLayer.innerHTML = lostCardSvg() +
            '<span class="lc-terminal-label">' + T('vocab.lost', 'LOST') + '</span>';
        }
        clearAvatar();
        return;
      }
      /* Living lead on a rung. */
      ladder.classList.remove('lc-dim');
      terminalLayer.hidden = true;
      clearAvatar();
      const r = Math.max(0, Math.min(NUM_RUNGS - 1, state.rung | 0));
      const seat = rungNodes[r].querySelector('.lc-rung-seat');
      seat.innerHTML = '<span class="lc-avatar">' + avatarSvg() + '</span>';
      rungNodes[r].classList.add('lc-current');
      ladder.dataset.current = String(r);
    }

    return { setState, host, rungNodes };
  }

  window.LadderCard = { mount };
})();

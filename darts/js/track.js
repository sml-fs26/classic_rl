/* Horizontal track widget, used as both the "truth track" (with the
   bullseye visible) and the "belief track" (with the running estimate as
   a marker) across scenes 1 to 4.

   The track is a horizontal pill from position 0 to 100. Scenes mount one
   or two stacked tracks; each track exposes setPlayer, setBullseye,
   setEstimate, addChip, clearChips. Theme-aware via CSS classes only, 
   never inline color. */
(function () {

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  /* Mount one horizontal track. opts:
       host, DOM node to fill
       label, (string) shown above the track
       showBullseye, bool; if false, bullseye marker stays hidden
       showEstimate, bool; if true, an estimate caret is rendered
       showChips, bool; if true, history chips render below the rail
       traceClasses, array of class strings; one trace marker per class
                        is rendered for the multi-estimate scene */
  function mount(opts) {
    const host = opts.host;
    const label = opts.label || '';
    const showBullseye = opts.showBullseye !== false;
    const showEstimate = !!opts.showEstimate;
    const showChips = opts.showChips !== false;
    const showPlayer = opts.showPlayer !== false;
    const chipLabelLast = (typeof opts.chipLabelLast === 'number') ? opts.chipLabelLast : 99;
    const traceClasses = Array.isArray(opts.traceClasses) ? opts.traceClasses : null;

    host.innerHTML = '';
    host.classList.add('track-host');

    if (label) {
      const lbl = document.createElement('div');
      lbl.className = 'track-label';
      lbl.textContent = label;
      host.appendChild(lbl);
    }

    const rail = document.createElement('div');
    rail.className = 'track-rail';
    host.appendChild(rail);

    /* Tick marks at 0/25/50/75/100. */
    const ticks = document.createElement('div');
    ticks.className = 'track-ticks';
    for (const t of [0, 25, 50, 75, 100]) {
      const tk = document.createElement('div');
      tk.className = 'track-tick';
      tk.style.left = `${t}%`;
      const lbl = document.createElement('span');
      lbl.className = 'track-tick-label';
      lbl.textContent = String(t);
      tk.appendChild(lbl);
      ticks.appendChild(tk);
    }
    rail.appendChild(ticks);

    /* Chip layer for past throws. */
    const chipLayer = document.createElement('div');
    chipLayer.className = 'track-chip-layer';
    if (!showChips) chipLayer.style.display = 'none';
    rail.appendChild(chipLayer);

    /* Bullseye marker, hidden if showBullseye is false. */
    const bullseye = document.createElement('div');
    bullseye.className = 'track-bullseye' + (showBullseye ? '' : ' track-bullseye-hidden');
    bullseye.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<circle cx="12" cy="12" r="6"  fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<circle cx="12" cy="12" r="2.4" fill="currentColor"/>' +
      '</svg>';
    rail.appendChild(bullseye);

    /* Player marker. */
    const player = document.createElement('div');
    player.className = 'track-player';
    if (!showPlayer) player.style.display = 'none';
    player.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9" fill="currentColor"/>' +
        '<circle cx="12" cy="12" r="3" fill="var(--card-bg)"/>' +
      '</svg>';
    rail.appendChild(player);

    /* Optional estimate carets. If `traceClasses` is provided, render one
       caret per class (used by scene 4); otherwise render a single
       estimate caret (scenes 2, 3). */
    let estimateCarets = [];
    if (showEstimate) {
      const list = traceClasses ? traceClasses : [null];
      for (const cls of list) {
        const caret = document.createElement('div');
        caret.className = 'track-estimate' + (cls ? ' ' + cls : '');
        caret.innerHTML =
          '<svg viewBox="0 0 16 24" aria-hidden="true">' +
            '<path d="M8 0 L16 14 L8 11 L0 14 Z" fill="currentColor"/>' +
          '</svg>';
        caret.style.display = 'none';   // hidden until first setEstimate
        rail.appendChild(caret);
        estimateCarets.push(caret);
      }
    }

    function setPlayer(pos) {
      player.style.left = `${clamp(pos, 0, 100)}%`;
    }

    function setBullseye(pos) {
      bullseye.style.left = `${clamp(pos, 0, 100)}%`;
    }

    function setEstimate(pos, idx) {
      const i = (typeof idx === 'number') ? idx : 0;
      const caret = estimateCarets[i];
      if (!caret) return;
      caret.style.left = `${clamp(pos, 0, 100)}%`;
      caret.style.display = '';
    }

    /* Add a chip for a past throw. opts: { pos, score?, maxChips? }. */
    function addChip(o) {
      if (!showChips) return;
      const chip = document.createElement('div');
      chip.className = 'track-chip';
      chip.style.left = `${clamp(o.pos, 0, 100)}%`;
      if (typeof o.score === 'number') {
        const lbl = document.createElement('span');
        lbl.className = 'track-chip-label';
        lbl.textContent = String(Math.round(o.score));
        chip.appendChild(lbl);
      }
      chipLayer.appendChild(chip);
      /* Cap chip count, drop old ones to keep the track readable. */
      const all = chipLayer.querySelectorAll('.track-chip');
      const keep = (typeof o.maxChips === 'number') ? o.maxChips : 12;
      if (all.length > keep) {
        for (let i = 0; i < all.length - keep; i++) all[i].remove();
      }
      /* Only the last `chipLabelLast` chips show their score label, 
         labels collide otherwise when chips cluster. */
      const remaining = chipLayer.querySelectorAll('.track-chip');
      const cutoff = Math.max(0, remaining.length - chipLabelLast);
      remaining.forEach((c, i) => {
        const labelEl = c.querySelector('.track-chip-label');
        if (labelEl) labelEl.style.display = (i < cutoff) ? 'none' : '';
      });
    }

    function clearChips() { chipLayer.innerHTML = ''; }

    function flashPlayer() {
      player.classList.remove('flash');
      void player.offsetWidth;
      player.classList.add('flash');
    }

    return {
      setPlayer, setBullseye, setEstimate,
      addChip, clearChips,
      flashPlayer,
      el: host,
    };
  }

  window.Track = { mount };
})();

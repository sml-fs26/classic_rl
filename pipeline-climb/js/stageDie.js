/* The signature animation: the STAGE DIE.
 *
 *   A 3-faced token that flips and lands on one face:
 *     UP   -> green up-arrow   (the lead warmed a rung)
 *     STAY -> grey equals      (no change)
 *     DOWN -> red down-arrow   (the lead cooled a rung)
 *
 *   Special landings (driven by the `log` from Pipeline.sample):
 *     - COLD + DOWN: the token cracks and the lead's card slides to LOST.
 *     - READY + HARD CLOSE success (UP face -> SIGNED): the contract is
 *       stamped green with a confetti burst.
 *
 *   Reward chips float up after the roll: a small -1 time chip on every
 *   touch, a big +30 signature on SIGNED, a big -10 churn on LOST.
 *
 *   Pure CSS / inline-SVG; colours come from CSS tokens so both themes
 *   restyle it. The faces are spans the CSS rotates; this module just
 *   sets the data-face and fires the chips.
 *
 *   API:
 *     StageDie.mount(host) -> { roll, host }
 *     ctrl.roll(log, opts) -> Promise   // resolves when the land settles
 *       log  = the { face, fromRung, signed, lost, lever } from sample()
 *       opts.reward   number to float as a chip (default by terminal/touch)
 *       opts.instant  skip the flip animation (headless capture)
 */
(function () {
  const COLD = (window.Pipeline && window.Pipeline.COLD) || 0;

  function T(key, fallback) {
    if (window.I18N) { const s = window.I18N.t(key); if (s && s !== key) return s; }
    return fallback;
  }

  function faceArrowSvg(face) {
    if (face === 'up') {
      return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">' +
        '<path d="M12 4 L20 14 L14 14 L14 20 L10 20 L10 14 L4 14 Z" fill="currentColor"/></svg>';
    }
    if (face === 'down') {
      return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">' +
        '<path d="M12 20 L4 10 L10 10 L10 4 L14 4 L14 10 L20 10 Z" fill="currentColor"/></svg>';
    }
    /* stay = equals */
    return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">' +
      '<rect x="5" y="9"  width="14" height="2.6" fill="currentColor"/>' +
      '<rect x="5" y="13" width="14" height="2.6" fill="currentColor"/></svg>';
  }
  function faceLabel(face) {
    if (face === 'up')   return T('die.up', 'UP');
    if (face === 'down') return T('die.down', 'DOWN');
    return T('die.stay', 'STAY');
  }

  function mount(host) {
    host.classList.add('stage-die');
    host.innerHTML =
      '<div class="sd-token" data-face="stay">' +
        '<span class="sd-face sd-face-up">'   + faceArrowSvg('up')   + '<span class="sd-face-label">' + faceLabel('up')   + '</span></span>' +
        '<span class="sd-face sd-face-stay">' + faceArrowSvg('stay') + '<span class="sd-face-label">' + faceLabel('stay') + '</span></span>' +
        '<span class="sd-face sd-face-down">' + faceArrowSvg('down') + '<span class="sd-face-label">' + faceLabel('down') + '</span></span>' +
      '</div>' +
      '<div class="sd-chips" aria-hidden="true"></div>';

    const token = host.querySelector('.sd-token');
    const chips = host.querySelector('.sd-chips');

    function floatChip(reward) {
      if (reward == null) return;
      const chip = document.createElement('div');
      const sign = reward >= 0 ? '+' : '';
      let cls = 'sd-chip';
      if (reward >= 30) cls += ' sd-chip-signed';
      else if (reward <= -10) cls += ' sd-chip-churn';
      else cls += (reward >= 0 ? ' sd-chip-pos' : ' sd-chip-time');
      chip.className = cls;
      chip.textContent = sign + reward;
      chips.appendChild(chip);
      setTimeout(() => { try { chips.removeChild(chip); } catch (_e) {} }, 1400);
    }

    function roll(log, opts) {
      const o = opts || {};
      const face = (log && log.face) || 'stay';
      const crack = !!(log && log.lost && log.fromRung === COLD);
      const stamp = !!(log && log.signed);

      /* Reset any prior land state. */
      token.classList.remove('sd-cracked', 'sd-stamped', 'sd-rolling');
      void token.offsetWidth;

      const settle = () => {
        token.dataset.face = face;
        if (crack)  token.classList.add('sd-cracked');
        if (stamp)  token.classList.add('sd-stamped');
        const reward = (o.reward != null)
          ? o.reward
          : (stamp ? (window.Pipeline ? window.Pipeline.SIGNED_REWARD : 30)
             : crack ? (window.Pipeline ? window.Pipeline.LOST_REWARD : -10)
             : (window.Pipeline ? window.Pipeline.TOUCH_REWARD : -1));
        floatChip(reward);
        if (window.SFX) {
          try { window.SFX.play(stamp ? 'thunder' : (crack ? 'quick' : 'cursor')); } catch (_e) {}
        }
      };

      if (o.instant) { settle(); return Promise.resolve(); }

      token.classList.add('sd-rolling');
      return new Promise((resolve) => {
        setTimeout(() => {
          token.classList.remove('sd-rolling');
          settle();
          resolve();
        }, 620);
      });
    }

    return { roll, host };
  }

  window.StageDie = { mount };
})();

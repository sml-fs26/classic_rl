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
 *   Respects prefers-reduced-motion: the flip and confetti are skipped and
 *   the token settles immediately (the Promise still resolves), so the
 *   reduced-motion path matches the &instant headless path.
 *
 *   API:
 *     StageDie.mount(host) -> { roll, host }
 *     ctrl.roll(arg, opts) -> Promise   // resolves when the land settles
 *       arg  = either the rich { face, fromRung, signed, lost, lever } log
 *              from Pipeline.sample(), OR a bare face string
 *              'up' | 'stay' | 'down' (the minimal roll(face) contract).
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
      '<div class="sd-confetti" aria-hidden="true"></div>' +
      '<div class="sd-chips" aria-hidden="true"></div>';

    const token = host.querySelector('.sd-token');
    const chips = host.querySelector('.sd-chips');
    const confettiLayer = host.querySelector('.sd-confetti');

    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* A short confetti burst over the token when the READY hard-close
       stamps the contract. Pure DOM nodes the CSS animates; tinted by
       lever / signed tokens, never inline colours. Skipped when the user
       prefers reduced motion. */
    function burstConfetti() {
      if (reduceMotion) return;
      const N = 12;
      for (let i = 0; i < N; i++) {
        const bit = document.createElement('span');
        bit.className = 'sd-confetti-bit sd-confetti-c' + (i % 3);
        /* Spread + travel are CSS custom props so colours stay tokenised. */
        bit.style.setProperty('--dx', (Math.round((i / (N - 1) - 0.5) * 64)) + 'px');
        bit.style.setProperty('--dy', (-26 - (i * 37 % 22)) + 'px');
        bit.style.setProperty('--rot', ((i * 53 % 360)) + 'deg');
        confettiLayer.appendChild(bit);
        setTimeout(() => { try { confettiLayer.removeChild(bit); } catch (_e) {} }, 1200);
      }
    }

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

    function roll(arg, opts) {
      const o = opts || {};
      /* Accept either the rich sample() log or a bare face string. */
      const log = (typeof arg === 'string') ? { face: arg } : (arg || {});
      const face = log.face || 'stay';
      const crack = !!(log.lost && log.fromRung === COLD);
      const stamp = !!log.signed;

      /* Reset any prior land state. */
      token.classList.remove('sd-cracked', 'sd-stamped', 'sd-rolling');
      void token.offsetWidth;

      const settle = () => {
        token.dataset.face = face;
        if (crack)  token.classList.add('sd-cracked');
        if (stamp)  { token.classList.add('sd-stamped'); burstConfetti(); }
        const reward = (o.reward != null)
          ? o.reward
          : (stamp ? (window.Pipeline ? window.Pipeline.SIGNED_REWARD : 30)
             : crack ? (window.Pipeline ? window.Pipeline.LOST_REWARD : -10)
             : (window.Pipeline ? window.Pipeline.TOUCH_REWARD : -1));
        floatChip(reward);
        if (window.SFX) {
          /* SIGNED -> the win arpeggio; LOST -> the loss cadence; else a pip. */
          try { window.SFX.play(stamp ? 'win' : (crack ? 'loss' : 'cursor')); } catch (_e) {}
        }
      };

      /* Headless capture or reduced motion: land at once, no spin. */
      if (o.instant || reduceMotion) { settle(); return Promise.resolve(); }

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

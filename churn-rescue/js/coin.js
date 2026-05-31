/* The RETENTION COIN: spins and lands STAY / CHURN with a thunk.
 *
 *   The first of the two visible dice. P(STAY | tier, lever) weights the
 *   coin; on CHURN the linked account card greys and slides off ("lost").
 *   This module owns the coin widget and its flip animation; scenes call it
 *   in strict sequence with the engagement die (COIN then DIE).
 *
 *   API (mount-based, the foundation-pinned shape):
 *     Coin.mount(host, { card? }) -> {
 *       flip(result, onDone)  result is a boolean (stayBool) OR 'stay'/'churn'.
 *                             Spins, lands, fires onDone(stayBool), and
 *                             RETURNS A PROMISE that resolves to stayBool
 *                             after the animation. On CHURN, greys (and, if
 *                             a card was linked, slides it off).
 *       set(result)           set the face with no animation
 *       card(api)             link / relink an AccountCard instance
 *       el                    the host element
 *     }
 *
 *   Reduced motion: the spin is skipped, the face is set immediately, and
 *   the returned Promise resolves on the next microtask. Respect
 *   prefers-reduced-motion so lecture-room capture stays still.
 */
(function () {
  const SPIN_MS = 650;

  function T(key) { return window.I18N ? window.I18N.t(key) : key; }
  function reduced() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function toStayBool(result) {
    if (typeof result === 'boolean') return result;
    return result === 'stay' || result === true;
  }

  /* Two coin faces: STAY shows a check, CHURN shows a cross. Both inline
     SVG, currentColor so the result colour comes from the .is-stay /
     .is-churn tokens. The spin swaps which face shows at the midpoint. */
  function faceSvg(kind) {
    const ring =
      '<circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
      '<circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="1.2"/>';
    if (kind === 'stay') {
      return '<svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">' + ring +
        '<path d="M12 21 L18 27 L29 14" fill="none" stroke="currentColor" ' +
        'stroke-width="3.2" stroke-linecap="square"/></svg>';
    }
    if (kind === 'churn') {
      return '<svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">' + ring +
        '<path d="M13 13 L27 27 M27 13 L13 27" fill="none" stroke="currentColor" ' +
        'stroke-width="3.2" stroke-linecap="square"/></svg>';
    }
    /* idle / unresolved */
    return '<svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">' + ring +
      '<circle cx="20" cy="20" r="2.6" fill="currentColor"/></svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('retention-coin');
    host.innerHTML =
      '<div class="coin-face">' + faceSvg('idle') + '</div>' +
      '<div class="coin-result"></div>';
    const faceEl = host.querySelector('.coin-face');
    const resEl = host.querySelector('.coin-result');
    let linkedCard = o.card || null;

    function paint(stay) {
      host.classList.toggle('is-stay', stay);
      host.classList.toggle('is-churn', !stay);
      faceEl.innerHTML = faceSvg(stay ? 'stay' : 'churn');
      resEl.textContent = T(stay ? 'coin.stay' : 'coin.churn');
    }

    function set(result) {
      host.classList.remove('spinning');
      paint(toStayBool(result));
    }

    function flip(result, onDone) {
      const stay = toStayBool(result);
      return new Promise((resolve) => {
        const finish = () => {
          host.classList.remove('spinning');
          paint(stay);
          /* Thunk on landing: a pop for STAY, the same percussive pip for
             CHURN (sfx has no dedicated churn cue). */
          if (window.SFX) window.SFX.play(stay ? 'cursor' : 'hit');
          if (!stay && linkedCard) {
            if (typeof linkedCard.slideOff === 'function') {
              linkedCard.slideOff();
            } else if (typeof linkedCard.grey === 'function') {
              linkedCard.grey();
            }
          }
          if (typeof onDone === 'function') onDone(stay);
          resolve(stay);
        };

        if (reduced()) { finish(); return; }

        host.classList.remove('spinning', 'is-stay', 'is-churn');
        faceEl.innerHTML = faceSvg('idle');
        resEl.textContent = '';
        void host.offsetWidth;
        host.classList.add('spinning');
        if (window.SFX) window.SFX.play('cursor');
        let settled = false;
        const onEnd = () => {
          if (settled) return;
          settled = true;
          faceEl.removeEventListener('animationend', onEnd);
          finish();
        };
        faceEl.addEventListener('animationend', onEnd);
        /* Belt-and-braces timeout in case animationend never fires (e.g.
           the element is display:none during a headless capture). */
        setTimeout(onEnd, SPIN_MS + 120);
      });
    }

    function card(api) { linkedCard = api; }

    return { flip, set, card, el: host };
  }

  window.Coin = { mount };
})();

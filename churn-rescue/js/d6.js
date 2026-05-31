/* The ENGAGEMENT DIE (a d6): tumbles, then the engagement bar ticks the
   tier up / same / down a segment.
 *
 *   The second of the two visible dice, rolled only on STAY. Faces map to
 *   up / same / down (the tier nudge for next month). DO NOTHING sags,
 *   CHECK-IN climbs (the growth lever), BIG OFFER is a modest stay-spike.
 *   Animate strictly AFTER the retention coin resolves (COIN then DIE).
 *
 *   API (mount-based, the foundation-pinned shape):
 *     D6.mount(host, { card? }) -> {
 *       roll(face, onDone, toTier)
 *           face is 'up' | 'same' | 'down'. Tumbles, lands on the face,
 *           fires onDone(face), and RETURNS A PROMISE that resolves to face
 *           after the animation. If a card is linked and toTier is given (or
 *           inferable from the linked card + face), the engagement bar ticks
 *           one segment toward toTier as the die lands.
 *       set(face)       set the face with no animation
 *       card(api)       link / relink an AccountCard instance
 *       el              the host element
 *     }
 *
 *   Reduced motion: the tumble is skipped, the face + bar tick apply
 *   immediately, and the Promise resolves on the next microtask.
 */
(function () {
  const TUMBLE_MS = 600;
  const ARROW = { up: '▲', same: '■', down: '▼' };  /* up sq down */

  function T(key) { return window.I18N ? window.I18N.t(key) : key; }
  function reduced() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function clampTier(t) {
    const max = (window.Churn && window.Churn.NUM_TIERS ? window.Churn.NUM_TIERS : 5) - 1;
    return t < 0 ? 0 : (t > max ? max : t);
  }

  /* Cube face whose pip count reads as the direction: a single up-chevron,
     a flat bar, or a down-chevron inside the die outline. */
  function cubeSvg(face) {
    const box =
      '<rect x="5" y="5" width="30" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="2.4"/>';
    let inner;
    if (face === 'up') {
      inner = '<path d="M12 24 L20 14 L28 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>';
    } else if (face === 'down') {
      inner = '<path d="M12 16 L20 26 L28 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>';
    } else if (face === 'same') {
      inner = '<rect x="12" y="18" width="16" height="4" fill="currentColor"/>';
    } else {
      inner = '<circle cx="20" cy="20" r="2.6" fill="currentColor"/>';
    }
    return '<svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">' + box + inner + '</svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('engagement-die');
    host.innerHTML =
      '<div class="die-face">' + cubeSvg('idle') + '</div>' +
      '<div class="die-result"></div>';
    const faceEl = host.querySelector('.die-face');
    const resEl = host.querySelector('.die-result');
    let linkedCard = o.card || null;

    function paint(face) {
      host.classList.remove('face-up', 'face-same', 'face-down');
      host.classList.add('face-' + face);
      faceEl.innerHTML = cubeSvg(face);
      resEl.textContent = (ARROW[face] || '') + ' ' + T('die.' + face);
    }

    function set(face) {
      host.classList.remove('tumbling');
      paint(face);
    }

    /* Resolve the destination tier for the bar tick: explicit toTier wins;
       otherwise nudge the linked card's current tier by the face. */
    function destTier(face, toTier) {
      if (toTier != null) return clampTier(toTier);
      if (linkedCard && typeof linkedCard.state === 'function') {
        const cur = linkedCard.state().tier;
        const dt = face === 'up' ? 1 : (face === 'down' ? -1 : 0);
        return clampTier(cur + dt);
      }
      return null;
    }

    function roll(face, onDone, toTier) {
      return new Promise((resolve) => {
        const dest = destTier(face, toTier);
        const finish = () => {
          host.classList.remove('tumbling');
          paint(face);
          if (window.SFX) window.SFX.play('cursor');
          if (linkedCard && typeof linkedCard.tickTier === 'function' && dest != null) {
            linkedCard.tickTier(dest);
          }
          if (typeof onDone === 'function') onDone(face);
          resolve(face);
        };

        if (reduced()) { finish(); return; }

        host.classList.remove('tumbling');
        faceEl.innerHTML = cubeSvg('idle');
        resEl.textContent = '';
        void host.offsetWidth;
        host.classList.add('tumbling');
        if (window.SFX) window.SFX.play('cursor');
        let settled = false;
        const onEnd = () => {
          if (settled) return;
          settled = true;
          faceEl.removeEventListener('animationend', onEnd);
          finish();
        };
        faceEl.addEventListener('animationend', onEnd);
        setTimeout(onEnd, TUMBLE_MS + 120);
      });
    }

    function card(api) { linkedCard = api; }

    return { roll, set, card, el: host };
  }

  window.D6 = { mount };
})();

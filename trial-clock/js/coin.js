/* The ADOPTION COIN: an ONBOARD NUDGE flips it. HEADS (1/2) the user adopts the
   next feature (tier +1); TAILS (1/2) it does not land and they stay put. Either
   way a day burns. It wears a "1/2 ADOPT" badge so the bias is printed on its
   face. Scenes call flip() in sequence with the Trial Card update.

   API (mount-based, mirrors the sibling cartridges' coin):
     Coin.mount(host, { badge? }) -> {
       flip(heads, onDone)   heads is a boolean (true = the feature lands).
                             Spins, lands, fires onDone(heads), RETURNS A
                             PROMISE resolving to heads after the animation.
       set(heads)            set the face with no animation
       setBadge(text)        change the badge text
       el                    the host element
     }

   Reduced motion: the spin is skipped, the face is set immediately, and the
   Promise resolves on the next microtask, so lecture-room / headless capture
   stays still. */
(function () {
  const SPIN_MS = 620;

  function T(key) { return window.I18N ? window.I18N.t(key) : key; }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Two coin faces as inline SVG; currentColor so the result colour comes from
     the .is-heads / .is-tails tokens. HEADS shows a climbing arrow (+1 feature),
     TAILS a flat dash (stayed put). */
  function faceSvg(kind) {
    const ring =
      '<circle cx="24" cy="24" r="22" fill="var(--coin-face)" stroke="currentColor" stroke-width="2.6"/>' +
      '<circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" stroke-width="1.3"/>';
    if (kind === 'heads') {
      return '<svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">' + ring +
        '<path d="M24 33 L24 16 M16 23 L24 15 L32 23" fill="none" stroke="currentColor" ' +
        'stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (kind === 'tails') {
      return '<svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">' + ring +
        '<path d="M15 24 L33 24" fill="none" stroke="currentColor" ' +
        'stroke-width="3.4" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">' + ring +
      '<text x="24" y="32" text-anchor="middle" font-size="20" font-family="Georgia,serif" ' +
      'fill="currentColor">+1</text></svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('adopt-coin');
    host.innerHTML =
      '<div class="coin-disc">' +
        '<div class="coin-face">' + faceSvg('idle') + '</div>' +
        '<div class="coin-badge">' + (o.badge || T('coin.badge')) + '</div>' +
      '</div>' +
      '<div class="coin-result"></div>';
    const discEl = host.querySelector('.coin-disc');
    const faceEl = host.querySelector('.coin-face');
    const badgeEl = host.querySelector('.coin-badge');
    const resEl = host.querySelector('.coin-result');

    function paint(heads) {
      host.classList.toggle('is-heads', heads);
      host.classList.toggle('is-tails', !heads);
      faceEl.innerHTML = faceSvg(heads ? 'heads' : 'tails');
      resEl.textContent = T(heads ? 'coin.heads' : 'coin.tails');
    }
    function set(heads) { discEl.classList.remove('spinning'); paint(!!heads); }
    function setBadge(text) { if (badgeEl) badgeEl.textContent = text; }

    function flip(heads, onDone) {
      heads = !!heads;
      return new Promise((resolve) => {
        const finish = () => {
          discEl.classList.remove('spinning');
          paint(heads);
          if (window.SFX) window.SFX.play(heads ? 'climb' : 'drop');
          if (typeof onDone === 'function') onDone(heads);
          resolve(heads);
        };
        if (reduced()) { finish(); return; }

        host.classList.remove('is-heads', 'is-tails');
        discEl.classList.remove('spinning');
        faceEl.innerHTML = faceSvg('idle');
        resEl.textContent = '';
        void discEl.offsetWidth;
        discEl.classList.add('spinning');
        if (window.SFX) window.SFX.play('coinflip');

        let settled = false;
        const onEnd = () => {
          if (settled) return;
          settled = true;
          discEl.removeEventListener('animationend', onEnd);
          finish();
        };
        discEl.addEventListener('animationend', onEnd);
        setTimeout(onEnd, SPIN_MS + 140);
      });
    }

    return { flip, set, setBadge, el: host };
  }

  window.Coin = { mount };
})();

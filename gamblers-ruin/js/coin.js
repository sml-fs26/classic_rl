/* The RIGGED COIN: spins and lands HEADS (win) or TAILS (loss), wearing a
   "40 / 60" odds badge so the bias is printed on its face. This is the single
   visible die of the Gambler's Ruin MDP. On HEADS the token climbs; on TAILS
   it slides down. Scenes call flip() in sequence with the ladder token move.

   API (mount-based):
     Coin.mount(host, { badge? }) -> {
       flip(win, onDone)   win is a boolean (true = HEADS/win). Spins, lands,
                           fires onDone(win), and RETURNS A PROMISE resolving
                           to win after the animation.
       set(win)            set the face with no animation
       setBadge(text)      change the odds badge text (e.g. when p changes)
       el                  the host element
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

  /* Two coin faces as inline SVG; currentColor so result colour comes from the
     .is-win / .is-loss tokens. HEADS shows an up-arrow $, TAILS a down-arrow. */
  function faceSvg(kind) {
    const ring =
      '<circle cx="24" cy="24" r="22" fill="var(--coin-face)" stroke="currentColor" stroke-width="2.6"/>' +
      '<circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" stroke-width="1.3"/>';
    if (kind === 'win') {
      return '<svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">' + ring +
        '<path d="M24 33 L24 16 M16 23 L24 15 L32 23" fill="none" stroke="currentColor" ' +
        'stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (kind === 'loss') {
      return '<svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">' + ring +
        '<path d="M24 15 L24 32 M16 25 L24 33 L32 25" fill="none" stroke="currentColor" ' +
        'stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    /* idle */
    return '<svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">' + ring +
      '<text x="24" y="31" text-anchor="middle" font-size="18" font-family="Georgia,serif" ' +
      'fill="currentColor">$</text></svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('rigged-coin');
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

    function paint(win) {
      host.classList.toggle('is-win', win);
      host.classList.toggle('is-loss', !win);
      faceEl.innerHTML = faceSvg(win ? 'win' : 'loss');
      resEl.textContent = T(win ? 'coin.win' : 'coin.loss');
    }
    function set(win) { discEl.classList.remove('spinning'); paint(!!win); }
    function setBadge(text) { if (badgeEl) badgeEl.textContent = text; }

    function flip(win, onDone) {
      win = !!win;
      return new Promise((resolve) => {
        const finish = () => {
          discEl.classList.remove('spinning');
          paint(win);
          if (window.SFX) window.SFX.play(win ? 'climb' : 'drop');
          if (typeof onDone === 'function') onDone(win);
          resolve(win);
        };
        if (reduced()) { finish(); return; }

        host.classList.remove('is-win', 'is-loss');
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
        /* Belt-and-braces: animationend may not fire if display:none during a
           headless capture. */
        setTimeout(onEnd, SPIN_MS + 140);
      });
    }

    return { flip, set, setBadge, el: host };
  }

  window.Coin = { mount };
})();

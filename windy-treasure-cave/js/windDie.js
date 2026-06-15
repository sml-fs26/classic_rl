/* The WIND DIE: a chunky pixel d10 that tumbles and lands on a face. Faces
   1-7 (p=0.7) = you go where you AIMED; 8-9 (p=0.15) = a gust shoves you to
   your LEFT; 10 (p=0.15) = a gust shoves you to your RIGHT. The bias is printed
   on its face (a 70/15/15 badge) so the odds are visible, this is the single
   visible die of the cave's MDP.

   API (mount-based):
     WindDie.mount(host, { badge? }) -> {
       roll(face, dir, onDone)   face = 1..10, dir = 'main'|'left'|'right'.
                                 Tumbles, lands, fires onDone(face, dir), and
                                 RETURNS A PROMISE resolving to {face, dir}.
       set(face, dir)            set the face with no animation
       setBadge(text)            change the odds badge text
       el                        the host element
     }

   Reduced motion: the tumble is skipped, the face is set immediately, and the
   Promise resolves on the next microtask (lecture-room / headless capture stays
   still). */
(function () {
  const SPIN_MS = 640;
  function T(key) { return window.I18N ? window.I18N.t(key) : key; }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function classFor(dir) { return dir === 'main' ? 'is-aim' : (dir === 'left' ? 'is-left' : 'is-right'); }
  function resultKey(dir) { return dir === 'main' ? 'die.aim' : (dir === 'left' ? 'die.left' : 'die.right'); }

  /* The d10 as a pixel-art kite (decahedron silhouette) with a numeral. */
  function dieSvg(face, dir) {
    const fill = dir === 'main' ? 'var(--die-aim)' : (dir === 'left' || dir === 'right') ? 'var(--die-gust)' : 'var(--die-face)';
    const num = (face == null) ? '' : String(face);
    return '<svg viewBox="0 0 48 52" width="56" height="60" aria-hidden="true">' +
      '<polygon points="24,2 44,18 38,40 24,50 10,40 4,18" fill="' + fill + '" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<polygon points="24,2 44,18 24,24 4,18" fill="rgba(255,255,255,0.18)" stroke="currentColor" stroke-width="1.1"/>' +
      '<line x1="24" y1="24" x2="24" y2="50" stroke="currentColor" stroke-width="1.1"/>' +
      '<line x1="4" y1="18" x2="24" y2="24" stroke="currentColor" stroke-width="1.1"/>' +
      '<line x1="44" y1="18" x2="24" y2="24" stroke="currentColor" stroke-width="1.1"/>' +
      '<text x="24" y="36" text-anchor="middle" font-family="\'Press Start 2P\', monospace" font-size="13" fill="var(--die-ink)">' + num + '</text>' +
      '</svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('wind-die');
    host.innerHTML =
      '<div class="wd-disc">' +
        '<div class="wd-face">' + dieSvg(null, 'idle') + '</div>' +
        '<div class="wd-badge">' + (o.badge || T('die.badge')) + '</div>' +
      '</div>' +
      '<div class="wd-result"></div>';
    const discEl = host.querySelector('.wd-disc');
    const faceEl = host.querySelector('.wd-face');
    const badgeEl = host.querySelector('.wd-badge');
    const resEl = host.querySelector('.wd-result');

    function paint(face, dir) {
      host.classList.remove('is-aim', 'is-left', 'is-right');
      host.classList.add(classFor(dir));
      faceEl.innerHTML = dieSvg(face, dir);
      resEl.textContent = T(resultKey(dir));
    }
    function set(face, dir) { discEl.classList.remove('rolling'); paint(face, dir); }
    function setBadge(text) { if (badgeEl) badgeEl.textContent = text; }

    function roll(face, dir, onDone) {
      return new Promise((resolve) => {
        const finish = () => {
          discEl.classList.remove('rolling');
          paint(face, dir);
          if (window.SFX) window.SFX.play(dir === 'main' ? 'step' : 'gust');
          if (typeof onDone === 'function') onDone(face, dir);
          resolve({ face, dir });
        };
        if (reduced()) { finish(); return; }
        host.classList.remove('is-aim', 'is-left', 'is-right');
        discEl.classList.remove('rolling');
        faceEl.innerHTML = dieSvg(null, 'idle');
        resEl.textContent = '';
        void discEl.offsetWidth;
        discEl.classList.add('rolling');
        if (window.SFX) window.SFX.play('dieroll');
        let settled = false;
        const onEnd = () => { if (settled) return; settled = true; discEl.removeEventListener('animationend', onEnd); finish(); };
        discEl.addEventListener('animationend', onEnd);
        setTimeout(onEnd, SPIN_MS + 140);
      });
    }

    return { roll, set, setBadge, el: host };
  }

  window.WindDie = { mount };
})();

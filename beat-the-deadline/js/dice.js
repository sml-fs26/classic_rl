/* The two physical DICE of the Beat-the-Deadline MDP, shown on screen so the
   learner SEES the randomness a WAIT exposes them to.

   (1) ARRIVAL die (green): tumbles on a WAIT; on a hit (prob q = 0.6) a pallet
       slides onto the dock. A simple 2-face cube: a green "pallet" face vs a
       grey "nothing" face, with a q badge.
   (2) DEADLINE-RISK die (red): its BLOWN faces literally GROW as the clock
       runs down. Rendered as a 5-cell strip whose lit (red) cells = round(5 *
       miss(h)): 0 lit at h=4, 1 at h=3, 2 at h=2, 3 at h=1. The learner sees
       risk climb. On a roll it lands BLOWN (the load is stranded) or SAFE.

   Both are mount-based and animation-promised like the sibling coin/die.

   ArrivalDie.mount(host, opts) -> {
     roll(arrived, onDone)   arrived boolean; tumbles, lands, resolves arrived
     set(arrived)            set face, no animation
     el
   }
   DeadlineDie.mount(host, opts) -> {
     setHours(h)             repaint the blown-face strip for hours-left h
     roll(blown, onDone)     blown boolean; shakes, lands, resolves blown
     set(blown)
     el
   }

   Reduced motion: animation skipped, face set immediately, promise resolves on
   the next microtask, so lecture-room / headless capture stays still. */
(function () {
  const SPIN_MS = 560;
  function T(k, v) { return window.I18N ? window.I18N.t(k, v) : k; }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------------- Arrival die (green) ---------------- */
  function mountArrival(host, opts) {
    const o = opts || {};
    host.classList.add('btd-die', 'arrival-die');
    host.innerHTML =
      '<div class="die-cube arrival-cube">' +
        '<div class="die-face"></div>' +
        '<div class="die-badge">' + (o.badge || T('die.arrivalBadge')) + '</div>' +
      '</div>' +
      '<div class="die-result"></div>' +
      '<div class="die-caption">' + T('die.arrivalLabel') + '</div>';
    const cube = host.querySelector('.die-cube');
    const faceEl = host.querySelector('.die-face');
    const resEl = host.querySelector('.die-result');

    function paint(arrived) {
      host.classList.toggle('is-hit', arrived);
      host.classList.toggle('is-miss', !arrived);
      faceEl.innerHTML = arrived ? palletGlyph() : nothingGlyph();
      resEl.textContent = arrived ? T('die.pallet') : T('die.noPallet');
    }
    function set(arrived) { cube.classList.remove('tumbling'); paint(!!arrived); }

    function roll(arrived, onDone) {
      arrived = !!arrived;
      return new Promise((resolve) => {
        const finish = () => {
          cube.classList.remove('tumbling');
          paint(arrived);
          if (window.SFX) window.SFX.play(arrived ? 'arrive' : 'tick');
          if (typeof onDone === 'function') onDone(arrived);
          resolve(arrived);
        };
        if (reduced()) { finish(); return; }
        host.classList.remove('is-hit', 'is-miss');
        faceEl.innerHTML = qGlyph();
        resEl.textContent = '';
        void cube.offsetWidth;
        cube.classList.add('tumbling');
        if (window.SFX) window.SFX.play('roll');
        let settled = false;
        const onEnd = () => { if (settled) return; settled = true; cube.removeEventListener('animationend', onEnd); finish(); };
        cube.addEventListener('animationend', onEnd);
        setTimeout(onEnd, SPIN_MS + 140);
      });
    }
    set(false);
    return { roll, set, el: host };
  }

  /* ---------------- Deadline-risk die (red) ---------------- */
  function mountDeadline(host, opts) {
    const o = opts || {};
    host.classList.add('btd-die', 'deadline-die');
    host.innerHTML =
      '<div class="die-cube deadline-cube">' +
        '<div class="risk-strip"></div>' +
        '<div class="die-badge risk-badge">0%</div>' +
      '</div>' +
      '<div class="die-result"></div>' +
      '<div class="die-caption">' + T('die.deadlineLabel') + '</div>';
    const cube = host.querySelector('.die-cube');
    const strip = host.querySelector('.risk-strip');
    const badge = host.querySelector('.risk-badge');
    const resEl = host.querySelector('.die-result');
    let curH = 4;

    function missFor(h) { return window.Dock ? window.Dock.missProb(h) : [0, 0.6, 0.4, 0.2, 0][h]; }

    function paintStrip(h) {
      curH = h;
      const miss = missFor(h);
      const lit = Math.round(miss * 5);   // 0,1,2,3 lit cells
      let html = '';
      for (let i = 0; i < 5; i++) {
        html += '<span class="risk-cell' + (i < lit ? ' on' : '') + '"></span>';
      }
      strip.innerHTML = html;
      badge.textContent = Math.round(miss * 100) + '%';
      host.classList.toggle('risk-none', miss === 0);
    }
    function setHours(h) { paintStrip(h); resEl.textContent = ''; host.classList.remove('is-blown', 'is-safe'); }

    function paintResult(blown) {
      host.classList.toggle('is-blown', blown);
      host.classList.toggle('is-safe', !blown);
      resEl.textContent = blown ? T('die.blown') : T('die.safe');
    }
    function set(blown) { cube.classList.remove('shaking'); paintResult(!!blown); }

    function roll(blown, onDone) {
      blown = !!blown;
      return new Promise((resolve) => {
        const finish = () => {
          cube.classList.remove('shaking');
          paintResult(blown);
          if (window.SFX) window.SFX.play(blown ? 'blown' : 'safe');
          if (typeof onDone === 'function') onDone(blown);
          resolve(blown);
        };
        if (reduced()) { finish(); return; }
        host.classList.remove('is-blown', 'is-safe');
        resEl.textContent = '';
        void cube.offsetWidth;
        cube.classList.add('shaking');
        if (window.SFX) window.SFX.play('roll');
        let settled = false;
        const onEnd = () => { if (settled) return; settled = true; cube.removeEventListener('animationend', onEnd); finish(); };
        cube.addEventListener('animationend', onEnd);
        setTimeout(onEnd, SPIN_MS + 140);
      });
    }
    paintStrip(o.h != null ? o.h : 4);
    return { setHours, roll, set, el: host };
  }

  /* ---------------- Glyphs ---------------- */
  function palletGlyph() {
    return '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">' +
      '<rect x="9" y="13" width="22" height="9" fill="var(--pallet)" stroke="var(--pallet-rule)" stroke-width="2"/>' +
      '<rect x="9" y="23" width="22" height="9" fill="var(--pallet)" stroke="var(--pallet-rule)" stroke-width="2"/>' +
      '<path d="M20 12 L20 4 M14 8 L20 2 L26 8" fill="none" stroke="var(--arrival)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }
  function nothingGlyph() {
    return '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="13" fill="none" stroke="var(--ink-faint)" stroke-width="2.4"/>' +
      '<line x1="12" y1="28" x2="28" y2="12" stroke="var(--ink-faint)" stroke-width="2.4"/>' +
      '</svg>';
  }
  function qGlyph() {
    return '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">' +
      '<text x="20" y="27" text-anchor="middle" font-size="18" font-family="Press Start 2P, monospace" fill="var(--ink-secondary)">?</text>' +
      '</svg>';
  }

  window.ArrivalDie = { mount: mountArrival };
  window.DeadlineDie = { mount: mountDeadline };
})();

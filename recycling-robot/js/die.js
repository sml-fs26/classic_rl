/* die.js, the BATTERY-DRAIN DIE widget (the signature animation).
 *
 *   Tap SEARCH and a chunky die tumbles into a small popup, lands on -1 (most
 *   of the time) or -2 (a bad roll), and the gauge pips drain to match with a
 *   spark. The probabilities (70 / 30) are printed on a badge so the randomness
 *   is transparent. WAIT and RECHARGE show no die.
 *
 *   mount(host, opts) -> {
 *     roll(rng)            // tumble, land on -1 (0.7) or -2 (0.3); resolves to {delta}
 *     roll(rng, forced)    // force a specific delta (-1 or -2) for the tutorial
 *     show(delta)          // set a face without animating
 *     el
 *   }
 *   roll returns a Promise<{delta}>. Styles live in css/die.css. The face shows
 *   "-1" or "-2" big, with two dot-rows that read as drained rungs. */
(function () {
  const DRAIN = window.Robot ? window.Robot.DRAIN : [{ delta: -1, p: 0.7 }, { delta: -2, p: 0.3 }];
  const P_MINUS1 = DRAIN[0].p;     // 0.70
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('rr-die');
    host.innerHTML =
      '<div class="rr-die-cube">' +
        '<div class="rr-die-face"><span class="rr-die-delta">−1</span></div>' +
      '</div>' +
      (o.badge !== false ? '<div class="rr-die-badge">' + T('die.badge') + '</div>' : '');

    const cube = host.querySelector('.rr-die-cube');
    const deltaEl = host.querySelector('.rr-die-delta');

    function setFace(delta) {
      deltaEl.textContent = delta === -2 ? '−2' : '−1';
      cube.classList.toggle('rr-die-bad', delta === -2);
    }
    function show(delta) { setFace(delta); }

    function roll(rng, forced) {
      const r = (rng ? rng() : Math.random());
      const delta = (forced === -1 || forced === -2) ? forced : (r < P_MINUS1 ? -1 : -2);
      return new Promise((resolve) => {
        if (window.SFX) window.SFX.play('diceroll');
        if (reduced()) { setFace(delta); resolve({ delta }); return; }
        cube.classList.remove('rr-die-leap'); void cube.offsetWidth; cube.classList.add('rr-die-leap');
        /* mid-tumble flicker so it reads as "rolling" */
        let flicks = 0;
        const flick = setInterval(() => { deltaEl.textContent = (flicks++ % 2) ? '−1' : '−2'; }, 90);
        setTimeout(() => {
          clearInterval(flick);
          setFace(delta);
          cube.classList.remove('rr-die-leap');
          resolve({ delta });
        }, 640);
      });
    }

    return { roll, show, el: host };
  }

  window.Die = { mount };
})();

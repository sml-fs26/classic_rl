/* The DIE widget - the visible randomness of Press Your Luck.
 *
 *   A single six-sided pixel die that can show any face statically and play
 *   the signature THE ROLL animation: leap, tumble through a few faces, and
 *   settle on the result. The die IS the randomness, front and centre.
 *
 *   On a 2-6 the die fires the POT-POP (the pot meter pops up a bucket with a
 *   "+N" chip flying on); on a 1 (the bust) it fires the BUST-COLLAPSE plus a
 *   screen-shake on a registered target (the whole pot stack greys out and
 *   slides away - the bust, felt). Scenes wire those two effects via the
 *   options below; the die owns the timing so the playtest / trajectory /
 *   SARSA scenes all share one roll.
 *
 *   Faces are drawn as a 3x3 grid of pip slots (CSS-classed blocks, no
 *   external image). The pip layout per face is the standard d6 arrangement.
 *
 *   API:
 *     const die = Die.mount(host, opts?)
 *         opts.rng        -> a () => [0,1) source (default: window.Pig RNG or
 *                            Math.random); used when roll(null) is called
 *         opts.onPotPop   -> fn(face) fired when a non-bust face settles
 *                            (face in 2..6); the scene grows the pot meter
 *         opts.onBust     -> fn() fired when a 1 settles; the scene collapses
 *                            the pot stack
 *         opts.shakeTarget-> element to add `.pyl-screen-shake` to on a bust
 *                            (default: the die host's offsetParent)
 *     die.show(face)                       // 1..6, instant, no effects
 *     die.roll(faceOrNull, opts?) -> Promise<face>
 *         Animates the tumble, settles on `face` (or a random 1..6 drawn from
 *         the rng when null/undefined), fires onPotPop / onBust, resolves to
 *         the settled face after the animation finishes.
 *         opts.duration -> total tumble ms (default 700)
 *         opts.faces    -> intermediate faces to flash (default 6)
 *         opts.silent   -> suppress SFX for this roll
 *     die.lastFace()                       // the face currently shown
 *     die.el
 *
 *   The animation respects prefers-reduced-motion (it snaps to the result and
 *   still fires the pot-pop / bust effects). CSS lives in css/style.css.
 */
(function () {
  /* Pip slots filled per face (3x3 grid, slots 0..8 left-to-right,
     top-to-bottom). Centre is slot 4. */
  const FACE_PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const BUST_FACE = (window.Pig && window.Pig.BUST_FACE) || 1;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function defaultRng() {
    /* Prefer a freshly-seeded Pig RNG so a die with no rng still differs run
       to run, but fall back to Math.random. Scenes that need reproducibility
       pass their own seeded rng in opts.rng. */
    if (window.Pig && window.Pig.makeRng) {
      return window.Pig.makeRng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
    }
    return Math.random;
  }

  function mount(host, opts) {
    const o = opts || {};
    const rng = o.rng || defaultRng();
    host.classList.add('pyl-die');
    host.innerHTML = '';

    const cube = document.createElement('div');
    cube.className = 'pyl-die-cube';
    for (let i = 0; i < 9; i++) {
      const pip = document.createElement('span');
      pip.className = 'pyl-die-pip';
      pip.dataset.slot = String(i);
      cube.appendChild(pip);
    }
    host.appendChild(cube);
    const pips = Array.prototype.slice.call(cube.querySelectorAll('.pyl-die-pip'));

    let shown = 1;
    function show(face) {
      const on = FACE_PIPS[face] || [];
      for (let i = 0; i < 9; i++) pips[i].classList.toggle('on', on.indexOf(i) >= 0);
      cube.dataset.face = String(face);
      cube.classList.toggle('pyl-die-one', face === BUST_FACE);
      shown = face;
    }

    function shakeTargetEl() {
      if (o.shakeTarget) return o.shakeTarget;
      return host.offsetParent || host.parentElement || host;
    }
    function fireScreenShake() {
      if (reducedMotion()) return;
      const t = shakeTargetEl();
      if (!t) return;
      t.classList.remove('pyl-screen-shake');
      void t.offsetWidth;
      t.classList.add('pyl-screen-shake');
      setTimeout(() => t.classList.remove('pyl-screen-shake'), 420);
    }

    /* Fire the settle effects (pot-pop / bust) + SFX. */
    function settleEffects(face, silent) {
      if (face === BUST_FACE) {
        cube.classList.add('pyl-die-bust');
        fireScreenShake();
        if (!silent && window.SFX) window.SFX.play('loss');   // the bust thud
        if (typeof o.onBust === 'function') o.onBust();
      } else {
        if (!silent && window.SFX) window.SFX.play('cursor'); // the +N pop
        if (typeof o.onPotPop === 'function') o.onPotPop(face);
      }
    }

    let rolling = false;
    function roll(face, rollOpts) {
      const ro = rollOpts || {};
      const dur = ro.duration != null ? ro.duration : 700;
      const settled = (face == null) ? (1 + Math.floor(rng() * 6)) : face;

      return new Promise((resolve) => {
        if (rolling) { resolve(shown); return; }
        rolling = true;
        cube.classList.remove('pyl-die-bust', 'pyl-die-leap');

        if (reducedMotion()) {
          show(settled);
          settleEffects(settled, ro.silent);
          rolling = false;
          resolve(settled);
          return;
        }

        void cube.offsetWidth;
        cube.classList.add('pyl-die-leap');
        if (!ro.silent && window.SFX) window.SFX.play('tick');  // the dice clatter

        const flashes = ro.faces != null ? ro.faces : 6;
        const start = performance.now();
        let lastFlash = 0;
        function frame(now) {
          const t = (now - start) / dur;
          if (t >= 1) {
            cube.classList.remove('pyl-die-leap');
            show(settled);
            settleEffects(settled, ro.silent);
            rolling = false;
            resolve(settled);
            return;
          }
          /* Flash through faces, decelerating: a new face on each ~step. */
          const step = Math.floor(t * flashes);
          if (step !== lastFlash) {
            lastFlash = step;
            let f = 1 + Math.floor(rng() * 6);
            if (f === shown) f = (f % 6) + 1;
            show(f);
          }
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }

    function lastFace() { return shown; }

    show(1);
    return { el: host, show, roll, lastFace };
  }

  window.Die = { mount, FACE_PIPS };
})();

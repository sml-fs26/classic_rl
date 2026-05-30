/* The DIE widget - the visible randomness of Press Your Luck.
 *
 *   A single six-sided pixel die that can show any face statically and play
 *   the signature THE ROLL animation: leap, tumble through a few faces, and
 *   settle on the result. On a 1 (the bust) the settle carries a 'die-bust'
 *   class so callers can chain the stack-collapse + screen-shake.
 *
 *   Faces are drawn as a 3x3 grid of pip slots (CSS-classed blocks, no
 *   external image). The pip layout per face is the standard d6 arrangement.
 *
 *   API:
 *     const die = Die.mount(host)
 *     die.show(face)                 // 1..6, instant
 *     die.roll(face, cb, opts?)      // animate, then show(face) + cb(face)
 *         opts.duration  -> total tumble ms (default 700)
 *         opts.faces     -> how many intermediate faces to flash (default 5)
 *     die.el
 *
 *   The animation respects prefers-reduced-motion (it snaps to the result).
 *   It uses requestAnimationFrame timing only; the CSS lives in style.css.
 */
(function () {
  /* Pip slots that are filled for each face (3x3 grid, slots 0..8 reading
     left-to-right, top-to-bottom). Center is slot 4. */
  const FACE_PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function mount(host) {
    host.classList.add('pyl-die');
    host.innerHTML = '';

    const cube = document.createElement('div');
    cube.className = 'pyl-die-cube';
    /* 9 pip slots; show() toggles which are 'on'. */
    for (let i = 0; i < 9; i++) {
      const pip = document.createElement('span');
      pip.className = 'pyl-die-pip';
      pip.dataset.slot = String(i);
      cube.appendChild(pip);
    }
    host.appendChild(cube);

    const pips = Array.prototype.slice.call(cube.querySelectorAll('.pyl-die-pip'));

    function show(face) {
      const on = FACE_PIPS[face] || [];
      for (let i = 0; i < 9; i++) pips[i].classList.toggle('on', on.indexOf(i) >= 0);
      cube.dataset.face = String(face);
      cube.classList.toggle('pyl-die-one', face === 1);
    }

    let rolling = false;
    function roll(face, cb, opts) {
      const o = opts || {};
      const dur = o.duration != null ? o.duration : 700;
      if (rolling) return;
      rolling = true;

      if (reducedMotion()) {
        show(face);
        cube.classList.toggle('pyl-die-bust', face === 1);
        rolling = false;
        if (cb) cb(face);
        return;
      }

      cube.classList.remove('pyl-die-bust');
      cube.classList.remove('pyl-die-leap');
      void cube.offsetWidth;
      cube.classList.add('pyl-die-leap');

      const flashes = o.faces != null ? o.faces : 5;
      const start = performance.now();
      let lastFace = 0;
      function frame(now) {
        const t = (now - start) / dur;
        if (t >= 1) {
          show(face);
          cube.classList.remove('pyl-die-leap');
          cube.classList.toggle('pyl-die-bust', face === 1);
          rolling = false;
          if (cb) cb(face);
          return;
        }
        /* Flash through faces, decelerating: pick a pseudo-random face that
           isn't the one currently shown, at a cadence that slows as t->1. */
        const step = Math.floor(t * flashes);
        if (step !== Math.floor(((now - 16 - start) / dur) * flashes)) {
          let f = 1 + Math.floor(Math.random() * 6);
          if (f === lastFace) f = (f % 6) + 1;
          lastFace = f;
          show(f);
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    show(1);
    return { el: host, show, roll };
  }

  window.Die = { mount, FACE_PIPS };
})();

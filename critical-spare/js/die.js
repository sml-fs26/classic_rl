/* die.js, the FAILURE DIE: a pie-style die with a growing red "FAIL" slice
   and a green "RUNS FINE" slice. The red wedge enlarges as the machine ages
   (0% HEALTHY, 30% AGING, 70% FAILING), so the odds are printed on its face.
   On a roll it spins and lands on FAIL or RUNS-FINE.

   API (mount-based):
     Die.mount(host, opts) -> {
       setRisk(pFail)        set the red-slice fraction (0..1) + the % badge
       roll(failed, onDone)  spin, land on FAIL (failed=true) or RUNS-FINE; fires
                             onDone(failed) and RETURNS A PROMISE resolving to
                             failed after the animation
       set(failed)           set the face with no animation
       el
     }

   Reduced motion / headless: the spin is skipped, the face is set immediately,
   the Promise resolves on the next tick. Styles live in css/die.css. */
(function () {
  const SPIN_MS = 640;
  const R = 26, CX = 30, CY = 30;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Arc path for a slice from angle a0 to a1 (degrees, clockwise from top). */
  function arc(a0, a1) {
    const toXY = (deg) => {
      const r = (deg - 90) * Math.PI / 180;
      return [CX + R * Math.cos(r), CY + R * Math.sin(r)];
    };
    const [x0, y0] = toXY(a0);
    const [x1, y1] = toXY(a1);
    const large = (a1 - a0) % 360 > 180 ? 1 : 0;
    if (Math.abs(a1 - a0) >= 359.999) {
      /* full circle */
      return `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`;
    }
    return `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('fail-die');
    host.innerHTML =
      '<div class="fd-disc">' +
        '<svg class="fd-svg" viewBox="0 0 60 60" width="64" height="64" aria-hidden="true">' +
          '<circle cx="30" cy="30" r="27" fill="var(--bg-strong)" stroke="var(--rule)" stroke-width="2.4"/>' +
          '<path class="fd-fine" d=""></path>' +
          '<path class="fd-fail" d=""></path>' +
          '<circle cx="30" cy="30" r="27" fill="none" stroke="var(--rule)" stroke-width="2.4"/>' +
        '</svg>' +
        '<div class="fd-badge">0%</div>' +
      '</div>' +
      '<div class="fd-result"></div>';

    const disc = host.querySelector('.fd-disc');
    const finePath = host.querySelector('.fd-fine');
    const failPath = host.querySelector('.fd-fail');
    const badge = host.querySelector('.fd-badge');
    const resEl = host.querySelector('.fd-result');

    let risk = 0;

    function setRisk(pFail) {
      risk = Math.max(0, Math.min(1, pFail));
      const failDeg = risk * 360;
      /* fail slice starts at the top (0deg), runs clockwise; fine fills the rest */
      if (risk <= 0) {
        finePath.setAttribute('d', arc(0, 359.999));
        failPath.setAttribute('d', '');
      } else if (risk >= 1) {
        failPath.setAttribute('d', arc(0, 359.999));
        finePath.setAttribute('d', '');
      } else {
        failPath.setAttribute('d', arc(0, failDeg));
        finePath.setAttribute('d', arc(failDeg, 360));
      }
      badge.textContent = Math.round(risk * 100) + '%';
      host.classList.toggle('fd-norisk', risk <= 0);
    }

    function paint(failed) {
      host.classList.toggle('is-fail', failed);
      host.classList.toggle('is-fine', !failed);
      resEl.textContent = T(failed ? 'die.fail' : 'die.fine');
    }
    function set(failed) { disc.classList.remove('spinning'); paint(!!failed); }

    function roll(failed, onDone) {
      failed = !!failed;
      return new Promise((resolve) => {
        const finish = () => {
          disc.classList.remove('spinning');
          paint(failed);
          if (window.SFX) window.SFX.play(failed ? 'fail' : 'run');
          if (typeof onDone === 'function') onDone(failed);
          resolve(failed);
        };
        if (reduced()) { finish(); return; }

        host.classList.remove('is-fail', 'is-fine');
        resEl.textContent = '';
        disc.classList.remove('spinning');
        void disc.offsetWidth;
        disc.classList.add('spinning');
        if (window.SFX) window.SFX.play('diceroll');

        let settled = false;
        const onEnd = () => {
          if (settled) return;
          settled = true;
          disc.removeEventListener('animationend', onEnd);
          finish();
        };
        disc.addEventListener('animationend', onEnd);
        setTimeout(onEnd, SPIN_MS + 140);
      });
    }

    setRisk(0);
    return { setRisk, roll, set, el: host };
  }

  window.Die = { mount };
})();

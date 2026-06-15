/* The CONVERSION WHEEL: a PAYWALL PUSH spins it. It ratchets into one of three
   wedges, sized by the user's adoption tier:
     BUY      -> CONVERT (+20, terminal)   green
     IGNORE   -> stay same tier, a day burns   grey
     ABANDON  -> the early ask soured them, they bail (-5, terminal)   red
   A cold user's wheel is mostly ABANDON + IGNORE with a sliver of BUY; an
   ACTIVATED user's wheel is mostly BUY. The odds are printed on every wedge and
   the dreaded "pushed-too-early -> ABANDON" wedge is large and red so the
   danger is visible. This is the second visible die of the Trial Clock MDP.

   API (mount-based):
     Wheel.mount(host, opts) -> {
       setTier(tier)             redraw the wedges for a tier (0..4)
       spin(wedge, onDone)       wedge in {'buy','ignore','abandon'}. Spins and
                                 ratchets the pointer into that wedge, fires
                                 onDone(wedge), RETURNS A PROMISE -> wedge.
       set(wedge|null)           land on a wedge with no animation (null = idle)
       tier                      current tier
       el                        the host element
     }

   Geometry: a single SVG circle of radius R; each wedge is an arc path. The
   pointer sits at the TOP (12 o'clock) and the disc rotates underneath, so a
   spin = rotate the disc so the chosen wedge's mid-angle ends under the pointer.
   Reduced motion / headless: the disc jumps straight to the resting angle and
   the Promise resolves on the next microtask. Colours come from CSS tokens via
   currentColor-free explicit fills (so they read in both themes); styles in
   css/wheel.css. */
(function () {
  const SPIN_MS = 900;
  const R = 64, CX = 72, CY = 72;          // viewBox 144x144
  const TWO_PI = Math.PI * 2;

  function T(key, v) { return window.I18N ? window.I18N.t(key, v) : key; }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Wheel wedge fractions by tier: [buy, ignore, abandon], summing to 1.
     Mirrors window.Trial.WHEEL exactly. */
  function wedgesFor(tier) {
    const w = (window.Trial && window.Trial.wheel) ? window.Trial.wheel(tier)
      : { buy: 0, ignore: 0.5, abandon: 0.5 };
    return [
      { id: 'buy',     p: w.buy },
      { id: 'ignore',  p: w.ignore },
      { id: 'abandon', p: w.abandon },
    ].filter(x => x.p > 0);
  }
  const WEDGE_FILL = {
    buy:     'var(--buy)',
    ignore:  'var(--ignore)',
    abandon: 'var(--abandon)',
  };
  const WEDGE_LABEL = { buy: 'wheel.buy', ignore: 'wheel.ignore', abandon: 'wheel.abandon' };

  /* SVG arc path for a wedge spanning [a0, a1] radians (clockwise from 12 o'clock). */
  function arcPath(a0, a1) {
    /* angle 0 = top (12 o'clock), increasing clockwise. Convert to screen xy. */
    const toXY = (ang, r) => [CX + r * Math.sin(ang), CY - r * Math.cos(ang)];
    const [x0, y0] = toXY(a0, R);
    const [x1, y1] = toXY(a1, R);
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    return 'M ' + CX + ' ' + CY + ' L ' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
      ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('conv-wheel');
    if (o.compact) host.classList.add('conv-wheel-compact');

    host.innerHTML =
      '<div class="cw-stage">' +
        '<div class="cw-pointer" aria-hidden="true"></div>' +
        '<svg class="cw-svg" viewBox="0 0 144 144" width="160" height="160" aria-hidden="true">' +
          '<g class="cw-disc"></g>' +
          '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" stroke="var(--rule)" stroke-width="3"/>' +
          '<circle cx="' + CX + '" cy="' + CY + '" r="7" fill="var(--bg-strong)" stroke="var(--rule)" stroke-width="3"/>' +
        '</svg>' +
      '</div>' +
      '<div class="cw-result"></div>';

    const discG = host.querySelector('.cw-disc');
    const resEl = host.querySelector('.cw-result');

    let tier = o.tier != null ? o.tier : 0;
    let wedges = [];
    let wedgeMid = {};         // id -> mid-angle (radians, 0 = top)
    let curAngle = 0;          // current disc rotation (deg)

    function draw(t) {
      tier = t;
      wedges = wedgesFor(t);
      wedgeMid = {};
      let acc = 0;
      let html = '';
      for (const w of wedges) {
        const a0 = acc * TWO_PI;
        const a1 = (acc + w.p) * TWO_PI;
        const mid = (a0 + a1) / 2;
        wedgeMid[w.id] = mid;
        html += '<path class="cw-wedge cw-wedge-' + w.id + '" d="' + arcPath(a0, a1) + '" ' +
          'fill="' + WEDGE_FILL[w.id] + '" stroke="var(--rule)" stroke-width="2"/>';
        /* label: percent, placed at the wedge centroid */
        const lr = R * 0.62;
        const lx = CX + lr * Math.sin(mid), ly = CY - lr * Math.cos(mid);
        const pct = Math.round(w.p * 100);
        html += '<text class="cw-wlab" x="' + lx.toFixed(1) + '" y="' + (ly - 2).toFixed(1) + '" ' +
          'text-anchor="middle" font-size="9" font-weight="700">' + pct + '%</text>';
        html += '<text class="cw-wname" x="' + lx.toFixed(1) + '" y="' + (ly + 8).toFixed(1) + '" ' +
          'text-anchor="middle" font-size="6">' + T(WEDGE_LABEL[w.id]) + '</text>';
        acc += w.p;
      }
      discG.innerHTML = html;
      discG.style.transform = 'rotate(' + curAngle + 'deg)';
    }

    /* rotation (deg) that puts a wedge's mid-angle under the top pointer. The
       disc rotates so the wedge mid moves to 0 (top) -> rotate by -mid. */
    function restAngleFor(wedgeId) {
      const mid = wedgeMid[wedgeId];
      if (mid == null) return curAngle;
      return -(mid * 180 / Math.PI);
    }

    function paintResult(wedgeId) {
      host.classList.remove('res-buy', 'res-ignore', 'res-abandon');
      host.classList.add('res-' + wedgeId);
      resEl.textContent = T(WEDGE_LABEL[wedgeId]);
    }

    function set(wedgeId) {
      discG.classList.remove('spinning');
      if (!wedgeId) { resEl.textContent = ''; host.classList.remove('res-buy', 'res-ignore', 'res-abandon'); return; }
      curAngle = restAngleFor(wedgeId);
      discG.style.transition = 'none';
      discG.style.transform = 'rotate(' + curAngle + 'deg)';
      void discG.offsetWidth;
      discG.style.transition = '';
      paintResult(wedgeId);
    }

    function spin(wedgeId, onDone) {
      return new Promise((resolve) => {
        if (!wedgeMid[wedgeId]) { resolve(wedgeId); return; }
        const finish = () => {
          host.classList.remove('cw-spinning');
          paintResult(wedgeId);
          if (window.SFX) window.SFX.play(wedgeId === 'buy' ? 'win' : (wedgeId === 'abandon' ? 'loss' : 'drop'));
          if (typeof onDone === 'function') onDone(wedgeId);
          resolve(wedgeId);
        };
        if (reduced()) { set(wedgeId); finish(); return; }

        resEl.textContent = '';
        host.classList.remove('res-buy', 'res-ignore', 'res-abandon');
        host.classList.add('cw-spinning');
        if (window.SFX) window.SFX.play('coinflip');

        /* spin several full turns then ratchet to the resting angle. */
        const target = restAngleFor(wedgeId);
        const spins = 3;            // full turns for drama
        const finalAngle = target - 360 * spins;
        discG.style.transition = 'transform ' + SPIN_MS + 'ms cubic-bezier(0.17,0.67,0.32,1.3)';
        void discG.offsetWidth;
        discG.style.transform = 'rotate(' + finalAngle + 'deg)';
        curAngle = ((target % 360) + 360) % 360;

        let settled = false;
        const onEnd = () => {
          if (settled) return;
          settled = true;
          discG.removeEventListener('transitionend', onEnd);
          /* normalise the resting transform (no transition) so the next spin is clean. */
          discG.style.transition = 'none';
          discG.style.transform = 'rotate(' + restAngleFor(wedgeId) + 'deg)';
          void discG.offsetWidth;
          discG.style.transition = '';
          finish();
        };
        discG.addEventListener('transitionend', onEnd);
        setTimeout(onEnd, SPIN_MS + 160);
      });
    }

    function setTier(t) { draw(t); }

    draw(tier);
    return { setTier, spin, set, get tier() { return tier; }, el: host };
  }

  window.Wheel = { mount, wedgesFor };
})();

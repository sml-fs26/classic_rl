/* The recurring STATE-ICON: OLD BESSIE, a side-view pixel delivery van.
 *
 *   One inline-SVG van + an HP-style health gauge (4 segments, green ->
 *   amber -> red) + an odometer + exhaust puffs that thicken with wear.
 *   The same glyph recurs everywhere a "state" appears (playtest board,
 *   trajectory tape, atop the Q* table) so the learner builds exactly one
 *   mental picture: wear level = how many gauge segments are left.
 *
 *   Wear levels (= engine state index): 0 HEALTHY, 1 WORN, 2 SHAKY,
 *   3 FAILING. Visuals per level: gauge segments 4/3/2/1, body scratches,
 *   dents + rust, a sag tilt at FAILING, smokier exhaust all the way up.
 *
 *   Colours come from CSS tokens (--wear-0..3 and the shared chrome
 *   tokens), never inline, so both themes (light paper / crt amber)
 *   restyle it.
 *
 *   API:
 *     VanCard.mount(host, opts) -> ctrl
 *       opts.wear    0..3   initial wear (default 0, HEALTHY)
 *       opts.size    'sm' | 'md' | 'lg'    (default 'md')
 *       opts.compact boolean   gauge-swatch-only mini form (Q-table rows)
 *       opts.miles   number    odometer start (default 0)
 *       opts.name    string    nameplate (default 'OLD BESSIE')
 *     ctrl.set(wear)            jump to a wear level
 *     ctrl.setState(state)      { wear: 0..3 }
 *     ctrl.setMiles(m) / ctrl.addMiles(dm)
 *     ctrl.playBreakdown(cb)    shake + smoke burst + BREAKDOWN chip (~1s)
 *     ctrl.playService(cb)      wrench overlay + IN THE SHOP chip (~0.9s)
 *     ctrl.playReplace(cb)      sparkle + factory-new reset + numeral bump
 *     ctrl.setName(name)        override the nameplate
 *     ctrl.el()                 the host element
 */
(function () {
  const NUM = (window.Van && window.Van.NUM_STATES) || 4;

  function reduceMotion() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function roman(n) {
    const R = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return R[Math.max(0, Math.min(R.length - 1, n))] || String(n);
  }

  /* The van, facing right. Hard rects + thick strokes for the pixel feel.
     Wear decals (scratch / dents / cracks / drip) are always in the DOM and
     revealed per wear level by CSS (.vc-wear-N). */
  function vanSvg() {
    return '' +
      '<svg class="vc-svg" viewBox="0 0 120 66" aria-hidden="true">' +
        '<g class="vc-van">' +
          /* exhaust pipe */
          '<rect class="vc-pipe" x="2" y="46" width="8" height="4"/>' +
          /* cargo box */
          '<rect class="vc-body" x="8" y="12" width="66" height="34"/>' +
          /* roof line accent */
          '<rect class="vc-roof" x="8" y="12" width="66" height="4"/>' +
          /* cab */
          '<rect class="vc-cab" x="74" y="22" width="28" height="24"/>' +
          '<rect class="vc-glass" x="78" y="26" width="13" height="11"/>' +
          /* headlight + bumper */
          '<rect class="vc-light" x="98" y="34" width="5" height="5"/>' +
          '<rect class="vc-bumper" x="100" y="42" width="8" height="5"/>' +
          /* nameplate */
          '<text class="vc-name" x="41" y="34" text-anchor="middle" textLength="56" lengthAdjust="spacingAndGlyphs"></text>' +
          /* wear decals */
          '<polyline class="vc-decal vc-scratch" points="14,42 24,40 30,43"/>' +
          '<path class="vc-decal vc-dent" d="M58 44 l5 -4 l4 4"/>' +
          '<rect class="vc-decal vc-rust" x="62" y="40" width="9" height="6"/>' +
          '<polyline class="vc-decal vc-crack" points="13,16 17,24 12,30 17,38"/>' +
          '<line class="vc-decal vc-drip" x1="96" y1="47" x2="96" y2="56"/>' +
          /* wheels */
          '<g class="vc-wheel vc-wheel-rear"><circle class="vc-tyre" cx="26" cy="50" r="9"/><circle class="vc-hub" cx="26" cy="50" r="3.5"/></g>' +
          '<g class="vc-wheel vc-wheel-front"><circle class="vc-tyre" cx="88" cy="50" r="9"/><circle class="vc-hub" cx="88" cy="50" r="3.5"/></g>' +
        '</g>' +
        /* ground */
        '<line class="vc-ground" x1="2" y1="60" x2="118" y2="60"/>' +
      '</svg>';
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('van-card', 'vc-size-' + (o.size || 'md'));
    host.innerHTML = '';

    let wear = Math.max(0, Math.min(NUM - 1, o.wear | 0));
    let miles = Math.max(0, o.miles | 0);
    let vanNo = 1;
    let baseName = o.name || 'OLD BESSIE';

    /* ---- Compact form: just the gauge swatch (Q-table row labels). ---- */
    if (o.compact) {
      host.classList.add('vc-compact');
      const gauge = document.createElement('span');
      gauge.className = 'vc-gauge';
      for (let i = 0; i < NUM; i++) {
        const seg = document.createElement('span');
        seg.className = 'vc-gauge-seg';
        gauge.appendChild(seg);
      }
      host.appendChild(gauge);
      function applyCompact() {
        host.className = host.className.replace(/\bvc-wear-\d\b/g, '').trim();
        host.classList.add('vc-wear-' + wear);
        const segs = gauge.children;
        for (let i = 0; i < NUM; i++) segs[i].classList.toggle('lit', i < NUM - wear);
      }
      function set(w) { wear = Math.max(0, Math.min(NUM - 1, w | 0)); applyCompact(); }
      applyCompact();
      return {
        set, setState(s) { set(s ? s.wear : 0); },
        setMiles() {}, addMiles() {},
        playBreakdown(cb) { if (cb) setTimeout(cb, 0); },
        playService(cb) { if (cb) setTimeout(cb, 0); },
        playReplace(cb) { set(0); if (cb) setTimeout(cb, 0); },
        setName() {}, el() { return host; }, host,
      };
    }

    /* ---- Full form ---- */
    /* health gauge */
    const gauge = document.createElement('div');
    gauge.className = 'vc-gauge';
    gauge.innerHTML = '<span class="vc-gauge-label">COND</span>';
    for (let i = 0; i < NUM; i++) {
      const seg = document.createElement('span');
      seg.className = 'vc-gauge-seg';
      gauge.appendChild(seg);
    }
    const stateTag = document.createElement('span');
    stateTag.className = 'vc-state-tag';
    gauge.appendChild(stateTag);
    host.appendChild(gauge);

    /* van + puffs + overlay chips */
    const stage = document.createElement('div');
    stage.className = 'vc-stage';
    stage.innerHTML =
      '<div class="vc-puffs"><span class="vc-puff p1"></span><span class="vc-puff p2"></span><span class="vc-puff p3"></span></div>' +
      vanSvg() +
      '<div class="vc-fx" hidden></div>';
    host.appendChild(stage);
    const fx = stage.querySelector('.vc-fx');
    const nameNode = stage.querySelector('.vc-name');

    /* odometer */
    const odo = document.createElement('div');
    odo.className = 'vc-odo';
    odo.innerHTML = '<span class="vc-odo-label">ODO</span><span class="vc-odo-num"></span>';
    host.appendChild(odo);
    const odoNum = odo.querySelector('.vc-odo-num');

    function renderName() {
      nameNode.textContent = vanNo === 1 ? baseName : ('BESSIE ' + roman(vanNo));
    }
    function renderOdo() {
      odoNum.textContent = String(Math.round(miles)).padStart(5, '0');
    }
    function applyWear() {
      host.className = host.className.replace(/\bvc-wear-\d\b/g, '').trim();
      host.classList.add('vc-wear-' + wear);
      const segs = gauge.querySelectorAll('.vc-gauge-seg');
      for (let i = 0; i < NUM; i++) segs[i].classList.toggle('lit', i < NUM - wear);
      stateTag.textContent = (window.Van ? window.Van.STATE_DISPLAY[wear] :
        ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'][wear]);
    }

    function set(w) {
      wear = Math.max(0, Math.min(NUM - 1, w | 0));
      applyWear();
    }
    function setState(s) { set(s ? s.wear : 0); }
    function setMiles(m) { miles = Math.max(0, m); renderOdo(); }
    function addMiles(dm) { setMiles(miles + (dm || 0)); }
    function setName(n) { baseName = n || baseName; vanNo = 1; renderName(); }

    /* One-shot fx chip + host animation class; collapses under
       reduced-motion / &run so headless captures settle fast. */
    let fxTimer = null;
    function playFx(cls, chipHtml, ms, after) {
      const instant = reduceMotion() || /[#&?]run\b/.test(window.location.hash || '');
      if (fxTimer) { clearTimeout(fxTimer); fxTimer = null; }
      host.classList.remove('vc-fx-breakdown', 'vc-fx-service', 'vc-fx-replace');
      void host.offsetWidth;
      host.classList.add(cls);
      fx.innerHTML = chipHtml;
      fx.hidden = false;
      const wrap = () => {
        host.classList.remove(cls);
        fx.hidden = true;
        fx.innerHTML = '';
        if (after) after();
      };
      fxTimer = setTimeout(wrap, instant ? 60 : ms);
    }

    function playBreakdown(cb) {
      playFx('vc-fx-breakdown',
        '<span class="vc-cloud"></span><span class="vc-chip vc-chip-bad">&#9888; BREAKDOWN</span>',
        1100, cb);
    }
    function playService(cb) {
      playFx('vc-fx-service',
        '<span class="vc-wrench">' +
          '<svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">' +
          '<path d="M10.5 2.5 a4 4 0 0 0 -4.6 5.6 L2.5 11.5 l2 2 L7.9 10.1 a4 4 0 0 0 5.6 -4.6 L11 8 9 6 Z"' +
          ' fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span>' +
        '<span class="vc-chip vc-chip-mid">IN THE SHOP</span>',
        950, cb);
    }
    function playReplace(cb) {
      playFx('vc-fx-replace',
        '<span class="vc-spark s1"></span><span class="vc-spark s2"></span><span class="vc-spark s3"></span>' +
        '<span class="vc-chip vc-chip-good">NEW VAN</span>',
        950, () => {
          vanNo += 1;
          miles = 0;
          set(0);
          renderName();
          renderOdo();
          if (cb) cb();
        });
    }

    function el() { return host; }

    set(wear);
    renderName();
    renderOdo();

    return {
      set, setState, setMiles, addMiles,
      playBreakdown, playService, playReplace, setName,
      el, host,
    };
  }

  window.VanCard = { mount };
})();

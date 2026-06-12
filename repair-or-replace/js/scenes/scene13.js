/* Scene 13, "Turn the patience knob": the gamma playground.
 *
 * Owns the patience-knob panel that used to be scene 6's last step.
 * Data: DATA.gammaSweep (100 solved points, gamma 0.00..0.99). The
 * best-call strip, the two frontier markers and the SHAKY row all read
 * straight from the sweep; no hard-coded gamma thresholds anywhere.
 *
 * Four internal steps, ONE idea per click:
 *   0  the dial + the best-call strip at gamma = 0.90 (dial locked)
 *   1  the sweep demo: gamma rides 0.00 -> 0.90, frontiers slide left
 *   2  the SHAKY row in numbers (RUN / SVC / NEW at the chosen gamma)
 *   3  free play: the dial unlocks; the caption tracks the policy
 *
 * NEXT/RIGHT consumes 3 internal steps, then yields to the pager.
 * Optional &step=N hash flag jumps to an internal step on cold entry
 * (used for headless QA captures). Rewind re-applies the step with no
 * animations and resets the dial to gamma = 0.90, so every step's
 * settled look is a pure function of `step`. The slider blurs itself
 * after pointer interaction so the arrow keys keep stepping the deck.
 * No data-run-primary in this scene.
 */
(function () {
  window.scenes = window.scenes || {};

  function fmtSigned1(v) { return (v >= 0 ? '+' : '') + v.toFixed(1); }

  function hashStep(maxStep) {
    const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(maxStep, n)) : 0;
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  window.scenes.scene13 = function (root) {
    root.classList.add('scene-pad', 'scene13-scene', 'concept-scene');
    if (instantMode()) root.classList.add('s13-instant');
    root.innerHTML = '';

    const D = window.DATA || {};
    const ACT = window.Actions;
    const sweep = Array.isArray(D.gammaSweep) ? D.gammaSweep : [];
    const GAMMA = (D.model && D.model.gamma) || (window.Van && window.Van.GAMMA) || 0.9;
    const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
      D.stateDisplay || ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];

    /* The sweep index closest to the course gamma (0.90 -> index 90). */
    let HOME = 0;
    for (let i = 1; i < sweep.length; i++) {
      if (Math.abs(sweep[i].gamma - GAMMA) < Math.abs(sweep[HOME].gamma - GAMMA)) HOME = i;
    }

    const MAX_STEP = 3;
    let step = hashStep(MAX_STEP);

    /* ---- Heading ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'Turn the patience knob';
    root.appendChild(heading);

    /* ---- The knob panel ---- */
    const knob = document.createElement('div');
    knob.className = 's13-knob';
    root.appendChild(knob);

    const dialRow = document.createElement('div');
    dialRow.className = 'poke-menu-row s13-gamma-row';
    const dialLab = document.createElement('span');
    dialLab.className = 's13-gamma-lab';
    dialLab.appendChild(document.createTextNode('PATIENCE '));
    dialLab.appendChild(window.Katex.inline('\\gamma'));
    dialRow.appendChild(dialLab);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(Math.max(0, sweep.length - 1));
    slider.step = '1';
    slider.value = String(HOME);
    slider.setAttribute('aria-label', 'discount factor gamma');
    dialRow.appendChild(slider);
    const sliderVal = document.createElement('output');
    sliderVal.className = 'val';
    dialRow.appendChild(sliderVal);
    knob.appendChild(dialRow);

    /* band strip: best call per state + two frontier markers */
    const stripLabel = document.createElement('div');
    stripLabel.className = 's13-strip-label';
    stripLabel.textContent = 'BEST CALL PER STATE';
    knob.appendChild(stripLabel);

    const bandWrap = document.createElement('div');
    bandWrap.className = 's13-band-wrap';
    knob.appendChild(bandWrap);

    const strip = document.createElement('div');
    strip.className = 's13-band-strip';
    bandWrap.appendChild(strip);
    const bandCells = [];
    const bandActs = [];
    for (let s = 0; s < 4; s++) {
      const c = document.createElement('div');
      c.className = 's13-band-cell';
      const st = document.createElement('span');
      st.className = 's13-band-state';
      st.textContent = STATE_DISPLAY[s];
      const ac = document.createElement('span');
      ac.className = 's13-band-act';
      c.appendChild(st);
      c.appendChild(ac);
      strip.appendChild(c);
      bandCells.push(c);
      bandActs.push(ac);
    }

    function marker(cls, label) {
      const mEl = document.createElement('div');
      mEl.className = 's13-frontier ' + cls;
      mEl.innerHTML = (cls === 'f-top')
        ? '<span class="s13-frontier-lab">' + label + '</span><span class="s13-frontier-line"></span>'
        : '<span class="s13-frontier-line"></span><span class="s13-frontier-lab">' + label + '</span>';
      bandWrap.appendChild(mEl);
      return mEl;
    }
    const mRunSvc = marker('f-top', 'RUN|SVC');
    const mSvcNew = marker('f-bot', 'SVC|NEW');

    /* the SHAKY row in numbers (step 2) */
    const shakyRow = document.createElement('div');
    shakyRow.className = 's13-shaky';
    knob.appendChild(shakyRow);
    const shakyLab = document.createElement('span');
    shakyLab.className = 's13-shaky-lab';
    shakyLab.innerHTML = 'THE <span class="s13-shaky-state">SHAKY</span> ROW AT ';
    shakyLab.appendChild(window.Katex.inline('\\gamma'));
    shakyLab.appendChild(document.createTextNode(' = '));
    const shakyGammaVal = document.createElement('span');
    shakyLab.appendChild(shakyGammaVal);
    shakyLab.appendChild(document.createTextNode(':'));
    shakyRow.appendChild(shakyLab);
    const shakyChips = [];
    const ACTION_IDS = (ACT && ACT.MOVE_IDS) || ['run', 'service', 'replace'];
    ACTION_IDS.forEach((id) => {
      const chip = document.createElement('span');
      chip.className = 's13-shaky-chip ' + ACT.toneClass(id);
      chip.innerHTML = '<span class="s13-shaky-star">★</span>' +
        '<span class="s13-shaky-name">' + ACT.shortLabel(id) + '</span>' +
        '<span class="s13-shaky-val"></span>';
      shakyRow.appendChild(chip);
      shakyChips.push(chip);
    });

    /* ---- Caption + step hint ---- */
    const caption = document.createElement('p');
    caption.className = 's13-caption';
    root.appendChild(caption);

    const hint = document.createElement('div');
    hint.className = 's13-hint';
    root.appendChild(hint);

    /* ---- Dial logic (everything reads straight from gammaSweep) ---- */
    let lastPolicyKey = null;

    function frontierRunSvc(pol) {
      for (let i = 0; i < pol.length; i++) if (pol[i] !== 'run') return i;
      return null;
    }
    function frontierSvcNew(pol) {
      for (let i = 0; i < pol.length; i++) if (pol[i] === 'replace') return i;
      return null;
    }
    function placeMarker(node, f) {
      if (f == null || f <= 0) { node.classList.add('s13-hidden'); return; }
      node.classList.remove('s13-hidden');
      node.style.left = (f * 25) + '%';
    }

    /* One line, derived from the policy itself (never from gamma values). */
    function signpostFor(pol) {
      const hasNew = pol.indexOf('replace') >= 0;
      const newAtShaky = pol[2] === 'replace';
      const svcAtWorn = pol[1] === 'service';
      if (!hasNew) return 'Impatient: patch her forever, never scrap.';
      if (!newAtShaky) return 'Scrap only the dead van.';
      if (!svcAtWorn) return 'The scrap line crosses SHAKY.';
      return 'Patient: shop sooner, scrap sooner.';
    }

    function setGamma(idx, opts) {
      const o = opts || {};
      if (!sweep.length) return;
      const gi = Math.max(0, Math.min(sweep.length - 1, idx | 0));
      const pt = sweep[gi];
      const pol = pt.policy;

      slider.value = String(gi);
      sliderVal.textContent = pt.gamma.toFixed(2);
      shakyGammaVal.textContent = pt.gamma.toFixed(2);

      for (let s = 0; s < 4; s++) {
        bandCells[s].className = 's13-band-cell ' + ACT.toneClass(pol[s]);
        bandActs[s].textContent = ACT.shortLabel(pol[s]);
      }
      placeMarker(mRunSvc, frontierRunSvc(pol));
      placeMarker(mSvcNew, frontierSvcNew(pol));

      /* SHAKY row numbers straight from the sweep (state 2). */
      const q = [pt.Q[2 * 3], pt.Q[2 * 3 + 1], pt.Q[2 * 3 + 2]];
      let k = 0;
      for (let a = 1; a < 3; a++) if (q[a] > q[k]) k = a;
      for (let a = 0; a < 3; a++) {
        shakyChips[a].classList.toggle('s13-best', a === k);
        const valEl = shakyChips[a].querySelector('.s13-shaky-val');
        valEl.textContent = fmtSigned1(q[a]);
        valEl.classList.toggle('neg', q[a] < 0);
      }

      if (step === MAX_STEP) caption.textContent = signpostFor(pol);

      const key = pol.join(',');
      if (o.sfx && lastPolicyKey !== null && key !== lastPolicyKey && window.SFX) {
        window.SFX.play('tick');
      }
      lastPolicyKey = key;
    }

    slider.addEventListener('input', () => {
      setGamma(parseInt(slider.value, 10) || 0, { sfx: true });
    });
    /* Blur after pointer interaction so the arrow keys keep stepping. */
    const unfocus = () => { try { slider.blur(); } catch (e) {} };
    slider.addEventListener('pointerup', unfocus);
    slider.addEventListener('touchend', unfocus);

    /* ---- Step engine ---- */
    const CAPTIONS = [
      'One dial: how much tomorrow counts.',
      'Patience moves the scrap line.',
      'Patient owners replace while she still runs.',
      '',
    ];
    const HINTS = [
      '▶ NEXT: sweep the dial',
      '▶ NEXT: the SHAKY row in numbers',
      '▶ NEXT: take the dial',
      'Drag the dial. NEXT moves on.',
    ];

    function pop(node) {
      if (instantMode()) return;
      node.classList.remove('s13-pop');
      void node.offsetWidth;
      node.classList.add('s13-pop');
    }
    function staggerIn(nodes, ms) {
      nodes.forEach((n, j) => {
        n.classList.remove('s13-stagger');
        void n.offsetWidth;
        n.style.animationDelay = (j * ms) + 'ms';
        n.classList.add('s13-stagger');
      });
    }

    let animToken = 0;

    function sweepDemo(tok) {
      setGamma(0, {});
      let i = 0;
      const timer = setInterval(() => {
        if (tok !== animToken) { clearInterval(timer); return; }
        i++;
        if (i >= HOME) {
          setGamma(HOME, { sfx: true });
          clearInterval(timer);
          return;
        }
        setGamma(i, { sfx: true });
      }, 28);
    }

    function applyStep(o) {
      const opts = o || {};
      animToken++;
      const tok = animToken;

      shakyRow.classList.toggle('s13-hidden', step < 2);
      const locked = step < MAX_STEP;
      slider.disabled = locked;
      knob.classList.toggle('s13-locked', locked);

      /* Guided steps always sit at the course gamma; free play keeps
         whatever the dial says. */
      setGamma(locked ? HOME : (parseInt(slider.value, 10) || 0), {});

      caption.textContent = (step === MAX_STEP)
        ? signpostFor(sweep.length ? sweep[parseInt(slider.value, 10) || 0].policy : [])
        : CAPTIONS[step];
      hint.textContent = HINTS[step];

      shakyChips.forEach((c) => c.classList.remove('s13-stagger'));

      if (!opts.flash || instantMode()) return;
      if (step === 1) sweepDemo(tok);
      if (step === 2) staggerIn(shakyChips, 160);
      if (step === 3) pop(dialRow);
    }

    applyStep({});
    /* Entrance: the strip cells rise in on a fresh build. */
    if (!instantMode()) staggerIn(bandCells, 130);

    return {
      onEnter() {},
      onLeave() {},
      onNextKey() {
        if (step < MAX_STEP) {
          step++;
          applyStep({ flash: true });
          if (window.SFX) window.SFX.play('tick');
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (step > 0) {
          step--;
          applyStep({});
          return true;
        }
        return false;
      },
    };
  };
})();

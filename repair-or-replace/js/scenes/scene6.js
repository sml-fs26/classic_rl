/* Scene 6, "Return over the van's life": earns the RETURN badge.
 *
 *   Part 1 (steps 0-2): the known six-week tape (DATA.demoTrajectory) as a
 *   week-by-week ledger. Step 1 adds the raw sum (+177). Step 2 brings in
 *   the discount: a gamma-power row under the rewards, the weighted
 *   products, and the discounted total G = 166.68 (read from
 *   DATA.demoTrajectory.discountedReturn, never re-rounded differently).
 *
 *   Part 2 (step 3): THE GAMMA SLIDER over DATA.gammaSweep (0.00..0.99,
 *   default 0.90). A 4-cell policy band strip (HEALTHY -> FAILING) re-tints
 *   with the optimal action at the chosen gamma; the RUN|SVC and SVC|NEW
 *   frontiers are drawn as markers between cells and visibly slide LEFT as
 *   patience rises. The SHAKY Q-row is shown numerically so the
 *   REPLACE-overtakes-SERVICE crossover is visible in numbers, not just
 *   colour. Signpost captions are derived from gammaSweep[i].policy itself
 *   (never from hard-coded gamma thresholds).
 *
 *   Step engine: NEXT/RIGHT consumes 3 internal steps, then yields to the
 *   pager. The slider blurs itself after pointer interaction so the arrow
 *   keys keep stepping the deck. No data-run-primary in this scene.
 *   Optional &step=N hash flag jumps to an internal step on cold entry
 *   (used for headless QA captures).
 */
(function () {
  window.scenes = window.scenes || {};

  /* Half-up rounding that survives float dust (306.755 -> 306.76). */
  function round2(x) { return Math.round(x * 100 + 1e-6) / 100; }
  function fmt2(x) { return round2(x).toFixed(2); }
  function fmtSigned2(x) { const r = round2(x); return (r >= 0 ? '+' : '') + r.toFixed(2); }
  function fmtSignedInt(v) { return (v >= 0 ? '+' : '') + v; }
  function fmtSigned1(v) { return (v >= 0 ? '+' : '') + v.toFixed(1); }

  function hashStep(maxStep) {
    const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(maxStep, n)) : 0;
  }
  function instantMode() {
    return /[#&?]run\b/.test(window.location.hash || '') ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  window.scenes.scene6 = function (root) {
    root.classList.add('scene-pad', 'scene6-scene', 'concept-scene');
    if (instantMode()) root.classList.add('s6-instant');
    root.innerHTML = '';

    const D = window.DATA || {};
    const ACT = window.Actions;
    const traj = D.demoTrajectory || {};
    const tape = Array.isArray(traj.steps) ? traj.steps : [];
    const sweep = Array.isArray(D.gammaSweep) ? D.gammaSweep : [];
    const GAMMA = (D.model && D.model.gamma) || (window.Van && window.Van.GAMMA) || 0.9;
    const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
      ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];

    const MAX_STEP = 3;
    let step = hashStep(MAX_STEP);

    function actChipHtml(id) {
      return '<span class="s6-chip-act ' + ACT.toneClass(id) + '">' +
        '<span class="s6-act-ic">' + ACT.leverIconSvg(id) + '</span>' +
        '<span>' + ACT.shortLabel(id) + '</span></span>';
    }

    /* ---- Heading + lede ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = "Return over the van's life";
    root.appendChild(heading);

    const lede = document.createElement('p');
    lede.className = 's6-lede';
    lede.innerHTML = 'One run of the playbook is a tape of weekly money. ' +
      'The <b>RETURN</b> squeezes the whole tape into one number.';
    root.appendChild(lede);

    /* ---- Part 1: the six-week tape ---- */
    const card = document.createElement('div');
    card.className = 's6-tape';
    root.appendChild(card);

    const tapeLabel = document.createElement('div');
    tapeLabel.className = 's6-tape-label';
    tapeLabel.textContent = 'THE SIX-WEEK TAPE FROM THE TRAJECTORY';
    card.appendChild(tapeLabel);

    const grid = document.createElement('div');
    grid.className = 's6-grid';
    grid.style.setProperty('--nw', String(tape.length));
    card.appendChild(grid);

    function row(cls) {
      const r = document.createElement('div');
      r.className = 's6-row' + (cls ? ' ' + cls : '');
      grid.appendChild(r);
      return r;
    }
    function cell(parent, cls, html) {
      const c = document.createElement('div');
      c.className = cls;
      c.innerHTML = html;
      parent.appendChild(c);
      return c;
    }

    /* week header row */
    const rWeek = row();
    cell(rWeek, 's6-rowlab', 'WEEK');
    tape.forEach((st) => cell(rWeek, 's6-wk', 'WK ' + st.i));
    cell(rWeek, 's6-wk s6-wk-total', 'TOTAL');

    /* the call row */
    const rCall = row();
    cell(rCall, 's6-rowlab', 'THE CALL');
    tape.forEach((st) => cell(rCall, 's6-call', actChipHtml(st.action)));
    cell(rCall, 's6-blank', '');

    /* reward row + raw total */
    const rReward = row();
    cell(rReward, 's6-rowlab', 'REWARD');
    tape.forEach((st) => cell(rReward, 's6-num ' + (st.reward >= 0 ? 'pos' : 'neg'),
      fmtSignedInt(st.reward)));
    const rawTotal = cell(rReward, 's6-total s6-raw',
      '<span class="s6-cell-tag">RAW SUM</span>' +
      '<span class="s6-total-val">' + fmtSignedInt(traj.totalReturn || 0) + '</span>');

    /* gamma-power weight row */
    const rWeight = row('s6-row-weight');
    cell(rWeight, 's6-rowlab', 'WEIGHT');
    tape.forEach((st, j) => cell(rWeight, 's6-weight',
      '×' + Math.pow(GAMMA, j).toFixed(2)));
    cell(rWeight, 's6-blank', '');

    /* weighted products row + discounted total */
    const rProd = row('s6-row-prod');
    cell(rProd, 's6-rowlab', 'COUNTS AS');
    tape.forEach((st, j) => {
      const v = st.reward * Math.pow(GAMMA, j);
      cell(rProd, 's6-num s6-prod ' + (v >= 0 ? 'pos' : 'neg'), fmtSigned2(v));
    });
    const gTotal = cell(rProd, 's6-total s6-g',
      '<span class="s6-cell-tag">RETURN G</span>' +
      '<span class="s6-total-val">' + Number(traj.discountedReturn || 0).toFixed(2) + '</span>');

    const caption = document.createElement('p');
    caption.className = 's6-caption';
    card.appendChild(caption);

    /* ---- The return formula (revealed with the weights) ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card s6-formula';
    fcard.innerHTML = '<div class="concept-formula-label">ONE NUMBER FOR THE WHOLE TAPE</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`G \;=\; \sum_{j \ge 0} \gamma^{\,j}\, r_j \qquad\quad \gamma = ` + GAMMA,
      fhost, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = 'Later money counts a little less; gamma is how much.';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Part 2: the gamma slider + policy band strip ---- */
    const knob = document.createElement('div');
    knob.className = 's6-knob';
    root.appendChild(knob);

    const knobTitle = document.createElement('div');
    knobTitle.className = 'poke-section-title s6-knob-title';
    knobTitle.textContent = 'TURN THE PATIENCE KNOB';
    knob.appendChild(knobTitle);

    const sliderRow = document.createElement('div');
    sliderRow.className = 'poke-menu-row s6-gamma-row';
    const sliderLab = document.createElement('span');
    sliderLab.className = 's6-gamma-lab';
    sliderLab.appendChild(document.createTextNode('PATIENCE '));
    sliderLab.appendChild(window.Katex.inline('\\gamma'));
    sliderRow.appendChild(sliderLab);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(Math.max(0, sweep.length - 1));
    slider.step = '1';
    slider.value = '90';
    slider.setAttribute('aria-label', 'discount factor gamma');
    sliderRow.appendChild(slider);
    const sliderVal = document.createElement('output');
    sliderVal.className = 'val';
    sliderRow.appendChild(sliderVal);
    knob.appendChild(sliderRow);

    /* band strip: 4 cells HEALTHY -> FAILING + two frontier markers */
    const bandWrap = document.createElement('div');
    bandWrap.className = 's6-band-wrap';
    knob.appendChild(bandWrap);

    const strip = document.createElement('div');
    strip.className = 's6-band-strip';
    bandWrap.appendChild(strip);
    const bandCells = [];
    const bandActs = [];
    for (let s = 0; s < 4; s++) {
      const c = document.createElement('div');
      c.className = 's6-band-cell';
      const st = document.createElement('span');
      st.className = 's6-band-state';
      st.textContent = STATE_DISPLAY[s];
      const ac = document.createElement('span');
      ac.className = 's6-band-act';
      c.appendChild(st);
      c.appendChild(ac);
      strip.appendChild(c);
      bandCells.push(c);
      bandActs.push(ac);
    }

    function marker(cls, label) {
      const mEl = document.createElement('div');
      mEl.className = 's6-frontier ' + cls;
      mEl.innerHTML = (cls === 'f-top')
        ? '<span class="s6-frontier-lab">' + label + '</span><span class="s6-frontier-line"></span>'
        : '<span class="s6-frontier-line"></span><span class="s6-frontier-lab">' + label + '</span>';
      bandWrap.appendChild(mEl);
      return mEl;
    }
    const mRunSvc = marker('f-top', 'RUN|SVC');
    const mSvcNew = marker('f-bot', 'SVC|NEW');

    /* SHAKY row in numbers */
    const shakyRow = document.createElement('div');
    shakyRow.className = 's6-shaky';
    knob.appendChild(shakyRow);
    const shakyLab = document.createElement('span');
    shakyLab.className = 's6-shaky-lab';
    shakyLab.innerHTML = 'THE <span class="s6-shaky-state">SHAKY</span> ROW AT ';
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
      chip.className = 's6-shaky-chip ' + ACT.toneClass(id);
      chip.innerHTML = '<span class="s6-shaky-star">★</span>' +
        '<span class="s6-shaky-name">' + ACT.shortLabel(id) + '</span>' +
        '<span class="s6-shaky-val"></span>';
      shakyRow.appendChild(chip);
      shakyChips.push(chip);
    });

    const signpost = document.createElement('p');
    signpost.className = 's6-signpost';
    knob.appendChild(signpost);

    const closer = document.createElement('p');
    closer.className = 's6-closer';
    closer.innerHTML = '<b>Patience moves the scrap line.</b> Raise gamma and ' +
      'BOTH frontiers slide LEFT, toward healthier vans.';
    knob.appendChild(closer);

    /* ---- Step hint ---- */
    const hint = document.createElement('div');
    hint.className = 's6-hint';
    root.appendChild(hint);

    /* ---- Slider logic (bands read straight from gammaSweep) ---- */
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
      if (f == null || f <= 0) { node.classList.add('s6-hidden'); return; }
      node.classList.remove('s6-hidden');
      node.style.left = (f * 25) + '%';
    }

    function signpostFor(pol) {
      const hasNew = pol.indexOf('replace') >= 0;
      const newAtShaky = pol[2] === 'replace';
      const svcAtWorn = pol[1] === 'service';
      if (!hasNew) {
        return '<b>MYOPIC:</b> patch it forever, never scrap. A new van costs now and pays later, and later barely counts.';
      }
      if (!newAtShaky) {
        return '<b>Scrap only the dead one.</b> REPLACE takes FAILING; SHAKY still goes to the shop.';
      }
      if (!svcAtWorn) {
        return '<b>The scrap line crosses SHAKY:</b> replace her while she still runs.';
      }
      return '<b>PATIENT:</b> service sooner AND scrap while it still runs. Both calls come earlier.';
    }

    function setGamma(idx, opts) {
      const o = opts || {};
      if (!sweep.length) return;
      const gi = Math.max(0, Math.min(sweep.length - 1, idx | 0));
      const pt = sweep[gi];
      const pol = pt.policy;

      sliderVal.textContent = pt.gamma.toFixed(2);
      shakyGammaVal.textContent = pt.gamma.toFixed(2);

      for (let s = 0; s < 4; s++) {
        bandCells[s].className = 's6-band-cell ' + ACT.toneClass(pol[s]);
        bandActs[s].textContent = ACT.shortLabel(pol[s]);
      }
      placeMarker(mRunSvc, frontierRunSvc(pol));
      placeMarker(mSvcNew, frontierSvcNew(pol));

      /* SHAKY row numbers straight from the sweep (state 2). */
      const q = [pt.Q[2 * 3], pt.Q[2 * 3 + 1], pt.Q[2 * 3 + 2]];
      let k = 0;
      for (let a = 1; a < 3; a++) if (q[a] > q[k]) k = a;
      for (let a = 0; a < 3; a++) {
        shakyChips[a].classList.toggle('s6-best', a === k);
        const valEl = shakyChips[a].querySelector('.s6-shaky-val');
        valEl.textContent = fmtSigned1(q[a]);
        valEl.classList.toggle('neg', q[a] < 0);
      }

      signpost.innerHTML = signpostFor(pol);
      const patient = pol[1] === 'service' && pol[2] === 'replace';
      closer.classList.toggle('s6-hidden', !patient);

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
    const discounted = 'Later money counts a little less; gamma is how much: ' +
      'every week weighs ' + GAMMA + ' of the one before.';
    const CAPTIONS = [
      'Week by week: the call, then the money. Six numbers, in the order they happened.',
      'Add the tape up and the run scored ' + fmtSignedInt(traj.totalReturn || 0) +
        '. But money in week six is not money in week one.',
      discounted,
      discounted,
    ];
    const HINTS = [
      '▶ NEXT: add up the tape',
      '▶ NEXT: weigh the weeks',
      '▶ NEXT: turn the patience knob',
      'Drag the slider across the sweep and watch the frontiers slide. NEXT moves on.',
    ];

    function pop(node) {
      if (instantMode()) return;
      node.classList.remove('s6-pop');
      void node.offsetWidth;
      node.classList.add('s6-pop');
    }

    function applyStep(o) {
      const opts = o || {};
      rawTotal.classList.toggle('s6-veil', step < 1);
      rWeight.classList.toggle('s6-hidden', step < 2);
      rProd.classList.toggle('s6-hidden', step < 2);
      fcard.classList.toggle('s6-hidden', step < 2);
      knob.classList.toggle('s6-hidden', step < 3);
      caption.textContent = CAPTIONS[step];
      hint.textContent = HINTS[step];
      if (opts.flash) {
        if (step === 1) pop(rawTotal);
        if (step === 2) pop(gTotal);
      }
    }

    setGamma(parseInt(slider.value, 10) || 0, {});
    applyStep({});

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

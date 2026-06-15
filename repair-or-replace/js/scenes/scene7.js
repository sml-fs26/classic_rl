/* Scene 7, "Q*: the action scorecard": earns the Q* badge.
 *
 *   Concrete first, formula LAST. Seven internal steps, one idea each,
 *   on the shared QTable widget fed from DATA.Qstar (state*3 + actionIdx):
 *
 *     step 0  empty 4x3 scorecard + the question line + a gamma chip.
 *             No formal definition anywhere on screen.
 *     step 1  HEALTHY row staggers in. "Young van: drive her."
 *     step 2  WORN row. "Worn van: the shop wins."
 *     step 3  SHAKY row; then, as its own delayed beat, the surprise
 *             badge "+23.5 OVER THE SHOP" pops under the van.
 *             No text previews FAILING here.
 *     step 4  FAILING row. "Replace BEFORE dead is the headline."
 *     step 5  the bands column paints, one band at a time.
 *     step 6  ONLY NOW the formal line: Q*(s,a) = E[G | start at s,
 *             make call a, play perfectly after]. G is the return the
 *             student built two scenes back.
 *
 *   Row-by-row reveal = qt.update with a masked array (unrevealed rows 0,
 *   which the widget renders as blank dashes) + suppressFlash. The margin
 *   badge (+23.5) is computed from DATA.Qstar, never hand-typed; an
 *   in-code warning ties DATA.Qstar to live value iteration at gamma 0.9.
 *   render(step) is a pure function of step, so rewind re-renders exactly.
 *
 *   [data-run-primary] = the FILL ALL button, so &run captures the full
 *   board. &step=N hash flag for headless QA. Cold-entry safe.
 */
(function () {
  window.scenes = window.scenes || {};

  const A = 3;
  const NUM_STATES = 4;
  const MAX_STEP = 6;

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

  window.scenes.scene7 = function (root) {
    root.classList.add('scene-pad', 'scene7-scene', 'concept-scene');
    if (instantMode()) root.classList.add('s7-instant');
    root.innerHTML = '';

    const D = window.DATA || {};
    const ACT = window.Actions;
    const GAMMA = (D.model && D.model.gamma) || (window.Van && window.Van.GAMMA) || 0.9;

    /* Q* from DATA (authoritative), with a live fallback for a cold link. */
    let Qstar;
    if (Array.isArray(D.Qstar) && D.Qstar.length === NUM_STATES * A) {
      Qstar = Float64Array.from(D.Qstar);
    } else {
      try {
        const vi = window.Bellman.valueIteration(GAMMA, { tol: 1e-10, maxIters: 600 });
        Qstar = window.Bellman.qFromV(vi.V, GAMMA);
      } catch (e) { Qstar = new Float64Array(NUM_STATES * A); }
    }
    const q = (s, a) => Qstar[s * A + a];

    /* In-code honesty: DATA.Qstar must equal live value iteration at 1dp. */
    try {
      const vi = window.Bellman.valueIteration(GAMMA, { tol: 1e-12, maxIters: 600 });
      const Qcheck = window.Bellman.qFromV(vi.V, GAMMA);
      let maxDiff = 0;
      for (let i = 0; i < Qcheck.length; i++) {
        const r1 = Math.round(Qcheck[i] * 10) / 10;
        maxDiff = Math.max(maxDiff, Math.abs(r1 - Qstar[i]));
      }
      if (maxDiff > 1e-6) console.warn('scene7: DATA.Qstar drift vs Bellman (1dp) =', maxDiff);
    } catch (e) { /* cold entry: skip */ }

    /* REPLACE over SERVICE at SHAKY = the +23.5 surprise. */
    const mShaky = q(2, 2) - q(2, 1);
    const fmtM = (m) => '+' + (Math.round(m * 10 + 1e-6) / 10).toFixed(1);

    let step = hashStep(MAX_STEP);

    /*, Heading, */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'Q*: the action scorecard';
    root.appendChild(heading);

    /*, Panel: van icon | scorecard + bands, */
    const panel = document.createElement('div');
    panel.className = 's7-panel';
    root.appendChild(panel);

    const iconCol = document.createElement('div');
    iconCol.className = 's7-icon-col';
    iconCol.innerHTML = '<div class="s7-icon-label">THE VAN IN PLAY</div>';
    const vanHost = document.createElement('div');
    iconCol.appendChild(vanHost);
    const callout = document.createElement('div');
    callout.className = 's7-callout s7-hidden';
    callout.innerHTML = '<b>' + fmtM(mShaky) + '</b> OVER THE SHOP';
    iconCol.appendChild(callout);
    panel.appendChild(iconCol);
    const van = window.VanCard.mount(vanHost, { wear: 0, size: 'md' });

    const tableCol = document.createElement('div');
    tableCol.className = 's7-table-col';
    const tableLabel = document.createElement('div');
    tableLabel.className = 's7-table-label';
    const labelText = document.createElement('span');
    labelText.textContent = 'THE SCORECARD';
    tableLabel.appendChild(labelText);
    const gammaChip = document.createElement('span');
    gammaChip.className = 's7-gamma-chip';
    gammaChip.appendChild(window.Katex.inline('\\gamma = ' + GAMMA));
    tableLabel.appendChild(gammaChip);
    tableCol.appendChild(tableLabel);
    const tableRow = document.createElement('div');
    tableRow.className = 's7-table-row';
    tableCol.appendChild(tableRow);
    const qHost = document.createElement('div');
    qHost.className = 's7-q';
    tableRow.appendChild(qHost);
    panel.appendChild(tableCol);

    const qt = window.QTable.mount(qHost);

    /* the vertical band strip (step 5) */
    const bands = document.createElement('div');
    bands.className = 's7-bands s7-hidden';
    const bandSpacer = document.createElement('div');
    bandSpacer.className = 's7-bands-spacer';
    bandSpacer.textContent = 'BANDS';
    bands.appendChild(bandSpacer);
    const policyIds = window.QTable.policyFromQ(Qstar);
    const bandCells = [];
    for (let s = 0; s < NUM_STATES; s++) {
      const id = policyIds[s] || 'run';
      const c = document.createElement('div');
      c.className = 's7-band-cell ' + ACT.toneClass(id);
      c.textContent = ACT.shortLabel(id);
      bands.appendChild(c);
      bandCells.push(c);
    }
    tableRow.appendChild(bands);

    /*, The formal line, hidden until the last step, */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card s7-formula s7-hidden';
    fcard.innerHTML = '<div class="concept-formula-label">THE SCORE OF ONE CALL</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\left[\, G \;\middle|\; \text{start at } s,\ \text{make call } a,\ \text{play perfectly after} \,\right]`,
      fhost, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = 'G: the return you built.';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /*, Caption + hint + FILL ALL, */
    const readEl = document.createElement('p');
    readEl.className = 's7-read';
    root.appendChild(readEl);

    const hint = document.createElement('div');
    hint.className = 's7-hint';
    const hintText = document.createElement('span');
    hint.appendChild(hintText);
    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = 'poke-btn s7-fill';
    fillBtn.setAttribute('data-run-primary', '');
    fillBtn.textContent = 'FILL ALL';
    hint.appendChild(fillBtn);
    root.appendChild(hint);

    /*, One short caption per step, no numbers in prose, */
    const CAPTIONS = [
      'One number per cell: what is this call worth here, long run?',
      'Young van: drive her.',
      'Worn van: the shop wins.',
      'She still starts every morning. <b>Scrap her anyway.</b>',
      'Replace <b>BEFORE</b> dead is the headline.',
      'The policy reads straight off the stars.',
      '<b>Twelve numbers decide everything.</b> Next: where they come from.',
    ];
    const WEAR_BY_STEP = [0, 0, 1, 2, 3, 2, 2];

    /*, Reveal machinery, */
    function maskedQ(rows) {
      const Q = new Float64Array(NUM_STATES * A);
      for (let s = 0; s < rows; s++) {
        for (let a = 0; a < A; a++) Q[s * A + a] = Qstar[s * A + a];
      }
      return Q;
    }

    function paintPending(rows) {
      for (let s = 0; s < NUM_STATES; s++) {
        const on = s < rows;
        const lab = qt.getCellNode(s);
        if (lab) lab.classList.toggle('s7-pending', !on);
        for (let a = 0; a < A; a++) {
          qt.cells[s * A + a].classList.toggle('s7-pending', !on);
        }
      }
    }

    function clearFx() {
      for (let i = 0; i < qt.cells.length; i++) {
        qt.cells[i].classList.remove('s7-reveal');
        qt.cells[i].style.animationDelay = '';
      }
      for (let s = 0; s < NUM_STATES; s++) {
        const lab = qt.getCellNode(s);
        if (lab) { lab.classList.remove('s7-reveal'); lab.style.animationDelay = ''; }
        bandCells[s].classList.remove('s7-band-pop');
        bandCells[s].style.animationDelay = '';
      }
      callout.classList.remove('s7-callout-pop');
      fcard.classList.remove('s7-pop-in');
    }

    /* The new row's cells land left to right, ~190 ms apart. */
    function revealRow(s) {
      const lab = qt.getCellNode(s);
      if (lab) { lab.style.animationDelay = '0ms'; lab.classList.add('s7-reveal'); }
      for (let a = 0; a < A; a++) {
        const c = qt.cells[s * A + a];
        c.style.animationDelay = (120 + a * 190) + 'ms';
        c.classList.add('s7-reveal');
      }
      setTimeout(() => {
        if (lab) { lab.classList.remove('s7-reveal'); lab.style.animationDelay = ''; }
        for (let a = 0; a < A; a++) {
          const c = qt.cells[s * A + a];
          c.classList.remove('s7-reveal');
          c.style.animationDelay = '';
        }
      }, 120 + (A - 1) * 190 + 340 + 120);
    }

    /* The badge waits for the SHAKY row, then pops: its own beat. */
    function popCallout() {
      callout.classList.add('s7-callout-pop');
      setTimeout(() => callout.classList.remove('s7-callout-pop'), 850 + 380 + 120);
    }

    function revealBands() {
      for (let s = 0; s < NUM_STATES; s++) {
        bandCells[s].style.animationDelay = (s * 150) + 'ms';
        bandCells[s].classList.add('s7-band-pop');
      }
      setTimeout(() => {
        for (let s = 0; s < NUM_STATES; s++) {
          bandCells[s].classList.remove('s7-band-pop');
          bandCells[s].style.animationDelay = '';
        }
      }, (NUM_STATES - 1) * 150 + 360 + 120);
    }

    function alignBands() {
      /* The strip's top aligns with qHost's top (flex row, flex-start), so
         the spacer must absorb the host's border + padding + header row:
         measure the first row cell's offset from the host top directly. */
      const cell0 = qt.cells[0];
      if (!cell0) return;
      const dy = cell0.getBoundingClientRect().top - qHost.getBoundingClientRect().top;
      bandSpacer.style.height = Math.max(0, Math.round(dy - 3)) + 'px';
      for (let s = 0; s < NUM_STATES; s++) {
        const ref = qt.cells[s * A];
        if (ref) bandCells[s].style.height = ref.offsetHeight + 'px';
      }
    }

    function render(o) {
      const opts = o || {};
      const rows = Math.min(step, 4);
      clearFx();
      qt.update(maskedQ(rows), { suppressFlash: true });
      paintPending(rows);

      van.set(WEAR_BY_STEP[step]);
      callout.classList.toggle('s7-hidden', step !== 3);
      bands.classList.toggle('s7-hidden', step < 5);
      if (step >= 5) requestAnimationFrame(alignBands);
      fcard.classList.toggle('s7-hidden', step < 6);
      labelText.textContent = step >= 6 ? 'Q*(STATE, ACTION)' : 'THE SCORECARD';

      readEl.innerHTML = CAPTIONS[step];
      hintText.textContent = 'STEP ' + (step + 1) + ' / ' + (MAX_STEP + 1);
      fillBtn.disabled = step >= MAX_STEP;

      if (opts.flash && !instantMode()) {
        if (step >= 1 && step <= 4) revealRow(step - 1);
        if (step === 3) popCallout();
        if (step === 5) revealBands();
        if (step === 6) {
          fcard.classList.add('s7-pop-in');
          setTimeout(() => fcard.classList.remove('s7-pop-in'), 460);
        }
      }
    }

    function fillAll() {
      step = MAX_STEP;
      render({});
      if (window.SFX) window.SFX.play('win');
    }
    fillBtn.addEventListener('click', fillAll);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (step >= 5) alignBands(); });
    }
    window.addEventListener('resize', () => { if (step >= 5) alignBands(); });

    render({});

    return {
      onEnter() { render({}); },
      onLeave() {},
      onNextKey() {
        if (step < MAX_STEP) {
          step++;
          render({ flash: true });
          if (window.SFX) window.SFX.play(step >= MAX_STEP ? 'win' : 'tick');
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (step > 0) {
          step--;
          render({});
          return true;
        }
        return false;
      },
    };
  };
})();

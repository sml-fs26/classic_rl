/* Scene 7, "Q*: the action scorecard": earns the Q* badge.
 *
 *   The 12-cell reveal, one internal step per beat, on the shared QTable
 *   widget fed from DATA.Qstar (indexed state*3 + actionIdx):
 *
 *     step 0  empty grid + the definition of Q*.
 *     step 1  HEALTHY row: RUN +311.0 starred.
 *     step 2  WORN row: SERVICE beats RUN by +22.7. The first frontier.
 *     step 3  SHAKY row: THE HEADLINE. REPLACE beats SERVICE by +23.5
 *             although the van still runs; a md VanCard at wear 2 sits
 *             beside the table with the callout. FAILING is one row LOWER
 *             and still hidden: the map says replace BEFORE dead.
 *     step 4  FAILING row: REPLACE again, and RUN is NEGATIVE (-3.1).
 *     step 5  the three bands painted beside the table + the closer.
 *
 *   Row-by-row reveal = qt.update with a masked array (unrevealed rows 0,
 *   which the widget renders as blank dashes) + suppressFlash. Margins
 *   (+22.7, +23.5) are computed from DATA.Qstar, never hand-typed; an
 *   in-code warning ties DATA.Qstar to live value iteration at gamma 0.9.
 *
 *   [data-run-primary] = the FILL ALL button, so &run captures the full
 *   board. Optional &step=N hash flag for headless QA. Cold-entry safe.
 */
(function () {
  window.scenes = window.scenes || {};

  const A = 3;
  const NUM_STATES = 4;

  function fmt1(v) { return (v >= 0 ? '+' : '') + v.toFixed(1); }

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

  window.scenes.scene7 = function (root) {
    root.classList.add('scene-pad', 'scene7-scene', 'concept-scene');
    if (instantMode()) root.classList.add('s7-instant');
    root.innerHTML = '';

    const D = window.DATA || {};
    const ACT = window.Actions;
    const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
      ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];
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

    const mWorn = q(1, 1) - q(1, 0);     /* SERVICE over RUN at WORN  = 22.7 */
    const mShaky = q(2, 2) - q(2, 1);    /* REPLACE over SERVICE at SHAKY = 23.5 */
    const fmtM = (m) => '+' + (Math.round(m * 10 + 1e-6) / 10).toFixed(1);

    const MAX_STEP = 5;
    let step = hashStep(MAX_STEP);

    /* ---- Heading ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'Q*: the action scorecard';
    root.appendChild(heading);

    /* ---- Q* formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">THE SCORE OF ONE CALL</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \max_{\pi}\; \mathbb{E}\!\left[\, G \mid s_1 = s,\; a_1 = a \,\right]`,
      fhost, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = 'Q*(s, a): the long-run discounted money of making call a ' +
      'in state s, then playing perfectly. G is the return from the last scene.';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Panel: van icon | scorecard + bands ---- */
    const panel = document.createElement('div');
    panel.className = 's7-panel';
    root.appendChild(panel);

    const iconCol = document.createElement('div');
    iconCol.className = 's7-icon-col';
    iconCol.innerHTML = '<div class="s7-icon-label">THE VAN IN PLAY</div>';
    const vanHost = document.createElement('div');
    iconCol.appendChild(vanHost);
    const iconCaption = document.createElement('div');
    iconCaption.className = 's7-icon-caption';
    iconCol.appendChild(iconCaption);
    const callout = document.createElement('div');
    callout.className = 's7-callout';
    callout.innerHTML = 'SCRAP HER ANYWAY:<br><b>' + fmtM(mShaky) + '</b> OVER THE SHOP';
    iconCol.appendChild(callout);
    panel.appendChild(iconCol);
    const van = window.VanCard.mount(vanHost, { wear: 0, size: 'md' });

    const tableCol = document.createElement('div');
    tableCol.className = 's7-table-col';
    const tableLabel = document.createElement('div');
    tableLabel.className = 's7-table-label';
    tableLabel.appendChild(document.createTextNode('Q*(STATE, ACTION) AT '));
    tableLabel.appendChild(window.Katex.inline('\\gamma = ' + GAMMA));
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
    bands.className = 's7-bands';
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

    /* ---- Read-out + hint + closer ---- */
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

    const note = document.createElement('p');
    note.className = 's7-note';
    note.innerHTML = 'The scrap zone is <b>two rows wide</b>. The surprise is not that a ' +
      'dead van gets replaced; it is that a running one does. Next: where do these ' +
      'twelve numbers come from?';
    root.appendChild(note);

    /* ---- Copy per step (numbers interpolated from DATA.Qstar) ---- */
    const READOUTS = [
      'The empty scorecard. Each cell gets one number: the long-run discounted money ' +
        'of that call in that state, played perfectly afterwards. ' +
        '<b>Twelve numbers decide everything.</b>',
      '<b>HEALTHY:</b> RUN ' + fmt1(q(0, 0)) + ' takes the star, ahead of SERVICE ' +
        fmt1(q(0, 1)) + ' and REPLACE ' + fmt1(q(0, 2)) + '. Young van: drive her.',
      '<b>WORN:</b> SERVICE ' + fmt1(q(1, 1)) + ' beats RUN ' + fmt1(q(1, 0)) +
        '. The first frontier: one level of wear and the shop already beats the road, ' +
        'by <b>' + fmtM(mWorn) + '</b>.',
      '<b>SHAKY: the headline.</b> REPLACE ' + fmt1(q(2, 2)) + ' beats SERVICE ' +
        fmt1(q(2, 1)) + ' beats RUN ' + fmt1(q(2, 0)) + '. She still starts every ' +
        'morning; the map says scrap her anyway, <b>' + fmtM(mShaky) + '</b> over the ' +
        'shop. And FAILING sits one row lower, still face down: replace BEFORE dead.',
      '<b>FAILING:</b> REPLACE ' + fmt1(q(3, 2)) + ' again, and RUN goes negative: ' +
        '<b class="s7-neg">' + fmt1(q(3, 0)) + '</b>, the only red cell on the board. ' +
        'Driving a dead van loses money on average.',
      'Three bands, painted: RUN, then SVC, then NEW NEW. The policy reads straight ' +
        'off the stars: <b>run it young, shop it worn, scrap it from shaky down.</b> ' +
        'The asymmetry is the lesson: the scrap zone is wide.',
    ];
    const ICON_CAPTIONS = [
      'OLD BESSIE waits on the verdict.',
      '<b>HEALTHY:</b> drive her.',
      '<b>WORN:</b> into the shop.',
      '<b>SHAKY:</b> she still starts every morning.',
      '<b>FAILING:</b> driving her loses money.',
      '<b>SHAKY</b> is the line: replace BEFORE dead.',
    ];
    const WEAR_BY_STEP = [0, 0, 1, 2, 3, 2];

    /* ---- Reveal machinery ---- */
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

    function flashRow(s) {
      if (instantMode()) return;
      for (let a = 0; a < A; a++) {
        const cellEl = qt.cells[s * A + a];
        cellEl.classList.remove('s7-just-filled');
        void cellEl.offsetWidth;
        cellEl.classList.add('s7-just-filled');
        setTimeout(() => cellEl.classList.remove('s7-just-filled'), 760);
      }
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
      qt.update(maskedQ(rows), { suppressFlash: true });
      paintPending(rows);

      van.set(WEAR_BY_STEP[step]);
      iconCaption.innerHTML = ICON_CAPTIONS[step];
      callout.classList.toggle('s7-hidden', step !== 3);

      bands.classList.toggle('s7-hidden', step < 5);
      if (step >= 5) requestAnimationFrame(alignBands);

      readEl.innerHTML = READOUTS[step];
      note.classList.toggle('s7-hidden', step < 5);

      if (step < 4) {
        hintText.textContent = 'ROWS ' + rows + '/4 ON THE BOARD. NEXT reveals ' +
          STATE_DISPLAY[rows] + '.';
      } else if (step === 4) {
        hintText.textContent = 'ROWS 4/4 ON THE BOARD. NEXT paints the three bands.';
      } else {
        hintText.textContent = 'Scorecard complete. NEXT moves on.';
      }

      if (opts.flash && step >= 1 && step <= 4) flashRow(step - 1);
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

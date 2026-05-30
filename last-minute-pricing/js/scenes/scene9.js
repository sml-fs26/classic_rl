/* Scene 9 -- Fill Q* by dynamic programming.
 *
 *   Because the demand odds are PRINTED on every lever, P is known, so we can
 *   compute Q* exactly by sweeping the Bellman backup. The 5x4 board fills
 *   COLUMN BY COLUMN, right (d=1) to left (d=4): the deadline-adjacent column
 *   first (pure one-day payoffs, no future), then d=2 reusing the d=1 answers,
 *   and so on, converging in exactly 4 sweeps (one per day-to-deadline). As
 *   cells lock, the QTable's optimal-lever overlay paints the three coloured
 *   regions + the diagonal seam.
 *
 *   The per-column Q* is computed live via window.Pricing.successors + the
 *   Bellman max-backup (the same arithmetic as window.Bellman / DATA.Qstar),
 *   so no value is hand-typed. The final filled board reproduces DATA.Qstar
 *   exactly.
 *
 *   STEP COLUMN / RUN ALL / RESET drive the sweeps; &run auto-fills for
 *   headless capture. Contract:
 *     window.scenes.scene9 = function(root){ ...; return {...}; }
 *   Cold-entry safe: rebuilds from window.Pricing / window.Levers / DATA. */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const P = window.Pricing;
  const L = window.Levers;
  const LEVER_IDS = L.LEVER_IDS;            // [premium, standard, firesale]
  const A = LEVER_IDS.length;               // 3
  const N = P.N;                            // 20
  const NUM_DAYS = P.NUM_DAYS;              // 4
  const NUM_UNITS = P.NUM_UNITS;            // 5

  /* Backward induction: solve the board one day-column at a time, from the
     deadline (d=1) outward to d=NUM_DAYS. Returns, for each sweep s (0..D-1),
     a "partial" Q array of length N*A whose only nonzero rows are the cells in
     day-columns d = 1..(s+1) (the columns solved so far). Cells not yet solved
     stay 0 -> the QTable draws them 'unvisited'. */
  function buildColumnFills() {
    const V = new Float64Array(N);          // running optimal value (terminals are 0)
    const fullQ = new Float64Array(N * A);  // the converged Q* (built up day by day)

    function qOf(state, leverId) {
      let q = 0;
      for (const { sNext, p, reward } of P.successors(state, leverId)) {
        const vN = sNext.terminal ? 0 : V[P.stateIndex(sNext)];
        q += p * (reward + vN);
      }
      return q;
    }

    const fills = [];     // fills[sweepIdx] = { d, Qview (snapshot), solvedMask }
    const solvedMask = new Array(N).fill(false);

    for (let d = 1; d <= NUM_DAYS; d++) {
      /* Solve every unit-level for this day-column using the V already
         computed for the shorter-horizon columns to the right. */
      for (let u = 1; u <= NUM_UNITS; u++) {
        const s = { u: u, d: d, terminal: false };
        const si = P.stateIndex(s);
        let best = -Infinity;
        for (let a = 0; a < A; a++) {
          const q = qOf(s, LEVER_IDS[a]);
          fullQ[si * A + a] = q;
          if (q > best) best = q;
        }
        V[si] = best;
        solvedMask[si] = true;
      }
      /* Snapshot: only the solved cells carry values; the rest are 0. */
      const Qview = new Float64Array(N * A);
      for (let i = 0; i < N; i++) {
        if (!solvedMask[i]) continue;
        for (let a = 0; a < A; a++) Qview[i * A + a] = fullQ[i * A + a];
      }
      fills.push({ d: d, Qview: Qview, solvedMask: solvedMask.slice() });
    }
    return { fills: fills, fullQ: fullQ };
  }

  window.scenes.scene9 = function (root) {
    root.className = 'scene-pad scene9';
    root.innerHTML = '';

    /* ---- Heading ---- */
    const h = document.createElement('h2');
    h.className = 's9-heading';
    h.textContent = T('scene9.title');
    root.appendChild(h);

    /* ---- Manager lede ---- */
    const lede = document.createElement('p');
    lede.className = 's9-lede';
    lede.innerHTML = T('scene9.lede');
    root.appendChild(lede);

    /* ---- Premise (we know P) ---- */
    const premise = document.createElement('p');
    premise.className = 's9-premise';
    premise.innerHTML = T('scene9.premise');
    root.appendChild(premise);

    /* ---- Bellman card ---- */
    const fcard = document.createElement('div');
    fcard.className = 's9-formula-card';
    const flabel = document.createElement('div');
    flabel.className = 's9-formula-label';
    flabel.textContent = T('scene9.formula.label');
    fcard.appendChild(flabel);
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    const bellmanTex = (window.DATA && window.DATA.tex && window.DATA.tex.bellman) ||
      String.raw`Q^{*}(s,a) \;=\; \mathbb{E}\,[\, R + \max_{a'} Q^{*}(S',a') \,]`;
    window.Katex.render(bellmanTex, fhost, true);
    root.appendChild(fcard);

    /* ---- Controls + status (sticky bar) ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's9-controls-row';
    ctrls.innerHTML =
      '<div class="poke-menu-row s9-controls">' +
        '<button id="s9-step">'  + T('scene9.btn.step')  + '</button>' +
        '<button id="s9-run">'   + T('scene9.btn.run')   + '</button>' +
        '<button id="s9-reset">' + T('scene9.btn.reset') + '</button>' +
      '</div>' +
      '<div class="s9-status">' +
        T('scene9.status.sweep') + ' <b id="s9-sweep">0 / ' + NUM_DAYS + '</b> &middot; ' +
        T('scene9.status.filled') + ' <b id="s9-fillc">0 / ' + N + '</b>' +
      '</div>';
    root.appendChild(ctrls);

    /* ---- Row: board + side panel ---- */
    const row = document.createElement('div');
    row.className = 's9-row';
    root.appendChild(row);

    const qHost = document.createElement('div');
    qHost.className = 's9-q';
    row.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const panel = document.createElement('div');
    panel.className = 's9-panel poke-box tight';
    row.appendChild(panel);

    /* ---- Bridge footer ---- */
    const bridge = document.createElement('div');
    bridge.className = 's9-bridge';
    bridge.innerHTML = T('scene9.bridge');
    root.appendChild(bridge);

    /* ---- Compute the column fills once ---- */
    const { fills, fullQ } = buildColumnFills();
    const D = fills.length;     // = NUM_DAYS = 4

    /* Map each solved day-column index (0..3) to its narration key. */
    const COL_NARR = ['scene9.col.d1', 'scene9.col.d2', 'scene9.col.d3', 'scene9.col.d4'];

    let sweepIdx = -1;          // -1 = nothing filled

    function paintColumnHighlight(d) {
      /* Outline the cells of day-column d that just locked in. */
      for (let s = 0; s < N; s++) {
        const cell = qtbl.getCellNode(s);
        if (!cell) continue;
        const isCol = (parseInt(cell.dataset.d, 10) === d);
        cell.classList.toggle('s9-just-locked', isCol);
        if (isCol) setTimeout(() => cell && cell.classList.remove('s9-just-locked'), 760);
      }
    }

    function renderPanel(titleHtml, bodyHtml, footHtml) {
      let html = '<div class="s9-panel-title">' + titleHtml + '</div>';
      html += '<div class="s9-panel-body">' + bodyHtml + '</div>';
      if (footHtml) html += '<div class="s9-panel-foot">' + footHtml + '</div>';
      panel.innerHTML = html;
    }

    function applySweep(i, opts) {
      const o = opts || {};
      const fill = fills[i];
      qtbl.update(fill.Qview, { suppressFlash: !!o.suppressFlash });

      /* Dim cells not yet solved. */
      for (let s = 0; s < N; s++) {
        const cell = qtbl.getCellNode(s);
        if (!cell) continue;
        cell.classList.toggle('s9-pending', !fill.solvedMask[s]);
      }
      if (!o.suppressFlash) paintColumnHighlight(fill.d);

      /* Narration. */
      const sweepNo = i + 1;
      const dWord = fill.d === 1 ? 'scene9.col.title' : 'scene9.col.titlePlural';
      renderPanel(
        T(dWord, { n: sweepNo, d: fill.d }),
        T(COL_NARR[i])
      );

      /* If this was the last sweep, show the converged summary instead. */
      if (i === D - 1) {
        const counts = window.QTable.leverCounts(fullQ);
        renderPanel(
          T('scene9.done.title'),
          T('scene9.done.body'),
          T('scene9.done.counts', {
            fire: counts.firesale, std: counts.standard, prem: counts.premium,
          })
        );
      }

      /* Status. */
      const filledCount = fill.solvedMask.filter(Boolean).length;
      document.getElementById('s9-sweep').textContent = sweepNo + ' / ' + D;
      document.getElementById('s9-fillc').textContent = filledCount + ' / ' + N;
    }

    function step() {
      if (sweepIdx >= D - 1) return;
      sweepIdx++;
      applySweep(sweepIdx, {});
    }

    function runAll() {
      while (sweepIdx < D - 1) {
        sweepIdx++;
        applySweep(sweepIdx, { suppressFlash: sweepIdx < D - 1 });
      }
    }

    function reset() {
      sweepIdx = -1;
      qtbl.reset();
      qtbl.update(new Float64Array(N * A), { suppressFlash: true });
      for (let s = 0; s < N; s++) {
        const cell = qtbl.getCellNode(s);
        if (cell) { cell.classList.add('s9-pending'); cell.classList.remove('s9-just-locked'); }
      }
      renderPanel(T('scene9.ready.title'), T('scene9.ready.body'));
      document.getElementById('s9-sweep').textContent = '0 / ' + D;
      document.getElementById('s9-fillc').textContent = '0 / ' + N;
    }

    document.getElementById('s9-step').addEventListener('click', () => { step(); if (window.SFX) window.SFX.play('cursor'); });
    document.getElementById('s9-run').addEventListener('click', () => { runAll(); if (window.SFX) window.SFX.play('hit'); });
    document.getElementById('s9-reset').addEventListener('click', () => { reset(); if (window.SFX) window.SFX.play('cursor'); });

    /* Initial state. */
    reset();

    /* &run: auto-fill for headless capture. */
    if (window.PRICING_AUTORUN) setTimeout(runAll, 220);

    return {
      onEnter() {
        /* Re-apply current sweep so the visual state is consistent on re-entry. */
        if (sweepIdx < 0) reset(); else applySweep(sweepIdx, { suppressFlash: true });
      },
      /* Right arrow = advance one column (matches STEP). Once the board is
         fully solved, yield so the student can advance scenes. */
      onNextKey() {
        if (sweepIdx < D - 1) { step(); return true; }
        return false;
      },
      onPrevKey() { return false; },
    };
  };
})();

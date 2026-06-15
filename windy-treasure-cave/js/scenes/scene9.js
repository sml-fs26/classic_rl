/* Scene 9 -- Dynamic programming: fill Q*.
 *   Because P is known (the wind odds are printed), we solve it: repeatedly
 *   apply the Bellman backup to every tile and watch the value overlay
 *   converge. STEP (one sweep) and RUN ALL. The warm heat floods OUTWARD from
 *   the gold tile; a cold danger crater sets around the pit; after a handful of
 *   sweeps the arrow field locks in, visibly BENDING around the pit. Uses the
 *   precomputed per-sweep snapshots. Cold-entry safe; honours &run (RUN ALL). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;
  const A = (D.actionIds || ['UP', 'DOWN', 'LEFT', 'RIGHT']).length;
  const snaps = (D.valueIteration && D.valueIteration.snapshots) || [];

  /* Turn a flat snapshot (V[23], Q[23*4], solved[23]) into 5x5 grids. */
  function gridsFor(snap) {
    const vg = [], ag = [], mg = [];
    for (let r = 0; r < C.ROWS; r++) { vg.push([]); ag.push([]); mg.push([]); for (let c = 0; c < C.COLS; c++) { vg[r].push(null); ag[r].push(null); mg[r].push(false); } }
    for (let i = 0; i < C.NON_TERMINAL_STATES.length; i++) {
      const t = C.NON_TERMINAL_STATES[i];
      const solved = snap.solved[i];
      mg[t.row][t.col] = solved;
      if (!solved) continue;
      vg[t.row][t.col] = snap.V[i];
      /* argmax heading from the snapshot Q */
      let best = -Infinity, k = 0;
      for (let a = 0; a < A; a++) { const q = snap.Q[i * A + a]; if (q != null && q > best) { best = q; k = a; } }
      ag[t.row][t.col] = (D.actionIds || ['UP', 'DOWN', 'LEFT', 'RIGHT'])[k];
    }
    return { vg, ag, mg };
  }

  window.scenes.scene9 = function (root) {
    root.className = 'scene scene-pad sc9';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene9.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene9.lede') + '</p>' +
      '<div class="formula-card sc9-formula"><div class="formula-label">' + T('scene9.formulaLabel') + '</div><div class="sc9-formula-host"></div></div>' +
      '<div class="wtc-btn-row sc9-ctrls">' +
        '<button class="wtc-btn primary sc9-step" type="button">' + T('scene9.step') + '</button>' +
        '<button class="wtc-btn sc9-run" type="button">' + T('scene9.run') + '</button>' +
        '<button class="wtc-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '<span class="sc9-status muted">' + T('scene9.sweep') + ' <b id="sc9-sweep">0</b> · <b id="sc9-solved">0</b>/' + C.N + ' ' + T('scene9.solved') + '</span>' +
      '</div>' +
      '<div class="wtc-btn-row sc9-view">' +
        '<button class="wtc-btn sc9-view-both primary" type="button">' + T('scene9.viewBoth') + '</button>' +
        '<button class="wtc-btn sc9-view-val" type="button">' + T('scene9.viewVal') + '</button>' +
        '<button class="wtc-btn sc9-view-arr" type="button">' + T('scene9.viewArr') + '</button>' +
      '</div>' +
      '<div class="scene-row sc9-row">' +
        '<div class="sc9-left"><div class="sc9-board-host"></div></div>' +
        '<div class="sc9-right scene-col grow"><div class="poke-box sc9-panel" id="sc9-panel"></div></div>' +
      '</div>' +
      '<div class="poke-box sc9-framing">' + T('scene9.framing') + '</div>';

    window.Katex.render(D.tex && D.tex.bellman ? D.tex.bellman : 'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]', root.querySelector('.sc9-formula-host'), true);
    const board = window.CaveBoard.mount(root.querySelector('.sc9-board-host'), { size: 'md' });

    let idx = 0, runTimer = null, view = 'both';

    function applyView() {
      board.clearValues(); board.clearArrows();
      const { vg, ag, mg } = gridsFor(snaps[idx]);
      if (view === 'val' || view === 'both') board.setValues(vg, { decimals: 1 });
      if (view === 'arr' || view === 'both') board.setArrows(ag, { ties: idx === snaps.length - 1 ? D.tieGrid : null });
      board.setSolved(mg);
    }
    function apply(i, opt) {
      idx = Math.max(0, Math.min(snaps.length - 1, i));
      const snap = snaps[idx];
      const oo = opt || {};
      const solvedCount = snap.solved.filter(Boolean).length;
      applyView();
      if (oo.animate) { const { ag } = gridsFor(snap); board.setArrows(view === 'val' ? blank() : ag, { animate: true, ties: idx === snaps.length - 1 ? D.tieGrid : null }); }
      root.querySelector('#sc9-sweep').textContent = String(snap.sweep);
      root.querySelector('#sc9-solved').textContent = String(solvedCount);
      const panel = root.querySelector('#sc9-panel');
      if (idx === 0) panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.ready.title') + '</div><div>' + T('scene9.ready.body') + '</div>';
      else if (idx === snaps.length - 1) panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.done.title') + '</div><div>' + T('scene9.done.body') + '</div>';
      else panel.innerHTML = '<div>' + T('scene9.sweepInfo', { n: snap.sweep, k: solvedCount }) + '</div>';
    }
    function blank() { const g = []; for (let r = 0; r < C.ROWS; r++) { g.push([]); for (let c = 0; c < C.COLS; c++) g[r].push(null); } return g; }

    function step() { if (idx < snaps.length - 1) apply(idx + 1, { animate: true }); }
    function runAll() {
      if (runTimer) { clearTimeout(runTimer); runTimer = null; }
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.WTC && window.WTC.run)) { apply(snaps.length - 1, { animate: true }); return; }
      function tick() { if (idx >= snaps.length - 1) return; apply(idx + 1, {}); runTimer = setTimeout(tick, 320); }
      tick();
    }
    function reset() { if (runTimer) { clearTimeout(runTimer); runTimer = null; } apply(0, {}); }

    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-run').addEventListener('click', runAll);
    root.querySelector('.sc9-reset').addEventListener('click', reset);
    root.querySelector('.sc9-view-both').addEventListener('click', () => { view = 'both'; setViewBtns(); applyView(); });
    root.querySelector('.sc9-view-val').addEventListener('click', () => { view = 'val'; setViewBtns(); applyView(); });
    root.querySelector('.sc9-view-arr').addEventListener('click', () => { view = 'arr'; setViewBtns(); applyView(); });
    function setViewBtns() {
      root.querySelector('.sc9-view-both').classList.toggle('primary', view === 'both');
      root.querySelector('.sc9-view-val').classList.toggle('primary', view === 'val');
      root.querySelector('.sc9-view-arr').classList.toggle('primary', view === 'arr');
    }

    apply(0, {});
    if (window.WTC && window.WTC.run) setTimeout(() => apply(snaps.length - 1, { animate: true }), 150);

    return {
      onLeave() { if (runTimer) { clearTimeout(runTimer); runTimer = null; } },
      onEnter() { apply(idx, {}); },
      onNextKey() { if (idx < snaps.length - 1) { step(); return true; } return false; },
      onPrevKey() { if (idx > 0) { apply(idx - 1, {}); return true; } return false; },
    };
  };
})();

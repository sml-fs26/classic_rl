/* Scene 9 -- Dynamic programming: fill Q*. Because the buy-meter is posted, P is
   known and we can compute the scorecard exactly. "Run the backups" sweeps the
   Bellman equation over all 15 states; the display case fills band by band:
   STALE locks RED first (the spoilage cliff is obvious), then the OLD/AGING
   amber band, then the FRESH/OK green cap. A max-change chip ticks toward zero;
   it settles in ~16 sweeps. STEP / RUN ALL / RESET. Reads
   DATA.valueIteration.snapshots. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const B = window.Bakery;
  const N = B.N, A = (window.Levers && window.Levers.LEVER_IDS.length) || 3;
  const snaps = (D.valueIteration && D.valueIteration.snapshots) || [];

  window.scenes.scene9 = function (root) {
    root.className = 'scene scene-pad sc9';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene9.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene9.lede') + '</p>' +
      '<div class="formula-card compact sc9-formula"><div class="formula-label">' + T('scene9.formulaLabel') + '</div><div id="sc9-f"></div></div>' +
      '<div class="gr-btn-row sc9-ctrls">' +
        '<button class="poke-btn primary sc9-step" type="button">' + T('scene9.step') + '</button>' +
        '<button class="poke-btn sc9-run" type="button">' + T('scene9.run') + '</button>' +
        '<button class="poke-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '<span class="sc9-status muted">' + T('scene9.sweep') + ' <b id="sc9-sweep">0</b> · ' +
          '<b id="sc9-stable">0</b> / ' + N + ' ' + T('scene9.stable') + '</span>' +
      '</div>' +
      '<div class="scene-row sc9-row">' +
        '<div class="sc9-board-host" id="sc9-board"></div>' +
        '<div class="sc9-panel poke-box grow" id="sc9-panel"></div>' +
      '</div>' +
      '<div class="poke-box sc9-framing">' + T('scene9.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\gamma \\max_{a\'} Q^{*}(S\',a\')]', root.querySelector('#sc9-f'), true);

    const board = window.Board.mount(root.querySelector('#sc9-board'), { variant: 'qtable', showValues: true, legend: true });
    const panel = root.querySelector('#sc9-panel');

    let idx = 0;
    function apply(i, opts) {
      idx = Math.max(0, Math.min(snaps.length - 1, i));
      const snap = snaps[idx]; if (!snap) return;
      const oo = opts || {};
      const Qview = new Array(N * A);
      for (let si = 0; si < N; si++) {
        const solved = snap.solved[si];
        for (let a = 0; a < A; a++) {
          const v = snap.Q[si * A + a];
          Qview[si * A + a] = solved ? v : 0;
        }
        board.setSolved(si, solved);
      }
      board.paintQ(Qview, { suppressFlash: !!oo.suppressFlash });
      const stableCount = snap.solved.filter(Boolean).length;
      root.querySelector('#sc9-sweep').textContent = String(snap.sweep);
      root.querySelector('#sc9-stable').textContent = String(stableCount);
      if (idx === 0) panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.ready.title') + '</div><div class="sc9-panel-body">' + T('scene9.ready.body') + '</div>';
      else if (idx === snaps.length - 1) panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.done.title') + '</div><div class="sc9-panel-body">' + T('scene9.done.body') + '</div>';
      else panel.innerHTML = '<div class="sc9-panel-body">' + T('scene9.sweepInfo', { n: snap.sweep, k: stableCount }) + '</div>';
    }
    function step() { if (idx < snaps.length - 1) { apply(idx + 1, {}); if (window.SFX) window.SFX.play('tick'); } }
    function runAll() {
      let i = idx;
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.SBS && window.SBS.run)) { apply(snaps.length - 1, { suppressFlash: false }); return; }
      function tick() { if (i >= snaps.length - 1) return; i++; apply(i, { suppressFlash: false }); if (i < snaps.length - 1) setTimeout(tick, 360); }
      tick();
    }
    function reset() { apply(0, { suppressFlash: true }); }

    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-run').addEventListener('click', runAll);
    root.querySelector('.sc9-reset').addEventListener('click', reset);

    apply(0, { suppressFlash: true });
    if (window.SBS && window.SBS.run) setTimeout(() => apply(snaps.length - 1, { suppressFlash: false }), 150);

    return {
      onEnter() { apply(idx, { suppressFlash: true }); },
      onNextKey() { if (idx < snaps.length - 1) { step(); return true; } return false; },
      onPrevKey() { if (idx > 0) { apply(idx - 1, { suppressFlash: true }); return true; } return false; },
    };
  };
})();

/* Scene 9, Dynamic programming. Because P is known (the dice odds are printed)
   and the trial has a hard deadline, we solve it RIGHT TO LEFT: the day-1 column
   is one line of arithmetic each (every next state just expires at 0), and each
   earlier column is computed from the column to its right. Watch the 5x5 Q-grid
   fill in COLUMN BY COLUMN (day 1 -> day 5) from the precomputed sweep snapshots,
   the starred optimal lever appearing until the full staircase emerges (NUDGE
   teal top-left, PUSH gold on the right + top, the lone grey DO-NOTHING corner).
   STEP / RUN ALL / RESET drive the sweeps. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const N = (window.Trial && window.Trial.N) || 25;
  const A = (window.Levers && window.Levers.LEVER_IDS.length) || 3;
  const snaps = (D.valueIteration && D.valueIteration.snapshots) || [];

  window.scenes.scene9 = function (root) {
    root.className = 'scene scene-pad sc9';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene9.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene9.lede') + '</p>' +
      '<div class="formula-card sc9-formula">' +
        '<div class="formula-label">' + T('scene9.formulaLabel') + '</div>' +
        '<div class="sc9-formula-host"></div>' +
      '</div>' +
      '<div class="tc-btn-row sc9-ctrls">' +
        '<button class="tc-btn sc9-step primary" type="button">' + T('scene9.step') + '</button>' +
        '<button class="tc-btn sc9-run" type="button">' + T('scene9.run') + '</button>' +
        '<button class="tc-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '<span class="sc9-status muted">' + T('scene9.sweep') + ' <b id="sc9-sweep">0</b> · ' +
          '<b id="sc9-solved">0</b> / ' + N + ' ' + T('scene9.solved') + '</span>' +
      '</div>' +
      '<div class="scene-row sc9-row">' +
        '<div class="sc9-board-host"></div>' +
        '<div class="sc9-panel poke-box grow" id="sc9-panel"></div>' +
      '</div>' +
      '<div class="poke-box sc9-framing">' + T('scene9.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]',
      root.querySelector('.sc9-formula-host'), true);

    const board = window.Board.mount(root.querySelector('.sc9-board-host'), { variant: 'qtable', legend: true });
    const panel = root.querySelector('#sc9-panel');

    let idx = 0;

    function apply(i, opts) {
      idx = Math.max(0, Math.min(snaps.length - 1, i));
      const snap = snaps[idx];
      const oo = opts || {};
      /* zero out unsolved cells so they render 'unsolved' (grey wells). */
      const Qview = new Array(N * A);
      const mask = new Array(N);
      for (let si = 0; si < N; si++) {
        const solved = snap.solved[si];
        mask[si] = solved;
        for (let a = 0; a < A; a++) {
          const v = snap.Q[si * A + a];
          Qview[si * A + a] = solved ? v : (v == null ? null : 0);
        }
      }
      board.setSolvedMask(mask);
      board.update(Qview, { suppressFlash: !!oo.suppressFlash });
      const solvedCount = snap.solved.filter(Boolean).length;
      root.querySelector('#sc9-sweep').textContent = String(snap.sweep);
      root.querySelector('#sc9-solved').textContent = String(solvedCount);

      if (idx === 0) {
        panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.ready.title') + '</div>' +
          '<div class="sc9-panel-body">' + T('scene9.ready.body') + '</div>';
      } else if (idx === snaps.length - 1) {
        panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.done.title') + '</div>' +
          '<div class="sc9-panel-body">' + T('scene9.done.body') + '</div>';
      } else {
        panel.innerHTML = '<div class="sc9-panel-body">' + T('scene9.sweepInfo', { n: snap.sweep, k: solvedCount }) + '</div>';
      }
    }

    function step() { if (idx < snaps.length - 1) apply(idx + 1, {}); }
    function runAll() {
      let i = idx;
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.TC && window.TC.run)) { apply(snaps.length - 1, { suppressFlash: false }); return; }
      function tick() {
        if (i >= snaps.length - 1) return;
        i++; apply(i, { suppressFlash: false });
        if (i < snaps.length - 1) setTimeout(tick, 620);
      }
      tick();
    }
    function reset() { apply(0, { suppressFlash: true }); }

    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-run').addEventListener('click', runAll);
    root.querySelector('.sc9-reset').addEventListener('click', reset);

    apply(0, { suppressFlash: true });
    if (window.TC && window.TC.run) setTimeout(() => apply(snaps.length - 1, { suppressFlash: false }), 150);

    return {
      onEnter() { apply(idx, { suppressFlash: true }); },
      onNextKey() { if (idx < snaps.length - 1) { step(); return true; } return false; },
      onPrevKey() { if (idx > 0) { apply(idx - 1, { suppressFlash: true }); return true; } return false; },
    };
  };
})();

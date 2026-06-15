/* Scene 9 -- Dynamic programming. Because P is known (the failure odds + aging
   are printed), we compute Q* exactly by sweeping the Bellman backup. The 3x3
   grid fills region by region (precomputed sweep snapshots in
   window.DATA.valueIteration): HEALTHY locks to RUN almost immediately, the
   empty-bin AGING/FAILING cells settle on ORDER, the spare-in-hand cells settle
   on REPLACE -- the twist heat-map draws itself. STEP / RUN ALL / RESET drive
   the sweeps. Cold-entry safe; honours &run (auto RUN ALL). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const D = window.DATA || {};
  const N = M.N;
  const A = (window.Levers && window.Levers.LEVER_IDS.length) || 3;
  const NS = M.NS;
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
      '<div class="cs-btn-row sc9-ctrls">' +
        '<button class="cs-btn sc9-step primary" type="button">' + T('scene9.step') + '</button>' +
        '<button class="cs-btn sc9-run" type="button">' + T('scene9.run') + '</button>' +
        '<button class="cs-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '<span class="sc9-status muted">' + T('scene9.sweep') + ' <b id="sc9-sweep">0</b> · ' +
          '<b id="sc9-stable">0</b> / ' + N + ' ' + T('scene9.stable') + '</span>' +
      '</div>' +
      '<div class="scene-row sc9-row">' +
        '<div class="sc9-grid-host"></div>' +
        '<div class="sc9-panel poke-box grow" id="sc9-panel"></div>' +
      '</div>' +
      '<div class="poke-box sc9-framing">' + T('scene9.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\gamma\\max_{a\'} Q^{*}(S\',a\')]',
      root.querySelector('.sc9-formula-host'), true);

    const grid = window.Grid.mount(root.querySelector('.sc9-grid-host'), { variant: 'qtable', legend: true });
    const panel = root.querySelector('#sc9-panel');

    let idx = 0;

    function apply(i, opts) {
      idx = Math.max(0, Math.min(snaps.length - 1, i));
      const snap = snaps[idx];
      const oo = opts || {};
      /* Build a Q view where unsolved cells are zeroed so they render 'unsolved'. */
      const Qview = new Array(N * A);
      for (let st = 0; st < N; st++) {
        const solved = snap.solved[st];
        for (let a = 0; a < A; a++) {
          const v = snap.Q[st * A + a];
          Qview[st * A + a] = solved ? v : (v == null ? null : 0);
        }
        grid.setCellSolved(Math.floor(st / NS), st % NS, solved);
      }
      grid.update(Qview, { suppressFlash: !!oo.suppressFlash });
      const stableCount = snap.solved.filter(Boolean).length;
      root.querySelector('#sc9-sweep').textContent = String(snap.sweep);
      root.querySelector('#sc9-stable').textContent = String(stableCount);

      if (idx === 0) {
        panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.ready.title') + '</div>' +
          '<div class="sc9-panel-body">' + T('scene9.ready.body') + '</div>';
      } else if (idx === snaps.length - 1) {
        panel.innerHTML = '<div class="sc9-panel-title">' + T('scene9.done.title') + '</div>' +
          '<div class="sc9-panel-body">' + T('scene9.done.body') + '</div>';
      } else {
        panel.innerHTML = '<div class="sc9-panel-body">' + T('scene9.sweepInfo', { n: snap.sweep, k: stableCount }) + '</div>';
      }
    }

    function step() { if (idx < snaps.length - 1) apply(idx + 1, {}); }
    function runAll() {
      let i = idx;
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.CS && window.CS.run)) { apply(snaps.length - 1, { suppressFlash: false }); return; }
      function tick() {
        if (i >= snaps.length - 1) return;
        i++; apply(i, { suppressFlash: false });
        if (i < snaps.length - 1) setTimeout(tick, 420);
      }
      tick();
    }
    function reset() { apply(0, { suppressFlash: true }); }

    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-run').addEventListener('click', runAll);
    root.querySelector('.sc9-reset').addEventListener('click', reset);

    apply(0, { suppressFlash: true });
    if (window.CS && window.CS.run) setTimeout(() => apply(snaps.length - 1, { suppressFlash: false }), 150);

    return {
      onEnter() { apply(idx, { suppressFlash: true }); },
      onNextKey() { if (idx < snaps.length - 1) { step(); return true; } return false; },
      onPrevKey() { if (idx > 0) { apply(idx - 1, { suppressFlash: true }); return true; } return false; },
    };
  };
})();

/* Scene 9 -- Dynamic programming. Because P is known (the bias is printed), we
   compute Q* exactly by sweeping the Bellman backup. The ladder fills from the
   goal outward (precomputed sweep snapshots in window.DATA.valueIteration): the
   first sweep lights rungs one flip from $10, later sweeps push value down, and
   the optimal-stake overlay paints the bold-middle zig-zag. STEP / RUN ALL /
   RESET drive the sweeps. Cold-entry safe; honours &run (auto RUN ALL). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const N = (window.Gambler && window.Gambler.N) || 9;
  const A = (window.Stakes && window.Stakes.STAKE_IDS.length) || 3;
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
      '<div class="gr-btn-row sc9-ctrls">' +
        '<button class="gr-btn sc9-step primary" type="button">' + T('scene9.step') + '</button>' +
        '<button class="gr-btn sc9-run" type="button">' + T('scene9.run') + '</button>' +
        '<button class="gr-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '<span class="sc9-status muted">' + T('scene9.sweep') + ' <b id="sc9-sweep">0</b> · ' +
          '<b id="sc9-stable">0</b> / ' + N + ' ' + T('scene9.stable') + '</span>' +
      '</div>' +
      '<div class="scene-row sc9-row">' +
        '<div class="sc9-ladder-host"></div>' +
        '<div class="sc9-panel poke-box grow" id="sc9-panel"></div>' +
      '</div>' +
      '<div class="poke-box sc9-framing">' + T('scene9.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]',
      root.querySelector('.sc9-formula-host'), true);

    const ladder = window.QLadder.mount(root.querySelector('.sc9-ladder-host'), { variant: 'qtable', showValues: true, legend: true });
    const panel = root.querySelector('#sc9-panel');

    let idx = 0;   // current snapshot index (0 = nothing)

    function toQarr(snapQ) {
      /* snapshot Q is length N*A with nulls for clamped; pass straight to update,
         but treat 0s in unsolved rungs as "unsolved" via the solved mask. */
      return snapQ;
    }
    function apply(i, opts) {
      idx = Math.max(0, Math.min(snaps.length - 1, i));
      const snap = snaps[idx];
      const oo = opts || {};
      /* Build a Q view where unsolved rungs are zeroed so they render 'unsolved'. */
      const Qview = new Array(N * A);
      for (let cap = 1; cap <= N; cap++) {
        const solved = snap.solved[cap - 1];
        for (let a = 0; a < A; a++) {
          const v = snap.Q[(cap - 1) * A + a];
          Qview[(cap - 1) * A + a] = solved ? v : (v == null ? null : 0);
        }
        ladder.setRungSolved(cap, solved);
      }
      ladder.update(Qview, { suppressFlash: !!oo.suppressFlash });
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
      if (reduced || (window.GR && window.GR.run)) { apply(snaps.length - 1, { suppressFlash: false }); return; }
      function tick() {
        if (i >= snaps.length - 1) return;
        i++; apply(i, { suppressFlash: false });
        if (i < snaps.length - 1) setTimeout(tick, 380);
      }
      tick();
    }
    function reset() { apply(0, { suppressFlash: true }); }

    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-run').addEventListener('click', runAll);
    root.querySelector('.sc9-reset').addEventListener('click', reset);

    apply(0, { suppressFlash: true });
    if (window.GR && window.GR.run) setTimeout(() => apply(snaps.length - 1, { suppressFlash: false }), 150);

    return {
      onEnter() { apply(idx, { suppressFlash: true }); },
      onNextKey() { if (idx < snaps.length - 1) { step(); return true; } return false; },
      onPrevKey() { if (idx > 0) { apply(idx - 1, { suppressFlash: true }); return true; } return false; },
    };
  };
})();

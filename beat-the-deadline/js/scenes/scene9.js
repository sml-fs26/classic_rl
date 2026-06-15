/* Scene 9, Dynamic programming. Because the dice are known (P is known), we
   compute Q* exactly by sweeping the Bellman backup across all 25 tiles. The
   board fills "from the deadline wall + the full-truck row outward" using the
   precomputed sweep snapshots in window.DATA.valueIteration: the h=0 wall locks
   first at a flat -10, the SEND region snaps truck-blue, the WAIT region snaps
   hold-amber, and the diagonal staircase frontier (threshold 1->2->3->4)
   emerges, converging in 6 sweeps. RUN / STEP / RESET drive the sweeps.
   Cold-entry safe; honours &run (auto RUN). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const VI = D.valueIteration || {};
  const snaps = VI.snapshots || [];
  const lastIdx = Math.max(0, snaps.length - 1);

  window.scenes.scene9 = function (root) {
    root.className = 'scene scene-pad sc9 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene9.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene9.lede') + '</p>' +
      '<div class="formula-card sc9-formula"><div class="sc9-tex"></div></div>' +
      '<div class="btd-btn-row sc9-ctrls">' +
        '<button class="btd-btn primary sc9-run" type="button">' + T('scene9.run') + '</button>' +
        '<button class="btd-btn sc9-step" type="button">' + T('scene9.step') + '</button>' +
        '<button class="btd-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '<span class="sc9-status muted">' + T('scene9.sweep') + ' <b id="sc9-sweep">0</b> ' +
          T('scene9.of') + ' <b id="sc9-total">6</b></span>' +
      '</div>' +
      '<div class="scene-row sc9-row center">' +
        '<div class="sc9-board-host"></div>' +
      '</div>' +
      '<div class="formula-note sc9-wall" id="sc9-wall">' + T('scene9.wallNote') + '</div>' +
      '<div class="poke-box sc9-converged" id="sc9-converged" hidden>' + T('scene9.converged') + '</div>' +
      '<div class="poke-box sc9-framing">' + T('scene9.framing') + '</div>';

    if (window.Katex) window.Katex.render((D.tex && D.tex.bellman) ||
      'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]', root.querySelector('.sc9-tex'), true);

    const board = window.DockBoard.mount(root.querySelector('.sc9-board-host'), { variant: 'board', showQ: true });
    const sweepEl = root.querySelector('#sc9-sweep');
    const totalEl = root.querySelector('#sc9-total');
    const convEl = root.querySelector('#sc9-converged');
    if (totalEl) totalEl.textContent = String(VI.iters || lastIdx || 6);

    let idx = 0;
    let timer = null;

    function apply(i, suppressFlash) {
      idx = Math.max(0, Math.min(lastIdx, i));
      const snap = snaps[idx];
      if (!snap) { board.reset(); return; }
      board.update(snap.Q, { suppressFlash: !!suppressFlash });
      board.setSolvedMask(snap.solved);
      if (sweepEl) sweepEl.textContent = String(snap.sweep);
      if (convEl) convEl.hidden = idx < lastIdx;
    }
    function step() { if (idx < lastIdx) apply(idx + 1, false); }
    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      board.reset();
      apply(0, true);
    }
    function runAll() {
      if (timer) { clearInterval(timer); timer = null; }
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.BTD && window.BTD.run)) { apply(lastIdx, false); return; }
      if (idx >= lastIdx) apply(0, true);
      timer = setInterval(() => {
        if (idx >= lastIdx) { clearInterval(timer); timer = null; return; }
        step();
      }, 460);
    }

    root.querySelector('.sc9-run').addEventListener('click', runAll);
    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-reset').addEventListener('click', reset);

    apply(0, true);
    if (window.BTD && window.BTD.run) setTimeout(() => apply(lastIdx, false), 160);

    return {
      onEnter() { apply(idx, true); },
      onLeave() { if (timer) { clearInterval(timer); timer = null; } },
      onNextKey() { if (idx < lastIdx) { step(); return true; } return false; },
      onPrevKey() { if (idx > 0) { apply(idx - 1, true); return true; } return false; },
    };
  };
})();

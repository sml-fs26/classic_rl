/* Scene 5, Trajectory. One day's run as a tape: tau = (S1, A1, R1, S2, ...),
   capital letters because each is a RANDOM VARIABLE until the dice land. The
   croissant-icon, lever chip, and till change scroll left to right. STEP reveals
   the tape hour by hour. Reads the precomputed demo day from DATA. Cold-entry
   safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const traj = (D.demoTrajectory && D.demoTrajectory.steps) || [];

  window.scenes.scene5 = function (root) {
    root.className = 'scene scene-pad sc5';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene5.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene5.lede') + '</p>' +
      '<div class="formula-card sc5-formula"><div class="formula-label">' + T('scene5.formulaLabel') + '</div><div id="sc5-f"></div></div>' +
      '<div class="gr-btn-row sc5-ctrls">' +
        '<button class="poke-btn primary sc5-step" type="button">' + T('scene5.step') + '</button>' +
        '<button class="poke-btn sc5-all" type="button">' + T('scene5.all') + '</button>' +
        '<button class="poke-btn sc5-reset" type="button">' + T('scene5.reset') + '</button>' +
        '<span class="sc5-hour muted"></span>' +
      '</div>' +
      '<div class="sc5-tape" id="sc5-tape"></div>' +
      '<div class="poke-box sc5-framing">' + T('scene5.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.trajectory) || '\\tau = (S_1, A_1, R_1, S_2, \\ldots)', root.querySelector('#sc5-f'), true);

    const tape = root.querySelector('#sc5-tape');

    function stepCellHtml(step, i) {
      const tier = step.tierBefore;
      const lev = step.lever;
      const r = step.reward;
      const rTxt = (r > 0 ? '+' : '') + r;
      let outIcon;
      if (step.terminal && step.cleared) outIcon = '<span class="sc5-term cleared">' + T('board.cleared') + '</span>';
      else if (step.terminal && step.spoiled) outIcon = '<span class="sc5-term spoiled">' + T('board.spoiled') + '</span>';
      else outIcon = '<span class="sc5-mini">' + window.Croissant.svg(step.tierAfter || tier, { px: 3 }) + '</span>';
      return '<div class="sc5-step" style="animation-delay:' + (i * 30) + 'ms">' +
        '<div class="sc5-s">' +
          '<span class="sc5-mini">' + window.Croissant.svg(tier, { px: 3 }) + '</span>' +
          '<span class="sc5-s-lab">' + step.unitsBefore + '&times;<br>' + T('tier.' + tier) + '</span>' +
        '</div>' +
        '<div class="sc5-arrow">&rarr;</div>' +
        '<div class="sc5-a lev-' + lev.toLowerCase() + '">' + T('lever.' + lev) + '</div>' +
        '<div class="sc5-r ' + (r > 0 ? 'pos' : r < 0 ? 'neg' : 'zero') + '">' + rTxt + '</div>' +
        '<div class="sc5-arrow">&rarr;</div>' +
        '<div class="sc5-next">' + outIcon + '</div>' +
        '</div>';
    }

    let shown = 0;
    function render() {
      tape.innerHTML = traj.slice(0, shown).map((s, i) => stepCellHtml(s, i)).join('') ||
        '<div class="sc5-empty muted">' + T('scene5.pressStep') + '</div>';
      root.querySelector('.sc5-hour').textContent = T('scene5.hour', { n: shown, total: traj.length });
      root.querySelector('.sc5-step').disabled = shown >= traj.length;
    }
    function step() { if (shown < traj.length) { shown++; render(); if (window.SFX) window.SFX.play(shown ? 'tick' : 'cursor'); } }
    function showAll() { shown = traj.length; render(); }
    function reset() { shown = 0; render(); }

    root.querySelector('.sc5-step').addEventListener('click', step);
    root.querySelector('.sc5-all').addEventListener('click', showAll);
    root.querySelector('.sc5-reset').addEventListener('click', reset);

    render();
    if (window.SBS && window.SBS.run) showAll();

    return {
      onEnter() { render(); },
      onNextKey() { if (shown < traj.length) { step(); return true; } return false; },
      onPrevKey() { if (shown > 0) { shown--; render(); return true; } return false; },
    };
  };
})();

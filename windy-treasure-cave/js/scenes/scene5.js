/* Scene 5 -- Trajectory.
 *   Play one episode under the optimal policy and record the run as a sequence
 *   tau = (S1, A1, R1, S2, A2, R2, ...). Each step lights up on the board and
 *   appends to a trajectory ribbon below; the capital letters flag that every
 *   entry is a RANDOM VARIABLE (re-run and the gusts differ). Click any Rt to
 *   see the wind roll that produced it. Uses the precomputed demo trajectory
 *   for a clean default, with a RE-RUN that samples a fresh one live.
 *   Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;
  const Actions = window.Actions;

  function sampleEpisode(seed) {
    const rng = C.makeRng(seed);
    const steps = [];
    let s = C.initialState(), guard = 0;
    while (!s.terminal && guard++ < 60) {
      const aId = D.policy[C.stateIndex(s)];
      const out = C.sample(s, aId, rng);
      steps.push({
        rBefore: out.log.rBefore, cBefore: out.log.cBefore, action: aId,
        dir: out.log.dir, die: out.log.die, reward: out.reward,
        rAfter: out.log.rAfter, cAfter: out.log.cAfter,
        goal: !!out.log.goal, pit: !!out.log.pit, terminal: out.terminal,
      });
      s = out.sNext;
    }
    return steps;
  }

  window.scenes.scene5 = function (root) {
    root.className = 'scene scene-pad sc5';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene5.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene5.lede') + '</p>' +
      '<div class="formula-card sc5-formula"><div class="formula-label">' + T('scene5.formulaLabel') + '</div><div class="sc5-formula-host"></div></div>' +
      '<div class="wtc-btn-row sc5-ctrls">' +
        '<button class="wtc-btn primary sc5-play" type="button">' + T('scene5.play') + '</button>' +
        '<button class="wtc-btn sc5-rerun" type="button">' + T('scene5.rerun') + '</button>' +
      '</div>' +
      '<div class="scene-row sc5-row">' +
        '<div class="sc5-left"><div class="sc5-board-host"></div></div>' +
        '<div class="sc5-right scene-col grow">' +
          '<div class="sc5-ribbon-wrap"><div class="sc5-ribbon" id="sc5-ribbon"></div></div>' +
          '<div class="poke-box sc5-detail" id="sc5-detail">' + T('scene5.detail.hint') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc5-framing">' + T('scene5.framing') + '</div>';

    window.Katex.render(D.tex && D.tex.trajectory ? D.tex.trajectory : '\\tau = (S_1, A_1, R_1, \\ldots)', root.querySelector('.sc5-formula-host'), true);
    const board = window.CaveBoard.mount(root.querySelector('.sc5-board-host'), { size: 'md' });
    const ribbon = root.querySelector('#sc5-ribbon');
    const detail = root.querySelector('#sc5-detail');

    let steps = (D.demoTrajectory && D.demoTrajectory.steps) ? D.demoTrajectory.steps.slice() : sampleEpisode(3);
    let timer = null, drawn = 0;

    function reset() {
      if (timer) { clearTimeout(timer); timer = null; }
      drawn = 0; ribbon.innerHTML = '';
      board.clearHighlights();
      board.setExplorer(C.START.row, C.START.col);
      detail.innerHTML = T('scene5.detail.hint');
      addState(C.START.row, C.START.col, 1);
    }
    function addState(r, c, t) {
      const el = document.createElement('span');
      el.className = 'sc5-chip sc5-chip-state';
      el.innerHTML = '<span class="sc5-sub">S<sub>' + t + '</sub></span><span class="sc5-chip-val">(' + r + ',' + c + ')</span>';
      ribbon.appendChild(el);
    }
    function addAction(aId, t) {
      const el = document.createElement('span');
      el.className = 'sc5-chip sc5-chip-action dir-fill-' + aId;
      el.innerHTML = '<span class="sc5-sub">A<sub>' + t + '</sub></span><span class="sc5-chip-val">' + Actions.arrowOf(aId) + '</span>';
      ribbon.appendChild(el);
    }
    function addReward(step, t) {
      const el = document.createElement('span');
      const cls = step.reward > 0 ? 'pos' : (step.reward < -1 ? 'neg' : '');
      el.className = 'sc5-chip sc5-chip-reward ' + cls;
      el.innerHTML = '<span class="sc5-sub">R<sub>' + t + '</sub></span><span class="sc5-chip-val">' + (step.reward > 0 ? '+' : '') + step.reward + '</span>';
      el.addEventListener('click', () => showDetail(step, t));
      ribbon.appendChild(el);
    }
    function showDetail(step, t) {
      const dieTxt = step.dir === 'main' ? T('scene5.detail.aim', { face: step.die }) :
        T('scene5.detail.gust', { face: step.die, side: step.dir === 'left' ? T('act.LEFT') : T('act.RIGHT') });
      detail.innerHTML = '<b>R<sub>' + t + '</sub> = ' + (step.reward > 0 ? '+' : '') + step.reward + '</b>. ' +
        T('scene5.detail.aimed', { dir: T('act.' + step.action) }) + ' ' + dieTxt + ' ' +
        T('scene5.detail.landed', { r: step.rAfter, c: step.cAfter });
    }

    function playOne() {
      if (drawn >= steps.length) return false;
      const step = steps[drawn];
      const t = drawn + 1;
      board.clearHighlights();
      board.highlight(step.rBefore, step.cBefore, true);
      addAction(step.action, t);
      board.gust(step.rBefore, step.cBefore, step.dir, step.action);
      addReward(step, t);
      board.setExplorer(step.rAfter, step.cAfter);
      board.pulse(step.rAfter, step.cAfter);
      if (step.terminal) { if (step.goal) board.sparkle(); else board.shake(); }
      else { addState(step.rAfter, step.cAfter, t + 1); }
      drawn++;
      return true;
    }
    function playAll() {
      reset();
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.WTC && window.WTC.run)) { while (playOne()) {} return; }
      function tick() { if (!playOne()) return; timer = setTimeout(tick, 620); }
      timer = setTimeout(tick, 200);
    }

    root.querySelector('.sc5-play').addEventListener('click', playAll);
    root.querySelector('.sc5-rerun').addEventListener('click', () => { steps = sampleEpisode((Date.now() & 0xffff) ^ 0xA17); playAll(); });
    reset();

    if (window.WTC && window.WTC.run) setTimeout(playAll, 200);

    return {
      onLeave() { if (timer) { clearTimeout(timer); timer = null; } },
      onEnter() { board.setExplorer(C.START.row, C.START.col); },
    };
  };
})();

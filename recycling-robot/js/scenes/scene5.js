/* Scene 5, Trajectory.
 *   One full shift replayed as a tape of random variables tau = (S1,A1,R1, ...,
 *   S_T). The robot-and-gauge marches left along a rollout tape: battery, lever,
 *   trash, next battery. STEP advances one entry; RESHUFFLE rolls a different
 *   tape (same policy, different dice). Uses the pinned demo trajectory plus
 *   live re-rolls. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;

  function rollout(seed) {
    /* same OPTIMAL converged policy as DATA.policy (level-1 order). */
    const pol = window.DATA.policy;   // [low,mid,high,full]
    const lastPol = window.DATA.lastStepPolicy;
    const rng = R.makeRng(seed);
    let s = { lv: R.FULL, terminal: false };
    let k = R.SHIFT;
    const steps = [];
    while (k > 0 && !s.terminal) {
      const leverId = (k === 1 ? lastPol : pol)[s.lv - 1];
      const out = R.sample(s, leverId, rng);
      steps.push({ lvBefore: s.lv, lever: leverId, drain: out.log.drain || 0,
        reward: out.reward, lvAfter: out.log.lvAfter, stranded: !!out.log.stranded });
      s = out.sNext; k = k - 1;
    }
    return steps;
  }

  window.scenes.scene5 = function (root) {
    root.className = 'scene scene-pad sc5 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene5.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene5.lede') + '</p>' +
      '<div class="formula-card sc5-formula"><div class="formula-label">' + T('scene5.flabel') + '</div><div class="sc5-tex"></div></div>' +
      '<div class="sc5-stage">' +
        '<div class="sc5-gauge-host"></div>' +
        '<div class="sc5-tape"></div>' +
      '</div>' +
      '<div class="rr-btn-row">' +
        '<button class="rr-btn primary sc5-step" type="button">' + T('scene5.step') + '</button>' +
        '<button class="rr-btn sc5-shuffle" type="button">' + T('scene5.shuffle') + '</button>' +
      '</div>' +
      '<p class="footnote">' + T('scene5.hint') + '</p>';

    window.Katex.render(window.DATA.tex.trajectory, root.querySelector('.sc5-tex'), true);
    const gauge = window.Gauge.mount(root.querySelector('.sc5-gauge-host'), { variant: 'icon', level: R.FULL });
    const tape = root.querySelector('.sc5-tape');

    let steps = window.DATA.demoTrajectory.steps.map(s => ({ lvBefore: s.lvBefore, lever: s.lever, drain: s.drain, reward: s.reward, lvAfter: s.lvAfter, stranded: s.stranded }));
    let shown = 0;
    let seedBase = 100;

    function reset(newSteps) {
      steps = newSteps; shown = 0; tape.innerHTML = '';
      gauge.setLevel(R.FULL);
    }
    function stepOne() {
      if (shown >= steps.length) return false;
      const st = steps[shown];
      const cell = document.createElement('div');
      cell.className = 'sc5-cell tape-' + st.lever + (st.stranded ? ' tape-strand' : '');
      cell.innerHTML =
        '<span class="c-i">S<sub>' + (shown + 1) + '</sub></span>' +
        '<span class="c-lv">' + T('level.' + R.LEVEL_NAMES[st.lvBefore]) + '</span>' +
        '<span class="c-lever">' + T('lever.' + st.lever) + '</span>' +
        '<span class="c-r">' + (st.reward >= 0 ? '+' + st.reward : st.reward) + '</span>';
      tape.appendChild(cell);
      gauge.setLevel(st.stranded ? 0 : st.lvAfter);
      if (st.stranded) { if (window.SFX) window.SFX.play('strand'); }
      else if (st.lever === 'search') { if (window.SFX) window.SFX.play('spark'); }
      else if (st.lever === 'recharge') { if (window.SFX) window.SFX.play('dock'); }
      shown++;
      return true;
    }
    function showAll() { while (stepOne()) {} }

    root.querySelector('.sc5-step').addEventListener('click', () => { if (!stepOne()) { reset(steps); stepOne(); } });
    root.querySelector('.sc5-shuffle').addEventListener('click', () => { reset(rollout(seedBase++)); });

    if (window.RR && window.RR.run) setTimeout(showAll, 200);

    return {
      onNextKey() { return stepOne(); },
      onPrevKey() { return false; },
    };
  };
})();

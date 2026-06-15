/* Scene 5, Trajectory. One full episode (the precomputed demo from a $5
   start under the optimal policy) replays as a tape of random variables
   tau = (S1,A1,R1, S2,A2,R2, ..., S_T): capital, stake, reward (0 until the
   end), next capital, with the ladder token marching along. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const STAKE_BY_ID = window.Stakes.STAKE_BY_ID;

  window.scenes.scene5 = function (root) {
    root.className = 'scene scene-pad sc5';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene5.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene5.lede') + '</p>' +
      '<div class="formula-card sc5-formula">' +
        '<div class="formula-label">' + T('scene5.formulaLabel') + '</div>' +
        '<div class="sc5-formula-host"></div>' +
      '</div>' +
      '<div class="scene-row sc5-row">' +
        '<div class="sc5-ladder-host"></div>' +
        '<div class="sc5-right grow">' +
          '<div class="gr-btn-row"><button class="gr-btn primary sc5-play" type="button">' + T('scene5.play') + '</button></div>' +
          '<div class="sc5-rollout" id="sc5-rollout"></div>' +
          '<p class="sc5-note muted">' + T('scene5.note') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc5-framing">' + T('scene5.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.trajectory) || '\\tau = (S_1, A_1, R_1, \\ldots, S_T)',
      root.querySelector('.sc5-formula-host'), true);

    const ladder = window.QLadder.mount(root.querySelector('.sc5-ladder-host'), { variant: 'icon' });
    const rollout = root.querySelector('#sc5-rollout');
    const steps = (D.demoTrajectory && D.demoTrajectory.steps) || [];

    function rowHtml(st, idx) {
      const stakeName = (STAKE_BY_ID[st.stake] && STAKE_BY_ID[st.stake].name) || ('$' + st.bet);
      const nextLabel = st.terminal ? (st.goal ? 'GOAL' : 'RUIN') : '$' + st.capAfter;
      return '<div class="sc5-step" data-i="' + idx + '" hidden>' +
        '<span class="sc5-cell sc5-t">t=' + (idx + 1) + '</span>' +
        '<span class="sc5-cell sc5-s">$' + st.capBefore + '</span>' +
        '<span class="sc5-cell sc5-a"><span class="stake-tag" data-stake="' + st.stake + '">' + stakeName + '</span></span>' +
        '<span class="sc5-cell sc5-flip ' + (st.win ? 'up' : 'down') + '">' + (st.win ? 'HEADS ▲' : 'TAILS ▼') + '</span>' +
        '<span class="sc5-cell sc5-r ' + (st.reward ? 'pos' : '') + '">+' + st.reward + '</span>' +
        '<span class="sc5-cell sc5-next ' + (st.terminal ? (st.goal ? 'goal' : 'ruin') : '') + '">' + nextLabel + '</span>' +
        '</div>';
    }

    /* header */
    rollout.innerHTML =
      '<div class="sc5-step sc5-head">' +
        '<span class="sc5-cell">step</span>' +
        '<span class="sc5-cell">' + T('scene5.colCap') + '</span>' +
        '<span class="sc5-cell">' + T('scene5.colStake') + '</span>' +
        '<span class="sc5-cell">flip</span>' +
        '<span class="sc5-cell">' + T('scene5.colReward') + '</span>' +
        '<span class="sc5-cell">' + T('scene5.colNext') + '</span>' +
      '</div>' +
      steps.map(rowHtml).join('');

    const stepEls = Array.from(rollout.querySelectorAll('.sc5-step[data-i]'));
    let timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function play() {
      clearTimers();
      stepEls.forEach(el => { el.hidden = true; el.classList.remove('sc5-in'); });
      ladder.setToken(D.demoTrajectory ? D.demoTrajectory.capStart : 5);
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const gap = reduced || (window.GR && window.GR.run) ? 0 : 620;
      steps.forEach((st, i) => {
        timers.push(setTimeout(() => {
          stepEls[i].hidden = false;
          stepEls[i].classList.add('sc5-in');
          if (st.terminal) {
            ladder.setToken(st.goal ? 10 : 0);
            ladder.flashTerminal(st.goal ? 'goal' : 'ruin');
          } else { ladder.setToken(st.capAfter); ladder.pulseToken(); }
        }, gap * (i + 1)));
      });
    }
    root.querySelector('.sc5-play').addEventListener('click', () => {
      root.querySelector('.sc5-play').textContent = T('scene5.again');
      play();
    });

    /* initial: show all rows statically, token at start */
    stepEls.forEach(el => { el.hidden = false; });
    ladder.setToken(D.demoTrajectory ? D.demoTrajectory.capStart : 5);

    if (window.GR && window.GR.run) play();

    return {
      onEnter() {},
      onLeave() { clearTimers(); },
    };
  };
})();

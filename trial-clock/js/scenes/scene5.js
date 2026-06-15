/* Scene 5 -- Trajectory. One full trial (the precomputed demo from a cold day-5
   user under the optimal policy) replays as a tape of random variables
   tau = (S1,A1,R1, S2,A2,R2, ..., S_T): situation, lever, reward, next
   situation, with the Trial Card marching along. The capitals stress these are
   random until they happen. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};

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
        '<div class="sc5-card-host"></div>' +
        '<div class="sc5-right grow">' +
          '<div class="tc-btn-row"><button class="tc-btn primary sc5-play" type="button">' + T('scene5.play') + '</button></div>' +
          '<div class="sc5-rollout" id="sc5-rollout"></div>' +
          '<p class="sc5-note muted">' + T('scene5.note') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc5-framing">' + T('scene5.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.trajectory) || '\\tau = (S_1, A_1, R_1, \\ldots, S_T)',
      root.querySelector('.sc5-formula-host'), true);

    const card = window.TrialCard.mount(root.querySelector('.sc5-card-host'), {});
    const rollout = root.querySelector('#sc5-rollout');
    const traj = D.demoTrajectory || { steps: [], startTier: 0, startDays: 5 };
    const steps = traj.steps || [];

    function dieLabel(st) {
      if (st.kind === 'coin') return st.outcome === 'adopt' ? T('coin.heads') : T('coin.tails');
      if (st.kind === 'wheel') return T('wheel.' + st.wedge);
      return T('scene5.tick');
    }
    function nextLabel(st) {
      if (st.terminal) return st.convert ? T('term.convert') : (st.abandon ? T('term.abandon') : T('term.expiry'));
      return 'T' + st.tierAfter + '·' + st.daysAfter + 'd';
    }
    function rowHtml(st, idx) {
      const cls = st.terminal ? (st.convert ? 'convert' : st.abandon ? 'abandon' : 'expiry') :
        (st.outcome === 'adopt' ? 'up' : 'flat');
      return '<div class="sc5-step" data-i="' + idx + '" hidden>' +
        '<span class="sc5-cell sc5-t">t=' + (idx + 1) + '</span>' +
        '<span class="sc5-cell sc5-s">T' + st.tierBefore + '·' + st.daysBefore + 'd</span>' +
        '<span class="sc5-cell sc5-a"><span class="lever-tag" data-lever="' + st.lever + '">' + window.Board.leverShort(st.lever) + '</span></span>' +
        '<span class="sc5-cell sc5-die ' + cls + '">' + dieLabel(st) + '</span>' +
        '<span class="sc5-cell sc5-r ' + (st.reward > 0 ? 'pos' : st.reward < 0 ? 'neg' : '') + '">' + (st.reward > 0 ? '+' : '') + st.reward + '</span>' +
        '<span class="sc5-cell sc5-next ' + cls + '">' + nextLabel(st) + '</span>' +
        '</div>';
    }

    rollout.innerHTML =
      '<div class="sc5-step sc5-head">' +
        '<span class="sc5-cell">step</span>' +
        '<span class="sc5-cell">' + T('scene5.colState') + '</span>' +
        '<span class="sc5-cell">' + T('scene5.colLever') + '</span>' +
        '<span class="sc5-cell">' + T('scene5.colDie') + '</span>' +
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
      card.setState(traj.startTier, traj.startDays);
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const gap = reduced || (window.TC && window.TC.run) ? 0 : 720;
      steps.forEach((st, i) => {
        timers.push(setTimeout(() => {
          stepEls[i].hidden = false;
          stepEls[i].classList.add('sc5-in');
          if (st.terminal) {
            card.flashTerminal(st.convert ? 'convert' : st.abandon ? 'abandon' : 'expiry');
          } else { card.setState(st.tierAfter, st.daysAfter); card.pulse(); }
        }, gap * (i + 1)));
      });
    }
    root.querySelector('.sc5-play').addEventListener('click', () => {
      root.querySelector('.sc5-play').textContent = T('scene5.again');
      play();
    });

    /* initial: show all rows statically, card at start */
    stepEls.forEach(el => { el.hidden = false; });
    card.setState(traj.startTier, traj.startDays);

    if (window.TC && window.TC.run) play();

    return {
      onEnter() {},
      onLeave() { clearTimers(); },
    };
  };
})();

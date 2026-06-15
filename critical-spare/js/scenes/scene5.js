/* Scene 5 -- Trajectory. The precomputed demo quarter (12 turns under the
   optimal policy from HEALTHY/0) replays as a rollout tape of random variables
   tau = (S1,A1,R1, S2,A2,R2, ...): situation, lever, outcome, reward, next
   situation, with the machine icon marching along. Stresses that each Si,Ai,Ri
   is a random variable -- the same playbook gives a different tape each quarter.
   Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const M = window.Machine;
  const HEALTH_KEYS = ['healthy', 'aging', 'failing'];

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
        '<div class="sc5-left">' +
          '<div class="sc5-machine-host"></div>' +
          '<div class="cs-btn-row"><button class="cs-btn primary sc5-play" type="button">' + T('scene5.play') + '</button></div>' +
        '</div>' +
        '<div class="sc5-right grow">' +
          '<div class="sc5-rollout" id="sc5-rollout"></div>' +
          '<p class="sc5-note muted">' + T('scene5.note') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc5-framing">' + T('scene5.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.trajectory) || '\\tau = (S_1, A_1, R_1, \\ldots)',
      root.querySelector('.sc5-formula-host'), true);

    const icon = window.MachineIcon.mount(root.querySelector('.sc5-machine-host'), { size: 'lg', showLabel: true });
    const rollout = root.querySelector('#sc5-rollout');
    const steps = (D.demoTrajectory && D.demoTrajectory.steps) || [];

    function outIcon(st) {
      if (st.kind === 'downtime') return '⚠';
      if (st.kind === 'emergency') return '↺';
      if (st.kind === 'replace') return '↺';
      if (st.kind === 'order') return '+◷';
      return st.aged ? '↓' : '=';
    }
    function rowHtml(st, i) {
      const cls = 'lever-' + st.lever + (st.kind === 'downtime' ? ' bad' : (st.kind === 'emergency' ? ' warn' : ''));
      const rTxt = (st.reward >= 0 ? '+' : '') + st.reward;
      return '<div class="sc5-step ' + cls + '" data-i="' + i + '" hidden>' +
        '<span class="sc5-cell sc5-t">t=' + (i + 1) + '</span>' +
        '<span class="sc5-cell sc5-s"><span class="sc5-mini mi-mini-' + HEALTH_KEYS[st.hBefore] + '">' + M.healthShort(st.hBefore) + '</span><span class="sc5-sp">' + st.sBefore + 'sp</span></span>' +
        '<span class="sc5-cell sc5-a"><span class="lever-tag" data-lever="' + st.lever + '">' + T('lever.' + st.lever + '.short') + '</span></span>' +
        '<span class="sc5-cell sc5-out">' + outIcon(st) + '</span>' +
        '<span class="sc5-cell sc5-r ' + (st.reward >= 0 ? 'pos' : 'neg') + '">' + rTxt + '</span>' +
        '<span class="sc5-cell sc5-next"><span class="sc5-mini mi-mini-' + HEALTH_KEYS[st.hAfter] + '">' + M.healthShort(st.hAfter) + '</span><span class="sc5-sp">' + st.sAfter + 'sp</span></span>' +
        '</div>';
    }

    rollout.innerHTML =
      '<div class="sc5-step sc5-head">' +
        '<span class="sc5-cell">step</span>' +
        '<span class="sc5-cell">' + T('scene5.colState') + '</span>' +
        '<span class="sc5-cell">' + T('scene5.colLever') + '</span>' +
        '<span class="sc5-cell">' + T('scene5.colOut') + '</span>' +
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
      const start = (D.demoTrajectory && steps[0]) ? steps[0] : { hBefore: 0, sBefore: 0 };
      icon.set(start.hBefore, start.sBefore);
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const gap = reduced || (window.CS && window.CS.run) ? 0 : 560;
      steps.forEach((st, i) => {
        timers.push(setTimeout(() => {
          stepEls[i].hidden = false;
          stepEls[i].classList.add('sc5-in');
          icon.set(st.hAfter, st.sAfter);
          if (st.kind === 'downtime') icon.flashDowntime();
          else if (st.kind === 'replace' || st.kind === 'emergency') icon.flashReplace();
          else if (st.kind === 'order') icon.flashOrder();
          else icon.pulse();
        }, gap * (i + 1)));
      });
    }
    root.querySelector('.sc5-play').addEventListener('click', () => {
      root.querySelector('.sc5-play').textContent = T('scene5.again');
      play();
    });

    /* initial: show all rows statically, icon at start */
    stepEls.forEach(el => { el.hidden = false; });
    const start = steps[0] || { hBefore: 0, sBefore: 0 };
    icon.set(start.hBefore, start.sBefore);

    if (window.CS && window.CS.run) play();

    return {
      onEnter() {},
      onLeave() { clearTimers(); },
    };
  };
})();

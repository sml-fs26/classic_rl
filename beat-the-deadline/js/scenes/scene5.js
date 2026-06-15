/* Scene 5 -- Trajectory. Roll one order window forward under the optimal policy
   and lay it out as a tape tau = (S1,A1,R1, S2,A2,R2, ...). Each step redraws
   the dock tile and shows the dice result inline; capital letters emphasised as
   random variables. ROLL re-samples a fresh window. Cold-entry safe; honours
   &run (auto-plays the pinned demo). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.Dock;
  const DATA = window.DATA;

  window.scenes.scene5 = function (root) {
    root.className = 'scene scene-pad sc5 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene5.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene5.lede') + '</p>' +
      '<div class="formula-card compact"><div class="sc5-tex"></div></div>' +
      '<div class="scene-row sc5-row">' +
        '<div class="sc5-tile-host"></div>' +
        '<div class="sc5-right grow">' +
          '<div class="btd-btn-row"><button class="btd-btn primary sc5-play" type="button">' + T('scene5.play') + '</button></div>' +
          '<div class="sc5-tape-label muted">' + T('scene5.tapeLabel') + '</div>' +
          '<div class="sc5-tape" id="sc5-tape"></div>' +
        '</div>' +
      '</div>' +
      '<div class="formula-note sc5-caps">' + T('scene5.capsNote') + '</div>' +
      '<div class="poke-box sc5-framing">' + T('scene5.framing') + '</div>';

    if (window.Katex) window.Katex.render(DATA.tex.trajectory, root.querySelector('.sc5-tex'), true);

    const tile = window.DockBoard.mount(root.querySelector('.sc5-tile-host'), { variant: 'icon', p: 2, h: 4 });
    const tapeEl = root.querySelector('#sc5-tape');
    const playBtn = root.querySelector('.sc5-play');
    let busy = false;

    /* Build a trajectory: the pinned demo first time, fresh samples after. */
    function sampleTrajectory(useDemo) {
      if (useDemo) return DATA.demoTrajectory.steps.slice();
      const rng = D.makeRng((Math.random() * 1e9) >>> 0);
      let s = { p: 2, h: 4, terminal: false }, guard = 0;
      const steps = [];
      while (!s.terminal && guard++ < 50) {
        const aId = DATA.policy[D.stateIndex(s)];
        const out = D.sample(s, aId, rng);
        steps.push({ p: s.p, h: s.h, action: aId, blown: !!out.log.blown, arrived: !!out.log.arrived,
          late: !!out.log.late, reward: out.reward,
          kind: out.sNext.terminal ? out.sNext.kind : null,
          pNext: out.sNext.terminal ? null : out.sNext.p, hNext: out.sNext.terminal ? null : out.sNext.h });
        s = out.sNext;
      }
      return steps;
    }

    let first = true;
    function play() {
      if (busy) return;
      busy = true; playBtn.disabled = true;
      tapeEl.innerHTML = '';
      const steps = sampleTrajectory(first);
      first = false;
      let i = 0;
      const stepThrough = () => {
        if (i >= steps.length) { busy = false; playBtn.disabled = false; playBtn.textContent = T('scene5.replay'); return; }
        const st = steps[i];
        tile.setState(st.p, st.h);
        const cell = document.createElement('div');
        let cls = 'sc5-step', label;
        if (st.action === 'send') { cls += ' send'; label = T('scene5.stepSend'); tile.flashOutcome('sent'); }
        else if (st.blown) { cls += ' blown'; label = T('die.blown'); tile.flashOutcome('blown'); }
        else if (st.arrived) { cls += ' wait-arr'; label = T('scene5.stepWaitArr'); tile.pulse(); }
        else { cls += ' wait'; label = T('scene5.stepWaitNo'); tile.pulse(); }
        cell.className = cls;
        cell.innerHTML =
          '<span class="sc5-sub">S<sub>' + (i + 1) + '</sub></span>' +
          '<span class="sc5-state">(' + st.p + ',' + st.h + ')</span>' +
          '<span class="sc5-arrow">' + label + '</span>' +
          '<span class="sc5-r">R<sub>' + (i + 1) + '</sub> = ' + (st.reward >= 0 ? '+' : '') + st.reward + '</span>';
        tapeEl.appendChild(cell);
        tapeEl.scrollLeft = tapeEl.scrollWidth;
        if (st.kind) {
          const term = document.createElement('div');
          term.className = 'sc5-step terminal ' + (st.kind === 'sent' ? 'send' : 'blown');
          term.innerHTML = '<span class="sc5-term">' + (st.kind === 'sent' ? T('scene5.shipped') : T('die.blown')) + '</span>';
          tapeEl.appendChild(term);
        }
        i++;
        setTimeout(stepThrough, 760);
      };
      stepThrough();
    }
    playBtn.addEventListener('click', play);

    if (window.BTD && window.BTD.run) setTimeout(play, 200);

    return { onLeave() { busy = false; } };
  };
})();

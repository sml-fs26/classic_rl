/* Scene 3, Formalization. The four MDP parts slide in over the ladder the
   learner just played: the tuple, then State, Action, Transition, Reward, each
   with a KaTeX formula card and a manager gloss. Internal 5-step reveal.
   Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const STEPS = ['s0', 's1', 's2', 's3', 's4'];
  const TEX = {
    s0: (D.tex && D.tex.mdpTuple) || '\\langle S, A, P, R \\rangle',
    s1: (D.tex && D.tex.state) || 's \\in \\{0,\\ldots,10\\}',
    s2: (D.tex && D.tex.actions) || 'a \\in \\{1,2,3\\}',
    s3: (D.tex && D.tex.transition) || 'P(s\',r\\mid s,a)',
    s4: (D.tex && D.tex.return) || 'G_i = \\sum r_j \\in \\{0,1\\}',
  };

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene3.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene3.lede') + '</p>' +
      '<div class="scene-row sc3-row">' +
        '<div class="sc3-ladder-host"></div>' +
        '<div class="sc3-panel grow">' +
          '<div class="sc3-rail"></div>' +
          '<div class="sc3-tag" id="sc3-tag"></div>' +
          '<h3 class="sc3-h" id="sc3-h"></h3>' +
          '<div class="formula-card sc3-formula" id="sc3-formula"></div>' +
          '<p class="sc3-body" id="sc3-body"></p>' +
          '<div class="gr-btn-row sc3-nav">' +
            '<span class="sc3-stepcount muted"></span>' +
            '<button class="gr-btn sc3-back" type="button">' + T('scene3.back') + '</button>' +
            '<button class="gr-btn primary sc3-next" type="button">' + T('scene3.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc3-framing" id="sc3-framing" hidden>' + T('scene3.framing') + '</div>';

    const ladder = window.QLadder.mount(root.querySelector('.sc3-ladder-host'), { variant: 'icon' });
    ladder.setToken(5);

    /* rail of four chips: S A P R */
    const railNames = ['S', 'A', 'P', 'R'];
    const rail = root.querySelector('.sc3-rail');
    rail.innerHTML = railNames.map((n, i) => '<span class="sc3-chip" data-i="' + (i + 1) + '">' + n + '</span>').join('');

    let cursor = 0;
    function applyStep(i) {
      cursor = Math.max(0, Math.min(STEPS.length - 1, i));
      const key = STEPS[cursor];
      root.querySelector('#sc3-tag').textContent = T('scene3.' + key + '.tag');
      root.querySelector('#sc3-h').textContent = T('scene3.' + key + '.title');
      root.querySelector('#sc3-body').innerHTML = T('scene3.' + key + '.body');
      const fhost = root.querySelector('#sc3-formula');
      fhost.innerHTML = '';
      window.Katex.render(TEX[key], fhost, true);

      /* highlight the right rail chip (steps 1..4 map to S/A/P/R) */
      rail.querySelectorAll('.sc3-chip').forEach((c, idx) => c.classList.toggle('active', idx === cursor - 1));

      /* ladder emphasis per part */
      ladder.host.classList.toggle('sc3-emph-state', cursor === 1);
      if (cursor === 1) { ladder.setToken(5); }
      if (cursor === 3) { ladder.pulseToken(); }
      if (cursor === 4) { ladder.flashTerminal('goal'); }

      root.querySelector('.sc3-stepcount').textContent = T('scene3.step', { n: cursor + 1, total: STEPS.length });
      const nextBtn = root.querySelector('.sc3-next');
      nextBtn.textContent = cursor === STEPS.length - 1 ? T('scene3.done') : T('scene3.next');
      root.querySelector('.sc3-back').disabled = cursor === 0;
      root.querySelector('#sc3-framing').hidden = cursor !== STEPS.length - 1;
    }

    root.querySelector('.sc3-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) applyStep(cursor + 1);
      else window.GR && window.GR.goTo(4);
    });
    root.querySelector('.sc3-back').addEventListener('click', () => { if (cursor > 0) applyStep(cursor - 1); });

    applyStep(0);
    if (window.GR && window.GR.run) applyStep(STEPS.length - 1);

    return {
      onEnter() { applyStep(cursor); },
      onNextKey() { if (cursor < STEPS.length - 1) { applyStep(cursor + 1); return true; } return false; },
      onPrevKey() { if (cursor > 0) { applyStep(cursor - 1); return true; } return false; },
    };
  };
})();

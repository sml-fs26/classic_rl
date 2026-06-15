/* Scene 3 -- Formalization. The four MDP parts reveal over the machine they
   just played: the tuple, then State, Action, Transition, Reward, each with a
   KaTeX card and a manager gloss. The transition step draws the branching dice
   (failure die + aging coin) out of one cell. Internal 5-step reveal.
   Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const M = window.Machine;
  const STEPS = ['s0', 's1', 's2', 's3', 's4'];
  const TEX = {
    s0: (D.tex && D.tex.mdpTuple) || '\\langle S, A, P, R \\rangle',
    s1: (D.tex && D.tex.state) || 's = (\\text{health}, \\text{spares})',
    s2: (D.tex && D.tex.actions) || 'a \\in \\{ \\text{RUN}, \\text{ORDER}, \\text{REPLACE} \\}',
    s3: (D.tex && D.tex.transition) || 'P(s\', r \\mid s, a)',
    s4: (D.tex && D.tex.return) || 'G_i = \\sum_j \\gamma^{j-i} r_j',
  };

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene3.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene3.lede') + '</p>' +
      '<div class="scene-row sc3-row">' +
        '<div class="sc3-left">' +
          '<div class="sc3-machine-host"></div>' +
          '<div class="sc3-dice" id="sc3-dice" hidden></div>' +
        '</div>' +
        '<div class="sc3-panel grow">' +
          '<div class="sc3-rail"></div>' +
          '<div class="sc3-tag" id="sc3-tag"></div>' +
          '<h3 class="sc3-h" id="sc3-h"></h3>' +
          '<div class="formula-card sc3-formula" id="sc3-formula"></div>' +
          '<p class="sc3-body" id="sc3-body"></p>' +
          '<div class="cs-btn-row sc3-nav">' +
            '<span class="sc3-stepcount muted"></span>' +
            '<button class="cs-btn sc3-back" type="button">' + T('scene3.back') + '</button>' +
            '<button class="cs-btn primary sc3-next" type="button">' + T('scene3.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc3-framing" id="sc3-framing" hidden>' + T('scene3.framing') + '</div>';

    const icon = window.MachineIcon.mount(root.querySelector('.sc3-machine-host'), { size: 'lg', showLabel: true });
    icon.set(1, 1);

    const railNames = ['S', 'A', 'P', 'R'];
    const rail = root.querySelector('.sc3-rail');
    rail.innerHTML = railNames.map((n) => '<span class="sc3-chip">' + n + '</span>').join('');

    const diceHost = root.querySelector('#sc3-dice');

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

      rail.querySelectorAll('.sc3-chip').forEach((c, idx) => c.classList.toggle('active', idx === cursor - 1));

      /* per-part emphasis on the icon / dice */
      icon.host.classList.toggle('sc3-emph', cursor === 1);
      diceHost.hidden = cursor !== 3;
      if (cursor === 1) { icon.set(1, 1); icon.pulse(); }
      if (cursor === 3) { buildDice(); }
      if (cursor === 4) { icon.flashOrder(); }

      root.querySelector('.sc3-stepcount').textContent = T('scene3.step', { n: cursor + 1, total: STEPS.length });
      const nextBtn = root.querySelector('.sc3-next');
      nextBtn.textContent = cursor === STEPS.length - 1 ? T('scene3.done') : T('scene3.next');
      root.querySelector('.sc3-back').disabled = cursor === 0;
      root.querySelector('#sc3-framing').hidden = cursor !== STEPS.length - 1;
    }

    /* The transition fan: from RUN at (AGING, 1) the failure die splits FAIL
       (30%) / RUNS FINE (70%), and the survive branch ages on a coin. */
    function buildDice() {
      diceHost.innerHTML =
        '<div class="sc3-dice-title">' + T('scene3.diceTitle') + '</div>' +
        '<div class="sc3-dice-host"></div>' +
        '<div class="sc3-branch">' +
          '<div class="sc3-br sc3-br-fail"><span class="sc3-br-p">30%</span> ' + T('scene3.brFail') + '</div>' +
          '<div class="sc3-br sc3-br-fine"><span class="sc3-br-p">70%</span> ' + T('scene3.brFine') + '</div>' +
        '</div>';
      const d = window.Die.mount(diceHost.querySelector('.sc3-dice-host'), {});
      d.setRisk(M.pFail(1));
    }

    root.querySelector('.sc3-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) applyStep(cursor + 1);
      else window.CS && window.CS.goTo(4);
    });
    root.querySelector('.sc3-back').addEventListener('click', () => { if (cursor > 0) applyStep(cursor - 1); });

    applyStep(0);
    if (window.CS && window.CS.run) applyStep(STEPS.length - 1);

    return {
      onEnter() { applyStep(cursor); },
      onNextKey() { if (cursor < STEPS.length - 1) { applyStep(cursor + 1); return true; } return false; },
      onPrevKey() { if (cursor > 0) { applyStep(cursor - 1); return true; } return false; },
    };
  };
})();

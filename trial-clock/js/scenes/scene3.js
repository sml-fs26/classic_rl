/* Scene 3, Formalization. The four MDP parts slide in over the trial the
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
    s1: (D.tex && D.tex.state) || 's = (\\text{tier}, \\text{days})',
    s2: (D.tex && D.tex.actions) || 'a \\in \\{\\text{NUDGE}, \\text{NOTHING}, \\text{PUSH}\\}',
    s3: (D.tex && D.tex.transition) || 'P(s\',r\\mid s,a)',
    s4: (D.tex && D.tex.reward) || 'r:\\ +20 / -1 / -5 / 0',
  };

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene3.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene3.lede') + '</p>' +
      '<div class="scene-row sc3-row">' +
        '<div class="sc3-card-host"></div>' +
        '<div class="sc3-panel grow">' +
          '<div class="sc3-rail"></div>' +
          '<div class="sc3-tag" id="sc3-tag"></div>' +
          '<h3 class="sc3-h" id="sc3-h"></h3>' +
          '<div class="formula-card sc3-formula" id="sc3-formula"></div>' +
          '<p class="sc3-body" id="sc3-body"></p>' +
          '<div class="tc-btn-row sc3-nav">' +
            '<span class="sc3-stepcount muted"></span>' +
            '<button class="tc-btn sc3-back" type="button">' + T('scene3.back') + '</button>' +
            '<button class="tc-btn primary sc3-next" type="button">' + T('scene3.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc3-framing" id="sc3-framing" hidden>' + T('scene3.framing') + '</div>';

    const card = window.TrialCard.mount(root.querySelector('.sc3-card-host'), {});
    card.setState(2, 4);

    const railNames = ['S', 'A', 'P', 'R'];
    const rail = root.querySelector('.sc3-rail');
    rail.innerHTML = railNames.map((n, i) => '<span class="sc3-chip" data-i="' + (i + 1) + '">' + n + '</span>').join('');

    /* a small wheel inside the panel for the transition step */
    let wheel = null;

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

      card.host.classList.toggle('sc3-emph-state', cursor === 1);
      if (cursor === 1) { card.setState(2, 4); }
      if (cursor === 3) { card.pulse(); }
      if (cursor === 4) { card.flashTerminal('convert'); setTimeout(() => card.setState(2, 4), 900); }

      root.querySelector('.sc3-stepcount').textContent = T('scene3.step', { n: cursor + 1, total: STEPS.length });
      const nextBtn = root.querySelector('.sc3-next');
      nextBtn.textContent = cursor === STEPS.length - 1 ? T('scene3.done') : T('scene3.next');
      root.querySelector('.sc3-back').disabled = cursor === 0;
      root.querySelector('#sc3-framing').hidden = cursor !== STEPS.length - 1;
    }

    root.querySelector('.sc3-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) applyStep(cursor + 1);
      else window.TC && window.TC.goTo(4);
    });
    root.querySelector('.sc3-back').addEventListener('click', () => { if (cursor > 0) applyStep(cursor - 1); });

    applyStep(0);
    if (window.TC && window.TC.run) applyStep(STEPS.length - 1);

    return {
      onEnter() { applyStep(cursor); },
      onNextKey() { if (cursor < STEPS.length - 1) { applyStep(cursor + 1); return true; } return false; },
      onPrevKey() { if (cursor > 0) { applyStep(cursor - 1); return true; } return false; },
    };
  };
})();

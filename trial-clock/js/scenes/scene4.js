/* Scene 4, Policy. A policy is a complete growth playbook: one lever for every
   situation. Paint three hand-policies onto the 5x5 board as colour maps before
   anyone says which is better: Always-Push (all gold), Always-Nudge (all teal),
   and a sensible "nudge while cold, push once hooked" one. The learner sees a
   policy as a full map over situations. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Trial, N = G.N, N_DAYS = G.N_DAYS;

  /* Hand-policies: stateIndex -> leverId. */
  const PRESETS = [
    { key: 'A', pick: () => 'nudge' },
    { key: 'B', pick: () => 'push' },
    { key: 'C', pick: (tier, days) => (tier >= 2 || days <= 2) ? 'push' : 'nudge' },
  ];

  window.scenes.scene4 = function (root) {
    root.className = 'scene scene-pad sc4';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene4.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene4.lede') + '</p>' +
      '<div class="formula-card sc4-formula">' +
        '<div class="formula-label">' + T('scene4.formulaLabel') + '</div>' +
        '<div class="sc4-formula-host"></div>' +
      '</div>' +
      '<div class="scene-row sc4-row">' +
        '<div class="sc4-board-host"></div>' +
        '<div class="sc4-panel grow">' +
          '<div class="sc4-preset-label muted">' + T('scene4.presetLabel') + '</div>' +
          '<div class="tc-btn-row sc4-presets">' +
            '<button class="tc-btn sc4-preset" data-i="0" type="button">' + T('scene4.presetA') + '</button>' +
            '<button class="tc-btn sc4-preset" data-i="1" type="button">' + T('scene4.presetB') + '</button>' +
            '<button class="tc-btn sc4-preset" data-i="2" type="button">' + T('scene4.presetC') + '</button>' +
          '</div>' +
          '<div class="poke-box sc4-blurb" id="sc4-blurb"></div>' +
          '<p class="sc4-note muted">' + T('scene4.note') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc4-framing">' + T('scene4.framing') + '</div>';

    window.Katex.render((window.DATA && window.DATA.tex && window.DATA.tex.policy) || '\\pi : S \\rightarrow A',
      root.querySelector('.sc4-formula-host'), true);

    const board = window.Board.mount(root.querySelector('.sc4-board-host'), { variant: 'policy', legend: true });
    board.reset();

    let active = 0;
    function select(i, animate) {
      active = i;
      const preset = PRESETS[i];
      const byIndex = new Array(N);
      for (let t = 0; t < G.N_TIERS; t++) {
        for (let d = 1; d <= N_DAYS; d++) byIndex[t * N_DAYS + (d - 1)] = preset.pick(t, d);
      }
      board.paintPolicy(byIndex, { animate: !!animate });
      root.querySelectorAll('.sc4-preset').forEach((b, idx) => b.classList.toggle('primary', idx === i));
      root.querySelector('#sc4-blurb').innerHTML = T('scene4.blurb' + preset.key);
    }
    root.querySelectorAll('.sc4-preset').forEach((b) => {
      b.addEventListener('click', () => select(parseInt(b.dataset.i, 10), true));
    });

    select(0, false);

    return {
      onEnter() { select(active, false); },
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

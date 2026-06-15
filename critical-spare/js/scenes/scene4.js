/* Scene 4 -- Policy. A policy is a complete maintenance playbook: one lever for
   every one of the nine situations. Paint two real doctrines as coloured
   heat-maps before anyone says which is better: "run-to-failure" (all RUN) and
   "always-stocked" (ORDER until the bin is full), plus a third mixed one. The
   learner sees a whole doctrine at a glance. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const NH = M.NH, NS = M.NS;

  function clampLever(h, s, want) {
    const legal = M.availableLeverIds(M.mk(h, s));
    if (legal.includes(want)) return want;
    return legal.includes('order') ? 'order' : 'run';
  }
  /* Each preset is stateIdx (h*3+s) -> lever id. */
  const PRESETS = [
    { key: 'A', fn: (h, s) => 'run' },                                           // run-to-failure
    { key: 'B', fn: (h, s) => (s < 2 ? 'order' : 'run') },                       // always-stocked
    { key: 'C', fn: (h, s) => (h === 0 ? 'run' : clampLever(h, s, 'replace')) }, // swap once worn (mixed)
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
        '<div class="sc4-grid-host"></div>' +
        '<div class="sc4-panel grow">' +
          '<div class="sc4-preset-label muted">' + T('scene4.presetLabel') + '</div>' +
          '<div class="cs-btn-row sc4-presets">' +
            '<button class="cs-btn sc4-preset" data-i="0" type="button">' + T('scene4.presetA') + '</button>' +
            '<button class="cs-btn sc4-preset" data-i="1" type="button">' + T('scene4.presetB') + '</button>' +
            '<button class="cs-btn sc4-preset" data-i="2" type="button">' + T('scene4.presetC') + '</button>' +
          '</div>' +
          '<div class="poke-box sc4-blurb" id="sc4-blurb"></div>' +
          '<p class="sc4-note muted">' + T('scene4.note') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc4-framing">' + T('scene4.framing') + '</div>';

    window.Katex.render((window.DATA && window.DATA.tex && window.DATA.tex.policy) || '\\pi : S \\rightarrow A',
      root.querySelector('.sc4-formula-host'), true);

    const grid = window.Grid.mount(root.querySelector('.sc4-grid-host'), { variant: 'qtable', legend: false });
    grid.reset();

    let active = 0;
    function select(i, animate) {
      active = i;
      const preset = PRESETS[i];
      const byState = {};
      for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) byState[h * NS + s] = preset.fn(h, s);
      grid.paintPolicy(byState, { animate: !!animate });
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

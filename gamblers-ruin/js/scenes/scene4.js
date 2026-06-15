/* Scene 4, Policy. A policy is a complete betting playbook: one stake for
   every rung. Paint two (then three) hand-policies as coloured columns before
   anyone says which is better: always-$1 (all blue), always-bold (all orange),
   and a mixed one. The learner sees a policy as a colour map over the ladder.
   Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Gambler, N = G.N;

  /* Hand-policies: capital -> bet, clamped to a legal stake at each rung. */
  function clampBet(cap, want) {
    const legal = G.availableBets(cap);
    if (legal.includes(want)) return want;
    /* nearest legal: for "always bold" near edges, take the largest legal;
       for "always timid", the smallest. */
    return want >= 3 ? legal[legal.length - 1] : legal[0];
  }
  const PRESETS = [
    { key: 'A', want: (cap) => clampBet(cap, 1) },
    { key: 'B', want: (cap) => clampBet(cap, 3) },
    { key: 'C', want: (cap) => clampBet(cap, cap <= 5 ? 3 : 1) },
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
        '<div class="sc4-ladder-host"></div>' +
        '<div class="sc4-panel grow">' +
          '<div class="sc4-preset-label muted">' + T('scene4.presetLabel') + '</div>' +
          '<div class="gr-btn-row sc4-presets">' +
            '<button class="gr-btn sc4-preset" data-i="0" type="button">' + T('scene4.presetA') + '</button>' +
            '<button class="gr-btn sc4-preset" data-i="1" type="button">' + T('scene4.presetB') + '</button>' +
            '<button class="gr-btn sc4-preset" data-i="2" type="button">' + T('scene4.presetC') + '</button>' +
          '</div>' +
          '<div class="poke-box sc4-blurb" id="sc4-blurb"></div>' +
          '<p class="sc4-note muted">' + T('scene4.note') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc4-framing">' + T('scene4.framing') + '</div>';

    window.Katex.render((window.DATA && window.DATA.tex && window.DATA.tex.policy) || '\\pi : S \\rightarrow A',
      root.querySelector('.sc4-formula-host'), true);

    const ladder = window.QLadder.mount(root.querySelector('.sc4-ladder-host'), { variant: 'qtable', legend: false });
    ladder.reset();

    let active = 0;
    function select(i, animate) {
      active = i;
      const preset = PRESETS[i];
      const bets = {};
      for (let cap = 1; cap <= N; cap++) bets[cap] = preset.want(cap);
      ladder.paintPolicy(bets, { animate: !!animate });
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

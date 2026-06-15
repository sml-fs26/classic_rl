/* Scene 4, Policy / a rule from states to actions.
 *   A policy pi: S -> A is a complete playbook, one lever pre-assigned to every
 *   rung. Two hand-policies painted down the single-column gauge so a policy
 *   reads as a coloured stripe: (a) "always SEARCH" (all green, greedy) and
 *   (b) "recharge below half" (blue at low/mid, green at high/full). Toggle
 *   between them. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;

  /* policies as level(1..4) -> leverId */
  const POL_ALWAYS = { 1: 'search', 2: 'search', 3: 'search', 4: 'search' };
  const POL_CAUTIOUS = { 1: 'recharge', 2: 'recharge', 3: 'search', 4: 'search' };

  window.scenes.scene4 = function (root) {
    root.className = 'scene scene-pad sc4';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene4.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene4.lede') + '</p>' +
      '<div class="formula-card sc4-formula"><div class="formula-label">' + T('scene4.flabel') + '</div><div class="sc4-tex"></div></div>' +
      '<div class="sc4-grid">' +
        '<div class="sc4-board-host"></div>' +
        '<div class="sc4-side">' +
          '<div class="rr-btn-row">' +
            '<button class="rr-btn sc4-pa" type="button">' + T('scene4.pa') + '</button>' +
            '<button class="rr-btn sc4-pb" type="button">' + T('scene4.pb') + '</button>' +
          '</div>' +
          '<div class="poke-box sc4-say"></div>' +
        '</div>' +
      '</div>' +
      '<p class="footnote">' + T('scene4.hint') + '</p>';

    window.Katex.render(window.DATA.tex.policy, root.querySelector('.sc4-tex'), true);
    const board = window.Gauge.mount(root.querySelector('.sc4-board-host'), { variant: 'qtable', showValues: false });
    const dlg = window.Dialog.mount(root.querySelector('.sc4-say'));

    function show(which) {
      if (which === 'a') { board.paintPolicy(POL_ALWAYS, { animate: true }); dlg.say(T('scene4.say.a'), { instant: true }); }
      else { board.paintPolicy(POL_CAUTIOUS, { animate: true }); dlg.say(T('scene4.say.b'), { instant: true }); }
      root.querySelector('.sc4-pa').classList.toggle('primary', which === 'a');
      root.querySelector('.sc4-pb').classList.toggle('primary', which === 'b');
    }
    root.querySelector('.sc4-pa').addEventListener('click', () => show('a'));
    root.querySelector('.sc4-pb').addEventListener('click', () => show('b'));

    show('a');
    if (window.RR && window.RR.run) setTimeout(() => show('b'), 600);

    return { onNextKey() { return false; }, onPrevKey() { return false; } };
  };
})();

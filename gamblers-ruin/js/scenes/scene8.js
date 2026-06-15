/* Scene 8, Bellman optimality. The recursive definition as a formula card,
   read in plain English over the ladder, plus two hand-computable one-step
   backups on the edge rungs ($1 and $9, each one flip from a terminal):
     Q*($1,$1) = 0.4 * V*($2)         = V*($1)
     Q*($9,$1) = 0.4 + 0.6 * V*($8)   = V*($9)
   Numbers come from window.DATA (handBackups + V). Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const V = D.V || [];
  const hb = D.handBackups || {};

  function vAt(c) { return V[c - 1]; }

  window.scenes.scene8 = function (root) {
    root.className = 'scene scene-pad sc8';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene8.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene8.lede') + '</p>' +
      '<div class="formula-card sc8-formula">' +
        '<div class="formula-label">' + T('scene8.formulaLabel') + '</div>' +
        '<div class="sc8-formula-host"></div>' +
      '</div>' +
      '<div class="scene-row sc8-row">' +
        '<div class="sc8-ladder-host"></div>' +
        '<div class="sc8-right grow">' +
          '<div class="poke-box sc8-read"><b>' + T('scene8.readTitle') + '.</b> ' + T('scene8.read') + '</div>' +
          '<div class="sc8-worked">' +
            '<div class="sc8-worked-title">' + T('scene8.workedTitle') + '</div>' +
            '<p class="muted sc8-pick-lead">' + T('scene8.pick') + '</p>' +
            '<div class="gr-btn-row">' +
              '<button class="gr-btn sc8-pick primary" data-cap="1" type="button">' + T('scene8.btn1') + '</button>' +
              '<button class="gr-btn sc8-pick" data-cap="9" type="button">' + T('scene8.btn9') + '</button>' +
            '</div>' +
            '<div class="poke-box sc8-calc" id="sc8-calc"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc8-framing">' + T('scene8.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]',
      root.querySelector('.sc8-formula-host'), true);

    const ladder = window.QLadder.mount(root.querySelector('.sc8-ladder-host'), { variant: 'icon' });
    const calc = root.querySelector('#sc8-calc');

    function showBackup(cap) {
      ladder.setToken(cap); ladder.pulseToken();
      const tex = cap === 1
        ? 'Q^{*}(\\$1,\\,\\$1) = 0.4 \\cdot V^{*}(\\$2) + 0.6 \\cdot 0 = 0.4 \\cdot ' + vAt(2).toFixed(4) + ' = ' + (hb.c1 ? hb.c1.value : (0.4 * vAt(2)).toFixed(4))
        : 'Q^{*}(\\$9,\\,\\$1) = 0.4 \\cdot 1 + 0.6 \\cdot V^{*}(\\$8) = 0.4 + 0.6 \\cdot ' + vAt(8).toFixed(4) + ' = ' + (hb.c9 ? hb.c9.value : (0.4 + 0.6 * vAt(8)).toFixed(4));
      const expr = cap === 1 ? T('scene8.c1.expr') : T('scene8.c9.expr');
      const val = cap === 1 ? (hb.c1 ? hb.c1.value : 0.4 * vAt(2)) : (hb.c9 ? hb.c9.value : 0.4 + 0.6 * vAt(8));
      calc.innerHTML =
        '<p class="sc8-calc-expr">' + expr + '</p>' +
        '<div class="formula-block sc8-calc-tex"></div>' +
        '<div class="sc8-calc-match"><span class="sc8-check">✓</span> ' +
          val.toFixed(4) + ' ' + T('scene8.matches', { cap: cap }) +
          ' (' + vAt(cap).toFixed(4) + ')</div>';
      window.Katex.render(tex, calc.querySelector('.sc8-calc-tex'), true);
      root.querySelectorAll('.sc8-pick').forEach(b => b.classList.toggle('primary', parseInt(b.dataset.cap, 10) === cap));
      if (window.SFX) window.SFX.play('cursor');
    }
    root.querySelectorAll('.sc8-pick').forEach(b => b.addEventListener('click', () => showBackup(parseInt(b.dataset.cap, 10))));

    showBackup(1);

    return {
      onEnter() {},
      onNextKey() {
        const cur = root.querySelector('.sc8-pick.primary');
        if (cur && parseInt(cur.dataset.cap, 10) === 1) { showBackup(9); return true; }
        return false;
      },
      onPrevKey() {
        const cur = root.querySelector('.sc8-pick.primary');
        if (cur && parseInt(cur.dataset.cap, 10) === 9) { showBackup(1); return true; }
        return false;
      },
    };
  };
})();

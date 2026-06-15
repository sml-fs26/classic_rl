/* Scene 8 -- Bellman optimality. The recursive definition as a formula card,
   read in plain English, plus two hand-computable DETERMINISTIC one-step backups
   (REPLACE and ORDER both have a single, certain next state, so they are clean
   to check by hand):
     Q*(FAILING, 1, REPLACE) = (0 - 1) + 0.9 * V*(HEALTHY, 0)
     Q*(AGING,   0, ORDER)   = -2      + 0.9 * V*(AGING, 1)
   Numbers come from window.DATA (handBackups + V). Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const D = window.DATA || {};
  const hb = D.handBackups || {};

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
        '<div class="sc8-left">' +
          '<div class="sc8-machine-host"></div>' +
        '</div>' +
        '<div class="sc8-right grow">' +
          '<div class="poke-box sc8-read"><b>' + T('scene8.readTitle') + '.</b> ' + T('scene8.read') + '</div>' +
          '<div class="sc8-worked">' +
            '<div class="sc8-worked-title">' + T('scene8.workedTitle') + '</div>' +
            '<p class="muted sc8-pick-lead">' + T('scene8.pick') + '</p>' +
            '<div class="cs-btn-row">' +
              '<button class="cs-btn sc8-pick primary" data-k="repF1" type="button">' + T('scene8.btnRep') + '</button>' +
              '<button class="cs-btn sc8-pick" data-k="ordA0" type="button">' + T('scene8.btnOrd') + '</button>' +
            '</div>' +
            '<div class="poke-box sc8-calc" id="sc8-calc"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc8-framing">' + T('scene8.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\gamma\\max_{a\'} Q^{*}(S\',a\')]',
      root.querySelector('.sc8-formula-host'), true);

    const icon = window.MachineIcon.mount(root.querySelector('.sc8-machine-host'), { size: 'lg', showLabel: true });
    const calc = root.querySelector('#sc8-calc');

    /* each backup: the from-state, the deterministic landing, and the TeX. */
    const BK = {
      repF1: { h: 2, s: 1, vNext: (hb.repF1 ? hb.repF1.vNext : 0), value: (hb.repF1 ? hb.repF1.value : 0),
        tex: (v) => 'Q^{*}(\\text{FAILING},1,\\text{REPLACE}) = (0 - 1) + 0.9 \\cdot ' + v.toFixed(3) + ' = ' + (hb.repF1 ? hb.repF1.value : 0).toFixed(3),
        afterH: 0, afterS: 0 },
      ordA0: { h: 1, s: 0, vNext: (hb.ordA0 ? hb.ordA0.vNext : 0), value: (hb.ordA0 ? hb.ordA0.value : 0),
        tex: (v) => 'Q^{*}(\\text{AGING},0,\\text{ORDER}) = -2 + 0.9 \\cdot ' + v.toFixed(3) + ' = ' + (hb.ordA0 ? hb.ordA0.value : 0).toFixed(3),
        afterH: 1, afterS: 1 },
    };

    function showBackup(k) {
      const b = BK[k];
      icon.set(b.h, b.s); icon.pulse();
      calc.innerHTML =
        '<p class="sc8-calc-expr">' + T('scene8.' + k + '.expr') + '</p>' +
        '<div class="formula-block sc8-calc-tex"></div>' +
        '<div class="sc8-calc-match"><span class="sc8-check">✓</span> ' + T('scene8.' + k + '.match', { v: b.value.toFixed(3) }) + '</div>';
      window.Katex.render(b.tex(b.vNext), calc.querySelector('.sc8-calc-tex'), true);
      root.querySelectorAll('.sc8-pick').forEach(btn => btn.classList.toggle('primary', btn.dataset.k === k));
      if (window.SFX) window.SFX.play('cursor');
    }
    root.querySelectorAll('.sc8-pick').forEach(btn => btn.addEventListener('click', () => showBackup(btn.dataset.k)));

    showBackup('repF1');

    return {
      onEnter() {},
      onNextKey() {
        const cur = root.querySelector('.sc8-pick.primary');
        if (cur && cur.dataset.k === 'repF1') { showBackup('ordA0'); return true; }
        return false;
      },
      onPrevKey() {
        const cur = root.querySelector('.sc8-pick.primary');
        if (cur && cur.dataset.k === 'ordA0') { showBackup('repF1'); return true; }
        return false;
      },
    };
  };
})();

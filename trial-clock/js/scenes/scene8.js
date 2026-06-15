/* Scene 8 -- Bellman optimality. The recursive definition as a formula card,
   read in plain English over a Trial Card, plus one worked backup animated on a
   single cell: from (tier 3, day 2), a PUSH is
     BUY (0.6) -> +20 ; IGNORE (0.4) -> land in (3,1) and play best there ;
     ABANDON (0.0) -> -5
   averaged by the Conversion Wheel's odds. Numbers come from window.DATA
   (bellmanWorked + V). Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const bw = D.bellmanWorked || { tier: 3, days: 2, pBuy: 0.6, pIgnore: 0.4, pAbandon: 0, rConvert: 20, rAbandon: -5, vIgnoreNext: 12, value: 16.8, matchesV: 16.8 };

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
          '<div class="sc8-card-host"></div>' +
          '<div class="sc8-wheel-host"></div>' +
        '</div>' +
        '<div class="sc8-right grow">' +
          '<div class="poke-box sc8-read"><b>' + T('scene8.readTitle') + '.</b> ' + T('scene8.read') + '</div>' +
          '<div class="sc8-worked">' +
            '<div class="sc8-worked-title">' + T('scene8.workedTitle') + '</div>' +
            '<div class="poke-box sc8-calc" id="sc8-calc"></div>' +
            '<div class="tc-btn-row"><button class="tc-btn primary sc8-replay" type="button">' + T('scene8.replay') + '</button></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc8-framing">' + T('scene8.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]',
      root.querySelector('.sc8-formula-host'), true);

    const card = window.TrialCard.mount(root.querySelector('.sc8-card-host'), { compact: true });
    card.setState(bw.tier, bw.days);
    const wheel = window.Wheel.mount(root.querySelector('.sc8-wheel-host'), { tier: bw.tier, compact: true });
    const calc = root.querySelector('#sc8-calc');

    const pBuy = bw.pBuy, pIgnore = bw.pIgnore, pAbandon = bw.pAbandon;
    const tex =
      'Q^{*}(\\text{T' + bw.tier + ',' + bw.days + 'd}, \\text{PUSH}) = ' +
      pBuy.toFixed(1) + '\\cdot ' + bw.rConvert +
      ' + ' + pIgnore.toFixed(1) + '\\cdot V^{*}(\\text{T' + bw.tier + ',' + (bw.days - 1) + 'd})' +
      (pAbandon > 0 ? ' + ' + pAbandon.toFixed(1) + '\\cdot(' + bw.rAbandon + ')' : '') +
      ' = ' + bw.value.toFixed(2);

    function renderCalc() {
      calc.innerHTML =
        '<p class="sc8-calc-lead">' + T('scene8.calcLead', { tier: bw.tier, days: bw.days, vnext: bw.vIgnoreNext.toFixed(2) }) + '</p>' +
        '<div class="formula-block sc8-calc-tex"></div>' +
        '<div class="sc8-calc-match"><span class="sc8-check">✓</span> ' +
          bw.value.toFixed(2) + ' ' + T('scene8.matches', { tier: bw.tier, days: bw.days }) +
          ' (' + bw.matchesV.toFixed(2) + ')</div>';
      window.Katex.render(tex, calc.querySelector('.sc8-calc-tex'), true);
    }
    renderCalc();

    function replay() {
      /* show the wheel landing on BUY (the dominant wedge for tier 3) as the
         illustrative outcome, then settle. */
      card.setState(bw.tier, bw.days); card.pulse();
      wheel.setTier(bw.tier);
      wheel.spin('buy').then(() => { card.flashTerminal('convert'); setTimeout(() => card.setState(bw.tier, bw.days), 1000); });
    }
    root.querySelector('.sc8-replay').addEventListener('click', replay);
    wheel.set('buy');

    if (window.TC && window.TC.run) setTimeout(replay, 200);

    return {
      onEnter() { renderCalc(); },
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

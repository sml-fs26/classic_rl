/* Scene 3 -- Formalization: what makes this an MDP. The four parts reveal over
   the same shop screen: State s = (units, freshness); Action a in {HOLD,
   DISCOUNT, DUMP}; Transition P (the buy-meter: a sale clears one unit, a
   no-sale ages a tier); Reward r (+5/+2/−3/−6). A small box names gamma = 0.75
   as "your impatience: money now beats money at closing." Click to reveal each
   part. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const PARTS = ['state', 'action', 'transition', 'reward', 'gamma'];

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3';

    function partCard(key, sym, title, body, foot) {
      return '<div class="sc3-card sc3-' + key + '" data-part="' + key + '">' +
        '<div class="sc3-card-head"><span class="sc3-sym">' + sym + '</span><span class="sc3-card-title">' + title + '</span></div>' +
        '<div class="sc3-card-body">' + body + '</div>' +
        '<p class="sc3-card-foot">' + foot + '</p>' +
        '</div>';
    }

    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene3.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene3.lede') + '</p>' +
      '<div class="formula-card compact sc3-tuple"><div id="sc3-tuple-host"></div></div>' +
      '<div class="sc3-grid">' +
        partCard('state', 'S', T('scene3.state.title'),
          '<div class="shelf-icon sc3-shelf" id="sc3-shelf"></div>', T('scene3.state.body')) +
        partCard('action', 'A', T('scene3.action.title'),
          '<div class="sc3-levrow">' +
            '<span class="sc3-levchip lev-hold">' + T('lever.HOLD') + '</span>' +
            '<span class="sc3-levchip lev-discount">' + T('lever.DISCOUNT') + '</span>' +
            '<span class="sc3-levchip lev-dump">' + T('lever.DUMP') + '</span>' +
          '</div>', T('scene3.action.body')) +
        partCard('transition', 'P', T('scene3.transition.title'),
          '<div id="sc3-meter" class="sc3-meter"></div>', T('scene3.transition.body')) +
        partCard('reward', 'R', T('scene3.reward.title'),
          '<div class="sc3-rewrow">' +
            '<span class="sc3-rew pos">+5 ' + T('scene3.rew.hold') + '</span>' +
            '<span class="sc3-rew pos">+2 ' + T('scene3.rew.disc') + '</span>' +
            '<span class="sc3-rew neg">−3 ' + T('scene3.rew.dump') + '</span>' +
            '<span class="sc3-rew neg">−6 ' + T('scene3.rew.spoil') + '</span>' +
          '</div>', T('scene3.reward.body')) +
        partCard('gamma', 'γ', T('scene3.gamma.title'),
          '<div class="sc3-gamma-host" id="sc3-gamma-host"></div>', T('scene3.gamma.body')) +
      '</div>' +
      '<div class="gr-btn-row sc3-ctrls">' +
        '<button class="poke-btn primary sc3-reveal" type="button">' + T('scene3.reveal') + '</button>' +
        '<span class="sc3-count muted"></span>' +
      '</div>' +
      '<div class="poke-box sc3-framing">' + T('scene3.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.mdpTuple) || '\\langle S, A, P, R \\rangle', root.querySelector('#sc3-tuple-host'), true);
    window.Katex.render((D.tex && D.tex.gammaDef) || '\\gamma = 0.75', root.querySelector('#sc3-gamma-host'), true);

    const shelf = root.querySelector('#sc3-shelf');
    shelf.innerHTML =
      '<div class="shelf-tray">' + window.Croissant.svg('AGING', { px: 4 }) + window.Croissant.svg('AGING', { px: 4 }) + '</div>' +
      '<div class="shelf-label">s = (2, ' + T('tier.AGING') + ')</div>';

    const meter = window.BuyMeter.mount(root.querySelector('#sc3-meter'));
    meter.setProb(window.Bakery.buyProb('DISCOUNT', 'AGING'), Math.round(window.Bakery.buyProb('DISCOUNT', 'AGING') * 100) + '%');

    let revealed = 0;
    function updateCount() { root.querySelector('.sc3-count').textContent = T('scene3.count', { n: revealed, total: PARTS.length }); }
    function showUpTo(n) {
      revealed = Math.max(0, Math.min(PARTS.length, n));
      PARTS.forEach((p, i) => { const card = root.querySelector('.sc3-' + p); if (card) card.classList.toggle('shown', i < revealed); });
      const btn = root.querySelector('.sc3-reveal');
      if (btn) { btn.textContent = revealed >= PARTS.length ? T('scene3.allShown') : T('scene3.reveal'); btn.disabled = revealed >= PARTS.length; }
      updateCount();
    }
    root.querySelector('.sc3-reveal').addEventListener('click', () => { if (revealed < PARTS.length) { showUpTo(revealed + 1); if (window.SFX) window.SFX.play('cursor'); } });

    showUpTo(0);
    if (window.SBS && window.SBS.run) showUpTo(PARTS.length);

    return {
      onEnter() { showUpTo(revealed); },
      onNextKey() { if (revealed < PARTS.length) { showUpTo(revealed + 1); return true; } return false; },
      onPrevKey() { if (revealed > 0) { showUpTo(revealed - 1); return true; } return false; },
    };
  };
})();

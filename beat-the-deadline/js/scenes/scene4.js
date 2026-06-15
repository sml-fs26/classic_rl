/* Scene 4 -- Policy. Two hand-policies painted on the 5x5 board (Always-SEND,
   Always-WAIT-until-forced), toggled, each with its mean window payoff from
   (2,4). The board recolours; the punchline is that neither flat rule is good.
   Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.Dock;
  const DATA = window.DATA;

  window.scenes.scene4 = function (root) {
    root.className = 'scene scene-pad sc4 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene4.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene4.lede') + '</p>' +
      '<div class="formula-card compact"><div class="formula-label">' + T('scene4.toggleHint') + '</div><div class="sc4-tex"></div></div>' +
      '<div class="scene-row sc4-row">' +
        '<div class="sc4-board-host"></div>' +
        '<div class="sc4-side">' +
          '<div class="btd-btn-row sc4-toggle">' +
            '<button class="btd-btn sc4-send active" type="button" data-pol="send">' + T('scene4.toggleAlways') + '</button>' +
            '<button class="btd-btn sc4-wait" type="button" data-pol="wait">' + T('scene4.toggleWait') + '</button>' +
          '</div>' +
          '<div class="poke-box sc4-desc" id="sc4-desc"></div>' +
          '<div class="hud-strip sc4-avg">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene4.avgLabel') + '</span><span class="hud-val tnum" id="sc4-avg">0</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc4-framing">' + T('scene4.framing') + '</div>';

    if (window.Katex) window.Katex.render(DATA.tex.policy, root.querySelector('.sc4-tex'), false);

    const board = window.DockBoard.mount(root.querySelector('.sc4-board-host'), { variant: 'board', showQ: true });
    const descEl = root.querySelector('#sc4-desc');
    const avgEl = root.querySelector('#sc4-avg');
    const sendBtn = root.querySelector('.sc4-send');
    const waitBtn = root.querySelector('.sc4-wait');

    const POL = {
      send: { fn: (p, h) => 'send', desc: T('scene4.alwaysDesc'), avg: DATA.handPolicyReturns.alwaysSend },
      wait: { fn: (p, h) => (h >= 1 ? 'wait' : 'send'), desc: T('scene4.waitDesc'), avg: DATA.handPolicyReturns.alwaysWait },
    };

    function show(which, animate) {
      const cfg = POL[which];
      board.paintPolicy(cfg.fn, { animate: !!animate });
      descEl.textContent = cfg.desc;
      avgEl.textContent = (cfg.avg > 0 ? '+' : '') + cfg.avg;
      avgEl.className = 'hud-val tnum ' + (cfg.avg > 0 ? 'pos' : (cfg.avg < 0 ? 'neg' : ''));
      sendBtn.classList.toggle('active', which === 'send');
      waitBtn.classList.toggle('active', which === 'wait');
    }
    sendBtn.addEventListener('click', () => show('send', true));
    waitBtn.addEventListener('click', () => show('wait', true));

    show('send', false);

    return {};
  };
})();

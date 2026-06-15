/* Scene 4 -- Policy: a rule from tiles to actions.
 *   Define a policy pi: a heading for EVERY tile. Callback to scene 2 ("your gut
 *   was a policy"). Show two hand policies as arrow fields on the board: (a)
 *   "aim straight at the gold" -- every tile points toward the chest, so the
 *   tile below the pit marches straight in; (b) "the optimal map" -- the DP
 *   field that bends around the hazard. The learner eyeballs which looks safer,
 *   and a reach-gold stat makes it concrete. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;

  /* Build a 5x5 arrow grid for the aim-at-gold hand policy from DATA. */
  function aimGrid() {
    const g = [];
    for (let r = 0; r < C.ROWS; r++) {
      g.push([]);
      for (let c = 0; c < C.COLS; c++) {
        if (C.isTerminalRC(r, c)) { g[r].push(null); continue; }
        const h = D.handPolicies && D.handPolicies.aimAtGold && D.handPolicies.aimAtGold.headings;
        g[r].push(h ? h[r + ',' + c] : null);
      }
    }
    return g;
  }
  function optGrid() { return D.policyGrid || []; }

  window.scenes.scene4 = function (root) {
    root.className = 'scene scene-pad sc4';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene4.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene4.lede') + '</p>' +
      '<div class="formula-card sc4-formula"><div class="formula-label">' + T('scene4.formulaLabel') + '</div><div class="sc4-formula-host"></div></div>' +
      '<div class="wtc-btn-row sc4-toggle">' +
        '<button class="wtc-btn sc4-aim primary" type="button">' + T('scene4.aimBtn') + '</button>' +
        '<button class="wtc-btn sc4-opt" type="button">' + T('scene4.optBtn') + '</button>' +
      '</div>' +
      '<div class="scene-row sc4-row">' +
        '<div class="sc4-left"><div class="sc4-board-host"></div></div>' +
        '<div class="sc4-right scene-col grow">' +
          '<div class="poke-box sc4-panel" id="sc4-panel"></div>' +
          '<div class="hud-strip sc4-stat">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene4.reachGold') + '</span><span class="hud-val tnum" id="sc4-reach">--</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene4.belowPit') + '</span><span class="hud-val" id="sc4-bp">--</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc4-framing">' + T('scene4.framing') + '</div>';

    window.Katex.render(D.tex && D.tex.policy ? D.tex.policy : '\\pi : S \\rightarrow A', root.querySelector('.sc4-formula-host'), true);
    const board = window.CaveBoard.mount(root.querySelector('.sc4-board-host'), { size: 'md' });
    const panel = root.querySelector('#sc4-panel');

    let mode = 'aim';
    function show(which, animate) {
      mode = which;
      board.clearValues();
      board.setExplorer(null);
      if (which === 'aim') {
        board.setArrows(aimGrid(), { animate: !!animate });
        panel.innerHTML = '<div class="sc4-panel-title">' + T('scene4.aim.title') + '</div><div class="sc4-panel-body">' + T('scene4.aim.body') + '</div>';
        root.querySelector('#sc4-reach').textContent = pct(D.handPolicies && D.handPolicies.aimAtGold && D.handPolicies.aimAtGold.winRate);
        root.querySelector('#sc4-reach').className = 'hud-val tnum neg';
        root.querySelector('#sc4-bp').textContent = '↑ ' + T('scene4.intoPit');
        root.querySelector('#sc4-bp').className = 'hud-val neg';
        /* spotlight the below-pit tile marching in */
        board.highlight(3, 2, true);
      } else {
        board.setArrows(optGrid(), { ties: D.tieGrid, animate: !!animate });
        panel.innerHTML = '<div class="sc4-panel-title">' + T('scene4.opt.title') + '</div><div class="sc4-panel-body">' + T('scene4.opt.body') + '</div>';
        root.querySelector('#sc4-reach').textContent = pct(D.handPolicies && D.handPolicies.optimal && D.handPolicies.optimal.winRate);
        root.querySelector('#sc4-reach').className = 'hud-val tnum pos';
        root.querySelector('#sc4-bp').textContent = '→ ' + T('scene4.sideways');
        root.querySelector('#sc4-bp').className = 'hud-val pos';
        board.clearHighlights();
        board.highlight(3, 2, true);
      }
      root.querySelector('.sc4-aim').classList.toggle('primary', which === 'aim');
      root.querySelector('.sc4-opt').classList.toggle('primary', which === 'opt');
    }
    function pct(x) { return x == null ? '--' : Math.round(x * 100) + '%'; }

    root.querySelector('.sc4-aim').addEventListener('click', () => show('aim', true));
    root.querySelector('.sc4-opt').addEventListener('click', () => show('opt', true));
    show('aim', false);

    if (window.WTC && window.WTC.run) setTimeout(() => show('opt', true), 250);

    return {
      onNextKey() { if (mode === 'aim') { show('opt', true); return true; } return false; },
      onPrevKey() { if (mode === 'opt') { show('aim', true); return true; } return false; },
    };
  };
})();

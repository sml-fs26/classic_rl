/* Scene 8, Bellman optimality. The recursive definition as a formula card,
   read in plain English over the dock tile, then a guided WALK of the WAIT
   backup at (2,3), the razor-thin +0.40 flip cell, term by term:
     WAIT(2,3) = 0.2*(-10)               <- the deadline blows
               + 0.8*[0.6*V*(3,2) + 0.4*V*(2,2)]   <- you survive, average the
                                                       arrival die
               = +0.40
   plus the two hand-checkable backups (flipHi / flipLo) from
   window.DATA.handBackups, each shown to match its Q*. Numbers come from
   window.DATA. Cold-entry safe; honours &run (auto-walks). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const hb = D.handBackups || {};
  const ARR = (D.arrival != null) ? D.arrival : 0.6;

  function vAt(p, h) {
    const V = D.V || [];
    const NH = (D.nh || 5);
    const v = V[p * NH + h];
    return v == null ? 0 : v;
  }
  function fmt(x) {
    if (x == null) return '--';
    if (Math.abs(x - Math.round(x)) < 1e-6) return (x > 0 ? '+' : '') + Math.round(x);
    return (x > 0 ? '+' : '') + x.toFixed(2);
  }

  window.scenes.scene8 = function (root) {
    root.className = 'scene scene-pad sc8 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene8.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene8.lede') + '</p>' +
      '<div class="formula-card sc8-formula"><div class="sc8-tex"></div></div>' +
      '<div class="scene-row sc8-row">' +
        '<div class="sc8-left">' +
          '<div class="sc8-tile-host"></div>' +
        '</div>' +
        '<div class="sc8-right grow">' +
          '<div class="btd-btn-row sc8-ctrls">' +
            '<button class="btd-btn primary sc8-walk" type="button">' + T('scene8.walk') + '</button>' +
            '<button class="btd-btn sc8-reset" type="button" disabled>' + T('scene8.walkReset') + '</button>' +
          '</div>' +
          '<div class="sc8-steps" id="sc8-steps"></div>' +
        '</div>' +
      '</div>' +
      '<div class="sc8-hand">' +
        '<div class="sc8-hand-title">' + T('scene8.handTitle') + '</div>' +
        '<div class="sc8-hand-grid" id="sc8-hand"></div>' +
      '</div>' +
      '<div class="poke-box sc8-framing">' + T('scene8.framing') + '</div>';

    if (window.Katex) window.Katex.render((D.tex && D.tex.bellman) ||
      'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]', root.querySelector('.sc8-tex'), true);

    const tile = window.DockBoard.mount(root.querySelector('.sc8-tile-host'), { variant: 'icon', p: 2, h: 3 });
    const stepsEl = root.querySelector('#sc8-steps');
    const walkBtn = root.querySelector('.sc8-walk');
    const resetBtn = root.querySelector('.sc8-reset');

    /* The three reveal steps of the WAIT(2,3) backup. */
    const blownTerm = 0.2 * (-10);
    const surviveInner = ARR * vAt(3, 2) + (1 - ARR) * vAt(2, 2);
    const surviveTerm = 0.8 * surviveInner;
    const total = blownTerm + surviveTerm;
    const STEPS = [
      {
        cls: 'blown', show: () => { tile.setState(2, 3); tile.flashOutcome('blown'); },
        html: '<div class="sc8-step-lab">' + T('scene8.term1') + '</div>' +
          '<div class="sc8-step-math tnum">0.2 &times; (&minus;10) = ' + fmt(blownTerm) + '</div>',
      },
      {
        cls: 'wait-arr', show: () => { tile.setState(3, 2); tile.pulse(); },
        html: '<div class="sc8-step-lab">' + T('scene8.term2') + '</div>' +
          '<div class="sc8-step-math tnum">0.8 &times; [ 0.6&middot;V*(3,2) + 0.4&middot;V*(2,2) ] = 0.8 &times; [ 0.6&middot;' +
          fmt(vAt(3, 2)).replace('+', '') + ' + 0.4&middot;' + fmt(vAt(2, 2)).replace('+', '') + ' ] = ' + fmt(surviveTerm) + '</div>',
      },
      {
        cls: 'result', show: () => { tile.setState(2, 3); tile.pulse(); },
        html: '<div class="sc8-step-result tnum">' + T('scene8.result') + '</div>',
      },
    ];

    let shown = 0;
    function clear() {
      shown = 0; stepsEl.innerHTML = '';
      walkBtn.disabled = false; walkBtn.textContent = T('scene8.walk');
      resetBtn.disabled = true; tile.setState(2, 3);
    }
    function revealNext() {
      if (shown >= STEPS.length) return false;
      const st = STEPS[shown];
      st.show();
      const div = document.createElement('div');
      div.className = 'sc8-step ' + st.cls;
      div.innerHTML = st.html;
      stepsEl.appendChild(div);
      shown++;
      resetBtn.disabled = false;
      if (shown >= STEPS.length) { walkBtn.disabled = true; walkBtn.textContent = T('scene8.walk'); }
      return true;
    }
    walkBtn.addEventListener('click', revealNext);
    resetBtn.addEventListener('click', clear);

    /* The two hand-checkable backups: flipHi (WAIT wins) + flipLo (SEND wins). */
    const hands = [hb.flipHi, hb.flipLo].filter(Boolean);
    root.querySelector('#sc8-hand').innerHTML = hands.map((h) => {
      return '<div class="sc8-hand-card">' +
        '<div class="sc8-hand-cell">' + T('action.' + (h.action || 'wait')) + ' @ (' + h.p + ',' + h.h + ')</div>' +
        '<div class="sc8-hand-tex" data-tex="' + encodeURIComponent('\\text{WAIT}(' + h.p + ',' + h.h + ') = ' + h.expr) + '"></div>' +
        '<div class="sc8-hand-match"><span class="sc8-check">&#10003;</span> = ' + fmt(h.value) +
          ' = Q*(' + h.p + ',' + h.h + ',WAIT)</div>' +
      '</div>';
    }).join('');
    root.querySelectorAll('.sc8-hand-tex').forEach((el) => {
      if (window.Katex) window.Katex.render(decodeURIComponent(el.dataset.tex || ''), el, true);
    });

    clear();
    if (window.BTD && window.BTD.run) {
      setTimeout(() => revealNext(), 200);
      setTimeout(() => revealNext(), 700);
      setTimeout(() => revealNext(), 1200);
    }

    return {
      onEnter() {},
      onNextKey() { return revealNext(); },
      onPrevKey() { if (shown > 0) { clear(); return true; } return false; },
    };
  };
})();

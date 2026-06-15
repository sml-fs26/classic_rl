/* Scene 7, Optimal action-value Q*(s, a).
 *   Pick a tile (default: the one directly below the pit) and show its
 *   state-icon (the board with that tile glowing) beside a two-column table:
 *   heading a | Q*(s, a), the argmax starred. The numbers tell the story:
 *   below the pit UP = -6.66 (worst), RIGHT = +0.97 (best, starred). A tile
 *   picker lets the learner inspect the called-out cells. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;
  const Actions = window.Actions;
  const A = (D.actionIds || ['UP', 'DOWN', 'LEFT', 'RIGHT']);

  /* The four called-out tiles + a manager note key for each. */
  const SPOTS = [
    { row: 3, col: 2, key: 'belowPit' },
    { row: 0, col: 2, key: 'topSafe' },
    { row: 2, col: 1, key: 'pitLeft' },
    { row: 2, col: 3, key: 'pitRight' },
  ];

  function qRow(r, c) {
    const i = C.stateIndex({ row: r, col: c, terminal: false });
    const o = {};
    for (let a = 0; a < A.length; a++) o[A[a]] = D.Qstar[i * A.length + a];
    return o;
  }
  function bestAt(r, c) { return (D.policyGrid && D.policyGrid[r]) ? D.policyGrid[r][c] : null; }

  window.scenes.scene7 = function (root) {
    root.className = 'scene scene-pad sc7';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene7.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene7.lede') + '</p>' +
      '<div class="formula-card sc7-formula"><div class="formula-label">' + T('scene7.formulaLabel') + '</div><div class="sc7-formula-host"></div></div>' +
      '<div class="wtc-btn-row sc7-spots">' +
        SPOTS.map((s, i) => '<button class="wtc-btn sc7-spot' + (i === 0 ? ' primary' : '') + '" data-i="' + i + '" type="button">' + T('scene7.spot.' + s.key) + '</button>').join('') +
      '</div>' +
      '<div class="scene-row sc7-row">' +
        '<div class="sc7-left"><div class="sc7-board-host"></div></div>' +
        '<div class="sc7-right scene-col grow">' +
          '<div class="card sc7-table-card">' +
            '<div class="sc7-table-title" id="sc7-table-title"></div>' +
            '<table class="sc7-table"><thead><tr><th>' + T('scene7.col.action') + '</th><th>Q*(s, a)</th></tr></thead>' +
            '<tbody id="sc7-tbody"></tbody></table>' +
          '</div>' +
          '<div class="poke-box sc7-note" id="sc7-note"></div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc7-framing">' + T('scene7.framing') + '</div>';

    window.Katex.render(D.tex && D.tex.qstar ? D.tex.qstar : 'Q^{*}(s,a) = \\max_\\pi \\mathbb{E}[G_i \\mid s, a]', root.querySelector('.sc7-formula-host'), true);
    const board = window.CaveBoard.mount(root.querySelector('.sc7-board-host'), { size: 'md' });
    const tbody = root.querySelector('#sc7-tbody');

    let cur = 0;
    function show(i) {
      cur = i;
      const sp = SPOTS[i];
      board.clearArrows(); board.clearValues(); board.clearHighlights(); board.setExplorer(null);
      board.setExplorer(sp.row, sp.col);
      board.highlight(sp.row, sp.col, true);
      const q = qRow(sp.row, sp.col);
      const best = bestAt(sp.row, sp.col);
      /* sort headings best-to-worst for legibility */
      const order = A.slice().sort((x, y) => q[y] - q[x]);
      tbody.innerHTML = order.map(a => {
        const v = q[a];
        const star = (a === best) ? '<span class="sc7-star">★</span>' : '';
        const cls = (a === best) ? 'sc7-arg' : (v <= -3 ? 'sc7-bad' : '');
        return '<tr class="' + cls + '"><td><span class="dir-tag" data-dir="' + a + '">' + Actions.arrowOf(a) + ' ' + T('act.' + a) + '</span></td>' +
          '<td class="sc7-q tnum">' + (v > 0 ? '+' : '') + v.toFixed(2) + ' ' + star + '</td></tr>';
      }).join('');
      root.querySelector('#sc7-table-title').innerHTML = T('scene7.tile', { r: sp.row, c: sp.col });
      root.querySelector('#sc7-note').innerHTML = T('scene7.note.' + sp.key);
      root.querySelectorAll('.sc7-spot').forEach((b, j) => b.classList.toggle('primary', j === i));
    }

    root.querySelectorAll('.sc7-spot').forEach(b => b.addEventListener('click', () => show(parseInt(b.dataset.i, 10))));
    show(0);

    if (window.WTC && window.WTC.run) show(0);

    return {
      onNextKey() { if (cur < SPOTS.length - 1) { show(cur + 1); return true; } return false; },
      onPrevKey() { if (cur > 0) { show(cur - 1); return true; } return false; },
    };
  };
})();

/* Scene 8, Bellman optimality equation.
 *   Show Q*(s,a) = E[ R + max_{a'} Q*(S', a') ] and unpack it on the board for
 *   the below-the-pit tile aiming UP: 70% -> land on the pit (R=-10, done),
 *   15% -> gust left to (3,1), 15% -> gust right to (3,3), each with its own
 *   best-future value read off the map. Average them and recover the -6.66 from
 *   scene 7, BY HAND. STEP reveals each outcome; the running sum builds.
 *   Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;

  const HB = D.handBackup || { cell: { row: 3, col: 2 }, action: 'UP', value: -6.66, parts: { pit: -10, vLeft: -0.18, vRight: 4.42, step: -1 } };
  const CELL = HB.cell;

  /* the three outcomes of aiming UP from the below-pit cell */
  const OUTS = [
    { p: 0.7, r: CELL.row - 0, c: CELL.col, land: { row: 2, col: 2 }, kind: 'pit', reward: HB.parts.pit, vnext: 0 },
    { p: 0.15, land: { row: 3, col: 1 }, kind: 'left', reward: HB.parts.step, vnext: HB.parts.vLeft },
    { p: 0.15, land: { row: 3, col: 3 }, kind: 'right', reward: HB.parts.step, vnext: HB.parts.vRight },
  ];

  window.scenes.scene8 = function (root) {
    root.className = 'scene scene-pad sc8 concept-scene';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene8.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene8.lede') + '</p>' +
      '<div class="formula-card sc8-formula"><div class="formula-label">' + T('scene8.formulaLabel') + '</div><div class="sc8-formula-host"></div></div>' +
      '<div class="wtc-btn-row sc8-ctrls">' +
        '<button class="wtc-btn primary sc8-step" type="button">' + T('scene8.step') + '</button>' +
        '<button class="wtc-btn sc8-reset" type="button">' + T('scene8.reset') + '</button>' +
      '</div>' +
      '<div class="scene-row sc8-row">' +
        '<div class="sc8-left"><div class="sc8-board-host"></div></div>' +
        '<div class="sc8-right scene-col grow">' +
          '<div class="card sc8-work"><div class="sc8-work-title">' + T('scene8.work.title', { r: CELL.row, c: CELL.col }) + '</div>' +
            '<div class="sc8-rows" id="sc8-rows"></div>' +
            '<div class="sc8-sum" id="sc8-sum"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc8-framing">' + T('scene8.framing') + '</div>';

    window.Katex.render(D.tex && D.tex.bellman ? D.tex.bellman : 'Q^{*}(s,a) = \\mathbb{E}[R + \\max_{a\'} Q^{*}(S\',a\')]', root.querySelector('.sc8-formula-host'), true);
    const board = window.CaveBoard.mount(root.querySelector('.sc8-board-host'), { size: 'md' });
    const rowsHost = root.querySelector('#sc8-rows');
    const sumHost = root.querySelector('#sc8-sum');

    let shown = 0;
    function reset() {
      shown = 0; rowsHost.innerHTML = ''; sumHost.innerHTML = '';
      board.clearValues(); board.clearArrows(); board.clearHighlights(); board.setExplorer(CELL.row, CELL.col);
      board.highlight(CELL.row, CELL.col, true);
      /* show UP arrow from the cell */
      const g = []; for (let r = 0; r < C.ROWS; r++) { g.push([]); for (let c = 0; c < C.COLS; c++) g[r].push(null); }
      g[CELL.row][CELL.col] = 'UP';
      board.setArrows(g);
      root.querySelector('.sc8-step').disabled = false;
      root.querySelector('.sc8-step').textContent = T('scene8.step');
    }
    function term(o) { return (o.p) + ' \\times (' + o.reward + (o.kind === 'pit' ? '' : ' + ' + o.vnext.toFixed(2)) + ')'; }
    function contrib(o) { return o.p * (o.reward + (o.kind === 'pit' ? 0 : o.vnext)); }

    function stepOne() {
      if (shown >= OUTS.length) {
        /* final: show the sum */
        const total = OUTS.reduce((s, o) => s + contrib(o), 0);
        sumHost.innerHTML = '<div class="sc8-sumline"></div>';
        const host = document.createElement('div'); host.className = 'sc8-sumtex';
        window.Katex.render('Q^{*}(' + CELL.row + ',' + CELL.col + ',\\uparrow) = ' + total.toFixed(2), host, true);
        sumHost.appendChild(host);
        sumHost.insertAdjacentHTML('beforeend', '<p class="sc8-match">' + T('scene8.match', { v: total.toFixed(2) }) + '</p>');
        root.querySelector('.sc8-step').disabled = true;
        return false;
      }
      const o = OUTS[shown];
      board.highlight(o.land.row, o.land.col, true);
      if (o.kind === 'pit') board.flashTerminal('pit');
      else board.gust(CELL.row, CELL.col, o.kind, 'UP');
      const row = document.createElement('div');
      row.className = 'sc8-wrow ' + (o.kind === 'pit' ? 'neg' : '');
      row.innerHTML = '<span class="sc8-wlab">' + T('scene8.out.' + o.kind, { r: o.land.row, c: o.land.col }) + '</span>' +
        '<span class="sc8-wtex"></span>';
      rowsHost.appendChild(row);
      window.Katex.render(term(o) + ' = ' + contrib(o).toFixed(2), row.querySelector('.sc8-wtex'), false);
      shown++;
      return true;
    }

    root.querySelector('.sc8-step').addEventListener('click', stepOne);
    root.querySelector('.sc8-reset').addEventListener('click', reset);
    reset();

    if (window.WTC && window.WTC.run) { for (let i = 0; i <= OUTS.length; i++) stepOne(); }

    return {
      onNextKey() { if (shown <= OUTS.length && !root.querySelector('.sc8-step').disabled) { return stepOne(); } return false; },
      onPrevKey() { return false; },
      onEnter() { board.setExplorer(CELL.row, CELL.col); },
    };
  };
})();

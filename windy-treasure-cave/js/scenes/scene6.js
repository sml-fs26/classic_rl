/* Scene 6, Return G_i.
 *   Define the return from a step: G_i = sum of every reward from here to the
 *   end. A SAMPLE RUNS button fires episodes from the SAME tile (the twist cell
 *   below the pit) under the SAME chosen heading, and a histogram of their
 *   returns fans out: same first move, a SPREAD of outcomes, because the wind
 *   differs. Toggle the optimal RIGHT vs the reckless UP. The exact expected
 *   return (= Q*) is shown as the mean line. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;

  const RB = D.returnBars || {};
  const CELL = RB.cell || { row: 3, col: 2 };

  function rollEpisode(firstAction, rng) {
    let s = { row: CELL.row, col: CELL.col, terminal: false }, first = true, guard = 0, R = 0;
    while (!s.terminal && guard++ < 200) {
      const aId = first ? firstAction : D.policy[C.stateIndex(s)];
      first = false;
      const out = C.sample(s, aId, rng);
      R += out.reward;
      s = out.sNext;
    }
    return R;
  }

  window.scenes.scene6 = function (root) {
    root.className = 'scene scene-pad sc6';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene6.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene6.lede') + '</p>' +
      '<div class="formula-card sc6-formula"><div class="formula-label">' + T('scene6.formulaLabel') + '</div><div class="sc6-formula-host"></div></div>' +
      '<div class="wtc-btn-row sc6-ctrls">' +
        '<span class="sc6-from muted">' + T('scene6.from', { r: CELL.row, c: CELL.col }) + '</span>' +
        '<button class="wtc-btn sc6-right primary" type="button">' + T('scene6.rightBtn') + '</button>' +
        '<button class="wtc-btn sc6-up" type="button">' + T('scene6.upBtn') + '</button>' +
      '</div>' +
      '<div class="wtc-btn-row sc6-ctrls2">' +
        '<button class="wtc-btn sc6-sample" type="button">' + T('scene6.sample') + '</button>' +
        '<button class="wtc-btn sc6-clear" type="button">' + T('scene6.clear') + '</button>' +
        '<span class="sc6-count muted" id="sc6-count"></span>' +
      '</div>' +
      '<div class="scene-row sc6-row">' +
        '<div class="sc6-left"><div class="sc6-board-host"></div></div>' +
        '<div class="sc6-right-col scene-col grow">' +
          '<div class="sc6-hist-wrap"><div class="sc6-hist" id="sc6-hist"></div>' +
            '<div class="sc6-axis" id="sc6-axis"></div></div>' +
          '<div class="hud-strip sc6-stat">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene6.expected') + '</span><span class="hud-val tnum" id="sc6-exp">--</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene6.sampleMean') + '</span><span class="hud-val tnum" id="sc6-mean">--</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc6-framing">' + T('scene6.framing') + '</div>';

    window.Katex.render(D.tex && D.tex.return ? D.tex.return : 'G_i(\\tau) = \\sum_{j \\ge i} r_j', root.querySelector('.sc6-formula-host'), true);
    const board = window.CaveBoard.mount(root.querySelector('.sc6-board-host'), { size: 'md' });
    board.setExplorer(CELL.row, CELL.col);
    board.highlight(CELL.row, CELL.col, true);
    const histEl = root.querySelector('#sc6-hist');
    const axisEl = root.querySelector('#sc6-axis');

    /* histogram buckets across the return range. Returns are integers; cluster
       into bins so the two shapes (mostly +9-ish vs mostly -11-ish) read. */
    const BINS = [
      { lo: -14, hi: -6, label: 'PIT', cls: 'neg' },
      { lo: -6, hi: -2, label: '', cls: '' },
      { lo: -2, hi: 2, label: '', cls: '' },
      { lo: 2, hi: 6, label: '', cls: '' },
      { lo: 6, hi: 14, label: 'GOLD', cls: 'pos' },
    ];
    let mode = 'RIGHT';
    let counts = BINS.map(() => 0);
    let total = 0;
    let rng = C.makeRng(0x6E7);

    function setMode(m) {
      mode = m;
      counts = BINS.map(() => 0); total = 0;
      root.querySelector('.sc6-right').classList.toggle('primary', m === 'RIGHT');
      root.querySelector('.sc6-up').classList.toggle('primary', m === 'UP');
      const exact = (m === 'RIGHT' ? (RB.optimal && RB.optimal.exact) : (RB.naive && RB.naive.exact));
      const ex = root.querySelector('#sc6-exp');
      ex.textContent = exact == null ? '--' : (exact > 0 ? '+' : '') + exact;
      ex.className = 'hud-val tnum ' + (exact >= 0 ? 'pos' : 'neg');
      board.clearArrows();
      const g = []; for (let r = 0; r < C.ROWS; r++) { g.push([]); for (let c = 0; c < C.COLS; c++) g[r].push(null); }
      g[CELL.row][CELL.col] = m;
      board.setArrows(g);
      draw();
    }
    function binOf(R) { for (let i = 0; i < BINS.length; i++) if (R >= BINS[i].lo && R < BINS[i].hi) return i; return R < BINS[0].lo ? 0 : BINS.length - 1; }
    function draw() {
      const max = Math.max(1, ...counts);
      histEl.innerHTML = BINS.map((b, i) => {
        const h = Math.round(counts[i] / max * 100);
        return '<div class="sc6-bar-col"><div class="sc6-bar ' + b.cls + '" style="height:' + h + '%"></div>' +
          '<div class="sc6-bar-n">' + (counts[i] || '') + '</div></div>';
      }).join('');
      axisEl.innerHTML = BINS.map(b => '<span class="sc6-axis-lab">' + (b.label || (b.lo + '..' + b.hi)) + '</span>').join('');
      root.querySelector('#sc6-count').textContent = total ? T('scene6.runs', { n: total }) : '';
      const meanEl = root.querySelector('#sc6-mean');
      meanEl.textContent = total ? (sampleMean() > 0 ? '+' : '') + sampleMean().toFixed(1) : '--';
    }
    let sumR = 0;
    function sampleMean() { return total ? sumR / total : 0; }
    function clearRuns() { counts = BINS.map(() => 0); total = 0; sumR = 0; draw(); }

    function sampleBatch(n) {
      let i = 0;
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const fast = reduced || (window.WTC && window.WTC.run);
      function one() {
        const R = rollEpisode(mode, rng);
        counts[binOf(R)]++; total++; sumR += R;
        i++;
        if (i % (fast ? n : 1) === 0 || i >= n) draw();
        if (i < n) { if (fast) one(); else setTimeout(one, 70); }
      }
      one();
    }

    root.querySelector('.sc6-right').addEventListener('click', () => setMode('RIGHT'));
    root.querySelector('.sc6-up').addEventListener('click', () => setMode('UP'));
    root.querySelector('.sc6-sample').addEventListener('click', () => sampleBatch(20));
    root.querySelector('.sc6-clear').addEventListener('click', clearRuns);
    setMode('RIGHT'); sumR = 0; clearRuns();

    if (window.WTC && window.WTC.run) setTimeout(() => sampleBatch(60), 200);

    return { onEnter() { board.setExplorer(CELL.row, CELL.col); } };
  };
})();

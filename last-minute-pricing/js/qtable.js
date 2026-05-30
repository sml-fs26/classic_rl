/* qtable.js -- the 5x4 PRICING BOARD widget for Last-Minute Pricing.
 *
 *   Reskinned from the Pokemon 5x5 bucket grid. Renders the whole Q-table on
 *   one screen: a 5-row x 4-col board of business situations plus a dark
 *   MIDNIGHT gutter column on the right (the deadline, d=0, where leftover
 *   units go worthless).
 *
 *     rows  = units left, 5 at the TOP down to 1 at the BOTTOM   (row = 5 - u)
 *     cols  = days to deadline, 4 at the LEFT down to 1, then the MIDNIGHT
 *             gutter        (col c = 4 - d for the playable cols; gutter last)
 *     cell stateIndex = row * NUM_DAYS + col   (= window.Pricing.stateIndex)
 *
 *   Each playable cell shows, top to bottom:
 *     - a MINI shelf-card icon for that (u, d) state (window.ShelfCard, mini),
 *     - the three lever rows (PREMIUM / STANDARD / FIRE-SALE) each with its
 *       Q value; the argmax row is starred (★) and the whole cell is tinted
 *       with the winning lever's colour, so the 3-region optimal-policy
 *       overlay with its diagonal seam reads at a glance.
 *
 *   API (window.QTable):
 *     mount(host, opts?) -> handle {
 *        update(Q, opts), reset(), host,
 *        setOnCellClick(cb), getCellNode(stateIndex), cells
 *     }
 *        opts.heat (default true) — also paint a max-Q heat tint UNDER the
 *          policy tint? Off by default for pricing: the lever-region overlay
 *          IS the colour story. Pass { heat:true } to layer a brightness ramp.
 *
 *     handle.update(Q, opts):
 *        Q is indexed Q[stateIndex * A + leverIdx] with leverIdx in the order
 *        window.Levers.LEVER_IDS = [premium, standard, firesale] (the same
 *        order window.Bellman.qFromV / window.DATA.Qstar use). Re-renders all
 *        values, flips the ★ star + the cell's lever-region tint, and (unless
 *        opts.suppressFlash) floats +/- deltas and pings a sound on argmax
 *        flips. A cell whose Q row is still all-zero is drawn 'unvisited'.
 *
 *   The widget is theme-agnostic: every colour comes from CSS tokens, so the
 *   CRT retint is automatic. Styles live in css/qtable.css. */
(function () {
  const P = window.Pricing;
  const LEVER_IDS = window.Levers.LEVER_IDS;            // [premium, standard, firesale]
  const A = LEVER_IDS.length;                            // 3
  const ROWS = P.ROWS;                                   // 5 (units 5..1)
  const COLS = P.COLS;                                   // 4 (days 4..1)
  const N = P.N;                                          // 20
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  function shortLeverLabel(id) {
    return T('lever.' + id + '.short');
  }
  function leverPrice(id) {
    return window.Levers.priceOf ? window.Levers.priceOf(id) : 0;
  }

  function mount(host, opts) {
    const o = opts || {};
    const useHeat = !!o.heat;            // policy tint is the default colour story
    host.classList.add('qtable-host', 'pricing-board');
    host.innerHTML = '';

    /* Column-header row: a corner label + the four day columns + MIDNIGHT. */
    const headerRow = document.createElement('div');
    headerRow.className = 'q-col-heads';
    headerRow.style.setProperty('--cols', String(COLS));
    let heads = '<div class="q-corner-head">' + T('qtable.corner') + '</div>';
    for (let c = 0; c < COLS; c++) {
      const d = COLS - c;
      heads += '<div class="q-col-head">' + T('qtable.dayCol', { d: d }) + '</div>';
    }
    heads += '<div class="q-col-head q-gutter-head">' + T('vocab.midnight') + '</div>';
    headerRow.innerHTML = heads;
    host.appendChild(headerRow);

    /* The board grid: a row-label column + COLS state columns + a MIDNIGHT
       gutter column. */
    const grid = document.createElement('div');
    grid.className = 'q-grid';
    grid.style.setProperty('--cols', String(COLS));
    grid.style.setProperty('--rows', String(ROWS));
    host.appendChild(grid);

    /* Left row-labels (units left, 5 at top .. 1 at bottom). */
    for (let r = 0; r < ROWS; r++) {
      const u = ROWS - r;
      const lab = document.createElement('div');
      lab.className = 'q-row-head';
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(r + 1);
      lab.innerHTML = T('qtable.unitRow', { u: u });
      grid.appendChild(lab);
    }

    /* MIDNIGHT gutter — one tall dark cell spanning all rows on the right. */
    const gutter = document.createElement('div');
    gutter.className = 'q-midnight-gutter';
    gutter.style.gridColumn = String(COLS + 2);          // after labels + COLS
    gutter.style.gridRow = '1 / span ' + ROWS;
    gutter.innerHTML =
      '<div class="q-gutter-label">' + T('vocab.midnight') + '</div>' +
      '<div class="q-gutter-sub">' + T('qtable.gutterSub') + '</div>';
    grid.appendChild(gutter);

    const cellNodes = [];   /* per stateIndex: { cell, shelf, rows:[{row,mark,val}], u, d } */
    for (let s = 0; s < N; s++) {
      const st = P.stateFromIndex(s);
      const r = P.row(st);    // 0..ROWS-1
      const c = P.col(st);    // 0..COLS-1
      const cell = document.createElement('div');
      cell.className = 'q-cell';
      cell.style.gridColumn = String(c + 2);   // +2: col 1 is the row-label
      cell.style.gridRow = String(r + 1);
      cell.dataset.state = String(s);
      cell.dataset.u = String(st.u);
      cell.dataset.d = String(st.d);

      /* Mini shelf-card icon for this (u, d). */
      const shelfHost = document.createElement('div');
      shelfHost.className = 'q-shelf';
      cell.appendChild(shelfHost);
      const shelf = (window.ShelfCard && window.ShelfCard.mount)
        ? window.ShelfCard.mount(shelfHost, { u: st.u, d: st.d, size: 'mini' })
        : null;

      /* The three lever rows. */
      const bars = document.createElement('div');
      bars.className = 'q-bars';
      const rowNodes = [];
      for (let a = 0; a < A; a++) {
        const aid = LEVER_IDS[a];
        const row = document.createElement('div');
        row.className = 'q-bar-row';
        row.dataset.lever = aid;
        row.innerHTML =
          '<span class="q-mark"></span>' +
          '<span class="q-swatch lever-fill-' + aid + '"></span>' +
          '<span class="q-label">' + shortLeverLabel(aid) + '</span>' +
          '<span class="q-val">—</span>';
        bars.appendChild(row);
        rowNodes[a] = {
          row: row,
          mark: row.querySelector('.q-mark'),
          val: row.querySelector('.q-val'),
        };
      }
      cell.appendChild(bars);

      grid.appendChild(cell);
      cellNodes[s] = { cell, shelf, rows: rowNodes, u: st.u, d: st.d };
    }

    /* Lever-usage strip below the grid (how many of the 20 cells each lever
       wins) — the pricing analogue of the move-frequency strip. */
    const freqStrip = document.createElement('div');
    freqStrip.className = 'q-freq-strip';
    freqStrip.innerHTML = '<div class="q-freq-title">' + T('qtable.usageTitle', { n: N }) + '</div>';
    const freqRows = {};
    for (const aid of LEVER_IDS) {
      const row = document.createElement('div');
      row.className = 'q-freq-row';
      row.dataset.lever = aid;
      row.innerHTML =
        '<span class="q-freq-swatch lever-fill-' + aid + '"></span>' +
        '<span class="q-freq-label">' + shortLeverLabel(aid) + '</span>' +
        '<span class="q-freq-track"><span class="q-freq-fill lever-fill-' + aid + '"></span></span>' +
        '<span class="q-freq-val">0</span>';
      freqStrip.appendChild(row);
      freqRows[aid] = {
        fill: row.querySelector('.q-freq-fill'),
        val: row.querySelector('.q-freq-val'),
      };
    }
    host.appendChild(freqStrip);

    /* Legend. */
    const legend = document.createElement('div');
    legend.className = 'q-legend';
    legend.innerHTML =
      '<span class="q-legend-item"><span class="q-legend-swatch lever-fill-premium"></span> ' + T('lever.premium') + '</span>' +
      '<span class="q-legend-item"><span class="q-legend-swatch lever-fill-standard"></span> ' + T('lever.standard') + '</span>' +
      '<span class="q-legend-item"><span class="q-legend-swatch lever-fill-firesale"></span> ' + T('lever.firesale') + '</span>' +
      '<span class="q-legend-item">★ = ' + T('qtable.bestLever') + '</span>';
    host.appendChild(legend);

    const ALL_LEVER_TINTS = ['lever-tint-premium', 'lever-tint-standard', 'lever-tint-firesale'];
    const HEAT_CLASSES = ['heat-zero', 'heat-1', 'heat-2', 'heat-3', 'heat-4'];

    function heatClassFor(maxQ, allZero) {
      if (allZero) return 'heat-zero';
      if (maxQ >= 10) return 'heat-4';
      if (maxQ >= 6)  return 'heat-3';
      if (maxQ >= 3)  return 'heat-2';
      return 'heat-1';
    }

    let prevQ = null;

    function update(Q, opt) {
      const oo = opt || {};
      const counts = {};
      for (const aid of LEVER_IDS) counts[aid] = 0;

      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        const base = s * A;

        let allZero = true;
        let best = -Infinity, k = 0;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > best) { best = v; k = a; }
        }

        /* Clear prior tints. */
        for (const t of ALL_LEVER_TINTS) node.cell.classList.remove(t);
        for (const h of HEAT_CLASSES) node.cell.classList.remove(h);

        if (allZero) {
          node.cell.classList.add('unvisited');
          if (useHeat) node.cell.classList.add('heat-zero');
          for (let a = 0; a < A; a++) {
            node.rows[a].val.textContent = '—';
            node.rows[a].row.classList.remove('argmax');
            node.rows[a].mark.textContent = '';
          }
        } else {
          node.cell.classList.remove('unvisited');
          const winId = LEVER_IDS[k];
          node.cell.classList.add('lever-tint-' + winId);
          if (useHeat) node.cell.classList.add(heatClassFor(best, false));
          for (let a = 0; a < A; a++) {
            const v = Q[base + a];
            node.rows[a].val.textContent = v.toFixed(2);
            const isArg = a === k;
            node.rows[a].row.classList.toggle('argmax', isArg);
            node.rows[a].mark.textContent = isArg ? '★' : '';
          }
          counts[winId]++;
        }

        /* Per-step VFX (skipped on the first paint / when suppressed). */
        if (prevQ && !oo.suppressFlash) {
          let pBest = -Infinity, pk = -1, prevAllZero = true;
          for (let a = 0; a < A; a++) {
            if (Math.abs(prevQ[base + a]) > 1e-9) prevAllZero = false;
            if (prevQ[base + a] > pBest) { pBest = prevQ[base + a]; pk = a; }
          }
          if (!prevAllZero && !allZero) {
            const delta = Q[base + k] - prevQ[base + k];
            if (Math.abs(delta) > 0.05) spawnDelta(node.cell, delta);
            if (pk !== k) {
              node.cell.classList.remove('lever-flip');
              void node.cell.offsetWidth;
              node.cell.classList.add('lever-flip');
              setTimeout(() => node.cell.classList.remove('lever-flip'), 1100);
              scheduleFlipDing();
            }
          } else if (prevAllZero && !allZero) {
            spawnAwake(node.cell);
          }
        }
      }

      for (const aid of LEVER_IDS) {
        const fr = freqRows[aid];
        const count = counts[aid];
        fr.val.textContent = String(count);
        fr.fill.style.width = (count / N * 100) + '%';
      }

      prevQ = Float64Array.from(Q);
    }

    /* Debounced ding so a RUN-ALL sweep flipping many cells in one frame
       plays a single blip, not a cascade. */
    let flipDingTimer = null;
    function scheduleFlipDing() {
      if (flipDingTimer) return;
      flipDingTimer = setTimeout(() => {
        flipDingTimer = null;
        if (window.SFX) window.SFX.play('cursor');
      }, 220);
    }

    function spawnDelta(cell, delta) {
      const el = document.createElement('div');
      el.className = 'q-delta ' + (delta >= 0 ? 'pos' : 'neg');
      el.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(2);
      cell.appendChild(el);
      setTimeout(() => { try { cell.removeChild(el); } catch (e) {} }, 1300);
    }
    function spawnAwake(cell) {
      const el = document.createElement('div');
      el.className = 'q-delta pos awake';
      el.textContent = T('qtable.priced');
      cell.appendChild(el);
      setTimeout(() => { try { cell.removeChild(el); } catch (e) {} }, 1500);
      cell.classList.remove('q-just-priced');
      void cell.offsetWidth;
      cell.classList.add('q-just-priced');
      setTimeout(() => cell.classList.remove('q-just-priced'), 1100);
    }

    function reset() {
      prevQ = null;
      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        node.cell.classList.add('unvisited');
        node.cell.classList.remove('lever-flip');
        for (const t of ALL_LEVER_TINTS) node.cell.classList.remove(t);
        for (const h of HEAT_CLASSES) node.cell.classList.remove(h);
        for (let a = 0; a < A; a++) {
          node.rows[a].val.textContent = '—';
          node.rows[a].row.classList.remove('argmax');
          node.rows[a].mark.textContent = '';
        }
      }
      for (const aid of LEVER_IDS) {
        freqRows[aid].val.textContent = '0';
        freqRows[aid].fill.style.width = '0%';
      }
    }

    /* Click wiring — affordance only painted once a caller registers. */
    let cellClickCb = null;
    for (let s = 0; s < N; s++) {
      const node = cellNodes[s];
      node.cell.addEventListener('click', () => {
        if (cellClickCb) cellClickCb(s, node.cell);
      });
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let s = 0; s < N; s++) {
        cellNodes[s].cell.classList.toggle('clickable', !!cb);
      }
    }
    function getCellNode(s) { return cellNodes[s] ? cellNodes[s].cell : null; }

    reset();
    return { update, reset, host, setOnCellClick, getCellNode, cells: cellNodes };
  }

  /* Standalone argmax-count helper (mirrors the engine's lever ordering). */
  function leverCounts(Q) {
    const c = {};
    for (const aid of LEVER_IDS) c[aid] = 0;
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let m = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(Q[base + a]) > 1e-9) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      }
      if (!allZero) c[LEVER_IDS[k]]++;
    }
    return c;
  }

  window.QTable = { mount, leverCounts, shortLeverLabel, leverPrice };
})();

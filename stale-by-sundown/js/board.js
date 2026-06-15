/* board.js -- the 5x3 DISPLAY CASE widget for Stale by Sundown.
 *
 *   The recurring state-board AND the whole Q-table, one object. Five rows
 *   (freshness: FRESH at the warm top .. STALE at the grey bottom) by three
 *   columns (units 1..3). Each cell holds a croissant-icon (ripened to its
 *   tier) plus, depending on the scene, a value number and/or the recommended
 *   lever chip, tinted by that lever's colour (HOLD green / DISCOUNT amber /
 *   DUMP red). The converged board therefore shows a GREEN CAP, an AMBER MIDDLE
 *   BAND, and a RED FLOOR -- the three-way flip you can see across the room.
 *
 *   mount(host, opts) -> handle {
 *     paintPolicy(policy, opts)   // tint each cell by its lever + show the chip
 *     paintQ(Q, opts)             // show all 3 Q values per cell, star the best,
 *                                 //   tint the cell by the winning lever
 *     paintValues(V, opts)        // show V*(cell) numbers (no chips)
 *     setSolved(stateIdx, bool)   // dim un-filled cells (DP fill)
 *     setToken(stateIdx | null)   // place / move the bright "you are here" ring
 *     pulseToken()                // brief emphasis on the token cell
 *     flashCell(stateIdx)         // a yellow burst on one cell
 *     getCell(u, tier)            // the cell element
 *     setOnCellClick(cb)          // make cells clickable -> cb(u, tier, el)
 *     reset()                     // clear values/chips, all cells 'unsolved'
 *     host
 *   }
 *     opts.variant: 'icon'   -> compact case, croissant icons only (state board)
 *                   'policy' -> icons + a lever chip per cell (the playbook)
 *                   'qtable' -> icons + 3 Q rows per cell + V* (the scorecard)
 *     opts.compact: smaller cells (for side-by-side boards in scene 11)
 *
 *   Q is indexed Q[stateIndex * A + leverIdx], stateIndex = (units-1)*5 +
 *   tierIndex, leverIdx over window.Levers.LEVER_IDS = [HOLD, DISCOUNT, DUMP].
 *   Theme-agnostic: every colour comes from CSS tokens. Styles in css/board.css. */
(function () {
  const B = window.Bakery;
  const TIERS = B.TIERS;             // FRESH..STALE (top..bottom)
  const UNITS = B.UNITS;             // 1..3
  const LEVER_IDS = window.Levers.LEVER_IDS;  // [HOLD, DISCOUNT, DUMP]
  const A = LEVER_IDS.length;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  function tierLabel(t) { return T('tier.' + t); }
  function leverLabel(id) { return T('lever.' + id); }
  function leverClass(id) { return 'lev-' + id.toLowerCase(); }

  function mount(host, opts) {
    const o = opts || {};
    const variant = o.variant || 'icon';
    host.classList.add('case', 'case-' + variant);
    if (o.compact) host.classList.add('case-compact');
    host.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'case-grid';
    host.appendChild(grid);

    /* corner + column headers (units 1..3) */
    const corner = document.createElement('div');
    corner.className = 'case-corner';
    corner.textContent = o.cornerLabel != null ? o.cornerLabel : '';
    grid.appendChild(corner);
    for (const u of UNITS) {
      const ch = document.createElement('div');
      ch.className = 'case-colhead';
      ch.innerHTML = '<span class="case-unit-pips" data-u="' + u + '"></span><span class="case-colnum">' + u + '</span>';
      grid.appendChild(ch);
    }

    const cellNodes = {};   // stateIdx -> { cell, rows:[{row,val,mark}], vval, chip }
    for (const t of TIERS) {
      const rh = document.createElement('div');
      rh.className = 'case-rowhead tier-' + t.toLowerCase();
      rh.innerHTML = '<span class="case-tier-name">' + tierLabel(t) + '</span>';
      grid.appendChild(rh);

      for (const u of UNITS) {
        const si = B.stateIndex(B.makeState(u, t));
        const cell = document.createElement('div');
        cell.className = 'case-cell tier-' + t.toLowerCase();
        cell.dataset.si = String(si);
        cell.dataset.u = String(u);
        cell.dataset.tier = t;

        const icon = document.createElement('div');
        icon.className = 'case-icon';
        icon.innerHTML = window.Croissant.svg(t, { px: o.compact ? 2 : 4 });
        cell.appendChild(icon);

        /* tray dots showing the unit count (1..3) */
        const tray = document.createElement('div');
        tray.className = 'case-tray';
        let dots = '';
        for (let k = 0; k < 3; k++) dots += '<span class="tray-dot' + (k < u ? ' on' : '') + '"></span>';
        tray.innerHTML = dots;
        cell.appendChild(tray);

        const node = { cell, rows: null, vval: null, chip: null };

        if (variant === 'qtable') {
          const rows = document.createElement('div');
          rows.className = 'case-qrows';
          const rowNodes = [];
          for (let a = 0; a < A; a++) {
            const id = LEVER_IDS[a];
            const r = document.createElement('div');
            r.className = 'case-qrow ' + leverClass(id);
            r.dataset.lever = id;
            r.innerHTML =
              '<span class="case-qmark"></span>' +
              '<span class="case-qswatch ' + leverClass(id) + '"></span>' +
              '<span class="case-qlab">' + leverLabel(id) + '</span>' +
              '<span class="case-qval">·</span>';
            rows.appendChild(r);
            rowNodes[a] = { row: r, val: r.querySelector('.case-qval'), mark: r.querySelector('.case-qmark') };
          }
          cell.appendChild(rows);
          node.rows = rowNodes;
          if (o.showValues) {
            const vbox = document.createElement('div');
            vbox.className = 'case-vstar';
            vbox.innerHTML = '<span class="case-vlab">V*</span><span class="case-vval">·</span>';
            cell.appendChild(vbox);
            node.vval = vbox.querySelector('.case-vval');
          }
        } else if (variant === 'policy') {
          const chip = document.createElement('div');
          chip.className = 'case-chip';
          cell.appendChild(chip);
          node.chip = chip;
          if (o.showValues) {
            const vbox = document.createElement('div');
            vbox.className = 'case-vstar';
            vbox.innerHTML = '<span class="case-vval">·</span>';
            cell.appendChild(vbox);
            node.vval = vbox.querySelector('.case-vval');
          }
        }

        const ring = document.createElement('div');
        ring.className = 'case-token-ring';
        ring.hidden = true;
        cell.appendChild(ring);

        cellNodes[si] = node;
        grid.appendChild(cell);
      }
    }

    /* optional legend (lever colour key + star). */
    if (o.legend) {
      const legend = document.createElement('div');
      legend.className = 'case-legend';
      legend.innerHTML =
        LEVER_IDS.map(id => '<span class="case-legend-item"><span class="case-legend-swatch ' + leverClass(id) + '"></span>' + leverLabel(id) + '</span>').join('') +
        (variant === 'qtable' ? '<span class="case-legend-item">&#9733; = ' + T('board.bestLever') + '</span>' : '');
      host.appendChild(legend);
    }

    const ALL_TINTS = LEVER_IDS.map(id => 'tint-' + id.toLowerCase());
    const STAR = '★';
    let curToken = null;
    let prevBest = null;   // for argmax-flip flash in paintQ

    function clearTints(cell) { for (const t of ALL_TINTS) cell.classList.remove(t); }

    function bestIdx(Q, si) {
      const base = si * A;
      let m = -Infinity, k = -1, allZero = true;
      for (let a = 0; a < A; a++) {
        const v = Q[base + a];
        if (v == null || !isFinite(v)) continue;
        if (Math.abs(v) > 1e-9) allZero = false;
        if (v > m) { m = v; k = a; }   // strict > : earlier (higher-margin) lever wins ties
      }
      return { k, allZero, best: m };
    }

    function paintQ(Q, opt) {
      if (variant !== 'qtable') return;
      const oo = opt || {};
      const nowBest = {};
      for (const t of TIERS) for (const u of UNITS) {
        const si = B.stateIndex(B.makeState(u, t));
        const node = cellNodes[si];
        const base = si * A;
        const { k, allZero } = bestIdx(Q, si);
        clearTints(node.cell);
        if (allZero || k < 0) {
          node.cell.classList.add('unsolved');
          for (let a = 0; a < A; a++) { node.rows[a].val.textContent = '·'; node.rows[a].mark.textContent = ''; node.rows[a].row.classList.remove('argmax'); }
          if (node.vval) node.vval.textContent = '·';
          continue;
        }
        node.cell.classList.remove('unsolved');
        node.cell.classList.add('tint-' + LEVER_IDS[k].toLowerCase());
        nowBest[si] = k;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          node.rows[a].val.textContent = (v == null || !isFinite(v)) ? '·' : v.toFixed(2);
          const isArg = a === k;
          node.rows[a].row.classList.toggle('argmax', isArg);
          node.rows[a].mark.textContent = isArg ? STAR : '';
        }
        if (node.vval) node.vval.textContent = Q[base + k].toFixed(2);
        if (prevBest && !oo.suppressFlash && prevBest[si] != null && prevBest[si] !== k) {
          node.cell.classList.remove('cell-flip'); void node.cell.offsetWidth; node.cell.classList.add('cell-flip');
          setTimeout(() => node.cell.classList.remove('cell-flip'), 800);
        }
      }
      prevBest = nowBest;
    }

    function paintValues(V, opt) {
      const oo = opt || {};
      for (const t of TIERS) for (const u of UNITS) {
        const si = B.stateIndex(B.makeState(u, t));
        const node = cellNodes[si];
        if (node.vval) node.vval.textContent = (V[si] == null ? '·' : V[si].toFixed(2));
        if (oo.tintByValue) {
          /* nothing -- values scene keeps neutral cells */
        }
      }
    }

    /* Paint a POLICY directly: policy is a 15-array of lever-id strings (or a
       map). Tints each cell by its lever and shows the chip. */
    function paintPolicy(policy, opt) {
      const oo = opt || {};
      for (const t of TIERS) for (const u of UNITS) {
        const si = B.stateIndex(B.makeState(u, t));
        const node = cellNodes[si];
        const id = Array.isArray(policy) ? policy[si] : policy[si];
        clearTints(node.cell);
        node.cell.classList.remove('unsolved');
        if (!id) { if (node.chip) node.chip.textContent = ''; continue; }
        node.cell.classList.add('tint-' + id.toLowerCase());
        if (variant === 'qtable' && node.rows) {
          for (let a = 0; a < A; a++) {
            const isPick = LEVER_IDS[a] === id;
            node.rows[a].row.classList.toggle('argmax', isPick);
            node.rows[a].mark.textContent = isPick ? STAR : '';
            node.rows[a].val.textContent = isPick ? '✓' : '·';
          }
        }
        if (node.chip) {
          node.chip.textContent = leverLabel(id);
          node.chip.className = 'case-chip ' + leverClass(id);
        }
        if (oo.animate) {
          const ti = TIERS.indexOf(t);
          const d = (TIERS.length - 1 - ti) * 70 + (u - 1) * 18;
          (function (el, delay) {
            setTimeout(() => { el.classList.remove('cell-flip'); void el.offsetWidth; el.classList.add('cell-flip'); setTimeout(() => el.classList.remove('cell-flip'), 700); }, delay);
          })(node.cell, d);
        }
      }
    }

    function setSolved(si, solved) {
      const node = cellNodes[si];
      if (node) node.cell.classList.toggle('pending', !solved);
    }
    function setToken(si) {
      if (curToken != null && cellNodes[curToken]) {
        const r = cellNodes[curToken].cell.querySelector('.case-token-ring');
        if (r) r.hidden = true;
        cellNodes[curToken].cell.classList.remove('has-token');
      }
      curToken = si;
      if (si == null) return;
      const node = cellNodes[si];
      if (node) {
        const r = node.cell.querySelector('.case-token-ring');
        if (r) r.hidden = false;
        node.cell.classList.add('has-token');
      }
    }
    function pulseToken() {
      if (curToken == null || !cellNodes[curToken]) return;
      const el = cellNodes[curToken].cell;
      el.classList.remove('cell-pulse'); void el.offsetWidth; el.classList.add('cell-pulse');
      setTimeout(() => el.classList.remove('cell-pulse'), 700);
    }
    function flashCell(si) {
      const node = cellNodes[si];
      if (!node) return;
      node.cell.classList.remove('cell-flash'); void node.cell.offsetWidth; node.cell.classList.add('cell-flash');
      setTimeout(() => node.cell.classList.remove('cell-flash'), 700);
    }
    function getCell(u, tier) {
      const si = B.stateIndex(B.makeState(u, tier));
      return cellNodes[si] ? cellNodes[si].cell : null;
    }
    function reset() {
      prevBest = null;
      for (const t of TIERS) for (const u of UNITS) {
        const si = B.stateIndex(B.makeState(u, t));
        const node = cellNodes[si];
        clearTints(node.cell);
        node.cell.classList.add('unsolved');
        if (node.rows) for (let a = 0; a < A; a++) { node.rows[a].val.textContent = '·'; node.rows[a].mark.textContent = ''; node.rows[a].row.classList.remove('argmax'); }
        if (node.chip) node.chip.textContent = '';
        if (node.vval) node.vval.textContent = '·';
      }
    }

    let cellClickCb = null;
    for (const t of TIERS) for (const u of UNITS) {
      const si = B.stateIndex(B.makeState(u, t));
      (function (cu, ct, cel) {
        cel.addEventListener('click', () => { if (cellClickCb) cellClickCb(cu, ct, cel); });
      })(u, t, cellNodes[si].cell);
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (const t of TIERS) for (const u of UNITS) {
        const si = B.stateIndex(B.makeState(u, t));
        cellNodes[si].cell.classList.toggle('clickable', !!cb);
      }
    }

    if (variant !== 'icon') reset();
    return {
      paintPolicy, paintQ, paintValues, setSolved, setToken, pulseToken,
      flashCell, getCell, setOnCellClick, reset, host,
    };
  }

  /* count argmax levers across the 15 cells (for the policy scene stats). */
  function leverCounts(Q) {
    const c = {};
    for (const id of LEVER_IDS) c[id] = 0;
    for (let si = 0; si < B.N; si++) {
      const base = si * A;
      let m = -Infinity, k = -1;
      for (let a = 0; a < A; a++) { const v = Q[base + a]; if (v == null || !isFinite(v)) continue; if (v > m) { m = v; k = a; } }
      if (k >= 0) c[LEVER_IDS[k]]++;
    }
    return c;
  }

  window.Board = { mount, leverCounts, tierLabel, leverLabel };
})();

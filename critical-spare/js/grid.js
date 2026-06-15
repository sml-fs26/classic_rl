/* grid.js, the 3x3 MAINTENANCE GRID, the board AND the whole Q-table.
 *
 *   Health labels the rows (HEALTHY top, AGING, FAILING bottom); spares label
 *   the columns (0 / 1 / 2 left to right). Every one of the nine (health,spares)
 *   states is one cell. Two variants:
 *     'icon'  -> compact: each cell shows just a mini machine-icon + the best
 *                lever tag; a token highlights the current state. The recurring
 *                "where am I" board.
 *     'qtable'-> full: each cell shows a stack of up to three lever chips
 *                (RUN / ORDER / REPLACE) with their Q-values, the greedy lever
 *                starred + arrowed + given a glowing border, and the whole cell
 *                tinted by the winning lever's colour. The entire Q-table on one
 *                screen, and the twist heat-map.
 *
 *   Cells with an EMPTY bin (spares = 0) have only two legal levers (RUN,
 *   ORDER): REPLACE renders as a clamped/greyed chip. The board handles 2- vs
 *   3-chip cells gracefully.
 *
 *   mount(host, opts) -> handle {
 *     update(Q, opts)             // paint Q values + argmax star + lever tint
 *     reset()                     // clear all Q values (cells go 'unsolved')
 *     paintPolicy(byState, opts)  // paint a POLICY directly (no values)
 *     setToken(h, s | null)       // place / move the bright marker (icon variant)
 *     pulseToken()                // emphasis on the token cell
 *     setCellSolved(h, s, bool)   // dim un-filled cells (DP fill)
 *     highlightCell(h, s, bool)   // outline a cell (just-locked / inspected)
 *     getCellNode(h, s)           // the cell element
 *     setOnCellClick(cb)          // make interior cells clickable -> cb(h, s, el)
 *     host
 *   }
 *
 *   Q is indexed Q[stateIdx * A + leverIdx], stateIdx = health*3 + spares,
 *   leverIdx in window.Levers.LEVER_IDS = [run, order, replace] (the same order
 *   window.Bellman.qFromV / window.DATA.Qstar use). A clamped lever holds
 *   null / -Infinity and renders disabled. Theme-agnostic; styles in
 *   css/grid.css. */
(function () {
  const M = window.Machine;
  const LEVER_IDS = window.Levers.LEVER_IDS;      // [run, order, replace]
  const A = LEVER_IDS.length;                       // 3
  const NH = M.NH, NS = M.NS;                       // 3, 3
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const EMPTY = '·';                           // middle dot

  const HEALTH_KEYS = ['healthy', 'aging', 'failing'];
  function leverShort(id) { return T('lever.' + id + '.short'); }       // RUN / ORD / REP
  function leverName(id) { return T('lever.' + id); }                   // RUN / ORDER / REPLACE

  function mount(host, opts) {
    const o = opts || {};
    const variant = o.variant || 'icon';
    const showValues = !!o.showValues;
    host.classList.add('cs-grid', 'cs-grid-' + variant);
    host.innerHTML = '';

    const board = document.createElement('div');
    board.className = 'csg-board';
    host.appendChild(board);

    /* corner + column headers (spares 0/1/2) */
    const corner = document.createElement('div');
    corner.className = 'csg-corner';
    corner.innerHTML = '<span class="csg-corner-h">' + T('grid.health') + '</span>' +
                       '<span class="csg-corner-s">' + T('grid.spares') + '</span>';
    board.appendChild(corner);
    for (let s = 0; s < NS; s++) {
      const ch = document.createElement('div');
      ch.className = 'csg-colhead';
      ch.innerHTML = '<span class="csg-colhead-n">' + s + '</span>' +
                     '<span class="csg-colhead-sp">' + T('grid.sp') + '</span>';
      board.appendChild(ch);
    }

    const cellNodes = {};       // key h*3+s -> { cell, icon, rows:[{row,mark,val,legal}], best }
    const STAR = '★';
    const ARROW = '▶';

    for (let h = 0; h < NH; h++) {
      /* row header */
      const rh = document.createElement('div');
      rh.className = 'csg-rowhead csg-row-' + HEALTH_KEYS[h];
      rh.innerHTML = '<span class="csg-rowhead-dot"></span>' +
                     '<span class="csg-rowhead-n">' + T('health.' + HEALTH_KEYS[h]) + '</span>';
      board.appendChild(rh);

      for (let s = 0; s < NS; s++) {
        const cell = document.createElement('div');
        cell.className = 'csg-cell csg-cell-' + HEALTH_KEYS[h];
        cell.dataset.h = String(h);
        cell.dataset.s = String(s);

        /* mini machine icon (always present) */
        const iconHost = document.createElement('div');
        iconHost.className = 'csg-cell-icon';
        cell.appendChild(iconHost);
        const icon = window.MachineIcon.mount(iconHost, { size: variant === 'qtable' ? 'xs' : 'sm', showLabel: false });
        icon.set(h, s);

        const rowNodes = [];
        if (variant === 'qtable') {
          const rows = document.createElement('div');
          rows.className = 'csg-rows';
          const legal = M.availableLeverIds(M.mk(h, s));
          for (let a = 0; a < A; a++) {
            const id = LEVER_IDS[a];
            const isLegal = legal.includes(id);
            const r = document.createElement('div');
            r.className = 'csg-row lever-' + id + (isLegal ? '' : ' clamped');
            r.dataset.lever = id;
            r.innerHTML =
              '<span class="csg-mark"></span>' +
              '<span class="csg-swatch lever-fill-' + id + '"></span>' +
              '<span class="csg-row-label">' + leverShort(id) + '</span>' +
              '<span class="csg-val">' + EMPTY + '</span>';
            rows.appendChild(r);
            rowNodes[a] = { row: r, mark: r.querySelector('.csg-mark'), val: r.querySelector('.csg-val'), legal: isLegal };
          }
          cell.appendChild(rows);
        } else {
          /* icon variant: a single "best lever" tag slot */
          const tag = document.createElement('div');
          tag.className = 'csg-best-tag';
          tag.innerHTML = '';
          cell.appendChild(tag);
        }

        board.appendChild(cell);
        cellNodes[h * NS + s] = { cell, icon, rows: rowNodes, tag: cell.querySelector('.csg-best-tag') };
      }
    }

    /* legend (qtable variant) */
    if (variant === 'qtable' && o.legend !== false) {
      const legend = document.createElement('div');
      legend.className = 'csg-legend';
      legend.innerHTML =
        LEVER_IDS.map(id =>
          '<span class="csg-legend-item"><span class="csg-legend-swatch lever-fill-' + id + '"></span>' +
          leverName(id) + '</span>').join('') +
        '<span class="csg-legend-item">' + STAR + ' = ' + T('grid.bestLever') + '</span>';
      host.appendChild(legend);
    }

    const ALL_TINTS = LEVER_IDS.map(id => 'tint-' + id);
    let prevQ = null;
    let curToken = null;

    function bestIdxOf(Q, base) {
      let best = -Infinity, k = -1, allZero = true;
      for (let a = 0; a < A; a++) {
        const v = Q[base + a];
        if (v == null || !isFinite(v)) continue;
        if (Math.abs(v) > 1e-9) allZero = false;
        if (v > best) { best = v; k = a; }
      }
      return { k, best, allZero };
    }

    function update(Q, opt) {
      if (variant !== 'qtable') return;
      const oo = opt || {};
      for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) {
        const node = cellNodes[h * NS + s];
        const base = (h * NS + s) * A;
        const { k, allZero } = bestIdxOf(Q, base);
        for (const t of ALL_TINTS) node.cell.classList.remove(t);
        if (allZero || k < 0) {
          node.cell.classList.add('unsolved');
          for (let a = 0; a < A; a++) {
            if (!node.rows[a].legal) continue;
            node.rows[a].val.textContent = EMPTY;
            node.rows[a].row.classList.remove('argmax');
            node.rows[a].mark.textContent = '';
          }
        } else {
          node.cell.classList.remove('unsolved');
          node.cell.classList.add('tint-' + LEVER_IDS[k]);
          for (let a = 0; a < A; a++) {
            if (!node.rows[a].legal) continue;
            const v = Q[base + a];
            node.rows[a].val.textContent = (v == null || !isFinite(v)) ? EMPTY : v.toFixed(1);
            const isArg = a === k;
            node.rows[a].row.classList.toggle('argmax', isArg);
            node.rows[a].mark.textContent = isArg ? ARROW : '';
          }
          if (prevQ && !oo.suppressFlash) {
            const pk = bestIdxOf(prevQ, base).k;
            if (pk >= 0 && pk !== k) {
              node.cell.classList.remove('cell-flip'); void node.cell.offsetWidth; node.cell.classList.add('cell-flip');
              setTimeout(() => node.cell.classList.remove('cell-flip'), 900);
            }
          }
        }
      }
      prevQ = Array.from(Q, v => (v == null ? null : v));
    }

    function reset() {
      prevQ = null;
      if (variant !== 'qtable') return;
      for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) {
        const node = cellNodes[h * NS + s];
        for (const t of ALL_TINTS) node.cell.classList.remove(t);
        node.cell.classList.add('unsolved');
        for (let a = 0; a < A; a++) {
          node.rows[a].mark.textContent = '';
          node.rows[a].row.classList.remove('argmax');
          node.rows[a].val.textContent = EMPTY;
        }
      }
    }

    /* Paint a POLICY directly (no Q values): byState maps stateIdx (h*3+s) ->
       lever id. Tints the cell + stars/arrows that lever. */
    function paintPolicy(byState, opt) {
      const oo = opt || {};
      for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) {
        const node = cellNodes[h * NS + s];
        const id = byState[h * NS + s];
        for (const t of ALL_TINTS) node.cell.classList.remove(t);
        node.cell.classList.remove('unsolved');
        if (!id) { node.cell.classList.add('unsolved'); continue; }
        node.cell.classList.add('tint-' + id);
        if (variant === 'qtable') {
          for (let a = 0; a < A; a++) {
            if (!node.rows[a].legal) continue;
            const isPick = LEVER_IDS[a] === id;
            node.rows[a].row.classList.toggle('argmax', isPick);
            node.rows[a].mark.textContent = isPick ? ARROW : '';
            node.rows[a].val.textContent = isPick ? T('grid.play') : EMPTY;
          }
        } else if (node.tag) {
          node.tag.innerHTML = '<span class="csg-best lever-tag-' + id + '">' + ARROW + ' ' + leverName(id) + '</span>';
        }
        if (oo.animate) {
          const d = (h * NS + s) * 45;
          (function (el, delay) {
            setTimeout(() => {
              el.classList.remove('cell-flip'); void el.offsetWidth; el.classList.add('cell-flip');
              setTimeout(() => el.classList.remove('cell-flip'), 800);
            }, delay);
          })(node.cell, d);
        }
      }
    }

    function clearBestTags() {
      if (variant !== 'icon') return;
      for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) {
        const node = cellNodes[h * NS + s];
        for (const t of ALL_TINTS) node.cell.classList.remove(t);
        if (node.tag) node.tag.innerHTML = '';
      }
    }

    function setToken(h, s) {
      if (curToken != null) {
        const old = cellNodes[curToken];
        if (old) old.cell.classList.remove('has-token');
      }
      if (h == null) { curToken = null; return; }
      curToken = h * NS + s;
      const node = cellNodes[curToken];
      if (node) node.cell.classList.add('has-token');
    }
    function pulseToken() {
      if (curToken == null) return;
      const el = cellNodes[curToken].cell;
      el.classList.remove('token-pulse'); void el.offsetWidth; el.classList.add('token-pulse');
      const node = cellNodes[curToken];
      if (node && node.icon) node.icon.pulse();
      setTimeout(() => el.classList.remove('token-pulse'), 700);
    }
    function setCellSolved(h, s, solved) {
      const node = cellNodes[h * NS + s];
      if (node) node.cell.classList.toggle('pending', !solved);
    }
    function highlightCell(h, s, on) {
      const node = cellNodes[h * NS + s];
      if (node) node.cell.classList.toggle('just-locked', !!on);
    }
    function getCellNode(h, s) { const n = cellNodes[h * NS + s]; return n ? n.cell : null; }
    function getIcon(h, s) { const n = cellNodes[h * NS + s]; return n ? n.icon : null; }

    let cellClickCb = null;
    for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) {
      (function (hh, ss) {
        cellNodes[hh * NS + ss].cell.addEventListener('click', () => { if (cellClickCb) cellClickCb(hh, ss, cellNodes[hh * NS + ss].cell); });
      })(h, s);
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let h = 0; h < NH; h++) for (let s = 0; s < NS; s++) cellNodes[h * NS + s].cell.classList.toggle('clickable', !!cb);
    }

    if (variant === 'qtable') reset();
    return {
      update, reset, paintPolicy, clearBestTags,
      setToken, pulseToken, setCellSolved, highlightCell,
      getCellNode, getIcon, setOnCellClick, host,
    };
  }

  /* Standalone argmax-count helper (skips clamped/null cells). */
  function leverCounts(Q) {
    const c = {};
    for (const id of LEVER_IDS) c[id] = 0;
    for (let i = 0; i < NH * NS; i++) {
      const base = i * A;
      let m = -Infinity, k = -1;
      for (let a = 0; a < A; a++) {
        const v = Q[base + a];
        if (v == null || !isFinite(v)) continue;
        if (v > m) { m = v; k = a; }
      }
      if (k >= 0) c[LEVER_IDS[k]]++;
    }
    return c;
  }

  window.Grid = { mount, leverCounts, leverName, leverShort };
})();

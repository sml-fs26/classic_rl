/* The Q-table: a 5-row (rungs, READY at top) x 3-column (levers) grid.
 *
 *   Row = a pipeline rung (READY at the top, COLD at the bottom), labelled
 *   with the rung name and a warmth swatch so the same state-icon vocabulary
 *   recurs here. Column = a lever (NURTURE / DEMO / HARD CLOSE), tinted by
 *   the lever's CSS token. Each cell shows one Q-value; the argmax cell in
 *   a row is starred and highlighted, so the optimal staircase reads as a
 *   diagonal of stars climbing the board (blue low, amber middle, red top).
 *
 *   State indexing matches the engine: row r is rung r (stateIndex = rung),
 *   and a Q array is indexed [stateIndex * 3 + leverIdx] (A = 3), exactly
 *   what bellman.qFromV / sarsa produce.
 *
 *   API mirrors the reused Pokemon qtable so DP / SARSA scenes can drive it:
 *     QTable.mount(host) -> { update, reset, host, cells,
 *                             setOnCellClick, getCellNode }
 *       ctrl.update(Q, opts)   Q = array length 15; opts.suppressFlash
 *       ctrl.reset()           blank every cell (rung never visited)
 *       ctrl.cells             flat array, cells[rung*3 + leverIdx] = the
 *                              {state,lever} cell DOM node (same indexing
 *                              as Q) so scenes can highlight one (s,a) cell
 *       ctrl.setOnCellClick(cb(rung, rowLabelNode)) | null
 *       ctrl.getCellNode(rung) -> the rung's row-label node
 */
(function () {
  const LEVER_IDS = (window.Levers && window.Levers.MOVE_IDS) || ['nurture', 'demo', 'hardclose'];
  const A = LEVER_IDS.length;                                  // 3
  const NUM_RUNGS = (window.Pipeline && window.Pipeline.NUM_RUNGS) || 5;
  const RUNG_DISPLAY = (window.Pipeline && window.Pipeline.RUNG_DISPLAY) ||
    ['COLD', 'CURIOUS', 'ENGAGED', 'EVALUATING', 'READY'];

  function T(key, fallback) {
    if (window.I18N) { const s = window.I18N.t(key); if (s && s !== key) return s; }
    return fallback;
  }
  function rungLabel(i) {
    const keys = ['rung.cold', 'rung.curious', 'rung.engaged', 'rung.evaluating', 'rung.ready'];
    return T(keys[i], RUNG_DISPLAY[i]);
  }
  function leverHead(id) {
    return T('lever.short.' + id, (window.Levers ? window.Levers.shortLabel(id) : id));
  }
  function toneClass(id) {
    return (window.Levers && window.Levers.toneClass) ? window.Levers.toneClass(id) : ('lever-' + id);
  }

  function mount(host) {
    host.classList.add('qtable-host');
    host.innerHTML = '';

    /* Column header row: corner + 3 lever names. */
    const headerRow = document.createElement('div');
    headerRow.className = 'q-col-heads';
    headerRow.style.setProperty('--na', String(A));
    headerRow.innerHTML =
      '<div class="q-corner-head">' + T('qtable.corner', 'RUNG \\ LEVER') + '</div>' +
      LEVER_IDS.map(id =>
        '<div class="q-col-head ' + toneClass(id) + '">' + leverHead(id) + '</div>').join('');
    host.appendChild(headerRow);

    const grid = document.createElement('div');
    grid.className = 'q-grid';
    grid.style.setProperty('--na', String(A));
    host.appendChild(grid);

    /* Rows top-down: READY (rung 4) first, COLD (rung 0) last. */
    const rowNodes = [];   /* indexed by rung -> { lab, cells:[a -> {cell,val,mark}] } */
    for (let display = NUM_RUNGS - 1; display >= 0; display--) {
      const rung = display;

      const lab = document.createElement('div');
      lab.className = 'q-row-head lc-warm-' + rung;
      lab.innerHTML =
        '<span class="q-row-rung">' + rungLabel(rung) + '</span>' +
        '<span class="q-row-warm"></span>';
      grid.appendChild(lab);

      const cells = [];
      for (let a = 0; a < A; a++) {
        const id = LEVER_IDS[a];
        const cell = document.createElement('div');
        cell.className = 'q-cell ' + toneClass(id);
        cell.dataset.rung = String(rung);
        cell.dataset.lever = id;
        cell.innerHTML =
          '<span class="q-mark"></span>' +
          '<span class="q-val">—</span>';
        grid.appendChild(cell);
        cells[a] = { cell, val: cell.querySelector('.q-val'), mark: cell.querySelector('.q-mark') };
      }
      rowNodes[rung] = { lab, cells };
    }

    let prevQ = null;

    function update(Q, opts) {
      const o = opts || {};
      for (let rung = 0; rung < NUM_RUNGS; rung++) {
        const node = rowNodes[rung];
        const base = rung * A;

        let allZero = true, m = -Infinity, k = 0;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > m) { m = v; k = a; }
        }

        if (allZero) {
          for (let a = 0; a < A; a++) {
            const c = node.cells[a];
            c.val.textContent = '—';
            c.cell.classList.remove('q-argmax', 'q-negative');
            c.mark.textContent = '';
          }
        } else {
          for (let a = 0; a < A; a++) {
            const c = node.cells[a];
            const v = Q[base + a];
            c.val.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
            const isArg = a === k;
            c.cell.classList.toggle('q-argmax', isArg);
            c.cell.classList.toggle('q-negative', v < 0);
            c.mark.textContent = isArg ? '★' : '';
          }
        }

        if (prevQ && !o.suppressFlash && !allZero) {
          let pm = -Infinity, pk = -1, prevAllZero = true;
          for (let a = 0; a < A; a++) {
            if (Math.abs(prevQ[base + a]) > 1e-9) prevAllZero = false;
            if (prevQ[base + a] > pm) { pm = prevQ[base + a]; pk = a; }
          }
          if (!prevAllZero && pk !== k) {
            node.cells[k].cell.classList.remove('q-flip');
            void node.cells[k].cell.offsetWidth;
            node.cells[k].cell.classList.add('q-flip');
            setTimeout(() => node.cells[k].cell.classList.remove('q-flip'), 1000);
          }
        }
      }
      prevQ = Float64Array.from(Q);
    }

    function reset() {
      prevQ = null;
      for (let rung = 0; rung < NUM_RUNGS; rung++) {
        for (let a = 0; a < A; a++) {
          const c = rowNodes[rung].cells[a];
          c.val.textContent = '—';
          c.cell.classList.remove('q-argmax', 'q-negative', 'q-flip');
          c.mark.textContent = '';
        }
      }
    }

    /* Click wiring: a single callback gets the rung + the row's label
       node (the natural "inspect this rung" affordance). */
    let cellClickCb = null;
    for (let rung = 0; rung < NUM_RUNGS; rung++) {
      rowNodes[rung].lab.addEventListener('click', () => {
        if (cellClickCb) cellClickCb(rung, rowNodes[rung].lab);
      });
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let rung = 0; rung < NUM_RUNGS; rung++) {
        rowNodes[rung].lab.classList.toggle('clickable', !!cb);
      }
    }
    function getCellNode(rung) { return rowNodes[rung] ? rowNodes[rung].lab : null; }

    /* Flat array of cell DOM nodes, indexed exactly like Q (rung*A + a),
       so a scene can address one (state, lever) cell for highlighting. */
    const cells = [];
    for (let rung = 0; rung < NUM_RUNGS; rung++) {
      for (let a = 0; a < A; a++) cells[rung * A + a] = rowNodes[rung].cells[a].cell;
    }

    reset();
    return { update, reset, host, cells, setOnCellClick, getCellNode };
  }

  /* argmax lever per rung from a Q array (for any consumer). */
  function policyFromQ(Q) {
    const out = new Array(NUM_RUNGS);
    for (let rung = 0; rung < NUM_RUNGS; rung++) {
      const base = rung * A;
      let m = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(Q[base + a]) > 1e-9) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      }
      out[rung] = allZero ? null : LEVER_IDS[k];
    }
    return out;
  }

  window.QTable = { mount, policyFromQ };
})();

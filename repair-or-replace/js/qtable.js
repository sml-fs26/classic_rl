/* The Q-table: a 4-row (wear states, HEALTHY at top) x 3-column (actions) grid.
 *
 *   Row = a wear state (HEALTHY at the top, FAILING at the bottom), labelled
 *   with the state name and a wear swatch so the van-card colour vocabulary
 *   recurs here. Column = an action (RUN / SERVICE / REPLACE), tinted by the
 *   action's CSS token. Each cell shows one Q-value; the argmax cell in a
 *   row is starred and highlighted, so the three bands read straight off the
 *   board: RUN at the top, SERVICE in the middle, a wide REPLACE block below.
 *
 *   State indexing matches the engine: row s is wear level s (stateIndex =
 *   wear), and a Q array is indexed [stateIndex * 3 + actionIdx] (A = 3),
 *   exactly what bellman.qFromV / sarsa produce.
 *
 *   API mirrors the sibling gallery qtables so DP / SARSA scenes can drive it:
 *     QTable.mount(host) -> { update, reset, host, cells,
 *                             setOnCellClick, getCellNode }
 *       ctrl.update(Q, opts)   Q = array length 12; opts.suppressFlash
 *       ctrl.reset()           blank every cell (state never visited)
 *       ctrl.cells             flat array, cells[s*3 + aIdx] = the cell DOM
 *                              node (same indexing as Q)
 *       ctrl.setOnCellClick(cb(s, rowLabelNode)) | null
 *       ctrl.getCellNode(s) -> the state's row-label node
 */
(function () {
  const ACTION_IDS = (window.Actions && window.Actions.MOVE_IDS) || ['run', 'service', 'replace'];
  const A = ACTION_IDS.length;                                  // 3
  const NUM_STATES = (window.Van && window.Van.NUM_STATES) || 4;
  const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
    ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];

  /* The unvisited-cell glyph (em dash), same as the siblings. */
  const BLANK = '\u2014';


  function actionHead(id) {
    return window.Actions ? window.Actions.shortLabel(id) : id;
  }
  function toneClass(id) {
    return (window.Actions && window.Actions.toneClass) ? window.Actions.toneClass(id) : ('lever-' + id);
  }

  function mount(host) {
    host.classList.add('qtable-host');
    host.innerHTML = '';

    /* Column header row: corner + 3 action names. */
    const headerRow = document.createElement('div');
    headerRow.className = 'q-col-heads';
    headerRow.style.setProperty('--na', String(A));
    headerRow.innerHTML =
      '<div class="q-corner-head">STATE \\ ACTION</div>' +
      ACTION_IDS.map(id =>
        '<div class="q-col-head ' + toneClass(id) + '">' + actionHead(id) + '</div>').join('');
    host.appendChild(headerRow);

    const grid = document.createElement('div');
    grid.className = 'q-grid';
    grid.style.setProperty('--na', String(A));
    host.appendChild(grid);

    /* Rows top-down in engine order: HEALTHY (0) first, FAILING (3) last. */
    const rowNodes = [];   /* indexed by state -> { lab, cells:[a -> {cell,val,mark}] } */
    for (let s = 0; s < NUM_STATES; s++) {
      const lab = document.createElement('div');
      lab.className = 'q-row-head vc-wear-' + s;
      lab.innerHTML =
        '<span class="q-row-rung">' + STATE_DISPLAY[s] + '</span>' +
        '<span class="q-row-warm"></span>';
      grid.appendChild(lab);

      const cells = [];
      for (let a = 0; a < A; a++) {
        const id = ACTION_IDS[a];
        const cell = document.createElement('div');
        cell.className = 'q-cell ' + toneClass(id);
        cell.dataset.state = String(s);
        cell.dataset.action = id;
        cell.innerHTML =
          '<span class="q-mark"></span>' +
          '<span class="q-val">' + BLANK + '</span>';
        grid.appendChild(cell);
        cells[a] = { cell, val: cell.querySelector('.q-val'), mark: cell.querySelector('.q-mark') };
      }
      rowNodes[s] = { lab, cells };
    }

    let prevQ = null;

    function update(Q, opts) {
      const o = opts || {};
      for (let s = 0; s < NUM_STATES; s++) {
        const node = rowNodes[s];
        const base = s * A;

        let allZero = true, m = -Infinity, k = 0;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > m) { m = v; k = a; }
        }

        if (allZero) {
          for (let a = 0; a < A; a++) {
            const c = node.cells[a];
            c.val.textContent = BLANK;
            c.cell.classList.remove('q-argmax', 'q-negative');
            c.mark.textContent = '';
          }
        } else {
          for (let a = 0; a < A; a++) {
            const c = node.cells[a];
            const v = Q[base + a];
            c.val.textContent = (v >= 0 ? '+' : '') + v.toFixed(1);
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
      for (let s = 0; s < NUM_STATES; s++) {
        for (let a = 0; a < A; a++) {
          const c = rowNodes[s].cells[a];
          c.val.textContent = BLANK;
          c.cell.classList.remove('q-argmax', 'q-negative', 'q-flip');
          c.mark.textContent = '';
        }
      }
    }

    /* Click wiring: a single callback gets the state + the row's label
       node (the natural "inspect this state" affordance). */
    let cellClickCb = null;
    for (let s = 0; s < NUM_STATES; s++) {
      rowNodes[s].lab.addEventListener('click', () => {
        if (cellClickCb) cellClickCb(s, rowNodes[s].lab);
      });
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let s = 0; s < NUM_STATES; s++) {
        rowNodes[s].lab.classList.toggle('clickable', !!cb);
      }
    }
    function getCellNode(s) { return rowNodes[s] ? rowNodes[s].lab : null; }

    /* Flat array of cell DOM nodes, indexed exactly like Q (s*A + a),
       so a scene can address one (state, action) cell for highlighting. */
    const cells = [];
    for (let s = 0; s < NUM_STATES; s++) {
      for (let a = 0; a < A; a++) cells[s * A + a] = rowNodes[s].cells[a].cell;
    }

    reset();
    return { update, reset, host, cells, setOnCellClick, getCellNode };
  }

  /* argmax action per state from a Q array (for any consumer). */
  function policyFromQ(Q) {
    const out = new Array(NUM_STATES);
    for (let s = 0; s < NUM_STATES; s++) {
      const base = s * A;
      let m = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(Q[base + a]) > 1e-9) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      }
      out[s] = allZero ? null : ACTION_IDS[k];
    }
    return out;
  }

  window.QTable = { mount, policyFromQ };
})();

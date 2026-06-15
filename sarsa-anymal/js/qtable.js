/* Q-table renderers.
 *
 *   Three views are needed across the viz:
 *     - "numerical view" → 21-row × 4-col monospace table (the centerpiece, 
 *                          the user's "Q table fills nicely" payoff)
 *     - "value view"     → max_a Q(s,a) heatmap on grid + optional argmax arrow
 *     - "per-action"     → four small heatmaps, one per action
 *
 *   The renderers mount into a host element and expose `update(Q, opts)` so a
 *   scrubber can drive them without tearing down the DOM.
 *
 *   Color ramp: a single sequential teal hue, 8 bins, normalised over the
 *   per-snapshot Q range. Negative values map to the cool/light end, positive
 *   to the warm/saturated end. Background-cell baseline keeps the heatmap
 *   readable in both themes. The 8 bins are CSS classes `.q-bin-0`…`.q-bin-7`
 *   defined in style.css so theme switch is automatic.
 */
(function () {
  const ACTIONS = (window.MDP && window.MDP.ACTIONS) || ['up', 'down', 'left', 'right'];
  const ARROW = { up: '↑', down: '↓', left: '←', right: '→' };
  const NUM_BINS = 8;

  /* Map a Q value to a bin 0..7. Snapshot stats determine the range; if all
     values are 0 (initial), every bin is 3 (neutral mid). */
  function bin(v, lo, hi) {
    if (!Number.isFinite(v)) return 3;
    if (hi <= lo) return 3;
    const t = (v - lo) / (hi - lo);
    const b = Math.floor(t * NUM_BINS);
    return Math.max(0, Math.min(NUM_BINS - 1, b));
  }

  /* Format a Q value for cell text. Two decimal places per plan §6.4, the
     point is to see the algebra grind out a number. */
  function fmt(v) {
    if (v === 0) return '0.00';
    return v.toFixed(2);
  }

  /*, Numerical Q-table view (centerpiece), */

  /* Mounts a `<table>` with one row per state and one column per action.
     The goal cell `(M-1, N-1)` shows "(terminal)" instead of four numerical
     Q-values, since the convention is Q(terminal, *) = 0 and the SARSA
     update treats it specially.

     Cell flash: call `flashCell(r, c, action)` to flash one (s, a) cell
     for ~380 ms. The flash is debounced via `void el.offsetWidth` so the
     animation can be retriggered immediately on the next step. */
  function mountNumerical(host, M, N, opts) {
    host.innerHTML = '';
    host.classList.add('qtable-numeric');
    const goal = (opts && opts.goal) || { r: M - 1, c: N - 1 };

    const table = document.createElement('table');
    table.className = 'qtable-numeric-table';

    /* Header */
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    const hdrs = ['state', ARROW.up, ARROW.down, ARROW.left, ARROW.right];
    for (let i = 0; i < hdrs.length; i++) {
      const th = document.createElement('th');
      th.textContent = hdrs[i];
      if (i === 0) th.className = 'qtn-state-hdr';
      else th.className = 'qtn-action-hdr';
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    /* Body, 21 rows */
    const tbody = document.createElement('tbody');
    const cellByKey = new Map();
    const rowByState = new Map();
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        const tr = document.createElement('tr');
        tr.className = 'qtn-row';
        tr.dataset.state = r + ',' + c;

        const stateTd = document.createElement('td');
        stateTd.className = 'qtn-state';
        stateTd.textContent = '(' + r + ',' + c + ')';
        tr.appendChild(stateTd);

        const isGoal = (r === goal.r && c === goal.c);
        if (isGoal) {
          const td = document.createElement('td');
          td.className = 'qtn-terminal';
          td.colSpan = 4;
          td.textContent = '(terminal)';
          tr.appendChild(td);
        } else {
          for (let a = 0; a < ACTIONS.length; a++) {
            const td = document.createElement('td');
            td.className = 'qtn-cell';
            td.dataset.r = String(r);
            td.dataset.c = String(c);
            td.dataset.a = ACTIONS[a];
            td.textContent = '0.00';
            tr.appendChild(td);
            cellByKey.set(r + ',' + c + ',' + ACTIONS[a], td);
          }
        }
        rowByState.set(r + ',' + c, tr);
        tbody.appendChild(tr);
      }
    }
    table.appendChild(tbody);
    host.appendChild(table);

    function update(Q, opts2) {
      const o = opts2 || {};
      const lo = (o.lo != null) ? o.lo : SARSA.stats(Q).lo;
      const hi = (o.hi != null) ? o.hi : SARSA.stats(Q).hi;
      const highlight = o.highlight; /* {r, c} optional, highlights the row */
      /* Clear old highlight first */
      for (const [, tr] of rowByState) tr.classList.remove('qtn-row-highlight');
      if (highlight) {
        const tr = rowByState.get(highlight.r + ',' + highlight.c);
        if (tr) tr.classList.add('qtn-row-highlight');
      }

      for (let r = 0; r < M; r++) {
        for (let c = 0; c < N; c++) {
          if (r === goal.r && c === goal.c) continue;
          for (let a = 0; a < ACTIONS.length; a++) {
            const td = cellByKey.get(r + ',' + c + ',' + ACTIONS[a]);
            if (!td) continue;
            const v = SARSA.get(Q, M, N, r, c, a);
            td.textContent = fmt(v);
            const b = bin(v, lo, hi);
            td.dataset.bin = String(b);
            /* Apply bin class for theme-aware tinting */
            td.className = 'qtn-cell q-bin-' + b;
          }
        }
      }
    }

    function flashCell(r, c, action) {
      const td = cellByKey.get(r + ',' + c + ',' + action);
      if (!td) return;
      td.classList.remove('qtn-flash');
      void td.offsetWidth;
      td.classList.add('qtn-flash');
    }

    function highlightRow(r, c) {
      for (const [, tr] of rowByState) tr.classList.remove('qtn-row-highlight');
      const tr = rowByState.get(r + ',' + c);
      if (tr) tr.classList.add('qtn-row-highlight');
    }

    function clearHighlight() {
      for (const [, tr] of rowByState) tr.classList.remove('qtn-row-highlight');
    }

    return { update, flashCell, highlightRow, clearHighlight, host, table };
  }

  /*, Value view (heatmap on grid), */

  function mountValue(host, M, N, opts) {
    host.innerHTML = '';
    host.classList.add('qtable-host');
    host.style.setProperty('--rows', String(M));
    host.style.setProperty('--cols', String(N));

    const cells = [];
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'qcell qcell-value';
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        const val = document.createElement('div');
        val.className = 'qcell-val';
        cell.appendChild(val);
        if (opts && opts.showArrow !== false) {
          const arrow = document.createElement('div');
          arrow.className = 'qcell-arrow';
          cell.appendChild(arrow);
        }
        host.appendChild(cell);
        cells.push({ r, c, cell, val, arrow: cell.querySelector('.qcell-arrow') });
      }
    }

    function update(Q, opts2) {
      const o = opts2 || {};
      const lo = (o.lo != null) ? o.lo : SARSA.stats(Q).lo;
      const hi = (o.hi != null) ? o.hi : SARSA.stats(Q).hi;
      const showArrow = o.showArrow !== false;
      const showVal = o.showVal !== false;
      const highlight = o.highlight; /* {r, c} optional */
      for (const ent of cells) {
        const v = SARSA.maxQ(Q, N, ent.r, ent.c);
        const b = bin(v, lo, hi);
        ent.cell.className = `qcell qcell-value q-bin-${b}`;
        if (highlight && highlight.r === ent.r && highlight.c === ent.c) {
          ent.cell.classList.add('qcell-highlight');
        }
        ent.val.textContent = showVal ? fmt(v) : '';
        if (ent.arrow) {
          if (showArrow) {
            const row = SARSA.row(Q, N, ent.r, ent.c);
            const allTied = row.every(x => x === row[0]);
            if (allTied) {
              ent.arrow.textContent = '';
              ent.arrow.style.visibility = 'hidden';
            } else {
              const aIdx = SARSA.argmaxIndex(Q, N, ent.r, ent.c);
              ent.arrow.textContent = ARROW[ACTIONS[aIdx]];
              ent.arrow.style.visibility = '';
            }
          } else {
            ent.arrow.textContent = '';
            ent.arrow.style.visibility = 'hidden';
          }
        }
      }
    }

    function flashCell(r, c) {
      const el = host.querySelector(`.qcell[data-r="${r}"][data-c="${c}"]`);
      if (!el) return;
      el.classList.remove('qcell-flash');
      void el.offsetWidth;
      el.classList.add('qcell-flash');
    }

    return { update, flashCell, host };
  }

  /*, Per-action view (four small heatmaps), */

  function mountPerAction(host, M, N) {
    host.innerHTML = '';
    host.classList.add('qtable-peraction');
    const panels = {};
    for (let a = 0; a < ACTIONS.length; a++) {
      const action = ACTIONS[a];
      const panel = document.createElement('div');
      panel.className = `qpanel qpanel-${action}`;
      const hdr = document.createElement('div');
      hdr.className = 'qpanel-hdr';
      hdr.innerHTML = `<span class="qpanel-arrow">${ARROW[action]}</span><span class="qpanel-label">${action}</span>`;
      panel.appendChild(hdr);
      const grid = document.createElement('div');
      grid.className = 'qpanel-grid';
      grid.style.setProperty('--rows', String(M));
      grid.style.setProperty('--cols', String(N));
      const cells = [];
      for (let r = 0; r < M; r++) {
        for (let c = 0; c < N; c++) {
          const cell = document.createElement('div');
          cell.className = 'qcell qcell-mini';
          cell.dataset.r = String(r);
          cell.dataset.c = String(c);
          cell.dataset.a = String(a);
          const val = document.createElement('div');
          val.className = 'qcell-val';
          cell.appendChild(val);
          grid.appendChild(cell);
          cells.push({ r, c, cell, val });
        }
      }
      panel.appendChild(grid);
      host.appendChild(panel);
      panels[action] = { panel, cells, action, aIdx: a };
    }

    function update(Q, opts) {
      const o = opts || {};
      const lo = (o.lo != null) ? o.lo : SARSA.stats(Q).lo;
      const hi = (o.hi != null) ? o.hi : SARSA.stats(Q).hi;
      const showVal = o.showVal !== false;
      const highlight = o.highlight; /* { r, c, a (string) } */
      for (const action of Object.keys(panels)) {
        const panel = panels[action];
        for (const ent of panel.cells) {
          const v = SARSA.get(Q, M, N, ent.r, ent.c, panel.aIdx);
          const b = bin(v, lo, hi);
          ent.cell.className = `qcell qcell-mini q-bin-${b}`;
          if (highlight && highlight.r === ent.r && highlight.c === ent.c && highlight.a === action) {
            ent.cell.classList.add('qcell-highlight');
          }
          ent.val.textContent = showVal ? fmt(v) : '';
        }
      }
    }

    function flashCell(r, c, action) {
      const sel = `.qpanel-${action} .qcell[data-r="${r}"][data-c="${c}"]`;
      const el = host.querySelector(sel);
      if (!el) return;
      el.classList.remove('qcell-flash');
      void el.offsetWidth;
      el.classList.add('qcell-flash');
    }

    return { update, flashCell, host };
  }

  /* Convert a stored snapshot Q-table (array of numbers) to Float32Array. */
  function fromSnapshot(snap) {
    if (snap instanceof Float32Array) return snap;
    if (Array.isArray(snap)) return Float32Array.from(snap);
    return new Float32Array(0);
  }

  window.QTable = { mountNumerical, mountValue, mountPerAction, bin, fmt, ARROW, NUM_BINS, fromSnapshot };
})();

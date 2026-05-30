/* The BOARD - the 6x3 display Q-grid for Press Your Luck.
 *
 *   6 rows (pot buckets, "21+" at the top .. "0" at the bottom) x 3 columns
 *   (BEHIND | EVEN | AHEAD) = the entire 18-cell Q-table on one screen. Each
 *   cell carries:
 *     - a mini TABLE-CARD (the recurring state-icon: pot meter + standing
 *       badge) so the learner reads "how much is riding, am I winning" per
 *       cell, and
 *     - the 2 LEVER ROWS (ROLL / HOLD) with their win-prob Q values; the
 *       argmax row is starred (>) and the whole cell is tinted with the
 *       winning lever colour: ROLL burnt-orange (--c-roll), HOLD deep
 *       blue/teal (--c-hold).
 *   The punchline reads as two regions with a STAIRCASE SEAM that climbs
 *   from the AHEAD column to the BEHIND column - the state-dependent twist,
 *   drawn.
 *
 *   This is the Pig analogue of the Pokemon Q-table renderer, reusing the
 *   same mount/update/reset shape so the DP + SARSA scenes can drive it.
 *   It reads the 18-cell layout from window.Pig (stateIndex = potBucket*3 +
 *   standing). The Q payload is the 18*2 win-prob array indexed
 *   [cell*2 + leverIdx], matching window.DATA.oracleQ / a SARSA
 *   Float32Array(18*2). leverIdx follows window.Moves.MOVE_IDS = [roll,hold].
 *
 *   API:
 *     const board = QTable.mount(host, opts?)
 *         opts.miniCards : true   -> mount a compact TableCard in each cell
 *                                    (default true; set false to drop them,
 *                                    e.g. the tight SARSA side panel)
 *         opts.showQ     : true   -> render the per-lever win-prob numbers
 *                                    (default true)
 *     board.update(Q, opts?)      // Q = array length 18*2 (win probs)
 *         opts.showZero           -> paint all-zero cells too (default: leave
 *                                    them "unknown" / dimmed)
 *         opts.suppressFlash      -> skip the argmax-flip flash this call
 *     board.setPolicy(ids, Q?)    // paint directly from 18 lever ids (+ opt Q)
 *     board.reset()
 *     board.cells                 // [{cell, card, leverRows, ...}] by index i
 *     board.getCellNode(i), board.setOnCellClick(cb)
 *     board.N, board.NB, board.NS
 */
(function () {
  const NB = (window.Pig && window.Pig.POT_BUCKETS) || 6;        // 6 pot buckets
  const NS = (window.Pig && window.Pig.STANDINGS) || 3;          // 3 standings
  const N = NB * NS;                                             // 18 cells
  const A = (window.Moves && window.Moves.MOVE_IDS.length) || 2; // 2 levers
  const LEVER_IDS = (window.Moves && window.Moves.MOVE_IDS) || ['roll', 'hold'];
  const POT_LABELS = (window.Pig && window.Pig.POT_BUCKET_LABELS) ||
    ['0', '1-5', '6-10', '11-15', '16-20', '21+'];
  const STAND_LABELS = (window.Pig && window.Pig.STANDING_LABELS) ||
    ['BEHIND', 'EVEN', 'AHEAD'];
  const DANGER_BUCKET = NB - 1;   // bucket 5 = "21+" = past 20

  function T(key, fallback) {
    return window.I18N ? window.I18N.t(key) : fallback;
  }
  function tStand(i) { return T('vocab.' + STAND_LABELS[i].toLowerCase(), STAND_LABELS[i]); }
  function tLever(id) { return T('vocab.' + id, id.toUpperCase()); }

  function mount(host, opts) {
    const o = opts || {};
    const showQ = o.showQ !== false;             // default ON
    const miniCards = o.miniCards !== false && !!window.TableCard;  // default ON
    host.classList.add('pyl-board-host');
    host.innerHTML = '';

    /* Column header row: corner + 3 standing labels. */
    const head = document.createElement('div');
    head.className = 'pyl-board-cols';
    head.style.setProperty('--ns', String(NS));
    let headHtml = '<div class="pyl-board-corner">' +
      T('vocab.pot', 'POT') + ' \\ ' + T('vocab.standing', 'STANDING') + '</div>';
    for (let s = 0; s < NS; s++) headHtml += '<div class="pyl-col-head">' + tStand(s) + '</div>';
    head.innerHTML = headHtml;
    host.appendChild(head);

    /* The grid: column 1 is the row label (pot bucket), columns 2.. are
       the standing cells. Rows run top (bucket NB-1) to bottom (bucket 0). */
    const grid = document.createElement('div');
    grid.className = 'pyl-board-grid';
    grid.style.setProperty('--ns', String(NS));
    grid.style.setProperty('--nb', String(NB));
    host.appendChild(grid);

    const cellNodes = new Array(N);
    let gridRow = 1;
    for (let b = NB - 1; b >= 0; b--) {
      /* Row label (pot bucket). The danger band (past 20) is tinted hot. */
      const lab = document.createElement('div');
      lab.className = 'pyl-row-head' + (b >= DANGER_BUCKET ? ' pyl-row-danger' : '');
      lab.textContent = POT_LABELS[b];
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(gridRow);
      grid.appendChild(lab);

      for (let s = 0; s < NS; s++) {
        const i = b * NS + s;
        const cell = document.createElement('div');
        cell.className = 'pyl-cell pyl-cell-unknown';
        cell.style.gridColumn = String(s + 2);
        cell.style.gridRow = String(gridRow);
        cell.dataset.cell = String(i);

        /* Mini state-icon (pot meter + standing badge) at the top. */
        let card = null;
        if (miniCards) {
          const mcHost = document.createElement('div');
          mcHost.className = 'pyl-cell-card';
          cell.appendChild(mcHost);
          card = window.TableCard.mount(mcHost, { compact: true });
          const rep = window.Pig ? window.Pig.repStateForCell(i) : null;
          if (rep) card.set({ pot: rep.pot, my: rep.my, riv: rep.riv });
        }

        /* The 2 lever rows: a star slot, the lever name, its Q win-prob. */
        const levers = document.createElement('div');
        levers.className = 'pyl-cell-levers';
        const leverRows = new Array(A);
        for (let a = 0; a < A; a++) {
          const id = LEVER_IDS[a];
          const row = document.createElement('div');
          row.className = 'pyl-lever-row pyl-lever-' + id;
          row.dataset.lever = id;
          row.innerHTML =
            '<span class="pyl-lever-star"></span>' +
            '<span class="pyl-lever-name">' + tLever(id) + '</span>' +
            '<span class="pyl-lever-q">' + (showQ ? '.' : '') + '</span>';
          levers.appendChild(row);
          leverRows[a] = {
            row,
            star: row.querySelector('.pyl-lever-star'),
            q: row.querySelector('.pyl-lever-q'),
          };
        }
        cell.appendChild(levers);

        grid.appendChild(cell);
        cellNodes[i] = { cell, card, leverRows, bucket: b, standing: s };
      }
      gridRow++;
    }

    /* Paint one cell: tint by the winning lever, star the argmax row, write
       the per-lever Q numbers. leverId null/unknown -> dimmed "unknown". */
    function paintCell(i, bestId, q) {
      const node = cellNodes[i];
      if (!node) return;
      node.cell.classList.remove('pyl-cell-unknown', 'pyl-cell-roll', 'pyl-cell-hold');
      if (bestId === 'roll' || bestId === 'hold') {
        node.cell.classList.add('pyl-cell-' + bestId);
      } else {
        node.cell.classList.add('pyl-cell-unknown');
      }
      for (let a = 0; a < A; a++) {
        const lr = node.leverRows[a];
        const id = LEVER_IDS[a];
        const isBest = (id === bestId);
        lr.row.classList.toggle('pyl-lever-best', isBest);
        lr.star.textContent = isBest ? '▶' : '';   // ▶
        if (showQ) {
          const v = q ? q[a] : null;
          lr.q.textContent = fmt(v);
        }
      }
    }
    function fmt(v) {
      if (v == null || Number.isNaN(v)) return '.';
      return Number(v).toFixed(2);
    }

    let prevBest = new Array(N).fill(null);

    /* Update from an 18*2 Q array (win probs, [cell*2 + leverIdx]). */
    function update(Q, upOpts) {
      const u = upOpts || {};
      for (let i = 0; i < N; i++) {
        const base = i * A;
        const q = new Array(A);
        let allZero = true;
        let best = 0;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          q[a] = v;
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > q[best]) best = a;
        }
        if (allZero && !u.showZero) {
          paintCell(i, null, showQ ? q : null);
          maybeFlip(i, null, u);
        } else {
          const bestId = LEVER_IDS[best];
          paintCell(i, bestId, q);
          maybeFlip(i, bestId, u);
        }
      }
    }

    /* Flash a cell whose argmax lever just changed (the staircase shifting
       as SARSA learns / DP sweeps). Debounced ding so a sweep that flips
       many cells in one frame plays a single blip. */
    function maybeFlip(i, bestId, u) {
      const prev = prevBest[i];
      if (!u.suppressFlash && prev != null && bestId != null && prev !== bestId) {
        const cell = cellNodes[i].cell;
        cell.classList.remove('pyl-cell-flip');
        void cell.offsetWidth;
        cell.classList.add('pyl-cell-flip');
        setTimeout(() => cell.classList.remove('pyl-cell-flip'), 900);
        scheduleFlipDing();
      }
      prevBest[i] = bestId;
    }
    let flipDingTimer = null;
    function scheduleFlipDing() {
      if (flipDingTimer) return;
      flipDingTimer = setTimeout(() => {
        flipDingTimer = null;
        if (window.SFX) window.SFX.play('cursor');
      }, 220);
    }

    /* Paint directly from 18 lever ids (snapshot policy), with optional Q. */
    function setPolicy(ids, Q) {
      for (let i = 0; i < N; i++) {
        const id = ids ? ids[i] : null;
        let q = null;
        if (Q) { q = []; for (let a = 0; a < A; a++) q[a] = Q[i * A + a]; }
        paintCell(i, id, q);
        prevBest[i] = (id === 'roll' || id === 'hold') ? id : prevBest[i];
      }
    }

    function reset() {
      prevBest = new Array(N).fill(null);
      for (let i = 0; i < N; i++) paintCell(i, null, null);
    }

    let cellClickCb = null;
    for (let i = 0; i < N; i++) {
      cellNodes[i].cell.addEventListener('click', () => {
        if (cellClickCb) cellClickCb(i, cellNodes[i].cell);
      });
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let i = 0; i < N; i++) cellNodes[i].cell.classList.toggle('pyl-cell-click', !!cb);
    }
    function getCellNode(i) { return cellNodes[i] ? cellNodes[i].cell : null; }

    reset();
    return {
      host, update, setPolicy, reset, getCellNode, setOnCellClick,
      cells: cellNodes, N, NB, NS,
    };
  }

  window.QTable = { mount, N, NB, NS };
})();

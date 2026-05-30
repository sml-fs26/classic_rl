/* The BOARD - the 6x3 display Q-grid for Press Your Luck.
 *
 *   6 rows (pot buckets, "21+" at the top .. "0" at the bottom) x 3 columns
 *   (BEHIND | EVEN | AHEAD) = the entire 18-cell Q-table on one screen. Each
 *   cell is painted by its winning lever: ROLL cells burnt-orange (--c-roll),
 *   HOLD cells deep blue/teal (--c-hold). The punchline reads as two regions
 *   with a STAIRCASE SEAM that climbs from the AHEAD column to the BEHIND
 *   column - the state-dependent twist, drawn.
 *
 *   This is the Pig analogue of the Pokemon Q-table renderer, reusing the
 *   same mount/update/reset shape so the DP + SARSA scenes can drive it.
 *   It reads the 18-cell layout from window.Pig (stateIndex = potBucket*3 +
 *   standing). The Q payload is the 18*2 win-prob array [cell*2 + leverIdx],
 *   matching window.DATA.oracleQ / a SARSA Float32Array(18*2).
 *
 *   API:
 *     const board = QTable.mount(host, opts?)
 *         opts.showQ     -> render the per-lever win-prob numbers in each cell
 *         opts.miniCards -> mount a compact TableCard in each cell
 *     board.update(Q, opts?)   // Q = Float-ish array length 18*2
 *     board.setPolicy(ids)     // paint directly from 18 lever ids (no Q)
 *     board.reset()
 *     board.getCellNode(i), board.setOnCellClick(cb)
 */
(function () {
  const NB = (window.Pig && window.Pig.POT_BUCKETS) || 6;       // 6 pot buckets
  const NS = (window.Pig && window.Pig.STANDINGS) || 3;          // 3 standings
  const N = NB * NS;                                             // 18 cells
  const A = (window.Moves && window.Moves.MOVE_IDS.length) || 2; // 2 levers
  const LEVER_IDS = (window.Moves && window.Moves.MOVE_IDS) || ['roll', 'hold'];
  const POT_LABELS = (window.Pig && window.Pig.POT_BUCKET_LABELS) ||
    ['0', '1-5', '6-10', '11-15', '16-20', '21+'];
  const STAND_LABELS = (window.Pig && window.Pig.STANDING_LABELS) ||
    ['BEHIND', 'EVEN', 'AHEAD'];

  function tStand(i) { return window.I18N ? window.I18N.t('vocab.' + STAND_LABELS[i].toLowerCase()) : STAND_LABELS[i]; }
  function tLever(id) { return window.I18N ? window.I18N.t('vocab.' + id) : id.toUpperCase(); }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('pyl-board-host');
    host.innerHTML = '';

    /* Column header row: corner + 3 standing labels. */
    const head = document.createElement('div');
    head.className = 'pyl-board-cols';
    head.style.setProperty('--ns', String(NS));
    let headHtml = '<div class="pyl-board-corner">' +
      (window.I18N ? window.I18N.t('vocab.pot') : 'POT') + ' \\ ' +
      (window.I18N ? window.I18N.t('vocab.standing') : 'STANDING') + '</div>';
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
      /* Row label. */
      const lab = document.createElement('div');
      lab.className = 'pyl-row-head' + (b >= NB - 1 ? ' pyl-row-danger' : '');
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

        const tag = document.createElement('div');
        tag.className = 'pyl-cell-lever';
        cell.appendChild(tag);

        let qrow = null;
        if (o.showQ) {
          qrow = document.createElement('div');
          qrow.className = 'pyl-cell-q';
          qrow.innerHTML =
            '<span class="pyl-q pyl-q-roll">.</span>' +
            '<span class="pyl-q pyl-q-hold">.</span>';
          cell.appendChild(qrow);
        }

        let miniCard = null;
        if (o.miniCards && window.TableCard) {
          const mc = document.createElement('div');
          cell.appendChild(mc);
          miniCard = window.TableCard.mount(mc, { compact: true });
          const rep = window.Pig ? window.Pig.repStateForCell(i) : null;
          if (rep) miniCard.set({ pot: rep.pot, my: rep.my, riv: rep.riv });
        }

        grid.appendChild(cell);
        cellNodes[i] = {
          cell, tag, qrow, miniCard,
          qRoll: qrow ? qrow.querySelector('.pyl-q-roll') : null,
          qHold: qrow ? qrow.querySelector('.pyl-q-hold') : null,
        };
      }
      gridRow++;
    }

    function paintCell(i, leverId, qRoll, qHold) {
      const node = cellNodes[i];
      if (!node) return;
      node.cell.classList.remove('pyl-cell-unknown', 'pyl-cell-roll', 'pyl-cell-hold');
      if (leverId === 'roll' || leverId === 'hold') {
        node.cell.classList.add('pyl-cell-' + leverId);
        node.tag.textContent = tLever(leverId);
      } else {
        node.cell.classList.add('pyl-cell-unknown');
        node.tag.textContent = '?';
      }
      if (node.qRoll && qRoll != null) node.qRoll.textContent = fmt(qRoll);
      if (node.qHold && qHold != null) node.qHold.textContent = fmt(qHold);
    }
    function fmt(v) { return (v != null) ? Number(v).toFixed(2) : '.'; }

    /* Update from an 18*2 Q array (win probs). */
    function update(Q, upOpts) {
      const u = upOpts || {};
      for (let i = 0; i < N; i++) {
        const base = i * A;
        const roll = Q[base + 0];
        const hold = Q[base + 1];
        const allZero = Math.abs(roll) < 1e-9 && Math.abs(hold) < 1e-9;
        if (allZero && !u.showZero) {
          paintCell(i, null, null, null);
        } else {
          const best = roll >= hold ? 'roll' : 'hold';
          paintCell(i, best, roll, hold);
        }
      }
    }

    /* Paint directly from 18 lever ids (used by setPolicy snapshots). */
    function setPolicy(ids, Q) {
      for (let i = 0; i < N; i++) {
        const id = ids ? ids[i] : null;
        const qRoll = Q ? Q[i * A + 0] : null;
        const qHold = Q ? Q[i * A + 1] : null;
        paintCell(i, id, qRoll, qHold);
      }
    }

    function reset() {
      for (let i = 0; i < N; i++) paintCell(i, null, null, null);
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
    return { host, update, setPolicy, reset, getCellNode, setOnCellClick, N, NB, NS };
  }

  window.QTable = { mount, N, NB, NS };
})();

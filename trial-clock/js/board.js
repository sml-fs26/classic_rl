/* board.js -- the Trial Clock state widgets.
 *
 *   TWO objects share the visual language of the MDP:
 *
 *   (A) window.TrialCard.mount(host, opts) -> the recurring STATE ICON: one
 *       trial user's situation. A 5-rung Adoption Ladder (none -> ACTIVATED;
 *       rungs light up green as they climb, the top rung gets an "aha" spark)
 *       and a 5-pip Trial Clock (empties one pip per day, tinting calm-blue ->
 *       amber -> urgent-red as the clock runs down). Appears in every
 *       single-user scene so the learner builds one mental picture.
 *         handle: setState(tier, days), setTier(t), setDays(d), pulse(),
 *                 flashTerminal('convert'|'abandon'|'expiry'), host
 *
 *   (B) window.Board.mount(host, opts) -> the whole 5x5 BOARD and Q-table in
 *       one object. Rows = tier (4 = ACTIVATED on top .. 0 = none on the
 *       bottom), columns = days-left (5 on the left .. 1 on the right). Each
 *       cell is a mini situation; in later scenes it shows its three lever
 *       Q-values, the argmax starred, and the cell tinted by the winning lever
 *       (NUDGE teal / DO NOTHING grey / PUSH gold) so the optimal policy reads
 *       as a "staircase" of colour.
 *         opts.variant: 'policy' -> per-cell lever chip (+ star), compact
 *                       'qtable' -> per-cell three Q-values, argmax starred
 *         handle: update(Q, opts)      paint Q values + star + region tint
 *                 paintPolicy(byIndex) paint a lever map (no Q values)
 *                 reset()              clear all cells (go 'unsolved')
 *                 setMarker(idx|null)  place / move the "current cell" outline
 *                 setSolvedMask(mask)  dim un-filled cells (DP fill)
 *                 highlightCell(idx, on)
 *                 getCellNode(idx), setOnCellClick(cb), host
 *
 *   Q is indexed Q[stateIndex * A + leverIdx], stateIndex = tier*5 + (days-1),
 *   leverIdx in window.Levers.LEVER_IDS order [nudge, nothing, push] (the same
 *   order window.Bellman.qFromV / window.DATA.Qstar use). Theme-agnostic: every
 *   colour comes from CSS tokens. Styles live in css/board.css. */
(function () {
  const G = window.Trial;
  const LEVER_IDS = window.Levers.LEVER_IDS;       // [nudge, nothing, push]
  const A = LEVER_IDS.length;                        // 3
  const N_TIERS = G.N_TIERS;                         // 5
  const N_DAYS  = G.N_DAYS;                          // 5
  const N = G.N;                                     // 25
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const STAR = '★';
  const EMPTY = '·';

  function leverShort(id) { return T('lever.' + id + '.short'); }   // NUDGE / WAIT / PUSH
  function leverName(id)  { return T('lever.' + id); }              // ONBOARD NUDGE ...

  /* ============================================================
     (A) TRIAL CARD -- the recurring state icon
     ============================================================ */
  function mountCard(host, opts) {
    const o = opts || {};
    host.classList.add('trial-card');
    if (o.compact) host.classList.add('trial-card-compact');

    /* ladder: rung 4 (ACTIVATED) on top .. rung 0 (none) on the bottom */
    let ladderHtml = '<div class="tc-ladder">';
    for (let t = N_TIERS - 1; t >= 0; t--) {
      const label = t === N_TIERS - 1 ? T('card.activated') : (t === 0 ? T('card.none') : String(t));
      ladderHtml += '<div class="tc-rung" data-tier="' + t + '">' +
        '<span class="tc-rung-dot"></span>' +
        '<span class="tc-rung-lab">' + label + '</span>' +
        (t === N_TIERS - 1 ? '<span class="tc-spark">✦</span>' : '') +
        '</div>';
    }
    ladderHtml += '</div>';

    /* clock pips: 5 down to 1, left to right */
    let pipsHtml = '<div class="tc-clock"><div class="tc-pips">';
    for (let d = N_DAYS; d >= 1; d--) pipsHtml += '<span class="tc-pip" data-day="' + d + '"></span>';
    pipsHtml += '</div><div class="tc-days-lab"><span class="tc-days-num">5</span>' +
      '<span class="tc-days-word">' + T('card.daysLeft') + '</span></div></div>';

    host.innerHTML =
      '<div class="tc-head">' + pipsHtml + '</div>' +
      '<div class="tc-body">' +
        '<div class="tc-avatar" aria-hidden="true">' +
          '<span class="tc-avatar-head"></span><span class="tc-avatar-body"></span>' +
        '</div>' +
        ladderHtml +
      '</div>' +
      '<div class="tc-terminal" hidden></div>';

    const rungs = {};
    host.querySelectorAll('.tc-rung').forEach(r => { rungs[parseInt(r.dataset.tier, 10)] = r; });
    const pips = {};
    host.querySelectorAll('.tc-pip').forEach(p => { pips[parseInt(p.dataset.day, 10)] = p; });
    const daysNum = host.querySelector('.tc-days-num');
    const clock = host.querySelector('.tc-clock');
    const termEl = host.querySelector('.tc-terminal');

    let curTier = 0, curDays = N_DAYS;

    function paintLadder(tier) {
      for (let t = 0; t < N_TIERS; t++) {
        const r = rungs[t];
        if (!r) continue;
        r.classList.toggle('lit', t <= tier && tier >= 0);
        r.classList.toggle('current', t === tier);
        r.classList.toggle('activated', t === N_TIERS - 1 && tier >= N_TIERS - 1);
      }
    }
    function paintClock(days) {
      for (let d = 1; d <= N_DAYS; d++) {
        const p = pips[d];
        if (!p) continue;
        p.classList.toggle('spent', d > days);   // pips above days-left are spent
      }
      if (daysNum) daysNum.textContent = String(Math.max(0, days));
      /* urgency tint of the whole clock */
      clock.classList.remove('calm', 'warn', 'urgent');
      if (days >= 4) clock.classList.add('calm');
      else if (days >= 2) clock.classList.add('warn');
      else clock.classList.add('urgent');
    }
    function setState(tier, days) {
      termEl.hidden = true; host.classList.remove('is-terminal');
      curTier = tier; curDays = days;
      paintLadder(tier); paintClock(days);
    }
    function setTier(t) { setState(t, curDays); }
    function setDays(d) { setState(curTier, d); }
    function pulse() {
      host.classList.remove('tc-pulse'); void host.offsetWidth; host.classList.add('tc-pulse');
      setTimeout(() => host.classList.remove('tc-pulse'), 600);
    }
    function flashTerminal(which) {
      host.classList.add('is-terminal');
      termEl.hidden = false;
      termEl.className = 'tc-terminal term-' + which;
      const label = which === 'convert' ? T('term.convert')
        : which === 'abandon' ? T('term.abandon') : T('term.expiry');
      const sub = which === 'convert' ? '+20' : which === 'abandon' ? '-5' : '0';
      termEl.innerHTML = '<span class="tc-term-stamp">' + label + '</span><span class="tc-term-r">' + sub + '</span>';
      termEl.classList.remove('term-flash'); void termEl.offsetWidth; termEl.classList.add('term-flash');
    }

    setState(0, N_DAYS);
    return { setState, setTier, setDays, pulse, flashTerminal, host };
  }

  /* ============================================================
     (B) BOARD -- the whole 5x5 grid / Q-table
     ============================================================ */
  function mountBoard(host, opts) {
    const o = opts || {};
    const variant = o.variant || 'policy';           // 'policy' | 'qtable'
    host.classList.add('tc-board', 'tc-board-' + variant);
    host.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'tcb-grid';
    host.appendChild(grid);

    /* corner + day headers (top) */
    grid.appendChild(cornerCell());
    for (let d = N_DAYS; d >= 1; d--) {
      const h = document.createElement('div');
      h.className = 'tcb-colhead' + (d === 1 ? ' last-day' : '');
      h.innerHTML = '<span class="tcb-colhead-num">' + d + '</span>';
      grid.appendChild(h);
    }

    const cellNodes = {};        // stateIndex -> { cell, rows, chip }
    for (let t = N_TIERS - 1; t >= 0; t--) {
      /* row header (tier, left) */
      const rh = document.createElement('div');
      rh.className = 'tcb-rowhead' + (t === N_TIERS - 1 ? ' top-tier' : '') + (t === 0 ? ' bottom-tier' : '');
      const tlabel = t === N_TIERS - 1 ? T('card.activated') : (t === 0 ? T('card.none') : String(t));
      rh.innerHTML = '<span class="tcb-rowhead-tier">' + tlabel + '</span>';
      grid.appendChild(rh);

      for (let d = N_DAYS; d >= 1; d--) {
        const si = t * N_DAYS + (d - 1);
        const cell = document.createElement('div');
        cell.className = 'tcb-cell';
        cell.dataset.idx = String(si);
        cell.dataset.tier = String(t);
        cell.dataset.days = String(d);

        if (variant === 'qtable') {
          let rowsHtml = '<div class="tcb-qrows">';
          for (let a = 0; a < A; a++) {
            const id = LEVER_IDS[a];
            rowsHtml += '<div class="tcb-qrow lever-' + id + '" data-lever="' + id + '">' +
              '<span class="tcb-qmark"></span>' +
              '<span class="tcb-qsw lever-fill-' + id + '"></span>' +
              '<span class="tcb-qval">' + EMPTY + '</span></div>';
          }
          rowsHtml += '</div>';
          cell.innerHTML = rowsHtml;
          const rows = [];
          cell.querySelectorAll('.tcb-qrow').forEach((r, a) => {
            rows[a] = { row: r, mark: r.querySelector('.tcb-qmark'), val: r.querySelector('.tcb-qval') };
          });
          cellNodes[si] = { cell, rows, chip: null };
        } else {
          /* policy variant: a single lever chip + star */
          cell.innerHTML =
            '<span class="tcb-chip"><span class="tcb-chip-star"></span>' +
            '<span class="tcb-chip-lab">' + EMPTY + '</span></span>';
          cellNodes[si] = { cell, rows: null, chip: cell.querySelector('.tcb-chip'),
            chipLab: cell.querySelector('.tcb-chip-lab'), chipStar: cell.querySelector('.tcb-chip-star') };
        }
        cell.classList.add('unsolved');
        grid.appendChild(cell);
      }
    }

    /* axis captions */
    const caption = document.createElement('div');
    caption.className = 'tcb-axes';
    caption.innerHTML =
      '<span class="tcb-axis tcb-axis-x">' + T('board.axisDays') + ' &rarr;</span>' +
      '<span class="tcb-axis tcb-axis-y">&uarr; ' + T('board.axisTier') + '</span>';
    host.appendChild(caption);

    /* optional legend */
    if (o.legend !== false) {
      const legend = document.createElement('div');
      legend.className = 'tcb-legend';
      legend.innerHTML =
        LEVER_IDS.map(id =>
          '<span class="tcb-legend-item"><span class="tcb-legend-sw lever-fill-' + id + '"></span>' +
          leverShort(id) + '</span>').join('') +
        '<span class="tcb-legend-item">' + STAR + ' = ' + T('board.bestLever') + '</span>';
      host.appendChild(legend);
    }

    const ALL_TINTS = LEVER_IDS.map(id => 'tint-' + id);
    let prevBest = null;     // per-cell best index, for flip flash
    let curMarker = null;

    function bestIdx(Q, si) {
      const base = si * A;
      let m = -Infinity, k = -1, allZero = true;
      for (let a = 0; a < A; a++) {
        const v = Q[base + a];
        if (v == null || !isFinite(v)) continue;
        if (Math.abs(v) > 1e-9) allZero = false;
        if (v > m) { m = v; k = a; }
      }
      return { k, m, allZero };
    }

    function clearCell(node) {
      if (node.rows) {
        for (let a = 0; a < A; a++) {
          node.rows[a].mark.textContent = '';
          node.rows[a].row.classList.remove('argmax');
          node.rows[a].val.textContent = EMPTY;
        }
      }
      if (node.chip) { node.chipLab.textContent = EMPTY; node.chipStar.textContent = ''; node.chip.className = 'tcb-chip'; }
      for (const t of ALL_TINTS) node.cell.classList.remove(t);
      node.cell.classList.add('unsolved');
    }

    function update(Q, opt) {
      const oo = opt || {};
      const newBest = new Array(N).fill(-1);
      for (let si = 0; si < N; si++) {
        const node = cellNodes[si];
        const { k, m, allZero } = bestIdx(Q, si);
        for (const t of ALL_TINTS) node.cell.classList.remove(t);

        if (allZero || k < 0) {
          node.cell.classList.add('unsolved');
          if (node.rows) for (let a = 0; a < A; a++) { node.rows[a].val.textContent = EMPTY; node.rows[a].row.classList.remove('argmax'); node.rows[a].mark.textContent = ''; }
          if (node.chip) { node.chipLab.textContent = EMPTY; node.chipStar.textContent = ''; }
          continue;
        }
        node.cell.classList.remove('unsolved');
        node.cell.classList.add('tint-' + LEVER_IDS[k]);
        newBest[si] = k;

        if (node.rows) {
          const base = si * A;
          for (let a = 0; a < A; a++) {
            const v = Q[base + a];
            node.rows[a].val.textContent = (v == null || !isFinite(v)) ? EMPTY : fmt(v);
            const isArg = a === k;
            node.rows[a].row.classList.toggle('argmax', isArg);
            node.rows[a].mark.textContent = isArg ? STAR : '';
          }
        }
        if (node.chip) {
          node.chip.className = 'tcb-chip lever-fill-' + LEVER_IDS[k];
          node.chipLab.textContent = leverShort(LEVER_IDS[k]);
          node.chipStar.textContent = STAR;
        }

        /* argmax-flip flash */
        if (prevBest && !oo.suppressFlash && prevBest[si] >= 0 && prevBest[si] !== k) {
          node.cell.classList.remove('cell-flip'); void node.cell.offsetWidth; node.cell.classList.add('cell-flip');
          setTimeout(() => node.cell.classList.remove('cell-flip'), 800);
        }
      }
      prevBest = newBest;
    }

    /* Paint a POLICY directly (no Q values): byIndex maps stateIndex -> leverId. */
    function paintPolicy(byIndex, opt) {
      const oo = opt || {};
      for (let si = 0; si < N; si++) {
        const node = cellNodes[si];
        const id = byIndex[si];
        for (const t of ALL_TINTS) node.cell.classList.remove(t);
        node.cell.classList.remove('unsolved');
        if (!id) { node.cell.classList.add('unsolved'); continue; }
        node.cell.classList.add('tint-' + id);
        if (node.chip) {
          node.chip.className = 'tcb-chip lever-fill-' + id;
          node.chipLab.textContent = leverShort(id);
          node.chipStar.textContent = STAR;
        }
        if (node.rows) {
          for (let a = 0; a < A; a++) {
            const isPick = LEVER_IDS[a] === id;
            node.rows[a].row.classList.toggle('argmax', isPick);
            node.rows[a].mark.textContent = isPick ? STAR : '';
            node.rows[a].val.textContent = isPick ? T('board.play') : EMPTY;
          }
        }
        if (oo.animate) {
          const d = (N - si) * 18;
          (function (el, delay) {
            setTimeout(() => {
              el.classList.remove('cell-flip'); void el.offsetWidth; el.classList.add('cell-flip');
              setTimeout(() => el.classList.remove('cell-flip'), 700);
            }, delay);
          })(node.cell, d);
        }
      }
    }

    function reset() { prevBest = null; for (let si = 0; si < N; si++) clearCell(cellNodes[si]); }

    function setMarker(si) {
      if (curMarker != null && cellNodes[curMarker]) cellNodes[curMarker].cell.classList.remove('marked');
      curMarker = si;
      if (si != null && cellNodes[si]) cellNodes[si].cell.classList.add('marked');
    }
    function setSolvedMask(mask) {
      for (let si = 0; si < N; si++) {
        const solved = !!(mask && mask[si]);
        cellNodes[si].cell.classList.toggle('pending', !solved);
      }
    }
    function highlightCell(si, on) {
      const node = cellNodes[si];
      if (node) node.cell.classList.toggle('just-locked', !!on);
    }
    function getCellNode(si) { return cellNodes[si] ? cellNodes[si].cell : null; }

    let cellClickCb = null;
    for (let si = 0; si < N; si++) {
      (function (s) {
        cellNodes[s].cell.addEventListener('click', () => { if (cellClickCb) cellClickCb(s, cellNodes[s].cell); });
      })(si);
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let si = 0; si < N; si++) cellNodes[si].cell.classList.toggle('clickable', !!cb);
    }

    reset();
    return {
      update, paintPolicy, reset, setMarker, setSolvedMask, highlightCell,
      getCellNode, setOnCellClick, host,
    };
  }

  /* Compact numeric format for the Q-table cells (values run -5..+20). */
  function fmt(v) {
    const a = Math.abs(v);
    if (a >= 10) return v.toFixed(0);
    if (a >= 1)  return v.toFixed(1);
    return v.toFixed(1);
  }
  function cornerCell() { const c = document.createElement('div'); c.className = 'tcb-corner'; return c; }

  /* Standalone argmax-count helper (skips null cells). */
  function leverCounts(Q) {
    const c = {};
    for (const id of LEVER_IDS) c[id] = 0;
    for (let si = 0; si < N; si++) {
      const base = si * A;
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

  window.TrialCard = { mount: mountCard };
  window.Board = { mount: mountBoard, leverCounts, leverShort, leverName, fmt };
})();

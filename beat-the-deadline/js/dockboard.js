/* dockboard.js -- the dock-state icon AND the 5x5 policy / Q-table board.
 *
 *   The recurring state-icon (every scene): a DOCK TILE reading the full state
 *   (p, h) at a glance: a stack of pallet crates (0..4, growing upward), a
 *   segmented COUNTDOWN CLOCK (4 wedges draining green, amber, red, black as h
 *   falls), and a battered TRUCK waiting at the bay.
 *
 *   The whole board (DP / policy / Q* scenes): a 5x5 grid that IS the dock map.
 *   Rows = pallets (p = 4 at top, p = 0 at bottom); columns = hours-left
 *   (h = 0 at left, h = 4 at right). SEND cells glow truck-blue, WAIT cells
 *   hold-amber; the diagonal frontier between them is the signature image.
 *   The h = 0 column is the forced-late wall; the p = 0 row is the muted
 *   empty-dock edge.
 *
 *   mount(host, opts) -> handle {
 *     // ICON variant
 *     setState(p, h)             redraw the dock tile to (p, h)
 *     pulse()                    brief emphasis on the tile
 *     flashOutcome(kind)         'sent' | 'blown' burst on the tile
 *     // BOARD variant
 *     update(Q, opts)           paint Q values + argmax glow per cell
 *     paintPolicy(gridOrFn, o)  paint a policy directly (action id per cell)
 *     reset()                    clear all cell Q values (cells go 'unsolved')
 *     setSolvedMask(mask)        dim cells whose V is not yet stable (DP fill)
 *     setMarker(p, h | null)     outline the current (p,h) cell
 *     flashCell(p, h)            brief flash on one cell
 *     getCellNode(p, h)          the cell element for (p, h)
 *     setOnCellClick(cb)         make decision cells clickable -> cb(p, h, el)
 *     host
 *   }
 *     opts.variant: 'icon'  -> the compact dock tile only
 *                   'board' -> the 5x5 grid (optionally with Q rows)
 *     opts.showValues: print V*(cell) badges (board variant)
 *     opts.showQ: render the two-lever Q rows in each cell (board variant)
 *
 *   Q is indexed Q[stateIndex * A + actionIdx], stateIndex = p*5 + h,
 *   actionIdx in window.Actions.ACTION_IDS = [wait, send] (same order as
 *   window.Bellman.qFromV / window.DATA.Qstar). A clamped lever holds
 *   null / -Infinity and renders disabled. Theme-agnostic: colours come from
 *   CSS tokens. Styles live in css/dockboard.css. */
(function () {
  const D = window.Dock;
  const ACTION_IDS = window.Actions.ACTION_IDS;     // [wait, send]
  const A = ACTION_IDS.length;                        // 2
  const PMAX = D.PMAX, HMAX = D.HMAX;                 // 4, 4
  const NH = D.NH;                                    // 5
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const EMPTY = '·';                  // middle dot placeholder
  const DASH = '-';                   // em dash (muted edge marker)
  const STAR = '★';                   // black star (argmax)

  /* ---------- The dock-tile icon (pallets + clock + truck) ---------- */
  function tileSvg(p, h) {
    const W = 132, H = 116;
    let s = '<svg class="dock-tile-svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">';

    /* bay floor */
    s += '<rect x="2" y="2" width="' + (W - 4) + '" height="' + (H - 4) + '" fill="var(--bg-strong)" stroke="var(--rule)" stroke-width="3"/>';
    s += '<line x1="2" y1="86" x2="' + (W - 2) + '" y2="86" stroke="var(--rule-soft)" stroke-width="2"/>';

    /* --- pallet stack (left), 4 slots growing upward --- */
    const slotW = 30, slotH = 13, baseX = 12, baseY = 80;
    for (let i = 0; i < PMAX; i++) {
      const y = baseY - i * (slotH + 3);
      const filled = i < p;
      s += '<rect x="' + baseX + '" y="' + y + '" width="' + slotW + '" height="' + slotH + '" ' +
        'fill="' + (filled ? 'var(--pallet)' : 'var(--bg-sunk)') + '" ' +
        'stroke="' + (filled ? 'var(--pallet-rule)' : 'var(--rule-soft)') + '" stroke-width="2"/>';
      if (filled) {
        s += '<line x1="' + (baseX + slotW / 2) + '" y1="' + (y + 1) + '" x2="' + (baseX + slotW / 2) + '" y2="' + (y + slotH - 1) + '" stroke="var(--pallet-rule)" stroke-width="1.4"/>';
      }
    }

    /* --- countdown clock (top-right): 4 wedges draining --- */
    const cx = 96, cy = 36, r = 24;
    const wedgeColors = ['var(--clock-risk)', 'var(--clock-warn)', 'var(--clock-ok)', 'var(--clock-full)']; // wedge i lit when h > i
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 2) + '" fill="var(--clock-dead)" stroke="var(--rule)" stroke-width="2.5"/>';
    for (let i = 0; i < 4; i++) {
      const a0 = -90 + i * 90, a1 = -90 + (i + 1) * 90;
      const lit = h > i;
      const fill = lit ? wedgeColors[i] : 'var(--clock-empty)';
      s += wedgePath(cx, cy, r, a0 + 3, a1 - 3, fill);
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--rule)"/>';
    /* hours numeral */
    s += '<text x="' + cx + '" y="' + (cy + r + 16) + '" text-anchor="middle" font-family="Press Start 2P, monospace" font-size="9" fill="var(--ink)">' + h + 'H</text>';

    /* --- truck (bottom-right) at the bay door --- */
    const tx = 70, ty = 92;
    s += '<rect x="' + tx + '" y="' + ty + '" width="26" height="14" fill="var(--truck)" stroke="var(--truck-rule)" stroke-width="2"/>';      // cargo box
    s += '<rect x="' + (tx + 26) + '" y="' + (ty + 4) + '" width="12" height="10" fill="var(--truck)" stroke="var(--truck-rule)" stroke-width="2"/>'; // cab
    s += '<circle cx="' + (tx + 7) + '" cy="' + (ty + 16) + '" r="3.4" fill="var(--rule)"/>';
    s += '<circle cx="' + (tx + 30) + '" cy="' + (ty + 16) + '" r="3.4" fill="var(--rule)"/>';

    s += '</svg>';
    return s;
  }

  function wedgePath(cx, cy, r, a0deg, a1deg, fill) {
    const a0 = a0deg * Math.PI / 180, a1 = a1deg * Math.PI / 180;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = (a1deg - a0deg) > 180 ? 1 : 0;
    return '<path d="M ' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
      ' L ' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
      ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      ' Z" fill="' + fill + '" stroke="var(--rule)" stroke-width="1.2"/>';
  }

  function mount(host, opts) {
    const o = opts || {};
    const variant = o.variant || 'icon';
    host.classList.add('dockboard', 'dockboard-' + variant);
    host.innerHTML = '';
    if (variant === 'icon') return mountIcon(host, o);
    return mountBoard(host, o);
  }

  /* ===================== ICON ===================== */
  function mountIcon(host, o) {
    const wrap = document.createElement('div');
    wrap.className = 'dock-tile';
    const label = o.showLabel !== false;
    wrap.innerHTML =
      '<div class="dock-tile-art"></div>' +
      (label ? '<div class="dock-tile-label"><span class="dt-p">p&nbsp;0</span><span class="dt-sep">,</span><span class="dt-h">h&nbsp;0</span></div>' : '');
    host.appendChild(wrap);
    const art = wrap.querySelector('.dock-tile-art');
    const pEl = wrap.querySelector('.dt-p');
    const hEl = wrap.querySelector('.dt-h');

    function setState(p, h) {
      art.innerHTML = tileSvg(p, h);
      if (pEl) pEl.innerHTML = 'p&nbsp;' + p;
      if (hEl) hEl.innerHTML = 'h&nbsp;' + h;
      wrap.classList.toggle('dock-empty', p === 0);
      wrap.classList.toggle('dock-wall', h === 0);
    }
    function pulse() {
      wrap.classList.remove('dt-pulse'); void wrap.offsetWidth; wrap.classList.add('dt-pulse');
      setTimeout(() => wrap.classList.remove('dt-pulse'), 600);
    }
    function flashOutcome(kind) {
      const cls = kind === 'blown' ? 'dt-flash-blown' : 'dt-flash-sent';
      wrap.classList.remove('dt-flash-blown', 'dt-flash-sent'); void wrap.offsetWidth;
      wrap.classList.add(cls);
      setTimeout(() => wrap.classList.remove(cls), 900);
    }
    setState(o.p != null ? o.p : 2, o.h != null ? o.h : 4);
    return { setState, pulse, flashOutcome, host, el: wrap,
      update() {}, paintPolicy() {}, reset() {}, setSolvedMask() {}, setMarker() {}, flashCell() {}, setOnCellClick() {} };
  }

  /* ===================== BOARD ===================== */
  function mountBoard(host, o) {
    const showQ = !!o.showQ;
    const showValues = !!o.showValues;

    const board = document.createElement('div');
    board.className = 'db-grid' + (showQ ? ' db-grid-q' : '');
    host.appendChild(board);

    /* corner */
    const corner = document.createElement('div');
    corner.className = 'db-corner';
    corner.innerHTML = '<span class="db-corner-p">' + T('board.pallets') + '</span><span class="db-corner-slash">\\</span><span class="db-corner-h">' + T('board.hours') + '</span>';
    board.appendChild(corner);

    /* column headers: hours-left 0..4 (h=0 leftmost). */
    for (let h = 0; h <= HMAX; h++) {
      const c = document.createElement('div');
      c.className = 'db-colhead' + (h === 0 ? ' db-wall-head' : '');
      c.innerHTML = '<span class="db-h-num">' + h + '</span><span class="db-h-unit">h</span>';
      board.appendChild(c);
    }

    /* rows: pallets 4 (top) .. 0 (bottom). */
    const cellNodes = {};   // "p,h" -> { cell, rows:{wait,send}, vbadge ... }
    for (let p = PMAX; p >= 0; p--) {
      const rh = document.createElement('div');
      rh.className = 'db-rowhead' + (p === 0 ? ' db-empty-head' : '');
      rh.innerHTML = '<span class="db-p-num">' + p + '</span><span class="db-p-unit">p</span>';
      board.appendChild(rh);

      for (let h = 0; h <= HMAX; h++) {
        const legal = D.availableActionIds(p, h);
        const isDecision = p >= 1 && h >= 1;
        const isWall = h === 0 && p >= 1;
        const isEmpty = p === 0;
        const cell = document.createElement('div');
        cell.className = 'db-cell' +
          (isEmpty ? ' db-empty' : '') +
          (isWall ? ' db-wall' : '') +
          (isDecision ? ' db-decision' : '');
        cell.dataset.p = String(p);
        cell.dataset.h = String(h);

        let inner = '';
        if (showQ && isDecision) {
          inner += '<div class="db-qrows">';
          for (const id of ACTION_IDS) {
            const lg = legal.includes(id);
            inner += '<div class="db-qrow lever-' + id + (lg ? '' : ' clamped') + '" data-action="' + id + '">' +
              '<span class="db-qmark"></span>' +
              '<span class="db-qname">' + (id === 'wait' ? 'W' : 'S') + '</span>' +
              '<span class="db-qval">' + EMPTY + '</span>' +
            '</div>';
          }
          inner += '</div>';
        } else {
          inner += '<div class="db-cell-tag"></div>';
        }
        if (showValues && isDecision) {
          inner += '<div class="db-vbadge"><span class="db-vlab">V*</span><span class="db-vval">' + EMPTY + '</span></div>';
        }
        if (isEmpty) inner += '<span class="db-edge-mark">' + DASH + '</span>';
        cell.innerHTML = inner;
        board.appendChild(cell);

        const rowsMap = {};
        if (showQ && isDecision) {
          cell.querySelectorAll('.db-qrow').forEach(r => {
            rowsMap[r.dataset.action] = {
              row: r, mark: r.querySelector('.db-qmark'), val: r.querySelector('.db-qval'),
              legal: legal.includes(r.dataset.action),
            };
          });
        }
        cellNodes[p + ',' + h] = {
          cell, rows: rowsMap,
          tag: cell.querySelector('.db-cell-tag'),
          vbadge: cell.querySelector('.db-vval'),
          isDecision, isWall, isEmpty, legal,
        };
      }
    }

    /* optional legend */
    if (o.legend !== false) {
      const legend = document.createElement('div');
      legend.className = 'db-legend';
      legend.innerHTML =
        '<span class="db-leg-item"><span class="db-leg-sw lever-fill-send"></span>' + T('action.send') + '</span>' +
        '<span class="db-leg-item"><span class="db-leg-sw lever-fill-wait"></span>' + T('action.wait') + '</span>' +
        '<span class="db-leg-item">' + STAR + ' = ' + T('board.bestLever') + '</span>';
      host.appendChild(legend);
    }

    const ALL_TINTS = ['tint-wait', 'tint-send'];
    let prevQ = null;

    function bestLegalIdx(Q, base, legalIdxs) {
      let best = -Infinity, k = -1, allZero = true;
      for (const a of legalIdxs) {
        const v = Q[base + a];
        if (v == null || !isFinite(v)) continue;
        if (Math.abs(v) > 1e-9) allZero = false;
        if (v > best) { best = v; k = a; }
      }
      return { k, best, allZero };
    }
    function legalIdxsFor(p, h) {
      const out = [];
      for (const id of D.availableActionIds(p, h)) out.push(ACTION_IDS.indexOf(id));
      return out;
    }

    /* Paint Q values + argmax glow. */
    function update(Q, opt) {
      const oo = opt || {};
      for (let p = 1; p <= PMAX; p++) {
        for (let h = 1; h <= HMAX; h++) {
          const node = cellNodes[p + ',' + h];
          if (!node || !node.isDecision) continue;
          const base = (p * NH + h) * A;
          const L = legalIdxsFor(p, h);
          const r = bestLegalIdx(Q, base, L);
          const k = r.k, allZero = r.allZero;
          for (const t of ALL_TINTS) node.cell.classList.remove(t);
          if (allZero || k < 0) {
            node.cell.classList.add('db-unsolved');
            for (const id of ACTION_IDS) {
              const rr = node.rows[id];
              if (!rr || !rr.legal) continue;
              rr.val.textContent = EMPTY; rr.row.classList.remove('argmax'); rr.mark.textContent = '';
            }
            if (node.vbadge) node.vbadge.textContent = EMPTY;
          } else {
            node.cell.classList.remove('db-unsolved');
            node.cell.classList.add('tint-' + ACTION_IDS[k]);
            for (let ai = 0; ai < A; ai++) {
              const id = ACTION_IDS[ai];
              const rr = node.rows[id];
              if (!rr || !rr.legal) continue;
              const v = Q[base + ai];
              rr.val.textContent = (v == null || !isFinite(v)) ? EMPTY : fmtQ(v);
              const isArg = ai === k;
              rr.row.classList.toggle('argmax', isArg);
              rr.mark.textContent = isArg ? STAR : '';
            }
            if (node.vbadge) node.vbadge.textContent = fmtQ(Q[base + k]);
            if (prevQ && !oo.suppressFlash) {
              const pe = bestLegalIdx(prevQ, base, L);
              if (pe.k >= 0 && pe.k !== k) flashFlip(node.cell);
            }
          }
        }
      }
      prevQ = Array.from(Q, v => (v == null ? null : v));
    }

    /* Paint a policy directly. gridOrFn: object "p,h"->actionId, or a function
       (p,h)->actionId. Tints each decision cell by its lever, stars its row. */
    function paintPolicy(gridOrFn, opt) {
      const oo = opt || {};
      const lookup = (typeof gridOrFn === 'function') ? gridOrFn : (p, h) => gridOrFn[p + ',' + h];
      for (let p = 1; p <= PMAX; p++) {
        for (let h = 1; h <= HMAX; h++) {
          const node = cellNodes[p + ',' + h];
          if (!node || !node.isDecision) continue;
          const id = lookup(p, h);
          for (const t of ALL_TINTS) node.cell.classList.remove(t);
          node.cell.classList.remove('db-unsolved');
          if (!id) { node.cell.classList.add('db-unsolved'); continue; }
          node.cell.classList.add('tint-' + id);
          if (node.tag) node.tag.textContent = (id === 'wait' ? T('action.wait') : T('action.send'));
          for (const aId of ACTION_IDS) {
            const rr = node.rows[aId];
            if (!rr || !rr.legal) continue;
            const isPick = aId === id;
            rr.row.classList.toggle('argmax', isPick);
            rr.mark.textContent = isPick ? STAR : '';
            rr.val.textContent = isPick ? T('board.play') : EMPTY;
          }
          if (oo.animate) {
            const d = ((PMAX - p) + h) * 38;
            (function (el, delay) { setTimeout(() => flashFlip(el), delay); })(node.cell, d);
          }
        }
      }
    }

    function reset() {
      prevQ = null;
      for (let p = 1; p <= PMAX; p++) for (let h = 1; h <= HMAX; h++) {
        const node = cellNodes[p + ',' + h];
        if (!node || !node.isDecision) continue;
        for (const t of ALL_TINTS) node.cell.classList.remove(t);
        node.cell.classList.add('db-unsolved');
        for (const id of ACTION_IDS) {
          const rr = node.rows[id];
          if (!rr) continue;
          rr.val.textContent = EMPTY; rr.row.classList.remove('argmax'); rr.mark.textContent = '';
        }
        if (node.vbadge) node.vbadge.textContent = EMPTY;
        if (node.tag) node.tag.textContent = '';
      }
    }

    function setSolvedMask(mask) {
      const solved = (typeof mask === 'function') ? mask : (p, h) => mask[p * NH + h];
      for (let p = 0; p <= PMAX; p++) for (let h = 0; h <= HMAX; h++) {
        const node = cellNodes[p + ',' + h];
        if (!node) continue;
        node.cell.classList.toggle('db-pending', !solved(p, h));
      }
    }

    let curMarker = null;
    function setMarker(p, h) {
      if (curMarker) { const n = cellNodes[curMarker]; if (n) n.cell.classList.remove('db-marked'); }
      if (p == null) { curMarker = null; return; }
      const key = p + ',' + h;
      curMarker = key;
      const n = cellNodes[key];
      if (n) n.cell.classList.add('db-marked');
    }
    function flashCell(p, h) { const n = cellNodes[p + ',' + h]; if (n) flashFlip(n.cell); }
    function flashFlip(el) {
      el.classList.remove('db-flip'); void el.offsetWidth; el.classList.add('db-flip');
      setTimeout(() => el.classList.remove('db-flip'), 760);
    }
    function getCellNode(p, h) { const n = cellNodes[p + ',' + h]; return n ? n.cell : null; }

    let cellClickCb = null;
    for (let p = 1; p <= PMAX; p++) for (let h = 1; h <= HMAX; h++) {
      (function (pp, hh) {
        const n = cellNodes[pp + ',' + hh];
        if (n) n.cell.addEventListener('click', () => { if (cellClickCb) cellClickCb(pp, hh, n.cell); });
      })(p, h);
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let p = 1; p <= PMAX; p++) for (let h = 1; h <= HMAX; h++) {
        const n = cellNodes[p + ',' + h];
        if (n) n.cell.classList.toggle('db-clickable', !!cb);
      }
    }

    if (showQ) reset();
    /* The wall column (h=0, p>=1) gets a static "late" tag. */
    for (let p = 1; p <= PMAX; p++) {
      const wn = cellNodes[p + ',0'];
      if (wn && wn.tag) wn.tag.textContent = T('board.late');
    }

    return {
      update, paintPolicy, reset, setSolvedMask, setMarker, flashCell, getCellNode, setOnCellClick, host,
      setState() {}, pulse() {}, flashOutcome() {},
    };
  }

  function fmtQ(v) {
    if (v == null || !isFinite(v)) return EMPTY;
    if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
    return (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
  }

  /* Standalone argmax-count helper over the 16 decision cells. */
  function leverCounts(Q) {
    const c = { wait: 0, send: 0 };
    for (let p = 1; p <= PMAX; p++) for (let h = 1; h <= HMAX; h++) {
      const base = (p * NH + h) * A;
      const w = Q[base], s = Q[base + 1];
      if ((w == null || !isFinite(w)) && (s == null || !isFinite(s))) continue;
      c[(w >= s) ? 'wait' : 'send']++;
    }
    return c;
  }

  window.DockBoard = { mount, leverCounts, tileSvg };
})();

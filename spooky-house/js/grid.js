/* Grid renderer for the Spooky House viz.

   Three layered DOM regions inside the host:
     1. .grid-cells    — per-cell <div>s with optional reward-intensity tone,
                         reward label, V-value, and ghost-density visual
     2. .grid-entities — translated entity sprites (anymal, goal door)
     3. .grid-overlay  — SVG layer for policy arrows / path traces
   Cells inherit their tone via class (.reward-1 .. .reward-9) so theme
   tokens drive the colour. Per-cell content (reward number, V label, ghost
   stack) is built once at mount and toggled via classes / textContent on
   updates — never re-built. Entities are positioned via CSS transform on the
   cell-grid coordinates. */
(function () {
  const SPRITE = {
    /* All sprites use fill="currentColor" so theme tokens drive the colour.
       The anymal sprite is borrowed from the sibling viz for curriculum
       continuity — same agent, new environment. */
    anymal:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="currentColor">' +
          '<rect x="14" y="22" width="36" height="20" rx="6"/>' +
          '<rect x="42" y="14" width="16" height="16" rx="4"/>' +
          '<rect x="16" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="26" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="36" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="46" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="50" y="18" width="4" height="3" rx="1" fill="#fff" opacity="0.85"/>' +
        '</g>' +
      '</svg>',
    /* Smaller ghost glyph used to stack 1..9 silhouettes inside a cell as a
       quick-read "spookiness density" channel alongside the numeric label. */
    ghost:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="currentColor">' +
          '<path d="M12 30a20 20 0 1 1 40 0v22l-6-5-6 5-6-5-6 5-6-5-6 5-4-3z"/>' +
          '<circle cx="25" cy="30" r="3" fill="#fff" opacity="0.9"/>' +
          '<circle cx="39" cy="30" r="3" fill="#fff" opacity="0.9"/>' +
        '</g>' +
      '</svg>',
    /* Goal door — a haunted-door silhouette for the bottom-right cell. */
    door:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="currentColor">' +
          '<path d="M14 8 h36 a2 2 0 0 1 2 2 v44 a2 2 0 0 1 -2 2 h-36 a2 2 0 0 1 -2 -2 v-44 a2 2 0 0 1 2 -2 z"/>' +
          '<rect x="20" y="14" width="24" height="36" rx="2" fill="var(--cell-bg, #f3efe6)"/>' +
          '<rect x="40" y="30" width="3" height="3" rx="0.5"/>' +
        '</g>' +
      '</svg>',
  };

  function mount(host, opts) {
    const M = opts.M;
    const N = opts.N;
    const showRewards = opts.showRewards !== false; /* default: show reward numbers */
    const showGhosts = !!opts.showGhosts;           /* default: hide ghost stacks */
    const rewards = opts.rewards || null;           /* M×N reward matrix */

    host.innerHTML = '';
    host.classList.add('grid-host');
    host.style.setProperty('--rows', String(M));
    host.style.setProperty('--cols', String(N));
    host.style.setProperty('--grid-aspect', `${N} / ${M}`);

    const cellsLayer = document.createElement('div');
    cellsLayer.className = 'grid-cells';
    const cellNodes = [];
    for (let r = 0; r < M; r++) {
      const row = [];
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        if (c === N - 1) cell.classList.add('last-col');
        if (r === M - 1) cell.classList.add('last-row');
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);

        if (rewards) {
          const sp = rewards[r][c];
          cell.classList.add(`reward-${sp}`);
        }

        /* Ghost-density stack (purely visual, optional). */
        if (showGhosts && rewards) {
          const stack = document.createElement('div');
          stack.className = 'cell-ghosts';
          const sp = rewards[r][c];
          for (let k = 0; k < sp; k++) {
            const g = document.createElement('span');
            g.className = 'cell-ghost';
            g.innerHTML = SPRITE.ghost;
            stack.appendChild(g);
          }
          cell.appendChild(stack);
        }

        /* Reward number (top-left badge). */
        if (showRewards && rewards) {
          const rb = document.createElement('div');
          rb.className = 'cell-reward';
          rb.textContent = String(rewards[r][c]);
          cell.appendChild(rb);
        }

        /* V-value slot (centre). Hidden until set. */
        const vSlot = document.createElement('div');
        vSlot.className = 'cell-v';
        cell.appendChild(vSlot);

        /* Per-cell explanation slot (small caption, hidden by default;
           only used by scene 3 sweep). */
        const eSlot = document.createElement('div');
        eSlot.className = 'cell-explain';
        cell.appendChild(eSlot);

        cellsLayer.appendChild(cell);
        row.push({ cell, vSlot, eSlot });
      }
      cellNodes.push(row);
    }
    host.appendChild(cellsLayer);

    /* Entity layer — agent / goal sprites, positioned via CSS transform. */
    const entLayer = document.createElement('div');
    entLayer.className = 'grid-entities';
    host.appendChild(entLayer);

    /* SVG overlay — policy arrows, path traces. */
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.setAttribute('class', 'grid-overlay');
    overlay.setAttribute('preserveAspectRatio', 'none');
    /* viewBox set so 1 unit = 1 cell, matches grid layout exactly. */
    overlay.setAttribute('viewBox', `0 0 ${N} ${M}`);
    host.appendChild(overlay);

    const entities = new Map();

    function cellSize() {
      const rect = host.getBoundingClientRect();
      return { w: rect.width / N, h: rect.height / M };
    }

    function placeEntity(node, r, c) {
      const { w, h } = cellSize();
      node.style.setProperty('--cell-w', `${w}px`);
      node.style.setProperty('--cell-h', `${h}px`);
      node.style.setProperty('--tx', `${c * w}px`);
      node.style.setProperty('--ty', `${r * h}px`);
    }

    function setEntity(id, spec) {
      let node = entities.get(id);
      if (!node) {
        node = document.createElement('div');
        node.className = `entity entity-${spec.kind}`;
        node.dataset.id = id;
        node.innerHTML = SPRITE[spec.kind] || '';
        entLayer.appendChild(node);
        entities.set(id, node);
      } else if (node.dataset.kind !== spec.kind) {
        node.className = `entity entity-${spec.kind}`;
        node.innerHTML = SPRITE[spec.kind] || '';
      }
      node.dataset.kind = spec.kind;
      placeEntity(node, spec.r, spec.c);
      return node;
    }

    function removeEntity(id) {
      const node = entities.get(id);
      if (node) {
        node.remove();
        entities.delete(id);
      }
    }

    function flashEntity(id) {
      const node = entities.get(id);
      if (!node) return;
      node.classList.remove('flash');
      void node.offsetWidth;
      node.classList.add('flash');
    }

    /* ---------- V-value rendering on cells ---------- */
    function setV(r, c, val) {
      const node = cellNodes[r] && cellNodes[r][c];
      if (!node) return;
      if (val == null) {
        node.vSlot.textContent = '';
        node.cell.classList.remove('has-v');
      } else {
        const fmt = Number.isInteger(val) ? String(val) : val.toFixed(2);
        node.vSlot.textContent = fmt;
        node.cell.classList.add('has-v');
      }
    }

    function clearAllV() {
      for (let r = 0; r < M; r++) for (let c = 0; c < N; c++) setV(r, c, null);
    }

    function setExplain(r, c, text) {
      const node = cellNodes[r] && cellNodes[r][c];
      if (!node) return;
      node.eSlot.textContent = text || '';
      if (text) node.cell.classList.add('has-explain');
      else node.cell.classList.remove('has-explain');
    }

    function clearAllExplain() {
      for (let r = 0; r < M; r++) for (let c = 0; c < N; c++) setExplain(r, c, '');
    }

    /* Toggle a class on a single cell. */
    function setCellClass(r, c, cls, on) {
      const node = cellNodes[r] && cellNodes[r][c];
      if (!node) return;
      node.cell.classList.toggle(cls, !!on);
    }

    function clearCellClass(cls) {
      for (let r = 0; r < M; r++) for (let c = 0; c < N; c++) {
        cellNodes[r][c].cell.classList.remove(cls);
      }
    }

    /* ---------- Click handler ---------- */
    function onCellClick(handler) {
      cellsLayer.addEventListener('click', (e) => {
        const cell = e.target.closest('.grid-cell');
        if (!cell || !cellsLayer.contains(cell)) return;
        const r = parseInt(cell.dataset.r, 10);
        const c = parseInt(cell.dataset.c, 10);
        handler({ r, c });
      });
    }

    /* ---------- Policy arrow overlay (SVG) ----------
       drawArrows({ pi: [[{down,right}, ...]], opts: { faded: bool } })
       Tied cells (both flags) are drawn as two muted arrows. Existing
       arrows are wiped first so cold-entry / re-render is idempotent. */
    function drawArrows(pi, options) {
      const opts = options || {};
      const faded = !!opts.faded;
      while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
      if (!pi) return;
      const ns = 'http://www.w3.org/2000/svg';
      for (let r = 0; r < M; r++) {
        for (let c = 0; c < N; c++) {
          const p = pi[r] && pi[r][c];
          if (!p) continue;
          const tied = p.down && p.right;
          if (p.down) {
            const a = makeArrow(ns, c, r, c, r + 1, tied || faded);
            a.setAttribute('class', 'policy-arrow down' + (tied ? ' tied' : ''));
            overlay.appendChild(a);
          }
          if (p.right) {
            const a = makeArrow(ns, c, r, c + 1, r, tied || faded);
            a.setAttribute('class', 'policy-arrow right' + (tied ? ' tied' : ''));
            overlay.appendChild(a);
          }
        }
      }
    }

    /* Build a small arrow line in cell-coords. (cx, cy) = source cell,
       (tx, ty) = target cell. We draw a short segment with an arrowhead
       cap, all in cell units (1 unit = 1 cell), so it auto-scales with
       grid layout. */
    function makeArrow(ns, cx, cy, tx, ty, faded) {
      const g = document.createElementNS(ns, 'g');
      const sx = cx + 0.5, sy = cy + 0.5;
      const ex = tx + 0.5, ey = ty + 0.5;
      const dx = ex - sx, dy = ey - sy;
      /* Pull the head in slightly so it doesn't overlap the next cell's
         centre / numbers. */
      const shorten = 0.34;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const x1 = sx + ux * shorten;
      const y1 = sy + uy * shorten;
      const x2 = ex - ux * shorten;
      const y2 = ey - uy * shorten;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1.toFixed(3));
      line.setAttribute('y1', y1.toFixed(3));
      line.setAttribute('x2', x2.toFixed(3));
      line.setAttribute('y2', y2.toFixed(3));
      line.setAttribute('stroke', 'currentColor');
      line.setAttribute('stroke-width', '0.05');
      line.setAttribute('stroke-linecap', 'round');
      g.appendChild(line);
      /* Arrowhead — small triangle at the tip. */
      const head = document.createElementNS(ns, 'polygon');
      const hx = x2, hy = y2;
      const hLen = 0.13;
      const hWid = 0.08;
      const ax = hx - ux * hLen + uy * hWid;
      const ay = hy - uy * hLen - ux * hWid;
      const bx = hx - ux * hLen - uy * hWid;
      const by = hy - uy * hLen + ux * hWid;
      head.setAttribute('points', `${hx.toFixed(3)},${hy.toFixed(3)} ${ax.toFixed(3)},${ay.toFixed(3)} ${bx.toFixed(3)},${by.toFixed(3)}`);
      head.setAttribute('fill', 'currentColor');
      g.appendChild(head);
      if (faded) g.setAttribute('opacity', '0.45');
      return g;
    }

    /* Trace a path as a polyline overlay. Useful for scene 4. */
    function drawPathTrace(path, opts) {
      const ns = 'http://www.w3.org/2000/svg';
      const cls = (opts && opts.className) || 'path-trace';
      const existing = overlay.querySelector('.' + cls.split(' ')[0]);
      if (existing) existing.remove();
      if (!path || path.length < 2) return;
      const pl = document.createElementNS(ns, 'polyline');
      const pts = path.map(p => `${(p.c + 0.5).toFixed(3)},${(p.r + 0.5).toFixed(3)}`).join(' ');
      pl.setAttribute('points', pts);
      pl.setAttribute('class', cls);
      pl.setAttribute('fill', 'none');
      pl.setAttribute('stroke', 'currentColor');
      pl.setAttribute('stroke-width', '0.06');
      pl.setAttribute('stroke-linecap', 'round');
      pl.setAttribute('stroke-linejoin', 'round');
      overlay.appendChild(pl);
    }

    function clearOverlay() {
      while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    }

    /* ---------- Layout reflow ----------
       Re-place entities when the host resizes, since (--tx, --ty) depend
       on cellSize(). Scenes pass an `onLayout` callback to mount() and
       re-issue their setEntity calls. */
    let onLayout = opts.onLayout;
    const ro = new ResizeObserver(() => {
      if (typeof onLayout === 'function') onLayout();
    });
    ro.observe(host);

    function clear() {
      for (const [, node] of entities) node.remove();
      entities.clear();
      clearOverlay();
    }

    function destroy() {
      ro.disconnect();
      clear();
      host.innerHTML = '';
      host.classList.remove('grid-host');
    }

    return {
      M, N,
      setEntity,
      removeEntity,
      flashEntity,
      cellSize,
      cellNode(r, c) { return cellNodes[r] && cellNodes[r][c]; },
      setV,
      clearAllV,
      setExplain,
      clearAllExplain,
      setCellClass,
      clearCellClass,
      onCellClick,
      drawArrows,
      drawPathTrace,
      clearOverlay,
      overlay,
      cellsLayer,
      clear,
      destroy,
      setOnLayout(fn) { onLayout = fn; },
    };
  }

  window.Grid = { mount, SPRITE };
})();

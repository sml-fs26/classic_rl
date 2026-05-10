/* Vanilla-DOM grid renderer with smooth entity transitions.

   Each scene builds its own grid via `Grid.mount(host, { M, N })`. The grid
   draws cell rules statically and positions entities via CSS transform, so
   moving an entity is a single property update and animates for free. No d3,
   no canvas, no SVG layout — just translated <div>s containing inline SVG
   sprites that pick up entity color via currentColor. */
(function () {
  const SPRITE = {
    /* All sprites use fill="currentColor" so theme tokens drive the color. */
    anymal:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="currentColor">' +
          /* body */
          '<rect x="14" y="22" width="36" height="20" rx="6"/>' +
          /* head */
          '<rect x="42" y="14" width="16" height="16" rx="4"/>' +
          /* legs */
          '<rect x="16" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="26" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="36" y="40" width="6" height="14" rx="2"/>' +
          '<rect x="46" y="40" width="6" height="14" rx="2"/>' +
          /* eye */
          '<rect x="50" y="18" width="4" height="3" rx="1" fill="#fff" opacity="0.85"/>' +
        '</g>' +
      '</svg>',
    ghost:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="currentColor">' +
          '<path d="M12 30a20 20 0 1 1 40 0v22l-6-5-6 5-6-5-6 5-6-5-6 5-4-3z"/>' +
          /* eyes punched out using bg color via mask */
          '<circle cx="25" cy="30" r="3" fill="#fff" opacity="0.9"/>' +
          '<circle cx="39" cy="30" r="3" fill="#fff" opacity="0.9"/>' +
        '</g>' +
      '</svg>',
    star:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<path fill="currentColor" d="M32 6l7.6 15.4 17 2.5-12.3 12 2.9 16.9L32 44.9l-15.2 8 2.9-16.9L7.4 23.9l17-2.5z"/>' +
      '</svg>',
    /* Casino-blue slot machine icon, used on scene 0's recap card. */
    slot:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">' +
          /* body */
          '<rect x="10" y="14" width="44" height="40" rx="3"/>' +
          /* display window */
          '<rect x="16" y="22" width="32" height="14" rx="2"/>' +
          /* divider lines in window */
          '<line x1="27" y1="22" x2="27" y2="36"/>' +
          '<line x1="37" y1="22" x2="37" y2="36"/>' +
          /* arm */
          '<line x1="54" y1="20" x2="60" y2="20"/>' +
        '</g>' +
        '<circle cx="60" cy="20" r="3" fill="currentColor"/>' +
        '<line x1="22" y1="44" x2="42" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
    /* Bellman / γ recap icon: a 2x2 grid hinting at "values across cells". */
    bellman:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="currentColor">' +
          '<rect x="10" y="10" width="20" height="20" rx="1" opacity="0.30"/>' +
          '<rect x="34" y="10" width="20" height="20" rx="1" opacity="0.55"/>' +
          '<rect x="10" y="34" width="20" height="20" rx="1" opacity="0.85"/>' +
          '<rect x="34" y="34" width="20" height="20" rx="1" opacity="0.65"/>' +
        '</g>' +
      '</svg>',
    /* Robbins-Monro / Darts recap icon: a target with a sample mean dot. */
    darts:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<g fill="none" stroke="currentColor" stroke-width="3">' +
          '<circle cx="32" cy="32" r="22"/>' +
          '<circle cx="32" cy="32" r="14"/>' +
          '<circle cx="32" cy="32" r="6"/>' +
        '</g>' +
        '<circle cx="32" cy="32" r="3" fill="currentColor"/>' +
      '</svg>',
  };

  function mount(host, opts) {
    const M = opts.M;
    const N = opts.N;

    host.innerHTML = '';
    host.classList.add('grid-host');
    host.style.setProperty('--rows', String(M));
    host.style.setProperty('--cols', String(N));
    host.style.setProperty('--grid-aspect', `${N} / ${M}`);

    const cells = document.createElement('div');
    cells.className = 'grid-cells';
    const cellByRC = new Map();
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        if (c === N - 1) cell.classList.add('last-col');
        if (r === M - 1) cell.classList.add('last-row');
        cells.appendChild(cell);
        cellByRC.set(r + ',' + c, cell);
      }
    }
    host.appendChild(cells);

    /* Ghost-occupancy underlay layer.
       Sits above the grid-cells (which provide the rules) and below the
       entities. Each cell's `--ghost-occ` CSS variable is the per-cell
       stationary probability (0..1). Style.css turns this into a
       transparent red/purple tint via a `background-image: linear-gradient`. */
    const occ = document.createElement('div');
    occ.className = 'grid-ghost-occ hidden';
    occ.style.position = 'absolute';
    occ.style.inset = '0';
    occ.style.display = 'grid';
    occ.style.gridTemplateRows = `repeat(${M}, 1fr)`;
    occ.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    occ.style.pointerEvents = 'none';
    const occCells = new Map();
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        const oc = document.createElement('div');
        oc.className = 'grid-occ-cell';
        oc.dataset.r = String(r);
        oc.dataset.c = String(c);
        occ.appendChild(oc);
        occCells.set(r + ',' + c, oc);
      }
    }
    host.appendChild(occ);

    const layer = document.createElement('div');
    layer.className = 'grid-entities';
    host.appendChild(layer);

    /* Custom layer for arrows / overlays drawn by scenes. */
    const overlay = document.createElement('div');
    overlay.className = 'grid-overlay';
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
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
        layer.appendChild(node);
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

    function getCellPx(r, c) {
      const { w, h } = cellSize();
      return { x: c * w, y: r * h, w, h };
    }

    function reflow() {
      for (const [, node] of entities) {
        const m = node.style.getPropertyValue('--tx').match(/^([\d.]+)px$/);
        if (m) {
          // re-place using the current cell size while preserving (r,c)
        }
      }
      // Simpler: scenes will call setEntity again after a layout change.
    }

    /* Re-place entities when the host resizes, since (--tx, --ty) depend on
       cellSize(). Scenes pass an `onLayout` callback to mount() and re-issue
       their setEntity calls. */
    let onLayout = opts.onLayout;
    const ro = new ResizeObserver(() => {
      if (typeof onLayout === 'function') onLayout();
    });
    ro.observe(host);

    function clear() {
      for (const [, node] of entities) node.remove();
      entities.clear();
      overlay.innerHTML = '';
    }

    function destroy() {
      ro.disconnect();
      clear();
      host.innerHTML = '';
      host.classList.remove('grid-host');
    }

    /* Public ghost-occupancy API. Pass a 2-D array (M × N) of occupancy
       probabilities in [0, 1]; pass null to hide. */
    function setGhostOccupancy(grid) {
      if (!grid) {
        occ.classList.add('hidden');
        return;
      }
      occ.classList.remove('hidden');
      for (let r = 0; r < M; r++) {
        for (let c = 0; c < N; c++) {
          const oc = occCells.get(r + ',' + c);
          if (!oc) continue;
          const v = (grid[r] && typeof grid[r][c] === 'number') ? grid[r][c] : 0;
          oc.style.setProperty('--ghost-occ', String(Math.max(0, Math.min(1, v))));
        }
      }
    }

    /* Mark a specific cell with a CSS class — used for start/goal annotation. */
    function setCellClass(r, c, cls, on) {
      const cell = cellByRC.get(r + ',' + c);
      if (!cell) return;
      if (on) cell.classList.add(cls);
      else cell.classList.remove(cls);
    }

    /* Pixel rectangle for one cell in viewport coordinates of the host element.
       Used by scene 2's tuple-overlay positioner. */
    function getCellRect(r, c) {
      const { w, h } = cellSize();
      return { x: c * w, y: r * h, w, h };
    }

    /* Click handler hook (scene 4's "click any cell" interaction). */
    function onCellClick(handler) {
      cells.addEventListener('click', (e) => {
        const target = e.target.closest('.grid-cell');
        if (!target) return;
        const r = parseInt(target.dataset.r, 10);
        const c = parseInt(target.dataset.c, 10);
        if (Number.isFinite(r) && Number.isFinite(c)) handler(r, c);
      });
      cells.style.pointerEvents = 'auto';
      cells.style.cursor = 'pointer';
    }

    return {
      M, N,
      setEntity,
      removeEntity,
      flashEntity,
      getCellPx,
      getCellRect,
      cellSize,
      overlay,
      clear,
      destroy,
      setGhostOccupancy,
      setCellClass,
      onCellClick,
      setOnLayout(fn) { onLayout = fn; },
    };
  }

  window.Grid = { mount, SPRITE };
})();

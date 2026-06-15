/* Vanilla-DOM grid renderer with smooth entity transitions.

   Each scene builds its own grid via `Grid.mount(host, { M, N })`. The grid
   draws cell rules statically and positions entities via CSS transform, so
   moving an entity is a single property update and animates for free. No d3,
   no canvas, no SVG layout, just translated <div>s containing inline SVG
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
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        if (c === N - 1) cell.classList.add('last-col');
        if (r === M - 1) cell.classList.add('last-row');
        cells.appendChild(cell);
      }
    }
    host.appendChild(cells);

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

    return {
      M, N,
      setEntity,
      removeEntity,
      flashEntity,
      getCellPx,
      cellSize,
      overlay,
      clear,
      destroy,
      setOnLayout(fn) { onLayout = fn; },
    };
  }

  window.Grid = { mount, SPRITE };
})();

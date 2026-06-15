/* 10×10 boustrophedon Snakes & Ladders board.
 *
 *   Square 1 is bottom-left (visually). Row 0 (the bottom row when rendered)
 *   holds 1..10 left-to-right; row 1 holds 20..11 right-to-left; row 2 holds
 *   21..30 left-to-right; … row 9 (the top row) holds 100..91 right-to-left
 *   with square 100 at the top-left.
 *
 *   The CSS grid lays cells top-to-bottom (DOM order = visual order). So:
 *     gridRow (CSS, 1-indexed from top) = 10 - logicalRow
 *     logicalRow (0-indexed, 0 = bottom)
 *   A square `n` (1..100) maps to:
 *     logicalRow = floor((n - 1) / 10)
 *     within row, idx = (n - 1) mod 10
 *     if logicalRow even: col (0-indexed, 0 = left)  = idx
 *     if logicalRow odd:  col = 9 - idx
 *   Square 100: logicalRow=9 (odd), idx=9, so col = 9 - 9 = 0 (left). Correct.
 *
 *   The board exposes:
 *     mount(host) → { setToken(n, opts), drawJumps(snakes, ladders),
 *                     onCellClick(handler), squareCenterPx(n),
 *                     setCellBadge(n, html), clearBadges(),
 *                     setCellLabel(n, html), clearLabels() }
 *   Token positioning uses an SVG <g> overlay so we can animate along arbitrary
 *   paths (a ladder, a snake) without fighting CSS grid layout.
 */
(function () {
  function squareToRC(n) {
    if (n < 1 || n > 100) throw new Error('square out of range: ' + n);
    const lrow = Math.floor((n - 1) / 10);
    const idx = (n - 1) % 10;
    const col = (lrow % 2 === 0) ? idx : (9 - idx);
    return { lrow, col };
  }

  /* Convert logical (lrow, col) → CSS grid (row, col) 1-indexed from top.
     gridRow = 10 - lrow. */
  function rcToGrid(lrow, col) {
    return { gridRow: 10 - lrow, gridCol: col + 1 };
  }

  /* Pixel center of square n in the board's local coordinate space (0..W, 0..H).
     `boardSize` is the inner side length in px (assumes square board). */
  function centerPx(n, boardSize) {
    const { lrow, col } = squareToRC(n);
    const cellSize = boardSize / 10;
    /* CSS row index counts top-down; logical lrow counts bottom-up. */
    const cssRow = 9 - lrow; /* 0-indexed top-down */
    return {
      x: (col + 0.5) * cellSize,
      y: (cssRow + 0.5) * cellSize,
    };
  }

  function mount(host) {
    host.innerHTML = '';
    host.classList.add('board-host');

    /* Outer wrapper keeps the aspect ratio square. */
    const wrap = document.createElement('div');
    wrap.className = 'board-wrap';
    host.appendChild(wrap);

    /* Cells layer (CSS grid; bottom row is the visual bottom). */
    const cells = document.createElement('div');
    cells.className = 'board-cells';
    wrap.appendChild(cells);

    const cellByN = new Map();
    for (let n = 100; n >= 1; n--) {
      /* iterate in CSS DOM order (top-down, row-major), we still index by n,
         but the appendChild order maps the cells onto the visual rows. */
    }
    /* Walk top-down rows (lrow = 9, 8, ..., 0). For lrow=9 (top, odd), the
       cells in DOM left-to-right correspond to squares 100..91. For lrow=8
       (even), DOM left-to-right is 81..90. Etc. */
    for (let lrow = 9; lrow >= 0; lrow--) {
      for (let col = 0; col < 10; col++) {
        const idx = (lrow % 2 === 0) ? col : (9 - col);
        const n = lrow * 10 + idx + 1;
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.n = String(n);
        cell.dataset.lrow = String(lrow);
        cell.dataset.col = String(col);

        const lbl = document.createElement('div');
        lbl.className = 'cell-number';
        lbl.textContent = String(n);
        cell.appendChild(lbl);

        const badge = document.createElement('div');
        badge.className = 'cell-badge';
        cell.appendChild(badge);

        const txt = document.createElement('div');
        txt.className = 'cell-text';
        cell.appendChild(txt);

        cells.appendChild(cell);
        cellByN.set(n, { cell, badge, text: txt, lbl });
      }
    }

    /* SVG overlay for snakes, ladders, and the token. Uses a 1000×1000
       internal coordinate system; CSS scales it to the board's pixel size. */
    const SVG_SIZE = 1000;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('board-svg');
    svg.setAttribute('viewBox', `0 0 ${SVG_SIZE} ${SVG_SIZE}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    wrap.appendChild(svg);

    /* Layers within the SVG, in z-order: jumps (snakes + ladders) under token. */
    const jumpsLayer = document.createElementNS(svgNS, 'g');
    jumpsLayer.setAttribute('class', 'jumps-layer');
    svg.appendChild(jumpsLayer);

    const tokenLayer = document.createElementNS(svgNS, 'g');
    tokenLayer.setAttribute('class', 'token-layer');
    svg.appendChild(tokenLayer);

    /* Helper: pixel center of square n in SVG coordinates (0..SVG_SIZE). */
    function svgCenter(n) {
      return centerPx(n, SVG_SIZE);
    }

    /* Draw the static snake & ladder paths once. */
    function drawJumps(snakes, ladders) {
      jumpsLayer.innerHTML = '';

      /* Ladders, two parallel rails plus rungs. */
      for (const [from, to] of ladders || []) {
        const a = svgCenter(from);
        const b = svgCenter(to);
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        /* Perpendicular offset for rails. */
        const nx = -dy / len, ny = dx / len;
        const off = 14; /* half-width of ladder in SVG units */

        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('class', 'ladder');

        for (const sgn of [-1, 1]) {
          const rail = document.createElementNS(svgNS, 'line');
          rail.setAttribute('x1', a.x + sgn * off * nx);
          rail.setAttribute('y1', a.y + sgn * off * ny);
          rail.setAttribute('x2', b.x + sgn * off * nx);
          rail.setAttribute('y2', b.y + sgn * off * ny);
          rail.setAttribute('class', 'ladder-rail');
          g.appendChild(rail);
        }

        /* Rungs every ~50 SVG units. */
        const nRungs = Math.max(2, Math.round(len / 55));
        for (let i = 1; i < nRungs; i++) {
          const t = i / nRungs;
          const mx = a.x + dx * t;
          const my = a.y + dy * t;
          const r1x = mx + off * nx, r1y = my + off * ny;
          const r2x = mx - off * nx, r2y = my - off * ny;
          const rung = document.createElementNS(svgNS, 'line');
          rung.setAttribute('x1', r1x);
          rung.setAttribute('y1', r1y);
          rung.setAttribute('x2', r2x);
          rung.setAttribute('y2', r2y);
          rung.setAttribute('class', 'ladder-rung');
          g.appendChild(rung);
        }

        /* Foot + top markers. */
        const foot = document.createElementNS(svgNS, 'circle');
        foot.setAttribute('cx', a.x);
        foot.setAttribute('cy', a.y);
        foot.setAttribute('r', 9);
        foot.setAttribute('class', 'ladder-end');
        g.appendChild(foot);
        const top = document.createElementNS(svgNS, 'circle');
        top.setAttribute('cx', b.x);
        top.setAttribute('cy', b.y);
        top.setAttribute('r', 9);
        top.setAttribute('class', 'ladder-end');
        g.appendChild(top);

        jumpsLayer.appendChild(g);
      }

      /* Snakes, curved path from head (high square) to tail (low square). */
      for (const [from, to] of snakes || []) {
        const head = svgCenter(from); /* high square, snake's head */
        const tail = svgCenter(to);
        const dx = tail.x - head.x, dy = tail.y - head.y;
        const len = Math.hypot(dx, dy) || 1;
        /* Perpendicular for the curve's bulge. */
        const nx = -dy / len, ny = dx / len;
        const bulge = Math.min(60, len * 0.20);

        /* Two control points: 1/3 and 2/3 along, displaced on opposite sides
           for an S-curve. */
        const c1x = head.x + dx * 0.33 + bulge * nx;
        const c1y = head.y + dy * 0.33 + bulge * ny;
        const c2x = head.x + dx * 0.66 - bulge * nx;
        const c2y = head.y + dy * 0.66 - bulge * ny;

        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('class', 'snake');

        /* Snake body, thick curved path. */
        const body = document.createElementNS(svgNS, 'path');
        const d = `M ${head.x} ${head.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${tail.x} ${tail.y}`;
        body.setAttribute('d', d);
        body.setAttribute('class', 'snake-body');
        body.dataset.from = String(from);
        body.dataset.to = String(to);
        g.appendChild(body);

        /* Head, slightly larger circle. */
        const headDot = document.createElementNS(svgNS, 'circle');
        headDot.setAttribute('cx', head.x);
        headDot.setAttribute('cy', head.y);
        headDot.setAttribute('r', 13);
        headDot.setAttribute('class', 'snake-head');
        g.appendChild(headDot);

        /* Tail, smaller marker. */
        const tailDot = document.createElementNS(svgNS, 'circle');
        tailDot.setAttribute('cx', tail.x);
        tailDot.setAttribute('cy', tail.y);
        tailDot.setAttribute('r', 6);
        tailDot.setAttribute('class', 'snake-tail');
        g.appendChild(tailDot);

        jumpsLayer.appendChild(g);
      }
    }

    /*, Token rendering, */
    const TOKEN_R = 22; /* token radius in SVG units */

    const tokenGroup = document.createElementNS(svgNS, 'g');
    tokenGroup.setAttribute('class', 'token-group');
    tokenLayer.appendChild(tokenGroup);

    /* Outer ring */
    const tokenRing = document.createElementNS(svgNS, 'circle');
    tokenRing.setAttribute('r', TOKEN_R);
    tokenRing.setAttribute('class', 'token-ring');
    tokenGroup.appendChild(tokenRing);

    /* Inner solid body */
    const tokenBody = document.createElementNS(svgNS, 'circle');
    tokenBody.setAttribute('r', TOKEN_R - 4);
    tokenBody.setAttribute('class', 'token-body');
    tokenGroup.appendChild(tokenBody);

    let currentSquare = 1;
    let tokenVisible = true;

    function placeTokenAt(n, opts) {
      currentSquare = n;
      const c = svgCenter(n);
      const animate = opts && opts.animate;
      if (animate) {
        tokenGroup.style.transition = `transform ${opts.duration || 300}ms cubic-bezier(.4,.05,.2,1)`;
      } else {
        tokenGroup.style.transition = 'none';
      }
      tokenGroup.setAttribute('transform', `translate(${c.x}, ${c.y})`);
    }

    /* Animate the token along an arbitrary SVG path string. Used by scene 1
       to glide along snakes and ladders. The animation uses CSS transition
       on transform, hopping to a sequence of way-points. */
    async function animatePath(waypoints, opts) {
      const o = opts || {};
      const dur = o.duration || 360;
      for (let i = 0; i < waypoints.length; i++) {
        const n = waypoints[i];
        await new Promise(res => {
          tokenGroup.style.transition = `transform ${dur}ms cubic-bezier(.4,.05,.2,1)`;
          const c = svgCenter(n);
          tokenGroup.setAttribute('transform', `translate(${c.x}, ${c.y})`);
          /* Wait for transition end via timeout; transitionend on SVG attrs
             isn't reliably fired across browsers when the property is set via
             setAttribute. */
          setTimeout(res, dur + 20);
        });
      }
      currentSquare = waypoints[waypoints.length - 1];
    }

    /* Place token immediately without animating. */
    placeTokenAt(1, { animate: false });

    function setTokenVisible(v) {
      tokenVisible = !!v;
      tokenGroup.style.display = tokenVisible ? '' : 'none';
    }

    /*, Cell badges (per-square argmax-die markers), */
    function setCellBadge(n, html) {
      const c = cellByN.get(n);
      if (!c) return;
      c.badge.innerHTML = html || '';
    }
    function clearBadges() {
      for (const [, c] of cellByN) c.badge.innerHTML = '';
    }

    /*, Cell value labels (V-values during iteration), */
    function setCellLabel(n, html) {
      const c = cellByN.get(n);
      if (!c) return;
      c.text.innerHTML = html || '';
    }
    function clearLabels() {
      for (const [, c] of cellByN) c.text.innerHTML = '';
    }

    /*, Cell highlight (for selection in scene 4), */
    function highlightCell(n) {
      for (const [, c] of cellByN) c.cell.classList.remove('selected');
      if (!n) return;
      const c = cellByN.get(n);
      if (c) c.cell.classList.add('selected');
    }

    function flashCell(n) {
      const c = cellByN.get(n);
      if (!c) return;
      c.cell.classList.remove('cell-flash');
      void c.cell.offsetWidth;
      c.cell.classList.add('cell-flash');
    }

    function onCellClick(handler) {
      cells.addEventListener('click', (e) => {
        const target = e.target.closest('.board-cell');
        if (!target) return;
        const n = parseInt(target.dataset.n, 10);
        if (Number.isFinite(n)) handler(n);
      });
      cells.style.cursor = 'pointer';
    }

    return {
      setToken: placeTokenAt,
      animateTokenPath: animatePath,
      setTokenVisible,
      drawJumps,
      setCellBadge,
      clearBadges,
      setCellLabel,
      clearLabels,
      highlightCell,
      flashCell,
      onCellClick,
      squareCenterPx: svgCenter,
      get currentSquare() { return currentSquare; },
      cellByN,
    };
  }

  window.Board = { mount, squareToRC, rcToGrid, centerPx };
})();

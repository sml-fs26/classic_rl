/* caveboard.js, the 5x5 CAVE FLOOR PLAN widget (the analog of qladder.js).
 *
 *   The recurring state-icon AND the whole value/policy board, one object.
 *   25 stone tiles in a top-down dungeon view: the GOLD chest at (0,4), the
 *   PIT at (2,2), a START flag at (4,0), and a glowing EXPLORER token on the
 *   current tile. Overlays (toggled per scene):
 *     - ARROW overlay: one big arrow per tile = the optimal/shown heading.
 *       Genuine exact-tie tiles also draw a faint secondary arrow.
 *     - VALUE overlay: V* (or Q*) painted on each tile, colour-ramped
 *       cold(blue, near -10) -> warm(gold, near +10) so the basin of safety
 *       around the gold and the danger crater around the pit read at a glance.
 *
 *   mount(host, opts) -> handle {
 *     setExplorer(r, c | null)   place / move the explorer token
 *     pulse(r, c)                brief emphasis on a tile
 *     gust(r, c, dir, headingId) blow leaves across a tile in the shove dir
 *     flashTerminal('gold'|'pit')burst on the terminal tile
 *     shake()                    screen-shake (a pit fall)
 *     sparkle()                  gold sparkle (a win)
 *     setArrows(grid, opts)      paint per-tile arrows (grid[r][c] = id|null);
 *                                opts.ties = 5x5 arrays of tied headings
 *     setValues(grid, opts)      paint per-tile values (grid[r][c] = num|null)
 *     clearArrows() / clearValues()
 *     setSolved(maskGrid)        dim un-solved tiles (DP fill); null = all on
 *     highlight(r, c, bool)      outline a tile (inspected)
 *     setOnTileClick(cb)         make tiles clickable -> cb(r, c, el)
 *     tileEl(r, c)               the tile element
 *     host
 *   }
 *     opts.size: 'sm' | 'md' | 'lg'  (tile size class)
 *     opts.showSprites: draw gold/pit/start/explorer art (default true)
 *
 *   Theme-agnostic: every colour comes from CSS tokens. Styles live in
 *   css/caveboard.css. Reads window.Cave for geometry + window.Actions for
 *   arrows / perpendiculars. */
(function () {
  const C = window.Cave;
  const Actions = window.Actions;
  const ROWS = C.ROWS, COLS = C.COLS;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Heat ramp: map a value in [-10, +10] to one of 7 buckets (cold->warm).
     Uses CSS classes heat--3..heat3 (negative = cold blue, positive = warm
     gold), plus distinct hues for the terminals so a merely-low tile never
     reads as pit-level danger. */
  function heatClass(v) {
    if (v == null) return 'heat0';
    if (v <= -8) return 'heatn3';
    if (v <= -3) return 'heatn2';
    if (v < -0.3) return 'heatn1';
    if (v < 1.5) return 'heat0';
    if (v < 4)   return 'heat1';
    if (v < 7)   return 'heat2';
    return 'heat3';
  }
  const ALL_HEAT = ['heatn3', 'heatn2', 'heatn1', 'heat0', 'heat1', 'heat2', 'heat3'];

  /* Pixel sprite art as inline SVG (currentColor + token vars). Chunky, low-res
     so it reads as pixel-art at any tile size. */
  function goldSvg() {
    return '<svg viewBox="0 0 16 16" class="cb-art cb-gold-art" aria-hidden="true">' +
      '<rect x="2" y="6" width="12" height="8" fill="var(--gold)" stroke="var(--gold-rule)" stroke-width="1"/>' +
      '<rect x="2" y="4" width="12" height="3" fill="var(--gold-rule)"/>' +
      '<rect x="7" y="8" width="2" height="4" fill="var(--gold-rule)"/>' +
      '<rect x="4" y="2" width="2" height="2" fill="var(--gold)"/>' +
      '<rect x="10" y="2" width="2" height="2" fill="var(--gold)"/>' +
      '<rect x="7" y="1" width="2" height="2" fill="var(--gold)"/></svg>';
  }
  function pitSvg() {
    return '<svg viewBox="0 0 16 16" class="cb-art cb-pit-art" aria-hidden="true">' +
      '<rect x="1" y="1" width="14" height="14" fill="var(--pit)"/>' +
      '<polygon points="3,3 6,2 5,5 8,4 7,7 10,6 9,9 13,8 12,12 8,13 9,10 6,11 7,8 4,9 5,6 2,7" fill="var(--pit-edge)"/>' +
      '<rect x="6" y="6" width="4" height="4" fill="#000"/></svg>';
  }
  function flagSvg() {
    return '<svg viewBox="0 0 16 16" class="cb-art cb-flag-art" aria-hidden="true">' +
      '<rect x="4" y="2" width="1.6" height="12" fill="var(--ink-secondary)"/>' +
      '<polygon points="5.6,2 13,4 5.6,6.5" fill="var(--flag)"/></svg>';
  }
  function explorerSvg() {
    return '<svg viewBox="0 0 16 16" class="cb-art cb-explorer-art" aria-hidden="true">' +
      '<rect x="6" y="2" width="4" height="3" fill="var(--explorer-skin)"/>' +        /* head */
      '<rect x="5" y="1" width="6" height="1.5" fill="var(--explorer-hat)"/>' +        /* hat */
      '<rect x="5" y="5" width="6" height="6" fill="var(--explorer-body)" stroke="var(--explorer-rule)" stroke-width="0.7"/>' +
      '<rect x="6" y="11" width="1.6" height="3" fill="var(--explorer-rule)"/>' +
      '<rect x="8.4" y="11" width="1.6" height="3" fill="var(--explorer-rule)"/>' +
      '<rect x="11" y="4" width="1.4" height="6" fill="var(--explorer-rule)"/>' +      /* torch stick */
      '<rect x="10.6" y="2.5" width="2.2" height="2.2" fill="var(--token)" class="cb-torch-flame"/></svg>';  /* flame */
  }

  function leafGlyph() {
    return '<span class="cb-leaf">&#10047;</span>';   /* a small floral/leaf glyph */
  }

  function mount(host, opts) {
    const o = opts || {};
    const size = o.size || 'md';
    const showSprites = o.showSprites !== false;
    host.classList.add('caveboard', 'cb-' + size);
    if (o.compact) host.classList.add('cb-compact');
    host.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'cb-grid';
    host.appendChild(grid);

    const tileNodes = [];   // [r][c] -> { tile, arrow, arrow2, val, sprite }
    for (let r = 0; r < ROWS; r++) {
      tileNodes[r] = [];
      for (let c = 0; c < COLS; c++) {
        const tile = document.createElement('div');
        tile.className = 'cb-tile';
        tile.dataset.r = String(r); tile.dataset.c = String(c);
        if ((r + c) % 2 === 0) tile.classList.add('cb-tile-a'); else tile.classList.add('cb-tile-b');

        let spriteHtml = '';
        if (showSprites) {
          if (C.isGold(r, c)) { tile.classList.add('cb-gold'); spriteHtml = goldSvg(); }
          else if (C.isPit(r, c)) { tile.classList.add('cb-pit'); spriteHtml = pitSvg(); }
          else if (r === C.START.row && c === C.START.col) { tile.classList.add('cb-start'); spriteHtml = flagSvg(); }
        } else {
          if (C.isGold(r, c)) tile.classList.add('cb-gold');
          else if (C.isPit(r, c)) tile.classList.add('cb-pit');
        }

        tile.innerHTML =
          '<span class="cb-val"></span>' +
          '<span class="cb-arrow cb-arrow2"></span>' +
          '<span class="cb-arrow cb-arrow1"></span>' +
          '<span class="cb-sprite">' + spriteHtml + '</span>' +
          '<span class="cb-explorer" hidden>' + explorerSvg() + '</span>' +
          '<span class="cb-leaves" aria-hidden="true"></span>';
        grid.appendChild(tile);
        tileNodes[r][c] = {
          tile,
          arrow1: tile.querySelector('.cb-arrow1'),
          arrow2: tile.querySelector('.cb-arrow2'),
          val: tile.querySelector('.cb-val'),
          explorer: tile.querySelector('.cb-explorer'),
          leaves: tile.querySelector('.cb-leaves'),
        };
      }
    }

    let curExplorer = null;
    let tileClickCb = null;

    function setExplorer(r, c) {
      if (curExplorer) {
        const n = tileNodes[curExplorer[0]][curExplorer[1]];
        n.explorer.hidden = true; n.tile.classList.remove('cb-has-explorer');
      }
      if (r == null || c == null) { curExplorer = null; return; }
      curExplorer = [r, c];
      const n = tileNodes[r][c];
      n.explorer.hidden = false; n.tile.classList.add('cb-has-explorer');
    }
    function pulse(r, c) {
      if (r == null) { if (curExplorer) { r = curExplorer[0]; c = curExplorer[1]; } else return; }
      const el = tileNodes[r][c].tile;
      el.classList.remove('cb-pulse'); void el.offsetWidth; el.classList.add('cb-pulse');
      setTimeout(() => el.classList.remove('cb-pulse'), 700);
    }

    /* Blow translucent leaves across a tile in the shove direction. dir is the
       wind outcome ('main'|'left'|'right'); headingId resolves the actual
       on-screen displacement so the leaves streak the way you were shoved. */
    function gust(r, c, dir, headingId) {
      const n = tileNodes[r][c];
      if (!n) return;
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      let dr = 0, dc = 0;
      if (dir === 'main') { const v = Actions.vecOf(headingId); dr = v[0]; dc = v[1]; }
      else { const p = Actions.perpOf(headingId); const d = dir === 'left' ? p.left : p.right; dr = d[0]; dc = d[1]; }
      n.leaves.style.setProperty('--gx', dc);
      n.leaves.style.setProperty('--gy', dr);
      n.leaves.innerHTML = leafGlyph() + leafGlyph() + leafGlyph();
      if (reduced) { setTimeout(() => { n.leaves.innerHTML = ''; }, 60); return; }
      n.leaves.classList.remove('cb-blowing'); void n.leaves.offsetWidth; n.leaves.classList.add('cb-blowing');
      setTimeout(() => { n.leaves.classList.remove('cb-blowing'); n.leaves.innerHTML = ''; }, 760);
    }

    function flashTerminal(which) {
      const t = which === 'gold' ? { r: C.GOLD.row, c: C.GOLD.col } : { r: C.PIT.row, c: C.PIT.col };
      const el = tileNodes[t.r][t.c].tile;
      el.classList.remove('cb-term-flash'); void el.offsetWidth; el.classList.add('cb-term-flash');
      setTimeout(() => el.classList.remove('cb-term-flash'), 1100);
    }
    function sparkle() { flashTerminal('gold'); host.classList.remove('cb-sparkle'); void host.offsetWidth; host.classList.add('cb-sparkle'); setTimeout(() => host.classList.remove('cb-sparkle'), 900); }
    function shake() {
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced) return;
      host.classList.remove('cb-shake'); void host.offsetWidth; host.classList.add('cb-shake');
      setTimeout(() => host.classList.remove('cb-shake'), 520);
    }

    /* Paint per-tile arrows. grid[r][c] = headingId | null (null = no arrow /
       terminal). opts.ties = 5x5 of arrays of tied headings -> a faint
       secondary arrow when there are exactly 2 optimal headings. opts.animate
       staggers a flip-in per tile (the DP "lock-in"). */
    function setArrows(arrowGrid, opt) {
      const oo = opt || {};
      host.classList.add('cb-show-arrows');
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const n = tileNodes[r][c];
        if (C.isTerminalRC(r, c)) { n.arrow1.textContent = ''; n.arrow2.textContent = ''; continue; }
        const id = arrowGrid && arrowGrid[r] ? arrowGrid[r][c] : null;
        n.arrow1.textContent = id ? Actions.arrowOf(id) : '';
        n.arrow1.className = 'cb-arrow cb-arrow1' + (id ? ' dir-' + id : '');
        /* secondary (tie) arrow */
        let second = '';
        if (oo.ties && oo.ties[r] && oo.ties[r][c] && oo.ties[r][c].length === 2) {
          const other = oo.ties[r][c].find(x => x !== id);
          if (other) second = Actions.arrowOf(other);
        }
        n.arrow2.textContent = second;
        n.tile.classList.toggle('cb-tie', !!second);
        if (oo.animate && id) {
          const d = (r + c) * 40;
          (function (el, delay) {
            setTimeout(() => { el.classList.remove('cb-arrow-pop'); void el.offsetWidth; el.classList.add('cb-arrow-pop'); setTimeout(() => el.classList.remove('cb-arrow-pop'), 600); }, delay);
          })(n.arrow1, d);
        }
      }
    }
    function clearArrows() {
      host.classList.remove('cb-show-arrows');
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        tileNodes[r][c].arrow1.textContent = ''; tileNodes[r][c].arrow2.textContent = '';
        tileNodes[r][c].tile.classList.remove('cb-tie');
      }
    }

    /* Paint per-tile values with the heat ramp. grid[r][c] = number | null. */
    function setValues(valGrid, opt) {
      const oo = opt || {};
      host.classList.add('cb-show-values');
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const n = tileNodes[r][c];
        for (const h of ALL_HEAT) n.tile.classList.remove(h);
        if (C.isGold(r, c)) { n.val.textContent = oo.terminalLabels === false ? '' : ('+' + C.GOLD_R); continue; }
        if (C.isPit(r, c))  { n.val.textContent = oo.terminalLabels === false ? '' : ('' + C.PIT_R); continue; }
        const v = valGrid && valGrid[r] ? valGrid[r][c] : null;
        if (v == null) { n.val.textContent = ''; continue; }
        n.val.textContent = (oo.decimals === 0) ? String(Math.round(v)) : v.toFixed(1);
        n.tile.classList.add(heatClass(v));
      }
    }
    function clearValues() {
      host.classList.remove('cb-show-values');
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const n = tileNodes[r][c];
        n.val.textContent = '';
        for (const h of ALL_HEAT) n.tile.classList.remove(h);
      }
    }

    /* Dim un-solved tiles for the DP fill. maskGrid[r][c] = bool (true=solved);
       null clears the dimming (all on). */
    function setSolved(maskGrid) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (C.isTerminalRC(r, c)) continue;
        const solved = maskGrid == null ? true : !!(maskGrid[r] && maskGrid[r][c]);
        tileNodes[r][c].tile.classList.toggle('cb-pending', !solved);
      }
    }
    function highlight(r, c, on) {
      const n = tileNodes[r] && tileNodes[r][c];
      if (n) n.tile.classList.toggle('cb-highlight', !!on);
    }
    function clearHighlights() {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) tileNodes[r][c].tile.classList.remove('cb-highlight');
    }
    function tileEl(r, c) { return tileNodes[r] && tileNodes[r][c] ? tileNodes[r][c].tile : null; }

    /* click wiring */
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      (function (rr, cc) {
        tileNodes[rr][cc].tile.addEventListener('click', () => { if (tileClickCb) tileClickCb(rr, cc, tileNodes[rr][cc].tile); });
      })(r, c);
    }
    function setOnTileClick(cb) {
      tileClickCb = cb;
      host.classList.toggle('cb-clickable', !!cb);
    }

    return {
      setExplorer, pulse, gust, flashTerminal, sparkle, shake,
      setArrows, clearArrows, setValues, clearValues, setSolved,
      highlight, clearHighlights, setOnTileClick, tileEl, host,
    };
  }

  window.CaveBoard = { mount, heatClass };
})();

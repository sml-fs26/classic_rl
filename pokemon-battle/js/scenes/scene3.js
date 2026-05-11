/* Scene 3 — γ as patience.
 *
 * Same 3×3 state grid as scene 2, but with a γ slider that snaps to the
 * 7 precomputed γ values.  Dragging it re-renders the converged V and the
 * optimal move per state.  An annotation strip below shows the policy mix
 * (move counts across the 9 states) at the current γ.
 *
 * The slider value-display reads "▶ γ: 0.90" — Pokemon menu style.
 */
(function () {
  window.scenes = window.scenes || {};

  const BUCKETS = ['full', 'mid', 'low'];
  const GAMMA_GRID = window.DATA.params.gammaGrid.slice().sort((a, b) => a - b);
  const DEFAULT_GAMMA = window.DATA.params.gammaDefault;

  function moveShort(id) {
    return window.QTable && window.QTable.shortMoveLabel
      ? window.QTable.shortMoveLabel(id) : id;
  }

  function snapToGrid(value) {
    let best = GAMMA_GRID[0], bestD = Infinity;
    for (const g of GAMMA_GRID) {
      const d = Math.abs(g - value);
      if (d < bestD) { bestD = d; best = g; }
    }
    return best;
  }

  window.scenes.scene3 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'poke-section-title';
    heading.textContent = 'γ AS PATIENCE — POLICY SHIFTS WITH THE DISCOUNT';
    root.appendChild(heading);

    /* Slider as a Pokemon-menu row. */
    const sliderRow = document.createElement('div');
    sliderRow.className = 'poke-menu-row sc3-gamma';
    sliderRow.innerHTML =
      '<span class="sc3-gamma-label">γ</span>' +
      '<input type="range" id="sc3-gamma" min="0" max="' + (GAMMA_GRID.length - 1) + '" step="1" value="' + GAMMA_GRID.indexOf(DEFAULT_GAMMA) + '">' +
      '<output id="sc3-gamma-val">' + DEFAULT_GAMMA.toFixed(2) + '</output>';
    root.appendChild(sliderRow);

    /* The 3×3 grid. */
    const gridWrap = document.createElement('div');
    gridWrap.className = 'sc3-grid-wrap';
    root.appendChild(gridWrap);

    const grid = document.createElement('div');
    grid.className = 'state-grid';
    gridWrap.appendChild(grid);
    const corner = document.createElement('div');
    corner.className = 'axis-corner';
    corner.innerHTML = 'YOUR HP<br>vs OPP HP';
    grid.appendChild(corner);
    for (const b of BUCKETS) {
      const lbl = document.createElement('div');
      lbl.className = 'axis-label col';
      lbl.textContent = b.toUpperCase();
      grid.appendChild(lbl);
    }
    const cellMap = {};
    for (const y of BUCKETS) {
      const rl = document.createElement('div');
      rl.className = 'row-label';
      rl.textContent = y.toUpperCase();
      grid.appendChild(rl);
      for (const o of BUCKETS) {
        const c = document.createElement('div');
        c.className = 'state-cell';
        c.innerHTML = '<span class="v-val">0.00</span><span class="v-move">—</span>';
        grid.appendChild(c);
        cellMap[y + '|' + o] = c;
      }
    }

    /* Policy-mix annotation strip. */
    const mix = document.createElement('div');
    mix.className = 'hud-strip sc3-mix';
    root.appendChild(mix);

    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.innerHTML =
      "<span class=\"comp-bellman\">γ low (impatient)</span> values the kill right now — Thunder, even with its miss risk.  " +
      "<span class=\"comp-bellman\">γ high (patient)</span> values reliable progress — Thunderbolt, slow but certain.  " +
      "Watch the (MID, MID) cell: it crosses over between γ=0.50 and γ=0.70.";
    root.appendChild(caption);

    function render(gamma) {
      const key = gamma.toFixed(2);
      const V = window.DATA.valueIteration.V[key];
      const policy = window.DATA.valueIteration.policy[key];
      for (let i = 0; i < 9; i++) {
        const yi = Math.floor(i / 3), oi = i % 3;
        const cell = cellMap[BUCKETS[yi] + '|' + BUCKETS[oi]];
        const valEl = cell.querySelector('.v-val');
        const moveEl = cell.querySelector('.v-move');
        const prev = valEl.textContent;
        valEl.textContent = V[i].toFixed(2);
        moveEl.textContent = moveShort(policy[i]);
        if (prev !== valEl.textContent) {
          cell.classList.remove('flash');
          void cell.offsetWidth;
          cell.classList.add('flash');
        }
      }
      /* Mix strip */
      const counts = {};
      for (const m of window.Moves.MOVE_IDS) counts[m] = 0;
      for (let i = 0; i < 9; i++) counts[policy[i]] = (counts[policy[i]] || 0) + 1;
      mix.innerHTML = '<div class="hud-item"><div class="hud-label">POLICY MIX</div></div>' +
        window.Moves.MOVE_IDS.map(m => {
          const c = counts[m] || 0;
          if (c === 0) return '<div class="hud-item"><div class="hud-label">' + moveShort(m) + '</div><div class="hud-val sc3-mix-val zero">0</div></div>';
          return '<div class="hud-item"><div class="hud-label">' + moveShort(m) + '</div><div class="hud-val sc3-mix-val">' + c + '</div></div>';
        }).join('');
    }

    const slider = sliderRow.querySelector('#sc3-gamma');
    const valOut = sliderRow.querySelector('#sc3-gamma-val');
    slider.addEventListener('input', () => {
      const g = GAMMA_GRID[parseInt(slider.value, 10)];
      valOut.textContent = g.toFixed(2);
      render(g);
    });

    /* Default. */
    render(DEFAULT_GAMMA);

    return {
      onEnter() {
        /* Re-render in case data has been mutated by another scene. */
        const g = GAMMA_GRID[parseInt(slider.value, 10)];
        render(g);
      },
      onNextKey() {
        const i = parseInt(slider.value, 10);
        if (i < GAMMA_GRID.length - 1) {
          slider.value = String(i + 1);
          const g = GAMMA_GRID[i + 1];
          valOut.textContent = g.toFixed(2);
          render(g);
          return true;
        }
        return false;
      },
      onPrevKey() {
        const i = parseInt(slider.value, 10);
        if (i > 0) {
          slider.value = String(i - 1);
          const g = GAMMA_GRID[i - 1];
          valOut.textContent = g.toFixed(2);
          render(g);
          return true;
        }
        return false;
      },
    };
  };
})();

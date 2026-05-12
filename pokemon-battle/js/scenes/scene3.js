/* Scene 3 — γ as patience.
 *
 *   Same NB × NB state grid as scene 2, but with a γ slider that snaps to the
 *   precomputed γ grid (typically 7 values from 0.30 → 0.99). Dragging it
 *   re-renders the converged V and the optimal move per state. An annotation
 *   strip below shows the policy mix at the current γ.
 *
 *   With the 5-bucket model the policy shift between low and high γ is much
 *   more visible than in the old 3-bucket version — across ~6 cells move
 *   between Thunder and Thunderbolt as γ moves from 0.30 to 0.99.
 */
(function () {
  window.scenes = window.scenes || {};

  const BUCKETS = window.DATA.buckets;
  const NB = BUCKETS.length;
  const N = NB * NB;
  const GAMMA_GRID = window.DATA.params.gammaGrid.slice().sort((a, b) => a - b);
  const DEFAULT_GAMMA = window.DATA.params.gammaDefault;

  function moveShort(id) {
    return window.QTable && window.QTable.shortMoveLabel
      ? window.QTable.shortMoveLabel(id) : id;
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

    /* The NB × NB grid with Pokemon axis sprites (same pattern as scene 2). */
    const gridWrap = document.createElement('div');
    gridWrap.className = 'sc3-grid-wrap sc2-grid-block';
    root.appendChild(gridWrap);

    /* Top axis: Charmander → columns vary opp HP. */
    const axisTop = document.createElement('div');
    axisTop.className = 'vi-axis-top';
    axisTop.innerHTML =
      '<div class="vi-axis-leftpad"></div>' +
      '<div class="vi-axis-pokemon">' +
        '<img src="assets/charmander-front.png" class="vi-axis-sprite" alt="">' +
        '<div class="vi-axis-text">Wild CHARMANDER\'s HP &nbsp;→</div>' +
      '</div>';
    gridWrap.appendChild(axisTop);

    /* Side: Pikachu → rows vary your HP. */
    const axisRow = document.createElement('div');
    axisRow.className = 'vi-axis-row';
    gridWrap.appendChild(axisRow);

    const axisSide = document.createElement('div');
    axisSide.className = 'vi-axis-pokemon side';
    axisSide.innerHTML =
      '<img src="assets/pikachu-back.png" class="vi-axis-sprite" alt="">' +
      '<div class="vi-axis-text">Your<br>PIKACHU\'s<br>HP &nbsp;↓</div>';
    axisRow.appendChild(axisSide);

    const grid = document.createElement('div');
    grid.className = 'state-grid';
    grid.style.setProperty('--nb', String(NB));
    axisRow.appendChild(grid);

    const corner = document.createElement('div');
    corner.className = 'axis-corner';
    corner.innerHTML = '';
    grid.appendChild(corner);
    for (const b of BUCKETS) {
      const lbl = document.createElement('div');
      lbl.className = 'axis-label col';
      lbl.textContent = b.toUpperCase();
      grid.appendChild(lbl);
    }
    const cellMap = {};
    for (let y = 0; y < NB; y++) {
      const rl = document.createElement('div');
      rl.className = 'row-label';
      rl.textContent = BUCKETS[y].toUpperCase();
      grid.appendChild(rl);
      for (let o = 0; o < NB; o++) {
        const c = document.createElement('div');
        c.className = 'state-cell';
        c.innerHTML = '<span class="v-val">0.00</span><span class="v-move">—</span>';
        grid.appendChild(c);
        cellMap[y + '|' + o] = c;
      }
    }

    const mix = document.createElement('div');
    mix.className = 'hud-strip sc3-mix';
    root.appendChild(mix);

    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.innerHTML =
      "<span class=\"comp-bellman\">γ low (impatient)</span> values the kill right now — Thunder, even with its miss risk. " +
      "<span class=\"comp-bellman\">γ high (patient)</span> values reliable progress — Thunderbolt, slow but certain. " +
      "Watch the middle band of cells: across the γ sweep, several of them flip from Thunder to Thunderbolt.";
    root.appendChild(caption);

    function render(gamma) {
      const key = gamma.toFixed(2);
      const V = window.DATA.valueIteration.V[key];
      const policy = window.DATA.valueIteration.policy[key];
      for (let i = 0; i < N; i++) {
        const yi = Math.floor(i / NB), oi = i % NB;
        const cell = cellMap[yi + '|' + oi];
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
      const counts = {};
      for (const m of window.Moves.MOVE_IDS) counts[m] = 0;
      for (let i = 0; i < N; i++) counts[policy[i]] = (counts[policy[i]] || 0) + 1;
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

    render(DEFAULT_GAMMA);

    return {
      onEnter() {
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

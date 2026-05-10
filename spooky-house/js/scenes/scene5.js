/* Scene 5 — Adding γ.

   The student moves a γ slider; the V-table re-sweeps in place (no
   animation — we earned that in scene 3). The policy arrows update,
   and the optimal path is re-traced.

   Three preset buttons (1.0, 0.9, 0.5) snap to canonical γ; left/right
   arrows on the keyboard cycle through the presets so the lecturer can
   keyboard-scrub between two states. The flip card under the slider
   highlights when the optimal path differs from γ=1.0's path.

   Cold-entry safe: V is recomputed from rewards × γ on every change. */
(function () {
  if (!window.scenes) window.scenes = {};

  function pathToString(path) {
    return path.map(p => `(${p.r},${p.c})`).join(' → ');
  }
  function pathsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].r !== b[i].r || a[i].c !== b[i].c) return false;
    }
    return true;
  }

  window.scenes.scene5 = function (root) {
    const D = window.DATA && window.DATA.grid;
    if (!D) {
      root.innerHTML = '<p style="opacity:0.6">DATA missing</p>';
      return {};
    }

    /* ---------- DOM ---------- */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's5-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Adding γ.</h1>' +
      '<p class="subtitle">Discount the future. Watch the optimal path re-route.</p>';
    wrap.appendChild(hero);

    const row = document.createElement('div');
    row.className = 's5-row';
    wrap.appendChild(row);

    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s5-grid-host';
    row.appendChild(gridHost);

    const side = document.createElement('div');
    side.className = 's5-side';
    row.appendChild(side);

    /* --- Side: discounted Bellman formula --- */
    const fH2 = document.createElement('h2');
    fH2.textContent = 'The discounted form.';
    side.appendChild(fH2);

    const fBlock = window.Katex.display(window.DATA.tex.bellmanGamma);
    fBlock.classList.add('s5-formula');
    side.appendChild(fBlock);

    /* --- γ slider + presets --- */
    const gH2 = document.createElement('h2');
    gH2.textContent = 'Discount γ.';
    side.appendChild(gH2);

    const gammaBlock = document.createElement('div');
    gammaBlock.className = 's5-gamma-block';
    side.appendChild(gammaBlock);

    const sliderRow = document.createElement('div');
    sliderRow.className = 's5-gamma-row';
    sliderRow.innerHTML =
      '<label for="s5-gamma">γ</label>' +
      '<input type="range" id="s5-gamma" min="0" max="1" step="0.05" value="1.0">' +
      '<span class="gamma-readout">1.00</span>';
    gammaBlock.appendChild(sliderRow);

    const presetsRow = document.createElement('div');
    presetsRow.className = 's5-gamma-presets';
    const PRESETS = [
      { label: 'γ = 1.0', value: 1.0 },
      { label: 'γ = 0.9', value: 0.9 },
      { label: 'γ = 0.5', value: 0.5 },
    ];
    const presetButtons = [];
    for (const p of PRESETS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = p.label;
      b.dataset.gamma = String(p.value);
      b.addEventListener('click', () => setGamma(p.value));
      presetsRow.appendChild(b);
      presetButtons.push(b);
    }
    gammaBlock.appendChild(presetsRow);

    /* --- Comparison block --- */
    const optScoreLine = document.createElement('div');
    optScoreLine.className = 's5-comparison';
    optScoreLine.innerHTML =
      '<span class="label">V at start (with this γ)</span>' +
      '<span class="value" data-key="vstart">—</span>';
    side.appendChild(optScoreLine);

    const undiscScoreLine = document.createElement('div');
    undiscScoreLine.className = 's5-comparison';
    undiscScoreLine.innerHTML =
      '<span class="label">Undiscounted total along this path</span>' +
      '<span class="value" data-key="undisc">—</span>';
    side.appendChild(undiscScoreLine);

    const flipCard = document.createElement('div');
    flipCard.className = 's5-flip-card';
    flipCard.textContent = 'At γ = 1.0, the path is what scene 4 showed.';
    side.appendChild(flipCard);

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent = 'Smaller γ = greedier in time. The future is worth less.';
    wrap.appendChild(caption);

    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.innerHTML = 'Try the presets, or scrub with <kbd>&larr;</kbd>/<kbd>&rarr;</kbd>.  Press <kbd>&rarr;</kbd> at γ=0.5 to recap.';
    wrap.appendChild(foot);

    /* ---------- Mount the grid ---------- */
    const grid = window.Grid.mount(gridHost, {
      M: D.M,
      N: D.N,
      rewards: D.rewards,
      showRewards: true,
      showGhosts: true,
      onLayout: () => {/* no walker */ },
    });
    grid.setCellClass(D.start.r, D.start.c, 'start-cell', true);
    grid.setCellClass(D.goal.r,  D.goal.c,  'goal-cell',  true);
    grid.setEntity('door', { kind: 'door', r: D.goal.r, c: D.goal.c });

    /* ---------- Reference (γ=1) optimal path for diff display ---------- */
    const V_REF = window.Bellman.computeV(D.rewards, 1.0);
    const PATH_REF = window.Bellman.computeOptimalPath(V_REF, D.start);

    /* ---------- Render for the current γ ---------- */
    let gamma = 1.0;
    const gammaInput = sliderRow.querySelector('input');
    const gammaOut   = sliderRow.querySelector('.gamma-readout');

    function rerender() {
      const V = window.Bellman.computeV(D.rewards, gamma);
      const PI = window.Bellman.computePolicy(V);
      const path = window.Bellman.computeOptimalPath(V, D.start);

      /* Repaint V values. */
      for (let r = 0; r < D.M; r++) {
        for (let c = 0; c < D.N; c++) {
          grid.setV(r, c, V[r][c]);
        }
      }
      /* Repaint arrows. */
      grid.drawArrows(PI);
      /* Repaint path-cell tint. */
      grid.clearCellClass('path-cell');
      for (const { r, c } of path) {
        grid.setCellClass(r, c, 'path-cell', true);
      }

      /* Side readouts. */
      gammaOut.textContent = gamma.toFixed(2);
      const vstart = V[D.start.r][D.start.c];
      optScoreLine.querySelector('[data-key="vstart"]').textContent =
        Number.isInteger(vstart) ? String(vstart) : vstart.toFixed(2);
      const undisc = window.Bellman.pathReward(D.rewards, path);
      undiscScoreLine.querySelector('[data-key="undisc"]').textContent =
        `${undisc} along ${pathToString(path)}`;

      /* Flip card. */
      const flipped = !pathsEqual(path, PATH_REF);
      const isReference = Math.abs(gamma - 1.0) < 1e-6;
      if (isReference) {
        flipCard.innerHTML =
          `Reference γ = 1.0. The path here is the one scene 4 derived. ` +
          `Slide γ down — at some point the optimum will flip.`;
      } else if (flipped) {
        flipCard.innerHTML =
          `<span class="flip-marker">Path flipped.</span> Smaller γ shifts the optimum: short, ` +
          `front-loaded reward beats long-horizon reward when the future is discounted.`;
      } else {
        flipCard.innerHTML =
          `Same path as γ = 1.0. This γ is too gentle to flip the route — try a smaller value.`;
      }

      /* Highlight the active preset button. */
      for (const b of presetButtons) {
        const bv = parseFloat(b.dataset.gamma);
        b.classList.toggle('active', Math.abs(bv - gamma) < 1e-6);
      }

      /* Sync slider. */
      if (parseFloat(gammaInput.value) !== gamma) {
        gammaInput.value = String(gamma);
      }
    }

    function setGamma(g) {
      gamma = Math.max(0, Math.min(1, g));
      rerender();
    }

    gammaInput.addEventListener('input', () => {
      setGamma(parseFloat(gammaInput.value));
    });

    /* ---------- Keyboard preset scrubbing ---------- */
    /* ←/→ cycle the presets when the cursor isn't already at an end-stop.
       This lets the lecturer flip between γ=1, 0.9, 0.5 with arrow keys
       AND still advance to the next scene from the rightmost preset. */
    function presetIndex() {
      const idx = PRESETS.findIndex(p => Math.abs(p.value - gamma) < 1e-6);
      return idx;
    }

    /* ---------- &run / &instant ---------- */
    function shouldAutoRun() {
      return /[#&?]run\b/.test(window.location.hash);
    }

    /* ---------- Lifecycle ---------- */
    function onEnter() {
      setGamma(1.0);
      if (shouldAutoRun()) {
        /* Demonstrate the path flip by snapping to γ=0.5. */
        setTimeout(() => setGamma(0.5), 200);
      }
    }
    function onLeave() { /* nothing to clear */ }

    onEnter();

    return {
      onEnter,
      onLeave,
      onNextKey() {
        const idx = presetIndex();
        if (idx === -1) {
          /* Not on a preset — snap to nearest below current */
          setGamma(PRESETS[0].value);
          return true;
        }
        if (idx < PRESETS.length - 1) {
          setGamma(PRESETS[idx + 1].value);
          return true;
        }
        /* At rightmost preset (γ=0.5); yield to advance scene. */
        return false;
      },
      onPrevKey() {
        const idx = presetIndex();
        if (idx === -1) {
          setGamma(PRESETS[PRESETS.length - 1].value);
          return true;
        }
        if (idx > 0) {
          setGamma(PRESETS[idx - 1].value);
          return true;
        }
        /* At leftmost preset (γ=1.0); yield to go back. */
        return false;
      },
    };
  };
})();

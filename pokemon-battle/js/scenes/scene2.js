/* Scene 2 — Value iteration over the 9-state grid.
 *
 * 3 × 3 grid of state cells (rows = your HP bucket: full/mid/low; cols = opp
 * HP bucket). Each cell shows V(state). Click "Run value iteration" → cells
 * propagate from 0; max-ΔV chip drops; iter counter increments. At
 * convergence, each cell additionally shows the optimal move name.
 *
 * &run flag auto-clicks Run for headless verification.
 */
(function () {
  window.scenes = window.scenes || {};

  const GAMMA = window.DATA.params.gammaDefault;
  const BUCKETS = ['full', 'mid', 'low'];

  function moveShort(id) {
    return window.QTable && window.QTable.shortMoveLabel
      ? window.QTable.shortMoveLabel(id) : id;
  }

  window.scenes.scene2 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'poke-section-title';
    heading.textContent = 'VALUE ITERATION — V(YOUR HP, OPP HP)';
    root.appendChild(heading);

    /* Top: HUD strip with iter / max-ΔV / γ. */
    const hud = document.createElement('div');
    hud.className = 'hud-strip';
    hud.innerHTML =
      '<div class="hud-item"><div class="hud-label">ITER</div><div class="hud-val" id="sc2-iter">0</div></div>' +
      '<div class="hud-item"><div class="hud-label">MAX &Delta;V</div><div class="hud-val" id="sc2-delta">—</div></div>' +
      '<div class="hud-item"><div class="hud-label">&gamma;</div><div class="hud-val">' + GAMMA.toFixed(2) + '</div></div>';
    root.appendChild(hud);

    /* The 3×3 state grid. */
    const gridWrap = document.createElement('div');
    gridWrap.className = 'sc2-grid-wrap';
    root.appendChild(gridWrap);

    const grid = document.createElement('div');
    grid.className = 'state-grid';
    gridWrap.appendChild(grid);

    /* Headers: corner cell + 3 col labels, then 3 rows of (row label + 3 cells). */
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

    /* Controls. */
    const ctrl = document.createElement('div');
    ctrl.className = 'poke-menu-row sc2-ctrl';
    ctrl.innerHTML =
      '<button id="sc2-run" type="button">RUN VALUE ITERATION</button>' +
      '<button id="sc2-step" type="button">STEP</button>' +
      '<button id="sc2-reset" type="button">RESET</button>';
    root.appendChild(ctrl);

    /* Bellman formula card. */
    const fcard = document.createElement('div');
    fcard.className = 'poke-formula';
    window.Katex.render(window.DATA.tex.bellman, fcard, true);
    root.appendChild(fcard);

    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.textContent =
      "For each (your HP, opp HP) combo, what's the best move? Bellman iteration tells you. " +
      "We start with V = 0 everywhere; each sweep replaces V(s) with the best move's expected return " +
      "under the current V.  After a few sweeps the values stop changing.  HP buckets are a simplification — " +
      "real HP is 1–100; we use three buckets so the policy fits on screen.";
    root.appendChild(caption);

    /* ---------- State ---------- */
    /* Use the precomputed VI history at γ=GAMMA for byte-identical scrub. */
    const histKey = GAMMA.toFixed(2);
    const HISTORY = window.DATA.valueIteration.byGamma[histKey];
    const POLICY = window.DATA.valueIteration.policy[histKey];
    const ITERS = window.DATA.valueIteration.iters[histKey];

    function stateKey(i) {
      const yi = Math.floor(i / 3), oi = i % 3;
      return BUCKETS[yi] + '|' + BUCKETS[oi];
    }

    function renderAt(iterIdx, opts) {
      const o = opts || {};
      const showPolicy = o.showPolicy || iterIdx >= ITERS;
      const snap = HISTORY[Math.min(iterIdx, HISTORY.length - 1)];
      document.getElementById('sc2-iter').textContent = String(snap.iter);
      document.getElementById('sc2-delta').textContent = (Number.isFinite(snap.maxDelta) ? snap.maxDelta.toExponential(2) : '—');
      for (let i = 0; i < 9; i++) {
        const cell = cellMap[stateKey(i)];
        const v = snap.V[i];
        const valEl = cell.querySelector('.v-val');
        const moveEl = cell.querySelector('.v-move');
        const newText = v.toFixed(2);
        if (valEl.textContent !== newText) {
          valEl.textContent = newText;
          cell.classList.remove('flash');
          void cell.offsetWidth;
          cell.classList.add('flash');
        }
        moveEl.textContent = showPolicy ? moveShort(POLICY[i]) : '—';
      }
    }

    /* Animation playback. */
    let timer = null;
    let cursor = 0;

    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

    function reset() {
      clearTimer();
      cursor = 0;
      renderAt(0);
    }

    function step() {
      clearTimer();
      if (cursor < HISTORY.length - 1) cursor++;
      renderAt(cursor);
    }

    function run() {
      clearTimer();
      cursor = 0;
      renderAt(0);
      function tick() {
        if (cursor >= HISTORY.length - 1) { renderAt(cursor, { showPolicy: true }); return; }
        cursor++;
        renderAt(cursor, { showPolicy: cursor >= ITERS });
        timer = setTimeout(tick, 500);
      }
      timer = setTimeout(tick, 250);
    }

    document.getElementById('sc2-run').addEventListener('click', run);
    document.getElementById('sc2-step').addEventListener('click', step);
    document.getElementById('sc2-reset').addEventListener('click', reset);

    /* &run flag for headless verification: auto-runs the iteration. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(run, 100);

    return {
      onEnter() { reset(); },
      onLeave() { clearTimer(); },
      onNextKey() {
        if (cursor < HISTORY.length - 1) { step(); return true; }
        return false;
      },
      onPrevKey() {
        if (cursor > 0) {
          clearTimer();
          cursor--;
          renderAt(cursor);
          return true;
        }
        return false;
      },
    };
  };
})();

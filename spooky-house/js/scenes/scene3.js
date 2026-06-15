/* Scene 3, The backward sweep.

   The student watches V get filled in cell-by-cell. Order: reverse
   row-major, bottom-right first, then leftward across the bottom row,
   then upward row-by-row. At each cell the side panel shows the
   per-cell arithmetic
     V(r,c) = R(r,c) + max(V(r+1,c), V(r,c+1)) = …
   so the recursion is concrete.

   Step engine (per SKILL §"Step engine"): cursor counts cells filled.
   resetState() clears all V values; applyStep(c) fills cell c-1 in the
   sweep order; render() repaints from state. Prev = reset+replay.

   The `Run` button auto-walks the cursor to the end at a configurable
   speed. Step button advances one cell. Reset clears.

   Cold-entry safe: V is computed from DATA at every onEnter.
   `&run` triggers Run for headless verification.

   This scene's V-fill order and explanation strings are exposed as a
   helper so scenes 4 and 5 can render the same V-table without the
   animation (cold-entry path).
*/
(function () {
  if (!window.scenes) window.scenes = {};

  /* The canonical sweep order for this viz: reverse row-major. Mirrors
     the order used in Bellman.computeV. */
  function reverseRowMajor(M, N) {
    const order = [];
    for (let r = M - 1; r >= 0; r--) {
      for (let c = N - 1; c >= 0; c--) {
        order.push({ r, c });
      }
    }
    return order;
  }

  window.scenes.scene3 = function (root) {
    const D = window.DATA && window.DATA.grid;
    if (!D) {
      root.innerHTML = '<p style="opacity:0.6">DATA missing</p>';
      return {};
    }

    /*, DOM, */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's3-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>The backward sweep.</h1>' +
      '<p class="subtitle">Fill the table from the exit. Each cell needs only its right and ' +
      'down neighbours.</p>';
    wrap.appendChild(hero);

    const row = document.createElement('div');
    row.className = 's3-row';
    wrap.appendChild(row);

    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s3-grid-host';
    row.appendChild(gridHost);

    const side = document.createElement('div');
    side.className = 's3-side';
    row.appendChild(side);

    /*, Side: arithmetic block, */
    const ah2 = document.createElement('h2');
    ah2.textContent = 'This step.';
    side.appendChild(ah2);

    const arithBlock = document.createElement('div');
    arithBlock.className = 's3-arith-block';
    arithBlock.innerHTML = '<div class="arith-empty">Press Run to start the sweep.</div>';
    side.appendChild(arithBlock);

    /*, Progress, */
    const progress = document.createElement('div');
    progress.className = 's3-progress';
    progress.innerHTML =
      '<span class="hud-label" style="font-size:11px;letter-spacing:0.04em;text-transform:uppercase;color:var(--ink-secondary);font-family:-apple-system, BlinkMacSystemFont, \'Inter\', sans-serif;">Filled</span>' +
      '<div class="progress-bar"><div class="progress-fill"></div></div>' +
      '<span class="progress-text">0 / ' + (D.M * D.N) + '</span>';
    side.appendChild(progress);

    /*, Controls, */
    const controls = document.createElement('div');
    controls.className = 'controls s3-controls';
    side.appendChild(controls);

    const grpA = document.createElement('div');
    grpA.className = 'control-group';
    const runBtn = document.createElement('button');
    runBtn.className = 'primary';
    runBtn.type = 'button';
    runBtn.textContent = 'Run';
    const stepBtn = document.createElement('button');
    stepBtn.type = 'button';
    stepBtn.textContent = 'Step';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    grpA.appendChild(runBtn);
    grpA.appendChild(stepBtn);
    grpA.appendChild(resetBtn);
    controls.appendChild(grpA);

    const grpB = document.createElement('div');
    grpB.className = 'control-group';
    const speedLbl = document.createElement('label');
    speedLbl.htmlFor = 's3-speed';
    speedLbl.textContent = 'Speed';
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.id = 's3-speed';
    speedSlider.min = '1';
    speedSlider.max = '5';
    speedSlider.step = '1';
    speedSlider.value = '3';
    const speedOut = document.createElement('output');
    speedOut.textContent = '3×';
    grpB.appendChild(speedLbl);
    grpB.appendChild(speedSlider);
    grpB.appendChild(speedOut);
    controls.appendChild(grpB);

    /*, Caption, */
    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent =
      'Each cell needs only the two it points to. ' +
      'No iteration, no guessing, one sweep is exact.';
    wrap.appendChild(caption);

    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'Press → to continue once the sweep is done.';
    wrap.appendChild(foot);

    /*, Mount the grid, */
    const grid = window.Grid.mount(gridHost, {
      M: D.M,
      N: D.N,
      rewards: D.rewards,
      showRewards: true,
      showGhosts: true,
      onLayout: () => {/* no entities to re-place */ },
    });
    grid.setCellClass(D.start.r, D.start.c, 'start-cell', true);
    grid.setCellClass(D.goal.r,  D.goal.c,  'goal-cell',  true);

    /*, Step-engine state, */
    const ORDER = reverseRowMajor(D.M, D.N);
    const TOTAL = ORDER.length;
    const GAMMA = 1.0;
    const V = window.Bellman.computeV(D.rewards, GAMMA);
    let cursor = 0;
    let animTimer = null;

    /* Side panel arithmetic history, last few cells filled, in order. */
    const history = []; /* [{ r, c, text }] */

    function clearAnim() {
      if (animTimer) { clearInterval(animTimer); animTimer = null; }
    }

    function resetState() {
      cursor = 0;
      history.length = 0;
      grid.clearAllV();
      grid.clearCellClass('sweep-cursor');
      runBtn.disabled = false;
      runBtn.textContent = 'Run';
    }

    function applyStep(c) {
      const cell = ORDER[c - 1];
      grid.setV(cell.r, cell.c, V[cell.r][cell.c]);
      const text = window.Bellman.explain(D.rewards, V, GAMMA, cell.r, cell.c);
      history.push({ r: cell.r, c: cell.c, text });
      if (history.length > 6) history.shift();
    }

    function render(animateLast) {
      /* Arrange the sweep-cursor outline on the most recently filled cell. */
      grid.clearCellClass('sweep-cursor');
      if (cursor > 0 && cursor < TOTAL) {
        const next = ORDER[cursor];
        grid.setCellClass(next.r, next.c, 'sweep-cursor', true);
      }

      /* Update the arithmetic block. */
      arithBlock.innerHTML = '';
      if (history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'arith-empty';
        empty.textContent = 'Press Run to start the sweep.';
        arithBlock.appendChild(empty);
      } else {
        const last = history[history.length - 1];
        const cur = document.createElement('div');
        cur.className = 'arith-line';
        cur.textContent = last.text;
        arithBlock.appendChild(cur);
        if (history.length > 1) {
          const prev = document.createElement('div');
          prev.className = 's3-arith-prev';
          for (let i = history.length - 2; i >= 0; i--) {
            const ln = document.createElement('div');
            ln.textContent = history[i].text;
            prev.appendChild(ln);
          }
          arithBlock.appendChild(prev);
        }
      }

      /* Progress bar. */
      const pct = (cursor / TOTAL) * 100;
      progress.querySelector('.progress-fill').style.width = pct.toFixed(1) + '%';
      progress.querySelector('.progress-text').textContent =
        `${cursor} / ${TOTAL}`;
    }

    function setCursor(c, animate) {
      if (c < 0) c = 0;
      if (c > TOTAL) c = TOTAL;
      if (c === cursor) return;
      if (c < cursor) {
        resetState();
        cursor = 0;
        while (cursor < c) { cursor++; applyStep(cursor); }
        render(false);
      } else {
        while (cursor < c) { cursor++; applyStep(cursor); }
        render(animate);
      }
      if (cursor >= TOTAL) {
        runBtn.disabled = false;
        runBtn.textContent = 'Run again';
      }
    }

    function speedToInterval() {
      const v = parseInt(speedSlider.value, 10);
      /* 1× = 700ms, 5× = 110ms */
      return Math.round(700 - ((v - 1) / 4) * 590);
    }

    function run() {
      clearAnim();
      if (cursor >= TOTAL) {
        resetState();
        render(false);
      }
      runBtn.disabled = true;
      runBtn.textContent = 'Sweeping…';
      animTimer = setInterval(() => {
        if (cursor >= TOTAL) {
          clearAnim();
          runBtn.disabled = false;
          runBtn.textContent = 'Run again';
          render(false);
          return;
        }
        setCursor(cursor + 1, true);
      }, speedToInterval());
    }

    runBtn.addEventListener('click', run);
    stepBtn.addEventListener('click', () => { clearAnim(); setCursor(cursor + 1, true); });
    resetBtn.addEventListener('click', () => { clearAnim(); resetState(); render(false); });
    speedSlider.addEventListener('input', () => {
      speedOut.textContent = `${speedSlider.value}×`;
      if (animTimer) {
        /* Restart timer with new interval. */
        clearAnim();
        if (cursor < TOTAL) {
          animTimer = setInterval(() => {
            if (cursor >= TOTAL) {
              clearAnim();
              runBtn.disabled = false;
              runBtn.textContent = 'Run again';
              render(false);
              return;
            }
            setCursor(cursor + 1, true);
          }, speedToInterval());
        }
      }
    });

    /*, &run / &instant hooks, */
    function shouldAutoRun() {
      return /[#&?]run\b/.test(window.location.hash);
    }
    function isInstant() {
      return /[#&?]instant\b/.test(window.location.hash);
    }

    /*, Lifecycle, */
    function onEnter() {
      resetState();
      render(false);
      if (shouldAutoRun()) {
        if (isInstant()) {
          /* Snap to the end. */
          setCursor(TOTAL, false);
        } else {
          setTimeout(run, 180);
        }
      }
    }
    function onLeave() {
      clearAnim();
    }

    onEnter();

    return {
      onEnter,
      onLeave,
      onNextKey() {
        /* In this scene, ArrowRight at the head advances scene; otherwise
           the scene engine just advances. We don't add per-step keyboard
           navigation here because Run / Step are explicit affordances. */
        return false;
      },
      onPrevKey() {
        return false;
      },
    };
  };
})();

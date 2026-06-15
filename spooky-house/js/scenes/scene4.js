/* Scene 4, Reading the policy.

   The V-table is reconstructed instantly (no animated sweep, the
   pedagogical beat of "watch it fill" was scene 3). On every cell, an
   SVG arrow points to the higher-V neighbour. Tied cells get two muted
   arrows. Click any cell to see its argmax computation.

   Then `Run` walks ANYmal slowly from (0,0) along the optimal path,
   reading the arrows. The cumulative reward tally beats the manual
   score from scene 1 (almost certainly).

   Cold-entry safe: V is recomputed from DATA on every onEnter.
   `&run` triggers Run for headless verification. */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene4 = function (root) {
    const D = window.DATA && window.DATA.grid;
    if (!D) {
      root.innerHTML = '<p style="opacity:0.6">DATA missing</p>';
      return {};
    }

    /*, DOM, */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's4-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Reading the policy.</h1>' +
      '<p class="subtitle">Each cell points to the higher-V neighbour. ' +
      'Follow the arrows from the start.</p>';
    wrap.appendChild(hero);

    const row = document.createElement('div');
    row.className = 's4-row';
    wrap.appendChild(row);

    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s4-grid-host';
    row.appendChild(gridHost);

    const side = document.createElement('div');
    side.className = 's4-side';
    row.appendChild(side);

    /*, Side: policy formula, */
    const polFormulaH2 = document.createElement('h2');
    polFormulaH2.textContent = 'The policy.';
    side.appendChild(polFormulaH2);

    const polFormula = window.Katex.display(
      "\\pi(r,\\,c) \\;=\\; \\arg\\max_{a \\in \\{\\rightarrow,\\, \\downarrow\\}}\\; V\\bigl(\\text{cell at}\\; a(r,c)\\bigr)"
    );
    polFormula.classList.add('s4-policy-formula');
    side.appendChild(polFormula);

    /*, Click-explanation, */
    const explainH2 = document.createElement('h2');
    explainH2.textContent = 'Click any cell.';
    side.appendChild(explainH2);

    const explainBox = document.createElement('div');
    explainBox.className = 's4-explain';
    explainBox.innerHTML = '<span class="arith-empty">A cell\'s arrow is whichever neighbour has the bigger V.</span>';
    side.appendChild(explainBox);

    /*, Score & controls, */
    const scoreLine = document.createElement('div');
    scoreLine.className = 's4-score-line';
    scoreLine.innerHTML =
      '<span class="label">Optimal score (V at start)</span>' +
      '<span class="value" data-key="optimal">, </span>';
    side.appendChild(scoreLine);

    const liveLine = document.createElement('div');
    liveLine.className = 's4-score-line';
    liveLine.innerHTML =
      '<span class="label">Score as ANYmal walks</span>' +
      '<span class="value" data-key="live">, </span>';
    side.appendChild(liveLine);

    const controls = document.createElement('div');
    controls.className = 's4-controls controls';
    side.appendChild(controls);
    const ctrlGrp = document.createElement('div');
    ctrlGrp.className = 'control-group';
    const runBtn = document.createElement('button');
    runBtn.className = 'primary';
    runBtn.type = 'button';
    runBtn.textContent = 'Walk it';
    const stepBtn = document.createElement('button');
    stepBtn.type = 'button';
    stepBtn.textContent = 'Step';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    ctrlGrp.appendChild(runBtn);
    ctrlGrp.appendChild(stepBtn);
    ctrlGrp.appendChild(resetBtn);
    controls.appendChild(ctrlGrp);

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent = 'Same V, two readings: a value per cell, an arrow per cell.';
    wrap.appendChild(caption);

    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'Press → to add the discount.';
    wrap.appendChild(foot);

    /*, Mount the grid + cold-entry V-table fill, */
    const grid = window.Grid.mount(gridHost, {
      M: D.M,
      N: D.N,
      rewards: D.rewards,
      showRewards: true,
      showGhosts: true,
      onLayout: () => placeWalker(),
    });
    grid.setCellClass(D.start.r, D.start.c, 'start-cell', true);
    grid.setCellClass(D.goal.r,  D.goal.c,  'goal-cell',  true);
    grid.setEntity('door', { kind: 'door', r: D.goal.r, c: D.goal.c });

    /* Cold-entry: rebuild V instantly. No animation here, the sweep was
       scene 3's beat. */
    const GAMMA = 1.0;
    const V = window.Bellman.computeV(D.rewards, GAMMA);
    const PI = window.Bellman.computePolicy(V);
    const optPath = window.Bellman.computeOptimalPath(V, D.start);
    const optScore = window.Bellman.pathReward(D.rewards, optPath);

    function fillVTable() {
      for (let r = 0; r < D.M; r++) {
        for (let c = 0; c < D.N; c++) {
          grid.setV(r, c, V[r][c]);
        }
      }
    }
    fillVTable();
    grid.drawArrows(PI);

    scoreLine.querySelector('[data-key="optimal"]').textContent = String(optScore);

    /*, ANYmal walker, */
    let cursor = 0; /* 0..optPath.length-1 */

    function placeWalker() {
      const head = optPath[cursor];
      grid.setEntity('anymal', { kind: 'anymal', r: head.r, c: head.c });
    }
    placeWalker();

    function repaintTrail() {
      grid.clearCellClass('path-cell');
      for (let i = 0; i <= cursor; i++) {
        grid.setCellClass(optPath[i].r, optPath[i].c, 'path-cell', true);
      }
      let s = 0;
      for (let i = 0; i <= cursor; i++) s += D.rewards[optPath[i].r][optPath[i].c];
      liveLine.querySelector('[data-key="live"]').textContent = String(s);
      placeWalker();
    }

    function reset() {
      cursor = 0;
      repaintTrail();
      runBtn.disabled = false;
      runBtn.textContent = 'Walk it';
    }

    function step() {
      if (cursor >= optPath.length - 1) return false;
      cursor++;
      repaintTrail();
      grid.flashEntity('anymal');
      return true;
    }

    let animTimer = null;
    function clearAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }

    function run() {
      reset();
      runBtn.disabled = true;
      runBtn.textContent = 'Walking…';
      animTimer = setInterval(() => {
        if (!step()) {
          clearAnim();
          runBtn.disabled = false;
          runBtn.textContent = 'Walk again';
        }
      }, 460);
    }

    runBtn.addEventListener('click', run);
    stepBtn.addEventListener('click', () => { clearAnim(); step(); });
    resetBtn.addEventListener('click', () => { clearAnim(); reset(); });

    /*, Click-to-explain, */
    grid.onCellClick(({ r, c }) => {
      grid.clearCellClass('click-explained');
      grid.setCellClass(r, c, 'click-explained', true);
      const downValid = r + 1 < D.M;
      const rightValid = c + 1 < D.N;
      const fmt = (x) => Number.isInteger(x) ? String(x) : x.toFixed(2);
      let txt;
      if (!downValid && !rightValid) {
        txt = `(${r}, ${c}) is the exit. V = ${fmt(V[r][c])}.`;
      } else if (!downValid) {
        txt = `(${r}, ${c}) → only right. V(r, c+1) = ${fmt(V[r][c+1])}.`;
      } else if (!rightValid) {
        txt = `(${r}, ${c}) → only down. V(r+1, c) = ${fmt(V[r+1][c])}.`;
      } else {
        const vd = V[r+1][c], vr = V[r][c+1];
        const cmp = vd > vr ? 'down wins' : (vr > vd ? 'right wins' : 'tied');
        txt = `(${r}, ${c}): max(V(${r+1},${c}), V(${r},${c+1})) = max(${fmt(vd)}, ${fmt(vr)}), ${cmp}.`;
      }
      explainBox.textContent = txt;
    });

    /*, &run / &instant, */
    function shouldAutoRun() {
      return /[#&?]run\b/.test(window.location.hash);
    }
    function isInstant() {
      return /[#&?]instant\b/.test(window.location.hash);
    }

    /*, Lifecycle, */
    function onEnter() {
      reset();
      if (shouldAutoRun()) {
        if (isInstant()) {
          /* Snap to the end. */
          cursor = optPath.length - 1;
          repaintTrail();
          runBtn.disabled = false;
          runBtn.textContent = 'Walk again';
        } else {
          setTimeout(run, 200);
        }
      }
    }
    function onLeave() {
      clearAnim();
    }

    onEnter();

    return { onEnter, onLeave };
  };
})();

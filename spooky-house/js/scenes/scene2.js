/* Scene 2, Greedy needs the future.

   Two grids, side by side. Left: a "greedy-local" walker that always
   picks the higher-reward neighbour, ignoring everything past one step.
   Right: the "optimal" walker that follows V (computed via Bellman). On
   `Run`, both walkers step together, one cell at a time, until they
   reach the exit. Their cumulative scores tally beneath the grid; at the
   end the gap is unmistakeable.

   Then the page steps into the formula reveal: V(r,c) = R(r,c) + max(...)
   with each piece annotated. The animation is the motivation; the
   formula is the answer.

   `&run` triggers the primary Run button, dev affordance for headless
   verification. Cold-entry safe: walks rebuild from DATA on each onEnter. */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene2 = function (root) {
    const D = window.DATA && window.DATA.grid;
    if (!D) {
      root.innerHTML = '<p style="opacity:0.6">DATA missing</p>';
      return {};
    }

    /*, DOM, */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's2-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Greedy needs the future.</h1>' +
      '<p class="subtitle">Two walkers. Same start, same exit. ' +
      'One picks the bigger neighbour. The other looks past one step.</p>';
    wrap.appendChild(hero);

    /*, Pair of grids, */
    const pair = document.createElement('div');
    pair.className = 's2-pair';
    wrap.appendChild(pair);

    const greedyCell = makeWalker(pair, 'greedy', 'Greedy', 'Picks the bigger neighbour');
    const optimalCell = makeWalker(pair, 'optimal', 'Optimal', 'Follows V');

    /*, Controls, */
    const controls = document.createElement('div');
    controls.className = 's2-controls controls';
    wrap.appendChild(controls);

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

    const ctrlGrp = document.createElement('div');
    ctrlGrp.className = 'control-group';
    ctrlGrp.appendChild(runBtn);
    ctrlGrp.appendChild(stepBtn);
    ctrlGrp.appendChild(resetBtn);
    controls.appendChild(ctrlGrp);

    /*, Formula reveal, */
    const formulaBlock = document.createElement('div');
    formulaBlock.className = 's2-formula-block';
    wrap.appendChild(formulaBlock);

    const formulaTex = window.Katex.display(window.DATA.tex.bellman);
    formulaBlock.appendChild(formulaTex);

    const anno = document.createElement('div');
    anno.className = 's2-formula-anno';
    anno.innerHTML =
      '<span class="anno"><span class="anno-sym">V(r, c)</span> value of being at cell (r, c)</span>' +
      '<span class="anno"><span class="anno-sym">R(r, c)</span> spookiness collected here</span>' +
      '<span class="anno"><span class="anno-sym">max(…, …)</span> best of the two next cells</span>';
    formulaBlock.appendChild(anno);

    const caption = document.createElement('p');
    caption.className = 'caption s2-caption';
    caption.textContent = 'Greedy needs to know the future. The future is V.';
    wrap.appendChild(caption);

    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'Press → to continue.';
    wrap.appendChild(foot);

    /*, Walker construction helper, */
    function makeWalker(parent, kind, title, subtitle) {
      const cell = document.createElement('div');
      cell.className = 's2-cell';
      parent.appendChild(cell);

      const head = document.createElement('div');
      head.className = 's2-cell-header';
      head.innerHTML =
        `<span class="s2-cell-title">${title}</span>` +
        `<span class="s2-cell-subtitle">${subtitle}</span>`;
      cell.appendChild(head);

      const host = document.createElement('div');
      host.className = 'grid-host s2-grid-host';
      cell.appendChild(host);

      const scoreLine = document.createElement('div');
      scoreLine.className = 's2-running-line';
      const lbl = document.createElement('span');
      lbl.className = 'hud-label';
      lbl.style.fontSize = '11px';
      lbl.style.letterSpacing = '0.04em';
      lbl.style.textTransform = 'uppercase';
      lbl.style.color = 'var(--ink-secondary)';
      lbl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Inter", sans-serif';
      lbl.textContent = 'Score';
      const chip = document.createElement('span');
      chip.className = 'score-chip';
      chip.textContent = String(D.rewards[D.start.r][D.start.c]);
      scoreLine.appendChild(lbl);
      scoreLine.appendChild(chip);
      cell.appendChild(scoreLine);

      const grid = window.Grid.mount(host, {
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

      let path = [{ r: D.start.r, c: D.start.c }];
      let cursor = 0;
      const trailClass = kind === 'greedy' ? 'greedy-cell' : 'path-cell';

      function placeWalker() {
        const head = path[cursor];
        grid.setEntity('walker', { kind: 'anymal', r: head.r, c: head.c });
      }

      function repaint() {
        grid.clearCellClass(trailClass);
        for (let i = 0; i <= cursor; i++) {
          grid.setCellClass(path[i].r, path[i].c, trailClass, true);
        }
        let s = 0;
        for (let i = 0; i <= cursor; i++) s += D.rewards[path[i].r][path[i].c];
        chip.textContent = String(s);
        placeWalker();
      }

      function reset() {
        cursor = 0;
        repaint();
      }

      function setPath(newPath) {
        path = newPath.slice();
        cursor = 0;
        repaint();
      }

      function step() {
        if (cursor < path.length - 1) {
          cursor++;
          repaint();
          return true;
        }
        return false;
      }

      function isDone() { return cursor >= path.length - 1; }

      function getRunningScore() {
        let s = 0;
        for (let i = 0; i <= cursor; i++) s += D.rewards[path[i].r][path[i].c];
        return s;
      }

      return { reset, setPath, step, isDone, repaint, getRunningScore, gridRef: grid };
    }

    /*, Walk computation (cold-entry safe), */
    const greedyPath = window.Bellman.computeGreedyLocalPath(D.rewards, D.start);
    const V1 = window.Bellman.computeV(D.rewards, 1.0);
    const optimalPath = window.Bellman.computeOptimalPath(V1, D.start);

    greedyCell.setPath(greedyPath);
    optimalCell.setPath(optimalPath);

    /*, Animation control, */
    let animTimer = null;
    function clearAnim() {
      if (animTimer) { clearInterval(animTimer); animTimer = null; }
    }

    function reset() {
      clearAnim();
      greedyCell.reset();
      optimalCell.reset();
      runBtn.disabled = false;
      runBtn.textContent = 'Run';
    }

    function stepBoth() {
      const a = greedyCell.step();
      const b = optimalCell.step();
      return a || b;
    }

    function run() {
      reset();
      runBtn.disabled = true;
      runBtn.textContent = 'Running…';
      animTimer = setInterval(() => {
        if (!stepBoth()) {
          clearAnim();
          runBtn.disabled = false;
          runBtn.textContent = 'Run again';
        }
      }, 380);
    }

    runBtn.addEventListener('click', run);
    stepBtn.addEventListener('click', () => { clearAnim(); stepBoth(); });
    resetBtn.addEventListener('click', reset);

    /*, &run hook for headless verification, */
    function shouldAutoRun() {
      return /[#&?]run\b/.test(window.location.hash);
    }
    function jumpToEnd() {
      while (stepBoth()) { /* fast-forward */ }
    }

    /*, Lifecycle, */
    function onEnter() {
      reset();
      if (shouldAutoRun()) {
        /* Under &instant, snap to end without animation. Otherwise click run. */
        if (/[#&?]instant\b/.test(window.location.hash)) {
          jumpToEnd();
          runBtn.disabled = false;
          runBtn.textContent = 'Run again';
        } else {
          setTimeout(run, 180);
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

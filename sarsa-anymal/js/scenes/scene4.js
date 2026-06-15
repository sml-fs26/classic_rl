/* Scene 4, The policy emerges.
 *
 *   Final episode (scrubber pinned to t=500). Default view: max-Q heatmap on
 *   grid + argmax arrows on each cell + ghost-occupancy underlay toggleable.
 *   Click any grid cell → highlights that row in the numerical Q-table on
 *   the side AND shows its 4 Q-values as a mini bar chart.
 *
 *   ANYmal walks the policy from start to goal, slowly (animated, ~150 ms
 *   per step). Play / step / reset buttons.
 *
 *   Caption: "The arrows zigzag, under each ghost's bias."
 *
 *   This is the reveal scene, the first time argmax arrows appear on the
 *   grid. Scenes 2-3 deliberately suppress them.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  const ARROW = { up: '↑', down: '↓', left: '←', right: '→' };
  const DELTAS = { up: { dr: -1, dc: 0 }, down: { dr: 1, dc: 0 }, left: { dr: 0, dc: -1 }, right: { dr: 0, dc: 1 } };

  window.scenes.scene4 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene4-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero s4-hero';
    hero.innerHTML =
      '<h1>The policy emerges.</h1>' +
      '<p class="subtitle">After 500 episodes, the Q-table tells the agent where to walk.</p>';
    wrap.appendChild(hero);

    const T = window.DATA && window.DATA.training;
    if (!T) {
      const empty = document.createElement('div');
      empty.className = 's4-empty';
      empty.innerHTML =
        '<p class="caption">Training data is missing, run ' +
        '<code>node precompute/build-datasets.js</code> from the viz folder.</p>';
      wrap.appendChild(empty);
      return {};
    }

    const init = window.MDP.initialState();
    const M = init.M, N = init.N;

    /* Pull final Q from the canonical trajectory at episode = max snapshot. */
    const finalSnap = T.primary.snapshots[T.primary.snapshots.length - 1];
    const Q = window.QTable.fromSnapshot(finalSnap.Q);

    /* Layout */
    const layout = document.createElement('div');
    layout.className = 's4-layout';
    wrap.appendChild(layout);

    const left = document.createElement('div');
    left.className = 's4-left';
    layout.appendChild(left);

    const rail = document.createElement('div');
    rail.className = 's4-rail';
    layout.appendChild(rail);

    /* Top control row */
    const ctrlRow = document.createElement('div');
    ctrlRow.className = 's4-ctrl-row';
    left.appendChild(ctrlRow);

    /* View toggle (numerical / heatmap+arrows / per-action) */
    const viewGrp = document.createElement('div');
    viewGrp.className = 'control-group';
    const viewLbl = document.createElement('label');
    viewLbl.textContent = 'view';
    viewGrp.appendChild(viewLbl);
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';
    const viewBtns = {};
    for (const k of ['heatmap', 'numerical', 'per-action']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.view = k;
      b.textContent = k;
      viewToggle.appendChild(b);
      viewBtns[k] = b;
    }
    viewGrp.appendChild(viewToggle);
    ctrlRow.appendChild(viewGrp);

    /* Ghost occupancy toggle */
    const occGrp = document.createElement('div');
    occGrp.className = 'control-group';
    const occBtn = document.createElement('button');
    occBtn.type = 'button';
    occBtn.className = 'toggle';
    occBtn.textContent = 'ghost occupancy';
    occGrp.appendChild(occBtn);
    ctrlRow.appendChild(occGrp);

    /* Play controls */
    const playGrp = document.createElement('div');
    playGrp.className = 'control-group';
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'primary';
    playBtn.textContent = '▶ play';
    playGrp.appendChild(playBtn);
    const stepBtn = document.createElement('button');
    stepBtn.type = 'button';
    stepBtn.textContent = 'step';
    playGrp.appendChild(stepBtn);
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'reset';
    playGrp.appendChild(resetBtn);
    ctrlRow.appendChild(playGrp);

    /* Grid host */
    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s4-grid-host';
    left.appendChild(gridHost);

    /* Caption */
    const cap = document.createElement('p');
    cap.className = 'caption s4-cap';
    cap.textContent = 'The arrows zigzag, under each ghost\'s bias.';
    left.appendChild(cap);

    /* Right rail: numerical Q-table + bar chart for clicked cell */
    const railTitle = document.createElement('div');
    railTitle.className = 'col-label';
    railTitle.textContent = 'Q-table, click any cell on the grid';
    rail.appendChild(railTitle);

    const qHost = document.createElement('div');
    qHost.className = 'qtable-rail s4-qhost';
    rail.appendChild(qHost);

    /* Bar chart for the selected cell */
    const barWrap = document.createElement('div');
    barWrap.className = 's4-bars';
    rail.appendChild(barWrap);
    const barTitle = document.createElement('div');
    barTitle.className = 'col-label';
    barTitle.textContent = 'Q(s, ·) for selected cell';
    barWrap.appendChild(barTitle);
    const barsHost = document.createElement('div');
    barsHost.className = 'q-bars';
    barWrap.appendChild(barsHost);

    /*, Mount the grid, */
    const grid = window.Grid.mount(gridHost, {
      M, N,
      onLayout: () => placeAll(),
    });
    grid.setCellClass(init.start.r, init.start.c, 'start-cell', true);
    grid.setCellClass(init.star.r,  init.star.c,  'goal-cell',  true);

    /* Walk state */
    let walkState = window.MDP.initialState();

    function placeAll() {
      grid.setEntity('anymal', { kind: 'anymal', r: walkState.anymal.r, c: walkState.anymal.c });
      for (let i = 0; i < walkState.ghosts.length; i++) {
        grid.setEntity('ghost' + i, { kind: 'ghost', r: walkState.ghosts[i].r, c: walkState.ghosts[i].c });
      }
      grid.setEntity('star', { kind: 'star', r: walkState.star.r, c: walkState.star.c });
    }
    placeAll();

    /*, Q-table view, */
    let viewMode = 'heatmap';
    let qNumeric = null, qValue = null, qPer = null;

    /* Range fixed to the final-snapshot range so coloring is stable. */
    let qLo = Infinity, qHi = -Infinity;
    for (const v of Q) { if (v < qLo) qLo = v; if (v > qHi) qHi = v; }
    if (qLo === qHi) qHi = qLo + 1;

    function ensureQHost(mode) {
      qHost.innerHTML = '';
      if (mode === 'numerical') {
        qNumeric = window.QTable.mountNumerical(qHost, M, N, { goal: init.star });
        qValue = qPer = null;
      } else if (mode === 'heatmap') {
        qValue = window.QTable.mountValue(qHost, M, N, { showArrow: true });
        qNumeric = qPer = null;
      } else {
        qPer = window.QTable.mountPerAction(qHost, M, N);
        qNumeric = qValue = null;
      }
    }

    function renderView() {
      if (qNumeric) qNumeric.update(Q, { lo: qLo, hi: qHi, highlight: selected });
      else if (qValue) qValue.update(Q, { lo: qLo, hi: qHi, showArrow: true, highlight: selected });
      else if (qPer)  qPer.update(Q, { lo: qLo, hi: qHi });
    }

    /* Argmax arrows on the grid (only when in heatmap mode AND on this scene) */
    function renderGridArrows() {
      grid.overlay.innerHTML = '';
      if (viewMode !== 'heatmap') return;
      const cellSize = grid.cellSize();
      for (let r = 0; r < M; r++) {
        for (let c = 0; c < N; c++) {
          if (r === init.star.r && c === init.star.c) continue;
          const row = window.SARSA.row(Q, N, r, c);
          const allTied = row.every(x => x === row[0]);
          if (allTied) continue;
          const aIdx = window.SARSA.argmaxIndex(Q, N, r, c);
          const div = document.createElement('div');
          div.className = 's4-arrow';
          div.textContent = ARROW[window.SARSA.ACTIONS[aIdx]];
          div.style.position = 'absolute';
          div.style.left = (c * cellSize.w + cellSize.w * 0.62) + 'px';
          div.style.top  = (r * cellSize.h + cellSize.h * 0.06) + 'px';
          div.style.width = (cellSize.w * 0.32) + 'px';
          div.style.height = (cellSize.h * 0.4) + 'px';
          grid.overlay.appendChild(div);
        }
      }
    }

    function setView(mode) {
      viewMode = mode;
      for (const k of Object.keys(viewBtns)) viewBtns[k].classList.toggle('active', k === mode);
      ensureQHost(mode);
      renderView();
      renderGridArrows();
    }
    for (const k of Object.keys(viewBtns)) {
      viewBtns[k].addEventListener('click', () => setView(k));
    }

    /*, Click-cell payoff, */
    let selected = { r: init.start.r, c: init.start.c };

    function renderBars() {
      barsHost.innerHTML = '';
      if (selected.r === init.star.r && selected.c === init.star.c) {
        const row = document.createElement('div');
        row.className = 'q-bars-empty';
        row.textContent = '(' + selected.r + ',' + selected.c + ') is terminal · Q ≡ 0';
        barsHost.appendChild(row);
        return;
      }
      const vals = window.SARSA.row(Q, N, selected.r, selected.c);
      let absMax = 0.001;
      for (const v of vals) absMax = Math.max(absMax, Math.abs(v));
      for (let a = 0; a < 4; a++) {
        const arrow = document.createElement('div');
        arrow.className = 'qb-arrow comp-mdp';
        arrow.textContent = ARROW[window.SARSA.ACTIONS[a]];
        const track = document.createElement('div');
        track.className = 'qb-track';
        const fill = document.createElement('div');
        fill.className = 'qb-fill';
        const v = vals[a];
        if (v >= 0) {
          fill.style.left = '50%';
          fill.style.width = (Math.abs(v) / absMax * 50) + '%';
        } else {
          fill.classList.add('negative');
          fill.style.right = '50%';
          fill.style.left = (50 - Math.abs(v) / absMax * 50) + '%';
          fill.style.width = (Math.abs(v) / absMax * 50) + '%';
        }
        track.appendChild(fill);
        const valTxt = document.createElement('div');
        valTxt.className = 'qb-val';
        valTxt.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
        barsHost.appendChild(arrow);
        barsHost.appendChild(track);
        barsHost.appendChild(valTxt);
      }
    }

    function selectCell(r, c) {
      selected = { r, c };
      /* Highlight on the grid */
      for (let rr = 0; rr < M; rr++) {
        for (let cc = 0; cc < N; cc++) {
          grid.setCellClass(rr, cc, 'cell-highlight', rr === r && cc === c);
        }
      }
      renderView();
      renderBars();
    }

    grid.onCellClick((r, c) => selectCell(r, c));

    /* Default selection */
    selectCell(init.start.r, init.start.c);

    /*, Ghost occupancy underlay, */
    let occOn = false;
    const occGrid = (T.ghostOccupancy && T.ghostOccupancy.grid) || null;
    occBtn.addEventListener('click', () => {
      occOn = !occOn;
      occBtn.classList.toggle('active', occOn);
      grid.setGhostOccupancy(occOn ? occGrid : null);
    });

    /*, Policy walk (greedy, ε=0), */
    let walkTimer = null;
    let walkSteps = 0;

    function walkOneStep() {
      if (walkState.terminal) {
        playBtn.textContent = '▶ play';
        return false;
      }
      const r = walkState.anymal.r, c = walkState.anymal.c;
      const aIdx = window.SARSA.argmaxIndex(Q, N, r, c);
      const action = window.SARSA.ACTIONS[aIdx];
      const stepSeed = (Date.now() & 0xffffffff) ^ (walkSteps * 0x9E3779B1) >>> 0;
      const rng = window.MDP.makeRng(stepSeed);
      const out = window.MDP.step(walkState, action, { malfunctionProb: 0, maxRounds: 60 }, rng);
      walkState = out.state;
      walkSteps++;
      placeAll();
      if (out.terminal) {
        playBtn.textContent = '▶ play';
        return false;
      }
      return true;
    }

    function startWalk() {
      if (walkState.terminal) resetWalk();
      playBtn.textContent = '⏸ pause';
      walkTimer = setInterval(() => {
        if (!walkOneStep()) {
          clearInterval(walkTimer);
          walkTimer = null;
        }
      }, 350);
    }
    function pauseWalk() {
      if (walkTimer) { clearInterval(walkTimer); walkTimer = null; }
      playBtn.textContent = '▶ play';
    }
    function resetWalk() {
      pauseWalk();
      walkState = window.MDP.initialState();
      walkSteps = 0;
      placeAll();
    }

    playBtn.addEventListener('click', () => {
      if (walkTimer) pauseWalk(); else startWalk();
    });
    stepBtn.addEventListener('click', () => walkOneStep());
    resetBtn.addEventListener('click', resetWalk);

    /* &run support: triggers play. */
    function shouldAutoRun() { return /[#&?]run\b/.test(window.location.hash); }

    /* Initial setup */
    setView('heatmap');
    renderView();
    renderGridArrows();
    renderBars();

    if (shouldAutoRun()) {
      setTimeout(() => startWalk(), 200);
    }

    /* Re-render arrows on resize. */
    window.addEventListener('resize', () => renderGridArrows());

    return {
      onEnter() { renderView(); renderGridArrows(); renderBars(); },
      onLeave() { pauseWalk(); },
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

/* Scene 3, Episodes accumulate.
 *
 *   Autoplay scrubber over precomputed training. Numerical Q-table updates
 *   per scrubber position; cells that changed since the last snapshot flash.
 *   Below the grid: a learning-curve chart (cumulative reward per episode)
 *   with the current scrubber position highlighted.
 *
 *   Slider for α: default 0.1 (canonical). Moving to 0.95 swaps to the
 *   precomputed *oscillating* trajectory.
 *
 *   View toggle: numerical / heatmap+arrows / per-action 4-up. Numerical is
 *   the default, the centerpiece view.
 *
 *   Toggle: ghost-occupancy heatmap underlay (precomputed stationary
 *   distributions; faint red where ghosts spend time).
 *
 *   Cold-entry: if DATA.training is missing, render a "data missing" panel.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  const SNAPSHOTS = [0, 1, 5, 10, 25, 50, 100, 250, 500];

  window.scenes.scene3 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene3-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero s3-hero';
    hero.innerHTML =
      '<h1>Episodes accumulate.</h1>' +
      '<p class="subtitle">Five hundred episodes, one trajectory.</p>';
    wrap.appendChild(hero);

    /* Cold-entry guard */
    const T = window.DATA && window.DATA.training;
    if (!T) {
      const empty = document.createElement('div');
      empty.className = 's3-empty';
      empty.innerHTML =
        '<p class="caption">Training data is missing, run ' +
        '<code>node precompute/build-datasets.js</code> from the viz folder ' +
        'to populate <code>data/datasets.js</code>.</p>';
      wrap.appendChild(empty);
      return {};
    }

    const init = window.MDP.initialState();
    const M = init.M, N = init.N;

    /*, Layout, */
    const layout = document.createElement('div');
    layout.className = 's3-layout';
    wrap.appendChild(layout);

    const left = document.createElement('div');
    left.className = 's3-left';
    layout.appendChild(left);

    const rail = document.createElement('div');
    rail.className = 's3-rail';
    layout.appendChild(rail);

    /* Scrubber and toggles row above the grid. */
    const ctrlRow = document.createElement('div');
    ctrlRow.className = 's3-ctrl-row';
    left.appendChild(ctrlRow);

    /* α toggle (canonical / oscillating) */
    const alphaGrp = document.createElement('div');
    alphaGrp.className = 'control-group greek';
    const alphaLbl = document.createElement('label');
    alphaLbl.className = 'greek-text';
    alphaLbl.textContent = 'α';
    alphaGrp.appendChild(alphaLbl);
    const alphaSel = document.createElement('select');
    alphaSel.innerHTML =
      '<option value="primary">0.1, converges</option>' +
      '<option value="oscillating">0.95, oscillates</option>';
    alphaGrp.appendChild(alphaSel);
    ctrlRow.appendChild(alphaGrp);

    /* View toggle */
    const viewGrp = document.createElement('div');
    viewGrp.className = 'control-group';
    const viewLbl = document.createElement('label');
    viewLbl.textContent = 'view';
    viewGrp.appendChild(viewLbl);
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';
    const viewBtns = {};
    for (const k of ['numerical', 'heatmap', 'per-action']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.view = k;
      b.textContent = k;
      viewToggle.appendChild(b);
      viewBtns[k] = b;
    }
    viewGrp.appendChild(viewToggle);
    ctrlRow.appendChild(viewGrp);

    /* Ghost-occupancy toggle */
    const occGrp = document.createElement('div');
    occGrp.className = 'control-group';
    const occBtn = document.createElement('button');
    occBtn.type = 'button';
    occBtn.className = 'toggle';
    occBtn.textContent = 'ghost occupancy';
    occGrp.appendChild(occBtn);
    ctrlRow.appendChild(occGrp);

    /* Grid host */
    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s3-grid-host';
    left.appendChild(gridHost);

    /* Scrubber */
    const scrubWrap = document.createElement('div');
    scrubWrap.className = 'scrubber';
    left.appendChild(scrubWrap);
    const scrLabel = document.createElement('span');
    scrLabel.className = 'scr-label';
    scrubWrap.appendChild(scrLabel);
    const scrInput = document.createElement('input');
    scrInput.type = 'range';
    scrInput.min = '0';
    scrInput.max = String(SNAPSHOTS.length - 1);
    scrInput.step = '1';
    scrInput.value = '0';
    scrubWrap.appendChild(scrInput);

    const scrSnaps = document.createElement('div');
    scrSnaps.className = 'scr-snapshots';
    scrubWrap.appendChild(scrSnaps);
    for (let i = 0; i < SNAPSHOTS.length; i++) {
      const el = document.createElement('span');
      el.className = 'scr-snap';
      el.dataset.idx = String(i);
      el.textContent = SNAPSHOTS[i];
      el.addEventListener('click', () => { scrInput.value = String(i); render(); });
      scrSnaps.appendChild(el);
    }

    /* Learning curve chart */
    const lcWrap = document.createElement('div');
    lcWrap.className = 's3-curve';
    left.appendChild(lcWrap);

    /* Caption */
    const cap = document.createElement('p');
    cap.className = 'caption s3-cap';
    cap.textContent =
      'Q starts at zero. After about 100 episodes, the dangerous columns are learned.';
    left.appendChild(cap);

    /* Right rail: Q-table view (numerical default) */
    const railTitle = document.createElement('div');
    railTitle.className = 'col-label';
    railTitle.textContent = 'Q-table, 21 states × 4 actions';
    rail.appendChild(railTitle);

    const qHost = document.createElement('div');
    qHost.className = 'qtable-rail s3-qhost';
    rail.appendChild(qHost);

    /*, Grid mount, */
    const grid = window.Grid.mount(gridHost, {
      M, N,
      onLayout: () => placeStatic(),
    });
    grid.setCellClass(init.start.r, init.start.c, 'start-cell', true);
    grid.setCellClass(init.star.r,  init.star.c,  'goal-cell',  true);

    function placeStatic() {
      grid.setEntity('star', { kind: 'star', r: init.star.r, c: init.star.c });
    }
    placeStatic();

    /*, Q-table view (multiple modes), */
    let viewMode = 'numerical';
    let qNumeric = null, qValue = null, qPer = null;

    function ensureQHost(mode) {
      qHost.innerHTML = '';
      if (mode === 'numerical') {
        qNumeric = window.QTable.mountNumerical(qHost, M, N, { goal: init.star });
        qValue = qPer = null;
      } else if (mode === 'heatmap') {
        qValue = window.QTable.mountValue(qHost, M, N, { showArrow: false });
        qNumeric = qPer = null;
        /* No-spoiler: scene 3 should NOT reveal argmax arrows yet; that's
           the scene-4 reveal. Per plan §6.6. */
      } else if (mode === 'per-action') {
        qPer = window.QTable.mountPerAction(qHost, M, N);
        qNumeric = qValue = null;
      }
    }
    ensureQHost('numerical');

    /*, Pick a training run + render at scrubber position, */
    function getRun() {
      return alphaSel.value === 'oscillating' ? T.oscillating : T.primary;
    }

    /* Track previous Q so we can detect which cells changed and flash them. */
    let prevQ = null;

    function render() {
      const run = getRun();
      const idx = parseInt(scrInput.value, 10);
      const ep = SNAPSHOTS[idx];
      scrLabel.textContent = 'episode ' + ep;
      for (const el of scrSnaps.querySelectorAll('.scr-snap')) {
        el.classList.toggle('active', parseInt(el.dataset.idx, 10) === idx);
      }
      const snap = run.snapshots.find(s => s.episode === ep);
      const Q = snap ? window.QTable.fromSnapshot(snap.Q) : window.SARSA.makeQ(M, N);

      /* Range over all snapshots for stable color binning. */
      let lo = Infinity, hi = -Infinity;
      for (const s of run.snapshots) {
        for (const v of s.Q) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
      if (!Number.isFinite(lo)) lo = -1;
      if (!Number.isFinite(hi)) hi =  1;
      if (lo === hi) hi = lo + 1;

      if (qNumeric) {
        qNumeric.update(Q, { lo, hi });
        if (prevQ) {
          for (let r = 0; r < M; r++) {
            for (let c = 0; c < N; c++) {
              if (r === init.star.r && c === init.star.c) continue;
              for (let a = 0; a < 4; a++) {
                const off = (r * N + c) * 4 + a;
                if (Math.abs(Q[off] - prevQ[off]) > 1e-4) {
                  qNumeric.flashCell(r, c, window.SARSA.ACTIONS[a]);
                }
              }
            }
          }
        }
      } else if (qValue) {
        qValue.update(Q, { lo, hi, showArrow: false });
      } else if (qPer) {
        qPer.update(Q, { lo, hi });
      }
      prevQ = Q.slice();

      /* Learning curve cursor. */
      curve.setData(run.episodeRewards.slice(0, ep + 1));
      curve.setCursor(ep);
    }

    /*, Learning curve, */
    const curve = window.LearningCurve.mount(lcWrap, { W: 540, H: 160, window: 50 });

    /*, Wire up controls, */
    scrInput.addEventListener('input', () => render());
    alphaSel.addEventListener('change', () => { prevQ = null; render(); });

    function setView(mode) {
      viewMode = mode;
      for (const k of Object.keys(viewBtns)) {
        viewBtns[k].classList.toggle('active', k === mode);
      }
      ensureQHost(mode);
      prevQ = null;
      render();
    }
    for (const k of Object.keys(viewBtns)) {
      viewBtns[k].addEventListener('click', () => setView(k));
    }
    setView('numerical');

    /* Ghost occupancy underlay */
    let occOn = false;
    const occGrid = (T.ghostOccupancy && T.ghostOccupancy.grid) || null;
    occBtn.addEventListener('click', () => {
      occOn = !occOn;
      occBtn.classList.toggle('active', occOn);
      grid.setGhostOccupancy(occOn ? occGrid : null);
    });

    /* &run support: not used in this scene (state is set by scrubber).
       &episode=NNN deep-link: jump to a specific snapshot. */
    function readEpisodeHash() {
      const m = (window.location.hash || '').match(/[#&?]episode=(\d+)/);
      if (!m) return null;
      const ep = parseInt(m[1], 10);
      const idx = SNAPSHOTS.indexOf(ep);
      return idx >= 0 ? idx : null;
    }
    const epIdx = readEpisodeHash();
    if (epIdx != null) scrInput.value = String(epIdx);

    /* Initial render */
    render();

    return {
      onEnter() { render(); },
      onLeave() {},
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

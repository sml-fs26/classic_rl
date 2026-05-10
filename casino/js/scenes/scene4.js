/* Scene 4 — ε-greedy.

   Same five cards plus a regret panel with two traces:
     1. Greedy (replayed at scene-3's seed) — always present, full T.
     2. ε-greedy — driven by the slider ε ∈ [0, 0.5], grown step-by-step.

   The slider changes *future* steps only. Each ε-greedy step records its own
   ε in history; rewinding and changing ε does NOT revise past steps. The
   decision-badge under the latest card-pull tells the student whether the
   most-recent decision was an explore or exploit step.

   Seed reuse: the greedy trace uses DATA.seeds.greedy — *exactly* the same
   trajectory shown in scene 3 — so the comparison is honest. The ε-greedy
   stream uses DATA.seeds.epsGreedy + the policy's own RNG so its randomness
   is independent.

   `&run` URL flag triggers Play. */

(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene4 = function (root) {
    const cfg  = window.DATA && window.DATA.bandit;
    const horz = window.DATA && window.DATA.horizons;
    const SEED_GREEDY_BAND = window.DATA.seeds.greedy;
    const SEED_GREEDY_POL  = (SEED_GREEDY_BAND ^ 0x12345678) >>> 0;
    const SEED_EPS_BAND    = window.DATA.seeds.epsGreedy;
    const SEED_EPS_POL     = (SEED_EPS_BAND ^ 0x12345678) >>> 0;
    const T = horz.autoplay;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's4-wrap';
    root.appendChild(wrap);

    /* Header */
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>ε-greedy.</h1>' +
      '<p class="subtitle">One knob, two behaviours: explore with probability ε, exploit otherwise.</p>';
    wrap.appendChild(hero);

    /* Display formula for ε-greedy */
    wrap.appendChild(Katex.display(window.DATA.tex.epsGreedy));

    /* Machine row */
    const rowHost = document.createElement('div');
    wrap.appendChild(rowHost);

    /* Latest decision badge under the row */
    const badgeStrip = document.createElement('div');
    badgeStrip.className = 's4-badge-strip';
    const badgeLabel = document.createElement('span');
    badgeLabel.className = 's4-badge-label';
    badgeLabel.textContent = 'latest';
    const badge = document.createElement('span');
    badge.className = 'decision-badge';
    badge.textContent = '—';
    badgeStrip.appendChild(badgeLabel);
    badgeStrip.appendChild(badge);
    wrap.appendChild(badgeStrip);

    /* Controls — slider + play controls */
    const controls = document.createElement('div');
    controls.className = 'controls';
    wrap.appendChild(controls);

    /* Epsilon slider */
    const epsGrp = document.createElement('div');
    epsGrp.className = 'control-group';
    const epsLabel = document.createElement('label');
    epsLabel.textContent = 'ε';
    const epsSlider = document.createElement('input');
    epsSlider.type = 'range';
    epsSlider.min = '0'; epsSlider.max = '0.5'; epsSlider.step = '0.01';
    epsSlider.value = '0.1';
    const epsOut = document.createElement('output');
    epsOut.textContent = '0.10';
    epsGrp.appendChild(epsLabel);
    epsGrp.appendChild(epsSlider);
    epsGrp.appendChild(epsOut);
    controls.appendChild(epsGrp);

    /* Play controls */
    const playGrp = document.createElement('div');
    playGrp.className = 'control-group';
    const playBtn  = makeBtn('Play',  'primary');
    const pauseBtn = makeBtn('Pause');
    const stepBtn  = makeBtn('Step');
    const resetBtn = makeBtn('Reset');
    playGrp.appendChild(playBtn);
    playGrp.appendChild(pauseBtn);
    playGrp.appendChild(stepBtn);
    playGrp.appendChild(resetBtn);
    controls.appendChild(playGrp);

    /* Speed */
    const speedGrp = document.createElement('div');
    speedGrp.className = 'control-group';
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed';
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '1'; speedSlider.max = '30'; speedSlider.step = '1';
    speedSlider.value = '12';
    const speedOut = document.createElement('output');
    speedOut.textContent = '12/s';
    speedGrp.appendChild(speedLabel);
    speedGrp.appendChild(speedSlider);
    speedGrp.appendChild(speedOut);
    controls.appendChild(speedGrp);

    /* Round counter */
    const tCounterGrp = document.createElement('div');
    tCounterGrp.className = 'control-group s4-tgrp';
    const tCounterLabel = document.createElement('label');
    tCounterLabel.textContent = 'Round';
    const tCounter = document.createElement('span');
    tCounter.className = 'control-value';
    tCounter.textContent = '0 / ' + T;
    tCounterGrp.appendChild(tCounterLabel);
    tCounterGrp.appendChild(tCounter);
    controls.appendChild(tCounterGrp);

    /* Chart */
    const chartHost = document.createElement('div');
    wrap.appendChild(chartHost);

    /* Legend */
    const legend = document.createElement('div');
    legend.className = 'regret-legend';
    legend.innerHTML =
      '<span class="legend-item"><span class="swatch regret-series-greedy"></span> greedy (ε = 0)</span>' +
      '<span class="legend-item"><span class="swatch regret-series-eps"></span> <span id="s4-eps-legend">ε-greedy (ε = 0.10)</span></span>';
    wrap.appendChild(legend);

    /* HUD strip */
    const hudStrip = document.createElement('div');
    hudStrip.className = 's4-hud-strip';
    wrap.appendChild(hudStrip);
    const hudGreedyRegret = document.createElement('span');
    hudGreedyRegret.className = 's4-hud-cell';
    hudStrip.appendChild(hudGreedyRegret);
    const hudEpsRegret = document.createElement('span');
    hudEpsRegret.className = 's4-hud-cell';
    hudStrip.appendChild(hudEpsRegret);

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent =
      'Drag ε to change future decisions. Past steps keep the ε they were sampled with.';
    wrap.appendChild(caption);

    /* ---------- Pre-render the full greedy trajectory once. Reused across resets. */
    function buildGreedyTrace() {
      const banditRng = Bandit.makeRng(SEED_GREEDY_BAND);
      const policyRng = Bandit.makeRng(SEED_GREEDY_POL);
      const b = Bandit.create(cfg.probs, banditRng);
      const policy = Policies.greedy(policyRng);
      const pts = [{ x: 0, y: 0 }];
      for (let t = 0; t < T; t++) {
        const decision = policy(b, t);
        b.pull(decision.arm);
        pts.push({ x: b.round(), y: b.cumulativeRegret() });
      }
      return pts;
    }
    const greedyTrace = buildGreedyTrace();

    /* ---------- ε-greedy state ---------- */
    let banditRng, policyRng, bandit, regretPoints;
    /* historyEps stores per-step records: { arm, reward, mode, eps, t } so a
       reset+replay reproduces the trajectory and so we can render the latest
       decision-badge correctly. */
    const historyEps = History.create();
    let currentEps = parseFloat(epsSlider.value);

    const row = MachineRow.mount(rowHost, { K: cfg.K, armNames: cfg.armNames });

    const chart = Chart.mount({ host: chartHost, T, yMax: 5, label: 'cumulative regret  R(t) = t · μ* − Σ rτ' });
    chart.setTrace('greedy', greedyTrace, 'regret-series-greedy');

    function rebuild() {
      banditRng = Bandit.makeRng(SEED_EPS_BAND);
      policyRng = Bandit.makeRng(SEED_EPS_POL);
      bandit = Bandit.create(cfg.probs, banditRng);
      regretPoints = [{ x: 0, y: 0 }];
      historyEps.reset();
      row.update(bandit);
      row.clearLastChosen();
      chart.setTrace('greedy', greedyTrace, 'regret-series-greedy');
      chart.setTrace('eps',    regretPoints, 'regret-series-eps');
      tCounter.textContent = '0 / ' + T;
      badge.className = 'decision-badge';
      badge.textContent = '—';
      hudGreedyRegret.textContent = 'greedy regret @ T: ' + greedyTrace[T].y.toFixed(2);
      hudEpsRegret.textContent    = 'ε-greedy regret: 0.00';
    }

    function stepFn(t) {
      const eps = currentEps;
      const policy = Policies.epsGreedy(eps, policyRng);
      const decision = policy(bandit);
      const reward = bandit.pull(decision.arm);
      historyEps.push({ arm: decision.arm, reward, mode: decision.mode, eps, t: bandit.round() });
      regretPoints.push({ x: bandit.round(), y: bandit.cumulativeRegret() });
      row.update(bandit);
      row.flash(decision.arm, reward === 1 ? 'win' : 'loss');
      row.setLastChosen(decision.arm);
      chart.setTrace('greedy', greedyTrace, 'regret-series-greedy');
      chart.setTrace('eps',    regretPoints, 'regret-series-eps');
      badge.className = 'decision-badge ' + decision.mode;
      badge.textContent = decision.mode + (decision.mode === 'explore' ? ' (random)' : ' (arg-max)');
      return bandit.round();
    }

    function onTick(t) {
      tCounter.textContent = t + ' / ' + T;
      hudEpsRegret.textContent = 'ε-greedy regret: ' + bandit.cumulativeRegret().toFixed(2);
      updateButtons();
    }

    function onPause() { updateButtons(); }
    function onComplete() {
      const greedyFinal = greedyTrace[T].y;
      const epsFinal    = bandit.cumulativeRegret();
      caption.textContent =
        'Done. Greedy ended with R(T) = ' + greedyFinal.toFixed(2) +
        '. ε-greedy with ε = ' + currentEps.toFixed(2) +
        ' ended with R(T) = ' + epsFinal.toFixed(2) +
        '. Try other ε on Reset.';
      updateButtons();
    }
    function onReset() {
      rebuild();
      caption.textContent =
        'Drag ε to change future decisions. Past steps keep the ε they were sampled with.';
      updateButtons();
    }

    const engine = Autoplay.create({
      maxSteps: T,
      stepFn, onTick, onPause, onComplete, onReset,
      speed: 12,
    });

    function updateButtons() {
      const playing = engine.isPlaying();
      const t = engine.currentT();
      playBtn.disabled  = playing || t >= T;
      pauseBtn.disabled = !playing;
      stepBtn.disabled  = playing || t >= T;
      resetBtn.disabled = (t === 0 && !playing);
    }

    speedSlider.addEventListener('input', (e) => {
      speedOut.textContent = e.target.value + '/s';
    });
    epsSlider.addEventListener('input', (e) => {
      currentEps = parseFloat(e.target.value);
      epsOut.textContent = currentEps.toFixed(2);
      const lbl = document.getElementById('s4-eps-legend');
      if (lbl) lbl.textContent = 'ε-greedy (ε = ' + currentEps.toFixed(2) + ')';
    });

    engine.attachControls({ playBtn, pauseBtn, stepBtn, resetBtn, speedSlider });

    function shouldAutoRun() { return /[#&?]run\b/.test(window.location.hash); }

    function onEnter() {
      rebuild();
      updateButtons();
      if (shouldAutoRun()) setTimeout(() => playBtn.click(), 200);
    }
    function onLeave() {
      engine.dispose();
    }
    onEnter();

    return {
      onEnter,
      onLeave,
    };
  };

  function makeBtn(label, klass) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (klass) b.classList.add(klass);
    return b;
  }
})();

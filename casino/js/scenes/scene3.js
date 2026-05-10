/* Scene 3 — Greedy fails.

   Pure greedy (ε = 0) for the autoplay horizon (DATA.horizons.autoplay = 200).
   Five cards plus a regret panel. Play / Pause / Step / Reset / speed control.
   The trace grows; if greedy commits early to a sub-optimal arm, the regret
   line becomes visibly **linear** — the headline lesson.

   Seed pinned at DATA.seeds.greedy. The same seed is reused by scene 4 to
   replay this trace alongside ε-greedy (per plan §4 #5).

   `&run` URL flag triggers Play for headless verification. */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene3 = function (root) {
    const cfg  = window.DATA && window.DATA.bandit;
    const horz = window.DATA && window.DATA.horizons;
    const SEED_BAND = window.DATA && window.DATA.seeds && window.DATA.seeds.greedy;
    /* Independent stream for the greedy policy's tie-break randomness. */
    const SEED_POL = (SEED_BAND ^ 0x12345678) >>> 0;
    const T = horz.autoplay;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's3-wrap';
    root.appendChild(wrap);

    /* Header */
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Greedy fails.</h1>' +
      '<p class="subtitle">Always pick the arm with the highest empirical mean. Watch what happens.</p>';
    wrap.appendChild(hero);

    /* Machine row */
    const rowHost = document.createElement('div');
    wrap.appendChild(rowHost);

    /* Controls */
    const controls = document.createElement('div');
    controls.className = 'controls';
    wrap.appendChild(controls);

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

    const tCounterGrp = document.createElement('div');
    tCounterGrp.className = 'control-group s3-tgrp';
    const tCounterLabel = document.createElement('label');
    tCounterLabel.textContent = 'Round';
    const tCounter = document.createElement('span');
    tCounter.className = 'control-value';
    tCounter.textContent = '0 / ' + T;
    tCounterGrp.appendChild(tCounterLabel);
    tCounterGrp.appendChild(tCounter);
    controls.appendChild(tCounterGrp);

    /* Regret formula + chart */
    const regretFormula = Katex.display(window.DATA.tex.regret);
    wrap.appendChild(regretFormula);

    const chartHost = document.createElement('div');
    wrap.appendChild(chartHost);

    /* HUD strip below the chart */
    const hudStrip = document.createElement('div');
    hudStrip.className = 's3-hud-strip';
    wrap.appendChild(hudStrip);

    const hudTotal = document.createElement('span');
    hudTotal.className = 's3-hud-cell';
    hudStrip.appendChild(hudTotal);

    const hudRegret = document.createElement('span');
    hudRegret.className = 's3-hud-cell';
    hudStrip.appendChild(hudRegret);

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent =
      'Greedy commits early to whichever arm got lucky first. With T = ' + T +
      ' rounds, that decision has plenty of time to compound.';
    wrap.appendChild(caption);

    /* ---------- State ---------- */
    let banditRng, policyRng, bandit, policy, regretPoints;

    const row = MachineRow.mount(rowHost, { K: cfg.K, armNames: cfg.armNames });

    const chart = Chart.mount({ host: chartHost, T, yMax: 5, label: 'cumulative regret  R(t) = t · μ* − Σ rτ' });

    function rebuild() {
      banditRng = Bandit.makeRng(SEED_BAND);
      policyRng = Bandit.makeRng(SEED_POL);
      bandit = Bandit.create(cfg.probs, banditRng);
      policy = Policies.greedy(policyRng);
      regretPoints = [{ x: 0, y: 0 }];
      row.update(bandit);
      row.clearLastChosen();
      chart.setTrace('greedy', regretPoints, 'regret-series-greedy');
      tCounter.textContent = '0 / ' + T;
      hudTotal.textContent  = 'total reward: 0';
      hudRegret.textContent = 'regret: 0.00';
    }

    function stepFn(t) {
      const decision = policy(bandit, t);
      const arm = decision.arm;
      const reward = bandit.pull(arm);
      regretPoints.push({ x: bandit.round(), y: bandit.cumulativeRegret() });
      row.update(bandit);
      row.flash(arm, reward === 1 ? 'win' : 'loss');
      row.setLastChosen(arm);
      chart.setTrace('greedy', regretPoints, 'regret-series-greedy');
      return bandit.round();
    }

    function onTick(t) {
      tCounter.textContent = t + ' / ' + T;
      hudTotal.textContent  = 'total reward: ' + bandit.totalReward();
      hudRegret.textContent = 'regret: ' + bandit.cumulativeRegret().toFixed(2);
      updateButtons();
    }

    function onPause() { updateButtons(); }
    function onComplete() {
      caption.innerHTML =
        'Done. The line is roughly straight — that is <em>linear regret</em>: ' +
        'every round costs the same on average. Greedy never recovers from its early commitment.';
      updateButtons();
    }
    function onReset() {
      rebuild();
      caption.textContent =
        'Greedy commits early to whichever arm got lucky first. With T = ' + T +
        ' rounds, that decision has plenty of time to compound.';
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

    /* Wire controls */
    speedSlider.addEventListener('input', (e) => {
      speedOut.textContent = e.target.value + '/s';
    });
    const detach = engine.attachControls({ playBtn, pauseBtn, stepBtn, resetBtn, speedSlider });

    /* `&run` triggers Play for headless verification. */
    function shouldAutoRun() { return /[#&?]run\b/.test(window.location.hash); }

    function onEnter() {
      rebuild();
      updateButtons();
      if (shouldAutoRun()) setTimeout(() => playBtn.click(), 200);
    }
    function onLeave() {
      engine.dispose();   /* clear interval — SKILL §"persistent widget caveat" */
    }
    onEnter();

    return {
      onEnter,
      onLeave,
      _shared: () => ({   /* exposed for scene 4 to capture seeds */
        SEED_BAND, SEED_POL, T, regretPoints, totalReward: bandit && bandit.totalReward(),
      }),
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

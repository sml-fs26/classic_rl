/* Scene 3 — the Robbins-Monro update.

   Same dual-track layout, same observation stream, but the estimator is
       x_{n+1} = x_n + α (s_n - x_n)
   with a slider on α (default 0.1). The estimate now *tracks* the
   oscillating bullseye, with lag inversely proportional to α. The slider
   changes
   future steps only — past estimates aren't retro-actively recomputed,
   matching how a student would experiment in the notebook.

   This scene's caption arc:
   - n=0   "Same data. Now we update each round, not just average."
   - n=30  "α controls how fast the estimate moves toward each new sample."
   - n=120 "Smaller α — smoother but slower. Larger α — twitchier."
   - n=T   "Tracking, not lagging. Next: how do we pick α?" */
(function () {
  if (!window.scenes) window.scenes = {};

  function shouldAutoRun() { return /[#&?]run\b/.test(window.location.hash); }
  function shouldInstant() { return /[#&?]instant\b/.test(window.location.hash); }

  const STEP_MS = 60;

  window.scenes.scene3 = function (root) {
    const data = window.DATA;
    const T = (data.params && data.params.sceneCounts && data.params.sceneCounts.rm) || 200;
    const initialEstimate = (data.params && data.params.initialEstimate) || 50;
    const ALPHA_DEFAULT = (data.alpha && data.alpha.defaultRM) || 0.1;

    /* ---- DOM ---- */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's3-wrap';

    const intro = document.createElement('p');
    intro.className = 'caption';
    intro.textContent =
      "Same data. Now: keep an estimate that moves toward each new announcement.";
    wrap.appendChild(intro);

    const truthHost = document.createElement('div');
    truthHost.className = 's3-truth-host';
    wrap.appendChild(truthHost);

    const beliefHost = document.createElement('div');
    beliefHost.className = 's3-belief-host';
    wrap.appendChild(beliefHost);

    /* The Robbins-Monro update — large, centered. */
    const formula = window.Katex.display(data.tex.rmUpdate);
    formula.classList.add('s3-formula');
    wrap.appendChild(formula);

    /* Dynamic caption */
    const dyn = document.createElement('p');
    dyn.className = 'caption s3-dyn';
    dyn.textContent = 'Press Play. Try the α slider.';
    wrap.appendChild(dyn);

    /* Controls: play/step/reset + α slider + counter + tracking error */
    const controls = document.createElement('div');
    controls.className = 'controls s3-controls';

    const playGroup = document.createElement('div'); playGroup.className = 'control-group';
    const playBtn = document.createElement('button'); playBtn.type='button'; playBtn.className='primary'; playBtn.textContent='play';
    const stepBtn = document.createElement('button'); stepBtn.type='button'; stepBtn.textContent='step';
    const resetBtn = document.createElement('button'); resetBtn.type='button'; resetBtn.textContent='reset';
    playGroup.appendChild(playBtn);
    playGroup.appendChild(stepBtn);
    playGroup.appendChild(resetBtn);
    controls.appendChild(playGroup);

    const alphaGroup = document.createElement('div'); alphaGroup.className = 'control-group';
    const alphaLabel = document.createElement('label'); alphaLabel.textContent = 'α';
    const alphaSlider = document.createElement('input');
    alphaSlider.type = 'range';
    alphaSlider.min = '0.01'; alphaSlider.max = '1.00'; alphaSlider.step = '0.01';
    alphaSlider.value = String(ALPHA_DEFAULT);
    const alphaOut = document.createElement('output');
    alphaOut.textContent = ALPHA_DEFAULT.toFixed(2);
    alphaGroup.appendChild(alphaLabel);
    alphaGroup.appendChild(alphaSlider);
    alphaGroup.appendChild(alphaOut);
    controls.appendChild(alphaGroup);

    const counterGroup = document.createElement('div'); counterGroup.className='control-group';
    counterGroup.appendChild(Object.assign(document.createElement('label'), { textContent: 'throw' }));
    const counterOut = document.createElement('output');
    counterOut.textContent = `0 / ${T}`;
    counterGroup.appendChild(counterOut);
    controls.appendChild(counterGroup);

    const errGroup = document.createElement('div'); errGroup.className='control-group';
    errGroup.appendChild(Object.assign(document.createElement('label'), { textContent: 'tracking error' }));
    const errOut = document.createElement('output');
    errOut.textContent = '—';
    errGroup.appendChild(errOut);
    controls.appendChild(errGroup);

    wrap.appendChild(controls);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote s3-foot';
    foot.innerHTML =
      'α is the <em>learning rate</em>: the fraction of each new sample folded ' +
      'into the estimate. Slide it from 0.01 (cautious) to 1.00 (just copy ' +
      'the latest sample) and watch the trade-off.';
    wrap.appendChild(foot);

    root.appendChild(wrap);

    /* ---- Tracks ---- */
    const truth = window.Track.mount({
      host: truthHost,
      label: 'truth — oscillating bullseye',
      showBullseye: true, showEstimate: false, showChips: true, chipLabelLast: 4,
    });
    const belief = window.Track.mount({
      host: beliefHost,
      label: 'belief — RM estimate  x̂ₙ',
      showBullseye: false, showEstimate: true, showChips: false, showPlayer: false,
    });
    beliefHost.classList.add('belief');

    /* ---- State ---- */
    let n = 0;
    let estimate = initialEstimate;
    let alpha = ALPHA_DEFAULT;
    let timer = null;
    let absErrSum = 0;

    function reset() {
      stop();
      n = 0;
      estimate = initialEstimate;
      absErrSum = 0;
      truth.clearChips();
      truth.setBullseye(data.bullseyeTrace[0]);
      truth.setPlayer(data.playerTrace[0]);
      belief.setEstimate(estimate);
      counterOut.textContent = `0 / ${T}`;
      errOut.textContent = '—';
      dyn.textContent = 'Press Play. Try the α slider.';
    }

    function tick() {
      if (n >= T) { stop(); dyn.textContent =
        `After ${T} throws, RM with α=${alpha.toFixed(2)} sits ${Math.abs(estimate - data.bullseyeTrace[T-1]).toFixed(1)} ` +
        `units off the current bullseye. Compare against the sample mean.`;
        return;
      }
      const i = n;
      const obs = data.observationTrace[i];
      const bull = data.bullseyeTrace[i];
      const player = data.playerTrace[i];
      n += 1;
      estimate = estimate + alpha * (obs - estimate);
      absErrSum += Math.abs(estimate - bull);

      truth.setBullseye(bull);
      truth.setPlayer(player);
      truth.addChip({ pos: player, score: data.scoreTrace[i], maxChips: 18 });
      belief.setEstimate(estimate);

      counterOut.textContent = `${n} / ${T}`;
      errOut.textContent = (absErrSum / n).toFixed(2);

      if (n === 30)  dyn.textContent = "Each new sample nudges the estimate by α · (sample − estimate).";
      if (n === 120) dyn.textContent = "Smaller α: smoother but slower. Larger α: twitchier.";
      if (n === T-10) dyn.textContent = "Tracking, not lagging. Next: how do we pick α?";
    }

    function play() { if (!timer) { playBtn.textContent='pause'; timer = setInterval(tick, STEP_MS); } }
    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = (n>=T)?'done':'play'; }

    playBtn.addEventListener('click', () => {
      if (timer) stop();
      else if (n >= T) reset();
      else play();
    });
    stepBtn.addEventListener('click', () => { stop(); tick(); });
    resetBtn.addEventListener('click', reset);
    alphaSlider.addEventListener('input', () => {
      alpha = parseFloat(alphaSlider.value);
      alphaOut.textContent = alpha.toFixed(2);
    });

    reset();
    if (shouldInstant() && shouldAutoRun()) {
      for (let i = 0; i < T; i++) tick();
    } else if (shouldAutoRun()) {
      setTimeout(() => playBtn.click(), 200);
    }

    return {
      onEnter() { reset(); },
      onLeave() { stop(); },
    };
  };
})();

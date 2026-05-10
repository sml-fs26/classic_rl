/* Scene 4 — the α trade-off.

   Three estimators run side-by-side on the same observation stream:
     - α = small  (e.g. 0.04) — slow, lagging
     - α = large  (e.g. 0.65) — fast, noisy
     - α decaying (notebook schedule α₀/(1+n/τ)) — wins overall
   The estimators see the same s_n, so the difference is entirely the
   schedule. The dual-track layout mirrors scenes 2/3, with three estimate
   carets on the belief track. Below the tracks is a time-series chart
   showing all four traces (truth + three estimators) so the student sees
   the full trajectory, not just the current head.

   The two Robbins-Monro conditions
       Σ α_n = ∞     and     Σ α_n² < ∞
   are rendered as a small inset with the caption "the Robbins-Monro
   conditions". A footnote ties α_n = 1/n to Casino's empirical mean.

   Driving model: autoplay (play/pause/step/reset). T = 300 from DATA. */
(function () {
  if (!window.scenes) window.scenes = {};

  function shouldAutoRun() { return /[#&?]run\b/.test(window.location.hash); }
  function shouldInstant() { return /[#&?]instant\b/.test(window.location.hash); }

  const STEP_MS = 40;

  window.scenes.scene4 = function (root) {
    const data = window.DATA;
    const T = (data.params && data.params.sceneCounts && data.params.sceneCounts.tradeoff) || 300;
    const initialEstimate = (data.params && data.params.initialEstimate) || 50;
    const A_SMALL = (data.alpha && data.alpha.fixedSmall) || 0.04;
    const A_LARGE = (data.alpha && data.alpha.fixedLarge) || 0.65;
    const A0 = (data.alpha && data.alpha.decayAlpha0) || 0.7;
    const TAU = (data.alpha && data.alpha.decayTau) || 25;

    /* ---- DOM ---- */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's4-wrap';

    const intro = document.createElement('p');
    intro.className = 'caption';
    intro.textContent =
      "Same data, three schedules. Small α lags. Large α tracks but jitters. " +
      "Decaying α catches up fast and settles down.";
    wrap.appendChild(intro);

    const truthHost = document.createElement('div');
    truthHost.className = 's4-truth-host';
    wrap.appendChild(truthHost);

    const beliefHost = document.createElement('div');
    beliefHost.className = 's4-belief-host';
    wrap.appendChild(beliefHost);

    /* Legend, sits between belief track and chart so the colors are
       introduced before the eye scans the chart. */
    const legend = document.createElement('div');
    legend.className = 'trace-legend s4-legend';
    legend.innerHTML =
      '<span class="legend-item"><span class="legend-swatch truth"></span><span class="legend-text">truth</span></span>' +
      `<span class="legend-item"><span class="legend-swatch trace-fixed-small"></span><span class="legend-text">α = ${A_SMALL.toFixed(2)} (small)</span></span>` +
      `<span class="legend-item"><span class="legend-swatch trace-fixed-large"></span><span class="legend-text">α = ${A_LARGE.toFixed(2)} (large)</span></span>` +
      `<span class="legend-item"><span class="legend-swatch trace-decay"></span><span class="legend-text">α<sub>n</sub> = ${A0}/(1 + n/${TAU}) (decay)</span></span>`;
    wrap.appendChild(legend);

    /* Chart */
    const chartHost = document.createElement('div');
    chartHost.className = 's4-chart-host';
    wrap.appendChild(chartHost);

    /* RM-conditions inset */
    const condBox = document.createElement('div');
    condBox.className = 's4-cond';
    const condTitle = document.createElement('div');
    condTitle.className = 's4-cond-title';
    condTitle.textContent = 'the Robbins-Monro conditions';
    condBox.appendChild(condTitle);
    const condRow = document.createElement('div');
    condRow.className = 's4-cond-row';
    condRow.appendChild(window.Katex.inline(data.tex.rmConditionA));
    const sep = document.createElement('span');
    sep.className = 's4-cond-sep';
    sep.textContent = '·';
    condRow.appendChild(sep);
    condRow.appendChild(window.Katex.inline(data.tex.rmConditionB));
    condBox.appendChild(condRow);
    const condCaption = document.createElement('div');
    condCaption.className = 's4-cond-caption';
    condCaption.textContent =
      'Both conditions hold for α_n = 1/n and for α_n = α₀/(1+n/τ). ' +
      'A constant α satisfies neither — it never settles.';
    condBox.appendChild(condCaption);
    wrap.appendChild(condBox);

    /* Tracking-error readout */
    const errBox = document.createElement('div');
    errBox.className = 'controls s4-controls';
    function makeStatGroup(label) {
      const g = document.createElement('div'); g.className = 'control-group';
      g.appendChild(Object.assign(document.createElement('label'), { textContent: label }));
      const out = document.createElement('output');
      out.textContent = '—';
      g.appendChild(out);
      return { g, out };
    }
    const playGroup = document.createElement('div'); playGroup.className='control-group';
    const playBtn = document.createElement('button'); playBtn.type='button'; playBtn.className='primary'; playBtn.textContent='play';
    const stepBtn = document.createElement('button'); stepBtn.type='button'; stepBtn.textContent='step';
    const resetBtn = document.createElement('button'); resetBtn.type='button'; resetBtn.textContent='reset';
    [playBtn, stepBtn, resetBtn].forEach(b => playGroup.appendChild(b));
    errBox.appendChild(playGroup);

    const counterGroup = document.createElement('div'); counterGroup.className='control-group';
    counterGroup.appendChild(Object.assign(document.createElement('label'), { textContent: 'throw' }));
    const counterOut = document.createElement('output'); counterOut.textContent = `0 / ${T}`;
    counterGroup.appendChild(counterOut);
    errBox.appendChild(counterGroup);

    const errSmall = makeStatGroup('mean err — small α');
    const errLarge = makeStatGroup('mean err — large α');
    const errDecay = makeStatGroup('mean err — decay');
    errBox.appendChild(errSmall.g);
    errBox.appendChild(errLarge.g);
    errBox.appendChild(errDecay.g);
    wrap.appendChild(errBox);

    /* Footnote tying back to Casino. */
    const foot = document.createElement('p');
    foot.className = 'footnote s4-foot';
    foot.innerHTML =
      'With α<sub>n</sub> = 1/n the RM update <em>is</em> the empirical mean ' +
      'from the Casino viz — the same one that lagged in scene 2. The decay ' +
      'we want here shrinks more gently: aggressive at first, calm at the tail.';
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
      label: 'belief — three estimators',
      showBullseye: false, showEstimate: true, showChips: false, showPlayer: false,
      traceClasses: ['trace-fixed-small', 'trace-fixed-large', 'trace-decay'],
    });
    beliefHost.classList.add('belief');

    /* ---- Chart ---- */
    const chart = window.Chart.mount({
      host: chartHost,
      N: T,
      yMin: 0, yMax: 100,
      label: 'positions over throws',
    });

    /* ---- State ---- */
    let n = 0;
    let xS = initialEstimate;   // small α
    let xL = initialEstimate;   // large α
    let xD = initialEstimate;   // decay
    let timer = null;
    let sumErrS = 0, sumErrL = 0, sumErrD = 0;
    /* For the chart, accumulate point arrays. */
    let truthPts = [], smallPts = [], largePts = [], decayPts = [];

    function reset() {
      stop();
      n = 0;
      xS = xL = xD = initialEstimate;
      sumErrS = sumErrL = sumErrD = 0;
      truthPts = []; smallPts = []; largePts = []; decayPts = [];
      truth.clearChips();
      truth.setBullseye(data.bullseyeTrace[0]);
      truth.setPlayer(data.playerTrace[0]);
      belief.setEstimate(xS, 0);
      belief.setEstimate(xL, 1);
      belief.setEstimate(xD, 2);
      counterOut.textContent = `0 / ${T}`;
      errSmall.out.textContent = '—';
      errLarge.out.textContent = '—';
      errDecay.out.textContent = '—';
      chart.clear();
    }

    function tick() {
      if (n >= T) { stop(); return; }
      const i = n;
      const obs = data.observationTrace[i];
      const bull = data.bullseyeTrace[i];
      const player = data.playerTrace[i];
      n += 1;

      xS = xS + A_SMALL * (obs - xS);
      xL = xL + A_LARGE * (obs - xL);
      const aD = A0 / (1 + n / TAU);
      xD = xD + aD * (obs - xD);

      sumErrS += Math.abs(xS - bull);
      sumErrL += Math.abs(xL - bull);
      sumErrD += Math.abs(xD - bull);

      truth.setBullseye(bull);
      truth.setPlayer(player);
      truth.addChip({ pos: player, score: data.scoreTrace[i], maxChips: 14 });
      belief.setEstimate(xS, 0);
      belief.setEstimate(xL, 1);
      belief.setEstimate(xD, 2);

      truthPts.push({ x: i, y: bull });
      smallPts.push({ x: i, y: xS });
      largePts.push({ x: i, y: xL });
      decayPts.push({ x: i, y: xD });
      /* Re-render every step is cheap because polylines are single nodes.
         The truth trace is drawn LAST so it sits on top — it's the anchor
         the eye returns to when reading the estimator traces. */
      chart.setTrace('small',     smallPts, 'trace-fixed-small');
      chart.setTrace('large',     largePts, 'trace-fixed-large');
      chart.setTrace('decay',     decayPts, 'trace-decay');
      chart.setTrace('truth',     truthPts, 'truth');

      counterOut.textContent = `${n} / ${T}`;
      errSmall.out.textContent = (sumErrS / n).toFixed(2);
      errLarge.out.textContent = (sumErrL / n).toFixed(2);
      errDecay.out.textContent = (sumErrD / n).toFixed(2);
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

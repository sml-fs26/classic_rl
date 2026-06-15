/* Scene 6, Return G_t. Fix (AGING, empty bin) and a chosen FIRST lever (ORDER
   vs RUN), then play OPTIMALLY for a 12-turn quarter and stack the quarter
   totals into a histogram. ORDER (acquire protection) earns a higher mean; RUN
   (gamble) has a fatter LOSING tail (an empty-bin failure books -8). The running
   mean converges to the precomputed reference. Live Monte-Carlo; cold-entry
   safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const D = window.DATA || {};
  const policy = D.policy || [];
  const RB = D.returnBars || {};
  const START = (RB.startIdx != null) ? RB.startIdx : (1 * M.NS + 0);   // (AGING, 0)
  const TURNS = (RB.turns) || 12;

  /* one quarter: forced first lever, then optimal */
  function quarter(firstLeverId, rng) {
    let s = M.stateFromIndex(START), first = true, g = 0;
    for (let t = 0; t < TURNS; t++) {
      const leverId = first ? firstLeverId : policy[M.stateIndex(s)];
      first = false;
      const out = M.sample(s, leverId, rng);
      g += out.reward; s = out.sNext;
    }
    return g;
  }

  window.scenes.scene6 = function (root) {
    root.className = 'scene scene-pad sc6';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene6.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene6.lede') + '</p>' +
      '<div class="formula-card sc6-formula">' +
        '<div class="formula-label">' + T('scene6.formulaLabel') + '</div>' +
        '<div class="sc6-formula-host"></div>' +
      '</div>' +
      '<p class="sc6-setup muted">' + T('scene6.setup') + '</p>' +
      '<div class="cs-btn-row sc6-ctrls">' +
        '<button class="cs-btn sc6-first primary" data-lever="order" type="button">' + T('scene6.firstOrder') + '</button>' +
        '<button class="cs-btn sc6-first" data-lever="run" type="button">' + T('scene6.firstRun') + '</button>' +
        '<span class="sc6-gap"></span>' +
        '<button class="cs-btn sc6-run" type="button">' + T('scene6.run') + '</button>' +
        '<button class="cs-btn sc6-run1" type="button">' + T('scene6.run1') + '</button>' +
        '<button class="cs-btn sc6-reset" type="button">' + T('scene6.reset') + '</button>' +
      '</div>' +
      '<div class="sc6-board">' +
        '<div class="sc6-stats hud-strip">' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.quarters') + '</span><span class="hud-val tnum" id="sc6-n">0</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.mean') + '</span><span class="hud-val tnum pos" id="sc6-mean">--</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.worst') + '</span><span class="hud-val tnum neg" id="sc6-worst">--</span></div>' +
        '</div>' +
        '<div class="sc6-hist" id="sc6-hist"></div>' +
        '<div class="sc6-axis"><span id="sc6-lo">-</span><span class="muted">' + T('scene6.axis') + '</span><span id="sc6-hi">-</span></div>' +
      '</div>' +
      '<p class="sc6-note muted">' + T('scene6.note') + '</p>' +
      '<div class="poke-box sc6-framing">' + T('scene6.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.return) || 'G_i = \\sum_j \\gamma^{j-i} r_j',
      root.querySelector('.sc6-formula-host'), true);

    let firstLever = 'order';
    let n = 0, sum = 0, worst = Infinity;
    let rng = M.makeRng((Math.random() * 1e9) >>> 0);

    /* fixed histogram domain so the two strategies are comparable on one axis */
    const LO = -16, HI = 30, NB = 23;
    const bins = new Array(NB).fill(0);
    function binOf(g) { let b = Math.floor((g - LO) / (HI - LO) * (NB - 1)); if (b < 0) b = 0; if (b >= NB) b = NB - 1; return b; }

    const histEl = root.querySelector('#sc6-hist');
    function buildHist() {
      histEl.innerHTML = '';
      for (let b = 0; b < NB; b++) {
        const bar = document.createElement('div');
        const lo = LO + b / (NB - 1) * (HI - LO);
        bar.className = 'sc6-bar' + (lo < 0 ? ' neg' : '');
        bar.innerHTML = '<span class="sc6-bar-fill"></span>';
        histEl.appendChild(bar);
      }
      root.querySelector('#sc6-lo').textContent = LO;
      root.querySelector('#sc6-hi').textContent = '+' + HI;
    }
    function paintHist() {
      const max = Math.max(1, ...bins);
      const fills = histEl.querySelectorAll('.sc6-bar-fill');
      for (let b = 0; b < NB; b++) fills[b].style.height = (bins[b] / max * 100).toFixed(1) + '%';
    }
    function refresh() {
      root.querySelector('#sc6-n').textContent = String(n);
      root.querySelector('#sc6-mean').textContent = n ? ((sum / n >= 0 ? '+' : '') + (sum / n).toFixed(1)) : '--';
      root.querySelector('#sc6-worst').textContent = n ? String(worst) : '--';
      paintHist();
    }
    function reset() {
      n = 0; sum = 0; worst = Infinity; for (let b = 0; b < NB; b++) bins[b] = 0;
      rng = M.makeRng((Math.random() * 1e9) >>> 0);
      buildHist(); refresh();
    }
    function runMany(count) {
      for (let i = 0; i < count; i++) {
        const g = quarter(firstLever, rng);
        n++; sum += g; if (g < worst) worst = g;
        bins[binOf(g)]++;
      }
      refresh();
    }

    root.querySelectorAll('.sc6-first').forEach((b) => {
      b.addEventListener('click', () => {
        firstLever = b.dataset.lever;
        root.querySelectorAll('.sc6-first').forEach(x => x.classList.toggle('primary', x === b));
        reset();
      });
    });
    root.querySelector('.sc6-run').addEventListener('click', () => runMany(300));
    root.querySelector('.sc6-run1').addEventListener('click', () => runMany(1));
    root.querySelector('.sc6-reset').addEventListener('click', reset);

    reset();
    if (window.CS && window.CS.run) { rng = M.makeRng(7); runMany(300); }

    return { onEnter() { refresh(); } };
  };
})();

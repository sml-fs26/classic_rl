/* Scene 6 -- Return to the deadline (the return G and its spread).
 *
 *   G_i(tau) = sum_{j >= i} r_j  -- the total cash a run brings in from a
 *   chosen point to the deadline. The manager point: a lever is not one
 *   good night; its payoff is a DISTRIBUTION, and the spread is the risk
 *   you carry into the deadline.
 *
 *   We fix ONE situation (5 units, 1 day) and ONE lever, then sample the
 *   run MANY times with window.Pricing.sample, stacking each return into a
 *   histogram. With one day left the run terminates at midnight, so the
 *   return is the single reward price * min(k, u): PREMIUM lands on 0 or 5
 *   (mostly 0); STANDARD clusters in the middle; FIRE-SALE clusters higher
 *   and tighter. Same situation, same lever, yet G lands all over a range.
 *
 *   (We draw a purpose-built discrete histogram here rather than the
 *   line-chart in js/chart.js -- a return distribution wants bars, not a
 *   trend line.)
 *
 *   Cold entry: rebuilds from window.Pricing / window.Levers.
 *   &run: auto-stacks a batch of returns for the default lever (headless). */
(function () {
  if (!window.scenes) window.scenes = {};

  const P = window.Pricing;
  const L = window.Levers;
  const T = (k, v) => window.I18N.t(k, v);

  /* The fixed experiment situation. */
  const FIX = { u: 5, d: 1 };
  const LEVERS = L.LEVER_IDS;   // premium, standard, firesale
  const BATCH = 50;

  function leverName(id) { return T('lever.' + id); }

  /* All possible returns for (FIX, lever): one day left => G = reward of a
     single draw = price * min(k, u). Used to lay out the histogram bins so
     the x-axis is stable as samples accumulate. */
  function possibleReturns(leverId) {
    const lever = L.LEVER_BY_ID[leverId];
    const set = new Set();
    for (const kp of lever.demand) set.add(lever.price * Math.min(kp[0], FIX.u));
    return Array.from(set).sort((a, b) => a - b);
  }

  window.scenes.scene6 = function (root) {
    root.className = 'scene-pad concept-scene scene6';
    root.innerHTML = '';

    /* ---- Heading + lede ---- */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = T('scene6.title');
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene6.lede');
    root.appendChild(lede);

    /* ---- Formula card: G_i(tau) = sum r_j ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene6.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      (window.DATA && window.DATA.tex && window.DATA.tex.return) ||
        String.raw`G_i(\tau) \;=\; \textstyle\sum_{j \ge i} r_j`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene6.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- The fixed-experiment setup row: FROM <shelf> PULL <lever picker> ---- */
    const setup = document.createElement('div');
    setup.className = 's6-setup';
    setup.innerHTML = '<div class="s6-setup-label">' + T('scene6.setup.label') + '</div>';

    const setupRow = document.createElement('div');
    setupRow.className = 's6-setup-row';

    /* FROM <shelf card> */
    const fromBox = document.createElement('div');
    fromBox.className = 's6-from';
    fromBox.innerHTML = '<div class="s6-mini-label">' + T('scene6.setup.from') + '</div>';
    fromBox.appendChild(window.ShelfCard.render(FIX, { size: 'sm', label: true }));
    setupRow.appendChild(fromBox);

    /* PULL <lever picker> */
    const pullBox = document.createElement('div');
    pullBox.className = 's6-pull';
    pullBox.innerHTML = '<div class="s6-mini-label">' + T('scene6.setup.pull') + '</div>';
    const picker = document.createElement('div');
    picker.className = 's6-picker';
    for (const id of LEVERS) {
      const b = document.createElement('button');
      b.className = 'lever-tag s6-lever-btn';
      b.setAttribute('data-lever', id);
      b.dataset.lever = id;
      b.textContent = leverName(id);
      picker.appendChild(b);
    }
    pullBox.appendChild(picker);
    setupRow.appendChild(pullBox);

    setup.appendChild(setupRow);
    root.appendChild(setup);

    /* ---- Histogram panel ---- */
    const histWrap = document.createElement('div');
    histWrap.className = 's6-hist-wrap';
    histWrap.innerHTML =
      '<div class="s6-hist-head">' +
        '<span class="s6-hist-title">' + T('scene6.hist.title') + '</span>' +
        '<span class="s6-stats" id="s6-stats">' + T('scene6.stats.empty') + '</span>' +
      '</div>' +
      '<div class="s6-hist" id="s6-hist"></div>' +
      '<div class="s6-hist-x">' + T('scene6.hist.x') + '</div>';
    root.appendChild(histWrap);

    /* ---- Controls ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's6-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s6-run">' + T('scene6.btn.run') + '</button>' +
      '<button class="poke-btn" id="s6-reset">' + T('scene6.btn.reset') + '</button>';
    root.appendChild(ctrls);

    /* ---- Per-lever takeaway ---- */
    const take = document.createElement('p');
    take.className = 'concept-note s6-take';
    take.id = 's6-take';
    root.appendChild(take);

    const note = document.createElement('p');
    note.className = 'concept-note';
    note.innerHTML = T('scene6.spread.note');
    root.appendChild(note);

    /* ===== State ===== */
    let leverId = 'premium';
    let samples = [];
    let rng = P.makeRng(0x6E11);

    const histEl  = histWrap.querySelector('#s6-hist');
    const statsEl = histWrap.querySelector('#s6-stats');
    const takeEl  = take;
    const runBtn  = ctrls.querySelector('#s6-run');
    const resetBtn= ctrls.querySelector('#s6-reset');

    function setActiveLever(id) {
      leverId = id;
      picker.querySelectorAll('.s6-lever-btn').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.lever === id));
      takeEl.innerHTML = T('scene6.take.' + id);
    }

    /* One return from (FIX, lever): single draw, capped at inventory. With
       one day left this is the whole episode, so G = that reward. */
    function sampleOneReturn() {
      const out = P.sample({ u: FIX.u, d: FIX.d, terminal: false }, leverId, rng);
      return out.reward;   // terminal after one day -> return is this reward
    }

    function drawBatch(n) {
      for (let i = 0; i < n; i++) samples.push(sampleOneReturn());
      renderHist();
    }

    function renderHist() {
      const bins = possibleReturns(leverId);
      const counts = {};
      bins.forEach((b) => { counts[b] = 0; });
      for (const g of samples) counts[g] = (counts[g] || 0) + 1;
      const maxCount = Math.max(1, ...bins.map((b) => counts[b]));

      let html = '';
      for (const b of bins) {
        const c = counts[b] || 0;
        const pct = (c / maxCount) * 100;
        const frac = samples.length ? Math.round((c / samples.length) * 100) : 0;
        html +=
          '<div class="s6-bin">' +
            '<div class="s6-bar-track">' +
              '<div class="s6-bar lever-fill-' + leverId + '" style="height:' + pct.toFixed(1) + '%">' +
                (c > 0 ? '<span class="s6-bar-count">' + c + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="s6-bin-x">$' + b + '</div>' +
            '<div class="s6-bin-frac">' + (samples.length ? frac + '%' : '') + '</div>' +
          '</div>';
      }
      histEl.innerHTML = html;

      if (samples.length === 0) {
        statsEl.textContent = T('scene6.stats.empty');
        return;
      }
      const sum = samples.reduce((a, b) => a + b, 0);
      const mean = sum / samples.length;
      const lo = Math.min.apply(null, samples);
      const hi = Math.max.apply(null, samples);
      statsEl.textContent = T('scene6.stats', {
        n: samples.length,
        mean: '$' + mean.toFixed(2),
        lo: '$' + lo, hi: '$' + hi,
      });

      /* Mean marker: place a vertical tick across the bins at the mean's
         x-position (bins are evenly spaced). */
      const idxLo = bins[0], idxHi = bins[bins.length - 1];
      const span = (idxHi - idxLo) || 1;
      const leftPct = ((mean - idxLo) / span) * 100;
      const meanEl = document.createElement('div');
      meanEl.className = 's6-mean';
      meanEl.style.left = 'calc(' + leftPct.toFixed(1) + '% )';
      meanEl.innerHTML = '<span class="s6-mean-tag">' + T('scene6.mean.tag') + ' $' + mean.toFixed(2) + '</span>';
      histEl.appendChild(meanEl);
    }

    function reset() {
      samples = [];
      rng = P.makeRng((0x6E11 + ((Math.random() * 0xffff) | 0)) >>> 0);
      renderHist();
    }

    /* Lever picker: switching the lever resets the samples (they are
       conditioned on the chosen lever). */
    picker.querySelectorAll('.s6-lever-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.lever;
        if (id === leverId) return;
        setActiveLever(id);
        samples = [];
        renderHist();
        if (window.SFX) window.SFX.play('cursor');
      });
    });

    runBtn.addEventListener('click', () => drawBatch(BATCH));
    resetBtn.addEventListener('click', reset);

    /* Initial paint. */
    setActiveLever('premium');
    renderHist();

    /* &run: stack a batch for headless capture. */
    if (window.PRICING_AUTORUN) setTimeout(() => drawBatch(BATCH * 2), 150);

    return {
      onEnter() { renderHist(); },
      onLeave() {},
      /* Right arrow = stack one more batch; never consumes once empty so the
         pager can advance. */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

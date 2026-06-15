/* Scene 6, Return G_t. From (2,4) fix the first lever (WAIT or SEND) then play
   optimally, and drop each window's total into a histogram. WAIT-first gives a
   spread (mostly +5, a few -10); SEND-first a certain 0. A live sampler stacks
   bars toward the precomputed distribution; the mean is Q*((2,4), firstLever).
   Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.Dock;
  const DATA = window.DATA;

  window.scenes.scene6 = function (root) {
    root.className = 'scene scene-pad sc6 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene6.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene6.lede') + '</p>' +
      '<div class="formula-card compact"><div class="sc6-tex"></div></div>' +
      '<div class="btd-btn-row sc6-switch">' +
        '<button class="btd-btn sc6-first-wait active" type="button">' + T('scene6.switchWait') + '</button>' +
        '<button class="btd-btn sc6-first-send" type="button">' + T('scene6.switchSend') + '</button>' +
      '</div>' +
      '<div class="sc6-hist-title muted" id="sc6-hist-title"></div>' +
      '<div class="sc6-hist" id="sc6-hist"></div>' +
      '<div class="btd-btn-row sc6-controls">' +
        '<button class="btd-btn sc6-one" type="button">' + T('scene6.sample') + '</button>' +
        '<button class="btd-btn sc6-fifty" type="button">' + T('scene6.sample50') + '</button>' +
        '<div class="hud-strip sc6-stats">' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.meanLabel') + '</span><span class="hud-val tnum" id="sc6-mean">0</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.runs') + '</span><span class="hud-val tnum" id="sc6-runs">0</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="formula-note sc6-note">' + T('scene6.note') + '</div>' +
      '<div class="poke-box sc6-framing">' + T('scene6.framing') + '</div>';

    if (window.Katex) window.Katex.render(DATA.tex.return, root.querySelector('.sc6-tex'), true);

    const histEl = root.querySelector('#sc6-hist');
    const titleEl = root.querySelector('#sc6-hist-title');
    const meanEl = root.querySelector('#sc6-mean');
    const runsEl = root.querySelector('#sc6-runs');
    const waitBtn = root.querySelector('.sc6-first-wait');
    const sendBtn = root.querySelector('.sc6-first-send');

    /* Histogram buckets: the possible window returns from (2,4). Union of both
       distributions: -10, 0, +5 (WAIT can also reach +10? no, ship max 4 ->
       5*4-10=10 only if a pallet arrives twice; cap the bins from the data). */
    let firstLever = 'wait';
    let counts = {};           // ret -> count
    let runs = 0, sum = 0;
    let rng = D.makeRng((Math.random() * 1e9) >>> 0);

    function binsFor(lever) {
      const hist = DATA.returnBars[lever].hist;
      return hist.map(b => b.ret);
    }
    function resetHist() {
      counts = {}; runs = 0; sum = 0;
      const bins = binsFor(firstLever);
      for (const b of bins) counts[b] = 0;
      rng = D.makeRng((Math.random() * 1e9) >>> 0);
      renderHist();
      meanEl.textContent = '0'; meanEl.className = 'hud-val tnum';
      runsEl.textContent = '0';
      titleEl.textContent = firstLever === 'wait' ? T('scene6.histTitle') : T('scene6.histTitleSend');
    }
    function renderHist() {
      const bins = Object.keys(counts).map(Number).sort((a, b) => a - b);
      const maxC = Math.max(1, ...bins.map(b => counts[b]));
      let html = '';
      for (const b of bins) {
        const c = counts[b];
        const pct = (c / maxC) * 100;
        const cls = b < 0 ? 'neg' : (b > 0 ? 'pos' : 'zero');
        html += '<div class="sc6-bar-col">' +
          '<div class="sc6-bar-wrap"><div class="sc6-bar ' + cls + '" style="height:' + pct.toFixed(1) + '%"></div></div>' +
          '<div class="sc6-bar-count tnum">' + c + '</div>' +
          '<div class="sc6-bar-label ' + cls + '">' + (b > 0 ? '+' : '') + b + '</div>' +
        '</div>';
      }
      histEl.innerHTML = html;
    }
    function runOne(animate) {
      let s = { p: 2, h: 4, terminal: false }, guard = 0, g = 0, first = true;
      while (!s.terminal && guard++ < 50) {
        const aId = first ? firstLever : DATA.policy[D.stateIndex(s)];
        first = false;
        const out = D.sample(s, aId, rng);
        g += out.reward;
        s = out.sNext;
      }
      if (!(g in counts)) counts[g] = 0;
      counts[g]++; runs++; sum += g;
      const mean = sum / runs;
      meanEl.textContent = (mean > 0 ? '+' : '') + mean.toFixed(2);
      meanEl.className = 'hud-val tnum ' + (mean > 0 ? 'pos' : (mean < 0 ? 'neg' : ''));
      runsEl.textContent = String(runs);
      if (animate) renderHist();
    }
    function runMany(n) { for (let i = 0; i < n; i++) runOne(false); renderHist(); }

    root.querySelector('.sc6-one').addEventListener('click', () => runOne(true));
    root.querySelector('.sc6-fifty').addEventListener('click', () => runMany(50));
    waitBtn.addEventListener('click', () => { firstLever = 'wait'; waitBtn.classList.add('active'); sendBtn.classList.remove('active'); resetHist(); });
    sendBtn.addEventListener('click', () => { firstLever = 'send'; sendBtn.classList.add('active'); waitBtn.classList.remove('active'); resetHist(); });

    resetHist();

    if (window.BTD && window.BTD.run) setTimeout(() => runMany(50), 200);

    return {};
  };
})();

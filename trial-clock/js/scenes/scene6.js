/* Scene 6 -- Return G_t. Fix a mid-adoption user (tier 2, day 4) and a chosen
   FIRST lever (PUSH or NUDGE), then play OPTIMALLY afterward and stack the
   RETURNS (sum of rewards over the rest of the trial) into a histogram: PUSH
   spikes at +20 (BUY), clusters near 0 (IGNORE then later), with a -5 tail
   (ABANDON). The spread is the point; the running mean converges to Q*(s, first
   lever). Live Monte-Carlo; cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Trial, D = window.DATA || {};
  const policy = D.policy || [];
  const START_TIER = (D.returnBars && D.returnBars.startTier) != null ? D.returnBars.startTier : 2;
  const START_DAYS = (D.returnBars && D.returnBars.startDays) != null ? D.returnBars.startDays : 4;

  /* Bucket a return into one of the labelled bars. */
  const BUCKETS = [
    { key: 'abandon', test: (g, hitAbandon) => hitAbandon },
    { key: 'cost',    test: (g) => g < 0 },          // nudged then expired (negative, no convert)
    { key: 'zero',    test: (g) => g === 0 },         // ignored then expired
    { key: 'convert', test: (g, ha, hc) => hc },      // hit BUY -> +20 (minus any nudge cost)
  ];

  /* one episode: forced first lever at (tier2,day4), then optimal */
  function episode(firstLeverId, rng) {
    let s = { tier: START_TIER, days: START_DAYS, terminal: false };
    let first = true, guard = 0, g = 0, hitAbandon = false, hitConvert = false;
    while (!s.terminal && guard++ < 20) {
      const leverId = first ? firstLeverId : policy[G.stateIndex(s)];
      first = false;
      const out = G.sample(s, leverId, rng);
      g += out.reward;
      if (out.sNext.abandon) hitAbandon = true;
      if (out.sNext.convert) hitConvert = true;
      s = out.sNext;
    }
    return { g, hitAbandon, hitConvert };
  }
  function bucketOf(r) {
    if (r.hitConvert) return 'convert';
    if (r.hitAbandon) return 'abandon';
    if (r.g < 0) return 'cost';
    return 'zero';
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
      '<div class="tc-btn-row sc6-ctrls">' +
        '<button class="tc-btn sc6-first primary" data-lever="push" type="button">' + T('scene6.startPush') + '</button>' +
        '<button class="tc-btn sc6-first" data-lever="nudge" type="button">' + T('scene6.startNudge') + '</button>' +
        '<span class="sc6-gap"></span>' +
        '<button class="tc-btn sc6-run" type="button">' + T('scene6.run') + '</button>' +
        '<button class="tc-btn sc6-run1" type="button">' + T('scene6.run1') + '</button>' +
        '<button class="tc-btn sc6-reset" type="button">' + T('scene6.reset') + '</button>' +
      '</div>' +
      '<div class="sc6-board">' +
        '<div class="sc6-stats hud-strip">' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.attempts') + '</span><span class="hud-val tnum" id="sc6-n">0</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.mean') + '</span><span class="hud-val tnum pos" id="sc6-mean">--</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.exact') + '</span><span class="hud-val tnum" id="sc6-ex">--</span></div>' +
        '</div>' +
        '<div class="sc6-hist" id="sc6-hist"></div>' +
      '</div>' +
      '<p class="sc6-note muted">' + T('scene6.note') + '</p>' +
      '<div class="poke-box sc6-framing">' + T('scene6.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.return) || 'G_i = \\sum_{j \\ge i} r_j',
      root.querySelector('.sc6-formula-host'), true);

    /* build the 4-bar histogram */
    const histEl = root.querySelector('#sc6-hist');
    const BAR_KEYS = ['abandon', 'cost', 'zero', 'convert'];
    const BAR_LABEL = { abandon: T('scene6.barAbandon'), cost: T('scene6.barCost'), zero: T('scene6.barZero'), convert: T('scene6.barConvert') };
    histEl.innerHTML = BAR_KEYS.map(k =>
      '<div class="sc6-bar-wrap"><div class="sc6-bar-col"><div class="sc6-bar-fill bar-' + k + '" id="sc6-bar-' + k + '"></div></div>' +
      '<div class="sc6-bar-count tnum" id="sc6-cnt-' + k + '">0</div>' +
      '<div class="sc6-bar-lab">' + BAR_LABEL[k] + '</div></div>').join('');

    let firstLever = 'push';
    let n = 0, total = 0;
    const counts = { abandon: 0, cost: 0, zero: 0, convert: 0 };
    let rng = G.makeRng((Math.random() * 1e9) >>> 0);

    function exactFor(id) {
      const sp = D.returnBars && D.returnBars[id];
      return sp && sp.exact != null ? sp.exact : 0;
    }
    function refresh() {
      root.querySelector('#sc6-n').textContent = String(n);
      const mean = n ? total / n : 0;
      const mEl = root.querySelector('#sc6-mean');
      mEl.textContent = n ? mean.toFixed(2) : '--';
      mEl.classList.toggle('pos', mean >= 0); mEl.classList.toggle('neg', mean < 0);
      root.querySelector('#sc6-ex').textContent = exactFor(firstLever).toFixed(2);
      const maxC = Math.max(1, counts.abandon, counts.cost, counts.zero, counts.convert);
      for (const k of BAR_KEYS) {
        const h = (counts[k] / maxC) * 100;
        root.querySelector('#sc6-bar-' + k).style.height = h.toFixed(1) + '%';
        root.querySelector('#sc6-cnt-' + k).textContent = String(counts[k]);
      }
    }
    function reset() {
      n = 0; total = 0; counts.abandon = counts.cost = counts.zero = counts.convert = 0;
      rng = G.makeRng((Math.random() * 1e9) >>> 0);
      refresh();
    }
    function runMany(count) {
      for (let i = 0; i < count; i++) {
        const r = episode(firstLever, rng);
        n++; total += r.g; counts[bucketOf(r)]++;
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
    if (window.TC && window.TC.run) { rng = G.makeRng(7); runMany(300); }

    return { onEnter() { refresh(); } };
  };
})();

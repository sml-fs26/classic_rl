/* Scene 6: RETURN, the whole-horizon score.
 *
 *     G_i(tau) = sum_{j >= i} r_j
 *
 *   The return is every month's lever cost summed with the one terminal
 *   lump, over the WHOLE renewal horizon (no discount, so it is just
 *   addition). Manager meaning first: ROI is not this month's discount
 *   line, it is the total payoff over the horizon, and it is a
 *   DISTRIBUTION, not a single number. The only fair question is "what is
 *   the average payoff if I play this way?"
 *
 *   Two panels:
 *     1. A worked G expansion on one concrete sampled run: r1 + r2 + ...
 *        laid out as a sum that lands on a single number, so "sum the tape"
 *        is concrete.
 *     2. The payoff distribution: fix one start + one playbook, run it many
 *        times, and draw the histogram of returns G. Renewals pile up near
 *        +20 minus a few costs; churns pile up down near -20. A mu line
 *        marks the mean. Switch the playbook (DO NOTHING / CHECK-IN / BIG
 *        OFFER) and the whole distribution shifts.
 *
 *   All returns are sampled live from window.Churn; nothing is hand typed.
 *   We deliberately do NOT reveal which playbook is optimal here.
 */
(function () {
  window.scenes = window.scenes || {};

  const Churn = window.Churn;
  const Levers = window.Levers;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const START = { tier: 2, m: 4, terminal: false };   // LUKEWARM, 4 mo
  const PLAYBOOKS = ['nothing', 'checkin', 'offer'];

  function leverName(id) { return T('lever.' + id); }
  function leverShort(id) { return T('lever.short.' + id); }
  function tierShort(tier) { return T('tier.short.' + Churn.TIERS[tier]); }
  function fmtSigned(v) { return (v >= 0 ? '+' : '−') + Math.abs(v); }

  /* Roll one episode under a fixed lever, returning the per-month rewards
     and the terminal kind. Return G = sum of all rewards. */
  function rollReturn(leverId, rng) {
    let s = { tier: START.tier, m: START.m, terminal: false };
    const rewards = [];
    let renewed = false, churned = false;
    for (let guard = 0; guard < 12; guard++) {
      const out = Churn.sample(s, leverId, rng);
      rewards.push(out.reward);
      if (out.terminal) { renewed = out.renewed; churned = out.churned; break; }
      s = out.sNext;
    }
    let G = 0;
    for (const r of rewards) G += r;
    return { rewards: rewards, G: G, renewed: renewed, churned: churned };
  }

  window.scenes.scene6 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'scene6-scene');
    root.innerHTML = '';

    /* ---- heading + manager hook ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene.title6');
    root.appendChild(heading);

    const hook = document.createElement('div');
    hook.className = 'concept-hook';
    hook.innerHTML = T('scene6.manager');
    root.appendChild(hook);

    /* ---- formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene6.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(String.raw`G_i(\tau) \;=\; \sum_{j \ge i}\, r_j`, fhost, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene6.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- worked expansion of one sampled run ---- */
    const exWrap = document.createElement('div');
    exWrap.className = 'ret-expansion-wrap';
    exWrap.innerHTML =
      '<div class="ret-panel-title">' + T('scene6.expansion.title') + '</div>' +
      '<div class="ret-expansion" id="ret-expansion"></div>' +
      '<button class="poke-btn ret-resample" id="ret-resample">' + T('scene6.btn.resample') + '</button>';
    root.appendChild(exWrap);

    /* ---- distribution panel ---- */
    const distWrap = document.createElement('div');
    distWrap.className = 'ret-dist-wrap';
    distWrap.innerHTML =
      '<div class="ret-panel-title">' + T('scene6.dist.title') + '</div>' +
      '<div class="ret-playbook-row">' +
        '<span class="ret-playbook-lab">' + T('scene6.dist.playbook') + '</span>' +
        PLAYBOOKS.map((id) =>
          '<button class="ret-playbook-btn ' + Levers.tokenClass(id) +
            (id === 'checkin' ? ' active' : '') + '" data-lever="' + id + '">' +
            leverName(id) +
          '</button>'
        ).join('') +
      '</div>' +
      '<div class="ret-stats" id="ret-stats"></div>' +
      '<div class="ret-hist" id="ret-hist"></div>' +
      '<div class="ret-hist-axis" id="ret-hist-axis"></div>' +
      '<div class="ret-dist-controls">' +
        '<button class="poke-btn" id="ret-run20">' + T('scene6.btn.run20') + '</button>' +
        '<button class="poke-btn" id="ret-run200">' + T('scene6.btn.run200') + '</button>' +
        '<button class="poke-btn" id="ret-clear">' + T('scene6.btn.clear') + '</button>' +
      '</div>';
    root.appendChild(distWrap);

    /* ---- punchline ---- */
    const punch = document.createElement('div');
    punch.className = 'concept-key-question';
    punch.innerHTML = T('scene6.punch');
    root.appendChild(punch);

    /* ---- state ---- */
    let exSeed = (0x6E7 + Math.floor(Math.random() * 0xFFFF)) >>> 0;
    let distLever = 'checkin';
    let samples = [];                 // array of G values
    let distSeed = (0xD157 + Math.floor(Math.random() * 0xFFFF)) >>> 0;

    /* --- worked expansion --- */
    function renderExpansion() {
      exSeed = (exSeed + 0x9E3779B1) >>> 0;
      const rng = Churn.makeRng(exSeed);
      const ep = rollReturn('checkin', rng);
      const host = document.getElementById('ret-expansion');
      if (!host) return;

      const symParts = ep.rewards.map((_, j) => 'r<sub>' + (j + 1) + '</sub>');
      const numParts = ep.rewards.map((r) => '<span class="ret-r">(' + fmtSigned(r) + ')</span>');
      const cls = ep.G >= 0 ? 'pos' : 'neg';
      const termTag = ep.renewed
        ? '<span class="ret-term renewed">' + T('terminal.renewed') + '</span>'
        : '<span class="ret-term churned">' + T('terminal.churned') + '</span>';

      host.innerHTML =
        '<div class="ret-exp-line"><span class="ret-lhs">G<sub>1</sub>(τ)</span> = ' +
          symParts.join(' + ') + '</div>' +
        '<div class="ret-exp-line ret-nums"><span class="ret-eq">=</span> ' +
          numParts.join(' <span class="ret-plus">+</span> ') + '</div>' +
        '<div class="ret-exp-line ret-final"><span class="ret-eq">=</span> ' +
          '<span class="ret-result ' + cls + '">' + fmtSigned(ep.G) + '</span> ' + termTag +
          '<span class="ret-exp-note">' + T('scene6.expansion.note') + '</span></div>';
    }

    /* --- distribution: histogram bins of G --- */
    function sampleMore(n) {
      for (let i = 0; i < n; i++) {
        distSeed = (distSeed + 0x9E3779B1) >>> 0;
        const rng = Churn.makeRng(distSeed);
        samples.push(rollReturn(distLever, rng).G);
      }
      renderHist();
    }

    function renderHist() {
      const statsEl = document.getElementById('ret-stats');
      const hist = document.getElementById('ret-hist');
      const axis = document.getElementById('ret-hist-axis');
      if (!hist || !statsEl || !axis) return;

      if (samples.length === 0) {
        statsEl.innerHTML = '<span class="ret-stats-empty">' + T('scene6.stats.empty') + '</span>';
        hist.innerHTML = '<div class="ret-hist-empty">' + T('scene6.hist.empty') + '</div>';
        axis.innerHTML = '';
        return;
      }

      /* Fixed return axis: worst case is a churn with the priciest path,
         best is a renewal with no spend. Bin width 2 over [-28, +22]. */
      const LO = -28, HI = 22, BIN = 2;
      const nBins = Math.round((HI - LO) / BIN);
      const bins = new Array(nBins).fill(0);
      let sum = 0, lo = Infinity, hi = -Infinity, renew = 0;
      for (const g of samples) {
        sum += g; if (g < lo) lo = g; if (g > hi) hi = g;
        if (g > 0) renew++;
        let bi = Math.floor((g - LO) / BIN);
        if (bi < 0) bi = 0; if (bi >= nBins) bi = nBins - 1;
        bins[bi]++;
      }
      const mean = sum / samples.length;
      const maxCount = Math.max.apply(null, bins) || 1;
      const renewPct = Math.round(100 * renew / samples.length);

      statsEl.innerHTML =
        '<span class="ret-stat"><b>' + samples.length + '</b> ' + T('scene6.stats.runs') + '</span>' +
        '<span class="ret-stat ret-stat-mean">' + T('scene6.stats.mean') +
          ' <b class="' + (mean >= 0 ? 'pos' : 'neg') + '">' + (mean >= 0 ? '+' : '−') +
          Math.abs(mean).toFixed(2) + '</b></span>' +
        '<span class="ret-stat">' + T('scene6.stats.range') + ' <b>' +
          fmtSigned(lo) + ' … ' + fmtSigned(hi) + '</b></span>' +
        '<span class="ret-stat">' + T('scene6.stats.renewrate') + ' <b>' + renewPct + '%</b></span>';

      /* Bars: one per bin, height proportional to count. Bins straddling
         positive returns are tinted green (renewals), negative red
         (churns); the zero edge separates them. A mu line marks the mean. */
      let html = '<div class="ret-mean-line"></div>';
      for (let b = 0; b < nBins; b++) {
        const binLo = LO + b * BIN;
        const c = bins[b];
        const h = Math.round(100 * c / maxCount);
        const tint = binLo >= 0 ? 'pos' : 'neg';
        const lbl = c > 0 ? '<span class="ret-bar-count">' + c + '</span>' : '';
        html +=
          '<div class="ret-bar-slot">' +
            '<div class="ret-bar ' + tint + (c === 0 ? ' empty' : '') + '" ' +
              'style="height:' + h + '%">' + lbl + '</div>' +
          '</div>';
      }
      hist.innerHTML = html;

      /* mu marker positioned along the axis. */
      const meanFrac = Math.min(1, Math.max(0, (mean - LO) / (HI - LO)));
      const zeroFrac = (0 - LO) / (HI - LO);
      hist.style.setProperty('--mean-x', (meanFrac * 100).toFixed(2) + '%');
      hist.style.setProperty('--zero-x', (zeroFrac * 100).toFixed(2) + '%');

      /* Axis ticks: LO, churn lump, 0, renewal lump, HI. */
      axis.innerHTML =
        '<span style="left:' + (((-20 - LO) / (HI - LO)) * 100).toFixed(1) + '%">' +
          T('scene6.axis.churn') + '</span>' +
        '<span style="left:' + (zeroFrac * 100).toFixed(1) + '%">0</span>' +
        '<span style="left:' + (((20 - LO) / (HI - LO)) * 100).toFixed(1) + '%">' +
          T('scene6.axis.renew') + '</span>';
    }

    function setLever(id) {
      if (id === distLever) return;
      distLever = id;
      samples = [];
      distWrap.querySelectorAll('.ret-playbook-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-lever') === id);
      });
      renderHist();
      sampleMore(60);
    }

    /* ---- wire up ---- */
    document.getElementById('ret-resample').addEventListener('click', renderExpansion);
    document.getElementById('ret-run20').addEventListener('click', () => sampleMore(20));
    document.getElementById('ret-run200').addEventListener('click', () => sampleMore(200));
    document.getElementById('ret-clear').addEventListener('click', () => { samples = []; renderHist(); });
    distWrap.querySelectorAll('.ret-playbook-btn').forEach((b) => {
      b.addEventListener('click', () => setLever(b.getAttribute('data-lever')));
    });

    /* initial paint */
    renderExpansion();
    renderHist();

    /* &run / cold entry: seed the distribution so the histogram is
       populated for headless capture and on first view. */
    sampleMore(120);

    return {
      onNextKey() { sampleMore(20); return true; },
      onPrevKey() { return false; },
    };
  };
})();

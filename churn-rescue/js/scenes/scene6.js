/* Scene 6: RETURN, the whole-horizon score, and E[G_t] as a weighted sum.
 *
 *     G_i(tau) = sum_{j >= i} r_j      (no discount: just addition)
 *
 *   Manager meaning first: ROI is not this month's discount line, it is the
 *   total payoff over the renewal horizon, and from one playbook you get a
 *   DISTRIBUTION, not a single number. The only fair question is "what is the
 *   average payoff if I play this way?" That average has a name: E[G_t].
 *
 *   Four pieces, stacked:
 *
 *     1. G formula card: the return G_i(tau) = sum_{j>=i} r_j.
 *     2. The TRAJECTORY TREE + its weighted-leaf ledger (window.TrajTree),
 *        on the same hero root scene 5 introduced (ON THE CLIFF, m=1, BIG
 *        OFFER). This is the heart of the scene: E[G_t] is DEFINED, visibly,
 *        as the weighted sum over the leaves,
 *            E[G_t] = sum_leaves P(path) * G_t(path),
 *        and the ledger lands the number. Hovering/clicking a ledger row
 *        lights that leaf's root-to-leaf path: "one trajectory = one path."
 *        For this root the sum is +11.20 = Q*, which a callout states
 *        explicitly: G_t -> E[G_t] -> Q* in one frame.
 *     3. A worked G expansion on one concrete sampled run (LUKEWARM start,
 *        CHECK-IN every month): r1 + r2 + ... landing on a single number.
 *     4. The payoff distribution: fix one start + one playbook, run it many
 *        times, draw the histogram of returns G. The running mean mu now has
 *        a TARGET LINE to converge to: the exact fixed-action E[G] computed
 *        from the tree (deep enumeration), so the empirical mean visibly
 *        walks toward the computed value.
 *
 *   All returns are sampled live from window.Churn; nothing is hand typed.
 */
(function () {
  window.scenes = window.scenes || {};

  const Churn  = window.Churn;
  const Levers = window.Levers;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const START = { tier: 2, m: 4, terminal: false };   // LUKEWARM, 4 mo
  const PLAYBOOKS = ['nothing', 'checkin', 'offer'];

  /* The hero root from scene 5: the ledger reads against a tree the student
     already knows. ON THE CLIFF, m=1, BIG OFFER (the optimal lever there). */
  const HERO_ROOT  = { tier: 0, m: 1, terminal: false };
  const HERO_LEVER = 'offer';

  function leverName(id)  { return T('lever.' + id); }
  function leverShort(id) { return T('lever.short.' + id); }
  function tierShort(tier) { return T('tier.short.' + Churn.TIERS[tier]); }
  function fmtSigned(v) { return (v >= 0 ? '+' : '−') + Math.abs(v); }

  /* Account-card node renderer for the tree (shared shape with scene 5).
     ZERO new icon art: reuses window.AccountCard. Terminals get the
     renewed/churned glyph. */
  function makeRenderNode() {
    return function renderNode(state, ctx) {
      const host = ctx.el;
      if (state && state.terminal) {
        const renewed = !!state.renewed;
        host.parentNode && host.parentNode.classList.add(renewed ? 'renewed' : 'churned');
        host.innerHTML =
          '<div class="tt-leaf-final ' + (renewed ? 'renewed' : 'churned') + '">' +
            '<span class="tt-leaf-glyph">' + (renewed ? '✓' : '✗') + '</span>' +
            '<span class="tt-leaf-word">' +
              T(renewed ? 'terminal.renewed_short' : 'terminal.churned_short') +
            '</span>' +
          '</div>';
        return;
      }
      const cardHost = document.createElement('div');
      cardHost.className = 'tt-account';
      host.appendChild(cardHost);
      window.AccountCard.mount(cardHost, {
        tier: state.tier, m: state.m, size: ctx.role === 'root' ? 'full' : 'mini',
      });
    };
  }

  /* Exact fixed-action E[G] from START, computed by enumerating the full
     chance tree under a constant lever to a depth deep enough that every
     leaf is terminal. This is the TARGET the empirical histogram mean
     converges to (the lever is held fixed every month). */
  function fixedActionValue(lever) {
    try {
      const tree = window.TrajTree.build(START, {
        successors: Churn.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: Churn.stateKey,
        expandPolicy: () => lever,
        maxDepth: 80, gamma: 1, maxLeaves: 1e9, pPrune: 0, merge: true,
      });
      return tree.EG;
    } catch (e) { return null; }
  }

  /* Roll one episode under a fixed lever; return G = sum of all rewards. */
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

    /* ---- G formula card ---- */
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

    /* ---- the trajectory tree + weighted-leaf ledger (the centerpiece) ---- */
    const egLabel = document.createElement('div');
    egLabel.className = 'obj-eg-label';
    egLabel.innerHTML = T('scene6.eg.label', {
      state: tierShort(HERO_ROOT.tier) + ' · ' + T('months.short', { n: HERO_ROOT.m }),
      lever: '<b class="' + Levers.tokenClass(HERO_LEVER) + '">' + leverName(HERO_LEVER) + '</b>',
    });
    root.appendChild(egLabel);

    const treeHost = document.createElement('div');
    treeHost.className = 'obj-tree-host';
    root.appendChild(treeHost);

    /* Ground-truth Q*(HERO_ROOT, HERO_LEVER) for the in-code honesty
       assertion AND the on-screen "= Q*" callout. */
    let groundTruth = null, policy = null;
    try {
      const A = window.DATA.leverIds.length;
      const si = Churn.stateIndex(HERO_ROOT);
      groundTruth = window.DATA.Qstar[si * A + window.DATA.leverIds.indexOf(HERO_LEVER)];
      policy = window.DATA.policy;
    } catch (e) { /* cold-entry fallback: no assertion / callout number */ }

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: Churn.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: Churn.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_LEVER,
      expandPolicy: policy ? (s) => policy[Churn.stateIndex(s)] : (() => HERO_LEVER),
      maxDepth: 2, maxLeaves: 12, gamma: 1,
      renderNode: makeRenderNode(),
      actionLabel: (leverId) => leverName(leverId),
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* "= Q*" callout: the weighted leaf sum the ledger just computed IS the
       optimal action-value here. Closes G_t -> E[G_t] -> Q*. */
    const egTie = document.createElement('div');
    egTie.className = 'obj-eg-tie';
    egTie.innerHTML = T('scene6.eg.tie', {
      eg: window.TrajTree._fmt.fmtSigned2(tt.getEG()),
      state: tierShort(HERO_ROOT.tier) + ' · ' + T('months.short', { n: HERO_ROOT.m }),
      lever: leverName(HERO_LEVER),
    });
    root.appendChild(egTie);

    /* ---- worked expansion of one sampled run ---- */
    const exWrap = document.createElement('div');
    exWrap.className = 'ret-expansion-wrap';
    exWrap.innerHTML =
      '<div class="ret-panel-title">' + T('scene6.expansion.title') + '</div>' +
      '<div class="ret-expansion" id="ret-expansion"></div>' +
      '<button class="poke-btn ret-resample" id="ret-resample">' + T('scene6.btn.resample') + '</button>';
    root.appendChild(exWrap);

    /* ---- distribution panel (empirical companion, with a target line) ---- */
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
    let targetEG = fixedActionValue(distLever);   // the line mu converges to

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

      const tgtStr = (targetEG != null) ? window.TrajTree._fmt.fmtSigned2(targetEG) : '?';

      if (samples.length === 0) {
        statsEl.innerHTML = '<span class="ret-stats-empty">' + T('scene6.stats.empty') +
          ' · ' + T('scene6.stats.target', { target: tgtStr }) + '</span>';
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
        '<span class="ret-stat ret-stat-target">' + T('scene6.stats.target', { target: tgtStr }) + '</span>' +
        '<span class="ret-stat">' + T('scene6.stats.renewrate') + ' <b>' + renewPct + '%</b></span>';

      /* Bars: one per bin, height proportional to count. Bins straddling
         positive returns are tinted green (renewals), negative red (churns);
         the zero edge separates them. A mu line marks the empirical mean, a
         target line marks the tree's computed E[G]. */
      let html = '<div class="ret-mean-line"></div><div class="ret-target-line"></div>';
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

      /* mu + target markers positioned along the axis. */
      const meanFrac = Math.min(1, Math.max(0, (mean - LO) / (HI - LO)));
      const zeroFrac = (0 - LO) / (HI - LO);
      hist.style.setProperty('--mean-x', (meanFrac * 100).toFixed(2) + '%');
      hist.style.setProperty('--zero-x', (zeroFrac * 100).toFixed(2) + '%');
      if (targetEG != null) {
        const tgtFrac = Math.min(1, Math.max(0, (targetEG - LO) / (HI - LO)));
        hist.style.setProperty('--target-x', (tgtFrac * 100).toFixed(2) + '%');
        hist.classList.add('has-target');
      } else {
        hist.classList.remove('has-target');
      }

      /* Axis ticks: churn lump, 0, renewal lump. */
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
      targetEG = fixedActionValue(distLever);
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

    /* &run / cold entry: seed the distribution so the histogram is populated
       for headless capture and on first view. */
    sampleMore(120);

    return {
      onNextKey() { sampleMore(20); return true; },
      onPrevKey() { return false; },
    };
  };
})();

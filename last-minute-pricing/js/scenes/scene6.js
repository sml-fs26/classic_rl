/* Scene 6 -- Return G, the objective E[G], and the value of a lever.
 *
 *   G_i(tau) = sum_{j >= i} r_j -- the total cash a run brings in from a
 *   chosen point to the deadline. A lever is not one good night; its payoff is
 *   a DISTRIBUTION over runs, and E[G] averages that distribution into ONE
 *   honest number.
 *
 *   The heart of the scene is the TRAJECTORY TREE + its weighted-leaf ledger
 *   (window.TrajTree). E[G] is DEFINED, visibly, as the weighted sum over the
 *   leaves of the same hero tree scene 5 introduced (2 units, 2 days, fixed
 *   STANDARD):
 *
 *       E[G] = sum over leaves of P(path) * G(path).
 *
 *   Hovering / tapping a ledger row lights that leaf's root-to-leaf path:
 *   "one trajectory = one path." For this hero root the sum is $5.22, which a
 *   callout states IS Q*(2u/2d, STANDARD): G -> E[G] -> Q* in one frame.
 *
 *   Below, the EMPIRICAL companion: sample whole runs from the same opening
 *   under the same playbook and stack their returns into a histogram. The
 *   running mean has a TARGET LINE -- the ledger's computed E[G] = $5.22 --
 *   so the learner watches the empirical mean walk toward the computed value.
 *
 *   Cold entry: rebuilds from window.Pricing / window.Levers / window.DATA.
 *   &run: mounts the tree+ledger and stacks a batch of returns (headless). */
(function () {
  if (!window.scenes) window.scenes = {};

  const P = window.Pricing;
  const L = window.Levers;
  const T = (k, v) => window.I18N.t(k, v);

  /* The hero tree: the same near-terminal root scene 5 introduced, so the
     ledger reads against a tree the student already knows. */
  const HERO_ROOT = { u: 2, d: 2, terminal: false };
  const HERO_LEVER = 'standard';

  function leverName(id) { return T('lever.' + id); }

  function policyLever(s) {
    const pol = (window.DATA && window.DATA.policy) || null;
    if (pol) { const id = pol[P.stateIndex(s)]; if (id && L.LEVER_BY_ID[id]) return id; }
    return 'standard';
  }

  /* Compact state-icon renderer for the tree nodes (shared shape with scene 5).
     ZERO new icon art: reuses window.ShelfCard; terminals draw a tight badge. */
  function makeRenderNode() {
    return function renderNode(state, ctx) {
      const host = ctx.el;
      const role = ctx.role;
      if (state && state.terminal) {
        const soldout = !!state.soldout;
        host.parentNode && host.parentNode.classList.add(soldout ? 'win' : 'loss');
        host.innerHTML =
          '<div class="tt-pr-final ' + (soldout ? 'soldout' : 'deadline') + '">' +
            '<span class="tt-pr-glyph">' + (soldout ? '✓' : '☾') + '</span>' +
            '<span class="tt-pr-word">' +
              (soldout ? T('vocab.soldout') : T('vocab.midnight')) +
            '</span>' +
          '</div>';
        return;
      }
      const big = (role === 'root');
      const wrap = document.createElement('div');
      wrap.className = 'tt-pr-node' + (big ? ' tt-pr-node-root' : '');
      if (big) {
        const tag = document.createElement('div');
        tag.className = 'tt-pr-tag';
        tag.innerHTML = 'S<sub>1</sub>';
        wrap.appendChild(tag);
      }
      wrap.appendChild(window.ShelfCard.render(
        { u: state.u, d: state.d }, { size: big ? 'sm' : 'mini', label: false }
      ));
      host.appendChild(wrap);
    };
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

    /* ---- G formula card: G_i(tau) = sum r_j ---- */
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

    /* ---- The trajectory tree + weighted-leaf ledger ---- */
    const egLabel = document.createElement('div');
    egLabel.className = 's6-eg-label';
    egLabel.innerHTML = T('scene6.eg.label', {
      u: HERO_ROOT.u, d: HERO_ROOT.d, lever: leverName(HERO_LEVER),
    });
    root.appendChild(egLabel);

    const treeHost = document.createElement('div');
    treeHost.className = 's6-tree-host';
    root.appendChild(treeHost);

    /* Ground-truth Q*(HERO_ROOT, HERO_LEVER) for the in-code honesty assertion
       AND the on-screen "= Q*" callout. */
    let policy = null, groundTruth = null;
    try {
      const vi = window.Bellman.valueIteration(1, {});
      policy = vi.policy;
      const Q = window.Bellman.qFromV(vi.V, 1);
      const A = (window.DATA && window.DATA.dims && window.DATA.dims.A) || L.LEVER_IDS.length;
      const ai = L.LEVER_IDS.indexOf(HERO_LEVER);
      groundTruth = Q[P.stateIndex(HERO_ROOT) * A + ai];
    } catch (e) { policy = null; }

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: P.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: P.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_LEVER,
      expandPolicy: policy ? (s) => policy[P.stateIndex(s)] : (() => HERO_LEVER),
      maxDepth: 2, maxLeaves: 12, merge: false, gamma: 1,
      renderNode: makeRenderNode(),
      actionLabel: (leverId) =>
        '<span class="lever-tag tt-pr-lever" data-lever="' + leverId + '">' + leverName(leverId) + '</span>',
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* "= Q*" callout: the weighted leaf sum the ledger just computed IS the
       optimal action-value here. Closes G -> E[G] -> Q*. */
    const egTie = document.createElement('div');
    egTie.className = 's6-eg-tie';
    egTie.innerHTML = T('scene6.eg.tie', {
      eg: '$' + tt.getEG().toFixed(2),
      u: HERO_ROOT.u, d: HERO_ROOT.d, lever: leverName(HERO_LEVER),
    });
    root.appendChild(egTie);

    /* ---- Empirical companion: histogram of full-run returns ---- */
    const variance = document.createElement('div');
    variance.className = 's6-empirical collapsed';
    variance.innerHTML =
      '<div class="s6-empirical-title">' +
        '<span class="s6-empirical-caret">▶</span> ' + T('scene6.emp.title') +
        '<span class="s6-empirical-hint">' + T('scene6.emp.hint') + '</span>' +
      '</div>' +
      '<div class="s6-empirical-body">' +
        '<div class="s6-empirical-explainer">' + T('scene6.emp.explainer') + '</div>' +
        '<div class="s6-hist-head">' +
          '<span class="s6-hist-title">' + T('scene6.hist.title') + '</span>' +
          '<span class="s6-stats" id="s6-stats">' + T('scene6.stats.empty') + '</span>' +
        '</div>' +
        '<div class="s6-hist" id="s6-hist"></div>' +
        '<div class="s6-hist-x">' + T('scene6.hist.x') + '</div>' +
        '<button class="poke-btn" id="s6-run">' + T('scene6.btn.run') + '</button>' +
      '</div>';
    root.appendChild(variance);

    const note = document.createElement('p');
    note.className = 'concept-note';
    note.innerHTML = T('scene6.spread.note');
    root.appendChild(note);

    /* ===== Empirical state ===== */
    const targetEG = tt.getEG();        // the line the running mean converges to
    let samples = [];
    let rngSeed = 0x6E11;

    const histEl  = variance.querySelector('#s6-hist');
    const statsEl = variance.querySelector('#s6-stats');
    const runBtn  = variance.querySelector('#s6-run');

    /* One return: a whole run from the hero opening under the optimal playbook
       (forced HERO_LEVER on day 1, then the policy). Sum of daily cash. */
    function sampleOneReturn() {
      rngSeed = (rngSeed + 1013904223) | 0;
      const rng = P.makeRng(rngSeed >>> 0);
      let s = { u: HERO_ROOT.u, d: HERO_ROOT.d, terminal: false };
      let G = 0, first = true;
      for (let t = 0; t < 8; t++) {
        const lever = first ? HERO_LEVER : policyLever(s);
        first = false;
        const out = P.sample(s, lever, rng);
        G += out.reward;
        if (out.terminal) break;
        s = out.sNext;
      }
      return G;
    }

    function drawBatch(n) {
      for (let i = 0; i < n; i++) samples.push(sampleOneReturn());
      renderHist();
    }

    /* Discrete histogram over the integer return values that actually occur. */
    function renderHist() {
      const counts = {};
      for (const g of samples) counts[g] = (counts[g] || 0) + 1;
      const bins = Object.keys(counts).map(Number).sort((a, b) => a - b);
      const tgtStr = '$' + targetEG.toFixed(2);

      if (samples.length === 0) {
        statsEl.innerHTML = T('scene6.stats.empty') + ' · ' + T('scene6.target', { target: tgtStr });
        histEl.innerHTML = '<div class="s6-hist-empty">' + T('scene6.hist.empty') + '</div>';
        return;
      }

      const lo = Math.min.apply(null, samples), hi = Math.max.apply(null, samples);
      /* Pad the axis so both extremes and the target line sit comfortably. */
      const axLo = Math.min(lo, Math.floor(targetEG));
      const axHi = Math.max(hi, Math.ceil(targetEG));
      const allBins = [];
      for (let v = axLo; v <= axHi; v++) allBins.push(v);
      const maxCount = Math.max(1, ...allBins.map((b) => counts[b] || 0));

      let html = '';
      for (const b of allBins) {
        const c = counts[b] || 0;
        const pct = (c / maxCount) * 100;
        const frac = Math.round((c / samples.length) * 100);
        html +=
          '<div class="s6-bin">' +
            '<div class="s6-bar-track">' +
              '<div class="s6-bar' + (c > 0 ? '' : ' is-zero') + '" style="height:' + pct.toFixed(1) + '%">' +
                (c > 0 ? '<span class="s6-bar-count">' + c + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="s6-bin-x">$' + b + '</div>' +
            '<div class="s6-bin-frac">' + (c > 0 ? frac + '%' : '') + '</div>' +
          '</div>';
      }
      histEl.innerHTML = html;

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      statsEl.innerHTML = T('scene6.stats', {
        n: samples.length, mean: '$' + mean.toFixed(2), lo: '$' + lo, hi: '$' + hi,
      }) + ' · ' + T('scene6.target', { target: tgtStr });

      /* Mean + target ticks across the bins (evenly spaced by value). */
      const span = (axHi - axLo) || 1;
      function tick(v, cls, label) {
        const left = ((v - axLo) / span) * 100;
        const el = document.createElement('div');
        el.className = cls;
        el.style.left = left.toFixed(1) + '%';
        el.innerHTML = '<span>' + label + '</span>';
        histEl.appendChild(el);
      }
      tick(targetEG, 's6-target', T('scene6.target_tag', { target: tgtStr }));
      tick(mean, 's6-mean', T('scene6.mean.tag') + ' $' + mean.toFixed(2));
    }

    function toggleEmp(open) {
      variance.classList.toggle('collapsed', !open);
      const caret = variance.querySelector('.s6-empirical-caret');
      if (caret) caret.textContent = open ? '▼' : '▶';
    }

    runBtn.addEventListener('click', () => drawBatch(50));
    variance.querySelector('.s6-empirical-title').addEventListener('click', () => {
      toggleEmp(variance.classList.contains('collapsed'));
    });

    renderHist();

    /* &run: open the empirical panel + stack a batch so the target line and
       the converging mean are visible (also for headless capture). */
    if (window.PRICING_AUTORUN) {
      toggleEmp(true);
      setTimeout(() => drawBatch(150), 180);
    }

    return {
      onEnter() { renderHist(); },
      onLeave() {},
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

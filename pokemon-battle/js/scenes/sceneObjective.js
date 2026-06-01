/* Scene: Return G_t, the objective E[G_t], and the optimal action-value Q*.
 *
 *   Four pieces, stacked:
 *
 *     1. G formula card: the return G_i(tau) = sum_{j>=i} r_j (undiscounted).
 *     2. The TRAJECTORY TREE + its weighted-leaf ledger (window.TrajTree).
 *        This is the heart of the scene: E[G_t] is DEFINED, visibly, as the
 *        weighted sum over the leaves,
 *            E[G_t] = sum_leaves P(path) * G_t(path),
 *        and the ledger lands the number. Hovering/clicking a ledger row
 *        lights that leaf's root-to-leaf path: "one trajectory = one path."
 *        For the hero root LOW/MID under THUNDER this sum is -3.4875 = Q*,
 *        which a callout states explicitly: G_t -> E[G_t] -> Q* in one frame.
 *     3. Q* formula card (defines Q* as the max expected return).
 *     4. The variance/histogram widget: the EMPIRICAL companion. It samples
 *        trajectories from FULL/FULL under a chosen action; the running mean
 *        mu now has a TARGET LINE to converge to: the exact fixed-action
 *        E[G] computed from the tree (deep, full enumeration), so the
 *        student watches the empirical mean walk toward the computed value.
 *
 *   The old muted 4-turn rollout (its job was "what is a return") is replaced
 *   by the tree+ledger; the G card above still gives the symbolic definition.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* Hero root: the same near-terminal tree the trajectory scene introduced,
     so the ledger reads against a tree the student already knows. */
  const HERO_ROOT = { your: 3, opp: 2, terminal: false };
  const HERO_ACTION = 'thunder';

  function bucketName(b) { return b >= NB ? T('hp.bucket.faint_short') : T('hp.bucket.' + BUCKETS[b]); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function moveName(id) { return T('move.' + id); }

  /* Compact state-icon renderer for the tree nodes (shared shape with the
     trajectory scene). ZERO new icon art: reuses .traj-box-state-body. */
  function makeRenderNode() {
    return function renderNode(state, ctx) {
      const role = ctx.role;
      const host = ctx.el;
      if (state && state.terminal) {
        const won = !!state.win;
        host.parentNode && host.parentNode.classList.add(won ? 'win' : 'loss');
        host.innerHTML =
          '<div class="tt-leaf-final ' + (won ? 'win' : 'loss') + '">' +
            '<span class="tt-leaf-glyph">' + (won ? '✓' : '✗') + '</span>' +
            '<span class="tt-leaf-word">' + (won ? T('terminal.win') : T('terminal.loss')) + '</span>' +
          '</div>';
        return;
      }
      const your = state.your === undefined ? 0 : state.your;
      const opp  = state.opp  === undefined ? 0 : state.opp;
      const big = (role === 'root');
      const spriteCls = 'traj-box-sprite tt-mini-sprite' + (big ? ' tt-root-sprite' : '');
      host.innerHTML =
        (big ? '<div class="tt-node-tag">S<sub>1</sub></div>' : '') +
        '<div class="traj-box-state-body tt-state-body' + (big ? ' tt-state-body-root' : '') + '">' +
          '<div class="traj-box-side">' +
            '<img class="' + spriteCls + '" src="assets/pikachu-back.png" alt="">' +
            '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(your) + '" style="width:' + bucketPct(your) + '%"></div></div>' +
            '<div class="traj-box-bucket">' + bucketName(your) + '</div>' +
          '</div>' +
          '<div class="traj-box-side">' +
            '<img class="' + spriteCls + '" src="' + window.Battle.spriteForOpp(opp) + '" alt="' + window.Battle.displayNameForOpp(opp) + '">' +
            '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(opp) + '" style="width:' + bucketPct(opp) + '%"></div></div>' +
            '<div class="traj-box-bucket">' + bucketName(opp) + '</div>' +
          '</div>' +
        '</div>';
    };
  }

  /* Exact fixed-action E[G] from FULL/FULL, computed by enumerating the full
     chance tree under a constant action to a depth deep enough that the
     residual probability is negligible. This is the TARGET the empirical
     histogram mean converges to (it is NOT V, since V uses the optimal
     policy; here the action is held fixed every step). */
  function fixedActionValue(action) {
    try {
      const tree = window.TrajTree.build({ your: 0, opp: 0, terminal: false }, {
        successors: window.Battle.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: window.Battle.stateKey,
        expandPolicy: () => action,
        maxDepth: 80, gamma: 1, maxLeaves: 1e9, pPrune: 0, merge: true,
      });
      return tree.EG;
    } catch (e) { return null; }
  }

  window.scenes.sceneObjective = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('obj.heading');
    root.appendChild(heading);

    /* ---- G formula card ---- */
    const c1 = document.createElement('div');
    c1.className = 'concept-formula-card';
    c1.innerHTML = '<div class="concept-formula-label">' + T('obj.g.label') + '</div>';
    const f1 = document.createElement('div');
    c1.appendChild(f1);
    window.Katex.render(String.raw`G_i(\tau) \;=\; \sum_{j \ge i}\, r_j`, f1, true);
    const foot1 = document.createElement('div');
    foot1.className = 'concept-formula-foot';
    foot1.textContent = T('obj.g.foot');
    c1.appendChild(foot1);
    root.appendChild(c1);

    /* ---- The trajectory tree + weighted-leaf ledger ---- */
    const egLabel = document.createElement('div');
    egLabel.className = 'obj-eg-label';
    egLabel.innerHTML = T('obj.eg.label', {
      state: bucketName(HERO_ROOT.your) + ' / ' + bucketName(HERO_ROOT.opp),
      move: moveName(HERO_ACTION),
    });
    root.appendChild(egLabel);

    const treeHost = document.createElement('div');
    treeHost.className = 'obj-tree-host';
    root.appendChild(treeHost);

    /* Ground-truth Q*(HERO_ROOT, HERO_ACTION) for the in-code honesty
       assertion AND the on-screen "= Q*" callout. */
    let V = null, groundTruth = null, policy = null;
    try {
      const vi = window.Bellman.valueIteration(1, {});
      V = vi.V; policy = vi.policy;
      const Q = window.Bellman.qFromV(V, 1);
      const A = window.Moves.MOVE_IDS.length;
      const ai = window.Moves.MOVE_IDS.indexOf(HERO_ACTION);
      groundTruth = Q[window.Battle.stateIndex(HERO_ROOT) * A + ai];
    } catch (e) { /* cold-entry fallback: no assertion / callout number */ }

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: window.Battle.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: window.Battle.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_ACTION,
      expandPolicy: policy ? (s) => policy[window.Battle.stateIndex(s)] : (() => HERO_ACTION),
      maxDepth: 2, maxLeaves: 12, gamma: 1,
      renderNode: makeRenderNode(),
      actionLabel: (moveId) => window.Moves.moveSubHtml(moveId),
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* "= Q*" callout: the weighted leaf sum the ledger just computed IS the
       optimal action-value here. Closes G_t -> E[G_t] -> Q*. */
    const egTie = document.createElement('div');
    egTie.className = 'obj-eg-tie';
    const egVal = tt.getEG();
    egTie.innerHTML = T('obj.eg.tie', {
      eg: window.TrajTree._fmt.fmtSigned2(egVal),
      state: bucketName(HERO_ROOT.your) + ' / ' + bucketName(HERO_ROOT.opp),
      move: moveName(HERO_ACTION),
    });
    root.appendChild(egTie);

    /* ---- Q* formula card ---- */
    const c2 = document.createElement('div');
    c2.className = 'concept-formula-card';
    c2.innerHTML = '<div class="concept-formula-label">' + T('obj.qstar.label') + '</div>';
    const f2 = document.createElement('div');
    c2.appendChild(f2);
    window.Katex.render(String.raw`Q^{\star}(s, a) \;=\; \max\; \mathbb{E}\!\left[\, G_i(\tau) \,\right]`, f2, true);
    const foot2 = document.createElement('div');
    foot2.className = 'concept-formula-foot';
    foot2.textContent = T('obj.qstar.foot');
    c2.appendChild(foot2);
    root.appendChild(c2);

    /* ---- Variance illustration (empirical companion) ---- */
    const variance = document.createElement('div');
    variance.className = 'g-variance collapsed';
    variance.innerHTML =
      '<div class="g-variance-title">' +
        '<span class="g-variance-caret">▶</span> ' +
        T('obj.var.title') +
        '<span class="g-variance-hint">' + T('obj.var.hint') + '</span>' +
      '</div>' +
      '<div class="g-variance-body">' +
        '<div class="g-variance-explainer">' + T('obj.var.explainer') + '</div>' +
        '<div class="g-variance-right">' +
          '<div class="g-variance-policy-row">' +
            T('obj.var.policy_label') +
            '<button class="g-variance-policy" data-policy="quick_attack">' + T('obj.var.policy.quick')  + '</button>' +
            '<button class="g-variance-policy active" data-policy="thunderbolt">' + T('obj.var.policy.bolt') + '</button>' +
            '<button class="g-variance-policy" data-policy="thunder">' + T('obj.var.policy.thun') + '</button>' +
          '</div>' +
          '<div class="g-variance-stats" id="g-variance-stats">' + T('obj.var.stats_empty') + '</div>' +
          '<div class="g-variance-chart" id="g-variance-chart"></div>' +
          '<button class="poke-btn" id="g-variance-sample">' + T('obj.var.sample_btn') + '</button>' +
        '</div>' +
      '</div>';
    root.appendChild(variance);

    let variancePolicy = 'thunderbolt';
    /* The exact fixed-action E[G] from the tree: the line mu converges to. */
    let targetEG = fixedActionValue(variancePolicy);

    let varianceRngSeed = 20260516;
    function sampleOneG() {
      varianceRngSeed = (varianceRngSeed + 1013904223) | 0;
      const rng = window.Battle.makeRng(varianceRngSeed >>> 0);
      let state = window.Battle.initialState();
      let G = 0;
      for (let t = 0; t < 60; t++) {
        const out = window.Battle.sample(state, variancePolicy, rng);
        G += out.reward;
        state = out.sNext;
        if (state.terminal) break;
      }
      return G;
    }

    let G_samples = [];
    function drawSamples(n) {
      for (let i = 0; i < n; i++) G_samples.push(sampleOneG());
      renderVarianceChart();
    }

    function renderVarianceChart() {
      const stats = document.getElementById('g-variance-stats');
      const chart = document.getElementById('g-variance-chart');
      if (!chart || !stats) return;
      const tgtStr = (targetEG != null) ? window.TrajTree._fmt.fmtSigned2(targetEG) : '?';
      if (G_samples.length === 0) {
        stats.innerHTML = T('obj.var.stats_empty') + ' · ' + T('obj.var.target', { target: tgtStr });
        chart.innerHTML = '<div class="g-variance-empty">' + T('obj.var.empty_chart') + '</div>';
        return;
      }
      const mean = G_samples.reduce((a, b) => a + b, 0) / G_samples.length;
      const lo = Math.min(...G_samples);
      const hi = Math.max(...G_samples);
      stats.innerHTML = T('obj.var.stats', {
        n: G_samples.length,
        mean: (mean >= 0 ? '+' : '') + mean.toFixed(2),
        lo: (lo >= 0 ? '+' : '') + lo,
        hi: (hi >= 0 ? '+' : '') + hi,
      }) + ' · ' + T('obj.var.target', { target: tgtStr });

      const sorted = G_samples.slice().sort((a, b) => b - a);
      /* Include the target in the axis extent so its line is always on-chart. */
      const tgt = (targetEG != null) ? targetEG : mean;
      const maxAbs = Math.max(Math.abs(lo), Math.abs(hi), Math.abs(tgt), 1);
      const meanPct = ((mean + maxAbs) / (2 * maxAbs)) * 100;
      const tgtPct = ((tgt + maxAbs) / (2 * maxAbs)) * 100;
      let html = '<div class="g-variance-zero"></div>';
      /* Target line (the tree's computed E[G]): the convergence goal. */
      if (targetEG != null) {
        html += '<div class="g-variance-target" style="left:' + tgtPct.toFixed(1) + '%">' +
                  '<span>' + T('obj.var.target_tag', { target: tgtStr }) + '</span></div>';
      }
      html += '<div class="g-variance-mean" style="left:' + meanPct.toFixed(1) + '%"><span>&mu; = ' + (mean >= 0 ? '+' : '') + mean.toFixed(2) + '</span></div>';
      for (const g of sorted) {
        const sign = g >= 0 ? 'pos' : 'neg';
        const width = (Math.abs(g) / maxAbs) * 50;
        const offset = g >= 0 ? 50 : (50 - width);
        html +=
          '<div class="g-variance-bar ' + sign + '" style="left:' + offset.toFixed(2) + '%; width:' + width.toFixed(2) + '%">' +
            '<span class="g-variance-bar-label">' + (g >= 0 ? '+' : '') + g + '</span>' +
          '</div>';
      }
      chart.innerHTML = html;
    }
    document.getElementById('g-variance-sample').addEventListener('click', () => drawSamples(20));

    variance.querySelectorAll('.g-variance-policy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-policy');
        if (!p || p === variancePolicy) return;
        variancePolicy = p;
        targetEG = fixedActionValue(variancePolicy);
        variance.querySelectorAll('.g-variance-policy').forEach((b) => b.classList.toggle('active', b === btn));
        G_samples = [];
        renderVarianceChart();
      });
    });

    variance.querySelector('.g-variance-title').addEventListener('click', () => {
      variance.classList.toggle('collapsed');
      const caret = variance.querySelector('.g-variance-caret');
      if (caret) caret.textContent = variance.classList.contains('collapsed') ? '▶' : '▼';
    });
    renderVarianceChart();

    /* &var or &run: expand the variance widget and draw a batch so the
       target line + converging mean are visible (also for headless capture). */
    if (/[#&?](var|run)\b/.test(window.location.hash)) {
      variance.classList.remove('collapsed');
      const caret = variance.querySelector('.g-variance-caret');
      if (caret) caret.textContent = '▼';
      setTimeout(() => drawSamples(120), 180);
    }

    return {};
  };
})();

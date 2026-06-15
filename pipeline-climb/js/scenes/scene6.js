/* Scene 6 - Return over the deal, the objective E[G_t], and Q*.
 *
 *   Three pieces, stacked:
 *
 *     1. G formula card: the return G_i(tau) = sum_{j>=i} r_j (undiscounted;
 *        every deal terminates in SIGNED or LOST, so no discount is needed).
 *     2. The SAME trajectory tree the previous scene introduced + its
 *        weighted-leaf LEDGER (window.TrajTree). This is the heart of the
 *        scene: E[G_t] is DEFINED, visibly, as the weighted sum over leaves,
 *            E[G_t] = sum over leaves of P(path) * G_t(path),
 *        and the ledger lands the number. Hovering / tapping a ledger row
 *        lights that leaf's root-to-leaf path: "one run = one path."
 *        For the hero root READY under HARD CLOSE this sum is +29.00 = Q*,
 *        which a callout states explicitly: G_t -> E[G_t] -> Q* in one frame.
 *     3. Q* formula card: defines Q* as the max expected return.
 *
 *   assertValue ties the ledger to the Bellman Q* in code (diff <= 1e-6).
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;
  const READY = P ? P.READY : 4;

  /* Same hero root the trajectory scene introduced, so the ledger reads
     against a tree the student already knows. */
  const HERO_ROOT = { rung: READY, terminal: false };
  const HERO_LEVER = 'hardclose';

  function rungName(r) { return T('rung.' + P.RUNGS[r], P.RUNG_DISPLAY[r]); }
  function leverName(id) { return T('lever.' + id, (window.Levers.MOVE_BY_ID[id] || {}).name || id); }

  /* Compact LadderCard renderer for tree nodes (shared shape with scene 5).
     ZERO new icon art. */
  function makeRenderNode() {
    return function renderNode(state, ctx) {
      const host = ctx.el;
      if (state && state.terminal) {
        const signed = !!state.signed;
        host.parentNode && host.parentNode.classList.add(signed ? 'win' : 'loss');
        host.innerHTML =
          '<div class="tt-leaf-final ' + (signed ? 'win' : 'loss') + '">' +
            '<span class="tt-leaf-glyph">' + (signed ? '✓' : '✗') + '</span>' +
            '<span class="tt-leaf-word">' + (signed ? T('vocab.signed', 'SIGNED') : T('vocab.lost', 'LOST')) + '</span>' +
          '</div>';
        return;
      }
      const big = (ctx.role === 'root');
      if (big) {
        const tag = document.createElement('div');
        tag.className = 'tt-node-tag';
        tag.innerHTML = 'S<sub>1</sub>';
        host.appendChild(tag);
      }
      const cardHost = document.createElement('div');
      host.appendChild(cardHost);
      window.LadderCard.mount(cardHost, { rung: state.rung, compact: true, size: 'sm' });
    };
  }

  function leverActionLabel(id) {
    return '<span class="tt-lever-chip ' + window.Levers.toneClass(id) + '">' +
             window.Levers.leverIconSvg(id) +
             '<span class="tt-lever-chip-name">' + window.Levers.shortLabel(id) + '</span>' +
           '</span>';
  }

  window.scenes.scene6 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'pc-return-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('obj.heading');
    root.appendChild(heading);

    /*, G formula card, */
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

    /*, The trajectory tree + weighted-leaf ledger, */
    const egLabel = document.createElement('div');
    egLabel.className = 'pc-eg-label';
    egLabel.innerHTML = T('obj.eg.label', {
      state: rungName(HERO_ROOT.rung), lever: leverName(HERO_LEVER),
    });
    root.appendChild(egLabel);

    const treeHost = document.createElement('div');
    treeHost.className = 'pc-tree-host';
    root.appendChild(treeHost);

    /* Ground-truth Q*(HERO_ROOT, HERO_LEVER) for the in-code honesty
       assertion AND the on-screen "= Q*" callout. */
    let V = null, policy = null, groundTruth = null;
    try {
      /* Converge V tightly so the depth-2 tree's E[G_t] matches Q* to well
         under 1e-6 (the default tol=1e-4 leaves a ~2e-6 residual). */
      const vi = window.Bellman.valueIteration(1, { tol: 1e-10, maxIters: 400 });
      V = vi.V; policy = vi.policy;
      const Q = window.Bellman.qFromV(V, 1);
      const A = window.Bellman.A;
      const ai = window.Bellman.MOVE_IDS.indexOf(HERO_LEVER);
      groundTruth = Q[P.stateIndex(HERO_ROOT) * A + ai];
    } catch (e) { /* cold-entry fallback: no assertion / callout number */ }

    const valueFn = (s) => (s && !s.terminal && V) ? V[P.stateIndex(s)] : 0;

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: P.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: P.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_LEVER,
      expandPolicy: policy ? (s) => policy[P.stateIndex(s)] : (() => HERO_LEVER),
      maxDepth: 2, maxLeaves: 12, gamma: 1,
      valueFn: valueFn,
      bootstrapFrontier: true,
      renderNode: makeRenderNode(),
      actionLabel: leverActionLabel,
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* "= Q*" callout: the weighted leaf sum the ledger just computed IS the
       optimal action-value here. Closes G_t -> E[G_t] -> Q*. */
    const egTie = document.createElement('div');
    egTie.className = 'pc-eg-tie';
    egTie.innerHTML = T('obj.eg.tie', {
      eg: window.TrajTree._fmt.fmtSigned2(tt.getEG()),
      state: rungName(HERO_ROOT.rung), lever: leverName(HERO_LEVER),
    });
    root.appendChild(egTie);

    /*, Q* formula card, */
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

    return {};
  };
})();

/* Scene 8 - the Bellman equation: the backup IS the depth-1 trajectory tree.
 *
 *   The Bellman optimality identity
 *       Q*(s, a) = E[ R + max_a' Q*(S', a') ]
 *   is literally the DEPTH-1 chance tree under lever a, with each child's
 *   value bootstrapped in as G_t = r + V(s'). This scene renders exactly that
 *   tree (window.TrajTree, maxDepth 1, bootstrapFrontier) beside the formula,
 *   so "Bellman backup = one-ply trajectory tree" is visible and reuses the
 *   very node / edge / ledger components from the trajectory and return
 *   scenes. The weighted leaf sum is asserted in code to equal Q*(s, a) from
 *   value iteration (diff <= 1e-6), so the picture is honest, never hard-coded.
 *
 *   Backup root (engine-verified): ENGAGED under DEMO. DEMO is the OPTIMAL
 *   lever there; the one-ply fan has 3 children (UP -> EVALUATING,
 *   STAY -> ENGAGED, DOWN -> CURIOUS), each a living rung whose leaf reads
 *   G_t = -1 + V(s'), and the weighted sum is +25.10 = Q*(ENGAGED, DEMO).
 *   A generic inner state is chosen so "r + V(s')" is the uniform read on
 *   every leaf (the backup's whole point).
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;

  /* Backup root + the optimal lever there. ENGAGED = rung 2. */
  const BACKUP_RUNG = 2;
  const BACKUP_ROOT = { rung: BACKUP_RUNG, terminal: false };
  const BACKUP_LEVER = 'demo';
  const GAMMA = 1;

  function rungName(r) { return T('rung.' + P.RUNGS[r], P.RUNG_DISPLAY[r]); }
  function leverName(id) { return T('lever.' + id, (window.Levers.MOVE_BY_ID[id] || {}).name || id); }

  /* Compact LadderCard renderer for the depth-1 backup tree (same node
     vocabulary as scenes 5 / 6). ZERO new icon art. */
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
        tag.textContent = 's';
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

  window.scenes.scene8 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'pc-bellman-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('bell.heading');
    root.appendChild(heading);

    /* ---- Bellman formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('bell.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; \max_{a'} Q^{\star}(S', a') \,\right]`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('bell.formula.foot') + '<br><b class="pc-tree-foot">' + T('bell.backup.foot') + '</b>';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Caption naming the backup cell ---- */
    const caption = document.createElement('div');
    caption.className = 'pc-tree-caption';
    caption.innerHTML = T('bell.backup.caption', {
      state: rungName(BACKUP_RUNG), lever: leverName(BACKUP_LEVER),
    });
    root.appendChild(caption);

    /* ---- The depth-1 backup tree + its ledger ---- */
    const treeHost = document.createElement('div');
    treeHost.className = 'pc-tree-host';
    root.appendChild(treeHost);

    /* V (for bootstrapped leaves) + Q* ground truth for the assertion. */
    let V = null, groundTruth = null;
    try {
      /* Tight convergence keeps the depth-1 backup's leaf bootstrap exact. */
      const vi = window.Bellman.valueIteration(1, { tol: 1e-10, maxIters: 400 });
      V = vi.V;
      const Q = window.Bellman.qFromV(V, 1);
      const A = window.Bellman.A;
      const ai = window.Bellman.MOVE_IDS.indexOf(BACKUP_LEVER);
      groundTruth = Q[P.stateIndex(BACKUP_ROOT) * A + ai];
    } catch (e) { /* cold-entry fallback: no assertion / callout number */ }

    const valueFn = (s) => (s && !s.terminal && V) ? V[P.stateIndex(s)] : 0;

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: P.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: P.stateKey,
      },
      rootState: BACKUP_ROOT,
      rootAction: BACKUP_LEVER,
      maxDepth: 1, gamma: GAMMA,
      valueFn: valueFn,
      bootstrapFrontier: true,
      renderNode: makeRenderNode(),
      actionLabel: leverActionLabel,
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* "= Q*" tie: the one-ply weighted leaf sum IS Q*(s, a). */
    const tie = document.createElement('div');
    tie.className = 'pc-eg-tie';
    tie.innerHTML = T('bell.backup.tie', {
      eg: window.TrajTree._fmt.fmtSigned2(tt.getEG()),
      state: rungName(BACKUP_RUNG), lever: leverName(BACKUP_LEVER),
    });
    root.appendChild(tie);

    return {};
  };
})();

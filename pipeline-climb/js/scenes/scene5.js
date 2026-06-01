/* Scene 5 - the trajectory, drawn as a TREE.
 *
 *   tau = (S1, A1, R1, S2, A2, R2, ...) is usually drawn as a flat tape of
 *   (state, lever, reward) boxes. But that tape is ONE realization, one
 *   root-to-leaf PATH through a branching process. This scene draws the
 *   *set* of possible paths as a tree (window.TrajTree):
 *
 *     - NODES are states, drawn with this viz's own state-icon, the
 *       LadderCard (thermometer-on-a-ladder), in a compact form. The root
 *       keeps a slightly bigger ladder + an S1 tag.
 *     - EDGES are annotated with the LEVER (shown once, on the root edges),
 *       the transition probability p of that die face, and the reward r.
 *     - LEAVES carry G_t = the sum of rewards from the root to that leaf.
 *       SIGNED / LOST leaves are real terminals with a pure G_t; living-rung
 *       leaves are honest Bellman truncations G_t = (reward so far) + V(s').
 *
 *   One sampled trajectory = one highlighted root-to-leaf path. SAMPLE draws
 *   a path with engine-faithful die odds and lights it; STEP / -> walks that
 *   path one ply at a time, the faint tree behind it showing the roads not
 *   taken. A strip under the tree shows the lit path AS THE OLD TAPE
 *   (S1, A1, R1, S2, ...) so the tape becomes a *derived* view, not the
 *   primary one.
 *
 *   Hero root (engine-verified): READY under HARD CLOSE. The UP die face
 *   closes the deal immediately (SIGNED, +30), so the tree is genuinely
 *   shallow: depth <= 2, 5 leaves, Sum p = 1, E[G_t] = +29.00 =
 *   Q*(READY, HARD CLOSE), and HARD CLOSE is the OPTIMAL lever at READY.
 *   The leaf set mixes two real SIGNED terminals with three bootstrapped
 *   living rungs, so E[G_t] is a genuine mixture (not a degenerate value).
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;
  const READY = P ? P.READY : 4;

  /* Hero root + the lever whose chance-tree we draw. */
  const HERO_ROOT = { rung: READY, terminal: false };
  const HERO_LEVER = 'hardclose';

  function rungName(r) { return T('rung.' + P.RUNGS[r], P.RUNG_DISPLAY[r]); }
  function leverName(id) { return T('lever.' + id, (window.Levers.MOVE_BY_ID[id] || {}).name || id); }

  /* The host's state-icon (the LadderCard) painted into a tree node. ZERO new
     icon art: mounts the existing window.LadderCard. Living rungs render the
     compact ladder (no labels); terminals render a compact SIGNED / LOST
     leaf with a glyph + word so the outcome reads from the non-colour
     channel too. */
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

  /* HTML for the action chip on the root edges: the lever's pixel glyph + its
     short name, tinted by the lever's CSS token (no inline colour). */
  function leverActionLabel(id) {
    return '<span class="tt-lever-chip ' + window.Levers.toneClass(id) + '">' +
             window.Levers.leverIconSvg(id) +
             '<span class="tt-lever-chip-name">' + window.Levers.shortLabel(id) + '</span>' +
           '</span>';
  }

  window.scenes.scene5 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'pc-traj-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('traj.heading');
    root.appendChild(heading);

    /* Formula card: tau as a sequence of random variables. The foot adds the
       tree reframe: "one run = one path." */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('traj.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`\tau = (S_1, A_1, R_1, \; S_2, A_2, R_2, \; S_3, A_3, R_3, \; \dots)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('traj.formula.foot') + '<br><b class="pc-tree-foot">' + T('traj.tree.foot') + '</b>';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* Tree caption: names the fixed root + lever so the student knows the
       lever is held constant (chance-only tree). */
    const caption = document.createElement('div');
    caption.className = 'pc-tree-caption';
    caption.innerHTML = T('traj.tree.caption', {
      state: rungName(HERO_ROOT.rung), lever: leverName(HERO_LEVER),
    });
    root.appendChild(caption);

    /* Tree host: TrajTree mounts the tree + the E[G_t] ledger here. */
    const treeHost = document.createElement('div');
    treeHost.className = 'pc-tree-host';
    root.appendChild(treeHost);

    /* Value iteration: V for bootstrapped frontier leaves, policy for the
       post-root expansion, and Q* ground truth for the honesty assertion. */
    let V = null, policy = null, groundTruth = null;
    try {
      /* Converge V tightly: the depth-2 tree compounds any residual V error,
         so the default tol=1e-4 leaves E[G_t] ~2e-6 off Q*; 1e-10 drives the
         honesty assertion well below the 1e-6 tolerance. */
      const vi = window.Bellman.valueIteration(1, { tol: 1e-10, maxIters: 400 });
      V = vi.V; policy = vi.policy;
      const Q = window.Bellman.qFromV(V, 1);
      const A = window.Bellman.A;
      const ai = window.Bellman.MOVE_IDS.indexOf(HERO_LEVER);
      groundTruth = Q[P.stateIndex(HERO_ROOT) * A + ai];
    } catch (e) { /* cold-entry fallback: no assertion */ }

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
      maxDepth: 2,
      maxLeaves: 12,
      gamma: 1,
      valueFn: valueFn,
      bootstrapFrontier: true,
      renderNode: makeRenderNode(),
      actionLabel: leverActionLabel,
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* Derived tape strip: the lit path AS THE OLD (s, a, r) tape. Makes the
       flat tape a *derived* view of one path through the tree. */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'pc-traj-derived';
    tapeWrap.innerHTML =
      '<div class="pc-derived-label">' + T('traj.derived.label') + '</div>' +
      '<div class="pc-derived-tape" id="pc-derived-tape"></div>';
    root.appendChild(tapeWrap);
    const tapeEl = tapeWrap.querySelector('#pc-derived-tape');

    /* Controls. */
    const ctrls = document.createElement('div');
    ctrls.className = 'pc-traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="pc-traj-sample" data-run-primary>' + T('traj.btn.sample') + '</button>' +
      '<button class="poke-btn" id="pc-traj-step">' + T('traj.btn.step') + '</button>' +
      '<button class="poke-btn" id="pc-traj-reset">' + T('traj.btn.reset') + '</button>' +
      '<div class="pc-traj-status">' + T('traj.status.hint') + '</div>';
    root.appendChild(ctrls);

    /* Walk state: a "current path" is a fixed list of edges root -> leaf,
       chosen by sampling. STEP reveals it one ply at a time. */
    let rng = P.makeRng(0x51A7 + Math.floor(Math.random() * 65535));
    let curPath = null;
    let walkPly = 0;

    /* Rebuild the node-id chain to the leaf TrajTree just lit, so the derived
       tape matches the lit path exactly. */
    function pathToLeaf(tree, leafId) {
      let found = null;
      function rec(node, chainNodes, edges) {
        if (node.id === leafId) { found = { nodes: chainNodes.concat([node]), edges }; return true; }
        for (const e of (node.children || [])) {
          if (rec(e.node, chainNodes.concat([node]),
                  edges.concat([{ move: node.move, p: e.p, reward: e.reward }]))) return true;
        }
        return false;
      }
      rec(tree.root, [], []);
      return found;
    }

    function renderTape() {
      tapeEl.innerHTML = '';
      if (!curPath) {
        tapeEl.innerHTML = '<div class="pc-derived-empty">' + T('traj.derived.empty') + '</div>';
        return;
      }
      const reveal = Math.min(walkPly, curPath.edges.length);
      for (let i = 0; i < reveal; i++) {
        const sBefore = curPath.nodes[i].state;
        const e = curPath.edges[i];
        const childState = curPath.nodes[i + 1].state;
        appendTapeTriple(tapeEl, i + 1, sBefore, e.move, e.reward, childState);
      }
      const full = (reveal === curPath.edges.length && curPath.edges.length > 0);
      if (full) {
        const leaf = curPath.nodes[curPath.nodes.length - 1];
        const G = (leaf && leaf.G != null) ? leaf.G : curPath.edges.reduce((a, e) => a + e.reward, 0);
        const gtag = document.createElement('div');
        gtag.className = 'pc-derived-g';
        gtag.innerHTML = T('traj.derived.g', { g: window.TrajTree._fmt.fmtG(G) });
        tapeEl.appendChild(gtag);
      }
      /* While stepping, follow the latest ply (scroll right); on a full reveal
         (SAMPLE), snap to the start so the path reads left-to-right from S1. */
      setTimeout(() => { tapeEl.scrollLeft = full ? 0 : tapeEl.scrollWidth; }, 60);
    }

    /* One (s, a, r) triple in the derived tape. The S box holds a mini
       LadderCard; the A box the lever name; the R box the reward (terminal
       boxes get a SIGNED / LOST tint). */
    function appendTapeTriple(host, step, sBefore, leverId, r, childState) {
      const terminal = !!(childState && childState.terminal);
      const signed = !!(childState && childState.signed);

      const group = document.createElement('div');
      group.className = 'pc-tape-group';

      const sBox = document.createElement('div');
      sBox.className = 'pc-tape-box pc-tape-state';
      sBox.innerHTML = '<div class="pc-tape-label">S<sub>' + step + '</sub></div>';
      const sIcon = document.createElement('div');
      sIcon.className = 'pc-tape-icon';
      sBox.appendChild(sIcon);
      window.LadderCard.mount(sIcon, { rung: sBefore.rung, compact: true, size: 'sm' });
      group.appendChild(sBox);

      const aBox = document.createElement('div');
      aBox.className = 'pc-tape-box pc-tape-action';
      aBox.innerHTML =
        '<div class="pc-tape-label">A<sub>' + step + '</sub></div>' +
        '<div class="pc-tape-action-body">' + (leverId ? window.Levers.shortLabel(leverId) : '-') + '</div>';
      group.appendChild(aBox);

      const rBox = document.createElement('div');
      rBox.className = 'pc-tape-box pc-tape-reward';
      if (terminal) rBox.classList.add(signed ? 'win' : 'loss');
      const sign = r >= 0 ? '+' : '';
      let inner =
        '<div class="pc-tape-label">R<sub>' + step + '</sub></div>' +
        '<div class="pc-tape-reward-body">' + sign + r + '</div>';
      if (terminal) inner += '<div class="pc-tape-terminal-tag">' + (signed ? T('vocab.signed', 'SIGNED') : T('vocab.lost', 'LOST')) + '</div>';
      rBox.innerHTML = inner;
      group.appendChild(rBox);
      host.appendChild(group);

      /* Close a terminating path with the final terminal-state box. */
      if (terminal) {
        const finalGroup = document.createElement('div');
        finalGroup.className = 'pc-tape-group';
        const finalBox = document.createElement('div');
        finalBox.className = 'pc-tape-box pc-tape-state pc-tape-final ' + (signed ? 'win' : 'loss');
        finalBox.innerHTML = '<div class="pc-tape-label">S<sub>' + (step + 1) + '</sub></div>';
        const fIcon = document.createElement('div');
        fIcon.className = 'pc-tape-icon';
        finalBox.appendChild(fIcon);
        window.LadderCard.mount(fIcon, { compact: true, size: 'sm' }).setState(childState);
        finalGroup.appendChild(finalBox);
        host.appendChild(finalGroup);
      }
    }

    function sample() {
      const res = tt.samplePath(rng);
      const tree = tt.getTree();
      const chain = pathToLeaf(tree, res.leafId);
      curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
      walkPly = curPath ? curPath.edges.length : 0;
      renderTape();
    }

    function step() {
      if (!curPath) {
        const res = tt.samplePath(rng);
        const tree = tt.getTree();
        const chain = pathToLeaf(tree, res.leafId);
        curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
        walkPly = 1;
        if (curPath) tt.highlightLeaf(curPath.leafId);
        renderTape();
        return;
      }
      if (walkPly < curPath.edges.length) { walkPly++; renderTape(); }
      else { curPath = null; walkPly = 0; sample(); }
    }

    function reset() {
      curPath = null; walkPly = 0;
      tt.highlightLeaf(null);
      rng = P.makeRng(0x51A7 + Math.floor(Math.random() * 65535));
      renderTape();
    }

    document.getElementById('pc-traj-sample').addEventListener('click', sample);
    document.getElementById('pc-traj-step').addEventListener('click', step);
    document.getElementById('pc-traj-reset').addEventListener('click', reset);

    renderTape();

    /* &run: auto-sample a path so the screenshot shows a lit path + tape. */
    if (/[#&?]run\b/.test(window.location.hash)) setTimeout(sample, 240);

    return {
      onEnter() {},
      onLeave() {},
      /* Right arrow = walk the current path one more ply (matches STEP). */
      onNextKey() { step(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

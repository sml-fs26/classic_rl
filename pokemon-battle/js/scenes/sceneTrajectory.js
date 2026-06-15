/* Scene, the trajectory, drawn as a TREE.
 *
 *   τ = (S₁, A₁, R₁, S₂, A₂, R₂, …) is usually drawn as a flat tape of
 *   random-variable boxes. But that tape is ONE realization, one
 *   root-to-leaf PATH through a branching process. This scene draws the
 *   *set* of possible paths as a tree (window.TrajTree):
 *
 *     - NODES are states (the existing two-sprites-under-HP-bars icon, in a
 *       compact form; the root keeps full size + its S₁ tag).
 *     - EDGES are annotated with the ACTION (shown once, on the root edges),
 *       the transition probability p, and the reward r.
 *     - LEAVES carry G_t = the sum of rewards from the root to that leaf.
 *
 *   One sampled trajectory = one highlighted root-to-leaf path. SAMPLE draws
 *   a path with Battle-faithful probabilities and lights it; STEP / → walks
 *   that path one ply at a time, the faint tree behind it showing the roads
 *   not taken. A strip under the tree shows the lit path AS THE OLD TAPE
 *   (S₃, A₃, R₃, S₄, …) so the tape becomes a *derived* view, not the
 *   primary one.
 *
 *   Hero root (engine-verified, see mdp-gallery/reference/trajectory-tree.md):
 *   LOW/MID (your=3, opp=2) under THUNDER, depth ≤ 2, exactly 4 terminal
 *   leaves, Σp = 1, E[G_t] = -3.4875 = Q*(LOW/MID, THUNDER) = V(LOW/MID),
 *   and THUNDER is the optimal action there. Every leaf is a real terminal
 *   with a PURE G_t (no bootstrap), so the G_t → E[G_t] lesson is clean.
 *
 *   Cross-viz hue identity is preserved: the root carries the MDP-red edge,
 *   the action chip is casino-blue, the reward chip is ghost-purple, and
 *   win/loss leaves use the colour-blind blue/vermillion tokens + a glyph.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* Hero root + the action whose chance-tree we draw. */
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

  /* Render the host's state-icon (two sprites under HP bars) into `host`.
     Reuses the existing .traj-box-state-body markup verbatim so there is
     ZERO new icon art; descendants get .tt-mini-sprite so the mobile media
     query in trajTree.css can shrink them. The root keeps an S₁ tag and a
     larger sprite; terminals reuse the win/loss colour-blind treatment +
     a ✓ / ✗ glyph so the outcome reads from the non-colour channel too. */
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

  window.scenes.sceneTrajectory = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('traj.heading');
    root.appendChild(heading);

    /* Formula card, τ as a sequence of random variables. The foot now adds
       the tree reframe: "one trajectory = one path." */
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
    ffoot.innerHTML = T('traj.formula.foot') + '<br><b class="traj-tree-foot">' + T('traj.tree.foot') + '</b>';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* Tree caption, names the fixed root + action so the student knows the
       action is held constant (chance-only tree). */
    const caption = document.createElement('div');
    caption.className = 'traj-tree-caption';
    caption.innerHTML = T('traj.tree.caption', {
      state: bucketName(HERO_ROOT.your) + ' / ' + bucketName(HERO_ROOT.opp),
      move: moveName(HERO_ACTION),
    });
    root.appendChild(caption);

    /* Tree host, TrajTree mounts the tree + the E[G_t] ledger here. */
    const treeHost = document.createElement('div');
    treeHost.className = 'traj-tree-host';
    root.appendChild(treeHost);

    /*, Mount the trajectory tree, */
    /* expandPolicy: after the forced root action, act optimally so the
       weighted leaf sum is exactly Q*(root, HERO_ACTION). All leaves are
       terminal at depth ≤ 2 here, so the policy never actually fires, but
       passing it keeps the build honest if the engine is ever retuned. */
    let policy = null;
    try {
      const vi = window.Bellman.valueIteration(1, {});
      policy = vi.policy;
      window.__trajV = vi.V;
    } catch (e) { policy = null; }

    const groundTruth = (function () {
      try {
        if (!window.__trajV) return null;
        const Q = window.Bellman.qFromV(window.__trajV, 1);
        const A = window.Moves.MOVE_IDS.length;
        const ai = window.Moves.MOVE_IDS.indexOf(HERO_ACTION);
        return Q[window.Battle.stateIndex(HERO_ROOT) * A + ai];
      } catch (e) { return null; }
    })();

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: window.Battle.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: window.Battle.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_ACTION,
      expandPolicy: policy ? (s) => policy[window.Battle.stateIndex(s)] : (() => HERO_ACTION),
      maxDepth: 2,
      maxLeaves: 12,
      gamma: 1,
      renderNode: makeRenderNode(),
      actionLabel: (moveId) => window.Moves.moveSubHtml(moveId),
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /*, Derived tape strip: the lit path AS THE OLD (s, a, r) tape ----
       This makes the flat tape a *derived* view of one path through the tree,
       not the primary object. Empty until a path is sampled/walked. */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'traj-derived';
    tapeWrap.innerHTML =
      '<div class="traj-derived-label">' + T('traj.derived.label') + '</div>' +
      '<div class="traj-derived-tape traj-rollout" id="traj-derived-tape"></div>';
    root.appendChild(tapeWrap);
    const tapeEl = tapeWrap.querySelector('#traj-derived-tape');

    /*, Controls, */
    const ctrls = document.createElement('div');
    ctrls.className = 'traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="traj-sample">' + T('traj.btn.sample') + '</button>' +
      '<button class="poke-btn" id="traj-step">' + T('traj.btn.step') + '</button>' +
      '<button class="poke-btn" id="traj-reset">' + T('traj.btn.reset') + '</button>' +
      '<div class="traj-status">' + T('traj.status.hint') + '</div>';
    root.appendChild(ctrls);

    /*, Walk state ----
       A "current path" is a fixed list of edges from root to a leaf, chosen
       by sampling (engine-faithful). STEP reveals it one ply at a time and
       lights the prefix; SAMPLE draws a fresh path and lights it whole. */
    let rng = window.Battle.makeRng(0x51A7 + Math.floor(Math.random() * 65535));
    let curPath = null;     // { edges, nodeIds:[root..leaf], leafId, states:[...] }
    let walkPly = 0;        // how many plies of curPath are revealed (for tape)

    /* Build the full node-id chain for the leaf TrajTree just lit, by
       replaying the sample through the data tree (so the tape matches the
       lit path exactly). */
    function pathToLeaf(tree, leafId) {
      let found = null;
      function rec(node, chainNodes, edges) {
        if (node.id === leafId) {
          found = { nodes: chainNodes.concat([node]), edges };
          return true;
        }
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
        tapeEl.innerHTML = '<div class="traj-derived-empty">' + T('traj.derived.empty') + '</div>';
        return;
      }
      const reveal = Math.min(walkPly, curPath.edges.length);
      for (let i = 0; i < reveal; i++) {
        const sBefore = curPath.nodes[i].state;
        const e = curPath.edges[i];
        const childState = curPath.nodes[i + 1].state;
        const terminal = !!(childState && childState.terminal);
        const won = !!(childState && childState.win);
        appendTapeTriple(tapeEl, i + 1, sBefore, e.move, e.reward, terminal, won, childState);
      }
      /* On full reveal, surface the path's G_t as the running return. */
      if (reveal === curPath.edges.length && curPath.edges.length > 0) {
        let G = 0; for (const e of curPath.edges) G += e.reward;
        const gtag = document.createElement('div');
        gtag.className = 'traj-derived-g';
        gtag.innerHTML = T('traj.derived.g', { g: window.TrajTree._fmt.fmtG(G) });
        tapeEl.appendChild(gtag);
      }
      setTimeout(() => tapeEl.scrollLeft = tapeEl.scrollWidth, 60);
    }

    /* One (s, a, r) triple in the derived tape, same box vocabulary as the
       old flat rollout (red s / blue a / purple r), so the student literally
       sees "this path = that tape." */
    function appendTapeTriple(host, step, sBefore, aId, r, terminal, won, finalState) {
      const group = document.createElement('div');
      group.className = 'traj-group';

      const yourB = sBefore.your === undefined ? 0 : sBefore.your;
      const oppB  = sBefore.opp  === undefined ? 0 : sBefore.opp;

      const sBox = document.createElement('div');
      sBox.className = 'traj-box traj-box-state';
      sBox.innerHTML =
        '<div class="traj-box-label">S<sub>' + step + '</sub></div>' +
        '<div class="traj-box-state-body">' +
          '<div class="traj-box-side">' +
            '<img class="traj-box-sprite" src="assets/pikachu-back.png" alt="">' +
            '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(yourB) + '" style="width:' + bucketPct(yourB) + '%"></div></div>' +
            '<div class="traj-box-bucket">' + bucketName(yourB) + '</div>' +
          '</div>' +
          '<div class="traj-box-side">' +
            '<img class="traj-box-sprite" src="' + window.Battle.spriteForOpp(oppB) + '" alt="">' +
            '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(oppB) + '" style="width:' + bucketPct(oppB) + '%"></div></div>' +
            '<div class="traj-box-bucket">' + bucketName(oppB) + '</div>' +
          '</div>' +
        '</div>';
      group.appendChild(sBox);

      const aBox = document.createElement('div');
      aBox.className = 'traj-box traj-box-action';
      aBox.innerHTML =
        '<div class="traj-box-label">A<sub>' + step + '</sub></div>' +
        '<div class="traj-box-action-body">' + (aId ? moveName(aId) : T('battle.hud.dash')) + '</div>';
      group.appendChild(aBox);

      const rBox = document.createElement('div');
      rBox.className = 'traj-box traj-box-reward';
      if (terminal) rBox.classList.add(won ? 'win' : 'loss');
      const sign = r >= 0 ? '+' : '';
      let inner =
        '<div class="traj-box-label">R<sub>' + step + '</sub></div>' +
        '<div class="traj-box-reward-body">' + sign + r + '</div>';
      if (terminal) inner += '<div class="traj-box-terminal-tag">' + (won ? T('terminal.win') : T('terminal.loss')) + '</div>';
      rBox.innerHTML = inner;
      group.appendChild(rBox);

      host.appendChild(group);

      /* Close the trajectory with the final terminal state box. */
      if (terminal && finalState) {
        const finalGroup = document.createElement('div');
        finalGroup.className = 'traj-group';
        const sFinalBox = document.createElement('div');
        sFinalBox.className = 'traj-box traj-box-state traj-box-state-final ' + (won ? 'win' : 'loss');
        const pikaFainted = !won, charmFainted = won;
        const pikaBucket  = pikaFainted  ? NB : yourB;
        const charmBucket = charmFainted ? NB : oppB;
        function sideHtml(spriteSrc, bucket, fainted) {
          const cls = fainted ? 'b4' : bucketClass(bucket);
          const pct = fainted ? 0 : bucketPct(bucket);
          return '<div class="traj-box-side">' +
            '<img class="traj-box-sprite ' + (fainted ? 'fainted' : '') + '" src="' + spriteSrc + '" alt="">' +
            '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
            '<div class="traj-box-bucket">' + (fainted ? T('hp.bucket.faint_short') : bucketName(bucket)) + '</div>' +
          '</div>';
        }
        sFinalBox.innerHTML =
          '<div class="traj-box-label">S<sub>' + (step + 1) + '</sub> <span class="traj-box-terminal-mini">' + T('terminal.mini') + '</span></div>' +
          '<div class="traj-box-state-body">' +
            sideHtml('assets/pikachu-back.png', pikaBucket, pikaFainted) +
            sideHtml(window.Battle.spriteForOpp(Math.min(NB - 1, charmBucket)), charmBucket, charmFainted) +
          '</div>';
        finalGroup.appendChild(sFinalBox);
        host.appendChild(finalGroup);
      }
    }

    /* SAMPLE: draw one engine-faithful path, light it whole, lay it out as
       the derived tape. */
    function sample() {
      const res = tt.samplePath(rng);   // also lights the leaf path in the tree
      const tree = tt.getTree();
      const chain = pathToLeaf(tree, res.leafId);
      curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
      walkPly = curPath ? curPath.edges.length : 0;     // full reveal on SAMPLE
      renderTape();
    }

    /* STEP / →: if no path yet, sample one but reveal only its first ply;
       otherwise reveal one more ply. Lights the leaf once fully revealed. */
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
      if (walkPly < curPath.edges.length) {
        walkPly++;
        renderTape();
      } else {
        /* Path complete, next STEP draws a fresh one. */
        curPath = null; walkPly = 0;
        sample();
      }
    }

    function reset() {
      curPath = null; walkPly = 0;
      tt.highlightLeaf(null);
      rng = window.Battle.makeRng(0x51A7 + Math.floor(Math.random() * 65535));
      renderTape();
    }

    document.getElementById('traj-sample').addEventListener('click', sample);
    document.getElementById('traj-step').addEventListener('click', step);
    document.getElementById('traj-reset').addEventListener('click', reset);

    renderTape();

    /* &run: auto-sample a path so the screenshot shows a lit path + tape. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(sample, 220);

    return {
      onEnter() {},
      onLeave() {},
      /* Right arrow = walk the current path one more ply (matches STEP). The
         tree itself is the scene; advancing to the next scene is the topbar
         NEXT button. */
      onNextKey() { step(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

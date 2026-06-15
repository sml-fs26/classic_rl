/* Scene 5: THE TRAJECTORY, drawn as a TREE.
 *
 *   tau = (S1, A1, R1, S2, A2, R2, ...) is usually drawn as a flat tape of
 *   random-variable boxes. But that tape is ONE realization: one
 *   root-to-leaf PATH through a branching process. This scene draws the
 *   *set* of possible paths as a tree (window.TrajTree):
 *
 *     - NODES are states (the recurring ACCOUNT CARD: engagement bar +
 *       renewal countdown). The root is the hero card; leaves are the
 *       RENEWED / CHURNED terminals.
 *     - EDGES carry the LEVER (the action, shown on the root edges), the
 *       transition probability p, and the reward r.
 *     - LEAVES carry G_t = the sum of rewards on the path (here the lever
 *       cost paid this month plus the terminal lump).
 *
 *   One sampled trajectory = one highlighted root-to-leaf path. RUN draws a
 *   path with engine-faithful probabilities and lights it; STEP / right-arrow
 *   walks it one ply at a time, the faint tree behind it showing the roads
 *   not taken. A strip under the tree shows the lit path AS THE OLD (S,A,R)
 *   TAPE, so the tape becomes a *derived* view, not the primary object.
 *
 *   Hero root (engine-verified, hand-checkable): ON THE CLIFF (tier 0), m=1
 *   under BIG OFFER. One ply, exactly 2 terminal leaves (RENEWED / CHURNED),
 *   sum p = 1, E[G_t] = 0.88*(+16) + 0.12*(-24) = +11.20 = Q*(CLIFF/m1,
 *   OFFER), and BIG OFFER is the optimal lever there (Q: none 0.0, check
 *   +2.2, offer +11.2). Every leaf is a real terminal with a PURE G_t (no
 *   bootstrap), so the G_t -> E[G_t] lesson is clean. The cliff/big-offer
 *   pairing is the "it finally pays to fight" story scene 7 returns to.
 *
 *   All probabilities/rewards come from window.Churn.successors live; nothing
 *   is hand typed. The hue identity is preserved: red MDP-state root edge,
 *   the lever's own colour on the action chip, ghost-purple reward chip, and
 *   the renewed/churned colour-blind tokens + a glyph on the leaves.
 */
(function () {
  window.scenes = window.scenes || {};

  const Churn  = window.Churn;
  const Levers = window.Levers;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Hero root + the lever whose chance-tree we draw (the argmax there). */
  const HERO_ROOT  = { tier: 0, m: 1, terminal: false };   // ON THE CLIFF, 1 mo
  const HERO_LEVER = 'offer';                               // BIG OFFER (optimal)

  function tierShort(tier) { return T('tier.short.' + Churn.TIERS[tier]); }
  function leverName(id)  { return T('lever.' + id); }
  function leverShort(id) { return T('lever.short.' + id); }

  /* Render the host's state-icon (the ACCOUNT CARD) into ctx.el. Reuses
     window.AccountCard verbatim so the recurring state-icon is identical to
     every other scene: ZERO new icon art. Terminals render the
     renewed/churned glyph (colour-blind token + a check / cross) so the
     outcome reads from the non-colour channel too. */
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

  window.scenes.scene5 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'scene5-scene');
    root.innerHTML = '';

    /*, heading + manager hook, */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene.title5');
    root.appendChild(heading);

    const hook = document.createElement('div');
    hook.className = 'concept-hook';
    hook.innerHTML = T('scene5.manager');
    root.appendChild(hook);

    /*, formula card: tau as a sequence of random variables; the foot
       adds the tree reframe "one trajectory = one path.", */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene5.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`\tau \;=\; (\,S_1, A_1, R_1,\;\; S_2, A_2, R_2,\;\; S_3, A_3, R_3,\;\; \dots\,)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene5.formula.foot') +
      '<br><b class="traj-tree-foot">' + T('scene5.tree.foot') + '</b>';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /*, tree caption: names the fixed root + lever (chance-only tree), */
    const caption = document.createElement('div');
    caption.className = 'traj-tree-caption';
    caption.innerHTML = T('scene5.tree.caption', {
      state: tierShort(HERO_ROOT.tier) + ' · ' + T('months.short', { n: HERO_ROOT.m }),
      lever: '<b class="' + Levers.tokenClass(HERO_LEVER) + '">' + leverName(HERO_LEVER) + '</b>',
    });
    root.appendChild(caption);

    /*, tree host: TrajTree mounts the tree + the E[G_t] ledger here, */
    const treeHost = document.createElement('div');
    treeHost.className = 'traj-tree-host';
    root.appendChild(treeHost);

    /* Ground-truth Q*(HERO_ROOT, HERO_LEVER) for the in-code honesty
       assertion (from the precomputed oracle; cold-entry safe). */
    let groundTruth = null, policy = null;
    try {
      const A = window.DATA.leverIds.length;
      const si = Churn.stateIndex(HERO_ROOT);
      groundTruth = window.DATA.Qstar[si * A + window.DATA.leverIds.indexOf(HERO_LEVER)];
      policy = window.DATA.policy;
    } catch (e) { /* no oracle: skip the numeric assertion */ }

    /* expandPolicy: after the forced root lever, act optimally so the
       weighted leaf sum is exactly Q*(root, HERO_LEVER). All leaves are
       terminal at depth 1 here, so the policy never actually fires, but
       passing it keeps the build honest if the model is ever retuned. */
    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: Churn.successors,
        isTerminal: (s) => !!(s && s.terminal),
        stateKey: Churn.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_LEVER,
      expandPolicy: policy
        ? (s) => policy[Churn.stateIndex(s)]
        : (() => HERO_LEVER),
      maxDepth: 2,
      maxLeaves: 12,
      gamma: 1,
      renderNode: makeRenderNode(),
      actionLabel: (leverId) => leverName(leverId),
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /*, derived tape strip: the lit path AS THE OLD (S,A,R) tape ----
       This makes the flat tape a *derived* view of one path through the tree,
       not the primary object. Empty until a path is sampled / walked. */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'traj-derived';
    tapeWrap.innerHTML =
      '<div class="traj-derived-label">' + T('scene5.derived.label') + '</div>' +
      '<div class="traj-derived-tape traj-rollout" id="traj-derived-tape"></div>';
    root.appendChild(tapeWrap);
    const tapeEl = tapeWrap.querySelector('#traj-derived-tape');

    /*, controls + replay tally, */
    const ctrls = document.createElement('div');
    ctrls.className = 'traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="traj-run">' + T('scene5.btn.run') + '</button>' +
      '<button class="poke-btn" id="traj-step">' + T('scene5.btn.step') + '</button>' +
      '<button class="poke-btn" id="traj-reset">' + T('scene5.btn.reset') + '</button>' +
      '<div class="traj-tally" id="traj-tally"></div>';
    root.appendChild(ctrls);

    /*, punchline, */
    const punch = document.createElement('div');
    punch.className = 'concept-key-question';
    punch.innerHTML = T('scene5.punch');
    root.appendChild(punch);

    /*, walk state ----
       A "current path" is a fixed list of edges from root to a leaf, chosen
       by sampling (engine-faithful). STEP reveals it one ply at a time and
       lights the prefix; RUN draws a fresh path and lights it whole. */
    let rng = Churn.makeRng((0x5C0FF + Math.floor(Math.random() * 0xFFFF)) >>> 0);
    let curPath = null;     // { edges, nodes:[root..leaf], leafId }
    let walkPly = 0;        // how many plies of curPath are revealed (for tape)
    let renewals = 0, churns = 0, runCount = 0;

    /* Build the full node chain for the leaf TrajTree just lit, by replaying
       the sample through the data tree (so the tape matches the lit path). */
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

    function updateTally() {
      const tally = document.getElementById('traj-tally');
      if (!tally) return;
      if (runCount === 0) { tally.innerHTML = ''; return; }
      tally.innerHTML =
        '<span class="traj-tally-lab">' + T('scene5.tally.label', { n: runCount }) + '</span> ' +
        '<span class="traj-tally-pill renewed">' + T('terminal.renewed') + ' ' + renewals + '</span> ' +
        '<span class="traj-tally-pill churned">' + T('terminal.churned') + ' ' + churns + '</span>';
    }

    function renderTape() {
      tapeEl.innerHTML = '';
      if (!curPath) {
        tapeEl.innerHTML = '<div class="traj-empty">' + T('scene5.derived.empty') + '</div>';
        return;
      }
      const reveal = Math.min(walkPly, curPath.edges.length);
      for (let i = 0; i < reveal; i++) {
        const sBefore = curPath.nodes[i].state;
        const e = curPath.edges[i];
        const childState = curPath.nodes[i + 1].state;
        const terminal = !!(childState && childState.terminal);
        const renewed = !!(childState && childState.renewed);
        appendTapeTriple(tapeEl, i + 1, sBefore, e.move, e.reward, terminal, renewed);
      }
      /* On full reveal, surface the path's G_t as the running return. */
      if (reveal === curPath.edges.length && curPath.edges.length > 0) {
        let G = 0; for (const e of curPath.edges) G += e.reward;
        const gtag = document.createElement('div');
        gtag.className = 'traj-derived-g';
        gtag.innerHTML = T('scene5.derived.g', { g: window.TrajTree._fmt.fmtG(G) });
        tapeEl.appendChild(gtag);
      }
      setTimeout(() => { tapeEl.scrollLeft = tapeEl.scrollWidth; }, 60);
    }

    /* One (S, A, R) triple in the derived tape: same box vocabulary as the
       old flat rollout (red S / blue A / reward R), so the student literally
       sees "this path = that tape." */
    function appendTapeTriple(host, step, sBefore, leverId, r, terminal, renewed) {
      const group = document.createElement('div');
      group.className = 'traj-group';

      /* S box: a mini account card. */
      const sBox = document.createElement('div');
      sBox.className = 'traj-box traj-box-state';
      sBox.innerHTML = '<div class="traj-box-label">S<sub>' + step + '</sub></div>';
      const cardHost = document.createElement('div');
      sBox.appendChild(cardHost);
      window.AccountCard.mount(cardHost, { tier: sBefore.tier, m: sBefore.m, size: 'mini' });
      const mlab = document.createElement('div');
      mlab.className = 'traj-box-m';
      mlab.textContent = T('months.short', { n: sBefore.m });
      sBox.appendChild(mlab);
      group.appendChild(sBox);

      /* A box: the lever chip. */
      const aBox = document.createElement('div');
      aBox.className = 'traj-box traj-box-action';
      aBox.innerHTML =
        '<div class="traj-box-label">A<sub>' + step + '</sub></div>' +
        '<div class="traj-chip ' + Levers.tokenClass(leverId) + '">' +
          Levers.leverIconSvg(leverId) + ' ' + leverShort(leverId) +
        '</div>';
      group.appendChild(aBox);

      /* R box: the month's reward (cost + any terminal lump). */
      const rBox = document.createElement('div');
      rBox.className = 'traj-box traj-box-reward';
      if (terminal) rBox.classList.add(renewed ? 'renewed' : 'churned');
      const sign = r >= 0 ? '+' : '−';
      let inner =
        '<div class="traj-box-label">R<sub>' + step + '</sub></div>' +
        '<div class="traj-box-reward-body">' + sign + Math.abs(r) + '</div>';
      if (terminal) inner += '<div class="traj-box-terminal-tag">' +
        T(renewed ? 'terminal.renewed' : 'terminal.churned') + '</div>';
      rBox.innerHTML = inner;
      group.appendChild(rBox);
      host.appendChild(group);

      /* Close the trajectory with the terminal state box. */
      if (terminal) {
        const closeGroup = document.createElement('div');
        closeGroup.className = 'traj-group traj-group-final';
        const fBox = document.createElement('div');
        fBox.className = 'traj-box traj-box-state ' + (renewed ? 'renewed' : 'churned');
        fBox.innerHTML =
          '<div class="traj-box-label">S<sub>' + (step + 1) + '</sub> ' +
            '<span class="traj-box-mini-tag">' + T('terminal.mini') + '</span></div>' +
          '<div class="traj-terminal-card ' + (renewed ? 'renewed' : 'churned') + '">' +
            '<div class="traj-terminal-glyph">' + (renewed ? '✓' : '✗') + '</div>' +
            '<div class="traj-terminal-name">' +
              T(renewed ? 'terminal.renewed' : 'terminal.churned') +
            '</div>' +
          '</div>';
        closeGroup.appendChild(fBox);
        host.appendChild(closeGroup);
      }
    }

    /* RUN: draw one engine-faithful path, light it whole, lay it out as the
       derived tape, and tally the outcome. */
    function run() {
      const res = tt.samplePath(rng);   // also lights the leaf path in the tree
      const tree = tt.getTree();
      const chain = pathToLeaf(tree, res.leafId);
      curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
      walkPly = curPath ? curPath.edges.length : 0;     // full reveal on RUN
      if (curPath) {
        const leafState = curPath.nodes[curPath.nodes.length - 1].state;
        runCount++;
        if (leafState && leafState.renewed) renewals++;
        else if (leafState && leafState.churned) churns++;
      }
      updateTally();
      renderTape();
    }

    /* STEP / right-arrow: if no path yet, sample one but reveal only its
       first ply; otherwise reveal one more ply; once complete, the next STEP
       draws a fresh path. */
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
        const leafState = curPath.nodes[curPath.nodes.length - 1].state;
        runCount++;
        if (leafState && leafState.renewed) renewals++;
        else if (leafState && leafState.churned) churns++;
        updateTally();
        curPath = null; walkPly = 0;
        run();
      }
    }

    function reset() {
      curPath = null; walkPly = 0;
      tt.highlightLeaf(null);
      rng = Churn.makeRng((0x5C0FF + Math.floor(Math.random() * 0xFFFF)) >>> 0);
      renderTape();
    }

    document.getElementById('traj-run').addEventListener('click', run);
    document.getElementById('traj-step').addEventListener('click', step);
    document.getElementById('traj-reset').addEventListener('click', reset);

    renderTape();
    updateTally();

    /* &run: auto-sample a path so the screenshot shows a lit path + tape. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(run, 200);

    return {
      onLeave() {},
      /* Right arrow = walk the current path one more ply (matches STEP). The
         tree itself is the scene; advancing scenes is the topbar NEXT. */
      onNextKey() { step(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

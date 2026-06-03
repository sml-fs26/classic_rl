/* Scene 5 -- The trajectory, drawn as a TREE.
 *
 *   tau = (S1, A1, R1, S2, A2, R2, ..., S_T) is usually drawn as a flat tape
 *   of random-variable boxes. But that tape is ONE realization -- one
 *   root-to-leaf PATH through a branching process. This scene draws the *set*
 *   of possible paths as a tree (window.TrajTree):
 *
 *     - NODES are states, drawn with THIS app's state-icon (window.ShelfCard:
 *       the ticket stack + the X-off calendar). The root keeps an S1 tag.
 *     - EDGES are annotated with the LEVER pulled (shown once, on the root
 *       edges), the demand-draw probability p, and the cash reward r.
 *     - LEAVES carry G_t = the total cash from the root to that leaf (the
 *       run's revenue), at a real terminal (SOLD OUT or MIDNIGHT).
 *
 *   One sampled trajectory = one highlighted root-to-leaf path. PLAY A RUN
 *   draws a path with demand-faithful probabilities and lights it; NEXT DAY /
 *   the right arrow walks that path one day at a time, the faint tree behind
 *   showing the runs not taken. A strip under the tree shows the lit path AS
 *   THE OLD TAPE (S, A, R, ...) so the tape becomes a *derived* view.
 *
 *   Hero root (engine-verified): 2 units, 2 days under STANDARD -- depth <= 2,
 *   5 terminal leaves, Sigma p = 1, E[G_t] = $5.22 = Q*(2u/2d, STANDARD), and
 *   STANDARD is the optimal lever there. Every leaf is a real terminal with a
 *   PURE G_t (no bootstrap), so the G_t -> E[G_t] lesson is clean. We pass
 *   merge:false because two same-day terminals (e.g. two SOLD OUTs) can carry
 *   DIFFERENT cumulative cash, so each terminal must stay its own leaf.
 *
 *   Cold entry: rebuilds entirely from window.Pricing / window.DATA.
 *   &run: auto-plays one full sampled run for headless capture. */
(function () {
  if (!window.scenes) window.scenes = {};

  const P = window.Pricing;
  const L = window.Levers;
  const T = (k, v) => window.I18N.t(k, v);

  /* Hero root + the lever whose chance-tree we draw (the optimal one there). */
  const HERO_ROOT = { u: 2, d: 2, terminal: false };
  const HERO_LEVER = 'standard';

  function leverName(id) { return T('lever.' + id); }

  /* Lever the optimal policy pulls in state s (for the continuation after the
     forced root lever). Falls back to STANDARD if DATA is absent. */
  function policyLever(s) {
    const pol = (window.DATA && window.DATA.policy) || null;
    if (pol) { const id = pol[P.stateIndex(s)]; if (id && L.LEVER_BY_ID[id]) return id; }
    return 'standard';
  }

  /* Render the host's state-icon (a shelf card) into ctx.el. ZERO new icon
     art: reuses window.ShelfCard. Non-terminal states draw the mini shelf
     card; the root gets an S1 tag + the 'sm' size so it reads as the focus.
     Terminal leaves draw a compact SOLD OUT / MIDNIGHT badge so the leaf row
     stays tight and the G_t chip is prominent. */
  function makeRenderNode() {
    return function renderNode(state, ctx) {
      const host = ctx.el;
      const role = ctx.role;
      if (state && state.terminal) {
        const soldout = !!state.soldout;
        host.parentNode && host.parentNode.classList.add(soldout ? 'win' : 'loss');
        host.innerHTML =
          '<div class="tt-pr-final ' + (soldout ? 'soldout' : 'deadline') + '">' +
            '<span class="tt-pr-glyph">' + (soldout ? '✓' : '✈') + '</span>' +
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

  window.scenes.scene5 = function (root) {
    root.className = 'scene-pad concept-scene scene5';
    root.innerHTML = '';

    /* ---- Heading + lede ---- */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = T('scene5.title');
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene5.lede');
    root.appendChild(lede);

    /* ---- Formula card: tau = (S1, A1, R1, ...) ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene5.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      (window.DATA && window.DATA.tex && window.DATA.tex.trajectory) ||
        String.raw`\tau \;=\; (S_1, A_1, R_1,\; S_2, A_2, R_2,\; \ldots,\; S_T)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene5.formula.foot') +
      '<br><b class="s5-tree-foot">' + T('scene5.tree.foot') + '</b>';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Tree caption: names the fixed opening + lever (chance-only tree) ---- */
    const caption = document.createElement('div');
    caption.className = 's5-tree-caption';
    caption.innerHTML = T('scene5.tree.caption', {
      u: HERO_ROOT.u, d: HERO_ROOT.d, lever: leverName(HERO_LEVER),
    });
    root.appendChild(caption);

    /* ---- Tree host -- TrajTree mounts the tree + the E[G_t] ledger here. ---- */
    const treeHost = document.createElement('div');
    treeHost.className = 's5-tree-host';
    root.appendChild(treeHost);

    /* expandPolicy: after the forced root lever, price optimally so the
       weighted leaf sum is exactly Q*(root, HERO_LEVER). Ground truth for the
       in-code honesty assertion comes from value iteration (DATA.Qstar in the
       precompute, recomputed here as a fallback). */
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
      maxDepth: 2,
      maxLeaves: 12,
      merge: false,        // pricing terminals at the same depth can differ in G
      gamma: 1,
      renderNode: makeRenderNode(),
      actionLabel: (leverId) =>
        '<span class="lever-tag tt-pr-lever" data-lever="' + leverId + '">' + leverName(leverId) + '</span>',
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* ---- Derived tape strip: the lit path AS THE OLD (S, A, R) tape ----
       Makes the flat tape a *derived* view of one path through the tree. */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 's5-derived';
    tapeWrap.innerHTML =
      '<div class="s5-derived-label">' + T('scene5.derived.label') + '</div>' +
      '<div class="s5-derived-tape return-tape" id="s5-derived-tape"></div>';
    root.appendChild(tapeWrap);
    const tapeEl = tapeWrap.querySelector('#s5-derived-tape');

    /* ---- Controls ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's5-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s5-sample">' + T('scene5.btn.sample') + '</button>' +
      '<button class="poke-btn" id="s5-step">'   + T('scene5.btn.step')   + '</button>' +
      '<button class="poke-btn" id="s5-reset">'  + T('scene5.btn.reset')  + '</button>' +
      '<div class="s5-status" id="s5-status">' + T('scene5.status.hint') + '</div>';
    root.appendChild(ctrls);

    /* ---- Punchline note ---- */
    const note = document.createElement('p');
    note.className = 'concept-note';
    note.innerHTML = T('scene5.same.note');
    root.appendChild(note);

    /* ===== Walk state ===== */
    let rng = P.makeRng(0x5A11 + ((Math.random() * 0xffff) | 0));
    let curPath = null;     // { edges, nodes:[root..leaf], leafId }
    let walkDay = 0;        // how many days of curPath are revealed (for tape)
    const statusEl = ctrls.querySelector('#s5-status');

    function setStatus(txt) { if (statusEl) statusEl.textContent = txt; }

    /* Replay the sampled leaf through the data tree so the tape matches the
       lit path exactly (the full node chain root..leaf + its edges). */
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
        tapeEl.innerHTML = '<div class="s5-derived-empty">' + T('scene5.derived.empty') + '</div>';
        return;
      }
      const reveal = Math.min(walkDay, curPath.edges.length);
      for (let i = 0; i < reveal; i++) {
        const sBefore = curPath.nodes[i].state;
        const e = curPath.edges[i];
        const childState = curPath.nodes[i + 1].state;
        const terminal = !!(childState && childState.terminal);
        appendTapeTriple(tapeEl, i + 1, sBefore, e.move, e.reward, terminal, childState);
      }
      if (reveal === curPath.edges.length && curPath.edges.length > 0) {
        let G = 0; for (const e of curPath.edges) G += e.reward;
        const gtag = document.createElement('div');
        gtag.className = 's5-derived-g';
        gtag.innerHTML = T('scene5.derived.g', { g: '$' + G });
        tapeEl.appendChild(gtag);
      }
      requestAnimationFrame(() => { tapeEl.scrollLeft = tapeEl.scrollWidth; });
    }

    /* One (S, A, R) triple in the derived tape -- same vocabulary as the old
       flat rollout, so the student literally sees "this path = that tape." */
    function appendTapeTriple(host, step, sBefore, leverId, reward, terminal, finalState) {
      const arrow = document.createElement('span');
      arrow.className = 'tape-arrow'; arrow.textContent = '▶';
      host.appendChild(arrow);

      const group = document.createElement('div');
      group.className = 's5-step';

      const sBox = document.createElement('div');
      sBox.className = 's5-cell s5-cell-s';
      sBox.innerHTML = '<div class="s5-cell-label">' + T('scene5.col.situation') +
        ' <span class="s5-sub">S<sub>' + step + '</sub></span></div>';
      sBox.appendChild(window.ShelfCard.render({ u: sBefore.u, d: sBefore.d }, { size: 'sm', label: false }));
      group.appendChild(sBox);

      const aBox = document.createElement('div');
      aBox.className = 's5-cell s5-cell-a';
      aBox.innerHTML = '<div class="s5-cell-label">' + T('scene5.col.lever') +
        ' <span class="s5-sub">A<sub>' + step + '</sub></span></div>' +
        '<div class="s5-lever"><span class="lever-tag" data-lever="' + leverId + '">' + leverName(leverId) + '</span></div>';
      group.appendChild(aBox);

      const rBox = document.createElement('div');
      rBox.className = 's5-cell s5-cell-r' + (reward > 0 ? ' is-sale' : ' is-nosale');
      rBox.innerHTML = '<div class="s5-cell-label">' + T('scene5.col.cash') +
        ' <span class="s5-sub">R<sub>' + step + '</sub></span></div>' +
        '<div class="s5-r-amt">+$' + reward + '</div>';
      group.appendChild(rBox);

      host.appendChild(group);

      if (terminal && finalState) {
        const arrow2 = document.createElement('span');
        arrow2.className = 'tape-arrow'; arrow2.textContent = '▶';
        host.appendChild(arrow2);

        const soldout = !!finalState.soldout;
        const cap = document.createElement('div');
        cap.className = 's5-cap s5-cap-end';
        cap.innerHTML =
          '<div class="s5-cap-label">S<sub>T</sub></div>' +
          '<div class="s5-midnight-card' + (soldout ? ' is-soldout' : '') + '">' +
            '<div class="s5-midnight-title">' + (soldout ? T('scene5.soldout') : T('scene5.midnight')) + '</div>' +
            '<div class="s5-midnight-sub">' + (soldout ? T('scene5.cleared') : T('scene5.atmidnight')) + '</div>' +
          '</div>';
        host.appendChild(cap);
      }
    }

    /* PLAY A RUN: draw one demand-faithful path, light it whole, lay it out
       as the derived tape. */
    function sample() {
      const res = tt.samplePath(rng);   // also lights the leaf path in the tree
      const chain = pathToLeaf(tt.getTree(), res.leafId);
      curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
      walkDay = curPath ? curPath.edges.length : 0;     // full reveal
      setStatus(T('scene5.status.run'));
      renderTape();
    }

    /* NEXT DAY / right arrow: if no path yet, sample one and reveal its first
       day; otherwise reveal one more day. */
    function step() {
      if (!curPath) {
        const res = tt.samplePath(rng);
        const chain = pathToLeaf(tt.getTree(), res.leafId);
        curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
        walkDay = 1;
        if (curPath) tt.highlightLeaf(curPath.leafId);
        setStatus(T('scene5.status.walk'));
        renderTape();
        return;
      }
      if (walkDay < curPath.edges.length) { walkDay++; renderTape(); }
      else { curPath = null; walkDay = 0; sample(); }   // path complete -> fresh run
    }

    function reset() {
      curPath = null; walkDay = 0;
      tt.highlightLeaf(null);
      rng = P.makeRng(0x5A11 + ((Math.random() * 0xffff) | 0));
      setStatus(T('scene5.status.hint'));
      renderTape();
    }

    ctrls.querySelector('#s5-sample').addEventListener('click', sample);
    ctrls.querySelector('#s5-step').addEventListener('click', step);
    ctrls.querySelector('#s5-reset').addEventListener('click', reset);

    renderTape();

    /* &run: auto-sample a path so the screenshot shows a lit path + tape. */
    if (window.PRICING_AUTORUN) setTimeout(sample, 240);

    return {
      onEnter() {},
      onLeave() {},
      /* Right arrow = walk the current path one more day (matches NEXT DAY).
         The tree IS the scene; the topbar NEXT advances scenes. */
      onNextKey() { step(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

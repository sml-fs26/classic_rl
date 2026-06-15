/* Scene 5 - THE TRAJECTORY, drawn as a TREE.
 *
 *   tau = (S_1, A_1, R_1, S_2, A_2, R_2, ...) is usually written as a flat
 *   tape of random-variable boxes. But that tape is ONE realization - one
 *   root-to-leaf PATH through a branching process. This scene draws the *set*
 *   of possible paths as a tree (window.TrajTree):
 *
 *     - NODES are situations (the recurring table-card: pot meter + standing
 *       badge), in a compact form; the root keeps an S_1 tag.
 *     - EDGES are annotated with the LEVER (shown once, on the root edges),
 *       the transition probability p of that die outcome, and the reward r
 *       (0 every turn here - reward only lands at the terminal +1 / 0).
 *     - LEAVES carry G_t = the return from the root along that path. Because
 *       reward is 0 until the end, G_t IS a win probability here.
 *
 *   THE HERO ROOT (engine-verified): (my 29, riv 41, pot 12), BEHIND, under
 *   ROLL. ROLL is the optimal lever there (catch up). The depth-1 chance tree
 *   has 6 leaves: roll a 2-6 and you are one bank from 50 (win prob 0.73-0.84),
 *   roll a 1 and you BUST - the dice pass to a 41-point rival (win prob 0.18).
 *   E[G_t] = Q*(s, ROLL) = 0.687 exactly (asserted in code).
 *
 *   THE RIVAL-TURN COUPLING (stated on-screen): a bust hands the dice to the
 *   fixed rival. That child is "rival to move" - not your decision and not
 *   terminal - so it is a BOOTSTRAPPED leaf annotated with that state's win
 *   probability (the part you do not control). The grown-pot children are
 *   bootstrapped the same way. The caption says so.
 *
 *   One sampled trajectory = one highlighted root-to-leaf path. SAMPLE draws a
 *   path with die-faithful probabilities and lights it; STEP / -> walks it one
 *   ply at a time, the faint tree behind it showing the roads not taken. A
 *   strip under the tree shows the lit path AS THE OLD TAPE (S_i, A_i, R_i)
 *   so the tape becomes a *derived* view, not the primary one. &run
 *   auto-samples for the headless screenshot.
 */
(function () {
  window.scenes = window.scenes || {};

  const Pig = window.Pig;
  const PT  = window.PigTraj;
  const NB = Pig.POT_BUCKETS;                 // 6
  const DANGER_BUCKET = NB - 1;               // bucket 5 = "21+" = past 20
  const POT_LABELS = Pig.POT_BUCKET_LABELS;
  const STAND_CLASS = ['behind', 'even', 'ahead'];
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* Hero root + the fixed lever whose chance-tree we draw. */
  const HERO_ROOT = { my: 29, riv: 41, pot: 12, terminal: false, turn: 'me' };
  const HERO_LEVER = 'roll';

  function leverName(id) { return T('vocab.' + id); }        // ROLL / HOLD
  function standName(st) { return T('vocab.' + STAND_CLASS[st]); }

  /* A compact inline "mini table-card" for a node: the pot-meter chip stack
     (height = pot bucket, red danger band past 20) on the left, the two-bar
     standing badge (you vs rival, tinted) on the right. Reuses the .tc-* /
     .traj-mini-card CSS - ZERO new state-icon art. */
  function miniCardHtml(my, riv, pot, tag) {
    const pb = Pig.bucketOfPot(pot);
    const st = Pig.standingOf(my, riv);
    const tg = Pig.TARGET;

    let rows = '';
    for (let b = NB - 1; b >= 1; b--) {
      const on = b <= pb ? ' tc-chip-on' : '';
      const danger = b >= DANGER_BUCKET ? ' tc-chip-danger' : '';
      rows += '<div class="tc-chip-row' + danger + on + '"></div>';
    }
    const potDanger = pb >= DANGER_BUCKET ? ' tc-pot-danger' : '';
    const meter =
      '<div class="tc-pot-meter' + potDanger + '">' + rows +
        '<div class="tc-pot-label">' + POT_LABELS[pb] + '</div>' +
      '</div>';

    const pct = (v) => Math.max(0, Math.min(100, (v / tg) * 100));
    const badge =
      '<div class="tc-standing-badge tc-stand-' + STAND_CLASS[st] + '">' +
        '<div class="tc-bar-row tc-bar-you">' +
          '<span class="tc-bar-tag">' + T('vocab.you') + '</span>' +
          '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-you" style="width:' + pct(my) + '%"></span></span>' +
          '<span class="tc-bar-num tc-num-you">' + my + '</span>' +
        '</div>' +
        '<div class="tc-bar-row tc-bar-riv">' +
          '<span class="tc-bar-tag">' + T('vocab.rival') + '</span>' +
          '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-riv" style="width:' + pct(riv) + '%"></span></span>' +
          '<span class="tc-bar-num tc-num-riv">' + riv + '</span>' +
        '</div>' +
        '<div class="tc-standing-tag">' + standName(st) + '</div>' +
      '</div>';

    return (tag ? '<div class="tt-node-tag">' + tag + '</div>' : '') +
      '<div class="table-card table-card-compact traj-mini-card">' + meter + badge + '</div>';
  }

  /* The TrajTree node renderer. Reuses the table-card; terminals reuse the
     win/loss colour-blind treatment + a check / cross glyph; rival-turn
     frontier leaves get a "turn passes" tag so the coupling is legible. */
  function renderNode(state, ctx) {
    const host = ctx.el;
    if (state && state.terminal) {
      const won = !!state.win;
      if (host.parentNode) host.parentNode.classList.add(won ? 'win' : 'loss');
      host.innerHTML =
        '<div class="tt-leaf-final ' + (won ? 'win' : 'loss') + '">' +
          '<span class="tt-leaf-glyph">' + (won ? '✓' : '✗') + '</span>' +
          '<span class="tt-leaf-word">' + (won ? T('vocab.win') : T('vocab.lose')) + '</span>' +
        '</div>';
      return;
    }
    const big = (ctx.role === 'root');
    const rival = (state && state.turn === 'rival');
    if (rival && host.parentNode) host.parentNode.classList.add('tt-node-rival');
    host.innerHTML =
      (rival ? '<div class="tt-node-rival-tag">' + T('scene5.rival.tag') + '</div>' : '') +
      miniCardHtml(state.my, state.riv, state.pot || 0, big ? 'S<sub>1</sub>' : null);
  }

  window.scenes.scene5 = function (root) {
    root.className = 'scene-pad concept-scene';
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene5.heading');
    root.appendChild(heading);

    const lede = document.createElement('div');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene5.lede');
    root.appendChild(lede);

    /*, Formula card: tau as a sequence of random vars; foot adds the tree
       reframe "one trajectory = one path.", */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene5.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`\tau = (\,S_1, A_1, R_1,\; S_2, A_2, R_2,\; \dots,\; S_T\,)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene5.formula.foot') +
      '<br><b class="traj-tree-foot">' + T('scene5.tree.foot') + '</b>';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /*, Tree caption: names the fixed root + lever (chance-only tree)., */
    const caption = document.createElement('div');
    caption.className = 'traj-tree-caption';
    caption.innerHTML = T('scene5.tree.caption', {
      stand: standName(Pig.standingOf(HERO_ROOT.my, HERO_ROOT.riv)),
      pot: POT_LABELS[Pig.bucketOfPot(HERO_ROOT.pot)],
      lever: leverName(HERO_LEVER),
    });
    root.appendChild(caption);

    /*, Tree host: TrajTree mounts the indented tree + the E[G_t] ledger., */
    const treeHost = document.createElement('div');
    treeHost.className = 'traj-tree-host';
    root.appendChild(treeHost);

    /* Ground-truth Q*(HERO_ROOT, ROLL) for the in-code honesty assertion. */
    let groundTruth;
    try { groundTruth = PT.qStar(HERO_ROOT, HERO_LEVER); } catch (e) { groundTruth = undefined; }

    const tt = window.TrajTree.mount(treeHost, {
      engine: {
        successors: PT.successors,
        isTerminal: PT.isTerminal,
        stateKey: PT.stateKey,
      },
      rootState: HERO_ROOT,
      rootAction: HERO_LEVER,
      expandPolicy: PT.optimalLever,
      maxDepth: 1,                 // depth-1: the rival-turn + grown-pot children
      maxLeaves: 12,               // are bootstrapped leaves (see PigTraj header)
      gamma: 1,
      valueFn: PT.valueFn,
      bootstrapFrontier: true,
      renderNode: renderNode,
      actionLabel: (id) => leverName(id),
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* Caption note: the rival-turn / grown-pot leaves are bootstrapped values
       (a win probability), since the turn passes or the game plays on. */
    const bootNote = document.createElement('div');
    bootNote.className = 'traj-tree-bootnote';
    bootNote.innerHTML = T('scene5.tree.bootnote');
    root.appendChild(bootNote);

    /*, Derived tape strip: the lit path AS THE OLD (S, A, R) tape ----
       Empty until a path is sampled/walked. */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'traj-derived';
    tapeWrap.innerHTML =
      '<div class="traj-derived-label">' + T('scene5.derived.label') + '</div>' +
      '<div class="traj-derived-tape pyl-traj-rollout" id="traj-derived-tape"></div>';
    root.appendChild(tapeWrap);
    const tapeEl = tapeWrap.querySelector('#traj-derived-tape');

    /*, Controls + status, */
    const ctrls = document.createElement('div');
    ctrls.className = 'traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="traj-sample">' + T('scene5.btn.sample') + '</button>' +
      '<button class="poke-btn" id="traj-step">' + T('scene5.btn.step') + '</button>' +
      '<button class="poke-btn" id="traj-reset">' + T('scene5.btn.reset') + '</button>' +
      '<div class="traj-status" id="traj-status">' + T('scene5.status.hint') + '</div>';
    root.appendChild(ctrls);

    const caption2 = document.createElement('div');
    caption2.className = 'poke-caption pyl-traj-caption';
    caption2.textContent = T('scene5.caption');
    root.appendChild(caption2);

    /*, Walk state ----
       A "current path" is a fixed list of edges from root to a leaf, chosen by
       sampling (die-faithful). STEP reveals it one ply at a time and lights the
       prefix; SAMPLE draws a fresh path and lights it whole. */
    let rng = Pig.makeRng((0x51A7 + Math.floor(Math.random() * 65535)) >>> 0);
    let curPath = null;     // { edges, nodes:[root..leaf], leafId }
    let walkPly = 0;

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

    function setStatus(html) {
      const el = document.getElementById('traj-status');
      if (el) el.innerHTML = html;
    }

    function renderTape() {
      tapeEl.innerHTML = '';
      if (!curPath) {
        tapeEl.innerHTML = '<div class="traj-derived-empty">' + T('scene5.derived.empty') + '</div>';
        return;
      }
      const reveal = Math.min(walkPly, curPath.edges.length);
      for (let i = 0; i < reveal; i++) {
        const sBefore = curPath.nodes[i].state;
        const e = curPath.edges[i];
        const childNode = curPath.nodes[i + 1];
        appendTapeTriple(tapeEl, i + 1, sBefore, e.move, e.reward, childNode);
      }
      if (reveal === curPath.edges.length && curPath.edges.length > 0) {
        const leaf = curPath.nodes[curPath.nodes.length - 1];
        const gtag = document.createElement('div');
        gtag.className = 'traj-derived-g';
        gtag.innerHTML = T('scene5.derived.g', { g: window.TrajTree._fmt.fmtG(leaf.G != null ? leaf.G : 0) });
        tapeEl.appendChild(gtag);
      }
      setTimeout(() => { tapeEl.scrollLeft = tapeEl.scrollWidth; }, 60);
    }

    /* One (S, A, R) triple in the derived tape - same box vocabulary as the
       old flat rollout (roll/hold-tinted action, reward box), then the child
       situation (or a terminal / "turn passes" closer). */
    function appendTapeTriple(host, step, sBefore, leverId, r, childNode) {
      const child = childNode.state;
      const terminal = !!(child && child.terminal);
      const won = !!(child && child.win);
      const rival = !!(child && child.turn === 'rival');

      const group = document.createElement('div');
      group.className = 'traj-group';

      const sBox = document.createElement('div');
      sBox.className = 'traj-box traj-box-state';
      sBox.innerHTML =
        '<div class="traj-box-label">S<sub>' + step + '</sub></div>' +
        miniCardHtml(sBefore.my, sBefore.riv, sBefore.pot || 0, null);
      group.appendChild(sBox);

      const aBox = document.createElement('div');
      aBox.className = 'traj-box traj-box-action traj-act-' + leverId;
      aBox.innerHTML =
        '<div class="traj-box-label">A<sub>' + step + '</sub></div>' +
        '<div class="traj-box-action-body">' + leverName(leverId) + '</div>';
      group.appendChild(aBox);

      const rBox = document.createElement('div');
      rBox.className = 'traj-box traj-box-reward';
      if (terminal) rBox.classList.add(won ? 'win' : 'loss');
      const sign = r > 0 ? '+' : '';
      let inner =
        '<div class="traj-box-label">R<sub>' + step + '</sub></div>' +
        '<div class="traj-box-reward-body">' + sign + r + '</div>';
      if (terminal) inner += '<div class="traj-box-terminal-tag">' + (won ? T('vocab.win') : T('vocab.lose')) + '</div>';
      rBox.innerHTML = inner;
      group.appendChild(rBox);
      host.appendChild(group);

      /* Close with the child situation: a terminal state box, or - for a
         bootstrapped rival/grown-pot leaf - the next situation tagged with its
         value-to-go (a win probability). */
      const finalGroup = document.createElement('div');
      finalGroup.className = 'traj-group';
      const fBox = document.createElement('div');
      if (terminal) {
        fBox.className = 'traj-box traj-box-state traj-box-state-final ' + (won ? 'win' : 'loss');
        fBox.innerHTML =
          '<div class="traj-box-label">S<sub>' + (step + 1) + '</sub> ' +
            '<span class="traj-box-terminal-mini">' + T('scene5.terminal.mini') + '</span></div>' +
          miniCardHtml(child.my, child.riv, 0, null);
      } else {
        const vto = childNode.G != null ? childNode.G : 0;   // bootstrap value = win prob
        fBox.className = 'traj-box traj-box-state' + (rival ? ' traj-box-bootleaf-rival' : ' traj-box-bootleaf');
        fBox.innerHTML =
          '<div class="traj-box-label">S<sub>' + (step + 1) + '</sub> ' +
            '<span class="traj-box-terminal-mini">' + (rival ? T('scene5.derived.rival') : T('scene5.derived.playon')) + '</span></div>' +
          miniCardHtml(child.my, child.riv, child.pot || 0, null) +
          '<div class="traj-box-boot">' + T('scene5.derived.vto', { v: vto.toFixed(2) }) + '</div>';
      }
      finalGroup.appendChild(fBox);
      host.appendChild(finalGroup);
    }

    function describeLeaf(leaf) {
      if (!leaf || !leaf.state) return '';
      const s = leaf.state;
      if (s.terminal) return s.win ? T('scene5.status.win') : T('scene5.status.lose');
      if (s.turn === 'rival') return T('scene5.status.rival', { v: (leaf.G != null ? leaf.G : 0).toFixed(2) });
      return T('scene5.status.playon', { v: (leaf.G != null ? leaf.G : 0).toFixed(2) });
    }

    /* SAMPLE: draw one die-faithful path, light it whole, lay it out as the
       derived tape. */
    function sample() {
      const res = tt.samplePath(rng);      // lights the leaf path in the tree
      const tree = tt.getTree();
      const chain = pathToLeaf(tree, res.leafId);
      curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
      walkPly = curPath ? curPath.edges.length : 0;
      renderTape();
      const leaf = curPath ? curPath.nodes[curPath.nodes.length - 1] : null;
      setStatus(T('scene5.status.sampled', { outcome: describeLeaf(leaf) }));
    }

    /* STEP / ->: if no path yet, sample one but reveal only its first ply;
       otherwise reveal one more ply; once complete, the next STEP re-samples. */
    function step() {
      if (!curPath) {
        const res = tt.samplePath(rng);
        const tree = tt.getTree();
        const chain = pathToLeaf(tree, res.leafId);
        curPath = chain ? { edges: chain.edges, nodes: chain.nodes, leafId: res.leafId } : null;
        walkPly = 1;
        if (curPath) tt.highlightLeaf(curPath.leafId);
        renderTape();
        setStatus(T('scene5.status.walking'));
        return;
      }
      if (walkPly < curPath.edges.length) {
        walkPly++;
        renderTape();
      } else {
        curPath = null; walkPly = 0;
        sample();
      }
    }

    function reset() {
      curPath = null; walkPly = 0;
      tt.highlightLeaf(null);
      rng = Pig.makeRng((0x51A7 + Math.floor(Math.random() * 65535)) >>> 0);
      renderTape();
      setStatus(T('scene5.status.hint'));
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
      /* Right arrow = walk the current path one more ply (matches STEP). */
      onNextKey() { step(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

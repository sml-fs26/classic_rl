/* window.TrajTree -- the reusable trajectory-as-tree widget.
 *
 *   A trajectory tau = (S1, A1, R1, S2, A2, R2, ...) is one root-to-leaf
 *   PATH through a branching process. This widget draws the *set* of paths
 *   as a tree and defines E[G_t] visibly as the weighted leaf sum:
 *
 *       E[G_t] = sum over leaves of  P(path) * G_t(path),
 *                P(path) = product of the edge-probs on the path.
 *
 *   It is engine-agnostic. The host supplies an `engine` adapter
 *   (`successors(s,a) -> [{ sNext, p, reward }]`, plus `isTerminal` /
 *   `stateKey`) and a `renderNode(state, ctx)` callback that paints the
 *   host's own state-icon. Everything else (chance-only-under-policy
 *   expansion, depth and leaf caps, low-probability pruning into one honest
 *   aggregate leaf, DAG merging of duplicate successors, the ledger, path
 *   highlighting, and sampling) is owned here.
 *
 *   Explosion control (see mdp-gallery/reference/trajectory-tree.md):
 *     (c) chance-only: branch on (s',r) outcomes only; the action at a node
 *         comes from rootAction (depth 0) then expandPolicy thereafter.
 *     (a) near-terminal root: leaves are real terminals with a pure G_t.
 *     (b) depth-limit + bootstrap: a still-open frontier node becomes a leaf
 *         annotated G_t = partialReturn + valueFn(leafState). Honest Bellman
 *         truncation; the weighted sum still equals the true value.
 *     (d) merge: collapse equal stateKey within a depth, sum inbound p.
 *
 *   Honesty is asserted in code at mount: sum of leaf P == 1 (to 1e-6) and,
 *   when the caller passes `assertValue`, the computed E[G_t] equals that
 *   ground-truth value (to its tolerance). Probabilities are NEVER
 *   hard-coded; they come from engine.successors live.
 *
 *   Pure-data first, DOM second:
 *     window.TrajTree.build(rootState, opts) -> { root, nodes, leaves, EG }
 *     window.TrajTree.enumeratePaths(tree)   -> [{ leafState, P, G, edges }]
 *     window.TrajTree.mount(host, opts)      -> { update, highlightLeaf,
 *                                                 samplePath, getTree, getEG,
 *                                                 destroy }
 */
(function () {

  /* ---------- small helpers ---------- */

  function defaultStateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.win ? 'WIN' : (s.lose ? 'LOSS' : 'T?');
    if (s.your !== undefined && s.opp !== undefined) return s.your + '|' + s.opp;
    return JSON.stringify(s);
  }
  function defaultIsTerminal(s) { return !!(s && s.terminal); }

  /* A compact ASCII reward label: -1, +10, -10. Press Start 2P has a narrow
     glyph set, so edge chips stay plain ASCII (no delta, no unicode minus). */
  function fmtReward(r) { return (r >= 0 ? '+' : '') + r; }
  /* p as a leading-dot fraction: 0.225 to ".225", 1 to "1.00". */
  function fmtP(p) {
    if (p >= 1) return '1.00';
    return ('' + p.toFixed(3)).replace(/^0/, '');
  }
  function fmtG(g) {
    return (g >= 0 ? '+' : '') + (Math.abs(g) % 1 === 0 ? g.toFixed(0) : g.toFixed(2));
  }
  function fmtSigned2(v) { return (v >= 0 ? '+' : '') + v.toFixed(2); }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function escapeKey(k) {
    return String(k).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* =====================================================================
     PURE DATA -- build the chance tree.
     =====================================================================

     Node shape:
       { id, state, key, role, depth,
         move,        // action taken AT this node (fixed; chance-only)
         gPartial,    // sum of rewards root..this node's entry
         P,           // path-probability of reaching this node
         bootV,       // bootstrap value added if this is a bootstrapped
                      //   frontier leaf (else undefined)
         G,           // leaf return (terminal: pure; frontier: gPartial+bootV)
         aggregated,  // true for the folded "rare" leaf
         children: [{ p, reward, node }] }

     role is one of: 'root' | 'inner' | 'terminal' | 'frontier' | 'aggregate'.
  */
  function build(rootState, opts) {
    opts = opts || {};
    const successors    = opts.successors;
    const isTerminal    = opts.isTerminal || defaultIsTerminal;
    const stateKey      = opts.stateKey || defaultStateKey;
    const rootAction    = opts.rootAction;            // forced action at depth 0
    const expandPolicy  = opts.expandPolicy || (() => rootAction);
    const maxDepth      = opts.maxDepth != null ? opts.maxDepth : 2;
    const maxLeaves     = opts.maxLeaves != null ? opts.maxLeaves : 12;
    const pPrune        = opts.pPrune != null ? opts.pPrune : 0.02;
    const merge         = opts.merge !== false;       // default true
    const gamma         = opts.gamma != null ? opts.gamma : 1;
    const valueFn       = opts.valueFn || null;
    const bootstrapFrontier = opts.bootstrapFrontier != null
      ? opts.bootstrapFrontier : !!valueFn;

    if (typeof successors !== 'function') {
      throw new Error('TrajTree.build: opts.successors must be a function');
    }

    const nodes = [];
    let uid = 0;
    function mkNode(state, role, depth, move, gPartial, P) {
      const n = {
        id: uid++, state, key: stateKey(state), role, depth,
        move, gPartial, P, bootV: undefined, G: undefined,
        aggregated: false, children: [],
      };
      nodes.push(n);
      return n;
    }

    const root = mkNode(rootState, 'root', 0, null, 0, 1);

    /* Breadth-first by depth so the DAG merge (per-depth Map) is clean and
       the leaf cap is applied against a fully-known frontier. */
    let frontier = [root];
    for (let depth = 0; depth < maxDepth; depth++) {
      const next = [];
      const byKey = new Map();   // per-depth merge map (DAG)

      for (const parent of frontier) {
        if (isTerminal(parent.state)) continue;     // already a leaf
        const action = (depth === 0 && rootAction != null)
          ? rootAction
          : expandPolicy(parent.state, depth);
        parent.move = action;

        const succ = successors(parent.state, action) || [];
        for (const out of succ) {
          const sNext = out.sNext, p = out.p, reward = out.reward;
          const childP = parent.P * p;
          const childG = parent.gPartial + gamma * reward;

          if (isTerminal(sNext)) {
            // Two terminals of the same kind (e.g. two LOSS paths) merge so
            // their p sums honestly; otherwise each terminal is its own leaf.
            const k = 'T:' + stateKey(sNext);
            let leaf = merge ? byKey.get(k) : null;
            if (leaf) {
              leaf.P += childP;
              parent.children.push({ p, reward, node: leaf });
            } else {
              leaf = mkNode(sNext, 'terminal', depth + 1, null, childG, childP);
              leaf.G = childG;     // pure terminal return
              if (merge) byKey.set(k, leaf);
              parent.children.push({ p, reward, node: leaf });
            }
          } else {
            const k = 'S:' + stateKey(sNext);
            let child = merge ? byKey.get(k) : null;
            if (child) {
              child.P += childP;
              parent.children.push({ p, reward, node: child });
            } else {
              child = mkNode(sNext, 'inner', depth + 1, null, childG, childP);
              if (merge) byKey.set(k, child);
              next.push(child);
              parent.children.push({ p, reward, node: child });
            }
          }
        }
      }
      frontier = next;
    }

    /* Any node still open on the frontier (non-terminal at maxDepth) becomes
       a frontier leaf. Bootstrapped if a valueFn is provided. */
    for (const n of frontier) {
      if (isTerminal(n.state)) { n.role = 'terminal'; n.G = n.gPartial; continue; }
      n.role = 'frontier';
      if (bootstrapFrontier && valueFn) {
        n.bootV = gamma * valueFn(n.state);
        n.G = n.gPartial + n.bootV;
      } else {
        // No bootstrap: leaf carries only the partial return collected so far.
        // (Used only when the caller explicitly opts out; the value assertion
        // is then meaningless and should not be supplied.)
        n.G = n.gPartial;
      }
    }

    /* Collect leaves (terminal + frontier, plus an already-terminal root). */
    let leaves = nodes.filter(n => n.role === 'terminal' || n.role === 'frontier');
    if (leaves.length === 0 && (root.role === 'terminal' || root.role === 'frontier')) {
      leaves = [root];
    }

    /* Leaf cap + low-probability prune into one honest aggregate. */
    leaves = applyLeafCap(leaves, nodes, maxLeaves, pPrune);

    /* E[G_t] = sum of P * G over the final leaf set. */
    let EG = 0, sumP = 0;
    for (const lf of leaves) { EG += lf.P * lf.G; sumP += lf.P; }

    return {
      root, nodes, leaves, EG, sumP,
      opts: {
        maxDepth, maxLeaves, pPrune, merge, gamma,
        bootstrapped: !!(bootstrapFrontier && valueFn),
      },
    };
  }

  /* Fold the lowest-probability leaves into a single aggregate leaf when the
     leaf count exceeds maxLeaves, OR when at least two leaves fall below
     pPrune. The aggregate carries the exact residual probability and the
     probability-weighted mean G of the folded paths, so sum of P*G over the
     displayed leaves is never a lie. */
  function applyLeafCap(leaves, nodes, maxLeaves, pPrune) {
    if (!leaves.length) return leaves;
    const sorted = leaves.slice().sort((a, b) => b.P - a.P);

    let foldIdx = sorted.length;            // index from which we fold
    if (sorted.length > maxLeaves) foldIdx = maxLeaves - 1;  // reserve a slot

    // Fold a trailing run of sub-pPrune leaves only if >1 would fold (a single
    // rare-but-honest leaf is shown as itself).
    let pruneStart = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].P < pPrune) { pruneStart = i; break; }
    }
    if (sorted.length - pruneStart >= 2) foldIdx = Math.min(foldIdx, pruneStart);

    if (foldIdx >= sorted.length) return sorted;

    const kept = sorted.slice(0, foldIdx);
    const folded = sorted.slice(foldIdx);
    let foldP = 0, foldWeighted = 0;
    for (const f of folded) { foldP += f.P; foldWeighted += f.P * f.G; }
    const aggG = foldP > 0 ? foldWeighted / foldP : 0;

    const agg = {
      id: -1, state: null, key: 'AGG', role: 'aggregate', depth: -1,
      move: null, gPartial: aggG, P: foldP, bootV: undefined, G: aggG,
      aggregated: true, foldedCount: folded.length, children: [],
    };
    nodes.push(agg);
    kept.push(agg);
    return kept;
  }

  /* enumeratePaths -- walk root to leaf, collecting edges/P/G of each path.
     For merged DAGs this re-expands shared nodes, so a path is reported once
     per distinct route. The widget's E[G_t] uses the merged-leaf P from
     build(); enumeratePaths is a convenience for tests / tape derivation. */
  function enumeratePaths(tree) {
    const out = [];
    function rec(node, P, G, edges) {
      if (!node.children || node.children.length === 0) {
        out.push({
          leafState: node.state, P, G: node.G != null ? node.G : G,
          edges, role: node.role, aggregated: !!node.aggregated,
        });
        return;
      }
      for (const e of node.children) {
        rec(e.node, P * e.p, G + e.reward,
            edges.concat([{ move: node.move, p: e.p, reward: e.reward }]));
      }
    }
    rec(tree.root, 1, 0, []);
    return out;
  }

  /* =====================================================================
     DOM -- render an indented vertical tree (mobile-first, no SVG).
     =====================================================================

     Each node is a row: [spine][a . p . r chips][compact state-icon]. Children
     indent under their parent via a left-border spine driven by a --tt-depth
     custom property. Leaves get a G_t chip; terminals reuse the host's
     win/loss icon. Below the tree, a weighted-sum ledger (one row per leaf)
     makes E[G_t] = sum of P*G concrete and gives each leaf a hover/tap
     highlight tied to its root-to-leaf path.
  */

  const T = (k) => (window.I18N ? window.I18N.t(k) : null);
  // Built-in label fallbacks so the widget reads even without i18n keys.
  function lbl(key, fallback) { const v = T(key); return (v && v !== key) ? v : fallback; }

  function mount(host, opts) {
    opts = opts || {};
    const engine = opts.engine || {};
    const successors = engine.successors;
    const isTerminal = engine.isTerminal || defaultIsTerminal;
    const stateKey   = engine.stateKey || defaultStateKey;
    const renderNode = opts.renderNode;       // (state, ctx) -> void  [HOST]
    const edgeLabel  = opts.edgeLabel || null;
    const layout     = opts.layout || 'v';
    const sfx        = opts.sfx || null;
    const actionLabel = opts.actionLabel || null;   // (moveId) -> html, optional

    if (typeof successors !== 'function') {
      throw new Error('TrajTree.mount: opts.engine.successors must be a function');
    }
    if (typeof renderNode !== 'function') {
      throw new Error('TrajTree.mount: opts.renderNode must be a function');
    }

    const buildOpts = {
      successors, isTerminal, stateKey,
      rootState:    opts.rootState,
      rootAction:   opts.rootAction,
      expandPolicy: opts.expandPolicy,
      maxDepth:     opts.maxDepth != null ? opts.maxDepth : 2,
      maxLeaves:    opts.maxLeaves != null ? opts.maxLeaves : 12,
      pPrune:       opts.pPrune != null ? opts.pPrune : 0.02,
      merge:        opts.merge,
      gamma:        opts.gamma != null ? opts.gamma : 1,
      valueFn:      opts.valueFn || null,
      bootstrapFrontier: opts.bootstrapFrontier,
    };

    // Honesty controls supplied by the host (NOT hard-coded probabilities).
    const assertValue = opts.assertValue;     // ground-truth E[G_t] / Q* / V
    const assertTol   = opts.assertTol != null ? opts.assertTol : 1e-6;

    host.classList.add('tt-host');
    host.classList.add(layout === 'h' ? 'tt-layout-h' : 'tt-layout-v');

    const treePanel = el('div', 'tt-tree');
    const ledgerPanel = el('div', 'tt-eg-ledger');
    host.appendChild(treePanel);
    host.appendChild(ledgerPanel);

    let tree = null;
    let leafRowEls = new Map();   // leaf.id -> ledger row element

    function rebuild(rootState) {
      if (rootState != null) buildOpts.rootState = rootState;
      tree = build(buildOpts.rootState, buildOpts);
      assertHonesty(tree);
      renderTree();
      renderLedger();
      setLit(null);
    }

    /* In-code honesty assertion (per spec; never by hard-coded probs). */
    function assertHonesty(t) {
      const sumOk = Math.abs(t.sumP - 1) < 1e-6;
      if (!sumOk) {
        console.warn('TrajTree: leaf P sums to ' + t.sumP.toFixed(8) +
                     ', expected 1 (within 1e-6).');
      }
      if (assertValue != null) {
        const diff = Math.abs(t.EG - assertValue);
        if (diff > assertTol) {
          console.warn('TrajTree: E[G_t]=' + t.EG.toFixed(8) +
                       ' differs from value ' + assertValue.toFixed(8) +
                       ' by ' + diff.toExponential(2) + ' (tol ' + assertTol + ').');
        }
      }
      return sumOk;
    }

    /* ---- Render the indented vertical tree ---- */
    function renderTree() {
      treePanel.innerHTML = '';
      const seen = new Set();   // DAG: render a merged node once (first reach)

      function walk(node, edgeToHere, depth, parentMove) {
        if (seen.has(node.id)) {
          treePanel.appendChild(mergeRefRow(node, edgeToHere, depth, parentMove));
          return;
        }
        seen.add(node.id);
        treePanel.appendChild(nodeRow(node, edgeToHere, depth, parentMove));
        for (const e of (node.children || [])) {
          walk(e.node, e, depth + 1, node.move);
        }
      }
      walk(tree.root, null, 0, null);

      // The aggregate leaf has no edge in the drawn tree; append it last.
      const agg = tree.leaves.find(l => l.aggregated);
      if (agg) treePanel.appendChild(aggregateRow(agg));
    }

    function nodeRow(node, edgeToHere, depth, parentMove) {
      const row = el('div', 'tt-row');
      row.style.setProperty('--tt-depth', depth);
      row.dataset.nodeId = node.id;
      if (node.role === 'root') row.classList.add('tt-row-root');
      if (node.role === 'terminal') row.classList.add('tt-row-terminal');
      if (node.role === 'frontier') row.classList.add('tt-row-frontier');

      row.appendChild(el('div', 'tt-spine'));

      if (edgeToHere) row.appendChild(edgeChips(edgeToHere, depth, parentMove));

      const nodeBox = el('div', 'tt-node');
      nodeBox.classList.add(node.role === 'root' ? 'tt-node-root' : 'tt-node-inner');
      if (node.role === 'terminal') nodeBox.classList.add('tt-node-terminal');
      if (node.role === 'frontier') nodeBox.classList.add('tt-node-frontier');

      const iconHost = el('div', 'tt-node-icon');
      const role = node.role === 'root' ? 'root'
        : (node.role === 'terminal' ? 'terminal'
        : (node.role === 'frontier' ? 'frontier' : 'inner'));
      try { renderNode(node.state, { role, el: iconHost, node }); }
      catch (e) { iconHost.textContent = escapeKey(stateKey(node.state)); }
      nodeBox.appendChild(iconHost);
      row.appendChild(nodeBox);

      if (node.role === 'terminal' || node.role === 'frontier') {
        row.appendChild(leafChip(node));
        row.classList.add('tt-row-leaf');
        row.dataset.leafId = node.id;
        attachLeafHover(row, node);
      }
      return row;
    }

    function mergeRefRow(node, edgeToHere, depth, parentMove) {
      const row = el('div', 'tt-row tt-row-mergeref');
      row.style.setProperty('--tt-depth', depth);
      row.dataset.nodeId = node.id;
      row.appendChild(el('div', 'tt-spine'));
      if (edgeToHere) row.appendChild(edgeChips(edgeToHere, depth, parentMove));
      row.appendChild(el('div', 'tt-mergeref-tag',
        lbl('tt.merge', 'merges &uarr;') + ' ' + escapeKey(node.key)));
      return row;
    }

    function aggregateRow(agg) {
      const row = el('div', 'tt-row tt-row-aggregate');
      row.style.setProperty('--tt-depth', 1);
      row.dataset.leafId = agg.id;
      row.appendChild(el('div', 'tt-spine'));
      const box = el('div', 'tt-node tt-node-aggregate');
      box.appendChild(el('div', 'tt-aggregate-icon',
        '<span class="tt-aggregate-dots">&hellip;</span>'));
      row.appendChild(box);
      row.appendChild(el('div', 'tt-agg-meta',
        lbl('tt.rare', 'rare') + ' &times;' + agg.foldedCount +
        ' &middot; p ' + fmtP(agg.P)));
      row.appendChild(leafChip(agg));
      attachLeafHover(row, agg);
      return row;
    }

    /* Edge chips: action only on edges leaving the root (action is constant
       per node, so repeating it is noise); probability + reward everywhere. */
    function edgeChips(edge, depth, parentMove) {
      const wrap = el('div', 'tt-edge');
      if (depth === 1 && parentMove != null) {
        let html;
        if (actionLabel) html = actionLabel(parentMove);
        else if (edgeLabel) html = edgeLabel({ move: parentMove }, { depth });
        else html = escapeKey(String(parentMove).toUpperCase());
        wrap.appendChild(el('span', 'tt-chip tt-chip-action', html));
      }
      wrap.appendChild(el('span', 'tt-chip tt-chip-p', 'p ' + fmtP(edge.p)));
      wrap.appendChild(el('span', 'tt-chip tt-chip-r', 'r ' + fmtReward(edge.reward)));
      return wrap;
    }

    function leafChip(node) {
      const wrap = el('div', 'tt-leaf-g');
      wrap.classList.add(node.G >= 0 ? 'pos' : 'neg');
      if (node.bootV !== undefined) {
        wrap.classList.add('tt-leaf-boot');
        wrap.innerHTML =
          '<span class="tt-leaf-g-label">G<sub>t</sub></span>' +
          '<span class="tt-leaf-g-val">' + fmtG(node.G) + '</span>' +
          '<span class="tt-leaf-g-boot">' + fmtReward(Math.round(node.gPartial)) +
            ' +V ' + fmtSigned2(node.bootV) + '</span>';
      } else {
        wrap.innerHTML =
          '<span class="tt-leaf-g-label">G<sub>t</sub></span>' +
          '<span class="tt-leaf-g-val">' + fmtG(node.G) + '</span>';
      }
      return wrap;
    }

    /* ---- Render the weighted-sum ledger ---- */
    function renderLedger() {
      ledgerPanel.innerHTML = '';
      leafRowEls = new Map();

      const head = el('div', 'tt-eg-head');
      ledgerPanel.appendChild(head);
      if (window.Katex && window.Katex.render) {
        window.Katex.render(
          String.raw`\mathbb{E}[G_t] \;=\; \sum_{\text{leaves}} P(\text{path}) \cdot G_t`,
          head, true
        );
      } else {
        head.textContent = 'E[G_t] = sum over leaves of P(path) * G_t';
      }

      const table = el('div', 'tt-eg-rows');
      ledgerPanel.appendChild(table);

      const hr = el('div', 'tt-eg-row tt-eg-row-head');
      hr.innerHTML =
        '<span class="tt-eg-c-p">P(path)</span>' +
        '<span class="tt-eg-c-x">&times;</span>' +
        '<span class="tt-eg-c-g">G<sub>t</sub></span>' +
        '<span class="tt-eg-c-eq">=</span>' +
        '<span class="tt-eg-c-term">P&middot;G</span>';
      table.appendChild(hr);

      const ordered = tree.leaves.slice().sort((a, b) => {
        if (a.aggregated) return 1;
        if (b.aggregated) return -1;
        return b.P - a.P;
      });

      for (const lf of ordered) {
        const term = lf.P * lf.G;
        const row = el('div', 'tt-eg-row');
        row.dataset.leafId = lf.id;
        if (lf.aggregated) row.classList.add('tt-eg-row-agg');
        row.innerHTML =
          '<span class="tt-eg-c-p">' + fmtP(lf.P) + '</span>' +
          '<span class="tt-eg-c-x">&times;</span>' +
          '<span class="tt-eg-c-g ' + (lf.G >= 0 ? 'pos' : 'neg') + '">' + fmtG(lf.G) + '</span>' +
          '<span class="tt-eg-c-eq">=</span>' +
          '<span class="tt-eg-c-term ' + (term >= 0 ? 'pos' : 'neg') + '">' + fmtSigned2(term) + '</span>';
        leafRowEls.set(lf.id, row);
        attachLeafHover(row, lf);
        table.appendChild(row);
      }

      const sumRow = el('div', 'tt-eg-row tt-eg-row-sum');
      sumRow.innerHTML =
        '<span class="tt-eg-sum-label">' + lbl('tt.eg', 'E[G_t]') + ' =</span>' +
        '<span class="tt-eg-sum-val ' + (tree.EG >= 0 ? 'pos' : 'neg') + '">' +
          fmtSigned2(tree.EG) + '</span>';
      table.appendChild(sumRow);
    }

    /* ---- path / leaf highlighting (instant class swap, never a transition) ---- */
    let litLeafId = null;

    function pathNodeIdsTo(leafId) {
      const ids = new Set();
      function find(node, chain) {
        if (node.id === leafId) { chain.forEach(id => ids.add(id)); ids.add(node.id); return true; }
        for (const e of (node.children || [])) {
          if (find(e.node, chain.concat([node.id]))) return true;
        }
        return false;
      }
      find(tree.root, []);
      ids.add(leafId);
      return ids;
    }

    function setLit(leafId) {
      treePanel.querySelectorAll('.tt-row.tt-lit, .tt-row.tt-dim').forEach(r => {
        r.classList.remove('tt-lit', 'tt-dim');
      });
      leafRowEls.forEach(r => r.classList.remove('tt-eg-lit'));
      litLeafId = leafId;
      if (leafId == null) return;

      const ids = pathNodeIdsTo(leafId);
      treePanel.querySelectorAll('.tt-row').forEach(r => {
        const nid = r.dataset.nodeId != null ? parseInt(r.dataset.nodeId, 10) : null;
        const lid = r.dataset.leafId != null ? parseInt(r.dataset.leafId, 10) : null;
        const onPath = (nid != null && ids.has(nid)) || (lid != null && lid === leafId);
        r.classList.toggle('tt-lit', onPath);
        r.classList.toggle('tt-dim', !onPath);
      });
      const lr = leafRowEls.get(leafId);
      if (lr) lr.classList.add('tt-eg-lit');
    }

    function attachLeafHover(row, leaf) {
      row.addEventListener('mouseenter', () => setLit(leaf.id));
      row.addEventListener('mouseleave', () => { if (litLeafId === leaf.id) return; setLit(null); });
      row.addEventListener('click', () => {
        if (litLeafId === leaf.id) setLit(null);
        else { setLit(leaf.id); if (sfx && sfx.play) sfx.play('cursor'); }
      });
    }

    /* ---- sample one path within the drawn tree (engine-faithful by p) ---- */
    function samplePath(rng) {
      rng = rng || Math.random;
      let node = tree.root;
      const edges = [];
      let G = 0;
      while (node.children && node.children.length) {
        const u = rng();
        let cum = 0, chosen = node.children[node.children.length - 1];
        for (const e of node.children) { cum += e.p; if (u < cum) { chosen = e; break; } }
        edges.push({ move: node.move, p: chosen.p, reward: chosen.reward });
        G += chosen.reward;
        node = chosen.node;
      }
      if (node.bootV !== undefined) G += node.bootV;
      setLit(node.id);
      return { edges, leafState: node.state, leafId: node.id, G: node.G != null ? node.G : G };
    }

    /* ---- public API ---- */
    rebuild(buildOpts.rootState);

    return {
      update(newOpts) {
        if (newOpts) Object.assign(buildOpts, newOpts);
        rebuild(newOpts && newOpts.rootState != null ? newOpts.rootState : buildOpts.rootState);
      },
      highlightLeaf(id) { setLit(id); },
      samplePath,
      getTree() { return tree; },
      getEG() { return tree.EG; },
      destroy() {
        host.classList.remove('tt-host', 'tt-layout-v', 'tt-layout-h');
        host.innerHTML = '';
        tree = null; leafRowEls.clear();
      },
    };
  }

  window.TrajTree = {
    build, enumeratePaths, mount,
    // expose formatters so hosts/tests can match on-screen strings
    _fmt: { fmtReward, fmtP, fmtG, fmtSigned2 },
  };
})();

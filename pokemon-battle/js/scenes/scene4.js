/* Scene 4 — SARSA learns it. REDESIGNED for pedagogy.
 *
 *   Same precomputed Q-snapshots as before (episodes 0,1,5,25,100,500,2000),
 *   same Q-table render via QTable.mount, same learning curve below.  What's
 *   new:
 *
 *   A. A narrator dialog box above the grid that defines "episode = one
 *      battle" and tells the story per snapshot ("PIKACHU just played its
 *      first battle, a few cells got their first updates", ...).
 *   B. The SARSA update rule rendered above the grid in a Pokemon-styled
 *      formula card.  Each chunk is colour-coded back to its prior-viz
 *      origin (ANYmal-red for Q(s,a), Darts-amber for α, Spooky-purple for
 *      the TD target r+γQ(s',a'), Casino-blue for the ε-greedy a' selection).
 *   C. A click-cell inspector panel on the right of the Q-table.  Click any
 *      state -> see its four Q-values at THIS snapshot, the per-move deltas
 *      since the previous snapshot, total visit count across training, and
 *      a cross-reference to scene 2's converged V at the same state.  The
 *      load-bearing piece: students see WHY this cell's Q for THIS move
 *      moved, not just THAT it moved.
 *
 *   QTable.mount now exposes `setOnCellClick(handler)` + `getCellNode(s)` +
 *   max-Q heatmap classes on every update.  Everything else inherited.
 *
 *   `&run` flag auto-scrubs through all snapshots for headless verification.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB = window.Battle.NUM_BUCKETS;          // 5
  const BUCKETS = window.Battle.BUCKETS;
  const ACTIONS = window.Moves.MOVE_IDS;
  const A = ACTIONS.length;
  const STATES = window.Bellman.STATES;

  function moveShort(id) { return window.QTable.shortMoveLabel(id); }

  /* Narration adapts to the actual episode count of the snapshot, so the
     viz survives precompute changes that add / remove snapshots. */
  function narrationFor(snapIdx, snap) {
    if (snapIdx === 0) {
      return "Episode 0. PIKACHU has played zero battles. Q = 0 by initialization.";
    }
    const ep = snap ? snap.episode : 0;
    if (ep <= 1)    return "After 1 battle, the (state, move) pairs PIKACHU visited got their first update. Most cells still zero.";
    if (ep <= 10)   return "Around " + ep + " battles. Coverage grows; cells near WIN catch positive Q.";
    if (ep <= 50)   return ep + " battles. Visit-frequent states settling. THUNDERBOLT pulling ahead in the healthy region.";
    if (ep <= 200)  return ep + " battles. Argmax stable across most-visited cells. Rare states still wobbling.";
    if (ep <= 1000) return ep + " battles. Nearly converged. Q creeps up slowly via the Bellman target.";
    return ep + " battles. Q has converged. Compare to scene 2's V — same policy, learned only from battles.";
  }

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const cfg = window.DATA.params.sarsa;
    const snapshots = window.DATA.sarsa.snapshots;
    const rewardSeries = window.DATA.sarsa.rewardPerEpisode;
    const visitCounts = window.DATA.sarsa.visitCounts || [];
    const viGamma = window.DATA.params.gammaDefault;
    const viKey = viGamma.toFixed(2);
    const viV = window.DATA.valueIteration.V[viKey];
    const viPolicy = window.DATA.valueIteration.policy[viKey];

    /* ---------- Section heading ---------- */
    const heading = document.createElement('h2');
    heading.className = 'poke-section-title';
    heading.textContent = 'SARSA — PIKACHU LEARNS Q FROM ITS OWN BATTLES';
    root.appendChild(heading);

    /* ---------- Narrator dialog ---------- */
    const narratorHost = document.createElement('div');
    narratorHost.className = 'sc4-narrator';
    root.appendChild(narratorHost);
    const narrator = window.Dialog.mount(narratorHost);

    /* ---------- SARSA formula card (colour-coded chunks) ---------- */
    const formulaCard = document.createElement('div');
    formulaCard.className = 'sc4-formula-card';
    formulaCard.innerHTML =
      '<div class="sc4-formula">' +
        '<span class="comp-mdp">Q(s, a)</span>' +
        ' ← ' +
        '<span class="comp-mdp">Q(s, a)</span>' +
        ' + ' +
        '<span class="comp-rm">α</span>' +
        ' [ <span class="comp-bellman">r + γ&middot;Q(s′, a′)</span>' +
        ' − <span class="comp-mdp">Q(s, a)</span> ]' +
      '</div>' +
      '<div class="sc4-formula-legend">' +
        '<span class="legend-chip comp-mdp">Q(s, a)</span><span> ANYmal — MDP\'s action-value</span>' +
        '<span class="legend-chip comp-rm">α</span><span> Darts — RM learning rate</span>' +
        '<span class="legend-chip comp-bellman">r + γ·Q(s′, a′)</span><span> Spooky — TD target (sampled, not enumerated)</span>' +
        '<span class="legend-chip comp-eps">a, a′ via ε-greedy</span><span> Casino — picks actions</span>' +
      '</div>';
    root.appendChild(formulaCard);

    /* ---------- Param strip (read-only) ---------- */
    const params = document.createElement('div');
    params.className = 'sc4-params';
    params.innerHTML =
      '<div class="poke-menu-row"><span>&epsilon;</span><span class="val">' + cfg.epsilon.toFixed(2) + '</span></div>' +
      '<div class="poke-menu-row"><span>&alpha;</span><span class="val">' + cfg.alpha.toFixed(2) + '</span></div>' +
      '<div class="poke-menu-row"><span>&gamma;</span><span class="val">' + cfg.gamma.toFixed(2) + '</span></div>' +
      '<div class="poke-menu-row"><span>EPISODES</span><span class="val">' + cfg.episodes + '</span></div>';
    root.appendChild(params);

    /* ---------- Scrubber ---------- */
    const scrub = document.createElement('div');
    scrub.className = 'scrubber';
    scrub.innerHTML =
      '<div class="scr-label">EP: <span id="sc4-ep">0</span></div>' +
      '<input type="range" id="sc4-range" min="0" max="' + (snapshots.length - 1) + '" step="1" value="0">' +
      '<div class="scr-snapshots" id="sc4-snaps"></div>';
    root.appendChild(scrub);
    const snapsHost = scrub.querySelector('#sc4-snaps');
    for (let i = 0; i < snapshots.length; i++) {
      const pill = document.createElement('button');
      pill.className = 'scr-snap';
      pill.type = 'button';
      pill.textContent = String(snapshots[i].episode);
      pill.dataset.idx = String(i);
      pill.addEventListener('click', () => setCursor(i));
      snapsHost.appendChild(pill);
    }

    /* ---------- Two-column row: Q-table + inspector ---------- */
    const row = document.createElement('div');
    row.className = 'sc4-row';
    root.appendChild(row);

    const qHost = document.createElement('div');
    qHost.className = 'sc4-q';
    row.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const inspector = document.createElement('div');
    inspector.className = 'sc4-inspector poke-box tight';
    row.appendChild(inspector);

    /* ---------- Learning curve ---------- */
    const lcWrap = document.createElement('div');
    lcWrap.className = 'sc4-lc-wrap';
    root.appendChild(lcWrap);
    const lcHeader = document.createElement('div');
    lcHeader.className = 'poke-section-title sc4-lc-header';
    lcHeader.textContent = 'WIN-RATE PER EPISODE';
    lcWrap.appendChild(lcHeader);
    const lcHost = document.createElement('div');
    lcWrap.appendChild(lcHost);
    const lc = window.LearningCurve.mount(lcHost, { window: 100 });
    lc.setData(rewardSeries);

    /* ---------- Caption ---------- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.innerHTML =
      'Each cell is a state (your HP × opp HP). One <b>episode</b> = one battle ≈ 4–10 turns. ' +
      'Each turn produces one Q-update via the formula above. ' +
      'Click any cell to see its four Q-values, the deltas since the previous snapshot, and how SARSA\'s answer compares to scene 2\'s value iteration.';
    root.appendChild(caption);

    /* ---------- State + render ---------- */
    let cursor = 0;
    let selectedState = 0;   // default: state index 0 = (FULL, FULL)
    function stateIndex(y, o) { return y * NB + o; }

    function setCursor(i) {
      i = Math.max(0, Math.min(snapshots.length - 1, i));
      cursor = i;
      const snap = snapshots[i];
      document.getElementById('sc4-ep').textContent = String(snap.episode);
      const range = document.getElementById('sc4-range');
      if (parseInt(range.value, 10) !== i) range.value = String(i);
      const qArr = snap.Q;
      const Q = new Float32Array(qArr.length);
      for (let k = 0; k < qArr.length; k++) Q[k] = qArr[k];
      qtbl.update(Q);
      lc.setCursor(snap.episode);
      const pills = scrub.querySelectorAll('.scr-snap');
      pills.forEach((p, k) => p.classList.toggle('active', k === i));
      narrator.say(narrationFor(i, snap));
      renderInspector();
    }

    /* Inspector: re-renders for the currently-selected state at the
       currently-active snapshot. Shows current Q + deltas vs prev snap +
       VI cross-ref + total visits. */
    function renderInspector() {
      if (selectedState < 0) {
        inspector.innerHTML = '<div class="sc4-ins-placeholder">Click any cell on the Q-table to see how its Q values are evolving.</div>';
        return;
      }
      const s = selectedState;
      const st = STATES[s];
      const snap = snapshots[cursor];
      const prevSnap = cursor > 0 ? snapshots[cursor - 1] : null;
      const stateLabel = '(YOUR=' + BUCKETS[st.your].toUpperCase() + ', OPP=' + BUCKETS[st.opp].toUpperCase() + ')';

      const base = s * A;
      const curr = ACTIONS.map((aid, a) => snap.Q[base + a]);
      const prev = prevSnap ? ACTIONS.map((aid, a) => prevSnap.Q[base + a]) : null;
      let argmax = 0, argmaxVal = -Infinity;
      let allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(curr[a]) > 1e-9) allZero = false;
        if (curr[a] > argmaxVal) { argmaxVal = curr[a]; argmax = a; }
      }

      const visits = visitCounts[s] || 0;
      const viValue = viV ? viV[s] : null;
      const viOptimal = viPolicy ? viPolicy[s] : null;

      let html = '';
      html += '<div class="sc4-ins-state">STATE ' + stateLabel + '</div>';
      html += '<div class="sc4-ins-meta">SNAPSHOT: EP ' + snap.episode + ' &middot; total visits during training: <b>' + visits + '</b></div>';

      if (allZero) {
        if (snap.episode === 0) {
          html += '<div class="sc4-ins-empty">Episode 0 — training has not started. Q is initialized to 0 across all four moves.</div>';
        } else {
          html += '<div class="sc4-ins-empty">PIKACHU has not reached this state in the first ' + snap.episode + ' battles. Q remains at 0 until the agent visits it.</div>';
        }
      } else {
        html += '<div class="sc4-ins-block-title">Q-values now</div>';
        html += '<div class="sc4-ins-moves">';
        for (let a = 0; a < A; a++) {
          const isArg = (a === argmax);
          const v = curr[a];
          html += '<div class="sc4-ins-move ' + (isArg ? 'argmax' : '') + '">' +
                    '<span class="sc4-ins-move-name">' + window.Moves.MOVE_BY_ID[ACTIONS[a]].name + '</span>' +
                    '<span class="sc4-ins-move-q">' + (v >= 0 ? '+' : '') + v.toFixed(2) + '</span>' +
                    (isArg ? '<span class="sc4-ins-arg">◀ ARGMAX</span>' : '<span></span>') +
                  '</div>';
        }
        html += '</div>';
      }

      if (prev) {
        const prevEp = prevSnap.episode;
        html += '<div class="sc4-ins-block-title">Δ since EP ' + prevEp + '</div>';
        html += '<div class="sc4-ins-deltas">';
        for (let a = 0; a < A; a++) {
          const d = curr[a] - prev[a];
          let cls = 'zero';
          if (d > 0.01) cls = 'pos';
          else if (d < -0.01) cls = 'neg';
          const sign = d > 0 ? '+' : (d < 0 ? '' : '±');
          html += '<div class="sc4-ins-delta-row ' + cls + '">' +
                    '<span class="sc4-ins-move-name">' + window.Moves.MOVE_BY_ID[ACTIONS[a]].name + '</span>' +
                    '<span class="sc4-ins-prev">' + (prev[a] >= 0 ? '+' : '') + prev[a].toFixed(2) + ' →</span>' +
                    '<span class="sc4-ins-curr">' + (curr[a] >= 0 ? '+' : '') + curr[a].toFixed(2) + '</span>' +
                    '<span class="sc4-ins-delta-val">' + sign + d.toFixed(2) + '</span>' +
                  '</div>';
        }
        html += '</div>';
      }

      if (viValue != null) {
        const viMoveName = viOptimal ? window.Moves.MOVE_BY_ID[viOptimal].name : '—';
        const match = !allZero && viOptimal === ACTIONS[argmax];
        html += '<div class="sc4-ins-block-title">Versus scene 2 (VI)</div>';
        html += '<div class="sc4-ins-vi-row">' +
                  '<span>V(s) from VI:</span><span class="sc4-ins-num">' + viValue.toFixed(2) + '</span>' +
                '</div>';
        html += '<div class="sc4-ins-vi-row">' +
                  '<span>VI argmax:</span><span><b>' + viMoveName + '</b></span>' +
                '</div>';
        if (!allZero) {
          html += '<div class="sc4-ins-vi-match ' + (match ? 'good' : 'bad') + '">' +
                    (match ? '✓ SARSA\'s argmax matches VI' : '✗ SARSA\'s argmax differs — this state may need more visits') +
                  '</div>';
        }
      }

      inspector.innerHTML = html;
    }

    /* Click-cell handler: highlight selected cell + re-render inspector. */
    qtbl.setOnCellClick((s, cell) => {
      const prevNode = qtbl.getCellNode(selectedState);
      if (prevNode) prevNode.classList.remove('selected');
      selectedState = s;
      cell.classList.add('selected');
      renderInspector();
    });

    /* Apply default selection highlight on first render. */
    const range = scrub.querySelector('#sc4-range');
    range.addEventListener('input', () => setCursor(parseInt(range.value, 10)));

    setCursor(0);
    const defaultNode = qtbl.getCellNode(selectedState);
    if (defaultNode) defaultNode.classList.add('selected');

    /* `&run` flag: auto-scrub to the final snapshot. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      let i = 0;
      function adv() {
        if (i >= snapshots.length) return;
        setCursor(i);
        i++;
        if (i < snapshots.length) setTimeout(adv, 800);
      }
      setTimeout(adv, 200);
    }

    return {
      onEnter() {
        const r = parseInt(range.value, 10);
        setCursor(r);
        const node = qtbl.getCellNode(selectedState);
        if (node) node.classList.add('selected');
      },
      onNextKey() {
        const i = parseInt(range.value, 10);
        if (i < snapshots.length - 1) { setCursor(i + 1); return true; }
        return false;
      },
      onPrevKey() {
        const i = parseInt(range.value, 10);
        if (i > 0) { setCursor(i - 1); return true; }
        return false;
      },
    };
  };
})();

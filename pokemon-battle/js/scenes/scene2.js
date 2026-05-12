/* Scene 2 — Value iteration over the 25-state grid, REDESIGNED for clarity.
 *
 *   Same algorithm + same data as before, but the UI rebuilt for pedagogy:
 *     • Cells are heat-map coloured (green = winning state, red = losing).
 *     • The start state (FULL, FULL) wears a "START" badge.
 *     • The grid is surrounded by visible +10 WIN and −10 LOSS strips so
 *       the off-grid terminal anchors are no longer invisible — students
 *       see where V propagates *from*.
 *     • A Pokemon-style narrator dialog above the grid tells the story per
 *       iteration ("V starts at zero", "Terminals leak inward", …).
 *     • Clicking any cell opens a side inspector that shows the live
 *       Bellman expansion at THAT cell: the four moves' Q-values computed
 *       from the *current* V snapshot, with the argmax highlighted. The
 *       inspector re-renders on every STEP, so students watch the
 *       expectation get built across iterations.
 *     • RUN ticks at 1000 ms per iter (was 500 ms) so the eye has time.
 *     • Per-cell optimal-move label is shown DURING iteration (argmax over
 *       the current V snapshot), not only at convergence.
 *
 *   Data comes from DATA.valueIteration.byGamma (V snapshots) +
 *   Battle.successors() (live Bellman expansion). No new precompute needed.
 *
 *   &run flag auto-clicks RUN for headless verification.
 */
(function () {
  window.scenes = window.scenes || {};

  const GAMMA = window.DATA.params.gammaDefault;
  const BUCKETS = window.DATA.buckets;         // ['full', 'high', 'mid', 'low', 'critical']
  const NB = BUCKETS.length;                    // 5

  /* Narrator lines, indexed by RUN/STEP cursor. Kept short so the
     typewriter (45 ms/char) finishes inside one RUN tick (1000 ms). RUN
     calls narrator.say with { instant: true } anyway to avoid clipping. */
  const NARRATIONS = [
    "V = 0 everywhere. Click STEP to advance.",
    "Cells touching WIN / LOSS learned the terminal reward.",
    "Neighbours just learned from them. Info flows inward.",
    "Another layer outward. Each cell looks one step further.",
    "ΔV shrinks. Almost there.",
    "Values keep refining.",
    "Last few sweeps. The grid is settling.",
  ];

  function narrationFor(cursor, converged) {
    if (converged) return "V converged. Click any cell to see the math.";
    if (cursor < NARRATIONS.length) return NARRATIONS[cursor];
    return "ΔV shrinking. Values stabilising.";
  }

  function moveShort(id) {
    return window.QTable && window.QTable.shortMoveLabel
      ? window.QTable.shortMoveLabel(id) : id;
  }

  function vColorClass(v) {
    if (v >= 5) return 'v-pos-strong';
    if (v >= 1.5) return 'v-pos-mid';
    if (v <= -5) return 'v-neg-strong';
    if (v <= -1.5) return 'v-neg-mid';
    return 'v-neutral';
  }
  const ALL_V_CLASSES = ['v-pos-strong', 'v-pos-mid', 'v-neutral', 'v-neg-mid', 'v-neg-strong'];

  /* Compute the Q-value (expected return) for (state, move) under the
     given V snapshot. Mirrors the Bellman backup the precompute uses. */
  function qOf(state, moveId, currentV) {
    const succ = window.Battle.successors(state, moveId);
    let total = 0;
    for (const t of succ) {
      const sN = t.sNext;
      const vNext = sN.terminal ? 0 : currentV[sN.your * NB + sN.opp];
      total += t.p * (t.reward + GAMMA * vNext);
    }
    return total;
  }

  function argmaxAt(state, currentV) {
    let bestId = null, bestQ = -Infinity;
    for (const m of window.Moves.MOVES) {
      const q = qOf(state, m.id, currentV);
      if (q > bestQ) { bestQ = q; bestId = m.id; }
    }
    return bestId;
  }

  window.scenes.scene2 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    /* ---------- Section heading ---------- */
    const heading = document.createElement('h2');
    heading.className = 'poke-section-title';
    heading.textContent = 'VALUE ITERATION — V(YOUR HP, OPP HP)';
    root.appendChild(heading);

    /* ---------- Narrator dialog box ---------- */
    const narratorHost = document.createElement('div');
    narratorHost.className = 'sc2-narrator';
    root.appendChild(narratorHost);
    const narrator = window.Dialog.mount(narratorHost);

    /* ---------- Bellman formula card (moved above the grid) ---------- */
    const fcard = document.createElement('div');
    fcard.className = 'poke-formula sc2-formula';
    window.Katex.render(window.DATA.tex.bellman, fcard, true);
    root.appendChild(fcard);

    /* ---------- HUD strip ---------- */
    const hud = document.createElement('div');
    hud.className = 'hud-strip sc2-hud';
    hud.innerHTML =
      '<div class="hud-item"><div class="hud-label">ITER</div><div class="hud-val" id="sc2-iter">0</div></div>' +
      '<div class="hud-item"><div class="hud-label">MAX &Delta;V</div><div class="hud-val" id="sc2-delta">—</div></div>' +
      '<div class="hud-item"><div class="hud-label">&gamma;</div><div class="hud-val">' + GAMMA.toFixed(2) + '</div></div>';
    root.appendChild(hud);

    /* ---------- Two-column row: grid + inspector ---------- */
    const row = document.createElement('div');
    row.className = 'sc2-row';
    root.appendChild(row);

    /* Left: grid block (CSS grid with terminal strips on right + bottom) */
    const gridBlock = document.createElement('div');
    gridBlock.className = 'sc2-grid-block';
    row.appendChild(gridBlock);

    const grid = document.createElement('div');
    grid.className = 'state-grid sc2-state-grid';
    grid.style.setProperty('--nb', String(NB));
    gridBlock.appendChild(grid);

    /* Row 1 of the grid: corner + 5 column labels + WIN header */
    const corner = document.createElement('div');
    corner.className = 'axis-corner';
    corner.innerHTML = 'YOUR HP<br>vs OPP HP';
    grid.appendChild(corner);
    for (const b of BUCKETS) {
      const lbl = document.createElement('div');
      lbl.className = 'axis-label col';
      lbl.textContent = b.toUpperCase();
      grid.appendChild(lbl);
    }
    const winHdr = document.createElement('div');
    winHdr.className = 'terminal-hdr win';
    winHdr.innerHTML = 'WIN<br>+10';
    grid.appendChild(winHdr);

    /* Rows 2-6 of the grid: row label + 5 state cells + WIN strip cell */
    const cellMap = {};
    for (let y = 0; y < NB; y++) {
      const rl = document.createElement('div');
      rl.className = 'row-label';
      rl.textContent = BUCKETS[y].toUpperCase();
      grid.appendChild(rl);

      for (let o = 0; o < NB; o++) {
        const c = document.createElement('div');
        c.className = 'state-cell clickable';
        c.dataset.y = String(y);
        c.dataset.o = String(o);
        c.innerHTML = '<span class="v-val">0.00</span><span class="v-move">—</span>';
        if (y === 0 && o === 0) c.classList.add('start-state');
        c.addEventListener('click', () => selectCell(y, o));
        grid.appendChild(c);
        cellMap[y + '|' + o] = c;
      }

      const winStrip = document.createElement('div');
      winStrip.className = 'terminal-strip win';
      winStrip.textContent = '+10';
      grid.appendChild(winStrip);
    }

    /* Row 7 of the grid: LOSS header + 5 LOSS strip cells + corner */
    const lossHdr = document.createElement('div');
    lossHdr.className = 'terminal-hdr loss';
    lossHdr.innerHTML = 'LOSS<br>−10';
    grid.appendChild(lossHdr);
    for (let o = 0; o < NB; o++) {
      const lossCell = document.createElement('div');
      lossCell.className = 'terminal-strip loss';
      lossCell.textContent = '−10';
      grid.appendChild(lossCell);
    }
    const cornerBR = document.createElement('div');
    cornerBR.className = 'terminal-corner';
    grid.appendChild(cornerBR);

    /* Right: inspector panel */
    const inspector = document.createElement('div');
    inspector.className = 'vi-inspector poke-box tight';
    row.appendChild(inspector);

    /* ---------- Controls ---------- */
    const ctrl = document.createElement('div');
    ctrl.className = 'poke-menu-row sc2-ctrl';
    ctrl.innerHTML =
      '<button id="sc2-run" type="button">RUN VALUE ITERATION</button>' +
      '<button id="sc2-step" type="button">STEP</button>' +
      '<button id="sc2-reset" type="button">RESET</button>';
    root.appendChild(ctrl);

    /* ---------- Caption ---------- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.innerHTML =
      '<b>V(s)</b> is the expected total reward from state <i>s</i>, if you play optimally from here onward. ' +
      'Green cells = winning states, red = losing. Each iteration recomputes V(s) from its successors’ V — ' +
      'so the +10 WIN strip on the right and −10 LOSS strip below leak inward across the grid.';
    root.appendChild(caption);

    /* ---------- Data ---------- */
    const histKey = GAMMA.toFixed(2);
    const HISTORY = window.DATA.valueIteration.byGamma[histKey];
    const ITERS = window.DATA.valueIteration.iters[histKey];
    const N = NB * NB;

    /* ---------- State + render ---------- */
    let cursor = 0;
    let selectedCell = { y: 0, o: 0 };   // default selection: the BATTLE START cell
    let timer = null;
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

    function renderInspector() {
      if (!selectedCell) {
        inspector.innerHTML = '<div class="ins-placeholder">Click any cell on the grid to see the math behind its V.</div>';
        return;
      }
      const { y, o } = selectedCell;
      const state = { your: y, opp: o, terminal: false };
      const snap = HISTORY[Math.min(cursor, HISTORY.length - 1)];
      const currentV = snap.V;
      const stateLabel = '(YOUR=' + BUCKETS[y].toUpperCase() + ', OPP=' + BUCKETS[o].toUpperCase() + ')';
      const currV = currentV[y * NB + o];

      const qs = window.Moves.MOVES.map(m => ({ move: m, q: qOf(state, m.id, currentV) }));
      let best = qs[0];
      for (const cq of qs) if (cq.q > best.q) best = cq;

      let html = '';
      html += '<div class="ins-state-label">STATE ' + stateLabel + '</div>';
      html += '<div class="ins-current-v">V(s) this iter = <span class="ins-num">' + currV.toFixed(2) + '</span></div>';
      html += '<div class="ins-explain">For each move <i>a</i>, compute<br>' +
              '<span class="mono">Q(s,a) = Σ p · [r + γ·V(s′)]</span><br>' +
              'using this iter’s V. Pick the max — that becomes V(s) <b>next</b> iter.</div>';
      html += '<div class="ins-moves">';
      for (const { move, q } of qs) {
        const isArg = (move.id === best.move.id);
        html += '<div class="ins-move-row ' + (isArg ? 'argmax' : '') + '">' +
                  '<span class="ins-move-name">' + move.name + '</span>' +
                  '<span class="ins-move-q">' + q.toFixed(2) + '</span>' +
                  (isArg ? '<span class="ins-arg-arrow">◀ MAX</span>' : '<span></span>') +
                '</div>';
      }
      html += '</div>';
      html += '<div class="ins-footer">Next iter ▶ V(s) ← <span class="ins-num">' + best.q.toFixed(2) + '</span><br>' +
              'optimal move = <b>' + best.move.name + '</b></div>';
      inspector.innerHTML = html;
    }

    function selectCell(y, o) {
      if (selectedCell) {
        const prev = cellMap[selectedCell.y + '|' + selectedCell.o];
        if (prev) prev.classList.remove('selected');
      }
      selectedCell = { y, o };
      const cell = cellMap[y + '|' + o];
      if (cell) cell.classList.add('selected');
      renderInspector();
    }

    function renderAt(iterIdx, opts) {
      const o = opts || {};
      const snap = HISTORY[Math.min(iterIdx, HISTORY.length - 1)];
      const converged = iterIdx >= ITERS;
      document.getElementById('sc2-iter').textContent = String(snap.iter);
      document.getElementById('sc2-delta').textContent = (Number.isFinite(snap.maxDelta) ? snap.maxDelta.toExponential(2) : '—');
      narrator.say(narrationFor(iterIdx, converged), o.instantNarrator ? { instant: true } : undefined);

      for (let i = 0; i < N; i++) {
        const yi = Math.floor(i / NB), oi = i % NB;
        const cell = cellMap[yi + '|' + oi];
        const v = snap.V[i];
        const valEl = cell.querySelector('.v-val');
        const moveEl = cell.querySelector('.v-move');
        const newText = v.toFixed(2);
        const changed = (valEl.textContent !== newText);
        if (changed) {
          valEl.textContent = newText;
          cell.classList.remove('flash');
          void cell.offsetWidth;
          cell.classList.add('flash');
        }
        /* Heatmap colour */
        for (const cls of ALL_V_CLASSES) cell.classList.remove(cls);
        cell.classList.add(vColorClass(v));
        /* Live argmax — recomputed from current V */
        const armId = argmaxAt({ your: yi, opp: oi, terminal: false }, snap.V);
        moveEl.textContent = armId ? moveShort(armId) : '—';
      }
      renderInspector();
    }

    function reset() {
      clearTimer();
      cursor = 0;
      renderAt(0);
      /* Re-highlight default selection. */
      const cell = cellMap[selectedCell.y + '|' + selectedCell.o];
      if (cell) cell.classList.add('selected');
    }
    function step() {
      clearTimer();
      if (cursor < HISTORY.length - 1) cursor++;
      renderAt(cursor);
    }
    function run() {
      clearTimer();
      cursor = 0;
      renderAt(0, { instantNarrator: true });
      function tick() {
        if (cursor >= HISTORY.length - 1) {
          renderAt(cursor, { instantNarrator: true });
          return;
        }
        cursor++;
        renderAt(cursor, { instantNarrator: true });
        timer = setTimeout(tick, 1000);
      }
      timer = setTimeout(tick, 400);
    }

    document.getElementById('sc2-run').addEventListener('click', run);
    document.getElementById('sc2-step').addEventListener('click', step);
    document.getElementById('sc2-reset').addEventListener('click', reset);

    /* Default selection is BATTLE START. */
    reset();

    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(run, 100);

    return {
      onEnter() { reset(); },
      onLeave() { clearTimer(); },
      onNextKey() {
        if (cursor < HISTORY.length - 1) { step(); return true; }
        return false;
      },
      onPrevKey() {
        if (cursor > 0) {
          clearTimer();
          cursor--;
          renderAt(cursor);
          return true;
        }
        return false;
      },
    };
  };
})();

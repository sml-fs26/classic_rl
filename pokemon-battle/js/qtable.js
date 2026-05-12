/* Scene-4 Q-table render — redesign: 3×3 state grid + per-cell battle
 * thumbnail + per-move Q-bars + change-deltas + move-frequency strip.
 *
 * Why the layout pivoted from a flat 9-row table:
 *   - The state is intrinsically 2-D (your HP × opp HP). A flat list hides
 *     that structure; a 3×3 grid lays it out the way the student already
 *     thinks about a Pokemon battle.
 *   - Each cell carries a mini-thumbnail (Pikachu + Charmander + HP bars)
 *     so "MID / LOW" reads at a glance as "half-hurt vs almost-dead".
 *   - Q-values render as horizontal bars (length = relative magnitude
 *     within the cell) AND as numbers. Argmax bar is Pikachu-yellow + ▶.
 *   - On scrub: floating ±delta numbers rise from cells whose argmax-Q
 *     moved (mirrors scene 1's damage chips for tonal coherence).
 *   - Below the grid: a 4-row move-frequency strip showing how often
 *     each move is argmax across the 9 states at this snapshot.
 *
 * API kept stable: mount(host) → { update(Q, opts), reset }. Helpers
 * shortMoveLabel / stateLabel / moveFrequencies still exported. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;
  const STATES = window.Bellman.STATES;
  const A = ACTIONS.length;
  const N = STATES.length;

  const BUCKET_IDX = { full: 0, mid: 1, low: 2 };
  /* HP percentages used for the mini-thumbnail bars. These are not
     simulation values — they're representative levels for the bucket. */
  const BUCKET_PCT = { full: 100, mid: 50, low: 18 };

  function shortMoveLabel(id) {
    switch (id) {
      case 'quick_attack': return 'QUICK';
      case 'thunderbolt':  return 'BOLT';
      case 'iron_tail':    return 'IRON';
      case 'thunder':      return 'THUN';
    }
    return id;
  }

  function stateLabel(s) {
    return s.your.toUpperCase() + ' / ' + s.opp.toUpperCase();
  }

  function bucketClass(b) {
    return b === 'low' ? 'low' : b === 'mid' ? 'mid' : '';
  }

  function mount(host) {
    host.classList.add('qtable-host');
    host.innerHTML = '';

    /* ----- Header row above the grid: column labels for opp HP ----- */
    const headerRow = document.createElement('div');
    headerRow.className = 'q-col-heads';
    headerRow.innerHTML =
      '<div class="q-corner-head">YOUR HP \\ OPP HP</div>' +
      '<div class="q-col-head">OPP FULL</div>' +
      '<div class="q-col-head">OPP MID</div>' +
      '<div class="q-col-head">OPP LOW</div>';
    host.appendChild(headerRow);

    /* ----- 3×3 grid of state cells (with left-edge row labels) ----- */
    const grid = document.createElement('div');
    grid.className = 'q-grid';
    host.appendChild(grid);

    /* Insert left-side row labels (your HP) inline with the grid. */
    const rowLabels = ['YOUR FULL', 'YOUR MID', 'YOUR LOW'];
    for (let r = 0; r < 3; r++) {
      const lab = document.createElement('div');
      lab.className = 'q-row-head';
      lab.textContent = rowLabels[r];
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(r + 1);
      grid.appendChild(lab);
    }

    const cellNodes = [];   /* per state index s: { cell, bars: {a -> {row, fill, mark, val}} } */
    for (let s = 0; s < N; s++) {
      const st = STATES[s];
      const cell = document.createElement('div');
      cell.className = 'q-cell';
      /* CSS grid: col = opp bucket + 2 (after the row-label column),
                   row = your bucket + 1 */
      cell.style.gridColumn = String(BUCKET_IDX[st.opp] + 2);
      cell.style.gridRow = String(BUCKET_IDX[st.your] + 1);
      cell.dataset.state = stateLabel(st);

      /* Thumbnail row — two Pokemon side-by-side with mini HP bars. */
      const thumb = document.createElement('div');
      thumb.className = 'q-thumb';
      thumb.innerHTML =
        '<div class="q-thumb-side player">' +
          '<img src="assets/pikachu-back.png" class="q-thumb-sprite" alt="Pikachu">' +
          '<div class="q-thumb-hp-bg">' +
            '<div class="q-thumb-hp-fill ' + bucketClass(st.your) + '" style="width:' + BUCKET_PCT[st.your] + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="q-thumb-side opponent">' +
          '<img src="assets/charmander-front.png" class="q-thumb-sprite" alt="Charmander">' +
          '<div class="q-thumb-hp-bg">' +
            '<div class="q-thumb-hp-fill ' + bucketClass(st.opp) + '" style="width:' + BUCKET_PCT[st.opp] + '%"></div>' +
          '</div>' +
        '</div>';
      cell.appendChild(thumb);

      /* Q-bars — one row per move. */
      const bars = document.createElement('div');
      bars.className = 'q-bars';
      const barNodes = [];
      for (let a = 0; a < A; a++) {
        const aid = ACTIONS[a];
        const row = document.createElement('div');
        row.className = 'q-bar-row';
        row.dataset.move = aid;
        row.innerHTML =
          '<span class="q-mark"></span>' +
          '<span class="q-label">' + shortMoveLabel(aid) + '</span>' +
          '<span class="q-bar-track"><span class="q-bar-fill"></span></span>' +
          '<span class="q-val">—</span>';
        bars.appendChild(row);
        barNodes[a] = {
          row: row,
          mark: row.querySelector('.q-mark'),
          fill: row.querySelector('.q-bar-fill'),
          val: row.querySelector('.q-val'),
        };
      }
      cell.appendChild(bars);

      grid.appendChild(cell);
      cellNodes[s] = { cell, bars: barNodes, state: st };
    }

    /* ----- Move-frequency strip below the grid ----- */
    const freqStrip = document.createElement('div');
    freqStrip.className = 'q-freq-strip';
    const freqTitle = document.createElement('div');
    freqTitle.className = 'q-freq-title';
    freqTitle.textContent = 'ARGMAX DISTRIBUTION ACROSS THE 9 STATES';
    freqStrip.appendChild(freqTitle);
    const freqRows = {};
    for (const aid of ACTIONS) {
      const row = document.createElement('div');
      row.className = 'q-freq-row';
      row.dataset.move = aid;
      row.innerHTML =
        '<span class="q-freq-label">' + shortMoveLabel(aid) + '</span>' +
        '<span class="q-freq-track"><span class="q-freq-fill"></span></span>' +
        '<span class="q-freq-val">0</span>';
      freqStrip.appendChild(row);
      freqRows[aid] = {
        fill: row.querySelector('.q-freq-fill'),
        val: row.querySelector('.q-freq-val'),
      };
    }
    host.appendChild(freqStrip);

    /* ----- Legend ----- */
    const legend = document.createElement('div');
    legend.className = 'q-legend';
    legend.innerHTML =
      '<span class="q-legend-item"><span class="q-legend-bar argmax"></span> ARGMAX MOVE (▶)</span>' +
      '<span class="q-legend-item"><span class="q-legend-bar"></span> OTHER MOVES</span>' +
      '<span class="q-legend-item">— = STATE NEVER VISITED</span>';
    host.appendChild(legend);

    let prevQ = null;

    function update(Q, opts) {
      const o = opts || {};
      const freqs = {};
      for (const aid of ACTIONS) freqs[aid] = 0;

      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        const base = s * A;

        /* Determine if any Q value is non-zero in this state. */
        let allZero = true;
        let m = -Infinity, k = 0, lo = Infinity;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > m) { m = v; k = a; }
          if (v < lo) lo = v;
        }
        const span = Math.max(1e-6, m - lo);

        if (allZero) {
          /* Unvisited / no-update state. Show em-dashes and no argmax. */
          node.cell.classList.add('unvisited');
          for (let a = 0; a < A; a++) {
            const bar = node.bars[a];
            bar.val.textContent = '—';
            bar.fill.style.width = '0%';
            bar.row.classList.remove('argmax');
            bar.mark.textContent = '';
          }
        } else {
          node.cell.classList.remove('unvisited');
          for (let a = 0; a < A; a++) {
            const bar = node.bars[a];
            const v = Q[base + a];
            bar.val.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
            /* Width: relative within this cell. Argmax = full width, worst ≈ 0. */
            const w = ((v - lo) / span) * 100;
            bar.fill.style.width = w.toFixed(1) + '%';
            const isArgmax = a === k;
            bar.row.classList.toggle('argmax', isArgmax);
            bar.mark.textContent = isArgmax ? '▶' : '';
          }
          freqs[ACTIONS[k]]++;
        }

        /* Change indicators — only fire on real transitions, not on the
           initial render. */
        if (prevQ && !o.suppressFlash) {
          /* Compute previous argmax for the cell. */
          let pm = -Infinity, pk = -1;
          let prevAllZero = true;
          for (let a = 0; a < A; a++) {
            if (Math.abs(prevQ[base + a]) > 1e-9) prevAllZero = false;
            if (prevQ[base + a] > pm) { pm = prevQ[base + a]; pk = a; }
          }
          if (!prevAllZero && !allZero) {
            /* Delta on the *current* argmax compared to its old value. */
            const delta = Q[base + k] - prevQ[base + k];
            if (Math.abs(delta) > 0.05) {
              spawnDelta(node.cell, delta);
            }
            /* Argmax flip — flash the cell border. */
            if (pk !== k) {
              node.cell.classList.remove('argmax-flip');
              void node.cell.offsetWidth;
              node.cell.classList.add('argmax-flip');
              setTimeout(() => node.cell.classList.remove('argmax-flip'), 1200);
            }
          } else if (prevAllZero && !allZero) {
            /* First visit — spawn an "AWAKE!" indicator. */
            spawnAwake(node.cell);
          }
        }
      }

      /* Frequency strip. */
      for (const aid of ACTIONS) {
        const r = freqRows[aid];
        const count = freqs[aid];
        r.val.textContent = String(count);
        r.fill.style.width = (count / 9 * 100) + '%';
      }

      /* Take a copy for next diff. */
      prevQ = new Float32Array(Q);
    }

    function spawnDelta(cell, delta) {
      const el = document.createElement('div');
      el.className = 'q-delta ' + (delta >= 0 ? 'pos' : 'neg');
      el.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(2);
      cell.appendChild(el);
      setTimeout(() => { try { cell.removeChild(el); } catch (e) {} }, 1300);
    }

    function spawnAwake(cell) {
      const el = document.createElement('div');
      el.className = 'q-delta pos awake';
      el.textContent = 'NEW!';
      cell.appendChild(el);
      setTimeout(() => { try { cell.removeChild(el); } catch (e) {} }, 1500);
    }

    function reset() {
      prevQ = null;
      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        node.cell.classList.add('unvisited');
        node.cell.classList.remove('argmax-flip');
        for (let a = 0; a < A; a++) {
          node.bars[a].val.textContent = '—';
          node.bars[a].fill.style.width = '0%';
          node.bars[a].row.classList.remove('argmax');
          node.bars[a].mark.textContent = '';
        }
      }
      for (const aid of ACTIONS) {
        freqRows[aid].val.textContent = '0';
        freqRows[aid].fill.style.width = '0%';
      }
    }

    /* Initialise to "unvisited" look. */
    reset();

    return { update, reset, host };
  }

  /* Backward-compat helper — kept exported for scenes 2 & 3 which call it. */
  function moveFrequencies(Q) {
    const c = {};
    for (const aid of ACTIONS) c[aid] = 0;
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let m = -Infinity, k = 0;
      let allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(Q[base + a]) > 1e-9) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      }
      if (!allZero) c[ACTIONS[k]]++;
    }
    return c;
  }

  window.QTable = { mount, moveFrequencies, shortMoveLabel, stateLabel };
})();

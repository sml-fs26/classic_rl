/* Scene-4 Q-table render — 5×5 state grid + per-cell battle thumbnail +
 * per-move Q-bars + change-deltas + move-frequency strip.
 *
 * The bucket count is read from Battle.NUM_BUCKETS, so this code is the
 * same regardless of whether the MDP uses 3, 5, or N buckets. Cells are
 * laid out at row = your bucket, column = opp bucket. */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;
  const STATES = window.Bellman.STATES;     // 25 non-terminal states (5 × 5)
  const A = ACTIONS.length;
  const N = STATES.length;
  const NB = window.Battle.NUM_BUCKETS;     // 5
  const BUCKETS = window.Battle.BUCKETS;    // ['full','high','mid','low','critical']

  /* HP percentages for the mini-thumbnail bars. Equal spacing across the
     5 levels: bucket 0 = 100%, 1 = 80%, 2 = 60%, 3 = 40%, 4 = 20%. */
  function bucketToPct(idx) { return Math.max(0, (NB - idx) * 100 / NB); }
  /* Color class for the HP-bar segment based on bucket index. */
  function bucketClass(idx) {
    if (idx === 0) return '';            // bucket 0 (full) — default green
    if (idx === 1) return 'b1';          // high — light green
    if (idx === 2) return 'b2';          // mid — yellow
    if (idx === 3) return 'b3';          // low — orange
    return 'b4';                          // critical — red
  }

  function shortMoveLabel(id) {
    switch (id) {
      case 'quick_attack': return 'QUICK';
      case 'thunderbolt':  return 'BOLT';
      case 'thunder':      return 'THUN';
    }
    return id;
  }

  function stateLabel(s) {
    return BUCKETS[s.your].toUpperCase() + ' / ' + BUCKETS[s.opp].toUpperCase();
  }

  function mount(host) {
    host.classList.add('qtable-host');
    host.innerHTML = '';

    /* Column header row: corner + 5 opp-bucket names. */
    const headerRow = document.createElement('div');
    headerRow.className = 'q-col-heads';
    headerRow.style.setProperty('--nb', String(NB));
    headerRow.innerHTML =
      '<div class="q-corner-head">YOUR HP \\ OPP HP</div>' +
      BUCKETS.map(b => '<div class="q-col-head">OPP ' + b.toUpperCase() + '</div>').join('');
    host.appendChild(headerRow);

    /* NB × NB grid (plus a row-label column on the left). */
    const grid = document.createElement('div');
    grid.className = 'q-grid';
    grid.style.setProperty('--nb', String(NB));
    host.appendChild(grid);

    for (let r = 0; r < NB; r++) {
      const lab = document.createElement('div');
      lab.className = 'q-row-head';
      lab.textContent = 'YOUR ' + BUCKETS[r].toUpperCase();
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(r + 1);
      grid.appendChild(lab);
    }

    const cellNodes = [];   /* per state index s: { cell, bars: [a -> {row, fill, mark, val}] } */
    for (let s = 0; s < N; s++) {
      const st = STATES[s];
      const cell = document.createElement('div');
      cell.className = 'q-cell';
      cell.style.gridColumn = String(st.opp + 2);     // +2 because col 1 is the row-label
      cell.style.gridRow = String(st.your + 1);
      cell.dataset.state = stateLabel(st);

      /* Battle thumbnail at the top. */
      const thumb = document.createElement('div');
      thumb.className = 'q-thumb';
      thumb.innerHTML =
        '<div class="q-thumb-side player">' +
          '<img src="assets/pikachu-back.png" class="q-thumb-sprite" alt="Pikachu">' +
          '<div class="q-thumb-hp-bg">' +
            '<div class="q-thumb-hp-fill ' + bucketClass(st.your) + '" style="width:' + bucketToPct(st.your) + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="q-thumb-side opponent">' +
          '<img src="assets/charmander-front.png" class="q-thumb-sprite" alt="Charmander">' +
          '<div class="q-thumb-hp-bg">' +
            '<div class="q-thumb-hp-fill ' + bucketClass(st.opp) + '" style="width:' + bucketToPct(st.opp) + '%"></div>' +
          '</div>' +
        '</div>';
      cell.appendChild(thumb);

      /* Per-move Q-bars. */
      const bars = document.createElement('div');
      bars.className = 'q-bars';
      const barNodes = [];
      for (let a = 0; a < A; a++) {
        const aid = ACTIONS[a];
        const r = document.createElement('div');
        r.className = 'q-bar-row';
        r.dataset.move = aid;
        r.innerHTML =
          '<span class="q-mark"></span>' +
          '<span class="q-label">' + shortMoveLabel(aid) + '</span>' +
          '<span class="q-val">—</span>';
        bars.appendChild(r);
        barNodes[a] = {
          row: r,
          mark: r.querySelector('.q-mark'),
          val: r.querySelector('.q-val'),
        };
      }
      cell.appendChild(bars);

      grid.appendChild(cell);
      cellNodes[s] = { cell, bars: barNodes, state: st };
    }

    /* Move-frequency strip below the grid. */
    const freqStrip = document.createElement('div');
    freqStrip.className = 'q-freq-strip';
    const freqTitle = document.createElement('div');
    freqTitle.className = 'q-freq-title';
    freqTitle.textContent = 'ARGMAX DISTRIBUTION ACROSS THE ' + N + ' STATES';
    freqStrip.appendChild(freqTitle);
    const freqRows = {};
    for (const aid of ACTIONS) {
      const r = document.createElement('div');
      r.className = 'q-freq-row';
      r.dataset.move = aid;
      r.innerHTML =
        '<span class="q-freq-label">' + shortMoveLabel(aid) + '</span>' +
        '<span class="q-freq-track"><span class="q-freq-fill"></span></span>' +
        '<span class="q-freq-val">0</span>';
      freqStrip.appendChild(r);
      freqRows[aid] = {
        fill: r.querySelector('.q-freq-fill'),
        val: r.querySelector('.q-freq-val'),
      };
    }
    host.appendChild(freqStrip);

    /* Legend. */
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

        let allZero = true;
        let m = -Infinity, k = 0;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > m) { m = v; k = a; }
        }

        if (allZero) {
          node.cell.classList.add('unvisited');
          for (let a = 0; a < A; a++) {
            const bar = node.bars[a];
            bar.val.textContent = '—';
            bar.row.classList.remove('argmax');
            bar.mark.textContent = '';
          }
        } else {
          node.cell.classList.remove('unvisited');
          for (let a = 0; a < A; a++) {
            const bar = node.bars[a];
            const v = Q[base + a];
            bar.val.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
            const isArgmax = a === k;
            bar.row.classList.toggle('argmax', isArgmax);
            bar.mark.textContent = isArgmax ? '▶' : '';
          }
          freqs[ACTIONS[k]]++;
        }

        if (prevQ && !o.suppressFlash) {
          let pm = -Infinity, pk = -1;
          let prevAllZero = true;
          for (let a = 0; a < A; a++) {
            if (Math.abs(prevQ[base + a]) > 1e-9) prevAllZero = false;
            if (prevQ[base + a] > pm) { pm = prevQ[base + a]; pk = a; }
          }
          if (!prevAllZero && !allZero) {
            const delta = Q[base + k] - prevQ[base + k];
            if (Math.abs(delta) > 0.05) spawnDelta(node.cell, delta);
            if (pk !== k) {
              node.cell.classList.remove('argmax-flip');
              void node.cell.offsetWidth;
              node.cell.classList.add('argmax-flip');
              setTimeout(() => node.cell.classList.remove('argmax-flip'), 1200);
            }
          } else if (prevAllZero && !allZero) {
            spawnAwake(node.cell);
          }
        }
      }

      for (const aid of ACTIONS) {
        const r = freqRows[aid];
        const count = freqs[aid];
        r.val.textContent = String(count);
        r.fill.style.width = (count / N * 100) + '%';
      }

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
          node.bars[a].row.classList.remove('argmax');
          node.bars[a].mark.textContent = '';
        }
      }
      for (const aid of ACTIONS) {
        freqRows[aid].val.textContent = '0';
        freqRows[aid].fill.style.width = '0%';
      }
    }

    /* Heatmap colour: max-Q over the four moves → one of six classes that
       paint the cell background (see .q-cell.heat-* in style.css). Called
       from update() per cell. */
    function heatClassFor(maxQ, allZero) {
      if (allZero) return 'heat-zero';
      if (maxQ >= 5)   return 'heat-pos-strong';
      if (maxQ >= 1.5) return 'heat-pos-mid';
      if (maxQ <= -5)  return 'heat-neg-strong';
      if (maxQ <= -1.5) return 'heat-neg-mid';
      return 'heat-neutral';
    }
    const ALL_HEAT_CLASSES = ['heat-zero', 'heat-pos-strong', 'heat-pos-mid', 'heat-neutral', 'heat-neg-mid', 'heat-neg-strong'];

    /* Wire click handlers on every cell — a single registered callback
       receives the state index when clicked, plus the cell DOM node. The
       'clickable' affordance is only painted once a caller actually
       registers a handler, so cells don't lie when no one is listening. */
    let cellClickCb = null;
    for (let s = 0; s < N; s++) {
      const node = cellNodes[s];
      node.cell.dataset.state = String(s);
      node.cell.addEventListener('click', () => {
        if (cellClickCb) cellClickCb(s, node.cell);
      });
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      if (cb) {
        for (let s = 0; s < N; s++) cellNodes[s].cell.classList.add('clickable');
      } else {
        for (let s = 0; s < N; s++) cellNodes[s].cell.classList.remove('clickable');
      }
    }
    function getCellNode(s) { return cellNodes[s] ? cellNodes[s].cell : null; }

    /* Wrap the original `update` so each call also applies the heatmap. */
    const baseUpdate = update;
    function updateWithHeat(Q, opts) {
      baseUpdate(Q, opts);
      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        const base = s * A;
        let m = -Infinity;
        let allZero = true;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > m) m = v;
        }
        const cls = heatClassFor(m, allZero);
        for (const c of ALL_HEAT_CLASSES) node.cell.classList.remove(c);
        node.cell.classList.add(cls);
      }
    }

    reset();
    return { update: updateWithHeat, reset, host, setOnCellClick, getCellNode };
  }

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

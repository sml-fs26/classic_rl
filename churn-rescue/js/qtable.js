/* The RETENTION MAP: the 5x5 Q-grid for Churn Rescue.
 *
 *   25 non-terminal states laid out as a board:
 *     rows    = engagement tier, THRIVING at the top .. CLIFF at the bottom
 *     columns = months-left, m=1 on the LEFT (renewal imminent) .. m=5 on
 *               the RIGHT (long runway)
 *   Each cell holds a mini ACCOUNT CARD plus the three lever values
 *   (DO NOTHING / CHECK-IN / BIG OFFER). The argmax lever is starred and
 *   the cell is TINTED by the winning lever colour (grey / blue / gold), so
 *   the optimal policy reads at a glance as a map of coloured regions:
 *     - a grey THRIVING corner across the top,
 *     - a blue middle band (healthy + lukewarm),
 *     - a gold CLIFF wedge across the bottom,
 *     - and the small BLUE NOTCH biting into the gold at at-risk x long
 *       runway (m4 to m5), where the cheap touch beats the discount.
 *
 *   Indexing: Q is a flat array indexed [stateIndex*A + leverIdx], with
 *   stateIndex = tier*NUM_MONTHS + (m-1) and A = 3 (nothing, checkin,
 *   offer), exactly as window.Churn.stateIndex / window.Moves.MOVE_IDS
 *   define. window.DATA.Qstar is in this layout.
 *
 *   API:
 *     QTable.mount(host) -> {
 *       update(Q, opts)   repaint every cell from Q. opts:
 *                           suppressFlash : skip the per-step delta + flip
 *                                           flashes (use for the first paint)
 *       reset()           blank every cell (back to 'unvisited')
 *       cells             per-state-index array of cell DOM nodes
 *       setOnCellClick(cb)  cb(stateIndex, cellNode) on click; paints a
 *                           'clickable' affordance only while a cb is set
 *       getCellNode(s)    cell node for state index s
 *       host              the host element
 *     }
 */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;            // ['nothing','checkin','offer']
  const STATES = window.Bellman.STATES;             // 25 non-terminal {tier,m}
  const A = ACTIONS.length;                          // 3
  const N = STATES.length;                           // 25
  const NUM_TIERS = window.Churn.NUM_TIERS;          // 5
  const NUM_MONTHS = window.Churn.NUM_MONTHS;        // 5
  const TIER_IDS = window.Churn.TIERS;               // ['cliff'..'thriving']

  function T(key, vars) { return window.I18N ? window.I18N.t(key, vars) : key; }

  /* Per-lever short label + colour token class (single source of truth in
     levers.js; fall back to the i18n short keys). */
  function leverShort(id) { return T('lever.short.' + id); }
  function leverTokenClass(id) {
    return window.Levers && window.Levers.tokenClass
      ? window.Levers.tokenClass(id)
      : ('lever-' + id);
  }
  function tierLabel(tier) { return T('tier.short.' + (TIER_IDS[tier] || 'cliff')); }
  function monthHead(m) { return T('months.short', { n: m }); }

  function stateIndex(s) { return s.tier * NUM_MONTHS + (s.m - 1); }
  /* Board placement: thriving (tier NUM_TIERS-1) sits in grid row 1 at the
     top; cliff (tier 0) at the bottom. Column 1 is the row-label, so m=1
     lands in grid column 2. */
  function gridRowFor(tier) { return NUM_TIERS - tier; }
  function gridColFor(m) { return m + 1; }

  function stateLabel(s) {
    return tierLabel(s.tier) + ' / ' + monthHead(s.m);
  }

  function mount(host) {
    host.classList.add('qtable-host', 'retention-map');
    host.innerHTML = '';

    /* Column header row: corner + 5 month columns (m=1 .. m=5). */
    const headerRow = document.createElement('div');
    headerRow.className = 'rm-col-heads';
    headerRow.style.setProperty('--nm', String(NUM_MONTHS));
    let heads = '<div class="rm-corner-head">' + T('retmap.corner') + '</div>';
    for (let m = 1; m <= NUM_MONTHS; m++) {
      const imminent = m === 1 ? ' rm-col-imminent' : '';
      const runway = m === NUM_MONTHS ? ' rm-col-runway' : '';
      heads += '<div class="rm-col-head' + imminent + runway + '">' + monthHead(m) + '</div>';
    }
    headerRow.innerHTML = heads;
    host.appendChild(headerRow);

    /* The grid: 1 row-label column + NUM_MONTHS state columns; NUM_TIERS
       rows. CSS Grid positions every cell explicitly by (tier, m). */
    const grid = document.createElement('div');
    grid.className = 'rm-grid';
    grid.style.setProperty('--nm', String(NUM_MONTHS));
    grid.style.setProperty('--nt', String(NUM_TIERS));
    host.appendChild(grid);

    /* Row labels (tier names), thriving at the top. */
    for (let tier = NUM_TIERS - 1; tier >= 0; tier--) {
      const lab = document.createElement('div');
      lab.className = 'rm-row-head tier' + tier;
      lab.textContent = tierLabel(tier);
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(gridRowFor(tier));
      grid.appendChild(lab);
    }

    /* One cell per non-terminal state. */
    const cellNodes = [];   /* index by stateIndex -> { cell, card, bars[], state } */
    for (let i = 0; i < N; i++) {
      const st = STATES[i];
      const s = stateIndex(st);
      const cell = document.createElement('div');
      cell.className = 'rm-cell';
      cell.style.gridColumn = String(gridColFor(st.m));
      cell.style.gridRow = String(gridRowFor(st.tier));
      cell.dataset.state = String(s);
      cell.dataset.label = stateLabel(st);

      /* Mini account card (the recurring state-icon) at the top. */
      const cardHost = document.createElement('div');
      cardHost.className = 'rm-card';
      cell.appendChild(cardHost);
      const card = window.AccountCard.mount(cardHost, { tier: st.tier, m: st.m, size: 'mini' });

      /* Three lever-value rows. */
      const bars = document.createElement('div');
      bars.className = 'rm-bars';
      const barNodes = [];
      for (let a = 0; a < A; a++) {
        const aid = ACTIONS[a];
        const r = document.createElement('div');
        r.className = 'rm-bar-row ' + leverTokenClass(aid);
        r.dataset.lever = aid;
        r.innerHTML =
          '<span class="rm-mark"></span>' +
          '<span class="rm-swatch ' + leverTokenClass(aid) + '"></span>' +
          '<span class="rm-label">' + leverShort(aid) + '</span>' +
          '<span class="rm-val">' + T('retmap.empty') + '</span>';
        bars.appendChild(r);
        barNodes[a] = { row: r, mark: r.querySelector('.rm-mark'), val: r.querySelector('.rm-val') };
      }
      cell.appendChild(bars);

      grid.appendChild(cell);
      cellNodes[s] = { cell, card, bars: barNodes, state: st };
    }

    /* Lever-frequency strip below the grid (how many of the 25 states pick
       each lever as argmax), the policy-region census. */
    const freqStrip = document.createElement('div');
    freqStrip.className = 'rm-freq-strip';
    const freqTitle = document.createElement('div');
    freqTitle.className = 'rm-freq-title';
    freqTitle.textContent = T('retmap.freqTitle', { n: N });
    freqStrip.appendChild(freqTitle);
    const freqRows = {};
    for (const aid of ACTIONS) {
      const r = document.createElement('div');
      r.className = 'rm-freq-row ' + leverTokenClass(aid);
      r.dataset.lever = aid;
      r.innerHTML =
        '<span class="rm-freq-swatch ' + leverTokenClass(aid) + '"></span>' +
        '<span class="rm-freq-label">' + leverShort(aid) + '</span>' +
        '<span class="rm-freq-track"><span class="rm-freq-fill ' + leverTokenClass(aid) + '"></span></span>' +
        '<span class="rm-freq-val">0</span>';
      freqStrip.appendChild(r);
      freqRows[aid] = { fill: r.querySelector('.rm-freq-fill'), val: r.querySelector('.rm-freq-val') };
    }
    host.appendChild(freqStrip);

    /* Legend: the three lever-region colours + the unvisited dash. */
    const legend = document.createElement('div');
    legend.className = 'rm-legend';
    legend.innerHTML =
      ACTIONS.map(aid =>
        '<span class="rm-legend-item"><span class="rm-legend-swatch ' + leverTokenClass(aid) + '"></span>' +
        leverShort(aid) + '</span>').join('') +
      '<span class="rm-legend-item">' + T('retmap.legendStar') + '</span>' +
      '<span class="rm-legend-item">' + T('retmap.legendEmpty') + '</span>';
    host.appendChild(legend);

    const ALL_REGION = ACTIONS.map(a => 'region-' + a);
    let prevQ = null;

    /* Argmax-flip ding debounce: one cursor blip per ~220ms cluster so a
       RUN-ALL sweep does not unleash a cascade of pips. */
    let dingTimer = null;
    function scheduleDing() {
      if (dingTimer) return;
      dingTimer = setTimeout(() => { dingTimer = null; if (window.SFX) window.SFX.play('cursor'); }, 220);
    }

    function spawnDelta(cell, delta) {
      const el = document.createElement('div');
      el.className = 'rm-delta ' + (delta >= 0 ? 'pos' : 'neg');
      el.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(2);
      cell.appendChild(el);
      setTimeout(() => { try { cell.removeChild(el); } catch (e) {} }, 1300);
    }
    function spawnAwake(cell) {
      const el = document.createElement('div');
      el.className = 'rm-delta pos awake';
      el.textContent = T('retmap.registered');
      cell.appendChild(el);
      setTimeout(() => { try { cell.removeChild(el); } catch (e) {} }, 1500);
      cell.classList.remove('rm-just-registered');
      void cell.offsetWidth;
      cell.classList.add('rm-just-registered');
      setTimeout(() => cell.classList.remove('rm-just-registered'), 1100);
    }

    function update(Q, opts) {
      const o = opts || {};
      const freqs = {};
      for (const aid of ACTIONS) freqs[aid] = 0;

      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        if (!node) continue;
        const base = s * A;

        let allZero = true;
        let best = -Infinity, k = 0;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > best) { best = v; k = a; }
        }

        /* Region tint: paint the cell by the winning lever colour, or clear
           to 'unvisited' when no lever has a value yet. */
        for (const c of ALL_REGION) node.cell.classList.remove(c);
        if (allZero) {
          node.cell.classList.add('unvisited');
          for (let a = 0; a < A; a++) {
            node.bars[a].val.textContent = T('retmap.empty');
            node.bars[a].row.classList.remove('argmax');
            node.bars[a].mark.textContent = '';
          }
        } else {
          node.cell.classList.remove('unvisited');
          node.cell.classList.add('region-' + ACTIONS[k]);
          for (let a = 0; a < A; a++) {
            const v = Q[base + a];
            node.bars[a].val.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
            const isArg = a === k;
            node.bars[a].row.classList.toggle('argmax', isArg);
            node.bars[a].mark.textContent = isArg ? '★' : '';
          }
          freqs[ACTIONS[k]]++;
        }

        if (prevQ && !o.suppressFlash) {
          let pk = -1, pm = -Infinity, prevAllZero = true;
          for (let a = 0; a < A; a++) {
            if (Math.abs(prevQ[base + a]) > 1e-9) prevAllZero = false;
            if (prevQ[base + a] > pm) { pm = prevQ[base + a]; pk = a; }
          }
          if (!prevAllZero && !allZero) {
            const delta = Q[base + k] - prevQ[base + k];
            if (Math.abs(delta) > 0.05) spawnDelta(node.cell, delta);
            if (pk !== k) {
              node.cell.classList.remove('rm-argmax-flip');
              void node.cell.offsetWidth;
              node.cell.classList.add('rm-argmax-flip');
              setTimeout(() => node.cell.classList.remove('rm-argmax-flip'), 1100);
              scheduleDing();
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

      prevQ = new Float64Array(Q);
    }

    function reset() {
      prevQ = null;
      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        if (!node) continue;
        node.cell.classList.add('unvisited');
        node.cell.classList.remove('rm-argmax-flip', ...ALL_REGION);
        for (let a = 0; a < A; a++) {
          node.bars[a].val.textContent = T('retmap.empty');
          node.bars[a].row.classList.remove('argmax');
          node.bars[a].mark.textContent = '';
        }
      }
      for (const aid of ACTIONS) {
        freqRows[aid].val.textContent = '0';
        freqRows[aid].fill.style.width = '0%';
      }
    }

    /* Click wiring, a single registered callback gets the state index +
       cell node; the 'clickable' affordance is painted only while set. */
    let cellClickCb = null;
    for (let s = 0; s < N; s++) {
      const node = cellNodes[s];
      if (!node) continue;
      node.cell.addEventListener('click', () => { if (cellClickCb) cellClickCb(s, node.cell); });
    }
    function setOnCellClick(cb) {
      cellClickCb = cb;
      for (let s = 0; s < N; s++) {
        if (!cellNodes[s]) continue;
        cellNodes[s].cell.classList.toggle('clickable', !!cb);
      }
    }
    function getCellNode(s) { return cellNodes[s] ? cellNodes[s].cell : null; }

    reset();

    /* `cells` is the per-state-index array of cell nodes (the contract
       names it on the returned object). */
    const cells = cellNodes.map(n => (n ? n.cell : null));
    return { update, reset, cells, host, setOnCellClick, getCellNode };
  }

  /* argmax-lever census over a Q array (used by scenes for a quick count). */
  function leverFrequencies(Q) {
    const c = {};
    for (const aid of ACTIONS) c[aid] = 0;
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let best = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(Q[base + a]) > 1e-9) allZero = false;
        if (Q[base + a] > best) { best = Q[base + a]; k = a; }
      }
      if (!allZero) c[ACTIONS[k]]++;
    }
    return c;
  }

  window.QTable = { mount, leverFrequencies, leverShort, stateLabel };
})();

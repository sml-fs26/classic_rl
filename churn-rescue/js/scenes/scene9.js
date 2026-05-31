/* Scene 9: dynamic programming, fill Q*.
 *
 *   IF we know the coin and die weights P (and here we wrote them down
 *   ourselves), we can COMPUTE the whole playbook with Bellman backups.
 *   This MDP is finite-horizon and acyclic in the month counter m, so the
 *   exact "value flows inward from the terminals" is a backward pass by
 *   MONTH LAYER:
 *
 *     sweep 1 fills m=1   (the renewal-imminent column): every STAY lands
 *             straight on a terminal, so these values are exact at once.
 *     sweep 2 fills m=2   using the now-exact m=1 column,
 *     ...                 each column needs only the column to its left,
 *     sweep 5 fills m=5   (the long-runway column).
 *
 *   The colours stop changing after the 5th sweep: a sixth "converged"
 *   beat just confirms the fixed point.  The final coloured map IS the
 *   optimal policy: grey THRIVING corner, blue middle band, gold CLIFF
 *   wedge, and the small BLUE NOTCH at AT-RISK x long-runway where the
 *   offer stops being worth it.
 *
 *   Every cell value is computed live from window.Churn.successors over the
 *   already-filled columns; the final filled Q is asserted against
 *   window.DATA.Qstar at mount.  Nothing is hand-typed.
 *
 *   STEP / RUN ALL / RESET drive the sweeps; both STEP and RUN ALL are
 *   gated behind &run for headless capture (RUN ALL auto-fires under &run).
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const C        = window.Churn;
  const DATA     = window.DATA;
  const ACTIONS  = window.Moves.MOVE_IDS;            // nothing, checkin, offer
  const A        = ACTIONS.length;                    // 3
  const NT       = C.NUM_TIERS;                        // 5
  const NM       = C.NUM_MONTHS;                       // 5
  const N        = NT * NM;                            // 25
  const GAMMA    = (DATA.params && DATA.params.gamma != null) ? DATA.params.gamma : 1;

  function si(tier, m) { return tier * NM + (m - 1); }
  function leverShort(id) { return T('lever.short.' + id); }

  /* Backward DP by month layer. Returns:
       Qcol[m]  : the full N*A Q array AFTER filling columns 1..m,
       converged: whether sweep m left the policy unchanged from sweep m-1.
     Each Q for a cell is Σ p·(reward + γ·V[next]) over successors, with V
     built from the columns filled so far (terminals contribute 0). */
  function backwardDP() {
    const V = new Float64Array(N);                    // V*(s); 0 until filled
    const filled = new Array(N).fill(false);
    const layers = [];                                 // layers[m-1] = snapshot after column m

    function qOf(tier, m) {
      const out = new Float64Array(A);
      const state = { tier, m, terminal: false };
      for (let a = 0; a < A; a++) {
        const succ = C.successors(state, ACTIONS[a]);
        let q = 0;
        for (const x of succ) {
          const vN = x.sNext.terminal ? 0 : V[si(x.sNext.tier, x.sNext.m)];
          q += x.p * (x.reward + GAMMA * vN);
        }
        out[a] = q;
      }
      return out;
    }

    for (let m = 1; m <= NM; m++) {
      /* Fill every tier of column m using the columns already in V. */
      for (let tier = 0; tier < NT; tier++) {
        const qs = qOf(tier, m);
        let best = -Infinity;
        for (let a = 0; a < A; a++) if (qs[a] > best) best = qs[a];
        V[si(tier, m)] = best;
        filled[si(tier, m)] = true;
      }
      /* Snapshot the full Q over all filled cells. */
      const Qview = new Float64Array(N * A);
      for (let tier = 0; tier < NT; tier++) {
        for (let mm = 1; mm <= NM; mm++) {
          if (!filled[si(tier, mm)]) continue;
          const qs = qOf(tier, mm);
          for (let a = 0; a < A; a++) Qview[si(tier, mm) * A + a] = qs[a];
        }
      }
      layers.push(Qview);
    }
    return layers;
  }

  /* argmax census over a Q view (only filled cells count). */
  function censusOf(Q) {
    const c = { nothing: 0, checkin: 0, offer: 0 };
    for (let s = 0; s < N; s++) {
      let best = -Infinity, k = -1, anyNonZero = false;
      for (let a = 0; a < A; a++) {
        const v = Q[s * A + a];
        if (Math.abs(v) > 1e-9) anyNonZero = true;
        if (v > best) { best = v; k = a; }
      }
      if (anyNonZero && k >= 0) c[ACTIONS[k]]++;
    }
    return c;
  }

  window.scenes.scene9 = function (root) {
    root.classList.add('scene-pad', 's9-scene');
    root.innerHTML = '';

    const layers = backwardDP();                       // layers[0..4]
    const finalQ = layers[layers.length - 1];

    /* Assert the final fill equals the precomputed oracle. */
    let maxDiff = 0;
    for (let i = 0; i < N * A; i++) maxDiff = Math.max(maxDiff, Math.abs(finalQ[i] - DATA.Qstar[i]));
    if (maxDiff > 1e-2) console.warn('[scene9] DP fill != DATA.Qstar, maxDiff', maxDiff);

    /* ---- Heading + hook + premise ---- */
    const h = document.createElement('h2');
    h.className = 's9-heading';
    h.textContent = T('s9.heading');
    root.appendChild(h);

    const hook = document.createElement('div');
    hook.className = 's9-hook';
    hook.textContent = T('s9.hook');
    root.appendChild(hook);

    const premise = document.createElement('div');
    premise.className = 's9-premise';
    premise.innerHTML = T('s9.premise');
    root.appendChild(premise);

    /* ---- Controls + status ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's9-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s9-step">' + T('s9.btn.step') + '</button>' +
      '<button class="poke-btn" id="s9-run">'  + T('s9.btn.run')  + '</button>' +
      '<button class="poke-btn" id="s9-reset">' + T('s9.btn.reset') + '</button>' +
      '<div class="s9-status">' +
        T('s9.status.sweep') + ' <b id="s9-sweep">0 / 5</b> &middot; ' +
        T('s9.status.delta') + ' <b id="s9-delta">' + T('s9.status.huge') + '</b>' +
      '</div>';
    root.appendChild(ctrls);

    /* ---- Row: retention map + side panel ---- */
    const row = document.createElement('div');
    row.className = 's9-row';
    root.appendChild(row);

    const mapHost = document.createElement('div');
    mapHost.className = 's9-map';
    row.appendChild(mapHost);
    const qtbl = window.QTable.mount(mapHost);

    const panel = document.createElement('div');
    panel.className = 's9-panel poke-box tight';
    row.appendChild(panel);

    /* Per-sweep max-delta vs the previous column's overlap (purely for the
       on-screen "values still moving" read; the layers are exact). */
    const sweepDelta = [];
    for (let k = 0; k < layers.length; k++) {
      let d = 0;
      const prev = k === 0 ? new Float64Array(N * A) : layers[k - 1];
      for (let i = 0; i < N * A; i++) d = Math.max(d, Math.abs(layers[k][i] - prev[i]));
      sweepDelta.push(d);
    }

    /* ---- Sweep machine. sweep in -1..5. -1 = blank, 5 = converged recap. ---- */
    const TOTAL_SWEEPS = NM;                            // 5 column sweeps
    let sweep = -1;

    const sweepEl  = ctrls.querySelector('#s9-sweep');
    const deltaEl  = ctrls.querySelector('#s9-delta');

    function colCellsFilledThrough(m) {
      /* state indices in columns 1..m */
      const idxs = [];
      for (let tier = 0; tier < NT; tier++)
        for (let mm = 1; mm <= m; mm++) idxs.push(si(tier, mm));
      return idxs;
    }

    function renderPanel(titleKey, bodyKeys, census) {
      let html = '<div class="s9-panel-title">' + T(titleKey) + '</div>';
      for (const k of bodyKeys) html += '<div class="s9-panel-line">' + T(k) + '</div>';
      if (census) {
        html += '<div class="s9-census">';
        for (const aid of ACTIONS) {
          html += '<div class="s9-census-row ' + (window.Levers ? window.Levers.tokenClass(aid) : ('lever-' + aid)) + '">' +
            '<span class="s9-census-sw ' + (window.Levers ? window.Levers.tokenClass(aid) : ('lever-' + aid)) + '"></span>' +
            '<span class="s9-census-lab">' + leverShort(aid) + '</span>' +
            '<span class="s9-census-val">' + census[aid] + '</span>' +
          '</div>';
        }
        html += '</div>';
      }
      panel.innerHTML = html;
    }

    /* Apply the state for `sweep`. */
    function apply(suppressFlash) {
      if (sweep < 0) {
        qtbl.reset();
        qtbl.update(new Float64Array(N * A), { suppressFlash: true });
        for (let s = 0; s < N; s++) {
          const cell = qtbl.getCellNode(s);
          if (cell) cell.classList.remove('s9-col-active', 's9-locked');
        }
        sweepEl.textContent = '0 / ' + TOTAL_SWEEPS;
        deltaEl.textContent = T('s9.status.huge');
        renderPanel('s9.ready.title', ['s9.ready.body'], null);
        return;
      }

      const m = Math.min(sweep + 1, NM);                // sweep 0 -> column m=1
      const layerIdx = Math.min(sweep, layers.length - 1);
      const Q = layers[layerIdx];
      qtbl.update(Q, { suppressFlash: !!suppressFlash });

      /* Column highlight: mark this sweep's just-filled column active, and
         everything to its left as locked. */
      const activeCol = sweep < NM ? m : NM;
      for (let s = 0; s < N; s++) {
        const cell = qtbl.getCellNode(s);
        if (!cell) continue;
        const st = C.stateFromIndex(s);
        cell.classList.toggle('s9-col-active', sweep < NM && st.m === activeCol);
        cell.classList.toggle('s9-locked', st.m < activeCol);
      }

      const census = censusOf(Q);

      if (sweep < NM) {
        sweepEl.textContent = (sweep + 1) + ' / ' + TOTAL_SWEEPS;
        deltaEl.textContent = sweepDelta[layerIdx] >= 1e9 ? T('s9.status.huge') : sweepDelta[layerIdx].toFixed(2);
        renderPanel(
          's9.sweep' + m + '.title',
          ['s9.sweep' + m + '.n1', 's9.sweep' + m + '.n2'],
          census
        );
      } else {
        /* Converged recap. */
        sweepEl.textContent = TOTAL_SWEEPS + ' / ' + TOTAL_SWEEPS;
        deltaEl.textContent = '0.00';
        renderPanel('s9.done.title', ['s9.done.n1', 's9.done.n2', 's9.done.n3'], census);
      }
    }

    function step() {
      if (sweep >= NM) return;
      sweep++;
      apply(false);
    }
    function runAll() {
      while (sweep < NM) { sweep++; apply(true); }
    }
    function reset() { sweep = -1; apply(true); }

    ctrls.querySelector('#s9-step').addEventListener('click', step);
    ctrls.querySelector('#s9-run').addEventListener('click', runAll);
    ctrls.querySelector('#s9-reset').addEventListener('click', reset);

    reset();

    /* &run: auto-fill for headless capture (RUN ALL). */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(runAll, 180);

    /* &dp=N flag: jump to sweep N for headless capture of a mid-fill frame. */
    const dpMatch = (window.location.hash || '').match(/[#&?]dp=(\d+)/);
    if (dpMatch && !autoRun) {
      const target = Math.min(NM, Math.max(0, parseInt(dpMatch[1], 10)));
      setTimeout(() => { while (sweep < target - 1) { sweep++; apply(true); } }, 180);
    }

    return {
      onEnter() { apply(true); },
      onNextKey() { if (sweep < NM) { step(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

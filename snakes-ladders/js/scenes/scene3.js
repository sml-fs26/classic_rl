/* Scene 3, γ as risk preference.
 *
 *   Same board, V-table visible. γ slider 0.70 → 0.99 snapping to 7 precomputed
 *   grid points. Per-square argmax-die badges shift as γ changes. Mix strip
 *   below shows % of squares preferring each die.
 *
 *   Direct interaction, slider, V + policy re-render. No step engine.
 *   Cold-entry: requires DATA.valueIteration.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  function vBin(v, lo, hi) {
    if (!Number.isFinite(v)) return 0;
    if (hi <= lo) return 0;
    const t = (v - lo) / (hi - lo);
    const b = Math.floor(t * 8);
    return Math.max(0, Math.min(7, b));
  }

  window.scenes.scene3 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene3-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>γ as risk preference.</h1>' +
      '<p class="subtitle">Patient agents take chances. Impatient ones play safe.</p>';
    wrap.appendChild(hero);

    const VI = window.DATA && window.DATA.valueIteration;
    if (!VI || !VI.byGamma) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML =
        '<p class="caption">Value-iteration data is missing, run ' +
        '<code>node precompute/build-datasets.js</code> from the viz folder.</p>';
      wrap.appendChild(empty);
      return {};
    }

    const gammaGrid = VI.gammaGrid;
    const defaultIdx = gammaGrid.indexOf(0.95);

    /* Layout */
    const layout = document.createElement('div');
    layout.className = 's-layout';
    wrap.appendChild(layout);

    const left = document.createElement('div');
    left.className = 's-left';
    layout.appendChild(left);

    const rail = document.createElement('div');
    rail.className = 's-rail';
    layout.appendChild(rail);

    const boardHost = document.createElement('div');
    boardHost.className = 'scene3-board';
    left.appendChild(boardHost);
    const board = window.Board.mount(boardHost);
    const cfg = window.DATA.board;
    board.drawJumps(cfg.snakes, cfg.ladders);
    board.setTokenVisible(false);

    /* γ slider */
    const ctrl = document.createElement('div');
    ctrl.className = 'controls';
    left.appendChild(ctrl);

    const grp = document.createElement('div');
    grp.className = 'control-group greek';
    grp.innerHTML = '<label class="greek-text">γ</label>';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(gammaGrid.length - 1);
    slider.step = '1';
    slider.value = String(defaultIdx);
    grp.appendChild(slider);
    const out = document.createElement('output');
    out.className = 'control-value';
    grp.appendChild(out);
    ctrl.appendChild(grp);

    /* Mix strip */
    const mixStrip = document.createElement('div');
    mixStrip.className = 'policy-mix-strip';
    mixStrip.innerHTML =
      '<span class="pm-label">policy mix</span>' +
      '<span class="pm-die"><span class="die-pill die-d4">d4</span><span id="pm-d4">, </span></span>' +
      '<span class="pm-die"><span class="die-pill die-d6">d6</span><span id="pm-d6">, </span></span>' +
      '<span class="pm-die"><span class="die-pill die-d8">d8</span><span id="pm-d8">, </span></span>';
    left.appendChild(mixStrip);

    const cap = document.createElement('p');
    cap.className = 'caption';
    cap.textContent =
      'Lower γ = greedy in time = prefer the safer, smaller-variance dice. ' +
      'Higher γ = patient = willing to use the jumpy d8 because the future is worth waiting for.';
    left.appendChild(cap);

    /* Rail: γ explanation card. */
    const railTitle = document.createElement('div');
    railTitle.className = 'rail-title';
    railTitle.textContent = 'Per-γ summary';
    rail.appendChild(railTitle);
    const railCard = document.createElement('div');
    railCard.className = 'card';
    railCard.innerHTML =
      '<div class="vi-stat-row"><span class="vi-k">γ</span><span class="vi-v" id="s3-gamma">, </span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">iters to converge</span><span class="vi-v" id="s3-iters">, </span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">V(1)</span><span class="vi-v" id="s3-v1">, </span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">dice used</span><span class="vi-v" id="s3-dice">, </span></div>';
    rail.appendChild(railCard);

    /* V color scale uses γ=0.99 range (widest) so cells don't pop colors across slider positions. */
    const refV = VI.V['0.99'];
    let lo = Infinity, hi = -Infinity;
    for (let s = 1; s <= 99; s++) {
      if (refV[s] < lo) lo = refV[s];
      if (refV[s] > hi) hi = refV[s];
    }
    if (0 > hi) hi = 0;
    if (lo === hi) hi = lo + 1;

    const cellMap = board.cellByN;

    function setGamma(idx) {
      const g = gammaGrid[idx];
      const key = g.toFixed(2);
      const policy = VI.policy[key];
      const V = VI.V[key];
      const iters = VI.iters[key];
      out.value = 'γ = ' + g.toFixed(2);
      document.getElementById('s3-gamma').textContent = g.toFixed(2);
      document.getElementById('s3-iters').textContent = String(iters);
      document.getElementById('s3-v1').textContent = (V[1] || 0).toFixed(2);

      /* Update cells. */
      for (let s = 1; s <= 100; s++) {
        const c = cellMap.get(s);
        if (!c) continue;
        for (let b = 0; b < 8; b++) c.cell.classList.remove('v-bin-' + b);
        const v = V[s] || 0;
        const bin = vBin(v, lo, hi);
        c.cell.classList.add('v-bin-' + bin);
        c.text.textContent = (s === 100) ? '0' : v.toFixed(1);
      }
      /* Render policy badges. */
      window.QTable.renderBadgesFromPolicy(board, policy);

      /* Mix strip. */
      const mix = window.QTable.policyMix(policy);
      document.getElementById('pm-d4').textContent = mix.d4;
      document.getElementById('pm-d6').textContent = mix.d6;
      document.getElementById('pm-d8').textContent = mix.d8;

      const usedParts = [];
      for (const d of ['d4', 'd6', 'd8']) if (mix[d] > 0) usedParts.push(d);
      document.getElementById('s3-dice').textContent = usedParts.join(', ');
    }

    slider.addEventListener('input', () => setGamma(parseInt(slider.value, 10)));

    setGamma(defaultIdx);

    return {
      onEnter() { /* keep state */ },
      onLeave() {},
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

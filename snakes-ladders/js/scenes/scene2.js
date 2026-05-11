/* Scene 2 — Bellman, but for cycles.
 *
 *   Board with V(s) slots. Above the board: the Bellman equation.
 *   Below: a "Run value iteration" button + iteration counter + max-|ΔV| chip
 *   + a scrubber over the precomputed convergence history at γ=0.95.
 *
 *   Clicking "Run" auto-advances the scrubber from 0 to convergence at
 *   ~80 ms per step; the user can scrub manually at any time. Each step
 *   re-tints cells by V; the most-changed cell flashes. On convergence,
 *   argmax-die badges appear on each square.
 *
 *   &run hash flag triggers Play automatically (headless verification).
 *
 *   Cold-entry: requires DATA.valueIteration. If missing, render placeholder.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  const GAMMA = 0.95;
  const KEY = GAMMA.toFixed(2);

  /* Map V[s] to one of 8 bins given (lo, hi). */
  function vBin(v, lo, hi) {
    if (!Number.isFinite(v)) return 0;
    if (hi <= lo) return 0;
    const t = (v - lo) / (hi - lo);
    const b = Math.floor(t * 8);
    return Math.max(0, Math.min(7, b));
  }

  function shouldAutoRun() {
    return /[#&?]run\b/.test(window.location.hash);
  }

  window.scenes.scene2 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene2-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Bellman, but for cycles.</h1>' +
      '<p class="subtitle">Snakes send you back. So we iterate until V stops changing.</p>';
    wrap.appendChild(hero);

    /* Bellman formula. */
    const formula = document.createElement('div');
    formula.className = 'formula-block';
    window.Katex.render(window.DATA.tex.bellman, formula, true);
    wrap.appendChild(formula);

    /* Cold-entry check. */
    const VI = window.DATA && window.DATA.valueIteration;
    if (!VI || !VI.byGamma || !VI.byGamma[KEY]) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML =
        '<p class="caption">Value-iteration data is missing — run ' +
        '<code>node precompute/build-datasets.js</code> from the viz folder.</p>';
      wrap.appendChild(empty);
      return {};
    }

    const history = VI.byGamma[KEY];
    const totalIters = history.length - 1; /* iter 0 + iter 1..N */
    const policy = VI.policy[KEY];

    /* Layout: board on the left, controls + chip on the right. */
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
    boardHost.className = 'scene2-board';
    left.appendChild(boardHost);
    const board = window.Board.mount(boardHost);
    const cfg = window.DATA.board;
    board.drawJumps(cfg.snakes, cfg.ladders);
    board.setTokenVisible(false);

    /* Scrubber + Run button. */
    const ctrl = document.createElement('div');
    ctrl.className = 'controls';
    left.appendChild(ctrl);

    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'primary';
    runBtn.textContent = 'Run value iteration';
    const runGrp = document.createElement('div');
    runGrp.className = 'control-group';
    runGrp.appendChild(runBtn);
    ctrl.appendChild(runGrp);

    const speedGrp = document.createElement('div');
    speedGrp.className = 'control-group greek';
    speedGrp.innerHTML = '<label class="greek-text">speed</label>';
    const speedSel = document.createElement('select');
    speedSel.innerHTML = '<option value="120">slow</option><option value="60" selected>medium</option><option value="20">fast</option>';
    speedGrp.appendChild(speedSel);
    ctrl.appendChild(speedGrp);

    const scrubWrap = document.createElement('div');
    scrubWrap.className = 'scrubber';
    left.appendChild(scrubWrap);
    const scrLabel = document.createElement('span');
    scrLabel.className = 'scr-label';
    scrLabel.textContent = 'iter 0';
    scrubWrap.appendChild(scrLabel);
    const scrInput = document.createElement('input');
    scrInput.type = 'range';
    scrInput.min = '0';
    scrInput.max = String(totalIters);
    scrInput.step = '1';
    scrInput.value = '0';
    scrubWrap.appendChild(scrInput);
    const scrDelta = document.createElement('span');
    scrDelta.className = 'scr-label';
    scrDelta.style.textAlign = 'right';
    scrDelta.textContent = 'max-|ΔV|: —';
    scrubWrap.appendChild(scrDelta);

    /* Side rail: a few key V values + policy info. */
    const railTitle = document.createElement('div');
    railTitle.className = 'rail-title';
    railTitle.textContent = 'After convergence';
    rail.appendChild(railTitle);

    const railCard = document.createElement('div');
    railCard.className = 'card';
    railCard.innerHTML =
      '<div class="vi-stat-row"><span class="vi-k">iters to converge</span><span class="vi-v" id="vi-iters-conv">' + totalIters + '</span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">V(1) — start square</span><span class="vi-v" id="vi-v1">—</span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">expected turns from 1</span><span class="vi-v" id="vi-exp">—</span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">dice in policy</span><span class="vi-v" id="vi-dice">—</span></div>';
    rail.appendChild(railCard);

    const railNote = document.createElement('p');
    railNote.className = 'caption';
    railNote.style.marginTop = '8px';
    railNote.textContent =
      'Spooky House solved this in one sweep — its graph had no cycles. Snakes give cycles, so we iterate.';
    rail.appendChild(railNote);

    /* --------- Rendering ---------- */
    /* The V-color scale is computed over the *final* iteration's V range so
       cells don't jitter colour across iterations. */
    const finalV = history[history.length - 1].V;
    let lo = Infinity, hi = -Infinity;
    for (let s = 1; s <= 99; s++) {
      if (finalV[s] < lo) lo = finalV[s];
      if (finalV[s] > hi) hi = finalV[s];
    }
    /* Goal cell (s=100) has V=0 — include it in range. */
    if (0 < lo) lo = -Math.max(-lo, 1);
    if (0 > hi) hi = Math.max(hi, 0.01);

    /* Cache cell DOM nodes. */
    const cellMap = board.cellByN;

    function showBadges(on) {
      board.clearBadges();
      if (!on) return;
      window.QTable.renderBadgesFromPolicy(board, policy);
    }

    function setIter(k) {
      const i = Math.max(0, Math.min(totalIters, k | 0));
      scrInput.value = String(i);
      const frame = history[i];
      const V = frame.V;
      const isConverged = (i === totalIters);
      scrLabel.textContent = 'iter ' + i + ' / ' + totalIters;
      const md = frame.maxDelta;
      if (!Number.isFinite(md)) {
        scrDelta.textContent = 'max-|ΔV|: —';
      } else {
        scrDelta.textContent = 'max-|ΔV|: ' + md.toFixed(4);
      }
      /* Update cells. */
      for (let s = 1; s <= 100; s++) {
        const c = cellMap.get(s);
        if (!c) continue;
        /* Strip existing v-bin classes. */
        for (let b = 0; b < 8; b++) c.cell.classList.remove('v-bin-' + b);
        const v = V[s] || 0;
        if (i === 0) {
          /* Iter 0: don't tint, don't label — V is uniformly 0. */
          c.text.textContent = '';
        } else {
          const bin = vBin(v, lo, hi);
          c.cell.classList.add('v-bin-' + bin);
          c.text.textContent = v.toFixed(1);
        }
      }
      /* Policy badges only after convergence. */
      showBadges(isConverged);

      /* Rail stats. */
      document.getElementById('vi-v1').textContent = (V[1] || 0).toFixed(2);
      /* expected turns ≈ -V[1] * something; since γ < 1, undiscounted ≈
         -V[1]/(1-γ^N) for some N. Best to report just the discounted V.
         We label it directly. */
      document.getElementById('vi-exp').textContent = '~' + Math.round(-(V[1] || 0) / (1 - GAMMA) * (1 - GAMMA)) + ' (discounted)';
      /* Better: report -V[1] as an estimate, with note. */
      document.getElementById('vi-exp').textContent = '~' + (-(V[1] || 0)).toFixed(1) + ' (V is discounted)';
      /* Dice in policy: only meaningful at convergence. */
      if (isConverged) {
        const mix = window.QTable.policyMix(policy);
        const parts = [];
        for (const d of ['d4', 'd6', 'd8']) {
          if (mix[d] > 0) parts.push(d + ' (' + mix[d] + ')');
        }
        document.getElementById('vi-dice').textContent = parts.join(' · ');
      } else {
        document.getElementById('vi-dice').textContent = '—';
      }
    }

    scrInput.addEventListener('input', () => setIter(parseInt(scrInput.value, 10)));

    /* Run animation: walk the scrubber. */
    let running = false;
    let runTimer = null;

    function stopRun() {
      running = false;
      if (runTimer) { clearTimeout(runTimer); runTimer = null; }
      runBtn.textContent = 'Run value iteration';
    }

    function startRun() {
      if (running) { stopRun(); return; }
      running = true;
      runBtn.textContent = 'Pause';
      const stepMs = parseInt(speedSel.value, 10);
      let i = parseInt(scrInput.value, 10);
      if (i >= totalIters) i = 0;
      function tick() {
        if (!running) return;
        setIter(i);
        if (i >= totalIters) { stopRun(); return; }
        i += 1;
        runTimer = setTimeout(tick, stepMs);
      }
      tick();
    }
    runBtn.addEventListener('click', startRun);

    /* Initial state: iter 0 (blank). */
    setIter(0);

    if (shouldAutoRun()) setTimeout(startRun, 250);

    return {
      onEnter() { /* keep state */ },
      onLeave() { stopRun(); },
      onNextKey() {
        if (running) return true;
        const i = parseInt(scrInput.value, 10);
        if (i >= totalIters) return false;
        setIter(i + 1);
        return true;
      },
      onPrevKey() {
        if (running) return true;
        const i = parseInt(scrInput.value, 10);
        if (i <= 0) return false;
        setIter(i - 1);
        return true;
      },
    };
  };
})();

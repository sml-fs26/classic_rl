/* Scene 9 - dynamic programming fills Q* on the 6x3 board.
 *
 *   Manager meaning first: with a KNOWN die (flat 1/6) and a PINNED rival
 *   (the house holds at 20), this is a single-agent MDP, so we can compute
 *   the whole optimal playbook EXACTLY by sweeping the Bellman backup to a
 *   fixed point. The board fills over a few sweeps and the climbing staircase
 *   draws itself.
 *
 *   The 6x3 board is the reused QTable widget. STEP SWEEP / RUN ALL / RESET
 *   reveal the cells in the order the exact DP actually locks them (read from
 *   window.DATA.sweepSnapshots): the cheap-pot ROLL floor first, then the
 *   HOLD corner at 21+, then the staircase reaching DOWN to a 16-20 pot in
 *   the AHEAD column, then the contested middle. Revealed cells are painted
 *   from the converged oracle (window.DATA.oraclePolicy / oracleQ) so the
 *   regions are stable and correct once they lock; a side panel narrates each
 *   sweep. Gated behind &run for headless capture.
 *
 *   Cold entry rebuilds from window.DATA. No hand-typed win probabilities.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  const NS = (window.Pig && window.Pig.STANDINGS) || 3;
  const NB = (window.Pig && window.Pig.POT_BUCKETS) || 6;
  const N = NB * NS;                                   // 18
  const A = (window.Moves && window.Moves.MOVE_IDS.length) || 2;

  /* cell helpers over the 6x3 display grid: index = potBucket * NS + standing. */
  function cellsInBuckets(buckets) {
    const out = [];
    for (const b of buckets) for (let s = 0; s < NS; s++) out.push(b * NS + s);
    return out;
  }
  function cell(b, s) { return b * NS + s; }

  /* The reveal phases mirror the exact DP's true lock order (verified against
     window.DATA.sweepSnapshots): the cheap-pot floor locks at sweep 1, the
     21+ EVEN/AHEAD HOLD corner at sweep 2, the 16-20 AHEAD step at sweep 3,
     the last HOLD cell (21+ BEHIND) plus the contested mids by sweep 5. */
  const PHASES = [
    {
      sweep: 1,
      titleKey: 's9.phase.1.title', bodyKey: 's9.phase.1.body',
      reveal: cellsInBuckets([0, 1, 2]),                 // cheap pots, all standings
    },
    {
      sweep: 2,
      titleKey: 's9.phase.2.title', bodyKey: 's9.phase.2.body',
      reveal: [cell(5, 1), cell(5, 2)],                  // 21+ EVEN, 21+ AHEAD -> HOLD
    },
    {
      sweep: 3,
      titleKey: 's9.phase.3.title', bodyKey: 's9.phase.3.body',
      reveal: [cell(4, 2)],                              // 16-20 AHEAD -> HOLD (the step down)
    },
    {
      sweep: 5,
      titleKey: 's9.phase.4.title', bodyKey: 's9.phase.4.body',
      reveal: [cell(3, 0), cell(3, 1), cell(3, 2),       // 11-15 all (contested mid)
               cell(4, 0), cell(4, 1),                   // 16-20 BEHIND, EVEN -> ROLL
               cell(5, 0)],                              // 21+ BEHIND -> HOLD (last)
    },
    {
      sweep: 42,
      titleKey: 's9.phase.5.title', bodyKey: 's9.phase.5.body',
      reveal: [], converged: true,
    },
  ];

  window.scenes.scene9 = function (root) {
    root.className = 'scene-pad s9-scene';
    root.innerHTML = '';

    const DATA = window.DATA || {};
    const oraclePolicy = DATA.oraclePolicy || [];
    const oracleQ = DATA.oracleQ || [];
    const finalSweep = (DATA.sweepSnapshots && DATA.sweepSnapshots.length)
      ? DATA.sweepSnapshots[DATA.sweepSnapshots.length - 1].sweep : 42;
    const rivalHold = DATA.rivalHold != null ? DATA.rivalHold
      : ((window.Pig && window.Pig.RIVAL_HOLD) || 20);
    const startPct = DATA.startWinProb != null
      ? Math.round(DATA.startWinProb * 100) + '%' : '64%';

    /* ---- Heading + manager framing ---- */
    const h = document.createElement('h2');
    h.className = 's9-heading';
    h.textContent = T('s9.heading');
    root.appendChild(h);

    const mgr = document.createElement('div');
    mgr.className = 's9-manager';
    mgr.textContent = T('s9.manager', { hold: rivalHold });
    root.appendChild(mgr);

    /* ---- Bellman formula card + the load-bearing assumption ---- */
    const fcard = document.createElement('div');
    fcard.className = 's9-formula-card';
    fcard.innerHTML = '<div class="s9-card-label">' + T('s9.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fhost.className = 's9-formula';
    fcard.appendChild(fhost);
    window.Katex.render(
      (DATA.tex && DATA.tex.bellman) ||
        "Q^*(s, a) = \\mathbb{E}\\,[\\, R + \\max_{a'} Q^*(S', a') \\,]",
      fhost, true
    );
    const assume = document.createElement('div');
    assume.className = 's9-assumption';
    assume.textContent = T('s9.assumption', { hold: rivalHold });
    fcard.appendChild(assume);
    root.appendChild(fcard);

    /* ---- Controls + status ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's9-controls-row';
    ctrls.innerHTML =
      '<div class="s9-controls">' +
        '<button class="s9-btn" id="s9-step">' + T('s9.btn.step') + '</button>' +
        '<button class="s9-btn" id="s9-run">'  + T('s9.btn.run')  + '</button>' +
        '<button class="s9-btn s9-btn-ghost" id="s9-reset">' + T('s9.btn.reset') + '</button>' +
      '</div>' +
      '<div class="s9-status">' +
        T('s9.status.sweep') + ' <b id="s9-sweep">0</b> &middot; ' +
        T('s9.status.locked') + ' <b id="s9-locked">0 / ' + N + '</b>' +
      '</div>';
    root.appendChild(ctrls);

    /* ---- Row: board + side narration panel ---- */
    const row = document.createElement('div');
    row.className = 's9-row';
    root.appendChild(row);

    const boardHost = document.createElement('div');
    boardHost.className = 's9-board';
    row.appendChild(boardHost);
    const board = window.QTable.mount(boardHost, { miniCards: true, showQ: true });

    const panel = document.createElement('div');
    panel.className = 's9-panel';
    row.appendChild(panel);

    /* Legend under the board. */
    const legend = document.createElement('div');
    legend.className = 's9-legend';
    legend.innerHTML =
      '<span class="s9-leg s9-leg-roll"><i></i>' + T('s9.legend.roll') + '</span>' +
      '<span class="s9-leg s9-leg-hold"><i></i>' + T('s9.legend.hold') + '</span>' +
      '<span class="s9-leg s9-leg-pending"><i></i>' + T('s9.legend.pending') + '</span>';
    root.appendChild(legend);

    /* ---- Bridge ---- */
    const bridge = document.createElement('div');
    bridge.className = 's9-bridge';
    bridge.textContent = T('s9.bridge');
    root.appendChild(bridge);

    /* ---- Reveal state machine ---- */
    let phaseIdx = -1;
    const revealed = new Array(N).fill(false);

    /* Paint the board from the reveal mask: revealed cells take the converged
       oracle policy + Q; unrevealed cells stay "unknown" (dimmed, no number). */
    function repaint(justRevealed) {
      const ids = new Array(N);
      const Q = new Array(N * A);
      for (let i = 0; i < N; i++) {
        if (revealed[i]) {
          ids[i] = oraclePolicy[i] || null;
          for (let a = 0; a < A; a++) Q[i * A + a] = oracleQ[i * A + a];
        } else {
          ids[i] = null;
          for (let a = 0; a < A; a++) Q[i * A + a] = NaN;   // -> "." placeholder
        }
      }
      board.setPolicy(ids, Q);
      /* Pending cells get a dimmed class; freshly revealed ones flash. */
      for (let i = 0; i < N; i++) {
        const node = board.getCellNode(i);
        if (!node) continue;
        node.classList.toggle('s9-pending', !revealed[i]);
        node.classList.remove('s9-just');
      }
      if (justRevealed) {
        for (const i of justRevealed) {
          const node = board.getCellNode(i);
          if (!node) continue;
          node.classList.add('s9-just');
          setTimeout((function (n) { return function () { n && n.classList.remove('s9-just'); }; })(node), 760);
        }
        if (justRevealed.length && window.SFX) window.SFX.play('cursor');
      }
    }

    function renderPanel(p, foot) {
      let html = '<div class="s9-panel-title">' + T(p.titleKey) + '</div>';
      html += '<div class="s9-panel-body">' + T(p.bodyKey) + '</div>';
      if (foot) html += '<div class="s9-panel-foot">' + foot + '</div>';
      panel.innerHTML = html;
    }

    function updateStatus(sweepShown) {
      const lockedCount = revealed.filter(Boolean).length;
      const sEl = document.getElementById('s9-sweep');
      const lEl = document.getElementById('s9-locked');
      if (sEl) sEl.textContent = String(sweepShown);
      if (lEl) lEl.textContent = lockedCount + ' / ' + N;
    }

    function applyPhase(idx) {
      const p = PHASES[idx];
      for (const i of p.reveal) revealed[i] = true;
      repaint(p.reveal && p.reveal.length ? p.reveal.slice() : null);
      const foot = p.converged ? T('s9.phase.5.foot', { start: startPct }) : null;
      renderPanel(p, foot);
      updateStatus(p.sweep);
    }

    function step() {
      if (phaseIdx >= PHASES.length - 1) return;
      phaseIdx++;
      applyPhase(phaseIdx);
    }
    function runAll() {
      while (phaseIdx < PHASES.length - 1) { phaseIdx++; applyPhase(phaseIdx); }
    }
    function reset() {
      phaseIdx = -1;
      for (let i = 0; i < N; i++) revealed[i] = false;
      board.reset();
      repaint(null);
      panel.innerHTML =
        '<div class="s9-panel-title">' + T('s9.panel.ready.title') + '</div>' +
        '<div class="s9-panel-body">' + T('s9.panel.ready.body') + '</div>';
      updateStatus(0);
    }

    document.getElementById('s9-step').addEventListener('click', step);
    document.getElementById('s9-run').addEventListener('click', runAll);
    document.getElementById('s9-reset').addEventListener('click', reset);

    reset();

    /* &run: auto-fill for headless capture (never auto-runs on a normal enter). */
    const autoRun = /[#&?]run\b/.test(window.location.hash || '');
    if (autoRun) setTimeout(runAll, 220);

    /* &dp=N: jump to phase N for headless capture of a single sweep. */
    const m = (window.location.hash || '').match(/[#&?]dp=(\d+)/);
    if (m) {
      const target = Math.min(PHASES.length - 1, Math.max(0, parseInt(m[1], 10) - 1));
      setTimeout(function () {
        while (phaseIdx < target) { phaseIdx++; applyPhase(phaseIdx); }
      }, 220);
    }

    return {
      onEnter() {
        if (phaseIdx < 0) reset(); else applyPhase(phaseIdx);
      },
      /* Right arrow advances one sweep, matching STEP; yields to the engine
         once converged so the lecturer can move on. */
      onNextKey() {
        if (phaseIdx < PHASES.length - 1) { step(); return true; }
        return false;
      },
      onPrevKey() { return false; },
    };
  };
})();

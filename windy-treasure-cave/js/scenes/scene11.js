/* Scene 11, SARSA vs Q-learning, side by side (the honest, model-free scene).
 *   Step 1: derive model-free TD control from Bellman by replacing the
 *     expectation with one observed step, then split into the TWO update rules
 *     that differ only in how they bootstrap the next heading:
 *       - SARSA (on-policy): use the heading you ACTUALLY play next -> learns
 *         the value of the cautious route it follows ("keep your distance").
 *       - Q-learning (off-policy): use the BEST next heading -> learns the value
 *         of the optimal route ("assume you'll play optimally afterward").
 *   Step 2: a live run that replays both learners' precomputed Q snapshots onto
 *     two learning cave boards, side by side, with the exact DP oracle for
 *     reference. Q-learning's arrows converge to the optimal map (== DP);
 *     SARSA's settle into a more cautious field that steers wider of the pit
 *     (below the pit it aims AWAY). A DP-agreement bar + reach-gold readout
 *     track each. The deliberate, honest cliff-walking lesson.
 *   Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;
  const AIDS = D.actionIds || ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const A = AIDS.length;

  const LEARN = D.learners || {};
  const optReach = LEARN.optimalReachGold != null ? LEARN.optimalReachGold : 0.95;
  const qlearn = LEARN.qlearn || { snapshots: [], evalCurve: [] };
  const sarsa = LEARN.sarsa || { snapshots: [], evalCurve: [] };

  function bestIdx(Q, i) { const base = i * A; let m = -Infinity, k = -1; for (let a = 0; a < A; a++) { const v = Q[base + a]; if (v == null) continue; if (v > m) { m = v; k = a; } } return k; }
  /* argmax-arrow 5x5 grid from a flat learned Q snapshot (only visited tiles). */
  function arrowGridFromQ(Q) {
    const g = []; for (let r = 0; r < C.ROWS; r++) { g.push([]); for (let c = 0; c < C.COLS; c++) g[r].push(null); }
    for (let i = 0; i < C.NON_TERMINAL_STATES.length; i++) {
      const t = C.NON_TERMINAL_STATES[i];
      const base = i * A; let allZero = true, m = -Infinity, k = -1;
      for (let a = 0; a < A; a++) { const v = Q[base + a]; if (v == null) continue; if (v !== 0) allZero = false; if (v > m) { m = v; k = a; } }
      g[t.row][t.col] = allZero ? null : AIDS[k];
    }
    return g;
  }
  /* % of non-terminal tiles whose learned argmax matches a DP-optimal heading. */
  function agreementPct(Q) {
    let ok = 0, tot = 0;
    for (let i = 0; i < C.NON_TERMINAL_STATES.length; i++) {
      const t = C.NON_TERMINAL_STATES[i];
      const base = i * A; let allZero = true, m = -Infinity, k = -1;
      for (let a = 0; a < A; a++) { const v = Q[base + a]; if (v == null) continue; if (v !== 0) allZero = false; if (v > m) { m = v; k = a; } }
      if (allZero) continue;
      tot++;
      const tied = (D.tieGrid && D.tieGrid[t.row]) ? D.tieGrid[t.row][t.col] : [(D.policyGrid && D.policyGrid[t.row]) ? D.policyGrid[t.row][t.col] : null];
      if (tied && tied.indexOf(AIDS[k]) >= 0) ok++;
    }
    return tot ? 100 * ok / tot : 0;
  }
  function evalAt(curve, ep) { if (!curve || !curve.length) return 0; let best = curve[0]; for (const p of curve) if (p.episode <= ep) best = p; return best.winRate; }

  window.scenes.scene11 = function (root) {
    root.className = 'scene scene-pad sc11';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene11.title') + '</h2>' +
      '<div class="sc11-stage" id="sc11-stage"></div>' +
      '<div class="wtc-btn-row sc11-nav">' +
        '<span class="sc11-stepcount muted"></span>' +
        '<button class="wtc-btn sc11-back" type="button">' + T('scene11.back') + '</button>' +
        '<button class="wtc-btn primary sc11-next" type="button">' + T('scene11.next') + '</button>' +
      '</div>';

    const stage = root.querySelector('#sc11-stage');
    let cursor = 0;
    let sarsaBoard = null, qlearnBoard = null, oracleBoard = null;
    let snapIdx = 0, playing = false, playTimer = null;
    const maxSnaps = Math.max(qlearn.snapshots.length, sarsa.snapshots.length);

    function buildStep1() {
      stage.innerHTML =
        '<div class="sc11-tag">' + T('scene11.s1.tag') + '</div>' +
        '<h3 class="sc11-h">' + T('scene11.s1.title') + '</h3>' +
        '<p class="scene-lede">' + T('scene11.s1.lead') + '</p>' +
        '<div class="formula-card"><div class="formula-label">' + T('scene11.s1.f0lab') + '</div><div id="sc11-f0"></div></div>' +
        '<div class="sc11-split-cards">' +
          '<div class="formula-card sc11-card-sarsa"><div class="formula-label">' + T('scene11.s1.fSarsaLab') + '</div><div id="sc11-fsarsa"></div>' +
            '<p class="formula-note">' + T('scene11.s1.sarsaGloss') + '</p></div>' +
          '<div class="formula-card sc11-card-qlearn"><div class="formula-label">' + T('scene11.s1.fQLab') + '</div><div id="sc11-fq"></div>' +
            '<p class="formula-note">' + T('scene11.s1.qGloss') + '</p></div>' +
        '</div>' +
        '<div class="poke-box sc11-eps"><b>' + T('scene11.epsTitle') + '.</b> ' + T('scene11.epsBody') + '</div>' +
        '<p class="sc11-note muted">' + T('scene11.note') + '</p>';
      window.Katex.render(D.tex && D.tex.bellman ? D.tex.bellman : 'Q^{*}(s,a)=\\mathbb{E}[R+\\max_{a\'}Q^{*}(S\',a\')]', stage.querySelector('#sc11-f0'), true);
      window.Katex.render(D.tex && D.tex.sarsa ? D.tex.sarsa : 'q[s,a] \\mathrel{+}= \\alpha(r + q[s\',a\'] - q[s,a])', stage.querySelector('#sc11-fsarsa'), true);
      window.Katex.render(D.tex && D.tex.qlearning ? D.tex.qlearning : 'q[s,a] \\mathrel{+}= \\alpha(r + \\max_{a\'} q[s\',a\'] - q[s,a])', stage.querySelector('#sc11-fq'), true);
    }

    function buildStep2() {
      stage.innerHTML =
        '<div class="sc11-tag">' + T('scene11.s2.tag') + '</div>' +
        '<h3 class="sc11-h">' + T('scene11.s2.title') + '</h3>' +
        '<div class="wtc-btn-row sc11-ctrls">' +
          '<button class="wtc-btn primary sc11-play" type="button">' + T('scene11.play') + '</button>' +
          '<button class="wtc-btn sc11-reset" type="button">' + T('scene11.reset') + '</button>' +
          '<span class="sc11-ep-wrap muted">' + T('scene11.episodes') + ' <span class="sc11-ep tnum" id="sc11-ep">0</span></span>' +
        '</div>' +
        '<div class="sc11-boards">' +
          '<div class="sc11-board sc11-board-sarsa">' +
            '<div class="sc11-board-title">' + T('scene11.sarsaTitle') + '</div>' +
            '<div class="sc11-board-sub">' + T('scene11.sarsaSub') + '</div>' +
            '<div class="sc11-board-host sc11-sarsa-host"></div>' +
            '<div class="sc11-readout">' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.conv') + '</span><span class="sc11-bar"><span class="sc11-bar-fill" id="sc11-sarsa-conv-fill"></span></span><span class="sc11-ro-val tnum" id="sc11-sarsa-conv">0%</span></div>' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.reach') + '</span><span class="sc11-ro-val tnum" id="sc11-sarsa-wr">--</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="sc11-board sc11-board-qlearn">' +
            '<div class="sc11-board-title">' + T('scene11.qlearnTitle') + '</div>' +
            '<div class="sc11-board-sub">' + T('scene11.qlearnSub') + '</div>' +
            '<div class="sc11-board-host sc11-qlearn-host"></div>' +
            '<div class="sc11-readout">' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.conv') + '</span><span class="sc11-bar"><span class="sc11-bar-fill" id="sc11-qlearn-conv-fill"></span></span><span class="sc11-ro-val tnum" id="sc11-qlearn-conv">0%</span></div>' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.reach') + '</span><span class="sc11-ro-val tnum" id="sc11-qlearn-wr">--</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="sc11-board sc11-board-oracle">' +
            '<div class="sc11-board-title">' + T('scene11.oracle') + '</div>' +
            '<div class="sc11-board-sub">' + T('scene11.oracleSub') + '</div>' +
            '<div class="sc11-board-host sc11-oracle-host"></div>' +
            '<div class="sc11-readout">' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.reach') + '</span><span class="sc11-ro-val tnum">' + optReach.toFixed(2) + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="poke-box sc11-framing">' + T('scene11.framing') + '</div>';

      sarsaBoard = window.CaveBoard.mount(stage.querySelector('.sc11-sarsa-host'), { size: 'sm', showSprites: true });
      qlearnBoard = window.CaveBoard.mount(stage.querySelector('.sc11-qlearn-host'), { size: 'sm', showSprites: true });
      oracleBoard = window.CaveBoard.mount(stage.querySelector('.sc11-oracle-host'), { size: 'sm', showSprites: true });
      oracleBoard.setArrows(D.policyGrid || [], { ties: D.tieGrid });

      stage.querySelector('.sc11-play').addEventListener('click', togglePlay);
      stage.querySelector('.sc11-reset').addEventListener('click', resetRun);
      applySnap(0);
    }

    function paint(board, snaps, curve, prefix, i) {
      if (!board || !snaps.length) return 0;
      const idx = Math.max(0, Math.min(snaps.length - 1, i));
      const snap = snaps[idx];
      const Q = snap.Q;
      board.setArrows(arrowGridFromQ(Q));
      const conv = agreementPct(Q);
      const wr = evalAt(curve, snap.episode);
      const cf = stage.querySelector('#' + prefix + '-conv-fill'); if (cf) cf.style.width = conv.toFixed(0) + '%';
      const cv = stage.querySelector('#' + prefix + '-conv'); if (cv) cv.textContent = conv.toFixed(0) + '%';
      const wv = stage.querySelector('#' + prefix + '-wr'); if (wv) wv.textContent = snap.episode > 0 ? (wr.toFixed(2) + ' / ' + optReach.toFixed(2)) : '--';
      return snap.episode;
    }
    function applySnap(i) {
      snapIdx = Math.max(0, Math.min(maxSnaps - 1, i));
      const epS = paint(sarsaBoard, sarsa.snapshots, sarsa.evalCurve, 'sc11-sarsa', snapIdx);
      const epQ = paint(qlearnBoard, qlearn.snapshots, qlearn.evalCurve, 'sc11-qlearn', snapIdx);
      const ep = (epQ != null ? epQ : epS) || 0;
      const epEl = stage.querySelector('#sc11-ep'); if (epEl) epEl.textContent = ep.toLocaleString('en-US');
    }
    function togglePlay() {
      playing = !playing;
      const btn = stage.querySelector('.sc11-play');
      if (btn) { btn.textContent = playing ? T('scene11.pause') : T('scene11.play'); btn.classList.toggle('primary', !playing); }
      if (playing) tick(); else if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    }
    function tick() {
      if (!playing) return;
      if (snapIdx >= maxSnaps - 1) { playing = false; const b = stage.querySelector('.sc11-play'); if (b) { b.textContent = T('scene11.play'); b.classList.add('primary'); } return; }
      applySnap(snapIdx + 1);
      playTimer = setTimeout(tick, 820);
    }
    function resetRun() {
      playing = false; if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      const b = stage.querySelector('.sc11-play'); if (b) { b.textContent = T('scene11.play'); b.classList.add('primary'); }
      applySnap(0);
    }

    function applyCursor() {
      if (cursor === 0) buildStep1(); else buildStep2();
      root.querySelector('.sc11-stepcount').textContent = T('scene11.step', { n: cursor + 1 });
      const nextBtn = root.querySelector('.sc11-next');
      nextBtn.textContent = cursor === 1 ? T('scene11.done') : T('scene11.next');
      root.querySelector('.sc11-back').disabled = cursor === 0;
    }

    root.querySelector('.sc11-next').addEventListener('click', () => { if (cursor < 1) { cursor = 1; applyCursor(); } else window.WTC && window.WTC.goTo(12); });
    root.querySelector('.sc11-back').addEventListener('click', () => { if (cursor > 0) { cursor = 0; applyCursor(); } });
    applyCursor();

    if (window.WTC && window.WTC.run) { cursor = 1; applyCursor(); setTimeout(() => applySnap(maxSnaps - 1), 200); }

    return {
      onEnter() { applyCursor(); },
      onLeave() { playing = false; if (playTimer) { clearTimeout(playTimer); playTimer = null; } },
      onNextKey() { if (cursor < 1) { cursor = 1; applyCursor(); return true; } return false; },
      onPrevKey() { if (cursor > 0) { cursor = 0; applyCursor(); return true; } return false; },
    };
  };
})();

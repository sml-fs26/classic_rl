/* Scene 11, SARSA vs Q-learning, side by side (the honest TD split).
 *   Step 1: derive model-free TD control from Bellman by replacing the
 *     expectation with one observed dispatch, then split into the TWO update
 *     rules that differ only in how they bootstrap the next lever:
 *       - SARSA (on-policy): bootstrap on the lever you ACTUALLY play next a'
 *         -> learns the value of the cautious eps-soft rule it follows.
 *       - Q-learning (off-policy): bootstrap on the BEST next lever
 *         -> learns the value of the optimal policy regardless of exploration.
 *     Plus epsilon (occasionally try the lever that does not look best).
 *   Step 2: a live replay of both learners' precomputed Q snapshots into two
 *     dock boards, with the exact DP oracle (window.DATA.Qstar) beside them.
 *     Q-learning's frontier converges to the exact diagonal (matches DP);
 *     SARSA settles one cell more conservative, it ships the thin (2,3) order
 *     an hour early. A per-board DP-agreement bar + mean-return readout track
 *     each. Cold-entry safe; honours &run (auto-plays the run). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const NH = D.nh || 5;
  const A = (D.dims && D.dims.A) || 2;
  const ACTION_IDS = (window.Actions && window.Actions.ACTION_IDS) || ['wait', 'send'];

  const LEARN = D.learners || {};
  const QSTAR = D.Qstar || [];
  const DP_POL = D.policy || [];
  const optStart = (LEARN.optimalStartValue != null) ? LEARN.optimalStartValue : (D.V ? D.V[2 * NH + 4] : 3.16);
  const qlearn = LEARN.qlearn || { snapshots: [], returnCurve: [], stats: {} };
  const sarsa  = LEARN.sarsa  || { snapshots: [], returnCurve: [], stats: {} };

  /* 16 interior decision cells (p>=1, h>=1). */
  const DECISION = [];
  for (let p = 1; p <= 4; p++) for (let h = 1; h <= 4; h++) DECISION.push({ p: p, h: h });

  function argmaxIdx(Q, p, h) {
    const base = (p * NH + h) * A;
    let m = -Infinity, k = -1;
    for (let a = 0; a < A; a++) { const v = Q[base + a]; if (v == null || !isFinite(v)) continue; if (v > m) { m = v; k = a; } }
    return k;
  }
  /* % of the 16 decision cells whose greedy lever matches the DP oracle. */
  function agreementPct(Q) {
    let ok = 0;
    for (const { p, h } of DECISION) {
      const lk = argmaxIdx(Q, p, h);
      const dp = DP_POL[p * NH + h];
      if (lk >= 0 && ACTION_IDS[lk] === dp) ok++;
    }
    return 100 * ok / DECISION.length;
  }
  function retAtEpisode(curve, ep) {
    if (!curve || !curve.length) return null;
    let best = curve[0];
    for (const pt of curve) { if (pt.episode <= ep) best = pt; }
    return best.ret;
  }
  function fmtRet(x) { return (x == null) ? '--' : ((x > 0 ? '+' : '') + x.toFixed(2)); }

  window.scenes.scene11 = function (root) {
    root.className = 'scene scene-pad sc11';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene11.title') + '</h2>' +
      '<div class="sc11-stage" id="sc11-stage"></div>' +
      '<div class="btd-btn-row sc11-nav">' +
        '<span class="sc11-stepcount muted"></span>' +
        '<button class="btd-btn sc11-back" type="button" disabled>&lsaquo;</button>' +
        '<button class="btd-btn primary sc11-next" type="button">&rsaquo;</button>' +
      '</div>';

    const stage = root.querySelector('#sc11-stage');
    let cursor = 0;
    let sarsaBoard = null, qlearnBoard = null, oracleBoard = null;
    let snapIdx = 0, playing = false, playTimer = null;
    const maxSnaps = Math.max(qlearn.snapshots.length, sarsa.snapshots.length, 1);

    function buildStep1() {
      stage.innerHTML =
        '<p class="scene-lede">' + T('scene11.lede') + '</p>' +
        '<div class="formula-card"><div id="sc11-f0"></div></div>' +
        '<div class="sc11-split-cards">' +
          '<div class="formula-card sc11-card-sarsa"><div class="formula-label">' + T('scene11.sarsaTitle') + '</div><div id="sc11-fsarsa"></div></div>' +
          '<div class="formula-card sc11-card-qlearn"><div class="formula-label">' + T('scene11.qlTitle') + '</div><div id="sc11-fq"></div></div>' +
        '</div>' +
        '<div class="poke-box sc11-eps">' + T('scene11.eps') + '</div>';
      if (window.Katex) {
        window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a)=\\mathbb{E}[R+\\max_{a\'}Q^{*}(S\',a\')]', stage.querySelector('#sc11-f0'), true);
        window.Katex.render((D.tex && D.tex.sarsa) || 'q[s,a] \\mathrel{+}= \\alpha(r + q[s\',a\'] - q[s,a])', stage.querySelector('#sc11-fsarsa'), true);
        window.Katex.render((D.tex && D.tex.qlearning) || 'q[s,a] \\mathrel{+}= \\alpha(r + \\max_{a\'} q[s\',a\'] - q[s,a])', stage.querySelector('#sc11-fq'), true);
      }
    }

    function buildStep2() {
      stage.innerHTML =
        '<div class="btd-btn-row sc11-ctrls">' +
          '<button class="btd-btn primary sc11-play" type="button">' + T('scene11.train') + '</button>' +
          '<span class="sc11-ep-wrap muted">' + T('scene11.scrub') + ' <span class="sc11-ep tnum" id="sc11-ep">0</span></span>' +
        '</div>' +
        '<div class="sc11-boards">' +
          board('sarsa', T('scene11.sarsaTitle'), true) +
          board('qlearn', T('scene11.qlTitle'), true) +
          board('oracle', T('scene11.oracleTitle'), false) +
        '</div>' +
        '<div class="poke-box sc11-diff">' + T('scene11.diffNote') + '</div>' +
        '<div class="poke-box sc11-framing">' + T('scene11.framing') + '</div>';

      sarsaBoard  = window.DockBoard.mount(stage.querySelector('.sc11-sarsa-host'),  { variant: 'board', showQ: true, legend: false, compact: true });
      qlearnBoard = window.DockBoard.mount(stage.querySelector('.sc11-qlearn-host'), { variant: 'board', showQ: true, legend: false, compact: true });
      oracleBoard = window.DockBoard.mount(stage.querySelector('.sc11-oracle-host'), { variant: 'board', showQ: true, legend: false, compact: true });
      stage.querySelectorAll('.sc11-board-host .dockboard-board').forEach(b => b.classList.add('db-compact'));
      oracleBoard.update(QSTAR.map(v => (v == null ? null : v)), { suppressFlash: true });
      const oraRet = stage.querySelector('#sc11-oracle-ret'); if (oraRet) oraRet.textContent = fmtRet(optStart);

      stage.querySelector('.sc11-play').addEventListener('click', togglePlay);
      applySnap(0, true);
    }

    function board(prefix, title, withConv) {
      const sub = prefix === 'sarsa' ? T('scene11.sarsaConv')
        : prefix === 'qlearn' ? T('scene11.qlConv') : '';
      return '<div class="sc11-board sc11-board-' + prefix + '">' +
        '<div class="sc11-board-title">' + title + '</div>' +
        (sub ? '<div class="sc11-board-sub">' + sub + '</div>' : '<div class="sc11-board-sub"></div>') +
        '<div class="sc11-board-host"><div class="sc11-' + prefix + '-host"></div></div>' +
        '<div class="sc11-readout">' +
          (withConv ? '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.agree') + '</span>' +
            '<span class="sc11-bar"><span class="sc11-bar-fill conv" id="sc11-' + prefix + '-conv-fill"></span></span>' +
            '<span class="sc11-ro-val tnum" id="sc11-' + prefix + '-conv">0%</span></div>' : '') +
          '<div class="sc11-ro-row sc11-ro-wide"><span class="sc11-ro-lab">' + T('scene11.retLabel') + '</span>' +
            '<span class="sc11-ro-val tnum" id="sc11-' + prefix + '-ret">--</span></div>' +
        '</div>' +
      '</div>';
    }

    function paintLearner(boardObj, snaps, curve, prefix, snapI, suppress) {
      if (!boardObj || !snaps.length) return 0;
      const i = Math.max(0, Math.min(snaps.length - 1, snapI));
      const snap = snaps[i];
      const Q = snap.Q.map(v => (v == null ? null : v));
      boardObj.update(Q, { suppressFlash: !!suppress });
      const conv = agreementPct(Q);
      const cf = stage.querySelector('#sc11-' + prefix + '-conv-fill'); if (cf) cf.style.width = conv.toFixed(0) + '%';
      const cv = stage.querySelector('#sc11-' + prefix + '-conv'); if (cv) cv.textContent = conv.toFixed(0) + '%';
      const rv = stage.querySelector('#sc11-' + prefix + '-ret');
      if (rv) rv.textContent = snap.episode > 0 ? fmtRet(retAtEpisode(curve, snap.episode)) : '--';
      return snap.episode;
    }

    function applySnap(i, suppress) {
      snapIdx = Math.max(0, Math.min(maxSnaps - 1, i));
      const epS = paintLearner(sarsaBoard,  sarsa.snapshots,  sarsa.returnCurve,  'sarsa',  snapIdx, suppress);
      const epQ = paintLearner(qlearnBoard, qlearn.snapshots, qlearn.returnCurve, 'qlearn', snapIdx, suppress);
      const ep = (epQ != null ? epQ : epS) || 0;
      const epEl = stage.querySelector('#sc11-ep'); if (epEl) epEl.textContent = ep.toLocaleString('en-US');
    }

    function togglePlay() {
      playing = !playing;
      const btn = stage.querySelector('.sc11-play');
      if (snapIdx >= maxSnaps - 1 && playing) applySnap(0, true);
      if (btn) btn.classList.toggle('primary', !playing);
      if (playing) tick();
      else if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    }
    function tick() {
      if (!playing) return;
      if (snapIdx >= maxSnaps - 1) { playing = false; const b = stage.querySelector('.sc11-play'); if (b) b.classList.add('primary'); return; }
      applySnap(snapIdx + 1, false);
      playTimer = setTimeout(tick, 760);
    }

    function applyCursor() {
      if (cursor === 0) buildStep1(); else buildStep2();
      root.querySelector('.sc11-stepcount').textContent = (cursor + 1) + ' / 2';
      const nextBtn = root.querySelector('.sc11-next');
      nextBtn.disabled = cursor >= 1;
      root.querySelector('.sc11-back').disabled = cursor === 0;
    }

    root.querySelector('.sc11-next').addEventListener('click', () => { if (cursor < 1) { cursor = 1; applyCursor(); } });
    root.querySelector('.sc11-back').addEventListener('click', () => { if (cursor > 0) { cursor = 0; applyCursor(); } });

    applyCursor();

    if (window.BTD && window.BTD.run) {
      cursor = 1; applyCursor();
      setTimeout(() => applySnap(maxSnaps - 1, false), 200);
    }

    return {
      onEnter() { applyCursor(); },
      onLeave() { playing = false; if (playTimer) { clearTimeout(playTimer); playTimer = null; } },
      onNextKey() { if (cursor < 1) { cursor = 1; applyCursor(); return true; } return false; },
      onPrevKey() { if (cursor > 0) { cursor = 0; applyCursor(); return true; } return false; },
    };
  };
})();

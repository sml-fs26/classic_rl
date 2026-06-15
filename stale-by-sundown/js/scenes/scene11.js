/* Scene 11, SARSA: learn Q* by playing.
 *   Step 1: derive the fix from Bellman by replacing the EXPECTATION you cannot
 *     compute with ONE real sample from a day on the floor. The update, in words:
 *     "nudge this lever's score toward (the payoff you just saw + the score of
 *     the lever you actually picked next)." A small epsilon knob = "every so
 *     often, try an unproven lever just to learn" (exploration).
 *   Step 2: a live demo. The shop plays itself across thousands of days; the 5x3
 *     board's chips flicker and SETTLE into the same green-cap / amber-middle /
 *     red-floor pattern the DP oracle computed in scene 9, with a convergence
 *     bar tracking agreement. (On-policy SARSA under a GLIE schedule converges to
 *     Q* on all 15 cells; the precompute asserts it. A one-line note flags the
 *     honest nuance: steady exploration would leave SARSA a touch cautious, but
 *     as exploration anneals its fixed point becomes Q*.)
 *   Reads DATA.learners.glie + DATA.Qstar. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const B = window.Bakery;
  const N = B.N, A = (window.Levers && window.Levers.LEVER_IDS.length) || 3;
  const LEARN = D.learners || {};
  const QSTAR = D.Qstar || [];
  const glie = LEARN.glie || { snapshots: [], agreeCurve: [] };
  const dpRet = LEARN.dpReturnFrom3Fresh || (D.V ? D.V[12] : 6.85);

  function argmaxIdx(Q, si) { const base = si * A; let m = -Infinity, k = -1; for (let a = 0; a < A; a++) { const v = Q[base + a]; if (v == null || !isFinite(v)) continue; if (v > m) { m = v; k = a; } } return k; }
  function agreementPct(Q) { let ok = 0; for (let si = 0; si < N; si++) if (argmaxIdx(Q, si) === argmaxIdx(QSTAR, si)) ok++; return 100 * ok / N; }
  function retAtEpisode(curve, ep) { if (!curve || !curve.length) return 0; let best = curve[0]; for (const p of curve) if (p.episode <= ep) best = p; return best.ret; }

  window.scenes.scene11 = function (root) {
    root.className = 'scene scene-pad sc11';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene11.title') + '</h2>' +
      '<div class="sc11-stage" id="sc11-stage"></div>' +
      '<div class="gr-btn-row sc11-nav">' +
        '<span class="sc11-stepcount muted"></span>' +
        '<button class="poke-btn sc11-back" type="button">' + T('scene11.back') + '</button>' +
        '<button class="poke-btn primary sc11-next" type="button">' + T('scene11.next') + '</button>' +
      '</div>';

    const stage = root.querySelector('#sc11-stage');
    let cursor = 0;
    let learnBoard = null, oracleBoard = null;
    let snapIdx = 0, playing = false, playTimer = null;
    const maxSnaps = glie.snapshots.length;

    function buildStep1() {
      stage.innerHTML =
        '<div class="sc11-tag">' + T('scene11.s1.tag') + '</div>' +
        '<p class="scene-lede">' + T('scene11.s1.lead') + '</p>' +
        '<div class="formula-card"><div class="formula-label">' + T('scene11.s1.f0lab') + '</div><div id="sc11-f0"></div></div>' +
        '<div class="sc11-arrow-down">&darr; ' + T('scene11.s1.swap') + ' &darr;</div>' +
        '<div class="formula-card sc11-card-sarsa"><div class="formula-label">' + T('scene11.s1.fSarsaLab') + '</div><div id="sc11-fsarsa"></div>' +
          '<p class="formula-note">' + T('scene11.s1.sarsaGloss') + '</p></div>' +
        '<div class="poke-box sc11-eps"><b>' + T('scene11.epsTitle') + '.</b> ' + T('scene11.epsBody') + '</div>' +
        '<p class="sc11-note muted">' + T('scene11.note') + '</p>';
      window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a)=\\mathbb{E}[R+\\gamma\\max_{a\'}Q^{*}(S\',a\')]', stage.querySelector('#sc11-f0'), true);
      window.Katex.render((D.tex && D.tex.sarsa) || 'q[s,a] \\mathrel{+}= \\alpha(r + \\gamma\\, q[s\',a\'] - q[s,a])', stage.querySelector('#sc11-fsarsa'), true);
    }

    function buildStep2() {
      stage.innerHTML =
        '<div class="sc11-tag">' + T('scene11.s2.tag') + '</div>' +
        '<p class="scene-lede">' + T('scene11.s2.lead') + '</p>' +
        '<div class="gr-btn-row sc11-ctrls">' +
          '<button class="poke-btn primary sc11-play" type="button">' + T('scene11.play') + '</button>' +
          '<button class="poke-btn sc11-reset" type="button">' + T('scene11.reset') + '</button>' +
          '<span class="sc11-ep-wrap muted">' + T('scene11.episodes') + ' <span class="sc11-ep tnum" id="sc11-ep">0</span></span>' +
        '</div>' +
        '<div class="sc11-boards">' +
          '<div class="sc11-board sc11-board-learn">' +
            '<div class="sc11-board-title">' + T('scene11.learnTitle') + '</div>' +
            '<div class="sc11-board-sub">' + T('scene11.learnSub') + '</div>' +
            '<div class="sc11-board-host sc11-learn-host"></div>' +
            '<div class="sc11-readout">' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.conv') + '</span><span class="sc11-bar"><span class="sc11-bar-fill" id="sc11-conv-fill"></span></span><span class="sc11-ro-val tnum" id="sc11-conv">0%</span></div>' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.ret') + '</span><span class="sc11-ro-val tnum" id="sc11-ret">--</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="sc11-board sc11-board-oracle">' +
            '<div class="sc11-board-title">' + T('scene11.oracle') + '</div>' +
            '<div class="sc11-board-sub">' + T('scene11.oracleSub') + '</div>' +
            '<div class="sc11-board-host sc11-oracle-host"></div>' +
            '<div class="sc11-readout">' +
              '<div class="sc11-ro-row"><span class="sc11-ro-lab">' + T('scene11.ret') + '</span><span class="sc11-ro-val tnum">' + dpRet.toFixed(2) + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="poke-box sc11-framing">' + T('scene11.framing') + '</div>';

      learnBoard = window.Board.mount(stage.querySelector('.sc11-learn-host'), { variant: 'qtable', compact: true, legend: false });
      oracleBoard = window.Board.mount(stage.querySelector('.sc11-oracle-host'), { variant: 'qtable', compact: true, legend: false });
      oracleBoard.paintQ(QSTAR.map(v => (v == null ? null : v)), { suppressFlash: true });
      stage.querySelector('.sc11-play').addEventListener('click', togglePlay);
      stage.querySelector('.sc11-reset').addEventListener('click', resetRun);
      applySnap(0, true);
    }

    function applySnap(i, suppress) {
      snapIdx = Math.max(0, Math.min(maxSnaps - 1, i));
      const snap = glie.snapshots[snapIdx]; if (!snap || !learnBoard) return;
      const Q = snap.Q.map(v => (v == null ? null : v));
      learnBoard.paintQ(Q, { suppressFlash: !!suppress });
      const conv = agreementPct(Q);
      const ret = retAtEpisode(glie.agreeCurve, snap.episode);
      const cf = stage.querySelector('#sc11-conv-fill'); if (cf) cf.style.width = conv.toFixed(0) + '%';
      const cv = stage.querySelector('#sc11-conv'); if (cv) cv.textContent = conv.toFixed(0) + '%';
      const rv = stage.querySelector('#sc11-ret'); if (rv) rv.textContent = snap.episode > 0 ? (ret.toFixed(2) + ' / ' + dpRet.toFixed(2)) : '--';
      const epEl = stage.querySelector('#sc11-ep'); if (epEl) epEl.textContent = (snap.episode || 0).toLocaleString('en-US');
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
      applySnap(snapIdx + 1, false);
      playTimer = setTimeout(tick, 780);
    }
    function resetRun() {
      playing = false; if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      const b = stage.querySelector('.sc11-play'); if (b) { b.textContent = T('scene11.play'); b.classList.add('primary'); }
      applySnap(0, true);
    }

    function applyCursor() {
      if (cursor === 0) buildStep1(); else buildStep2();
      root.querySelector('.sc11-stepcount').textContent = T('scene11.step', { n: cursor + 1 });
      const nextBtn = root.querySelector('.sc11-next');
      nextBtn.textContent = cursor === 1 ? T('scene11.done') : T('scene11.next');
      root.querySelector('.sc11-back').disabled = cursor === 0;
    }
    root.querySelector('.sc11-next').addEventListener('click', () => { if (cursor < 1) { cursor = 1; applyCursor(); } else window.SBS && window.SBS.goTo(12); });
    root.querySelector('.sc11-back').addEventListener('click', () => { if (cursor > 0) { cursor = 0; applyCursor(); } });

    applyCursor();
    if (window.SBS && window.SBS.run) { cursor = 1; applyCursor(); setTimeout(() => applySnap(maxSnaps - 1, false), 200); }

    return {
      onEnter() { applyCursor(); },
      onLeave() { playing = false; if (playTimer) { clearTimeout(playTimer); playTimer = null; } },
      onNextKey() { if (cursor < 1) { cursor = 1; applyCursor(); return true; } return false; },
      onPrevKey() { if (cursor > 0) { cursor = 0; applyCursor(); return true; } return false; },
    };
  };
})();

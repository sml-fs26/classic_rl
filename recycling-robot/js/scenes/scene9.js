/* Scene 9, Dynamic programming / fill Q*, PROGRESSIVELY.
 *
 *   Because the drain probabilities are known, we compute Q* exactly by sweeping
 *   the Bellman backup. The single-column Q-table fills bottom-up IN TIME: start
 *   at the LAST step of the shift (k=1: pure one-step payoffs, where the safe +1
 *   WAIT wins at low/mid), then back up one step at a time, reusing the answers
 *   just locked in.
 *
 *   To keep the pacing slow and step-by-step (no big jumps, one idea at a time),
 *   each STEP locks exactly ONE rung of the current backup layer, bottom-up
 *   (low -> mid -> high -> full). Pending rungs are dimmed; the rung that just
 *   locked is outlined; a short single-line caption explains that one move. When
 *   all four rungs of a layer lock, the next STEP starts the next layer ("back
 *   up one step"). The board therefore fills cell by cell and the policy stripe
 *   (green SEARCH at the top, blue RECHARGE at the bottom) draws itself.
 *
 *   STEP / RUN LAYER / RUN ALL / RESET drive it; right-arrow advances one rung.
 *   &run auto-fills for headless capture. Values come straight from
 *   window.DATA.dp.frames (the asserted DP layers); nothing is hand-typed. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;
  const A = window.Levers.LEVER_IDS.length;            // 3
  const N = R.N;                                        // 4 playable rungs
  const frames = window.DATA.dp.frames;                // [{stepsRemaining, isLastStep, V, Q, policy}]
  const NF = frames.length;                            // 8

  /* Reveal order within a layer: low -> mid -> high -> full (bottom-up the gauge). */
  const REVEAL = [R.LOW, R.MID, R.HIGH, R.FULL];       // [1,2,3,4]
  /* Total micro-steps: for each layer, 4 rung-locks. */
  const TOTAL = NF * N;

  window.scenes.scene9 = function (root) {
    root.className = 'scene scene-pad sc9';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene9.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene9.lede') + '</p>' +
      '<div class="sc9-formula-card">' +
        '<div class="sc9-formula-label">' + T('scene9.formula.label') + '</div>' +
        '<div class="sc9-formula-tex"></div>' +
      '</div>' +
      '<div class="sc9-ctrls-row">' +
        '<div class="rr-btn-row sc9-ctrls">' +
          '<button class="rr-btn sc9-back" type="button">&lsaquo; ' + T('scene9.back') + '</button>' +
          '<button class="rr-btn primary sc9-step" type="button">' + T('scene9.step') + '</button>' +
          '<button class="rr-btn sc9-runlayer" type="button">' + T('scene9.runlayer') + '</button>' +
          '<button class="rr-btn sc9-runall" type="button">' + T('scene9.runall') + '</button>' +
          '<button class="rr-btn sc9-reset" type="button">' + T('scene9.reset') + '</button>' +
        '</div>' +
        '<div class="sc9-status">' +
          T('scene9.status.layer') + ' <b class="sc9-layer">--</b> &middot; ' +
          T('scene9.status.locked') + ' <b class="sc9-locked">0 / ' + N + '</b>' +
        '</div>' +
      '</div>' +
      '<div class="sc9-grid">' +
        '<div class="sc9-board-host"></div>' +
        '<div class="sc9-side">' +
          '<div class="poke-box sc9-narr"></div>' +
        '</div>' +
      '</div>' +
      '<p class="footnote">' + T('scene9.hint') + '</p>';

    window.Katex.render(window.DATA.tex.bellman, root.querySelector('.sc9-formula-tex'), true);

    const board = window.Gauge.mount(root.querySelector('.sc9-board-host'), { variant: 'qtable', showValues: true });
    const narr = root.querySelector('.sc9-narr');
    const layerEl = root.querySelector('.sc9-layer');
    const lockedEl = root.querySelector('.sc9-locked');

    /* cur = number of rung-locks applied so far, 0..TOTAL.
       layer index = floor((cur-1)/N) once cur>0; rungs locked IN the current
       layer = ((cur-1) % N) + 1. */
    let cur = 0;

    /* Build the Q array shown at micro-step `c`: the rungs already locked carry
       this layer's values; not-yet-locked rungs are 0 (render 'unsolved'). When
       a layer just completed (c is a multiple of N) every rung of that layer is
       shown. */
    function boardQ(c) {
      const Q = new Float64Array(N * A);   // all zero (unsolved)
      if (c <= 0) return Q;
      const layerIdx = Math.floor((c - 1) / N);          // 0..NF-1
      const lockedInLayer = ((c - 1) % N) + 1;            // 1..N
      const f = frames[layerIdx];
      for (let i = 0; i < lockedInLayer; i++) {
        const lv = REVEAL[i];
        const b = (lv - 1) * A;
        for (let a = 0; a < A; a++) {
          const v = f.Q[b + a];
          Q[b + a] = (v == null ? NaN : v);
        }
      }
      return Q;
    }

    function layerOf(c) { return c <= 0 ? -1 : Math.floor((c - 1) / N); }
    function lockedInLayer(c) { return c <= 0 ? 0 : ((c - 1) % N) + 1; }

    function paint(c, opts) {
      const o = opts || {};
      cur = Math.max(0, Math.min(TOTAL, c));
      const Q = boardQ(cur);
      board.update(Q, { suppressFlash: !!o.suppressFlash });

      const layerIdx = layerOf(cur);
      const inLayer = lockedInLayer(cur);

      /* Dim the rungs not yet locked in this layer; outline the one just locked. */
      for (let lv = 1; lv <= N; lv++) {
        const idx = REVEAL.indexOf(lv);
        const lockedThis = cur > 0 && idx < inLayer;
        board.setRungSolved(lv, cur === 0 ? false : lockedThis);
        board.highlightRung(lv, false);
      }
      if (cur > 0 && !o.suppressFlash) {
        const justLv = REVEAL[inLayer - 1];
        board.highlightRung(justLv, true);
        setTimeout(() => board && board.highlightRung(justLv, false), 760);
      }

      /* Status. */
      const k = layerIdx >= 0 ? frames[layerIdx].stepsRemaining : null;
      layerEl.textContent = (k == null) ? '--' : T('scene9.klabel', { k: k });
      lockedEl.textContent = (cur === 0 ? 0 : inLayer) + ' / ' + N;

      /* One short caption per micro-step. */
      narr.innerHTML = captionFor(cur);

      /* Buttons. */
      root.querySelector('.sc9-back').disabled = cur <= 0;
      root.querySelector('.sc9-step').disabled = cur >= TOTAL;
      root.querySelector('.sc9-runlayer').disabled = cur >= TOTAL;
    }

    /* The narration introduces ONE idea at a time, keyed to the (layer, rung)
       micro-step so nothing is dumped all at once. */
    function captionFor(c) {
      if (c <= 0) return T('scene9.cap.ready');
      const layerIdx = layerOf(c);                       // 0-based
      const f = frames[layerIdx];
      const k = f.stepsRemaining;
      const inLayer = lockedInLayer(c);                  // 1..N
      const lv = REVEAL[inLayer - 1];
      const rungName = T('level.' + R.LEVEL_NAMES[lv]);
      const lever = T('lever.' + f.policy[lv - 1]);
      const layerDone = inLayer === N;

      /* First layer (k=1, the last step) gets its own intro on the first rung. */
      if (layerIdx === 0) {
        if (inLayer === 1) return T('scene9.cap.k1.first', { rung: rungName, lever: lever });
        if (layerDone) return T('scene9.cap.k1.done');
        return T('scene9.cap.k1.rung', { rung: rungName, lever: lever });
      }
      /* Second layer (k=2): the first backup, where RECHARGE takes over. */
      if (layerIdx === 1) {
        if (inLayer === 1) return T('scene9.cap.k2.first');
        if (lv === R.LOW || lv === R.MID) return T('scene9.cap.k2.flip', { rung: rungName });
        if (layerDone) return T('scene9.cap.k2.done');
        return T('scene9.cap.k2.rung', { rung: rungName, lever: lever });
      }
      /* Final layer (k=N): the converged playbook. */
      if (layerIdx === NF - 1) {
        if (layerDone) return T('scene9.cap.final.done');
        if (lv === R.HIGH) return T('scene9.cap.final.seam');
        return T('scene9.cap.final.rung', { rung: rungName, lever: lever, k: k });
      }
      /* Middle layers: values grow, policy already stable. */
      if (inLayer === 1) return T('scene9.cap.mid.first', { k: k });
      return T('scene9.cap.mid.rung', { rung: rungName, lever: lever, k: k });
    }

    function step() { if (cur < TOTAL) paint(cur + 1); }
    function back() { if (cur > 0) paint(cur - 1, { suppressFlash: true }); }
    function runLayer() {
      /* Advance to the end of the current (or next) layer in one go. */
      if (cur >= TOTAL) return;
      const targetLayer = layerOf(cur + 1);
      const target = (targetLayer + 1) * N;
      paint(target, { suppressFlash: true });
    }
    function runAll() { paint(TOTAL, { suppressFlash: true }); }
    function reset() { paint(0, { suppressFlash: true }); }

    root.querySelector('.sc9-step').addEventListener('click', step);
    root.querySelector('.sc9-back').addEventListener('click', back);
    root.querySelector('.sc9-runlayer').addEventListener('click', runLayer);
    root.querySelector('.sc9-runall').addEventListener('click', runAll);
    root.querySelector('.sc9-reset').addEventListener('click', reset);

    paint(0, { suppressFlash: true });

    /* &s9step=N, jump to micro-step N (0..TOTAL) for headless capture / deep links. */
    const stepMatch = (window.location.hash || '').match(/[#&?]s9step=(\d+)/);
    if (stepMatch) {
      const tgt = Math.max(0, Math.min(TOTAL, parseInt(stepMatch[1], 10)));
      setTimeout(() => paint(tgt, { suppressFlash: true }), 60);
    } else if (window.RR && window.RR.run) {
      /* &run: auto-fill rung by rung for headless capture. */
      let c = 0;
      const tick = () => { paint(c); if (c < TOTAL) { c++; setTimeout(tick, 180); } };
      setTimeout(tick, 300);
    }

    return {
      onEnter() { paint(cur, { suppressFlash: true }); },
      onNextKey() { if (cur < TOTAL) { step(); return true; } return false; },
      onPrevKey() { if (cur > 0) { back(); return true; } return false; },
    };
  };
})();

/* Scene 11, SARSA vs Q-learning (model-free TD control), STEP BY STEP.
 *
 *   We LEARN the table from experience instead of computing it. A three-step
 *   pager keeps the pacing slow (one update / one frame per click):
 *
 *     STEP 1  DERIVE.  Bellman says a lever's value is an EXPECTATION over every
 *             way the drain could fall. With no drain model we replace that
 *             expectation with ONE observed sample. Two update rules:
 *               - on-policy SARSA bootstraps on the lever we ACTUALLY take next,
 *               - off-policy Q-learning bootstraps on the BEST next lever.
 *             The empty (rung x steps-left) table we are about to fill is shown.
 *
 *     STEP 2  ONE UPDATE AT A TIME.  Replay the first real updates of a
 *             Q-learning run, ONE per click. Each click shows the sampled tuple
 *             and q_was -> q_new, lights the (rung, steps-left) cell it touches,
 *             and the table fills in cell by cell. A closeness-to-Q* bar climbs.
 *
 *     STEP 3  THE LONG RUN.  Two boards (start-of-shift layer) fill from many
 *             such updates and converge toward the DP oracle, ONE training frame
 *             per click (then PLAY). Q-learning recovers the DP stripe exactly;
 *             on-policy SARSA, learning the value of the cautious rule it
 *             follows, PROTECTS at the marginal `high` rung. A return chart, a
 *             matches-DP indicator and a convergence bar track the climb.
 *
 *   All learning data is precomputed (deterministic), so nothing drifts: the
 *   trace + per-episode early snapshots + dense tail snapshots all come from
 *   window.DATA.learners (the rigor-gated training run). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;
  const LEVER_IDS = window.Levers.LEVER_IDS;           // [search, wait, recharge]
  const L = window.DATA.learners;
  const QL = L.qlearn, SR = L.sarsa;
  const DIMS = L.dims;                                 // {N, shift, A}
  const N = DIMS.N, SHIFT = DIMS.shift, A = DIMS.A;
  const REVEAL = [R.FULL, R.HIGH, R.MID, R.LOW];       // grid rows: full (top) .. low (bottom)

  /* k=8 (start-of-shift) DP oracle, as the 4x3 the gauge expects + as a full
     table for the coverage-grid closeness metric. */
  const QSTAR_K8 = Float64Array.from(window.DATA.Qstar, x => (x == null ? 0 : x));
  const DP_FULL = Float64Array.from(L.dpFull, x => (x == null ? 0 : x));
  let DP_FULL_L1 = 0; for (let i = 0; i < DP_FULL.length; i++) DP_FULL_L1 += Math.abs(DP_FULL[i]);
  if (DP_FULL_L1 === 0) DP_FULL_L1 = 1;
  let QSTAR_K8_L1 = 0; for (let i = 0; i < QSTAR_K8.length; i++) QSTAR_K8_L1 += Math.abs(QSTAR_K8[i]);
  if (QSTAR_K8_L1 === 0) QSTAR_K8_L1 = 1;

  function leverName(id) { return T('lever.' + id); }
  function fmtEp(e) { return e >= 1000 ? (Math.round(e / 1000) + 'k') : String(e); }
  function fmtQ(v) { return (v >= 0 ? '+' : '−') + Math.abs(Math.round(v * 100) / 100).toFixed(2); }

  /* Pull the k=8 layer (4*A) out of a full (rung x k x lever) table. */
  function k8FromFull(full) {
    const out = new Float64Array(N * A);
    for (let s = 0; s < N; s++) for (let a = 0; a < A; a++) out[s * A + a] = full[(s * SHIFT + (SHIFT - 1)) * A + a];
    return out;
  }
  /* Closeness in [0,100] of a learned table to a target (L1, normalised). */
  function closeness(Q, target, l1) {
    let dist = 0; for (let i = 0; i < Q.length; i++) dist += Math.abs(Q[i] - target[i]);
    return Math.max(0, Math.min(100, 100 * (1 - dist / l1)));
  }
  /* Policy agreement (argmax of the k=8 layer) vs the DP oracle, 0..N. */
  function agreementK8(k8) {
    let agree = 0;
    for (let s = 0; s < N; s++) {
      let best = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) { const v = k8[s * A + a]; if (Math.abs(v) > 1e-9) allZero = false; if (v > best) { best = v; k = a; } }
      let dBest = -Infinity, dk = 0;
      for (let a = 0; a < A; a++) { const v = QSTAR_K8[s * A + a]; if (v > dBest) { dBest = v; dk = a; } }
      if (!allZero && k === dk) agree++;
    }
    return agree;
  }

  /* ============================================================ */
  window.scenes.scene11 = function (root) {
    root.className = 'scene scene-pad sc11';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene11.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene11.lede') + '</p>' +
      '<div class="sc11-pager">' +
        '<button class="rr-btn sc11-prev" type="button">&lsaquo; ' + T('scene11.prev') + '</button>' +
        '<button class="rr-btn sc11-next" type="button">' + T('scene11.next') + ' &rsaquo;</button>' +
        '<button class="rr-btn sc11-reset" type="button">' + T('scene11.reset') + '</button>' +
        '<span class="sc11-pstatus"></span>' +
      '</div>' +
      '<div class="sc11-body"></div>' +
      '<p class="footnote">' + T('scene11.hint') + '</p>';

    const body = root.querySelector('.sc11-body');
    const pstatus = root.querySelector('.sc11-pstatus');

    /*, a compact (rung x steps-left) coverage grid: 4 rows x SHIFT cols.
       Each cell shows the best-lever tint + best value; .pending until touched,
       .just-hit flashes the cell an update lands on. Returns a handle., */
    function buildGrid(host, opts) {
      const o = opts || {};
      host.classList.add('sc11-grid');
      host.innerHTML = '';
      const head = document.createElement('div');
      head.className = 'sc11-grid-head';
      head.innerHTML =
        '<div class="sc11-grid-corner">' + T('scene11.grid.corner') + '</div>' +
        Array.from({ length: SHIFT }, (_v, i) => '<div class="sc11-grid-kh' + ((SHIFT - i) === SHIFT ? ' k8' : '') + '">' + (SHIFT - i) + '</div>').join('');
      host.appendChild(head);
      const cells = {};   // (lv,k) -> el
      for (const lv of REVEAL) {
        const rowEl = document.createElement('div');
        rowEl.className = 'sc11-grid-row';
        const lab = document.createElement('div');
        lab.className = 'sc11-grid-rlab';
        lab.textContent = T('level.' + R.LEVEL_NAMES[lv]);
        rowEl.appendChild(lab);
        for (let k = SHIFT; k >= 1; k--) {
          const c = document.createElement('div');
          c.className = 'sc11-grid-cell pending' + (k === SHIFT ? ' k8col' : '');
          c.innerHTML = '<span class="sc11-gc-val"></span>';
          rowEl.appendChild(c);
          cells[lv + ':' + k] = c;
        }
        host.appendChild(rowEl);
      }
      const legend = document.createElement('div');
      legend.className = 'sc11-grid-legend';
      legend.innerHTML =
        LEVER_IDS.map(id => '<span class="rr-legend-item"><span class="rr-legend-swatch lever-fill-' + id + '"></span>' + leverName(id) + '</span>').join('') +
        '<span class="sc11-grid-note">' + T('scene11.grid.kcol') + '</span>';
      host.appendChild(legend);

      function paint(full, hit) {
        for (const lv of REVEAL) {
          for (let k = SHIFT; k >= 1; k--) {
            const b = ((lv - 1) * SHIFT + (k - 1)) * A;
            let best = -Infinity, bk = -1, allZero = true;
            for (let a = 0; a < A; a++) { const v = full[b + a]; if (Math.abs(v) > 1e-9) allZero = false; if (v > best) { best = v; bk = a; } }
            const c = cells[lv + ':' + k];
            c.classList.remove('tint-search', 'tint-wait', 'tint-recharge', 'just-hit');
            if (allZero || bk < 0) {
              c.classList.add('pending');
              c.querySelector('.sc11-gc-val').textContent = '';
            } else {
              c.classList.remove('pending');
              c.classList.add('tint-' + LEVER_IDS[bk]);
              c.querySelector('.sc11-gc-val').textContent = (Math.round(best * 10) / 10).toFixed(1);
            }
          }
        }
        if (hit) {
          const c = cells[hit.lv + ':' + hit.k];
          if (c) { c.classList.add('just-hit'); setTimeout(() => c && c.classList.remove('just-hit'), 620); }
        }
      }
      return { paint, host };
    }

    /* small helper: a closeness bar. */
    function barHTML(label, pct) {
      return '<div class="sc11-meter">' +
        '<span class="sc11-meter-label">' + label + '</span>' +
        '<span class="sc11-bar"><span class="sc11-bar-fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
        '<span class="sc11-meter-val">' + pct.toFixed(0) + '%</span>' +
      '</div>';
    }

    /* ============================================================
       STEP 1, derive the two updates
       ============================================================ */
    function renderStep1() {
      body.innerHTML =
        '<div class="sc11-row">' +
          '<div class="sc11-col-left">' +
            '<div class="sc11-tag">' + T('scene11.s1.tag') + '</div>' +
            '<div class="sc11-lead">' + T('scene11.s1.lead') + '</div>' +
            '<div class="formula-card sc11-fcard">' +
              '<div class="sc11-fcap">' + T('scene11.s1.bellmanCap') + '</div>' +
              '<div class="sc11-tex" data-tex="bellman"></div>' +
            '</div>' +
            '<div class="formula-card sc11-fcard sc11-fcard-ql">' +
              '<div class="sc11-fcap">' + T('scene11.f.ql') + '</div>' +
              '<div class="sc11-tex" data-tex="qlearning"></div>' +
            '</div>' +
            '<div class="formula-card sc11-fcard sc11-fcard-sarsa">' +
              '<div class="sc11-fcap">' + T('scene11.f.sarsa') + '</div>' +
              '<div class="sc11-tex" data-tex="sarsa"></div>' +
            '</div>' +
            '<div class="sc11-foot">' + T('scene11.s1.foot') + '</div>' +
          '</div>' +
          '<div class="sc11-col-right">' +
            '<div class="sc11-rcap">' + T('scene11.s1.rcap') + '</div>' +
            '<div class="sc11-grid-host"></div>' +
          '</div>' +
        '</div>';
      renderTex(body);
      const grid = buildGrid(body.querySelector('.sc11-grid-host'));
      grid.paint(new Float64Array(N * SHIFT * A), null);   // empty
    }

    function renderTex(scope) {
      scope.querySelectorAll('.sc11-tex[data-tex]').forEach((el) => {
        window.Katex.render(window.DATA.tex[el.getAttribute('data-tex')], el, true);
      });
    }

    /* ============================================================
       STEP 2, one update at a time (replay the Q-learning trace)
       ============================================================ */
    const trace = QL.trace;                              // first updates, in order
    const earlyQL = QL.earlySnaps;                       // [{episode, full}]
    let s2cursor = 0;                                    // 0 = nothing applied, 1..trace.length

    /* Cumulative table after applying the first `n` trace updates: rebuild from
       qBefore/qAfter of each recorded update (deterministic). */
    function s2TableAfter(n) {
      const Q = new Float64Array(N * SHIFT * A);
      for (let i = 0; i < n; i++) {
        const u = trace[i];
        const cell = ((u.lvl - 1) * SHIFT + (u.k - 1)) * A + u.leverIdx;
        Q[cell] = u.qAfter;
      }
      return Q;
    }

    function renderStep2() {
      body.innerHTML =
        '<div class="sc11-row">' +
          '<div class="sc11-col-left">' +
            '<div class="sc11-tag">' + T('scene11.s2.tag') + '</div>' +
            '<div class="sc11-lead">' + T('scene11.s2.lead') + '</div>' +
            '<div class="sc11-update-ctrls rr-btn-row">' +
              '<button class="rr-btn sc11-u-back" type="button">&lsaquo; ' + T('scene11.back') + '</button>' +
              '<button class="rr-btn primary sc11-u-step" type="button">' + T('scene11.s2.apply') + '</button>' +
              '<button class="rr-btn sc11-u-run" type="button">' + T('scene11.s2.run') + '</button>' +
            '</div>' +
            '<div class="sc11-update-detail poke-box"></div>' +
            '<div class="sc11-foot">' + T('scene11.s2.foot') + '</div>' +
          '</div>' +
          '<div class="sc11-col-right">' +
            '<div class="sc11-rcap">' + T('scene11.s2.rcap') + '</div>' +
            '<div class="sc11-grid-host"></div>' +
            '<div class="sc11-meters sc11-meters2"></div>' +
          '</div>' +
        '</div>';
      const grid = buildGrid(body.querySelector('.sc11-grid-host'));
      const detail = body.querySelector('.sc11-update-detail');
      const meters = body.querySelector('.sc11-meters2');

      function paintS2() {
        const Q = s2TableAfter(s2cursor);
        const hit = s2cursor > 0 ? { lv: trace[s2cursor - 1].lvl, k: trace[s2cursor - 1].k } : null;
        grid.paint(Q, hit);
        renderS2Detail(detail);
        meters.innerHTML = barHTML(T('scene11.s2.closeness'), closeness(Q, DP_FULL, DP_FULL_L1));
        body.querySelector('.sc11-u-back').disabled = s2cursor <= 0;
        body.querySelector('.sc11-u-step').disabled = s2cursor >= trace.length;
        body.querySelector('.sc11-u-run').disabled = s2cursor >= trace.length;
        pstatus.textContent = T('scene11.s2.counter', { i: s2cursor, n: trace.length });
      }
      function renderS2Detail(host) {
        if (s2cursor <= 0) { host.innerHTML = T('scene11.s2.detailReady'); return; }
        const u = trace[s2cursor - 1];
        const rung = T('level.' + R.LEVEL_NAMES[u.lvl]);
        const lever = leverName(LEVER_IDS[u.leverIdx]);
        const tdErr = (u.qAfter - u.qBefore);
        const alpha = u.alpha != null ? u.alpha : null;
        let sLine, target;
        if (u.terminal) {
          sLine = T('scene11.s2.sTerm');
          target = T('scene11.s2.targetTerm', { r: fmtQ(u.r) });
        } else {
          const snRung = T('level.' + R.LEVEL_NAMES[u.sNextLvl]);
          sLine = T('scene11.s2.sNext', { rung: snRung, k: u.kNext });
          target = T('scene11.s2.targetBoot', { r: fmtQ(u.r) });
        }
        host.innerHTML =
          '<div class="sc11-ud-title">' + T('scene11.s2.updateOf', { i: s2cursor, n: trace.length }) + '</div>' +
          '<div class="sc11-ud-rows">' +
            '<div class="sc11-ud-row"><span class="sc11-ud-k">' + T('scene11.s2.lblWhere') + '</span>' +
              '<span class="lever-tag" data-lever="' + LEVER_IDS[u.leverIdx] + '">' + lever + '</span> @ <b>' + rung + '</b>, ' + T('scene11.s2.kleft', { k: u.k }) + '</div>' +
            '<div class="sc11-ud-row"><span class="sc11-ud-k">' + T('scene11.s2.lblReward') + '</span> <b>' + fmtQ(u.r) + '</b></div>' +
            '<div class="sc11-ud-row"><span class="sc11-ud-k">' + T('scene11.s2.lblNext') + '</span> ' + sLine + '</div>' +
            '<div class="sc11-ud-row"><span class="sc11-ud-k">' + T('scene11.s2.lblTarget') + '</span> ' + target + '</div>' +
            '<div class="sc11-ud-div"></div>' +
            '<div class="sc11-ud-row"><span class="sc11-ud-k">' + T('scene11.s2.lblWas') + '</span> <b>' + fmtQ(u.qBefore) + '</b>' +
              ' &rarr; <b class="sc11-ud-new">' + fmtQ(u.qAfter) + '</b>' +
              ' <span class="sc11-ud-td">(' + (tdErr >= 0 ? '+' : '−') + Math.abs(Math.round(tdErr * 100) / 100).toFixed(2) +
              (alpha != null ? ' × α=' + alpha.toFixed(2) : '') + ')</span></div>' +
          '</div>';
      }

      body.querySelector('.sc11-u-step').addEventListener('click', () => { if (s2cursor < trace.length) { s2cursor++; paintS2(); } });
      body.querySelector('.sc11-u-back').addEventListener('click', () => { if (s2cursor > 0) { s2cursor--; paintS2(); } });
      body.querySelector('.sc11-u-run').addEventListener('click', () => {
        let i = s2cursor;
        const tick = () => { if (i < trace.length) { i++; s2cursor = i; paintS2(); setTimeout(tick, 360); } };
        tick();
      });
      paintS2();
    }

    /* ============================================================
       STEP 3, the long run: both boards converge to the oracle
       ============================================================ */
    /* A unified frame TIMELINE: per-episode early snapshots (gradual) then the
       dense tail snapshots (the long convergence). Each frame carries the k=8
       layer for BOTH learners. */
    const FRAMES = (function buildFrames() {
      const frames = [];
      const seen = new Set();
      /* early phase: per-episode (both learners share the same episode list). */
      for (let i = 0; i < earlyQL.length; i++) {
        const ep = earlyQL[i].episode;
        frames.push({ episode: ep, ql: k8FromFull(Float64Array.from(QL.earlySnaps[i].full)),
          sr: k8FromFull(Float64Array.from(SR.earlySnaps[i].full)) });
        seen.add(ep);
      }
      /* tail phase: the coarse snapshots beyond the early window. */
      for (let i = 0; i < QL.snapshots.length; i++) {
        const ep = QL.snapshots[i].episode;
        if (seen.has(ep)) continue;
        frames.push({ episode: ep, ql: Float64Array.from(QL.snapshots[i].k8, x => (x == null ? 0 : x)),
          sr: Float64Array.from(SR.snapshots[i].k8, x => (x == null ? 0 : x)) });
        seen.add(ep);
      }
      frames.sort((a, b) => a.episode - b.episode);
      return frames;
    })();
    const NFR = FRAMES.length;
    let s3cursor = 0;        // 0..NFR-1
    let s3playing = false;
    let s3timer = null;

    function renderStep3() {
      body.innerHTML =
        '<div class="formula-card sc11-formula">' +
          '<div class="sc11-frow"><div class="sc11-flab">' + T('scene11.f.sarsa') + '</div><div class="sc11-tex" data-tex="sarsa"></div></div>' +
          '<div class="sc11-frow"><div class="sc11-flab">' + T('scene11.f.ql') + '</div><div class="sc11-tex" data-tex="qlearning"></div></div>' +
        '</div>' +
        '<div class="sc11-boards">' +
          '<div class="sc11-board"><div class="sc11-board-h sc11-h-sarsa">' + T('scene11.sarsa.h') + '</div><div class="sc11-sarsa-host"></div><div class="sc11-board-foot sc11-sarsa-foot"></div></div>' +
          '<div class="sc11-board"><div class="sc11-board-h sc11-h-ql">' + T('scene11.ql.h') + '</div><div class="sc11-ql-host"></div><div class="sc11-board-foot sc11-ql-foot"></div></div>' +
          '<div class="sc11-board"><div class="sc11-board-h sc11-h-dp">' + T('scene11.dp.h') + '</div><div class="sc11-dp-host"></div><div class="sc11-board-foot sc11-dp-foot">' + T('scene11.dp.foot') + '</div></div>' +
        '</div>' +
        '<div class="sc11-controls">' +
          '<div class="sc11-scrub">' +
            '<button class="rr-btn sc11-f-back" type="button">&lsaquo;</button>' +
            '<button class="rr-btn primary sc11-play" type="button">' + T('scene11.play') + '</button>' +
            '<button class="rr-btn sc11-f-step" type="button">' + T('scene11.s3.frame') + ' &rsaquo;</button>' +
            '<input type="range" class="sc11-range" min="0" max="' + (NFR - 1) + '" value="0" step="1" aria-label="training timeline">' +
            '<span class="sc11-ep">ep 0</span>' +
          '</div>' +
          '<div class="sc11-chart-host card"></div>' +
        '</div>' +
        '<div class="poke-box sc11-verdict"></div>';
      renderTex(body);

      const sarsaBoard = window.Gauge.mount(body.querySelector('.sc11-sarsa-host'), { variant: 'qtable', showValues: false, legend: false });
      const qlBoard = window.Gauge.mount(body.querySelector('.sc11-ql-host'), { variant: 'qtable', showValues: false, legend: false });
      const dpBoard = window.Gauge.mount(body.querySelector('.sc11-dp-host'), { variant: 'qtable', showValues: false, legend: false });
      const dpByLevel = {};
      for (let lv = 1; lv <= N; lv++) dpByLevel[lv] = window.DATA.policy[lv - 1];
      dpBoard.paintPolicy(dpByLevel);

      const range = body.querySelector('.sc11-range');
      const epEl = body.querySelector('.sc11-ep');
      const verdict = body.querySelector('.sc11-verdict');
      const chartHost = body.querySelector('.sc11-chart-host');
      const sarsaFoot = body.querySelector('.sc11-sarsa-foot');
      const qlFoot = body.querySelector('.sc11-ql-foot');

      function paintFrame(i) {
        s3cursor = Math.max(0, Math.min(NFR - 1, i));
        const fr = FRAMES[s3cursor];
        qlBoard.update(fr.ql, { suppressFlash: s3cursor === 0 });
        sarsaBoard.update(fr.sr, { suppressFlash: s3cursor === 0 });
        range.value = String(s3cursor);
        epEl.textContent = 'ep ' + fmtEp(fr.episode);
        const qlAgree = agreementK8(fr.ql), srAgree = agreementK8(fr.sr);
        qlFoot.innerHTML = T('scene11.s3.matches', { n: qlAgree, total: N });
        sarsaFoot.innerHTML = T('scene11.s3.matches', { n: srAgree, total: N });
        qlFoot.classList.toggle('full', qlAgree === N);
        sarsaFoot.classList.toggle('full', srAgree === N);
        drawChart(chartHost, fr.episode);
        pstatus.textContent = T('scene11.s3.counter', { ep: fmtEp(fr.episode), i: s3cursor + 1, n: NFR });
        if (s3cursor >= NFR - 1) {
          verdict.innerHTML = T('scene11.verdict.done', {
            sarsaHigh: leverName(SR.stats.cautiousHighLever),
            qlRet: QL.stats.finalRet.toFixed(1), opt: L.optimalStartValue.toFixed(1),
          });
        } else if (fr.episode === 0) {
          verdict.innerHTML = T('scene11.verdict.start');
        } else {
          verdict.innerHTML = T('scene11.verdict.learning', { ep: fmtEp(fr.episode) });
        }
        body.querySelector('.sc11-f-back').disabled = s3cursor <= 0;
        body.querySelector('.sc11-f-step').disabled = s3cursor >= NFR - 1;
      }

      function drawChart(host, upToEp) {
        const W = 460, H = 150, padL = 40, padB = 26, padT = 12, padR = 10;
        const plotW = W - padL - padR, plotH = H - padT - padB;
        const qc = QL.returnCurve, sc = SR.returnCurve;
        const maxEp = qc[qc.length - 1].episode || 1;
        const opt = L.optimalStartValue;
        const allRets = qc.concat(sc).map(p => p.ret).concat([opt]);
        const maxR = Math.max.apply(null, allRets);
        const minR = Math.min.apply(null, allRets.concat([0]));
        const rspan = (maxR - minR) || 1;
        function x(ep) { return padL + (ep / maxEp) * plotW; }
        function y(r) { return padT + plotH - ((r - minR) / rspan) * plotH; }
        function pathFor(curve) {
          let d = '';
          for (const p of curve) { if (p.episode > upToEp) break; d += (d ? ' L' : 'M') + x(p.episode).toFixed(1) + ' ' + y(p.ret).toFixed(1); }
          return d;
        }
        let svg = '<svg class="sc11-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
        svg += '<line class="sc11-opt" x1="' + padL + '" y1="' + y(opt).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(opt).toFixed(1) + '"/>';
        svg += '<text class="sc11-opt-lab" x="' + (W - padR) + '" y="' + (y(opt) - 4).toFixed(1) + '">DP ' + opt.toFixed(1) + '</text>';
        svg += '<line class="sc11-axis" x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '"/>';
        svg += '<path class="sc11-line-ql" d="' + pathFor(qc) + '"/>';
        svg += '<path class="sc11-line-sarsa" d="' + pathFor(sc) + '"/>';
        svg += '<text class="sc11-axis-lab" x="' + padL + '" y="' + (padT + plotH + 16) + '">0</text>';
        svg += '<text class="sc11-axis-lab" x="' + (W - padR) + '" y="' + (padT + plotH + 16) + '" text-anchor="end">' + fmtEp(maxEp) + ' eps</text>';
        svg += '<text class="sc11-axis-yt" x="6" y="' + (padT + 8) + '">return</text>';
        svg += '</svg>';
        host.innerHTML = svg;
      }

      function stopPlay() { if (s3timer) { clearTimeout(s3timer); s3timer = null; } s3playing = false; const b = body.querySelector('.sc11-play'); if (b) b.textContent = T('scene11.play'); }
      function tick() {
        s3timer = setTimeout(() => {
          s3timer = null; if (!s3playing) return;
          if (s3cursor < NFR - 1) { paintFrame(s3cursor + 1); tick(); } else stopPlay();
        }, 420);
      }
      function startPlay() { if (s3playing) return; if (s3cursor >= NFR - 1) paintFrame(0); s3playing = true; const b = body.querySelector('.sc11-play'); if (b) b.textContent = T('scene11.pause'); tick(); }

      body.querySelector('.sc11-play').addEventListener('click', () => { if (s3playing) stopPlay(); else startPlay(); });
      body.querySelector('.sc11-f-step').addEventListener('click', () => { stopPlay(); if (s3cursor < NFR - 1) paintFrame(s3cursor + 1); });
      body.querySelector('.sc11-f-back').addEventListener('click', () => { stopPlay(); if (s3cursor > 0) paintFrame(s3cursor - 1); });
      range.addEventListener('input', () => { stopPlay(); paintFrame(parseInt(range.value, 10)); });

      s3stop = stopPlay;
      paintFrame(s3cursor);

      if (window.RR && window.RR.run) { setTimeout(() => paintFrame(NFR - 1), 200); }
    }
    let s3stop = function () {};

    /* ============================================================
       Pager
       ============================================================ */
    const STEPS = [renderStep1, renderStep2, renderStep3];
    let cursor = 0;
    function applyCursor() {
      s3stop();
      cursor = Math.max(0, Math.min(STEPS.length - 1, cursor));
      root.querySelector('.sc11-prev').disabled = cursor === 0;
      root.querySelector('.sc11-next').disabled = cursor === STEPS.length - 1;
      STEPS[cursor]();
      if (cursor === 0) pstatus.textContent = T('scene11.s1.counter');
    }

    root.querySelector('.sc11-prev').addEventListener('click', () => { if (cursor > 0) { cursor--; applyCursor(); } });
    root.querySelector('.sc11-next').addEventListener('click', () => { if (cursor < STEPS.length - 1) { cursor++; applyCursor(); } });
    root.querySelector('.sc11-reset').addEventListener('click', () => { s2cursor = 0; s3cursor = 0; cursor = 0; applyCursor(); });

    applyCursor();

    /* &s2u=N, preset the per-update cursor (step 2) for headless capture. */
    const uMatch = (window.location.hash || '').match(/[#&?]s2u=(\d+)/);
    if (uMatch) s2cursor = Math.max(0, Math.min(trace.length, parseInt(uMatch[1], 10)));
    /* &s3f=N, preset the long-run timeline frame (step 3) for headless capture. */
    const fMatch = (window.location.hash || '').match(/[#&?]s3f=(\d+)/);
    if (fMatch) s3cursor = Math.max(0, Math.min(NFR - 1, parseInt(fMatch[1], 10)));

    /* &s11step=N, jump to a pager step (1-indexed) for headless capture. */
    const stepMatch = (window.location.hash || '').match(/[#&?]s11step=(\d+)/);
    if (stepMatch) {
      const tgt = Math.min(STEPS.length, Math.max(1, parseInt(stepMatch[1], 10))) - 1;
      setTimeout(() => { cursor = tgt; applyCursor(); }, 60);
    }
    /* &run, jump to the long run (step 3), which auto-advances to the end. */
    if (window.RR && window.RR.run) { setTimeout(() => { cursor = STEPS.length - 1; applyCursor(); }, 100); }

    return {
      onEnter() { applyCursor(); },
      onLeave() { s3stop(); },
      onNextKey() { if (cursor < STEPS.length - 1) { cursor++; applyCursor(); return true; } return false; },
      onPrevKey() { if (cursor > 0) { cursor--; applyCursor(); return true; } return false; },
    };
  };
})();

/* Scene 11 -- SARSA vs Q-learning (model-free TD control).
 *   We LEARN the table from experience instead of computing it. Derive the
 *   update from Bellman by replacing the expectation with one observed sample.
 *   Two update rules run on the SAME kind of experience, both with no drain
 *   model, both with epsilon to keep exploring:
 *
 *     - Off-policy Q-LEARNING bootstraps on the BEST next lever and CONVERGES TO
 *       THE DP ORACLE exactly (green top, blue bottom). == DP.
 *     - On-policy SARSA bootstraps on the ACTUAL next lever, learns the value of
 *       the cautious eps-soft rule it follows, and PROTECTS at the marginal
 *       `high` rung instead of taking the bold SEARCH. More conservative.
 *
 *   Two gauge boards fill in as we scrub through training snapshots; a
 *   return-from-full convergence chart tracks both toward V*_N(full); the DP
 *   oracle policy is pinned for reference. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;
  const L = window.DATA.learners;
  const QL = L.qlearn, SR = L.sarsa;
  const SNAPS = QL.snapshots.length;     // both have the same schedule

  window.scenes.scene11 = function (root) {
    root.className = 'scene scene-pad sc11';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene11.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene11.lede') + '</p>' +
      '<div class="formula-card sc11-formula">' +
        '<div class="sc11-frow"><div class="sc11-flab">' + T('scene11.f.sarsa') + '</div><div class="sc11-tex-sarsa"></div></div>' +
        '<div class="sc11-frow"><div class="sc11-flab">' + T('scene11.f.ql') + '</div><div class="sc11-tex-ql"></div></div>' +
      '</div>' +
      '<div class="sc11-boards">' +
        '<div class="sc11-board"><div class="sc11-board-h sc11-h-sarsa">' + T('scene11.sarsa.h') + '</div><div class="sc11-sarsa-host"></div></div>' +
        '<div class="sc11-board"><div class="sc11-board-h sc11-h-ql">' + T('scene11.ql.h') + '</div><div class="sc11-ql-host"></div></div>' +
        '<div class="sc11-board"><div class="sc11-board-h sc11-h-dp">' + T('scene11.dp.h') + '</div><div class="sc11-dp-host"></div></div>' +
      '</div>' +
      '<div class="sc11-controls">' +
        '<div class="sc11-scrub">' +
          '<span class="sc11-ep">ep 0</span>' +
          '<input type="range" class="sc11-range" min="0" max="' + (SNAPS - 1) + '" value="0" step="1" aria-label="training episodes">' +
          '<button class="rr-btn primary sc11-play" type="button">' + T('scene11.play') + '</button>' +
        '</div>' +
        '<div class="sc11-chart-host card"></div>' +
      '</div>' +
      '<div class="poke-box sc11-verdict"></div>' +
      '<p class="footnote">' + T('scene11.hint') + '</p>';

    window.Katex.render(window.DATA.tex.sarsa, root.querySelector('.sc11-tex-sarsa'), false);
    window.Katex.render(window.DATA.tex.qlearning, root.querySelector('.sc11-tex-ql'), false);

    const sarsaBoard = window.Gauge.mount(root.querySelector('.sc11-sarsa-host'), { variant: 'qtable', showValues: false, legend: false });
    const qlBoard = window.Gauge.mount(root.querySelector('.sc11-ql-host'), { variant: 'qtable', showValues: false, legend: false });
    const dpBoard = window.Gauge.mount(root.querySelector('.sc11-dp-host'), { variant: 'qtable', showValues: false, legend: false });

    /* DP oracle is fixed: paint from the converged policy (level-1 order). */
    const dpPolicy = window.DATA.policy;   // [low,mid,high,full]
    const dpByLevel = {};
    for (let lv = 1; lv <= R.N; lv++) dpByLevel[lv] = dpPolicy[lv - 1];
    dpBoard.paintPolicy(dpByLevel);

    const range = root.querySelector('.sc11-range');
    const epEl = root.querySelector('.sc11-ep');
    const verdict = root.querySelector('.sc11-verdict');

    function paintSnap(i) {
      const ii = Math.max(0, Math.min(SNAPS - 1, i));
      const ql = QL.snapshots[ii], sr = SR.snapshots[ii];
      qlBoard.update(Float64Array.from(ql.k8, x => (x == null ? NaN : x)), { suppressFlash: ii === 0 });
      sarsaBoard.update(Float64Array.from(sr.k8, x => (x == null ? NaN : x)), { suppressFlash: ii === 0 });
      range.value = String(ii);
      epEl.textContent = 'ep ' + fmtEp(ql.episode);
      drawChart(chartHost, ii);
      if (ii >= SNAPS - 1) {
        verdict.innerHTML = T('scene11.verdict.done', {
          sarsaHigh: T('lever.' + SR.stats.cautiousHighLever),
          qlRet: QL.stats.finalRet.toFixed(1),
          opt: L.optimalStartValue.toFixed(1),
        });
      } else {
        verdict.innerHTML = T('scene11.verdict.learning');
      }
    }
    function fmtEp(e) { return e >= 1000 ? (Math.round(e / 1000) + 'k') : String(e); }

    const chartHost = root.querySelector('.sc11-chart-host');
    function drawChart(host, uptoIdx) {
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
      const upToEp = QL.snapshots[uptoIdx].episode;
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

    root.querySelector('.sc11-play').addEventListener('click', () => {
      let i = 0;
      const tick = () => { paintSnap(i); if (i < SNAPS - 1) { i++; setTimeout(tick, 520); } };
      tick();
    });
    range.addEventListener('input', () => paintSnap(parseInt(range.value, 10)));

    paintSnap(0);
    if (window.RR && window.RR.run) {
      let i = 0; const tick = () => { paintSnap(i); if (i < SNAPS - 1) { i++; setTimeout(tick, 280); } };
      setTimeout(tick, 300);
    }

    return {
      onNextKey() { const i = parseInt(range.value, 10); if (i < SNAPS - 1) { paintSnap(i + 1); return true; } return false; },
      onPrevKey() { const i = parseInt(range.value, 10); if (i > 0) { paintSnap(i - 1); return true; } return false; },
    };
  };
})();

/* Scene 6 -- Return G_t.
 *   The return is the payoff summed from a point onward. Fix one situation and
 *   one chosen lever (start MID, force SEARCH), run many times, and stack the
 *   returns into a histogram. The shape is the lesson: a cluster near +14/+15
 *   AND a fat, scary spike at -8 about 30% of the time. The average (~7.7)
 *   hides a one-in-three disaster. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene6 = function (root) {
    root.className = 'scene scene-pad sc6 concept-scene';
    const hist = window.DATA.returnHist;
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene6.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene6.lede') + '</p>' +
      '<div class="formula-card sc6-formula"><div class="formula-label">' + T('scene6.flabel') + '</div><div class="sc6-tex"></div></div>' +
      '<div class="sc6-grid">' +
        '<div class="sc6-chart-host card"></div>' +
        '<div class="sc6-side">' +
          '<div class="poke-box sc6-stats">' +
            '<div class="sc6-stat"><span class="sc6-stat-lab">' + T('scene6.mean') + '</span><span class="sc6-stat-val">' + hist.mean.toFixed(2) + '</span></div>' +
            '<div class="sc6-stat"><span class="sc6-stat-lab">' + T('scene6.strand') + '</span><span class="sc6-stat-val neg">' + Math.round(hist.strandProb * 100) + '%</span></div>' +
          '</div>' +
          '<div class="poke-box sc6-say">' + T('scene6.say') + '</div>' +
        '</div>' +
      '</div>' +
      '<p class="footnote">' + T('scene6.hint') + '</p>';

    window.Katex.render(window.DATA.tex.return, root.querySelector('.sc6-tex'), true);
    drawHistogram(root.querySelector('.sc6-chart-host'), hist);

    return { onNextKey() { return false; }, onPrevKey() { return false; } };
  };

  function drawHistogram(host, hist) {
    /* Group bars into a few bins for legibility but keep -8 and +14/+15 distinct. */
    const bars = hist.bars.slice().sort((a, b) => a.ret - b.ret);
    const W = 520, H = 240, padL = 44, padB = 40, padT = 14, padR = 14;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxP = Math.max.apply(null, bars.map(b => b.prob));
    const minRet = Math.min.apply(null, bars.map(b => b.ret));
    const maxRet = Math.max.apply(null, bars.map(b => b.ret));
    const span = (maxRet - minRet) || 1;
    function x(ret) { return padL + ((ret - minRet) / span) * plotW; }
    function barW() { return Math.max(16, plotW / (span + 2)); }
    function y(p) { return padT + plotH - (p / maxP) * plotH; }

    let svg = '<svg class="sc6-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    /* zero axis line */
    const x0 = x(0);
    svg += '<line class="sc6-axis" x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '"/>';
    if (minRet < 0 && maxRet > 0) svg += '<line class="sc6-zero" x1="' + x0 + '" y1="' + padT + '" x2="' + x0 + '" y2="' + (padT + plotH) + '"/>';
    /* bars */
    for (const b of bars) {
      const bw = barW();
      const bx = x(b.ret) - bw / 2;
      const by = y(b.prob);
      const bh = (padT + plotH) - by;
      const cls = b.ret < 0 ? 'sc6-bar neg' : 'sc6-bar pos';
      svg += '<rect class="' + cls + '" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(bh, 1).toFixed(1) + '"/>';
      svg += '<text class="sc6-bar-lab" x="' + x(b.ret).toFixed(1) + '" y="' + (padT + plotH + 14) + '">' + (b.ret >= 0 ? '+' + b.ret : b.ret) + '</text>';
      svg += '<text class="sc6-bar-pct" x="' + x(b.ret).toFixed(1) + '" y="' + (by - 4).toFixed(1) + '">' + Math.round(b.prob * 100) + '%</text>';
    }
    svg += '<text class="sc6-axis-title" x="' + (padL + plotW / 2) + '" y="' + (H - 6) + '">return G (trash over the shift)</text>';
    svg += '</svg>';
    host.innerHTML = svg;
  }
})();

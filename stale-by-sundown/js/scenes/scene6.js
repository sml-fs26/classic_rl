/* Scene 6 -- Return G_t. Define the payoff-over-time G_i = sum gamma^(j-i) r_j,
   "everything you bank from here to closing, later money discounted." Then fix
   the SAME start (2, FRESH) and the SAME first lever, replay 20,000 days, and
   draw the HISTOGRAM of returns: HOLD-first mean ~5.8 but wide (down to -1.2);
   DISCOUNT-first mean ~4.5, tight; DUMP-first ~1.3, locked. One action does not
   give one payoff; it gives a DISTRIBUTION. Reads DATA.returnDist. Cold-entry
   safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const RD = D.returnDist || {};
  const SERIES = [
    { key: 'hold', lever: 'HOLD', cls: 'lev-hold' },
    { key: 'discount', lever: 'DISCOUNT', cls: 'lev-discount' },
    { key: 'dump', lever: 'DUMP', cls: 'lev-dump' },
  ];

  function histSvg(rd, cls) {
    if (!rd || !rd.hist) return '';
    const hist = rd.hist, lo = rd.histLo, hi = rd.histHi, BINS = hist.length;
    const W = 280, H = 96, padB = 14, padL = 4;
    const maxC = Math.max.apply(null, hist) || 1;
    const bw = (W - padL * 2) / BINS;
    let bars = '';
    for (let i = 0; i < BINS; i++) {
      const h = (hist[i] / maxC) * (H - padB - 4);
      const x = padL + i * bw;
      const y = H - padB - h;
      bars += '<rect class="rd-bar ' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, bw - 0.6).toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '"/>';
    }
    /* zero line + mean marker */
    const xAt = (v) => padL + ((v - lo) / (hi - lo)) * (W - padL * 2);
    const zeroX = xAt(0);
    const meanX = xAt(rd.mean);
    const axis = '<line class="rd-zero" x1="' + zeroX.toFixed(1) + '" y1="2" x2="' + zeroX.toFixed(1) + '" y2="' + (H - padB) + '"/>' +
      '<line class="rd-mean" x1="' + meanX.toFixed(1) + '" y1="0" x2="' + meanX.toFixed(1) + '" y2="' + (H - padB) + '"/>' +
      '<text class="rd-tick" x="' + zeroX.toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">0</text>' +
      '<text class="rd-tick" x="' + xAt(5).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">5</text>';
    return '<svg class="rd-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' + bars + axis + '</svg>';
  }

  window.scenes.scene6 = function (root) {
    root.className = 'scene scene-pad sc6';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene6.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene6.lede') + '</p>' +
      '<div class="formula-card sc6-formula"><div class="formula-label">' + T('scene6.formulaLabel') + '</div><div id="sc6-f"></div></div>' +
      '<p class="sc6-setup">' + T('scene6.setup') + '</p>' +
      '<div class="sc6-hists" id="sc6-hists"></div>' +
      '<div class="poke-box sc6-framing">' + T('scene6.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.return) || 'G_i = \\sum_{j \\ge i} \\gamma^{j-i} r_j', root.querySelector('#sc6-f'), true);

    const host = root.querySelector('#sc6-hists');
    host.innerHTML = SERIES.map(s => {
      const rd = RD[s.key] || {};
      const sd = rd.sd != null ? rd.sd.toFixed(1) : '?';
      const mean = rd.mean != null ? rd.mean.toFixed(1) : '?';
      const mn = rd.min != null ? rd.min.toFixed(1) : '?';
      return '<div class="sc6-hist ' + s.cls + '">' +
        '<div class="sc6-hist-title ' + s.cls + '-text">' + T('scene6.first', { lever: T('lever.' + s.lever) }) + '</div>' +
        histSvg(rd, s.cls) +
        '<div class="sc6-stats">' +
          '<span class="sc6-stat"><span class="sc6-stat-lab">' + T('scene6.mean') + '</span><span class="sc6-stat-val">' + mean + '</span></span>' +
          '<span class="sc6-stat"><span class="sc6-stat-lab">' + T('scene6.sd') + '</span><span class="sc6-stat-val">' + sd + '</span></span>' +
          '<span class="sc6-stat"><span class="sc6-stat-lab">' + T('scene6.worst') + '</span><span class="sc6-stat-val">' + mn + '</span></span>' +
        '</div>' +
        '<div class="sc6-hist-note">' + T('scene6.note.' + s.key) + '</div>' +
        '</div>';
    }).join('');

    return { onEnter() {} };
  };
})();

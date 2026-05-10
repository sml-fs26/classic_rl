/* Scene 5 — The trade-off.

   No live cards. Centre stage: a single regret chart with four pre-rendered
   curves (median over 10 seeds at T = DATA.horizons.sweep):
     ε = 0.01    — greedy-ish
     ε = 0.10    — balanced
     ε = 0.30    — exploratory
     decaying ε  — ε(t) = ε₀ · ρ^t with ε₀ = 0.5, ρ = 0.995

   Hovering or focusing a legend item highlights the corresponding curve.

   Caption: "No fixed ε wins everywhere." The curves are PSEUDO-regret
   (sum_τ μ* − μ_{a_τ}), monotone non-decreasing — labelled accordingly so
   the student isn't surprised by the absence of dips. */

(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene5 = function (root) {
    const sweep = window.DATA && window.DATA.sweep;
    const horz  = window.DATA && window.DATA.horizons;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's5-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>The trade-off.</h1>' +
      '<p class="subtitle">No fixed ε wins everywhere.</p>' +
      '<p class="lede">Each curve is the median over ' + (sweep ? sweep.seedsPerEps : 10) +
        ' seeds, at T = ' + (sweep ? sweep.T : horz.sweep) +
        '. ε = 0.3 over-explores, paying for it linearly. ε = 0.01 sometimes locks on a sub-optimal arm and never recovers. ε = 0.1 splits the difference. Decaying ε (start exploratory, commit later) is competitive — and a hint of what comes next.</p>';
    wrap.appendChild(hero);

    if (!sweep || !sweep.strategies) {
      const note = document.createElement('p');
      note.className = 'caption';
      note.textContent =
        'Sweep data missing. Run `node precompute/build-datasets.js` to generate it.';
      wrap.appendChild(note);
      return {};
    }

    const T = sweep.T;
    const chartHost = document.createElement('div');
    wrap.appendChild(chartHost);

    /* Pseudo-regret note: this is what's plotted (cleaner than realised regret
       for a 10-seed median; see precompute/build-datasets.js). */
    const chart = Chart.mount({
      host: chartHost, T, yMax: 5,
      label: 'median pseudo-regret  R̄(t) = Σ (μ* − μ(a_τ))',
    });

    /* Plot every strategy. The chart auto-scales y. */
    for (const s of sweep.strategies) {
      const points = s.median.map((y, i) => ({ x: i, y }));
      chart.setTrace(s.id, points, s.klass);
    }

    /* Legend with hover/focus highlight */
    const legend = document.createElement('div');
    legend.className = 'regret-legend';
    for (const s of sweep.strategies) {
      const item = document.createElement('span');
      item.className = 'legend-item clickable';
      item.tabIndex = 0;
      item.dataset.id = s.id;
      const final = s.median[s.median.length - 1];
      item.innerHTML =
        '<span class="swatch ' + s.klass + '"></span> ' +
        s.label + ' &middot; <span class="legend-final">' + final.toFixed(1) + '</span>';

      item.addEventListener('mouseenter', () => chart.setHighlight(s.id));
      item.addEventListener('mouseleave', () => chart.clearHighlight());
      item.addEventListener('focus',      () => chart.setHighlight(s.id));
      item.addEventListener('blur',       () => chart.clearHighlight());
      legend.appendChild(item);
    }
    wrap.appendChild(legend);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.innerHTML =
      'Final-regret values are at the right edge of each curve. Hover or tab through the legend to isolate a curve.';
    wrap.appendChild(foot);

    return {};
  };
})();

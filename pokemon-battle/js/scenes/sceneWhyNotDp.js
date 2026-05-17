/* Scene — why DP doesn't scale.
 *
 *   Two reasons DP doesn't survive contact with real RL problems:
 *
 *     1. We usually don't know P. The previous scene's DP sweep only
 *        worked because we wrote down the transition table ourselves.
 *        In the wild — playing a real game, controlling a real robot —
 *        you only get to sample s' from the world, never read P(s'|s,a).
 *
 *     2. Even if we *did* know P, computing Q over a realistic state
 *        space is intractable: a full Pokemon game lives in ~10¹⁵
 *        positions, a Go endgame in ~10¹⁷⁰. DP's sweep over every
 *        (s, a) is hopeless.
 *
 *   Bridge to SARSA: a sample-based method that never reads P and only
 *   touches the states the agent actually visits.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.sceneWhyNotDp = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('wndp.heading');
    root.appendChild(heading);

    /* ---- Reason 1: P is unknown in the wild ---- */
    const r1 = document.createElement('div');
    r1.className = 'concept-formula-card compact';
    r1.innerHTML =
      '<div class="concept-formula-label">' + T('wndp.r1.label') + '</div>';
    const r1f = document.createElement('div');
    r1.appendChild(r1f);
    window.Katex.render(
      String.raw`P(s' \mid s, a)\quad\text{is hidden from the agent}`,
      r1f, true
    );
    const r1foot = document.createElement('div');
    r1foot.className = 'concept-formula-foot';
    r1foot.textContent = T('wndp.r1.foot');
    r1.appendChild(r1foot);
    root.appendChild(r1);

    /* ---- Reason 2: even with P, the scale is hopeless ---- */
    const r2head = document.createElement('div');
    r2head.className = 'concept-formula-card compact';
    r2head.innerHTML =
      '<div class="concept-formula-label">' + T('wndp.r2.label') + '</div>';
    const r2foot = document.createElement('div');
    r2foot.className = 'concept-formula-foot';
    r2foot.textContent = T('wndp.r2.foot');
    r2head.appendChild(r2foot);
    root.appendChild(r2head);

    const grid = document.createElement('div');
    grid.className = 'why-stat-grid';
    grid.innerHTML =
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">'  + T('wndp.stat.pika.title')  + '</div>' +
        '<div class="why-stat-value">'  + T('wndp.stat.pika.value')  + '</div>' +
        '<div class="why-stat-detail">' + T('wndp.stat.pika.detail') + '</div>' +
      '</div>' +
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">'  + T('wndp.stat.full.title')  + '</div>' +
        '<div class="why-stat-value">'  + T('wndp.stat.full.value')  + '</div>' +
        '<div class="why-stat-detail">' + T('wndp.stat.full.detail') + '</div>' +
      '</div>' +
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">'  + T('wndp.stat.go.title')  + '</div>' +
        '<div class="why-stat-value">'  + T('wndp.stat.go.value')  + '</div>' +
        '<div class="why-stat-detail">' + T('wndp.stat.go.detail') + '</div>' +
      '</div>';
    root.appendChild(grid);

    /* Bridge to SARSA */
    const q = document.createElement('div');
    q.className = 'concept-key-question';
    q.textContent = T('wndp.bridge');
    root.appendChild(q);

    return {};
  };
})();

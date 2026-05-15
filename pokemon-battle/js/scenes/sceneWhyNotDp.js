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

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = "TWO REASONS DP DOESN'T SCALE";
    root.appendChild(heading);

    /* ---- Reason 1: P is unknown in the wild ---- */
    const r1 = document.createElement('div');
    r1.className = 'concept-formula-card compact';
    r1.innerHTML =
      '<div class="concept-formula-label">REASON 1 — WE DON\'T KNOW P</div>';
    const r1f = document.createElement('div');
    r1.appendChild(r1f);
    window.Katex.render(
      String.raw`P(s' \mid s, a)\quad\text{is hidden from the agent}`,
      r1f, true
    );
    const r1foot = document.createElement('div');
    r1foot.className = 'concept-formula-foot';
    r1foot.textContent =
      'In the previous scene we wrote P down ourselves. In the wild — a real ' +
      'game, a real robot — you only get to play. The world hands you one s\' ' +
      'per step; the table is never on the page.';
    r1.appendChild(r1foot);
    root.appendChild(r1);

    /* ---- Reason 2: even with P, the scale is hopeless ---- */
    const r2head = document.createElement('div');
    r2head.className = 'concept-formula-card compact';
    r2head.innerHTML =
      '<div class="concept-formula-label">REASON 2 — AND IF WE DID, THE SCALE</div>';
    const r2foot = document.createElement('div');
    r2foot.className = 'concept-formula-foot';
    r2foot.textContent =
      'Even with P in hand, DP\'s sweep visits every (s, a). Realistic MDPs ' +
      'have too many to enumerate.';
    r2head.appendChild(r2foot);
    root.appendChild(r2head);

    const grid = document.createElement('div');
    grid.className = 'why-stat-grid';
    grid.innerHTML =
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">PIKACHU MDP</div>' +
        '<div class="why-stat-value">25 × 3</div>' +
        '<div class="why-stat-detail">75 Q-entries · feasible by hand.</div>' +
      '</div>' +
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">FULL POKEMON GAME</div>' +
        '<div class="why-stat-value">~ 10<sup>15</sup></div>' +
        '<div class="why-stat-detail">6 mons × HP × status × items × …</div>' +
      '</div>' +
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">GO POSITIONS</div>' +
        '<div class="why-stat-value">~ 10<sup>170</sup></div>' +
        '<div class="why-stat-detail">More than atoms in the observable universe.</div>' +
      '</div>';
    root.appendChild(grid);

    /* Bridge to SARSA */
    const q = document.createElement('div');
    q.className = 'concept-key-question';
    q.textContent = 'WE NEED A SAMPLE-BASED METHOD → SARSA';
    root.appendChild(q);

    return {};
  };
})();

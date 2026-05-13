/* Scene — why DP doesn't scale.
 *
 *   This Pokemon MDP has |S| × |A| = 25 × 4 = 100 entries. Easy.
 *   Real games are millions or more — and you also need to know the
 *   transition probabilities P(s' | s, a), which we usually don't.
 *
 *   Three stat cards + one bridge line.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.sceneWhyNotDp = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = "BUT DP DOESN'T SCALE";
    root.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'why-stat-grid';
    grid.innerHTML =
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">PIKACHU MDP</div>' +
        '<div class="why-stat-value">25 × 4</div>' +
        '<div class="why-stat-detail">100 Q-entries · feasible by hand.</div>' +
      '</div>' +
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">FULL POKEMON GAME</div>' +
        '<div class="why-stat-value">~ 10<sup>15</sup></div>' +
        '<div class="why-stat-detail">6 mons × HP × status × items × …</div>' +
      '</div>' +
      '<div class="why-stat-card">' +
        '<div class="why-stat-title">GO ENDGAME</div>' +
        '<div class="why-stat-value">~ 10<sup>170</sup></div>' +
        '<div class="why-stat-detail">More positions than atoms.</div>' +
      '</div>';
    root.appendChild(grid);

    /* The second nail in the coffin: we usually don't even *have* the
       transition model P(s'|s,a). DP needs it. */
    const issue = document.createElement('div');
    issue.className = 'concept-formula-card compact';
    issue.innerHTML =
      '<div class="concept-formula-label">AND DP REQUIRES THIS</div>';
    const fhost = document.createElement('div');
    issue.appendChild(fhost);
    window.Katex.render(
      String.raw`P(s' \mid s, a)\quad\text{for every}\; (s, a, s')`,
      fhost, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = "Usually you don't know it. You just get to play.";
    issue.appendChild(foot);
    root.appendChild(issue);

    /* Bridge to SARSA */
    const q = document.createElement('div');
    q.className = 'concept-key-question';
    q.textContent = 'WE NEED A SAMPLE-BASED METHOD → SARSA';
    root.appendChild(q);

    return {};
  };
})();

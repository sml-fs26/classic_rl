/* Scene — Return and the Q-function.
 *
 *   Two KaTeX cards, no prose:
 *     G_i = Σ_{j ≥ i} γ^(j-i) · r_j           (return from time i)
 *     Q(s, a) = E[ G_i | s_i = s, a_i = a ]    (action-value function)
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.sceneObjective = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'OBJECTIVE';
    root.appendChild(heading);

    /* Return card */
    const c1 = document.createElement('div');
    c1.className = 'concept-formula-card';
    c1.innerHTML = '<div class="concept-formula-label">RETURN FROM TIME i</div>';
    const f1 = document.createElement('div');
    c1.appendChild(f1);
    window.Katex.render(
      String.raw`G_i \;=\; \sum_{j \ge i} \gamma^{\,j - i}\, r_j`,
      f1, true
    );
    const foot1 = document.createElement('div');
    foot1.className = 'concept-formula-foot';
    foot1.textContent = 'γ ∈ [0, 1) — discount';
    c1.appendChild(foot1);
    root.appendChild(c1);

    /* Q card */
    const c2 = document.createElement('div');
    c2.className = 'concept-formula-card';
    c2.innerHTML = '<div class="concept-formula-label">ACTION-VALUE FUNCTION</div>';
    const f2 = document.createElement('div');
    c2.appendChild(f2);
    window.Katex.render(
      String.raw`Q(s, a) \;=\; \mathbb{E}\!\left[\, G_i \;\middle|\; s_i = s,\; a_i = a \,\right]`,
      f2, true
    );
    const foot2 = document.createElement('div');
    foot2.className = 'concept-formula-foot';
    foot2.textContent = 'Expectation over the rest of the trajectory.';
    c2.appendChild(foot2);
    root.appendChild(c2);

    return {};
  };
})();

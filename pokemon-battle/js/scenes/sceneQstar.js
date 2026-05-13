/* Scene — π* from Q.
 *
 *   Once Q is known, the optimal policy is just argmax_a Q(s, a).
 *
 *   Layout: one KaTeX formula card, one concrete Q-cell example with the
 *   argmax row highlighted, one closing line that sets up the next scene.
 */
(function () {
  window.scenes = window.scenes || {};

  /* A deliberately-illustrative (state, Q-values) example. Numbers come
     from the converged value-iteration table at (FULL, FULL): THUNDERBOLT
     is the argmax with Q ≈ +4.29. */
  const EXAMPLE = {
    label: 'STATE (YOUR=FULL, OPP=FULL)',
    moves: [
      { name: 'QUICK ATTACK',  q: 1.73 },
      { name: 'THUNDERBOLT',   q: 4.29, argmax: true },
      { name: 'THUNDER',       q: 3.66 },
    ],
  };

  window.scenes.sceneQstar = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'IF WE KNOW Q, WE KNOW HOW TO ACT';
    root.appendChild(heading);

    /* Formula card */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">OPTIMAL POLICY</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`\pi^{\star}(s) \;=\; \operatorname*{arg\,max}_{a}\; Q(s, a)`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = 'In every state, pick the move with the highest Q.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* Concrete example */
    const ex = document.createElement('div');
    ex.className = 'qstar-example';
    ex.innerHTML = '<div class="qstar-example-label">' + EXAMPLE.label + '</div>';
    const rows = document.createElement('div');
    rows.className = 'qstar-rows';
    for (const mv of EXAMPLE.moves) {
      const row = document.createElement('div');
      row.className = 'qstar-row' + (mv.argmax ? ' argmax' : '');
      row.innerHTML =
        '<span class="qstar-mark">' + (mv.argmax ? '▶' : '') + '</span>' +
        '<span>' + mv.name + '</span>' +
        '<span class="qstar-q">' + (mv.q >= 0 ? '+' : '') + mv.q.toFixed(2) + '</span>' +
        '<span class="qstar-tag">' + (mv.argmax ? 'argmax · π*(s)' : '') + '</span>';
      rows.appendChild(row);
    }
    ex.appendChild(rows);
    root.appendChild(ex);

    /* Closing question that motivates the next scene. */
    const q = document.createElement('div');
    q.className = 'concept-key-question';
    q.textContent = 'BUT HOW DO WE COMPUTE Q ?';
    root.appendChild(q);

    return {};
  };
})();

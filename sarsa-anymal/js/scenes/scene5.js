/* Scene 5, Recap → Next.
 *
 *   Five-card layout: Q(s,a) (the central object), TD target r + γ Q', TD
 *   error δ, α (the update size), ε-greedy (the policy). Each card uses the
 *   colour from the SARSA update component it represents, plus a one-line
 *   takeaway in italic muted serif.
 *
 *   Below the cards: a forward-pointer ("function approximation, deep RL").
 *   At the bottom, a muted aside teasing scene 3's α=0.95 oscillation.
 *
 *   Static, no step engine. Cold-entry safe.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene5 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene5-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero s5-hero';
    hero.innerHTML =
      '<h1>One update. Five things to remember.</h1>' +
      '<p class="subtitle">Where SARSA leaves you, and where the next step is.</p>';
    wrap.appendChild(hero);

    /* The five summary cards. */
    const row = document.createElement('div');
    row.className = 's5-cards';
    wrap.appendChild(row);

    const CARDS = [
      { key: 'mdp',     glyph: 'Q(s, a)',                    title: 'The Q-table',
        body: 'One number per (state, action). The agent stores its current best estimate of long-run return.' },
      { key: 'bellman', glyph: "r + \\gamma\\, Q(s', a')",     title: 'TD target',
        body: 'A noisy, bootstrapped sample of the Bellman recursion, what return we now think we will get.' },
      { key: 'bellman', glyph: '\\delta = \\text{target} - Q', title: 'TD error',
        body: 'How far off our current estimate was from what we just observed. Drives every update.' },
      { key: 'rm',      glyph: '\\alpha',                    title: 'Learning rate',
        body: 'How much weight we give to today’s evidence. Robbins, Monro under noise, small α, slow trust.' },
      { key: 'eps',     glyph: "\\varepsilon\\text{-greedy}", title: 'The policy',
        body: 'Pick the current best action; explore with probability ε. SARSA is on-policy, it learns this same exploration.' },
    ];
    for (const card of CARDS) {
      const c = document.createElement('div');
      c.className = 's5-card s5-card-' + card.key;
      const glyph = document.createElement('div');
      glyph.className = 's5-glyph comp-' + card.key;
      window.Katex.render(card.glyph, glyph, false);
      c.appendChild(glyph);
      const title = document.createElement('div');
      title.className = 's5-card-title';
      title.textContent = card.title;
      c.appendChild(title);
      const body = document.createElement('p');
      body.className = 's5-card-body';
      body.textContent = card.body;
      c.appendChild(body);
      row.appendChild(c);
    }

    /* Forward pointer. */
    const fwd = document.createElement('div');
    fwd.className = 's5-forward';
    const fwdH = document.createElement('h2');
    fwdH.textContent = 'What’s next.';
    fwd.appendChild(fwdH);
    const fwdP = document.createElement('p');
    fwdP.className = 's5-forward-body';
    fwdP.textContent =
      'A 21-state Q-table fits on screen. Real environments have millions of states. ' +
      'The next step, function approximation, deep reinforcement learning, lives beyond this course.';
    fwd.appendChild(fwdP);
    wrap.appendChild(fwd);

    /* Muted aside, α=0.95 oscillation teaser. */
    const aside = document.createElement('p');
    aside.className = 's5-aside';
    aside.innerHTML =
      'A footnote you can verify: slide ' +
      '<span class="comp-rm">α</span> up to <span class="comp-rm">0.95</span> in scene 3, ' +
      'and watch SARSA oscillate. The update is too aggressive; the Q-table never settles.';
    wrap.appendChild(aside);

    return {};
  };
})();

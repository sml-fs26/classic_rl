/* Scene 5, recap, bridge to SARSA.

   Five cards: estimate, target, learning rate, decay, TD update (muted).
   One foreshadow line below: "Casino estimated one value. Spooky House
   propagated values backward. Darts kept estimates fresh under noise.
   Next: all three at once."

   No interactivity. Cold-entry safe, built from DATA.recap. */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene5 = function (root) {
    const data = window.DATA;
    const recap = (data && data.recap) || [];

    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's5-wrap';

    const hero = document.createElement('div');
    hero.className = 'hero';
    const h1 = document.createElement('h1');
    h1.textContent = 'Four words.';
    hero.appendChild(h1);
    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = "What carries forward into SARSA.";
    hero.appendChild(subtitle);
    wrap.appendChild(hero);

    const grid = document.createElement('div');
    grid.className = 's5-grid';
    for (const c of recap) {
      const card = document.createElement('div');
      card.className = 's5-card' + (c.muted ? ' s5-card-muted' : '');
      const lbl = document.createElement('div');
      lbl.className = 's5-card-label';
      lbl.textContent = c.label;
      const body = document.createElement('div');
      body.className = 's5-card-body';
      body.textContent = c.body;
      card.appendChild(lbl);
      card.appendChild(body);
      grid.appendChild(card);
    }
    wrap.appendChild(grid);

    const bridge = document.createElement('p');
    bridge.className = 's5-bridge';
    bridge.innerHTML =
      '<strong>Casino</strong> estimated one value. ' +
      '<strong>Spooky House</strong> propagated values backward. ' +
      '<strong>Darts</strong> kept estimates fresh under noise. ' +
      '<em>Next:</em> all three at once.';
    wrap.appendChild(bridge);

    /* The Robbins-Monro update once more, as a one-line takeaway. */
    const formula = window.Katex.display(data.tex.rmUpdate);
    formula.classList.add('s5-formula');
    wrap.appendChild(formula);
    const formulaCap = document.createElement('p');
    formulaCap.className = 'caption s5-formula-cap';
    formulaCap.textContent = "One line. Every TD method is built on it.";
    wrap.appendChild(formulaCap);

    root.appendChild(wrap);

    return {};
  };
})();

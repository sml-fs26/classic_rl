/* Scene 6 — Recap.

   Five cards arranged in a row: states (S), value V(s), Bellman recursion,
   policy from V, discount γ. Below them, a one-line foreshadow that names
   the bridge to viz #4 (Darts):
     "Bellman gives V if you know the rewards exactly. In Casino we
      estimated one value from samples. Next, we estimate many values
      under noise."

   No interaction. Cold-entry safe — built entirely from DATA. */
(function () {
  if (!window.scenes) window.scenes = {};

  const CARDS = [
    {
      sym: 'S',
      title: 'states',
      body: 'A tuple per cell. In this viz, just <code>(r, c)</code>. ' +
            'Twenty-five of them, one per room.',
    },
    {
      sym: 'V(s)',
      title: 'value',
      body: 'A number per state — the maximum spookiness collectable from there. ' +
            'V at the start is the optimal total.',
    },
    {
      sym: '\\textstyle V \\!=\\! R \\!+\\! \\gamma\\,\\max V',
      title: 'Bellman recursion',
      body: 'Each cell’s V is its reward plus the discounted best of its two ' +
            'next-cell V values. One backward sweep solves it exactly.',
    },
    {
      sym: '\\pi(s)',
      title: 'policy from V',
      body: 'Read the action off V: at each cell, point to the higher-V neighbour. ' +
            'Twenty-five arrows, one per state.',
    },
    {
      sym: '\\gamma',
      title: 'discount',
      body: 'How much the future is worth. <code>γ&nbsp;=&nbsp;1</code> values everything; ' +
            '<code>γ&nbsp;&lt;&nbsp;1</code> shrinks far rewards. Smaller γ, greedier path.',
    },
  ];

  window.scenes.scene6 = function (root) {
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's6-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Five things from one grid.</h1>' +
      '<p class="subtitle">A state, a value, a recursion, a policy, a discount.</p>';
    wrap.appendChild(hero);

    const cards = document.createElement('div');
    cards.className = 's6-cards';
    wrap.appendChild(cards);

    for (const c of CARDS) {
      const card = document.createElement('div');
      card.className = 's6-card';

      const sym = document.createElement('div');
      sym.className = 'card-symbol';
      window.Katex.render(c.sym, sym, false);
      card.appendChild(sym);

      const title = document.createElement('p');
      title.className = 'card-title';
      title.textContent = c.title;
      card.appendChild(title);

      const body = document.createElement('p');
      body.className = 'card-body';
      body.innerHTML = c.body;
      card.appendChild(body);

      cards.appendChild(card);
    }

    const fore = document.createElement('div');
    fore.className = 's6-foreshadow';
    fore.innerHTML =
      '<span class="label">Coming next</span>' +
      'Bellman gives V <strong>if you know the rewards exactly</strong>. In Casino we ' +
      'estimated one value from samples. Next, we estimate <strong>many values under noise</strong> — ' +
      'with a darts board and Robbins-Monro.';
    wrap.appendChild(fore);

    return {};
  };
})();

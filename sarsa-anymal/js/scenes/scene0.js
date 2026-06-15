/* Scene 0, Putting it together.
 *
 *   Title + four-card recap of the four prior viz, each card colour-keyed to
 *   the SARSA-update component it will become in scene 1. KaTeX teaser line at
 *   the bottom: "Today they fuse into one update."
 *
 *   Static, no step engine. Cold-entry safe, built entirely from
 *   DATA.components (which is always present whether or not training data
 *   has been precomputed).
 */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene0 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene0-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Putting it together.</h1>' +
      '<p class="subtitle">Four pieces. One update.</p>' +
      '<p class="lede">Each viz so far gave you one ingredient. SARSA is the recipe ' +
      'that combines them, the agent learns from its own actions.</p>';
    wrap.appendChild(hero);

    /* Component recap row, four cards, one per prior viz. */
    const row = document.createElement('div');
    row.className = 'component-row';
    wrap.appendChild(row);

    const components = (window.DATA && window.DATA.components) || [];
    for (const comp of components) {
      const card = document.createElement('div');
      card.className = 'component-card comp-card-' + comp.key;

      const icon = document.createElement('div');
      icon.className = 'comp-icon';
      icon.innerHTML = (window.Grid && window.Grid.SPRITE && window.Grid.SPRITE[comp.sprite]) || '';
      card.appendChild(icon);

      const from = document.createElement('div');
      from.className = 'comp-from';
      from.textContent = 'From ' + comp.from;
      card.appendChild(from);

      const title = document.createElement('div');
      title.className = 'comp-title';
      title.textContent = comp.title;
      card.appendChild(title);

      const sym = document.createElement('div');
      sym.className = 'comp-symbol';
      window.Katex.render(comp.symbol, sym, false);
      card.appendChild(sym);

      const cap = document.createElement('div');
      cap.className = 'comp-caption';
      cap.textContent = comp.caption;
      card.appendChild(cap);

      row.appendChild(card);
    }

    /* Closing teaser, full SARSA update. */
    const teaser = document.createElement('div');
    teaser.className = 'scene0-teaser';
    window.Katex.render(
      'Q(s,a) \\;\\leftarrow\\; Q(s,a) \\;+\\; \\alpha\\,[\\,r + \\gamma\\, Q(s\',a\') - Q(s,a)\\,]',
      teaser, true
    );
    wrap.appendChild(teaser);

    const sub = document.createElement('p');
    sub.className = 'caption scene0-teaser-caption';
    sub.textContent = 'Today these four pieces fuse into one update.';
    wrap.appendChild(sub);

    return {};
  };
})();

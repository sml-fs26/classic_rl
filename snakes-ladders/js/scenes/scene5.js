/* Scene 5 — All five pieces in one game.
 *
 *   Five recap cards in a row, each tinted with the corresponding viz's hue.
 *   Cards reference where each piece lives in this viz.
 *
 *   Static — no step engine. Cold-entry safe.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  /* Map hue key → CSS variable. Used so each card paints in the correct
     curriculum colour. */
  const HUE_TO_VAR = {
    anymal: 'var(--entity-anymal)',
    casino: 'var(--casino-blue)',
    ghost:  'var(--entity-ghost)',
    star:   'var(--entity-star)',
    door:   'var(--entity-door)',
  };

  window.scenes.scene5 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene5-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>All five pieces in one game.</h1>' +
      '<p class="subtitle">Five visualizations. One board. The whole curriculum, replayed.</p>';
    wrap.appendChild(hero);

    const recap = (window.DATA && window.DATA.recap) || [];
    const row = document.createElement('div');
    row.className = 'recap-row';
    wrap.appendChild(row);

    for (const card of recap) {
      const el = document.createElement('div');
      el.className = 'recap-card recap-' + card.hue;
      el.style.setProperty('--recap-hue', HUE_TO_VAR[card.hue] || 'var(--ink)');
      const fromBar = document.createElement('div');
      fromBar.className = 'recap-from';
      fromBar.textContent = card.from;
      el.appendChild(fromBar);
      const title = document.createElement('div');
      title.className = 'recap-title';
      title.textContent = card.title;
      el.appendChild(title);
      const sym = document.createElement('div');
      sym.className = 'recap-symbol';
      window.Katex.render(card.symbol, sym, false);
      el.appendChild(sym);
      const desc = document.createElement('div');
      desc.className = 'recap-caption';
      desc.textContent = card.caption;
      el.appendChild(desc);
      const anchor = document.createElement('div');
      anchor.className = 'recap-anchor';
      anchor.textContent = card.anchor;
      el.appendChild(anchor);
      row.appendChild(el);
    }

    const closer = document.createElement('p');
    closer.className = 'caption scene5-closer';
    closer.innerHTML =
      'Other RL methods — Q-learning, policy gradient, function approximation, deep RL — extend these five ideas. ' +
      'Larger state spaces, function approximators for Q, off-policy targets. The grammar is the same.';
    wrap.appendChild(closer);

    return {};
  };
})();

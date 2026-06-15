/* Scene 5, recap of the MDP tuple ⟨S, A, P, R, γ⟩.

   A static five-card layout. Each card carries the symbol (KaTeX), the name,
   a one-line italic caption, and a tiny thumbnail hinting at where the
   element lived earlier in the viz. The γ card is muted with a "next viz"
   badge, no thumbnail. Below the cards, one closing serif italic line.

   Static. No grid mount, no autoplay, no interval. Cold-entry safe, built
   entirely from DATA.tuple. */
(function () {
  if (!window.scenes) window.scenes = {};

  const SPRITE = (window.Grid && window.Grid.SPRITE) || {};

  /* The thumbnail recipe per tuple symbol. Keys match DATA.tuple[i].sym. */
  function buildThumb(sym) {
    const host = document.createElement('div');
    host.className = 's5-thumb';

    if (sym === 'S') {
      const cell = document.createElement('div');
      cell.className = 's5-thumb-cell entity-anymal';
      cell.innerHTML = SPRITE.anymal || '';
      host.appendChild(cell);
      return host;
    }
    if (sym === 'A') {
      const grid = document.createElement('div');
      grid.className = 'action-arrows s5-thumb-arrows';
      const up = document.createElement('div');
      up.className = 'action-arrow up commanded';
      up.textContent = '↑';
      grid.appendChild(up);
      const left = document.createElement('div');
      left.className = 'action-arrow left';
      left.textContent = '←';
      grid.appendChild(left);
      const right = document.createElement('div');
      right.className = 'action-arrow right';
      right.textContent = '→';
      grid.appendChild(right);
      const down = document.createElement('div');
      down.className = 'action-arrow down';
      down.textContent = '↓';
      grid.appendChild(down);
      const center = document.createElement('div');
      center.className = 'action-arrow center';
      grid.appendChild(center);
      host.appendChild(grid);
      return host;
    }
    if (sym === 'P') {
      /* Two superimposed arrows: blue solid (commanded) and red dashed
         (executed), echoes scene 3's stochasticity treatment. */
      const stack = document.createElement('div');
      stack.className = 's5-thumb-stack';
      const solid = document.createElement('div');
      solid.className = 'action-arrow up commanded s5-thumb-solid';
      solid.textContent = '↑';
      stack.appendChild(solid);
      const dashed = document.createElement('div');
      dashed.className = 'action-arrow left executed s5-thumb-dashed';
      dashed.textContent = '←';
      stack.appendChild(dashed);
      host.appendChild(stack);
      return host;
    }
    if (sym === 'R') {
      const cell = document.createElement('div');
      cell.className = 's5-thumb-cell entity-star';
      cell.innerHTML = SPRITE.star || '';
      host.appendChild(cell);
      return host;
    }
    /* No thumbnail for γ. */
    return null;
  }

  window.scenes.scene5 = function (root) {
    const tuple = (window.DATA && window.DATA.tuple) || [];

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's5-wrap';

    const cards = document.createElement('div');
    cards.className = 's5-recap';

    for (let i = 0; i < tuple.length; i++) {
      const item = tuple[i];
      const isMuted = !!item.muted;

      const card = document.createElement('div');
      card.className = 'card s5-card' + (isMuted ? ' s5-card-muted' : '');

      const symHost = document.createElement('div');
      symHost.className = 's5-sym';
      symHost.appendChild(window.Katex.inline(item.sym));
      card.appendChild(symHost);

      const name = document.createElement('div');
      name.className = 's5-name';
      name.textContent = item.name;
      card.appendChild(name);

      const caption = document.createElement('div');
      caption.className = 's5-caption';
      caption.textContent = item.caption;
      card.appendChild(caption);

      const thumb = buildThumb(item.sym);
      if (thumb) {
        card.appendChild(thumb);
      } else if (isMuted && item.deferred) {
        const badge = document.createElement('div');
        badge.className = 's5-badge';
        badge.textContent = item.deferred;
        card.appendChild(badge);
      }

      cards.appendChild(card);
    }

    wrap.appendChild(cards);

    const closing = document.createElement('p');
    closing.className = 's5-closing';
    closing.textContent = "That's an MDP. Now we learn how to act.";
    wrap.appendChild(closing);

    root.appendChild(wrap);

    return {};
  };
})();

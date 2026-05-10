/* Scene 0 — five unknown machines.

   Title manifesto. Five cards in a row, each with a slot-machine sprite, the
   machine name, and `?` where the empirical mean would later go. The five
   true probabilities are NOT shown.

   Static, no interactive elements, no internal step engine. Cold-entry safe
   — built entirely from DATA.bandit. */
(function () {
  if (!window.scenes) window.scenes = {};

  const SLOT_SVG =
    '<svg viewBox="0 0 64 80" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="10" y="14" width="44" height="56" rx="4"/>' +
        '<rect x="14" y="6" width="36" height="10" rx="2"/>' +
        '<rect x="16" y="22" width="32" height="20" rx="2"/>' +
        '<line x1="26" y1="22" x2="26" y2="42"/>' +
        '<line x1="38" y1="22" x2="38" y2="42"/>' +
        '<circle cx="22" cy="52" r="3"/>' +
        '<circle cx="32" cy="52" r="3"/>' +
        '<circle cx="42" cy="52" r="3"/>' +
        '<line x1="22" y1="62" x2="42" y2="62"/>' +
        '<line x1="54" y1="34" x2="60" y2="22"/>' +
        '<circle cx="60" cy="22" r="3" fill="currentColor"/>' +
      '</g>' +
    '</svg>';

  window.scenes.scene0 = function (root) {
    const cfg  = window.DATA && window.DATA.bandit;
    const horz = window.DATA && window.DATA.horizons;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's0-wrap';

    /* Hero block */
    const hero = document.createElement('div');
    hero.className = 'hero';
    const h1 = document.createElement('h1');
    h1.textContent = 'Five unknown machines.';
    hero.appendChild(h1);
    const sub = document.createElement('p');
    sub.className = 'subtitle';
    sub.textContent = 'You have to play. You have to learn. Both at once.';
    hero.appendChild(sub);
    const lede = document.createElement('p');
    lede.className = 'lede';
    lede.textContent =
      'Each machine pays out with a fixed but hidden probability. You do not know them. ' +
      'Every round you pick one machine and pull. You see one outcome — win or no-win — ' +
      'and decide what to do next.';
    hero.appendChild(lede);
    wrap.appendChild(hero);

    /* Machine row — five cards with `?` screens */
    const row = document.createElement('div');
    row.className = 'machine-row';
    for (let i = 0; i < cfg.K; i++) {
      const card = document.createElement('div');
      card.className = 'machine-card no-pulls arm-' + (i + 1);

      const sprite = document.createElement('div');
      sprite.className = 'slot-sprite';
      sprite.innerHTML = SLOT_SVG;
      card.appendChild(sprite);

      const name = document.createElement('div');
      name.className = 'slot-name';
      name.textContent = cfg.armNames[i];
      card.appendChild(name);

      const screen = document.createElement('div');
      screen.className = 'slot-screen';
      screen.textContent = '?';
      card.appendChild(screen);

      const pulls = document.createElement('div');
      pulls.className = 'slot-pulls';
      pulls.textContent = '0 pulls';
      card.appendChild(pulls);

      row.appendChild(card);
    }
    wrap.appendChild(row);

    /* The horizon promise */
    const promise = document.createElement('p');
    promise.className = 's0-promise';
    promise.textContent =
      'You play ' + horz.autoplay + ' rounds. Each round, pick one machine and pull.';
    wrap.appendChild(promise);

    /* Footnote — keyboard hints */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.innerHTML = 'Press <kbd>&rarr;</kbd> to begin.';
    wrap.appendChild(foot);

    root.appendChild(wrap);

    return {};
  };
})();

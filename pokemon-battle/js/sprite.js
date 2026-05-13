/* Pokemon sprite wrapper. Wraps an <img> with the pixelated-rendering CSS
 * and exposes shake / faint animation hooks the battle scene drives. */
(function () {
  /* Mount a sprite into `host`. `kind` is 'pikachu' | 'charmander'.
     `side` is 'player' (back-sprite) or 'opponent' (front-sprite). */
  function mount(host, kind, side) {
    host.innerHTML = '';
    let curKind = kind;
    const img = document.createElement('img');
    img.src = `assets/${kind}-${side === 'player' ? 'back' : 'front'}.png`;
    img.alt = kind.toUpperCase() + ' (' + side + ')';
    img.className = 'poke-sprite';
    host.appendChild(img);

    function shake() {
      img.classList.remove('shake');
      /* Reflow so the animation restarts cleanly. */
      void img.offsetWidth;
      img.classList.add('shake');
    }
    function faint() {
      img.classList.add('faint');
    }
    function reset() {
      img.classList.remove('shake');
      img.classList.remove('faint');
    }
    /* Swap the sprite source — used when the opponent evolves
       between Charmander / Charmeleon / Charizard mid-battle. */
    function setKind(newKind) {
      if (newKind === curKind) return false;
      curKind = newKind;
      img.src = `assets/${newKind}-${side === 'player' ? 'back' : 'front'}.png`;
      img.alt = newKind.toUpperCase() + ' (' + side + ')';
      return true;
    }
    function kindOf() { return curKind; }
    function el() { return img; }

    return { shake, faint, reset, setKind, kindOf, el };
  }

  window.Sprite = { mount };
})();

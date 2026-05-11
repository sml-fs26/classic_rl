/* Pokemon sprite wrapper. Wraps an <img> with the pixelated-rendering CSS
 * and exposes shake / faint animation hooks the battle scene drives. */
(function () {
  /* Mount a sprite into `host`. `kind` is 'pikachu' | 'charmander'.
     `side` is 'player' (back-sprite) or 'opponent' (front-sprite). */
  function mount(host, kind, side) {
    host.innerHTML = '';
    const src = `assets/${kind}-${side === 'player' ? 'back' : 'front'}.png`;
    const img = document.createElement('img');
    img.src = src;
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
    function el() { return img; }

    return { shake, faint, reset, el };
  }

  window.Sprite = { mount };
})();

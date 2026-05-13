/* Scene 0 — POKEMON title screen.
 *
 *   POKEMON wordmark + blinking Pikachu + PRESS START. The MDP overlay
 *   that used to be a second phase of this scene is now its own scene
 *   (sceneMdpOverlay) sitting after the tutorial + trial battle — so
 *   students play a turn before we name the five pieces.
 *
 *   Pressing START or hitting NEXT yields to the scene engine and
 *   advances to scene 1 (the tutorial).
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'sc0-title-wrap';
    titleWrap.innerHTML = `
      <h1 class="poke-title">POKEMON</h1>
      <div class="sc0-subtitle">A REINFORCEMENT LEARNING ADVENTURE</div>
      <div class="sc0-pika-wrap">
        <img class="poke-sprite sc0-pika" src="assets/pikachu-front.png" alt="PIKACHU"/>
      </div>
      <button class="sc0-start" type="button">&#9654; PRESS START</button>
      <div class="sc0-credits">SML &middot; ETH ZURICH &middot; CLASSIC RL #7</div>
      <div class="sc0-credits sc0-credits-by">BY CARLOS COTRINI</div>
    `;
    root.appendChild(titleWrap);

    const startBtn = titleWrap.querySelector('.sc0-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.PokeViz) window.PokeViz.goTo(window.PokeViz.getCurrentScene() + 1);
      });
    }

    return {
      onEnter() {},
    };
  };
})();

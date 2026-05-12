/* Scene 0 — POKEMON title screen + MDP-frame overlay.
 *
 * Two phases:
 *   (a) Title screen — big "POKEMON" wordmark, blinking Pikachu sprite,
 *       "PRESS START" prompt. Click "START" (or →) to dissolve to the MDP
 *       overlay.
 *   (b) MDP overlay — the battle stage is shown, with tags pinned over each
 *       element naming what it is in the 5-tuple ⟨S, A, P, R, γ⟩. A KaTeX
 *       teaser line beneath the stage states the thesis.
 *
 * The scene exposes onNextKey so a single → press at phase (a) advances to
 * phase (b) before yielding to the scene-engine driver. */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    let phase = 'title';   // 'title' → 'mdp'

    /* ---------- Title screen ---------- */
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

    /* ---------- MDP overlay (built but hidden until phase advances) ---------- */
    const mdpWrap = document.createElement('div');
    mdpWrap.className = 'sc0-mdp-wrap';
    mdpWrap.style.display = 'none';

    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle sc0-mdp-heading';
    heading.textContent = "YOU’VE PLAYED THIS GAME.";
    mdpWrap.appendChild(heading);

    const sub = document.createElement('div');
    sub.className = 'poke-caption sc0-mdp-sub';
    sub.textContent = "Today you'll see why a Pokemon battle is a Markov decision process.";
    mdpWrap.appendChild(sub);

    /* Build a static (non-interactive) battle stage for the overlay. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage';
    stage.innerHTML = `
      <div class="grass-rim"></div>
      <div class="platform opponent"></div>
      <div class="platform player"></div>
      <div class="sprite-host opponent"><img class="poke-sprite" src="assets/charmander-front.png" alt="CHARMANDER (opponent)"/></div>
      <div class="sprite-host player"><img class="poke-sprite" src="assets/pikachu-back.png" alt="PIKACHU (player)"/></div>
    `;

    /* HP boxes — non-functional, shown only for the overlay aesthetic. */
    const oppHpBox = document.createElement('div');
    window.HPBar.mount(oppHpBox, { name: 'CHARMANDER', maxHp: 100, side: 'opponent', level: 5 }).set(100);
    const playerHpBox = document.createElement('div');
    window.HPBar.mount(playerHpBox, { name: 'PIKACHU', maxHp: 100, side: 'player', level: 5 }).set(100);
    stage.appendChild(oppHpBox);
    stage.appendChild(playerHpBox);

    /* MDP tags pinned around the stage. */
    const overlay = document.createElement('div');
    overlay.className = 'mdp-overlay';
    overlay.innerHTML = `
      <div class="mdp-tag" style="left: 4%; top: 4%;">S — STATE: HP buckets</div>
      <div class="mdp-tag" style="right: 6%; top: 50%; transform: translateY(-50%);">P — transitions: damage rolls</div>
      <div class="mdp-tag" style="left: 4%; bottom: 4%;">A — actions: 4 moves</div>
      <div class="mdp-tag" style="right: 4%; bottom: 4%;">R — reward: -1 / win +10 / faint -10</div>
      <div class="mdp-tag" style="left: 50%; top: 50%; transform: translate(-50%, -50%); background: var(--charmander-orange); color: #fff;">&gamma; — discount</div>
    `;
    stage.appendChild(overlay);

    mdpWrap.appendChild(stage);

    const tuple = document.createElement('div');
    tuple.className = 'poke-formula sc0-tuple';
    window.Katex.render(window.DATA.tex.mdpTuple, tuple, true);
    mdpWrap.appendChild(tuple);

    const caption = document.createElement('div');
    caption.className = 'poke-caption sc0-mdp-caption';
    caption.innerHTML =
      'Five pieces.  <span class="comp-mdp">States</span> are HP buckets.  ' +
      '<span class="comp-mdp">Actions</span> are moves.  ' +
      '<span class="comp-mdp">Transitions</span> are damage rolls.  ' +
      '<span class="comp-mdp">Rewards</span> are −1 per turn, ±10 at terminal.  ' +
      '<span class="comp-mdp">γ</span> is how patient Pikachu is.';
    mdpWrap.appendChild(caption);

    const hint = document.createElement('div');
    hint.className = 'footnote';
    hint.innerHTML = 'Press <kbd>NEXT</kbd> or right-arrow to begin the battle.';
    mdpWrap.appendChild(hint);

    root.appendChild(mdpWrap);

    function advanceToMdp() {
      if (phase === 'mdp') return false;
      phase = 'mdp';
      titleWrap.style.display = 'none';
      mdpWrap.style.display = '';
      return true;
    }
    function rewindToTitle() {
      if (phase === 'title') return false;
      phase = 'title';
      titleWrap.style.display = '';
      mdpWrap.style.display = 'none';
      return true;
    }

    const startBtn = titleWrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', () => advanceToMdp());

    /* &run flag: auto-advance to MDP overlay for headless capture. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(() => advanceToMdp(), 200);

    return {
      onEnter() {
        phase = 'title';
        titleWrap.style.display = '';
        mdpWrap.style.display = 'none';
      },
      onNextKey() {
        return advanceToMdp();
      },
      onPrevKey() {
        return rewindToTitle();
      },
    };
  };
})();

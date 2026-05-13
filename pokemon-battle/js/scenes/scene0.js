/* Scene 0 — POKEMON title screen + progressive MDP overlay.
 *
 *   Two phases:
 *     (a) Title — POKEMON wordmark + blinking Pikachu + PRESS START.
 *     (b) MDP overlay — battle stage with the five MDP pieces
 *         introduced ONE AT A TIME by clicking through internal steps,
 *         so the screen never carries more callouts than the current
 *         explanation justifies.
 *
 *   MDP-phase internal step ladder:
 *     0: just sprites + heading. No HP bars, no tags. The student sees
 *        only what a Gen-1 trainer would see at the start of a battle.
 *     1: HP bars fade in + the S tag appears next to them.
 *     2: A static (disabled) move menu fades in below the stage + the
 *        A tag appears.
 *     3: A one-shot attack animation plays (PIKACHU lunges, CHARMANDER
 *        shakes, "−1 HP" floats up) + the P tag appears.
 *     4: A reward indicator floats next to the score-board + the R tag
 *        appears.
 *     5: A centred γ tag appears.
 *
 *   onNextKey / onPrevKey: advance / rewind the internal step within
 *   the MDP phase. When at step 5, NEXT yields to the scene engine and
 *   moves to scene 1. When at step 0, PREV pops back to the title.
 */
(function () {
  window.scenes = window.scenes || {};

  const MDP_STEP_COUNT = 6;   // 0..5 inclusive
  const STEP_CAPTIONS = [
    'A POKEMON battle is a <b>Markov Decision Process</b>. Five pieces. We\'ll add them one at a time.',
    '<b>S — STATE.</b> Each side\'s HP bucket. PIKACHU and CHARMANDER both carry one.',
    '<b>A — ACTIONS.</b> Three moves PIKACHU can pick from this turn.',
    '<b>P — TRANSITIONS.</b> Each move has a probabilistic outcome — accuracy + damage roll.',
    '<b>R — REWARD.</b> −1 every turn, +10 if you win, −10 if you faint. Short wins beat long grinds.',
    '<b>γ — DISCOUNT.</b> How patient PIKACHU is — how much future reward matters now.',
  ];

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    let phase = 'title';    // 'title' | 'mdp'
    let mdpStep = 0;

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

    /* ---------- MDP overlay (built once, hidden until phase advances) ---------- */
    const mdpWrap = document.createElement('div');
    mdpWrap.className = 'sc0-mdp-wrap';
    mdpWrap.style.display = 'none';

    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle sc0-mdp-heading';
    heading.textContent = "WHAT MAKES THIS AN MDP?";
    mdpWrap.appendChild(heading);

    /* The battle stage. Sprites are visible from step 0; HP bars + move
       menu + reward + γ are gated by .show classes that we toggle in
       applyMdpStep. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage sc0-mdp-stage';
    stage.innerHTML = `
      <div class="grass-rim"></div>
      <div class="platform opponent"></div>
      <div class="platform player"></div>
      <div class="sprite-host opponent"><img class="poke-sprite" src="assets/charmander-front.png" alt="CHARMANDER (opponent)"/></div>
      <div class="sprite-host player"><img class="poke-sprite" src="assets/pikachu-back.png" alt="PIKACHU (player)"/></div>
    `;

    /* HP boxes — gated container so we can fade them in at step 1. */
    const hpWrap = document.createElement('div');
    hpWrap.className = 'sc0-hp-wrap';
    const oppHpBox = document.createElement('div');
    window.HPBar.mount(oppHpBox, { name: 'CHARMANDER', side: 'opponent', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS }).set(0);
    const playerHpBox = document.createElement('div');
    window.HPBar.mount(playerHpBox, { name: 'PIKACHU', side: 'player', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS }).set(0);
    hpWrap.appendChild(oppHpBox);
    hpWrap.appendChild(playerHpBox);
    stage.appendChild(hpWrap);

    /* Progressive MDP overlay — every tag has a step-gate class. */
    const overlay = document.createElement('div');
    overlay.className = 'mdp-overlay';
    overlay.innerHTML = `
      <div class="mdp-tag mdp-tag-s"     style="left: 4%; top: 38%;">S — STATE (HP)</div>
      <div class="mdp-tag mdp-tag-a"     style="left: 4%; bottom: 4%;">A — ACTIONS</div>
      <div class="mdp-tag mdp-tag-p"     style="right: 6%; top: 50%; transform: translateY(-50%);">P — TRANSITIONS</div>
      <div class="mdp-tag mdp-tag-r"     style="right: 4%; bottom: 4%;">R — REWARD</div>
      <div class="mdp-tag mdp-tag-gamma" style="left: 50%; top: 50%; transform: translate(-50%, -50%); background: var(--charmander-orange); color: #fff;">γ — DISCOUNT</div>
    `;
    stage.appendChild(overlay);

    mdpWrap.appendChild(stage);

    /* Static move menu (disabled) — appears at step 2. Uses the same
       Moves.moveSubHtml renderer as scene 1, so the layout matches
       what students will see when they reach the actual battle. */
    const menuWrap = document.createElement('div');
    menuWrap.className = 'sc0-menu-wrap';
    const menu = document.createElement('div');
    menu.className = 'move-menu';
    for (const m of window.Moves.MOVES) {
      const btn = document.createElement('button');
      btn.className = 'move-btn';
      btn.type = 'button';
      btn.disabled = true;
      btn.innerHTML = m.name + '<span class="move-sub">' + window.Moves.moveSubHtml(m.id) + '</span>';
      menu.appendChild(btn);
    }
    menuWrap.appendChild(menu);
    mdpWrap.appendChild(menuWrap);

    /* Reward indicator — appears at step 4. */
    const rewardWrap = document.createElement('div');
    rewardWrap.className = 'sc0-reward-wrap';
    rewardWrap.innerHTML =
      '<span class="sc0-reward-pill neg">−1 per turn</span>' +
      '<span class="sc0-reward-pill pos">+10 win</span>' +
      '<span class="sc0-reward-pill neg">−10 faint</span>';
    mdpWrap.appendChild(rewardWrap);

    /* Caption + step controls */
    const caption = document.createElement('div');
    caption.className = 'poke-caption sc0-mdp-caption';
    mdpWrap.appendChild(caption);

    const ctrls = document.createElement('div');
    ctrls.className = 'sc0-mdp-ctrls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="sc0-mdp-prev">◀ PREV</button>' +
      '<div class="sc0-mdp-step">STEP <b id="sc0-mdp-i">1</b> / ' + MDP_STEP_COUNT + '</div>' +
      '<button class="poke-btn" id="sc0-mdp-next">NEXT ▶</button>';
    mdpWrap.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote';
    hint.innerHTML = 'When all five pieces are on screen, click <kbd>NEXT</kbd> to begin the battle.';
    mdpWrap.appendChild(hint);

    root.appendChild(mdpWrap);

    /* ---------- Step state machine ---------- */
    function fireAttackAnimation() {
      stage.classList.remove('sc0-attacking');
      void stage.offsetWidth;
      stage.classList.add('sc0-attacking');
      /* Floating "−1 HP" near Charmander. */
      const flash = document.createElement('div');
      flash.className = 'sc0-damage-flash';
      flash.textContent = '−1 HP';
      stage.appendChild(flash);
      setTimeout(() => flash.remove(), 1100);
      setTimeout(() => stage.classList.remove('sc0-attacking'), 1100);
    }

    function applyMdpStep(c) {
      mdpStep = Math.max(0, Math.min(MDP_STEP_COUNT - 1, c));
      hpWrap.classList.toggle('show',         mdpStep >= 1);
      menuWrap.classList.toggle('show',       mdpStep >= 2);
      rewardWrap.classList.toggle('show',     mdpStep >= 4);
      overlay.querySelector('.mdp-tag-s').classList.toggle('show',     mdpStep >= 1);
      overlay.querySelector('.mdp-tag-a').classList.toggle('show',     mdpStep >= 2);
      overlay.querySelector('.mdp-tag-p').classList.toggle('show',     mdpStep >= 3);
      overlay.querySelector('.mdp-tag-r').classList.toggle('show',     mdpStep >= 4);
      overlay.querySelector('.mdp-tag-gamma').classList.toggle('show', mdpStep >= 5);
      caption.innerHTML = STEP_CAPTIONS[mdpStep];
      const idEl = document.getElementById('sc0-mdp-i');
      if (idEl) idEl.textContent = String(mdpStep + 1);
      if (mdpStep === 3) fireAttackAnimation();
    }

    function advanceToMdp() {
      if (phase === 'mdp') return false;
      phase = 'mdp';
      titleWrap.style.display = 'none';
      mdpWrap.style.display = '';
      applyMdpStep(0);
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

    document.getElementById('sc0-mdp-next').addEventListener('click', () => {
      if (mdpStep < MDP_STEP_COUNT - 1) applyMdpStep(mdpStep + 1);
      else window.PokeViz && window.PokeViz.goTo(window.PokeViz.getCurrentScene() + 1);
    });
    document.getElementById('sc0-mdp-prev').addEventListener('click', () => {
      if (mdpStep > 0) applyMdpStep(mdpStep - 1);
      else rewindToTitle();
    });

    /* &run flag: auto-advance to MDP overlay last step for headless. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      setTimeout(() => { advanceToMdp(); applyMdpStep(MDP_STEP_COUNT - 1); }, 200);
    }

    /* &mdp=N flag: jump straight to step N (1-indexed) for screenshots. */
    const mdpMatch = (window.location.hash || '').match(/[#&?]mdp=(\d+)/);
    if (mdpMatch) {
      setTimeout(() => {
        advanceToMdp();
        applyMdpStep(parseInt(mdpMatch[1], 10) - 1);
      }, 200);
    }

    return {
      onEnter() {
        phase = 'title';
        titleWrap.style.display = '';
        mdpWrap.style.display = 'none';
      },
      onNextKey() {
        if (phase === 'title') return advanceToMdp();
        if (mdpStep < MDP_STEP_COUNT - 1) { applyMdpStep(mdpStep + 1); return true; }
        return false;
      },
      onPrevKey() {
        if (phase === 'title') return false;
        if (mdpStep > 0) { applyMdpStep(mdpStep - 1); return true; }
        return rewindToTitle();
      },
    };
  };
})();

/* Scene — "What makes this an MDP?"
 *
 *   Extracted from scene 0 (where it used to live as a second phase
 *   after the title). Now sits after the tutorial and trial battle so
 *   the student has actually played a turn before we name the pieces.
 *
 *   Progressive 6-step ladder, one MDP piece revealed per click:
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
 *   onNextKey / onPrevKey: step within the ladder. When at step 5,
 *   NEXT yields to the scene engine; when at step 0, PREV yields
 *   backwards. We reuse the .sc0-* CSS classes from scene0.css since
 *   that file already styles the title screen + this overlay together.
 */
(function () {
  window.scenes = window.scenes || {};

  const STEP_COUNT = 6;   // 0..5 inclusive
  const STEP_CAPTIONS = [
    'A POKEMON battle is a <b>Markov Decision Process</b>. Five pieces. We\'ll add them one at a time.',
    '<b>S — STATE.</b> Each side\'s HP bucket. PIKACHU and CHARMANDER both carry one.',
    '<b>A — ACTIONS.</b> Three moves PIKACHU can pick from this turn.',
    '<b>P — TRANSITIONS.</b> Each move has a probabilistic outcome — accuracy + damage roll.',
    '<b>R — REWARD.</b> −1 every turn, +10 if you win, −10 if you faint. Short wins beat long grinds.',
    '<b>γ — DISCOUNT.</b> How patient PIKACHU is — how much future reward matters now.',
  ];

  window.scenes.sceneMdpOverlay = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    let step = 0;

    const wrap = document.createElement('div');
    wrap.className = 'sc0-mdp-wrap';
    root.appendChild(wrap);

    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle sc0-mdp-heading';
    heading.textContent = "WHAT MAKES THIS AN MDP?";
    wrap.appendChild(heading);

    /* The battle stage. Sprites are visible from step 0; HP bars + move
       menu + reward + γ are gated by .show classes that we toggle in
       applyStep. */
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

    wrap.appendChild(stage);

    /* Static move menu (disabled) — appears at step 2. Uses the same
       Moves.moveSubHtml renderer as scene 1 so the layout matches what
       students saw when they reached the actual battle. */
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
    wrap.appendChild(menuWrap);

    /* Reward indicator — appears at step 4. */
    const rewardWrap = document.createElement('div');
    rewardWrap.className = 'sc0-reward-wrap';
    rewardWrap.innerHTML =
      '<span class="sc0-reward-pill neg">−1 per turn</span>' +
      '<span class="sc0-reward-pill pos">+10 win</span>' +
      '<span class="sc0-reward-pill neg">−10 faint</span>';
    wrap.appendChild(rewardWrap);

    /* Caption + step controls */
    const caption = document.createElement('div');
    caption.className = 'poke-caption sc0-mdp-caption';
    wrap.appendChild(caption);

    const ctrls = document.createElement('div');
    ctrls.className = 'sc0-mdp-ctrls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="mdp-overlay-prev">◀ PREV</button>' +
      '<div class="sc0-mdp-step">STEP <b id="mdp-overlay-i">1</b> / ' + STEP_COUNT + '</div>' +
      '<button class="poke-btn" id="mdp-overlay-next">NEXT ▶</button>';
    wrap.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote';
    hint.innerHTML = 'When all five pieces are on screen, click <kbd>NEXT</kbd> to continue.';
    wrap.appendChild(hint);

    /* ---------- Step state machine ---------- */
    function fireAttackAnimation() {
      stage.classList.remove('sc0-attacking');
      void stage.offsetWidth;
      stage.classList.add('sc0-attacking');
      const flash = document.createElement('div');
      flash.className = 'sc0-damage-flash';
      flash.textContent = '−1 HP';
      stage.appendChild(flash);
      setTimeout(() => flash.remove(), 1100);
      setTimeout(() => stage.classList.remove('sc0-attacking'), 1100);
    }

    function applyStep(c) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, c));
      hpWrap.classList.toggle('show',         step >= 1);
      menuWrap.classList.toggle('show',       step >= 2);
      rewardWrap.classList.toggle('show',     step >= 4);
      overlay.querySelector('.mdp-tag-s').classList.toggle('show',     step >= 1);
      overlay.querySelector('.mdp-tag-a').classList.toggle('show',     step >= 2);
      overlay.querySelector('.mdp-tag-p').classList.toggle('show',     step >= 3);
      overlay.querySelector('.mdp-tag-r').classList.toggle('show',     step >= 4);
      overlay.querySelector('.mdp-tag-gamma').classList.toggle('show', step >= 5);
      caption.innerHTML = STEP_CAPTIONS[step];
      const idEl = document.getElementById('mdp-overlay-i');
      if (idEl) idEl.textContent = String(step + 1);
      if (step === 3) fireAttackAnimation();
    }
    applyStep(0);

    document.getElementById('mdp-overlay-next').addEventListener('click', () => {
      if (step < STEP_COUNT - 1) applyStep(step + 1);
      else window.PokeViz && window.PokeViz.goTo(window.PokeViz.getCurrentScene() + 1);
    });
    document.getElementById('mdp-overlay-prev').addEventListener('click', () => {
      if (step > 0) applyStep(step - 1);
      else window.PokeViz && window.PokeViz.goTo(window.PokeViz.getCurrentScene() - 1);
    });

    /* &run flag: jump to the last step for headless screenshots. */
    if (/[#&?]run\b/.test(window.location.hash)) {
      setTimeout(() => applyStep(STEP_COUNT - 1), 200);
    }
    /* &mdp=N flag: jump to step N (1-indexed). */
    const stepMatch = (window.location.hash || '').match(/[#&?]mdp=(\d+)/);
    if (stepMatch) {
      setTimeout(() => applyStep(parseInt(stepMatch[1], 10) - 1), 200);
    }

    return {
      onEnter() { applyStep(0); },
      onNextKey() {
        if (step < STEP_COUNT - 1) { applyStep(step + 1); return true; }
        return false;
      },
      onPrevKey() {
        if (step > 0) { applyStep(step - 1); return true; }
        return false;
      },
    };
  };
})();

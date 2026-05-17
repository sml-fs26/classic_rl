/* Scene — "What makes this an MDP?"
 *
 *   Explicit definitions of the three MDP ingredients, one click at a
 *   time. Reward is folded into the transition function's output.
 *
 *   4-step ladder:
 *     0: Sprites + heading only. "Three ingredients."
 *     1: HP bars + S tag.  State = pair of non-negative integers (h_p, h_o).
 *     2: Move menu + A tag. Action = any move from { QUICK, BOLT, THUN }.
 *     3: Attack animation + P tag.  Transition probability function
 *        P(s, a) → (s', r) — probabilistic.
 */
(function () {
  window.scenes = window.scenes || {};

  const STEP_COUNT = 4;   // 0..3 inclusive
  /* Step captions are looked up per-render so a language toggle re-paints
     them. Keys are 'mdp.step.0' .. 'mdp.step.3' in i18n.js. */

  window.scenes.sceneMdpOverlay = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    let step = 0;

    const wrap = document.createElement('div');
    wrap.className = 'sc0-mdp-wrap';
    root.appendChild(wrap);

    const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle sc0-mdp-heading';
    heading.textContent = T('mdp.heading');
    wrap.appendChild(heading);

    /* Markov-assumption sidebar — a small line under the heading
       calling out the assumption explicitly so students don't take
       it for granted.  Mentions where the assumption breaks (sleep
       counters, paralysis, items) so we're honest about the
       abstraction. */
    const markov = document.createElement('div');
    markov.className = 'sc0-mdp-markov';
    markov.innerHTML = T('mdp.markov');
    wrap.appendChild(markov);

    /* The battle stage. Sprites are visible from step 0; HP bars + move
       menu are gated by .show classes that we toggle in applyStep. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage sc0-mdp-stage';
    stage.innerHTML = `
      <div class="grass-rim">
        <div class="grass-tufts">
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
        </div>
      </div>
      <div class="platform opponent"></div>
      <div class="platform player"></div>
      <div class="sprite-host opponent"><img class="poke-sprite" src="assets/charmander-front.png" alt="CHARMANDER (opponent)"/></div>
      <div class="sprite-host player"><img class="poke-sprite" src="assets/pikachu-back.png" alt="PIKACHU (player)"/></div>
    `;

    /* HP boxes — gated container so we can fade them in at step 1. */
    const hpWrap = document.createElement('div');
    hpWrap.className = 'sc0-hp-wrap';
    const oppHpBox = document.createElement('div');
    window.HPBar.mount(oppHpBox, { name: T('pokemon.charmander'), side: 'opponent', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS }).set(0);
    const playerHpBox = document.createElement('div');
    window.HPBar.mount(playerHpBox, { name: T('pokemon.pikachu'), side: 'player', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS }).set(0);
    hpWrap.appendChild(oppHpBox);
    hpWrap.appendChild(playerHpBox);
    stage.appendChild(hpWrap);

    /* Progressive MDP overlay — every tag has a step-gate class. */
    const overlay = document.createElement('div');
    overlay.className = 'mdp-overlay';
    overlay.innerHTML = `
      <div class="mdp-tag mdp-tag-s"     style="left: 4%; top: 38%;">${T('mdp.tag.s')}</div>
      <div class="mdp-tag mdp-tag-a"     style="left: 4%; bottom: 4%;">${T('mdp.tag.a')}</div>
      <div class="mdp-tag mdp-tag-p"     style="right: 6%; top: 50%; transform: translateY(-50%);">${T('mdp.tag.p')}</div>
    `;
    stage.appendChild(overlay);

    /* Side-by-side layout — stage on the left, control column (menu +
       caption + step controls) on the right.  Lets the whole scene fit
       in one viewport without scrolling, which matters because the
       step ladder asks the student to compare the tag positions on
       the stage with the caption beat-by-beat. */
    const row = document.createElement('div');
    row.className = 'sc0-mdp-row';
    wrap.appendChild(row);

    row.appendChild(stage);

    const rightCol = document.createElement('div');
    rightCol.className = 'sc0-mdp-right';
    row.appendChild(rightCol);

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
      btn.innerHTML = T('move.' + m.id) + '<span class="move-sub">' + window.Moves.moveSubHtml(m.id) + '</span>';
      menu.appendChild(btn);
    }
    menuWrap.appendChild(menu);
    rightCol.appendChild(menuWrap);

    /* Caption + step controls */
    const caption = document.createElement('div');
    caption.className = 'poke-caption sc0-mdp-caption';
    rightCol.appendChild(caption);

    const ctrls = document.createElement('div');
    ctrls.className = 'sc0-mdp-ctrls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="mdp-overlay-prev">' + T('mdp.prev') + '</button>' +
      '<div class="sc0-mdp-step">' + T('mdp.step_of') + '</div>' +
      '<button class="poke-btn" id="mdp-overlay-next">' + T('mdp.next') + '</button>';
    rightCol.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote';
    hint.innerHTML = T('mdp.hint');
    wrap.appendChild(hint);

    /* ---------- Step state machine ---------- */
    function fireAttackAnimation() {
      stage.classList.remove('sc0-attacking');
      void stage.offsetWidth;
      stage.classList.add('sc0-attacking');
      const flash = document.createElement('div');
      flash.className = 'sc0-damage-flash';
      flash.textContent = T('hp.damage_minus', { n: 1 });
      stage.appendChild(flash);
      setTimeout(() => flash.remove(), 1100);
      setTimeout(() => stage.classList.remove('sc0-attacking'), 1100);
    }

    function applyStep(c) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, c));
      hpWrap.classList.toggle('show', step >= 1);
      menuWrap.classList.toggle('show', step >= 2);
      overlay.querySelector('.mdp-tag-s').classList.toggle('show', step >= 1);
      overlay.querySelector('.mdp-tag-a').classList.toggle('show', step >= 2);
      overlay.querySelector('.mdp-tag-p').classList.toggle('show', step >= 3);
      caption.innerHTML = T('mdp.step.' + step);
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

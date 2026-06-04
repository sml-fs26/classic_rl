/* Scene 3 - "What makes this an MDP?" (the formalization).
 *
 *   Names the five MDP ingredients for the deal the learner just ran, one
 *   click at a time, hung on the LadderCard they have already seen. A left
 *   "stage" (the big LadderCard + floating part-tags + lever cards + STAGE
 *   DIE) and a right "panel" (a KaTeX formula slot + manager / formal copy +
 *   nav). Ports the pedagogy of last-minute-pricing/scene3 and re-themes it
 *   wholesale to the pipeline domain (rungs / levers / STAGE DIE / SIGNED /
 *   LOST). LMP folds four parts into <S,A,P,R>; here gamma is its own
 *   ingredient, so the ladder is five steps and lands on (S, A, P, R, gamma).
 *
 *   5-step ladder (step 0..4):
 *     0  the five parts named, five floating tags around the card
 *     1  STATE  s in {COLD..READY} U {SIGNED, LOST}  -> the card IS the state
 *     2  ACTION a in {NURTURE, DEMO, HARD CLOSE}     -> the three levers light
 *     3  TRANSITION P + REWARD R  -> the STAGE DIE rolls; the card hops a rung
 *     4  the 5-tuple (S, A, P, R, gamma)              -> bridge to the policy scene
 *
 *   Cold entry safe: reads window.Pipeline / window.Levers / window.DATA only.
 *   &run: marks the STAGE DIE roll button [data-run-primary] so the headless
 *   shot lands on the richest (transition) frame.
 *   Contract: window.scenes.scene3 = function(root){ return {onEnter,...}; }
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;
  const LEVERS = (window.DATA && window.DATA.levers) ||
    (window.Levers && window.Levers.LEVERS) || [];
  const STEP_COUNT = 5;                           // ingredients 0..4

  /* The situation we narrate the transition on: ENGAGED (a generic inner
     rung, same hero as the Bellman scene) under DEMO (the steady middle
     lever). DEMO from ENGAGED has a clean UP face, so the die reads as a
     warm result without dressing it up as the optimal answer. */
  const DEMO_RUNG = 2;          // ENGAGED
  const DEMO_LEVER = 'demo';

  function rungName(r) { return T('rung.' + P.RUNGS[r], P.RUNG_DISPLAY[r]); }

  window.scenes.scene3 = function (root) {
    root.classList.add('scene-pad', 'sc3-scene');
    root.innerHTML = '';

    let step = 0;
    let die = null;             // StageDie handle, mounted lazily on step 3
    let rollBusy = false;

    /* ---------- Title + lede ---------- */
    const head = document.createElement('div');
    head.className = 'sc3-head';
    head.innerHTML =
      '<h2 class="poke-section-title sc3-title">' + T('scene.title3') + '</h2>' +
      '<p class="poke-caption sc3-lede">' + T('scene3.lede') + '</p>';
    root.appendChild(head);

    /* ---------- Two-column body: stage (left) + panel (right) ---------- */
    const body = document.createElement('div');
    body.className = 'sc3-body';
    root.appendChild(body);

    /* ===== LEFT: the LadderCard stage with the MDP part-tags ===== */
    const stage = document.createElement('div');
    stage.className = 'sc3-stage';
    body.appendChild(stage);

    const stageLabel = document.createElement('div');
    stageLabel.className = 'sc3-stage-label';
    stageLabel.textContent = T('scene3.board.label');
    stage.appendChild(stageLabel);

    /* The LadderCard itself, live so the die can hop it on the transition. */
    const cardWrap = document.createElement('div');
    cardWrap.className = 'sc3-card-wrap';
    stage.appendChild(cardWrap);

    const cardHost = document.createElement('div');
    cardHost.className = 'sc3-card-host';
    cardWrap.appendChild(cardHost);
    const card = window.LadderCard.mount(cardHost, { rung: DEMO_RUNG, size: 'lg' });

    /* The five floating MDP part-tags, positioned around the card. Each has a
       step-gate so they fade in as the ladder advances. */
    const overlay = document.createElement('div');
    overlay.className = 'sc3-overlay';
    overlay.innerHTML =
      '<div class="sc3-tag sc3-tag-s" data-part="s">' + T('scene3.s0.tagS') + '</div>' +
      '<div class="sc3-tag sc3-tag-a" data-part="a">' + T('scene3.s0.tagA') + '</div>' +
      '<div class="sc3-tag sc3-tag-p" data-part="p">' + T('scene3.s0.tagP') + '</div>' +
      '<div class="sc3-tag sc3-tag-r" data-part="r">' + T('scene3.s0.tagR') + '</div>' +
      '<div class="sc3-tag sc3-tag-g" data-part="g">' + T('scene3.s0.tagG') + '</div>';
    cardWrap.appendChild(overlay);

    /* The three lever cards (the action set), revealed at step 2. */
    const levers = document.createElement('div');
    levers.className = 'sc3-levers';
    let leverHtml = '';
    for (const L of LEVERS) {
      const tone = (window.Levers && window.Levers.toneClass(L.id)) || '';
      const icon = (window.Levers && window.Levers.leverIconSvg(L.id)) || '';
      leverHtml +=
        '<span class="sc3-lever ' + tone + '" data-lever="' + L.id + '">' +
          '<span class="sc3-lever-icon">' + icon + '</span>' +
          '<span class="sc3-lever-name">' + T('lever.' + L.id) + '</span>' +
        '</span>';
    }
    levers.innerHTML = leverHtml;
    stage.appendChild(levers);

    /* The STAGE DIE row, revealed at step 3. The die owns the flip + chip;
       the scene hops the card a rung when the land settles. */
    const dieRow = document.createElement('div');
    dieRow.className = 'sc3-die-row';
    dieRow.innerHTML = '<div class="sc3-die-label">' + T('scene3.s3.dieLabel') + '</div>';
    const dieHost = document.createElement('div');
    dieHost.className = 'sc3-die-host';
    dieRow.appendChild(dieHost);
    const rollBtn = document.createElement('button');
    rollBtn.type = 'button';
    rollBtn.className = 'poke-btn sc3-roll-btn';
    rollBtn.setAttribute('data-run-primary', '');
    rollBtn.textContent = T('scene3.s3.roll');
    dieRow.appendChild(rollBtn);
    stage.appendChild(dieRow);

    /* ===== RIGHT: the formula / copy panel ===== */
    const panel = document.createElement('div');
    panel.className = 'sc3-panel poke-box';
    body.appendChild(panel);

    /* Ingredient rail (which of the five parts we are on). */
    const rail = document.createElement('div');
    rail.className = 'sc3-rail';
    const RAIL = [
      { gate: 1, key: 'scene3.rail.s', cls: 'sc3-rail-s' },
      { gate: 2, key: 'scene3.rail.a', cls: 'sc3-rail-a' },
      { gate: 3, key: 'scene3.rail.p', cls: 'sc3-rail-p' },
      { gate: 3, key: 'scene3.rail.r', cls: 'sc3-rail-r' },
      { gate: 4, key: 'scene3.rail.g', cls: 'sc3-rail-g' },
    ];
    rail.innerHTML = RAIL.map(function (r) {
      return '<span class="sc3-rail-chip ' + r.cls + '">' + T(r.key) + '</span>';
    }).join('');
    panel.appendChild(rail);

    const ptitle = document.createElement('h3');
    ptitle.className = 'sc3-ptitle';
    panel.appendChild(ptitle);

    /* The KaTeX formula slot (math is language-independent). */
    const formula = document.createElement('div');
    formula.className = 'sc3-formula poke-formula';
    panel.appendChild(formula);

    /* Manager-meaning copy, then the formal note, then a footnote. */
    const manager = document.createElement('p');
    manager.className = 'sc3-manager';
    panel.appendChild(manager);

    const formal = document.createElement('p');
    formal.className = 'sc3-formal';
    panel.appendChild(formal);

    const foot = document.createElement('p');
    foot.className = 'sc3-foot';
    panel.appendChild(foot);

    /* ---------- Nav controls ---------- */
    const ctrls = document.createElement('div');
    ctrls.className = 'sc3-ctrls';
    ctrls.innerHTML =
      '<button class="poke-btn sc3-nav" id="sc3-prev" type="button">' + T('scene3.prev') + '</button>' +
      '<span class="sc3-stepof" id="sc3-stepof"></span>' +
      '<button class="poke-btn sc3-nav" id="sc3-next" type="button">' + T('scene3.next') + '</button>';
    panel.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote sc3-hint';
    hint.innerHTML = T('scene3.hint');
    root.appendChild(hint);

    const prevBtn = ctrls.querySelector('#sc3-prev');
    const nextBtn = ctrls.querySelector('#sc3-next');
    const stepofEl = ctrls.querySelector('#sc3-stepof');

    /* ---------- STAGE DIE demo (step 3) ---------- */
    function rollDie() {
      /* If a headless &run click arrives early, make sure we are on the
         transition step so the die row is on screen before it spins. */
      if (step !== 3) { applyStep(3); return; }
      if (rollBusy) return;
      if (!die) die = window.StageDie.mount(dieHost);
      rollBusy = true;
      rollBtn.disabled = true;
      /* Reset the card to the demo rung so a re-roll reads clean. */
      card.set(DEMO_RUNG);
      /* A scripted UP hop (ENGAGED -> EVALUATING) under DEMO: a warm, clean
         result that shows the die moving the lead a rung and paying -1. The
         odds themselves are stated in the copy, not faked here. */
      const log = {
        lever: DEMO_LEVER, face: 'up',
        fromRung: DEMO_RUNG, toRung: DEMO_RUNG + 1,
        signed: false, lost: false,
      };
      die.roll(log, { reward: P.TOUCH_REWARD }).then(function () {
        card.set(DEMO_RUNG + 1);
        rollBusy = false;
        rollBtn.disabled = false;
      });
    }
    rollBtn.addEventListener('click', rollDie);

    /* ---------- Step state machine ---------- */
    function renderFormula() {
      formula.innerHTML = '';
      if (step === 0) {
        window.Katex.render(String.raw`\langle\, S,\; A,\; P,\; R,\; \gamma \,\rangle`, formula, true);
      } else if (step === 1) {
        window.Katex.render(
          String.raw`s \in S \;=\; \{\,\text{COLD} \ldots \text{READY}\,\} \cup \{\,\text{SIGNED},\, \text{LOST}\,\}`,
          formula, true
        );
      } else if (step === 2) {
        window.Katex.render(
          String.raw`a \in A \;=\; \{\,\text{NURTURE},\; \text{DEMO},\; \text{HARD\,CLOSE}\,\}`,
          formula, true
        );
      } else if (step === 3) {
        window.Katex.render(
          String.raw`P(s', r \mid s, a) \qquad r \in \{\,-1,\; +30,\; -10\,\}`,
          formula, true
        );
      } else {
        window.Katex.render(String.raw`\langle\, S,\; A,\; P,\; R,\; \gamma=1 \,\rangle`, formula, true);
      }
    }

    function applyStep(c) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, c));

      /* Part-tags: all five glow on step 0; from step 1 only the active part
         stays lit so the eye lands on the right corner. */
      const tagS = overlay.querySelector('.sc3-tag-s');
      const tagA = overlay.querySelector('.sc3-tag-a');
      const tagP = overlay.querySelector('.sc3-tag-p');
      const tagR = overlay.querySelector('.sc3-tag-r');
      const tagG = overlay.querySelector('.sc3-tag-g');
      tagS.classList.toggle('show', step === 0 || step === 1);
      tagA.classList.toggle('show', step === 0 || step === 2);
      tagP.classList.toggle('show', step === 0 || step === 3);
      tagR.classList.toggle('show', step === 0 || step === 3);
      tagG.classList.toggle('show', step === 0 || step === 4);

      /* Lever cards appear at the action step and stay. Highlight the demo
         lever from step 3 (the lever the die is pulling). */
      levers.classList.toggle('show', step >= 2);
      for (const tag of levers.querySelectorAll('.sc3-lever')) {
        tag.classList.toggle('is-demo', step >= 3 && tag.dataset.lever === DEMO_LEVER);
      }

      /* STAGE DIE appears at the transition step. */
      dieRow.classList.toggle('show', step >= 3);

      /* Keep the card on the demo rung except while showing the transition. */
      if (step < 3) card.set(DEMO_RUNG);

      /* Rail chip highlighting. */
      const chips = rail.querySelectorAll('.sc3-rail-chip');
      chips.forEach(function (chip, i) {
        const r = RAIL[i];
        const on = (step === 0) ? false : (r.gate === step);
        chip.classList.toggle('active', on);
        chip.classList.toggle('done', step > 0 && r.gate < step);
      });

      /* Copy + formula per step. */
      renderFormula();
      if (step === 0) {
        ptitle.textContent = T('scene3.s0.title');
        manager.innerHTML = T('scene3.s0.body');
        formal.innerHTML = '';
        foot.innerHTML = '';
      } else if (step === 1) {
        ptitle.textContent = T('scene3.s1.title');
        manager.innerHTML = T('scene3.s1.manager');
        formal.innerHTML = T('scene3.s1.formal');
        foot.innerHTML = T('scene3.s1.foot');
      } else if (step === 2) {
        ptitle.textContent = T('scene3.s2.title');
        manager.innerHTML = T('scene3.s2.manager');
        formal.innerHTML = T('scene3.s2.formal');
        foot.innerHTML = '';
      } else if (step === 3) {
        ptitle.textContent = T('scene3.s3.title');
        manager.innerHTML = T('scene3.s3.manager');
        formal.innerHTML = T('scene3.s3.formalP') + '<br><br>' + T('scene3.s3.formalR');
        foot.innerHTML = T('scene3.s3.foot');
      } else {
        ptitle.textContent = T('scene3.s4.title');
        manager.innerHTML = T('scene3.s4.body');
        formal.innerHTML = T('scene3.s4.gamma');
        foot.innerHTML = T('scene3.s4.next');
      }

      stepofEl.textContent = T('scene3.stepOf', { i: step + 1, n: STEP_COUNT });
      prevBtn.classList.toggle('is-edge', step === 0);
      nextBtn.classList.toggle('is-edge', step === STEP_COUNT - 1);

      /* Fire the die when we land on step 3 (skip the spin under autorun so
         the headless click lands the frame instantly). */
      if (step === 3) rollDie();
    }

    function goNext() {
      if (step < STEP_COUNT - 1) { applyStep(step + 1); return true; }
      return false;
    }
    function goPrev() {
      if (step > 0) { applyStep(step - 1); return true; }
      return false;
    }

    nextBtn.addEventListener('click', function () { goNext(); });
    prevBtn.addEventListener('click', function () { goPrev(); });

    applyStep(0);

    return {
      onEnter() { applyStep(step); },
      onNextKey() { return goNext(); },
      onPrevKey() { return goPrev(); },
    };
  };
})();

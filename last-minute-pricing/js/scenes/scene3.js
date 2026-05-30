/* scene3 -- "What makes this an MDP?" (Formalization).
 *
 *   Slides the four MDP parts over a shelf card the learner "just played",
 *   one click at a time. Reskins the Pokemon sceneMdpOverlay step-ladder into
 *   the pricing shelf-card idiom.
 *
 *   5-part ladder (step 0..4):
 *     0  the four parts named, four floating tags on the card
 *     1  STATE  s = (u, d)            -> the shelf card IS the state
 *     2  ACTION a in {PREM,STD,FIRE}  -> the three lever tags light up
 *     3  TRANSITION P(s',r|s,a) + REWARD r = price x units sold
 *           -> a demand-draw deck flips, tickets slide, the +$ flash fires
 *     4  the 4-tuple  <S, A, P, R>     -> bridge to the policy scene
 *
 *   Cold entry safe: reads window.Pricing / window.Levers / window.DATA only.
 *   Contract: window.scenes.scene3 = function(root){ return {onEnter,...}; } */
(function () {
  if (!window.scenes) window.scenes = {};

  const T = (k, v) => window.I18N.t(k, v);
  const P = window.Pricing;
  const LEVERS = window.Levers.LEVERS;            // [{id,name,price,demand}]
  const STEP_COUNT = 5;                           // parts 0..4

  /* The situation we narrate: a healthy shelf with comfortable runway, the
     same opening the learner started scene 2 from. Read from the engine so
     the icon and the math agree. */
  const DEMO = { u: 5, d: 4 };
  /* The lever we demo at the transition step: STANDARD (the steady middle).
     We pick its modal sale (k = 1) so the +$ flash shows a concrete payoff
     without claiming an optimal answer. r is computed, never typed. */
  const DEMO_LEVER = 'standard';
  const DEMO_K = 1;

  window.scenes.scene3 = function (root) {
    root.className = 'scene-pad sc3-root';
    root.innerHTML = '';

    let step = 0;
    let drawHandle = null;     // Deck handle, mounted lazily on step 3

    /* ---------- Title + lede ---------- */
    const head = document.createElement('div');
    head.className = 'sc3-head';
    head.innerHTML =
      '<h2 class="poke-subtitle sc3-title">' + T('scene3.title') + '</h2>' +
      '<p class="poke-caption sc3-lede">' + T('scene3.lede') + '</p>';
    root.appendChild(head);

    /* ---------- Two-column body: stage (left) + panel (right) ---------- */
    const body = document.createElement('div');
    body.className = 'sc3-body';
    root.appendChild(body);

    /* ===== LEFT: the shelf-card stage with the MDP overlay tags ===== */
    const stage = document.createElement('div');
    stage.className = 'sc3-stage';
    body.appendChild(stage);

    const stageLabel = document.createElement('div');
    stageLabel.className = 'sc3-stage-label';
    stageLabel.textContent = T('scene3.board.label');
    stage.appendChild(stageLabel);

    /* The shelf card itself, live so we can drive the demand draw. */
    const cardWrap = document.createElement('div');
    cardWrap.className = 'sc3-card-wrap';
    stage.appendChild(cardWrap);

    const cardHost = document.createElement('div');
    cardHost.className = 'sc3-card-host';
    cardWrap.appendChild(cardHost);
    const card = window.ShelfCard.mount(cardHost, { u: DEMO.u, d: DEMO.d, size: 'lg', label: true });

    /* The four floating MDP tags, positioned around the card. Each has a
       step-gate so we fade them in as the ladder advances. */
    const overlay = document.createElement('div');
    overlay.className = 'sc3-overlay';
    overlay.innerHTML =
      '<div class="sc3-tag sc3-tag-s" data-part="s">' + T('scene3.s0.tagS') + '</div>' +
      '<div class="sc3-tag sc3-tag-a" data-part="a">' + T('scene3.s0.tagA') + '</div>' +
      '<div class="sc3-tag sc3-tag-p" data-part="p">' + T('scene3.s0.tagP') + '</div>' +
      '<div class="sc3-tag sc3-tag-r" data-part="r">' + T('scene3.s0.tagR') + '</div>';
    cardWrap.appendChild(overlay);

    /* The three lever tags (the action set), revealed at step 2. */
    const levers = document.createElement('div');
    levers.className = 'sc3-levers';
    let leverHtml = '';
    for (const L of LEVERS) {
      leverHtml +=
        '<span class="lever-tag" data-lever="' + L.id + '">' +
          T('lever.' + L.id) +
          '<span class="lever-price">' + T('vocab.dollar') + L.price + '</span>' +
        '</span>';
    }
    levers.innerHTML = leverHtml;
    stage.appendChild(levers);

    /* The demand deck + reveal row, revealed at step 3. The deck owns the
       card flip; the scene owns the ticket-slide on the shelf and the +$. */
    const drawRow = document.createElement('div');
    drawRow.className = 'sc3-draw';
    drawRow.innerHTML = '<div class="sc3-draw-label">' + T('scene3.s3.drawLabel') + '</div>';
    const deckHost = document.createElement('div');
    deckHost.className = 'sc3-deck-host';
    drawRow.appendChild(deckHost);
    stage.appendChild(drawRow);

    /* ===== RIGHT: the formula / copy panel ===== */
    const panel = document.createElement('div');
    panel.className = 'sc3-panel poke-box';
    body.appendChild(panel);

    /* Step rail (which of the four parts we are on). */
    const rail = document.createElement('div');
    rail.className = 'sc3-rail';
    const RAIL = [
      { gate: 0, key: 'scene3.rail.parts', cls: 'sc3-rail-all' },
      { gate: 1, key: 'scene3.rail.s', cls: 'sc3-rail-s' },
      { gate: 2, key: 'scene3.rail.a', cls: 'sc3-rail-a' },
      { gate: 3, key: 'scene3.rail.p', cls: 'sc3-rail-p' },
      { gate: 3, key: 'scene3.rail.r', cls: 'sc3-rail-r' },
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

    /* Manager-meaning copy (lead), then the formal note. */
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
      '<button class="poke-btn" id="sc3-prev" type="button">' + T('scene3.prev') + '</button>' +
      '<span class="sc3-stepof" id="sc3-stepof"></span>' +
      '<button class="poke-btn" id="sc3-next" type="button">' + T('scene3.next') + '</button>';
    panel.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote sc3-hint';
    hint.innerHTML = T('scene3.hint');
    root.appendChild(hint);

    const prevBtn = ctrls.querySelector('#sc3-prev');
    const nextBtn = ctrls.querySelector('#sc3-next');
    const stepofEl = ctrls.querySelector('#sc3-stepof');

    /* ---------- Demand-draw demo (step 3) ---------- */
    function runDraw() {
      if (!drawHandle) {
        drawHandle = window.Deck.mount(deckHost, {});
      } else {
        drawHandle.reset();
      }
      /* Reset the shelf to full before the draw so a re-trigger reads clean. */
      card.set(DEMO.u, DEMO.d);
      const price = window.Levers.priceOf(DEMO_LEVER);
      const reward = price * Math.min(DEMO_K, DEMO.u);

      drawRow.classList.add('is-armed');
      const p = drawHandle.flip({ lever: DEMO_LEVER, k: DEMO_K });
      /* Slide DEMO_K tickets off the shelf as the card lands, with a +$ flash
         in the lever colour. */
      const slideAt = Math.round(window.Deck.TIMING.flipMs * 0.55);
      setTimeout(function () {
        card.set(DEMO.u - Math.min(DEMO_K, DEMO.u), DEMO.d);
        card.setLever(DEMO_LEVER);
        spawnMoneyFlash(reward);
      }, slideAt);
      return p;
    }

    function spawnMoneyFlash(amount) {
      const el = document.createElement('div');
      el.className = 'sc3-money-flash lever-fill-' + DEMO_LEVER;
      el.textContent = '+' + T('vocab.dollar') + amount;
      cardWrap.appendChild(el);
      setTimeout(function () { try { cardWrap.removeChild(el); } catch (e) {} }, 1300);
    }

    /* ---------- Step state machine ---------- */
    function renderFormula() {
      formula.innerHTML = '';
      if (step === 0) {
        window.Katex.render(window.DATA.tex.mdpTuple, formula, true);
      } else if (step === 1) {
        window.Katex.render(String.raw`s \;=\; (u,\; d)`, formula, true);
      } else if (step === 2) {
        window.Katex.render(
          String.raw`a \in A \;=\; \{\,\text{PREMIUM},\; \text{STANDARD},\; \text{FIRE\text{-}SALE}\,\}`,
          formula, true
        );
      } else if (step === 3) {
        window.Katex.render(
          String.raw`P(s', r \mid s, a)\qquad r = \text{price}\times(\text{units sold})`,
          formula, true
        );
      } else {
        window.Katex.render(window.DATA.tex.mdpTuple, formula, true);
      }
    }

    function applyStep(c) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, c));

      /* Overlay tags: all four glow on step 0; from step 1 only the active
         part stays lit so the eye lands on the right corner. */
      const tagS = overlay.querySelector('.sc3-tag-s');
      const tagA = overlay.querySelector('.sc3-tag-a');
      const tagP = overlay.querySelector('.sc3-tag-p');
      const tagR = overlay.querySelector('.sc3-tag-r');
      tagS.classList.toggle('show', step === 0 || step === 1);
      tagA.classList.toggle('show', step === 0 || step === 2);
      tagP.classList.toggle('show', step === 0 || step === 3);
      tagR.classList.toggle('show', step === 0 || step === 3);

      /* Lever rail appears at the action step and stays. */
      levers.classList.toggle('show', step >= 2);
      /* Highlight none on step 2 (the set), but on step 3 mark the demo lever. */
      for (const tag of levers.querySelectorAll('.lever-tag')) {
        tag.classList.toggle('is-demo', step >= 3 && tag.dataset.lever === DEMO_LEVER);
      }

      /* Demand deck appears at the transition step. */
      drawRow.classList.toggle('show', step >= 3);

      /* Card lever-tint only while we are showing the sale outcome. */
      if (step < 3) { card.set(DEMO.u, DEMO.d); card.setLever(null); }

      /* Rail chip highlighting. */
      const chips = rail.querySelectorAll('.sc3-rail-chip');
      chips.forEach(function (chip, i) {
        const r = RAIL[i];
        let on;
        if (step === 0) on = (i === 0);
        else on = (r.gate === step);
        chip.classList.toggle('active', on);
        chip.classList.toggle('done', step > 0 && r.gate < step && r.gate > 0);
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

      /* Fire the demand draw when we land on step 3. */
      if (step === 3) {
        runDraw();
      }
    }

    function goNext() {
      if (step < STEP_COUNT - 1) { applyStep(step + 1); return true; }
      return false;
    }
    function goPrev() {
      if (step > 0) { applyStep(step - 1); return true; }
      return false;
    }

    nextBtn.addEventListener('click', function () {
      if (!goNext()) window.PriceViz && window.PriceViz.goTo(window.PriceViz.getCurrentScene() + 1);
    });
    prevBtn.addEventListener('click', function () {
      if (!goPrev()) window.PriceViz && window.PriceViz.goTo(window.PriceViz.getCurrentScene() - 1);
    });

    applyStep(0);

    /* &run: jump to the demand-draw step for headless capture (the richest
       frame). Read the global the foundation sets from the hash. */
    if (window.PRICING_AUTORUN) {
      setTimeout(function () { applyStep(3); }, 180);
    }

    return {
      onEnter() { applyStep(step); },
      onNextKey() { return goNext(); },
      onPrevKey() { return goPrev(); },
    };
  };
})();

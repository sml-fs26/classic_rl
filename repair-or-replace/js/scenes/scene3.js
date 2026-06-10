/* Scene 3, "What makes this an MDP?" (earns the MDP badge).
 *
 *   Names the four operational pieces + gamma of the van problem, one
 *   internal step at a time, assembling the KaTeX tuple as it goes:
 *
 *     step 0  intro: the fleet sheet has been hiding a formal object
 *     step 1  STATE      highlight the wear strip          S ticks
 *     step 2  ACTION     highlight the three call chips    A ticks
 *     step 3  TRANSITION highlight the arrows + one printed-odds example
 *                        (RUN at WORN, from DATA.model)    P ticks
 *     step 4  REWARD     highlight the money row           R ticks
 *     step 5  GAMMA      the patience dial 0.9; the full tuple renders
 *
 *   Board (left): the wear strip, 4 state chips (name + compact VanCard
 *   gauge swatch) joined by thin rightward degradation arrows, plus a
 *   distinct breakdown arc from every state to FAILING with its printed
 *   probability; below it the three action chips and the money row.
 *   Panel (right): per-step formula + manager copy + internal nav.
 *
 *   Every number on screen reads from window.DATA.model. The optimal
 *   policy is never shown or hinted (that is scene 7's job).
 *
 *   Cold entry safe (deep link #scene=3). Optional &step=K hash flag
 *   jumps the internal ladder for headless capture; &run presses the
 *   internal NEXT once ([data-run-primary]).
 *   Contract: window.scenes.scene3 = function(root){ return {...}; };
 */
(function () {
  window.scenes = window.scenes || {};

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const STEP_COUNT = 6;

  window.scenes.scene3 = function (root) {
    root.classList.add('scene-pad', 'scene3-scene');
    root.innerHTML = '';

    const Van = window.Van;
    const Actions = window.Actions;
    const M = (window.DATA && window.DATA.model) || {
      revRun: Van.REV_RUN, pBreakdown: Van.P_BD, breakdownCost: Van.BREAKDOWN_COST,
      degrade: Van.DEGR, serviceCost: Van.C_SERVICE, serviceUp: Van.SERV_UP,
      replaceCost: Van.C_REPLACE, gamma: Van.GAMMA,
    };
    const NS = Van.NUM_STATES;                  // 4
    const pct = (p) => Math.round(p * 100);

    let step = 0;

    /* ---------- Title + lede ---------- */
    const head = document.createElement('div');
    head.className = 's3-head';
    head.innerHTML =
      '<h2 class="poke-section-title s3-title">What makes this an MDP?</h2>' +
      '<p class="poke-caption s3-lede">The weeks you just ran were not vibes. ' +
      'Underneath sat a machine with five parts. Step through them.</p>';
    root.appendChild(head);

    /* ---------- The assembling tuple rail ---------- */
    const TUPLE = [
      { tex: 'S', lab: 'STATE' },
      { tex: 'A', lab: 'ACTIONS' },
      { tex: 'P', lab: 'ODDS' },
      { tex: 'R', lab: 'MONEY' },
      { tex: '\\gamma', lab: 'PATIENCE' },
    ];
    const rail = document.createElement('div');
    rail.className = 's3-tuple';
    const brkL = document.createElement('span');
    brkL.className = 's3-tbrk';
    window.Katex.render('\\langle', brkL, false);
    rail.appendChild(brkL);
    const tupleChips = [];
    TUPLE.forEach(function (t, i) {
      if (i > 0) {
        const c = document.createElement('span');
        c.className = 's3-tcomma';
        window.Katex.render(',', c, false);
        rail.appendChild(c);
      }
      const chip = document.createElement('div');
      chip.className = 's3-tchip ghost';
      const sym = document.createElement('span');
      sym.className = 's3-tsym';
      window.Katex.render(t.tex, sym, false);
      chip.appendChild(sym);
      const lab = document.createElement('span');
      lab.className = 's3-tlab';
      lab.textContent = t.lab;
      chip.appendChild(lab);
      rail.appendChild(chip);
      tupleChips.push(chip);
    });
    const brkR = document.createElement('span');
    brkR.className = 's3-tbrk';
    window.Katex.render('\\rangle', brkR, false);
    rail.appendChild(brkR);
    root.appendChild(rail);

    /* ---------- Two-column body ---------- */
    const body = document.createElement('div');
    body.className = 's3-body';
    root.appendChild(body);

    /* ===== LEFT: the board ===== */
    const board = document.createElement('div');
    board.className = 's3-board';
    board.dataset.hot = 'none';
    body.appendChild(board);

    const boardLabel = document.createElement('div');
    boardLabel.className = 's3-board-label';
    boardLabel.textContent = "OLD BESSIE'S WEEK";
    board.appendChild(boardLabel);

    /* --- The wear strip (4 state chips + arrows) --- */
    const secStrip = document.createElement('div');
    secStrip.className = 's3-sec s3-sec-strip';
    secStrip.innerHTML = '<div class="s3-sec-label">THE GAUGE: FOUR WEAR LEVELS</div>';
    board.appendChild(secStrip);

    const stripRow = document.createElement('div');
    stripRow.className = 's3-striprow';
    secStrip.appendChild(stripRow);

    const degArrowSvg =
      '<svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true">' +
        '<line x1="1" y1="5" x2="16" y2="5" stroke="currentColor" stroke-width="2"/>' +
        '<path d="M15 1 L23 5 L15 9 Z" fill="currentColor"/></svg>';

    const chipEls = [];
    for (let w = 0; w < NS; w++) {
      if (w > 0) {
        const deg = document.createElement('span');
        deg.className = 's3-deg';
        deg.innerHTML = degArrowSvg;
        stripRow.appendChild(deg);
      }
      const chip = document.createElement('div');
      chip.className = 's3-chip s3-chipw' + w;
      const name = document.createElement('span');
      name.className = 's3-chip-name';
      name.textContent = Van.stateName(w);
      chip.appendChild(name);
      const gaugeHost = document.createElement('span');
      gaugeHost.className = 's3-chip-gauge';
      chip.appendChild(gaugeHost);
      window.VanCard.mount(gaugeHost, { wear: w, compact: true });
      stripRow.appendChild(chip);
      chipEls.push(chip);
    }

    /* --- Breakdown-arc band under the chips (drawn from measurements) --- */
    const band = document.createElement('div');
    band.className = 's3-band';
    secStrip.appendChild(band);
    const arcSvg = document.createElementNS(SVG_NS, 'svg');
    arcSvg.setAttribute('class', 's3-arcsvg');
    arcSvg.setAttribute('aria-hidden', 'true');
    band.appendChild(arcSvg);

    const BAND_H = 60;
    function drawArcs() {
      const W = stripRow.clientWidth;
      if (!W || W < 80) return;
      const c = chipEls.map((el) => el.offsetLeft + el.offsetWidth / 2);
      arcSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + BAND_H);
      arcSvg.setAttribute('width', W);
      arcSvg.setAttribute('height', BAND_H);
      while (arcSvg.firstChild) arcSvg.removeChild(arcSvg.firstChild);

      function head(tx) {
        const p = document.createElementNS(SVG_NS, 'polygon');
        p.setAttribute('class', 's3-arc-head');
        p.setAttribute('points',
          (tx - 4) + ',10 ' + (tx + 4) + ',10 ' + tx + ',1');
        arcSvg.appendChild(p);
      }
      function label(x, y, txt, anchor) {
        const t = document.createElementNS(SVG_NS, 'text');
        t.setAttribute('class', 's3-arc-label');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        if (anchor) t.setAttribute('text-anchor', anchor);
        t.textContent = txt;
        arcSvg.appendChild(t);
      }

      /* Arcs HEALTHY / WORN / SHAKY -> FAILING. */
      for (let i = 0; i < NS - 1; i++) {
        const sx = c[i];
        const tx = c[NS - 1] - 28 + i * 13;
        const depth = 52 - i * 11;
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 's3-arc');
        path.setAttribute('d',
          'M ' + sx + ' 2 C ' + sx + ' ' + depth + ', ' + tx + ' ' + depth +
          ', ' + tx + ' 9');
        arcSvg.appendChild(path);
        head(tx);
        label(sx - 7, 14, pct(M.pBreakdown[i]) + '%', 'end');
      }
      /* FAILING's own breakdown: a small self-loop. */
      const c3 = c[NS - 1];
      const loop = document.createElementNS(SVG_NS, 'path');
      loop.setAttribute('class', 's3-arc');
      loop.setAttribute('d',
        'M ' + (c3 + 8) + ' 2 C ' + (c3 + 2) + ' 38, ' + (c3 + 44) + ' 34, ' +
        (c3 + 18) + ' 9');
      arcSvg.appendChild(loop);
      head(c3 + 18);
      label(c3 + 24, 52, pct(M.pBreakdown[NS - 1]) + '%', 'middle');
    }

    const legend = document.createElement('div');
    legend.className = 's3-legend';
    legend.innerHTML =
      '<span class="s3-leg"><span class="s3-leg-deg">' + degArrowSvg +
        '</span> wear drifts right</span>' +
      '<span class="s3-leg"><span class="s3-leg-arc"></span> ' +
        'breakdown: tow to FAILING, odds printed</span>';
    secStrip.appendChild(legend);

    /* --- The three calls --- */
    const secAct = document.createElement('div');
    secAct.className = 's3-sec s3-sec-actions';
    secAct.innerHTML = '<div class="s3-sec-label">THE THREE CALLS</div>';
    board.appendChild(secAct);
    const actRow = document.createElement('div');
    actRow.className = 's3-actrow';
    secAct.appendChild(actRow);
    for (const a of Actions.ACTIONS) {
      const el = document.createElement('span');
      el.className = 's3-act ' + Actions.toneClass(a.id);
      el.innerHTML =
        '<span class="s3-act-top"><span class="s3-act-icon">' +
          Actions.leverIconSvg(a.id) + '</span>' + a.name + '</span>' +
        '<span class="s3-act-gloss">' + a.gloss + '</span>';
      actRow.appendChild(el);
    }

    /* --- The money row --- */
    const secMoney = document.createElement('div');
    secMoney.className = 's3-sec s3-sec-money';
    secMoney.innerHTML = '<div class="s3-sec-label">THE MONEY</div>';
    board.appendChild(secMoney);
    const moneyRow = document.createElement('div');
    moneyRow.className = 's3-moneyrow';
    secMoney.appendChild(moneyRow);
    const MONEY = [
      { v: '+' + M.revRun[0],       lab: 'BEST WEEK', cls: 'm-run' },
      { v: '-' + M.serviceCost,     lab: 'SHOP',      cls: 'm-svc' },
      { v: '-' + M.replaceCost,     lab: 'STICKER',   cls: 'm-new' },
      { v: '-' + M.breakdownCost,   lab: 'TOW',       cls: 'm-tow' },
    ];
    for (const m of MONEY) {
      const el = document.createElement('span');
      el.className = 's3-money ' + m.cls;
      el.innerHTML =
        '<span class="s3-money-val">' + m.v + '</span>' +
        '<span class="s3-money-lab">' + m.lab + '</span>';
      moneyRow.appendChild(el);
    }

    /* ===== RIGHT: the panel ===== */
    const panel = document.createElement('div');
    panel.className = 's3-panel poke-box';
    body.appendChild(panel);

    const ptitle = document.createElement('h3');
    ptitle.className = 's3-ptitle';
    panel.appendChild(ptitle);

    const formula = document.createElement('div');
    formula.className = 's3-formula poke-formula';
    panel.appendChild(formula);

    const pbody = document.createElement('p');
    pbody.className = 's3-pbody';
    panel.appendChild(pbody);

    const extra = document.createElement('div');
    extra.className = 's3-extra';
    panel.appendChild(extra);

    const pfoot = document.createElement('p');
    pfoot.className = 's3-pfoot';
    panel.appendChild(pfoot);

    const ctrls = document.createElement('div');
    ctrls.className = 's3-ctrls';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'poke-btn s3-nav';
    prevBtn.innerHTML = '&#9666; BACK';
    const stepof = document.createElement('span');
    stepof.className = 's3-stepof';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'poke-btn s3-nav';
    nextBtn.setAttribute('data-run-primary', '');
    nextBtn.innerHTML = 'NEXT &#9656;';
    ctrls.appendChild(prevBtn);
    ctrls.appendChild(stepof);
    ctrls.appendChild(nextBtn);
    panel.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote s3-hint';
    hint.innerHTML =
      'Use <kbd>&#9656;</kbd> / <kbd>&#9666;</kbd> (or NEXT / PREV) to step ' +
      'the five parts. Press <kbd>n</kbd> for speaker notes.';
    root.appendChild(hint);

    /* ---------- Per-step copy ---------- */
    const bdPct = M.pBreakdown.map(pct);            // [2, 8, 28, 55]
    const wornBd = bdPct[1];
    const wornRow = M.degrade[1].map(pct);          // [30, 55, 15]

    function oddsExampleHtml() {
      return '' +
        '<div class="s3-odds">' +
          '<div class="s3-odds-head">P, ONE EXAMPLE: RUN AT WORN</div>' +
          '<div class="s3-odds-line s3-odds-bd">BREAKDOWN <b>' + wornBd +
            '%</b>: tow, land at FAILING</div>' +
          '<div class="s3-odds-line">NO BREAKDOWN <b>' + (100 - wornBd) +
            '%</b>, then the wear drifts:</div>' +
          '<div class="s3-odds-line s3-odds-sub">HOLD WORN <b>' + wornRow[0] +
            '%</b> &middot; +1 TO SHAKY <b>' + wornRow[1] +
            '%</b> &middot; +2 TO FAILING <b>' + wornRow[2] + '%</b></div>' +
        '</div>';
    }

    const STEPS = [
      {
        hot: 'none',
        title: 'FIVE MOVING PARTS',
        tex: '\\langle\\, S,\\; A,\\; P,\\; R,\\; \\gamma \\,\\rangle',
        ghost: true,
        body: 'Your fleet sheet has been hiding a formal object. Every week, ' +
          'the same loop: read the gauge, make one call, the week rolls, the ' +
          'money settles. Each part has a name.',
        extra: '',
        foot: 'The board on the left is the whole world. Step through its five parts.',
      },
      {
        hot: 'state',
        title: 'S: THE STATE',
        tex: 'S = \\{\\text{HEALTHY},\\, \\text{WORN},\\, \\text{SHAKY},\\, \\text{FAILING}\\}',
        body: 'What you can see Monday morning: <b>the gauge</b>. Four ' +
          'levels. The reading is the whole state. How Bessie got here does ' +
          'not matter, only where the needle sits now.',
        extra: '',
        foot: 'The strip of four chips IS the state space. One van, one chip at a time.',
      },
      {
        hot: 'action',
        title: 'A: THE ACTION',
        tex: 'A = \\{\\text{RUN},\\, \\text{SERVICE},\\, \\text{REPLACE}\\}',
        body: 'One call per week, picked from <b>three</b>. RUN earns the ' +
          'route. SERVICE parks her in the shop. REPLACE buys new. The call ' +
          'is the only thing you control.',
        extra: '',
        foot: 'Cheap to expensive, left to right. Every week takes exactly one.',
      },
      {
        hot: 'trans',
        title: 'P: THE TRANSITION ODDS',
        tex: "P(s' \\mid s, a)",
        body: 'Same call, different Mondays. <b>The world rolls.</b> You ' +
          'pick the call; the printed odds pick the landing.',
        extra: oddsExampleHtml(),
        foot: 'Red arcs: breakdown odds by state, ' + bdPct.join(' / ') +
          ' percent. Thin arrows: wear drifting right.',
      },
      {
        hot: 'reward',
        title: 'R: THE REWARD',
        tex: "R(s, a, s') \\;=\\; \\text{the week's net money}",
        body: 'Every week settles in <b>money</b>. The route pays up to +' +
          M.revRun[0] + '. The shop bills ' + M.serviceCost +
          '. A new van bills ' + M.replaceCost + '. A tow bills ' +
          M.breakdownCost + ' on top of the route.',
        extra: '',
        foot: 'A breakdown week still books its profit, then pays the ' +
          M.breakdownCost + ' tow on top. One number per week.',
      },
      {
        hot: 'all',
        title: 'GAMMA: THE PATIENCE DIAL',
        tex: '\\langle\\, S,\\; A,\\; P,\\; R,\\; \\gamma = ' + M.gamma + ' \\,\\rangle',
        display: true,
        body: 'Next week counts a little less than this week. The patience ' +
          'dial: <b>gamma = ' + M.gamma + '</b>. The fleet runs forever, ' +
          'no final week, and the discounted sum stays finite.',
        extra: '',
        foot: 'Four states, three actions, printed odds, weekly money: ' +
          'a Markov decision process.',
      },
    ];

    /* ---------- Step state machine (pure function of `step`) ---------- */
    function applyStep(k) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, k));
      const s = STEPS[step];

      board.dataset.hot = s.hot;
      secStrip.classList.toggle('hot', step === 1);
      secStrip.classList.toggle('arrows-hot', step === 3);
      secAct.classList.toggle('hot', step === 2);
      secMoney.classList.toggle('hot', step === 4);

      tupleChips.forEach(function (chip, i) {
        const lit = step >= i + 1;
        chip.classList.toggle('ghost', !lit);
        chip.classList.toggle('lit', lit);
        chip.classList.toggle('now', step === i + 1);
      });
      rail.classList.toggle('complete', step === STEP_COUNT - 1);

      ptitle.textContent = s.title;
      formula.innerHTML = '';
      formula.classList.toggle('ghosted', !!s.ghost);
      window.Katex.render(s.tex, formula, !!s.display);
      pbody.innerHTML = s.body;
      extra.innerHTML = s.extra;
      pfoot.innerHTML = s.foot;

      stepof.textContent = 'STEP ' + (step + 1) + ' / ' + STEP_COUNT;
      prevBtn.disabled = step === 0;
      nextBtn.disabled = step === STEP_COUNT - 1;
    }

    function goNext() {
      if (step < STEP_COUNT - 1) { applyStep(step + 1); return true; }
      return false;
    }
    function goPrev() {
      if (step > 0) { applyStep(step - 1); return true; }
      return false;
    }
    nextBtn.addEventListener('click', goNext);
    prevBtn.addEventListener('click', goPrev);

    window.addEventListener('resize', drawArcs);

    /* Initial step: 0, or the &step=K hash flag (headless capture). */
    const sm = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    applyStep(sm ? parseInt(sm[1], 10) : 0);
    requestAnimationFrame(drawArcs);

    return {
      onEnter() { applyStep(step); drawArcs(); },
      onNextKey() { return goNext(); },
      onPrevKey() { return goPrev(); },
    };
  };
})();

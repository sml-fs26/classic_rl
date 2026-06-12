/* Scene 3, "What makes this an MDP?" (earns the MDP badge).
 *
 *   The board starts EMPTY (title + faint slots) and BUILDS one part per
 *   step, assembling the KaTeX tuple as it goes. Eight internal steps:
 *
 *     step 0  intro      empty board, hollow tuple strip
 *     step 1  S          four wear chips draw in, staggered     S ticks
 *     step 2  A          three call buttons drop in             A ticks
 *     step 3  P (drift)  thin gray drift arrows draw in
 *     step 4  P (odds)   breakdown arcs draw one at a time      P ticks
 *     step 5  R          four money chips land one at a time    R ticks
 *     step 6  gamma      three shrinking coin stacks            g ticks
 *     step 7  punchline  the tuple strip flashes complete
 *
 *   Board (left): wear strip + breakdown-arc band, the three call chips,
 *   the money row, the patience coin stacks. Panel (right): per-step
 *   formula chip + at most two short lines + internal nav.
 *
 *   Every number on screen reads from window.DATA.model. The optimal
 *   policy is never shown or hinted (that is scene 7's job).
 *
 *   Cold entry safe (deep link #scene=3). Optional &step=K hash flag
 *   jumps the internal ladder for headless capture; &run presses the
 *   internal NEXT once ([data-run-primary]). Rewind restores the exact
 *   previous step (state is a pure function of `step`; animations are
 *   suppressed on backward / cold applies).
 *   Contract: window.scenes.scene3 = function(root){ return {...}; };
 */
(function () {
  window.scenes = window.scenes || {};

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const STEP_COUNT = 8;

  function reduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') || reduced();
  }

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
    const GAMMA = (M.gamma != null) ? M.gamma : Van.GAMMA;
    const pct = (p) => Math.round(p * 100);

    let step = 0;

    /* ---------- Title ---------- */
    const head = document.createElement('div');
    head.className = 's3-head';
    head.innerHTML =
      '<h2 class="poke-section-title s3-title">What makes this an MDP?</h2>';
    root.appendChild(head);

    /* ---------- The assembling tuple rail ---------- */
    const TUPLE = [
      { tex: 'S',       lab: 'STATE'    },
      { tex: 'A',       lab: 'ACTIONS'  },
      { tex: 'P',       lab: 'ODDS'     },
      { tex: 'R',       lab: 'MONEY'    },
      { tex: '\\gamma', lab: 'PATIENCE' },
    ];
    /* Step at which each tuple chip lights, and the steps it is "now". */
    const TUPLE_LIT_AT = [1, 2, 4, 5, 6];
    const TUPLE_NOW = [[1], [2], [3, 4], [5], [6]];

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
      chip.style.setProperty('--i', i);
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

    /* ===== LEFT: the board (everything built up front, shown per step) ===== */
    const board = document.createElement('div');
    board.className = 's3-board';
    board.dataset.hot = 'none';
    body.appendChild(board);

    const boardLabel = document.createElement('div');
    boardLabel.className = 's3-board-label';
    boardLabel.textContent = "OLD BESSIE'S WEEK";
    board.appendChild(boardLabel);

    /* --- The wear strip (4 state chips + drift arrows + arc band) --- */
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
        deg.style.setProperty('--i', w - 1);
        deg.innerHTML = degArrowSvg;
        stripRow.appendChild(deg);
      }
      const chip = document.createElement('div');
      chip.className = 's3-chip s3-chipw' + w;
      chip.style.setProperty('--i', w);
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

      function group(i) {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', 's3-arcg');
        g.style.setProperty('--i', i);
        arcSvg.appendChild(g);
        return g;
      }
      function head(g, tx) {
        const p = document.createElementNS(SVG_NS, 'polygon');
        p.setAttribute('class', 's3-arc-head');
        p.setAttribute('points',
          (tx - 4) + ',10 ' + (tx + 4) + ',10 ' + tx + ',1');
        g.appendChild(p);
      }
      function label(g, x, y, txt, anchor) {
        const t = document.createElementNS(SVG_NS, 'text');
        t.setAttribute('class', 's3-arc-label');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        if (anchor) t.setAttribute('text-anchor', anchor);
        t.textContent = txt;
        g.appendChild(t);
      }

      /* Arcs HEALTHY / WORN / SHAKY -> FAILING, one group apiece. */
      for (let i = 0; i < NS - 1; i++) {
        const g = group(i);
        const sx = c[i];
        const tx = c[NS - 1] - 28 + i * 13;
        const depth = 52 - i * 11;
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 's3-arc');
        path.setAttribute('d',
          'M ' + sx + ' 2 C ' + sx + ' ' + depth + ', ' + tx + ' ' + depth +
          ', ' + tx + ' 9');
        g.appendChild(path);
        head(g, tx);
        label(g, sx - 7, 14, pct(M.pBreakdown[i]) + '%', 'end');
      }
      /* FAILING's own breakdown: a small self-loop. */
      const gl = group(NS - 1);
      const c3 = c[NS - 1];
      const loop = document.createElementNS(SVG_NS, 'path');
      loop.setAttribute('class', 's3-arc');
      loop.setAttribute('d',
        'M ' + (c3 + 8) + ' 2 C ' + (c3 + 2) + ' 38, ' + (c3 + 44) + ' 34, ' +
        (c3 + 18) + ' 9');
      gl.appendChild(loop);
      head(gl, c3 + 18);
      label(gl, c3 + 24, 52, pct(M.pBreakdown[NS - 1]) + '%', 'middle');
    }

    /* --- The three calls --- */
    const secAct = document.createElement('div');
    secAct.className = 's3-sec s3-sec-actions';
    secAct.innerHTML = '<div class="s3-sec-label">THE THREE CALLS</div>';
    board.appendChild(secAct);
    const actRow = document.createElement('div');
    actRow.className = 's3-actrow';
    secAct.appendChild(actRow);
    Actions.ACTIONS.forEach(function (a, i) {
      const el = document.createElement('span');
      el.className = 's3-act ' + Actions.toneClass(a.id);
      el.style.setProperty('--i', i);
      el.innerHTML =
        '<span class="s3-act-top"><span class="s3-act-icon">' +
          Actions.leverIconSvg(a.id) + '</span>' + a.name + '</span>' +
        '<span class="s3-act-gloss">' + a.gloss + '</span>';
      actRow.appendChild(el);
    });

    /* --- The money row --- */
    const secMoney = document.createElement('div');
    secMoney.className = 's3-sec s3-sec-money';
    secMoney.innerHTML = '<div class="s3-sec-label">THE MONEY</div>';
    board.appendChild(secMoney);
    const moneyRow = document.createElement('div');
    moneyRow.className = 's3-moneyrow';
    secMoney.appendChild(moneyRow);
    const MONEY = [
      { v: '+' + M.revRun[0],     lab: 'BEST WEEK', cls: 'm-run' },
      { v: '-' + M.serviceCost,   lab: 'SHOP',      cls: 'm-svc' },
      { v: '-' + M.replaceCost,   lab: 'STICKER',   cls: 'm-new' },
      { v: '-' + M.breakdownCost, lab: 'TOW',       cls: 'm-tow' },
    ];
    MONEY.forEach(function (m, i) {
      const el = document.createElement('span');
      el.className = 's3-money ' + m.cls;
      el.style.setProperty('--i', i);
      el.innerHTML =
        '<span class="s3-money-val">' + m.v + '</span>' +
        '<span class="s3-money-lab">' + m.lab + '</span>';
      moneyRow.appendChild(el);
    });

    /* --- The patience coin stacks (gamma) --- */
    const secPat = document.createElement('div');
    secPat.className = 's3-sec s3-sec-pat';
    secPat.innerHTML = '<div class="s3-sec-label">THE PATIENCE DIAL</div>';
    board.appendChild(secPat);
    const patRow = document.createElement('div');
    patRow.className = 's3-patrow';
    secPat.appendChild(patRow);
    for (let j = 0; j < 3; j++) {
      const v = Math.pow(GAMMA, j);
      const col = document.createElement('div');
      col.className = 's3-pat-col';
      col.style.setProperty('--c', j);
      const tube = document.createElement('div');
      tube.className = 's3-pat-tube';
      const nCoins = Math.max(1, Math.round(10 * v));
      for (let k = 0; k < nCoins; k++) {
        const coin = document.createElement('span');
        coin.className = 's3-coin';
        coin.style.setProperty('--j', k);
        tube.appendChild(coin);
      }
      col.appendChild(tube);
      const mul = document.createElement('span');
      mul.className = 's3-pat-mul';
      mul.textContent = 'x' + v.toFixed(2);
      col.appendChild(mul);
      const wk = document.createElement('span');
      wk.className = 's3-pat-week';
      wk.textContent = 'WEEK ' + (j + 1);
      col.appendChild(wk);
      patRow.appendChild(col);
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
      'Step with <kbd>&#9656;</kbd> / <kbd>&#9666;</kbd> (or NEXT / BACK). ' +
      'Press <kbd>n</kbd> for speaker notes.';
    root.appendChild(hint);

    /* ---------- Per-step copy (formula chip + at most 2 short lines) ---------- */
    const STEPS = [
      {
        hot: 'none',
        title: 'FIVE MOVING PARTS',
        tex: '\\langle\\, S,\\; A,\\; P,\\; R,\\; \\gamma \\,\\rangle',
        ghost: true,
        body: 'The weeks you ran hid a machine with five parts.',
      },
      {
        hot: 'strip',
        title: 'S: THE STATE',
        tex: 'S = \\{\\text{HEALTHY},\\, \\text{WORN},\\, \\text{SHAKY},\\, \\text{FAILING}\\}',
        body: 'What you can see Monday morning. The gauge is the whole state.',
      },
      {
        hot: 'actions',
        title: 'A: THE ACTIONS',
        tex: 'A = \\{\\text{RUN},\\, \\text{SERVICE},\\, \\text{REPLACE}\\}',
        body: 'One call per week. The only thing you control.',
      },
      {
        hot: 'strip',
        title: 'P: THE DRIFT',
        tex: "P(s' \\mid s, a)",
        body: 'Wear drifts right as she runs.',
      },
      {
        hot: 'strip',
        title: 'P: THE BREAKDOWN',
        tex: "P(s' \\mid s, a)",
        body: 'Any RUN can end at FAILING. The odds are printed.',
      },
      {
        hot: 'money',
        title: 'R: THE REWARD',
        tex: "R(s, a, s')",
        body: 'Every week settles in one number. Money in or money out.',
      },
      {
        hot: 'pat',
        title: 'GAMMA: THE PATIENCE DIAL',
        tex: '\\gamma = ' + GAMMA,
        body: 'Next week counts a little less. The week after, less again.',
      },
      {
        hot: 'none',
        title: 'A MARKOV DECISION PROCESS',
        tex: '\\langle\\, S,\\; A,\\; P,\\; R,\\; \\gamma = ' + GAMMA + ' \\,\\rangle',
        display: true,
        body: 'Four states, three actions, printed odds, weekly money: ' +
          'a Markov decision process.',
      },
    ];

    /* ---------- Step state machine (pure function of `step`) ---------- */
    function applyStep(k, animate) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, k));
      const s = STEPS[step];

      if (!animate) root.classList.add('s3-noanim');

      board.dataset.hot = s.hot;
      secStrip.classList.toggle('built', step >= 1);
      secStrip.classList.toggle('arrows-on', step >= 3);
      secStrip.classList.toggle('arcs-on', step >= 4);
      secStrip.classList.toggle('arcs-now', step === 4);
      secAct.classList.toggle('built', step >= 2);
      secMoney.classList.toggle('built', step >= 5);
      secPat.classList.toggle('built', step >= 6);

      tupleChips.forEach(function (chip, i) {
        const lit = step >= TUPLE_LIT_AT[i];
        chip.classList.toggle('ghost', !lit);
        chip.classList.toggle('lit', lit);
        chip.classList.toggle('now', TUPLE_NOW[i].indexOf(step) !== -1);
      });
      rail.classList.toggle('complete', step === STEP_COUNT - 1);

      ptitle.textContent = s.title;
      formula.innerHTML = '';
      formula.classList.toggle('ghosted', !!s.ghost);
      window.Katex.render(s.tex, formula, !!s.display);
      pbody.innerHTML = s.body;

      stepof.textContent = 'STEP ' + (step + 1) + ' / ' + STEP_COUNT;
      prevBtn.disabled = step === 0;
      nextBtn.disabled = step === STEP_COUNT - 1;

      if (!animate) {
        void root.offsetWidth;          /* flush styles while noanim holds */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            root.classList.remove('s3-noanim');
          });
        });
      }
    }

    function goNext() {
      if (step < STEP_COUNT - 1) { applyStep(step + 1, !instantMode()); return true; }
      return false;
    }
    function goPrev() {
      if (step > 0) { applyStep(step - 1, false); return true; }
      return false;
    }
    nextBtn.addEventListener('click', goNext);
    prevBtn.addEventListener('click', goPrev);

    window.addEventListener('resize', drawArcs);

    /* Initial step: 0, or the &step=K hash flag (headless capture). */
    const sm = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    applyStep(sm ? parseInt(sm[1], 10) : 0, false);
    requestAnimationFrame(drawArcs);

    return {
      onEnter() { applyStep(step, false); drawArcs(); },
      onNextKey() { return goNext(); },
      onPrevKey() { return goPrev(); },
    };
  };
})();

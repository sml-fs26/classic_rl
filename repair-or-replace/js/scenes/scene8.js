/* Scene 8, "The Bellman equation": the recursion behind the table,
 * hand-checked on ONE cell, one idea per click.
 *
 *   step  0  the identity Q*(s,a) = E[R + gamma max Q*(S',a')] + one-line gloss.
 *   step  1  pick the cell: the full table, (WORN, SERVICE) ringed, rest dim.
 *   step  2  play it forward: the table collapses to a mini strip and the
 *            week panel opens with the WORN chip + the SVC cost chip.
 *   step  3  branch one draws: 0.05 stay WORN (the wrench changes nothing).
 *   step  4  branch two draws: 0.95 land HEALTHY (up 1 + up 2 both cap there).
 *   step  5  the substitution skeleton appears; six chips fill its slots,
 *            staggered: -50, 0.9, 0.05, 226.1, 0.95, 311.0. Caption: each V
 *            is the best Q in its row (the mini strip marks those two cells).
 *   steps 6..10  the arithmetic cascade, ONE line per click, earlier lines
 *            dimming: 0.05 x 226.1 = 11.31; 0.95 x 311.0 = 295.45;
 *            sum 306.76; x 0.9 = 276.08; minus 50 = 226.08.
 *   step 11  the check: 226.08 rounds to 226.1, exactly the cell we picked.
 *   step 12  the catch: 311.0 and 226.1 are answers from the same table;
 *            12 equations, 12 unknowns; you iterate it. Next: DP.
 *
 *   Every number is computed from DATA.V / DATA.model (displayed via a
 *   float-dust-proof half-up rounding), never hard-coded, so the strings
 *   cannot drift from the data.
 *
 *   Rewind safety: render() derives everything from `step` alone (pure
 *   show/hide), and the reveal animations are CSS display-toggle animations,
 *   so they fire only when an element first becomes visible (a forward
 *   click), never while rewinding.
 *
 *   [data-run-primary] = RUN THE CHECK, which advances ONE internal step
 *   (same as NEXT), so &run nudges the scene off the formula card.
 *   &step=N deep link for QA, read once at build.
 */
(function () {
  window.scenes = window.scenes || {};

  const A = 3;

  /* Half-up rounding that survives float dust (306.755 -> 306.76). */
  function round2(x) { return Math.round(x * 100 + 1e-6) / 100; }
  function fmt2(x) { return round2(x).toFixed(2); }
  function round1(x) { return Math.round(x * 10 + 1e-6) / 10; }

  function hashStep(maxStep) {
    const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(maxStep, n)) : 0;
  }
  function instantMode() {
    return /[#&?]run\b/.test(window.location.hash || '') ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  window.scenes.scene8 = function (root) {
    root.classList.add('scene-pad', 'scene8-scene', 'concept-scene');
    if (instantMode()) root.classList.add('s8-instant');
    root.innerHTML = '';

    const D = window.DATA || {};
    const ACT = window.Actions;
    const model = D.model || {};
    const V = Array.isArray(D.V) ? D.V : [0, 0, 0, 0];
    const Qstar = (Array.isArray(D.Qstar) && D.Qstar.length === 12)
      ? D.Qstar : new Array(12).fill(0);
    const GAMMA = model.gamma || (window.Van && window.Van.GAMMA) || 0.9;

    /* The cell under test: (WORN, SERVICE), state 1 x action 1. */
    const S_FROM = 1;
    const A_SVC = 1;
    const qCell = Qstar[S_FROM * A + A_SVC];                      /* 226.1 */
    const su = (model.serviceUp && model.serviceUp[S_FROM]) || [0.05, 0.7, 0.25];
    const pStay = su[0];                                          /* 0.05 */
    const pUp1 = su[1];                                           /* 0.70 */
    const pUp2 = su[2];                                           /* 0.25 */
    const pUp = pUp1 + pUp2;                                      /* 0.95 */
    const cost = model.serviceCost != null ? model.serviceCost : 50;

    /* The arithmetic chain, exact; rounded only for display. */
    const t1 = pStay * V[1];          /* 0.05 x 226.1 = 11.305   */
    const t2 = pUp * V[0];            /* 0.95 x 311.0 = 295.45   */
    const sum = t1 + t2;              /* 306.755                 */
    const disc = GAMMA * sum;         /* 276.0795                */
    const total = disc - cost;        /* 226.0795 -> 226.1 (1dp) */
    const checks = round1(total) === round1(qCell);

    /* Best action per row (for the "V = best Q in its row" mini-strip marks). */
    function argmaxA(s) {
      let m = -Infinity, k = 0;
      for (let a = 0; a < A; a++) { const v = Qstar[s * A + a]; if (v > m) { m = v; k = a; } }
      return k;
    }

    const MAX_STEP = 12;
    let step = hashStep(MAX_STEP);

    /* ---- Heading + formula card (step 0) ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'The Bellman equation';
    root.appendChild(heading);

    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">EVERY CELL OBEYS ONE RULE</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    /* \nolimits keeps the max subscript beside the operator, so the
       brackets stay default-size (the vendored KaTeX fonts mis-render
       stretched delimiters). */
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; \gamma \,\max\nolimits_{a'}\, Q^{\star}(S', a') \,\right]`,
      fhost, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = "This week's money plus " + GAMMA +
      ' times the best you can do from wherever you land.';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Mini strip: the table, parked (step 2+) ---- */
    const mini = document.createElement('div');
    mini.className = 's8-mini s8-popin';
    const miniLabel = document.createElement('span');
    miniLabel.className = 's8-mini-label';
    miniLabel.textContent = 'THE TABLE, PARKED';
    mini.appendChild(miniLabel);
    const mosaic = document.createElement('span');
    mosaic.className = 's8-mosaic';
    for (let s = 0; s < 4; s++) {
      for (let a = 0; a < A; a++) {
        const c = document.createElement('span');
        c.className = 's8-mini-cell';
        if (s === S_FROM && a === A_SVC) c.classList.add('s8-mini-pick');
        if ((s === 0 && a === argmaxA(0)) || (s === 1 && a === argmaxA(1))) {
          c.classList.add('s8-mini-best');
        }
        mosaic.appendChild(c);
      }
    }
    mini.appendChild(mosaic);
    const miniChip = document.createElement('span');
    miniChip.className = 's8-mini-chip';
    miniChip.textContent = 'Q*(WORN, SVC) = +' + qCell.toFixed(1);
    mini.appendChild(miniChip);
    root.appendChild(mini);

    /* ---- Panel: full table (step 1) XOR the week tree (step 2+) ---- */
    const panel = document.createElement('div');
    panel.className = 's8-panel';
    root.appendChild(panel);

    const tableCol = document.createElement('div');
    tableCol.className = 's8-table-col';
    const pickLabel = document.createElement('div');
    pickLabel.className = 's8-col-label';
    pickLabel.textContent = 'PICK ONE CELL: Q*(WORN, SVC)';
    tableCol.appendChild(pickLabel);
    const qHost = document.createElement('div');
    qHost.className = 's8-q s8-dimcells';
    tableCol.appendChild(qHost);
    const tableCaption = document.createElement('p');
    tableCaption.className = 's8-caption';
    tableCaption.textContent = 'One cell, checked by hand.';
    tableCol.appendChild(tableCaption);
    panel.appendChild(tableCol);

    const qt = window.QTable.mount(qHost);
    qt.update(Float64Array.from(Qstar), { suppressFlash: true });
    qt.cells[S_FROM * A + A_SVC].classList.add('s8-pick');
    for (let s = 0; s < 4; s++) {
      const lab = qt.getCellNode(s);
      if (lab && s !== S_FROM) lab.classList.add('s8-dim');
    }

    const treeCol = document.createElement('div');
    treeCol.className = 's8-tree-col s8-popin';
    const treeLabel = document.createElement('div');
    treeLabel.className = 's8-col-label';
    treeLabel.textContent = 'ONE CALL, ONE WEEK DEEP';
    treeCol.appendChild(treeLabel);

    const tree = document.createElement('div');
    tree.className = 's8-tree';
    treeCol.appendChild(tree);

    function stateChipHtml(wear, name) {
      return '<span class="s8-st w' + wear + '">' +
        '<span class="s8-st-gauge" data-wear="' + wear + '"></span>' +
        '<span>' + name + '</span></span>';
    }

    const rootRow = document.createElement('div');
    rootRow.className = 's8-tree-root';
    rootRow.innerHTML = stateChipHtml(1, 'WORN');
    tree.appendChild(rootRow);

    const edge = document.createElement('div');
    edge.className = 's8-edge';
    edge.innerHTML =
      '<span class="s8-edge-chip">' + ACT.leverIconSvg('service') +
        '<span>SVC ' + (-cost) + '</span></span>' +
      '<span class="s8-edge-arrow">→</span>';
    tree.appendChild(edge);

    const branches = document.createElement('div');
    branches.className = 's8-branches';
    tree.appendChild(branches);

    const branchA = document.createElement('div');
    branchA.className = 's8-branch s8-popin';
    branchA.innerHTML =
      '<span class="s8-prob w1">' + pStay.toFixed(2) + '</span>' +
      '<span class="s8-branch-arrow">→</span>' +
      stateChipHtml(1, 'WORN') +
      '<span class="s8-branch-note">the wrench changes nothing</span>';
    branches.appendChild(branchA);

    const branchB = document.createElement('div');
    branchB.className = 's8-branch s8-popin';
    branchB.innerHTML =
      '<span class="s8-prob w0">' + pUp.toFixed(2) + '</span>' +
      '<span class="s8-branch-arrow">→</span>' +
      stateChipHtml(0, 'HEALTHY') +
      '<span class="s8-branch-note">up 1 (' + pUp1.toFixed(2) + ') + up 2 (' +
        pUp2.toFixed(2) + '): both land HEALTHY</span>';
    branches.appendChild(branchB);

    /* mount the tiny gauge swatches (compact VanCards) */
    tree.querySelectorAll('.s8-st-gauge').forEach((host) => {
      window.VanCard.mount(host, { wear: parseInt(host.dataset.wear, 10) || 0, compact: true });
    });

    const treeCaption = document.createElement('p');
    treeCaption.className = 's8-caption';
    treeCaption.textContent = 'Pay the bill now. The week decides where she lands.';
    treeCol.appendChild(treeCaption);
    panel.appendChild(treeCol);

    /* ---- Substitution skeleton + evaluation ledger ---- */
    const eqCard = document.createElement('div');
    eqCard.className = 's8-math s8-popin';
    root.appendChild(eqCard);

    const mathLabel = document.createElement('div');
    mathLabel.className = 's8-math-label';
    mathLabel.textContent = 'SUBSTITUTE THE NUMBERS';
    eqCard.appendChild(mathLabel);

    function slotHtml(idx, chipCls, text, tag) {
      return '<span class="s8-slot s8-d' + idx + '">' +
        '<span class="s8-slot-box">' +
          '<span class="s8-slot-ph"></span>' +
          '<span class="s8-chip ' + chipCls + '">' + text + '</span>' +
        '</span>' +
        '<span class="s8-slot-tag">' + tag + '</span></span>';
    }
    function opHtml(t) { return '<span class="s8-op">' + t + '</span>'; }

    const eq = document.createElement('div');
    eq.className = 's8-eq';
    eq.innerHTML =
      '<span class="s8-eq-lhs">Q*(WORN, SVC) =</span>' +
      slotHtml(0, 'cost', String(-cost), 'bill') +
      opHtml('+') +
      slotHtml(1, 'gam', String(GAMMA), 'discount') +
      opHtml('×') +
      opHtml('(') +
      slotHtml(2, 'pr w1', pStay.toFixed(2), 'stay odds') +
      opHtml('×') +
      slotHtml(3, 'vv w1', V[1].toFixed(1), 'V(WORN)') +
      opHtml('+') +
      slotHtml(4, 'pr w0', pUp.toFixed(2), 'up odds') +
      opHtml('×') +
      slotHtml(5, 'vv w0', V[0].toFixed(1), 'V(HEALTHY)') +
      opHtml(')');
    eqCard.appendChild(eq);

    const vCaption = document.createElement('p');
    vCaption.className = 's8-caption s8-vcap';
    vCaption.textContent = 'Each V is the best Q in its row.';
    eqCard.appendChild(vCaption);

    /* evaluation ledger, one line per click */
    const ledger = document.createElement('div');
    ledger.className = 's8-eval';
    eqCard.appendChild(ledger);

    const LINES = [
      { e: pStay.toFixed(2) + ' × ' + V[1].toFixed(1), v: t1, n: 'the stay-WORN branch' },
      { e: pUp.toFixed(2) + ' × ' + V[0].toFixed(1), v: t2, n: 'the land-HEALTHY branch' },
      { e: fmt2(t1) + ' + ' + fmt2(t2), v: sum, n: 'next week, on average' },
      { e: fmt2(sum) + ' × ' + GAMMA, v: disc, n: 'next week counts less' },
      { e: fmt2(disc) + ' - ' + cost, v: total, n: 'minus the shop bill' },
    ];
    const lineEls = LINES.map((ln) => {
      const rowEl = document.createElement('div');
      rowEl.className = 's8-eval-line s8-popin';
      rowEl.innerHTML =
        '<span class="s8-expr">' + ln.e + '</span>' +
        '<span class="s8-op">=</span>' +
        '<span class="s8-val">' + fmt2(ln.v) + '</span>' +
        '<span class="s8-note">' + ln.n + '</span>';
      ledger.appendChild(rowEl);
      return rowEl;
    });

    const verdict = document.createElement('div');
    verdict.className = 's8-verdict s8-popin';
    verdict.innerHTML =
      '<span class="s8-check">' + (checks ? '✓' : '✗') + '</span>' +
      '<span>' + fmt2(total) + ' rounds to <b>' + round1(total).toFixed(1) +
      '</b>: exactly the cell we picked.</span>';
    ledger.appendChild(verdict);

    /* ---- The catch ---- */
    const catchBox = document.createElement('div');
    catchBox.className = 'poke-box tight s8-catch s8-popin';
    catchBox.innerHTML = '<b>THE CATCH:</b> ' + V[0].toFixed(1) + ' and ' + V[1].toFixed(1) +
      ' are themselves answers from the same table. 12 equations, 12 unknowns: ' +
      'you do not solve it, you <b class="s8-iterate">ITERATE</b> it. Next: DP.';
    root.appendChild(catchBox);

    /* ---- Hint + the one-step RUN button ---- */
    const hint = document.createElement('div');
    hint.className = 's8-hint';
    const hintText = document.createElement('span');
    hint.appendChild(hintText);
    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'poke-btn s8-run';
    runBtn.setAttribute('data-run-primary', '');
    runBtn.textContent = 'RUN THE CHECK';
    hint.appendChild(runBtn);
    root.appendChild(hint);

    const HINTS = [
      '▶ NEXT: pick one cell',
      '▶ NEXT: play it forward one week',
      '▶ NEXT: the first branch',
      '▶ NEXT: the second branch',
      '▶ NEXT: substitute the numbers',
      '▶ NEXT: evaluate, one line per click',
      '▶ NEXT: the other branch',
      '▶ NEXT: add them up',
      '▶ NEXT: discount it',
      '▶ NEXT: pay the bill',
      '▶ NEXT: the check',
      '▶ NEXT: the catch',
      'The recursion holds. NEXT moves on: DP fills the table.',
    ];

    /* Pure function of `step`: cold entry, rewind and replay all land on
       exactly the same DOM state. */
    function render() {
      panel.classList.toggle('s8-hidden', step < 1);
      tableCol.classList.toggle('s8-hidden', step !== 1);
      mini.classList.toggle('s8-hidden', step < 2);
      mini.classList.toggle('s8-show-best', step >= 5);
      miniChip.classList.toggle('s8-mini-glow', step >= 11);
      treeCol.classList.toggle('s8-hidden', step < 2);
      branchA.classList.toggle('s8-hidden', step < 3);
      branchB.classList.toggle('s8-hidden', step < 4);
      eqCard.classList.toggle('s8-hidden', step < 5);
      ledger.classList.toggle('s8-hidden', step < 6);
      lineEls.forEach((el, i) => {
        el.classList.toggle('s8-hidden', step < 6 + i);
        el.classList.toggle('s8-dimline', step > 6 + i);
      });
      verdict.classList.toggle('s8-hidden', step < 11);
      catchBox.classList.toggle('s8-hidden', step < 12);
      eq.querySelectorAll('.s8-chip.vv').forEach((ch) => {
        ch.classList.toggle('s8-loop', step >= 12);
      });
      hintText.textContent = HINTS[step];
      runBtn.classList.toggle('s8-hidden', step >= MAX_STEP);
    }

    function advance() {
      if (step >= MAX_STEP) return false;
      step++;
      render();
      if (window.SFX) window.SFX.play(step === 11 ? 'win' : 'tick');
      return true;
    }

    runBtn.addEventListener('click', () => { advance(); });

    render();

    return {
      onEnter() {},
      onLeave() {},
      onNextKey() { return advance(); },
      onPrevKey() {
        if (step > 0) {
          step--;
          render();
          return true;
        }
        return false;
      },
    };
  };
})();

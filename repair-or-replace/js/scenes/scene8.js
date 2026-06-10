/* Scene 8, "The Bellman equation": the recursion behind the table,
 * hand-checked on ONE cell.
 *
 *     step 0  the identity Q*(s,a) = E[R + gamma max Q*(S',a')] + one-liner.
 *     step 1  pick the cell (WORN, SERVICE) = 226.1: highlight it on a small
 *             QTable and draw the branch fan. SERV_UP[WORN] = [.05, .70, .25];
 *             up1 and up2 both land HEALTHY, so the fan is
 *             WORN --service--> { 0.05 WORN, 0.95 HEALTHY }.
 *     step 2  substitute V (= max-Q per state, from DATA.V):
 *             -50 + 0.9 x (0.05 x 226.1 + 0.95 x 311.0), each term as a
 *             source-coloured chip (cost / gamma / prob / V).
 *     step 3  evaluate: 11.31, 295.45, 306.76, x0.9 = 276.08, -50 = 226.08,
 *             which rounds to the table's 226.1. Check mark + SFX 'win'.
 *     step 4  the catch: V sits on BOTH sides; 12 equations, 12 unknowns.
 *             You do not solve it with algebra, you ITERATE it. Next: DP.
 *
 *   Every intermediate number is computed in code from DATA.V and
 *   DATA.model (displayed at 2dp via a float-dust-proof half-up rounding),
 *   never hard-coded, so the strings cannot drift from the data.
 *
 *   [data-run-primary] = the RUN THE CHECK button (jumps to the last step)
 *   so &run captures the full derivation. Optional &step=N for QA.
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

    const MAX_STEP = 4;
    let step = hashStep(MAX_STEP);

    /* ---- Heading + formula card ---- */
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

    /* ---- Step 1 panel: the picked cell | the branch fan ---- */
    const panel = document.createElement('div');
    panel.className = 's8-panel';
    root.appendChild(panel);

    const tableCol = document.createElement('div');
    tableCol.className = 's8-table-col';
    const pickLabel = document.createElement('div');
    pickLabel.className = 's8-col-label';
    pickLabel.innerHTML = 'PICK ONE CELL: Q*(WORN, SVC) = <b>' + qCell.toFixed(1) + '</b>';
    tableCol.appendChild(pickLabel);
    const qHost = document.createElement('div');
    qHost.className = 's8-q s8-dimcells';
    tableCol.appendChild(qHost);
    panel.appendChild(tableCol);

    const qt = window.QTable.mount(qHost);
    qt.update(Float64Array.from(Qstar), { suppressFlash: true });
    qt.cells[S_FROM * A + A_SVC].classList.add('s8-pick');
    for (let s = 0; s < 4; s++) {
      const lab = qt.getCellNode(s);
      if (lab && s !== S_FROM) lab.classList.add('s8-dim');
    }

    const treeCol = document.createElement('div');
    treeCol.className = 's8-tree-col';
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

    tree.innerHTML =
      '<div class="s8-tree-root">' + stateChipHtml(1, 'WORN') + '</div>' +
      '<div class="s8-edge">' +
        '<span class="s8-edge-chip">' + ACT.leverIconSvg('service') +
          '<span>SVC ' + (-cost) + '</span></span>' +
        '<span class="s8-edge-arrow">→</span>' +
      '</div>' +
      '<div class="s8-branches">' +
        '<div class="s8-branch">' +
          '<span class="s8-prob w1">' + pStay.toFixed(2) + '</span>' +
          '<span class="s8-branch-arrow">→</span>' +
          stateChipHtml(1, 'WORN') +
          '<span class="s8-branch-note">the wrench changes nothing</span>' +
        '</div>' +
        '<div class="s8-branch">' +
          '<span class="s8-prob w0">' + pUp.toFixed(2) + '</span>' +
          '<span class="s8-branch-arrow">→</span>' +
          stateChipHtml(0, 'HEALTHY') +
          '<span class="s8-branch-note">up 1 (' + pUp1.toFixed(2) + ') + up 2 (' +
            pUp2.toFixed(2) + '): both land HEALTHY</span>' +
        '</div>' +
      '</div>';

    /* mount the tiny gauge swatches (compact VanCards) */
    tree.querySelectorAll('.s8-st-gauge').forEach((host) => {
      window.VanCard.mount(host, { wear: parseInt(host.dataset.wear, 10) || 0, compact: true });
    });

    const treeCaption = document.createElement('p');
    treeCaption.className = 's8-tree-caption';
    treeCaption.textContent = 'SERVICE at WORN: pay ' + cost + ' now. Stay ' +
      pStay.toFixed(2) + '; up one ' + pUp1.toFixed(2) + '; up two ' + pUp2.toFixed(2) +
      '. Two branches land HEALTHY: ' + pUp.toFixed(2) + ' total.';
    treeCol.appendChild(treeCaption);
    panel.appendChild(treeCol);

    /* ---- Step 2/3: substitution + evaluation card ---- */
    const math = document.createElement('div');
    math.className = 's8-math';
    root.appendChild(math);

    const mathLabel = document.createElement('div');
    mathLabel.className = 's8-math-label';
    mathLabel.textContent = 'SUBSTITUTE THE NUMBERS';
    math.appendChild(mathLabel);

    const eq = document.createElement('div');
    eq.className = 's8-eq';
    eq.innerHTML =
      '<span class="s8-eq-lhs">Q*(WORN, SVC) =</span>' +
      '<span class="s8-chip cost">' + (-cost) + '</span>' +
      '<span class="s8-op">+</span>' +
      '<span class="s8-chip gam">' + GAMMA + '</span>' +
      '<span class="s8-op">×</span>' +
      '<span class="s8-op">(</span>' +
      '<span class="s8-chip pr w1">' + pStay.toFixed(2) + '</span>' +
      '<span class="s8-op">×</span>' +
      '<span class="s8-chip vv w1">' + V[1].toFixed(1) + '</span>' +
      '<span class="s8-op">+</span>' +
      '<span class="s8-chip pr w0">' + pUp.toFixed(2) + '</span>' +
      '<span class="s8-op">×</span>' +
      '<span class="s8-chip vv w0">' + V[0].toFixed(1) + '</span>' +
      '<span class="s8-op">)</span>';
    math.appendChild(eq);

    const legend = document.createElement('p');
    legend.className = 's8-eq-legend';
    legend.innerHTML = '<b>' + (-cost) + '</b>: the shop bill. <b>' + GAMMA +
      '</b>: the discount. <b>' + V[1].toFixed(1) + ' = V(WORN)</b> and <b>' +
      V[0].toFixed(1) + ' = V(HEALTHY)</b>: each V is the best Q in its row, the ' +
      '"then play perfectly" part.';
    math.appendChild(legend);

    /* evaluation ledger */
    const evalBox = document.createElement('div');
    evalBox.className = 's8-eval';
    math.appendChild(evalBox);

    const LINES = [
      { e: pStay.toFixed(2) + ' × ' + V[1].toFixed(1), v: t1, n: 'the stay-WORN branch' },
      { e: pUp.toFixed(2) + ' × ' + V[0].toFixed(1), v: t2, n: 'the land-HEALTHY branch' },
      { e: fmt2(t1) + ' + ' + fmt2(t2), v: sum, n: 'what next week is worth, on average' },
      { e: fmt2(sum) + ' × ' + GAMMA, v: disc, n: 'discounted: next week counts at ' + GAMMA },
      { e: fmt2(disc) + ' - ' + cost, v: total, n: 'minus the shop bill' },
    ];
    LINES.forEach((ln) => {
      const rowEl = document.createElement('div');
      rowEl.className = 's8-eval-line';
      rowEl.innerHTML =
        '<span class="s8-expr">' + ln.e + '</span>' +
        '<span class="s8-op">=</span>' +
        '<span class="s8-val">' + fmt2(ln.v) + '</span>' +
        '<span class="s8-note">' + ln.n + '</span>';
      evalBox.appendChild(rowEl);
    });

    const verdict = document.createElement('div');
    verdict.className = 's8-verdict';
    verdict.innerHTML =
      '<span class="s8-check">' + (checks ? '✓' : '✗') + '</span>' +
      '<span>' + fmt2(total) + ' rounds to <b>' + round1(total).toFixed(1) +
      '</b>: exactly the cell we picked.</span>';
    evalBox.appendChild(verdict);

    const consistency = document.createElement('p');
    consistency.className = 's8-consistency';
    consistency.innerHTML = 'The table is <b>CONSISTENT</b> with itself: every cell ' +
      'is this week plus the discounted best-next. All twelve cells pass this same check.';
    math.appendChild(consistency);

    /* ---- Step 4: the catch ---- */
    const catchBox = document.createElement('div');
    catchBox.className = 'poke-box tight s8-catch';
    catchBox.innerHTML = '<b>THE CATCH:</b> ' + V[0].toFixed(1) + ' and ' + V[1].toFixed(1) +
      ' are themselves best-of-row numbers from the same table. The unknowns sit on ' +
      'BOTH sides of the equals sign: 12 equations, 12 unknowns, all tangled. ' +
      'You do not solve this with algebra. You <b class="s8-iterate">ITERATE</b> it. Next: DP.';
    root.appendChild(catchBox);

    /* ---- Hint + fast-forward ---- */
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
      '▶ NEXT: pick one cell and check it by hand',
      '▶ NEXT: substitute the numbers',
      '▶ NEXT: evaluate',
      '▶ NEXT: the catch',
      'The recursion holds. NEXT moves on: DP fills the table.',
    ];

    function applyStep() {
      panel.classList.toggle('s8-hidden', step < 1);
      math.classList.toggle('s8-hidden', step < 2);
      evalBox.classList.toggle('s8-hidden', step < 3);
      consistency.classList.toggle('s8-hidden', step < 3);
      catchBox.classList.toggle('s8-hidden', step < 4);
      hintText.textContent = HINTS[step];
      runBtn.classList.toggle('s8-hidden', step >= MAX_STEP);
    }

    runBtn.addEventListener('click', () => {
      step = MAX_STEP;
      applyStep();
      if (window.SFX) window.SFX.play('win');
    });

    applyStep();

    return {
      onEnter() {},
      onLeave() {},
      onNextKey() {
        if (step < MAX_STEP) {
          step++;
          applyStep();
          if (window.SFX) window.SFX.play(step === 3 ? 'win' : 'tick');
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (step > 0) {
          step--;
          applyStep();
          return true;
        }
        return false;
      },
    };
  };
})();

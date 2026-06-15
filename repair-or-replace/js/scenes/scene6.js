/* Scene 6, "Return over the van's life": earns the RETURN badge.
 *
 * Six internal steps over the known six-week tape (DATA.demoTrajectory),
 * ONE idea per click:
 *   0  the tape: the call row + the money row
 *   1  the raw sum cell unveils
 *   2  the WEIGHT row: gamma powers fade in left to right + decay sparkline
 *   3  the COUNTS-AS row: reward times weight, cell by cell
 *   4  the gather: weighted cells sweep into the return G (count-up)
 *   5  the formula G = sum gamma^j r_j, gamma chip highlighted
 *
 * The patience-knob playground moved OUT to scene13 (the next pager slot);
 * the closing hint teases it.
 *
 * NEXT/RIGHT consumes 5 internal steps, then yields to the pager.
 * Optional &step=N hash flag jumps to an internal step on cold entry
 * (used for headless QA captures). Rewind re-applies the step with no
 * animations; every step's settled look is a pure function of `step`.
 * G is read from DATA.demoTrajectory.discountedReturn, never re-rounded
 * differently.
 */
(function () {
  window.scenes = window.scenes || {};

  /* Half-up rounding that survives float dust (306.755 -> 306.76). */
  function round2(x) { return Math.round(x * 100 + 1e-6) / 100; }
  function fmt2(x) { return round2(x).toFixed(2); }
  function fmtSigned2(x) { const r = round2(x); return (r >= 0 ? '+' : '') + r.toFixed(2); }
  function fmtSignedInt(v) { return (v >= 0 ? '+' : '') + v; }

  function hashStep(maxStep) {
    const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(maxStep, n)) : 0;
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  window.scenes.scene6 = function (root) {
    root.classList.add('scene-pad', 'scene6-scene', 'concept-scene');
    if (instantMode()) root.classList.add('s6-instant');
    root.innerHTML = '';

    const D = window.DATA || {};
    const ACT = window.Actions;
    const traj = D.demoTrajectory || {};
    const tape = Array.isArray(traj.steps) ? traj.steps : [];
    const GAMMA = (D.model && D.model.gamma) || (window.Van && window.Van.GAMMA) || 0.9;
    const G_FINAL = Number(traj.discountedReturn || 0).toFixed(2);

    const MAX_STEP = 5;
    let step = hashStep(MAX_STEP);

    function actChipHtml(id) {
      return '<span class="s6-chip-act ' + ACT.toneClass(id) + '">' +
        '<span class="s6-act-ic">' + ACT.leverIconSvg(id) + '</span>' +
        '<span>' + ACT.shortLabel(id) + '</span></span>';
    }

    /*, Heading + lede, */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = "Return over the van's life";
    root.appendChild(heading);

    const lede = document.createElement('p');
    lede.className = 's6-lede';
    lede.textContent = 'One run of the playbook left a tape of weekly money.';
    root.appendChild(lede);

    /*, The six-week tape, */
    const card = document.createElement('div');
    card.className = 's6-tape';
    root.appendChild(card);

    const tapeLabel = document.createElement('div');
    tapeLabel.className = 's6-tape-label';
    tapeLabel.textContent = 'THE SIX-WEEK TAPE FROM THE TRAJECTORY';
    card.appendChild(tapeLabel);

    const grid = document.createElement('div');
    grid.className = 's6-grid';
    grid.style.setProperty('--nw', String(tape.length));
    card.appendChild(grid);

    function row(cls) {
      const r = document.createElement('div');
      r.className = 's6-row' + (cls ? ' ' + cls : '');
      grid.appendChild(r);
      return r;
    }
    function cell(parent, cls, html) {
      const c = document.createElement('div');
      c.className = cls;
      c.innerHTML = html;
      parent.appendChild(c);
      return c;
    }

    /* week header row */
    const rWeek = row();
    cell(rWeek, 's6-rowlab', 'WEEK');
    tape.forEach((st) => cell(rWeek, 's6-wk', 'WK ' + st.i));
    cell(rWeek, 's6-wk s6-wk-total', 'TOTAL');

    /* the call row */
    const rCall = row();
    cell(rCall, 's6-rowlab', 'THE CALL');
    tape.forEach((st) => cell(rCall, 's6-call', actChipHtml(st.action)));
    cell(rCall, 's6-blank', '');

    /* reward row + raw total */
    const rReward = row();
    cell(rReward, 's6-rowlab', 'REWARD');
    tape.forEach((st) => cell(rReward, 's6-num ' + (st.reward >= 0 ? 'pos' : 'neg'),
      fmtSignedInt(st.reward)));
    const rawTotal = cell(rReward, 's6-total s6-raw',
      '<span class="s6-cell-tag">RAW SUM</span>' +
      '<span class="s6-total-val">' + fmtSignedInt(traj.totalReturn || 0) + '</span>');

    /* gamma-power weight row + decay sparkline in the total slot */
    const rWeight = row('s6-row-weight');
    cell(rWeight, 's6-rowlab', 'WEIGHT');
    const weightCells = [];
    tape.forEach((st, j) => weightCells.push(
      cell(rWeight, 's6-weight', '×' + Math.pow(GAMMA, j).toFixed(2))));

    function sparkSvg() {
      const n = Math.max(2, tape.length);
      const pts = [];
      for (let j = 0; j < n; j++) {
        const x = 6 + j * (52 / (n - 1));
        const y = 21 - 16 * Math.pow(GAMMA, j);
        pts.push([x, y]);
      }
      let h = '<svg viewBox="0 0 64 26" aria-hidden="true">' +
        '<polyline fill="none" stroke="currentColor" stroke-width="1.6" points="' +
        pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
      pts.forEach((p) => {
        h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) +
          '" r="1.7" fill="currentColor"/>';
      });
      return h + '</svg>';
    }
    const spark = cell(rWeight, 's6-sparkcell', sparkSvg());

    /* weighted products row + discounted total */
    const rProd = row('s6-row-prod');
    cell(rProd, 's6-rowlab', 'COUNTS AS');
    const prodCells = [];
    tape.forEach((st, j) => {
      const v = st.reward * Math.pow(GAMMA, j);
      prodCells.push(cell(rProd, 's6-num s6-prod ' + (v >= 0 ? 'pos' : 'neg'), fmtSigned2(v)));
    });
    const gTotal = cell(rProd, 's6-total s6-g',
      '<span class="s6-cell-tag">RETURN G</span>' +
      '<span class="s6-total-val"></span>');
    const gVal = gTotal.querySelector('.s6-total-val');
    gVal.textContent = G_FINAL;

    const caption = document.createElement('p');
    caption.className = 's6-caption';
    card.appendChild(caption);

    /*, The return formula (last step), */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card s6-formula';
    fcard.innerHTML = '<div class="concept-formula-label">ONE NUMBER FOR THE WHOLE TAPE</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(String.raw`G \;=\; \sum_{j \ge 0} \gamma^{\,j}\, r_j`, fhost, true);
    const gchip = document.createElement('div');
    gchip.className = 's6-gamma-chip';
    gchip.appendChild(window.Katex.inline('\\gamma = ' + GAMMA));
    fcard.appendChild(gchip);
    root.appendChild(fcard);

    /*, Step hint, */
    const hint = document.createElement('div');
    hint.className = 's6-hint';
    root.appendChild(hint);

    /*, Step engine, */
    const CAPTIONS = [
      'Week by week: the call, then the money.',
      'Add the tape up: one score for the run. But week-six money is not week-one money.',
      'Later money counts a little less. Every week weighs ' + GAMMA + ' of the one before.',
      "Each cell: the week's money times its weight (shown rounded).",
      'The weighted cells gather into one number: the return G, exact.',
      '',
    ];
    const HINTS = [
      '▶ NEXT: add up the tape',
      '▶ NEXT: weigh the weeks',
      '▶ NEXT: multiply it out',
      '▶ NEXT: gather the return',
      '▶ NEXT: the formula',
      '▶ NEXT: turn the patience knob',
    ];

    function pop(node) {
      if (instantMode()) return;
      node.classList.remove('s6-pop');
      void node.offsetWidth;
      node.classList.add('s6-pop');
    }
    function staggerIn(nodes, ms) {
      nodes.forEach((n, j) => {
        n.classList.remove('s6-stagger');
        void n.offsetWidth;
        n.style.animationDelay = (j * ms) + 'ms';
        n.classList.add('s6-stagger');
      });
    }

    let animToken = 0;

    function gather(tok) {
      let sum = 0;
      gVal.textContent = '0.00';
      tape.forEach((st, j) => {
        setTimeout(() => {
          if (tok !== animToken) return;
          sum += st.reward * Math.pow(GAMMA, j);
          prodCells[j].classList.remove('s6-glow');
          void prodCells[j].offsetWidth;
          prodCells[j].classList.add('s6-glow');
          gVal.textContent = fmt2(sum);
          if (window.SFX) window.SFX.play('cursor');
        }, 140 + j * 330);
      });
      setTimeout(() => {
        if (tok !== animToken) return;
        gVal.textContent = G_FINAL;
        pop(gTotal);
      }, 140 + tape.length * 330 + 80);
    }

    function applyStep(o) {
      const opts = o || {};
      animToken++;
      const tok = animToken;

      rawTotal.classList.toggle('s6-veil', step < 1);
      rWeight.classList.toggle('s6-hidden', step < 2);
      rProd.classList.toggle('s6-hidden', step < 3);
      gTotal.classList.toggle('s6-veil', step < 4);
      fcard.classList.toggle('s6-hidden', step < 5);
      caption.textContent = CAPTIONS[step];
      hint.textContent = HINTS[step];

      /* settle: clear transient animation classes, show the final value */
      weightCells.forEach((c) => c.classList.remove('s6-stagger'));
      prodCells.forEach((c) => { c.classList.remove('s6-stagger'); c.classList.remove('s6-glow'); });
      spark.classList.remove('s6-stagger');
      gVal.textContent = G_FINAL;

      if (!opts.flash || instantMode()) return;
      if (step === 1) pop(rawTotal);
      if (step === 2) staggerIn(weightCells.concat([spark]), 150);
      if (step === 3) staggerIn(prodCells, 120);
      if (step === 4) gather(tok);
      if (step === 5) { pop(fcard); pop(gchip); }
    }

    applyStep({});

    return {
      onEnter() {},
      onLeave() {},
      onNextKey() {
        if (step < MAX_STEP) {
          step++;
          applyStep({ flash: true });
          if (window.SFX) window.SFX.play('tick');
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (step > 0) {
          step--;
          applyStep({});
          return true;
        }
        return false;
      },
    };
  };
})();

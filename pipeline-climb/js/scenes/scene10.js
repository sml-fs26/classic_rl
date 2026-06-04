/* Scene 10 - Why DP does not scale.
 *
 *   The bridge from the clean DP sweep to learning-from-experience. Two
 *   reasons the tidy fill of the previous scene does not survive contact
 *   with a real pipeline, on a two-panel card:
 *
 *     (a) YOU RARELY KNOW THE STAGE DIE. In this toy the UP/STAY/DOWN odds
 *         were printed on every lever. In a real deal nobody hands you those
 *         odds: whether a lead warms or cools after a touch depends on the
 *         competitor in the deal, the buyer's mood, a budget freeze, a
 *         champion who quietly leaves. You only get to pull a lever and watch
 *         what the lead actually does, one touch at a time.
 *
 *     (b) THE STATE SPACE EXPLODES. This toy has five rungs. A real pipeline
 *         is (stages) x (account-size bands) x (industries) x (engagement
 *         signals) = a combinatorial blow-up, far too large to enumerate or
 *         sweep cell by cell.
 *
 *   DP is the IDEAL, not the METHOD. Bridge to SARSA: learn the scorecard
 *   from what actually happens, without ever owning the STAGE DIE.
 *
 *   Conceptual, light interaction: hovering a state-space factor highlights
 *   its contribution to the product. No gated animation; cold-entry safe
 *   (reads window.DATA dims + i18n only, never a prior scene). Contract:
 *     window.scenes.scene10 = function(root){ ...; return { ... }; }
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* The toy state count = the number of ladder rungs, read from DATA so it
     is never hand-typed (5: COLD..READY). */
  function toyN() {
    return (window.DATA && window.DATA.numRungs) ||
           (window.Pipeline && window.Pipeline.NUM_RUNGS) ||
           (window.DATA && window.DATA.rungs && window.DATA.rungs.length) || 5;
  }

  /* Illustrative real-pipeline factors. Their product is computed below so
     the blow-up number is DERIVED, not asserted; we render its order of
     magnitude rather than a fragile exact digit string. The first factor is
     the real number of pipeline stages (this toy collapses them to 5 rungs);
     the rest are lead features a CRM actually tracks. */
  const STATE_FACTORS = [
    { key: 'scale.b.factor.stages',   value: 8 },
    { key: 'scale.b.factor.accounts', value: 6 },
    { key: 'scale.b.factor.industry', value: 24 },
    { key: 'scale.b.factor.signals',  value: 4096 },
  ];

  /* Format a big value as "a.b x 10^n" pixel-mantissa markup; small values
     render as a plain integer. */
  function sciHTML(n) {
    if (n < 10000) return String(Math.round(n));
    const exp = Math.floor(Math.log10(n));
    const mant = n / Math.pow(10, exp);
    const mStr = (Math.round(mant * 10) / 10).toFixed(1);
    return mStr + ' &times; 10<sup>' + exp + '</sup>';
  }

  window.scenes.scene10 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'pc-scale-scene');
    root.innerHTML = '';

    /* ---- Heading ---- */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = T('scale.heading');
    root.appendChild(h);

    /* ---- Lede ---- */
    const lede = document.createElement('p');
    lede.className = 's10-lede';
    lede.innerHTML = T('scale.lede');
    root.appendChild(lede);

    /* ---- Two-panel card ---- */
    const grid = document.createElement('div');
    grid.className = 's10-grid';
    root.appendChild(grid);

    /* (a) You rarely know the STAGE DIE. */
    const panelA = document.createElement('div');
    panelA.className = 's10-panel s10-panel-a';
    panelA.innerHTML =
      '<div class="s10-panel-head">' +
        '<span class="s10-tag">' + T('scale.a.tag') + '</span>' +
        '<span class="s10-panel-title">' + T('scale.a.title') + '</span>' +
      '</div>';

    const aFormula = document.createElement('div');
    aFormula.className = 's10-formula';
    const aFlabel = document.createElement('div');
    aFlabel.className = 's10-formula-label';
    aFlabel.textContent = T('scale.a.formula.label');
    aFormula.appendChild(aFlabel);
    const aFhost = document.createElement('div');
    aFormula.appendChild(aFhost);
    window.Katex.render(
      String.raw`\underbrace{P(s' \mid s,\,a)}_{\textbf{?}}\quad\text{is hidden from you}`,
      aFhost, true
    );
    panelA.appendChild(aFormula);

    const aBody = document.createElement('p');
    aBody.className = 's10-body';
    aBody.innerHTML = T('scale.a.body');
    panelA.appendChild(aBody);

    const chips = document.createElement('div');
    chips.className = 's10-chips';
    ['competitor', 'mood', 'budget', 'champion'].forEach((k) => {
      const c = document.createElement('span');
      c.className = 's10-chip';
      c.textContent = T('scale.a.chip.' + k);
      chips.appendChild(c);
    });
    panelA.appendChild(chips);

    const aFoot = document.createElement('div');
    aFoot.className = 's10-panel-foot';
    aFoot.textContent = T('scale.a.foot');
    panelA.appendChild(aFoot);
    grid.appendChild(panelA);

    /* (b) The state space explodes. */
    const panelB = document.createElement('div');
    panelB.className = 's10-panel s10-panel-b';
    panelB.innerHTML =
      '<div class="s10-panel-head">' +
        '<span class="s10-tag">' + T('scale.b.tag') + '</span>' +
        '<span class="s10-panel-title">' + T('scale.b.title') + '</span>' +
      '</div>';

    const bBody = document.createElement('p');
    bBody.className = 's10-body';
    bBody.innerHTML = T('scale.b.body', { toy: toyN() });
    panelB.appendChild(bBody);

    /* |S| as a KaTeX product so the blow-up is read as a formula, not a
       claim. The factor values come from STATE_FACTORS (a stable mantissa
       is rendered below in the comparison bar). */
    const bFormula = document.createElement('div');
    bFormula.className = 's10-formula s10-formula-prod';
    const bFhost = document.createElement('div');
    bFormula.appendChild(bFhost);
    window.Katex.render(
      String.raw`|S| \;=\; \underbrace{\text{stages}}_{8} \times \underbrace{\text{accounts}}_{6} \times \underbrace{\text{industries}}_{24} \times \underbrace{\text{signals}}_{4096}`,
      bFhost, true
    );
    panelB.appendChild(bFormula);

    /* The multiplication that explodes, factor by factor (interactive: hover
       a factor to spotlight its contribution). */
    let product = 1;
    for (const f of STATE_FACTORS) product *= f.value;

    const calc = document.createElement('div');
    calc.className = 's10-explode';
    const factorsWrap = document.createElement('div');
    factorsWrap.className = 's10-explode-factors';
    STATE_FACTORS.forEach((f, i) => {
      const fEl = document.createElement('span');
      fEl.className = 's10-factor';
      fEl.tabIndex = 0;
      fEl.innerHTML =
        '<span class="s10-factor-val">' + f.value.toLocaleString('en-US') + '</span>' +
        '<span class="s10-factor-lab">' + T(f.key) + '</span>';
      factorsWrap.appendChild(fEl);
      if (i < STATE_FACTORS.length - 1) {
        const times = document.createElement('span');
        times.className = 's10-times';
        times.textContent = '×';
        factorsWrap.appendChild(times);
      }
    });
    calc.appendChild(factorsWrap);
    panelB.appendChild(calc);

    /* Toy vs real comparison bar. */
    const cmp = document.createElement('div');
    cmp.className = 's10-compare';
    cmp.innerHTML =
      '<div class="s10-cmp-row s10-cmp-toy">' +
        '<span class="s10-cmp-label">' + T('scale.b.toyLabel') + '</span>' +
        '<span class="s10-cmp-num">' + toyN() + '</span>' +
      '</div>' +
      '<div class="s10-cmp-row s10-cmp-real">' +
        '<span class="s10-cmp-label">' + T('scale.b.realLabel') + '</span>' +
        '<span class="s10-cmp-num s10-cmp-big">' + sciHTML(product) + '</span>' +
      '</div>' +
      '<div class="s10-cmp-equals">' + T('scale.b.equals') + '</div>';
    panelB.appendChild(cmp);

    const bFoot = document.createElement('div');
    bFoot.className = 's10-panel-foot';
    bFoot.textContent = T('scale.b.foot');
    panelB.appendChild(bFoot);
    grid.appendChild(panelB);

    /* ---- Verdict banner ---- */
    const verdict = document.createElement('div');
    verdict.className = 's10-verdict';
    verdict.textContent = T('scale.verdict');
    root.appendChild(verdict);

    /* ---- Bridge to SARSA ---- */
    const bridge = document.createElement('p');
    bridge.className = 's10-bridge';
    bridge.innerHTML = T('scale.bridge');
    root.appendChild(bridge);

    /* Light interaction: hovering / focusing a factor dims the others so the
       reader feels each multiplicand pile onto the product. Marked
       data-run-primary on the largest factor so &run can capture a live
       spotlight state headlessly. */
    const factorEls = Array.from(factorsWrap.querySelectorAll('.s10-factor'));
    factorEls.forEach((el, i) => {
      if (STATE_FACTORS[i].value === Math.max.apply(null, STATE_FACTORS.map(f => f.value))) {
        el.setAttribute('data-run-primary', '');
      }
      const on = () => { calc.classList.add('s10-spotlight'); el.classList.add('s10-factor-lit'); };
      const off = () => { calc.classList.remove('s10-spotlight'); el.classList.remove('s10-factor-lit'); };
      el.addEventListener('mouseenter', on);
      el.addEventListener('mouseleave', off);
      el.addEventListener('focus', on);
      el.addEventListener('blur', off);
    });

    return {};
  };
})();

/* Scene 10 -- Why DP does not scale.
 *
 *   Two reasons the clean sweep of scene 9 does not survive contact with a
 *   real revenue-management problem, on a two-panel card:
 *
 *     (a) YOU RARELY KNOW P. In the toy, the demand odds were printed on every
 *         lever. In the wild nobody hands you the deck: how many buyers show up
 *         at a price depends on competitors, weather, a viral post, the season,
 *         things you cannot read off. You only get to set a price and watch
 *         what actually sold.
 *
 *     (b) THE BOARD EXPLODES. The toy has 20 situations. A real fleet is
 *         (fare classes) x (departure dates) x (seat-map states) x (competitor
 *         prices) = billions of cells, impossible to enumerate or sweep.
 *
 *   DP is the IDEAL, not the METHOD. Bridge to SARSA: learn the playbook from
 *   what actually sells, without ever owning the demand model.
 *
 *   Static scene (no gated animation). Contract:
 *     window.scenes.scene10 = function(root){ ...; return {}; }
 *   Cold-entry safe: reads window.DATA dims + i18n only. */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* The toy board size, read from DATA (never hand-typed). */
  function toyN() {
    return (window.DATA && window.DATA.dims && window.DATA.dims.N) ||
           (window.Pricing && window.Pricing.N) || 20;
  }

  /* Illustrative real-fleet factors. Their product is computed below so the
     "explosion" number is derived, not asserted; we then render its order of
     magnitude rather than a fragile exact digit string. */
  const FLEET_FACTORS = [
    { key: 'scene10.b.factor.fare',  value: 12 },
    { key: 'scene10.b.factor.dates', value: 365 },
    { key: 'scene10.b.factor.seats', value: 180000 },   // remaining-seat configs
    { key: 'scene10.b.factor.comp',  value: 50 },
  ];

  /* Format a big integer-ish value as "a.b x 10^n" pixel-mantissa markup. */
  function sciHTML(n) {
    if (n < 10000) return String(Math.round(n));
    const exp = Math.floor(Math.log10(n));
    const mant = n / Math.pow(10, exp);
    const mStr = (Math.round(mant * 10) / 10).toFixed(1);
    return mStr + ' &times; 10<sup>' + exp + '</sup>';
  }

  window.scenes.scene10 = function (root) {
    root.className = 'scene-pad scene10';
    root.innerHTML = '';

    /* ---- Heading ---- */
    const h = document.createElement('h2');
    h.className = 's10-heading';
    h.textContent = T('scene10.title');
    root.appendChild(h);

    /* ---- Manager lede ---- */
    const lede = document.createElement('p');
    lede.className = 's10-lede';
    lede.innerHTML = T('scene10.lede');
    root.appendChild(lede);

    /* ---- Two-panel card ---- */
    const grid = document.createElement('div');
    grid.className = 's10-grid';
    root.appendChild(grid);

    /* (a) You rarely know P. */
    const panelA = document.createElement('div');
    panelA.className = 's10-panel poke-box tight s10-panel-a';
    panelA.innerHTML =
      '<div class="s10-panel-head">' +
        '<span class="s10-tag">' + T('scene10.a.tag') + '</span>' +
        '<span class="s10-panel-title">' + T('scene10.a.title') + '</span>' +
      '</div>';
    const aFormula = document.createElement('div');
    aFormula.className = 's10-formula';
    const aFlabel = document.createElement('div');
    aFlabel.className = 's10-formula-label';
    aFlabel.textContent = T('scene10.a.formula.label');
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
    aBody.innerHTML = T('scene10.a.body');
    panelA.appendChild(aBody);

    const chips = document.createElement('div');
    chips.className = 's10-chips';
    ['competitors', 'weather', 'viral', 'season'].forEach((k) => {
      const c = document.createElement('span');
      c.className = 's10-chip';
      c.textContent = T('scene10.a.chip.' + k);
      chips.appendChild(c);
    });
    panelA.appendChild(chips);

    const aFoot = document.createElement('div');
    aFoot.className = 's10-panel-foot';
    aFoot.textContent = T('scene10.a.foot');
    panelA.appendChild(aFoot);
    grid.appendChild(panelA);

    /* (b) The board explodes. */
    const panelB = document.createElement('div');
    panelB.className = 's10-panel poke-box tight s10-panel-b';
    panelB.innerHTML =
      '<div class="s10-panel-head">' +
        '<span class="s10-tag">' + T('scene10.b.tag') + '</span>' +
        '<span class="s10-panel-title">' + T('scene10.b.title') + '</span>' +
      '</div>';

    const bBody = document.createElement('p');
    bBody.className = 's10-body';
    bBody.innerHTML = T('scene10.b.body', { toy: toyN() });
    panelB.appendChild(bBody);

    /* The multiplication that explodes. */
    let product = 1;
    for (const f of FLEET_FACTORS) product *= f.value;

    const calc = document.createElement('div');
    calc.className = 's10-explode';
    let calcHtml = '<div class="s10-explode-factors">';
    FLEET_FACTORS.forEach((f, i) => {
      calcHtml +=
        '<span class="s10-factor">' +
          '<span class="s10-factor-val">' + f.value.toLocaleString('en-US') + '</span>' +
          '<span class="s10-factor-lab">' + T(f.key) + '</span>' +
        '</span>';
      if (i < FLEET_FACTORS.length - 1) calcHtml += '<span class="s10-times">&times;</span>';
    });
    calcHtml += '</div>';
    calc.innerHTML = calcHtml;
    panelB.appendChild(calc);

    /* Toy vs real comparison bar. */
    const cmp = document.createElement('div');
    cmp.className = 's10-compare';
    cmp.innerHTML =
      '<div class="s10-cmp-row s10-cmp-toy">' +
        '<span class="s10-cmp-label">' + T('scene10.b.toyLabel') + '</span>' +
        '<span class="s10-cmp-num">' + toyN() + '</span>' +
      '</div>' +
      '<div class="s10-cmp-row s10-cmp-real">' +
        '<span class="s10-cmp-label">' + T('scene10.b.realLabel') + '</span>' +
        '<span class="s10-cmp-num s10-cmp-big">' + sciHTML(product) + '</span>' +
      '</div>' +
      '<div class="s10-cmp-equals">' + T('scene10.b.equals') + '</div>';
    panelB.appendChild(cmp);

    const bFoot = document.createElement('div');
    bFoot.className = 's10-panel-foot';
    bFoot.textContent = T('scene10.b.foot');
    panelB.appendChild(bFoot);
    grid.appendChild(panelB);

    /* ---- Verdict banner ---- */
    const verdict = document.createElement('div');
    verdict.className = 's10-verdict';
    verdict.textContent = T('scene10.verdict');
    root.appendChild(verdict);

    /* ---- Bridge to SARSA ---- */
    const bridge = document.createElement('p');
    bridge.className = 's10-bridge';
    bridge.innerHTML = T('scene10.bridge');
    root.appendChild(bridge);

    return {};
  };
})();

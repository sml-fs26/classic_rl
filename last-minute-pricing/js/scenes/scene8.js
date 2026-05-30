/* Scene 8 -- Bellman: today vs tomorrow.
 *
 *   The Bellman optimality equation
 *       Q*(s, a) = E[ R + max_{a'} Q*(S', a') ]
 *   as a KaTeX formula card, read in plain English over the board, with a
 *   worked one-step backup on a LAST-DAY corner cell (3 units, 1 day). On the
 *   last day every "tomorrow" is the deadline (worth $0), so the future term
 *   vanishes and Q* is just the cash expected today:
 *       FIRE-SALE = 2 * (0.2*1 + 0.4*2 + 0.4*3) = 4.40.
 *
 *   The learner picks a lever; the term-by-term breakdown is computed live
 *   from window.Pricing.successors (never hand-typed). The verdict appears
 *   only after all three levers have been backed up, so no answer is shown
 *   before the learner can attempt it.
 *
 *   Contract: window.scenes.scene8 = function(root){ ...; return {...}; }
 *   Cold-entry safe: reads window.Pricing / window.Levers / window.DATA. */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const P = window.Pricing;
  const L = window.Levers;
  const LEVER_IDS = L.LEVER_IDS;                 // [premium, standard, firesale]

  /* The worked cell: 3 units, last day. All futures = deadline ($0). */
  const WORKED = { u: 3, d: 1 };

  function leverName(id) { return T('lever.' + id); }
  function money(v) { return '$' + (Math.round(v * 100) / 100).toFixed(2); }
  function fmtP(p) { return p.toFixed(2); }

  /* Compute the term-by-term backup of Q*(WORKED, leverId) straight from the
     engine's successor enumeration. Returns the rows + the total so the panel
     never hand-types a value. */
  function backup(state, leverId) {
    const lever = L.LEVER_BY_ID[leverId];
    const price = lever.price;
    const rows = [];
    let total = 0;
    /* Walk the printed demand distribution in its natural order. */
    for (const kp of lever.demand) {
      const k = kp[0], p = kp[1];
      const sold = Math.min(k, state.u);
      const rev = price * sold;
      const contrib = p * rev;     // future term is 0 on the last day
      total += contrib;
      rows.push({ p, k, sold, capped: sold < k, price, rev, contrib });
    }
    return { rows, total, price };
  }

  window.scenes.scene8 = function (root) {
    root.className = 'scene-pad scene8';
    root.innerHTML = '';

    /* ---- Heading ---- */
    const h = document.createElement('h2');
    h.className = 's8-heading';
    h.textContent = T('scene8.title');
    root.appendChild(h);

    /* ---- Manager-first lede ---- */
    const lede = document.createElement('p');
    lede.className = 's8-lede';
    lede.innerHTML = T('scene8.lede');
    root.appendChild(lede);

    /* ---- Bellman formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 's8-formula-card';
    const flabel = document.createElement('div');
    flabel.className = 's8-formula-label';
    flabel.textContent = T('scene8.formula.label');
    fcard.appendChild(flabel);
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    const bellmanTex = (window.DATA && window.DATA.tex && window.DATA.tex.bellman) ||
      String.raw`Q^{*}(s,a) \;=\; \mathbb{E}\,[\, R + \max_{a'} Q^{*}(S',a') \,]`;
    window.Katex.render(bellmanTex, fhost, true);
    root.appendChild(fcard);

    /* ---- Two-column body: the "read it" panel + the worked backup ---- */
    const body = document.createElement('div');
    body.className = 's8-body';
    root.appendChild(body);

    /* ---- Bridge footer to scene 9 (appended after the body below) ---- */
    const bridge = document.createElement('div');
    bridge.className = 's8-bridge';
    bridge.innerHTML = T('scene8.bridge');

    /* (a) Plain-English read of the equation. */
    const read = document.createElement('div');
    read.className = 's8-read poke-box tight';
    read.innerHTML =
      '<div class="s8-read-title">' + T('scene8.read.title') + '</div>' +
      '<ul class="s8-read-list">' +
        '<li><span class="s8-bullet s8-bullet-lhs"></span>' + T('scene8.read.lhs') + '</li>' +
        '<li><span class="s8-bullet s8-bullet-r"></span>'   + T('scene8.read.r')   + '</li>' +
        '<li><span class="s8-bullet s8-bullet-max"></span>' + T('scene8.read.max') + '</li>' +
        '<li><span class="s8-bullet s8-bullet-exp"></span>' + T('scene8.read.exp') + '</li>' +
      '</ul>';
    body.appendChild(read);

    /* (b) Worked one-step backup on the last-day corner cell. */
    const worked = document.createElement('div');
    worked.className = 's8-worked';
    body.appendChild(worked);

    const wTitle = document.createElement('div');
    wTitle.className = 's8-worked-title';
    wTitle.innerHTML = T('scene8.worked.title');
    worked.appendChild(wTitle);

    /* Shelf card for the worked state + its subtitle. */
    const wTop = document.createElement('div');
    wTop.className = 's8-worked-top';
    const cardHost = document.createElement('div');
    cardHost.className = 's8-worked-card';
    if (window.ShelfCard) {
      cardHost.appendChild(window.ShelfCard.render(
        { u: WORKED.u, d: WORKED.d }, { size: 'sm', label: true }
      ));
    }
    wTop.appendChild(cardHost);
    const wSub = document.createElement('div');
    wSub.className = 's8-worked-sub';
    wSub.innerHTML =
      '<div class="s8-worked-state">' +
        T('scene8.worked.subtitle', { u: WORKED.u, d: WORKED.d }) +
      '</div>' +
      '<div class="s8-worked-lastday">' + T('scene8.worked.lastday') + '</div>';
    wTop.appendChild(wSub);
    worked.appendChild(wTop);

    /* The last-day reduced form, in KaTeX. */
    const reduced = document.createElement('div');
    reduced.className = 's8-reduced';
    window.Katex.render(
      String.raw`Q^{*}(s, a)\;=\;\underbrace{\mathbb{E}[\,R\,]}_{\text{today}}\;+\;\underbrace{0}_{\text{deadline}}`,
      reduced, true
    );
    worked.appendChild(reduced);

    /* Lever picker. */
    const pick = document.createElement('div');
    pick.className = 's8-pick-label';
    pick.textContent = T('scene8.worked.pick');
    worked.appendChild(pick);

    const picker = document.createElement('div');
    picker.className = 's8-picker';
    LEVER_IDS.forEach((id) => {
      const lever = L.LEVER_BY_ID[id];
      const tag = document.createElement('button');
      tag.className = 'lever-tag s8-lever';
      tag.dataset.lever = id;
      tag.innerHTML = leverName(id) + ' <span class="lever-price">$' + lever.price + '</span>';
      picker.appendChild(tag);
    });
    worked.appendChild(picker);

    /* The calculation panel (filled when a lever is picked). */
    const calc = document.createElement('div');
    calc.className = 's8-calc poke-box tight';
    worked.appendChild(calc);

    /* The verdict line (revealed only after all three are backed up). */
    const verdict = document.createElement('div');
    verdict.className = 's8-verdict';
    worked.appendChild(verdict);

    /* ---- State ---- */
    const seen = {};                 // leverId -> computed total
    let activeLever = null;

    function renderCalc(leverId) {
      const bk = backup(WORKED, leverId);
      seen[leverId] = bk.total;

      let html =
        '<div class="s8-calc-head">' +
          '<span class="lever-tag s8-calc-tag" data-lever="' + leverId + '">' +
            leverName(leverId) + ' <span class="lever-price">$' + bk.price + '</span>' +
          '</span>' +
          '<span class="s8-calc-demand">' + T('scene8.calc.demandLabel') + '</span>' +
        '</div>';

      html += '<div class="s8-calc-terms">';
      for (const r of bk.rows) {
        const key = r.capped ? 'scene8.calc.termCapped' : 'scene8.calc.term';
        html +=
          '<div class="s8-calc-line">' +
            T(key, {
              p: fmtP(r.p), k: r.k, sold: r.sold, u: WORKED.u,
              price: '$' + r.price, rev: money(r.rev),
            }) +
            ' <span class="s8-term-val">= ' + money(r.contrib) + '</span>' +
          '</div>';
      }
      html += '</div>';

      html +=
        '<div class="s8-calc-total">' +
          '<span class="s8-calc-sum">' + T('scene8.calc.sumLabel', { lever: leverName(leverId) }) + '</span>' +
          '<span class="s8-calc-future">' + T('scene8.calc.future0') + '</span>' +
          '<span class="s8-calc-amount">' + T('scene8.calc.total', { total: money(bk.total) }) + '</span>' +
        '</div>';

      calc.innerHTML = html;
      calc.classList.add('is-live');

      if (window.SFX) window.SFX.play('cursor');
      maybeVerdict();
    }

    function maybeVerdict() {
      /* Reveal the verdict only once the learner has backed up all three
         levers themselves -- no answer before the attempt. */
      if (Object.keys(seen).length < LEVER_IDS.length) return;
      let bestId = LEVER_IDS[0], bestV = -Infinity;
      for (const id of LEVER_IDS) {
        if (seen[id] > bestV) { bestV = seen[id]; bestId = id; }
      }
      verdict.innerHTML =
        '<div class="s8-verdict-line">' + T('scene8.verdict.best', { lever: leverName(bestId) }) + '</div>' +
        '<div class="s8-verdict-row">' +
          LEVER_IDS.map((id) =>
            '<span class="lever-tag s8-verdict-tag' + (id === bestId ? ' is-best' : '') + '" data-lever="' + id + '">' +
              (id === bestId ? '★ ' : '') + L.LEVER_BY_ID[id].name + ' ' + money(seen[id]) +
            '</span>'
          ).join('') +
        '</div>';
      verdict.classList.add('is-shown');
      if (window.SFX) window.SFX.play('hit');
    }

    function selectLever(id) {
      activeLever = id;
      for (const btn of picker.querySelectorAll('.s8-lever')) {
        btn.classList.toggle('is-active', btn.dataset.lever === id);
      }
      renderCalc(id);
    }

    picker.querySelectorAll('.s8-lever').forEach((btn) => {
      btn.addEventListener('click', () => selectLever(btn.dataset.lever));
    });

    /* Bridge sits at the bottom of the scene. */
    root.appendChild(bridge);

    /* &run: auto-walk all three backups for headless capture. */
    if (window.PRICING_AUTORUN) {
      let i = 0;
      const tick = () => {
        if (i >= LEVER_IDS.length) return;
        selectLever(LEVER_IDS[i]);
        i++;
        setTimeout(tick, 120);
      };
      setTimeout(tick, 150);
    } else {
      /* Default: prime the panel with a hint to pick. */
      calc.innerHTML = '<div class="s8-calc-empty">' + T('scene8.worked.pick') + '</div>';
    }

    return {
      onEnter() { /* cold-entry already built everything from DATA. */ },
      onNextKey() {
        /* Right arrow steps through the three backups, then yields. */
        const idx = activeLever ? LEVER_IDS.indexOf(activeLever) : -1;
        if (idx < LEVER_IDS.length - 1) { selectLever(LEVER_IDS[idx + 1]); return true; }
        return false;
      },
      onPrevKey() { return false; },
    };
  };
})();

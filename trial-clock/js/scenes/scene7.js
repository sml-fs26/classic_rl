/* Scene 7 -- Optimal action-value Q*. For a chosen situation, show the Trial
   Card beside a clean two-column table (lever a | Q*(s,a)) with the best row
   starred. Step through the contrast: a COLD day-5 user (NUDGE wins, PUSH is
   negative), an ACTIVATED day-5 user (the SAME push is the star, ~+20), a mid
   user, the mid day-3 flip, and the dead cell. The contrast between the cold and
   activated cards is the whole lesson. Reads Q* from window.DATA. Cold-entry
   safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Trial, D = window.DATA || {};
  const LEVER_IDS = window.Levers.LEVER_IDS;
  const LEVER_BY_ID = window.Levers.LEVER_BY_ID;
  const A = LEVER_IDS.length;
  /* the tour cells: [tier, days, read-key] */
  const TOUR = [
    { tier: 0, days: 5, key: 'cold5' },
    { tier: 4, days: 5, key: 'activated5' },
    { tier: 2, days: 5, key: 'mid5' },
    { tier: 2, days: 3, key: 'mid3' },
    { tier: 0, days: 1, key: 'dead' },
  ];

  function siOf(t, d) { return t * G.N_DAYS + (d - 1); }
  function qRow(t, d) {
    const base = siOf(t, d) * A;
    const out = {};
    for (let a = 0; a < A; a++) out[LEVER_IDS[a]] = D.Qstar ? D.Qstar[base + a] : null;
    return out;
  }
  function bestLever(t, d) {
    const r = qRow(t, d);
    let best = -Infinity, id = null;
    for (const lid of LEVER_IDS) { const v = r[lid]; if (v == null) continue; if (v > best) { best = v; id = lid; } }
    return id;
  }

  window.scenes.scene7 = function (root) {
    root.className = 'scene scene-pad sc7';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene7.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene7.lede') + '</p>' +
      '<div class="formula-card sc7-formula">' +
        '<div class="formula-label">' + T('scene7.formulaLabel') + '</div>' +
        '<div class="sc7-formula-host"></div>' +
      '</div>' +
      '<div class="sc7-pick"><span class="muted">' + T('scene7.pick') + '</span><span class="sc7-pick-btns"></span></div>' +
      '<div class="scene-row sc7-row">' +
        '<div class="sc7-card-host"></div>' +
        '<div class="sc7-table-col grow">' +
          '<div class="sc7-at" id="sc7-at"></div>' +
          '<table class="sc7-table"><thead><tr>' +
            '<th>' + T('scene7.colLever') + '</th><th>' + T('scene7.colQ') + '</th>' +
          '</tr></thead><tbody id="sc7-tbody"></tbody></table>' +
          '<div class="poke-box sc7-read" id="sc7-read"></div>' +
        '</div>' +
      '</div>' +
      '<p class="sc7-note muted">' + T('scene7.note') + '</p>' +
      '<div class="poke-box sc7-framing">' + T('scene7.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.qstar) || 'Q^{*}(s,a) = \\max_\\pi \\mathbb{E}[G_i \\mid s,a]',
      root.querySelector('.sc7-formula-host'), true);

    const card = window.TrialCard.mount(root.querySelector('.sc7-card-host'), {});

    const btns = root.querySelector('.sc7-pick-btns');
    btns.innerHTML = TOUR.map((c, i) =>
      '<button class="tc-btn sc7-pickbtn" data-i="' + i + '" type="button">' + T('scene7.btn.' + c.key) + '</button>').join('');

    let cur = 0;
    function render(i) {
      cur = i;
      const c = TOUR[i];
      card.setState(c.tier, c.days); card.pulse();
      root.querySelector('#sc7-at').innerHTML = T('scene7.at', { tier: G.tierLabel(c.tier), days: c.days });
      const r = qRow(c.tier, c.days), best = bestLever(c.tier, c.days);
      const tb = root.querySelector('#sc7-tbody');
      tb.innerHTML = LEVER_IDS.map((lid) => {
        const v = r[lid];
        const name = (LEVER_BY_ID[lid] && LEVER_BY_ID[lid].name) || lid;
        const isBest = lid === best;
        const neg = v != null && v < 0;
        return '<tr class="sc7-tr' + (isBest ? ' is-best' : '') + (neg ? ' is-neg' : '') + '">' +
          '<td><span class="lever-tag" data-lever="' + lid + '">' + name + '</span></td>' +
          '<td class="sc7-q"><span class="sc7-qval">' + (v == null ? '--' : (v >= 0 ? '+' : '') + v.toFixed(2)) + '</span>' +
            (isBest ? ' <span class="sc7-star">★</span><span class="sc7-besttag">' + T('scene7.best') + '</span>' : '') +
          '</td></tr>';
      }).join('');
      root.querySelector('#sc7-read').innerHTML = T('scene7.read.' + c.key);
      root.querySelectorAll('.sc7-pickbtn').forEach(b => b.classList.toggle('primary', parseInt(b.dataset.i, 10) === i));
    }
    root.querySelectorAll('.sc7-pickbtn').forEach(b => b.addEventListener('click', () => render(parseInt(b.dataset.i, 10))));

    render(0);

    return {
      onEnter() { render(cur); },
      onNextKey() { if (cur < TOUR.length - 1) { render(cur + 1); return true; } return false; },
      onPrevKey() { if (cur > 0) { render(cur - 1); return true; } return false; },
    };
  };
})();

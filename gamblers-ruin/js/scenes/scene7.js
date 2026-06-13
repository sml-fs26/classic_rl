/* Scene 7 -- Optimal action-value Q*. For a chosen capital, show the ladder
   icon (token on that rung) beside a clean two-column table (stake a | Q*(s,a))
   with the best row starred and clamped stakes greyed. Step through $3 (bold
   wins), $5 (the tie), $8 (forced $2), $9 (forced $1): the star moves. Reads
   Q* from window.DATA. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Gambler, D = window.DATA || {};
  const STAKE_IDS = window.Stakes.STAKE_IDS;
  const STAKE_BY_ID = window.Stakes.STAKE_BY_ID;
  const A = STAKE_IDS.length;
  const TOUR = [3, 5, 8, 9];   // the rungs the script calls out

  function qRow(cap) {
    const base = (cap - 1) * A;
    const out = {};
    for (let a = 0; a < A; a++) {
      const v = D.Qstar ? D.Qstar[base + a] : null;
      out[STAKE_IDS[a]] = v;
    }
    return out;
  }
  function bestStake(cap) {
    const r = qRow(cap);
    let best = -Infinity, id = null;
    for (const sid of STAKE_IDS) {
      const v = r[sid];
      if (v == null) continue;
      if (v >= best) { best = v; id = sid; }     // larger stake wins ties
    }
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
        '<div class="sc7-ladder-host"></div>' +
        '<div class="sc7-table-col grow">' +
          '<div class="sc7-at" id="sc7-at"></div>' +
          '<table class="sc7-table"><thead><tr>' +
            '<th>' + T('scene7.colStake') + '</th><th>' + T('scene7.colQ') + '</th>' +
          '</tr></thead><tbody id="sc7-tbody"></tbody></table>' +
          '<div class="poke-box sc7-read" id="sc7-read"></div>' +
        '</div>' +
      '</div>' +
      '<p class="sc7-note muted">' + T('scene7.note') + '</p>' +
      '<div class="poke-box sc7-framing">' + T('scene7.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.qstar) || 'Q^{*}(s,a) = \\max_\\pi \\mathbb{E}[G_i \\mid s,a]',
      root.querySelector('.sc7-formula-host'), true);

    const ladder = window.QLadder.mount(root.querySelector('.sc7-ladder-host'), { variant: 'icon' });

    /* rung picker buttons */
    const btns = root.querySelector('.sc7-pick-btns');
    btns.innerHTML = TOUR.map(c => '<button class="gr-btn sc7-pickbtn" data-cap="' + c + '" type="button">$' + c + '</button>').join('');

    let cur = TOUR[0];
    function render(cap) {
      cur = cap;
      ladder.setToken(cap); ladder.pulseToken();
      root.querySelector('#sc7-at').innerHTML = T('scene7.at', { cap: cap });
      const r = qRow(cap), best = bestStake(cap);
      const tb = root.querySelector('#sc7-tbody');
      tb.innerHTML = STAKE_IDS.map((sid) => {
        const v = r[sid];
        const name = (STAKE_BY_ID[sid] && STAKE_BY_ID[sid].name) || sid;
        if (v == null) {
          return '<tr class="sc7-tr clamped"><td><span class="stake-tag" data-stake="' + sid + '">' + name + '</span></td>' +
                 '<td class="sc7-q muted">' + T('scene7.clamped') + '</td></tr>';
        }
        const isBest = sid === best;
        return '<tr class="sc7-tr' + (isBest ? ' is-best' : '') + '">' +
          '<td><span class="stake-tag" data-stake="' + sid + '">' + name + '</span></td>' +
          '<td class="sc7-q"><span class="sc7-qval">' + v.toFixed(3) + '</span>' +
            (isBest ? ' <span class="sc7-star">★</span><span class="sc7-besttag">' + T('scene7.best') + '</span>' : '') +
          '</td></tr>';
      }).join('');
      const readKey = 'scene7.read.' + cap;
      root.querySelector('#sc7-read').innerHTML = T(readKey);
      root.querySelectorAll('.sc7-pickbtn').forEach(b => b.classList.toggle('primary', parseInt(b.dataset.cap, 10) === cap));
    }
    root.querySelectorAll('.sc7-pickbtn').forEach(b => b.addEventListener('click', () => render(parseInt(b.dataset.cap, 10))));

    render(TOUR[0]);

    return {
      onEnter() { render(cur); },
      onNextKey() {
        const i = TOUR.indexOf(cur);
        if (i < TOUR.length - 1) { render(TOUR[i + 1]); return true; }
        return false;
      },
      onPrevKey() {
        const i = TOUR.indexOf(cur);
        if (i > 0) { render(TOUR[i - 1]); return true; }
        return false;
      },
    };
  };
})();

/* Scene 7 -- Optimal action-value Q*. For a chosen shelf state, show the
   croissant-icon beside a clean two-column table (lever a | Q*(s,a)) with the
   best row starred. Step through the tour (2,FRESH) -> (2,AGING) -> (2,OLD) ->
   (1,STALE): the star MARCHES HOLD -> DISCOUNT -> DUMP, almost purely down the
   age axis. Reads DATA.spotTour. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const LEVER_IDS = (window.Levers && window.Levers.LEVER_IDS) || ['HOLD', 'DISCOUNT', 'DUMP'];
  const TOUR = D.spotTour || [];

  window.scenes.scene7 = function (root) {
    root.className = 'scene scene-pad sc7';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene7.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene7.lede') + '</p>' +
      '<div class="formula-card sc7-formula"><div class="formula-label">' + T('scene7.formulaLabel') + '</div><div id="sc7-f"></div></div>' +
      '<div class="sc7-pick"><span class="muted">' + T('scene7.pick') + '</span><span class="sc7-pick-btns" id="sc7-pick"></span></div>' +
      '<div class="scene-row sc7-row">' +
        '<div class="sc7-shelf-col">' +
          '<div class="shelf-icon sc7-shelf" id="sc7-shelf"></div>' +
        '</div>' +
        '<div class="sc7-table-col grow">' +
          '<div class="sc7-at" id="sc7-at"></div>' +
          '<table class="sc7-table"><thead><tr><th>' + T('scene7.colLever') + '</th><th>' + T('scene7.colQ') + '</th></tr></thead><tbody id="sc7-tbody"></tbody></table>' +
          '<div class="poke-box sc7-read" id="sc7-read"></div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc7-framing">' + T('scene7.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.qstar) || 'Q^{*}(s,a) = \\max_\\pi \\mathbb{E}[G_i \\mid s,a]', root.querySelector('#sc7-f'), true);

    const pick = root.querySelector('#sc7-pick');
    pick.innerHTML = TOUR.map((s, i) =>
      '<button class="poke-btn sc7-pickbtn" data-i="' + i + '" type="button">' + s.units + '&times;' + T('tier.' + s.tier) + '</button>').join('');

    let cur = 0;
    function render(i) {
      cur = i;
      const s = TOUR[i]; if (!s) return;
      const shelf = root.querySelector('#sc7-shelf');
      let tray = '';
      for (let k = 0; k < s.units; k++) tray += window.Croissant.svg(s.tier, { px: 5 });
      shelf.innerHTML = '<div class="shelf-tray">' + tray + '</div><div class="shelf-label">s = (' + s.units + ', ' + T('tier.' + s.tier) + ')</div>';

      root.querySelector('#sc7-at').innerHTML = T('scene7.at', { u: s.units, tier: T('tier.' + s.tier) });
      const tb = root.querySelector('#sc7-tbody');
      tb.innerHTML = LEVER_IDS.map(id => {
        const v = s.q[id];
        const isBest = id === s.best;
        return '<tr class="sc7-tr ' + (isBest ? 'is-best' : '') + '">' +
          '<td><span class="sc7-lev lev-' + id.toLowerCase() + '">' + T('lever.' + id) + '</span></td>' +
          '<td class="sc7-q"><span class="sc7-qval">' + v.toFixed(2) + '</span>' +
            (isBest ? ' <span class="sc7-star">&#9733;</span><span class="sc7-besttag">' + T('scene7.best') + '</span>' : '') +
          '</td></tr>';
      }).join('');
      root.querySelector('#sc7-read').innerHTML = T('scene7.read.' + s.tier);
      root.querySelectorAll('.sc7-pickbtn').forEach(b => b.classList.toggle('primary', parseInt(b.dataset.i, 10) === i));
    }
    root.querySelectorAll('.sc7-pickbtn').forEach(b => b.addEventListener('click', () => { render(parseInt(b.dataset.i, 10)); if (window.SFX) window.SFX.play('cursor'); }));

    render(0);

    return {
      onEnter() { render(cur); },
      onNextKey() { if (cur < TOUR.length - 1) { render(cur + 1); return true; } return false; },
      onPrevKey() { if (cur > 0) { render(cur - 1); return true; } return false; },
    };
  };
})();

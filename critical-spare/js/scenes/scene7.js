/* Scene 7, Optimal action-value Q*. For a chosen situation, show the machine
   icon beside a clean two-column table (lever a | Q*(s,a)) with the best row
   starred + clamped levers greyed. Step the picker across (HEALTHY,0)->RUN,
   (AGING,0)->ORDER, (FAILING,0)->ORDER, (FAILING,1)->REPLACE: the star moves,
   previewing the twist. Reads Q* from window.DATA. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const D = window.DATA || {};
  const LEVER_IDS = window.Levers.LEVER_IDS;
  const A = LEVER_IDS.length;
  /* the tour: [h, s, readKey] */
  const TOUR = [[0, 0, 'h0s0'], [1, 0, 'h1s0'], [2, 0, 'h2s0'], [2, 1, 'h2s1']];

  function qRow(h, s) {
    const base = (h * M.NS + s) * A;
    const out = {};
    for (let a = 0; a < A; a++) out[LEVER_IDS[a]] = D.Qstar ? D.Qstar[base + a] : null;
    return out;
  }
  function bestLever(h, s) {
    const r = qRow(h, s);
    let best = -Infinity, id = null;
    for (const lid of LEVER_IDS) { const v = r[lid]; if (v == null) continue; if (v >= best) { best = v; id = lid; } }
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
        '<div class="sc7-left">' +
          '<div class="sc7-machine-host"></div>' +
        '</div>' +
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

    const icon = window.MachineIcon.mount(root.querySelector('.sc7-machine-host'), { size: 'lg', showLabel: true });

    const btns = root.querySelector('.sc7-pick-btns');
    btns.innerHTML = TOUR.map(([h, s], i) =>
      '<button class="cs-btn sc7-pickbtn" data-i="' + i + '" type="button">' +
        T('health.' + ['healthy', 'aging', 'failing'][h]) + ' / ' + s + 'sp</button>').join('');

    let cur = 0;
    function render(i) {
      cur = i;
      const [h, s, readKey] = TOUR[i];
      icon.set(h, s); icon.pulse();
      root.querySelector('#sc7-at').innerHTML = T('scene7.at', { state: T('health.' + ['healthy', 'aging', 'failing'][h]) + ' / ' + s + ' SP' });
      const r = qRow(h, s), best = bestLever(h, s);
      const tb = root.querySelector('#sc7-tbody');
      tb.innerHTML = LEVER_IDS.map((lid) => {
        const v = r[lid];
        const name = T('lever.' + lid);
        if (v == null) {
          return '<tr class="sc7-tr clamped"><td><span class="lever-tag" data-lever="' + lid + '">' + name + '</span></td>' +
                 '<td class="sc7-q muted">' + T('scene7.clamped') + '</td></tr>';
        }
        const isBest = lid === best;
        return '<tr class="sc7-tr' + (isBest ? ' is-best' : '') + '">' +
          '<td><span class="lever-tag" data-lever="' + lid + '">' + name + '</span></td>' +
          '<td class="sc7-q"><span class="sc7-qval">' + v.toFixed(2) + '</span>' +
            (isBest ? ' <span class="sc7-star">★</span><span class="sc7-besttag">' + T('scene7.best') + '</span>' : '') +
          '</td></tr>';
      }).join('');
      root.querySelector('#sc7-read').innerHTML = T('scene7.read.' + readKey);
      root.querySelectorAll('.sc7-pickbtn').forEach((b, idx) => b.classList.toggle('primary', idx === i));
    }
    root.querySelectorAll('.sc7-pickbtn').forEach((b) => b.addEventListener('click', () => render(parseInt(b.dataset.i, 10))));

    render(0);

    return {
      onEnter() { render(cur); },
      onNextKey() { if (cur < TOUR.length - 1) { render(cur + 1); return true; } return false; },
      onPrevKey() { if (cur > 0) { render(cur - 1); return true; } return false; },
    };
  };
})();

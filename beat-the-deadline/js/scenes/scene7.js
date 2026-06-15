/* Scene 7, Optimal action-value Q*. For a chosen tile, show the dock-tile
   icon beside a clean two-column table (lever a | Q*(s,a)) with the best row
   starred and clamped levers greyed. Toggle between (2,3), where WAIT wins by
   the razor-thin +0.40, and (2,2) one hour later, where the star JUMPS to
   SEND. Reads Q* spot rows from window.DATA.spotQ. Cold-entry safe; honours
   &run (auto-advances to show the flip). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const ACTION_IDS = (window.Actions && window.Actions.ACTION_IDS) || ['wait', 'send'];

  /* The two tiles the script calls out, in order: the flip pair. */
  const TOUR = [
    { spot: D.spotQ && D.spotQ.flipHi, readKey: 'scene7.flip1', labelKey: 'scene7.cell1' }, // (2,3) WAIT
    { spot: D.spotQ && D.spotQ.flipLo, readKey: 'scene7.flip2', labelKey: 'scene7.cell2' }, // (2,2) SEND
  ];

  function fmtQ(v) {
    if (v == null) return '--';
    if (Math.abs(v - Math.round(v)) < 1e-6) return (v > 0 ? '+' : '') + Math.round(v);
    return (v > 0 ? '+' : '') + v.toFixed(2);
  }

  window.scenes.scene7 = function (root) {
    root.className = 'scene scene-pad sc7 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene7.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene7.lede') + '</p>' +
      '<div class="formula-card compact"><div class="sc7-tex"></div></div>' +
      '<div class="scene-row sc7-row">' +
        '<div class="sc7-left">' +
          '<div class="sc7-tile-host"></div>' +
          '<div class="sc7-at" id="sc7-at"></div>' +
        '</div>' +
        '<div class="sc7-table-col grow">' +
          '<table class="sc7-table"><thead><tr>' +
            '<th>' + T('action.send') + ' / ' + T('action.wait') + '</th><th>Q*(s, a)</th>' +
          '</tr></thead><tbody id="sc7-tbody"></tbody></table>' +
          '<div class="poke-box sc7-read" id="sc7-read"></div>' +
        '</div>' +
      '</div>' +
      '<div class="btd-btn-row sc7-toggle">' +
        '<button class="btd-btn sc7-prev" type="button" disabled>&lsaquo; ' + T('scene7.show1') + '</button>' +
        '<button class="btd-btn primary sc7-next" type="button">' + T('scene7.show2') + ' &rsaquo;</button>' +
      '</div>' +
      '<div class="poke-box sc7-framing">' + T('scene7.framing') + '</div>';

    if (window.Katex) window.Katex.render((D.tex && D.tex.qstar) || 'Q^{*}(s,a) = \\max_\\pi \\mathbb{E}[G_i \\mid s,a]', root.querySelector('.sc7-tex'), true);

    const tile = window.DockBoard.mount(root.querySelector('.sc7-tile-host'), { variant: 'icon', p: 2, h: 3 });
    const prevBtn = root.querySelector('.sc7-prev');
    const nextBtn = root.querySelector('.sc7-next');

    let cur = 0;
    function render(i) {
      cur = i;
      const item = TOUR[i];
      const spot = item.spot || { p: 2, h: 3, q: { wait: 0.4, send: 0 }, best: 'wait', legal: ['wait', 'send'] };
      tile.setState(spot.p, spot.h); tile.pulse();
      root.querySelector('#sc7-at').innerHTML = T(item.labelKey);

      const tb = root.querySelector('#sc7-tbody');
      tb.innerHTML = ACTION_IDS.map((id) => {
        const v = spot.q ? spot.q[id] : null;
        const legal = spot.legal ? spot.legal.indexOf(id) >= 0 : true;
        const name = T('action.' + id);
        if (!legal || v == null) {
          return '<tr class="sc7-tr clamped"><td><span class="lever-tag" data-action="' + id + '">' + name + '</span></td>' +
                 '<td class="sc7-q muted">--</td></tr>';
        }
        const isBest = id === spot.best;
        return '<tr class="sc7-tr' + (isBest ? ' is-best' : '') + '">' +
          '<td><span class="lever-tag" data-action="' + id + '">' + name + '</span></td>' +
          '<td class="sc7-q"><span class="sc7-qval">' + fmtQ(v) + '</span>' +
            (isBest ? ' <span class="sc7-star">★</span><span class="sc7-besttag">' + T('scene7.argmax') + '</span>' : '') +
          '</td></tr>';
      }).join('');

      root.querySelector('#sc7-read').innerHTML = T(item.readKey);
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === TOUR.length - 1;
      prevBtn.classList.toggle('primary', i > 0 && false);
      nextBtn.classList.toggle('primary', i < TOUR.length - 1);
    }
    prevBtn.addEventListener('click', () => { if (cur > 0) render(cur - 1); });
    nextBtn.addEventListener('click', () => { if (cur < TOUR.length - 1) render(cur + 1); });

    render(0);

    if (window.BTD && window.BTD.run) setTimeout(() => render(1), 500);

    return {
      onEnter() { render(cur); },
      onNextKey() { if (cur < TOUR.length - 1) { render(cur + 1); return true; } return false; },
      onPrevKey() { if (cur > 0) { render(cur - 1); return true; } return false; },
    };
  };
})();

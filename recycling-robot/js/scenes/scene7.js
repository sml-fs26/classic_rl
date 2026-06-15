/* Scene 7 -- Optimal action-value Q*(s,a).
 *   Q*(s,a) = the true long-run value of pulling lever a at battery s, assuming
 *   you operate smart afterward. The robot-and-gauge icon for one rung beside a
 *   two-column table (lever | Q*), the best row starred. Flip the rung selector
 *   and watch the star MOVE: SEARCH at high/full, RECHARGE at mid/low. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;
  const ORDER = ['full', 'high', 'mid', 'low'];

  window.scenes.scene7 = function (root) {
    root.className = 'scene scene-pad sc7 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene7.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene7.lede') + '</p>' +
      '<div class="formula-card sc7-formula"><div class="formula-label">' + T('scene7.flabel') + '</div><div class="sc7-tex"></div></div>' +
      '<div class="sc7-tabs"></div>' +
      '<div class="sc7-grid">' +
        '<div class="sc7-icon-host"></div>' +
        '<div class="sc7-table-wrap"><table class="sc7-table"><thead><tr><th>' + T('scene7.col.a') + '</th><th>Q*(s, a)</th></tr></thead><tbody class="sc7-tbody"></tbody></table>' +
          '<div class="poke-box sc7-say"></div>' +
        '</div>' +
      '</div>' +
      '<p class="footnote">' + T('scene7.hint') + '</p>';

    window.Katex.render(window.DATA.tex.qstar, root.querySelector('.sc7-tex'), true);
    const gauge = window.Gauge.mount(root.querySelector('.sc7-icon-host'), { variant: 'icon', level: R.HIGH });
    const tbody = root.querySelector('.sc7-tbody');
    const say = root.querySelector('.sc7-say');

    const tabs = root.querySelector('.sc7-tabs');
    ORDER.forEach(name => {
      const b = document.createElement('button');
      b.className = 'rr-btn sc7-tab'; b.dataset.name = name; b.type = 'button';
      b.textContent = T('level.' + name);
      b.addEventListener('click', () => select(name));
      tabs.appendChild(b);
    });

    function select(name) {
      const spot = window.DATA.spotQ[name];
      const lv = spot.level;
      gauge.setLevel(lv); gauge.pulse();
      root.querySelectorAll('.sc7-tab').forEach(t => t.classList.toggle('primary', t.dataset.name === name));
      tbody.innerHTML = '';
      for (const id of window.Levers.LEVER_IDS) {
        const v = spot.q[id];
        const isBest = id === spot.best;
        const tr = document.createElement('tr');
        tr.className = 'lever-row lever-' + id + (isBest ? ' best' : '') + (v < 0 ? ' neg' : '');
        tr.innerHTML =
          '<td class="sc7-a"><span class="rr-swatch lever-fill-' + id + '"></span>' + T('lever.' + id) + (isBest ? ' <span class="sc7-star">★</span>' : '') + '</td>' +
          '<td class="sc7-q tnum">' + v.toFixed(2) + '</td>';
        tbody.appendChild(tr);
      }
      say.innerHTML = T('scene7.say.' + name);
    }

    select('high');
    if (window.RR && window.RR.run) {
      let i = 0; const seq = ['full', 'mid', 'low', 'high'];
      const tick = () => { if (i < seq.length) { select(seq[i++]); setTimeout(tick, 700); } };
      setTimeout(tick, 400);
    }

    return {
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

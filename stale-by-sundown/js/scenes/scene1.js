/* Scene 1 -- Tutorial: how to play. A guided panel walks the controls with no
   theory: the SHELF (units x freshness), the three LEVERS (HOLD/DISCOUNT/DUMP
   with colour + margin), the CUSTOMER-BUY METER, and the CLOCK that ages the
   batch each hour. One scripted hour plays: HOLD a FRESH tray, a customer buys,
   cha-ching +5. Vocabulary only. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const B = window.Bakery;

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene1.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene1.lede') + '</p>' +
      '<div class="sc1-grid">' +
        '<div class="sc1-col">' +
          '<div class="sc1-panel-title">' + T('scene1.shelfTitle') + '</div>' +
          '<div class="shelf-icon" id="sc1-shelf"></div>' +
          '<p class="sc1-cap">' + T('scene1.shelfCap') + '</p>' +
        '</div>' +
        '<div class="sc1-col">' +
          '<div class="sc1-panel-title">' + T('scene1.leverTitle') + '</div>' +
          '<div class="sc1-levers" id="sc1-levers"></div>' +
          '<p class="sc1-cap">' + T('scene1.leverCap') + '</p>' +
        '</div>' +
        '<div class="sc1-col">' +
          '<div class="sc1-panel-title">' + T('scene1.meterTitle') + '</div>' +
          '<div id="sc1-meter"></div>' +
          '<p class="sc1-cap">' + T('scene1.meterCap') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box dlg-box sc1-dlg" id="sc1-dlg"></div>' +
      '<div class="gr-btn-row sc1-ctrls">' +
        '<button class="poke-btn primary sc1-play" type="button">' + T('scene1.playHour') + '</button>' +
        '<span class="sc1-till muted">' + T('scene1.till') + ' <b class="tnum" id="sc1-till">0</b></span>' +
      '</div>' +
      '<div class="poke-box sc1-framing">' + T('scene1.framing') + '</div>';

    /* the example shelf: 2x FRESH */
    function renderShelf(host, u, tier) {
      let tray = '';
      for (let k = 0; k < u; k++) tray += window.Croissant.svg(tier, { px: 5 });
      host.innerHTML =
        '<div class="shelf-tray">' + tray + '</div>' +
        '<div class="shelf-label">' + u + '&times; ' + T('tier.' + tier) + '</div>' +
        '<div class="shelf-sub">' + T('scene1.shelfSub') + '</div>';
    }
    const shelfHost = root.querySelector('#sc1-shelf');
    renderShelf(shelfHost, 2, 'FRESH');

    /* the three lever cards */
    const LEVS = [
      { id: 'HOLD', cls: 'lev-hold' },
      { id: 'DISCOUNT', cls: 'lev-discount' },
      { id: 'DUMP', cls: 'lev-dump' },
    ];
    root.querySelector('#sc1-levers').innerHTML = LEVS.map(l =>
      '<div class="sc1-lever ' + l.cls + '">' +
        '<div class="sc1-lever-name">' + T('lever.' + l.id) + '</div>' +
        '<div class="sc1-lever-role">' + T('lever.' + l.id + '.role') + '</div>' +
        '<div class="sc1-lever-margin">' + T('lever.' + l.id + '.margin') + '</div>' +
      '</div>').join('');

    const meter = window.BuyMeter.mount(root.querySelector('#sc1-meter'));
    meter.setProb(B.buyProb('HOLD', 'FRESH'), Math.round(B.buyProb('HOLD', 'FRESH') * 100) + '%');

    const dlg = window.Dialog.mount(root.querySelector('#sc1-dlg'));
    dlg.say(T('scene1.dlg.intro'), { instant: true });

    let played = false;
    function playHour() {
      if (played) return; played = true;
      const btn = root.querySelector('.sc1-play'); if (btn) btn.disabled = true;
      dlg.say(T('scene1.dlg.hold'), { instant: true });
      meter.setProb(B.buyProb('HOLD', 'FRESH'), Math.round(B.buyProb('HOLD', 'FRESH') * 100) + '%');
      meter.resolve(true).then(() => {
        root.querySelector('#sc1-till').textContent = '+5';
        renderShelf(shelfHost, 1, 'FRESH');
        dlg.say(T('scene1.dlg.sold'), { instant: true });
        if (btn) { btn.disabled = false; btn.textContent = T('scene1.replay'); }
        played = false;
      });
    }
    root.querySelector('.sc1-play').addEventListener('click', () => {
      root.querySelector('#sc1-till').textContent = '0';
      renderShelf(shelfHost, 2, 'FRESH');
      playHour();
    });

    if (window.SBS && window.SBS.run) setTimeout(playHour, 200);

    return {
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

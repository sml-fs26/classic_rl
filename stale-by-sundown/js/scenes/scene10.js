/* Scene 10, Why DP does not scale. Two-reason card, each with a bakery face.
   (a) You rarely know the dice: the posted buy-meter was a gift; real demand
   shifts with weather, a competitor, a TikTok. (b) The board explodes: add real
   stock (0..40), 24 hourly ticks, three product lines, a weekend flag, a weather
   state, and the 15-cell case becomes millions of cells no one can sweep or
   store. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene10 = function (root) {
    root.className = 'scene scene-pad sc10';
    /* the state-space blow-up: factors that multiply out */
    const FACTORS = [
      { lab: T('scene10.f.stock'), n: 41 },
      { lab: T('scene10.f.fresh'), n: 5 },
      { lab: T('scene10.f.hours'), n: 24 },
      { lab: T('scene10.f.lines'), n: 3 },
      { lab: T('scene10.f.weekend'), n: 2 },
      { lab: T('scene10.f.weather'), n: 4 },
    ];
    const total = FACTORS.reduce((a, f) => a * f.n, 1);
    const totalStr = total.toLocaleString('en-US');

    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene10.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene10.lede') + '</p>' +
      '<div class="sc10-cards">' +
        '<div class="poke-box sc10-card sc10-a">' +
          '<div class="sc10-card-num">1</div>' +
          '<div class="sc10-card-title">' + T('scene10.aTitle') + '</div>' +
          '<div class="sc10-card-body">' + T('scene10.aBody') + '</div>' +
          '<div class="sc10-meters">' +
            '<div class="sc10-mtr"><span class="sc10-mtr-lab">' + T('scene10.sunny') + '</span><span class="sc10-mtr-bar"><span style="width:62%"></span></span></div>' +
            '<div class="sc10-mtr"><span class="sc10-mtr-lab">' + T('scene10.rain') + '</span><span class="sc10-mtr-bar"><span style="width:24%"></span></span></div>' +
            '<div class="sc10-mtr"><span class="sc10-mtr-lab">' + T('scene10.tiktok') + '</span><span class="sc10-mtr-bar"><span style="width:88%"></span></span></div>' +
          '</div>' +
          '<div class="sc10-card-foot">' + T('scene10.aFoot') + '</div>' +
        '</div>' +
        '<div class="poke-box sc10-card sc10-b">' +
          '<div class="sc10-card-num">2</div>' +
          '<div class="sc10-card-title">' + T('scene10.bTitle') + '</div>' +
          '<div class="sc10-card-body">' + T('scene10.bBody') + '</div>' +
          '<div class="sc10-factors" id="sc10-factors"></div>' +
          '<div class="sc10-total">' + T('scene10.total') + ' <b class="sc10-total-num">' + totalStr + '</b> ' + T('scene10.cells') + '</div>' +
          '<div class="sc10-card-foot">' + T('scene10.bFoot') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc10-framing">' + T('scene10.framing') + '</div>';

    root.querySelector('#sc10-factors').innerHTML =
      FACTORS.map(f => '<span class="sc10-factor"><span class="sc10-factor-n">' + f.n + '</span><span class="sc10-factor-lab">' + f.lab + '</span></span>').join('<span class="sc10-times">&times;</span>');

    return { onEnter() {} };
  };
})();

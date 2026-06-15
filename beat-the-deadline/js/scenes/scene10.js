/* Scene 10, Why DP does not scale. A two-reason card:
   (a) you rarely know the dice, the real arrival rate and carrier no-show
       odds drift by season, lane, weather, and DP needs them exactly;
   (b) the grid explodes, add SKUs, trucks, destinations, a week-long horizon
       and 25 tiles become millions, too many to enumerate or fill by hand.
   The second card shows the jump from a 5x5 = 25-tile grid (this dock) to a
   wall of cells (realistic scale). Static, cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene10 = function (root) {
    root.className = 'scene scene-pad sc10';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene10.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene10.lede') + '</p>' +
      '<div class="sc10-cards">' +
        '<div class="card sc10-card">' +
          '<div class="sc10-tag">A</div>' +
          '<h3 class="sc10-h">' + T('scene10.r1title') + '</h3>' +
          '<div class="sc10-glyph sc10-glyph-dice">' +
            '<span class="sc10-die sc10-die-green">?</span>' +
            '<span class="sc10-die sc10-die-red">?</span>' +
          '</div>' +
          '<p class="sc10-body">' + T('scene10.r1body') + '</p>' +
        '</div>' +
        '<div class="card sc10-card">' +
          '<div class="sc10-tag">B</div>' +
          '<h3 class="sc10-h">' + T('scene10.r2title') + '</h3>' +
          '<div class="sc10-glyph sc10-glyph-scale">' +
            '<div class="sc10-scale-col">' +
              '<div class="sc10-mini-grid sc10-grid-small" id="sc10-small"></div>' +
              '<div class="sc10-scale-cap"><b>25</b> ' + T('scene10.statesWord') + '<br><span class="muted">' + T('scene10.demoLabel') + '</span></div>' +
            '</div>' +
            '<div class="sc10-arrow">&rarr;</div>' +
            '<div class="sc10-scale-col">' +
              '<div class="sc10-mini-grid sc10-grid-big" id="sc10-big"></div>' +
              '<div class="sc10-scale-cap"><b>10<sup>6</sup>+</b> ' + T('scene10.statesWord') + '<br><span class="muted">' + T('scene10.demoLabel2') + '</span></div>' +
            '</div>' +
          '</div>' +
          '<p class="sc10-body">' + T('scene10.r2body') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc10-framing">' + T('scene10.framing') + '</div>';

    /* the small 5x5 (this dock) and the dense "wall" of cells */
    const small = root.querySelector('#sc10-small');
    if (small) { let s = ''; for (let i = 0; i < 25; i++) s += '<span class="sc10-cell on"></span>'; small.innerHTML = s; }
    const big = root.querySelector('#sc10-big');
    if (big) { let s = ''; for (let i = 0; i < 24 * 14; i++) s += '<span class="sc10-cell"></span>'; big.innerHTML = s; }

    return { onEnter() {} };
  };
})();

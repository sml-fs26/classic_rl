/* Scene 10 -- Why DP does not scale. Two blunt reason cards: (a) you rarely
   know the failure odds P; (b) real plants explode far past a 3x3 grid (dozens
   of machines, part types, lead times, shared spares). Static, cold-entry safe. */
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
          '<div class="sc10-tag">' + T('scene10.a.tag') + '</div>' +
          '<h3 class="sc10-h">' + T('scene10.a.title') + '</h3>' +
          '<div class="sc10-glyph sc10-glyph-die"><span class="sc10-die-q">?</span></div>' +
          '<p class="sc10-body">' + T('scene10.a.body') + '</p>' +
        '</div>' +
        '<div class="card sc10-card">' +
          '<div class="sc10-tag">' + T('scene10.b.tag') + '</div>' +
          '<h3 class="sc10-h">' + T('scene10.b.title') + '</h3>' +
          '<div class="sc10-glyph sc10-glyph-grid" id="sc10-grid"></div>' +
          '<p class="sc10-body">' + T('scene10.b.body') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc10-framing">' + T('scene10.framing') + '</div>' +
      '<p class="sc10-bridge muted">' + T('scene10.bridge') + '</p>';

    /* explosion glyph: a small 3x3 vs a wall of cells. */
    const grid = root.querySelector('#sc10-grid');
    let cells = '';
    for (let i = 0; i < 12 * 10; i++) cells += '<span class="sc10-cell"></span>';
    grid.innerHTML = cells;

    return { onEnter() {} };
  };
})();

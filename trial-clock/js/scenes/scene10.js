/* Scene 10 -- Why DP does not scale. A two-reason card: (a) you rarely KNOW the
   response curves (the wheel's true wedges differ by segment / channel / season
   and drift); (b) real state spaces explode far beyond 25 cells once you add
   plan type, company size, referral source, weekday, ... Static, cold-entry safe. */
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
          '<div class="sc10-glyph sc10-glyph-wheel" id="sc10-wheel-host"></div>' +
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

    /* (a) a wheel with a big "?" over its wedges -- the odds you do not know. */
    const wheelHost = root.querySelector('#sc10-wheel-host');
    const wheel = window.Wheel.mount(wheelHost, { tier: 1, compact: true });
    wheel.set(null);
    const q = document.createElement('span');
    q.className = 'sc10-wheel-q';
    q.textContent = '?';
    wheelHost.appendChild(q);

    /* (b) explosion glyph: a tiny 5x5 board vs a wall of cells. */
    const grid = root.querySelector('#sc10-grid');
    let cells = '';
    for (let i = 0; i < 12 * 9; i++) cells += '<span class="sc10-cell"></span>';
    grid.innerHTML = cells;

    return { onEnter() {} };
  };
})();

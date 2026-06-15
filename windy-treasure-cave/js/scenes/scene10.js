/* Scene 10, Why DP does not scale.
 *   Two killers, each pinned to a stat card. (1) You rarely KNOW P: the sweep
 *   only worked because we wrote the wind table; a real cave never hands you the
 *   gust odds, you only sample. (2) The state space explodes: this cave is 25
 *   tiles; a 100x100 cave with fog, items and a moving hazard is astronomically
 *   larger. A little counter animates the blow-up. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;

  window.scenes.scene10 = function (root) {
    root.className = 'scene scene-pad sc10';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene10.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene10.lede') + '</p>' +
      '<div class="sc10-cards">' +
        '<div class="card sc10-card sc10-card1">' +
          '<div class="sc10-card-num">1</div>' +
          '<div class="sc10-card-title">' + T('scene10.c1.title') + '</div>' +
          '<div class="sc10-card-body">' + T('scene10.c1.body') + '</div>' +
          '<div class="sc10-die-host"></div>' +
        '</div>' +
        '<div class="card sc10-card sc10-card2">' +
          '<div class="sc10-card-num">2</div>' +
          '<div class="sc10-card-title">' + T('scene10.c2.title') + '</div>' +
          '<div class="sc10-card-body">' + T('scene10.c2.body') + '</div>' +
          '<div class="sc10-scale">' +
            '<div class="sc10-scale-row"><span class="sc10-scale-lab">' + T('scene10.scale.this') + '</span><span class="sc10-scale-val tnum">25</span></div>' +
            '<div class="sc10-scale-row"><span class="sc10-scale-lab">' + T('scene10.scale.big') + '</span><span class="sc10-scale-val tnum" id="sc10-big">--</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc10-framing">' + T('scene10.framing') + '</div>';

    const die = window.WindDie.mount(root.querySelector('.sc10-die-host'), { badge: '? / ? / ?' });
    die.set(null, 'idle');
    /* the wind die with a "?" badge: in the real world you do not get the odds */
    const badge = root.querySelector('.sc10-die-host .wd-badge'); if (badge) badge.textContent = '? / ? / ?';
    const res = root.querySelector('.sc10-die-host .wd-result'); if (res) res.textContent = T('scene10.unknown');

    /* animate the blow-up counter to a big number */
    const bigEl = root.querySelector('#sc10-big');
    const target = 100 * 100 * 8 * 64;  // 100x100 grid x fog/items x a moving hazard ~ illustrative
    function animateCount() {
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced || (window.WTC && window.WTC.run)) { bigEl.textContent = target.toLocaleString('en-US') + '+'; return; }
      let v = 25, t0 = performance.now();
      function tick(now) {
        const k = Math.min(1, (now - t0) / 1200);
        v = Math.round(25 * Math.pow(target / 25, k));
        bigEl.textContent = v.toLocaleString('en-US') + (k >= 1 ? '+' : '');
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    animateCount();

    if (window.WTC && window.WTC.run) bigEl.textContent = target.toLocaleString('en-US') + '+';

    return { onEnter() { animateCount(); } };
  };
})();

/* Scene 10, Why DP does not scale.
 *   Two reasons on a two-panel card. (a) You rarely know P: the neat printed
 *   drain probabilities are a fiction; real wear depends on terrain, load,
 *   temperature, battery age. (b) The state space explodes: this toy has 5
 *   rungs; a real fleet has every robot's charge x location x trash map x
 *   maintenance x the other robots. DP is the ideal, not the method. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene10 = function (root) {
    root.className = 'scene scene-pad sc10';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene10.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene10.lede') + '</p>' +
      '<div class="sc10-panels">' +
        '<div class="sc10-panel card">' +
          '<div class="sc10-tag">A</div>' +
          '<div class="sc10-h">' + T('scene10.a.h') + '</div>' +
          '<div class="sc10-die-host"></div>' +
          '<div class="sc10-b">' + T('scene10.a.b') + '</div>' +
        '</div>' +
        '<div class="sc10-panel card">' +
          '<div class="sc10-tag">B</div>' +
          '<div class="sc10-h">' + T('scene10.b.h') + '</div>' +
          '<div class="sc10-explode"></div>' +
          '<div class="sc10-b">' + T('scene10.b.b') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="concept-key-question sc10-q">' + T('scene10.q') + '</div>';

    /* (a) a drain die with a big "?" overlay instead of a printed face */
    const dieHost = root.querySelector('.sc10-die-host');
    dieHost.innerHTML = '<div class="rr-die"><div class="rr-die-cube sc10-die-q"><span class="rr-die-delta">?</span></div><div class="rr-die-badge">?? / ??</div></div>';

    /* (b) a grid of robot dots that multiplies -> "billions" */
    const exp = root.querySelector('.sc10-explode');
    let dots = '';
    for (let i = 0; i < 60; i++) dots += '<span class="sc10-dot"></span>';
    exp.innerHTML = '<div class="sc10-dotgrid">' + dots + '</div><div class="sc10-explode-cap">5 rungs &rarr; billions</div>';

    return { onNextKey() { return false; }, onPrevKey() { return false; } };
  };
})();

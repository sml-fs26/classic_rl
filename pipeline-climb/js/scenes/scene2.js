/* Scene 2 STUB for Pipeline Climb.
 *
 * Foundation placeholder: renders the scene title + a one-line blurb so
 * the shell (topbar / pager / hash routing / theme / i18n) is verifiably
 * live. The real scene 2 content lands in a later pass. Registers
 * window.scenes.scene2 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene2 = function (root) {
    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    root.classList.add('scene-pad', 'scene2-scene');
    root.innerHTML =
      '<div class="scene-stub">' +
        '<div class="scene-stub-num">SCENE 2</div>' +
        '<h2 class="scene-stub-title">' + T('scene.title2') + '</h2>' +
        '<p class="scene-stub-blurb">' + T('scene2.blurb') + '</p>' +
        '</div>';

    return {};
  };
})();

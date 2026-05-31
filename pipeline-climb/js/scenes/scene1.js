/* Scene 1 STUB for Pipeline Climb.
 *
 * Foundation placeholder: renders the scene title + a one-line blurb so
 * the shell (topbar / pager / hash routing / theme / i18n) is verifiably
 * live. The real scene 1 content lands in a later pass. Registers
 * window.scenes.scene1 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene1 = function (root) {
    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    root.classList.add('scene-pad', 'scene1-scene');
    root.innerHTML =
      '<div class="scene-stub">' +
        '<div class="scene-stub-num">SCENE 1</div>' +
        '<h2 class="scene-stub-title">' + T('scene.title1') + '</h2>' +
        '<p class="scene-stub-blurb">' + T('scene1.blurb') + '</p>' +
        '</div>';

    return {};
  };
})();

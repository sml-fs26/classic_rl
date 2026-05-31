/* Scene 0 STUB for Pipeline Climb.
 *
 * Foundation placeholder: renders the scene title + a one-line blurb so
 * the shell (topbar / pager / hash routing / theme / i18n) is verifiably
 * live. The real scene 0 content lands in a later pass. Registers
 * window.scenes.scene0 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene0 = function (root) {
    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    root.classList.add('scene-pad', 'scene0-scene');
    root.innerHTML =
      '<div class="scene-stub">' +
        '<div class="scene-stub-num">SCENE 0</div>' +
        '<h2 class="scene-stub-title">' + T('scene.title0') + '</h2>' +
        '<p class="scene-stub-blurb">' + T('scene0.blurb') + '</p>' +
        '<button class="poke-btn scene-stub-start" type="button" data-run-primary>' + T('scene0.start') + '</button>' +
        '</div>';

    const startBtn = root.querySelector('.scene-stub-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (window.PipeViz) window.PipeViz.goTo(window.PipeViz.getCurrentScene() + 1);
      });
    }

    return {};
  };
})();

/* scene9 -- STUB. Foundation placeholder so the shell boots end-to-end.
   Downstream agents replace this with the real scene. Contract:
     window.scenes.scene9 = function(root){ ...; return { onEnter?, onLeave?, onNextKey?, onPrevKey? }; } */
(function () {
  if (!window.scenes) window.scenes = {};
  window.scenes.scene9 = function (root) {
    const T = (k, v) => window.I18N.t(k, v);
    root.className = 'scene-pad';
    root.innerHTML =
      '<div class="stub-card">' +
        '<div class="stub-num">SCENE 9</div>' +
        '<h2 class="stub-title">' + T('scene9.title') + '</h2>' +
        '<p class="stub-note">' + T('scene9.stub') + '</p>' +
      '</div>';
    return {};
  };
})();

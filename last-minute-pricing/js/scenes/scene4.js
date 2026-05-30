/* scene4 -- STUB. Foundation placeholder so the shell boots end-to-end.
   Downstream agents replace this with the real scene. Contract:
     window.scenes.scene4 = function(root){ ...; return { onEnter?, onLeave?, onNextKey?, onPrevKey? }; } */
(function () {
  if (!window.scenes) window.scenes = {};
  window.scenes.scene4 = function (root) {
    const T = (k, v) => window.I18N.t(k, v);
    root.className = 'scene-pad';
    root.innerHTML =
      '<div class="stub-card">' +
        '<div class="stub-num">SCENE 4</div>' +
        '<h2 class="stub-title">' + T('scene4.title') + '</h2>' +
        '<p class="stub-note">' + T('scene4.stub') + '</p>' +
      '</div>';
    return {};
  };
})();

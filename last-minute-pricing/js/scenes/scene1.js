/* scene1 -- STUB. Foundation placeholder so the shell boots end-to-end.
   Downstream agents replace this with the real scene. Contract:
     window.scenes.scene1 = function(root){ ...; return { onEnter?, onLeave?, onNextKey?, onPrevKey? }; } */
(function () {
  if (!window.scenes) window.scenes = {};
  window.scenes.scene1 = function (root) {
    const T = (k, v) => window.I18N.t(k, v);
    root.className = 'scene-pad';
    root.innerHTML =
      '<div class="stub-card">' +
        '<div class="stub-num">SCENE 1</div>' +
        '<h2 class="stub-title">' + T('scene1.title') + '</h2>' +
        '<p class="stub-note">' + T('scene1.stub') + '</p>' +
      '</div>';
    return {};
  };
})();

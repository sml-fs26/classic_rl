/* Scene 8 - STUB. Replaced by the real scene build.
 * window.scenes.scene8(root) -> { onEnter?, onLeave?, onNextKey?, onPrevKey? } */
(function () {
  window.scenes = window.scenes || {};
  window.scenes.scene8 = function (root) {
    root.className = "scene-pad";
    var T = window.I18N ? window.I18N.t.bind(window.I18N) : function (k) { return k; };
    root.innerHTML = "<h2>" + T("scene8.title") + "</h2>";
    return {};
  };
})();

/* Scene 7 - STUB. Replaced by the real scene build.
 * window.scenes.scene7(root) -> { onEnter?, onLeave?, onNextKey?, onPrevKey? } */
(function () {
  window.scenes = window.scenes || {};
  window.scenes.scene7 = function (root) {
    root.className = "scene-pad";
    var T = window.I18N ? window.I18N.t.bind(window.I18N) : function (k) { return k; };
    root.innerHTML = "<h2>" + T("scene7.title") + "</h2>";
    return {};
  };
})();

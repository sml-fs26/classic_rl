/* i18n fragment for Scene 0 (Pipeline Climb). Registers this scene's
 * strings into the shared store. English is authoritative; add jp keys
 * as the scene is built out. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene0.blurb': 'Title and hook. A lead rests on the bottom rung; press START to climb.',
      'scene0.start': 'PRESS START',
    },
    jp: {
      'scene0.start': 'スタート',
    },
  });
})();

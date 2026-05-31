/* i18n fragment for Scene 3 (Pipeline Climb). Registers this scene's
 * strings into the shared store. English is authoritative; add jp keys
 * as the scene is built out. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene3.blurb': 'Formalization: state, action, transition, reward. Your CRM was an MDP.',
    },
    jp: {
    },
  });
})();

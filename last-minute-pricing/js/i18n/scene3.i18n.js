/* scene3 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene3.title': "What makes this an MDP?",
      'scene3.stub':  'Foundation stub. The real scene 3 is built by a downstream agent.',
    },
    jp: {
      'scene3.title': "これが MDPなのは なぜ？",
      'scene3.stub':  'どだいの スタブ。 ほんとうの シーン 3 は あとで つくられます。',
    },
  });
})();

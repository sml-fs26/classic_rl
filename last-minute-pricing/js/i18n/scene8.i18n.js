/* scene8 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene8.title': "Bellman: today vs tomorrow",
      'scene8.stub':  'Foundation stub. The real scene 8 is built by a downstream agent.',
    },
    jp: {
      'scene8.title': "ベルマン：きょう と あした",
      'scene8.stub':  'どだいの スタブ。 ほんとうの シーン 8 は あとで つくられます。',
    },
  });
})();

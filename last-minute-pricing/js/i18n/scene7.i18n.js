/* scene7 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene7.title': "The value of a lever, Q*",
      'scene7.stub':  'Foundation stub. The real scene 7 is built by a downstream agent.',
    },
    jp: {
      'scene7.title': "レバーの かち Q*",
      'scene7.stub':  'どだいの スタブ。 ほんとうの シーン 7 は あとで つくられます。',
    },
  });
})();

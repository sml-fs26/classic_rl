/* scene1 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene1.title': "How to read the shelf",
      'scene1.stub':  'Foundation stub. The real scene 1 is built by a downstream agent.',
    },
    jp: {
      'scene1.title': "たなの よみかた",
      'scene1.stub':  'どだいの スタブ。 ほんとうの シーン 1 は あとで つくられます。',
    },
  });
})();

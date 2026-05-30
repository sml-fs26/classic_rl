/* scene2 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene2.title': "You run the shelf",
      'scene2.stub':  'Foundation stub. The real scene 2 is built by a downstream agent.',
    },
    jp: {
      'scene2.title': "あなたが たなを うごかす",
      'scene2.stub':  'どだいの スタブ。 ほんとうの シーン 2 は あとで つくられます。',
    },
  });
})();

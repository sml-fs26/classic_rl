/* scene0 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene0.title': "Last-Minute Pricing",
      'scene0.stub':  'Foundation stub. The real scene 0 is built by a downstream agent.',
    },
    jp: {
      'scene0.title': "ぎりぎり プライシング",
      'scene0.stub':  'どだいの スタブ。 ほんとうの シーン 0 は あとで つくられます。',
    },
  });
})();

/* scene9 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene9.title': "Fill Q* by dynamic programming",
      'scene9.stub':  'Foundation stub. The real scene 9 is built by a downstream agent.',
    },
    jp: {
      'scene9.title': "DPで Q*を うめる",
      'scene9.stub':  'どだいの スタブ。 ほんとうの シーン 9 は あとで つくられます。',
    },
  });
})();

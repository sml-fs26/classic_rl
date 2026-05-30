/* scene4 i18n fragment. Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene4.title': "A policy is a playbook",
      'scene4.stub':  'Foundation stub. The real scene 4 is built by a downstream agent.',
    },
    jp: {
      'scene4.title': "ほうさくは プレイブック",
      'scene4.stub':  'どだいの スタブ。 ほんとうの シーン 4 は あとで つくられます。',
    },
  });
})();

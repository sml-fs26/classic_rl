/* i18n fragment for Scene 0 (Pipeline Climb), the Title / hook.
 *
 * Registers this scene's strings into the shared store. English is
 * authoritative; jp falls back to en, en falls back to the literal key.
 * The PIPELINE CLIMB wordmark itself reuses the shared 'scene.title0'
 * key from the i18n core (so the topbar and title agree). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene0.subtitle': 'A REINFORCEMENT LEARNING DEAL',
      'scene0.tagline':
        'Cold to signed in five rungs. Push too hard, too early, and you watch it slide back down.',
      'scene0.start': 'PRESS START',
      'scene0.lead_label': 'YOUR LEAD',
      'scene0.credits': 'SML · ETH ZURICH · CLASSIC RL',
      'scene0.by': 'BY CARLOS COTRINI',
    },
    jp: {
      'scene0.subtitle': '強化学習の商談',
      'scene0.tagline':
        '5つのステージでコールドからサインへ。 早すぎる強い押しは、 リードを下にすべらせる。',
      'scene0.start': 'スタート',
      'scene0.lead_label': 'あなたのリード',
      'scene0.credits': 'SML · ETH ZURICH · CLASSIC RL',
      'scene0.by': 'BY CARLOS COTRINI',
    },
  });
})();

/* scene0 i18n fragment -- Title / hook.
   Registers this scene's strings into the i18n core.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene0.title': 'Last-Minute Pricing',
      'scene0.subtitle': 'A REINFORCEMENT LEARNING ADVENTURE',
      'scene0.tagline': 'Empty seats expire worthless at midnight.',
      'scene0.clockLabel': 'TIME TO DEADLINE',
      'scene0.midnight': 'MIDNIGHT',
      'scene0.shelfLabel': 'TONIGHT’S SHELF',
      'scene0.start': 'PRESS START',
      'scene0.hook': 'You sell something that rots: a seat, a room, a slot. Pricing it is a decision made over time, under uncertainty, not a single number.',
      'scene0.boardLabel': 'EVERY SITUATION YOU COULD BE IN',
      'scene0.boardSub': 'units left × days to deadline. One screen, twenty situations.',
      'scene0.boardGo': 'BEGIN',
      'scene0.credits': 'SML · ETH ZURICH · CLASSIC RL',
      'scene0.by': 'REVENUE MANAGEMENT, THE RL WAY',
      'scene0.daysAxis': 'DAYS TO DEADLINE',
      'scene0.unitsAxis': 'UNITS LEFT',
    },
    jp: {
      'scene0.title': 'ぎりぎり プライシング',
      'scene0.subtitle': '強化学習の ぼうけん',
      'scene0.tagline': '空席は 真夜中に 価値ゼロに なる。',
      'scene0.clockLabel': 'しめきりまで',
      'scene0.midnight': 'まよなか',
      'scene0.shelfLabel': '今夜の たな',
      'scene0.start': 'スタート',
      'scene0.hook': 'くさる ものを うります（座席、部屋、枠）。 価格づけは ひとつの 数字ではなく、不確かさのなかで 時間をかけて きめる もの。',
      'scene0.boardLabel': 'ありうる すべての じょうきょう',
      'scene0.boardSub': 'のこり × しめきりまで。 ひと画面、にじゅうの じょうきょう。',
      'scene0.boardGo': 'はじめる',
      'scene0.credits': 'SML · ETH ZURICH · CLASSIC RL',
      'scene0.by': 'レベニューマネジメントを RLで',
      'scene0.daysAxis': 'しめきりまで',
      'scene0.unitsAxis': 'のこり',
    },
  });
})();

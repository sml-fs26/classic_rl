/* scene7 i18n -- Q*. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title':       'Optimal action-value Q*',
      'scene7.lede':       'Imagine a perfect scorecard: for every situation, the honest long-run value of each lever, assuming you play smart from then on. The best lever is the star.',
      'scene7.formulaLabel':'the true long-run value of a lever',
      'scene7.pick':        'pick a shelf:',
      'scene7.colLever':    'lever a',
      'scene7.colQ':        'Q*(s, a)',
      'scene7.best':        'best',
      'scene7.at':          'at s = ({u}, {tier})',
      'scene7.read.FRESH':  'Plenty of clock left and a healthy full-price buy chance. No reason to give away margin yet. HOLD the line.',
      'scene7.read.AGING':  'Full-price demand is fading. With 2+ units the safe DISCOUNT sale beats gambling on a slow HOLD as the spoilage cliff approaches.',
      'scene7.read.OLD':    'The full-price buy chance has collapsed. A slow HOLD risks aging into the cliff; the amber lever\'s high buy chance locks the sale in. Bird in hand.',
      'scene7.read.STALE':  'A near-certain spoilage loss. Eating the DUMP write-off to reset to a sellable FRESH unit is the least-bad move. Cut your losses.',
      'scene7.framing':     'Q* scores every lever per situation, and the star MARCHES down the age axis: HOLD while fresh, DISCOUNT once aging, DUMP when stale. Pick the starred lever.',
    },
    jp: {
      'scene7.title':       'さいてき こうどうかち Q*',
      'scene7.lede':       'かんぺきな スコアカードを そうぞう：すべての じょうきょうで、 かく レバーの しょうじきな ちょうきの かち（いこう じょうずに プレイ）。 さいぜんの レバーは ★。',
      'scene7.formulaLabel':'レバーの しんの ちょうきの かち',
      'scene7.pick':        'たなを えらぶ：',
      'scene7.colLever':    'レバー a',
      'scene7.colQ':        'Q*(s, a)',
      'scene7.best':        'さいぜん',
      'scene7.at':          's = ({u}, {tier}) で',
      'scene7.read.FRESH':  'とけいは たっぷり、 ていかの こうばいかくりつも けんぜん。 まだ マージンを わたす りゆうは ない。 キープ。',
      'scene7.read.AGING':  'ていかの じゅようが おとろえる。 2こいじょうなら、 がけが せまる なか おそい キープに かけるより あんぜんな ねびき はんばいが まさる。',
      'scene7.read.OLD':    'ていかの こうばいかくりつが ほうかい。 おそい キープは がけへ。 あんばーの たかい かくりつが はんばいを かくほ。 てちゅうの とり。',
      'scene7.read.STALE':  'ほぼ かくじつな はいきそん。 すてる かきおとしを のんで うれる しんせんに もどすのが いちばん まし。 そんぎり。',
      'scene7.framing':     'Q* は じょうきょうごとに かく レバーを さいてん、 ★が としの じくを すすむ：しんせんなら キープ、 ふるくなれば ねびき、 いたんだら すてる。 ★の レバーを えらぶ。',
    },
  });
})();

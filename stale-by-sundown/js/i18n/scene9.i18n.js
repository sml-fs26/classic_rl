/* scene9 i18n, dynamic programming. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title':       'Dynamic programming',
      'scene9.lede':       'Here we DO know the dice: the buy-meter is posted. So we can compute the scorecard exactly. Sweep the Bellman backup over all 15 cells, repeatedly, to the fixed point.',
      'scene9.formulaLabel':'iterate this to convergence',
      'scene9.step':        'STEP ONE SWEEP',
      'scene9.run':         'RUN ALL',
      'scene9.reset':       'RESET',
      'scene9.sweep':       'sweep',
      'scene9.stable':      'cells locked',
      'scene9.ready.title': 'READY',
      'scene9.ready.body':  'The case starts blank. Press STEP ONE SWEEP. Value spreads from the terminals inward: STALE (the spoilage cliff) locks first, then the amber middle, then the green cap.',
      'scene9.done.title':  'CONVERGED',
      'scene9.done.body':   'Green top, amber middle, red floor: the three-way flip, computed. Age drives the policy. Only AGING wiggles with stock; every other tier ignores it.',
      'scene9.sweepInfo':   'Sweep {n}. {k} of 15 cells have locked in. Watch the colour bands fill from the cliff back up to the fresh cap.',
      'scene9.framing':     'Given a trustworthy model of demand, you can DERIVE the optimal markdown playbook. No guessing, every cell justified by its own Bellman backup.',
    },
    jp: {
      'scene9.title':       'どうてき けいかくほう',
      'scene9.lede':       'ここでは さいころを しっている：こうばいメーターが ひょうじずみ。 だから スコアカードを せいかくに けいさん できる。 ベルマン バックアップを 15マス すべてに くりかえし、 ふどうてんまで。',
      'scene9.formulaLabel':'しゅうそくまで くりかえす',
      'scene9.step':        '1スイープ',
      'scene9.run':         'ぜんぶ じっこう',
      'scene9.reset':       'リセット',
      'scene9.sweep':       'スイープ',
      'scene9.stable':      'マス ロック',
      'scene9.ready.title': 'じゅんび',
      'scene9.ready.body':  'ケースは くうはく。 「1スイープ」を おす。 かちは たんまつから うちへ ひろがる：いたみ（はいきの がけ）が さきに ロック、 つぎに あんばーの まんなか、 そして みどりの キャップ。',
      'scene9.done.title':  'しゅうそく',
      'scene9.done.body':   'うえ みどり、 まんなか あんばー、 ゆか あか：3つの フリップ、 けいさんずみ。 としが ポリシーを きめる。 すこし ふるい だけが こすうで ゆれる。',
      'scene9.sweepInfo':   'スイープ {n}。 15マス ちゅう {k} が ロック。 いろの バンドが がけから しんせんの キャップへ うまるのを みて。',
      'scene9.framing':     'しんらいできる じゅようモデルが あれば、 さいてきの ねさげ プレイブックを みちびける。 すいそくなし、 すべての マスが じぶんの ベルマン バックアップで せつめいされる。',
    },
  });
})();

/* scene9 i18n -- dynamic programming. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title': 'Dynamic programming',
      'scene9.lede':  'Suppose you did have a perfect model of the failure odds and aging. Then you can compute the whole playbook by repeatedly applying the Bellman backup until nothing changes.',
      'scene9.formulaLabel': 'SWEEP THIS BACKUP TO A FIXED POINT',
      'scene9.step':  'STEP (one sweep)',
      'scene9.run':   'RUN ALL',
      'scene9.reset': 'RESET',
      'scene9.sweep': 'sweep',
      'scene9.stable': 'cells settled',
      'scene9.ready.title': 'READY',
      'scene9.ready.body':  'The grid starts blank. STEP applies one Bellman sweep; cells fill in as their value settles. Watch the twist heat-map appear.',
      'scene9.done.title':  'THE TWIST, MADE VISIBLE',
      'scene9.done.body':   'HEALTHY → RUN across the top. AGING & FAILING split by the bin: empty → ORDER (go get protection), stocked → REPLACE (spend it). Same gauge, opposite call. This is the exact optimal playbook.',
      'scene9.sweepInfo': 'Sweep {n}. {k} of 9 cells have settled. Value spreads region by region; the greedy lever locks in well before the values fully settle.',
      'scene9.framing': '<b>With a perfect model, the optimal maintenance policy is computable, exactly. Here it is.</b> A few sweeps, every cell hand-checkable.',
    },
    jp: {
      'scene9.title': 'どうてき けいかくほう',
      'scene9.lede':  'もし こしょう オッズと ろうきゅうの かんぺきな モデルが あったら、 ベルマン バックアップを なにも かわらなくなるまで くりかえして プレイブック ぜんたいを けいさん できる。',
      'scene9.formulaLabel': 'この バックアップを ふどうてんまで スイープ',
      'scene9.step':  'ステップ (1スイープ)',
      'scene9.run':   'ぜんぶ じっこう',
      'scene9.reset': 'リセット',
      'scene9.sweep': 'スイープ',
      'scene9.stable': 'セル かくてい',
      'scene9.ready.title': 'じゅんび かんりょう',
      'scene9.ready.body':  'グリッドは くうはく から はじまる。 ステップで ベルマン スイープを 1かい。 かちが おちつくと セルが うまる。 ツイスト ヒートマップが あらわれるのを みて。',
      'scene9.done.title':  'ツイスト、 かしか',
      'scene9.done.body':   'うえは けんこう → うんてん。 ろうきゅうと こしょうまえは ビンで わかれる： から → はっちゅう (ほごを えに)、 ざいこ → こうかん (つかう)。 おなじ ゲージ、 はんたいの せんたく。 これが せいかくな さいてき プレイブック。',
      'scene9.sweepInfo': 'スイープ {n}。 9セルちゅう {k} が かくてい。 かちは りょういき ごとに ひろがり、 グリーディ レバーは かちが ぜんぶ おちつく まえに かくてい。',
      'scene9.framing': '<b>かんぺきな モデルが あれば、 さいてき ほぜん ポリシーは せいかくに けいさん できる。 これが それ。</b> すうかいの スイープ、 ぜんセル てで かくにん かのう。',
    },
  });
})();

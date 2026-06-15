/* scene10 i18n, why DP does not scale. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene10.title':  'Why DP does not scale',
      'scene10.lede':   'DP is the gold standard, when it applies. Two blunt reasons it usually doesn’t.',
      'scene10.a.tag':  'PROBLEM 1',
      'scene10.a.title':'You rarely know the odds',
      'scene10.a.body': 'We assumed the Adoption Coin is 50/50 and the wheel’s wedges by tier. In reality nobody hands you those response curves, they differ by segment, channel, and season, and they drift over time.',
      'scene10.b.tag':  'PROBLEM 2',
      'scene10.b.title':'Real state spaces explode',
      'scene10.b.body': 'Our board is 25 cells because we kept two coarse axes. Add plan type, company size, referral source, the last three features touched, weekday, and the grid blows past anything you could enumerate or hand-fill.',
      'scene10.framing':'DP is the ideal, not the method. You never get the true response curves, and the real customer space is astronomically larger than any spreadsheet, so "just compute it" is off the table.',
      'scene10.bridge': 'So how do real teams find the playbook? They run experiments. Next: learn it from experience.',
    },
    jp: {
      'scene10.title':  'なぜ DP は スケール しないか',
      'scene10.lede':   'DP は ゴールドスタンダード, てきよう できる ときは。 たいてい できない、 ふたつの あからさまな りゆう。',
      'scene10.a.tag':  'もんだい 1',
      'scene10.a.title':'オッズは めったに わからない',
      'scene10.a.body': 'りようコインを 50/50、 ホイールの ウェッジを レベルべつと かてい した。 げんじつには だれも その はんのうカーブを くれない, セグメント、 チャネル、 きせつで ちがい、 じかんで ドリフト する。',
      'scene10.b.tag':  'もんだい 2',
      'scene10.b.title':'じょうたいくうかんは ばくはつ する',
      'scene10.b.body': 'ボードが 25セルなのは あらい 2じくに したから。 プラン、 きぼ、 しょうかいもと、 さいきん さわった 3きのう、 ようび, を くわえると、 れっきょも てうめも できない りょうを こえる。',
      'scene10.framing':'DP は りそう であって しゅほう では ない。 ほんとうの はんのうカーブは けっして えられず、 げんじつの おきゃく くうかんは どんな スプレッドシートよりも てんもんがくてきに おおきい, だから 「ただ けいさんする」 は えらべない。',
      'scene10.bridge': 'では げんじつの チームは どう プレイブックを みつける？ じっけんを する。 つぎは けいけんから まなぶ。',
    },
  });
})();

/* scene10 i18n, why DP does not scale. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene10.title': 'Why DP does not scale',
      'scene10.lede':  'Dynamic programming is the textbook ideal, and it quietly assumes away the two things that actually make your job hard.',
      'scene10.a.tag': 'PROBLEM 1',
      'scene10.a.title': 'You rarely know P',
      'scene10.a.body': 'Did anyone hand you the exact probability this machine fails next week? No, that\'s the whole problem. DP needs the failure odds and aging dynamics as inputs; in the real plant they are exactly what you don\'t have.',
      'scene10.b.tag': 'PROBLEM 2',
      'scene10.b.title': 'Real state spaces explode',
      'scene10.b.body': 'Our toy has 9 states. A real plant has dozens of machines, multiple part types, lead times, and shared spares, the grid balloons past anything you could enumerate or fill by hand.',
      'scene10.framing': 'So we need a method that learns the playbook <b>from experience</b>, without a model, and without enumerating everything.',
      'scene10.bridge': 'Next: learn Q* by running the machine, the way a seasoned operator does.',
    },
    jp: {
      'scene10.title': 'なぜ DP は スケール しないか',
      'scene10.lede':  'どうてき けいかくほうは きょうかしょの りそう。 そして あなたの しごとを ほんとうに むずかしく する 2つを しれっと むしする。',
      'scene10.a.tag': 'もんだい 1',
      'scene10.a.title': 'P は めったに わからない',
      'scene10.a.body': 'この きかいが らいしゅう こしょうする せいかくな かくりつを だれか くれた？ いいえ。 それが ぜんぶの もんだい。 DP は こしょう オッズと ろうきゅう ダイナミクスを にゅうりょくに ひつようと する。 げんじつの こうじょうでは それこそが ないもの。',
      'scene10.b.tag': 'もんだい 2',
      'scene10.b.title': 'じょうたい くうかんが ばくはつ',
      'scene10.b.body': 'おもちゃは 9じょうたい。 げんじつの こうじょうは きかい すうじゅう、 ふくすうの ぶひん しゅ、 リードタイム、 きょうゆう よびひん。 グリッドは れっきょ・てうめ できる はんいを はるかに こえて ふくらむ。',
      'scene10.framing': 'だから <b>けいけんから</b> プレイブックを まなぶ しゅほうが ひつよう。 モデルなし、 ぜんれっきょ なしで。',
      'scene10.bridge': 'つぎ： ベテラン オペレーターの ように、 きかいを うんてんして Q* を まなぶ。',
    },
  });
})();

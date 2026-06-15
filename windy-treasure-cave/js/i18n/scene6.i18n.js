/* Scene 6 (return) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene6.title': 'RETURN',
      'scene6.lede':  'The <b>return</b> from a step is the sum of every reward to the end: the torch you burn, plus the prize or the fall. From one tile, one heading gives a <em>spread</em> of returns, because the wind differs each run.',
      'scene6.formulaLabel': 'RETURN FROM STEP i',
      'scene6.from':  'From the tile below the pit ({r},{c}):',
      'scene6.rightBtn': 'FIRST STEP: RIGHT (optimal)',
      'scene6.upBtn':    'FIRST STEP: UP (reckless)',
      'scene6.sample': 'SAMPLE 20 RUNS',
      'scene6.clear':  'CLEAR',
      'scene6.runs':   '{n} runs',
      'scene6.expected':   'EXPECTED (Q*)',
      'scene6.sampleMean': 'SAMPLE MEAN',
      'scene6.framing': 'Payoff is the sum over the whole journey, not the next step, and from one decision you get a <em>distribution</em> of payoffs, not a guarantee. RIGHT lands you in the gold cluster far more often; UP piles up in the pit. Manage the spread, not just the average.',
    },
    jp: {
      'scene6.title': 'リターン',
      'scene6.lede':  'ある ステップからの <b>リターン</b>は さいごまでの ほうしゅうの ごうけい： もやす たいまつ ＋ たから か おちる か。 1つの マス、 1つの むき でも リターンは <em>ばらつく</em>、 かぜが まいかい ちがうから。',
      'scene6.formulaLabel': 'ステップ i からの リターン',
      'scene6.from':  'あなの した の マス（{r},{c}）から：',
      'scene6.rightBtn': 'さいしょの いっぽ： みぎ（さいぜん）',
      'scene6.upBtn':    'さいしょの いっぽ： うえ（むぼう）',
      'scene6.sample': '20かい サンプル',
      'scene6.clear':  'クリア',
      'scene6.runs':   '{n} かい',
      'scene6.expected':   'きたいち (Q*)',
      'scene6.sampleMean': 'サンプル へいきん',
      'scene6.framing': 'みかえりは つぎの いっぽ では なく たびの ぜんたいの ごうけい、 そして 1つの けってい から ほしょう ではなく <em>ぶんぷ</em> が でる。 みぎは たから の かたまりに よく とどき、 うえは あなに つもる。 へいきん だけでなく ばらつきを かんりせよ。',
    },
  });
})();

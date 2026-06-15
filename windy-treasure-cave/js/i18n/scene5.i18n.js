/* Scene 5 (trajectory) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene5.title': 'TRAJECTORY',
      'scene5.lede':  'Play one run under the optimal map and record it as a sequence of <em>(state, action, reward)</em> triples. Capital letters: every entry is a <b>random variable</b>. Re-run and the gusts differ.',
      'scene5.formulaLabel': 'A RUN, WRITTEN OUT',
      'scene5.play':  'PLAY THE RUN',
      'scene5.rerun': 'RE-RUN (fresh wind)',
      'scene5.detail.hint': 'Each step appends S, A, R to the ribbon. Click any reward to see the exact wind roll that produced it.',
      'scene5.detail.aim':  'The die showed {face} (1-7), so you went where you aimed.',
      'scene5.detail.gust': 'The die showed {face}, a gust to your {side}.',
      'scene5.detail.aimed': 'You aimed {dir}.',
      'scene5.detail.landed': 'You landed on ({r},{c}).',
      'scene5.framing': 'One trajectory is one run of the plan as it actually unfolded, one history out of the many that could have happened. Re-run the same map and you get a different tape every time, because the wind is not yours to command.',
    },
    jp: {
      'scene5.title': 'きせき',
      'scene5.lede':  'さいぜんの ちず で 1かい あそび、 <em>(じょうたい, こうどう, ほうしゅう)</em> の れつ として きろく。 おおもじ： すべての こうもくは <b>かくりつへんすう</b>。 もういちど やると かぜが ちがう。',
      'scene5.formulaLabel': '1かいの プレイ、 かきだし',
      'scene5.play':  'プレイを みる',
      'scene5.rerun': 'もういちど（あたらしい かぜ）',
      'scene5.detail.hint': 'まいステップ S, A, R を リボンに ついか。 ほうしゅうを クリックすると ダイスの めが みえる。',
      'scene5.detail.aim':  'ダイスは {face}（1-7）、 ねらいどおり すすんだ。',
      'scene5.detail.gust': 'ダイスは {face}、 {side} への とつぷう。',
      'scene5.detail.aimed': '{dir} を ねらった。',
      'scene5.detail.landed': '（{r},{c}）に ついた。',
      'scene5.framing': '1つの きせきは じっさいに おきた 1かいの プレイ、 おきえた おおくの れきしの ひとつ。 おなじ ちずでも まいかい ちがう テープ。 かぜは あなたの めいれい には したがわない。',
    },
  });
})();

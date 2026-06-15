/* scene11 i18n, TD: SARSA vs Q-learning. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene11.title':  'SARSA vs Q-learning',
      'scene11.lede':   'No forecast of the dice? Replace the expectation with one observed dispatch: pull a lever, see the real payoff and the real next tile, nudge that cell toward r + q[s’, a’].',
      'scene11.eps':    'Every so often, deliberately try the lever that does not look best (epsilon), to keep learning.',
      'scene11.train':  'TRAIN BOTH LEARNERS',
      'scene11.scrub':  'episodes:',
      'scene11.qlTitle':'Q-LEARNING (off-policy)',
      'scene11.sarsaTitle':'SARSA (on-policy)',
      'scene11.oracleTitle':'DP ORACLE',
      'scene11.qlConv': 'Q-learning bootstraps on the BEST next lever: it recovers the exact diagonal (matches DP).',
      'scene11.sarsaConv':'SARSA learns the value of the cautious rule it follows: it ships the thin (2,3) order one hour EARLY.',
      'scene11.agree':  'cells matching DP',
      'scene11.retLabel':'mean return from (2,4)',
      'scene11.diffNote':'The only difference is at (2,3): DP and Q-learning WAIT, SARSA SENDs (more conservative). A stray exploratory WAIT can strand the load, so on-policy SARSA banks the safe ship.',
      'scene11.framing':'No perfect forecast needed. Run many small experiments: try, observe, adjust, and the playbook converges. Off-policy reaches the exact optimum; on-policy stays a touch cautious. Both are honest answers.',
    },
    jp: {
      'scene11.title':  'SARSA たい Q-ラーニング',
      'scene11.lede':   'ダイスのよそくなし？ きたいちを 1つのじっさいのしゅっかでおきかえる： レバーをひき、 ほんとうのほうしゅうとつぎのタイルをみて、 そのマスを r + q[s’, a’] へよせる。',
      'scene11.eps':    'ときどき わざと さいぜんにみえないレバーをためす（イプシロン）、 まなびつづけるために。',
      'scene11.train':  '2つのがくしゅうをくんれん',
      'scene11.scrub':  'エピソード：',
      'scene11.qlTitle':'Q-ラーニング（オフポリシー）',
      'scene11.sarsaTitle':'SARSA（オンポリシー）',
      'scene11.oracleTitle':'DP オラクル',
      'scene11.qlConv': 'Q-ラーニングは つぎのさいぜんのレバーでブートストラップ： せいかくなとなりをとりもどす（DP といっち）。',
      'scene11.sarsaConv':'SARSA は したがうしんちょうなルールのかちをまなぶ： うすい (2,3) を 1時間はやくおくる。',
      'scene11.agree':  'DP といっちするマス',
      'scene11.retLabel':'(2,4) からのへいきんリターン',
      'scene11.diffNote':'ちがいは (2,3) だけ： DP と Q-ラーニングは WAIT、 SARSA は SEND（よりしんちょう）。 さまよう WAIT がにもつをとりのこすことがあるので、 オンポリシーの SARSA は あんぜんなしゅっかをとる。',
      'scene11.framing':'かんぺきなよそくはふよう。 たくさんの小さなじっけん： ためす、みる、なおす、 そしてプレイブックはしゅうそく。 オフポリシーは せいかくなさいてきに、 オンポリシーは すこししんちょうに。 どちらも しょうじきなこたえ。',
    },
  });
})();

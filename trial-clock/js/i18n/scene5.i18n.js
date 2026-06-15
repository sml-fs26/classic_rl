/* scene5 i18n, trajectory. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene5.title':  'Trajectory',
      'scene5.lede':   'One trial is a sequence of random variables: situation, lever, reward, repeat, until a terminal. The capitals mean "random until they happen".',
      'scene5.formulaLabel': 'a run is a sequence τ',
      'scene5.play':   'PLAY THE TRIAL',
      'scene5.again':  'PLAY AGAIN',
      'scene5.tick':   'a day ticks',
      'scene5.colState':'state S',
      'scene5.colLever':'lever A',
      'scene5.colDie':  'the dice',
      'scene5.colReward':'reward R',
      'scene5.colNext': 'next S',
      'scene5.note':   'Reward is mostly 0 along the way; the payoff lands at the end. Run the same playbook on the next user and you get a different tape.',
      'scene5.framing':'One customer’s journey is one sample path. The policy is fixed; the dice are not, so each user writes a different trajectory.',
    },
    jp: {
      'scene5.title':  'きせき',
      'scene5.lede':   '1つの トライアルは かくりつへんすうの れつ： じょうきょう、 レバー、 ほうしゅう、 くりかえし、 しゅうりょうまで。 だいもじは 「おきるまで ランダム」 の いみ。',
      'scene5.formulaLabel': 'プレイは れつ τ',
      'scene5.play':   'トライアルを さいせい',
      'scene5.again':  'もういちど',
      'scene5.tick':   '1にち すぎる',
      'scene5.colState':'じょうたい S',
      'scene5.colLever':'レバー A',
      'scene5.colDie':  'さいころ',
      'scene5.colReward':'ほうしゅう R',
      'scene5.colNext': 'つぎ S',
      'scene5.note':   'とちゅうの ほうしゅうは ほぼ 0； ペイオフは さいごに くる。 つぎの ユーザーに おなじ プレイブックで ちがう テープに なる。',
      'scene5.framing':'1にんの おきゃくの たびは 1つの サンプルパス。 ポリシーは こてい、 さいころは ちがう, だから ユーザーごとに ちがう きせきを かく。',
    },
  });
})();

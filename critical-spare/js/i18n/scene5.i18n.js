/* scene5 i18n -- trajectory. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene5.title': 'Trajectory',
      'scene5.lede':  'Following one policy from a start produces a rollout tape: a sequence of situations, levers, and payoffs.',
      'scene5.formulaLabel': 'A QUARTER IS A SEQUENCE OF RANDOM VARIABLES',
      'scene5.play':  'PLAY THE QUARTER',
      'scene5.again': 'PLAY AGAIN',
      'scene5.colState':  'situation',
      'scene5.colLever':  'lever',
      'scene5.colOut':    'roll',
      'scene5.colReward': 'cash',
      'scene5.colNext':   'next',
      'scene5.note':  'Each Sᵢ, Aᵢ, Rᵢ is a random variable: the dice make the same policy produce a different tape every quarter.',
      'scene5.framing': 'Run the same playbook twice and you get two different quarters -- <b>that is the randomness, not bad management</b>. This tape is the unit of experience SARSA will later learn from.',
    },
    jp: {
      'scene5.title': 'きせき',
      'scene5.lede':  'スタートから 1つの ポリシーに したがうと ロールアウト テープが できる： じょうきょう、 レバー、 ほうしゅうの れつ。',
      'scene5.formulaLabel': 'クォーターは かくりつへんすうの れつ',
      'scene5.play':  'クォーターを さいせい',
      'scene5.again': 'もういちど',
      'scene5.colState':  'じょうきょう',
      'scene5.colLever':  'レバー',
      'scene5.colOut':    'ロール',
      'scene5.colReward': 'げんきん',
      'scene5.colNext':   'つぎ',
      'scene5.note':  'かく Sᵢ, Aᵢ, Rᵢ は かくりつへんすう： サイコロが おなじ ポリシーで まいクォーター ちがう テープを うむ。',
      'scene5.framing': 'おなじ プレイブックを 2かい まわすと 2つの ちがう クォーターに なる。 <b>これは ランダムさで あって へたな けいえいでは ない</b>。 この テープが あとで SARSA が まなぶ けいけんの たんい。',
    },
  });
})();

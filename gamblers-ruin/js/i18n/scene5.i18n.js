/* scene5 i18n, trajectory. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene5.title':  'Trajectory',
      'scene5.lede':   'One full attempt, written down move by move. Capital letters, because every entry was a coin-flip away before it happened.',
      'scene5.formulaLabel': 'A RUN IS A SEQUENCE OF RANDOM VARIABLES',
      'scene5.play':   'Replay this run',
      'scene5.again':  'Replay',
      'scene5.colCap':  'S (cap)',
      'scene5.colStake':'A (stake)',
      'scene5.colReward':'R',
      'scene5.colNext': 'next S',
      'scene5.win':    'WIN',
      'scene5.note':   'Reward is 0 on every step until the very end. The same policy from the same $5 start produces a <em>different</em> trajectory every time.',
      'scene5.framing':'One attempt at the target, move by move. It would have read completely differently if the coin had fallen the other way even once.',
    },
    jp: {
      'scene5.title':  'トラジェクトリ',
      'scene5.lede':   'かんぜんな 1かいの ちょうせんを、ての うごきごとに かきとめた もの。だいもじなのは、おこる まえは どの こうもくも コインなげ ひとつ ぶんの きょりだったから です。',
      'scene5.formulaLabel': '1かいの きろくは かくりつへんすうの ならび です',
      'scene5.play':   'この きろくを さいせい',
      'scene5.again':  'さいせい',
      'scene5.colCap':  'S（しさん）',
      'scene5.colStake':'A（かけきん）',
      'scene5.colReward':'R',
      'scene5.colNext': 'つぎの S',
      'scene5.win':    'かち',
      'scene5.note':   'みかえりは いちばん さいごまで どの ステップでも 0。おなじ ポリシーで おなじ $5 から はじめても、まいかい <em>ちがう</em> トラジェクトリ に なります。',
      'scene5.framing':'ゴールへの 1かいの ちょうせんを、ての うごきごとに。コインが いちどでも はんたいに おちていたら、まったく ちがう よみものに なっていた でしょう。',
    },
  });
})();

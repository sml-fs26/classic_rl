/* scene5 i18n, trajectory. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene5.title':  'Trajectory',
      'scene5.lede':   'One full shift, written down step by step. Capital letters because every entry was a roll of the die <em>before</em> it happened. The same policy from full yields a different tape each time.',
      'scene5.flabel': 'a run is a sequence of random variables',
      'scene5.step':   'STEP',
      'scene5.shuffle':'RESHUFFLE',
      'scene5.hint':   'STEP walks the rollout; RESHUFFLE rolls a new shift from the same playbook. It would read differently if the drain die fell another way.',
    },
    jp: {
      'scene5.title':  'きせき',
      'scene5.lede':   '1かいの シフトを、 ステップごとに かきとめる。 おおもじ なのは、 かく エントリーが おきる <em>まえに</em> ダイスの ひとふり だったから。 フルからの おなじ ポリシーでも まいかい ちがう テープ。',
      'scene5.flabel': 'プレイは かくりつへんすうの れつ',
      'scene5.step':   'ステップ',
      'scene5.shuffle':'シャッフル',
      'scene5.hint':   'ステップで ロールアウトを すすめ、 シャッフルで おなじ プレイブックから あたらしい シフトを。 ダイスが ちがえば ちがう テープに なる。',
    },
  });
})();

/* scene8 i18n -- Bellman optimality. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title':  'Bellman optimality',
      'scene8.lede':   'Value is recursive: the value of a lever is the immediate payoff plus the best you can do from wherever the dice land you.',
      'scene8.walk':   'WALK WAIT AT (2,3)',
      'scene8.walkReset':'RESET',
      'scene8.term1':  'with prob 0.2 the deadline blows',
      'scene8.term2':  'with prob 0.8 you survive, then average over the arrival die',
      'scene8.result': 'WAIT(2,3) = +0.40',
      'scene8.handTitle':'TWO HAND-CHECKABLE BACKUPS',
      'scene8.framing':'Good long-run thinking is recursive: today’s payoff plus the value of the position you leave yourself in. Bellman just writes that down exactly.',
    },
    jp: {
      'scene8.title':  'ベルマンさいてきせい',
      'scene8.lede':   'かちは さいきてき： レバーのかちは いまのほうしゅう ＋ ダイスのおちたさきの べすと。',
      'scene8.walk':   '(2,3) の WAIT をたどる',
      'scene8.walkReset':'リセット',
      'scene8.term1':  'かくりつ 0.2 で しめきりがだめに',
      'scene8.term2':  'かくりつ 0.8 で ぶじ、そのご とうちゃくダイスで へいきん',
      'scene8.result': 'WAIT(2,3) = +0.40',
      'scene8.handTitle':'てけいさんできる 2つのバックアップ',
      'scene8.framing':'よいロングランのしこうは さいきてき： きょうのほうしゅう ＋ のこすポジションのかち。 ベルマンは それをせいかくに かくだけ。',
    },
  });
})();

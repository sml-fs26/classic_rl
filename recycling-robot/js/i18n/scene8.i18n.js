/* scene8 i18n -- Bellman. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title':  'Bellman optimality',
      'scene8.lede':   'Smart operating is recursive: the right move now depends on the value of the situation it lands you in next.',
      'scene8.flabel': 'today’s value, defined by tomorrow’s',
      'scene8.plain':  'The value of a lever now = the payoff it pays this step, plus the value of the rung it leaves you in next, assuming you again pull the best lever there.',
      'scene8.work.title': 'A worked one-step backup: SEARCH from a low battery',
      'scene8.work.s1':    'SEARCH from low collects +2 trash this step.',
      'scene8.work.s2':    'But from low, a −1 drain AND a −2 drain BOTH land on empty.',
      'scene8.work.s3':    'So both outcomes strand the robot for the −10 rescue.',
      'scene8.hint':    'Today’s value is defined in terms of tomorrow’s. From low, searching is a certain loss, the stranding shadow makes it honestly negative.',
    },
    jp: {
      'scene8.title':  'ベルマン さいてきせい',
      'scene8.lede':   'かしこい うんようは さいきてき： いまの せいかいは、 つぎに たどりつく じょうきょうの かちで きまる。',
      'scene8.flabel': 'きょうの かちを、 あすの かちで さだめる',
      'scene8.plain':  'いまの レバーの かち = この ステップの ペイオフ ＋ つぎに のこる だんの かち、 そこでも さいぜんの レバーを ひく ことが ぜんてい。',
      'scene8.work.title': 'いっぽ バックアップの れい： ひくい バッテリーでの サーチ',
      'scene8.work.s1':    'ひくいからの サーチは この ステップで +2 ゴミを とる。',
      'scene8.work.s2':    'でも ひくいからは、 −1 ドレインも −2 ドレインも りょうほう カラに とどく。',
      'scene8.work.s3':    'だから どちらの けっかも −10 の レスキューで こしょう。',
      'scene8.hint':    'きょうの かちは あすの かちで さだまる。 ひくいからの サーチは かくじつな そんしつ、 こしょうの かげが しょうじきに マイナスに する。',
    },
  });
})();

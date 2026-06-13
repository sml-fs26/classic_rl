/* scene8 i18n -- Bellman optimality. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title':  'Bellman optimality',
      'scene8.lede':   'The value of a stake now equals the chance it pays off this flip, plus the value of wherever it leaves you, assuming you again place the best stake there.',
      'scene8.formulaLabel': 'TODAY’S VALUE IS DEFINED IN TERMS OF TOMORROW’S',
      'scene8.readTitle':'In plain English',
      'scene8.read':   'Smart betting is <b>recursive</b>: this turn’s right stake depends on how valuable each landing spot is, which depends on the right stake <em>there</em>. The equation just writes that dependency down.',
      'scene8.workedTitle':'Two one-step backups you can check by hand',
      'scene8.pick':   'Both edge rungs are one flip from a terminal, so the arithmetic is a single line. Pick one:',
      'scene8.btn1':   'At $1 (bet $1)',
      'scene8.btn9':   'At $9 (bet $1)',
      'scene8.c1.expr':'At $1, BET $1 wins to $2 or loses to ruin. Ruin is worth 0, so:',
      'scene8.c9.expr':'At $9, BET $1 wins straight to the goal (worth 1) or falls to $8:',
      'scene8.matches':'matches V*(${cap})',
      'scene8.framing':'This turn’s right stake depends on how valuable each landing spot is, which depends on the right stake there. Value flows backward from the prize.',
    },
    jp: {
      'scene8.title':  'ベルマン さいてきせい',
      'scene8.lede':   'いまの かけきんの かちは、この コインなげで みのる かくりつ たす、その けっか たどりつく ばしょの かち（そこでも また さいこうの かけきんを おくと かていして）と ひとしく なります。',
      'scene8.formulaLabel': 'きょうの かちは あすの かちで きめられる',
      'scene8.readTitle':'やさしい ことばで',
      'scene8.read':   'かしこい かけかたは <b>さいきてき</b> です: この ターンの ただしい かけきんは、たどりつく それぞれの ばしょが どれだけ かちが あるかで きまり、それは <em>そこでの</em> ただしい かけきんで きまります。しきは その つながりを かきとめている だけ です。',
      'scene8.workedTitle':'てで たしかめられる 1ステップ バックアップ 2つ',
      'scene8.pick':   'りょうはしの だんは どちらも おわりの じょうたいから コインなげ 1つぶん なので、けいさんは 1ぎょう です。1つ えらんで:',
      'scene8.btn1':   '$1 で（$1 を かける）',
      'scene8.btn9':   '$9 で（$1 を かける）',
      'scene8.c1.expr':'$1 では、BET $1 は $2 へ かち、または はさんへ まけ。はさんは かち 0 なので:',
      'scene8.c9.expr':'$9 では、BET $1 は そのまま ゴールへ かち（かち 1）、または $8 へ おちる:',
      'scene8.matches':'V*(${cap}) と いっち',
      'scene8.framing':'この ターンの ただしい かけきんは、たどりつく それぞれの ばしょの かちで きまり、それは そこでの ただしい かけきんで きまります。かちは ほうびから うしろへ ながれます。',
    },
  });
})();

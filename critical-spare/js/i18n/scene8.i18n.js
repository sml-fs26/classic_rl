/* scene8 i18n -- Bellman optimality. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title': 'Bellman optimality',
      'scene8.lede':  'One formula card, read in plain English first.',
      'scene8.formulaLabel': 'A LEVER\'S VALUE, DEFINED RECURSIVELY',
      'scene8.readTitle': 'In plain terms',
      'scene8.read':  'The value of a lever = the cash it pays now, plus (discounted by γ = 0.9) the value of being smart in whatever situation it lands you in. Good decisions are recursive: today\'s choice is only as good as the position it leaves you in tomorrow.',
      'scene8.workedTitle': 'Two backups you can check by hand',
      'scene8.pick':  'REPLACE and ORDER each have a single, certain next state, so they are clean to verify:',
      'scene8.btnRep': 'REPLACE from FAILING/1',
      'scene8.btnOrd': 'ORDER from AGING/0',
      'scene8.repF1.expr': 'REPLACE consumes the spare and refreshes the machine to HEALTHY (empty bin). Pay 0 plus the -1 holding on the spare you still held this turn; land for certain in (HEALTHY, 0), worth γ·V*.',
      'scene8.repF1.match': '{v} = Q*(FAILING, 1, REPLACE). It reproduces the value iteration exactly.',
      'scene8.ordA0.expr': 'ORDER buys a spare into the bin (no holding cost yet, the bin was empty); land for certain in (AGING, 1), worth γ·V*.',
      'scene8.ordA0.match': '{v} = Q*(AGING, 0, ORDER). It reproduces the value iteration exactly.',
      'scene8.framing': 'Both deterministic backups land on the value iteration\'s answer. The stochastic cells (RUN) work the same way, just averaged over the failure die and the aging coin -- which is exactly what the next scene sweeps.',
    },
    jp: {
      'scene8.title': 'ベルマン さいてきせい',
      'scene8.lede':  '1まいの すうしき カード、 まず ことばで よむ。',
      'scene8.formulaLabel': 'レバーの かちを さいきてきに ていぎ',
      'scene8.readTitle': 'ことばで いうと',
      'scene8.read':  'レバーの かち = いま はらう げんきん + (γ = 0.9 で わりびいた) おとされた さきの じょうきょうで かしこく する かち。 よい けっていは さいきてき： きょうの せんたくは あすの ばしょと おなじだけ よい。',
      'scene8.workedTitle': 'てで かくにん できる バックアップ 2つ',
      'scene8.pick':  'こうかんと はっちゅうは つぎの じょうたいが 1つに さだまるので かくにんが きれい：',
      'scene8.btnRep': 'こしょうまえ/1 から こうかん',
      'scene8.btnOrd': 'ろうきゅう/0 から はっちゅう',
      'scene8.repF1.expr': 'こうかんは よびひんを つかい きかいを けんこうに リフレッシュ (ビンは から)。 ひよう 0 と、 このターンに もっていた よびひんの ほかん -1。 かくじつに (けんこう, 0) に つき、 γ·V* の かち。',
      'scene8.repF1.match': '{v} = Q*(こしょうまえ, 1, こうかん)。 かちはんぷくを そのまま さいげん。',
      'scene8.ordA0.expr': 'はっちゅうは よびひんを ビンに かう (ビンは からだったので まだ ほかん ひようなし)。 かくじつに (ろうきゅう, 1) に つき、 γ·V* の かち。',
      'scene8.ordA0.match': '{v} = Q*(ろうきゅう, 0, はっちゅう)。 かちはんぷくを そのまま さいげん。',
      'scene8.framing': 'どちらの かくてい バックアップも かちはんぷくの こたえに つく。 かくりつてきな セル (うんてん) も おなじ、 ただ こしょうダイスと ろうきゅうコインで へいきんする だけ。 それを つぎの シーンで スイープ する。',
    },
  });
})();

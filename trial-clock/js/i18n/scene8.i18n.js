/* scene8 i18n, Bellman optimality. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title':  'Bellman optimality',
      'scene8.lede':   'Q* is defined recursively: today’s payoff plus the best you can do from wherever the dice land you. The worth of a move = its immediate payoff plus the worth of the position it leaves you in.',
      'scene8.formulaLabel': 'value today = this reward + value of the next situation, played optimally',
      'scene8.readTitle': 'In words',
      'scene8.read':   'Pull a lever; you get a reward and the dice drop you somewhere. The value of the move is that reward plus the value of where you landed, assuming you keep playing optimally. Self-referential, but it pins down a unique answer.',
      'scene8.workedTitle': 'Worked on one cell: PUSH at (tier 3, day 2)',
      'scene8.calcLead': 'From tier 3 with 2 days left, a PUSH spins the wheel: BUY → +20; IGNORE → land in (tier 3, day 1) worth {vnext} and play best there; ABANDON has zero weight here. Average by the printed odds:',
      'scene8.matches':'= V*(tier {tier}, {days}d)',
      'scene8.replay': 'SPIN IT',
      'scene8.framing':'Same logic as any multi-step plan: the worth of a move is its immediate payoff plus the worth of the position it leaves you in. Apply it everywhere and you get the whole table.',
    },
    jp: {
      'scene8.title':  'ベルマン さいてきせい',
      'scene8.lede':   'Q* は さいきてきに ていぎ される： きょうの ペイオフ ＋ さいころが おとす さきから できる さいぜん。 いっての かち = その すぐの ペイオフ ＋ のこされた いちの かち。',
      'scene8.formulaLabel': 'きょうの かち = この ほうしゅう ＋ つぎの じょうきょうの かち（さいぜんに プレイ）',
      'scene8.readTitle': 'ことばで',
      'scene8.read':   'レバーを ひく； ほうしゅうを え、 さいころが どこかへ おとす。 いっての かちは その ほうしゅう ＋ ついた さきの かち, さいぜんに プレイ しつづける ぜんてい。 じこさんしょう だが、 ゆいいつの こたえを きめる。',
      'scene8.workedTitle': '1つの セルで けいさん： （レベル 3、 にっすう 2）の プッシュ',
      'scene8.calcLead': 'レベル 3 で のこり 2にち、 プッシュは ホイールを まわす： こうにゅう → +20； むし → かち {vnext} の（レベル 3、 にっすう 1）に ついて そこで さいぜん； りだつは ここでは じゅうみ ゼロ。 ひょうじ オッズで へいきん：',
      'scene8.matches':'= V*(レベル {tier}、 {days}にち)',
      'scene8.replay': 'まわす',
      'scene8.framing':'どんな たすうステップの けいかくとも おなじ ロジック： いっての かちは すぐの ペイオフ ＋ のこされた いちの かち。 すべてに てきようすると ひょう ぜんたいに なる。',
    },
  });
})();

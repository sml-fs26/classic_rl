/* scene12 i18n -- recap. (Card titles/text fall back to window.DATA.recap if a
   recap.<key>.* string is absent; here we provide the Japanese translations and
   re-state the English so a toggle is crisp both ways.) */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene12.title':  'Recap',
      'scene12.sub':    'Six ideas, each tied back to the trial. The vocabulary is now yours.',
      'scene12.close':  'You’ve learned the bones -- the same frame fits pricing, retention, inventory, and every other call you make under uncertainty.',
      'scene12.bridge': 'Next time someone asks "should we push the upgrade now?", you have a structured answer: it depends on the situation, and here is the value that decides.',
      'scene12.replay': '↺ REPLAY FROM THE TOP',

      'recap.mdp.title':    'THE FOUR-PART FRAME',
      'recap.mdp.text':     'The situation is the TRIAL CARD: how far up the adoption ladder, how many days left. The lever is NUDGE / DO NOTHING / PUSH. The part you do not control is the Adoption Coin and the Conversion Wheel. The payoff is +20 if they convert, with costs along the way.',
      'recap.policy.title': 'YOUR GROWTH PLAYBOOK',
      'recap.policy.text':  'A policy assigns one lever to EVERY situation -- the SOP a new growth hire could run without you. When you played by gut you already were a policy; you just had not written it down.',
      'recap.return.title': 'ROI AS A DISTRIBUTION',
      'recap.return.text':  'The return is the payoff summed over the whole trial, lifetime value minus costs. It is a distribution across customers, not one number -- a good lever wins on average, and you must respect the downside (the ABANDON tail).',
      'recap.qstar.title':  'THE HONEST VALUE OF A LEVER',
      'recap.qstar.text':   'Q*(s, a) is the true long-run value of pulling lever a in situation s, assuming you play smart afterward. The best lever is the argmax -- and the star FLIPS across the board: NUDGE while cold and early, PUSH once hooked or out of runway.',
      'recap.dp.title':     'EXACT PLAYBOOK IF YOU KNEW THE WORLD',
      'recap.dp.text':      'With the dice odds known, Q* solves its own Bellman equation: the worth of a move = its immediate payoff plus the worth of the position it leaves you in. The hard deadline lets you solve it right to left and watch the staircase build.',
      'recap.sarsa.title':  'LEARN THE PLAYBOOK BY PLAYING',
      'recap.sarsa.text':   'No model of how customers respond? Replace the expectation with one observed attempt: pull a lever, see what converts, nudge the estimate, repeat -- with a little exploration to keep improving. It converges to the same staircase DP would give, never told the odds.',
    },
    jp: {
      'scene12.title':  'まとめ',
      'scene12.sub':    '6つの アイデア、 それぞれ トライアルに むすぶ。 ことばは いま あなたの もの。',
      'scene12.close':  'ほねは まなんだ -- おなじ フレームが プライシング、 リテンション、 ざいこ、 そして ふかくじつな すべての はんだんに あう。',
      'scene12.bridge': 'つぎに だれかが 「いま アップグレードを プッシュ すべき？」 と きいたら、 こうぞうてきな こたえが ある： じょうきょう しだい、 そして それを きめる かちは これ。',
      'scene12.replay': '↺ さいしょから',

      'recap.mdp.title':    'よっつの ぶぶんの フレーム',
      'recap.mdp.text':     'じょうきょうは トライアル カード： りようの はしごの どこ、 のこり にっすう いくつ。 レバーは ナッジ / なにもしない / プッシュ。 じぶんで きめられない ぶぶんは りようコインと コンバージョン ホイール。 ペイオフは こうにゅうで +20、 とちゅうに コスト。',
      'recap.policy.title': 'あなたの グロース プレイブック',
      'recap.policy.text':  'ポリシーは すべての じょうきょうに 1つの レバーを わりあてる -- あなた なしで あたらしい たんとうが まわせる SOP。 かんで あそんだ とき すでに ポリシー だった； かいて いなかっただけ。',
      'recap.return.title': 'ぶんぷとしての ROI',
      'recap.return.text':  'リターンは トライアル ぜんたいで たした ペイオフ、 ライフタイムバリュー ひく コスト。 1つの すうじでなく おきゃくの あいだの ぶんぷ -- よい レバーは へいきんで かち、 マイナス（りだつ の すそ）を そんちょう しなければ ならない。',
      'recap.qstar.title':  'レバーの しょうじきな かち',
      'recap.qstar.text':   'Q*(s, a) は じょうきょう s で レバー a を ひく しんの ちょうきかち（あとは じょうずに プレイ）。 さいぜんは argmax -- ★は ボードで はんてん する： つめたく はやければ ナッジ、 むちゅう または のこり じかんが なければ プッシュ。',
      'recap.dp.title':     'せかいを しれば せいかくな プレイブック',
      'recap.dp.text':      'さいころの オッズを しれば、 Q* は じぶんの ベルマンしきを とく： いっての かち = すぐの ペイオフ ＋ のこされた いちの かち。 きびしい しめきりで みぎから ひだりへ とき、 かいだんが できるのを みる。',
      'recap.sarsa.title':  'プレイして プレイブックを まなぶ',
      'recap.sarsa.text':   'おきゃくの はんのうの モデルが ない？ きたいちを 1かいの かんそくで おきかえる： レバーを ひき、 なにが こうにゅう するか みて、 すいていを よせ、 くりかえす -- すこしの たんさくで かいぜん しつづける。 オッズを しらされずに DP と おなじ かいだんに しゅうそく する。',
    },
  });
})();

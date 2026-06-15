/* scene12 i18n, recap. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene12.title':   'Recap',
      'scene12.sub':     'Six ideas, one coin and one ladder.',
      'scene12.close':   'You’ve learned the bones of decision-making under unfavorable odds, and of reinforcement learning.',
      'scene12.bridge':  'From a coin and a ladder to any high-stakes target you must hit against the odds.',
      'scene12.replay':  'Replay from the top',
      /* recap card titles + bodies (mirror window.DATA.recap so a JP toggle
         translates the cards; scene12.js prefers these when present). */
      'recap.mdp.title':    'THE FOUR-PART FRAME',
      'recap.mdp.text':     'The situation is your CAPITAL (the rung you sit on). The lever is your STAKE ($1/$2/$3). The part you do not control is the rigged COIN. The payoff is binary: +1 the instant you reach $10, 0 if you go broke first.',
      'recap.policy.title': 'YOUR BETTING PLAYBOOK',
      'recap.policy.text':  'A policy assigns one stake to EVERY rung of the ladder, the SOP your whole team could follow without you. When you played by gut you already were a policy; you just had not written it down.',
      'recap.return.title': 'A 0/1 OUTCOME, AVERAGED',
      'recap.return.text':  'The return from here is the eventual win or loss: 1 or 0. So the EXPECTED return is exactly your probability of hitting target. Judge a strategy by its win-rate over many tries, never by one lucky flip.',
      'recap.qstar.title':  'THE HONEST WIN-ODDS OF A STAKE',
      'recap.qstar.text':   'Q*(s, a) is your true win probability if you place stake a now and bet smart afterward. The best stake is the argmax, and the star ZIG-ZAGS up the ladder: timid at the edges, bold through the dangerous middle.',
      'recap.dp.title':     'EXACT PLAYBOOK IF YOU KNEW THE COIN',
      'recap.dp.text':      'With the coin\'s bias known, Q* solves its own Bellman equation: today\'s value is the chance it pays this flip plus the value of where it lands you. Sweep the backup and value spreads from the prize back toward the cliff.',
      'recap.sarsa.title':  'LEARN THE PLAYBOOK BY PLAYING',
      'recap.sarsa.text':   'No model of the coin? Replace the expectation with one observed flip. Two update rules: on-policy SARSA learns the value of the cautious rule it follows and lands timid; off-policy Q-learning bootstraps on the best next stake and recovers the bold zig-zag, matching DP. Same flips, two honest answers.',
    },
    jp: {
      'scene12.title':   'おさらい',
      'scene12.sub':     '6つの アイデア、コイン 1つと はしご 1つ。',
      'scene12.close':   'ふりな うんのなかでの いしけっていの、そして きょうかがくしゅうの ほねぐみを まなびました。',
      'scene12.bridge':  'コインと はしごから、ふりな うんに さからって どうしても とどかせたい どんな だいしょうぶの ゴールへも。',
      'scene12.replay':  'さいしょから さいせい',
      'recap.mdp.title':    'よっつの ぶぶんの わくぐみ',
      'recap.mdp.text':     'じょうきょうは あなたの しさん（のっている だん）。レバーは あなたの かけきん（$1/$2/$3）。コントロールできない ぶぶんは いかさまコイン。みかえりは 2たくいつ: $10 に とどいた しゅんかんに +1、さきに はさんなら 0。',
      'recap.policy.title': 'あなたの かけかた こうりゃくぼん',
      'recap.policy.text':  'ポリシーは はしごの すべての だんに かけきんを 1つ わりあてる、あなたが いなくても チームが したがえる SOP。カンで あそんだとき、あなたは すでに ポリシーそのもの でした。ただ かきとめて いなかった だけ。',
      'recap.return.title': '0/1 の けっか、へいきん',
      'recap.return.text':  'ここからの リターンは さいごの かち か まけ: 1 か 0。だから きたい リターンは ちょうど ゴールに とどく かくりつ。せんりゃくは なんども やった かちりつで はんだんし、1かいの まぐれで はんだん しないで。',
      'recap.qstar.title':  'かけの しょうじきな かちオッズ',
      'recap.qstar.text':   'Q*(s, a) は いま かけきん a を おき あとは かしこく かけたときの ほんとうの かちかくりつ。さいこうの かけきんは argmax、そして ★は はしごを ジグザグに のぼる: はしでは しんちょう、あぶない まんなかでは だいたん。',
      'recap.dp.title':     'コインを しれば せいかくな こうりゃくぼん',
      'recap.dp.text':      'コインの かたよりが きちなら、Q* は じぶんの ベルマンしきを とく: きょうの かちは この コインなげで みのる かくりつ たす たどりつく ばしょの かち。バックアップを はけば かちは ほうびから がけへ ひろがる。',
      'recap.sarsa.title':  'プレイして こうりゃくぼんを まなぶ',
      'recap.sarsa.text':   'コインの モデルが ない？ きたいちを 1かいの なげで おきかえる。ふたつの こうしんルール: オンポリシーの SARSA は したがう しんちょうな ルールの かちを まなび こしぬけに なる; オフポリシーの Q-ラーニングは つぎの さいぜんの かけで ブートストラップし だいたんな ジグザグ（DP と いっち）を とりもどす。おなじ なげ、ふたつの しょうじきな こたえ。',
    },
  });
})();

/* scene12 i18n -- recap. The six card title/text keys mirror DATA.recap (EN)
   so the card copy is translatable; the EN strings here are the source of truth
   the page reads (DATA.recap also carries them for non-i18n fallback). */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene12.title': 'Recap',
      'scene12.lede':  'You have learned the bones of managing an asset under uncertainty, and of reinforcement learning. Six ideas, in the robot-and-gauge language. Tap a card to revisit its scene.',
      'scene12.close': 'A robot’s battery, or any push-it-or-protect-it decision made over time: the right call is not fixed, it marches with the situation.',

      'recap.mdp.title':    'THE FOUR-PART FRAME',
      'recap.mdp.text':     'The situation is the BATTERY (the rung on the gauge). The lever is SEARCH / WAIT / RECHARGE. The part you do not control is the DRAIN DIE on a search. The payoff is the trash collected, minus a −10 rescue if you strand the robot.',
      'recap.policy.title': 'YOUR OPERATING SOP',
      'recap.policy.text':  'A policy assigns one lever to every rung of the gauge, the rule your operation runs without you in the room. When you played by gut you already were a policy.',
      'recap.return.title': 'PAYOFF OVER THE SHIFT, AND ITS RISK',
      'recap.return.text':  'The return is the trash summed over the whole shift, net of rescue. SEARCH-from-mid averages fine, but a third of the time a bad drain strands the asset for −8. Variance is the risk you carry.',
      'recap.qstar.title':  'THE HONEST LONG-RUN VALUE OF A LEVER',
      'recap.qstar.text':   'Q*(s, a) is the true value of pulling lever a at battery s, played smart afterward. The star MARCHES UP the gauge: RECHARGE at the bottom, SEARCH at the top. The seam between high and mid is the punchline.',
      'recap.dp.title':     'EXACT PLAYBOOK IF YOU KNEW THE DRAIN',
      'recap.dp.text':      'With the drain probabilities known, Q* solves its own Bellman equation. Back up from the last step and the whole rule draws itself in two passes.',
      'recap.sarsa.title':  'LEARN THE PLAYBOOK BY OPERATING',
      'recap.sarsa.text':   'No drain model? Replace the expectation with one observed drain. On-policy SARSA learns the cautious rule it follows and protects at high; off-policy Q-learning bootstraps on the best next lever and recovers the DP stripe.',
    },
    jp: {
      'scene12.title': 'まとめ',
      'scene12.lede':  'ふかくじつせいの もとでの しさんかんり、 そして きょうかがくしゅうの ほねを まなびました。 6つの アイデアを、 ロボットと ゲージの ことばで。 カードを タップで シーンへ。',
      'scene12.close': 'ロボットの バッテリー、 あるいは じかんを かけた どんな「おすか まもるか」の いしけっても： せいかいは こていでは なく、 じょうきょうと ともに すすむ。',

      'recap.mdp.title':    'よっつの ぶぶんの フレーム',
      'recap.mdp.text':     'じょうきょうは バッテリー（ゲージの だん）。 レバーは サーチ / まつ / じゅうでん。 きめられない ぶぶんは サーチの ドレインダイス。 ペイオフは あつめた ゴミ、 こしょうなら −10 の レスキューを ひく。',
      'recap.policy.title': 'あなたの うんよう SOP',
      'recap.policy.text':  'ポリシーは ゲージの すべての だんに 1つの レバーを わりあてる、 あなたが いなくても まわる ルール。 かんで あそんだとき すでに ポリシーだった。',
      'recap.return.title': 'シフトの ペイオフと その リスク',
      'recap.return.text':  'リターンは シフトぜんたいの ゴミの ごうけい、 レスキューを さしひく。 ちゅうからの サーチは へいきんは よいが、 3かいに 1かい −8 で こしょう。 ぶんさんが リスク。',
      'recap.qstar.title':  'レバーの しょうじきな ちょうきかち',
      'recap.qstar.text':   'Q*(s, a) は バッテリー s で レバー a を ひく しんの かち、 あとは じょうずに。 ★が ゲージを のぼる： したは じゅうでん、 うえは サーチ。 たかいと ちゅうの さかいめが おち。',
      'recap.dp.title':     'ドレインを しれば せいかくな プレイブック',
      'recap.dp.text':      'ドレインの かくりつが きちなら、 Q* は じぶんの ベルマンしきを とく。 さいごの ステップから さかのぼり、 2かいで ルールが ひとりでに えがかれる。',
      'recap.sarsa.title':  'うんようで プレイブックを まなぶ',
      'recap.sarsa.text':   'ドレインモデルなし？ きたいちを 1つの かんそく ドレインに おきかえる。 オンポリシーの SARSA は したがう しんちょうな ルールを まなび たかいで まもる。 オフポリシーの Q-ラーニングは つぎの さいぜんで DP の ストライプを とりもどす。',
    },
  });
})();

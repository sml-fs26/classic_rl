/* scene12 i18n -- recap. (Card titles/text fall back to window.DATA.recap when a
   recap.<key>.* string is absent, so EN works from the dataset; here we provide
   the JP overrides + the scene chrome.) */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene12.title': 'Recap',
      'scene12.sub':   'Six ideas, one per card -- the bones of how a machine can learn the right maintenance call.',
      'scene12.close': 'The right call flipped with the situation: RUN it, pre-order, or swap now. You\'ve learned the bones of how a machine can learn that for you.',
      'scene12.bridge': 'Same skeleton runs every cartridge in this gallery -- only the game changes.',
      'scene12.replay': 'REPLAY THE OPTIMAL POLICY',
    },
    jp: {
      'scene12.title': 'まとめ',
      'scene12.sub':   '6つの アイデア、 1まいに 1つ。 きかいが ただしい ほぜん せんたくを どう まなぶか、 その ほね。',
      'scene12.close': 'ただしい せんたくは じょうきょうで うらがえった： うんてん、 さきに はっちゅう、 いま こうかん。 きかいが それを どう まなぶか、 その ほねを みた。',
      'scene12.bridge': 'おなじ ほねが この ギャラリーの すべての カートリッジを うごかす。 かわるのは ゲームだけ。',
      'scene12.replay': 'さいてき ポリシーを さいせい',

      /* JP recap card overrides (EN comes from window.DATA.recap) */
      'recap.mdp.title': '4つの ぶぶんの フレーム',
      'recap.mdp.text': 'じょうきょうは すでに みている 2つの ゲージ： けんこうど と よびひん。 レバーは うんてん / はっちゅう / こうかん。 せいぎょ できないのは こしょうダイス (と ろうきゅうコイン)。 ほうしゅうは このターンの げんきん： うんてん +3、 はっちゅう -2、 ダウンタイム -8、 いそぎ こうかん -3、 よびひん -1。',
      'recap.policy.title': 'ほぜん プレイブック',
      'recap.policy.text': 'ポリシーは 9つの じょうきょう すべてに 1つの レバーを わりあてる。 あなた なしで チームが したがう SOP。 「こしょうまで うんてん」 と 「つねに ざいこ」 は そういう ドクトリン。',
      'recap.return.title': 'クォーターを ぶんぷ として',
      'recap.return.text': 'リターンは のこりの ホライズンで たした げんきん。 おなじ プレイブックを 2かい まわすと 2つの ちがう クォーター。 それは サイコロで あって へたな けいえいでは ない。 ドクトリンは ぶんぷ ぜんたいで はんだん。',
      'recap.qstar.title': 'レバーの しょうがい かち',
      'recap.qstar.text': 'Q*(s, a) は ここで レバー a を ひき、 そのあと ずっと かしこく した ときの ほんとうの ちょうきてき かち。 argmax (★) は じょうきょうで うらがえる： うんてん、 さきに はっちゅう、 いま こうかん。',
      'recap.dp.title': 'オッズを しっていれば せいかくな プレイブック',
      'recap.dp.text': 'こしょう オッズと ろうきゅうの かんぺきな モデルが あれば、 Q* は じぶんの ベルマンしきを とく。 バックアップを スイープ すると ツイスト ヒートマップが ひとりでに うまる。',
      'recap.sarsa.title': 'うんてんして プレイブックを まなぶ',
      'recap.sarsa.text': 'モデルが なければ、 きたいちを 1かいの かんそく ターンで おきかえる： レバーを ひく ごとに きたいと じっさいを くらべ、 よせる。 みけんしょうの レバーを ためす たんさく つきで、 SARSA は おなじ ツイスト ヒートマップに たどりつく。 モデルなしで。',
    },
  });
})();

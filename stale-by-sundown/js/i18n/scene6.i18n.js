/* scene6 i18n -- return G_t. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene6.title':       'Return',
      'scene6.lede':       'The return is everything you bank from here to closing, with later money discounted. The key move: one lever does not give one payoff. It gives a SPREAD.',
      'scene6.formulaLabel':'payoff over time, later money discounted',
      'scene6.setup':       'Fix the SAME start (2 units, FRESH) and the SAME first lever, then play optimally afterward. Replay 20,000 days and draw the histogram of returns.',
      'scene6.first':       '{lever} first',
      'scene6.mean':        'mean',
      'scene6.sd':          'spread',
      'scene6.worst':       'worst',
      'scene6.note.hold':   'Highest average, but a fat tail: a rotted tray can net below zero.',
      'scene6.note.discount':'Lower average, but tight: the safe play locks the sale in.',
      'scene6.note.dump':   'A low, locked outcome: you wrote it off for a small sure loss.',
      'scene6.framing':     'ROI is not a number, it is a spread. HOLD has the higher average AND the scary downside. The right metric is the long-run average payoff, never last quarter\'s lucky draw.',
    },
    jp: {
      'scene6.title':       'リターン',
      'scene6.lede':       'リターンは いまから へいてんまでに ためる すべて、 あとの おかねは わりびき。 かなめ：1つの レバーは 1つの ほうしゅうでなく、 ひろがりを あたえる。',
      'scene6.formulaLabel':'じかんを こえた ほうしゅう、 あとの おかねは わりびき',
      'scene6.setup':       'おなじ スタート（2こ、しんせん）と おなじ さいしょの レバーを こていし、 あとは さいぜんに プレイ。 20,000にち さいせいし、 リターンの ヒストグラムを えがく。',
      'scene6.first':       '{lever} さいしょ',
      'scene6.mean':        'へいきん',
      'scene6.sd':          'ひろがり',
      'scene6.worst':       'さいあく',
      'scene6.note.hold':   'さいこうの へいきん、 でも ふとい しっぽ：いたんだ トレイは マイナスに なりうる。',
      'scene6.note.discount':'ひくい へいきん、 でも ほそい：あんぜんな てで はんばいを かくほ。',
      'scene6.note.dump':   'ひくく ロックされた けっか：ちいさい かくじつな そんで かきおとした。',
      'scene6.framing':     'ROI は すうじでなく ひろがり。 キープは たかい へいきん と こわい したぶれ の りょうほう。 ただしい しひょうは ちょうきの へいきん、 けっして せんしはんきの こううんな ひき では ない。',
    },
  });
})();

/* scene8 i18n -- Bellman optimality. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title':       'Bellman optimality',
      'scene8.lede':       'A lever\'s worth is not just this hour\'s till. It is this hour plus the value of the position it leaves you in. Bellman is just that sentence, made exact.',
      'scene8.formulaLabel':'value defined in terms of itself',
      'scene8.formulaNote': 'now-payoff <b>R</b>, plus the discounted value of the <b>best</b> lever in the next situation S\'.',
      'scene8.anchorHead':  'WORKED BY HAND: the stale single (1 unit, STALE)',
      'scene8.cliff':       'on the spoilage cliff',
      'scene8.holdGloss':   'a stale single almost never sells at full price',
      'scene8.discGloss':   'even discounted, it usually spoils first',
      'scene8.reveal':      'COMPARE THE OTHER LEVERS',
      'scene8.allShown':    'ALL THREE SHOWN',
      'scene8.framing':     'A sale clears the shelf (value 0); a no-sale spoils it (−6). HOLD and DISCOUNT are near-certain losses. Eating the −3 write-off to reset to a FRESH unit (worth 3.76) is the least-bad move. Bellman found it.',
    },
    jp: {
      'scene8.title':       'ベルマン さいてきせい',
      'scene8.lede':       'レバーの かちは いまの レジ だけでなく、 いまの ぶん + のこされる いちの かち。 ベルマンは ただ その ぶんを せいかくに した もの。',
      'scene8.formulaLabel':'じぶん じしんで ていぎされる かち',
      'scene8.formulaNote': 'いまの ほうしゅう <b>R</b>、 たす つぎの じょうきょう S\' での <b>さいぜんの</b> レバーの わりびきかち。',
      'scene8.anchorHead':  'てけいさん：いたんだ 1こ（1こ、いたみ）',
      'scene8.cliff':       'はいきの がけ',
      'scene8.holdGloss':   'いたんだ 1こは ていかで ほぼ うれない',
      'scene8.discGloss':   'ねびきでも たいてい さきに いたむ',
      'scene8.reveal':      'ほかの レバーと くらべる',
      'scene8.allShown':    '3つ すべて ひょうじ',
      'scene8.framing':     'はんばいで たなが からに（かち 0）、 ふはんばいで いたむ（−6）。 キープと ねびきは ほぼ かくじつな そん。 −3を のんで しんせん（かち 3.76）に もどすのが いちばん まし。 ベルマンが みつけた。',
    },
  });
})();

/* scene7 i18n, optimal action-value Q*. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title': 'Optimal action-value Q*',
      'scene7.lede':  'Q*(s, a) is the lever\'s true long-run value: pull lever a here, then play smart forever after. The number you wish sat next to every lever on every dashboard.',
      'scene7.formulaLabel': 'THE LEVER\'S LIFETIME VALUE',
      'scene7.pick':  'Step across the situations ▶',
      'scene7.colLever': 'lever a',
      'scene7.colQ':     'Q*(s, a)',
      'scene7.at':    'Situation: <b>{state}</b>',
      'scene7.best':  'best',
      'scene7.clamped': 'not available (no spare)',
      'scene7.note':  'Watch the star MOVE as you step the picker. Same gauge reading, opposite call, decided entirely by the bin.',
      'scene7.framing': 'Q* is the lever\'s lifetime value, not its this-turn cash. The argmax (the star) is the optimal lever, and it <b>flips with the situation</b>. That flip is the whole lesson.',

      'scene7.read.h0s0': '<b>HEALTHY, empty bin → RUN.</b> Don\'t waste cash stocking spares while the machine is fine. Just run it (Q* ≈ 9.1, the cell\'s best).',
      'scene7.read.h1s0': '<b>AGING, empty bin → ORDER.</b> Paying -2 now to stock a spare (Q* ≈ 4.5) beats running into a 30%-and-rising failure with no protection (RUN ≈ 3.8). Pre-position the part before the risk peaks.',
      'scene7.read.h2s0': '<b>FAILING, empty bin → ORDER.</b> Same call as AGING with an empty bin: get protection in place. RUNNING here risks a 70% breakdown with no spare, a -8 hit.',
      'scene7.read.h2s1': '<b>FAILING, one spare → REPLACE.</b> With a 70% breakdown looming, a planned swap (refresh to HEALTHY, cost 0; Q* ≈ 7.2) beats gambling on a rushed -3 emergency swap (RUN ≈ 5.5). Once you hold the protection and it\'s on its last legs, use it.',
    },
    jp: {
      'scene7.title': 'さいてき こうどう かち Q*',
      'scene7.lede':  'Q*(s, a) は レバーの ほんとうの ちょうきてき かち： ここで レバー a を ひき、 そのあと ずっと かしこく プレイ。 すべての ダッシュボードの すべての レバーの よこに ほしい すうじ。',
      'scene7.formulaLabel': 'レバーの しょうがい かち',
      'scene7.pick':  'じょうきょうを すすむ ▶',
      'scene7.colLever': 'レバー a',
      'scene7.colQ':     'Q*(s, a)',
      'scene7.at':    'じょうきょう： <b>{state}</b>',
      'scene7.best':  'さいぜん',
      'scene7.clamped': 'りようふか (よびひん なし)',
      'scene7.note':  'ピッカーを すすめると ★が うごくのを みて。 おなじ ゲージ、 はんたいの せんたく。 ビンが すべてを きめる。',
      'scene7.framing': 'Q* は レバーの しょうがい かち、 このターンの げんきん では ない。 argmax (★) が さいぜんの レバー、 そして それは <b>じょうきょうで うらがえる</b>。 その うらがえりが ぜんぶの きょうくん。',

      'scene7.read.h0s0': '<b>けんこう・からの ビン → うんてん。</b> きかいが げんきな うちは よびひんに げんきんを むだに しない。 ただ うんてん (Q* ≈ 9.1、 セルの さいぜん)。',
      'scene7.read.h1s0': '<b>ろうきゅう・からの ビン → はっちゅう。</b> いま -2 はらって よびひんを つむ (Q* ≈ 4.5) ほうが、 ほご なしで 30%・じょうしょうちゅうの こしょうに とびこむ (うんてん ≈ 3.8) より よい。 リスクが ピークに なる まえに ぶひんを はいち。',
      'scene7.read.h2s0': '<b>こしょうまえ・からの ビン → はっちゅう。</b> ろうきゅう・からの ビンと おなじ せんたく： ほごを ととのえる。 ここで うんてん すると よびひん なしで 70% こしょう、 -8 の ひと。',
      'scene7.read.h2s1': '<b>こしょうまえ・よびひん 1 → こうかん。</b> 70% こしょうが せまるなか、 けいかくてきな こうかん (けんこうに リフレッシュ、 ひよう 0; Q* ≈ 7.2) が、 いそぎ -3 きんきゅう こうかんに かける (うんてん ≈ 5.5) より よい。 ほごを もち、 もう げんかいなら、 つかう。',
    },
  });
})();

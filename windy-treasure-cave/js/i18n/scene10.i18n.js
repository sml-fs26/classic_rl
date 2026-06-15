/* Scene 10 (why DP does not scale) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene10.title': 'WHY DP DOES NOT SCALE',
      'scene10.lede':  'The sweep gave us the exact map. So why is it not the whole story? Two rocks the "compute it all up front" dream dies on.',
      'scene10.unknown': 'ODDS UNKNOWN',
      'scene10.c1.title': 'YOU RARELY KNOW P',
      'scene10.c1.body':  'The sweep only worked because <em>we</em> wrote the wind table. A real cave, a real market, a real supply chain, never hands you the gust probabilities. You only ever <b>sample</b> what happens.',
      'scene10.c2.title': 'THE STATE SPACE EXPLODES',
      'scene10.c2.body':  'This cave is 25 tiles. A 100x100 cave with fog, items and a moving hazard is astronomically larger. A sweep over every (tile, heading) is hopeless.',
      'scene10.scale.this': 'THIS CAVE (tiles)',
      'scene10.scale.big':  'A REAL ONE (states)',
      'scene10.framing': 'The "compute it all up front" dream dies on two rocks: you do not have the odds, and the real board is far too big to enumerate. Reality usually denies both. Next: learn the map without either.',
    },
    jp: {
      'scene10.title': 'DP が スケール しない りゆう',
      'scene10.lede':  'スイープで せいかくな ちずが でた。 では なぜ それで おわり では ないのか？ 「ぜんぶ まえもって けいさん」の ゆめが しぬ ふたつの いわ。',
      'scene10.unknown': 'オッズ ふめい',
      'scene10.c1.title': 'P を めったに しらない',
      'scene10.c1.body':  'スイープが できたのは <em>われわれ</em>が かぜの ひょうを かいたから。 ほんものの どうくつ、 しじょう、 サプライチェーン は かぜの かくりつを くれない。 おきたことを <b>サンプル</b> する だけ。',
      'scene10.c2.title': 'じょうたい くうかんが ばくはつ',
      'scene10.c2.body':  'この どうくつは 25マス。 きり、 アイテム、 うごく きけん の ある 100x100 は てんもんがくてきに おおきい。 すべての（マス, むき）の スイープは ぜつぼうてき。',
      'scene10.scale.this': 'この どうくつ（マス）',
      'scene10.scale.big':  'ほんもの（じょうたい）',
      'scene10.framing': '「ぜんぶ まえもって けいさん」の ゆめは ふたつの いわで しぬ： オッズが ない、 そして ばんめんが でかすぎて れっきょ できない。 げんじつは たいてい りょうほう を こばむ。 つぎは どちらも なしで ちずを まなぶ。',
    },
  });
})();

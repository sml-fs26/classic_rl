/* scene1 i18n -- tutorial. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene1.title': 'How to play',
      'scene1.lede':  'No theory yet. Just the dashboard a plant manager already reads.',
      'scene1.turn':  'TURN',
      'scene1.die':   'FAIL RISK',
      'scene1.back':  'BACK',
      'scene1.next':  'NEXT',
      'scene1.done':  'PLAY IT ›',
      'scene1.step':  'step {n} / {total}',

      'scene1.s0.title': 'THE SITUATION.',
      'scene1.s0.body': 'Two gauges you already watch: the machine\'s HEALTH and the SPARES in your bin. Together they are the situation you decide from.',
      'scene1.s1.title': 'HEALTH GAUGE.',
      'scene1.s1.body': 'HEALTHY → AGING → FAILING. The older it gets, the bigger the red slice on the failure die.',
      'scene1.s2.title': 'SPARES BIN.',
      'scene1.s2.body': 'Hold 0, 1, or 2 spare parts. Each one waiting in the bin costs you -1 every turn (working capital on a shelf).',
      'scene1.s3.title': 'THREE LEVERS.',
      'scene1.s3.body': 'RUN = produce now (+3, but risk a breakdown). ORDER = buy a spare (-2, earns nothing this turn). REPLACE = swap in a fresh part (planned, cost 0). REPLACE is greyed out with an empty bin.',
      'scene1.s4.title': 'THE FAILURE DIE.',
      'scene1.s4.body': 'When you RUN, the world rolls this die: 0% red HEALTHY, 30% AGING, 70% FAILING. You pick the odds you walk into; the world rolls.',
      'scene1.s5.title': 'THE ONE RULE THAT MATTERS.',
      'scene1.s5.body': 'If the die comes up FAIL, what happens depends entirely on your bin:',

      'scene1.swap.title': 'A FAILURE: spare in hand vs empty bin',
      'scene1.swap.withTitle': 'FAIL with a SPARE',
      'scene1.swap.withOut': 'auto-swap → HEALTHY, cost -3 (rushed). You survive.',
      'scene1.swap.withoutTitle': 'FAIL with an EMPTY bin',
      'scene1.swap.withoutOut': 'WAITING FOR PART → line down, cost -8. The bad quarter.',
    },
    jp: {
      'scene1.title': 'あそびかた',
      'scene1.lede':  'まだ りろんは なし。 こうじょうちょうが すでに みている ダッシュボードだけ。',
      'scene1.turn':  'ターン',
      'scene1.die':   'こしょう リスク',
      'scene1.back':  'もどる',
      'scene1.next':  'つぎ',
      'scene1.done':  'プレイ ›',
      'scene1.step':  'ステップ {n} / {total}',

      'scene1.s0.title': 'じょうきょう。',
      'scene1.s0.body': 'すでに みている 2つの ゲージ： きかいの けんこうど と ビンの よびひん。 あわせて、 あなたが きめる じょうきょう。',
      'scene1.s1.title': 'けんこうど ゲージ。',
      'scene1.s1.body': 'けんこう → ろうきゅう → こしょうまえ。 ふるくなるほど こしょうダイスの あかい スライスが おおきくなる。',
      'scene1.s2.title': 'よびひん ビン。',
      'scene1.s2.body': 'よびひんは 0、 1、 2こ もてる。 ビンで まつ 1こ ごとに まいターン -1 (たなの うえの うんてん しほん)。',
      'scene1.s3.title': '3つの レバー。',
      'scene1.s3.body': 'うんてん = いま せいさん (+3、 でも こしょう リスク)。 はっちゅう = よびひんを かう (-2、 このターンは かせがない)。 こうかん = あたらしい ぶひんに かえる (けいかく、 ひよう 0)。 ビンが からだと こうかんは グレーアウト。',
      'scene1.s4.title': 'こしょう ダイス。',
      'scene1.s4.body': 'うんてん すると せかいが この ダイスを ふる： けんこう 0% あか、 ろうきゅう 30%、 こしょうまえ 70%。 はいる オッズを えらべるが、 ふるのは せかい。',
      'scene1.s5.title': 'いちばん だいじな ルール。',
      'scene1.s5.body': 'ダイスが こしょうに なったら、 なにが おきるかは ビンしだい：',

      'scene1.swap.title': 'こしょう： よびひん あり たい から',
      'scene1.swap.withTitle': 'よびひん ありで こしょう',
      'scene1.swap.withOut': 'じどう こうかん → けんこう、 ひよう -3 (いそぎ)。 たすかる。',
      'scene1.swap.withoutTitle': 'からの ビンで こしょう',
      'scene1.swap.withoutOut': 'ぶひん まち → ライン ていし、 ひよう -8。 わるい クォーター。',
    },
  });
})();

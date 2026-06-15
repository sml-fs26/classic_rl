/* scene3 i18n, formalization. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene3.title': 'What makes this an MDP?',
      'scene3.lede':  'The quarter you just played has four parts. Each one is something a manager already names.',
      'scene3.back':  'BACK',
      'scene3.next':  'NEXT',
      'scene3.done':  'POLICY ›',
      'scene3.step':  'part {n} / {total}',
      'scene3.framing': 'An MDP is just <b>situation → lever → (partly random) next situation + payoff</b>. That is the skeleton of every operational decision you make.',

      'scene3.s0.tag': 'THE FRAME',
      'scene3.s0.title': 'A four-part decision',
      'scene3.s0.body': 'State, action, transition, reward. We\'ll gloss each one in plain terms, then the maths.',
      'scene3.s1.tag': 'STATE  s',
      'scene3.s1.title': 'The situation now',
      'scene3.s1.body': '<em>The situation</em> = (machine health, spares in bin). Nine situations in all, a 3×3 grid.',
      'scene3.s2.tag': 'ACTION  a',
      'scene3.s2.title': 'The lever',
      'scene3.s2.body': '<em>The lever</em> = RUN, ORDER, or REPLACE. REPLACE is only on the menu when a spare is in the bin.',
      'scene3.s3.tag': 'TRANSITION  P',
      'scene3.s3.title': 'The part you don\'t control',
      'scene3.s3.body': '<em>The dice</em> = the failure die on RUN (its red slice grows with wear) plus the aging coin. ORDER and REPLACE are deterministic.',
      'scene3.s4.tag': 'REWARD  r',
      'scene3.s4.title': 'This turn\'s cash',
      'scene3.s4.body': '<em>The payoff</em> = +3 to run, -2 to order, -8 for downtime, -3 for a rushed swap, -1 per spare held. We add it up over time, discounted by γ = 0.9.',

      'scene3.diceTitle': 'RUN from AGING, one spare:',
      'scene3.brFail': 'FAIL → spare auto-swaps you back to HEALTHY (-3)',
      'scene3.brFine': 'RUNS FINE → +3, then a coin flip may age the machine',
    },
    jp: {
      'scene3.title': 'なぜ これが MDP なのか',
      'scene3.lede':  'いま あそんだ クォーターには 4つの ぶぶんが ある。 どれも マネージャーが すでに よんでいる もの。',
      'scene3.back':  'もどる',
      'scene3.next':  'つぎ',
      'scene3.done':  'ポリシー ›',
      'scene3.step':  'ぶぶん {n} / {total}',
      'scene3.framing': 'MDP は <b>じょうきょう → レバー → (いちぶ ランダムな) つぎの じょうきょう + ほうしゅう</b> だけ。 それが あなたの すべての ぎょうむ いしけっていの ほね。',

      'scene3.s0.tag': 'フレーム',
      'scene3.s0.title': '4つの ぶぶんの けってい',
      'scene3.s0.body': 'じょうたい、 こうどう、 せんい、 ほうしゅう。 まず ことばで、 つぎに すうしき。',
      'scene3.s1.tag': 'じょうたい  s',
      'scene3.s1.title': 'いまの じょうきょう',
      'scene3.s1.body': '<em>じょうきょう</em> = (きかいの けんこうど, ビンの よびひん)。 ぜんぶで 9つ、 3×3 の グリッド。',
      'scene3.s2.tag': 'こうどう  a',
      'scene3.s2.title': 'レバー',
      'scene3.s2.body': '<em>レバー</em> = うんてん、 はっちゅう、 こうかん。 こうかんは ビンに よびひんが ある ときだけ メニューに でる。',
      'scene3.s3.tag': 'せんい  P',
      'scene3.s3.title': 'せいぎょ できない ぶぶん',
      'scene3.s3.body': '<em>サイコロ</em> = うんてんの こしょうダイス (まもう とともに あかい スライスが ふえる) と ろうきゅうコイン。 はっちゅうと こうかんは かくてい。',
      'scene3.s4.tag': 'ほうしゅう  r',
      'scene3.s4.title': 'このターンの げんきん',
      'scene3.s4.body': '<em>ほうしゅう</em> = うんてん +3、 はっちゅう -2、 ダウンタイム -8、 いそぎ こうかん -3、 よびひん ほかん -1。 じかんで γ = 0.9 で わりびいて たしあげる。',

      'scene3.diceTitle': 'ろうきゅう・よびひん 1 から うんてん：',
      'scene3.brFail': 'こしょう → よびひんが じどうで けんこうに もどす (-3)',
      'scene3.brFine': 'せいじょう → +3、 そのあと コインで ろうきゅう するかも',
    },
  });
})();

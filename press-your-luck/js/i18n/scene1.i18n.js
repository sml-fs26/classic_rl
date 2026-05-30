/* i18n fragment for scene 1 - the tutorial (how to play). English is
   authoritative; the Japanese mirror uses Gen-1-era kana phrasing to match
   the bitmap font. Deep-merged via window.I18N.register. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene1.title': 'How to play',

      /* ---- chrome ---- */
      'tut.section': 'HOW TO PLAY',
      'tut.step_of': 'STEP {i} / {total}',
      'tut.skip': 'SKIP',
      'tut.skip_title': 'Skip the tutorial and play',
      'tut.go_to_play': 'GO PLAY',
      'tut.nav.hint': 'Use <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> to step through &middot; or click NEXT',

      /* ---- step 1: welcome ---- */
      'tut.welcome.title': 'The table',
      'tut.welcome.big': 'PRESS YOUR LUCK',
      'tut.welcome.small': 'Keep rolling to grow your pot - or BANK it before a 1 wipes it out.',
      'tut.welcome.dialog': 'Welcome to the table. Each turn you grow a POT of points by rolling a die. Bank it and it is yours for good - but roll a 1 and the whole pot vanishes. This little card is all you need to read the game.',

      /* ---- step 2: the pot meter ---- */
      'tut.pot.title': 'The pot meter',
      'tut.pot.dialog': 'On the left is your POT METER - the points riding on THIS turn but not yet safe. Every roll stacks it higher. Once it climbs past 20 it glows red: a juicy pot, but a tempting target for a bust.',
      'tut.pot.callout': 'POT - riding this turn, not yet banked',
      'tut.pot.danger': 'past 20: the danger band',

      /* ---- step 3: the standing badge ---- */
      'tut.stand.title': 'The standing badge',
      'tut.stand.dialog': 'On the right is the STANDING BADGE - your banked score against the rival. Cool blue when you trail (BEHIND), grey when level (EVEN), green when you lead (AHEAD). First to the target wins.',
      'tut.stand.behind': 'BEHIND - you trail',
      'tut.stand.even': 'EVEN - dead level',
      'tut.stand.ahead': 'AHEAD - you lead',

      /* ---- step 4: levers + die ---- */
      'tut.levers.title': 'Two levers, one die',
      'tut.levers.dialog': 'Each turn you pull ONE lever. ROLL the die to grow the pot (risk it for more); HOLD to bank the pot into your score and end your turn safely. The die is the part you do NOT control - each face is a flat 1 in 6.',
      'tut.levers.roll_sub': 'risk it for more',
      'tut.levers.hold_sub': 'bank it, end turn',
      'tut.levers.die': 'THE DIE - 1 in 6 each face',

      /* ---- step 5: the demo turn ---- */
      'tut.demo.title': 'One turn, start to finish',
      'tut.demo.intro': 'Watch one full turn: ROLL builds the pot... until a 1 wipes it. Then a clean turn that ends on HOLD.',
      'tut.demo.dialog.intro': 'Let me play a turn for you. Watch the pot meter - and watch what a 1 does.',
      'tut.demo.dialog.roll4': 'ROLL... a 4! The pot climbs to 4.',
      'tut.demo.dialog.roll6': 'ROLL again... a 6! The pot is up to 10 now.',
      'tut.demo.dialog.roll1': 'ROLL once more... a 1! BUST - the whole pot is gone and the turn ends.',
      'tut.demo.dialog.reset': 'New turn. This time we quit while we are ahead.',
      'tut.demo.dialog.roll5': 'ROLL... a 5. The pot is 5.',
      'tut.demo.dialog.roll3': 'ROLL... a 3. The pot is 8 - a tidy little stack.',
      'tut.demo.dialog.hold': 'HOLD! We BANK the 8 - locked into our score for good. That is the whole game.',
      'tut.demo.btn.play': 'PLAY THE TURN',
      'tut.demo.btn.replay': 'REPLAY',
      'tut.demo.bank_label': 'BANKED',
      'tut.demo.takeaway': 'That is it: ROLL to grow the pot, HOLD to lock it in - and a 1 is always lurking. Next, you take the controls.'
    },
    jp: {
      'scene1.title': 'あそびかた',

      /* ---- chrome ---- */
      'tut.section': 'あそびかた',
      'tut.step_of': 'ステップ {i} / {total}',
      'tut.skip': 'スキップ',
      'tut.skip_title': 'チュートリアルを とばして プレイ',
      'tut.go_to_play': 'プレイへ',
      'tut.nav.hint': '<kbd>&larr;</kbd> / <kbd>&rarr;</kbd> で すすむ &middot; または NEXT',

      /* ---- step 1: welcome ---- */
      'tut.welcome.title': 'テーブル',
      'tut.welcome.big': 'プレス ユア ラック',
      'tut.welcome.small': 'ポットを ふやしつづけるか - 1が でて きえるまえに バンクするか。',
      'tut.welcome.dialog': 'テーブルへ ようこそ。 まいターン、 サイコロを ふって ポット（とくてん）を ふやす。 バンクすれば じぶんの もの - でも 1が でると ポットは ぜんぶ きえる。 この カードだけで ゲームが よめる。',

      /* ---- step 2: the pot meter ---- */
      'tut.pot.title': 'ポット メーター',
      'tut.pot.dialog': 'ひだりが ポット メーター - この ターンに かかった、 まだ あんぜんでない とくてん。 ふるたびに たかく つもる。 20を こえると あかく ひかる: おおきい ポットだが、 バストの えじき。',
      'tut.pot.callout': 'ポット - この ターン、 まだ バンクまえ',
      'tut.pot.danger': '20ごえ: きけんゾーン',

      /* ---- step 3: the standing badge ---- */
      'tut.stand.title': 'たちば バッジ',
      'tut.stand.dialog': 'みぎが たちば バッジ - あなたの バンクずみ とくてん 対 あいて。 おくれて いると あお（おくれ）、 ごかくで グレー（ごかく）、 リードで みどり（リード）。 さきに もくひょうで かち。',
      'tut.stand.behind': 'おくれ - まけて いる',
      'tut.stand.even': 'ごかく - どうてん',
      'tut.stand.ahead': 'リード - かって いる',

      /* ---- step 4: levers + die ---- */
      'tut.levers.title': 'レバー ふたつ、 サイコロ ひとつ',
      'tut.levers.dialog': 'まいターン レバーを ひとつ ひく。 ふる（ROLL）で ポットを ふやす（リスクを とる）; キープ（HOLD）で ポットを とくてんに バンクして あんぜんに ターンしゅうりょう。 サイコロは コントロールできない ぶぶん - どの めも 6ぶんの1。',
      'tut.levers.roll_sub': 'リスクを とって ふやす',
      'tut.levers.hold_sub': 'バンクして しゅうりょう',
      'tut.levers.die': 'サイコロ - どの めも 6ぶんの1',

      /* ---- step 5: the demo turn ---- */
      'tut.demo.title': '1ターン、 さいしょから さいごまで',
      'tut.demo.intro': '1ターンを みて: ROLLで ポットが そだつ... 1が でるまで。 つぎに HOLDで おわる きれいな ターン。',
      'tut.demo.dialog.intro': '1ターン やって みせる。 ポット メーターを みて - そして 1が なにを するか みて。',
      'tut.demo.dialog.roll4': 'ROLL... 4! ポットが 4に。',
      'tut.demo.dialog.roll6': 'もういちど ROLL... 6! ポットは いま 10。',
      'tut.demo.dialog.roll1': 'もう1かい ROLL... 1! バスト - ポットは ぜんぶ きえ、 ターンしゅうりょう。',
      'tut.demo.dialog.reset': 'あたらしい ターン。 こんどは リードの うちに やめる。',
      'tut.demo.dialog.roll5': 'ROLL... 5。 ポットは 5。',
      'tut.demo.dialog.roll3': 'ROLL... 3。 ポットは 8 - いい かんじの やま。',
      'tut.demo.dialog.hold': 'HOLD! 8を バンク - とくてんに しっかり ロック。 これが ゲームの ぜんぶ。',
      'tut.demo.btn.play': 'ターンを プレイ',
      'tut.demo.btn.replay': 'リプレイ',
      'tut.demo.bank_label': 'バンクずみ',
      'tut.demo.takeaway': 'これだけ: ROLLで ポットを ふやし、 HOLDで ロック - そして 1は いつも ひそんで いる。 つぎは あなたの ばん。'
    }
  });
})();

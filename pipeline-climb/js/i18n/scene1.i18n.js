/* i18n fragment for Scene 1 (Tutorial) - Pipeline Climb.
 * Registers this scene's strings into the shared store. English is
 * authoritative; jp falls back to en, then to the literal key. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene1.blurb': 'Tutorial: the ladder, the three levers, the STAGE DIE, and the two endings.',

      /* chrome */
      'tut.step_of':         'STEP {i} / {total}',
      'tut.skip':            'SKIP TUTORIAL',
      'tut.go_to_playtest':  'GO TO PLAYTEST',
      'tut.page.prev':       'BACK',
      'tut.page.next':       'NEXT',
      'tut.nav.hint':        'Use ← → to step through the panels.',

      /* panel 1: the ladder */
      'tut.step.ladder.title':  'The ladder',
      'tut.step.ladder.dialog': 'This is your lead. It sits on one of five rungs, from COLD at the bottom to READY at the top. The rung is the situation right now: how warm the deal is. The warmth bar climbs cold-blue to hot-red as the lead heats up.',
      'tut.ladder.top':         'hot: ready to sign',
      'tut.ladder.bot':         'cold: just a name',
      'tut.ladder.warmth':      'warmth',

      /* panel 2: the levers */
      'tut.step.levers.title':  'Your three levers',
      'tut.step.levers.dialog': 'These three buttons are all you get. NURTURE is a soft touch, DEMO books the call, HARD CLOSE sends the contract. Each one is a touch, and every touch costs you a unit of rep time: -1. Pushing harder is not always better.',
      'tut.lever.nurture':      'soft touch: send content',
      'tut.lever.demo':         'book the call, show value',
      'tut.lever.hardclose':    'send the contract',
      'tut.levers.axis.l':      'softer',
      'tut.levers.axis.r':      'more aggressive',

      /* panel 3: the die + endings */
      'tut.step.die.title':     'The STAGE DIE',
      'tut.step.die.dialog': 'You pick the lever; the STAGE DIE decides how the lead reacts. It lands UP a rung, STAY, or DOWN a rung. Press ROLL to watch one land. A deal ends one of two ways: a signature, or the lead drops out.',
      'tut.die.roll':           'ROLL',
      'tut.die.signed':         'deal won: a signature',
      'tut.die.lost':           'lead dropped out',
    },
    jp: {
      'scene1.blurb': 'チュートリアル: ラダー、3つのレバー、ステージダイ、そして2つの けつまつ。',

      'tut.step_of':         'ステップ {i} / {total}',
      'tut.skip':            'スキップ',
      'tut.go_to_playtest':  'プレイテストへ',
      'tut.page.prev':       'もどる',
      'tut.page.next':       'つぎ',
      'tut.nav.hint':        '← → で パネルを すすむ。',

      'tut.step.ladder.title':  'ラダー',
      'tut.step.ladder.dialog': 'これが あなたの リード。 5つの ステージの どれかに いる。 したの コールドから うえの じゅんびまで。 ステージは いまの じょうきょう、 とりひきの あつさ。 ウォームバーは あおから あかへ のぼる。',
      'tut.ladder.top':         'あつい: サインへ',
      'tut.ladder.bot':         'つめたい: ただの なまえ',
      'tut.ladder.warmth':      'ウォーム',

      'tut.step.levers.title':  '3つの レバー',
      'tut.step.levers.dialog': 'この 3つの ボタンが すべて。 ナーチャーは ソフトな タッチ、 デモは コールを よやく、 ハードクローズは けいやくを おくる。 どれも 1タッチで、 タッチごとに じかんが かかる: -1。 つよく おすのが いつも いいとは かぎらない。',
      'tut.lever.nurture':      'ソフトタッチ: コンテンツ',
      'tut.lever.demo':         'コールを よやく',
      'tut.lever.hardclose':    'けいやくを おくる',
      'tut.levers.axis.l':      'ソフト',
      'tut.levers.axis.r':      'アグレッシブ',

      'tut.step.die.title':     'ステージ ダイ',
      'tut.step.die.dialog': 'レバーは あなたが えらぶ。 リードの はんのうは ステージダイが きめる。 アップ、 ステイ、 ダウンの どれかに とまる。 ロールで ひとつ みてみよう。 とりひきは 2つの けつまつ: サイン、 または ドロップアウト。',
      'tut.die.roll':           'ロール',
      'tut.die.signed':         'とりひき せいりつ: サイン',
      'tut.die.lost':           'リード だつらく',
    },
  });
})();

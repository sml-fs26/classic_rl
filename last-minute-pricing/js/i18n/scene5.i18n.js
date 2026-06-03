/* scene5 (The trajectory) i18n fragment.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene5.title': 'The trajectory',

      'scene5.lede':
        'You ran one quarter of selling, move by move. Written down, that ' +
        'whole run is a <b>trajectory</b>: the situation you were in, the ' +
        'lever you pulled, the cash it brought, then the next situation, all ' +
        'the way to the gate closing.',

      'scene5.formula.label': 'A RUN, WRITTEN DOWN',
      'scene5.formula.foot':
        'Capital letters: every entry was a roll of the dice <i>before</i> it ' +
        'happened. Same playbook, same opening, yet a different run each time.',
      'scene5.tree.foot': 'One trajectory = one path through the tree.',

      /* tree caption + tape column labels */
      'scene5.tree.caption':
        'The tree of all runs from a fixed opening &mdash; <b>{u} seats, {d} days</b>, ' +
        'pulling <b>{lever}</b>. It branches only on the <b>demand draw</b>; each ' +
        'leaf is a real ending (FULL FLIGHT or GATE CLOSED) carrying its run total G.',
      'scene5.col.situation': 'SITUATION',
      'scene5.col.lever':     'LEVER',
      'scene5.col.cash':      'CASH',

      'scene5.start':    'OPENING: {u} seats, {d} days',
      'scene5.midnight': 'GATE CLOSED',
      'scene5.atmidnight':'reached departure',
      'scene5.soldout':  'FULL FLIGHT',
      'scene5.leftover': '{n} seats left, worth $0',
      'scene5.cleared':  'flight sold out',

      /* derived tape strip (the lit path as the old S,A,R tape) */
      'scene5.derived.label': 'THE LIT PATH, AS A TAPE',
      'scene5.derived.empty': 'press PLAY A RUN to sample one path through the tree',
      'scene5.derived.g':     'run total G = {g}',

      /* controls */
      'scene5.btn.sample': 'PLAY A RUN ⟳',
      'scene5.btn.step':   'NEXT DAY ▶',
      'scene5.btn.reset':  'CLEAR',

      'scene5.status.hint': 'PLAY A RUN samples one path; NEXT DAY walks it day by day.',
      'scene5.status.run':  'one sampled run, lit as a single root-to-leaf path.',
      'scene5.status.walk': 'walking the path one day at a time…',

      'scene5.same.note':
        'Same playbook π, same opening, yet a <b>different path</b> each time. ' +
        'The flat tape is just one route through this tree.',
    },
    jp: {
      'scene5.title': 'トラジェクトリ',

      'scene5.lede':
        'はんきの はんばいを 1かい、 ' +
        'てを すすめながら やってみました。 ' +
        'かきとめると その いちれんが ' +
        '<b>トラジェクトリ</b> です： じょうきょう、 ' +
        'ひいた レバー、 はいった おかね、 ' +
        'つぎの じょうきょう、 ゲートが しまる まで。',

      'scene5.formula.label': 'かきとめた 1かいの ラン',
      'scene5.formula.foot':
        'おおもじ： どの こうも、 おこる ' +
        '<i>まえ</i> は サイコロの けっか でした。 ' +
        'おなじ ほうさく、 おなじ スタート でも、 ' +
        'まいかい ちがう ラン に なります。',
      'scene5.tree.foot': '1つの トラジェクトリ ＝ きの 1つの みち。',

      'scene5.tree.caption':
        'きまった スタート（<b>{u}せき・{d}にち</b>、 <b>{lever}</b> を ひく）からの ' +
        'すべての ランの き。 わかれるのは <b>じゅようの ひき</b> だけ。 ' +
        'はっぱは ほんものの おわり（まんせき か ゲートクローズ）で、 その ランの ごうけい G を もつ。',
      'scene5.col.situation': 'じょうきょう',
      'scene5.col.lever':     'レバー',
      'scene5.col.cash':      'うりあげ',

      'scene5.start':    'スタート： {u}せき, {d}にち',
      'scene5.midnight': 'ゲートクローズ',
      'scene5.atmidnight':'しゅっぱつ した',
      'scene5.soldout':  'まんせき',
      'scene5.leftover': 'のこり {n}せき, $0',
      'scene5.cleared':  'まんせき',

      'scene5.derived.label': 'ひかった みち を テープ で',
      'scene5.derived.empty': '「ランを みる」 で きの みちを 1つ サンプリング',
      'scene5.derived.g':     'ランの ごうけい G = {g}',

      'scene5.btn.sample': 'ランを みる ⟳',
      'scene5.btn.step':   'つぎの ひ ▶',
      'scene5.btn.reset':  'クリア',

      'scene5.status.hint': '「ランを みる」で みちを 1つ サンプリング、「つぎの ひ」で 1にち ずつ あるく。',
      'scene5.status.run':  'サンプリングした 1つの ラン。 ねもとから はっぱへの 1つの みち。',
      'scene5.status.walk': 'みちを 1にち ずつ あるいて います…',

      'scene5.same.note':
        'おなじ ほうさく π、 おなじ スタート でも、 まいかい <b>ちがう みち</b>。 ' +
        'たいらな テープは この きを とおる 1つの ルート に すぎません。',
    },
  });
})();

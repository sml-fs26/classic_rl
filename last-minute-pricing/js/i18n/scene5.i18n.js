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
        'the way to midnight.',

      'scene5.formula.label': 'A RUN, WRITTEN DOWN',
      'scene5.formula.foot':
        'Capital letters: every entry was a roll of the dice <i>before</i> it ' +
        'happened. Same playbook, same opening, yet a different run each time.',

      /* tape column labels */
      'scene5.col.situation': 'SITUATION',
      'scene5.col.lever':     'LEVER',
      'scene5.col.cash':      'CASH',

      'scene5.start':    'OPENING: {u} units, {d} days',
      'scene5.midnight': 'MIDNIGHT',
      'scene5.soldout':  'SOLD OUT',
      'scene5.leftover': '{n} left, worth $0',
      'scene5.cleared':  'shelf cleared',

      /* the running revenue HUD */
      'scene5.revenue.label': 'REVENUE THIS RUN',

      /* controls */
      'scene5.btn.step':  'NEXT DAY ▶',
      'scene5.btn.run':   'PLAY NEW RUN ⟳',
      'scene5.btn.reset': 'CLEAR',

      'scene5.status.day':   'DAY',
      'scene5.status.now':   'NOW: {u} units, {d} days',
      'scene5.status.done':  'run complete',
      'scene5.status.ready': 'press NEXT DAY to roll the demand',

      'scene5.same.note':
        'Same playbook π, same opening (5 units, 4 days). Play it again: ' +
        'the demand cards fall differently, so the trajectory τ differs.',
    },
    jp: {
      'scene5.title': 'トラジェクトリ',

      'scene5.lede':
        'はんきの はんばいを 1かい、 ' +
        'てを すすめながら やってみました。 ' +
        'かきとめると その いちれんが ' +
        '<b>トラジェクトリ</b> です： じょうきょう、 ' +
        'ひいた レバー、 はいった おかね、 ' +
        'つぎの じょうきょう、 まよなか まで。',

      'scene5.formula.label': 'かきとめた 1かいの ラン',
      'scene5.formula.foot':
        'おおもじ： どの こうも、 おこる ' +
        '<i>まえ</i> は サイコロの けっか でした。 ' +
        'おなじ ほうさく、 おなじ スタート でも、 ' +
        'まいかい ちがう ラン に なります。',

      'scene5.col.situation': 'じょうきょう',
      'scene5.col.lever':     'レバー',
      'scene5.col.cash':      'うりあげ',

      'scene5.start':    'スタート： {u}こ, {d}にち',
      'scene5.midnight': 'まよなか',
      'scene5.soldout':  'うりきれ',
      'scene5.leftover': 'のこり {n}こ, $0',
      'scene5.cleared':  'うりきり',

      'scene5.revenue.label': 'この ランの うりあげ',

      'scene5.btn.step':  'つぎの ひ ▶',
      'scene5.btn.run':   'べつの ランを みる ⟳',
      'scene5.btn.reset': 'クリア',

      'scene5.status.day':   'ひ',
      'scene5.status.now':   'いま： {u}こ, {d}にち',
      'scene5.status.done':  'ラン しゅうりょう',
      'scene5.status.ready': 'つぎの ひ で じゅようを ひく',

      'scene5.same.note':
        'おなじ ほうさく π、 おなじ スタート' +
        '（5こ・4にち）。 もういちど やると ' +
        'じゅようの カードの でかたが ちがい、 ' +
        'トラジェクトリ τ も かわります。',
    },
  });
})();

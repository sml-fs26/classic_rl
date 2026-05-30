/* scene2 i18n fragment -- PLAYTEST ("You run the shelf").
   The learner IS the pricing manager: from a fresh shelf (5 units, 4 days)
   they pull a price lever each day, flip demand, feel the outcome, and play
   to the deadline. English authoritative; Japanese mirror for parity. */
(function () {
  window.I18N.register({
    en: {
      'scene2.title': 'You run the shelf',

      'scene2.section':  'YOU RUN THE SHELF',
      'scene2.caption':  'Pull a price tag each day. The demand draw decides how many sell. Play to the deadline; leftovers crumble to $0 at midnight.',

      /* board / HUD labels */
      'scene2.today':       'TODAY',
      'scene2.revenue':     'REVENUE SO FAR',
      'scene2.dayOf':       'DAY {n}',
      'scene2.pickPrompt':  'PULL A PRICE TAG FOR TODAY',
      'scene2.perUnit':     '/unit',
      'scene2.restart':     'RESTART',
      'scene2.tapeLabel':   'YOUR RUN',
      'scene2.tapeTotal':   '= ${total}',
      'scene2.tapeStart':   'pull a tag to begin',

      /* per-step messages (the dialog narrates the day) */
      'scene2.msg.start':    'A fresh shelf: 5 units, 4 days. Pull a price tag for day 1.',
      'scene2.msg.flipping': 'Demand draw for {lever} (${price})...',
      'scene2.msg.sold':     'Sold {sold} at ${price}. Collected +${rev}.',
      'scene2.msg.none':     'Nobody bought today. ${price} was too steep for this draw.',
      'scene2.msg.capped':   'Only {sold} left to sell, so you banked +${rev}.',
      'scene2.msg.nextDay':  'On to day {n}: {u} units, {d} days left. Pull again.',
      'scene2.msg.soldout':  'SOLD OUT! Shelf cleared with time to spare, the best finish.',
      'scene2.msg.deadline.clean': 'MIDNIGHT. Shelf empty, nothing wasted.',
      'scene2.msg.deadline.left':  'MIDNIGHT. {u} unit(s) left, and they just crumbled to $0.',

      /* end-of-run summary */
      'scene2.end.title':       'RUN OVER',
      'scene2.end.revenue':     'TOTAL REVENUE',
      'scene2.end.soldout':     'You cleared the shelf, every unit sold.',
      'scene2.end.wasted':      '{u} unit(s) expired worthless at midnight.',
      'scene2.end.again':       'PLAY AGAIN',
      'scene2.end.hint':        'Same shelf, different luck: two runs rarely end the same. Notice you were already following SOME rule. Hold that thought.',
    },
    jp: {
      'scene2.title': 'たなを うごかす',

      'scene2.section':  'たなを うごかす',
      'scene2.caption':  'まいにち ねふだを ひく。 じゅようの ちゅうせんが はんばいすうを きめる。 しめきりまで プレイ。 のこりは まよなかに $0。',

      'scene2.today':       'きょう',
      'scene2.revenue':     'これまでの うりあげ',
      'scene2.dayOf':       '{n}にちめ',
      'scene2.pickPrompt':  'きょうの ねふだを ひく',
      'scene2.perUnit':     '/こ',
      'scene2.restart':     'リスタート',
      'scene2.tapeLabel':   'あなたの きろく',
      'scene2.tapeTotal':   '= ${total}',
      'scene2.tapeStart':   'ふだを ひいて かいし',

      'scene2.msg.start':    'あたらしい たな: 5こ、 4にち。 1にちめの ねふだを ひく。',
      'scene2.msg.flipping': '{lever} (${price}) の じゅよう ちゅうせん…',
      'scene2.msg.sold':     '${price} で {sold}こ うれた。 +${rev} かくとく。',
      'scene2.msg.none':     'きょうは うれず。 この ちゅうせんに ${price} は たかすぎた。',
      'scene2.msg.capped':   'のこり {sold}こ だけ うれて、 +${rev} かくとく。',
      'scene2.msg.nextDay':  '{n}にちめへ: のこり {u}こ、 {d}にち。 また ひく。',
      'scene2.msg.soldout':  'うりきれ！ じかんを のこして たなを はいた。 さいこうの フィニッシュ。',
      'scene2.msg.deadline.clean': 'まよなか。 たな から、 むだ なし。',
      'scene2.msg.deadline.left':  'まよなか。 {u}こ のこり、 たった いま $0 に なった。',

      'scene2.end.title':       'しゅうりょう',
      'scene2.end.revenue':     'うりあげ ごうけい',
      'scene2.end.soldout':     'たなを はいた。 ぜんぶ うれた。',
      'scene2.end.wasted':      '{u}こ が まよなかに ねうち ゼロ。',
      'scene2.end.again':       'もういちど',
      'scene2.end.hint':        'おなじ たな、 ちがう うん: 2かいの きろくは めったに おなじに ならない。 あなたは すでに なにかの ルールに したがっていた。 おぼえておいて。',
    },
  });
})();

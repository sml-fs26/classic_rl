/* scene2 i18n fragment -- PLAYTEST ("You run the cabin").
   The learner IS the pricing manager: from a fresh cabin (5 seats, 4 days)
   they pull a price lever each day, flip demand, feel the outcome, and play
   to departure. English authoritative; Japanese mirror for parity. */
(function () {
  window.I18N.register({
    en: {
      'scene2.title': 'You run the cabin',

      'scene2.section':  'YOU RUN THE CABIN',
      'scene2.caption':  'Pull a price tag each day. The demand draw decides how many sell. Play to departure; unsold seats fly empty for $0 once the gate closes.',

      /* board / HUD labels */
      'scene2.today':       'TODAY',
      'scene2.revenue':     'REVENUE SO FAR',
      'scene2.dayOf':       'DAY {n}',
      'scene2.pickPrompt':  'PULL A PRICE TAG FOR TODAY',
      'scene2.perUnit':     '/seat',
      'scene2.restart':     'RESTART',
      'scene2.tapeLabel':   'YOUR RUN',
      'scene2.tapeTotal':   '= ${total}',
      'scene2.tapeStart':   'pull a tag to begin',

      /* per-step messages (the dialog narrates the day) */
      'scene2.msg.start':    'A fresh cabin: 5 seats, 4 days. Pull a price tag for day 1.',
      'scene2.msg.flipping': 'Demand draw for {lever} (${price})...',
      'scene2.msg.sold':     'Sold {sold} at ${price}. Collected +${rev}.',
      'scene2.msg.none':     'Nobody bought today. ${price} was too steep for this draw.',
      'scene2.msg.capped':   'Only {sold} left to sell, so you banked +${rev}.',
      'scene2.msg.nextDay':  'On to day {n}: {u} seats, {d} days left. Pull again.',
      'scene2.msg.soldout':  'FULL FLIGHT! Cabin cleared with time to spare, the best finish.',
      'scene2.msg.deadline.clean': 'GATE CLOSED. Cabin empty, nothing wasted.',
      'scene2.msg.deadline.left':  'GATE CLOSED. {u} seat(s) left, and they just flew empty for $0.',

      /* end-of-run summary */
      'scene2.end.title':       'RUN OVER',
      'scene2.end.revenue':     'TOTAL REVENUE',
      'scene2.end.soldout':     'You filled the cabin, every seat sold.',
      'scene2.end.wasted':      '{u} seat(s) departed worthless once the gate closed.',
      'scene2.end.again':       'PLAY AGAIN',
      'scene2.end.hint':        'Same cabin, different luck: two runs rarely end the same. Notice you were already following SOME rule. Hold that thought.',
    },
    jp: {
      'scene2.title': 'きゃくしつを うごかす',

      'scene2.section':  'きゃくしつを うごかす',
      'scene2.caption':  'まいにち ねふだを ひく。 じゅようの ちゅうせんが はんばいすうを きめる。 しゅっぱつまで プレイ。 のこった ざせきは ゲートが しまると $0。',

      'scene2.today':       'きょう',
      'scene2.revenue':     'これまでの うりあげ',
      'scene2.dayOf':       '{n}にちめ',
      'scene2.pickPrompt':  'きょうの ねふだを ひく',
      'scene2.perUnit':     '/せき',
      'scene2.restart':     'リスタート',
      'scene2.tapeLabel':   'あなたの きろく',
      'scene2.tapeTotal':   '= ${total}',
      'scene2.tapeStart':   'ふだを ひいて かいし',

      'scene2.msg.start':    'あたらしい きゃくしつ: 5せき、 4にち。 1にちめの ねふだを ひく。',
      'scene2.msg.flipping': '{lever} (${price}) の じゅよう ちゅうせん…',
      'scene2.msg.sold':     '${price} で {sold}せき うれた。 +${rev} かくとく。',
      'scene2.msg.none':     'きょうは うれず。 この ちゅうせんに ${price} は たかすぎた。',
      'scene2.msg.capped':   'のこり {sold}せき だけ うれて、 +${rev} かくとく。',
      'scene2.msg.nextDay':  '{n}にちめへ: のこり {u}せき、 {d}にち。 また ひく。',
      'scene2.msg.soldout':  'まんせき！ じかんを のこして きゃくしつを うめた。 さいこうの フィニッシュ。',
      'scene2.msg.deadline.clean': 'ゲートクローズ。 きゃくしつ から、 むだ なし。',
      'scene2.msg.deadline.left':  'ゲートクローズ。 {u}せき のこり、 たった いま $0 で からのまま しゅっぱつ。',

      'scene2.end.title':       'しゅうりょう',
      'scene2.end.revenue':     'うりあげ ごうけい',
      'scene2.end.soldout':     'きゃくしつを うめた。 ぜんぶ うれた。',
      'scene2.end.wasted':      '{u}せき が ゲートクローズで ねうち ゼロ。',
      'scene2.end.again':       'もういちど',
      'scene2.end.hint':        'おなじ きゃくしつ、 ちがう うん: 2かいの きろくは めったに おなじに ならない。 あなたは すでに なにかの ルールに したがっていた。 おぼえておいて。',
    },
  });
})();

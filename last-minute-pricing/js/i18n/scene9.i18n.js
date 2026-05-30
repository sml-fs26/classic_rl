/* scene9 i18n fragment -- "Fill Q* by dynamic programming".
   Because the demand odds are known, we sweep the Bellman backup column by
   column, right (d=1) to left (d=4), converging in exactly 4 sweeps; the
   optimal-lever overlay paints the three coloured regions + the diagonal seam.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene9.title': "Fill Q* by dynamic programming",

      /* manager-first lede + premise */
      'scene9.lede':
        'If you had a <b>perfect demand model</b>, you could compute the entire optimal ' +
        'playbook for every situation, exactly, no guessing. Watch the revenue-management ' +
        'surface draw itself.',
      'scene9.premise':
        'The demand odds are <b>printed on every lever</b>, so we know P. That is the gift ' +
        'that makes this possible. We sweep the Bellman backup one day-column at a time, ' +
        'from the deadline <b>backward</b>.',

      /* Bellman card label */
      'scene9.formula.label': 'WE KNOW P, SO WE SWEEP THIS BACKUP',

      /* controls */
      'scene9.btn.step':  'STEP COLUMN',
      'scene9.btn.run':   'RUN ALL',
      'scene9.btn.reset': 'RESET',
      'scene9.status.sweep':  'SWEEP',
      'scene9.status.filled': 'FILLED',

      /* side-panel narration, keyed by the day-column being filled */
      'scene9.ready.title': 'READY TO SWEEP',
      'scene9.ready.body':
        'Press STEP COLUMN to fill the deadline-adjacent day first. Each cell takes the ' +
        'best lever, given the columns already solved to its right.',

      'scene9.col.title': 'SWEEP {n} / 4 &middot; {d} DAY LEFT',
      'scene9.col.titlePlural': 'SWEEP {n} / 4 &middot; {d} DAYS LEFT',

      'scene9.col.d1':
        '<b>Last day.</b> Every tomorrow is the deadline ($0), so each cell is just ' +
        'price &times; expected units sold today. Full shelves cannot clear at a premium, ' +
        'so they go <b>FIRE-SALE</b>.',
      'scene9.col.d2':
        '<b>Two days left.</b> Each cell reuses the day-1 values to its right: sell some ' +
        'today, then carry the rest into a known tomorrow. <b>STANDARD</b> starts to win ' +
        'as the shelf thins.',
      'scene9.col.d3':
        '<b>Three days left.</b> More runway means more patience. A single scarce unit can ' +
        'now afford to hold out for a <b>PREMIUM</b> buyer.',
      'scene9.col.d4':
        '<b>Four days left.</b> The last sweep. The full board is now solved: three ' +
        'coloured regions with a diagonal seam, the revenue-management surface.',

      'scene9.done.title': 'CONVERGED IN 4 SWEEPS',
      'scene9.done.body':
        'Known P gives exact Q* by backward sweeps to a fixed point. The star moves ' +
        'across the board: <b>FIRE-SALE</b> when stock is high and time is short, ' +
        '<b>PREMIUM</b> when stock is scarce and time is long, <b>STANDARD</b> in the ' +
        'comfortable middle.',
      'scene9.done.counts': 'LEVER USAGE &middot; {fire} FIRE-SALE &middot; {std} STANDARD &middot; {prem} PREMIUM',

      /* bridge */
      'scene9.bridge':
        'Exact, but only because we owned the deck. Real demand is never printed, and the ' +
        'real board is far too big to sweep. So how does anyone find the playbook? Next.',
    },
    jp: {
      'scene9.title': "どうてきけいかくほうで Q* を うめる",

      'scene9.lede':
        '<b>かんぺきな じゅようモデル</b> が あれば、ぜんじょうきょうの さいてき プレイブックを ' +
        'せいかくに けいさんできる。すいそく なし。レベニューマネジメントの めんが えがかれるのを みよう。',
      'scene9.premise':
        'じゅようの かくりつが <b>どの レバーにも かいてある</b> ので P が わかる。これが ' +
        'できる りゆう。ベルマン バックアップを、しめきりから <b>うしろむき</b> に、にっすうの ' +
        'れつ ごとに すいそうする。',

      'scene9.formula.label': 'P が わかる ので この バックアップを すいそうする',

      'scene9.btn.step':  'れつを すすめる',
      'scene9.btn.run':   'ぜんぶ じっこう',
      'scene9.btn.reset': 'リセット',
      'scene9.status.sweep':  'スイープ',
      'scene9.status.filled': 'うめた',

      'scene9.ready.title': 'すいそう じゅんび',
      'scene9.ready.body':
        '「れつを すすめる」で しめきりに いちばん ちかい ひ から うめる。みぎに とけた ' +
        'れつを つかい、かくセルは さいてきな レバーを とる。',

      'scene9.col.title': 'スイープ {n} / 4 &middot; のこり {d}にち',
      'scene9.col.titlePlural': 'スイープ {n} / 4 &middot; のこり {d}にち',

      'scene9.col.d1':
        '<b>さいしゅうび。</b> あした すべてが しめきり（$0）なので、かくセルは かかく &times; ' +
        'きょう うれる きたい こすう だけ。ざいこ おおめでは プレミアムで さばけず、' +
        '<b>おおやすうり</b> になる。',
      'scene9.col.d2':
        '<b>のこり2にち。</b> かくセルは みぎの 1にち かちを さいりよう：きょう すこし うり、' +
        'のこりを わかっている あすへ もちこす。ざいこが へると <b>スタンダード</b> が ' +
        'かちはじめる。',
      'scene9.col.d3':
        '<b>のこり3にち。</b> よゆうが あると しんぼうできる。きちょうな 1こ なら ' +
        '<b>プレミアム</b> の かいてを まてる。',
      'scene9.col.d4':
        '<b>のこり4にち。</b> さいごの スイープ。ぜんばんが とけた：3つの いろの りょういきと ' +
        'たいかくせんの つぎめ、レベニューマネジメントの めん。',

      'scene9.done.title': '4スイープで しゅうそく',
      'scene9.done.body':
        'P が わかれば、うしろむきの スイープで せいかくな Q* が ふどうてんまで もとまる。' +
        'スターが ばんを うごく：ざいこ おおく じかん みじかい とき <b>おおやすうり</b>、' +
        'ざいこ すくなく じかん ながい とき <b>プレミアム</b>、まんなかは <b>スタンダード</b>。',
      'scene9.done.counts': 'レバーしようすう &middot; {fire} おおやすうり &middot; {std} スタンダード &middot; {prem} プレミアム',

      'scene9.bridge':
        'せいかく だが、デッキを もっていた からだけ。じっさいの じゅようは かかれず、' +
        'じっさいの ばんは すいそうには おおきすぎる。では どう プレイブックを みつける？つぎへ。',
    },
  });
})();

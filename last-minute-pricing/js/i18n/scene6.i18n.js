/* scene6 (Return to the deadline) i18n fragment.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene6.title': 'Return to the deadline',

      'scene6.lede':
        'Do not judge a lever by one good night. The <b>return</b> is the ' +
        'total cash a run brings in from a chosen point to the deadline, and ' +
        'it is a <b>random number</b>: run the same opening many times and the ' +
        'payoff lands all over a range.',

      'scene6.formula.label': 'RETURN FROM A POINT',
      'scene6.formula.foot':
        'The total revenue collected from day i onward, summed to midnight ' +
        '(no discount, the clock does the work). A different run gives a ' +
        'different G.',

      /* the trajectory-tree + weighted-leaf ledger (the heart of the scene) */
      'scene6.eg.label':
        'AVERAGE G OVER EVERY RUN &mdash; the tree from <b>{u} units, {d} days</b> ' +
        'pulling <b>{lever}</b>. Each leaf is a run; weight its total G by the ' +
        'path probability and sum:',
      'scene6.eg.tie':
        'That weighted sum is <b>E[G] = {eg}</b> &mdash; and it <b>is</b> ' +
        'Q*({u}u / {d}d, {lever}), the honest value of that lever here. ' +
        'G &rarr; E[G] &rarr; Q*, in one picture.',

      /* empirical companion (collapsible histogram of full-run returns) */
      'scene6.emp.title': 'SEE IT EMPIRICALLY',
      'scene6.emp.hint':  '(tap to expand)',
      'scene6.emp.explainer':
        'Play the same opening and playbook many times and stack each run&rsquo;s ' +
        'return G into a histogram. The running mean walks toward the tree&rsquo;s ' +
        'computed E[G] (the dashed target line).',
      'scene6.target':     'target E[G] = {target}',
      'scene6.target_tag': 'E[G] {target}',

      /* the fixed experiment setup */
      'scene6.setup.label': 'FIX ONE SITUATION AND ONE LEVER, THEN RUN IT MANY TIMES',
      'scene6.setup.from':  'FROM',
      'scene6.setup.pull':  'PULL',

      /* lever picker */
      'scene6.pick.label': 'LEVER:',

      /* histogram */
      'scene6.hist.title':  'WHERE THE RUN TOTAL G LANDS',
      'scene6.hist.x':      'run total G ($)',
      'scene6.hist.y':      'runs',
      'scene6.hist.empty':  'press RUN 50 RUNS to stack up returns',

      /* stats line */
      'scene6.stats':       '{n} runs · mean {mean} · range {lo} to {hi}',
      'scene6.stats.empty': 'no runs yet',
      'scene6.mean.tag':    'mean',

      /* controls */
      'scene6.btn.run':   'RUN 50 RUNS',
      'scene6.btn.reset': 'CLEAR',

      /* per-lever takeaways */
      'scene6.take.premium':
        'PREMIUM here is a coin-flip: one buyer at most, so the run brings $5 ' +
        'or, more often, nothing. High ceiling, lots of zeros.',
      'scene6.take.standard':
        'STANDARD clears a unit or two most nights: the return clusters in the ' +
        'middle, rarely zero, rarely high.',
      'scene6.take.firesale':
        'FIRE-SALE almost always moves stock before midnight: the return ' +
        'clusters higher and tighter. Lower ceiling, far less risk.',

      'scene6.spread.note':
        'Same situation, same lever, yet the payoff is a spread, not a single ' +
        'number. That spread is the risk you carry into the deadline.',
    },
    jp: {
      'scene6.title': 'しめきりまでの リターン',

      'scene6.lede':
        'レバーを 1かいの あたりで きめては いけません。 ' +
        '<b>リターン</b> は えらんだ じてんから しめきりまでに ' +
        'はいる うりあげの ごうけい で、 ' +
        '<b>ランダムな すうち</b> です： おなじ スタートを なんども ' +
        'やると、 もうけは ひろい はんいに ちらばります。',

      'scene6.formula.label': 'ある じてん からの リターン',
      'scene6.formula.foot':
        'i にちめ いこうに あつめた うりあげの ごうけい、 ' +
        'まよなか まで（わりびきなし、 とけいが やくわり）。 ' +
        'ランが ちがえば G も ちがいます。',

      'scene6.eg.label':
        'すべての ランでの G の へいきん &mdash; <b>{u}こ・{d}にち</b> で <b>{lever}</b> を ' +
        'ひく きの ぜんはっぱ。 はっぱ＝ラン、 その ごうけい G を みちの かくりつで おもみづけして たす：',
      'scene6.eg.tie':
        'その おもみづけ ごうけいが <b>E[G] = {eg}</b>。 これが ここでの ' +
        'Q*({u}こ / {d}にち, {lever})、 レバーの しょうじきな かち です。 ' +
        'G &rarr; E[G] &rarr; Q* が 1まいで。',

      'scene6.emp.title': 'じっけん で みる',
      'scene6.emp.hint':  '（タップで ひらく）',
      'scene6.emp.explainer':
        'おなじ スタートと ほうさくを なんども はしらせ、 かくランの リターン G を ' +
        'ヒストグラムに つみあげる。 はしるごとの へいきんは きが けいさんした E[G]' +
        '（てんせんの ターゲット）へ ちかづく。',
      'scene6.target':     'ターゲット E[G] = {target}',
      'scene6.target_tag': 'E[G] {target}',

      'scene6.setup.label': 'じょうきょうと レバーを 1つ ずつ きめ、 なんども はしらせる',
      'scene6.setup.from':  'スタート',
      'scene6.setup.pull':  'ひく',

      'scene6.pick.label': 'レバー：',

      'scene6.hist.title':  'ランの ごうけい G の ちらばり',
      'scene6.hist.x':      'ランの ごうけい G ($)',
      'scene6.hist.y':      'ラン すう',
      'scene6.hist.empty':  '「50ラン はしらせる」で リターンを つみあげる',

      'scene6.stats':       '{n} ラン · へいきん {mean} · はんい {lo}〜{hi}',
      'scene6.stats.empty': 'まだ ラン なし',
      'scene6.mean.tag':    'へいきん',

      'scene6.btn.run':   '50ラン はしらせる',
      'scene6.btn.reset': 'クリア',

      'scene6.take.premium':
        'ここでの プレミアム は コインの うらおもて： ' +
        'かい ては おおくて 1にん、 ランは $5 か、 ' +
        'おおくは ゼロ。 てんじょうは たかいが ゼロも おおい。',
      'scene6.take.standard':
        'スタンダード は たいてい 1〜2こ うれる： ' +
        'リターンは まんなかに あつまり、 ゼロも たかねも まれ。',
      'scene6.take.firesale':
        'おおやすうり は まよなか まえに ほぼ かならず ' +
        'うりさばく： リターンは たかめに かたく あつまる。 ' +
        'てんじょうは ひくいが リスクは ずっと ちいさい。',

      'scene6.spread.note':
        'おなじ じょうきょう、 おなじ レバー でも もうけは ' +
        'ひとつの すうちでは なく ちらばり です。 ' +
        'その ちらばりが しめきりへ もちこむ リスク です。',
    },
  });
})();

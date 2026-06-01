/* scene8 i18n fragment -- "Bellman: today vs tomorrow".
   The Bellman optimality equation as a formula card, read in plain English
   over the board, with a worked one-step backup on a last-day corner cell.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene8.title': "Bellman: today vs tomorrow",

      /* manager-first lede */
      'scene8.lede':
        'Smart pricing is <b>recursive</b>: the value of a lever today is the cash it pays ' +
        'now, plus the value of the situation it leaves you in tomorrow, when you again ' +
        'pull the best lever there.',

      /* formula card */
      'scene8.formula.label': 'BELLMAN OPTIMALITY EQUATION',

      /* the depth-1 backup tree (collapsible): backup = one-ply trajectory tree */
      'scene8.backup.title': 'THE BACKUP IS A DEPTH-1 TREE',
      'scene8.backup.hint':  '(tap to expand)',
      'scene8.backup.lead':
        'One day before the deadline at <b>2 units, 2 days</b>, the backup under ' +
        '<b>STANDARD</b> is just the demand fan. Each child carries today&rsquo;s ' +
        'cash <b>r</b> plus the value of where it lands, <b>r + V(s&prime;)</b> ' +
        '(dashed leaves bootstrap tomorrow&rsquo;s value):',
      'scene8.backup.tie':
        'The weighted leaf sum is <b>{eg}</b> = Q*({u}u / {d}d, {lever}) &mdash; ' +
        'the same value the trajectory tree gave two scenes ago. The Bellman ' +
        'backup IS the depth-1 trajectory tree.',

      /* the plain-English read of each piece of the equation */
      'scene8.read.title': 'READ IT LIKE A MANAGER',
      'scene8.read.lhs':   '<b>Q*(s, a)</b> &mdash; the honest long-run value of pulling lever <i>a</i> in situation <i>s</i>.',
      'scene8.read.r':     '<b>R</b> &mdash; the cash the lever pays you <i>today</i> (price &times; units sold).',
      'scene8.read.max':   '<b>max<sub>a&prime;</sub> Q*(S&prime;, a&prime;)</b> &mdash; the value of <i>tomorrow&rsquo;s</i> situation S&prime;, assuming you pull the best lever there.',
      'scene8.read.exp':   '<b>E[ &middot;&middot;&middot; ]</b> &mdash; averaged over the demand draw, the one thing you do not control.',

      /* worked-example panel */
      'scene8.worked.title':   'A WORKED BACKUP &middot; LAST DAY',
      'scene8.worked.subtitle':'{u} units left, {d} day to the deadline',
      'scene8.worked.lastday':
        'On the <b>last day</b> every tomorrow is the deadline, worth <b>$0</b>. ' +
        'So the future term vanishes and Q* is just the cash you expect <i>today</i>:',
      'scene8.worked.cardLabel': 'SITUATION',

      /* lever picker over the worked cell */
      'scene8.worked.pick': 'PICK A LEVER TO BACK UP:',

      /* the term-by-term breakdown for the chosen lever */
      'scene8.calc.headLever': 'LEVER',
      'scene8.calc.demandLabel': 'demand draw',
      'scene8.calc.term': '{p} &middot; demand {k} &rarr; sell {sold} &rarr; {price}&times;{sold} = {rev}',
      'scene8.calc.termCapped': '{p} &middot; demand {k} &rarr; sell {sold} (capped at {u}) &rarr; {price}&times;{sold} = {rev}',
      'scene8.calc.sumLabel': 'Q*(s, {lever}) = E[ R ]',
      'scene8.calc.total': '= {total}',
      'scene8.calc.future0': 'future = $0 (deadline)',

      /* verdict line under the calc */
      'scene8.verdict.best':  'On the last day with a full-ish shelf, <b>{lever}</b> wins: you cannot move stock at a premium, so dump it before midnight.',

      /* footer bridge to scene 9 */
      'scene8.bridge':
        'Today&rsquo;s value is <b>defined in terms of</b> tomorrow&rsquo;s. Because the demand ' +
        'odds are printed on every lever, we can chain these backups across the whole board next.',
    },
    jp: {
      'scene8.title': "ベルマン：きょう と あした",

      'scene8.lede':
        'かしこい プライシングは <b>さいきてき</b> です：きょうの レバーの かちは、いま もらえる ' +
        'げんきん ＋ あした おかれる じょうきょうの かち（そこでも さいてきな レバーを ひく）です。',

      'scene8.formula.label': 'ベルマン さいてき ほうていしき',

      'scene8.backup.title': 'バックアップ ＝ ふかさ1の き',
      'scene8.backup.hint':  '（タップで ひらく）',
      'scene8.backup.lead':
        'しめきり 1にちまえ、 <b>2こ・2にち</b> で <b>スタンダード</b> の ' +
        'バックアップは じゅようの ひろがり だけ。 かくこは きょうの げんきん <b>r</b> ＋ ' +
        'いきつく さきの かち、 つまり <b>r + V(s&prime;)</b>（てんせんの はっぱは ' +
        'あしたの かちを ブートストラップ）：',
      'scene8.backup.tie':
        'はっぱの おもみづけ ごうけいは <b>{eg}</b> ＝ Q*({u}こ / {d}にち, {lever})。 ' +
        '2シーンまえの トラジェクトリの きと おなじ あたい。 ベルマン バックアップは ' +
        'ふかさ1の トラジェクトリの き そのもの。',

      'scene8.read.title': 'マネージャー ふうに よむ',
      'scene8.read.lhs':   '<b>Q*(s, a)</b>：じょうきょう <i>s</i> で レバー <i>a</i> を ひく ちょうきの かち。',
      'scene8.read.r':     '<b>R</b>：レバーが <i>きょう</i> はらう げんきん（かかく &times; うれた こすう）。',
      'scene8.read.max':   '<b>max<sub>a&prime;</sub> Q*(S&prime;, a&prime;)</b>：<i>あした</i>の じょうきょう S&prime; の かち。そこでも さいてきな レバーを ひく。',
      'scene8.read.exp':   '<b>E[ &middot;&middot;&middot; ]</b>：じゅようの ひき（コントロールできない ゆいいつ）で へいきんを とる。',

      'scene8.worked.title':   'けいさんれい &middot; さいしゅうび',
      'scene8.worked.subtitle':'ざいこ {u}こ・しめきりまで {d}にち',
      'scene8.worked.lastday':
        '<b>さいしゅうび</b> は あした すべてが しめきり（<b>$0</b>）です。' +
        'だから みらいの こうは きえ、Q* は <i>きょう</i> きたいする げんきん だけ：',
      'scene8.worked.cardLabel': 'じょうきょう',

      'scene8.worked.pick': 'バックアップ する レバーを えらぶ：',

      'scene8.calc.headLever': 'レバー',
      'scene8.calc.demandLabel': 'じゅようの ひき',
      'scene8.calc.term': '{p} &middot; じゅよう {k} &rarr; {sold}こ うる &rarr; {price}&times;{sold} = {rev}',
      'scene8.calc.termCapped': '{p} &middot; じゅよう {k} &rarr; {sold}こ うる（{u}で うちどめ）&rarr; {price}&times;{sold} = {rev}',
      'scene8.calc.sumLabel': 'Q*(s, {lever}) = E[ R ]',
      'scene8.calc.total': '= {total}',
      'scene8.calc.future0': 'みらい = $0（しめきり）',

      'scene8.verdict.best':  'さいしゅうびに ざいこ おおめ なら <b>{lever}</b> が かち：プレミアムでは さばけないので、まよなか まえに さばく。',

      'scene8.bridge':
        'きょうの かちは <b>あしたの かちで ていぎ</b> される。じゅようの かくりつが ' +
        'どの レバーにも かいてある ので、ぜんばんで この バックアップを つなげられる。つぎへ。',
    },
  });
})();

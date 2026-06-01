/* i18n fragment for scene 6 (return G_t). English authoritative.
   Scene-local keys only; shared vocabulary lives in the i18n core. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title6': 'Return: the whole-horizon score',
      'scene6.hook':  'Sum the tape. From one situation and lever you get a distribution of payoffs.',

      'scene6.manager':
        'The payoff is not this month\'s discount line. It is the <b>total</b> over the ' +
        'whole renewal horizon: every lever cost, plus the one terminal lump. And from one ' +
        'playbook you do not get a number, you get a <b>distribution</b>.',

      'scene6.formula.label': 'THE RETURN IS THE SUM OF REWARDS FROM MONTH i ONWARD',
      'scene6.formula.foot':
        'No discount, so it is just addition: the lever costs you paid, plus <b>+20</b> if ' +
        'the account renewed or <b>−20</b> if it churned.',

      'scene6.eg.label':
        'Weigh every leaf by its probability: the trajectory tree for <b>{state}</b>, lever ' +
        '{lever}. The average return E[G<sub>t</sub>] is the sum of P(path)·G<sub>t</sub> down the ledger.',
      'scene6.eg.tie':
        'That weighted sum is <b>E[G<sub>t</sub>] = {eg}</b>, and it is exactly ' +
        '<b>Q*({state}, {lever})</b>: the average over all paths IS the value of the lever. ' +
        'G<sub>t</sub> → E[G<sub>t</sub>] → Q*, in one ledger.',

      'scene6.expansion.title': 'SUM ONE RUN INTO A SINGLE SCORE',
      'scene6.expansion.note':  'each rⱼ is a month\'s cost; the last folds in the terminal lump',
      'scene6.btn.resample':    '↻ ANOTHER RUN',

      'scene6.dist.title':    'RUN IT MANY TIMES: THE PAYOFF IS A DISTRIBUTION',
      'scene6.dist.playbook': 'PLAYBOOK (same every month):',

      'scene6.stats.empty':     'No runs yet. Press RUN to fill the histogram.',
      'scene6.stats.runs':      'runs',
      'scene6.stats.mean':      'mean return μ',
      'scene6.stats.target':    'target E[G] <b>{target}</b>',
      'scene6.stats.range':     'range',
      'scene6.stats.renewrate': 'renewal rate',

      'scene6.hist.empty':  'press RUN x20 to sample returns',
      'scene6.axis.churn':  '−20 churn',
      'scene6.axis.renew':  '+20 renew',

      'scene6.btn.run20':  'RUN x20',
      'scene6.btn.run200': 'RUN x200',
      'scene6.btn.clear':  'CLEAR',

      'scene6.punch':
        'Two clusters: renewals bank near <b>+20</b> minus a few costs, churns crater near ' +
        '<b>−20</b>. The honest question is not "what happened once" but "what is the ' +
        '<b>average</b> payoff if I play this way", the mean μ.',
    },
    jp: {
      'scene.title6': 'リターン: ぜんきかんの スコア',
      'scene6.hook':  'テープを ごうけい。 ひとつの じょうきょうと レバーから ほうしゅうの ぶんぷが でる。',

      'scene6.manager':
        'ほうしゅうは こんげつの わりびきだけ では ない。 ぜんこうしんきかんの ' +
        '<b>ごうけい</b>: まいレバーの コストと、 さいごの まとまった がく。 そして ' +
        'ひとつの ほうさくから でるのは すうじでは なく <b>ぶんぷ</b>だ。',

      'scene6.formula.label': 'リターンは つき i いこうの ほうしゅうの ごうけい',
      'scene6.formula.foot':
        'わりびきなし、 つまり たしざんだけ: はらった レバーコストに、 こうしんなら ' +
        '<b>+20</b>、 りだつなら <b>−20</b>。',

      'scene6.eg.label':
        'かくはっぱを かくりつで おもみづけ: <b>{state}</b>・レバー {lever} の きせきのき。 ' +
        'へいきん リターン E[G<sub>t</sub>] は だいちょうの P(けいろ)·G<sub>t</sub> の ごうけい。',
      'scene6.eg.tie':
        'その かじゅう ごうけいが <b>E[G<sub>t</sub>] = {eg}</b>、 そして これは まさに ' +
        '<b>Q*({state}, {lever})</b>: すべての けいろの へいきん こそ レバーの かち。 ' +
        'G<sub>t</sub> → E[G<sub>t</sub>] → Q*、 ひとつの だいちょうで。',

      'scene6.expansion.title': '１かいの ランを ひとつの スコアに',
      'scene6.expansion.note':  'かくrⱼは つきの コスト; さいごに しゅうりょうがくを くわえる',
      'scene6.btn.resample':    '↻ べつの ラン',

      'scene6.dist.title':    'なんども ラン: ほうしゅうは ぶんぷ',
      'scene6.dist.playbook': 'ほうさく（まいつき おなじ）:',

      'scene6.stats.empty':     'まだ ランなし。 RUN で ヒストグラムを うめよう。',
      'scene6.stats.runs':      'かい',
      'scene6.stats.mean':      'へいきん リターン μ',
      'scene6.stats.target':    'もくひょう E[G] <b>{target}</b>',
      'scene6.stats.range':     'はんい',
      'scene6.stats.renewrate': 'こうしんりつ',

      'scene6.hist.empty':  'RUN x20 で ほうしゅうを サンプル',
      'scene6.axis.churn':  '−20 りだつ',
      'scene6.axis.renew':  '+20 こうしん',

      'scene6.btn.run20':  'RUN x20',
      'scene6.btn.run200': 'RUN x200',
      'scene6.btn.clear':  'クリア',

      'scene6.punch':
        'ふたつの かたまり: こうしんは <b>+20</b> から すこし ひいた あたり、 りだつは ' +
        '<b>−20</b> ふきん。 ただしい といは「いちど どう なったか」では なく ' +
        '「この やりかたで <b>へいきん</b> どれだけ もうかるか」、 つまり へいきん μ。',
    },
  });
})();

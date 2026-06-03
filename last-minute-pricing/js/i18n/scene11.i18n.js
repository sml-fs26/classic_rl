/* scene11 i18n fragment -- "Learn the playbook with SARSA" (the capstone).
   Three-step pager: DERIVE the update from Bellman, name EPSILON, then watch
   it LEARN the board live with no demand model. English is the source of
   truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene11.title': "Learn the playbook with SARSA",
      'scene11.stub':  'Foundation stub. The real scene 11 is built by a downstream agent.',

      'scene11.heading': 'LEARN THE PLAYBOOK BY SELLING',

      /* pager chrome */
      'scene11.prev':   '◀ BACK',
      'scene11.next':   'NEXT ▶',
      'scene11.reset':  'RESET',
      'scene11.status': 'STEP {i} / {n}',

      /* ---- STEP 1: derive the update ---- */
      'scene11.s1.tag':   'STEP 1 / 3',
      'scene11.s1.title': 'NO DEMAND MODEL? LEARN FROM ONE SALE.',
      'scene11.s1.lead':
        'Scene 9 needed the printed demand odds to compute the playbook. ' +
        'Real demand is never handed to you. So drop the model: run the ' +
        'business, watch one sale, and nudge your value of that lever toward ' +
        'what you just saw.',
      'scene11.s1.bellmanCap': 'Bellman, scene 8: the value of a lever is an EXPECTATION over every way demand could fall.',
      'scene11.s1.sampleCap':  'You do not know the expectation. But you just lived ONE outcome of it, so use that single sample as your estimate.',
      'scene11.s1.updateCap':  'Then inch the stored value q[s,a] a fraction alpha of the way toward that sampled target.',
      'scene11.s1.foot':
        'r is today’s cash, q[s′,a′] is what you currently think the ' +
        'next situation is worth. The bracket is the SURPRISE: how wrong ' +
        'today’s estimate turned out. Repeat over thousands of seasons and ' +
        'q creeps toward Q*, with no demand model at all.',
      'scene11.s1.alphaName': 'learning rate',
      'scene11.s1.alphaNote': 'alpha = step size: how hard one sale moves the estimate. Fixed here.',

      /* ---- STEP 2: epsilon, the explore/exploit dial ---- */
      'scene11.s2.tag':   'STEP 2 / 3',
      'scene11.s2.title': 'EPSILON: THE EXPLORE / EXPLOIT DIAL',
      'scene11.s2.lead':
        'If you only ever pull the lever that looks best so far, you never ' +
        'discover whether an UNPROVEN lever is secretly better. So most days ' +
        'pull your current best, but with probability epsilon, try a ' +
        'random lever to keep learning.',
      'scene11.s2.greedyCap':  'With probability 1 minus epsilon: EXPLOIT, pull the lever your table rates highest right now.',
      'scene11.s2.exploreCap': 'With probability epsilon: EXPLORE, pull an unproven lever and find out what it really pays.',
      'scene11.s2.foot':
        'High epsilon = restless experimenting (learns the whole board, earns ' +
        'less today). Low epsilon = banking on today’s favourite (earns now, ' +
        'may miss a better lever). The live run next lets you turn this dial.',
      'scene11.s2.sampleTitle': 'ONE SAMPLED STEP',
      'scene11.s2.sampleNote':
        'You hold {u} seats with {d} days left. You pull {lever}; the demand ' +
        'draw shows {k}. That ONE (s, a, r, s′, a′) is all SARSA needs ' +
        'to make one update: no odds, no model.',
      'scene11.s2.drawBtn':  'DRAW A DAY',
      'scene11.s2.tupleS':   's = {u} seats, {d} days',
      'scene11.s2.tupleA':   'a = {lever}',
      'scene11.s2.tupleR':   'r = $ {r}',
      'scene11.s2.tupleSn':  's′ = {un} seats, {dn} days',
      'scene11.s2.tupleSnTerm': 's′ = {term}',
      'scene11.s2.tupleAn':  'a′ = {lever}',
      'scene11.s2.tupleAnTerm': 'a′ = (deadline, no next lever)',

      /* ---- STEP 3: live run ---- */
      'scene11.s3.tag':   'STEP 3 / 3',
      'scene11.s3.title': 'WATCH IT LEARN THE BOARD',
      'scene11.s3.lead':
        'Now play season after season with NO demand model: only ' +
        'observed sales drive the update. The board paints itself, and its ' +
        'colour regions drift toward the DP oracle from scene 9.',
      'scene11.s3.play':   '▶ PLAY',
      'scene11.s3.pause':  '⎉ PAUSE',
      'scene11.s3.season': 'NEXT SEASON',
      'scene11.s3.speed':  'SPEED',
      'scene11.s3.slow':   'slow',
      'scene11.s3.fast':   'fast',
      'scene11.s3.epsLabel': 'epsilon explore',
      'scene11.s3.alphaFixed': 'alpha = {a} (fixed)',
      'scene11.s3.seasons':  'SEASONS PLAYED',
      'scene11.s3.convLabel': 'CLOSENESS TO Q*',
      'scene11.s3.revLabel':  'GREEDY START VALUE',
      'scene11.s3.revOf':     '$ {cur} of $ {opt}',
      'scene11.s3.gateTitle': 'LIVE TRAINING',
      'scene11.s3.gateBody':
        'Press PLAY to run thousands of seasons and watch the board converge. ' +
        '(Headless capture auto-runs with &run.)',
      'scene11.s3.matchNote':
        'SARSA reproduces the DP oracle on {agree} of {total} situations and ' +
        'banks {pct}% of the optimal start revenue. The {dis} cells it still ' +
        'misses sit right on the diagonal seam: the closest calls, where ' +
        'two levers nearly tie and only the exact DP sweep splits them.',
      'scene11.s3.runningNote':
        'Learning... each season nudges a handful of cells. Watch FIRE-SALE ' +
        'claim the full-cabin / no-time corner and PREMIUM claim the scarce / ' +
        'lots-of-time corner, with no odds ever supplied.',
      'scene11.s3.oracleToggle': 'SHOW DP ORACLE',
      'scene11.s3.oracleOn':     'HIDE DP ORACLE',
      'scene11.s3.oracleCap':    'DP oracle (scene 9): the target the learner is chasing.',
      'scene11.s3.learnedCap':   'Learned from experience: no demand model.',

      'scene11.takeaway':
        'TAKEAWAY: run many small pricing experiments, learn from what actually ' +
        'sold, and the playbook emerges on its own: the same answer the ' +
        'perfect-model calculation gave, without ever owning the model.',
    },

    jp: {
      'scene11.title': "SARSAで プレイブックを まなぶ",
      'scene11.stub':  'どだいの スタブ。 ほんとうの シーン 11 は あとで つくられます。',

      'scene11.heading': 'うって プレイブックを まなぶ',

      'scene11.prev':   '◀ もどる',
      'scene11.next':   'つぎ ▶',
      'scene11.reset':  'リセット',
      'scene11.status': 'ステップ {i} / {n}',

      'scene11.s1.tag':   'ステップ 1 / 3',
      'scene11.s1.title': 'じゅようモデルなし？ 1かいの うれゆきで まなぶ。',
      'scene11.s1.lead':
        'シーン9は プレイブックの けいさんに じゅようかくりつが ひつようでした。' +
        'げんじつでは それは てに はいりません。だから モデルを すてて、' +
        'じっさいに うり、1かいの けっかを みて、そのレバーの かちを ' +
        'みたものへ すこし よせます。',
      'scene11.s1.bellmanCap': 'ベルマン（シーン8）: レバーの かちは じゅようの すべての ころびかたに ついての きたいち。',
      'scene11.s1.sampleCap':  'きたいちは わからない。でも たった いま 1つの けっかを たいけんしたので、その 1サンプルを すいていに つかう。',
      'scene11.s1.updateCap':  'そして ほぞんした q[s,a] を サンプルの ターゲットへ alpha だけ よせる。',
      'scene11.s1.foot':
        'r は きょうの げんきん、q[s′,a′] は つぎの じょうきょうの ' +
        'いまの みつもり。かっこの なかは「おどろき」: ' +
        'きょうの みつもりが どれだけ ずれていたか。なんせんシーズンも くりかえすと q は ' +
        'Q* へ ちかづく。じゅようモデルは いっさい なし。',
      'scene11.s1.alphaName': 'がくしゅうりつ',
      'scene11.s1.alphaNote': 'alpha = ステップさ：1かいの うれゆきが みつもりを どれだけ うごかすか。ここでは こてい。',

      'scene11.s2.tag':   'ステップ 2 / 3',
      'scene11.s2.title': 'EPSILON: たんさく / かつようの ダイヤル',
      'scene11.s2.lead':
        'いまの ベストの レバーだけを ひくと、まだ ためしていない レバーが ' +
        'じつは よいか わかりません。だから ふだんは いまの ベストを、' +
        'でも かくりつ epsilon で ランダムな レバーを ためして まなびつづけます。',
      'scene11.s2.greedyCap':  'かくりつ 1 マイナス epsilon：かつよう、いま テーブルで さいこうひょうかの レバーを ひく。',
      'scene11.s2.exploreCap': 'かくりつ epsilon：たんさく、まだ ためしていない レバーを ひいて じっさいの しはらいを しる。',
      'scene11.s2.foot':
        'たかい epsilon = いつも じっけん（ばんぜんたいを まなぶが きょうは ' +
        'もうけが すくない）。ひくい epsilon = きょうの おきにいりに かける' +
        '（いま もうけるが よりよい レバーを みのがすかも）。つぎの ' +
        'ライブで この ダイヤルを まわせます。',
      'scene11.s2.sampleTitle': '1つの サンプルステップ',
      'scene11.s2.sampleNote':
        'ざせき {u}せき、のこり {d}にち。{lever} を ひくと、じゅようドローは ' +
        '{k} を しめす。その 1つの (s, a, r, s′, a′) だけで SARSA は ' +
        '1かい こうしんできる：かくりつも モデルも なし。',
      'scene11.s2.drawBtn':  'いちにちを ひく',
      'scene11.s2.tupleS':   's = {u}せき、{d}にち',
      'scene11.s2.tupleA':   'a = {lever}',
      'scene11.s2.tupleR':   'r = $ {r}',
      'scene11.s2.tupleSn':  's′ = {un}せき、{dn}にち',
      'scene11.s2.tupleSnTerm': 's′ = {term}',
      'scene11.s2.tupleAn':  'a′ = {lever}',
      'scene11.s2.tupleAnTerm': 'a′ =（しめきり、つぎの レバー なし）',

      'scene11.s3.tag':   'ステップ 3 / 3',
      'scene11.s3.title': 'ばんが まなぶのを みる',
      'scene11.s3.lead':
        'じゅようモデルなしで シーズンを なんども プレイ：みた うれゆき' +
        'だけが こうしんを うごかす。ばんは じぶんで いろづき、その いろの ' +
        'りょういきは シーン9の DP オラクルへ ちかづく。',
      'scene11.s3.play':   '▶ さいせい',
      'scene11.s3.pause':  '⎉ ていし',
      'scene11.s3.season': 'つぎの シーズン',
      'scene11.s3.speed':  'はやさ',
      'scene11.s3.slow':   'おそい',
      'scene11.s3.fast':   'はやい',
      'scene11.s3.epsLabel': 'epsilon たんさく',
      'scene11.s3.alphaFixed': 'alpha = {a}（こてい）',
      'scene11.s3.seasons':  'プレイした シーズン',
      'scene11.s3.convLabel': 'Q* への ちかさ',
      'scene11.s3.revLabel':  'グリーディ かいしかち',
      'scene11.s3.revOf':     '$ {cur} / $ {opt}',
      'scene11.s3.gateTitle': 'ライブ がくしゅう',
      'scene11.s3.gateBody':
        'さいせいを おして なんせんシーズンも はしらせ、ばんが しゅうそく ' +
        'するのを みる。（ヘッドレスは &run で じどう さいせい。）',
      'scene11.s3.matchNote':
        'SARSA は {total} じょうきょうの うち {agree} で DP オラクルを さいげんし、' +
        'さいてき かいしうりあげの {pct}% を かせぐ。まだ はずす {dis} セルは ' +
        'たいかくせんの つぎめ：2つの レバーが ほぼ どうてんで、せいかくな ' +
        'DP スイープだけが わけられる、もっとも きわどい ところ。',
      'scene11.s3.runningNote':
        'がくしゅうちゅう... シーズンごとに いくつかの セルを うごかす。' +
        'まんせきの きゃくしつ / じかんなし の かどを おおやすうりが、すくない / ' +
        'じかん たっぷり の かどを プレミアムが とるのを みる：かくりつは ' +
        'いっさい あたえずに。',
      'scene11.s3.oracleToggle': 'DP オラクルを みる',
      'scene11.s3.oracleOn':     'DP オラクルを かくす',
      'scene11.s3.oracleCap':    'DP オラクル（シーン9）: がくしゅうが おう ターゲット。',
      'scene11.s3.learnedCap':   'けいけんから まなんだ：じゅようモデルなし。',

      'scene11.takeaway':
        'まとめ：ちいさな かかくじっけんを たくさん おこない、じっさいに うれた ' +
        'ものから まなぶと、プレイブックは ひとりでに あらわれる：ばんぜん' +
        'モデルの けいさんと おなじ こたえに、モデルを もたずに たどりつく。',
    },
  });
})();

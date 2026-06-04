/* i18n fragment for Scene 11 (Pipeline Climb): "SARSA: learn by selling".
 * Three-step pager: DERIVE the update from Bellman, name EPSILON, then watch
 * SARSA learn the playbook live with no model of the STAGE DIE. English is
 * authoritative; the Japanese mirror gives parity (reusing the established
 * rung / lever / die terms from js/i18n.js). Namespaced scene11.* .
 */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene11.blurb': 'SARSA: learn the playbook by selling, exploring a little.',

      'scene11.heading': 'LEARN THE PLAYBOOK BY SELLING',

      /* pager chrome */
      'scene11.prev':   '◀ BACK',
      'scene11.next':   'NEXT ▶',
      'scene11.reset':  'RESET',
      'scene11.status': 'STEP {i} / {n}',

      /* ---- STEP 1: derive the update ---- */
      'scene11.s1.tag':   'STEP 1 / 3',
      'scene11.s1.title': 'NO DIE ODDS? LEARN FROM ONE TOUCH.',
      'scene11.s1.lead':
        'Scene 9 needed the printed STAGE-DIE odds to compute the playbook. ' +
        'In the field nobody hands you those odds. So drop the model: work ' +
        'the deal, watch how the lead reacts to one touch, and nudge your ' +
        'value of that lever toward what you just saw.',
      'scene11.s1.boardCap': 'The Q-table the learner is about to fill: 5 rungs by 3 levers.',
      'scene11.s1.bellmanCap': 'Bellman, scene 8: the value of a lever is an EXPECTATION over every way the STAGE DIE could fall.',
      'scene11.s1.sampleCap':  'You do not know the expectation. But you just lived ONE outcome of it, so use that single sample as your estimate.',
      'scene11.s1.updateCap':  'Then inch the stored value q[s,a] a fraction alpha of the way toward that sampled target.',
      'scene11.s1.foot':
        'r is this touch’s reward (−1 of rep time, or +30 / −10 ' +
        'if the deal ends), q[s′,a′] is what you currently think the ' +
        'next rung is worth. The bracket is the SURPRISE: how wrong this touch’s ' +
        'estimate turned out. Repeat over thousands of deals and q creeps toward ' +
        'Q*, with no die odds at all.',
      'scene11.s1.alphaName': 'learning rate',
      'scene11.s1.alphaNote': 'alpha = step size: how hard one touch moves the estimate. Fixed here.',

      /* ---- STEP 2: epsilon, the explore / exploit dial ---- */
      'scene11.s2.tag':   'STEP 2 / 3',
      'scene11.s2.title': 'EPSILON: THE EXPLORE / EXPLOIT DIAL',
      'scene11.s2.lead':
        'If you only ever pull the lever that looks best so far, you never ' +
        'discover whether an UNPROVEN lever moves the lead better. So most ' +
        'touches pull your current best, but with probability epsilon, try a ' +
        'random lever to keep learning.',
      'scene11.s2.greedyCap':  'With probability 1 minus epsilon: EXPLOIT, pull the lever your table rates highest on this rung.',
      'scene11.s2.exploreCap': 'With probability epsilon: EXPLORE, pull an unproven lever and find out how the lead really reacts.',
      'scene11.s2.foot':
        'High epsilon = restless experimenting (learns the whole ladder, signs ' +
        'fewer now). Low epsilon = banking on today’s favourite (signs now, ' +
        'may miss a better lever). The live run next lets you turn this dial.',
      'scene11.s2.sampleTitle': 'ONE SAMPLED TOUCH',
      'scene11.s2.sampleNote':
        'The lead sits at {rung}. You pull {lever}; the STAGE DIE rolls {face}. ' +
        'That ONE (s, a, r, s′, a′) is all SARSA needs to make one ' +
        'update: no odds, no model.',
      'scene11.s2.drawBtn':  'TOUCH THE LEAD',
      'scene11.s2.tupleS':   's = {rung}',
      'scene11.s2.tupleA':   'a = {lever}',
      'scene11.s2.tupleR':   'r = {r}',
      'scene11.s2.tupleSn':  's′ = {rung}',
      'scene11.s2.tupleSnTerm': 's′ = {term}',
      'scene11.s2.tupleAn':  'a′ = {lever}',
      'scene11.s2.tupleAnTerm': 'a′ = (deal closed, no next lever)',

      /* ---- STEP 3: live run ---- */
      'scene11.s3.tag':   'STEP 3 / 3',
      'scene11.s3.title': 'WATCH IT LEARN THE PLAYBOOK',
      'scene11.s3.lead':
        'Now work the pipeline deal after deal with NO die odds: only the ' +
        'reactions you actually see drive the update. Every deal starts COLD. ' +
        'The Q-table paints itself, its starred column climbing toward the DP ' +
        'staircase from scene 9, and the curve of return-per-deal climbs ' +
        'toward the optimal start value.',
      'scene11.s3.play':   '▶ PLAY',
      'scene11.s3.pause':  '⏸ PAUSE',
      'scene11.s3.deal':   'NEXT DEAL',
      'scene11.s3.speed':  'SPEED',
      'scene11.s3.slow':   'slow',
      'scene11.s3.fast':   'fast',
      'scene11.s3.epsLabel': 'epsilon explore',
      'scene11.s3.alphaFixed': 'alpha = {a} (fixed)',
      'scene11.s3.deals':   'DEALS WORKED',
      'scene11.s3.convLabel': 'CLOSENESS TO Q*',
      'scene11.s3.valLabel':  'GREEDY START VALUE',
      'scene11.s3.valOf':     '{cur} of {opt}',
      'scene11.s3.curveCap':  'RETURN PER DEAL (raw + smoothed)',
      'scene11.s3.gateTitle': 'LIVE TRAINING',
      'scene11.s3.gateBody':
        'Press PLAY to work thousands of deals and watch the playbook converge. ' +
        '(Headless capture auto-runs with &run.)',
      'scene11.s3.matchNote':
        'SARSA reproduces the DP playbook on {agree} of {total} rungs and banks ' +
        '{pct}% of the optimal start value, with no die odds ever supplied. ' +
        'NURTURE warms the COLD lead, DEMO carries the middle rungs, and HARD ' +
        'CLOSE waits for READY.',
      'scene11.s3.runningNote':
        'Learning... each deal nudges a handful of cells. Watch the starred ' +
        'column settle into the DP staircase: NURTURE at COLD, DEMO through the ' +
        'middle, HARD CLOSE at READY, with no odds ever supplied.',
      'scene11.s3.oracleToggle': 'SHOW DP PLAYBOOK',
      'scene11.s3.oracleOn':     'HIDE DP PLAYBOOK',
      'scene11.s3.oracleCap':    'DP playbook (scene 9): the target the learner is chasing.',
      'scene11.s3.learnedCap':   'Learned from experience: no die odds.',
    },

    jp: {
      'scene11.blurb': 'SARSA: うりながら プレイブックを まなぶ。すこし たんさくしながら。',

      'scene11.heading': 'うって プレイブックを まなぶ',

      'scene11.prev':   '◀ もどる',
      'scene11.next':   'つぎ ▶',
      'scene11.reset':  'リセット',
      'scene11.status': 'ステップ {i} / {n}',

      'scene11.s1.tag':   'ステップ 1 / 3',
      'scene11.s1.title': 'ダイの かくりつなし？ 1かいの タッチで まなぶ。',
      'scene11.s1.lead':
        'シーン9は プレイブックの けいさんに ステージダイの かくりつが ' +
        'ひつようでした。げんばでは それは てに はいりません。だから モデルを ' +
        'すてて、とりひきを すすめ、1かいの タッチへの リードの はんのうを みて、' +
        'そのレバーの かちを みたものへ すこし よせます。',
      'scene11.s1.boardCap': 'がくしゅうが これから うめる Q テーブル：5ステージ × 3レバー。',
      'scene11.s1.bellmanCap': 'ベルマン（シーン8）: レバーの かちは ステージダイの すべての ころびかたに ついての きたいち。',
      'scene11.s1.sampleCap':  'きたいちは わからない。でも たった いま 1つの けっかを たいけんしたので、その 1サンプルを すいていに つかう。',
      'scene11.s1.updateCap':  'そして ほぞんした q[s,a] を サンプルの ターゲットへ alpha だけ よせる。',
      'scene11.s1.foot':
        'r は この タッチの ほうしゅう（じかん −1、または とりひきが おわると ' +
        '+30 / −10）、q[s′,a′] は つぎの ステージの いまの みつもり。' +
        'かっこの なかは「おどろき」: この タッチの みつもりが どれだけ ずれていたか。' +
        'なんせんとりひきも くりかえすと q は Q* へ ちかづく。ダイの かくりつは いっさい なし。',
      'scene11.s1.alphaName': 'がくしゅうりつ',
      'scene11.s1.alphaNote': 'alpha = ステップさ：1かいの タッチが みつもりを どれだけ うごかすか。ここでは こてい。',

      'scene11.s2.tag':   'ステップ 2 / 3',
      'scene11.s2.title': 'EPSILON: たんさく / かつようの ダイヤル',
      'scene11.s2.lead':
        'いまの ベストの レバーだけを ひくと、まだ ためしていない レバーが ' +
        'リードを よく うごかすか わかりません。だから ふだんは いまの ベストを、' +
        'でも かくりつ epsilon で ランダムな レバーを ためして まなびつづけます。',
      'scene11.s2.greedyCap':  'かくりつ 1 マイナス epsilon：かつよう、この ステージで テーブルが さいこうひょうかの レバーを ひく。',
      'scene11.s2.exploreCap': 'かくりつ epsilon：たんさく、まだ ためしていない レバーを ひいて リードの じっさいの はんのうを しる。',
      'scene11.s2.foot':
        'たかい epsilon = いつも じっけん（ラダーぜんたいを まなぶが いまは ' +
        'サインが すくない）。ひくい epsilon = きょうの おきにいりに かける' +
        '（いま サインするが よりよい レバーを みのがすかも）。つぎの ' +
        'ライブで この ダイヤルを まわせます。',
      'scene11.s2.sampleTitle': '1つの サンプルタッチ',
      'scene11.s2.sampleNote':
        'リードは {rung} に いる。{lever} を ひくと、ステージダイは {face} を ' +
        'だす。その 1つの (s, a, r, s′, a′) だけで SARSA は 1かい ' +
        'こうしんできる：かくりつも モデルも なし。',
      'scene11.s2.drawBtn':  'リードに タッチ',
      'scene11.s2.tupleS':   's = {rung}',
      'scene11.s2.tupleA':   'a = {lever}',
      'scene11.s2.tupleR':   'r = {r}',
      'scene11.s2.tupleSn':  's′ = {rung}',
      'scene11.s2.tupleSnTerm': 's′ = {term}',
      'scene11.s2.tupleAn':  'a′ = {lever}',
      'scene11.s2.tupleAnTerm': 'a′ =（とりひき しゅうりょう、つぎの レバー なし）',

      'scene11.s3.tag':   'ステップ 3 / 3',
      'scene11.s3.title': 'プレイブックを まなぶのを みる',
      'scene11.s3.lead':
        'ダイの かくりつなしで とりひきを なんども すすめる：じっさいに みた ' +
        'はんのうだけが こうしんを うごかす。どの とりひきも コールドから はじまる。' +
        'Q テーブルは じぶんで いろづき、ほしの れつは シーン9の DP かいだんへ ' +
        'のぼり、とりひきごとの リターンの きょくせんは さいてき かいしかちへ ちかづく。',
      'scene11.s3.play':   '▶ さいせい',
      'scene11.s3.pause':  '⏸ ていし',
      'scene11.s3.deal':   'つぎの とりひき',
      'scene11.s3.speed':  'はやさ',
      'scene11.s3.slow':   'おそい',
      'scene11.s3.fast':   'はやい',
      'scene11.s3.epsLabel': 'epsilon たんさく',
      'scene11.s3.alphaFixed': 'alpha = {a}（こてい）',
      'scene11.s3.deals':   'すすめた とりひき',
      'scene11.s3.convLabel': 'Q* への ちかさ',
      'scene11.s3.valLabel':  'グリーディ かいしかち',
      'scene11.s3.valOf':     '{cur} / {opt}',
      'scene11.s3.curveCap':  'とりひきごとの リターン（なま + へいかつ）',
      'scene11.s3.gateTitle': 'ライブ がくしゅう',
      'scene11.s3.gateBody':
        'さいせいを おして なんせんとりひきも すすめ、プレイブックが しゅうそく ' +
        'するのを みる。（ヘッドレスは &run で じどう さいせい。）',
      'scene11.s3.matchNote':
        'SARSA は {total} ステージの うち {agree} で DP プレイブックを さいげんし、' +
        'さいてき かいしかちの {pct}% を かせぐ。ダイの かくりつは いっさい なし。' +
        'ナーチャーが コールドを あたため、デモが まんなかを はこび、ハードクローズは ' +
        'じゅんびを まつ。',
      'scene11.s3.runningNote':
        'がくしゅうちゅう... とりひきごとに いくつかの セルを うごかす。ほしの れつが ' +
        'DP かいだんに おちつくのを みる：コールドで ナーチャー、まんなかで デモ、' +
        'じゅんびで ハードクローズ。かくりつは いっさい あたえずに。',
      'scene11.s3.oracleToggle': 'DP プレイブックを みる',
      'scene11.s3.oracleOn':     'DP プレイブックを かくす',
      'scene11.s3.oracleCap':    'DP プレイブック（シーン9）: がくしゅうが おう ターゲット。',
      'scene11.s3.learnedCap':   'けいけんから まなんだ：ダイの かくりつなし。',
    },
  });
})();

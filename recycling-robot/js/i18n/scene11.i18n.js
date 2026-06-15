/* scene11 i18n, SARSA vs Q-learning (step by step). */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene11.title':  'SARSA vs Q-learning',
      'scene11.lede':   'No drain model? <b>Learn</b> the table from experience: replace the expectation with one observed drain, and add <em>epsilon</em> to keep trying unproven levers. Two update rules, same experience, two honest answers.',

      'scene11.prev':   'BACK',
      'scene11.next':   'NEXT',
      'scene11.back':   'BACK',
      'scene11.reset':  'RESET',
      'scene11.play':   'PLAY',
      'scene11.pause':  'PAUSE',

      /* board headers + the (rung x steps-left) grid chrome */
      'scene11.f.sarsa':'SARSA (on-policy): bootstrap on the lever you ACTUALLY take next',
      'scene11.f.ql':   'Q-learning (off-policy): bootstrap on the BEST next lever',
      'scene11.sarsa.h':'SARSA (cautious)',
      'scene11.ql.h':   'Q-learning (optimal)',
      'scene11.dp.h':   'DP oracle',
      'scene11.dp.foot':'the exact answer (scene 9)',
      'scene11.grid.corner': 'rung \\ steps left',
      'scene11.grid.kcol':   'the rightmost column (8 steps left) is the start of the shift',

      /* STEP 1, derive */
      'scene11.s1.tag':  'STEP 1 of 3 · DERIVE THE UPDATE',
      'scene11.s1.lead': 'Bellman says a lever’s value is an <b>expectation</b> over every way the drain could fall. With no drain model, we replace that expectation with <b>one observed sample</b> and nudge the table toward it.',
      'scene11.s1.bellmanCap': 'Bellman: value = expectation over the drain',
      'scene11.s1.foot': 'Both rules update one cell of the table from one sampled step. They differ only in the bootstrap: the lever you actually take next (SARSA) vs the best next lever (Q-learning).',
      'scene11.s1.rcap': 'The table we will fill: one row per rung, one column per steps-left. Every cell starts blank.',
      'scene11.s1.counter': 'step 1 / 3',

      /* STEP 2, one update at a time */
      'scene11.s2.tag':  'STEP 2 of 3 · ONE UPDATE AT A TIME',
      'scene11.s2.lead': 'Replay the first real updates of a Q-learning run, <b>one per click</b>. Each sampled step touches exactly one cell of the table.',
      'scene11.s2.apply':'APPLY ONE UPDATE',
      'scene11.s2.run':  'PLAY UPDATES',
      'scene11.s2.rcap': 'The table filling in, one update at a time. The cell each update touches flashes.',
      'scene11.s2.closeness': 'CLOSENESS TO Q*',
      'scene11.s2.counter': 'update {i} / {n}',
      'scene11.s2.detailReady': 'Press APPLY ONE UPDATE to play the first sampled step and watch a single cell change.',
      'scene11.s2.updateOf': 'Update {i} of {n}',
      'scene11.s2.lblWhere': 'lever @ rung',
      'scene11.s2.lblReward': 'reward r',
      'scene11.s2.lblNext': 'next',
      'scene11.s2.lblTarget': 'target',
      'scene11.s2.lblWas': 'q was',
      'scene11.s2.kleft': '{k} steps left',
      'scene11.s2.sNext': '<b>{rung}</b>, {k} steps left',
      'scene11.s2.sTerm': 'shift over (no future)',
      'scene11.s2.targetBoot': 'r + best next q = {r} + (bootstrap)',
      'scene11.s2.targetTerm': 'r = {r} (terminal: no future)',
      'scene11.s2.foot': 'Early on most targets are still 0, so q barely moves. As cells fill, the bootstrap carries real value and the table firms up.',

      /* STEP 3, the long run */
      'scene11.s3.tag':  'STEP 3 of 3 · THE LONG RUN',
      'scene11.s3.frame':'FRAME',
      'scene11.s3.counter': 'ep {ep} · frame {i} / {n}',
      'scene11.s3.matches': 'matches DP: {n} / {total}',

      'scene11.verdict.start':    'Two empty boards (the start-of-shift layer). Step or PLAY through training and watch each one converge.',
      'scene11.verdict.learning': 'Training, ep {ep}. The boards are firming up; keep stepping toward the DP oracle.',
      'scene11.verdict.done':     'Q-learning recovers the DP stripe exactly (return {qlRet} ≈ DP {opt}). SARSA, learning the value of the cautious rule it follows, PROTECTS at the marginal high rung ({sarsaHigh}) instead of the bold SEARCH. Cautious vs optimal, both honest.',

      'scene11.hint':   'Run many small operating experiments and the playbook emerges, no model needed. On-policy SARSA learns the value of what it does (and stays cautious); off-policy Q-learning learns the value of optimal play (and matches DP).',
    },
    jp: {
      'scene11.title':  'SARSA たい Q-ラーニング',
      'scene11.lede':   'ドレインモデルが ない？ けいけんから テーブルを <b>まなぶ</b>： きたいちを 1つの かんそく ドレインに おきかえ、 <em>イプシロン</em> で みけんしょうの レバーも ためす。 ふたつの こうしんルール、 おなじ けいけん、 ふたつの しょうじきな こたえ。',

      'scene11.prev':   'もどる',
      'scene11.next':   'つぎ',
      'scene11.back':   'もどる',
      'scene11.reset':  'リセット',
      'scene11.play':   'さいせい',
      'scene11.pause':  'いちじ ていし',

      'scene11.f.sarsa':'SARSA（オンポリシー）： じっさいに つぎに とる レバーで ブートストラップ',
      'scene11.f.ql':   'Q-ラーニング（オフポリシー）： つぎの さいぜんの レバーで ブートストラップ',
      'scene11.sarsa.h':'SARSA（しんちょう）',
      'scene11.ql.h':   'Q-ラーニング（さいてき）',
      'scene11.dp.h':   'DP オラクル',
      'scene11.dp.foot':'せいかくな こたえ（シーン9）',
      'scene11.grid.corner': 'だん \\ のこり ステップ',
      'scene11.grid.kcol':   'みぎはしの れつ（のこり 8）が シフトの はじめ',

      'scene11.s1.tag':  'ステップ 1 / 3 · こうしんを みちびく',
      'scene11.s1.lead': 'ベルマンは レバーの かちを ドレインの すべての でかたに わたる <b>きたいち</b> という。 ドレインモデルが ないので、 その きたいちを <b>1つの かんそく サンプル</b>で おきかえ、 テーブルを そちらへ よせる。',
      'scene11.s1.bellmanCap': 'ベルマン： かち ＝ ドレインに わたる きたいち',
      'scene11.s1.foot': 'どちらも 1つの サンプルから テーブルの 1セルを こうしん。 ちがいは ブートストラップ だけ： じっさいに つぎ とる レバー（SARSA）か、 つぎの さいぜんの レバー（Q-ラーニング）か。',
      'scene11.s1.rcap': 'これから うめる テーブル： 1だん 1ぎょう、 のこり ステップ 1れつ。 すべて くうはく から はじまる。',
      'scene11.s1.counter': 'ステップ 1 / 3',

      'scene11.s2.tag':  'ステップ 2 / 3 · 1つずつ こうしん',
      'scene11.s2.lead': 'Q-ラーニングの さいしょの こうしんを <b>クリックごとに 1つ</b> さいせい。 サンプル 1ステップが テーブルの 1セル だけを さわる。',
      'scene11.s2.apply':'こうしんを 1つ てきよう',
      'scene11.s2.run':  'こうしんを さいせい',
      'scene11.s2.rcap': '1つずつ うまる テーブル。 こうしんが さわる セルが ひかる。',
      'scene11.s2.closeness': 'Q* への ちかさ',
      'scene11.s2.counter': 'こうしん {i} / {n}',
      'scene11.s2.detailReady': '「こうしんを 1つ てきよう」を おして さいしょの サンプル ステップを さいせいし、 1セルが かわるのを みて。',
      'scene11.s2.updateOf': 'こうしん {i} / {n}',
      'scene11.s2.lblWhere': 'レバー ＠ だん',
      'scene11.s2.lblReward': 'ほうしゅう r',
      'scene11.s2.lblNext': 'つぎ',
      'scene11.s2.lblTarget': 'ターゲット',
      'scene11.s2.lblWas': 'q は',
      'scene11.s2.kleft': 'のこり {k} ステップ',
      'scene11.s2.sNext': '<b>{rung}</b>、 のこり {k} ステップ',
      'scene11.s2.sTerm': 'シフト しゅうりょう（みらい なし）',
      'scene11.s2.targetBoot': 'r ＋ つぎの さいぜん q ＝ {r} ＋（ブートストラップ）',
      'scene11.s2.targetTerm': 'r ＝ {r}（しゅうたん： みらい なし）',
      'scene11.s2.foot': 'はじめは ターゲットが まだ 0 なので q は ほとんど うごかない。 セルが うまると ブートストラップが ほんものの かちを はこび、 テーブルが かたまる。',

      'scene11.s3.tag':  'ステップ 3 / 3 · ちょうきの がくしゅう',
      'scene11.s3.frame':'フレーム',
      'scene11.s3.counter': 'ep {ep} · フレーム {i} / {n}',
      'scene11.s3.matches': 'DP いっち： {n} / {total}',

      'scene11.verdict.start':    'からの ボードが ふたつ（シフトの はじめの レイヤー）。 ステップ または さいせいで がくしゅうを すすめ、 それぞれが しゅうそくするのを みて。',
      'scene11.verdict.learning': 'がくしゅうちゅう、 ep {ep}。 ボードが かたまりつつある。 DP オラクルへ すすめつづけて。',
      'scene11.verdict.done':     'Q-ラーニングは DP の ストライプを せいかくに とりもどす（リターン {qlRet} ほぼ DP {opt}）。 SARSA は したがう しんちょうな ルールの かちを まなび、 きわどい たかい だんで ボールドな サーチでは なく {sarsaHigh} で まもる。 しんちょう たい さいてき、 どちらも しょうじき。',

      'scene11.hint':   'ちいさな うんよう じっけんを たくさん やれば プレイブックが あらわれる、 モデルなしで。 オンポリシーの SARSA は じぶんの こうどうの かちを まなび（しんちょうに）、 オフポリシーの Q-ラーニングは さいてきプレイの かちを まなぶ（DP と いっち）。',
    },
  });
})();

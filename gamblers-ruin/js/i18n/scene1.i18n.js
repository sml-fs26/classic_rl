/* scene1 i18n -- tutorial. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene1.title':   'How to play',
      'scene1.lede':    'No theory yet, just the pieces. Read your whole position at a glance.',
      'scene1.step':    'Step {n} / {total}',
      'scene1.skip':    'SKIP TUTORIAL',
      'scene1.back':    '‹ BACK',
      'scene1.next':    'NEXT ›',
      'scene1.done':    'Got it, let me play ›',
      /* steps */
      'scene1.s0.title': 'Your capital',
      'scene1.s0.body':  'The rung your token sits on is your <b>capital</b>, the money you hold right now. It starts at $5. This is the situation you are in.',
      'scene1.s1.title': 'Your three stakes',
      'scene1.s1.body':  'Each turn you pull one lever, a <b>stake</b>: bet $1 (timid), $2 (medium), or $3 (bold). You can never bet more than you hold, nor more than you need to reach $10. Greyed chips are off the table.',
      'scene1.s2.title': 'The rigged coin',
      'scene1.s2.body':  'Then you <b>flip</b>. The coin wears its odds on its face: <b>heads 40%</b> and your capital climbs by your stake; <b>tails 60%</b> and it drops by your stake. The flip is the part you do not control.',
      'scene1.s3.title': 'The two ends',
      'scene1.s3.body':  'Reach <b>$10</b> and you win (the gold GOAL plate). Hit <b>$0</b> and you are wiped out (the dark RUIN slab). Either way the round ends.',
      'scene1.s4.title': 'One slow demo',
      'scene1.s4.body':  'Watch: place BET $2 at $5, flip, the coin lands tails, the token slides to $3. That is one full turn. Now it is your turn.',
      'scene1.demoBtn':  'Play the demo flip',
    },
    jp: {
      'scene1.title':   'あそびかた',
      'scene1.lede':    'まだ りろんは なし、ぶひんだけ。じぶんの じょうきょうを ひとめで よみとろう。',
      'scene1.step':    'ステップ {n} / {total}',
      'scene1.skip':    'チュートリアルを スキップ',
      'scene1.back':    '‹ もどる',
      'scene1.next':    'つぎ ›',
      'scene1.done':    'わかった、あそんでみる ›',
      'scene1.s0.title': 'あなたの しさん',
      'scene1.s0.body':  'トークンが のっている だんが あなたの <b>しさん</b>、いま もっている おかねです。$5 から はじまります。これが あなたの じょうきょうです。',
      'scene1.s1.title': '3つの かけきん',
      'scene1.s1.body':  '1ターンごとに レバーを1つ ひきます、つまり <b>かけきん</b>を きめます: $1（しんちょう）、$2（ふつう）、$3（だいたん）。もっている いじょうは かけられず、$10 に とどくのに ひつような いじょうも かけられません。グレーのチップは えらべません。',
      'scene1.s2.title': 'いかさまコイン',
      'scene1.s2.body':  'つぎに <b>コインなげ</b>。コインは かくりつを かおに かいています: <b>おもて 40%</b> で しさんは かけきんぶん あがり、<b>うら 60%</b> で かけきんぶん さがります。コインなげは あなたが コントロールできない ぶぶんです。',
      'scene1.s3.title': '2つの はし',
      'scene1.s3.body':  '<b>$10</b> に とどけば かち（きんいろの ゴールプレート）。<b>$0</b> に なれば ぜんめつ（くらい はさんの ばん）。どちらでも ラウンドは おわります。',
      'scene1.s4.title': 'ゆっくり デモ1かい',
      'scene1.s4.body':  'みてください: $5 で BET $2 を おいて、コインなげ、うらが でて、トークンが $3 へ すべります。これで 1ターンぶん。さあ あなたの ばんです。',
      'scene1.demoBtn':  'デモの コインなげを みる',
    },
  });
})();

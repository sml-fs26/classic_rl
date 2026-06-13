/* scene9 i18n -- dynamic programming. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title':  'Dynamic programming',
      'scene9.lede':   'Because the coin’s bias is printed on its face, we <b>know</b> the odds, so we can compute Q* exactly by sweeping the Bellman backup, no guessing.',
      'scene9.formulaLabel': 'SWEEP THE BACKUP TO A FIXED POINT',
      'scene9.step':   'STEP a sweep',
      'scene9.run':    'RUN ALL',
      'scene9.reset':  'RESET',
      'scene9.sweep':  'sweep',
      'scene9.stable': 'rungs stable',
      'scene9.ready.title':'Ready',
      'scene9.ready.body': 'Nothing is known yet. The ladder fills from the goal outward: the first sweep lights only rungs that can reach $10 in one flip; each later sweep pushes value down toward ruin.',
      'scene9.sweepInfo': 'Sweep {n}: value has spread to {k} of 9 rungs. Watch the best-stake colour lock in as each rung settles.',
      'scene9.done.title': 'Converged',
      'scene9.done.body':  'Value has reached three-decimal stability. The optimal-stake column is the <b>bold-middle zig-zag</b>: blue, amber, a band of orange, then amber, blue. Best stakes $1 to $9: $1, $2, $3, $3, $3, $3, $3, $2, $1.',
      'scene9.framing':'If you truly knew the odds, you could compute the entire optimal betting playbook exactly. Watch the bold-in-the-middle pattern draw itself, and watch value spread from the prize back toward the cliff.',
    },
    jp: {
      'scene9.title':  'ダイナミックプログラミング',
      'scene9.lede':   'コインの かたよりは かおに かいてあるので、わたしたちは かくりつを <b>しっています</b>。だから ベルマンバックアップを なんども はくことで、Q* を ぴったり けいさんできます、すいそく なし。',
      'scene9.formulaLabel': 'バックアップを はいて こていてんへ',
      'scene9.step':   'スイープを 1かい',
      'scene9.run':    'ぜんぶ じっこう',
      'scene9.reset':  'リセット',
      'scene9.sweep':  'スイープ',
      'scene9.stable': 'だんが あんてい',
      'scene9.ready.title':'じゅんび',
      'scene9.ready.body': 'まだ なにも わかっていません。はしごは ゴールから そとへ うまります: さいしょの スイープは $10 に コインなげ 1つで とどける だんだけ ともり、あとの スイープごとに かちが はさんへ おしさげられます。',
      'scene9.sweepInfo': 'スイープ {n}: かちは 9だんちゅう {k} だんへ ひろがりました。それぞれの だんが おちつくと、さいこうの かけきんの いろが きまるのを みてください。',
      'scene9.done.title': 'しゅうそく',
      'scene9.done.body':  'かちは しょうすう 3けたで あんていに たっしました。さいてきな かけきんの れつは <b>まんなかが だいたんの ジグザグ</b>: あお、アンバー、オレンジの おび、そして アンバー、あお。$1 から $9 の さいこうの かけきん: $1, $2, $3, $3, $3, $3, $3, $2, $1。',
      'scene9.framing':'もし かくりつを ほんとうに しっていれば、さいてきな かけかた こうりゃくぼん ぜんぶを ぴったり けいさんできます。まんなかが だいたんの もようが じぶんを えがくのを みて、かちが ほうびから がけへ ひろがるのを みてください。',
    },
  });
})();

/* i18n fragment for Scene 9 (Pipeline Climb): filling Q* with dynamic
 * programming. Because the STAGE-DIE odds are printed, P is known, so we
 * sweep the Bellman backup over all 5 rungs until the scorecard converges to
 * Q*. The playbook (the argmax stars) locks in within the first few sweeps,
 * long before the numbers finish settling. English is authoritative; jp
 * mirrors every key and reuses the established terms from js/i18n.js. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene9.blurb': 'Dynamic programming: sweep Bellman backups to fill the 5x3 scorecard.',

      'dp.heading': 'Filling Q* with DP',

      'dp.lede':
        'If you knew the odds exactly, you could compute the whole scorecard ' +
        'with no playing at all. <b>Dynamic programming</b> does this: sweep the ' +
        'Bellman backup over every rung, again and again, and the scores converge ' +
        'to Q*.',
      'dp.premise':
        'The STAGE-DIE odds are <b>printed on every lever</b>, so we know P. That ' +
        'is the gift that makes this exact. We backup all five rungs at once; ' +
        'each sweep reuses the last sweep\'s scores.',

      'dp.formula.label': 'We know P, so we sweep this backup',

      /* controls + status */
      'dp.btn.step':  'STEP SWEEP',
      'dp.btn.run':   'RUN TO CONVERGENCE',
      'dp.btn.reset': 'RESET',
      'dp.status.sweep': 'SWEEP',
      'dp.status.delta': 'MAX CHANGE',

      /* side-panel narration */
      'dp.step0.title': 'READY TO SWEEP',
      'dp.step0.body':
        'Every score starts at zero. Press STEP SWEEP to back up all five rungs ' +
        'once: each cell takes its best lever, given the scores from the previous ' +
        'sweep.',

      'dp.sweep.title': 'SWEEP {n}',
      'dp.sweep.movingBody':
        'Each rung looks one move ahead and keeps its best lever. The stars are ' +
        'still shuffling: the playbook has not settled yet.',
      'dp.sweep.lockedBody':
        'The stars have <b>stopped moving</b>: the greedy playbook locked in at ' +
        'sweep {stable}. The numbers keep creeping toward their fixed point, but ' +
        'the move on each rung is already decided.',

      'dp.done.title': 'CONVERGED AFTER {n} SWEEPS',
      'dp.done.body':
        'Known P gives exact Q* by repeated backups to a fixed point. The star ' +
        'walks up the ladder, and it had <b>locked in by sweep {stable}</b>, long ' +
        'before the scores finished settling. NURTURE cold, DEMO the middle, HARD ' +
        'CLOSE only at READY.',
      'dp.done.counts': 'PLAYBOOK &middot; {nurture} NURTURE &middot; {demo} DEMO &middot; {close} HARD CLOSE',

      'dp.bridge':
        'Exact, but only because the odds were printed. Real pipelines never hand ' +
        'you P, and a real board is far too big to sweep. So how does a rep find ' +
        'the playbook? By playing. Next.',
    },
    jp: {
      'scene9.blurb': 'どうてきけいかくほう：ベルマン バックアップを すいそうして 5x3 とくてんひょうを うめる。',

      'dp.heading': 'DP で Q* を うめる',

      'dp.lede':
        'かくりつを せいかくに しって いれば、あそばずに とくてんひょう ぜんたいを ' +
        'けいさんできる。<b>どうてきけいかくほう</b> が それ：ベルマン バックアップを ' +
        'かくステージに なんども すいそうすると、とくてんが Q* に しゅうそくする。',
      'dp.premise':
        'ステージダイの かくりつが <b>どの レバーにも かいてある</b> ので P が わかる。 ' +
        'これが せいかくに できる りゆう。5ステージを いちどに バックアップし、 ' +
        'かくスイープは まえの スイープの とくてんを さいりよう する。',

      'dp.formula.label': 'P が わかる ので この バックアップを すいそうする',

      'dp.btn.step':  'スイープ',
      'dp.btn.run':   'しゅうそくまで じっこう',
      'dp.btn.reset': 'リセット',
      'dp.status.sweep': 'スイープ',
      'dp.status.delta': 'さいだいへんか',

      'dp.step0.title': 'すいそう じゅんび',
      'dp.step0.body':
        'すべての とくてんは ゼロから。「スイープ」で 5ステージを いちど バックアップ： ' +
        'かくセルは まえの スイープの とくてんを もとに さいぜんの レバーを とる。',

      'dp.sweep.title': 'スイープ {n}',
      'dp.sweep.movingBody':
        'かくステージは 1て さきを みて さいぜんの レバーを たもつ。スターは まだ ' +
        'うごいている：プレイブックは まだ かたまっていない。',
      'dp.sweep.lockedBody':
        'スターが <b>うごかなく なった</b>：グリーディな プレイブックは スイープ {stable} で ' +
        'かたまった。すうちは ふどうてんへ じわじわ ちかづくが、かくステージの て は ' +
        'もう きまっている。',

      'dp.done.title': '{n} スイープで しゅうそく',
      'dp.done.body':
        'P が わかれば、くりかえしの バックアップで せいかくな Q* が ふどうてんまで もとまる。 ' +
        'スターは ラダーを のぼり、<b>スイープ {stable} で すでに かたまって</b> いた。 ' +
        'すうちが おちつく ずっと まえに。コールドは ナーチャー、まんなかは デモ、 ' +
        'じゅんびだけ ハードクローズ。',
      'dp.done.counts': 'プレイブック &middot; {nurture} ナーチャー &middot; {demo} デモ &middot; {close} ハードクローズ',

      'dp.bridge':
        'せいかく だが、かくりつが かいて あった からだけ。じっさいの パイプラインは P を ' +
        'くれず、じっさいの ばんは すいそうには おおきすぎる。では レップは どう プレイブックを ' +
        'みつける？あそぶ こと。つぎへ。',
    },
  });
})();

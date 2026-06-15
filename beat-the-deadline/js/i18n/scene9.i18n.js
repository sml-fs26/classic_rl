/* scene9 i18n -- dynamic programming. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title':  'Dynamic programming',
      'scene9.lede':   'If you knew the dice exactly, you could compute the perfect playbook. Sweep the Bellman backup across all 25 tiles.',
      'scene9.run':    'RUN VALUE ITERATION',
      'scene9.step':   'STEP ONE SWEEP',
      'scene9.reset':  'RESET',
      'scene9.sweep':  'SWEEP',
      'scene9.of':     'of',
      'scene9.converged':'Converged in 6 sweeps. The diagonal staircase is the optimal SOP.',
      'scene9.wallNote':'The deadline wall (h = 0) locks first at a flat -10.',
      'scene9.framing':'Perfect model in hand, the optimal SOP is computable, and it is not a flat rule. It is a diagonal: ship when full or when time is short, hold only with both room and runway.',
    },
    jp: {
      'scene9.title':  'どうてきけいかくほう',
      'scene9.lede':   'ダイスを せいかくにしれば、 かんぺきなプレイブックを けいさんできる。 ベルマンバックアップを 25タイルぜんぶに スイープ。',
      'scene9.run':    'かちはんぷくをじっこう',
      'scene9.step':   '1スイープすすむ',
      'scene9.reset':  'リセット',
      'scene9.sweep':  'スイープ',
      'scene9.of':     '/',
      'scene9.converged':'6スイープでしゅうそく。 となりのかいだんが さいてき SOP。',
      'scene9.wallNote':'しめきりのかべ（h = 0）が まず -10 でロック。',
      'scene9.framing':'かんぺきなモデルがあれば さいてき SOP は けいさんかのう、 そして ひとつのルールではない。 となり： いっぱいか時間がみじかいときおくり、 へやと よゆうの りょうほうがあるときだけまつ。',
    },
  });
})();

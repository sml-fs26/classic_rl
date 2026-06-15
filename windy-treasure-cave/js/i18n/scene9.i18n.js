/* Scene 9 (dynamic programming) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title': 'DYNAMIC PROGRAMMING',
      'scene9.lede':  'Because we wrote down the wind odds, we can solve the cave: apply the Bellman backup to every tile, again and again, and watch the value overlay converge. Value floods out from the gold; the arrow field bends around the pit.',
      'scene9.formulaLabel': 'SWEEP THIS TO A FIXED POINT',
      'scene9.step':  'STEP (one sweep)',
      'scene9.run':   'RUN ALL',
      'scene9.reset': 'RESET',
      'scene9.sweep': 'SWEEP',
      'scene9.solved': 'tiles stable',
      'scene9.viewBoth': 'VALUE + ARROWS',
      'scene9.viewVal':  'VALUE ONLY',
      'scene9.viewArr':  'ARROWS ONLY',
      'scene9.ready.title': 'READY',
      'scene9.ready.body':  'Nothing known yet. Press STEP to apply one Bellman sweep, or RUN ALL to watch the whole fill. The gold and pit anchor the values; the rest is computed.',
      'scene9.done.title':  'CONVERGED',
      'scene9.done.body':   'A fixed point: this is the exact Q*, and the optimal map pi* = argmax Q*. Notice the arrow field bends around the pit, and the four tiles touching it never point inward. The basin of safety glows warm toward the gold.',
      'scene9.sweepInfo':   'Sweep {n}: value has spread to {k} tiles. The warm region grows out from the gold; the danger crater deepens around the pit.',
      'scene9.framing': 'If you have a perfect model of the world, you can compute the optimal playbook for every situation up front, and the playbook is <em>not</em> uniform: it bends around your hazards. Steer wide near the cliff, sprint where it is safe.',
    },
    jp: {
      'scene9.title': 'どうてき けいかくほう',
      'scene9.lede':  'かぜの オッズを かきとめた から、 どうくつを とける： ベルマン バックアップを すべての マスに なんども あてて、 かちが しゅうそく するのを みる。 かちは たから から ひろがり、 やじるしばは あなを よけて まがる。',
      'scene9.formulaLabel': 'これを ふどうてん まで くりかえす',
      'scene9.step':  'ステップ（1かい）',
      'scene9.run':   'ぜんぶ じっこう',
      'scene9.reset': 'リセット',
      'scene9.sweep': 'スイープ',
      'scene9.solved': 'マス あんてい',
      'scene9.viewBoth': 'かち ＋ やじるし',
      'scene9.viewVal':  'かち だけ',
      'scene9.viewArr':  'やじるし だけ',
      'scene9.ready.title': 'じゅんび',
      'scene9.ready.body':  'まだ なにも しらない。 ステップ で 1かい、 ぜんぶ じっこう で ぜんたいを みる。 たから と あなが かちを いかりどめ、 のこりは けいさん。',
      'scene9.done.title':  'しゅうそく',
      'scene9.done.body':   'ふどうてん： これが せいかくな Q*、 さいぜんの ちず pi* = argmax Q*。 やじるしばが あなを よけて まがり、 せっする よっつの マスは けっして うちを むかない。 あんぜんの ぼんちが たから へ あたたかく ひかる。',
      'scene9.sweepInfo':   'スイープ {n}： かちが {k} マスに ひろがった。 あたたかい りょういきが たから から そだち、 きけんの クレーターが あなの まわりで ふかまる。',
      'scene9.framing': 'せかいの かんぜんな モデルが あれば、 すべての じょうきょうの さいぜんの プレイブックを まえもって けいさん できる。 そして それは <em>いちよう では ない</em>： きけんを よけて まがる。 がけの ちかくは おおきく よけ、 あんぜんな ところで つっぱしれ。',
    },
  });
})();

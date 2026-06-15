/* scene9 i18n -- dynamic programming. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title':  'Dynamic programming',
      'scene9.lede':   'If you <b>know</b> the dice odds, you can compute the optimal playbook exactly. Because the trial has a hard deadline, solve it right to left: fill the board column by column, day 1 → day 5.',
      'scene9.formulaLabel': 'sweep the Bellman backup until the table is filled',
      'scene9.step':   'STEP',
      'scene9.run':    'RUN ALL',
      'scene9.reset':  'RESET',
      'scene9.sweep':  'sweep',
      'scene9.solved': 'cells final',
      'scene9.ready.title': 'Ready.',
      'scene9.ready.body':  'The board is empty. The last-day column (day 1) is trivial: every non-terminal next state just expires at 0, so each Q-value is one line of arithmetic. STEP to fill it, then each earlier column from the one to its right.',
      'scene9.sweepInfo': 'Sweep <b>{n}</b>: <b>{k}</b> cells are now final. Value spreads leftward -- a new day-column locks each sweep, and the staircase draws itself.',
      'scene9.done.title':  'The staircase.',
      'scene9.done.body':   'Every cell is final and matches the hand-checked optimum exactly. NUDGE owns the cold-but-early top-left, PUSH owns the hooked / late-clock region, and DO NOTHING wins the single dead corner (tier 0, day 1).',
      'scene9.framing':'With a perfect model of how customers respond, you could hand-compute the optimal playbook for every situation -- and you just watched it being built, column by column.',
    },
    jp: {
      'scene9.title':  'どうてき けいかくほう',
      'scene9.lede':   'さいころの オッズを <b>しれば</b>、 さいぜんの プレイブックを せいかくに けいさん できる。 トライアルには きびしい しめきりが ある ので、 みぎから ひだりへ とく： れつごとに、 にっすう 1 → 5 で うめる。',
      'scene9.formulaLabel': 'ひょうが うまるまで ベルマン バックアップを スイープ',
      'scene9.step':   'ステップ',
      'scene9.run':    'ぜんぶ じっこう',
      'scene9.reset':  'リセット',
      'scene9.sweep':  'スイープ',
      'scene9.solved': 'セル かくてい',
      'scene9.ready.title': 'じゅんび かんりょう。',
      'scene9.ready.body':  'ボードは から。 さいごの ひの れつ（にっすう 1）は かんたん： しゅうりょう いがいの つぎの じょうたいは すべて 0 で しゅうりょう する ので、 かく Q値は いちぎょうの けいさん。 ステップで うめ、 つぎに はやい れつは みぎの れつから。',
      'scene9.sweepInfo': 'スイープ <b>{n}</b>： いま <b>{k}</b> セルが かくてい。 かちは ひだりへ ひろがる -- スイープごとに あたらしい にっすう れつが ロックされ、 かいだんが ひとりでに えがかれる。',
      'scene9.done.title':  'かいだん。',
      'scene9.done.body':   'すべての セルが かくていし、 てけいさんの さいぜんと せいかくに いっち。 ナッジは つめたく はやい ひだりうえ、 プッシュは むちゅう / とけいおそい りょういき、 なにもしない は ひとつの しんだ かど（レベル 0、 にっすう 1）を かくとく。',
      'scene9.framing':'おきゃくの はんのうの かんぜんモデルが あれば、 すべての じょうきょうの さいぜん プレイブックを てけいさん できる -- それが れつごとに つくられるのを いま みた。',
    },
  });
})();

/* Scene 8 (Bellman) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene8.title': 'BELLMAN OPTIMALITY',
      'scene8.lede':  'Every cell value equals the expected immediate reward plus the best value of wherever you land next. Let us recover the -6.66 from the last scene, by hand.',
      'scene8.formulaLabel': 'THE SELF-CONSISTENCY CONDITION',
      'scene8.step':  'ADD AN OUTCOME >',
      'scene8.reset': 'RESET',
      'scene8.work.title': 'AIM UP FROM ({r},{c})',
      'scene8.out.pit':   '0.7: gust 1-7, step UP into the PIT (R = -10, done)',
      'scene8.out.left':  '0.15: gust left to ({r},{c})',
      'scene8.out.right': '0.15: gust right to ({r},{c})',
      'scene8.match': 'That is exactly the Q*(3,2,UP) = {v} from the scorecard. The value of a heading is built from where the wind can land you.',
      'scene8.framing': 'Today\'s right call already prices in the best you can do tomorrow from wherever today lands you. The future is folded into the present number, that is the whole Bellman idea.',
    },
    jp: {
      'scene8.title': 'ベルマン さいてきせい',
      'scene8.lede':  'どの マスの かちも きたい そくじ ほうしゅう ＋ つぎに つく さきの さいぜん かち。 まえの シーンの -6.66 を てけいさん で とりもどそう。',
      'scene8.formulaLabel': 'じこ むじゅんの じょうけん',
      'scene8.step':  'けっかを ついか >',
      'scene8.reset': 'リセット',
      'scene8.work.title': '（{r},{c}）から うえ',
      'scene8.out.pit':   '0.7： 1-7、 うえ で あなに（R = -10、 おわり）',
      'scene8.out.left':  '0.15： ひだりへ（{r},{c}）',
      'scene8.out.right': '0.15： みぎへ（{r},{c}）',
      'scene8.match': 'これが まさに スコアの Q*(3,2,うえ) = {v}。 むきの かちは かぜの つく さき から くみたてられる。',
      'scene8.framing': 'きょうの ただしい いっしゅは、 きょう つく さき から あした できる さいぜん を すでに おりこんでいる。 みらいが いまの すうじに たたみこまれている、 それが ベルマン。',
    },
  });
})();

/* Scene 7 (Q*) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title': 'OPTIMAL ACTION-VALUE Q*',
      'scene7.lede':  '<b>Q*(s, a)</b> is the best expected return if you take heading <em>a</em> now and play optimally forever after. Pick a tile and read its scorecard. The star is the optimal heading.',
      'scene7.formulaLabel': 'BEST EXPECTED RETURN OF A HEADING',
      'scene7.col.action': 'heading a',
      'scene7.tile': 'TILE ({r},{c})',
      'scene7.spot.belowPit': 'BELOW THE PIT (3,2)',
      'scene7.spot.topSafe':  'TOP, SAFE (0,2)',
      'scene7.spot.pitLeft':  'PIT-LEFT (2,1)',
      'scene7.spot.pitRight': 'PIT-RIGHT (2,3)',
      'scene7.note.belowPit': 'The whole twist in one cell. Aiming straight at where the gold lives (UP) is the <b>worst</b> option: 70% of UP-steps drop you in the pit. The optimal heading is <em>sideways</em>, RIGHT.',
      'scene7.note.topSafe':  'No pit nearby, so the best lever is simply head straight for the gold: RIGHT is the clear winner here.',
      'scene7.note.pitLeft':  'Left of the pit, the safe heading is UP. Same distance to the pit as its right neighbour, opposite answer.',
      'scene7.note.pitRight': 'Right of the pit, the safe heading is RIGHT. The gold sits on this side, so the optimal lever is genuinely <em>local</em>.',
      'scene7.framing': 'Q* is the scorecard for each lever in this exact situation. From the tile below the pit, aiming straight at the prize is the worst option. The argmax (the star) is the optimal heading, and it changes from tile to tile.',
    },
    jp: {
      'scene7.title': 'さいてき こうどうかち Q*',
      'scene7.lede':  '<b>Q*(s, a)</b>は いま むき <em>a</em> を とり、 そのあと ずっと さいぜんに プレイした ときの さいぜんの きたい リターン。 マスを えらんで スコアを よもう。 ★が さいぜんの むき。',
      'scene7.formulaLabel': 'むきの さいぜんの きたい リターン',
      'scene7.col.action': 'むき a',
      'scene7.tile': 'マス ({r},{c})',
      'scene7.spot.belowPit': 'あなの した (3,2)',
      'scene7.spot.topSafe':  'うえ、 あんぜん (0,2)',
      'scene7.spot.pitLeft':  'あなの ひだり (2,1)',
      'scene7.spot.pitRight': 'あなの みぎ (2,3)',
      'scene7.note.belowPit': 'すべての ねじれが この 1マスに。 たからの ある ほう（うえ）を まっすぐ ねらうのは <b>さいあく</b>： うえ の 70% が あなに おちる。 さいぜんの むきは <em>よこ</em>、 みぎ。',
      'scene7.note.topSafe':  'あなが ちかくに ない、 だから さいぜんは ただ たからへ まっすぐ： ここは みぎ が めいはく。',
      'scene7.note.pitLeft':  'あなの ひだり、 あんぜんな むきは うえ。 みぎどなり と あなまでの きょりは おなじ、 でも こたえは ぎゃく。',
      'scene7.note.pitRight': 'あなの みぎ、 あんぜんな むきは みぎ。 たからは この がわ、 だから さいぜんの レバーは ほんとうに <em>きょくしょてき</em>。',
      'scene7.framing': 'Q* は この じょうきょうでの かく レバーの スコア。 あなの した の マスから、 たからを まっすぐ ねらうのは さいあく。 argmax（★）が さいぜんの むき、 マス ごとに かわる。',
    },
  });
})();

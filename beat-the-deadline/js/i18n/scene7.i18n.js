/* scene7 i18n, optimal action-value Q*. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title':  'Optimal action-value Q*',
      'scene7.lede':   'Q*(s, a) is the true long-run value of pulling lever a in state s, assuming you play smart afterward.',
      'scene7.cell1':  '(p = 2, h = 3)',
      'scene7.cell2':  '(p = 2, h = 2)',
      'scene7.show2':  'NOW ONE HOUR LATER',
      'scene7.show1':  'BACK TO 3 HOURS LEFT',
      'scene7.argmax': 'best lever',
      'scene7.flip1':  'Three hours left: WAIT scores +0.40, beating SEND at 0. Hold to consolidate.',
      'scene7.flip2':  'One hour later, the same half-full truck: the star JUMPS to SEND. Ship now.',
      'scene7.framing':'Two near-identical situations, opposite best moves: that is the twist, and Q* is the scoreboard that proves it.',
    },
    jp: {
      'scene7.title':  'さいてきこうどうかち Q*',
      'scene7.lede':   'Q*(s, a) は じょうたい s でレバー a をひく ほんとうのロングランのかち、 あとは じょうずにプレイするとして。',
      'scene7.cell1':  '(p = 2, h = 3)',
      'scene7.cell2':  '(p = 2, h = 2)',
      'scene7.show2':  '1時間あとへ',
      'scene7.show1':  'のこり3時間へもどる',
      'scene7.argmax': 'さいぜんのレバー',
      'scene7.flip1':  'のこり3時間： WAIT は +0.40、 SEND の 0 にかつ。 まとめるためにまつ。',
      'scene7.flip2':  '1時間あと、おなじ半分のトラック： ★が SEND にとぶ。 いまおくる。',
      'scene7.framing':'ほぼおなじ2つのじょうきょう、はんたいのさいぜんて： それがツイスト、 Q* はそれをしょうめいする スコアボード。',
    },
  });
})();

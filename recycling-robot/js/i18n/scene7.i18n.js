/* scene7 i18n -- Q*. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title':  'Optimal action-value Q*(s, a)',
      'scene7.lede':   'Q*(s, a) is the honest long-run value of pulling lever a at this battery level, <em>assuming you operate smart afterward</em>. argmax is the optimal lever. Flip the rung and watch the star move.',
      'scene7.flabel': 'the best you can do from (s, a)',
      'scene7.col.a':  'lever a',
      'scene7.say.full': 'FULL: SEARCH dominates (16.45). Headroom to spare, take the high-paying reach.',
      'scene7.say.high': 'HIGH: SEARCH still wins (15.44 vs WAIT 14.89), but it is the closest call, gap 0.55. Even a bad −2 drain only drops you to mid. Push while you have buffer.',
      'scene7.say.mid':  'MID: the star MOVES to RECHARGE (14.54). A −2 drain would strand you; the expected −10 swamps the +2 haul. Protect the asset before it is at risk.',
      'scene7.say.low':  'LOW: SEARCH is honestly negative (−8.00). Any drain strands you. The only sane move is RECHARGE. Never gamble the asset for a crumb.',
      'scene7.hint':    'The honest long-run value of each lever, played out to the end of the shift. The best lever is not the same at every battery level.',
    },
    jp: {
      'scene7.title':  'さいてき こうどうかち Q*(s, a)',
      'scene7.lede':   'Q*(s, a) は この バッテリーで レバー a を ひく しょうじきな ちょうきかち、 <em>そのあと じょうずに うごかす</em> ことが ぜんてい。 argmax が さいぜんの レバー。 だんを かえて ★が うごくのを みて。',
      'scene7.flabel': '(s, a) から できる さいぜん',
      'scene7.col.a':  'レバー a',
      'scene7.say.full': 'フル： サーチが ゆうい（16.45）。 よゆうじゅうぶん、 たかい リーチを とる。',
      'scene7.say.high': 'たかい： サーチが まだ かつ（15.44 たい まつ 14.89）、 でも いちばん きわどい、 さ 0.55。 わるい −2 ドレインでも ちゅうまで しか おちない。 よゆうが あるうちは おす。',
      'scene7.say.mid':  'ちゅう： ★が じゅうでんに うごく（14.54）。 −2 ドレインで こしょう するかも。 きたい −10 が +2 を のみこむ。 あぶなくなる まえに まもる。',
      'scene7.say.low':  'ひくい： サーチは しょうじきに マイナス（−8.00）。 どの ドレインでも こしょう。 まともな ては じゅうでん だけ。 わずかの ために しさんを かけるな。',
      'scene7.hint':    'かく レバーの しょうじきな ちょうきかち、 シフトの おわりまで。 さいぜんの レバーは どの バッテリーでも おなじ では ない。',
    },
  });
})();

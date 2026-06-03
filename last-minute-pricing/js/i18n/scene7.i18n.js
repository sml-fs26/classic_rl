/* scene7 (The value of a lever, Q*) i18n fragment.
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene7.title': 'The value of a lever, Q*',

      'scene7.lede':
        'Average those returns away and you get one honest number per lever: ' +
        '<b>Q*(s, a)</b>, the long-run value of pulling lever <i>a</i> in ' +
        'situation <i>s</i>, assuming you price smart every day afterward. The ' +
        'best lever is the one with the highest Q*, and it is <b>not</b> the ' +
        'same in every situation.',

      'scene7.formula.label': 'THE VALUE OF A LEVER',
      'scene7.formula.foot':
        'The best return you can expect from lever a in situation s, played ' +
        'out to the deadline. Rank the levers by Q*; the top one is the move.',

      /* state-picker buttons */
      'scene7.pick.label': 'SITUATION:',
      'scene7.pick.a':     '5 seats · 1 day',
      'scene7.pick.b':     '1 seat · 4 days',

      /* the situation panel */
      'scene7.state.label': 'SITUATION s',

      /* Q-table */
      'scene7.col.lever':  'LEVER  a',
      'scene7.col.qstar':  'Q*(s, a)',
      'scene7.best.tag':   'BEST',

      /* the read-out under the table */
      'scene7.read.a':
        'Five seats, one day. You <b>cannot</b> move them all at a premium ' +
        'before the gate closes, so FIRE-SALE tops the table: dumping at $2 beats ' +
        'watching seats fly empty at $0. <i>Use it or lose it.</i>',
      'scene7.read.b':
        'One scarce seat, four days of runway. PREMIUM tops the table: hold ' +
        'out for the $5 buyer, and if today is quiet you carry the seat and ' +
        'try again tomorrow. <i>Scarcity plus runway equals patience.</i>',

      'scene7.move.note':
        'Switch the situation and the star <b>moves</b>: same three levers, a ' +
        'different winner. That is the whole job of Q*, ranking the levers ' +
        'situation by situation.',
    },
    jp: {
      'scene7.title': 'レバーの かち Q*',

      'scene7.lede':
        'その リターンを ならして へいきんすると、 ' +
        'レバー ごとに 1つの しょうじきな すうち： ' +
        '<b>Q*(s, a)</b>。 じょうきょう <i>s</i> で レバー ' +
        '<i>a</i> を ひいた ときの ながい めの かち（その あとも ' +
        'まいにち かしこく ねづけする ぜんてい）。 さいてきは ' +
        'Q* が さいだいの レバーで、 じょうきょう ごとに ' +
        '<b>ちがい</b> ます。',

      'scene7.formula.label': 'レバーの かち',
      'scene7.formula.foot':
        'じょうきょう s で レバー a を ひき、 ' +
        'しめきり まで やった ときに きたいできる さいこうの ' +
        'リターン。 Q* で レバーを じゅんいづけ、 1いが さいてき。',

      'scene7.pick.label': 'じょうきょう：',
      'scene7.pick.a':     '5せき · 1にち',
      'scene7.pick.b':     '1せき · 4にち',

      'scene7.state.label': 'じょうきょう s',

      'scene7.col.lever':  'レバー a',
      'scene7.col.qstar':  'Q*(s, a)',
      'scene7.best.tag':   'さいてき',

      'scene7.read.a':
        '5せき、 1にち。 ゲートが しまる まえに プレミアムで ' +
        'ぜんぶは <b>うれません</b>。 だから おおやすうりが ' +
        '1い： $2 で うりさばく ほうが、 $0 で きえるのを ' +
        'みている より まし。 <i>いま うるか、 うしなうか。</i>',
      'scene7.read.b':
        '1せき だけ、 4にちの よゆう。 プレミアムが 1い： ' +
        '$5 の かいてを まち、 きょう しずかでも その せきを ' +
        'もちこして あす また ためす。 ' +
        '<i>きしょうさ ＋ よゆう ＝ にんたい。</i>',

      'scene7.move.note':
        'じょうきょうを かえると ★ が <b>うごき</b> ます： ' +
        'おなじ 3つの レバー でも かちぐみが ちがう。 ' +
        'それが Q* の しごと、 じょうきょう ごとに レバーを ' +
        'じゅんいづける こと です。',
    },
  });
})();

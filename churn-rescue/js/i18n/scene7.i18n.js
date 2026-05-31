/* i18n fragment for scene 7 (Q*: value of a lever). English authoritative.
   Scene-local keys only; shared vocabulary lives in the i18n core. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title7': 'Q*: value of a lever',
      'scene7.hook':  'The honest long-run value of each lever, assuming you play smart after.',

      'scene7.manager':
        'Imagine a number on every account: the honest <b>long-run</b> value of each lever ' +
        'in that exact situation, assuming you keep playing smart. That number says "spend ' +
        'here, hold there", and it is what Q* is.',

      'scene7.formula.label': 'Q* = THE BEST EXPECTED RETURN FROM PULLING LEVER a IN STATE s',
      'scene7.formula.foot':
        'The long-run payoff of lever <b>a</b> in situation <b>s</b>, averaged over the dice ' +
        'and assuming you play optimally afterwards. The best lever is the one with the ' +
        'highest Q*, and it <b>moves</b> with the situation.',

      'scene7.state_label': 'THIS ACCOUNT (state s)',

      'scene7.guess.prompt': 'Before the numbers: which lever do you think wins here?',
      'scene7.guess.hint':   'Pick a lever, then REVEAL the long-run value of each.',
      'scene7.btn.reveal':   'REVEAL Q*',

      'scene7.col.lever': 'LEVER a',
      'scene7.col.q':     'Q*(s, a)',

      'scene7.verdict.right': '✓ You called it.',
      'scene7.verdict.wrong': '✗ Most managers guess wrong here. The argmax is {lever}.',

      'scene7.best': 'Best lever here: {lever}  (the argmax of Q*).',

      'scene7.blurb.thriving':
        'They were going to renew anyway. A discount just burns margin: DO NOTHING scores ' +
        'highest, the BIG OFFER throws away ~4 for nothing.',
      'scene7.blurb.lukewarm':
        'A long runway and room to grow. The cheap CHECK-IN both lifts the coin and climbs ' +
        'the tier, compounding over the months. It beats both doing nothing and discounting.',
      'scene7.blurb.cliff':
        'Renewal is imminent and they are about to walk. Only the BIG OFFER moves the coin ' +
        'enough to be worth it: here the discount finally pays for itself.',

      'scene7.bridge':
        'The best lever flipped on <b>both</b> axes: the health bar AND the calendar. If only ' +
        'we had this Q* number for every cell of the board... next we compute it.',
    },
    jp: {
      'scene.title7': 'Q*: レバーの かち',
      'scene7.hook':  'あとで かしこく あそぶ ぜんていでの、 かく レバーの ちょうきてき かち。',

      'scene7.manager':
        'すべての アカウントに ひとつの すうじを: その じょうきょうでの かく レバーの ' +
        'ただしい <b>ちょうき</b> かち（あとも かしこく あそぶ ぜんてい）。 「ここは ' +
        'つかう、 そこは ひかえる」と おしえる すうじ、 それが Q*。',

      'scene7.formula.label': 'Q* = じょうたい s で レバー a を ひいた ときの さいだい きたい リターン',
      'scene7.formula.foot':
        'じょうきょう <b>s</b> での レバー <b>a</b> の ちょうきほうしゅう、 サイコロで ' +
        'へいきんし、 あとは さいてきに あそぶ ぜんてい。 さいぜんは Q* が さいだいの ' +
        'レバーで、 じょうきょうで <b>うごく</b>。',

      'scene7.state_label': 'この アカウント（じょうたい s）',

      'scene7.guess.prompt': 'すうじの まえに: ここで かつ レバーは どれだと おもう?',
      'scene7.guess.hint':   'レバーを えらび、 かく レバーの ちょうきかちを REVEAL。',
      'scene7.btn.reveal':   'Q* を みる',

      'scene7.col.lever': 'レバー a',
      'scene7.col.q':     'Q*(s, a)',

      'scene7.verdict.right': '✓ せいかい。',
      'scene7.verdict.wrong': '✗ おおくの マネージャーは ここで まちがう。 さいぜんは {lever}。',

      'scene7.best': 'ここでの さいぜん: {lever}（Q* の argmax）。',

      'scene7.blurb.thriving':
        'どうせ こうしんする。 わりびきは りはばを やくだけ: なにもしないが さいこう、 ' +
        'おおきな オファーは やく4を むだに する。',
      'scene7.blurb.lukewarm':
        'ながい じょそうろと せいちょうの よち。 やすい チェックインは コインを あげ、 ' +
        'ティアも のぼり、 つきを かけて ふくりする。 なにもしないや わりびきに かつ。',
      'scene7.blurb.cliff':
        'こうしんは まぢかで いまにも はなれそう。 おおきな オファーだけが コインを ' +
        'じゅうぶん うごかす: ここで わりびきが ついに もとを とる。',

      'scene7.bridge':
        'さいぜんの レバーは <b>りょうほうの</b> じくで はんてん: ヘルスバーと カレンダー。 ' +
        'ばんめんの すべての セルに この Q* が あれば… つぎは それを けいさんする。',
    },
  });
})();

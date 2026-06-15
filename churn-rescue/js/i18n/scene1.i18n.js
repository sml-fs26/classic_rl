/* i18n fragment for scene 1 (Tutorial: how to play). English authoritative.
   Scene-local keys only; shared vocabulary (tier names, lever names + costs,
   coin/die, months) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title1': "Tutorial: how to play",
      'scene1.hook':  "Meet the account card, the three levers, and the two dice.",

      /*, step engine chrome, */
      'tut.step_of':     "STEP {i} / {total}",
      'tut.skip':        "SKIP TO PLAYTEST ▸",
      'tut.go_playtest': "GO TO PLAYTEST ▸",
      'tut.nav.hint':    "Use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to walk the three panels.",

      /*, panel 1: the account card, */
      'tut.step.card.title':  "The account card",
      'tut.step.card.dialog':
        "This card is one customer. The bar up top is how engaged they are " +
        "(THRIVING at the top, ON THE CLIFF at the bottom), and the badge is " +
        "how many months until their contract comes up for renewal. This same " +
        "card is the situation you read on every screen.",
      'tut.card.callout.bar':       "↑ ENGAGEMENT (5 levels)",
      'tut.card.callout.countdown': "↓ RENEWAL COUNTDOWN",
      'tut.card.strip_title':       "THE FIVE TIERS",

      /*, panel 2: the three levers, */
      'tut.step.levers.title': "The three levers",
      'tut.step.levers.dialog':
        "Each month you pull ONE lever. Doing nothing is free; a check-in " +
        "costs a little; a big offer costs a lot. Left to right is cheap and " +
        "passive to expensive and aggressive. Remember the colours: grey, " +
        "blue, gold. They label everything from here on.",
      'tut.lever.nothing.desc': "Protect your margin. No touch, no spend.",
      'tut.lever.checkin.desc': "A cheap human touch: a call, a QBR nudge.",
      'tut.lever.offer.desc':   "A deep discount or free upgrade. Pricey.",
      'tut.lever.axis.l':       "cheaper · passive",
      'tut.lever.axis.r':       "expensive · aggressive",

      /*, panel 3: the two dice, */
      'tut.step.dice.title': "The two dice",
      'tut.step.dice.dialog':
        "Pull a lever and the world answers with TWO rolls, in order. First " +
        "the RETENTION COIN: do they stay or churn? If they stay, the " +
        "ENGAGEMENT DIE nudges their bar up, flat, or down for next month, " +
        "and the clock ticks down one. Click PULL to watch a check-in play out.",
      'tut.dice.flow.pull':  "PULL LEVER",
      'tut.dice.flow.coin':  "COIN: STAYS",
      'tut.dice.flow.die':   "DIE: UP",
      'tut.dice.flow.month': "NEXT MONTH",
    },

    jp: {
      'scene.title1': "チュートリアル: あそびかた",
      'scene1.hook':  "アカウントカード、 みっつの レバー、 ふたつの サイコロ。",

      'tut.step_of':     "ステップ {i} / {total}",
      'tut.skip':        "プレイテストへ ▸",
      'tut.go_playtest': "プレイテストへ ▸",
      'tut.nav.hint':    "<kbd>&larr;</kbd> <kbd>&rarr;</kbd> で みっつの パネルを めくる。",

      'tut.step.card.title':  "アカウントカード",
      'tut.step.card.dialog':
        "この カードは ひとりの おくさま。 " +
        "上の バーは エンゲージまんど（上が こうちょう、 下が がけっぷち）、 " +
        "バッジは こうしんまでの つきすう。 これが あなたの よむ じょうたい。",
      'tut.card.callout.bar':       "↑ エンゲージ（5だんかい）",
      'tut.card.callout.countdown': "↓ こうしん カウントダウン",
      'tut.card.strip_title':       "ごつの ティア",

      'tut.step.levers.title': "みっつの レバー",
      'tut.step.levers.dialog':
        "毎月 レバーを ひとつ ひく。 なにもしないは むりょう、 " +
        "チェックインは すこし、 オファーは たかい。 " +
        "ひだりから みぎへ やすい・じゅどうから たかい・こうげきへ。 " +
        "いろを おぼえて： グレー、 あお、 きん。",
      'tut.lever.nothing.desc': "マージンを まもる。 せっしょくなし。",
      'tut.lever.checkin.desc': "やすい にんげんタッチ： かいわ、QBR。",
      'tut.lever.offer.desc':   "ふかい りよう・アップグレード。 たかい。",
      'tut.lever.axis.l':       "やすい · じゅどう",
      'tut.lever.axis.r':       "たかい · こうげき",

      'tut.step.dice.title': "ふたつの サイコロ",
      'tut.step.dice.dialog':
        "レバーを ひくと せかいが ふたつの ロールで こたえる。 まず " +
        "いじ コイン： のこるか、 はなれるか？ のこれば " +
        "エンゲージ サイコロが バーを あげ・そのまま・さげる。 " +
        "PULL を クリック。",
      'tut.dice.flow.pull':  "レバーをひく",
      'tut.dice.flow.coin':  "コイン: のこる",
      'tut.dice.flow.die':   "サイコロ: あがる",
      'tut.dice.flow.month': "つぎのつき",
    },
  });
})();

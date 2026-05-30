/* i18n fragment for scene 3 - "What makes this an MDP?" (Formalization).
 * Deep-merged via window.I18N.register. English authoritative; jp mirrors. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene3.title": "What makes this an MDP?",
      "scene3.heading": "YOUR INSTINCT GAME WAS AN MDP",

      /* Manager-first lead, shown above the ladder. */
      "scene3.lead": "The game you just played has four moving parts. Name them once and every later scene clicks into place.",

      /* Step captions (manager meaning first, then the formal notation). */
      "scene3.step.0.tag":  "THE FOUR-PART FRAME",
      "scene3.step.0.body": "One picture, four parts: the SITUATION you are in, the LEVER you pull, the PART YOU DO NOT CONTROL, and the PAYOFF. Click through to name each.",

      "scene3.step.1.tag":  "STATE  ·  the situation now",
      "scene3.step.1.body": "All that matters this turn is how much is riding (the pot) and whether you are ahead or behind (the standing). That pair is the STATE.",

      "scene3.step.2.tag":  "ACTION  ·  the lever you pull",
      "scene3.step.2.body": "Two clean levers, one binary choice. ROLL to risk the pot for more, or HOLD to bank it safely and end your turn.",

      "scene3.step.3.tag":  "TRANSITION  ·  the part you do not control",
      "scene3.step.3.body": "Press ROLL and the die decides. A 2-6 adds its value to the pot and your turn continues; a 1 busts - the pot crashes to 0 and the turn passes. HOLD banks the pot, then passes. The odds are just the six faces, each 1 in 6.",

      "scene3.step.4.tag":  "REWARD  ·  the payoff",
      "scene3.step.4.body": "Nothing is paid turn to turn. The payoff is binary and comes only at the end: +1 if you reach {target} first, 0 if the rival does. So a state's value is literally a WIN PROBABILITY.",

      /* Tags floated over the table-card / die. */
      "scene3.tag.s": "STATE  s",
      "scene3.tag.a": "ACTION  a",
      "scene3.tag.p": "TRANSITION  P",
      "scene3.tag.r": "REWARD  r",

      /* Die face legend. */
      "scene3.die.grow": "2-6 : pot += face, roll on",
      "scene3.die.bust": "1 : BUST, pot to 0, pass turn",
      "scene3.die.each": "each face : 1 / 6",

      /* The tuple banner shown on the last step. */
      "scene3.tuple.label": "THE MDP, IN ONE LINE",
      "scene3.tuple.foot":  "Situation, lever, the die, payoff: the four parts of every sequential bet under uncertainty.",

      /* Reward strip mini-labels. */
      "scene3.reward.turn": "each turn",
      "scene3.reward.win":  "reach {target} first",
      "scene3.reward.lose": "rival reaches {target}",
      "scene3.reward.value":"value = win probability",

      /* Controls + footnote. */
      "scene3.prev": "BACK",
      "scene3.next": "NEXT",
      "scene3.step_of": "step <b id=\"sc3-step-i\">1</b> / 5",
      "scene3.foot": "Pin the rival to its fixed rule and the die's odds are known - that is what makes this a clean MDP. Press <kbd>&rarr;</kbd> to step through."
    },

    jp: {
      "scene3.title": "これが MDP な わけ",
      "scene3.heading": "あの カンの ゲームは MDP だった",

      "scene3.lead": "いま プレイした ゲームには よっつの ぶぶんが ある。 いちど なづければ あとの シーンが ぜんぶ つながる。",

      "scene3.step.0.tag":  "よっつの ぶぶん",
      "scene3.step.0.body": "ひとつの えに よっつ： いまの じょうきょう、 ひく レバー、 コントロール できない ぶぶん、 そして むくい。 じゅんに なづけよう。",

      "scene3.step.1.tag":  "ステート  ·  いまの じょうきょう",
      "scene3.step.1.body": "この ターンで だいじなのは ポットの おおきさと、 リードか おくれか だけ。 その くみあわせが ステート。",

      "scene3.step.2.tag":  "アクション  ·  ひく レバー",
      "scene3.step.2.body": "レバーは ふたつ、 にたくいつ。 ポットを かけて もっと ふる（ふる）か、 いま バンクして ターンを おえる（キープ）か。",

      "scene3.step.3.tag":  "せんい  ·  コントロール できない ぶぶん",
      "scene3.step.3.body": "ふると サイコロが きめる。 2-6なら めの ぶんだけ ポットが ふえ ターンつづく； 1なら バスト - ポットは 0、 ターンが わたる。 キープは バンクして わたす。 かくりつは ろくつの め、 おのおの 6ぶんの 1。",

      "scene3.step.4.tag":  "ほうしゅう  ·  むくい",
      "scene3.step.4.body": "ターンごとには なにも はらわれない。 むくいは さいごだけ： さきに {target}に つけば +1、 あいてが さきなら 0。 だから ステートの ねうちは そのまま しょうりつ。",

      "scene3.tag.s": "ステート  s",
      "scene3.tag.a": "アクション  a",
      "scene3.tag.p": "せんい  P",
      "scene3.tag.r": "ほうしゅう  r",

      "scene3.die.grow": "2-6 : ポット += め、 つづける",
      "scene3.die.bust": "1 : バスト、 ポット 0、 ターン わたす",
      "scene3.die.each": "おのおの : 6ぶんの 1",

      "scene3.tuple.label": "MDP を ひとことで",
      "scene3.tuple.foot":  "じょうきょう、 レバー、 サイコロ、 むくい： ふかくじつな ちくじ かけの よっつの ぶぶん。",

      "scene3.reward.turn": "まいターン",
      "scene3.reward.win":  "さきに {target}",
      "scene3.reward.lose": "あいてが {target}",
      "scene3.reward.value":"ねうち = しょうりつ",

      "scene3.prev": "もどる",
      "scene3.next": "つぎ",
      "scene3.step_of": "ステップ <b id=\"sc3-step-i\">1</b> / 5",
      "scene3.foot": "あいてを きまった ルールに とめれば サイコロの かくりつも わかる - だから きれいな MDP。 <kbd>&rarr;</kbd> で すすむ。"
    }
  });
})();

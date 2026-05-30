/* i18n fragment for scene 8 - Bellman optimality equation.
 * Deep-merged via window.I18N.register. English authoritative; jp mirror. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene8.title": "Bellman",
      "s8.heading": "WHAT IS ONE MORE ROLL WORTH?",

      "s8.manager":
        "Knowing when to stop is recursive. The value of pulling a lever now is " +
        "whatever it pays right away, plus the value of the situation it leaves " +
        "you in next - assuming you again pull the best lever there. Tomorrow's " +
        "value defines today's.",

      "s8.formula.label": "BELLMAN OPTIMALITY - the value of a lever, defined by what comes next",
      "s8.formula.read":
        "In words: Q*(s, lever) = the reward you get now, PLUS the win-odds of " +
        "wherever the roll lands you - played on by the best lever there. The " +
        "die averages over every face (the E[...]); the max picks the smartest " +
        "next move.",

      "s8.legend.now": "reward now",
      "s8.legend.next": "best play from the next situation",
      "s8.legend.exp": "averaged over the die",

      "s8.backup.title": "ONE-STEP BACKUP - ROLL from a pot of 20, EVEN game",
      "s8.backup.intro":
        "You are neck-and-neck ({my} vs {riv}) with {pot} chips in the pot. " +
        "You press ROLL. The die splits the future into six equally-likely faces. " +
        "We read each branch's win-odds straight off the solved table.",

      "s8.backup.bustHead": "1-in-6: the BUST (a rolled 1)",
      "s8.backup.bustBody":
        "Pot wiped to 0, turn passes to the rival - you are back to an even game " +
        "with nothing banked this turn.",
      "s8.backup.bustTerm": "win-odds of being EVEN, empty pot",

      "s8.backup.growHead": "5-in-6: the pot GROWS (a 2-6)",
      "s8.backup.growBody":
        "The pot climbs past 20 into the danger zone and it is your move again. " +
        "Each face lands you a little richer:",
      "s8.backup.growRow": "roll a {face} -> pot {pot}",
      "s8.backup.growAvg": "average win-odds after a good roll",

      "s8.backup.sum.label": "PUT IT TOGETHER",
      "s8.backup.sum.roll":
        "Q*(ROLL) = the six branches, each weighted 1/6:",
      "s8.backup.sum.rollNum":
        "= 1/6 ({bust}) + 1/6 ({g2} + {g3} + {g4} + {g5} + {g6})",
      "s8.backup.sum.rollVal": "Q*(ROLL) = {roll}",
      "s8.backup.sum.holdVal": "Q*(HOLD) = {hold}",
      "s8.backup.sum.verdict":
        "A whisker apart - and at a pot of 20 the safe lever (HOLD) just edges it. " +
        "That is the knife-edge below.",

      "s8.knife.title": "THE KNIFE-EDGE - why a pot of 20 is the break-even",
      "s8.knife.body":
        "Forget the scoreboard for a second and ask only: is one more roll worth " +
        "it? One roll GAINS the average of 2-6, and RISKS the whole pot 1 time in 6.",
      "s8.knife.gain": "expected gain per roll",
      "s8.knife.risk": "bust risk at pot 20",
      "s8.knife.identity":
        "Set gain = risk: 3.33 = pot / 6, so pot = 20. Below 20 the gain beats " +
        "the risk (ROLL on); above 20 the risk wins (HOLD). The two forces cancel " +
        "exactly at 20 - the famous break-even - and the win-odds above confirm it: " +
        "ROLL and HOLD are within a whisker right at the edge.",

      "s8.bridge":
        "The catch: this backup READ each next-situation value off a solved table. " +
        "Where did those values come from? You sweep this same equation until it " +
        "stops changing - next."
    },
    jp: {
      "scene8.title": "ベルマン",
      "s8.heading": "もう ひとふり の かち は？",

      "s8.manager":
        "いつ やめるか は さいきてき。 いま レバー を ひく かち は、 すぐ の " +
        "みかえり と、 つぎ の じょうきょう の かち の あわせ - そこ でも " +
        "ベスト の レバー を ひく と かんがえる。 あした の かち が きょう を きめる。",

      "s8.formula.label": "ベルマン さいてきせい - レバー の かち を つぎ で きめる",
      "s8.formula.read":
        "ことば で： Q*(s, レバー) = いま の みかえり ＋ サイコロ が おとす さき の " +
        "しょうりつ - そこ で ベスト の レバー を ひく。 E[...] は サイコロ の へいきん、 " +
        "max は いちばん かしこい つぎ の て。",

      "s8.legend.now": "いま の みかえり",
      "s8.legend.next": "つぎ の じょうきょう の ベスト",
      "s8.legend.exp": "サイコロ で へいきん",

      "s8.backup.title": "ワンステップ バックアップ - ポット 20、 ごかく で ふる",
      "s8.backup.intro":
        "ごかく（{my} たい {riv}） で ポット は {pot}。 ふる を おす。 サイコロ は " +
        "みらい を おなじ かくりつ の 6つ の め に わける。 おのおの の しょうりつ は " +
        "といた ひょう から よむ。",

      "s8.backup.bustHead": "6ぶんの1： バスト（1 が でる）",
      "s8.backup.bustBody":
        "ポット は 0 に。 ターン は あいて へ - また ごかく で、 この ターン は なに も " +
        "バンク できない。",
      "s8.backup.bustTerm": "ごかく・からポット の しょうりつ",

      "s8.backup.growHead": "6ぶんの5： ポット が のびる（2-6）",
      "s8.backup.growBody":
        "ポット は 20 を こえて きけん ゾーン へ、 また じぶん の ばん。 め ごと に " +
        "すこし ゆたか に：",
      "s8.backup.growRow": "{face} で -> ポット {pot}",
      "s8.backup.growAvg": "よい め の あと の へいきん しょうりつ",

      "s8.backup.sum.label": "まとめる",
      "s8.backup.sum.roll":
        "Q*(ふる) = 6つ の えだ、 おのおの 6ぶんの1：",
      "s8.backup.sum.rollNum":
        "= 1/6 ({bust}) + 1/6 ({g2} + {g3} + {g4} + {g5} + {g6})",
      "s8.backup.sum.rollVal": "Q*(ふる) = {roll}",
      "s8.backup.sum.holdVal": "Q*(キープ) = {hold}",
      "s8.backup.sum.verdict":
        "かみひとえ - そして ポット 20 では あんぜん な キープ が わずか に かつ。 " +
        "した の かみひとえ を みて。",

      "s8.knife.title": "かみひとえ - なぜ ポット 20 が ぶんきてん か",
      "s8.knife.body":
        "スコア は おいて、 きく の は ただ ひとつ： もう ひとふり は わり に あう か？ " +
        "ひとふり は 2-6 の へいきん を える、 そして 6かい に 1かい ポット ぜんぶ を うしなう。",
      "s8.knife.gain": "ひとふり の きたい りえき",
      "s8.knife.risk": "ポット 20 の バスト りすく",
      "s8.knife.identity":
        "りえき = りすく： 3.33 = ポット / 6、 だから ポット = 20。 20 みまん は りえき が " +
        "りすく に かつ（ふる）、 20 ちょうか は りすく が かつ（キープ）。 ふたつ の ちから は " +
        "20 で ちょうど うちけしあう - ゆうめい な ぶんきてん - うえ の しょうりつ も そう しめす： " +
        "ふる と キープ は ふち で かみひとえ。",

      "s8.bridge":
        "おとしあな： この バックアップ は さき の かち を「といた ひょう」 から よんだ。 " +
        "その かち は どこ から？ この おなじ しき を かわらなく なる まで くりかえす - つぎ。"
    }
  });
})();

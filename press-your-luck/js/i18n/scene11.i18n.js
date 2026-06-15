/* i18n fragment for scene 11 - SARSA (learn Q* by playing).
 * Deep-merged via window.I18N.register. English authoritative; JP mirror. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene11.title": "SARSA - learn the playbook by playing",
      "scene11.heading": "LEARN Q* BY PLAYING",

      /*, pager chrome, */
      "s11.prev":   "PREV",
      "s11.next":   "NEXT",
      "s11.reset":  "RESET",
      "s11.status": "STEP {i} / {total}",

      /*, STEP 1: learn by playing (manager + goal), */
      "s11.step1.kicker": "STEP 1 / 3",
      "s11.step1.title":  "NO ODDS, NO RIVAL'S RULE - JUST PLAY",
      "s11.step1.body":
        "In scene 9 we had the dice odds and the rival's habit, so we COMPUTED the whole playbook. Out in the world you get neither. " +
        "So do what a manager actually does: play many games, watch what happened, and adjust. " +
        "We keep one number per cell - q[s,a], our running guess at the win-odds of each lever - and let experience fill the board in.",
      "s11.step1.foot":
        "Goal: the same 6x3 board, but learned. q creeps toward the true Q* - the DP oracle's climbing staircase from scene 9.",
      "s11.step1.cap": "The board starts blank. The dashed seam is the DP oracle from scene 9 - the answer we are aiming at, never shown to the learner.",

      /*, STEP 2: one sample, one nudge (derive), */
      "s11.step2.kicker": "STEP 2 / 3",
      "s11.step2.title":  "ONE GAME, ONE NUDGE",
      "s11.step2.body":
        "Bellman says the value of a lever is an AVERAGE over every way the dice could fall. We cannot average - we only get the ONE game we just played. " +
        "So replace the average with that single sample: after pulling lever a in situation s, seeing reward r, landing in s' and choosing the next lever a', nudge q[s,a] a step toward r + q[s',a'].",
      "s11.step2.eps":
        "epsilon is the explore / exploit dial: now and then take the lever you are UNSURE about - roll a fat pot you would normally bank - just to learn what it is really worth, instead of always trusting today's best guess.",
      "s11.step2.foot":
        "alpha is the step size: how far each game moves q. Small alpha = slow but steady; reward is 0 every turn until the final +1 win / 0 loss.",
      "s11.step2.cap": "One sampled game. The bold tuple is the single (s, a, r, s', a') that drives one nudge.",
      "s11.tape.title": "ONE SAMPLED GAME (your turns)",

      /*, STEP 3: live run, */
      "s11.step3.kicker": "STEP 3 / 3",
      "s11.step3.title":  "GRIND THE GAMES",
      "s11.step3.body":
        "Now play for real against the rival - with NO knowledge of the odds, seeing only (pot bucket, standing). Each game nudges the cells it visited. " +
        "Watch the board paint itself and the regions march toward the DP oracle from scene 9: bank the fat 21+ pots, roll the rest - the playbook, found by experience alone. " +
        "The closeness bar settles a little under 100%: the last hold-outs are the seam cells where even the exact answer is a coin-flip (ROLL vs HOLD within a percent), so the bucket lens cannot resolve them - the very blur scene 10 warned about.",
      "s11.play":      "PLAY",
      "s11.pause":     "PAUSE",
      "s11.next_game": "+1 GAME",
      "s11.speed":     "SPEED",
      "s11.speed.slow": "slow",
      "s11.speed.fast": "fast",
      "s11.eps":       "explore e =",
      "s11.alpha":     "step a = {a} (fixed)",
      "s11.games":     "GAMES PLAYED: {n}",
      "s11.conv.label": "CLOSENESS TO Q* (DP ORACLE):",
      "s11.latest":    "LATEST GAME (your turns)",
      "s11.latest.none": "press PLAY or +1 GAME to start grinding.",
      "s11.win":  "WIN",
      "s11.lose": "LOSE",
      "s11.run_hint": "Tip: nudge epsilon to 0 and the learner stops exploring - it gets stuck on its first habits and the board never finishes.",

      /*, legend, */
      "s11.legend.q":   "q[s,a] - our learned win-odds guess",
      "s11.legend.tgt": "DP oracle Q* - the target (scene 9)",
    },

    jp: {
      "scene11.title": "SARSA - プレイして さくせんを まなぶ",
      "scene11.heading": "プレイして Q* を まなぶ",

      "s11.prev":   "まえ",
      "s11.next":   "つぎ",
      "s11.reset":  "リセット",
      "s11.status": "ステップ {i} / {total}",

      "s11.step1.kicker": "ステップ 1 / 3",
      "s11.step1.title":  "かくりつも あいての ルールも なし - ただ プレイ",
      "s11.step1.body":
        "シーン 9 では サイコロの かくりつと あいての くせを しって いたので さくせんを けいさん できた。 げんじつでは どちらも わからない。 " +
        "だから マネージャーが する とおりに する： なんども プレイし、 おきた ことを みて、 ちょうせい する。 " +
        "セルごとに ひとつの すうち q[s,a]（レバーの しょうりつの いまの すいそく）を もち、 けいけんで ばんめんを うめて いく。",
      "s11.step1.foot":
        "もくひょう： おなじ 6x3 の ばんめん、 でも まなんだ もの。 q は ほんとうの Q* - シーン 9 の DP の かいだん - に ちかづく。",
      "s11.step1.cap": "ばんめんは さいしょ くうはく。 てんせんの つぎめは シーン 9 の DP の こたえ - めざす ゴールで、 まなぶ がわには みせない。",

      "s11.step2.kicker": "ステップ 2 / 3",
      "s11.step2.title":  "ひとつの ゲーム、 ひとつの ナッジ",
      "s11.step2.body":
        "ベルマンは レバーの かちは サイコロの でかたの すべての へいきんだと いう。 でも へいきんは とれない - とった ばかりの ゲームは ひとつ だけ。 " +
        "だから へいきんを その ひとつの サンプルで おきかえる： じょうきょう s で レバー a を ひき、 ほうしゅう r を み、 s' に つき、 つぎの レバー a' を えらんだ あと、 q[s,a] を r + q[s',a'] へ いっぽ ナッジする。",
      "s11.step2.eps":
        "epsilon は たんさく／かつよう の ダイヤル： ときどき じしんの ない レバーを とる - ふだん バンクする おおきな ポットを ふってみる - その ほんとうの かちを まなぶ ために。 いつも きょうの さいぜんを しんじる だけでは ない。",
      "s11.step2.foot":
        "alpha は ステップはば： ゲームごとに q が どれだけ うごくか。 ちいさい alpha = おそいが あんてい。 ほうしゅうは さいごの +1 かち／0 まけ まで まいターン 0。",
      "s11.step2.cap": "サンプルした ゲーム ひとつ。 ふとい くみが ひとつの ナッジを うごかす (s, a, r, s', a')。",
      "s11.tape.title": "サンプルした ゲーム ひとつ（あなたの ターン）",

      "s11.step3.kicker": "ステップ 3 / 3",
      "s11.step3.title":  "ゲームを やりこむ",
      "s11.step3.body":
        "では ほんばんで あいてと プレイ - かくりつは しらず、 (ポット バケツ, たちば) だけ みる。 ゲームごとに とおった セルを ナッジする。 " +
        "ばんめんが ひとりでに ぬられ、 りょういきが シーン 9 の DP の こたえに ちかづく： おおきな 21+ の ポットは バンク、 のこりは ふる - さくせんが けいけん だけで みつかる。 " +
        "ちかさバーは 100% より すこし したで おちつく： のこるのは つぎめの セル、 せいかいでも コインの うらおもて (ROLL と HOLD が 1% いない) で、 バケツの レンズでは みわけられない - シーン 10 が けいこくした ぼやけ。",
      "s11.play":      "プレイ",
      "s11.pause":     "ポーズ",
      "s11.next_game": "+1 ゲーム",
      "s11.speed":     "はやさ",
      "s11.speed.slow": "おそい",
      "s11.speed.fast": "はやい",
      "s11.eps":       "たんさく e =",
      "s11.alpha":     "ステップ a = {a}（こてい）",
      "s11.games":     "プレイした ゲーム: {n}",
      "s11.conv.label": "Q*（DPの こたえ）への ちかさ：",
      "s11.latest":    "さいきんの ゲーム（あなたの ターン）",
      "s11.latest.none": "プレイ か +1 ゲーム で やりこみ かいし。",
      "s11.win":  "かち",
      "s11.lose": "まけ",
      "s11.run_hint": "ヒント： epsilon を 0 に すると たんさくを やめ、 さいしょの くせで つまり、 ばんめんは かんせい しない。",

      "s11.legend.q":   "q[s,a] - まなんだ しょうりつの すいそく",
      "s11.legend.tgt": "DP の Q* - ゴール（シーン 9）",
    }
  });
})();

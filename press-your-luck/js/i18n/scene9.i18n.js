/* i18n fragment for scene 9 - dynamic programming fills Q* on the 6x3 board.
 * Deep-merged via window.I18N.register. English authoritative; jp mirror. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene9.title": "DP",
      "s9.heading": "COMPUTE THE WHOLE PLAYBOOK - EXACTLY",

      "s9.manager":
        "If you truly knew the odds and the rival's habits, you could compute " +
        "the entire optimal playbook - no guessing. The die is a flat 1-in-6 and " +
        "the rival is pinned (it holds at {hold}), so this is a single-agent " +
        "problem we can solve by sweeping the Bellman backup until nothing changes. " +
        "Watch 'bank earlier when ahead, push harder when behind' draw itself.",

      "s9.formula.label": "SWEEP THIS UNTIL IT STOPS CHANGING",
      "s9.assumption":
        "ASSUMING: the die is a known flat 1/6 - and the RIVAL holds at {hold}. " +
        "Both are gifts. Hold that thought.",

      "s9.btn.step": "STEP SWEEP",
      "s9.btn.run":  "RUN ALL",
      "s9.btn.reset": "RESET",

      "s9.status.sweep": "SWEEP",
      "s9.status.locked": "CELLS LOCKED",

      "s9.legend.roll": "ROLL region (push for more)",
      "s9.legend.hold": "HOLD region (bank it)",
      "s9.legend.pending": "not resolved yet",

      "s9.panel.ready.title": "READY TO SWEEP",
      "s9.panel.ready.body":
        "Every cell starts unknown. Each sweep applies the Bellman backup to all " +
        "18 situations at once, reading next-situation win-odds off the previous " +
        "pass. Press STEP SWEEP - or RUN ALL.",

      "s9.phase.1.title": "SWEEP 1 - THE CHEAP POTS LOCK TO ROLL",
      "s9.phase.1.body":
        "With only a few chips on the table, a bust barely stings - one more roll " +
        "is plainly worth it. The whole low-pot floor locks to ROLL across every " +
        "standing.",

      "s9.phase.2.title": "SWEEP 2 - THE HOLD CORNER APPEARS",
      "s9.phase.2.body":
        "Up at 21+, a rolled 1 would wipe a fat pot. When you are EVEN or AHEAD " +
        "that risk is not worth it - those two cells flip to HOLD first. The blue " +
        "region is born in the top corner.",

      "s9.phase.3.title": "SWEEP 3 - THE STAIRCASE REACHES DOWN (AHEAD)",
      "s9.phase.3.body":
        "Here is the twist drawing itself: when you are AHEAD you bank EARLIER - " +
        "HOLD reaches down to the 16-20 pot, a whole bucket below where EVEN or " +
        "BEHIND would ever consider it. Protect the lead.",

      "s9.phase.4.title": "SWEEP 5 - THE CONTESTED MIDDLE SETTLES",
      "s9.phase.4.body":
        "The close calls resolve last. A 21+ pot is finally worth banking even " +
        "when BEHIND, and the mid pots near the break-even of 20 confirm ROLL. " +
        "The seam is now a staircase, not a flat line.",

      "s9.phase.5.title": "CONVERGED - THE EXACT OPTIMAL PLAYBOOK",
      "s9.phase.5.body":
        "Nothing changes on further sweeps: this IS Q*. Two regions, and a seam " +
        "that CLIMBS from AHEAD up to BEHIND - HOLD reaches down to a 16-20 pot " +
        "when ahead, but only kicks in above 20 when behind. Same dice, different " +
        "best lever, because the scoreboard changed.",
      "s9.phase.5.foot":
        "Win-odds shown per cell are exact win probabilities. Start-of-game odds " +
        "for you: {start}.",

      "s9.bridge":
        "This worked because we KNEW the die and PINNED the rival. Pull either " +
        "gift away and the exact sweep is impossible - next, why."
    },
    jp: {
      "scene9.title": "DP",
      "s9.heading": "プレイブック ぜんぶ を - せいかく に けいさん",

      "s9.manager":
        "もし かくりつ と あいて の くせ を ほんとう に しって いれば、 さいてき な " +
        "プレイブック ぜんぶ を けいさん できる - すいそく なし。 サイコロ は 6ぶんの1 で " +
        "いってい、 あいて は こてい（{hold} で キープ）。 だから これ は たんいち エージェント " +
        "もんだい で、 ベルマン バックアップ を かわらなく なる まで くりかえせば とける。 " +
        "「リード なら はやく バンク、 おくれ なら つよく おす」 が じどう で えがかれる。",

      "s9.formula.label": "かわらなく なる まで これ を くりかえす",
      "s9.assumption":
        "ぜんてい： サイコロ は きちの 6ぶんの1 - そして あいて は {hold} で キープ。 " +
        "どちら も おくりもの。 おぼえて おいて。",

      "s9.btn.step": "1スイープ",
      "s9.btn.run":  "ぜんぶ じっこう",
      "s9.btn.reset": "リセット",

      "s9.status.sweep": "スイープ",
      "s9.status.locked": "けってい セル",

      "s9.legend.roll": "ふる りょういき（もっと おす）",
      "s9.legend.hold": "キープ りょういき（バンク）",
      "s9.legend.pending": "まだ みけってい",

      "s9.panel.ready.title": "スイープ じゅんび",
      "s9.panel.ready.body":
        "ぜんぶ の セル は みち から はじまる。 かく スイープ は 18 の じょうきょう ぜんぶ に " +
        "ベルマン バックアップ を てきよう、 まえ の パス から さき の しょうりつ を よむ。 " +
        "1スイープ を おす - または ぜんぶ じっこう。",

      "s9.phase.1.title": "スイープ 1 - やすい ポット は ふる に けってい",
      "s9.phase.1.body":
        "チップ が すこし しか なければ、 バスト は ほとんど いたくない - もう ひとふり は " +
        "あきらか に わり に あう。 ひくい ポット の ゆか は すべて の たちば で ふる に けってい。",

      "s9.phase.2.title": "スイープ 2 - キープ の かど が あらわれる",
      "s9.phase.2.body":
        "21+ では、 1 が でれば ふとった ポット が きえる。 ごかく か リード なら その りすく は " +
        "わり に あわない - その 2セル が さき に キープ へ。 あおい りょういき が かど に うまれる。",

      "s9.phase.3.title": "スイープ 3 - かいだん が おりて くる（リード）",
      "s9.phase.3.body":
        "ツイスト が えがかれる： リード の とき は はやく バンク - キープ が 16-20 ポット まで " +
        "おりて くる、 ごかく や おくれ が かんがえる より まるごと 1バケツ した。 リード を まもる。",

      "s9.phase.4.title": "スイープ 5 - あらそう まんなか が おちつく",
      "s9.phase.4.body":
        "せっせん は さいご に きまる。 21+ ポット は おくれ でも やっと バンク する かち、 " +
        "そして ぶんきてん 20 ちかく の なか ポット は ふる を かくにん。 せっせん は いま " +
        "へいたん で なく かいだん。",

      "s9.phase.5.title": "しゅうそく - せいかく な さいてき プレイブック",
      "s9.phase.5.body":
        "もう スイープ しても かわらない： これ が Q*。 ふたつ の りょういき、 そして せっせん が " +
        "リード から おくれ へ のぼる - リード なら キープ が 16-20 ポット まで おりる、 " +
        "おくれ なら 20 を こえて から。 おなじ サイコロ、 ちがう ベスト レバー、 スコア が かわった から。",
      "s9.phase.5.foot":
        "セル ごと の しょうりつ は せいかく な しょうり かくりつ。 ゲーム かいし の あなた の " +
        "しょうりつ： {start}。",

      "s9.bridge":
        "これ が できた の は サイコロ を しり、 あいて を こてい した から。 どちら の おくりもの を " +
        "うばって も せいかく な スイープ は ふかのう - つぎ、 その りゆう。"
    }
  });
})();

/* i18n fragment for scene 10 - why DP does not scale.
 * Deep-merged via window.I18N.register. English authoritative; jp mirror. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene10.title": "Why DP doesn't scale",
      "s10.heading": "PERFECT-ODDS PLANNING IS A FANTASY",

      "s10.manager":
        "The exact sweep you just watched needed two gifts: you KNEW the dice, " +
        "and you KNEW the rival's rule. Real decisions hand you neither - and " +
        "even when they do, the real problem is far too big to compute cell by cell. " +
        "DP is the ideal, not the method.",

      /* Reason A - P is unknown, including the opponent. */
      "s10.a.tag": "REASON A",
      "s10.a.title": "YOU RARELY KNOW THE ODDS - OR THE OTHER PLAYER",
      "s10.a.formula.label": "the transition is hidden",
      "s10.a.body":
        "We ASSUMED the rival always holds at {hold} - that is what made the sweep " +
        "possible. But a real opponent never hands you their rule. Neither does a " +
        "market, a competitor, or a customer. In real life the 'die' is demand, " +
        "churn, a rival's next move - odds nobody prints on the side for you.",
      "s10.a.foot":
        "A smarter rival would shift the whole staircase. You cannot sweep a backup " +
        "over probabilities you do not have.",

      /* Reason B - the state space explodes. */
      "s10.b.tag": "REASON B",
      "s10.b.title": "THE BOARD EXPLODES",
      "s10.b.body":
        "Our toy buckets the pot into {nb} bins and the standing into {ns} - just " +
        "{display} cells you can sweep by hand. The TRUE game tracks both exact " +
        "scores (0-{maxscore} each) and the exact pot: tens of thousands of " +
        "situations. Add players or dice and it explodes past anything you can " +
        "enumerate.",

      "s10.b.stat.display.title": "WHAT WE DREW",
      "s10.b.stat.display.value": "{display}",
      "s10.b.stat.display.detail": "pot bucket x standing - the board on one screen",

      "s10.b.stat.exact.title": "TRUE 2-PLAYER GAME",
      "s10.b.stat.exact.value": "{exact}",
      "s10.b.stat.exact.detail": "exact scores ({maxscore} x {maxscore}) x exact pot - a {factor}x blow-up",

      "s10.b.stat.four.title": "ADD TWO MORE PLAYERS",
      "s10.b.stat.four.value": "{four}",
      "s10.b.stat.four.detail": "four exact scores x pot - and that is still a tiny game",

      "s10.bridge":
        "You never truly know the dice OR the other player, and the real problem is " +
        "too big to compute exhaustively. So how does anyone actually find the playbook?"
    },
    jp: {
      "scene10.title": "DP の げんかい",
      "s10.heading": "かんぺき な かくりつ の けいかく は げんそう",

      "s10.manager":
        "いま みた せいかく な スイープ は ふたつ の おくりもの が ひつよう だった： サイコロ を " +
        "しり、 あいて の ルール を しって いた。 げんじつ の けってい は どちら も くれない - " +
        "くれた として も、 ほんとう の もんだい は セル ごと に けいさん する に は おおき すぎる。 " +
        "DP は りそう で あって、 ほうほう で は ない。",

      "s10.a.tag": "りゆう A",
      "s10.a.title": "かくりつ も あいて も めったに わからない",
      "s10.a.formula.label": "せんい は かくれて いる",
      "s10.a.body":
        "あいて は つねに {hold} で キープ する と かてい した - それ が スイープ を かのう に した。 " +
        "でも ほんもの の あいて は ルール を おしえて くれない。 しじょう も、 きょうそう あいて も、 " +
        "きゃく も。 げんじつ で は 「サイコロ」 は じゅよう、 かいやく、 あいて の つぎ の て - " +
        "だれ も よこ に いんさつ して くれない かくりつ。",
      "s10.a.foot":
        "かしこい あいて なら かいだん ぜんたい が ずれる。 もって いない かくりつ で バックアップ は " +
        "できない。",

      "s10.b.tag": "りゆう B",
      "s10.b.title": "ボード が ばくはつ する",
      "s10.b.body":
        "この おもちゃ は ポット を {nb} こ、 たちば を {ns} こ に わける - て で スイープ できる " +
        "たった {display} セル。 ほんとう の ゲーム は せいかく な スコア（おのおの 0-{maxscore}） と " +
        "せいかく な ポット を おう： なん まん もの じょうきょう。 プレイヤー や サイコロ を ふやせば、 " +
        "れっきょ できる かぎり を こえて ばくはつ する。",

      "s10.b.stat.display.title": "えがいた もの",
      "s10.b.stat.display.value": "{display}",
      "s10.b.stat.display.detail": "ポット バケツ x たちば - 1がめん の ボード",

      "s10.b.stat.exact.title": "ほんとう の 2にん ゲーム",
      "s10.b.stat.exact.value": "{exact}",
      "s10.b.stat.exact.detail": "せいかく スコア（{maxscore} x {maxscore}） x せいかく ポット - {factor}ばい",

      "s10.b.stat.four.title": "あと 2にん ふやす と",
      "s10.b.stat.four.value": "{four}",
      "s10.b.stat.four.detail": "4つ の せいかく スコア x ポット - それ でも ちいさな ゲーム",

      "s10.bridge":
        "サイコロ も あいて も ほんとう に は わからず、 ほんとう の もんだい は れっきょ する に は " +
        "おおき すぎる。 では、 じっさい に どう やって プレイブック を みつける の か？"
    }
  });
})();

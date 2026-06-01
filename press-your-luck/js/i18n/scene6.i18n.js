/* i18n fragment for scene 6 - THE RETURN G_t + objective E[G_t]. English authoritative. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene6.title": "Return G_t",
      "scene6.heading": "THE RETURN, AND ITS EXPECTATION",
      "scene6.lede":
        "One game tells you nothing - the payoff is a <b>distribution</b>. The return G is a random 0 / 1; the honest figure is its <b>expectation</b> E[G], the long-run win rate. Read it straight off the tree.",
      "scene6.formula.label": "THE RETURN FROM HERE",
      "scene6.formula.foot":
        "Reward is 0 every turn until the end, so the sum collapses to 1 (eventually win) or 0 (eventually lose). The return IS the win/loss from here - a random 0 or 1.",
      "scene6.eg.label":
        "E[G_t] is the leaves of that same tree, each return weighted by its path probability. Situation: <b>{stand}</b>, pot <b>{pot}</b>, lever <b>{lever}</b>.",
      "scene6.eg.tie":
        "The weighted leaf sum is <b>E[G_t] = {eg}</b> - the win probability <b>{pct}%</b>. That is exactly <b>Q*(s, ROLL)</b>: the return G_t, averaged, IS the optimal action-value.",
      "scene6.qstar.label": "THE OBJECTIVE",
      "scene6.qstar.foot":
        "Q* is the BEST expected return - the win probability of the smartest lever, then smart play. Here E[G_t] under ROLL equals it because ROLL is optimal in this spot.",
      "scene6.exp.title": "PROVE IT BY PLAYING",
      "scene6.exp.hint": "(sample games; the win rate walks toward E[G_t])",
      "scene6.exp.explainer":
        "Force the first lever, then play smart to the end. One game is a 0 or 1; over many games the win rate converges to the exact win probability - the E[G_t] the ledger just computed.",
      "scene6.lever.prompt": "Force the first lever:",
      "scene6.btn.one": "PLAY 1 GAME",
      "scene6.btn.many": "PLAY 200 GAMES",
      "scene6.btn.reset": "RESET",
      "scene6.one.label": "LAST G =",
      "scene6.strip.label": "Recent single games (each is one 0 / 1)",
      "scene6.strip.empty": "no games yet",
      "scene6.bar.empty": "Play games to fill the win-rate bar.",
      "scene6.bar.target": "target: exact win prob {dp}%",
      "scene6.bar.readout":
        "Win rate <b>{rate}%</b> ({wins} / {total} games) &middot; <span class=\"ret-dp\">exact win prob {dp}%</span>",
      "scene6.bridge":
        "So E[G_t] is the win probability, and the best lever's value is Q*. But how do we COMPUTE Q* without simulating millions of games? One more roll at a time - that is the Bellman equation.",
    },
    jp: {
      "scene6.title": "リターン G_t",
      "scene6.heading": "リターンと その きたいち",
      "scene6.lede":
        "1ゲームでは なにも わからない - ほうしゅうは <b>ぶんぷ</b> です。 リターン G は ランダムな 0 / 1。 しんじつの すうじは その <b>きたいち</b> E[G]、 ながい めの しょうりつ。 きから ちょくせつ よみとろう。",
      "scene6.formula.label": "ここからの リターン",
      "scene6.formula.foot":
        "ほうしゅうは おわるまで まいターン 0。 だから わは 1 (やがて かち) か 0 (やがて まけ)。 リターン = ここからの かちまけ、 ランダムな 0 か 1。",
      "scene6.eg.label":
        "E[G_t] は おなじ きの は を、 みちの かくりつで おもみづけ した わ。 じょうきょう： <b>{stand}</b>、 ポット <b>{pot}</b>、 レバー <b>{lever}</b>。",
      "scene6.eg.tie":
        "おもみづけ した は の わは <b>E[G_t] = {eg}</b> - しょうりつ <b>{pct}%</b>。 これは まさに <b>Q*(s, ROLL)</b>： リターン G_t の へいきんが さいてき こうどう かち そのもの。",
      "scene6.qstar.label": "もくてき",
      "scene6.qstar.foot":
        "Q* は さいこうの きたいリターン - いちばん かしこい レバーの しょうりつ、 そして かしこい プレイ。 ここでは ROLL が さいてき なので ROLL の E[G_t] が それに ひとしい。",
      "scene6.exp.title": "プレイして たしかめる",
      "scene6.exp.hint": "(ゲームを サンプル； しょうりつが E[G_t] へ)",
      "scene6.exp.explainer":
        "さいしょの レバーを きめ、 あとは さいてきに さいごまで。 1ゲームは 0 か 1； たくさんの ゲームで しょうりつは せいみつ しょうりつ - いま だいちょうが だした E[G_t] - に しゅうそく します。",
      "scene6.lever.prompt": "さいしょの レバー：",
      "scene6.btn.one": "1ゲーム プレイ",
      "scene6.btn.many": "200ゲーム プレイ",
      "scene6.btn.reset": "リセット",
      "scene6.one.label": "ちょくぜん G =",
      "scene6.strip.label": "さいきんの 1ゲーム (おのおの 0 / 1)",
      "scene6.strip.empty": "まだ ゲーム なし",
      "scene6.bar.empty": "ゲームを して しょうりつバーを うめよう。",
      "scene6.bar.target": "もくひょう： せいみつ しょうりつ {dp}%",
      "scene6.bar.readout":
        "しょうりつ <b>{rate}%</b> ({wins} / {total} ゲーム) &middot; <span class=\"ret-dp\">せいみつ しょうりつ {dp}%</span>",
      "scene6.bridge":
        "E[G_t] は しょうりつ、 さいぜんの レバーの かちが Q*。 でも なんびゃくまんゲームも シミュレーション せずに どう Q* を けいさん する？ 1かいずつ ふる - それが ベルマンの しき です。",
    },
  });
})();

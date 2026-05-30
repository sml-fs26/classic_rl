/* i18n fragment for scene 7 - THE OPTIMAL ACTION-VALUE Q*. English authoritative. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene7.title": "Q*(s, a)",
      "scene7.heading": "THE HONEST WIN-ODDS OF EACH LEVER",
      "scene7.lede":
        "Q*(s, lever) is the true long-run win probability of pulling that lever now, then playing smart to the end. The surprise: with the <b>exact same chips on the table</b>, the best lever changes with the scoreboard.",
      "scene7.formula.label": "OPTIMAL ACTION-VALUE",
      "scene7.formula.foot":
        "The best expected return after lever a in situation s. Since the return is win(1)/lose(0), Q* is just a win probability - the most manager-legible number there is.",
      "scene7.sel.prompt": "Hold the pot at 18. Flip the scoreboard:",
      "scene7.state.label": "situation s",
      "scene7.card.caption":
        "pot <b>{pot}</b> &middot; you <b>{my}</b> vs rival <b>{riv}</b> &middot; {stand}",
      "scene7.col.action": "LEVER a",
      "scene7.col.q": "Q*(s, a) = WIN PROB",
      "scene7.gap": "The two levers differ by just {gap} points here.",
      "scene7.verdict.behind":
        "ROLL wins. Banking a safe 18 still leaves you losing - so you push for the catch-up, even though a 1 wipes it. Desperation is rational.",
      "scene7.verdict.even":
        "ROLL, barely. You are right on the break-even of 20, so the levers are within a hair. This is exactly where judgment earns its keep.",
      "scene7.verdict.ahead":
        "HOLD wins. You are winning with a healthy pot; the 1-in-6 bust could hand momentum to the rival. Banking nails down your edge. Protect the lead.",
      "scene7.bridge":
        "Same eighteen chips, but the star moved from ROLL to HOLD as you went from behind to ahead. The best lever is a function of the whole situation. Could we compute that star for every cell at once?",
    },
    jp: {
      "scene7.title": "Q*(s, a)",
      "scene7.heading": "かく レバーの しんじつの しょうりつ",
      "scene7.lede":
        "Q*(s, レバー) は その レバーを いま ひき、 あとは さいてきに プレイした ときの しんの ながきの しょうりつ。 おどろき： <b>だいの うえの チップが まったく おなじ</b> でも、 さいぜんの レバーは スコアボードで かわる。",
      "scene7.formula.label": "さいてき こうどう かち",
      "scene7.formula.foot":
        "じょうきょう s で レバー a の あとの さいだい きたい リターン。 リターンは かち(1)/まけ(0) なので、 Q* は しょうりつ そのもの - もっとも わかりやすい すうじ。",
      "scene7.sel.prompt": "ポットを 18に こてい。 スコアボードを きりかえ：",
      "scene7.state.label": "じょうきょう s",
      "scene7.card.caption":
        "ポット <b>{pot}</b> &middot; じぶん <b>{my}</b> たい あいて <b>{riv}</b> &middot; {stand}",
      "scene7.col.action": "レバー a",
      "scene7.col.q": "Q*(s, a) = しょうりつ",
      "scene7.gap": "ここでは 2つの レバーの さは わずか {gap} ポイント。",
      "scene7.verdict.behind":
        "ロールが かち。 あんぜんな 18を バンクしても まだ まけ - だから 1で きえても おいあげに いどむ。 ひっしさは ごうり てき。",
      "scene7.verdict.even":
        "かろうじて ロール。 ぶんきてんの 20 ちょうど なので、 レバーは ごくさ。 まさに はんだんが いきる ところ。",
      "scene7.verdict.ahead":
        "ホールドが かち。 じゅうぶんな ポットで リードちゅう。 6ぶんの1の バストで あいてに ながれを わたしかねない。 バンクで ゆういを かためる。 リードを まもれ。",
      "scene7.bridge":
        "おなじ 18の チップ。 でも おくれから リードへ うつると、 ほしは ロールから ホールドへ うごいた。 さいぜんの レバーは じょうきょう ぜんたいの かんすう。 その ほしを ぜんセル いちどに けいさん できる？",
    },
  });
})();

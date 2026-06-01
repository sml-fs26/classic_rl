/* i18n fragment for scene 5 - THE TRAJECTORY TREE. English authoritative. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene5.title": "Trajectory",
      "scene5.heading": "ONE GAME IS ONE PATH",
      "scene5.lede":
        "A run is a <b>sequence</b>. But from one situation the die can fall many ways, so the possible runs form a <b>tree</b>: every branch is a die outcome, every leaf an ending. One actual game is just <b>one root-to-leaf path</b> through it.",
      "scene5.formula.label": "THE TRAJECTORY (random until it happens)",
      "scene5.formula.foot":
        "Capital letters: each entry was a roll of the die before it landed. Reward R is 0 every turn until the terminal +1 (you win) or 0 (the rival wins).",
      "scene5.tree.foot": "One trajectory = one path through the tree.",
      "scene5.tree.caption":
        "Fixed situation: <b>{stand}</b>, pot <b>{pot}</b>. We hold the lever at <b>{lever}</b> (the smart move when you are behind) and branch only on the die. p = the chance of that face; r = the reward (0 until the game ends).",
      "scene5.tree.bootnote":
        "Roll a 2-6 and you are one bank from 50; roll a 1 and you BUST - the dice pass to the rival. A leaf that is not the end is labelled with its value-to-go (a win probability): the part you do not control.",
      "scene5.rival.tag": "rival to move",
      "scene5.btn.sample": "SAMPLE A PATH",
      "scene5.btn.step": "STEP",
      "scene5.btn.reset": "RESET",
      "scene5.status.hint": "Hover a leaf to light its path. SAMPLE draws one game.",
      "scene5.status.walking": "Walking one path, ply by ply...",
      "scene5.status.sampled": "Sampled one trajectory: {outcome}",
      "scene5.status.win": "you WIN",
      "scene5.status.lose": "you LOSE",
      "scene5.status.rival": "BUST - dice pass to the rival (win prob {v})",
      "scene5.status.playon": "you keep rolling (win prob {v})",
      "scene5.terminal.mini": "terminal",
      "scene5.derived.label": "THE LIT PATH, written as the old tape (S, A, R, ...)",
      "scene5.derived.empty": "Sample or step a path to write it out here.",
      "scene5.derived.rival": "rival to move",
      "scene5.derived.playon": "your move",
      "scene5.derived.vto": "value-to-go {v}",
      "scene5.derived.g": "G of this path = {g}  (its win probability)",
      "scene5.caption":
        "Hover or tap any leaf (in the tree or the ledger) to light its whole root-to-leaf path. Press SAMPLE a few times: same situation, same lever, a different path every run - that is what makes a run a random variable.",
    },
    jp: {
      "scene5.title": "きせき",
      "scene5.heading": "1ゲームは 1つの みち",
      "scene5.lede":
        "プレイは <b>れつ</b> です。 でも おなじ じょうきょうから さいは いろいろに おちる。 だから ありうる プレイは <b>き</b> を つくる： えだは さいの でめ、 はは おわり。 じっさいの 1ゲームは その なかの <b>1つの ねから はへの みち</b> です。",
      "scene5.formula.label": "きせき (おきるまで ランダム)",
      "scene5.formula.foot":
        "おおもじ： かく こうもくは おちるまえは さいの め。 ほうしゅう R は おわるまで まいターン 0、 さいごに +1 (かち) か 0 (まけ)。",
      "scene5.tree.foot": "1つの きせき = きの なかの 1つの みち。",
      "scene5.tree.caption":
        "こていの じょうきょう： <b>{stand}</b>、 ポット <b>{pot}</b>。 レバーは <b>{lever}</b> に こてい (おくれている ときの かしこい て) し、 さいの でめ だけで わかれます。 p = その めの かくりつ、 r = ほうしゅう (おわるまで 0)。",
      "scene5.tree.bootnote":
        "2-6なら 50まで あと バンク 1かい。 1なら バスト - さいは あいてへ。 おわりでない はには のこりの かち (しょうりつ) が つきます： じぶんで コントロール できない ぶぶん。",
      "scene5.rival.tag": "あいての ばん",
      "scene5.btn.sample": "みちを サンプル",
      "scene5.btn.step": "ステップ",
      "scene5.btn.reset": "リセット",
      "scene5.status.hint": "はに カーソルで みちが ひかる。 サンプルで 1ゲーム。",
      "scene5.status.walking": "1つの みちを 1てずつ...",
      "scene5.status.sampled": "1つの きせきを サンプル： {outcome}",
      "scene5.status.win": "かち",
      "scene5.status.lose": "まけ",
      "scene5.status.rival": "バスト - さいは あいてへ (しょうりつ {v})",
      "scene5.status.playon": "ふりつづける (しょうりつ {v})",
      "scene5.terminal.mini": "しゅうたん",
      "scene5.derived.label": "ひかった みちを むかしの テープで (S, A, R, ...)",
      "scene5.derived.empty": "みちを サンプル/ステップ すると ここに かかれます。",
      "scene5.derived.rival": "あいての ばん",
      "scene5.derived.playon": "あなたの ばん",
      "scene5.derived.vto": "のこりかち {v}",
      "scene5.derived.g": "この みちの G = {g}  (その しょうりつ)",
      "scene5.caption":
        "き でも だいちょう でも、 はに カーソル/タップ すると ねから はへの みち ぜんたいが ひかります。 サンプルを なんかい か： おなじ じょうきょう・おなじ レバーでも まいかい ちがう みち - だから プレイは かくりつ へんすう なのです。",
    },
  });
})();

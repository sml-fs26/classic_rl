/* i18n fragment for scene 12 - Recap. Deep-merged via I18N.register.
   English authoritative; Japanese mirrors it line for line.

   Card titles/texts default to window.DATA.recap (English) but are
   overridable here so the Japanese build reads naturally; the scene falls
   back to DATA.recap when a key is missing. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene12.title": "Recap",

      "scene12.banner": "WHAT YOU LEARNED",
      "scene12.sub": "Six ideas, one die. The bones of reinforcement learning, in the language of the table.",

      /* Card titles + texts mirror window.DATA.recap (kept here so the
         Japanese build can translate them; English stays the source). */
      "scene12.card.mdp.title": "THE FOUR-PART FRAME",
      "scene12.card.mdp.text": "The situation is (pot, standing). The lever is ROLL or HOLD. The part you do not control is the die. The payoff is binary: +1 if you reach 50 first, 0 if the rival does.",
      "scene12.card.policy.title": "YOUR PLAYBOOK",
      "scene12.card.policy.text": "A policy assigns one lever to every cell of the board. The naive playbook banks at 20 and ignores the scoreboard. The good one reads your standing.",
      "scene12.card.return.title": "THE WIN, NOT THE GAME",
      "scene12.card.return.text": "The return from here is the eventual win or loss: 1 or 0. Judge a lever by its win RATE over many games, never by one lucky roll.",
      "scene12.card.qstar.title": "THE HONEST WIN-ODDS",
      "scene12.card.qstar.text": "Q*(s, lever) is the true long-run win probability of pulling that lever now, then playing smart. At pot 18 the best lever flips on standing alone: ROLL when behind, HOLD when ahead.",
      "scene12.card.dp.title": "THE EXACT PLAYBOOK",
      "scene12.card.dp.text": "Knowing the die (a flat 1/6) and pinning the rival makes this a single-agent MDP. Sweep the Bellman backup to a fixed point and the climbing staircase draws itself.",
      "scene12.card.sarsa.title": "LEARN IT BY PLAYING",
      "scene12.card.sarsa.text": "Drop the model. Play game after game, nudge the table toward what actually happened, and the same press-when-behind, bank-when-ahead rule emerges on its own.",

      /* Tiny captions printed under each card glyph (the "table voice"). */
      "scene12.glyph.mdp": "(pot, standing) · ROLL/HOLD · die · win/lose",
      "scene12.glyph.policy": "one lever per cell",
      "scene12.glyph.return": "G from here = 1 or 0",
      "scene12.glyph.qstar": "same pot, lever flips on standing",
      "scene12.glyph.dp": "sweep to a fixed point",
      "scene12.glyph.sarsa": "trial · outcome · adjust",

      "scene12.seescene": "scene {n}",

      /* The closing boardroom line - the durable insight. */
      "scene12.closing": "You have learned when to press your luck - and the bones of reinforcement learning. The durable takeaway: your risk appetite should depend on whether you are ahead or behind."
    },
    jp: {
      "scene12.title": "まとめ",

      "scene12.banner": "まなんだ こと",
      "scene12.sub": "むっつの かんがえ、 ひとつの さいころ。 きょうかがくしゅうの ほねぐみを、 テーブルの ことばで。",

      "scene12.card.mdp.title": "よっつの ぶぶん",
      "scene12.card.mdp.text": "じょうきょうは (ポット、 たちば)。 レバーは ふる か キープ。 コントロール できないのは さいころ。 みかえりは 0か1： さきに 50なら +1、 あいてが さきなら 0。",
      "scene12.card.policy.title": "あなたの プレイブック",
      "scene12.card.policy.text": "ほうさくは ボードの すべての マスに レバーを ひとつ わりあてる。 たんじゅんな プレイブックは 20で バンクし スコアを むしする。 よいものは たちばを よむ。",
      "scene12.card.return.title": "しょうはい、 1ゲームでは ない",
      "scene12.card.return.text": "ここからの リターンは さいごの しょうはい： 1か0。 レバーは たくさんの ゲームの しょうりリツで はんだん。 まぐれの 1かいでは ない。",
      "scene12.card.qstar.title": "しょうじきな しょうりオッズ",
      "scene12.card.qstar.text": "Q*(s, レバー) は いま その レバーを ひいて かしこく つづけた ときの しんの しょうりかくりつ。 ポット18では さいぜんの レバーが たちばだけで かわる： おくれなら ふる、 リードなら キープ。",
      "scene12.card.dp.title": "せいかくな プレイブック",
      "scene12.card.dp.text": "さいころ（いちりつ 1/6）を しり あいてを こていすると、 これは ひとりエージェントの MDP。 ベルマンこうしんを ふどうてんまで くりかえせば かいだんが ひとりでに えがかれる。",
      "scene12.card.sarsa.title": "プレイして まなぶ",
      "scene12.card.sarsa.text": "モデルを すてる。 ゲームを なんども プレイし、 じっさいに おきた ことへ テーブルを よせる。 すると おなじ「おくれたら おす、 リードなら バンク」の ルールが ひとりでに あらわれる。",

      "scene12.glyph.mdp": "(ポット、たちば) · ふる/キープ · さいころ · しょうはい",
      "scene12.glyph.policy": "マスごとに レバー ひとつ",
      "scene12.glyph.return": "ここからの G = 1 か 0",
      "scene12.glyph.qstar": "おなじポット、たちばで レバーが かわる",
      "scene12.glyph.dp": "ふどうてんまで くりかえす",
      "scene12.glyph.sarsa": "ためす · けっか · ちょうせい",

      "scene12.seescene": "シーン {n}",

      "scene12.closing": "あなたは いつ うんを ためすかを まなんだ。 そして きょうかがくしゅうの ほねぐみを。 ながく のこる きょうくん： リスクの とりかたは、 リードか おくれかで かわるべき。"
    }
  });
})();

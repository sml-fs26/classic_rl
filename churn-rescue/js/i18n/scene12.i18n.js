/* i18n fragment for scene 12 (recap). English authoritative. Scene-local
   keys only; shared vocabulary (tiers, levers, coin/die, ledger) and the
   per-card titles / captions / symbols live elsewhere: the card copy comes
   from window.DATA.recap, the lever costs from the i18n core. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title12': "Recap",
      /* The closing send-off, reused as the footer line. */
      'scene12.hook':
        "You've learned the bones of reinforcement learning, and you already make these calls every quarter.",

      'recap.banner': "THE BONES OF RL",
      'recap.sub':
        "Six ideas, each one a decision you already own. Here is the vocabulary, hung on the Churn Rescue board.",

      /* MDP glyph: the S / A / P / R micro-strip labels (concrete instances
         from this example). */
      'recap.mdp.s': "TIER × MO.",
      'recap.mdp.a': "3 LEVERS",
      'recap.mdp.p': "COIN, DIE",
      'recap.mdp.r': "−COST ±20",

      /* Q* glyph: which state the starred lever row is read from. */
      'recap.qstar.state': "THRIVING · m=1",

      'notes.scene12':
        "<p>The send-off. Six cards, one per concept, each anchored to the artifact the student actually touched: the account card + dice for MDP, the coloured 5x5 board for POLICY, the cost tape and twin-spike histogram for RETURN, the starred lever row for Q*, the grid filling from the terminals for DP, the s,a,r,s',a' tape for SARSA.</p>" +
        "<p>The POLICY mini-map and the Q* row are painted from the same data the deck computed, so the grey corner / blue band / gold wedge / blue notch and the THRIVING m=1 numbers match what they saw.</p>" +
        "<p>Close on the line they should leave with: the vocabulary now has hooks onto decisions they make every quarter. State, action, policy, return, Q*, Bellman, DP, exploration, SARSA: not jargon, just the renewal-save call, named.</p>",
    },
    jp: {
      'scene.title12': "おさらい",
      'scene12.hook':
        "RLの ほねぐみを まなんだ。 まいしはんき、 もう これらの けっていを している。",

      'recap.banner': "RLの ほねぐみ",
      'recap.sub':
        "むっつの かんがえ、 どれも すでに あなたの けってい。 チャーンレスキューの ボードに かけた ことば。",

      'recap.mdp.s': "ティア × つき",
      'recap.mdp.a': "3レバー",
      'recap.mdp.p': "コイン・サイコロ",
      'recap.mdp.r': "−コスト ±20",

      'recap.qstar.state': "こうちょう · m=1",

      'notes.scene12':
        "<p>むすびの シーン。 むっつの カード、 かくがいねんを じっさいに ふれた アーティファクトに ひもづける: MDPは アカウントカードと さいころ、 POLICYは いろつき 5x5 ボード、 RETURNは コストテープと ヒストグラム、 Q*は ほしつき レバーぎょう、 DPは たんまつから うまる グリッド、 SARSAは s,a,r,s',a' テープ。</p>" +
        "<p>POLICYマップと Q*ぎょうは デッキが けいさんした データから えがく。 はいいろのかど・あおのおび・きんのくさび・あおのノッチ、 そして こうちょう m=1 の すうちが いっちする。</p>" +
        "<p>のこすべき ことば: まいしはんき おこなう けっていに ことばの フックが ついた。</p>",
    },
  });
})();

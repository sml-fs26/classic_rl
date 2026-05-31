/* i18n fragment for scene 0 (title / hook). English authoritative.
   Scene-local keys only; shared vocabulary (tiers, levers, coin/die,
   ledger) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title0': "CHURN RESCUE",
      'scene0.hook':  "This customer is drifting. You have three levers and five months. What do you spend?",
      'scene0.start': "PRESS START",
      'scene0.credits': "SML · ETH ZURICH · CLASSIC RL",
      'notes.scene0':
        "<p>The hook scene. The hero card starts THRIVING and visibly cools to LUKEWARM while the renewal countdown ticks 5, 4, 3 months: a customer drifting toward the exit.</p>" +
        "<p>Frame it as the renewal-save call they already make every quarter: an account cools, the clock runs, and someone wants to throw a discount at it. Three levers (do nothing / check-in / big offer), five months, one renewal to win or lose.</p>" +
        "<p>PRESS START dissolves the card into the empty 5x5 retention map: the board the whole deck will fill in. The promise is simple: by the end they will have seen the math behind that gut call.</p>",
    },
    jp: {
      'scene.title0': "チャーン レスキュー",
      'scene0.hook':  "この おきゃくは はなれかけ。 レバーは みっつ、 のこり 5かげつ。 なにに つかう？",
      'scene0.start': "スタート",
      'scene0.credits': "SML · ETH ZURICH · CLASSIC RL",
      'notes.scene0':
        "<p>フックの シーン。 ヒーローカードは こうちょうから はじまり、 こうしんカウントダウンが 5, 4, 3かげつと へるあいだに なまぬるいまで さがる: でぐちへ ながれていく おきゃく。</p>" +
        "<p>まいしはんき おこなう こうしんレスキューの けっていとして つたえる。 レバーは みっつ、 のこり 5かげつ、 かつか まけるか ひとつの こうしん。</p>" +
        "<p>スタートで カードが からの 5x5 リテンションマップに とけこむ: デッキぜんたいで うめていく ボード。</p>",
    },
  });
})();

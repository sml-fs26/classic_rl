/* i18n fragment for scene 2 (Playtest: you run it). English authoritative.
   Scene-local keys only; shared vocabulary (tier names, lever names + costs,
   coin/die, ledger title/balance, terminals) lives in the i18n core. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title2': "Playtest: you run it",
      'scene2.hook':  "Run one account to renewal or churn, month by month.",

      'play.section_title': "You run this account",
      'play.restart':       "↻ NEW ACCOUNT",
      'play.caption':
        "Pull a lever each month. You pick the coin; you don't pick how it lands.",

      /*, status / narration line, */
      'play.status.start':    "LUKEWARM account, renewal coming up. Pull a lever.",
      'play.status.pulled':   "You pulled {lever}. Flipping the retention coin...",
      'play.status.advanced': "They stayed. Now {tier}, one month closer. Pull again.",
      'play.status.renewed':  "RENEWED! The contract is banked: +20.",
      'play.status.churned':  "CHURNED. They walked: -20.",

      /*, margin-ledger rows, */
      'play.ledger.empty':       "(no moves yet)",
      'play.ledger.month_lever': "MO {m}  {lever}",
      'play.ledger.renew_lump':  "RENEWAL  ✓",
      'play.ledger.churn_lump':  "CHURN  ✗",
    },

    jp: {
      'scene.title2': "プレイテスト: じぶんで うごかす",
      'scene2.hook':  "ひとつの アカウントを つきごとに こうしんか りだつまで うごかす。",

      'play.section_title': "この アカウントを うごかす",
      'play.restart':       "↻ あたらしい アカウント",
      'play.caption':
        "毎月 レバーを ひく。 コインは えらべるが、 でかたは えらべない。",

      'play.status.start':    "なまぬるい アカウント。 こうしん まぢか。 レバーを ひく。",
      'play.status.pulled':   "{lever} を ひいた。 いじ コインを なげる...",
      'play.status.advanced': "のこった。 いまは {tier}、 つきが ひとつ ちかづいた。",
      'play.status.renewed':  "こうしん！ けいやくを かくほ： +20。",
      'play.status.churned':  "りだつ。 はなれた： -20。",

      'play.ledger.empty':       "（まだ なし）",
      'play.ledger.month_lever': "{m}つきめ  {lever}",
      'play.ledger.renew_lump':  "こうしん  ✓",
      'play.ledger.churn_lump':  "りだつ  ✗",
    },
  });
})();

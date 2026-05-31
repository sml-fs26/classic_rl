/* i18n fragment for scene 10 (why DP does not scale). English
   authoritative. Scene-local keys only; shared vocabulary lives in the
   i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title10': "Why DP doesn't scale",
      'scene10.hook':  "You rarely know the model, and real state spaces explode.",

      's10.heading': "Dynamic programming is the ideal we cannot run",
      's10.hook':    "The last scene computed a perfect playbook. It rested on two gifts the real world does not give you. Here are both caveats, plainly.",

      's10.a.tag':   "Caveat 1",
      's10.a.title': "You rarely know the model",
      's10.a.b1':    "Our DP sweep only worked because WE wrote the retention coin and the engagement die. In the wild, nobody hands you the true odds for your customers.",
      's10.a.b2':    "How a discount actually shifts churn, how a check-in really moves engagement, is unknown until you try it on real accounts and watch.",

      's10.b.tag':   "Caveat 2",
      's10.b.title': "The board explodes",
      's10.b.board': "Our toy board",
      's10.b.ours':  "Our board",
      's10.b.real':  "A real account",
      's10.b.b1':    "A real account is not 25 cells. Track a handful of everyday signals at even a coarse resolution and the grid blows past {exp} digits. You cannot enumerate it, let alone sweep every cell.",

      's10.signal.usage':     "usage",
      's10.signal.tickets':   "support tickets",
      's10.signal.sentiment': "sentiment",
      's10.signal.seats':     "seat count",
      's10.signal.nps':       "NPS",
      's10.signal.tenure':    "tenure",

      's10.bridge': "DP is the ideal we cannot run: the perfect model is a fantasy, and the real world is too big to spreadsheet. So how do we get a good playbook anyway? Next: learn it by playing.",
    },
    jp: {
      'scene.title10': "なぜ DPは スケールしない？",
      'scene10.hook':  "モデルは ふつう しらない。 げんじつの じょうたいは ばくはつする。",

      's10.heading': "どうてきけいかくほう は はしれない りそう",
      's10.hook':    "ぜんシーンは かんぺきな プレイブックを けいさん した。 それは げんじつが くれない ふたつの おくりもの に たよって いた。 その りょうほうの ちゅういてんを はっきり しめす。",

      's10.a.tag':   "ちゅうい 1",
      's10.a.title': "モデルは ふつう しらない",
      's10.a.b1':    "われわれの DP スイープが きいたのは、 いじコイン と エンゲージサイコロ を じぶんで かいた から。 げんじつでは、 あなたの こきゃくの しんの かくりつを だれも くれない。",
      's10.a.b2':    "わりびきが ほんとうに りだつを どう うごかすか、 チェックインが エンゲージを どう うごかすか は、 じっさいの アカウントで ためして みるまで わからない。",

      's10.b.tag':   "ちゅうい 2",
      's10.b.title': "ばんが ばくはつする",
      's10.b.board': "われらの おもちゃばん",
      's10.b.ours':  "われらの ばん",
      's10.b.real':  "じっさいの アカウント",
      's10.b.b1':    "じっさいの アカウントは 25マス では ない。 にちじょうの いくつかの シグナルを あらい かいぞうど でも おえば、 ばんは {exp} けた を こえる。 れっきょ できず、 ましてや ぜんマス を スイープ できない。",

      's10.signal.usage':     "りようりょう",
      's10.signal.tickets':   "サポート チケット",
      's10.signal.sentiment': "かんじょう",
      's10.signal.seats':     "シートすう",
      's10.signal.nps':       "NPS",
      's10.signal.tenure':    "けいやく きかん",

      's10.bridge': "DP は はしれない りそう: かんぺきな モデルは くうそう、 げんじつは おおきすぎて ひょうけいさん できない。 では どうやって よい プレイブックを えるか？ つぎ: プレイ して まなぶ。",
    },
  });
})();

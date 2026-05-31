/* i18n fragment for scene 9 (dynamic programming: fill Q*). English
   authoritative. Scene-local keys only; shared vocabulary lives in the
   i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title9': "Dynamic programming: fill Q*",
      'scene9.hook':  "Know the coin and the die, and the whole playbook is computable.",

      's9.heading': "Dynamic programming: compute the whole playbook",
      's9.hook':    "We wrote the retention coin and the engagement die ourselves, so we know exactly how customers respond. With the model in hand, we do not have to guess the best lever for any account: we can COMPUTE it for every cell at once.",
      's9.premise': "The trick: start at the renewal deadline, where a stay is an instant win, and work backwards one month at a time. Each column only needs the column to its left, so the values flow in from the right edge.",

      's9.btn.step':  "STEP",
      's9.btn.run':   "RUN ALL",
      's9.btn.reset': "RESET",

      's9.status.sweep': "Sweep",
      's9.status.delta': "Largest change",
      's9.status.huge':  "(blank)",

      's9.ready.title': "Blank board",
      's9.ready.body':  "No values yet. Each STEP fills one month-column, starting at m=1 (renewal imminent) on the left. Watch the coloured regions emerge.",

      's9.sweep1.title': "Sweep 1: m=1, renewal imminent",
      's9.sweep1.n1':    "With one month left, staying ends the contract on a +20 renewal right away, so these values are exact on the spot.",
      's9.sweep1.n2':    "The corners already lock: a THRIVING account renews on its own, so DO NOTHING (grey) wins; on the CLIFF only the BIG OFFER (gold) buys enough survival to pay off.",

      's9.sweep2.title': "Sweep 2: m=2",
      's9.sweep2.n1':    "Now each cell looks one month ahead into the m=1 column we just solved, and takes the best lever there as its future value.",
      's9.sweep2.n2':    "The middle band fills blue: a cheap CHECK-IN both lifts the coin and climbs the engagement die, compounding over the runway.",

      's9.sweep3.title': "Sweep 3: m=3",
      's9.sweep3.n1':    "Same backup, one column deeper. The grey corner, blue middle, and gold cliff wedge are now clearly drawn.",
      's9.sweep3.n2':    "AT-RISK still picks the BIG OFFER here: renewal is close, so lock it in before the account can slip away.",

      's9.sweep4.title': "Sweep 4: m=4, the NOTCH appears",
      's9.sweep4.n1':    "Here is the jewel. With a long runway, AT-RISK flips from gold to blue: the cheap CHECK-IN can drift the account back to safety over four months, so a one-shot discount is wasted.",
      's9.sweep4.n2':    "That blue notch biting into the gold wedge is the whole point: the right lever depends on the calendar, not just the health bar.",

      's9.sweep5.title': "Sweep 5: m=5, long runway",
      's9.sweep5.n1':    "The last column fills, and the notch holds: AT-RISK with the most runway also prefers the CHECK-IN.",
      's9.sweep5.n2':    "Every cell now has a value, and the largest change has dropped to zero. The board has converged.",

      's9.done.title': "Converged: this map IS the optimal playbook",
      's9.done.n1':    "Five backward sweeps and the colours stopped moving. The argmax lever in every cell is the provably best move for that account.",
      's9.done.n2':    "Read it at a glance: grey THRIVING corner (hold), blue middle band (cheap touch), gold CLIFF wedge (discount), and the blue NOTCH where at-risk-with-runway prefers the touch.",
      's9.done.n3':    "With a perfect model you could hand every rep this exact map. The catch is next: you almost never have the model.",
    },
    jp: {
      'scene.title9': "どうてきけいかくほう: Q* を うめる",
      'scene9.hook':  "コイン と サイコロ を しれば、 プレイブック ぜんたい が けいさん できる。",

      's9.heading': "どうてきけいかくほう: プレイブック ぜんたい を けいさん",
      's9.hook':    "いじコイン と エンゲージサイコロ を じぶんで かいた ので、 こきゃくの はんのう を せいかくに しっている。 モデル が あれば、 どの アカウント でも さいぜんの レバー を すいそく する ひつようは なく、 ぜんマス を いちどに けいさん できる。",
      's9.premise': "コツ: のこる が そくしょうり に なる こうしんきげん から はじめ、 1かげつ ずつ さかのぼる。 かく れつは ひだりどなりの れつ だけ ひつよう なので、 みぎはし から かちが ながれこむ。",

      's9.btn.step':  "ステップ",
      's9.btn.run':   "ぜんじっこう",
      's9.btn.reset': "リセット",

      's9.status.sweep': "スイープ",
      's9.status.delta': "さいだい へんかりょう",
      's9.status.huge':  "(くうはく)",

      's9.ready.title': "くうはくの ばん",
      's9.ready.body':  "まだ かちは ない。 ステップ ごとに 1かげつ れつ を うめる。 ひだりの m=1 (こうしん まぢか) から はじまる。 いろの りょういき が あらわれる のを みよう。",

      's9.sweep1.title': "スイープ1: m=1、 こうしん まぢか",
      's9.sweep1.n1':    "のこり1かげつ なら、 のこれば すぐに +20 の こうしん で おわる ので、 これらの かちは そくざに せいかく。",
      's9.sweep1.n2':    "すみは すでに かくてい: こうちょうな アカウントは ひとりでに こうしん する ので なにもしない(グレー)が かち、 がけっぷち では おおきな オファー(ゴールド)だけが せいぞん を かう。",

      's9.sweep2.title': "スイープ2: m=2",
      's9.sweep2.n1':    "いま かくマスは といた m=1 れつ を 1かげつ さき まで みて、 そこでの さいこうレバー を みらいかち と する。",
      's9.sweep2.n2':    "まんなかの おびが あおく うまる: やすい チェックイン は コインを あげ サイコロも のぼり、 ランウェイ じょうで ふくり に きく。",

      's9.sweep3.title': "スイープ3: m=3",
      's9.sweep3.n1':    "おなじ バックアップ を 1れつ ふかく。 グレーの すみ、 あおの まんなか、 ゴールドの がけ くさび が はっきり えがかれる。",
      's9.sweep3.n2':    "リスクあり は ここでも おおきな オファー: こうしんが ちかい ので、 にげられる まえに ロックイン。",

      's9.sweep4.title': "スイープ4: m=4、 ノッチ が あらわれる",
      's9.sweep4.n1':    "これが ほうせき。 ながい ランウェイ で リスクあり が ゴールド から あおへ はんてん: やすい チェックイン が 4かげつ かけて あんぜんへ もどせる ので、 いちどきりの わりびきは むだ。",
      's9.sweep4.n2':    "ゴールドの くさびに くいこむ あおの ノッチ こそ かなめ: ただしい レバーは ヘルスバー だけでなく カレンダー しだい。",

      's9.sweep5.title': "スイープ5: m=5、 ながい ランウェイ",
      's9.sweep5.n1':    "さいごの れつが うまり、 ノッチ は たもたれる: もっとも ランウェイの ある リスクあり も チェックイン を このむ。",
      's9.sweep5.n2':    "いま すべての マスに かちが あり、 さいだいへんかりょうは ゼロ に おちた。 ばんは しゅうそく した。",

      's9.done.title': "しゅうそく: この マップ こそ さいてき プレイブック",
      's9.done.n1':    "5かいの バックワード スイープ で いろが うごかなく なった。 かくマスの アーグマックス レバーは その アカウント の しょうめいずみ さいぜんしゅ。",
      's9.done.n2':    "ひとめで よめる: グレーの こうちょう すみ(ほじ)、 あおの まんなか おび(やすい せっしょく)、 ゴールドの がけ くさび(わりびき)、 そして リスクあり・ランウェイあり が せっしょく を このむ あおの ノッチ。",
      's9.done.n3':    "かんぺきな モデル が あれば この マップ を かく たんとうしゃ に わたせる。 もんだいは つぎ: モデル は ほとんど てに はいらない。",
    },
  });
})();

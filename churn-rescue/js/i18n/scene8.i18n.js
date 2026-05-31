/* i18n fragment for scene 8 (Bellman optimality). English authoritative.
   Scene-local keys only; shared vocabulary (tiers, levers, coin/die,
   ledger, terminals, months) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title8': "Bellman optimality",
      'scene8.hook':  "A lever is only as good as the situation it leaves you in next month.",

      's8.heading': "Bellman: today's value, defined by tomorrow",
      's8.hook':    "The honest value of a lever is what it costs you now PLUS the value of playing smart from wherever the coin and die leave you. That second part is the discipline against quarter-by-quarter thinking.",

      's8.gloss.cost':   "the cost / payoff you take right now",
      's8.gloss.future': "+ the value of playing optimally from next month's situation",

      's8.btn.step':  "STEP",
      's8.btn.reset': "RESET",
      's8.beat':      "STEP",

      's8.today': "This month",
      's8.next':  "Where it leaves you",
      's8.free':  "FREE",

      's8.coin.prompt':  "Flip the retention coin: do they stay?",
      's8.stay.prompt':  "If they stay, the die nudges next month's tier. Read each card's best-lever value.",
      's8.vstar':        "best lever",
      's8.total':        "Q* of {lever} at {state}",

      's8.note.ready':   "One cell, worked end to end: AT-RISK with 2 months left, pulling BIG OFFER. Press STEP to build its value the Bellman way.",
      's8.note.cost':    "Step 1: pull the lever. BIG OFFER debits 4 from the margin ledger right away. That is the \"cost now\" half of the equation.",
      's8.note.coin':    "Step 2: the retention coin decides stay or churn. Tails (6%) ends it on the CHURNED terminal, worth −20. No future to play from.",
      's8.note.die':     "Step 3: heads (94%) and the engagement die spreads the account across next month's cards. At EACH one we already know the best move's value, V*(S') = max over levers of Q*. These come straight from the solved board.",
      's8.note.combine': "Step 4: weight every branch by its probability and add. That probability-weighted average IS Q*(AT-RISK, m=2, BIG OFFER) = +7.76. Today's best move is defined by tomorrow's best move.",
    },
    jp: {
      'scene.title8': "ベルマン さいてきせい",
      'scene8.hook':  "レバーの よしあしは、 つぎつき おかれる じょうたい しだい。",

      's8.heading': "ベルマン: きょうの かち は あした で きまる",
      's8.hook':    "レバーの ほんとうの かちは、 いま はらう コスト と、 コイン と サイコロ が みちびく つぎの じょうたい で かしこく プレイ した かち の ごうけい。 この あとはん が めさき しこう への りっし。",

      's8.gloss.cost':   "いま うけとる コスト / みかえり",
      's8.gloss.future': "+ つぎつき の じょうたい から さいてき に プレイ した かち",

      's8.btn.step':  "ステップ",
      's8.btn.reset': "リセット",
      's8.beat':      "ステップ",

      's8.today': "こんげつ",
      's8.next':  "つぎの じょうたい",
      's8.free':  "むりょう",

      's8.coin.prompt':  "いじコインを なげる: のこる か？",
      's8.stay.prompt':  "のこれば サイコロが つぎつきの ティアを うごかす。 かくカードの さいこうレバーの かちを よむ。",
      's8.vstar':        "さいこうレバー",
      's8.total':        "{state} の {lever} の Q*",

      's8.note.ready':   "ひとつの マス を さいごまで: リスクあり・のこり2かげつ で おおきな オファー。 ステップ を おして ベルマンりゅう に かちを くみたてよう。",
      's8.note.cost':    "ステップ1: レバーを ひく。 おおきな オファー は すぐに りえきだいちょう から 4 を しはらう。 これが しきの 「いまの コスト」。",
      's8.note.coin':    "ステップ2: いじコインが のこる か はなれる かを きめる。 うら(6%)で りだつ ターミナル に おわり、 −20。 つづく みらいは ない。",
      's8.note.die':     "ステップ3: おもて(94%)で エンゲージサイコロが アカウントを つぎつきの カードへ ひろげる。 かく カードで すでに さいこうの てのかち V*(S') = レバーごとの Q* の さいだい を しっている。 これらは といた ばんめん から くる。",
      's8.note.combine': "ステップ4: かく ぶんき を かくりつ で おもみづけ して たす。 その かくりつ かじゅう へいきん こそ Q*(リスクあり, m=2, おおきな オファー) = +7.76。 きょうの さいぜんしゅ は あした の さいぜんしゅ で きまる。",
    },
  });
})();

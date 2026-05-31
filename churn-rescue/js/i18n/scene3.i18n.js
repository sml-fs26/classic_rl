/* i18n fragment for scene 3 ("What makes this an MDP?"). English
   authoritative. Scene-local keys only; shared vocabulary (tiers, levers,
   coin/die names, ledger, terminals) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title3': "What makes this an MDP?",
      'scene3.hook':  "State, action, transition, reward: the four parts on the live board.",

      'scene3.heading':     "Freeze the game. It has exactly four parts.",
      'scene3.board_label': "THE LIVE BOARD (FROZEN)",
      'scene3.next':        "NEXT",

      /* on-board tags */
      'scene3.tag.s': "STATE",
      'scene3.tag.a': "ACTION",
      'scene3.tag.p': "THE PART YOU DON'T CONTROL",

      /* dice caption (coin THEN die) */
      'scene3.then': "then",

      /* the four part-cards: letter / title / one-line manager gloss */
      'scene3.part.s.letter': "S",
      'scene3.part.s.title':  "STATE",
      'scene3.part.s.gloss':  "The situation right now: how engaged the account is, and how many months until it comes up for renewal.",
      'scene3.part.a.letter': "A",
      'scene3.part.a.title':  "ACTION",
      'scene3.part.a.gloss':  "The lever you pull this month: do nothing, a cheap check-in, or a big offer.",
      'scene3.part.p.letter': "P",
      'scene3.part.p.title':  "TRANSITION",
      'scene3.part.p.gloss':  "What happens next: the retention coin decides stay or churn, then the engagement die nudges the tier. You pick the lever; you do not pick how it lands.",
      'scene3.part.r.letter': "R",
      'scene3.part.r.title':  "REWARD",
      'scene3.part.r.gloss':  "The payoff: minus the lever cost this month, then plus 20 if they renew or minus 20 if they churn.",

      /* the one-month reward ledger */
      'scene3.reward_title': "REWARD THIS MONTH",
      'scene3.ledger.lever': "{lever} (cost now)",
      'scene3.ledger.renew': "if RENEWED at month 0 (later)",
      'scene3.ledger.churn': "if CHURNED (later)",

      /* the Markov line */
      'scene3.markov_key':  "MARKOV:",
      'scene3.markov_body': "the right move depends only on the card in front of you, not on how the account got here.",

      /* step captions */
      'scene3.step.0': "Here is one frozen month from your playtest. Every recurring decision under uncertainty has the same four parts. Click through them.",
      'scene3.step.1': "STATE. The account card IS the state: a pair, the engagement tier and the months left to renewal. 5 tiers times 5 months = 25 situations.",
      'scene3.step.2': "ACTION. You pick one lever from the menu. Here you chose CHECK-IN. Three levers, every month: that is the whole action space.",
      'scene3.step.3': "TRANSITION. Now the part you don't control: the retention coin flips STAY or CHURN, then (if they stay) the engagement die nudges the tier. You choose the coin you flip, not how it lands.",
      'scene3.step.4': "REWARD. The ledger entry. You pay the lever cost now; the big lump, plus 20 for a renewal or minus 20 for a churn, only lands at the end.",
      'scene3.step.5': "That is an MDP: state, action, transition, reward. And it is MARKOV: only the card in front of you matters. Every account renewal is this same skeleton.",

      'scene3.step_of': "{i} / {n}",
      'scene3.hint':    "Arrow keys step through the four parts. The coin and die show one representative month, not a live roll.",
    },
    jp: {
      'scene.title3': "これが MDPなのは なぜ？",
      'scene3.hook':  "じょうたい、 こうどう、 せんい、 ほうしゅう: 4つの ぶひん。",

      'scene3.heading':     "ゲームを とめる。 ぶひんは ちょうど 4つ。",
      'scene3.board_label': "ライブの ばん（ていし）",
      'scene3.next':        "つぎ",

      'scene3.tag.s': "じょうたい",
      'scene3.tag.a': "こうどう",
      'scene3.tag.p': "せいぎょ できない ぶぶん",

      'scene3.then': "そのあと",

      'scene3.part.s.letter': "S",
      'scene3.part.s.title':  "じょうたい",
      'scene3.part.s.gloss':  "いまの じょうきょう: アカウントの エンゲージと、 こうしんまでの つきすう。",
      'scene3.part.a.letter': "A",
      'scene3.part.a.title':  "こうどう",
      'scene3.part.a.gloss':  "こんげつ ひく レバー: なにもしない、 やすい チェックイン、 おおきな オファー。",
      'scene3.part.p.letter': "P",
      'scene3.part.p.title':  "せんい",
      'scene3.part.p.gloss':  "つぎに おきること: いじコインが のこる／はなれるを きめ、 そのあと エンゲージサイコロが ティアを うごかす。 レバーは えらべるが、 でかたは えらべない。",
      'scene3.part.r.letter': "R",
      'scene3.part.r.title':  "ほうしゅう",
      'scene3.part.r.gloss':  "みかえり: こんげつは レバーの コストを マイナス、 そのあと こうしんで +20、 りだつで −20。",

      'scene3.reward_title': "こんげつの ほうしゅう",
      'scene3.ledger.lever': "{lever}（いまの コスト）",
      'scene3.ledger.renew': "0かげつで こうしんなら（あとで）",
      'scene3.ledger.churn': "りだつなら（あとで）",

      'scene3.markov_key':  "マルコフ:",
      'scene3.markov_body': "さいぜんの ては、 めのまえの カードだけで きまる。 ここに いたった けいろは かんけいない。",

      'scene3.step.0': "プレイテストから とめた 1かげつ。 ふかくじつな はんぷくの けっていは ぜんぶ おなじ 4つの ぶひんを もつ。 クリックして すすもう。",
      'scene3.step.1': "じょうたい。 アカウントカードが じょうたい: エンゲージ ティアと こうしんまでの つきすうの ペア。 5ティア × 5つき = 25じょうきょう。",
      'scene3.step.2': "こうどう。 メニューから レバーを 1つ えらぶ。 ここでは チェックイン。 まいつき 3つの レバー: それが こうどうの ぜんぶ。",
      'scene3.step.3': "せんい。 せいぎょ できない ぶぶん: いじコインが のこる／はなれるを きめ、 のこれば エンゲージサイコロが ティアを うごかす。 コインは えらべるが でかたは えらべない。",
      'scene3.step.4': "ほうしゅう。 だいちょうの きにゅう。 レバーの コストは いま はらう。 おおきな かたまり（こうしん +20、 りだつ −20）は さいごに くる。",
      'scene3.step.5': "これが MDP: じょうたい、 こうどう、 せんい、 ほうしゅう。 そして マルコフ: めのまえの カードだけが だいじ。 すべての こうしんは おなじ ほねぐみ。",

      'scene3.step_of': "{i} / {n}",
      'scene3.hint':    "やじるしキーで 4つの ぶひんを すすむ。 コインと サイコロは だいひょうてきな 1かげつで、 ライブの ロールではない。",
    },
  });
})();

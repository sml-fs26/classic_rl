/* i18n fragment for scene 4 ("Policy: your playbook"). English
   authoritative. Scene-local keys only; shared vocabulary (tiers, levers,
   months, ledger) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title4': "Policy: your playbook",
      'scene4.hook':  "A rule from every situation to one lever. When you played, you were a policy.",

      'scene4.heading':  "A policy is a full-board playbook.",
      'scene4.def_text': "names one lever for every situation on the board.",

      /* preset playbooks (the two blanket SOPs) */
      'scene4.preset.never': "NEVER DISCOUNT",
      'scene4.preset.panic': "PANIC OFFER",

      /* outcome panel */
      'scene4.out_title':   "IF YOU RAN THIS PLAYBOOK FROM {start}",
      'scene4.renew_rate':  "RENEWAL RATE",
      'scene4.renew_foot':  "chance the account is still subscribed at month 0",
      'scene4.exp_return':  "EXPECTED RETURN",
      'scene4.return_foot': "average value points over the whole horizon (costs + the terminal lump)",

      'scene4.verdict.win':  "This playbook MAKES money on average. But can a flat rule be the best you can do?",
      'scene4.verdict.lose': "This blanket playbook LOSES money on average. A single rule for every account is leaving value on the table.",

      /* scene-2 callback */
      'scene4.callback_key':  "REMEMBER:",
      'scene4.callback_body': "when you played in scene 2, you WERE a policy. Every month you looked at the card and picked a lever; you just never wrote the whole board down. This grid is that rule, made explicit.",

      'scene4.hint': "Click the two presets, then click any cell to change its lever and author your own playbook. Watch the renewal rate and the return respond. The provably best playbook comes later: try to beat a blanket rule first.",
    },
    jp: {
      'scene.title4': "ほうさく: あなたの プレイブック",
      'scene4.hook':  "どの じょうたいにも ひとつの レバー。 あそんだ とき、 あなたは ほうさくだった。",

      'scene4.heading':  "ほうさくは ばんぜんたいの プレイブック。",
      'scene4.def_text': "ばんじょうの すべての じょうきょうに レバーを 1つ あてる。",

      'scene4.preset.never': "わりびき しない",
      'scene4.preset.panic': "パニック オファー",

      'scene4.out_title':   "{start} から この プレイブックを はしらせると",
      'scene4.renew_rate':  "こうしんりつ",
      'scene4.renew_foot':  "0かげつじてんで まだ けいやくちゅうの かくりつ",
      'scene4.exp_return':  "きたい リターン",
      'scene4.return_foot': "ぜんきかんの へいきん かちポイント（コスト + さいごの かたまり）",

      'scene4.verdict.win':  "この プレイブックは へいきんで くろじ。 でも たいらな ルールが さいぜんと いえる？",
      'scene4.verdict.lose': "この いちりつ プレイブックは へいきんで あかじ。 すべての アカウントに おなじ ルールでは かちを のがしている。",

      'scene4.callback_key':  "おもいだそう:",
      'scene4.callback_body': "シーン2で あそんだ とき、 あなたは ほうさくだった。 まいつき カードを みて レバーを えらんだ。 ばんぜんたいを かきとめなかった だけ。 この グリッドが その ルールを めいじか したもの。",

      'scene4.hint': "2つの プリセットを クリックし、 セルを クリックして レバーを かえ じぶんの プレイブックを つくろう。 こうしんりつと リターンの へんかを みよう。 しょうめいずみの さいぜんさくは あとで: まず いちりつ ルールを こえてみよう。",
    },
  });
})();

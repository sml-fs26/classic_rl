/* scene12 i18n fragment -- Recap ("You have learned the bones").
   Six concept cards in the shelf-card voice. English mirrors
   window.DATA.recap (the authoritative source for the numbers/blurbs);
   the Japanese mirror gives parity. The scene falls back to DATA.recap
   when a per-card key is absent, so DATA stays the single source of
   truth for the English copy. */
(function () {
  window.I18N.register({
    en: {
      'scene12.title': 'You have learned the bones',
      'scene12.banner': 'THE PLAYBOOK',
      'scene12.sub': 'Six ideas, one cabin of seats. The bones of revenue management, and of reinforcement learning.',
      'scene12.close': 'You have learned the bones of revenue management, and of reinforcement learning. A cabin of seats today, any sequential decision under uncertainty tomorrow.',
      'scene12.footnote': 'A seat, a room, a slot, a fleet of fares: same situation, lever, draw, and payoff. The cabin was just the place to learn to read them.',
      'scene12.replay': 'BACK TO THE TITLE',

      /* Per-card copy (mirrors DATA.recap; EN authoritative here too). */
      'scene12.card.mdp.title': 'THE MDP FRAME',
      'scene12.card.mdp.blurb': 'Four parts: the SITUATION (seats left times days left), the LEVER you pull (a price tag), the part you do not control (the demand draw), and the PAYOFF (price times seats sold). An empty cabin at gate-close pays nothing.',
      'scene12.card.policy.title': 'YOUR PRICING PLAYBOOK',
      'scene12.card.policy.blurb': 'A policy assigns one lever to EVERY situation on the board, the SOP your whole team could follow without you in the room. When you priced by gut, you already were a policy; you just had not written it down.',
      'scene12.card.return.title': 'PAYOFF SUMMED TO THE DEADLINE',
      'scene12.card.return.blurb': 'The return is every dollar collected from now until gate-close, not just today’s sale. Played from the same cabin, the same lever can return very different amounts; its spread is the risk you carry into the deadline.',
      'scene12.card.qstar.title': 'THE HONEST VALUE OF A LEVER',
      'scene12.card.qstar.blurb': 'Q*(s, a) is the long-run revenue of pulling lever a in situation s, assuming you price smart every day afterward. The best lever is the argmax, and the star MOVES across the board: the whole lesson of revenue management.',
      'scene12.card.dp.title': 'EXACT PLAYBOOK IF YOU KNEW DEMAND',
      'scene12.card.dp.blurb': 'With the demand probabilities known, Q* solves its own Bellman equation: today’s value is the cash now plus the value of where it lands you tomorrow. Sweep the board right to left and it fills in exactly, in four sweeps, one per day.',
      'scene12.card.sarsa.title': 'LEARN THE PLAYBOOK BY SELLING',
      'scene12.card.sarsa.blurb': 'No demand model? Replace the expectation with one observed sale: after pulling a in s, seeing reward r, landing in s-prime and choosing a-prime, nudge q toward r + q[s-prime, a-prime]. With epsilon to keep exploring, the playbook converges to the DP oracle on its own.',

      /* MDP card mini-instances (the S/A/P/R tile strip). */
      'scene12.mini.s': 'seats × days',
      'scene12.mini.a': 'PREM / STD / FIRE',
      'scene12.mini.p': 'demand draw',
      'scene12.mini.r': 'price × sold',

      /* One-line "what it meant here" tag per card. */
      'scene12.tag.mdp': 'situation · lever · draw · payoff',
      'scene12.tag.policy': 'a lever for every cell',
      'scene12.tag.return': 'summed to gate-close, with risk',
      'scene12.tag.qstar': 'the star that moves',
      'scene12.tag.dp': 'exact, if you knew demand',
      'scene12.tag.sarsa': 'learn it from what sold',
    },
    jp: {
      'scene12.title': 'きほんを まなんだ',
      'scene12.banner': 'プレイブック',
      'scene12.sub': '六つの かんがえ、ひとつの きゃくしつ。 レベニューマネジメントと 強化学習の きほん。',
      'scene12.close': 'レベニューマネジメントと 強化学習の きほんを まなびました。 今日は ひとつの きゃくしつ、明日は 不確かさのなかの あらゆる じゅんじ けってい。',
      'scene12.footnote': '座席、部屋、枠、運賃の むれ。 おなじ じょうきょう・レバー・ぬきとり・はらい。 きゃくしつは それを よむ ための れんしゅうの ばだった。',
      'scene12.replay': 'タイトルへ もどる',

      'scene12.card.mdp.title': 'MDP の わくぐみ',
      'scene12.card.mdp.blurb': '四つの ぶぶん: じょうきょう（のこり ざせき × しゅっぱつまでの にっすう）、ひく レバー（ねふだ）、せいぎょできない ぶぶん（じゅよう ぬきとり）、はらい（ねだん × うれた ざせきすう）。 ゲートが しまる ときの からの きゃくしつは 何も はらわない。',
      'scene12.card.policy.title': 'あなたの プライシング プレイブック',
      'scene12.card.policy.blurb': 'ポリシーは ばんの すべての じょうきょうに ひとつの レバーを わりあてる。 あなたが いなくても チームが したがえる SOP。 かんで ねづけした とき、あなたは すでに ポリシーだった。 ただ 書いていなかった だけ。',
      'scene12.card.return.title': 'しゅっぱつまでの はらいの ごうけい',
      'scene12.card.return.blurb': 'リターンは いまから ゲートが しまる まで あつめた すべての お金。 今日の うりあげ だけでは ない。 おなじ きゃくしつから ひいても、おなじ レバーが まったく ちがう がくを かえす。 そのちらばりが しめきりへ はこぶ リスク。',
      'scene12.card.qstar.title': 'レバーの しょうじきな かち',
      'scene12.card.qstar.blurb': 'Q*(s, a) は じょうきょう s で レバー a を ひく ちょうきの うりあげ。 あとも まいにち かしこく ねづけする ぜんてい。 さいぜんは argmax で、★は ばんを うごく。 これが レベニューマネジメントの すべて。',
      'scene12.card.dp.title': 'じゅようを しれば せいかくな プレイブック',
      'scene12.card.dp.blurb': 'じゅよう かくりつが わかれば、Q* は じぶんの ベルマンしきを とく。 今日の かちは いまの げんきん たす あす たどりつく さきの かち。 みぎから ひだりへ はいて、四かいで せいかくに うまる。 一日 一かい。',
      'scene12.card.sarsa.title': 'うって プレイブックを まなぶ',
      'scene12.card.sarsa.blurb': 'じゅよう モデルが ない？ きたいちを ひとつの うりあげで おきかえる: s で a を ひき、r を みて、s’ に つき a’ を えらび、q を r + q[s’, a’] へ よせる。 ε で たんさくを つづければ、プレイブックは DP の おたくに ひとりでに ちかづく。',

      'scene12.mini.s': 'ざせき × 日数',
      'scene12.mini.a': 'PREM / STD / FIRE',
      'scene12.mini.p': 'じゅよう ぬきとり',
      'scene12.mini.r': 'ねだん × うれた ざせきすう',

      'scene12.tag.mdp': 'じょうきょう・レバー・ぬきとり・はらい',
      'scene12.tag.policy': 'すべての ますに レバー',
      'scene12.tag.return': 'しゅっぱつまでの ごうけい、リスクつき',
      'scene12.tag.qstar': 'うごく ★',
      'scene12.tag.dp': 'じゅようを しれば せいかく',
      'scene12.tag.sarsa': 'うれた ものから まなぶ',
    },
  });
})();

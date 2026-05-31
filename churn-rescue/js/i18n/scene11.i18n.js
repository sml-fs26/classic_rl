/* i18n fragment for scene 11 (SARSA capstone). English authoritative.
   Scene-local keys only; shared vocabulary (tiers, levers, coin/die,
   terminals, retention map) lives in the i18n core (js/i18n.js).

   Voice: lead with the MANAGER meaning, then the notation. The derivation
   walks Bellman -> one-sample target -> the SARSA nudge -> epsilon-greedy,
   then the live model-free trainer fills the retention map toward the DP
   oracle's coloured map (notch and all). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title11': "SARSA: learn by playing",
      'scene11.hook':  "Learn the playbook from experience, no model needed.",

      /* ---- pager controls ---- */
      's11.btn.prev':  '◀ BACK',
      's11.btn.next':  'NEXT ▶',
      's11.step.label': 'STEP {i} / {n}',

      /* ---- step A: the manager problem ---- */
      's11.step.A.title': "You don't have the model",
      's11.step.A.body':
        "Scene 9 computed the playbook because we knew the coin and the die. " +
        "In real life nobody hands you those odds: how a discount actually shifts " +
        "churn for your customers is unknown until you try it. So you do the only " +
        "honest thing: pull a lever, watch what happens, and adjust your belief. " +
        "Many small retention experiments, one estimate per situation-and-lever.",
      's11.step.A.foot':
        "We keep a running estimate <b>q[s,a]</b> for every cell of the board, " +
        "all starting at zero. The board is blank because we have learned nothing yet.",
      's11.illus.A': "25 situations × 3 levers. Every estimate starts at zero: an empty map.",

      /* ---- step B: one observed sample of Bellman ---- */
      's11.step.B.title': "One month is one sample",
      's11.step.B.body':
        "Bellman says a lever's true value is an average over every way the coin " +
        "and die could land. You can't average what you can't see, but one played " +
        "month gives you one draw from it: you pulled lever a in situation s, the " +
        "ledger moved by r, you landed in s′, and your playbook would next pull a′. " +
        "That single outcome, r + q[s′,a′], is your best one-shot guess at the value.",
      's11.step.B.foot':
        "Replace the expectation (every branch) with the one branch you actually " +
        "saw. That guess is the <b>target</b>.",
      's11.illus.B':
        "One played episode. The highlighted month is the sample: lever a in s, reward r, on to s′.",

      /* ---- step C: the SARSA nudge ---- */
      's11.step.C.title': "Nudge toward what you saw",
      's11.step.C.body':
        "One sample is noisy, so don't overwrite your estimate, ease it. Move " +
        "q[s,a] a small step of size α toward the target. Renewals tug it up, " +
        "churns tug it down; over many months the tugs average out and the estimate " +
        "settles on the lever's true long-run value. This one line is SARSA.",
      's11.step.C.foot':
        "α is the step size (how much one month moves your belief). It starts " +
        "around 0.20 and shrinks as evidence piles up, so the estimates settle. " +
        "The live run labels it.",
      's11.illus.C':
        "q starts at 0; the target is the sampled r. One update slides q a fraction α of the way over.",

      /* ---- step D: epsilon-greedy exploration ---- */
      's11.step.D.title': "Sometimes try the unproven lever",
      's11.step.D.body':
        "If you always pull the lever that looks best so far, you never learn what " +
        "the others would have done, and a wrong early guess locks in forever. So " +
        "most months play your believed-best lever (exploit), but with a small " +
        "probability ε pick a random one instead (explore). That is disciplined " +
        "experimentation: occasionally bet on an unproven move to keep learning.",
      's11.step.D.foot':
        "Small ε: mostly exploit, occasionally explore. Too much ε and you never " +
        "settle; too little and you stay ignorant.",
      's11.illus.D':
        "In the sampled cell, ε occasionally swaps the believed-best lever for an untried one.",

      /* ---- step E: the live trainer ---- */
      's11.step.E.title': "Watch it learn the map",
      's11.step.E.body':
        "Now run it for real, with no model: every episode samples the world, " +
        "applies the nudge, and repaints the map. It fills toward the very same " +
        "coloured playbook the oracle computed in scene 9, blue notch and all.",
      's11.live.play':   '▶ PLAY',
      's11.live.pause':  '❚❚ PAUSE',
      's11.live.once':   'NEXT EPISODE',
      's11.live.reset':  'RESET',
      's11.live.speed':  'SPEED',
      's11.live.slow':   'slow',
      's11.live.fast':   'fast',
      's11.live.eps':    'ε (explore)',
      's11.live.alpha':  'α: {a0} → {fl} (annealing), now {now}',
      's11.live.ready':       'Ready to learn',
      's11.live.ready_body':  'Press PLAY to run experiments, or NEXT EPISODE to step one at a time. The map below fills from nothing.',
      's11.live.last':        'Latest update · after {e} episodes',
      's11.live.target':      'target = r + q[s′,a′]',
      's11.live.target_terminal': '{r}  (episode ended, no s′)',
      's11.live.terminal':    '· (episode ended)',
      's11.live.explored':    'explored',
      's11.live.nudge':       'q[s,a] nudged by α={a}  →  <b>{q1}</b>',

      /* ---- trajectory tape ---- */
      's11.tape.title':  'TRAJECTORY TAPE',
      's11.tape.illus':  'one sampled episode · {n} months',
      's11.tape.live':   'episode #{e}',
      's11.tape.live0':  'no episode yet · {e} done',

      /* ---- target callout (on the active cell) ---- */
      's11.target.label': 'TARGET',

      /* ---- number line (the nudge) ---- */
      's11.numline.title': 'q moves a fraction α = {a} of the way to the target',
      's11.numline.qold':  'q = +0.00',
      's11.numline.qnew':  'q → {v}',
      's11.numline.tgt':   'target {v}',

      /* ---- convergence bar + meta ---- */
      's11.conv.label':  'MATCH TO ORACLE',
      's11.conv.agree':  'policy: {a}/{n} cells right',
      's11.conv.return': 'greedy return ≈ {v}',
    },

    jp: {
      'scene.title11': "SARSA: あそんで まなぶ",
      'scene11.hook':  "けいけんから プレイブックを まなぶ。 モデルは いらない。",

      's11.btn.prev':  '◀ もどる',
      's11.btn.next':  'つぎ ▶',
      's11.step.label': 'ステップ {i} / {n}',

      's11.step.A.title': "モデルは てもとに ない",
      's11.step.A.body':
        "シーン9では コインと サイコロを しっていたので プレイブックを けいさんできた。 " +
        "げんじつでは その かくりつは だれも おしえてくれない。 わりびきが じっさいに " +
        "りだつを どう うごかすかは、 ためすまで わからない。 だから レバーを ひいて、 " +
        "おきたことを みて、 しんねんを ちょうせいする。 ちいさな じっけんを たくさん。",
      's11.step.A.foot':
        "ばんめんの すべての マスに すいてい <b>q[s,a]</b> を もち、 すべて ゼロから はじめる。 " +
        "まだ なにも まなんでいないので マップは くうはく。",
      's11.illus.A': "25 じょうたい × 3 レバー。 すいていは すべて ゼロ: からの マップ。",

      's11.step.B.title': "1かげつ は 1サンプル",
      's11.step.B.body':
        "ベルマンは、 レバーの しんの かちは コインと サイコロの すべての でかたの へいきん だという。 " +
        "みえない へいきんは とれないが、 プレイした 1かげつは その 1つの ドローを くれる: " +
        "じょうたい s で レバー a を ひき、 だいちょうが r うごき、 s′ に つき、 つぎは a′ を ひく。 " +
        "その 1つの けっか r + q[s′,a′] が かちの いちばんの すいそく。",
      's11.step.B.foot':
        "きたい(すべての ぶんき)を、 じっさいに みた 1つの ぶんきで おきかえる。 " +
        "それが <b>ターゲット</b>。",
      's11.illus.B':
        "プレイした 1エピソード。 ハイライトの つきが サンプル: s で a、 ほうしゅう r、 s′ へ。",

      's11.step.C.title': "みたほうへ ちかづける",
      's11.step.C.body':
        "1サンプルは ノイズが おおいので、 すいていを じょうしょきせず、 すこしずつ。 " +
        "q[s,a] を おおきさ α の ちいさい いっぽ だけ ターゲットへ うごかす。 こうしんは うえへ、 " +
        "りだつは したへ ひっぱり、 たくさんの つきで へいきんされて、 しんの ちょうきかちに おちつく。 " +
        "この 1ぎょうが SARSA。",
      's11.step.C.foot':
        "α は ステップサイズ(1かげつが しんねんを どれだけ うごかすか)。 やく 0.20 から " +
        "はじまり、 しょうこが たまるにつれて ちいさくなり、 すいていが おちつく。 " +
        "ライブらんで ラベルひょうじ。",
      's11.illus.C':
        "q は 0 から。 ターゲットは サンプルの r。 1かいの こうしんで q は わりあい α だけ すすむ。",

      's11.step.D.title': "ときどき みためし レバーを ためす",
      's11.step.D.body':
        "つねに いまの ベストだけを ひくと、 ほかが どうなるか まなべず、 はやい まちがいが " +
        "ずっと のこる。 だから たいていは ベストを ひき(かつよう)、 ちいさい かくりつ ε で " +
        "ランダムに ひく(たんさく)。 これが きりつ ある じっけん: ときどき みためしに かける。",
      's11.step.D.foot':
        "ちいさい ε: たいてい かつよう、 ときどき たんさく。 おおすぎると おちつかず、 " +
        "すくなすぎると しらないまま。",
      's11.illus.D':
        "サンプルの マスで、 ε は ときどき ベストを みためしの レバーに いれかえる。",

      's11.step.E.title': "マップを まなぶのを みる",
      's11.step.E.body':
        "では モデルなしで ほんばん: まいエピソード せかいを サンプルし、 うごかし、 マップを " +
        "ぬりなおす。 シーン9で オラクルが けいさんした おなじ いろの プレイブックへ、 " +
        "あおい ノッチも ふくめて うまっていく。",
      's11.live.play':   '▶ さいせい',
      's11.live.pause':  '❚❚ いちじ',
      's11.live.once':   'つぎの エピソード',
      's11.live.reset':  'リセット',
      's11.live.speed':  'はやさ',
      's11.live.slow':   'おそい',
      's11.live.fast':   'はやい',
      's11.live.eps':    'ε (たんさく)',
      's11.live.alpha':  'α: {a0} → {fl} (げんすい)、 いま {now}',
      's11.live.ready':       'まなぶ じゅんび',
      's11.live.ready_body':  'さいせいで じっけん、 または つぎの エピソードで 1つずつ。 したの マップが ゼロから うまる。',
      's11.live.last':        'さいしんの こうしん · {e} エピソードご',
      's11.live.target':      'ターゲット = r + q[s′,a′]',
      's11.live.target_terminal': '{r}  (エピソード しゅうりょう、 s′ なし)',
      's11.live.terminal':    '· (エピソード しゅうりょう)',
      's11.live.explored':    'たんさく',
      's11.live.nudge':       'q[s,a] を α={a} で ちかづけ  →  <b>{q1}</b>',

      's11.tape.title':  'トラジェクトリ テープ',
      's11.tape.illus':  'サンプル 1エピソード · {n} かげつ',
      's11.tape.live':   'エピソード #{e}',
      's11.tape.live0':  'まだ エピソードなし · {e} かんりょう',

      's11.target.label': 'ターゲット',

      's11.numline.title': 'q は ターゲットへ わりあい α = {a} すすむ',
      's11.numline.qold':  'q = +0.00',
      's11.numline.qnew':  'q → {v}',
      's11.numline.tgt':   'ターゲット {v}',

      's11.conv.label':  'オラクルとの いっち',
      's11.conv.agree':  'ほうさく: {a}/{n} マス せいかい',
      's11.conv.return': 'グリーディ リターン ≈ {v}',
    },
  });
})();

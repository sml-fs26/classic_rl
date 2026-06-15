/* scene4 i18n fragment, "A policy is a playbook" (the Policy scene).
   English is the source of truth; the Japanese mirror gives full parity.
   KaTeX formulas stay in pure math form (symbols cross languages). */
(function () {
  window.I18N.register({
    en: {
      'scene4.title': "A policy is a playbook",

      /* manager framing */
      'scene4.lede':
        'A <b>policy</b> is your standard operating procedure: one price lever pre-assigned to <b>every</b> situation on the board. The rule your whole team could follow without you in the room. When you priced by gut in the playtest, you already <b>were</b> a policy; you just had not written it down.',

      /* formula caption */
      'scene4.formula.foot':
        'Read it: a policy pi takes any situation s and returns the lever to pull there.',

      /* board chrome */
      'scene4.board.title':    'ONE LEVER FOR EVERY SITUATION',
      'scene4.cornerLabel':    'SEATS \\ DAYS',

      /* the two hand-policy presets (a manager could write these in a minute) */
      'scene4.tabs.label':     'PICK A PLAYBOOK',
      'scene4.policyA.name':   'ALWAYS STANDARD',
      'scene4.policyA.sub':    'the safe default',
      'scene4.policyA.blurb':
        'The simplest playbook: pull the everyday clearing price in every situation, a full cabin or nearly a full flight, lots of time or none. One rule, no thinking. It will not be the best, but it is a policy, and it is honest about being a complete rule.',

      'scene4.policyB.name':   'HOLD, THEN DUMP',
      'scene4.policyB.sub':    'a gut-feel rule',
      'scene4.policyB.blurb':
        'A more human playbook: hold out for PREMIUM while there are still 2+ days left, then cut to STANDARD on the very last day. It captures a real instinct, hold high, cut late, and it is still just a function from situation to lever.',

      /* legend / read-out */
      'scene4.legend.title':   'THE LEVER THIS PLAYBOOK PULLS',
      'scene4.cell.read':      '{lever} at {u}u / {d}d',
      'scene4.note.complete':
        'Notice: both maps assign a lever to all 20 cells. That completeness is what makes it a policy, not a guess for one situation.',

      /* the scene-2 callback */
      'scene4.callback.title': 'YOU WERE ALREADY A POLICY',
      'scene4.callback.body':
        'Every lever you pulled in the playtest was pi(s) for the situation you were in. You ran a policy by feel. The rest of this story is about finding the <b>best</b> one, and there is exactly one map of the board that beats every other.',
      'scene4.callback.tease':
        'But which lever wins where? We have not earned that answer yet.',

      /* nav */
      'scene4.next':           'NEXT ▸',
      'scene4.prev':           '◂ BACK',
      'scene4.hint':           'Toggle the two playbooks to see each as a coloured map. Press <kbd>n</kbd> for speaker notes.',

      /* speaker notes (lecturer crib) */
      'notes.scene4':
        '<b>Goal:</b> a policy is a COMPLETE map from situation to lever, not a single decision.<ul>' +
        '<li>Drive home <b>completeness</b>: every one of the 20 cells gets a lever. Toggle the two presets and let the colour regions land.</li>' +
        '<li><b>Always-STANDARD</b> = one flat colour (the trivial constant policy). <b>Hold-then-dump</b> = a plausible human heuristic (PREMIUM while d>=2, STANDARD at d=1).</li>' +
        '<li>The big callback: in the playtest they <i>were</i> a policy, pulling pi(s) each day by gut, just unwritten.</li>' +
        '<li>Do NOT reveal the optimal policy here, that is the payoff of the Q*/DP scenes. Tease only that one best map exists.</li></ul>' +
        '<b>Hook to next:</b> a run of a policy is a trajectory, a sequence of situation, lever, payoff.',
    },

    jp: {
      'scene4.title': "ほうさくは プレイブック",

      'scene4.lede':
        '<b>ほうさく</b>とは あなたの ひょうじゅん さぎょう てじゅん：ばんの <b>すべての</b> じょうきょうに、ねだんレバーを ひとつずつ まえもって わりあてる。あなたが いなくても チームが したがえる ルール。プレイテストで かんで ねづけした とき、あなたは すでに <b>ほうさく そのもの</b> でした。ただ かきとめて いなかっただけ。',

      'scene4.formula.foot':
        'よみかた：ほうさく pi は どんな じょうきょう s も うけとり、そこで ひく レバーを かえす。',

      'scene4.board.title':    'すべての じょうきょうに ひとつの レバー',
      'scene4.cornerLabel':    'ざせき \\ にっすう',

      'scene4.tabs.label':     'プレイブックを えらぶ',
      'scene4.policyA.name':   'つねに スタンダード',
      'scene4.policyA.sub':    'あんぜんな きほん',
      'scene4.policyA.blurb':
        'もっとも たんじゅんな プレイブック：どの じょうきょうでも やすうりの ねだんを ひく。きゃくしつが いっぱいでも ほぼ まんせきでも、じかんが あっても なくても。ルール ひとつ、かんがえる ひつようなし。さいぜんでは ないが、これも れっきとした かんぜんな ルール ＝ ほうさく。',

      'scene4.policyB.name':   'もって、なげうる',
      'scene4.policyB.sub':    'かんの ルール',
      'scene4.policyB.blurb':
        'より にんげんらしい プレイブック：のこり 2にち いじょう なら プレミアムで まち、さいごの 1にちで あわてて スタンダード。「たかく もち、おそく さげる」という ほんとうの ほんのうを とらえているが、やはり じょうきょうから レバーへの かんすうに すぎない。',

      'scene4.legend.title':   'この プレイブックが ひく レバー',
      'scene4.cell.read':      '{u}こ / {d}にち で {lever}',
      'scene4.note.complete':
        'ちゅうもく：どちらの ちずも 20マス すべてに レバーを わりあてる。この かんぜんさ こそが、ひとつの じょうきょうへの すいそくでは なく ほうさくである ゆえん。',

      'scene4.callback.title': 'あなたは すでに ほうさく だった',
      'scene4.callback.body':
        'プレイテストで ひいた すべての レバーは、その じょうきょうの pi(s) でした。あなたは かんで ほうさくを じっこう していた。この さきの はなしは <b>さいぜん</b>の ほうさくを みつけること。ほかの すべてに かつ ばんの ちずが、ちょうど ひとつ あります。',
      'scene4.callback.tease':
        'でも どこで どの レバーが かつ？ その こたえは まだ もらえません。',

      'scene4.next':           'つぎ ▸',
      'scene4.prev':           '◂ もどる',
      'scene4.hint':           '２つの プレイブックを きりかえ、それぞれを いろの ちずとして みる。<kbd>n</kbd> で スピーカー ノート。',

      'notes.scene4':
        '<b>ねらい：</b> ほうさくは じょうきょうから レバーへの かんぜんな ちず、ひとつの けってい では ない。<ul>' +
        '<li><b>かんぜんさ</b>を つよく：20マス すべてに レバーが つく。２つの プリセットを きりかえ、いろの りょういきを みせる。</li>' +
        '<li><b>つねにスタンダード</b> = ひとつの たいらな いろ（じだんてきな ていすう ほうさく）。<b>もって、なげうる</b> = もっともらしい にんげんの ヒューリスティック（d>=2 で プレミアム、d=1 で スタンダード）。</li>' +
        '<li>おおきな コールバック：プレイテストで かれらは <i>ほうさく だった</i>、まいにち かんで pi(s) を ひいていた、ただ かかれて いなかっただけ。</li>' +
        '<li>ここで さいてき ほうさくを みせては いけない、それは Q*/DP シーンの ごほうび。さいぜんの ちずが ひとつ ある とだけ ほのめかす。</li></ul>' +
        '<b>つぎへ：</b> ほうさくの じっこうは トラジェクトリー ＝ じょうきょう・レバー・みかえり の れつ。',
    },
  });
})();

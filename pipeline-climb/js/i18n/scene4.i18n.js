/* i18n fragment for Scene 4 (Pipeline Climb) - "Policy: your playbook".
 * English is authoritative; the Japanese mirror reuses the shared pipeline
 * vocabulary (rung names / levers from js/i18n.js). The KaTeX formula stays in
 * pure math form. The scene TITLE (scene.title4) lives in js/i18n.js and is
 * NOT redefined here. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      /* manager framing */
      'scene4.lede':
        'A <b>policy</b> is your SOP: one lever pre-assigned to <b>every</b> rung, COLD through READY. The rule your whole team could run without you on the call. When you sold by feel in the playtest, you already <b>were</b> a policy; you just had not written it down.',

      /* formula caption */
      'scene4.formula.foot':
        'Read it: a policy pi takes any rung s and returns the lever to pull there.',

      /* board chrome */
      'scene4.board.title':    'ONE LEVER FOR EVERY RUNG',
      'scene4.col.rung':       'RUNG (STATE)',
      'scene4.col.lever':      'LEVER pi(s)',
      'scene4.chip.aria':      'Cycle the lever for {rung}',

      /* the two hand playbooks (a rep could write these in a minute) */
      'scene4.tabs.label':     'SEED A PLAYBOOK',
      'scene4.policyA.name':   'ALWAYS DEMO',
      'scene4.policyA.sub':    'the safe default',
      'scene4.policyA.blurb':
        'The simplest playbook: book the DEMO on every rung, cold lead or nearly signed, no thought required. One rule for all five rungs. It will not be the best, but it is a real policy, honest about being a complete rule.',

      'scene4.policyB.name':   'WARM THEN CLOSE',
      'scene4.policyB.sub':    'a gut-feel rule',
      'scene4.policyB.blurb':
        'A more human playbook: NURTURE the cold lead, DEMO through the middle rungs, and HARD CLOSE only once the lead is READY. It captures a real instinct, earn the right to close, and it is still just a function from rung to lever.',

      /* hand-edited (the learner cycled a rung off a preset) */
      'scene4.custom.name':    'YOUR PLAYBOOK',
      'scene4.custom.blurb':
        'You have written your own rule now: one lever on every rung. Whether it is any good is the next question. It is still a policy, a complete map from rung to lever, the moment all five are filled.',

      /* read-out */
      'scene4.readout.label':  'pi(s) =',
      'scene4.note.complete':
        'Notice: a lever sits on all five rungs at once. That completeness is what makes it a policy, not a single call for one rung.',

      /* the scene-2 callback */
      'scene4.callback.title': 'YOU WERE ALREADY A POLICY',
      'scene4.callback.body':
        'Every lever you pulled in the playtest was pi(s) for the rung the lead was on. You ran a policy by feel. The rest of this story is about finding the <b>best</b> one, and there is exactly one playbook that beats every other.',
      'scene4.callback.tease':
        'But which lever wins on which rung? We have not earned that answer yet.',

      /* nav / hint */
      'scene4.hint':           'Click a lever chip to cycle the rule on that rung, or seed a playbook. Press <kbd>n</kbd> for speaker notes.',

      /* speaker notes (lecturer crib) */
      'notes.scene4':
        '<b>Goal:</b> a policy is a COMPLETE map from rung to lever, not a single decision.<ul>' +
        '<li>Drive home <b>completeness</b>: every one of the five rungs carries a lever. Cycle a rung chip and let the "one decision per state" idea land.</li>' +
        '<li><b>Always-DEMO</b> = the trivial constant policy. <b>Warm-then-close</b> = a plausible human heuristic (NURTURE cold, DEMO the middle, HARD CLOSE at READY).</li>' +
        '<li>The big callback: in the playtest they <i>were</i> a policy, pulling pi(s) each touch by gut, just unwritten.</li>' +
        '<li>Do NOT reveal the optimal policy here, that is the payoff of the Q* / DP scenes. Tease only that one best playbook exists.</li></ul>' +
        '<b>Hook to next:</b> running a policy is a trajectory, a sequence of rung, lever, payoff.',
    },

    jp: {
      'scene4.lede':
        '<b>ポリシー</b>とは あなたの ひょうじゅん てじゅん：コールドから じゅんびまで、<b>すべての</b> ステージに レバーを ひとつずつ まえもって わりあてる。あなたが いなくても チームが まわせる ルール。プレイテストで かんで うった とき、あなたは すでに <b>ポリシー そのもの</b> でした。ただ かきとめて いなかっただけ。',

      'scene4.formula.foot':
        'よみかた：ポリシー pi は どの ステージ s も うけとり、そこで ひく レバーを かえす。',

      'scene4.board.title':    'すべての ステージに ひとつの レバー',
      'scene4.col.rung':       'ステージ (じょうたい)',
      'scene4.col.lever':      'レバー pi(s)',
      'scene4.chip.aria':      '{rung} の レバーを きりかえる',

      'scene4.tabs.label':     'プレイブックを えらぶ',
      'scene4.policyA.name':   'つねに デモ',
      'scene4.policyA.sub':    'あんぜんな きほん',
      'scene4.policyA.blurb':
        'もっとも たんじゅんな プレイブック：どの ステージでも デモを くむ。つめたい リードでも ほぼ サインでも、かんがえる ひつようなし。５ステージ ぜんぶ ルール ひとつ。さいぜんでは ないが、れっきとした かんぜんな ルール ＝ ポリシー。',

      'scene4.policyB.name':   'あたためて クローズ',
      'scene4.policyB.sub':    'かんの ルール',
      'scene4.policyB.blurb':
        'より にんげんらしい プレイブック：つめたい リードは ナーチャー、まんなかの ステージは デモ、じゅんびに なって はじめて ハードクローズ。「クローズする けんりを かせぐ」という ほんとうの ほんのうを とらえているが、やはり ステージから レバーへの かんすうに すぎない。',

      'scene4.custom.name':    'あなたの プレイブック',
      'scene4.custom.blurb':
        'あなた じしんの ルールを かきました：どの ステージにも レバーが ひとつ。よいか どうかは つぎの もんだい。５つ すべてが うまった しゅんかん、これも ポリシー ＝ ステージから レバーへの かんぜんな ちず。',

      'scene4.readout.label':  'pi(s) =',
      'scene4.note.complete':
        'ちゅうもく：レバーは ５ステージ すべてに いちどに のる。この かんぜんさ こそが、ひとつの ステージへの ひとつの けってい では なく ポリシーである ゆえん。',

      'scene4.callback.title': 'あなたは すでに ポリシー だった',
      'scene4.callback.body':
        'プレイテストで ひいた すべての レバーは、その ステージの pi(s) でした。あなたは かんで ポリシーを じっこう していた。この さきの はなしは <b>さいぜん</b>の ポリシーを みつけること。ほかの すべてに かつ プレイブックが、ちょうど ひとつ あります。',
      'scene4.callback.tease':
        'でも どの ステージで どの レバーが かつ？ その こたえは まだ もらえません。',

      'scene4.hint':           'レバー チップを クリックして その ステージの ルールを きりかえ、または プレイブックを えらぶ。<kbd>n</kbd> で スピーカー ノート。',

      'notes.scene4':
        '<b>ねらい：</b> ポリシーは ステージから レバーへの かんぜんな ちず、ひとつの けってい では ない。<ul>' +
        '<li><b>かんぜんさ</b>を つよく：５ステージ すべてに レバーが つく。ステージ チップを きりかえ、「じょうたいごとに ひとつの けってい」を みせる。</li>' +
        '<li><b>つねにデモ</b> = じだんてきな ていすう ポリシー。<b>あたためて クローズ</b> = もっともらしい にんげんの ヒューリスティック（つめたい→ナーチャー、まんなか→デモ、じゅんび→ハードクローズ）。</li>' +
        '<li>おおきな コールバック：プレイテストで かれらは <i>ポリシー だった</i>、まいタッチ かんで pi(s) を ひいていた、ただ かかれて いなかっただけ。</li>' +
        '<li>ここで さいてき ポリシーを みせては いけない、それは Q* / DP シーンの ごほうび。さいぜんの プレイブックが ひとつ ある とだけ ほのめかす。</li></ul>' +
        '<b>つぎへ：</b> ポリシーの じっこうは トラジェクトリ ＝ ステージ・レバー・みかえり の れつ。',
    },
  });
})();

/* i18n fragment for Scene 3 (Pipeline Climb) - "What makes this an MDP?".
 * English is authoritative; the Japanese mirror reuses the shared pipeline
 * vocabulary (rung names / levers / die faces from js/i18n.js). KaTeX
 * formulas stay in pure math form, so symbols cross both languages. The scene
 * TITLE (scene.title3) lives in js/i18n.js and is NOT redefined here. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      /* manager framing line under the title */
      'scene3.lede':
        'That gut playthrough was a <b>Markov Decision Process</b> all along: the rung the lead sits on, the lever you pull, the part you do not control, the payoff, and how you add it up. Five ingredients. Step through them.',

      /* ingredient rail labels */
      'scene3.rail.s':       'STATE',
      'scene3.rail.a':       'ACTION',
      'scene3.rail.p':       'TRANSITION',
      'scene3.rail.r':       'REWARD',
      'scene3.rail.g':       'DISCOUNT',

      /* the card the ingredients hang on */
      'scene3.board.label':  'THE DEAL YOU RAN',

      /* step 0 - the five ingredients named */
      'scene3.s0.title':     'Five moving parts',
      'scene3.s0.body':
        'Every touch you faced the same loop: read the <b>rung</b>, pull a <b>lever</b>, let the deal <b>roll</b>, and book a <b>payoff</b>. Those parts have names.',
      'scene3.s0.tagS':      'S, the rung',
      'scene3.s0.tagA':      'A, the lever',
      'scene3.s0.tagP':      'P, the roll',
      'scene3.s0.tagR':      'R, payoff',
      'scene3.s0.tagG':      'gamma, sum-up',

      /* step 1 - STATE */
      'scene3.s1.title':     'State: where the lead stands',
      'scene3.s1.manager':
        'Which rung the lead is on, COLD up to READY. That is all you need to pick a lever now; how the lead got here does not matter.',
      'scene3.s1.formal':
        '<b>S</b> = the five rungs COLD..READY, plus two terminals the deal can end on: <b>SIGNED</b> (+30) and <b>LOST</b> (-10).',
      'scene3.s1.foot':      'The ladder card IS the state: one lead, one rung, warmth rising up the rungs.',

      /* step 2 - ACTION */
      'scene3.s2.title':     'Action: the lever you pull',
      'scene3.s2.manager':
        'One lever per touch. Send a soft NURTURE, book the DEMO, or send the contract with a HARD CLOSE.',
      'scene3.s2.formal':
        'The action set <b>A</b> = { NURTURE, DEMO, HARD CLOSE }, soft to aggressive. You pick one each touch; that is your only control.',

      /* step 3 - TRANSITION + REWARD (folded together) */
      'scene3.s3.title':     'Transition and reward: the part you do not control',
      'scene3.s3.manager':
        'You pull the lever; the <b>STAGE DIE</b> decides whether the lead warms a rung, holds, or cools. The roll moves the lead and books the payoff. The odds are printed right on the die, nothing hidden.',
      'scene3.s3.formalP':
        '<b>P(s&prime;, r | s, a)</b>: pull lever <b>a</b> on rung <b>s</b>, roll the die, land UP one rung / STAY / DOWN one rung. DOWN from COLD drops out to LOST.',
      'scene3.s3.formalR':
        '<b>R</b>: every touch costs <b>-1</b> of rep time. The deal-ending touch pays <b>+30</b> on SIGNED or <b>-10</b> on LOST instead.',
      'scene3.s3.dieLabel':  'THE STAGE DIE',
      'scene3.s3.roll':      'ROLL THE DIE',
      'scene3.s3.foot':      'NURTURE warms cold leads cheaply; HARD CLOSE below READY almost always burns the deal. Same die, every time, you just see it.',

      /* step 4 - the tuple */
      'scene3.s4.title':     'Put it together: the 5-tuple',
      'scene3.s4.body':
        'A Markov Decision Process is exactly these five parts bundled together. Nothing else is hidden in your pipeline.',
      'scene3.s4.gamma':
        'No discount here (<b>gamma = 1</b>): every deal ends in SIGNED or LOST, so we just add the touch costs up. A finite deal does the work a discount usually would.',
      'scene3.s4.next':      'Next: a rule that picks a lever for EVERY rung, a policy.',

      /* nav */
      'scene3.next':         'NEXT &#9656;',
      'scene3.prev':         '&#9666; BACK',
      'scene3.stepOf':       'PART {i} / {n}',
      'scene3.hint':         'Use <kbd>&#9656;</kbd> / <kbd>&#9666;</kbd> to step the five ingredients. Press <kbd>n</kbd> for speaker notes.',

      /* speaker notes (lecturer crib) */
      'notes.scene3':
        '<b>Goal:</b> name the five MDP ingredients on the ladder they just played, no new mechanics, only vocabulary.<ul>' +
        '<li><b>State</b> = the rung (COLD..READY) plus the two terminals. Stress <i>Markov</i>: the right lever needs only the current rung, not the history of touches that got there.</li>' +
        '<li><b>Action</b> = the three levers, one per touch.</li>' +
        '<li><b>Transition + reward</b> are folded together: the STAGE DIE both moves the lead and books the payoff. The odds are visible, that is the whole point, and it sets up DP later.</li>' +
        '<li>Reward = -1 per touch, +30 on SIGNED, -10 on LOST. Pause on the -1: every touch is rep time you do not get back.</li>' +
        '<li><b>gamma = 1:</b> every deal terminates, so the undiscounted return is bounded.</li></ul>' +
        '<b>Hook to next:</b> we have the parts; now, what is a rule that pulls a lever on every rung?',
    },

    jp: {
      'scene3.lede':
        'あの かんでの プレイは じつは <b>マルコフ けってい かてい (MDP)</b> でした：リードが いる ステージ、ひく レバー、コントロールできない ぶぶん、みかえり、そして どう たしあげるか。５つの ぶぶんを じゅんに みましょう。',

      'scene3.rail.s':       'じょうたい',
      'scene3.rail.a':       'こうどう',
      'scene3.rail.p':       'せんい',
      'scene3.rail.r':       'みかえり',
      'scene3.rail.g':       'わりびき',

      'scene3.board.label':  'あなたが やった とりひき',

      'scene3.s0.title':     '５つの うごく ぶぶん',
      'scene3.s0.body':
        'まいタッチ おなじ ループ：<b>ステージ</b>を よみ、<b>レバー</b>を ひき、とりひきが <b>ころがり</b>、<b>みかえり</b>を うけとる。この ぶぶんに なまえが あります。',
      'scene3.s0.tagS':      'S, ステージ',
      'scene3.s0.tagA':      'A, レバー',
      'scene3.s0.tagP':      'P, ころがり',
      'scene3.s0.tagR':      'R, みかえり',
      'scene3.s0.tagG':      'gamma, たしあげ',

      'scene3.s1.title':     'じょうたい：リードの いちは どこか',
      'scene3.s1.manager':
        'リードが どの ステージに いるか、コールドから じゅんびまで。いま レバーを えらぶのに ひつような すべて。ここに きた けいろは かんけい ありません。',
      'scene3.s1.formal':
        '<b>S</b> = ５つの ステージ コールド..じゅんび、それに とりひきが おわる ２つの しゅうたん：<b>サイン</b> (+30) と <b>ロスト</b> (-10)。',
      'scene3.s1.foot':      'ラダー カードが じょうたい そのもの：リード１つ、ステージ１つ、うえほど あつくなる。',

      'scene3.s2.title':     'こうどう：ひく レバー',
      'scene3.s2.manager':
        '１タッチに １つの レバー。やわらかい ナーチャー、デモを くむ、または ハードクローズで けいやくを おくる。',
      'scene3.s2.formal':
        'こうどう しゅうごう <b>A</b> = { ナーチャー, デモ, ハードクローズ }、やわらかい から つよい へ。まいタッチ １つ えらぶ。これが ゆいいつの コントロール。',

      'scene3.s3.title':     'せんい と みかえり：コントロールできない ぶぶん',
      'scene3.s3.manager':
        'レバーは あなたが ひき、<b>ステージ ダイ</b>が リードが ステージを あげるか、とどまるか、さげるか きめます。ころがりが リードを うごかし、みかえりを はらう。かくりつは ダイに かいてあり、かくしごとは ありません。',
      'scene3.s3.formalP':
        '<b>P(s&prime;, r | s, a)</b>：ステージ <b>s</b> で レバー <b>a</b> を ひき、ダイを ころがし、アップ１つ / ステイ / ダウン１つ に おちる。コールドで ダウンは ロストへ ぬける。',
      'scene3.s3.formalR':
        '<b>R</b>：どの タッチも レップの じかんを <b>-1</b>。とりひきを おえる タッチは サインで <b>+30</b>、ロストで <b>-10</b> を かわりに はらう。',
      'scene3.s3.dieLabel':  'ステージ ダイ',
      'scene3.s3.roll':      'ダイを ころがす',
      'scene3.s3.foot':      'ナーチャーは つめたい リードを やすく あたためる。じゅんび いがいでの ハードクローズは ほぼ とりひきを やく。さいは いつも おなじ、ただ みえるだけ。',

      'scene3.s4.title':     'まとめ：５つぐみ',
      'scene3.s4.body':
        'マルコフ けってい かてい とは、まさに この ５つを まとめた もの。あなたの パイプラインに かくれた ものは ほかに ありません。',
      'scene3.s4.gamma':
        'ここでは わりびき なし (<b>gamma = 1</b>)：どの とりひきも サインか ロストで おわるので、タッチの コストを たすだけ。ゆうげんの とりひきが わりびきの やくめを はたします。',
      'scene3.s4.next':      'つぎ：すべての ステージに レバーを えらぶ ルール、ポリシー。',

      'scene3.next':         'つぎ &#9656;',
      'scene3.prev':         '&#9666; もどる',
      'scene3.stepOf':       'パート {i} / {n}',
      'scene3.hint':         '<kbd>&#9656;</kbd> / <kbd>&#9666;</kbd> で ５つの ぶぶんを すすめる。<kbd>n</kbd> で スピーカー ノート。',

      'notes.scene3':
        '<b>ねらい：</b> いま プレイした ラダーの うえで MDPの ５つの ぶぶんに なまえを つける、あたらしい しくみは なく、ようごだけ。<ul>' +
        '<li><b>じょうたい</b> = ステージ (コールド..じゅんび) と ２つの しゅうたん。<i>マルコフせい</i>を きょうちょう：ただしい レバーは いまの ステージだけで きまり、けいろは いらない。</li>' +
        '<li><b>こうどう</b> = ３つの レバー、１タッチ １つ。</li>' +
        '<li><b>せんい＋みかえり</b>を まとめる：ステージ ダイが うごかし、かつ はらう。かくりつが みえるのが ようてんで、のちの DPに つながる。</li>' +
        '<li>みかえり = タッチごとに -1、サインで +30、ロストで -10。-1 で ひとこきゅう：どの タッチも もどらない レップの じかん。</li>' +
        '<li><b>gamma = 1：</b> どの とりひきも おわるので、わりびき なしでも リターンは ゆうかい。</li></ul>' +
        '<b>つぎへ：</b> ぶぶんは そろった。では すべての ステージで レバーを ひく ルールとは？',
    },
  });
})();

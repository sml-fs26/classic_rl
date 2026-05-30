/* scene3 i18n fragment -- "What makes this an MDP?" (Formalization).
   English is the source of truth; the Japanese mirror gives full parity.
   KaTeX formulas stay in pure math form (symbols cross languages). */
(function () {
  window.I18N.register({
    en: {
      'scene3.title': "What makes this an MDP?",

      /* manager framing line under the title */
      'scene3.lede':
        'Your gut playthrough was a <b>Markov Decision Process</b> all along: the situation, the lever, the part you do not control, and the payoff. Four parts. Step through them.',

      /* step rail labels */
      'scene3.rail.parts':   'THE FOUR PARTS',
      'scene3.rail.s':       'STATE',
      'scene3.rail.a':       'ACTION',
      'scene3.rail.p':       'TRANSITION',
      'scene3.rail.r':       'REWARD',

      /* the card the four parts hang on */
      'scene3.board.label':  'THE SITUATION YOU PLAYED',

      /* step 0 -- the four parts named */
      'scene3.s0.title':     'Four moving parts',
      'scene3.s0.body':
        'Every day you faced the same loop: read your <b>situation</b>, pull a <b>lever</b>, let the market <b>decide</b>, and collect a <b>payoff</b>. Those four parts have names.',
      'scene3.s0.tagS':      'S, situation',
      'scene3.s0.tagA':      'A, lever',
      'scene3.s0.tagP':      'P, the draw',
      'scene3.s0.tagR':      'R, payoff',

      /* step 1 -- STATE */
      'scene3.s1.title':     'State: the situation right now',
      'scene3.s1.manager':
        'How much stock you are holding and how little time is left. That is everything you need to decide today; the past does not matter.',
      'scene3.s1.formal':
        '<b>s = (u, d)</b>: units left <b>u</b> in 1..5, days to the deadline <b>d</b> in 1..4. The board is every situation at once, a 5x4 grid of 20.',
      'scene3.s1.foot':      'The shelf card IS the state: stock on the left, clock on the right.',

      /* step 2 -- ACTION */
      'scene3.s2.title':     'Action: the lever you pull',
      'scene3.s2.manager':
        'One price tag per day. Hold out for the premium, take the steady middle, or cut deep to clear the shelf.',
      'scene3.s2.formal':
        'The action set <b>A</b> = { PREMIUM, STANDARD, FIRE-SALE }. You choose one each day; that is your only control.',

      /* step 3 -- TRANSITION + REWARD (folded together) */
      'scene3.s3.title':     'Transition and reward: the part you do not control',
      'scene3.s3.manager':
        'You set the price; the <b>market</b> decides how many buy. The demand draw sends you to tomorrow’s situation and pays you today’s cash. The probabilities are printed right on the lever, nothing hidden.',
      'scene3.s3.formalP':
        '<b>P(s′, r | s, a)</b>: pull lever <b>a</b> in situation <b>s</b>, draw demand, sell what you can. Time ticks down one day; stock drops by what sold.',
      'scene3.s3.formalR':
        '<b>R</b>: reward <b>r = price x units sold today</b>. Units still on the shelf at the deadline are worth <b>$0</b>, the whole sting in one number.',
      'scene3.s3.drawLabel': 'THE DEMAND DRAW',
      'scene3.s3.foot':      'PREMIUM rarely moves stock; FIRE-SALE almost always clears several. Same dice, every time, you just see them.',

      /* step 4 -- the tuple */
      'scene3.s4.title':     'Put it together: the 4-tuple',
      'scene3.s4.body':
        'A Markov Decision Process is exactly these four parts bundled together. Nothing more is hidden in your pricing problem.',
      'scene3.s4.kS':        'situation',
      'scene3.s4.kA':        'lever',
      'scene3.s4.kP':        'the draw',
      'scene3.s4.kR':        'payoff',
      'scene3.s4.gamma':
        'No discount here (gamma = 1): the deadline is only four days out, so we just add the cash up. The clock does the work a discount usually would.',
      'scene3.s4.next':      'Next: a rule that picks a lever for EVERY situation, a policy.',

      /* nav */
      'scene3.next':         'NEXT ▸',
      'scene3.prev':         '◂ BACK',
      'scene3.stepOf':       'PART {i} / {n}',
      'scene3.hint':         'Use <kbd>▸</kbd> / <kbd>◂</kbd> to step the four parts. Press <kbd>n</kbd> for speaker notes.',

      /* speaker notes (lecturer crib) */
      'notes.scene3':
        '<b>Goal:</b> name the four MDP parts on the board they just played, no new mechanics, only vocabulary.<ul>' +
        '<li><b>State</b> = the shelf card (u, d). Stress <i>Markov</i>: today’s right move needs only today’s situation, not the history of how you got here.</li>' +
        '<li><b>Action</b> = the three levers; one per day.</li>' +
        '<li><b>Transition + reward</b> are folded together: the demand draw both moves you and pays you. The probabilities are visible, that is the whole point, and it sets up DP later.</li>' +
        '<li>Reward = price x units sold; leftover at the deadline = $0. Pause on the $0, it is the entire tension of revenue management.</li>' +
        '<li><b>gamma = 1:</b> finite 4-day horizon, so returns are bounded without discounting.</li></ul>' +
        '<b>Hook to next:</b> we have the parts; now, what is a rule that pulls a lever in every situation?',
    },

    jp: {
      'scene3.title': "これが MDPなのは なぜ？",

      'scene3.lede':
        'あなたの かんでの プレイは じつは <b>マルコフ けっていかてい (MDP)</b> でした：じょうきょう、レバー、コントロールできない ぶぶん、そして みかえり。４つの ぶぶんを じゅんに みましょう。',

      'scene3.rail.parts':   '４つの ぶぶん',
      'scene3.rail.s':       'じょうたい',
      'scene3.rail.a':       'こうどう',
      'scene3.rail.p':       'せんい',
      'scene3.rail.r':       'みかえり',

      'scene3.board.label':  'あなたが プレイした じょうきょう',

      'scene3.s0.title':     '４つの うごく ぶぶん',
      'scene3.s0.body':
        'まいにち おなじ ループでした：<b>じょうきょう</b>を よみ、<b>レバー</b>を ひき、しじょうが <b>きめ</b>、<b>みかえり</b>を うけとる。この４つに なまえが あります。',
      'scene3.s0.tagS':      'S, じょうきょう',
      'scene3.s0.tagA':      'A, レバー',
      'scene3.s0.tagP':      'P, ひき',
      'scene3.s0.tagR':      'R, みかえり',

      'scene3.s1.title':     'じょうたい：いまの じょうきょう',
      'scene3.s1.manager':
        'ざいこが どれだけ あり、じかんが どれだけ すくないか。きょう きめるのに ひつような すべてです。すぎたことは かんけい ありません。',
      'scene3.s1.formal':
        '<b>s = (u, d)</b>：ざいこ <b>u</b> は 1..5、しめきりまでの にっすう <b>d</b> は 1..4。ばんは すべての じょうきょうを いちどに ＝ 5x4 の 20マス。',
      'scene3.s1.foot':      'たなカードが じょうたい そのもの：ひだりに ざいこ、みぎに とけい。',

      'scene3.s2.title':     'こうどう：ひく レバー',
      'scene3.s2.manager':
        '１にちに １つの ねふだ。プレミアムで まつか、まんなかで いくか、ふかく さげて たなを からにするか。',
      'scene3.s2.formal':
        'こうどう しゅうごう <b>A</b> = { プレミアム, スタンダード, おおやすうり }。まいにち １つ えらぶ。これが ゆいいつの コントロール。',

      'scene3.s3.title':     'せんい と みかえり：コントロールできない ぶぶん',
      'scene3.s3.manager':
        'ねだんは あなたが きめ、<b>しじょう</b>が なんこ うれるか きめます。じゅようの ひきが あすの じょうきょうへ おくり、きょうの げんきんを はらいます。かくりつは レバーに かいてあり、かくしごとは ありません。',
      'scene3.s3.formalP':
        '<b>P(s′, r | s, a)</b>：じょうきょう <b>s</b> で レバー <b>a</b> を ひき、じゅようを ひき、うれるだけ うる。じかんは １にち へり、ざいこは うれたぶん へる。',
      'scene3.s3.formalR':
        '<b>R</b>：みかえり <b>r = ねだん x きょう うれた こすう</b>。しめきりに のこった ざいこは <b>$0</b>、すべての つらさが この１つの すうじに。',
      'scene3.s3.drawLabel': 'じゅようの ひき',
      'scene3.s3.foot':      'プレミアムは めったに うごかず、おおやすうりは ほぼ いつも すうこ さばく。さいは いつも おなじ、ただ みえるだけ。',

      'scene3.s4.title':     'まとめ：４つぐみ',
      'scene3.s4.body':
        'マルコフ けっていかてい とは、まさに この４つを まとめた もの。あなたの プライシング もんだいに かくれた ものは ほかに ありません。',
      'scene3.s4.kS':        'じょうきょう',
      'scene3.s4.kA':        'レバー',
      'scene3.s4.kP':        'ひき',
      'scene3.s4.kR':        'みかえり',
      'scene3.s4.gamma':
        'ここでは わりびき なし (gamma = 1)：しめきりは ４にちさきだけ なので、げんきんを たすだけ。とけいが わりびきの やくめを はたします。',
      'scene3.s4.next':      'つぎ：すべての じょうきょうに レバーを わりあてる ルール、ほうさく。',

      'scene3.next':         'つぎ ▸',
      'scene3.prev':         '◂ もどる',
      'scene3.stepOf':       'パート {i} / {n}',
      'scene3.hint':         '<kbd>▸</kbd> / <kbd>◂</kbd> で ４つの ぶぶんを すすめる。<kbd>n</kbd> で スピーカー ノート。',

      'notes.scene3':
        '<b>ねらい：</b> いま プレイした ばんの うえで MDPの ４つの ぶぶんに なまえを つける、あたらしい しくみは なく、ようごだけ。<ul>' +
        '<li><b>じょうたい</b> = たなカード (u, d)。<i>マルコフせい</i>を きょうちょう：きょうの さいぜんしゅは きょうの じょうきょうだけで きまり、けいろは いらない。</li>' +
        '<li><b>こうどう</b> = ３つの レバー、１にち １つ。</li>' +
        '<li><b>せんい＋みかえり</b>を まとめる：じゅようの ひきが うごかし、かつ はらう。かくりつが みえるのが ようてんで、のちの DPに つながる。</li>' +
        '<li>みかえり = ねだん x うれた こすう、しめきりの のこりは $0。$0 で ひとこきゅう、レベニュー マネジメントの きんちょう その もの。</li>' +
        '<li><b>gamma = 1：</b> ４にちの ゆうげん ホライズン なので、わりびき なしでも リターンは ゆうかい。</li></ul>' +
        '<b>つぎへ：</b> ぶぶんは そろった。では すべての じょうきょうで レバーを ひく ルールとは？',
    },
  });
})();

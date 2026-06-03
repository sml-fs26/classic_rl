/* scene1 i18n fragment -- TUTORIAL ("How to read the shelf").
   English is the source of truth; the Japanese mirror gives full parity.
   No RL theory here: pure vocabulary -- the shelf (units), the countdown
   (days to deadline), the three price tags, the demand deck, one demo day. */
(function () {
  window.I18N.register({
    en: {
      'scene1.title': 'How to read the shelf',

      /* step counter + nav chrome */
      'scene1.step_of':   'STEP {i} / {total}',
      'scene1.skip':      'SKIP',
      'scene1.skip_title':'Jump straight to running the shelf',
      'scene1.go_play':   'RUN THE SHELF',
      'scene1.nav.back':  'BACK',
      'scene1.nav.next':  'NEXT',
      'scene1.nav.hint':  'Tap <b>BACK</b> / <b>NEXT</b> (or use <kbd>&larr;</kbd> <kbd>&rarr;</kbd>) to step. SKIP jumps to the playtest.',

      /* step 1 -- welcome / the shelf card */
      'scene1.welcome.title':  'The shelf card',
      'scene1.welcome.big':    'ONE PICTURE, TWO NUMBERS',
      'scene1.welcome.small':  'How much stock you hold, and how little time is left.',
      'scene1.welcome.dialog': 'You sell something that rots: a seat, a room, a slot. This card is your whole situation at a glance. The tickets on the left are your STOCK; the calendar on the right is your TIME. Read it, and you know where you stand.',

      /* step 2 -- units / the stock */
      'scene1.units.title':  'The shelf: units left',
      'scene1.units.dialog': 'The stack on the left is your STOCK. Each lit ticket is one unit you still have to sell. Sell one and it slides off; the shelf empties from the top. Run out and you are SOLD OUT, the best outcome.',
      'scene1.units.cap.full':  'A FULL SHELF: 5 units to move',
      'scene1.units.cap.some':  'SELLING DOWN: 3 units left',
      'scene1.units.cap.last':  'ALMOST GONE: 1 unit left',
      'scene1.units.note':      'Lit ticket = a unit you can still sell. Greyed = already sold or gone.',

      /* step 3 -- days / the clock */
      'scene1.days.title':  'The countdown: days to the deadline',
      'scene1.days.dialog': 'The pips on the right are your TIME: days left before the deadline. Each day you price, one pip goes dark. When the last one goes out it is MIDNIGHT, the deadline. Anything still on the shelf then is worth nothing.',
      'scene1.days.cap.four': 'FOUR DAYS of runway',
      'scene1.days.cap.two':  'TWO DAYS left',
      'scene1.days.cap.mid':  'MIDNIGHT: the deadline',
      'scene1.days.note':     'Time only ticks DOWN: one day per decision. Leftover units crumble to $0 at midnight.',

      /* step 4 -- the three price tags + demand odds */
      'scene1.levers.title':  'Your three price tags',
      'scene1.levers.dialog': 'Each day you pull ONE price tag. A high price moves few units; a deep cut clears the shelf. The odds on each tag say how many buyers show up, the part you do not control.',
      'scene1.levers.premium.tag':  'HOLD OUT FOR THE HIGH PRICE',
      'scene1.levers.standard.tag': 'THE STEADY MIDDLE',
      'scene1.levers.firesale.tag': 'CUT DEEP, CLEAR STOCK',
      'scene1.levers.odds':         'units sold today',
      'scene1.levers.perUnit':      '/unit',
      'scene1.levers.axis.l':       'fewer buyers',
      'scene1.levers.axis.r':       'more buyers',
      'scene1.levers.note':         'Cash you collect = price times units sold. The odds are printed so the dice are never hidden.',

      /* step 5 -- one slow demo day */
      'scene1.demo.title':   'One day, start to finish',
      'scene1.demo.dialog':  'Watch one full day. We pull STANDARD ($3). The DEMAND DECK flips a card to decide how many buy. Here, one. A ticket slides off with a +$3, the day tears away, and the shelf moves to tomorrow. That is the whole loop.',
      'scene1.demo.play':    'PLAY THE DAY',
      'scene1.demo.replay':  'REPLAY',
      'scene1.demo.picked':  "TODAY'S TAG",
      'scene1.demo.collected':'COLLECTED',
      'scene1.demo.step.set':  '1. Pull STANDARD ($3/unit).',
      'scene1.demo.step.flip': '2. Flip the demand deck.',
      'scene1.demo.step.sold': '3. {k} unit sold. Collect +${r}.',
      'scene1.demo.step.tick': '4. A day tears off. On to tomorrow.',
      'scene1.demo.outro':     'That is one day. Now you run the whole stretch.',
      'scene1.demo.note':      'The demand draw is the ONLY randomness here: no opponent, just buyers.',
    },
    jp: {
      'scene1.title': 'たなの よみかた',

      'scene1.step_of':   'ステップ {i} / {total}',
      'scene1.skip':      'スキップ',
      'scene1.skip_title':'たな うんえいへ すすむ',
      'scene1.go_play':   'たなを うごかす',
      'scene1.nav.back':  'もどる',
      'scene1.nav.next':  'つぎへ',
      'scene1.nav.hint':  '<b>もどる</b> / <b>つぎへ</b> を タップ（または <kbd>&larr;</kbd> <kbd>&rarr;</kbd>）で すすむ。 スキップで プレイテストへ。',

      'scene1.welcome.title':  'たなカード',
      'scene1.welcome.big':    '1まいの え、 2つの すうじ',
      'scene1.welcome.small':  'ざいこは どれだけ、 のこり じかんは どれだけ。',
      'scene1.welcome.dialog': 'あなたは くさるものを うっています: ざせき、へや、わく。 このカードが いまの じょうきょう ぜんぶ。 ひだりの チケットが ざいこ、 みぎの カレンダーが じかん。 よめば いまの たちいちが わかります。',

      'scene1.units.title':  'たな: のこり ざいこ',
      'scene1.units.dialog': 'ひだりの やまが ざいこ。 ひかる チケット 1まいが、 まだ うれる 1こ。 うれると スライドして きえ、 たなは うえから あいていく。 ぜんぶ うれると うりきれ、 さいこうの けっか。',
      'scene1.units.cap.full':  'まんたんの たな: 5こ',
      'scene1.units.cap.some':  'うれてきた: のこり 3こ',
      'scene1.units.cap.last':  'あと わずか: のこり 1こ',
      'scene1.units.note':      'ひかる チケット = まだ うれる ざいこ。 はいいろ = うれた／きえた。',

      'scene1.days.title':  'カウントダウン: しめきりまでの にっすう',
      'scene1.days.dialog': 'みぎの ますが じかん: しめきりまでの のこり にっすう。 ねだんを つけるたび 1ます くらくなる。 さいごが きえると まよなか、 しめきり。 のこった ざいこは ゼロに なる。',
      'scene1.days.cap.four': 'のこり 4にち',
      'scene1.days.cap.two':  'のこり 2にち',
      'scene1.days.cap.mid':  'まよなか: しめきり',
      'scene1.days.note':     'じかんは へるだけ: 1けってい 1にち。 のこった ざいこは まよなかに $0。',

      'scene1.levers.title':  '3つの ねふだ',
      'scene1.levers.dialog': 'まいにち ねふだを 1つ ひく。 たかい ねだんは すこししか うれず、 おおやすうりは たなを はく。 ふだの かくりつが きゃくの かず、 それは あなたの しはいの そと。',
      'scene1.levers.premium.tag':  'たかねを ねらう',
      'scene1.levers.standard.tag': 'てがたい まんなか',
      'scene1.levers.firesale.tag': 'おおきく きって はく',
      'scene1.levers.odds':         'きょうの はんばいすう',
      'scene1.levers.perUnit':      '/こ',
      'scene1.levers.axis.l':       'きゃく すくない',
      'scene1.levers.axis.r':       'きゃく おおい',
      'scene1.levers.note':         'うりあげ = ねだん かける はんばいすう。 かくりつは みえている。 さいころは かくさない。',

      'scene1.demo.title':   '1にち、 はじめから おわりまで',
      'scene1.demo.dialog':  '1にちぶん みてみる。 スタンダード ($3) を ひく。 じゅようデッキが カードを めくり、 なんこ うれるか きめる。 ここでは 1こ。 チケットが +$3 で スライドし、 ひが ちぎれ、 たなは あすへ。 これが ループの ぜんぶ。',
      'scene1.demo.play':    'この1にちを みる',
      'scene1.demo.replay':  'もういちど',
      'scene1.demo.picked':  'きょうの ふだ',
      'scene1.demo.collected':'かくとく',
      'scene1.demo.step.set':  '1. スタンダード ($3/こ) を ひく。',
      'scene1.demo.step.flip': '2. じゅようデッキを めくる。',
      'scene1.demo.step.sold': '3. {k}こ うれた。 +${r} かくとく。',
      'scene1.demo.step.tick': '4. ひが ちぎれる。 あすへ。',
      'scene1.demo.outro':     'これで 1にち。 つぎは ぜんきかんを あなたが。',
      'scene1.demo.note':      'じゅようの ちゅうせんが ゆいいつの ランダム: てきは いない、 きゃくだけ。',
    },
  });
})();

/* scene1 i18n fragment, TUTORIAL ("How to read the flight").
   English is the source of truth; the Japanese mirror gives full parity.
   No RL theory here: pure vocabulary, the cabin (seats), the departure
   board (days to departure), the three price tags, the demand deck, one
   demo day. */
(function () {
  window.I18N.register({
    en: {
      'scene1.title': 'How to read the flight',

      /* step counter + nav chrome */
      'scene1.step_of':   'STEP {i} / {total}',
      'scene1.skip':      'SKIP',
      'scene1.skip_title':'Jump straight to selling the flight',
      'scene1.go_play':   'SELL THE FLIGHT',
      'scene1.nav.back':  'BACK',
      'scene1.nav.next':  'NEXT',
      'scene1.nav.hint':  'Tap <b>BACK</b> / <b>NEXT</b> (or use <kbd>&larr;</kbd> <kbd>&rarr;</kbd>) to step. SKIP jumps to the playtest.',

      /* step 1, welcome / the flight card */
      'scene1.welcome.title':  'The flight card',
      'scene1.welcome.big':    'ONE PICTURE, TWO NUMBERS',
      'scene1.welcome.small':  'How many seats you hold, and how little time is left.',
      'scene1.welcome.dialog': 'You sell something that expires: an airline seat, worth real money today and exactly $0 once the gate closes. This card is your whole situation at a glance. The SEATS on the left are your stock; the DEPARTURE BOARD on the right is your time. Read it, and you know where you stand.',

      /* step 2, seats / the stock */
      'scene1.units.title':  'The cabin: seats left',
      'scene1.units.dialog': 'The stack on the left is your STOCK. Each lit seat is one you still have to sell. Sell one and it slides off; the stack empties from the top. Sell the last seat and it is a FULL FLIGHT, the best finish.',
      'scene1.units.cap.full':  'A FULL CABIN: 5 seats to sell',
      'scene1.units.cap.some':  'SELLING DOWN: 3 seats left',
      'scene1.units.cap.last':  'ALMOST GONE: 1 seat left',
      'scene1.units.note':      'Lit seat = one you can still sell. Greyed = already sold.',

      /* step 3, days / the departure board */
      'scene1.days.title':  'The board: days to departure',
      'scene1.days.dialog': 'The tiles on the right are your TIME: days left before departure. Each day you price, one tile flips dark. When the last one flips it is GATE CLOSED, the deadline. Any seat still unsold then is worth nothing.',
      'scene1.days.cap.four': 'FOUR DAYS of runway',
      'scene1.days.cap.two':  'TWO DAYS left',
      'scene1.days.cap.mid':  'GATE CLOSED: the deadline',
      'scene1.days.note':     'Time only ticks DOWN: one day per decision. Unsold seats fly empty for $0 once the gate closes.',

      /* step 4, the two price tags */
      'scene1.levers.title':  'Your two price tags',
      'scene1.levers.dialog': 'Each day you pull ONE price tag. A high price tends to sell few seats; a deep cut tends to clear the cabin. But how many buyers actually show up is hidden, the part you neither control nor get to see in advance.',
      'scene1.levers.premium.tag':  'HOLD OUT FOR THE HIGH PRICE',
      'scene1.levers.standard.tag': 'CUT THE PRICE, FILL THE CABIN',
      'scene1.levers.perUnit':      '/seat',
      'scene1.levers.axis.l':       'fewer buyers',
      'scene1.levers.axis.r':       'more buyers',
      'scene1.levers.note':         'Cash you collect = price times seats sold. The odds are NOT printed: you only learn how a tag behaves by pulling it.',

      /* step 5, one slow demo day */
      'scene1.demo.title':   'One day, start to finish',
      'scene1.demo.dialog':  'Watch one full day. We pull STANDARD ($2). The DEMAND DECK flips a card to decide how many buy. Here, one. A seat sells with a +$2, a day flips off the board, and the flight moves one day closer. That is the whole loop.',
      'scene1.demo.play':    'PLAY THE DAY',
      'scene1.demo.replay':  'REPLAY',
      'scene1.demo.picked':  "TODAY'S TAG",
      'scene1.demo.collected':'COLLECTED',
      'scene1.demo.step.set':  '1. Pull STANDARD ($3/seat).',
      'scene1.demo.step.flip': '2. Flip the demand deck.',
      'scene1.demo.step.sold': '3. {k} seat sold. Collect +${r}.',
      'scene1.demo.step.tick': '4. A day flips off the board. One day closer.',
      'scene1.demo.outro':     'That is one day. Now you run the whole stretch.',
      'scene1.demo.note':      'The demand draw is the ONLY randomness here: no opponent, just buyers.',
    },
    jp: {
      'scene1.title': 'フライトの よみかた',

      'scene1.step_of':   'ステップ {i} / {total}',
      'scene1.skip':      'スキップ',
      'scene1.skip_title':'フライト はんばいへ すすむ',
      'scene1.go_play':   'フライトを うる',
      'scene1.nav.back':  'もどる',
      'scene1.nav.next':  'つぎへ',
      'scene1.nav.hint':  '<b>もどる</b> / <b>つぎへ</b> を タップ（または <kbd>&larr;</kbd> <kbd>&rarr;</kbd>）で すすむ。 スキップで プレイテストへ。',

      'scene1.welcome.title':  'フライトカード',
      'scene1.welcome.big':    '1まいの え、 2つの すうじ',
      'scene1.welcome.small':  'ざせきは どれだけ、 のこり じかんは どれだけ。',
      'scene1.welcome.dialog': 'あなたは きげんぎれの ものを うっています: こうくうの ざせき。 きょうは おかねに なるが、 ゲートが しまれば $0。 このカードが いまの じょうきょう ぜんぶ。 ひだりの ざせきが ざいこ、 みぎの しゅっぱつボードが じかん。 よめば いまの たちいちが わかります。',

      'scene1.units.title':  'きゃくしつ: のこり ざせき',
      'scene1.units.dialog': 'ひだりの やまが ざいこ。 ひかる ざせき 1つが、 まだ うれる 1せき。 うれると スライドして きえ、 うえから あいていく。 ぜんぶ うれると まんせき、 さいこうの けっか。',
      'scene1.units.cap.full':  'まんたんの きゃくしつ: 5せき',
      'scene1.units.cap.some':  'うれてきた: のこり 3せき',
      'scene1.units.cap.last':  'あと わずか: のこり 1せき',
      'scene1.units.note':      'ひかる ざせき = まだ うれる せき。 はいいろ = うれた せき。',

      'scene1.days.title':  'しゅっぱつボード: しゅっぱつまでの にっすう',
      'scene1.days.dialog': 'みぎの ますが じかん: しゅっぱつまでの のこり にっすう。 ねだんを つけるたび 1ます くらくなる。 さいごが きえると ゲートクローズ、 しめきり。 のこった ざせきは ゼロに なる。',
      'scene1.days.cap.four': 'のこり 4にち',
      'scene1.days.cap.two':  'のこり 2にち',
      'scene1.days.cap.mid':  'ゲートクローズ: しめきり',
      'scene1.days.note':     'じかんは へるだけ: 1けってい 1にち。 のこった ざせきは ゲートが しまると $0。',

      'scene1.levers.title':  '2つの ねふだ',
      'scene1.levers.dialog': 'まいにち ねふだを 1つ ひく。 たかい ねだんは すこししか うれにくく、 ねさげは ざせきを はきやすい。 でも じっさいに きゃくが なんにん くるかは みえない。 しはいも できず、 まえもって しる ことも できない。',
      'scene1.levers.premium.tag':  'たかねを ねらう',
      'scene1.levers.standard.tag': 'ねさげで ざせきを はく',
      'scene1.levers.perUnit':      '/せき',
      'scene1.levers.axis.l':       'きゃく すくない',
      'scene1.levers.axis.r':       'きゃく おおい',
      'scene1.levers.note':         'うりあげ = ねだん かける はんばいすう。 かくりつは ひょうじ されない: ひいて みて はじめて わかる。',

      'scene1.demo.title':   '1にち、 はじめから おわりまで',
      'scene1.demo.dialog':  '1にちぶん みてみる。 スタンダード ($2) を ひく。 じゅようデッキが カードを めくり、 なんせき うれるか きめる。 ここでは 1せき。 ざせきが +$2 で スライドし、 ボードが 1ます くらくなり、 しゅっぱつが 1にち ちかづく。 これが ループの ぜんぶ。',
      'scene1.demo.play':    'この1にちを みる',
      'scene1.demo.replay':  'もういちど',
      'scene1.demo.picked':  'きょうの ふだ',
      'scene1.demo.collected':'かくとく',
      'scene1.demo.step.set':  '1. スタンダード ($3/せき) を ひく。',
      'scene1.demo.step.flip': '2. じゅようデッキを めくる。',
      'scene1.demo.step.sold': '3. {k}せき うれた。 +${r} かくとく。',
      'scene1.demo.step.tick': '4. ボードが 1ます くらくなる。 1にち ちかづく。',
      'scene1.demo.outro':     'これで 1にち。 つぎは ぜんきかんを あなたが。',
      'scene1.demo.note':      'じゅようの ちゅうせんが ゆいいつの ランダム: てきは いない、 きゃくだけ。',
    },
  });
})();

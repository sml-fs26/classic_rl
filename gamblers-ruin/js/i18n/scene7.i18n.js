/* scene7 i18n -- optimal action-value Q*. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title':  'Optimal action-value Q*',
      'scene7.lede':   'Q*(s, a) is the true long-run value of placing stake a at capital s, <em>assuming you bet smart on every flip afterward</em>. Because returns are win-probabilities, each Q* value is your honest odds of reaching $10.',
      'scene7.formulaLabel': 'THE BEST LONG-RUN VALUE OF A STAKE, PLAYED SMART AFTERWARD',
      'scene7.pick':   'Inspect a rung:',
      'scene7.colStake':'stake a',
      'scene7.colQ':   'Q*(s, a) = win probability',
      'scene7.best':   'BEST',
      'scene7.clamped':'not available here',
      'scene7.at':     'At capital ${cap}:',
      /* per-state read-outs */
      'scene7.read.3': 'At $3 all three stakes are legal, and <b>bold $3 wins</b> (0.166 vs 0.154 timid). In the dangerous middle, fewer-but-bigger bets give the rigged coin fewer chances to grind you down.',
      'scene7.read.5': 'At $5 there is a genuine <b>tie</b>: bet $2 and bet $3 give identical odds (0.318). Sometimes two levers are truly equivalent. We break ties to the larger stake.',
      'scene7.read.8': 'At $8 you cannot bet $3 (it would overshoot $10), so the choice is forced to <b>$2</b> (0.649). Part insight, part arithmetic.',
      'scene7.read.9': 'At $9 you only need $1 to win, so <b>bet $1</b> (0.790), and it is not close. When you are almost home, protect the lead.',
      'scene7.note':   'The star <b>moves</b> as you climb: timid at the edges, bold through the middle. The optimal stake is not one habit; it changes rung by rung.',
      'scene7.framing':'The honest probability each stake gives you of hitting target, played out smart to the end, and the best stake is not the same at $3, $5, and $8.',
    },
    jp: {
      'scene7.title':  'さいてき こうどうかち Q*',
      'scene7.lede':   'Q*(s, a) は しさん s で かけきん a を おく ことの、ちょうきてきな ほんとうの かち です、<em>そのあとの コインなげは まいかい かしこく かける と かていして</em>。リターンは かちかくりつ なので、どの Q* の あたいも $10 に とどく あなたの しょうじきな かくりつ です。',
      'scene7.formulaLabel': 'かけきんの ちょうきてきな さいてきかち、あとは かしこく あそぶ',
      'scene7.pick':   'だんを しらべる:',
      'scene7.colStake':'かけきん a',
      'scene7.colQ':   'Q*(s, a) = かちかくりつ',
      'scene7.best':   'さいこう',
      'scene7.clamped':'ここでは えらべません',
      'scene7.at':     'しさん ${cap} のとき:',
      'scene7.read.3': '$3 では 3つの かけきん すべてが ゆるされ、<b>だいたん $3 が かち</b>（0.166 たい しんちょう 0.154）。きけんな まんなかでは、すくなく おおきく かける ほうが、いかさまコインに けずる チャンスを あたえません。',
      'scene7.read.5': '$5 では ほんとうの <b>ひきわけ</b>: $2 と $3 が おなじ かくりつ（0.318）。ときには 2つの レバーが ほんとうに おなじです。ひきわけは おおきい かけきんに きめます。',
      'scene7.read.8': '$8 では $3 を かけられません（$10 を こえてしまう）、なので えらびは <b>$2</b> に きまります（0.649）。はんぶん きづき、はんぶん けいさん。',
      'scene7.read.9': '$9 では かつのに $1 しか いらない、だから <b>$1</b>（0.790）、しかも さは おおきい。ゴールが もう ちかいときは、リードを まもろう。',
      'scene7.note':   'のぼるにつれて ほしが <b>うごきます</b>: はしでは しんちょう、まんなかでは だいたん。さいてきな かけきんは くせ ひとつでは なく、だんごとに かわります。',
      'scene7.framing':'それぞれの かけきんが、さいごまで かしこく あそんで ゴールに とどく しょうじきな かくりつ、そして さいこうの かけきんは $3、$5、$8 で おなじでは ありません。',
    },
  });
})();

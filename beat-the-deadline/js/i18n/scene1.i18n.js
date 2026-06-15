/* scene1 i18n -- tutorial / how to play. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene1.title':  'How to play',
      'scene1.lede':   'No theory yet, just the controls. Read the situation, then pull a lever.',
      'scene1.s1':     'THE SITUATION (the state)',
      'scene1.s1body': 'The dock tile reads two numbers: <b>pallets waiting</b> (the crate stack) and <b>hours to the deadline</b> (the draining clock). Here: 2 pallets, 4 hours.',
      'scene1.s2':     'THE TWO LEVERS (the actions)',
      'scene1.s2body': '<em>SEND</em> dispatches the load now: safe, on time, but you pay the full truck either way. <em>WAIT</em> holds it one more hour to consolidate, and rolls two dice.',
      'scene1.s3':     'THE TWO DICE (what you do not control)',
      'scene1.s3body': 'The green <b>arrival die</b> may slide a pallet onto the dock (60%). The red <b>deadline die</b> may blow the shipment, and it gets nastier as the clock runs down: 0% at 4h, then 20 / 40 / 60% at 3 / 2 / 1h.',
      'scene1.demo':   'ROLL A WAIT',
      'scene1.demoAgain':'ROLL AGAIN',
      'scene1.demoArrived':'A pallet arrived: the truck is fuller, the clock ticked down.',
      'scene1.demoNoArrive':'No pallet this hour, but the shipment survived; the clock ticked down.',
      'scene1.demoBlown':'The deadline blew. The whole held load is stranded.',
      'scene1.takeaway':'WAIT buys consolidation but borrows against the clock. SEND is safe, but you pay the full truck either way.',
    },
    jp: {
      'scene1.title':  'あそびかた',
      'scene1.lede':   'まだりろんはなし。コントロールだけ。じょうきょうをよんで、レバーをひく。',
      'scene1.s1':     'じょうきょう（じょうたい）',
      'scene1.s1body': 'ドックのタイルは 2つの数： <b>まっているパレット</b>（クレートのやま）と <b>しめきりまでの時間</b>（へっていく時計）。 ここでは パレット2、4時間。',
      'scene1.s2':     '2つのレバー（こうどう）',
      'scene1.s2body': '<em>SEND</em> はいまにもつをおくる： あんぜん、じかんない、でも トラックだいは まんがく。 <em>WAIT</em> はもう1時間まとめて、2つのダイスをふる。',
      'scene1.s3':     '2つのダイス（じぶんできめられないこと）',
      'scene1.s3body': 'みどりの <b>とうちゃくダイス</b> はパレットを1つドックにのせるかも（60%）。 あかい <b>しめきりダイス</b> はしゅっかをだめにするかも、 時間がへるほど やばくなる： 4時間で0%、3/2/1時間で 20/40/60%。',
      'scene1.demo':   'WAIT をふる',
      'scene1.demoAgain':'もういちど',
      'scene1.demoArrived':'パレットがとうちゃく。トラックはよりいっぱい、時計はへった。',
      'scene1.demoNoArrive':'今回はパレットなし、でもしゅっかはぶじ。時計はへった。',
      'scene1.demoBlown':'しめきりがだめに。もっていたにもつはぜんぶとりのこし。',
      'scene1.takeaway':'WAIT はまとめをかうが、時計をたんぽにする。 SEND はあんぜん、でもトラックだいはまんがく。',
    },
  });
})();

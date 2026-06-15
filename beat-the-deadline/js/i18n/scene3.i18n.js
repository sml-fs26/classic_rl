/* scene3 i18n -- formalization (MDP). */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene3.title':  'What makes this an MDP?',
      'scene3.lede':   'Freeze the dock and label the four parts of every operating decision.',
      'scene3.state':  'STATE',
      'scene3.stateBody':'s = (p, h): the situation right now. Pallets waiting and hours to deadline. 5 x 5 = 25 states.',
      'scene3.action': 'ACTION',
      'scene3.actionBody':'a in {WAIT, SEND}: the lever. WAIT holds and rolls the dice; SEND ships now.',
      'scene3.trans':  'TRANSITION',
      'scene3.transBody':'P(s’, r | s, a): what the dice do. Where you land and what you are paid, the part you do not control.',
      'scene3.reward': 'REWARD',
      'scene3.rewardBody':'r: +5 a pallet delivered, -10 the truck, -5 a stranded pallet.',
      'scene3.side':   '25 states, two levers, bounded rewards. A whole MDP small enough to draw.',
      'scene3.framing':'An MDP is just: situation, lever, a payoff and a new situation, with some of it left to chance. That is every operating decision you make.',
    },
    jp: {
      'scene3.title':  'なぜこれが MDP なのか',
      'scene3.lede':   'ドックをとめて、すべての うんえいのいしけっていの 4つに なまえをつける。',
      'scene3.state':  'じょうたい',
      'scene3.stateBody':'s = (p, h)： いまのじょうきょう。 まっているパレットと しめきりまでの時間。 5 x 5 = 25 じょうたい。',
      'scene3.action': 'こうどう',
      'scene3.actionBody':'a in {WAIT, SEND}： レバー。 WAIT はまってダイスをふる、 SEND はいまおくる。',
      'scene3.trans':  'せんい',
      'scene3.transBody':'P(s’, r | s, a)： ダイスのすること。 どこにおちて いくらもらうか、 じぶんできめられないぶぶん。',
      'scene3.reward': 'ほうしゅう',
      'scene3.rewardBody':'r： パレット +5、 トラック -10、 とりのこし -5。',
      'scene3.side':   '25 じょうたい、2レバー、ゆうかいなほうしゅう。 えがけるほど ちいさい MDP。',
      'scene3.framing':'MDP は ただ： じょうきょう、レバー、ほうしゅうと あたらしいじょうきょう、その一部は ぐうぜんにまかせる。 それが すべての うんえいのいしけってい。',
    },
  });
})();

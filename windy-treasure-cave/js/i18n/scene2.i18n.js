/* Scene 2 (playtest) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene2.title': 'YOU RUN IT',
      'scene2.lede':  'Play a full run. Pick a heading each step; the wind die rolls, the torch burns (-1 a step). Reach the <b>gold</b> (+10) or fall in the <b>pit</b> (-10).',
      'scene2.reset': 'NEW RUN',
      'scene2.hud.tile':   'TILE',
      'scene2.hud.steps':  'STEPS',
      'scene2.hud.return': 'RETURN',
      'scene2.hud.status': 'STATUS',
      'scene2.status.go':   'EXPLORING',
      'scene2.status.gold': 'GOLD!',
      'scene2.status.pit':  'FELL IN',
      'scene2.say.go':   'Your run. Aim a heading and see where the wind takes you.',
      'scene2.say.step': 'Walked {dir}. Torch -1.',
      'scene2.say.gust': 'GUST! You aimed {dir}, the wind had other ideas. Torch -1.',
      'scene2.say.gold': 'You reached the gold in {n} steps. Return = the torch you burned, plus +10.',
      'scene2.say.pit':  'You fell in the pit after {n} steps. Return = the torch you burned, minus 10.',
      'scene2.framing': 'You just <b>were</b> the decision-maker. You committed to headings, the world pushed back, and your payoff was the sum of what happened, exactly the position you are in every quarter. Your gut was already a <em>rule</em> for which way to go. Next we will name that rule.',
    },
    jp: {
      'scene2.title': 'あなたが やる',
      'scene2.lede':  '1かい とおして あそぶ。 まいかい むきを えらぶ。 かぜダイスが ふられ、 たいまつが -1。 <b>おたから</b>（+10）か <b>おとしあな</b>（-10）。',
      'scene2.reset': 'もういちど',
      'scene2.hud.tile':   'マス',
      'scene2.hud.steps':  'ほすう',
      'scene2.hud.return': 'リターン',
      'scene2.hud.status': 'じょうたい',
      'scene2.status.go':   'たんさくちゅう',
      'scene2.status.gold': 'おたから！',
      'scene2.status.pit':  'おちた',
      'scene2.say.go':   'あなたの ばん。 むきを ねらって かぜに みを まかせよう。',
      'scene2.say.step': '{dir} へ あるいた。 たいまつ -1。',
      'scene2.say.gust': 'とつぷう！ {dir} を ねらったが、 かぜは べつの かんがえ。 たいまつ -1。',
      'scene2.say.gold': '{n} ほで おたからに ついた。 リターン = もやした たいまつ ＋ +10。',
      'scene2.say.pit':  '{n} ほで おとしあなに おちた。 リターン = もやした たいまつ - 10。',
      'scene2.framing': 'あなたは いま <b>いしけっていしゃ</b> だった。 むきを きめ、 せかいが おしかえし、 ほうしゅうは おきたことの ごうけい。 まいしはんき と おなじ じょうきょう。 あなたの かんは すでに いきかたの <em>ルール</em> だった。 つぎは その ルールに なまえを つける。',
    },
  });
})();

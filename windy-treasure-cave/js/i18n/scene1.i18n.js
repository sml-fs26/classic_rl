/* Scene 1 (tutorial) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene1.title': 'HOW TO PLAY',
      'scene1.lede':  'Here is the floor plan, here is <em>you</em>, the <b>gold</b> (+10) and the <b>pit</b> (-10). You have four headings. Press one and watch the wind die roll.',
      'scene1.reset': 'BACK TO START',
      'scene1.legend': '<b>The catch.</b> Most rolls (faces 1-7) you go where you aimed. Some rolls a gust shoves you one tile sideways (faces 8-9 left, face 10 right). Walking into a wall keeps you put, and it still costs a step. Tile = where you are. Heading = the move you pick. The die = the part you do not control.',
      'scene1.say.intro':   'This is the cave. You are on the start tile. Tap a heading and see what the wind does.',
      'scene1.say.went':    'Rolled 1-7: you walked {dir}, just as you aimed.',
      'scene1.say.gust':    'A GUST! You aimed {dir}, but the wind shoved you sideways.',
      'scene1.say.bumpGust':'A gust shoved you into a wall, so you stayed put (still a step).',
      'scene1.say.gold':    'You reached the GOLD (+10). Back to start, keep poking.',
      'scene1.say.pit':     'You fell in the PIT (-10). Back to start, try again.',
    },
    jp: {
      'scene1.title': 'あそびかた',
      'scene1.lede':  'これが フロア、 これが <em>あなた</em>、 <b>おたから</b>（+10）と <b>おとしあな</b>（-10）。 むきは よっつ。 ひとつ おして かぜダイスを みよう。',
      'scene1.reset': 'スタートへ',
      'scene1.legend': '<b>おとしあな。</b> たいていの め（1-7）は ねらいどおり。 ときどき とつぷうが よこに 1マス おす（8-9 ひだり、 10 みぎ）。 かべに ぶつかると そのまま、 でも 1ぽ ぶん かかる。 マス = いるところ。 むき = えらぶ いっしゅ。 ダイス = せいぎょできない ぶぶん。',
      'scene1.say.intro':   'これが どうくつ。 あなたは スタート。 むきを タップして かぜを みて。',
      'scene1.say.went':    '1-7 が でた： ねらいどおり {dir} へ あるいた。',
      'scene1.say.gust':    'とつぷう！ {dir} を ねらったが、 かぜが よこに おした。',
      'scene1.say.bumpGust':'とつぷうで かべに おされ、 そのまま（でも 1ぽ）。',
      'scene1.say.gold':    'おたから（+10）に ついた。 スタートへ もどって つづけよう。',
      'scene1.say.pit':     'おとしあな（-10）に おちた。 スタートへ もどって また。',
    },
  });
})();

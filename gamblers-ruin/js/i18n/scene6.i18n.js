/* scene6 i18n, return G_t. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene6.title':  'Return',
      'scene6.lede':   'The return is the payoff summed from here on. Here that sum is 0 or 1: you reach the goal eventually, or you do not. So the <b>average return is exactly a win-probability</b>.',
      'scene6.formulaLabel': 'THE RETURN IS A 0/1 OUTCOME; ITS AVERAGE IS YOUR ODDS',
      'scene6.setup':  'Start at $5, choose your first stake, then play smart afterward. Run it many times:',
      'scene6.run':    'Run 200 attempts',
      'scene6.run1':   'Run one attempt',
      'scene6.reset':  'Reset',
      'scene6.bold':   'Start BOLD ($3)',
      'scene6.timid':  'Start TIMID ($1)',
      'scene6.attempts':'attempts',
      'scene6.winrate': 'win-rate so far',
      'scene6.exact':  'true odds (Q*)',
      'scene6.note':   'Starting bold from $5 lands at the goal about 32% of the time; starting timid lands a hair lower. One attempt tells you almost nothing; the <em>bar</em> is the strategy.',
      'scene6.framing':'Do not judge a strategy by one attempt. The payoff is a coin-flip-of-coin-flips. What matters is the probability you hit target across many tries.',
    },
    jp: {
      'scene6.title':  'リターン',
      'scene6.lede':   'リターンとは ここから さきの みかえりを たした もの。ここでは その ごうけいは 0 か 1: いつかは ゴールに とどくか、とどかないか。だから <b>へいきんリターンは ちょうど かちかくりつ</b> です。',
      'scene6.formulaLabel': 'リターンは 0/1 の けっか; その へいきんは あなたの かくりつ',
      'scene6.setup':  '$5 から スタート、さいしょの かけきんを えらび、あとは かしこく あそびます。なんども くりかえそう:',
      'scene6.run':    '200かい ちょうせん',
      'scene6.run1':   '1かい ちょうせん',
      'scene6.reset':  'リセット',
      'scene6.bold':   'だいたんに スタート（$3）',
      'scene6.timid':  'しんちょうに スタート（$1）',
      'scene6.attempts':'ちょうせん かいすう',
      'scene6.winrate': 'いままでの かちりつ',
      'scene6.exact':  'ほんとうの かくりつ（Q*）',
      'scene6.note':   '$5 から だいたんに はじめると やく 32% で ゴールに とどき、しんちょうに はじめると ほんの すこし ひくく なります。1かいの ちょうせんでは ほとんど なにも わからず、<em>バー</em> こそが せんりゃく です。',
      'scene6.framing':'せんりゃくを 1かいの ちょうせんで はんだん しないで。みかえりは コインなげの コインなげ です。だいじなのは なんども やったときに ゴールに とどく かくりつ です。',
    },
  });
})();

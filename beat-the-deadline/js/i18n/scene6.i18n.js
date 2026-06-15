/* scene6 i18n -- return G_t. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene6.title':  'Return',
      'scene6.lede':   'The return is the payoff summed over the rest of the window. From one start, under one lever, you get a spread.',
      'scene6.sample': 'RUN 1 WINDOW',
      'scene6.sample50':'RUN 50 WINDOWS',
      'scene6.histTitle':'RETURNS FROM (2,4), FIRST LEVER = WAIT',
      'scene6.histTitleSend':'RETURNS FROM (2,4), FIRST LEVER = SEND',
      'scene6.meanLabel':'mean return',
      'scene6.runs':   'windows run',
      'scene6.switchWait':'FIRST = WAIT',
      'scene6.switchSend':'FIRST = SEND',
      'scene6.note':   'WAIT first: mostly +5 (a fuller truck ships), sometimes 0, a few -10 (the deadline blew). SEND first: a certain 0.',
      'scene6.framing':'One decision, many possible payoffs. A good rule is not the one that wins once: it is the one with the best expected total over many windows.',
    },
    jp: {
      'scene6.title':  'リターン',
      'scene6.lede':   'リターンは ウィンドウののこりの ほうしゅうのごうけい。 1つのスタート、1つのレバーから、 ばらつきがでる。',
      'scene6.sample': '1ウィンドウ まわす',
      'scene6.sample50':'50ウィンドウ まわす',
      'scene6.histTitle':'(2,4) から、さいしょのレバー = WAIT',
      'scene6.histTitleSend':'(2,4) から、さいしょのレバー = SEND',
      'scene6.meanLabel':'へいきんリターン',
      'scene6.runs':   'まわしたウィンドウ',
      'scene6.switchWait':'さいしょ = WAIT',
      'scene6.switchSend':'さいしょ = SEND',
      'scene6.note':   'WAIT さいしょ： ほとんど +5、 ときどき 0、 たまに -10。 SEND さいしょ： かくじつの 0。',
      'scene6.framing':'1つのけってい、たくさんのほうしゅう。 よいルールは 1かいかつものではなく、 たくさんのウィンドウで きたいごうけいが さいだいのもの。',
    },
  });
})();

/* i18n fragment for scene 0 - Title / hook. Deep-merged via I18N.register.
   English authoritative; Japanese mirrors it line for line. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      "scene0.title": "Press Your Luck",

      /* Title wordmark (split across two lines so it fits the chunky font). */
      "scene0.word1": "PRESS YOUR",
      "scene0.word2": "LUCK",
      "scene0.subtitle": "A REINFORCEMENT LEARNING ADVENTURE",

      /* The tagline under the tumbling die. */
      "scene0.tagline": "Keep rolling for more, or bank it before a 1 wipes it out.",

      /* PRESS START prompt + the click hint. */
      "scene0.start": "PRESS START",
      "scene0.starthint": "one click reveals the board",

      /* Manager framing shown once the die settles / board appears. */
      "scene0.hook": "You are on a streak that grows if you let it ride and vanishes on one bad roll. When do you stop? It is a decision over time, under uncertainty - and the answer changes with the scoreboard.",

      /* Caption beneath the teased empty board. */
      "scene0.boardtease": "Every situation you can be in, on one board: how much is in the POT, and whether you are BEHIND, EVEN, or AHEAD.",

      "scene0.credits": "SML · ETH ZURICH · CLASSIC RL",
      "scene0.by": "BY CARLOS COTRINI"
    },
    jp: {
      "scene0.title": "プレス ユア ラック",

      "scene0.word1": "プレス ユア",
      "scene0.word2": "ラック",
      "scene0.subtitle": "きょうかがくしゅう ぼうけん",

      "scene0.tagline": "もっと ふるか、 1で すべて きえる まえに バンクするか。",

      "scene0.start": "スタート",
      "scene0.starthint": "クリックで ボードが でる",

      "scene0.hook": "いきおいに のれば のびる。 でも わるい めが ひとつ でれば きえる。 いつ やめる？ それは じかんと ふかくじつせいの なかの けってい。 こたえは スコアで かわる。",

      "scene0.boardtease": "ありえる じょうきょうを ひとつの ボードに： ポットは いくつか、 そして おくれ・ごかく・リード のどれか。",

      "scene0.credits": "SML · ETH ZURICH · CLASSIC RL",
      "scene0.by": "カルロス コトリニ"
    }
  });
})();

/* i18n fragment for Scene 10 (Pipeline Climb): "Why DP does not scale".
 * The bridge from the clean DP sweep to learning-from-experience. Two
 * reasons DP is the ideal, not the method: (a) you rarely know the STAGE
 * DIE (real outcomes depend on the competitor, the buyer's mood, a budget
 * freeze, a champion who leaves), and (b) the state space explodes
 * (stages x account bands x industries x engagement signals). English is
 * authoritative; the Japanese mirror gives parity and reuses the
 * established pipeline terms (STAGE DIE = ステージ ダイ, stage = ステージ,
 * lead = リード). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene10.blurb': 'Why DP does not scale: you rarely know the STAGE DIE, and the state space explodes.',

      'scale.heading': 'Why DP does not scale',

      'scale.lede':
        'The clean sweep you just watched needed two things you almost never have: ' +
        'the <b>exact STAGE-DIE odds</b> and a <b>ladder small enough to enumerate</b>. ' +
        'Both are a fantasy on a real pipeline.',

      /* ---- Reason A: you rarely know the STAGE DIE ---- */
      'scale.a.tag':   'REASON 1',
      'scale.a.title': 'YOU RARELY KNOW THE STAGE DIE',
      'scale.a.formula.label': 'THE WARM-UP ODDS ARE NOT PRINTED ANYWHERE',
      'scale.a.body':
        'In this toy the UP / STAY / DOWN odds were stamped on every lever. In a real deal ' +
        'nobody hands you those odds: whether a lead warms or cools after a touch depends on ' +
        'things you cannot read off the CRM.',
      'scale.a.chip.competitor': 'THE COMPETITOR IN THE DEAL',
      'scale.a.chip.mood':       "THE BUYER'S MOOD",
      'scale.a.chip.budget':     'A BUDGET FREEZE',
      'scale.a.chip.champion':   'A CHAMPION WHO LEAVES',
      'scale.a.foot':
        'You only get to pull a lever and watch what the lead actually does, one touch at a time.',

      /* ---- Reason B: the state space explodes ---- */
      'scale.b.tag':   'REASON 2',
      'scale.b.title': 'THE STATE SPACE EXPLODES',
      'scale.b.body':
        'Our toy has {toy} rungs, small enough to sweep by hand. A real pipeline multiplies ' +
        'out fast: a lead is a stage AND a set of features.',
      'scale.b.factor.stages':   'pipeline stages',
      'scale.b.factor.accounts': 'account-size bands',
      'scale.b.factor.industry': 'industries',
      'scale.b.factor.signals':  'engagement signals',
      'scale.b.equals':          'STATES TO SWEEP',
      'scale.b.toyLabel':        'this toy',
      'scale.b.realLabel':       'one real pipeline',
      'scale.b.foot':
        'Even if you somehow knew the STAGE DIE, you could not enumerate, store, or sweep a ' +
        'state space this big, cell by cell.',

      /* ---- verdict + bridge ---- */
      'scale.verdict': 'DP IS THE IDEAL, NOT THE METHOD',
      'scale.bridge':
        'You almost never know the STAGE DIE, and the real pipeline is far too big to fill ' +
        'cell by cell. So how does anyone actually find the scorecard? You <b>learn</b> it ' +
        'from what actually happens, touch by touch. That is SARSA, next.',
    },
    jp: {
      'scene10.blurb': 'なぜ DP は スケールしない：ステージ ダイは たいてい わからず、じょうたい くうかんが ばくはつ する。',

      'scale.heading': 'なぜ DP は スケールしない',

      'scale.lede':
        'いま みた きれいな スイープには、ふだん もっていない 2つが ひつよう だった：' +
        '<b>せいかくな ステージ ダイの かくりつ</b> と <b>れっきょできる ほど ちいさい ラダー</b>。' +
        'じっさいの パイプラインでは どちらも げんそう。',

      'scale.a.tag':   'りゆう 1',
      'scale.a.title': 'ステージ ダイは たいてい わからない',
      'scale.a.formula.label': 'あたたまる かくりつは どこにも かいていない',
      'scale.a.body':
        'この れいでは アップ／ステイ／ダウンの かくりつが レバーに かいてあった。じっさいの ' +
        'とりひきでは だれも くれない：タッチの あとに リードが あたたまるか さめるかは、' +
        'CRM から よみとれない ものに よる。',
      'scale.a.chip.competitor': 'とりひきの きょうごう',
      'scale.a.chip.mood':       'バイヤーの きぶん',
      'scale.a.chip.budget':     'よさんの こおりつき',
      'scale.a.chip.champion':   'いなくなる チャンピオン',
      'scale.a.foot':
        'できるのは レバーを ひいて、リードの じっさいの はんのうを みる こと、1タッチ ずつ。',

      'scale.b.tag':   'りゆう 2',
      'scale.b.title': 'じょうたい くうかんが ばくはつ する',
      'scale.b.body':
        'この れいは {toy} ステージ、てさぎょうで すいそう できる ほど ちいさい。' +
        'じっさいの パイプラインは すぐ かけざんで ふくらむ：リードは ステージ かつ とくちょうの あつまり。',
      'scale.b.factor.stages':   'パイプライン ステージ',
      'scale.b.factor.accounts': 'アカウント きぼ',
      'scale.b.factor.industry': 'ぎょうしゅ',
      'scale.b.factor.signals':  'エンゲージメント シグナル',
      'scale.b.equals':          'すいそう する じょうたい',
      'scale.b.toyLabel':        'この れい',
      'scale.b.realLabel':       'じっさいの パイプライン 1つ',
      'scale.b.foot':
        'たとえ ステージ ダイを しっていても、これほど おおきい じょうたい くうかんを ' +
        'れっきょ・きおく・すいそう できない、セル ごとに。',

      'scale.verdict': 'DP は りそう、てほん ではない',
      'scale.bridge':
        'ステージ ダイは ほとんど わからず、じっさいの パイプラインは セル ごとに ' +
        'うめるには おおきすぎる。では どう スコアカードを みつける？じっさいに おきた ' +
        'ことから <b>がくしゅう</b> する、タッチ ごとに。それが SARSA、つぎへ。',
    },
  });
})();

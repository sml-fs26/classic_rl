/* scene10 i18n fragment, "Why DP does not scale".
   Two reasons DP is the ideal, not the method: (a) you rarely know P (real
   demand depends on competitors, weather, virality), and (b) the real board
   explodes (fare classes x dates x seatmaps x competitor prices).
   English is the source of truth; the Japanese mirror gives parity. */
(function () {
  window.I18N.register({
    en: {
      'scene10.title': "Why DP does not scale",

      'scene10.lede':
        'The clean sweep you just watched needed two things you almost never have: ' +
        'a <b>perfect demand model</b> and a <b>board small enough to enumerate</b>. ' +
        'Perfect-model pricing is a fantasy.',

      /*, Reason A: you rarely know P, */
      'scene10.a.tag':   'REASON 1',
      'scene10.a.title': 'YOU RARELY KNOW P',
      'scene10.a.formula.label': 'THE DEMAND ODDS ARE NOT PRINTED ANYWHERE',
      'scene10.a.body':
        'In this toy the odds were stamped on every lever. In the real world nobody hands ' +
        'you the deck: how many buyers show up at a price depends on things you cannot read off.',
      'scene10.a.chip.competitors': 'COMPETITOR PRICES',
      'scene10.a.chip.weather':     'WEATHER',
      'scene10.a.chip.viral':       'A VIRAL POST',
      'scene10.a.chip.season':      'THE SEASON',
      'scene10.a.foot':
        'You only get to set a price and watch what actually sold, one draw at a time.',

      /*, Reason B: the board explodes, */
      'scene10.b.tag':   'REASON 2',
      'scene10.b.title': 'THE BOARD EXPLODES',
      'scene10.b.body':
        'Our toy has {toy} situations, small enough to sweep by hand. A real fleet multiplies ' +
        'out fast:',
      'scene10.b.factor.fare':   'fare classes',
      'scene10.b.factor.dates':  'departure dates',
      'scene10.b.factor.seats':  'seat-map states',
      'scene10.b.factor.comp':   'competitor prices',
      'scene10.b.equals':        'SITUATIONS TO SWEEP',
      'scene10.b.toyLabel':      'this toy',
      'scene10.b.realLabel':     'one real fleet',
      'scene10.b.foot':
        'Even if you somehow knew P, you could not enumerate, store, or sweep a board this ' +
        'big, cell by cell.',

      /*, verdict + bridge, */
      'scene10.verdict': 'DP IS THE IDEAL, NOT THE METHOD',
      'scene10.bridge':
        'You never truly know demand, and the real problem is far too big to compute ' +
        'cell by cell. So how does anyone actually find the playbook? You <b>learn</b> it ' +
        'from what actually sells, next.',
    },
    jp: {
      'scene10.title': "なぜ DPは スケールしない",

      'scene10.lede':
        'いま みた きれいな スイープには、ふだん もっていない 2つが ひつよう だった：' +
        '<b>かんぺきな じゅようモデル</b> と <b>れっきょできる ほど ちいさい ばん</b>。' +
        'かんぺきモデルの プライシングは げんそう。',

      'scene10.a.tag':   'りゆう 1',
      'scene10.a.title': 'P は たいてい わからない',
      'scene10.a.formula.label': 'じゅようの かくりつは どこにも かいていない',
      'scene10.a.body':
        'この れいでは かくりつが レバーに かいてあった。げんじつでは だれも デッキを くれない：' +
        'ある かかくで なんにん かうかは、よみとれない ものに よる。',
      'scene10.a.chip.competitors': 'きょうごうの かかく',
      'scene10.a.chip.weather':     'てんき',
      'scene10.a.chip.viral':       'バズった とうこう',
      'scene10.a.chip.season':      'きせつ',
      'scene10.a.foot':
        'できるのは かかくを きめて、じっさいに うれた ものを みる こと、1ひき ずつ。',

      'scene10.b.tag':   'りゆう 2',
      'scene10.b.title': 'ばんが ばくはつ する',
      'scene10.b.body':
        'この れいは {toy} じょうきょう、てさぎょうで すいそう できる ほど ちいさい。' +
        'じっさいの きたいは すぐ かけざんで ふくらむ：',
      'scene10.b.factor.fare':   'うんちん クラス',
      'scene10.b.factor.dates':  'しゅっぱつび',
      'scene10.b.factor.seats':  'ざせきの じょうたい',
      'scene10.b.factor.comp':   'きょうごうの かかく',
      'scene10.b.equals':        'すいそう する じょうきょう',
      'scene10.b.toyLabel':      'この れい',
      'scene10.b.realLabel':     'じっさいの きたい 1つ',
      'scene10.b.foot':
        'たとえ P を しっていても、これほど おおきい ばんを れっきょ・きおく・すいそう ' +
        'できない、セル ごとに。',

      'scene10.verdict': 'DP は りそう、てほん ではない',
      'scene10.bridge':
        'じゅようを ほんとうに しる ことは なく、じっさいの もんだいは セル ごとに ' +
        'けいさんするには おおきすぎる。では どう プレイブックを みつける？じっさいに うれた ' +
        'ものから <b>がくしゅう</b> する、つぎへ。',
    },
  });
})();

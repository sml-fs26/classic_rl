/* scene10 i18n -- why DP does not scale. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene10.title':  'Why DP does not scale',
      'scene10.lede':   'Two reasons the textbook optimum stays on the whiteboard.',
      'scene10.r1title':'(a) You rarely know the dice',
      'scene10.r1body': 'The real arrival rate and the real odds a carrier no-shows are not handed to you: they drift by season, lane and weather. DP needs them exactly.',
      'scene10.r2title':'(b) The grid explodes',
      'scene10.r2body': 'Add SKUs, multiple trucks, several destinations, a week-long horizon, and 25 tiles become millions: too many to enumerate, let alone fill by hand.',
      'scene10.demoLabel':'one SKU, one truck',
      'scene10.demoLabel2':'realistic scale',
      'scene10.statesWord':'states',
      'scene10.framing':'Two reasons the textbook optimum stays on the whiteboard: you do not have a perfect forecast, and the real problem is far too big to lay out as a grid. So how do you get the playbook anyway?',
    },
    jp: {
      'scene10.title':  'なぜ DP はスケールしないか',
      'scene10.lede':   'きょうかしょのさいてきが ホワイトボードにとどまる 2つのりゆう。',
      'scene10.r1title':'(a) ダイスは めったにわからない',
      'scene10.r1body': 'ほんとうのとうちゃくりつや キャリアのノーショーのオッズは わたされない： きせつ、レーン、てんきで ドリフトする。 DP はそれを せいかくにひつよう。',
      'scene10.r2title':'(b) グリッドが ばくはつする',
      'scene10.r2body': 'SKU、ふくすうのトラック、いくつものいきさき、1しゅうかんのホライズンをたすと、 25タイルが 何百万に： れっきょできない、てでうめるなんて むり。',
      'scene10.demoLabel':'1 SKU、1 トラック',
      'scene10.demoLabel2':'げんじつのスケール',
      'scene10.statesWord':'じょうたい',
      'scene10.framing':'きょうかしょのさいてきが ホワイトボードにとどまる 2つのりゆう： かんぺきなよそくがなく、 ほんとうのもんだいは グリッドにかくには おおきすぎる。 では どうやって プレイブックをえる？',
    },
  });
})();

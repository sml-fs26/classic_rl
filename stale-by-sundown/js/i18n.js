/* i18n CORE for Stale by Sundown, English (authoritative) + Japanese mirror.
 *
 *   The THIN core only: shared chrome strings (topbar, concept-badge labels,
 *   prev/next, theme/lang/music, the common shelf/lever/tier vocabulary, the
 *   buy-meter, the board widget labels, and the lecturer speaker notes). Every
 *   scene ships its own fragment at js/i18n/sceneN.i18n.js that calls
 *   window.I18N.register({ en, jp }), deep-merged into the stores.
 *
 *   Public API: I18N.lang / current() / t(key, vars) / setLang(lang) /
 *   register({en,jp}) / onChange(cb).
 *
 *   Japanese uses kana-leaning phrasing to match the DotGothic16 bitmap font;
 *   KaTeX formulas stay in pure mathematical form (symbols cross languages).
 *   Negative money uses the minus sign U+2212 to match the sibling cartridges
 *   (no em/en dashes anywhere in the copy). */
(function () {
  const STORAGE_KEY = 'stale-viz.lang';
  const M = '−';   // minus sign for negative money

  const STORE = {
    en: {
      /*, topbar / chrome, */
      'brand':        'SML · STALE BY SUNDOWN',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',

      /*, concept-badge labels, */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'SAR',

      /*, common shelf vocabulary, */
      'vocab.shelf':    'shelf',
      'vocab.lever':    'lever',
      'vocab.customer': 'the customer',
      'vocab.hour':     'the hour',
      'vocab.cleared':  'CLEARED',
      'vocab.spoiled':  'SPOILED',
      'vocab.till':     'till',

      /*, the three levers (canonical labels), */
      'lever.HOLD':       'HOLD',
      'lever.DISCOUNT':   'DISCOUNT',
      'lever.DUMP':       'DUMP',
      'lever.HOLD.role':  'hold the line',
      'lever.DISCOUNT.role': 'cut the price',
      'lever.DUMP.role':  'write it off',
      'lever.HOLD.margin': '+5 sale',
      'lever.DISCOUNT.margin': '+2 sale',
      'lever.DUMP.margin': M + '3 now',

      /*, freshness tiers, */
      'tier.FRESH': 'FRESH',
      'tier.OK':    'OK',
      'tier.AGING': 'AGING',
      'tier.OLD':   'OLD',
      'tier.STALE': 'STALE',

      /*, board / display-case widget, */
      'board.title':      'BEST LEVER ON EVERY SHELF',
      'board.bestLever':  'BEST LEVER',
      'board.units':      'units',
      'board.freshness':  'freshness',
      'board.cleared':    'SOLD OUT',
      'board.spoiled':    'SPOILED',

      /*, buy-meter, */
      'meter.title':  'DID A CUSTOMER BUY?',
      'meter.bought': 'BOUGHT! cha-ching',
      'meter.nobuy':  'no buy, it ages',

      /*, shared overlay chrome, */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /*, lecturer speaker notes, keyed by scene, */
      'notes.scene0': '<h3>Hook</h3><p>The markdown decision: a depreciating asset on a clock. The whole lesson: <b>the right lever flips as the asset ages</b>. HOLD while fresh, DISCOUNT once aging, DUMP when stale. Airline seats, hotel rooms, end-of-season racks: all the same shape.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only, no strategy. <b>Shelf</b> = the situation (units &times; freshness). <b>Lever</b> = your move (HOLD/DISCOUNT/DUMP). <b>The buy-meter</b> = the part you do not control. <b>The clock</b> = the batch ages each hour a customer does not buy.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them feel the trade-off. Most over-HOLD a premium tray, watch it drift to STALE, eat a ' + M + '6, or panic-DUMP too early. "You just ran the playbook by gut."</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the shop they just ran: state s (units, freshness), action a (the lever), transition P (the buy-meter), reward r (+5/+2/' + M + '3/' + M + '6). &gamma; = 0.75 is "money now beats money at closing."</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is one lever for <em>every</em> shelf state, the SOP your team runs without you. Show always-HOLD (all green) vs discount-when-old before saying which is better.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One day is a sequence of random variables. Same policy, same start, a different tape every time: the early levers shape every situation that follows.</p>',
      'notes.scene6': '<h3>Return</h3><p>One lever gives a DISTRIBUTION, not a number. HOLD-first from (2,FRESH): mean ~5.8 but a fat tail down to ' + M + '1.2. DISCOUNT-first: mean ~4.5, tight. ROI is a spread; judge by the average over many days.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Each Q* is the honest long-run value of a lever, played smart afterward. The star MARCHES down the age axis: HOLD (fresh), DISCOUNT (aging/old), DUMP (stale). argmax = the move.</p>',
      'notes.scene8': '<h3>Bellman</h3><p>A lever value = what it pays now + the value of where it leaves you. The (1,STALE)&rarr;DUMP backup: ' + M + '3 + 0.75&middot;V(1,FRESH) = ' + M + '3 + 0.75&middot;3.76 &asymp; ' + M + '0.18, the least-bad move on the cliff.</p>',
      'notes.scene9': '<h3>DP</h3><p>The buy-meter is posted, so P is known and Q* is exact. The case fills band by band: STALE red locks first (the spoilage cliff), then the amber middle, then the green cap. ~16 sweeps.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You rarely know real demand (weather, a competitor, a TikTok). (b) The real state space (stock &times; hours &times; products &times; weather) explodes past the 15-cell toy. DP is the ideal, not the method.</p>',
      'notes.scene11': '<h3>SARSA</h3><p>Replace the expectation with one real day: nudge a lever score toward (what you saw + the score of the lever you actually played next). &epsilon; keeps exploring. As exploration anneals, the learned board converges to the DP oracle on all 15 cells.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, SARSA. Close: the croissant was tiny on purpose. The same six ideas price airline seats, hotel rooms, ad budgets, end-of-season racks. Anything that goes stale by sundown.</p>',
    },

    jp: {
      /*, topbar / chrome, */
      'brand':        'SML · ステイル バイ サンダウン',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     '♪ おんがく オン',
      'music.off':    '♪ おんがく オフ',
      'lang.toggle':  'ENGLISH',

      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'SAR',

      'vocab.shelf':    'たな',
      'vocab.lever':    'レバー',
      'vocab.customer': 'おきゃくさん',
      'vocab.hour':     'じかん',
      'vocab.cleared':  'うりきれ',
      'vocab.spoiled':  'はいき',
      'vocab.till':     'レジ',

      'lever.HOLD':       'キープ',
      'lever.DISCOUNT':   'ねびき',
      'lever.DUMP':       'すてる',
      'lever.HOLD.role':  'ていか いじ',
      'lever.DISCOUNT.role': 'ねさげ',
      'lever.DUMP.role':  'そんぎり',
      'lever.HOLD.margin': '+5 はんばい',
      'lever.DISCOUNT.margin': '+2 はんばい',
      'lever.DUMP.margin': M + '3 いま',

      'tier.FRESH': 'しんせん',
      'tier.OK':    'まだ いい',
      'tier.AGING': 'すこし ふるい',
      'tier.OLD':   'ふるい',
      'tier.STALE': 'いたみ',

      'board.title':      'すべての たなでの さいぜんの レバー',
      'board.bestLever':  'さいぜんの レバー',
      'board.units':      'こすう',
      'board.freshness':  'しんせんど',
      'board.cleared':    'うりきれ',
      'board.spoiled':    'はいき',

      'meter.title':  'おきゃくさんは かった？',
      'meter.bought': 'うれた！ チャリン',
      'meter.nobuy':  'うれない、 としを とる',

      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      'notes.scene0': '<h3>つかみ</h3><p>ねさげの けってい：とけいの ついた げんかする しさん。 きょうの じゅぎょう：<b>しさんが としを とると、ただしい レバーが かわる</b>。 しんせんなら キープ、ふるくなれば ねびき、いたんだら すてる。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ、せんりゃくは なし。 <b>たな</b> = じょうきょう（こすう × しんせんど）。 <b>レバー</b> = て（キープ/ねびき/すてる）。 <b>メーター</b> = きめられない ぶぶん。 <b>とけい</b> = うれない じかんごとに としを とる。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>トレードオフを かんじて もらう。 おおくの ひとは キープ しすぎて いたみに なり、' + M + '6を くらう。 または はやく すてる。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>よっつの ぶぶん：じょうたい s（こすう、しんせんど）、こうどう a（レバー）、せんい P（メーター）、ほうしゅう r（+5/+2/' + M + '3/' + M + '6）。 &gamma; = 0.75。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは <em>すべての</em> たなへの 1つの レバー。 いつもキープと ふるくなればねびき を みせる。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1にちは かくりつへんすうの れつ。 はやい レバーが あとの すべての じょうきょうを かたちづくる。</p>',
      'notes.scene6': '<h3>リターン</h3><p>1つの レバーは ぶんぷを あたえる。 キープさき：へいきん ~5.8 だが ' + M + '1.2 まで ふとい しっぽ。 ねびきさき：~4.5、ほそい。</p>',
      'notes.scene7': '<h3>Q*</h3><p>かく Q* は その レバーの しょうじきな かち。 ★が としの じくを すすむ：キープ、ねびき、すてる。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>レバーの かち = いま の ほうしゅう + のこされるところの かち。 (1,いたみ)&rarr;すてる：' + M + '3 + 0.75&middot;V(1,しんせん) &asymp; ' + M + '0.18。</p>',
      'notes.scene9': '<h3>DP</h3><p>メーターは ひょうじ ずみ、だから P は きち で Q* は せいかく。 ケースは バンドごとに うまる。 ~16スイープ。</p>',
      'notes.scene10': '<h3>DP が だめな りゆう</h3><p>(a) ほんとうの じゅようは わからない。 (b) じょうたいくうかんが ばくはつする。 DP は りそう であって しゅほう では ない。</p>',
      'notes.scene11': '<h3>SARSA</h3><p>きたいちを 1にちの けいけんで おきかえる。 レバーの スコアを（みたもの + つぎに ひいた レバーの スコア）へ よせる。 たんさくが おさまると、 ボードは 15マス すべてで DP に しゅうそく。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいの カード：MDP、ポリシー、リターン、Q*、DP、SARSA。 クロワッサンが ちいさいのは わざと。 さんダウンまでに いたむ すべての もの。</p>',
    },
  };

  let lang = 'en';
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'jp') lang = saved; } catch (_e) {}

  const listeners = [];

  function register(obj) {
    if (!obj) return;
    for (const lng of ['en', 'jp']) {
      const src = obj[lng]; if (!src) continue;
      if (!STORE[lng]) STORE[lng] = {};
      for (const k in src) if (Object.prototype.hasOwnProperty.call(src, k)) STORE[lng][k] = src[k];
    }
  }
  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, name) => (vars[name] != null ? String(vars[name]) : m));
  }
  function t(key, vars) {
    let s = STORE[lang] && STORE[lang][key];
    if (s == null) s = STORE.en && STORE.en[key];
    if (s == null) return key;
    return interpolate(s, vars);
  }
  function current() { return lang; }
  function setLang(next) {
    if (next !== 'en' && next !== 'jp') return;
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_e) {}
    applyBodyClass();
    for (const cb of listeners.slice()) { try { cb(lang); } catch (e) { console.error(e); } }
  }
  function onChange(cb) { listeners.push(cb); return function () { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); }; }
  function applyBodyClass() {
    if (!document.body) return;
    document.body.classList.toggle('lang-jp', lang === 'jp');
    document.body.classList.toggle('lang-en', lang === 'en');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBodyClass);
  else applyBodyClass();

  window.I18N = { get lang() { return lang; }, current, t, setLang, register, onChange };
})();

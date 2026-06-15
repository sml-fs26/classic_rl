/* i18n CORE for Windy Treasure Cave -- English (authoritative) + Japanese mirror.
 *
 *   This file is the THIN core only. It seeds the shared chrome strings
 *   (topbar, concept-badge labels, prev/next, theme/lang/music labels, the
 *   common cave / wind-die / heading vocabulary, and the lecturer speaker
 *   notes). Every scene ships its own fragment at js/i18n/sceneN.i18n.js that
 *   calls:
 *
 *       window.I18N.register({ en: { ... }, jp: { ... } });
 *
 *   register() deep-merges fragments into the en / jp stores, so the per-scene
 *   strings live next to their scene and the core stays small.
 *
 *   Public API:
 *     I18N.lang / I18N.current()   current 'en' | 'jp'
 *     I18N.t(key, vars)            lookup; {var} placeholders filled; falls back
 *                                  to the en string, then to the key
 *     I18N.setLang(lang)           change + persist + notify subscribers
 *     I18N.register(obj)           deep-merge { en, jp } string fragments
 *     I18N.onChange(cb)            subscribe (returns an unsubscribe fn)
 *
 *   Japanese uses kana-leaning phrasing to match the on-screen DotGothic16
 *   bitmap font; KaTeX formulas stay in pure mathematical form. */
(function () {
  const STORAGE_KEY = 'windy-cave.lang';

  const STORE = {
    en: {
      /* ---- topbar / chrome ---- */
      'brand':        'SML · WINDY TREASURE CAVE',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',

      /* ---- concept-badge labels ---- */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /* ---- common cave vocabulary ---- */
      'vocab.tile':     'tile',
      'vocab.heading':  'heading',
      'vocab.wind':     'the wind die',
      'vocab.gold':     'GOLD',
      'vocab.pit':      'PIT',
      'vocab.start':    'START',
      'vocab.torch':    'torch',
      'vocab.gust':     'GUST',

      /* ---- the four headings ---- */
      'act.UP':    'UP',
      'act.DOWN':  'DOWN',
      'act.LEFT':  'LEFT',
      'act.RIGHT': 'RIGHT',

      /* ---- board widget labels ---- */
      'board.gold':  'GOLD  +10',
      'board.pit':   'PIT  -10',
      'board.start': 'START',
      'board.you':   'YOU',
      'board.best':  'BEST HEADING',
      'board.tie':   '= a tie (both best)',

      /* ---- wind-die widget ---- */
      'die.aim':   'YOU WALK ↑',
      'die.left':  'GUST ← LEFT',
      'die.right': 'GUST → RIGHT',
      'die.badge': '70 / 15 / 15',
      'die.roll':  'ROLL',

      /* ---- shared overlay chrome ---- */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /* ---- lecturer speaker notes, keyed by scene ---- */
      'notes.scene0': '<h3>Hook</h3><p>One prize (the gold, +10), one hazard (the pit, -10), a wind that gets a vote. The whole lesson: <b>the right heading depends on where you stand</b> -- steer around your hazards, sprint only where the ground is safe.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only, no theory. <b>Tile</b> = the situation (where you stand). <b>Heading</b> = the lever (the way you aim). <b>The wind die</b> = the part you do not control. Wall-bump = stay put, still -1.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them feel the shove. Almost everyone gets gusted into a wall or toward the pit at least once. "You were already following <em>some</em> rule for which way to go."</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the cave they just walked: state s (the tile), action a (the heading), transition P (the wind, 0.7/0.15/0.15), reward r (-1 a step, +10 gold, -10 pit).</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is a heading for <em>every</em> tile, the SOP your team follows without you. Show "aim straight at the gold" (it marches the below-pit tile INTO the pit) vs the optimal map that bends around the hazard.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One run is a sequence of random variables. Same policy, same start, a different tape every time (the gusts differ). Click a reward to see the die roll that produced it.</p>',
      'notes.scene6': '<h3>Return</h3><p>The return is the sum of every reward to the end. From the below-pit tile, RIGHT averages ~+1 (mostly reaches the gold); UP averages ~-6.6 (mostly falls in the pit). One heading, a whole spread.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Each Q* value is the best expected return for that heading, played smart afterward. Below the pit: UP = -6.66 (worst!), RIGHT = +0.97 (best). Aiming straight at the prize is the worst move. argmax = optimal heading.</p>',
      'notes.scene8': '<h3>Bellman</h3><p>Today\'s value is the expected reward plus the best value of wherever the gust lands you. Hand backup below the pit: 0.7(-10) + 0.15(-1+V*(3,1)) + 0.15(-1+V*(3,3)) = -6.66. Reproduces Q* exactly.</p>',
      'notes.scene9': '<h3>DP</h3><p>The wind odds are printed, so P is known and Q* is exact. Value floods OUT from the gold; the danger crater sets around the pit; the arrow field bends into place, never pointing inward.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You rarely know the true wind odds. (b) A 5x5 cave is tiny; a real one (fog, items, a moving hazard) explodes. DP is the ideal, not the method.</p>',
      'notes.scene11': '<h3>SARSA vs Q-learning</h3><p>Same steps, two update rules. On-policy <b>SARSA</b> learns the value of the cautious route it walks and keeps its distance from the pit (below the pit it aims AWAY); off-policy <b>Q-learning</b> bootstraps on the best next heading and recovers the optimal map, matching DP. Classic cliff-walking.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, learning. Close: the safe heading depends on where you stand -- strategy is a <em>map</em> of decisions, not a single bet.</p>',
    },

    jp: {
      /* ---- topbar / chrome ---- */
      'brand':        'SML · かぜの たからどうくつ',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     '♪ おんがく オン',
      'music.off':    '♪ おんがく オフ',
      'lang.toggle':  'ENGLISH',

      /* ---- concept-badge labels ---- */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /* ---- common cave vocabulary ---- */
      'vocab.tile':     'マス',
      'vocab.heading':  'むき',
      'vocab.wind':     'かぜダイス',
      'vocab.gold':     'おたから',
      'vocab.pit':      'おとしあな',
      'vocab.start':    'スタート',
      'vocab.torch':    'たいまつ',
      'vocab.gust':     'とつぷう',

      /* ---- the four headings ---- */
      'act.UP':    'うえ',
      'act.DOWN':  'した',
      'act.LEFT':  'ひだり',
      'act.RIGHT': 'みぎ',

      /* ---- board widget labels ---- */
      'board.gold':  'おたから  +10',
      'board.pit':   'おとしあな  -10',
      'board.start': 'スタート',
      'board.you':   'あなた',
      'board.best':  'さいぜんの むき',
      'board.tie':   '= ひきわけ（どちらも さいぜん）',

      /* ---- wind-die widget ---- */
      'die.aim':   'ねらいどおり ↑',
      'die.left':  'とつぷう ← ひだり',
      'die.right': 'とつぷう → みぎ',
      'die.badge': '70 / 15 / 15',
      'die.roll':  'ふる',

      /* ---- overlay chrome ---- */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /* ---- lecturer speaker notes ---- */
      'notes.scene0': '<h3>つかみ</h3><p>ひとつの たから（おたから +10）、 ひとつの きけん（おとしあな -10）、 そして いっぴょうを もつ かぜ。 きょうの じゅぎょう： <b>ただしい むきは あなたが どこに いるかで かわる</b> -- きけんは よけて、 あんぜんな ところだけ つっぱしれ。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ。 りろんは なし。 <b>マス</b> = いまの じょうきょう。 <b>むき</b> = レバー（ねらう ほうこう）。 <b>かぜダイス</b> = じぶんで きめられない ぶぶん。 かべに ぶつかる = そのまま、 でも -1。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>おされる かんじを たいけん。 ほとんどの ひとが いちどは かべや おとしあなの ほうへ おされる。 「あなたは すでに <em>なんらかの</em> いきかたの ルールに したがっていた」。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>いま あるいた どうくつの うえで よっつの ぶぶんに なまえを： じょうたい s（マス）、 こうどう a（むき）、 せんい P（かぜ、0.7/0.15/0.15）、 ほうしゅう r（1ぽ -1、 おたから +10、 おとしあな -10）。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは <em>すべての</em> マスへの むき、 あなたが いなくても チームが したがう SOP。 「おたからへ まっすぐ」（あなの した の マスを あなに つっこませる）と、 きけんを よける さいぜんの ちずを みせる。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1かいの プレイは かくりつへんすうの れつ。 おなじ ポリシー、 おなじ スタート、 まいかい ちがう テープ（かぜが ちがう）。 ほうしゅうを クリックすると その ダイスの めが みえる。</p>',
      'notes.scene6': '<h3>リターン</h3><p>リターンは さいごまでの ほうしゅうの ごうけい。 あなの した の マスから、 みぎは へいきん ~+1（たいてい おたから）、 うえは へいきん ~-6.6（たいてい おとしあな）。 ひとつの むき、 おおきな ばらつき。</p>',
      'notes.scene7': '<h3>Q*</h3><p>かく Q* は その むきの さいぜんの きたい リターン（あとは じょうずに）。 あなの した： うえ = -6.66（さいあく！）、 みぎ = +0.97（さいぜん）。 たからへ まっすぐが いちばん わるい。 argmax = さいぜんの むき。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>きょうの かちは きたい ほうしゅう ＋ かぜが おとす さきの さいぜん かち。 あなの した の てけいさん： 0.7(-10) + 0.15(-1+V*(3,1)) + 0.15(-1+V*(3,3)) = -6.66。 Q* を せいかくに さいげん。</p>',
      'notes.scene9': '<h3>DP</h3><p>かぜの かくりつは ひょうじ ずみ、 だから P は きち で Q* は せいかく。 かちは おたからから ひろがり、 あなの まわりに きけんの クレーター。 やじるしばは ひとりでに まがり、 けっして うちがわを むかない。</p>',
      'notes.scene10': '<h3>DP が だめな りゆう</h3><p>(a) ほんとうの かぜの オッズは めったに わからない。 (b) 5x5 は ちいさい。 げんじつ（きり、 アイテム、 うごく きけん）は ばくはつ する。 DP は りそう であって しゅほう では ない。</p>',
      'notes.scene11': '<h3>SARSA たい Q-ラーニング</h3><p>おなじ あゆみ、 ふたつの こうしんルール。 オンポリシーの <b>SARSA</b> は あるく しんちょうな みちの かちを まなび、 あなから きょりを とる（あなの した では はなれる むき）。 オフポリシーの <b>Q-ラーニング</b> は つぎの さいぜんの むきで ブートストラップし、 さいぜんの ちず（DP と いっち）を とりもどす。 がけあるき。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいの カード： MDP、 ポリシー、 リターン、 Q*、 DP、 がくしゅう。 むすび： あんぜんな むきは どこに いるかで かわる -- せんりゃくは いしけっていの <em>ちず</em>、 ひとつの かけ では ない。</p>',
    },
  };

  let lang = 'en';
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'jp') lang = saved; } catch (_e) {}
  /* hash override (#lang=jp / &lang=en): handy for deep-links + headless QA. */
  try { const m = (window.location.hash || '').match(/[#&?]lang=(en|jp)/); if (m) lang = m[1]; } catch (_e) {}

  const listeners = [];

  function register(obj) {
    if (!obj) return;
    for (const lng of ['en', 'jp']) {
      const src = obj[lng];
      if (!src) continue;
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
  function onChange(cb) {
    listeners.push(cb);
    return function unsubscribe() { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); };
  }
  function applyBodyClass() {
    if (!document.body) return;
    document.body.classList.toggle('lang-jp', lang === 'jp');
    document.body.classList.toggle('lang-en', lang === 'en');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBodyClass);
  else applyBodyClass();

  window.I18N = { get lang() { return lang; }, current, t, setLang, register, onChange };
})();

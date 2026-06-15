/* i18n CORE for Gambler's Ruin, English (authoritative) + Japanese mirror.
 *
 *   This file is the THIN core only. It seeds the shared chrome strings
 *   (topbar, concept-badge labels, prev/next, theme/lang/music labels, the
 *   common ladder/coin/stake vocabulary, and the lecturer speaker notes).
 *   Every scene ships its own fragment at js/i18n/sceneN.i18n.js that calls:
 *
 *       window.I18N.register({ en: { ... }, jp: { ... } });
 *
 *   register() deep-merges fragments into the en / jp stores, so the
 *   per-scene strings live next to their scene and the core stays small.
 *
 *   Public API:
 *     I18N.lang                  current 'en' | 'jp' (getter)
 *     I18N.current()             same as I18N.lang
 *     I18N.t(key, vars)          lookup; {var} placeholders filled; falls back
 *                                to the en string, then to the key
 *     I18N.setLang(lang)         change + persist + notify subscribers
 *     I18N.register(obj)         deep-merge { en, jp } string fragments
 *     I18N.onChange(cb)          subscribe (returns an unsubscribe fn)
 *
 *   Japanese uses kana-leaning phrasing to match the on-screen DotGothic16
 *   bitmap font; KaTeX formulas stay in pure mathematical form (symbols cross
 *   languages without ambiguity). */
(function () {
  const STORAGE_KEY = 'gamblers-viz.lang';

  const STORE = {
    en: {
      /*, topbar / chrome, */
      'brand':        'SML · GAMBLER’S RUIN',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',            /* what to switch TO */

      /* legacy sound labels (kept for API parity if referenced) */
      'sound.on':     '♪ SOUND ON',
      'sound.off':    '♪ SOUND OFF',

      /*, concept-badge labels (lit on reaching the relevant scene), */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, common ladder vocabulary, reused across scenes, */
      'vocab.capital':  'capital',
      'vocab.stake':    'stake',
      'vocab.flip':     'the flip',
      'vocab.ruin':     'RUIN',
      'vocab.goal':     'GOAL',
      'vocab.heads':    'HEADS',
      'vocab.tails':    'TAILS',
      'vocab.win':      'WIN',
      'vocab.loss':     'LOSS',

      /*, the three stakes (canonical labels), */
      'stake.bet1':       'BET $1',
      'stake.bet2':       'BET $2',
      'stake.bet3':       'BET $3',
      'stake.bet1.role':  'timid',
      'stake.bet2.role':  'medium',
      'stake.bet3.role':  'bold',

      /*, shared ladder / Q-ladder widget labels, */
      'ladder.goal':     'GOAL  $10',
      'ladder.ruin':     'RUIN  $0',
      'ladder.bestStake':'BEST STAKE HERE',
      'ladder.clamped':  'clamped',
      'qladder.title':   'BEST STAKE ON EVERY RUNG',

      /*, coin widget, */
      'coin.win':   'HEADS ↑',
      'coin.loss':  'TAILS ↓',
      'coin.badge': '40 / 60',
      'coin.flip':  'FLIP',

      /*, shared overlay chrome, */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /*, lecturer speaker notes, keyed by scene, */
      'notes.scene0': '<h3>Hook</h3><p>One hard target ($10), a coin rigged against you (40% win). The whole lesson: <b>how much you bet should change with how much you hold</b>, and playing it safe can be the riskiest move.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only, no theory. <b>Capital</b> = the situation (your rung). <b>Stake</b> = the lever ($1/$2/$3). <b>The flip</b> = the part you do not control. <b>Ruin/Goal</b> = the two ends.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them feel the swing. Most first-timers grind small safe bets and lose, because the 60%-loss coin gets many turns to bite. "You were already following <em>some</em> betting rule."</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the ladder they just played: state s (capital), action a (stake, clamped), transition P (the coin, p=0.4), reward r (+1 only at $10).</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is a stake for <em>every</em> rung, the SOP your team follows without you. Show always-$1 (all blue) vs always-bold (all orange) before saying which is better.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One run is a sequence of random variables. Same policy, same $5 start, a different tape every time. Reward is 0 until the very end.</p>',
      'notes.scene6': '<h3>Return</h3><p>The return here is 0 or 1, so its average <em>is</em> a win-probability. Bold from $5 ~ 0.318, timid ~ 0.311. Judge a strategy by the bar, not one run.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Each Q* value is your honest win-probability for that stake, played smart afterward. The star <b>moves</b>: $3 bold, $5 a tie (2 or 3), $8 forced to $2. argmax = optimal stake.</p>',
      'notes.scene8': '<h3>Bellman</h3><p>Today’s value is defined in terms of where the flip lands you. Edge backups: Q*($1,$1)=0.4·V*($2); Q*($9,$1)=0.4+0.6·V*($8). Both reproduce V*.</p>',
      'notes.scene9': '<h3>DP</h3><p>The coin’s bias is printed, so P is known and Q* is exact. Value spreads from the goal back toward ruin; the bold-middle zig-zag draws itself.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You rarely know the true odds. (b) Real problems explode beyond 11 rungs. DP is the ideal, not the method.</p>',
      'notes.scene11': '<h3>SARSA vs Q-learning</h3><p>Same flips, two update rules. On-policy <b>SARSA</b> learns the value of the cautious eps-soft policy it follows and lands timid; off-policy <b>Q-learning</b> bootstraps on the best next stake and recovers the bold-middle zig-zag, matching DP. The cliff-walking cautious-vs-optimal distinction.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, learning. Close: the bones of decision-making under unfavorable odds, and of reinforcement learning.</p>',
    },

    jp: {
      /*, topbar / chrome, */
      'brand':        'SML · ギャンブラーの はさん',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     '♪ おんがく オン',
      'music.off':    '♪ おんがく オフ',
      'lang.toggle':  'ENGLISH',

      'sound.on':     '♪ おと オン',
      'sound.off':    '♪ おと オフ',

      /*, concept-badge labels, */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, common ladder vocabulary, */
      'vocab.capital':  'しさん',
      'vocab.stake':    'かけきん',
      'vocab.flip':     'コインなげ',
      'vocab.ruin':     'はさん',
      'vocab.goal':     'ゴール',
      'vocab.heads':    'おもて',
      'vocab.tails':    'うら',
      'vocab.win':      'かち',
      'vocab.loss':     'まけ',

      /*, the three stakes, */
      'stake.bet1':       '$1 かける',
      'stake.bet2':       '$2 かける',
      'stake.bet3':       '$3 かける',
      'stake.bet1.role':  'しんちょう',
      'stake.bet2.role':  'ふつう',
      'stake.bet3.role':  'だいたん',

      /*, ladder / Q-ladder widget labels, */
      'ladder.goal':     'ゴール  $10',
      'ladder.ruin':     'はさん  $0',
      'ladder.bestStake':'ここでの さいぜんの かけ',
      'ladder.clamped':  'せいげん',
      'qladder.title':   'すべての だんの さいぜんの かけ',

      /*, coin widget, */
      'coin.win':   'おもて ↑',
      'coin.loss':  'うら ↓',
      'coin.badge': '40 / 60',
      'coin.flip':  'なげる',

      /*, overlay chrome, */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /*, lecturer speaker notes, */
      'notes.scene0': '<h3>つかみ</h3><p>むずかしい もくひょう（$10）、 あなたに ふりな コイン（かちりつ 40%）。 きょうの じゅぎょう： <b>いくら かけるかは いくら もっているかで かわるべき</b>、 そして あんぜんに いくのが いちばん あぶない ことも ある。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ。 りろんは なし。 <b>しさん</b> = いまの じょうきょう（だん）。 <b>かけきん</b> = レバー（$1/$2/$3）。 <b>コインなげ</b> = じぶんで きめられない ぶぶん。 <b>はさん/ゴール</b> = りょうたん。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>ゆれを かんじて もらう。 はじめての ひとの おおくは ちいさく あんぜんに かけて まける。 60%で かみつく コインに なんども チャンスを あたえるからだ。 「あなたは すでに <em>なんらかの</em> かけかたの ルールに したがっていた」。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>いま あそんだ ラダーの うえで よっつの ぶぶんに なまえを： じょうたい s（しさん）、 こうどう a（かけ、せいげんあり）、 せんい P（コイン、p=0.4）、 ほうしゅう r（$10 のときだけ +1）。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは <em>すべての</em> だんへの かけ、 あなたが いなくても チームが したがう SOP。 どちらが よいか いう まえに、 いつも $1（ぜんぶ あお）と いつも だいたん（ぜんぶ オレンジ）を みせる。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1かいの プレイは かくりつへんすうの れつ。 おなじ ポリシー、 おなじ $5 スタート、 まいかい ちがう テープ。 ほうしゅうは さいごまで 0。</p>',
      'notes.scene6': '<h3>リターン</h3><p>ここでの リターンは 0 か 1、 だから その へいきんが <em>そのまま</em> かちりつ。 $5 から だいたん ~0.318、 しんちょう ~0.311。 1かいでなく バーで はんだん。</p>',
      'notes.scene7': '<h3>Q*</h3><p>かく Q* は その かけの しょうじきな かちりつ（あとは じょうずに プレイ）。 ★が <b>うごく</b>： $3 だいたん、 $5 ひきわけ（2 か 3）、 $8 は $2 きょうせい。 argmax = さいぜんの かけ。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>きょうの かちは コインが どこへ おとすかで きまる。 はしの バックアップ： Q*($1,$1)=0.4·V*($2)、 Q*($9,$1)=0.4+0.6·V*($8)。 どちらも V* を さいげん。</p>',
      'notes.scene9': '<h3>DP</h3><p>コインの かたよりは ひょうじ ずみ、 だから P は きち で Q* は せいかく。 かちは ゴールから はさんへ ひろがり、 だいたん まんなかの ジグザグが ひとりでに えがかれる。</p>',
      'notes.scene10': '<h3>DP が だめな りゆう</h3><p>(a) ほんとうの オッズは めったに わからない。 (b) げんじつの もんだいは 11だんを はるかに こえて ばくはつする。 DP は りそう であって しゅほう では ない。</p>',
      'notes.scene11': '<h3>SARSA たい Q-ラーニング</h3><p>おなじ コインなげ、 ふたつの こうしんルール。 オンポリシーの <b>SARSA</b> は したがう eps-ソフトの しんちょうな ポリシーの かちを まなび、 こしぬけに なる。 オフポリシーの <b>Q-ラーニング</b> は つぎの さいぜんの かけで ブートストラップし、 だいたん まんなかの ジグザグ（DP と いっち）を とりもどす。 がけあるきの しんちょう たい さいぜん の くべつ。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいの カード： MDP、 ポリシー、 リターン、 Q*、 DP、 がくしゅう。 むすび： ふりな オッズの もとでの いしけってい、 そして きょうかがくしゅうの ほね。</p>',
    },
  };

  /*, current language (persisted), */
  let lang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'jp') lang = saved;
  } catch (_e) {}

  const listeners = [];

  function register(obj) {
    if (!obj) return;
    for (const lng of ['en', 'jp']) {
      const src = obj[lng];
      if (!src) continue;
      if (!STORE[lng]) STORE[lng] = {};
      for (const k in src) {
        if (Object.prototype.hasOwnProperty.call(src, k)) STORE[lng][k] = src[k];
      }
    }
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, name) =>
      (vars[name] != null ? String(vars[name]) : m));
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
    for (const cb of listeners.slice()) {
      try { cb(lang); } catch (e) { console.error(e); }
    }
  }

  function onChange(cb) {
    listeners.push(cb);
    return function unsubscribe() {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function applyBodyClass() {
    if (!document.body) return;
    document.body.classList.toggle('lang-jp', lang === 'jp');
    document.body.classList.toggle('lang-en', lang === 'en');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBodyClass);
  } else {
    applyBodyClass();
  }

  window.I18N = {
    get lang() { return lang; },
    current, t, setLang, register, onChange,
  };
})();

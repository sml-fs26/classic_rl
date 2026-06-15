/* i18n CORE for the Recycling Robot, English (authoritative) + Japanese mirror.
 *
 *   This file is the THIN core only. It seeds the shared chrome strings
 *   (topbar, concept-badge labels, prev/next, theme/lang/music labels, the
 *   common gauge/lever/die vocabulary, and the lecturer speaker notes). Every
 *   scene ships its own fragment at js/i18n/sceneN.i18n.js that calls:
 *
 *       window.I18N.register({ en: { ... }, jp: { ... } });
 *
 *   register() deep-merges fragments into the en / jp stores, so the per-scene
 *   strings live next to their scene and the core stays small.
 *
 *   Public API:
 *     I18N.lang / I18N.current()      current 'en' | 'jp'
 *     I18N.t(key, vars)               lookup; {var} placeholders; en fallback, then key
 *     I18N.setLang(lang)              change + persist + notify subscribers
 *     I18N.register(obj)              deep-merge { en, jp } string fragments
 *     I18N.onChange(cb)               subscribe (returns an unsubscribe fn)
 *
 *   Japanese uses kana-leaning phrasing to match the on-screen DotGothic16
 *   bitmap font; KaTeX formulas stay in pure mathematical form (symbols cross
 *   languages without ambiguity). */
(function () {
  const STORAGE_KEY = 'recycling-robot.lang';

  const STORE = {
    en: {
      /*, topbar / chrome, */
      'brand':        'SML · RECYCLING ROBOT',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',            /* what to switch TO */

      /*, concept-badge labels (lit on reaching the relevant scene), */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, common gauge vocabulary, reused across scenes, */
      'vocab.battery':  'battery',
      'vocab.lever':    'lever',
      'vocab.die':      'the drain die',
      'vocab.shift':    'the shift',
      'vocab.stranded': 'STRANDED',
      'vocab.trash':    'trash',
      'vocab.return':   'return',

      /*, the three levers (canonical labels), */
      'lever.search':       'SEARCH',
      'lever.wait':         'WAIT',
      'lever.recharge':     'RECHARGE',
      'lever.search.role':  'work',
      'lever.wait.role':    'idle',
      'lever.recharge.role':'protect',
      'lever.search.sub':   'collect trash, drains battery',
      'lever.wait.sub':     'idle, a crumb, no risk',
      'lever.recharge.sub': 'dock, refill to full',

      /*, battery-level names, */
      'level.empty':  'empty',
      'level.low':    'low',
      'level.mid':    'mid',
      'level.high':   'high',
      'level.full':   'full',

      /*, shared gauge widget labels, */
      'gauge.full':       'FULL',
      'gauge.stranded':   'EMPTY · STRANDED',
      'gauge.bestLever':  'BEST LEVER HERE',
      'gauge.title':      'BEST LEVER ON EVERY RUNG',

      /*, drain die widget, */
      'die.minus1': '−1 rung',
      'die.minus2': '−2 rungs',
      'die.badge':  '70 / 30',
      'die.roll':   'ROLL',

      /*, shared overlay chrome, */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /*, lecturer speaker notes, keyed by scene, */
      'notes.scene0': '<h3>Hook</h3><p>A resource that earns while it runs, but runs down. The whole lesson: <b>the right call is not fixed, it flips as the battery empties</b>. Push while you have headroom, protect the asset before you strand it.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only, no theory. <b>Battery</b> = the situation (the gauge). <b>Lever</b> = SEARCH / WAIT / RECHARGE. <b>The drain die</b> = the part you do not control. <b>The shift</b> = how many steps remain.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them feel the swing. A greedy SEARCH on a low battery strands the robot for a brutal minus 10. "You were already following <em>some</em> rule, push while full, recharge when it gets scary?"</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the gauge they just played: state s (battery), action a (lever), transition P (the drain die, 70/30), reward r (plus 3 / plus 2 search, plus 1 wait, 0 recharge, minus 10 strand).</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is a lever for <em>every</em> rung, the SOP your operation runs without you. Show always-SEARCH (all green) vs recharge-below-half before saying which is better.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One shift is a sequence of random variables. Same policy from full, a different tape every time the drain die rolls another way.</p>',
      'notes.scene6': '<h3>Return</h3><p>Start at mid, force SEARCH: a plus 14 / plus 15 cluster AND a fat minus 8 spike about 30% of the time. Average about 7.7 hides a one-in-three disaster. Variance is the risk you carry.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Each Q* is the honest long-run value of a lever, played smart afterward. The star <b>marches up</b> the gauge: RECHARGE at the bottom, SEARCH at the top. The tightest call is high (SEARCH 15.44 vs WAIT 14.89, gap 0.55).</p>',
      'notes.scene8': '<h3>Bellman</h3><p>Today’s value is defined by where the lever lands you next. The stranding shadow: SEARCH from low collects plus 2 then both drains strand for minus 10, so Q = 2 + 0.7(minus 10) + 0.3(minus 10) = minus 8.</p>',
      'notes.scene9': '<h3>DP</h3><p>The drain probabilities are known, so Q* is exact. Back up from the last step (where the safe plus 1 WAIT wins at low/mid); after 2 sweeps the policy stabilises: green top, blue bottom.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You rarely know the true drain (terrain, load, temperature, age). (b) A real fleet’s state space explodes. DP is the ideal, not the method.</p>',
      'notes.scene11': '<h3>SARSA vs Q-learning</h3><p>Same experience, two update rules. On-policy <b>SARSA</b> learns the value of the cautious rule it follows and PROTECTS at the marginal high rung; off-policy <b>Q-learning</b> bootstraps on the best next lever and recovers the DP stripe. The cliff-walking cautious-vs-optimal distinction.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, learning. Close: the bones of managing an asset under uncertainty, and of reinforcement learning.</p>',
    },

    jp: {
      /*, topbar / chrome, */
      'brand':        'SML · リサイクルロボット',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     '♪ おんがく オン',
      'music.off':    '♪ おんがく オフ',
      'lang.toggle':  'ENGLISH',

      /*, concept-badge labels, */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, common gauge vocabulary, */
      'vocab.battery':  'バッテリー',
      'vocab.lever':    'レバー',
      'vocab.die':      'ドレインダイス',
      'vocab.shift':    'シフト',
      'vocab.stranded': 'こしょう',
      'vocab.trash':    'ゴミ',
      'vocab.return':   'リターン',

      /*, the three levers, */
      'lever.search':       'サーチ',
      'lever.wait':         'まつ',
      'lever.recharge':     'じゅうでん',
      'lever.search.role':  'はたらく',
      'lever.wait.role':    'たいき',
      'lever.recharge.role':'まもる',
      'lever.search.sub':   'ゴミをあつめる、バッテリーがへる',
      'lever.wait.sub':     'たいき、わずか、リスクなし',
      'lever.recharge.sub': 'ドック、フルまでかいふく',

      /*, battery-level names, */
      'level.empty':  'カラ',
      'level.low':    'ひくい',
      'level.mid':    'ちゅう',
      'level.high':   'たかい',
      'level.full':   'フル',

      /*, gauge widget labels, */
      'gauge.full':       'フル',
      'gauge.stranded':   'カラ · こしょう',
      'gauge.bestLever':  'ここでの さいぜんの レバー',
      'gauge.title':      'すべての だんの さいぜんの レバー',

      /*, drain die widget, */
      'die.minus1': '−1 だん',
      'die.minus2': '−2 だん',
      'die.badge':  '70 / 30',
      'die.roll':   'ふる',

      /*, overlay chrome, */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /*, lecturer speaker notes, */
      'notes.scene0': '<h3>つかみ</h3><p>うごくと かせぐが、へっていく しげん。 きょうの じゅぎょう： <b>せいかいは こていでは なく、 バッテリーが へると ぎゃくてんする</b>。 よゆうが あるうちは おし、 こしょうの まえに しさんを まもる。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ。 りろんは なし。 <b>バッテリー</b> = じょうきょう（ゲージ）。 <b>レバー</b> = サーチ / まつ / じゅうでん。 <b>ドレインダイス</b> = じぶんで きめられない ぶぶん。 <b>シフト</b> = のこり ステップすう。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>ゆれを かんじて もらう。 ひくい バッテリーで よくばって サーチ すると、 ロボットは こしょうして マイナス 10 の だいだげき。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>よっつに なまえを： じょうたい s（バッテリー）、 こうどう a（レバー）、 せんい P（ドレインダイス、70/30）、 ほうしゅう r。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは <em>すべての</em> だんへの レバー、 あなたが いなくても まわる SOP。 どちらが よいか いう まえに、 いつもサーチと はんぶんいかで じゅうでん を みせる。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1かいの シフトは かくりつへんすうの れつ。 フルから スタート、 ダイスが ちがう めを だせば まいかい ちがう テープ。</p>',
      'notes.scene6': '<h3>リターン</h3><p>ちゅうから サーチを きょうせい： プラス 14 / プラス 15 の かたまりと、 やく 30% の マイナス 8 の スパイク。 へいきん やく 7.7 が 3かいに 1かいの さいなんを かくす。</p>',
      'notes.scene7': '<h3>Q*</h3><p>かく Q* は その レバーの しょうじきな ちょうきかち。 ★が ゲージを <b>のぼる</b>： したは じゅうでん、 うえは サーチ。 いちばん きわどいのは たかい（サーチ 15.44 たい まつ 14.89、 さ 0.55）。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>きょうの かちは レバーが つぎに どこへ おとすかで きまる。 ひくいから サーチは プラス 2 とったあと りょうほうの ドレインが こしょう マイナス 10、 だから Q = マイナス 8。</p>',
      'notes.scene9': '<h3>DP</h3><p>ドレインの かくりつは きち、 だから Q* は せいかく。 さいごの ステップ（ひくい/ちゅうで プラス 1 の まつ が かつ）から バックアップ。 2かいで ポリシーが あんてい： うえ みどり、 した あお。</p>',
      'notes.scene10': '<h3>DP が だめな りゆう</h3><p>(a) ほんとうの ドレインは めったに わからない。 (b) しゃりょうぐんの じょうたいくうかんは ばくはつする。 DP は りそう であって しゅほう では ない。</p>',
      'notes.scene11': '<h3>SARSA たい Q-ラーニング</h3><p>おなじ けいけん、 ふたつの こうしんルール。 オンポリシーの <b>SARSA</b> は しんちょうな ポリシーの かちを まなび、 たかい だんで まもる。 オフポリシーの <b>Q-ラーニング</b> は DP の ストライプを とりもどす。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいの カード： MDP、 ポリシー、 リターン、 Q*、 DP、 がくしゅう。 むすび： しさんかんりと きょうかくしゅうの ほね。</p>',
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

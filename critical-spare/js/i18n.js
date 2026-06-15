/* i18n CORE for Critical Spare, English (authoritative) + Japanese mirror.
 *
 *   This file is the THIN core only. It seeds the shared chrome strings
 *   (topbar, concept-badge labels, prev/next, theme/lang/music labels, the
 *   common machine/lever/die vocabulary, and the lecturer speaker notes).
 *   Every scene ships its own fragment at js/i18n/sceneN.i18n.js that calls:
 *
 *       window.I18N.register({ en: { ... }, jp: { ... } });
 *
 *   register() deep-merges fragments into the en / jp stores.
 *
 *   Public API:
 *     I18N.lang / I18N.current()    current 'en' | 'jp'
 *     I18N.t(key, vars)             lookup; {var} placeholders filled; falls back
 *                                   to the en string, then to the key
 *     I18N.setLang(lang)            change + persist + notify subscribers
 *     I18N.register(obj)            deep-merge { en, jp } fragments
 *     I18N.onChange(cb)             subscribe (returns an unsubscribe fn)
 *
 *   Japanese uses kana-leaning phrasing to match the on-screen DotGothic16
 *   bitmap font; KaTeX formulas stay in pure mathematical form. */
(function () {
  const STORAGE_KEY = 'critical-spare.lang';

  const STORE = {
    en: {
      /*, topbar / chrome, */
      'brand':        'SML · CRITICAL SPARE',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     'MUSIC ON',
      'music.off':    'MUSIC OFF',
      'lang.toggle':  '日本語',

      /*, concept-badge labels, */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, common maintenance vocabulary, */
      'health.healthy':  'HEALTHY',
      'health.aging':    'AGING',
      'health.failing':  'FAILING',
      'lever.run':       'RUN',
      'lever.order':     'ORDER',
      'lever.replace':   'REPLACE',
      'lever.run.short':     'RUN',
      'lever.order.short':   'ORD',
      'lever.replace.short': 'REP',
      'lever.run.role':     'produce',
      'lever.order.role':   'stock',
      'lever.replace.role': 'planned',

      /*, machine icon, */
      'icon.bin':   'BIN',

      /*, the cash legend (pinned across scenes), */
      'cost.run':       'RUN',
      'cost.order':     'ORDER',
      'cost.hold':      'HOLD/spare',
      'cost.emergency': 'emergency swap',
      'cost.downtime':  'DOWNTIME',
      'cost.replace':   'REPLACE',

      /*, failure die, */
      'die.fail':   'FAIL',
      'die.fine':   'RUNS FINE',

      /*, grid widget, */
      'grid.health':     'HEALTH',
      'grid.spares':     'SPARES',
      'grid.sp':         'SP',
      'grid.bestLever':  'BEST LEVER HERE',
      'grid.play':       'play',

      /*, shared overlay chrome, */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /*, lecturer speaker notes, keyed by scene, */
      'notes.scene0': '<h3>Hook</h3><p>One aging machine, a tight cash budget, a spares bin. The whole lesson: <b>the right call changes with the situation</b>, run it, pre-order a part, or swap one in, and there is no slogan that wins everywhere.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only, no theory. <b>Health</b> gauge (HEALTHY/AGING/FAILING) + <b>spares</b> bin (0/1/2) = the situation. Three levers. The load-bearing rule: <em>a failure WITH a spare auto-swaps you back to HEALTHY at emergency cost (-3); with NO spare the line goes down (-8)</em>.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them feel it. RUN earns +3 but the red FAIL slice grows as the machine ages. The first empty-bin failure books -8 and a downtime timer. "You were the decision-maker, and you could not control the breakdown, only the odds you walked into."</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the quarter they just played: state s = (health, spares), action a = the lever, transition P = the failure die + aging coin, reward r = this turn\'s cash.</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is a lever for <em>every</em> situation, the SOP your crew follows without you. Show "run-to-failure" (all RUN) vs "always-stocked" (ORDER until full) before saying which is better. Neither is obviously best.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One quarter is a sequence of random variables. Same playbook, same start, a different tape every quarter, that is the dice, not bad management. Rewards land every turn (it is an ongoing operation).</p>',
      'notes.scene6': '<h3>Return</h3><p>From AGING with an empty bin: ORDER beats RUN, and RUN has a fatter losing tail (an empty-bin failure books -8). Judge the doctrine by the whole distribution, not one quarter.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Each Q* is the lever\'s true lifetime value. The star <b>flips with the bin</b>: empty AGING/FAILING -> ORDER (go get protection); a spare in hand -> REPLACE (spend it). HEALTHY -> RUN. argmax = the optimal lever.</p>',
      'notes.scene8': '<h3>Bellman</h3><p>Today\'s value = this turn\'s cash + the value of where the lever leaves you. Two clean deterministic backups: REPLACE from (FAILING,1) and ORDER from (AGING,0). Both reproduce V*.</p>',
      'notes.scene9': '<h3>DP</h3><p>The failure odds + aging are known, so P is known and Q* is exact. Sweep the backup: HEALTHY locks to RUN first, then the empty-bin column settles on ORDER and the spare-in-hand cells on REPLACE, the twist heat-map draws itself.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You never get the exact failure odds. (b) A real plant has dozens of machines, part types, lead times, shared spares, the grid explodes far past 9 cells. DP is the ideal, not the method.</p>',
      'notes.scene11': '<h3>SARSA</h3><p>Replace the expectation with one observed turn: nudge Q toward [r + gamma q(s\',a\')]. Epsilon keeps testing the unproven lever. On THIS MDP the optimal lever is decisive, so on-policy SARSA homes in on the exact DP twist heat-map, with no model ever given.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, SARSA. Close on the twist: the right call flipped with the situation, and you have seen the bones of how a machine can learn that for you.</p>',
    },

    jp: {
      /*, topbar / chrome, */
      'brand':        'SML · クリティカル スペア',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     'おんがく オン',
      'music.off':    'おんがく オフ',
      'lang.toggle':  'ENGLISH',

      /*, concept-badge labels, */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, common maintenance vocabulary, */
      'health.healthy':  'けんこう',
      'health.aging':    'ろうきゅう',
      'health.failing':  'こしょうまえ',
      'lever.run':       'うんてん',
      'lever.order':     'はっちゅう',
      'lever.replace':   'こうかん',
      'lever.run.short':     'うんてん',
      'lever.order.short':   'はっちゅう',
      'lever.replace.short': 'こうかん',
      'lever.run.role':     'せいさん',
      'lever.order.role':   'ざいこ',
      'lever.replace.role': 'けいかく',

      /*, machine icon, */
      'icon.bin':   'ざいこ',

      /*, the cash legend (pinned across scenes), */
      'cost.run':       'うんてん',
      'cost.order':     'はっちゅう',
      'cost.hold':      'ほかん/こ',
      'cost.emergency': 'きんきゅう こうかん',
      'cost.downtime':  'ダウンタイム',
      'cost.replace':   'こうかん',

      /*, failure die, */
      'die.fail':   'こしょう',
      'die.fine':   'せいじょう',

      /*, grid widget, */
      'grid.health':     'けんこうど',
      'grid.spares':     'よびひん',
      'grid.sp':         'こ',
      'grid.bestLever':  'ここでの さいぜんの レバー',
      'grid.play':       'えらぶ',

      /*, overlay chrome, */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /*, lecturer speaker notes, */
      'notes.scene0': '<h3>つかみ</h3><p>1だいの ろうきゅうした きかい、 きびしい よさん、 よびひんの ビン。 きょうの じゅぎょう： <b>ただしい せんたくは じょうきょうで かわる</b> (うんてん、 さきに はっちゅう、 いま こうかん)。 どこでも かつ スローガンは ない。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ。 りろんは なし。 <b>けんこうど</b>ゲージ (けんこう/ろうきゅう/こしょうまえ) と <b>よびひん</b>ビン (0/1/2) が じょうきょう。 レバーは 3つ。 だいじな ルール： <em>よびひんが あれば こしょうしても じどうで けんこうに もどる (きんきゅう ひよう -3)、 なければ ラインが とまる (-8)</em>。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>たいかんしてもらう。 うんてんは +3 だが、 きかいが ふるくなると あかい こしょうスライスが ふえる。 はじめて よびひん 0 で こしょうすると -8 と ダウンタイム。 「あなたが いしけっていしゃ。 こしょうは せいぎょできず、 はいる オッズだけ えらべる」。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>いま あそんだ クォーターの うえで よっつの ぶぶんに なまえを： じょうたい s = (けんこうど, よびひん)、 こうどう a = レバー、 せんい P = こしょうダイス と ろうきゅうコイン、 ほうしゅう r = このターンの げんきん。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは <em>すべての</em> じょうきょうへの レバー、 あなたが いなくても チームが したがう SOP。 「こしょうまで うんてん」 (ぜんぶ うんてん) と 「つねに ざいこ」 (まんたんまで はっちゅう) を、 どちらが よいか いう まえに みせる。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1クォーターは かくりつへんすうの れつ。 おなじ プレイブック、 おなじ スタート、 まいかい ちがう テープ。 これは サイコロで あって、 へたな けいえいでは ない。 ほうしゅうは まいターン はいる (ずっと つづく そうぎょう)。</p>',
      'notes.scene6': '<h3>リターン</h3><p>ろうきゅう・ビンからの ばあい： はっちゅうが うんてんに かつ。 うんてんは まけの しっぽが ふとい (ビン 0 の こしょうは -8)。 ドクトリンは ぶんぷ ぜんたいで はんだん、 1クォーターでは ない。</p>',
      'notes.scene7': '<h3>Q*</h3><p>かく Q* は その レバーの ほんとうの しょうがい かち。 ★が <b>ビンで うごく</b>： よびひん 0 の ろうきゅう/こしょうまえ -> はっちゅう (ほごを えに いく)、 よびひん あり -> こうかん (つかう)。 けんこう -> うんてん。 argmax = さいぜんの レバー。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>きょうの かち = このターンの げんきん + レバーが おとす さきの かち。 きれいな かくていの バックアップ 2つ： (こしょうまえ,1) からの こうかん と (ろうきゅう,0) からの はっちゅう。 どちらも V* を さいげん。</p>',
      'notes.scene9': '<h3>DP</h3><p>こしょう オッズ と ろうきゅうは きち なので P は きち、 Q* は せいかく。 バックアップを スイープ： まず けんこうが うんてんに、 つぎに ビン 0 の れつが はっちゅうに、 よびひん ありの セルが こうかんに おちつく。 ツイストの ヒートマップが ひとりでに えがかれる。</p>',
      'notes.scene10': '<h3>DP が だめな りゆう</h3><p>(a) せいかくな こしょう オッズは えられない。 (b) げんじつの こうじょうは きかい・ぶひん・リードタイム・きょうゆう よびひんが おおく、 グリッドは 9セルを はるかに こえて ばくはつ。 DP は りそう、 しゅほうでは ない。</p>',
      'notes.scene11': '<h3>SARSA</h3><p>きたいちを 1かいの かんそくで おきかえる： Q を [r + γ q(s\',a\')] に よせる。 ε で みけんしょうの レバーを ためしつづける。 この MDP では さいぜんの レバーが めいかく なので、 オンポリシーの SARSA が DP の ツイスト ヒートマップを そのまま とりもどす。 モデルは あたえずに。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいの カード： MDP、 ポリシー、 リターン、 Q*、 DP、 SARSA。 むすび： ただしい せんたくは じょうきょうで かわった。 きかいが それを どう まなぶか、 その ほねを みた。</p>',
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

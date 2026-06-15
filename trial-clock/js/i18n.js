/* i18n CORE for Trial Clock -- English (authoritative) + Japanese mirror.
 *
 *   This file is the THIN core only. It seeds the shared chrome strings
 *   (topbar, concept-badge labels, prev/next, theme/lang/music labels, the
 *   common board / coin / wheel / lever vocabulary, and the lecturer speaker
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
 *     I18N.setLang(lang)           change + persist + notify
 *     I18N.register(obj)           deep-merge { en, jp } string fragments
 *     I18N.onChange(cb)            subscribe (returns an unsubscribe fn)
 *
 *   Japanese uses kana-leaning phrasing to match the on-screen DotGothic16
 *   bitmap font; KaTeX formulas stay in pure mathematical form. */
(function () {
  const STORAGE_KEY = 'trial-clock.lang';

  const STORE = {
    en: {
      /* ---- topbar / chrome ---- */
      'brand':        'SML · TRIAL CLOCK',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',

      'sound.on':     '♪ SOUND ON',
      'sound.off':    '♪ SOUND OFF',

      /* ---- concept-badge labels ---- */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /* ---- common vocabulary, reused across scenes ---- */
      'vocab.tier':     'adoption tier',
      'vocab.days':     'days left',
      'vocab.situation':'the situation',
      'vocab.lever':    'the lever',

      /* ---- the three levers (canonical labels) ---- */
      'lever.nudge':         'ONBOARD NUDGE',
      'lever.nothing':       'DO NOTHING',
      'lever.push':          'PAYWALL PUSH',
      'lever.nudge.short':   'NUDGE',
      'lever.nothing.short': 'WAIT',
      'lever.push.short':    'PUSH',
      'lever.nudge.role':    'build value',
      'lever.nothing.role':  'hold, spend nothing',
      'lever.push.role':     'ask for the sale',

      /* ---- Trial Card labels ---- */
      'card.activated': 'ACTIVATED',
      'card.none':      'none',
      'card.daysLeft':  'days left',
      'card.tier':      'tier',

      /* ---- board widget labels ---- */
      'board.axisDays': 'days left',
      'board.axisTier': 'adoption tier',
      'board.bestLever':'best lever here',
      'board.play':     'play',
      'board.title':    'best lever in every situation',

      /* ---- terminals ---- */
      'term.convert': 'CONVERT',
      'term.abandon': 'ABANDON',
      'term.expiry':  'EXPIRY',
      'term.paid':    'PAID',

      /* ---- adoption coin ---- */
      'coin.heads': 'ADOPTS ↑',
      'coin.tails': 'NO CHANGE',
      'coin.badge': '½ ADOPT',

      /* ---- conversion wheel ---- */
      'wheel.buy':     'BUY',
      'wheel.ignore':  'IGNORE',
      'wheel.abandon': 'ABANDON',

      /* ---- shared overlay chrome ---- */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /* ---- lecturer speaker notes, keyed by scene ---- */
      'notes.scene0': '<h3>Hook</h3><p>A stranger on a 5-day free trial, the clock ticking. The whole lesson: <b>the right growth move depends on the situation</b> -- pushing the paywall is a disaster on a cold day-5 user and the best move in the game on an activated one.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only, no theory. <b>Situation</b> = the adoption ladder + days left. <b>Levers</b> = NUDGE / DO NOTHING / PUSH. <b>Dice you do not control</b> = the Adoption Coin and the Conversion Wheel.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them run one trial. Many will PUSH a cold user early, hit the big red ABANDON wedge, and eat the -5. "You were already following <em>some</em> playbook."</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the trial they just played: state s = (tier, days); action a (the lever); transition P (coin + wheel); reward r (+20 convert / -1 nudge / -5 abandon / 0 else).</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is a lever for <em>every</em> cell, the SOP a new growth hire would follow. Show Always-Push (all gold) vs Always-Nudge (all teal) before saying which is better.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One user is one sample path. Same playbook on the next user gives a different tape -- the capitals mean "random until realized". Reward is mostly 0 until a terminal.</p>',
      'notes.scene6': '<h3>Return</h3><p>ROI is a distribution, not one number. PUSH on a mid user spikes at +20 (BUY), clusters near 0 (IGNORE then expiry), with a -5 tail (ABANDON). Respect the downside tail.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Each Q* is the honest long-run value of a lever, played smart afterward. The star <b>flips</b>: NUDGE on a cold-early user, PUSH on an activated one. argmax = the best move there.</p>',
      'notes.scene8': '<h3>Bellman</h3><p>Value today = this reward + the value of where the dice leave you, played optimally. Worked on (tier 3, day 2) PUSH: BUY +20, IGNORE -> play (3,1) best, ABANDON -5, by the wheel odds.</p>',
      'notes.scene9': '<h3>DP</h3><p>Hard deadline, so solve RIGHT TO LEFT. The day-1 column is one line of arithmetic each; each earlier column comes from the one to its right. Watch the staircase fill in column by column.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You rarely KNOW the response curves -- they differ by segment/channel/season and drift. (b) Real state spaces explode past 25 cells once you add plan, company size, referral, ... DP is the ideal, not the method.</p>',
      'notes.scene11': '<h3>SARSA</h3><p>Drop the model: replace the Bellman expectation with one observed attempt. Pull a lever, see the dice, see the next situation and next lever, nudge q toward what you saw. eps keeps you trying the unproven option. It converges to the DP staircase, never told the odds.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, SARSA. Close: the same frame fits pricing, retention, inventory -- every call you make under uncertainty. Note the one grey DO-NOTHING cell: sometimes the best move is to spend nothing.</p>',
    },

    jp: {
      /* ---- topbar / chrome ---- */
      'brand':        'SML · トライアル クロック',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     '♪ おんがく オン',
      'music.off':    '♪ おんがく オフ',
      'lang.toggle':  'ENGLISH',

      'sound.on':     '♪ おと オン',
      'sound.off':    '♪ おと オフ',

      /* ---- concept-badge labels ---- */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /* ---- common vocabulary ---- */
      'vocab.tier':     'りようレベル',
      'vocab.days':     'のこり にっすう',
      'vocab.situation':'じょうきょう',
      'vocab.lever':    'レバー',

      /* ---- the three levers ---- */
      'lever.nudge':         'オンボード ナッジ',
      'lever.nothing':       'なにもしない',
      'lever.push':          'ペイウォール プッシュ',
      'lever.nudge.short':   'ナッジ',
      'lever.nothing.short': 'まつ',
      'lever.push.short':    'プッシュ',
      'lever.nudge.role':    'かちを そだてる',
      'lever.nothing.role':  'まつ、 つかわない',
      'lever.push.role':     'こうにゅうを うながす',

      /* ---- Trial Card labels ---- */
      'card.activated': 'アクティブ',
      'card.none':      'なし',
      'card.daysLeft':  'のこり にっすう',
      'card.tier':      'レベル',

      /* ---- board widget labels ---- */
      'board.axisDays': 'のこり にっすう',
      'board.axisTier': 'りようレベル',
      'board.bestLever':'ここでの さいぜんの レバー',
      'board.play':     'えらぶ',
      'board.title':    'すべての じょうきょうでの さいぜんの レバー',

      /* ---- terminals ---- */
      'term.convert': 'こうにゅう',
      'term.abandon': 'りだつ',
      'term.expiry':  'しゅうりょう',
      'term.paid':    'ゆうりょう',

      /* ---- adoption coin ---- */
      'coin.heads': 'りよう ↑',
      'coin.tails': 'へんか なし',
      'coin.badge': '½ りよう',

      /* ---- conversion wheel ---- */
      'wheel.buy':     'こうにゅう',
      'wheel.ignore':  'むし',
      'wheel.abandon': 'りだつ',

      /* ---- overlay chrome ---- */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /* ---- lecturer speaker notes ---- */
      'notes.scene0': '<h3>つかみ</h3><p>5にちかんの むりょうトライアルの しらない ユーザー、 とけいは すすむ。 きょうの じゅぎょう： <b>ただしい グロースの いっては じょうきょうで かわる</b> -- ペイウォール プッシュは つめたい 5にちめの ユーザーには さいあく、 アクティブな ユーザーには さいぜんの いって。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ。 りろんは なし。 <b>じょうきょう</b> = りようの はしご ＋ のこり にっすう。 <b>レバー</b> = ナッジ / なにもしない / プッシュ。 <b>じぶんで きめられない さいころ</b> = りようコイン と コンバージョン ホイール。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>1かいの トライアルを やってもらう。 おおくは つめたい ユーザーに はやく プッシュし、 おおきな あかい りだつ ウェッジに あたり、 -5 を くらう。 「あなたは すでに <em>なんらかの</em> プレイブックに したがっていた」。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>いま あそんだ トライアルの うえで よっつの ぶぶんに なまえを： じょうたい s =（レベル、にっすう）； こうどう a（レバー）； せんい P（コイン ＋ ホイール）； ほうしゅう r（こうにゅう +20 / ナッジ -1 / りだつ -5 / それいがい 0）。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは <em>すべての</em> セルへの レバー、 あたらしい グロース たんとうが したがう SOP。 どちらが よいか いう まえに、 つねに プッシュ（ぜんぶ ゴールド）と つねに ナッジ（ぜんぶ ティール）を みせる。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1にんの ユーザーは 1つの サンプルパス。 つぎの ユーザーに おなじ プレイブックで ちがう テープ -- だいもじは 「じつげん するまで ランダム」。 ほうしゅうは しゅうりょうまで ほぼ 0。</p>',
      'notes.scene6': '<h3>リターン</h3><p>ROI は 1つの すうじでなく ぶんぷ。 ちゅうかんユーザーへの プッシュは +20（こうにゅう）に スパイク、 0 ふきん（むし→しゅうりょう）に かたまり、 -5 の すそ（りだつ）。 マイナスの すそを そんちょう。</p>',
      'notes.scene7': '<h3>Q*</h3><p>かく Q* は レバーの しょうじきな ちょうきかち（あとは じょうずに プレイ）。 ★が <b>はんてん</b>する： つめたく はやい ユーザーには ナッジ、 アクティブには プッシュ。 argmax = ここでの さいぜんの いって。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>きょうの かち = この ほうしゅう ＋ さいころが おとす さきの かち（さいぜんに プレイ）。（レベル3、 にっすう2）の プッシュ： こうにゅう +20、 むし→（3,1）で さいぜん、 りだつ -5、 ホイールの オッズで。</p>',
      'notes.scene9': '<h3>DP</h3><p>きびしい しめきり なので みぎから ひだりへ とく。 にっすう1の れつは それぞれ いちぎょうの けいさん； はやい れつは みぎの れつから。 かいだんが れつごとに うまっていくのを みる。</p>',
      'notes.scene10': '<h3>DP が だめな りゆう</h3><p>(a) ほんとうの はんのうカーブは めったに わからない -- セグメント/チャネル/きせつで ちがい、 ドリフトする。 (b) げんじつの じょうたいくうかんは プラン、 きぼ、 しょうかい … を くわえると 25セルを はるかに こえる。 DP は りそう であって しゅほう では ない。</p>',
      'notes.scene11': '<h3>SARSA</h3><p>モデルを すてる： ベルマンの きたいちを 1かいの かんそくで おきかえる。 レバーを ひき、 さいころを み、 つぎの じょうきょうと つぎの レバーを み、 q を みた ことへ よせる。 eps が ためしていない せんたくしを ためさせる。 オッズを しらされずに DP の かいだんに しゅうそく する。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいの カード： MDP、 ポリシー、 リターン、 Q*、 DP、 SARSA。 むすび： おなじ フレームが プライシング、 リテンション、 ざいこ -- ふかくじつな すべての はんだんに あう。 1つの はいいろの 「なにもしない」 セルに ちゅうもく： ときには つかわないのが さいぜん。</p>',
    },
  };

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

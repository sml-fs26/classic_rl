/* i18n CORE for Beat the Deadline, English (authoritative) + Japanese mirror.
 *
 *   THIN core only: seeds the shared chrome strings (topbar, concept-badge
 *   labels, prev/next, theme/lang/music labels, the dock/lever/dice vocabulary,
 *   the board labels, and the lecturer speaker notes). Every scene ships its own
 *   fragment at js/i18n/sceneN.i18n.js that calls:
 *
 *       window.I18N.register({ en: { ... }, jp: { ... } });
 *
 *   register() deep-merges fragments into the en / jp stores.
 *
 *   Public API: I18N.lang / current() / t(key, vars) / setLang(lang) /
 *   register(obj) / onChange(cb). KaTeX formulas stay in pure math (symbols
 *   cross languages); Japanese uses kana-leaning phrasing to match the
 *   on-screen DotGothic16 bitmap font. */
(function () {
  const STORAGE_KEY = 'btd-viz.lang';

  const STORE = {
    en: {
      /*, topbar / chrome, */
      'brand':        'SML · BEAT THE DEADLINE',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',

      /*, concept-badge labels (lit on reaching the relevant scene), */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'TD',

      /*, dock vocabulary, reused across scenes, */
      'vocab.pallets':  'pallets',
      'vocab.hours':    'hours left',
      'vocab.dock':     'the dock',
      'vocab.deadline': 'the deadline',
      'vocab.truck':    'the truck',

      /*, the two levers, */
      'action.wait':       'WAIT',
      'action.send':       'SEND',
      'action.wait.role':  'hold',
      'action.send.role':  'ship now',
      'action.wait.gloss': 'hold one more hour to consolidate',
      'action.send.gloss': 'dispatch the load now, on time',

      /*, dice, */
      'die.arrivalLabel':  'ARRIVAL DIE',
      'die.deadlineLabel': 'DEADLINE DIE',
      'die.arrivalBadge':  '60%',
      'die.pallet':        '+1 PALLET',
      'die.noPallet':      'NO PALLET',
      'die.blown':         'BLOWN!',
      'die.safe':          'SAFE',

      /*, board labels, */
      'board.pallets':   'pal',
      'board.hours':     'hrs',
      'board.bestLever': 'best lever',
      'board.play':      'play',
      'board.late':      'late',
      'board.send':      'SEND',
      'board.wait':      'WAIT',

      /*, overlay chrome, */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /*, lecturer speaker notes, keyed by scene, */
      'notes.scene0': '<h3>Hook</h3><p>The half-empty-truck call, lived a hundred times. One hard deadline, a half-full truck. The whole lesson: <b>the right call is not a fixed rule</b> like "always ship at 80%", it flips with how full you are AND how much time is left.</p>',
      'notes.scene1': '<h3>Tutorial</h3><p>Vocabulary only. <b>Pallets (p)</b> + <b>hours-left (h)</b> = the situation. <b>WAIT / SEND</b> = the two levers. WAIT rolls two dice: a green arrival die (a pallet, maybe) and a red deadline die that <em>gets nastier as the clock runs down</em>.</p>',
      'notes.scene2': '<h3>Playtest</h3><p>Let them feel a WAIT pay off (a pallet arrives, fuller truck) or punish (the deadline blows, load stranded). "You already wait when there is time and ship when the clock is red, that instinct is a policy."</p>',
      'notes.scene3': '<h3>Formalization</h3><p>Name the four parts over the dock: state s=(p,h), action a in {WAIT,SEND}, transition P (the two dice), reward r (+5 a pallet, -10 the truck, -5 a stranded pallet).</p>',
      'notes.scene4': '<h3>Policy</h3><p>A policy is one lever for <em>every</em> one of the 25 dock states, the SOP your team follows without you. Show Always-SEND (all blue) vs Always-WAIT (mostly amber) before asking which is best, and whether one flat rule is even good enough.</p>',
      'notes.scene5': '<h3>Trajectory</h3><p>One window is a sequence of random variables. (2,4) -> WAIT -> (3,3) -> SEND -> +5. Same SOP, a different tape every time, that is the dice.</p>',
      'notes.scene6': '<h3>Return</h3><p>The return is the payoff over the whole window. From (2,4), WAIT gives a spread: mostly +5, sometimes 0, a few -10 (blown). SEND now is a certain 0. Judge by the average, not one window.</p>',
      'notes.scene7': '<h3>Q*</h3><p>Q*(s,a) is the long-run value of a lever, played smart after. The star MOVES: at (2,3) WAIT (+0.40), one hour later at (2,2) SEND. Two near-identical situations, opposite calls, the twist.</p>',
      'notes.scene8': '<h3>Bellman</h3><p>Value is recursive: immediate payoff plus the best from wherever the dice land you. WAIT(2,3) = 0.2*(-10) + 0.8*[0.6*V*(3,2)+0.4*V*(2,2)] = +0.40. Hand-checkable.</p>',
      'notes.scene9': '<h3>DP</h3><p>The dice are known, so P is known and Q* is exact. Sweep the Bellman backup: the deadline wall locks first at -10, then the diagonal staircase (threshold 1->2->3->4) draws itself in six passes.</p>',
      'notes.scene10': '<h3>Why DP fails</h3><p>(a) You rarely know the real arrival rate / carrier odds, they drift by season and lane. (b) Add SKUs, trucks, lanes, a week-long horizon and 25 cells become millions. DP is the gold standard you usually cannot run.</p>',
      'notes.scene11': '<h3>TD: SARSA vs Q-learning</h3><p>Replace the expectation with one observed dispatch. Off-policy <b>Q-learning</b> bootstraps on the best next lever and recovers the exact diagonal (== DP). On-policy <b>SARSA</b> learns the value of the cautious rule it follows and ships the thin (2,3) order one hour early. Cautious vs optimal, the cliff-walking distinction, on the dock.</p>',
      'notes.scene12': '<h3>Recap</h3><p>Six cards: MDP, policy, return, Q*, DP, TD. Close: the half-empty-truck call has an exact answer, and you can learn it without ever knowing the odds.</p>',
    },

    jp: {
      /*, topbar / chrome, */
      'brand':        'SML · しめきりにまにあう',
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

      /*, dock vocabulary, */
      'vocab.pallets':  'パレット',
      'vocab.hours':    'のこり時間',
      'vocab.dock':     'ドック',
      'vocab.deadline': 'しめきり',
      'vocab.truck':    'トラック',

      /*, the two levers, */
      'action.wait':       'WAIT',
      'action.send':       'SEND',
      'action.wait.role':  'まつ',
      'action.send.role':  'いまおくる',
      'action.wait.gloss': 'もう1じかん まって まとめる',
      'action.send.gloss': 'いま にもつを じかんないに おくる',

      /*, dice, */
      'die.arrivalLabel':  'とうちゃくダイス',
      'die.deadlineLabel': 'しめきりダイス',
      'die.arrivalBadge':  '60%',
      'die.pallet':        '+1 パレット',
      'die.noPallet':      'なし',
      'die.blown':         'しっぱい！',
      'die.safe':          'ぶじ',

      /*, board labels, */
      'board.pallets':   'パ',
      'board.hours':     '時',
      'board.bestLever': 'さいぜんのレバー',
      'board.play':      'これ',
      'board.late':      'ちこく',
      'board.send':      'SEND',
      'board.wait':      'WAIT',

      /*, overlay chrome, */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /*, lecturer speaker notes, */
      'notes.scene0': '<h3>つかみ</h3><p>半分からのトラックをどうするか、何百回もした選択。 きょうのじゅぎょう： <b>ただしいこたえは「つねに80%で出す」のようなひとつのルールではない</b>。 どれだけ つんでいるかと、 どれだけ 時間がのこっているかで ひっくりかえる。</p>',
      'notes.scene1': '<h3>チュートリアル</h3><p>ことばだけ。 <b>パレット(p)</b> と <b>のこり時間(h)</b> ＝ じょうきょう。 <b>WAIT / SEND</b> ＝ 2つのレバー。 WAIT は 2つのダイスを ふる： みどりのとうちゃくダイスと、 <em>時間がのこるほど やばくなる</em> あかい しめきりダイス。</p>',
      'notes.scene2': '<h3>プレイテスト</h3><p>WAIT が むくわれる（パレットがきて、よりいっぱいのトラック）か、ばっする（しめきりがしっぱい）のを かんじて もらう。「あなたは すでに あるキマリに したがっていた」。</p>',
      'notes.scene3': '<h3>けいしきか</h3><p>ドックのうえで 4つに なまえを： じょうたい s=(p,h)、 こうどう a in {WAIT,SEND}、 せんい P（ダイス2つ）、 ほうしゅう r（パレット +5、トラック -10、とりのこし -5）。</p>',
      'notes.scene4': '<h3>ポリシー</h3><p>ポリシーは 25すべてのマスへのレバー、 SOP。 いつも SEND（あお）と いつも WAIT（だいたい こはく）を みせてから、 どちらが よいか、 ひとつのルールで じゅうぶんかを とう。</p>',
      'notes.scene5': '<h3>きせき</h3><p>1つのウィンドウは かくりつへんすうのれつ。 (2,4)->WAIT->(3,3)->SEND->+5。 おなじ SOP、まいかいちがうテープ。</p>',
      'notes.scene6': '<h3>リターン</h3><p>リターンは ウィンドウぜんたいのほうしゅう。 (2,4)から WAIT は ばらつき： ほとんど +5、ときどき 0、たまに -10。 SEND は かくじつの 0。 へいきんで はんだん。</p>',
      'notes.scene7': '<h3>Q*</h3><p>Q*(s,a) は レバーの ロングランのかち。 ★が <b>うごく</b>： (2,3) で WAIT (+0.40)、 1じかんあとの (2,2) で SEND。 ほぼおなじじょうきょう、おなじこたえ。</p>',
      'notes.scene8': '<h3>ベルマン</h3><p>かちは さいきてき： いまのほうしゅう と ダイスのおちた さきの べすと。 WAIT(2,3) = 0.2*(-10)+0.8*[0.6*V*(3,2)+0.4*V*(2,2)] = +0.40。</p>',
      'notes.scene9': '<h3>DP</h3><p>ダイスはきちなので P はきち、Q* はせいかく。 ベルマンバックアップを スイープ： しめきりのかべが -10 で まずロック、そして となりのかいだん（1->2->3->4）が 6パスで ひとりでに えがかれる。</p>',
      'notes.scene10': '<h3>DP がだめな りゅう</h3><p>(a) ほんとうのとうちゃくりつやキャリアのオッズは めったにわからない。 (b) SKUやトラックやレーンをたすと 25マスが 何百万に。 DP は ふつうは つかえない ゴールドスタンダード。</p>',
      'notes.scene11': '<h3>TD: SARSA たい Q-ラーニング</h3><p>きたいちを 1つの じっさいの しゅっか で おきかえる。 オフポリシーの <b>Q-ラーニング</b> は つぎのさいぜんのレバーで ブートストラップし、せいかくなとなり（＝DP）を とりもどす。 オンポリシーの <b>SARSA</b> は したがうしんちょうなルールのかちをまなび、(2,3) のうすいちゅうもんを 1じかんはやく おくる。 しんちょう たい さいぜん。</p>',
      'notes.scene12': '<h3>まとめ</h3><p>6まいのカード： MDP, ポリシー, リターン, Q*, DP, TD。 むすび： 半分からのトラックのこたえは せいかくに あり、オッズをしらなくても まなべる。</p>',
    },
  };

  let lang = 'en';
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'jp') lang = saved; } catch (_e) {}
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

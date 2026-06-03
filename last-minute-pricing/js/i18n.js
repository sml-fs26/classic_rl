/* i18n CORE for Last-Minute Pricing -- English (source of truth) + Japanese.
 *
 *   This file holds ONLY the engine plus the small set of SHARED strings
 *   (topbar chrome, the six concept-badge labels, common pricing vocabulary).
 *   Every scene ships its own copy in js/i18n/sceneN.i18n.js, which calls
 *   window.I18N.register({ en: {...}, jp: {...} }) at load time to deep-merge
 *   its fragment into the dictionary. English is authoritative; the Japanese
 *   mirror gives full parity (the framework supports both, like the Pokemon
 *   reference build).
 *
 *   Public API (the contract):
 *     I18N.register(obj)   deep-merge obj.en / obj.jp into the private dict
 *     I18N.t(key, vars)    lookup current lang, fall back to en, interpolate
 *                          {var} tokens, return the key itself if missing
 *     I18N.current()       current language code ('en' | 'jp')
 *     I18N.setLang(lang)   switch + persist to localStorage + notify listeners
 *
 *   Compatibility (used by the reused chrome modules i18n-ui.js / main.js):
 *     I18N.lang            getter, same as current()
 *     I18N.onChange(cb)    subscribe to language changes; returns unsubscribe
 *
 *   KaTeX-rendered formulas stay in pure math form -- symbols cross languages.
 */
(function () {
  const STORAGE_KEY = 'pricing-viz.lang';

  /* Private dictionary. Scene fragments register into this. */
  const DICT = { en: {}, jp: {} };

  /* Deep-merge a one-level-nested {en:{...}, jp:{...}} fragment in. We only
     ever store flat string maps under each lang, so a shallow per-lang
     Object.assign is the right "deep" merge here. */
  function register(obj) {
    if (!obj) return;
    if (obj.en) Object.assign(DICT.en, obj.en);
    if (obj.jp) Object.assign(DICT.jp, obj.jp);
  }

  /* ---- SHARED strings only (scene copy lives in fragments) ---- */
  register({
    en: {
      /* topbar / chrome */
      'brand':        'SML · PRICING',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',                 /* what to switch TO */
      'notes.btn':    'NOTES',

      /* six concept-badge labels (topbar progress row) */
      'badge.mdp':    'MDP',
      'badge.policy': 'POLICY',
      'badge.return': 'RETURN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'SARSA',

      /* common pricing vocabulary, reused across scenes */
      'vocab.units':     'seats',
      'vocab.unit':      'seat',
      'vocab.days':      'days',
      'vocab.day':       'day',
      'vocab.deadline':  'DEPARTURE',
      'vocab.midnight':  'GATE CLOSED',
      'vocab.soldout':   'FULL FLIGHT',
      'vocab.dollar':    '$',
      'vocab.revenue':   'REVENUE',
      'vocab.demand':    'DEMAND',
      'vocab.sold':      'sold',

      /* the three price-lever names (canonical labels) */
      'lever.premium':        'PREMIUM',
      'lever.standard':       'STANDARD',
      'lever.firesale':       'FIRE-SALE',
      'lever.premium.short':  'PREM',
      'lever.standard.short': 'STD',
      'lever.firesale.short': 'FIRE',

      /* shared Q-table / board widget labels (window.QTable) */
      'qtable.corner':    'UNITS \\ DAYS',
      'qtable.dayCol':    '{d}D LEFT',
      'qtable.unitRow':   '{u}U',
      'qtable.gutterSub': 'leftover = $0',
      'qtable.usageTitle':'BEST LEVER ACROSS THE {n} SITUATIONS',
      'qtable.bestLever': 'BEST LEVER HERE',
      'qtable.priced':    'PRICED!',

      /* shared demand-deck labels (window.Deck) */
      'deck.flip':        'FLIP',
      'deck.sold':        '{k} SOLD',
      'deck.none':        'NONE SOLD',

      /* shared overlay chrome */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',
      'boot.tag':           'A REINFORCEMENT-LEARNING ADVENTURE',

      /* shared trajectory-tree widget labels (window.TrajTree) */
      'tt.eg':    'E[G]',
      'tt.merge': 'merges ↑',
      'tt.rare':  'rare',
    },
    jp: {
      'brand':        'SML · プライシング',
      'topbar.prev':  'まえ',
      'topbar.next':  'つぎ',
      'topbar.theme': 'いろ',
      'music.on':     '♪ おんがく オン',
      'music.off':    '♪ おんがく オフ',
      'lang.toggle':  'ENGLISH',
      'notes.btn':    'ノート',

      'badge.mdp':    'MDP',
      'badge.policy': 'ほうさく',
      'badge.return': 'リターン',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'SARSA',

      'vocab.units':     'せき',
      'vocab.unit':      'せき',
      'vocab.days':      'にち',
      'vocab.day':       'にち',
      'vocab.deadline':  'しゅっぱつ',
      'vocab.midnight':  'ゲートクローズ',
      'vocab.soldout':   'まんせき',
      'vocab.dollar':    '$',
      'vocab.revenue':   'うりあげ',
      'vocab.demand':    'じゅよう',
      'vocab.sold':      'うれた',

      'lever.premium':        'プレミアム',
      'lever.standard':       'スタンダード',
      'lever.firesale':       'おおやすうり',
      'lever.premium.short':  'プレミ',
      'lever.standard.short': 'スタ',
      'lever.firesale.short': 'やすうり',

      'qtable.corner':    'ざいこ \\ にっすう',
      'qtable.dayCol':    'のこり{d}にち',
      'qtable.unitRow':   '{u}こ',
      'qtable.gutterSub': 'うれのこり = $0',
      'qtable.usageTitle':'{n}じょうきょうでの さいてきレバー',
      'qtable.bestLever': 'ここでの さいてきレバー',
      'qtable.priced':    'かくてい！',

      'deck.flip':        'めくる',
      'deck.sold':        '{k}こ うれた',
      'deck.none':        'うれず',

      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（このシーンの ノートは まだ ありません。）',
      'boot.tag':           '〜 きょうかがくしゅう ぼうけん 〜',

      /* shared trajectory-tree widget labels (window.TrajTree) */
      'tt.eg':    'E[G]',
      'tt.merge': 'まとめ ↑',
      'tt.rare':  'まれ',
    },
  });

  /* ---- Initial language: #lang= hash override, else localStorage, else en ---- */
  let lang = 'en';
  const hashMatch = (window.location.hash || '').match(/[#&?]lang=(\w+)/);
  if (hashMatch && (hashMatch[1] === 'en' || hashMatch[1] === 'jp')) {
    lang = hashMatch[1];
  } else {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'jp') lang = stored;
    } catch (_e) {}
  }

  const listeners = [];

  function t(key, vars) {
    const table = DICT[lang] || DICT.en;
    let s = table[key];
    if (s === undefined) s = (DICT.en[key] !== undefined) ? DICT.en[key] : key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
    }
    return s;
  }

  function current() { return lang; }

  function setLang(next) {
    if (next !== 'en' && next !== 'jp') return;
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_e) {}
    applyBodyClass();
    /* Dispatch a DOM event AND call onChange listeners so either wiring
       style works. */
    try { window.dispatchEvent(new CustomEvent('lang-change', { detail: { lang: lang } })); } catch (_e) {}
    for (const cb of listeners) { try { cb(lang); } catch (e) { console.error(e); } }
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
    register, t, current, setLang, onChange,
  };
})();

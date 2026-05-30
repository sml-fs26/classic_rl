/* i18n CORE for Press Your Luck - English (authoritative) + Japanese mirror.
 *
 *   This file is the THIN core only. It seeds the shared chrome strings
 *   (topbar, concept-badge labels, prev/next, theme/lang/music/notes
 *   labels, and the common Pig vocabulary). Every scene ships its own
 *   fragment at js/i18n/sceneN.i18n.js that calls:
 *
 *       window.I18N.register({ en: { ... }, jp: { ... } });
 *
 *   register() deep-merges fragments into the en / jp stores, so the
 *   per-scene strings live next to their scene and the core stays small.
 *
 *   Public API:
 *     I18N.lang                  current 'en' | 'jp' (getter)
 *     I18N.current()             same as I18N.lang
 *     I18N.t(key, vars)          lookup; {var} placeholders filled; falls
 *                                back to the en string, then to the key
 *     I18N.setLang(lang)         change + persist + notify subscribers
 *     I18N.register(obj)         deep-merge { en, jp } string fragments
 *     I18N.onChange(cb)          subscribe (returns an unsubscribe fn)
 *
 *   Japanese uses Gen-1-era hiragana/katakana phrasing (no kanji) to match
 *   the on-screen DotGothic16 bitmap font. KaTeX formulas stay in pure
 *   mathematical form - symbols cross languages without ambiguity.
 */
(function () {
  const STORAGE_KEY = 'pyl-lang';

  /* The two string stores. Seeded with shared keys; scene fragments
     deep-merge their own keys via register(). */
  const STORE = {
    en: {
      /* ---- topbar / chrome ---- */
      'brand':        'SML · PRESS YOUR LUCK',
      'topbar.prev':  'PREV',
      'topbar.next':  'NEXT',
      'topbar.theme': 'theme',
      'music.on':     '♪ MUSIC ON',
      'music.off':    '♪ MUSIC OFF',
      'lang.toggle':  '日本語',          /* what to switch TO */

      /* ---- concept-badge labels (lit on reaching the relevant scene) ---- */
      'badge.mdp':    'MDP',
      'badge.policy': 'POL',
      'badge.return': 'RTN',
      'badge.qstar':  'Q*',
      'badge.dp':     'DP',
      'badge.sarsa':  'SAR',

      /* ---- speaker notes / overlays ---- */
      'speakerNotes.title': 'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty': '(No notes for this scene yet.)',

      /* ---- one-time intro modal ("You are the player") ---- */
      'intro.title': 'YOU ARE THE PLAYER',
      'intro.body':  'You are on a streak that grows if you let it ride and vanishes on one bad roll. Decide each turn: ROLL for more, or BANK what you have. First to ' + 50 + ' wins.',
      'intro.ok':    'LET\'S PLAY',

      /* ---- common Pig vocabulary (shared across scenes) ---- */
      'vocab.pot':        'POT',
      'vocab.standing':   'STANDING',
      'vocab.behind':     'BEHIND',
      'vocab.even':       'EVEN',
      'vocab.ahead':      'AHEAD',
      'vocab.roll':       'ROLL',
      'vocab.hold':       'HOLD',
      'vocab.bust':       'BUST',
      'vocab.bank':       'BANK',
      'vocab.banked':     'BANKED',
      'vocab.win':        'WIN',
      'vocab.lose':       'LOSE',
      'vocab.die':        'DIE',
      'vocab.you':        'YOU',
      'vocab.rival':      'RIVAL',
      'vocab.target':     'TARGET',
      'vocab.winprob':    'WIN PROB',
      'vocab.push':       'PUSH',
      'vocab.bankit':     'BANK IT',
    },

    jp: {
      /* ---- topbar / chrome ---- */
      'brand':        'SML · プレス ユア ラック',
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
      'badge.sarsa':  'SAR',

      /* ---- speaker notes / overlays ---- */
      'speakerNotes.title': 'スピーカー ノート · <kbd>n</kbd> で とじる',
      'speakerNotes.empty': '（この シーンの ノートは まだ ありません）',

      /* ---- one-time intro modal ---- */
      'intro.title': 'あなたが プレイヤー',
      'intro.body':  'いきおいに のれば のびる。 でも わるい めが ひとつ でれば きえる。 まいターン えらぶ： もっと ふるか、 いま バンクするか。 さきに 50で かち。',
      'intro.ok':    'プレイ かいし',

      /* ---- common Pig vocabulary ---- */
      'vocab.pot':        'ポット',
      'vocab.standing':   'たちば',
      'vocab.behind':     'おくれ',
      'vocab.even':       'ごかく',
      'vocab.ahead':      'リード',
      'vocab.roll':       'ふる',
      'vocab.hold':       'キープ',
      'vocab.bust':       'バスト',
      'vocab.bank':       'バンク',
      'vocab.banked':     'バンクずみ',
      'vocab.win':        'かち',
      'vocab.lose':       'まけ',
      'vocab.die':        'サイコロ',
      'vocab.you':        'あなた',
      'vocab.rival':      'あいて',
      'vocab.target':     'もくひょう',
      'vocab.winprob':    'しょうりつ',
      'vocab.push':       'おす',
      'vocab.bankit':     'バンクする',
    },
  };

  /* ---- current language (persisted) ---- */
  let lang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'jp') lang = saved;
  } catch (_e) {}

  const listeners = [];

  /* Deep-merge a fragment's per-language tables into the stores. Fragments
     are flat { key: string } maps, so a shallow per-language Object.assign
     is the merge; we keep the loop explicit so missing en/jp halves are
     tolerated (a fragment may register only en during authoring). */
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

  /* Lookup: current language, then English fallback, then the key itself
     (so a missing string is visible rather than silently blank). */
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

/* i18n CORE for Churn Rescue: English (default) + Japanese (flavour mode).
 *
 *   This file holds ONLY the core machinery plus the SHARED strings every
 *   scene leans on: the topbar, the six concept-badge labels, prev/next,
 *   the theme / lang / music / notes controls, and the common vocabulary
 *   (tier names, months, lever names, stay/churn, renew/churn, the coin
 *   and die, the ledger). Each scene ships its own fragment file at
 *   js/i18n/sceneN.i18n.js which calls I18N.register({ en:{...}, jp:{...} })
 *   to merge its strings in. English is authoritative; a missing jp key
 *   falls back to en, a missing en key returns the key literally so gaps
 *   are visible in dev.
 *
 *   Public API:
 *     I18N.lang                    current 'en' | 'jp'
 *     I18N.t(key, vars)            lookup; {var} placeholders filled
 *     I18N.setLang(lang)           change + persist + notify subscribers
 *     I18N.onChange(callback)      subscribe (returns unsubscribe fn)
 *     I18N.register({ en, jp })    merge a fragment's strings into the tables
 *
 *   Subscribers do the work of re-rendering. main.js owns the
 *   scene-rebuild path; everyone else just re-paints their own labels.
 */
(function () {
  const STORAGE_KEY = 'churnviz-lang';

  /* The live string tables. Fragments register into these. */
  const STRINGS = {
    en: {
      /*, topbar, */
      'brand':            'SML · CHURN',
      'music.on':         '♪ MUSIC ON',
      'music.off':        '♪ MUSIC OFF',
      'lang.toggle':      '日本語',          /* what to switch TO */
      'topbar.prev':      'PREV',
      'topbar.next':      'NEXT',
      'topbar.theme':     'theme',

      /*, six concept-badge labels (topbar), */
      'badge.mdp':        'MDP',
      'badge.policy':     'POL',
      'badge.return':     'RTN',
      'badge.qstar':      'Q*',
      'badge.dp':         'DP',
      'badge.sarsa':      'SAR',
      'badge.mdp.full':    'MDP',
      'badge.policy.full': 'POLICY',
      'badge.return.full': 'RETURN',
      'badge.qstar.full':  'Q*',
      'badge.dp.full':     'DP',
      'badge.sarsa.full':  'SARSA',

      /*, tier names (engagement bar, cliff=0..thriving=4), */
      'tier.cliff':     'ON THE CLIFF',
      'tier.at-risk':   'AT-RISK',
      'tier.lukewarm':  'LUKEWARM',
      'tier.healthy':   'HEALTHY',
      'tier.thriving':  'THRIVING',
      'tier.short.cliff':    'CLIFF',
      'tier.short.at-risk':  'AT-RISK',
      'tier.short.lukewarm': 'LUKEWARM',
      'tier.short.healthy':  'HEALTHY',
      'tier.short.thriving': 'THRIVING',

      /*, months / renewal countdown, */
      'months.label':     'MONTHS TO RENEWAL',
      'months.one':       '{n} mo. to renewal',
      'months.many':      '{n} mo. to renewal',
      'months.imminent':  'RENEWAL IMMINENT',
      'months.short':     'm={n}',

      /*, lever names + costs (action space), */
      'lever.nothing':       'DO NOTHING',
      'lever.checkin':       'CHECK-IN',
      'lever.offer':         'BIG OFFER',
      'lever.short.nothing': 'NONE',
      'lever.short.checkin': 'CHECK',
      'lever.short.offer':   'OFFER',
      'lever.cost.nothing':  'FREE',
      'lever.cost.checkin':  '−1',
      'lever.cost.offer':    '−4',
      'lever.tagline':       '← cheaper · passive    ·    expensive · aggressive →',

      /*, the two dice, */
      'coin.name':        'RETENTION COIN',
      'coin.stay':        'STAYS',
      'coin.churn':       'CHURNS',
      'die.name':         'ENGAGEMENT DIE',
      'die.up':           'UP',
      'die.same':         'SAME',
      'die.down':         'DOWN',

      /*, terminals, */
      'terminal.renewed': '✓ RENEWED',
      'terminal.churned': '✗ CHURNED',
      'terminal.renewed_short': 'RENEW',
      'terminal.churned_short': 'CHURN',
      'terminal.renew_lump': '+20',
      'terminal.churn_lump': '−20',
      'terminal.mini':    '(terminal)',

      /*, margin ledger, */
      'ledger.title':     'MARGIN LEDGER',
      'ledger.debit':     'DEBIT',
      'ledger.credit':    'CREDIT',
      'ledger.balance':   'BALANCE',
      'ledger.value_units': 'value points',

      /*, generic state-icon label, */
      'account.label':    'ACCOUNT',
      'account.engagement': 'ENGAGEMENT',

      /*, retention map (the 5x5 Q-grid widget), */
      'retmap.corner':      'TIER \\ MONTHS',
      'retmap.empty':       '·',
      'retmap.freqTitle':   'WINNING LEVER ACROSS THE {n} STATES',
      'retmap.registered':  'REGISTERED!',
      'retmap.legendStar':  '★ = BEST LEVER',
      'retmap.legendEmpty': '· = NOT YET FILLED',

      /*, overlays (shared), */
      'help.title':           'KEYBOARD SHORTCUTS',
      'help.row.arrows':      'navigate scenes (or step within a scene)',
      'help.row.down':        'fast-fill the typewriter dialog',
      'help.row.n':           'speaker notes overlay (lecturer crib)',
      'help.row.t':           'toggle theme: light ↔ CRT',
      'help.row.m':           'toggle music on / off',
      'help.row.esc':         'close any overlay',
      'speakerNotes.title':   'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty':   '(No notes for this scene yet.)',
    },

    jp: {
      /*, topbar, */
      'brand':            'SML · チャーン',
      'music.on':         '♪ おんがく オン',
      'music.off':        '♪ おんがく オフ',
      'lang.toggle':      'ENGLISH',
      'topbar.prev':      'まえ',
      'topbar.next':      'つぎ',
      'topbar.theme':     'いろ',

      'badge.mdp':        'MDP',
      'badge.policy':     'ほうさく',
      'badge.return':     'リターン',
      'badge.qstar':      'Q*',
      'badge.dp':         'DP',
      'badge.sarsa':      'SAR',
      'badge.mdp.full':    'MDP',
      'badge.policy.full': 'ほうさく',
      'badge.return.full': 'リターン',
      'badge.qstar.full':  'Q*',
      'badge.dp.full':     'DP',
      'badge.sarsa.full':  'SARSA',

      'tier.cliff':     'がけっぷち',
      'tier.at-risk':   'リスクあり',
      'tier.lukewarm':  'なまぬるい',
      'tier.healthy':   'けんぜん',
      'tier.thriving':  'こうちょう',
      'tier.short.cliff':    'がけ',
      'tier.short.at-risk':  'リスク',
      'tier.short.lukewarm': 'なまぬるい',
      'tier.short.healthy':  'けんぜん',
      'tier.short.thriving': 'こうちょう',

      'months.label':     'こうしんまでの つきすう',
      'months.one':       'こうしんまで {n}かげつ',
      'months.many':      'こうしんまで {n}かげつ',
      'months.imminent':  'こうしん まぢか',
      'months.short':     'm={n}',

      'lever.nothing':       'なにもしない',
      'lever.checkin':       'チェックイン',
      'lever.offer':         'おおきな オファー',
      'lever.short.nothing': 'なし',
      'lever.short.checkin': 'チェック',
      'lever.short.offer':   'オファー',
      'lever.cost.nothing':  'むりょう',
      'lever.cost.checkin':  '−1',
      'lever.cost.offer':    '−4',
      'lever.tagline':       '← やすい・じゅどうてき    ·    たかい・こうげきてき →',

      'coin.name':        'いじ コイン',
      'coin.stay':        'のこる',
      'coin.churn':       'はなれる',
      'die.name':         'エンゲージ サイコロ',
      'die.up':           'あがる',
      'die.same':         'そのまま',
      'die.down':         'さがる',

      'terminal.renewed': '✓ こうしん',
      'terminal.churned': '✗ りだつ',
      'terminal.renewed_short': 'こうしん',
      'terminal.churned_short': 'りだつ',
      'terminal.renew_lump': '+20',
      'terminal.churn_lump': '−20',
      'terminal.mini':    '（しゅうりょう）',

      'ledger.title':     'りえき だいちょう',
      'ledger.debit':     'しはらい',
      'ledger.credit':    'にゅうきん',
      'ledger.balance':   'ざんだか',
      'ledger.value_units': 'かちポイント',

      'account.label':    'アカウント',
      'account.engagement': 'エンゲージ',

      'retmap.corner':      'ティア \\ つき',
      'retmap.empty':       '·',
      'retmap.freqTitle':   '{n} じょうたいで えらばれた レバー',
      'retmap.registered':  'とうろく！',
      'retmap.legendStar':  '★ = さいぜんの レバー',
      'retmap.legendEmpty': '· = みじゅうてん',

      'help.title':           'キーボード ショートカット',
      'help.row.arrows':      'シーンを いどう（または シーンないで すすむ）',
      'help.row.down':        'タイプライターの テキストを はやおくり',
      'help.row.n':           'スピーカーノート（こうしの メモ）',
      'help.row.t':           'いろを きりかえ： ライト ↔ CRT',
      'help.row.m':           'おんがく オン / オフ',
      'help.row.esc':         'オーバーレイを とじる',
      'speakerNotes.title':   'スピーカーノート · <kbd>n</kbd>で とじる',
      'speakerNotes.empty':   '（この シーンの メモは まだ ありません）',
    },
  };

  /*, register: merge a fragment's strings into the tables. Later
     registrations win on key collisions (a fragment overrides core only
     if it intentionally redefines a shared key)., */
  function register(bundle) {
    if (!bundle) return;
    for (const lang of ['en', 'jp']) {
      const src = bundle[lang];
      if (!src) continue;
      if (!STRINGS[lang]) STRINGS[lang] = {};
      for (const k in src) {
        if (Object.prototype.hasOwnProperty.call(src, k)) STRINGS[lang][k] = src[k];
      }
    }
  }

  /* Initial language: URL hash override (#lang=jp), else localStorage,
     else 'en'. The hash override is for screenshot-driven testing; it
     also writes back to localStorage so the choice sticks. */
  let lang = 'en';
  const hashMatch = (window.location.hash || '').match(/[#&?]lang=(\w+)/);
  if (hashMatch && (hashMatch[1] === 'en' || hashMatch[1] === 'jp')) {
    lang = hashMatch[1];
  } else {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'jp') lang = stored;
    } catch (e) {}
  }

  const listeners = [];

  function t(key, vars) {
    const table = STRINGS[lang] || STRINGS.en;
    let s = table[key];
    if (s === undefined) {
      s = (STRINGS.en[key] !== undefined) ? STRINGS.en[key] : key;
    }
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
    }
    return s;
  }

  function setLang(next) {
    if (next !== 'en' && next !== 'jp') return;
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    if (document.body) {
      document.body.classList.toggle('lang-jp', lang === 'jp');
      document.body.classList.toggle('lang-en', lang === 'en');
    }
    for (const cb of listeners) {
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

  function applyInitialClass() {
    if (!document.body) return;
    document.body.classList.toggle('lang-jp', lang === 'jp');
    document.body.classList.toggle('lang-en', lang === 'en');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInitialClass);
  } else {
    applyInitialClass();
  }

  window.I18N = {
    get lang() { return lang; },
    t, setLang, onChange, register,
  };
})();

/* i18n CORE for Pipeline Climb: English (default) + Japanese (flavor).
 *
 *   This file holds ONLY the registry machinery plus the SHARED strings
 *   used by the page chrome and common vocabulary:
 *     - topbar (brand, prev/next, theme/lang/music/notes buttons)
 *     - the 13 scene titles (read by main.js via T)
 *     - the 6 concept badge labels (MDP / POLICY / RETURN / Q* / DP / SARSA)
 *     - help / quick-jump / slide-mode / speaker-notes chrome (main.js)
 *     - common MDP vocabulary: rung names, lever names, touch, signed,
 *       lost, die faces (up / stay / down)
 *
 *   Every scene ships its own fragment js/i18n/sceneN.i18n.js that calls
 *   window.I18N.register({ en: {...}, jp: {...} }) to merge its strings in.
 *   English is authoritative; missing jp keys fall back to en, missing en
 *   keys fall back to the literal key so gaps are visible in dev.
 *
 *   Public API:
 *     I18N.lang                 current 'en' | 'jp'
 *     I18N.t(key, vars)         lookup; {var} placeholders filled
 *     I18N.setLang(lang)        change + persist + notify subscribers
 *     I18N.onChange(callback)   subscribe (returns unsubscribe fn)
 *     I18N.register(table)      merge { en:{...}, jp:{...} } into the store
 *
 *   KaTeX-rendered formulas stay in pure LaTeX: symbols cross languages.
 */
(function () {
  const STORAGE_KEY = 'pipeline-climb.lang';

  /* The string store. Scene fragments merge into this via register(). */
  const STRINGS = {
    en: {
      /* ---- topbar ---- */
      'brand':            'SML · PIPELINE',
      'music.on':         '♪ MUSIC ON',
      'music.off':        '♪ MUSIC OFF',
      'lang.toggle':      '日本語',     /* what to switch TO */
      'topbar.prev':      'PREV',
      'topbar.next':      'NEXT',
      'topbar.theme':     'theme',

      /* ---- scene titles (shown in the topbar) ---- */
      'scene.title0':     'PIPELINE CLIMB',
      'scene.title1':     'How it works',
      'scene.title2':     'You run the deal',
      'scene.title3':     'What makes this an MDP?',
      'scene.title4':     'Policy: your playbook',
      'scene.title5':     'The trajectory',
      'scene.title6':     'Return over the deal',
      'scene.title7':     'Q*: the lever scorecard',
      'scene.title8':     'The Bellman equation',
      'scene.title9':     'Filling Q* with DP',
      'scene.title10':    "Why DP doesn't scale",
      'scene.title11':    'SARSA: learn by selling',
      'scene.title12':    'Recap',

      /* ---- concept badges ---- */
      'badge.mdp':        'MDP',
      'badge.policy':     'POL',
      'badge.return':     'RTN',
      'badge.qstar':      'Q*',
      'badge.dp':         'DP',
      'badge.sarsa':      'SAR',
      'badge.mdp.full':     'MDP',
      'badge.policy.full':  'POLICY',
      'badge.return.full':  'RETURN',
      'badge.qstar.full':   'Q*',
      'badge.dp.full':      'DP',
      'badge.sarsa.full':   'SARSA',

      /* ---- common MDP vocabulary ---- */
      'rung.cold':        'COLD',
      'rung.curious':     'CURIOUS',
      'rung.engaged':     'ENGAGED',
      'rung.evaluating':  'EVALUATING',
      'rung.ready':       'READY',

      'lever.nurture':    'NURTURE',
      'lever.demo':       'DEMO',
      'lever.hardclose':  'HARD CLOSE',
      'lever.short.nurture':   'NURTURE',
      'lever.short.demo':      'DEMO',
      'lever.short.hardclose': 'CLOSE',

      'vocab.touch':      'touch',
      'vocab.signed':     'SIGNED',
      'vocab.lost':       'LOST',
      'vocab.deal':       'deal',
      'vocab.lead':       'lead',
      'vocab.rung':       'rung',
      'vocab.lever':      'lever',
      'vocab.die':        'STAGE DIE',

      'die.up':           'UP',
      'die.stay':         'STAY',
      'die.down':         'DOWN',

      /* ---- terminal markers ---- */
      'terminal.signed':  '✓ SIGNED',
      'terminal.lost':    '✗ LOST',
      'terminal.mini':    '(terminal)',

      /* ---- speaker notes overlay (main.js) ---- */
      'speakerNotes.title':   'SPEAKER NOTES',
      'speakerNotes.empty':   'No notes for this scene yet.',

      /* ---- slide mode + quick jump + help (main.js) ---- */
      'slide.toast':      'SLIDE MODE · press F to exit',
      'quickjump.title':  'JUMP TO SCENE',
      'help.title':       'KEYBOARD',
      'help.row.arrows':  'next / previous step or scene',
      'help.row.down':    'advance within a scene',
      'help.row.n':       'speaker notes',
      'help.row.f':       'slide (fullscreen-feel) mode',
      'help.row.g':       'jump to a scene',
      'help.row.help':    'this help',
      'help.row.t':       'toggle theme (paper / CRT)',
      'help.row.m':       'toggle music',
      'help.row.esc':     'close any overlay',
      'help.section.eggs':'EXTRAS',
      'help.row.run':     'add &run to a URL to auto-play a gated scene',
      'help.row.qcell':   'click a Q-cell to inspect a rung',

      /* ---- intro modal (main.js, optional, deferred off the title) ---- */
      'intro.title':      'PIPELINE CLIMB',
      'intro.body':       'A lead climbs from cold to signed across five rungs. Read the situation, pick a lever, watch the die. Use the arrow keys or NEXT to move; press ? for all shortcuts.',
      'intro.ok':         'LET\'S CLIMB',

      /* ---- boot ---- */
      'boot.tag':         'CLASSIC RL',
    },
    jp: {
      /* ---- topbar ---- */
      'brand':            'SML · パイプライン',
      'music.on':         '♪ オン',
      'music.off':        '♪ オフ',
      'lang.toggle':      'EN',
      'topbar.prev':      'もどる',
      'topbar.next':      'つぎ',
      'topbar.theme':     'テーマ',

      /* ---- scene titles ---- */
      'scene.title0':     'パイプライン クライム',
      'scene.title1':     'あそびかた',
      'scene.title2':     'あなたが やる',
      'scene.title3':     'MDP とは？',
      'scene.title4':     'ポリシー： あなたの てじゅん',
      'scene.title5':     'トラジェクトリ',
      'scene.title6':     'リターン',
      'scene.title7':     'Q*： レバーの とくてん',
      'scene.title8':     'ベルマン のしき',
      'scene.title9':     'DP で Q* を うめる',
      'scene.title10':    'なぜ DP は スケール しない？',
      'scene.title11':    'SARSA： うりながら まなぶ',
      'scene.title12':    'おさらい',

      /* ---- concept badges ---- */
      'badge.mdp':        'MDP',
      'badge.policy':     'ポリ',
      'badge.return':     'リタ',
      'badge.qstar':      'Q*',
      'badge.dp':         'DP',
      'badge.sarsa':      'SAR',
      'badge.mdp.full':     'MDP',
      'badge.policy.full':  'ポリシー',
      'badge.return.full':  'リターン',
      'badge.qstar.full':   'Q*',
      'badge.dp.full':      'DP',
      'badge.sarsa.full':   'SARSA',

      /* ---- common MDP vocabulary ---- */
      'rung.cold':        'コールド',
      'rung.curious':     'きょうみ',
      'rung.engaged':     'エンゲージ',
      'rung.evaluating':  'けんとう',
      'rung.ready':       'じゅんび',

      'lever.nurture':    'ナーチャー',
      'lever.demo':       'デモ',
      'lever.hardclose':  'ハードクローズ',
      'lever.short.nurture':   'ナーチャー',
      'lever.short.demo':      'デモ',
      'lever.short.hardclose': 'クローズ',

      'vocab.touch':      'タッチ',
      'vocab.signed':     'サイン',
      'vocab.lost':       'ロスト',
      'vocab.deal':       'とりひき',
      'vocab.lead':       'リード',
      'vocab.rung':       'ステージ',
      'vocab.lever':      'レバー',
      'vocab.die':        'ステージ ダイ',

      'die.up':           'アップ',
      'die.stay':         'ステイ',
      'die.down':         'ダウン',

      /* ---- terminal markers ---- */
      'terminal.signed':  '✓ サイン',
      'terminal.lost':    '✗ ロスト',
      'terminal.mini':    '(しゅうたん)',

      /* ---- speaker notes overlay ---- */
      'speakerNotes.title':   'スピーカー ノート',
      'speakerNotes.empty':   'この シーンの ノートは まだ ない。',

      /* ---- slide mode + quick jump + help ---- */
      'slide.toast':      'スライド モード · F で でる',
      'quickjump.title':  'シーンへ とぶ',
      'help.title':       'キーボード',
      'help.row.arrows':  'つぎ / もどる ステップ または シーン',
      'help.row.down':    'シーン のなかで すすむ',
      'help.row.n':       'スピーカー ノート',
      'help.row.f':       'スライド モード',
      'help.row.g':       'シーンへ とぶ',
      'help.row.help':    'この ヘルプ',
      'help.row.t':       'テーマ 切りかえ',
      'help.row.m':       'ミュージック 切りかえ',
      'help.row.esc':     'オーバーレイを とじる',
      'help.section.eggs':'おまけ',
      'help.row.run':     'URLに &run で シーンを 自動再生',
      'help.row.qcell':   'Qセルを クリックして ステージを みる',

      /* ---- intro modal ---- */
      'intro.title':      'パイプライン クライム',
      'intro.body':       'リードは 5つの ステージを コールドから サインへ のぼる。 じょうきょうを よみ、 レバーを えらび、 ダイを みる。 やじるし か つぎ で すすむ。 ? で ショートカット。',
      'intro.ok':         'のぼろう',

      /* ---- boot ---- */
      'boot.tag':         'CLASSIC RL',
    },
  };

  /* Merge a scene fragment's strings into the store. Shape:
       { en: { 'key': 'value', ... }, jp: { ... } }
     Later registrations win on key collision (last loaded wins), so a
     scene can override a shared key if it really must. */
  function register(table) {
    if (!table) return;
    for (const lang of Object.keys(table)) {
      if (!STRINGS[lang]) STRINGS[lang] = {};
      const src = table[lang] || {};
      for (const k of Object.keys(src)) STRINGS[lang][k] = src[k];
    }
  }

  /* Initial language: URL hash override (#lang=jp), else localStorage,
     else 'en'. The hash override is for screenshot-driven testing. */
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
      /* Fall back to English; if even that's missing, return the key so
         the gap is visible in dev rather than silent. */
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

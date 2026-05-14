/* Simple i18n — English (default) + Japanese ("flavor mode").
 *
 *   Scope, deliberately narrow: the strings that *land* visually in a
 *   Gen-1 Pokemon mood — the title screen, the move menu during battle,
 *   HP-box Pokemon names, the dialog crawl, the topbar scene titles,
 *   and the MDP-overlay heading/captions. The long-form concept-scene
 *   essays and formula captions stay English on purpose — translating
 *   them risks subtle pedagogy drift, and the flavour is already
 *   established by the time the student gets there.
 *
 *   Japanese strings use Gen-1-era hiragana/katakana phrasing (no kanji)
 *   to match the on-screen font of the original GameBoy games. Where the
 *   canonical localisation has a fixed move/Pokemon name, that's what
 *   we use (10まんボルト, ピカチュウ, ヒトカゲ, etc.).
 *
 *   Public API:
 *     I18N.lang                    current 'en' | 'jp'
 *     I18N.t(key, vars)            lookup; {var} placeholders filled
 *     I18N.setLang(lang)           change + persist + notify subscribers
 *     I18N.onChange(callback)      subscribe (returns unsubscribe fn)
 *
 *   Subscribers do the work of re-rendering. main.js owns the
 *   scene-rebuild path; everyone else just re-paints their own labels.
 */
(function () {
  const STORAGE_KEY = 'pokeviz-lang';

  const STRINGS = {
    en: {
      /* ---- topbar ---- */
      'brand':            'SML · POKEMON',
      'music.on':         '♪ MUSIC ON',
      'music.off':        '♪ MUSIC OFF',
      'lang.toggle':      '日本語',          /* what to switch TO */

      /* ---- scene titles (shown in the topbar) ---- */
      'scene.title':      'POKEMON',
      'scene.tutorial':   'Tutorial — how to play',
      'scene.battle':     'A wild CHARMANDER appeared!',
      'scene.mdp':        'What makes this an MDP?',
      'scene.trajectory': 'The trajectory',
      'scene.objective':  'Return & the Q-function',
      'scene.qstar':      'π* from Q',
      'scene.dp':         'Filling Q with DP',
      'scene.whyNotDp':   "Why DP doesn't scale",
      'scene.sarsaDerive':'Deriving SARSA',
      'scene.recap':      "You've trained PIKACHU.",

      /* ---- scene 0 — title screen ---- */
      'title.pokemon':    'POKEMON',
      'title.subtitle':   'A REINFORCEMENT LEARNING ADVENTURE',
      'title.start':      '▶ PRESS START',
      'title.credits':    'SML · ETH ZURICH · CLASSIC RL #7',
      'title.by':         'BY CARLOS COTRINI',

      /* ---- Pokemon display names ---- */
      'pokemon.pikachu':    'PIKACHU',
      'pokemon.charmander': 'CHARMANDER',
      'pokemon.charmeleon': 'CHARMELEON',
      'pokemon.charizard':  'CHARIZARD',
      'pokemon.wild':       'Wild',

      /* ---- move names ---- */
      'move.quick_attack':  'QUICK ATTACK',
      'move.thunderbolt':   'THUNDERBOLT',
      'move.thunder':       'THUNDER',
      'move.ember':         'EMBER',
      'move.flamethrower':  'FLAMETHROWER',
      'move.outrage':       'OUTRAGE',

      /* ---- battle dialog (scene 1) ---- */
      'battle.section_title': 'YOU ARE PIKACHU. PICK A MOVE EACH TURN.',
      'battle.used':          '{name} used {move}!',
      'battle.wild_used':     'Wild {name} used {move}!',
      'battle.missed':        "{name}'s attack missed!",
      'battle.evolving':      'What? Wild {name} is evolving!',
      'battle.evolved_into':  'Evolved into {name}!',
      'battle.fainted':       '{name} fainted!',
      'battle.wild_fainted':  'Wild {name} fainted!',
      'battle.pika_wins':     'PIKACHU wins!',
      'battle.you_lost':      'You lost!',
      'battle.what_now':      'What will PIKACHU do?',
      'battle.opening_wild':  'A wild CHARMANDER appeared!',
      'battle.go_pika':       'Go, PIKACHU!',
      'battle.what_will':     'What will PIKACHU do?',

      /* ---- MDP overlay (scene 3) ---- */
      'mdp.heading':       'WHAT MAKES THIS AN MDP?',
      'mdp.tag.s':         'S — STATE',
      'mdp.tag.a':         'A — ACTION',
      'mdp.tag.p':         'P — TRANSITION FN',
      'mdp.step.0':        'A POKEMON battle is a <b>Markov Decision Process (MDP)</b>. Three ingredients: a state, an action, and a transition function. We\'ll add them one click at a time.',
      'mdp.step.1':        '<b>S — STATE.</b> A state is a pair of two non-negative integers: PIKACHU\'s HP and CHARMANDER\'s HP. Five HP levels each (0 = fainted, 4 = full) → 25 possible states.',
      'mdp.step.2':        '<b>A — ACTION.</b> An action is any move PIKACHU can pick. The action set is <b>A = { QUICK ATTACK, THUNDERBOLT, THUNDER }</b>.',
      'mdp.step.3':        '<b>P — TRANSITION PROBABILITY FUNCTION.</b> P takes a state s and an action a, and outputs a new state s′ and a reward r — written <b>P(s, a) → (s′, r)</b>. It is <em>probabilistic</em>: the same (s, a) can produce different outputs — accuracy rolls and damage rolls give us randomness.',
      'mdp.hint':          'When all three ingredients are on screen, click <kbd>NEXT</kbd> to continue.',
      'mdp.prev':          '◀ PREV',
      'mdp.next':          'NEXT ▶',
      'mdp.step_of':       'STEP <b id="mdp-overlay-i">1</b> / 4',
    },

    jp: {
      'brand':            'SML · ポケモン',
      'music.on':         '♪ おんがく オン',
      'music.off':        '♪ おんがく オフ',
      'lang.toggle':      'ENGLISH',

      'scene.title':      'ポケモン',
      'scene.tutorial':   'チュートリアル — あそびかた',
      'scene.battle':     'やせいの ヒトカゲが あらわれた！',
      'scene.mdp':        'これが MDPなのは なぜ？',
      'scene.trajectory': 'きせき τ',
      'scene.objective':  'リターン と Q かんすう',
      'scene.qstar':      'Qから π*へ',
      'scene.dp':         'DPで Qを うめる',
      'scene.whyNotDp':   'なぜ DPは スケールしない？',
      'scene.sarsaDerive':'SARSAの みちびき',
      'scene.recap':      'ピカチュウは そだった！',

      'title.pokemon':    'ポケモン',
      'title.subtitle':   '〜 きょうかがくしゅう ぼうけん 〜',
      'title.start':      '▶ スタート',
      'title.credits':    'SML · ETH チューリッヒ · CLASSIC RL #7',
      'title.by':         'カルロス コトリーニ',

      'pokemon.pikachu':    'ピカチュウ',
      'pokemon.charmander': 'ヒトカゲ',
      'pokemon.charmeleon': 'リザード',
      'pokemon.charizard':  'リザードン',
      'pokemon.wild':       'やせいの',

      'move.quick_attack':  'でんこうせっか',
      'move.thunderbolt':   '10まんボルト',
      'move.thunder':       'かみなり',
      'move.ember':         'ひのこ',
      'move.flamethrower':  'かえんほうしゃ',
      'move.outrage':       'げきりん',

      'battle.section_title': 'あなたは ピカチュウ。 まいターン わざを えらべ。',
      'battle.used':          '{name}の {move}！',
      'battle.wild_used':     'やせいの {name}の {move}！',
      'battle.missed':        '{name}の こうげきは はずれた！',
      'battle.evolving':      'おや？ やせいの {name}の ようすが......',
      'battle.evolved_into':  '{name}に しんかした！',
      'battle.fainted':       '{name}は たおれた！',
      'battle.wild_fainted':  'やせいの {name}は たおれた！',
      'battle.pika_wins':     'ピカチュウの かち！',
      'battle.you_lost':      'まけて しまった！',
      'battle.what_now':      'ピカチュウは どう する？',
      'battle.opening_wild':  'やせいの ヒトカゲが あらわれた！',
      'battle.go_pika':       'ゆけっ！ ピカチュウ！',
      'battle.what_will':     'ピカチュウは どう する？',

      'mdp.heading':       'これが MDPなのは なぜ？',
      'mdp.tag.s':         'S — じょうたい',
      'mdp.tag.a':         'A — こうどう',
      'mdp.tag.p':         'P — せんいかんすう',
      'mdp.step.0':        'ポケモンの たたかいは <b>マルコフけっていかてい (MDP)</b>。3つの ぶひん：じょうたい、こうどう、せんいかんすう。ひとつずつ ならべて いく。',
      'mdp.step.1':        '<b>S — じょうたい。</b> じょうたいは ふたつの ひふごう せいすうの ペア — ピカチュウの HPと ヒトカゲの HP。 それぞれ 5レベル (0 = ひんし、4 = まんたん) → 25とおりの じょうたい。',
      'mdp.step.2':        '<b>A — こうどう。</b> こうどうは ピカチュウが えらべる わざ。 こうどうの しゅうごう <b>A = { QUICK ATTACK, THUNDERBOLT, THUNDER }</b>。',
      'mdp.step.3':        '<b>P — せんいかくりつかんすう。</b> Pは じょうたい sと こうどう aを うけとり、 あたらしい じょうたい s′と ほうしゅう rを かえす — <b>P(s, a) → (s′, r)</b>。 <em>かくりつてき</em>： おなじ (s, a) でも ちがう けっか が おこりうる — めいちゅう・ダメージの ふれ。',
      'mdp.hint':          '3つの ぶひんが そろったら <kbd>NEXT</kbd>で つぎへ。',
      'mdp.prev':          '◀ もどる',
      'mdp.next':          'つぎへ ▶',
      'mdp.step_of':       'ステップ <b id="mdp-overlay-i">1</b> / 4',
    },
  };

  /* Initial language: URL hash override (#lang=jp), else localStorage,
     else 'en'. The hash override is for screenshot-driven testing — it
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
      /* Fall back to English — if even that's missing, return the key
         literally so the gap is visible in dev rather than silent. */
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
    /* Toggle the <body> class so CSS can switch the font / weight /
       whatever else. Cheap and dependable. */
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

  /* Apply initial body class as soon as the DOM is ready. */
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
    t, setLang, onChange,
  };
})();

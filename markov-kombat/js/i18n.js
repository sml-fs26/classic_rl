/* MARKOV KOMBAT II — i18n.
 *
 *   English only for v1 (per MK-SPEC.md §3.6).  The Japanese flavor
 *   mode that ships in pokemon-battle is intentionally dropped: it
 *   doesn't fit the gritty arcade voice of MK, and we want the demo
 *   to keep voice consistent across every screen.
 *
 *   The same API as the Pokemon viz so call sites don't change:
 *     I18N.lang                  always 'en'
 *     I18N.t(key, vars)          lookup; {var} placeholders filled
 *     I18N.setLang(lang)         no-op kept for source compatibility
 *     I18N.onChange(callback)    subscribe (never fires; kept for shape)
 *
 *   Keys are intentionally identical to the Pokemon viz so we don't
 *   have to chase down every call site.  The values are MK-skinned.
 */
(function () {
  const STRINGS = {
    en: {
      /* ---- topbar ---- */
      'brand':            'SML · MARKOV KOMBAT',
      'music.on':         '♪ MUSIC ON',
      'music.off':        '♪ MUSIC OFF',
      'lang.toggle':      '—',                /* no language switch in MK v1 */

      /* ---- scene titles (shown in the topbar) ---- */
      'scene.title':      'MARKOV KOMBAT II',
      'scene.tutorial':   'Praktice Mode — kombat basiks',
      'scene.battle':     'SUB-OPTIMAL enters the kombat!',
      'scene.mdp':        'Mortal Decision Process',
      'scene.trajectory': 'Replay the karnage',
      'scene.objective':  'The optimal damage',
      'scene.qstar':      'Argmax him',
      'scene.dp':         'Shao Kahn-vergence: value iteration',
      'scene.whyNotDp':   'The outworld is too big',
      'scene.sarsaDerive':'How to train your fighter (SARSA)',
      'scene.recap':      'Kombat League — FLAWLESS POLICY',

      /* ---- scene 0 — title screen ---- */
      'title.pokemon':    'MARKOV KOMBAT II',                  /* key kept for call-site compat */
      'title.subtitle':   'SHAO KAHN-VERGENCE',
      'title.start':      '▶ PRESS START',
      'title.credits':    'SML · ETH ZURICH · CLASSIC RL #8',
      'title.by':         'BY CARLOS COTRINI',

      /* ---- Kombatant display names (keys kept as pokemon.* for
             source-compat; values re-skinned to MK characters) ---- */
      'pokemon.pikachu':    'LIU KANG-MAX',
      'pokemon.charmander': 'SUB-OPTIMAL',
      'pokemon.charmeleon': 'SUB-OPTIMAL (FROST-CRACKED)',
      'pokemon.charizard':  'SUB-OPTIMAL (KHAOS)',
      'pokemon.wild':       'Challenger',

      /* ---- Move names ---- */
      'move.quick_attack':  'GREEDY JAB',
      'move.thunderbolt':   'BELLMAN BACKHAND',
      'move.thunder':       'TD-UPPERCUT',
      'move.ember':         'ICY HOOK',
      'move.flamethrower':  'FROZEN AURA',
      'move.outrage':       'KHAOS RAGE',

      /* ---- Kombat dialog (scene 1) ---- */
      'battle.section_title': 'YOU ARE LIU KANG-MAX. PICK A MOVE EACH TURN.',
      'battle.used':          '{name} unleashed {move}!',
      'battle.wild_used':     'Challenger {name} unleashed {move}!',
      'battle.missed':        "{name}'s strike whiffed!",
      'battle.evolving':      'What? Challenger {name} is transforming!',
      'battle.evolved_into':  '{name} emerged!',
      'battle.fainted':       '{name} is finished!',
      'battle.wild_fainted':  'Challenger {name} is finished!',
      'battle.pika_wins':     'LIU KANG-MAX wins!  OPTIMALITY!',
      'battle.you_lost':      'KOMBAT LOST.',
      'battle.what_now':      'What will LIU KANG-MAX do?',
      'battle.opening_wild':  'Challenger SUB-OPTIMAL enters the kombat!',
      'battle.go_pika':       'KOMBAT!  LIU KANG-MAX, FIGHT!',
      'battle.what_will':     'What will LIU KANG-MAX do?',

      /* ---- MDP overlay (scene 3) ---- */
      'mdp.heading':       'MORTAL DECISION PROCESS',
      'mdp.tag.s':         'S — STATE',
      'mdp.tag.a':         'A — ACTION',
      'mdp.tag.p':         'P — TRANSITION FN',
      'mdp.step.0':        'Every kombat is a <b>Markov Decision Process (MDP)</b>. Three ingredients: a state, an action, and a transition function. We\'ll add them one click at a time.',
      'mdp.step.1':        '<b>S — STATE.</b> A state is a pair of two non-negative integers: LIU KANG-MAX\'s HP and SUB-OPTIMAL\'s HP. Five HP levels each (0 = finished, 4 = full) → 25 possible states.',
      'mdp.step.2':        '<b>A — ACTION.</b> An action is any move LIU KANG-MAX can pick. The action set is <b>A = { GREEDY JAB, BELLMAN BACKHAND, TD-UPPERCUT }</b>.',
      'mdp.step.3':        '<b>P — TRANSITION PROBABILITY FUNCTION.</b> P takes a state s and an action a, and outputs a new state s′ and a reward r — written <b>P(s, a) → (s′, r)</b>. It is <em>probabilistic</em>: the same (s, a) can produce different outputs — accuracy rolls and damage rolls give us randomness.',
      'mdp.hint':          'When all three ingredients are on screen, click <kbd>NEXT</kbd> to continue.',
      'mdp.prev':          '◀ PREV',
      'mdp.next':          'NEXT ▶',
      'mdp.step_of':       'STEP <b id="mdp-overlay-i">1</b> / 4',
    },
  };

  /* No lang switching in MK v1 — kept callable for source compat. */
  let lang = 'en';
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

  function setLang(_next) { /* no-op in MK v1 */ }
  function onChange(cb) {
    listeners.push(cb);
    return function unsubscribe() {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  /* Body class kept so any CSS that gates on `.lang-en` still wins. */
  function applyInitialClass() {
    if (!document.body) return;
    document.body.classList.add('lang-en');
    document.body.classList.remove('lang-jp');
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

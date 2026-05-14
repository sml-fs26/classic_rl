/* Click-step scene engine for the Pokemon battle integrative review.

   7 scenes, 0-indexed. Lifted from snakes-ladders/js/main.js.
   Scene 1 is the optional "How to play" tutorial; the battle, value
   iteration, SARSA, and recap sit at indices 2-6 (keys
   scene1-scene5 kept stable for deep-link survival).
   Each scene file at js/scenes/sceneN.js registers
     window.scenes.sceneN = function(root) { return { onEnter?, onLeave?, onNextKey?, onPrevKey? }; };
   onNextKey / onPrevKey return true to consume the keystroke (advance internal
   step inside the scene, e.g. step the action history forward), false to let
   the driver advance the scene. */
(function () {
  /* Each entry has an i18n key (titleKey) used to look up the visible
     title on each render. The literal `title` is kept as a fallback for
     builds without i18n loaded. */
  const SCENES = [
    { key: 'scene0',           titleKey: 'scene.title',       title: 'POKEMON',                      music: 'title'    },
    { key: 'sceneHowToPlay',   titleKey: 'scene.tutorial',    title: 'Tutorial — how to play',       music: 'tutorial' },
    { key: 'scene1',           titleKey: 'scene.battle',      title: 'A wild CHARMANDER appeared!',  music: 'battle'   },
    { key: 'sceneMdpOverlay',  titleKey: 'scene.mdp',         title: 'What makes this an MDP?',      music: 'title'    },
    { key: 'sceneTrajectory',  titleKey: 'scene.trajectory',  title: 'The trajectory',               music: 'concept'  },
    { key: 'sceneObjective',   titleKey: 'scene.objective',   title: 'Return & the Q-function',      music: 'concept'  },
    { key: 'sceneQstar',       titleKey: 'scene.qstar',       title: 'π* from Q',                    music: 'concept'  },
    { key: 'sceneDp',          titleKey: 'scene.dp',          title: 'Filling Q with DP',            music: 'dp'       },
    { key: 'sceneWhyNotDp',    titleKey: 'scene.whyNotDp',    title: "Why DP doesn't scale",         music: 'bridge'   },
    { key: 'sceneSarsaDerive', titleKey: 'scene.sarsaDerive', title: 'Deriving SARSA',               music: 'bridge'   },
    { key: 'scene5',           titleKey: 'scene.recap',       title: "You've trained PIKACHU.",      music: 'recap'    },
  ];
  function titleAt(idx) {
    const s = SCENES[idx];
    if (!s) return '';
    return (window.I18N ? window.I18N.t(s.titleKey) : s.title);
  }
  /* Kept for any older call sites; reads live via titleAt. */
  const SCENE_TITLES = new Proxy({}, {
    get(_, k) {
      if (k === 'length') return SCENES.length;
      const i = Number(k);
      return Number.isInteger(i) ? titleAt(i) : undefined;
    },
  });

  const sceneNodes = [];
  const sceneState = [];
  let current = -1;

  function readHashScene() {
    const m = (window.location.hash || '').match(/[#&?]scene=(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n >= 0 && n < SCENE_TITLES.length ? n : null;
  }

  function syncHash(idx) {
    const cur = window.location.hash || '';
    const m = cur.match(/[#&?]scene=(\d+)/);
    let next;
    if (m) {
      next = cur.replace(/([#&?])scene=\d+/, `$1scene=${idx}`);
    } else if (cur.length > 1) {
      next = cur + `&scene=${idx}`;
    } else {
      next = `#scene=${idx}`;
    }
    if (next !== cur) history.replaceState(null, '', next);
  }

  function updateDots(idx) {
    const dots = document.querySelectorAll('.dot-pager .dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
  }

  function updateButtons(idx) {
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= SCENE_TITLES.length - 1;
  }

  function updateTitle(idx) {
    const el = document.getElementById('scene-title');
    if (el) el.textContent = SCENE_TITLES[idx];
  }

  function goTo(idx) {
    if (idx < 0 || idx >= SCENE_TITLES.length) return;
    if (idx === current) {
      syncHash(idx);
      return;
    }

    if (current >= 0) {
      const old = sceneNodes[current];
      if (old) old.classList.remove('active');
      const oldState = sceneState[current];
      if (oldState && typeof oldState.onLeave === 'function') {
        try { oldState.onLeave(); } catch (e) { console.error(e); }
      }
    }

    const stage = document.getElementById('stage');
    if (!sceneNodes[idx]) {
      const node = document.createElement('div');
      node.className = 'scene';
      node.dataset.scene = String(idx);
      stage.appendChild(node);
      sceneNodes[idx] = node;
      const builder = window.scenes && window.scenes[SCENES[idx].key];
      if (builder) {
        try {
          sceneState[idx] = builder(node) || {};
        } catch (e) {
          console.error('Scene builder failed:', e);
          node.innerHTML = `<p style="opacity:0.5">Scene ${idx} failed to build: ${e && e.message}</p>`;
          sceneState[idx] = {};
        }
      } else {
        node.innerHTML = `<p style="opacity:0.5">Scene ${idx} not yet implemented.</p>`;
        sceneState[idx] = {};
      }
    } else {
      const st = sceneState[idx];
      if (st && typeof st.onEnter === 'function') {
        try { st.onEnter(); } catch (e) { console.error(e); }
      }
    }

    current = idx;
    /* Cross-fade the soundtrack to this scene's mood. Safe if Music
       isn't loaded yet or the AudioContext is suspended — setTrack
       just updates the variable in that case. */
    if (window.Music && SCENES[idx].music) {
      try { window.Music.setTrack(SCENES[idx].music); } catch (e) {}
    }
    const instant = /[#&?]instant\b/.test(window.location.hash);
    if (instant) {
      sceneNodes[idx].style.transition = 'none';
      sceneNodes[idx].classList.add('active');
    } else {
      setTimeout(() => sceneNodes[idx].classList.add('active'), 20);
    }
    updateDots(idx);
    updateButtons(idx);
    updateTitle(idx);
    syncHash(idx);
  }

  function init() {
    if (!window.DATA) {
      console.error('DATA missing -- did data/datasets.js load?');
    }

    const pager = document.getElementById('dot-pager');
    if (pager) {
      for (let i = 0; i < SCENE_TITLES.length; i++) {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to scene ${i}`);
        dot.addEventListener('click', () => { cursorBlip(); goTo(i); });
        pager.appendChild(dot);
      }
    }

    function cursorBlip() { if (window.SFX) window.SFX.play('cursor'); }

    /* Delegated cursor-blip for every scene control button (.poke-btn) —
       STEP / RUN ALL / RESET / NEXT TRANSITION / REROLL / CLEAR q / etc.
       The pager-btn/dot buttons fire cursorBlip directly above so they
       are not double-handled. */
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('poke-btn') && !t.disabled) {
        cursorBlip();
      }
    });

    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.addEventListener('click', () => { cursorBlip(); goTo(current - 1); });
    if (next) next.addEventListener('click', () => { cursorBlip(); goTo(current + 1); });

    window.addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const st = sceneState[current];
      if (e.key === 'ArrowRight') {
        cursorBlip();
        const handled = st && typeof st.onNextKey === 'function' && st.onNextKey();
        if (!handled) goTo(current + 1);
      } else if (e.key === 'ArrowLeft') {
        cursorBlip();
        const handled = st && typeof st.onPrevKey === 'function' && st.onPrevKey();
        if (!handled) goTo(current - 1);
      }
    });

    window.addEventListener('hashchange', () => {
      const n = readHashScene();
      if (n != null) goTo(n);
    });

    const initialScene = readHashScene();
    goTo(initialScene != null ? initialScene : 0);

    /* Language toggle: rebuild every cached scene so the new strings
       take effect. Scenes that were never visited rebuild lazily on
       first visit (they read I18N.t() at build time). */
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => { rebuildAll(); });
    }
  }

  /* Drop every cached scene DOM + state and re-build the current scene
     from scratch. Used by the language toggle. The cached scenes are
     in the wrong language and would surface stale text the next time
     the user navigates to one — clearing them forces a fresh build. */
  function rebuildAll() {
    for (let i = 0; i < sceneNodes.length; i++) {
      const node = sceneNodes[i];
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }
    sceneNodes.length = 0;
    sceneState.length = 0;
    const c = current;
    current = -1;
    if (c >= 0) goTo(c);
  }

  if (!window.scenes) window.scenes = {};

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PokeViz = {
    goTo, getCurrentScene: () => current, sceneTitles: SCENE_TITLES,
    rebuildAll,
  };
})();

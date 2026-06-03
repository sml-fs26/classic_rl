/* Click-step scene engine for Last-Minute Pricing.
 *
 *   12 scenes, 0-indexed, the canonical RL arc (the title scene was retired,
 *   so the run opens straight on the tutorial):
 *     0 tutorial · 1 playtest · 2 formalization (MDP) · 3 policy ·
 *     4 trajectory · 5 return G_t · 6 Q* · 7 Bellman · 8 DP ·
 *     9 why-DP-fails · 10 SARSA · 11 recap.
 *
 *   The array index drives the pager/hash; the per-scene `key` (sceneN) is
 *   decoupled from it, so the scene*files* keep their historical names.
 *
 *   Each scene file at js/scenes/sceneN.js registers
 *     window.scenes.sceneN = function(root){ return { onEnter?, onLeave?, onNextKey?, onPrevKey? }; };
 *   onNextKey / onPrevKey return true to CONSUME the keystroke (advance a step
 *   inside the scene), false to let the driver advance the scene.
 *
 *   Cold entry must work: a scene reconstructs itself from window.DATA /
 *   window.Pricing and never depends on a prior scene having run.
 *
 *   Hash routing #scene=N is provided here (+ &run passthrough, &instant,
 *   #theme=, #lang= handled by theme.js / i18n.js).
 *
 *   Exposed as window.PriceViz (aliased to window.PokeViz for the reused
 *   i18n-ui.js chrome, which calls PokeViz.rebuildAll on a language flip). */
(function () {
  /* titleKey is looked up live on each render via I18N; `title` is a
     fallback for builds without i18n. `music` is the soundtrack mood. */
  const SCENES = [
    { key: 'scene1',  titleKey: 'scene1.title',  title: 'How to read the shelf',         music: 'tutorial' },
    { key: 'scene2',  titleKey: 'scene2.title',  title: 'You run the shelf',             music: 'battle'   },
    { key: 'scene3',  titleKey: 'scene3.title',  title: 'What makes this an MDP?',        music: 'concept'  },
    { key: 'scene4',  titleKey: 'scene4.title',  title: 'A policy is a playbook',         music: 'concept'  },
    { key: 'scene5',  titleKey: 'scene5.title',  title: 'The trajectory',                music: 'concept'  },
    { key: 'scene6',  titleKey: 'scene6.title',  title: 'Return to the deadline',         music: 'concept'  },
    { key: 'scene7',  titleKey: 'scene7.title',  title: 'The value of a lever, Q*',       music: 'discover' },
    { key: 'scene8',  titleKey: 'scene8.title',  title: 'Bellman: today vs tomorrow',     music: 'discover' },
    { key: 'scene9',  titleKey: 'scene9.title',  title: 'Fill Q* by dynamic programming', music: 'dp'       },
    { key: 'scene10', titleKey: 'scene10.title', title: 'Why DP does not scale',          music: 'bridge'   },
    { key: 'scene11', titleKey: 'scene11.title', title: 'Learn the playbook with SARSA',  music: 'sarsa'    },
    { key: 'scene12', titleKey: 'scene12.title', title: 'You have learned the bones',     music: 'champion' },
  ];

  function titleAt(idx) {
    const s = SCENES[idx];
    if (!s) return '';
    return (window.I18N ? window.I18N.t(s.titleKey) : s.title);
  }
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

  /* &run passthrough: scenes read window.PRICING_AUTORUN to auto-trigger
     their primary button for headless capture. Never auto-runs otherwise. */
  window.PRICING_AUTORUN = /[#&?]run\b/.test(window.location.hash || '');

  function readHashScene() {
    const m = (window.location.hash || '').match(/[#&?]scene=(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n >= 0 && n < SCENES.length ? n : null;
  }

  function syncHash(idx) {
    const cur = window.location.hash || '';
    const m = cur.match(/[#&?]scene=(\d+)/);
    let next;
    if (m) next = cur.replace(/([#&?])scene=\d+/, `$1scene=${idx}`);
    else if (cur.length > 1) next = cur + `&scene=${idx}`;
    else next = `#scene=${idx}`;
    if (next !== cur) history.replaceState(null, '', next);
  }

  function updateDots(idx) {
    document.querySelectorAll('.dot-pager .dot').forEach((dot, i) =>
      dot.classList.toggle('active', i === idx));
  }
  function updateButtons(idx) {
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= SCENES.length - 1;
  }
  function updateTitle(idx) {
    const el = document.getElementById('scene-title');
    if (el) el.textContent = SCENE_TITLES[idx];
  }

  function goTo(idx) {
    if (idx < 0 || idx >= SCENES.length) return;
    if (idx === current) { syncHash(idx); return; }

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
        try { sceneState[idx] = builder(node) || {}; }
        catch (e) {
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

    /* Guard: some scene builders overwrite root.className (e.g.
       root.className = 'scene-pad ...'), clobbering the engine's 'scene'
       class. That drops the node out of the absolute/opacity overlay so
       scenes render in normal flow and stack. Re-assert it. */
    if (sceneNodes[idx]) sceneNodes[idx].classList.add('scene');

    current = idx;
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
    window.dispatchEvent(new CustomEvent('scene-change', { detail: { idx: idx, key: SCENES[idx].key } }));
  }

  /* I18N helper — falls back to the literal key when i18n hasn't loaded. */
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  function cursorBlip() { if (window.SFX) window.SFX.play('cursor'); }

  function init() {
    if (!window.DATA) console.error('DATA missing -- did data/datasets.js load?');

    /* ---- Dot pager ---- */
    const pager = document.getElementById('dot-pager');
    if (pager) {
      for (let i = 0; i < SCENES.length; i++) {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to scene ${i}`);
        dot.addEventListener('click', () => { cursorBlip(); goTo(i); });
        pager.appendChild(dot);
      }
    }

    /* Delegated cursor-blip for scene control buttons (.poke-btn). */
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('poke-btn') && !t.disabled) cursorBlip();
    });

    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    /* Tappable PREV/NEXT delegate to the scene's internal step engine
       first (same as the arrow keys), then advance the scene. Without
       this, mobile users (no arrow keys) could not step through the
       tutorial, the SARSA pager, or the DP stepper. */
    if (prev) prev.addEventListener('click', () => {
      cursorBlip();
      const st = sceneState[current];
      const handled = st && typeof st.onPrevKey === 'function' && st.onPrevKey();
      if (!handled) goTo(current - 1);
    });
    if (next) next.addEventListener('click', () => {
      cursorBlip();
      const st = sceneState[current];
      const handled = st && typeof st.onNextKey === 'function' && st.onNextKey();
      if (!handled) goTo(current + 1);
    });

    /* ---- Concept badges (in-memory, lit on reaching the relevant scene) ----
       Order: MDP POLICY RETURN Q* DP SARSA. No persistence (a fresh session
       starts dark); reaching scene N lights its badge. */
    const BADGE_FOR_SCENE = {
      scene3:  'mdp',
      scene4:  'policy',
      scene6:  'return',
      scene7:  'qstar',
      scene9:  'dp',
      scene11: 'sarsa',
    };
    const BADGE_ORDER = ['mdp', 'policy', 'return', 'qstar', 'dp', 'sarsa'];
    const BADGE_LABEL_KEY = {
      mdp: 'badge.mdp', policy: 'badge.policy', return: 'badge.return',
      qstar: 'badge.qstar', dp: 'badge.dp', sarsa: 'badge.sarsa',
    };
    const earnedBadges = {};
    function renderBadgeRow() {
      const row = document.getElementById('concept-badges');
      if (!row) return;
      let html = '';
      for (const k of BADGE_ORDER) {
        const got = !!earnedBadges[k];
        html += '<span class="concept-badge ' + k + (got ? ' earned' : '') + '" title="' + k.toUpperCase() + '">' +
                  T(BADGE_LABEL_KEY[k]) +
                '</span>';
      }
      row.innerHTML = html;
    }
    function maybeAwardBadge(sceneKey) {
      const badge = BADGE_FOR_SCENE[sceneKey];
      if (!badge || earnedBadges[badge]) return;
      earnedBadges[badge] = true;
      renderBadgeRow();
      if (window.SFX) window.SFX.play('cursor');
      const el = document.querySelector('.concept-badge.' + badge);
      if (el) { el.classList.add('flashing'); setTimeout(() => el.classList.remove('flashing'), 1200); }
    }
    renderBadgeRow();
    window.addEventListener('scene-change', (e) => {
      const key = (e.detail && e.detail.key) || (SCENES[current] && SCENES[current].key);
      maybeAwardBadge(key);
    });

    /* ---- Speaker-notes overlay (lecturer crib), toggled by `n` ---- */
    const snOverlay = document.createElement('div');
    snOverlay.id = 'speaker-notes-overlay';
    snOverlay.className = 'speaker-notes-overlay';
    snOverlay.hidden = true;
    snOverlay.innerHTML =
      '<div class="speaker-notes-card">' +
        '<div class="speaker-notes-title">' + T('speakerNotes.title') + '</div>' +
        '<div class="speaker-notes-content" id="speaker-notes-content"></div>' +
      '</div>';
    document.body.appendChild(snOverlay);
    let snVisible = false;
    function refreshSpeakerNotes() {
      const key = SCENES[current] && SCENES[current].key;
      const html = (window.SpeakerNotes && window.SpeakerNotes.getNotes(key)) || ('<em>' + T('speakerNotes.empty') + '</em>');
      const target = document.getElementById('speaker-notes-content');
      if (target) target.innerHTML = html;
      const titleEl = snOverlay.querySelector('.speaker-notes-title');
      if (titleEl) titleEl.innerHTML = T('speakerNotes.title');
    }
    function toggleSpeakerNotes() {
      snVisible = !snVisible;
      if (snVisible) { refreshSpeakerNotes(); snOverlay.hidden = false; }
      else snOverlay.hidden = true;
    }

    /* ---- Key handling: arrows (delegate to scene), n, m. theme.js owns `t`. ---- */
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
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        toggleSpeakerNotes();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const musicBtn = document.getElementById('music-toggle');
        if (musicBtn) musicBtn.click();
      } else if (e.key === 'Escape') {
        if (snVisible) toggleSpeakerNotes();
      }
    });

    window.addEventListener('scene-change', () => { if (snVisible) refreshSpeakerNotes(); });

    window.addEventListener('hashchange', () => {
      const n = readHashScene();
      if (n != null) goTo(n);
    });

    const initialScene = readHashScene();
    goTo(initialScene != null ? initialScene : 0);

    /* Language toggle: rebuild every cached scene so new strings take effect.
       i18n-ui.js calls PokeViz.rebuildAll() on a flip; we also subscribe here
       so a programmatic setLang still repaints. */
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => { renderBadgeRow(); rebuildAll(); });
    }
  }

  /* Drop every cached scene DOM + state and rebuild the current scene from
     scratch (used by the language toggle — cached scenes hold stale text). */
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

  window.PriceViz = {
    goTo, getCurrentScene: () => current, sceneTitles: SCENE_TITLES, rebuildAll,
    SCENES: SCENES,
  };
  /* Alias for the reused chrome (i18n-ui.js checks window.PokeViz). */
  window.PokeViz = window.PriceViz;
})();

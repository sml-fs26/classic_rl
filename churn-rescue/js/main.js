/* Click-step scene engine for the Churn Rescue integrative review.
 *
 *   13 scenes, 0-indexed (scene0..scene12), the canonical RL arc:
 *     0 title  1 tutorial  2 playtest  3 MDP  4 policy  5 trajectory
 *     6 return  7 Q*  8 Bellman  9 DP  10 why-not-DP  11 SARSA  12 recap
 *
 *   Each scene file at js/scenes/sceneN.js registers
 *     window.scenes.sceneN = function(root) {
 *       return { onEnter?, onLeave?, onNextKey?, onPrevKey? };
 *     };
 *   onNextKey / onPrevKey return true to CONSUME the arrow key (advance an
 *   internal step inside the scene), false/undefined to let the driver
 *   advance to the next/previous scene.
 *
 *   Public surface (window.ChurnViz):
 *     goTo(idx), getCurrentScene(), sceneTitles (proxy), rebuildAll()
 *
 *   Routing: #scene=N is mandatory and authoritative; hashchange re-routes.
 *   &run is a global flag scenes read to auto-trigger their primary button
 *   for headless capture; the driver never auto-advances on a bare onEnter.
 */
(function () {
  /* titleKey is looked up live via I18N each render; `title` is the
     offline fallback. `music` cross-fades the soundtrack mood. */
  const SCENES = [
    { key: 'scene0',  titleKey: 'scene.title0',  title: 'CHURN RESCUE',                 music: 'title'    },
    { key: 'scene1',  titleKey: 'scene.title1',  title: 'Tutorial: how to play',        music: 'tutorial' },
    { key: 'scene2',  titleKey: 'scene.title2',  title: 'Playtest: you run it',         music: 'boss'     },
    { key: 'scene3',  titleKey: 'scene.title3',  title: 'What makes this an MDP?',       music: 'title'    },
    { key: 'scene4',  titleKey: 'scene.title4',  title: 'Policy: your playbook',         music: 'concept'  },
    { key: 'scene5',  titleKey: 'scene.title5',  title: 'The trajectory',                music: 'concept'  },
    { key: 'scene6',  titleKey: 'scene.title6',  title: 'Return: the whole-horizon score', music: 'concept' },
    { key: 'scene7',  titleKey: 'scene.title7',  title: 'Q*: value of a lever',          music: 'discover' },
    { key: 'scene8',  titleKey: 'scene.title8',  title: 'Bellman optimality',            music: 'concept'  },
    { key: 'scene9',  titleKey: 'scene.title9',  title: 'Dynamic programming: fill Q*',  music: 'dp'       },
    { key: 'scene10', titleKey: 'scene.title10', title: "Why DP doesn't scale",          music: 'bridge'   },
    { key: 'scene11', titleKey: 'scene.title11', title: 'SARSA: learn by playing',       music: 'sarsa'    },
    { key: 'scene12', titleKey: 'scene.title12', title: 'Recap',                         music: 'champion' },
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

  /*, Hash routing, */
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

    /* Guard: re-assert the engine's 'scene' class in case a builder
       overwrote root.className, which would drop the node out of the
       absolute/opacity overlay and stack scenes. */
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
    window.dispatchEvent(new CustomEvent('scene-change', { detail: { idx, key: SCENES[idx].key } }));
  }

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /*, Concept badges ----------
     One chip per concept scene; lights up on first visit, persisted to
     localStorage. Order: MDP, POLICY, RETURN, Q*, DP, SARSA. */
  const BADGES = ['mdp', 'policy', 'return', 'qstar', 'dp', 'sarsa'];
  const BADGE_SCENE_KEY = {
    scene3:  'mdp',
    scene4:  'policy',
    scene6:  'return',
    scene7:  'qstar',
    scene9:  'dp',
    scene11: 'sarsa',
  };
  const BADGE_STORE = 'churnviz.badges';
  function loadBadges() {
    try { return JSON.parse(localStorage.getItem(BADGE_STORE) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveBadges(b) { try { localStorage.setItem(BADGE_STORE, JSON.stringify(b)); } catch (e) {} }
  let earned = loadBadges();
  function renderBadgeRow() {
    const row = document.getElementById('concept-badges');
    if (!row) return;
    let html = '';
    for (const k of BADGES) {
      const got = !!earned[k];
      html += '<span class="concept-badge badge-' + k + (got ? ' earned' : '') +
                '" title="' + T('badge.' + k + '.full') + '">' +
                '<span class="concept-badge-label">' + T('badge.' + k) + '</span></span>';
    }
    row.innerHTML = html;
  }
  function maybeAwardBadge(sceneKey) {
    const badge = BADGE_SCENE_KEY[sceneKey];
    if (!badge || earned[badge]) return;
    earned[badge] = Date.now();
    saveBadges(earned);
    renderBadgeRow();
    if (window.SFX) window.SFX.play('cursor');
    const el = document.querySelector('.concept-badge.badge-' + badge);
    if (el) {
      el.classList.add('flashing');
      setTimeout(() => el.classList.remove('flashing'), 1200);
    }
  }

  function init() {
    if (!window.DATA) console.error('DATA missing, did data/datasets.js load?');

    function cursorBlip() { if (window.SFX) window.SFX.play('cursor'); }

    /* Dot pager. */
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

    /* Delegated cursor blip for any scene control button (.poke-btn). */
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('poke-btn') && !t.disabled) cursorBlip();
    });

    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    /* Tappable PREV/NEXT delegate to the scene's step engine first (like
       the arrow keys), so mobile users with no arrow keys can step the
       tutorial / SARSA pager / DP stepper. */
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

    renderBadgeRow();
    window.addEventListener('scene-change', (e) => {
      const key = (e.detail && e.detail.key) || (SCENES[current] && SCENES[current].key);
      maybeAwardBadge(key);
    });

    /* Speaker-notes overlay, toggled by `n`. Lives outside the scene flow. */
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
      const html = (window.SpeakerNotes && window.SpeakerNotes.getNotes(key)) ||
        ('<em>' + T('speakerNotes.empty') + '</em>');
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

    /* Keyboard: arrows (with scene consume hook), n = notes, esc = close. */
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

    /* Optional one-time intro modal, deferred OFF the title screen so the
       first impression isn't interrupted. Shows once the user advances
       past scene 0. Suppressed under &run / &skipboot for headless. */
    const INTRO_STORE = 'churnviz.intro-seen';
    function introSeen() { try { return !!localStorage.getItem(INTRO_STORE); } catch (e) { return false; } }
    function markIntroSeen() { try { localStorage.setItem(INTRO_STORE, '1'); } catch (e) {} }
    let introAsked = false;
    function maybeShowIntro() {
      if (introAsked || introSeen()) return;
      if (/[#&?](run|skipboot)\b/.test(window.location.hash)) { markIntroSeen(); return; }
      introAsked = true;
      const modal = document.createElement('div');
      modal.className = 'intro-modal';
      modal.innerHTML =
        '<div class="intro-card">' +
          '<div class="intro-title">' + T('scene.title0') + '</div>' +
          '<div class="intro-body">' + T('scene0.hook') + '</div>' +
          '<button class="poke-btn intro-ok" type="button">' + T('topbar.next') + '</button>' +
        '</div>';
      document.body.appendChild(modal);
      const close = () => { markIntroSeen(); try { modal.remove(); } catch (e) {} };
      modal.querySelector('.intro-ok').addEventListener('click', close);
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }
    window.addEventListener('scene-change', (e) => {
      const idx = e.detail && typeof e.detail.idx === 'number' ? e.detail.idx : -1;
      if (idx > 0) maybeShowIntro();
    });

    /* Hash re-routing. */
    window.addEventListener('hashchange', () => {
      const n = readHashScene();
      if (n != null) goTo(n);
    });

    /* Boot: route to the hash scene (or 0). */
    const initialScene = readHashScene();
    goTo(initialScene != null ? initialScene : 0);

    /* Language toggle rebuilds every cached scene (they read I18N.t at
       build time, so stale text would surface on next navigation). */
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => { renderBadgeRow(); rebuildAll(); });
    }
  }

  /* Drop every cached scene DOM + state and rebuild the current scene. */
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

  window.ChurnViz = {
    goTo, getCurrentScene: () => current, sceneTitles: SCENE_TITLES, rebuildAll,
  };
})();

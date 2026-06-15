/* Click-step scene engine for the Recycling Robot.
 *
 *   13 scenes, 0-indexed. Each scene file at js/scenes/sceneN.js registers
 *     window.scenes.sceneN = function (root) {
 *       // build DOM into root
 *       return { onEnter?, onLeave?, onNextKey?, onPrevKey? };
 *     };
 *   onNextKey / onPrevKey return true to CONSUME the keystroke (advance an
 *   internal step inside the scene), false to let the driver advance the scene.
 *   Cold entry must work: a scene reconstructs from window.DATA / window.Robot,
 *   so deep-linking #scene=N lands correctly.
 *
 *   Hash routing: #scene=N is bidirectional (hashchange). &run is a global flag
 *   (window.RR.run) animation scenes read to auto-trigger their primary button
 *   for headless capture; it must NOT auto-run on plain onEnter. &instant
 *   disables the fade.
 *
 *   Concept badges (MDP, POLICY, RETURN, Q*, DP, TD) light up on first reaching
 *   the scene that teaches them. */
(function () {
  const SCENES = [
    { key: 'scene0',  titleKey: 'scene0.title',  title: 'Recycling Robot',          music: 'title'    },
    { key: 'scene1',  titleKey: 'scene1.title',  title: 'How to play',              music: 'tutorial' },
    { key: 'scene2',  titleKey: 'scene2.title',  title: 'You run it',               music: 'boss'     },
    { key: 'scene3',  titleKey: 'scene3.title',  title: 'What makes this an MDP?',  music: 'concept'  },
    { key: 'scene4',  titleKey: 'scene4.title',  title: 'Policy',                   music: 'concept'  },
    { key: 'scene5',  titleKey: 'scene5.title',  title: 'Trajectory',              music: 'concept'  },
    { key: 'scene6',  titleKey: 'scene6.title',  title: 'Return',                   music: 'concept'  },
    { key: 'scene7',  titleKey: 'scene7.title',  title: 'Optimal action-value Q*',  music: 'discover' },
    { key: 'scene8',  titleKey: 'scene8.title',  title: 'Bellman optimality',       music: 'dp'       },
    { key: 'scene9',  titleKey: 'scene9.title',  title: 'Dynamic programming',      music: 'dp'       },
    { key: 'scene10', titleKey: 'scene10.title', title: 'Why DP does not scale',    music: 'bridge'   },
    { key: 'scene11', titleKey: 'scene11.title', title: 'SARSA vs Q-learning',      music: 'sarsa'    },
    { key: 'scene12', titleKey: 'scene12.title', title: 'Recap',                    music: 'champion' },
  ];

  const BADGE_AT_SCENE = { 3: 'mdp', 4: 'policy', 6: 'return', 7: 'qstar', 9: 'dp', 11: 'sarsa' };
  const BADGE_ORDER = ['mdp', 'policy', 'return', 'qstar', 'dp', 'sarsa'];
  const BADGE_LABEL_KEY = {
    mdp: 'badge.mdp', policy: 'badge.policy', return: 'badge.return',
    qstar: 'badge.qstar', dp: 'badge.dp', sarsa: 'badge.sarsa',
  };
  const BADGE_STORE_KEY = 'rr-badges';

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  function titleAt(idx) {
    const s = SCENES[idx];
    if (!s) return '';
    return (window.I18N ? window.I18N.t(s.titleKey) : s.title) || s.title;
  }

  const sceneNodes = [];
  const sceneState = [];
  let current = -1;

  const RUN = /[#&?]run\b/.test(window.location.hash || '');

  function loadBadges() {
    try { const raw = localStorage.getItem(BADGE_STORE_KEY); if (raw) return JSON.parse(raw); } catch (_e) {}
    return {};
  }
  let earnedBadges = loadBadges();
  function saveBadges() { try { localStorage.setItem(BADGE_STORE_KEY, JSON.stringify(earnedBadges)); } catch (_e) {} }

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
    document.querySelectorAll('.dot-pager .dot').forEach((dot, i) => dot.classList.toggle('active', i === idx));
  }
  function updateButtons(idx) {
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= SCENES.length - 1;
  }
  function updateTitle(idx) {
    const el = document.getElementById('scene-title');
    if (el) el.textContent = titleAt(idx);
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
      if (st && typeof st.onEnter === 'function') { try { st.onEnter(); } catch (e) { console.error(e); } }
    }

    if (sceneNodes[idx]) sceneNodes[idx].classList.add('scene');

    current = idx;
    if (window.Music && SCENES[idx].music) {
      try { window.Music.setTrack(SCENES[idx].music); } catch (_e) {}
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

  function init() {
    if (!window.DATA) console.error('DATA missing, did data/datasets.js load?');

    function cursorBlip() { if (window.SFX) window.SFX.play('cursor'); }

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

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && (t.classList.contains('rr-btn') || t.classList.contains('poke-btn') || t.classList.contains('gr-btn')) && !t.disabled) cursorBlip();
    });

    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
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

    /*, Concept badges, */
    function renderBadgeRow() {
      const row = document.getElementById('concept-badges');
      if (!row) return;
      let html = '';
      for (const k of BADGE_ORDER) {
        const got = !!earnedBadges[k];
        html += '<span class="concept-badge ' + k + (got ? ' earned' : '') + '" title="' + k.toUpperCase() + '">' +
                  '<span class="concept-badge-label">' + T(BADGE_LABEL_KEY[k]) + '</span></span>';
      }
      row.innerHTML = html;
    }
    function maybeAwardBadge(idx) {
      const badge = BADGE_AT_SCENE[idx];
      if (!badge || earnedBadges[badge]) return;
      earnedBadges[badge] = true;
      saveBadges();
      renderBadgeRow();
      if (window.SFX) window.SFX.play('cursor');
      const el = document.querySelector('.concept-badge.' + badge);
      if (el) { el.classList.add('flashing'); setTimeout(() => el.classList.remove('flashing'), 1200); }
    }
    renderBadgeRow();
    window.addEventListener('scene-change', (e) => {
      const idx = e.detail && typeof e.detail.idx === 'number' ? e.detail.idx : current;
      maybeAwardBadge(idx);
    });

    /*, Speaker-notes overlay (lecturer crib), toggled by `n`., */
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
    }
    function toggleSpeakerNotes() {
      snVisible = !snVisible;
      if (snVisible) { refreshSpeakerNotes(); snOverlay.hidden = false; }
      else snOverlay.hidden = true;
    }

    /*, Keyboard, */
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
        e.preventDefault(); toggleSpeakerNotes();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const musicBtn = document.getElementById('music-toggle');
        if (musicBtn) musicBtn.click();
      } else if (e.key === 'Escape') {
        if (snVisible) toggleSpeakerNotes();
      }
    });
    window.addEventListener('scene-change', () => { if (snVisible) refreshSpeakerNotes(); });

    window.addEventListener('hashchange', () => { const n = readHashScene(); if (n != null) goTo(n); });

    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => { renderBadgeRow(); updateTitle(current); rebuildAll(); });
    }

    const initialScene = readHashScene();
    goTo(initialScene != null ? initialScene : 0);
  }

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.RR = {
    goTo,
    getCurrentScene: () => current,
    sceneCount: SCENES.length,
    titleAt,
    rebuildAll,
    run: RUN,
  };
})();

/* Click-step scene pager for Pipeline Climb.
 *
 *   13 scenes, 0-indexed (scene0..scene12), one builder each at
 *   js/scenes/sceneN.js registering:
 *     window.scenes.sceneN = function (root) {
 *       return { onEnter?, onLeave?, onNextKey?, onPrevKey? };
 *     };
 *   onNextKey / onPrevKey return true to CONSUME the keystroke (advance an
 *   internal step inside the scene), false to let the driver change scene.
 *
 *   Features:
 *     - dot pager + PREV / NEXT buttons + clickable dots
 *     - hash routing #scene=N (replaceState) + hashchange listener
 *     - &run: after a scene enters, auto-click its primary button
 *       ([data-run-primary]) once, for headless capture of gated scenes.
 *       Never auto-runs otherwise.
 *     - theme toggle is owned by theme.js; the topbar button + 't' there.
 *     - concept badges (MDP / POLICY / RETURN / Q* / DP / SARSA) light up
 *       on first visit to their scene (session-scoped, no persistence dep).
 *     - speaker notes overlay toggled by 'n'; slide mode 'f'; quick jump
 *       'g'; help '?'; music 'm'; Esc closes overlays.
 *     - optional one-time intro modal, deferred off the title (first
 *       advance past scene 0), dismissible; never blocks &run.
 *
 *   Exposes window.PipeViz { goTo, getCurrentScene, sceneTitles, rebuildAll }.
 */
(function () {
  /* key matches window.scenes.<key>; titleKey resolves via I18N.t. */
  const SCENES = [
    { key: 'scene0',  titleKey: 'scene.title0',  music: 'title'    },
    { key: 'scene1',  titleKey: 'scene.title1',  music: 'tutorial' },
    { key: 'scene2',  titleKey: 'scene.title2',  music: 'boss'     },
    { key: 'scene3',  titleKey: 'scene.title3',  music: 'title'    },
    { key: 'scene4',  titleKey: 'scene.title4',  music: 'concept'  },
    { key: 'scene5',  titleKey: 'scene.title5',  music: 'concept'  },
    { key: 'scene6',  titleKey: 'scene.title6',  music: 'concept'  },
    { key: 'scene7',  titleKey: 'scene.title7',  music: 'discover' },
    { key: 'scene8',  titleKey: 'scene.title8',  music: 'concept'  },
    { key: 'scene9',  titleKey: 'scene.title9',  music: 'dp'       },
    { key: 'scene10', titleKey: 'scene.title10', music: 'bridge'   },
    { key: 'scene11', titleKey: 'scene.title11', music: 'sarsa'    },
    { key: 'scene12', titleKey: 'scene.title12', music: 'champion' },
  ];

  function titleAt(idx) {
    const s = SCENES[idx];
    if (!s) return '';
    return (window.I18N ? window.I18N.t(s.titleKey) : s.titleKey);
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

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  function readHashScene() {
    const m = (window.location.hash || '').match(/[#&?]scene=(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n >= 0 && n < SCENES.length ? n : null;
  }
  function hasRunFlag() { return /[#&?]run\b/.test(window.location.hash || ''); }

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
    if (el) el.textContent = titleAt(idx);
  }

  /* Click the scene's primary button once, for &run headless capture.
     Scenes opt in by marking exactly one control [data-run-primary]. */
  function maybeAutoRun(idx) {
    if (!hasRunFlag()) return;
    const node = sceneNodes[idx];
    if (!node) return;
    setTimeout(() => {
      const btn = node.querySelector('[data-run-primary]');
      if (btn && !btn.disabled) { try { btn.click(); } catch (_e) {} }
    }, 220);
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
    let freshlyBuilt = false;
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
          freshlyBuilt = true;
        } catch (e) {
          console.error('Scene builder failed:', e);
          node.innerHTML = `<p class="scene-error">Scene ${idx} failed to build: ${e && e.message}</p>`;
          sceneState[idx] = {};
        }
      } else {
        node.innerHTML = `<p class="scene-error">Scene ${idx} not yet implemented.</p>`;
        sceneState[idx] = {};
      }
    } else {
      const st = sceneState[idx];
      if (st && typeof st.onEnter === 'function') {
        try { st.onEnter(); } catch (e) { console.error(e); }
      }
    }

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
    if (freshlyBuilt) maybeAutoRun(idx);
    window.dispatchEvent(new CustomEvent('scene-change', { detail: { idx, key: SCENES[idx].key } }));
  }

  function init() {
    if (!window.DATA) console.error('DATA missing -- did data/datasets.js load?');
    if (!window.scenes) window.scenes = {};

    function cursorBlip() { if (window.SFX) window.SFX.play('cursor'); }

    /* Dot pager. */
    const pager = document.getElementById('dot-pager');
    if (pager) {
      for (let i = 0; i < SCENES.length; i++) {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to scene ' + i);
        dot.addEventListener('click', () => { cursorBlip(); goTo(i); });
        pager.appendChild(dot);
      }
    }

    /* Delegated cursor blip on scene control buttons. */
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('poke-btn') && !t.disabled) cursorBlip();
    });

    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.addEventListener('click', () => { cursorBlip(); goTo(current - 1); });
    if (next) next.addEventListener('click', () => { cursorBlip(); goTo(current + 1); });

    /* ---- Concept badges: MDP / POLICY / RETURN / Q* / DP / SARSA ----
       Session-scoped (no persistence dependency). Light up on first
       visit to the owning scene. */
    const BADGES = ['mdp', 'policy', 'return', 'qstar', 'dp', 'sarsa'];
    const BADGE_SCENE = { scene3: 'mdp', scene4: 'policy', scene6: 'return', scene7: 'qstar', scene9: 'dp', scene11: 'sarsa' };
    const earned = {};
    function renderBadges() {
      const row = document.getElementById('trainer-badges');
      if (!row) return;
      row.innerHTML = BADGES.map(k =>
        '<span class="concept-badge badge-' + k + (earned[k] ? ' earned' : '') +
          '" title="' + T('badge.' + k + '.full') + '">' +
          '<span class="concept-badge-label">' + T('badge.' + k) + '</span>' +
        '</span>').join('');
    }
    function maybeAward(sceneKey) {
      const b = BADGE_SCENE[sceneKey];
      if (!b || earned[b]) return;
      earned[b] = true;
      renderBadges();
      if (window.SFX) window.SFX.play('cursor');
      const el = document.querySelector('.concept-badge.badge-' + b);
      if (el) { el.classList.add('flashing'); setTimeout(() => el.classList.remove('flashing'), 1100); }
    }
    renderBadges();
    window.addEventListener('scene-change', (e) => {
      const key = (e.detail && e.detail.key) || (SCENES[current] && SCENES[current].key);
      maybeAward(key);
    });

    /* ---- Optional one-time intro modal, deferred off the title ----
       Shown the first time the user advances past scene 0; never blocks
       &run (which skips it). Dismiss with a button, Enter, or Esc. */
    let introShown = false;
    function maybeShowIntro() {
      if (introShown || hasRunFlag()) return;
      introShown = true;
      const modal = document.createElement('div');
      modal.className = 'intro-modal centered-overlay';
      modal.innerHTML =
        '<div class="centered-card intro-card">' +
          '<div class="centered-title">' + T('intro.title') + '</div>' +
          '<p class="intro-body">' + T('intro.body') + '</p>' +
          '<button class="poke-btn intro-ok" type="button">' + T('intro.ok') + '</button>' +
        '</div>';
      document.body.appendChild(modal);
      const close = () => { try { modal.remove(); } catch (_e) {} };
      const okBtn = modal.querySelector('.intro-ok');
      if (okBtn) okBtn.addEventListener('click', close);
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      const onKey = (ev) => {
        if (ev.key === 'Enter' || ev.key === 'Escape') { close(); window.removeEventListener('keydown', onKey, true); }
      };
      window.addEventListener('keydown', onKey, true);
      setTimeout(() => { if (okBtn) okBtn.focus(); }, 0);
    }
    /* Only pop the intro when the user actually advances OFF the title
       (scene 0 -> scene >0), not on an initial deep-link to a later
       scene. `lastIdx` tracks the previous scene for this purpose. */
    let lastIdx = -1;
    window.addEventListener('scene-change', (e) => {
      const idx = e.detail && typeof e.detail.idx === 'number' ? e.detail.idx : -1;
      if (lastIdx === 0 && idx > 0) maybeShowIntro();
      lastIdx = idx;
    });

    /* ---- Speaker notes overlay ('n') ---- */
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

    /* ---- Slide mode ('f') ---- */
    function toggleSlideMode() {
      const on = document.body.classList.toggle('slide-mode');
      if (on) showToast(T('slide.toast'));
    }
    function showToast(msg) {
      let toast = document.getElementById('slide-toast');
      if (toast) toast.remove();
      toast = document.createElement('div');
      toast.id = 'slide-toast';
      toast.className = 'slide-toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => { try { toast.remove(); } catch (_e) {} }, 2400);
    }

    /* ---- Quick jump ('g') ---- */
    const qjOverlay = document.createElement('div');
    qjOverlay.id = 'quick-jump-overlay';
    qjOverlay.className = 'centered-overlay';
    qjOverlay.hidden = true;
    qjOverlay.innerHTML = '<div class="centered-card quick-jump-card"></div>';
    document.body.appendChild(qjOverlay);
    let qjVisible = false;
    function renderQuickJump() {
      const card = qjOverlay.querySelector('.centered-card');
      let html = '<div class="centered-title">' + T('quickjump.title') + '</div><div class="quick-jump-list">';
      for (let i = 0; i < SCENES.length; i++) {
        const cur = i === current ? ' current' : '';
        html += '<button class="quick-jump-row' + cur + '" data-idx="' + i + '">' +
                  '<span class="qj-num">' + String(i).padStart(2, '0') + '</span>' +
                  '<span class="qj-title">' + titleAt(i) + '</span>' +
                '</button>';
      }
      html += '</div>';
      card.innerHTML = html;
      card.querySelectorAll('.quick-jump-row').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          if (!isNaN(idx)) goTo(idx);
          toggleQuickJump();
        });
      });
    }
    function toggleQuickJump() {
      qjVisible = !qjVisible;
      if (qjVisible) { renderQuickJump(); qjOverlay.hidden = false; }
      else qjOverlay.hidden = true;
    }

    /* ---- Help overlay ('?') ---- */
    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'help-overlay';
    helpOverlay.className = 'centered-overlay';
    helpOverlay.hidden = true;
    function renderHelpOverlay() {
      helpOverlay.innerHTML =
        '<div class="centered-card help-card">' +
          '<div class="centered-title">' + T('help.title') + '</div>' +
          '<div class="help-row"><kbd>→</kbd><kbd>←</kbd><span>' + T('help.row.arrows') + '</span></div>' +
          '<div class="help-row"><kbd>n</kbd><span>' + T('help.row.n') + '</span></div>' +
          '<div class="help-row"><kbd>f</kbd><span>' + T('help.row.f') + '</span></div>' +
          '<div class="help-row"><kbd>g</kbd><span>' + T('help.row.g') + '</span></div>' +
          '<div class="help-row"><kbd>?</kbd><span>' + T('help.row.help') + '</span></div>' +
          '<div class="help-row"><kbd>t</kbd><span>' + T('help.row.t') + '</span></div>' +
          '<div class="help-row"><kbd>m</kbd><span>' + T('help.row.m') + '</span></div>' +
          '<div class="help-row"><kbd>Esc</kbd><span>' + T('help.row.esc') + '</span></div>' +
          '<div class="help-card-section">' + T('help.section.eggs') + '</div>' +
          '<div class="help-row"><kbd>&amp;run</kbd><span>' + T('help.row.run') + '</span></div>' +
        '</div>';
    }
    renderHelpOverlay();
    document.body.appendChild(helpOverlay);
    let helpVisible = false;
    function toggleHelpOverlay() {
      helpVisible = !helpVisible;
      if (helpVisible) renderHelpOverlay();
      helpOverlay.hidden = !helpVisible;
    }

    /* ---- Keyboard ---- */
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
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault(); toggleSlideMode();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault(); toggleQuickJump();
      } else if (e.key === '?') {
        e.preventDefault(); toggleHelpOverlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const musicBtn = document.getElementById('music-toggle');
        if (musicBtn) musicBtn.click();
      } else if (e.key === 'Escape') {
        if (snVisible) toggleSpeakerNotes();
        if (qjVisible) toggleQuickJump();
        if (helpVisible) toggleHelpOverlay();
        if (document.body.classList.contains('slide-mode')) toggleSlideMode();
      }
    });

    /* Number keys jump while quick-jump is open. */
    window.addEventListener('keydown', (e) => {
      if (!qjVisible || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10);
        if (idx >= 0 && idx < SCENES.length) goTo(idx);
        toggleQuickJump();
      }
    });

    window.addEventListener('scene-change', () => { if (snVisible) refreshSpeakerNotes(); });

    window.addEventListener('hashchange', () => {
      const n = readHashScene();
      if (n != null && n !== current) goTo(n);
    });

    const initialScene = readHashScene();
    goTo(initialScene != null ? initialScene : 0);

    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => { renderBadges(); rebuildAll(); });
    }
  }

  /* Drop every cached scene + state and rebuild the current scene. Used by
     the language toggle so stale-language DOM is never shown. */
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

  window.PipeViz = {
    goTo, getCurrentScene: () => current, sceneTitles: SCENE_TITLES, rebuildAll,
  };
})();

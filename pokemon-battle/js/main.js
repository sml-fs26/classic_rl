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
    { key: 'scene1',           titleKey: 'scene.battle',      title: 'A wild CHARMANDER appeared!',  music: 'boss'     },
    { key: 'sceneMdpOverlay',  titleKey: 'scene.mdp',         title: 'What makes this an MDP?',      music: 'title'    },
    { key: 'sceneTrajectory',  titleKey: 'scene.trajectory',  title: 'The trajectory',               music: 'concept'  },
    { key: 'sceneObjective',   titleKey: 'scene.objective',   title: 'Return & Q*',                   music: 'concept'  },
    { key: 'sceneQstar',       titleKey: 'scene.qstar',       title: 'π* from Q',                    music: 'discover' },
    { key: 'sceneDp',          titleKey: 'scene.dp',          title: 'Filling Q with DP',            music: 'dp'       },
    { key: 'sceneWhyNotDp',    titleKey: 'scene.whyNotDp',    title: "Why DP doesn't scale",         music: 'bridge'   },
    { key: 'sceneSarsaDerive', titleKey: 'scene.sarsaDerive', title: 'Deriving SARSA',               music: 'bridge'   },
    { key: 'scene5',           titleKey: 'scene.recap',       title: "You've trained PIKACHU.",      music: 'champion' },
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
    playSceneTransition(SCENES[idx].key);
    window.dispatchEvent(new CustomEvent('scene-change', { detail: { idx: idx, key: SCENES[idx].key } }));
  }

  /* Gen-1-style rotating-hex wipe — fires only on entries to the three
     battle-flavored scenes so it lands as a moment, not a tax.  The
     overlay is pointer-events: none, so the underlying scene stays
     interactive during the ~700ms reveal.  prefers-reduced-motion
     skips the spawn entirely. */
  const TRANSITION_SCENES = ['scene1', 'sceneSarsaDerive', 'sceneQstar'];
  function playSceneTransition(sceneKey) {
    if (TRANSITION_SCENES.indexOf(sceneKey) < 0) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const overlay = document.createElement('div');
    overlay.className = 'scene-transition';
    document.body.appendChild(overlay);
    overlay.addEventListener('animationend', () => {
      try { overlay.remove(); } catch (_e) {}
    }, { once: true });
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

    /* Trainer badges — one slot per concept scene.  Light up on
       first visit; persisted to localStorage via window.Trainer.
       Badge order: MDP → RETURN → Q* → DP → SARSA. */
    const BADGE_SCENE_KEY = {
      sceneMdpOverlay: 'mdp',
      sceneObjective:  'return',
      sceneQstar:      'qstar',
      sceneDp:         'dp',
      sceneSarsaDerive:'sarsa',
    };
    const BADGE_LABEL = { mdp: 'MDP', return: 'RTN', qstar: 'Q*', dp: 'DP', sarsa: 'SAR' };
    function renderBadgeRow() {
      const row = document.getElementById('trainer-badges');
      if (!row || !window.Trainer) return;
      const keys = window.Trainer.listBadges();
      let html = '';
      for (const k of keys) {
        const got = window.Trainer.hasBadge(k);
        html += '<span class="trainer-badge ' + k + (got ? ' earned' : '') + '" title="' + k.toUpperCase() + '">' +
                  '<span class="trainer-badge-label">' + BADGE_LABEL[k] + '</span>' +
                '</span>';
      }
      row.innerHTML = html;
    }
    function maybeAwardBadge(sceneKey) {
      if (!window.Trainer) return;
      const badge = BADGE_SCENE_KEY[sceneKey];
      if (!badge) return;
      const fresh = window.Trainer.awardBadge(badge);
      if (fresh) {
        renderBadgeRow();
        /* Tiny fanfare on first earn — uses the cursor blip so we don't
           overload the audio mix. */
        if (window.SFX) window.SFX.play('cursor');
        /* Flash the just-earned chip. */
        const el = document.querySelector('.trainer-badge.' + badge);
        if (el) {
          el.classList.add('flashing');
          setTimeout(() => el.classList.remove('flashing'), 1200);
        }
      }
    }
    renderBadgeRow();
    window.addEventListener('scene-change', (e) => {
      const key = (e.detail && e.detail.key) || (SCENES[current] && SCENES[current].key);
      maybeAwardBadge(key);
    });

    /* Trainer-name modal — deferred from page load to the first scene
       transition AWAY from the title screen.  The title impression
       shouldn't be interrupted by a prompt; once the student commits
       to NEXT, we ask their name.  Triggered exactly once. */
    function maybeShowTrainerModal() {
      if (!window.Trainer || window.Trainer.hasBeenAsked()) return;
      const modal = document.createElement('div');
      modal.className = 'trainer-name-modal';
      modal.innerHTML =
        '<div class="trainer-name-card">' +
          '<div class="trainer-name-title">A NEW TRAINER!</div>' +
          '<div class="trainer-name-prompt">What is your name?</div>' +
          '<input id="trainer-name-input" type="text" maxlength="12" placeholder="TRAINER" autofocus>' +
          '<div class="trainer-name-ctrls">' +
            '<button class="poke-btn" id="trainer-name-ok">OK</button>' +
            '<button class="poke-btn" id="trainer-name-skip">SKIP</button>' +
          '</div>' +
          '<div class="trainer-name-hint">12 letters max. You can leave it blank.</div>' +
        '</div>';
      document.body.appendChild(modal);
      const inputEl = document.getElementById('trainer-name-input');
      const finish = (name) => {
        if (window.Trainer) window.Trainer.setName(name || 'TRAINER');
        modal.remove();
      };
      document.getElementById('trainer-name-ok').addEventListener('click', () => finish(inputEl.value));
      document.getElementById('trainer-name-skip').addEventListener('click', () => finish('TRAINER'));
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finish(inputEl.value);
        else if (e.key === 'Escape') finish('TRAINER');
      });
      setTimeout(() => inputEl.focus(), 0);
    }
    window.addEventListener('scene-change', (e) => {
      const idx = e.detail && typeof e.detail.idx === 'number' ? e.detail.idx : -1;
      /* Title screen is index 0; ask once the user advances past it. */
      if (idx > 0) maybeShowTrainerModal();
    });

    /* Speaker-notes overlay — lecturer crib sheet, toggled by `n`.
       Lives outside the scene flow so it's available everywhere. */
    const snOverlay = document.createElement('div');
    snOverlay.id = 'speaker-notes-overlay';
    snOverlay.className = 'speaker-notes-overlay';
    snOverlay.hidden = true;
    snOverlay.innerHTML =
      '<div class="speaker-notes-card">' +
        '<div class="speaker-notes-title">SPEAKER NOTES · press <kbd>n</kbd> to close</div>' +
        '<div class="speaker-notes-content" id="speaker-notes-content"></div>' +
      '</div>';
    document.body.appendChild(snOverlay);
    let snVisible = false;
    function refreshSpeakerNotes() {
      const key = SCENES[current] && SCENES[current].key;
      const html = (window.SpeakerNotes && window.SpeakerNotes.getNotes(key)) || '<em>(No notes for this scene yet.)</em>';
      const target = document.getElementById('speaker-notes-content');
      if (target) target.innerHTML = html;
    }
    function toggleSpeakerNotes() {
      snVisible = !snVisible;
      if (snVisible) { refreshSpeakerNotes(); snOverlay.hidden = false; }
      else           { snOverlay.hidden = true; }
    }

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
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleSlideMode();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleQuickJump();
      } else if (e.key === '?') {
        e.preventDefault();
        toggleHelpOverlay();
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

    /* ---- Slide mode: fullscreen-feel, no topbar ----
       On entry we flash a brief toast in the bottom-right corner so
       the user (lecturer) doesn't wonder where the topbar went. */
    function toggleSlideMode() {
      const wasOn = document.body.classList.toggle('slide-mode');
      if (wasOn) showSlideToast('SLIDE MODE · press ESC or F to exit');
    }
    function showSlideToast(msg) {
      let toast = document.getElementById('slide-toast');
      if (toast) toast.remove();
      toast = document.createElement('div');
      toast.id = 'slide-toast';
      toast.className = 'slide-toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => { try { toast.remove(); } catch (_e) {} }, 2400);
    }

    /* ---- Quick-jump dropdown: list every scene, number-key to jump ---- */
    const qjOverlay = document.createElement('div');
    qjOverlay.id = 'quick-jump-overlay';
    qjOverlay.className = 'centered-overlay';
    qjOverlay.hidden = true;
    qjOverlay.innerHTML = '<div class="centered-card quick-jump-card"></div>';
    document.body.appendChild(qjOverlay);
    let qjVisible = false;
    function renderQuickJump() {
      const card = qjOverlay.querySelector('.centered-card');
      let html = '<div class="centered-title">QUICK JUMP — number to go, ESC to cancel</div>';
      html += '<div class="quick-jump-list">';
      for (let i = 0; i < SCENES.length; i++) {
        const key = i < 10 ? String((i + 1) % 10) : '';   /* 1..9, 0 = scene 10 (index 9) */
        const lbl = key ? '<kbd>' + key + '</kbd>' : '<span class="qj-key-empty">  </span>';
        const title = titleAt(i);
        const cur = i === current ? ' current' : '';
        html += '<button class="quick-jump-row' + cur + '" data-idx="' + i + '">' +
                  lbl + '<span class="qj-num">' + (i < 10 ? String(i).padStart(2, '0') : String(i)) + '</span>' +
                  '<span class="qj-title">' + title + '</span>' +
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
      else           { qjOverlay.hidden = true; }
    }
    /* Number-key shortcuts work while quick-jump is open. */
    window.addEventListener('keydown', (e) => {
      if (!qjVisible) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const ch = e.key;
      if (/^[0-9]$/.test(ch)) {
        e.preventDefault();
        const n = parseInt(ch, 10);
        const idx = n === 0 ? 9 : (n - 1);      /* 1..9 → 0..8; 0 → 9 (scene 10) */
        if (idx >= 0 && idx < SCENES.length) goTo(idx);
        toggleQuickJump();
      }
    });

    /* ---- Help overlay: list every hotkey ---- */
    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'help-overlay';
    helpOverlay.className = 'centered-overlay';
    helpOverlay.hidden = true;
    helpOverlay.innerHTML =
      '<div class="centered-card help-card">' +
        '<div class="centered-title">KEYBOARD SHORTCUTS</div>' +
        '<div class="help-row"><kbd>→</kbd><kbd>←</kbd><span>navigate scenes (or step within a scene)</span></div>' +
        '<div class="help-row"><kbd>↓</kbd><span>fast-fill the typewriter dialog</span></div>' +
        '<div class="help-row"><kbd>n</kbd><span>speaker notes overlay (lecturer crib)</span></div>' +
        '<div class="help-row"><kbd>f</kbd><span>slide mode (fullscreen-feel, hide topbar)</span></div>' +
        '<div class="help-row"><kbd>g</kbd><span>quick-jump to any scene</span></div>' +
        '<div class="help-row"><kbd>?</kbd><span>this help overlay</span></div>' +
        '<div class="help-row"><kbd>t</kbd><span>cycle theme: light → dark → GB → CRT</span></div>' +
        '<div class="help-row"><kbd>m</kbd><span>toggle music on / off</span></div>' +
        '<div class="help-row"><kbd>Esc</kbd><span>close any overlay / leave slide mode</span></div>' +
        '<div class="help-card-section">EASTER EGGS</div>' +
        '<div class="help-row"><span class="help-mouse">🖱</span><span>click PIKACHU on the title screen — cheek-spark zap; ten clicks for the THUNDER cameo</span></div>' +
        '<div class="help-row"><span class="help-mouse">🖱</span><span>click any Q-cell in scene 9 step F to see its Pokedex number</span></div>' +
      '</div>';
    document.body.appendChild(helpOverlay);
    let helpVisible = false;
    function toggleHelpOverlay() {
      helpVisible = !helpVisible;
      helpOverlay.hidden = !helpVisible;
    }

    /* Refresh notes content when the scene changes — only meaningful
       when the overlay is open. */
    window.addEventListener('scene-change', () => {
      if (snVisible) refreshSpeakerNotes();
    });

    window.addEventListener('hashchange', () => {
      const n = readHashScene();
      if (n != null) goTo(n);
    });

    /* Boot-up animation — Game Boy "Nintendo" logo drop + chime on
       the first page load of each browser tab (sessionStorage flag).
       Suppressed if the URL has &skipboot or &run. */
    function playBootAnimation() {
      try { if (sessionStorage.getItem('pokemon-battle.booted')) return false; } catch (_e) {}
      if (/[#&?](skipboot|run)\b/.test(window.location.hash)) {
        try { sessionStorage.setItem('pokemon-battle.booted', '1'); } catch (_e) {}
        return false;
      }
      const overlay = document.createElement('div');
      overlay.className = 'boot-overlay';
      overlay.innerHTML =
        '<div class="boot-stack">' +
          '<div class="boot-logo">SML</div>' +
          '<div class="boot-tag">A REINFORCEMENT-LEARNING ADVENTURE</div>' +
        '</div>';
      document.body.appendChild(overlay);
      setTimeout(() => { if (window.SFX && window.SFX.isEnabled && window.SFX.isEnabled()) window.SFX.play('cursor'); }, 220);
      setTimeout(() => {
        overlay.classList.add('boot-fade');
        setTimeout(() => { try { overlay.remove(); } catch (_e) {} }, 380);
      }, 1300);
      try { sessionStorage.setItem('pokemon-battle.booted', '1'); } catch (_e) {}
      return true;
    }
    playBootAnimation();

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

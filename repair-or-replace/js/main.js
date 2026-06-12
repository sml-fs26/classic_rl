/* Click-step scene pager for Repair or Replace.
 *
 *   13 scenes, 0-indexed (scene0..scene12), one builder each at
 *   js/scenes/sceneN.js registering:
 *     window.scenes.sceneN = function (root) {
 *       return { onEnter?, onLeave?, onNextKey?, onPrevKey? };
 *     };
 *   onNextKey / onPrevKey return true to CONSUME the keystroke (advance an
 *   internal step inside the scene), false to let the driver change scene.
 *
 *   Features (mirrors the sibling gallery pagers, English-only):
 *     - dot pager + PREV / NEXT buttons + clickable dots
 *     - hash routing #scene=N (replaceState) + hashchange listener
 *     - &run: after a scene enters, auto-click its primary button
 *       ([data-run-primary]) once, for headless capture of gated scenes.
 *     - theme toggle is owned by theme.js; the topbar button + 't' there.
 *     - concept badges (MDP / POLICY / RETURN / Q* / DP / SARSA) light up
 *       on first visit to their scene (session-scoped).
 *     - speaker notes overlay 'n'; slide mode 'f'; quick jump 'g';
 *       help '?'; music 'm'; Esc closes overlays.
 *     - one-time intro modal, deferred off the title; never blocks &run.
 *
 *   Exposes window.VanViz { goTo, getCurrentScene, sceneTitles, rebuildAll }.
 */
(function () {
  /* key matches window.scenes.<key>; music keys match js/music.js TRACKS. */
  const SCENES = [
    { key: 'scene0',  title: 'REPAIR OR REPLACE',         music: 'title'    },
    { key: 'scene1',  title: 'How it works',              music: 'tutorial' },
    { key: 'scene2',  title: 'You run the fleet',         music: 'boss'     },
    { key: 'scene3',  title: 'What makes this an MDP?',   music: 'concept'  },
    { key: 'scene4',  title: 'Policy: your maintenance playbook', music: 'concept' },
    { key: 'scene5',  title: 'The trajectory',            music: 'concept'  },
    { key: 'scene6',  title: "Return over the van's life", music: 'concept' },
    { key: 'scene13', title: 'Turn the patience knob',    music: 'concept'  },
    { key: 'scene7',  title: 'Q*: the action scorecard',  music: 'discover' },
    { key: 'scene8',  title: 'The Bellman equation',      music: 'concept'  },
    { key: 'scene9',  title: 'Filling Q* with DP',        music: 'dp'       },
    { key: 'scene10', title: "Why DP doesn't scale",      music: 'bridge'   },
    { key: 'scene11', title: 'SARSA: the one-cell nudge', music: 'sarsa'    },
    { key: 'scene14', title: 'SARSA: let her drive',      music: 'sarsa'    },
    { key: 'scene12', title: 'Recap',                     music: 'champion' },
  ];

  function titleAt(idx) {
    const s = SCENES[idx];
    return s ? s.title : '';
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

  function readHashScene() {
    const m = (window.location.hash || '').match(/[#&?]scene=(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n >= 0 && n < SCENES.length ? n : null;
  }
  function hasRunFlag() { return /[#&?]run\b/.test(window.location.hash || ''); }

  /* Step deep-link params (&step / &autostep / &s10step / &s9fp) are one-shot
     affordances for cold entry and headless QA. syncHash preserves foreign
     hash params across scene changes, so without scrubbing, a &step=3 link
     leaks into the NEXT scene's builder and pre-skips its guided steps.
     Called only when paging AWAY from an already-shown scene, never on the
     initial deep link. */
  function stripStepParams() {
    const cur = window.location.hash || '';
    if (cur.length < 2) return;
    const kept = cur.slice(1).split('&')
      .filter((tok) => !/^(autostep|step|s10step|s9fp)(=|$)/.test(tok));
    const next = kept.length ? '#' + kept.join('&') : '#';
    if (next !== cur) history.replaceState(null, '', next);
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

  /* &autostep=K: fire the scene's onNextKey() K times after build, for
     headless capture of internal steps on scenes without a native &step
     deep link. Dev affordance only, like &run. */
  function maybeAutoStep(idx) {
    const m = (window.location.hash || '').match(/[#&?]autostep=(\d+)/);
    if (!m) return;
    const k = parseInt(m[1], 10);
    if (!Number.isFinite(k) || k <= 0) return;
    setTimeout(() => {
      const st = sceneState[idx];
      if (!st || typeof st.onNextKey !== 'function') return;
      let fired = 0;
      (function tick() {
        if (fired >= k) return;
        fired++;
        let consumed = false;
        try { consumed = st.onNextKey(); } catch (_e) { return; }
        if (consumed) setTimeout(tick, 140);
      })();
    }, 450);
  }

  function goTo(idx) {
    if (idx < 0 || idx >= SCENES.length) return;
    if (idx === current) { syncHash(idx); return; }

    if (current >= 0) stripStepParams();

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
    if (freshlyBuilt) { maybeAutoRun(idx); maybeAutoStep(idx); }
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
    /* Tappable PREV/NEXT delegate to the scene's step engine first (like
       the arrow keys), so mobile users with no arrow keys can step the
       tutorial / DP stepper / SARSA pager. */
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

    /* ---- Concept badges: MDP / POLICY / RETURN / Q* / DP / SARSA ----
       Session-scoped. Light up on first visit to the owning scene. */
    const BADGES = ['mdp', 'policy', 'return', 'qstar', 'dp', 'sarsa'];
    const BADGE_LABEL = { mdp: 'MDP', policy: 'POL', return: 'RTN', qstar: 'Q*', dp: 'DP', sarsa: 'SRS' };
    const BADGE_FULL = {
      mdp: 'MDP: states, actions, transitions, rewards',
      policy: 'Policy: one action per state',
      return: 'Return: discounted money over the whole life',
      qstar: 'Q*: the optimal action scorecard',
      dp: 'DP: compute Q* from the known odds',
      sarsa: 'SARSA: learn Q* from experience',
    };
    const BADGE_SCENE = { scene3: 'mdp', scene4: 'policy', scene6: 'return', scene7: 'qstar', scene9: 'dp', scene11: 'sarsa' };
    const earned = {};
    function renderBadges() {
      const row = document.getElementById('trainer-badges');
      if (!row) return;
      row.innerHTML = BADGES.map(k =>
        '<span class="concept-badge badge-' + k + (earned[k] ? ' earned' : '') +
          '" title="' + BADGE_FULL[k] + '">' +
          '<span class="concept-badge-label">' + BADGE_LABEL[k] + '</span>' +
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

    /* ---- One-time intro modal, deferred off the title ---- */
    let introShown = false;
    function maybeShowIntro() {
      if (introShown || hasRunFlag()) return;
      introShown = true;
      const modal = document.createElement('div');
      modal.className = 'intro-modal centered-overlay';
      modal.innerHTML =
        '<div class="centered-card intro-card">' +
          '<div class="centered-title">ONE VAN. THREE CALLS.</div>' +
          '<p class="intro-body">Every week OLD BESSIE wears down a little, and every week you make one call: ' +
            'RUN the route, put her in for SERVICE, or REPLACE her outright. ' +
            'Step with the arrow keys or NEXT; some scenes step internally before moving on. ' +
            'Press t for the theme, m for music, ? for all shortcuts.</p>' +
          '<button class="poke-btn intro-ok" type="button">GOT IT</button>' +
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
       (scene 0 -> scene >0), not on an initial deep-link to a later scene. */
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
        '<div class="speaker-notes-title">SPEAKER NOTES</div>' +
        '<div class="speaker-notes-content" id="speaker-notes-content"></div>' +
      '</div>';
    document.body.appendChild(snOverlay);
    let snVisible = false;
    function refreshSpeakerNotes() {
      const key = SCENES[current] && SCENES[current].key;
      const html = (window.SpeakerNotes && window.SpeakerNotes.getNotes(key)) || '<em>No notes for this scene.</em>';
      const target = document.getElementById('speaker-notes-content');
      if (target) target.innerHTML = html;
    }
    function toggleSpeakerNotes() {
      snVisible = !snVisible;
      if (snVisible) { refreshSpeakerNotes(); snOverlay.hidden = false; }
      else snOverlay.hidden = true;
    }

    /* ---- Slide mode ('f') ---- */
    function toggleSlideMode() {
      const on = document.body.classList.toggle('slide-mode');
      if (on) showToast('SLIDE MODE: chrome hidden. Press f or Esc to leave.');
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
      let html = '<div class="centered-title">GO TO SCENE</div><div class="quick-jump-list">';
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
          '<div class="centered-title">SHORTCUTS</div>' +
          '<div class="help-row"><kbd>→</kbd><kbd>←</kbd><span>step / change scene</span></div>' +
          '<div class="help-row"><kbd>n</kbd><span>speaker notes</span></div>' +
          '<div class="help-row"><kbd>f</kbd><span>slide mode (hide chrome)</span></div>' +
          '<div class="help-row"><kbd>g</kbd><span>quick jump to a scene</span></div>' +
          '<div class="help-row"><kbd>?</kbd><span>this help</span></div>' +
          '<div class="help-row"><kbd>t</kbd><span>theme (paper / crt)</span></div>' +
          '<div class="help-row"><kbd>m</kbd><span>music on / off</span></div>' +
          '<div class="help-row"><kbd>Esc</kbd><span>close overlays</span></div>' +
          '<div class="help-card-section">FOR ROBOTS</div>' +
          '<div class="help-row"><kbd>&amp;run</kbd><span>auto-press a scene\'s primary button (headless capture)</span></div>' +
          '<div class="help-row"><kbd>&amp;autostep=K</kbd><span>fire onNextKey K times after build (headless capture)</span></div>' +
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
  }

  /* Drop every cached scene + state and rebuild the current scene. */
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

  window.VanViz = {
    goTo, getCurrentScene: () => current, sceneTitles: SCENE_TITLES, rebuildAll,
  };
})();

/* Scene 1 — the state.

   Pedagogical goal: tie every component of the state tuple
     s = (anymal, g_1, g_2, ★)
   to something concrete on the screen. The student drives ANYmal manually
   with arrow keys / wasd, and on each step the changed HUD row flashes so
   they *see* what counts as state.

   Stochasticity is introduced in scene 3 — here malfunctionProb is forced
   to 0 so the student is in full control of ANYmal. Ghosts still move
   uniform-randomly each step (handled inside MDP.step). */
(function () {
  if (!window.scenes) window.scenes = {};

  /* Arrow keys for up/down only; ArrowLeft/ArrowRight are owned by the
     scene engine (onPrevKey/onNextKey) for rewind / advance with fall-through
     to prev/next scene. WASD covers all four directions for movement. */
  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down',
    w: 'up', W: 'up',
    s: 'down', S: 'down',
    a: 'left', A: 'left',
    d: 'right', D: 'right',
  };

  window.scenes.scene1 = function (root) {
    /* ---------- DOM ---------- */
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'scene1-wrap';
    root.appendChild(wrap);

    const header = document.createElement('div');
    header.className = 'hero';
    header.innerHTML =
      '<h1>The state</h1>' +
      '<p class="subtitle">Every position you can name is part of the state.</p>';
    wrap.appendChild(header);

    const cols = document.createElement('div');
    cols.className = 'two-col';
    wrap.appendChild(cols);

    /* Left column: grid + caption */
    const leftCol = document.createElement('div');
    leftCol.className = 'col-stack';
    cols.appendChild(leftCol);

    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host';
    leftCol.appendChild(gridHost);

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.innerHTML =
      'Drive with <kbd>w</kbd><kbd>a</kbd><kbd>s</kbd><kbd>d</kbd> or ' +
      '<kbd>&uarr;</kbd> <kbd>&darr;</kbd>. <kbd>&larr;</kbd> rewinds, ' +
      '<kbd>&rarr;</kbd> replays, and at the head of your history ' +
      '<kbd>&rarr;</kbd> advances the scene.';
    leftCol.appendChild(caption);

    /* Right column: state tuple formula + HUD rows */
    const rightCol = document.createElement('div');
    rightCol.className = 'col-stack scene1-right';
    cols.appendChild(rightCol);

    const tupleFormula = Katex.display(window.DATA.tex.stateTuple);
    rightCol.appendChild(tupleFormula);

    const hud = document.createElement('div');
    hud.className = 'hud';
    rightCol.appendChild(hud);

    /* HUD row builder. The four rows correspond, in order, to the four
       components of s = (anymal, g_1, g_2, star). Each row exposes a
       data-key that we use to flash on change. */
    const hudKeys = [
      { key: 'anymal',  label: 'anymal' },
      { key: 'ghost1',  label: 'ghost 1' },
      { key: 'ghost2',  label: 'ghost 2' },
      { key: 'star',    label: 'star' },
    ];
    const hudRows = {};
    for (const spec of hudKeys) {
      const row = document.createElement('div');
      row.className = 'hud-row';
      row.dataset.key = spec.key;
      const lbl = document.createElement('span');
      lbl.className = 'hud-label';
      lbl.textContent = spec.label;
      const val = document.createElement('span');
      val.className = 'hud-value';
      val.textContent = '(–, –)';
      row.appendChild(lbl);
      row.appendChild(val);
      hud.appendChild(row);
      hudRows[spec.key] = { row, val };
    }

    /* Score / round summary line below the HUD */
    const summary = document.createElement('div');
    summary.className = 'scene1-summary';
    summary.innerHTML =
      '<span class="scene1-summary-row"><span class="hud-label">round</span><span class="hud-value" data-summary="round">0</span></span>' +
      '<span class="scene1-summary-row"><span class="hud-label">score</span><span class="hud-value" data-summary="score">0</span></span>';
    rightCol.appendChild(summary);

    /* Terminal banner — hidden until terminal */
    const banner = document.createElement('div');
    banner.className = 'scene1-banner card';
    banner.hidden = true;
    rightCol.appendChild(banner);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'We will introduce stochastic transitions in the next scene.';
    wrap.appendChild(foot);

    /* ---------- Grid mount ---------- */
    const grid = Grid.mount(gridHost, {
      M: window.DATA.initial.M,
      N: window.DATA.initial.N,
      onLayout: () => renderEntities(),
    });

    /* ---------- Per-scene state ---------- */
    const SEED = window.DATA.params.seed;
    let rng = MDP.makeRng(SEED);
    let state = MDP.initialState();
    const history = History.create();
    let active = false;
    let flashTimers = {};

    /* ---------- Rendering ---------- */
    function renderEntities() {
      grid.setEntity('anymal', { kind: 'anymal', r: state.anymal.r, c: state.anymal.c });
      grid.setEntity('ghost1', { kind: 'ghost',  r: state.ghosts[0].r, c: state.ghosts[0].c });
      grid.setEntity('ghost2', { kind: 'ghost',  r: state.ghosts[1].r, c: state.ghosts[1].c });
      grid.setEntity('star',   { kind: 'star',   r: state.star.r,      c: state.star.c });
    }

    function fmt(rc) { return `(${rc.r}, ${rc.c})`; }

    function renderHud() {
      hudRows.anymal.val.textContent = fmt(state.anymal);
      hudRows.ghost1.val.textContent = fmt(state.ghosts[0]);
      hudRows.ghost2.val.textContent = fmt(state.ghosts[1]);
      hudRows.star.val.textContent   = fmt(state.star);
      summary.querySelector('[data-summary="round"]').textContent = String(state.round);
      summary.querySelector('[data-summary="score"]').textContent = String(state.score);
    }

    function flashHudRow(key) {
      const row = hudRows[key] && hudRows[key].row;
      if (!row) return;
      row.classList.remove('flash');
      void row.offsetWidth;
      row.classList.add('flash');
      if (flashTimers[key]) clearTimeout(flashTimers[key]);
      flashTimers[key] = setTimeout(() => {
        row.classList.remove('flash');
        flashTimers[key] = null;
      }, 360);
    }

    function showTerminalBanner() {
      banner.hidden = false;
      banner.textContent = 'Episode ended — collision. Press → to continue.';
    }

    function hideTerminalBanner() {
      banner.hidden = true;
      banner.textContent = '';
    }

    /* Diff old/new state and flash any HUD row whose value changed. */
    function flashChanges(prev, next) {
      if (prev.anymal.r !== next.anymal.r || prev.anymal.c !== next.anymal.c) {
        flashHudRow('anymal');
      }
      if (prev.ghosts[0].r !== next.ghosts[0].r || prev.ghosts[0].c !== next.ghosts[0].c) {
        flashHudRow('ghost1');
      }
      if (prev.ghosts[1].r !== next.ghosts[1].r || prev.ghosts[1].c !== next.ghosts[1].c) {
        flashHudRow('ghost2');
      }
      if (prev.star.r !== next.star.r || prev.star.c !== next.star.c) {
        flashHudRow('star');
      }
    }

    /* ---------- Reset + replay (used by onEnter and onPrevKey) ---------- */
    function resetAndReplay(targetCursor) {
      state = MDP.initialState();
      rng = MDP.makeRng(SEED);
      for (let i = 0; i < targetCursor; i++) {
        const rec = history.action(i);
        if (!rec) break;
        const out = MDP.step(state, rec.action, { malfunctionProb: 0 }, rng);
        state = out.state;
      }
      hideTerminalBanner();
      if (state.terminal) showTerminalBanner();
      renderEntities();
      renderHud();
    }

    /* ---------- Step forward via a user keystroke ---------- */
    function performStep(action) {
      if (state.terminal) return;
      const prev = state;
      const out = MDP.step(prev, action, { malfunctionProb: 0 }, rng);
      state = out.state;
      history.push(action, SEED);
      flashChanges(prev, state);
      grid.flashEntity('anymal');
      renderEntities();
      renderHud();
      if (state.terminal) showTerminalBanner();
    }

    /* ---------- Step forward by replaying a recorded action ---------- */
    function replayForwardOne() {
      /* history.cursor() points at the next action to replay (post-rewind). */
      const idx = history.cursor();
      const rec = history.action(idx);
      if (!rec) return false;
      const prev = state;
      const out = MDP.step(prev, rec.action, { malfunctionProb: 0 }, rng);
      state = out.state;
      history.stepForward();
      flashChanges(prev, state);
      grid.flashEntity('anymal');
      renderEntities();
      renderHud();
      if (state.terminal) showTerminalBanner();
      return true;
    }

    /* ---------- Keyboard handler ----------
       Scoped via the `active` guard set by onEnter/onLeave so other scenes
       don't accidentally drive ANYmal here. */
    function onKey(e) {
      if (!active) return;
      if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = KEYMAP[e.key];
      if (!action) return;
      e.preventDefault();
      performStep(action);
    }
    window.addEventListener('keydown', onKey);

    /* ---------- Lifecycle ---------- */
    function onEnter() {
      /* Cold-entry safe: reconstruct from DATA with no recorded history. */
      history.reset();
      resetAndReplay(0);
      active = true;
    }

    function onLeave() {
      active = false;
      for (const k of Object.keys(flashTimers)) {
        if (flashTimers[k]) clearTimeout(flashTimers[k]);
      }
      flashTimers = {};
    }

    /* Initial paint (also the first onEnter via main.js's builder path). */
    onEnter();

    return {
      onEnter,
      onLeave,
      onNextKey() {
        /* If the cursor is past the head (we rewound earlier), step forward
           through history. Otherwise yield to the driver to advance scene. */
        if (!history.atHead()) {
          replayForwardOne();
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (history.atStart()) return false;
        history.stepBack();
        resetAndReplay(history.cursor());
        return true;
      },
    };
  };
})();

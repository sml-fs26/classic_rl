/* Scene 2 — the action.

   Pedagogical goal: make the action set
     A = {↑, ↓, ←, →}
   concrete by giving the student a visible action-arrow widget that lights
   up on each keystroke. Same manual-driving mechanics as scene 1, but the
   visual emphasis shifts from "what is the world" to "what did I just
   choose?".

   Stochasticity is still off (introduced in scene 3). */
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

  const ARROW_CHAR = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
  };

  const ACTION_NAME = {
    up: 'up', down: 'down', left: 'left', right: 'right',
  };

  const TRACE_LIMIT = 12;

  window.scenes.scene2 = function (root) {
    /* ---------- DOM ---------- */
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'scene2-wrap';
    root.appendChild(wrap);

    const header = document.createElement('div');
    header.className = 'hero';
    header.innerHTML =
      '<h1>The action</h1>' +
      '<p class="subtitle">Four keystrokes, four directions. That is the action set.</p>';
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
      '<kbd>&uarr;</kbd> <kbd>&darr;</kbd>. Each keystroke lights up an element of A. ' +
      '<kbd>&larr;</kbd> rewinds, <kbd>&rarr;</kbd> replays.';
    leftCol.appendChild(caption);

    /* Right column: action set formula + arrow widget + last-commanded HUD */
    const rightCol = document.createElement('div');
    rightCol.className = 'col-stack scene2-right';
    cols.appendChild(rightCol);

    const setFormula = Katex.display(window.DATA.tex.actionSet);
    rightCol.appendChild(setFormula);

    const arrowsHost = document.createElement('div');
    arrowsHost.className = 'action-arrows';
    rightCol.appendChild(arrowsHost);

    /* Order: row 1 = up; row 2 = left, center, right; row 3 = down.
       CSS already places each .action-arrow.<dir> by grid-area, so insertion
       order doesn't matter for layout. */
    const arrowEls = {};
    for (const dir of ['up', 'left', 'right', 'down']) {
      const el = document.createElement('div');
      el.className = `action-arrow ${dir}`;
      el.textContent = ARROW_CHAR[dir];
      arrowsHost.appendChild(el);
      arrowEls[dir] = el;
    }
    /* Center placeholder to fill the 3x3 grid (kept hidden via CSS). */
    const center = document.createElement('div');
    center.className = 'action-arrow center';
    center.textContent = '';
    arrowsHost.appendChild(center);

    const hud = document.createElement('div');
    hud.className = 'hud scene2-hud';
    rightCol.appendChild(hud);

    const lastRow = document.createElement('div');
    lastRow.className = 'hud-row';
    lastRow.innerHTML =
      '<span class="hud-label">last action</span>' +
      '<span class="hud-value" data-key="last"><span class="scene2-last-symbol">–</span><span class="scene2-last-name">none</span></span>';
    hud.appendChild(lastRow);

    /* Terminal banner — hidden until terminal */
    const banner = document.createElement('div');
    banner.className = 'scene2-banner card';
    banner.hidden = true;
    rightCol.appendChild(banner);

    /* Action-trace strip below the two-column area */
    const traceWrap = document.createElement('div');
    traceWrap.className = 'scene2-trace-wrap';
    wrap.appendChild(traceWrap);

    const traceLabel = document.createElement('span');
    traceLabel.className = 'scene2-trace-label';
    traceLabel.textContent = 'recent';
    traceWrap.appendChild(traceLabel);

    const trace = document.createElement('div');
    trace.className = 'action-trace';
    traceWrap.appendChild(trace);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'In the next scene, the executed action may differ from the commanded one.';
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
    let commandedTimer = null;

    /* ---------- Rendering ---------- */
    function renderEntities() {
      grid.setEntity('anymal', { kind: 'anymal', r: state.anymal.r, c: state.anymal.c });
      grid.setEntity('ghost1', { kind: 'ghost',  r: state.ghosts[0].r, c: state.ghosts[0].c });
      grid.setEntity('ghost2', { kind: 'ghost',  r: state.ghosts[1].r, c: state.ghosts[1].c });
      grid.setEntity('star',   { kind: 'star',   r: state.star.r,      c: state.star.c });
    }

    function renderLastAction(action) {
      const sym = lastRow.querySelector('.scene2-last-symbol');
      const name = lastRow.querySelector('.scene2-last-name');
      if (!action) {
        sym.textContent = '–';
        name.textContent = 'none';
      } else {
        sym.textContent = ARROW_CHAR[action];
        name.textContent = ACTION_NAME[action];
      }
    }

    function flashCommanded(action) {
      const el = arrowEls[action];
      if (!el) return;
      /* Ensure only one arrow is in the commanded state at a time. */
      for (const dir of Object.keys(arrowEls)) {
        arrowEls[dir].classList.remove('commanded');
      }
      void el.offsetWidth;
      el.classList.add('commanded');
      if (commandedTimer) clearTimeout(commandedTimer);
      commandedTimer = setTimeout(() => {
        el.classList.remove('commanded');
        commandedTimer = null;
      }, 280);
    }

    function appendTrace(action) {
      const box = document.createElement('span');
      box.className = `action-trace-item ${action}`;
      box.textContent = ARROW_CHAR[action];
      trace.appendChild(box);
      /* Cap visible width by trimming oldest. */
      while (trace.children.length > TRACE_LIMIT) {
        trace.removeChild(trace.firstChild);
      }
      /* Scroll to right end so newest is always visible. */
      trace.scrollLeft = trace.scrollWidth;
    }

    function rebuildTrace() {
      trace.innerHTML = '';
      const list = history.list();
      const start = Math.max(0, list.length - TRACE_LIMIT);
      for (let i = start; i < list.length; i++) {
        const a = list[i].action;
        const box = document.createElement('span');
        box.className = `action-trace-item ${a}`;
        box.textContent = ARROW_CHAR[a];
        trace.appendChild(box);
      }
      trace.scrollLeft = trace.scrollWidth;
    }

    function showTerminalBanner() {
      banner.hidden = false;
      banner.textContent = 'Episode ended — collision. Press → to continue.';
    }
    function hideTerminalBanner() {
      banner.hidden = true;
      banner.textContent = '';
    }

    function clearCommandedHighlight() {
      for (const dir of Object.keys(arrowEls)) {
        arrowEls[dir].classList.remove('commanded');
      }
      if (commandedTimer) {
        clearTimeout(commandedTimer);
        commandedTimer = null;
      }
    }

    /* ---------- Reset + replay ---------- */
    function resetAndReplay(targetCursor) {
      state = MDP.initialState();
      rng = MDP.makeRng(SEED);
      let lastAction = null;
      for (let i = 0; i < targetCursor; i++) {
        const rec = history.action(i);
        if (!rec) break;
        const out = MDP.step(state, rec.action, { malfunctionProb: 0 }, rng);
        state = out.state;
        lastAction = rec.action;
      }
      hideTerminalBanner();
      if (state.terminal) showTerminalBanner();
      renderEntities();
      renderLastAction(lastAction);
      clearCommandedHighlight();
      rebuildTrace();
    }

    /* ---------- Step forward via a user keystroke ---------- */
    function performStep(action) {
      if (state.terminal) return;
      const out = MDP.step(state, action, { malfunctionProb: 0 }, rng);
      state = out.state;
      history.push(action, SEED);
      renderEntities();
      grid.flashEntity('anymal');
      renderLastAction(action);
      flashCommanded(action);
      appendTrace(action);
      if (state.terminal) showTerminalBanner();
    }

    /* ---------- Step forward by replaying a recorded action ---------- */
    function replayForwardOne() {
      const idx = history.cursor();
      const rec = history.action(idx);
      if (!rec) return false;
      const out = MDP.step(state, rec.action, { malfunctionProb: 0 }, rng);
      state = out.state;
      history.stepForward();
      renderEntities();
      grid.flashEntity('anymal');
      renderLastAction(rec.action);
      flashCommanded(rec.action);
      appendTrace(rec.action);
      if (state.terminal) showTerminalBanner();
      return true;
    }

    /* ---------- Keyboard handler ---------- */
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
      history.reset();
      resetAndReplay(0);
      active = true;
    }

    function onLeave() {
      active = false;
      clearCommandedHighlight();
    }

    onEnter();

    return {
      onEnter,
      onLeave,
      onNextKey() {
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

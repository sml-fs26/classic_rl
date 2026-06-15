/* Scene 1, Pick a path.

   The student drives ANYmal manually, one cell at a time, with → and ↓
   (or d / s). The cumulative score updates after each step; on reaching
   (4, 4) a banner asks "was that the best?". The optimal answer is NOT
   revealed here, the reveal lives in scene 4 once the student has had
   the chance to do the work.

   Per the SKILL §"Step engine": state-is-source-of-truth, prev = reset+
   replay. The History module stores recorded actions. Pressing ArrowLeft
   inside the scene rewinds; ArrowRight either replays through history or,
   at the head, yields to the driver to advance the scene. ←/→ are the
   only "advance scene" affordances, wasd / arrows for moving don't
   collide with prev/next. */
(function () {
  if (!window.scenes) window.scenes = {};

  /* Action keys: ArrowDown / ArrowRight are owned by the scene engine for
     prev/replay/next-scene. We use WASD for path-picking instead, D = right,
     S = down. This matches the SKILL pattern: arrow keys belong to the
     scene engine, scene-internal advance via onNextKey, scene-internal
     movement via the alternative key set.

     We also accept ArrowDown for movement explicitly because it doesn't
     collide with prev/next (those are ArrowLeft / ArrowRight only). For
     ArrowRight we route through onNextKey (see below) so the scene-engine
     gets to decide between "step right" and "advance scene". */
  const KEYMAP = {
    'd': 'right', 'D': 'right',
    's': 'down',  'S': 'down',
    'ArrowDown': 'down',
  };

  window.scenes.scene1 = function (root) {
    const D = window.DATA && window.DATA.grid;
    if (!D) {
      root.innerHTML = '<p style="opacity:0.6">DATA missing</p>';
      return {};
    }

    /*, DOM, */
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's1-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Pick a path.</h1>' +
      '<p class="subtitle">Eight steps to the exit. Pick well.</p>';
    wrap.appendChild(hero);

    const row = document.createElement('div');
    row.className = 's1-row';
    wrap.appendChild(row);

    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s1-grid-host';
    row.appendChild(gridHost);

    const side = document.createElement('div');
    side.className = 's1-side';
    row.appendChild(side);

    /*, Side: live score, step list, banner, */
    const scoreH2 = document.createElement('h2');
    scoreH2.textContent = 'Your score so far.';
    side.appendChild(scoreH2);

    const scoreRow = document.createElement('div');
    scoreRow.className = 's1-score-row';
    side.appendChild(scoreRow);

    const scoreChip = document.createElement('span');
    scoreChip.className = 'score-chip';
    scoreChip.textContent = '0';
    scoreRow.appendChild(scoreChip);

    const stepCountLbl = document.createElement('span');
    stepCountLbl.className = 's1-score-label';
    stepCountLbl.innerHTML = 'Step <span class="step-count" style="font-family:\'SF Mono\',Menlo,monospace;font-size:13px;color:var(--ink);text-transform:none;letter-spacing:0;">0</span> of 8';
    scoreRow.appendChild(stepCountLbl);

    const stepList = document.createElement('div');
    stepList.className = 's1-step-list';
    side.appendChild(stepList);

    const banner = document.createElement('div');
    banner.className = 's1-banner';
    banner.hidden = true;
    side.appendChild(banner);

    const help = document.createElement('p');
    help.className = 'footnote';
    help.innerHTML =
      'Drive with <kbd>d</kbd> (right) and <kbd>s</kbd> (down), or click a neighbour cell. ' +
      '<kbd>&larr;</kbd> rewinds; <kbd>&rarr;</kbd> replays or advances the scene.';
    side.appendChild(help);

    /*, Mount the grid (rewards + ghost-density both shown for the spooky frame), */
    const grid = window.Grid.mount(gridHost, {
      M: D.M,
      N: D.N,
      rewards: D.rewards,
      showRewards: true,
      showGhosts: true,
      onLayout: () => placeAnymal(),
    });
    grid.setCellClass(D.start.r, D.start.c, 'start-cell', true);
    grid.setCellClass(D.goal.r,  D.goal.c,  'goal-cell',  true);
    grid.setEntity('door', { kind: 'door', r: D.goal.r, c: D.goal.c });

    /*, Per-scene state, */
    const TOTAL_STEPS = (D.M - 1) + (D.N - 1);
    const history = window.History.create();
    let pos = { r: D.start.r, c: D.start.c };
    let score = D.rewards[pos.r][pos.c];
    let active = false;

    function placeAnymal() {
      grid.setEntity('anymal', { kind: 'anymal', r: pos.r, c: pos.c });
    }

    /* Rebuild the path-cell class set from the recorded history's prefix
       (positions visited from start through the current cursor). */
    function reconstructPath() {
      grid.clearCellClass('path-cell');
      let r = D.start.r, c = D.start.c;
      grid.setCellClass(r, c, 'path-cell', true);
      const list = history.list();
      for (const { action } of list) {
        if (action === 'right') c += 1;
        else if (action === 'down') r += 1;
        grid.setCellClass(r, c, 'path-cell', true);
      }
      pos = { r, c };
      placeAnymal();
    }

    function recomputeScore() {
      let r = D.start.r, c = D.start.c;
      let s = D.rewards[r][c];
      const list = history.list();
      for (const { action } of list) {
        if (action === 'right') c += 1;
        else if (action === 'down') r += 1;
        s += D.rewards[r][c];
      }
      score = s;
    }

    function renderHud() {
      scoreChip.textContent = String(score);
      const stepEl = stepCountLbl.querySelector('.step-count');
      if (stepEl) stepEl.textContent = String(history.cursor());

      /* Rebuild the step list from history. */
      stepList.innerHTML = '';
      const head = document.createElement('div');
      head.className = 'step-item head';
      head.innerHTML = '<span>step</span><span>(r, c) → action → (r, c)</span><span>+R</span>';
      stepList.appendChild(head);

      let r = D.start.r, c = D.start.c;
      for (let i = 0; i < history.cursor(); i++) {
        const rec = history.action(i);
        const fromR = r, fromC = c;
        if (rec.action === 'right') c += 1;
        else if (rec.action === 'down') r += 1;
        const reward = D.rewards[r][c];
        const arrow = rec.action === 'right' ? '→' : '↓';
        const item = document.createElement('div');
        item.className = 'step-item';
        item.innerHTML =
          `<span>${i + 1}</span>` +
          `<span>(${fromR}, ${fromC}) ${arrow} (${r}, ${c})</span>` +
          `<span>+${reward}</span>`;
        stepList.appendChild(item);
      }
    }

    function showTerminalBanner() {
      banner.hidden = false;
      banner.innerHTML =
        `You scored <span class="banner-score">${score}</span>. Was that the best path? ` +
        `(We will find out soon.) Press <kbd>&rarr;</kbd> to continue.`;
    }
    function hideTerminalBanner() {
      banner.hidden = true;
      banner.textContent = '';
    }

    function isTerminal() {
      return pos.r === D.goal.r && pos.c === D.goal.c;
    }

    /*, Step forward via a user keystroke, */
    function performStep(action) {
      if (isTerminal()) return;
      const downValid = pos.r + 1 < D.M;
      const rightValid = pos.c + 1 < D.N;
      if (action === 'right' && !rightValid) return;
      if (action === 'down'  && !downValid)  return;
      history.push(action);
      reconstructPath();
      recomputeScore();
      grid.flashEntity('anymal');
      renderHud();
      if (isTerminal()) showTerminalBanner();
    }

    function replayForwardOne() {
      const idx = history.cursor();
      const rec = history.action(idx);
      if (!rec) return false;
      history.stepForward();
      reconstructPath();
      recomputeScore();
      grid.flashEntity('anymal');
      renderHud();
      if (isTerminal()) showTerminalBanner();
      return true;
    }

    function rewindOne() {
      if (history.atStart()) return false;
      history.stepBack();
      reconstructPath();
      recomputeScore();
      hideTerminalBanner();
      renderHud();
      return true;
    }

    /*, Keyboard, */
    /* WASD + ArrowDown drive movement. ArrowRight is owned by the scene
       engine (onNextKey). We only register a window-level listener for
       movement keys; ArrowLeft / ArrowRight are routed via the scene
       engine. */
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

    /* Click to step into an adjacent right/down cell. */
    grid.onCellClick(({ r, c }) => {
      if (!active) return;
      if (isTerminal()) return;
      if (r === pos.r && c === pos.c + 1) performStep('right');
      else if (r === pos.r + 1 && c === pos.c) performStep('down');
    });

    /*, Lifecycle, */
    function fullReset() {
      history.reset();
      pos = { r: D.start.r, c: D.start.c };
      score = D.rewards[pos.r][pos.c];
      hideTerminalBanner();
      reconstructPath();
      renderHud();
    }

    function onEnter() {
      fullReset();
      active = true;
    }

    function onLeave() {
      active = false;
    }

    onEnter();

    return {
      onEnter,
      onLeave,
      onNextKey() {
        /* If the cursor is past the head (we rewound earlier), step forward
           through history. Otherwise yield to the driver to advance. */
        if (!history.atHead()) {
          replayForwardOne();
          return true;
        }
        /* If we haven't reached the terminal yet, take one step right (if
           valid). This makes ArrowRight work as both "move right" AND
           "advance scene at end". */
        if (!isTerminal()) {
          const rightValid = pos.c + 1 < D.N;
          if (rightValid) {
            performStep('right');
            return true;
          }
        }
        return false;
      },
      onPrevKey() {
        return rewindOne();
      },
    };
  };
})();

/* Scene 3 — stochasticity.

   Pedagogical goal: make P(s' | s, a) viscerally felt. The student presses
   ↑, and sometimes ANYmal goes left or right or down instead. Both arrows
   are drawn — solid for the commanded direction, dashed for what the
   environment actually executed — so the surprise registers as a visible
   difference rather than as a number on a slider.

   Mechanics:
     - Manual driving with ← ↑ → ↓ (and wasd).
     - A slider (0..0.5) controls malfunction probability for *future*
       steps. Each history entry stores the p that was in effect when the
       step was performed, so a reset+replay rewinds faithfully.
     - Ghosts move uniform-randomly regardless of the slider — their
       randomness is hardcoded in MDP.step. The slider is ANYmal-only.
*/
(function () {
  if (!window.scenes) window.scenes = {};

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', W: 'up',
    s: 'down', S: 'down',
    a: 'left', A: 'left',
    d: 'right', D: 'right',
  };

  const ARROW_GLYPH = { up: '↑', down: '↓', left: '←', right: '→' };
  const SVG_NS = 'http://www.w3.org/2000/svg';

  window.scenes.scene3 = function (root) {
    /* ---------- DOM ---------- */
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'scene3-wrap';
    root.appendChild(wrap);

    const header = document.createElement('div');
    header.className = 'hero';
    header.innerHTML =
      '<h1>Stochasticity</h1>' +
      '<p class="subtitle">You press a direction. The environment decides what actually happens.</p>';
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
      'Drive with <kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>&rarr;</kbd> ' +
      '<kbd>&darr;</kbd>. The dashed arrow shows what actually happened.';
    leftCol.appendChild(caption);

    /* Right column: transition formula + slider + HUD */
    const rightCol = document.createElement('div');
    rightCol.className = 'col-stack scene3-right';
    cols.appendChild(rightCol);

    const transitionFormula = Katex.display(window.DATA.tex.transitionFn);
    rightCol.appendChild(transitionFormula);

    /* Slider strip */
    const controls = document.createElement('div');
    controls.className = 'controls scene3-controls';

    const sliderGroup = document.createElement('div');
    sliderGroup.className = 'control-group';

    const sliderLabel = document.createElement('label');
    sliderLabel.htmlFor = 'scene3-malfunction';
    sliderLabel.textContent = 'Malfunction probability';
    sliderGroup.appendChild(sliderLabel);

    const sliderInput = document.createElement('input');
    sliderInput.type = 'range';
    sliderInput.id = 'scene3-malfunction';
    sliderInput.min = '0';
    sliderInput.max = '0.5';
    sliderInput.step = '0.01';
    const defaultP = (window.DATA.params && typeof window.DATA.params.malfunctionProb === 'number')
      ? window.DATA.params.malfunctionProb : 0.15;
    sliderInput.value = String(defaultP);
    sliderGroup.appendChild(sliderInput);

    const sliderOut = document.createElement('output');
    sliderOut.htmlFor = 'scene3-malfunction';
    sliderOut.textContent = `p = ${defaultP.toFixed(2)}`;
    sliderGroup.appendChild(sliderOut);

    controls.appendChild(sliderGroup);
    rightCol.appendChild(controls);

    /* HUD */
    const hud = document.createElement('div');
    hud.className = 'hud scene3-hud';
    rightCol.appendChild(hud);

    function buildHudRow(key, label) {
      const row = document.createElement('div');
      row.className = 'hud-row';
      row.dataset.key = key;
      const lbl = document.createElement('span');
      lbl.className = 'hud-label';
      lbl.textContent = label;
      const val = document.createElement('span');
      val.className = 'hud-value';
      val.textContent = '–';
      row.appendChild(lbl);
      row.appendChild(val);
      hud.appendChild(row);
      return val;
    }

    const hudCommanded = buildHudRow('commanded', 'commanded');
    const hudExecuted  = buildHudRow('executed',  'executed');
    const hudMatch     = buildHudRow('match',     'match');
    const hudMismatch  = buildHudRow('mismatch',  'mismatches');

    /* Banner */
    const banner = document.createElement('div');
    banner.className = 'scene3-banner card';
    banner.hidden = true;
    rightCol.appendChild(banner);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'Slider changes apply to future steps. Past steps stay as you played them.';
    rightCol.appendChild(foot);

    /* ---------- Grid mount ---------- */
    const grid = Grid.mount(gridHost, {
      M: window.DATA.initial.M,
      N: window.DATA.initial.N,
      onLayout: () => { renderEntities(); redrawArrows(); },
    });

    /* SVG arrow layer inside the overlay div the grid exposed. */
    const arrowSvg = document.createElementNS(SVG_NS, 'svg');
    arrowSvg.setAttribute('class', 'scene3-arrow-svg');
    arrowSvg.setAttribute('width', '100%');
    arrowSvg.setAttribute('height', '100%');
    arrowSvg.style.position = 'absolute';
    arrowSvg.style.inset = '0';
    arrowSvg.style.pointerEvents = 'none';

    /* Two arrowhead markers — one for commanded, one for executed. The
       marker fill picks up the line stroke via fill="context-stroke" where
       supported, with a colored fallback via CSS. */
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML =
      '<marker id="scene3-head-commanded" viewBox="0 0 10 10" refX="8" refY="5" ' +
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z" class="scene3-marker-commanded"/>' +
      '</marker>' +
      '<marker id="scene3-head-executed" viewBox="0 0 10 10" refX="8" refY="5" ' +
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z" class="scene3-marker-executed"/>' +
      '</marker>';
    arrowSvg.appendChild(defs);

    grid.overlay.appendChild(arrowSvg);

    /* ---------- Per-scene state ---------- */
    const SEED = window.DATA.params.seed;
    let rng = MDP.makeRng(SEED);
    let state = MDP.initialState();
    const history = History.create();
    let active = false;
    let mismatchCount = 0;
    /* The most recently applied step is what the arrows visualize. Tracks
       (preState.anymal, commanded, executedDestination). */
    let lastArrow = null;

    /* ---------- Rendering ---------- */
    function renderEntities() {
      grid.setEntity('anymal', { kind: 'anymal', r: state.anymal.r, c: state.anymal.c });
      grid.setEntity('ghost1', { kind: 'ghost',  r: state.ghosts[0].r, c: state.ghosts[0].c });
      grid.setEntity('ghost2', { kind: 'ghost',  r: state.ghosts[1].r, c: state.ghosts[1].c });
      grid.setEntity('star',   { kind: 'star',   r: state.star.r,      c: state.star.c });
    }

    function fmtAction(a) { return a ? `${ARROW_GLYPH[a]} ${a}` : '–'; }

    function renderHud(commanded, executed) {
      hudCommanded.textContent = fmtAction(commanded);
      hudExecuted.textContent  = fmtAction(executed);
      if (commanded == null) {
        hudMatch.textContent = '–';
      } else {
        hudMatch.textContent = (commanded === executed) ? '✓' : '✗';
      }
      hudMismatch.textContent = String(mismatchCount);
    }

    function showTerminalBanner() {
      banner.hidden = false;
      banner.textContent = 'Episode ended — collision. Press → to continue.';
    }
    function hideTerminalBanner() {
      banner.hidden = true;
      banner.textContent = '';
    }

    /* Convert a (row, col) to the centre pixel of that cell. */
    function cellCenter(rc) {
      const px = grid.getCellPx(rc.r, rc.c);
      return { x: px.x + px.w / 2, y: px.y + px.h / 2 };
    }

    /* The "commanded destination" — where ANYmal would have ended up if the
       commanded action had executed. We compute and clamp identically to
       MDP.applyAction + clamp so the arrow tip lands on a cell centre. */
    function commandedDest(fromRc, action) {
      const M = window.DATA.initial.M;
      const N = window.DATA.initial.N;
      return MDP.clamp(MDP.applyAction(fromRc, action), M, N);
    }

    function clearArrows() {
      /* Remove all <path>/<line> elements except the <defs>. */
      const toRemove = [];
      for (const child of arrowSvg.childNodes) {
        if (child.tagName && child.tagName.toLowerCase() !== 'defs') toRemove.push(child);
      }
      toRemove.forEach(n => n.remove());
    }

    function redrawArrows() {
      clearArrows();
      if (!lastArrow) return;
      const from = cellCenter(lastArrow.from);
      const cmdTo = cellCenter(lastArrow.commandedDest);
      const exeTo = cellCenter(lastArrow.executedDest);

      /* If commanded destination equals start (wall-stop), draw a small dot
         at the start instead of a zero-length line. */
      const commandedLine = (lastArrow.from.r === lastArrow.commandedDest.r &&
                             lastArrow.from.c === lastArrow.commandedDest.c)
        ? null
        : makeArrowLine(from, cmdTo, 'commanded');
      if (commandedLine) arrowSvg.appendChild(commandedLine);

      /* Draw executed only if it differs from commanded. */
      const isMismatch =
        lastArrow.commandedDest.r !== lastArrow.executedDest.r ||
        lastArrow.commandedDest.c !== lastArrow.executedDest.c;
      if (isMismatch) {
        const executedLine = (lastArrow.from.r === lastArrow.executedDest.r &&
                              lastArrow.from.c === lastArrow.executedDest.c)
          ? null
          : makeArrowLine(from, exeTo, 'executed');
        if (executedLine) arrowSvg.appendChild(executedLine);
      }
    }

    function makeArrowLine(from, to, kind) {
      const line = document.createElementNS(SVG_NS, 'line');
      /* Shorten the line tip slightly so the arrowhead doesn't overshoot
         the cell centre. */
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const shrink = 6;
      const tx = to.x - (dx / len) * shrink;
      const ty = to.y - (dy / len) * shrink;
      line.setAttribute('x1', String(from.x));
      line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(tx));
      line.setAttribute('y2', String(ty));
      line.setAttribute('class', `arrow-${kind}`);
      line.setAttribute('marker-end', `url(#scene3-head-${kind})`);
      return line;
    }

    /* ---------- Reset + replay ----------
       Every history entry stores its own p, so replay is faithful even if
       the slider has been moved since. */
    function resetAndReplay(targetCursor) {
      state = MDP.initialState();
      rng = MDP.makeRng(SEED);
      mismatchCount = 0;
      lastArrow = null;
      let lastCommanded = null;
      let lastExecuted = null;

      for (let i = 0; i < targetCursor; i++) {
        const rec = history.action(i);
        if (!rec) break;
        const prev = state;
        const out = MDP.step(prev, rec.action, { malfunctionProb: rec.p }, rng);
        state = out.state;
        lastCommanded = rec.action;
        lastExecuted = out.executed;
        if (rec.action !== out.executed) mismatchCount += 1;
        lastArrow = {
          from: { r: prev.anymal.r, c: prev.anymal.c },
          commandedDest: commandedDest(prev.anymal, rec.action),
          executedDest:  { r: state.anymal.r, c: state.anymal.c },
        };
      }
      hideTerminalBanner();
      if (state.terminal) showTerminalBanner();
      renderEntities();
      renderHud(lastCommanded, lastExecuted);
      redrawArrows();
    }

    /* ---------- Step forward via a user keystroke ---------- */
    function performStep(action) {
      if (state.terminal) return;
      const p = readSliderP();
      const prev = state;
      const out = MDP.step(prev, action, { malfunctionProb: p }, rng);
      state = out.state;
      history.push(action, SEED);
      /* History stores the seed alongside the action via push(action, seed)
         per the History API; we also need the p, so attach it directly. */
      const rec = history.action(history.cursor() - 1);
      if (rec) rec.p = p;

      if (action !== out.executed) mismatchCount += 1;
      lastArrow = {
        from: { r: prev.anymal.r, c: prev.anymal.c },
        commandedDest: commandedDest(prev.anymal, action),
        executedDest:  { r: state.anymal.r, c: state.anymal.c },
      };
      grid.flashEntity('anymal');
      renderEntities();
      renderHud(action, out.executed);
      redrawArrows();
      if (state.terminal) showTerminalBanner();
    }

    /* ---------- Step forward by replaying a recorded action ---------- */
    function replayForwardOne() {
      const idx = history.cursor();
      const rec = history.action(idx);
      if (!rec) return false;
      const prev = state;
      const out = MDP.step(prev, rec.action, { malfunctionProb: rec.p }, rng);
      state = out.state;
      history.stepForward();
      if (rec.action !== out.executed) mismatchCount += 1;
      lastArrow = {
        from: { r: prev.anymal.r, c: prev.anymal.c },
        commandedDest: commandedDest(prev.anymal, rec.action),
        executedDest:  { r: state.anymal.r, c: state.anymal.c },
      };
      grid.flashEntity('anymal');
      renderEntities();
      renderHud(rec.action, out.executed);
      redrawArrows();
      if (state.terminal) showTerminalBanner();
      return true;
    }

    function readSliderP() {
      const v = parseFloat(sliderInput.value);
      if (!Number.isFinite(v)) return 0;
      return Math.min(0.5, Math.max(0, v));
    }

    sliderInput.addEventListener('input', () => {
      const p = readSliderP();
      sliderOut.textContent = `p = ${p.toFixed(2)}`;
    });

    /* ---------- Keyboard ----------
       main.js's keydown handler runs BEFORE this scene's (registration
       order). For ArrowLeft / ArrowRight, main.js calls our onPrevKey /
       onNextKey first; if they consumed the keystroke (rewind / replay),
       we suppress the movement here — otherwise pressing ← would BOTH
       rewind AND execute a 'left' move on the same press. */
    let lastNavConsumedAt = 0;
    function onKey(e) {
      if (!active) return;
      if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = KEYMAP[e.key];
      if (!action) return;
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && performance.now() - lastNavConsumedAt < 50) {
        return;
      }
      e.preventDefault();
      performStep(action);
    }
    function markNavConsumed() { lastNavConsumedAt = performance.now(); }
    window.addEventListener('keydown', onKey);

    /* ---------- Lifecycle ---------- */
    function onEnter() {
      history.reset();
      mismatchCount = 0;
      lastArrow = null;
      resetAndReplay(0);
      renderHud(null, null);
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
        if (!history.atHead()) {
          replayForwardOne();
          markNavConsumed();
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (history.atStart()) return false;
        history.stepBack();
        resetAndReplay(history.cursor());
        markNavConsumed();
        return true;
      },
    };
  };
})();

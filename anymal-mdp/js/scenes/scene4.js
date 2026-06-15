/* Scene 4, the reward.

   Pedagogical goal: make R : S × A × S → ℝ concrete. Each step writes a
   row to a ledger that the student watches fill. Step cost is -1, picking
   up a star adds +10 (so the row reads -1 + 10 = +9 with a ★ marker on
   s'), and a ghost collision adds -100 (so the terminal row reads -1 + -100
   = -101).

   Stochasticity is off here, malfunctionProb = 0. The lesson is the
   reward, not the transition; if commanded ≠ executed the student would
   conflate the two. Ghosts still drift uniform-randomly inside MDP.step.
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

  window.scenes.scene4 = function (root) {
    /*, DOM, */
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'scene4-wrap';
    root.appendChild(wrap);

    const header = document.createElement('div');
    header.className = 'hero';
    header.innerHTML =
      '<h1>The reward</h1>' +
      '<p class="subtitle">Each step writes a row. The score is the sum of the column.</p>';
    wrap.appendChild(header);

    const cols = document.createElement('div');
    cols.className = 'two-col';
    wrap.appendChild(cols);

    /* Left column: grid + caption + reward legend */
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
      '<kbd>&darr;</kbd>. Each step writes a row.';
    leftCol.appendChild(caption);

    /* Reward legend, static reference values from DATA.rewards. */
    const legend = document.createElement('div');
    legend.className = 'controls scene4-legend';
    const rewards = window.DATA.rewards;
    legend.appendChild(makeChip(`${fmtReward(rewards.step)} step`, rewards.step));
    legend.appendChild(makeChip(`${fmtReward(rewards.star)} star`, rewards.star));
    legend.appendChild(makeChip(`${fmtReward(rewards.collision)} collision`, rewards.collision));
    leftCol.appendChild(legend);

    /* Right column: reward formula + HUD + ledger */
    const rightCol = document.createElement('div');
    rightCol.className = 'col-stack scene4-right';
    cols.appendChild(rightCol);

    const rewardFormula = Katex.display(window.DATA.tex.rewardFn);
    rightCol.appendChild(rewardFormula);

    const hud = document.createElement('div');
    hud.className = 'hud scene4-hud';
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
      val.textContent = ', ';
      row.appendChild(lbl);
      row.appendChild(val);
      hud.appendChild(row);
      return val;
    }
    const hudRound      = buildHudRow('round',      'round');
    const hudScore      = buildHudRow('score',      'score');
    const hudLastReward = buildHudRow('lastReward', 'last reward');

    /* Ledger */
    const ledger = document.createElement('div');
    ledger.className = 'ledger scene4-ledger';
    rightCol.appendChild(ledger);
    rebuildLedgerHeader();

    /* Banner */
    const banner = document.createElement('div');
    banner.className = 'scene4-banner card';
    banner.hidden = true;
    rightCol.appendChild(banner);

    /*, Grid mount, */
    const grid = Grid.mount(gridHost, {
      M: window.DATA.initial.M,
      N: window.DATA.initial.N,
      onLayout: () => renderEntities(),
    });

    /*, Per-scene state, */
    const SEED = window.DATA.params.seed;
    let rng = MDP.makeRng(SEED);
    let state = MDP.initialState();
    const history = History.create();
    let active = false;

    /*, Helpers, */
    function fmtReward(r) {
      if (r > 0) return `+${r}`;
      return String(r);
    }
    function fmtRC(rc) { return `(${rc.r},${rc.c})`; }

    function makeChip(text, magnitude) {
      const chip = document.createElement('span');
      chip.className = 'scene4-chip control-group';
      const dot = document.createElement('span');
      dot.className = 'scene4-chip-dot';
      if (magnitude > 0) dot.classList.add('pos');
      else if (magnitude < 0) dot.classList.add('neg');
      chip.appendChild(dot);
      const lbl = document.createElement('span');
      lbl.className = 'scene4-chip-label';
      lbl.textContent = text;
      chip.appendChild(lbl);
      return chip;
    }

    function rebuildLedgerHeader() {
      ledger.innerHTML = '';
      const head = document.createElement('div');
      head.className = 'ledger-row head';
      head.innerHTML =
        '<span>t</span><span>s</span><span>a</span><span>s\'</span><span>r</span>';
      ledger.appendChild(head);
    }

    function appendLedgerRow(rowSpec) {
      const row = document.createElement('div');
      row.className = 'ledger-row';
      const tCell  = document.createElement('span'); tCell.textContent  = String(rowSpec.t);
      const sCell  = document.createElement('span'); sCell.textContent  = fmtRC(rowSpec.s);
      const aCell  = document.createElement('span'); aCell.textContent  = ARROW_GLYPH[rowSpec.a] || rowSpec.a;
      const sPCell = document.createElement('span');
      sPCell.textContent = fmtRC(rowSpec.sPrime) + (rowSpec.hitStar ? ' ★' : '');
      const rCell  = document.createElement('span');
      rCell.textContent = fmtReward(rowSpec.r);
      rCell.className = 'reward ' + (rowSpec.r > 0 ? 'pos' : (rowSpec.r < 0 ? 'neg' : ''));
      row.appendChild(tCell);
      row.appendChild(sCell);
      row.appendChild(aCell);
      row.appendChild(sPCell);
      row.appendChild(rCell);
      ledger.appendChild(row);
      ledger.scrollTop = ledger.scrollHeight;
    }

    /*, Rendering, */
    function renderEntities() {
      grid.setEntity('anymal', { kind: 'anymal', r: state.anymal.r, c: state.anymal.c });
      grid.setEntity('ghost1', { kind: 'ghost',  r: state.ghosts[0].r, c: state.ghosts[0].c });
      grid.setEntity('ghost2', { kind: 'ghost',  r: state.ghosts[1].r, c: state.ghosts[1].c });
      grid.setEntity('star',   { kind: 'star',   r: state.star.r,      c: state.star.c });
    }

    function renderHud(lastReward) {
      hudRound.textContent = String(state.round);
      hudScore.textContent = String(state.score);
      hudLastReward.textContent = (lastReward == null) ? ', ' : fmtReward(lastReward);
    }

    function showTerminalBanner() {
      banner.hidden = false;
      banner.textContent = 'Episode ended, collision. Press → to continue.';
    }
    function hideTerminalBanner() {
      banner.hidden = true;
      banner.textContent = '';
    }

    /*, Reset + replay ----------
       Rebuild the ledger from scratch, then replay every action. */
    function resetAndReplay(targetCursor) {
      state = MDP.initialState();
      rng = MDP.makeRng(SEED);
      rebuildLedgerHeader();
      let lastReward = null;

      for (let i = 0; i < targetCursor; i++) {
        const rec = history.action(i);
        if (!rec) break;
        const prev = state;
        const out = MDP.step(prev, rec.action, { malfunctionProb: 0 }, rng);
        appendLedgerRow({
          t: i + 1,
          s: prev.anymal,
          a: rec.action,
          sPrime: out.state.anymal,
          r: out.reward,
          hitStar: out.hitStar,
        });
        state = out.state;
        lastReward = out.reward;
      }

      hideTerminalBanner();
      if (state.terminal) showTerminalBanner();
      renderEntities();
      renderHud(lastReward);
    }

    /*, Step forward via a user keystroke, */
    function performStep(action) {
      if (state.terminal) return;
      const prev = state;
      const out = MDP.step(prev, action, { malfunctionProb: 0 }, rng);
      const t = history.length() + 1; /* prior to push, the new row is 1-indexed by length+1 */
      history.push(action, SEED);
      appendLedgerRow({
        t,
        s: prev.anymal,
        a: action,
        sPrime: out.state.anymal,
        r: out.reward,
        hitStar: out.hitStar,
      });
      state = out.state;
      grid.flashEntity('anymal');
      renderEntities();
      renderHud(out.reward);
      if (state.terminal) showTerminalBanner();
    }

    /*, Step forward by replaying a recorded action, */
    function replayForwardOne() {
      const idx = history.cursor();
      const rec = history.action(idx);
      if (!rec) return false;
      const prev = state;
      const out = MDP.step(prev, rec.action, { malfunctionProb: 0 }, rng);
      appendLedgerRow({
        t: idx + 1,
        s: prev.anymal,
        a: rec.action,
        sPrime: out.state.anymal,
        r: out.reward,
        hitStar: out.hitStar,
      });
      state = out.state;
      history.stepForward();
      grid.flashEntity('anymal');
      renderEntities();
      renderHud(out.reward);
      if (state.terminal) showTerminalBanner();
      return true;
    }

    /*, Keyboard ----------
       The driver in main.js attaches its own keydown listener BEFORE this
       scene's listener (registration order: main.js init runs before
       scene builders). For ArrowLeft / ArrowRight, main.js calls our
       onPrevKey / onNextKey first; by the time we get here the rewind /
       replay-forward has already happened. So we skip movement when those
       keys did navigation work, otherwise pressing ← would BOTH rewind
       AND execute a 'left' move on the same press, leaving a spurious
       extra row in the ledger. */
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

    /*, Lifecycle, */
    function onEnter() {
      history.reset();
      resetAndReplay(0);
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

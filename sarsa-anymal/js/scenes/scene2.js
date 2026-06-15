/* Scene 2, One step.
 *
 *   Live 3×7 grid (ANYmal at start, two ghosts patrolling, star at goal). Side
 *   rail: the numerical Q-table (21 rows × 4 cols, all zeroes initially).
 *
 *   Pressing arrow → agent moves → (a) tuple `(s, a, r, s', a')` floats up
 *   near the agent for ~600 ms → (b) the Q-update arithmetic with REAL
 *   numbers floats below for the next ~600 ms → (c) the corresponding
 *   numerical-table cell flashes and updates → (d) ghosts move → (e)
 *   collision check.
 *
 *   Three sliders: ε, α, γ.
 *
 *   Tutorial caption above the grid:
 *     "For now, state is just (r, c). Ghosts are part of the environment,
 *      not the state."
 *
 *   On-policy SARSA simplification: a' here is the same action the user just
 *   issued (the pedagogical compromise, actual SARSA waits one step for the
 *   user's *next* keypress, but giving the student instant per-keystroke
 *   feedback is more important than strict semantics for this scene). The
 *   precompute used in scene 3/4 *does* use the real next-step a'.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  const ARROW = { up: '↑', down: '↓', left: '←', right: '→' };
  const ARROW_KEY = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  };
  const TIMING = { tupleAt: 0, arithAt: 600, flashAt: 1200, fadeAt: 1900 };

  function fmtNoSign(v) { return v.toFixed(2); }

  window.scenes.scene2 = function (root) {
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'scene2-wrap';
    root.appendChild(wrap);

    /* Hero */
    const hero = document.createElement('div');
    hero.className = 'hero s2-hero';
    hero.innerHTML =
      '<h1>One step.</h1>' +
      '<p class="subtitle">Press an arrow. Watch one cell of the Q-table move.</p>';
    wrap.appendChild(hero);

    /* Tutorial caption, names the state-simplification explicitly. */
    const tut = document.createElement('p');
    tut.className = 'tutorial-caption';
    tut.innerHTML =
      'For now, state is just <strong>(r, c)</strong>. ' +
      'Ghosts are part of the environment, not the state.';
    wrap.appendChild(tut);

    const layout = document.createElement('div');
    layout.className = 's2-layout';
    wrap.appendChild(layout);

    const left = document.createElement('div');
    left.className = 's2-left';
    layout.appendChild(left);

    const rail = document.createElement('div');
    rail.className = 's2-rail';
    layout.appendChild(rail);

    /* Status banner */
    const banner = document.createElement('div');
    banner.className = 'status-banner';
    banner.textContent = '';
    left.appendChild(banner);

    /* Grid host */
    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s2-grid-host';
    left.appendChild(gridHost);

    /* Sliders */
    const sliders = document.createElement('div');
    sliders.className = 'controls s2-sliders';
    left.appendChild(sliders);

    /* Right rail */
    const railTitle = document.createElement('div');
    railTitle.className = 'col-label';
    railTitle.textContent = 'Q-table, 21 states × 4 actions';
    rail.appendChild(railTitle);

    const qHost = document.createElement('div');
    qHost.className = 'qtable-rail';
    rail.appendChild(qHost);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.innerHTML = 'Use <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> to step. <kbd>R</kbd> to reset Q-table and episode.';
    wrap.appendChild(foot);

    /*, State (cold-entry safe), */
    const init = window.MDP.initialState();
    const M = init.M, N = init.N;

    const params = {
      epsilon: 0.1, alpha: 0.5, gamma: 0.95,
      malfunctionProb: 0.0, maxRounds: 80,
    };

    let Q = window.SARSA.makeQ(M, N);

    /* Mount the grid */
    const grid = window.Grid.mount(gridHost, {
      M, N,
      onLayout: () => placeAll(),
    });
    grid.setCellClass(init.start.r, init.start.c, 'start-cell', true);
    grid.setCellClass(init.star.r,  init.star.c,  'goal-cell',  true);

    /* Numerical Q-table */
    const qView = window.QTable.mountNumerical(qHost, M, N, { goal: init.star });
    qView.update(Q);

    let state = window.MDP.initialState();

    function placeAll() {
      grid.setEntity('anymal', { kind: 'anymal', r: state.anymal.r, c: state.anymal.c });
      for (let i = 0; i < state.ghosts.length; i++) {
        grid.setEntity('ghost' + i, { kind: 'ghost', r: state.ghosts[i].r, c: state.ghosts[i].c });
      }
      grid.setEntity('star', { kind: 'star', r: state.star.r, c: state.star.c });
    }
    placeAll();

    /*, Sliders, */
    function makeSlider(label, key, min, max, step, valFmt) {
      const grp = document.createElement('div');
      grp.className = 'control-group greek';
      const lbl = document.createElement('label');
      lbl.className = 'greek-text';
      lbl.textContent = label;
      grp.appendChild(lbl);
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(params[key]);
      grp.appendChild(input);
      const val = document.createElement('span');
      val.className = 'control-value';
      val.textContent = valFmt(params[key]);
      grp.appendChild(val);
      input.addEventListener('input', () => {
        params[key] = parseFloat(input.value);
        val.textContent = valFmt(params[key]);
      });
      sliders.appendChild(grp);
      return input;
    }
    makeSlider('ε', 'epsilon', 0,    0.5,  0.05, v => v.toFixed(2));
    makeSlider('α', 'alpha',   0.05, 0.95, 0.05, v => v.toFixed(2));
    makeSlider('γ', 'gamma',   0.5,  0.99, 0.01, v => v.toFixed(2));

    /* Reset button */
    const restartGrp = document.createElement('div');
    restartGrp.className = 'control-group';
    const restartBtn = document.createElement('button');
    restartBtn.className = 'toggle';
    restartBtn.type = 'button';
    restartBtn.textContent = 'Reset Q & episode';
    restartGrp.appendChild(restartBtn);
    sliders.appendChild(restartGrp);

    function fullReset() {
      state = window.MDP.initialState();
      Q = window.SARSA.makeQ(M, N);
      placeAll();
      qView.update(Q);
      qView.clearHighlight();
      banner.classList.remove('show', 'collision', 'goal');
      banner.textContent = '';
      clearOverlays();
    }
    restartBtn.addEventListener('click', fullReset);

    /*, Tuple / arithmetic floating overlays, */
    const overlay = grid.overlay;
    let activeChips = [];

    function clearOverlays() {
      for (const c of activeChips) c.remove();
      activeChips = [];
    }

    function placeChipNearAgent(chip, agentRC, side) {
      const rect = grid.getCellRect(agentRC.r, agentRC.c);
      const offsetTop = (side === 'arith') ? -4 : -32;
      let left = rect.x + rect.w * 0.85;
      const hostW = grid.cellSize().w * N;
      const chipW = 260;
      if (left + chipW > hostW) left = Math.max(0, rect.x - chipW + rect.w * 0.15);
      chip.style.left = left + 'px';
      chip.style.top  = (rect.y + offsetTop) + 'px';
    }

    function showTuple(s, a, r, sNext, aNext, agentRC) {
      const chip = document.createElement('div');
      chip.className = 'tuple-chip tuple-tuple';
      chip.innerHTML =
        '<span class="comp-mdp">(' + s.r + ',' + s.c + ')</span>' +
        ' <span class="t-glue">·</span> <span class="comp-mdp">' + ARROW[a] + '</span>' +
        ' <span class="t-glue">·</span> <span class="comp-bellman">' + (r >= 0 ? '+' : '') + r + '</span>' +
        ' <span class="t-glue">·</span> <span class="comp-mdp">(' + sNext.r + ',' + sNext.c + ')</span>' +
        ' <span class="t-glue">·</span> <span class="comp-eps">' + (aNext ? ARROW[aNext] : ', ') + '</span>';
      overlay.appendChild(chip);
      placeChipNearAgent(chip, agentRC, 'tuple');
      activeChips.push(chip);
      requestAnimationFrame(() => chip.classList.add('show'));
      setTimeout(() => {
        chip.classList.remove('show');
        setTimeout(() => chip.remove(), 250);
      }, TIMING.fadeAt - TIMING.tupleAt);
    }

    function showArith(qOld, alpha, r, gamma, qNext, qNew, terminal, agentRC) {
      const chip = document.createElement('div');
      chip.className = 'tuple-chip tuple-arith';
      const txt = terminal
        ? 'Q ← ' + fmtNoSign(qOld) + ' + ' + alpha.toFixed(2) +
          ' × (' + r + ' − ' + fmtNoSign(qOld) + ') = ' + fmtNoSign(qNew)
        : 'Q ← ' + fmtNoSign(qOld) + ' + ' + alpha.toFixed(2) +
          ' × (' + r + ' + ' + gamma.toFixed(2) + '·' + fmtNoSign(qNext) +
          ' − ' + fmtNoSign(qOld) + ') = ' + fmtNoSign(qNew);
      chip.textContent = txt;
      overlay.appendChild(chip);
      placeChipNearAgent(chip, agentRC, 'arith');
      activeChips.push(chip);
      setTimeout(() => chip.classList.add('show'), TIMING.arithAt);
      setTimeout(() => {
        chip.classList.remove('show');
        setTimeout(() => chip.remove(), 250);
      }, TIMING.fadeAt);
    }

    /*, Single-step machinery, */
    let busy = false; /* re-entrancy guard while overlays are mid-animation */
    function doStep(action) {
      if (busy) return;
      if (state.terminal) {
        /* Auto-restart the episode on the next press. */
        state = window.MDP.initialState();
        placeAll();
        banner.classList.remove('show');
        banner.textContent = '';
        return;
      }
      const s = { r: state.anymal.r, c: state.anymal.c };
      const aIdx = window.SARSA.ACTIONS.indexOf(action);
      const qOld = window.SARSA.get(Q, M, N, s.r, s.c, aIdx);

      const stepSeed = ((Date.now() & 0xffffffff) ^ 0x9E3779B1) >>> 0;
      const rng = window.MDP.makeRng(stepSeed);
      const out = window.MDP.step(state, action, params, rng);

      const sNext = { r: out.state.anymal.r, c: out.state.anymal.c };
      const aNextStr = action;
      const qNext = out.terminal ? 0 : window.SARSA.get(Q, M, N, sNext.r, sNext.c, aIdx);
      const target = out.terminal ? out.reward : (out.reward + params.gamma * qNext);
      const qNew = qOld + params.alpha * (target - qOld);
      window.SARSA.set(Q, M, N, s.r, s.c, aIdx, qNew);

      showTuple(s, action, out.reward, sNext, out.terminal ? null : aNextStr, s);
      showArith(qOld, params.alpha, out.reward, params.gamma, qNext, qNew, out.terminal, s);

      busy = true;
      setTimeout(() => {
        state = out.state;
        placeAll();
        qView.update(Q, { highlight: { r: s.r, c: s.c } });
        qView.flashCell(s.r, s.c, action);

        if (out.collision) {
          banner.classList.add('show', 'collision');
          banner.classList.remove('goal');
          banner.textContent = 'collision · ' + window.MDP.REWARD.COLLISION + ' · respawn at start';
          setTimeout(() => banner.classList.remove('show'), 2200);
        } else if (out.hitStar) {
          banner.classList.add('show', 'goal');
          banner.classList.remove('collision');
          banner.textContent = 'goal reached · +' + window.MDP.REWARD.STAR + ' · episode complete · press any arrow to start a new episode';
          const cele = document.createElement('div');
          cele.className = 'celebrate-chip';
          cele.textContent = '+' + window.MDP.REWARD.STAR;
          const rect = grid.getCellRect(out.state.star.r, out.state.star.c);
          cele.style.left = (rect.x + rect.w / 2 - 14) + 'px';
          cele.style.top  = (rect.y + rect.h / 2) + 'px';
          overlay.appendChild(cele);
          setTimeout(() => cele.remove(), 1200);
          grid.flashEntity('star');
        }
        busy = false;
      }, TIMING.flashAt);
    }

    /* Keyboard handling */
    function onKey(e) {
      if (e.target && /input|textarea|select|button/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const a = ARROW_KEY[e.key];
      if (a) {
        e.preventDefault();
        e.stopPropagation();
        doStep(a);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fullReset();
      }
    }

    let attached = false;
    function attach() {
      if (attached) return;
      window.addEventListener('keydown', onKey, true);
      attached = true;
    }
    function detach() {
      if (!attached) return;
      window.removeEventListener('keydown', onKey, true);
      attached = false;
    }
    attach();

    return {
      onEnter() {
        attach();
        placeAll();
        qView.update(Q);
      },
      onLeave() { detach(); clearOverlays(); },
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

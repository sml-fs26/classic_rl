/* Scene 1 — Roll a die.
 *
 *   The board, with a small red token at square 1. Three big die buttons below.
 *   Click a die → roll animation, token slides along the board to the new
 *   square; if a snake or ladder triggers, the token glides along it.
 *   HUD shows turn count, current square, total reward (-turn).
 *
 *   Step engine: arrow keys rewind/replay via the History module. State is
 *   the source of truth — replays use captured seeds for determinism. Each
 *   click uses a fresh Mulberry32 RNG so the same recorded action produces
 *   the same roll.
 *
 *   Caption: "Pick a die at each turn. Notice that the 'right' die depends
 *   on where you are."
 */
(function () {
  if (!window.scenes) window.scenes = {};

  const DIE_IDS = ['d4', 'd6', 'd8'];

  /* Mulberry32 single-step: given a 32-bit seed, return the first sample.
     Used so a recorded (action, seed) pair replays the same roll. */
  function rollSeeded(seed, dieId) {
    let s = seed >>> 0;
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const u = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const sides = window.Dice.DICE[dieId].sides;
    return 1 + Math.floor(u * sides);
  }

  window.scenes.scene1 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene1-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Roll a die.</h1>' +
      '<p class="subtitle">Pick a die at each turn. Different state, different right answer.</p>';
    wrap.appendChild(hero);

    /* Layout: board on top, controls below. */
    const boardHost = document.createElement('div');
    boardHost.className = 'scene1-board';
    wrap.appendChild(boardHost);
    const board = window.Board.mount(boardHost);
    const cfg = (window.DATA && window.DATA.board) || { ladders: [], snakes: [] };
    board.drawJumps(cfg.snakes, cfg.ladders);

    /* HUD strip */
    const hud = document.createElement('div');
    hud.className = 'hud-strip';
    hud.innerHTML =
      '<div class="hud-item"><span class="hud-label">turn</span><span class="hud-val" id="hud-turn">0</span></div>' +
      '<div class="hud-item"><span class="hud-label">square</span><span class="hud-val" id="hud-square">1</span></div>' +
      '<div class="hud-item"><span class="hud-label">reward R</span><span class="hud-val" id="hud-reward">0</span></div>' +
      '<div class="hud-item"><span class="hud-label">last roll</span><span class="hud-val" id="hud-roll">—</span></div>';
    wrap.appendChild(hud);

    /* Die buttons */
    const dieBar = document.createElement('div');
    dieBar.className = 'die-bar';
    wrap.appendChild(dieBar);

    const dieBtns = {};
    for (const d of DIE_IDS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'die-btn die-' + d;
      btn.innerHTML =
        '<div class="die-label">' + d + '</div>' +
        '<div class="die-sub">mean ' + window.Dice.DICE[d].mean.toFixed(1) + '</div>' +
        '<div class="die-rolled" data-rolled></div>';
      dieBar.appendChild(btn);
      dieBtns[d] = btn;
    }
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'die-btn die-reset';
    resetBtn.innerHTML = '<div class="die-label">reset</div><div class="die-sub">start over</div><div class="die-rolled"></div>';
    dieBar.appendChild(resetBtn);

    /* Caption */
    const cap = document.createElement('p');
    cap.className = 'caption';
    cap.textContent =
      'The reward is −1 per turn. Reach 100 in as few turns as possible. ' +
      'For now, just feel the variance — the answer is in scene 2.';
    wrap.appendChild(cap);

    /* Footnote */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.innerHTML = 'Press <kbd>←</kbd>/<kbd>→</kbd> to step through your rolls.';
    wrap.appendChild(foot);

    /* --------- State ---------- */
    const history = window.History.create();
    let busy = false;     /* during animation */
    let square = 1;
    let turns = 0;

    function setHud() {
      document.getElementById('hud-turn').textContent = String(turns);
      document.getElementById('hud-square').textContent = String(square);
      const reward = (square >= 100) ? -turns : -turns;
      document.getElementById('hud-reward').textContent = String(reward);
    }
    function setLastRoll(d, r) {
      const el = document.getElementById('hud-roll');
      if (r == null) { el.textContent = '—'; return; }
      el.textContent = d + ' = ' + r;
    }

    function clearAllRolledLabels() {
      for (const d of DIE_IDS) {
        const el = dieBtns[d].querySelector('[data-rolled]');
        if (el) el.textContent = '';
      }
    }

    function disableButtons(v) {
      for (const d of DIE_IDS) dieBtns[d].disabled = v;
      resetBtn.disabled = v;
    }

    /* Compute the waypoint sequence for an action. The token glides
       through: (current square) → (landing square after roll) → (jump
       destination, if any). When overshooting, the landing equals the
       current square so the token just nudges in place. */
    function waypointsFor(s, rollAmt) {
      const raw = s + rollAmt;
      const landing = raw > 100 ? s : raw;
      const jumps = window.MDP.JUMPS;
      const dest = jumps[landing];
      const wp = [];
      if (landing !== s) wp.push(landing);
      if (dest !== landing) wp.push(dest);
      if (wp.length === 0) wp.push(s); /* edge case: should never happen */
      return wp;
    }

    async function playAction(action, seed) {
      busy = true;
      disableButtons(true);
      clearAllRolledLabels();
      const btn = dieBtns[action];
      if (btn) {
        btn.classList.remove('rolled');
        void btn.offsetWidth;
        btn.classList.add('rolled');
      }
      const rollAmt = rollSeeded(seed, action);
      /* Show rolled face on the button. */
      if (btn) btn.querySelector('[data-rolled]').textContent = String(rollAmt);
      setLastRoll(action, rollAmt);
      turns += 1;
      const wp = waypointsFor(square, rollAmt);
      await board.animateTokenPath(wp, { duration: 320 });
      square = wp[wp.length - 1];
      setHud();
      busy = false;
      disableButtons(false);
    }

    /* Re-establish state from the history cursor without animation. */
    function rebuildFromHistory() {
      square = 1;
      turns = 0;
      board.setToken(1, { animate: false });
      clearAllRolledLabels();
      setLastRoll(null, null);
      const list = history.list();
      for (const step of list) {
        const rollAmt = rollSeeded(step.seed, step.action);
        const wp = waypointsFor(square, rollAmt);
        square = wp[wp.length - 1];
        turns += 1;
      }
      board.setToken(square, { animate: false });
      /* Re-show the most recent rolled face. */
      if (list.length > 0) {
        const last = list[list.length - 1];
        const r = rollSeeded(last.seed, last.action);
        setLastRoll(last.action, r);
        const btn = dieBtns[last.action];
        if (btn) btn.querySelector('[data-rolled]').textContent = String(r);
      }
      setHud();
    }

    function reset() {
      if (busy) return;
      history.reset();
      rebuildFromHistory();
    }

    async function onRoll(d) {
      if (busy) return;
      if (square >= 100) return;
      const seed = (Math.random() * 0xFFFFFFFF) >>> 0;
      history.push(d, seed);
      await playAction(d, seed);
    }

    for (const d of DIE_IDS) {
      dieBtns[d].addEventListener('click', () => onRoll(d));
    }
    resetBtn.addEventListener('click', reset);

    /* Initial render. */
    rebuildFromHistory();

    return {
      onEnter() { rebuildFromHistory(); },
      onLeave() {},
      onNextKey() {
        if (busy) return true;
        if (history.atHead()) return false;
        /* Step forward through history: replay the next recorded action. */
        const i = history.cursor();
        const step = history.action(i);
        if (!step) return false;
        history.stepForward();
        /* Need to compute the from-square as of cursor i without animation,
           then animate that single step. We rebuild silently, then animate
           the last step. */
        square = 1;
        turns = 0;
        board.setToken(1, { animate: false });
        const list = history.list();
        for (let j = 0; j < list.length - 1; j++) {
          const r = rollSeeded(list[j].seed, list[j].action);
          const wp = waypointsFor(square, r);
          square = wp[wp.length - 1];
          turns += 1;
        }
        board.setToken(square, { animate: false });
        setHud();
        /* Animate the final step. */
        playAction(step.action, step.seed);
        return true;
      },
      onPrevKey() {
        if (busy) return true;
        if (history.atStart()) return false;
        history.stepBack();
        rebuildFromHistory();
        return true;
      },
    };
  };
})();

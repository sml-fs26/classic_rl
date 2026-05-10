/* Scene 1 — pull a lever.

   The student is the policy. Click any card or press 1..5 to pull. Reward
   animates: gold chip rises on a win, grey puff on a loss. Empirical mean
   updates live. The HUD shows round, total reward, and the manual goal
   (30 pulls) — but no regret yet. The whole point is for the student to
   *feel* the uncertainty before any algorithm is named.

   Step engine: ArrowLeft rewinds, ArrowRight replays; at head, ArrowRight
   advances to scene 2. */
(function () {
  if (!window.scenes) window.scenes = {};

  /* Number-row keys 1..K for direct arm selection. */
  const KEYMAP = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };

  window.scenes.scene1 = function (root) {
    const cfg  = window.DATA && window.DATA.bandit;
    const horz = window.DATA && window.DATA.horizons;
    const SEED = window.DATA && window.DATA.seeds && window.DATA.seeds.manual;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's1-wrap';
    root.appendChild(wrap);

    /* Header */
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Pull a lever.</h1>' +
      '<p class="subtitle">Click a card or press <kbd>1</kbd>–<kbd>5</kbd>. ' +
      'After ' + horz.manualGoal + ' pulls, ask yourself: which one is best?</p>';
    wrap.appendChild(hero);

    /* Two-column layout */
    const cols = document.createElement('div');
    cols.className = 'two-col';
    wrap.appendChild(cols);

    /* Left: machine row + caption */
    const leftCol = document.createElement('div');
    leftCol.className = 'col-stack';
    cols.appendChild(leftCol);

    const rowHost = document.createElement('div');
    leftCol.appendChild(rowHost);

    const caption = document.createElement('p');
    caption.className = 'caption';
    leftCol.appendChild(caption);

    /* Right: HUD with round, total reward, goal */
    const rightCol = document.createElement('div');
    rightCol.className = 'col-stack';
    cols.appendChild(rightCol);

    const empiricalFormula = Katex.display(window.DATA.tex.empirical);
    rightCol.appendChild(empiricalFormula);

    const hud = document.createElement('div');
    hud.className = 'hud';
    rightCol.appendChild(hud);

    const hudRows = makeHud(hud, [
      { key: 'round',  label: 'round' },
      { key: 'total',  label: 'total reward' },
      { key: 'goal',   label: 'goal' },
    ]);

    /* ---------- Bandit + History ---------- */
    let rng = Bandit.makeRng(SEED);
    let bandit = Bandit.create(cfg.probs, rng);
    const history = History.create();
    let active = false;

    /* Mount machine row */
    const row = MachineRow.mount(rowHost, {
      K: cfg.K,
      armNames: cfg.armNames,
    });
    row.setClickable((arm) => {
      if (!active) return;
      performPull(arm);
    });

    function setCaption() {
      const left = horz.manualGoal - bandit.round();
      if (left > 0) {
        caption.innerHTML =
          'Pull ' + left + ' more time' + (left === 1 ? '' : 's') +
          '. Notice how your idea of which machine is best changes as you watch the screens.';
      } else {
        caption.innerHTML =
          'Press <kbd>&rarr;</kbd> to continue. ' +
          'You can keep pulling — the lesson does not depend on the count.';
      }
    }

    function renderHud() {
      hudRows.round.textContent = bandit.round() + ' / ' + horz.manualGoal;
      hudRows.total.textContent = String(bandit.totalReward());
      const left = Math.max(0, horz.manualGoal - bandit.round());
      hudRows.goal.textContent = (left === 0)
        ? 'reached'
        : (left + ' pull' + (left === 1 ? '' : 's') + ' to go');
    }

    function performPull(arm) {
      const reward = bandit.pull(arm);
      history.push({ arm, reward, t: bandit.round() });
      row.update(bandit);
      row.flash(arm, reward === 1 ? 'win' : 'loss');
      renderHud();
      setCaption();
    }

    /* ---------- Reset + replay ---------- */
    function rebuildToCursor(targetCursor) {
      rng = Bandit.makeRng(SEED);
      bandit = Bandit.create(cfg.probs, rng);
      for (let i = 0; i < targetCursor; i++) {
        const rec = history.get(i);
        if (!rec) break;
        bandit.pull(rec.arm);   /* deterministic — same seed reproduces reward */
      }
      row.update(bandit);
      row.clearLastChosen();
      renderHud();
      setCaption();
    }

    function replayForwardOne() {
      const idx = history.cursor();
      const rec = history.get(idx);
      if (!rec) return false;
      const reward = bandit.pull(rec.arm);
      history.stepForward();
      row.update(bandit);
      row.flash(rec.arm, reward === 1 ? 'win' : 'loss');
      renderHud();
      setCaption();
      return true;
    }

    /* ---------- Keyboard ---------- */
    function onKey(e) {
      if (!active) return;
      if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const arm = KEYMAP[e.key];
      if (arm == null) return;
      if (arm >= cfg.K) return;
      e.preventDefault();
      performPull(arm);
    }
    window.addEventListener('keydown', onKey);

    /* ---------- Lifecycle ---------- */
    function onEnter() {
      history.reset();
      rebuildToCursor(0);
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
          return true;
        }
        return false;
      },
      onPrevKey() {
        if (history.atStart()) return false;
        history.stepBack();
        rebuildToCursor(history.cursor());
        return true;
      },
    };
  };

  /* Helper — build a HUD with the given rows; returns a map of key -> .hud-value
     element so the scene can update individual fields without re-rendering. */
  function makeHud(host, specs) {
    const out = {};
    for (const spec of specs) {
      const r = document.createElement('div');
      r.className = 'hud-row';
      r.dataset.key = spec.key;
      const lbl = document.createElement('span');
      lbl.className = 'hud-label';
      lbl.textContent = spec.label;
      const val = document.createElement('span');
      val.className = 'hud-value';
      val.textContent = '–';
      r.appendChild(lbl);
      r.appendChild(val);
      host.appendChild(r);
      out[spec.key] = val;
    }
    return out;
  }
})();

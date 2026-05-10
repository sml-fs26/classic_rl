/* Scene 1 — Explore or exploit?

   Merged from the original scenes 1 (manual play) and 2 (policy buttons) —
   they were structurally near-identical and the dilemma frames better as
   one scene. The student can pull manually (click a card or press 1..5)
   or invoke the two named policies via the EXPLORE / EXPLOIT buttons (or
   E / X). The two policy formulas anchor the language; both choices are
   visibly wrong sometimes, which is the dilemma scene 4 (ε-greedy)
   resolves.

   Step engine: ArrowLeft rewinds, ArrowRight replays; at head, ArrowRight
   advances scene. */
(function () {
  if (!window.scenes) window.scenes = {};

  /* Number-row keys 1..K for direct arm selection. */
  const KEYMAP = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };

  window.scenes.scene1 = function (root) {
    const cfg  = window.DATA && window.DATA.bandit;
    const SEED = window.DATA && window.DATA.seeds && window.DATA.seeds.manual;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's1-wrap';
    root.appendChild(wrap);

    /* Header */
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>Explore or exploit?</h1>' +
      '<p class="subtitle">Pick yourself, or let a policy pick. Both algorithmic choices alone are wrong sometimes.</p>';
    wrap.appendChild(hero);

    /* Two-column layout */
    const cols = document.createElement('div');
    cols.className = 'two-col';
    wrap.appendChild(cols);

    /* Left: machine row + policy buttons + caption */
    const leftCol = document.createElement('div');
    leftCol.className = 'col-stack';
    cols.appendChild(leftCol);

    const rowHost = document.createElement('div');
    leftCol.appendChild(rowHost);

    const actions = document.createElement('div');
    actions.className = 's2-actions';
    leftCol.appendChild(actions);

    const exploreBtn = document.createElement('button');
    exploreBtn.type = 'button';
    exploreBtn.className = 's2-policy-btn explore';
    exploreBtn.textContent = 'Explore';
    actions.appendChild(exploreBtn);

    const exploitBtn = document.createElement('button');
    exploitBtn.type = 'button';
    exploitBtn.className = 's2-policy-btn exploit';
    exploitBtn.textContent = 'Exploit';
    actions.appendChild(exploitBtn);

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.innerHTML =
      'Click any card or press <kbd>1</kbd>–<kbd>5</kbd> to pull manually. ' +
      'Or use <kbd>EXPLORE</kbd> / <kbd>EXPLOIT</kbd> (or <kbd>E</kbd> / <kbd>X</kbd>) to invoke a named policy.';
    leftCol.appendChild(caption);

    /* Right: two policy formulas + HUD */
    const rightCol = document.createElement('div');
    rightCol.className = 'col-stack';
    cols.appendChild(rightCol);

    const exploreFormula = document.createElement('div');
    exploreFormula.className = 's2-policy-block';
    const exploreLabel = document.createElement('div');
    exploreLabel.className = 's2-policy-label';
    exploreLabel.textContent = 'Explore';
    exploreFormula.appendChild(exploreLabel);
    exploreFormula.appendChild(Katex.display(window.DATA.tex.explore));
    rightCol.appendChild(exploreFormula);

    const exploitFormula = document.createElement('div');
    exploitFormula.className = 's2-policy-block';
    const exploitLabel = document.createElement('div');
    exploitLabel.className = 's2-policy-label';
    exploitLabel.textContent = 'Exploit';
    exploitFormula.appendChild(exploitLabel);
    exploitFormula.appendChild(Katex.display(window.DATA.tex.exploit));
    rightCol.appendChild(exploitFormula);

    const hud = document.createElement('div');
    hud.className = 'hud';
    rightCol.appendChild(hud);
    const hudRows = makeHud(hud, [
      { key: 'round',   label: 'round' },
      { key: 'total',   label: 'total reward' },
      { key: 'manual',  label: 'manual picks' },
      { key: 'explore', label: 'explore picks' },
      { key: 'exploit', label: 'exploit picks' },
    ]);

    /* ---------- Bandit + History ----------
       Two RNG streams so manual pulls don't perturb the policy stream.
       banditRng → Bernoulli reward sampling (consumed every pull).
       policyRng → uniform-random / tie-break (consumed only on explore
                   or exploit invocations). */
    let banditRng = Bandit.makeRng(SEED);
    let policyRng = Bandit.makeRng(SEED ^ 0x55555555);
    let bandit = Bandit.create(cfg.probs, banditRng);
    const history = History.create();
    let active = false;

    const row = MachineRow.mount(rowHost, {
      K: cfg.K,
      armNames: cfg.armNames,
    });
    row.setClickable((arm) => {
      if (!active) return;
      performPull('manual', arm);
    });

    function performPull(mode, manualArm) {
      let arm;
      if (mode === 'manual') {
        arm = manualArm;
      } else if (mode === 'explore') {
        arm = Policies.uniformRandom(policyRng, cfg.K);
      } else {
        arm = Policies.argMaxEmpirical(bandit, policyRng);
      }
      const reward = bandit.pull(arm);
      history.push({ arm, reward, mode, t: bandit.round() });
      row.update(bandit);
      row.flash(arm, reward === 1 ? 'win' : 'loss');
      row.setLastChosen(arm);
      renderHud();
    }

    function renderHud() {
      hudRows.round.textContent = String(bandit.round());
      hudRows.total.textContent = String(bandit.totalReward());
      let nManual = 0, nExplore = 0, nExploit = 0;
      const list = history.list();
      for (const r of list) {
        if (r.mode === 'manual') nManual++;
        else if (r.mode === 'explore') nExplore++;
        else nExploit++;
      }
      hudRows.manual.textContent  = String(nManual);
      hudRows.explore.textContent = String(nExplore);
      hudRows.exploit.textContent = String(nExploit);
    }

    /* ---------- Reset + replay ---------- */
    function rebuildToCursor(targetCursor) {
      banditRng = Bandit.makeRng(SEED);
      policyRng = Bandit.makeRng(SEED ^ 0x55555555);
      bandit = Bandit.create(cfg.probs, banditRng);
      for (let i = 0; i < targetCursor; i++) {
        const rec = history.get(i);
        if (!rec) break;
        let arm;
        if (rec.mode === 'manual')        arm = rec.arm;
        else if (rec.mode === 'explore')  arm = Policies.uniformRandom(policyRng, cfg.K);
        else                              arm = Policies.argMaxEmpirical(bandit, policyRng);
        bandit.pull(arm);
      }
      row.update(bandit);
      row.clearLastChosen();
      renderHud();
    }

    function replayForwardOne() {
      const idx = history.cursor();
      const rec = history.get(idx);
      if (!rec) return false;
      let arm;
      if (rec.mode === 'manual')        arm = rec.arm;
      else if (rec.mode === 'explore')  arm = Policies.uniformRandom(policyRng, cfg.K);
      else                              arm = Policies.argMaxEmpirical(bandit, policyRng);
      const reward = bandit.pull(arm);
      history.stepForward();
      row.update(bandit);
      row.flash(arm, reward === 1 ? 'win' : 'loss');
      row.setLastChosen(arm);
      renderHud();
      return true;
    }

    /* ---------- Listeners ---------- */
    exploreBtn.addEventListener('click', () => { if (active) performPull('explore'); });
    exploitBtn.addEventListener('click', () => { if (active) performPull('exploit'); });

    function onKey(e) {
      if (!active) return;
      if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); performPull('explore'); return; }
      if (e.key === 'x' || e.key === 'X') { e.preventDefault(); performPull('exploit'); return; }
      const arm = KEYMAP[e.key];
      if (arm == null) return;
      if (arm >= cfg.K) return;
      e.preventDefault();
      performPull('manual', arm);
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

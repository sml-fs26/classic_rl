/* Scene 5: THE TRAJECTORY.
 *
 *   A run of one account is a sequence of RANDOM VARIABLES laid out left
 *   to right:
 *
 *     tau = (S1, A1, R1,  S2, A2, R2,  ...)  ending RENEWED or CHURNED.
 *
 *   Manager meaning first: two identical accounts, handled the identical
 *   way, can still end differently. That is the retention coin, and it is
 *   why a single anecdote lies. We HOLD the start (lukewarm, 4 mo) and the
 *   PLAYBOOK fixed (a "check in every month" rule), so the ONLY thing that
 *   changes from run to run is how the coin and die land. The capitalised
 *   symbols Si / Ai / Ri are the visual cue that they are random.
 *
 *   Each turn renders as a TRIPLE: a mini account card (Si), a lever chip
 *   (Ai), and a reward box (Ri), so the eye maps each subscripted symbol
 *   in the formula to its own box. The triple's boxes fade in in order.
 *   On a terminal turn an extra RENEWED / CHURNED state box closes the
 *   tape. "RUN AGAIN" replays the SAME start + SAME playbook to expose the
 *   spread; a small tally counts renewals vs churns across replays.
 *
 *   Values come only from window.Churn (the live engine), never hand
 *   typed. The playbook is deliberately a fixed rule (not the optimal
 *   policy), since the best answer must not be shown before the learner
 *   has met it.
 */
(function () {
  window.scenes = window.scenes || {};

  const Churn = window.Churn;
  const Levers = window.Levers;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* The fixed playbook for this scene: a manager who "checks in every
     month". One lever for every situation, a complete (if naive) policy,
     so the run is reproducible up to the dice. We avoid the optimal policy
     here. */
  const PLAYBOOK_LEVER = 'checkin';
  const START = { tier: 2, m: 4, terminal: false };   // LUKEWARM, 4 mo

  function tierShort(tier) { return T('tier.short.' + Churn.TIERS[tier]); }
  function leverName(id) { return T('lever.' + id); }
  function leverShort(id) { return T('lever.short.' + id); }

  /* Roll ONE full episode under the fixed playbook from a given rng.
     Returns the per-turn log the tape renders from. */
  function rollEpisode(rng) {
    let s = { tier: START.tier, m: START.m, terminal: false };
    const turns = [];
    for (let guard = 0; guard < 12; guard++) {
      const out = Churn.sample(s, PLAYBOOK_LEVER, rng);
      turns.push({
        fromTier: out.log.fromTier,
        fromM: out.log.fromM,
        lever: PLAYBOOK_LEVER,
        reward: out.reward,
        toTier: out.log.toTier,
        toM: out.log.toM,
        renewed: out.renewed,
        churned: out.churned,
        terminal: out.terminal,
      });
      if (out.terminal) break;
      s = out.sNext;
    }
    return turns;
  }

  /* A mini account card as a self-contained box (its own AccountCard mount
     so the recurring state-icon is identical to every other scene). */
  function stateBox(step, tier, m, label, terminalKind) {
    const box = document.createElement('div');
    box.className = 'traj-box traj-box-state';
    if (terminalKind) box.classList.add(terminalKind === 'renewed' ? 'renewed' : 'churned');

    const lab = document.createElement('div');
    lab.className = 'traj-box-label';
    lab.innerHTML = label;
    box.appendChild(lab);

    if (terminalKind) {
      const tag = document.createElement('div');
      tag.className = 'traj-terminal-card ' + (terminalKind === 'renewed' ? 'renewed' : 'churned');
      tag.innerHTML =
        '<div class="traj-terminal-glyph">' + (terminalKind === 'renewed' ? '✓' : '✗') + '</div>' +
        '<div class="traj-terminal-name">' + T(terminalKind === 'renewed' ? 'terminal.renewed' : 'terminal.churned') + '</div>';
      box.appendChild(tag);
    } else {
      const cardHost = document.createElement('div');
      box.appendChild(cardHost);
      window.AccountCard.mount(cardHost, { tier: tier, m: m, size: 'mini' });
      const mlab = document.createElement('div');
      mlab.className = 'traj-box-m';
      mlab.textContent = T('months.short', { n: m });
      box.appendChild(mlab);
    }
    return box;
  }

  /* An action box: the lever chip the playbook pulled this turn. */
  function actionBox(step, leverId) {
    const box = document.createElement('div');
    box.className = 'traj-box traj-box-action';
    box.innerHTML =
      '<div class="traj-box-label">A<sub>' + step + '</sub></div>' +
      '<div class="traj-chip ' + Levers.tokenClass(leverId) + '">' +
        Levers.leverIconSvg(leverId) + ' ' + leverShort(leverId) +
      '</div>';
    return box;
  }

  /* A reward box: minus the cost this month, or the terminal lump folded
     in (minus cost plus/minus 20). */
  function rewardBox(step, reward, terminalKind) {
    const box = document.createElement('div');
    box.className = 'traj-box traj-box-reward';
    if (terminalKind) box.classList.add(terminalKind === 'renewed' ? 'renewed' : 'churned');
    const sign = reward >= 0 ? '+' : '−';
    box.innerHTML =
      '<div class="traj-box-label">R<sub>' + step + '</sub></div>' +
      '<div class="traj-box-reward-body">' + sign + Math.abs(reward) + '</div>';
    return box;
  }

  window.scenes.scene5 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'scene5-scene');
    root.innerHTML = '';

    /* ---- heading + manager hook ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene.title5');
    root.appendChild(heading);

    const hook = document.createElement('div');
    hook.className = 'concept-hook';
    hook.innerHTML = T('scene5.manager');
    root.appendChild(hook);

    /* ---- formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene5.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`\tau \;=\; (\,S_1, A_1, R_1,\;\; S_2, A_2, R_2,\;\; S_3, A_3, R_3,\;\; \dots\,)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene5.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- the fixed setup line (start + playbook) ---- */
    const setup = document.createElement('div');
    setup.className = 'traj-setup poke-box tight';
    setup.innerHTML =
      '<span class="traj-setup-item">' + T('scene5.setup.start') +
        ' <b>' + tierShort(START.tier) + ' · ' + T('months.short', { n: START.m }) + '</b></span>' +
      '<span class="traj-setup-sep">·</span>' +
      '<span class="traj-setup-item">' + T('scene5.setup.playbook') +
        ' <b class="' + Levers.tokenClass(PLAYBOOK_LEVER) + '">' + leverName(PLAYBOOK_LEVER) + '</b> ' +
        T('scene5.setup.everymonth') + '</span>';
    root.appendChild(setup);

    /* ---- rollout tape ---- */
    const rollout = document.createElement('div');
    rollout.className = 'traj-rollout';
    rollout.innerHTML = '<div class="traj-empty">' + T('scene5.empty') + '</div>';
    root.appendChild(rollout);

    /* ---- controls + replay tally ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 'traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="traj-run">' + T('scene5.btn.run') + '</button>' +
      '<button class="poke-btn" id="traj-again">' + T('scene5.btn.again') + '</button>' +
      '<div class="traj-tally" id="traj-tally"></div>';
    root.appendChild(ctrls);

    /* ---- punchline (revealed after >= 2 runs) ---- */
    const punch = document.createElement('div');
    punch.className = 'concept-key-question traj-punch';
    punch.innerHTML = T('scene5.punch');
    punch.style.visibility = 'hidden';
    root.appendChild(punch);

    /* ---- state ---- */
    let seedBase = (0x5C0FF + Math.floor(Math.random() * 0xFFFF)) >>> 0;
    let runCount = 0;
    let renewals = 0;
    let churns = 0;
    let revealTimers = [];
    let playing = false;

    function clearTimers() {
      revealTimers.forEach((t) => clearTimeout(t));
      revealTimers = [];
    }

    function updateTally() {
      const tally = document.getElementById('traj-tally');
      if (!tally) return;
      if (runCount === 0) { tally.innerHTML = ''; return; }
      tally.innerHTML =
        '<span class="traj-tally-lab">' + T('scene5.tally.label', { n: runCount }) + '</span> ' +
        '<span class="traj-tally-pill renewed">' + T('terminal.renewed') + ' ' + renewals + '</span> ' +
        '<span class="traj-tally-pill churned">' + T('terminal.churned') + ' ' + churns + '</span>';
    }

    /* Render one episode's turns into the tape, fading the triples in in
       sequence so the run "unspools" left to right. */
    function renderEpisode(turns, onDone) {
      clearTimers();
      rollout.innerHTML = '';
      playing = true;

      let delay = 0;
      const STEP = 240;          // gap between triples
      turns.forEach((turn, i) => {
        const step = i + 1;
        const t = setTimeout(() => {
          const group = document.createElement('div');
          group.className = 'traj-group';
          group.appendChild(stateBox(step, turn.fromTier, turn.fromM, 'S<sub>' + step + '</sub>'));
          group.appendChild(actionBox(step, turn.lever));
          const termKind = turn.renewed ? 'renewed' : (turn.churned ? 'churned' : null);
          group.appendChild(rewardBox(step, turn.reward, termKind));
          rollout.appendChild(group);

          /* On the terminal turn append the closing state box. */
          if (turn.terminal) {
            const closeGroup = document.createElement('div');
            closeGroup.className = 'traj-group traj-group-final';
            closeGroup.appendChild(
              stateBox(step + 1, 0, 0,
                'S<sub>' + (step + 1) + '</sub> <span class="traj-box-mini-tag">' + T('terminal.mini') + '</span>',
                termKind)
            );
            rollout.appendChild(closeGroup);
            if (window.SFX) window.SFX.play(turn.renewed ? 'win' : 'hit');
          }
          rollout.scrollLeft = rollout.scrollWidth;
        }, delay);
        revealTimers.push(t);
        delay += STEP;
      });

      const fin = setTimeout(() => {
        playing = false;
        if (onDone) onDone();
      }, delay + 120);
      revealTimers.push(fin);
    }

    function doRun() {
      if (playing) { clearTimers(); playing = false; }
      seedBase = (seedBase + 0x9E3779B1) >>> 0;
      const rng = Churn.makeRng(seedBase);
      const turns = rollEpisode(rng);
      const last = turns[turns.length - 1];
      runCount++;
      if (last && last.renewed) renewals++;
      else if (last && last.churned) churns++;
      renderEpisode(turns, () => {
        updateTally();
        if (runCount >= 2) punch.style.visibility = 'visible';
      });
      updateTally();
    }

    document.getElementById('traj-run').addEventListener('click', doRun);
    document.getElementById('traj-again').addEventListener('click', doRun);

    /* &run: auto-roll a couple of episodes for headless capture so the
       tape (and the spread) are populated in the screenshot. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      setTimeout(doRun, 150);
      setTimeout(doRun, 1700);
    }

    return {
      onLeave() { clearTimers(); playing = false; },
      /* Right arrow = run one more episode (open-ended, like the button).
         Advancing scenes is the topbar NEXT. */
      onNextKey() { doRun(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

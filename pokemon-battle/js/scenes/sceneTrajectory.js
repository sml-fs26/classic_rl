/* Scene — the trajectory.
 *
 *   τ = (s₁, a₁, r₁, s₂, a₂, r₂, …)  — a sequence of random variables.
 *
 *   Visual: per turn we emit THREE side-by-side boxes — one for sᵢ,
 *   one for aᵢ, one for rᵢ — so the viewer can do a one-to-one mental
 *   mapping from each subscripted symbol in the formula to its own
 *   box. Boxes within a turn share a .traj-group wrapper (tight gap);
 *   wider gap between turn groups so triples stay visually clustered.
 *
 *   Inside each turn the three boxes fade in in order (s → a → r,
 *   ~120 ms apart) so the eye also traces the temporal order, mirroring
 *   how an agent sees-then-acts-then-receives-reward.
 *
 *   Cross-viz hue identity carries the box type:
 *     s — red border (ANYmal / MDP state)
 *     a — blue border (Casino / action picker)
 *     r — purple border (Spooky / Bellman target)
 *   plus the box label "sᵢ" / "aᵢ" / "rᵢ" itself, so the type is
 *   readable without relying on colour.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;
  const ACTIONS = window.Moves.MOVE_IDS;
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  function bucketName(b) { return b >= NB ? T('hp.bucket.faint_short') : T('hp.bucket.' + BUCKETS[b]); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function moveName(id) { return T('move.' + id); }

  /* Render one turn as THREE boxes (sᵢ, aᵢ, rᵢ) wrapped in a .traj-group.
     `step` is the i-index; `sBefore` is the pre-action state; `aId` is
     the action just taken; `r` is the resulting reward; `terminal`
     flags whether this turn ends the run; `won` is the win/loss flag
     when terminal. */
  function renderTriple(host, step, sBefore, aId, r, terminal, won) {
    const yourBucket = sBefore.your === undefined ? 0 : sBefore.your;
    const oppBucket  = sBefore.opp  === undefined ? 0 : sBefore.opp;

    const group = document.createElement('div');
    group.className = 'traj-group';

    /* sᵢ — STATE box */
    const sBox = document.createElement('div');
    sBox.className = 'traj-box traj-box-state';
    sBox.style.animationDelay = '0ms';
    sBox.innerHTML =
      '<div class="traj-box-label">s<sub>' + step + '</sub></div>' +
      '<div class="traj-box-state-body">' +
        '<div class="traj-box-side">' +
          '<img class="traj-box-sprite" src="assets/pikachu-back.png" alt="">' +
          '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(yourBucket) + '" style="width:' + bucketPct(yourBucket) + '%"></div></div>' +
          '<div class="traj-box-bucket">' + bucketName(yourBucket) + '</div>' +
        '</div>' +
        '<div class="traj-box-side">' +
          '<img class="traj-box-sprite" src="' + window.Battle.spriteForOpp(oppBucket) + '" alt="' + window.Battle.displayNameForOpp(oppBucket) + '">' +
          '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(oppBucket) + '" style="width:' + bucketPct(oppBucket) + '%"></div></div>' +
          '<div class="traj-box-bucket">' + bucketName(oppBucket) + '</div>' +
        '</div>' +
      '</div>';
    group.appendChild(sBox);

    /* aᵢ — ACTION box */
    const aBox = document.createElement('div');
    aBox.className = 'traj-box traj-box-action';
    aBox.style.animationDelay = '120ms';
    aBox.innerHTML =
      '<div class="traj-box-label">a<sub>' + step + '</sub></div>' +
      '<div class="traj-box-action-body">' + (aId ? moveName(aId) : T('battle.hud.dash')) + '</div>';
    group.appendChild(aBox);

    /* rᵢ — REWARD box. Terminal gets the colour-blind blue/vermillion
       border plus a ✓ WIN / ✗ LOSS glyph so the outcome is legible
       from either channel alone. */
    const rBox = document.createElement('div');
    rBox.className = 'traj-box traj-box-reward';
    if (terminal) rBox.classList.add(won ? 'win' : 'loss');
    rBox.style.animationDelay = '240ms';
    const sign = r >= 0 ? '+' : '';
    let inner =
      '<div class="traj-box-label">r<sub>' + step + '</sub></div>' +
      '<div class="traj-box-reward-body">' + sign + r + '</div>';
    if (terminal) {
      inner += '<div class="traj-box-terminal-tag">' + (won ? T('terminal.win') : T('terminal.loss')) + '</div>';
    }
    rBox.innerHTML = inner;
    group.appendChild(rBox);

    host.appendChild(group);

    /* On a terminal turn, append an extra group with the final state
       s_{N+1} so the trajectory visually closes — without this, the
       last triple stops at the pre-action state (e.g. PIKACHU at
       CRITICAL) and the reward (-10) hangs in mid-air. */
    if (terminal) {
      const finalGroup = document.createElement('div');
      finalGroup.className = 'traj-group';

      const sFinalBox = document.createElement('div');
      sFinalBox.className = 'traj-box traj-box-state traj-box-state-final';
      sFinalBox.classList.add(won ? 'win' : 'loss');
      sFinalBox.style.animationDelay = '360ms';

      /* On WIN: PIKACHU keeps its HP, CHARMANDER faints.
         On LOSS: PIKACHU faints, CHARMANDER keeps its HP. */
      const pikaFainted = !won;
      const charmFainted = won;
      const pikaBucket  = pikaFainted  ? NB : yourBucket;
      const charmBucket = charmFainted ? NB : oppBucket;

      function sideHtml(spriteSrc, bucket, fainted) {
        const cls = fainted ? 'b4' : bucketClass(bucket);
        const pct = fainted ? 0    : bucketPct(bucket);
        return (
          '<div class="traj-box-side">' +
            '<img class="traj-box-sprite ' + (fainted ? 'fainted' : '') + '" src="' + spriteSrc + '" alt="">' +
            '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
            '<div class="traj-box-bucket">' + (fainted ? T('hp.bucket.faint_short') : bucketName(bucket)) + '</div>' +
          '</div>'
        );
      }

      sFinalBox.innerHTML =
        '<div class="traj-box-label">s<sub>' + (step + 1) + '</sub> <span class="traj-box-terminal-mini">' + T('terminal.mini') + '</span></div>' +
        '<div class="traj-box-state-body">' +
          sideHtml('assets/pikachu-back.png',     pikaBucket,  pikaFainted) +
          sideHtml(window.Battle.spriteForOpp(Math.min(NB - 1, charmBucket)), charmBucket, charmFainted) +
        '</div>';
      finalGroup.appendChild(sFinalBox);
      host.appendChild(finalGroup);
    }

    /* Scroll the rollout so the latest triple is always visible. */
    setTimeout(() => host.scrollLeft = host.scrollWidth, 280);
  }

  window.scenes.sceneTrajectory = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('traj.heading');
    root.appendChild(heading);

    /* Formula card */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('traj.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`\tau = (s_1, a_1, r_1, \; s_2, a_2, r_2, \; s_3, a_3, r_3, \; \dots)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = T('traj.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* Rollout panel */
    const rollout = document.createElement('div');
    rollout.className = 'traj-rollout';
    root.appendChild(rollout);

    /* Controls */
    const ctrls = document.createElement('div');
    ctrls.className = 'traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="traj-step">' + T('traj.btn.step')  + '</button>' +
      '<button class="poke-btn" id="traj-play">' + T('traj.btn.play')  + '</button>' +
      '<button class="poke-btn" id="traj-reset">' + T('traj.btn.reset') + '</button>' +
      '<div class="traj-status">' + T('traj.status.step') + ' <b id="traj-status-i">0</b> · ' +
        '<span id="traj-status-state">' + T('hp.bucket.full') + ' / ' + T('hp.bucket.full') + '</span></div>';
    root.appendChild(ctrls);

    /* ---- State ---- */
    let rng = window.Battle.makeRng(0x1234);
    let s = window.Battle.initialState();
    let stepIdx = 1;
    let done = false;
    let playTimer = null;

    function reset() {
      stopPlay();
      rng = window.Battle.makeRng(0x1234 + Math.floor(Math.random() * 65535));
      s = window.Battle.initialState();
      stepIdx = 1;
      done = false;
      rollout.innerHTML = '';
      updateStatus();
    }

    function stopPlay() {
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
    }

    function nextTurn() {
      if (done) { reset(); return; }
      /* Random uniform action — this scene is about the trajectory, not
         the policy. ε=1 effectively. */
      const aIdx = Math.floor(rng() * ACTIONS.length);
      const aId  = ACTIONS[aIdx];
      const sBefore = { your: s.your, opp: s.opp };
      const out = window.Battle.sample(s, aId, rng);
      renderTriple(rollout, stepIdx, sBefore, aId, out.reward, out.terminal, out.win);
      stepIdx++;
      if (out.terminal) {
        done = true;
      } else {
        s = out.sNext;
      }
      updateStatus();
    }

    function updateStatus() {
      document.getElementById('traj-status-i').textContent = String(stepIdx - 1);
      const stateEl = document.getElementById('traj-status-state');
      if (done) {
        stateEl.textContent = T('traj.status.over');
      } else {
        stateEl.textContent = bucketName(s.your) + ' / ' + bucketName(s.opp);
      }
    }

    function play() {
      stopPlay();
      playTimer = setInterval(() => {
        nextTurn();
        if (done) stopPlay();
      }, 650);
    }

    document.getElementById('traj-step').addEventListener('click', nextTurn);
    document.getElementById('traj-play').addEventListener('click', play);
    document.getElementById('traj-reset').addEventListener('click', reset);

    updateStatus();

    /* &run: auto-play for headless screenshots. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(play, 200);

    return {
      onEnter() { updateStatus(); },
      onLeave() { stopPlay(); },
      /* Right arrow = "do one more turn" (matches the NEXT TURN button).
         The loop is open-ended; to advance to the next scene the
         student clicks the NEXT button in the topbar. */
      onNextKey() { stopPlay(); nextTurn(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

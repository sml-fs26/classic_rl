/* Scene 5 - THE TRAJECTORY.
 *
 *   One full game, written down move by move, as a tape of RANDOM
 *   VARIABLES:
 *
 *     tau = (S_1, A_1, R_1,  S_2, A_2, R_2,  ...,  S_T)
 *
 *   Capital letters because every entry was a roll of the die before it
 *   happened. The recurring table-card (pot meter + standing badge)
 *   marches LEFT along a rollout tape: situation S_i, lever A_i, reward
 *   R_i, next situation - through busts and banks until someone crosses
 *   the target. Rewards are 0 every turn until the terminal +1 (I win) or
 *   0 (the rival wins). MANAGER MEANING first: a run is a sequence, and
 *   the SAME playbook from the SAME start reads completely differently
 *   every time the die falls differently.
 *
 *   Each MY-turn emits three boxes wrapped in a .traj-group so the eye
 *   maps each subscripted symbol in the formula to its own box:
 *     S_i - a mini table-card (pot meter + standing badge)  [orange seam]
 *     A_i - the lever I pulled (ROLL / HOLD)                [lever colour]
 *     R_i - the reward (0 until the terminal +1)            [reward box]
 *   The rival's whole fixed-rule turn collapses into one compact
 *   interlude box (the turn passes; the part you do not control).
 *
 *   We REPLAY THE REAL GAME via window.Pig: I follow the optimal playbook
 *   (Q*) and the fixed rival ("holds at 20") answers each time my turn
 *   ends. STEP plays one of my turns (auto-resolving the rival after a
 *   HOLD / bust); PLAY auto-advances; NEW GAME reseeds so the die falls
 *   differently. &run auto-plays for headless capture.
 */
(function () {
  window.scenes = window.scenes || {};

  const Pig = window.Pig;
  const NB = Pig.POT_BUCKETS;                 // 6
  const DANGER_BUCKET = NB - 1;               // bucket 5 = "21+" = past 20
  const POT_LABELS = Pig.POT_BUCKET_LABELS;
  const STAND_CLASS = ['behind', 'even', 'ahead'];
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  function leverName(id) { return T('vocab.' + id); }        // ROLL / HOLD
  function standName(st) { return T('vocab.' + STAND_CLASS[st]); }

  /* A lightweight inline "mini table-card" for a state box: the pot-meter
     chip stack (height = pot bucket, red danger band past 20) on the left,
     the two-bar standing badge (you vs rival, tinted) on the right. Shares
     the table-card CSS tokens without mounting the full widget per box. */
  function miniCardHtml(my, riv, pot, target) {
    const pb = Pig.bucketOfPot(pot);
    const st = Pig.standingOf(my, riv);
    const tg = target || Pig.TARGET;

    /* Pot meter: rows stacked top(danger) -> bottom, lit up to pb. */
    let rows = '';
    for (let b = NB - 1; b >= 1; b--) {
      const on = b <= pb ? ' tc-chip-on' : '';
      const danger = b >= DANGER_BUCKET ? ' tc-chip-danger' : '';
      rows += '<div class="tc-chip-row' + danger + on + '"></div>';
    }
    const potDanger = pb >= DANGER_BUCKET ? ' tc-pot-danger' : '';
    const meter =
      '<div class="tc-pot-meter' + potDanger + '">' + rows +
        '<div class="tc-pot-label">' + POT_LABELS[pb] + '</div>' +
      '</div>';

    const pct = (v) => Math.max(0, Math.min(100, (v / tg) * 100));
    const badge =
      '<div class="tc-standing-badge tc-stand-' + STAND_CLASS[st] + '">' +
        '<div class="tc-bar-row tc-bar-you">' +
          '<span class="tc-bar-tag">' + T('vocab.you') + '</span>' +
          '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-you" style="width:' + pct(my) + '%"></span></span>' +
          '<span class="tc-bar-num tc-num-you">' + my + '</span>' +
        '</div>' +
        '<div class="tc-bar-row tc-bar-riv">' +
          '<span class="tc-bar-tag">' + T('vocab.rival') + '</span>' +
          '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-riv" style="width:' + pct(riv) + '%"></span></span>' +
          '<span class="tc-bar-num tc-num-riv">' + riv + '</span>' +
        '</div>' +
        '<div class="tc-standing-tag">' + standName(st) + '</div>' +
      '</div>';

    return '<div class="table-card table-card-compact traj-mini-card">' + meter + badge + '</div>';
  }

  window.scenes.scene5 = function (root) {
    root.className = 'scene-pad concept-scene';
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene5.heading');
    root.appendChild(heading);

    const lede = document.createElement('div');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene5.lede');
    root.appendChild(lede);

    /* ---- Formula card: the trajectory as a sequence of random vars ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene5.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`\tau = (\,S_1, A_1, R_1,\; S_2, A_2, R_2,\; \dots,\; S_T\,)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = T('scene5.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Rollout tape ---- */
    const rollout = document.createElement('div');
    rollout.className = 'traj-rollout pyl-traj-rollout';
    root.appendChild(rollout);

    /* ---- Controls + status ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 'traj-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="traj-step">' + T('scene5.btn.step') + '</button>' +
      '<button class="poke-btn" id="traj-play">' + T('scene5.btn.play') + '</button>' +
      '<button class="poke-btn" id="traj-new">' + T('scene5.btn.new') + '</button>' +
      '<div class="traj-status">' +
        T('scene5.status.turns') + ' <b id="traj-turns">0</b>' +
        ' &middot; <span id="traj-state">' + T('scene5.status.fresh') + '</span>' +
      '</div>';
    root.appendChild(ctrls);

    const caption = document.createElement('div');
    caption.className = 'poke-caption pyl-traj-caption';
    caption.textContent = T('scene5.caption');
    root.appendChild(caption);

    /* ---- Replay state ---- */
    let seed = 0xBEEF;
    let rng = Pig.makeRng(seed);
    let s = Pig.initialState();           // {my, riv, pot, turn:'me', terminal}
    let stepIdx = 1;                      // the i-subscript on the next emitted turn
    let myTurns = 0;                      // count of MY turns played (for status)
    let done = false;
    let playTimer = null;

    function reset(newSeed) {
      stopPlay();
      seed = newSeed != null ? newSeed : ((seed * 1103515245 + 12345) >>> 0);
      rng = Pig.makeRng(seed);
      s = Pig.initialState();
      stepIdx = 1;
      myTurns = 0;
      done = false;
      rollout.innerHTML = '';
      updateStatus();
    }
    function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; } }

    /* Append one MY turn: S_i, A_i, R_i (+ a closing S_{T} on terminal). */
    function emitMyTurn(sBefore, leverId, out) {
      const group = document.createElement('div');
      group.className = 'traj-group';

      /* S_i - state box (mini table-card). */
      const sBox = document.createElement('div');
      sBox.className = 'traj-box traj-box-state';
      sBox.style.animationDelay = '0ms';
      sBox.innerHTML =
        '<div class="traj-box-label">S<sub>' + stepIdx + '</sub></div>' +
        miniCardHtml(sBefore.my, sBefore.riv, sBefore.pot, Pig.TARGET);
      group.appendChild(sBox);

      /* A_i - lever box (ROLL / HOLD), lever-coloured. */
      const aBox = document.createElement('div');
      aBox.className = 'traj-box traj-box-action traj-act-' + leverId;
      aBox.style.animationDelay = '110ms';
      aBox.innerHTML =
        '<div class="traj-box-label">A<sub>' + stepIdx + '</sub></div>' +
        '<div class="traj-box-action-body">' + leverName(leverId) +
          (out.log && out.log.busted ? '<span class="traj-bust-flag">' + T('vocab.bust') + '!</span>' : '') +
        '</div>';
      group.appendChild(aBox);

      /* R_i - reward box (0 until the terminal +1). */
      const rBox = document.createElement('div');
      rBox.className = 'traj-box traj-box-reward';
      if (out.terminal) rBox.classList.add(out.win ? 'win' : 'loss');
      rBox.style.animationDelay = '220ms';
      let inner =
        '<div class="traj-box-label">R<sub>' + stepIdx + '</sub></div>' +
        '<div class="traj-box-reward-body">' + (out.reward > 0 ? '+1' : '0') + '</div>';
      if (out.terminal) {
        inner += '<div class="traj-box-terminal-tag">' + (out.win ? T('vocab.win') : T('vocab.lose')) + '</div>';
      }
      rBox.innerHTML = inner;
      group.appendChild(rBox);

      rollout.appendChild(group);
      stepIdx++;

      /* On terminal: append the closing S_T (the final, absorbing
         situation) so the tape visibly closes. */
      if (out.terminal) {
        const fin = document.createElement('div');
        fin.className = 'traj-group';
        const fBox = document.createElement('div');
        fBox.className = 'traj-box traj-box-state traj-box-state-final ' + (out.win ? 'win' : 'loss');
        fBox.style.animationDelay = '330ms';
        const fs = out.sNext;
        fBox.innerHTML =
          '<div class="traj-box-label">S<sub>' + stepIdx + '</sub> ' +
            '<span class="traj-box-terminal-mini">' + T('scene5.terminal.mini') + '</span></div>' +
          miniCardHtml(fs.my, fs.riv, 0, Pig.TARGET);
        fin.appendChild(fBox);
        rollout.appendChild(fin);
      }
      scrollEnd();
    }

    /* Append the rival's whole fixed-rule turn as one compact interlude. */
    function emitRivalTurn(before, after) {
      const box = document.createElement('div');
      box.className = 'traj-box traj-box-rival';
      box.style.animationDelay = '0ms';
      const gained = after.riv - before.riv;
      box.innerHTML =
        '<div class="traj-box-label">' + T('scene5.rival.label') + '</div>' +
        '<div class="traj-rival-body">' +
          '<div class="traj-rival-icon">' + diceGlyph() + '</div>' +
          '<div class="traj-rival-note">' +
            (gained > 0
              ? T('scene5.rival.banked', { n: gained })
              : T('scene5.rival.busted')) +
          '</div>' +
        '</div>';
      rollout.appendChild(box);
      scrollEnd();
    }

    function diceGlyph() {
      /* A tiny inline die face (the part you do not control). */
      return '<span class="traj-die-mini">' +
        '<span class="dp on"></span><span class="dp"></span><span class="dp on"></span>' +
        '<span class="dp"></span><span class="dp on"></span><span class="dp"></span>' +
        '<span class="dp on"></span><span class="dp"></span><span class="dp on"></span>' +
        '</span>';
    }

    function scrollEnd() { setTimeout(() => { rollout.scrollLeft = rollout.scrollWidth; }, 60); }

    /* Play exactly ONE of my turns: choose the optimal lever, sample it,
       render the triple. If my turn ends (HOLD or bust) and the game is
       not over, immediately resolve the rival's whole turn so the tape
       reads as a full back-and-forth game. */
    function nextTurn() {
      if (done) { reset(); return; }

      const sBefore = { my: s.my, riv: s.riv, pot: s.pot };
      const q = Pig.Q(s.my, s.riv, s.pot);
      const leverId = q.roll >= q.hold ? 'roll' : 'hold';
      const out = Pig.sample(s, leverId, rng);
      myTurns++;
      emitMyTurn(sBefore, leverId, out);

      if (out.terminal) { done = true; updateStatus(); return; }

      if (out.sNext.turn === 'rival') {
        /* My turn ended (HOLD or bust). Run the rival's whole turn. */
        const beforeRiv = { my: out.sNext.my, riv: out.sNext.riv };
        const rt = Pig.rivalTurn(out.sNext.my, out.sNext.riv, rng);
        emitRivalTurn(beforeRiv, rt);
        if (rt.rivalWon) {
          /* Close the tape with a terminal LOSS state box. */
          const fin = document.createElement('div');
          fin.className = 'traj-group';
          const fBox = document.createElement('div');
          fBox.className = 'traj-box traj-box-state traj-box-state-final loss';
          fBox.innerHTML =
            '<div class="traj-box-label">S<sub>' + stepIdx + '</sub> ' +
              '<span class="traj-box-terminal-mini">' + T('scene5.terminal.mini') + '</span></div>' +
            miniCardHtml(rt.my, rt.riv, 0, Pig.TARGET);
          fin.appendChild(fBox);
          rollout.appendChild(fin);
          scrollEnd();
          done = true;
          updateStatus();
          return;
        }
        s = { my: rt.my, riv: rt.riv, pot: 0, turn: 'me', terminal: false };
      } else {
        /* A non-bust roll: my turn continues at the grown pot. */
        s = out.sNext;
      }
      updateStatus();
    }

    function updateStatus() {
      const tEl = document.getElementById('traj-turns');
      const sEl = document.getElementById('traj-state');
      if (tEl) tEl.textContent = String(myTurns);
      if (!sEl) return;
      if (done) {
        sEl.textContent = T('scene5.status.over');
      } else {
        sEl.textContent = T('scene5.status.now', {
          pot: POT_LABELS[Pig.bucketOfPot(s.pot)],
          stand: standName(Pig.standingOf(s.my, s.riv)),
        });
      }
    }

    function play() {
      stopPlay();
      playTimer = setInterval(() => {
        nextTurn();
        if (done) stopPlay();
      }, 600);
    }

    document.getElementById('traj-step').addEventListener('click', nextTurn);
    document.getElementById('traj-play').addEventListener('click', play);
    document.getElementById('traj-new').addEventListener('click', () => reset());

    updateStatus();

    /* &run: auto-play a full game for headless capture. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(play, 200);

    return {
      onEnter() { updateStatus(); },
      onLeave() { stopPlay(); },
      /* Right arrow = "do one more turn" (matches STEP). The loop is
         open-ended; advance scenes with the topbar NEXT. */
      onNextKey() { stopPlay(); nextTurn(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

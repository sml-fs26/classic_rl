/* Scene 2 -- PLAYTEST: "You run the deal".
 *
 *   The learner IS the sales rep. From a fresh COLD lead they pick ONE lever
 *   each touch; the
 *   shared STAGE DIE rolls UP / STAY / DOWN (window.Pipeline.sample drives the
 *   randomness, the die shows it); the LadderCard advances or cools a rung; a
 *   running RETURN ticks (-1 per touch, +30 SIGNED, -10 LOST); a step lands on
 *   the RETURN tape. The episode ends one of two ways: a signature (SIGNED) or
 *   the lead drops out (LOST). Then a summary lands with the total and a PLAY
 *   AGAIN control that resets to COLD.
 *
 *   The STAGE DIE odds stay HIDDEN -- the rep feels them out by playing, two
 *   identical openings end differently. No optimal lever is shown.
 *
 *   Each touch is recorded on a window.History tape as { action: leverId,
 *   seed }, and every touch draws from its own seed so the run replays
 *   deterministically; the RETURN tape is rendered straight off that log.
 *
 *   Cold-entry safe: rebuilds from window.Pipeline / window.Levers /
 *   window.LadderCard / window.StageDie / window.Dialog. &run (the headless
 *   capture) seeds a fixed run and clicks the DEMO lever once via
 *   [data-run-primary] to pull a single live touch into the screenshot.
 *
 * Registers window.scenes.scene2 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  window.scenes.scene2 = function (root) {
    const P = window.Pipeline;
    const L = window.Levers;

    root.classList.add('scene-pad', 'scene2-scene');
    root.innerHTML = '';

    /* &run headless capture: fixed seed + collapsed choreography so the whole
       sequence settles inside the screenshot budget. */
    const RUN = /[#&?]run\b/.test(window.location.hash || '');
    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    /* Collapse delays under &run / reduced motion. */
    function A(ms) { return (RUN || reduceMotion) ? Math.min(ms, 50) : ms; }

    /* ---------- Header ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title s2-section-title';
    header.textContent = T('scene2.section');
    root.appendChild(header);

    /* ---------- Main row: board (ladder + HUD + die) | controls ---------- */
    const row = document.createElement('div');
    row.className = 's2-row';
    root.appendChild(row);

    /* --- left: the live board --- */
    const board = document.createElement('div');
    board.className = 's2-board';
    row.appendChild(board);

    /* HUD: TOUCH n  +  RETURN SO FAR */
    const hud = document.createElement('div');
    hud.className = 's2-hud';
    hud.innerHTML =
      '<div class="s2-touch"><span class="s2-touch-num"></span></div>' +
      '<div class="s2-return">' +
        '<span class="s2-return-label">' + T('scene2.return') + '</span>' +
        '<span class="s2-return-amount"><span class="s2-return-num">0</span></span>' +
      '</div>';
    board.appendChild(hud);
    const touchNum = hud.querySelector('.s2-touch-num');
    const returnBox = hud.querySelector('.s2-return');
    const returnNum = hud.querySelector('.s2-return-num');

    /* the ladder card + the STAGE DIE side by side */
    const stage = document.createElement('div');
    stage.className = 's2-stage';
    board.appendChild(stage);

    const cardHost = document.createElement('div');
    cardHost.className = 's2-card';
    stage.appendChild(cardHost);
    const card = window.LadderCard.mount(cardHost, { size: 'lg', rung: 0 });

    const dieHost = document.createElement('div');
    dieHost.className = 's2-die';
    stage.appendChild(dieHost);
    const die = window.StageDie.mount(dieHost);

    /* --- right: dialog + lever menu + restart --- */
    const rightCol = document.createElement('div');
    rightCol.className = 's2-right';
    row.appendChild(rightCol);

    const dialogHost = document.createElement('div');
    dialogHost.className = 's2-dialog';
    rightCol.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    const prompt = document.createElement('div');
    prompt.className = 's2-prompt';
    prompt.textContent = T('scene2.pickPrompt');
    rightCol.appendChild(prompt);

    const menu = document.createElement('div');
    menu.className = 's2-menu';
    rightCol.appendChild(menu);

    const leverBtns = {};
    const touchCost = (P && P.TOUCH_REWARD != null) ? P.TOUCH_REWARD : -1;
    for (const lever of L.LEVERS) {
      const tone = L.toneClass(lever.id);
      const icon = L.leverIconSvg(lever.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 's2-lever-btn ' + tone;
      btn.setAttribute('data-lever', lever.id);
      /* DEMO is the headless-capture primary: &run pulls one live touch. */
      if (lever.id === 'demo') btn.setAttribute('data-run-primary', '');
      /* Name + icon + the -1 touch cost only. The die odds are intentionally
         hidden, so the rep has to feel out each lever by playing it. */
      btn.innerHTML =
        '<span class="s2-lever-icon">' + icon + '</span>' +
        '<span class="s2-lever-name">' + T('lever.' + lever.id) + '</span>' +
        '<span class="s2-lever-cost">' + touchCost + ' ' + T('vocab.touch') + '</span>';
      btn.addEventListener('click', () => onTouch(lever.id));
      menu.appendChild(btn);
      leverBtns[lever.id] = btn;
    }

    const ctrlRow = document.createElement('div');
    ctrlRow.className = 's2-ctrl poke-menu-row';
    const restartBtn = document.createElement('button');
    restartBtn.type = 'button';
    restartBtn.className = 'poke-btn s2-restart';
    restartBtn.textContent = T('scene2.restart');
    restartBtn.addEventListener('click', () => resetRun());
    ctrlRow.appendChild(restartBtn);
    rightCol.appendChild(ctrlRow);

    /* ---------- The RETURN tape (the rollout of the run) ---------- */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 's2-tape-wrap';
    tapeWrap.innerHTML = '<div class="s2-tape-label">' + T('scene2.tapeLabel') + '</div>';
    const tape = document.createElement('div');
    tape.className = 's2-tape';
    tapeWrap.appendChild(tape);
    root.appendChild(tapeWrap);

    /* ---------- Caption ---------- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption s2-caption';
    caption.textContent = T('scene2.caption');
    root.appendChild(caption);

    /* ---------- State ---------- */
    let state, touch, total, busy, episode, ended;
    let baseSeed = 0;                  /* per-episode seed; per-touch seeds derive from it */
    const log = window.History.create();   /* the action tape: { action, seed } per touch */

    /* Per-step timer ids, cancelled on restart / leave. */
    let timers = [];
    function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { for (const id of timers) clearTimeout(id); timers = []; }

    function setBusy(b) {
      busy = b;
      for (const id in leverBtns) leverBtns[id].disabled = b || ended;
    }

    function renderTouchHud() {
      touchNum.textContent = T('scene2.touchN', { n: touch });
    }

    function bumpReturn() {
      returnNum.textContent = (total > 0 ? '+' : '') + String(total);
      returnBox.classList.remove('s2-return-pos', 's2-return-neg');
      returnBox.classList.add(total >= 0 ? 's2-return-pos' : 's2-return-neg');
      returnBox.classList.add('s2-return-bump');
      later(() => returnBox.classList.remove('s2-return-bump'), 400);
    }

    /* Append one played touch to the RETURN tape: lever short-label + reward. */
    function appendTapeStep(leverId, reward) {
      const ph = tape.querySelector('.s2-tape-ph');
      if (ph) ph.remove();
      const step = document.createElement('div');
      step.className = 's2-tape-step';
      step.setAttribute('data-lever', leverId);
      const sign = reward >= 0 ? '+' : '';
      step.innerHTML =
        '<div class="s2-tape-move">' + T('lever.short.' + leverId) + '</div>' +
        '<div class="s2-tape-reward">' + sign + reward + '</div>';
      tape.appendChild(step);
      tape.scrollLeft = tape.scrollWidth;
    }

    /* Cap the tape with the terminal marker + the running total. */
    function appendTapeTerminal(signed) {
      const term = document.createElement('div');
      term.className = 's2-tape-step s2-tape-terminal ' + (signed ? 's2-win' : 's2-loss');
      const r = signed ? P.SIGNED_REWARD : P.LOST_REWARD;
      term.innerHTML =
        '<div class="s2-tape-move">' + (signed ? T('vocab.signed') : T('vocab.lost')) + '</div>' +
        '<div class="s2-tape-reward">' + (r >= 0 ? '+' : '') + r + '</div>';
      tape.appendChild(term);
      const totalCap = document.createElement('div');
      totalCap.className = 's2-tape-total';
      totalCap.textContent = T('scene2.tapeTotal', { total: (total > 0 ? '+' : '') + total });
      tape.appendChild(totalCap);
      tape.scrollLeft = tape.scrollWidth;
    }

    /* One touch: announce -> roll the die -> reward chip + tape + RETURN ->
       advance the ladder a rung (or finish at a terminal). */
    function onTouch(leverId) {
      if (busy || ended) return;
      setBusy(true);
      const myEp = episode;

      /* Derive a per-touch seed from the episode base + the touch index so the
         exact run replays from the recorded tape. */
      const touchSeed = (baseSeed + (touch * 0x9E3779B1)) >>> 0;
      const rng = P.makeRng(touchSeed);
      const out = P.sample(state, leverId, rng);
      const stepLog = out.log;
      log.push(leverId, touchSeed);

      dialog.say(T('scene2.msg.touching', { lever: T('lever.' + leverId) }));

      /* Everything that lands once the die settles: reward chip, RETURN, tape,
         then advance / finish. */
      function afterRoll() {
        if (episode !== myEp) return;
        total += out.reward;
        bumpReturn();
        appendTapeStep(leverId, out.reward);

        if (out.terminal) {
          finishRun(out, myEp);
          return;
        }
        /* Living step: narrate the rung change, move the lead. */
        later(() => {
          if (episode !== myEp) return;
          state = out.sNext;
          touch += 1;
          card.set(state.rung);
          renderTouchHud();
          if (stepLog.face === 'up') {
            dialog.say(T('scene2.msg.up', { rung: P.rungName(stepLog.toRung) }));
          } else if (stepLog.face === 'down') {
            dialog.say(T('scene2.msg.down', { rung: P.rungName(stepLog.toRung) }));
          } else {
            dialog.say(T('scene2.msg.stay', { rung: P.rungName(stepLog.toRung) }));
          }
          setBusy(false);
        }, A(460));
      }

      /* Kick off the visible roll. Under &run we don't await the die's
         timer-based promise (headless virtual-time can stall); we advance the
         choreography on a plain timer instead. Interactively we await it so the
         chip lands exactly when the die settles. */
      later(() => {
        if (episode !== myEp) return;
        const rollP = die.roll(stepLog, { reward: out.reward, instant: RUN || reduceMotion });
        if (RUN || reduceMotion) later(afterRoll, A(120));
        else rollP.then(afterRoll);
      }, A(260));
    }

    /* Terminal: SIGNED (+30, deal won) or LOST (-10, dropped out). Settle the
       card to the terminal icon, cap the tape, reveal the summary. */
    function finishRun(out, myEp) {
      ended = true;
      setBusy(true);
      const signed = !!out.log.signed;
      card.setState({ terminal: true, signed: signed, lost: !signed });
      appendTapeTerminal(signed);

      if (signed) dialog.say(T('scene2.msg.signed'));
      else dialog.say(T('scene2.msg.lost'));

      later(() => { if (episode === myEp) showSummary(signed); }, A(signed ? 750 : 750));
    }

    /* End-of-run summary card overlaid on the right column. */
    function showSummary(signed) {
      prompt.style.visibility = 'hidden';
      menu.style.visibility = 'hidden';
      const old = rightCol.querySelector('.s2-summary');
      if (old) old.remove();
      const touches = log.length();
      const sum = document.createElement('div');
      sum.className = 's2-summary';
      sum.innerHTML =
        '<div class="s2-summary-title">' + T('scene2.end.title') + '</div>' +
        '<div class="s2-summary-return ' + (signed ? 'is-good' : 'is-bad') + '">' +
          '<span class="s2-summary-return-label">' + T('scene2.end.return') + '</span>' +
          '<span class="s2-summary-return-amount">' + (total > 0 ? '+' : '') + total + '</span>' +
        '</div>' +
        '<div class="s2-summary-line ' + (signed ? 'is-good' : 'is-bad') + '">' +
          (signed ? T('scene2.end.signed', { touches: touches })
                  : T('scene2.end.lost', { touches: touches })) +
        '</div>' +
        '<button type="button" class="poke-btn s2-again">' + T('scene2.end.again') + '</button>' +
        '<div class="s2-summary-hint poke-caption">' + T('scene2.end.hint') + '</div>';
      rightCol.appendChild(sum);
      sum.querySelector('.s2-again').addEventListener('click', () => resetRun());
    }

    /* ---------- Reset to a fresh COLD lead ---------- */
    function resetRun() {
      clearTimers();
      episode = (episode || 0) + 1;
      state = P.initialState();          // COLD, rung 0
      touch = 1;
      total = 0;
      ended = false;
      log.reset();
      /* Fixed seed under &run for a stable shot (this seed lands the first
         DEMO touch UP, so the capture shows a live mid-climb board rather than
         an instant terminal); a fresh seed otherwise so two runs of the same
         opening rarely end the same. */
      baseSeed = RUN ? 20260605
                     : ((Date.now() ^ (Math.random() * 1e9)) >>> 0);

      card.setState({ rung: state.rung, terminal: false });
      returnNum.textContent = '0';
      returnBox.classList.remove('s2-return-bump', 's2-return-pos', 's2-return-neg');
      renderTouchHud();

      const sum = rightCol.querySelector('.s2-summary');
      if (sum) sum.remove();
      prompt.style.visibility = '';
      menu.style.visibility = '';

      tape.innerHTML = '<div class="s2-tape-step s2-tape-ph"><div class="s2-tape-move">' +
        T('scene2.tapeStart') + '</div></div>';

      dialog.say(T('scene2.msg.start'));
      setBusy(false);
    }

    resetRun();

    return {
      /* Keep the run as-is on re-entry; no autorun re-trigger. */
      onEnter() {},
      onLeave() { clearTimers(); busy = false; },
      /* Free-play scene: arrow keys fall through to the pager (no internal
         steps to consume). */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

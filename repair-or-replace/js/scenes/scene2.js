/* Scene 2 -- PLAYTEST: "You run the fleet".
 *
 *   The learner IS the fleet manager for one QUARTER of 12 weeks. Each week
 *   they make ONE call on OLD BESSIE (RUN / SERVICE / REPLACE); the engine
 *   (window.Van.sample) rolls the hidden wear + breakdown odds; the VanCard
 *   animates the outcome; the exact sampled reward lands on a money tape and
 *   in the running BANK. After week 12 a QUARTER CLOSED summary tallies the
 *   run and offers RUN IT BACK.
 *
 *   The odds stay HIDDEN: no probabilities, no expected values, no optimal
 *   hints anywhere. The manager feels the dice by living with them.
 *
 *   Every week is recorded on a window.History tape as { action, seed } with
 *   a per-week seed derived from a per-episode base seed
 *   (seed = (base + week * 0x9E3779B1) >>> 0), so a run replays exactly.
 *
 *   Cold-entry safe: rebuilds from window.Van / window.Actions /
 *   window.VanCard / window.Dialog / window.History. &run (headless capture)
 *   pins base seed 20260610 and auto-clicks RUN once via [data-run-primary]:
 *   week 1 survives the route (+95) and the gauge slips to WORN, so the shot
 *   shows a live mid-quarter board.
 *
 * Registers window.scenes.scene2 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene2 = function (root) {
    const V = window.Van;
    const ACT = window.Actions;

    root.classList.add('scene-pad', 'scene2-scene');
    root.innerHTML = '';

    /* &run headless capture: fixed seed + collapsed choreography so the whole
       week settles inside the screenshot budget. */
    const RUN = /[#&?]run\b/.test(window.location.hash || '');
    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    /* Collapse delays under &run / reduced motion. */
    function A(ms) { return (RUN || reduceMotion) ? Math.min(ms, 50) : ms; }

    const WEEKS = 12;
    function signed(n) { return (n > 0 ? '+' : '') + String(n); }

    /* ---------- Header ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title s2-section-title';
    header.textContent = 'YOU RUN THE FLEET';
    root.appendChild(header);

    /* ---------- Main row: board (HUD + van) | dialog + calls ---------- */
    const row = document.createElement('div');
    row.className = 's2-row';
    root.appendChild(row);

    /* --- left: the live board --- */
    const board = document.createElement('div');
    board.className = 's2-board';
    row.appendChild(board);

    /* HUD: WEEK n/12 + BANK running total */
    const hud = document.createElement('div');
    hud.className = 's2-hud';
    hud.innerHTML =
      '<div class="s2-week"><span class="s2-week-num"></span></div>' +
      '<div class="s2-bank">' +
        '<span class="s2-bank-label">BANK</span>' +
        '<span class="s2-bank-amount"><span class="s2-bank-num">0</span></span>' +
      '</div>';
    board.appendChild(hud);
    const weekNum = hud.querySelector('.s2-week-num');
    const bankBox = hud.querySelector('.s2-bank');
    const bankNum = hud.querySelector('.s2-bank-num');

    /* the van, big */
    const cardHost = document.createElement('div');
    cardHost.className = 's2-card';
    board.appendChild(cardHost);
    const card = window.VanCard.mount(cardHost, { wear: 0, size: 'lg', miles: 0 });

    /* --- right: dialog + call menu + restart --- */
    const rightCol = document.createElement('div');
    rightCol.className = 's2-right';
    row.appendChild(rightCol);

    const dialogHost = document.createElement('div');
    dialogHost.className = 's2-dialog';
    rightCol.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);
    function say(text) { dialog.say(text, { instant: RUN || reduceMotion }); }

    const prompt = document.createElement('div');
    prompt.className = 's2-prompt';
    prompt.textContent = 'YOUR CALL THIS WEEK:';
    rightCol.appendChild(prompt);

    const menu = document.createElement('div');
    menu.className = 's2-menu';
    rightCol.appendChild(menu);

    /* Price tags: the printed costs only. RUN's earnings depend on the
       condition (and on luck), so its tag stays qualitative: no odds here. */
    const PRICE_TAG = {
      run: 'EARN BY CONDITION',
      service: signed(-V.C_SERVICE),
      replace: signed(-V.C_REPLACE),
    };

    const callBtns = {};
    for (const a of ACT.ACTIONS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 's2-call-btn ' + ACT.toneClass(a.id);
      btn.setAttribute('data-action', a.id);
      /* RUN is the headless-capture primary: &run pulls one live week. */
      if (a.id === 'run') btn.setAttribute('data-run-primary', '');
      btn.innerHTML =
        '<span class="s2-call-icon">' + ACT.leverIconSvg(a.id) + '</span>' +
        '<span class="s2-call-name">' + a.name + '</span>' +
        '<span class="s2-call-tag">' + PRICE_TAG[a.id] + '</span>';
      btn.addEventListener('click', () => onCall(a.id));
      menu.appendChild(btn);
      callBtns[a.id] = btn;
    }

    const ctrlRow = document.createElement('div');
    ctrlRow.className = 's2-ctrl poke-menu-row';
    const restartBtn = document.createElement('button');
    restartBtn.type = 'button';
    restartBtn.className = 'poke-btn s2-restart';
    restartBtn.textContent = 'RESTART';
    restartBtn.addEventListener('click', () => resetRun());
    ctrlRow.appendChild(restartBtn);
    rightCol.appendChild(ctrlRow);

    /* ---------- The money tape (one chip per week) ---------- */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 's2-tape-wrap';
    tapeWrap.innerHTML = '<div class="s2-tape-label">THE QUARTER, WEEK BY WEEK</div>';
    const tape = document.createElement('div');
    tape.className = 's2-tape';
    tapeWrap.appendChild(tape);
    root.appendChild(tapeWrap);

    /* ---------- Caption ---------- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption s2-caption';
    caption.textContent =
      'One call each week, twelve weeks to a quarter. The wear odds and the ' +
      'breakdown odds are not printed anywhere: you learn OLD BESSIE by ' +
      'running her. Every number on the tape is money that actually landed.';
    root.appendChild(caption);

    /* ---------- State ---------- */
    let state, week, bank, busy, episode, ended;
    let baseSeed = 0;            /* per-episode; per-week seeds derive from it */
    let stats = { road: 0, shop: 0, bought: 0, breakdowns: 0 };
    const log = window.History.create();   /* { action, seed } per week */

    /* Per-step timer ids, cancelled on restart / leave. */
    let timers = [];
    function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { for (const id of timers) clearTimeout(id); timers = []; }

    function setBusy(b) {
      busy = b;
      for (const id in callBtns) callBtns[id].disabled = b || ended;
    }

    function renderWeekHud() {
      weekNum.textContent = 'WEEK ' + Math.min(week, WEEKS) + '/' + WEEKS;
    }

    function bumpBank() {
      bankNum.textContent = signed(bank);
      bankBox.classList.remove('s2-bank-pos', 's2-bank-neg');
      if (bank > 0) bankBox.classList.add('s2-bank-pos');
      else if (bank < 0) bankBox.classList.add('s2-bank-neg');
      bankBox.classList.add('s2-bank-bump');
      later(() => bankBox.classList.remove('s2-bank-bump'), 400);
    }

    /* Append one played week to the tape: W<n> + action + the exact reward. */
    function appendTapeChip(wk, actionId, reward) {
      const ph = tape.querySelector('.s2-tape-ph');
      if (ph) ph.remove();
      const chip = document.createElement('div');
      chip.className = 's2-tape-step ' + ACT.toneClass(actionId);
      chip.innerHTML =
        '<div class="s2-tape-wk">W' + wk + ' ' + ACT.shortLabel(actionId) + '</div>' +
        '<div class="s2-tape-reward ' + (reward >= 0 ? 'is-pos' : 'is-neg') + '">' +
          signed(reward) + '</div>';
      tape.appendChild(chip);
      tape.scrollLeft = tape.scrollWidth;
    }

    /* Cap the tape with the quarter total. */
    function appendTapeTotal() {
      const cap = document.createElement('div');
      cap.className = 's2-tape-total ' + (bank >= 0 ? 'is-pos' : 'is-neg');
      cap.textContent = '= ' + signed(bank);
      tape.appendChild(cap);
      tape.scrollLeft = tape.scrollWidth;
    }

    /* ---------- Narration (state names + money straight off the sample) --- */
    function announceLine(actionId) {
      if (actionId === 'run') return 'You send her out on the route...';
      if (actionId === 'service') return 'Into the shop she goes...';
      return 'You call the dealer...';
    }

    function outcomeLine(out) {
      const lg = out.log;
      const money = signed(out.reward);
      const toName = V.stateName(lg.toWear);
      if (lg.action === 'run') {
        if (lg.breakdown) {
          return 'BREAKDOWN on the ring road. Tow plus repairs: ' + money +
                 '. She limps home ' + toName + '.';
        }
        if (lg.face === 'wear0') {
          return 'She made the route. ' + money + '. The gauge holds: ' + toName + '.';
        }
        if (lg.face === 'wear1') {
          return 'She made the route. ' + money + '. But the gauge slipped: ' + toName + '.';
        }
        return 'She made the route. ' + money + '. Hard miles, the gauge slipped twice: ' + toName + '.';
      }
      if (lg.action === 'service') {
        if (lg.face === 'fix0') {
          return 'A week in the shop and... no change. Still ' + toName + '. ' + money + '.';
        }
        if (lg.toWear === 0) {
          return 'Out of the shop: ' + money + '. ' +
                 (lg.face === 'fix2' ? 'Runs like new again: ' : 'Good as new: ') + toName + '.';
        }
        return 'Out of the shop: ' + money + '. Better, not new: ' + toName + '.';
      }
      return 'Sticker shock: ' + money + '. A brand-new BESSIE rolls up Monday.';
    }

    /* ---------- One week: announce -> sample -> animate -> book it ------- */
    function onCall(actionId) {
      if (busy || ended) return;
      setBusy(true);
      const myEp = episode;
      if (window.SFX) window.SFX.play('cursor');

      /* Per-week seed derived from the episode base + the week index, so the
         exact quarter replays from the recorded tape. */
      const weekSeed = (baseSeed + (week * 0x9E3779B1)) >>> 0;
      const rng = V.makeRng(weekSeed);
      const out = V.sample(state, actionId, rng);
      const lg = out.log;
      log.push(actionId, weekSeed);

      say(announceLine(actionId));

      /* Book the week: tape chip + BANK + stats, advance the calendar. */
      function afterOutcome() {
        if (episode !== myEp) return;
        say(outcomeLine(out));
        appendTapeChip(week, actionId, out.reward);
        bank += out.reward;
        bumpBank();
        if (actionId === 'run') {
          stats.road += 1;
          if (lg.breakdown) stats.breakdowns += 1;
        } else if (actionId === 'service') stats.shop += 1;
        else stats.bought += 1;

        state = out.sNext;
        week += 1;
        renderWeekHud();
        if (week > WEEKS) finishQuarter(myEp);
        else setBusy(false);
      }

      /* The visible outcome on the van. */
      later(() => {
        if (episode !== myEp) return;
        if (actionId === 'run') {
          if (lg.breakdown) {
            if (window.SFX) window.SFX.play('hit');
            card.playBreakdown(() => {
              if (episode !== myEp) return;
              card.set(lg.toWear);
              afterOutcome();
            });
          } else {
            /* Survived: miles on the clock (cosmetic flavor), wear updates. */
            card.addMiles(300 + (weekSeed % 90));
            card.set(lg.toWear);
            later(afterOutcome, A(420));
          }
        } else if (actionId === 'service') {
          card.playService(() => {
            if (episode !== myEp) return;
            card.set(lg.toWear);
            afterOutcome();
          });
        } else {
          /* playReplace resets wear + odometer and bumps the nameplate. */
          card.playReplace(() => {
            if (episode !== myEp) return;
            afterOutcome();
          });
        }
      }, A(700));
    }

    /* ---------- Quarter close ---------- */
    function finishQuarter(myEp) {
      ended = true;
      setBusy(true);
      appendTapeTotal();
      say('Friday, week 12. The books close on the quarter.');
      later(() => { if (episode === myEp) showSummary(); }, A(900));
    }

    function showSummary() {
      prompt.style.visibility = 'hidden';
      menu.style.visibility = 'hidden';
      ctrlRow.style.visibility = 'hidden';
      const old = rightCol.querySelector('.s2-summary');
      if (old) old.remove();
      if (window.SFX && bank > 0) window.SFX.play('win');
      const good = bank >= 0;
      const sum = document.createElement('div');
      sum.className = 's2-summary';
      sum.innerHTML =
        '<div class="s2-summary-title">QUARTER CLOSED</div>' +
        '<div class="s2-summary-bank ' + (good ? 'is-good' : 'is-bad') + '">' +
          '<span class="s2-summary-bank-label">BANKED THIS QUARTER</span>' +
          '<span class="s2-summary-bank-amount">' + signed(bank) + '</span>' +
        '</div>' +
        '<div class="s2-summary-stats">' +
          '<div class="s2-stat"><span class="s2-stat-num">' + stats.road + '</span>' +
            '<span class="s2-stat-label">WEEKS ON THE ROAD</span></div>' +
          '<div class="s2-stat"><span class="s2-stat-num">' + stats.shop + '</span>' +
            '<span class="s2-stat-label">WEEKS IN THE SHOP</span></div>' +
          '<div class="s2-stat"><span class="s2-stat-num">' + stats.bought + '</span>' +
            '<span class="s2-stat-label">VANS BOUGHT</span></div>' +
          '<div class="s2-stat"><span class="s2-stat-num">' + stats.breakdowns + '</span>' +
            '<span class="s2-stat-label">BREAKDOWNS EATEN</span></div>' +
        '</div>' +
        '<button type="button" class="poke-btn s2-again">RUN IT BACK</button>' +
        '<div class="s2-summary-hint poke-caption">Same van, fresh dice: two quarters ' +
          'rarely close the same. Notice you were already following SOME rule for ' +
          'when to service and when to scrap. Hold that thought.</div>';
      rightCol.appendChild(sum);
      sum.querySelector('.s2-again').addEventListener('click', () => resetRun());
    }

    /* ---------- Reset to Monday, week 1, a fresh quarter ---------- */
    function resetRun() {
      clearTimers();
      episode = (episode || 0) + 1;
      state = V.initialState();          // HEALTHY
      week = 1;
      bank = 0;
      ended = false;
      stats = { road: 0, shop: 0, bought: 0, breakdowns: 0 };
      log.reset();
      /* Fixed seed under &run for a stable shot (week 1 RUN survives, +95,
         gauge slips to WORN: a live mid-quarter board, verified offline);
         a fresh seed otherwise so two quarters rarely match. */
      baseSeed = RUN ? 20260610
                     : ((Date.now() ^ (Math.random() * 1e9)) >>> 0);

      card.setName('OLD BESSIE');        // resets the numeral too
      card.setState(state);
      card.setMiles(0);
      bankNum.textContent = '0';
      bankBox.classList.remove('s2-bank-bump', 's2-bank-pos', 's2-bank-neg');
      renderWeekHud();

      const sum = rightCol.querySelector('.s2-summary');
      if (sum) sum.remove();
      prompt.style.visibility = '';
      menu.style.visibility = '';
      ctrlRow.style.visibility = '';

      tape.innerHTML = '<div class="s2-tape-step s2-tape-ph">' +
        '<div class="s2-tape-wk">make your first call</div></div>';

      say('Monday, week 1. OLD BESSIE sits at ' + V.stateName(state.wear) + '. Make the call.');
      setBusy(false);
    }

    resetRun();

    return {
      /* Keep the quarter as-is on re-entry; no autorun re-trigger. */
      onEnter() {},
      onLeave() { clearTimers(); busy = false; },
      /* Free-play scene: arrow keys fall through to the pager. */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

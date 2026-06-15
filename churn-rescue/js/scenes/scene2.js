/* Scene 2: Playtest: you run it.
 *
 *   The learner is dropped onto a single account (lukewarm, 4 months left,
 *   from Churn.initialState) and runs it to RENEWAL or CHURN by clicking
 *   levers, month by month. Every turn the RETENTION COIN flips, then (on
 *   STAY) the ENGAGEMENT DIE rolls and the engagement bar ticks; the MARGIN
 *   LEDGER debits the lever cost and, at the end, credits +20 (renewal) or
 *   debits -20 (churn). The episode ends in a gold renewal flash or a grey
 *   card sliding off.
 *
 *   Takeaway: you cannot control the coin, only which coin you flip. Replay
 *   to feel that the SAME choices give DIFFERENT outcomes, and that
 *   over-spending (big offers on an account that was fine) wins the renewal
 *   but wrecks the ledger. Manager framing: when you play, you are already
 *   running a retention playbook; we will name that next.
 *
 *   Engine only: Churn.sample drives every month (no hand-typed numbers).
 *   Coin then die in strict sequence (the widgets return Promises). &run
 *   auto-plays a pinned-seed run of CHECK-INs to renewal for headless
 *   capture; nothing auto-runs on a bare onEnter.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  window.scenes.scene2 = function (root) {
    root.classList.add('scene-pad', 'play-scene');
    root.innerHTML = '';

    const Churn = window.Churn;
    const Levers = window.Levers;

    /*, Header, */
    const header = document.createElement('h2');
    header.className = 'poke-section-title';
    header.textContent = T('play.section_title');
    root.appendChild(header);

    /*, Main row: card+dice (left) | ledger (right), */
    const row = document.createElement('div');
    row.className = 'play-row';
    root.appendChild(row);

    /* Left column: the account card hero, the two dice, and a status line. */
    const leftCol = document.createElement('div');
    leftCol.className = 'play-left';
    row.appendChild(leftCol);

    const cardWrap = document.createElement('div');
    cardWrap.className = 'play-card-wrap';
    const cardHost = document.createElement('div');
    cardWrap.appendChild(cardHost);
    leftCol.appendChild(cardWrap);
    const card = window.AccountCard.mount(cardHost, Churn.initialState());

    /* The two dice, side by side, linked to the card. */
    const diceWrap = document.createElement('div');
    diceWrap.className = 'play-dice';
    const coinHost = document.createElement('div');
    const dieHost = document.createElement('div');
    const coinCell = document.createElement('div');
    coinCell.className = 'play-die-cell';
    coinCell.innerHTML = '<div class="play-die-label">' + T('coin.name') + '</div>';
    coinCell.appendChild(coinHost);
    const dieCell = document.createElement('div');
    dieCell.className = 'play-die-cell';
    dieCell.innerHTML = '<div class="play-die-label">' + T('die.name') + '</div>';
    dieCell.appendChild(dieHost);
    diceWrap.appendChild(coinCell);
    diceWrap.appendChild(dieCell);
    leftCol.appendChild(diceWrap);
    const coin = window.Coin.mount(coinHost, { card: card });
    const die = window.D6.mount(dieHost, { card: card });

    /* Status / narration line. */
    const status = document.createElement('div');
    status.className = 'play-status';
    leftCol.appendChild(status);

    /* Right column: the margin ledger. */
    const rightCol = document.createElement('div');
    rightCol.className = 'play-right';
    row.appendChild(rightCol);

    const ledgerHost = document.createElement('div');
    ledgerHost.className = 'margin-ledger play-ledger';
    rightCol.appendChild(ledgerHost);

    /*, Action menu: the three levers + restart, */
    const menu = document.createElement('div');
    menu.className = 'play-menu';
    root.appendChild(menu);

    const leverBtns = {};
    for (const lever of Levers.LEVERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'play-lever-btn ' + Levers.tokenClass(lever.id);
      btn.innerHTML =
        '<span class="play-lever-name">' + T('lever.' + lever.id) + '</span>' +
        '<span class="play-lever-sub">' + Levers.leverSubHtml(lever.id) + '</span>';
      btn.addEventListener('click', () => onLever(lever.id));
      menu.appendChild(btn);
      leverBtns[lever.id] = btn;
    }

    const restartBtn = document.createElement('button');
    restartBtn.type = 'button';
    restartBtn.className = 'play-restart-btn';
    restartBtn.textContent = T('play.restart');
    restartBtn.addEventListener('click', () => resetEpisode(true));
    menu.appendChild(restartBtn);

    const caption = document.createElement('div');
    caption.className = 'poke-caption play-caption';
    caption.textContent = T('play.caption');
    root.appendChild(caption);

    /*, Episode state, */
    let state = Churn.initialState();
    let balance = 0;
    let month = 0;                 /* months elapsed (for ledger row labels) */
    let busy = false;
    let done = false;
    let rng = Churn.makeRng((Date.now() ^ 0x9e3779b9) >>> 0);
    /* episode token: a restart mid-animation bumps it so an in-flight turn
       aborts cleanly. */
    let episode = 0;

    /*, Ledger rendering. Entries accrue as the learner plays., */
    const entries = [];           /* { label, amt, kind:'debit'|'credit' } */
    function renderLedger() {
      const rows = entries.map(e =>
        '<div class="ledger-row ' + e.kind + '">' +
          '<span class="ledger-label">' + e.label + '</span>' +
          '<span class="ledger-amt">' + (e.amt >= 0 ? '+' : '') + e.amt + '</span>' +
        '</div>'
      ).join('');
      const balCls = balance > 0 ? 'pos' : (balance < 0 ? 'neg' : '');
      ledgerHost.innerHTML =
        '<div class="margin-ledger-title">' + T('ledger.title') + '</div>' +
        '<div class="ledger-rows">' + (rows ||
          '<div class="ledger-row"><span class="ledger-label ledger-empty">' +
          T('play.ledger.empty') + '</span><span class="ledger-amt"></span></div>') +
        '</div>' +
        '<div class="ledger-balance ' + balCls + '">' +
          '<span>' + T('ledger.balance') + '</span>' +
          '<span class="ledger-amt">' + (balance >= 0 ? '+' : '') + balance + '</span>' +
        '</div>';
    }

    function addEntry(label, amt, kind) {
      entries.push({ label, amt, kind });
      balance += amt;
      renderLedger();
    }

    function setBusy(b) {
      busy = b;
      for (const id in leverBtns) leverBtns[id].disabled = b || done;
    }

    /* Reset the coin/die widgets to a neutral, unresolved face. */
    function clearDice() {
      coin.el.classList.remove('is-stay', 'is-churn', 'spinning');
      coin.el.querySelector('.coin-result').textContent = '';
      coin.el.querySelector('.coin-face').innerHTML = '';
      die.el.classList.remove('face-up', 'face-same', 'face-down', 'tumbling');
      die.el.querySelector('.die-result').textContent = '';
      die.el.querySelector('.die-face').innerHTML = '';
    }

    function leverName(id) { return T('lever.' + id); }
    function tierName(idx) { return T('tier.' + Churn.TIERS[idx]); }

    /*, One month: pull a lever, animate coin then die, update ledger.
       The whole month is sampled up-front from the engine; the animation
       just replays the log so what the learner SEES matches the model., */
    async function applyMonth(leverId) {
      const myEp = episode;
      const out = Churn.sample(state, leverId, rng);
      const log = out.log;
      month++;

      /* Debit the lever cost immediately (it is paid before the coin flip). */
      const costLabel = T('play.ledger.month_lever', {
        m: month, lever: leverName(leverId),
      });
      addEntry(costLabel, -log.cost, 'debit');

      clearDice();
      status.textContent = T('play.status.pulled', { lever: leverName(leverId) });
      await wait(360);
      if (episode !== myEp) return;

      /* 1) RETENTION COIN. On CHURN the linked card greys + slides off. */
      await coin.flip(log.stay);
      if (episode !== myEp) return;

      if (!log.stay) {
        /* Churned: terminal -20 lump. */
        addEntry(T('play.ledger.churn_lump'), Churn.CHURN_REWARD, 'debit');
        status.textContent = T('play.status.churned');
        if (window.SFX) window.SFX.play('loss');
        await wait(500);
        if (episode !== myEp) return;
        finish(false);
        return;
      }

      await wait(420);
      if (episode !== myEp) return;

      /* 2) ENGAGEMENT DIE. Ticks the bar toward log.toTier. */
      await die.roll(log.dieFace, null, log.toTier);
      if (episode !== myEp) return;
      await wait(360);
      if (episode !== myEp) return;

      if (log.renewed) {
        /* Renewed: terminal +20 lump + gold flash + confetti. */
        card.set({ m: 0 });
        card.flashRenew();
        addEntry(T('play.ledger.renew_lump'), Churn.RENEW_REWARD, 'credit');
        status.textContent = T('play.status.renewed');
        await wait(700);
        if (episode !== myEp) return;
        finish(true);
        return;
      }

      /* Continue: advance the calendar (the die already ticked the tier). */
      state = out.sNext;
      card.set({ m: state.m });
      status.textContent = T('play.status.advanced', {
        m: state.m, tier: tierName(state.tier),
      });
      setBusy(false);
    }

    function finish(renewed) {
      done = true;
      state = { terminal: true, renewed: renewed, churned: !renewed };
      for (const id in leverBtns) leverBtns[id].disabled = true;
      busy = false;
    }

    function onLever(leverId) {
      if (busy || done) return;
      setBusy(true);
      applyMonth(leverId);
    }

    /*, Reset to a fresh episode. `reseed` true draws a new random seed
       (manual restart); false keeps the current rng (used by &run with a
       pinned seed)., */
    function resetEpisode(reseed) {
      episode++;
      if (reseed) rng = Churn.makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
      state = Churn.initialState();
      balance = 0; month = 0; done = false;
      entries.length = 0;
      card.ungrey();
      card.set(Churn.initialState());
      clearDice();
      renderLedger();
      status.textContent = T('play.status.start', { tier: tierName(state.tier) });
      setBusy(false);
    }

    resetEpisode(false);

    /*, &run: pinned-seed auto-play of CHECK-INs to a renewal, so the
       headless screenshot shows a full ledger ending in a gold renewal., */
    let autoTimer = null;
    function stopAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }
    function maybeRun() {
      if (!/[#&?]run\b/.test(window.location.hash)) return;
      stopAuto();
      /* Seed 7 with all CHECK-INs takes the lukewarm account to renewal
         (verified deterministic against the engine below). */
      rng = Churn.makeRng(7);
      resetEpisode(false);
      rng = Churn.makeRng(7);
      const step = () => {
        if (done) return;
        if (!busy) { onLever('checkin'); }
        autoTimer = setTimeout(step, 700);
      };
      autoTimer = setTimeout(step, 200);
    }

    /* Cold headless entry: main.js builds the scene but does NOT call
       onEnter on first mount, so trigger &run here too. */
    maybeRun();

    return {
      onEnter() { maybeRun(); },
      onLeave() { episode++; stopAuto(); busy = false; },
    };
  };

  function wait(ms) {
    const reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Promise(r => setTimeout(r, reduce ? Math.min(ms, 30) : ms));
  }

})();

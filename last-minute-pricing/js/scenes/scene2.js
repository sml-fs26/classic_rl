/* Scene 2 -- PLAYTEST: "You run the shelf".
 *
 *   The learner IS the pricing manager (the pricing analogue of pokemon
 *   scene1's click-to-attack battle). From a fresh shelf (5 units, 4 days)
 *   they pull ONE price tag each day; the shared DEMAND DECK flips to reveal
 *   how many units sell (window.Pricing.sample drives the randomness, the
 *   deck shows it); sold tickets slide off with a +$ receipt, the money HUD
 *   ticks, a step lands on the RETURN tape, and a day tears off. Play runs to
 *   the deadline (d hits 0) or an early SOLD OUT (u hits 0). At midnight any
 *   leftover units crumble to grey and a summary lands.
 *
 *   The stochastic outcome is FELT, not described: two identical openings end
 *   differently. No optimal answer is shown -- the learner prices by gut.
 *
 *   Cold entry rebuilds from window.Pricing / window.Levers / window.ShelfCard
 *   / window.Deck. &run (window.PRICING_AUTORUN) auto-plays a short sequence so
 *   the headless capture shows a live mid-run board. */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene2 = function (root) {
    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    const P = window.Pricing;
    const L = window.Levers;

    root.className = 'scene-pad play-scene';
    root.innerHTML = '';

    /* ---------- Header ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title';
    header.textContent = T('scene2.section');
    root.appendChild(header);

    /* ---------- Main row: board (shelf + HUD + deck) | controls ---------- */
    const row = document.createElement('div');
    row.className = 'play-row';
    root.appendChild(row);

    /* --- left: the live board --- */
    const board = document.createElement('div');
    board.className = 'play-board';
    row.appendChild(board);

    /* HUD: DAY n  +  REVENUE SO FAR */
    const hud = document.createElement('div');
    hud.className = 'play-hud';
    hud.innerHTML =
      '<div class="play-day"><span class="play-day-num"></span></div>' +
      '<div class="money-counter play-money">' +
        '<span class="money-label">' + T('scene2.revenue') + '</span>' +
        '<span class="money-amount"><span class="money-sign">$</span><span class="money-num">0</span></span>' +
      '</div>';
    board.appendChild(hud);
    const dayNum = hud.querySelector('.play-day-num');
    const money = hud.querySelector('.play-money');
    const moneyNum = hud.querySelector('.money-num');

    /* the shelf card + the demand deck side by side */
    const stage = document.createElement('div');
    stage.className = 'play-stage';
    board.appendChild(stage);

    const cardHost = document.createElement('div');
    cardHost.className = 'play-card';
    stage.appendChild(cardHost);
    const card = window.ShelfCard.mount(cardHost, { size: 'lg', label: true, u: 5, d: 4 });

    const deckHost = document.createElement('div');
    deckHost.className = 'play-deck';
    stage.appendChild(deckHost);
    /* Under &run (headless capture / demo autoplay) the flips resolve
       instantly so the whole sequence settles inside the screenshot budget. */
    const deck = window.Deck.mount(deckHost, { reduced: !!window.PRICING_AUTORUN });

    /* --- right: dialog + lever menu + restart --- */
    const rightCol = document.createElement('div');
    rightCol.className = 'play-right';
    row.appendChild(rightCol);

    const dialogHost = document.createElement('div');
    dialogHost.className = 'play-dialog';
    rightCol.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    const prompt = document.createElement('div');
    prompt.className = 'play-prompt';
    prompt.textContent = T('scene2.pickPrompt');
    rightCol.appendChild(prompt);

    const menu = document.createElement('div');
    menu.className = 'play-menu';
    rightCol.appendChild(menu);

    const leverBtns = {};
    for (const lever of L.LEVERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'play-lever-btn';
      btn.setAttribute('data-lever', lever.id);
      /* Name + price only -- the demand odds are intentionally hidden, so the
         player has to feel out each tag by playing it. */
      btn.innerHTML =
        '<span class="play-lever-name">' + T('lever.' + lever.id) + '</span>' +
        '<span class="play-lever-price">$' + lever.price + T('scene2.perUnit') + '</span>';
      btn.addEventListener('click', () => onPull(lever.id));
      menu.appendChild(btn);
      leverBtns[lever.id] = btn;
    }

    const ctrlRow = document.createElement('div');
    ctrlRow.className = 'play-ctrl poke-menu-row';
    const restartBtn = document.createElement('button');
    restartBtn.type = 'button';
    restartBtn.className = 'poke-btn play-restart';
    restartBtn.textContent = T('scene2.restart');
    restartBtn.addEventListener('click', () => resetRun());
    ctrlRow.appendChild(restartBtn);
    rightCol.appendChild(ctrlRow);

    /* ---------- The RETURN tape (rollout of the run) ---------- */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'play-tape-wrap';
    tapeWrap.innerHTML = '<div class="play-tape-label">' + T('scene2.tapeLabel') + '</div>';
    const tape = document.createElement('div');
    tape.className = 'return-tape play-tape';
    tapeWrap.appendChild(tape);
    root.appendChild(tapeWrap);

    /* ---------- Caption ---------- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption play-caption';
    caption.textContent = T('scene2.caption');
    root.appendChild(caption);

    /* ---------- State ---------- */
    let state, day, total, busy, rng, episode, ended;
    /* Per-day timer ids, cancelled on restart / leave. */
    let timers = [];
    function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { for (const id of timers) clearTimeout(id); timers = []; }
    /* Choreography delays are collapsed under &run so the autoplayed sequence
       settles inside the headless screenshot budget. */
    function A(ms) { return window.PRICING_AUTORUN ? Math.min(ms, 60) : ms; }

    function setBusy(b) {
      busy = b;
      for (const id in leverBtns) leverBtns[id].disabled = b || ended;
    }

    function renderDayHud() {
      dayNum.textContent = T('scene2.dayOf', { n: day });
    }

    function bumpMoney() {
      moneyNum.textContent = String(total);
      money.classList.add('money-bump');
      later(() => money.classList.remove('money-bump'), 400);
    }

    /* Float a "+$N" receipt over the shelf card in the lever colour. */
    function floatReceipt(amount, leverId) {
      const flash = document.createElement('div');
      flash.className = 'money-flash lever-fill-' + leverId + ' play-flash';
      flash.textContent = '+$' + amount;
      stage.appendChild(flash);
      later(() => { try { flash.remove(); } catch (_e) {} }, 900);
    }

    /* Append one step to the RETURN tape: lever short-label / +$r (or $0). */
    function appendTapeStep(log) {
      /* drop the "pull a tag to begin" placeholder on the first real step */
      const ph = tape.querySelector('.play-tape-ph');
      if (ph) ph.remove();
      const sold = log.sold;
      const step = document.createElement('div');
      step.className = 'tape-step ' + (sold > 0 ? 'tape-sale' : 'tape-nosale');
      step.setAttribute('data-lever', log.lever);
      step.innerHTML =
        '<div class="tape-day">' + T('lever.' + log.lever + '.short') + '</div>' +
        '<div class="tape-reward">' + (sold > 0 ? '+$' + (log.price * sold) : '$0') + '</div>';
      tape.appendChild(step);
      tape.scrollLeft = tape.scrollWidth;
    }

    /* Cap the tape with the terminal marker + the running total. */
    function appendTapeTerminal(soldout) {
      const term = document.createElement('div');
      term.className = 'tape-step tape-terminal';
      term.innerHTML =
        '<div class="tape-day">' + (soldout ? T('vocab.soldout') : T('vocab.midnight')) + '</div>' +
        '<div class="tape-reward">$0</div>';
      tape.appendChild(term);
      const totalCap = document.createElement('div');
      totalCap.className = 'tape-total';
      totalCap.textContent = T('scene2.tapeTotal', { total: total });
      tape.appendChild(totalCap);
      tape.scrollLeft = tape.scrollWidth;
    }

    /* One full day: announce -> deck flip -> sold tickets slide off + receipt
       -> money + tape -> advance the shelf (or finish). */
    function onPull(leverId) {
      if (busy || ended) return;
      setBusy(true);
      const myEp = episode;
      const lever = L.LEVER_BY_ID[leverId];
      const out = P.sample(state, leverId, rng);
      const log = out.log;

      card.setLever(leverId);
      dialog.say(T('scene2.msg.flipping', { lever: T('lever.' + leverId), price: lever.price }));

      /* Everything that lands once the demand card is face-up: receipt,
         money, tape, then settle / tear / continue. */
      function afterFlip() {
        if (episode !== myEp) return;
        total += out.reward;

        if (log.sold > 0) {
          /* slide the sold tickets off, float the receipt, tick the money */
          cardHost.classList.add('play-sold');
          cardHost.dataset.sold = String(log.sold);
          floatReceipt(log.price * log.sold, leverId);
          if (window.SFX) window.SFX.play('hit');
          bumpMoney();
          /* sold N at price, or capped-to-inventory phrasing */
          if (log.k > log.sold) {
            dialog.say(T('scene2.msg.capped', { sold: log.sold, rev: log.price * log.sold }));
          } else {
            dialog.say(T('scene2.msg.sold', { sold: log.sold, price: log.price, rev: log.price * log.sold }));
          }
        } else {
          dialog.say(T('scene2.msg.none', { price: log.price }));
        }
        appendTapeStep(log);

        /* settle the shelf to the post-sale inventory, then either finish at a
           terminal or tear off a day and continue. */
        later(() => {
          if (episode !== myEp) return;
          cardHost.classList.remove('play-sold');
          delete cardHost.dataset.sold;

          if (out.terminal) {
            finishRun(out, myEp);
            return;
          }
          /* advance: tear a day, move to tomorrow */
          cardHost.classList.add('play-tear');
          later(() => {
            if (episode !== myEp) return;
            cardHost.classList.remove('play-tear');
            state = out.sNext;
            day += 1;
            card.set(state.u, state.d);
            card.setLever(null);
            renderDayHud();
            dialog.say(T('scene2.msg.nextDay', { n: day, u: state.u, d: state.d }));
            setBusy(false);
            if (window.PRICING_AUTORUN) later(autoStep, A(420));
          }, A(460));
        }, A(520));
      }

      later(() => {
        if (episode !== myEp) return;
        /* Kick off the visible flip. Under &run we DON'T await the deck's
           rAF-based promise (headless virtual-time stalls on rAF); we advance
           the choreography on a plain timer instead. Interactively we await
           the flip so the receipt lands exactly when the card settles. */
        const flipP = deck.flip({ lever: leverId, k: log.k });
        if (window.PRICING_AUTORUN) later(afterFlip, A(120));
        else flipP.then(afterFlip);
      }, A(360));
    }

    /* Terminal: SOLD OUT (cleared early) or MIDNIGHT (deadline). Show the
       crumble for any leftover units, cap the tape, and reveal the summary. */
    function finishRun(out, myEp) {
      ended = true;
      setBusy(true);
      const soldout = !!out.log.soldout;
      const leftover = soldout ? 0 : (out.log.uAfter || 0);

      if (soldout) {
        card.setState({ terminal: true, soldout: true });
        card.setLever(null);
        if (window.SFX) window.SFX.play('win');
        dialog.say(T('scene2.msg.soldout'));
      } else {
        /* keep the leftover units on the card, then crumble them grey */
        card.setState({ u: leftover, d: 0 });
        card.setLever(null);
        if (leftover > 0) {
          cardHost.classList.add('play-midnight');
          if (window.SFX) window.SFX.play('loss');
          dialog.say(T('scene2.msg.deadline.left', { u: leftover }));
        } else {
          dialog.say(T('scene2.msg.deadline.clean'));
        }
        /* settle to the MIDNIGHT terminal icon after the crumble */
        later(() => {
          if (episode !== myEp) return;
          card.setState({ terminal: true, deadline: true });
          cardHost.classList.remove('play-midnight');
        }, A(900));
      }
      appendTapeTerminal(soldout);
      bumpMoney();
      later(() => { if (episode === myEp) showSummary(soldout, leftover); }, A(soldout ? 700 : 1100));
    }

    /* End-of-run summary card overlaid on the right column. */
    function showSummary(soldout, leftover) {
      prompt.style.visibility = 'hidden';
      menu.style.visibility = 'hidden';
      const old = rightCol.querySelector('.play-summary');
      if (old) old.remove();
      const sum = document.createElement('div');
      sum.className = 'play-summary';
      sum.innerHTML =
        '<div class="play-summary-title">' + T('scene2.end.title') + '</div>' +
        '<div class="play-summary-money money-counter">' +
          '<span class="money-label">' + T('scene2.end.revenue') + '</span>' +
          '<span class="money-amount"><span class="money-sign">$</span>' + total + '</span>' +
        '</div>' +
        '<div class="play-summary-line ' + (soldout ? 'is-good' : (leftover > 0 ? 'is-bad' : '')) + '">' +
          (soldout ? T('scene2.end.soldout')
                   : (leftover > 0 ? T('scene2.end.wasted', { u: leftover }) : T('scene2.msg.deadline.clean'))) +
        '</div>' +
        '<button type="button" class="poke-btn play-again">' + T('scene2.end.again') + '</button>' +
        '<div class="play-summary-hint poke-caption">' + T('scene2.end.hint') + '</div>';
      rightCol.appendChild(sum);
      sum.querySelector('.play-again').addEventListener('click', () => resetRun());
    }

    /* ---------- Reset to a fresh shelf ---------- */
    function resetRun() {
      clearTimers();
      episode = (episode || 0) + 1;
      state = P.initialState();          // 5 units, 4 days
      day = 1;
      total = 0;
      ended = false;
      /* fresh RNG so two runs differ; a fixed seed under &run for stable shots */
      rng = window.PRICING_AUTORUN ? P.makeRng(20260530)
                                   : P.makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);

      card.setState({ u: state.u, d: state.d });
      card.setLever(null);
      cardHost.classList.remove('play-sold', 'play-tear', 'play-midnight');
      delete cardHost.dataset.sold;
      deck.reset();
      moneyNum.textContent = '0';
      money.classList.remove('money-bump');
      renderDayHud();

      const sum = rightCol.querySelector('.play-summary');
      if (sum) sum.remove();
      prompt.style.visibility = '';
      menu.style.visibility = '';

      tape.innerHTML = '<div class="tape-step tape-nosale play-tape-ph"><div class="tape-day">' +
        T('scene2.tapeStart') + '</div></div>';

      dialog.say(T('scene2.msg.start'));
      setBusy(false);

      if (window.PRICING_AUTORUN) later(autoStep, A(600));
    }

    /* Headless / demo autoplay: pull a fixed lever sequence (with the seeded
       RNG above) so the capture shows a live, partway-through run. */
    const AUTO_SEQ = ['premium', 'standard', 'standard', 'standard'];
    function autoStep() {
      if (ended || busy) return;
      const idx = day - 1;
      const leverId = AUTO_SEQ[idx] || 'standard';
      onPull(leverId);
    }

    resetRun();

    return {
      onEnter() { /* keep the run as-is on re-entry; no autorun re-trigger */ },
      onLeave() { clearTimers(); busy = false; },
    };
  };
})();

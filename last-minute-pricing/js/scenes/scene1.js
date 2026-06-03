/* Scene 1 -- TUTORIAL: "How to read the shelf".
 *
 *   The pricing analogue of pokemon-battle's sceneHowToPlay. A guided,
 *   math-free walkthrough of the controls in the shelf-card visual language:
 *     1. welcome  -- the shelf card (one picture, two numbers)
 *     2. units    -- the stock (lit tickets), shown at full / mid / last
 *     3. days     -- the countdown (day-pips) to MIDNIGHT
 *     4. levers   -- the three price tags + their printed demand odds
 *     5. demo     -- one slow day: pull STANDARD, flip the demand deck, a
 *                    ticket slides off with +$3, the day tears away
 *
 *   Stepped with the pager arrows (consumed internally until the last step).
 *   The final demo step is gated by a PLAY THE DAY button and honours &run
 *   (window.PRICING_AUTORUN) so the headless capture shows the resolved day.
 *
 *   Contract: window.scenes.scene1 = function(root){ return { onEnter?,
 *   onLeave?, onNextKey?, onPrevKey? }; }. Cold entry rebuilds from
 *   window.Pricing / window.Levers / window.ShelfCard / window.Deck. */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The five tutorial steps. `id` drives i18n lookups (scene1.<id>.title /
     .dialog); `render` fills the demo host for that step. */
  const STEPS = [
    { id: 'welcome', render: renderWelcome },
    { id: 'units',   render: renderUnits   },
    { id: 'days',    render: renderDays    },
    { id: 'levers',  render: renderLevers  },
    { id: 'demo',    render: renderDemo    },
  ];

  /* Timers spawned by the demo step that must be cancelled on a step swap or
     scene leave (otherwise they fire into a torn-down host). */
  let demoTimers = [];
  function clearDemoTimers() {
    for (const id of demoTimers) clearTimeout(id);
    demoTimers = [];
  }
  function later(fn, ms) { const id = setTimeout(fn, ms); demoTimers.push(id); return id; }

  window.scenes.scene1 = function (root) {
    root.className = 'scene-pad tut-scene';
    root.innerHTML = '';
    clearDemoTimers();

    /* ---------- Top bar: step counter + SKIP ---------- */
    const topbar = document.createElement('div');
    topbar.className = 'tut-topbar';
    root.appendChild(topbar);

    const counter = document.createElement('div');
    counter.className = 'tut-step-counter';
    topbar.appendChild(counter);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tut-skip-btn poke-btn';
    skipBtn.title = T('scene1.skip_title');
    topbar.appendChild(skipBtn);
    skipBtn.addEventListener('click', () => {
      if (window.PriceViz) window.PriceViz.goTo(1);   /* -> the playtest */
      else window.location.hash = '#scene=1';
    });

    /* ---------- Section title ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title tut-section-title';
    root.appendChild(header);

    /* ---------- Demo area (swaps per step) ---------- */
    const demoHost = document.createElement('div');
    demoHost.className = 'tut-demo';
    root.appendChild(demoHost);

    /* ---------- Dialog at the bottom ---------- */
    const dialogHost = document.createElement('div');
    dialogHost.className = 'tut-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /* ---------- Nav hint ---------- */
    const navHint = document.createElement('div');
    navHint.className = 'tut-nav-hint poke-caption';
    navHint.innerHTML = T('scene1.nav.hint');
    root.appendChild(navHint);

    /* ---------- In-scene step nav (BACK / NEXT) ----------
       Big, tappable step controls sitting under the content. The arrow keys
       (onPrevKey/onNextKey) and the topbar PREV/NEXT already walk the steps,
       but on a phone there are no arrow keys and the topbar pager is detached
       from the tutorial; without these buttons mobile users had no obvious way
       to move through the five steps. */
    const stepNav = document.createElement('div');
    stepNav.className = 'tut-stepnav';
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'tut-step-back poke-btn';
    backBtn.textContent = T('scene1.nav.back');
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'tut-step-next poke-btn';
    nextBtn.textContent = T('scene1.nav.next');
    stepNav.appendChild(backBtn);
    stepNav.appendChild(nextBtn);
    root.appendChild(stepNav);
    backBtn.addEventListener('click', () => { if (cursor > 0) renderStep(cursor - 1); });
    nextBtn.addEventListener('click', () => { if (cursor < STEPS.length - 1) renderStep(cursor + 1); });

    /* ---------- Step engine ---------- */
    let cursor = 0;

    function renderStep(c) {
      cursor = c;
      clearDemoTimers();
      const step = STEPS[c];
      counter.textContent = T('scene1.step_of', { i: c + 1, total: STEPS.length });
      header.textContent = T('scene1.' + step.id + '.title').toUpperCase();
      demoHost.innerHTML = '';
      step.render(demoHost, dialog);
      dialog.say(T('scene1.' + step.id + '.dialog'));
      /* On the last step, the SKIP button becomes "RUN THE SHELF". */
      skipBtn.textContent = (c === STEPS.length - 1) ? T('scene1.go_play') : T('scene1.skip');
      /* Step buttons disable at the two ends of the walk. */
      backBtn.disabled = (c === 0);
      nextBtn.disabled = (c === STEPS.length - 1);
    }

    /* `#…&tut=N` deep-links an internal step (headless capture / linking). */
    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]tut=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < STEPS.length) ? n : 0;
    }
    renderStep(readInitialStep());

    return {
      onEnter() { renderStep(readInitialStep()); },
      onLeave() { clearDemoTimers(); },
      onNextKey() {
        if (cursor < STEPS.length - 1) { renderStep(cursor + 1); return true; }
        return false;   /* fall through: pager advances to the playtest */
      },
      onPrevKey() {
        if (cursor > 0) { renderStep(cursor - 1); return true; }
        return false;   /* fall through: pager goes back to the title */
      },
    };
  };

  /* =========================================================================
     Per-step renderers. Each fills the demo host.
     ========================================================================= */

  /* Step 1 -- one big shelf card beside a welcome panel. */
  function renderWelcome(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-welcome';

    const cardWrap = document.createElement('div');
    cardWrap.className = 'tut-welcome-card';
    cardWrap.appendChild(window.ShelfCard.render({ u: 5, d: 4 }, { size: 'lg', label: true }));
    wrap.appendChild(cardWrap);

    const txt = document.createElement('div');
    txt.className = 'tut-welcome-text';
    txt.innerHTML =
      '<div class="tut-welcome-big">'   + T('scene1.welcome.big')   + '</div>' +
      '<div class="tut-welcome-small">' + T('scene1.welcome.small') + '</div>';
    wrap.appendChild(txt);

    host.appendChild(wrap);
  }

  /* Step 2 -- the stock: three shelf cards (full / mid / last) with the
     tickets highlighted, plus a footnote. */
  function renderUnits(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-strip tut-units';

    const samples = [
      { u: 5, d: 4, cap: T('scene1.units.cap.full') },
      { u: 3, d: 4, cap: T('scene1.units.cap.some') },
      { u: 1, d: 4, cap: T('scene1.units.cap.last') },
    ];
    for (const s of samples) {
      const cell = document.createElement('div');
      cell.className = 'tut-strip-cell tut-focus-stack';
      cell.appendChild(window.ShelfCard.render({ u: s.u, d: s.d }, { size: 'md', label: false }));
      const cap = document.createElement('div');
      cap.className = 'tut-strip-cap';
      cap.textContent = s.cap;
      cell.appendChild(cap);
      wrap.appendChild(cell);
    }
    host.appendChild(wrap);

    const note = document.createElement('div');
    note.className = 'tut-footnote poke-caption';
    note.textContent = T('scene1.units.note');
    host.appendChild(note);
  }

  /* Step 3 -- the clock: three shelf cards (4 days / 2 days / midnight) with
     the day-pips highlighted. */
  function renderDays(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-strip tut-days';

    const four = document.createElement('div');
    four.className = 'tut-strip-cell tut-focus-ribbon';
    four.appendChild(window.ShelfCard.render({ u: 5, d: 4 }, { size: 'md', label: false }));
    four.appendChild(cap(T('scene1.days.cap.four')));
    wrap.appendChild(four);

    const two = document.createElement('div');
    two.className = 'tut-strip-cell tut-focus-ribbon';
    two.appendChild(window.ShelfCard.render({ u: 5, d: 2 }, { size: 'md', label: false }));
    two.appendChild(cap(T('scene1.days.cap.two')));
    wrap.appendChild(two);

    const mid = document.createElement('div');
    mid.className = 'tut-strip-cell tut-focus-ribbon';
    mid.appendChild(window.ShelfCard.render({ terminal: true, deadline: true, u: 3 }, { size: 'md', label: false }));
    mid.appendChild(cap(T('scene1.days.cap.mid')));
    wrap.appendChild(mid);

    host.appendChild(wrap);

    const note = document.createElement('div');
    note.className = 'tut-footnote poke-caption';
    note.textContent = T('scene1.days.note');
    host.appendChild(note);

    function cap(txt) { const d = document.createElement('div'); d.className = 'tut-strip-cap'; d.textContent = txt; return d; }
  }

  /* Step 4 -- the three price tags. Each shows its price and a one-line role.
     The demand odds are deliberately NOT printed (you can't see how many
     buyers will show up); a fewer-to-more buyers axis under the row conveys
     only the direction each tag leans. */
  function renderLevers(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-levers';

    const row = document.createElement('div');
    row.className = 'tut-lever-row';
    for (const lever of window.Levers.LEVERS) {
      row.appendChild(leverCard(lever));
    }
    wrap.appendChild(row);

    const axis = document.createElement('div');
    axis.className = 'tut-lever-axis';
    axis.innerHTML =
      '<span class="ax-l">' + T('scene1.levers.axis.l') + '</span>' +
      '<span class="ax-line" aria-hidden="true"></span>' +
      '<span class="ax-r">' + T('scene1.levers.axis.r') + '</span>';
    wrap.appendChild(axis);

    host.appendChild(wrap);

    const note = document.createElement('div');
    note.className = 'tut-footnote poke-caption';
    note.textContent = T('scene1.levers.note');
    host.appendChild(note);
  }

  /* One price-tag card: the chunky lever tag and its one-line role. No odds. */
  function leverCard(lever) {
    const card = document.createElement('div');
    card.className = 'tut-lever-card';
    card.setAttribute('data-lever', lever.id);

    const tag = document.createElement('div');
    tag.className = 'lever-tag';
    tag.setAttribute('data-lever', lever.id);
    tag.innerHTML = T('lever.' + lever.id) +
      '<span class="lever-price">$' + lever.price + T('scene1.levers.perUnit') + '</span>';
    card.appendChild(tag);

    const role = document.createElement('div');
    role.className = 'tut-lever-role';
    role.textContent = T('scene1.levers.' + lever.id + '.tag');
    card.appendChild(role);

    /* No demand odds are printed on the tag: how many buyers show up is
       hidden, something you only learn by pulling the lever. */
    return card;
  }

  /* Step 5 -- one slow demo day. We pull STANDARD on a (5 units, 4 days)
     shelf, flip the shared demand deck to k=1 (a clean single sale so the
     +$3 receipt and the ticket slide read clearly), then tear off a day.
     The day is gated by PLAY THE DAY; &run auto-triggers it for capture. */
  function renderDemo(host) {
    const LEVER_ID = 'standard';
    const lever = window.Levers.LEVER_BY_ID[LEVER_ID];
    const DRAW_K = 1;             /* scripted single sale for the demo */
    const startU = 5, startD = 4;

    const wrap = document.createElement('div');
    wrap.className = 'tut-demo-day';
    host.appendChild(wrap);

    /* Left: the live shelf card we will mutate (slide a ticket off, tear a
       day). Money receipt floats over it. */
    const stage = document.createElement('div');
    stage.className = 'tut-demo-stage';
    wrap.appendChild(stage);

    const cardHost = document.createElement('div');
    cardHost.className = 'tut-demo-card';
    stage.appendChild(cardHost);
    const card = window.ShelfCard.mount(cardHost, { size: 'lg', label: true, u: startU, d: startD });

    /* Right: the price tag + demand deck + collected counter. */
    const panel = document.createElement('div');
    panel.className = 'tut-demo-panel';
    wrap.appendChild(panel);

    const pickRow = document.createElement('div');
    pickRow.className = 'tut-demo-pick';
    pickRow.innerHTML = '<div class="tut-demo-pick-label">' + T('scene1.demo.picked') + '</div>';
    const tag = document.createElement('div');
    tag.className = 'lever-tag';
    tag.setAttribute('data-lever', LEVER_ID);
    tag.innerHTML = T('lever.' + LEVER_ID) +
      '<span class="lever-price">$' + lever.price + T('scene1.levers.perUnit') + '</span>';
    pickRow.appendChild(tag);
    panel.appendChild(pickRow);

    const deckHost = document.createElement('div');
    deckHost.className = 'tut-demo-deck';
    panel.appendChild(deckHost);
    /* Under &run the flip resolves instantly so the demo day settles inside
       the headless screenshot budget. */
    const deck = window.Deck.mount(deckHost, { reduced: !!window.PRICING_AUTORUN });

    const money = document.createElement('div');
    money.className = 'money-counter tut-demo-money';
    money.innerHTML =
      '<span class="money-label">' + T('scene1.demo.collected') + '</span>' +
      '<span class="money-amount"><span class="money-sign">$</span><span class="money-num">0</span></span>';
    panel.appendChild(money);
    const moneyNum = money.querySelector('.money-num');

    /* Play / replay button + a running 4-line script readout. */
    const ctrl = document.createElement('div');
    ctrl.className = 'tut-demo-ctrl poke-menu-row';
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'poke-btn tut-demo-play';
    playBtn.textContent = T('scene1.demo.play');
    ctrl.appendChild(playBtn);
    wrap.appendChild(ctrl);

    const script = document.createElement('ol');
    script.className = 'tut-demo-script';
    const lines = [
      T('scene1.demo.step.set'),
      T('scene1.demo.step.flip'),
      T('scene1.demo.step.sold', { k: DRAW_K, r: lever.price * DRAW_K }),
      T('scene1.demo.step.tick'),
    ];
    for (const ln of lines) {
      const li = document.createElement('li');
      li.className = 'tut-demo-step';
      li.textContent = ln;
      script.appendChild(li);
    }
    wrap.appendChild(script);
    const stepNodes = Array.from(script.querySelectorAll('.tut-demo-step'));

    const note = document.createElement('div');
    note.className = 'tut-footnote poke-caption';
    note.textContent = T('scene1.demo.note');
    host.appendChild(note);

    function lightStep(i) {
      stepNodes.forEach((n, j) => n.classList.toggle('active', j === i));
    }
    /* Collapse the demo choreography under &run so it settles inside the
       headless screenshot budget. */
    const A = (ms) => (window.PRICING_AUTORUN ? Math.min(ms, 60) : ms);

    /* Float a "+$N" receipt over the shelf card in the lever colour. */
    function floatReceipt(amount) {
      const flash = document.createElement('div');
      flash.className = 'money-flash lever-fill-' + LEVER_ID + ' tut-demo-flash';
      flash.textContent = '+$' + amount;
      stage.appendChild(flash);
      later(() => { try { flash.remove(); } catch (_e) {} }, 900);
    }

    let busy = false;
    function resetDay() {
      clearDemoTimers();
      card.set(startU, startD);
      card.setLever(null);
      cardHost.classList.remove('tut-sold', 'tut-tear');
      deck.reset();
      moneyNum.textContent = '0';
      money.classList.remove('money-bump');
      stepNodes.forEach(n => n.classList.remove('active', 'done'));
      playBtn.textContent = T('scene1.demo.play');
    }

    function runDay() {
      if (busy) return;
      busy = true;
      resetDay();
      playBtn.disabled = true;

      /* 1. Pull the tag. */
      lightStep(0);
      card.setLever(LEVER_ID);

      /* 3. A ticket slides off; collect the receipt. Then settle + tear. */
      function afterFlip() {
        lightStep(2);
        stepNodes[1].classList.add('done');
        cardHost.classList.add('tut-sold');
        floatReceipt(lever.price * DRAW_K);
        if (window.SFX) window.SFX.play('hit');
        moneyNum.textContent = String(lever.price * DRAW_K);
        money.classList.add('money-bump');
        later(() => money.classList.remove('money-bump'), 400);

        /* mid-slide, drop the sold unit on the card */
        later(() => {
          card.set(startU - DRAW_K, startD);
          card.setLever(LEVER_ID);
          cardHost.classList.remove('tut-sold');
          stepNodes[2].classList.add('done');

          /* 4. Tear off a day -> tomorrow's shelf. */
          lightStep(3);
          cardHost.classList.add('tut-tear');
          later(() => {
            card.set(startU - DRAW_K, startD - 1);
            card.setLever(null);
            cardHost.classList.remove('tut-tear');
            stepNodes[3].classList.add('done');
            lightStep(-1);
            playBtn.disabled = false;
            playBtn.textContent = T('scene1.demo.replay');
            busy = false;
          }, A(520));
        }, A(360));
      }

      /* 2. Flip the deck. Interactively we await the flip's promise; under
         &run we advance on a plain timer (headless virtual-time stalls on the
         deck's rAF-based resolution). */
      later(() => {
        lightStep(1);
        const flipP = deck.flip({ lever: LEVER_ID, k: DRAW_K });
        if (window.PRICING_AUTORUN) later(afterFlip, A(160));
        else flipP.then(afterFlip);
      }, A(520));
    }

    playBtn.addEventListener('click', runDay);

    /* Headless capture: &run resolves the day so the screenshot shows the
       sold ticket + the +$3 + the torn-off day. */
    if (window.PRICING_AUTORUN) later(runDay, 120);
  }

})();

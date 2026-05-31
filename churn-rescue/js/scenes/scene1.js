/* Scene 1: Tutorial: how to play.
 *
 *   Teaches the vocabulary with ZERO theory, in three panels walked with
 *   left / right arrows (the same step-engine idiom as the Pokemon "How to
 *   play" tutorial, rebuilt around the ACCOUNT CARD instead of a battle
 *   stage):
 *
 *     Panel 1: THE ACCOUNT CARD. The recurring state-icon: a 5-segment
 *               engagement bar (thriving down to cliff) plus a renewal
 *               countdown badge. A reference strip shows all five tiers.
 *     Panel 2: THE THREE LEVERS. DO NOTHING / CHECK-IN / BIG OFFER with
 *               their costs 0 / minus 1 / minus 4 and the grey / blue / gold
 *               colour code introduced here. A cheaper-to-aggressive axis.
 *     Panel 3: THE TWO DICE. A worked example: the learner clicks once to
 *               pull a lever; the RETENTION COIN lands STAY, THEN the
 *               ENGAGEMENT DIE nudges the bar up a notch and the calendar
 *               ticks down a month. Coin THEN die, in strict sequence.
 *
 *   Takeaway: I pull a lever, the world flips a (weighted) coin and rolls a
 *   die, the month advances. Manager framing: the controls are exactly the
 *   choices and the uncertainty you already manage every renewal.
 *
 *   All values come from window.Churn / window.Levers (never hand-typed);
 *   colours come from CSS tokens only. &run jumps to panel 3 and plays the
 *   coin+die demo for headless capture; nothing auto-runs on a bare onEnter.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const Churn = () => window.Churn;
  const Levers = () => window.Levers;

  /* The three tutorial panels. Each id drives i18n lookups
     tut.step.<id>.title / .dialog and a render function below. */
  const STEPS = [
    { id: 'card',  render: renderCardPanel },
    { id: 'levers', render: renderLeversPanel },
    { id: 'dice',  render: renderDicePanel },
  ];

  window.scenes.scene1 = function (root) {
    root.classList.add('scene-pad', 'tut-scene');
    root.innerHTML = '';

    /* ---------- Top bar: step counter + SKIP-to-playtest ---------- */
    const topbar = document.createElement('div');
    topbar.className = 'tut-topbar';
    root.appendChild(topbar);

    const counter = document.createElement('div');
    counter.className = 'tut-step-counter';
    topbar.appendChild(counter);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tut-skip-btn';
    topbar.appendChild(skipBtn);
    skipBtn.addEventListener('click', () => {
      /* Playtest is scene 2. Route through the pager (never hard-code hash
         outside the foundation). */
      if (window.ChurnViz) window.ChurnViz.goTo(2);
    });

    /* ---------- Section title ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title tut-section-title';
    root.appendChild(header);

    /* ---------- Demo area (changes per panel) ---------- */
    const demoHost = document.createElement('div');
    demoHost.className = 'tut-demo';
    root.appendChild(demoHost);

    /* ---------- Dialog at the bottom (manager voice) ---------- */
    const dialogHost = document.createElement('div');
    dialogHost.className = 'tut-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /* ---------- Nav hint ---------- */
    const navHint = document.createElement('div');
    navHint.className = 'tut-nav-hint';
    navHint.innerHTML = T('tut.nav.hint');
    root.appendChild(navHint);

    /* ---------- Step engine ---------- */
    let cursor = 0;
    let panelCleanup = null;

    function renderStep(c) {
      if (panelCleanup) { try { panelCleanup(); } catch (e) {} panelCleanup = null; }
      cursor = Math.max(0, Math.min(STEPS.length - 1, c));
      const step = STEPS[cursor];
      counter.textContent = T('tut.step_of', { i: cursor + 1, total: STEPS.length });
      header.textContent = T('tut.step.' + step.id + '.title').toUpperCase();
      demoHost.innerHTML = '';
      panelCleanup = step.render(demoHost) || null;
      dialog.say(T('tut.step.' + step.id + '.dialog'));
      skipBtn.textContent =
        cursor === STEPS.length - 1 ? T('tut.go_playtest') : T('tut.skip');
    }

    /* Optional `#...&tut=N` deep-link to a panel (used by headless capture). */
    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]tut=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < STEPS.length) ? n : 0;
    }

    /* &run: jump to the dice panel and play the coin+die demo once. The
       dice panel sets the module-level dicePlay hook when it mounts. */
    function maybeRun() {
      if (!/[#&?]run\b/.test(window.location.hash)) return;
      renderStep(2);
      if (typeof dicePlay === 'function') {
        /* Defer so the panel's DOM + card are mounted before we play. */
        setTimeout(() => { try { dicePlay(); } catch (e) {} }, 60);
      }
    }

    renderStep(readInitialStep());
    /* Cold headless entry: main.js builds the scene but does NOT call
       onEnter on first mount, so trigger &run here too (idempotent). */
    maybeRun();

    return {
      onEnter() { renderStep(readInitialStep()); maybeRun(); },
      onLeave() { if (panelCleanup) { try { panelCleanup(); } catch (e) {} panelCleanup = null; } },
      onNextKey() {
        if (cursor < STEPS.length - 1) { renderStep(cursor + 1); return true; }
        return false;   /* fall through: advance to scene 2 (playtest) */
      },
      onPrevKey() {
        if (cursor > 0) { renderStep(cursor - 1); return true; }
        return false;   /* fall through: back to scene 0 (title) */
      },
    };
  };

  /* =========================================================================
     Panel 1: THE ACCOUNT CARD.
     A hero card on the left; a reference strip of all five tiers on the right
     so the learner sees the whole engagement ladder at once. The hero card
     slowly cools (thriving toward at-risk) on a loop so the bar + countdown
     read as "live", with the months ticking down alongside.
     ========================================================================= */
  function renderCardPanel(host) {
    const C = Churn();
    const wrap = document.createElement('div');
    wrap.className = 'tut-card-panel';

    /* ---- Hero card + callouts ---- */
    const hero = document.createElement('div');
    hero.className = 'tut-card-hero';
    const cardHost = document.createElement('div');
    hero.appendChild(cardHost);
    const card = window.AccountCard.mount(cardHost, { tier: 4, m: 5, size: 'full' });

    const callouts = document.createElement('div');
    callouts.className = 'tut-card-callouts';
    callouts.innerHTML =
      '<div class="tut-callout c-bar">' + T('tut.card.callout.bar') + '</div>' +
      '<div class="tut-callout c-countdown">' + T('tut.card.callout.countdown') + '</div>';
    hero.appendChild(callouts);
    wrap.appendChild(hero);

    /* ---- Reference strip: all 5 tiers, thriving (top) down to cliff. ---- */
    const strip = document.createElement('div');
    strip.className = 'tut-tier-strip';
    const stripTitle = document.createElement('div');
    stripTitle.className = 'tut-strip-title';
    stripTitle.textContent = T('tut.card.strip_title');
    strip.appendChild(stripTitle);

    const ladder = document.createElement('div');
    ladder.className = 'tut-tier-ladder';
    for (let tier = C.NUM_TIERS - 1; tier >= 0; tier--) {
      const rowHost = document.createElement('div');
      rowHost.className = 'tut-tier-row';
      const mini = document.createElement('div');
      window.AccountCard.mount(mini, { tier: tier, m: 3, size: 'mini' });
      rowHost.appendChild(mini);
      ladder.appendChild(rowHost);
    }
    strip.appendChild(ladder);
    wrap.appendChild(strip);

    host.appendChild(wrap);

    /* ---- Live cooling loop on the hero card. The account drifts
       thriving toward at-risk while the renewal clock ticks, so the bar +
       badge feel alive. Reduced-motion users get a single static frame. ---- */
    const reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { card.set({ tier: 3, m: 3 }); return null; }

    const frames = [
      { tier: 4, m: 5 }, { tier: 4, m: 4 }, { tier: 3, m: 4 },
      { tier: 3, m: 3 }, { tier: 2, m: 3 }, { tier: 2, m: 2 },
      { tier: 1, m: 2 }, { tier: 1, m: 1 },
    ];
    let fi = 0;
    const timer = setInterval(() => {
      fi = (fi + 1) % frames.length;
      const f = frames[fi];
      if (fi === 0) { card.set(f); }      /* reset jump back to thriving */
      else { card.tickTier(f.tier); card.set({ m: f.m }); }
    }, 1200);
    return () => clearInterval(timer);
  }

  /* =========================================================================
     Panel 2: THE THREE LEVERS.
     The three lever buttons (display-only) with their cost pills + glyphs,
     a cheaper-to-aggressive axis beneath, and a one-line "what it does"
     caption per lever from i18n. Grey / blue / gold colour code lands here.
     ========================================================================= */
  function renderLeversPanel(host) {
    const L = Levers();
    const wrap = document.createElement('div');
    wrap.className = 'tut-lever-panel';

    const menu = document.createElement('div');
    menu.className = 'tut-lever-menu';
    for (const lever of L.LEVERS) {
      const cell = document.createElement('div');
      cell.className = 'tut-lever-cell ' + L.tokenClass(lever.id);

      const btn = document.createElement('div');
      btn.className = 'tut-lever-btn ' + L.tokenClass(lever.id);
      btn.innerHTML =
        '<span class="tut-lever-name">' + T('lever.' + lever.id) + '</span>' +
        '<span class="tut-lever-sub">' + L.leverSubHtml(lever.id) + '</span>';
      cell.appendChild(btn);

      const desc = document.createElement('div');
      desc.className = 'tut-lever-desc';
      desc.textContent = T('tut.lever.' + lever.id + '.desc');
      cell.appendChild(desc);

      menu.appendChild(cell);
    }
    wrap.appendChild(menu);

    /* Cheaper / passive to expensive / aggressive axis (3 labels, aligned). */
    const axis = document.createElement('div');
    axis.className = 'tut-lever-axis';
    axis.innerHTML =
      '<span class="ax-l">' + T('tut.lever.axis.l') + '</span>' +
      '<span class="ax-mid"></span>' +
      '<span class="ax-r">' + T('tut.lever.axis.r') + '</span>';
    wrap.appendChild(axis);

    host.appendChild(wrap);
    return null;
  }

  /* =========================================================================
     Panel 3: THE TWO DICE (the worked example).
     The learner clicks PULL CHECK-IN. The retention coin spins and lands
     STAY; THEN the engagement die tumbles UP and the card's bar ticks a
     segment while the calendar drops a month. A 3-step flow strip below
     lights up in lock-step. Strict sequence: coin fully resolves, then die.
     ========================================================================= */
  let dicePlay = null;   /* module ref so &run can trigger the demo */

  function renderDicePanel(host) {
    dicePlay = null;
    const wrap = document.createElement('div');
    wrap.className = 'tut-dice-panel';

    /* Left: the live card the demo acts on (lukewarm, 3 mo.). */
    const stageCol = document.createElement('div');
    stageCol.className = 'tut-dice-stage';
    const cardHost = document.createElement('div');
    stageCol.appendChild(cardHost);
    const card = window.AccountCard.mount(cardHost, { tier: 2, m: 3, size: 'full' });
    wrap.appendChild(stageCol);

    /* Right: the coin + die widgets and the PULL button. */
    const diceCol = document.createElement('div');
    diceCol.className = 'tut-dice-col';

    const coinRow = document.createElement('div');
    coinRow.className = 'tut-dice-widget';
    const coinLabel = document.createElement('div');
    coinLabel.className = 'tut-dice-wlabel';
    coinLabel.innerHTML = '<span class="tut-dice-step-num">1</span>' + T('coin.name');
    const coinHost = document.createElement('div');
    coinRow.appendChild(coinLabel);
    coinRow.appendChild(coinHost);
    const coin = window.Coin.mount(coinHost, { card: card });

    const dieRow = document.createElement('div');
    dieRow.className = 'tut-dice-widget';
    const dieLabel = document.createElement('div');
    dieLabel.className = 'tut-dice-wlabel';
    dieLabel.innerHTML = '<span class="tut-dice-step-num">2</span>' + T('die.name');
    const dieHost = document.createElement('div');
    dieRow.appendChild(dieLabel);
    dieRow.appendChild(dieHost);
    const die = window.D6.mount(dieHost, { card: card });

    diceCol.appendChild(coinRow);
    diceCol.appendChild(dieRow);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'poke-btn tut-dice-play';
    playBtn.innerHTML = '<span class="lever-checkin">' + T('lever.checkin') + '</span> &#9654;';
    diceCol.appendChild(playBtn);

    wrap.appendChild(diceCol);
    host.appendChild(wrap);

    /* Flow strip beneath: PULL to COIN:STAYS to DIE:UP to NEXT MONTH. */
    const flow = document.createElement('div');
    flow.className = 'tut-dice-flow';
    const flowSteps = [
      { key: 'pull', icon: '&#9758;' },
      { key: 'coin', icon: '&#10003;' },
      { key: 'die',  icon: '&#9650;' },
      { key: 'month', icon: '&#10227;' },
    ];
    const flowNodes = [];
    flowSteps.forEach((s, i) => {
      const node = document.createElement('div');
      node.className = 'tut-flow-step';
      node.innerHTML =
        '<span class="tut-flow-icon">' + s.icon + '</span>' +
        '<span class="tut-flow-label">' + T('tut.dice.flow.' + s.key) + '</span>';
      flow.appendChild(node);
      flowNodes.push(node);
      if (i < flowSteps.length - 1) {
        const arr = document.createElement('span');
        arr.className = 'tut-flow-arrow';
        arr.innerHTML = '&#8594;';
        flow.appendChild(arr);
      }
    });
    host.appendChild(flow);

    function setFlow(activeIdx) {
      flowNodes.forEach((n, i) => n.classList.toggle('active', i === activeIdx));
    }

    let busy = false;
    const startTier = 2, startM = 3;

    function reset() {
      card.ungrey();
      card.set({ tier: startTier, m: startM });
      coin.el.classList.remove('is-stay', 'is-churn', 'spinning');
      coin.el.querySelector('.coin-result').textContent = '';
      coin.el.querySelector('.coin-face').innerHTML = '';
      die.el.classList.remove('face-up', 'face-same', 'face-down', 'tumbling');
      die.el.querySelector('.die-result').textContent = '';
      die.el.querySelector('.die-face').innerHTML = '';
      setFlow(-1);
    }
    reset();

    /* The scripted worked example: a STAY coin, then an UP die. The toTier
       is read off the card so the bar tick stays consistent with the
       engine's clamp rules. */
    async function play() {
      if (busy) return;
      busy = true;
      playBtn.disabled = true;
      reset();

      setFlow(0);
      if (window.SFX) window.SFX.play('cursor');
      await wait(420);

      /* 1) COIN: STAYS. */
      setFlow(1);
      await coin.flip('stay');
      await wait(520);

      /* 2) DIE: UP (bar ticks a segment toward thriving). */
      setFlow(2);
      const toTier = Math.min((Churn().NUM_TIERS - 1), startTier + 1);
      await die.roll('up', null, toTier);
      await wait(520);

      /* 3) MONTH advances (countdown drops one). */
      setFlow(3);
      card.set({ m: startM - 1 });
      if (window.SFX) window.SFX.play('cursor');
      await wait(700);

      busy = false;
      playBtn.disabled = false;
    }
    dicePlay = play;

    playBtn.addEventListener('click', play);

    return () => { dicePlay = null; };
  }

  function wait(ms) {
    const reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Promise(r => setTimeout(r, reduce ? Math.min(ms, 30) : ms));
  }

})();

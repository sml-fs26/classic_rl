/* Scene 1 - Tutorial: "How to play".
 *
 * Teaches the controls with NO math, in the table-card visual language:
 *   step 1  welcome           - the table card (pot meter + standing badge)
 *   step 2  the pot meter      - what is riding this turn
 *   step 3  the standing badge - are you ahead or behind the rival
 *   step 4  two levers + die   - ROLL / HOLD and the part you do not control
 *   step 5  the demo turn      - one slow turn played for you:
 *             ROLL->4 (pot 4), ROLL->6 (pot 10), ROLL->1 (BUST + shake),
 *             then a clean turn that ends on HOLD (banks with a chunk).
 *
 * Stepped with the same left/right engine the rest of the deck uses. The
 * demo on step 5 auto-triggers under &run for headless capture; otherwise it
 * waits for the PLAY THE TURN button. Built entirely from the shared widgets
 * (TableCard, Die), Dialog, and SFX - no engine math is shown.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const RUN = /[#&?]run\b/.test(window.location.hash || '');

  /* The scripted demo turn. Each ROLL step carries its forced die face and
     the dialog line; HOLD banks. Faces are fixed so the tutorial reads the
     same every time (the engine math is never invoked here - this is a
     hand-scripted walkthrough of the FEEL of a turn). */
  const DEMO = [
    { kind: 'intro', dialog: 'tut.demo.dialog.intro' },
    { kind: 'roll', face: 4, pot: 4,  dialog: 'tut.demo.dialog.roll4' },
    { kind: 'roll', face: 6, pot: 10, dialog: 'tut.demo.dialog.roll6' },
    { kind: 'roll', face: 1, pot: 0,  bust: true, dialog: 'tut.demo.dialog.roll1' },
    { kind: 'reset', dialog: 'tut.demo.dialog.reset' },
    { kind: 'roll', face: 5, pot: 5,  dialog: 'tut.demo.dialog.roll5' },
    { kind: 'roll', face: 3, pot: 8,  dialog: 'tut.demo.dialog.roll3' },
    { kind: 'hold', bank: 8, dialog: 'tut.demo.dialog.hold' }
  ];

  const STEPS = ['welcome', 'pot', 'stand', 'levers', 'demo'];

  window.scenes.scene1 = function (root) {
    root.classList.add('scene-pad', 's1-tut');
    root.innerHTML = '';

    /* ---------- top bar: step counter + SKIP ---------- */
    const topbar = document.createElement('div');
    topbar.className = 's1-topbar';
    root.appendChild(topbar);

    const counter = document.createElement('div');
    counter.className = 's1-step-counter';
    topbar.appendChild(counter);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 's1-skip pyl-btn';
    skipBtn.title = T('tut.skip_title');
    topbar.appendChild(skipBtn);
    skipBtn.addEventListener('click', () => { window.location.hash = '#scene=2'; });

    /* ---------- section title ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title s1-section-title';
    root.appendChild(header);

    /* ---------- demo area (changes per step) ---------- */
    const demoHost = document.createElement('div');
    demoHost.className = 's1-demo';
    root.appendChild(demoHost);

    /* ---------- dialog ---------- */
    const dialogHost = document.createElement('div');
    dialogHost.className = 's1-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /* ---------- nav hint ---------- */
    const navHint = document.createElement('div');
    navHint.className = 's1-nav-hint';
    navHint.innerHTML = T('tut.nav.hint');
    root.appendChild(navHint);

    /* ---------- async helpers + cancellation ---------- */
    let episode = 0;            // bumped on every step change / leave; aborts the demo
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function dialogSay(line) {
      return new Promise((resolve) => { dialog.say(line); dialog.onDone(resolve); });
    }

    /* ---------- step engine ---------- */
    let cursor = 0;

    function renderStep(c) {
      episode++;               // cancel any in-flight demo from the prior step
      cursor = Math.max(0, Math.min(STEPS.length - 1, c));
      const id = STEPS[cursor];
      counter.textContent = T('tut.step_of', { i: cursor + 1, total: STEPS.length });
      header.textContent = T('tut.' + id + '.title').toUpperCase();
      demoHost.innerHTML = '';
      RENDERERS[id](demoHost);
      skipBtn.textContent = (cursor === STEPS.length - 1) ? T('tut.go_to_play') : T('tut.skip');
    }

    /* Deep-link into a specific tutorial step via #...&tut=N (headless). */
    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]tut=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < STEPS.length) ? n : 0;
    }

    /* =====================================================================
       STEP RENDERERS
       ===================================================================== */
    const RENDERERS = {
      welcome: renderWelcome,
      pot: renderPot,
      stand: renderStand,
      levers: renderLevers,
      demo: renderDemo
    };

    /* ---- step 1: welcome - the table card front and centre ---- */
    function renderWelcome(host) {
      const wrap = document.createElement('div');
      wrap.className = 's1-welcome';

      const cardHost = document.createElement('div');
      cardHost.className = 's1-card-xl';
      wrap.appendChild(cardHost);
      const card = window.TableCard.mount(cardHost);
      card.set({ pot: 8, my: 14, riv: 20 });

      const txt = document.createElement('div');
      txt.className = 's1-welcome-text';
      txt.innerHTML =
        '<div class="s1-welcome-big">' + T('tut.welcome.big') + '</div>' +
        '<div class="s1-welcome-small">' + T('tut.welcome.small') + '</div>';
      wrap.appendChild(txt);

      host.appendChild(wrap);
      dialog.say(T('tut.welcome.dialog'));
    }

    /* ---- step 2: the pot meter, with callouts ---- */
    function renderPot(host) {
      const wrap = document.createElement('div');
      wrap.className = 's1-focus s1-focus-pot';

      const cardHost = document.createElement('div');
      cardHost.className = 's1-card-xl';
      wrap.appendChild(cardHost);
      const card = window.TableCard.mount(cardHost);
      card.set({ pot: 18, my: 14, riv: 20 });   // bucket 16-20: high but not yet red

      const calls = document.createElement('div');
      calls.className = 's1-callouts';
      calls.innerHTML =
        '<div class="s1-callout c-pot">' + T('tut.pot.callout') + '</div>' +
        '<div class="s1-callout c-danger">' + T('tut.pot.danger') + '</div>';
      wrap.appendChild(calls);

      host.appendChild(wrap);
      dialog.say(T('tut.pot.dialog'));

      /* Gently demo the danger band: tick the pot up into the red so the
         glow is felt, then settle back. Looping while the step is shown. */
      const myEp = episode;
      (async function loop() {
        while (episode === myEp && host.isConnected) {
          await wait(1500);
          if (episode !== myEp) return;
          card.pop(5);                 // climb into the 21+ danger band
          await wait(1300);
          if (episode !== myEp) return;
          card.set({ pot: 18, my: 14, riv: 20 });
        }
      })();
    }

    /* ---- step 3: the standing badge - cycle BEHIND / EVEN / AHEAD ---- */
    function renderStand(host) {
      const wrap = document.createElement('div');
      wrap.className = 's1-focus s1-focus-stand';

      const cardHost = document.createElement('div');
      cardHost.className = 's1-card-xl';
      wrap.appendChild(cardHost);
      const card = window.TableCard.mount(cardHost);

      const legend = document.createElement('div');
      legend.className = 's1-stand-legend';
      legend.innerHTML =
        '<div class="s1-stand-row s-behind"><span class="s1-swatch"></span>' + T('tut.stand.behind') + '</div>' +
        '<div class="s1-stand-row s-even"><span class="s1-swatch"></span>' + T('tut.stand.even') + '</div>' +
        '<div class="s1-stand-row s-ahead"><span class="s1-swatch"></span>' + T('tut.stand.ahead') + '</div>';
      wrap.appendChild(legend);

      host.appendChild(wrap);
      dialog.say(T('tut.stand.dialog'));

      /* Cycle the three standings so each colour is seen, highlighting the
         matching legend row. */
      const SCENARIOS = [
        { my: 8,  riv: 20, cls: 's-behind' },
        { my: 16, riv: 16, cls: 's-even' },
        { my: 22, riv: 10, cls: 's-ahead' }
      ];
      const rows = legend.querySelectorAll('.s1-stand-row');
      let i = 0;
      function show() {
        const s = SCENARIOS[i % SCENARIOS.length];
        card.set({ pot: 6, my: s.my, riv: s.riv });
        rows.forEach(r => r.classList.toggle('active', r.classList.contains(s.cls)));
      }
      show();
      const myEp = episode;
      (async function loop() {
        while (episode === myEp && host.isConnected) {
          await wait(1700);
          if (episode !== myEp) return;
          i++;
          show();
        }
      })();
    }

    /* ---- step 4: the two levers + the die ---- */
    function renderLevers(host) {
      const wrap = document.createElement('div');
      wrap.className = 's1-levers-demo';

      const menu = document.createElement('div');
      menu.className = 's1-lever-menu';
      const icons = (window.Levers && window.Levers.leverIconSvg) || function () { return ''; };
      const LEVERS = (window.Levers && window.Levers.LEVERS) || [];
      for (const lv of LEVERS) {
        const btn = document.createElement('div');
        btn.className = 's1-lever-btn ' + lv.tokenClass;
        btn.innerHTML =
          '<span class="s1-lever-ic">' + icons(lv.id) + '</span>' +
          '<span class="s1-lever-name">' + T('vocab.' + lv.id) + '</span>' +
          '<span class="s1-lever-sub">' + T('tut.levers.' + lv.id + '_sub') + '</span>';
        menu.appendChild(btn);
      }
      wrap.appendChild(menu);

      const dieWrap = document.createElement('div');
      dieWrap.className = 's1-die-wrap';
      const dieHost = document.createElement('div');
      dieWrap.appendChild(dieHost);
      const dieLabel = document.createElement('div');
      dieLabel.className = 's1-die-label';
      dieLabel.textContent = T('tut.levers.die');
      dieWrap.appendChild(dieLabel);
      wrap.appendChild(dieWrap);

      host.appendChild(wrap);
      dialog.say(T('tut.levers.dialog'));

      /* Mount the die and idly tumble it so "the part you do not control"
         is alive on screen (silent - no pot wired up here). */
      const die = window.Die.mount(dieHost, {});
      const myEp = episode;
      (async function loop() {
        while (episode === myEp && host.isConnected) {
          await die.roll(null, { silent: true });
          if (episode !== myEp) return;
          await wait(1100);
        }
      })();
    }

    /* ---- step 5: the demo turn ---- */
    function renderDemo(host) {
      const wrap = document.createElement('div');
      wrap.className = 's1-demo-turn';

      const intro = document.createElement('div');
      intro.className = 's1-demo-intro';
      intro.textContent = T('tut.demo.intro');
      wrap.appendChild(intro);

      /* The stage: table card | die | banked counter. */
      const stage = document.createElement('div');
      stage.className = 's1-demo-stage';
      wrap.appendChild(stage);

      const cardHost = document.createElement('div');
      cardHost.className = 's1-demo-card';
      stage.appendChild(cardHost);
      const card = window.TableCard.mount(cardHost);
      card.set({ pot: 0, my: 0, riv: 0 });

      const dieHost = document.createElement('div');
      dieHost.className = 's1-demo-die';
      stage.appendChild(dieHost);

      const bank = document.createElement('div');
      bank.className = 'pyl-bank pyl-bank-you s1-demo-bank';
      bank.innerHTML =
        '<span class="pyl-bank-label">' + T('tut.demo.bank_label') + '</span>' +
        '<span class="pyl-bank-num">0</span>';
      stage.appendChild(bank);
      const bankNum = bank.querySelector('.pyl-bank-num');

      /* Controls. */
      const ctrls = document.createElement('div');
      ctrls.className = 's1-demo-ctrls';
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 's1-demo-play pyl-btn';
      playBtn.textContent = T('tut.demo.btn.play');
      ctrls.appendChild(playBtn);
      wrap.appendChild(ctrls);

      const takeaway = document.createElement('div');
      takeaway.className = 's1-demo-takeaway';
      takeaway.textContent = T('tut.demo.takeaway');
      takeaway.style.visibility = 'hidden';
      wrap.appendChild(takeaway);

      host.appendChild(wrap);

      /* The die fires the pot-pop / bust effects onto THIS card + stage. */
      const die = window.Die.mount(dieHost, {
        shakeTarget: stage,
        onPotPop: function (face) {
          /* card.pop is driven explicitly per scripted step so the bucket
             matches the running pot; here we only spawn the flying +N. */
          flyChip(face);
        },
        onBust: function () { /* collapse handled in the demo loop */ }
      });

      /* Spawn a "+N" chip near the die that arcs up toward the pot meter. */
      function flyChip(n) {
        if (reducedMotion()) return;
        const chip = document.createElement('div');
        chip.className = 'pyl-fly-chip';
        chip.textContent = '+' + n;
        const sRect = stage.getBoundingClientRect();
        const dRect = dieHost.getBoundingClientRect();
        chip.style.left = (dRect.left - sRect.left + dRect.width / 2 - 10) + 'px';
        chip.style.top = (dRect.top - sRect.top - 4) + 'px';
        stage.appendChild(chip);
        setTimeout(() => { try { chip.remove(); } catch (_e) {} }, 600);
      }
      function reducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      function chunkBank() {
        bank.classList.remove('pyl-bank-chunk');
        void bank.offsetWidth;
        bank.classList.add('pyl-bank-chunk');
        setTimeout(() => bank.classList.remove('pyl-bank-chunk'), 340);
      }

      let playing = false;

      async function playDemo() {
        if (playing) return;
        playing = true;
        playBtn.disabled = true;
        const myEp = episode;

        /* Reset visuals. */
        card.set({ pot: 0, my: 0, riv: 0 });
        bankNum.textContent = '0';
        takeaway.style.visibility = 'hidden';

        for (const stepDef of DEMO) {
          if (episode !== myEp) { playing = false; return; }

          if (stepDef.kind === 'intro' || stepDef.kind === 'reset') {
            if (stepDef.kind === 'reset') card.set({ pot: 0, my: 0, riv: 0 });
            await dialogSay(T(stepDef.dialog));
            if (episode !== myEp) { playing = false; return; }
            await wait(stepDef.kind === 'reset' ? 700 : 600);
            continue;
          }

          if (stepDef.kind === 'roll') {
            await dialogSay(T(stepDef.dialog));
            if (episode !== myEp) { playing = false; return; }
            /* Roll the die to the forced face; the die fires onPotPop / onBust. */
            await die.roll(stepDef.face);
            if (episode !== myEp) { playing = false; return; }
            await wait(220);
            if (stepDef.bust) {
              /* THE BUST - collapse the stack (screen-shake already fired). */
              await card.collapse();
            } else {
              /* THE ROLL - pop the meter up to the new pot's bucket. */
              const pb = window.Pig ? window.Pig.bucketOfPot(stepDef.pot) : 1;
              card.pop(pb);
            }
            await wait(900);
            continue;
          }

          if (stepDef.kind === 'hold') {
            await dialogSay(T(stepDef.dialog));
            if (episode !== myEp) { playing = false; return; }
            /* THE HOLD - slide the pot into the bank with a chunk. */
            if (window.SFX) window.SFX.play('cursor');
            chunkBank();
            bankNum.textContent = String(stepDef.bank);
            card.set({ pot: 0, my: stepDef.bank, riv: 0 });
            await wait(900);
            continue;
          }
        }

        if (episode !== myEp) { playing = false; return; }
        takeaway.style.visibility = 'visible';
        playBtn.disabled = false;
        playBtn.textContent = T('tut.demo.btn.replay');
        playing = false;
      }

      playBtn.addEventListener('click', () => playDemo());

      /* Paint the deterministic END of the demo in one shot (the clean turn
         banked its 8): pot cleared, bank = 8, takeaway shown. Used for &run
         so a headless capture lands on a stable, meaningful frame without
         depending on a 14 s timed animation completing under virtual time. */
      function showEndState() {
        const last = DEMO[DEMO.length - 1];
        die.show(3);                         // the last roll before HOLD
        card.set({ pot: 0, my: last.bank, riv: 0 });
        bankNum.textContent = String(last.bank);
        takeaway.style.visibility = 'visible';
        playBtn.textContent = T('tut.demo.btn.replay');
        dialog.say(T('tut.demo.dialog.hold'), { instant: true });
      }

      if (RUN) {
        /* Headless / autorun: jump straight to the banked end-state. */
        showEndState();
      } else {
        /* Idle prompt before the user presses PLAY. */
        dialog.say(T('tut.demo.dialog.intro'));
      }
    }

    /* ---------- boot ---------- */
    renderStep(readInitialStep());

    return {
      onEnter() { renderStep(readInitialStep()); },
      onLeave() { episode++; },     // abort any running demo loop
      onNextKey() {
        if (cursor < STEPS.length - 1) { renderStep(cursor + 1); return true; }
        return false;               // fall through: advance to scene 2
      },
      onPrevKey() {
        if (cursor > 0) { renderStep(cursor - 1); return true; }
        return false;               // fall through: back to scene 0
      }
    };
  };
})();

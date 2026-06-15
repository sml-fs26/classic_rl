/* Tutorial, "How to play".
 *
 * Optional refresher scene for students who've never picked up a Gen-1
 * Pokemon game. Slotted between the title (scene 0) and the battle
 * (scene 1) in the deck, but every step has a prominent SKIP TUTORIAL
 * button that jumps straight to the battle.
 *
 * The tutorial is six steps walked with ← / →. Each step has:
 *   • A static visual demo (replicates the relevant slice of the battle UI)
 *   • A typewriter dialog box in Prof.-Oak voice
 *   • A "Step N / 6" indicator
 * The Pokemon-flavoured visuals reuse the existing battle CSS so the
 * tutorial *looks* identical to the real battle, students see the
 * exact elements they'll interact with in scene 1. */
(function () {
  window.scenes = window.scenes || {};

  /* Module-level i18n helper, used by both the scene builder and
     the per-step render functions below. */
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* Step ids drive i18n lookups: tut.step.<id>.title / .dialog. The
     dialog for the welcome step uses {name} interpolation so the
     trainer's chosen name appears in either language. */
  const STEPS_DATA = [
    { id: 'welcome', render: renderStepWelcome     },
    { id: 'battle',  render: renderStepBattleScreen },
    { id: 'hp',      render: renderStepHpBuckets   },
    { id: 'moves',   render: renderStepMoves       },
    { id: 'turn',    render: renderStepTurnOrder   },
    { id: 'winlose', render: renderStepWinLose     },
  ];

  window.scenes.sceneHowToPlay = function (root) {
    root.classList.add('scene-pad', 'tutorial-scene');
    root.innerHTML = '';

    /* Personalise the welcome line with the trainer's name (set on
       first scene transition out of the title screen). */
    const trainerName = (window.Trainer && window.Trainer.getName()) || T('trainer.modal.placeholder');
    function stepTitle(step)  { return T('tut.step.' + step.id + '.title'); }
    function stepDialog(step) {
      const key = 'tut.step.' + step.id + '.dialog';
      return T(key, { name: trainerName });
    }

    /*, Top bar: step counter + SKIP button, */
    const topbar = document.createElement('div');
    topbar.className = 'tutorial-topbar';
    root.appendChild(topbar);

    const counter = document.createElement('div');
    counter.className = 'tutorial-step-counter';
    topbar.appendChild(counter);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tutorial-skip-btn';
    skipBtn.textContent = T('tut.skip');
    skipBtn.title = T('tut.skip_title');
    topbar.appendChild(skipBtn);
    skipBtn.addEventListener('click', () => {
      /* Tutorial is at index 1; battle is at index 2 after insertion. */
      window.location.hash = '#scene=2';
    });

    /*, Section title, */
    const header = document.createElement('h2');
    header.className = 'poke-section-title tutorial-section-title';
    root.appendChild(header);

    /*, Demo area (changes per step), */
    const demoHost = document.createElement('div');
    demoHost.className = 'tutorial-demo';
    root.appendChild(demoHost);

    /*, Dialog at the bottom, */
    const dialogHost = document.createElement('div');
    dialogHost.className = 'tutorial-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /*, Nav hint, */
    const navHint = document.createElement('div');
    navHint.className = 'tutorial-nav-hint';
    navHint.innerHTML = T('tut.nav.hint');
    root.appendChild(navHint);

    /*, Step engine, */
    let cursor = 0;

    function renderStep(c) {
      cursor = c;
      /* Any prior step's animation loop must be stopped before its DOM is
         torn down, both the HP-bucket demo and the turn-flow demo
         register setTimeouts that would keep firing into an empty
         demoHost otherwise. */
      stopHpAnimation();
      stopTurnAnimation();
      const step = STEPS_DATA[c];
      counter.textContent = T('tut.step_of', { i: c + 1, total: STEPS_DATA.length });
      header.textContent = stepTitle(step).toUpperCase();
      demoHost.innerHTML = '';
      step.render(demoHost);
      dialog.say(stepDialog(step));
      /* On the last step, swap the skip-button text to "GO TO BATTLE" so the
         student feels closure. */
      skipBtn.textContent =
        c === STEPS_DATA.length - 1 ? T('tut.go_to_battle') : T('tut.skip');
    }

    /* Optional `#…&tut=N` hash flag jumps straight to internal step N, used
       for headless screenshots and deep-linking. */
    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]tut=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < STEPS_DATA.length) ? n : 0;
    }
    renderStep(readInitialStep());

    return {
      onEnter() { renderStep(readInitialStep()); },
      onLeave() { stopHpAnimation(); stopTurnAnimation(); },
      onNextKey() {
        if (cursor < STEPS_DATA.length - 1) {
          renderStep(cursor + 1);
          return true;
        }
        return false;          /* fall through to scene-engine: advance to scene 1 (battle) */
      },
      onPrevKey() {
        if (cursor > 0) {
          renderStep(cursor - 1);
          return true;
        }
        return false;          /* fall through: back to scene 0 (title) */
      },
    };
  };

  /* =========================================================================
     Per-step render functions, each receives the demo host and fills it.
     ========================================================================= */

  function renderStepWelcome(host) {
    /* A friendly opening: a single big PIKACHU silhouette + welcome panel. */
    const wrap = document.createElement('div');
    wrap.className = 'tut-welcome';
    wrap.innerHTML =
      '<div class="tut-welcome-sprite">' +
        '<img src="assets/pikachu-front.png" alt="' + T('pokemon.pikachu') + '" class="poke-sprite tut-big-sprite">' +
      '</div>' +
      '<div class="tut-welcome-text">' +
        '<div class="tut-welcome-line big">'   + T('tut.welcome.big')   + '</div>' +
        '<div class="tut-welcome-line small">' + T('tut.welcome.small') + '</div>' +
      '</div>';
    host.appendChild(wrap);
  }

  function renderStepBattleScreen(host) {
    /* Clone of the scene-1 battle stage layout, but with callout labels
       pointing at each part.  No interaction.

       Staggered reveal: PIKACHU + its HP fade in immediately; the wild
       CHARMANDER + its HP follow ~900 ms later.  This gives students a
       beat to register the player's side ("that's you") before the
       opponent appears ("here comes the foe").  The stagger is driven
       by the .tut-stage-stage2 CSS class which delays a fade-in
       animation; prefers-reduced-motion users get an instant render. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage tut-stage';
    stage.innerHTML =
      '<div class="grass-rim"></div>' +
      '<div class="platform opponent"></div>' +
      '<div class="platform player"></div>' +
      '<div class="sprite-host opponent tut-stage-stage2"></div>' +
      '<div class="sprite-host player"></div>';
    host.appendChild(stage);

    window.Sprite.mount(stage.querySelector('.sprite-host.opponent'), 'charmander', 'opponent');
    window.Sprite.mount(stage.querySelector('.sprite-host.player'),   'pikachu',   'player');

    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    window.HPBar.mount(oppHpHost, {
      name: T('pokemon.charmander'), side: 'opponent', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });
    window.HPBar.mount(playerHpHost, {
      name: T('pokemon.pikachu'),    side: 'player',   level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });
    /* HPBar.mount overwrites host.className, so add the stagger class here. */
    oppHpHost.classList.add('tut-stage-stage2');

    /* Callout overlay layer.  Pure CSS-positioned labels (no SVG arrows, 
       the dotted-border + text strip is enough at this scale).  Opponent
       callouts ride the same .tut-stage-stage2 delay as the sprite/HP. */
    const callouts = document.createElement('div');
    callouts.className = 'tut-callouts';
    callouts.innerHTML =
      '<div class="tut-callout c-pika">'                       + T('tut.callout.you')      + '</div>' +
      '<div class="tut-callout c-charm tut-stage-stage2">'     + T('tut.callout.wild')     + '</div>' +
      '<div class="tut-callout c-pikahp">'                     + T('tut.callout.your_hp')  + '</div>' +
      '<div class="tut-callout c-charmhp tut-stage-stage2">'   + T('tut.callout.their_hp') + '</div>';
    stage.appendChild(callouts);
  }

  /* Step 3, HP has five buckets.
     Two layers: (1) a live demo at the top with Charmander taking damage in a
     loop (the bar drains, a "−1 HP" damage flash floats up, the sprite
     faints, the demo resets); (2) below it, a comic-strip reference showing
     all six stages, FULL → HIGH → MID → LOW → CRITICAL → FAINTED, with
     "−1 HP" arrows between panels, so the student sees the whole ladder at
     once. */
  /* Bucket order matches Battle.BUCKETS, label is looked up live so a
     language toggle re-paints the demo without reseting the animation. */
  const HP_STAGES = [
    { key: 'full',     pct: 100, cls: '' },
    { key: 'high',     pct: 80,  cls: 'b1' },
    { key: 'mid',      pct: 60,  cls: 'b2' },
    { key: 'low',      pct: 40,  cls: 'b3' },
    { key: 'critical', pct: 20,  cls: 'b4' },
  ];
  function hpStageLabel(s) { return T('hp.bucket.' + s.key); }
  let hpAnimTimer = null;
  function stopHpAnimation() {
    if (hpAnimTimer) { clearInterval(hpAnimTimer); hpAnimTimer = null; }
  }
  function spawnHpDamage(host, text, color) {
    const el = document.createElement('div');
    el.className = 'tut-hp-anim-dmg';
    el.textContent = text;
    if (color) el.style.color = color;
    host.appendChild(el);
    setTimeout(() => { try { host.removeChild(el); } catch (e) {} }, 1100);
  }
  function startHpAnimation() {
    stopHpAnimation();
    let i = 1;     // start at HIGH so the first tick visibly drains from FULL
    function tick() {
      const fill   = document.getElementById('tut-hp-anim-fill');
      const label  = document.getElementById('tut-hp-anim-label');
      const sprite = document.getElementById('tut-hp-anim-img');
      const stage  = document.getElementById('tut-hp-anim-stage');
      if (!fill || !label || !sprite || !stage) { stopHpAnimation(); return; }

      if (i < HP_STAGES.length) {
        const b = HP_STAGES[i];
        fill.style.width = b.pct + '%';
        fill.className = 'tut-hp-anim-fill ' + b.cls;
        label.textContent = hpStageLabel(b);
        sprite.classList.remove('fainted');
        spawnHpDamage(stage, T('hp.damage_minus', { n: 1 }));
      } else if (i === HP_STAGES.length) {
        fill.style.width = '0%';
        fill.className = 'tut-hp-anim-fill b4';
        label.textContent = T('tut.hp.fainted_flash');
        sprite.classList.add('fainted');
        spawnHpDamage(stage, T('hp.faint_flash'), '#962a1a');
      } else {
        /* Reset to FULL for the next loop. */
        fill.style.width = '100%';
        fill.className = 'tut-hp-anim-fill';
        label.textContent = T('hp.bucket.full');
        sprite.classList.remove('fainted');
        i = 0;
      }
      i++;
    }
    hpAnimTimer = setInterval(tick, 1300);
  }

  function renderStepHpBuckets(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-hp-demo';

    /* Live animated demo */
    const anim = document.createElement('div');
    anim.className = 'tut-hp-anim';
    anim.innerHTML =
      '<div class="tut-hp-anim-title">' + T('tut.hp.watch') + '</div>' +
      '<div class="tut-hp-anim-stage" id="tut-hp-anim-stage">' +
        '<img id="tut-hp-anim-img" src="assets/charmander-front.png" class="poke-sprite tut-hp-anim-sprite" alt="' + T('pokemon.charmander') + '">' +
        '<div class="tut-hp-anim-bar">' +
          '<div class="tut-hp-anim-track">' +
            '<div class="tut-hp-anim-fill" id="tut-hp-anim-fill" style="width:100%"></div>' +
          '</div>' +
          '<div class="tut-hp-anim-label" id="tut-hp-anim-label">' + T('hp.bucket.full') + '</div>' +
        '</div>' +
      '</div>';
    wrap.appendChild(anim);

    /* Comic-strip reference: all six stages at once with damage arrows. */
    const strip = document.createElement('div');
    strip.className = 'tut-hp-strip';
    const allStages = HP_STAGES.concat([{ key: 'fainted_flash', pct: 0, cls: 'b4', fainted: true }]);
    for (let i = 0; i < allStages.length; i++) {
      const s = allStages[i];
      const panel = document.createElement('div');
      panel.className = 'tut-hp-panel' + (s.fainted ? ' fainted' : '');
      const label = s.fainted ? T('tut.hp.fainted_flash') : hpStageLabel(s);
      panel.innerHTML =
        '<img class="poke-sprite tut-hp-panel-sprite" src="assets/charmander-front.png" alt="">' +
        '<div class="tut-hp-panel-track">' +
          '<div class="tut-hp-panel-fill ' + s.cls + '" style="width:' + s.pct + '%"></div>' +
        '</div>' +
        '<div class="tut-hp-panel-label">' + label + '</div>';
      strip.appendChild(panel);
      if (i < allStages.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'tut-hp-arrow';
        arrow.innerHTML =
          '<div class="tut-hp-arrow-dmg">' + T('hp.damage_minus', { n: 1 }) + '</div>' +
          '<div class="tut-hp-arrow-line">→</div>';
        strip.appendChild(arrow);
      }
    }
    wrap.appendChild(strip);

    const footnote = document.createElement('div');
    footnote.className = 'tut-footnote';
    footnote.innerHTML = T('tut.hp.footnote');
    wrap.appendChild(footnote);

    host.appendChild(wrap);

    /* Kick off the looping damage animation. */
    startHpAnimation();
  }

  function renderStepMoves(host) {
    /* Step 4, two layers only:
         1. The move buttons (replica of scene 1, disabled).
         2. An axis strip under them that makes the left-right gradient
            (more damage / less reliable) explicit.
       The form-vs-move effectiveness grid was dropped; the evolution
       twist is mentioned in the dialog and discovered through play. */
    const wrap = document.createElement('div');
    wrap.className = 'tut-move-demo';

    /* 1. Move menu (no PWR/ACC strip, moveSubHtml now returns just the type pill). */
    const menu = document.createElement('div');
    menu.className = 'move-menu tut-move-menu';
    for (const m of window.Moves.MOVES) {
      const btn = document.createElement('button');
      btn.className = 'move-btn';
      btn.type = 'button';
      btn.disabled = true;
      btn.innerHTML = T('move.' + m.id) + '<span class="move-sub">' + window.Moves.moveSubHtml(m.id) + '</span>';
      menu.appendChild(btn);
    }
    wrap.appendChild(menu);

    /* 2. Gradient axis, three labels aligned to the three buttons. */
    const axis = document.createElement('div');
    axis.className = 'tut-move-axis';
    axis.innerHTML =
      '<span class="ax-l">' + T('tut.moves.axis.l') + '</span>' +
      '<span class="ax-m">' + T('tut.moves.axis.m') + '</span>' +
      '<span class="ax-r">' + T('tut.moves.axis.r') + '</span>';
    wrap.appendChild(axis);

    host.appendChild(wrap);
  }

  /* Looping turn-flow demo (step 4). PIKACHU lunges + lightning,
     CHARMANDER shakes; then CHARMANDER lunges + ember, PIKACHU shakes;
     then a brief settling beat. The 3-row diagram below the stage
     highlights whichever phase is happening, in lock-step. */
  let turnAnimTimer = null;
  let turnHpResetTimer = null;
  function stopTurnAnimation() {
    if (turnAnimTimer) { clearTimeout(turnAnimTimer); turnAnimTimer = null; }
    if (turnHpResetTimer) { clearTimeout(turnHpResetTimer); turnHpResetTimer = null; }
  }
  function spawnTurnFlash(stage, side, text, color) {
    const el = document.createElement('div');
    el.className = 'tut-turn-flash ' + side;
    el.textContent = text;
    if (color) el.style.color = color;
    stage.appendChild(el);
    setTimeout(() => { try { stage.removeChild(el); } catch (e) {} }, 1100);
  }
  /* Phase ladder: each entry says how long to dwell, which row to
     highlight, and what to do on entry (sprite classes + damage flash). */
  const TURN_PHASES = [
    {
      dwell: 1400, row: 0,
      enter(stage) {
        stage.classList.add('attack-pika');
        spawnTurnFlash(stage, 'opp', T('hp.damage_minus', { n: 1 }), 'var(--cb-vermillion)');
      },
      leave(stage) { stage.classList.remove('attack-pika'); },
    },
    {
      dwell: 1400, row: 1,
      enter(stage) {
        stage.classList.add('attack-charm');
        spawnTurnFlash(stage, 'player', T('hp.damage_minus', { n: 1 }), 'var(--cb-vermillion)');
      },
      leave(stage) { stage.classList.remove('attack-charm'); },
    },
    {
      dwell: 1100, row: 2,
      enter(_stage) { /* settle */ },
      leave(_stage) {},
    },
  ];
  function runTurnAnimation(stage, rowNodes, ctx) {
    stopTurnAnimation();
    let phase = 0;
    const NB = window.Battle.NUM_BUCKETS;     // 5 = number of HP buckets (0..4 = FULL..CRITICAL)
    function tick() {
      if (!stage.isConnected) { stopTurnAnimation(); return; }
      /* Tear down previous phase. */
      const prev = TURN_PHASES[(phase - 1 + TURN_PHASES.length) % TURN_PHASES.length];
      prev.leave(stage);
      /* Enter this phase. */
      const cur = TURN_PHASES[phase];
      rowNodes.forEach((n, i) => n.classList.toggle('active', i === cur.row));
      cur.enter(stage);
      /* Per-phase HP updates, capped at CRITICAL (NB-1) so the tutorial
         loop never goes to FAINTED, that concept arrives in scene 1. */
      if (ctx) {
        if (phase === 0) {
          ctx.charmBucket = Math.min(NB - 1, ctx.charmBucket + 1);
          if (ctx.charmHp) ctx.charmHp.set(ctx.charmBucket);
        } else if (phase === 1) {
          ctx.pikaBucket = Math.min(NB - 1, ctx.pikaBucket + 1);
          if (ctx.pikaHp) ctx.pikaHp.set(ctx.pikaBucket);
        } else if (phase === 2) {
          /* If both reached CRITICAL, reset to FULL after the settle dwell
             so the loop restarts at full health. */
          if (ctx.pikaBucket >= NB - 1 && ctx.charmBucket >= NB - 1) {
            turnHpResetTimer = setTimeout(() => {
              ctx.pikaBucket = 0;
              ctx.charmBucket = 0;
              if (ctx.pikaHp)  ctx.pikaHp.set(0);
              if (ctx.charmHp) ctx.charmHp.set(0);
            }, 700);
          }
        }
      }
      phase = (phase + 1) % TURN_PHASES.length;
      turnAnimTimer = setTimeout(tick, cur.dwell);
    }
    tick();
  }

  function renderStepTurnOrder(host) {
    const wrap = document.createElement('div');
    wrap.className = 'tut-turn-demo';

    /* Mini battle stage on top of the sequence diagram. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage tut-turn-stage';
    stage.innerHTML =
      '<div class="grass-rim"></div>' +
      '<div class="platform opponent"></div>' +
      '<div class="platform player"></div>' +
      '<div class="sprite-host opponent"><img class="poke-sprite" src="assets/charmander-front.png" alt="' + T('pokemon.charmander') + '"/></div>' +
      '<div class="sprite-host player"><img class="poke-sprite" src="assets/pikachu-back.png" alt="' + T('pokemon.pikachu') + '"/></div>';

    /* HP boxes, append to stage so the existing absolute positioning
       on .hp-box.opponent / .hp-box.player puts them in the right
       corners. They animate dropping a bucket per attack inside
       runTurnAnimation below. */
    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    const charmHp = window.HPBar.mount(oppHpHost, {
      name: T('pokemon.charmander'), side: 'opponent', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS,
    });
    const pikaHp = window.HPBar.mount(playerHpHost, {
      name: T('pokemon.pikachu'), side: 'player', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS,
    });
    charmHp.set(0);
    pikaHp.set(0);

    wrap.appendChild(stage);

    /* 3-row sequence diagram. */
    const seq = document.createElement('div');
    seq.className = 'tut-turn';
    const rows = [
      { num: '1', who: T('tut.turn.row1.who'), action: T('tut.turn.row1.action') },
      { num: '2', who: T('tut.turn.row2.who'), action: T('tut.turn.row2.action') },
      { num: '3', who: T('tut.turn.row3.who'), action: T('tut.turn.row3.action') },
    ];
    const rowNodes = [];
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'tut-turn-row';
      row.innerHTML =
        '<div class="tut-turn-num">' + r.num + '</div>' +
        '<div class="tut-turn-who">' + r.who + '</div>' +
        '<div class="tut-turn-action">' + r.action + '</div>';
      seq.appendChild(row);
      rowNodes.push(row);
    }
    wrap.appendChild(seq);
    host.appendChild(wrap);

    /* Kick off the loop with an HP context, bars drop a bucket per
       attack and reset when both hit CRITICAL. */
    runTurnAnimation(stage, rowNodes, {
      pikaHp, charmHp,
      pikaBucket: 0, charmBucket: 0,
    });
  }

  function renderStepWinLose(host) {
    /* Two panels side-by-side: WIN scenario / LOSS scenario. */
    const wrap = document.createElement('div');
    wrap.className = 'tut-winlose';

    const wins = document.createElement('div');
    wins.className = 'tut-winlose-cell win';
    wins.innerHTML =
      '<div class="tut-winlose-icon">' +
        '<img src="assets/charmander-front.png" class="poke-sprite tut-mini-sprite faint">' +
      '</div>' +
      '<div class="tut-winlose-title">'  + T('tut.winlose.win.title')  + '</div>' +
      '<div class="tut-winlose-reward">' + T('tut.winlose.win.reward') + '</div>' +
      '<div class="tut-winlose-detail">' + T('tut.winlose.win.detail') + '</div>';
    wrap.appendChild(wins);

    const loses = document.createElement('div');
    loses.className = 'tut-winlose-cell loss';
    loses.innerHTML =
      '<div class="tut-winlose-icon">' +
        '<img src="assets/pikachu-back.png" class="poke-sprite tut-mini-sprite faint">' +
      '</div>' +
      '<div class="tut-winlose-title">'  + T('tut.winlose.lose.title')  + '</div>' +
      '<div class="tut-winlose-reward">' + T('tut.winlose.lose.reward') + '</div>' +
      '<div class="tut-winlose-detail">' + T('tut.winlose.lose.detail') + '</div>';
    wrap.appendChild(loses);

    host.appendChild(wrap);

    const note = document.createElement('div');
    note.className = 'tut-footnote';
    note.textContent = T('tut.winlose.footnote');
    host.appendChild(note);
  }

})();

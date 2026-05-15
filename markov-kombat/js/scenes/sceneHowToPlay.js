/* Tutorial — "How to play".
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
 * tutorial *looks* identical to the real battle — students see the
 * exact elements they'll interact with in scene 1. */
(function () {
  window.scenes = window.scenes || {};

  const STEPS_DATA = [
    {
      title: 'Welcome, trainer!',
      dialog:
        "Hello there!  Welcome to MARKOV KOMBAT!  " +
        "Before you fight, here is a quick refresher.",
      render: renderStepWelcome,
    },
    {
      title: 'The battle screen',
      dialog:
        "Look at the screen.  LIU KANG-MAX faces away from you.  " +
        "Challenger SUB-OPTIMAL faces you.  Each has an HP box.",
      render: renderStepBattleScreen,
    },
    {
      title: 'HP has five buckets',
      dialog:
        "Each fighter's HP is split into five buckets: FULL, HIGH, MID, " +
        "LOW, CRITICAL.  Past CRITICAL, the fighter is finished!",
      render: renderStepHpBuckets,
    },
    {
      title: 'Pick a move',
      dialog:
        "PWR is how strong the move feels.  ACC is the real chance it lands.  " +
        "Higher PWR usually means lower ACC — that's the trade-off LIU KANG-MAX has to learn.",
      render: renderStepMoves,
    },
    {
      title: 'How a turn flows',
      dialog:
        "LIU KANG-MAX is faster, so it moves first.  Then challenger " +
        "SUB-OPTIMAL strikes back with ICY HOOK.  One turn — both actions.",
      render: renderStepTurnOrder,
    },
    {
      title: 'Win, lose, and reward',
      dialog:
        "Finish SUB-OPTIMAL to WIN (+10 reward).  Get finished to LOSE " +
        "(-10).  Each turn costs -1.  Now you are ready.  KOMBAT!",
      render: renderStepWinLose,
    },
  ];

  window.scenes.sceneHowToPlay = function (root) {
    root.classList.add('scene-pad', 'tutorial-scene');
    root.innerHTML = '';

    /* ---------- Top bar: step counter + SKIP button ---------- */
    const topbar = document.createElement('div');
    topbar.className = 'tutorial-topbar';
    root.appendChild(topbar);

    const counter = document.createElement('div');
    counter.className = 'tutorial-step-counter';
    topbar.appendChild(counter);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tutorial-skip-btn';
    skipBtn.textContent = 'SKIP TUTORIAL →';
    skipBtn.title = 'Jump straight to the battle';
    topbar.appendChild(skipBtn);
    skipBtn.addEventListener('click', () => {
      /* Tutorial is at index 1; battle is at index 2 after insertion. */
      window.location.hash = '#scene=2';
    });

    /* ---------- Section title ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title tutorial-section-title';
    root.appendChild(header);

    /* ---------- Demo area (changes per step) ---------- */
    const demoHost = document.createElement('div');
    demoHost.className = 'tutorial-demo';
    root.appendChild(demoHost);

    /* ---------- Dialog at the bottom ---------- */
    const dialogHost = document.createElement('div');
    dialogHost.className = 'tutorial-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /* ---------- Nav hint ---------- */
    const navHint = document.createElement('div');
    navHint.className = 'tutorial-nav-hint';
    navHint.innerHTML =
      'Press <kbd>→</kbd> to continue · <kbd>←</kbd> back · ' +
      'Press <kbd>↓</kbd> to fast-fill the dialog text';
    root.appendChild(navHint);

    /* ---------- Step engine ---------- */
    let cursor = 0;

    function renderStep(c) {
      cursor = c;
      /* Any prior step's animation loop must be stopped before its DOM is
         torn down — both the HP-bucket demo and the turn-flow demo
         register setTimeouts that would keep firing into an empty
         demoHost otherwise. */
      stopHpAnimation();
      stopTurnAnimation();
      counter.textContent = 'STEP ' + (c + 1) + ' / ' + STEPS_DATA.length;
      header.textContent = STEPS_DATA[c].title.toUpperCase();
      demoHost.innerHTML = '';
      STEPS_DATA[c].render(demoHost);
      dialog.say(STEPS_DATA[c].dialog);
      /* On the last step, swap the skip-button text to "GO TO BATTLE" so the
         student feels closure. */
      skipBtn.textContent =
        c === STEPS_DATA.length - 1 ? 'GO TO BATTLE →' : 'SKIP TUTORIAL →';
    }

    /* Optional `#…&tut=N` hash flag jumps straight to internal step N — used
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
     Per-step render functions — each receives the demo host and fills it.
     ========================================================================= */

  function renderStepWelcome(host) {
    /* A friendly opening: a single big PIKACHU silhouette + welcome panel. */
    const wrap = document.createElement('div');
    wrap.className = 'tut-welcome';
    wrap.innerHTML =
      '<div class="tut-welcome-sprite">' +
        '<img src="assets/pikachu-front.png" alt="LIU KANG-MAX" class="poke-sprite tut-big-sprite">' +
      '</div>' +
      '<div class="tut-welcome-text">' +
        '<div class="tut-welcome-line big">LIU KANG-MAX CHOOSES YOU!</div>' +
        '<div class="tut-welcome-line small">Five quick lessons.  Then you fight.</div>' +
      '</div>';
    host.appendChild(wrap);
  }

  function renderStepBattleScreen(host) {
    /* Clone of the scene-1 battle stage layout, but with callout labels
       pointing at each part.  No interaction. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage tut-stage';
    stage.innerHTML =
      '<div class="grass-rim"></div>' +
      '<div class="platform opponent"></div>' +
      '<div class="platform player"></div>' +
      '<div class="sprite-host opponent"></div>' +
      '<div class="sprite-host player"></div>';
    host.appendChild(stage);

    window.Sprite.mount(stage.querySelector('.sprite-host.opponent'), 'charmander', 'opponent');
    window.Sprite.mount(stage.querySelector('.sprite-host.player'),   'pikachu',   'player');

    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    window.HPBar.mount(oppHpHost, {
      name: 'SUB-OPTIMAL', side: 'opponent', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });
    window.HPBar.mount(playerHpHost, {
      name: 'LIU KANG-MAX',    side: 'player',   level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });

    /* Callout overlay layer.  Pure CSS-positioned labels (no SVG arrows —
       the dotted-border + text strip is enough at this scale). */
    const callouts = document.createElement('div');
    callouts.className = 'tut-callouts';
    callouts.innerHTML =
      '<div class="tut-callout c-pika">YOU — back view</div>' +
      '<div class="tut-callout c-charm">CHALLENGER — front view</div>' +
      '<div class="tut-callout c-pikahp">YOUR HP</div>' +
      '<div class="tut-callout c-charmhp">THEIR HP</div>';
    stage.appendChild(callouts);
  }

  /* Step 3 — HP has five buckets.
     Two layers: (1) a live demo at the top with Charmander taking damage in a
     loop (the bar drains, a "−1 HP" damage flash floats up, the sprite
     faints, the demo resets); (2) below it, a comic-strip reference showing
     all six stages — FULL → HIGH → MID → LOW → CRITICAL → FAINTED — with
     "−1 HP" arrows between panels, so the student sees the whole ladder at
     once. */
  const HP_STAGES = [
    { label: 'FULL',     pct: 100, cls: '' },
    { label: 'HIGH',     pct: 80,  cls: 'b1' },
    { label: 'MID',      pct: 60,  cls: 'b2' },
    { label: 'LOW',      pct: 40,  cls: 'b3' },
    { label: 'CRITICAL', pct: 20,  cls: 'b4' },
  ];
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
        label.textContent = b.label;
        sprite.classList.remove('fainted');
        spawnHpDamage(stage, '−1 HP');
      } else if (i === HP_STAGES.length) {
        fill.style.width = '0%';
        fill.className = 'tut-hp-anim-fill b4';
        label.textContent = 'FAINTED!';
        sprite.classList.add('fainted');
        spawnHpDamage(stage, 'FAINT!', '#962a1a');
      } else {
        /* Reset to FULL for the next loop. */
        fill.style.width = '100%';
        fill.className = 'tut-hp-anim-fill';
        label.textContent = 'FULL';
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
      '<div class="tut-hp-anim-title">WATCH SUB-OPTIMAL TAKE A HIT</div>' +
      '<div class="tut-hp-anim-stage" id="tut-hp-anim-stage">' +
        '<img id="tut-hp-anim-img" src="assets/charmander-front.png" class="poke-sprite tut-hp-anim-sprite" alt="">' +
        '<div class="tut-hp-anim-bar">' +
          '<div class="tut-hp-anim-track">' +
            '<div class="tut-hp-anim-fill" id="tut-hp-anim-fill" style="width:100%"></div>' +
          '</div>' +
          '<div class="tut-hp-anim-label" id="tut-hp-anim-label">FULL</div>' +
        '</div>' +
      '</div>';
    wrap.appendChild(anim);

    /* Comic-strip reference: all six stages at once with damage arrows. */
    const strip = document.createElement('div');
    strip.className = 'tut-hp-strip';
    const allStages = HP_STAGES.concat([{ label: 'FAINTED!', pct: 0, cls: 'b4', fainted: true }]);
    for (let i = 0; i < allStages.length; i++) {
      const s = allStages[i];
      const panel = document.createElement('div');
      panel.className = 'tut-hp-panel' + (s.fainted ? ' fainted' : '');
      panel.innerHTML =
        '<img class="poke-sprite tut-hp-panel-sprite" src="assets/charmander-front.png" alt="">' +
        '<div class="tut-hp-panel-track">' +
          '<div class="tut-hp-panel-fill ' + s.cls + '" style="width:' + s.pct + '%"></div>' +
        '</div>' +
        '<div class="tut-hp-panel-label">' + s.label + '</div>';
      strip.appendChild(panel);
      if (i < allStages.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'tut-hp-arrow';
        arrow.innerHTML =
          '<div class="tut-hp-arrow-dmg">−1 HP</div>' +
          '<div class="tut-hp-arrow-line">→</div>';
        strip.appendChild(arrow);
      }
    }
    wrap.appendChild(strip);

    const footnote = document.createElement('div');
    footnote.className = 'tut-footnote';
    footnote.innerHTML =
      'Each attack drops the bar by <b>0 to 3</b> buckets.  Past CRITICAL, the fighter is finished.  ' +
      'Stronger moves drop more — THUNDER can land a 3-bucket hit in one go.';
    wrap.appendChild(footnote);

    host.appendChild(wrap);

    /* Kick off the looping damage animation. */
    startHpAnimation();
  }

  function renderStepMoves(host) {
    /* Replica of the move menu from scene 1.  Buttons are visually faithful
       but disabled — no click action. */
    const menu = document.createElement('div');
    menu.className = 'move-menu tut-move-menu';
    for (const m of window.Moves.MOVES) {
      const btn = document.createElement('button');
      btn.className = 'move-btn';
      btn.type = 'button';
      btn.disabled = true;
      btn.innerHTML = m.name + '<span class="move-sub">' + window.Moves.moveSubHtml(m.id) + '</span>';
      menu.appendChild(btn);
    }
    host.appendChild(menu);

    const note = document.createElement('div');
    note.className = 'tut-footnote';
    note.innerHTML =
      'THUNDERBOLT is the reliable workhorse — solid PWR, never misses.<br>' +
      'THUNDER hits harder but only lands 55% of the time — a gamble worth taking when SUB-OPTIMAL is already low.';
    host.appendChild(note);
  }

  /* Looping turn-flow demo (step 4). LIU KANG-MAX lunges + thunder,
     SUB-OPTIMAL shakes; then SUB-OPTIMAL lunges + frost, LIU KANG-MAX shakes;
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
        spawnTurnFlash(stage, 'opp', '−1 HP', 'var(--cb-vermillion)');
      },
      leave(stage) { stage.classList.remove('attack-pika'); },
    },
    {
      dwell: 1400, row: 1,
      enter(stage) {
        stage.classList.add('attack-charm');
        spawnTurnFlash(stage, 'player', '−1 HP', 'var(--cb-vermillion)');
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
         loop never goes to FAINTED — that concept arrives in scene 1. */
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
      '<div class="sprite-host opponent"><img class="poke-sprite" src="assets/charmander-front.png" alt="SUB-OPTIMAL"/></div>' +
      '<div class="sprite-host player"><img class="poke-sprite" src="assets/pikachu-back.png" alt="LIU KANG-MAX"/></div>';

    /* HP boxes — append to stage so the existing absolute positioning
       on .hp-box.opponent / .hp-box.player puts them in the right
       corners. They animate dropping a bucket per attack inside
       runTurnAnimation below. */
    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    const charmHp = window.HPBar.mount(oppHpHost, {
      name: 'SUB-OPTIMAL', side: 'opponent', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS,
    });
    const pikaHp = window.HPBar.mount(playerHpHost, {
      name: 'LIU KANG-MAX', side: 'player', level: 5,
      numBuckets: window.Battle.NUM_BUCKETS,
    });
    charmHp.set(0);
    pikaHp.set(0);

    wrap.appendChild(stage);

    /* 3-row sequence diagram. */
    const seq = document.createElement('div');
    seq.className = 'tut-turn';
    const rows = [
      { num: '1', who: 'LIU KANG-MAX',    action: 'You pick a move.  LIU KANG-MAX attacks first.' },
      { num: '2', who: 'SUB-OPTIMAL', action: 'Wild SUB-OPTIMAL strikes back with ICY HOOK.' },
      { num: '3', who: '— — —',      action: 'Both HP bars update.  State has changed.' },
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

    const note = document.createElement('div');
    note.className = 'tut-footnote';
    note.textContent =
      'LIU KANG-MAX is faster (base speed 90 vs 65), so he always moves first.';
    host.appendChild(note);

    /* Kick off the loop with an HP context — bars drop a bucket per
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
      '<div class="tut-winlose-title">YOU WIN!</div>' +
      '<div class="tut-winlose-reward">+10 reward</div>' +
      '<div class="tut-winlose-detail">SUB-OPTIMAL is finished.  Episode ends.</div>';
    wrap.appendChild(wins);

    const loses = document.createElement('div');
    loses.className = 'tut-winlose-cell loss';
    loses.innerHTML =
      '<div class="tut-winlose-icon">' +
        '<img src="assets/pikachu-back.png" class="poke-sprite tut-mini-sprite faint">' +
      '</div>' +
      '<div class="tut-winlose-title">YOU LOSE.</div>' +
      '<div class="tut-winlose-reward">-10 reward</div>' +
      '<div class="tut-winlose-detail">LIU KANG-MAX is finished.  Try again.</div>';
    wrap.appendChild(loses);

    host.appendChild(wrap);

    const note = document.createElement('div');
    note.className = 'tut-footnote';
    note.textContent =
      'Each turn that does not end the battle costs -1 reward.  ' +
      'Short, decisive battles are more rewarding than long grinds.';
    host.appendChild(note);
  }

})();

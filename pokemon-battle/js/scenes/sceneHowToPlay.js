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
        "Hello there!  Welcome to the world of POKEMON!  " +
        "Before you battle, here is a quick refresher.",
      render: renderStepWelcome,
    },
    {
      title: 'The battle screen',
      dialog:
        "Look at the screen.  Your PIKACHU faces away from you.  " +
        "The wild CHARMANDER faces you.  Each has an HP box.",
      render: renderStepBattleScreen,
    },
    {
      title: 'HP has five buckets',
      dialog:
        "Each POKEMON's HP is split into five buckets: FULL, HIGH, MID, " +
        "LOW, CRITICAL.  Past CRITICAL, the POKEMON faints!",
      render: renderStepHpBuckets,
    },
    {
      title: 'Pick a move',
      dialog:
        "ACC is the real hit chance.  PWR is classic Pokemon flavour — " +
        "the line below shows what each move actually does: how many HP " +
        "buckets it drops.",
      render: renderStepMoves,
    },
    {
      title: 'How a turn flows',
      dialog:
        "Your PIKACHU is faster, so it moves first.  Then the wild " +
        "CHARMANDER strikes back with EMBER.  One turn — both actions.",
      render: renderStepTurnOrder,
    },
    {
      title: 'Win, lose, and reward',
      dialog:
        "Faint CHARMANDER to WIN (+10 reward).  Faint yourself to LOSE " +
        "(-10).  Each turn costs -1.  Now you are ready.  GO!",
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
      '<kbd>click</kbd> the dialog to fast-fill the text';
    root.appendChild(navHint);

    /* ---------- Step engine ---------- */
    let cursor = 0;

    function renderStep(c) {
      cursor = c;
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

    renderStep(0);

    return {
      onEnter() { renderStep(0); },
      onLeave() { /* dialog timers are local; no cleanup needed */ },
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
        '<img src="assets/pikachu-front.png" alt="PIKACHU" class="poke-sprite tut-big-sprite">' +
      '</div>' +
      '<div class="tut-welcome-text">' +
        '<div class="tut-welcome-line big">PIKACHU CHOOSES YOU!</div>' +
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
      name: 'CHARMANDER', side: 'opponent', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });
    window.HPBar.mount(playerHpHost, {
      name: 'PIKACHU',    side: 'player',   level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });

    /* Callout overlay layer.  Pure CSS-positioned labels (no SVG arrows —
       the dotted-border + text strip is enough at this scale). */
    const callouts = document.createElement('div');
    callouts.className = 'tut-callouts';
    callouts.innerHTML =
      '<div class="tut-callout c-pika">YOU — back view</div>' +
      '<div class="tut-callout c-charm">WILD POKEMON — front view</div>' +
      '<div class="tut-callout c-pikahp">YOUR HP</div>' +
      '<div class="tut-callout c-charmhp">THEIR HP</div>';
    stage.appendChild(callouts);
  }

  function renderStepHpBuckets(host) {
    /* A row of five mini HP bars, each at a different bucket level, labeled. */
    const wrap = document.createElement('div');
    wrap.className = 'tut-hp-row';

    const buckets = [
      { name: 'FULL',     idx: 0, color: 'green'   },
      { name: 'HIGH',     idx: 1, color: 'green'   },
      { name: 'MID',      idx: 2, color: 'yellow'  },
      { name: 'LOW',      idx: 3, color: 'red'     },
      { name: 'CRITICAL', idx: 4, color: 'red'     },
    ];

    for (const b of buckets) {
      const cell = document.createElement('div');
      cell.className = 'tut-hp-cell';
      const label = document.createElement('div');
      label.className = 'tut-hp-label';
      label.textContent = b.name;
      cell.appendChild(label);

      const hpHost = document.createElement('div');
      cell.appendChild(hpHost);
      const hp = window.HPBar.mount(hpHost, {
        name: '', side: 'player', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
      });
      hp.set(b.idx);
      /* Hide the name + level row — we only want the bar itself for the lesson. */
      const row1 = hpHost.querySelector('.row1');
      if (row1) row1.style.display = 'none';
      const row3 = hpHost.querySelector('.row3');
      if (row3) row3.style.display = 'none';

      wrap.appendChild(cell);
    }

    host.appendChild(wrap);

    const footnote = document.createElement('div');
    footnote.className = 'tut-footnote';
    footnote.textContent =
      'Each attack drops the bar by 0 to 3 buckets.  Stronger moves drop more.';
    host.appendChild(footnote);
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
      'THUNDERBOLT reliably drops 1-2 buckets every turn — the workhorse.<br>' +
      'THUNDER drops 2-3 when it hits, but only 55% of the time — a gamble worth taking when the opponent is already low.';
    host.appendChild(note);
  }

  function renderStepTurnOrder(host) {
    /* A small 3-row sequence diagram: each row is one phase of a turn. */
    const wrap = document.createElement('div');
    wrap.className = 'tut-turn';

    const rows = [
      { num: '1', who: 'PIKACHU',    action: 'You pick a move.  PIKACHU attacks first.' },
      { num: '2', who: 'CHARMANDER', action: 'Wild CHARMANDER strikes back with EMBER.' },
      { num: '3', who: '— — —',      action: 'Both HP bars update.  Now state has changed.' },
    ];
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'tut-turn-row';
      row.innerHTML =
        '<div class="tut-turn-num">' + r.num + '</div>' +
        '<div class="tut-turn-who">' + r.who + '</div>' +
        '<div class="tut-turn-action">' + r.action + '</div>';
      wrap.appendChild(row);
    }
    host.appendChild(wrap);

    const note = document.createElement('div');
    note.className = 'tut-footnote';
    note.textContent =
      'PIKACHU is faster (base speed 90 vs 65), so it always moves first.';
    host.appendChild(note);
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
      '<div class="tut-winlose-detail">CHARMANDER fainted.  Episode ends.</div>';
    wrap.appendChild(wins);

    const loses = document.createElement('div');
    loses.className = 'tut-winlose-cell loss';
    loses.innerHTML =
      '<div class="tut-winlose-icon">' +
        '<img src="assets/pikachu-back.png" class="poke-sprite tut-mini-sprite faint">' +
      '</div>' +
      '<div class="tut-winlose-title">YOU LOSE.</div>' +
      '<div class="tut-winlose-reward">-10 reward</div>' +
      '<div class="tut-winlose-detail">PIKACHU fainted.  Try again.</div>';
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

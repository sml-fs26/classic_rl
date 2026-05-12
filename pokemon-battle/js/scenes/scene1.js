/* Scene 1 — "A wild CHARMANDER appeared!" Click-to-attack battle.
 *
 *   5-bucket version. The simulator is fully discrete now — Battle.sample()
 *   returns bucket-delta damage rather than continuous HP. Dialog text describes
 *   the bucket transition ("CHARMANDER dropped to MID HP!") instead of a
 *   numerical damage figure. HP bars are segmented (5 visible levels with
 *   tick marks at the boundaries) so what scene 1 *shows* matches what
 *   scenes 2–4 *reason about*.
 */
(function () {
  window.scenes = window.scenes || {};

  const BUCKET_NAMES = ['FULL', 'HIGH', 'MID', 'LOW', 'CRITICAL', 'FAINTED'];

  window.scenes.scene1 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    /* ---------- Layout ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title';
    header.textContent = 'YOU ARE PIKACHU. PICK A MOVE EACH TURN.';
    root.appendChild(header);

    const row = document.createElement('div');
    row.className = 'scene-row sc1-row';
    root.appendChild(row);

    /* Battle stage */
    const stage = document.createElement('div');
    stage.className = 'battle-stage';
    stage.innerHTML = `
      <div class="grass-rim"></div>
      <div class="platform opponent"></div>
      <div class="platform player"></div>
      <div class="sprite-host opponent"></div>
      <div class="sprite-host player"></div>
    `;
    row.appendChild(stage);

    const oppSprite = window.Sprite.mount(stage.querySelector('.sprite-host.opponent'), 'charmander', 'opponent');
    const playerSprite = window.Sprite.mount(stage.querySelector('.sprite-host.player'), 'pikachu', 'player');

    /* HP boxes */
    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    const oppHp = window.HPBar.mount(oppHpHost, {
      name: 'CHARMANDER', side: 'opponent', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });
    const playerHp = window.HPBar.mount(playerHpHost, {
      name: 'PIKACHU', side: 'player', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });

    /* Right column: dialog + move menu + HUD. */
    const rightCol = document.createElement('div');
    rightCol.className = 'sc1-right';
    row.appendChild(rightCol);

    const dialogHost = document.createElement('div');
    dialogHost.className = 'sc1-dialog';
    rightCol.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    const menuHost = document.createElement('div');
    menuHost.className = 'move-menu sc1-menu';
    rightCol.appendChild(menuHost);

    const moveBtns = {};
    for (const m of window.Moves.MOVES) {
      const btn = document.createElement('button');
      btn.className = 'move-btn';
      btn.type = 'button';
      btn.innerHTML =
        m.name +
        '<span class="move-sub">' +
          '<span class="type-pill ' + m.type + '">' + window.Moves.typeIconSvg(m.type) + ' ' + m.type + '</span>' +
          '<span>PWR ' + m.power + '</span>' +
          '<span>ACC ' + Math.round(m.accuracy * 100) + '%</span>' +
        '</span>';
      btn.addEventListener('click', () => onMove(m.id));
      menuHost.appendChild(btn);
      moveBtns[m.id] = btn;
    }

    const hud = document.createElement('div');
    hud.className = 'hud-strip';
    hud.innerHTML = `
      <div class="hud-item"><div class="hud-label">TURN</div><div class="hud-val" id="sc1-turn">0</div></div>
      <div class="hud-item"><div class="hud-label">LAST</div><div class="hud-val" id="sc1-last">—</div></div>
      <div class="hud-item"><div class="hud-label">REWARD</div><div class="hud-val" id="sc1-rew">0</div></div>
      <div class="hud-item"><div class="hud-label">STATE</div><div class="hud-val" id="sc1-state">FULL/FULL</div></div>
    `;
    rightCol.appendChild(hud);

    const resetBar = document.createElement('div');
    resetBar.className = 'poke-menu-row';
    resetBar.innerHTML = '<button id="sc1-reset" type="button">RESTART BATTLE</button>';
    rightCol.appendChild(resetBar);
    resetBar.querySelector('#sc1-reset').addEventListener('click', () => resetBattle());

    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.textContent =
      'You are the policy. Each click is one action; the dice are the damage roll and the accuracy check. ' +
      'The state is (your HP bucket, opp HP bucket) — five buckets each, twenty-five combinations. ' +
      'HP is discretised: each move bumps the bar by 0, 1, 2, or 3 segments. The state the agent sees IS the state the world is in.';
    root.appendChild(caption);

    /* ---------- State ---------- */
    let state = window.Battle.initialState();
    let turn = 0;
    let totalReward = 0;
    let busy = false;
    let rng = window.Battle.makeRng(20260512);

    function bucketState() {
      if (state.terminal) return state.win ? 'WIN' : 'LOSS';
      return BUCKET_NAMES[state.your] + '/' + BUCKET_NAMES[state.opp];
    }

    function setBusy(b) {
      busy = b;
      for (const id in moveBtns) moveBtns[id].disabled = b || state.terminal;
    }

    function showDamage(host, delta, color) {
      if (delta <= 0) return;
      const rect = host.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'damage-flash';
      el.textContent = '-' + delta + ' LV';
      el.style.left = (rect.left - stageRect.left + rect.width / 2 - 18) + 'px';
      el.style.top  = (rect.top  - stageRect.top  + 8) + 'px';
      if (color) el.style.color = color;
      stage.appendChild(el);
      setTimeout(() => { try { stage.removeChild(el); } catch (e) {} }, 720);
    }

    function applyTurn(moveId) {
      const out = window.Battle.sample(state, moveId, rng);
      const log = out.log;
      const move = window.Moves.MOVE_BY_ID[moveId];
      turn++;
      totalReward += out.reward;

      const oppHostEl = stage.querySelector('.sprite-host.opponent');
      const playerHostEl = stage.querySelector('.sprite-host.player');

      dialog.say('PIKACHU used ' + move.name + '!');

      setTimeout(() => {
        if (!log.hit1) {
          dialog.say("PIKACHU's attack missed!");
        } else {
          oppSprite.shake();
          showDamage(oppHostEl, log.oppDelta);
          oppHp.drainTo(log.oppAfter);
        }
      }, 420);

      setTimeout(() => {
        if (log.oppAfter >= window.Battle.FAINTED) {
          dialog.say('Wild CHARMANDER fainted!  PIKACHU wins.');
          oppSprite.faint();
          state = out.sNext;
          finalizeTurn(out);
          return;
        }
        dialog.say('Wild CHARMANDER used EMBER!');
      }, 900);

      setTimeout(() => {
        if (log.oppAfter >= window.Battle.FAINTED) return;
        playerSprite.shake();
        showDamage(playerHostEl, log.yourDelta, '#FFD0A0');
        playerHp.drainTo(log.yourAfter);
      }, 1300);

      setTimeout(() => {
        if (log.oppAfter >= window.Battle.FAINTED) return;
        if (log.yourAfter >= window.Battle.FAINTED) {
          dialog.say('PIKACHU fainted!  You lost.');
          playerSprite.faint();
        } else {
          dialog.say('What will PIKACHU do?');
        }
        state = out.sNext;
        finalizeTurn(out);
      }, 1700);
    }

    function finalizeTurn(out) {
      document.getElementById('sc1-turn').textContent = String(turn);
      document.getElementById('sc1-last').textContent = window.Moves.MOVE_BY_ID[out.log.move].name + ' ' + (out.log.hit1 ? 'HIT' : 'MISS');
      document.getElementById('sc1-rew').textContent = totalReward.toFixed(0);
      document.getElementById('sc1-state').textContent = bucketState();
      setBusy(false);
    }

    function onMove(moveId) {
      if (busy || state.terminal) return;
      setBusy(true);
      applyTurn(moveId);
    }

    function resetBattle() {
      busy = false;
      state = window.Battle.initialState();
      turn = 0;
      totalReward = 0;
      rng = window.Battle.makeRng(20260512 + Math.floor(Math.random() * 100000));
      oppSprite.reset();
      playerSprite.reset();
      oppHp.set(0);     // bucket 0 = full
      playerHp.set(0);
      document.getElementById('sc1-turn').textContent = '0';
      document.getElementById('sc1-last').textContent = '—';
      document.getElementById('sc1-rew').textContent = '0';
      document.getElementById('sc1-state').textContent = bucketState();
      setBusy(false);
      dialog.say('A wild CHARMANDER appeared!');
      setTimeout(() => dialog.say('Go, PIKACHU!'), 1400);
      setTimeout(() => dialog.say('What will PIKACHU do?'), 2600);
    }

    resetBattle();

    return {
      onEnter() { /* No autorun. */ },
      onLeave() { busy = false; },
    };
  };
})();

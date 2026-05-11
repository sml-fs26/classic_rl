/* Scene 1 — "A wild CHARMANDER appeared!" Click-to-attack battle.
 *
 * The classic Gen-1 fight, full-fidelity:
 *   1. Initial dialog: "A wild CHARMANDER appeared!" → "Go, PIKACHU!"
 *   2. 4-move menu fades in.
 *   3. Click a move → "PIKACHU used XYZ!" → Charmander shakes → damage flash →
 *      HP drains → opponent counter-attack (Ember) → Pikachu shakes → drains.
 *   4. Repeat until one Pokemon faints. Win or loss dialog. Reset button to
 *      replay.
 *
 * The simulator is in `js/battle.js` (scalar HP variant). HUD strip below
 * shows turn count, last-move outcome, total reward so far. */
(function () {
  window.scenes = window.scenes || {};

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
    const oppHp = window.HPBar.mount(oppHpHost,    { name: 'CHARMANDER', maxHp: window.Battle.CHARM_MAX_HP, side: 'opponent', level: 5 });
    const playerHp = window.HPBar.mount(playerHpHost, { name: 'PIKACHU',  maxHp: window.Battle.PIKA_MAX_HP,  side: 'player',   level: 5 });

    /* Right column: dialog box + move menu + HUD */
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
      <div class="hud-item"><div class="hud-label">STATE</div><div class="hud-val" id="sc1-state">full/full</div></div>
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
      'The state is (your HP bucket, opp HP bucket) — three buckets each, nine combinations. ' +
      'Don\'t try to find the best move yet. Just play.';
    root.appendChild(caption);

    /* ---------- State ---------- */
    let scalar = window.Battle.initialScalar();
    let turn = 0;
    let totalReward = 0;
    let busy = false;
    let history = window.History.create();
    let rng = window.Battle.makeRng(20260511);

    function bucketState() {
      return scalar.terminal
        ? (scalar.win ? 'WIN' : 'LOSS')
        : window.Battle.hpToBucket(scalar.yourHp) + '/' + window.Battle.hpToBucket(scalar.oppHp);
    }

    function setBusy(b) {
      busy = b;
      for (const id in moveBtns) moveBtns[id].disabled = b || scalar.terminal;
    }

    function showDamage(host, dmg, color) {
      const rect = host.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'damage-flash';
      el.textContent = '-' + dmg;
      el.style.left = (rect.left - stageRect.left + rect.width / 2 - 10) + 'px';
      el.style.top  = (rect.top  - stageRect.top  + 8) + 'px';
      if (color) el.style.color = color;
      stage.appendChild(el);
      setTimeout(() => { try { stage.removeChild(el); } catch (e) {} }, 720);
    }

    function applyTurn(moveId) {
      const out = window.Battle.sample(
        { yourHp: scalar.yourHp, oppHp: scalar.oppHp },
        moveId, rng
      );
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
          showDamage(oppHostEl, log.oppDmg);
          oppHp.drainTo(log.oppHp1);
        }
      }, 420);

      setTimeout(() => {
        if (log.oppHp1 <= 0) {
          dialog.say('Wild CHARMANDER fainted! PIKACHU wins.');
          oppSprite.faint();
          scalar = out.state;
          finalizeTurn(out);
          return;
        }
        dialog.say('Wild CHARMANDER used EMBER!');
      }, 900);

      setTimeout(() => {
        if (log.oppHp1 <= 0) return;          // already finished
        playerSprite.shake();
        showDamage(playerHostEl, log.yourDmg, '#FFD0A0');
        playerHp.drainTo(log.yourHp1);
      }, 1300);

      setTimeout(() => {
        if (log.oppHp1 <= 0) return;
        if (log.yourHp1 <= 0) {
          dialog.say('PIKACHU fainted!  You lost.');
          playerSprite.faint();
        } else {
          dialog.say('What will PIKACHU do?');
        }
        scalar = out.state;
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
      if (busy || scalar.terminal) return;
      setBusy(true);
      applyTurn(moveId);
    }

    function resetBattle() {
      busy = false;
      scalar = window.Battle.initialScalar();
      turn = 0;
      totalReward = 0;
      rng = window.Battle.makeRng(20260511 + Math.floor(Math.random() * 100000));
      oppSprite.reset();
      playerSprite.reset();
      oppHp.set(window.Battle.CHARM_MAX_HP);
      playerHp.set(window.Battle.PIKA_MAX_HP);
      document.getElementById('sc1-turn').textContent = '0';
      document.getElementById('sc1-last').textContent = '—';
      document.getElementById('sc1-rew').textContent = '0';
      document.getElementById('sc1-state').textContent = bucketState();
      setBusy(false);
      /* Open with the dialog cascade. */
      dialog.say('A wild CHARMANDER appeared!');
      setTimeout(() => dialog.say('Go, PIKACHU!'), 1400);
      setTimeout(() => dialog.say('What will PIKACHU do?'), 2600);
    }

    /* Cold-entry. */
    resetBattle();

    return {
      onEnter() {
        /* No autorun: scene 1 is interactive by design. */
      },
      onLeave() {
        busy = false;
      },
    };
  };
})();

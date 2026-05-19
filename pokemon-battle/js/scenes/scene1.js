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

  /* Map Pikachu moves and opponent forms to SFX names. window.SFX is
     lazy-loaded — every call is guarded so this scene still works in a
     build without sfx.js included. */
  const MOVE_SFX = {
    quick_attack: 'quick',
    thunderbolt:  'bolt',
    thunder:      'thunder',
  };
  const COUNTER_SFX = {
    charmander: 'ember',
    charmeleon: 'flame',
    charizard:  'outrage',
  };

  /* Inline Pokeball SVG used by the wild-encounter intro. Red top, white
     bottom, thick black equatorial band, white centre button. Kept as a
     module-level constant so the cascade can drop a fresh element on every
     reset without re-parsing markup. */
  const POKEBALL_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="12" r="10" fill="#FFFFFF" stroke="#181818" stroke-width="1.6"/>' +
      '<path d="M 2.4 12 A 9.6 9.6 0 0 1 21.6 12 Z" fill="#E84828"/>' +
      '<line x1="2.4" y1="12" x2="21.6" y2="12" stroke="#181818" stroke-width="2.2"/>' +
      '<circle cx="12" cy="12" r="2.6" fill="#FFFFFF" stroke="#181818" stroke-width="1.6"/>' +
    '</svg>';

  window.scenes.scene1 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

    /* ---------- Layout ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title';
    header.textContent = T('battle.section_title');
    root.appendChild(header);

    const row = document.createElement('div');
    row.className = 'scene-row sc1-row';
    root.appendChild(row);

    /* Battle stage */
    const stage = document.createElement('div');
    stage.className = 'battle-stage';
    stage.innerHTML = `
      <div class="grass-rim">
        <div class="grass-tufts">
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
          <div class="grass-tuft"></div>
        </div>
      </div>
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
      name: T('pokemon.charmander'), side: 'opponent', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
    });
    const playerHp = window.HPBar.mount(playerHpHost, {
      name: T('pokemon.pikachu'), side: 'player', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
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
      btn.innerHTML = T('move.' + m.id) + '<span class="move-sub">' + window.Moves.moveSubHtml(m.id) + '</span>';
      btn.addEventListener('click', () => onMove(m.id));
      menuHost.appendChild(btn);
      moveBtns[m.id] = btn;
    }

    const resetBar = document.createElement('div');
    resetBar.className = 'poke-menu-row';
    resetBar.innerHTML = '<button id="sc1-reset" type="button">' + T('battle.restart') + '</button>';
    rightCol.appendChild(resetBar);
    resetBar.querySelector('#sc1-reset').addEventListener('click', () => resetBattle());

    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.textContent = T('battle.caption');
    root.appendChild(caption);

    /* ---------- State ---------- */
    let state = window.Battle.initialState();
    let turn = 0;
    let totalReward = 0;
    let busy = false;
    let rng = window.Battle.makeRng(20260512);
    /* Current opponent display name. Updates when the opponent evolves
       across a form threshold (Charmander → Charmeleon → Charizard). */
    let oppFormName = T('pokemon.charmander');
    /* Helper: looked-up form display name + counter-move display name,
       based on the live language. */
    function formName(form) { return T('pokemon.' + form); }
    function counterMoveName(form) {
      const id = (window.Battle.FORM_MOVE_NAME[form] || '').toLowerCase();
      return T('move.' + id);
    }
    function pikaName() { return T('pokemon.pikachu'); }
    function pikaMoveName(id) { return T('move.' + id); }
    /* `episode` is the cancellation token for the async turn cascade. Reset
       bumps it, and every `await` re-checks; an in-flight turn aborts
       cleanly if the user hits RESTART mid-attack. */
    let episode = 0;

    /* Async helpers — let the cascade wait for *actual* completion instead
       of guessing with fixed timeouts. */
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function dialogSay(line) {
      return new Promise(resolve => {
        dialog.say(line);
        dialog.onDone(resolve);
      });
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
      el.textContent = T('hp.damage_flash', { n: delta });
      el.style.left = (rect.left - stageRect.left + rect.width / 2 - 18) + 'px';
      el.style.top  = (rect.top  - stageRect.top  + 8) + 'px';
      if (color) el.style.color = color;
      stage.appendChild(el);
      setTimeout(() => { try { stage.removeChild(el); } catch (e) {} }, 720);
    }

    /* Pre-attack windup — leans the attacker back briefly before the
       hit lands.  ~220 ms. */
    function triggerWindup(spriteHost) {
      if (!spriteHost) return;
      spriteHost.classList.remove('sc1-windup');
      void spriteHost.offsetWidth;
      spriteHost.classList.add('sc1-windup');
      setTimeout(() => spriteHost.classList.remove('sc1-windup'), 240);
    }

    /* Full-stage white flash — fires on THUNDER and other big hits. */
    function flashStage() {
      stage.classList.remove('sc1-flash');
      void stage.offsetWidth;
      stage.classList.add('sc1-flash');
      setTimeout(() => stage.classList.remove('sc1-flash'), 220);
    }

    /* Spawn a move-specific visual effect on the stage.  The CSS for
       each .sc1-vfx-* class handles the actual animation; this
       function just creates the element and removes it after the
       animation finishes. */
    function spawnMoveVfx(moveOrCounter, fromSide) {
      const el = document.createElement('div');
      el.className = 'sc1-vfx sc1-vfx-' + moveOrCounter + ' sc1-vfx-from-' + fromSide;
      /* For THUNDERBOLT specifically, embed an SVG lightning bolt. */
      if (moveOrCounter === 'thunderbolt') {
        /* Stroke colours come from --vfx-bolt / --vfx-bolt-hl CSS
           variables via the polyline rules in scene1.css, so the
           bolt re-tints under the CRT theme automatically. */
        el.innerHTML =
          '<svg viewBox="0 0 200 60" preserveAspectRatio="none" class="sc1-bolt-svg">' +
            '<polyline points="0,30 40,15 60,30 100,10 120,30 160,18 200,30" ' +
            'stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />' +
            '<polyline points="0,30 40,15 60,30 100,10 120,30 160,18 200,30" ' +
            'stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />' +
          '</svg>';
      }
      stage.appendChild(el);
      setTimeout(() => { try { el.remove(); } catch (_e) {} }, 720);
    }

    /* Classic Gen-1 turn cadence:
         move-announce typewriter ▶ pause ▶ shake + damage flash ▶ HP drain
         ▶ pause ▶ (if KO) faint message ▶ END
                  ▶ (else)  opp move-announce ▶ pause ▶ shake + damage ▶ drain
                            ▶ pause ▶ (if KO) faint ▶ END
                                     ▶ (else) "What will PIKACHU do?" ▶ END
       A full turn lands around 7 s, matching the rhythm of an actual
       Game Boy battle. Each step `await`s the previous one so the typewriter
       never gets clipped mid-character and the HP drain finishes before the
       opponent attacks. */
    async function applyTurn(moveId) {
      const myEp = episode;
      const out = window.Battle.sample(state, moveId, rng);
      const log = out.log;
      const move = window.Moves.MOVE_BY_ID[moveId];
      turn++;
      totalReward += out.reward;

      const oppHostEl = stage.querySelector('.sprite-host.opponent');
      const playerHostEl = stage.querySelector('.sprite-host.player');

      /* ---- Pikachu's turn ---- */
      await dialogSay(T('battle.used', { name: pikaName(), move: pikaMoveName(moveId) }));
      if (episode !== myEp) return;
      if (window.SFX) window.SFX.play(MOVE_SFX[moveId]);
      /* Pre-attack windup on the player sprite + move-specific VFX
         spawned on the stage; THUNDER also flashes the whole stage. */
      triggerWindup(playerHostEl);
      spawnMoveVfx(moveId, 'player');
      if (moveId === 'thunder') flashStage();
      await wait(500);
      if (episode !== myEp) return;

      if (!log.hit1) {
        if (window.SFX) window.SFX.play('miss');
        await dialogSay(T('battle.missed', { name: pikaName() }));
        if (episode !== myEp) return;
        await wait(800);
      } else {
        oppSprite.shake();
        if (window.SFX) window.SFX.play('hit');
        const critical = log.oppDelta >= 3;     /* big damage rolls land as crits */
        showDamage(oppHostEl, log.oppDelta, critical ? '#FFD028' : undefined);
        if (critical) {
          await dialogSay(T('battle.critical_hit'));
          if (episode !== myEp) return;
        }
        await wait(critical ? 250 : 400);
        if (episode !== myEp) return;
        oppHp.drainTo(log.oppAfter);
        await wait(1300);     /* HP-drain transition is 1100 ms + breathing room */
      }
      if (episode !== myEp) return;

      /* ---- Opponent evolution? PIKACHU's hit may have pushed the
         opponent into a new form. Run the Gen-1 evolution sequence:
         flash on the sprite + white wash on the stage; the actual
         sprite-source swap happens behind the peak of the wash. */
      const evolvedThisTurn = (log.formBefore !== log.formAfter) &&
                              (log.oppAfter < window.Battle.FAINTED);
      if (evolvedThisTurn) {
        await dialogSay(T('battle.evolving', { name: formName(log.formBefore) }));
        if (episode !== myEp) return;
        await wait(450);

        const oppImgEl = oppSprite.el();
        oppImgEl.classList.add('sc1-evo-sprite');
        oppHostEl.classList.add('sc1-evo-host');
        stage.classList.add('sc1-evo-stage');

        /* Swap mid-animation (~50%, behind the white-wash peak). */
        await wait(1200);
        if (episode !== myEp) {
          oppImgEl.classList.remove('sc1-evo-sprite');
          oppHostEl.classList.remove('sc1-evo-host');
          stage.classList.remove('sc1-evo-stage');
          return;
        }
        oppSprite.setKind(log.formAfter);
        oppFormName = formName(log.formAfter);
        oppHp.setName(oppFormName);

        /* Let the wash fade and the new form settle. */
        await wait(1250);
        oppImgEl.classList.remove('sc1-evo-sprite');
        oppHostEl.classList.remove('sc1-evo-host');
        stage.classList.remove('sc1-evo-stage');
        if (episode !== myEp) return;

        await dialogSay(T('battle.evolved_into', { name: oppFormName }));
        if (episode !== myEp) return;
        await wait(700);
      }
      if (episode !== myEp) return;

      /* ---- Opponent KO? ---- */
      if (log.oppAfter >= window.Battle.FAINTED) {
        stage.classList.add('sc1-slowmo');
        oppSprite.faint();
        setTimeout(() => stage.classList.remove('sc1-slowmo'), 900);
        await dialogSay(T('battle.wild_fainted', { name: oppFormName }));
        if (episode !== myEp) return;
        await wait(700);
        if (episode !== myEp) return;
        await dialogSay(T('battle.pika_wins'));
        if (window.SFX) window.SFX.play('win');
        state = out.sNext;
        finalizeTurn(out);
        return;
      }

      /* ---- Opponent's turn — counter-attack name follows the form
         the opponent is in NOW (formAfter, post-evolution if any). */
      const counterName = counterMoveName(log.formAfter);
      await dialogSay(T('battle.wild_used', { name: oppFormName, move: counterName }));
      if (episode !== myEp) return;
      if (window.SFX) window.SFX.play(COUNTER_SFX[log.formAfter]);
      triggerWindup(oppHostEl);
      spawnMoveVfx('opp_' + log.formAfter, 'opponent');
      await wait(500);
      if (episode !== myEp) return;
      playerSprite.shake();
      if (window.SFX) window.SFX.play('hit');
      const oppCrit = log.yourDelta >= 3;
      showDamage(playerHostEl, log.yourDelta, oppCrit ? '#FFD028' : '#FFD0A0');
      if (oppCrit) {
        await dialogSay('A critical hit!');
        if (episode !== myEp) return;
      }
      await wait(oppCrit ? 250 : 400);
      if (episode !== myEp) return;
      playerHp.drainTo(log.yourAfter);
      await wait(1300);
      if (episode !== myEp) return;

      /* ---- Pikachu KO? ---- */
      if (log.yourAfter >= window.Battle.FAINTED) {
        stage.classList.add('sc1-slowmo');
        playerSprite.faint();
        setTimeout(() => stage.classList.remove('sc1-slowmo'), 900);
        await dialogSay(T('battle.fainted', { name: pikaName() }));
        if (episode !== myEp) return;
        await wait(700);
        if (episode !== myEp) return;
        await dialogSay(T('battle.you_lost'));
        if (window.SFX) window.SFX.play('loss');
      } else {
        await dialogSay(T('battle.what_now'));
      }
      if (episode !== myEp) return;
      state = out.sNext;
      finalizeTurn(out);
    }

    function finalizeTurn(_out) {
      setBusy(false);
    }

    function onMove(moveId) {
      if (busy || state.terminal) return;
      setBusy(true);
      applyTurn(moveId);
    }

    async function resetBattle() {
      episode++;                 /* cancels any in-flight applyTurn */
      const myEp = episode;
      state = window.Battle.initialState();
      turn = 0;
      totalReward = 0;
      rng = window.Battle.makeRng(20260512 + Math.floor(Math.random() * 100000));
      oppSprite.reset();
      oppSprite.setKind('charmander');
      playerSprite.reset();
      oppFormName = T('pokemon.charmander');
      oppHp.set(0);     // bucket 0 = full
      oppHp.setName(oppFormName);
      playerHp.set(0);
      /* Clear any lingering evolution-flash classes from a cancelled
         in-flight applyTurn. */
      const oppImgClean = oppSprite.el();
      if (oppImgClean) oppImgClean.classList.remove('sc1-evo-sprite');
      const oppHostClean = stage.querySelector('.sprite-host.opponent');
      if (oppHostClean) oppHostClean.classList.remove('sc1-evo-host');
      stage.classList.remove('sc1-evo-stage');

      /* ---- Wild-encounter intro setup ----
         Both sprite hosts start hidden (opacity 0). The opponent flashes
         in BEFORE "A wild CHARMANDER appeared!"; then a Pokeball arcs in
         from off-screen-left, lands on the player platform, pops open,
         and Pikachu materializes BEFORE "Go! PIKACHU!". We strip any
         lingering intro classes from a prior play-through first so the
         keyframes can re-trigger. */
      const oppHost = stage.querySelector('.sprite-host.opponent');
      const plyHost = stage.querySelector('.sprite-host.player');
      if (oppHost) {
        oppHost.classList.remove('sc1-wild-appear', 'sc1-materialize', 'sc1-hidden');
        oppHost.classList.add('sc1-hidden');
      }
      if (plyHost) {
        plyHost.classList.remove('sc1-wild-appear', 'sc1-materialize', 'sc1-hidden');
        plyHost.classList.add('sc1-hidden');
      }
      /* Also clean up any stray Pokeball element left behind by a
         cancelled intro. */
      const oldBalls = stage.querySelectorAll('.sc1-pokeball');
      for (let i = 0; i < oldBalls.length; i++) oldBalls[i].remove();

      /* Disable move buttons during the intro cascade. The user can't act
         until the third dialog ("What will PIKACHU do?") lands. */
      setBusy(true);

      /* Tiny tick so the browser commits the .sc1-hidden state before we
         strip it; otherwise the wild-appear keyframe can be skipped when
         the host already had no classes. */
      await wait(80);
      if (episode !== myEp) return;
      if (oppHost) {
        oppHost.classList.remove('sc1-hidden');
        oppHost.classList.add('sc1-wild-appear');
      }
      await wait(450);
      if (episode !== myEp) return;

      await dialogSay(T('battle.opening_wild'));
      if (episode !== myEp) return;
      await wait(400);
      if (episode !== myEp) return;

      /* Pokeball arc → land → open. */
      const ball = document.createElement('div');
      ball.className = 'sc1-pokeball sc1-pokeball-arc';
      ball.innerHTML = POKEBALL_SVG;
      stage.appendChild(ball);
      await wait(620);
      if (episode !== myEp) { try { ball.remove(); } catch (_e) {} return; }

      ball.classList.remove('sc1-pokeball-arc');
      ball.classList.add('sc1-pokeball-open');
      if (plyHost) {
        plyHost.classList.remove('sc1-hidden');
        plyHost.classList.add('sc1-materialize');
      }
      setTimeout(() => { try { ball.remove(); } catch (_e) {} }, 320);
      await wait(360);
      if (episode !== myEp) return;

      await dialogSay(T('battle.go_pika'));
      if (episode !== myEp) return;
      await wait(800);
      if (episode !== myEp) return;
      await dialogSay(T('battle.what_will'));
      if (episode !== myEp) return;
      setBusy(false);
    }

    resetBattle();

    return {
      onEnter() { /* No autorun. */ },
      onLeave() { busy = false; },
    };
  };
})();

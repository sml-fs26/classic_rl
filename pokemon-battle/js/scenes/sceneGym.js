/* Scene — Gym Challenge.
 *
 *   Capstone interaction: three sequential battles against escalating
 *   gym leaders.  Earn three badges to complete the challenge.
 *
 *     PEWTER  · BROCK     · BOULDER  — opp starts at FULL HP (Charmander, easiest)
 *     CERULEAN · MISTY    · CASCADE — opp starts at MID HP  (Charmeleon)
 *     VERMILION · LT. SURGE · THUNDER — opp starts at LOW HP (Charizard, hardest counter-moves)
 *
 *   No dialog cascade, no pokeball intros — the player blasts through
 *   the three matches as quickly as they can decide.  Cumulative win
 *   count is reported at the end alongside an animated row of earned
 *   badges.
 *
 *   This scene reuses the Battle / Sprite / HPBar primitives but does
 *   not share scene 1's full battle loop — the gym wants tighter UX
 *   without the conversational pacing.
 */
(function () {
  window.scenes = window.scenes || {};

  const GYMS = [
    { city: 'PEWTER',    leader: 'BROCK',     badge: 'BOULDER',  oppStart: 0 },
    { city: 'CERULEAN',  leader: 'MISTY',     badge: 'CASCADE',  oppStart: 2 },
    { city: 'VERMILION', leader: 'LT. SURGE', badge: 'THUNDER',  oppStart: 3 },
  ];

  function formForBucket(b) {
    if (b <= 1) return 'charmander';
    if (b === 2) return 'charmeleon';
    return 'charizard';
  }

  function bucketName(b) {
    return ['FULL', 'HIGH', 'MID', 'LOW', 'CRITICAL', 'FAINTED'][b] || 'FAINTED';
  }

  window.scenes.sceneGym = function (root) {
    root.classList.add('scene-pad', 'gym-scene');
    root.innerHTML = '';

    const state = {
      gymIdx: 0,
      badges: [],          /* gym keys earned this run */
      totalAttempts: 0,    /* every battle attempt, including retries */
      totalWins: 0,
      view: 'intro',       /* intro | battle | ceremony | final */
    };

    /* ============================================================
       INTRO
       ============================================================ */
    function renderIntro() {
      state.view = 'intro';
      root.innerHTML = '';

      const heading = document.createElement('h2');
      heading.className = 'concept-heading gym-heading';
      heading.textContent = 'GYM CHALLENGE';
      root.appendChild(heading);

      const sub = document.createElement('div');
      sub.className = 'gym-intro-sub';
      sub.textContent =
        'Three gym leaders, three badges.  Use what you learned from SARSA — ' +
        'play the policy you would teach Pikachu.';
      root.appendChild(sub);

      const list = document.createElement('div');
      list.className = 'gym-list';
      root.appendChild(list);

      for (let i = 0; i < GYMS.length; i++) {
        const g = GYMS[i];
        const row = document.createElement('div');
        row.className = 'gym-list-row';
        const earned = state.badges.indexOf(g.badge) >= 0;
        row.classList.toggle('earned', earned);
        row.innerHTML =
          '<span class="gym-list-num">Nº ' + (i + 1) + '</span>' +
          '<span class="gym-list-city">' + g.city + '</span>' +
          '<span class="gym-list-leader">LEADER ' + g.leader + '</span>' +
          '<span class="gym-list-badge">' +
            '<span class="gym-badge-chip ' + g.badge.toLowerCase() + '">' +
              (earned ? '★ ' : '') + g.badge + ' BADGE' +
            '</span>' +
          '</span>';
        list.appendChild(row);
      }

      const ctrls = document.createElement('div');
      ctrls.className = 'gym-ctrls';
      const start = document.createElement('button');
      start.className = 'poke-btn gym-begin';
      start.textContent = state.gymIdx === 0 ? '▶ BEGIN CHALLENGE' : '▶ CONTINUE TO NEXT GYM';
      start.addEventListener('click', () => renderBattle(state.gymIdx));
      ctrls.appendChild(start);

      if (state.badges.length > 0 || state.totalAttempts > 0) {
        const reset = document.createElement('button');
        reset.className = 'poke-btn gym-reset';
        reset.textContent = '⟲ RESET';
        reset.addEventListener('click', () => {
          state.gymIdx = 0;
          state.badges = [];
          state.totalAttempts = 0;
          state.totalWins = 0;
          renderIntro();
        });
        ctrls.appendChild(reset);
      }
      root.appendChild(ctrls);

      const footnote = document.createElement('div');
      footnote.className = 'footnote gym-footnote';
      footnote.innerHTML = 'Each click is one (s, a, r, s′) sample. The opponent escalates — Charmander → Charmeleon → Charizard.';
      root.appendChild(footnote);
    }

    /* ============================================================
       BATTLE
       ============================================================ */
    function renderBattle(gymIdx) {
      state.view = 'battle';
      state.gymIdx = gymIdx;
      const gym = GYMS[gymIdx];
      root.innerHTML = '';

      const banner = document.createElement('div');
      banner.className = 'gym-battle-banner';
      banner.innerHTML =
        '<div class="gym-battle-num">GYM Nº ' + (gymIdx + 1) + ' / ' + GYMS.length + '</div>' +
        '<div class="gym-battle-title">' + gym.city + ' CITY</div>' +
        '<div class="gym-battle-leader">vs LEADER ' + gym.leader + '</div>' +
        '<div class="gym-battle-target">Win to earn the <b>' + gym.badge + '</b> BADGE.</div>';
      root.appendChild(banner);

      const row = document.createElement('div');
      row.className = 'gym-row';
      root.appendChild(row);

      /* Battle stage */
      const stage = document.createElement('div');
      stage.className = 'battle-stage gym-stage';
      stage.innerHTML =
        '<div class="grass-rim"><div class="grass-tufts">' +
          '<div class="grass-tuft"></div><div class="grass-tuft"></div>' +
          '<div class="grass-tuft"></div><div class="grass-tuft"></div>' +
          '<div class="grass-tuft"></div>' +
        '</div></div>' +
        '<div class="platform opponent"></div>' +
        '<div class="platform player"></div>' +
        '<div class="sprite-host opponent"></div>' +
        '<div class="sprite-host player"></div>';
      row.appendChild(stage);

      const oppForm = formForBucket(gym.oppStart);
      const oppSprite = window.Sprite.mount(stage.querySelector('.sprite-host.opponent'), oppForm, 'opponent');
      const playerSprite = window.Sprite.mount(stage.querySelector('.sprite-host.player'), 'pikachu', 'player');

      const oppHpHost = document.createElement('div');
      stage.appendChild(oppHpHost);
      const oppHp = window.HPBar.mount(oppHpHost, {
        name: oppForm.toUpperCase(),
        side: 'opponent', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
      });
      oppHp.set(gym.oppStart);

      const playerHpHost = document.createElement('div');
      stage.appendChild(playerHpHost);
      const playerHp = window.HPBar.mount(playerHpHost, {
        name: 'PIKACHU', side: 'player', level: 5, numBuckets: window.Battle.NUM_BUCKETS,
      });
      playerHp.set(0);

      /* Right column */
      const rightCol = document.createElement('div');
      rightCol.className = 'gym-right';
      row.appendChild(rightCol);

      const status = document.createElement('div');
      status.className = 'gym-status poke-box';
      status.innerHTML = 'TURN <b id="gym-turn">0</b> · ' +
        'You: <b id="gym-you-state">FULL</b> · ' +
        'Opp: <b id="gym-opp-state">' + bucketName(gym.oppStart) + '</b>';
      rightCol.appendChild(status);

      const menu = document.createElement('div');
      menu.className = 'move-menu gym-menu';
      rightCol.appendChild(menu);

      const moveBtns = {};
      for (const m of window.Moves.MOVES) {
        const btn = document.createElement('button');
        btn.className = 'move-btn';
        btn.type = 'button';
        btn.innerHTML = (window.I18N ? window.I18N.t('move.' + m.id) : m.id) +
          '<span class="move-sub">' + window.Moves.moveSubHtml(m.id) + '</span>';
        btn.addEventListener('click', () => onMove(m.id));
        menu.appendChild(btn);
        moveBtns[m.id] = btn;
      }

      const giveUp = document.createElement('button');
      giveUp.className = 'poke-btn gym-giveup';
      giveUp.textContent = '⟲ FORFEIT MATCH';
      giveUp.addEventListener('click', () => {
        state.totalAttempts++;
        renderCeremony(gym, false);
      });
      rightCol.appendChild(giveUp);

      /* Battle state — manually constructed so we can override the
         opponent's starting HP bucket per gym. */
      let cur = { your: 0, opp: gym.oppStart, terminal: false };
      let rng = window.Battle.makeRng(20260514 + gymIdx * 1009 + state.totalAttempts * 31);
      let turn = 0;

      function syncUI() {
        oppHp.set(cur.opp);
        playerHp.set(cur.your);
        const f = formForBucket(cur.opp);
        if (oppSprite.kindOf && oppSprite.kindOf() !== f) {
          oppSprite.setKind(f);
          oppHp.setName(f.toUpperCase());
        }
        const turnEl = document.getElementById('gym-turn');
        const youEl = document.getElementById('gym-you-state');
        const oppEl = document.getElementById('gym-opp-state');
        if (turnEl) turnEl.textContent = String(turn);
        if (youEl) youEl.textContent = bucketName(cur.your);
        if (oppEl) oppEl.textContent = bucketName(cur.opp);
        const disable = cur.terminal;
        for (const id in moveBtns) moveBtns[id].disabled = disable;
      }

      function onMove(moveId) {
        if (cur.terminal) return;
        const sample = window.Battle.sample(cur, moveId, rng);
        cur = sample.sNext;
        turn++;
        /* SFX hook — quick chiptune match for the move kind. */
        if (window.SFX) {
          if (moveId === 'quick_attack') window.SFX.play('quick');
          else if (moveId === 'thunderbolt') window.SFX.play('bolt');
          else if (moveId === 'thunder') window.SFX.play('thunder');
        }
        /* Tiny sprite shake so the impact reads. */
        if (oppSprite && oppSprite.shake) oppSprite.shake();
        syncUI();
        if (cur.terminal) {
          state.totalAttempts++;
          const won = !!cur.win;
          if (won) state.totalWins++;
          if (window.SFX) window.SFX.play(won ? 'win' : 'loss');
          setTimeout(() => renderCeremony(gym, won), 900);
        }
      }

      syncUI();
    }

    /* ============================================================
       BADGE / RESULT CEREMONY
       ============================================================ */
    function renderCeremony(gym, won) {
      state.view = 'ceremony';
      root.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.className = 'gym-ceremony';
      root.appendChild(wrap);

      if (won) {
        if (state.badges.indexOf(gym.badge) < 0) state.badges.push(gym.badge);
        wrap.innerHTML =
          '<div class="gym-ceremony-title">YOU DEFEATED LEADER ' + gym.leader + '!</div>' +
          '<div class="gym-ceremony-badge-wrap">' +
            '<div class="gym-ceremony-badge ' + gym.badge.toLowerCase() + '">' +
              '<span class="gym-ceremony-badge-star">★</span>' +
              '<div class="gym-ceremony-badge-name">' + gym.badge + '</div>' +
              '<div class="gym-ceremony-badge-sub">BADGE</div>' +
            '</div>' +
          '</div>' +
          '<div class="gym-ceremony-flavor">You earned the <b>' + gym.badge + ' BADGE</b>!</div>';
      } else {
        wrap.innerHTML =
          '<div class="gym-ceremony-title loss">LEADER ' + gym.leader + ' DEFEATED PIKACHU.</div>' +
          '<div class="gym-ceremony-flavor">No badge this time. Train harder, try again.</div>';
      }

      const ctrls = document.createElement('div');
      ctrls.className = 'gym-ceremony-ctrls';

      if (won) {
        const nextGym = state.gymIdx + 1;
        const more = nextGym < GYMS.length;
        const btn = document.createElement('button');
        btn.className = 'poke-btn';
        btn.textContent = more ? '▶ NEXT GYM' : '▶ SEE FINAL RESULTS';
        btn.addEventListener('click', () => {
          if (more) renderBattle(nextGym);
          else renderFinal();
        });
        ctrls.appendChild(btn);
      } else {
        const retry = document.createElement('button');
        retry.className = 'poke-btn';
        retry.textContent = '⟲ TRY AGAIN';
        retry.addEventListener('click', () => renderBattle(state.gymIdx));
        ctrls.appendChild(retry);
        const skip = document.createElement('button');
        skip.className = 'poke-btn';
        skip.textContent = '▶ SKIP THIS GYM';
        skip.addEventListener('click', () => {
          if (state.gymIdx + 1 < GYMS.length) renderBattle(state.gymIdx + 1);
          else renderFinal();
        });
        ctrls.appendChild(skip);
      }

      wrap.appendChild(ctrls);
    }

    /* ============================================================
       FINAL SCREEN
       ============================================================ */
    function renderFinal() {
      state.view = 'final';
      root.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.className = 'gym-final';
      root.appendChild(wrap);

      const earnedCount = state.badges.length;
      const masterFull = earnedCount === GYMS.length;

      const heading = document.createElement('div');
      heading.className = 'gym-final-heading';
      heading.textContent = masterFull
        ? 'POKEMON LEAGUE CHAMPION'
        : earnedCount > 0
          ? 'CHALLENGE COMPLETE'
          : 'CHALLENGE ENDED';
      wrap.appendChild(heading);

      const score = document.createElement('div');
      score.className = 'gym-final-score';
      score.innerHTML =
        '<div class="gym-final-row"><span>BADGES</span><b>' + earnedCount + ' / ' + GYMS.length + '</b></div>' +
        '<div class="gym-final-row"><span>BATTLES PLAYED</span><b>' + state.totalAttempts + '</b></div>' +
        '<div class="gym-final-row"><span>WINS</span><b>' + state.totalWins + '</b></div>' +
        '<div class="gym-final-row"><span>WIN RATE</span><b>' +
          (state.totalAttempts > 0 ? Math.round(100 * state.totalWins / state.totalAttempts) : 0) +
        '%</b></div>';
      wrap.appendChild(score);

      const trophy = document.createElement('div');
      trophy.className = 'gym-final-trophy';
      for (let i = 0; i < GYMS.length; i++) {
        const g = GYMS[i];
        const got = state.badges.indexOf(g.badge) >= 0;
        const slot = document.createElement('div');
        slot.className = 'gym-final-badge ' + g.badge.toLowerCase() + (got ? ' got' : ' missing');
        slot.style.setProperty('--i', String(i));
        slot.innerHTML =
          (got ? '<span class="gym-final-badge-star">★</span>' : '') +
          '<div class="gym-final-badge-name">' + g.badge + '</div>' +
          '<div class="gym-final-badge-sub">' + (got ? 'EARNED' : 'MISSED') + '</div>';
        trophy.appendChild(slot);
      }
      wrap.appendChild(trophy);

      const ctrls = document.createElement('div');
      ctrls.className = 'gym-final-ctrls';
      const replay = document.createElement('button');
      replay.className = 'poke-btn';
      replay.textContent = '⟲ REPLAY CHALLENGE';
      replay.addEventListener('click', () => {
        state.gymIdx = 0;
        state.badges = [];
        state.totalAttempts = 0;
        state.totalWins = 0;
        renderIntro();
      });
      ctrls.appendChild(replay);

      const cont = document.createElement('button');
      cont.className = 'poke-btn';
      cont.textContent = '▶ CONTINUE TO HALL OF FAME';
      cont.addEventListener('click', () => {
        if (window.PokeViz && typeof window.PokeViz.goTo === 'function') {
          window.PokeViz.goTo(window.PokeViz.getCurrentScene() + 1);
        }
      });
      ctrls.appendChild(cont);

      wrap.appendChild(ctrls);

      if (masterFull && window.SFX) {
        setTimeout(() => window.SFX.play('win'), 220);
      }
    }

    /* ---- Mount ---- */
    renderIntro();

    return {
      onEnter() {
        /* Re-show intro on re-entry, preserving earned badges so the
           student can pick up where they left off (or RESET in the
           intro screen to start over). */
        if (state.view === 'intro') renderIntro();
      },
    };
  };
})();

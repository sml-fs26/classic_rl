/* Scene, π* from Q.
 *
 *   Once Q* is known, the optimal policy is just argmax_a Q*(s, a). The
 *   abstract formula sits at the top. Below it, a looping demo battle
 *   makes the argmax tangible:
 *
 *     For the current state, the Q*-panel on the right lists all three
 *     Q*(s, a) values, with the argmax row highlighted as π*(s). After
 *     a beat, PIKACHU plays that action; CHARMANDER counters; HP bars
 *     drop; state advances; Q*-panel updates with the new state's
 *     Q*-values; argmax re-highlighted. After WIN or LOSS, banner pause,
 *     reset, repeat.
 *
 *   Q*(s, a) is computed once on mount via plain value iteration.
 *   Transitions in the demo are deterministic (lower-bound damage and
 *   middle Ember roll) so the loop always plays out the same battle, 
 *   pedagogy beats variance here.
 */
(function () {
  window.scenes = window.scenes || {};

  /* SFX names indexed by move-id / opponent-form. Lookups are guarded
     against window.SFX being absent so the scene works in builds that
     don't include sfx.js. */
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

  const NB      = window.Battle.NUM_BUCKETS;          // 5
  const BUCKETS = window.Battle.BUCKETS;
  const ACTIONS = window.Moves.MOVE_IDS;
  const A       = ACTIONS.length;                      // 3 after the iron_tail drop
  const STATES  = window.Bellman.STATES;
  const N       = STATES.length;                       // 25
  const GAMMA   = 1;     // Undiscounted, every trajectory terminates (win/loss).

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  function bucketName(b) { return b >= NB ? T('hp.bucket.faint_short') : T('hp.bucket.' + BUCKETS[b]); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function oppFormDisplay(form) { return T('pokemon.' + form); }
  function oppMoveName(form) {
    const id = (window.Battle.FORM_MOVE_NAME[form] || '').toLowerCase();
    return T('move.' + id);
  }

  /* Value iteration → Q* (same recipe as sceneDp). */
  function computeQstar() {
    let V = new Float32Array(N);
    for (let iter = 0; iter < 400; iter++) {
      const newV = new Float32Array(N);
      let maxDelta = 0;
      for (let s = 0; s < N; s++) {
        const state = { your: STATES[s].your, opp: STATES[s].opp, terminal: false };
        let bestQ = -Infinity;
        for (let a = 0; a < A; a++) {
          const succ = window.Battle.successors(state, ACTIONS[a]);
          let q = 0;
          for (const t of succ) {
            const vN = t.sNext.terminal ? 0 : V[t.sNext.your * NB + t.sNext.opp];
            q += t.p * (t.reward + GAMMA * vN);
          }
          if (q > bestQ) bestQ = q;
        }
        newV[s] = bestQ;
        const d = Math.abs(bestQ - V[s]);
        if (d > maxDelta) maxDelta = d;
      }
      V = newV;
      if (maxDelta < 1e-7) break;
    }
    const Q = new Float32Array(N * A);
    for (let s = 0; s < N; s++) {
      const state = { your: STATES[s].your, opp: STATES[s].opp, terminal: false };
      for (let a = 0; a < A; a++) {
        const succ = window.Battle.successors(state, ACTIONS[a]);
        let q = 0;
        for (const t of succ) {
          const vN = t.sNext.terminal ? 0 : V[t.sNext.your * NB + t.sNext.opp];
          q += t.p * (t.reward + GAMMA * vN);
        }
        Q[s * A + a] = q;
      }
    }
    return Q;
  }

  window.scenes.sceneQstar = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('qstar.heading');
    root.appendChild(heading);

    const premise = document.createElement('div');
    premise.className = 'qstar-premise';
    premise.innerHTML = T('qstar.premise');
    root.appendChild(premise);

    /*, Optimal-policy formula card, */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('qstar.formula.label') + '</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`\pi^{\star}(s) \;=\; \operatorname*{arg\,max}_{a}\; Q^{\star}(s, a)`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = T('qstar.formula.foot');
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /*, Demo battle, */
    const demoWrap = document.createElement('div');
    demoWrap.className = 'qstar-demo';
    root.appendChild(demoWrap);

    /* Battle stage on the left. The opponent sprite swaps when its HP
       crosses a form threshold, referenced via oppSpriteEl below. */
    const stage = document.createElement('div');
    stage.className = 'battle-stage qstar-stage';
    stage.innerHTML =
      '<div class="grass-rim"></div>' +
      '<div class="platform opponent"></div>' +
      '<div class="platform player"></div>' +
      '<div class="sprite-host opponent"><img class="poke-sprite qstar-opp-sprite" src="assets/charmander-front.png" alt="CHARMANDER"/></div>' +
      '<div class="sprite-host player"><img class="poke-sprite" src="assets/pikachu-back.png" alt="PIKACHU"/></div>';
    const oppSpriteEl = stage.querySelector('.qstar-opp-sprite');

    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    const charmHp = window.HPBar.mount(oppHpHost, {
      name: T('pokemon.charmander'), side: 'opponent', level: 5, numBuckets: NB,
    });
    const pikaHp = window.HPBar.mount(playerHpHost, {
      name: T('pokemon.pikachu'), side: 'player', level: 5, numBuckets: NB,
    });
    charmHp.set(0);
    pikaHp.set(0);

    /* Banner overlay (WIN / LOSS). */
    const banner = document.createElement('div');
    banner.className = 'qstar-banner';
    stage.appendChild(banner);
    demoWrap.appendChild(stage);

    /* Q-panel on the right. */
    const qPanel = document.createElement('div');
    qPanel.className = 'qstar-q-panel';
    demoWrap.appendChild(qPanel);

    const status = document.createElement('div');
    status.className = 'qstar-status';
    root.appendChild(status);

    /*, Closing question (bridge to sceneDp), */
    const q = document.createElement('div');
    q.className = 'concept-key-question';
    q.textContent = T('qstar.bridge_q');
    root.appendChild(q);

    /*, Demo state machine, */
    const qStar = computeQstar();
    let pikaBucket = 0;
    let charmBucket = 0;
    let turnIdx = 1;
    let argmaxA = 0;
    let phase = 'show';
    let demoTimer = null;

    function stateIdx() { return pikaBucket * NB + charmBucket; }

    function pickArgmax() {
      const base = stateIdx() * A;
      let m = qStar[base], k = 0;
      for (let i = 1; i < A; i++) {
        if (qStar[base + i] > m) { m = qStar[base + i]; k = i; }
      }
      argmaxA = k;
    }

    /* Form-aware sprite swap. Called whenever opp HP changes. If the
       form crosses a threshold the sprite changes mid-battle (the
       "Charmander → Charmeleon → Charizard" evolution). Also updates
       the HP-box display name so the label tracks the current form. */
    let lastOppForm = null;
    function refreshOppSprite() {
      if (!oppSpriteEl) return;
      const b = Math.min(NB - 1, charmBucket);
      const form = window.Battle.formForOpp(b);
      if (form === lastOppForm) return;
      lastOppForm = form;
      oppSpriteEl.src = window.Battle.spriteForOpp(b);
      oppSpriteEl.alt = oppFormDisplay(form);
      if (charmHp && charmHp.setName) charmHp.setName(oppFormDisplay(form));
    }

    function renderQPanel() {
      const base = stateIdx() * A;
      const oppB = Math.min(NB - 1, charmBucket);
      const oppSprite = window.Battle.spriteForOpp(oppB);
      const oppName   = window.Battle.displayNameForOpp(oppB);

      /* Top of panel: state icon, two Pokemon sprites stacked under
         segmented HP bars, labelled "state s".  Mirrors the q-cell
         thumb used in scenes 7 and 9 so students see the same visual
         vocabulary for "this is the state". */
      const stateIcon =
        '<div class="qstar-state-icon">' +
          '<div class="qstar-state-label">' + T('qstar.state_s') + '</div>' +
          '<div class="qstar-state-thumb">' +
            '<div class="qstar-state-side player">' +
              '<img class="qstar-state-sprite" src="assets/pikachu-back.png" alt="Pikachu">' +
              '<div class="qstar-state-hp"><div class="qstar-state-hp-fill ' + bucketClass(pikaBucket) + '" style="width:' + bucketPct(pikaBucket) + '%"></div></div>' +
              '<div class="qstar-state-bucket">' + bucketName(pikaBucket) + '</div>' +
            '</div>' +
            '<div class="qstar-state-side opponent">' +
              '<img class="qstar-state-sprite" src="' + oppSprite + '" alt="' + oppName + '">' +
              '<div class="qstar-state-hp"><div class="qstar-state-hp-fill ' + bucketClass(charmBucket) + '" style="width:' + bucketPct(charmBucket) + '%"></div></div>' +
              '<div class="qstar-state-bucket">' + bucketName(charmBucket) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      /* Below the icon: a 2-column table with action a on the left
         and Q*(s, a) on the right.  Same column structure students
         will see in scene 7 and 9, establishing the visual
         vocabulary here pays off there. */
      let tableRows = '';
      for (let k = 0; k < A; k++) {
        const qv = qStar[base + k];
        const isArg = (k === argmaxA);
        const mark = isArg ? ' <span class="qstar-cell-mark">★</span>' : '';
        tableRows +=
          '<tr class="qstar-table-row' + (isArg ? ' argmax' : '') + '">' +
            '<td class="qstar-table-action">' + T('move.' + ACTIONS[k]) + mark + '</td>' +
            '<td class="qstar-table-q">' + (qv >= 0 ? '+' : '') + qv.toFixed(2) + '</td>' +
          '</tr>';
      }
      const table =
        '<table class="qstar-table">' +
          '<thead>' +
            '<tr>' +
              '<th class="qstar-table-action">' + T('qstar.col.action') + '</th>' +
              '<th class="qstar-table-q">' + T('qstar.col.qstar') + '</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>';

      qPanel.innerHTML = stateIcon + table;
    }

    function updateStatus(phaseLabel) {
      status.innerHTML =
        '<span>' + T('qstar.status.turn')  + ' <b>' + turnIdx + '</b></span>' +
        '<span>' + T('qstar.status.state') + ' <b>' + bucketName(pikaBucket) + ' / ' + bucketName(charmBucket) + '</b></span>' +
        '<span>' + T('qstar.status.phase') + ' <b>' + phaseLabel + '</b></span>';
    }

    function spawnFlash(side, text, color) {
      const el = document.createElement('div');
      el.className = 'qstar-flash ' + side;
      el.textContent = text;
      if (color) el.style.color = color;
      stage.appendChild(el);
      setTimeout(() => { try { stage.removeChild(el); } catch (e) {} }, 1100);
    }

    function showBanner(text, kind) {
      banner.className = 'qstar-banner show ' + kind;
      banner.textContent = text;
    }
    function hideBanner() { banner.className = 'qstar-banner'; }

    function resetDemo() {
      pikaBucket = 0; charmBucket = 0; turnIdx = 1;
      pikaHp.set(0); charmHp.set(0);
      lastOppForm = null;
      refreshOppSprite();
      hideBanner();
      pickArgmax();
      renderQPanel();
      updateStatus(T('qstar.phase.showing'));
    }

    function step() {
      if (!stage.isConnected) { stopDemo(); return; }
      let dwell = 2000;

      if (phase === 'show') {
        /* Pika executes argmax action. Fire attack animation; damage
           lands mid-anim. */
        phase = 'attack';
        stage.classList.remove('qstar-attack');
        void stage.offsetWidth;
        stage.classList.add('qstar-attack');
        /* Move SFX at attack start; hit SFX at damage-land (480 ms). */
        if (window.SFX) window.SFX.play(MOVE_SFX[ACTIONS[argmaxA]]);
        setTimeout(() => {
          charmBucket = Math.min(NB, charmBucket + 1);
          charmHp.set(Math.min(charmBucket, NB - 1));
          refreshOppSprite();
          spawnFlash('opp', T('hp.damage_minus', { n: 1 }), 'var(--cb-vermillion)');
          if (window.SFX) window.SFX.play('hit');
        }, 480);
        setTimeout(() => stage.classList.remove('qstar-attack'), 1100);
        updateStatus(T('qstar.phase.pika_does', { move: T('move.' + ACTIONS[argmaxA]) }));
        dwell = 1400;

      } else if (phase === 'attack') {
        if (charmBucket >= NB) {
          phase = 'banner-win';
          showBanner(T('qstar.banner.win'), 'win');
          updateStatus(T('qstar.phase.opp_fainted'));
          if (window.SFX) window.SFX.play('win');
          dwell = 2600;
        } else {
          /* Charm counters. The form is whatever the opp is in NOW
             (post-Pikachu's-hit), which may have just evolved. Use
             that to pick both the SFX and the dialog name. */
          phase = 'counter';
          stage.classList.remove('qstar-counter');
          void stage.offsetWidth;
          stage.classList.add('qstar-counter');
          const oppForm = window.Battle.formForOpp(Math.min(NB - 1, charmBucket));
          const counterName = oppMoveName(oppForm);
          if (window.SFX) window.SFX.play(COUNTER_SFX[oppForm]);
          setTimeout(() => {
            pikaBucket = Math.min(NB, pikaBucket + 1);
            pikaHp.set(Math.min(pikaBucket, NB - 1));
            spawnFlash('pika', T('hp.damage_minus', { n: 1 }), 'var(--cb-vermillion)');
            if (window.SFX) window.SFX.play('hit');
          }, 480);
          setTimeout(() => stage.classList.remove('qstar-counter'), 1100);
          updateStatus(T('qstar.phase.charm_does', { move: counterName }));
          dwell = 1400;
        }

      } else if (phase === 'counter') {
        if (pikaBucket >= NB) {
          phase = 'banner-loss';
          showBanner(T('qstar.banner.loss'), 'loss');
          updateStatus(T('qstar.phase.pika_fainted'));
          if (window.SFX) window.SFX.play('loss');
          dwell = 2600;
        } else {
          turnIdx++;
          phase = 'show';
          pickArgmax();
          renderQPanel();
          updateStatus(T('qstar.phase.showing'));
          dwell = 1800;
        }

      } else if (phase === 'banner-win' || phase === 'banner-loss') {
        resetDemo();
        phase = 'show';
        dwell = 1800;
      }

      demoTimer = setTimeout(step, dwell);
    }

    function stopDemo() {
      if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; }
    }

    /* Initial render. */
    refreshOppSprite();
    pickArgmax();
    renderQPanel();
    updateStatus(T('qstar.phase.showing'));
    /* Kick off the loop. */
    step();

    return {
      /* Navigating away calls onLeave → clears the timer. The scene is then
         cached by the scene engine, so when the user navigates back, the
         builder is NOT re-run; only onEnter fires. Without this hook, the
         demo would appear frozen on the last frame (no setTimeout chain
         alive). Reset and re-kick to give the visitor a fresh loop. */
      onEnter() {
        stopDemo();
        phase = 'show';
        resetDemo();
        step();
      },
      onLeave() { stopDemo(); },
    };
  };
})();

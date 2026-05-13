/* Scene — π* from Q.
 *
 *   Once Q is known, the optimal policy is just argmax_a Q(s, a). The
 *   abstract formula sits at the top. Below it, a looping demo battle
 *   makes the argmax tangible:
 *
 *     For the current state, the Q-panel on the right lists all three
 *     Q(s, a) values, with the argmax row highlighted as π*(s). After
 *     a beat, PIKACHU plays that action; CHARMANDER counters; HP bars
 *     drop; state advances; Q-panel updates with the new state's
 *     Q-values; argmax re-highlighted. After WIN or LOSS, banner pause,
 *     reset, repeat.
 *
 *   Q*(s, a) is computed once on mount via plain value iteration.
 *   Transitions in the demo are deterministic (lower-bound damage and
 *   middle Ember roll) so the loop always plays out the same battle —
 *   pedagogy beats variance here.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB      = window.Battle.NUM_BUCKETS;          // 5
  const BUCKETS = window.Battle.BUCKETS;
  const ACTIONS = window.Moves.MOVE_IDS;
  const A       = ACTIONS.length;                      // 3 after the iron_tail drop
  const STATES  = window.Bellman.STATES;
  const N       = STATES.length;                       // 25
  const GAMMA   = window.DATA.params.gammaDefault;     // 0.90

  function bucketName(b) { return b >= NB ? 'FAINT' : BUCKETS[b].toUpperCase(); }

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
    heading.textContent = 'IF WE KNOW Q, WE KNOW HOW TO ACT';
    root.appendChild(heading);

    /* ---- Optimal-policy formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">OPTIMAL POLICY</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`\pi^{\star}(s) \;=\; \operatorname*{arg\,max}_{a}\; Q(s, a)`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = 'In every state, pick the move with the highest Q.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* ---- Demo battle ---- */
    const demoWrap = document.createElement('div');
    demoWrap.className = 'qstar-demo';
    root.appendChild(demoWrap);

    /* Battle stage on the left. The opponent sprite swaps when its HP
       crosses a form threshold — referenced via oppSpriteEl below. */
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
      name: 'CHARMANDER', side: 'opponent', level: 5, numBuckets: NB,
    });
    const pikaHp = window.HPBar.mount(playerHpHost, {
      name: 'PIKACHU', side: 'player', level: 5, numBuckets: NB,
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

    /* ---- Closing question (bridge to sceneDp) ---- */
    const q = document.createElement('div');
    q.className = 'concept-key-question';
    q.textContent = 'BUT HOW DO WE COMPUTE Q ?';
    root.appendChild(q);

    /* ---- Demo state machine ---- */
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
      oppSpriteEl.alt = window.Battle.displayNameForOpp(b);
      if (charmHp && charmHp.setName) charmHp.setName(window.Battle.displayNameForOpp(b));
    }

    function renderQPanel() {
      const base = stateIdx() * A;
      const oppForm = window.Battle.displayNameForOpp(Math.min(NB - 1, charmBucket));
      let html =
        '<div class="qstar-panel-title">STATE (YOUR=' + bucketName(pikaBucket) +
        ', ' + oppForm + ' ' + bucketName(charmBucket) + ')</div>' +
        '<div class="qstar-rows">';
      for (let k = 0; k < A; k++) {
        const qv = qStar[base + k];
        const isArg = (k === argmaxA);
        const move = window.Moves.MOVE_BY_ID[ACTIONS[k]];
        html += '<div class="qstar-row' + (isArg ? ' argmax' : '') + '">' +
                  '<span class="qstar-mark">' + (isArg ? '▶' : '') + '</span>' +
                  '<span class="qstar-name">' + move.name + '</span>' +
                  '<span class="qstar-q">' + (qv >= 0 ? '+' : '') + qv.toFixed(2) + '</span>' +
                  '<span class="qstar-tag">' + (isArg ? 'argmax · π*(s)' : '') + '</span>' +
                '</div>';
      }
      html += '</div>';
      qPanel.innerHTML = html;
    }

    function updateStatus(phaseLabel) {
      status.innerHTML =
        '<span>TURN <b>' + turnIdx + '</b></span>' +
        '<span>STATE <b>' + bucketName(pikaBucket) + ' / ' + bucketName(charmBucket) + '</b></span>' +
        '<span>PHASE <b>' + phaseLabel + '</b></span>';
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
      updateStatus('SHOWING Q');
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
        setTimeout(() => {
          charmBucket = Math.min(NB, charmBucket + 1);
          charmHp.set(Math.min(charmBucket, NB - 1));
          refreshOppSprite();
          spawnFlash('opp', '−1 HP', 'var(--cb-vermillion)');
        }, 480);
        setTimeout(() => stage.classList.remove('qstar-attack'), 1100);
        updateStatus('PIKA → ' + window.Moves.MOVE_BY_ID[ACTIONS[argmaxA]].name);
        dwell = 1400;

      } else if (phase === 'attack') {
        if (charmBucket >= NB) {
          phase = 'banner-win';
          showBanner('✓ WIN  +10', 'win');
          updateStatus('OPP FAINTED — WIN');
          dwell = 2600;
        } else {
          /* Charm counters. */
          phase = 'counter';
          stage.classList.remove('qstar-counter');
          void stage.offsetWidth;
          stage.classList.add('qstar-counter');
          setTimeout(() => {
            pikaBucket = Math.min(NB, pikaBucket + 1);
            pikaHp.set(Math.min(pikaBucket, NB - 1));
            spawnFlash('pika', '−1 HP', 'var(--cb-vermillion)');
          }, 480);
          setTimeout(() => stage.classList.remove('qstar-counter'), 1100);
          updateStatus('CHARM → EMBER');
          dwell = 1400;
        }

      } else if (phase === 'counter') {
        if (pikaBucket >= NB) {
          phase = 'banner-loss';
          showBanner('✗ LOSS  −10', 'loss');
          updateStatus('PIKA FAINTED — LOSS');
          dwell = 2600;
        } else {
          turnIdx++;
          phase = 'show';
          pickArgmax();
          renderQPanel();
          updateStatus('SHOWING Q');
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
    updateStatus('SHOWING Q');
    /* Kick off the loop. */
    step();

    return {
      onLeave() { stopDemo(); },
    };
  };
})();

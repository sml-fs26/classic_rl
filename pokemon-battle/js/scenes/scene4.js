/* Scene 4 — SARSA, one step at a time.
 *
 *   The earlier draft fast-forwarded through precomputed snapshots; this one
 *   runs a live SARSA agent in the page and exposes the loop step by step.
 *   The pedagogical script we follow on screen:
 *
 *     1. Init Q(s,a) to small random noise — no plan yet.
 *     2. Pick action a at current state s via ε-greedy.
 *     3. Play a in the world; observe reward r and new state s'.
 *     4. Pick a' at s' via ε-greedy (the second "A" in SARSA).
 *     5. Update Q(s,a) toward r + γ·Q(s',a') by α.
 *     6. s ← s', a ← a'. Repeat.
 *
 *   The +1 / +5 / +10 / +100 buttons drive that loop. The right-hand
 *   panels show what just happened (full Bellman computation, colour-coded
 *   back to the formula card) and what is about to happen (live sprites
 *   + HP bars + queued action). The Q-table heatmap and argmax strip from
 *   QTable.mount still sit below, updating after every batch.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB      = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;
  const ACTIONS = window.Moves.MOVE_IDS;
  const A       = ACTIONS.length;
  const STATES  = window.Bellman.STATES;
  const N       = STATES.length;

  function bucketName(b) { return b >= NB ? 'FAINTED' : BUCKETS[b].toUpperCase(); }
  function stateLabel(s) {
    if (!s) return '—';
    if (s.terminal) return s.win ? 'WIN (terminal)' : 'LOSS (terminal)';
    return bucketName(s.your) + ' / ' + bucketName(s.opp);
  }
  function moveShort(id) { return window.QTable.shortMoveLabel(id); }
  function moveName(id)  { return window.Moves.MOVE_BY_ID[id].name; }
  function bucketPct(b)  { return Math.max(0, (NB - b) * 100 / NB); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function fmtSigned(v) { return (v >= 0 ? '+' : '') + v.toFixed(2); }

  function renderBattleNow(host, s, pending, epState) {
    const fainted = s && s.terminal;
    let html =
      '<div class="sc4-bn-title">BATTLE NOW</div>' +
      '<div class="sc4-bn-row">' +
        '<div class="sc4-bn-side">' +
          '<img class="sc4-bn-sprite" src="assets/pikachu-back.png" alt="Pikachu">' +
          '<div class="sc4-bn-hp"><div class="sc4-bn-hp-fill ' + (fainted && !s.win ? 'b4' : bucketClass(s.your || 0)) + '"' +
              ' style="width:' + (fainted && !s.win ? 0 : bucketPct(s.your || 0)) + '%"></div></div>' +
          '<div class="sc4-bn-label">PIKACHU ' + (fainted && !s.win ? 'FAINTED' : bucketName(s.your || 0)) + '</div>' +
        '</div>' +
        '<div class="sc4-bn-side">' +
          '<img class="sc4-bn-sprite" src="' + window.Battle.spriteForOpp(Math.min(NB - 1, s.opp || 0)) + '"' +
            ' alt="' + window.Battle.displayNameForOpp(Math.min(NB - 1, s.opp || 0)) + '">' +
          '<div class="sc4-bn-hp"><div class="sc4-bn-hp-fill ' + (fainted && s.win ? 'b4' : bucketClass(s.opp || 0)) + '"' +
              ' style="width:' + (fainted && s.win ? 0 : bucketPct(s.opp || 0)) + '%"></div></div>' +
          '<div class="sc4-bn-label">' +
              ((fainted && s.win)
                ? 'FAINTED'
                : (window.Battle.displayNameForOpp(s.opp || 0) + ' ' + bucketName(s.opp || 0))) +
          '</div>' +
        '</div>' +
      '</div>';

    if (epState === 'ready') {
      html += '<div class="sc4-bn-next">EPISODE OVER — click <b>+1</b> to start a new battle.</div>';
    } else if (pending && pending.aIdx >= 0) {
      html += '<div class="sc4-bn-next">NEXT MOVE: <b class="comp-mdp">' + moveName(ACTIONS[pending.aIdx]) + '</b>' +
              '<span class="sc4-bn-pick comp-eps">(' + (pending.exploring ? 'EXPLORE — random' : 'EXPLOIT — argmax Q(s, ·)') + ')</span></div>';
    } else {
      html += '<div class="sc4-bn-next"><i>No action queued.</i></div>';
    }
    host.innerHTML = html;
  }

  function renderStepDetail(host, u, alpha, gamma, opts) {
    const animate = !!(opts && opts.animate);
    if (!u) {
      host.innerHTML =
        '<div class="sc4-sd-title">LAST UPDATE</div>' +
        '<div class="sc4-sd-empty">No steps taken yet.<br>Click <b>+1 STEP</b> to play one turn.</div>';
      return;
    }
    const sLab     = stateLabel(u.s);
    const aLab     = moveName(ACTIONS[u.aIdx]);
    const sNextLab = stateLabel(u.sNext);
    let aNextLab;
    if (u.terminal) {
      aNextLab = '— (terminal, Q(s′, a′) = 0)';
    } else {
      aNextLab = moveName(ACTIONS[u.aNextIdx]) +
                 ' <span class="sc4-sd-pick">(' + (u.aNextExplore ? 'explore' : 'argmax') + ')</span>';
    }
    const targetParts = u.terminal
      ? fmtSigned(u.reward) + ' &nbsp;(terminal, drop bootstrap)'
      : fmtSigned(u.reward) + ' + ' + gamma.toFixed(2) + '·' + fmtSigned(u.qNext) + ' = ' + fmtSigned(u.target);

    host.innerHTML =
      '<div class="sc4-sd-title">LAST UPDATE — STEP ' + u.step + '</div>' +
      '<div class="sc4-sd-row"><span>s</span><span class="comp-mdp">' + sLab + '</span></div>' +
      '<div class="sc4-sd-row"><span>a</span><span><b class="comp-mdp">' + aLab + '</b>' +
        '<span class="sc4-sd-pick">(' + (u.aExplore ? 'explore' : 'argmax') + ')</span></span></div>' +
      '<div class="sc4-sd-row"><span>r</span><span class="comp-bellman">' + fmtSigned(u.reward) + '</span></div>' +
      '<div class="sc4-sd-row"><span>s′</span><span class="comp-mdp">' + sNextLab + '</span></div>' +
      '<div class="sc4-sd-row"><span>a′</span><span class="comp-eps">' + aNextLab + '</span></div>' +
      '<div class="sc4-sd-sep"></div>' +
      '<div class="sc4-sd-calc">' +
        '<div class="sc4-sd-row"><span>Q(s, a) before</span><span class="comp-mdp">' + fmtSigned(u.qBefore) + '</span></div>' +
        '<div class="sc4-sd-row"><span>target = r + γ·Q(s′, a′)</span><span class="comp-bellman">' + targetParts + '</span></div>' +
        '<div class="sc4-sd-row"><span>δ = target − Q(s, a)</span><span class="comp-bellman">' + fmtSigned(u.delta) + '</span></div>' +
        '<div class="sc4-sd-row sc4-sd-bottom"><span>Q(s, a) after = Q + α·δ</span><span class="comp-mdp">' +
          fmtSigned(u.qBefore) + ' + ' + alpha.toFixed(2) + '·' + fmtSigned(u.delta) + ' = <b>' + fmtSigned(u.qAfter) + '</b></span></div>' +
      '</div>';

    if (animate) {
      /* Fade rows in one at a time so the Bellman computation unfolds rather
         than landing all at once. Title is already on screen — first row
         starts at 0 ms, subsequent rows step by ~120 ms. */
      const rows = host.querySelectorAll('.sc4-sd-row, .sc4-sd-sep');
      const stepMs = 110;
      rows.forEach((r, i) => {
        r.style.animationDelay = (i * stepMs) + 'ms';
        r.classList.add('sc4-sd-row-anim');
      });
    }
  }

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const cfg   = window.DATA.params.sarsa;
    const eps   = cfg.epsilon;
    const alpha = cfg.alpha;
    const gamma = cfg.gamma;

    /* Heading */
    const heading = document.createElement('h2');
    heading.className = 'poke-section-title';
    heading.textContent = 'SARSA — PIKACHU LEARNS Q ONE STEP AT A TIME';
    root.appendChild(heading);

    /* Narrator dialog */
    const narratorHost = document.createElement('div');
    narratorHost.className = 'sc4-narrator';
    root.appendChild(narratorHost);
    const narrator = window.Dialog.mount(narratorHost);

    /* Compact SARSA formula card — derivation lives in the previous
       scene, so we only need the rule itself plus the hyperparameters. */
    const formulaCard = document.createElement('div');
    formulaCard.className = 'sc4-formula-card compact';
    formulaCard.innerHTML =
      '<div class="sc4-formula">' +
        '<span class="comp-mdp">q[s, a]</span> ← <span class="comp-mdp">q[s, a]</span> + <span class="comp-rm">α</span>' +
        ' ( <span class="comp-bellman">r + γ&middot;q[s′, a′]</span>' +
        ' − <span class="comp-mdp">q[s, a]</span> )' +
      '</div>' +
      '<div class="sc4-formula-hyper">' +
        '<span>ε = ' + eps.toFixed(2) + '</span>' +
        '<span>α = ' + alpha.toFixed(2) + '</span>' +
        '<span>γ = ' + gamma.toFixed(2) + '</span>' +
      '</div>';
    root.appendChild(formulaCard);

    /* Step controls + status counter */
    const controlsRow = document.createElement('div');
    controlsRow.className = 'sc4-controls-row';
    controlsRow.innerHTML =
      '<div class="sc4-controls">' +
        '<button class="poke-btn sc4-btn-step" data-step="1">+1 STEP</button>' +
        '<button class="poke-btn sc4-btn-step" data-step="5">+5</button>' +
        '<button class="poke-btn sc4-btn-step" data-step="10">+10</button>' +
        '<button class="poke-btn sc4-btn-step" data-step="100">+100</button>' +
        '<button class="poke-btn sc4-reset" data-step="0">RESET</button>' +
      '</div>' +
      '<div class="sc4-step-status">' +
        '<span>STEP <b id="sc4-step-count">0</b></span>' +
        '<span>BATTLES PLAYED <b id="sc4-ep-count">0</b></span>' +
        '<span>TURNS THIS BATTLE <b id="sc4-turn-count">0</b></span>' +
        '<span>WINS <b id="sc4-wins">0</b> / LOSSES <b id="sc4-losses">0</b></span>' +
      '</div>';
    root.appendChild(controlsRow);

    /* Side-by-side: battle-now + step-detail */
    const splitRow = document.createElement('div');
    splitRow.className = 'sc4-split-row';
    const battleNowHost = document.createElement('div');
    battleNowHost.className = 'sc4-battle-now poke-box tight';
    splitRow.appendChild(battleNowHost);
    const stepDetailHost = document.createElement('div');
    stepDetailHost.className = 'sc4-step-detail poke-box tight';
    splitRow.appendChild(stepDetailHost);
    root.appendChild(splitRow);

    /* Q-table */
    const qHost = document.createElement('div');
    qHost.className = 'sc4-q';
    root.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    /* (caption removed — derivation scene + the live LAST UPDATE panel
       carry the explanation now.) */

    /* ----- Live SARSA state ----- */
    let Q = null;
    let rng = null;
    let s = null;
    let sIdx = -1;
    let aIdx = -1;
    let aExplore = false;
    let epState = 'ready';   // 'ready' | 'mid'
    let stepCount = 0;
    let episodeCount = 0;
    let turnsThisEp = 0;
    let wins = 0;
    let losses = 0;
    let lastUpdate = null;

    function initRandomQ() {
      Q = new Float32Array(N * A);
      for (let i = 0; i < Q.length; i++) {
        Q[i] = (rng() - 0.5) * 0.4;     // uniform in [-0.2, 0.2]
      }
    }

    function pickActionIdx(stateIdx) {
      if (rng() < eps) {
        return { aIdx: Math.floor(rng() * A), exploring: true };
      }
      const base = stateIdx * A;
      let m = Q[base];
      for (let a = 1; a < A; a++) if (Q[base + a] > m) m = Q[base + a];
      const ties = [];
      for (let a = 0; a < A; a++) if (Q[base + a] === m) ties.push(a);
      const pick = ties.length === 1 ? ties[0] : ties[Math.floor(rng() * ties.length)];
      return { aIdx: pick, exploring: false };
    }

    function startEpisode() {
      s = window.Battle.initialState();
      sIdx = s.your * NB + s.opp;
      const p = pickActionIdx(sIdx);
      aIdx = p.aIdx;
      aExplore = p.exploring;
      turnsThisEp = 0;
    }

    function reset() {
      rng = window.Battle.makeRng(0x4242);
      initRandomQ();
      stepCount = 0;
      episodeCount = 0;
      wins = 0;
      losses = 0;
      lastUpdate = null;
      epState = 'mid';
      startEpisode();
      qtbl.reset();
      qtbl.update(Q, { suppressFlash: true });
      refreshPanels();
      narrator.say('Q-table is small random noise — PIKACHU has no plan yet. Click +1 STEP to play the first turn.', { instant: true });
    }

    function doStep() {
      if (epState === 'ready') {
        startEpisode();
        epState = 'mid';
      }
      const aId = ACTIONS[aIdx];
      const qBefore = Q[sIdx * A + aIdx];
      const out = window.Battle.sample(s, aId, rng);

      const u = {
        step: stepCount + 1,
        s: { your: s.your, opp: s.opp, terminal: false },
        sIdx, aIdx, aExplore,
        reward: out.reward,
        terminal: out.terminal,
        qBefore,
      };

      if (out.terminal) {
        const target = out.reward;             // bootstrap drops at terminal
        const delta  = target - qBefore;
        const qAfter = qBefore + alpha * delta;
        Q[sIdx * A + aIdx] = qAfter;

        u.sNext = { terminal: true, win: !!out.win, lose: !!out.lose };
        u.aNextIdx = -1;
        u.aNextExplore = false;
        u.qNext = 0;
        u.target = target;
        u.delta = delta;
        u.qAfter = qAfter;
        u.won = !!out.win;

        if (out.win) wins++; else losses++;
        episodeCount++;
        turnsThisEp++;
        stepCount++;
        lastUpdate = u;
        /* Preserve at-the-moment-of-kill HP on the terminal marker so
           BATTLE NOW shows the surviving side at its actual HP and the
           other side fainted. Pull from out.log so we get Charm's HP
           after Pikachu's killing move on a loss, not the pre-step value. */
        const yourEnd = out.log ? out.log.yourAfter : u.s.your;
        const oppEnd  = out.log ? out.log.oppAfter  : u.s.opp;
        s = { your: yourEnd, opp: oppEnd, terminal: true,
              win: !!out.win, lose: !!out.lose };
        sIdx = -1; aIdx = -1; aExplore = false;
        epState = 'ready';
      } else {
        const sNext = out.sNext;
        const sNextIdx = sNext.your * NB + sNext.opp;
        const pNext = pickActionIdx(sNextIdx);
        const qNext = Q[sNextIdx * A + pNext.aIdx];
        const target = out.reward + gamma * qNext;
        const delta  = target - qBefore;
        const qAfter = qBefore + alpha * delta;
        Q[sIdx * A + aIdx] = qAfter;

        u.sNext = { your: sNext.your, opp: sNext.opp, terminal: false };
        u.sNextIdx = sNextIdx;
        u.aNextIdx = pNext.aIdx;
        u.aNextExplore = pNext.exploring;
        u.qNext = qNext;
        u.target = target;
        u.delta = delta;
        u.qAfter = qAfter;

        s = sNext;
        sIdx = sNextIdx;
        aIdx = pNext.aIdx;
        aExplore = pNext.exploring;
        turnsThisEp++;
        stepCount++;
        lastUpdate = u;
      }
    }

    function doSteps(n) {
      for (let i = 0; i < n; i++) doStep();
      qtbl.update(Q);
      refreshPanels({ animateStepDetail: n === 1 });
      pulseUpdatedCell(lastUpdate.sIdx);
      narrator.say(narrationFor(n, lastUpdate), { instant: true });
    }

    function pulseUpdatedCell(stateIdx) {
      const node = qtbl.getCellNode(stateIdx);
      if (!node) return;
      node.classList.remove('just-updated');
      void node.offsetWidth;
      node.classList.add('just-updated');
      setTimeout(() => node.classList.remove('just-updated'), 1400);
    }

    function refreshPanels(opts) {
      const o = opts || {};
      renderBattleNow(battleNowHost, s, { aIdx, exploring: aExplore }, epState);
      renderStepDetail(stepDetailHost, lastUpdate, alpha, gamma, { animate: !!o.animateStepDetail });
      document.getElementById('sc4-step-count').textContent = String(stepCount);
      document.getElementById('sc4-ep-count').textContent   = String(episodeCount);
      document.getElementById('sc4-turn-count').textContent = String(turnsThisEp);
      document.getElementById('sc4-wins').textContent       = String(wins);
      document.getElementById('sc4-losses').textContent     = String(losses);
    }

    function narrationFor(batchSize, u) {
      if (!u) return 'No steps yet.';
      const sLab = stateLabel(u.s);
      const mvShort = moveShort(ACTIONS[u.aIdx]);
      const mvLong  = moveName(ACTIONS[u.aIdx]);
      const tagPick = u.aExplore ? 'EXPLORE' : 'EXPLOIT';
      const dir = u.delta > 0.05 ? 'went UP' : (u.delta < -0.05 ? 'went DOWN' : 'barely moved');

      if (batchSize === 1) {
        if (u.terminal) {
          return 'Step ' + u.step + '. At ' + sLab + ', PIKACHU used ' + mvLong + ' (' + tagPick + '). ' +
                 (u.won ? 'PIKACHU WON the battle!' : 'PIKACHU FAINTED.') +
                 ' Reward ' + fmtSigned(u.reward) + '. No bootstrap (terminal). ' +
                 'Q for (' + sLab + ', ' + mvShort + ') ' + dir + '. Click +1 to start the next battle.';
        }
        return 'Step ' + u.step + '. At ' + sLab + ', PIKACHU used ' + mvLong + ' (' + tagPick + '). ' +
               'Reward ' + fmtSigned(u.reward) + '. Now at ' + stateLabel(u.sNext) + '. ' +
               'Q for (' + sLab + ', ' + mvShort + ') ' + dir + '.';
      }
      return 'Ran ' + batchSize + ' steps. Now step ' + stepCount + ', battle ' + (episodeCount + 1) + '. ' +
             'Wins ' + wins + ', losses ' + losses + '. Last update at ' + sLab + ' with ' + mvLong + ' (' + tagPick + '). ' +
             'Heatmap reflects everything learned so far.';
    }

    /* Wire buttons */
    controlsRow.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.step, 10);
        if (n === 0) reset();
        else         doSteps(n);
      });
    });

    /* Initial mount */
    reset();

    /* Headless verification flag */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      setTimeout(() => doSteps(1),   200);
      setTimeout(() => doSteps(100), 700);
      setTimeout(() => doSteps(1000),1200);
    }

    return {
      onEnter() { refreshPanels(); qtbl.update(Q, { suppressFlash: true }); },
      /* Right arrow = one more SARSA step (matches the +1 STEP button).
         SARSA's loop is open-ended; to advance to the next scene the
         student clicks the NEXT button in the topbar. */
      onNextKey() { doSteps(1); return true; },
      onPrevKey() { return false; },
    };
  };
})();

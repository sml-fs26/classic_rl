/* Scene-EPS — ε-greedy zoomed in on a single state.
 *
 *   The state: PIKACHU=MID HP, CHARMANDER=CRITICAL HP. Pikachu is one
 *   good hit from victory. After SARSA training, Q(s,·) is known and
 *   THUNDERBOLT is the argmax — pure greedy wins every battle from here.
 *
 *   This scene exposes the explore-exploit trade-off mechanically:
 *     (a) the Q-row for this state (4 bars, argmax marked),
 *     (b) the ε-greedy action distribution P(a | ε), drawn as 4 bars whose
 *         widths shift live as the student drags the slider,
 *     (c) a 1000-trial Monte-Carlo simulation rolled fresh on every slider
 *         change — same starting state, same Q, only ε varies. Win-rate,
 *         loss-rate, average reward, and average episode length update so
 *         the cost of exploration is a number the student can read.
 *
 *   The narrative: Pikachu only got HERE because earlier in training, ε > 0
 *   forced it to try things and discover what Q's argmax should be. Now
 *   that Q is converged, every random move is a tax. The slider makes the
 *   tax visible — at ε=0 you win 100%, at ε=1 you win ~40-50% from a state
 *   that should be free.
 */
(function () {
  window.scenes = window.scenes || {};

  /* The chosen state: Pikachu mid-HP, opponent at critical → Charizard. */
  const FOCUS = { your: 2, opp: 4 };   // 2 = mid, 4 = critical
  const FOCUS_NAME = 'MID / CRITICAL';

  const MOVE_IDS = window.Moves.MOVE_IDS;
  const A = MOVE_IDS.length;
  const NB = window.Battle.NUM_BUCKETS;
  const N = NB * NB;
  const FOCUS_IDX = FOCUS.your * NB + FOCUS.opp;
  const GAMMA = window.DATA.params.gammaDefault;

  /* Compute Q* on the fly under the form-aware dynamics — the
     precomputed SARSA snapshots in DATA.sarsa are stale (built against
     the old single-form MDP). VI converges in a few dozen iterations
     for this 25-state grid. */
  function computeQstar() {
    let V = new Float64Array(N);
    for (let iter = 0; iter < 400; iter++) {
      const newV = new Float64Array(N);
      let maxDelta = 0;
      for (let s = 0; s < N; s++) {
        const yourB = Math.floor(s / NB);
        const oppB  = s % NB;
        let bestQ = -Infinity;
        for (let a = 0; a < A; a++) {
          const succ = window.Battle.successors({ your: yourB, opp: oppB, terminal: false }, MOVE_IDS[a]);
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
      const yourB = Math.floor(s / NB);
      const oppB  = s % NB;
      for (let a = 0; a < A; a++) {
        const succ = window.Battle.successors({ your: yourB, opp: oppB, terminal: false }, MOVE_IDS[a]);
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
  const FINAL_Q = computeQstar();

  function qRow() {
    const out = new Array(A);
    for (let a = 0; a < A; a++) out[a] = FINAL_Q[FOCUS_IDX * A + a];
    return out;
  }
  function argmaxRow() {
    const r = qRow();
    let best = r[0], bestI = 0;
    for (let i = 1; i < A; i++) if (r[i] > best) { best = r[i]; bestI = i; }
    return bestI;
  }
  function actionProbs(eps, argmax) {
    const out = new Array(A);
    for (let a = 0; a < A; a++) {
      out[a] = eps / A + (a === argmax ? 1 - eps : 0);
    }
    return out;
  }

  /* ε-greedy on Q. Uniform-random tiebreak among argmax cells (kept to match
     sarsa.js's argmaxQ — single argmax in our case, so this is just a
     formality). */
  function pickAction(Q, sIdx, eps, rng) {
    if (rng() < eps) return Math.floor(rng() * A);
    let best = Q[sIdx * A], bestList = [0];
    for (let a = 1; a < A; a++) {
      const v = Q[sIdx * A + a];
      if (v > best) { best = v; bestList = [a]; }
      else if (v === best) bestList.push(a);
    }
    return bestList[Math.floor(rng() * bestList.length)];
  }

  /* Roll N episodes from the focus state under ε-greedy. Returns
     aggregate stats. */
  function simulate(eps, N, seed) {
    const rng = window.Battle.makeRng(seed);
    let wins = 0, losses = 0, totalReward = 0, totalTurns = 0;
    for (let i = 0; i < N; i++) {
      let s = { your: FOCUS.your, opp: FOCUS.opp, terminal: false };
      let r = 0;
      let turns = 0;
      while (!s.terminal && turns < 60) {
        const sIdx = window.Battle.stateIndex(s);
        const aIdx = pickAction(FINAL_Q, sIdx, eps, rng);
        const out = window.Battle.sample(s, MOVE_IDS[aIdx], rng);
        r += out.reward;
        turns++;
        s = out.sNext;
      }
      if (s.win) wins++;
      else if (s.lose) losses++;
      totalReward += r;
      totalTurns += turns;
    }
    return {
      wins, losses, N,
      winRate: wins / N,
      avgReward: totalReward / N,
      avgTurns: totalTurns / N,
    };
  }

  function shortLabel(id) {
    return window.QTable && window.QTable.shortMoveLabel
      ? window.QTable.shortMoveLabel(id) : id;
  }

  window.scenes.sceneEps = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    /* ---------- Header ---------- */
    const header = document.createElement('h2');
    header.className = 'poke-section-title';
    header.textContent = 'ε-GREEDY AT ONE STATE — THE COST OF EXPLORATION';
    root.appendChild(header);

    /* ---------- Battle stage frozen at MID / CRITICAL ---------- */
    const stage = document.createElement('div');
    stage.className = 'battle-stage sc-eps-stage';
    stage.innerHTML = `
      <div class="grass-rim"></div>
      <div class="platform opponent"></div>
      <div class="platform player"></div>
      <div class="sprite-host opponent"></div>
      <div class="sprite-host player"></div>
    `;
    root.appendChild(stage);

    /* Opponent in this state is at CRITICAL HP → form is CHARIZARD. */
    const oppForm = window.Battle.formForOpp(FOCUS.opp);
    const oppName = window.Battle.FORM_DISPLAY_NAME[oppForm];
    window.Sprite.mount(stage.querySelector('.sprite-host.opponent'), oppForm, 'opponent');
    window.Sprite.mount(stage.querySelector('.sprite-host.player'), 'pikachu', 'player');

    const oppHpHost = document.createElement('div');
    const playerHpHost = document.createElement('div');
    stage.appendChild(oppHpHost);
    stage.appendChild(playerHpHost);
    const oppHp = window.HPBar.mount(oppHpHost, {
      name: oppName, side: 'opponent', level: 5, numBuckets: NB,
    });
    const playerHp = window.HPBar.mount(playerHpHost, {
      name: 'PIKACHU', side: 'player', level: 5, numBuckets: NB,
    });
    oppHp.set(FOCUS.opp);
    playerHp.set(FOCUS.your);

    const stateNote = document.createElement('div');
    stateNote.className = 'poke-caption sc-eps-state-note';
    stateNote.innerHTML =
      'STATE: <strong>' + FOCUS_NAME + '</strong>. PIKACHU faces a critically-wounded <strong>' +
      oppName + '</strong>. The right move ends it — but the wrong move eats an Outrage.';
    root.appendChild(stateNote);

    /* ---------- Q-row display ---------- */
    const qBlock = document.createElement('div');
    qBlock.className = 'poke-box sc-eps-block';
    qBlock.innerHTML = '<div class="sc-eps-block-title">Q*(s, ·) — the converged action-value at this state</div>';
    root.appendChild(qBlock);

    const qBars = document.createElement('div');
    qBars.className = 'sc-eps-bars';
    qBlock.appendChild(qBars);

    const q = qRow();
    const argmaxI = argmaxRow();
    const qMin = Math.min(...q);
    const qMax = Math.max(...q);
    const qSpan = Math.max(0.01, qMax - qMin);
    for (let a = 0; a < A; a++) {
      const w = ((q[a] - qMin) / qSpan) * 100;
      const row = document.createElement('div');
      row.className = 'sc-eps-bar-row' + (a === argmaxI ? ' argmax' : '');
      row.innerHTML =
        '<span class="sc-eps-mark">' + (a === argmaxI ? '▶' : '') + '</span>' +
        '<span class="sc-eps-label">' + shortLabel(MOVE_IDS[a]) + '</span>' +
        '<span class="sc-eps-bar-track"><span class="sc-eps-bar-fill" style="width:' + w.toFixed(1) + '%"></span></span>' +
        '<span class="sc-eps-val">' + (q[a] >= 0 ? '+' : '') + q[a].toFixed(2) + '</span>';
      qBars.appendChild(row);
    }

    /* ---------- ε slider ---------- */
    const epsBlock = document.createElement('div');
    epsBlock.className = 'poke-box sc-eps-block';
    epsBlock.innerHTML =
      '<div class="sc-eps-block-title">ε — PROBABILITY OF PICKING A RANDOM MOVE</div>' +
      '<div class="sc-eps-slider-row">' +
        '<span class="sc-eps-eps-tag">ε</span>' +
        '<input type="range" id="sc-eps-slider" min="0" max="100" step="1" value="10">' +
        '<output id="sc-eps-eps-val">0.10</output>' +
      '</div>';
    root.appendChild(epsBlock);

    /* ---------- Action distribution ---------- */
    const probBlock = document.createElement('div');
    probBlock.className = 'poke-box sc-eps-block';
    probBlock.innerHTML = '<div class="sc-eps-block-title">P(ACTION | ε)</div>';
    root.appendChild(probBlock);

    const probBars = document.createElement('div');
    probBars.className = 'sc-eps-bars';
    probBlock.appendChild(probBars);

    const probNodes = [];
    for (let a = 0; a < A; a++) {
      const row = document.createElement('div');
      row.className = 'sc-eps-bar-row' + (a === argmaxI ? ' argmax prob' : ' prob');
      row.innerHTML =
        '<span class="sc-eps-mark">' + (a === argmaxI ? '▶' : '') + '</span>' +
        '<span class="sc-eps-label">' + shortLabel(MOVE_IDS[a]) + '</span>' +
        '<span class="sc-eps-bar-track"><span class="sc-eps-bar-fill"></span></span>' +
        '<span class="sc-eps-val sc-eps-prob-val">0.0%</span>';
      probBars.appendChild(row);
      probNodes[a] = {
        fill: row.querySelector('.sc-eps-bar-fill'),
        val:  row.querySelector('.sc-eps-prob-val'),
      };
    }

    /* ---------- 1000-trial simulation panel ---------- */
    const simBlock = document.createElement('div');
    simBlock.className = 'poke-box sc-eps-block sc-eps-sim';
    simBlock.innerHTML =
      '<div class="sc-eps-block-title">1000 BATTLES STARTED FROM THIS STATE</div>' +
      '<div class="hud-strip sc-eps-hud">' +
        '<div class="hud-item"><div class="hud-label">WINS</div><div class="hud-val" id="sc-eps-wins">—</div></div>' +
        '<div class="hud-item"><div class="hud-label">LOSSES</div><div class="hud-val" id="sc-eps-losses">—</div></div>' +
        '<div class="hud-item"><div class="hud-label">WIN RATE</div><div class="hud-val sc-eps-emph" id="sc-eps-winrate">—</div></div>' +
        '<div class="hud-item"><div class="hud-label">AVG REWARD</div><div class="hud-val" id="sc-eps-reward">—</div></div>' +
        '<div class="hud-item"><div class="hud-label">AVG TURNS</div><div class="hud-val" id="sc-eps-turns">—</div></div>' +
      '</div>';
    root.appendChild(simBlock);

    /* ---------- Caption ---------- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.innerHTML =
      'Pikachu has been <strong>trained</strong> — Q is known. ' +
      '<strong>' + shortLabel(MOVE_IDS[argmaxI]) + '</strong> has the highest Q at this state — ' +
      'against a CHARIZARD on its last legs, the super-effective hit closes the battle in one move. ' +
      'Pure greedy (ε = 0) picks it every time and wins from here essentially every battle. ' +
      'Higher ε spreads probability across all moves: sometimes you roll THUNDER and it misses (45% chance), ' +
      'sometimes you pick THUNDERBOLT and only do 1 damage — eating an Outrage that faints you. ' +
      'Each random move is a chance to throw away a sure thing.' +
      '<br><br>' +
      'But you couldn\'t HAVE Q without exploration — SARSA in the previous scene needed ε > 0 to ' +
      'discover which move was best in the first place. ' +
      '<strong>Once trained, dial ε down. While training, keep it up.</strong> ' +
      'That tension between learning and earning is what ε-greedy is.';
    root.appendChild(caption);

    /* ---------- Wiring ---------- */
    const slider = root.querySelector('#sc-eps-slider');
    const epsValEl = root.querySelector('#sc-eps-eps-val');
    const winsEl = root.querySelector('#sc-eps-wins');
    const lossesEl = root.querySelector('#sc-eps-losses');
    const winRateEl = root.querySelector('#sc-eps-winrate');
    const rewardEl = root.querySelector('#sc-eps-reward');
    const turnsEl = root.querySelector('#sc-eps-turns');

    const SIM_SEED = 20260513;
    const SIM_N = 1000;

    function update() {
      const eps = parseInt(slider.value, 10) / 100;
      epsValEl.textContent = eps.toFixed(2);

      const probs = actionProbs(eps, argmaxI);
      for (let a = 0; a < A; a++) {
        const p = probs[a];
        probNodes[a].fill.style.width = (p * 100).toFixed(1) + '%';
        probNodes[a].val.textContent = (p * 100).toFixed(1) + '%';
      }

      const sim = simulate(eps, SIM_N, SIM_SEED);
      winsEl.textContent = String(sim.wins);
      lossesEl.textContent = String(sim.losses);
      winRateEl.textContent = (sim.winRate * 100).toFixed(1) + '%';
      rewardEl.textContent = (sim.avgReward >= 0 ? '+' : '') + sim.avgReward.toFixed(2);
      turnsEl.textContent = sim.avgTurns.toFixed(2);
    }

    slider.addEventListener('input', update);
    update();

    return {
      onEnter() { update(); },
    };
  };
})();

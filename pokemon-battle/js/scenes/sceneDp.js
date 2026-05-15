/* Scene — filling Q with dynamic programming.
 *
 *   We compute Q*(s, a) for the 25-state battle MDP using value iteration
 *   (offline, once at mount), then STEP through 6 phases of pedagogical
 *   "fills" on the reused QTable widget:
 *
 *     1. Right edge: OPP = CRITICAL column. BOLT always finishes the
 *        opponent, so Q*(s, BOLT) = +10 across the column.
 *
 *     2. Bottom edge: YOUR = CRITICAL row. PIKACHU is one Ember from
 *        fainting; most cells are negative.
 *
 *     3. The detail cell — (YOUR=LOW, OPP=LOW). Side panel renders the
 *        full Bellman expansion for BOLT here, term by term, all the
 *        way down to the +6.75 total.
 *
 *     4. Propagate inward through OPP=LOW and YOUR=LOW (skipping the
 *        cells filled by previous phases).
 *
 *     5. Fill the remaining inner 3×3.
 *
 *     6. Done — recap.
 *
 *   The Bellman optimality formula sits in a card at the top. STEP /
 *   RUN ALL / RESET drive the phases. The right-hand side panel shows
 *   per-phase narration, with the detail cell getting a full
 *   structured breakdown rather than prose.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB      = window.Battle.NUM_BUCKETS;          // 5
  const BUCKETS = window.Battle.BUCKETS;
  const ACTIONS = window.Moves.MOVE_IDS;
  const A       = ACTIONS.length;
  const STATES  = window.Bellman.STATES;
  const N       = STATES.length;                       // 25
  const GAMMA   = 1;     // Undiscounted — every trajectory terminates (win/loss).

  function bucketName(b) { return b >= NB ? 'FAINT' : BUCKETS[b].toUpperCase(); }
  function stateLabel(s) {
    return bucketName(s.your) + ' / ' + bucketName(s.opp);
  }

  /* Convert (your, opp) → flat state index. */
  function idx(y, o) { return y * NB + o; }

  /* Compute Q*(s, a) by value iteration over V, then Q from V.
     Returns Float32Array of length N * A. */
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
    return { Q: Q, V: V };
  }

  /* Build a generic Bellman-expansion breakdown of Q*(yourB, oppB, moveId).
     Walks Battle.successors-style branches grouped by hit / miss and
     by post-hit form so the rendered table can label CHARMELEON /
     CHARIZARD counters as the opponent evolves mid-turn. */
  const DETAIL_CELL = { yourB: 0, oppB: 2, moveId: 'thunder' };

  function buildBreakdown(yourB, oppB, moveId, V) {
    const move = window.Moves.MOVE_BY_ID[moveId];
    const formBefore = window.Battle.formForOpp(oppB);
    const HIT = window.Battle.hitDamageDist(formBefore, moveId);
    const pHit = move.accuracy;
    const pMiss = 1 - pHit;

    const branches = [];
    let total = 0;

    /* Hit outcomes. */
    if (pHit > 0) {
      for (const [oppD, pO] of HIT) {
        const oppNew = Math.min(NB, oppB + oppD);
        const p = pHit * pO;
        if (oppNew >= NB) {
          const contrib = p * 10;
          branches.push({ kind: 'hit-win', oppD, p, contribution: contrib });
          total += contrib;
          continue;
        }
        const formAfter = window.Battle.formForOpp(oppNew);
        const COUNTER = window.Battle.oppDamageDist(formAfter);
        const sub = [];
        let subSum = 0;
        for (const [yD, pY] of COUNTER) {
          const yNew = Math.min(NB, yourB + yD);
          if (yNew >= NB) {
            const r = -10;
            const contrib = pY * r;
            sub.push({ kind: 'faint', yD, p: pY, branchVal: r, contribution: contrib });
            subSum += contrib;
          } else {
            const r = -1;
            const vNext = V[yNew * NB + oppNew];
            const branchVal = r + GAMMA * vNext;
            const contrib = pY * branchVal;
            sub.push({ kind: 'continue', yD, p: pY, yNext: yNew, oNext: oppNew, vNext, branchVal, contribution: contrib });
            subSum += contrib;
          }
        }
        const contrib = p * subSum;
        branches.push({ kind: 'hit-continue', oppD, oppNew, formAfter, p, sub, subSum, contribution: contrib });
        total += contrib;
      }
    }

    /* Miss branch — opp stays in formBefore, counters Pikachu. */
    if (pMiss > 0) {
      const COUNTER = window.Battle.oppDamageDist(formBefore);
      const sub = [];
      let subSum = 0;
      for (const [yD, pY] of COUNTER) {
        const yNew = Math.min(NB, yourB + yD);
        if (yNew >= NB) {
          const r = -10;
          const contrib = pY * r;
          sub.push({ kind: 'faint', yD, p: pY, branchVal: r, contribution: contrib });
          subSum += contrib;
        } else {
          const r = -1;
          const vNext = V[yNew * NB + oppB];
          const branchVal = r + GAMMA * vNext;
          const contrib = pY * branchVal;
          sub.push({ kind: 'continue', yD, p: pY, yNext: yNew, oNext: oppB, vNext, branchVal, contribution: contrib });
          subSum += contrib;
        }
      }
      const contrib = pMiss * subSum;
      branches.push({ kind: 'miss', formBefore, p: pMiss, sub, subSum, contribution: contrib });
      total += contrib;
    }

    return { branches, total, formBefore };
  }

  function fmtSigned(v, dp) {
    const d = dp === undefined ? 2 : dp;
    return (v >= 0 ? '+' : '') + v.toFixed(d);
  }

  /* Render the detail-cell calculation HTML into `host`. */
  function renderDetail(host, breakdown, cell) {
    const moveName = window.Moves.MOVE_BY_ID[cell.moveId].name;
    const stateLab = bucketName(cell.yourB) + ' / ' + bucketName(cell.oppB);
    const formName = window.Battle.FORM_DISPLAY_NAME[breakdown.formBefore];

    let html = '';
    html += '<div class="dp-panel-title">Q*(YOUR=' + bucketName(cell.yourB) +
            ', OPP=' + bucketName(cell.oppB) + ', ' + moveName + ')</div>';
    html += '<div class="dp-panel-narration">' +
              'Opponent is <b>' + formName + '</b>. ' +
              moveName + ' deals form-specific damage — and any HP-bucket cross-over ' +
              'triggers an evolution before the counter lands.' +
            '</div>';

    for (const br of breakdown.branches) {
      if (br.kind === 'hit-win') {
        html += '<div class="dp-calc-line">' +
                  '<span><span class="dp-calc-prob">P=' + br.p.toFixed(3) + '</span>' +
                  ' &middot; hit · dmg ' + br.oppD + ' → OPP FAINTS, r=+10</span>' +
                  '<span class="dp-calc-value">' + br.p.toFixed(3) + ' · 10 = ' + fmtSigned(br.contribution) + '</span>' +
                '</div>';
      } else if (br.kind === 'hit-continue') {
        const counterName = window.Battle.FORM_MOVE_NAME[br.formAfter];
        const formDisp = window.Battle.FORM_DISPLAY_NAME[br.formAfter];
        html += '<div class="dp-calc-line">' +
                  '<span><span class="dp-calc-prob">P=' + br.p.toFixed(3) + '</span>' +
                  ' &middot; hit · dmg ' + br.oppD + ' → OPP at ' + bucketName(br.oppNew) +
                  ' (<b>' + formDisp + '</b>) counters ' + counterName + ':</span>' +
                  '<span></span>' +
                '</div>';
        for (const sub of br.sub) {
          let txt, calc;
          if (sub.kind === 'faint') {
            txt = counterName + ' ' + sub.yD + ' → PIKACHU FAINTS, r=−10';
            calc = sub.p.toFixed(2) + ' · (−10) = ' + fmtSigned(sub.contribution);
          } else {
            const sNextLab = bucketName(sub.yNext) + ' / ' + bucketName(sub.oNext);
            txt = counterName + ' ' + sub.yD + ' → ' + sNextLab + ', V′=' + fmtSigned(sub.vNext) +
                  ' → −1 + ' + fmtSigned(sub.vNext) + ' = ' + fmtSigned(sub.branchVal);
            calc = sub.p.toFixed(2) + ' · ' + fmtSigned(sub.branchVal) + ' = ' + fmtSigned(sub.contribution);
          }
          html += '<div class="dp-calc-line dp-calc-sub">' +
                    '<span>&nbsp;&nbsp;&nbsp;<span class="dp-calc-prob">P=' + sub.p.toFixed(2) + '</span>' +
                    ' &middot; ' + txt + '</span>' +
                    '<span class="dp-calc-value">' + calc + '</span>' +
                  '</div>';
        }
        html += '<div class="dp-calc-line dp-calc-subtotal">' +
                  '<span>&nbsp;&nbsp;&nbsp;weighted (' + br.p.toFixed(3) + ' · ' + fmtSigned(br.subSum) + '):</span>' +
                  '<span class="dp-calc-value">' + fmtSigned(br.contribution) + '</span>' +
                '</div>';
      } else if (br.kind === 'miss') {
        const counterName = window.Battle.FORM_MOVE_NAME[br.formBefore];
        const formDisp = window.Battle.FORM_DISPLAY_NAME[br.formBefore];
        html += '<div class="dp-calc-line">' +
                  '<span><span class="dp-calc-prob">P=' + br.p.toFixed(3) + '</span>' +
                  ' &middot; MISS — opp stays at ' + bucketName(cell.oppB) +
                  ' (<b>' + formDisp + '</b>) counters ' + counterName + ':</span>' +
                  '<span></span>' +
                '</div>';
        for (const sub of br.sub) {
          let txt, calc;
          if (sub.kind === 'faint') {
            txt = counterName + ' ' + sub.yD + ' → PIKACHU FAINTS, r=−10';
            calc = sub.p.toFixed(2) + ' · (−10) = ' + fmtSigned(sub.contribution);
          } else {
            const sNextLab = bucketName(sub.yNext) + ' / ' + bucketName(sub.oNext);
            txt = counterName + ' ' + sub.yD + ' → ' + sNextLab + ', V′=' + fmtSigned(sub.vNext) +
                  ' → −1 + ' + fmtSigned(sub.vNext) + ' = ' + fmtSigned(sub.branchVal);
            calc = sub.p.toFixed(2) + ' · ' + fmtSigned(sub.branchVal) + ' = ' + fmtSigned(sub.contribution);
          }
          html += '<div class="dp-calc-line dp-calc-sub">' +
                    '<span>&nbsp;&nbsp;&nbsp;<span class="dp-calc-prob">P=' + sub.p.toFixed(2) + '</span>' +
                    ' &middot; ' + txt + '</span>' +
                    '<span class="dp-calc-value">' + calc + '</span>' +
                  '</div>';
        }
        html += '<div class="dp-calc-line dp-calc-subtotal">' +
                  '<span>&nbsp;&nbsp;&nbsp;weighted (' + br.p.toFixed(3) + ' · ' + fmtSigned(br.subSum) + '):</span>' +
                  '<span class="dp-calc-value">' + fmtSigned(br.contribution) + '</span>' +
                '</div>';
      }
    }

    html += '<div class="dp-calc-total">' +
              '<span>Q*(' + stateLab + ', ' + moveName + ')</span>' +
              '<span><b>' + fmtSigned(breakdown.total) + '</b></span>' +
            '</div>';

    host.innerHTML = html;
  }

  /* Render a non-detail narration into the panel. */
  function renderNarration(host, title, paragraphs) {
    let html = '<div class="dp-panel-title">' + title + '</div>';
    for (const p of paragraphs) {
      html += '<div class="dp-panel-narration">' + p + '</div>';
    }
    host.innerHTML = html;
  }

  window.scenes.sceneDp = function (root) {
    root.classList.add('scene-pad', 'dp-scene');
    root.innerHTML = '';

    /* Heading */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'FILLING Q WITH DYNAMIC PROGRAMMING';
    root.appendChild(heading);

    /* Premise — we wrote down P explicitly when we set the battle up
       (Battle.successors enumerates it). That's the gift that makes DP
       even possible here; next scene yanks it back. */
    const premise = document.createElement('div');
    premise.className = 'dp-premise';
    premise.innerHTML =
      '<strong>If we know P</strong> &mdash; the full transition table for ' +
      'every (s, a, s\') &mdash; <strong>we can compute Q here using dynamic programming!</strong> ' +
      'Bellman\'s equation is a recursive definition of Q*; sweep it to a fixed point ' +
      'and we have the optimal action-value for every state.';
    root.appendChild(premise);

    /* Bellman card */
    const fcard = document.createElement('div');
    fcard.className = 'dp-bellman-card';
    fcard.innerHTML = '<div class="dp-bellman-label">BELLMAN OPTIMALITY EQUATION</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; \max_{a'} Q^{\star}(S', a') \;\middle|\; S = s,\; A = a \,\right]`,
      fhost, true
    );
    root.appendChild(fcard);

    /* Controls + status */
    const ctrls = document.createElement('div');
    ctrls.className = 'dp-controls-row';
    ctrls.innerHTML =
      '<div class="dp-controls">' +
        '<button class="poke-btn" id="dp-step">▶ STEP</button>' +
        '<button class="poke-btn" id="dp-run">RUN ALL</button>' +
        '<button class="poke-btn" id="dp-reset">RESET</button>' +
      '</div>' +
      '<div class="dp-status">PHASE <b id="dp-phase">0 / 6</b> · CELLS FILLED <b id="dp-fillc">0 / 25</b></div>';
    root.appendChild(ctrls);

    /* Row: Q-table + side panel */
    const row = document.createElement('div');
    row.className = 'dp-row';
    root.appendChild(row);

    const qHost = document.createElement('div');
    qHost.className = 'dp-q';
    row.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const panel = document.createElement('div');
    panel.className = 'dp-panel poke-box tight';
    row.appendChild(panel);

    /* ---- Compute Q* once and prep the detail breakdown ---- */
    const { Q: qStar, V } = computeQstar();
    const detailBreakdown = buildBreakdown(DETAIL_CELL.yourB, DETAIL_CELL.oppB, DETAIL_CELL.moveId, V);
    const detailCellIdx = DETAIL_CELL.yourB * NB + DETAIL_CELL.oppB;

    /* ---- Phase definitions ----
       Fill order matches the new dynamics: the right two columns (Charizard
       territory) are pedagogically easiest — QUICK ATTACK super-effective,
       always wins from LOW or CRITICAL. Then the YOUR=CRITICAL losing row,
       then a detail walk-through of (FULL, MID, THUNDER) against
       CHARMELEON, then the rest of the MID column, then the Charmander
       columns where the policy is most subtle. */
    const charizardCols = [
      idx(0,3), idx(1,3), idx(2,3), idx(3,3), idx(4,3),  /* OPP=LOW  */
      idx(0,4), idx(1,4), idx(2,4), idx(3,4), idx(4,4),  /* OPP=CRIT */
    ];
    const yourCritRest  = [idx(4,0), idx(4,1), idx(4,2)]; /* (CRIT, LOW/CRIT) already in phase 1 */
    const detailCellOnly = [idx(0,2)];                     /* (FULL, MID) */
    const restOfMidCol  = [idx(1,2), idx(2,2), idx(3,2)]; /* rest of OPP=MID */
    const charmanderCols = [
      idx(0,0), idx(1,0), idx(2,0), idx(3,0),  /* OPP=FULL (excl. (CRIT,FULL)) */
      idx(0,1), idx(1,1), idx(2,1), idx(3,1),  /* OPP=HIGH (excl. (CRIT,HIGH)) */
    ];

    const PHASES = [
      {
        title: 'CHARIZARD COLUMNS — easy wins',
        narration: [
          'When opponent HP drops to LOW or CRITICAL it has evolved into <b>CHARIZARD</b> — huge frame, exposed.',
          'QUICK ATTACK is super-effective (2-3 dmg · 100% acc) — always one-shots a LOW or CRIT Charizard.',
          '<b>Q*(s, QUICK) = +10</b> for every cell in these two columns.',
        ],
        fillCells: charizardCols,
      },
      {
        title: 'YOUR=CRITICAL row — losing positions',
        narration: [
          'PIKACHU at CRITICAL means any counter-attack faints us. Most cells in this row are losing.',
          'Q tells you the expected loss — useful even when there is no winning move.',
        ],
        fillCells: yourCritRest,
      },
      {
        title: 'DETAIL — (FULL, MID, THUNDER)',
        narration: null,
        fillCells: detailCellOnly,
        detailCell: idx(0, 2),
        detailType: 'show',
      },
      {
        title: 'CHARMELEON column — THUNDER reigns',
        narration: [
          'CHARMELEON\'s hardened hide <b>resists THUNDERBOLT</b> (0-1 dmg, fizzles).',
          'THUNDER stays at 2-3 dmg → only Pikachu move with reach. Even with 55% accuracy, it dominates.',
        ],
        fillCells: restOfMidCol,
      },
      {
        title: 'CHARMANDER columns — subtle territory',
        narration: [
          'The baby form: BOLT works at normal damage; QUICK is too weak alone.',
          'But every BOLT that drops CHARMANDER into MID HP triggers evolution to CHARMELEON, who resists future BOLTs.',
          'THUNDER keeps the same 2-3 dmg through every form — sometimes worth its 55% accuracy.',
        ],
        fillCells: charmanderCols,
      },
      {
        title: 'Q* CONVERGED.',
        narration: [
          'All three Pikachu moves earn their place: QUICK against Charizard, THUNDER against Charmeleon, a mix in Charmander territory.',
          'But this required <i>P(s′ | s, a)</i> for every transition, plus one Bellman backup per cell.',
          'In real games neither is available — sample-based methods come next.',
        ],
        fillCells: [],
      },
    ];

    /* ---- Phase rendering state ---- */
    let phaseIdx = -1;
    const filledMask = new Array(N).fill(false);

    function applyPhase(p) {
      /* Update mask. */
      for (const sIdx of p.fillCells) filledMask[sIdx] = true;
      /* Build a Q array where pending cells stay at 0. */
      const QView = new Float32Array(N * A);
      for (let s = 0; s < N; s++) {
        if (!filledMask[s]) continue;
        for (let a = 0; a < A; a++) QView[s * A + a] = qStar[s * A + a];
      }
      qtbl.update(QView, { suppressFlash: true });
      /* CSS classes. */
      for (let s = 0; s < N; s++) {
        const cell = qtbl.getCellNode(s);
        if (!cell) continue;
        cell.classList.toggle('dp-pending', !filledMask[s]);
        cell.classList.remove('dp-active', 'dp-detail', 'dp-just-filled');
      }
      for (const sIdx of p.fillCells) {
        const cell = qtbl.getCellNode(sIdx);
        if (!cell) continue;
        cell.classList.add('dp-active', 'dp-just-filled');
        setTimeout(() => cell && cell.classList.remove('dp-just-filled'), 700);
      }
      if (p.detailType === 'show' && p.detailCell !== undefined) {
        const c = qtbl.getCellNode(p.detailCell);
        if (c) c.classList.add('dp-detail');
      }
      /* Side panel. */
      if (p.detailType === 'show') {
        renderDetail(panel, detailBreakdown, DETAIL_CELL);
      } else if (p.narration) {
        renderNarration(panel, p.title, p.narration);
      } else {
        renderNarration(panel, p.title, ['']);
      }
      /* Status. */
      const filledCount = filledMask.filter(Boolean).length;
      document.getElementById('dp-phase').textContent = (phaseIdx + 1) + ' / ' + PHASES.length;
      document.getElementById('dp-fillc').textContent = filledCount + ' / ' + N;
    }

    function step() {
      if (phaseIdx >= PHASES.length - 1) return;
      phaseIdx++;
      applyPhase(PHASES[phaseIdx]);
    }

    function runAll() {
      while (phaseIdx < PHASES.length - 1) {
        phaseIdx++;
        applyPhase(PHASES[phaseIdx]);
      }
    }

    function reset() {
      phaseIdx = -1;
      for (let s = 0; s < N; s++) filledMask[s] = false;
      /* Reset QTable + clear all classes. */
      qtbl.reset();
      qtbl.update(new Float32Array(N * A), { suppressFlash: true });
      for (let s = 0; s < N; s++) {
        const cell = qtbl.getCellNode(s);
        if (cell) {
          cell.classList.add('dp-pending');
          cell.classList.remove('dp-active', 'dp-detail', 'dp-just-filled');
        }
      }
      renderNarration(panel, 'READY', ['Click <b>STEP</b> to begin computing Q* one phase at a time.']);
      document.getElementById('dp-phase').textContent = '0 / ' + PHASES.length;
      document.getElementById('dp-fillc').textContent = '0 / ' + N;
    }

    document.getElementById('dp-step').addEventListener('click', step);
    document.getElementById('dp-run').addEventListener('click', runAll);
    document.getElementById('dp-reset').addEventListener('click', reset);

    /* Initial state */
    reset();

    /* &run flag: auto-fill for headless capture. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(runAll, 200);

    /* &dp=N flag: jump to phase N for headless capture. */
    const dpMatch = (window.location.hash || '').match(/[#&?]dp=(\d+)/);
    if (dpMatch) {
      const target = Math.min(PHASES.length - 1, Math.max(0, parseInt(dpMatch[1], 10) - 1));
      setTimeout(() => {
        while (phaseIdx < target) { phaseIdx++; applyPhase(PHASES[phaseIdx]); }
      }, 200);
    }

    return {
      onEnter() {
        /* Re-apply current phase so visual state is consistent if we
           re-enter the scene. */
        if (phaseIdx < 0) reset(); else applyPhase(PHASES[phaseIdx]);
      },
      /* Right arrow = advance one phase (matches the STEP button).
         Once all 6 phases are filled, right arrow yields to the
         scene engine so the student can keep pressing forward. */
      onNextKey() {
        if (phaseIdx < PHASES.length - 1) { step(); return true; }
        return false;
      },
      /* Rewinding phases would require unfilling cells — use RESET
         instead. Let left arrow advance to the previous scene. */
      onPrevKey() { return false; },
    };
  };
})();

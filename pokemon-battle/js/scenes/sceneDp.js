/* Scene — filling Q* with dynamic programming.
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

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  function bucketName(b) { return b >= NB ? T('hp.bucket.faint_short') : T('hp.bucket.' + BUCKETS[b]); }
  function stateLabel(s) {
    return bucketName(s.your) + ' / ' + bucketName(s.opp);
  }
  function moveName(id) { return T('move.' + id); }
  function oppFormName(form) { return T('pokemon.' + form); }
  function oppMoveName(form) {
    const id = (window.Battle.FORM_MOVE_NAME[form] || '').toLowerCase();
    return T('move.' + id);
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
    const mv       = moveName(cell.moveId);
    const stateLab = bucketName(cell.yourB) + ' / ' + bucketName(cell.oppB);
    const formNm   = oppFormName(breakdown.formBefore);

    let html = '';
    html += '<div class="dp-panel-title">' + T('dp.detail.title', {
              your: bucketName(cell.yourB), opp: bucketName(cell.oppB), move: mv,
            }) + '</div>';
    html += '<div class="dp-panel-narration">' +
              T('dp.detail.narration', { form: formNm, move: mv }) +
            '</div>';

    for (const br of breakdown.branches) {
      if (br.kind === 'hit-win') {
        html += '<div class="dp-calc-line">' +
                  '<span><span class="dp-calc-prob">P=' + br.p.toFixed(3) + '</span>' +
                  ' &middot; ' + T('dp.detail.hit_win', { n: br.oppD }) + '</span>' +
                  '<span class="dp-calc-value">' + br.p.toFixed(3) + ' · 10 = ' + fmtSigned(br.contribution) + '</span>' +
                '</div>';
      } else if (br.kind === 'hit-continue') {
        const counterName = oppMoveName(br.formAfter);
        const formDisp = oppFormName(br.formAfter);
        html += '<div class="dp-calc-line">' +
                  '<span><span class="dp-calc-prob">P=' + br.p.toFixed(3) + '</span>' +
                  ' &middot; ' + T('dp.detail.hit_continue', {
                    n: br.oppD, state: bucketName(br.oppNew), form: formDisp, move: counterName,
                  }) + '</span>' +
                  '<span></span>' +
                '</div>';
        for (const sub of br.sub) {
          let txt, calc;
          if (sub.kind === 'faint') {
            txt = T('dp.detail.sub_faint', { move: counterName, n: sub.yD });
            calc = sub.p.toFixed(2) + ' · (−10) = ' + fmtSigned(sub.contribution);
          } else {
            const sNextLab = bucketName(sub.yNext) + ' / ' + bucketName(sub.oNext);
            txt = T('dp.detail.sub_continue', {
              move: counterName, n: sub.yD, state: sNextLab,
              v: fmtSigned(sub.vNext), bv: fmtSigned(sub.branchVal),
            });
            calc = sub.p.toFixed(2) + ' · ' + fmtSigned(sub.branchVal) + ' = ' + fmtSigned(sub.contribution);
          }
          html += '<div class="dp-calc-line dp-calc-sub">' +
                    '<span>&nbsp;&nbsp;&nbsp;<span class="dp-calc-prob">P=' + sub.p.toFixed(2) + '</span>' +
                    ' &middot; ' + txt + '</span>' +
                    '<span class="dp-calc-value">' + calc + '</span>' +
                  '</div>';
        }
        html += '<div class="dp-calc-line dp-calc-subtotal">' +
                  '<span>&nbsp;&nbsp;&nbsp;' +
                    T('dp.detail.weighted', { p: br.p.toFixed(3), sum: fmtSigned(br.subSum) }) +
                  '</span>' +
                  '<span class="dp-calc-value">' + fmtSigned(br.contribution) + '</span>' +
                '</div>';
      } else if (br.kind === 'miss') {
        const counterName = oppMoveName(br.formBefore);
        const formDisp = oppFormName(br.formBefore);
        html += '<div class="dp-calc-line">' +
                  '<span><span class="dp-calc-prob">P=' + br.p.toFixed(3) + '</span>' +
                  ' &middot; ' + T('dp.detail.miss', {
                    state: bucketName(cell.oppB), form: formDisp, move: counterName,
                  }) + '</span>' +
                  '<span></span>' +
                '</div>';
        for (const sub of br.sub) {
          let txt, calc;
          if (sub.kind === 'faint') {
            txt = T('dp.detail.sub_faint', { move: counterName, n: sub.yD });
            calc = sub.p.toFixed(2) + ' · (−10) = ' + fmtSigned(sub.contribution);
          } else {
            const sNextLab = bucketName(sub.yNext) + ' / ' + bucketName(sub.oNext);
            txt = T('dp.detail.sub_continue', {
              move: counterName, n: sub.yD, state: sNextLab,
              v: fmtSigned(sub.vNext), bv: fmtSigned(sub.branchVal),
            });
            calc = sub.p.toFixed(2) + ' · ' + fmtSigned(sub.branchVal) + ' = ' + fmtSigned(sub.contribution);
          }
          html += '<div class="dp-calc-line dp-calc-sub">' +
                    '<span>&nbsp;&nbsp;&nbsp;<span class="dp-calc-prob">P=' + sub.p.toFixed(2) + '</span>' +
                    ' &middot; ' + txt + '</span>' +
                    '<span class="dp-calc-value">' + calc + '</span>' +
                  '</div>';
        }
        html += '<div class="dp-calc-line dp-calc-subtotal">' +
                  '<span>&nbsp;&nbsp;&nbsp;' +
                    T('dp.detail.weighted', { p: br.p.toFixed(3), sum: fmtSigned(br.subSum) }) +
                  '</span>' +
                  '<span class="dp-calc-value">' + fmtSigned(br.contribution) + '</span>' +
                '</div>';
      }
    }

    html += '<div class="dp-calc-total">' +
              '<span>' + T('dp.detail.q_total', { state: stateLab, move: mv }) + '</span>' +
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
    heading.textContent = T('dp.heading');
    root.appendChild(heading);

    /* Premise — we wrote down P explicitly when we set the battle up
       (Battle.successors enumerates it). That's the gift that makes DP
       even possible here; next scene yanks it back. */
    const premise = document.createElement('div');
    premise.className = 'dp-premise';
    premise.innerHTML = T('dp.premise');
    root.appendChild(premise);

    /* Bellman card */
    const fcard = document.createElement('div');
    fcard.className = 'dp-bellman-card';
    fcard.innerHTML = '<div class="dp-bellman-label">' + T('dp.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; \max_{a'} Q^{\star}(S', a') \,\right]`,
      fhost, true
    );
    root.appendChild(fcard);

    /* Controls + status */
    const ctrls = document.createElement('div');
    ctrls.className = 'dp-controls-row';
    ctrls.innerHTML =
      '<div class="dp-controls">' +
        '<button class="poke-btn" id="dp-step">'  + T('dp.btn.step')  + '</button>' +
        '<button class="poke-btn" id="dp-run">'   + T('dp.btn.run')   + '</button>' +
        '<button class="poke-btn" id="dp-reset">' + T('dp.btn.reset') + '</button>' +
      '</div>' +
      '<div class="dp-status">' + T('dp.status.phase') + ' <b id="dp-phase">0 / 6</b> · ' +
        T('dp.status.cells') + ' <b id="dp-fillc">0 / 25</b></div>';
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

    /* Phase content keys live in i18n.js (dp.phase.<id>.*) so a
       language toggle re-paints the side panel without altering this
       structural list. */
    const PHASES = [
      { titleKey: 'dp.phase.charizard.title',
        narrationKeys: ['dp.phase.charizard.n1', 'dp.phase.charizard.n2', 'dp.phase.charizard.n3'],
        fillCells: charizardCols },
      { titleKey: 'dp.phase.crit.title',
        narrationKeys: ['dp.phase.crit.n1', 'dp.phase.crit.n2'],
        fillCells: yourCritRest },
      { titleKey: 'dp.phase.detail.title',
        narrationKeys: null,
        fillCells: detailCellOnly,
        detailCell: idx(0, 2),
        detailType: 'show' },
      { titleKey: 'dp.phase.charmeleon.title',
        narrationKeys: ['dp.phase.charmeleon.n1', 'dp.phase.charmeleon.n2'],
        fillCells: restOfMidCol },
      { titleKey: 'dp.phase.charmander.title',
        narrationKeys: ['dp.phase.charmander.n1', 'dp.phase.charmander.n2', 'dp.phase.charmander.n3'],
        fillCells: charmanderCols },
      { titleKey: 'dp.phase.done.title',
        narrationKeys: ['dp.phase.done.n1', 'dp.phase.done.n2', 'dp.phase.done.n3'],
        fillCells: [] },
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
      } else if (p.narrationKeys) {
        renderNarration(panel, T(p.titleKey), p.narrationKeys.map(k => T(k)));
      } else {
        renderNarration(panel, T(p.titleKey), ['']);
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
      renderNarration(panel, T('dp.ready.title'), [T('dp.ready.body')]);
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

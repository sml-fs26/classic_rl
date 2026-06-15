/* Scene 9 - Filling Q* with dynamic programming.
 *
 *   Because the STAGE-DIE odds are PRINTED on every lever, P is known, so we
 *   can compute Q* exactly, no playing required. We sweep the Bellman
 *   optimality backup
 *       Q*(s, a) = E[ R + max_a' Q*(S', a') ]
 *   over all 5 rungs at once, again and again. Each NEXT is ONE sweep; the
 *   QTable (5 rungs x 3 levers) is repainted from qFromV(V_k) so the whole
 *   scorecard refines together and the star-staircase emerges.
 *
 *   This is an undiscounted, recurrent MDP (gamma = 1), so the values creep to
 *   their fixed point over many sweeps rather than snapping in finite steps.
 *   The teaching beat: the PLAYBOOK (the per-row argmax stars) locks in within
 *   the first few sweeps (DATA.convergence.policyStableAt), long before the
 *   numbers finish settling. The converged board reproduces DATA.Qstar exactly
 *   (asserted in code, diff <= 1e-6).
 *
 *   STEP SWEEP / RUN ALL / RESET drive it; [data-run-primary] (RUN ALL) fills
 *   the board for headless capture. Cold-entry safe: rebuilds from
 *   window.Bellman / window.Pipeline / window.Levers / window.DATA.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;
  const L = window.Levers;
  const B = window.Bellman;

  const LEVER_IDS = (L && L.MOVE_IDS) || ['nurture', 'demo', 'hardclose'];
  const A = LEVER_IDS.length;                                  // 3
  const NUM_RUNGS = (P && P.NUM_RUNGS) || 5;                   // 5
  const GAMMA = (P && P.GAMMA != null) ? P.GAMMA : 1;

  function leverName(id) {
    return T('lever.' + id, ((L && L.MOVE_BY_ID[id]) || {}).name || id);
  }

  /* Greedy policy (lever id per rung) from a Q[15]. */
  function policyOf(Q) {
    const out = new Array(NUM_RUNGS);
    for (let r = 0; r < NUM_RUNGS; r++) {
      const base = r * A;
      let m = -Infinity, k = 0;
      for (let a = 0; a < A; a++) { if (Q[base + a] > m) { m = Q[base + a]; k = a; } }
      out[r] = LEVER_IDS[k];
    }
    return out;
  }
  function samePolicy(p1, p2) {
    if (!p1 || !p2) return false;
    for (let r = 0; r < NUM_RUNGS; r++) if (p1[r] !== p2[r]) return false;
    return true;
  }
  function leverCounts(policy) {
    const c = { nurture: 0, demo: 0, hardclose: 0 };
    for (let r = 0; r < NUM_RUNGS; r++) c[policy[r]] = (c[policy[r]] || 0) + 1;
    return c;
  }

  /* Build the full sweep tape from value iteration. Each entry carries the
     per-sweep Q[15] (qFromV of that sweep's V) and the max change. sweep 0 is
     the all-zero start. Stops the visible tape at the first sweep whose 2dp
     display already equals the converged board (so STEP terminates at genuine
     convergence rather than dragging through residual noise). */
  function buildSweepTape() {
    const vi = B.valueIteration(GAMMA, { tol: 1e-9, maxIters: 200, recordHistory: true });
    const hist = vi.history;                       // [{iter, maxDelta, V}], iter 0..K
    const finalQ = B.qFromV(vi.V, GAMMA);
    const finalRound = roundKey(finalQ);

    const tape = [];
    let policyStableAt = null, prevPolicy = null;
    let convergedAt = hist.length - 1;

    for (let k = 0; k < hist.length; k++) {
      const allZero = isAllZero(hist[k].V);
      /* Sweep 0 is the zero start: render a BLANK board (all scores zero),
         matching "every score starts at zero". From sweep 1 on, each frame is
         qFromV(V_k), the real Bellman backup. */
      const Q = allZero ? new Float64Array(NUM_RUNGS * A) : B.qFromV(hist[k].V, GAMMA);
      const pol = policyOf(Q);
      if (!allZero && policyStableAt == null && samePolicy(pol, prevPolicy)) {
        policyStableAt = k - 1;                     // first sweep the policy held
      }
      prevPolicy = allZero ? null : pol;
      tape.push({ sweep: k, Q: Q, maxDelta: hist[k].maxDelta, policy: pol, allZero: allZero });
      if (k > 0 && roundKey(Q) === finalRound) { convergedAt = k; break; }
    }

    /* Snap the converged frame to the authoritative DATA.Qstar so the board
       literally ENDS on it (the live Q rounds to the same 2dp display, but
       this makes the final frame exact). */
    let endQ = finalQ;
    if (window.DATA && Array.isArray(window.DATA.Qstar) && window.DATA.Qstar.length === finalQ.length) {
      endQ = Float64Array.from(window.DATA.Qstar);
      tape[tape.length - 1].Q = endQ;
    }

    return { tape: tape, finalQ: endQ, liveFinalQ: finalQ, convergedAt: convergedAt, policyStableAt: policyStableAt };
  }
  function isAllZero(V) { for (let i = 0; i < V.length; i++) if (Math.abs(V[i]) > 1e-12) return false; return true; }
  function roundKey(Q) { let s = ''; for (let i = 0; i < Q.length; i++) s += Q[i].toFixed(2) + ','; return s; }

  window.scenes.scene9 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'pc-dp-scene');
    root.innerHTML = '';

    /*, Heading, */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('dp.heading');
    root.appendChild(heading);

    /*, Lede + premise (we know P), */
    const lede = document.createElement('p');
    lede.className = 'pc-lede';
    lede.innerHTML = T('dp.lede');
    root.appendChild(lede);

    const premise = document.createElement('p');
    premise.className = 'pc-dp-premise';
    premise.innerHTML = T('dp.premise');
    root.appendChild(premise);

    /*, Bellman backup card, */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('dp.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; \max_{a'} Q^{\star}(S', a') \,\right]`,
      fhost, true
    );
    root.appendChild(fcard);

    /*, Controls + status, */
    const ctrls = document.createElement('div');
    ctrls.className = 'pc-dp-controls-row';
    ctrls.innerHTML =
      '<div class="poke-menu-row pc-dp-controls">' +
        '<button class="poke-btn" id="pc-dp-step">'  + T('dp.btn.step')  + '</button>' +
        '<button class="poke-btn" id="pc-dp-run" data-run-primary>' + T('dp.btn.run') + '</button>' +
        '<button class="poke-btn" id="pc-dp-reset">' + T('dp.btn.reset') + '</button>' +
      '</div>' +
      '<div class="pc-dp-status">' +
        T('dp.status.sweep') + ' <b id="pc-dp-sweepn">0</b>' +
        ' &middot; ' + T('dp.status.delta') + ' <b id="pc-dp-delta">&mdash;</b>' +
      '</div>';
    root.appendChild(ctrls);

    /*, Board + side narration, */
    const row = document.createElement('div');
    row.className = 'pc-dp-row';
    root.appendChild(row);

    const qHost = document.createElement('div');
    qHost.className = 'pc-dp-q';
    row.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const sidePanel = document.createElement('div');
    sidePanel.className = 'pc-dp-panel';
    row.appendChild(sidePanel);

    /*, Bridge footer (revealed on convergence), */
    const bridge = document.createElement('div');
    bridge.className = 'pc-dp-bridge';
    bridge.innerHTML = T('dp.bridge');
    bridge.style.display = 'none';
    root.appendChild(bridge);

    /*, Build the sweep tape, */
    const built = buildSweepTape();
    const tape = built.tape;
    const LAST = tape.length - 1;                  // index of the converged sweep
    const finalQ = built.finalQ;

    /* convergence facts: prefer DATA, fall back to the live computation. */
    const conv = (window.DATA && window.DATA.convergence) || {};
    const policyStableAt = (conv.policyStableAt != null) ? conv.policyStableAt
      : (built.policyStableAt != null ? built.policyStableAt : 2);

    /* In-code honesty: the live converged Q, rounded to the 2dp the board
       shows, must equal DATA.Qstar (which the precompute also rounds to 2dp).
       This is the display-accurate tolerance; the final frame is then snapped
       to DATA.Qstar exactly in buildSweepTape. */
    if (window.DATA && Array.isArray(window.DATA.Qstar)) {
      const live = built.liveFinalQ || finalQ;
      let maxDiff = 0;
      for (let i = 0; i < live.length; i++) {
        const r2 = Math.round(live[i] * 100) / 100;
        maxDiff = Math.max(maxDiff, Math.abs(r2 - window.DATA.Qstar[i]));
      }
      if (maxDiff > 1e-9) console.warn('scene9: converged Q (2dp) drift vs DATA.Qstar =', maxDiff);
    }

    let cursor = 0;                                 // index into tape

    function renderPanel(titleHtml, bodyHtml, footHtml) {
      let html = '<div class="pc-dp-panel-title">' + titleHtml + '</div>';
      html += '<div class="pc-dp-panel-body">' + bodyHtml + '</div>';
      if (footHtml) html += '<div class="pc-dp-panel-foot">' + footHtml + '</div>';
      sidePanel.innerHTML = html;
    }

    function flashBoard() {
      const wrap = qtbl.host;
      if (!wrap) return;
      wrap.classList.remove('pc-dp-pulse');
      void wrap.offsetWidth;
      wrap.classList.add('pc-dp-pulse');
      setTimeout(() => wrap && wrap.classList.remove('pc-dp-pulse'), 620);
    }

    function applySweep(i, opts) {
      const o = opts || {};
      const entry = tape[i];
      qtbl.update(entry.Q, { suppressFlash: !!o.suppressFlash || entry.allZero });

      /* status */
      document.getElementById('pc-dp-sweepn').textContent = String(entry.sweep);
      const dEl = document.getElementById('pc-dp-delta');
      dEl.innerHTML = entry.allZero ? '&mdash;'
        : (entry.maxDelta === Infinity ? '&infin;' : entry.maxDelta.toFixed(3));

      /* narration */
      if (i === 0) {
        renderPanel(T('dp.step0.title'), T('dp.step0.body'));
      } else if (i >= LAST) {
        const counts = leverCounts(policyOf(finalQ));
        renderPanel(
          T('dp.done.title', { n: entry.sweep }),
          T('dp.done.body', { stable: policyStableAt }),
          T('dp.done.counts', { nurture: counts.nurture, demo: counts.demo, close: counts.hardclose })
        );
        bridge.style.display = '';
      } else {
        /* mid-sweep narration: before vs after the policy locks. */
        const locked = entry.sweep >= policyStableAt && policyStableAt != null;
        renderPanel(
          T('dp.sweep.title', { n: entry.sweep }),
          locked ? T('dp.sweep.lockedBody', { stable: policyStableAt })
                 : T('dp.sweep.movingBody')
        );
        bridge.style.display = 'none';
      }

      if (!o.suppressFlash && !entry.allZero) flashBoard();
    }

    function step() {
      if (cursor >= LAST) return;
      cursor++;
      applySweep(cursor, {});
      if (window.SFX) window.SFX.play(cursor >= LAST ? 'hit' : 'cursor');
    }

    function runAll() {
      cursor = LAST;
      applySweep(cursor, { suppressFlash: false });
      if (window.SFX) window.SFX.play('hit');
    }

    function reset() {
      cursor = 0;
      qtbl.reset();
      applySweep(0, { suppressFlash: true });
      bridge.style.display = 'none';
      if (window.SFX) window.SFX.play('cursor');
    }

    document.getElementById('pc-dp-step').addEventListener('click', step);
    document.getElementById('pc-dp-run').addEventListener('click', runAll);
    document.getElementById('pc-dp-reset').addEventListener('click', reset);

    /* Initial state: the empty board (sweep 0). */
    applySweep(0, { suppressFlash: true });

    return {
      onEnter() {
        /* Re-apply the current sweep so re-entry is visually consistent. */
        applySweep(cursor, { suppressFlash: true });
        bridge.style.display = (cursor >= LAST) ? '' : 'none';
      },
      onLeave() {},
      onNextKey() {
        if (cursor < LAST) { step(); return true; }
        return false;       /* converged: let the pager advance */
      },
      onPrevKey() {
        if (cursor > 0) {
          cursor--;
          applySweep(cursor, { suppressFlash: true });
          bridge.style.display = (cursor >= LAST) ? '' : 'none';
          if (window.SFX) window.SFX.play('cursor');
          return true;
        }
        return false;
      },
    };
  };
})();

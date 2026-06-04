/* Scene 7 - Q*, the lever scorecard.
 *
 *   Average the return distribution (scene 6) away and you get ONE honest
 *   number per lever in each situation: Q*(s, a), the long-run value of
 *   pulling lever a at rung s, then playing the optimal lever forever after.
 *   The best lever in a row is the one with the highest Q* -- the per-row
 *   argmax star -- and that is the greedy playbook.
 *
 *   The core reveal: the STAR WALKS UP THE LADDER. We reveal the 5 rungs x 3
 *   levers Q-table (window.QTable) one rung at a time, COLD -> READY, with a
 *   LadderCard beside it lit to the rung just filled, and a read-out that
 *   names the winner. The same HARD CLOSE that is the lone negative at COLD
 *   (-3.28) is the +29 winner at READY: same lever, different situation.
 *
 *   Every value is read from window.DATA.Qstar (indexed rung*3 + leverIdx),
 *   never hand-typed; an in-code assertion ties it to Bellman value iteration.
 *
 *   Reveal pacing: NEXT fills the next rung (consumes the key) until the board
 *   is full, then yields to the pager. [data-run-primary] fills the whole
 *   board for headless capture. Cold-entry safe: rebuilds from window.DATA /
 *   window.Pipeline / window.Levers.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;
  const L = window.Levers;

  const LEVER_IDS = (L && L.MOVE_IDS) || ['nurture', 'demo', 'hardclose'];
  const A = LEVER_IDS.length;                                  // 3
  const NUM_RUNGS = (P && P.NUM_RUNGS) || 5;                   // 5

  function rungName(r) {
    const keys = ['rung.cold', 'rung.curious', 'rung.engaged', 'rung.evaluating', 'rung.ready'];
    return T(keys[r], (P && P.RUNG_DISPLAY[r]) || String(r));
  }
  function leverName(id) {
    return T('lever.' + id, ((L && L.MOVE_BY_ID[id]) || {}).name || id);
  }

  /* The converged Q*[15], read from DATA (authoritative) with a live
     value-iteration fallback for a cold deep-link where DATA is missing. */
  function getQstar() {
    if (window.DATA && Array.isArray(window.DATA.Qstar) && window.DATA.Qstar.length === NUM_RUNGS * A) {
      return Float64Array.from(window.DATA.Qstar);
    }
    try {
      const vi = window.Bellman.valueIteration(1, { tol: 1e-10, maxIters: 400 });
      return window.Bellman.qFromV(vi.V, 1);
    } catch (e) { return new Float64Array(NUM_RUNGS * A); }
  }

  /* argmax lever index for a rung's Q* row. */
  function argmaxIdx(Q, rung) {
    const base = rung * A;
    let m = -Infinity, k = 0;
    for (let a = 0; a < A; a++) { if (Q[base + a] > m) { m = Q[base + a]; k = a; } }
    return k;
  }

  window.scenes.scene7 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'pc-qstar-scene');
    root.innerHTML = '';

    const Qstar = getQstar();

    /* ---- Heading + lede ---- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('qstar.heading');
    root.appendChild(heading);

    const lede = document.createElement('p');
    lede.className = 'pc-lede';
    lede.innerHTML = T('qstar.lede');
    root.appendChild(lede);

    /* ---- Q* formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('qstar.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \max\; \mathbb{E}\!\left[\, G_i(\tau) \mid s,\, a \,\right]`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = T('qstar.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Reveal panel: ladder icon | the scorecard ---- */
    const panel = document.createElement('div');
    panel.className = 'pc-qstar-panel';

    const iconCol = document.createElement('div');
    iconCol.className = 'pc-qstar-icon-col';
    iconCol.innerHTML = '<div class="pc-qstar-icon-label">' + T('qstar.icon.label') + '</div>';
    const iconHost = document.createElement('div');
    iconHost.className = 'pc-qstar-icon-host';
    iconCol.appendChild(iconHost);
    const iconCaption = document.createElement('div');
    iconCaption.className = 'pc-qstar-icon-caption';
    iconCol.appendChild(iconCaption);
    panel.appendChild(iconCol);
    const ladder = window.LadderCard.mount(iconHost, { size: 'lg', rung: 0 });

    const tableCol = document.createElement('div');
    tableCol.className = 'pc-qstar-table-col';
    const tableLabel = document.createElement('div');
    tableLabel.className = 'pc-qstar-table-label';
    tableLabel.textContent = T('qstar.table.label');
    tableCol.appendChild(tableLabel);
    const qHost = document.createElement('div');
    qHost.className = 'pc-qstar-q';
    tableCol.appendChild(qHost);
    panel.appendChild(tableCol);
    root.appendChild(panel);

    const qtbl = window.QTable.mount(qHost);

    /* ---- Read-out (names the winner of the rung just filled) ---- */
    const readEl = document.createElement('p');
    readEl.className = 'pc-qstar-read';
    root.appendChild(readEl);

    /* ---- Step hint ---- */
    const hint = document.createElement('div');
    hint.className = 'pc-qstar-hint';
    const hintText = document.createElement('span');
    hintText.className = 'pc-qstar-hint-text';
    hint.appendChild(hintText);
    root.appendChild(hint);

    /* ---- The "star walks up" punchline (revealed at the end) ---- */
    const note = document.createElement('p');
    note.className = 'pc-qstar-note';
    note.innerHTML = T('qstar.note');
    note.style.display = 'none';
    root.appendChild(note);

    /* In-code honesty: the board we reveal must equal Bellman's Q*, compared
       at the 2dp the QTable shows (DATA.Qstar is the precompute rounded to
       2dp; the live fixed point matches it to that precision). */
    try {
      const vi = window.Bellman.valueIteration(1, { tol: 0, maxIters: 400 });
      const Qcheck = window.Bellman.qFromV(vi.V, 1);
      let maxDiff = 0;
      for (let i = 0; i < Qcheck.length; i++) {
        const r2 = Math.round(Qcheck[i] * 100) / 100;
        maxDiff = Math.max(maxDiff, Math.abs(r2 - Qstar[i]));
      }
      if (maxDiff > 1e-9) console.warn('scene7: DATA.Qstar drift vs Bellman (2dp) =', maxDiff);
    } catch (e) { /* cold-entry: skip the assertion */ }

    /* Reveal one rung at a time, bottom (COLD) to top (READY), so the argmax
       star is seen to walk up the ladder. revealCount = how many rungs (from
       COLD up) currently carry values. */
    const REVEAL_ORDER = [];                 // rung indices, COLD..READY
    for (let r = 0; r < NUM_RUNGS; r++) REVEAL_ORDER.push(r);
    const TOTAL = REVEAL_ORDER.length;       // 5
    let revealCount = 0;

    /* Read-out keys, one per rung (COLD..READY). */
    const READ_KEYS = [
      'qstar.read.cold', 'qstar.read.curious', 'qstar.read.engaged',
      'qstar.read.evaluating', 'qstar.read.ready',
    ];

    /* Build a Q view that only carries values for the rungs revealed so far;
       the rest stay 0 so the QTable draws them blank. */
    function partialQ(count) {
      const Q = new Float64Array(NUM_RUNGS * A);
      for (let i = 0; i < count; i++) {
        const r = REVEAL_ORDER[i];
        for (let a = 0; a < A; a++) Q[r * A + a] = Qstar[r * A + a];
      }
      return Q;
    }

    function paintPending(count) {
      const revealed = new Set();
      for (let i = 0; i < count; i++) revealed.add(REVEAL_ORDER[i]);
      for (let r = 0; r < NUM_RUNGS; r++) {
        const lab = qtbl.getCellNode(r);     // row-label node
        const on = revealed.has(r);
        if (lab) lab.classList.toggle('pc-pending', !on);
        for (let a = 0; a < A; a++) {
          const cell = qtbl.cells[r * A + a];
          if (cell) cell.classList.toggle('pc-pending', !on);
        }
      }
    }

    function flashRow(rung) {
      for (let a = 0; a < A; a++) {
        const cell = qtbl.cells[rung * A + a];
        if (!cell) continue;
        cell.classList.remove('pc-just-filled');
        void cell.offsetWidth;
        cell.classList.add('pc-just-filled');
        setTimeout(() => cell && cell.classList.remove('pc-just-filled'), 720);
      }
    }

    function render(opts) {
      const o = opts || {};
      qtbl.update(partialQ(revealCount), { suppressFlash: true });
      paintPending(revealCount);

      const done = revealCount >= TOTAL;
      const lastRung = revealCount > 0 ? REVEAL_ORDER[revealCount - 1] : -1;

      /* Light the ladder card to the rung just revealed (or COLD before any). */
      ladder.set(lastRung >= 0 ? lastRung : 0);

      if (lastRung >= 0) {
        const k = argmaxIdx(Qstar, lastRung);
        const best = LEVER_IDS[k];
        iconCaption.innerHTML = T('qstar.icon.caption', {
          rung: rungName(lastRung), lever: leverName(best),
        });
        readEl.innerHTML = T(READ_KEYS[lastRung]);
        if (o.flash) flashRow(lastRung);
      } else {
        iconCaption.innerHTML = T('qstar.icon.start');
        readEl.innerHTML = T('qstar.read.start');
      }

      hintText.textContent = done ? T('qstar.hint.done') : T('qstar.hint.more', { n: revealCount, total: TOTAL });
      note.style.display = done ? '' : 'none';
    }

    function revealNext() {
      if (revealCount >= TOTAL) return false;
      revealCount++;
      render({ flash: true });
      if (window.SFX) window.SFX.play(revealCount >= TOTAL ? 'hit' : 'cursor');
      return true;
    }

    function revealAll() {
      while (revealCount < TOTAL) revealCount++;
      render({ flash: false });
      if (window.SFX) window.SFX.play('hit');
    }

    /* Reveal button doubles as the [data-run-primary] target so &run can fill
       the whole board headlessly. */
    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'poke-btn pc-qstar-fill';
    runBtn.setAttribute('data-run-primary', '');
    runBtn.textContent = T('qstar.btn.fill');
    runBtn.addEventListener('click', () => { revealAll(); });
    hint.appendChild(runBtn);

    render({ flash: false });

    /* &run fills the board for headless capture by clicking [data-run-primary]
       (main.js drives that); no scene-level autorun needed here. */

    return {
      onEnter() { render({ flash: false }); },
      onLeave() {},
      onNextKey() {
        if (revealCount < TOTAL) { revealNext(); return true; }
        return false;       /* board full: let the pager advance */
      },
      onPrevKey() {
        if (revealCount > 0) {
          revealCount--;
          render({ flash: false });
          if (window.SFX) window.SFX.play('cursor');
          return true;
        }
        return false;
      },
    };
  };
})();

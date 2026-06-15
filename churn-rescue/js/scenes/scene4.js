/* Scene 4: "Policy: your playbook"
 *
 *   A policy pi : S -> A is a complete playbook: it names ONE lever for
 *   every cell of the 5x5 board. The learner meets two hand-built blanket
 *   playbooks from the proposal and can also click any cell to author their
 *   own, watching the honest payoff respond:
 *
 *     NEVER DISCOUNT   every cell = DO NOTHING (protect margin)
 *     PANIC OFFER      BIG OFFER the moment they cool (tiers cliff..lukewarm),
 *                      DO NOTHING on healthy + thriving
 *
 *   For the selected playbook we evaluate, by EXACT backward DP over the
 *   acyclic-in-months MDP (using window.Churn.successors, the engine), the
 *   expected return and the renewal probability from the scene-2 start
 *   (lukewarm, 4 months). Both blanket SOPs lose money: the punchline is
 *   that a flat rule is beatable, and the goal of the rest of the deck is to
 *   beat it. The OPTIMAL answer is NOT shown here (it is revealed in the Q*
 *   / DP scenes) so the learner attempts first.
 *
 *   Callback: "when you played in scene 2, you WERE a policy; you just
 *   hadn't written it down."
 *
 *   The policy grid is a bespoke, read/write coloured board (NOT the
 *   QTable retention-map widget, which would surface Q-values + the optimal
 *   argmax). Every number on screen is computed from the engine, never
 *   hand-typed.
 *
 *   Allowed globals: window.Churn, window.Levers, window.DATA, AccountCard,
 *   window.I18N, window.SFX, katex. No fetch / no <style> inject.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad', 'scene4-scene');
    root.innerHTML = '';

    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    const Churn = window.Churn;
    const Levers = window.Levers;
    const LEVER_IDS = Levers.LEVER_IDS;            // ['nothing','checkin','offer']
    const NUM_TIERS = Churn.NUM_TIERS;             // 5
    const NUM_MONTHS = Churn.NUM_MONTHS;           // 5
    const N = NUM_TIERS * NUM_MONTHS;              // 25

    const START = Churn.initialState();            // { tier:2, m:4 }
    const START_IDX = Churn.stateIndex(START);     // 13

    /*, The hand-built playbooks (full-board pi : S -> A) ----------
       Defined as functions of the state so they are unambiguous and not a
       hand-typed 25-array of answers. */
    function presetNever(s) { return 'nothing'; }
    function presetPanic(s) { return s.tier <= 2 ? 'offer' : 'nothing'; }   // below healthy
    const PRESETS = {
      never: presetNever,
      panic: presetPanic,
    };

    /* The live policy as a 25-array of leverIds, indexed by stateIndex. */
    let policy = new Array(N);
    let activePreset = 'never';
    function loadPreset(name) {
      const fn = PRESETS[name] || presetNever;
      for (let i = 0; i < N; i++) policy[i] = fn(Churn.stateFromIndex(i));
      activePreset = name;
    }
    loadPreset('never');

    /*, EXACT policy evaluation (engine-derived) ----------
       V^pi(s) and the eventual-renewal probability R^pi(s), by one backward
       pass in ascending m (the MDP is acyclic in months). Mirrors
       bellman.js's backup but with the action FIXED to the policy. */
    function evaluate(pol) {
      const V = new Float64Array(N);
      const Rp = new Float64Array(N);
      for (let m = 1; m <= NUM_MONTHS; m++) {
        for (let t = 0; t < NUM_TIERS; t++) {
          const si = t * NUM_MONTHS + (m - 1);
          const s = Churn.stateFromIndex(si);
          const succ = Churn.successors(s, pol[si]);
          let v = 0, rp = 0;
          for (const { sNext, p, reward } of succ) {
            let vN = 0, rN = 0;
            if (sNext.terminal) { rN = sNext.renewed ? 1 : 0; }
            else { const j = Churn.stateIndex(sNext); vN = V[j]; rN = Rp[j]; }
            v += p * (reward + vN);
            rp += p * rN;
          }
          V[si] = v; Rp[si] = rp;
        }
      }
      return { V, Rp };
    }

    /*, Scaffold, */
    const wrap = document.createElement('div');
    wrap.className = 's4-wrap';
    root.appendChild(wrap);

    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle s4-heading';
    heading.textContent = T('scene4.heading');
    wrap.appendChild(heading);

    /* The pi : S -> A definition line. */
    const defLine = document.createElement('div');
    defLine.className = 's4-defline';
    const defFormula = document.createElement('span');
    defFormula.className = 's4-def-formula';
    try {
      katex.render(window.DATA && window.DATA.tex && window.DATA.tex.policy
        ? window.DATA.tex.policy : '\\pi : S \\to A',
        defFormula, { throwOnError: false, displayMode: false });
    } catch (e) { defFormula.textContent = 'pi : S -> A'; }
    const defText = document.createElement('span');
    defText.className = 's4-def-text';
    defText.textContent = T('scene4.def_text');
    defLine.appendChild(defFormula);
    defLine.appendChild(defText);
    wrap.appendChild(defLine);

    const row = document.createElement('div');
    row.className = 's4-row';
    wrap.appendChild(row);

    /*, LEFT: the playbook board, */
    const left = document.createElement('div');
    left.className = 's4-left';
    row.appendChild(left);

    /* Preset toggle (the two named blanket SOPs). */
    const presetBar = document.createElement('div');
    presetBar.className = 's4-presets';
    const presetBtns = {};
    for (const name of ['never', 'panic']) {
      const b = document.createElement('button');
      b.className = 's4-preset poke-btn';
      b.type = 'button';
      b.dataset.preset = name;
      b.textContent = T('scene4.preset.' + name);
      presetBar.appendChild(b);
      presetBtns[name] = b;
    }
    left.appendChild(presetBar);

    /* Column header (months). */
    const board = document.createElement('div');
    board.className = 's4-board';
    left.appendChild(board);

    const colHeads = document.createElement('div');
    colHeads.className = 's4-colheads';
    colHeads.style.setProperty('--nm', String(NUM_MONTHS));
    let chHtml = '<div class="s4-corner">' + T('retmap.corner') + '</div>';
    for (let m = 1; m <= NUM_MONTHS; m++) {
      const imm = m === 1 ? ' s4-col-imminent' : '';
      const run = m === NUM_MONTHS ? ' s4-col-runway' : '';
      chHtml += '<div class="s4-colhead' + imm + run + '">' + T('months.short', { n: m }) + '</div>';
    }
    colHeads.innerHTML = chHtml;
    board.appendChild(colHeads);

    const grid = document.createElement('div');
    grid.className = 's4-grid';
    grid.style.setProperty('--nm', String(NUM_MONTHS));
    grid.style.setProperty('--nt', String(NUM_TIERS));
    board.appendChild(grid);

    /* Row labels (tiers, thriving at top). */
    for (let t = NUM_TIERS - 1; t >= 0; t--) {
      const lab = document.createElement('div');
      lab.className = 's4-rowhead tier' + t;
      lab.textContent = T('tier.short.' + Churn.TIERS[t]);
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(NUM_TIERS - t);
      grid.appendChild(lab);
    }

    /* One read/write cell per state: a mini account card + a lever chip. */
    const cellNodes = new Array(N);
    for (let i = 0; i < N; i++) {
      const s = Churn.stateFromIndex(i);
      const cell = document.createElement('div');
      cell.className = 's4-cell clickable';
      cell.style.gridColumn = String(s.m + 1);
      cell.style.gridRow = String(NUM_TIERS - s.tier);
      cell.dataset.state = String(i);

      const cardHost = document.createElement('div');
      cardHost.className = 's4-cell-card';
      window.AccountCard.mount(cardHost, { tier: s.tier, m: s.m, size: 'mini' });
      cell.appendChild(cardHost);

      const chip = document.createElement('div');
      chip.className = 's4-chip';
      chip.innerHTML =
        '<span class="s4-chip-glyph"></span>' +
        '<span class="s4-chip-label"></span>';
      cell.appendChild(chip);

      cell.addEventListener('click', () => cycleCell(i));
      grid.appendChild(cell);
      cellNodes[i] = { cell, chip, glyph: chip.querySelector('.s4-chip-glyph'), label: chip.querySelector('.s4-chip-label') };
    }

    /* Click a cell -> cycle its lever (nothing -> checkin -> offer -> ...).
       Hand-authoring the playbook makes pi : S -> A tactile. */
    function cycleCell(i) {
      const cur = LEVER_IDS.indexOf(policy[i]);
      policy[i] = LEVER_IDS[(cur + 1) % LEVER_IDS.length];
      activePreset = null;            // no longer a named preset
      if (window.SFX) window.SFX.play('cursor');
      paintCell(i, true);
      paintOutcome();
      paintPresetButtons();
    }

    function paintCell(i, flash) {
      const node = cellNodes[i];
      if (!node) return;
      const lev = policy[i];
      for (const id of LEVER_IDS) node.cell.classList.remove('region-' + id);
      node.cell.classList.add('region-' + lev);
      node.glyph.className = 's4-chip-glyph ' + Levers.tokenClass(lev);
      node.glyph.innerHTML = Levers.leverIconSvg(lev);
      node.label.className = 's4-chip-label ' + Levers.tokenClass(lev);
      node.label.textContent = T('lever.short.' + lev);
      if (flash) {
        node.cell.classList.remove('s4-cell-flip');
        void node.cell.offsetWidth;
        node.cell.classList.add('s4-cell-flip');
        setTimeout(() => node.cell.classList.remove('s4-cell-flip'), 420);
      }
    }
    function paintBoard() { for (let i = 0; i < N; i++) paintCell(i, false); }

    /* The lever-region census strip (how many of the 25 cells pick each
       lever) so the board reads as a map of coloured regions. */
    function paintPresetButtons() {
      for (const name of ['never', 'panic']) {
        presetBtns[name].classList.toggle('active', activePreset === name);
      }
    }

    /*, RIGHT: the outcome panel, */
    const right = document.createElement('div');
    right.className = 's4-right';
    row.appendChild(right);

    const outTitle = document.createElement('div');
    outTitle.className = 's4-out-title';
    right.appendChild(outTitle);

    /* Renewal-rate gauge (0..100%). */
    const renewWrap = document.createElement('div');
    renewWrap.className = 's4-gauge';
    renewWrap.innerHTML =
      '<div class="s4-gauge-head"><span class="s4-gauge-name">' + T('scene4.renew_rate') + '</span>' +
      '<span class="s4-gauge-val s4-renew-val"></span></div>' +
      '<div class="s4-gauge-track"><span class="s4-gauge-fill s4-renew-fill"></span></div>' +
      '<div class="s4-gauge-foot">' + T('scene4.renew_foot') + '</div>';
    right.appendChild(renewWrap);
    const renewVal = renewWrap.querySelector('.s4-renew-val');
    const renewFill = renewWrap.querySelector('.s4-renew-fill');

    /* Expected-return meter (a signed bar from a negative floor to a
       positive ceiling, centred at zero). */
    const retWrap = document.createElement('div');
    retWrap.className = 's4-return';
    retWrap.innerHTML =
      '<div class="s4-gauge-head"><span class="s4-gauge-name">' + T('scene4.exp_return') + '</span>' +
      '<span class="s4-gauge-val s4-ret-val"></span></div>' +
      '<div class="s4-ret-track"><span class="s4-ret-zero"></span><span class="s4-ret-fill"></span></div>' +
      '<div class="s4-gauge-foot">' + T('scene4.return_foot') + '</div>';
    right.appendChild(retWrap);
    const retVal = retWrap.querySelector('.s4-ret-val');
    const retFill = retWrap.querySelector('.s4-ret-fill');
    const retTrack = retWrap.querySelector('.s4-ret-track');

    /* The verdict line (does this playbook make or lose money?). */
    const verdict = document.createElement('div');
    verdict.className = 's4-verdict poke-box tight';
    right.appendChild(verdict);

    const RET_SPAN = 10;     // meter runs -10 .. +10 value points

    function paintOutcome() {
      const { V, Rp } = evaluate(policy);
      const ret = V[START_IDX];
      const renew = Rp[START_IDX];

      outTitle.innerHTML = T('scene4.out_title', {
        start: '<span class="s4-startcard">' + startLabel() + '</span>',
      });

      /* renewal gauge */
      renewVal.textContent = (renew * 100).toFixed(0) + '%';
      renewFill.style.width = Math.max(0, Math.min(100, renew * 100)) + '%';

      /* return meter: zero at centre, fill grows left (neg) or right (pos) */
      const clamped = Math.max(-RET_SPAN, Math.min(RET_SPAN, ret));
      const halfPct = Math.abs(clamped) / RET_SPAN * 50;
      retVal.textContent = (ret >= 0 ? '+' : '') + ret.toFixed(2);
      retVal.classList.toggle('pos', ret >= 0);
      retVal.classList.toggle('neg', ret < 0);
      retTrack.classList.toggle('is-neg', ret < 0);
      retTrack.classList.toggle('is-pos', ret >= 0);
      if (ret >= 0) {
        retFill.style.left = '50%';
        retFill.style.width = halfPct + '%';
      } else {
        retFill.style.left = (50 - halfPct) + '%';
        retFill.style.width = halfPct + '%';
      }

      /* verdict */
      const key = ret >= 0 ? 'scene4.verdict.win' : 'scene4.verdict.lose';
      verdict.className = 's4-verdict poke-box tight ' + (ret >= 0 ? 's4-verdict-win' : 's4-verdict-lose');
      verdict.innerHTML = T(key);
    }

    function startLabel() {
      return T('tier.short.' + Churn.TIERS[START.tier]) + ' / ' + T('months.short', { n: START.m });
    }

    /*, BELOW: the scene-2 callback, */
    const callback = document.createElement('div');
    callback.className = 's4-callback poke-box';
    callback.innerHTML =
      '<span class="s4-callback-key">' + T('scene4.callback_key') + '</span> ' +
      T('scene4.callback_body');
    wrap.appendChild(callback);

    const hint = document.createElement('div');
    hint.className = 'footnote s4-hint';
    hint.innerHTML = T('scene4.hint');
    wrap.appendChild(hint);

    /*, preset button wiring, */
    for (const name of ['never', 'panic']) {
      presetBtns[name].addEventListener('click', () => {
        loadPreset(name);
        if (window.SFX) window.SFX.play('cursor');
        paintBoard();
        paintOutcome();
        paintPresetButtons();
      });
    }

    /*, first paint, */
    paintBoard();
    paintOutcome();
    paintPresetButtons();

    /* &run -> show the PANIC OFFER playbook (the more visually striking
       region map) for the headless screenshot. */
    if (/[#&?]run\b/.test(window.location.hash)) {
      setTimeout(() => {
        loadPreset('panic');
        paintBoard();
        paintOutcome();
        paintPresetButtons();
      }, 160);
    }

    return {
      onEnter() { paintBoard(); paintOutcome(); paintPresetButtons(); },
    };
  };
})();

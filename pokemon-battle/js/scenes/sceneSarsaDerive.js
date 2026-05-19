/* Scene — deriving SARSA, then watching it run on one trajectory.
 *
 *   Eight-step pager (A → B → D → E1 → E2 → E3 → E4 → F).  One step
 *   shows at a time; everything fits in one viewport without scroll.
 *
 *   The right column carries a *continuous* illustration that
 *   evolves with the step:
 *
 *     A   table appears (all dashed cells)
 *     B   staggered +0.00 flash sweeps the cells
 *     D   one pre-sampled trajectory paints its path on the table
 *           with 1, 2, 3… badges on visited cells
 *     E1  same path; the first tuple is bolded and ghosted siblings
 *           hint at "one sample of an expectation"
 *     E2  active cell highlighted with a target callout
 *     E3  number-line viz under the table: q and target as dots,
 *           BOTH arrows (up / down) shown
 *     E4  same number-line, collapsed to ONE merged arrow
 *     F   full live demo activates: trajectory tape becomes
 *           interactive, step-detail panel replaces the left card,
 *           and a PLAY toggle auto-advances transitions (auto-
 *           rerolling at end of trajectory) at a ~750 ms cadence.
 *
 *   ε = 0.40; γ = 1 (every trajectory terminates).
 */
(function () {
  window.scenes = window.scenes || {};

  const ACTIONS = window.Moves.MOVE_IDS;
  const A       = ACTIONS.length;
  const NB      = window.Battle.NUM_BUCKETS;
  const STATES  = window.Bellman.STATES;
  const N       = STATES.length;
  const GAMMA   = 1;

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* ---------- Step content (left column) ----------
     A through E4 carry text + KaTeX formulas.  F is the live demo
     and uses the left column as the step-detail panel instead.  The
     `title` / `body` / `foot` strings live in i18n.js under
     sd.step.<id>.* so the language toggle re-paints the card. */
  const STEPS = [
    { id: 'A',  latex: [String.raw`\mathtt{q}[s, a] \;\approx\; Q^{\star}(s, a) \qquad \text{for all } s \in S,\; a \in A`] },
    { id: 'B',  latex: [String.raw`\mathtt{q}[s, a] \;:=\; 0 \qquad \text{for all } (s, a)`] },
    { id: 'D',  latex: [String.raw`s_1 \;\xrightarrow{a_1}\; r_1 \;\xrightarrow{}\; s_2 \;\xrightarrow{a_2}\; r_2 \;\xrightarrow{}\; s_3 \;\xrightarrow{a_3}\; r_3 \;\xrightarrow{}\; \cdots`],
      hasFoot: true },
    { id: 'E1', latex: [
        String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; Q^{\star}(S', A') \,\right]`,
        String.raw`\phantom{Q^{\star}(s, a)}\;\approx\; r \;+\; Q^{\star}(s', a')`,
      ], hasFoot: true },
    { id: 'E2', latex: [
        String.raw`\mathtt{target} \;:=\; r \;+\; \mathtt{q}[s', a']`,
        String.raw`\mathtt{q}[s, a] \;\stackrel{\text{want}}{=}\; \mathtt{target}`,
      ] },
    { id: 'E3', latex: [String.raw`\begin{aligned}
          \text{if } \mathtt{q}[s, a] &< \mathtt{target}: && \mathtt{q}[s, a] \;\mathrel{+}=\; \alpha\,(\,\mathtt{target} - \mathtt{q}[s, a]\,) \\[4pt]
          \text{if } \mathtt{q}[s, a] &> \mathtt{target}: && \mathtt{q}[s, a] \;\mathrel{-}=\; \alpha\,(\,\mathtt{q}[s, a] - \mathtt{target}\,)
        \end{aligned}`], hasFoot: true },
    { id: 'E4', latex: [String.raw`\boxed{\;\mathtt{q}[s, a] \;\leftarrow\; \mathtt{q}[s, a] \;+\; \alpha\,\bigl(\,\mathtt{target} \;-\; \mathtt{q}[s, a]\,\bigr)\;}`],
      hasFoot: true },
    { id: 'F',  latex: [],     /* Left column becomes the step-detail panel. */
      noBody: true },
    { id: 'G',  latex: [
        String.raw`\textbf{SARSA target:} \quad r \;+\; \mathtt{q}[s', \; a']`,
        String.raw`\textbf{Q-learning target:} \quad r \;+\; \max_{a'} \mathtt{q}[s', \; a']`,
      ], hasFoot: true },
  ];

  function stepTitle(step) { return T('sd.step.' + step.id + '.title'); }
  function stepBody(step)  {
    if (step.noBody) return '';
    return T('sd.step.' + step.id + '.body');
  }
  function stepFoot(step)  {
    if (!step.hasFoot) return '';
    return T('sd.step.' + step.id + '.foot');
  }

  /* ---------- Helpers ---------- */
  function shortMove(id) { return T('move.short.' + id); }
  function fullMove(id)  { return T('move.' + id); }
  function bucketName(b) {
    const key = window.Battle.BUCKETS[b];
    return key ? T('hp.bucket.' + key) : T('hp.bucket.fainted');
  }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function fmt(v) {
    if (v === 0 || Math.abs(v) < 0.0005) return '+0.00';
    return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
  }
  function stateLabel(s) {
    if (s.terminal) return s.win ? T('terminal.win') : T('terminal.loss');
    return bucketName(s.your) + ' / ' + bucketName(s.opp);
  }

  function genTrajectory(Q, eps, rng, maxTurns) {
    maxTurns = maxTurns || 20;
    const out = [];
    let s = window.Battle.initialState();
    let sIdx = window.Battle.stateIndex(s);
    let aId  = window.SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
    let aIdx = ACTIONS.indexOf(aId);

    for (let t = 0; t < maxTurns; t++) {
      const sample = window.Battle.sample(s, aId, rng);
      const sNext = sample.sNext;
      const reward = sample.reward;
      const term = sNext.terminal;

      if (term) {
        out.push({
          s, sIdx, a: aId, aIdx, r: reward,
          sNext, sNextIdx: null, aNext: null, aNextIdx: null,
          terminal: true, win: !!sNext.win, lose: !!sNext.lose,
        });
        break;
      }

      const sNextIdx = window.Battle.stateIndex(sNext);
      const aNextId  = window.SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);
      const aNextIdx = ACTIONS.indexOf(aNextId);
      out.push({
        s, sIdx, a: aId, aIdx, r: reward,
        sNext, sNextIdx, aNext: aNextId, aNextIdx,
        terminal: false,
      });

      s = sNext; sIdx = sNextIdx; aId = aNextId; aIdx = aNextIdx;
    }
    return out;
  }

  window.scenes.sceneSarsaDerive = function (root) {
    root.classList.add('scene-pad', 'sd-scene', 'sd-pager');
    root.innerHTML = '';

    /* ==========================================================
       Scaffolding
       ========================================================== */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('sd.heading');
    root.appendChild(heading);

    const ctrls = document.createElement('div');
    ctrls.className = 'sd-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="sd-prev">'  + T('sd.btn.prev')  + '</button>' +
      '<button class="poke-btn" id="sd-next">'  + T('sd.btn.next')  + '</button>' +
      '<button class="poke-btn" id="sd-reset">' + T('sd.btn.reset') + '</button>' +
      '<div class="sd-status">' + T('sd.status', { total: STEPS.length }) + '</div>';
    root.appendChild(ctrls);

    /* 2-column row: left = card content, right = persistent illustration. */
    const row = document.createElement('div');
    row.className = 'sd-row';
    root.appendChild(row);

    const left = document.createElement('div');
    left.className = 'sd-left';
    row.appendChild(left);

    const right = document.createElement('div');
    right.className = 'sd-right';
    row.appendChild(right);

    /* Right column: caption strip + trajectory tape + Q-table + number-line. */
    const cap = document.createElement('div');
    cap.className = 'sd-illus-cap';
    right.appendChild(cap);

    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'sd-f-tape-wrap';
    right.appendChild(tapeWrap);
    const tapeTitle = document.createElement('div');
    tapeTitle.className = 'sd-f-tape-title';
    tapeTitle.innerHTML = T('sd.tape.title') + ' <span class="sd-f-tape-count" id="sd-f-tape-count"></span>';
    tapeWrap.appendChild(tapeTitle);
    const tape = document.createElement('div');
    tape.className = 'sd-f-tape';
    tapeWrap.appendChild(tape);

    const qHost = document.createElement('div');
    qHost.className = 'sd-q-host';
    right.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const numline = document.createElement('div');
    numline.className = 'sd-numline';
    numline.style.display = 'none';
    right.appendChild(numline);

    /* F-step controls live in the left column alongside the step-detail
       panel — see fControlsHTML() / wireFControls().  The bottom-row
       layout was dropped to fit the F step on a single viewport. */

    /* ==========================================================
       State
       ========================================================== */
    let cursor = 0;

    /* Pre-sampled trajectory for the illustration steps (D–E4).  Fixed
       seed so the same path appears on every visit. */
    const illusRng = window.Battle.makeRng(20260515);
    const illusTraj = genTrajectory(window.SARSA.makeQ(), 0.40, illusRng, 6);
    const illusActiveIdx = 0;   /* which tuple is "the sample" emphasised in E1–E4 */

    /* F state — independent of illustration trajectory. */
    let Q       = window.SARSA.makeQ();
    let fRng    = window.Battle.makeRng(20260520);
    const ALPHA = 0.20;     /* Step size, fixed.  Standard tabular SARSA
                               sits in 0.1–0.3; 0.2 gives a visible per-
                               tuple nudge without being chaotic. */
    let eps     = 0.40;     /* Exploration rate.  Live-tunable via the
                               slider in the F controls so students can
                               see ε = 0 → stuck, ε = 1 → no exploit. */
    let fTraj   = [];
    let fCursor = 0;

    /* PLAY mode state — speed level (0=slowest .. 4=fastest) maps to a
       ms cadence between transitions. */
    let playing       = false;
    let playTimer     = null;
    let playSpeedLvl  = 2;     /* default = middle (= ~700 ms) */
    const SPEED_MS    = [700, 500, 350, 225, 125];

    /* DP-computed Q* — the ground truth.  Used by the convergence
       indicator in the F step to show how close our SARSA q is to
       optimal.  Computed lazily (and cached) the first time F is
       shown so we don't pay the value-iteration cost up front. */
    let QstarCache   = null;
    let QstarBaseline = 0;        /* sum|Q*| over all (s,a); the
                                     denominator for the distance bar */
    function computeQstar() {
      if (QstarCache) return QstarCache;
      let V = new Float32Array(N);
      for (let iter = 0; iter < 400; iter++) {
        const Vn = new Float32Array(N);
        let md = 0;
        for (let s = 0; s < N; s++) {
          const st = { your: STATES[s].your, opp: STATES[s].opp, terminal: false };
          let best = -Infinity;
          for (let a = 0; a < A; a++) {
            const succ = window.Battle.successors(st, ACTIONS[a]);
            let q = 0;
            for (const t of succ) {
              const vN = t.sNext.terminal ? 0 : V[t.sNext.your * NB + t.sNext.opp];
              q += t.p * (t.reward + GAMMA * vN);
            }
            if (q > best) best = q;
          }
          Vn[s] = best;
          const d = Math.abs(best - V[s]);
          if (d > md) md = d;
        }
        V = Vn;
        if (md < 1e-7) break;
      }
      const Qs = new Float32Array(N * A);
      let baseline = 0;
      for (let s = 0; s < N; s++) {
        const st = { your: STATES[s].your, opp: STATES[s].opp, terminal: false };
        for (let a = 0; a < A; a++) {
          const succ = window.Battle.successors(st, ACTIONS[a]);
          let q = 0;
          for (const t of succ) {
            const vN = t.sNext.terminal ? 0 : V[t.sNext.your * NB + t.sNext.opp];
            q += t.p * (t.reward + GAMMA * vN);
          }
          Qs[s * A + a] = q;
          baseline += Math.abs(q);
        }
      }
      QstarCache = Qs;
      QstarBaseline = baseline || 1;
      return Qs;
    }

    /* Returns a number in [0, 100]: 0 at the start (q all zero), 100 when
       q matches Q* exactly.  Uses the L1 distance normalised by sum|Q*|. */
    function convergencePct() {
      const Qs = computeQstar();
      let dist = 0;
      for (let i = 0; i < Q.length; i++) dist += Math.abs(Q[i] - Qs[i]);
      const frac = dist / QstarBaseline;
      const pct = Math.max(0, Math.min(100, 100 * (1 - frac)));
      return pct;
    }

    /* ==========================================================
       Right-column rendering — per-step illustration logic
       ========================================================== */

    function clearOverlays() {
      qHost.querySelectorAll('.q-cell.sd-pulse, .q-cell.sd-illus-cell, .q-cell.sd-illus-active')
        .forEach(c => c.classList.remove('sd-pulse', 'sd-illus-cell', 'sd-illus-active'));
      qHost.querySelectorAll('.q-bar-row.sd-row-mark, .q-bar-row.sd-illus-bar')
        .forEach(r => r.classList.remove('sd-row-mark', 'sd-illus-bar'));
      qHost.querySelectorAll('.sd-cell-badge').forEach(b => b.remove());
      qHost.querySelectorAll('.sd-cell-target-callout').forEach(b => b.remove());
      numline.style.display = 'none';
      numline.innerHTML = '';
      cap.textContent = '';
    }

    function paintIllusTraj(opts) {
      opts = opts || {};
      const ghost = !!opts.ghost;
      const activeOnly = !!opts.activeOnly;
      illusTraj.forEach((t, i) => {
        const node = qtbl.getCellNode(t.sIdx);
        if (!node) return;
        const isActive = (i === illusActiveIdx);
        if (activeOnly && !isActive) return;
        node.classList.add('sd-illus-cell');
        if (isActive) node.classList.add('sd-illus-active');
        if (ghost && !isActive) node.classList.add('sd-illus-ghost');
        /* Add a sequence badge */
        const badge = document.createElement('div');
        badge.className = 'sd-cell-badge' + (isActive ? ' active' : '');
        badge.textContent = String(i + 1);
        node.appendChild(badge);
        /* Highlight the action row */
        const rows = node.querySelectorAll('.q-bar-row');
        rows.forEach((r, k) => { if (k === t.aIdx) r.classList.add('sd-illus-bar'); });
      });
    }

    function renderIllusTape(highlightIdx) {
      const n = illusTraj.length;
      document.getElementById('sd-f-tape-count').textContent =
        n > 0 ? T('sd.tape.illus_count', { n: n }) : '';
      let html = '';
      for (let i = 0; i < n; i++) {
        const t = illusTraj[i];
        const active = (i === highlightIdx) ? ' active' : '';
        html +=
          '<div class="sd-f-tape-tuple' + active + '" data-i="' + i + '">' +
            '<div class="sd-f-tape-t">t = ' + (i + 1) + '</div>' +
            '<div class="sd-f-tape-arrow">' + shortMove(t.a) + '<br><span class="sd-f-tape-r">' + fmt(t.r) + '</span></div>' +
          '</div>';
      }
      tape.innerHTML = html;
    }

    function showTargetCallout() {
      const t = illusTraj[illusActiveIdx];
      const node = qtbl.getCellNode(t.sIdx);
      if (!node) return;
      const target = t.terminal ? t.r : (t.r + GAMMA * 0);   /* q is still 0 in illustration */
      const co = document.createElement('div');
      co.className = 'sd-cell-target-callout';
      co.innerHTML =
        '<div class="sd-callout-title">' + T('sd.target.label') + '</div>' +
        '<div class="sd-callout-eq">r + q[s′, a′]</div>' +
        '<div class="sd-callout-eq">= ' + fmt(t.r) + ' + +0.00</div>' +
        '<div class="sd-callout-val">= <b>' + fmt(target) + '</b></div>';
      node.appendChild(co);
    }

    function showNumLine(mode) {
      /* mode: 'two-arrow' (E3) or 'one-arrow' (E4).  Builds a horizontal
         line with q-dot and target-dot, with arrows between them. */
      numline.style.display = 'block';
      const t = illusTraj[illusActiveIdx];
      const targetVal = t.terminal ? t.r : t.r;
      /* Display values: target = r (since q[s',a']=0), q = 0. */
      const lo = Math.min(0, targetVal) - 1;
      const hi = Math.max(0, targetVal) + 1;
      const pctOf = (v) => ((v - lo) / (hi - lo)) * 100;
      const qPct = pctOf(0);
      const tgPct = pctOf(targetVal);

      const titleStr = mode === 'two-arrow' ? T('sd.numline.two') : T('sd.numline.one');
      const tgtLabel = T('sd.numline.tgt_label', { v: fmt(targetVal) });
      const html =
        '<div class="sd-numline-title">' + titleStr + '</div>' +
        '<div class="sd-numline-track">' +
          '<div class="sd-numline-axis"></div>' +
          '<div class="sd-numline-dot q"     style="left:' + qPct  + '%"><div class="sd-numline-label">' + T('sd.numline.q_label') + '</div></div>' +
          '<div class="sd-numline-dot tgt"   style="left:' + tgPct + '%"><div class="sd-numline-label">' + tgtLabel + '</div></div>' +
          (mode === 'two-arrow'
            ? '<div class="sd-numline-arrow ' + (targetVal > 0 ? 'up'   : 'down') + '" style="left:' + qPct + '%; width:' + Math.abs(tgPct - qPct) + '%">' + T('sd.numline.arrow') + '</div>' +
              '<div class="sd-numline-arrow ' + (targetVal > 0 ? 'down' : 'up')   + ' shadow" style="left:' + qPct + '%; width:' + Math.abs(tgPct - qPct) + '%">' + T('sd.numline.other') + '</div>'
            : '<div class="sd-numline-arrow unified" style="left:' + qPct + '%; width:' + Math.abs(tgPct - qPct) + '%">' + T('sd.numline.unified') + '</div>') +
        '</div>';
      numline.innerHTML = html;
    }

    /* Per-step illustration renderers. */
    function illusA() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      tape.innerHTML = '';
      document.getElementById('sd-f-tape-count').textContent = '';
      cap.textContent = T('sd.illus.A');
    }

    function illusB() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      tape.innerHTML = '';
      document.getElementById('sd-f-tape-count').textContent = '';
      cap.textContent = T('sd.illus.B');
      /* Stagger-flash +0.00 into each cell, then leave it visible. */
      const allCells = qHost.querySelectorAll('.q-cell');
      allCells.forEach((cell, idx) => {
        const vals = cell.querySelectorAll('.q-val');
        setTimeout(() => {
          vals.forEach(v => { v.textContent = '+0.00'; });
          cell.classList.add('sd-illus-init');
          setTimeout(() => cell.classList.remove('sd-illus-init'), 600);
        }, idx * 22);
      });
    }

    function illusD() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      /* Force +0.00 instead of dashes (we're past initialisation now). */
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(-1);
      paintIllusTraj({});
      cap.textContent = T('sd.illus.D');
    }

    function illusE1() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ ghost: true });
      cap.textContent = T('sd.illus.E1');
    }

    function illusE2() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ activeOnly: true });
      showTargetCallout();
      cap.textContent = T('sd.illus.E2');
    }

    function illusE3() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ activeOnly: true });
      showNumLine('two-arrow');
      cap.textContent = T('sd.illus.E3');
    }

    function illusE4() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ activeOnly: true });
      showNumLine('one-arrow');
      cap.textContent = T('sd.illus.E4');
    }

    function illusF() {
      qtbl.update(Q, { suppressFlash: true });
      renderFTape();
      renderConvergence();
    }

    /* Convergence-to-Q* indicator — a thin bar that sits where the
       caption usually lives, only on step F.  Recomputed after every
       SARSA update and on REROLL / CLEAR.  Cheap (25*3 cells). */
    function renderConvergence() {
      const pct = convergencePct();
      cap.innerHTML =
        '<div class="sd-conv-row">' +
          '<span class="sd-conv-label">' + T('sd.conv.label') + '</span>' +
          '<span class="sd-conv-track"><span class="sd-conv-fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
          '<span class="sd-conv-val">' + pct.toFixed(0) + '%</span>' +
        '</div>';
    }

    function illusG() {
      /* Q-learning extension step.  The Q-table on the right retains
         whatever state F left behind so the comparison feels like it
         continues from there. */
      cap.textContent = T('sd.illus.G');
      qtbl.update(Q, { suppressFlash: true });
      renderFTape();
    }

    /* ==========================================================
       F-step live demo plumbing
       ========================================================== */

    function tapeStateThumb(s) {
      if (s.terminal) {
        const kind = s.win ? 'win' : 'loss';
        const label = s.win ? T('terminal.win') : T('terminal.loss');
        return '<div class="sd-f-tape-state terminal ' + kind + '"><div class="sd-f-tape-banner">' + label + '</div></div>';
      }
      const oppSrc = window.Battle.spriteForOpp(s.opp, 'gen1');
      return '<div class="sd-f-tape-state">' +
               '<div class="sd-f-tape-mini">' +
                 '<img class="sd-f-tape-sprite" src="assets/pikachu-back-gen1.png" alt="">' +
                 '<div class="sd-f-tape-hp"><div class="sd-f-tape-hp-fill ' + bucketClass(s.your) + '" style="width:' + bucketPct(s.your) + '%"></div></div>' +
               '</div>' +
               '<div class="sd-f-tape-mini">' +
                 '<img class="sd-f-tape-sprite" src="' + oppSrc + '" alt="">' +
                 '<div class="sd-f-tape-hp"><div class="sd-f-tape-hp-fill ' + bucketClass(s.opp) + '" style="width:' + bucketPct(s.opp) + '%"></div></div>' +
               '</div>' +
             '</div>';
    }

    function renderFTape() {
      const n = fTraj.length;
      if (n === 0) {
        document.getElementById('sd-f-tape-count').textContent = '';
      } else {
        const key = n === 1 ? 'sd.tape.count_singular' : 'sd.tape.count_plural';
        document.getElementById('sd-f-tape-count').textContent =
          T(key, { n: n, cur: Math.min(fCursor, n) });
      }
      let html = '';
      for (let i = 0; i < n; i++) {
        const t = fTraj[i];
        const active = (i === fCursor) ? ' active' : '';
        const applied = (i < fCursor) ? ' applied' : '';
        html +=
          '<div class="sd-f-tape-tuple' + active + applied + '" data-i="' + i + '">' +
            '<div class="sd-f-tape-t">t = ' + (i + 1) + '</div>' +
            tapeStateThumb(t.s) +
            '<div class="sd-f-tape-arrow">' + shortMove(t.a) + '<br><span class="sd-f-tape-r">' + fmt(t.r) + '</span></div>' +
          '</div>';
        if (i === n - 1) {
          html += '<div class="sd-f-tape-tuple terminal-tail">' + tapeStateThumb(t.sNext) + '</div>';
        }
      }
      tape.innerHTML = html;
    }

    function fControlsHTML() {
      /* The F-step controls live on the left, alongside the step-detail
         panel.  Speed slider is 0..4; α is fixed at 0.20; ε is a live
         slider 0..1 so students discover the exploration tradeoff.
         REROLL / CLEAR-q dropped — PLAY auto-rerolls and student-driven
         reset comes from the scene-level RESET button. */
      const epsPct = Math.round(eps * 100);
      return (
        '<div class="sd-f-ctrls-row">' +
          '<button class="poke-btn" id="sd-f-play">'   + (playing ? T('sd.f.pause') : T('sd.f.play')) + '</button>' +
          '<button class="poke-btn" id="sd-f-step">'   + T('sd.f.step_btn') + '</button>' +
          '<div class="sd-f-speed">' + T('sd.f.speed') + ' ' +
            '<span class="sd-f-speed-label">' + T('sd.f.speed.slow') + '</span>' +
            '<input type="range" id="sd-f-speed-range" min="0" max="4" step="1" value="' + playSpeedLvl + '">' +
            '<span class="sd-f-speed-label">' + T('sd.f.speed.fast') + '</span>' +
          '</div>' +
          '<div class="sd-f-eps">' + T('sd.f.eps') + ' <b id="sd-f-eps-val">' + eps.toFixed(2) + '</b>' +
            '<input type="range" id="sd-f-eps-range" min="0" max="100" step="5" value="' + epsPct + '">' +
          '</div>' +
          '<div class="sd-f-alpha-fixed">' + T('sd.f.alpha', { a: ALPHA.toFixed(2) }) + '</div>' +
        '</div>'
      );
    }

    function wireFControls() {
      const play = document.getElementById('sd-f-play');
      if (play) play.addEventListener('click', togglePlay);
      const step = document.getElementById('sd-f-step');
      if (step) step.addEventListener('click', () => { pausePlay(); applyCurrentFUpdate(); });
      const spd = document.getElementById('sd-f-speed-range');
      if (spd) spd.addEventListener('input', (e) => {
        playSpeedLvl = Math.max(0, Math.min(4, parseInt(e.target.value, 10) || 2));
      });
      const epsEl = document.getElementById('sd-f-eps-range');
      if (epsEl) epsEl.addEventListener('input', (e) => {
        eps = Math.max(0, Math.min(1, (parseInt(e.target.value, 10) || 0) / 100));
        const lbl = document.getElementById('sd-f-eps-val');
        if (lbl) lbl.textContent = eps.toFixed(2);
        /* New ε kicks in on the next REROLL — current trajectory was
           sampled under the old ε. */
      });
    }

    function renderFDetail() {
      const ctrls = fControlsHTML();
      const head =
        '<div class="sd-card-num">' + T('sd.f.step_label', { i: 8, total: STEPS.length }) + '</div>' +
        '<div class="sd-card-title">' + T('sd.step.F.title') + '</div>' +
        ctrls;

      if (!fTraj.length || fCursor >= fTraj.length) {
        if (!fTraj.length) {
          left.innerHTML = head +
            '<div class="sd-f-detail">' +
              '<div class="sd-f-detail-title">' + T('sd.f.no_transitions') + '</div>' +
              '<div class="sd-f-detail-body">' + T('sd.f.no_transitions.body') + '</div>' +
            '</div>';
        } else {
          left.innerHTML = head +
            '<div class="sd-f-detail">' +
              '<div class="sd-f-detail-title">' + T('sd.f.all_applied', { n: fTraj.length }) + '</div>' +
              '<div class="sd-f-detail-body">' + T('sd.f.all_applied.body') + '</div>' +
            '</div>';
        }
        wireFControls();
        clearFPulse();
        return;
      }

      const t = fTraj[fCursor];
      const qCurrent = Q[t.sIdx * A + t.aIdx];
      const qNextEst = t.terminal ? 0 : Q[t.sNextIdx * A + t.aNextIdx];
      const target   = t.terminal ? t.r : (t.r + GAMMA * qNextEst);
      const tdErr    = target - qCurrent;
      const qNew     = qCurrent + ALPHA * tdErr;

      const aStr   = fullMove(t.a);
      const aNStr  = t.terminal ? T('sd.f.terminal') : fullMove(t.aNext);
      const targetCalc = t.terminal
        ? T('sd.f.target_terminal', { r: fmt(t.r) })
        : fmt(t.r) + ' + ' + fmt(qNextEst) + ' = <b>' + fmt(target) + '</b>';

      left.innerHTML = head +
        '<div class="sd-f-detail">' +
          '<div class="sd-f-detail-title">' + T('sd.f.transition_of', { i: fCursor + 1, n: fTraj.length }) + '</div>' +
          '<div class="sd-f-detail-body">' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">s</span> <span class="sd-f-row-rhs">' + stateLabel(t.s) + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">a</span> <span class="sd-f-row-rhs">' + aStr + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">r</span> <span class="sd-f-row-rhs sd-f-r">' + fmt(t.r) + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">s′</span> <span class="sd-f-row-rhs">' + stateLabel(t.sNext) + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">a′</span> <span class="sd-f-row-rhs">' + aNStr + '</span></div>' +
            '<div class="sd-f-divider"></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">' + T('sd.f.target_label') + '</span></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-eq">= ' + targetCalc + '</span></div>' +
            '<div class="sd-f-divider"></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">' + T('sd.f.q_was') + '</span> <b>' + fmt(qCurrent) + '</b></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">' + T('sd.f.td_label') + '</span> = <b class="sd-f-td">' + fmt(tdErr) + '</b></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">' + T('sd.f.update_label') + '</span></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-eq">= ' + fmt(qCurrent) + ' + ' + ALPHA.toFixed(2) + ' · ' + fmt(tdErr) + ' = <b class="sd-f-qnew">' + fmt(qNew) + '</b></span></div>' +
          '</div>' +
        '</div>';

      wireFControls();
      highlightFCell(t);
    }

    function clearFPulse() {
      const prev = qHost.querySelector('.q-cell.sd-pulse');
      if (prev) prev.classList.remove('sd-pulse');
      qHost.querySelectorAll('.q-bar-row.sd-row-mark').forEach(r => r.classList.remove('sd-row-mark'));
    }

    function highlightFCell(t) {
      clearFPulse();
      const cell = qtbl.getCellNode(t.sIdx);
      if (cell) {
        cell.classList.add('sd-pulse');
        cell.querySelectorAll('.q-bar-row').forEach((row, i) => row.classList.toggle('sd-row-mark', i === t.aIdx));
      }
    }

    function applyCurrentFUpdate() {
      if (fCursor >= fTraj.length) return false;
      const t = fTraj[fCursor];
      window.SARSA.update(Q, t.sIdx, t.a, t.r, t.sNextIdx, t.aNext, ALPHA, GAMMA, t.terminal);
      qtbl.update(Q, { suppressFlash: false });
      fCursor += 1;
      renderFTape();
      renderFDetail();
      renderConvergence();
      return true;
    }

    function fReroll() {
      fTraj = genTrajectory(Q, eps, fRng, 20);
      fCursor = 0;
      qtbl.update(Q, { suppressFlash: true });
      renderFTape();
      renderFDetail();
      renderConvergence();
    }

    /* ---- PLAY mode ---- */
    function playButton() { return document.getElementById('sd-f-play'); }
    function setPlayLabel(isPlay) {
      const b = playButton();
      if (b) b.textContent = isPlay ? T('sd.f.pause') : T('sd.f.play');
    }
    function pausePlay() {
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      playing = false;
      setPlayLabel(false);
    }
    function schedulePlayTick() {
      playTimer = setTimeout(() => {
        playTimer = null;
        if (!playing) return;
        /* If we're past the trajectory, auto-reroll. */
        if (fCursor >= fTraj.length) {
          fReroll();
        } else {
          applyCurrentFUpdate();
        }
        if (playing) schedulePlayTick();
      }, SPEED_MS[playSpeedLvl]);
    }
    function startPlay() {
      if (playing) return;
      playing = true;
      setPlayLabel(true);
      schedulePlayTick();
    }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }

    /* ==========================================================
       Pager — apply current step
       ========================================================== */
    function applyCursor() {
      pausePlay();
      const step = STEPS[cursor];
      document.getElementById('sd-step-idx').textContent = String(cursor + 1);
      document.getElementById('sd-step-id').textContent = step.id;
      document.getElementById('sd-prev').disabled = (cursor === 0);
      document.getElementById('sd-next').disabled = (cursor === STEPS.length - 1);

      clearOverlays();

      if (step.id === 'F') {
        /* F step — live demo.  The left column is built from scratch
           by renderFDetail (it contains the step-detail + the
           PLAY/NEXT/REROLL/CLEAR/SPEED controls). */
        if (!fTraj.length) fReroll();
        illusF();
        renderFDetail();
        return;
      }

      /* Render the standard card on the left. */
      let html =
        '<div class="sd-card-num">' + T('sd.f.step_label', { i: cursor + 1, total: STEPS.length }) + '</div>' +
        '<div class="sd-card-title">' + stepTitle(step) + '</div>' +
        '<div class="sd-card-body">' + stepBody(step) + '</div>';
      left.innerHTML = html;

      if (step.latex && step.latex.length) {
        for (const f of step.latex) {
          const box = document.createElement('div');
          box.className = 'sd-card-formula';
          left.appendChild(box);
          window.Katex.render(f, box, true);
        }
      }
      const footText = stepFoot(step);
      if (footText) {
        const foot = document.createElement('div');
        foot.className = 'concept-formula-foot';
        foot.style.marginTop = '6px';
        foot.innerHTML = footText;
        left.appendChild(foot);
      }

      switch (step.id) {
        case 'A':  illusA();  break;
        case 'B':  illusB();  break;
        case 'D':  illusD();  break;
        case 'E1': illusE1(); break;
        case 'E2': illusE2(); break;
        case 'E3': illusE3(); break;
        case 'E4': illusE4(); break;
        case 'G':  illusG();  break;
      }
    }

    /* ==========================================================
       Events
       ========================================================== */
    document.getElementById('sd-prev').addEventListener('click', () => {
      if (cursor > 0) { cursor--; applyCursor(); }
    });
    document.getElementById('sd-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) { cursor++; applyCursor(); }
    });
    document.getElementById('sd-reset').addEventListener('click', () => {
      cursor = 0;
      Q = window.SARSA.makeQ();
      fTraj = [];
      fCursor = 0;
      applyCursor();
    });

    /* F controls are re-bound on each renderFDetail() call (see
       wireFControls) because the buttons live in the left column
       which gets rebuilt every step. */

    applyCursor();

    /* &run flag for headless capture — jump to last step (F). */
    if (/[#&?]run\b/.test(window.location.hash)) {
      setTimeout(() => { cursor = STEPS.length - 1; applyCursor(); }, 200);
    }
    /* &sd=N flag — jump to step N (1-indexed). */
    const sdMatch = (window.location.hash || '').match(/[#&?]sd=(\d+)/);
    if (sdMatch) {
      const target = Math.min(STEPS.length - 1, Math.max(0, parseInt(sdMatch[1], 10) - 1));
      setTimeout(() => { cursor = target; applyCursor(); }, 100);
    }

    return {
      onEnter() { applyCursor(); },
      onLeave() { pausePlay(); },
      onNextKey() {
        if (cursor < STEPS.length - 1) { cursor++; applyCursor(); return true; }
        return false;
      },
      onPrevKey() {
        if (cursor > 0) { cursor--; applyCursor(); return true; }
        return false;
      },
    };
  };
})();

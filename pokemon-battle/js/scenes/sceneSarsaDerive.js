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

  /* ---------- Step content (left column) ----------
     A through E4 carry text + KaTeX formulas.  F is the live demo
     and uses the left column as the step-detail panel instead. */
  const STEPS = [
    {
      id: 'A',
      title: 'A — WE WANT A TABLE OF Q*',
      body:
        'Aim: build a table <span class="sd-q-est">q[s, a]</span> that approximates the optimal action-value ' +
        '<span class="sd-q">Q*(s, a)</span> at every state and action.',
      latex: [
        String.raw`\mathtt{q}[s, a] \;\approx\; Q^{\star}(s, a) \qquad \text{for all } s \in S,\; a \in A`,
      ],
    },
    {
      id: 'B',
      title: 'B — INITIALISE THE TABLE',
      body:
        'We don\'t know <span class="sd-q">Q*</span> yet.  Seed every entry of <span class="sd-q-est">q</span> ' +
        'to zero (or tiny noise so ties break randomly).',
      latex: [
        String.raw`\mathtt{q}[s, a] \;:=\; 0 \qquad \text{for all } (s, a)`,
      ],
    },
    {
      id: 'D',
      title: 'D — PLAY THE GAME TO GENERATE A TRAJECTORY',
      body:
        'We don\'t have P.  We <em>do</em> get to play.  The world hands us a stream of ' +
        '(state, action, reward, next state) tuples — pick the next action by ε-greedy on the <em>current</em> ' +
        '<span class="sd-q-est">q</span>, and let the environment supply the rest.',
      latex: [
        String.raw`s_1 \;\xrightarrow{a_1}\; r_1 \;\xrightarrow{}\; s_2 \;\xrightarrow{a_2}\; r_2 \;\xrightarrow{}\; s_3 \;\xrightarrow{a_3}\; r_3 \;\xrightarrow{}\; \cdots`,
      ],
      foot: 'The second &laquo;A&raquo; in S-A-R-S-A is the action we pick at the next state — needed for the update on the previous step.',
    },
    {
      id: 'E1',
      title: 'E1 — REPLACE THE EXPECTATION WITH ONE SAMPLE',
      body:
        'By Bellman, <span class="sd-q">Q*(s, a)</span> is an expectation over the random next state and reward. ' +
        'We don\'t get the expectation — we get one sample.  Drop the <span class="sd-q">E</span> and use it:',
      latex: [
        String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; Q^{\star}(S', A') \,\right]`,
        String.raw`\phantom{Q^{\star}(s, a)}\;\approx\; r \;+\; Q^{\star}(s', a')`,
      ],
      foot: 'One-sample Monte-Carlo estimate of the right-hand side.',
    },
    {
      id: 'E2',
      title: 'E2 — NAME THE RIGHT-HAND SIDE «TARGET»',
      body:
        'We don\'t have <span class="sd-q">Q*</span> on the right either — only our table <span class="sd-q-est">q</span>. ' +
        'Plug it in.  Call the resulting number the <b>target</b>: that\'s where we want <span class="sd-q-est">q[s, a]</span> to be.',
      latex: [
        String.raw`\mathtt{target} \;:=\; r \;+\; \mathtt{q}[s', a']`,
        String.raw`\mathtt{q}[s, a] \;\stackrel{\text{want}}{=}\; \mathtt{target}`,
      ],
    },
    {
      id: 'E3',
      title: 'E3 — MOVE q TOWARD THE TARGET (TWO CASES)',
      body:
        'If <span class="sd-q-est">q[s, a]</span> is <em>below</em> the target, nudge it <em>up</em>. ' +
        'If it\'s <em>above</em>, nudge it <em>down</em>.  Step size <span class="sd-alpha">α ∈ (0, 1)</span> ' +
        'is small enough not to overshoot.',
      latex: [
        String.raw`\begin{aligned}
          \text{if } \mathtt{q}[s, a] &< \mathtt{target}: && \mathtt{q}[s, a] \;\mathrel{+}=\; \alpha\,(\,\mathtt{target} - \mathtt{q}[s, a]\,) \\[4pt]
          \text{if } \mathtt{q}[s, a] &> \mathtt{target}: && \mathtt{q}[s, a] \;\mathrel{-}=\; \alpha\,(\,\mathtt{q}[s, a] - \mathtt{target}\,)
        \end{aligned}`,
      ],
      foot: 'Same step size α in both cases.  Same magnitude of correction.  Only the sign differs — and α(target − q) already carries that sign for free.',
    },
    {
      id: 'E4',
      title: 'E4 — THE TWO CASES COLLAPSE INTO ONE LINE',
      body:
        'Flip the sign of the «above» case: <span class="sd-q-est">−α(q − target)</span> = <span class="sd-q-est">+α(target − q)</span>. ' +
        'Both branches become the same update.  <b>This is SARSA.</b>',
      latex: [
        String.raw`\boxed{\;\mathtt{q}[s, a] \;\leftarrow\; \mathtt{q}[s, a] \;+\; \alpha\,\bigl(\,\mathtt{target} \;-\; \mathtt{q}[s, a]\,\bigr)\;}`,
      ],
      foot: 'TD error = target − current estimate.  Apply this once per (s, a, r, s′, a′) tuple as the agent plays.',
    },
    {
      id: 'F',
      title: 'F — SARSA ON ONE TRAJECTORY',
      body: '',     /* Left column becomes the step-detail panel; no card body. */
      latex: [],
    },
  ];

  /* ---------- Helpers ---------- */
  function shortMove(id) {
    if (id === 'quick_attack') return 'QUICK';
    if (id === 'thunderbolt')  return 'BOLT';
    if (id === 'thunder')      return 'THUN';
    return id;
  }
  function fullMove(id) {
    return (window.Moves.MOVE_BY_ID[id] && window.Moves.MOVE_BY_ID[id].name) || id;
  }
  function bucketName(b) { return (window.Battle.BUCKETS[b] || 'fainted').toUpperCase(); }
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
    if (s.terminal) return s.win ? 'WIN' : 'LOSS';
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
    heading.textContent = 'DERIVING SARSA';
    root.appendChild(heading);

    const legend = document.createElement('div');
    legend.className = 'sd-legend';
    legend.innerHTML =
      '<span class="sd-legend-chip q">Q(s, a)</span><span>true (unknown) action-value function</span>' +
      '<span class="sd-legend-chip q-est">q[s, a]</span><span>our table estimate — typewriter q</span>';
    root.appendChild(legend);

    const ctrls = document.createElement('div');
    ctrls.className = 'sd-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="sd-prev">◀ PREV</button>' +
      '<button class="poke-btn" id="sd-next">NEXT ▶</button>' +
      '<button class="poke-btn" id="sd-reset">RESET</button>' +
      '<div class="sd-status">STEP <b id="sd-step-idx">1</b> / ' + STEPS.length + ' · <b id="sd-step-id">A</b></div>';
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
    tapeTitle.innerHTML = 'TRAJECTORY <span class="sd-f-tape-count" id="sd-f-tape-count"></span>';
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

    /* F-step extras: controls (PLAY etc.) at the bottom of root.  Hidden
       unless on step F. */
    const fCtrlsRow = document.createElement('div');
    fCtrlsRow.className = 'sd-f-ctrls-row';
    fCtrlsRow.style.display = 'none';
    fCtrlsRow.innerHTML =
      '<button class="poke-btn" id="sd-f-play">▶ PLAY</button>' +
      '<button class="poke-btn" id="sd-f-step">▶ NEXT TRANSITION</button>' +
      '<button class="poke-btn" id="sd-f-reroll">⟲ REROLL</button>' +
      '<button class="poke-btn" id="sd-f-clear">CLEAR q</button>' +
      '<div class="sd-f-alpha">α <span id="sd-f-alpha-val">0.20</span>' +
        '<input type="range" id="sd-f-alpha-range" min="0" max="100" value="20">' +
      '</div>';
    root.appendChild(fCtrlsRow);

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
    let alpha   = 0.20;
    const eps   = 0.40;
    let fTraj   = [];
    let fCursor = 0;

    /* PLAY mode state */
    let playing   = false;
    let playTimer = null;
    const PLAY_MS = 750;

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
      document.getElementById('sd-f-tape-count').textContent = n > 0 ? '· ' + n + ' transitions (illustration)' : '';
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
        '<div class="sd-callout-title">TARGET</div>' +
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

      const html =
        '<div class="sd-numline-title">' + (mode === 'two-arrow' ? 'TWO CASES — q vs target' : 'COLLAPSED — one update') + '</div>' +
        '<div class="sd-numline-track">' +
          '<div class="sd-numline-axis"></div>' +
          '<div class="sd-numline-dot q"     style="left:' + qPct  + '%"><div class="sd-numline-label">q = +0.00</div></div>' +
          '<div class="sd-numline-dot tgt"   style="left:' + tgPct + '%"><div class="sd-numline-label">target = ' + fmt(targetVal) + '</div></div>' +
          (mode === 'two-arrow'
            ? '<div class="sd-numline-arrow ' + (targetVal > 0 ? 'up'   : 'down') + '" style="left:' + qPct + '%; width:' + Math.abs(tgPct - qPct) + '%">α(target − q)</div>' +
              '<div class="sd-numline-arrow ' + (targetVal > 0 ? 'down' : 'up')   + ' shadow" style="left:' + qPct + '%; width:' + Math.abs(tgPct - qPct) + '%">other case (sign-flipped)</div>'
            : '<div class="sd-numline-arrow unified" style="left:' + qPct + '%; width:' + Math.abs(tgPct - qPct) + '%">α(target − q)</div>') +
        '</div>';
      numline.innerHTML = html;
    }

    /* Per-step illustration renderers. */
    function illusA() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      tape.innerHTML = '';
      document.getElementById('sd-f-tape-count').textContent = '';
      cap.textContent = '← THE TABLE WE WANT TO FILL.  EACH CELL = ONE (STATE, ACTION).';
    }

    function illusB() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      tape.innerHTML = '';
      document.getElementById('sd-f-tape-count').textContent = '';
      cap.textContent = '← INITIALISING q[s, a] := 0 FOR EVERY CELL';
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
      cap.textContent = '← ONE SAMPLED TRAJECTORY.  ε-greedy ON THE CURRENT q (ALL ZERO ⇒ UNIFORM RANDOM).';
    }

    function illusE1() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ ghost: true });
      cap.textContent = '← THIS ONE SAMPLE IS WHAT WE USE INSTEAD OF THE EXPECTATION.';
    }

    function illusE2() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ activeOnly: true });
      showTargetCallout();
      cap.textContent = '← target = r + q[s′, a′].  q[s, a] WANTS TO BE THERE.';
    }

    function illusE3() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ activeOnly: true });
      showNumLine('two-arrow');
      cap.textContent = '↓ q SITS BELOW target HERE — NUDGE UP BY α(target − q).';
    }

    function illusE4() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.q-val').forEach(v => v.textContent = '+0.00');
      renderIllusTape(illusActiveIdx);
      paintIllusTraj({ activeOnly: true });
      showNumLine('one-arrow');
      cap.textContent = '↓ ONE UNIFIED UPDATE — α(target − q) — ALREADY CARRIES THE RIGHT SIGN.';
    }

    function illusF() {
      cap.textContent = '↓ LIVE: PRESS PLAY OR NEXT TRANSITION.  q FILLS IN OVER MANY REROLLS.';
      qtbl.update(Q, { suppressFlash: true });
      renderFTape();
    }

    /* ==========================================================
       F-step live demo plumbing
       ========================================================== */

    function tapeStateThumb(s) {
      if (s.terminal) {
        const kind = s.win ? 'win' : 'loss';
        const label = s.win ? '✓ WIN' : '✗ LOSS';
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
      document.getElementById('sd-f-tape-count').textContent =
        n > 0 ? '· ' + n + ' transition' + (n === 1 ? '' : 's') + ', cursor at ' + Math.min(fCursor, n) : '';
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

    function renderFDetail() {
      if (!fTraj.length || fCursor >= fTraj.length) {
        if (!fTraj.length) {
          left.innerHTML =
            '<div class="sd-card-num">STEP 8 / 8</div>' +
            '<div class="sd-card-title">F — SARSA ON ONE TRAJECTORY</div>' +
            '<div class="sd-f-detail">' +
              '<div class="sd-f-detail-title">NO TRANSITIONS YET</div>' +
              '<div class="sd-f-detail-body">Reroll to sample a trajectory.</div>' +
            '</div>';
        } else {
          left.innerHTML =
            '<div class="sd-card-num">STEP 8 / 8</div>' +
            '<div class="sd-card-title">F — SARSA ON ONE TRAJECTORY</div>' +
            '<div class="sd-f-detail">' +
              '<div class="sd-f-detail-title">ALL ' + fTraj.length + ' TRANSITIONS APPLIED</div>' +
              '<div class="sd-f-detail-body">PLAY auto-rerolls.  <span class="sd-q-est">q</span> is preserved, so the next trajectory builds on what we have.</div>' +
            '</div>';
        }
        clearFPulse();
        return;
      }

      const t = fTraj[fCursor];
      const qCurrent = Q[t.sIdx * A + t.aIdx];
      const qNextEst = t.terminal ? 0 : Q[t.sNextIdx * A + t.aNextIdx];
      const target   = t.terminal ? t.r : (t.r + GAMMA * qNextEst);
      const tdErr    = target - qCurrent;
      const qNew     = qCurrent + alpha * tdErr;

      const aStr   = fullMove(t.a);
      const aNStr  = t.terminal ? '— (terminal)' : fullMove(t.aNext);
      const targetCalc = t.terminal
        ? fmt(t.r) + ' &nbsp;&nbsp; (no bootstrap — next state terminal)'
        : fmt(t.r) + ' + ' + fmt(qNextEst) + ' = <b>' + fmt(target) + '</b>';

      left.innerHTML =
        '<div class="sd-card-num">STEP 8 / 8</div>' +
        '<div class="sd-card-title">F — SARSA ON ONE TRAJECTORY</div>' +
        '<div class="sd-f-detail">' +
          '<div class="sd-f-detail-title">TRANSITION ' + (fCursor + 1) + ' / ' + fTraj.length + '</div>' +
          '<div class="sd-f-detail-body">' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">s</span> <span class="sd-f-row-rhs">' + stateLabel(t.s) + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">a</span> <span class="sd-f-row-rhs">' + aStr + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">r</span> <span class="sd-f-row-rhs sd-f-r">' + fmt(t.r) + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">s′</span> <span class="sd-f-row-rhs">' + stateLabel(t.sNext) + '</span></div>' +
            '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">a′</span> <span class="sd-f-row-rhs">' + aNStr + '</span></div>' +
            '<div class="sd-f-divider"></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">target = r + q[s′, a′]</span></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-eq">= ' + targetCalc + '</span></div>' +
            '<div class="sd-f-divider"></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">q[s, a]  was</span> <b>' + fmt(qCurrent) + '</b></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">TD error = target − q[s, a]</span> = <b class="sd-f-td">' + fmt(tdErr) + '</b></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-label">q[s, a] += α · (target − q[s, a])</span></div>' +
            '<div class="sd-f-calc-line"><span class="sd-f-calc-eq">= ' + fmt(qCurrent) + ' + ' + alpha.toFixed(2) + ' · ' + fmt(tdErr) + ' = <b class="sd-f-qnew">' + fmt(qNew) + '</b></span></div>' +
          '</div>' +
        '</div>';

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
      window.SARSA.update(Q, t.sIdx, t.a, t.r, t.sNextIdx, t.aNext, alpha, GAMMA, t.terminal);
      qtbl.update(Q, { suppressFlash: false });
      fCursor += 1;
      renderFTape();
      renderFDetail();
      return true;
    }

    function fReroll() {
      fTraj = genTrajectory(Q, eps, fRng, 20);
      fCursor = 0;
      qtbl.update(Q, { suppressFlash: true });
      renderFTape();
      renderFDetail();
    }

    function fClearQ() {
      Q = window.SARSA.makeQ();
      qtbl.update(Q, { suppressFlash: true });
      renderFDetail();
    }

    /* ---- PLAY mode ---- */
    function playButton() { return document.getElementById('sd-f-play'); }
    function setPlayLabel(isPlay) {
      const b = playButton();
      if (b) b.textContent = isPlay ? '⏸ PAUSE' : '▶ PLAY';
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
      }, PLAY_MS);
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
        /* F step — live demo.  Show F controls, render detail panel on
           the left, build a fresh trajectory if we don't have one. */
        fCtrlsRow.style.display = '';
        if (!fTraj.length) fReroll();
        illusF();
        renderFDetail();
        return;
      }

      fCtrlsRow.style.display = 'none';

      /* Render the standard card on the left. */
      let html =
        '<div class="sd-card-num">STEP ' + (cursor + 1) + ' / ' + STEPS.length + '</div>' +
        '<div class="sd-card-title">' + step.title + '</div>' +
        '<div class="sd-card-body">' + step.body + '</div>';
      left.innerHTML = html;

      if (step.latex && step.latex.length) {
        for (const f of step.latex) {
          const box = document.createElement('div');
          box.className = 'sd-card-formula';
          left.appendChild(box);
          window.Katex.render(f, box, true);
        }
      }
      if (step.foot) {
        const foot = document.createElement('div');
        foot.className = 'concept-formula-foot';
        foot.style.marginTop = '6px';
        foot.innerHTML = step.foot;
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

    /* F controls */
    document.getElementById('sd-f-play').addEventListener('click', togglePlay);
    document.getElementById('sd-f-step').addEventListener('click', () => { pausePlay(); applyCurrentFUpdate(); });
    document.getElementById('sd-f-reroll').addEventListener('click', () => { pausePlay(); fReroll(); });
    document.getElementById('sd-f-clear').addEventListener('click', () => { pausePlay(); fClearQ(); fReroll(); });
    document.getElementById('sd-f-alpha-range').addEventListener('input', (e) => {
      alpha = Math.max(0, Math.min(1, Number(e.target.value) / 100));
      document.getElementById('sd-f-alpha-val').textContent = alpha.toFixed(2);
      if (STEPS[cursor].id === 'F') renderFDetail();
    });

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

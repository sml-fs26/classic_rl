/* Scene — deriving SARSA, then watching it run on one trajectory.
 *
 *   Two halves:
 *
 *   1) Card stack (A → E4). Seven reveal cards walking the derivation
 *      from the goal ("we want a table q ≈ Q*") to the SARSA update
 *      rule. E3 shows the Robbins–Monro update in TWO explicit cases —
 *      "if q < target, push up; if q > target, push down" — and E4 then
 *      collapses both into the single line that students will recognise
 *      as SARSA. The collapse is the pedagogical punchline: α(target − q)
 *      already carries the right sign in both branches.
 *
 *   2) Live demo (F). Below the cards: a Q-table + a trajectory tape +
 *      a step-detail panel. Each click of NEXT TRANSITION applies the
 *      update we just derived to one (s, a, r, s', a') tuple, with the
 *      arithmetic spelled out and the changed Q-table cell pulsing.
 *      REROLL samples a fresh trajectory but KEEPS q, so successive
 *      rerolls let students watch the table take shape from sample
 *      experience — that's the whole point of model-free RL.
 *
 *   The trajectory uses ε-greedy (ε = 0.4) against the running q. With
 *   q = 0 at start, ε-greedy degenerates to uniform random; once a few
 *   cells have values, the policy starts exploiting them — which is
 *   exactly the dynamic SARSA exhibits at scale.
 */
(function () {
  window.scenes = window.scenes || {};

  const ACTIONS = window.Moves.MOVE_IDS;
  const A       = ACTIONS.length;
  const NB      = window.Battle.NUM_BUCKETS;
  const STATES  = window.Bellman.STATES;
  const N       = STATES.length;
  const GAMMA   = window.DATA.params.gammaDefault;        // 0.90

  /* ---- The seven cards. Each is one click in the derivation. ---- */
  const CARDS = [
    {
      num: '1 / 7',
      title: 'A — WE WANT A TABLE OF Q*',
      body:
        'Aim: build a table <span class="sd-q-est">q[s, a]</span> that approximates the optimal action-value ' +
        '<span class="sd-q">Q*(s, a)</span> at every state and action.',
      latex: [
        String.raw`\mathtt{q}[s, a] \;\approx\; Q^{\star}(s, a) \qquad \text{for all } s \in S,\; a \in A`,
      ],
    },
    {
      num: '2 / 7',
      title: 'B — INITIALISE THE TABLE',
      body:
        'We don\'t know <span class="sd-q">Q*</span> yet. Seed every entry of <span class="sd-q-est">q</span> ' +
        'to zero (or tiny noise so ties break randomly).',
      latex: [
        String.raw`\mathtt{q}[s, a] \;:=\; 0 \qquad \text{for all } (s, a)`,
      ],
    },
    {
      num: '3 / 7',
      title: 'D — PLAY THE GAME TO GENERATE A TRAJECTORY',
      body:
        'We don\'t have P. We <em>do</em> get to play. The world hands us a stream of ' +
        '(state, action, reward, next state) tuples — pick the next action by ε-greedy on the <em>current</em> ' +
        '<span class="sd-q-est">q</span>, and let the environment supply the rest.',
      latex: [
        String.raw`s_1 \;\xrightarrow{a_1}\; r_1 \;\xrightarrow{}\; s_2 \;\xrightarrow{a_2}\; r_2 \;\xrightarrow{}\; s_3 \;\xrightarrow{a_3}\; r_3 \;\xrightarrow{}\; \cdots`,
      ],
      foot: 'The second &laquo;A&raquo; in S-A-R-S-A is the action we pick at the next state — needed for the update on the previous step.',
    },
    {
      num: '4 / 7',
      title: 'E1 — REPLACE THE EXPECTATION WITH ONE SAMPLE',
      body:
        'By Bellman, <span class="sd-q">Q*(s, a)</span> is an expectation over the random next state and reward. ' +
        'We don\'t get the expectation — we get one sample. Drop the <span class="sd-q">E</span> and use it:',
      latex: [
        String.raw`Q^{\star}(s, a) \;=\; \mathbb{E}\!\left[\, R \;+\; \gamma\, Q^{\star}(S', A') \,\right]`,
        String.raw`\phantom{Q^{\star}(s, a)}\;\approx\; r \;+\; \gamma\, Q^{\star}(s', a')`,
      ],
      foot: 'One-sample Monte-Carlo estimate of the right-hand side.',
    },
    {
      num: '5 / 7',
      title: 'E2 — NAME THE RIGHT-HAND SIDE «TARGET»',
      body:
        'We don\'t have <span class="sd-q">Q*</span> on the right either — only our table <span class="sd-q-est">q</span>. ' +
        'Plug it in. Call the resulting number the <b>target</b>: that\'s where we want <span class="sd-q-est">q[s, a]</span> to be.',
      latex: [
        String.raw`\mathtt{target} \;:=\; r \;+\; \gamma\, \mathtt{q}[s', a']`,
        String.raw`\mathtt{q}[s, a] \;\stackrel{\text{want}}{=}\; \mathtt{target}`,
      ],
    },
    {
      num: '6 / 7',
      title: 'E3 — MOVE q TOWARD THE TARGET (TWO CASES)',
      body:
        'If <span class="sd-q-est">q[s, a]</span> is <em>below</em> the target, nudge it <em>up</em>. ' +
        'If it\'s <em>above</em>, nudge it <em>down</em>. Step size <span class="sd-alpha">α ∈ (0, 1)</span> ' +
        'is small enough not to overshoot.',
      latex: [
        String.raw`\begin{aligned}
          \text{if } \mathtt{q}[s, a] &< \mathtt{target}: && \mathtt{q}[s, a] \;\mathrel{+}=\; \alpha\,(\,\mathtt{target} - \mathtt{q}[s, a]\,) \\[4pt]
          \text{if } \mathtt{q}[s, a] &> \mathtt{target}: && \mathtt{q}[s, a] \;\mathrel{-}=\; \alpha\,(\,\mathtt{q}[s, a] - \mathtt{target}\,)
        \end{aligned}`,
      ],
      foot: 'Same step size α in both cases. Same magnitude of correction. Only the sign differs — and α(target − q) already carries that sign for free.',
    },
    {
      num: '7 / 7',
      title: 'E4 — THE TWO CASES COLLAPSE INTO ONE LINE',
      body:
        'Flip the sign of the «above» case: <span class="sd-q-est">−α(q − target)</span> = <span class="sd-q-est">+α(target − q)</span>. ' +
        'Both branches become the same update. <b>This is SARSA.</b>',
      latex: [
        String.raw`\boxed{\;\mathtt{q}[s, a] \;\leftarrow\; \mathtt{q}[s, a] \;+\; \alpha\,\bigl(\,\mathtt{target} \;-\; \mathtt{q}[s, a]\,\bigr)\;}`,
      ],
      foot: 'TD error = target − current estimate. Apply this once per (s, a, r, s′, a′) tuple as the agent plays.',
    },
  ];

  /* Short labels used in the F widget for move buttons / trajectory tape. */
  function shortMove(id) {
    if (id === 'quick_attack') return 'QUICK';
    if (id === 'thunderbolt')  return 'BOLT';
    if (id === 'thunder')      return 'THUN';
    return id;
  }
  function fullMove(id) {
    return (window.Moves.MOVE_BY_ID[id] && window.Moves.MOVE_BY_ID[id].name) || id;
  }
  function bucketName(b) {
    return (window.Battle.BUCKETS[b] || 'fainted').toUpperCase();
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
    if (s.terminal) return s.win ? 'WIN' : 'LOSS';
    return bucketName(s.your) + ' / ' + bucketName(s.opp);
  }

  /* Generate ONE trajectory by playing ε-greedy against the current Q.
     Returns a list of transitions: [{ s, sIdx, a, aIdx, r, sNext, sNextIdx, aNext, aNextIdx, terminal }, …].
     For the terminal transition, aNext / aNextIdx / sNextIdx are null. */
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
          terminal: true,
          win: !!sNext.win, lose: !!sNext.lose,
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

      s = sNext;
      sIdx = sNextIdx;
      aId  = aNextId;
      aIdx = aNextIdx;
    }
    return out;
  }

  window.scenes.sceneSarsaDerive = function (root) {
    root.classList.add('scene-pad', 'sd-scene');
    root.innerHTML = '';

    /* ====================================================================
       PART 1 — DERIVATION CARDS
       ==================================================================== */

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'DERIVING SARSA';
    root.appendChild(heading);

    /* Legend — Q (true) vs q (table). */
    const legend = document.createElement('div');
    legend.className = 'sd-legend';
    legend.innerHTML =
      '<span class="sd-legend-chip q">Q(s, a)</span><span>true (unknown) action-value function</span>' +
      '<span class="sd-legend-chip q-est">q[s, a]</span><span>our table estimate — typewriter q</span>';
    root.appendChild(legend);

    const ctrls = document.createElement('div');
    ctrls.className = 'sd-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="sd-step">▶ STEP</button>' +
      '<button class="poke-btn" id="sd-reveal">REVEAL ALL</button>' +
      '<button class="poke-btn" id="sd-reset">RESET</button>' +
      '<div class="sd-status">CARD <b id="sd-card-idx">1</b> / ' + CARDS.length + '</div>';
    root.appendChild(ctrls);

    const stack = document.createElement('div');
    stack.className = 'sd-stack';
    root.appendChild(stack);

    const cardNodes = [];
    for (const c of CARDS) {
      const card = document.createElement('div');
      card.className = 'sd-card';
      card.innerHTML =
        '<div class="sd-card-num">STEP ' + c.num + '</div>' +
        '<div class="sd-card-title">' + c.title + '</div>' +
        '<div class="sd-card-body">' + c.body + '</div>';
      if (c.latex && c.latex.length) {
        for (const f of c.latex) {
          const box = document.createElement('div');
          box.className = 'sd-card-formula';
          card.appendChild(box);
          window.Katex.render(f, box, true);
        }
      }
      if (c.foot) {
        const foot = document.createElement('div');
        foot.className = 'concept-formula-foot';
        foot.style.marginTop = '6px';
        foot.innerHTML = c.foot;
        card.appendChild(foot);
      }
      stack.appendChild(card);
      cardNodes.push(card);
    }

    let cursor = 0;
    function applyCursor() {
      cardNodes.forEach((node, i) => node.classList.toggle('shown', i <= cursor));
      const el = document.getElementById('sd-card-idx');
      if (el) el.textContent = String(cursor + 1);
    }
    function stepCard()  { if (cursor < CARDS.length - 1) { cursor++; applyCursor(); } }
    function revealAll() { cursor = CARDS.length - 1; applyCursor(); }
    function resetCards(){ cursor = 0; applyCursor(); }

    document.getElementById('sd-step').addEventListener('click', stepCard);
    document.getElementById('sd-reveal').addEventListener('click', revealAll);
    document.getElementById('sd-reset').addEventListener('click', resetCards);

    applyCursor();

    /* &run flag: reveal everything for headless capture. */
    if (/[#&?]run\b/.test(window.location.hash)) setTimeout(revealAll, 200);
    /* &sd=N flag: jump to card N. */
    const sdMatch = (window.location.hash || '').match(/[#&?]sd=(\d+)/);
    if (sdMatch) {
      const target = Math.min(CARDS.length - 1, Math.max(0, parseInt(sdMatch[1], 10) - 1));
      setTimeout(() => { cursor = target; applyCursor(); }, 100);
    }

    /* ====================================================================
       PART 2 — LIVE DEMO (F) : SARSA ON ONE TRAJECTORY
       ==================================================================== */

    const fHeader = document.createElement('h3');
    fHeader.className = 'sd-f-header';
    fHeader.textContent = 'F — SARSA ON ONE TRAJECTORY';
    root.appendChild(fHeader);

    const fIntro = document.createElement('div');
    fIntro.className = 'sd-f-intro';
    fIntro.innerHTML =
      'Press <kbd>▶ NEXT TRANSITION</kbd> to apply the rule from E4 to one ' +
      '<span class="sd-q-est">(s, a, r, s′, a′)</span> tuple. The cell in <span class="sd-q-est">q</span> ' +
      'being updated pulses; the arithmetic on the right shows the target and the nudge. ' +
      '<kbd>⟲ REROLL</kbd> samples a fresh trajectory but <em>keeps</em> <span class="sd-q-est">q</span> — ' +
      'watch the table fill in over many rerolls.';
    root.appendChild(fIntro);

    /* Trajectory tape */
    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'sd-f-tape-wrap';
    root.appendChild(tapeWrap);

    const tapeTitle = document.createElement('div');
    tapeTitle.className = 'sd-f-tape-title';
    tapeTitle.innerHTML = 'TRAJECTORY <span class="sd-f-tape-count" id="sd-f-tape-count"></span>';
    tapeWrap.appendChild(tapeTitle);

    const tape = document.createElement('div');
    tape.className = 'sd-f-tape';
    tapeWrap.appendChild(tape);

    /* Q-table + step-detail row */
    const fRow = document.createElement('div');
    fRow.className = 'sd-f-row';
    root.appendChild(fRow);

    const qHost = document.createElement('div');
    qHost.className = 'sd-f-q';
    fRow.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const detail = document.createElement('div');
    detail.className = 'sd-f-detail';
    fRow.appendChild(detail);

    /* F controls */
    const fCtrls = document.createElement('div');
    fCtrls.className = 'sd-f-ctrls';
    fCtrls.innerHTML =
      '<button class="poke-btn" id="sd-f-step">▶ NEXT TRANSITION</button>' +
      '<button class="poke-btn" id="sd-f-reroll">⟲ REROLL TRAJECTORY</button>' +
      '<button class="poke-btn" id="sd-f-clear">CLEAR q</button>' +
      '<div class="sd-f-alpha">α <span id="sd-f-alpha-val">0.20</span>' +
        '<input type="range" id="sd-f-alpha-range" min="0" max="100" value="20">' +
      '</div>';
    root.appendChild(fCtrls);

    /* ---- F state ---- */
    let Q       = window.SARSA.makeQ();
    let rng     = window.Battle.makeRng(20260514);
    let alpha   = 0.20;
    const eps   = 0.40;
    let traj    = [];
    let fCursor = 0;             /* index of next transition to apply */
    let trajId  = 0;             /* increments on reroll */

    function setAlpha(a) {
      alpha = Math.max(0, Math.min(1, a));
      const el = document.getElementById('sd-f-alpha-val');
      if (el) el.textContent = alpha.toFixed(2);
    }
    document.getElementById('sd-f-alpha-range').addEventListener('input', (e) => {
      setAlpha(Number(e.target.value) / 100);
      /* Re-render detail with new α (preview the next-step arithmetic). */
      renderDetail();
    });
    setAlpha(0.20);

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

    function renderTape() {
      const n = traj.length;
      document.getElementById('sd-f-tape-count').textContent =
        n > 0 ? '· ' + n + ' transition' + (n === 1 ? '' : 's') + ', cursor at ' + Math.min(fCursor, n) : '';
      let html = '';
      for (let i = 0; i < n; i++) {
        const t = traj[i];
        const active = (i === fCursor) ? ' active' : '';
        const applied = (i < fCursor) ? ' applied' : '';
        html +=
          '<div class="sd-f-tape-tuple' + active + applied + '" data-i="' + i + '">' +
            '<div class="sd-f-tape-t">t = ' + (i + 1) + '</div>' +
            tapeStateThumb(t.s) +
            '<div class="sd-f-tape-arrow">' + shortMove(t.a) + '<br><span class="sd-f-tape-r">' + fmt(t.r) + '</span></div>' +
          '</div>';
        if (i === n - 1) {
          /* Show the terminal next-state at the end. */
          html += '<div class="sd-f-tape-tuple terminal-tail">' + tapeStateThumb(t.sNext) + '</div>';
        }
      }
      tape.innerHTML = html;
    }

    function renderDetail() {
      if (!traj.length || fCursor >= traj.length) {
        if (!traj.length) {
          detail.innerHTML =
            '<div class="sd-f-detail-title">NO TRANSITIONS YET</div>' +
            '<div class="sd-f-detail-body">Reroll to sample a trajectory.</div>';
        } else {
          detail.innerHTML =
            '<div class="sd-f-detail-title">ALL ' + traj.length + ' TRANSITIONS APPLIED</div>' +
            '<div class="sd-f-detail-body">Reroll to draw a fresh trajectory. ' +
              '<span class="sd-q-est">q</span> is preserved, so the next trajectory builds on what we have.</div>';
        }
        return;
      }

      const t = traj[fCursor];
      const qCurrent = Q[t.sIdx * A + t.aIdx];
      const qNextEst = t.terminal ? 0 : Q[t.sNextIdx * A + t.aNextIdx];
      const target   = t.terminal ? t.r : (t.r + GAMMA * qNextEst);
      const tdErr    = target - qCurrent;
      const qNew     = qCurrent + alpha * tdErr;

      const sStr   = stateLabel(t.s);
      const aStr   = fullMove(t.a);
      const sNStr  = stateLabel(t.sNext);
      const aNStr  = t.terminal ? '— (terminal)' : fullMove(t.aNext);
      const qNStr  = t.terminal ? '0 (terminal)' : fmt(qNextEst);
      const targetCalc = t.terminal
        ? fmt(t.r) + ' &nbsp;&nbsp; (no bootstrap — next state terminal)'
        : fmt(t.r) + ' + ' + GAMMA.toFixed(2) + ' &middot; ' + fmt(qNextEst) + ' = <b>' + fmt(target) + '</b>';

      detail.innerHTML =
        '<div class="sd-f-detail-title">TRANSITION ' + (fCursor + 1) + ' / ' + traj.length + '</div>' +
        '<div class="sd-f-detail-body">' +
          '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">s</span> <span class="sd-f-row-rhs">' + sStr + '</span></div>' +
          '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">a</span> <span class="sd-f-row-rhs">' + aStr + '</span></div>' +
          '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">r</span> <span class="sd-f-row-rhs sd-f-r">' + fmt(t.r) + '</span></div>' +
          '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">s′</span> <span class="sd-f-row-rhs">' + sNStr + '</span></div>' +
          '<div class="sd-f-row-eq"><span class="sd-f-row-lhs">a′</span> <span class="sd-f-row-rhs">' + aNStr + '</span></div>' +
          '<div class="sd-f-divider"></div>' +
          '<div class="sd-f-calc-line"><span class="sd-f-calc-label">target = r + γ · q[s′, a′]</span></div>' +
          '<div class="sd-f-calc-line"><span class="sd-f-calc-eq">= ' + targetCalc + '</span></div>' +
          '<div class="sd-f-divider"></div>' +
          '<div class="sd-f-calc-line"><span class="sd-f-calc-label">q[s, a]  was</span> <b>' + fmt(qCurrent) + '</b></div>' +
          '<div class="sd-f-calc-line"><span class="sd-f-calc-label">TD error = target − q[s, a]</span> = <b class="sd-f-td">' + fmt(tdErr) + '</b></div>' +
          '<div class="sd-f-calc-line"><span class="sd-f-calc-label">q[s, a] += α · (target − q[s, a])</span></div>' +
          '<div class="sd-f-calc-line"><span class="sd-f-calc-eq">= ' + fmt(qCurrent) + ' + ' + alpha.toFixed(2) + ' · ' + fmt(tdErr) + ' = <b class="sd-f-qnew">' + fmt(qNew) + '</b></span></div>' +
        '</div>';

      /* Highlight the cell being updated. */
      highlightCellForCurrentTuple(t);
    }

    function highlightCellForCurrentTuple(t) {
      /* Clear previous pulse. */
      const prev = qHost.querySelector('.q-cell.sd-pulse');
      if (prev) prev.classList.remove('sd-pulse');
      const cell = qtbl.getCellNode(t.sIdx);
      if (cell) {
        cell.classList.add('sd-pulse');
        /* Mark the action row inside that cell — adds .sd-row-mark to a.sIdx row. */
        const rows = cell.querySelectorAll('.q-bar-row');
        rows.forEach((row, i) => row.classList.toggle('sd-row-mark', i === t.aIdx));
      }
    }

    function applyCurrentUpdate() {
      if (fCursor >= traj.length) return;
      const t = traj[fCursor];
      window.SARSA.update(
        Q, t.sIdx, t.a, t.r,
        t.sNextIdx, t.aNext,
        alpha, GAMMA, t.terminal
      );
      qtbl.update(Q, { suppressFlash: false });
      fCursor += 1;
      renderTape();
      renderDetail();
      /* If we just landed on the after-everything state, clear cell pulse. */
      if (fCursor >= traj.length) {
        const prev = qHost.querySelector('.q-cell.sd-pulse');
        if (prev) prev.classList.remove('sd-pulse');
        qHost.querySelectorAll('.q-bar-row.sd-row-mark').forEach(r => r.classList.remove('sd-row-mark'));
      }
    }

    function reroll() {
      traj = genTrajectory(Q, eps, rng, 20);
      fCursor = 0;
      trajId += 1;
      qtbl.update(Q, { suppressFlash: true });
      renderTape();
      renderDetail();
    }

    function clearQ() {
      Q = window.SARSA.makeQ();
      qtbl.update(Q, { suppressFlash: true });
      renderDetail();
    }

    document.getElementById('sd-f-step').addEventListener('click', applyCurrentUpdate);
    document.getElementById('sd-f-reroll').addEventListener('click', reroll);
    document.getElementById('sd-f-clear').addEventListener('click', () => { clearQ(); reroll(); });

    /* Initial seed: one trajectory, cursor at 0, q all zeros. */
    reroll();

    return {
      onEnter() {
        /* Re-render to be safe on navigation back. */
        applyCursor();
        renderDetail();
      },
      onNextKey() {
        if (cursor < CARDS.length - 1) { stepCard(); return true; }
        return false;
      },
      onPrevKey() {
        if (cursor > 0) { cursor--; applyCursor(); return true; }
        return false;
      },
    };
  };
})();

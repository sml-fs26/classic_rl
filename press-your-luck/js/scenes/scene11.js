/* Scene 11 - SARSA: learn Q* by playing (the capstone).
 *
 *   THREE-STEP PAGER (one viewport per step):
 *     1  LEARN BY PLAYING  - manager framing + the goal: fill the same
 *        6x3 board, but from experience.  Right column = the blank board
 *        with the DP-oracle staircase ghosted as the (hidden) target.
 *     2  ONE GAME, ONE NUDGE - derive the SARSA update from Bellman by
 *        replacing the expectation with one observed sample
 *        (s, a, r, s', a').  Name epsilon as the explore/exploit dial
 *        (roll a fat pot you'd normally bank, to learn).  Right column =
 *        one sampled game laid out as a tape, the driving tuple bold.
 *     3  GRIND THE GAMES (live) - play real games vs the fixed rival,
 *        observing only (pot bucket, standing).  The board paints itself
 *        and its regions CONVERGE to the DP oracle from scene 9 (the same
 *        climbing staircase), tracked by a CLOSENESS-TO-Q* bar comparing
 *        the live q to window.DATA.oracleQ.  Controls: PLAY/PAUSE, +1 GAME,
 *        speed slider, epsilon slider; alpha fixed (labelled).  The auto-
 *        play is gated behind &run for headless capture.
 *
 *   SARSA operates over the 18-cell BUCKETED state (the displayed board):
 *   it plays the REAL game vs the rival via window.Pig.sample / rivalTurn
 *   but observes only window.Pig.observeIndex(state) = potBucket*3 +
 *   standing.  Reward is terminal and binary (+1 win / 0 loss), gamma = 1,
 *   so a q value IS a win probability.  One "transition" for SARSA is one
 *   of MY decisions; between my turns the rival auto-plays a whole turn.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* Engine handles (cold-entry safe: everything reads window.* at mount). */
  const Pig    = window.Pig || window.Battle;
  const Levers = window.Moves || window.Levers;
  const A_IDS  = (Levers && Levers.MOVE_IDS) || ['roll', 'hold'];
  const A      = A_IDS.length;                 // 2 (roll, hold)
  const N      = Pig.POT_BUCKETS * Pig.STANDINGS;   // 18 cells
  const GAMMA  = 1;

  /* Learning-rate (alpha) schedule.  The displayed Q-table is a BUCKETED
     view of a non-Markov projection, so a fixed alpha makes the learned
     argmax thrash near the staircase seam.  A Robbins-Monro per-cell decay
     alpha = ALPHA0 / (1 + visits[s,a]/ALPHA_TAU) lets each cell settle as
     it is visited - the board climbs to the oracle and stays put.  We
     report a single headline alpha (the start-of-run value) to the learner
     so the "step size" idea stays legible; the decay is an implementation
     detail named in the foot-note. */
  const ALPHA0    = 0.50;
  const ALPHA_TAU = 400;
  const ALPHA_MIN = 0.01;
  const ALPHA_LABEL = 0.50;   // headline value shown in the UI

  /* Exploration (epsilon) decays from the slider value toward a small floor
     so late play exploits the learned board (and the seam settles).  The
     slider sets the START epsilon; EPS_TAU games halves the gap to floor. */
  const EPS_MIN = 0.05;
  const EPS_TAU = 6000;

  const ROLL_IDX = A_IDS.indexOf('roll');
  const HOLD_IDX = A_IDS.indexOf('hold');

  /* The DP oracle (scene-9 ground truth).  oraclePolicy = the 18 region
     ids, the named SARSA convergence target (closeness bar compares to it).
     oracleQ = the exact-state win-probs, used only for the step-1 ghost. */
  const ORACLE_Q  = (window.DATA && window.DATA.oracleQ) || null;     // 36 win-probs [cell*2+leverIdx]
  const ORACLE_PI = (window.DATA && window.DATA.oraclePolicy) || null; // 18 lever ids

  function fmt2(v) {
    if (v == null || Number.isNaN(v)) return '.';
    return Number(v).toFixed(2);
  }
  function leverShort(id) { return T('vocab.' + id); }

  function epsAt(eps0, games) {
    return Math.max(EPS_MIN, eps0 * Math.exp(-games / EPS_TAU));
  }
  function alphaAt(visitCount) {
    return Math.max(ALPHA_MIN, ALPHA0 / (1 + visitCount / ALPHA_TAU));
  }

  /* ---------------------------------------------------------------
     SARSA over the bucketed observation, playing the REAL game.
     trainEpisode runs one whole game vs the rival, applying the
     on-policy update on every one of MY decisions, and returns the
     sequence of MY (observed) tuples so a tape can show what happened.

     ctx carries the run state for the decaying schedule:
       ctx.eps0    - the slider epsilon (start of the decay)
       ctx.games   - games played so far (drives the epsilon decay)
       ctx.visits  - Float64Array(N*A) per-(s,a) visit counts (drives the
                     per-cell Robbins-Monro alpha)
     Pass opts.learn=false to roll a game WITHOUT touching Q (used to
     pre-sample the step-2 illustration trajectory); then a fixed eps
     (ctx.eps0) and no visit bumps are used.
     --------------------------------------------------------------- */
  function trainEpisode(Q, ctx, rng, opts) {
    opts = opts || {};
    const learn = opts.learn !== false;        // default: apply updates
    const maxDecisions = opts.maxDecisions || 400;
    const eps = learn ? epsAt(ctx.eps0, ctx.games || 0)
                      : (ctx.eps0 != null ? ctx.eps0 : 0.30);
    const tape = [];

    let s = Pig.initialState();                 // my=0, riv=0, pot=0, turn 'me'
    let o = Pig.observeIndex(s);                // bucketed cell index
    let a = pickLever(Q, o, eps, rng);

    /* One on-policy SARSA backup, with a per-cell Robbins-Monro alpha. */
    function applyUpdate(oCur, aCur, r, oNext, aNext, terminal) {
      if (!learn) return;
      const sa = oCur * A + aCur;
      const alpha = alphaAt(ctx.visits ? ctx.visits[sa] : 0);
      if (ctx.visits) ctx.visits[sa] += 1;
      window.SARSA.update(Q, oCur, A_IDS[aCur], r,
        terminal ? -1 : oNext, terminal ? null : A_IDS[aNext], alpha, GAMMA, terminal);
    }

    for (let d = 0; d < maxDecisions; d++) {
      const res = Pig.sample(s, A_IDS[a], rng);  // one of MY decisions
      const log = res.log || {};

      if (res.terminal) {
        /* I banked to win - terminal +1, no bootstrap. */
        applyUpdate(o, a, res.reward, null, null, true);
        tape.push({ o, a, r: res.reward, terminal: true, win: true, lever: A_IDS[a], log });
        return { tape, win: true };
      }

      if (res.sNext.turn === 'rival') {
        /* HOLD or a bust: the rival now plays its whole fixed-rule turn. */
        const rt = Pig.rivalTurn(res.sNext.my, res.sNext.riv, rng);
        if (rt.rivalWon) {
          /* Rival reached the target on this turn - terminal LOSS (r = 0). */
          applyUpdate(o, a, 0, null, null, true);
          tape.push({ o, a, r: 0, terminal: true, win: false, lever: A_IDS[a],
                      bust: !!log.busted, log });
          return { tape, win: false };
        }
        /* Back to my turn at pot 0 with possibly-changed scores. */
        const sNext = { my: rt.my, riv: rt.riv, pot: 0, turn: 'me', terminal: false };
        const oNext = Pig.observeIndex(sNext);
        const aNext = pickLever(Q, oNext, eps, rng);
        applyUpdate(o, a, 0, oNext, aNext, false);
        tape.push({ o, a, r: 0, terminal: false, lever: A_IDS[a],
                    bust: !!log.busted, log });
        s = sNext; o = oNext; a = aNext;
        continue;
      }

      /* Rolled 2-6: my turn continues at the grown pot. */
      const sNext = res.sNext;
      const oNext = Pig.observeIndex(sNext);
      const aNext = pickLever(Q, oNext, eps, rng);
      applyUpdate(o, a, 0, oNext, aNext, false);
      tape.push({ o, a, r: 0, terminal: false, lever: A_IDS[a], log });
      s = sNext; o = oNext; a = aNext;
    }
    return { tape, win: false };
  }

  /* eps-greedy over the 2 levers at a bucketed cell.  Reuse window.SARSA
     when present (shared with the precompute); fall back to a local pick. */
  function pickLever(Q, o, eps, rng) {
    if (window.SARSA && window.SARSA.pickEpsGreedy) {
      const id = window.SARSA.pickEpsGreedy(Q, o, eps, rng);
      const k = A_IDS.indexOf(id);
      return k < 0 ? 0 : k;
    }
    if (rng() < eps) return Math.floor(rng() * A);
    const base = o * A;
    let best = 0;
    for (let k = 1; k < A; k++) if (Q[base + k] > Q[base + best]) best = k;
    return best;
  }

  function makeQ() {
    if (window.SARSA && window.SARSA.makeQ) return window.SARSA.makeQ();
    return new Float32Array(N * A);
  }

  /* Closeness to the DP oracle = fraction of the 18 cells whose learned
     BEST lever matches the oracle's region (window.DATA.oraclePolicy).
     This is the contract's named convergence target: the playbook is the
     two coloured regions, and "closeness" is how much of that staircase
     the learner has recovered.  (We deliberately do NOT compare the raw
     win-prob VALUES: a state value here is an EXACT-state win prob, but
     SARSA only sees the lossy 6x3 bucket, so its q sits systematically
     below the exact oracle - the values can never coincide even though the
     regions do.  The seam's near-tie cells - where exact ROLL/HOLD differ
     by under a percent - are exactly where the lens blurs, so the bar
     settles a notch below 100% rather than pretending at perfection.) */
  function convergencePct(Q) {
    if (!ORACLE_PI) return 0;
    let agree = 0, counted = 0;
    for (let i = 0; i < N; i++) {
      const oid = ORACLE_PI[i];
      if (oid !== 'roll' && oid !== 'hold') continue;
      counted++;
      const base = i * A;
      const best = (Q[base + ROLL_IDX] >= Q[base + HOLD_IDX]) ? 'roll' : 'hold';
      if (best === oid) agree++;
    }
    if (!counted) return 0;
    return 100 * agree / counted;
  }

  /* ---------------------------------------------------------------
     Scene
     --------------------------------------------------------------- */
  window.scenes.scene11 = function (root) {
    root.className = 'scene-pad s11-scene';
    root.innerHTML = '';

    const STEP_COUNT = 3;
    let cursor = 0;

    /* Heading. */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene11.heading');
    root.appendChild(heading);

    /* Pager controls. */
    const ctrls = document.createElement('div');
    ctrls.className = 's11-controls';
    ctrls.innerHTML =
      '<button class="pyl-btn" id="s11-prev">' + T('s11.prev') + '</button>' +
      '<button class="pyl-btn" id="s11-next">' + T('s11.next') + '</button>' +
      '<button class="pyl-btn" id="s11-reset">' + T('s11.reset') + '</button>' +
      '<div class="s11-status" id="s11-status"></div>';
    root.appendChild(ctrls);

    /* Two-column row: left = step text, right = board + tape. */
    const row = document.createElement('div');
    row.className = 's11-row';
    root.appendChild(row);

    const left = document.createElement('div');
    left.className = 's11-left';
    row.appendChild(left);

    const right = document.createElement('div');
    right.className = 's11-right';
    row.appendChild(right);

    /* Right column: caption / convergence strip, the board, the tape. */
    const cap = document.createElement('div');
    cap.className = 's11-cap';
    right.appendChild(cap);

    const boardHost = document.createElement('div');
    boardHost.className = 's11-board-host';
    right.appendChild(boardHost);
    const board = window.QTable.mount(boardHost, { miniCards: true, showQ: true });

    const tapeWrap = document.createElement('div');
    tapeWrap.className = 'pyl-return-tape s11-tape';
    right.appendChild(tapeWrap);

    /* Legend: q (learned) vs oracle (target). */
    const legend = document.createElement('div');
    legend.className = 's11-legend';
    legend.innerHTML =
      '<span class="s11-legend-item"><span class="s11-swatch s11-sw-q"></span>' + T('s11.legend.q') + '</span>' +
      '<span class="s11-legend-item"><span class="s11-swatch s11-sw-tgt"></span>' + T('s11.legend.tgt') + '</span>';
    right.appendChild(legend);

    /* ---- live-run state ---- */
    let Q       = makeQ();
    let rng     = Pig.makeRng(20260530);
    let games   = 0;
    let visits  = new Float64Array(N * A);   // per-(s,a) counts -> alpha decay
    /* ctx threaded into every training game: eps0 = the slider value (start
       of the epsilon decay), games + visits drive the decaying schedule. */
    const ctx   = { eps0: 0.30, get games() { return games; }, visits };
    let lastTape = null;
    let lastWin = null;

    let playing   = false;
    let playTimer = null;
    let speedLvl  = 2;                       // 0 slow .. 4 fast
    const SPEED_MS    = [620, 420, 280, 160, 80];
    const GAMES_PER_TICK = [1, 1, 2, 4, 8];  // grind faster at higher speeds

    /* Pre-sampled single game for step 2's tape (fixed seed -> stable). */
    let sampleTape = null;
    function ensureSampleTape() {
      if (sampleTape) return sampleTape;
      const r = Pig.makeRng(20260201);
      /* Train a throwaway table a little so the sampled game is a realistic
         mix of rolls/holds rather than all-roll from a zero table. */
      const q = makeQ();
      const sctx = { eps0: 0.30, games: 0, visits: new Float64Array(N * A) };
      for (let i = 0; i < 80; i++) { trainEpisode(q, sctx, r); sctx.games++; }
      const res = trainEpisode(q, { eps0: 0.30 }, r, { learn: false });
      sampleTape = res;
      return sampleTape;
    }

    /* ---------- rendering helpers ---------- */

    function renderTape(host, tape, win, opts) {
      opts = opts || {};
      host.innerHTML = '';
      const label = document.createElement('span');
      label.className = 'pyl-tape-label';
      label.textContent = opts.label || '';
      host.appendChild(label);
      if (!tape || !tape.length) {
        const none = document.createElement('span');
        none.className = 's11-tape-none';
        none.textContent = opts.empty || '';
        host.appendChild(none);
        return;
      }
      tape.forEach((t, i) => {
        const cell = document.createElement('div');
        let cls = 'pyl-tape-step pyl-tape-' + t.lever;
        if (t.bust) cls += ' pyl-tape-bust';
        if (t.terminal) cls += ' pyl-tape-terminal';
        if (opts.activeIdx === i) cls += ' s11-tape-active';
        cell.className = cls;
        const leverTxt = t.bust ? T('vocab.bust') : leverShort(t.lever);
        let rTxt;
        if (t.terminal) rTxt = (t.win ? '+1' : '0') + (t.win ? ' ★' : '');
        else rTxt = '0';
        cell.innerHTML =
          '<span class="pyl-tape-lever">' + leverTxt + '</span>' +
          '<span class="pyl-tape-r">' + rTxt + '</span>';
        host.appendChild(cell);
      });
      if (tape.length && win != null) {
        const out = document.createElement('div');
        out.className = 's11-tape-outcome ' + (win ? 's11-win' : 's11-lose');
        out.textContent = win ? T('s11.win') : T('s11.lose');
        host.appendChild(out);
      }
    }

    /* Paint the DP-oracle staircase as a ghost overlay (dashed seam) so the
       learner can see the target the live board is converging toward. */
    function paintOracleGhost(on) {
      for (let i = 0; i < N; i++) {
        const node = board.getCellNode(i);
        if (!node) continue;
        node.classList.toggle('s11-oracle-roll', on && ORACLE_PI && ORACLE_PI[i] === 'roll');
        node.classList.toggle('s11-oracle-hold', on && ORACLE_PI && ORACLE_PI[i] === 'hold');
      }
    }

    function renderConvergence() {
      const pct = convergencePct(Q);
      cap.classList.add('s11-cap-conv');
      cap.innerHTML =
        '<div class="s11-conv-row">' +
          '<span class="s11-conv-label">' + T('s11.conv.label') + '</span>' +
          '<span class="s11-conv-track"><span class="s11-conv-fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
          '<span class="s11-conv-val">' + pct.toFixed(0) + '%</span>' +
        '</div>' +
        '<div class="s11-games" id="s11-games">' + T('s11.games', { n: games }) + '</div>';
    }

    function setCaption(text) {
      cap.classList.remove('s11-cap-conv');
      cap.textContent = text || '';
    }

    /* ---------- live controls (built into the left column on step 3) ---------- */
    function controlsHTML() {
      const epsPct = Math.round(ctx.eps0 * 100);
      return (
        '<div class="s11-ctrls">' +
          '<button class="pyl-btn s11-play" id="s11-play">' + (playing ? T('s11.pause') : T('s11.play')) + '</button>' +
          '<button class="pyl-btn" id="s11-game">' + T('s11.next_game') + '</button>' +
          '<div class="s11-slider s11-speed">' +
            '<span class="s11-slabel">' + T('s11.speed') + '</span>' +
            '<span class="s11-sedge">' + T('s11.speed.slow') + '</span>' +
            '<input type="range" id="s11-speed-range" min="0" max="4" step="1" value="' + speedLvl + '">' +
            '<span class="s11-sedge">' + T('s11.speed.fast') + '</span>' +
          '</div>' +
          '<div class="s11-slider s11-eps">' +
            '<span class="s11-slabel">' + T('s11.eps') + ' <b id="s11-eps-val">' + ctx.eps0.toFixed(2) + '</b></span>' +
            '<input type="range" id="s11-eps-range" min="0" max="100" step="5" value="' + epsPct + '">' +
          '</div>' +
          '<div class="s11-alpha">' + T('s11.alpha', { a: ALPHA_LABEL.toFixed(2) }) + '</div>' +
        '</div>'
      );
    }

    function wireControls() {
      const play = document.getElementById('s11-play');
      if (play) play.addEventListener('click', togglePlay);
      const game = document.getElementById('s11-game');
      if (game) game.addEventListener('click', () => { pausePlay(); playOneGame(); });
      const spd = document.getElementById('s11-speed-range');
      if (spd) spd.addEventListener('input', (e) => {
        speedLvl = Math.max(0, Math.min(4, parseInt(e.target.value, 10) || 0));
      });
      const epsEl = document.getElementById('s11-eps-range');
      if (epsEl) epsEl.addEventListener('input', (e) => {
        ctx.eps0 = Math.max(0, Math.min(1, (parseInt(e.target.value, 10) || 0) / 100));
        const lbl = document.getElementById('s11-eps-val');
        if (lbl) lbl.textContent = ctx.eps0.toFixed(2);
      });
    }

    /* ---------- the live loop ---------- */
    function playOneGame(suppressFlash) {
      const res = trainEpisode(Q, ctx, rng);
      games += 1;
      lastTape = res.tape;
      lastWin = res.win;
      board.update(Q, { suppressFlash: !!suppressFlash });
      renderConvergence();
      renderTape(tapeWrap, lastTape, lastWin, {
        label: T('s11.latest'), empty: T('s11.latest.none'),
      });
    }

    function playTick() {
      const batch = GAMES_PER_TICK[speedLvl];
      for (let i = 0; i < batch; i++) {
        const res = trainEpisode(Q, ctx, rng);
        games += 1;
        lastTape = res.tape;
        lastWin = res.win;
      }
      board.update(Q, { suppressFlash: false });
      renderConvergence();
      renderTape(tapeWrap, lastTape, lastWin, {
        label: T('s11.latest'), empty: T('s11.latest.none'),
      });
    }

    function schedule() {
      playTimer = setTimeout(() => {
        playTimer = null;
        if (!playing) return;
        playTick();
        if (playing) schedule();
      }, SPEED_MS[speedLvl]);
    }
    function startPlay() {
      if (playing) return;
      playing = true;
      setPlayLabel();
      schedule();
    }
    function pausePlay() {
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      playing = false;
      setPlayLabel();
    }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }
    function setPlayLabel() {
      const b = document.getElementById('s11-play');
      if (b) b.textContent = playing ? T('s11.pause') : T('s11.play');
    }

    /* ---------- per-step render ---------- */
    function renderStep1() {
      left.innerHTML =
        '<div class="s11-kicker">' + T('s11.step1.kicker') + '</div>' +
        '<div class="s11-title">' + T('s11.step1.title') + '</div>' +
        '<div class="s11-body">' + T('s11.step1.body') + '</div>';
      const fbox = document.createElement('div');
      fbox.className = 's11-formula';
      left.appendChild(fbox);
      window.Katex.render(
        String.raw`\mathtt{q}[s, a] \;\longrightarrow\; Q^{\star}(s, a)
          \qquad \text{for all } s \in S,\; a \in A`,
        fbox, true);
      const foot = document.createElement('div');
      foot.className = 's11-foot';
      foot.textContent = T('s11.step1.foot');
      left.appendChild(foot);

      /* Right: blank board, oracle ghosted as the target. */
      board.reset();
      board.update(makeQ(), { suppressFlash: true });
      paintOracleGhost(true);
      setCaption(T('s11.step1.cap'));
      renderTape(tapeWrap, null, null, { label: T('s11.tape.title'), empty: '' });
    }

    function renderStep2() {
      left.innerHTML =
        '<div class="s11-kicker">' + T('s11.step2.kicker') + '</div>' +
        '<div class="s11-title">' + T('s11.step2.title') + '</div>' +
        '<div class="s11-body">' + T('s11.step2.body') + '</div>';

      const f1 = document.createElement('div');
      f1.className = 's11-formula';
      left.appendChild(f1);
      window.Katex.render(
        String.raw`\underbrace{Q^{\star}(s,a) = \mathbb{E}\!\left[\, R + Q^{\star}(S',A') \,\right]}_{\text{Bellman: an average}}
          \;\approx\; \underbrace{r + \mathtt{q}[s',a']}_{\text{one game}}`,
        f1, true);

      const f2 = document.createElement('div');
      f2.className = 's11-formula s11-formula-box';
      left.appendChild(f2);
      window.Katex.render(
        String.raw`\boxed{\;\mathtt{q}[s,a] \;\leftarrow\; \mathtt{q}[s,a]
          \;+\; \alpha\,\bigl(\, \underbrace{r + \mathtt{q}[s',a']}_{\text{target}} \;-\; \mathtt{q}[s,a] \,\bigr)\;}`,
        f2, true);

      const epsBox = document.createElement('div');
      epsBox.className = 's11-eps-note';
      epsBox.innerHTML = '<span class="s11-eps-mark">ε</span> ' + T('s11.step2.eps');
      left.appendChild(epsBox);

      const foot = document.createElement('div');
      foot.className = 's11-foot';
      foot.textContent = T('s11.step2.foot');
      left.appendChild(foot);

      /* Right: one sampled game; emphasise the first non-terminal tuple. */
      const samp = ensureSampleTape();
      board.reset();
      board.update(makeQ(), { suppressFlash: true });
      paintOracleGhost(false);
      /* Highlight the driving tuple's cell on the board. */
      let activeIdx = 0;
      for (let i = 0; i < samp.tape.length; i++) {
        if (!samp.tape[i].terminal) { activeIdx = i; break; }
      }
      const activeCell = board.getCellNode(samp.tape[activeIdx].o);
      if (activeCell) activeCell.classList.add('s11-active-cell');
      setCaption(T('s11.step2.cap'));
      renderTape(tapeWrap, samp.tape, samp.win, {
        label: T('s11.tape.title'), activeIdx,
      });
    }

    function renderStep3() {
      left.innerHTML =
        '<div class="s11-kicker">' + T('s11.step3.kicker') + '</div>' +
        '<div class="s11-title">' + T('s11.step3.title') + '</div>' +
        '<div class="s11-body">' + T('s11.step3.body') + '</div>' +
        controlsHTML() +
        '<div class="s11-runhint">' + T('s11.run_hint') + '</div>';
      wireControls();

      paintOracleGhost(false);
      board.update(Q, { suppressFlash: true });
      renderConvergence();
      renderTape(tapeWrap, lastTape, lastWin, {
        label: T('s11.latest'), empty: T('s11.latest.none'),
      });
    }

    function clearBoardOverlays() {
      for (let i = 0; i < N; i++) {
        const node = board.getCellNode(i);
        if (!node) continue;
        node.classList.remove('s11-active-cell', 's11-oracle-roll', 's11-oracle-hold');
      }
    }

    function applyCursor() {
      pausePlay();
      clearBoardOverlays();
      document.getElementById('s11-status').textContent =
        T('s11.status', { i: cursor + 1, total: STEP_COUNT });
      document.getElementById('s11-prev').disabled = (cursor === 0);
      document.getElementById('s11-next').disabled = (cursor === STEP_COUNT - 1);
      if (cursor === 0) renderStep1();
      else if (cursor === 1) renderStep2();
      else renderStep3();
    }

    /* ---------- events ---------- */
    document.getElementById('s11-prev').addEventListener('click', () => {
      if (cursor > 0) { cursor--; applyCursor(); }
    });
    document.getElementById('s11-next').addEventListener('click', () => {
      if (cursor < STEP_COUNT - 1) { cursor++; applyCursor(); }
    });
    document.getElementById('s11-reset').addEventListener('click', () => {
      pausePlay();
      Q = makeQ();
      rng = Pig.makeRng(20260530);
      visits = new Float64Array(N * A);
      ctx.visits = visits;
      games = 0; lastTape = null; lastWin = null;
      cursor = 0;
      applyCursor();
    });

    applyCursor();

    /* &step=N - jump straight to step N (1..3); handy for verification. */
    const stepMatch = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (stepMatch) {
      const target = Math.min(STEP_COUNT - 1, Math.max(0, parseInt(stepMatch[1], 10) - 1));
      setTimeout(() => { cursor = target; applyCursor(); }, 60);
    }

    /* &run - jump to the live step and grind a converged board for headless
       capture, then keep the live loop running. */
    if (/[#&?]run\b/.test(window.location.hash)) {
      setTimeout(() => {
        cursor = STEP_COUNT - 1;
        applyCursor();
        /* Grind a chunk synchronously so the capture shows a board that has
           climbed to the oracle staircase, then start the live loop.  ~15k
           games on the fixed seed lands at ~94% closeness with the bottom
           rows fully ROLL and the 21+ row fully HOLD - the cleanest single
           snapshot of the converged staircase. */
        speedLvl = 4;
        for (let i = 0; i < 15000; i++) { trainEpisode(Q, ctx, rng); games += 1; }
        const r = trainEpisode(Q, ctx, rng); games += 1;
        lastTape = r.tape; lastWin = r.win;
        board.update(Q, { suppressFlash: true });
        renderConvergence();
        renderTape(tapeWrap, lastTape, lastWin, {
          label: T('s11.latest'), empty: T('s11.latest.none'),
        });
        startPlay();
      }, 200);
    }

    return {
      onEnter() { applyCursor(); },
      onLeave() { pausePlay(); },
      onNextKey() {
        if (cursor < STEP_COUNT - 1) { cursor++; applyCursor(); return true; }
        return false;
      },
      onPrevKey() {
        if (cursor > 0) { cursor--; applyCursor(); return true; }
        return false;
      },
    };
  };
})();

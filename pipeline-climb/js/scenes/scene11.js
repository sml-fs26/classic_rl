/* Scene 11 - "SARSA: learn by selling" (the RL capstone for Pipeline Climb).
 *
 *   A three-step pager; one step shows at a time so the whole thing fits one
 *   viewport. The pedagogy mirrors the sibling last-minute-pricing capstone,
 *   re-themed end to end onto the sales pipeline:
 *
 *     STEP 1  DERIVE.  Bellman (scene 8) says a lever's value is an
 *             EXPECTATION over every way the STAGE DIE could fall. The rep
 *             never gets those odds, so replace the expectation with ONE
 *             observed touch (r + q[s',a']) and inch q toward it by alpha.
 *             Three stacked KaTeX cards walk the transformation; the empty
 *             Q-table sits on the right, the board the learner is about to fill.
 *
 *     STEP 2  EPSILON.  Name the explore / exploit dial. 1-eps: exploit the
 *             lever the table rates best; eps: try an unproven lever. A live
 *             single TOUCH (shared LadderCard + StageDie + Pipeline.sample)
 *             produces one concrete (s, a, r, s', a') tuple so "one sample"
 *             is tangible.
 *
 *     STEP 3  LIVE RUN.  Work the pipeline deal after deal with NO model of
 *             the STAGE DIE - only window.Pipeline.sample (the visible die) +
 *             window.SARSA, on-policy. Each deal starts COLD, picks levers
 *             eps-greedily, and updates q from what it actually saw. The
 *             Q-table fills in (its starred argmax column climbing toward the
 *             DP staircase from scene 9) and a window.LearningCurve charts
 *             return-per-deal climbing toward the optimal start value. A
 *             CLOSENESS-TO-Q* bar and a greedy-start-value readout track the
 *             climb. Controls: PLAY / PAUSE + NEXT DEAL + a relaxed SPEED
 *             slider + an epsilon-floor slider; alpha is fixed and labelled.
 *             A DP-PLAYBOOK toggle overlays scene 9's answer for comparison.
 *
 *   Hyperparameters (alpha 0.05, eps 0.35 -> 0.03 geometric, 4000 deals,
 *   pinned seed) were calibrated offline so the live greedy policy lands on
 *   window.DATA.policy (nurture / demo / demo / demo / hardclose) and the
 *   board converges to ~96% of window.DATA.Qstar. Cold-entry safe: everything
 *   is reconstructed from window.Pipeline / window.SARSA / window.DATA.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  const P      = window.Pipeline;
  const LEVERS = window.Levers;
  const SARSA  = window.SARSA;
  const LEVER_IDS = (LEVERS && LEVERS.MOVE_IDS) || ['nurture', 'demo', 'hardclose'];
  const A      = LEVER_IDS.length;                 // 3
  const N      = (P && P.NUM_RUNGS) || 5;          // 5
  const COLD   = (P && P.COLD != null) ? P.COLD : 0;
  const GAMMA  = (P && P.GAMMA != null) ? P.GAMMA : 1;

  /*, Live-training hyperparameters (calibrated offline, see header), */
  const ALPHA     = 0.05;          // learning rate (fixed, labelled)
  const EPS0      = 0.35;          // starting explore rate
  const EPS_MIN   = 0.03;          // floor of the schedule
  const TOTAL_EPS = 4000;          // training budget (deals) + eps-decay horizon
  const MAX_TOUCH = 80;            // safety cap on a single deal's length
  const SEED      = 20260604;      // pinned so the live board reproduces DATA.policy

  /*, The DP playbook the learner chases (precomputed, never hand-typed), */
  const QSTAR      = Float64Array.from((window.DATA && window.DATA.Qstar) || new Array(N * A).fill(0));
  const OPT_POLICY = (window.DATA && window.DATA.policy) || [];
  /* Optimal expected return from the natural start (COLD) = DATA.V[COLD]. */
  const OPT_START  = (window.DATA && window.DATA.V && window.DATA.V[COLD] != null)
    ? window.DATA.V[COLD] : 16.7;

  let QSTAR_L1 = 0;
  for (let i = 0; i < QSTAR.length; i++) QSTAR_L1 += Math.abs(QSTAR[i]);
  if (QSTAR_L1 === 0) QSTAR_L1 = 1;

  /*, small helpers, */
  function leverName(id) { return T('lever.' + id, (LEVERS.MOVE_BY_ID[id] || {}).name || id); }
  function rungName(r) { return T('rung.' + P.RUNGS[r], P.RUNG_DISPLAY[r]); }
  function num2(v) { return (v >= 0 ? '+' : '') + (Math.round(v * 100) / 100).toFixed(2); }

  /* eps schedule: GEOMETRIC decay from EPS0 to EPS_MIN over TOTAL_EPS deals.
     `epOneIdx` is the 1-indexed deal number. `epsFloor` (the live slider) lets
     a curious learner clamp the floor up to force re-exploration. */
  function scheduledEps(epOneIdx, epsFloor) {
    const frac = Math.min(1, epOneIdx / TOTAL_EPS);
    const e = EPS0 * Math.pow(EPS_MIN / EPS0, frac);
    return Math.max(epsFloor != null ? epsFloor : EPS_MIN, e);
  }

  /* Run ONE SARSA deal (one episode) on Q, in place, using only
     window.Pipeline.sample (the visible STAGE DIE) - no die odds are read.
     Every deal starts COLD. Returns the deal's total (undiscounted) return. */
  function runDeal(Q, eps, rng) {
    let s = P.initialState();                 // { rung: COLD, terminal: false }
    let sIdx = P.stateIndex(s);
    let aId  = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
    let G = 0;

    for (let t = 0; t < MAX_TOUCH; t++) {
      const out = P.sample(s, aId, rng);
      const sNext = out.sNext;
      const r = out.reward;
      G += r;
      if (sNext.terminal) {                    // SIGNED or LOST: drop the bootstrap
        SARSA.update(Q, sIdx, aId, r, -1, null, ALPHA, GAMMA, true);
        break;
      }
      const sNextIdx = P.stateIndex(sNext);
      const aNextId  = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);
      SARSA.update(Q, sIdx, aId, r, sNextIdx, aNextId, ALPHA, GAMMA, false);
      s = sNext; sIdx = sNextIdx; aId = aNextId;
    }
    return G;
  }

  /* Closeness to Q* in [0,100]: 0 when q is all-zero, 100 at an exact match.
     L1 distance normalised by sum|Q*|. */
  function convergencePct(Q) {
    let dist = 0;
    for (let i = 0; i < Q.length; i++) dist += Math.abs(Q[i] - QSTAR[i]);
    return Math.max(0, Math.min(100, 100 * (1 - dist / QSTAR_L1)));
  }

  /* How many of the 5 rungs' argmax lever matches the DP playbook. */
  function policyAgreement(Q) {
    const pol = window.QTable.policyFromQ(Q);
    let agree = 0;
    for (let r = 0; r < N; r++) if (pol[r] && pol[r] === OPT_POLICY[r]) agree++;
    return agree;
  }

  /* Exact expected return from COLD under the GREEDY policy of the current Q,
     by iterative policy evaluation over the true STAGE-DIE model. The ladder
     has cycles (STAY / DOWN), so this is a fixed-point sweep, not backward
     induction. This is policy *evaluation* of what the learner would actually
     do greedily; it climbs toward OPT_START as the learned policy improves.
     Cheap: 5 states. */
  function greedyStartValue(Q) {
    const pol = [];
    for (let r = 0; r < N; r++) {
      const base = r * A;
      let best = -Infinity, k = 0;
      for (let a = 0; a < A; a++) if (Q[base + a] > best) { best = Q[base + a]; k = a; }
      pol.push(LEVER_IDS[k]);
    }
    let V = new Float64Array(N);
    for (let it = 0; it < 1000; it++) {
      const Vn = new Float64Array(N);
      let maxDelta = 0;
      for (let r = 0; r < N; r++) {
        const succ = P.successors({ rung: r, terminal: false }, pol[r]);
        let v = 0;
        for (const tr of succ) {
          const vN = tr.sNext.terminal ? 0 : V[P.stateIndex(tr.sNext)];
          v += tr.p * (tr.reward + GAMMA * vN);
        }
        Vn[r] = v;
        const d = Math.abs(Vn[r] - V[r]);
        if (d > maxDelta) maxDelta = d;
      }
      V = Vn;
      if (maxDelta < 1e-10) break;
    }
    return V[COLD];
  }

  /* ============================================================ */
  window.scenes.scene11 = function (root) {
    root.classList.add('scene-pad', 'scene11-scene', 's11');
    root.innerHTML = '';

    /*, heading + pager controls, */
    const h = document.createElement('h2');
    h.className = 'concept-heading s11-heading';
    h.textContent = T('scene11.heading');
    root.appendChild(h);

    const bar = document.createElement('div');
    bar.className = 's11-pager';
    bar.innerHTML =
      '<button class="s11-btn" id="s11-prev">'  + T('scene11.prev')  + '</button>' +
      '<button class="s11-btn" id="s11-next">'  + T('scene11.next')  + '</button>' +
      '<button class="s11-btn" id="s11-reset">' + T('scene11.reset') + '</button>' +
      '<span class="s11-status" id="s11-status"></span>';
    root.appendChild(bar);

    /*, two-column body: left = explanation, right = board / illustration, */
    const rowEl = document.createElement('div');
    rowEl.className = 's11-row';
    root.appendChild(rowEl);

    const left = document.createElement('div');
    left.className = 's11-left';
    rowEl.appendChild(left);

    const rightCol = document.createElement('div');
    rightCol.className = 's11-right';
    rowEl.appendChild(rightCol);

    /* Right column caption + board host + oracle host (step 3). */
    const rcap = document.createElement('div');
    rcap.className = 's11-rcap';
    rightCol.appendChild(rcap);

    const boards = document.createElement('div');
    boards.className = 's11-boards';
    rightCol.appendChild(boards);

    const learnedHost = document.createElement('div');
    learnedHost.className = 's11-board-host';
    boards.appendChild(learnedHost);

    const oracleHost = document.createElement('div');
    oracleHost.className = 's11-board-host s11-oracle';
    oracleHost.style.display = 'none';
    boards.appendChild(oracleHost);

    /* Learning curve lives below the boards (step 3 only). */
    const curveWrap = document.createElement('div');
    curveWrap.className = 's11-curve-wrap';
    curveWrap.style.display = 'none';
    rightCol.appendChild(curveWrap);
    const curveCap = document.createElement('div');
    curveCap.className = 's11-curve-cap';
    curveWrap.appendChild(curveCap);
    const curveHost = document.createElement('div');
    curveHost.className = 's11-curve-host';
    curveWrap.appendChild(curveHost);

    const qtbl   = window.QTable.mount(learnedHost);
    const oracle = window.QTable.mount(oracleHost);
    oracle.update(QSTAR, { suppressFlash: true });   // static DP answer
    const curve  = window.LearningCurve.mount(curveHost, { W: 360, H: 150, window: 40 });

    /* ============================================================
       Live-training state (step 3)
       ============================================================ */
    let Q        = SARSA.makeQ();
    let rng      = P.makeRng(SEED);
    let epDone   = 0;
    let returns  = [];                     // return-per-deal, for the learning curve
    let epsFloor = EPS_MIN;                // raised by the live slider
    let playing   = false;
    let playTimer = null;
    let speedLvl  = 1;                     // 0..3; default 1 = relaxed + watchable
    let oracleShown = false;

    /* Deals folded into one animation tick, per speed level. Calibrated to be
       COMFORTABLE: even the fastest setting grows the curve only ~20 deals a
       tick, so the line and the board stay legible. The default (level 1) is
       a relaxed ~3 deals a tick - well under a third of a naive fast pace. */
    const BATCH = [1, 3, 8, 20];
    const TICK_MS = 140;

    function trainBatch(nDeals) {
      for (let i = 0; i < nDeals; i++) {
        /* epDone is 0-indexed; feed epDone+1 to the 1-indexed eps schedule. */
        const eps = scheduledEps(epDone + 1, epsFloor);
        const G = runDeal(Q, eps, rng);
        returns.push(G);
        epDone++;
      }
    }

    /* ============================================================
       STEP 1 - derive the update
       ============================================================ */
    function renderStep1() {
      boards.classList.remove('s11-boards-split');
      curveWrap.style.display = 'none';
      oracleHost.style.display = 'none';
      learnedHost.style.display = '';
      qtbl.update(SARSA.makeQ(), { suppressFlash: true });   // empty board
      rcap.innerHTML = '<span class="s11-rcap-sub">' + T('scene11.s1.boardCap') + '</span>';

      left.innerHTML =
        '<div class="s11-tag">' + T('scene11.s1.tag') + '</div>' +
        '<div class="s11-title">' + T('scene11.s1.title') + '</div>' +
        '<div class="s11-lead">' + T('scene11.s1.lead') + '</div>';

      addFormulaBlock(left, T('scene11.s1.bellmanCap'),
        String.raw`Q^{\star}(s,a)\;=\;\mathbb{E}\!\left[\,R \;+\; Q^{\star}(S',A')\,\right]`);
      addFormulaBlock(left, T('scene11.s1.sampleCap'),
        String.raw`\underbrace{r \;+\; \mathtt{q}[s',a']}_{\text{one sampled target}}\;\;\approx\;\; \mathbb{E}\!\left[\,R + Q^{\star}(S',A')\,\right]`);
      addFormulaBlock(left, T('scene11.s1.updateCap'),
        String.raw`\boxed{\;\mathtt{q}[s,a]\;\mathrel{+}=\;\alpha\,\bigl(\,\underbrace{r + \mathtt{q}[s',a']}_{\text{target}} \;-\; \mathtt{q}[s,a]\,\bigr)\;}`);

      const foot = document.createElement('div');
      foot.className = 's11-foot';
      foot.innerHTML = T('scene11.s1.foot');
      left.appendChild(foot);

      const ar = document.createElement('div');
      ar.className = 's11-alpha-note';
      ar.innerHTML = '<b>&alpha;</b> = <i>' + T('scene11.s1.alphaName') + '</i>. ' + T('scene11.s1.alphaNote');
      left.appendChild(ar);
    }

    /* ============================================================
       STEP 2 - epsilon + one concrete sampled touch
       ============================================================ */
    let s2Card = null;          // live LadderCard handle
    let s2Die  = null;          // live StageDie handle
    let s2Rung = COLD;          // current rung for the demo
    let s2Busy = false;

    function renderStep2() {
      boards.classList.remove('s11-boards-split');
      curveWrap.style.display = 'none';
      oracleHost.style.display = 'none';
      learnedHost.style.display = 'none';     // step 2 uses its own right-column widget

      left.innerHTML =
        '<div class="s11-tag">' + T('scene11.s2.tag') + '</div>' +
        '<div class="s11-title">' + T('scene11.s2.title') + '</div>' +
        '<div class="s11-lead">' + T('scene11.s2.lead') + '</div>';

      const choices = document.createElement('div');
      choices.className = 's11-eps-choices';
      choices.innerHTML =
        '<div class="s11-eps-card exploit">' +
          '<div class="s11-eps-prob"><span class="s11-katex" data-tex="1-\\varepsilon"></span></div>' +
          '<div class="s11-eps-body">' + T('scene11.s2.greedyCap') + '</div>' +
        '</div>' +
        '<div class="s11-eps-card explore">' +
          '<div class="s11-eps-prob"><span class="s11-katex" data-tex="\\varepsilon"></span></div>' +
          '<div class="s11-eps-body">' + T('scene11.s2.exploreCap') + '</div>' +
        '</div>';
      left.appendChild(choices);

      addFormulaBlock(left, '',
        String.raw`a \;=\; \begin{cases} \text{a random lever} & \text{with prob. } \varepsilon \\[2pt] \arg\max_{a'} \mathtt{q}[s,a'] & \text{otherwise} \end{cases}`);

      const foot = document.createElement('div');
      foot.className = 's11-foot';
      foot.innerHTML = T('scene11.s2.foot');
      left.appendChild(foot);

      renderKatexSpans(left);

      /*, right column: a live single sampled touch, */
      buildStep2Right();
    }

    function buildStep2Right() {
      rcap.innerHTML = '';
      boards.innerHTML = '';      // we manage the right column ourselves here

      const panel = document.createElement('div');
      panel.className = 's11-sample-panel';
      panel.innerHTML =
        '<div class="s11-sample-title">' + T('scene11.s2.sampleTitle') + '</div>' +
        '<div class="s11-sample-stage">' +
          '<div class="s11-sample-card" id="s11-s2-card"></div>' +
          '<div class="s11-sample-die" id="s11-s2-die"></div>' +
        '</div>' +
        '<div class="s11-sample-lever" id="s11-s2-lever"></div>' +
        '<div class="s11-tuple" id="s11-s2-tuple"></div>' +
        '<div class="s11-sample-actions">' +
          '<button class="s11-btn" id="s11-s2-draw">' + T('scene11.s2.drawBtn') + '</button>' +
        '</div>' +
        '<div class="s11-sample-note" id="s11-s2-note"></div>';
      boards.appendChild(panel);

      s2Card = window.LadderCard.mount(document.getElementById('s11-s2-card'), { size: 'md', rung: COLD });
      s2Die  = window.StageDie.mount(document.getElementById('s11-s2-die'));
      s2Rung = COLD;
      s2Busy = false;
      renderS2Tuple(null);

      const btn = document.getElementById('s11-s2-draw');
      if (btn) btn.addEventListener('click', () => doStep2Draw());
    }

    /* Render the (s, a, r, s', a') tuple under the demo. `obs` may be null
       (no roll yet) or the result of one sampled touch. */
    function renderS2Tuple(obs) {
      const host = document.getElementById('s11-s2-tuple');
      if (!host) return;
      if (!obs) {
        host.innerHTML =
          '<div class="s11-tuple-row s">' + T('scene11.s2.tupleS', { rung: rungName(s2Rung) }) + '</div>' +
          '<div class="s11-tuple-row a muted">a = ?</div>' +
          '<div class="s11-tuple-row r muted">r = ?</div>' +
          '<div class="s11-tuple-row sn muted">s&prime; = ?</div>' +
          '<div class="s11-tuple-row an muted">a&prime; = ?</div>';
        return;
      }
      const leverTag = (id) =>
        '<span class="lever-tag ' + LEVERS.toneClass(id) + '">' + T('lever.short.' + id, LEVERS.shortLabel(id)) + '</span>';
      let snRow, anRow;
      if (obs.terminal) {
        const term = obs.signed ? T('vocab.signed') : T('vocab.lost');
        snRow = '<div class="s11-tuple-row sn">' + T('scene11.s2.tupleSnTerm', { term: term }) + '</div>';
        anRow = '<div class="s11-tuple-row an">' + T('scene11.s2.tupleAnTerm') + '</div>';
      } else {
        snRow = '<div class="s11-tuple-row sn">' + T('scene11.s2.tupleSn', { rung: rungName(obs.toRung) }) + '</div>';
        anRow = '<div class="s11-tuple-row an">' + T('scene11.s2.tupleAn', { lever: leverTag(obs.aNext) }) + '</div>';
      }
      host.innerHTML =
        '<div class="s11-tuple-row s">' + T('scene11.s2.tupleS', { rung: rungName(obs.fromRung) }) + '</div>' +
        '<div class="s11-tuple-row a">' + T('scene11.s2.tupleA', { lever: leverTag(obs.a) }) + '</div>' +
        '<div class="s11-tuple-row r">' + T('scene11.s2.tupleR', { r: (obs.r >= 0 ? '+' : '') + obs.r }) + '</div>' +
        snRow + anRow;
    }

    function doStep2Draw() {
      if (s2Busy) return;
      s2Busy = true;
      const reduced = /[#&?]instant\b/.test(window.location.hash || '');
      const fromRung = s2Rung;
      const s = { rung: fromRung, terminal: false };
      const aId = LEVER_IDS[Math.floor(rng() * A)];   // a random lever (illustrative explore)
      const out = P.sample(s, aId, rng);
      const log = out.log;
      const obs = {
        a: aId, r: out.reward,
        fromRung: fromRung,
        toRung: out.sNext.terminal ? -1 : out.sNext.rung,
        terminal: out.sNext.terminal,
        signed: !!log.signed,
        aNext: null,
      };
      if (!obs.terminal) obs.aNext = LEVER_IDS[Math.floor(rng() * A)];

      /* Show which lever was pulled. */
      const lvHost = document.getElementById('s11-s2-lever');
      if (lvHost) lvHost.innerHTML =
        '<span class="lever-tag ' + LEVERS.toneClass(aId) + '">' +
          LEVERS.leverIconSvg(aId) + '<span class="s11-lever-tag-name">' + leverName(aId) + '</span>' +
        '</span>';

      const note = document.getElementById('s11-s2-note');
      if (note) note.innerHTML = T('scene11.s2.sampleNote', {
        rung: rungName(fromRung), lever: leverName(aId), face: T('die.' + log.face),
      });

      const finish = () => {
        if (s2Card) {
          if (obs.terminal) s2Card.setState(log.signed ? { terminal: true, signed: true } : { terminal: true, lost: true });
          else s2Card.set(obs.toRung);
        }
        renderS2Tuple(obs);
        /* Advance the demo state to s' (reset to COLD at a terminal). */
        s2Rung = obs.terminal ? COLD : obs.toRung;
        s2Busy = false;
      };

      const pr = (s2Die && s2Die.roll)
        ? s2Die.roll(log, { reward: out.reward, instant: reduced })
        : Promise.resolve();
      pr.then(finish);
    }

    /* ============================================================
       STEP 3 - live training run
       ============================================================ */
    function renderStep3() {
      /* Rebuild the boards container (step 2 may have replaced its innards). */
      if (!boards.contains(learnedHost)) {
        boards.innerHTML = '';
        boards.appendChild(learnedHost);
        boards.appendChild(oracleHost);
      }
      learnedHost.style.display = '';
      oracleHost.style.display = oracleShown ? '' : 'none';
      boards.classList.toggle('s11-boards-split', oracleShown);
      curveWrap.style.display = '';
      curveCap.textContent = T('scene11.s3.curveCap');

      left.innerHTML =
        '<div class="s11-tag">' + T('scene11.s3.tag') + '</div>' +
        '<div class="s11-title">' + T('scene11.s3.title') + '</div>' +
        '<div class="s11-lead">' + T('scene11.s3.lead') + '</div>' +
        fControlsHTML() +
        '<div class="s11-meters" id="s11-meters"></div>' +
        '<div class="s11-foot" id="s11-run-note"></div>';

      wireFControls();
      qtbl.update(Q, { suppressFlash: true });
      renderMeters();
      renderRunNote();
      renderRcap();
      refreshCurve();

      if (hasRunFlag() && epDone === 0) {
        /* Headless / &run: run the full training immediately so the captured
           board + curve are converged (no animation needed). */
        trainBatch(TOTAL_EPS);
        qtbl.update(Q, { suppressFlash: true });
        renderMeters();
        renderRunNote();
        refreshCurve();
      }
    }

    function fControlsHTML() {
      const epsPct = Math.round(epsFloor * 100);
      return (
        '<div class="s11-ctrls">' +
          '<button class="s11-btn primary" id="s11-play" data-run-primary>' +
            (playing ? T('scene11.s3.pause') : T('scene11.s3.play')) + '</button>' +
          '<button class="s11-btn" id="s11-deal">' + T('scene11.s3.deal') + '</button>' +
          '<button class="s11-btn" id="s11-oracle">' +
            (oracleShown ? T('scene11.s3.oracleOn') : T('scene11.s3.oracleToggle')) + '</button>' +
          '<div class="s11-slider">' +
            '<span class="s11-slider-cap">' + T('scene11.s3.speed') + '</span>' +
            '<span class="s11-slider-end">' + T('scene11.s3.slow') + '</span>' +
            '<input type="range" id="s11-speed" min="0" max="3" step="1" value="' + speedLvl + '">' +
            '<span class="s11-slider-end">' + T('scene11.s3.fast') + '</span>' +
          '</div>' +
          '<div class="s11-slider">' +
            '<span class="s11-slider-cap">' + T('scene11.s3.epsLabel') + ' <b id="s11-eps-val">' + epsFloor.toFixed(2) + '</b></span>' +
            '<input type="range" id="s11-eps" min="0" max="60" step="2" value="' + epsPct + '">' +
          '</div>' +
          '<div class="s11-alpha-fixed">' + T('scene11.s3.alphaFixed', { a: ALPHA.toFixed(2) }) + '</div>' +
        '</div>'
      );
    }

    function wireFControls() {
      const play = document.getElementById('s11-play');
      if (play) play.addEventListener('click', togglePlay);
      const deal = document.getElementById('s11-deal');
      if (deal) deal.addEventListener('click', () => { pausePlay(); oneDeal(); });
      const oracleBtn = document.getElementById('s11-oracle');
      if (oracleBtn) oracleBtn.addEventListener('click', toggleOracle);
      const spd = document.getElementById('s11-speed');
      if (spd) spd.addEventListener('input', (e) => {
        speedLvl = Math.max(0, Math.min(3, parseInt(e.target.value, 10) || 0));
      });
      const epsEl = document.getElementById('s11-eps');
      if (epsEl) epsEl.addEventListener('input', (e) => {
        epsFloor = Math.max(0, Math.min(0.6, (parseInt(e.target.value, 10) || 0) / 100));
        const lbl = document.getElementById('s11-eps-val');
        if (lbl) lbl.textContent = epsFloor.toFixed(2);
      });
    }

    /* One press of NEXT DEAL = one speed-level batch of deals. */
    function oneDeal() {
      if (epDone >= TOTAL_EPS) return;
      trainBatch(BATCH[speedLvl]);
      qtbl.update(Q, { suppressFlash: false });
      renderMeters();
      renderRunNote();
      refreshCurve();
    }

    function toggleOracle() {
      oracleShown = !oracleShown;
      oracleHost.style.display = oracleShown ? '' : 'none';
      boards.classList.toggle('s11-boards-split', oracleShown);
      const btn = document.getElementById('s11-oracle');
      if (btn) btn.textContent = oracleShown ? T('scene11.s3.oracleOn') : T('scene11.s3.oracleToggle');
      renderRcap();
    }

    function renderRcap() {
      if (oracleShown) {
        rcap.innerHTML =
          '<span class="s11-rcap-pair"><span class="s11-rcap-dot learned"></span>' + T('scene11.s3.learnedCap') + '</span>' +
          '<span class="s11-rcap-pair"><span class="s11-rcap-dot oracle"></span>' + T('scene11.s3.oracleCap') + '</span>';
      } else {
        rcap.innerHTML = '<span class="s11-rcap-sub">' + T('scene11.s3.learnedCap') + '</span>';
      }
    }

    function refreshCurve() {
      if (returns.length === 0) { curve.setData([0]); return; }
      curve.setData(returns);
      curve.setCursor(returns.length - 1);
    }

    function renderMeters() {
      const pct    = convergencePct(Q);
      const gsv    = epDone > 0 ? greedyStartValue(Q) : 0;
      const gsvPct = Math.max(0, Math.min(100, 100 * gsv / OPT_START));
      const host = document.getElementById('s11-meters');
      if (!host) return;
      host.innerHTML =
        '<div class="s11-meter deals">' +
          '<span class="s11-meter-label">' + T('scene11.s3.deals') + '</span>' +
          '<span class="s11-meter-big" id="s11-deals-n">' + epDone.toLocaleString('en-US') + '</span>' +
        '</div>' +
        '<div class="s11-meter">' +
          '<span class="s11-meter-label">' + T('scene11.s3.convLabel') + '</span>' +
          '<span class="s11-bar"><span class="s11-bar-fill conv" style="width:' + pct.toFixed(1) + '%"></span></span>' +
          '<span class="s11-meter-val">' + pct.toFixed(0) + '%</span>' +
        '</div>' +
        '<div class="s11-meter">' +
          '<span class="s11-meter-label">' + T('scene11.s3.valLabel') + '</span>' +
          '<span class="s11-bar"><span class="s11-bar-fill val" style="width:' + gsvPct.toFixed(1) + '%"></span></span>' +
          '<span class="s11-meter-val">' + T('scene11.s3.valOf', { cur: gsv.toFixed(1), opt: OPT_START.toFixed(1) }) + '</span>' +
        '</div>';
    }

    function renderRunNote() {
      const host = document.getElementById('s11-run-note');
      if (!host) return;
      if (epDone >= TOTAL_EPS * 0.5) {
        /* Report what the LIVE board actually achieved, so the note stays
           honest if the learner cranks the eps slider. With the pinned seed +
           the schedule this lands on the documented 5/5 rungs. */
        const agree = policyAgreement(Q);
        const gsv   = greedyStartValue(Q);
        const pct   = OPT_START > 0 ? (100 * gsv / OPT_START) : 0;
        host.innerHTML = T('scene11.s3.matchNote', {
          agree: agree, total: N, pct: pct.toFixed(1),
        });
        host.classList.add('done');
      } else if (epDone > 0) {
        host.innerHTML = T('scene11.s3.runningNote');
        host.classList.remove('done');
      } else {
        host.innerHTML = '<b>' + T('scene11.s3.gateTitle') + '</b> &middot; ' + T('scene11.s3.gateBody');
        host.classList.remove('done');
      }
    }

    /*, PLAY loop, */
    function playBtn() { return document.getElementById('s11-play'); }
    function setPlayLabel(on) { const b = playBtn(); if (b) b.textContent = on ? T('scene11.s3.pause') : T('scene11.s3.play'); }
    function pausePlay() { if (playTimer) { clearTimeout(playTimer); playTimer = null; } playing = false; setPlayLabel(false); }
    function tick() {
      playTimer = setTimeout(() => {
        playTimer = null;
        if (!playing) return;
        if (epDone < TOTAL_EPS) {
          trainBatch(BATCH[speedLvl]);
          qtbl.update(Q, { suppressFlash: false });
          renderMeters();
          renderRunNote();
          refreshCurve();
          tick();
        } else {
          pausePlay();   // training budget exhausted
        }
      }, TICK_MS);
    }
    function startPlay() { if (playing) return; if (epDone >= TOTAL_EPS) return; playing = true; setPlayLabel(true); tick(); }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }

    /* ============================================================
       Formula-card + katex helpers (match scene6 / scene8 KaTeX usage)
       ============================================================ */
    function addFormulaBlock(host, caption, tex) {
      if (caption) {
        const cap = document.createElement('div');
        cap.className = 's11-fcaption';
        cap.textContent = caption;
        host.appendChild(cap);
      }
      const box = document.createElement('div');
      box.className = 's11-formula';
      host.appendChild(box);
      window.Katex.render(tex, box, true);
    }
    function renderKatexSpans(host) {
      host.querySelectorAll('.s11-katex[data-tex]').forEach((sp) => {
        window.Katex.render(sp.getAttribute('data-tex'), sp, false);
      });
    }

    function hasRunFlag() { return /[#&?]run\b/.test(window.location.hash || ''); }

    /* ============================================================
       Pager
       ============================================================ */
    const STEPS = [renderStep1, renderStep2, renderStep3];
    let cursor = 0;

    function applyCursor() {
      pausePlay();
      cursor = Math.max(0, Math.min(STEPS.length - 1, cursor));
      document.getElementById('s11-status').textContent =
        T('scene11.status', { i: cursor + 1, n: STEPS.length });
      document.getElementById('s11-prev').disabled = (cursor === 0);
      document.getElementById('s11-next').disabled = (cursor === STEPS.length - 1);
      left.className = 's11-left';
      STEPS[cursor]();
    }

    document.getElementById('s11-prev').addEventListener('click', () => { if (cursor > 0) { cursor--; applyCursor(); } });
    document.getElementById('s11-next').addEventListener('click', () => { if (cursor < STEPS.length - 1) { cursor++; applyCursor(); } });
    document.getElementById('s11-reset').addEventListener('click', () => {
      Q = SARSA.makeQ(); rng = P.makeRng(SEED); epDone = 0; returns = [];
      epsFloor = EPS_MIN; oracleShown = false; speedLvl = 1; cursor = 0;
      applyCursor();
    });

    applyCursor();

    /* &s11step=N - jump to a step (1-indexed) for headless capture / deep links. */
    const stepMatch = (window.location.hash || '').match(/[#&?]s11step=(\d+)/);
    if (stepMatch) {
      const tgt = Math.min(STEPS.length, Math.max(1, parseInt(stepMatch[1], 10))) - 1;
      setTimeout(() => { cursor = tgt; applyCursor(); }, 80);
    }

    /* &run: jump to step 3 (the live training), which auto-runs to convergence. */
    if (hasRunFlag()) {
      setTimeout(() => { cursor = STEPS.length - 1; applyCursor(); }, 120);
    }

    return {
      onEnter() { applyCursor(); },
      onLeave() { pausePlay(); },
      onNextKey() { if (cursor < STEPS.length - 1) { cursor++; applyCursor(); return true; } return false; },
      onPrevKey() { if (cursor > 0) { cursor--; applyCursor(); return true; } return false; },
    };
  };
})();

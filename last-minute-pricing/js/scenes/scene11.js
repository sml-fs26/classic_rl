/* scene11 -- "Learn the playbook with SARSA" (the RL capstone).
 *
 *   Three-step pager. One step shows at a time; everything fits one viewport.
 *
 *     STEP 1  DERIVE.  Bellman (scene 8) says a lever's value is an
 *             EXPECTATION over every way demand could fall. We don't have
 *             the odds, so we replace that expectation with ONE observed
 *             sample (r + q[s',a']) and inch q toward it by alpha. Three
 *             stacked KaTeX cards walk the transformation; the right column
 *             shows the empty board the learner is about to fill.
 *
 *     STEP 2  EPSILON.  Name the explore/exploit dial. 1-eps: exploit your
 *             current best lever; eps: try an unproven one. A live
 *             DEMAND-DRAW (shared Deck + ShelfCard) produces one concrete
 *             (s,a,r,s',a') tuple so "one sample" is tangible.
 *
 *     STEP 3  LIVE RUN.  Play season after season with NO demand model --
 *             only window.Pricing.sample (the visible dice) + window.SARSA.
 *             The board fills in and its colour regions converge to the DP
 *             oracle from scene 9 (window.DATA.policy / Qstar). A convergence
 *             bar (CLOSENESS TO Q*) and a greedy-start-value readout track
 *             the climb. Controls: PLAY/PAUSE + NEXT SEASON + speed slider +
 *             epsilon slider; alpha fixed and labelled. Gated behind &run for
 *             headless capture. A DP-ORACLE toggle overlays scene 9's answer.
 *
 *   The live training mirrors window.DATA.sarsa.config (alpha 0.08, gamma 1,
 *   eps 0.3 -> 0.01, exploring starts) so it lands on the same documented
 *   result: 17/20 cells agree with DP, 98.6% of optimal start revenue, the
 *   three diagonal-seam cells the only honest misses. */
(function () {
  window.scenes = window.scenes || {};

  const P        = window.Pricing;
  const LEVERS   = window.Levers;
  const SARSA    = window.SARSA;
  const LEVER_IDS = LEVERS.LEVER_IDS;            // [premium, standard, firesale]
  const A        = LEVER_IDS.length;             // 3
  const N        = P.N;                          // 20
  const GAMMA    = 1;

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Live-training hyperparameters, locked to the precompute (DATA.sarsa.config). */
  const CFG = (window.DATA && window.DATA.sarsa && window.DATA.sarsa.config) || {};
  const ALPHA       = CFG.alpha       != null ? CFG.alpha       : 0.08;
  const EPS0        = CFG.epsilon      != null ? CFG.epsilon     : 0.30;
  const EPS_MIN     = CFG.epsilonMin   != null ? CFG.epsilonMin  : 0.01;
  const TOTAL_EPS   = CFG.episodes     != null ? CFG.episodes    : 40000;
  const MAX_DAYS    = CFG.maxDays      != null ? CFG.maxDays     : 5;
  const SEED        = CFG.seed         != null ? CFG.seed        : 20260530;

  /* The DP oracle the learner is chasing (precomputed, never hand-typed). */
  const QSTAR     = Float64Array.from((window.DATA && window.DATA.Qstar) || new Array(N * A).fill(0));
  const OPT_POLICY = (window.DATA && window.DATA.policy) || [];
  const OPT_START = (window.DATA && window.DATA.sarsa && window.DATA.sarsa.optimalStartValue) || 12.83;

  let QSTAR_L1 = 0;
  for (let i = 0; i < QSTAR.length; i++) QSTAR_L1 += Math.abs(QSTAR[i]);
  if (QSTAR_L1 === 0) QSTAR_L1 = 1;

  /* ---------- small helpers ---------- */
  function leverName(id) { return T('lever.' + id); }
  function money(v) { return (Math.round(v * 100) / 100).toFixed(2); }

  /* The non-terminal start states for exploring starts (all 20 playable cells). */
  const START_STATES = P.NON_TERMINAL_STATES.slice();

  /* eps schedule: GEOMETRIC decay from EPS0 to EPS_MIN over TOTAL_EPS episodes,
     mirroring the precompute EXACTLY (precompute/build-datasets.js epsAt:
     eps0 * (epsMin/eps0)^frac with frac = ep/episodes, ep counted 1..episodes).
     Matching the schedule + the pinned seed is what makes the live board land
     on the documented 17/20-cell agreement; a linear decay keeps eps high too
     long and biases the on-policy estimate, dropping agreement to ~14/20.
     `epOneIdx` is the 1-indexed episode number. epsFloor (the live slider)
     clamps the floor so a curious learner can force re-exploration. */
  function scheduledEps(epOneIdx, epsFloor) {
    const frac = Math.min(1, epOneIdx / TOTAL_EPS);
    const e = EPS0 * Math.pow(EPS_MIN / EPS0, frac);
    return Math.max(epsFloor != null ? epsFloor : EPS_MIN, e);
  }

  /* Run one SARSA episode (one selling season) on Q, in place, using only
     window.Pricing.sample (the visible dice) -- no demand model is read. */
  function runEpisode(Q, eps, rng) {
    /* Exploring start: a uniformly random playable situation. */
    const s0 = START_STATES[Math.floor(rng() * START_STATES.length)];
    let s = { u: s0.u, d: s0.d, terminal: false };
    let sIdx = P.stateIndex(s);
    let aId  = SARSA.pickEpsGreedy(Q, sIdx, eps, rng);

    for (let t = 0; t < MAX_DAYS; t++) {
      const sample = P.sample(s, aId, rng);
      const sNext  = sample.sNext;
      const r      = sample.reward;
      if (sNext.terminal) {
        SARSA.update(Q, sIdx, aId, r, -1, null, ALPHA, GAMMA, true);
        break;
      }
      const sNextIdx = P.stateIndex(sNext);
      const aNextId  = SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);
      SARSA.update(Q, sIdx, aId, r, sNextIdx, aNextId, ALPHA, GAMMA, false);
      s = sNext; sIdx = sNextIdx; aId = aNextId;
    }
  }

  /* Closeness to Q* in [0,100]: 0 when q is all-zero, 100 at an exact match.
     L1 distance normalised by sum|Q*| (same recipe as the Pokemon scene). */
  function convergencePct(Q) {
    let dist = 0;
    for (let i = 0; i < Q.length; i++) dist += Math.abs(Q[i] - QSTAR[i]);
    return Math.max(0, Math.min(100, 100 * (1 - dist / QSTAR_L1)));
  }

  /* How many of the 20 cells' argmax match the DP oracle policy. */
  function policyAgreement(Q) {
    let agree = 0;
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let best = -Infinity, k = 0, allZero = true;
      for (let a = 0; a < A; a++) {
        if (Math.abs(Q[base + a]) > 1e-9) allZero = false;
        if (Q[base + a] > best) { best = Q[base + a]; k = a; }
      }
      if (!allZero && LEVER_IDS[k] === OPT_POLICY[s]) agree++;
    }
    return agree;
  }

  /* Exact expected return from the START state (5 units, 4 days) under the
     GREEDY policy of the current Q -- computed by backward induction over the
     true transition model. This is policy *evaluation* of what the learner
     would actually do (greedy), not Q* itself; it climbs toward OPT_START as
     the learned greedy policy improves. Cheap: 20 states. */
  function greedyStartValue(Q) {
    const Vpi = new Float64Array(N);          // value under greedy(Q)
    /* States with d=1 first, then d=2.. : process by ascending days so a
       state's successors (always d-1) are already solved. */
    const order = [];
    for (let s = 0; s < N; s++) order.push(s);
    order.sort((a, b) => P.daysLeft(P.stateFromIndex(a)) - P.daysLeft(P.stateFromIndex(b)));
    for (const s of order) {
      const st = P.stateFromIndex(s);
      const base = s * A;
      let best = -Infinity, k = 0;
      for (let a = 0; a < A; a++) if (Q[base + a] > best) { best = Q[base + a]; k = a; }
      const succ = P.successors(st, LEVER_IDS[k]);
      let v = 0;
      for (const tr of succ) {
        const vN = tr.sNext.terminal ? 0 : Vpi[P.stateIndex(tr.sNext)];
        v += tr.p * (tr.reward + GAMMA * vN);
      }
      Vpi[s] = v;
    }
    return Vpi[P.stateIndex({ u: P.NUM_UNITS, d: P.NUM_DAYS })];
  }

  /* ============================================================ */
  window.scenes.scene11 = function (root) {
    root.className = 'scene-pad s11';
    root.innerHTML = '';

    /* ---- heading + pager controls ---- */
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

    /* ---- two-column body: left = explanation, right = board/illustration ---- */
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

    const qtbl   = window.QTable.mount(learnedHost);
    const oracle = window.QTable.mount(oracleHost);
    oracle.update(QSTAR, { suppressFlash: true });   // static DP answer

    /* ============================================================
       Live-training state (step 3)
       ============================================================ */
    let Q       = SARSA.makeQ();
    let rng     = P.makeRng(SEED);
    let epDone  = 0;
    let epsFloor = EPS_MIN;                 // raised by the live slider
    let playing  = false;
    let playTimer = null;
    let speedLvl  = 2;                      // 0..4
    /* episodes folded into one animation tick, per speed level. Small at
       slow speeds so the board paints cell by cell; large at fast speeds so
       the full 40k run completes in a few seconds. */
    const BATCH = [40, 120, 350, 900, 2000];
    /* Tick period. Every speed level runs at BATCH[lvl] episodes per TICK_MS,
       so tripling this period (70 -> 210) slows EVERY slider setting to ~1/3
       of its former pace uniformly -- the run was reading too fast to follow. */
    const TICK_MS = 210;

    let oracleShown = false;

    function trainBatch(nEpisodes) {
      for (let i = 0; i < nEpisodes; i++) {
        /* epDone is 0-indexed (0 on the first episode); the precompute counts
           episodes 1..episodes, so feed epDone+1 to match its eps schedule. */
        const eps = scheduledEps(epDone + 1, epsFloor);
        runEpisode(Q, eps, rng);
        epDone++;
      }
    }

    /* ============================================================
       STEP 1 -- derive the update
       ============================================================ */
    function renderStep1() {
      boards.classList.remove('s11-boards-split');
      oracleHost.style.display = 'none';
      learnedHost.style.display = '';
      qtbl.update(SARSA.makeQ(), { suppressFlash: true });   // empty board
      rcap.textContent = T('scene11.s2.sampleTitle');         // reuse: "the board you'll fill"
      rcap.innerHTML = '<span class="s11-rcap-sub">' + T('scene11.s3.learnedCap') + '</span>';

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
       STEP 2 -- epsilon + one concrete sampled step
       ============================================================ */
    let s2Deck = null;          // shared Deck handle (built once)
    let s2Shelf = null;         // live ShelfCard handle
    let s2State = null;         // current (u,d) for the demo
    let s2Busy  = false;

    function renderStep2() {
      boards.classList.remove('s11-boards-split');
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

      /* ---- right column: a live single sampled step ---- */
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
          '<div class="s11-sample-shelf" id="s11-s2-shelf"></div>' +
          '<div class="s11-sample-deck" id="s11-s2-deck"></div>' +
        '</div>' +
        '<div class="s11-sample-lever" id="s11-s2-lever"></div>' +
        '<div class="s11-tuple" id="s11-s2-tuple"></div>' +
        '<div class="s11-sample-actions">' +
          '<button class="s11-btn" id="s11-s2-draw">' + T('scene11.s2.drawBtn') + '</button>' +
        '</div>' +
        '<div class="s11-sample-note" id="s11-s2-note"></div>';
      boards.appendChild(panel);

      s2Shelf = window.ShelfCard.mount(document.getElementById('s11-s2-shelf'),
        { size: 'md', label: true, u: 5, d: 4 });
      s2Deck = window.Deck.mount(document.getElementById('s11-s2-deck'));
      s2State = { u: 5, d: 4 };
      s2Busy = false;
      renderS2Tuple(null);

      const btn = document.getElementById('s11-s2-draw');
      if (btn) btn.addEventListener('click', () => doStep2Draw());
    }

    /* Render the (s,a,r,s',a') tuple under the demo. `obs` may be null (no
       draw yet) or the result of one sampled step. */
    function renderS2Tuple(obs) {
      const host = document.getElementById('s11-s2-tuple');
      if (!host) return;
      const u = s2State.u, d = s2State.d;
      if (!obs) {
        host.innerHTML =
          '<div class="s11-tuple-row s">' + T('scene11.s2.tupleS', { u: u, d: d }) + '</div>' +
          '<div class="s11-tuple-row a muted">a = ?</div>' +
          '<div class="s11-tuple-row r muted">r = ?</div>' +
          '<div class="s11-tuple-row sn muted">s′ = ?</div>' +
          '<div class="s11-tuple-row an muted">a′ = ?</div>';
        return;
      }
      const lvCls = (id) => 'lever-tag" data-lever="' + id;
      let snRow, anRow;
      if (obs.terminal) {
        const term = obs.soldout ? T('vocab.soldout') : T('vocab.midnight');
        snRow = '<div class="s11-tuple-row sn">' + T('scene11.s2.tupleSnTerm', { term: term }) + '</div>';
        anRow = '<div class="s11-tuple-row an">' + T('scene11.s2.tupleAnTerm') + '</div>';
      } else {
        snRow = '<div class="s11-tuple-row sn">' + T('scene11.s2.tupleSn', { un: obs.un, dn: obs.dn }) + '</div>';
        anRow = '<div class="s11-tuple-row an">' +
          T('scene11.s2.tupleAn', { lever: '<span class="' + lvCls(obs.aNext) + '">' + T('lever.' + obs.aNext + '.short') + '</span>' }) + '</div>';
      }
      host.innerHTML =
        '<div class="s11-tuple-row s">' + T('scene11.s2.tupleS', { u: obs.u, d: obs.d }) + '</div>' +
        '<div class="s11-tuple-row a">' +
          T('scene11.s2.tupleA', { lever: '<span class="' + lvCls(obs.a) + '">' + T('lever.' + obs.a + '.short') + '</span>' }) + '</div>' +
        '<div class="s11-tuple-row r">' + T('scene11.s2.tupleR', { r: money(obs.r) }) + '</div>' +
        snRow + anRow;
    }

    function doStep2Draw() {
      if (s2Busy) return;
      s2Busy = true;
      const reduced = !!window.PRICING_AUTORUN;   // instant for headless
      const u = s2State.u, d = s2State.d;
      const s = { u: u, d: d, terminal: false };
      const aId = LEVER_IDS[Math.floor(rng() * A)];   // a random lever (illustrative explore)
      const sample = P.sample(s, aId, rng);
      const log = sample.log;
      const k = log.k;
      const obs = {
        u: u, d: d, a: aId, r: sample.reward,
        terminal: sample.sNext.terminal,
        soldout: !!log.soldout,
        un: log.uAfter, dn: log.dAfter,
        aNext: null,
      };
      if (!obs.terminal) obs.aNext = LEVER_IDS[Math.floor(rng() * A)];

      /* Show which lever was pulled. */
      const lvHost = document.getElementById('s11-s2-lever');
      if (lvHost) lvHost.innerHTML =
        '<span class="lever-tag" data-lever="' + aId + '">' + leverName(aId) + ' &middot; $' + LEVERS.priceOf(aId) + '</span>';

      const note = document.getElementById('s11-s2-note');
      if (note) note.innerHTML = T('scene11.s2.sampleNote', { u: u, d: d, lever: leverName(aId), k: k });

      const finish = () => {
        /* Slide sold tickets off: drop the shelf to uAfter. */
        if (s2Shelf) { s2Shelf.set(obs.un, obs.dn); s2Shelf.setLever(aId); }
        renderS2Tuple(obs);
        /* Advance the demo state to s' (or reset at terminal). */
        if (obs.terminal) { s2State = { u: 5, d: 4 }; }
        else { s2State = { u: obs.un, d: obs.dn }; }
        s2Busy = false;
      };

      const pr = (s2Deck && s2Deck.flip) ? s2Deck.flip({ lever: aId, k: k }) : Promise.resolve();
      if (reduced) { finish(); }
      else { pr.then(finish); }
    }

    /* ============================================================
       STEP 3 -- live training run
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

      if (window.PRICING_AUTORUN && epDone === 0) {
        /* Headless: run the full training immediately so the captured board
           is converged (no animation needed). */
        trainBatch(TOTAL_EPS);
        qtbl.update(Q, { suppressFlash: true });
        renderMeters();
        renderRunNote();
      }
    }

    function fControlsHTML() {
      const epsPct = Math.round(epsFloor * 100);
      return (
        '<div class="s11-ctrls">' +
          '<button class="s11-btn primary" id="s11-play">' + (playing ? T('scene11.s3.pause') : T('scene11.s3.play')) + '</button>' +
          '<button class="s11-btn" id="s11-season">' + T('scene11.s3.season') + '</button>' +
          '<button class="s11-btn" id="s11-oracle">' + (oracleShown ? T('scene11.s3.oracleOn') : T('scene11.s3.oracleToggle')) + '</button>' +
          '<div class="s11-slider">' +
            '<span class="s11-slider-cap">' + T('scene11.s3.speed') + '</span>' +
            '<span class="s11-slider-end">' + T('scene11.s3.slow') + '</span>' +
            '<input type="range" id="s11-speed" min="0" max="4" step="1" value="' + speedLvl + '">' +
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
      const season = document.getElementById('s11-season');
      if (season) season.addEventListener('click', () => { pausePlay(); oneSeason(); });
      const oracleBtn = document.getElementById('s11-oracle');
      if (oracleBtn) oracleBtn.addEventListener('click', toggleOracle);
      const spd = document.getElementById('s11-speed');
      if (spd) spd.addEventListener('input', (e) => {
        speedLvl = Math.max(0, Math.min(4, parseInt(e.target.value, 10) || 0));
      });
      const epsEl = document.getElementById('s11-eps');
      if (epsEl) epsEl.addEventListener('input', (e) => {
        epsFloor = Math.max(0, Math.min(0.6, (parseInt(e.target.value, 10) || 0) / 100));
        const lbl = document.getElementById('s11-eps-val');
        if (lbl) lbl.textContent = epsFloor.toFixed(2);
      });
    }

    function oneSeason() {
      trainBatch(BATCH[speedLvl]);
      qtbl.update(Q, { suppressFlash: false });
      renderMeters();
      renderRunNote();
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

    function renderMeters() {
      const pct   = convergencePct(Q);
      const gsv   = epDone > 0 ? greedyStartValue(Q) : 0;
      const gsvPct = Math.max(0, Math.min(100, 100 * gsv / OPT_START));
      const host = document.getElementById('s11-meters');
      if (!host) return;
      host.innerHTML =
        '<div class="s11-meter seasons">' +
          '<span class="s11-meter-label">' + T('scene11.s3.seasons') + '</span>' +
          '<span class="s11-meter-big" id="s11-seasons-n">' + epDone.toLocaleString('en-US') + '</span>' +
        '</div>' +
        '<div class="s11-meter">' +
          '<span class="s11-meter-label">' + T('scene11.s3.convLabel') + '</span>' +
          '<span class="s11-bar"><span class="s11-bar-fill conv" style="width:' + pct.toFixed(1) + '%"></span></span>' +
          '<span class="s11-meter-val">' + pct.toFixed(0) + '%</span>' +
        '</div>' +
        '<div class="s11-meter">' +
          '<span class="s11-meter-label">' + T('scene11.s3.revLabel') + '</span>' +
          '<span class="s11-bar"><span class="s11-bar-fill rev" style="width:' + gsvPct.toFixed(1) + '%"></span></span>' +
          '<span class="s11-meter-val">' + T('scene11.s3.revOf', { cur: money(gsv), opt: money(OPT_START) }) + '</span>' +
        '</div>';
    }

    function renderRunNote() {
      const host = document.getElementById('s11-run-note');
      if (!host) return;
      /* Converged enough to show the honest comparison? */
      if (epDone >= TOTAL_EPS * 0.5) {
        /* Report what the LIVE board actually achieved, so the note stays
           honest if the learner cranks the eps slider. With the pinned seed +
           the precompute eps schedule this lands on the documented 17/20 cells
           and ~98.5% of optimal start revenue. */
        const agree = policyAgreement(Q);
        const gsv   = greedyStartValue(Q);
        const pct   = OPT_START > 0 ? (100 * gsv / OPT_START) : 0;
        host.innerHTML = T('scene11.s3.matchNote', {
          agree: agree,
          total: N,
          pct: pct.toFixed(1),
          dis: N - agree,
        });
        host.classList.add('done');
      } else if (epDone > 0) {
        host.innerHTML = T('scene11.s3.runningNote');
        host.classList.remove('done');
      } else {
        host.innerHTML =
          '<b>' + T('scene11.s3.gateTitle') + '</b> &middot; ' + T('scene11.s3.gateBody');
        host.classList.remove('done');
      }
    }

    /* ---- PLAY loop ---- */
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
          tick();
        } else {
          pausePlay();   // training budget exhausted
        }
      }, TICK_MS);
    }
    function startPlay() { if (playing) return; if (epDone >= TOTAL_EPS) return; playing = true; setPlayLabel(true); tick(); }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }

    /* ============================================================
       Formula-card + katex helpers
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
      Q = SARSA.makeQ(); rng = P.makeRng(SEED); epDone = 0; epsFloor = EPS_MIN;
      oracleShown = false; speedLvl = 2; cursor = 0;
      applyCursor();
    });

    applyCursor();

    /* &s11step=N -- jump to a step (1-indexed) for headless capture / deep links. */
    const stepMatch = (window.location.hash || '').match(/[#&?]s11step=(\d+)/);
    if (stepMatch) {
      const tgt = Math.min(STEPS.length, Math.max(1, parseInt(stepMatch[1], 10))) - 1;
      setTimeout(() => { cursor = tgt; applyCursor(); }, 80);
    }

    /* &run: jump to step 3 (the live training), which auto-runs to convergence. */
    if (window.PRICING_AUTORUN) {
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

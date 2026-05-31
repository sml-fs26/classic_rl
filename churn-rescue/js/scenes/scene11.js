/* Scene 11 (capstone): SARSA, learn the playbook by playing.
 *
 *   The arc's payoff. Scene 9 needed the coin and die weights to COMPUTE
 *   the optimal playbook. Here we throw the model away: we learn the same
 *   coloured retention map from experience alone, one simulated month at a
 *   time, by nudging a running estimate toward what each move actually
 *   returned.
 *
 *   A six-step pager:
 *
 *     A  (manager)  you don't know the coin and die. So play, watch, adjust.
 *     B  (sample)   Bellman is an expectation over every branch; one month
 *                   gives you ONE sample of it: you pulled a in s, paid r,
 *                   landed s', and (under your current playbook) would pull
 *                   a'. The target is r + q[s',a'].
 *     C  (update)   nudge q[s,a] a small step alpha toward that target: the
 *                   boxed SARSA rule. A number line shows q crawling toward
 *                   the target.
 *     D  (explore)  epsilon-greedy: mostly pull the lever you currently
 *                   believe is best, but occasionally try an unproven one so
 *                   you learn its true effect instead of guessing forever.
 *     E  (live)     the model-free trainer. A trajectory tape feeds a
 *                   learning 5x5 retention map that fills toward the SAME
 *                   coloured map the DP oracle produced in scene 9
 *                   (INCLUDING the blue notch), with a convergence bar
 *                   tracking the gap. Controls PLAY / PAUSE / NEXT + speed +
 *                   epsilon sliders; alpha fixed (labeled). window.SARSA +
 *                   window.Churn, no model.
 *
 *   The live trainer does real tabular SARSA in the browser (no precomputed
 *   snapshots): it samples episodes from window.Churn, applies
 *   window.SARSA.update, and measures distance to window.DATA.Qstar (the
 *   verified oracle) for the convergence bar. Gated behind the PLAY button
 *   and the &run flag; never auto-runs on a bare onEnter.
 *
 *   gamma = 1 (every episode terminates at renewal or churn). alpha = 0.20
 *   fixed and labeled. epsilon defaults to 0.15 (the trained config) and is
 *   live-tunable so a learner can feel the exploration trade-off.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  const ACTIONS = window.Moves.MOVE_IDS;            // ['nothing','checkin','offer']
  const A = ACTIONS.length;                          // 3
  const N = window.Bellman.N;                         // 25
  const GAMMA = 1;

  /* SARSA hyper-parameters, pulled from window.DATA.params.sarsa so the
     scene never hand-types a value (and the live run matches the verified
     precompute). epsilon is the user-tunable explore rate (a slider in step
     E); alpha is NOT a slider, it follows the same annealing schedule the
     precompute used (alpha0 -> floor, halved every alphaHalfLife episodes).
     The label shows the current alpha. Annealing (not a fixed alpha) is what
     lets tabular SARSA settle on the fragile at-risk notch; a fixed step
     keeps the near-tie cells jittering across the boundary forever. */
  const SCFG = (window.DATA && window.DATA.params && window.DATA.params.sarsa) || {};
  const ALPHA0 = SCFG.alpha != null ? SCFG.alpha : 0.20;
  const ALPHA_HALFLIFE = SCFG.alphaHalfLife != null ? SCFG.alphaHalfLife : 2000;
  const ALPHA_FLOOR = SCFG.alphaFloor != null ? SCFG.alphaFloor : 0.01;
  const EPS_DEFAULT = SCFG.epsilon != null ? SCFG.epsilon : 0.15;
  const MAX_MONTHS = SCFG.maxMonths != null ? SCFG.maxMonths : 5;

  /* Annealed step size at a given episode count. */
  function alphaAt(ep) {
    return Math.max(ALPHA_FLOOR, ALPHA0 * Math.pow(0.5, ep / ALPHA_HALFLIFE));
  }
  /* Step size shown in the static derivation cards (steps B-D): the starting
     alpha, since those cards illustrate the very first updates. */
  const ALPHA = ALPHA0;

  /* The verified DP oracle Q* (scene 9's answer): the ground truth the live
     trainer should converge to. Used only for the convergence bar; the
     trainer itself never reads it. */
  const QSTAR = (window.DATA && window.DATA.Qstar) ? Float64Array.from(window.DATA.Qstar) : null;
  let QSTAR_L1 = 0;
  if (QSTAR) { for (let i = 0; i < QSTAR.length; i++) QSTAR_L1 += Math.abs(QSTAR[i]); }
  if (!QSTAR_L1) QSTAR_L1 = 1;

  /* ---------- small format helpers ---------- */
  function fmt(v) {
    if (v === 0 || Math.abs(v) < 0.005) return '+0.00';
    return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
  }
  function leverShort(id) { return T('lever.short.' + id); }
  function leverFull(id) { return T('lever.' + id); }
  function leverTokenClass(id) {
    return window.Levers && window.Levers.tokenClass ? window.Levers.tokenClass(id) : ('lever-' + id);
  }
  /* Deterministic greedy action index (first-index tie-break) WITHOUT
     drawing any random number. Used only to tag a move as explore-vs-exploit
     on the tape; it must not consume the training RNG, or it would perturb
     the learning trajectory (and break the fragile at-risk notch). */
  function greedyIdx(Q, sIdx) {
    const base = sIdx * A;
    let best = Q[base], k = 0;
    for (let a = 1; a < A; a++) { if (Q[base + a] > best) { best = Q[base + a]; k = a; } }
    return k;
  }
  function tierShort(tier) {
    const ids = window.Churn.TIERS;
    return T('tier.short.' + (ids[tier] || 'cliff'));
  }
  function stateLabel(s) {
    if (!s || s.terminal) {
      if (s && s.renewed) return T('terminal.renewed');
      if (s && s.churned) return T('terminal.churned');
      return T('terminal.mini');
    }
    return tierShort(s.tier) + ' / ' + T('months.short', { n: s.m });
  }

  /* A uniformly random non-terminal start state (exploring starts): the
     live trainer kicks each episode off from anywhere on the board so every
     one of the 25 cells gets visited often enough to learn, including the
     corners the canonical lukewarm-m4 start would rarely reach. */
  function randomStart(rng) {
    const tier = Math.floor(rng() * window.Churn.NUM_TIERS);
    const m = 1 + Math.floor(rng() * window.Churn.NUM_MONTHS);
    return { tier, m, terminal: false };
  }

  /* ---------- sample one episode under eps-greedy on Q (no model used
     beyond window.Churn.sample, which is the world we are LEARNING) ----------
     Returns the list of SARSA tuples (s, a, r, s', a') for the episode.
     exploringStart: begin from a random state (live trainer) vs the
     canonical initial state (the teaching illustration). */
  function genEpisode(Q, eps, rng, exploringStart) {
    const out = [];
    let s = exploringStart ? randomStart(rng) : window.Churn.initialState();
    let sIdx = window.Churn.stateIndex(s);
    let aId = window.SARSA.pickEpsGreedy(Q, sIdx, eps, rng);
    let aIdx = ACTIONS.indexOf(aId);

    for (let t = 0; t < MAX_MONTHS + 2; t++) {
      const sample = window.Churn.sample(s, aId, rng);
      const sNext = sample.sNext;
      const reward = sample.reward;
      if (sNext.terminal) {
        out.push({
          s, sIdx, a: aId, aIdx, r: reward,
          sNext, sNextIdx: -1, aNext: null, aNextIdx: -1,
          terminal: true, renewed: !!sNext.renewed, churned: !!sNext.churned,
          log: sample.log,
        });
        break;
      }
      const sNextIdx = window.Churn.stateIndex(sNext);
      const aNextId = window.SARSA.pickEpsGreedy(Q, sNextIdx, eps, rng);
      const aNextIdx = ACTIONS.indexOf(aNextId);
      out.push({
        s, sIdx, a: aId, aIdx, r: reward,
        sNext, sNextIdx, aNext: aNextId, aNextIdx,
        terminal: false, log: sample.log,
      });
      s = sNext; sIdx = sNextIdx; aId = aNextId; aIdx = aNextIdx;
    }
    return out;
  }

  /* Greedy return of the current Q: the average episode return when we pull
     the believed-best lever every month (eps = 0). A small Monte-Carlo
     estimate, used only as a "how good is the learned playbook right now"
     read-out (independent of the convergence bar). */
  function greedyReturn(Q, rng, episodes) {
    episodes = episodes || 80;
    let sum = 0;
    for (let e = 0; e < episodes; e++) {
      const ep = genEpisode(Q, 0, rng);
      for (const t of ep) sum += t.r;
    }
    return sum / episodes;
  }

  /* Convergence to Q*: 0 when q is all zero, 100 when q matches the oracle
     exactly. L1 distance normalised by sum|Q*|. */
  function convergencePct(Q) {
    if (!QSTAR) return 0;
    let dist = 0;
    for (let i = 0; i < Q.length; i++) dist += Math.abs(Q[i] - QSTAR[i]);
    return Math.max(0, Math.min(100, 100 * (1 - dist / QSTAR_L1)));
  }

  /* How many of the 25 states would the current greedy policy get RIGHT
     vs the oracle argmax. */
  function policyAgreement(Q) {
    if (!QSTAR) return { agree: 0, total: N };
    let agree = 0;
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let kq = 0, ko = 0, bq = Q[base], bo = QSTAR[base];
      for (let a = 1; a < A; a++) {
        if (Q[base + a] > bq) { bq = Q[base + a]; kq = a; }
        if (QSTAR[base + a] > bo) { bo = QSTAR[base + a]; ko = a; }
      }
      if (kq === ko) agree++;
    }
    return { agree, total: N };
  }

  /* ====================================================================== */
  window.scenes.scene11 = function (root) {
    root.classList.add('scene-pad', 's11-scene');
    root.innerHTML = '';

    /* ---- heading ---- */
    const heading = document.createElement('h2');
    heading.className = 's11-heading';
    heading.textContent = T('scene.title11');
    root.appendChild(heading);

    /* ---- step controls ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's11-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s11-prev">' + T('s11.btn.prev') + '</button>' +
      '<button class="poke-btn" id="s11-next">' + T('s11.btn.next') + '</button>' +
      '<div class="s11-status"><span class="s11-step-dots" id="s11-dots"></span>' +
        '<span class="s11-step-id" id="s11-step-id"></span></div>';
    root.appendChild(ctrls);

    /* ---- 2-column row: left = card / step-detail, right = illustration ---- */
    const row = document.createElement('div');
    row.className = 's11-row';
    root.appendChild(row);

    const left = document.createElement('div');
    left.className = 's11-left';
    row.appendChild(left);

    const right = document.createElement('div');
    right.className = 's11-right';
    row.appendChild(right);

    /* Right column: caption + trajectory tape + retention map + numberline. */
    const cap = document.createElement('div');
    cap.className = 's11-cap';
    right.appendChild(cap);

    const tapeWrap = document.createElement('div');
    tapeWrap.className = 's11-tape-wrap';
    right.appendChild(tapeWrap);
    const tapeTitle = document.createElement('div');
    tapeTitle.className = 's11-tape-title';
    tapeTitle.innerHTML = '<span>' + T('s11.tape.title') + '</span>' +
      '<span class="s11-tape-count" id="s11-tape-count"></span>';
    tapeWrap.appendChild(tapeTitle);
    const tape = document.createElement('div');
    tape.className = 's11-tape';
    tapeWrap.appendChild(tape);

    const qHost = document.createElement('div');
    qHost.className = 's11-q-host';
    right.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    const numline = document.createElement('div');
    numline.className = 's11-numline';
    numline.style.display = 'none';
    right.appendChild(numline);

    /* ====================================================================
       State
       ==================================================================== */
    let cursor = 0;
    const STEP_IDS = ['A', 'B', 'C', 'D', 'E'];
    const STEPS = STEP_IDS.length;

    /* Live-trainer (step E) state. Independent RNG so the live run is
       reproducible and does not perturb the illustration episode. */
    let Q = window.SARSA.makeQ();
    let liveRng = window.Churn.makeRng(SCFG.seed != null ? SCFG.seed : 41);
    let grRng = window.Churn.makeRng(7);          /* greedy-return estimator */
    let eps = EPS_DEFAULT;
    let episodesDone = 0;
    let curEp = [];            /* current episode's tuples, for the live tape */

    let playing = false;
    let playTimer = null;
    let playSpeedLvl = 2;       /* 0 slowest .. 4 fastest */
    const SPEED_MS = [900, 600, 380, 220, 110];
    const STEPS_PER_TICK = [1, 1, 1, 2, 4];   /* episodes applied per timer tick */

    /* Pre-sampled illustration episode (steps B/C/D). Fixed seed so the same
       path appears on every visit. Picked so the emphasised tuple is a clean
       non-terminal month (a teachable r + q[s',a']). */
    const illusRng = window.Churn.makeRng(20260530);
    const illusEp = pickIllusEpisode();
    const illusActive = pickIllusActive(illusEp);

    function pickIllusEpisode() {
      /* Draw a few episodes; prefer one with a NON-terminal month whose
         reward is non-zero (a paid lever), so the sample shows a real
         r + q[s',a'] bootstrap AND a visible nudge on the number line (a
         do-nothing month has r=0, which makes a degenerate line). */
      let best = null, bestScore = -1;
      for (let k = 0; k < 60; k++) {
        const ep = genEpisode(window.SARSA.makeQ(), EPS_DEFAULT, illusRng);
        if (ep.length > MAX_MONTHS + 1) continue;
        const hasPaidNonTerm = ep.some(t => !t.terminal && Math.abs(t.r) > 0.5);
        const nonTerm = ep.filter(t => !t.terminal).length;
        const score = (hasPaidNonTerm ? 100 : 0) + nonTerm;
        if (score > bestScore) { bestScore = score; best = ep; }
        if (hasPaidNonTerm && nonTerm >= 2) break;
      }
      return best;
    }

    /* Emphasise a non-terminal month with a non-zero reward if one exists
       (so s', a' and the nudge are both real); else the first non-terminal;
       else the first tuple. */
    function pickIllusActive(ep) {
      for (let i = 0; i < ep.length; i++) { if (!ep[i].terminal && Math.abs(ep[i].r) > 0.5) return i; }
      for (let i = 0; i < ep.length; i++) { if (!ep[i].terminal) return i; }
      return 0;
    }

    /* ====================================================================
       Right-column illustration helpers
       ==================================================================== */
    function clearOverlays() {
      qHost.querySelectorAll('.rm-cell.s11-mark, .rm-cell.s11-active, .rm-cell.s11-ghost')
        .forEach(c => c.classList.remove('s11-mark', 's11-active', 's11-ghost'));
      qHost.querySelectorAll('.rm-bar-row.s11-bar')
        .forEach(r => r.classList.remove('s11-bar'));
      qHost.querySelectorAll('.s11-cell-badge, .s11-cell-callout').forEach(b => b.remove());
      numline.style.display = 'none';
      numline.innerHTML = '';
      cap.innerHTML = '';
    }

    function paintIllusPath(opts) {
      opts = opts || {};
      const activeOnly = !!opts.activeOnly;
      const ghost = !!opts.ghost;
      illusEp.forEach((t, i) => {
        if (t.terminal) return;
        if (activeOnly && i !== illusActive) return;
        const node = qtbl.getCellNode(t.sIdx);
        if (!node) return;
        const isActive = (i === illusActive);
        node.classList.add('s11-mark');
        if (isActive) node.classList.add('s11-active');
        if (ghost && !isActive) node.classList.add('s11-ghost');
        const badge = document.createElement('div');
        badge.className = 's11-cell-badge' + (isActive ? ' active' : '');
        badge.textContent = String(i + 1);
        node.appendChild(badge);
        node.querySelectorAll('.rm-bar-row').forEach((r, k) => {
          if (k === t.aIdx) r.classList.add('s11-bar');
        });
      });
    }

    function renderIllusTape(highlight) {
      const n = illusEp.length;
      document.getElementById('s11-tape-count').textContent =
        n > 0 ? T('s11.tape.illus', { n: n }) : '';
      let html = '';
      for (let i = 0; i < n; i++) {
        const t = illusEp[i];
        const active = (i === highlight) ? ' active' : '';
        const term = t.terminal ? ' terminal' : '';
        html +=
          '<div class="s11-tuple' + active + term + '" data-i="' + i + '">' +
            '<div class="s11-tuple-t">t=' + (i + 1) + '</div>' +
            '<div class="s11-tuple-s">' + stateLabel(t.s) + '</div>' +
            '<div class="s11-tuple-a ' + leverTokenClass(t.a) + '">' + leverShort(t.a) + '</div>' +
            '<div class="s11-tuple-r">' + fmt(t.r) + '</div>' +
          '</div>';
        if (i < n - 1) html += '<div class="s11-tuple-arrow">&rarr;</div>';
      }
      tape.innerHTML = html;
    }

    function showTargetCallout() {
      const t = illusEp[illusActive];
      const node = qtbl.getCellNode(t.sIdx);
      if (!node) return;
      /* In the illustration q is still all-zero, so q[s',a'] = +0.00 and the
         target is just r + 0. That is the honest first sample. */
      const target = t.terminal ? t.r : (t.r + GAMMA * 0);
      const co = document.createElement('div');
      co.className = 's11-cell-callout';
      co.innerHTML =
        '<div class="s11-callout-title">' + T('s11.target.label') + '</div>' +
        '<div class="s11-callout-eq">r + q[s′,a′]</div>' +
        '<div class="s11-callout-eq">= ' + fmt(t.r) + ' + +0.00</div>' +
        '<div class="s11-callout-val">= <b>' + fmt(target) + '</b></div>';
      node.appendChild(co);
    }

    function showNumLine() {
      numline.style.display = 'block';
      const t = illusEp[illusActive];
      const targetVal = t.r;          /* q[s',a'] = 0 in the illustration */
      /* Range padded so q (at 0) and target both sit comfortably inside, with
         the 0-to-target span filling a good chunk of the width. */
      const span = Math.max(1, Math.abs(targetVal));
      const lo = Math.min(0, targetVal) - span * 0.5;
      const hi = Math.max(0, targetVal) + span * 0.5;
      const pctOf = v => ((v - lo) / (hi - lo)) * 100;
      const qPct = pctOf(0);
      const tgPct = pctOf(targetVal);
      const qNew = 0 + ALPHA * (targetVal - 0);
      const nwPct = pctOf(qNew);
      const dir = targetVal >= 0 ? 'up' : 'down';
      /* Label placement: q above its dot, qNew below (it sits near q), target
         above its dot. q and target are always far apart (0 vs r), so their
         top labels never collide; qNew's label goes below to clear q's. */
      numline.innerHTML =
        '<div class="s11-numline-title">' + T('s11.numline.title', { a: ALPHA.toFixed(2) }) + '</div>' +
        '<div class="s11-numline-track">' +
          '<div class="s11-numline-axis"></div>' +
          '<div class="s11-numline-arrow ' + dir + '" style="left:' + Math.min(qPct, tgPct) + '%;width:' + Math.abs(tgPct - qPct) + '%"></div>' +
          '<div class="s11-numline-dot q" style="left:' + qPct + '%"><span class="s11-numline-lab above">' + T('s11.numline.qold') + '</span></div>' +
          '<div class="s11-numline-dot tgt" style="left:' + tgPct + '%"><span class="s11-numline-lab above">' + T('s11.numline.tgt', { v: fmt(targetVal) }) + '</span></div>' +
          '<div class="s11-numline-dot new" style="left:' + nwPct + '%"><span class="s11-numline-lab below">' + T('s11.numline.qnew', { v: fmt(qNew) }) + '</span></div>' +
        '</div>';
    }

    /* ---- per-step illustration renderers (A-D) ---- */
    function illusBlank(capKey) {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.rm-val').forEach(v => { v.textContent = T('retmap.empty'); });
      tape.innerHTML = '';
      document.getElementById('s11-tape-count').textContent = '';
      if (capKey) cap.innerHTML = '<div class="s11-cap-line">' + T(capKey) + '</div>';
    }

    function illusA() {
      illusBlank('s11.illus.A');
    }
    function illusB() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.rm-val').forEach(v => { v.textContent = '+0.00'; });
      renderIllusTape(illusActive);
      paintIllusPath({ ghost: true });
      cap.innerHTML = '<div class="s11-cap-line">' + T('s11.illus.B') + '</div>';
    }
    function illusC() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.rm-val').forEach(v => { v.textContent = '+0.00'; });
      renderIllusTape(illusActive);
      paintIllusPath({ activeOnly: true });
      showTargetCallout();
      showNumLine();
      cap.innerHTML = '<div class="s11-cap-line">' + T('s11.illus.C') + '</div>';
    }
    function illusD() {
      qtbl.update(window.SARSA.makeQ(), { suppressFlash: true });
      qHost.querySelectorAll('.rm-val').forEach(v => { v.textContent = '+0.00'; });
      renderIllusTape(illusActive);
      paintIllusPath({ activeOnly: true });
      /* Mark the alternative (unproven) levers in the active cell to make the
         "try something else" idea concrete. */
      const t = illusEp[illusActive];
      const node = qtbl.getCellNode(t.sIdx);
      if (node) {
        node.querySelectorAll('.rm-bar-row').forEach((r, k) => {
          if (k !== t.aIdx) r.classList.add('s11-bar');
        });
      }
      cap.innerHTML = '<div class="s11-cap-line">' + T('s11.illus.D') + '</div>';
    }

    /* ====================================================================
       Step E, the model-free live trainer
       ==================================================================== */
    function renderLiveTape() {
      const n = curEp.length;
      const tc = document.getElementById('s11-tape-count');
      if (n === 0) {
        if (tc) tc.textContent = T('s11.tape.live0', { e: episodesDone });
        tape.innerHTML = '';
        return;
      }
      if (tc) tc.textContent = T('s11.tape.live', { e: episodesDone });
      let html = '';
      for (let i = 0; i < n; i++) {
        const t = curEp[i];
        const term = t.terminal ? ' terminal' : '';
        const explore = t.explore ? ' explore' : '';
        html +=
          '<div class="s11-tuple' + term + explore + '" data-i="' + i + '">' +
            '<div class="s11-tuple-t">t=' + (i + 1) + '</div>' +
            '<div class="s11-tuple-s">' + stateLabel(t.s) + '</div>' +
            '<div class="s11-tuple-a ' + leverTokenClass(t.a) + '">' + leverShort(t.a) + '</div>' +
            '<div class="s11-tuple-r">' + fmt(t.r) + '</div>' +
          '</div>';
        if (i < n - 1) html += '<div class="s11-tuple-arrow">&rarr;</div>';
      }
      /* terminal banner */
      const last = curEp[n - 1];
      if (last && last.terminal) {
        const cls = last.renewed ? 'renew' : 'churn';
        const lab = last.renewed ? T('terminal.renewed') : T('terminal.churned');
        html += '<div class="s11-tuple-arrow">&rarr;</div>' +
          '<div class="s11-tuple-end ' + cls + '">' + lab + '</div>';
      }
      tape.innerHTML = html;
    }

    function renderConvergence() {
      const pct = convergencePct(Q);
      const pa = policyAgreement(Q);
      const gr = episodesDone > 0 ? greedyReturn(Q, grRng, 60) : 0;
      cap.innerHTML =
        '<div class="s11-conv-row">' +
          '<span class="s11-conv-label">' + T('s11.conv.label') + '</span>' +
          '<span class="s11-conv-track"><span class="s11-conv-fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
          '<span class="s11-conv-val">' + pct.toFixed(0) + '%</span>' +
        '</div>' +
        '<div class="s11-conv-meta">' +
          '<span>' + T('s11.conv.agree', { a: pa.agree, n: pa.total }) + '</span>' +
          '<span>' + T('s11.conv.return', { v: fmt(gr) }) + '</span>' +
        '</div>';
    }

    /* Learn from ONE episode (no rendering). Exploring start + the current
       eps; the step size follows the annealing schedule (smaller as more
       episodes accumulate, so the estimates settle). Runs the SARSA update on
       each tuple in order and records the episode for the tape. Kept separate
       from rendering so a long burst (headless &run) does not repaint 25
       cells and re-run the greedy-return estimate on every single episode. */
    function learnOneEpisode() {
      const al = alphaAt(episodesDone);
      curEp = genEpisode(Q, eps, liveRng, true);
      /* Tag exploring vs greedy moves for the tape, then learn. The greedy
         action is computed deterministically (no RNG draw) so tagging never
         perturbs the training stream; Q is unchanged within the episode
         because we learn only after generating it. */
      for (const t of curEp) {
        t.explore = (t.aIdx !== greedyIdx(Q, t.sIdx));
        window.SARSA.update(Q, t.sIdx, t.a, t.r, t.sNextIdx, t.aNext, al, GAMMA, t.terminal);
      }
      episodesDone += 1;
    }

    /* One learning episode plus a full repaint (the interactive path:
       NEXT EPISODE and each PLAY tick). */
    function trainOneEpisode() {
      learnOneEpisode();
      qtbl.update(Q, { suppressFlash: episodesDone > 30 });
      renderLiveTape();
      renderConvergence();
    }

    function liveControlsHtml() {
      const epsPct = Math.round(eps * 100);
      return (
        '<div class="s11-live-ctrls">' +
          '<div class="s11-live-row">' +
            '<button class="poke-btn s11-play" id="s11-play">' + (playing ? T('s11.live.pause') : T('s11.live.play')) + '</button>' +
            '<button class="poke-btn" id="s11-once">' + T('s11.live.once') + '</button>' +
            '<button class="poke-btn" id="s11-reset-live">' + T('s11.live.reset') + '</button>' +
          '</div>' +
          '<div class="s11-live-row s11-slider">' +
            '<span class="s11-slider-lab">' + T('s11.live.speed') + '</span>' +
            '<span class="s11-slider-end">' + T('s11.live.slow') + '</span>' +
            '<input type="range" id="s11-speed" min="0" max="4" step="1" value="' + playSpeedLvl + '">' +
            '<span class="s11-slider-end">' + T('s11.live.fast') + '</span>' +
          '</div>' +
          '<div class="s11-live-row s11-slider">' +
            '<span class="s11-slider-lab">' + T('s11.live.eps') + ' <b id="s11-eps-val">' + eps.toFixed(2) + '</b></span>' +
            '<input type="range" id="s11-eps" min="0" max="60" step="1" value="' + epsPct + '">' +
          '</div>' +
          '<div class="s11-live-fixed">' + T('s11.live.alpha', { a0: ALPHA0.toFixed(2), fl: ALPHA_FLOOR.toFixed(2), now: alphaAt(episodesDone).toFixed(3) }) + '</div>' +
        '</div>'
      );
    }

    function renderLiveDetail() {
      const head =
        '<div class="s11-card-num">' + T('s11.step.label', { i: STEPS, n: STEPS }) + '</div>' +
        '<div class="s11-card-title">' + T('s11.step.E.title') + '</div>' +
        '<div class="s11-card-body">' + T('s11.step.E.body') + '</div>';

      /* Detail of the most recent episode (last applied tuple), so the
         learner can read one concrete SARSA update even while PLAYing. */
      let detail = '';
      if (curEp.length) {
        /* pick the last non-terminal tuple if present, else the terminal */
        let t = null;
        for (let i = curEp.length - 1; i >= 0; i--) { if (!curEp[i].terminal) { t = curEp[i]; break; } }
        if (!t) t = curEp[curEp.length - 1];
        const qNextEst = t.terminal ? 0 : Q[t.sNextIdx * A + t.aNextIdx];
        const target = t.terminal ? t.r : (t.r + GAMMA * qNextEst);
        const aNStr = t.terminal ? T('s11.live.terminal') : leverFull(t.aNext);
        const targetCalc = t.terminal
          ? T('s11.live.target_terminal', { r: fmt(t.r) })
          : fmt(t.r) + ' + ' + fmt(qNextEst) + ' = <b>' + fmt(target) + '</b>';
        /* trainOneEpisode already applied this episode's update, so Q now
           holds the post-update value of q[s,a]. Show that landed value next
           to the target it was nudged toward, at the current step size. */
        const alShown = alphaAt(Math.max(0, episodesDone - 1));
        const qNow = Q[t.sIdx * A + t.aIdx];
        detail =
          '<div class="s11-live-detail">' +
            '<div class="s11-live-detail-title">' + T('s11.live.last', { e: episodesDone }) + '</div>' +
            '<div class="s11-ld-row"><span class="s11-ld-k">s</span><span class="s11-ld-v">' + stateLabel(t.s) + '</span></div>' +
            '<div class="s11-ld-row"><span class="s11-ld-k">a</span><span class="s11-ld-v">' + leverFull(t.a) + (t.explore ? ' <i class="s11-explore-tag">' + T('s11.live.explored') + '</i>' : '') + '</span></div>' +
            '<div class="s11-ld-row"><span class="s11-ld-k">r</span><span class="s11-ld-v">' + fmt(t.r) + '</span></div>' +
            '<div class="s11-ld-row"><span class="s11-ld-k">s′</span><span class="s11-ld-v">' + stateLabel(t.sNext) + '</span></div>' +
            '<div class="s11-ld-row"><span class="s11-ld-k">a′</span><span class="s11-ld-v">' + aNStr + '</span></div>' +
            '<div class="s11-ld-div"></div>' +
            '<div class="s11-ld-calc"><span class="s11-ld-k">' + T('s11.live.target') + '</span> = ' + targetCalc + '</div>' +
            '<div class="s11-ld-calc">' + T('s11.live.nudge', { a: alShown.toFixed(3), q1: fmt(qNow) }) + '</div>' +
          '</div>';
      } else {
        detail =
          '<div class="s11-live-detail">' +
            '<div class="s11-live-detail-title">' + T('s11.live.ready') + '</div>' +
            '<div class="s11-ld-hint">' + T('s11.live.ready_body') + '</div>' +
          '</div>';
      }

      left.innerHTML = head + liveControlsHtml() + detail;
      wireLiveControls();
    }

    function wireLiveControls() {
      const play = document.getElementById('s11-play');
      if (play) play.addEventListener('click', togglePlay);
      const once = document.getElementById('s11-once');
      if (once) once.addEventListener('click', () => { pausePlay(); trainOneEpisode(); renderLiveDetail(); });
      const rst = document.getElementById('s11-reset-live');
      if (rst) rst.addEventListener('click', resetLive);
      const spd = document.getElementById('s11-speed');
      if (spd) spd.addEventListener('input', e => {
        playSpeedLvl = Math.max(0, Math.min(4, parseInt(e.target.value, 10) || 2));
      });
      const epsEl = document.getElementById('s11-eps');
      if (epsEl) epsEl.addEventListener('input', e => {
        eps = Math.max(0, Math.min(0.6, (parseInt(e.target.value, 10) || 0) / 100));
        const lab = document.getElementById('s11-eps-val');
        if (lab) lab.textContent = eps.toFixed(2);
      });
    }

    function resetLive() {
      pausePlay();
      Q = window.SARSA.makeQ();
      liveRng = window.Churn.makeRng(SCFG.seed != null ? SCFG.seed : 41);
      grRng = window.Churn.makeRng(7);
      episodesDone = 0;
      curEp = [];
      qtbl.reset();
      renderLiveTape();
      renderConvergence();
      renderLiveDetail();
    }

    /* ---- PLAY loop ---- */
    function setPlayLabel() {
      const b = document.getElementById('s11-play');
      if (b) {
        b.textContent = playing ? T('s11.live.pause') : T('s11.live.play');
        b.classList.toggle('is-playing', playing);
      }
    }
    function pausePlay() {
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      playing = false;
      setPlayLabel();
    }
    function tick() {
      playTimer = setTimeout(() => {
        playTimer = null;
        if (!playing) return;
        const k = STEPS_PER_TICK[playSpeedLvl];
        for (let i = 0; i < k; i++) trainOneEpisode();
        renderLiveDetail();
        if (playing) tick();
      }, SPEED_MS[playSpeedLvl]);
    }
    function startPlay() {
      if (playing) return;
      playing = true;
      setPlayLabel();
      tick();
    }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }

    /* ====================================================================
       Left column, derivation cards (A-D)
       ==================================================================== */
    /* Each derivation step leads with the MANAGER meaning (the card body),
       then the notation (KaTeX). Formulas live here, not in i18n, because
       they are math not prose. */
    const STEP_LATEX = {
      A: [],
      B: [
        String.raw`Q^{\star}(s,a)\;=\;\mathbb{E}\!\left[\,R\;+\;Q^{\star}(S',A')\,\right]`,
        String.raw`\phantom{Q^{\star}(s,a)}\;\approx\;\underbrace{\,r\;+\;\mathtt{q}[s',a']\,}_{\textstyle \mathtt{target}}`,
      ],
      C: [
        String.raw`\boxed{\;\mathtt{q}[s,a]\;\leftarrow\;\mathtt{q}[s,a]\;+\;\alpha\,\bigl(\,\mathtt{target}\;-\;\mathtt{q}[s,a]\,\bigr)\;}`,
      ],
      D: [
        String.raw`a\;=\;\begin{cases}\text{a random lever} & \text{with prob. } \varepsilon\\[2pt]\arg\max_{a'}\,\mathtt{q}[s,a'] & \text{otherwise}\end{cases}`,
      ],
    };

    function renderCard(id) {
      let html =
        '<div class="s11-card-num">' + T('s11.step.label', { i: cursor + 1, n: STEPS }) + '</div>' +
        '<div class="s11-card-title">' + T('s11.step.' + id + '.title') + '</div>' +
        '<div class="s11-card-body">' + T('s11.step.' + id + '.body') + '</div>';
      left.innerHTML = html;
      const fl = STEP_LATEX[id] || [];
      for (const f of fl) {
        const box = document.createElement('div');
        box.className = 's11-card-formula poke-formula';
        left.appendChild(box);
        if (window.Katex) window.Katex.render(f, box, true);
      }
      const footKey = 's11.step.' + id + '.foot';
      const foot = T(footKey);
      if (foot && foot !== footKey) {
        const fEl = document.createElement('div');
        fEl.className = 's11-card-foot';
        fEl.innerHTML = foot;
        left.appendChild(fEl);
      }
    }

    /* ====================================================================
       Pager
       ==================================================================== */
    function renderDots() {
      let h = '';
      for (let i = 0; i < STEPS; i++) {
        h += '<span class="s11-dot' + (i === cursor ? ' on' : '') + (i < cursor ? ' done' : '') + '"></span>';
      }
      const dots = document.getElementById('s11-dots');
      if (dots) dots.innerHTML = h;
      const id = document.getElementById('s11-step-id');
      if (id) id.textContent = STEP_IDS[cursor];
    }

    function applyCursor() {
      pausePlay();
      const id = STEP_IDS[cursor];
      document.getElementById('s11-prev').disabled = (cursor === 0);
      document.getElementById('s11-next').disabled = (cursor === STEPS - 1);
      renderDots();
      clearOverlays();

      if (id === 'E') {
        /* live trainer: keep whatever progress exists; a blank board on a
           fresh entry so the fill is watched from zero. */
        if (episodesDone === 0) { qtbl.reset(); }
        else { qtbl.update(Q, { suppressFlash: true }); }
        renderLiveTape();
        renderConvergence();
        renderLiveDetail();
        return;
      }

      renderCard(id);
      switch (id) {
        case 'A': illusA(); break;
        case 'B': illusB(); break;
        case 'C': illusC(); break;
        case 'D': illusD(); break;
      }
    }

    /* ---- events ---- */
    document.getElementById('s11-prev').addEventListener('click', () => {
      if (cursor > 0) { cursor--; applyCursor(); }
    });
    document.getElementById('s11-next').addEventListener('click', () => {
      if (cursor < STEPS - 1) { cursor++; applyCursor(); }
    });

    applyCursor();

    /* &run: headless capture jumps to the live trainer and applies a
       deterministic burst of episodes so the retention map is visibly
       filled. Never auto-runs on a bare onEnter. */
    if (/[#&?]run\b/.test(window.location.hash)) {
      setTimeout(() => {
        cursor = STEPS - 1;
        applyCursor();
        /* Apply the full trained budget so the screenshot shows a strongly
           converged map (matching the verified precompute: ~23/25 cells, the
           blue notch present). Learn without per-episode rendering, then
           repaint once. The live PLAY button is unaffected. */
        const burst = (SCFG.episodes != null ? SCFG.episodes : 12000);
        for (let i = 0; i < burst; i++) learnOneEpisode();
        qtbl.update(Q, { suppressFlash: true });
        renderLiveTape();
        renderConvergence();
        renderLiveDetail();
      }, 220);
    }
    /* &s11=N flag: jump to step N (1-indexed) for targeted capture. */
    const sm = (window.location.hash || '').match(/[#&?]s11=(\d+)/);
    if (sm) {
      const target = Math.min(STEPS - 1, Math.max(0, parseInt(sm[1], 10) - 1));
      setTimeout(() => { cursor = target; applyCursor(); }, 120);
    }

    return {
      onEnter() { applyCursor(); },
      onLeave() { pausePlay(); },
      onNextKey() {
        if (cursor < STEPS - 1) { cursor++; applyCursor(); return true; }
        return false;
      },
      onPrevKey() {
        if (cursor > 0) { cursor--; applyCursor(); return true; }
        return false;
      },
    };
  };
})();

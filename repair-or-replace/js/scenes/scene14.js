/* Scene 14, "SARSA: let her drive": the free-running cockpit, staged.
 *
 *   The live-learning half of the SARSA pair (scene 11 walks through one
 *   nudge by hand). OLD BESSIE drives ONE endless stream of weeks
 *   (continuing task, gamma = 0.9, no episode resets, terminal=false in
 *   every update) and after each week the learner nudges exactly one
 *   Q-cell toward what the logbook just said:
 *
 *       q[s,a] <- q[s,a] + alpha * ( r + 0.9 * q[s',a'] - q[s,a] )
 *
 *   True on-policy SARSA: pick a' for s' (eps-greedy), update WITH it, then
 *   actually execute that a' next week. The local pickTagged() mirrors
 *   SARSA.pickEpsGreedy draw for draw (same rng consumption) and reports
 *   whether the eps coin came up EXPLORE, so the readout can tag the choice.
 *
 *   Panels EARN their place (the staging is the whole point of this pass):
 *     on entry      van + empty Q-table + DRIVE / STEP / RESET, nothing else
 *     first week    the logbook line, the live nudge card and the money
 *                   curve rise in (staggered)
 *     first lock    the bands-vs-DP strip appears when the first state's
 *                   band locks in (one row visited)
 *     driving       the SPEED / EPSILON / ALPHA slider tray slides in at the
 *                   first DRIVE (or after 8 hand-stepped weeks)
 *   Panels stay revealed across RESET and re-entry; the reveal is a
 *   first-visit teaching device, not run state.
 *
 *   Headless hooks:
 *     &run      auto-clicks DRIVE: fast-forwards RUN_WEEKS weeks
 *               synchronously on the PINNED seed (bands verified offline to
 *               match DATA's three bands at that horizon), renders once,
 *               stays paused. Everything is revealed.
 *     &step=K   cold-entry snapshots on the same pinned seed, paused:
 *               0 entry, 1 one week (logbook + curve + bands, no tray),
 *               2 thirty weeks + tray (mid-learning), 3 RUN_WEEKS
 *               (converged, banner up).
 *
 *   Contract: window.scenes.scene14 = function(root){ return {...}; }
 *   onLeave pauses the driver; cold-entry safe; [data-run-primary] = DRIVE.
 */
(function () {
  window.scenes = window.scenes || {};

  const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
    ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];
  const NUM_STATES = (window.Van && window.Van.NUM_STATES) || 4;
  const GAMMA = (window.Van && window.Van.GAMMA != null) ? window.Van.GAMMA : 0.9;

  const RUN_SEED = 12345;    /* pinned seed; bands verified at RUN_WEEKS */
  const RUN_WEEKS = 4000;
  const STEP_WEEKS = [0, 1, 30, RUN_WEEKS];   /* &step=K snapshots */

  /* speed levels: tick delay, weeks folded per tick, what gets narrated */
  const SPEEDS = [
    { name: 'SLOW',  tick: 900, weeks: 1,  fx: true,  formula: true,  flash: true,  chartEvery: 1 },
    { name: 'BRISK', tick: 260, weeks: 1,  fx: false, formula: false, flash: false, chartEvery: 2 },
    { name: 'FAST',  tick: 110, weeks: 6,  fx: false, formula: false, flash: false, chartEvery: 3 },
    { name: 'TURBO', tick: 50,  weeks: 50, fx: false, formula: false, flash: false, chartEvery: 4 },
  ];

  window.scenes.scene14 = function (root) {
    root.classList.add('scene-pad', 'scene14-scene');
    root.innerHTML = '';

    const Van = window.Van;
    const SARSA = window.SARSA;
    const Actions = window.Actions;
    const A_IDS = Actions.MOVE_IDS;                       /* [run, service, replace] */
    const DATA = window.DATA || {};
    const TARGET = DATA.policy || ['run', 'service', 'replace', 'replace'];
    const Curve = window.LearningCurve || window.Chart;   /* js/chart.js export */

    const RUN = /[#&?]run\b/.test(window.location.hash || '');
    const STEP_K = (function () {
      const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
      if (!m) return null;
      const n = parseInt(m[1], 10);
      return Number.isFinite(n) ? Math.max(0, Math.min(STEP_WEEKS.length - 1, n)) : null;
    })();
    const PINNED = RUN || STEP_K != null;
    const INSTANTISH = PINNED ||
      /[#&?]instant\b/.test(window.location.hash || '') ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* eps-greedy with an EXPLORE/GREEDY tag. Mirrors SARSA.pickEpsGreedy
       exactly (same branches, same rng draws), so the trajectory is the one
       the shared primitive would produce. */
    function pickTagged(Q, sIdx, eps, rng) {
      if (rng() < eps) {
        return { a: A_IDS[Math.floor(rng() * A_IDS.length)], explored: true };
      }
      return { a: SARSA.argmaxQ(Q, sIdx, rng), explored: false };
    }
    const aIdx = (id) => A_IDS.indexOf(id);

    /*, DOM, */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = 'SARSA: LET HER DRIVE';
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 's14-lede';
    lede.innerHTML = 'No printed odds out here. Press <b>DRIVE</b>.';
    root.appendChild(lede);

    /*, main two-column row, */
    const main = document.createElement('div');
    main.className = 's14-row';
    root.appendChild(main);

    const left = document.createElement('div');
    left.className = 's14-left';
    main.appendChild(left);

    /* van panel (visible from entry) */
    const vanPanel = document.createElement('div');
    vanPanel.className = 's14-van-panel';
    vanPanel.innerHTML =
      '<div class="s14-van-head"><span class="s14-cap">THE VAN, LIVE</span>' +
      '<span class="s14-week">WEEK <b id="s14-week">0</b></span></div>' +
      '<div class="s14-van-host" id="s14-van"></div>';
    left.appendChild(vanPanel);
    const van = window.VanCard.mount(vanPanel.querySelector('#s14-van'), { wear: 0, size: 'md' });
    const weekEl = vanPanel.querySelector('#s14-week');

    /* this-week logbook line (gated: first week) */
    const strip = document.createElement('div');
    strip.className = 's14-strip';
    strip.hidden = true;
    strip.innerHTML =
      '<div class="s14-cap">THIS WEEK IN THE LOGBOOK</div>' +
      '<div class="s14-tuple" id="s14-tuple"></div>';
    left.appendChild(strip);
    const tupleEl = strip.querySelector('#s14-tuple');

    /* the update rule, live (gated: first week) */
    const updCard = document.createElement('div');
    updCard.className = 's14-upd-card';
    updCard.hidden = true;
    updCard.innerHTML =
      '<div class="s14-cap">THE ONE-CELL NUDGE, LIVE</div>' +
      '<div class="s14-upd" id="s14-rule"></div>' +
      '<div class="s14-upd s14-upd-live" id="s14-live"></div>' +
      '<div class="s14-upd-chips">' +
        '<span class="s14-chip-td" id="s14-td">TD &mdash;</span>' +
        '<span class="s14-chip-q" id="s14-qmove">q[s,a] &mdash;</span>' +
      '</div>';
    left.appendChild(updCard);
    window.Katex.render(
      String.raw`q[s,a] \;\leftarrow\; q[s,a] + \alpha\,\bigl(\, r + 0.9\, q[s',a'] - q[s,a] \,\bigr)`,
      updCard.querySelector('#s14-rule'), true
    );
    const liveEl = updCard.querySelector('#s14-live');
    const tdEl = updCard.querySelector('#s14-td');
    const qmoveEl = updCard.querySelector('#s14-qmove');

    /* right column: QTable (entry) + bands (gated: first lock) */
    const right = document.createElement('div');
    right.className = 's14-right';
    main.appendChild(right);

    const rcap = document.createElement('div');
    rcap.className = 's14-cap';
    rcap.textContent = 'THE SCORECARD, FILLING ITSELF';
    right.appendChild(rcap);

    const qHost = document.createElement('div');
    qHost.className = 's14-qhost';
    right.appendChild(qHost);
    const qt = window.QTable.mount(qHost);

    const bandsWrap = document.createElement('div');
    bandsWrap.className = 's14-bands-wrap';
    bandsWrap.hidden = true;
    bandsWrap.innerHTML = '<div class="s14-cap">BANDS VS THE DP ANSWER</div>' +
      '<div class="s14-bands" id="s14-bands"></div>';
    right.appendChild(bandsWrap);
    const bandsRow = bandsWrap.querySelector('#s14-bands');
    const bandEls = [];
    for (let s = 0; s < NUM_STATES; s++) {
      const b = document.createElement('span');
      b.className = 's14-band is-grey';
      b.innerHTML = '<span class="s14-band-state">' + STATE_DISPLAY[s] + '</span>' +
                    '<span class="s14-band-act">?</span>' +
                    '<span class="s14-band-status">UNSEEN</span>';
      bandsRow.appendChild(b);
      bandEls[s] = b;
    }

    const banner = document.createElement('div');
    banner.className = 's14-banner';
    banner.hidden = true;
    banner.textContent = 'THREE BANDS REDISCOVERED: NO ODDS WERE GIVEN.';
    right.appendChild(banner);

    /* the closing line, revealed with the matched bands */
    const closing = document.createElement('div');
    closing.className = 's14-closing';
    closing.hidden = true;
    closing.innerHTML = 'DP needed the odds. SARSA needed <b>only the logbook</b>.';
    right.appendChild(closing);

    /*, bottom: learning curve (gated) + controls (entry), */
    const bottom = document.createElement('div');
    bottom.className = 's14-bottom';
    root.appendChild(bottom);

    const curveWrap = document.createElement('div');
    curveWrap.className = 's14-curve-wrap';
    curveWrap.hidden = true;
    curveWrap.innerHTML = '<div class="s14-cap">WEEKLY MONEY: RAW + 50-WEEK AVERAGE</div>' +
      '<div class="s14-curve-host" id="s14-curve"></div>' +
      '<div class="s14-curve-empty">the curve starts with the first week.</div>';
    bottom.appendChild(curveWrap);
    const curve = Curve.mount(curveWrap.querySelector('#s14-curve'), {
      W: 540, H: 170, window: 50,
      pad: { top: 10, right: 16, bottom: 30, left: 42 },
    });
    /* the shared chart labels its axes for episodic siblings; this task is
       continuing, so relabel the same nodes to weeks */
    (function relabel() {
      const labs = curveWrap.querySelectorAll('.lc-axis-label');
      if (labs[0]) labs[0].textContent = 'week';
      if (labs[1]) labs[1].textContent = 'money';
    })();

    const panel = document.createElement('div');
    panel.className = 's14-ctrl-panel';
    panel.innerHTML =
      '<div class="s14-btns">' +
        '<button class="poke-btn s14-primary" id="s14-drive" data-run-primary>&#9654; DRIVE</button>' +
        '<button class="poke-btn" id="s14-step">STEP</button>' +
        '<button class="poke-btn" id="s14-reset">RESET</button>' +
      '</div>' +
      '<div class="s14-tray" hidden>' +
        '<div class="poke-menu-row s14-menurow">SPEED' +
          '<input type="range" id="s14-speed" min="0" max="3" step="1" value="0">' +
          '<span class="val" id="s14-speed-val">SLOW</span></div>' +
        '<div class="poke-menu-row s14-menurow">EPSILON' +
          '<input type="range" id="s14-eps" min="0" max="50" step="1" value="15">' +
          '<span class="val" id="s14-eps-val">0.15</span></div>' +
        '<div class="poke-menu-row s14-menurow">ALPHA' +
          '<input type="range" id="s14-alpha" min="1" max="50" step="1" value="15">' +
          '<span class="val" id="s14-alpha-val">0.15</span></div>' +
      '</div>';
    bottom.appendChild(panel);
    const tray = panel.querySelector('.s14-tray');

    /*, staged reveals, */
    function revealOnce(el, slot) {
      if (!el || el.dataset.shown) return;
      el.dataset.shown = '1';
      el.hidden = false;
      if (!INSTANTISH) {
        el.style.animationDelay = ((slot || 0) * 220) + 'ms';
        el.classList.add('s14-enter');
      }
    }
    function revealTray() { revealOnce(tray, 0); }
    function maybeReveal() {
      if (week >= 1) {
        revealOnce(strip, 0);
        revealOnce(updCard, 1);
        revealOnce(curveWrap, 2);
      }
      if (week >= 8) revealTray();   /* a dedicated hand-stepper gets the dials too */
    }

    /*, training state, */
    let Q, rng, baseSeed, week, sCur, aCur, aCurExp, lastObs, rewards;
    let eps = 0.15, alpha = 0.15, speed = 0;
    let playing = false, timer = null, tickCount = 0;
    let bandsFlashShown = false, everMatched = false;

    function freshSeed() {
      return PINNED ? RUN_SEED : (((Date.now() ^ (Math.random() * 1e9)) >>> 0) || 1);
    }

    function hardReset() {
      pausePlay();
      Q = SARSA.makeQ();
      baseSeed = freshSeed();
      rng = Van.makeRng(baseSeed);
      week = 0;
      sCur = Van.initialState();
      aCur = null;
      aCurExp = false;
      lastObs = null;
      rewards = [];
      tickCount = 0;
      bandsFlashShown = false;
      everMatched = false;
      banner.hidden = true;
      closing.hidden = true;
      van.setName('OLD BESSIE');
      van.set(0);
      qt.reset();
      refreshCurve();
      renderWeek();
      renderTuple(null);
      renderFormula(null);
      renderBands(false);
      updateCallPulse();
    }

    /*, one SARSA week (the continuing task: always bootstraps), */
    function stepWeek() {
      if (aCur === null) {
        const p0 = pickTagged(Q, sCur.wear, eps, rng);
        aCur = p0.a; aCurExp = p0.explored;
      }
      const sFrom = sCur.wear;
      const out = Van.sample(sCur, aCur, rng);
      const pN = pickTagged(Q, out.sNext.wear, eps, rng);
      const qBefore = Q[sFrom * 3 + aIdx(aCur)];
      const qNext = Q[out.sNext.wear * 3 + aIdx(pN.a)];
      const td = SARSA.update(Q, sFrom, aCur, out.reward, out.sNext.wear, pN.a,
                              alpha, GAMMA, false /* continuing: never terminal */);
      week++;
      rewards.push(out.reward);
      lastObs = {
        week, sFrom, a: aCur, aExp: aCurExp, r: out.reward,
        sTo: out.sNext.wear, aNext: pN.a, aNextExp: pN.explored,
        qBefore, qNext, qAfter: Q[sFrom * 3 + aIdx(aCur)], td,
        log: out.log,
      };
      sCur = out.sNext;
      aCur = pN.a; aCurExp = pN.explored;     /* execute the picked a' next week */
      return lastObs;
    }

    /*, rendering, */
    const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
    const fmtSigned = (v) => (v >= 0 ? '+' : '') + v;

    function wearChip(w) {
      return '<span class="s14-wear w' + w + '">' + STATE_DISPLAY[w] + '</span>';
    }
    function leverChip(id) {
      return '<span class="s14-lever ' + Actions.toneClass(id) + '">' +
             Actions.shortLabel(id) + '</span>';
    }
    function pickTag(explored) {
      return '<span class="s14-pick ' + (explored ? 'explore' : 'greedy') + '">' +
             (explored ? 'EXPLORE' : 'GREEDY') + '</span>';
    }

    function renderWeek() {
      weekEl.textContent = week.toLocaleString('en-US');
    }

    function renderTuple(obs) {
      if (!obs) {
        tupleEl.innerHTML =
          '<div class="s14-trow"><span class="s14-tlab">s</span><span class="s14-tval">' +
            wearChip(sCur.wear) + '</span></div>' +
          '<div class="s14-trow muted"><span class="s14-tlab">a</span><span class="s14-tval">? press DRIVE or STEP</span></div>' +
          '<div class="s14-trow muted"><span class="s14-tlab">r</span><span class="s14-tval">?</span></div>' +
          '<div class="s14-trow muted"><span class="s14-tlab">s&prime;</span><span class="s14-tval">?</span></div>' +
          '<div class="s14-trow muted"><span class="s14-tlab">a&prime;</span><span class="s14-tval">?</span></div>';
        return;
      }
      const bd = obs.log && obs.log.breakdown
        ? ' <span class="s14-bd">BREAKDOWN</span>' : '';
      tupleEl.innerHTML =
        '<div class="s14-trow"><span class="s14-tlab">s</span><span class="s14-tval">' +
          wearChip(obs.sFrom) + '</span></div>' +
        '<div class="s14-trow"><span class="s14-tlab">a</span><span class="s14-tval">' +
          leverChip(obs.a) + ' ' + pickTag(obs.aExp) + '</span></div>' +
        '<div class="s14-trow"><span class="s14-tlab">r</span><span class="s14-tval s14-r ' +
          (obs.r >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(obs.r) + bd + '</span></div>' +
        '<div class="s14-trow"><span class="s14-tlab">s&prime;</span><span class="s14-tval">' +
          wearChip(obs.sTo) + '</span></div>' +
        '<div class="s14-trow"><span class="s14-tlab">a&prime;</span><span class="s14-tval">' +
          leverChip(obs.aNext) + ' ' + pickTag(obs.aNextExp) + '</span></div>';
    }

    /* live numbers in the rule; negatives get parentheses */
    function texNum(v, dp) {
      const s = dp ? fmt1(v) : String(v);
      return v < 0 ? '(' + s + ')' : s;
    }
    function renderFormula(obs) {
      if (!obs) {
        liveEl.innerHTML = '<span class="s14-upd-wait">numbers appear as the weeks roll&hellip;</span>';
        tdEl.innerHTML = 'TD &mdash;';
        tdEl.className = 's14-chip-td';
        qmoveEl.innerHTML = 'q[s,a] &mdash;';
        return;
      }
      const sName = '\\text{' + STATE_DISPLAY[obs.sFrom] + '}';
      const aName = '\\text{' + Actions.shortLabel(obs.a) + '}';
      const tex =
        'q[' + sName + ',' + aName + '] \\leftarrow ' + fmt1(obs.qBefore) +
        ' + ' + alpha.toFixed(2) + '\\,\\bigl(' + texNum(obs.r, false) +
        ' + 0.9 \\cdot ' + texNum(obs.qNext, true) +
        ' - ' + texNum(obs.qBefore, true) + '\\bigr) = ' + fmt1(obs.qAfter);
      window.Katex.render(tex, liveEl, false);
      tdEl.textContent = 'TD ' + (obs.td >= 0 ? '+' : '') + fmt1(obs.td);
      tdEl.className = 's14-chip-td ' + (obs.td >= 0 ? 'pos' : 'neg');
      qmoveEl.innerHTML = 'q[s,a] ' + fmt1(obs.qBefore) + ' -&gt; ' + fmt1(obs.qAfter);
    }

    function renderBands(allowFx) {
      const pol = SARSA.argmaxPolicy(Q);
      let all = true, any = false;
      for (let s = 0; s < NUM_STATES; s++) {
        const got = pol[s];
        const el = bandEls[s];
        const act = el.querySelector('.s14-band-act');
        const status = el.querySelector('.s14-band-status');
        if (!got) {                       /* row never visited yet */
          el.className = 's14-band is-grey';
          act.textContent = '?';
          status.textContent = 'UNSEEN';
          all = false;
        } else if (got === TARGET[s]) {
          any = true;
          el.className = 's14-band is-good';
          act.textContent = Actions.shortLabel(got);
          status.textContent = 'MATCH';
        } else {
          any = true;
          el.className = 's14-band is-bad';
          act.textContent = Actions.shortLabel(got);
          status.textContent = 'WRONG';
          all = false;
        }
      }
      if (any) revealOnce(bandsWrap, 3);   /* first locked band brings the strip in */
      if (all) {
        everMatched = true;
        closing.hidden = false;
        if (!bandsFlashShown) {
          bandsFlashShown = true;        /* once per run */
          banner.hidden = false;
          if (allowFx) {
            banner.classList.remove('s14-banner-flash');
            void banner.offsetWidth;
            banner.classList.add('s14-banner-flash');
          }
          if (window.SFX) window.SFX.play('win');
        }
      }
    }

    function mirrorVan(obs, withFx) {
      if (!obs) { van.set(sCur.wear); return; }
      if (!withFx) { van.set(obs.sTo); return; }
      const face = obs.log.face;
      if (face === 'breakdown') van.playBreakdown(() => van.set(obs.sTo));
      else if (face && face.indexOf('fix') === 0) van.playService(() => van.set(obs.sTo));
      else if (face === 'new') van.playReplace();      /* resets itself to HEALTHY */
      else van.set(obs.sTo);
    }

    function refreshCurve() {
      curveWrap.classList.toggle('s14-curve-blank', !rewards.length);
      if (!rewards.length) { curve.setData([0]); return; }   /* wipes the old path */
      curve.setData(rewards);
      curve.setCursor(rewards.length - 1);
    }
    /* redraws get rarer as the logbook grows (the path is O(n)) */
    function chartDue(cfg) {
      const n = rewards.length;
      const every = n < 2500 ? cfg.chartEvery : (n < 10000 ? cfg.chartEvery * 8 : cfg.chartEvery * 24);
      return tickCount % every === 0;
    }

    /* one render pass after a batch of weeks */
    function renderBatch(cfg, narrated) {
      maybeReveal();
      qt.update(Q, { suppressFlash: !cfg.flash });
      renderWeek();
      renderBands(true);
      renderTuple(lastObs);
      mirrorVan(lastObs, narrated && cfg.fx);
      if (narrated && cfg.formula) renderFormula(lastObs);
      if (chartDue(cfg) || narrated) refreshCurve();
      updateCallPulse();
    }

    /*, the driver, */
    function driveBtn() { return document.getElementById('s14-drive'); }
    function setDriveLabel() {
      driveBtn().innerHTML = playing ? '&#9632; PAUSE' : '&#9654; DRIVE';
    }
    /* the DRIVE button pulses until the first week rolls */
    function updateCallPulse() {
      driveBtn().classList.toggle('s14-call', week === 0 && !playing && !INSTANTISH);
    }
    function pausePlay() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (playing) {
        playing = false;
        setDriveLabel();
        /* paused: make the last update legible whatever the speed was */
        if (lastObs) { renderFormula(lastObs); renderTuple(lastObs); refreshCurve(); }
      }
    }
    function tick() {
      timer = setTimeout(() => {
        timer = null;
        if (!playing) return;
        const cfg = SPEEDS[speed];
        for (let i = 0; i < cfg.weeks; i++) stepWeek();
        tickCount++;
        renderBatch(cfg, cfg.weeks === 1);
        tick();
      }, SPEEDS[speed].tick);
    }
    function startPlay() {
      if (playing) return;
      revealTray();                 /* the dials appear once driving starts */
      if (RUN && week === 0) { fastForward(); return; }
      playing = true;
      setDriveLabel();
      updateCallPulse();
      tick();
    }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }

    /* deterministic synchronous fast-forward on the pinned seed */
    function fastForward(weeksToRun) {
      const n = weeksToRun || RUN_WEEKS;
      for (let i = 0; i < n; i++) stepWeek();
      maybeReveal();
      qt.update(Q, { suppressFlash: true });
      renderWeek();
      renderBands(false);
      renderTuple(lastObs);
      van.set(sCur.wear);
      renderFormula(lastObs);
      refreshCurve();
      updateCallPulse();
    }

    function stepOnce() {
      pausePlay();
      stepWeek();
      tickCount++;
      renderBatch({ fx: true, formula: true, flash: true, chartEvery: 1 }, true);
      refreshCurve();
    }

    /*, wiring, */
    document.getElementById('s14-step').addEventListener('click', stepOnce);
    document.getElementById('s14-reset').addEventListener('click', hardReset);
    driveBtn().addEventListener('click', togglePlay);

    function wireSlider(id, valId, apply) {
      const el = document.getElementById(id);
      const val = document.getElementById(valId);
      el.addEventListener('input', () => apply(parseInt(el.value, 10) || 0, val));
      /* the pager ignores arrows while a slider has focus; release it after
         pointer use so presenters can keep stepping with the keys */
      el.addEventListener('pointerup', () => el.blur());
      el.addEventListener('change', () => el.blur());
    }
    wireSlider('s14-speed', 's14-speed-val', (v, val) => {
      speed = Math.max(0, Math.min(3, v));
      val.textContent = SPEEDS[speed].name;
    });
    wireSlider('s14-eps', 's14-eps-val', (v, val) => {
      eps = v / 100;
      val.textContent = eps.toFixed(2);
    });
    wireSlider('s14-alpha', 's14-alpha-val', (v, val) => {
      alpha = v / 100;
      val.textContent = alpha.toFixed(2);
    });

    hardReset();

    /* &step=K cold-entry snapshot (pinned seed, paused, no animations) */
    if (STEP_K != null && STEP_K > 0) {
      if (STEP_K >= 2) revealTray();
      fastForward(STEP_WEEKS[STEP_K]);
    }

    return {
      onEnter() {
        /* re-entry: repaint the cached board without touching the run */
        qt.update(Q, { suppressFlash: true });
        renderWeek();
        renderBands(false);
        renderTuple(lastObs);
        mirrorVan(lastObs, false);
        setDriveLabel();
        updateCallPulse();
      },
      onLeave() { pausePlay(); },
      onNextKey() { return false; },   /* free-running scene: keys page on */
      onPrevKey() { return false; },
    };
  };
})();

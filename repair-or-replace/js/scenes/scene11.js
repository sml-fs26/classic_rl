/* Scene 11, "SARSA: learn from the logbook": the live-learning flagship.
 *
 *   The counterpart to scene 9 with the printed odds taken away. OLD BESSIE
 *   drives ONE endless stream of weeks (continuing task, gamma = 0.9, no
 *   episode resets, terminal=false in every update) and after each week the
 *   learner nudges exactly one Q-cell toward what the logbook just said:
 *
 *       q[s,a] <- q[s,a] + alpha * ( r + 0.9 * q[s',a'] - q[s,a] )
 *
 *   True on-policy SARSA: pick a' for s' (eps-greedy), update WITH it, then
 *   actually execute that a' next week. The local pickTagged() mirrors
 *   SARSA.pickEpsGreedy draw for draw (same rng consumption) and additionally
 *   reports whether the eps coin came up EXPLORE, so the readout can tag the
 *   choice; the learning dynamics are identical to the shared primitive.
 *
 *   Layout:
 *     left   the live board: a VanCard mirroring the state, the week count,
 *            the (s, a, r, s', a') logbook line with EXPLORE/GREEDY tags,
 *            and the update rule via KaTeX with live numbers substituted
 *            when paused / stepping / at SLOW speed, plus a signed TD chip.
 *     right  the 4x3 QTable filling live + a BANDS indicator row comparing
 *            SARSA.argmaxPolicy(Q) to DATA.policy per state (grey until the
 *            row is visited, red on mismatch, green on match). When all 4
 *            match, "THREE BANDS REDISCOVERED" flashes once per run.
 *     below  a learning curve of weekly money (raw + moving average) and
 *            the controls: DRIVE/PAUSE, STEP, RESET, SPEED, eps, alpha.
 *
 *   Speeds: the default is deliberately SLOW (~1 week / 900ms with the van
 *   fx) so one update is legible; faster levels drop the fx and batch the
 *   chart; TURBO folds ~50 weeks into each tick. The sim cadence is a
 *   teaching control, not an animation, so it is NOT collapsed under
 *   reduced motion (the van fx collapse themselves inside VanCard).
 *
 *   Headless (&run): the auto-clicked DRIVE fast-forwards RUN_WEEKS weeks
 *   synchronously on a PINNED seed (verified offline: bands match DATA's
 *   three bands at that horizon), renders everything once, and stays
 *   paused, so the capture is stable and converged. Interactive runs draw
 *   a fresh seed per RESET.
 *
 *   Contract: window.scenes.scene11 = function(root){ return {...}; }
 *   onLeave pauses the driver; cold-entry safe; [data-run-primary] = DRIVE.
 */
(function () {
  window.scenes = window.scenes || {};

  const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
    ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];
  const NUM_STATES = (window.Van && window.Van.NUM_STATES) || 4;
  const GAMMA = (window.Van && window.Van.GAMMA != null) ? window.Van.GAMMA : 0.9;

  const RUN_SEED = 12345;    /* pinned &run seed; bands verified at RUN_WEEKS */
  const RUN_WEEKS = 4000;

  /* speed levels: tick delay, weeks folded per tick, what gets narrated */
  const SPEEDS = [
    { name: 'SLOW',  tick: 900, weeks: 1,  fx: true,  formula: true,  flash: true,  chartEvery: 1 },
    { name: 'BRISK', tick: 260, weeks: 1,  fx: false, formula: false, flash: false, chartEvery: 2 },
    { name: 'FAST',  tick: 110, weeks: 6,  fx: false, formula: false, flash: false, chartEvery: 3 },
    { name: 'TURBO', tick: 50,  weeks: 50, fx: false, formula: false, flash: false, chartEvery: 4 },
  ];

  window.scenes.scene11 = function (root) {
    root.classList.add('scene-pad', 'scene11-scene');
    root.innerHTML = '';

    const Van = window.Van;
    const SARSA = window.SARSA;
    const Actions = window.Actions;
    const A_IDS = Actions.MOVE_IDS;                       /* [run, service, replace] */
    const DATA = window.DATA || {};
    const TARGET = DATA.policy || ['run', 'service', 'replace', 'replace'];
    const Curve = window.LearningCurve || window.Chart;   /* js/chart.js export */

    const RUN = /[#&?]run\b/.test(window.location.hash || '');

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

    /* ---------------- DOM ---------------- */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = 'SARSA: LEARN FROM THE LOGBOOK';
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 's11-lede';
    lede.innerHTML =
      'No printed odds this time. Drive, one endless stream of weeks. ' +
      'After every week the logbook gains one line, and that line nudges <b>one cell</b>.';
    root.appendChild(lede);

    /* ---- main two-column row ---- */
    const main = document.createElement('div');
    main.className = 's11-row';
    root.appendChild(main);

    const left = document.createElement('div');
    left.className = 's11-left';
    main.appendChild(left);

    /* van panel */
    const vanPanel = document.createElement('div');
    vanPanel.className = 's11-van-panel';
    vanPanel.innerHTML =
      '<div class="s11-van-head"><span class="s11-cap">THE VAN, LIVE</span>' +
      '<span class="s11-week">WEEK <b id="s11-week">0</b></span></div>' +
      '<div class="s11-van-host" id="s11-van"></div>';
    left.appendChild(vanPanel);
    const van = window.VanCard.mount(vanPanel.querySelector('#s11-van'), { wear: 0, size: 'md' });
    const weekEl = vanPanel.querySelector('#s11-week');

    /* this-week logbook line */
    const strip = document.createElement('div');
    strip.className = 's11-strip';
    strip.innerHTML =
      '<div class="s11-cap">THIS WEEK IN THE LOGBOOK</div>' +
      '<div class="s11-tuple" id="s11-tuple"></div>';
    left.appendChild(strip);
    const tupleEl = strip.querySelector('#s11-tuple');

    /* the update rule */
    const updCard = document.createElement('div');
    updCard.className = 's11-upd-card';
    updCard.innerHTML =
      '<div class="s11-cap">THE ONE-CELL NUDGE</div>' +
      '<div class="s11-upd" id="s11-rule"></div>' +
      '<div class="s11-upd s11-upd-live" id="s11-live"></div>' +
      '<div class="s11-upd-chips">' +
        '<span class="s11-chip-td" id="s11-td">TD &mdash;</span>' +
        '<span class="s11-chip-q" id="s11-qmove">q[s,a] &mdash;</span>' +
      '</div>';
    left.appendChild(updCard);
    window.Katex.render(
      String.raw`q[s,a] \;\leftarrow\; q[s,a] + \alpha\,\bigl(\, r + 0.9\, q[s',a'] - q[s,a] \,\bigr)`,
      updCard.querySelector('#s11-rule'), true
    );
    const liveEl = updCard.querySelector('#s11-live');
    const tdEl = updCard.querySelector('#s11-td');
    const qmoveEl = updCard.querySelector('#s11-qmove');

    /* right column: QTable + bands */
    const right = document.createElement('div');
    right.className = 's11-right';
    main.appendChild(right);

    const rcap = document.createElement('div');
    rcap.className = 's11-cap';
    rcap.textContent = 'THE SCORECARD, FILLING ITSELF';
    right.appendChild(rcap);

    const qHost = document.createElement('div');
    qHost.className = 's11-qhost';
    right.appendChild(qHost);
    const qt = window.QTable.mount(qHost);

    const bandsWrap = document.createElement('div');
    bandsWrap.className = 's11-bands-wrap';
    bandsWrap.innerHTML = '<div class="s11-cap">BANDS VS THE DP ANSWER (SCENE 9)</div>' +
      '<div class="s11-bands" id="s11-bands"></div>';
    right.appendChild(bandsWrap);
    const bandsRow = bandsWrap.querySelector('#s11-bands');
    const bandEls = [];
    for (let s = 0; s < NUM_STATES; s++) {
      const b = document.createElement('span');
      b.className = 's11-band is-grey';
      b.innerHTML = '<span class="s11-band-state">' + STATE_DISPLAY[s] + '</span>' +
                    '<span class="s11-band-act">?</span>' +
                    '<span class="s11-band-status">UNSEEN</span>';
      bandsRow.appendChild(b);
      bandEls[s] = b;
    }

    const banner = document.createElement('div');
    banner.className = 's11-banner';
    banner.hidden = true;
    banner.textContent = 'THREE BANDS REDISCOVERED: NO ODDS WERE GIVEN.';
    right.appendChild(banner);

    /* the closing caption sits under the board, revealed with the bands */
    const closing = document.createElement('div');
    closing.className = 's11-closing';
    closing.hidden = true;
    closing.innerHTML =
      'DP needed the odds. SARSA needed the logbook. ' +
      '<b>Same twelve numbers, same three bands.</b>';
    right.appendChild(closing);

    /* ---- bottom: learning curve + controls ---- */
    const bottom = document.createElement('div');
    bottom.className = 's11-bottom';
    root.appendChild(bottom);

    const curveWrap = document.createElement('div');
    curveWrap.className = 's11-curve-wrap';
    curveWrap.innerHTML = '<div class="s11-cap">WEEKLY MONEY: RAW + 50-WEEK AVERAGE</div>' +
      '<div class="s11-curve-host" id="s11-curve"></div>' +
      '<div class="s11-curve-empty">the curve starts with the first week.</div>';
    bottom.appendChild(curveWrap);
    const curve = Curve.mount(curveWrap.querySelector('#s11-curve'), {
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
    panel.className = 's11-ctrl-panel';
    panel.innerHTML =
      '<div class="s11-btns">' +
        '<button class="poke-btn s11-primary" id="s11-drive" data-run-primary>&#9654; DRIVE</button>' +
        '<button class="poke-btn" id="s11-step">STEP</button>' +
        '<button class="poke-btn" id="s11-reset">RESET</button>' +
      '</div>' +
      '<div class="poke-menu-row s11-menurow">SPEED' +
        '<input type="range" id="s11-speed" min="0" max="3" step="1" value="0">' +
        '<span class="val" id="s11-speed-val">SLOW</span></div>' +
      '<div class="poke-menu-row s11-menurow">EPSILON' +
        '<input type="range" id="s11-eps" min="0" max="50" step="1" value="15">' +
        '<span class="val" id="s11-eps-val">0.15</span></div>' +
      '<div class="poke-menu-row s11-menurow">ALPHA' +
        '<input type="range" id="s11-alpha" min="1" max="50" step="1" value="15">' +
        '<span class="val" id="s11-alpha-val">0.15</span></div>';
    bottom.appendChild(panel);

    /* ---------------- training state ---------------- */
    let Q, rng, baseSeed, week, sCur, aCur, aCurExp, lastObs, rewards;
    let eps = 0.15, alpha = 0.15, speed = 0;
    let playing = false, timer = null, tickCount = 0;
    let bandsFlashShown = false, everMatched = false;

    function freshSeed() {
      return RUN ? RUN_SEED : (((Date.now() ^ (Math.random() * 1e9)) >>> 0) || 1);
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
    }

    /* ---- one SARSA week (the continuing task: always bootstraps) ---- */
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

    /* ---------------- rendering ---------------- */
    const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
    const fmtSigned = (v) => (v >= 0 ? '+' : '') + v;

    function wearChip(w) {
      return '<span class="s11-wear w' + w + '">' + STATE_DISPLAY[w] + '</span>';
    }
    function leverChip(id) {
      return '<span class="s11-lever ' + Actions.toneClass(id) + '">' +
             Actions.shortLabel(id) + '</span>';
    }
    function pickTag(explored) {
      return '<span class="s11-pick ' + (explored ? 'explore' : 'greedy') + '">' +
             (explored ? 'EXPLORE' : 'GREEDY') + '</span>';
    }

    function renderWeek() {
      weekEl.textContent = week.toLocaleString('en-US');
    }

    function renderTuple(obs) {
      if (!obs) {
        tupleEl.innerHTML =
          '<div class="s11-trow"><span class="s11-tlab">s</span><span class="s11-tval">' +
            wearChip(sCur.wear) + '</span></div>' +
          '<div class="s11-trow muted"><span class="s11-tlab">a</span><span class="s11-tval">? press DRIVE or STEP</span></div>' +
          '<div class="s11-trow muted"><span class="s11-tlab">r</span><span class="s11-tval">?</span></div>' +
          '<div class="s11-trow muted"><span class="s11-tlab">s&prime;</span><span class="s11-tval">?</span></div>' +
          '<div class="s11-trow muted"><span class="s11-tlab">a&prime;</span><span class="s11-tval">?</span></div>';
        return;
      }
      const bd = obs.log && obs.log.breakdown
        ? ' <span class="s11-bd">BREAKDOWN</span>' : '';
      tupleEl.innerHTML =
        '<div class="s11-trow"><span class="s11-tlab">s</span><span class="s11-tval">' +
          wearChip(obs.sFrom) + '</span></div>' +
        '<div class="s11-trow"><span class="s11-tlab">a</span><span class="s11-tval">' +
          leverChip(obs.a) + ' ' + pickTag(obs.aExp) + '</span></div>' +
        '<div class="s11-trow"><span class="s11-tlab">r</span><span class="s11-tval s11-r ' +
          (obs.r >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(obs.r) + bd + '</span></div>' +
        '<div class="s11-trow"><span class="s11-tlab">s&prime;</span><span class="s11-tval">' +
          wearChip(obs.sTo) + '</span></div>' +
        '<div class="s11-trow"><span class="s11-tlab">a&prime;</span><span class="s11-tval">' +
          leverChip(obs.aNext) + ' ' + pickTag(obs.aNextExp) + '</span></div>';
    }

    /* live numbers in the rule; negatives get parentheses */
    function texNum(v, dp) {
      const s = dp ? fmt1(v) : String(v);
      return v < 0 ? '(' + s + ')' : s;
    }
    function renderFormula(obs) {
      if (!obs) {
        liveEl.innerHTML = '<span class="s11-upd-wait">numbers appear as the weeks roll&hellip;</span>';
        tdEl.innerHTML = 'TD &mdash;';
        tdEl.className = 's11-chip-td';
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
      tdEl.className = 's11-chip-td ' + (obs.td >= 0 ? 'pos' : 'neg');
      qmoveEl.innerHTML = 'q[s,a] ' + fmt1(obs.qBefore) + ' -&gt; ' + fmt1(obs.qAfter);
    }

    function renderBands(allowFx) {
      const pol = SARSA.argmaxPolicy(Q);
      let all = true;
      for (let s = 0; s < NUM_STATES; s++) {
        const got = pol[s];
        const el = bandEls[s];
        const act = el.querySelector('.s11-band-act');
        const status = el.querySelector('.s11-band-status');
        if (!got) {                       /* row never visited yet */
          el.className = 's11-band is-grey';
          act.textContent = '?';
          status.textContent = 'UNSEEN';
          all = false;
        } else if (got === TARGET[s]) {
          el.className = 's11-band is-good';
          act.textContent = Actions.shortLabel(got);
          status.textContent = 'MATCH';
        } else {
          el.className = 's11-band is-bad';
          act.textContent = Actions.shortLabel(got);
          status.textContent = 'WRONG';
          all = false;
        }
      }
      if (all) {
        everMatched = true;
        closing.hidden = false;
        if (!bandsFlashShown) {
          bandsFlashShown = true;        /* once per run */
          banner.hidden = false;
          if (allowFx) {
            banner.classList.remove('s11-banner-flash');
            void banner.offsetWidth;
            banner.classList.add('s11-banner-flash');
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
      curveWrap.classList.toggle('s11-curve-blank', !rewards.length);
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
      qt.update(Q, { suppressFlash: !cfg.flash });
      renderWeek();
      renderBands(true);
      renderTuple(lastObs);
      mirrorVan(lastObs, narrated && cfg.fx);
      if (narrated && cfg.formula) renderFormula(lastObs);
      if (chartDue(cfg) || narrated) refreshCurve();
    }

    /* ---------------- the driver ---------------- */
    function driveBtn() { return document.getElementById('s11-drive'); }
    function setDriveLabel() {
      driveBtn().innerHTML = playing ? '&#9632; PAUSE' : '&#9654; DRIVE';
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
      if (RUN && week === 0) { fastForward(); return; }
      playing = true;
      setDriveLabel();
      tick();
    }
    function togglePlay() { if (playing) pausePlay(); else startPlay(); }

    /* &run: deterministic synchronous fast-forward on the pinned seed */
    function fastForward() {
      for (let i = 0; i < RUN_WEEKS; i++) stepWeek();
      qt.update(Q, { suppressFlash: true });
      renderWeek();
      renderBands(false);
      renderTuple(lastObs);
      van.set(sCur.wear);
      renderFormula(lastObs);
      refreshCurve();
    }

    function stepOnce() {
      pausePlay();
      stepWeek();
      tickCount++;
      renderBatch({ fx: true, formula: true, flash: true, chartEvery: 1 }, true);
      refreshCurve();
    }

    /* ---------------- wiring ---------------- */
    document.getElementById('s11-step').addEventListener('click', stepOnce);
    document.getElementById('s11-reset').addEventListener('click', hardReset);
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
    wireSlider('s11-speed', 's11-speed-val', (v, val) => {
      speed = Math.max(0, Math.min(3, v));
      val.textContent = SPEEDS[speed].name;
    });
    wireSlider('s11-eps', 's11-eps-val', (v, val) => {
      eps = v / 100;
      val.textContent = eps.toFixed(2);
    });
    wireSlider('s11-alpha', 's11-alpha-val', (v, val) => {
      alpha = v / 100;
      val.textContent = alpha.toFixed(2);
    });

    hardReset();

    return {
      onEnter() {
        /* re-entry: repaint the cached board without touching the run */
        qt.update(Q, { suppressFlash: true });
        renderWeek();
        renderBands(false);
        renderTuple(lastObs);
        mirrorVan(lastObs, false);
        setDriveLabel();
      },
      onLeave() { pausePlay(); },
      onNextKey() { return false; },   /* free-running scene: keys page on */
      onPrevKey() { return false; },
    };
  };
})();

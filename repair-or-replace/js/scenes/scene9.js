/* Scene 9, "Filling Q* with DP": a live value-iteration stepper.
 *
 *   The premise: the fleet sheet PRINTS the odds (wear, breakdown, repair),
 *   so Q* can be computed without driving a single week. Each press of
 *   1 SWEEP runs one synchronous Bellman backup over all 4 wear states:
 *       V <- bellmanSweep(V, 0.9).Vnew
 *   and repaints the 4x3 QTable from qFromV(Vb, 0.9) where Vb is the V
 *   BEFORE that sweep: after k sweeps the board shows Q after exactly k
 *   backups (qFromV of the current V would silently show k+1 reward
 *   layers, and the chips would stop matching the starred cells). The
 *   V-chip row under the board therefore EQUALS the per-row maximum, the
 *   HUD tracks the sweep count and max |dV|, and a banner narrates:
 *
 *     sweep 0   every cell starts ignorant: zero (board blank via reset()).
 *     spotlight (NEXT-key beat between sweeps 0 and 1) ONE cell, SVC at
 *               WORN, recomputes alone: the cell flashes and a tiny bubble
 *               shows "this week + 0.9 x next-week zeros". The next NEXT
 *               runs the full sweep ("the other 11 do the same, at once"),
 *               and the spotlit cell keeps the value the bubble computed.
 *     sweep 1   one backup: this week's money plus 0.9 x next week's zeros.
 *     LOCK_SHOW the BANDS are final. Derived live at build: the first sweep
 *               whose displayed board (QTable.policyFromQ) equals
 *               DATA.policy (policyStableAt + 1 on this data, because the
 *               board lags V by one backup); a POLICY LOCKED chip flashes.
 *     large k   decimals keep polishing to sweep 228 (tol 1e-9,
 *               DATA.convergence.itersTo1e9); decisions stopped long ago.
 *
 *   TO THE FIXED POINT (and any stepping that crosses tol 1e-9) snaps the
 *   board to the authoritative DATA.Qstar / DATA.V and the counter to
 *   DATA.convergence.itersFixedPoint, with the closing caption: every
 *   backup used the PRINTED odds. Scene 10 takes them away.
 *
 *   In-code honesty: the live fixed point, rounded to the 1dp the board
 *   shows, is compared against DATA.Qstar at build (console.warn on drift).
 *
 *   Contract: window.scenes.scene9 = function(root){ return {...}; }
 *   NEXT/PREV keys step the beats (0 -> spotlight -> 1 -> 2 -> fixed point)
 *   before the pager moves on; PREV undoes one control action. Cold-entry
 *   safe (&autostep=K reaches every beat headlessly); no
 *   timers beyond a tracked one-shot chip flash. [data-run-primary] is the
 *   1 SWEEP button, so &run captures a live mid-computation board.
 */
(function () {
  window.scenes = window.scenes || {};

  const NUM_STATES = (window.Van && window.Van.NUM_STATES) || 4;
  const STATE_DISPLAY = (window.Van && window.Van.STATE_DISPLAY) ||
    ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];
  const GAMMA = (window.Van && window.Van.GAMMA != null) ? window.Van.GAMMA : 0.9;

  window.scenes.scene9 = function (root) {
    root.classList.add('scene-pad', 'scene9-scene');
    root.innerHTML = '';

    const B = window.Bellman;
    const DATA = window.DATA || {};
    const CONV = DATA.convergence || {};
    const LOCK_AT = (CONV.policyStableAt != null) ? CONV.policyStableAt : 2;
    const TOL_AT  = (CONV.itersTo1e9 != null) ? CONV.itersTo1e9 : 228;
    const FP_AT   = (CONV.itersFixedPoint != null) ? CONV.itersFixedPoint : 294;
    const OPT     = DATA.policy || ['run', 'service', 'replace', 'replace'];
    const QSTAR   = Float64Array.from(DATA.Qstar || new Array(NUM_STATES * 3).fill(0));
    const VSTAR   = (DATA.V || [0, 0, 0, 0]).slice();

    /* The true double-precision fixed point, computed live once. Used so a
       jump (or stepping past tol 1e-9) leaves V on the genuine fixed point,
       and for the in-code honesty check against DATA.Qstar. */
    const VFP = B.valueIteration(GAMMA, { tol: 1e-15, maxIters: 500, recordHistory: false }).V;
    (function honesty() {
      const Qfp = B.qFromV(VFP, GAMMA);
      let drift = 0;
      for (let i = 0; i < Qfp.length; i++) {
        drift = Math.max(drift, Math.abs(Math.round(Qfp[i] * 10) / 10 - QSTAR[i]));
      }
      if (drift > 1e-9) console.warn('scene9: live fixed point (1dp) drifts from DATA.Qstar by', drift);
    })();

    /* The spotlight cell for the first beat: SVC at WORN, backed up alone
       from the all-zero table. Value computed live, never typed. */
    const MOVE_IDS = (window.Actions && window.Actions.MOVE_IDS) || ['run', 'service', 'replace'];
    const SPOT_S = 1; /* WORN */
    const SPOT_A = Math.max(0, MOVE_IDS.indexOf('service'));
    const SPOT_CELL = SPOT_S * MOVE_IDS.length + SPOT_A;
    const spotVal = B.qFromV(new Float64Array(NUM_STATES), GAMMA)[SPOT_CELL];

    /* The sweep at which the DISPLAYED board (Q after k backups) first
       goes greedy-equal to DATA.policy. Derived live, never assumed. */
    const LOCK_SHOW = (function () {
      let Vp = new Float64Array(NUM_STATES);
      for (let k = 1; k <= 24; k++) {
        const pol = window.QTable.policyFromQ(B.qFromV(Vp, GAMMA));
        if (pol.length === OPT.length && pol.every((p, i) => p === OPT[i])) return k;
        Vp = B.bellmanSweep(Vp, GAMMA).Vnew;
      }
      return LOCK_AT + 1;
    })();

    /*, DOM, */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = 'FILLING Q* WITH DP';
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 's9-lede';
    lede.innerHTML =
      'The odds are <b>printed on the fleet sheet</b>. So nobody drives: ' +
      'back the whole table up, again and again, until nothing moves. ' +
      'That is value iteration, and it is all the DP this problem needs.';
    root.appendChild(lede);

    /* controls + HUD */
    const ctrl = document.createElement('div');
    ctrl.className = 's9-ctrl-row';
    ctrl.innerHTML =
      '<button class="poke-btn" id="s9-step" data-run-primary>1 SWEEP</button>' +
      '<button class="poke-btn" id="s9-x10">&times;10 SWEEPS</button>' +
      '<button class="poke-btn" id="s9-fp">TO THE FIXED POINT</button>' +
      '<button class="poke-btn" id="s9-reset">RESET</button>' +
      '<span class="s9-hud">SWEEP <b id="s9-sweep">0</b>' +
        ' &middot; MAX |dV| <b id="s9-delta">&mdash;</b></span>' +
      '<span class="s9-lock" id="s9-lock" hidden>&#9733; POLICY LOCKED</span>';
    root.appendChild(ctrl);

    /* board (left) + formula / banner (right) */
    const main = document.createElement('div');
    main.className = 's9-main';
    root.appendChild(main);

    const boardCol = document.createElement('div');
    boardCol.className = 's9-board';
    main.appendChild(boardCol);

    const qHost = document.createElement('div');
    qHost.className = 's9-qhost';
    boardCol.appendChild(qHost);
    const qt = window.QTable.mount(qHost);

    /* the spotlight bubble, parked inside the (positioned) table host so it
       can anchor under the SVC-at-WORN cell during the one-cell beat */
    const bubble = document.createElement('div');
    bubble.className = 's9-spot-bubble';
    bubble.hidden = true;
    bubble.innerHTML =
      '<span class="s9-spot-lab">THIS WEEK + ' + GAMMA + ' &times; NEXT-WEEK ZEROS</span>' +
      '<b>' + Math.round(spotVal) + ' + ' + GAMMA + ' &times; 0 = ' + spotVal.toFixed(1) + '</b>';
    qHost.appendChild(bubble);

    function paintSpot(suppress) {
      const cell = qt.cells[SPOT_CELL];
      if (!cell) return;
      cell.classList.add('s9-spot-cell');
      cell.querySelector('.q-val').textContent =
        (spotVal >= 0 ? '+' : '') + spotVal.toFixed(1);
      bubble.hidden = false;
      bubble.style.left = (cell.offsetLeft + cell.offsetWidth / 2) + 'px';
      bubble.style.top = (cell.offsetTop + cell.offsetHeight + 9) + 'px';
      if (suppress) {
        cell.classList.remove('s9-spot-flash');
        bubble.classList.remove('s9-spot-pop');
      } else {
        cell.classList.remove('s9-spot-flash');
        void cell.offsetWidth;
        cell.classList.add('s9-spot-flash');
        bubble.classList.remove('s9-spot-pop');
        void bubble.offsetWidth;
        bubble.classList.add('s9-spot-pop');
      }
    }
    function clearSpot() {
      const cell = qt.cells[SPOT_CELL];
      if (cell) cell.classList.remove('s9-spot-cell', 's9-spot-flash');
      bubble.hidden = true;
    }

    const chipsCap = document.createElement('div');
    chipsCap.className = 's9-vchips-cap';
    chipsCap.textContent = 'V(s) = THE STARRED CELL OF EACH ROW';
    boardCol.appendChild(chipsCap);

    const chipsRow = document.createElement('div');
    chipsRow.className = 's9-vchips';
    const chipVals = [];
    for (let s = 0; s < NUM_STATES; s++) {
      const c = document.createElement('span');
      c.className = 's9-vchip s9-w' + s;
      c.innerHTML = '<span class="s9-vchip-name">' + STATE_DISPLAY[s] + '</span><b>0.0</b>';
      chipsRow.appendChild(c);
      chipVals[s] = c.querySelector('b');
    }
    boardCol.appendChild(chipsRow);

    const side = document.createElement('div');
    side.className = 's9-side';
    main.appendChild(side);

    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card s9-formula';
    fcard.innerHTML = '<div class="concept-formula-label">ONE BACKUP, RUN FOR EVERY CELL AT ONCE</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q(s,a) \;\leftarrow\; \sum_{s'} p(s' \mid s,a)\,[\, r \;+\; 0.9\,\max_{a'} Q(s',a') \,]`,
      fhost, true
    );
    side.appendChild(fcard);

    const banner = document.createElement('div');
    banner.className = 'poke-box tight s9-banner';
    banner.innerHTML = '<div class="s9-banner-title" id="s9-bt"></div><div class="s9-banner-body" id="s9-bb"></div>';
    side.appendChild(banner);
    const bTitle = banner.querySelector('#s9-bt');
    const bBody  = banner.querySelector('#s9-bb');

    const closing = document.createElement('div');
    closing.className = 's9-closing';
    closing.hidden = true;
    closing.innerHTML =
      'THE PRICE OF ADMISSION: every backup used the <b>PRINTED odds</b>. ' +
      'Next: when you do not have them.';
    side.appendChild(closing);

    /*, state, */
    let V = new Float64Array(NUM_STATES);
    let Vb = new Float64Array(NUM_STATES);  /* V one sweep behind: board = qFromV(Vb) */
    let sweep = 0;
    let delta = null;            /* max |dV| of the last sweep; null at sweep 0 */
    let converged = false;
    let spot = false;            /* the one-cell spotlight beat is showing */
    let spotSeen = false;        /* the beat was shown this run (sweep-1 wording) */
    let wasLocked = false;       /* greedy policy == DATA.policy on last render */
    let lockFlashed = false;     /* the chip flashes once per run */
    const history = [];          /* one snapshot per control action, for PREV */
    let flashTimer = null;

    function snap() {
      history.push({ V: Float64Array.from(V), Vb: Float64Array.from(Vb),
                     sweep, delta, converged, spot, spotSeen });
    }

    function settle() {
      /* Past tol 1e-9 the 1dp board is final: snap to the authoritative
         DATA values and the documented fixed-point sweep count. */
      converged = true;
      sweep = FP_AT;
      delta = 0;
      V = Float64Array.from(VFP);
      Vb = Float64Array.from(VFP);
    }

    function fmtDelta() {
      if (converged) return '0 (FROZEN)';
      if (delta == null) return '&mdash;';
      if (delta >= 1) return delta.toFixed(1);
      if (delta >= 0.001) return delta.toFixed(3);
      return delta.toExponential(1);
    }

    function beat() {
      if (converged) return {
        t: 'SWEEP ' + FP_AT + ': THE FIXED POINT.',
        b: 'nothing moves: the board <b>is Q*</b>. the printed decimals froze at sweep ' +
           TOL_AT + ' (tol 1e-9); the doubles stop entirely at sweep ' + FP_AT +
           '. the decisions locked at sweep ' + LOCK_SHOW + '.',
      };
      if (sweep === 0 && spot) return {
        t: 'ONE CELL FIRST.',
        b: 'one backup lands on <b>one cell</b>: SVC at WORN. the bubble is the whole sum.',
      };
      if (sweep === 0) return {
        t: 'SWEEP 0: A BLANK SHEET.',
        b: 'every cell starts ignorant: zero. press <b>1 SWEEP</b> to back the whole table up once.',
      };
      if (sweep === 1 && spotSeen) return {
        t: 'SWEEP 1: THE FULL SWEEP.',
        b: 'and the other 11 cells do the same, <b>all at once</b>.',
      };
      if (sweep === 1) return {
        t: 'SWEEP 1: ONE BACKUP.',
        b: "one backup: this week's money plus 0.9 times next week's zeros. " +
           'the stars only rank immediate money so far.',
      };
      if (sweep === LOCK_SHOW) return {
        t: 'SWEEP ' + LOCK_SHOW + ': THE BANDS LOCK.',
        b: 'look at the stars: the <b>BANDS are already final</b> (policy locks at sweep ' +
           LOCK_SHOW + '). every later sweep only polishes decimals.',
      };
      if (sweep < LOCK_SHOW) return {
        t: 'SWEEP ' + sweep + ': AGAIN.',
        b: 'each backup folds in one more week. watch the <b>stars</b>: still shuffling.',
      };
      return {
        t: 'SWEEP ' + sweep + ': POLISHING.',
        b: 'decimals keep polishing to sweep ' + TOL_AT + ' (tol 1e-9); ' +
           'the decisions stopped changing long ago.',
      };
    }

    function render(opts) {
      const o = opts || {};

      /* board */
      let Q;
      if (converged) {
        Q = QSTAR;
        clearSpot();
        qt.update(Q, { suppressFlash: !!o.suppress });
      } else if (sweep === 0) {
        Q = null;
        qt.reset();
        if (spot) paintSpot(!o.allowFx);
        else clearSpot();
      } else {
        Q = B.qFromV(Vb, GAMMA);
        clearSpot();
        qt.update(Q, { suppressFlash: !!o.suppress });
      }

      /* V chips */
      const vShow = converged ? VSTAR : V;
      for (let s = 0; s < NUM_STATES; s++) chipVals[s].textContent = Number(vShow[s]).toFixed(1);

      /* HUD */
      document.getElementById('s9-sweep').textContent = String(sweep);
      document.getElementById('s9-delta').innerHTML = fmtDelta();

      /* policy lock, verified live against DATA.policy */
      let locked = false;
      if (Q) {
        const pol = window.QTable.policyFromQ(Q);
        locked = pol.length === OPT.length && pol.every((p, i) => p === OPT[i]);
      }
      const lockEl = document.getElementById('s9-lock');
      lockEl.hidden = !locked;
      if (locked && !wasLocked && !lockFlashed && o.allowFx) {
        lockFlashed = true;
        lockEl.classList.remove('s9-lock-flash');
        void lockEl.offsetWidth;
        lockEl.classList.add('s9-lock-flash');
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(() => { flashTimer = null; lockEl.classList.remove('s9-lock-flash'); }, 1300);
        if (window.SFX) window.SFX.play('hit');
      }
      wasLocked = locked;

      /* banner + closing + buttons */
      const bt = beat();
      bTitle.textContent = bt.t;
      bBody.innerHTML = bt.b;
      closing.hidden = !converged;
      document.getElementById('s9-step').disabled = converged;
      document.getElementById('s9-x10').disabled = converged;
      document.getElementById('s9-fp').disabled = converged;
    }

    /*, actions, */
    function showSpot() {
      if (converged || sweep !== 0 || spot) return;
      snap();
      spot = true;
      spotSeen = true;
      render({ allowFx: true });
      if (window.SFX) window.SFX.play('tick');
    }

    function doSweeps(n) {
      if (converged) return;
      snap();
      spot = false;
      for (let i = 0; i < n; i++) {
        Vb = V;
        const r = B.bellmanSweep(V, GAMMA);
        V = r.Vnew;
        sweep++;
        delta = r.maxDelta;
        if (r.maxDelta < 1e-9) { settle(); break; }
      }
      render({ allowFx: true });
      if (window.SFX) window.SFX.play(converged ? 'hit' : 'tick');
    }

    function jumpFP() {
      if (converged) return;
      snap();
      spot = false;
      settle();
      render({ allowFx: true });
      if (window.SFX) window.SFX.play('hit');
    }

    function reset() {
      snapClear();
      V = new Float64Array(NUM_STATES);
      Vb = new Float64Array(NUM_STATES);
      sweep = 0;
      delta = null;
      converged = false;
      spot = false;
      spotSeen = false;
      wasLocked = false;
      lockFlashed = false;
      render({ suppress: true });
    }
    function snapClear() { history.length = 0; }

    function stepBack() {
      const prev = history.pop();
      if (!prev) return false;
      V = prev.V;
      Vb = prev.Vb;
      sweep = prev.sweep;
      delta = prev.delta;
      converged = prev.converged;
      spot = prev.spot;
      spotSeen = prev.spotSeen;
      render({ suppress: true });
      return true;
    }

    document.getElementById('s9-step').addEventListener('click', () => doSweeps(1));
    document.getElementById('s9-x10').addEventListener('click', () => doSweeps(10));
    document.getElementById('s9-fp').addEventListener('click', jumpFP);
    document.getElementById('s9-reset').addEventListener('click', reset);

    render({ suppress: true });

    /* &s9fp: deep link / headless capture of the converged board. */
    if (/[#&?]s9fp\b/.test(window.location.hash || '')) jumpFP();

    return {
      onEnter() { render({ suppress: true }); },
      onLeave() {
        if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
      },
      onNextKey() {
        if (converged) return false;
        if (sweep === 0 && !spot) showSpot();
        else if (sweep < LOCK_SHOW) doSweeps(1);
        else jumpFP();
        return true;
      },
      onPrevKey() {
        if (stepBack()) {
          if (window.SFX) window.SFX.play('cursor');
          return true;
        }
        return false;
      },
    };
  };
})();

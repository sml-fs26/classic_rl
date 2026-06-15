/* Scene 5, THE TRAJECTORY: the canonical six-week tape, week by week.
 *
 *   One run of the fleet, written down: window.DATA.demoTrajectory, six weeks
 *   of OLD BESSIE. NEXT (or the STEP button) reveals one week at a time:
 *
 *     - a md VanCard board on the left FOLLOWS the tape (miles + wear on run
 *       weeks, the wrench fx on the service week, the new-van fx on the
 *       replace week);
 *     - a horizontal tape grows one week card per step, each card spelling
 *       the loop SEE the state / PICK the action / get PAID / LAND somewhere
 *       with wear-tinted state chips and lever-tinted action chips;
 *     - under the tape the formal notation builds in parallel via KaTeX:
 *       s_1 = HEALTHY, a_1 = RUN, r_1 = +95, s_2 = WORN, ... one triple
 *       highlighted per step;
 *     - a RAW SUM readout ticks to +177 by the end.
 *
 *   Step 6 (the REPLACE week) lands the caption beat: -130 now buys better
 *   weeks later. A final internal step closes the column (+177) and points at
 *   discounting. PREV rewinds via reset + replay with animations suppressed.
 *
 *   Cold-entry safe (deep link #scene=5 renders step 0). PLAY ALL is the
 *   [data-run-primary] control: under &run one auto-click rolls the whole
 *   tape with collapsed delays, so the headless capture shows the full
 *   six-week tape, the complete notation, and the closing line.
 *
 * Registers window.scenes.scene5 per the course-viz scene contract.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene5 = function (root) {
    const V = window.Van;
    const ACT = window.Actions;
    const TRAJ = (window.DATA && window.DATA.demoTrajectory) ||
                 { start: 0, steps: [], totalReturn: 0 };
    const STEPS = TRAJ.steps;          // the 6 locked weeks
    const LAST = STEPS.length;         // 6
    const CLOSE = LAST + 1;            // 7: the closing beat

    root.classList.add('scene-pad', 'scene5-scene');
    root.innerHTML = '';

    const RUN = /[#&?]run\b/.test(window.location.hash || '');
    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    /* Collapse delays under &run / reduced motion. */
    function A(ms) { return (RUN || reduceMotion) ? Math.min(ms, 50) : ms; }

    function signed(n) { return (n > 0 ? '+' : '') + String(n); }
    function signedTex(n) { return n >= 0 ? ('{+}' + n) : ('{-}' + Math.abs(n)); }

    /* Cosmetic odometer miles for the run weeks (service / replace add none;
       the replace week resets the clock via the VanCard itself). */
    const MILES = { 1: 346, 3: 358, 4: 339, 5: 312 };

    /*, Header + lede, */
    const header = document.createElement('h2');
    header.className = 'poke-section-title s5-section-title';
    header.textContent = 'ONE RUN, WRITTEN DOWN';
    root.appendChild(header);

    const lede = document.createElement('div');
    lede.className = 'poke-caption s5-lede';
    lede.textContent =
      'Six weeks of OLD BESSIE, exactly as they happened. A written-down run ' +
      'like this is called a TRAJECTORY: the raw material every learner reads.';
    root.appendChild(lede);

    /*, Main row: van board | tape, */
    const rowEl = document.createElement('div');
    rowEl.className = 's5-row';
    root.appendChild(rowEl);

    const boardEl = document.createElement('div');
    boardEl.className = 's5-board';
    boardEl.innerHTML = '<div class="s5-board-label">THE VAN, LIVE</div>';
    const vanHost = document.createElement('div');
    vanHost.className = 's5-van';
    boardEl.appendChild(vanHost);
    const boardWeek = document.createElement('div');
    boardWeek.className = 's5-board-week';
    boardEl.appendChild(boardWeek);
    rowEl.appendChild(boardEl);

    const flowEl = document.createElement('div');
    flowEl.className = 's5-flow';
    rowEl.appendChild(flowEl);

    /* Legend (the trajectory vocabulary) + the raw-sum readout. */
    const legendRow = document.createElement('div');
    legendRow.className = 's5-legend-row';
    legendRow.innerHTML =
      '<div class="s5-legend">EVERY WEEK, THE SAME LOOP: SEE THE STATE ' +
        '<span class="s5-arrow">&gt;</span> PICK THE ACTION ' +
        '<span class="s5-arrow">&gt;</span> GET PAID ' +
        '<span class="s5-arrow">&gt;</span> LAND SOMEWHERE.</div>' +
      '<div class="s5-sum"><span class="s5-sum-label">RAW SUM</span>' +
        '<span class="s5-sum-num">0</span></div>';
    flowEl.appendChild(legendRow);
    const sumBox = legendRow.querySelector('.s5-sum');
    const sumNum = legendRow.querySelector('.s5-sum-num');

    const tape = document.createElement('div');
    tape.className = 's5-tape';
    flowEl.appendChild(tape);

    /*, The notation, building in parallel, */
    const notation = document.createElement('div');
    notation.className = 's5-notation';
    notation.innerHTML = '<div class="s5-notation-label">THE SAME SIX WEEKS, IN SYMBOLS</div>';
    const chunks = document.createElement('div');
    chunks.className = 's5-chunks';
    notation.appendChild(chunks);
    root.appendChild(notation);

    /*, Caption beats, */
    const beat = document.createElement('div');
    beat.className = 's5-beat';
    beat.textContent =
      'Week ' + LAST + ' pays ' + signed(STEPS.length ? STEPS[LAST - 1].reward : 0) +
      ' now to buy better weeks later. Hold that thought.';
    beat.hidden = true;
    root.appendChild(beat);

    const closing = document.createElement('div');
    closing.className = 's5-close';
    closing.textContent =
      'Add the column: ' + signed(TRAJ.totalReturn) + ' over six weeks. ' +
      'Next: why the far weeks should count a little less.';
    closing.hidden = true;
    root.appendChild(closing);

    /*, Controls, */
    const ctrls = document.createElement('div');
    ctrls.className = 's5-controls';
    const stepBtn = document.createElement('button');
    stepBtn.type = 'button';
    stepBtn.className = 'poke-btn';
    stepBtn.textContent = 'STEP';
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'poke-btn';
    playBtn.textContent = 'PLAY ALL';
    playBtn.setAttribute('data-run-primary', '');
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'poke-btn';
    resetBtn.textContent = 'RESET';
    const status = document.createElement('div');
    status.className = 's5-status';
    status.textContent = 'STEP (or the right arrow) plays a week. The left arrow rewinds.';
    ctrls.appendChild(stepBtn);
    ctrls.appendChild(playBtn);
    ctrls.appendChild(resetBtn);
    ctrls.appendChild(status);
    root.appendChild(ctrls);

    /*, State, */
    let step = 0;          /* 0 = before week 1; 1..6 = weeks; 7 = closing */
    let epoch = 0;         /* bumped on every rebuild; stale callbacks bail */
    let playing = false;
    let card = null;

    let timers = [];
    function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { for (const id of timers) clearTimeout(id); timers = []; }

    /* The van's true paper state after k completed weeks. */
    function cardStateAt(k) {
      const done = Math.min(k, LAST);
      const wear = done === 0 ? TRAJ.start : STEPS[done - 1].toWear;
      let miles = 0;
      if (done < LAST) {     /* the replace in week 6 zeroes the clock */
        for (let w = 1; w <= done; w++) {
          if (STEPS[w - 1].action === 'run') miles += MILES[w] || 340;
        }
      }
      const name = done >= LAST ? 'BESSIE II' : 'OLD BESSIE';
      return { wear, miles, name };
    }

    function remountCard(k) {
      const cs = cardStateAt(k);
      vanHost.innerHTML = '';
      card = window.VanCard.mount(vanHost, {
        wear: cs.wear, size: 'md', miles: cs.miles, name: cs.name,
      });
    }

    function boardWeekText(k) {
      if (k === 0) return 'BEFORE WEEK 1';
      return 'AFTER WEEK ' + Math.min(k, LAST);
    }

    /*, Builders, */
    function stateChipHtml(wear) {
      return '<span class="s5-chip s5-chip-state vc-wear-' + wear + '">' +
             V.stateName(wear) + '</span>';
    }
    function actionChipHtml(id) {
      return '<span class="s5-chip s5-chip-action ' + ACT.toneClass(id) + '">' +
             ACT.leverIconSvg(id) +
             '<span>' + ACT.shortLabel(id) + '</span></span>';
    }

    function makeWeekCard(st, animate) {
      const cardEl = document.createElement('div');
      cardEl.className = 's5-week-card' + (animate ? ' s5-pop' : '');
      cardEl.innerHTML =
        '<div class="s5-card-week">WEEK ' + st.i + '</div>' +
        '<div class="s5-card-row"><span class="s5-row-label">SEE</span>' +
          stateChipHtml(st.fromWear) + '</div>' +
        '<div class="s5-card-row"><span class="s5-row-label">PICK</span>' +
          actionChipHtml(st.action) + '</div>' +
        '<div class="s5-card-row"><span class="s5-row-label">PAID</span>' +
          '<span class="s5-reward ' + (st.reward >= 0 ? 'is-pos' : 'is-neg') + '">' +
          signed(st.reward) + '</span></div>' +
        '<div class="s5-card-row"><span class="s5-row-label">LAND</span>' +
          stateChipHtml(st.toWear) + '</div>';
      return cardEl;
    }

    function makeChunk(i) {
      const el = document.createElement('span');
      el.className = 's5-chunk';
      const st = STEPS[i - 1];
      window.Katex.render(
        's_{' + i + '}{=}\\text{' + V.stateName(st.fromWear) + '},\\; ' +
        'a_{' + i + '}{=}\\text{' + ACT.shortLabel(st.action) + '},\\; ' +
        'r_{' + i + '}{=}' + signedTex(st.reward) + ',',
        el, false);
      return el;
    }
    function makeCloseChunk() {
      const el = document.createElement('span');
      el.className = 's5-chunk';
      window.Katex.render(
        's_{' + (LAST + 1) + '}{=}\\text{' + V.stateName(STEPS[LAST - 1].toWear) +
        '},\\; \\dots', el, false);
      return el;
    }
    function setCurrentChunk(el) {
      chunks.querySelectorAll('.s5-chunk.current')
            .forEach((c) => c.classList.remove('current'));
      if (el) el.classList.add('current');
    }

    function sumAt(k) {
      let s = 0;
      for (let w = 1; w <= Math.min(k, LAST); w++) s += STEPS[w - 1].reward;
      return s;
    }
    function renderSum(k, bump) {
      const s = sumAt(k);
      sumNum.textContent = k === 0 ? '0' : signed(s);
      sumBox.classList.remove('is-pos', 'is-neg');
      if (k > 0 && s >= 0) sumBox.classList.add('is-pos');
      else if (k > 0) sumBox.classList.add('is-neg');
      if (bump) {
        sumBox.classList.remove('s5-sum-bump');
        void sumBox.offsetWidth;
        sumBox.classList.add('s5-sum-bump');
      }
    }

    function syncButtons() {
      stepBtn.disabled = playing || step >= CLOSE;
      playBtn.disabled = playing || step >= CLOSE;
      resetBtn.disabled = playing || step === 0;
    }

    /*, Full rebuild at `step` (cold entry / rewind / reset), */
    function renderAll() {
      epoch += 1;
      clearTimers();
      playing = false;

      remountCard(step);
      boardWeek.textContent = boardWeekText(step);

      tape.innerHTML = '';
      const shown = Math.min(step, LAST);
      if (shown === 0) {
        tape.innerHTML = '<div class="s5-week-card s5-tape-ph">' +
          '<div class="s5-card-week">press STEP to roll week 1</div></div>';
      } else {
        for (let w = 1; w <= shown; w++) tape.appendChild(makeWeekCard(STEPS[w - 1], false));
        tape.scrollLeft = step >= CLOSE ? 0 : tape.scrollWidth;
      }

      chunks.innerHTML = '';
      if (shown === 0) {
        chunks.innerHTML = '<span class="s5-chunks-ph">the symbols build here, ' +
          'one week at a time.</span>';
      } else {
        let cur = null;
        for (let w = 1; w <= shown; w++) { cur = makeChunk(w); chunks.appendChild(cur); }
        if (step >= CLOSE) { cur = makeCloseChunk(); chunks.appendChild(cur); }
        setCurrentChunk(cur);
      }

      renderSum(step, false);
      beat.hidden = step < LAST;
      closing.hidden = step < CLOSE;
      syncButtons();
    }

    /*, One animated step forward, */
    function stepForward() {
      if (step >= CLOSE) return false;
      step += 1;
      const myEpoch = epoch;

      if (step <= LAST) {
        const st = STEPS[step - 1];
        const ph = tape.querySelector('.s5-tape-ph');
        if (ph) ph.remove();
        tape.appendChild(makeWeekCard(st, !(RUN || reduceMotion)));
        tape.scrollLeft = tape.scrollWidth;

        const phc = chunks.querySelector('.s5-chunks-ph');
        if (phc) phc.remove();
        const chunk = makeChunk(step);
        chunks.appendChild(chunk);
        setCurrentChunk(chunk);

        renderSum(step, true);
        if (window.SFX) window.SFX.play('cursor');

        /* The van follows the tape. Wear is always set absolutely, so a fast
           rewind mid-fx cannot leave the board stale. */
        if (st.action === 'run') {
          card.addMiles(MILES[step] || 340);
          card.set(st.toWear);
        } else if (st.action === 'service') {
          card.playService(() => {});
          later(() => { if (epoch === myEpoch) card.set(st.toWear); }, A(520));
        } else {
          /* playReplace resets wear + odometer and bumps the nameplate. */
          card.playReplace(() => {});
        }

        boardWeek.textContent = boardWeekText(step);
        if (step === LAST) beat.hidden = false;
      } else {
        /* The closing beat: the column total + where the story points next.
           Snap the tape back to week 1 so the whole run reads left to right. */
        const chunk = makeCloseChunk();
        chunks.appendChild(chunk);
        setCurrentChunk(chunk);
        tape.scrollLeft = 0;
        closing.hidden = false;
        if (window.SFX) window.SFX.play('win');
      }

      syncButtons();
      return true;
    }

    /*, Rewind: reset + replay, animations suppressed, */
    function stepBack() {
      if (step === 0) return false;
      step -= 1;
      renderAll();
      return true;
    }

    function playAll() {
      if (playing || step >= CLOSE) return;
      playing = true;
      syncButtons();
      const myEpoch = epoch;
      (function loop() {
        if (epoch !== myEpoch) return;
        playing = false;          /* let stepForward's button sync see truth */
        stepForward();
        if (step < CLOSE) {
          playing = true;
          syncButtons();
          later(loop, A(980));
        }
      })();
    }

    function reset() {
      step = 0;
      renderAll();
    }

    stepBtn.addEventListener('click', () => { if (!playing) stepForward(); });
    playBtn.addEventListener('click', playAll);
    resetBtn.addEventListener('click', () => { if (!playing) reset(); });

    renderAll();

    return {
      onEnter() {},
      onLeave() { clearTimers(); playing = false; syncButtons(); },
      /* Right arrow / NEXT steps the tape; falls through once closed. */
      onNextKey() {
        if (playing) return true;
        return stepForward();
      },
      /* Left arrow / PREV rewinds one step (instant replay), then falls
         through to the pager at step 0. */
      onPrevKey() {
        if (playing) return true;
        return stepBack();
      },
    };
  };
})();

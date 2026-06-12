/* Scene 4, "Policy: your maintenance playbook" (earns the POLICY badge).
 *
 * Decomposed into an 8-step engine (one idea per click), the playbook
 * card as the centerpiece. Steps:
 *
 *   0  empty 4-row card, call column blank.
 *   1  the HEALTHY row gets RUN (chip lands).
 *   2  the other three rows fill, staggered: Grandpa's Way. The card
 *      earns its nameplate: completeness makes it a policy.
 *   3  the Monday lookup, animated: gauge reads SHAKY, the SHAKY row
 *      lights up, the call pops out below.
 *   4  the formula pi : S -> A appears, only now; the lookup line gets
 *      its pi(SHAKY) = label.
 *   5  seed swap: the card flips to The Nervous Owner, row by row.
 *      The two seed tabs appear (NERVOUS OWNER is [data-run-primary]).
 *   6  count them: four slots x three candidate calls, counter ticks
 *      to 3^4 = 81.
 *   7  teaser: which of the 81 is best?
 *
 * Captions live in one dialog box, at most 2 short lines each; every
 * number is in the visual, not the prose. Click a call slot to cycle
 * RUN -> SVC -> NEW at any step (an empty slot starts at RUN); click
 * the Monday gauge to redo the lookup from another wear level.
 *
 * Rewind = reset + replay: state (the card's calls, the Monday wear)
 * is derived by replaying applyStep 0..k with animations off, so the
 * left arrow restores any step exactly. Cold-entry safe (deep link
 * #scene=4) with a `&step=K` hash flag for headless QA. window.DATA's
 * optimal policy is never shown: which of the 81 is best stays open.
 *
 * Contract: window.scenes.scene4 = function(root){ return {...}; };
 */
(function () {
  window.scenes = window.scenes || {};

  const N_STEPS = 8;

  function reduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') || reduced();
  }

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad', 'scene4-scene');
    root.innerHTML = '';

    const Van = window.Van;
    const Actions = window.Actions;
    const NS = Van.NUM_STATES;                        // 4
    const IDS = Actions.MOVE_IDS;                     // [run, service, replace]
    const N_PLAYBOOKS = Math.pow(IDS.length, NS);     // 3^4 = 81
    const SD = Van.STATE_DISPLAY;
    const ALL_TONES = IDS.map(Actions.toneClass);

    function actionName(id) {
      const a = Actions.MOVE_BY_ID[id];
      return a ? a.name : id;
    }

    /* ---- The two hand-written seeds (NOT the optimal map) ---- */
    const PRESETS = [
      { name: "GRANDPA'S WAY", sub: 'run till she dies',
        map: ['run', 'run', 'run', 'replace'] },
      { name: 'THE NERVOUS OWNER', sub: 'shop early, shop often',
        map: ['run', 'service', 'service', 'service'] },
    ];

    /* ---- One caption per step, max 2 short lines ---- */
    const CAPTIONS = [
      'One call per wear level, written down before the week starts.',
      'HEALTHY gets its call. Three rows still blank.',
      'A call on every row. That completeness is what makes it a policy.',
      'Monday is a lookup, not a debate.',
      'Hand it a wear level, it hands back the call.',
      'A different playbook, same shape.',
      String(N_PLAYBOOKS) + ' complete playbooks.',
      'That question has an exact answer. Next: a number for a whole playbook.',
    ];

    /* ---------- Replayable state ---------- */
    let cursor = 0;
    let policy = [null, null, null, null];   // action id per wear, or null
    let mondayWear = 2;                      // the lookup example: SHAKY

    function resetState() {
      policy = [null, null, null, null];
      mondayWear = 2;
    }
    /* Forward mutation for step k. Steps 0, 3, 4, 6, 7 add visuals only. */
    function applyStep(k) {
      if (k === 1) policy[0] = IDS[0];                    // HEALTHY: RUN
      else if (k === 2) policy = PRESETS[0].map.slice();  // Grandpa's Way
      else if (k === 5) policy = PRESETS[1].map.slice();  // Nervous Owner
    }
    function matchedPreset() {
      for (let i = 0; i < PRESETS.length; i++) {
        if (PRESETS[i].map.join() === policy.join()) return i;
      }
      return -1;
    }
    function complete() { return policy.every(Boolean); }

    /* ---------- Timers (cleared on every render and on leave) ---------- */
    const timers = [];
    let counterRaf = null;
    let cycleTimer = null;
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() {
      timers.forEach(clearTimeout);
      timers.length = 0;
      if (counterRaf) { cancelAnimationFrame(counterRaf); counterRaf = null; }
      if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
    }

    /* ---------- Head: one-line headline + step counter ---------- */
    const head = document.createElement('div');
    head.className = 's4-head';
    head.innerHTML =
      '<h2 class="poke-section-title s4-title">Policy: your maintenance playbook</h2>' +
      '<div class="s4-step-counter"></div>';
    root.appendChild(head);
    const stepCounter = head.querySelector('.s4-step-counter');

    /* ---------- Two-column body ---------- */
    const body = document.createElement('div');
    body.className = 's4-body';
    root.appendChild(body);

    /* ===== LEFT: the playbook card (centerpiece) ===== */
    const boardCol = document.createElement('div');
    boardCol.className = 's4-board-col';
    body.appendChild(boardCol);

    const boardBar = document.createElement('div');
    boardBar.className = 's4-board-bar';
    boardBar.innerHTML =
      '<span class="s4-board-title">THE PLAYBOOK CARD</span>' +
      '<span class="s4-card-name" hidden></span>';
    boardCol.appendChild(boardBar);
    const nameTag = boardBar.querySelector('.s4-card-name');

    const colHead = document.createElement('div');
    colHead.className = 's4-col-head';
    colHead.innerHTML = '<span>WEAR (STATE)</span><span>YOUR CALL</span>';
    boardCol.appendChild(colHead);

    const rowsBox = document.createElement('div');
    rowsBox.className = 's4-rows poke-box tight';
    boardCol.appendChild(rowsBox);

    const rows = [];   // per wear: { row, slot }
    for (let w = 0; w < NS; w++) {
      const row = document.createElement('div');
      row.className = 's4-row';

      const mark = document.createElement('span');
      mark.className = 's4-row-cursor';
      mark.innerHTML = '&#9654;';
      row.appendChild(mark);

      const state = document.createElement('div');
      state.className = 's4-state';
      const gaugeHost = document.createElement('span');
      gaugeHost.className = 's4-state-gauge';
      state.appendChild(gaugeHost);
      window.VanCard.mount(gaugeHost, { wear: w, compact: true });
      const sname = document.createElement('span');
      sname.className = 's4-state-name s4-w' + w;
      sname.textContent = SD[w];
      state.appendChild(sname);
      row.appendChild(state);

      const arrow = document.createElement('span');
      arrow.className = 's4-row-arrow';
      arrow.innerHTML = '&#8594;';
      row.appendChild(arrow);

      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 's4-slot';
      slot.addEventListener('click', function () { cycleRow(w); });
      row.appendChild(slot);

      rowsBox.appendChild(row);
      rows[w] = { row: row, slot: slot };
    }

    /* The Monday lookup, under the card (hidden until step 3). */
    const monday = document.createElement('div');
    monday.className = 's4-monday';
    monday.hidden = true;
    monday.innerHTML =
      '<div class="s4-monday-label">MONDAY MORNING</div>' +
      '<div class="s4-monday-line">' +
        '<button type="button" class="s4-monday-gauge" ' +
          'title="Another Monday, another reading">' +
          '<span class="s4-monday-gauge-chip"></span>' +
          '<span class="s4-monday-gauge-cycle">&#8635;</span>' +
        '</button>' +
        '<span class="s4-monday-state"></span>' +
        '<span class="s4-monday-arrow">&#9654;</span>' +
        '<span class="s4-monday-pi" hidden></span>' +
        '<span class="s4-monday-call"></span>' +
      '</div>';
    boardCol.appendChild(monday);
    const mondayGaugeBtn = monday.querySelector('.s4-monday-gauge');
    const mondayState = monday.querySelector('.s4-monday-state');
    const mondayPi = monday.querySelector('.s4-monday-pi');
    const mondayCall = monday.querySelector('.s4-monday-call');
    const mondayGauge = window.VanCard.mount(
      monday.querySelector('.s4-monday-gauge-chip'),
      { wear: mondayWear, compact: true });
    mondayGaugeBtn.addEventListener('click', function () {
      if (monday.hidden) return;
      mondayWear = (mondayWear + 1) % NS;
      fireLookup(!instantMode());
      if (window.SFX) { try { window.SFX.play('cursor'); } catch (_e) {} }
    });

    /* Seed tabs (hidden until step 5). NERVOUS OWNER keeps the
       [data-run-primary] role from the old scene; the attribute is only
       attached while the tabs are visible so &run cannot corrupt the
       empty-card steps. */
    const seedWrap = document.createElement('div');
    seedWrap.className = 's4-seed';
    seedWrap.hidden = true;
    seedWrap.innerHTML = '<div class="s4-seed-label">SEED A PLAYBOOK</div>';
    const tabs = document.createElement('div');
    tabs.className = 's4-tabs';
    seedWrap.appendChild(tabs);
    boardCol.appendChild(seedWrap);
    const tabEls = [];
    PRESETS.forEach(function (preset, i) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'poke-btn s4-tab';
      tab.innerHTML =
        '<span class="s4-tab-name">' + preset.name + '</span>' +
        '<span class="s4-tab-sub">' + preset.sub + '</span>';
      tab.addEventListener('click', function () { selectPreset(i); });
      tabs.appendChild(tab);
      tabEls.push(tab);
    });

    /* ===== RIGHT: the step rail (panels earn their place) ===== */
    const rail = document.createElement('div');
    rail.className = 's4-rail';
    body.appendChild(rail);

    /* pi : S -> A (step 4) */
    const formulaCard = document.createElement('div');
    formulaCard.className = 's4-formula-card';
    formulaCard.hidden = true;
    formulaCard.innerHTML = '<div class="s4-rail-title">THE PLAYBOOK, IN SYMBOLS</div>';
    const fbox = document.createElement('div');
    fbox.className = 's4-formula poke-formula';
    window.Katex.render('\\pi : S \\rightarrow A', fbox, true);
    formulaCard.appendChild(fbox);
    rail.appendChild(formulaCard);

    /* The 3 x 3 x 3 x 3 = 81 counter (step 6). */
    const countCard = document.createElement('div');
    countCard.className = 's4-count';
    countCard.hidden = true;
    countCard.innerHTML = '<div class="s4-rail-title">HOW MANY PLAYBOOKS?</div>';
    const countGrid = document.createElement('div');
    countGrid.className = 's4-count-grid';
    countCard.appendChild(countGrid);
    const ccChips = [];   // ccChips[w][j] = chip element
    const ccNs = [];      // the "3" badge per column
    for (let w = 0; w < NS; w++) {
      if (w > 0) {
        const x = document.createElement('span');
        x.className = 's4-cc-x';
        x.textContent = 'x';
        countGrid.appendChild(x);
      }
      const col = document.createElement('div');
      col.className = 's4-cc';
      const lab = document.createElement('span');
      lab.className = 's4-cc-state s4-w' + w;
      lab.textContent = SD[w];
      col.appendChild(lab);
      const stack = document.createElement('div');
      stack.className = 's4-cc-chips';
      ccChips[w] = [];
      IDS.forEach(function (id) {
        const c = document.createElement('span');
        c.className = 's4-cc-chip ' + Actions.toneClass(id);
        c.textContent = Actions.shortLabel(id);
        stack.appendChild(c);
        ccChips[w].push(c);
      });
      col.appendChild(stack);
      const n = document.createElement('span');
      n.className = 's4-cc-n';
      n.textContent = String(IDS.length);
      col.appendChild(n);
      ccNs.push(n);
      countGrid.appendChild(col);
    }
    const countResult = document.createElement('div');
    countResult.className = 's4-count-result';
    countResult.innerHTML = '= <span class="s4-count-num"></span>';
    countCard.appendChild(countResult);
    const countNum = countResult.querySelector('.s4-count-num');
    rail.appendChild(countCard);

    /* The teaser banner (step 7). */
    const hookCard = document.createElement('div');
    hookCard.className = 's4-hook';
    hookCard.hidden = true;
    hookCard.innerHTML =
      '<div class="s4-hook-title">WHICH OF THE ' + N_PLAYBOOKS +
      ' IS BEST?</div>';
    rail.appendChild(hookCard);

    /* ---------- Caption dialog + hint ---------- */
    const dialogHost = document.createElement('div');
    dialogHost.className = 's4-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    const hint = document.createElement('div');
    hint.className = 'footnote s4-hint';
    hint.innerHTML =
      'Click a call to cycle RUN &#8594; SVC &#8594; NEW. ' +
      'Press <kbd>n</kbd> for speaker notes.';
    root.appendChild(hint);

    /* ---------- Painting ---------- */
    function paintRow(w) {
      const slot = rows[w].slot;
      const id = policy[w];
      for (const t of ALL_TONES) slot.classList.remove(t);
      slot.classList.toggle('s4-empty', !id);
      if (!id) {
        slot.innerHTML = '<span class="s4-slot-q">?</span>';
        slot.setAttribute('aria-label', 'Write a call for ' + SD[w]);
        return;
      }
      slot.classList.add(Actions.toneClass(id));
      slot.innerHTML =
        '<span class="s4-slot-icon">' + Actions.leverIconSvg(id) + '</span>' +
        '<span class="s4-slot-name">' + Actions.shortLabel(id) + '</span>' +
        '<span class="s4-slot-cycle">&#8635;</span>';
      slot.setAttribute('aria-label', 'Cycle the call for ' + SD[w]);
    }

    function flipRow(w, delay) {
      const el = rows[w].slot;
      later(function () {
        el.classList.remove('s4-flip');
        void el.offsetWidth;
        el.classList.add('s4-flip');
        later(function () { el.classList.remove('s4-flip'); }, 420);
      }, delay || 0);
    }

    function landRow(w, delay) {
      const el = rows[w].slot;
      later(function () {
        el.classList.add('s4-land');
        if (window.SFX) { try { window.SFX.play('tick'); } catch (_e) {} }
        later(function () { el.classList.remove('s4-land'); }, 460);
      }, delay || 0);
    }

    function pop(el) {
      el.classList.remove('s4-pop');
      void el.offsetWidth;
      el.classList.add('s4-pop');
    }

    /* Which row the Monday lookup points at (none before step 3). */
    function paintRowTargets(defer) {
      for (let w = 0; w < NS; w++) {
        rows[w].row.classList.remove('s4-row-hit');
        rows[w].row.classList.toggle('s4-row-target',
          !defer && cursor >= 3 && w === mondayWear);
      }
    }

    function paintName() {
      const show = cursor >= 2 && complete();
      nameTag.hidden = !show;
      if (!show) return;
      const m = matchedPreset();
      nameTag.textContent = m >= 0 ? PRESETS[m].name : 'YOUR PLAYBOOK';
    }

    function paintTabs() {
      seedWrap.hidden = cursor < 5;
      const m = matchedPreset();
      tabEls.forEach(function (tab, i) {
        tab.classList.toggle('active', i === m);
      });
      /* &run presses NERVOUS OWNER, but only once the tabs exist. */
      if (cursor >= 5) tabEls[1].setAttribute('data-run-primary', '');
      else tabEls[1].removeAttribute('data-run-primary');
    }

    /* The lookup line under the card: [gauge] STATE > (pi(s) =) [CALL]. */
    function paintMonday(deferCall) {
      monday.hidden = cursor < 3;
      if (monday.hidden) return;
      mondayGauge.set(mondayWear);
      mondayState.className = 's4-monday-state s4-w' + mondayWear;
      mondayState.textContent = SD[mondayWear];
      mondayPi.hidden = cursor < 4;
      if (cursor >= 4) {
        window.Katex.render(
          '\\pi(\\text{' + SD[mondayWear] + '}) =', mondayPi, false);
      }
      const id = policy[mondayWear];
      if (id) {
        mondayCall.className = 's4-chiplet s4-monday-call ' + Actions.toneClass(id);
        mondayCall.innerHTML =
          '<span class="s4-chiplet-icon">' + Actions.leverIconSvg(id) + '</span>' +
          actionName(id);
      } else {
        mondayCall.className = 's4-chiplet s4-monday-call';
        mondayCall.textContent = '?';
      }
      mondayCall.classList.toggle('s4-pending', !!deferCall);
    }

    /* Re-run the gauge -> row -> call animation (gauge clicks, step 3). */
    function fireLookup(animate) {
      paintMonday(animate);
      paintRowTargets(animate);
      if (!animate) return;
      later(function () {
        paintRowTargets(false);
        rows[mondayWear].row.classList.add('s4-row-hit');
      }, 280);
      later(function () {
        mondayCall.classList.remove('s4-pending');
        pop(mondayCall);
      }, 700);
      later(function () {
        rows[mondayWear].row.classList.remove('s4-row-hit');
      }, 1400);
    }

    /* ---- The 81 counter ---- */
    function paintCount() {
      countCard.hidden = cursor < 6;
      if (countCard.hidden) return;
      paintCountHighlights(null);
    }
    /* tick == null: static highlight = the card's own calls. */
    function paintCountHighlights(tick) {
      for (let w = 0; w < NS; w++) {
        const j = (tick == null)
          ? Math.max(0, IDS.indexOf(policy[w]))
          : (tick + w) % IDS.length;
        ccChips[w].forEach(function (c, idx) {
          c.classList.toggle('lit', idx === j);
        });
      }
    }
    function maybeStartCycle() {
      if (cycleTimer || cursor < 6 || instantMode()) return;
      let tick = 0;
      cycleTimer = setInterval(function () {
        tick++;
        paintCountHighlights(tick);
      }, 420);
    }
    function tickCounter(ms, delay) {
      countNum.textContent = '';
      later(function () {
        const t0 = performance.now();
        (function frame(t) {
          const p = Math.min(1, (t - t0) / ms);
          const eased = 1 - Math.pow(1 - p, 3);
          countNum.textContent = String(Math.max(1, Math.round(eased * N_PLAYBOOKS)));
          counterRaf = (p < 1) ? requestAnimationFrame(frame) : null;
        })(t0);
      }, delay || 0);
    }

    /* ---------- Render: everything derives from cursor + state ---------- */
    function render(fresh) {
      /* fresh: the step index being animated in, or null (replay/jump). */
      clearTimers();
      const anim = fresh != null && !instantMode();
      stepCounter.textContent = 'STEP ' + (cursor + 1) + ' / ' + N_STEPS;

      for (let w = 0; w < NS; w++) paintRow(w);
      paintRowTargets(anim && fresh === 3);
      paintName();
      paintMonday(anim && fresh === 3);
      formulaCard.hidden = cursor < 4;
      paintTabs();
      paintCount();
      hookCard.hidden = cursor < 7;

      if (cursor >= 6) countNum.textContent = String(N_PLAYBOOKS);
      ccNs.forEach(function (n) { n.classList.remove('s4-pending'); });
      nameTag.classList.remove('s4-pending');

      dialog.say(CAPTIONS[cursor], { instant: !anim });

      if (anim) animateStep(fresh);
      maybeStartCycle();
    }

    /* Entrance choreography per step (forward clicks only). */
    function animateStep(k) {
      if (k === 1) {
        landRow(0, 60);
      } else if (k === 2) {
        landRow(1, 0);
        landRow(2, 240);
        landRow(3, 480);
        nameTag.classList.add('s4-pending');
        later(function () {
          nameTag.classList.remove('s4-pending');
          pop(nameTag);
        }, 820);
      } else if (k === 3) {
        pop(monday);
        fireLookup(true);
      } else if (k === 4) {
        pop(formulaCard);
        pop(mondayPi);
      } else if (k === 5) {
        for (let w = 0; w < NS; w++) flipRow(w, w * 110);
        pop(nameTag);
        pop(seedWrap);
      } else if (k === 6) {
        pop(countCard);
        ccNs.forEach(function (n, w) {
          n.classList.add('s4-pending');
          later(function () {
            n.classList.remove('s4-pending');
            pop(n);
          }, 220 + w * 160);
        });
        tickCounter(1100, 900);
      } else if (k === 7) {
        pop(hookCard);
        if (window.SFX) { try { window.SFX.play('win'); } catch (_e) {} }
      }
    }

    /* ---------- Interaction (stays live at every step) ---------- */
    function refreshAfterEdit() {
      paintName();
      paintTabs();
      paintMonday(false);
      if (!countCard.hidden && !cycleTimer) paintCountHighlights(null);
    }

    function cycleRow(w) {
      const cur = policy[w];
      policy[w] = cur ? IDS[(IDS.indexOf(cur) + 1) % IDS.length] : IDS[0];
      paintRow(w);
      flipRow(w, 0);
      refreshAfterEdit();
      if (window.SFX) { try { window.SFX.play('cursor'); } catch (_e) {} }
    }

    function selectPreset(i) {
      policy = PRESETS[i].map.slice();
      for (let w = 0; w < NS; w++) {
        paintRow(w);
        if (!instantMode()) flipRow(w, w * 60);
      }
      refreshAfterEdit();
    }

    /* ---------- Step engine: reset + replay, never inverse ---------- */
    function jumpTo(k) {
      cursor = Math.max(0, Math.min(N_STEPS - 1, k));
      resetState();
      for (let j = 0; j <= cursor; j++) applyStep(j);
      render(null);
    }

    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < N_STEPS) ? n : 0;
    }
    jumpTo(readInitialStep());

    return {
      onEnter() { jumpTo(cursor); },
      onLeave() { clearTimers(); },
      onNextKey() {
        if (cursor < N_STEPS - 1) {
          cursor++;
          applyStep(cursor);
          render(cursor);
          return true;
        }
        return false;          /* fall through: on to the trajectory */
      },
      onPrevKey() {
        if (cursor > 0) { jumpTo(cursor - 1); return true; }
        return false;          /* fall through: back to the MDP scene */
      },
    };
  };
})();

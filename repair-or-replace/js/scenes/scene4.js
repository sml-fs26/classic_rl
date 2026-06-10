/* Scene 4, "Policy: your maintenance playbook" (earns the POLICY badge).
 *
 *   The policy as a 4-row state-to-action MAP the user can author. Left:
 *   the playbook card, one row per wear level (state chip with a compact
 *   VanCard gauge swatch, then a clickable call slot that cycles
 *   RUN -> SVC -> NEW), plus a "this playbook, this Monday" lookup line
 *   and two preset buttons:
 *     GRANDPA'S WAY      run / run / run / replace
 *     THE NERVOUS OWNER  run / service / service / service
 *   Right: the active playbook's blurb, the completeness note
 *   (pi : S -> A, one call per state, written before the week starts),
 *   the 3^4 = 81 count (computed in code), and the closing hook.
 *
 *   Neither preset is the optimal policy, and window.DATA.policy is never
 *   read or shown here: which of the 81 maps is best stays open until the
 *   Q* scene.
 *
 *   Cold entry safe (deep link #scene=4). &run presses THE NERVOUS OWNER
 *   ([data-run-primary]) so the headless frame shows a map that changes
 *   its mind with the state.
 *   Contract: window.scenes.scene4 = function(root){ return {...}; };
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad', 'scene4-scene');
    root.innerHTML = '';

    const Van = window.Van;
    const Actions = window.Actions;
    const NS = Van.NUM_STATES;                       // 4
    const IDS = Actions.MOVE_IDS;                    // [run, service, replace]
    const PLAYBOOK_COUNT = Math.pow(IDS.length, NS); // 3^4 = 81

    function actionName(id) {
      const a = Actions.MOVE_BY_ID[id];
      return a ? a.name : id;
    }

    /* ---- The two hand-written presets (NOT the optimal map) ---- */
    const PRESETS = [
      {
        name: "GRANDPA'S WAY",
        sub: 'run everything,<br>replace only when dead',
        map: ['run', 'run', 'run', 'replace'],
        blurb: 'Run her until she dies, then buy new. No shop visits, ever. ' +
          'Simple, and still a real policy: the card is full, one call per ' +
          'wear level.',
      },
      {
        name: 'THE NERVOUS OWNER',
        sub: 'shop early, shop often',
        map: ['run', 'service', 'service', 'service'],
        blurb: 'One rattle and Bessie goes to the shop. SERVICE at WORN, at ' +
          'SHAKY, even at FAILING. Cautious, pricey, and still just a map ' +
          'from gauge to call.',
      },
    ];

    /* Live state: the authored map + which preset (if any) it matches. */
    const policy = PRESETS[0].map.slice();
    let activePreset = 0;        // -1 once hand-edited
    let exampleWear = 2;         // the "this Monday" lookup example: SHAKY

    /* ---------- Title + lede ---------- */
    const head = document.createElement('div');
    head.className = 's4-head';
    head.innerHTML =
      '<h2 class="poke-section-title s4-title">Policy: your maintenance playbook</h2>' +
      '<p class="poke-caption s4-lede">A <b>policy</b> is a complete standing ' +
      'order: one call per wear level, written down before the week starts. ' +
      'When you ran the fleet by feel, you already were one, just unwritten.</p>';
    root.appendChild(head);

    /* ---------- Formula strip: pi : S -> A ---------- */
    const fcard = document.createElement('div');
    fcard.className = 's4-formula-card';
    const fbox = document.createElement('div');
    fbox.className = 's4-formula poke-formula';
    window.Katex.render('\\pi : S \\rightarrow A', fbox, true);
    fcard.appendChild(fbox);
    const ffoot = document.createElement('div');
    ffoot.className = 's4-formula-foot';
    ffoot.textContent =
      'Read it: hand the playbook a wear level, it hands back the call.';
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---------- Two-column body ---------- */
    const body = document.createElement('div');
    body.className = 's4-body';
    root.appendChild(body);

    /* ===== LEFT: the playbook card + Monday lookup + presets ===== */
    const boardCol = document.createElement('div');
    boardCol.className = 's4-board-col';
    body.appendChild(boardCol);

    const boardTitle = document.createElement('div');
    boardTitle.className = 's4-board-title';
    boardTitle.textContent = 'THE PLAYBOOK CARD';
    boardCol.appendChild(boardTitle);

    const colHead = document.createElement('div');
    colHead.className = 's4-col-head';
    colHead.innerHTML =
      '<span>WEAR (STATE)</span><span>YOUR CALL &middot; pi(s)</span>';
    boardCol.appendChild(colHead);

    const rowsBox = document.createElement('div');
    rowsBox.className = 's4-rows poke-box tight';
    boardCol.appendChild(rowsBox);

    const rows = [];   // per wear: { slot, slotIcon, slotName }
    for (let w = 0; w < NS; w++) {
      const row = document.createElement('div');
      row.className = 's4-row';

      const state = document.createElement('div');
      state.className = 's4-state';
      const gaugeHost = document.createElement('span');
      gaugeHost.className = 's4-state-gauge';
      state.appendChild(gaugeHost);
      window.VanCard.mount(gaugeHost, { wear: w, compact: true });
      const sname = document.createElement('span');
      sname.className = 's4-state-name s4-w' + w;
      sname.textContent = Van.stateName(w);
      state.appendChild(sname);
      row.appendChild(state);

      const arrow = document.createElement('span');
      arrow.className = 's4-row-arrow';
      arrow.innerHTML = '&#8594;';
      row.appendChild(arrow);

      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 's4-slot';
      slot.setAttribute('aria-label', 'Cycle the call for ' + Van.stateName(w));
      slot.innerHTML =
        '<span class="s4-slot-icon"></span>' +
        '<span class="s4-slot-name"></span>' +
        '<span class="s4-slot-cycle">&#8635;</span>';
      slot.addEventListener('click', function () { cycleRow(w); });
      row.appendChild(slot);

      rowsBox.appendChild(row);
      rows[w] = {
        slot: slot,
        slotIcon: slot.querySelector('.s4-slot-icon'),
        slotName: slot.querySelector('.s4-slot-name'),
      };
    }

    /* "This playbook, this Monday": the policy IS a lookup. */
    const monday = document.createElement('div');
    monday.className = 's4-monday';
    monday.innerHTML =
      '<div class="s4-monday-label">THIS PLAYBOOK, THIS MONDAY</div>' +
      '<div class="s4-monday-pick"></div>' +
      '<div class="s4-monday-line"></div>';
    boardCol.appendChild(monday);
    const mondayPick = monday.querySelector('.s4-monday-pick');
    const mondayLine = monday.querySelector('.s4-monday-line');
    const pickBtns = [];
    for (let w = 0; w < NS; w++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 's4-pick s4-w' + w;
      b.textContent = Van.stateName(w);
      b.setAttribute('aria-label', 'Monday example: gauge reads ' + Van.stateName(w));
      b.addEventListener('click', function () {
        exampleWear = w;
        refreshMonday();
        if (window.SFX) { try { window.SFX.play('cursor'); } catch (_e) {} }
      });
      mondayPick.appendChild(b);
      pickBtns.push(b);
    }

    /* Preset buttons below the card. */
    const seedLabel = document.createElement('div');
    seedLabel.className = 's4-seed-label';
    seedLabel.textContent = 'SEED A PLAYBOOK';
    boardCol.appendChild(seedLabel);

    const tabs = document.createElement('div');
    tabs.className = 's4-tabs';
    boardCol.appendChild(tabs);
    const tabEls = [];
    PRESETS.forEach(function (preset, i) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'poke-btn s4-tab';
      if (i === 1) tab.setAttribute('data-run-primary', '');
      tab.innerHTML =
        '<span class="s4-tab-name">' + preset.name + '</span>' +
        '<span class="s4-tab-sub">' + preset.sub + '</span>';
      tab.addEventListener('click', function () { selectPreset(i, true); });
      tabs.appendChild(tab);
      tabEls.push(tab);
    });

    /* ===== RIGHT: the reading panel ===== */
    const panel = document.createElement('div');
    panel.className = 's4-panel';
    body.appendChild(panel);

    const blurb = document.createElement('div');
    blurb.className = 's4-blurb poke-box tight';
    panel.appendChild(blurb);

    const completeNote = document.createElement('p');
    completeNote.className = 's4-complete-note';
    completeNote.innerHTML =
      'A call sits on <b>every</b> wear level at once, before the week ' +
      'starts. That completeness is what makes it a policy: Monday is a ' +
      'lookup, not a debate.';
    panel.appendChild(completeNote);

    /* The 3^4 = 81 count, computed in code. */
    const countCard = document.createElement('div');
    countCard.className = 's4-count';
    const countTitle = document.createElement('div');
    countTitle.className = 's4-count-title';
    countTitle.textContent = 'HOW MANY PLAYBOOKS?';
    countCard.appendChild(countTitle);
    const countFormula = document.createElement('div');
    countFormula.className = 's4-count-formula';
    window.Katex.render(
      '|A|^{|S|} = ' + IDS.length + '^{' + NS + '} = ' + PLAYBOOK_COUNT,
      countFormula, true);
    countCard.appendChild(countFormula);
    const countBody = document.createElement('p');
    countBody.className = 's4-count-body';
    countBody.textContent =
      NS + ' states, ' + IDS.length + ' calls each: ' + PLAYBOOK_COUNT +
      ' complete playbooks. The card on the left is one of them.';
    countCard.appendChild(countBody);
    panel.appendChild(countCard);

    /* Closing hook. No optimal map here; that is the Q* scene's payoff. */
    const hook = document.createElement('div');
    hook.className = 's4-hook';
    hook.innerHTML =
      '<div class="s4-hook-title">WHICH OF THE ' + PLAYBOOK_COUNT +
        ' IS BEST?</div>' +
      '<p class="s4-hook-body">That question has an exact answer, not a ' +
      'vibe. To find it we first need a number for a whole playbook: ' +
      '<b>money over time</b>. That is next.</p>';
    panel.appendChild(hook);

    const hint = document.createElement('div');
    hint.className = 'footnote s4-hint';
    hint.innerHTML =
      'Click a call to cycle RUN &#8594; SVC &#8594; NEW. Seed a playbook ' +
      'below the card. Press <kbd>n</kbd> for speaker notes.';
    root.appendChild(hint);

    /* ---------- Painting ---------- */
    const ALL_TONES = IDS.map(Actions.toneClass);

    function paintRow(w) {
      const node = rows[w];
      const id = policy[w];
      for (const t of ALL_TONES) node.slot.classList.remove(t);
      node.slot.classList.add(Actions.toneClass(id));
      node.slotIcon.innerHTML = Actions.leverIconSvg(id);
      node.slotName.textContent = Actions.shortLabel(id);
    }

    function flipRow(w, delay) {
      const el = rows[w].slot;
      setTimeout(function () {
        el.classList.remove('s4-flip');
        void el.offsetWidth;
        el.classList.add('s4-flip');
        setTimeout(function () { el.classList.remove('s4-flip'); }, 420);
      }, delay || 0);
    }

    function paintAll(animate) {
      for (let w = 0; w < NS; w++) {
        paintRow(w);
        if (animate) flipRow(w, w * 60);
      }
    }

    function refreshTabs() {
      tabEls.forEach(function (tab, i) {
        tab.classList.toggle('active', i === activePreset);
      });
    }

    function refreshBlurb() {
      if (activePreset === -1) {
        blurb.innerHTML =
          '<div class="s4-blurb-name">YOUR PLAYBOOK</div>' +
          '<p class="s4-blurb-text">You wrote your own standing order: one ' +
          'call on every wear level, all four filled. Whether it earns more ' +
          'than the presets is the next question.</p>';
        return;
      }
      const p = PRESETS[activePreset];
      blurb.innerHTML =
        '<div class="s4-blurb-name">' + p.name + '</div>' +
        '<p class="s4-blurb-text">' + p.blurb + '</p>';
    }

    function refreshMonday() {
      pickBtns.forEach(function (b, w) {
        b.classList.toggle('active', w === exampleWear);
      });
      const id = policy[exampleWear];
      mondayLine.innerHTML = '';
      const lead = document.createElement('span');
      lead.className = 's4-monday-lead';
      lead.textContent = 'Gauge reads ' + Van.stateName(exampleWear) + '.';
      mondayLine.appendChild(lead);
      const piBit = document.createElement('span');
      piBit.className = 's4-monday-pi';
      window.Katex.render(
        '\\pi(\\text{' + Van.stateName(exampleWear) + '}) =', piBit, false);
      mondayLine.appendChild(piBit);
      const chiplet = document.createElement('span');
      chiplet.className = 's4-chiplet ' + Actions.toneClass(id);
      chiplet.innerHTML =
        '<span class="s4-chiplet-icon">' + Actions.leverIconSvg(id) + '</span>' +
        actionName(id);
      mondayLine.appendChild(chiplet);
      const tail = document.createElement('span');
      tail.className = 's4-monday-tail';
      tail.textContent = 'A lookup, not a debate.';
      mondayLine.appendChild(tail);
    }

    /* ---------- Interaction ---------- */
    function cycleRow(w) {
      const next = IDS[(IDS.indexOf(policy[w]) + 1) % IDS.length];
      policy[w] = next;
      /* Hand edits may land back on a preset; track honestly. */
      activePreset = -1;
      PRESETS.forEach(function (p, i) {
        if (p.map.join() === policy.join()) activePreset = i;
      });
      paintRow(w);
      flipRow(w, 0);
      refreshTabs();
      refreshBlurb();
      refreshMonday();
      if (window.SFX) { try { window.SFX.play('cursor'); } catch (_e) {} }
    }

    function selectPreset(i, animate) {
      activePreset = i;
      const p = PRESETS[i];
      for (let w = 0; w < NS; w++) policy[w] = p.map[w];
      paintAll(animate);
      refreshTabs();
      refreshBlurb();
      refreshMonday();
      /* No SFX here: preset buttons are .poke-btn, the pager already blips. */
    }

    /* Initial paint (no stagger on cold entry). */
    selectPreset(0, false);

    return {
      onEnter() {
        paintAll(false);
        refreshTabs();
        refreshBlurb();
        refreshMonday();
      },
      /* No internal step ladder: arrows page straight through. */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

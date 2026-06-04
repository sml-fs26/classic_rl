/* Scene 4 - "Policy: your playbook".
 *
 *   A policy pi : S -> A is a COMPLETE rule: one lever pre-assigned to EVERY
 *   one of the five rungs. This scene paints the ladder as a five-row
 *   playbook (a LadderCard mini per rung + the chosen lever beside it) and
 *   lets the learner CYCLE the lever at each rung, so a policy reads as a full
 *   set of decisions, not a single call. Two hand-written playbooks seed the
 *   board:
 *     (a) ALWAYS DEMO    - the constant policy, every rung amber
 *     (b) WARM THEN CLOSE - NURTURE the cold end, DEMO the middle, HARD CLOSE
 *                           only at READY (a plausible gut rule)
 *
 *   Both are HAND policies a rep could write in a minute; NEITHER is the
 *   optimal policy, so window.DATA.policy is never shown here (that is the
 *   payoff of the Q* / DP scenes). The callback: in the playtest you WERE a
 *   policy, you just had not written it down.
 *
 *   Ports the pedagogy of last-minute-pricing/scene4 and re-themes wholesale
 *   to the pipeline domain (rungs / levers / SIGNED / LOST). LMP paints a 5x4
 *   grid read-only; here the board is the 5-rung ladder and each rung's lever
 *   is clickable, so the "one decision per state" idea is tactile.
 *
 *   Cold entry safe: reads window.Pipeline / window.Levers only.
 *   Contract: window.scenes.scene4 = function(root){ return {onEnter,...}; }
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const P = window.Pipeline;
  const NR = (P && P.NUM_RUNGS) || 5;
  const LEVER_IDS = (window.Levers && window.Levers.MOVE_IDS) ||
    ['nurture', 'demo', 'hardclose'];

  function rungName(r) { return T('rung.' + P.RUNGS[r], P.RUNG_DISPLAY[r]); }
  function leverName(id) { return T('lever.' + id, id); }
  function shortLabel(id) { return (window.Levers && window.Levers.shortLabel(id)) || id; }
  function toneClass(id) { return (window.Levers && window.Levers.toneClass(id)) || ''; }
  function leverIcon(id) { return (window.Levers && window.Levers.leverIconSvg(id)) || ''; }

  /* ---- Two hand playbooks, by rule (NOT the optimal map) ---- */
  function policyAlwaysDemo(/* rung */) { return 'demo'; }
  function policyWarmThenClose(rung) {
    /* Soft at the cold end, close only once the lead is READY. */
    if (rung === P.READY) return 'hardclose';
    if (rung <= 0) return 'nurture';        // COLD
    return 'demo';
  }
  const PRESETS = [
    { id: 'A', fn: policyAlwaysDemo,     nameKey: 'scene4.policyA.name', subKey: 'scene4.policyA.sub', blurbKey: 'scene4.policyA.blurb' },
    { id: 'B', fn: policyWarmThenClose,  nameKey: 'scene4.policyB.name', subKey: 'scene4.policyB.sub', blurbKey: 'scene4.policyB.blurb' },
  ];

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad', 'sc4-scene');
    root.innerHTML = '';

    /* The live playbook: one lever per rung, index by rung 0..4. Seeded from
       preset A; the learner edits it by cycling rung chips. */
    const policy = [];
    for (let r = 0; r < NR; r++) policy[r] = policyAlwaysDemo(r);
    let activePreset = 0;     // -1 once the learner edits a rung by hand
    let dirty = false;

    /* ---------- Title + lede ---------- */
    const headEl = document.createElement('div');
    headEl.className = 'sc4-head';
    headEl.innerHTML =
      '<h2 class="poke-section-title sc4-title">' + T('scene.title4') + '</h2>' +
      '<p class="poke-caption sc4-lede">' + T('scene4.lede') + '</p>';
    root.appendChild(headEl);

    /* ---------- Formula strip: pi : S -> A ---------- */
    const fcard = document.createElement('div');
    fcard.className = 'sc4-formula-card';
    const fbox = document.createElement('div');
    fbox.className = 'sc4-formula poke-formula';
    fcard.appendChild(fbox);
    window.Katex.render(String.raw`\pi : S \rightarrow A`, fbox, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'sc4-formula-foot';
    ffoot.textContent = T('scene4.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---------- Two-column body: board (left) + control panel (right) ---------- */
    const body = document.createElement('div');
    body.className = 'sc4-body';
    root.appendChild(body);

    /* ===== LEFT: the playbook board (one row per rung) ===== */
    const boardCol = document.createElement('div');
    boardCol.className = 'sc4-board-col';
    body.appendChild(boardCol);

    const boardTitle = document.createElement('div');
    boardTitle.className = 'sc4-board-title';
    boardTitle.textContent = T('scene4.board.title');
    boardCol.appendChild(boardTitle);

    const colHead = document.createElement('div');
    colHead.className = 'sc4-col-head';
    colHead.innerHTML =
      '<span class="sc4-col-rung">' + T('scene4.col.rung') + '</span>' +
      '<span class="sc4-col-lever">' + T('scene4.col.lever') + '</span>';
    boardCol.appendChild(colHead);

    /* The five rung rows, READY at the top (matches the LadderCard order). */
    const rows = [];   // per rung: { row, chip, chipName, chipIcon }
    const rowsWrap = document.createElement('div');
    rowsWrap.className = 'sc4-rows';
    boardCol.appendChild(rowsWrap);

    for (let display = NR - 1; display >= 0; display--) {
      const rung = display;
      const row = document.createElement('div');
      row.className = 'sc4-row';
      row.dataset.rung = String(rung);

      /* The state: a mini LadderCard showing the lead on THIS rung. */
      const cardHost = document.createElement('div');
      cardHost.className = 'sc4-row-card';
      const lc = window.LadderCard.mount(cardHost, { rung: rung, size: 'sm', compact: true });
      lc.set(rung);
      row.appendChild(cardHost);

      const rname = document.createElement('div');
      rname.className = 'sc4-row-name';
      rname.textContent = rungName(rung);
      row.appendChild(rname);

      const arrow = document.createElement('div');
      arrow.className = 'sc4-row-arrow';
      arrow.innerHTML = '&#8594;';      // ->
      row.appendChild(arrow);

      /* The chosen lever: a clickable chip the learner cycles. */
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sc4-chip';
      chip.dataset.rung = String(rung);
      chip.innerHTML =
        '<span class="sc4-chip-icon"></span>' +
        '<span class="sc4-chip-name"></span>' +
        '<span class="sc4-chip-cycle">&#8635;</span>';   // cycle glyph
      chip.setAttribute('aria-label', T('scene4.chip.aria', { rung: rungName(rung) }));
      chip.addEventListener('click', function () { cycleRung(rung); });
      row.appendChild(chip);

      rowsWrap.appendChild(row);
      rows[rung] = {
        row: row,
        chip: chip,
        chipIcon: chip.querySelector('.sc4-chip-icon'),
        chipName: chip.querySelector('.sc4-chip-name'),
      };
    }

    /* A read-out under the board naming pi(rung) = lever for the focused rung. */
    const readout = document.createElement('div');
    readout.className = 'sc4-readout';
    readout.innerHTML =
      '<span class="sc4-readout-label">' + T('scene4.readout.label') + '</span> ' +
      '<span class="sc4-readout-val" id="sc4-readout-val">&mdash;</span>';
    boardCol.appendChild(readout);
    const readoutVal = readout.querySelector('#sc4-readout-val');

    /* ===== RIGHT: the control panel ===== */
    const panel = document.createElement('div');
    panel.className = 'sc4-panel';
    body.appendChild(panel);

    /* Playbook preset tabs. */
    const tabsLabel = document.createElement('div');
    tabsLabel.className = 'sc4-tabs-label';
    tabsLabel.textContent = T('scene4.tabs.label');
    panel.appendChild(tabsLabel);

    const tabs = document.createElement('div');
    tabs.className = 'sc4-tabs';
    PRESETS.forEach(function (preset, i) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'sc4-tab poke-btn';
      tab.dataset.idx = String(i);
      /* &run lands on the second (multi-colour) playbook so the headless shot
         shows a policy that changes its mind up the ladder, not a flat map. */
      if (i === 1) tab.setAttribute('data-run-primary', '');
      tab.innerHTML =
        '<span class="sc4-tab-name">' + T(preset.nameKey) + '</span>' +
        '<span class="sc4-tab-sub">' + T(preset.subKey) + '</span>';
      tab.addEventListener('click', function () { selectPreset(i); });
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);

    /* Blurb describing the active playbook (or the hand-edited note). */
    const blurb = document.createElement('div');
    blurb.className = 'sc4-blurb poke-box tight';
    panel.appendChild(blurb);

    /* The completeness note. */
    const completeNote = document.createElement('p');
    completeNote.className = 'sc4-complete-note';
    completeNote.innerHTML = T('scene4.note.complete');
    panel.appendChild(completeNote);

    /* The scene-2 callback card. */
    const callback = document.createElement('div');
    callback.className = 'sc4-callback';
    callback.innerHTML =
      '<div class="sc4-callback-title">' + T('scene4.callback.title') + '</div>' +
      '<p class="sc4-callback-body">' + T('scene4.callback.body') + '</p>' +
      '<p class="sc4-callback-tease">' + T('scene4.callback.tease') + '</p>';
    panel.appendChild(callback);

    /* ---------- Hint ---------- */
    const hint = document.createElement('div');
    hint.className = 'footnote sc4-hint';
    hint.innerHTML = T('scene4.hint');
    root.appendChild(hint);

    /* ---------- Paint the live policy onto the chips ---------- */
    const ALL_TONES = LEVER_IDS.map(toneClass);
    function paintRow(rung) {
      const node = rows[rung];
      const id = policy[rung];
      for (const t of ALL_TONES) { if (t) node.chip.classList.remove(t); }
      node.chip.classList.add(toneClass(id));
      node.chip.dataset.lever = id;
      node.chipIcon.innerHTML = leverIcon(id);
      node.chipName.textContent = shortLabel(id);
    }
    function paintAll(animate) {
      for (let r = 0; r < NR; r++) {
        paintRow(r);
        if (animate) {
          const node = rows[r];
          node.chip.classList.remove('sc4-chip-flip');
          (function (el, delay) {
            setTimeout(function () {
              el.classList.add('sc4-chip-flip');
              setTimeout(function () { el.classList.remove('sc4-chip-flip'); }, 420);
            }, delay);
          })(node.chip, (NR - 1 - r) * 60);
        }
      }
    }

    /* Cycle one rung's lever NURTURE -> DEMO -> HARD CLOSE -> NURTURE. This
       is what makes the policy editable: the learner sets one decision per
       state by hand. */
    function cycleRung(rung) {
      const cur = LEVER_IDS.indexOf(policy[rung]);
      const next = LEVER_IDS[(cur + 1) % LEVER_IDS.length];
      policy[rung] = next;
      dirty = true;
      activePreset = -1;
      paintRow(rung);
      const node = rows[rung];
      node.chip.classList.remove('sc4-chip-flip');
      void node.chip.offsetWidth;
      node.chip.classList.add('sc4-chip-flip');
      setTimeout(function () { node.chip.classList.remove('sc4-chip-flip'); }, 420);
      showReadout(rung);
      refreshTabs();
      refreshBlurb();
      if (window.SFX) { try { window.SFX.play('cursor'); } catch (_e) {} }
    }

    function showReadout(rung) {
      const id = policy[rung];
      readoutVal.innerHTML =
        '<span class="sc4-readout-rung">' + rungName(rung) + '</span>' +
        '<span class="sc4-readout-arrow">&#8594;</span>' +
        '<span class="sc4-chiplet ' + toneClass(id) + '">' +
          '<span class="sc4-chiplet-icon">' + leverIcon(id) + '</span>' +
          leverName(id) +
        '</span>';
    }

    /* Tab active state: a tab is active only when the live policy still equals
       that preset (so editing a rung visibly drops the active tab). */
    function refreshTabs() {
      tabs.querySelectorAll('.sc4-tab').forEach(function (tab, ti) {
        tab.classList.toggle('active', !dirty && ti === activePreset);
      });
    }

    function refreshBlurb() {
      if (dirty && activePreset === -1) {
        blurb.innerHTML =
          '<div class="sc4-blurb-name">' + T('scene4.custom.name') + '</div>' +
          '<p class="sc4-blurb-text">' + T('scene4.custom.blurb') + '</p>';
        return;
      }
      const preset = PRESETS[activePreset];
      blurb.innerHTML =
        '<div class="sc4-blurb-name ' + toneClass(dominantLever(preset)) + '">' + T(preset.nameKey) + '</div>' +
        '<p class="sc4-blurb-text">' + T(preset.blurbKey) + '</p>';
    }

    /* For the blurb tag tint, pick the lever this playbook leans on most. */
    function dominantLever(preset) {
      const counts = {};
      for (const id of LEVER_IDS) counts[id] = 0;
      for (let r = 0; r < NR; r++) counts[preset.fn(r)]++;
      let best = LEVER_IDS[0], m = -1;
      for (const id of LEVER_IDS) { if (counts[id] > m) { m = counts[id]; best = id; } }
      return best;
    }

    function selectPreset(i, opts) {
      opts = opts || {};
      activePreset = i;
      dirty = false;
      const preset = PRESETS[i];
      for (let r = 0; r < NR; r++) policy[r] = preset.fn(r);
      paintAll(opts.animate !== false);
      refreshTabs();
      refreshBlurb();
      readoutVal.innerHTML = '&mdash;';
      if (!opts.silent && window.SFX) { try { window.SFX.play('cursor'); } catch (_e) {} }
    }

    /* Rung hover / focus updates the read-out (pi(rung) = lever). */
    for (let r = 0; r < NR; r++) {
      const rung = r;
      const node = rows[r];
      const show = function () { showReadout(rung); };
      node.chip.addEventListener('mouseenter', show);
      node.chip.addEventListener('focus', show);
      node.chip.addEventListener('mouseleave', function () {
        if (document.activeElement !== node.chip) readoutVal.innerHTML = '&mdash;';
      });
    }

    /* Initial paint (no SFX, no stagger on cold entry). */
    selectPreset(0, { silent: true, animate: false });

    return {
      onEnter() {
        /* Re-assert the live policy so a return visit repaints cleanly. */
        paintAll(false);
        refreshTabs();
        refreshBlurb();
      },
      /* Let the arrow keys flow to the pager (no internal step ladder here). */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

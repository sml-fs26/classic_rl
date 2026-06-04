/* scene4 -- "A policy is a playbook" (the Policy scene, new in the arc).
 *
 *   A policy pi: S -> A is a COMPLETE rule: one lever pre-assigned to every
 *   one of the 20 situations on the board. This scene paints TWO hand-written
 *   playbooks as coloured maps over the 5x4 grid so the learner sees a policy
 *   as a colour map, not a single decision:
 *     (a) ALWAYS STANDARD   -- the whole board amber (the constant policy)
 *     (b) HOLD, THEN DUMP   -- PREMIUM where d >= 2, STANDARD on the last day
 *
 *   Both are HAND policies a manager could write in a minute; neither is the
 *   optimal policy (that is the payoff of the Q-star / DP scenes, so we never
 *   show window.DATA.policy here). The callback: "in the playtest you WERE a
 *   policy, you just had not written it down."
 *
 *   The board reuses the same grid geometry, mini shelf-card icons, and the
 *   .lever-fill-* region tokens as the QTable widget, but renders ONE lever
 *   per cell (a clean coloured region map) rather than three Q-values, so it
 *   reads as a playbook and leaks no value information.
 *
 *   Cold entry safe: reads window.Pricing / window.Levers only.
 *   Contract: window.scenes.scene4 = function(root){ return {onEnter,...}; } */
(function () {
  if (!window.scenes) window.scenes = {};

  const T = (k, v) => window.I18N.t(k, v);
  const P = window.Pricing;
  const LEVER_IDS = window.Levers.LEVER_IDS;     // [premium, standard]
  const ROWS = P.ROWS;   // 5 (units 5..1)
  const COLS = P.COLS;   // 4 (days 4..1)
  const N = P.N;         // 20

  /* ---- The two hand policies, computed by rule (NOT the optimal map) ---- */
  function policyAlwaysStandard(/* s */) { return 'standard'; }
  function policyHoldThenDump(s) {
    /* Hold high while there is runway, clear stock on the last day. */
    return s.d >= 2 ? 'premium' : 'standard';
  }
  const PRESETS = [
    { id: 'A', fn: policyAlwaysStandard, nameKey: 'scene4.policyA.name', subKey: 'scene4.policyA.sub', blurbKey: 'scene4.policyA.blurb' },
    { id: 'B', fn: policyHoldThenDump,  nameKey: 'scene4.policyB.name', subKey: 'scene4.policyB.sub', blurbKey: 'scene4.policyB.blurb' },
  ];

  function shortLabel(id) { return T('lever.' + id + '.short'); }

  window.scenes.scene4 = function (root) {
    root.className = 'scene-pad sc4-root';
    root.innerHTML = '';

    let activePreset = 0;

    /* ---------- Title + lede ---------- */
    const head = document.createElement('div');
    head.className = 'sc4-head';
    head.innerHTML =
      '<h2 class="poke-subtitle sc4-title">' + T('scene4.title') + '</h2>' +
      '<p class="poke-caption sc4-lede">' + T('scene4.lede') + '</p>';
    root.appendChild(head);

    /* ---------- Formula strip: pi : S -> A ---------- */
    const fcard = document.createElement('div');
    fcard.className = 'sc4-formula-card';
    const fbox = document.createElement('div');
    fbox.className = 'sc4-formula poke-formula';
    fcard.appendChild(fbox);
    window.Katex.render(window.DATA.tex.policy, fbox, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'sc4-formula-foot';
    ffoot.textContent = T('scene4.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---------- Two-column body: board (left) + control panel (right) ---------- */
    const body = document.createElement('div');
    body.className = 'sc4-body';
    root.appendChild(body);

    /* ===== LEFT: the policy board ===== */
    const boardCol = document.createElement('div');
    boardCol.className = 'sc4-board-col';
    body.appendChild(boardCol);

    const boardTitle = document.createElement('div');
    boardTitle.className = 'sc4-board-title';
    boardTitle.textContent = T('scene4.board.title');
    boardCol.appendChild(boardTitle);

    /* Column headers: corner + day columns. */
    const colHeads = document.createElement('div');
    colHeads.className = 'sc4-col-heads';
    colHeads.style.setProperty('--cols', String(COLS));
    let ch = '<div class="sc4-corner-head">' + T('scene4.cornerLabel') + '</div>';
    for (let c = 0; c < COLS; c++) {
      const d = COLS - c;
      ch += '<div class="sc4-col-head">' + T('qtable.dayCol', { d: d }) + '</div>';
    }
    colHeads.innerHTML = ch;
    boardCol.appendChild(colHeads);

    /* The grid: row-label column + COLS cells. */
    const grid = document.createElement('div');
    grid.className = 'sc4-grid';
    grid.style.setProperty('--cols', String(COLS));
    grid.style.setProperty('--rows', String(ROWS));
    boardCol.appendChild(grid);

    /* Left row labels (units). */
    for (let r = 0; r < ROWS; r++) {
      const u = ROWS - r;
      const lab = document.createElement('div');
      lab.className = 'sc4-row-head';
      lab.style.gridColumn = '1';
      lab.style.gridRow = String(r + 1);
      lab.textContent = T('qtable.unitRow', { u: u });
      grid.appendChild(lab);
    }

    /* The 20 policy cells. Each carries a mini shelf-card icon and a lever
       label; the region colour comes from .lever-fill-* on update. */
    const cellNodes = [];   // per stateIndex: { cell, label, u, d }
    for (let s = 0; s < N; s++) {
      const st = P.stateFromIndex(s);
      const r = P.row(st);
      const c = P.col(st);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'sc4-cell';
      cell.style.gridColumn = String(c + 2);
      cell.style.gridRow = String(r + 1);
      cell.dataset.state = String(s);
      cell.dataset.u = String(st.u);
      cell.dataset.d = String(st.d);

      const shelfHost = document.createElement('div');
      shelfHost.className = 'sc4-cell-shelf';
      cell.appendChild(shelfHost);
      window.ShelfCard.mount(shelfHost, { u: st.u, d: st.d, size: 'mini' });

      const label = document.createElement('div');
      label.className = 'sc4-cell-lever';
      cell.appendChild(label);

      grid.appendChild(cell);
      cellNodes[s] = { cell: cell, label: label, u: st.u, d: st.d };
    }

    /* A small read-out under the board that names the lever for a hovered /
       focused cell (reinforces "pi(s) = a lever"). */
    const readout = document.createElement('div');
    readout.className = 'sc4-readout';
    readout.innerHTML = '<span class="sc4-readout-label">' + T('scene4.legend.title') + '</span> <span class="sc4-readout-val" id="sc4-readout-val">&mdash;</span>';
    boardCol.appendChild(readout);
    const readoutVal = readout.querySelector('#sc4-readout-val');

    /* ===== RIGHT: the control panel ===== */
    const panel = document.createElement('div');
    panel.className = 'sc4-panel';
    body.appendChild(panel);

    /* Playbook tabs. */
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
      tab.innerHTML =
        '<span class="sc4-tab-name">' + T(preset.nameKey) + '</span>' +
        '<span class="sc4-tab-sub">' + T(preset.subKey) + '</span>';
      tab.addEventListener('click', function () { selectPreset(i); });
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);

    /* Blurb box describing the active playbook. */
    const blurb = document.createElement('div');
    blurb.className = 'sc4-blurb poke-box';
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

    /* ---------- Painting a policy onto the board ---------- */
    const ALL_FILLS = LEVER_IDS.map(function (id) { return 'lever-fill-' + id; });

    function paint(presetIdx, animate) {
      const preset = PRESETS[presetIdx];
      for (let s = 0; s < N; s++) {
        const node = cellNodes[s];
        const st = P.stateFromIndex(s);
        const leverId = preset.fn(st);
        for (const f of ALL_FILLS) node.cell.classList.remove(f);
        node.cell.classList.add('lever-fill-' + leverId);
        node.cell.dataset.lever = leverId;
        node.label.textContent = shortLabel(leverId);
        if (animate) {
          node.cell.classList.remove('sc4-cell-flip');
          /* Stagger by board position so the repaint reads as a sweep. */
          const delay = (P.row(st) + P.col(st)) * 28;
          (function (cellEl, d) {
            setTimeout(function () {
              cellEl.classList.add('sc4-cell-flip');
              setTimeout(function () { cellEl.classList.remove('sc4-cell-flip'); }, 480);
            }, d);
          })(node.cell, delay);
        }
      }
    }

    function selectPreset(i, opts) {
      opts = opts || {};
      activePreset = i;
      const preset = PRESETS[i];
      /* Tab active states. */
      tabs.querySelectorAll('.sc4-tab').forEach(function (tab, ti) {
        tab.classList.toggle('active', ti === i);
      });
      /* Blurb. */
      blurb.innerHTML =
        '<div class="sc4-blurb-name lever-tag" data-lever="' + dominantLever(preset) + '">' + T(preset.nameKey) + '</div>' +
        '<p class="sc4-blurb-text">' + T(preset.blurbKey) + '</p>';
      paint(i, opts.animate !== false);
      readoutVal.innerHTML = '&mdash;';
      if (!opts.silent && window.SFX) window.SFX.play('cursor');
    }

    /* For the blurb tag colour, pick the lever this playbook leans on. */
    function dominantLever(preset) {
      const counts = {}; for (const id of LEVER_IDS) counts[id] = 0;
      for (let s = 0; s < N; s++) counts[preset.fn(P.stateFromIndex(s))]++;
      let best = 'standard', m = -1;
      for (const id of LEVER_IDS) { if (counts[id] > m) { m = counts[id]; best = id; } }
      return best;
    }

    /* Cell hover / focus updates the read-out (pi(s) = lever). */
    for (let s = 0; s < N; s++) {
      const node = cellNodes[s];
      const show = function () {
        const leverId = node.cell.dataset.lever;
        readoutVal.innerHTML =
          '<span class="lever-tag" data-lever="' + leverId + '">' + T('lever.' + leverId) + '</span> ' +
          '<span class="sc4-readout-state">' + T('scene4.cell.read', { lever: T('lever.' + leverId), u: node.u, d: node.d }) + '</span>';
      };
      node.cell.addEventListener('mouseenter', show);
      node.cell.addEventListener('focus', show);
      node.cell.addEventListener('mouseleave', function () { readoutVal.innerHTML = '&mdash;'; });
    }

    /* Initial paint (no SFX, no per-cell stagger on cold entry). */
    selectPreset(0, { silent: true, animate: false });

    /* &run: cycle to the second playbook so the headless shot shows the
       multi-colour map (richer than the flat amber default). */
    if (window.PRICING_AUTORUN) {
      setTimeout(function () { selectPreset(1, { silent: true, animate: false }); }, 160);
    }

    return {
      onEnter() {
        /* Re-assert the active preset so a return visit repaints cleanly. */
        selectPreset(activePreset, { silent: true, animate: false });
      },
      /* Let the arrow keys flow to the pager (no internal step ladder here). */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();

/* Scene 8: the Bellman optimality equation.
 *
 *   One formula card:  Q*(s, a) = E[ R + max_a' Q*(S', a') ],  read in
 *   business English under it: the value of a lever is the cost you pay now
 *   plus the value of playing optimally from wherever the coin and die land
 *   you next.
 *
 *   Then it is ANIMATED on one cell: AT-RISK, m=2, BIG OFFER (the argmax
 *   there, and a cell whose STAY branch lands on three real next-month
 *   cards, so the recursion is visible rather than collapsing straight to a
 *   renewal). STEP walks four beats:
 *
 *     1. Pay the lever cost.  The margin ledger debits the cost.
 *     2. Flip the RETENTION COIN.  Tails (p=.06) leads to the CHURN terminal.
 *     3. Heads (p=.94) leads to a roll of the ENGAGEMENT DIE; it spreads the
 *        account across next month's cards (lukewarm / at-risk / cliff at
 *        m=1).  At EACH next card we read the best lever's value
 *        max_a' Q*(S',a') = V*(S')  (taken straight from window.DATA.V,
 *        never hand-typed).
 *     4. Combine: the probability-weighted average of every branch IS
 *        Q*(s, a).  Today's best move is defined by tomorrow's best move.
 *
 *   Every probability is window.Churn.successors (the model), every next-
 *   card value is window.DATA.V, and the printed total is asserted against
 *   window.DATA.Qstar at mount.  Nothing on screen is typed by hand.
 *
 *   &run auto-walks all four beats for headless capture.  RIGHT arrow steps.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const C       = window.Churn;
  const DATA    = window.DATA;
  const ACTIONS = window.Moves.MOVE_IDS;           // nothing, checkin, offer
  const A       = ACTIONS.length;                   // 3
  const GAMMA   = (DATA.params && DATA.params.gamma != null) ? DATA.params.gamma : 1;

  /* The teaching cell. */
  const CELL = { tier: 1, m: 2, lever: 'offer' };   // AT-RISK, m=2, BIG OFFER

  function si(tier, m) { return tier * C.NUM_MONTHS + (m - 1); }
  function vStar(s) { return s.terminal ? 0 : DATA.V[si(s.tier, s.m)]; }
  function tierShort(tier) { return T('tier.short.' + (C.TIERS[tier] || 'cliff')); }
  function leverName(id) { return T('lever.' + id); }
  function leverShort(id) { return T('lever.short.' + id); }
  function leverClass(id) { return window.Levers ? window.Levers.tokenClass(id) : ('lever-' + id); }
  function fmt(v) { return (v >= 0 ? '+' : '') + v.toFixed(2); }

  /* Account-card node renderer for the depth-1 backup tree (shared shape
     with scenes 5 / 6). ZERO new icon art: reuses window.AccountCard.
     Terminals get the renewed/churned glyph. */
  function makeRenderNode() {
    return function renderNode(state, ctx) {
      const host = ctx.el;
      if (state && state.terminal) {
        const renewed = !!state.renewed;
        host.parentNode && host.parentNode.classList.add(renewed ? 'renewed' : 'churned');
        host.innerHTML =
          '<div class="tt-leaf-final ' + (renewed ? 'renewed' : 'churned') + '">' +
            '<span class="tt-leaf-glyph">' + (renewed ? '✓' : '✗') + '</span>' +
            '<span class="tt-leaf-word">' +
              T(renewed ? 'terminal.renewed_short' : 'terminal.churned_short') +
            '</span>' +
          '</div>';
        return;
      }
      const cardHost = document.createElement('div');
      cardHost.className = 'tt-account';
      host.appendChild(cardHost);
      window.AccountCard.mount(cardHost, {
        tier: state.tier, m: state.m, size: ctx.role === 'root' ? 'full' : 'mini',
      });
    };
  }

  /* Build the branch list for (tier, m, lever): one CHURN branch plus the
     three STAY/die branches, each carrying the next card's V* and its
     probability-weighted contribution to Q*. */
  function buildBranches() {
    const state = { tier: CELL.tier, m: CELL.m, terminal: false };
    const succ = C.successors(state, CELL.lever);
    const cost = C.costOf(CELL.lever);
    /* successors() merges duplicate destinations; re-derive the die-face
       label per STAY branch by matching the destination tier. */
    const dieMap = {};   // tier -> face label
    const dt = { up: +1, same: 0, down: -1 };
    for (const f of ['up', 'same', 'down']) {
      const tt = Math.max(0, Math.min(C.NUM_TIERS - 1, CELL.tier + dt[f]));
      if (dieMap[tt] === undefined) dieMap[tt] = f;   // first wins (none clamp here)
    }
    const churn = [], stay = [];
    let total = 0;
    for (const x of succ) {
      const vN = vStar(x.sNext);
      const contrib = x.p * (x.reward + GAMMA * vN);
      total += contrib;
      if (x.sNext.terminal) {
        churn.push({ p: x.p, reward: x.reward, vN: 0, contrib,
                     terminal: true, renewed: !!x.sNext.renewed });
      } else {
        stay.push({ p: x.p, reward: x.reward, vN, contrib,
                    tier: x.sNext.tier, m: x.sNext.m,
                    face: dieMap[x.sNext.tier] });
      }
    }
    /* Order STAY branches up, same, down (visual top to bottom). */
    const order = { up: 0, same: 1, down: 2 };
    stay.sort((a, b) => order[a.face] - order[b.face]);
    return { churn, stay, total, cost };
  }

  window.scenes.scene8 = function (root) {
    root.classList.add('scene-pad', 's8-scene');
    root.innerHTML = '';

    const br = buildBranches();

    /* Assert the printed total matches the precomputed oracle. */
    const oracle = DATA.Qstar[si(CELL.tier, CELL.m) * A + ACTIONS.indexOf(CELL.lever)];
    if (Math.abs(br.total - oracle) > 1e-2) {
      console.warn('[scene8] Bellman total', br.total, '!= DATA.Qstar', oracle);
    }

    /*, Heading + manager hook, */
    const h = document.createElement('h2');
    h.className = 's8-heading';
    h.textContent = T('s8.heading');
    root.appendChild(h);

    const hook = document.createElement('div');
    hook.className = 's8-hook';
    hook.textContent = T('s8.hook');
    root.appendChild(hook);

    /*, Bellman formula card, */
    const fcard = document.createElement('div');
    fcard.className = 's8-formula poke-formula';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(DATA.tex.bellman, fhost, true);
    root.appendChild(fcard);

    const gloss = document.createElement('div');
    gloss.className = 's8-gloss';
    gloss.innerHTML =
      '<span class="s8-gloss-term s8-term-cost">' + T('s8.gloss.cost') + '</span>' +
      '<span class="s8-gloss-plus">+</span>' +
      '<span class="s8-gloss-term s8-term-future">' + T('s8.gloss.future') + '</span>';
    root.appendChild(gloss);

    /*, The backup IS the depth-1 trajectory tree ----
       A collapsible card holding a depth-1 TrajTree under the SAME teaching
       cell (AT-RISK, m=2, BIG OFFER) with each non-terminal child
       bootstrapped by V*: G_t = r + V*(s'). Its weighted leaf sum equals
       Q*(AT-RISK/m2, OFFER) = +7.76, exactly the per-branch arithmetic the
       beats below walk. It makes "Bellman backup = the one-ply trajectory
       tree" visible and reuses the same node / edge / ledger components as
       scenes 5 and 6. The bootstrapped leaves render dashed, with the
       +V(s') term shown explicitly. */
    const backup = document.createElement('div');
    backup.className = 's8-backup collapsed';
    backup.innerHTML =
      '<div class="s8-backup-title">' +
        '<span class="s8-backup-caret">&#9654;</span> ' + T('s8.backup.title') +
        '<span class="s8-backup-hint">' + T('s8.backup.hint') + '</span>' +
      '</div>' +
      '<div class="s8-backup-body">' +
        '<div class="s8-backup-lead">' + T('s8.backup.lead') + '</div>' +
        '<div class="s8-backup-host" id="s8-backup-host"></div>' +
        '<div class="s8-backup-tie" id="s8-backup-tie"></div>' +
      '</div>';
    root.appendChild(backup);
    backup.querySelector('.s8-backup-title').addEventListener('click', () => {
      backup.classList.toggle('collapsed');
      const c = backup.querySelector('.s8-backup-caret');
      if (c) c.innerHTML = backup.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
    });
    if (/[#&?](backup|run)\b/.test(window.location.hash)) {
      backup.classList.remove('collapsed');
      const c = backup.querySelector('.s8-backup-caret');
      if (c) c.innerHTML = '&#9660;';
    }

    /* Mount the depth-1 backup tree. V*(s) = DATA.V[si]; the weighted leaf
       sum is asserted in code to equal the precomputed Q* oracle, so the
       picture is honest, never hard-coded. */
    (function mountBackupTree() {
      const host = document.getElementById('s8-backup-host');
      if (!host || !window.TrajTree) return;
      const rootState = { tier: CELL.tier, m: CELL.m, terminal: false };
      const valueFn = (s) => (s && !s.terminal) ? DATA.V[si(s.tier, s.m)] : 0;
      const groundTruth = DATA.Qstar[si(CELL.tier, CELL.m) * A + ACTIONS.indexOf(CELL.lever)];
      const ttb = window.TrajTree.mount(host, {
        engine: {
          successors: C.successors,
          isTerminal: (s) => !!(s && s.terminal),
          stateKey: C.stateKey,
        },
        rootState: rootState,
        rootAction: CELL.lever,
        maxDepth: 1, gamma: GAMMA,
        valueFn: valueFn,
        bootstrapFrontier: true,
        renderNode: makeRenderNode(),
        actionLabel: (leverId) => leverName(leverId),
        layout: 'v',
        sfx: window.SFX || null,
        assertValue: groundTruth,
        assertTol: 1e-5,
      });
      const tie = document.getElementById('s8-backup-tie');
      if (tie) {
        tie.innerHTML = T('s8.backup.tie', {
          eg: window.TrajTree._fmt.fmtSigned2(ttb.getEG()),
          state: tierShort(CELL.tier) + ' · ' + T('months.short', { n: CELL.m }),
          lever: leverName(CELL.lever),
        });
      }
    })();

    /*, Controls, */
    const ctrls = document.createElement('div');
    ctrls.className = 's8-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s8-step">' + T('s8.btn.step') + '</button>' +
      '<button class="poke-btn" id="s8-reset">' + T('s8.btn.reset') + '</button>' +
      '<div class="s8-stepcount">' + T('s8.beat') + ' <b id="s8-beat">0 / 4</b></div>';
    root.appendChild(ctrls);

    /*, The worked cell: a left "today" column + a right "branches"
       tree, with a narration strip below., */
    const stage = document.createElement('div');
    stage.className = 's8-stage';
    root.appendChild(stage);

    /* TODAY column. */
    const today = document.createElement('div');
    today.className = 's8-today';
    today.innerHTML =
      '<div class="s8-col-head">' + T('s8.today') + '</div>';
    const todayCardHost = document.createElement('div');
    todayCardHost.className = 's8-today-card';
    today.appendChild(todayCardHost);
    window.AccountCard.mount(todayCardHost, { tier: CELL.tier, m: CELL.m, size: 'full' });

    const leverChip = document.createElement('div');
    leverChip.className = 's8-lever-chip ' + leverClass(CELL.lever);
    leverChip.innerHTML =
      '<span class="s8-lever-glyph">' + (window.Levers ? window.Levers.leverIconSvg(CELL.lever) : '') + '</span>' +
      '<span class="s8-lever-name">' + leverName(CELL.lever) + '</span>' +
      '<span class="s8-lever-cost">' + (br.cost === 0 ? T('s8.free') : ('−' + br.cost)) + '</span>';
    today.appendChild(leverChip);

    /* Mini margin ledger under the today card: the cost debit. */
    const ledger = document.createElement('div');
    ledger.className = 's8-ledger margin-ledger';
    ledger.innerHTML =
      '<div class="margin-ledger-title">' + T('ledger.title') + '</div>' +
      '<div class="ledger-rows" id="s8-ledger-rows"></div>';
    today.appendChild(ledger);
    stage.appendChild(today);

    /* ARROW glyph between today and the branches. */
    const arrow = document.createElement('div');
    arrow.className = 's8-flow-arrow';
    arrow.textContent = '→';
    stage.appendChild(arrow);

    /* BRANCHES column: a coin node, then the churn leaf + the stay subtree. */
    const branches = document.createElement('div');
    branches.className = 's8-branches';
    branches.innerHTML = '<div class="s8-col-head">' + T('s8.next') + '</div>';

    /* Coin row. */
    const coinRow = document.createElement('div');
    coinRow.className = 's8-coin-row';
    const coinHost = document.createElement('div');
    coinHost.className = 's8-coin';
    coinRow.appendChild(coinHost);
    const coinLabel = document.createElement('div');
    coinLabel.className = 's8-coin-label';
    coinLabel.textContent = T('s8.coin.prompt');
    coinRow.appendChild(coinLabel);
    branches.appendChild(coinRow);
    const coin = window.Coin.mount(coinHost, {});

    /* CHURN leaf. */
    const churnLeaf = document.createElement('div');
    churnLeaf.className = 's8-churn-leaf s8-branch-hidden';
    const cb = br.churn[0];
    churnLeaf.innerHTML =
      '<span class="s8-branch-prob">p ' + cb.p.toFixed(2) + '</span>' +
      '<span class="s8-churn-pill">' + T('terminal.churned') + '</span>' +
      '<span class="s8-branch-term s8-term-neg">' + T('terminal.churn_lump') + '</span>' +
      '<span class="s8-branch-contrib">' + fmt(cb.contrib) + '</span>';
    branches.appendChild(churnLeaf);

    /* STAY subtree: a "die" header row + one mini card per next-month state. */
    const stayWrap = document.createElement('div');
    stayWrap.className = 's8-stay-wrap s8-branch-hidden';
    const stayHead = document.createElement('div');
    stayHead.className = 's8-stay-head';
    stayHead.innerHTML =
      '<span class="s8-branch-prob">p ' + br.stay.reduce((a, b) => a + b.p, 0).toFixed(2) + '</span>' +
      '<span class="s8-die-host" id="s8-die"></span>' +
      '<span class="s8-stay-cap">' + T('s8.stay.prompt') + '</span>';
    stayWrap.appendChild(stayHead);
    const die = window.D6.mount(stayHead.querySelector('#s8-die'), {});

    const stayCards = document.createElement('div');
    stayCards.className = 's8-stay-cards';
    const stayNodes = [];
    for (const s of br.stay) {
      const leaf = document.createElement('div');
      leaf.className = 's8-stay-leaf s8-leaf-pending';
      const ch = document.createElement('div');
      ch.className = 's8-stay-card';
      leaf.appendChild(ch);
      window.AccountCard.mount(ch, { tier: s.tier, m: s.m, size: 'mini' });
      const meta = document.createElement('div');
      meta.className = 's8-stay-meta';
      meta.innerHTML =
        '<span class="s8-leaf-prob">p ' + s.p.toFixed(2) + '</span>' +
        '<span class="s8-vstar">' + T('s8.vstar') +
          ' <b>' + fmt(s.vN) + '</b></span>';
      leaf.appendChild(meta);
      stayCards.appendChild(leaf);
      stayNodes.push({ leaf, branch: s });
    }
    stayWrap.appendChild(stayCards);
    branches.appendChild(stayWrap);

    /* Q* total bar. */
    const totalBar = document.createElement('div');
    totalBar.className = 's8-total s8-branch-hidden ' + leverClass(CELL.lever);
    totalBar.innerHTML =
      '<span class="s8-total-label">' +
        T('s8.total', { state: tierShort(CELL.tier) + ' / ' + T('months.short', { n: CELL.m }),
                        lever: leverShort(CELL.lever) }) +
      '</span>' +
      '<span class="s8-total-val">' + fmt(br.total) + '</span>';
    branches.appendChild(totalBar);

    stage.appendChild(branches);

    /* Narration strip. */
    const note = document.createElement('div');
    note.className = 's8-note poke-box tight';
    root.appendChild(note);

    /*, Beat machine, */
    const NOTES = [
      T('s8.note.ready'),
      T('s8.note.cost'),
      T('s8.note.coin'),
      T('s8.note.die'),
      T('s8.note.combine'),
    ];
    let beat = 0;
    const beatEl = ctrls.querySelector('#s8-beat');
    const ledgerRows = ledger.querySelector('#s8-ledger-rows');

    function setNote(i) { note.innerHTML = NOTES[i] + '<span class="triangle"></span>'; }
    function reduced() {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function applyBeat() {
      beatEl.textContent = beat + ' / 4';
      setNote(beat);

      /* Beat 1: pay the cost (ledger debit + chip pulse). */
      leverChip.classList.toggle('s8-chip-active', beat >= 1);
      if (beat >= 1) {
        if (!ledgerRows.dataset.paid) {
          const row = document.createElement('div');
          row.className = 'ledger-row debit';
          row.innerHTML =
            '<span>' + leverName(CELL.lever) + '</span>' +
            '<span class="ledger-amt">' + (br.cost === 0 ? '0' : ('−' + br.cost)) + '</span>';
          ledgerRows.appendChild(row);
          ledgerRows.dataset.paid = '1';
        }
      } else {
        ledgerRows.innerHTML = '';
        delete ledgerRows.dataset.paid;
      }

      /* Beat 2: coin resolves; CHURN leaf appears. */
      if (beat >= 2) {
        churnLeaf.classList.remove('s8-branch-hidden');
        if (beat === 2) coin.set('churn');     /* show the tails leaf first */
        else coin.set('stay');
      } else {
        churnLeaf.classList.add('s8-branch-hidden');
        coin.set('stay');
      }

      /* Beat 3: STAY subtree + die spread; reveal each next card's V*. */
      if (beat >= 3) {
        stayWrap.classList.remove('s8-branch-hidden');
        die.set('same');
        for (const n of stayNodes) n.leaf.classList.remove('s8-leaf-pending');
      } else {
        stayWrap.classList.add('s8-branch-hidden');
        for (const n of stayNodes) n.leaf.classList.add('s8-leaf-pending');
      }

      /* Beat 4: the weighted total = Q*. */
      totalBar.classList.toggle('s8-branch-hidden', beat < 4);
      gloss.classList.toggle('s8-gloss-lit', beat >= 4);
    }

    function step() {
      if (beat >= 4) return;
      beat++;
      applyBeat();
      /* Light animation on the freshly revealed beat (skipped in reduced
         motion / headless). */
      if (!reduced()) {
        if (beat === 2) coin.flip(false);                /* show the churn flip */
        else if (beat === 3) die.roll('same', null, CELL.tier);
      }
    }
    function reset() { beat = 0; applyBeat(); }

    ctrls.querySelector('#s8-step').addEventListener('click', step);
    ctrls.querySelector('#s8-reset').addEventListener('click', reset);

    reset();

    /* &run: auto-walk all four beats for headless capture. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      let i = 0;
      (function adv() {
        if (i >= 4) return;
        i++; beat = i; applyBeat();
        setTimeout(adv, 120);
      })();
    }

    return {
      onEnter() { applyBeat(); },
      onNextKey() { if (beat < 4) { step(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();

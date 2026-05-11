/* Per-square renderers for the Snakes & Ladders Q-table.
 *
 *   The literal 100-row × 3-col Q-table doesn't fit on a side panel, so the
 *   pedagogy is split:
 *     (a) on-board: per-square argmax-die badge (the policy view).
 *     (b) on-click: horizontal-bar panel for the clicked square's three Q-values.
 *
 *   This module owns rendering of both. Scenes 3 and 4 reuse it.
 */
(function () {
  const ACTIONS = (window.Dice && window.Dice.DIE_IDS) || ['d4', 'd6', 'd8'];

  /* Render the argmax-die badge for a single square onto the board. The badge
     is a small two-character token ("d4" / "d6" / "d8") in the die's accent
     color, set as innerHTML on board.setCellBadge. */
  /* `policy` may be an array (indexed by s-1, length 99) or a map (keyed by s).
     This handles both. */
  function policyAt(policy, s) {
    if (Array.isArray(policy)) return policy[s - 1];
    return policy[s];
  }
  function renderBadgesFromPolicy(board, policy) {
    board.clearBadges();
    for (let s = 1; s <= 99; s++) {
      const d = policyAt(policy, s);
      if (!d) continue;
      const html = `<span class="die-pill die-${d}">${d}</span>`;
      board.setCellBadge(s, html);
    }
  }

  /* Render argmax-die badges from a Q-table (Float32Array). Used by scene 4. */
  function renderBadgesFromQ(board, Q) {
    board.clearBadges();
    for (let s = 1; s <= 99; s++) {
      const r = window.SARSA.row(Q, s);
      let best = -Infinity, bestDie = 'd6';
      let allZero = true;
      for (const d of ACTIONS) {
        if (r[d] !== 0) allZero = false;
        if (r[d] > best) { best = r[d]; bestDie = d; }
      }
      /* If the row is uninformative (all zero or all tied), don't show a
         misleading badge. */
      if (allZero) continue;
      const html = `<span class="die-pill die-${bestDie}">${bestDie}</span>`;
      board.setCellBadge(s, html);
    }
  }

  /* Mount a Q-bar panel into `host`. The panel displays three horizontal
     bars (one per die) for a single square. Re-renderable via `update(s, Q)`.
     If `Q` is a per-square row object (`{d4, d6, d8}`), it's used directly;
     if it's a Float32Array, we look up SARSA.row(Q, s). */
  function mountQBars(host) {
    host.innerHTML = '';
    host.classList.add('qbar-panel');

    const title = document.createElement('div');
    title.className = 'qbar-title';
    title.textContent = 'select a square';
    host.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'qbar-sub';
    sub.textContent = '';
    host.appendChild(sub);

    const barsHost = document.createElement('div');
    barsHost.className = 'qbar-bars';
    host.appendChild(barsHost);

    const rows = {};
    for (const d of ACTIONS) {
      const r = document.createElement('div');
      r.className = 'qbar-row';
      r.innerHTML =
        `<div class="qbar-die die-${d}"><span class="die-pill die-${d}">${d}</span></div>` +
        `<div class="qbar-track"><div class="qbar-fill die-${d}"></div></div>` +
        `<div class="qbar-val">—</div>`;
      barsHost.appendChild(r);
      rows[d] = {
        node: r,
        fill: r.querySelector('.qbar-fill'),
        val: r.querySelector('.qbar-val'),
      };
    }

    function clear() {
      title.textContent = 'select a square';
      sub.textContent = '';
      for (const d of ACTIONS) {
        rows[d].fill.style.width = '0%';
        rows[d].fill.classList.remove('negative');
        rows[d].val.textContent = '—';
        rows[d].node.classList.remove('argmax');
      }
    }

    /* Update for square s using Q (Float32Array) or qRow ({d4, d6, d8}). */
    function update(s, source) {
      const r = (source && typeof source === 'object' && !ArrayBuffer.isView(source))
        ? source
        : window.SARSA.row(source, s);
      title.textContent = `square ${s}`;
      const jump = window.MDP && window.MDP.JUMPS && window.MDP.JUMPS[s];
      if (jump != null && jump !== s) {
        const dir = jump > s ? 'ladder ↗ ' + jump : 'snake ↘ ' + jump;
        sub.textContent = dir;
      } else {
        sub.textContent = '';
      }
      /* Scale: use absolute max of the three values to set bar width.
         Negative values render in the entity-anymal color (signalling cost). */
      let absMax = 0;
      for (const d of ACTIONS) absMax = Math.max(absMax, Math.abs(r[d]));
      if (absMax < 1e-6) absMax = 1;
      let argmaxDie = 'd6', best = -Infinity;
      for (const d of ACTIONS) if (r[d] > best) { best = r[d]; argmaxDie = d; }
      let allZero = true;
      for (const d of ACTIONS) if (Math.abs(r[d]) > 1e-9) allZero = false;
      for (const d of ACTIONS) {
        const v = r[d];
        const w = Math.min(100, (Math.abs(v) / absMax) * 100);
        rows[d].fill.style.width = w.toFixed(1) + '%';
        rows[d].fill.classList.toggle('negative', v < 0);
        rows[d].val.textContent = v.toFixed(2);
        rows[d].node.classList.toggle('argmax', d === argmaxDie && !allZero);
      }
    }

    clear();
    return { update, clear, host };
  }

  /* Count how many squares prefer each die under `policy` (array OR map). */
  function policyMix(policy) {
    const c = { d4: 0, d6: 0, d8: 0 };
    for (let s = 1; s <= 99; s++) {
      const d = policyAt(policy, s);
      if (c.hasOwnProperty(d)) c[d]++;
    }
    return c;
  }

  /* A one-line caption that summarises the die mix. */
  function policyMixCaption(policy) {
    const c = policyMix(policy);
    return Object.keys(c).map(d => `${d}: ${c[d]}`).join(' · ');
  }

  window.QTable = {
    renderBadgesFromPolicy,
    renderBadgesFromQ,
    mountQBars,
    policyMix,
    policyMixCaption,
    policyAt,
  };
})();

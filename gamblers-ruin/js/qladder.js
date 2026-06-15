/* qladder.js, the vertical CASH LADDER widget for Gambler's Ruin.
 *
 *   The recurring state-icon AND the whole Q-table, one object. Eleven rungs
 *   stacked from $0 (RUIN, dark slab) at the BOTTOM to $10 (GOAL, gold plate)
 *   at the TOP, with a bright token on the rung = current capital. Widened, the
 *   same ladder becomes the Q-table: each of the 9 interior rungs shows its
 *   three stake Q-values, the argmax starred, and the rung tinted by the
 *   winning stake's colour, so the optimal policy reads as a COLUMN OF COLOURS
 *   that zig-zags (the visual punchline).
 *
 *   mount(host, opts) -> handle {
 *     update(Q, opts)            // paint Q values + argmax star + stake-region tint
 *     reset()                    // clear all Q values (rungs go 'unsolved')
 *     setToken(cap | null)       // place / move the bright token to a rung
 *     pulseToken()               // brief emphasis on the token rung
 *     flashTerminal(which)       // 'goal' | 'ruin' burst on the caps
 *     setRungSolved(cap, bool)   // dim un-filled rungs (DP fill)
 *     highlightRung(cap, bool)   // outline a rung (just-locked / inspected)
 *     getRungNode(cap)           // the rung element for capital c (1..9)
 *     setOnRungClick(cb)         // make interior rungs clickable -> cb(cap, el)
 *     host
 *   }
 *     opts.variant: 'icon'  -> compact, no Q rows (just the token ladder)
 *                   'qtable'-> full width, three stake rows per interior rung
 *     opts.showValues: also print V*(rung) beside each rung (qtable variant)
 *
 *   Q is indexed Q[stateIndex * A + stakeIdx], stateIndex = capital - 1,
 *   stakeIdx in the order window.Stakes.STAKE_IDS = [bet1,bet2,bet3] (the same
 *   order window.Bellman.qFromV / window.DATA.Qstar use). A clamped stake holds
 *   null / minus Infinity and renders disabled. Theme-agnostic: every colour
 *   comes from CSS tokens. Styles live in css/qladder.css. */
(function () {
  const G = window.Gambler;
  const STAKE_IDS = window.Stakes.STAKE_IDS;       // [bet1, bet2, bet3]
  const A = STAKE_IDS.length;                        // 3
  const GOAL = G.GOAL;                               // 10
  const N = G.N;                                     // 9
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const EMPTY = '·';                            // middle dot placeholder

  function betLabel(id) { return T('stake.' + id); }            // "BET $1"
  function betShort(id) { return '$' + window.Stakes.betOf(id); } // "$1"

  function mount(host, opts) {
    const o = opts || {};
    const variant = o.variant || 'icon';
    const showValues = !!o.showValues;
    host.classList.add('qladder', 'qladder-' + variant);
    host.innerHTML = '';

    const ladder = document.createElement('div');
    ladder.className = 'ql-ladder';
    host.appendChild(ladder);

    /* GOAL cap (top). */
    const goalCap = document.createElement('div');
    goalCap.className = 'ql-cap ql-goal';
    goalCap.innerHTML = '<span class="ql-cap-label">' + T('ladder.goal') + '</span>';
    ladder.appendChild(goalCap);

    /* Interior rungs, $9 (top) down to $1 (bottom). */
    const rungNodes = {};     // capital -> { rung, token, rows:[{row,mark,val}], vval }
    for (let cap = N; cap >= 1; cap--) {
      const rung = document.createElement('div');
      rung.className = 'ql-rung';
      rung.dataset.cap = String(cap);

      const left = document.createElement('div');
      left.className = 'ql-rung-left';
      left.innerHTML =
        '<span class="ql-rung-amt">$' + cap + '</span>' +
        '<span class="ql-token" hidden></span>';
      rung.appendChild(left);

      if (variant === 'qtable') {
        const rows = document.createElement('div');
        rows.className = 'ql-rows';
        const rowNodes = [];
        const legal = G.availableStakeIds(cap);
        for (let a = 0; a < A; a++) {
          const id = STAKE_IDS[a];
          const isLegal = legal.includes(id);
          const r = document.createElement('div');
          r.className = 'ql-row stake-' + id + (isLegal ? '' : ' clamped');
          r.dataset.stake = id;
          r.innerHTML =
            '<span class="ql-mark"></span>' +
            '<span class="ql-swatch stake-fill-' + id + '"></span>' +
            '<span class="ql-row-label">' + betShort(id) + '</span>' +
            '<span class="ql-val">' + (isLegal ? EMPTY : EMPTY) + '</span>';
          rows.appendChild(r);
          rowNodes[a] = { row: r, mark: r.querySelector('.ql-mark'), val: r.querySelector('.ql-val'), legal: isLegal };
        }
        rung.appendChild(rows);
        rungNodes[cap] = { rung, token: left.querySelector('.ql-token'), rows: rowNodes };

        if (showValues) {
          const vbox = document.createElement('div');
          vbox.className = 'ql-vstar';
          vbox.innerHTML = '<span class="ql-vstar-lab">V*</span><span class="ql-vstar-val">' + EMPTY + '</span>';
          rung.appendChild(vbox);
          rungNodes[cap].vval = vbox.querySelector('.ql-vstar-val');
        }
      } else {
        rungNodes[cap] = { rung, token: left.querySelector('.ql-token'), rows: null };
      }
      ladder.appendChild(rung);
    }

    /* RUIN cap (bottom). */
    const ruinCap = document.createElement('div');
    ruinCap.className = 'ql-cap ql-ruin';
    ruinCap.innerHTML = '<span class="ql-cap-label">' + T('ladder.ruin') + '</span>';
    ladder.appendChild(ruinCap);

    /* Optional legend (qtable variant). */
    if (variant === 'qtable' && o.legend !== false) {
      const legend = document.createElement('div');
      legend.className = 'ql-legend';
      legend.innerHTML =
        STAKE_IDS.map(id =>
          '<span class="ql-legend-item"><span class="ql-legend-swatch stake-fill-' + id + '"></span>' +
          betLabel(id) + '</span>').join('') +
        '<span class="ql-legend-item">' + '★' + ' = ' + T('ladder.bestStake') + '</span>';
      host.appendChild(legend);
    }

    const ALL_TINTS = STAKE_IDS.map(id => 'tint-' + id);
    const STAR = '★';
    let prevQ = null;
    let curToken = null;

    function clearRow(node) {
      if (node.rows) {
        for (let a = 0; a < A; a++) {
          node.rows[a].mark.textContent = '';
          node.rows[a].row.classList.remove('argmax');
          node.rows[a].val.textContent = EMPTY;
        }
      }
      for (const t of ALL_TINTS) node.rung.classList.remove(t);
      node.rung.classList.add('unsolved');
      if (node.vval) node.vval.textContent = EMPTY;
    }

    function update(Q, opt) {
      if (variant !== 'qtable') return;
      const oo = opt || {};
      for (let cap = 1; cap <= N; cap++) {
        const node = rungNodes[cap];
        const base = (cap - 1) * A;
        let best = -Infinity, k = -1, allZero = true;
        for (let a = 0; a < A; a++) {
          const v = Q[base + a];
          if (v == null || !isFinite(v)) continue;           // clamped
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > best) { best = v; k = a; }
        }
        for (const t of ALL_TINTS) node.rung.classList.remove(t);
        if (allZero || k < 0) {
          node.rung.classList.add('unsolved');
          for (let a = 0; a < A; a++) {
            if (!node.rows[a].legal) continue;
            node.rows[a].val.textContent = EMPTY;
            node.rows[a].row.classList.remove('argmax');
            node.rows[a].mark.textContent = '';
          }
          if (node.vval) node.vval.textContent = EMPTY;
        } else {
          node.rung.classList.remove('unsolved');
          node.rung.classList.add('tint-' + STAKE_IDS[k]);
          for (let a = 0; a < A; a++) {
            if (!node.rows[a].legal) continue;
            const v = Q[base + a];
            node.rows[a].val.textContent = (v == null || !isFinite(v)) ? EMPTY : v.toFixed(3);
            const isArg = a === k;
            node.rows[a].row.classList.toggle('argmax', isArg);
            node.rows[a].mark.textContent = isArg ? STAR : '';
          }
          if (node.vval) node.vval.textContent = best.toFixed(3);

          /* argmax-flip flash (skipped on first paint / when suppressed). */
          if (prevQ && !oo.suppressFlash) {
            let pBest = -Infinity, pk = -1;
            for (let a = 0; a < A; a++) {
              const pv = prevQ[base + a];
              if (pv == null || !isFinite(pv)) continue;
              if (pv > pBest) { pBest = pv; pk = a; }
            }
            if (pk >= 0 && pk !== k) {
              node.rung.classList.remove('rung-flip');
              void node.rung.offsetWidth;
              node.rung.classList.add('rung-flip');
              setTimeout(() => node.rung.classList.remove('rung-flip'), 900);
            }
          }
        }
      }
      prevQ = Array.from(Q, v => (v == null ? null : v));
    }

    function reset() {
      prevQ = null;
      for (let cap = 1; cap <= N; cap++) clearRow(rungNodes[cap]);
    }

    function setToken(cap) {
      if (curToken != null && rungNodes[curToken]) {
        rungNodes[curToken].token.hidden = true;
        rungNodes[curToken].rung.classList.remove('has-token');
      }
      host.classList.remove('token-goal', 'token-ruin');
      curToken = cap;
      if (cap == null) return;
      if (cap >= GOAL) { host.classList.add('token-goal'); return; }
      if (cap <= 0)    { host.classList.add('token-ruin'); return; }
      const node = rungNodes[cap];
      if (node) { node.token.hidden = false; node.rung.classList.add('has-token'); }
    }
    function pulseToken() {
      if (curToken == null || !rungNodes[curToken]) return;
      const el = rungNodes[curToken].rung;
      el.classList.remove('token-pulse'); void el.offsetWidth; el.classList.add('token-pulse');
      setTimeout(() => el.classList.remove('token-pulse'), 700);
    }
    function flashTerminal(which) {
      const cap = which === 'goal' ? goalCap : ruinCap;
      cap.classList.remove('cap-flash'); void cap.offsetWidth; cap.classList.add('cap-flash');
      setTimeout(() => cap.classList.remove('cap-flash'), 1100);
    }
    function setRungSolved(cap, solved) {
      const node = rungNodes[cap];
      if (node) node.rung.classList.toggle('pending', !solved);
    }
    function highlightRung(cap, on) {
      const node = rungNodes[cap];
      if (node) node.rung.classList.toggle('just-locked', !!on);
    }
    function getRungNode(cap) { return rungNodes[cap] ? rungNodes[cap].rung : null; }

    /* Paint a POLICY directly (no Q values): betsByCapital maps capital -> bet
       size (1/2/3), the chosen stake. Tints the rung by that stake and stars
       its row. Used by the Policy scene. animate staggers a flip per rung. */
    function paintPolicy(betsByCapital, opt) {
      if (variant !== 'qtable') return;
      const oo = opt || {};
      for (let cap = 1; cap <= N; cap++) {
        const node = rungNodes[cap];
        const bet = betsByCapital[cap];
        const id = window.Stakes.idForBet(bet);
        for (const t of ALL_TINTS) node.rung.classList.remove(t);
        node.rung.classList.remove('unsolved');
        if (!id) continue;
        node.rung.classList.add('tint-' + id);
        for (let a = 0; a < A; a++) {
          if (!node.rows[a].legal) continue;
          const isPick = STAKE_IDS[a] === id;
          node.rows[a].row.classList.toggle('argmax', isPick);
          node.rows[a].mark.textContent = isPick ? STAR : '';
          node.rows[a].val.textContent = isPick ? 'play' : EMPTY;
        }
        if (node.vval) node.vval.textContent = EMPTY;
        if (oo.animate) {
          const d = (N - cap) * 45;
          (function (el, delay) {
            setTimeout(() => {
              el.classList.remove('rung-flip'); void el.offsetWidth; el.classList.add('rung-flip');
              setTimeout(() => el.classList.remove('rung-flip'), 800);
            }, delay);
          })(node.rung, d);
        }
      }
    }

    let rungClickCb = null;
    for (let cap = 1; cap <= N; cap++) {
      (function (c) {
        rungNodes[c].rung.addEventListener('click', () => { if (rungClickCb) rungClickCb(c, rungNodes[c].rung); });
      })(cap);
    }
    function setOnRungClick(cb) {
      rungClickCb = cb;
      for (let cap = 1; cap <= N; cap++) rungNodes[cap].rung.classList.toggle('clickable', !!cb);
    }

    if (variant === 'qtable') reset();
    return {
      update, reset, setToken, pulseToken, flashTerminal,
      setRungSolved, highlightRung, getRungNode, setOnRungClick, paintPolicy, host,
    };
  }

  /* Standalone argmax-count helper (mirrors the engine's stake ordering;
     skips clamped/null cells). */
  function stakeCounts(Q) {
    const c = {};
    for (const id of STAKE_IDS) c[id] = 0;
    for (let cap = 1; cap <= N; cap++) {
      const base = (cap - 1) * A;
      let m = -Infinity, k = -1;
      for (let a = 0; a < A; a++) {
        const v = Q[base + a];
        if (v == null || !isFinite(v)) continue;
        if (v > m) { m = v; k = a; }
      }
      if (k >= 0) c[STAKE_IDS[k]]++;
    }
    return c;
  }

  window.QLadder = { mount, stakeCounts, betLabel, betShort };
})();

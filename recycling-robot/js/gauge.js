/* gauge.js -- the ROBOT + 5-SEGMENT BATTERY GAUGE widget for the Recycling Robot.
 *
 *   The recurring state-icon AND the whole Q-table, one object. A little robot
 *   sits beside a vertical 5-segment gauge lit from the bottom; the same
 *   robot-plus-gauge appears in every scene so the learner builds one mental
 *   picture (how much charge is in the tank right now). Widened, it becomes the
 *   single-column Q-table: one row per PLAYABLE rung (full at top .. low at
 *   bottom), three lever cells per row, the argmax starred and the rung tinted
 *   by the winning lever, so the optimal policy reads as a clean stripe down the
 *   gauge: green SEARCH at the top, blue RECHARGE at the bottom.
 *
 *   mount(host, opts) -> handle {
 *     update(Q, opts)            // paint Q values + argmax star + lever-region tint
 *     reset()                    // clear all Q values (rungs go 'unsolved')
 *     setLevel(lv | null)        // light the gauge to battery level lv (0..4) + pose the robot
 *     pulse()                    // brief emphasis on the current rung
 *     drainTo(lv, {spark})       // animate the gauge dropping to lv (spark pips)
 *     strand()                   // power-down + grey + SOS the robot (the -10)
 *     dockRefill()               // refill pips bottom-to-top (RECHARGE)
 *     setRungSolved(lv, bool)    // dim un-filled rungs (DP fill)
 *     highlightRung(lv, bool)    // outline a rung (just-locked / inspected)
 *     getRungNode(lv)            // the rung element for level lv (1..4)
 *     setOnRungClick(cb)         // make interior rungs clickable -> cb(lv, el)
 *     paintPolicy(byLevel, opt)  // paint a policy (level -> leverId) directly, no Q
 *     host
 *   }
 *     opts.variant: 'icon'   -> compact robot + gauge (just the lit pips)
 *                   'qtable' -> full width, three lever rows per rung
 *     opts.showValues: also print V*(rung) beside each rung (qtable variant)
 *
 *   Q is indexed Q[stateIndex * A + leverIdx], stateIndex = battery level - 1
 *   (low=0..full=3), leverIdx in window.Levers.LEVER_IDS = [search,wait,
 *   recharge] (the order window.DATA.Qstar uses). Theme-agnostic: colours come
 *   from CSS tokens. Styles live in css/gauge.css. */
(function () {
  const R = window.Robot;
  const LEVER_IDS = window.Levers.LEVER_IDS;        // [search, wait, recharge]
  const A = LEVER_IDS.length;                         // 3
  const N = R.N;                                      // 4 playable rungs
  const FULL = R.FULL;                                // 4
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const EMPTY = '·';

  function leverLabel(id) { return T('lever.' + id); }     // "SEARCH"
  function leverShort(id) { return T('lever.' + id); }

  /* A small pixel robot built from divs (no image asset). Pose reflects level:
     full = upright/bright, mid = neutral, low = leaning, empty = slumped + SOS. */
  function robotMarkup() {
    return (
      '<div class="rr-robot" aria-hidden="true">' +
        '<div class="rr-bot-sos">SOS</div>' +
        '<div class="rr-bot-head"><span class="rr-eye l"></span><span class="rr-eye r"></span></div>' +
        '<div class="rr-bot-body"></div>' +
        '<div class="rr-bot-tread"></div>' +
      '</div>'
    );
  }

  /* The vertical 5-segment gauge: 4 lit-able pips (low..full) over a base. */
  function gaugeMarkup() {
    let pips = '';
    for (let lv = FULL; lv >= 1; lv--) {
      pips += '<div class="rr-pip" data-pip="' + lv + '"></div>';
    }
    return (
      '<div class="rr-gauge-tube">' +
        '<div class="rr-gauge-pips">' + pips + '</div>' +
        '<div class="rr-gauge-base"></div>' +
      '</div>'
    );
  }

  function mount(host, opts) {
    const o = opts || {};
    const variant = o.variant || 'icon';
    const showValues = !!o.showValues;
    host.classList.add('rr-gauge', 'rr-gauge-' + variant);
    host.innerHTML = '';

    if (variant === 'icon') {
      /* Compact: robot beside a vertical gauge. */
      const icon = document.createElement('div');
      icon.className = 'rr-icon';
      icon.innerHTML = robotMarkup() + gaugeMarkup() +
        '<div class="rr-icon-label" hidden></div>';
      host.appendChild(icon);
      const handle = makeIconHandle(host, icon);
      handle.setLevel(o.level != null ? o.level : FULL);
      return handle;
    }

    /* qtable: a panel header (robot + gauge) over the single-column Q-table. */
    const panel = document.createElement('div');
    panel.className = 'rr-panel';

    const head = document.createElement('div');
    head.className = 'rr-panel-head';
    head.innerHTML =
      '<div class="rr-icon rr-icon-mini">' + robotMarkup() + gaugeMarkup() + '</div>' +
      '<div class="rr-panel-title">' + T('gauge.title') + '</div>';
    panel.appendChild(head);

    const table = document.createElement('div');
    table.className = 'rr-table';
    panel.appendChild(table);

    /* FULL cap (top) -> low (bottom). */
    const rungNodes = {};   // level -> { rung, rows:[{row,mark,val,legal}], vval }
    for (let lv = FULL; lv >= 1; lv--) {
      const rung = document.createElement('div');
      rung.className = 'rr-rung';
      rung.dataset.lv = String(lv);

      const left = document.createElement('div');
      left.className = 'rr-rung-left';
      left.innerHTML =
        '<span class="rr-rung-name">' + T('level.' + R.LEVEL_NAMES[lv]) + '</span>' +
        '<span class="rr-rung-mini-gauge">' + miniGauge(lv) + '</span>';
      rung.appendChild(left);

      const rows = document.createElement('div');
      rows.className = 'rr-rows';
      const rowNodes = [];
      for (let a = 0; a < A; a++) {
        const id = LEVER_IDS[a];
        const r = document.createElement('div');
        r.className = 'rr-row lever-' + id;
        r.dataset.lever = id;
        r.innerHTML =
          '<span class="rr-mark"></span>' +
          '<span class="rr-swatch lever-fill-' + id + '"></span>' +
          '<span class="rr-row-label">' + leverShort(id) + '</span>' +
          '<span class="rr-val">' + EMPTY + '</span>';
        rows.appendChild(r);
        rowNodes[a] = { row: r, mark: r.querySelector('.rr-mark'), val: r.querySelector('.rr-val'), legal: true };
      }
      rung.appendChild(rows);
      rungNodes[lv] = { rung, rows: rowNodes };

      if (showValues) {
        const vbox = document.createElement('div');
        vbox.className = 'rr-vstar';
        vbox.innerHTML = '<span class="rr-vstar-lab">V*</span><span class="rr-vstar-val">' + EMPTY + '</span>';
        rung.appendChild(vbox);
        rungNodes[lv].vval = vbox.querySelector('.rr-vstar-val');
      }
      table.appendChild(rung);
    }

    /* STRANDED strip (bottom). */
    const strand = document.createElement('div');
    strand.className = 'rr-strand-strip';
    strand.innerHTML = '<span>' + T('gauge.stranded') + '</span>';
    table.appendChild(strand);

    host.appendChild(panel);

    /* Optional legend. */
    if (o.legend !== false) {
      const legend = document.createElement('div');
      legend.className = 'rr-legend';
      legend.innerHTML =
        LEVER_IDS.map(id =>
          '<span class="rr-legend-item"><span class="rr-legend-swatch lever-fill-' + id + '"></span>' +
          leverLabel(id) + '</span>').join('') +
        '<span class="rr-legend-item">★ = ' + T('gauge.bestLever') + '</span>';
      host.appendChild(legend);
    }

    return makeTableHandle(host, panel, rungNodes, showValues);
  }

  /* A tiny inline gauge (4 pips) used in each Q-table row's left cell. */
  function miniGauge(lv) {
    let s = '';
    for (let i = FULL; i >= 1; i--) s += '<i class="rr-mini-pip' + (i <= lv ? ' on lvl' + lv : '') + '"></i>';
    return s;
  }

  /* ---- icon-variant handle (just the lit gauge + robot pose) ---- */
  function makeIconHandle(host, icon) {
    const robot = icon.querySelector('.rr-robot');
    const pips = icon.querySelectorAll('.rr-pip');
    const labelEl = icon.querySelector('.rr-icon-label');
    let curLevel = FULL;

    function applyLevel(lv) {
      curLevel = lv;
      pips.forEach((p) => {
        const pv = parseInt(p.dataset.pip, 10);
        p.classList.toggle('on', lv >= 1 && pv <= lv);
        p.classList.remove('lvl1', 'lvl2', 'lvl3', 'lvl4');
        if (lv >= 1 && pv <= lv) p.classList.add('lvl' + lv);
      });
      icon.classList.remove('lvl-empty', 'lvl-low', 'lvl-mid', 'lvl-high', 'lvl-full');
      const cls = { 0: 'lvl-empty', 1: 'lvl-low', 2: 'lvl-mid', 3: 'lvl-high', 4: 'lvl-full' }[lv] || 'lvl-empty';
      icon.classList.add(cls);
      if (robot) robot.classList.toggle('stranded', lv <= 0);
    }
    function setLevel(lv) { applyLevel(lv == null ? 0 : lv); }
    function pulse() {
      icon.classList.remove('rr-pulse'); void icon.offsetWidth; icon.classList.add('rr-pulse');
      setTimeout(() => icon.classList.remove('rr-pulse'), 700);
    }
    function spark(lv) {
      const p = icon.querySelector('.rr-pip[data-pip="' + lv + '"]');
      if (!p) return;
      p.classList.remove('rr-spark'); void p.offsetWidth; p.classList.add('rr-spark');
      setTimeout(() => p.classList.remove('rr-spark'), 500);
    }
    function drainTo(lv, opt) {
      const from = curLevel;
      if (opt && opt.spark) for (let l = from; l > Math.max(lv, 0); l--) spark(l);
      applyLevel(Math.max(lv, 0));
      if (lv <= 0) strand();
    }
    function strand() {
      applyLevel(0);
      icon.classList.remove('rr-strand-anim'); void icon.offsetWidth; icon.classList.add('rr-strand-anim');
    }
    function dockRefill() {
      icon.classList.add('rr-docking');
      let lv = 0;
      const step = () => {
        lv++;
        applyLevel(lv);
        if (lv < FULL) setTimeout(step, 110);
        else setTimeout(() => icon.classList.remove('rr-docking'), 160);
      };
      setTimeout(step, 80);
    }
    function setLabel(txt) {
      if (!labelEl) return;
      if (txt == null) { labelEl.hidden = true; return; }
      labelEl.hidden = false; labelEl.textContent = txt;
    }
    return { setLevel, pulse, spark, drainTo, strand, dockRefill, setLabel, host, icon, level: () => curLevel };
  }

  /* ---- qtable-variant handle (the Q-table + the header gauge) ---- */
  function makeTableHandle(host, panel, rungNodes, showValues) {
    const ALL_TINTS = LEVER_IDS.map(id => 'tint-' + id);
    const STAR = '★';
    let prevQ = null;

    const headIcon = makeIconHandle(host, panel.querySelector('.rr-icon-mini'));

    function clearRow(node) {
      for (let a = 0; a < A; a++) {
        node.rows[a].mark.textContent = '';
        node.rows[a].row.classList.remove('argmax');
        node.rows[a].val.textContent = EMPTY;
      }
      for (const t of ALL_TINTS) node.rung.classList.remove(t);
      node.rung.classList.add('unsolved');
      if (node.vval) node.vval.textContent = EMPTY;
    }

    function update(Q, opt) {
      const oo = opt || {};
      for (let lv = 1; lv <= N; lv++) {
        const node = rungNodes[lv];
        const b = (lv - 1) * A;
        let best = -Infinity, k = -1, allZero = true;
        for (let a = 0; a < A; a++) {
          const v = Q[b + a];
          if (v == null || !isFinite(v)) continue;
          if (Math.abs(v) > 1e-9) allZero = false;
          if (v > best) { best = v; k = a; }
        }
        for (const t of ALL_TINTS) node.rung.classList.remove(t);
        if (allZero || k < 0) {
          node.rung.classList.add('unsolved');
          for (let a = 0; a < A; a++) {
            node.rows[a].val.textContent = EMPTY;
            node.rows[a].row.classList.remove('argmax');
            node.rows[a].mark.textContent = '';
          }
          if (node.vval) node.vval.textContent = EMPTY;
        } else {
          node.rung.classList.remove('unsolved');
          node.rung.classList.add('tint-' + LEVER_IDS[k]);
          for (let a = 0; a < A; a++) {
            const v = Q[b + a];
            node.rows[a].val.textContent = (v == null || !isFinite(v)) ? EMPTY : fmtQ(v);
            const isArg = a === k;
            node.rows[a].row.classList.toggle('argmax', isArg);
            node.rows[a].mark.textContent = isArg ? STAR : '';
          }
          if (node.vval) node.vval.textContent = fmtQ(best);

          if (prevQ && !oo.suppressFlash) {
            let pBest = -Infinity, pk = -1;
            for (let a = 0; a < A; a++) {
              const pv = prevQ[b + a];
              if (pv == null || !isFinite(pv)) continue;
              if (pv > pBest) { pBest = pv; pk = a; }
            }
            if (pk >= 0 && pk !== k) {
              node.rung.classList.remove('rung-flip'); void node.rung.offsetWidth; node.rung.classList.add('rung-flip');
              setTimeout(() => node.rung.classList.remove('rung-flip'), 900);
            }
          }
        }
      }
      prevQ = Array.from(Q, v => (v == null ? null : v));
    }

    function fmtQ(v) { return (Math.round(v * 100) / 100).toFixed(2); }

    function reset() { prevQ = null; for (let lv = 1; lv <= N; lv++) clearRow(rungNodes[lv]); }

    function setRungSolved(lv, solved) {
      const node = rungNodes[lv];
      if (node) node.rung.classList.toggle('pending', !solved);
    }
    function highlightRung(lv, on) {
      const node = rungNodes[lv];
      if (node) node.rung.classList.toggle('just-locked', !!on);
    }
    function getRungNode(lv) { return rungNodes[lv] ? rungNodes[lv].rung : null; }

    /* Paint a policy directly (no Q): byLevel maps level (1..4) -> leverId. */
    function paintPolicy(byLevel, opt) {
      const oo = opt || {};
      for (let lv = 1; lv <= N; lv++) {
        const node = rungNodes[lv];
        const id = byLevel[lv];
        for (const t of ALL_TINTS) node.rung.classList.remove(t);
        node.rung.classList.remove('unsolved');
        if (!id) { node.rung.classList.add('unsolved'); continue; }
        node.rung.classList.add('tint-' + id);
        for (let a = 0; a < A; a++) {
          const isPick = LEVER_IDS[a] === id;
          node.rows[a].row.classList.toggle('argmax', isPick);
          node.rows[a].mark.textContent = isPick ? STAR : '';
          node.rows[a].val.textContent = isPick ? T('die.roll') === 'ROLL' ? 'play' : 'play' : EMPTY;
        }
        if (node.vval) node.vval.textContent = EMPTY;
        if (oo.animate) {
          const d = (FULL - lv) * 60;
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
    for (let lv = 1; lv <= N; lv++) {
      (function (l) {
        rungNodes[l].rung.addEventListener('click', () => { if (rungClickCb) rungClickCb(l, rungNodes[l].rung); });
      })(lv);
    }
    function setOnRungClick(cb) {
      rungClickCb = cb;
      for (let lv = 1; lv <= N; lv++) rungNodes[lv].rung.classList.toggle('clickable', !!cb);
    }

    reset();
    return {
      update, reset, paintPolicy,
      setRungSolved, highlightRung, getRungNode, setOnRungClick,
      /* delegate the header gauge pose */
      setLevel: headIcon.setLevel, pulse: headIcon.pulse, drainTo: headIcon.drainTo,
      strand: headIcon.strand, dockRefill: headIcon.dockRefill,
      host,
    };
  }

  /* Standalone argmax-count helper (skips null cells). */
  function leverCounts(Q) {
    const c = {};
    for (const id of LEVER_IDS) c[id] = 0;
    for (let lv = 1; lv <= N; lv++) {
      const b = (lv - 1) * A;
      let m = -Infinity, k = -1;
      for (let a = 0; a < A; a++) {
        const v = Q[b + a];
        if (v == null || !isFinite(v)) continue;
        if (v > m) { m = v; k = a; }
      }
      if (k >= 0) c[LEVER_IDS[k]]++;
    }
    return c;
  }

  window.Gauge = { mount, leverCounts, leverLabel, leverShort };
})();

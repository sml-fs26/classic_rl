/* Scene 7, The value of a lever, Q*.
 *
 *   Q*(s, a) = max_pi E[ G_i(tau) | s, a ], the long-run value of pulling
 *   lever a in situation s, assuming you price smart every day afterward.
 *   Average the return distribution (scene 6) away and you get ONE honest
 *   number per lever; the best lever is the one with the highest Q*.
 *
 *   The core reveal: the star MOVES. We show one situation's shelf-card icon
 *   beside a two-column table (lever a | Q*(s, a)) with the argmax STARRED,
 *   and let the learner flip between two situations where the winner differs:
 *     (5 units, 1 day)  -> STANDARD  (use it or lose it)
 *     (1 unit,  4 days) -> PREMIUM    (scarcity + runway = patience)
 *
 *   Every Q* value is read from window.DATA.Qstar (indexed
 *   stateIndex*A + leverIdx), never hand-typed.
 *
 *   Cold entry: rebuilds from window.DATA / window.Pricing. No timers, so no
 *   &run needed, the table is static the moment the scene mounts. */
(function () {
  if (!window.scenes) window.scenes = {};

  const P = window.Pricing;
  const L = window.Levers;
  const T = (k, v) => window.I18N.t(k, v);

  const A = (window.DATA && window.DATA.dims && window.DATA.dims.A) || 3;
  const LEVERS = L.LEVER_IDS;     // premium, standard

  /* The two situations where the optimal lever flips (the "star moves"). */
  const STATES = [
    { key: 'a', u: 5, d: 1, readKey: 'scene7.read.a' },
    { key: 'b', u: 1, d: 4, readKey: 'scene7.read.b' },
  ];

  function leverName(id) { return T('lever.' + id); }

  /* Q*(s, .) as { leverId: value } for state s, read from DATA.Qstar. */
  function qRow(s) {
    const Q = window.DATA && window.DATA.Qstar;
    const base = P.stateIndex(s) * A;
    const out = {};
    for (let a = 0; a < LEVERS.length; a++) {
      out[LEVERS[a]] = Q ? Q[base + a] : 0;
    }
    return out;
  }
  function argmaxLever(row) {
    let best = LEVERS[0], bv = -Infinity;
    for (const id of LEVERS) { if (row[id] > bv) { bv = row[id]; best = id; } }
    return best;
  }

  window.scenes.scene7 = function (root) {
    root.className = 'scene-pad concept-scene scene7';
    root.innerHTML = '';

    /*, Heading + lede, */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = T('scene7.title');
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene7.lede');
    root.appendChild(lede);

    /*, Formula card: Q*(s,a) = max E[G | s,a], */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene7.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      (window.DATA && window.DATA.tex && window.DATA.tex.qstar) ||
        String.raw`Q^{*}(s,a) \;=\; \max_{\pi}\, \mathbb{E}\,[\,G_i(\tau) \mid s, a\,]`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene7.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /*, State picker, */
    const picker = document.createElement('div');
    picker.className = 's7-picker';
    picker.innerHTML = '<span class="s7-picker-label">' + T('scene7.pick.label') + '</span>';
    for (const st of STATES) {
      const b = document.createElement('button');
      b.className = 'poke-btn s7-state-btn';
      b.dataset.key = st.key;
      b.textContent = T('scene7.pick.' + st.key);
      picker.appendChild(b);
    }
    root.appendChild(picker);

    /*, The reveal: shelf-card icon | Q* table, */
    const panel = document.createElement('div');
    panel.className = 's7-panel';

    const iconCol = document.createElement('div');
    iconCol.className = 's7-icon-col';
    iconCol.innerHTML = '<div class="s7-icon-label">' + T('scene7.state.label') + '</div>';
    const iconHost = document.createElement('div');
    iconHost.className = 's7-icon-host';
    iconCol.appendChild(iconHost);
    panel.appendChild(iconCol);

    const tableCol = document.createElement('div');
    tableCol.className = 's7-table-col';
    panel.appendChild(tableCol);

    root.appendChild(panel);

    /*, Read-out + punchline, */
    const readEl = document.createElement('p');
    readEl.className = 'concept-note s7-read';
    root.appendChild(readEl);

    const note = document.createElement('p');
    note.className = 'concept-note';
    note.innerHTML = T('scene7.move.note');
    root.appendChild(note);

    /* ===== State ===== */
    let activeKey = 'a';

    function render() {
      const st = STATES.find((x) => x.key === activeKey) || STATES[0];
      const s = { u: st.u, d: st.d, terminal: false };
      const row = qRow(s);
      const best = argmaxLever(row);

      /* Shelf-card icon for the chosen situation. */
      iconHost.innerHTML = '';
      iconHost.appendChild(window.ShelfCard.render(s, { size: 'lg', label: true }));

      /* Two-column table: lever a | Q*(s,a), best row starred. */
      let rows = '';
      for (const id of LEVERS) {
        const isBest = id === best;
        rows +=
          '<tr class="s7-row' + (isBest ? ' is-best' : '') + '">' +
            '<td class="s7-td-lever">' +
              '<span class="lever-tag" data-lever="' + id + '">' + leverName(id) + '</span>' +
            '</td>' +
            '<td class="s7-td-q">' +
              '<span class="s7-q-val">$' + row[id].toFixed(2) + '</span>' +
              (isBest
                ? '<span class="s7-star" aria-label="best">★</span>' +
                  '<span class="s7-best-tag">' + T('scene7.best.tag') + '</span>'
                : '') +
            '</td>' +
          '</tr>';
      }
      tableCol.innerHTML =
        '<table class="s7-table">' +
          '<thead><tr>' +
            '<th class="s7-th-lever">' + T('scene7.col.lever') + '</th>' +
            '<th class="s7-th-q">' + T('scene7.col.qstar') + '</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>';

      /* Read-out for this situation. */
      readEl.innerHTML = T(st.readKey);

      /* Picker button active state. */
      picker.querySelectorAll('.s7-state-btn').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.key === activeKey));
    }

    function setActive(key) {
      if (key === activeKey) return;
      activeKey = key;
      render();
      if (window.SFX) window.SFX.play('cursor');
    }

    picker.querySelectorAll('.s7-state-btn').forEach((b) => {
      b.addEventListener('click', () => setActive(b.dataset.key));
    });

    render();

    return {
      onEnter() { render(); },
      onLeave() {},
      /* Left/right arrows flip between the two situations so the star moves
         under keyboard control; consume so the pager does not jump scenes. */
      onNextKey() {
        const i = STATES.findIndex((x) => x.key === activeKey);
        if (i < STATES.length - 1) { setActive(STATES[i + 1].key); return true; }
        return false;
      },
      onPrevKey() {
        const i = STATES.findIndex((x) => x.key === activeKey);
        if (i > 0) { setActive(STATES[i - 1].key); return true; }
        return false;
      },
    };
  };
})();

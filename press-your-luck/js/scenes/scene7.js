/* Scene 7 - THE OPTIMAL ACTION-VALUE Q*(s, a).
 *
 *   MANAGER MEANING first: Q*(s, lever) is the HONEST long-run win-odds
 *   of pulling that lever now, then playing smart to the end. And the
 *   best lever is NOT the same when you are ahead as when you are behind
 *   - even with the exact same chips on the table.
 *
 *   FORMAL:  Q*(s, a) = max E[ G_i(tau) ]  - the largest expected return
 *   achievable after taking lever a in situation s, i.e. the win
 *   probability of that lever under optimal continuation.
 *
 *   THE HEADLINE (the twist, drawn): hold the pot at 18 and flip the
 *   standing. The table-card on the left retints; the two-column table
 *   (lever a | Q*(s, a)) on the right re-stars its argmax. The star MOVES
 *   across the standing axis at the very same pot:
 *       (pot 18, BEHIND): ROLL > HOLD  -> star on ROLL  (catch up)
 *       (pot 18, EVEN):   ROLL > HOLD, barely           (break-even ~20)
 *       (pot 18, AHEAD):  HOLD > ROLL  -> star on HOLD   (protect the lead)
 *
 *   All numbers are read from window.DATA.twist.pot18 (the exact-state DP
 *   win-probs) - never hand-typed. The learner picks the standing; we
 *   never pre-reveal which lever is best.
 */
(function () {
  window.scenes = window.scenes || {};

  const Pig = window.Pig;
  const DATA = window.DATA;
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The three headline rows at pot 18, read straight from the dataset. */
  const TW = DATA.twist.pot18;                 // { behind, even, ahead }
  const STANDS = [
    { key: 'behind', idx: 0, data: TW.behind },
    { key: 'even',   idx: 1, data: TW.even },
    { key: 'ahead',  idx: 2, data: TW.ahead },
  ];
  const FIX_POT = 18;
  const LEVERS = window.Moves ? window.Moves.MOVE_IDS : ['roll', 'hold'];   // [roll, hold]

  function leverName(id) { return T('vocab.' + id); }
  function pct(v) { return (v * 100).toFixed(1) + '%'; }

  window.scenes.scene7 = function (root) {
    root.className = 'scene-pad concept-scene';
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene7.heading');
    root.appendChild(heading);

    const lede = document.createElement('div');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene7.lede');
    root.appendChild(lede);

    /* ---- Q* formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene7.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \max\; \mathbb{E}\!\left[\, G_i(\tau) \,\right] \;=\; \mathbb{P}(\text{win} \mid s, a, \text{play smart after})`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = T('scene7.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Standing selector (the "same pot, flip the scoreboard" dial) ---- */
    const selWrap = document.createElement('div');
    selWrap.className = 'qs-sel-wrap';
    selWrap.innerHTML =
      '<div class="qs-sel-prompt">' + T('scene7.sel.prompt') + '</div>' +
      '<div class="qs-sel-btns">' +
        STANDS.map((s) =>
          '<button class="poke-btn qs-sel qs-sel-' + s.key + '" data-stand="' + s.idx + '">' +
            T('vocab.' + s.key) +
          '</button>'
        ).join('') +
      '</div>';
    root.appendChild(selWrap);

    /* ---- The Q* panel: table-card on the left, two-column table right ---- */
    const demo = document.createElement('div');
    demo.className = 'qs-demo';
    root.appendChild(demo);

    /* state-icon (full table-card) */
    const cardCol = document.createElement('div');
    cardCol.className = 'qs-card-col';
    cardCol.innerHTML = '<div class="qs-state-label">' + T('scene7.state.label') + '</div>';
    const cardHost = document.createElement('div');
    cardHost.className = 'qs-card-host';
    cardCol.appendChild(cardHost);
    const cardCaption = document.createElement('div');
    cardCaption.className = 'qs-card-caption';
    cardCol.appendChild(cardCaption);
    demo.appendChild(cardCol);

    /* the two-column table */
    const tableCol = document.createElement('div');
    tableCol.className = 'qs-table-col';
    demo.appendChild(tableCol);

    const card = window.TableCard.mount(cardHost, { showVals: false });

    /* ---- Verdict line + bridge ---- */
    const verdict = document.createElement('div');
    verdict.className = 'qs-verdict';
    root.appendChild(verdict);

    const bridge = document.createElement('div');
    bridge.className = 'concept-key-question';
    bridge.textContent = T('scene7.bridge');
    root.appendChild(bridge);

    let curStand = 1;     // start EVEN (the near-tie - judgment matters most here)

    function render() {
      const st = STANDS[curStand];
      const d = st.data;                 // { my, riv, roll, hold, best }

      /* Update the table-card. */
      card.set({ my: d.my, riv: d.riv, pot: FIX_POT });
      cardCaption.innerHTML = T('scene7.card.caption', {
        pot: FIX_POT, my: d.my, riv: d.riv, stand: T('vocab.' + st.key),
      });

      /* Build the two-column table (lever a | Q*(s, a)), argmax starred. */
      const bestId = d.best;             // 'roll' or 'hold'
      let rows = '';
      for (const id of LEVERS) {
        const qv = (id === 'roll') ? d.roll : d.hold;
        const isBest = (id === bestId);
        const star = isBest ? '<span class="qs-star">&#9733;</span>' : '';
        rows +=
          '<tr class="qs-row qs-row-' + id + (isBest ? ' qs-argmax' : '') + '">' +
            '<td class="qs-row-action">' + leverName(id) + star + '</td>' +
            '<td class="qs-row-q">' + pct(qv) + '</td>' +
          '</tr>';
      }
      tableCol.innerHTML =
        '<table class="qs-table">' +
          '<thead><tr>' +
            '<th class="qs-row-action">' + T('scene7.col.action') + '</th>' +
            '<th class="qs-row-q">' + T('scene7.col.q') + '</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<div class="qs-gap">' + T('scene7.gap', {
          gap: ((Math.abs(d.roll - d.hold)) * 100).toFixed(1),
        }) + '</div>';

      /* Verdict: name the winning lever + the manager reason. */
      verdict.className = 'qs-verdict qs-verdict-' + bestId;
      verdict.innerHTML =
        '<span class="qs-verdict-tag">' + T('vocab.' + st.key) + '</span> ' +
        T('scene7.verdict.' + st.key);

      /* Selector active state. */
      selWrap.querySelectorAll('.qs-sel').forEach((b) => {
        b.classList.toggle('active', Number(b.getAttribute('data-stand')) === curStand);
      });
    }

    selWrap.querySelectorAll('.qs-sel').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = Number(btn.getAttribute('data-stand'));
        if (v === curStand) return;
        curStand = v;
        render();
        if (window.SFX) window.SFX.play('cursor');
      });
    });

    render();

    /* &run: cycle BEHIND -> EVEN -> AHEAD so the star is seen moving in a
       headless capture, then settle on AHEAD (the flip that surprises). */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      let i = 0;
      const order = [0, 1, 2];
      const tick = () => {
        curStand = order[i % order.length];
        render();
        i++;
        if (i < 3) setTimeout(tick, 700);
      };
      setTimeout(tick, 250);
    }

    return {
      onEnter() { render(); },
      onLeave() {},
      /* Right arrow cycles the standing (so the star moves) before
         advancing; consume until we have cycled through, then release. */
      onNextKey() {
        if (curStand < 2) { curStand++; render(); return true; }
        return false;
      },
      onPrevKey() {
        if (curStand > 0) { curStand--; render(); return true; }
        return false;
      },
    };
  };
})();

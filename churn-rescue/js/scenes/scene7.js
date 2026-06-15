/* Scene 7: Q*, the value of a lever.
 *
 *     Q*(s, a) = max E[ G_i(tau) ]
 *
 *   The honest long-run payoff of pulling lever a in THIS exact situation,
 *   assuming you play smart from then on. Manager meaning first: this is
 *   the number you wish you had on every account, the true value of each
 *   lever, not its sticker cost.
 *
 *   Layout: the recurring ACCOUNT CARD (hero size) for one state on the
 *   left, beside a two-column table (lever a | Q*(s,a)) on the right. The
 *   argmax row is STARRED and tinted with its lever colour.
 *
 *   We step the card through THREE contrasting states to SHOW the flip:
 *     - THRIVING, m=1  -> DO NOTHING wins  (a discount burns margin)
 *     - LUKEWARM, m=3  -> CHECK-IN wins    (cheap touch that compounds)
 *     - ON THE CLIFF, m=1 -> BIG OFFER wins (finally pays to fight)
 *   The best lever MOVES with the situation: that is the whole point.
 *
 *   To honour "never show the answer before the learner attempts it", each
 *   state first asks the learner to GUESS the winning lever; REVEAL then
 *   uncovers the Q* column and stars the argmax. Q* values are read from
 *   window.DATA.Qstar (layout stateIndex*3 + leverIdx, leverIdx order
 *   nothing/checkin/offer); nothing is computed or hand typed here.
 */
(function () {
  window.scenes = window.scenes || {};

  const Churn = window.Churn;
  const Levers = window.Levers;
  const DATA = window.DATA;
  const LEVER_IDS = DATA.leverIds;            // ['nothing','checkin','offer']
  const A = LEVER_IDS.length;
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* The three contrasting states to step through (the flip on both axes). */
  const TOUR = [
    { tier: 4, m: 1, blurbKey: 'scene7.blurb.thriving' },  // -> nothing
    { tier: 2, m: 3, blurbKey: 'scene7.blurb.lukewarm' },  // -> checkin
    { tier: 0, m: 1, blurbKey: 'scene7.blurb.cliff' },     // -> cliff offer
  ];

  function leverName(id) { return T('lever.' + id); }
  function tierName(tier) { return T('tier.' + Churn.TIERS[tier]); }
  function fmtQ(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2); }

  /* Q* for state (tier,m), lever index k, from the precomputed dataset. */
  function qOf(tier, m, k) {
    const sIdx = Churn.stateIndex({ tier: tier, m: m, terminal: false });
    return DATA.Qstar[sIdx * A + k];
  }
  function argmaxLever(tier, m) {
    let best = -Infinity, bi = 0;
    for (let k = 0; k < A; k++) {
      const q = qOf(tier, m, k);
      if (q > best) { best = q; bi = k; }
    }
    return bi;
  }

  window.scenes.scene7 = function (root) {
    root.classList.add('scene-pad', 'concept-scene', 'scene7-scene');
    root.innerHTML = '';

    /*, heading + manager hook, */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene.title7');
    root.appendChild(heading);

    const hook = document.createElement('div');
    hook.className = 'concept-hook';
    hook.innerHTML = T('scene7.manager');
    root.appendChild(hook);

    /*, formula card, */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene7.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \max\; \mathbb{E}\!\left[\, G_i(\tau) \,\right]`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene7.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /*, the per-state panel: account card | guess+table, */
    const panel = document.createElement('div');
    panel.className = 'qstar-panel';
    panel.innerHTML =
      '<div class="qstar-left">' +
        '<div class="qstar-state-label">' + T('scene7.state_label') + '</div>' +
        '<div class="qstar-card-host" id="qstar-card"></div>' +
        '<div class="qstar-blurb" id="qstar-blurb"></div>' +
      '</div>' +
      '<div class="qstar-right" id="qstar-right"></div>';
    root.appendChild(panel);

    /*, tour stepper, */
    const stepper = document.createElement('div');
    stepper.className = 'qstar-stepper';
    stepper.innerHTML =
      '<button class="poke-btn" id="qstar-prev">◀ PREV</button>' +
      '<div class="qstar-dots" id="qstar-dots"></div>' +
      '<button class="poke-btn" id="qstar-next">NEXT ▶</button>';
    root.appendChild(stepper);

    /*, bridge to DP, */
    const bridge = document.createElement('div');
    bridge.className = 'concept-key-question';
    bridge.innerHTML = T('scene7.bridge');
    root.appendChild(bridge);

    /*, state, */
    const cardHost = panel.querySelector('#qstar-card');
    const card = window.AccountCard.mount(cardHost, { tier: TOUR[0].tier, m: TOUR[0].m, size: 'full' });
    let idx = 0;
    let revealed = false;
    let guessed = null;     // lever index the learner guessed (or null)

    function renderDots() {
      const dots = document.getElementById('qstar-dots');
      dots.innerHTML = TOUR.map((s, i) =>
        '<span class="qstar-dot' + (i === idx ? ' active' : '') + '"></span>'
      ).join('');
    }

    /* The right panel: a guess prompt, then (on reveal) the Q* table. */
    function renderRight() {
      const host = document.getElementById('qstar-right');
      const st = TOUR[idx];
      const argA = argmaxLever(st.tier, st.m);

      if (!revealed) {
        host.innerHTML =
          '<div class="qstar-guess-prompt">' + T('scene7.guess.prompt') + '</div>' +
          '<div class="qstar-guess-row">' +
            LEVER_IDS.map((id, k) =>
              '<button class="qstar-guess-btn ' + Levers.tokenClass(id) +
                (guessed === k ? ' picked' : '') + '" data-k="' + k + '">' +
                leverName(id) +
              '</button>'
            ).join('') +
          '</div>' +
          '<button class="poke-btn qstar-reveal" id="qstar-reveal"' +
            (guessed === null ? ' disabled' : '') + '>' + T('scene7.btn.reveal') + '</button>' +
          '<div class="qstar-guess-hint">' + T('scene7.guess.hint') + '</div>';

        host.querySelectorAll('.qstar-guess-btn').forEach((b) => {
          b.addEventListener('click', () => {
            guessed = parseInt(b.getAttribute('data-k'), 10);
            renderRight();
          });
        });
        const rev = host.querySelector('#qstar-reveal');
        if (rev) rev.addEventListener('click', () => { revealed = true; renderRight(); });
        return;
      }

      /* Revealed: the two-column Q* table, argmax starred + tinted. */
      let rows = '';
      for (let k = 0; k < A; k++) {
        const id = LEVER_IDS[k];
        const q = qOf(st.tier, st.m, k);
        const isArg = (k === argA);
        const star = isArg ? '<span class="qstar-star">★</span>' : '';
        rows +=
          '<tr class="qstar-trow ' + (isArg ? 'argmax ' + Levers.tokenClass(id) : '') + '">' +
            '<td class="qstar-tlever"><span class="qstar-swatch ' + Levers.tokenClass(id) + '"></span>' +
              leverName(id) + star + '</td>' +
            '<td class="qstar-tq">' + fmtQ(q) + '</td>' +
          '</tr>';
      }
      const guessRight = (guessed === argA);
      const verdict = guessed === null ? '' :
        '<div class="qstar-verdict ' + (guessRight ? 'right' : 'wrong') + '">' +
          (guessRight ? T('scene7.verdict.right') : T('scene7.verdict.wrong', { lever: leverName(LEVER_IDS[argA]) })) +
        '</div>';

      host.innerHTML =
        '<table class="qstar-table">' +
          '<thead><tr>' +
            '<th class="qstar-tlever">' + T('scene7.col.lever') + '</th>' +
            '<th class="qstar-tq">' + T('scene7.col.q') + '</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        verdict +
        '<div class="qstar-best-line">' + T('scene7.best', {
          lever: '<b class="' + Levers.tokenClass(LEVER_IDS[argA]) + '">' + leverName(LEVER_IDS[argA]) + '</b>',
        }) + '</div>';
    }

    function renderState() {
      const st = TOUR[idx];
      card.set({ tier: st.tier, m: st.m });
      document.getElementById('qstar-blurb').innerHTML =
        '<b>' + tierName(st.tier) + ' · ' + T('months.short', { n: st.m }) + '</b><br>' + T(st.blurbKey);
      renderDots();
      renderRight();
    }

    function go(delta) {
      idx = (idx + delta + TOUR.length) % TOUR.length;
      revealed = false;
      guessed = null;
      renderState();
    }

    document.getElementById('qstar-prev').addEventListener('click', () => go(-1));
    document.getElementById('qstar-next').addEventListener('click', () => go(+1));

    renderState();

    /* &run: auto-reveal the first state's Q* table for headless capture
       (no guess machinery needed for the screenshot). */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) { revealed = true; renderRight(); }

    return {
      /* Arrows step the tour. Within a state, right arrow first reveals,
         then advances; keeps the keyboard in step with the buttons. */
      onNextKey() {
        if (!revealed) { revealed = true; renderRight(); return true; }
        go(+1); return true;
      },
      onPrevKey() {
        if (revealed) { revealed = false; guessed = null; renderRight(); return true; }
        go(-1); return true;
      },
    };
  };
})();

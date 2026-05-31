/* Scene 3: "What makes this an MDP?"  (Formalization)
 *
 *   Freeze the live board mid-game and name the four parts, one click at a
 *   time, on the SAME account card the learner ran in scene 2. The four
 *   ingredients light up in order and a part-card on the right explains
 *   each in manager English first, notation second:
 *
 *     STATE       s = (engagement tier, months to renewal)  -> the card
 *     ACTION      a = the lever you pull                     -> the menu
 *     TRANSITION  P(s', r | s, a) = the retention coin + the engagement
 *                 die, ringed as THE PART YOU DON'T CONTROL  -> coin + die
 *     REWARD      r = the ledger entry: minus the cost now, plus/minus 20
 *                 at the end
 *
 *   Closes on the Markov line in plain words and the MDP tuple <S,A,P,R>.
 *
 *   6-step ladder (0..5):
 *     0  card + levers only. "Freeze it. Four parts."
 *     1  + STATE tag         (highlight the card)
 *     2  + ACTION tag        (highlight the chosen lever)
 *     3  + TRANSITION tag    (coin + die appear, ringed)
 *     4  + REWARD tag        (ledger entry appears)
 *     5  + Markov line + the <S,A,P,R> tuple
 *
 *   Cold entry safe: the frozen state is read from window.Churn.initialState
 *   (the scene-2 start, lukewarm m4); the chosen lever is CHECK-IN, the
 *   lever the scene-4 / optimal playbook picks for the middle band. No
 *   live randomness is drawn: the coin/die show a fixed STAY + UP face so
 *   the still frame reads as a representative month, not an answer.
 *
 *   Allowed globals: window.Churn, window.Levers, window.DATA, AccountCard,
 *   Coin, D6, window.I18N, window.SFX, katex. No fetch / no <style> inject.
 */
(function () {
  window.scenes = window.scenes || {};

  const STEP_COUNT = 6;                  // 0..5 inclusive

  window.scenes.scene3 = function (root) {
    root.classList.add('scene-pad', 'scene3-scene');
    root.innerHTML = '';

    const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
    const Churn = window.Churn;
    const Levers = window.Levers;

    /* The frozen month: the scene-2 start state, and the CHECK-IN lever
       (the middle-band move). Read from the engine, never hand-typed. */
    const FROZEN = Churn.initialState();          // { tier:2, m:4 }
    const CHOSEN_LEVER = 'checkin';

    let step = 0;

    /* ---------- Scaffold ---------- */
    const wrap = document.createElement('div');
    wrap.className = 's3-wrap';
    root.appendChild(wrap);

    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle s3-heading';
    heading.textContent = T('scene3.heading');
    wrap.appendChild(heading);

    const row = document.createElement('div');
    row.className = 's3-row';
    wrap.appendChild(row);

    /* ----- LEFT: the frozen "live board" ----- */
    const board = document.createElement('div');
    board.className = 's3-board';
    row.appendChild(board);

    const boardLabel = document.createElement('div');
    boardLabel.className = 's3-board-label';
    boardLabel.textContent = T('scene3.board_label');
    board.appendChild(boardLabel);

    /* The recurring account card (the state-icon), step-1 ringable. */
    const cardRing = document.createElement('div');
    cardRing.className = 's3-ring s3-ring-state';
    const cardHost = document.createElement('div');
    window.AccountCard.mount(cardHost, { tier: FROZEN.tier, m: FROZEN.m });
    cardRing.appendChild(cardHost);
    const cardTag = document.createElement('div');
    cardTag.className = 's3-tag s3-tag-s';
    cardTag.textContent = T('scene3.tag.s');
    cardRing.appendChild(cardTag);
    board.appendChild(cardRing);

    /* The two visible dice, revealed at step 3 inside one ring. A fixed,
       representative outcome (STAY then UP): no live draw, so the frozen
       frame is a picture of the mechanism, not a result. */
    const diceRing = document.createElement('div');
    diceRing.className = 's3-ring s3-ring-trans s3-dice';
    const coinHost = document.createElement('div');
    const dieHost = document.createElement('div');
    const coin = window.Coin.mount(coinHost, {});
    const die = window.D6.mount(dieHost, {});
    coin.set('stay');
    die.set('up');
    const diceInner = document.createElement('div');
    diceInner.className = 's3-dice-inner';
    diceInner.appendChild(coinHost);
    const arrow = document.createElement('span');
    arrow.className = 's3-dice-arrow';
    arrow.textContent = '→';                 // rightwards arrow
    diceInner.appendChild(arrow);
    diceInner.appendChild(dieHost);
    diceRing.appendChild(diceInner);
    const diceCap = document.createElement('div');
    diceCap.className = 's3-dice-cap';
    diceCap.innerHTML =
      '<span class="s3-dice-name lever-checkin">' + T('coin.name') + '</span>' +
      '<span class="s3-dice-then">' + T('scene3.then') + '</span>' +
      '<span class="s3-dice-name lever-checkin">' + T('die.name') + '</span>';
    diceRing.appendChild(diceCap);
    const transTag = document.createElement('div');
    transTag.className = 's3-tag s3-tag-p';
    transTag.textContent = T('scene3.tag.p');
    diceRing.appendChild(transTag);
    board.appendChild(diceRing);

    /* ----- RIGHT: the lever menu + the four part-cards ----- */
    const rightCol = document.createElement('div');
    rightCol.className = 's3-right';
    row.appendChild(rightCol);

    /* Lever menu (disabled, the action space), step-2 ringable; the chosen
       lever is highlighted from step 2 on. */
    const menuRing = document.createElement('div');
    menuRing.className = 's3-ring s3-ring-action';
    const menu = document.createElement('div');
    menu.className = 's3-menu';
    for (const lev of Levers.LEVERS) {
      const btn = document.createElement('button');
      btn.className = 's3-lever ' + Levers.tokenClass(lev.id);
      btn.type = 'button';
      btn.disabled = true;
      btn.dataset.lever = lev.id;
      btn.innerHTML =
        '<span class="s3-lever-name">' + T('lever.' + lev.id) + '</span>' +
        Levers.leverSubHtml(lev.id);
      menu.appendChild(btn);
    }
    menuRing.appendChild(menu);
    const actionTag = document.createElement('div');
    actionTag.className = 's3-tag s3-tag-a';
    actionTag.textContent = T('scene3.tag.a');
    menuRing.appendChild(actionTag);
    rightCol.appendChild(menuRing);

    /* The four part-cards: S / A / P / R. Each lights up as its step lands
       and carries the manager gloss + the notation. */
    const parts = document.createElement('div');
    parts.className = 's3-parts';
    rightCol.appendChild(parts);

    const PART_DEFS = [
      { key: 's', cls: 'part-s', sym: 's = (\\text{tier},\\ \\text{months})' },
      { key: 'a', cls: 'part-a', sym: 'a \\in \\{\\,\\text{NONE},\\ \\text{CHECK-IN},\\ \\text{OFFER}\\,\\}' },
      { key: 'p', cls: 'part-p', sym: "P(s',\\, r \\mid s,\\, a)" },
      { key: 'r', cls: 'part-r', sym: 'r = -\\text{cost}\\ \\ (\\pm 20\\ \\text{at the end})' },
    ];
    const partNodes = {};
    for (const def of PART_DEFS) {
      const c = document.createElement('div');
      c.className = 's3-part ' + def.cls;
      c.innerHTML =
        '<div class="s3-part-head">' +
          '<span class="s3-part-letter">' + T('scene3.part.' + def.key + '.letter') + '</span>' +
          '<span class="s3-part-title">' + T('scene3.part.' + def.key + '.title') + '</span>' +
        '</div>' +
        '<div class="s3-part-sym"></div>' +
        '<div class="s3-part-gloss">' + T('scene3.part.' + def.key + '.gloss') + '</div>';
      parts.appendChild(c);
      const symEl = c.querySelector('.s3-part-sym');
      try { katex.render(def.sym, symEl, { throwOnError: false, displayMode: false }); }
      catch (e) { symEl.textContent = def.sym; }
      partNodes[def.key] = c;
    }

    /* ----- BELOW: the reward ledger, the Markov line, the tuple ----- */
    const below = document.createElement('div');
    below.className = 's3-below';
    wrap.appendChild(below);

    /* A one-month margin ledger showing the reward of THIS month under the
       chosen lever: a debit of the cost now, and the deferred terminal
       lumps as faint pending rows. Numbers from the engine. */
    const cost = Churn.costOf(CHOSEN_LEVER);
    const ledger = document.createElement('div');
    ledger.className = 's3-ledger margin-ledger';
    ledger.innerHTML =
      '<div class="margin-ledger-title">' + T('scene3.reward_title') + '</div>' +
      '<div class="ledger-rows">' +
        '<div class="ledger-row debit">' +
          '<span>' + T('scene3.ledger.lever', { lever: T('lever.' + CHOSEN_LEVER) }) + '</span>' +
          '<span class="ledger-amt">' + (cost === 0 ? '0' : '−' + cost) + '</span>' +
        '</div>' +
        '<div class="ledger-row credit s3-ledger-pending">' +
          '<span>' + T('scene3.ledger.renew') + '</span>' +
          '<span class="ledger-amt">+' + Churn.RENEW_REWARD + '</span>' +
        '</div>' +
        '<div class="ledger-row debit s3-ledger-pending">' +
          '<span>' + T('scene3.ledger.churn') + '</span>' +
          '<span class="ledger-amt">−' + Math.abs(Churn.CHURN_REWARD) + '</span>' +
        '</div>' +
      '</div>';
    below.appendChild(ledger);

    /* The Markov line in plain words + the formal tuple. */
    const markov = document.createElement('div');
    markov.className = 's3-markov';
    const markovText = document.createElement('div');
    markovText.className = 's3-markov-text';
    markovText.innerHTML = '<span class="s3-markov-key">' + T('scene3.markov_key') + '</span> ' +
      T('scene3.markov_body');
    markov.appendChild(markovText);
    const tupleBox = document.createElement('div');
    tupleBox.className = 's3-tuple poke-formula';
    const tupleInner = document.createElement('span');
    try {
      katex.render('\\text{MDP} \\;=\\; ' + (window.DATA && window.DATA.tex && window.DATA.tex.mdpTuple
        ? window.DATA.tex.mdpTuple : '\\langle S,\\, A,\\, P,\\, R \\rangle'),
        tupleInner, { throwOnError: false, displayMode: true });
    } catch (e) { tupleInner.textContent = '<S, A, P, R>'; }
    tupleBox.appendChild(tupleInner);
    markov.appendChild(tupleBox);
    below.appendChild(markov);

    /* ----- Caption + step controls ----- */
    const caption = document.createElement('div');
    caption.className = 'poke-caption s3-caption';
    wrap.appendChild(caption);

    const ctrls = document.createElement('div');
    ctrls.className = 's3-ctrls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s3-prev">' + T('topbar.prev') + '</button>' +
      '<div class="s3-step-of">' + T('scene3.step_of', { i: '<span id="s3-i">1</span>', n: STEP_COUNT }) + '</div>' +
      '<button class="poke-btn" id="s3-next">' + T('scene3.next') + '</button>';
    wrap.appendChild(ctrls);

    const hint = document.createElement('div');
    hint.className = 'footnote s3-hint';
    hint.innerHTML = T('scene3.hint');
    wrap.appendChild(hint);

    /* ---------- Step state machine ---------- */
    function applyStep(c) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, c));

      /* Rings + tags light up cumulatively. */
      cardRing.classList.toggle('lit', step >= 1);
      cardTag.classList.toggle('show', step >= 1);
      partNodes.s.classList.toggle('lit', step >= 1);

      menuRing.classList.toggle('lit', step >= 2);
      actionTag.classList.toggle('show', step >= 2);
      partNodes.a.classList.toggle('lit', step >= 2);
      /* Highlight the chosen lever from step 2. */
      for (const b of menu.querySelectorAll('.s3-lever')) {
        b.classList.toggle('s3-lever-chosen', step >= 2 && b.dataset.lever === CHOSEN_LEVER);
        b.classList.toggle('s3-lever-dim', step >= 2 && b.dataset.lever !== CHOSEN_LEVER);
      }

      diceRing.classList.toggle('show', step >= 3);
      diceRing.classList.toggle('lit', step >= 3);
      transTag.classList.toggle('show', step >= 3);
      partNodes.p.classList.toggle('lit', step >= 3);

      ledger.classList.toggle('show', step >= 4);
      ledger.classList.toggle('lit', step >= 4);
      partNodes.r.classList.toggle('lit', step >= 4);

      markov.classList.toggle('show', step >= 5);

      caption.innerHTML = T('scene3.step.' + step);
      const iEl = document.getElementById('s3-i');
      if (iEl) iEl.textContent = String(step + 1);

      if (window.SFX && step > 0) window.SFX.play('cursor');
    }

    document.getElementById('s3-next').addEventListener('click', () => {
      if (step < STEP_COUNT - 1) applyStep(step + 1);
      else if (window.ChurnViz) window.ChurnViz.goTo(window.ChurnViz.getCurrentScene() + 1);
    });
    document.getElementById('s3-prev').addEventListener('click', () => {
      if (step > 0) applyStep(step - 1);
      else if (window.ChurnViz) window.ChurnViz.goTo(window.ChurnViz.getCurrentScene() - 1);
    });

    applyStep(0);

    /* &run -> jump to the fully-revealed last step for headless capture. */
    if (/[#&?]run\b/.test(window.location.hash)) {
      setTimeout(() => applyStep(STEP_COUNT - 1), 180);
    }

    return {
      onEnter() { applyStep(step); },
      onNextKey() {
        if (step < STEP_COUNT - 1) { applyStep(step + 1); return true; }
        return false;
      },
      onPrevKey() {
        if (step > 0) { applyStep(step - 1); return true; }
        return false;
      },
    };
  };
})();

/* Scene 5 -- The trajectory.
 *
 *   A run, written down, is a sequence of random variables
 *     tau = (S1, A1, R1, S2, A2, R2, ..., S_T)
 *   (capital letters: each entry was a dice roll BEFORE it happened).
 *
 *   Manager meaning first: "one quarter of selling, move by move." A
 *   shelf-card marches left along a rollout tape -- situation S_i, the
 *   lever A_i we pulled, the cash R_i it brought -- to MIDNIGHT (or an
 *   early SOLD OUT). We follow the SAME playbook (the converged optimal
 *   policy in window.DATA.policy) from the SAME opening (5 units, 4 days)
 *   every run, reseeding the demand draw each time, so the learner sees
 *   the punchline: same policy + same start => a different tau each run.
 *
 *   The signature DEMAND DRAW (window.Deck flip) plays on each NEXT DAY,
 *   then the resulting reward + next situation slot into the tape.
 *
 *   Cold entry: rebuilds entirely from window.Pricing / window.DATA.
 *   &run: auto-plays one full run for headless capture. */
(function () {
  if (!window.scenes) window.scenes = {};

  const P = window.Pricing;
  const L = window.Levers;
  const T = (k, v) => window.I18N.t(k, v);

  /* Lever the optimal policy pulls in state s (by board index). Falls back
     to STANDARD if DATA is somehow absent (cold-boot safety). */
  function policyLever(s) {
    const pol = (window.DATA && window.DATA.policy) || null;
    if (pol) {
      const id = pol[P.stateIndex(s)];
      if (id && L.LEVER_BY_ID[id]) return id;
    }
    return 'standard';
  }

  function leverShort(id) { return T('lever.' + id + '.short'); }
  function leverName(id)  { return T('lever.' + id); }

  /* A chunky price-tag chip (the A_i box content). */
  function leverTagHTML(id) {
    return '<span class="lever-tag" data-lever="' + id + '">' + leverName(id) + '</span>';
  }

  window.scenes.scene5 = function (root) {
    root.className = 'scene-pad concept-scene scene5';
    root.innerHTML = '';

    /* ---- Heading + lede ---- */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = T('scene5.title');
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene5.lede');
    root.appendChild(lede);

    /* ---- Formula card: tau = (S1, A1, R1, ...) ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene5.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      (window.DATA && window.DATA.tex && window.DATA.tex.trajectory) ||
        String.raw`\tau \;=\; (S_1, A_1, R_1,\; S_2, A_2, R_2,\; \ldots,\; S_T)`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.innerHTML = T('scene5.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Revenue HUD + status ---- */
    const hud = document.createElement('div');
    hud.className = 's5-hud';
    hud.innerHTML =
      '<div class="money-counter" id="s5-money">' +
        '<span class="money-label">' + T('scene5.revenue.label') + '</span>' +
        '<span class="money-amount"><span class="money-sign">$</span><span id="s5-money-amt">0</span></span>' +
      '</div>' +
      '<div class="s5-status" id="s5-status"></div>' +
      '<div class="demand-deck-slot" id="s5-deck-slot"></div>';
    root.appendChild(hud);

    /* ---- Rollout tape ---- */
    const tape = document.createElement('div');
    tape.className = 'return-tape s5-tape';
    root.appendChild(tape);

    /* ---- Controls ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 's5-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="s5-step">' + T('scene5.btn.step') + '</button>' +
      '<button class="poke-btn" id="s5-run">'  + T('scene5.btn.run')  + '</button>' +
      '<button class="poke-btn" id="s5-reset">'+ T('scene5.btn.reset')+ '</button>';
    root.appendChild(ctrls);

    /* ---- Punchline note ---- */
    const note = document.createElement('p');
    note.className = 'concept-note';
    note.innerHTML = T('scene5.same.note');
    root.appendChild(note);

    /* ---- Deck (shared demand-draw flip) ---- */
    const deckSlot = hud.querySelector('#s5-deck-slot');
    const deck = window.Deck.mount(deckSlot, {});

    /* ===== State machine ===== */
    const SEED_BASE = 0x5A11;
    let rng = P.makeRng(SEED_BASE);
    let s = P.initialState();
    let dayIdx = 1;
    let revenue = 0;
    let done = false;
    let busy = false;
    let playTimer = null;

    const moneyAmt = hud.querySelector('#s5-money-amt');
    const moneyBox = hud.querySelector('#s5-money');
    const statusEl = hud.querySelector('#s5-status');
    const stepBtn  = ctrls.querySelector('#s5-step');
    const runBtn   = ctrls.querySelector('#s5-run');
    const resetBtn = ctrls.querySelector('#s5-reset');

    function setRevenue(v, bump) {
      revenue = v;
      moneyAmt.textContent = String(v);
      if (bump) {
        moneyBox.classList.remove('money-bump');
        void moneyBox.offsetWidth;
        moneyBox.classList.add('money-bump');
      }
    }

    function updateStatus() {
      let txt;
      if (done) txt = T('scene5.status.done');
      else if (dayIdx === 1 && tape.childElementCount <= 1) txt = T('scene5.status.ready');
      else txt = T('scene5.status.now', { u: s.u, d: s.d });
      statusEl.innerHTML =
        '<span class="s5-status-day">' + T('scene5.status.day') + ' <b>' + Math.min(dayIdx, 4) + '</b>/4</span>' +
        '<span class="s5-status-now">' + txt + '</span>';
      stepBtn.disabled = done || busy;
    }

    /* The opening cap (S_1 before any move). */
    function renderOpening() {
      const cap = document.createElement('div');
      cap.className = 's5-cap s5-cap-start';
      cap.innerHTML = '<div class="s5-cap-label">' + T('scene5.start', { u: 5, d: 4 }) + '</div>';
      const sc = window.ShelfCard.render({ u: 5, d: 4 }, { size: 'sm', label: false });
      cap.appendChild(sc);
      tape.appendChild(cap);
    }

    function scrollEnd() {
      requestAnimationFrame(() => { tape.scrollLeft = tape.scrollWidth; });
    }

    function reset(reseed) {
      stopPlay();
      busy = false;
      if (reseed) rng = P.makeRng((SEED_BASE + ((Math.random() * 0xffff) | 0)) >>> 0);
      else rng = P.makeRng(SEED_BASE);
      s = P.initialState();
      dayIdx = 1;
      done = false;
      setRevenue(0, false);
      tape.innerHTML = '';
      deck.reset();
      renderOpening();
      updateStatus();
    }

    /* Append one day's S->A->R group + (if terminal) the MIDNIGHT cap. */
    function appendStep(stepNo, sBefore, leverId, reward, log, terminal) {
      const arrow = document.createElement('span');
      arrow.className = 'tape-arrow';
      arrow.textContent = '▶';
      tape.appendChild(arrow);

      const group = document.createElement('div');
      group.className = 's5-step';

      /* S_i -- the situation (shelf card) */
      const sBox = document.createElement('div');
      sBox.className = 's5-cell s5-cell-s';
      sBox.innerHTML = '<div class="s5-cell-label">' + T('scene5.col.situation') +
        ' <span class="s5-sub">S<sub>' + stepNo + '</sub></span></div>';
      sBox.appendChild(window.ShelfCard.render({ u: sBefore.u, d: sBefore.d }, { size: 'sm', label: false }));
      group.appendChild(sBox);

      /* A_i -- the lever pulled */
      const aBox = document.createElement('div');
      aBox.className = 's5-cell s5-cell-a';
      aBox.innerHTML = '<div class="s5-cell-label">' + T('scene5.col.lever') +
        ' <span class="s5-sub">A<sub>' + stepNo + '</sub></span></div>' +
        '<div class="s5-lever">' + leverTagHTML(leverId) + '</div>';
      group.appendChild(aBox);

      /* R_i -- cash collected */
      const rBox = document.createElement('div');
      rBox.className = 's5-cell s5-cell-r' + (reward > 0 ? ' is-sale' : ' is-nosale');
      const soldLine = log.sold > 0
        ? ('<div class="s5-r-sub">' + log.sold + ' ' + T('vocab.sold') + '</div>')
        : ('<div class="s5-r-sub s5-r-zero">0 ' + T('vocab.sold') + '</div>');
      rBox.innerHTML = '<div class="s5-cell-label">' + T('scene5.col.cash') +
        ' <span class="s5-sub">R<sub>' + stepNo + '</sub></span></div>' +
        '<div class="s5-r-amt">+$' + reward + '</div>' + soldLine;
      group.appendChild(rBox);

      tape.appendChild(group);

      if (terminal) {
        const arrow2 = document.createElement('span');
        arrow2.className = 'tape-arrow';
        arrow2.textContent = '▶';
        tape.appendChild(arrow2);

        const cap = document.createElement('div');
        cap.className = 's5-cap s5-cap-end';
        const soldout = !!log.soldout;
        const leftover = log.uAfter || 0;
        const title = soldout ? T('scene5.soldout') : T('scene5.midnight');
        const sub = soldout
          ? T('scene5.cleared')
          : (leftover > 0 ? T('scene5.leftover', { n: leftover }) : T('scene5.cleared'));
        cap.innerHTML =
          '<div class="s5-cap-label">S<sub>T</sub></div>' +
          '<div class="s5-midnight-card' + (soldout ? ' is-soldout' : '') + '">' +
            '<div class="s5-midnight-title">' + title + '</div>' +
            '<div class="s5-midnight-sub">' + sub + '</div>' +
          '</div>';
        tape.appendChild(cap);
      }
      scrollEnd();
    }

    /* Roll the demand for the current day and write the step into the tape
       (no animation). Shared by the animated and synchronous paths. */
    function commitStep() {
      const sBefore = { u: s.u, d: s.d };
      const leverId = policyLever(s);
      const out = P.sample(s, leverId, rng);
      appendStep(dayIdx, sBefore, leverId, out.reward, out.log, out.terminal);
      setRevenue(revenue + out.reward, out.reward > 0);
      dayIdx++;
      if (out.terminal) done = true;
      else s = out.sNext;
      return { leverId, k: out.log.k };
    }

    /* Advance one day with the signature DEMAND-DRAW flip, then commit the
       step. Returns a Promise that resolves when the step has settled. */
    function nextDay() {
      if (done || busy) return Promise.resolve();
      busy = true;
      updateStatus();
      const sBefore = { u: s.u, d: s.d };
      const leverId = policyLever(s);
      const out = P.sample(s, leverId, rng);
      const stepNo = dayIdx;
      return deck.flip({ lever: leverId, k: out.log.k }).then(() => {
        appendStep(stepNo, sBefore, leverId, out.reward, out.log, out.terminal);
        setRevenue(revenue + out.reward, out.reward > 0);
        dayIdx++;
        if (out.terminal) done = true;
        else s = out.sNext;
        deck.reset();
        busy = false;
        updateStatus();
      });
    }

    function stopPlay() {
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    }

    /* Auto-advance to the end of a run. Under &run (headless capture) we
       render every day synchronously so the whole tape + the MIDNIGHT cap
       land inside the screenshot's time budget; interactively we play the
       deck flip and leave a beat between days so the eye can follow. */
    function playRun() {
      stopPlay();
      if (done) reset(true);
      if (window.PRICING_AUTORUN) {
        let guard = 0;
        while (!done && guard++ < 8) commitStep();
        deck.reset();
        updateStatus();
        return;
      }
      function tick() {
        if (done) { stopPlay(); return; }
        nextDay().then(() => {
          if (!done) playTimer = setTimeout(tick, 360);
        });
      }
      tick();
    }

    stepBtn.addEventListener('click', () => { stopPlay(); nextDay(); });
    runBtn.addEventListener('click',  () => { reset(true); playRun(); });
    resetBtn.addEventListener('click',() => { reset(false); });

    /* Initial paint. */
    reset(false);

    /* &run: auto-play one full run for headless capture. */
    if (window.PRICING_AUTORUN) setTimeout(() => { reset(true); playRun(); }, 250);

    return {
      onEnter() { /* keep whatever is on screen; just refresh the status */ updateStatus(); },
      onLeave() { stopPlay(); },
      /* Right arrow = "do one more day" (matches NEXT DAY). The run is a
         short fixed-length rollout; the topbar NEXT advances the scene. */
      onNextKey() { if (done || busy) return false; stopPlay(); nextDay(); return true; },
      onPrevKey() { return false; },
    };
  };
})();

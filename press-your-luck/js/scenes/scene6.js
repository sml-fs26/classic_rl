/* Scene 6 - THE RETURN G_t.
 *
 *   MANAGER MEANING first: do not judge a lever by one lucky game. The
 *   payoff is a DISTRIBUTION; the honest figure is the win RATE over many
 *   games, not the last result.
 *
 *   FORMAL: the return is the payoff summed from a point onward,
 *
 *       G_i(tau) = sum_{j >= i} r_j .
 *
 *   Because reward is 0 every turn until the terminal win/loss, G_i is
 *   simply 1 if this game is eventually won, 0 if lost - so here the
 *   return IS the win/loss outcome from here on, a random 0/1.
 *
 *   We FIX one situation - (pot 18, EVEN) - force one chosen lever, and
 *   then play out the rest of the REAL game OPTIMALLY against the fixed
 *   rival (window.Pig). One play gives a single 0/1. Run hundreds and the
 *   0/1 outcomes collapse into a win-rate bar. ROLL ~ HOLD here (the
 *   exact DP says 0.818 vs 0.813) - close, with genuine game-to-game
 *   spread. One game tells you almost nothing; the average is the win
 *   probability.
 *
 *   Controls: choose the forced lever; PLAY 1 GAME (one 0/1, felt);
 *   PLAY 200 GAMES (accumulate the bar). &run auto-runs a big batch for
 *   headless capture. Values are computed via window.Pig / read from
 *   window.DATA.twist - never hand-typed.
 */
(function () {
  window.scenes = window.scenes || {};

  const Pig = window.Pig;
  const DATA = window.DATA;
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The fixed headline situation: pot 18, EVEN (my == riv). Read the
     representative scores + the exact DP win-probs straight from DATA. */
  const TW = DATA.twist.pot18.even;        // { my, riv, roll, hold, best }
  const FIX = { my: TW.my, riv: TW.riv, pot: 18 };
  const DP_WINPROB = { roll: TW.roll, hold: TW.hold };

  /* Play out ONE real game from FIX with the first lever forced, then
     OPTIMAL play to the end vs the fixed rival. Returns G (0 or 1). */
  function playOne(firstLever, rng) {
    let st = { my: FIX.my, riv: FIX.riv, pot: FIX.pot, turn: 'me', terminal: false };
    let out = Pig.sample(st, firstLever, rng);
    if (out.terminal) return out.win ? 1 : 0;
    st = out.sNext;
    for (let guard = 0; guard < 100000; guard++) {
      if (st.terminal) return st.win ? 1 : 0;
      if (st.turn === 'rival') {
        const rt = Pig.rivalTurn(st.my, st.riv, rng);
        if (rt.rivalWon) return 0;
        st = { my: rt.my, riv: rt.riv, pot: 0, turn: 'me', terminal: false };
        continue;
      }
      const q = Pig.Q(st.my, st.riv, st.pot);
      const lever = q.roll >= q.hold ? 'roll' : 'hold';
      out = Pig.sample(st, lever, rng);
      if (out.terminal) return out.win ? 1 : 0;
      st = out.sNext;
    }
    return 0;
  }

  window.scenes.scene6 = function (root) {
    root.className = 'scene-pad concept-scene';
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = T('scene6.heading');
    root.appendChild(heading);

    const lede = document.createElement('div');
    lede.className = 'concept-lede';
    lede.innerHTML = T('scene6.lede');
    root.appendChild(lede);

    /* ---- Formula card: G_i = sum of rewards = 0/1 here ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">' + T('scene6.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fcard.appendChild(fhost);
    window.Katex.render(
      String.raw`G_i(\tau) \;=\; \sum_{j \ge i} r_j \;=\; \begin{cases} 1 & \text{win from here} \\ 0 & \text{lose from here} \end{cases}`,
      fhost, true
    );
    const ffoot = document.createElement('div');
    ffoot.className = 'concept-formula-foot';
    ffoot.textContent = T('scene6.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- Experiment panel ---- */
    const panel = document.createElement('div');
    panel.className = 'ret-panel';
    root.appendChild(panel);

    /* Left: the fixed situation as a full table-card + lever selector. */
    const left = document.createElement('div');
    left.className = 'ret-left';
    left.innerHTML =
      '<div class="ret-fix-label">' + T('scene6.fix.label') + '</div>';
    const cardHost = document.createElement('div');
    cardHost.className = 'ret-card-host';
    left.appendChild(cardHost);

    const leverRow = document.createElement('div');
    leverRow.className = 'ret-lever-row';
    leverRow.innerHTML =
      '<div class="ret-lever-prompt">' + T('scene6.lever.prompt') + '</div>' +
      '<div class="ret-lever-btns">' +
        '<button class="poke-btn btn-roll ret-lever active" data-lever="roll">' + T('vocab.roll') + '</button>' +
        '<button class="poke-btn btn-hold ret-lever" data-lever="hold">' + T('vocab.hold') + '</button>' +
      '</div>';
    left.appendChild(leverRow);
    panel.appendChild(left);

    /* Right: one-game outcome strip + accumulating win-rate bar. */
    const right = document.createElement('div');
    right.className = 'ret-right';
    right.innerHTML =
      '<div class="ret-run-row">' +
        '<button class="poke-btn" id="ret-one">' + T('scene6.btn.one') + '</button>' +
        '<button class="poke-btn" id="ret-many">' + T('scene6.btn.many') + '</button>' +
        '<button class="poke-btn" id="ret-reset">' + T('scene6.btn.reset') + '</button>' +
      '</div>' +
      '<div class="ret-onegame" id="ret-onegame">' +
        '<span class="ret-onegame-label">' + T('scene6.one.label') + '</span>' +
        '<span class="ret-onegame-val" id="ret-onegame-val">-</span>' +
      '</div>' +
      '<div class="ret-strip-label">' + T('scene6.strip.label') + '</div>' +
      '<div class="ret-strip" id="ret-strip"></div>' +
      '<div class="ret-bar-wrap">' +
        '<div class="ret-bar" id="ret-bar">' +
          '<div class="ret-bar-win" id="ret-bar-win"></div>' +
          '<div class="ret-bar-lose" id="ret-bar-lose"></div>' +
        '</div>' +
        '<div class="ret-bar-readout" id="ret-bar-readout">' + T('scene6.bar.empty') + '</div>' +
      '</div>';
    panel.appendChild(right);

    /* ---- Bridge question ---- */
    const bridge = document.createElement('div');
    bridge.className = 'concept-key-question';
    bridge.textContent = T('scene6.bridge');
    root.appendChild(bridge);

    /* ---- Mount the fixed table-card ---- */
    const card = window.TableCard.mount(cardHost, { showVals: false });
    card.set({ my: FIX.my, riv: FIX.riv, pot: FIX.pot });

    /* ---- Experiment state ---- */
    let lever = 'roll';
    let rng = Pig.makeRng(0x5EED ^ 0x9999);
    let wins = 0, total = 0;
    const recent = [];                  // last N outcomes for the strip
    const STRIP_MAX = 40;

    const stripEl = document.getElementById('ret-strip');
    const oneValEl = document.getElementById('ret-onegame-val');
    const oneBox = document.getElementById('ret-onegame');
    const barWin = document.getElementById('ret-bar-win');
    const barLose = document.getElementById('ret-bar-lose');
    const barReadout = document.getElementById('ret-bar-readout');

    function resetRuns() {
      wins = 0; total = 0;
      recent.length = 0;
      rng = Pig.makeRng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
      oneValEl.textContent = '-';
      oneValEl.className = 'ret-onegame-val';
      oneBox.classList.remove('is-win', 'is-lose');
      renderStrip();
      renderBar();
    }

    function pushOutcome(g) {
      total++;
      if (g) wins++;
      recent.push(g);
      if (recent.length > STRIP_MAX) recent.shift();
    }

    function renderStrip() {
      let html = '';
      for (const g of recent) {
        html += '<span class="ret-chip ' + (g ? 'ret-chip-win' : 'ret-chip-lose') + '">' + (g ? '1' : '0') + '</span>';
      }
      stripEl.innerHTML = html || '<span class="ret-strip-empty">' + T('scene6.strip.empty') + '</span>';
    }

    function renderBar() {
      if (total === 0) {
        barWin.style.width = '0%';
        barLose.style.width = '0%';
        barReadout.textContent = T('scene6.bar.empty');
        return;
      }
      const rate = wins / total;
      barWin.style.width = (rate * 100).toFixed(2) + '%';
      barLose.style.width = ((1 - rate) * 100).toFixed(2) + '%';
      barWin.textContent = wins > 0 ? (rate * 100).toFixed(0) + '%' : '';
      const dpv = DP_WINPROB[lever];
      barReadout.innerHTML = T('scene6.bar.readout', {
        rate: (rate * 100).toFixed(1),
        wins: wins,
        total: total,
        dp: (dpv * 100).toFixed(1),
      });
    }

    function playOneGame() {
      const g = playOne(lever, rng);
      pushOutcome(g);
      oneValEl.textContent = g ? '+1 ' + T('vocab.win') : '0 ' + T('vocab.lose');
      oneValEl.className = 'ret-onegame-val ' + (g ? 'is-win' : 'is-lose');
      oneBox.classList.toggle('is-win', !!g);
      oneBox.classList.toggle('is-lose', !g);
      renderStrip();
      renderBar();
      if (window.SFX) window.SFX.play(g ? 'win' : 'loss');
    }

    function playManyGames(n) {
      for (let i = 0; i < n; i++) {
        const g = playOne(lever, rng);
        pushOutcome(g);
      }
      renderStrip();
      renderBar();
      if (window.SFX) window.SFX.play('cursor');
    }

    /* Lever selector. Switching the forced lever resets the tally (the
       outcomes were conditioned on the old lever). */
    leverRow.querySelectorAll('.ret-lever').forEach((btn) => {
      btn.addEventListener('click', () => {
        const l = btn.getAttribute('data-lever');
        if (l === lever) return;
        lever = l;
        leverRow.querySelectorAll('.ret-lever').forEach((b) => b.classList.toggle('active', b === btn));
        resetRuns();
      });
    });

    document.getElementById('ret-one').addEventListener('click', playOneGame);
    document.getElementById('ret-many').addEventListener('click', () => playManyGames(200));
    document.getElementById('ret-reset').addEventListener('click', resetRuns);

    renderStrip();
    renderBar();

    /* &run: auto-run a big batch so the win-rate bar is populated for the
       headless screenshot. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(() => playManyGames(600), 200);

    return {
      onEnter() { renderBar(); },
      onLeave() {},
    };
  };
})();

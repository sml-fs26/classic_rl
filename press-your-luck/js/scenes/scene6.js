/* Scene 6 - THE RETURN G_t and the objective E[G_t].
 *
 *   MANAGER MEANING first: do not judge a lever by one lucky game. The payoff
 *   is a DISTRIBUTION; the honest figure is the long-run WIN RATE, and that
 *   number is the EXPECTED return E[G_t].
 *
 *   FORMAL: the return is the payoff summed from a point onward,
 *       G_i(tau) = sum_{j >= i} r_j .
 *   Reward is 0 every turn until the terminal +1 (win) / 0 (lose), so G_i is a
 *   random 0 / 1 - the win/loss outcome from here on.
 *
 *   THE HEART (same hero tree as scene 5): E[G_t] is DEFINED, visibly, as the
 *   weighted sum over the tree's leaves (window.TrajTree's ledger),
 *       E[G_t] = sum_leaves P(path) * G_t(path),
 *   and for the hero root (my 29, riv 41, pot 12) under ROLL this sum is the
 *   win probability 0.687 = Q*(s, ROLL). A callout states it explicitly:
 *   G_t -> E[G_t] -> Q* in one frame. Hovering a ledger row lights that leaf's
 *   path: "one trajectory = one path." Asserted in code against the Bellman Q*.
 *
 *   THE EMPIRICAL COMPANION: from that very situation, force the first lever and
 *   play smart to the end. One game gives a 0 / 1; hundreds of games collapse
 *   into a win-rate bar whose running mean walks toward the ledger's computed
 *   E[G_t]. The exact DP win-prob is shown as the target it converges to.
 *   &run auto-runs a batch for the headless screenshot.
 */
(function () {
  window.scenes = window.scenes || {};

  const Pig = window.Pig;
  const PT  = window.PigTraj;
  const NB = Pig.POT_BUCKETS;
  const DANGER_BUCKET = NB - 1;
  const POT_LABELS = Pig.POT_BUCKET_LABELS;
  const STAND_CLASS = ['behind', 'even', 'ahead'];
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The same hero root the trajectory scene introduced, so the ledger reads
     against a tree the student already knows. */
  const HERO_ROOT = { my: 29, riv: 41, pot: 12, terminal: false, turn: 'me' };
  const HERO_LEVER = 'roll';

  function leverName(id) { return T('vocab.' + id); }
  function standName(st) { return T('vocab.' + STAND_CLASS[st]); }

  /* Compact inline table-card for a tree node (shared shape with scene 5). */
  function miniCardHtml(my, riv, pot, tag) {
    const pb = Pig.bucketOfPot(pot);
    const st = Pig.standingOf(my, riv);
    const tg = Pig.TARGET;
    let rows = '';
    for (let b = NB - 1; b >= 1; b--) {
      const on = b <= pb ? ' tc-chip-on' : '';
      const danger = b >= DANGER_BUCKET ? ' tc-chip-danger' : '';
      rows += '<div class="tc-chip-row' + danger + on + '"></div>';
    }
    const potDanger = pb >= DANGER_BUCKET ? ' tc-pot-danger' : '';
    const meter =
      '<div class="tc-pot-meter' + potDanger + '">' + rows +
        '<div class="tc-pot-label">' + POT_LABELS[pb] + '</div>' +
      '</div>';
    const pct = (v) => Math.max(0, Math.min(100, (v / tg) * 100));
    const badge =
      '<div class="tc-standing-badge tc-stand-' + STAND_CLASS[st] + '">' +
        '<div class="tc-bar-row tc-bar-you">' +
          '<span class="tc-bar-tag">' + T('vocab.you') + '</span>' +
          '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-you" style="width:' + pct(my) + '%"></span></span>' +
          '<span class="tc-bar-num tc-num-you">' + my + '</span>' +
        '</div>' +
        '<div class="tc-bar-row tc-bar-riv">' +
          '<span class="tc-bar-tag">' + T('vocab.rival') + '</span>' +
          '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-riv" style="width:' + pct(riv) + '%"></span></span>' +
          '<span class="tc-bar-num tc-num-riv">' + riv + '</span>' +
        '</div>' +
        '<div class="tc-standing-tag">' + standName(st) + '</div>' +
      '</div>';
    return (tag ? '<div class="tt-node-tag">' + tag + '</div>' : '') +
      '<div class="table-card table-card-compact traj-mini-card">' + meter + badge + '</div>';
  }

  function renderNode(state, ctx) {
    const host = ctx.el;
    if (state && state.terminal) {
      const won = !!state.win;
      if (host.parentNode) host.parentNode.classList.add(won ? 'win' : 'loss');
      host.innerHTML =
        '<div class="tt-leaf-final ' + (won ? 'win' : 'loss') + '">' +
          '<span class="tt-leaf-glyph">' + (won ? '✓' : '✗') + '</span>' +
          '<span class="tt-leaf-word">' + (won ? T('vocab.win') : T('vocab.lose')) + '</span>' +
        '</div>';
      return;
    }
    const big = (ctx.role === 'root');
    const rival = (state && state.turn === 'rival');
    if (rival && host.parentNode) host.parentNode.classList.add('tt-node-rival');
    host.innerHTML =
      (rival ? '<div class="tt-node-rival-tag">' + T('scene5.rival.tag') + '</div>' : '') +
      miniCardHtml(state.my, state.riv, state.pot || 0, big ? 'S<sub>1</sub>' : null);
  }

  /* Play out ONE real game from the hero situation with the first lever forced,
     then OPTIMAL play to the end vs the fixed rival. Returns G in {0, 1}. */
  function playOne(firstLever, rng) {
    let st = { my: HERO_ROOT.my, riv: HERO_ROOT.riv, pot: HERO_ROOT.pot, turn: 'me', terminal: false };
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

    /*, G_i formula card, */
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

    /*, The trajectory tree + weighted-leaf ledger (the E[G_t] reveal), */
    const egLabel = document.createElement('div');
    egLabel.className = 'obj-eg-label';
    egLabel.innerHTML = T('scene6.eg.label', {
      stand: standName(Pig.standingOf(HERO_ROOT.my, HERO_ROOT.riv)),
      pot: POT_LABELS[Pig.bucketOfPot(HERO_ROOT.pot)],
      lever: leverName(HERO_LEVER),
    });
    root.appendChild(egLabel);

    const treeHost = document.createElement('div');
    treeHost.className = 'obj-tree-host';
    root.appendChild(treeHost);

    let groundTruth;
    try { groundTruth = PT.qStar(HERO_ROOT, HERO_LEVER); } catch (e) { groundTruth = undefined; }

    const tt = window.TrajTree.mount(treeHost, {
      engine: { successors: PT.successors, isTerminal: PT.isTerminal, stateKey: PT.stateKey },
      rootState: HERO_ROOT,
      rootAction: HERO_LEVER,
      expandPolicy: PT.optimalLever,
      maxDepth: 1, maxLeaves: 12, gamma: 1,
      valueFn: PT.valueFn,
      bootstrapFrontier: true,
      renderNode: renderNode,
      actionLabel: (id) => leverName(id),
      layout: 'v',
      sfx: window.SFX || null,
      assertValue: groundTruth != null ? groundTruth : undefined,
      assertTol: 1e-6,
    });

    /* "= Q*" callout: the weighted leaf sum IS the win probability = Q* here. */
    const egTie = document.createElement('div');
    egTie.className = 'obj-eg-tie';
    egTie.innerHTML = T('scene6.eg.tie', {
      eg: window.TrajTree._fmt.fmtSigned2(tt.getEG()),
      pct: (tt.getEG() * 100).toFixed(1),
    });
    root.appendChild(egTie);

    /*, Q* formula card (the objective is the MAX expected return), */
    const c2 = document.createElement('div');
    c2.className = 'concept-formula-card';
    c2.innerHTML = '<div class="concept-formula-label">' + T('scene6.qstar.label') + '</div>';
    const f2 = document.createElement('div');
    c2.appendChild(f2);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \max\; \mathbb{E}\!\left[\, G_i(\tau) \,\right] \;=\; \mathbb{P}(\text{win} \mid s, a, \text{play smart})`,
      f2, true
    );
    const foot2 = document.createElement('div');
    foot2.className = 'concept-formula-foot';
    foot2.textContent = T('scene6.qstar.foot');
    c2.appendChild(foot2);
    root.appendChild(c2);

    /*, The empirical companion: sample games, watch the mean converge, */
    const exp = document.createElement('div');
    exp.className = 'ret-exp collapsed';
    exp.innerHTML =
      '<div class="ret-exp-title">' +
        '<span class="ret-exp-caret">&#9654;</span> ' + T('scene6.exp.title') +
        '<span class="ret-exp-hint">' + T('scene6.exp.hint') + '</span>' +
      '</div>' +
      '<div class="ret-exp-body">' +
        '<div class="ret-exp-explainer">' + T('scene6.exp.explainer') + '</div>' +
        '<div class="ret-run-row">' +
          '<div class="ret-lever-prompt">' + T('scene6.lever.prompt') + '</div>' +
          '<button class="poke-btn btn-roll ret-lever active" data-lever="roll">' + T('vocab.roll') + '</button>' +
          '<button class="poke-btn btn-hold ret-lever" data-lever="hold">' + T('vocab.hold') + '</button>' +
        '</div>' +
        '<div class="ret-run-row">' +
          '<button class="poke-btn" id="ret-one">' + T('scene6.btn.one') + '</button>' +
          '<button class="poke-btn" id="ret-many">' + T('scene6.btn.many') + '</button>' +
          '<button class="poke-btn" id="ret-reset">' + T('scene6.btn.reset') + '</button>' +
          '<span class="ret-onegame" id="ret-onegame">' +
            '<span class="ret-onegame-label">' + T('scene6.one.label') + '</span>' +
            '<span class="ret-onegame-val" id="ret-onegame-val">-</span>' +
          '</span>' +
        '</div>' +
        '<div class="ret-strip-label">' + T('scene6.strip.label') + '</div>' +
        '<div class="ret-strip" id="ret-strip"></div>' +
        '<div class="ret-bar-wrap">' +
          '<div class="ret-bar" id="ret-bar">' +
            '<div class="ret-bar-win" id="ret-bar-win"></div>' +
            '<div class="ret-bar-lose" id="ret-bar-lose"></div>' +
          '</div>' +
          '<div class="ret-bar-readout" id="ret-bar-readout">' + T('scene6.bar.empty') + '</div>' +
        '</div>' +
      '</div>';
    root.appendChild(exp);

    exp.querySelector('.ret-exp-title').addEventListener('click', () => {
      exp.classList.toggle('collapsed');
      const c = exp.querySelector('.ret-exp-caret');
      if (c) c.innerHTML = exp.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
    });

    /*, Bridge question, */
    const bridge = document.createElement('div');
    bridge.className = 'concept-key-question';
    bridge.textContent = T('scene6.bridge');
    root.appendChild(bridge);

    /*, Experiment state, */
    let lever = 'roll';
    let rng = Pig.makeRng(0x5EED ^ 0x9999);
    let wins = 0, total = 0;
    const recent = [];
    const STRIP_MAX = 40;

    const stripEl = exp.querySelector('#ret-strip');
    const oneValEl = exp.querySelector('#ret-onegame-val');
    const oneBox = exp.querySelector('#ret-onegame');
    const barWin = exp.querySelector('#ret-bar-win');
    const barLose = exp.querySelector('#ret-bar-lose');
    const barReadout = exp.querySelector('#ret-bar-readout');

    /* The target the running mean converges to: for the forced lever, the
       EXACT win prob from the engine (= the ledger's E[G_t] for ROLL). */
    function targetFor(l) { return PT.qStar(HERO_ROOT, l); }

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
    function pushOutcome(g) { total++; if (g) wins++; recent.push(g); if (recent.length > STRIP_MAX) recent.shift(); }
    function renderStrip() {
      let html = '';
      for (const g of recent) html += '<span class="ret-chip ' + (g ? 'ret-chip-win' : 'ret-chip-lose') + '">' + (g ? '1' : '0') + '</span>';
      stripEl.innerHTML = html || '<span class="ret-strip-empty">' + T('scene6.strip.empty') + '</span>';
    }
    function renderBar() {
      const dpv = targetFor(lever);
      if (total === 0) {
        barWin.style.width = '0%'; barLose.style.width = '0%';
        barReadout.innerHTML = T('scene6.bar.empty') + ' <span class="ret-dp">' + T('scene6.bar.target', { dp: (dpv * 100).toFixed(1) }) + '</span>';
        return;
      }
      const rate = wins / total;
      barWin.style.width = (rate * 100).toFixed(2) + '%';
      barLose.style.width = ((1 - rate) * 100).toFixed(2) + '%';
      barWin.textContent = wins > 0 ? (rate * 100).toFixed(0) + '%' : '';
      barReadout.innerHTML = T('scene6.bar.readout', {
        rate: (rate * 100).toFixed(1), wins: wins, total: total, dp: (dpv * 100).toFixed(1),
      });
    }
    function playOneGame() {
      const g = playOne(lever, rng);
      pushOutcome(g);
      oneValEl.textContent = g ? '+1 ' + T('vocab.win') : '0 ' + T('vocab.lose');
      oneValEl.className = 'ret-onegame-val ' + (g ? 'is-win' : 'is-lose');
      oneBox.classList.toggle('is-win', !!g);
      oneBox.classList.toggle('is-lose', !g);
      renderStrip(); renderBar();
      if (window.SFX) window.SFX.play(g ? 'win' : 'loss');
    }
    function playManyGames(n) {
      for (let i = 0; i < n; i++) pushOutcome(playOne(lever, rng));
      renderStrip(); renderBar();
      if (window.SFX) window.SFX.play('cursor');
    }

    exp.querySelectorAll('.ret-lever').forEach((btn) => {
      btn.addEventListener('click', () => {
        const l = btn.getAttribute('data-lever');
        if (l === lever) return;
        lever = l;
        exp.querySelectorAll('.ret-lever').forEach((b) => b.classList.toggle('active', b === btn));
        resetRuns();
      });
    });
    exp.querySelector('#ret-one').addEventListener('click', playOneGame);
    exp.querySelector('#ret-many').addEventListener('click', () => playManyGames(200));
    exp.querySelector('#ret-reset').addEventListener('click', resetRuns);

    renderStrip();
    renderBar();

    /* &run or &exp: expand the experiment and run a batch so the converging
       bar + target are visible (also for headless capture). */
    if (/[#&?](run|exp)\b/.test(window.location.hash)) {
      exp.classList.remove('collapsed');
      const c = exp.querySelector('.ret-exp-caret');
      if (c) c.innerHTML = '&#9660;';
      setTimeout(() => playManyGames(600), 200);
    }

    return {
      onEnter() { renderBar(); },
      onLeave() {},
    };
  };
})();

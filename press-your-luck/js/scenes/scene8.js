/* Scene 8 - the Bellman optimality equation, in the Press Your Luck idiom.
 *
 *   Manager meaning first: "what is one more roll worth?" - the value of a
 *   lever now is its immediate payoff plus the value of wherever the roll
 *   lands you, played on by the best lever there. Then the formal card
 *   Q*(s, a) = E[ R + max_a' Q*(S', a') ], read in plain English.
 *
 *   The heart is a WORKED ONE-STEP BACKUP of ROLL from a pot of 20 in an
 *   EVEN game (my=20, riv=20):
 *     - 1/6 BUST (a rolled 1): pot wiped, back to an even game, empty pot.
 *     - 5/6 GROW (a 2-6): the pot climbs past 20 and it is your move again.
 *   Every branch value is read LIVE off window.Pig (the solved exact DP) so
 *   nothing is hand-typed, and the six branches recombine to Q*(ROLL).
 *
 *   It closes on the knife-edge identity: expected roll gain
 *   (2+3+4+5+6)/6 = 3.33 exactly equals the bust risk 20 * 1/6 = 3.33, so a
 *   pot of 20 is the break-even for an even game - and the live Q*(ROLL) vs
 *   Q*(HOLD) are a whisker apart right at that edge.
 *
 *   No interactive gating; cold entry rebuilds from window.Pig / window.DATA.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The EVEN representative scores + the break-even pot we back up from. */
  const EVEN = (window.Pig && window.Pig.STANDING_REP)
    ? window.Pig.STANDING_REP[1] : { my: 20, riv: 20 };
  const BACKUP_POT = 20;                       // the knife-edge pot
  const GROW_FACES = (window.Pig && window.Pig.ROLL_GAIN) || [2, 3, 4, 5, 6];

  function pct(v) { return (v * 100).toFixed(1) + '%'; }
  function p2(v) { return Number(v).toFixed(2); }
  function p3(v) { return Number(v).toFixed(3); }

  /* Read the exact one-step backup of ROLL from (my, riv, pot) off the solved
     engine. Every value is a win probability; nothing is hand-typed. */
  function computeBackup() {
    const P = window.Pig;
    P.solve();
    const my = EVEN.my, riv = EVEN.riv, pot = BACKUP_POT;
    const q = P.Q(my, riv, pot);                       // { roll, hold }
    const bust = P.rivalTurnValue(my, riv);            // face 1: turn passes, my unchanged
    const grow = GROW_FACES.map(function (f) {
      return { face: f, pot: pot + f, v: P.winProb(my, riv, pot + f) };
    });
    const growAvg = grow.reduce(function (a, g) { return a + g.v; }, 0) / grow.length;
    return { my: my, riv: riv, pot: pot, q: q, bust: bust, grow: grow, growAvg: growAvg };
  }

  window.scenes.scene8 = function (root) {
    root.className = 'scene-pad s8-scene';
    root.innerHTML = '';

    const bk = computeBackup();

    /* ---- Heading + manager framing ---- */
    const h = document.createElement('h2');
    h.className = 's8-heading';
    h.textContent = T('s8.heading');
    root.appendChild(h);

    const mgr = document.createElement('div');
    mgr.className = 's8-manager';
    mgr.textContent = T('s8.manager');
    root.appendChild(mgr);

    /* ---- Bellman optimality formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 's8-formula-card';
    fcard.innerHTML = '<div class="s8-card-label">' + T('s8.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fhost.className = 's8-formula';
    fcard.appendChild(fhost);
    window.Katex.render(
      (window.DATA && window.DATA.tex && window.DATA.tex.bellman) ||
        "Q^*(s, a) = \\mathbb{E}\\,[\\, R + \\max_{a'} Q^*(S', a') \\,]",
      fhost, true
    );
    /* Tiny token legend so the abstract symbols map to the words. */
    const legend = document.createElement('div');
    legend.className = 's8-legend';
    legend.innerHTML =
      '<span class="s8-leg s8-leg-now"><i></i>' + T('s8.legend.now') + '</span>' +
      '<span class="s8-leg s8-leg-next"><i></i>' + T('s8.legend.next') + '</span>' +
      '<span class="s8-leg s8-leg-exp"><i></i>' + T('s8.legend.exp') + '</span>';
    fcard.appendChild(legend);
    const read = document.createElement('div');
    read.className = 's8-card-read';
    read.textContent = T('s8.formula.read');
    fcard.appendChild(read);
    root.appendChild(fcard);

    /* ---- The worked one-step backup ---- */
    const backup = document.createElement('div');
    backup.className = 's8-backup';
    root.appendChild(backup);

    const bTitle = document.createElement('div');
    bTitle.className = 's8-backup-title';
    bTitle.textContent = T('s8.backup.title');
    backup.appendChild(bTitle);

    /* Top row: the state-icon (table-card for pot-20 EVEN) + the intro text. */
    const topRow = document.createElement('div');
    topRow.className = 's8-backup-top';
    backup.appendChild(topRow);

    const cardHost = document.createElement('div');
    cardHost.className = 's8-state-card';
    topRow.appendChild(cardHost);
    const card = window.TableCard.mount(cardHost, {});
    card.set({ pot: bk.pot, my: bk.my, riv: bk.riv });

    const intro = document.createElement('div');
    intro.className = 's8-backup-intro';
    intro.textContent = T('s8.backup.intro', { my: bk.my, riv: bk.riv, pot: bk.pot });
    topRow.appendChild(intro);

    /* Two branch panels: BUST (1/6) and GROW (5/6). */
    const branches = document.createElement('div');
    branches.className = 's8-branches';
    backup.appendChild(branches);

    /* -- BUST branch -- */
    const bust = document.createElement('div');
    bust.className = 's8-branch s8-branch-bust';
    bust.innerHTML =
      '<div class="s8-branch-head">' +
        '<span class="s8-branch-p">P = 1/6</span>' +
        '<span class="s8-branch-name">' + T('s8.backup.bustHead') + '</span>' +
      '</div>' +
      '<div class="s8-branch-body">' + T('s8.backup.bustBody') + '</div>' +
      '<div class="s8-branch-val">' +
        '<span class="s8-val-label">' + T('s8.backup.bustTerm') + '</span>' +
        '<span class="s8-val-num">' + p2(bk.bust) + '</span>' +
      '</div>';
    branches.appendChild(bust);

    /* -- GROW branch -- */
    const grow = document.createElement('div');
    grow.className = 's8-branch s8-branch-grow';
    let growRows = '';
    for (const g of bk.grow) {
      growRows +=
        '<div class="s8-grow-row">' +
          '<span class="s8-grow-face">' + T('s8.backup.growRow', { face: g.face, pot: g.pot }) + '</span>' +
          '<span class="s8-grow-bar"><span class="s8-grow-fill" style="width:' + pct(g.v) + '"></span></span>' +
          '<span class="s8-grow-v">' + p2(g.v) + '</span>' +
        '</div>';
    }
    grow.innerHTML =
      '<div class="s8-branch-head">' +
        '<span class="s8-branch-p">P = 5/6</span>' +
        '<span class="s8-branch-name">' + T('s8.backup.growHead') + '</span>' +
      '</div>' +
      '<div class="s8-branch-body">' + T('s8.backup.growBody') + '</div>' +
      '<div class="s8-grow-rows">' + growRows + '</div>' +
      '<div class="s8-branch-val">' +
        '<span class="s8-val-label">' + T('s8.backup.growAvg') + '</span>' +
        '<span class="s8-val-num">' + p2(bk.growAvg) + '</span>' +
      '</div>';
    branches.appendChild(grow);

    /* -- Put it together -- */
    const sum = document.createElement('div');
    sum.className = 's8-sum';
    const g = bk.grow;
    sum.innerHTML =
      '<div class="s8-sum-label">' + T('s8.backup.sum.label') + '</div>' +
      '<div class="s8-sum-line s8-sum-roll">' + T('s8.backup.sum.roll') + '</div>' +
      '<div class="s8-sum-line s8-sum-num">' +
        T('s8.backup.sum.rollNum', {
          bust: p2(bk.bust),
          g2: p2(g[0].v), g3: p2(g[1].v), g4: p2(g[2].v), g5: p2(g[3].v), g6: p2(g[4].v),
        }) +
      '</div>' +
      '<div class="s8-sum-verdict-row">' +
        '<div class="s8-sum-q s8-sum-q-roll">' +
          T('s8.backup.sum.rollVal', { roll: p3(bk.q.roll) }) +
        '</div>' +
        '<div class="s8-sum-q s8-sum-q-hold">' +
          T('s8.backup.sum.holdVal', { hold: p3(bk.q.hold) }) +
        '</div>' +
      '</div>' +
      '<div class="s8-sum-verdict">' + T('s8.backup.sum.verdict') + '</div>';
    backup.appendChild(sum);

    /* ---- The knife-edge identity ---- */
    const knife = document.createElement('div');
    knife.className = 's8-knife';
    knife.innerHTML = '<div class="s8-card-label">' + T('s8.knife.title') + '</div>';
    const kbody = document.createElement('div');
    kbody.className = 's8-knife-body';
    kbody.textContent = T('s8.knife.body');
    knife.appendChild(kbody);

    /* Two scales: gain vs risk, each labelled, then the identity formula. */
    const scales = document.createElement('div');
    scales.className = 's8-knife-scales';
    scales.innerHTML =
      '<div class="s8-scale s8-scale-gain">' +
        '<div class="s8-scale-label">' + T('s8.knife.gain') + '</div>' +
        '<div class="s8-scale-eq" id="s8-gain"></div>' +
      '</div>' +
      '<div class="s8-scale-vs">=</div>' +
      '<div class="s8-scale s8-scale-risk">' +
        '<div class="s8-scale-label">' + T('s8.knife.risk') + '</div>' +
        '<div class="s8-scale-eq" id="s8-risk"></div>' +
      '</div>';
    knife.appendChild(scales);
    window.Katex.render('\\tfrac{2+3+4+5+6}{6} = 3.33', scales.querySelector('#s8-gain'), false);
    window.Katex.render('20 \\cdot \\tfrac{1}{6} = 3.33', scales.querySelector('#s8-risk'), false);

    const identBox = document.createElement('div');
    identBox.className = 's8-knife-ident';
    const identF = document.createElement('div');
    identBox.appendChild(identF);
    window.Katex.render(
      (window.DATA && window.DATA.tex && window.DATA.tex.breakEven) ||
        '\\tfrac{2+3+4+5+6}{6} = 3.33 = 20 \\cdot \\tfrac{1}{6}',
      identF, true
    );
    knife.appendChild(identBox);

    const kident = document.createElement('div');
    kident.className = 's8-knife-text';
    kident.textContent = T('s8.knife.identity');
    knife.appendChild(kident);
    root.appendChild(knife);

    /* ---- Bridge to the DP scene ---- */
    const bridge = document.createElement('div');
    bridge.className = 's8-bridge';
    bridge.textContent = T('s8.bridge');
    root.appendChild(bridge);

    return {};
  };
})();

/* Scene 6, Return G_t. Fix a $5 start and a chosen FIRST stake (bold or
   timid), then play OPTIMALLY afterward and stack the 0/1 outcomes into a bar.
   The running win-rate converges to the exact Q*($5, first stake): ~0.318
   (bold) vs ~0.311 (timid). Live Monte-Carlo; cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Gambler, D = window.DATA || {};
  const policyBets = D.policy || [];

  /* one episode: forced first stake at $5, then optimal */
  function episode(firstStakeId, rng) {
    let s = { cap: 5, terminal: false }, first = true, guard = 0, won = 0;
    while (!s.terminal && guard++ < 200) {
      const stakeId = first ? firstStakeId : policyBets[G.stateIndex(s)];
      first = false;
      const out = G.sample(s, stakeId, rng);
      if (out.reward > 0) won = 1;
      s = out.sNext;
    }
    return won;
  }

  window.scenes.scene6 = function (root) {
    root.className = 'scene scene-pad sc6';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene6.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene6.lede') + '</p>' +
      '<div class="formula-card sc6-formula">' +
        '<div class="formula-label">' + T('scene6.formulaLabel') + '</div>' +
        '<div class="sc6-formula-host"></div>' +
      '</div>' +
      '<p class="sc6-setup muted">' + T('scene6.setup') + '</p>' +
      '<div class="gr-btn-row sc6-ctrls">' +
        '<button class="gr-btn sc6-first primary" data-stake="bet3" type="button">' + T('scene6.bold') + '</button>' +
        '<button class="gr-btn sc6-first" data-stake="bet1" type="button">' + T('scene6.timid') + '</button>' +
        '<span class="sc6-gap"></span>' +
        '<button class="gr-btn sc6-run" type="button">' + T('scene6.run') + '</button>' +
        '<button class="gr-btn sc6-run1" type="button">' + T('scene6.run1') + '</button>' +
        '<button class="gr-btn sc6-reset" type="button">' + T('scene6.reset') + '</button>' +
      '</div>' +
      '<div class="sc6-board">' +
        '<div class="sc6-stats hud-strip">' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.attempts') + '</span><span class="hud-val tnum" id="sc6-n">0</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.winrate') + '</span><span class="hud-val tnum pos" id="sc6-wr">--</span></div>' +
          '<div class="hud-item"><span class="hud-label">' + T('scene6.exact') + '</span><span class="hud-val tnum" id="sc6-ex">--</span></div>' +
        '</div>' +
        '<div class="sc6-bar"><div class="sc6-bar-fill" id="sc6-fill"></div><div class="sc6-bar-target" id="sc6-target"></div></div>' +
        '<div class="sc6-dots" id="sc6-dots"></div>' +
      '</div>' +
      '<p class="sc6-note muted">' + T('scene6.note') + '</p>' +
      '<div class="poke-box sc6-framing">' + T('scene6.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.return) || 'G_i = \\sum_{j \\ge i} r_j \\in \\{0,1\\}',
      root.querySelector('.sc6-formula-host'), true);

    let firstStake = 'bet3';
    let n = 0, wins = 0;
    let rng = G.makeRng((Math.random() * 1e9) >>> 0);
    const dotsEl = root.querySelector('#sc6-dots');

    function exactFor(id) {
      const sq = D.spotQ && D.spotQ.c5 && D.spotQ.c5.q;
      return sq && sq[id] != null ? sq[id] : (id === 'bet3' ? 0.3176 : 0.3108);
    }
    function refresh() {
      root.querySelector('#sc6-n').textContent = String(n);
      const wr = n ? wins / n : 0;
      root.querySelector('#sc6-wr').textContent = n ? wr.toFixed(3) : '--';
      const ex = exactFor(firstStake);
      root.querySelector('#sc6-ex').textContent = ex.toFixed(3);
      root.querySelector('#sc6-fill').style.width = (wr * 100).toFixed(1) + '%';
      root.querySelector('#sc6-target').style.left = (ex * 100).toFixed(1) + '%';
    }
    function reset() {
      n = 0; wins = 0; dotsEl.innerHTML = '';
      rng = G.makeRng((Math.random() * 1e9) >>> 0);
      refresh();
    }
    function addDot(won) {
      if (dotsEl.children.length < 400) {
        const d = document.createElement('span');
        d.className = 'sc6-dot ' + (won ? 'win' : 'loss');
        dotsEl.appendChild(d);
      }
    }
    function runMany(count) {
      for (let i = 0; i < count; i++) {
        const won = episode(firstStake, rng);
        n++; if (won) wins++;
        addDot(won);
      }
      refresh();
    }

    root.querySelectorAll('.sc6-first').forEach((b) => {
      b.addEventListener('click', () => {
        firstStake = b.dataset.stake;
        root.querySelectorAll('.sc6-first').forEach(x => x.classList.toggle('primary', x === b));
        reset();
      });
    });
    root.querySelector('.sc6-run').addEventListener('click', () => runMany(200));
    root.querySelector('.sc6-run1').addEventListener('click', () => runMany(1));
    root.querySelector('.sc6-reset').addEventListener('click', reset);

    reset();
    if (window.GR && window.GR.run) { rng = G.makeRng(7); runMany(200); }

    return { onEnter() { refresh(); } };
  };
})();

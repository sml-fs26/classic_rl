/* Scene 4 — SARSA learns it from scratch.
 *
 *   Board + side panel. The agent has no access to V — only the SARSA update
 *   with ε-greedy on Q. Autoplay scrubber over precomputed snapshots.
 *   At each snapshot: per-square argmax-die badges from current Q.
 *   Click any square → side panel shows that square's three Q-values as bars.
 *   Bottom: learning curve (turns-per-episode), current snapshot highlighted.
 *
 *   The α and ε for the training run are pinned in DATA.params.sarsa and
 *   rendered as readouts (not interactive sliders) — retraining 2000 episodes
 *   in the browser on every slider tick would freeze the page. Students see
 *   what's being trained, not a knob that does nothing.
 *
 *   Cold-entry: requires DATA.sarsa. Falls back to a placeholder if missing.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  function shouldAutoRun() {
    return /[#&?]run\b/.test(window.location.hash);
  }

  window.scenes.scene4 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene4-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>SARSA learns it from scratch.</h1>' +
      '<p class="subtitle">Same algorithm as the cliff-walk. No V, no model — only samples.</p>';
    wrap.appendChild(hero);

    /* SARSA equation */
    const formula = document.createElement('div');
    formula.className = 'formula-block';
    window.Katex.render(window.DATA.tex.sarsa, formula, true);
    wrap.appendChild(formula);

    const S = window.DATA && window.DATA.sarsa;
    if (!S || !S.snapshots) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML =
        '<p class="caption">SARSA training data is missing — run ' +
        '<code>node precompute/build-datasets.js</code> from the viz folder.</p>';
      wrap.appendChild(empty);
      return {};
    }

    const snapshots = S.snapshots;
    const SNAP_EPS = snapshots.map(s => s.episode);
    const params = S.config;

    const layout = document.createElement('div');
    layout.className = 's-layout';
    wrap.appendChild(layout);

    const left = document.createElement('div');
    left.className = 's-left';
    layout.appendChild(left);
    const rail = document.createElement('div');
    rail.className = 's-rail';
    layout.appendChild(rail);

    /* Board */
    const boardHost = document.createElement('div');
    boardHost.className = 'scene4-board';
    left.appendChild(boardHost);
    const board = window.Board.mount(boardHost);
    const cfg = window.DATA.board;
    board.drawJumps(cfg.snakes, cfg.ladders);
    board.setTokenVisible(false);

    /* Controls row: snapshot scrubber. */
    const scrubWrap = document.createElement('div');
    scrubWrap.className = 'scrubber';
    left.appendChild(scrubWrap);
    const scrLabel = document.createElement('span');
    scrLabel.className = 'scr-label';
    scrLabel.textContent = 'episode 0';
    scrubWrap.appendChild(scrLabel);
    const scrInput = document.createElement('input');
    scrInput.type = 'range';
    scrInput.min = '0';
    scrInput.max = String(SNAP_EPS.length - 1);
    scrInput.step = '1';
    scrInput.value = '0';
    scrubWrap.appendChild(scrInput);
    const scrSnaps = document.createElement('div');
    scrSnaps.className = 'scr-snapshots';
    scrubWrap.appendChild(scrSnaps);
    const snapEls = [];
    for (let i = 0; i < SNAP_EPS.length; i++) {
      const el = document.createElement('span');
      el.className = 'scr-snap';
      el.textContent = String(SNAP_EPS[i]);
      el.dataset.idx = String(i);
      el.addEventListener('click', () => { scrInput.value = String(i); render(); });
      scrSnaps.appendChild(el);
      snapEls.push(el);
    }

    /* Play button below — autoplay through snapshots. */
    const ctrl = document.createElement('div');
    ctrl.className = 'controls';
    left.appendChild(ctrl);
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'primary';
    playBtn.textContent = 'Play training';
    const grp = document.createElement('div');
    grp.className = 'control-group';
    grp.appendChild(playBtn);
    ctrl.appendChild(grp);

    /* Mix strip */
    const mixStrip = document.createElement('div');
    mixStrip.className = 'policy-mix-strip';
    mixStrip.innerHTML =
      '<span class="pm-label">current Q-policy mix</span>' +
      '<span class="pm-die"><span class="die-pill die-d4">d4</span><span id="s4-pm-d4">—</span></span>' +
      '<span class="pm-die"><span class="die-pill die-d6">d6</span><span id="s4-pm-d6">—</span></span>' +
      '<span class="pm-die"><span class="die-pill die-d8">d8</span><span id="s4-pm-d8">—</span></span>' +
      '<span class="pm-die"><span class="pm-label">unvisited</span><span id="s4-pm-zero">—</span></span>';
    left.appendChild(mixStrip);

    /* Caption */
    const cap = document.createElement('p');
    cap.className = 'caption';
    cap.textContent =
      'Click any square to see its three Q-values as bars. The highlighted bar is the argmax — the die SARSA currently prefers there.';
    left.appendChild(cap);

    /* Rail: Q-bar panel + learning curve + training config. */
    const railTitle = document.createElement('div');
    railTitle.className = 'rail-title';
    railTitle.textContent = 'Q at the selected square';
    rail.appendChild(railTitle);

    const qPanelHost = document.createElement('div');
    rail.appendChild(qPanelHost);
    const qPanel = window.QTable.mountQBars(qPanelHost);

    const cfgTitle = document.createElement('div');
    cfgTitle.className = 'rail-title';
    cfgTitle.style.marginTop = '8px';
    cfgTitle.textContent = 'Training settings';
    rail.appendChild(cfgTitle);

    const cfgCard = document.createElement('div');
    cfgCard.className = 'card';
    cfgCard.innerHTML =
      '<div class="vi-stat-row"><span class="vi-k">α (Robbins-Monro)</span><span class="vi-v">' + params.alpha.toFixed(2) + '</span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">ε (exploration)</span><span class="vi-v">' + params.epsilon.toFixed(2) + '</span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">γ (discount)</span><span class="vi-v">' + params.gamma.toFixed(2) + '</span></div>' +
      '<div class="vi-stat-row"><span class="vi-k">episodes</span><span class="vi-v">' + params.episodes + '</span></div>';
    rail.appendChild(cfgCard);

    const curveTitle = document.createElement('div');
    curveTitle.className = 'rail-title';
    curveTitle.style.marginTop = '8px';
    curveTitle.textContent = 'Turns per episode';
    rail.appendChild(curveTitle);

    const curveHost = document.createElement('div');
    curveHost.className = 'scene4-curve';
    rail.appendChild(curveHost);
    const curve = window.LearningCurve.mount(curveHost, { W: 320, H: 140, window: 50 });

    /* --------- State ---------- */
    let selectedSquare = 1;

    function snapAt(idx) {
      const sn = snapshots[idx];
      if (!sn) return new Float32Array(300);
      return window.SARSA.fromSnapshot(sn.Q);
    }

    function update() {
      const idx = parseInt(scrInput.value, 10);
      const ep = SNAP_EPS[idx];
      scrLabel.textContent = 'episode ' + ep;
      for (let i = 0; i < snapEls.length; i++) {
        snapEls[i].classList.toggle('active', i === idx);
      }
      const Q = snapAt(idx);
      /* Re-render badges. */
      window.QTable.renderBadgesFromQ(board, Q);

      /* Mix strip — count argmax over squares where row has any non-zero. */
      let d4 = 0, d6 = 0, d8 = 0, zero = 0;
      for (let s = 1; s <= 99; s++) {
        const r = window.SARSA.row(Q, s);
        if (r.d4 === 0 && r.d6 === 0 && r.d8 === 0) { zero++; continue; }
        let best = r.d4, k = 'd4';
        if (r.d6 > best) { best = r.d6; k = 'd6'; }
        if (r.d8 > best) { best = r.d8; k = 'd8'; }
        if (k === 'd4') d4++;
        else if (k === 'd6') d6++;
        else d8++;
      }
      document.getElementById('s4-pm-d4').textContent = d4;
      document.getElementById('s4-pm-d6').textContent = d6;
      document.getElementById('s4-pm-d8').textContent = d8;
      document.getElementById('s4-pm-zero').textContent = zero;

      /* Q-bar panel — refresh selected. */
      qPanel.update(selectedSquare, Q);
      board.highlightCell(selectedSquare);

      /* Learning curve — show full series, cursor at this episode. */
      curve.setData(S.turnsPerEpisode);
      curve.setCursor(Math.max(0, ep - 1));
    }

    scrInput.addEventListener('input', update);

    /* Click-cell-for-Q. */
    board.onCellClick((n) => {
      if (n === 100) return;
      selectedSquare = n;
      update();
    });

    /* Play button: autoplay through snapshots. */
    let playing = false;
    let playTimer = null;
    function stopPlay() {
      playing = false;
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      playBtn.textContent = 'Play training';
    }
    function startPlay() {
      if (playing) { stopPlay(); return; }
      playing = true;
      playBtn.textContent = 'Pause';
      let i = parseInt(scrInput.value, 10);
      if (i >= SNAP_EPS.length - 1) i = 0;
      function tick() {
        if (!playing) return;
        scrInput.value = String(i);
        update();
        if (i >= SNAP_EPS.length - 1) { stopPlay(); return; }
        i += 1;
        playTimer = setTimeout(tick, 700);
      }
      tick();
    }
    playBtn.addEventListener('click', startPlay);

    /* Initial render. */
    update();
    if (shouldAutoRun()) setTimeout(startPlay, 250);

    return {
      onEnter() {},
      onLeave() { stopPlay(); },
      onNextKey() {
        if (playing) return true;
        const i = parseInt(scrInput.value, 10);
        if (i >= SNAP_EPS.length - 1) return false;
        scrInput.value = String(i + 1);
        update();
        return true;
      },
      onPrevKey() {
        if (playing) return true;
        const i = parseInt(scrInput.value, 10);
        if (i <= 0) return false;
        scrInput.value = String(i - 1);
        update();
        return true;
      },
    };
  };
})();

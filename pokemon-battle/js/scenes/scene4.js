/* Scene 4 — SARSA learns it.
 *
 * Precomputed SARSA Q-snapshots at log-spaced episodes [0, 1, 5, 25, 100, 500,
 * 2000]. Scrubber selects an episode; Q-table re-renders; learning curve marks
 * the cursor.
 *
 * Layout:
 *   - Top: ε / α / γ menu rows (read-only display of the precompute config).
 *   - Center: scrubber (range + snapshot pills).
 *   - 9×4 Q-table (literal numerical render).
 *   - Learning curve.
 */
(function () {
  window.scenes = window.scenes || {};

  function moveShort(id) { return window.QTable.shortMoveLabel(id); }

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad');
    root.innerHTML = '';

    const cfg = window.DATA.params.sarsa;
    const snapshots = window.DATA.sarsa.snapshots;
    const rewardSeries = window.DATA.sarsa.rewardPerEpisode;

    /* Header. */
    const heading = document.createElement('h2');
    heading.className = 'poke-section-title';
    heading.textContent = 'SARSA — PIKACHU LEARNS Q FROM ITS OWN BATTLES';
    root.appendChild(heading);

    /* Param rows. */
    const params = document.createElement('div');
    params.className = 'sc4-params';
    params.innerHTML =
      '<div class="poke-menu-row"><span>&epsilon;</span><span class="val">' + cfg.epsilon.toFixed(2) + '</span></div>' +
      '<div class="poke-menu-row"><span>&alpha;</span><span class="val">' + cfg.alpha.toFixed(2) + '</span></div>' +
      '<div class="poke-menu-row"><span>&gamma;</span><span class="val">' + cfg.gamma.toFixed(2) + '</span></div>' +
      '<div class="poke-menu-row"><span>EPISODES</span><span class="val">' + cfg.episodes + '</span></div>';
    root.appendChild(params);

    /* Scrubber. */
    const scrub = document.createElement('div');
    scrub.className = 'scrubber';
    scrub.innerHTML =
      '<div class="scr-label">EP: <span id="sc4-ep">0</span></div>' +
      '<input type="range" id="sc4-range" min="0" max="' + (snapshots.length - 1) + '" step="1" value="0">' +
      '<div class="scr-snapshots" id="sc4-snaps"></div>';
    root.appendChild(scrub);
    const snapsHost = scrub.querySelector('#sc4-snaps');
    for (let i = 0; i < snapshots.length; i++) {
      const pill = document.createElement('button');
      pill.className = 'scr-snap';
      pill.type = 'button';
      pill.textContent = String(snapshots[i].episode);
      pill.dataset.idx = String(i);
      pill.addEventListener('click', () => setCursor(i));
      snapsHost.appendChild(pill);
    }

    /* Q-table. */
    const qHost = document.createElement('div');
    qHost.className = 'sc4-q';
    root.appendChild(qHost);
    const qtbl = window.QTable.mount(qHost);

    /* Learning curve. */
    const lcWrap = document.createElement('div');
    lcWrap.className = 'sc4-lc-wrap';
    root.appendChild(lcWrap);
    const lcHeader = document.createElement('div');
    lcHeader.className = 'poke-section-title sc4-lc-header';
    lcHeader.textContent = 'WIN-RATE PER EPISODE';
    lcWrap.appendChild(lcHeader);
    const lcHost = document.createElement('div');
    lcWrap.appendChild(lcHost);
    const lc = window.LearningCurve.mount(lcHost, { window: 100 });
    lc.setData(rewardSeries);

    /* SARSA formula card. */
    const fcard = document.createElement('div');
    fcard.className = 'poke-formula';
    window.Katex.render(window.DATA.tex.sarsa, fcard, true);
    root.appendChild(fcard);

    const caption = document.createElement('div');
    caption.className = 'poke-caption';
    caption.innerHTML =
      'Same algorithm as the cliff-walk and Snakes &amp; Ladders. ' +
      'No Bellman shortcut — Pikachu just samples battles and pulls Q toward (r + γ·Q(s′, a′)). ' +
      'The yellow flash marks cells whose value moved between this snapshot and the previous one.';
    root.appendChild(caption);

    /* ---------- State ---------- */
    function setCursor(i) {
      i = Math.max(0, Math.min(snapshots.length - 1, i));
      const snap = snapshots[i];
      document.getElementById('sc4-ep').textContent = String(snap.episode);
      const range = document.getElementById('sc4-range');
      if (parseInt(range.value, 10) !== i) range.value = String(i);
      const qArr = snap.Q;
      const Q = new Float32Array(qArr.length);
      for (let k = 0; k < qArr.length; k++) Q[k] = qArr[k];
      qtbl.update(Q);
      lc.setCursor(snap.episode);
      const pills = scrub.querySelectorAll('.scr-snap');
      pills.forEach((p, k) => p.classList.toggle('active', k === i));
    }

    const range = scrub.querySelector('#sc4-range');
    range.addEventListener('input', () => setCursor(parseInt(range.value, 10)));

    /* Default — start at episode 0. */
    setCursor(0);

    /* &run flag: auto-scrub to the final snapshot. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) {
      let i = 0;
      function adv() {
        if (i >= snapshots.length) return;
        setCursor(i);
        i++;
        if (i < snapshots.length) setTimeout(adv, 500);
      }
      setTimeout(adv, 200);
    }

    return {
      onEnter() {
        /* Re-render at the current snapshot. */
        const r = parseInt(range.value, 10);
        setCursor(r);
      },
      onNextKey() {
        const i = parseInt(range.value, 10);
        if (i < snapshots.length - 1) { setCursor(i + 1); return true; }
        return false;
      },
      onPrevKey() {
        const i = parseInt(range.value, 10);
        if (i > 0) { setCursor(i - 1); return true; }
        return false;
      },
    };
  };
})();

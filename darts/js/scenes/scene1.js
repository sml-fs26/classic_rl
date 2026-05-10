/* Scene 1 — manual throwing.

   The student gets a single horizontal track with their player marker.
   The bullseye is HIDDEN — they're in the dark. They use ↑/↓ to move
   ±5 units, a/d (or buttons) to move ±1 unit, and SPACE to throw.
   ArrowLeft/Right are reserved for the scene driver (advance/back).

   The throw oscillates the bullseye, computes a noisy score, and drops a
   chip on the track at the throw position with the score number above
   it. A score history list on the right keeps the last 12 throws.

   Cold-entry safe — onEnter rebuilds from DATA. */
(function () {
  if (!window.scenes) window.scenes = {};

  const HUD_FIELDS = [
    { key: 'round',       label: 'round' },
    { key: 'currentPos',  label: 'current_score' },   // notebook vocab: player_pos
    { key: 'lastScore',   label: 'last score' },
    { key: 'avgScore',    label: 'avg score' },
    { key: 'bestScore',   label: 'best score' },
  ];

  function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  window.scenes.scene1 = function (root) {
    const data = window.DATA || {};
    const noiseStd = (data.params && data.params.noiseStd) || 6;
    const seed = (data.seeds && data.seeds.manual) || 0x42A1B7C1;

    /* ----- DOM scaffold ------------------------------------------------ */

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's1-wrap';

    const intro = document.createElement('p');
    intro.className = 'caption s1-intro';
    intro.textContent = "Throw a few darts. The bullseye is hidden. The score is your only signal.";
    wrap.appendChild(intro);

    const twoCol = document.createElement('div');
    twoCol.className = 'two-col s1-cols';
    wrap.appendChild(twoCol);

    /* Left column: track + controls + caption */
    const left = document.createElement('div');
    left.className = 'col-stack';

    const trackHost = document.createElement('div');
    trackHost.className = 's1-track-host';
    left.appendChild(trackHost);

    const caption = document.createElement('p');
    caption.className = 'caption s1-caption';
    caption.textContent = '';
    left.appendChild(caption);

    const controls = document.createElement('div');
    controls.className = 'controls s1-controls';
    /* Throw button */
    const throwGroup = document.createElement('div');
    throwGroup.className = 'control-group';
    const throwBtn = document.createElement('button');
    throwBtn.type = 'button';
    throwBtn.className = 'primary';
    throwBtn.textContent = 'throw  ␣';
    throwGroup.appendChild(throwBtn);
    /* Move buttons */
    const moveGroup = document.createElement('div');
    moveGroup.className = 'control-group';
    const moveLabel = document.createElement('label');
    moveLabel.textContent = 'move';
    moveGroup.appendChild(moveLabel);
    const m1 = document.createElement('button');  m1.type='button';  m1.textContent = '−5  ↓';
    const m2 = document.createElement('button');  m2.type='button';  m2.textContent = '−1  a';
    const m3 = document.createElement('button');  m3.type='button';  m3.textContent = '+1  d';
    const m4 = document.createElement('button');  m4.type='button';  m4.textContent = '+5  ↑';
    [m1, m2, m3, m4].forEach(b => moveGroup.appendChild(b));
    /* Reset */
    const resetGroup = document.createElement('div');
    resetGroup.className = 'control-group';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'reset  r';
    resetGroup.appendChild(resetBtn);

    controls.appendChild(throwGroup);
    controls.appendChild(moveGroup);
    controls.appendChild(resetGroup);
    left.appendChild(controls);

    twoCol.appendChild(left);

    /* Right column: HUD + score history */
    const right = document.createElement('div');
    right.className = 'col-stack';

    const hud = document.createElement('div');
    hud.className = 'hud s1-hud';
    const hudCells = {};
    for (const f of HUD_FIELDS) {
      const row = document.createElement('div');
      row.className = 'hud-row';
      const lbl = document.createElement('div');
      lbl.className = 'hud-label';
      lbl.textContent = f.label;
      const val = document.createElement('div');
      val.className = 'hud-value';
      val.textContent = '—';
      row.appendChild(lbl);
      row.appendChild(val);
      hud.appendChild(row);
      hudCells[f.key] = { row, val };
    }
    right.appendChild(hud);

    const histTitle = document.createElement('div');
    histTitle.className = 's1-hist-title';
    histTitle.textContent = 'recent throws';
    right.appendChild(histTitle);

    const histList = document.createElement('div');
    histList.className = 'score-list';
    const histHead = document.createElement('div');
    histHead.className = 'score-row head';
    histHead.innerHTML = '<div>#</div><div>position</div><div>score</div>';
    histList.appendChild(histHead);
    right.appendChild(histList);

    twoCol.appendChild(right);

    const footnote = document.createElement('p');
    footnote.className = 'footnote s1-foot';
    footnote.innerHTML =
      '<kbd class="kbd">␣</kbd> throw  ·  ' +
      '<kbd class="kbd">↑ ↓</kbd> move ±5  ·  ' +
      '<kbd class="kbd">a d</kbd> move ±1  ·  ' +
      '<kbd class="kbd">r</kbd> reset  ·  ' +
      '<kbd class="kbd">← →</kbd> advance the scene.';
    wrap.appendChild(footnote);

    root.appendChild(wrap);

    /* ----- Track + state ------------------------------------------------ */

    const track = window.Track.mount({
      host: trackHost,
      label: 'position (0–100) — bullseye hidden',
      showBullseye: false,
      showEstimate: false,
      showChips: true,
    });

    let state = null;

    function reset() {
      const rng = makeRng(seed);
      const bullseyeStart = rng() < 0.5
        ? 10 + rng() * 15
        : 75 + rng() * 15;
      state = {
        rng,
        playerPos: 50,
        bullseyePos: bullseyeStart,
        bullseyeMean: bullseyeStart,
        round: 0,
        scores: [],
        history: [],
      };
      track.clearChips();
      histList.innerHTML = '';
      histList.appendChild(histHead);
      track.setPlayer(state.playerPos);
      caption.textContent = "Use the buttons or keys. SPACE to throw.";
      renderHud();
    }

    function oscillateBullseye() {
      const noise = clamp(gauss(state.rng) * 2, -5, 5);
      const a = 0.85;
      state.bullseyePos = clamp(
        state.bullseyeMean + a * (state.bullseyePos - state.bullseyeMean) + noise,
        10, 90
      );
    }

    function move(d) {
      state.playerPos = clamp(state.playerPos + d, 2, 98);
      track.setPlayer(state.playerPos);
      renderHud();
    }

    function throwDart() {
      oscillateBullseye();
      const base = Math.max(0, 100 - 2 * Math.abs(state.playerPos - state.bullseyePos));
      const noisy = clamp(base + gauss(state.rng) * noiseStd, 0, 100);
      state.round += 1;
      state.scores.push(noisy);
      state.history.unshift({
        round: state.round,
        pos: state.playerPos,
        score: noisy,
      });
      track.addChip({ pos: state.playerPos, score: noisy, maxChips: 14 });
      track.flashPlayer();
      renderHud();
      renderHistory();
      caption.textContent = updateCaption();
    }

    function renderHud() {
      const scores = state.scores;
      const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
      const best = scores.length ? Math.max(...scores) : 0;
      const last = scores.length ? scores[scores.length-1] : null;
      hudCells.round.val.textContent = String(state.round);
      hudCells.currentPos.val.textContent = state.playerPos.toFixed(1);
      hudCells.lastScore.val.textContent = last == null ? '—' : last.toFixed(1);
      hudCells.avgScore.val.textContent = scores.length ? avg.toFixed(1) : '—';
      hudCells.bestScore.val.textContent = scores.length ? best.toFixed(1) : '—';
      hudCells.lastScore.row.classList.remove('flash');
      if (last != null) {
        void hudCells.lastScore.row.offsetWidth;
        hudCells.lastScore.row.classList.add('flash');
      }
    }

    function renderHistory() {
      histList.innerHTML = '';
      histList.appendChild(histHead);
      const slice = state.history.slice(0, 12);
      for (const h of slice) {
        const row = document.createElement('div');
        row.className = 'score-row';
        row.innerHTML =
          `<div>${h.round}</div>` +
          `<div>${h.pos.toFixed(1)}</div>` +
          `<div>${h.score.toFixed(1)}</div>`;
        histList.appendChild(row);
      }
    }

    function updateCaption() {
      if (state.round < 3)  return "Try a few throws to feel the noise.";
      if (state.round < 10) return "Watch the chips. High-scoring positions tend to cluster.";
      if (state.round < 20) return "Notice that even the same position scores differently each time. The bullseye oscillates.";
      return "After enough throws, you can guess where the bullseye is — roughly. Click forward.";
    }

    /* ----- Bindings ----------------------------------------------------- */

    throwBtn.addEventListener('click', throwDart);
    m1.addEventListener('click', () => move(-5));
    m2.addEventListener('click', () => move(-1));
    m3.addEventListener('click', () => move(+1));
    m4.addEventListener('click', () => move(+5));
    resetBtn.addEventListener('click', reset);

    function onKey(e) {
      if (e.target && /input|textarea|select|button/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); throwDart(); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); move(+5); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(-5); return; }
      if (e.key === 'a' || e.key === 'A') { move(-1); return; }
      if (e.key === 'd' || e.key === 'D') { move(+1); return; }
      if (e.key === 'r' || e.key === 'R') { reset(); return; }
    }

    /* Cold-entry safe: onEnter resets and renders. */
    reset();
    window.addEventListener('keydown', onKey);

    return {
      onEnter() {
        reset();
        window.addEventListener('keydown', onKey);
      },
      onLeave() {
        window.removeEventListener('keydown', onKey);
      },
      onNextKey() { return false; },   // ArrowRight always advances scene
      onPrevKey() { return false; },   // ArrowLeft always returns to scene 0
    };
  };
})();

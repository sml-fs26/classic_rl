/* Scene — S, the state set.
 *
 *   First piece of the MDP ⟨S, A, P, R, γ⟩. The battle's state space is
 *   the 5×5 grid of (your HP bucket × opp HP bucket): 25 cells. We draw
 *   the grid literally, one cell per state, each cell rendering the
 *   form-aware opp sprite (Charmander/Charmeleon/Charizard) at its
 *   bucket-appropriate HP color. Clicking a cell highlights it; the
 *   highlighted cell drives the focus row + sprite preview on the right.
 *
 *   Pedagogy: students arrive thinking "state = HP" (continuous). The
 *   grid makes the *discretization* and *finiteness* visible — every
 *   battle situation lives in one of these 25 cells, period.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB      = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;

  function bucketName(b) { return BUCKETS[b].toUpperCase(); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }

  window.scenes.sceneMdpStates = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'S — THE STATE SET';
    root.appendChild(heading);

    /* ---- Formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">STATE = (PIKACHU HP, OPPONENT HP)</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`S \;=\; \bigl\{\, (h_{\text{pika}},\, h_{\text{opp}}) \;:\; h_\bullet \in \{\text{FULL, HIGH, MID, LOW, CRIT}\} \,\bigr\}, \quad |S| = 25`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = '5 buckets per side · 25 non-terminal cells · click any cell.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* ---- The grid ---- */
    const wrap = document.createElement('div');
    wrap.className = 'mdp-states-wrap';
    root.appendChild(wrap);

    const gridSide = document.createElement('div');
    gridSide.className = 'mdp-states-gridside';
    wrap.appendChild(gridSide);

    const colHeader = document.createElement('div');
    colHeader.className = 'mdp-states-col-header';
    colHeader.innerHTML = '<div class="mdp-states-corner-label">opp →<br>pika ↓</div>';
    for (let o = 0; o < NB; o++) {
      const h = document.createElement('div');
      h.className = 'mdp-states-col-axis';
      h.textContent = bucketName(o);
      colHeader.appendChild(h);
    }
    gridSide.appendChild(colHeader);

    const grid = document.createElement('div');
    grid.className = 'mdp-states-grid';
    gridSide.appendChild(grid);

    /* Right column: focus cell preview. */
    const focusSide = document.createElement('div');
    focusSide.className = 'mdp-states-focusside';
    wrap.appendChild(focusSide);

    let focusY = 0, focusO = 0;

    function renderFocus() {
      const oppName = window.Battle.displayNameForOpp(focusO);
      const oppSrc  = window.Battle.spriteForOpp(focusO);
      focusSide.innerHTML =
        '<div class="mdp-focus-title">STATE s</div>' +
        '<div class="mdp-focus-coords">PIKACHU = <strong>' + bucketName(focusY) + '</strong></div>' +
        '<div class="mdp-focus-coords">OPPONENT = <strong>' + oppName + ' / ' + bucketName(focusO) + '</strong></div>' +
        '<div class="mdp-focus-row">' +
          '<div class="mdp-focus-side">' +
            '<img class="mdp-focus-sprite" src="assets/pikachu-back.png" alt="PIKACHU">' +
            '<div class="mdp-focus-hp"><div class="mdp-focus-hp-fill ' + bucketClass(focusY) + '" style="width:' + bucketPct(focusY) + '%"></div></div>' +
            '<div class="mdp-focus-bucket">' + bucketName(focusY) + '</div>' +
          '</div>' +
          '<div class="mdp-focus-side">' +
            '<img class="mdp-focus-sprite" src="' + oppSrc + '" alt="' + oppName + '">' +
            '<div class="mdp-focus-hp"><div class="mdp-focus-hp-fill ' + bucketClass(focusO) + '" style="width:' + bucketPct(focusO) + '%"></div></div>' +
            '<div class="mdp-focus-bucket">' + bucketName(focusO) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="mdp-focus-note">The opponent\'s form shifts with its HP bucket — that\'s why action effects depend on state.</div>';
    }

    function renderGrid() {
      grid.innerHTML = '';
      for (let y = 0; y < NB; y++) {
        const rowLabel = document.createElement('div');
        rowLabel.className = 'mdp-states-row-axis';
        rowLabel.textContent = bucketName(y);
        grid.appendChild(rowLabel);
        for (let o = 0; o < NB; o++) {
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'mdp-states-cell';
          if (y === focusY && o === focusO) cell.classList.add('focused');
          const oppSrc = window.Battle.spriteForOpp(o, 'gen1');
          cell.innerHTML =
            '<img class="mdp-cell-sprite pika" src="assets/pikachu-back-gen1.png" alt="">' +
            '<img class="mdp-cell-sprite opp" src="' + oppSrc + '" alt="">' +
            '<div class="mdp-cell-hps">' +
              '<div class="mdp-cell-hp"><div class="mdp-cell-hp-fill ' + bucketClass(y) + '" style="width:' + bucketPct(y) + '%"></div></div>' +
              '<div class="mdp-cell-hp"><div class="mdp-cell-hp-fill ' + bucketClass(o) + '" style="width:' + bucketPct(o) + '%"></div></div>' +
            '</div>';
          cell.addEventListener('click', () => {
            focusY = y; focusO = o;
            renderGrid(); renderFocus();
          });
          grid.appendChild(cell);
        }
      }
    }

    renderGrid();
    renderFocus();

    /* ---- Closing caption ---- */
    const cap = document.createElement('div');
    cap.className = 'concept-key-question';
    cap.textContent = 'STATE = WHAT THE AGENT SEES BEFORE PICKING A MOVE.';
    root.appendChild(cap);

    return {};
  };
})();

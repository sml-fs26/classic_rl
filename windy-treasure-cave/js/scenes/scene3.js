/* Scene 3, Formalization: what makes this an MDP.
 *   Reveal the four parts one click at a time, each pinned to the board:
 *   S (the tile), A (the four headings), P (the wind, probabilistic), R (-1 per
 *   step / +10 gold / -10 pit). Builds the tuple <S, A, P, R> and makes the
 *   Markov point. Cold-entry safe; NEXT steps through the reveals then yields. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;

  const PARTS = ['state', 'action', 'transition', 'reward', 'tuple'];

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3 concept-scene';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene3.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene3.lede') + '</p>' +
      '<div class="scene-row sc3-row">' +
        '<div class="sc3-left"><div class="sc3-board-host"></div>' +
          '<div class="sc3-die-host"></div></div>' +
        '<div class="sc3-right scene-col grow">' +
          '<div class="sc3-cards"></div>' +
          '<div class="formula-card sc3-tuple-card" hidden>' +
            '<div class="formula-label">' + T('scene3.tupleLabel') + '</div>' +
            '<div class="sc3-tuple-host"></div>' +
            '<p class="formula-note">' + T('scene3.markov') + '</p>' +
          '</div>' +
          '<div class="wtc-btn-row sc3-ctrls">' +
            '<button class="wtc-btn primary sc3-reveal" type="button">' + T('scene3.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc3-framing">' + T('scene3.framing') + '</div>';

    const board = window.CaveBoard.mount(root.querySelector('.sc3-board-host'), { size: 'md' });
    board.setExplorer(C.START.row, C.START.col);
    const die = window.WindDie.mount(root.querySelector('.sc3-die-host'), { badge: T('die.badge') });
    die.set(8, 'left');
    const cardsHost = root.querySelector('.sc3-cards');

    let shown = 0;   // how many parts revealed

    function card(key) {
      return '<div class="formula-card sc3-card sc3-card-' + key + '">' +
        '<div class="formula-label"><span class="sc3-badge sc3-badge-' + key + '">' + T('scene3.' + key + '.tag') + '</span> ' + T('scene3.' + key + '.title') + '</div>' +
        '<div class="sc3-card-host" id="sc3-host-' + key + '"></div>' +
        '<p class="formula-note">' + T('scene3.' + key + '.note') + '</p>' +
      '</div>';
    }
    function renderTex(key) {
      const map = {
        state: D.tex && D.tex.state, action: D.tex && D.tex.actions,
        transition: D.tex && D.tex.transition, reward: 'R:\\ \\ -1\\ \\text{per step},\\ \\ +10\\ \\text{gold},\\ \\ -10\\ \\text{pit}',
      };
      const host = root.querySelector('#sc3-host-' + key);
      if (host && map[key]) window.Katex.render(map[key], host, true);
    }

    function highlightFor(key) {
      board.clearArrows(); board.clearValues(); board.clearHighlights();
      if (key === 'state') { board.highlight(C.START.row, C.START.col, true); }
      else if (key === 'action') {
        /* show the four headings emanating from the start tile */
        const g = []; for (let r = 0; r < C.ROWS; r++) { g.push([]); for (let c = 0; c < C.COLS; c++) g[r].push(null); }
        g[C.START.row][C.START.col] = 'RIGHT';
        board.highlight(C.START.row, C.START.col, true);
      }
      else if (key === 'transition') {
        /* highlight the three tiles the start-tile RIGHT can reach */
        board.highlight(C.START.row, C.START.col, true);
        die.set(8, 'left');
      }
      else if (key === 'reward') {
        board.setValues(D.valueGrid ? blankWithTerminals() : null, { decimals: 0 });
      }
    }
    function blankWithTerminals() {
      const g = []; for (let r = 0; r < C.ROWS; r++) { g.push([]); for (let c = 0; c < C.COLS; c++) g[r].push(null); }
      return g;  /* setValues still paints +10 / -10 on the terminals */
    }

    function reveal() {
      if (shown >= PARTS.length) return false;
      const key = PARTS[shown];
      if (key === 'tuple') {
        root.querySelector('.sc3-tuple-card').hidden = false;
        window.Katex.render(D.tex && D.tex.mdpTuple ? D.tex.mdpTuple : '\\langle S, A, P, R \\rangle', root.querySelector('.sc3-tuple-host'), true);
        board.clearHighlights();
        shown++;
        root.querySelector('.sc3-reveal').textContent = T('scene3.done');
        root.querySelector('.sc3-reveal').disabled = true;
        return true;
      }
      cardsHost.insertAdjacentHTML('beforeend', card(key));
      renderTex(key);
      highlightFor(key);
      shown++;
      if (shown === PARTS.length - 1) root.querySelector('.sc3-reveal').textContent = T('scene3.tupleBtn');
      return true;
    }

    root.querySelector('.sc3-reveal').addEventListener('click', reveal);
    reveal();   // show S immediately

    if (window.WTC && window.WTC.run) { for (let i = 0; i < PARTS.length; i++) reveal(); }

    return {
      onNextKey() { return reveal(); },
      onPrevKey() { return false; },
    };
  };
})();

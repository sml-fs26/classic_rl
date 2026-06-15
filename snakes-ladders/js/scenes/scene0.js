/* Scene 0, A children's game is an MDP.
 *
 *   Title card. Full 10×10 board with snakes and ladders drawn on top.
 *   Below the board: a 5-row mapping table, each row names one tuple element
 *   of the MDP and points at where it lives on the board.
 *
 *   Static, no step engine. Cold-entry safe.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene0 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene0-wrap';
    root.appendChild(wrap);

    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>A children’s game is an MDP.</h1>' +
      '<p class="subtitle">Snakes &amp; Ladders. The whole curriculum, on one board.</p>' +
      '<p class="lede">A 10×10 board, three dice to choose from, the goal at square 100. ' +
      'Every piece of the language we built, states, actions, transitions, rewards, ' +
      'discount, has a place here.</p>';
    wrap.appendChild(hero);

    const layout = document.createElement('div');
    layout.className = 'scene0-layout';
    wrap.appendChild(layout);

    /* Board on the left. */
    const boardHost = document.createElement('div');
    boardHost.className = 'scene0-board';
    layout.appendChild(boardHost);
    const board = window.Board.mount(boardHost);
    const cfg = (window.DATA && window.DATA.board) || { ladders: [], snakes: [] };
    board.drawJumps(cfg.snakes, cfg.ladders);
    /* Hide the token in scene 0, there is no player yet. */
    board.setTokenVisible(false);

    /* Mapping table on the right. */
    const table = document.createElement('div');
    table.className = 'mapping-table';
    layout.appendChild(table);

    const tableTitle = document.createElement('div');
    tableTitle.className = 'mapping-title';
    tableTitle.innerHTML = '<span class="mapping-tex"></span>';
    window.Katex.render(window.DATA.tex.mdpTuple, tableTitle.querySelector('.mapping-tex'), false);
    table.appendChild(tableTitle);

    const rows = [
      { sym: 'S', name: 'states',     desc: 'one per square: <span class="mono">1, 2, …, 100</span>' },
      { sym: 'A', name: 'actions',    desc: 'three dice, ' +
                                       '<span class="die-pill die-d4">d4</span> ' +
                                       '<span class="die-pill die-d6">d6</span> ' +
                                       '<span class="die-pill die-d8">d8</span>' },
      { sym: 'P', name: 'transition', desc: 'roll the die, then apply snake or ladder if any. Overshoot 100? Stay.' },
      { sym: 'R', name: 'reward',     desc: '<span class="mono">−1</span> per turn, <span class="mono">0</span> at square 100 (terminal)' },
      { sym: 'γ', name: 'discount',   desc: '0.95 by default. Lower = greedy in time. Higher = patient.' },
    ];
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'mapping-row';
      row.innerHTML =
        '<div class="mapping-sym">' + r.sym + '</div>' +
        '<div class="mapping-name">' + r.name + '</div>' +
        '<div class="mapping-desc">' + r.desc + '</div>';
      table.appendChild(row);
    }

    const closer = document.createElement('p');
    closer.className = 'caption scene0-closer';
    closer.textContent =
      'Five visualizations taught these five things separately. Here they all live in one game.';
    wrap.appendChild(closer);

    return {};
  };
})();

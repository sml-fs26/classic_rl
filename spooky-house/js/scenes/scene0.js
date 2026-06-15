/* Scene 0, Many states, one value each.

   First contact. The student opens the page; before any keystroke, they
   read what the lesson is about and meet the 5×5 grid. The reward number
   on every cell is the spookiness; the ghost-density visual is a second
   visual channel for that same number, so the eye learns "more ghosts =
   bigger reward" before any algorithm runs.

   This scene names the two vocabulary discontinuities the curriculum
   audit calls out: the action set is restricted to {right, down}, and
   the state is just (r, c), no moving ghosts. Both are honest about
   "we are not changing reinforcement learning, we are simplifying for
   the lesson". Cold-entry safe, built entirely from DATA. */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene0 = function (root) {
    const D = window.DATA && window.DATA.grid;
    if (!D) {
      root.innerHTML = '<p style="opacity:0.6">DATA missing</p>';
      return {};
    }

    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 's0-wrap';
    root.appendChild(wrap);

    /*, Hero, */
    const hero = document.createElement('div');
    hero.className = 'hero s0-hero';
    hero.innerHTML =
      '<h1>The spooky house.</h1>' +
      '<p class="subtitle">A grid where every cell is worth something. ' +
      'What’s the most you can collect on the way out?</p>' +
      '<p class="lede">Five rows, five columns, twenty-five rooms. ' +
      'Each room is haunted to a different degree, ' +
      'the number on every cell is its spookiness, from 1 (mildly bothersome) ' +
      'to 9 (full poltergeist). You start in the top-left, you need to reach ' +
      'the bottom-right, and you collect the spookiness of every room you visit.</p>';
    wrap.appendChild(hero);

    /*, Grid + side notes, */
    const row = document.createElement('div');
    row.className = 's0-grid-row';
    wrap.appendChild(row);

    const gridHost = document.createElement('div');
    gridHost.className = 'grid-host s0-grid-host';
    row.appendChild(gridHost);

    const side = document.createElement('div');
    side.className = 's0-side';
    row.appendChild(side);

    /*, Side: rules + state/action vocabulary, */
    const h2a = document.createElement('h2');
    h2a.textContent = 'The rules.';
    side.appendChild(h2a);

    const rules = document.createElement('ol');
    rules.className = 's0-rules';
    rules.innerHTML =
      '<li>Start at <code>(0, 0)</code>, exit at <code>(4, 4)</code>.</li>' +
      '<li>Each step moves <em>right</em> or <em>down</em> only.</li>' +
      '<li>Collect the spookiness of every cell you stand on.</li>' +
      '<li>Maximise your total. The path is your strategy.</li>';
    side.appendChild(rules);

    const h2b = document.createElement('h2');
    h2b.textContent = 'The vocabulary.';
    side.appendChild(h2b);

    const stateLine = document.createElement('p');
    const stateInline = window.Katex.inline(window.DATA.tex.stateTuple);
    stateLine.appendChild(document.createTextNode('A state is just '));
    stateLine.appendChild(stateInline);
    stateLine.appendChild(document.createTextNode(', a coordinate. No moving ghosts; the spookiness is baked into the room.'));
    side.appendChild(stateLine);

    const actLine = document.createElement('p');
    const actInline = window.Katex.inline(window.DATA.tex.actionSet);
    actLine.appendChild(document.createTextNode('The action set is '));
    actLine.appendChild(actInline);
    actLine.appendChild(document.createTextNode('. Smaller than ANYmal’s, on purpose.'));
    side.appendChild(actLine);

    const muted = document.createElement('p');
    muted.className = 'muted';
    muted.textContent =
      'Twenty-five states. Two actions. Eight steps to the exit. ' +
      'How hard could it be?';
    side.appendChild(muted);

    /*, Mount the grid, */
    const grid = window.Grid.mount(gridHost, {
      M: D.M,
      N: D.N,
      rewards: D.rewards,
      showRewards: true,
      showGhosts: true,
      onLayout: () => placeEntities(),
    });

    function placeEntities() {
      grid.setEntity('anymal', { kind: 'anymal', r: D.start.r, c: D.start.c });
      grid.setEntity('door',   { kind: 'door',   r: D.goal.r,  c: D.goal.c  });
    }
    placeEntities();

    /* Mark start and goal cells with a small text annotation. */
    grid.setCellClass(D.start.r, D.start.c, 'start-cell', true);
    grid.setCellClass(D.goal.r,  D.goal.c,  'goal-cell',  true);

    /*, Footnote, */
    const foot = document.createElement('p');
    foot.className = 'footnote';
    foot.textContent = 'Press → to start picking a path.';
    wrap.appendChild(foot);

    return {};
  };
})();

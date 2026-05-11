/* Numerical 9×4 Q-table render for scene 4.
 *
 * The Pokemon battle MDP has only 9 non-terminal states and 4 moves, so the
 * Q-table fits as a literal table on the page. Cells flash with a Pikachu-
 * yellow border when their value updates between snapshots, and the argmax
 * column per row is highlighted.
 */
(function () {
  const ACTIONS = window.Moves.MOVE_IDS;
  const STATES = window.Bellman.STATES;
  const A = ACTIONS.length;
  const N = STATES.length;

  function shortMoveLabel(id) {
    switch (id) {
      case 'quick_attack': return 'QUICK';
      case 'thunderbolt':  return 'BOLT';
      case 'iron_tail':    return 'IRON';
      case 'thunder':      return 'THUN';
    }
    return id;
  }

  function stateLabel(s) {
    return s.your.toUpperCase() + ' / ' + s.opp.toUpperCase();
  }

  /* Mount a Q-table into `host`. Returns a controller with update(Q, opts). */
  function mount(host) {
    host.classList.add('qtable-host');
    host.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const hCorner = document.createElement('th');
    hCorner.textContent = 'STATE';
    hCorner.style.fontSize = '7px';
    headRow.appendChild(hCorner);
    for (const m of ACTIONS) {
      const th = document.createElement('th');
      th.textContent = shortMoveLabel(m);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const cellNodes = [];  /* indexed [stateIdx][moveIdx] -> <td> */
    for (let s = 0; s < N; s++) {
      const tr = document.createElement('tr');
      const td0 = document.createElement('td');
      td0.className = 'state-head';
      td0.textContent = stateLabel(STATES[s]);
      tr.appendChild(td0);
      cellNodes[s] = [];
      for (let a = 0; a < A; a++) {
        const td = document.createElement('td');
        td.textContent = '0.00';
        tr.appendChild(td);
        cellNodes[s][a] = td;
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    host.appendChild(table);

    /* Previous Q-snapshot kept so we can mark which cells *changed*. */
    let prevQ = null;

    function update(Q, opts) {
      const o = opts || {};
      for (let s = 0; s < N; s++) {
        const base = s * A;
        /* Compute the argmax across the row. */
        let m = Q[base], k = 0;
        let allZero = true;
        for (let a = 0; a < A; a++) {
          if (Q[base + a] !== 0) allZero = false;
          if (Q[base + a] > m) { m = Q[base + a]; k = a; }
        }
        for (let a = 0; a < A; a++) {
          const td = cellNodes[s][a];
          const v = Q[base + a];
          td.textContent = v.toFixed(2);
          td.classList.toggle('argmax', !allZero && a === k);
          /* Flash if value changed materially. */
          if (prevQ && Math.abs(prevQ[base + a] - v) > 0.01) {
            td.classList.remove('flash');
            void td.offsetWidth;
            td.classList.add('flash');
          } else if (o.suppressFlash) {
            td.classList.remove('flash');
          }
        }
      }
      /* Take a copy of Q for next diff. */
      prevQ = new Float32Array(Q);
    }

    function reset() {
      prevQ = null;
      for (let s = 0; s < N; s++) {
        for (let a = 0; a < A; a++) {
          cellNodes[s][a].textContent = '0.00';
          cellNodes[s][a].classList.remove('argmax', 'flash');
        }
      }
    }

    return { update, reset, host };
  }

  /* Sum the per-move policy frequencies across rows (using argmax). */
  function moveFrequencies(Q) {
    const c = {};
    for (const m of ACTIONS) c[m] = 0;
    for (let s = 0; s < N; s++) {
      const base = s * A;
      let m = Q[base], k = 0;
      let allZero = true;
      for (let a = 0; a < A; a++) {
        if (Q[base + a] !== 0) allZero = false;
        if (Q[base + a] > m) { m = Q[base + a]; k = a; }
      }
      if (!allZero) c[ACTIONS[k]]++;
    }
    return c;
  }

  window.QTable = { mount, moveFrequencies, shortMoveLabel, stateLabel };
})();

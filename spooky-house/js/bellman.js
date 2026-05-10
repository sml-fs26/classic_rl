/* Bellman recursion utilities for the Spooky House viz.

   The pedagogy is: V(r, c) = R(r, c) + γ · max(V(r+1, c), V(r, c+1)),
   solved on a 5×5 reward grid by a single backward sweep (no iteration —
   right/down on a finite-horizon DAG, so antidiagonals fill cleanly).

   Pure functions throughout: every scene rebuilds V on demand from
   (rewards, gamma) so cold-entry via the dot pager always works. No
   dependency on prior scene state. */
(function () {
  const ACTIONS = ['right', 'down'];
  const DELTAS = {
    right: { dr: 0, dc: 1 },
    down:  { dr: 1, dc: 0 },
  };

  function dims(rewards) {
    const M = rewards.length;
    const N = M > 0 ? rewards[0].length : 0;
    return { M, N };
  }

  /* V(r, c) under deterministic right/down dynamics.
     Backward sweep order: any traversal where (r+1, c) and (r, c+1) are
     filled before (r, c). The natural order is reverse row-major:
       for r from M-1 downto 0:
         for c from N-1 downto 0:
     which is what we do here. The animated sweep in scene 3 walks the same
     order (anti-diagonals fall out the same way for visual purposes). */
  function computeV(rewards, gamma) {
    const { M, N } = dims(rewards);
    const V = [];
    for (let r = 0; r < M; r++) V.push(new Array(N).fill(0));
    for (let r = M - 1; r >= 0; r--) {
      for (let c = N - 1; c >= 0; c--) {
        const reward = rewards[r][c];
        let best = 0;
        const downValid = r + 1 < M;
        const rightValid = c + 1 < N;
        if (!downValid && !rightValid) {
          best = 0;
        } else if (!downValid) {
          best = V[r][c + 1];
        } else if (!rightValid) {
          best = V[r + 1][c];
        } else {
          best = Math.max(V[r + 1][c], V[r][c + 1]);
        }
        V[r][c] = reward + gamma * best;
      }
    }
    return V;
  }

  /* The greedy *policy* derived from V: at each cell, point to the higher-V
     neighbour (right vs down). Returns a 2D array of policy entries
       { down: bool, right: bool }
     where both flags are true at a tie (so the renderer can paint two muted
     arrows). At terminal cells where neither neighbour is in-bounds, both
     flags are false. */
  function computePolicy(V) {
    const { M, N } = dims(V);
    const pi = [];
    for (let r = 0; r < M; r++) {
      const row = [];
      for (let c = 0; c < N; c++) {
        const downValid = r + 1 < M;
        const rightValid = c + 1 < N;
        if (!downValid && !rightValid) {
          row.push({ down: false, right: false });
        } else if (!downValid) {
          row.push({ down: false, right: true });
        } else if (!rightValid) {
          row.push({ down: true, right: false });
        } else {
          const vd = V[r + 1][c];
          const vr = V[r][c + 1];
          /* Strict inequality only — ties get both arrows. */
          if (vd > vr) row.push({ down: true,  right: false });
          else if (vr > vd) row.push({ down: false, right: true });
          else row.push({ down: true, right: true });
        }
      }
      pi.push(row);
    }
    return pi;
  }

  /* Trace the optimal path from `start` by following the policy. On ties,
     prefer right (for tie-break determinism — matches the conventional
     reading order). Returns [(r, c), …] including the terminal cell. */
  function computeOptimalPath(V, start) {
    const { M, N } = dims(V);
    const path = [];
    let r = start && Number.isFinite(start.r) ? start.r : 0;
    let c = start && Number.isFinite(start.c) ? start.c : 0;
    path.push({ r, c });
    while (r < M - 1 || c < N - 1) {
      const downValid = r + 1 < M;
      const rightValid = c + 1 < N;
      let goDown;
      if (!downValid) goDown = false;
      else if (!rightValid) goDown = true;
      else goDown = V[r + 1][c] > V[r][c + 1]; // ties → right
      if (goDown) r += 1; else c += 1;
      path.push({ r, c });
    }
    return path;
  }

  /* Greedy-LOCAL: pick the higher-reward neighbour, ignoring the future.
     This is the strawman walker in scene 2. Matches the "naive" path the
     audit calls out as the original's missing comparison. Tie-break: right.
     Returns [(r, c), …] including terminal. */
  function computeGreedyLocalPath(rewards, start) {
    const { M, N } = dims(rewards);
    const path = [];
    let r = start && Number.isFinite(start.r) ? start.r : 0;
    let c = start && Number.isFinite(start.c) ? start.c : 0;
    path.push({ r, c });
    while (r < M - 1 || c < N - 1) {
      const downValid = r + 1 < M;
      const rightValid = c + 1 < N;
      let goDown;
      if (!downValid) goDown = false;
      else if (!rightValid) goDown = true;
      else goDown = rewards[r + 1][c] > rewards[r][c + 1]; // ties → right
      if (goDown) r += 1; else c += 1;
      path.push({ r, c });
    }
    return path;
  }

  /* Sum the rewards along a path. */
  function pathReward(rewards, path) {
    let total = 0;
    for (const { r, c } of path) total += rewards[r][c];
    return total;
  }

  /* Discounted return along a path (each step adds γ^t · R). The
     undiscounted total is just γ = 1. */
  function pathReturn(rewards, path, gamma) {
    let g = 1;
    let total = 0;
    for (const { r, c } of path) {
      total += g * rewards[r][c];
      g *= gamma;
    }
    return total;
  }

  /* Sweep order for the animated backward fill in scene 3.
     We use anti-diagonal order: at distance d from the bottom-right, all
     cells with (M-1-r) + (N-1-c) = d are filled in one "wave". This makes
     the visual animation more interesting than reverse row-major, and every
     cell whose right and down neighbours are filled is computable. */
  function sweepOrder(M, N) {
    const order = [];
    const maxD = (M - 1) + (N - 1);
    for (let d = 0; d <= maxD; d++) {
      /* Within an anti-diagonal, walk top-right to bottom-left. */
      for (let r = Math.max(0, M - 1 - d); r <= Math.min(M - 1, M - 1); r++) {
        const c = (N - 1) - (d - (M - 1 - r));
        if (c < 0 || c >= N) continue;
        order.push({ r, c });
      }
    }
    return order;
  }

  /* Shorthand: produce the per-cell arithmetic string for the side caption
     in scene 3. Returns e.g. "V(2,3) = 4 + 1.0 × max(7, 5) = 11" or, when γ
     happens to be 1, the prettier "V(2,3) = 4 + max(7, 5) = 11". */
  function explain(rewards, V, gamma, r, c) {
    const { M, N } = dims(V);
    const reward = rewards[r][c];
    const downValid = r + 1 < M;
    const rightValid = c + 1 < N;
    const fmtNum = (x) => Number.isInteger(x) ? String(x) : x.toFixed(2);
    if (!downValid && !rightValid) {
      return `V(${r},${c}) = ${reward}`;
    }
    let neighbours;
    let bestVal;
    if (!downValid) {
      neighbours = `V(${r},${c + 1}) = ${fmtNum(V[r][c + 1])}`;
      bestVal = V[r][c + 1];
    } else if (!rightValid) {
      neighbours = `V(${r + 1},${c}) = ${fmtNum(V[r + 1][c])}`;
      bestVal = V[r + 1][c];
    } else {
      neighbours = `max(${fmtNum(V[r + 1][c])}, ${fmtNum(V[r][c + 1])})`;
      bestVal = Math.max(V[r + 1][c], V[r][c + 1]);
    }
    const gammaPart = gamma === 1 ? '' : `${fmtNum(gamma)} · `;
    return `V(${r},${c}) = ${reward} + ${gammaPart}${neighbours} = ${fmtNum(reward + gamma * bestVal)}`;
  }

  window.Bellman = {
    ACTIONS,
    DELTAS,
    computeV,
    computePolicy,
    computeOptimalPath,
    computeGreedyLocalPath,
    pathReward,
    pathReturn,
    sweepOrder,
    explain,
    dims,
  };
})();

# Rebuild plan — Spooky House (Bellman recursion + γ) visualization

Target folder: `classic_rl/spooky-house/` (sibling to `anymal-mdp/`).
Style guide: `.claude/skills/course-viz/SKILL.md`.
Source pedagogy: `exercises-ainit/Weekend_3/3_Spooky_House.ipynb` + `spooky_house_utils.py` + `spooky_house_demo.py`.
Audit of original: `reports/04_spooky_house.md`.
Curriculum slot: viz #3 of 5. Comes after Casino (one-state value estimation, ε-greedy) and before Darts (Robbins-Monro).

The plan is concrete enough to fan out to scene agents but light enough to redirect.

## 1. What this viz must do (pedagogy)

Casino taught: *one* state, estimate one value per arm via empirical mean, balance explore vs exploit. Spooky House makes the leap to **many states**: now you have a value *function* `V(s)`, and the central question becomes *"how do I compute V given that future values feed into present ones?"*

The answer is the **Bellman equation** in its simplest possible form — deterministic transitions, finite horizon, two-action right/down navigation:

> `V(r, c) = R(r, c) + γ · max(V(r+1, c), V(r, c+1))`

This is the canonical "first MDP value computation" from Sutton-Barto §4 minus the stochasticity. By the end the student should be able to:
1. Write the Bellman equation by hand for any cell on the grid.
2. Compute the optimal V via a single backward sweep (no iteration needed in this special case — finite horizon, no cycles).
3. Read the optimal **policy** off V — at each cell, point to the higher-V neighbour.
4. Explain how `γ` rebalances near vs. far rewards, and produce a γ where the optimal path *changes* relative to γ = 1.

**Out of scope:** stochastic transitions (defer to SARSA viz), value iteration in the general sense (the right/down problem doesn't need iteration), four-way movement (cycles + value iteration), policy iteration, function approximation. The recap names *"value iteration"* once as foreshadowing for SARSA, but the body says **Bellman recursion** and **backward sweep**.

The audit's #1 finding stands: the original is *labelled* "Bellman" but teaches deterministic right/down DP only. The rebuild keeps that scope (right/down is pedagogically clean) but **makes the Bellman recursion itself visible** — which the original never did. The "Optimal Path" button in the original paints all cells at once with no V-table, no backward sweep, no policy arrows. The rebuild's centrepiece is animating that backward sweep cell-by-cell.

## 2. Driving model: mixed

| Scene | Mode              | Why                                                                       |
|-------|-------------------|---------------------------------------------------------------------------|
| 0     | static            | Setup                                                                     |
| 1     | manual            | Student picks a path themselves with `→ ↓` keys, feels the choice tension |
| 2     | semi-auto         | Greedy-local fails — automatic walk side-by-side with optimal walk        |
| 3     | autoplay          | The backward sweep IS the lesson; click `Run` to animate                  |
| 4     | autoplay          | Policy arrows light up; optimal path traces                               |
| 5     | autoplay + slider | γ slider; backward sweep re-runs on change                                |
| 6     | static            | Recap                                                                     |

`&run` triggers the primary Run button on scenes 3-5 for headless verification. `&instant` skips opacity transitions per ANYmal precedent.

## 3. Scene list (6 scenes, click-step)

Grid size: **5×5** (25 cells, fits projector size, gives 9-step paths). Per-cell rewards drawn from `{1..9}` via seeded RNG, with the data-prep agent ensuring the canonical seed produces a grid where (a) greedy-local is suboptimal and (b) optimal path under γ=1 differs from optimal path under γ=0.7. Both invariants asserted in code.

| # | Title                              | What the student sees and does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Internal step engine?                                                                                                          |
|---|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| 0 | Many states, one value each        | Title card + 5×5 grid with per-cell reward shown as a number on each cell, plus a small ghost-density visual (1-9 ghost silhouettes per cell, stacked). Agent SVG sprite at top-left (0,0). Goal marker at bottom-right (4,4). KaTeX line: *"Two actions: right or down. Collect spookiness along the way. What path maximises total reward?"*. Cell colors picked up from a per-reward intensity ramp; theme-aware.                                                                                                                                                                                                                  | No                                                                                                                             |
| 1 | Pick a path                        | Same grid. Agent moves with `→` and `↓` keys. Cumulative reward updates in HUD. On reaching (4,4), terminal banner: *"You scored X. Was it the best path?"* — without revealing optimal yet. Allow restart via Reset button.                                                                                                                                                                                                                                                                                                                                                                                                          | Yes — student's path history; ←/→ rewind/replay; at start, ← advances to scene 0; at terminal (or head), → advances to scene 2 |
| 2 | Greedy local fails → the recursion | Top half: side-by-side animation of two paths from (0,0): a **greedy-local** walker (always picks the higher-reward neighbour) and the **optimal** walker (path computed via DP). Both walk to terminal; their cumulative rewards display side-by-side. Greedy-local underperforms by a documented gap (data-prep invariant). Bottom half: KaTeX block introduces `V(r,c) = R(r,c) + \max(V(r+1,c), V(r,c+1))` with each term annotated in prose. Caption: *"Greedy needs to know the future. The future is V."*                                                                                                                      | Yes — the side-by-side animation has play/step/reset; at end-of-walk, → advances                                               |
| 3 | The backward sweep                 | Same 5×5 grid, but each cell now has space for a V-value (large monospace number, hidden initially). `Run` button starts a **cell-by-cell backward animation** from (4,4) → (4,3) → (4,2) → … → (3,4) → (3,3) → … → (0,0). Order: row-by-row from the bottom, right-to-left within each row, OR by anti-diagonals (cleaner visually — every cell whose right and down neighbours are filled becomes computable). Each cell, as it fills, shows the arithmetic momentarily (`V(2,3) = R(2,3) + max(V(3,3), V(2,4)) = 4 + max(7, 5) = 11`) in a side caption. Final V at (0,0) is the optimal total. Speed slider; step-by-step button. | Yes — sweep cursor steps cell-by-cell                                                                                          |
| 4 | Reading the policy                 | Same V-table from scene 3 (cold-entry runs the sweep instantly, no animation). At each cell, an SVG arrow in `→` or `↓` direction points to the higher-V neighbour. Tied cells get both arrows muted. Click a cell to see its argmax computation. **Trace the optimal path** from (0,0) by following arrows — ANYmal walks it slowly. Compare cumulative reward to scene 1's manual path.                                                                                                                                                                                                                                             | Yes — single play/step/reset for the optimal-path walk                                                                         |
| 5 | Adding γ                           | Same grid + V-table. KaTeX now shows discounted form: `V(r,c) = R(r,c) + \gamma \cdot \max(V(r+1,c), V(r,c+1))`. Slider for `γ ∈ [0, 1]` default 1.0. As γ changes, V re-sweeps (very fast — no animation, just a flash) and policy arrows update. The data-prep agent guarantees that *some* γ in [0.5, 0.9] flips the optimal path. Caption: *"Smaller γ = greedier in time. The future is worth less."*                                                                                                                                                                                                                            | Yes — slider drives the recompute; ←/→ jumps between three preset γ values (1.0, 0.9, 0.5) for keyboard scrubbing              |
| 6 | Recap → next viz                   | Five-card layout. Cards: **states (S)** (recall: a tuple per cell), **value V(s)** (a number per state), **Bellman recursion** (the equation), **policy from V** (an arrow per state), **γ** (the discount). One-line foreshadow below: *"Bellman gives V if you know the rewards exactly. In Casino we estimated one value from samples. Next, we estimate many values under noise."*                                                                                                                                                                                                                                                | No                                                                                                                             |

**Why 6 scenes (not 7):**
- The original audit pushed for separate "backward sweep" and "policy arrows" scenes. I keep them as separate scenes (3 and 4) because the **arrows** are a distinct conceptual layer — V is *what's worth*, policy is *what to do*. Folding them into one scene loses that.
- Adding γ in its own scene (scene 5) is essential — without it the rebuild repeats the original's mistake of "Bellman in name only".
- An "agent walking the optimal path" scene was tempting but it's the closing beat of scene 4; doesn't need its own page.

## 4. Bugs and curriculum drift the rebuild fixes

From `reports/04_spooky_house.md`:

1. **"Bellman in name only"** — original teaches deterministic max-path-sum DP without Bellman branding inside the artefact. **Rebuild puts the equation on screen in scene 2** and animates the recursion in scene 3.
2. **No agent sprite** — original is a `<table>` with emoji theming. **Rebuild uses the ANYmal SVG silhouette** from `anymal-mdp/assets/anymal-sprite.svg` (curriculum continuity).
3. **No V-table** — original never shows V values. **Rebuild's scene 3 IS the V-table.**
4. **No backward sweep animation** — "Optimal Path" paints all cells instantaneously. **Rebuild animates cell-by-cell with explicit step engine.**
5. **No γ** — despite the "Bellman" branding. **Rebuild's scene 5 introduces it.**
6. **Hard-coded `0.75` zoom in two places + brittle layout** — **rebuild uses `aspect-ratio` CSS as ANYmal does**.
7. **`tmp_files/` accumulates orphan HTMLs** — **rebuild has no Python/JS bridge; everything is browser-only**, no temp files.
8. **`spooky_house_demo.py` is dead code** — **not copied to the rebuild folder**.

Two new fixes (curriculum-level):

9. **Action set vocabulary** — ANYmal's was `{up,down,left,right}`; Spooky House restricts to `{right,down}`. **Rebuild names this restriction explicitly in scene 0** so students don't think the action set has secretly shrunk.
10. **State vocabulary** — ANYmal's state was `(anymal, g₁, g₂, ★)`. Spooky House's state is just `(r, c)` (no ghosts moving — the "spookiness" is part of the reward, not the state). **Rebuild's scene 0 says this out loud** to fix the discontinuity.

## 5. File layout (per SKILL §"Hard requirements")

```
classic_rl/spooky-house/
  index.html
  css/
    style.css           ← theme tokens; reward-intensity ramp (.reward-1 ... .reward-9); arrow classes (.policy-arrow.right/.down/.tied); v-cell classes
    scene0.css … scene6.css
  js/
    theme.js            ← copied from anymal-mdp; STORAGE_KEY = 'spooky-house.theme'
    main.js             ← copied; SCENES list + brand updated
    bellman.js          ← computeV(grid, gamma) → V[][]; computePolicy(V) → A[][]; computeOptimalPath(V, start) → [(r,c), ...]
    grid.js             ← copied from anymal-mdp; reward+V annotations on cells; arrow overlay
    history.js          ← copied; stores (r,c) path history
    chart.js            ← (optional) reward comparison bars for scene 2
    katex-helpers.js    ← copied
    scenes/
      scene0.js … scene6.js
  data/
    datasets.js         ← reward grid (5×5, seeded), preset γ values
  vendor/
    katex/...
  precompute/
    build-datasets.js   ← Node, Mulberry32, 5×5 reward grid generation + invariant assertions
  assets/
    anymal-sprite.svg   ← copied from anymal-mdp
    ghost-sprite.svg    ← copied (used for cell reward visualization)
    goal-sprite.svg     ← new: a haunted-door silhouette for the bottom-right cell
```

Browser-openable from `file://`. No CDN, no fetch, no build step. No Python ↔ JS bridging (the original's `{PYTHON_REPLACE_ME}` placeholder is dropped). Light mode default.

## 6. Phased build with parallel-agent fan-out

### Phase 0 — Foundation (sequential)

- Copy `classic_rl/anymal-mdp/` as scaffold; strip scenes; rename brand and storage keys.
- Adapt `style.css`: keep editorial tokens; add 9-step reward-intensity ramp using existing `--cell-bg` / `--cell-rule` family but with controlled lightness gradient. Add `.policy-arrow.right`, `.policy-arrow.down`, `.policy-arrow.tied`. Add `.v-cell-value` (large monospace number positioned on each grid cell).
- Write `js/bellman.js`: pure functions `computeV(rewards, gamma)`, `computePolicy(V)`, `computeOptimalPath(V, start)`. Test mentally: for the `[1..9]` random grid with γ=1, computeV should produce the same V as the original `spooky_house_utils.py` does.
- Adapt `js/grid.js`: extend the existing entity layer with a "cell annotations" sub-layer for V-values and reward labels, and an "arrow overlay" sub-layer for policy arrows. Keep the entity sprite system from ANYmal.
- Stub each `scenes/sceneN.js`.

### Phase 0.5 — Data prep (parallel with Phase 0)

One sub-agent owns `precompute/build-datasets.js`:

- Seeded Mulberry32 RNG. Seed pinned at top.
- Generates a 5×5 reward grid with values in `{1..9}`.
- Computes optimal V and optimal path for γ ∈ {1.0, 0.9, 0.7, 0.5}.
- **Invariants asserted in code**:
  - Greedy-local total reward < optimal total reward (gap ≥ 3, pedagogically meaningful).
  - Optimal path under γ=1 is *different* from optimal path under at least one γ ∈ {0.7, 0.5}.
  - All V values finite, ≥ 0.
  - Byte-identical regen.

If the canonical seed fails any invariant, the agent may swap to a different seed *once*, document it, and re-run.

### Phase 1 — Scene fan-out (parallel after Phase 0)

Three sub-agents:

- **Agent A — bookends + manual:** scenes **0, 1, 6**. Setup, manual play, recap. Three lighter scenes; scene 1 mechanics resemble ANYmal scene 1.
- **Agent B — failure + recursion:** scenes **2, 3**. Greedy-local-fails + the backward-sweep animation. Tonal pair — both about "what's missing without the future". The backward-sweep step engine is the highest-leverage shared component; Agent B owns its design and Agent C reuses it for cold-entry V-table rebuild in scenes 4-5.
- **Agent C — policy + γ:** scenes **4, 5**. Policy arrows from V + γ slider. Both about "reading the answer off V". Highest pedagogical density.

3-2-2 split. Each gets the SKILL §"Scene agent prompt template" filled in.

### Phase 2 — Aggregation + verification (sequential)

Standard cycle: link CSS, parse-check JS, headless screenshot every scene at 1280×800 + 1920×1080 in both themes with `&instant` (and `&run` for animation scenes). Read every PNG. Walk through both themes manually. Spot-check Phase 0.5's invariant claims by re-running `build-datasets.js`.

## 7. Open questions (answer before kickoff)

1. **Spooky framing.** Plan keeps "spooky house" as the title-card framing (curriculum continuity with notebook + filename). Reward shown as ghost-density per cell. Drop the spooky framing entirely and just present "Bellman on a grid", or keep as planned?
2. **Action set.** Right + down only (matches notebook + clean DP, no value iteration needed). Expand to four-way (cycles, requires value iteration → blends into SARSA territory)?
3. **Grid size.** Plan: 5×5. Want 4×4 (smaller / faster sweep) or 6×6 (more states, longer paths)?
4. **γ in scene 5.** Slider continuous, or discrete preset buttons (`γ=1.0`, `0.9`, `0.5`)? Continuous is more interactive; discrete is more readable.
5. **Reveal of optimal path in scene 1.** Scene 1's terminal banner says *"Was it the best path?"* without revealing. The reveal happens at scene 4. Want the reveal earlier, or fine as planned?

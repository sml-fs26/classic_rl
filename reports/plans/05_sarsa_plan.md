# Rebuild plan — SARSA capstone (3×7 column-patrol cliff-walk) — REVISED

Target folder: `classic_rl/sarsa-anymal/` (existing folder; will be heavily modified, not rebuilt).
Style guide: `.claude/skills/course-viz/SKILL.md`.
Source pedagogy: `exercises-ainit/Weekend_3/5_ANYmal_SARSA_oscillating.ipynb` + `sarsa_anymal_utils_oscillating.py`. Companion notebook: `Sarsa_Blackjack.ipynb`.
Audit of related original: `reports/02_blackjack.md`.
Curriculum slot: viz #5 of 5 — the **capstone**. Pulls together everything from viz 1-4.

This plan supersedes the previous version of `05_sarsa_plan.md` (which proposed ghost-roaming-ANYmal as the SARSA env). Two design pivots:

1. **Environment switched** from ghost-roaming-ANYmal to column-patrol cliff-walk on a smaller `3×7` grid. The previous design had a fundamental Markov-state mismatch (state `(r, c)` could not predict the world because ghosts roamed and the star respawned), which is *exactly* why Q-table convergence was hard to show. This is fixed by making each ghost confined to one column with stationary biased random walk, and fixing the goal star at one corner.
2. **Q-learning dropped entirely.** The capstone now teaches one thing well — SARSA on a clean small world — rather than splitting attention with an off-policy comparison. No Q-learning in the precompute, no toggle on scene 4, no recap teaser by name. The forward-pointer is just "function approximation, deep RL".

These two pivots together shrink the build (one precompute pass instead of two, six scenes instead of seven, simpler Q-table) and concentrate the pedagogy.

## 1. What this viz must do

The previous four viz each contributed one component of the SARSA update:

| Viz | Concept | Symbol → SARSA chunk |
|---|---|---|
| ANYmal | The MDP frame | `⟨S, A, P, R⟩` → the `(s, a)` indexing |
| Casino | ε-greedy on `\hat{\mu}(a)` | the action selection that picks `a'` |
| Spooky House | Bellman + γ | `r + γ Q(s', a')` (the TD target) |
| Darts | Robbins-Monro under noise | `α (target − estimate)` (the update form) |

**SARSA is the union.** Its update rule

> `Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') − Q(s, a)]`

contains all four ingredients. The viz makes those four origins **visible on screen** via colour-coding in scene 1 and traces them through to a working agent in scenes 2-4.

By the end the student should be able to:
1. Point at each chunk of the SARSA update and name the viz that taught it.
2. Watch a Q-table populate from zero to nearly-converged across episodes.
3. Read a policy off the Q-table (per-cell argmax-over-actions arrows on the grid).
4. Predict, for a given hyperparameter change (slide α up, slide ε down), the qualitative effect on convergence.

**Out of scope:** Q-learning, the on/off-policy distinction, n-step SARSA, eligibility traces, function approximation, deep RL, actor-critic. The forward-pointer in scene 5 is *"function approximation, deep RL — beyond this course"*, with no algorithm names.

## 2. Driving model

| Scene | Mode |
|---|---|
| 0 | static |
| 1 | static (KaTeX) |
| 2 | manual stepping |
| 3 | autoplay scrubber over precomputed snapshots |
| 4 | autoplay (final-state policy walk) |
| 5 | static |

`&run` triggers Play on autoplay scenes; `&instant` skips the opacity transition (per ANYmal precedent).

## 3. Environment (locked)

```
. . G . . . .       3×7 grid · 21 states · 84 Q-values
. . . . . . .       Ghost 1 col 2, P(↑,—,↓) = (0.50, 0.30, 0.20) — north-biased
S . . . . G ★       Ghost 2 col 5, P(↑,—,↓) = (0.20, 0.30, 0.50) — south-biased
                    Start (2,0) · Star/goal (2,6)
```

**State:** `s = (r, c)` — agent position only. Ghost positions are **part of the environment, not the state**. Scene 2's tutorial caption names this explicitly.

**Stationary ghost distributions** (computed analytically; precomputed, used for the ghost-occupancy heatmap toggle):
- Ghost 1 in col 2: `P(row 0, 1, 2) = (0.64, 0.26, 0.10)` — safest col-2 cell is row 2
- Ghost 2 in col 5: `P(row 0, 1, 2) = (0.10, 0.26, 0.64)` — safest col-5 cell is row 0

**Reward scale** (matches viz #1 ANYmal exactly):
- step: `−1`
- collision with a ghost: `−100` and **respawn at start** (NOT terminal — episode continues)
- star (goal): `+10` and terminal
- maxRounds: `40`

**Step ordering** (matches viz #1): agent moves → goal check → ghosts move → collision check.

**Why state = `(r, c)` only:** Full state including ghost positions would be `21 × 3 × 3 = 189` states — defeats the "Q-table fits on screen" goal. Marginalizing over ghost positions is the standard pedagogical move; the agent learns *expected return given my position*, where the expectation is over the (stationary) ghost trajectories. The math is well-defined, Q converges cleanly, and the policy is interpretable as "this cell tends to be safe / dangerous".

## 4. The "Q-table fills nicely" payoff — the centrepiece view

The user's original complaint about the previous SARSA env was *"the Q table being filled cannot be shown nicely"*. With 21 states this is now solved by showing the **literal numerical Q-table** as a 21-row × 4-column monospace table in the side panel, on screen at all times in scenes 2-4.

```
┌────────┬───────┬───────┬───────┬───────┐
│ state  │   ↑   │   ↓   │   ←   │   →   │
├────────┼───────┼───────┼───────┼───────┤
│ (0,0)  │ -1.20 │ -0.50 │ -2.00 │  0.83 │
│ (0,1)  │  ...  │  ...  │  ...  │  ...  │
│   ⋮    │       │       │       │       │
│ (2,6)  │ 10.00 │ (terminal)            │
└────────┴───────┴───────┴───────┴───────┘
```

Three view modes available in scenes 3 and 4 (toggle):

1. **Numerical Q-table** (21×4, monospace) — DEFAULT. The user's "fills nicely" requirement in its purest form.
2. **Max-Q heatmap on grid + argmax arrows** — compact spatial summary.
3. **Per-action 4-up** — four 3×7 mini-grids, one per direction.

In scene 2, only the numerical view is on the side (and it starts all zero, fills row-by-row as the student steps).

## 5. Scene list (6 scenes, click-step)

| # | Title | What the student sees and does | Internal step engine? |
|---|---|---|---|
| 0 | Putting it together | Title + four small recap cards in a row, one per prior viz: **ANYmal** (red, MDP, anymal sprite + "states, actions, rewards"), **Casino** (blue, ε-greedy, slot/lever icon + "explore vs exploit"), **Spooky House** (purple, Bellman+γ, mini-grid icon + KaTeX `V(s) = R(s) + γ max V(s')`), **Darts** (amber, Robbins-Monro, bullseye icon + KaTeX `\hat{x} \leftarrow \hat{x} + α(s - \hat{x})`). KaTeX teaser below: *"Today they fuse into one update."* | No |
| 1 | The SARSA update | Centred large KaTeX of `Q(s,a) \leftarrow Q(s,a) + α [r + γ Q(s',a') - Q(s,a)]` with each chunk colour-keyed: `Q(s,a)` ANYmal-red, `α` Darts-amber, `r + γ Q(s',a')` Spooky-purple, the bracket as a whole = "TD error". Below: a small components table mapping each chunk → its viz of origin. Below that: a one-line callout *"where a' is chosen by ε-greedy on Q(s', ·)"* with **ε-greedy** in Casino-blue. | No |
| 2 | One step | Live 3×7 grid (ANYmal sprite at start, two ghosts patrolling, star at (2,6)). Right panel: the **numerical Q-table** (21 rows × 4 cols, all zeroes initially). Pressing arrow → agent moves → (a) tuple `(s, a, r, s', a')` floats up near agent for ~600 ms → (b) the Q-update arithmetic `Q(s,a) ← 0 + 0.5 × (-1 + 0.95 × 0 - 0) = -0.5` floats below for ~600 ms → (c) the Q-table cell flashes and updates → (d) ghosts move → (e) collision check. Three sliders (ε, α, γ). Tutorial caption above: *"For now, state is just (r, c). Ghosts are part of the environment, not the state."* | Yes — student's own steps; ←/→ rewind/replay via reset+replay (rng captured per step) |
| 3 | Episodes accumulate | Same grid + Q-table layout, but autoplay-scrubber driven by precomputed training. Scrubber over snapshots `[0, 1, 5, 10, 25, 50, 100, 250, 500]`. Numerical Q-table updates per scrubber position; cells that changed since last snapshot flash briefly. Below grid: learning curve (cumulative reward per episode), with current episode highlighted. View toggle: numerical / heatmap+arrows / per-action 4-up. **Slider for α**: default 0.5 → moving to 0.95 swaps to the precomputed *oscillating* trajectory (visible learning-curve wobble). Slider for ε. **Toggle: ghost-occupancy heatmap underlay** (precomputed stationary distributions; faint red where ghosts spend time). Caption: *"Q starts at zero. After ~100 episodes, the dangerous columns are learned."* | Yes — the scrubber |
| 4 | The policy emerges | Final episode (scrubber pinned to t=500). Default view: max-Q heatmap on grid + argmax arrows on each cell + ghost-occupancy underlay toggleable. Click any grid cell → highlights that row in the numerical Q-table on the side + shows its 4 Q-values as a mini bar chart. ANYmal walks the policy from start to goal, slowly (animated, ~150 ms per step). Caption: *"The arrows zigzag — under each ghost's bias."* | Yes — the policy walk has play/step/reset |
| 5 | Recap → next | Five-card layout: **Q(s,a)** (the central object), **TD target** `r + γQ'`, **TD error** `target − Q`, **α** (the update size), **ε-greedy** (the policy). Foreshadow: *"What's next — function approximation, deep RL, beyond this course."* Plus a muted aside under the cards: *"Slide α up to 0.95 in scene 3 — watch SARSA oscillate."* | No |

**Why 6 scenes and not 7:** Q-learning dropped → no need for a dedicated SARSA-vs-Q comparison scene. Six scenes match every other viz in the curriculum and fit comfortably as a 30-minute lecture segment.

## 6. Pedagogical / engineering pitfalls

1. **Numerical Q-table must update visibly.** When the scrubber advances or a manual step lands, the affected row should flash (~280 ms colour pulse) so the student's eye is drawn to *what changed*. Without the flash, the table reads as static.
2. **Component colour-coding in scene 1 must be theme-aware.** KaTeX inline color directives need to pull from CSS variables (the existing `--entity-anymal`, `--arrow-commanded`, `--entity-ghost`, `--entity-star` tokens are already the right hues — define `.comp-mdp / .comp-eps / .comp-bellman / .comp-rm` aliases in the scene-1 CSS that wrap the rendered KaTeX spans).
3. **Tuple overlay in scene 2 must not occlude the agent.** The floating `(s, a, r, s', a')` chip should appear above-and-to-the-right of the agent's pre-step position, with an arrow pointing at the cell it describes. The arithmetic chip appears below the tuple chip. Both fade after 600 ms.
4. **Q-update arithmetic must show real numbers.** Don't templatize as `Q(s,a) ← Q(s,a) + α [r + γ Q(s',a') − Q(s,a)]` — substitute the actual numerics: `Q(2,0,→) ← 0 + 0.5 × (−1 + 0.95 × 0 − 0) = −0.5`. The point is to see the algebra grind out a number. Use 2 decimal places.
5. **Episode termination on goal must show celebration.** Star pulses, "+10" chip rises, episode counter increments, agent respawns at start (NOT terminal-modal — the next episode begins immediately during autoplay; a brief banner in scene 2 manual mode).
6. **Don't reveal the optimal policy before scene 4.** Scenes 2 and 3 show the Q-table evolving; scene 4 is the reveal where the arrows light up coherently. No "spoiler" per-cell arrows in earlier scenes.
7. **α=0.95 oscillation must actually oscillate.** Data-prep agent's invariant gates this: rolling-reward std (last 100 eps) of the α=0.95 run > 2× that of the α=0.5 run.
8. **Cold entry must work for every scene.** Visiting scene 4 via dot pager without prior scenes having run must reconstruct the final Q-table from `DATA.training.qSnapshots[final]` and render the policy. Visiting scene 3 fresh must initialise to t=0 (Q all zero).

## 7. File layout

Most of the existing `sarsa-anymal/` infrastructure carries over. Editing in place; deleting files that don't fit. Do not preserve backwards compat with the previous (4×7 ghost-roaming) env.

**Carries over (read, don't change):**
- `vendor/katex/` — verbatim
- `js/theme.js`, `js/katex-helpers.js`, `js/main.js` — minor tweaks (SCENES list still has 6 entries; no need to renumber)
- `js/history.js` — store per-step `(s, a, r, s', a', rngState)` for SARSA replay
- `js/chart.js` — reusable for learning curve in scene 3
- `assets/anymal-sprite.svg`, `ghost-sprite.svg`, `star-sprite.svg`, `slot-sprite.svg`, `bellman-sprite.svg`, `darts-sprite.svg` — verbatim

**Heavy revision:**
- `js/mdp.js` — replace ghost-roaming + respawning-star + collision-terminal model with column-patrol + fixed-goal + collision-respawn
- `js/sarsa.js` — keep the SARSA update function; reverify against the new env API
- `js/qtable.js` — extend with numerical-table render mode (the new centerpiece)
- `js/grid.js` — add ghost-occupancy heatmap underlay layer
- `precompute/build-datasets.js` — full rewrite for the new env
- `data/datasets.js` — auto-generated; new content
- `js/scenes/scene{0..5}.js` — full rewrites
- `css/scene{0..5}.css` — full rewrites
- `css/style.css` — replace component-color classes; add numerical-table styles; add ghost-occupancy heatmap styles

## 8. Phased build with parallel-agent fan-out

### Phase 0 — Foundation (sequential, lead agent)

- Adapt `js/mdp.js`: new `World` class with `step(s, a)` returning `{s_next, r, terminal, collision}`. Two `Ghost` instances (col + bias). Star fixed at goal. Collision respawns agent, NOT terminal.
- Adapt `style.css`: add `.comp-mdp / .comp-eps / .comp-bellman / .comp-rm` CSS classes mapped to existing theme tokens (no new hues). Add `.qtable-cell.flash` (380 ms colour pulse) for numerical-table flashing. Add `.ghost-occupancy` background-overlay class (radial-gradient or solid-with-opacity per-cell). Drop component-color class definitions for the dropped Q-learning/oscillation comparison.
- Extend `js/qtable.js`: add `renderNumericalTable(host, Q, opts)` that emits a 21-row × 4-col table with `data-state="r,c"` and `data-action="up|down|left|right"` attributes for cell flashing.
- Stub each `scenes/sceneN.js` to register on `window.scenes` and render a placeholder.

### Phase 0.5 — Data prep (parallel with Phase 0)

One sub-agent owns `precompute/build-datasets.js`:

- Seeded Mulberry32. Pinned seed.
- Two SARSA training passes: canonical (α=0.5) and oscillating (α=0.95). Each runs 500 episodes.
- Captures: per-episode reward, Q-table snapshots at log-spaced indices `[0, 1, 5, 10, 25, 50, 100, 250, 500]`, full per-step `(s, a, r, s', a')` tuples for the canonical run only (used for cold-entry rebuild).
- Computes ghost stationary distributions analytically (3×3 matrix solve per ghost) and emits as `DATA.ghostOccupancy`.
- **Invariants asserted in code** (per SKILL §0.5):
  1. All Q values finite; no NaN. Byte-identical regen confirmed via two runs + diff.
  2. Mean reward (eps 400-500) > mean reward (eps 0-50) for the canonical run.
  3. Final canonical Q has unique argmax for ≥ 14/21 cells (≥ 2/3).
  4. Argmax cells form a connected start→goal path (BFS check).
  5. The argmax path avoids cells with `P(ghost) > 30%` (the policy is risk-aware).
  6. α=0.95 run's rolling-reward std (last 100 eps) > 2× the canonical run's std (oscillation visible).
  7. Ghost occupancies sum to 1 per ghost; each row's distribution matches the analytical formula to within 1e-6.

If invariant 5 fails: tune ghost biases or collision penalty *once*, document, re-run. If invariant 4 fails on the canonical seed: try the next seed in a deterministic search (`SEED + 0x10`); document.

### Phase 1 — Scene fan-out (parallel after Phase 0)

Three sub-agents:

- **Agent A — bookends + math:** scenes **0, 1, 5**. Title + four-card recap, the SARSA update (KaTeX + colour-coding + components table), final recap. Three lighter-build scenes; the main work is scene 1's KaTeX colour-coding and the recap card thumbnails.
- **Agent B — one step:** scene **2** alone. Highest interaction density: tuple overlay timing, Q-update arithmetic with real numbers, numerical-table cell flashing, three sliders, terminal banner, rewind. Single-scene assignment justified by interactive complexity.
- **Agent C — episodes + policy:** scenes **3, 4**. Both scrubber-driven; share the precomputed training data and the same numerical Q-table renderer. Agent C also owns the learning-curve chart, the α=0.95 oscillation wobble, and the ghost-occupancy heatmap underlay.

3-1-2 split. Agents brief each other only via the plan + the shared `qtable.js` renderer. No cross-agent file edits.

### Phase 2 — Aggregation + verification (sequential, lead agent)

- Link all `scene*.css` in `index.html`.
- Parse-check every JS file (the snippet from prior viz lifts directly).
- Headless screenshot every scene at 1280×800 *and* 1920×1080, both themes, with `&instant`. For scenes 3 and 4 also add `&run` for autoplay and `&run&episode=500` to capture trained state. Use `--headless=new`.
- **Read every PNG.** Per SKILL §3.
- Manual walk-through is **mandatory** for this viz — scene 2's keystroke-driven animation timing (arrow → tuple at 0 ms → arithmetic at 600 ms → flash at 1200 ms → fade at 1800 ms) and scene 3's scrubber are not capturable in screenshots. Confirm:
  - Scene 2: pressing arrows triggers tuple → arithmetic → flash → grid update, in order, at the right timings.
  - Scene 3: scrubber moves smoothly; numerical Q-table values change per snapshot; cells that changed flash; learning curve cursor tracks.
  - Scene 4: view-toggle switches cleanly; click-cell highlights both the grid and the table row.
- Spot-check Phase 0.5 invariants by re-running `precompute/build-datasets.js`.

## 9. Open questions (answer before kickoff or let the agent decide)

1. **Numerical-table column header style.** Use Unicode arrows `↑ ↓ ← →` (compact, theme-friendly) or text labels `up down left right` (more accessible)? Plan: arrows.
2. **Episode count.** Plan: 500 (with snapshots at log-spaced indices). Alternatively 1000 to ensure full convergence at the cost of bigger `data/datasets.js`. Plan-as-stated should suffice on 21 states.
3. **Scene 2 tuple overlay direction.** Above-right of agent (proposed) vs below the grid in a fixed banner (less occlusion but less spatially anchored). Plan: above-right, with arrow.
4. **Goal celebration animation.** Plain text "+10" chip vs star sprite pulse + chip. Plan: both.
5. **Whether to reveal ghost positions on the live grid in scenes 2-3.** The agent's *state* doesn't include them, but the student's eye benefits from seeing them. Plan: yes, ghosts visible on the live grid throughout (with the tutorial caption naming the simplification).

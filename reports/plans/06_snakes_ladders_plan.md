# Build plan — Snakes & Ladders (integrative viz #6)

Target folder: `classic_rl/snakes-ladders/` (new, not a rebuild — sibling to the existing five).
Style guide: `.claude/skills/course-viz/SKILL.md`.
Curriculum slot: viz #6 of 6 — the **integrative review**. Teaches every concept of viz 1-5 on a single, culturally familiar board.

## 1. Why this viz exists

Viz 1-5 each isolate one piece:

| Viz | Carries |
|---|---|
| 1 ANYmal | `⟨S, A, P, R⟩` |
| 2 Casino | ε-greedy on `\hat{\mu}(a)` |
| 3 Spooky House | Bellman + γ on a *no-cycle* gridworld |
| 4 Darts | Robbins-Monro under noise |
| 5 SARSA | The fusion on cliff-walk |

The student arrives at viz #6 with all five pieces *separately* understood. The job here is to **show all of them living together on one game they have played since childhood**. The artefact is the board itself — no metaphor strain, no abstract grid.

Pedagogical bonus: Snakes & Ladders has **cycles** (a snake sends you back to a square you've already passed), which means Bellman *recursion* generalizes to **value iteration**. Spooky House's right/down DP was the no-cycle special case; this is the general method. That's a real lesson the prior viz couldn't carry.

## 2. The MDP

- **States** `S`: the 100 squares (1–100). Square 100 is terminal.
- **Actions** `A`: choose one of three dice — `d4`, `d6`, `d8`. Three actions at every square.
- **Transitions** `P`: roll the chosen die, advance by the roll. If the landing square has a snake or ladder, jump to the connected square. If the roll would overshoot 100, stay (don't bounce). Apply chute/ladder AFTER overshoot check.
- **Reward** `R`: `−1` per turn, `0` at the goal (terminal). Sutton-Barto cliff-walking style — minimise expected turns to 100.
- **Discount** `γ`: 0.95 default; slider in scene 3, range [0.70, 0.99].

State-space size: `100 × 3 = 300` Q-values. Bigger than viz #5's 84, but the *board itself is the visualization* — Q values render as per-cell arrows + a click-for-numbers panel.

## 3. The board (canonical configuration, pinned)

Standard 10×10 boustrophedon: 1–10 left-to-right on the bottom row, 11–20 right-to-left on row 2, etc.

**Ladders** (4): `4 → 14`, `21 → 42`, `28 → 84`, `51 → 67`.
**Snakes** (4): `17 → 7`, `54 → 34`, `87 → 24`, `95 → 75`.

8 special tiles — enough for non-trivial optimal policy, sparse enough to read at a glance. The data-prep agent asserts that the optimal policy under γ=0.95 uses at least 2 different dice (otherwise the action space is wasted).

## 4. Driving model

| Scene | Mode |
|---|---|
| 0 | static (title + MDP frame mapping) |
| 1 | manual (click a die, animate roll) |
| 2 | autoplay (value iteration sweep, scrubber) |
| 3 | direct interaction (γ slider; V re-computes live) |
| 4 | autoplay scrubber (precomputed SARSA training) |
| 5 | static (recap) |

`&run` triggers Play on autoplay scenes; `&instant` skips opacity transitions.

## 5. Scene list (6 scenes, click-step)

| # | Title | What the student sees and does | Step engine? |
|---|---|---|---|
| 0 | **A children's game is an MDP** | Title card. Full 10×10 board with snakes (red curves) and ladders (green lines) drawn on top. Below the board: a 5-row mapping table — each row names one tuple element of the MDP and points (with a small line) to the corresponding element on the board (S = squares, A = the three dice, P = ladders+snakes+die outcomes, R = "−1 per turn, 0 at 100", γ = "your patience"). KaTeX teaser: *"We've taught these five things. Here they all are in one game."* | No |
| 1 | **Roll a die** | The board, with a small ANYmal-red token at square 1. Three big die buttons under the board: `d4`, `d6`, `d8`. Click a die → roll animation (~400 ms), the rolled face highlights, the token slides to the new square (curved arc), if a snake/ladder is triggered the token glides along it. HUD shows: turn, current square, total reward `R = -turn`. Step engine: ← rewind to previous turn (reset+replay), → replay forward; at head, → advances scene. Caption: *"Pick a die at each turn. Notice that the 'right' die depends on where you are."* | Yes |
| 2 | **Bellman, but for cycles** | The board with `V(s)` slots on every square (initially blank). Above the board: KaTeX `V(s) = \max_d \{ -1 + γ \cdot \mathbb{E}_{r \sim d}[V(s')] \}` where `s' = \text{apply chute or ladder to } s + r` (with stay-if-overshoot). Below: a "Run value iteration" button + iteration counter + speed slider. Click Run → iteration `k = 1, 2, …` propagates from square 100 outward. Each iteration step: V values flash on cells that changed; small Δ-value chip shows max |ΔV| across the board. Convergence after ~30-50 iterations (max-ΔV < 1e-3). After convergence: argmax die per square renders as a small `d4`/`d6`/`d8` badge on each cell. Caption: *"Spooky House solved this in one sweep — no cycles. Snakes & Ladders has cycles. So we iterate until V stops changing."* | Yes (iteration scrubber) |
| 3 | **γ as risk preference** | Same board, V-table visible from scene 2. γ slider: 0.70 → 0.99 (default 0.95). On any change: V re-converges live (small precompute table — γ values pre-baked at 7 grid points; intermediate γ snaps to nearest). Watch the per-square optimal die badges shift as γ changes. Annotation strip below: "% of squares preferring d4 / d6 / d8" updates with γ. Caption: *"Lower γ = greedy in time = safer dice (smaller variance). Higher γ = patient = jumpy dice that occasionally pay off big."* | Yes (slider) |
| 4 | **SARSA learns it from scratch** | Board + side panel. The agent has *no access to V* — only the SARSA update with ε-greedy on Q. Autoplay scrubber over precomputed snapshots `[0, 1, 5, 25, 100, 500, 2000]`. At each snapshot: per-square argmax die badges from current Q, color-coded by which die. Side panel: when you click any square, shows that square's three Q-values as a small bar chart + numerical row. Bottom: learning curve (turns-to-goal per episode), with current snapshot highlighted. ε slider (default 0.10), α slider (default 0.10). Caption: *"Same algorithm from cliff-walk. The Bellman recursion is implicit — we don't compute V; we sample-update Q."* | Yes (scrubber) |
| 5 | **All five pieces in one game** | Five recap cards in a row, each tinted with the corresponding viz's hue and pointing at a specific moment in this viz: **MDP** (ANYmal-red — points at scene 0's mapping), **ε-greedy** (Casino-blue — points at scene 4's ε slider), **Bellman + γ** (Spooky-purple — points at scene 2's iteration & scene 3's slider), **Robbins-Monro** (Darts-amber — points at scene 4's α slider, with caption *"the SARSA update IS Robbins-Monro on a TD target"*), **SARSA** (cliff-red — points at scene 4's Q-table). Closing line: *"Other RL methods — Q-learning, function approximation, deep RL — are extensions of these five ideas."* | No |

## 6. Pitfalls & invariants

1. **Boustrophedon numbering** is the standard but easy to render wrong. Visual: row 0 (bottom) is 1–10 left-to-right; row 1 is 20-11 (right-to-left); row 2 is 21–30 left-to-right; etc. Square 100 is top-left (row 9, col 0 in 0-indexed top-down). The agent must verify visually that the token's logical square matches the rendered position.
2. **Value iteration converges, but can be slow at γ near 1.** Cap iterations at 200; if max-ΔV doesn't drop below 1e-3, log a warning. Standard convergence at γ=0.95 takes ~40 iterations.
3. **SARSA episode termination** is reaching square 100. Cap maxTurns at 200 to prevent pathological episodes (with `ε=1` and unlucky rolls, a single episode can be very long). Data-prep agent asserts the precomputed canonical run never hits maxTurns by episode 100.
4. **Optimal policy diversity invariant**: the converged optimal policy at γ=0.95 must use at least 2 different dice (otherwise actions are wasted). The data-prep agent asserts this in code.
5. **γ shift invariant**: the optimal policy at γ=0.70 must differ from γ=0.99 in at least 5 squares (otherwise scene 3 is empty). Asserted in code.
6. **Don't show optimal V or policy before scene 2.** Scene 1 is feel-the-variance; the answer is in scene 2.
7. **Token animation must respect snakes/ladders.** When the roll lands on a chute, the animation has two phases: roll-glide (linear to landing square), then chute-glide (curved arc to chute destination). Both ~250 ms.

## 7. File layout

```
classic_rl/snakes-ladders/
  index.html
  css/
    style.css            ← theme tokens; board cells; snake/ladder SVG paths;
                           die buttons; V-value slots; Q-arrows; per-cell badges
    scene0.css … scene5.css
  js/
    theme.js             ← copied from sarsa-anymal
    main.js              ← copied; SCENES list + brand
    katex-helpers.js     ← copied
    history.js           ← copied
    chart.js             ← copied (learning curve in scene 4)
    board.js             ← board model + render (10×10 boustrophedon + SVG snakes/ladders overlay)
    dice.js              ← die definitions + sample(rng, dieId)
    mdp.js               ← step(s, dieId, rng) → s' (apply roll + chute/ladder + overshoot)
    bellman.js           ← value iteration: iterate(V, gamma, board, dice) → V'; argmaxPolicy
    sarsa.js             ← SARSA update + ε-greedy on Q
    qtable.js            ← Q-table data; per-square badge render; per-cell click-panel
    scenes/
      scene0.js … scene5.js
  data/
    datasets.js          ← board config; precomputed V at 7 γ values; SARSA snapshots
  precompute/
    build-datasets.js    ← Mulberry32; runs value iteration + SARSA training; asserts invariants
  vendor/
    katex/...            ← copied
  assets/
    anymal-token.svg     ← reuse from anymal-mdp (same red sprite as the player token)
    die-d4.svg
    die-d6.svg
    die-d8.svg
    snake-path.svg       ← optional; otherwise draw as SVG path in board.js
    ladder-rung.svg      ← optional
```

## 8. Phased build with parallel-agent fan-out

### Phase 0 — Foundation (sequential, lead agent)

- Copy `sarsa-anymal/` as scaffold; strip; rename brand and storage keys.
- Write `js/board.js`: `mountBoard(host, { rows: 10, cols: 10 })` returning `{ squareToCellRect(n), drawSnake(from, to), drawLadder(from, to), setToken(sqNumber, animOpts), setCellLabel(n, text), setCellBadge(n, kind), clearOverlays() }`. The board renders an SVG overlay for snakes (red curved paths) and ladders (green rail+rungs). Squares are CSS-grid cells with their number in a corner.
- Write `js/dice.js`: `DICE = { d4: {sides: 4, mean: 2.5}, d6: {sides: 6, mean: 3.5}, d8: {sides: 8, mean: 4.5} }`; `roll(rng, dieId)` returns 1..N uniform.
- Write `js/mdp.js`: `step(s, dieId, rng, board)` → `{ s_next, roll, chuteOrLadder }`. `terminal(s)` → bool. Reward is implicit: caller adds -1 per call, 0 at terminal.
- Write `js/bellman.js`: `valueIteration(board, dice, gamma, opts)` → `{ V, policy, iters, history }`. Bellman backup uses the full expectation over die outcomes.
- Stub `scenes/sceneN.js`.

### Phase 0.5 — Data prep (one sub-agent, parallel with Phase 0)

`precompute/build-datasets.js`:

- Mulberry32 seeded.
- Computes V and optimal policy at 7 γ values: `[0.70, 0.80, 0.85, 0.90, 0.95, 0.98, 0.99]`. Iteration cap 200; record convergence history per γ.
- Runs SARSA for 2000 episodes with `α=0.10, ε=0.10, γ=0.95`. Q-snapshots at `[0, 1, 5, 25, 100, 500, 2000]`. Learning curve (turns-per-episode) full series.
- Also a second SARSA pass with `α=0.10, ε=0.30` for the recap teaser ("more exploration").
- **Invariants asserted in code:**
  1. Value iteration converges (max-ΔV < 1e-3) within 100 iters at every γ.
  2. Optimal policy at γ=0.95 uses ≥ 2 dice (action diversity).
  3. Optimal policy at γ=0.70 differs from γ=0.99 in ≥ 5 squares.
  4. SARSA learning: mean turns-to-goal (eps 1500-2000) < 0.7 × mean turns-to-goal (eps 0-50).
  5. SARSA final policy matches value-iteration policy on ≥ 70% of *visited* squares (some squares are rarely visited; we don't require perfect match everywhere).
  6. Byte-identical regen.

### Phase 1 — Scene fan-out (parallel, after Phase 0 + 0.5)

Three sub-agents:

- **Agent A — bookends:** scenes **0, 5**. Welcome + recap. Light visual work, lots of cross-viz references in the recap (must read the other 5 viz folders briefly for accurate hue/wording).
- **Agent B — manual + iteration:** scenes **1, 2**. The board + die-rolling mechanic + value iteration animation. Tonal pair (both feature the board prominently with no Q stuff). Agent B owns the token animation + value-iteration scrubber.
- **Agent C — γ + SARSA:** scenes **3, 4**. Both consume precomputed data + show policy. Tonal pair (both about *reading off the answer*). Agent C owns the per-square badge renderer (used in both scenes), the click-for-Q panel, and the learning curve.

3-2-2 split. Agents brief each other only through the plan + the shared `board.js` and `qtable.js` modules.

### Phase 2 — Aggregation + verification (sequential, lead agent)

- Link all `scene*.css` in `index.html`.
- Parse-check every JS file.
- Headless screenshot every scene at 1280×800 and 1920×1080 in both themes with `&instant`. Add `&run` for scenes 2 and 4. `--headless=new`.
- **Read every PNG.**
- Manual walk-through is **mandatory**: confirm in a real browser that (a) the token slides correctly when a snake/ladder triggers in scene 1, (b) value iteration in scene 2 visibly converges (no shimmering at iteration 100), (c) the γ slider in scene 3 changes the badge layout, (d) clicking a square in scene 4 opens the Q-bar panel.
- Spot-check Phase 0.5 invariants by re-running `build-datasets.js`.
- **Update `classic_rl/index.html`** (root landing page) to add a 6th card for Snakes & Ladders, between SARSA and the footer. Mirror the existing card style.
- Commit + push per `.claude/skills/course-viz/SKILL.md` §Recipe #10 (now reads "Commit and push after verification.").

## 9. Open questions (answer at run time or before kickoff)

1. **Number of snakes & ladders** — plan: 4 + 4 (clean). Canonical Milton-Bradley has 9 + 10 (dense). Stay sparse?
2. **γ range** — plan: `[0.70, 0.99]`. Want broader (0.5) or tighter (0.85)?
3. **SARSA budget** — plan: 2000 episodes. Sufficient for a 100×3 Q-table per the invariants. Want more?
4. **Goal reward** — plan: 0 (Sutton-Barto cliff style). Alternatives: +10, +50. Affects the absolute V scale but not the policy.
5. **Token sprite** — plan: reuse ANYmal red silhouette (curriculum continuity). Could redesign as a generic game token.

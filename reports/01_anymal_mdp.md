# Report: `1_ANYmal_MDP.html`

Source file: `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/1_ANYmal_MDP.html` (single file, 301 lines, fully self-contained — no external scripts, fonts, images, or audio).
Companion notebook: `1_ANYmal_MDP.ipynb`. Companion utility module: `anymal_utils.py` (415 lines, used by the notebook only — the HTML does not reference it).

## 1. Pedagogical purpose

The HTML is the very first artefact students see in Weekend 3 of the RL track ("Open the file 1_ANYmal_MDP.html and click 'trust HTML'…"). Its job is to let learners *play* an MDP before they have to formalise one. Concretely it illustrates:

- **State (S):** the joint configuration `(anymal, ghosts[0], ghosts[1], reward)` — exposed in the HUD as `(r,c)` tuples.
- **Action (A):** the four discrete actions `up / down / left / right`, mapped from `w/a/s/d` and arrow keys via the `keyMap` object.
- **Stochastic transition P(s'|s,a):** baked into two knobs — `state.malfunProb` (ANYmal performs a random action instead of the commanded one) and `state.ghostRandomness` (probability mass spread between "stay" and noisy chasing for each ghost).
- **Reward function R(s,a,s'):** the lead paragraph states it explicitly: `+10` for collecting a star, `-1` per step, `-100` for ghost collision (which also terminates the episode). This mirrors `GameConfig.REWARD_COLLECT/STEP/GHOST_COLLISION` in `anymal_utils.py`.
- **Episodes / horizon:** `state.maxRounds` provides a hard cap.

What it does **not** show: policy, value function, discount factor `GAMMA`, or any learning. The notebook mentions `GAMMA = 0.95` but the HTML never uses it. This visualisation is purely the *environment side* of an MDP — the same role `play_interactive_game` plays in the notebook, but in a browser instead of matplotlib.

## 2. Scene & mechanics

A single rectangular grid sits inside a dark "card", with a HUD card to its right.

- **Grid:** built by `createGrid(M,N)` as a CSS-grid of `<div class="cell">`. Default 6×10. Cell size auto-shrinks via `Math.max(28, Math.floor(680 / N))`. No walls, no obstacles, no terminal cell other than ghost collision.
- **Entities** (set in `newState()` and drawn by `renderAll()`):
  - **ANYmal** — a red rounded square containing the literal letter `A` (`.anymal` class). Spawns at the centre `(⌊M/2⌋, ⌊N/2⌋)`.
  - **Two ghosts** — rendered with the emoji `'👻'` on a white-to-grey gradient.
  - **Reward** — yellow tile with a `★` (`'★'`).
- **Per-step flow** inside `step(direction)`:
  1. `state.round += 1; state.score -= 1` (step cost applied unconditionally).
  2. Sample malfunction: with probability `malfunProb` overwrite `move` with a uniform random direction and log "ANYmal malfunctioned and moved …".
  3. Apply `dirToDelta(move)` and `clamp` ANYmal into the grid (walls behave as a stay-in-place projection — no penalty).
  4. If ANYmal lands on the reward, `+= 10` and respawn the star via `placeRandomEmpty`.
  5. `moveGhost(g, idx)` for each ghost.
  6. `renderAll()` — repaints the whole grid by clearing every cell's class and text and reapplying entity classes.
  7. Collision check after the redraw: any `g.r===anymal.r && g.c===anymal.c` triggers `endGame('collision', idx)` with `score -= 100` and a blocking `alert()`.
  8. If `round >= maxRounds`, `endGame('maxRounds')`.

The ghost policy in `moveGhost` is interesting: it computes `towards = anymal - g`, picks the larger axis as the *preferred* direction, then samples one of `['stay','up','down','left','right']` with weights `1 - pRandom` for stay, `pRandom/4` per non-stay direction, and an extra `+0.25 * pRandom` for any preferred direction. So `pRandom` simultaneously controls "how mobile" *and* "how aggressive" the ghost is — at `pRandom = 0` the ghost is frozen, not random.

## 3. Interactivity

All controls live in the top toolbar:

- Numeric inputs: `Grid rows (M)` 4–18, `Grid cols (N)` 4–26, `Max rounds` 5–500.
- Range sliders: `Malfunction probability` 0–0.5 step 0.01 (default 0.08), `Ghost move randomness` 0–1 step 0.05 (default 0.6). Both sliders update the live `state` mid-game via `input` listeners — useful for sweeping noise levels in a single episode.
- A single **Start/Reset** button (`startBtn`) — always re-initialises through `newState()` and sets `running = true`.
- **Keyboard** drives ANYmal: `w/a/s/d` plus `ArrowUp/Down/Left/Right`. The handler lower-cases `ev.key` and calls `step(dir)` only when `running` is true.

There is no autonomous-play mode, no replay/scrub bar, no pause, no speed control, no per-step button, no discount-factor input, no reward-tuning input, and no way to inspect transition probabilities or values. The user *is* the policy.

## 4. Implementation

- **Stack:** vanilla HTML + CSS + JavaScript. No p5.js, no d3, no canvas, no SVG, no build step. The grid is plain DOM. Entities are styled `<div>`s with text/emoji content. Total ~300 lines, of which ~210 are script.
- **Code structure** (single `<script>` block):
  - DOM handles cached at top.
  - `createGrid`, `newState`, `placeRandomEmpty`, `cellAt`, `renderAll` — scene setup and rendering.
  - `step`, `dirToDelta`, `clamp`, `moveGhost` — the transition function.
  - `endGame` — termination and `alert()` popup.
  - Event wiring at the bottom; `newState()` is called on load so the grid is visible before "Start".
- **State container:** a single mutable object `state` with `M, N, anymal, ghosts, reward, round, score, maxRounds, malfunProb, ghostRandomness`. There is no `state.gameOver` field even though the keydown handler reads `state.gameOver` (always `undefined`).
- **External assets:** none. The `anymal.jpg` photo of the real ETH robot is referenced from the notebook only; the HTML uses just the letter "A".

## 5. Strengths

- **Zero-friction:** one self-contained file you can double-click. No `npm`, no notebook trust dialog, no Python kernel.
- **Concept-to-knob mapping is direct:** the malfunction slider maps cleanly onto "stochastic transitions", and watching a sequence of `-1` step costs accumulate makes the step-cost reward concrete.
- **HUD discipline:** every component of the state — round, score, all four entity coordinates — is read out as text, reinforcing the idea that *this tuple is the state*.
- **Live parameter changes** during play let an instructor say "watch what happens when I crank malfunction to 0.5" without restarting.
- The dark theme with rounded cards and gradient backdrops looks more polished than the matplotlib path the notebook falls back to.

## 6. Weaknesses / limitations

- **No MDP scaffolding visible.** Nothing on screen names states, actions, transitions, or rewards beyond the one-line lead. A learner who hasn't yet read the notebook sees only a Pac-Man clone.
- **No discount factor, no return display.** Only cumulative score. Returns vs. rewards is never made tangible.
- **`alert()` for game-over** is jarring and breaks the dark aesthetic; it also blocks the event loop.
- **Full-grid rerender on every step** (`document.querySelectorAll('.cell').forEach(... className='cell')`) wipes any animation potential. Movement is teleportation, not interpolation.
- **Ghost policy is not the same as the notebook's.** The notebook uses `GHOST_MOVE_PROBABILITIES = [0.25, 0.25, 0.25, 0.25]` (uniform random, no chasing); the HTML's `moveGhost` is a chase-with-noise policy that also includes a `stay` option. A student switching from HTML to notebook will find ghosts behave differently, which is a continuity bug for the curriculum.
- **`pRandom` overloads two ideas** (mobility + aggression) into one slider — confusing if students try to reason about it.
- **Bug: `state.gameOver` is read but never written.** The keydown guard `if (!state || state.gameOver) return;` is dead code; after `endGame` only `running = false` prevents further input — `running` is the de-facto game-over flag.
- **ANYmal on a wall just stops** with no signal — no flash, no log, no penalty beyond the unconditional `-1`. Easy to miss.
- **Reward respawn ignores possible overlap with the ghost the ANYmal is about to step into**, and collision is checked only *after* ghosts move — order-of-operations is invisible to the learner.
- **No log history** — `log()` overwrites a single line, so the malfunction message disappears on the next step.
- **No accessibility / colour-blind safety;** `aria-hidden="true"` on the grid makes it invisible to screen readers.
- **The "A" letter for ANYmal is a missed opportunity** given that `anymal.jpg` exists in the same folder and the robot's branding is part of the appeal.

## 7. State machine / step engine

There is no step engine in the reusable sense. The "step function" is `step(direction)`, but it is *only* invoked from the keydown handler — there is no array of frames, no current-index pointer, no `next()` / `prev()` controls, no scrubber, no autoplay timer, no replay buffer. The world advances exactly when the user presses a key, so the visualisation is "real-time, user-driven, irreversible". You cannot rewind, you cannot pause and inspect transition probabilities, and there is no animation loop (`requestAnimationFrame` is never called). State-game-over is implicit (`running = false`).

## 8. Look & feel

- **Palette:** dark navy gradient body (`#071029 → #071828`), darker cards (`#111827`, `#0b1220`), muted slate text (`#94a3b8`), white-ish primary text (`#e6eef8`). ANYmal is a red gradient, ghosts a white-to-grey gradient with the 👻 emoji, reward a yellow gradient with `★`. The single accent button is white-on-dark.
- **Typography:** Inter / system-UI stack, 13–20 px. Headings small (h1 is 20 px). Numbers in the HUD are bolded against muted labels.
- **Layout:** fixed `1200px` app card centred on the page, two-column main area (grid card on the left, HUD card on the right). 12–14 px gaps; rounded corners (10–12 px); subtle drop shadow on the outer card; soft inner shadow on cells via `box-shadow`. Spacing is tight but consistent.
- **Polish level:** above an average teaching demo (it clearly had a designer's eye on the gradients and the card system) but well below a production educational tool. There are no transitions, no easing, no hover affordances on cells, no focus rings, no responsive breakpoints, and no dark-mode/light-mode toggle. The blocking `alert()` and the abrupt repaint on each step betray the prototype nature.

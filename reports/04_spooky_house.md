# Spooky House Visualization — Analysis Report

Source files reviewed:

- `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/spooky_house.html` (617 lines)
- `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/spooky_house_utils.py` (326 lines)
- `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/spooky_house_demo.py` (28 lines)
- `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/3_Spooky_House.ipynb`
- `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/README.md`

## 1. Pedagogical purpose

Despite the file being named "Bellman's Spooky House", the lesson is *not* full RL. It teaches the **deterministic, finite-horizon Bellman optimality equation specialized to a maximum-path-sum DAG** — the classic right/down grid DP. From the notebook:

```
V(row, col) = spookiness(row, col) + max(V(row+1, col), V(row, col+1))
```

There is no discount factor, no stochasticity, no policy iteration, no exploration. It is the "longest path through a 2D grid where you can only go right or down" problem dressed up as ghosts. The pedagogical sequence in `3_Spooky_House.ipynb` is:

1. Manually try paths and tally scores (Parts 2–3) — develops intuition that brute force is hopeless.
2. Discover recursion / Bellman equation (Part 4) — explicit framing of `V(row, col)`.
3. Implement `compute_max_spookiness` (Part 5) as plain recursion.
4. Test on grids 3×3 → 13×13 (Part 6).
5. Watch the optimal path animate on grids 3×3 → 11×11 (Parts 7–8).
6. **Bonus:** add memoization and benchmark with `print_speed_report_memo` (rendered as an HTML "Memoization Impact Report").

So the visualization's role is to make the *path* and its *score* tangible: the agent walks the optimal sequence the student computed, summing per-cell spookiness as it goes. It is essentially a value/return demonstrator for a single deterministic policy — not an interactive policy/value iteration tool.

## 2. Scene & mechanics

The "house" is rendered as an N×N HTML `<table>` with one ghost per cell. There are no walls, doors, or rooms — the haunted-mansion theme is purely cosmetic. Each cell shows:

- A background tinted along a 9-step purple ramp (`PURPLES`, `getCellColor(sp)`), where higher spookiness → darker purple.
- A ghost emoji whose identity escalates with the value: `ghostFor(sp)` returns `'👻'` for `sp ≤ 3`, `'😱'` for `sp ≤ 6`, `'💀'` otherwise. The font size also scales: `ghost.style.fontSize = (18 + sp * 3) + 'px'`.
- A small dark `value-badge` in the bottom-right showing the integer spookiness (1–9).

Two floating labels — green `🦸 START` above (0,0) and blue `🚪 EXIT` below (N-1,N-1) — are absolutely positioned by `positionBadges()` against the live cell rects. CSS counters in `tbody tr::before` and `tbody td::after` add row/column index ruler marks (0..N-1), to support the notebook's coordinate-tuple syntax.

There is no rendered avatar/agent sprite. "The player" is just the highlighted cell: `cell-current` outlines the head of the path, `cell-path` paints visited cells with the orange gradient `linear-gradient(180deg, #ffd97e, #ffb86b)` and a red 3px outline. A large `score-bar` at the bottom shows the running total in 42px font.

Step-by-step, the user sees: (a) the static grid with ghosts, (b) on each move, the new cell turns orange-with-red-outline and the score increments, (c) when the auto-animation runs (driven from Python via `pythonPayload.autoPath`), 300 ms `setInterval` ticks walk the supplied coordinate list, calling `tryMove` per step.

## 3. Interactivity

Quite limited. The toolbar has only two buttons:

- **`Optimal Path`** (`#opt-path`) — runs an in-browser DP (`computeOptimal(g)`) that returns `{score, path}`, then paints every cell of that path orange. Note: it does not animate; it slams the whole path on at once and updates `scoreEl.textContent = optimal.score`.
- **`Reset Player`** (`#reset`) — calls `initPlayer()` and clears highlights.

User input methods:

- **Keyboard:** `ArrowRight` and `ArrowDown` call `tryMove(player.r, player.c+1 / player.r+1, player.c)`. Up/Left are silently ignored.
- **Click:** any `<td>` in the grid; `tryMove` accepts only adjacent right/down cells.

There is **no** gamma slider, no reward editor, no policy/value overlay toggle, no stochastic-vs-deterministic switch, no run/pause/scrub control, no speed slider, no per-step "next" button, no manual-vs-agent toggle. The "agent-controlled" mode is purely the Python-injected auto-animation, which fires once on load and cannot be paused or replayed without re-rendering the iframe.

## 4. Implementation

**Stack:** vanilla JS in a single self-contained HTML file. No p5.js, d3, canvas, or SVG — the grid is a regular `<table>` styled with CSS. Ghosts are emoji glyphs. The only "graphics" library involved is the browser's CSS engine and `getBoundingClientRect()` for badge placement.

**File layout:** one HTML file (`spooky_house.html`, 617 lines): `<style>` ~260 lines, `<body>` markup ~25 lines, `<script>` ~320 lines. No external assets beyond Unicode emoji.

**Python ↔ HTML bridge:** `spooky_house_utils.py` reads `spooky_house.html` as a template and replaces the literal string `"{PYTHON_REPLACE_ME}"` with a JSON object containing `{exists, size, gridData, autoPath}`. The output is written to `./tmp_files/spooky_house_render_<ms>.html` and embedded in Jupyter via `IFrame`. The cache-busting filename is timestamp-based.

```python
target_string = '"{PYTHON_REPLACE_ME}"'
new_content = html_content.replace(target_string, json_config)
filename = f"{RENDER_FILE_PREFIX}_{int(time.time() * 1000)}.html"
```

On the JS side, `applyConfig` checks `PYTHON_CONFIG.exists` to decide whether to use the injected payload or fall back to a URL-`?size=` query plus an LCG-seeded random grid (`makeRng`).

Key JS functions: `generateGrid`, `buildGrid` (DOM construction), `paintGrid` (state → CSS classes), `tryMove` (move + score update), `runAutoAnimation` (timer-driven playback), `computeOptimal` (in-browser DP duplicate of `compute_max_spookiness`), `positionBadges` (absolute-positioned labels).

There is logic duplication between `spooky_house_demo.py`'s `q(table, row, col, action)` (a Q-style recursive max-spookiness), the notebook's `compute_max_spookiness`, and `computeOptimal` in JS — three implementations of the same DP.

## 5. Strengths

- **Self-contained and offline.** One HTML file plus one Python utility; no build step, no CDN dependencies. Robust for classroom Wi-Fi.
- **Clean Python→JS injection pattern.** The `"{PYTHON_REPLACE_ME}"` placeholder is JSON-valid before and after substitution, and the timestamped output filename sidesteps `IFrame` caching cleanly.
- **Theme is genuinely fun.** The escalating ghost glyphs (`👻 → 😱 → 💀`) visually correlate with the numeric reward in a way pure numbers don't. Larger emojis for larger spookiness are a nice second visual channel.
- **Good color encoding.** The 9-step `PURPLES` ramp gives an at-a-glance "value heatmap" of the grid even before any algorithm runs.
- **Two redundant input modes.** Both clicking and arrow keys work, which is friendly for students with different ergonomics.
- **Coordinate rulers via CSS counters.** Auto-numbered rows and columns help bridge the (row, col) tuples in the notebook to the on-screen grid.
- **Smooth visual focus.** Path coloring (`cell-path` + red outline) reads clearly against the purple background.

## 6. Weaknesses / limitations

- **It is not really an RL visualization.** No stochasticity, no discount, no policy/value display, no Q-values shown on cells. A student leaves with intuition for a DAG longest-path, not for the Bellman *expectation* equation. The bridge to Game 5 (SARSA) is asserted in the README but the visualization does nothing to prepare the eye for stochastic transitions or value/policy overlays.
- **No step-by-step scrubbing.** `runAutoAnimation` is fire-and-forget on a 300 ms `setInterval`. There is no pause, step-back, speed control, or "show me V at this stage" feature. To see the path again the student must re-run the cell.
- **Single deterministic policy displayed.** The Optimal Path button paints a result but never visualizes *how* the DP discovered it. There is no V-table fill-in animation, no backward induction sweep, no comparison of suboptimal alternatives. Pedagogically this is the largest miss — the moment of "I see the Bellman equation working" is invisible.
- **Score updates outrun the animation.** During `runAutoAnimation`, `tryMove` increments the score but uses the *click* path-extension logic, so the legend "Use → or ↓ to move" remains true even while the agent walks itself. This blurs whether the student is in control.
- **`Optimal Path` and `Reset Player` mix state oddly.** `Optimal Path` sets `player.r=0, player.c=0, player.path=[[0,0]]` *and* shows the full optimal path simultaneously, then displays `optimal.score` (not `player.score`). The user's score and the displayed score can diverge.
- **Layout is brittle.** `transform: scale(0.75)` on `#zoom-wrap` plus a hard-coded `PAGE_SCALE = 0.75` constant inside `positionBadges()` will silently break if the scale is changed in CSS. Badge positions also rely on `getBoundingClientRect()` math that is recomputed only on `resize`, not on grid rebuild — though `generateGrid` does call `positionBadges()` once at the end.
- **No accessibility for the auto-animation.** No `aria-live` updates for the score; arrow keys are captured globally (`window.addEventListener('keydown')` with `preventDefault`), which prevents normal scrolling on the host page.
- **Magic numbers everywhere.** `300` ms step delay, `0.75` zoom, `68px` cell size, `PURPLES` length 9 — none configurable from Python.
- **Theme inconsistency with the prompt's expectation.** The visualization has no rooms, doors, or walls. "Spooky house" is purely emoji-themed; structurally it is a 2D rectangular DP grid.
- **Side effects pile up.** Each call to `_render_html` writes a new file under `./tmp_files/` and never cleans them up — a long Jupyter session leaves many `spooky_house_render_<timestamp>.html` orphans.
- **`spooky_house_demo.py` is a cul-de-sac.** It hard-codes a 5×5 table and a Q-style recursion (`q(table, row, col, action)`) that is never imported by the notebook. It risks confusing readers about what the canonical implementation is.

## 7. State machine / step engine

There is **no** explicit step engine. The model is event-driven:

- DOM state (`cells`, `player`, `optimal`, `optShown`) holds everything.
- Mutations come from three event sources: keyboard, click, button clicks, and the `setInterval` in `runAutoAnimation`.
- Each mutation calls `paintGrid()`, which recomputes class assignments from `player.path`, the current `(player.r, player.c)`, and `optimal.path`.

There is no notion of an indexed step the user can scrub to. `player.path` is append-only; there is no `stepBackward`, no "go to step k", no time slider. Replaying the optimal path requires re-injecting `autoPath` from Python and reloading the iframe. This is the single biggest structural weakness for a re-implementation aimed at value-iteration teaching.

## 8. Look & feel

**Polished and dark-themed**, but cosmetically heavy rather than information-dense.

- **Palette:** body background `#0b0711` (near-black, faintly purple); grid container `linear-gradient(180deg, #0b0b0f, #121217)`; cells in a 9-stop purple ramp from `#f6f0fb` (almost white) to `#25116a` (deep indigo). The optimal/current path uses a warm amber gradient `#ffd97e → #ffb86b` with a red `#c73b3b` outline — high contrast against the purple, reading clearly as "this is the answer."
- **Typography:** `system-ui, -apple-system, Arial, sans-serif`; title 20px, score 42px (large and celebratory), value badges 12px in a translucent black pill with `backdrop-filter: blur(4px)`.
- **Spacing:** 8px `border-spacing` between cells, 12px padding inside the grid wrapper, generous margins around the score bar. The `box-shadow: 0 8px 30px rgba(0,0,0,0.6)` and per-cell `box-shadow: 0 6px 18px rgba(0,0,0,0.6)` give a "floating tile" depth effect.
- **Motion:** `transition: box-shadow 140ms ease, outline 120ms ease` on cells, plus hover outline `rgba(255,255,255,0.22)` and glow. Subtle and tasteful.
- **Polish level:** high in static appearance — the dark spooky aesthetic is consistent. But the layout uses a hard-scaled 0.75 wrapper, the START/EXIT badges are absolute-positioned with translation-correction math, and the score number visually dominates the grid in small grids (3×3) where the 42px score is bigger than the cells. Mobile breakpoint at 520px shrinks cells to 52px but does not address the absolute-positioned badges.

Overall: visually pleasant, thematically coherent, but the flashiness somewhat overstates the depth of the underlying mechanic — a deterministic right/down DP — and the code carries no machinery (state engine, value overlay, policy arrows, transition probabilities) that a richer RL visualization would need.

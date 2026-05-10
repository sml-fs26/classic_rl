# Report: `darts_in_the_dark.html`

Source file: `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/darts_in_the_dark.html`
Companion notebook: `4_Darts.ipynb`; supporting Python module: `darts_utils.py`.

## 1. Pedagogical purpose

The notebook framing makes the intent explicit: this visualization is *not* about a multi-armed bandit, gradient bandit, or REINFORCE. It teaches **stochastic approximation / the Robbins–Monro root-finding algorithm** as a precursor to TD learning. The notebook lists the learning objectives as "Stochastic Approximation, the Robbins–Monro Algorithm, Learning Rate Decay, Gradient Estimation". The framing in the markdown cells reduces it to: "Find the position where feedback switches from too low to too high" — i.e. find the root of the gradient of an unknown, *non-stationary* score function from noisy samples.

In the larger Weekend 3 arc the README places this game between the Casino (epsilon-greedy bandits) and SARSA (TD learning); it is meant to introduce the *update rule* `y(t+1) = y(t) + α(t) · error` with a decaying step size, which the student then re-uses in SARSA. So conceptually it teaches:

- 1-D continuous-action stochastic optimization,
- noisy / partially observable reward signals,
- non-stationarity (the optimum drifts),
- and the role of a decaying learning rate `α(t) = α_0 / (1 + t/decay_rate)`.

The HTML itself is the **manual-play** mode: it gives the student first-hand experience of "playing in the dark" before they implement Robbins–Monro in Python in `4_Darts.ipynb`.

## 2. Scene & mechanics

The "world" is a single vertical track, not a real dartboard. Layout (left panel `class="room"`):

- A tall pill-shaped column `.dart-track` (72 px wide, full panel height) representing positions 0–100.
- Three reference ticks at positions labelled `90`, `50`, `10`.
- A glowing orange/yellow circular avatar `#player` with two yellow "eyes" — the player. This is the only thing visible by default ("you can only see your own glowing eyes").
- A hidden dashed circle `#bullseyeDebug` representing the true bullseye, shown only when the lights are toggled on.

"Darkness" is rendered via a `radial-gradient(circle at top, #111 0, #000 55%, #020314 100%)` body background plus a darker gradient inside the track. Toggling lights (`S` key) swaps in a `body.lights-on` style with light blue gradients and reveals the dashed bullseye marker.

Step-by-step user experience: pick a vertical position with arrow keys, press Space to "shoot". The bullseye performs a random walk before scoring (`computeBullseye` clamps a Gaussian step to ±2.5, then clamps the result to [10, 90]). Score is `max(0, 100 - 2 * |player - bullseye|)` plus optional Gaussian noise (`noiseStd`, but hard-coded to 0 in the initial state). The right panel shows last score, average, best, current position, and a scrolling round history (`#historyList`) of `#round: score X, pos Y` lines.

## 3. Interactivity

Controls are keyboard-only (listed in a `.key-bindings` panel):

- `↑` / `↓` — `movePlayer(+3)` / `movePlayer(-3)`, clamped to `[2, 98]`.
- `Space` — `shoot()`.
- `R` — `resetGame()` (re-seeds the RNG with the same seed and clears history).
- `S` — toggle `state.showBullseye`, which flips the `lights-on` body class and reveals the true bullseye position and the per-shot distance.

There is **no** learning-rate slider, no policy/value visualization, no probability distribution, no "auto-run" button, no episode counter beyond a `Round N` pill, no scrubbing through past rounds. The entire interaction surface is the four keys above. The only quantitative scaffolding is the running `avg`, `best`, and the textual history list.

URL parameter `?config={"seed":...}` is parsed (`getConfigFromUrl`) so the notebook can pin a deterministic seed; otherwise `Date.now()` is used and `Math.seedrandom` from the seedrandom CDN is initialized.

## 4. Implementation

- **Single self-contained HTML file**, 622 lines, no build step.
- **Vanilla JS** only. The sole external dependency is `https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js` for deterministic RNG.
- **No canvas, no SVG, no p5/d3.** Everything is positioned `<div>`s styled with CSS. The player and bullseye are absolutely-positioned circular divs whose `top` is set imperatively in `updatePositions()` via `posToY = (p) => h - (p/100)*h`.
- No images, no audio. The "loudspeaker" mentioned in the notebook narrative is purely textual.
- Code structure (script block, lines 397–620): `getConfigFromUrl`, `getRandomBullseyeStart`, a single `state` object, an `elements` cache, helpers `clamp` and `gaussianRandom` (Box–Muller), `computeBullseye` (random walk), `updatePositions`, `updateUI`, `movePlayer`, `shoot`, `resetGame`, and a single `keydown` listener. The rendering is event-driven: every key press calls `updateUI()`, which rewrites the history `<ul>` from scratch each time.
- `darts_utils.py` mirrors the same model in NumPy (`DartsInTheDark` class with `move_up`, `move_down`, `shoot`, `reset`, `get_stats`). Notably the Python `shoot` uses `signed_dist = bullseye_pos - player_pos` and exposes `target_score = self.bullseye_pos` and `current_score = self.player_pos` in the result dict — these are the fields the notebook's Robbins–Monro template extracts. The HTML does **not** expose anything analogous; it is purely a manual UI.

## 5. Strengths

- The "dark room" framing is genuinely evocative and immediately communicates partial observability. The radial-gradient backgrounds, the glowing-eyes avatar, and the lights-on/off toggle are the most pedagogically effective parts.
- Deterministic seeding via URL config makes the visualization reproducible inside the Jupyter `IFrame`.
- The reset behavior re-seeds the RNG so a student can re-run the same sequence of bullseye walks — useful when comparing strategies by hand.
- Lights-on debug mode is a clean reveal: the same scene becomes a daytime track with a visible dashed target, so the student can verify their mental model after the fact.
- Clamps and `Number.isFinite` checks make `shoot()` robust against NaNs.
- Light/dark theming via a single `body.lights-on` class is a tidy CSS pattern.

## 6. Weaknesses / limitations

- **The visualization does not actually visualize Robbins–Monro.** It is a manual game; the algorithm itself lives in the notebook and produces only static matplotlib plots (`plot_history_with_lr`). There is no animation of the *update rule* — no arrow showing `α · error`, no trace of recent `y(t)` values on the track, no overlay of the running estimate vs the true bullseye.
- **No learning-rate or noise controls in the UI.** `state.noiseStd` exists but is hard-coded to 0, and `α` is purely conceptual here. The slider/input the notebook talks about does not exist on the page.
- **Drift behavior is visible only in retrospect.** Because the bullseye only moves *during* `shoot()`, students cannot see the random walk between shots; they only ever see one displaced bullseye after pressing `S`.
- **History UI is awkward.** The empty-state message ("Shoot to start collecting data...") is absolutely positioned with `padding-top: 22px` on the list, and the `historyEmpty` div is hidden/shown via inline style — it overlaps the title visually. There is also no max history cap, so long sessions will scroll a flat `<ul>` indefinitely.
- **Layout is fragile.** `.right-panel` has a hard-coded `height: 750px`, and `.game-shell` uses a 2-column grid that collapses to 1 column under 900 px — but the dart track is full-height of the room, which on a short viewport becomes squashed.
- **No ARIA / no focus management.** Key handling is global on `window`, so the page is unusable without a keyboard, and there are no visible buttons. The "controls" div is a `<br><br>`-padded text block telling the user to look at the right side.
- **Inconsistent semantics between HTML and Python.** The notebook's Robbins–Monro template reads `result['target_score']` and `result['current_score']`, but the HTML never surfaces these names; this is harmless but means the visualization and the algorithm template do not share vocabulary.
- **The score function is symmetric and triangular** (`100 - 2·d`), which makes the "gradient sign" trivially the sign of `(bullseye - player)`. Combined with the noise being 0 by default, the manual game is too easy to be a faithful demo of *noisy* optimization. The notebook later toggles noise via the Python class, not via the HTML.
- **Misleading axis labels.** The track ticks are labelled `10 / 50 / 90` as if they were scores, but they are *positions* (0–100). A student is likely to read them as scores.
- **No "shoot history" overlay on the track itself** — past dart positions are only in the text list, never plotted on the column where they happened.

## 7. State machine / step engine

There is **no step engine and no scrubber**. The system is purely event-driven:

- `state` is a single mutable object (`round`, `t`, `playerPos`, `bullseyePos`, `noiseStd`, `history`, `showBullseye`).
- Each key event mutates `state` and calls `updateUI()`, which re-derives every DOM value from scratch.
- `state.history` is append-only; there is no way to step back, replay, or scrub through rounds. Reset throws away history entirely (it does *not* let you re-watch the same sequence step by step).
- There are no transitions, no animation tweens (the player jumps discretely by 3 units), no `requestAnimationFrame` loop. The bullseye's random walk is invisible — it is sampled lazily inside `shoot()`.

This is appropriate for a manual arcade-style game but unsuitable as a teaching aid for Robbins–Monro convergence, where the value of the demo is precisely watching `y(t)` approach the optimum step by step.

## 8. Look & feel

- **Dark mode by default**, with a radial gradient from `#111` at the top to near-black `#020314` at the bottom. Light mode (`body.lights-on`) uses a sky-blue palette (`#e0f2fe → #bae6fd → #7dd3fc`).
- **Fonts**: system UI stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`); monospace for `kbd` chips. Type sizes are small (0.7–0.95 rem) except the score (1.6 rem).
- **Color accents**: a warm orange/yellow radial gradient on the player avatar (`#facc15 → #f97316 → #ea580c → #7c2d12`) with a glow shadow, which reads well against the dark background. Slate-500 borders (`rgba(148, 163, 184, …)`) tie the panels together.
- **Spacing**: rounded panels (radius 14–18 px), 12–18 px gaps, generous shadows (`0 18px 45px rgba(0,0,0,0.7)`). Two-column grid with min 300 px / 320–420 px tracks.
- **Polish level**: visually coherent and clearly themed, but utilitarian. The header is a single emoji-prefixed string; there are no transitions on dart motion, no SVG dartboard, no animated darts in flight, no sound. The lights-on/off swap is the only motion in the scene, and it is a 0.3 s background transition. Overall it feels like a competent in-house teaching prototype rather than a polished interactive — the aesthetic is consistent with the other Weekend 3 HTMLs (`spooky_house.html`, `blackjack_game.html`) in the same folder.

# Report: `blackjack_game.html`

Source: `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/blackjack_game.html`
Companion notebook: `/Users/carloscotrini/Documents/git_sml/exercises-ainit/Weekend_3/Sarsa_Blackjack.ipynb`

## 1. Pedagogical purpose

The HTML file is the **environment-only / human-play** half of a SARSA exercise. The notebook (`Sarsa_Blackjack.ipynb`) implements the agent side: an `init_table()` that builds a `Q` array of shape `[22][2]`, a `pick_action(Q, state, epsilon)` epsilon-greedy selector, and a `sarsa_learning(num_games=300000, alpha=0.1, gamma=1.0, epsilon=0.1)` loop that performs the on-policy update

```
Q[s][a] += alpha * (r + gamma * Q[s'][a'] - Q[s][a])
```

The HTML page does **not** teach SARSA itself — it teaches the **MDP** that SARSA is about to solve. Concretely it makes concrete:

- **Episodic returns**: a "game" = an episode, the running `Episode Reward` is the realised return G.
- **State**: a single integer `sum` in `{0, ..., 21+}`. The page's `current-sum` stat is literally the state index used in `Q[state][action]`.
- **Actions**: HIT (`action = 1`) and STICK (`action = 0`), matching the notebook's `take_action(state, action)`.
- **Reward shaping**: the unusual non-standard rewards `r = card` on a safe HIT, `r = -sum` on a bust, `r = 0` on STICK. These are quoted verbatim from `take_action` in the notebook and surfaced in the on-screen rules.
- **Risk vs. reward intuition**: the "Strategy Hints" box invites the user to discover the sticking threshold (around 17–19), priming them for what SARSA's converged Q-table should reveal.

What it does **not** teach: there is no Q-table view, no policy view, no SARSA update visualisation, no epsilon/alpha sliders, no learning curve. It is purely a manual-play simulator that exposes the reward signal and the state.

## 2. Scene & mechanics

The page is a single-screen "casino felt" panel. From top to bottom:

- **Header**: gradient banner "Simplified Blackjack — A fun twist on the classic card game!".
- **Rules card** (`.rules`): five bullets stating start sum 0, cards uniform on `[1,10]`, HIT/STICK reward formulas, and the maximisation goal. Numbers are emphasised with a yellow `.highlight` inline pill.
- **Game area** (`.game-area`, dark green `#1a5f1a` felt): a row of five `.stat-box` tiles — `Current Sum`, `Episode Reward`, `Cards Drawn`, `Games Played`, `Total Reward`.
- **Cards display** (`.cards-display`): a flex row of small white `.card` divs (60×85 px) that simply render the integer card value as bold black text. A `dealCard` keyframe animation slides each card in from above with a slight scale-up.
- **Buttons**: green `HIT`, red `STICK`, indigo `NEW GAME`.
- **Message strip**: a status banner that turns blue (playing), green (`.win`, used for any successful HIT), or red (`.lose`, bust). The colour semantics are slightly misleading — see weaknesses.
- **Strategy Hints box**: yellow callout with risk/reward prose.
- **Game History box**: a scrollable `<div>` listing each finished episode (most recent first) as `Game N — BUST/STICK at sum X (Y cards) +reward`, colour-coded green (positive), red (negative), grey (zero).

A typical user trajectory: press HIT, see a card animate in, watch `Current Sum` and `Episode Reward` jump, decide HIT again or STICK; on bust, the buttons disable and a red banner shows `BUST! Sum = 24 > 21. Episode Reward = -24`; press NEW GAME to reset the episode (but `gamesPlayed` and `totalReward` persist).

There is **no dealer**, no dealer hand, no win/loss-vs-dealer concept, no card suits, no face cards, no aces with dual value — this is the simplified one-player MDP from the notebook, not real Blackjack.

## 3. Interactivity

Three buttons, no other inputs:

- `hit()` — draws a uniform integer 1..10 via `drawCard() = Math.floor(Math.random()*10)+1`, pushes onto `cards`, increments `sum`, updates rewards, and on `sum > 21` flips `gameOver` and disables both action buttons.
- `stick()` — sets `gameOver = true`, increments `gamesPlayed`, logs the episode with reward 0, disables buttons.
- `reset()` — re-enables buttons and clears per-episode state (`sum`, `episodeReward`, `cardsDrawn`, `cards`) but **deliberately preserves** `totalReward`, `gamesPlayed`, and `gameHistory`.

There is no epsilon slider, no learning rate, no policy display, no agent autoplay, no scrubbing of past episodes, no Q-table, no chart of returns over episodes, and no keyboard shortcuts.

## 4. Implementation

- **Single self-contained file**, 600 lines, ~19 KB.
- **Vanilla HTML/CSS/JS only**. No frameworks, no p5.js, no D3, no SVG, no `<canvas>`. All rendering is DOM + CSS.
- **No external assets**: no card images, no sounds, no fonts beyond the system stack `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`. Card "art" is just a number in a rounded white div; suits/glyphs are emoji in headings (`🎰`, `🎴`, `🛑`, `🔄`, `💥`, `✓`, `✋`).
- **Code structure**:
  - `<style>` (≈340 lines) — all visual rules.
  - `<body>` (≈80 lines) — static markup, no templating.
  - `<script>` (≈170 lines) — eight global vars (`sum`, `episodeReward`, `totalReward`, `gamesPlayed`, `cardsDrawn`, `gameOver`, `cards`, `gameHistory`) and seven functions: `drawCard`, `updateDisplay`, `addToHistory`, `updateHistoryDisplay`, `hit`, `stick`, `reset`. Buttons wire up via inline `onclick` attributes.
- **No build step, no module system, no tests.** The page is meant to be opened directly from disk.

## 5. Strengths

- **Faithful to the MDP in the notebook.** The reward function `r = card` / `r = -sum` / `r = 0` and the state `sum ∈ {0..21}` are exactly those in `take_action` and the `Q` table. A student who plays for two minutes will internalise the environment before reading the SARSA code.
- **Zero dependencies, zero setup.** Opens by double-click; works offline.
- **Live counters for both episode and lifetime reward.** Showing `Episode Reward` and `Total Reward` side by side is a small but useful pedagogical choice — it foreshadows return vs. cumulative regret.
- **Episode history with colour-coded reward.** Lets the student eyeball their own implicit policy: do their STICK sums cluster around 17? The "Try this" hint in the Strategy Hints box explicitly nudges this self-reflection.
- **Disabled-button discipline.** Once `gameOver`, HIT and STICK go dim, which prevents the confusing state of acting after termination.
- **Pleasant micro-animations.** The `dealCard` keyframe and the `pulse` reward animation (`reward-animation` class added then removed via 500 ms `setTimeout`) make the reward update feel causal.

## 6. Weaknesses / limitations

- **Wrong colour semantics.** A successful HIT applies `messageEl.className = 'message win'` (green), even when the running `episodeReward` is heading toward catastrophe. STICK, regardless of outcome, uses the neutral blue `playing` class. There is no real "win" state — Blackjack here is just reward accumulation — yet the styling implies one.
- **No connection to SARSA.** This is the biggest gap given the file's filename and the companion notebook. There is no Q-table panel, no per-state value bar chart, no policy-arrow row that updates, no "let the agent play" toggle, no learning curve. A student finishes the page no closer to understanding `Q[s][a] += alpha*(r+gamma*Q[s'][a']-Q[s][a])` than before.
- **Nothing scrubbing-like.** History is append-only and read-only. You cannot replay episode 7, you cannot step forward/back through actions, you cannot pause mid-episode and inspect.
- **State variable shadows JS built-in semantics weakly.** `let sum = 0;` at module scope is fine but `sum` is also a property name many students will trip on; there is also no namespacing — eight loose globals.
- **Bust message is misleading on the bust card.** The bust branch never tells the user **which card** caused the bust, only the final sum. The successful branch shows `Drew {card}` but the bust branch shows `Sum = ${sum} > 21`.
- **`stick()` logs `episodeReward` as the "reward" of the episode**, while `hit()`-bust logs the single bust reward `-sum`. The history entries are therefore inconsistent: a stick row shows the cumulative episode return, but a bust row shows only the terminal penalty (the cards-along-the-way rewards are silently dropped from the row even though they correctly stayed in `totalReward`). This will confuse anyone trying to verify their mental model against the table.
- **`drawCard()` is uniform on 1..10** which matches the notebook (`random.choice([1..10])`) but is **not** real Blackjack (no 4× weighting on 10s for face cards). The page does not flag this as a simplification, even though the rules card mentions "1 to 10" — a participant might think they understand Blackjack when they have actually understood a custom MDP.
- **No epsilon, no alpha, no episode-count knob.** All three are first-class parameters in the notebook (`alpha=0.1, gamma=1.0, epsilon=0.1`) and would be the natural sliders, but none exist.
- **No accessibility.** Buttons are reachable but the colour-only semantics of the message banner and history rows fail WCAG contrast/colour-blind heuristics; no `aria-live` on the message banner.
- **Mobile layout collapses but card row can wrap awkwardly** on narrow screens because each `.card` is a fixed 60×85 px and `.cards-display` is `flex-wrap: wrap`.
- **`reset()` should arguably be called `newEpisode()`.** Students reading the SARSA notebook think of `reset` as resetting *training*; here it only resets the current episode, which is exactly the opposite of what the global counters suggest.

## 7. State machine / step engine

There is **no step engine**. The interaction is **purely event-driven**: each click of HIT/STICK/RESET mutates globals and re-renders the entire DOM via `updateDisplay()`. There is no notion of a step index `t`, no transition record `(s_t, a_t, r_t, s_{t+1})`, no array of frames the user can scrub. The history list captures only end-of-episode summaries, not the intermediate `(s,a,r)` triples — which is precisely the data SARSA consumes. This is the single biggest structural mismatch with the visualization brief: a step-engine pattern with `(state, action, reward, next_state, next_action)` tuples and a scrubber would map 1-to-1 onto the SARSA update and is the obvious next-version improvement.

## 8. Look & feel

- **Palette**: indigo/violet body gradient `#667eea → #764ba2` (used in the page header, the rules accent bar, the reset button, the history-entry left border, and the stat-value text), deep casino green `#1a5f1a` for the felt area, white card surfaces, and Bootstrap-flavoured semantic accents — green `#28a745` (HIT, win banner, positive reward), red `#dc3545` (STICK, lose banner, negative reward), warm yellow `#fff3cd` for the Strategy Hints / rules highlights, info blue `#d1ecf1` for the playing banner.
- **Typography**: Segoe UI system stack, large 2.5em emoji-flanked title, 2em bold stat values, 1.1–1.2em buttons and message — readable, generic, "professional dashboard".
- **Polish level**: high for a hand-rolled vanilla file. Rounded corners (10–20 px), soft drop shadows on the container, inset shadow on the felt, hover translate-y on every button, two keyframe animations (`dealCard`, `pulse`), a working mobile breakpoint at 600 px. It feels like a polished landing-page mock more than a research tool.
- **Aesthetic register**: corporate/edu-tech with casino accents — consistent with the README's stated audience ("managers with little Python experience"). It reads as friendly and non-threatening, but it does not look like a teaching diagram or a math-heavy RL notebook. Compared to a SARSA reference implementation in Sutton & Barto style, it is visually rich but informationally thin: there is no Q-value heatmap, no policy grid, no convergence plot.

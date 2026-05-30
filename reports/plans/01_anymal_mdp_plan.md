# Rebuild plan — ANYmal MDP visualization

Target folder: `classic_rl/anymal-mdp/` (sibling to the future `blackjack/`, `darts/`, `spooky-house/` viz folders).
Style guide: `.claude/skills/course-viz/SKILL.md` (multi-file editorial click-step pattern).
Source audit: `reports/01_anymal_mdp.md`.

The plan is concrete enough to fan out to scene agents but light enough to redirect.

## 1. What this viz must do (pedagogy)

The original `1_ANYmal_MDP.html` is the very first artefact students see in Weekend 3. It exposes only the **environment** half of an MDP — state, transitions, rewards — and even those are unlabelled on screen. There is no policy, no value function, no return, no discount factor. A learner who hasn't yet read the notebook sees only a Pac-Man clone.

The rebuild keeps that "first contact" role but makes it carry the **MDP definition** — the four operational components, with γ named but not yet developed:

> *An MDP is five things: states, actions, transitions, rewards, and a discount factor. ANYmal lives inside one. We'll meet the first four today; the discount factor comes later.*

By the end the student should be able to point at the screen and name `S`, `A`, `P`, `R`. The discount factor `γ` is mentioned in the title and recap as the fifth thing, but its mechanics — discounted return, return curves — are deferred to a later viz (Spooky House or Darts). Policy and value are also deferred. The viz is "what is the world?", not "how do I act?".

**Driving model: 100% manual.** Every step on the grid is a student keystroke. There are no pre-canned trajectories, no autoplay, no replay. Internal step engines (where present) walk back through the *student's own action history* via reset+replay, per the SKILL §"Step engine" pattern.

## 2. Scene list (6 scenes, click-step)

Click-step (not scrollytelling) — math-heavy didactic content with rewind, per SKILL §"Two interaction patterns."

| # | Title                    | What the student sees and does                                                                                                                                                                                                                                                                            | Internal step engine?                                                  |
|---|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| 0 | An MDP is five things    | Title card. SVG silhouette of ANYmal on a cream backdrop. Five-line manifesto in serif: states, actions, transitions, rewards, discount. Last line in muted type: *"We'll meet the first four today."*                                                                                                    | No                                                                     |
| 1 | The state                | Grid appears. ANYmal centred, two ghosts, one star. The HUD reads the state tuple `s = (anymal, g₁, g₂, ★)`. Student drives ANYmal with `← ↑ → ↓`. Each component of the tuple flashes when it changes, so the student *sees* what counts as state.                                                       | Yes — replays the student's own action history                         |
| 2 | The action               | Same grid, same controls. Now the action set `A = {↑, ↓, ←, →}` is rendered in KaTeX next to the grid, and a small action-arrow widget lights up the chosen direction on each keystroke. Focus is on "what you chose," not "what the world is."                                                           | Yes — replays the student's own action history                         |
| 3 | Stochasticity            | Same grid, same manual control, but with probability `p` ANYmal's executed action diverges from the commanded one. Both arrows are drawn — solid for commanded, dashed for executed. Slider for `p ∈ [0, 0.5]`. KaTeX block: `P(s' \| s, a)`. The surprise of "I pressed up but went left" is the lesson. | Yes — replays history; slider live-updates `p` for *future* steps only |
| 4 | The reward               | Same manual driving. A reward ledger appears below the grid: each step appends a row `(s, a, s', r)`. `r = +10` star, `r = -1` step, `r = -100` ghost (terminal). KaTeX: `R: S × A × S → \mathbb{R}`.                                                                                                     | Yes — ledger rewinds with the action history                           |
| 5 | Recap: `⟨S, A, P, R, γ⟩` | Static five-card layout, one card per tuple element. Each card points at where the element lived on the grid in earlier scenes (small inline thumbnails). The `γ` card is muted with the caption *"next viz."* No live grid.                                                                              | No                                                                     |

**Why this set:**
- It explicitly names every operational tuple element on screen — fixing the audit's #1 weakness ("nothing on screen names states, actions, transitions, or rewards").
- Manual driving throughout means each lesson lands in the student's fingers, not in a recording. Scene 3's malfunction surprise is felt, not watched.
- γ is named in Scene 0 and Scene 5 only, as a forward-pointer. No discount math, no return curves.
- The recap replaces the original's `alert("Game over")` with a calm pedagogical close.

## 3. Bugs and curriculum drift the rebuild fixes

Carried over from `reports/01_anymal_mdp.md`:

1. **Ghost policy continuity.** Original HTML's `moveGhost` chases ANYmal; `anymal_utils.py` uses uniform-random. **Rebuild uses uniform-random** (matches notebook + simpler pedagogy: ghosts are part of the *environment's* stochasticity, not adversaries).
2. **`state.gameOver` dead code** — replace with a single `terminal` flag in shared state.
3. **`alert()` blocking the event loop on game-over** — replace with an in-page modal-card and a button "go to recap" that advances to Scene 5.
4. **Teleporting movement** — Scene 1's render uses D3 enter/update/exit on a `<g>` of cells so movement *animates* over ~150 ms. The audit flagged the abrupt repaint.
5. **`pRandom` overloads mobility + aggression** — gone. The malfunction slider is `p_malfunction` only, and ghosts are uniform-random with no separate slider.
6. **No log history** — Scene 4's reward ledger *is* the log, persisted in shared state across step-engine rewinds.
7. **No accessibility** — every interactive element gets a label, `aria-live="polite"` on the HUD, focus rings preserved.

The audit also flagged the unused `anymal.jpg`. Per your call, the rebuild uses **SVG silhouettes only** — no photo. SVG themes correctly via CSS classes (light/dark inversion automatic). The JPG stays in `exercises-ainit/` and isn't copied over.

## 4. File layout (per SKILL §"Hard requirements" #1)

```
classic_rl/anymal-mdp/
  index.html
  css/
    style.css        ← theme tokens, scene engine layout, .grid/.cell, .entity-* classes
    scene0.css ... scene5.css
  js/
    theme.js         ← light/dark toggle, 't' shortcut, localStorage
    main.js          ← scene engine, hash routing, dot pager, prev/next
    mdp.js           ← shared math: step(state, action, rng), uniformGhostMove, clamp
    grid.js          ← shared D3 grid renderer (enter/update/exit transitions on cx, cy)
    history.js       ← action-history store, used by per-scene step engines for rewind
    katex-helpers.js ← thin wrapper (displayMode, throwOnError: false)
    scenes/
      scene0.js ... scene5.js
  data/
    datasets.js      ← window.DATA = { M, N, initialState, sprites, katexStrings, ... }
  vendor/
    d3.min.js
    katex.min.js, katex.min.css, fonts/
  assets/
    anymal-sprite.svg
    ghost-sprite.svg
    star-sprite.svg
```

Browser-openable from `file://`. No CDN, no fetch, no build step. Light mode is the lecture default per SKILL §3.

**No `precompute/` directory.** With 100% manual driving there is no canonical trajectory to precompute. `data/datasets.js` only carries static config (grid dimensions, initial entity positions, sprite paths, KaTeX strings, sample reward values for the legend).

## 5. Phased build with parallel-agent fan-out

### Phase 0 — Foundation (sequential, lead agent)

- Copy `neuralnetworks/cnn-deepdive/` as the template scaffold; strip its scene bodies; keep the shell, topbar, theme toggle, scene engine, hash router, dot pager, `&run` flag plumbing.
- Write `js/mdp.js`: `step(state, action, rng)`, `uniformGhostMove(rng, M, N)`, `clamp`. All take an explicit `rng` argument (seeded; never `Math.random()`).
- Write `js/grid.js`: a D3 renderer keyed on entity id, with enter/update/exit transitions on `cx, cy` (~150 ms ease-out).
- Write `js/history.js`: a per-scene action store with `push(action)`, `replayTo(cursor)`, `clear()`. Each scene's step engine reads from this for prev/next via reset+replay.
- Commission three SVG sprites (`assets/*.svg`) — single-color silhouettes, fill via CSS class so theme switch works.
- Stub each `scenes/sceneN.js` to register on `window.scenes` and render a placeholder.
- Theme tokens: cream `#f9f7f1` light, warm dark `#181612`. Categorical palette per SKILL — ANYmal red `#b8323a`, ghosts purple `#7a5c8c`, star amber `#c08a3e`. **No inline colors anywhere** — `.entity-anymal`, `.entity-ghost`, `.entity-star`.

### Phase 1 — Scene fan-out (parallel after Phase 0)

Three agents. Bundling preserves tonal arcs (per SKILL §"Bundle scenes for tonal coherence"):

- **Agent A — bookends:** scenes **0, 5**. Title card + five-card recap. Light visual setup, similar voice. Owns the muted-γ-card treatment.
- **Agent B — what is the world, what do I do:** scenes **1, 2**. State intro + action intro. Tonal pair — both manual driving, focus shifts from "this tuple is the state" to "this set is the action space."
- **Agent C — what actually happens, what does it cost:** scenes **3, 4**. Stochasticity + reward ledger. Tonal pair — both layer extra information onto the same manual driving. Highest pedagogical density. Cannot be split.

Each agent gets the SKILL §"Scene agent prompt template" filled in with allowed globals (`d3`, `katex`, `Theme`, `DATA`, `MDP`, `Grid`, `History`), the cluster-class allowlist, and the cold-entry rule (each scene must reconstruct its initial state from `DATA` if entered via dot-pager without prior scenes having run).

### Phase 2 — Aggregation + verification (lead agent)

- Link all `scene*.css` in `index.html`.
- Parse-check every JS file (SKILL §Verification 1).
- Headless Chrome screenshot every scene at 1280×800 and 1920×1080, in both themes (SKILL §3). For Scene 3, add a `?test=` hook so the screenshot can capture a post-malfunction frame without simulated keystrokes (SKILL §"What headless screenshots catch poorly"). Read every PNG.
- Walk through both themes manually; fix tonal drift if Agent B and Agent C diverged on arrow style or KaTeX sizing.
- Don't commit; hand back for review.

## 6. Decisions locked in (from your answers)

1. **Discount factor** — deferred. Named only in Scene 0's manifesto and Scene 5's recap card (muted, "next viz"). No γ slider, no return curve, no `G_t` in this viz.
2. **Driving model** — 100% manual on every interactive scene. Internal step engines rewind through the student's own action history via reset+replay.
3. **Sprites** — SVG silhouettes for ANYmal, ghosts, and star. No photo. `anymal.jpg` not copied over.
4. **Recap** — five cards (`S, A, P, R, γ`), no teaser panel.
5. **Trajectory length** — n/a now that driving is manual; episode length is bounded by `state.maxRounds` (default 30) and the student's choices. The bound stays at 30 for projection clarity.

Ready to fan out. Next action on my side: kick off Phase 0 (lead agent) and dispatch the three Phase 1 scene agents in parallel once the scaffold is up.

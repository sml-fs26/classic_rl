# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A static GitHub Pages site (`sml-fs26/classic_rl`) hosting **seven browser-only educational visualizations** for the reinforcement-learning track of a Statistical Machine Learning course. Each viz is a self-contained sibling folder that runs from `file://` or any static server with **no build step, no package.json, no CDN**.

The viz follow a strict in-repo style — all of them are implementations of the `.claude/skills/course-viz` skill (editorial click-step pattern, multi-file structure). When adding or modifying a viz, read `.claude/skills/course-viz/SKILL.md` first; it is the canonical spec and is much larger than this file.

Curriculum order (matches `index.html` and the audit/plan numbering):

```
anymal-mdp/      → MDP first-contact          (S, A, P, R named on screen)
casino/          → explore/exploit + ε-greedy
spooky-house/    → Bellman recursion + γ
darts/           → Robbins-Monro online estimation
sarsa-anymal/    → SARSA capstone (small cliff-walk)
snakes-ladders/  → integrative review (board game as MDP)
pokemon-battle/  → integrative review (Gen-1 battle aesthetic, multi-language)
```

## Running and developing

There is no build. Use a plain static server from the repo root:

```
python3 -m http.server 8765
# then visit http://localhost:8765/             (landing page)
#       or  http://localhost:8765/anymal-mdp/   (single viz)
```

Hash flags for dev / headless screenshots (every viz supports the first three; pokemon also supports `&skipboot`):

- `#scene=N` — deep-link to scene N (the scene engine reads & syncs this).
- `&theme=light|dark` — override the persisted theme.
- `&instant` — skip the fade transition so headless Chrome captures a fully-rendered frame (CSS transitions run on the compositor and don't follow `--virtual-time-budget`).
- `&run` — auto-press the primary "play" button on scenes that gate animation. Dev affordance for headless verification, not a user feature.
- `&skipboot` (pokemon-battle only) — bypass the Game Boy boot splash.

### Per-viz precompute

Six of the seven viz have a Node.js script under `precompute/build-datasets.js` that rewrites `data/datasets.js` deterministically (Mulberry32 RNG, frozen seed). Run from inside the viz folder:

```
cd spooky-house
node precompute/build-datasets.js
```

The scripts assert pedagogical invariants in code (e.g. "greedy total < optimal total, gap ≥ 3", "regret(ε=0.01) > regret(ε=0.1) at t=T") — these are the lesson. Don't relax an assertion to make a re-roll pass; pick a different seed or fix the generator.

`anymal-mdp` is the exception — it has no precompute because every trajectory is the student's keystrokes.

### Pokemon screenshot regression

`pokemon-battle/scripts/regress-screenshots.sh` is a headless-Chrome size-delta diff. It needs a server at `localhost:8765` and Chrome at the macOS path baked into the script. See `pokemon-battle/scripts/README.md`. `--baseline` overwrites baselines from a known-good main; bare run compares; `--clean` wipes `current/` and `diff/`. Triggered only manually — it is **not** wired into CI.

### Deployment

`.github/workflows/pages.yml` deploys the entire repo as a static site to GitHub Pages on push to `main`. There is no test or lint step in CI — verification happens locally via browser walkthrough and (for pokemon) the screenshot harness.

## Architecture every viz shares

Each viz folder is the same shape:

```
<viz-name>/
  index.html             — links CSS then JS in a specific order (see below)
  css/style.css          — theme tokens, .topbar/.stage/.scene, palette
  css/sceneN.css         — per-scene styles
  js/theme.js            — data-theme + 't' shortcut + #theme= override; exports window.Theme
  js/main.js             — click-step scene engine; the SCENES array is the source of truth
  js/scenes/sceneN.js    — registers window.scenes.sceneN(root) → { onEnter, onLeave, onNextKey, onPrevKey }
  js/<libs>.js           — shared modules (window.MDP, window.Bellman, window.SARSA, window.QTable, …)
  data/datasets.js       — sets window.DATA = {...}
  vendor/katex/          — vendored, never CDN
  precompute/            — Node script, NOT loaded at runtime
```

**Script load order matters.** Plain `<script src>` tags, no modules. KaTeX must be loaded before any scene that calls `katex.render`; `data/datasets.js` before any scene reads `window.DATA`; library modules (`mdp.js`, `bellman.js`, `sarsa.js`, `qtable.js`, …) before scenes; scene files before `main.js`. The order in each `index.html` is authoritative — copy it when you add a new scene file.

### Scene engine contract

`main.js` owns navigation; scenes are dumb mount points. The contract:

```js
window.scenes.sceneN = function(root) {
  // build DOM into root
  return {
    onEnter?(),       // called on every entry (including cold)
    onLeave?(),       // called when leaving the scene
    onNextKey?(),     // return true to consume ArrowRight (internal step), false to advance scene
    onPrevKey?(),     // ditto for ArrowLeft
  };
};
```

The scene's builder runs **once**, on first visit; subsequent visits call `onEnter()`. Therefore: state for the scene goes in closure variables; `onEnter` resets them; `render()` rebuilds from state. **Cold entry must work** — a student deep-linked to scene 4 has not played scenes 0–3, so scene 4 must reconstruct from `window.DATA`, not from a sibling scene's leftovers.

Scene keys do NOT have to be contiguous. Casino's `SCENES` array is `[scene0, scene1, scene4, scene5, scene6]` — deliberate gaps so deep-links survived a mid-build scene reshuffle. Add new scenes by appending to the `SCENES` array in `main.js`; the dot-pager and routing fall out of that.

### Step engines (within-scene Next button)

Many scenes have an internal step cursor (the SARSA update walks A→B→C→D→E→F; the Bellman sweep advances cell-by-cell). The discipline is in the skill: **state is the source of truth, animations are decoration**, **Prev = reset+replay, not inverse mutations**, **one DOM action per step**.

### Library modules

Shared math/utility modules expose themselves as project-prefixed globals. Common ones:

- `window.MDP` — transition function, reward constants, `initialState()`, `successors()`, `step()`
- `window.Bellman` — `computeV(rewards, gamma)`, `computePolicy(V)` (Spooky House, Snakes & Ladders, Pokemon)
- `window.SARSA` — `makeQ()`, `ACTIONS`, `argmaxIndex()`, `pickEpsGreedy()`, `row()` (SARSA, Snakes, Pokemon)
- `window.QTable` — mountable Q-table widgets (`mountNumerical`, `mountValue`, `mountPerAction`, `fromSnapshot`)
- `window.Estimators` — Robbins-Monro / running-mean estimators (Darts)
- `window.Theme` — `apply(theme)`, `current()`

These are **per-viz copies**, not shared across folders. Anymal's `MDP` is not Snakes & Ladders' `MDP`. When duplicating logic between viz, copy the file and adapt — don't reach across folders.

## Style and aesthetic

Editorial — Pudding / NYT / Distill voice, not casual hand-drawn. The skill defines the palette and typography. Tokens to know:

- Light (lecture default): cream `#f9f7f1`, ink `#1a1a1a`, hairline `#d8d4ca`
- Dark: warm dark `#181612`, ink `#ece7d9`
- Categorical palette: blue `#2f6cb1`, red `#b8323a`, amber `#c08a3e`, purple `#7a5c8c`, green `#4a8b6b`, burnt orange `#a05a2c`
- Serif headers (Iowan Old Style → Palatino → Georgia), sans body, mono for UI metadata
- Theme swap is mandatory and lives in `js/theme.js`; **never inline categorical colors** — use CSS classes (`.cluster-N`, `.entity-anymal`, etc.) so dark mode flips automatically

Pokemon-battle is the only viz that intentionally deviates: it adds a Gen-1 Game Boy palette layer (CRT/amber theme, DotGothic16 Japanese font, music + SFX, language toggle via `window.I18N`). It still inherits the editorial base — the Pokemon skin is a paint job on the same scene engine.

## Reports and plans

- `reports/0N_*.md` — audits of the original single-file `.html` artefacts the viz are rebuilds of. Read these to understand pedagogical intent and which bugs the rebuild fixes.
- `reports/plans/0N_*_plan.md` — the rebuild plans. Scene list, driving model (manual / autoplay / precomputed), file layout, parallel-agent fan-out. These are the contracts that produced the current code; treat them as living docs when extending a viz.

## Hard rules (from the skill, restated because they trip people up)

- **No `fetch`, no CDN, no ES-module imports.** Everything browser-openable from `file://`.
- **One viz = one sibling folder.** Don't expand an existing viz with unrelated content — add a new folder, link it from the root `index.html`.
- **Hash routing is non-negotiable.** Every click-step viz reads `#scene=N` on load and syncs on navigation. This is how the lecturer deep-links and how the headless screenshot harness reaches scene 8 without clicking Next eight times.
- **Verify in a browser before reporting done.** Type-check and lint don't exist here; the verification loop is parse-check (open `index.html`, watch for console errors) + walk every scene in both themes + headless screenshot for non-trivial layouts.
- **Precompute determinism.** Two runs of `node precompute/build-datasets.js` must produce byte-identical `data/datasets.js`. Mulberry32 seeded at the top of the file; assertions in code, not in a final-report claim.

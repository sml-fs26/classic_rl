# Rebuild plan — Darts in the Dark (Robbins-Monro / stochastic approximation) visualization

Target folder: `classic_rl/darts/` (sibling to `anymal-mdp/`).
Style guide: `.claude/skills/course-viz/SKILL.md`.
Source pedagogy: `exercises-ainit/Weekend_3/4_Darts.ipynb` + `darts_utils.py`.
Audit of original: `reports/03_darts.md`.
Curriculum slot: viz #4 of 5. Comes after Spooky House (Bellman, V given known rewards) and before SARSA (everything together).

The plan is concrete enough to fan out to scene agents but light enough to redirect.

## 1. What this viz must do (pedagogy)

Spooky House taught: given exact rewards and deterministic transitions, V can be computed exactly. Darts loosens that: **rewards are noisy, the world drifts, and you only see *samples***. The question becomes *"how do I keep an estimate that tracks the truth without seeing the truth?"*

The answer is the **Robbins-Monro update**:

> `x_{n+1} = x_n + α_n · (target_n − x_n)`

This is the structural seed of every TD method. SARSA's update `Q ← Q + α(r + γQ' − Q)` is exactly Robbins-Monro on a TD target. Casino's empirical mean is a *special case* (with `α_n = 1/n`). Spooky House's backward sweep is the *deterministic, no-noise* limit. Darts ties them together.

By the end the student should be able to:
1. State why a sample mean fails when the underlying target drifts (the audit's `noiseStd = 0` neuter is fixed here).
2. Write the RM update for a 1-D estimate-the-bullseye problem.
3. Tell a fixed-α trace from a decaying-α trace at a glance, and explain when each is preferable.
4. Recite the two Robbins-Monro conditions: `Σα_n = ∞` and `Σα_n² < ∞`.

**Out of scope:** UCB / Thompson, multi-dimensional gradient SA, multi-step returns, eligibility traces, function approximation. Scene 5's recap names *"TD learning"* once as foreshadowing for SARSA, but the body says **estimate**, **target**, **learning rate**, **decay**.

The audit's #1 finding stands: the original is *the manual-play half* of the exercise; the algorithm itself lives in the notebook. The rebuild adds the algorithm — that's the whole point.

## 2. Driving model: mixed

| Scene | Mode              | Why                                                                      |
|-------|-------------------|--------------------------------------------------------------------------|
| 0     | static            | Setup                                                                    |
| 1     | manual            | Student throws darts themselves; feels the noise + drift                 |
| 2     | autoplay          | Sample-mean trace runs against drifting target — failure mode            |
| 3     | autoplay + slider | RM update with α slider; trace approaches drifting target                |
| 4     | autoplay          | α-comparison: three traces side-by-side (small α / large α / decaying α) |
| 5     | static            | Recap                                                                    |

`&run` triggers Play on autoplay scenes; `&instant` skips fades.

## 3. Scene list (6 scenes, click-step)

The original is a 1-D vertical track 0-100 (audit confirms). The rebuild **stays 1-D** — the lesson is about a single estimate trajectory, and a 1-D scalar makes the chart trivially honest. The "darts in the dark" framing is preserved (matches notebook + filename) via a horizontal track + a darkened backdrop in light mode and a barely-visible target marker.

Score function from `darts_utils.py`: `score = max(0, 100 - 2·|player_pos - bullseye_pos|)` plus optional Gaussian noise. Bullseye drifts via clamped random walk between rounds. **Vocabulary preserved** from the notebook: `target_score`, `current_score`, `player_pos`, `bullseye_pos`.

| # | Title                    | What the student sees and does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Internal step engine?                                                        |
|---|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 0 | Aim in the dark          | Title card + a horizontal track 0-100 with a single player marker (ANYmal SVG sprite, small) at position 50. The bullseye is **NOT visible** (we're "in the dark"). KaTeX line: *"You don't see the target. Each throw gives a noisy score. After T throws, where do you guess the bullseye is?"*. Caption emphasises the curriculum bridge: *"Spooky House had exact rewards. Darts has noisy ones."*                                                                                                                                                     | No                                                                           |
| 1 | Throw a dart             | Same horizontal track. Press `␣` (space) to throw at current position; `←/→` move position by 1; `↑/↓` move position by 5. After throwing, a small chip lands at the player position with the score number floating above it (e.g., `87`). Score history list on the right (last 12 throws). Cumulative throw count in HUD. The bullseye drifts each throw (clamped random walk, small step) — but is still hidden. After ~20 throws, the student should *intuit* that scores are noisy and high-scoring positions cluster around the (drifting) target.   | Yes — student's throw history; ←/→ rewind/replay; at start, ← advances scene |
| 2 | The sample mean fails    | Two horizontal tracks stacked: top shows a **truth track** with the drifting bullseye visible (so the student sees what's going on), bottom shows a **belief track** with a **sample-mean estimate** updating live. Autoplay: 200 throws, throws clustered around the (drifting) bullseye via a simple "throw near current estimate" heuristic. The sample-mean estimate **lags** the drifting target — visibly. Caption: *"Old throws weigh as much as new ones. The truth has moved on."*                                                                | Yes — autoplay with play/pause/step/reset; cursor scrubs trajectory          |
| 3 | The Robbins-Monro update | Same dual-track layout. KaTeX block (large, centred): `\hat{x}_{n+1} = \hat{x}_n + \alpha_n \cdot (s_n - \hat{x}_n)` where `\hat{x}_n` is the estimate, `s_n` is the latest noisy score-position, `α_n` is the learning rate. Slider for `α ∈ [0, 1]` default 0.1. Autoplay: same scenario as scene 2 but with the RM update. The estimate now **tracks** the drifting target with lag inversely proportional to α. Slider changes future steps only.                                                                                                      | Yes — autoplay engine                                                        |
| 4 | The α trade-off          | Same dual-track layout. **Three estimate traces** overlaid in different hues: `α=0.02` (slow, stable), `α=0.5` (fast, noisy), `α_n = 1/n` (decaying, satisfies RM conditions). All three driven by the same throw sequence (one rng, one trajectory, three estimators). After ~300 throws, decaying-α has lowest tracking-error-against-noise; fixed-α has tracking issues; small-α lags behind. **Two quotes from the recap teaser**: KaTeX showing `\sum_n \alpha_n = \infty` and `\sum_n \alpha_n^2 < \infty` — labeled "the Robbins-Monro conditions". | Yes — autoplay                                                               |
| 5 | Recap → next viz         | Five-card layout. Cards: **estimate** (a number that updates), **target** (the noisy thing we're approaching), **learning rate** (α — the scale of each update), **decay** (let α shrink over time), **TD update** (muted card with caption "*next: SARSA = Robbins-Monro on a TD target"*). One-line foreshadow: *"Casino estimated one value. Spooky House propagated values backward. Darts kept estimates fresh under noise. Next: all three at once."*                                                                                                | No                                                                           |

**Why 6 scenes:**
- Three autoplay scenes (2, 3, 4) is the right beat for an algorithm-comparison story. Two would compress; four would over-decompose.
- "α matters" + "decaying α" are the same scene (scene 4) because they're naturally compared on the same trace plot.
- The original had *no* autoplay at all; this is the biggest structural rebuild concern.

## 4. Bugs and curriculum drift the rebuild fixes

From `reports/03_darts.md`:

1. **`noiseStd` hardcoded to 0** — original didn't even use the noise param. **Rebuild always has noise on**, with the noise std exposed as a static value (no slider; the lesson is "there is noise", not "tune the noise").
2. **No autoplay, no algorithm visualization** — only manual play in original. **Rebuild's scenes 2-4 ARE the algorithm.**
3. **Track ticks 10/50/90 look like scores but are positions** — confusing. **Rebuild labels the track axis explicitly: "position (0-100)" with major ticks every 25.**
4. **Bullseye drift invisible between shots** — student couldn't see the target moving. **Rebuild's scenes 2-4 show a "truth track" with the drifting bullseye visible.** Scene 1 keeps it hidden because manual play needs the dilemma.
5. **No on-track history overlay** — past shots disappeared. **Rebuild keeps the last K shots as faded chips on the track**; full numerical history in a side panel.
6. **Right panel has hardcoded `height: 750px`** — fragile. **Rebuild uses CSS Grid + `min-height` only, no fixed pixel heights.**
7. **Window-level keydown listener with no buttons hurts accessibility** — **rebuild adds visible Throw / Move / Reset buttons next to the keyboard hints**, mirroring the keyboard but also clickable.
8. **Vocabulary mismatch** — notebook reads `result['target_score']` etc.; HTML never surfaces those names. **Rebuild surfaces `target_score`, `current_score` in the HUD verbatim.**

Curriculum-level bridges:

9. **Casino → Darts continuity:** Casino's "empirical mean" estimator is `\hat{\mu}_n = \frac{1}{n}\sum_{k=1}^n r_k`. The decaying-α RM update with `α_n = 1/n` is *exactly the same thing*. Scene 4 explicitly draws this equivalence in a footnote: *"With α_n = 1/n, this update IS Casino's empirical mean."*
10. **Spooky House → Darts continuity:** Spooky's V was computed exactly because rewards were known. **Scene 0's caption says this out loud** to make the relaxation visible.

## 5. File layout

```
classic_rl/darts/
  index.html
  css/
    style.css           ← theme tokens; track/dartboard classes; estimate-trace classes (.trace-fixed-small, .trace-fixed-large, .trace-decay)
    scene0.css … scene5.css
  js/
    theme.js            ← copied; STORAGE_KEY = 'darts.theme'
    main.js             ← copied; SCENES list + brand
    darts.js            ← Bullseye class (drift step), Player (throw, current_pos), score function with optional noise; rng (Mulberry32)
    estimators.js       ← sampleMean(), rmUpdate(alpha), rmUpdateDecay() — pure functions returning new estimate given old + observation
    chart.js            ← simple SVG trajectory chart for scene 4 (multi-trace)
    track.js            ← horizontal track renderer (player marker, bullseye marker, chip history)
    history.js          ← copied; stores throws (player_pos, observed_score, bullseye_pos_at_throw)
    katex-helpers.js    ← copied
    scenes/
      scene0.js … scene5.js
  data/
    datasets.js         ← drift parameters, preset alpha values, scene-specific T values
  vendor/
    katex/...
  precompute/
    build-datasets.js   ← seeded RNG; precompute the canonical throw sequence + truth track; assert invariants
  assets/
    anymal-sprite.svg   ← copied (player marker)
    bullseye-sprite.svg ← new: concentric rings, used in light-mode reveal
    chip-sprite.svg     ← new: small dart-chip silhouette
```

Browser-openable from `file://`. No CDN. No `seedrandom` from CDN (the original's only dep — Mulberry32 replaces it).

## 6. Phased build with parallel-agent fan-out

### Phase 0 — Foundation (sequential)

- Copy `classic_rl/anymal-mdp/` as scaffold; strip scenes; rename brand and keys.
- Adapt `style.css`: keep editorial tokens. New tokens: `--track-bg`, `--track-tick`, `--bullseye-glow`, `--trace-small`, `--trace-large`, `--trace-decay` (using the existing categorical palette: `--cnn-pos` → trace-small, `--cnn-neg` → trace-large, `--cnn-purple` → trace-decay; just rename via composition — don't introduce new hex codes).
- Write `js/darts.js`: `Bullseye(seed)` with `step()`/`pos`; `score(player_pos, bullseye_pos, noise_std)` returning `{target_score, current_score}` matching `darts_utils.py`'s shape.
- Write `js/estimators.js`: pure functions, easy to swap in scenes.
- Write `js/track.js`: renders horizontal track + markers; theme-aware via CSS classes only.
- Write `js/chart.js`: multi-trace SVG line chart for scene 4.
- Stub each `scenes/sceneN.js`.

### Phase 0.5 — Data prep (parallel with Phase 0)

One sub-agent writes `precompute/build-datasets.js`:

- Seeded Mulberry32. Pinned seed.
- Precomputes a canonical 300-throw scenario: throw positions, true bullseye trajectory, observed scores. Reused across scenes 2-4 so traces compare apples-to-apples.
- **Invariants asserted in code**:
  - Bullseye drift std produces visible drift (range ≥ 30 over 300 throws).
  - Sample-mean estimator at t=300 has tracking error ≥ 1.5× the RM-with-α=0.1 estimator.
  - RM with `α_n = 1/n` has tracking error ≥ small-fixed-α at t=300 (decaying wins eventually).
  - No NaN, byte-identical regen.

### Phase 1 — Scene fan-out (parallel after Phase 0)

Three sub-agents:

- **Agent A — bookends + manual:** scenes **0, 1, 5**. Title, manual throwing, recap.
- **Agent B — sample-mean fails, RM fixes:** scenes **2, 3**. Tonal pair: failure mode + canonical fix. Owns the dual-track layout (truth on top, belief below) and the autoplay engine.
- **Agent C — α trade-off:** scene **4** alone. Trade-off scene is visually densest (three traces overlaid + KaTeX conditions).

3-2-1 split. Single-scene Agent C is justified by complexity, not laziness — scene 4 needs careful chart design (three traces, hover-to-isolate, RM-conditions inset) and pairing it with another scene would dilute focus.

### Phase 2 — Aggregation + verification (sequential)

Standard cycle: link CSS, parse-check, headless screenshot every scene at 1280×800 + 1920×1080 in both themes with `&instant` (+ `&run` for autoplay scenes). Read every PNG. Walk through both themes. Spot-check data-prep invariants.

## 7. Open questions (answer before kickoff)

1. **1-D track or 2-D dartboard.** Plan: 1-D, simpler estimate trajectory, matches original. 2-D is more thematic but loses the line-chart analogy. Stay 1-D?
2. **Decay schedule for scene 4.** Plan: `α_n = 1/n`. Notebook may use `α_n = 1/(n+1)` or other variants. Match the notebook?
3. **Drift step size.** Plan: clamped random walk, std = 0.5/throw (so bullseye moves ~14 over 300 throws; ≥30 invariant probably fails — need to bump to std = 1.0). Confirm or set explicitly.
4. **Number of throws per scene.** Plan: 30 manual (scene 1), 200 autoplay (scenes 2-3), 300 autoplay (scene 4). Confirm.
5. **Reveal bullseye in scene 1?** Plan: hidden in scene 1 (preserves the dilemma); revealed from scene 2 onward. Want it revealed in scene 1 too (easier for first-time understanding) or hidden as planned?

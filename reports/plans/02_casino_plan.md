# Rebuild plan — Casino (explore/exploit + ε-greedy) visualization

Target folder: `classic_rl/casino/` (sibling to `anymal-mdp/`).
Style guide: `.claude/skills/course-viz/SKILL.md`.
Source pedagogy: `exercises-ainit/Weekend_3/2_Casino.ipynb` + `casino_utils.py` (no HTML predecessor — this viz is **new**, not a rebuild of an existing artefact).
Curriculum slot: viz #2 of 5. Comes after `anymal-mdp/` and before the Spooky-House Bellman viz.

The plan is concrete enough to fan out to scene agents but light enough to redirect.

## 1. What this viz must do (pedagogy)

ANYmal taught students *what* an MDP is — `⟨S, A, P, R⟩`, no algorithms. Spooky House (next) will introduce the Bellman recursion and `γ` on a deterministic gridworld. Between them sits Casino, which has one job:

> *You don't know the world. To learn it you have to try things. To win you have to use what you learned. Both at once.*

This is the explore-exploit dilemma, and the simplest solution to it — **ε-greedy** — is the first reinforcement-learning algorithm the course teaches. Casino is therefore the seed of every later viz: SARSA reuses ε-greedy as a policy, Robbins-Monro generalises the empirical-mean update, Bellman generalises one-state value estimation to many-state value functions.

By the end the student should be able to:
1. State the dilemma in their own words.
2. Explain why pure greedy can fail.
3. Implement ε-greedy in pseudocode (the notebook asks them to do this in Python; the viz prepares them).
4. Read a cumulative-regret curve and tell linear from sublinear at a glance.

**Out of scope:** UCB, Thompson sampling, softmax/Boltzmann, function approximation, `Q(s,a)` notation. The recap names *"action-value estimate"* once as foreshadowing for SARSA, but the body says **empirical probability** to match the notebook's vocabulary.

## 2. Driving model: mixed (explicit decision)

ANYmal was 100% manual because the lesson was *"feel what it's like to be inside an MDP."* Casino's lessons are partly experiential (scene 1) and partly comparative (scenes 3-5). Mixing modes is the right call:

| Scene | Mode              | Why                                                           |
|-------|-------------------|---------------------------------------------------------------|
| 0     | static            | Setup — no interaction needed                                 |
| 1     | manual            | Student feels the uncertainty by pulling levers themselves    |
| 2     | static            | Dilemma named; maybe a tiny "pick explore or exploit" sandbox |
| 3     | autoplay          | Greedy must run by itself — that's the whole point            |
| 4     | autoplay + slider | ε-greedy needs the parameter knob to teach the trade-off      |
| 5     | precomputed       | Multi-ε regret curves are already-rendered traces             |
| 6     | static            | Recap                                                         |

Each autoplay scene gets a Play / Pause / Step / Reset / speed control. `&run` URL flag triggers the primary Play button for headless verification (per SKILL §"`&run` flag").

## 3. Scene list (7 scenes, click-step)

Using the same click-step engine as ANYmal: hash routing, dot pager, internal step engines per scene. 7 scenes fits the topbar comfortably (one more dot than ANYmal's 6).

| # | Title                     | What the student sees and does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Internal step engine?                                                                   |
|---|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| 0 | A row of unknown machines | Five cards in a row, one per arm. Each shows a slot-machine SVG, the arm name, and `?` where the empirical mean would go. KaTeX line: *"You play T = 200 rounds. Each round, pick one machine and pull."*. No live grid. The five true probabilities `[0.2, 0.4, 0.6, 0.8, 0.5]` are NOT shown.                                                                                                                                                                                                                                  | No                                                                                      |
| 1 | Pull a lever              | Same five cards. Click any card or press `1..5` to pull. Reward animates: gold chip rises from card on win, gray puff on loss. Empirical mean updates live. Pull-count in small italics. Right side: HUD with `round`, `total reward`, `pulls per arm`. Goal stated: *"Pull 30 times. Notice your uncertainty."* No regret curve yet.                                                                                                                                                                                            | Yes — student's own pull history; `←` rewinds, `→` replays; at head, `→` advances scene |
| 2 | Explore or exploit?       | Same scene-1 layout but with two big buttons next to the cards: **Exploit** (auto-picks the arg-max-empirical arm) and **Explore** (auto-picks a uniform random arm). Both buttons increment `round` and pull. KaTeX block: `\pi_{\text{exploit}}(a) = \arg\max_a \hat{\mu}(a)`. Caption: *"Both choices are wrong sometimes."* Student plays a few rounds with each button and sees neither alone wins.                                                                                                                         | Yes — same shape as scene 1                                                             |
| 3 | Greedy fails              | Five cards, plus a regret panel below: a single line `R(t) = t \cdot \mu^* - \sum_{\tau \le t} r_\tau` that grows over time. `Play` button starts a greedy autoplay (`ε = 0`) at 5-10 pulls/sec. Scrubber for current round. After ~200 rounds, regret is visibly **linear**. The chosen-most-often arm is whichever the early luck favoured — sometimes 4, sometimes not. Caption: *"Greedy commits early and never recovers."*                                                                                                 | Yes — autoplay step engine; cursor scrubs back through the trajectory                   |
| 4 | ε-greedy                  | Same five cards + regret panel, but now **two simultaneous traces** on the regret chart: greedy from scene 3 (replayed at the same seed) and ε-greedy with a slider-controlled `ε`. KaTeX: `\pi_\epsilon(a) = \begin{cases}\text{uniform}(A) & \text{w.p. } \epsilon \\ \arg\max_a \hat{\mu}(a) & \text{w.p. } 1-\epsilon \end{cases}`. Slider `ε ∈ [0, 0.5]` default 0.1. Slider changes future steps only; past steps stay as they were sampled. Mismatch indicator: small badge on each pull labelled `explore` or `exploit`. | Yes                                                                                     |
| 5 | The trade-off             | No live cards in this scene. Centre stage: a single regret chart showing **four pre-rendered curves** (median over 10 seeds each): `ε = 0.01` (greedy-ish), `ε = 0.1` (balanced), `ε = 0.3` (exploratory), and **decaying ε** (start 0.5, decay 0.995 per round) — included so the recap-teaser feels grounded. Hover or focus on a curve to highlight. Caption: *"No fixed ε wins everywhere."* T = 1000 here for smoother curves.                                                                                              | No (all data precomputed)                                                               |
| 6 | Recap → next viz          | Five-card layout mirroring ANYmal's recap. Cards: **explore** (random arm), **exploit** (arg-max empirical), **regret** (the diagnostic), **ε-greedy** (the algorithm), **decaying ε** (the refinement, muted card with caption "*next: many states, many values"*). One-line foreshadow below: *"In Casino, one state. In Spooky House, many states. The empirical mean grows up into a value function."*                                                                                                                       | No                                                                                      |

**Why this set:**
- Scenes 0-2 set up the dilemma without naming any algorithm — the user explicitly asked for "explore-exploit first, then ε-greedy". Scenes 3-5 are the algorithm half.
- The greedy failure (scene 3) is a separate scene, not folded into the ε-greedy scene, because *seeing greedy commit and stay wrong* is a load-bearing pedagogical moment. Folding it into the ε-greedy scene would compress the failure mode into a single slider position and lose impact.
- Decaying ε is **not** its own scene — it appears only as one of the four pre-rendered curves in scene 5 and as a muted recap card. The user's brief was *explore-exploit + ε-greedy*; decaying ε is a refinement, not a new concept. If you want it expanded into its own scene, redirect — easy to slot in as scene 6, pushing recap to 7.
- The recap explicitly bridges to the next viz so the curriculum thread is visible.

## 4. Pedagogical pitfalls (no original to fix — these are general traps)

This viz is new, so there's no audit-driven bug list. The pitfalls below come from RL-pedagogy lore and from re-reading `casino_utils.py`:

1. **Showing the true probabilities too early.** The whole point is uncertainty. The five true `μ`s are kept hidden until scene 6's recap (and even there, optional — a "reveal true means" toggle so the student can choose). The notebook's `show_probabilities=True` solution-mode flag is **not** mirrored.
2. **Pre-pulling machines.** Initial state across all scenes is all-zero pulls. Cold-entry must reset.
3. **Conflating empirical with true.** Use distinct visual treatments — empirical = on-screen monospace number; true = revealed only in recap, in serif italic with an explicit "true" label.
4. **`compare_strategies` does too much at once** (`casino_utils.py:443`) — it shows cumulative reward, selection frequency, true-vs-empirical, *and* regret in a 2×2 grid. The viz separates these: scene 4 shows regret only; recap shows true-vs-empirical only; selection frequency is implicit in card pull-counts. One diagnostic per scene.
5. **`run_casino_game` (`casino_utils.py:343`) hides the random seed.** Scene 3 must reuse the *same* seed when scene 4 replays "greedy" alongside ε-greedy, otherwise the comparison is misleading. Capture seed in `data/datasets.js` and reuse via `Bandit.makeRng(seed)`.
6. **`epsilon_greedy_strategy` ties broken by `random.choice`** (notebook cell-10). Match this in `policies.js` — same arg-max-then-random-tiebreak — so the JS replay matches what students will write in Python.
7. **Color cross-talk.** Per SKILL: don't reuse arm colors for any other encoding. The five categorical hues from `style.css` (blue/red/amber/purple/green) become `.arm-1` … `.arm-5`. Regret-curve series in scene 5 use a *separate* hue family (the `--ink-secondary` greys + one accent) so curves can't be misread as arm identity.
8. **Persistent autoplay timers leaking across scenes.** SKILL §"persistent widget caveat" — `onLeave` must clear any `setInterval` / `requestAnimationFrame`. Don't trust scene visibility alone.

## 5. File layout

```
classic_rl/casino/
  index.html
  css/
    style.css           ← theme tokens; new tokens for arms (.arm-1…5), regret series, win/loss flash
    scene0.css … scene6.css
  js/
    theme.js            ← copied from anymal-mdp; STORAGE_KEY = 'casino.theme'
    main.js             ← copied; SCENES list + brand updated
    bandit.js           ← Bandit class (Bernoulli pull, empirical, regret), Mulberry32 rng
    policies.js         ← greedy(), epsGreedy(eps), epsGreedyDecay(eps0, decay)
    history.js          ← copied from anymal-mdp; stores arm pulls + per-step seed
    chart.js            ← multi-series SVG line chart (theme-aware via CSS classes)
    katex-helpers.js    ← copied
    scenes/
      scene0.js … scene6.js
  data/
    datasets.js         ← bandit config + sweep curves (precomputed)
  vendor/
    katex/...
  precompute/
    build-datasets.js   ← Node, seeded, asserts invariants in code
  assets/
    slot-sprite.svg     ← line-art slot machine, fill=currentColor
    chip-sprite.svg     ← reward chip
    lever-sprite.svg    ← (optional) standalone lever icon
```

Browser-openable from `file://`. No CDN, no fetch, no build step. No d3, no canvas — vanilla DOM + inline SVG. Light mode default per SKILL §3.

## 6. Phased build with parallel-agent fan-out

### Phase 0 — Foundation (sequential, lead agent)

- Copy `classic_rl/anymal-mdp/` as the scaffold; strip its scenes; rename brand and storage keys. Keep shell, topbar, theme toggle, scene engine, hash router, dot pager, `&instant` flag.
- Adapt `style.css`: keep editorial tokens; add five `.arm-N` categorical classes (already-defined palette); add `.regret-series-{greedy,eps,decay}` classes for chart strokes; add `.card.flash-win`, `.card.flash-loss` keyframes.
- Write `js/bandit.js`: `class Bandit { pull(arm), empirical(arm), reset() }` plus `makeRng(seed)` (Mulberry32, identical to `anymal-mdp/js/mdp.js`'s implementation).
- Write `js/policies.js`: three functions returning `arm = policy(bandit, t)`. Match notebook tie-breaking exactly.
- Write `js/chart.js`: an SVG line chart that takes `{ series: [{ id, color-class, points: [[t, y], …] }, …], xMax, yMax }` and renders. Theme-aware (no inline colors).
- Write `js/history.js`: same shape as ANYmal's, but `push({ arm, reward, p_at_step })` instead of `{ action, seed }`.
- Commission three SVG sprites (line-art, fill=currentColor) in `assets/`.
- Stub each `scenes/sceneN.js` to register on `window.scenes` and render a placeholder.

### Phase 0.5 — Data prep (parallel with Phase 0)

One data-prep agent owns `precompute/build-datasets.js`:

- Seeded Mulberry32. Seed pinned at top.
- Generates `DATA.bandit` = `{ probs: [0.2, 0.4, 0.6, 0.8, 0.5], optimal: 0.8, optimalArm: 3, K: 5 }`.
- Generates `DATA.sweep` = median regret curves over 10 seeds × 4 strategies (`ε=0.01`, `ε=0.1`, `ε=0.3`, decaying-ε with `ε₀=0.5, decay=0.995`) at `T=1000`.
- **Invariant assertions in code** (per SKILL §0.5):
  - `regret(eps=0.01) > regret(eps=0.1)` at `t=1000` *on average* across the 10 seeds (the greedy-failure lesson must hold).
  - `regret(eps=0.3) > regret(eps=0.1)` at `t=1000` *on average* (over-exploration loses too).
  - `regret(decay)` is competitive with `eps=0.1` at `t=1000` (the recap teaser is honest).
  - All curves monotone non-decreasing (regret is a sum of non-negative terms).
  - No NaN, no nulls, finite values.
  - Byte-identical output across runs (run twice, `diff`).
- Out of scope: any DOM/JS for the viz itself.

If any invariant fails for the canonical seed, the data-prep agent is allowed to swap to a different seed *once*, but must document the swap and re-run the diff.

### Phase 1 — Scene fan-out (parallel after Phase 0)

Three agents. Bundling preserves tonal arcs:

- **Agent A — bookends + manual:** scenes **0, 1, 6**. Title, manual play, recap. Three lighter scenes; scene 1 is mechanically similar to ANYmal's scene 1, so the agent has a clear template.
- **Agent B — the dilemma named, the failure mode:** scenes **2, 3**. Both about *what doesn't work alone* — explore-only and exploit-only. Tonal pair. Agent B owns the explore/exploit-button widget (scene 2) and the autoplay engine (scene 3). The autoplay engine is the highest-leverage shared component since scene 4 reuses it; Agent B should design it for Agent C to drop in.
- **Agent C — ε-greedy + the trade-off:** scenes **4, 5**. Algorithm + parameter sweep. Highest pedagogical density; cannot be split. Owns the slider, the parallel-trace overlay, and the multi-curve regret chart. Coordinates with Agent B on the autoplay engine API.

Three agents, 3-2-2 split. Each gets the SKILL §"Scene agent prompt template" filled in with allowed globals (`Theme`, `Katex`, `DATA`, `Bandit`, `Policies`, `Chart`, `History`), the cluster-class allowlist, and the cold-entry rule.

### Phase 2 — Aggregation + verification (lead agent)

- Link all `scene*.css` in `index.html`.
- Parse-check every JS file.
- Headless screenshot every scene at 1280×800 and 1920×1080, both themes, with `&instant`. Add `&run` to scenes 3 and 4 (autoplay-gated). Read every PNG.
- Walk through both themes manually: pull a few arms in scene 1, exercise the explore/exploit buttons in scene 2, run greedy to completion in scene 3, sweep ε in scene 4.
- Spot-check Phase 0.5's invariant claims by greping `build-datasets.js` for the assertions and re-running it.
- Don't commit; hand back for review.

## 7. Open questions (answer before fan-out)

1. **Decaying ε scope.** Plan keeps it as one of the four curves in scene 5 + a muted recap card. Promote it to its own scene 6 (8 scenes total, recap becomes 7), keep as currently planned, or drop entirely?
2. **Horizon T.** Scene 1 = 30 manual pulls (proposed). Scenes 2-3 autoplay = 200 rounds. Scene 5 precomputed = 1000 rounds. Notebook uses 4000 — way too long for live viz. Happy with these, or want them all longer / shorter?
3. **Slot machine sprite vs. clean cards.** Plan proposes line-art SVG slot machines (fill=currentColor, arm-tinted) embedded in editorial cards — keeps casino flavour without going dark-blue-flashy. Alternative: drop the slot sprite, use plain editorial cards with arm-color accent stripes only. Which?
4. **Reveal true means in recap?** Plan says optional toggle. Always-on reveal makes the recap more concrete; toggle preserves the lesson's mystery. Pick one.
5. **Selection-frequency view.** The notebook's `compare_strategies` shows it as a bar chart. Plan implies it via per-card pull-counts and skips the dedicated chart. If you want it as a separate diagnostic in scene 5 (alongside regret), say so — that's an extra view to design.

Answer these and I'll kick off Phase 0.

# critical-spare -- the Critical Spare MDP viz

A browser-only, no-build, file://-safe educational visualization of the
**Critical Spare** machine-maintenance MDP for a **manager audience**. It is one
cartridge in the SML reinforcement-learning gallery (a sibling of
`gamblers-ruin/`, `press-your-luck/`, `pokemon-battle/`, ...). It walks the
canonical **13-scene arc** (title -> tutorial -> playtest -> formalization ->
policy -> trajectory -> return -> Q* -> Bellman -> DP -> DP-caveat -> SARSA ->
recap).

Design source of truth:
`../mdp-gallery/brainstorm/proposals/08-critical-spare.md` (the full spec, exact
numbers, scene-by-scene plan) and `../mdp-gallery/reference/pokemon-arc.md` (the
13-scene DNA). Built by mirroring the multi-file structure, click-step scene
engine, KaTeX vendoring, chiptune music, EN+JP i18n, and DP-verified precompute
of `gamblers-ruin/` (the most recent fully-conformant sibling, whose `style.css`
IS the gallery's light Press Start 2P pixel house theme).

## The MDP

One aging machine, one spare-parts bin: run it, pre-order a part, or swap one in.

- **State** s = (machine **health**, **spares** in bin):
  health in {HEALTHY (0), AGING (1), FAILING (2)} x spares in {0, 1, 2} =
  **3 x 3 = 9 states**. The whole world is a **3x3 maintenance grid** (health =
  rows, HEALTHY top; spares = columns 0/1/2), so the entire Q-table renders on
  one board. **No terminal states**: this is an ongoing operation, optimised
  with discount **gamma = 0.9** (the on-screen "12-turn quarter" is the
  narrative wrapper; the maths is the clean infinite-horizon discounted return
  so every value is single-digit and hand-checkable).
- **Action** a = three levers: **RUN** (produce, +3, risk a breakdown),
  **ORDER** (buy a spare into the bin, -2, earns nothing this turn), **REPLACE**
  (consume a spare to refurbish to HEALTHY, cost 0; legal only when spares >= 1,
  clamped otherwise).
- **Transition** P (the visible dice): RUN spins a **failure die** whose red
  slice grows with wear (P(fail) = **0% HEALTHY, 30% AGING, 70% FAILING**).
  - fail WITH a spare: spare auto-consumed in a rushed emergency swap, machine
    -> HEALTHY, reward **-3**.
  - fail with an EMPTY bin: downtime, machine -> FAILING, spares stay 0, reward
    **-8**.
  - no failure (+3): machine **ages on a coin flip** (HEALTHY->{HEALTHY,AGING}
    50/50; AGING->{AGING,FAILING} 50/50; FAILING->FAILING). ORDER and REPLACE
    are deterministic. **Holding cost -1 x spares** is added to EVERY turn.
- **The twist (state-dependent optimal action), verified by value iteration:**

  | health \ spares | 0 | 1 | 2 |
  |---|---|---|---|
  | **HEALTHY** | RUN | RUN | RUN |
  | **AGING**   | **ORDER** | **REPLACE** | **REPLACE** |
  | **FAILING** | **ORDER** | **REPLACE** | **REPLACE** |

  At the *same* AGING/FAILING health, an **empty** bin says **ORDER** (go acquire
  protection before the risk peaks); a **stocked** bin says **REPLACE** (cash the
  protection in: a planned swap beats absorbing a 70% failure). HEALTHY -> RUN
  regardless. Same gauge reading, opposite call, decided entirely by the bin.
  There are **no exact Q* ties** (the policy is unambiguous; the closest call is
  (AGING, 1): REPLACE 7.224 vs RUN 7.218).

## Layout

```
critical-spare/
  index.html              entry; fixed script/style load order
  css/
    style.css             light pixel theme (warm cream / hard black / Press
                          Start 2P) + a screen-only CRT (amber-phosphor) variant;
                          chrome, badges, buttons, .formula-card, lever colours
                          (RUN green / ORDER blue / REPLACE gold), responsive
    grid.css              the 3x3 maintenance-grid widget AND the machine-icon
                          sprite (machine + spares bin) styles
    die.css               the failure-die widget (growing red FAIL slice) +
                          the downtime hourglass
    scene0.css .. scene12.css   per-scene layout
  js/
    levers.js             actions (run/order/replace); aliased to window.Moves
    machine.js            the MDP (state/transition/sample/successors); aliased
                          to window.Battle
    bellman.js            value iteration (clamped lever -> -Infinity)
    sarsa.js              TD-control primitives: on-policy SARSA update (the
                          headline learner) + an off-policy qLearningUpdate kept
                          for parity
    machineIcon.js        window.MachineIcon: the recurring state-icon (machine
                          sprite coloured by health + a 3-slot spares bin)
    die.js                window.Die: failure die setRisk/roll
    grid.js               window.Grid: the 3x3 board (icon + qtable variants),
                          update / paintPolicy / setToken
    katex-helpers.js      window.Katex.render/inline/display (vendored KaTeX)
    theme.js, i18n.js, i18n-ui.js, sfx.js, music.js, music-ui.js, dialog.js,
      speakerNotes.js     chrome (theme toggle, EN+JP i18n, chiptune, SFX, etc.)
    i18n/sceneN.i18n.js   per-scene EN+JP copy (register into window.I18N)
    scenes/sceneN.js      the 13 scenes (register window.scenes.sceneN)
    main.js               click-step engine: hash routing #scene=N, keyboard
                          left/right, dot pager, concept badges, speaker notes
  data/datasets.js        GENERATED by precompute (window.DATA)
  precompute/build-datasets.js   the rigor gate (see below)
  vendor/katex/           KaTeX vendored (no CDN), copied from a sibling
  assets/fonts/           PressStart2P-Regular.woff2 (bundled, offline)
```

No build step. Open `index.html` from `file://`; everything (engine, KaTeX,
data, SFX, chiptune) works offline. (DotGothic16, the JP bitmap font, is the one
optional network asset; it falls back to the OS Japanese font offline.)

### Engine conventions (shared with the gallery)

- `window.Machine` is aliased to `window.Battle`, and `window.Levers` to
  `window.Moves`, so the reused `bellman.js` / `sarsa.js` consume them unchanged.
- The Q-table is a clean 9x3 (`Q[stateIdx*3 + leverIdx]`, stateIdx =
  health*3 + spares; leverIdx in [run, order, replace]). **Clamped levers**
  (REPLACE with an empty bin) carry `null` (precompute) / `-Infinity` (runtime)
  so they are never argmax and render disabled (handles 2- vs 3-chip cells).
- Scenes return `{ onEnter?, onLeave?, onNextKey?, onPrevKey? }`; returning
  `true` from a key handler consumes the keystroke for an internal step.
- `#scene=N` deep-links; `&instant` disables fade; `&run` auto-triggers a
  scene's primary animation for headless capture; `&theme=light|crt`.
- **Hidden-element gotcha:** any element that starts with the `hidden` attribute
  but whose class sets `display:flex/grid` needs an explicit
  `.cls[hidden]{display:none}` rule (the attribute does not win the cascade).
  Fixed for `.sc0-reveal`, `.sc3-dice`, `.sc5-step`.

## The rigor gate (precompute)

`node precompute/build-datasets.js` loads the verified runtime engine via a
`window` shim (single source of truth), runs value iteration, trains an
on-policy SARSA learner, **asserts**, and only then writes `data/datasets.js`. If
any assertion fails the file is NOT written. Deterministic / seeded (re-running
gives a byte-identical file). Verified assertions:

1. VI converges (maxDelta < 1e-9).
2. **Optimal policy == the proposal twist grid EXACTLY** (HEALTHY: RUN RUN RUN;
   AGING/FAILING: ORDER REPLACE REPLACE).
3. The **three named Q* intuitions** hold (to 1 dp): Q*(HEALTHY,0,RUN) ~ 9.1
   (the cell best); Q*(AGING,0,ORDER) ~ 4.5 > Q*(AGING,0,RUN) ~ 3.8;
   Q*(FAILING,1,REPLACE) ~ 7.2 > Q*(FAILING,1,RUN) ~ 5.5.
4. The twist **flips with the bin**: empty -> ORDER, stocked -> REPLACE, at both
   AGING and FAILING.
5. There are **no exact Q* ties** among legal levers.
6. **On-policy SARSA reproduces the DP optimum on ALL 9 states**, and its greedy
   mean discounted return from (HEALTHY,0) lands within 0.5 of V*(HEALTHY,0).

Payload ~33 KB (V*, Q*, policy, per-sweep DP fill frames, 10 SARSA snapshots, a
greedy-return curve, a demo quarter, return-distribution data, recap copy, KaTeX
strings).

## SARSA, not the SARSA-vs-Q-learning split (the model-free choice)

Requirement #6 asked: if on-policy SARSA converges to the optimal policy, use
SARSA; if not (as happened for Gambler's Ruin), show the honest SARSA-vs-Q-learning
split. **Here SARSA converges**, so this cartridge takes the **SARSA path**
(scene 11 = "SARSA", badge "TD", like most siblings). This was established
empirically before building: on THIS MDP the optimal lever is **decisive** in
every cell (e.g. ORDER beats RUN by ~0.75 at (AGING,0); REPLACE clearly beats RUN
with a spare in hand), so the on-policy value of the eps-soft policy still ranks
the optimal lever first. With a GLIE-annealed epsilon (0.5 -> 0.05) and a
Robbins-Monro step size (alpha = 1/(1+visits)^0.75), on-policy SARSA recovers the
**exact** DP twist grid on all 9 states across every seed tried (10/10), and its
greedy return from (HEALTHY,0) converges to V* (9.15 vs 9.137). The precompute
ASSERTS SARSA == DP on all 9 states. (Gambler's Ruin needed the split only
because its Q-gaps were sub-0.02 and the on-policy bias was systematic; that
condition does not hold here.) `sarsa.js` still ships an off-policy
`qLearningUpdate` for parity / a future contrast, but it is not used.

## Regenerating the data

```
node precompute/build-datasets.js
```
Re-run after any change to `levers.js` / `machine.js` / `bellman.js` /
`sarsa.js`. ~47 s (400k SARSA episodes; the convergence story wants the long
run). Deterministic.

## QA (this Mac hangs headless Chrome)

Use the watchdog recipe (`.shots_tmp/shoot.sh`): launch detached with a fresh
`--user-data-dir`, poll for the PNG, kill the process. Shots go in `.shots_tmp/`
(gitignored). **Mobile gotcha:** old headless Chrome with `--window-size=390`
does NOT emulate a mobile layout viewport (it renders at desktop width). To
verify true 390px responsive layout, render the page inside a `width:390px`
`<iframe>` (its `src` must be `../index.html#scene=N` from inside `.shots_tmp/`)
and screenshot that. Verified clean at 1280x900 (desktop) and 390px (mobile,
iframe) for all 13 scenes, plus the CRT theme and the full Japanese translation.
The 3x3 grid (the densest widget: 9 cells x 3 lever-chips x values) fits a phone.

## Parity checklist (vs gamblers-ruin / press-your-luck)

- [x] Light Press Start 2P pixel theme, visually indistinguishable from the
      siblings (verified against a fresh press-your-luck screenshot).
- [x] Screen-only CRT (amber-phosphor) dark variant.
- [x] Vendored KaTeX (no CDN), file://-safe.
- [x] Full EN + 日本語 (all 13 scenes; DotGothic16 bitmap font for kana).
- [x] Chiptune music with the MUSIC toggle (shared score; same track keys).
- [x] "BY CARLOS COTRINI" credit on the title scene.
- [x] Concept badges (MDP/POL/RTN/Q*/DP/TD), dot pager, #scene=N deep-link,
      keyboard left/right, speaker notes (`n`).
- [x] DP-verified precompute rigor gate.

# recycling-robot -- the Recycling Robot MDP viz

A browser-only, no-build, file://-safe educational visualization of the
**Recycling Robot** MDP (the Sutton-Barto toy, redrawn as a battery gauge) for a
**manager audience**. It is one cartridge in the SML reinforcement-learning
gallery (a sibling of `gamblers-ruin/`, `press-your-luck/`,
`last-minute-pricing/`, `pokemon-battle/`, ...). It walks the canonical
**13-scene arc** (title -> tutorial -> playtest -> formalization -> policy ->
trajectory -> return -> Q* -> Bellman -> DP -> DP-caveat -> learning -> recap).

Design source of truth:
`../mdp-gallery/brainstorm/proposals/10-recycling-robot.md` (the full spec, exact
numbers, scene-by-scene plan) and `../mdp-gallery/reference/pokemon-arc.md` (the
13-scene DNA). Built by mirroring the multi-file structure, click-step scene
engine, KaTeX vendoring, chiptune music, EN+JP i18n, and precompute approach of
`gamblers-ruin/`, with the gallery's **light Press Start 2P pixel theme** taken
from `press-your-luck/` (NOT the editorial serif theme).

## The MDP

- **State** s = the robot's **battery level**, a 5-rung gauge `s in {empty, low,
  mid, high, full}` (integers empty=0 .. full=4). `empty` is the terminal
  STRANDED state (value 0; entering it already paid the rescue). That leaves
  **4 playable rungs** (low/mid/high/full); the whole Q-table is one tall column.
- **Action** a = one of 3 levers: **SEARCH** (work, green), **WAIT** (idle,
  amber), **RECHARGE** (protect, blue). All three legal at every rung (no
  clamping), so the Q-table is a clean 4x3.
- **Transition** P: on a **SEARCH** the **drain die** rolls `-1 rung w.p. 0.70`
  or `-2 rungs w.p. 0.30` (a drain reaching empty STRANDS, terminal). WAIT stays
  on the rung; RECHARGE jumps to full. Both WAIT/RECHARGE are deterministic (no
  die).
- **Reward** r: trash collected on a SEARCH = **+3 at high/full, +2 at mid/low**.
  WAIT = **+1**. RECHARGE = **0**. Stranding costs **-10**. KEY MODELLING CHOICE:
  a SEARCH that strands still collects its haul that step, then pays -10, i.e.
  `r = searchReward(s) + STRAND`. From `low` BOTH drains strand, so SEARCH-from-
  low is a certain `2 + (-10) = -8` (the proposal's canonical -8.00).
- **Horizon**: a work **shift of N = 8 steps**, `gamma = 1` (the shift length is
  the horizon, so returns are bounded without discounting). This is a
  **FINITE-HORIZON** MDP: the optimal action can depend on steps-remaining, and
  it does on the very last step.

## The twist (state-dependent optimal action), VERIFIED EXACTLY

The best lever **marches up the gauge**. The converged optimal policy (the
start-of-shift / k=N layer, stable for all k >= 2) and its Q-values match the
proposal's stated table **exactly** (asserted by the precompute to 2 decimals):

```
rung    SEARCH    WAIT   RECHARGE   best
full    16.45    15.54    14.54     SEARCH    (push)
high    15.44    14.89    14.54     SEARCH    (push -- the closest call, gap 0.55)
mid      7.71    13.44    14.54     RECHARGE  (protect)
low     -8.00    13.44    14.54     RECHARGE  (protect)
empty   terminal (STRANDED), value 0; entering it costs -10
```

Two wrinkles the proposal calls out, both verified:
- **The last-step (k=1) column differs**: with no future to protect, the safe +1
  WAIT wins at low/mid. So all three levers are genuinely optimal somewhere:
  across the 4 rungs x 8 shift steps (32 cells) the tally is **SEARCH 16,
  RECHARGE 14, WAIT 2**.
- **The marginal cell is `high`** (SEARCH 15.44 vs WAIT 14.89, gap 0.55), not
  mid; the precompute asserts the argmax there is stable (no float coin-flip) and
  that there are no exact ties.

## Layout

```
recycling-robot/
  index.html              entry; fixed script/style load order
  css/
    style.css             light pixel theme (cream #E8E0CC / ink #181818 /
                          Press Start 2P) + a screen-only CRT variant; chrome,
                          lever chips, .formula-block cards, responsive @media
    gauge.css             the robot + 5-segment battery gauge + Q-table widget
    die.css               the battery-drain die popup (70/30 badge, tumble)
    scene0.css .. scene12.css   per-scene layout
  js/
    levers.js             actions (search/wait/recharge); aliased to window.Moves
    robot.js              the MDP (state/transition/sample/successors, finite
                          horizon); aliased to window.Battle
    bellman.js            FINITE-HORIZON DP: per-step value layers V_0..V_N,
                          per-step policies, the converged (k=N) headline layer,
                          the 16/14/2 lever tally
    sarsa.js              TD-control primitives indexed by (rung, steps-left,
                          lever): on-policy SARSA update AND off-policy
                          Q-learning update
    gauge.js              window.Gauge: robot+gauge state-icon + single-column
                          Q-table + paintPolicy + drain/strand/dock animations
    die.js                window.Die: roll(rng[,forced]) -> Promise<{delta}>
    katex-helpers.js      window.Katex.render/inline/display (vendored KaTeX)
    theme.js, i18n.js, i18n-ui.js, sfx.js, music.js, music-ui.js, dialog.js,
      speakerNotes.js     chrome (shared with the gallery; rr-prefixed storage keys)
    i18n/sceneN.i18n.js   per-scene EN + JP copy (register into window.I18N)
    scenes/sceneN.js      the 13 scenes (register window.scenes.sceneN)
    main.js               click-step engine: hash routing #scene=N, keyboard
                          left/right, dot pager, concept badges, speaker notes;
                          exposes window.RR
  data/datasets.js        GENERATED by precompute (window.DATA)
  precompute/build-datasets.js   the rigor gate (see below)
  vendor/katex/           KaTeX vendored (no CDN), copied from gamblers-ruin
  assets/fonts/           PressStart2P (bundled, offline)
```

No build step. Open `index.html` from `file://`; everything (engine, KaTeX,
data, SFX, music) works offline. DotGothic16 (the JP bitmap font) loads from
Google Fonts when online and falls back gracefully offline.

### Engine conventions (shared with the gallery)

- `window.Robot` is aliased to `window.Battle`, and `window.Levers` to
  `window.Moves`, so the reused `bellman.js` / `sarsa.js` consume them.
- The converged Q-table is `Q[stateIndex*3 + leverIdx]`, stateIndex = battery
  level - 1 (low=0..full=3), leverIdx in `[search,wait,recharge]`. The gauge
  widget renders full (top) .. low (bottom) so the gauge climbs upward.
- The learned SARSA/Q-learning table is indexed by `(stateIdx, steps-left k,
  lever)` because the problem is finite-horizon; `SARSA.layerAtK(Q, k)` flattens
  one steps-left layer to the 4x3 the widget expects.
- Scenes return `{ onEnter?, onLeave?, onNextKey?, onPrevKey? }`; returning
  `true` from a key handler consumes the keystroke for an internal step.
- `#scene=N` deep-links; `&instant` disables fade; `&run` auto-triggers a scene's
  primary animation for headless capture; `&theme=light|crt`.

## The rigor gate (precompute)

`node precompute/build-datasets.js` loads the verified runtime engine via a
`window` shim (single source of truth), runs the finite-horizon DP, trains both
TD learners, **asserts**, and only then writes `data/datasets.js`. If any
assertion fails the file is NOT written. Verified assertions:

1. The converged policy is exactly full=SEARCH, high=SEARCH, mid=RECHARGE,
   low=RECHARGE.
2. The converged Q-table matches the proposal twist **exactly** (16.45 / 15.44 /
   14.54 / -8.00 ..., to 2 decimals).
3. The argmax at `high` is stable (SEARCH wins by gap ~0.55) and there are NO
   exact ties among levers in the converged layer.
4. The policy is stable from the 2nd backup (k >= 2 identical); the last-step
   (k=1) column differs (WAIT wins at low/mid).
5. All three levers are optimal somewhere across 32 cells: SEARCH 16, RECHARGE
   14, WAIT 2.
6. Hand backups reproduce the table (2nd-backup-low = -8/2/3; last-step-low =
   -8/+1).
7. Off-policy Q-learning recovers the DP-optimal converged policy on all 4 rungs,
   and its greedy shift return from full lands near V*_N(full)=16.45.
8. On-policy SARSA is demonstrably MORE CONSERVATIVE: at the marginal `high` rung
   it does NOT play the bold SEARCH, and its DP agreement is strictly below
   Q-learning's.

## SARSA vs Q-learning -- the honest model-free choice (scene 11, badge "TD")

The proposal asks for "SARSA that converges to the optimal policy". On this MDP
it does **not** -- exactly the situation Gambler's Ruin hit. Established
empirically (a 116-config sweep, robust across seeds): the Q-gap at the marginal
`high` rung is tiny (SEARCH 15.44 vs WAIT 14.89), and **on-policy SARSA learns
the value of the eps-soft policy it actually follows**, which turns CAUTIOUS
there -- an exploratory misstep from high can cascade toward stranding, so the
on-policy value of SEARCH-at-high is pulled below the safe levers. SARSA
therefore lands a conservative policy that **protects at high** (RECHARGE/WAIT)
instead of the bold SEARCH (agreement 3/4 vs DP, systematic, not noise).

The DP-optimal stripe is recovered by **off-policy Q-learning** (bootstrap on the
best next lever), which learns the value of optimal play regardless of
exploration and converges to the DP oracle exactly (4/4, return 16.45).

So scene 11 shows the **honest SARSA-vs-Q-learning split** (cautious vs optimal,
both against the DP oracle), badge **"TD"**, and the precompute asserts
Q-learning == DP while SARSA is demonstrably more conservative at the marginal
`high` cell. Both updates live in `sarsa.js` (`update` = on-policy SARSA,
`qLearningUpdate` = off-policy). This is the truthful choice and the richer
teaching point (the cliff-walking cautious-vs-optimal distinction); it mirrors
the proven `gamblers-ruin/` sibling. SARSA config: constAlpha 0.05, eps 0.15
steady, seed 1, 400k episodes (one of many configs that show the cautious-high
behaviour; the direction is systematic).

## Regenerating the data

```
node precompute/build-datasets.js
```
Re-run after any change to `levers.js` / `robot.js` / `bellman.js` / `sarsa.js`.
Payload is ~13 KB (converged V*/Q*/policy, the last-step column, per-step DP fill
frames, both learners' k=N snapshots + return curves, demo trajectory, return
histogram, spot-Q rows, recap copy, KaTeX strings).

## QA (this Mac hangs headless Chrome)

Use the watchdog recipe (launch detached with a fresh `--user-data-dir`, poll for
the PNG, kill the process). Shots go in `.shots_tmp/` (gitignored).
**Mobile gotcha:** old headless Chrome with `--window-size=390,...` does NOT
emulate a mobile layout viewport (it renders at desktop width). To verify true
390px responsive layout, render the page inside a `width:390px` `<iframe>`
(see `.shots_tmp/mobile.html`) and screenshot that. Verified clean this way at
390px for the layout-critical scenes (title, tutorial, Q*, DP board, TD).

**Headless-Chrome flaky `hidden`:** an author `display:flex/grid` on a class
beats the UA `[hidden]{display:none}` (equal specificity, source order). Any
element toggled via the HTML `hidden` attribute that ALSO has an author `display`
rule needs an explicit `.cls[hidden]{display:none}` guard (done for scene0 reveal,
scene3 cards, scene8 steps).

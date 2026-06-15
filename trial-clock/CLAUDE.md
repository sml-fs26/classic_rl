# trial-clock -- the Trial Clock (free-trial conversion) MDP viz

A browser-only, no-build, `file://`-safe educational visualization of the **free-trial
conversion** decision as an MDP, for a **manager audience**. One cartridge in the SML
reinforcement-learning gallery (a sibling of `gamblers-ruin/`, `press-your-luck/`,
`last-minute-pricing/`, `pokemon-battle/`, ...). It walks the canonical **13-scene arc**
(title -> tutorial -> playtest -> formalization -> policy -> trajectory -> return -> Q* ->
Bellman -> DP -> DP-caveat -> SARSA -> recap).

Design source of truth:
`../mdp-gallery/brainstorm/proposals/04-free-trial-conversion.md` (the full spec, exact
numbers, scene-by-scene plan) and `../mdp-gallery/reference/pokemon-arc.md` (the 13-scene
DNA). Built by mirroring the multi-file structure, click-step scene engine, KaTeX
vendoring, chiptune music, EN+JP i18n, and DP-verified precompute of `gamblers-ruin/` and
`press-your-luck/`.

## The MDP

- **State** s = **(adoption tier, days-left)**. tier in {0=none, 1, 2, 3, 4=ACTIVATED};
  days in {1, 2, 3, 4, 5}. **25 playable cells** (5x5), rendered as one board (rows =
  tier 4 on top .. 0 on the bottom; columns = days 5 on the left .. 1 on the right). Three
  **terminals**: CONVERT (+20), ABANDON (-5), EXPIRY (0 at days = 0).
- **Action** a = one of **3 levers**: ONBOARD NUDGE (teal, build value), DO NOTHING (grey,
  hold), PAYWALL PUSH (gold, ask for the sale). Every lever is legal in every cell -- a
  clean 25x3 Q-table, no clamping.
- **Transition** P = the two visible dice. NUDGE flips the **Adoption Coin** (p = 1/2: tier
  +1 capped at 4, else stay; a day burns). PUSH spins the **Conversion Wheel** by tier
  `(p_BUY, p_IGNORE, p_ABANDON)`: tier0 (0, .5, .5); tier1 (.2, .6, .2); tier2 (.4, .5, .1);
  tier3 (.6, .4, 0); tier4 (.8, .2, 0). BUY -> CONVERT; IGNORE -> (tier, days-1); ABANDON
  -> ABANDON. DO NOTHING is deterministic (a day ticks). gamma = 1 (a 5-day horizon).
- **Reward** r = **+20** convert, **-1** per nudge, **0** do-nothing, **-5** abandon,
  **0** expiry.
- **The twist (state-dependent optimal action):** the best lever flips across the board on
  *both* axes. Down the adoption axis: NUDGE while cold, but the *same* PAYWALL PUSH that
  would be a disaster on a cold user becomes the best move once ACTIVATED. Across the time
  axis: a mid-adoption user can keep nudging on day 5 but must *ask* as the clock runs down.
  The signature cell: **PUSH on a cold day-5 user (Q* ~= -0.83, the worst lever) vs the
  identical PUSH on an activated user (Q* ~= +20, the star)**. And DO NOTHING wins in
  **exactly one** cell -- (tier 0, day 1) -- where every spend has negative expected value,
  so 0 wins.

The verified optimal-lever staircase (rows tier 4..0, cols days 5..1):

| tier \ days | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|
| **4 = ACTIVATED** | PUSH | PUSH | PUSH | PUSH | PUSH |
| **3** | PUSH | PUSH | PUSH | PUSH | PUSH |
| **2** | NUDGE | NUDGE | PUSH | PUSH | PUSH |
| **1** | NUDGE | NUDGE | NUDGE | PUSH | PUSH |
| **0 = none** | NUDGE | NUDGE | NUDGE | NUDGE | NOTHING |

## Layout

```
trial-clock/
  index.html              entry; fixed script/style load order
  css/
    style.css             light pixel theme (cream #E8E0CC / ink #181818 / Press Start 2P)
                          + a screen-only CRT (amber) variant; chrome, badges, buttons,
                          .formula-block cards, lever colours, responsive @media
    board.css             the Trial Card (state icon) + the 5x5 Board / Q-table widget
    coin.css              the Adoption Coin widget
    wheel.css             the Conversion Wheel widget (SVG pie + spin/ratchet)
    scene0.css .. scene12.css   per-scene layout
  js/
    levers.js             actions (nudge/nothing/push); aliased to window.Moves
    trial.js              the MDP (state/transition/sample/successors); aliased to
                          window.Battle; the Adoption-Coin p and Conversion-Wheel wedges
    bellman.js            value iteration (= backward induction; gamma = 1)
    sarsa.js              TD-control primitives: on-policy SARSA update (headline) AND an
                          off-policy Q-learning update (kept for parity)
    board.js              window.TrialCard (state icon) + window.Board (5x5 grid + Q-table)
    coin.js               window.Coin: flip(heads) -> Promise (Adoption Coin)
    wheel.js              window.Wheel: spin(wedge) -> Promise (Conversion Wheel)
    katex-helpers.js      window.Katex.render/display/inline (vendored KaTeX)
    theme.js, i18n.js, i18n-ui.js, sfx.js, music.js, music-ui.js, dialog.js,
    speakerNotes.js       chrome (mirrors the siblings; storage keys = trial-clock.*)
    i18n/sceneN.i18n.js   per-scene EN + JP copy (register into window.I18N)
    scenes/sceneN.js      the 13 scenes (register window.scenes.sceneN)
    main.js               click-step engine: hash routing #scene=N, keyboard left/right,
                          dot pager, concept badges, speaker notes; window.TC namespace
  data/datasets.js        GENERATED by precompute (window.DATA)
  precompute/build-datasets.js   the rigor gate (see below)
  vendor/katex/           KaTeX vendored (no CDN), copied from a sibling
  assets/fonts/           PressStart2P (bundled, offline)
```

No build step. Open `index.html` from `file://`; engine, KaTeX, data, SFX, music all work
offline. JP needs DotGothic16 (Google Fonts) but falls back to the OS Japanese font.

### Engine conventions (shared with the gallery)

- `window.Trial` is aliased to `window.Battle`, and `window.Levers` to `window.Moves`, so
  the reused `bellman.js` / `sarsa.js` consume them unchanged.
- The Q-table is a clean 25x3 (`Q[stateIndex*3 + leverIdx]`, `stateIndex = tier*5 +
  (days-1)`, leverIdx in `[nudge, nothing, push]`). No clamped cells.
- Two state widgets: `window.TrialCard.mount` (the recurring single-user icon: a 5-rung
  adoption ladder + a 5-pip trial clock + a CONVERT/ABANDON/EXPIRY stamp), and
  `window.Board.mount` (the whole 5x5 board, variants `policy` [one lever chip + star per
  cell] and `qtable` [three Q-values per cell, argmax starred, region tint]).
- Scenes return `{ onEnter?, onLeave?, onNextKey?, onPrevKey? }`; returning `true` from a
  key handler consumes the keystroke for an internal step.
- `#scene=N` deep-links; `&instant` disables fade; `&run` auto-triggers a scene's primary
  animation for headless capture; `&theme=light|crt`.

## The rigor gate (precompute)

`node precompute/build-datasets.js` loads the verified runtime engine via a `window` shim
(single source of truth), runs value iteration, trains the model-free learner, **asserts**,
and only then writes `data/datasets.js`. If any assertion fails the file is NOT written.
Verified assertions:

1. VI converges (maxDelta < 1e-9), in 6 sweeps (the finite horizon settles column by column).
2. **The optimal policy equals the proposal's 25-cell staircase EXACTLY** (the table above).
3. The signature headline flip: Q*((0,5),push) ~ -0.83 (the worst lever there) vs
   Q*((0,5),nudge) ~ +5.21 (the star); Q*((4,5),push) ~ +20 (the star).
4. The time-axis flip on tier 2: NUDGE wins on days 5-4, PUSH overtakes from day 3 on.
5. All three levers are optimal somewhere; **DO NOTHING wins exactly one cell, (tier 0,
   day 1)**, where value 0 beats nudge -1 and push -2.5.
6. Two hand-computable last-day backups reproduce Q*: Q*((0,1),push) = 0.5*(-5) = -2.5;
   Q*((3,1),push) = 0.6*20 = 12.
7. **On-policy SARSA reproduces the DP optimum on all 25 cells**, and its greedy value from
   a cold day-5 user lands within tolerance of V* (~5.20).

Re-run after any change to `levers.js` / `trial.js` / `bellman.js` / `sarsa.js`. Payload is
~18 KB (V*, Q*, policy, per-sweep DP fill frames, 10 SARSA snapshots, the value curve,
return buckets, recap copy, KaTeX strings). Deterministic / seeded (no snapshot flap).

## SARSA vs Q-learning -- the model-free path taken

The build requirement asks: try on-policy SARSA; if it converges to the DP optimum, use
SARSA (scene 11 = "SARSA", badge "TD"); otherwise show the honest SARSA-vs-Q-learning split.

**On-policy SARSA converges here -- so scene 11 is SARSA.** Unlike Gambler's Ruin (where the
Q-gaps were tiny and on-policy SARSA settled on a timid fixed point), this MDP includes
days-left in the state, so the finite horizon is *fully observed*, the reward gaps are clean
(gamma = 1 with terminal rewards), and on-policy SARSA with a Robbins-Monro decaying step
size `alpha = 1/(1+visits)^0.75` recovers the **full 25/25 staircase**. Verified robust:
25/25 on all 10 seeds tested at 400k episodes. The single near-tie cell flagged in the
proposal -- (tier 2, day 3), where PUSH 13.125 just edges NUDGE 13.025 -- does NOT flip
with this configuration. So scene 11 shows one SARSA learner converging to the exact DP
oracle (a "matches DP -> 100%" bar + a value-from-cold-day-5 readout approaching V*),
framed as model-free TD control ("learn the playbook by playing, with epsilon to keep
exploring"). `sarsa.js` keeps a `qLearningUpdate` too for parity / a future side-by-side,
but the headline learner is SARSA.

## QA (this Mac hangs headless Chrome)

Use the watchdog recipe (launch detached with a fresh `--user-data-dir`, poll for the PNG,
kill the process); see `.shots_tmp/shoot.sh`. Shots go in `.shots_tmp/` (gitignored).
**Mobile gotcha:** old headless Chrome with `--window-size=390,...` does NOT emulate a
mobile layout viewport. To verify true 390px responsive layout, render the page inside a
`width:390px` `<iframe>` and screenshot that (the iframe wrapper's `src` must point one
level up: `../index.html#scene=N`). All 13 scenes were verified clean at desktop (1280x900)
and true 390px mobile; the CRT variant and visual parity with `press-your-luck/` were also
checked.

## House-style note

This cartridge ships the gallery's **Press Start 2P pixel theme** (warm grey-cream
`#E8E0CC`, hard black borders), visually indistinguishable from `press-your-luck/` and the
reskinned `gamblers-ruin/`, plus the screen-only amber CRT dark variant. Lever colour
identity: NUDGE teal / DO NOTHING grey / PUSH gold; Conversion-Wheel wedges BUY green /
IGNORE grey / ABANDON red.

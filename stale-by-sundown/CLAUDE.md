# stale-by-sundown -- the "Stale by Sundown" bakery markdown MDP viz

A browser-only, no-build, file://-safe educational visualization of the
**bakery markdown** MDP (a depreciating-asset / revenue-management problem) for a
**manager audience**. It is one cartridge in the SML reinforcement-learning
gallery (a sibling of `gamblers-ruin/`, `press-your-luck/`,
`last-minute-pricing/`, `pokemon-battle/`, ...). It walks the canonical
**13-scene arc** (title -> tutorial -> playtest -> formalization -> policy ->
trajectory -> return -> Q* -> Bellman -> DP -> DP-caveat -> SARSA -> recap).

Design source of truth:
`../mdp-gallery/brainstorm/proposals/06-stale-by-sundown.md` (the full spec,
exact numbers, scene-by-scene plan) and `../mdp-gallery/reference/pokemon-arc.md`
(the 13-scene DNA). Built by mirroring the multi-file structure, click-step
scene engine, KaTeX vendoring, chiptune music, and precompute rigor-gate of
`gamblers-ruin/`, but skinned in the gallery's **light Press Start 2P pixel
house theme** (NOT the editorial serif theme), matching `press-your-luck/`.

## The MDP

- **State** s = the situation on the shelf = `(units, freshness tier)`. Units in
  `{1, 2, 3}`; tier in `{FRESH, OK, AGING, OLD, STALE}`. That is `3 x 5 = 15`
  non-terminal states, drawn as a 5-row (age, FRESH at the warm top) x 3-column
  (stock) display case. Two terminals: **CLEARED** (shelf empty, the win) and
  **SPOILED** (a stale unit aged out unsold, the loss).
- **Action** a = one of 3 levers, **always legal**: **HOLD** (full price, best
  margin, slowest), **DISCOUNT** (cut price, demand jumps), **DUMP** (write off
  the batch, restock FRESH at the same unit count).
- **Transition** P = the visible **buy-meter**. HOLD/DISCOUNT: with `pbuy(tier,
  lever)` a customer buys -> one unit sells, the rest keep the tier (a stale
  single -> CLEARED). With `1 - pbuy` nobody buys -> the whole batch ages one
  tier; a STALE no-sale tips into SPOILED. DUMP is deterministic -> FRESH.
  `pbuy` rises on DISCOUNT and shrinks with age (the table is in `js/bakery.js`).
- **Reward** r = the till change: **+5** HOLD sale, **+2** DISCOUNT sale, **−3**
  DUMP, **−6** SPOILED, **0** CLEARED. Discount **γ = 0.75** ("by sundown").
- **The twist (state-dependent optimal action):** the freshness tier is the
  croissant's evolution stage, and the best lever flips as the batch ages. The
  verified optimal playbook reads almost purely down the age axis:

  | freshness \ units | 1 | 2 | 3 |
  |---|---|---|---|
  | **FRESH** | HOLD | HOLD | HOLD |
  | **OK**    | HOLD | HOLD | HOLD |
  | **AGING** | HOLD | DISCOUNT | DISCOUNT |
  | **OLD**   | DISCOUNT | DISCOUNT | DISCOUNT |
  | **STALE** | DUMP | DUMP | DUMP |

  Four of five tier-rows ignore stock entirely; only **AGING** wiggles (1 unit
  HOLDs, 2-3 units DISCOUNT). **Age drives the policy.** The converged board is a
  **green cap (HOLD), amber middle (DISCOUNT), red floor (DUMP)** -- the
  three-way flip you can see across the room.
- **State-space size:** 15 non-terminal + 2 terminals. Full Q-table = `15 x 3 =
  45` numbers, drawable in its entirety; value iteration converges in 43 sweeps.

## Layout

```
stale-by-sundown/
  index.html              entry; fixed script/style load order
  css/
    style.css             light Press Start 2P pixel theme (warm cream #E8E0CC /
                          ink #181818) + a screen-only CRT amber-phosphor variant;
                          chrome, badges, buttons, formula cards, responsive @media,
                          lever (--lever-*) + freshness-tier (--tier-*) tokens
    board.css             the 5x3 display-case widget (state board + Q-table)
    meter.css             the "did a customer buy?" buy-meter (the visible dice)
    scene0.css .. scene12.css   per-scene layout
  js/
    levers.js             actions (HOLD/DISCOUNT/DUMP); aliased to window.Moves
    bakery.js             the MDP (state/transition/sample/successors); aliased to
                          window.Battle AND window.Gambler; the posted buy-meter
    bellman.js            value iteration (gamma plumbed; earlier-lever tie-break)
    sarsa.js              TD-control primitives: on-policy SARSA update (headline)
                          AND off-policy Q-learning update (kept for the nuance)
    croissant.js          window.Croissant: the pixel-art SVG state-icon, 5 frames
    board.js              window.Board: display-case widget (paintQ/paintPolicy/...)
    meter.js              window.BuyMeter: the buy spinner + walking customer
    katex-helpers.js      window.Katex.render/inline/display (vendored KaTeX)
    theme.js, i18n.js, i18n-ui.js, sfx.js, music.js, music-ui.js, dialog.js,
      speakerNotes.js     chrome (theme toggle, i18n core, audio, dialog, notes)
    i18n/sceneN.i18n.js   per-scene EN + JP copy (register into window.I18N)
    scenes/sceneN.js      the 13 scenes (register window.scenes.sceneN)
    main.js               click-step engine: hash routing #scene=N, keyboard
                          left/right, dot pager, concept badges, speaker notes;
                          exposes window.SBS (and window.GR alias)
  data/datasets.js        GENERATED by precompute (window.DATA)
  precompute/build-datasets.js   the rigor gate (see below)
  vendor/katex/           KaTeX vendored (no CDN), copied from gamblers-ruin
  assets/fonts/           PressStart2P bundled (the pixel theme uses it)
```

No build step. Open `index.html` from `file://`; everything (engine, KaTeX,
data, SFX, chiptune music) works offline. The only network ref is the optional
DotGothic16 Google Font for Japanese, which falls back to the OS Japanese font.

### Engine conventions (shared with the gallery)

- `window.Bakery` is aliased to BOTH `window.Battle` and `window.Gambler`, and
  `window.Levers` to `window.Moves`, so the reused `bellman.js` / `sarsa.js`
  consume them unchanged.
- The Q-table is a clean `15 x 3` (`Q[stateIndex*3 + leverIdx]`, stateIndex =
  `(units-1)*5 + tierIndex`, leverIdx over `[HOLD, DISCOUNT, DUMP]`). All levers
  are legal at every state (no clamped cells, unlike the gambler).
- Scenes return `{ onEnter?, onLeave?, onNextKey?, onPrevKey? }`; returning
  `true` from a key handler consumes the keystroke for an internal step.
- `#scene=N` deep-links; `&instant` disables fade; `&run` auto-triggers a scene's
  primary animation for headless capture; `&theme=light|crt`.

## The rigor gate (precompute)

`node precompute/build-datasets.js` loads the verified runtime engine via a
`window` shim (single source of truth), runs value iteration, trains the
model-free learners, **asserts**, and only then writes `data/datasets.js`. If any
assertion fails the file is NOT written. Verified assertions:

1. VI converges (maxDelta < 1e-9) in 43 sweeps.
2. **The optimal policy board == the proposal twist EXACTLY** (HOLD cap /
   DISCOUNT middle / DUMP floor; only AGING stock-sensitive).
3. The three hand-checkable Q* intuitions match the proposal to 2 dp:
   (1,STALE) HOLD −5.45 / DISCOUNT −4.00 / **DUMP −0.18**; (2,OLD) HOLD 1.73 /
   **DISCOUNT 2.17** / DUMP 1.33; (2,FRESH) **HOLD 5.77** / DISCOUNT 4.51 / DUMP 1.33.
4. The (1,STALE)->DUMP backup reproduces `−3 + 0.75*V(1,FRESH)`, with
   V(1,FRESH) ~ 3.76.
5. Every board cell has a STRICT winner (no exact Q* ties), so the rendered
   policy + a snapshot diff do not flap.
6. The age axis dominates: exactly one tier-row (AGING) is stock-sensitive.
7. **On-policy SARSA (GLIE) reproduces the DP board on all 15 cells**, robust
   across 6 seeds; its greedy return from (3,FRESH) lands within 0.15 of V*; and
   constant-epsilon SARSA is demonstrably more cautious (the honest nuance).
8. The return spread from (2,FRESH): HOLD mean 5.78 / sd 2.84 / min −1.23,
   DISCOUNT mean 4.51 / sd 1.61, DUMP mean 1.32 -- the safe-vs-risky contrast
   (matches the proposal's 5.79/2.82, 4.50/1.62, 1.34).
9. A very patient gamma (0.97) shrinks the DISCOUNT band (gamma does real work).

## SARSA -- the model-free path (a deliberate choice, unlike Gambler's Ruin)

The proposal asks for SARSA whose learned playbook converges to the DP table.
**Here it does** (this differs from `gamblers-ruin/`, where on-policy SARSA had a
genuine timid fixed point and we had to show a SARSA-vs-Q-learning split).

Empirically (verified in the precompute + during tuning): on this 15-cell MDP,
**on-policy SARSA under a GLIE schedule** -- annealing epsilon (0.30 -> 0.02) plus
a Robbins-Monro step size `alpha = 1/(1+visits)^0.7`, with exploring starts --
converges to the DP-optimal board on **all 15 cells, robustly across 6 seeds**.
This is the textbook GLIE result: as exploration anneals toward greedy, the
on-policy fixed point becomes Q*.

So **scene 11 = "SARSA"** (badge **SARSA**), like most siblings, and the
precompute asserts `SARSA == DP`. The honest on-policy nuance is preserved and
taught as a one-line note: a *constant*-epsilon SARSA learner is also trained and
shown to be slightly **cautious** (it discounts a few HOLD cells earlier than DP;
it learns the value of the exploratory policy it follows). As exploration
anneals, that bias vanishes. Both update rules live in `sarsa.js` (`update` =
on-policy SARSA, `qLearningUpdate` = off-policy Q-learning) for completeness.

## Regenerating the data

```
node precompute/build-datasets.js
```
Re-run after any change to `levers.js` / `bakery.js` / `bellman.js` / `sarsa.js`.
Payload is ~27 KB (V*, Q*, policy, per-sweep DP fill frames, GLIE + constant-eps
SARSA snapshots, the agreement curve, return histograms, the demo trajectory,
the Q* tour, the patient-gamma board, recap copy, KaTeX strings).

## QA (this Mac hangs headless Chrome)

Use the watchdog recipe (`.shots_tmp/shoot.sh`: launch detached with a fresh
`--user-data-dir`, poll for the PNG, kill the process). Shots go in `.shots_tmp/`
(gitignored). **Mobile gotcha:** old headless Chrome with `--window-size=390,...`
does NOT emulate a mobile layout viewport (it renders at desktop width and shows
the left slice). To verify true 390px responsive layout, render the page inside a
`width:390px` `<iframe>` (`.shots_tmp/_mobile.html?u=<encoded scene url>`) and
screenshot that. Verified clean at 390px (scenes 0, 2, 9, 11, 12), desktop
1280px (all 13), the CRT theme (0, 9), and Japanese (0, 9). The proposal's
state-dependent twist is visibly rendered as the green-cap / amber-middle /
red-floor board in scenes 4, 9, and 11.

## House-style note

Per the build requirements, this cartridge uses the gallery's **light Press
Start 2P pixel theme** (visually indistinguishable in style from
`press-your-luck/` / `gamblers-ruin/`), the screen-only CRT variant, full EN+JP
i18n, chiptune music with the music toggle, and the "BY CARLOS COTRINI" credit on
the title scene. The croissant state-icon is drawn as crisp pixel-art SVG
(`js/croissant.js`), ripening through five freshness frames, so there are no
binary image assets and the whole thing stays offline/file-safe.

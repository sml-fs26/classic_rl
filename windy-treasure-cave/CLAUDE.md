# windy-treasure-cave -- the Windy Treasure Cave MDP viz

A browser-only, no-build, file://-safe educational visualization of the **Windy
Treasure Cave** MDP for a **manager audience**. It is one cartridge in the SML
reinforcement-learning gallery (a sibling of `gamblers-ruin/`,
`press-your-luck/`, `last-minute-pricing/`, `pokemon-battle/`, ...). It walks the
canonical **13-scene arc** (title -> tutorial -> playtest -> formalization ->
policy -> trajectory -> return -> Q* -> Bellman -> DP -> DP-caveat -> learning ->
recap).

Design source of truth:
`../mdp-gallery/brainstorm/proposals/12-windy-treasure-grid.md` (the full spec,
exact numbers, scene-by-scene plan) and `../mdp-gallery/reference/pokemon-arc.md`
(the 13-scene DNA). Built by mirroring the multi-file structure, click-step scene
engine, KaTeX vendoring, chiptune music, EN+JP i18n, and DP-verified precompute
of `gamblers-ruin/` and `press-your-luck/`. Theme: the gallery's **light Press
Start 2P pixel** house theme (NOT the editorial serif theme), plus the
screen-only CRT amber-phosphor dark variant.

## The MDP

- **State** s = the explorer's **tile** on a 5x5 floor plan, s = (row, col) with
  row, col in {0..4}. 25 tiles; two are terminal: the **gold** chest at (0,4)
  (+10) and the **pit** at (2,2) (-10). That leaves **23 playable tiles**. The
  state literally *is* the position, so the whole state space is the cave map.
- **Action** a = one of four compass **headings** UP/DOWN/LEFT/RIGHT (the
  direction attempted). All four are always legal (a wall just keeps you put), so
  the Q-table is a clean 23x4.
- **Transition** P = the **wind die** (a d10): with p=0.7 you go where you aimed;
  p=0.15 a gust shoves you to your left-perpendicular; p=0.15 to your
  right-perpendicular. A move into a wall keeps you in place (still a step).
- **Reward** r = **-1 per step** (the torch burns), but the **terminal-landing
  step pays only its bonus**: +10 on reaching the gold, -10 on falling in the pit
  (the -1 is NOT also charged on that final step). gamma = 1.
  - **This "terminal reward replaces the step cost" convention is the one under
    which the proposal's stated V*/Q* numbers hold EXACTLY.** The precompute
    asserts it (see below). The alternative "always -1 plus bonus" convention
    shifts every value by ~1 and flips the headline argmax, so it is wrong for
    this spec.
- **The twist (state-dependent optimal action):** the best heading depends
  entirely on the tile. Directly below the pit at (3,2), aiming straight UP
  (toward where the gold lives) is the **worst** move (70% of UP-steps drop you
  in the pit); the optimal heading is **sideways, RIGHT**. The arrow field
  **bends around the pit** -- the four pit-adjacent tiles never point inward.

## The verified solution (DP oracle)

```
 ->  ->  ->  ->  GOLD      V*:   4.1   5.8   7.5   9.3  GOLD
 ^   ^   ^   ^   ^               3.0   4.4   6.1   7.8   9.3
 ^   ^   PIT ->  ^               1.5   1.0   PIT   6.1   7.5
 ^   ^*  ->  ->  ^               0.0  -0.2   1.0   4.4   5.8
 ^*  ->  ->  ->  ^              -1.2   0.0   1.5   3.0   4.1
```

V* matches the proposal grid EXACTLY to 1 decimal at all 23 tiles. The three
called-out Q* "intuition" cells match EXACTLY to 2 decimals:
- below-pit (3,2): UP=-6.66, RIGHT=+0.97, LEFT=-2.25, DOWN=+0.66 (argmax RIGHT).
- top-safe (0,2): RIGHT=+7.52 (argmax).
- pit-left (2,1): UP=+0.97 (argmax) ; pit-right (2,3): RIGHT=+6.10 (argmax).

**Tie note.** The optimal policy matches the proposal's drawn arrow field at
every tile that has a UNIQUE argmax. There are exactly three genuine
machine-precision ties (UP == RIGHT): (1,3), (3,1), (4,0). The proposal's hand
drawing makes an inconsistent per-cell choice among them (it draws UP at (1,3)
but RIGHT at (3,1) and (4,0)); both arrows are equally optimal. The renderer uses
one principled tie-break -- *prefer the heading whose intended tile is closest to
the gold, then UP>RIGHT>DOWN>LEFT* -- and draws a faint secondary arrow on the
tie tiles (cells marked with `*` above). The precompute asserts the proposal's
arrow is ALWAYS one of the optimal headings, and that mismatches occur ONLY at
exact-tie tiles.

## Layout

```
windy-treasure-cave/
  index.html              entry; fixed script/style load order
  css/
    style.css             light pixel theme (NES cream / ink / Press Start 2P)
                          + the screen-only CRT variant; chrome, badges,
                          buttons, .dir-chip/.dpad heading chips, .formula cards
    caveboard.css         the 5x5 cave board widget (sprites, arrows, heat,
                          gust/leaves, win/loss flashes)
    windDie.css           the wind d10 widget (70/15/15 badge + tumble)
    coin.css              vestigial (coin widget unused; linked for parity)
    scene0.css .. scene12.css   per-scene layout
  js/
    actions.js            actions (UP/DOWN/LEFT/RIGHT + perpendiculars);
                          aliased to window.Moves
    cave.js               the MDP (state/transition/sample/successors, wind
                          outcomes, wall-bump); aliased to window.Battle
    bellman.js            value iteration; progress-to-gold tie-break;
                          tiedActionsAt() for the secondary tie arrow
    sarsa.js              TD-control primitives: on-policy SARSA update AND
                          off-policy Q-learning update (maxLegalQ bootstrap)
    caveboard.js          window.CaveBoard: the floor-plan state-icon + value /
                          policy board (the analog of gamblers' qladder.js)
    windDie.js            window.WindDie: roll(face, dir) -> Promise
    katex-helpers.js      window.Katex.render/display/inline (vendored KaTeX)
    theme.js, i18n.js, i18n-ui.js, sfx.js, music.js, music-ui.js,
      dialog.js, speakerNotes.js   chrome (copied/adapted from gamblers-ruin)
    i18n/sceneN.i18n.js   per-scene EN + full JP copy (register into window.I18N)
    scenes/sceneN.js      the 13 scenes (register window.scenes.sceneN)
    main.js               click-step engine: hash routing #scene=N, keyboard
                          left/right, dot pager, concept badges, speaker notes;
                          namespace window.WTC
  data/datasets.js        GENERATED by precompute (window.DATA)
  precompute/build-datasets.js   the rigor gate (see below)
  vendor/katex/           KaTeX vendored (no CDN), copied from a sibling
  assets/fonts/           PressStart2P (bundled, offline)
```

No build step. Open `index.html` from `file://`; everything (engine, KaTeX,
data, SFX, music) works offline. (DotGothic16 for the JP bitmap font is the one
network asset; it degrades gracefully to the OS Japanese font offline.)

### Engine conventions (shared with the gallery)

- `window.Cave` is aliased to `window.Battle`, and `window.Actions` to
  `window.Moves`, so the reused `bellman.js` / `sarsa.js` consume them unchanged.
- The Q-table is 23x4 (`Q[stateIndex*4 + actionIdx]`), stateIndex row-major over
  the non-terminal tiles via `Cave.stateIndex`.
- Scenes return `{ onEnter?, onLeave?, onNextKey?, onPrevKey? }`; returning
  `true` from a key handler consumes the keystroke for an internal step.
- `#scene=N` deep-links; `&instant` disables fade; `&run` auto-triggers a
  scene's primary animation for headless capture; `&theme=light|crt`;
  `&lang=en|jp` (a deep-link/QA override added in this cartridge).

## The rigor gate (precompute)

`node precompute/build-datasets.js` loads the verified runtime engine via a
`window` shim (single source of truth), runs value iteration, trains two
model-free learners, **asserts**, and only then writes `data/datasets.js`. If any
assertion fails the file is NOT written. Verified assertions:

1. VI converges (maxDelta < 1e-9; 86 sweeps).
2. **V* matches the proposal grid EXACTLY to 1 decimal** (all 23 tiles).
3. Every proposal arrow is an OPTIMAL heading at its tile; mismatches occur ONLY
   at genuine exact-tie tiles (of which there are at most a handful: (1,3),
   (3,1), (4,0)).
4. The three Q* intuition cells match the proposal EXACTLY to 2 decimals.
5. The TWIST: below the pit, UP is the WORST heading and the optimum is sideways;
   no pit-adjacent tile points inward; the bracketing tiles fan into >= 2 safe
   directions.
6. A hand-computable Bellman backup reproduces Q*(3,2,UP) = -6.66 exactly:
   `0.7(-10) + 0.15(-1+V*(3,1)) + 0.15(-1+V*(3,3))`.
7. The model-free split (see below) holds and is seeded so it does not flap.

## SARSA vs Q-learning -- the honest, deliberate choice (scene 11)

The build requirement says: try on-policy SARSA; if it converges to the optimal
policy use it, otherwise show the honest SARSA-vs-Q-learning split. **It does not
converge to the optimum here -- this cave is a classic cliff-walking problem --
so scene 11 shows the split, badge "TD".** Established empirically (and asserted
in the precompute, fixed-start training at the cave's spawn (4,0), seeded):

- **Off-policy Q-learning** (bootstrap on the best next heading, Robbins-Monro
  step) recovers the **exact DP map on all visited tiles**, including the
  risky-but-optimal RIGHT below the pit. greedy reach-gold ~0.96 == the DP
  oracle.
- **On-policy SARSA** (bootstrap on the actual next heading, constant step,
  steady epsilon) learns the value of the eps-soft route it actually walks.
  Because a stray exploratory step near the pit can fall in, it keeps its
  distance: **below the pit it aims AWAY (DOWN) rather than the optimal RIGHT**,
  and the pit-left tile aims sideways too. The safe path, not the optimal one. It
  agrees with DP on strictly fewer tiles than Q-learning.

This is the textbook cliff-walking cautious-vs-optimal distinction, localized
exactly at the cave's twist, and is itself a richer teaching point. Both updates
live in `sarsa.js` (`update` = on-policy SARSA, `qLearningUpdate` = off-policy).
The precompute asserts Q-learning == DP and SARSA demonstrably more conservative.

## Regenerating the data

```
node precompute/build-datasets.js
```
Re-run after any change to `actions.js` / `cave.js` / `bellman.js` / `sarsa.js`.
Payload is ~41 KB (V*, Q*, the policy/value/tie grids, per-sweep DP fill frames,
both learners' Q snapshots + eval curves, the demo trajectory, return-histogram
samples, the two hand policies, recap copy, KaTeX strings).

## QA (this Mac hangs headless Chrome)

Use the watchdog recipe in `.shots_tmp/shoot.sh` (launch detached with a fresh
`--user-data-dir`, poll for the PNG, kill the process). Shots go in `.shots_tmp/`
(gitignored). **Mobile gotcha:** old headless Chrome with `--window-size=390,844`
does NOT emulate a mobile layout viewport; to verify true 390px responsive layout
render the page inside a `width:390px` `<iframe>` (`.shots_tmp/mobile.html`) and
screenshot that. Verified clean at desktop 1280px AND true 390px mobile for all
13 scenes, in EN + JP, in the light + CRT themes.

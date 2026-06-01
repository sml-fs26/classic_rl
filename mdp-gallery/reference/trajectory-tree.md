# Trajectory tree, design DNA

This is the contract for the **trajectory-as-tree** view and its later
rollout across the five retro RL vizzes. It merges three independent
design proposals (pedagogy / layout / engineering) into one buildable
spec. Every number below is **verified against the live `pokemon-battle`
engine** (`js/battle.js`, `js/bellman.js`, `js/moves.js`); see
[Verified engine numbers](#verified-engine-numbers). The reference
implementation lives in `pokemon-battle/`; this doc says how to add the
tree to it and how to generalize.

Read [`pokemon-arc.md`](pokemon-arc.md) first: it is the scene arc this
view slots into. Follow the `course-viz` skill at
`/Users/carloscotrini/Documents/git_sml/classic_rl/.claude/skills/course-viz`
for the build mechanics (scene module shape, hash routing, `&run`, KaTeX,
headless screenshot loop, no `<style>`-injection, no inline categorical
colors).

---

## Concept

A trajectory `tau = (S1, A1, R1, S2, A2, R2, ...)` is usually drawn as a
flat tape of random-variable boxes. That tape is **one realization**, one
root-to-leaf path through a branching process. The tree view draws the
*set* of possible paths:

- **Nodes are states**, drawn with the app's existing state-icon (for
  pokemon: the two sprites under HP bars). The root is full size;
  descendants shrink.
- **Edges are annotated** with three things: the **action** taken (shown
  once, since the action is fixed per node; see explosion control), the
  **transition probability** `p` of that outcome, and the **reward** `r`.
- **Leaves carry `G_t`** for their path: the sum of rewards from the root
  to that leaf (undiscounted here, so `G_t = sum of rewards on the path`).
- **`E[G_t]` is then defined visibly** as the weighted sum over leaves:

  ```
  E[G_t] = sum over leaves of  P(path) * G_t(path),
           where P(path) = product of edge-probs on the path
  ```

This unifies four ideas the deck already teaches, in one picture:

| Idea | In the tree |
|---|---|
| one sampled trajectory | one highlighted **root-to-leaf path** |
| the return `G_t` | a **leaf annotation** |
| the value `E[G_t]` / `Q*` | the **weighted leaf sum** |
| the Bellman backup | the **depth-1** version of exactly this tree |

The Bellman identity `Q*(s,a) = E[R + max_a' Q*(S',a')]` is literally the
depth-1 chance tree under action `a`, with each child's best value
bootstrapped in as `r + V(s')`.

The engine already gives us the tree-building primitive:
`window.Battle.successors(state, moveId)` returns **exactly one ply** of
the chance tree for a fixed action, a list of `{ sNext, p, reward }`
outcomes whose `p` sums to 1. We never re-derive probabilities; we recurse
this.

---

## Explosion control

A full trajectory tree to terminal explodes. Measured on the real engine,
the optimal-policy tree from the full-HP start `FULL/FULL`:

| depth | leaves |
|---|---|
| 1 | 7 |
| 2 | 33 |
| 3 | 102 |
| 4 | 233 |

Undrawable, and not mobile-friendly. The fix is **four strategies
combined**, none of which lies about the math.

### The chosen strategy

1. **(c) Branch on chance only, fix the action per node.** The tree
   branches on `(s', r)` outcomes only, never on action choice. The action
   at a node is supplied by a policy function: either a **constant action**
   (take `a0` at the root, then act optimally, so the weighted leaf sum is
   `Q*(s, a0)`) or `Bellman.policy` everywhere (so the leaf sum is
   `E[G_t | pi*]`). This removes the action-fan, the larger of the two
   branching factors. **This is the spine of the design.**

2. **(a) Start near terminal, the primary honest view.** The default root
   is chosen so the full tree to win/loss is genuinely shallow and **every
   leaf is a real terminal with a pure `G_t`**, no bootstrap caveat. The
   hero root for pokemon (verified, see below) is **`LOW / MID`
   `(your=3, opp=2)` under action `THUNDER`**.

3. **(b) Depth-limit plus leaf bootstrap, the Bellman view, used in one
   place.** When a deeper or fuller root is shown, cap at `maxDepth` and
   turn any still-open frontier node into a leaf annotated
   `G_t = (partial return so far) + V(leafState)`, with `V` from
   `Bellman.valueIteration(1)`. The weighted leaf sum **still equals the
   true value**: this is the honest Bellman truncation. It is *not* the
   headline `G_t -> E[G_t]` view (the leaf is "partial return plus
   value-to-go", which muddies that lesson); it is reserved for
   **sceneDp**, where "partial return plus value-to-go" *is* the point.
   Bootstrapped leaves render dashed, with the `+V(s')` term shown
   explicitly.

4. **(d) Merge duplicate successors into a DAG.** Within a ply,
   `successors` already aggregates outcomes that land on the same
   destination state. Across plies, keep a per-depth `Map(stateKey -> node)`
   so two paths reaching the same `(your, opp)` collapse to one node with
   summed inbound `p`. Cuts leaf count roughly 25 to 35 percent on fuller
   roots. The engine's own `stateKey(s)` (`"y|o"`, or `"WIN"`/`"LOSS"`) is
   the key.

### Exact bounds and the leaf cap

- **Default rendered depth <= 2** (`maxDepth = 2`).
- **Default rendered leaf count <= ~8** for near-terminal roots; the hero
  root gives **exactly 4 leaves at depth <= 2**.
- **Hard cap `maxLeaves = 12`.** If a frontier would exceed it, the
  lowest-probability nodes (`p < pPrune`, default `0.02`) fold into a
  single greyed **aggregate leaf** (`"... rare, p=0.03"`) carrying the
  correct residual probability and a `G_t` equal to the
  probability-weighted mean of the folded paths, so the displayed
  `sum of P*G_t` is **never a lie** even when truncated. The cap and prune
  are asserted in code, not by eye.
- **Honesty assertion (mandatory, in code).** At mount: `sum of leaf P ==
  1` (within `1e-6`), and the weighted leaf sum equals the ground-truth
  value from `Bellman.qFromV` / `valueIteration` (within `1e-6`). If the
  chosen root fails "all leaves terminal at depth <= 2" (e.g. move tables
  were retuned), fall back to the depth-2 bootstrap view rather than
  hard-coding any probabilities. **Never hard-code leaf probabilities,
  derive them from `successors` live.**

---

## Visual treatment

### Node

Reuse the existing state-icon **verbatim**: the `.traj-box-state-body`
markup, two `.traj-box-side` columns, each an `<img.traj-box-sprite>`
(28px, `pikachu-back.png` + `Battle.spriteForOpp(opp)` for the evolving
opponent) over a 4px `.traj-box-hp` bar (`bucketClass`/`bucketPct`) and a
`.traj-box-bucket` label. A new `.tt-node` wrapper shrinks descendants
(sprites ~24px) and drops the `S_i` label; the **root renders full size**
and keeps its `S1` tag. Terminal leaves reuse `.traj-box-state-final.win`
/ `.loss` (faint/greyed sprite, blue/vermillion border via `--cb-blue` /
`--cb-vermillion`) plus a check / cross glyph, so win/loss is legible from
the non-color channel too. **Zero new icon code.**

### Edge

An annotated connector carrying chips on one row:

- **action** chip (blue, `--hue-casino`), shown **only on the edges
  leaving the root** (or any node where the fixed action could be
  misread), since the action is constant per node. Reuse
  `Moves.moveSubHtml` / `.type-pill`.
- **probability** chip `p` (neutral, e.g. `p=.225`).
- **reward** chip `r` (purple, `--hue-ghost`, signed: `-1` / `+10` /
  `-10`), matching the existing s/a/r hue identity (red / blue / purple).

Two edge-drawing options, **pick per layout** (see mobile vs projector):

- **Indented vertical (mobile-first, recommended default):** no SVG. Each
  node is a flex row `[spine][compact state-icon][a.p.r chips]`; children
  indent via `margin-left` plus a left-border "spine", with a short
  horizontal pseudo-element elbow per node. Reflows on mobile; no measured
  coordinates.
- **Horizontal (projector, `layout:'h'`):** a single `<svg>` overlay with
  orthogonal-elbow `<path>`s plus floating `.tt-edge-label` chips at edge
  midpoints. Endpoints are derived from `getBoundingClientRect()` after
  layout, repainted on a `ResizeObserver`/`requestAnimationFrame` pass.
  Edge stroke-width scales with `p` so the likely path reads as the trunk.

Keep edge chips **ASCII** (Press Start 2P has a narrow glyph set; the
delta glyph breaks). Abbreviate to `p .50  r -1` on non-root edges; the
verbose action label rides only on the root edges.

### Leaf

The terminal/frontier node plus a `.tt-leaf-g` badge:

- pure terminal: `G_t = +10` (color-coded pos/neg like `.g-result`).
- bootstrapped (sceneDp only): `G_t = -1 + V = +5.77`, rendered dashed
  with the `+V` term tinted as "value-to-go" to distinguish collected
  reward from bootstrap.

### Mobile + projector + themes

- **Mobile (390px):** the indented vertical tree is the default. Depth 2
  by 4 leaves is about 6 rows at ~80px each, fits 390px with no horizontal
  scroll. The ledger (below) is a single-column table that wraps naturally.
  Shrink descendant sprites to ~22px via a media query.
- **Projector (1400x900):** same tree, larger nodes via the existing
  rem-based sizing; `layout:'h'` available for a wide horizontal fan.
- **Themes:** retro-pixel only, Press Start 2P, the existing `light` +
  `crt` themes. All color from CSS tokens (`--hue-*`, `--cb-*`, `--ink*`,
  `--rule`); **no inline categorical colors, no `<style>` injection from
  JS** (per-scene CSS file linked in `index.html`).

**Verification is non-negotiable:** headless Chrome screenshots at
**1400x900 and 390px** in **both `light` and `crt`**, and **Read the
PNGs** before declaring done. Measured-coordinate SVG layout (the `'h'`
mode) is exactly the class of bug the screenshot loop exists to catch.

---

## Where it lives

Three pokemon scenes change. The random-variable **tape is not deleted, it
is demoted to a single highlighted root-to-leaf path** so the student
literally sees *trajectory = one path through the tree*.

### Files to change

| File | Change |
|---|---|
| `pokemon-battle/js/scenes/sceneTrajectory.js` | **Reframe** from the flat tape to the tree (biggest change). |
| `pokemon-battle/js/scenes/sceneObjective.js` | **Add** the `E[G_t] = sum of P*G_t` weighted-leaf ledger; replace the muted 4-turn rollout's role; keep the variance widget. |
| `pokemon-battle/js/scenes/sceneDp.js` | **Add** a depth-1 tree beside the Bellman card showing the backup *is* the one-ply tree. |
| `pokemon-battle/js/trajTree.js` | **New** shared component (see API). |
| `pokemon-battle/css/sceneConcepts.css` (or a new `css/trajTree.css` linked in `index.html`) | `.tt-node` / `.tt-edge-*` / `.tt-leaf-g` / `.tt-eg-ledger` styles. |
| `pokemon-battle/js/i18n/*.js` | New strings (tree heading, ledger labels, "one trajectory = one path", SAMPLE button). |

### 1. `sceneTrajectory` to "The trajectory tree"

The flat rollout becomes the tree (hero root, fixed action). The `tau`
formula card stays; its foot adds **"one trajectory = one path."** A
**SAMPLE** button calls `Battle.sample(rootState, action, rng)` and walks
the returned outcome to a leaf, lighting that path (`.tt-path-lit`) while
the rest dims; the STEP/`onNextKey` interaction walks the path one ply at
a time, the faint tree behind showing the roads not taken. A thin strip
under the tree shows that same lit path **as the old tape**
(`S3, A3, R3, S4, ...`) so the tape becomes a *derived* view, not the
primary one. Keep `&run` so it auto-samples/auto-walks for the screenshot.

### 2. `sceneObjective` to add the `E[G_t]` reveal

Keep the `G_i(tau)` card and the `Q*` card. **Replace** the muted 4-turn
rollout (its job was "what is a return") with the **weighted-leaf ledger**
(below). The variance/histogram widget stays as the empirical companion,
now strictly upgraded: "sample 200 paths; the running mean mu converges to
the ledger's computed `E[G_t]`" gives the histogram a **target line to
converge to** (the exact `E[G_t]` from the tree).

### 3. `sceneDp` to the backup is the depth-1 tree

Beside the existing Bellman card (`Q*(s,a) = E[R + max_a' Q*(S',a')]`),
render a **depth-1** `TrajTree` (`maxDepth:1`, `rootAction:a`,
`bootstrapFrontier:true`, `valueFn:V`). This is the chance fan under `a`
with children bootstrapped by `V`, and its ledger arithmetic is the same
per-cell breakdown sceneDp already computes in
`buildBreakdown`/`renderDetail`. It makes "Bellman backup = depth-1
trajectory tree" visible and reuses the node/edge/ledger components.

---

## E[G_t] presentation

Under the tree, a **weighted-sum ledger** (`.tt-eg-ledger`), one row per
leaf, built by walking the same tree. The header is KaTeX (display mode,
via `Katex.render(tex, host, true)`):

```
E[G_t] = sum over leaves of  P(path) * G_t(path)
```

Keep the KaTeX header short; put the **numeric ledger in plain styled
HTML, not KaTeX** (Press Start 2P plus `\text{path}` subscripts overflow
narrow screens). For the hero root `LOW/MID, THUNDER` the ledger reads,
exactly (engine-verified, `E = Q*` to 4 dp):

```
   P(path) * G_t           P = product of edge-probs
   .500 * (-10)  =  -5.000
   .275 * (+10)  =  +2.750
   .163 * (-11)  =  -1.794
   .062 * ( +9)  =  +0.557
   ------------------------
   E[G_t] = sum of P*G_t = -3.49        ( = Q*(LOW/MID, THUNDER) )
```

Each ledger row **highlights its leaf** (and its root-to-leaf path) on
hover/tap, reusing the `.selected` mechanic already in `sceneObjective`:
this is the "one trajectory = one path" payoff. Under `&run`, a stepped
reveal fades the rows in one-by-one while a running sum ticks, then the
final `E[G_t]` lands and a callout notes **it equals `Q*`**, closing
`G_t -> E[G_t] -> Q*` in one frame.

**Tie to Q\* and Bellman.** The negative `E[G_t] = -3.49` teaches *why
LOW/MID is a losing position* far better than prose. And because sceneDp's
depth-1 tree uses the **same ledger** with bootstrapped leaves, the
student sees `Q*(s,a) = E[R + max_a' Q*(S',a')]` as the **one-ply**
instance of the very arithmetic that defined `E[G_t]` two scenes earlier.

---

## The reusable `window.TrajTree` component

Pure data first (`build`), DOM second (`render`/`mount`): matches the
skill's "state is the source of truth." The **host owns only**
`renderNode` (and optionally `edgeLabel`); TrajTree owns
build / merge / prune / layout / ledger. Adoption per viz is a ~3-line
`engine` adapter plus passing the viz's existing state-icon renderer as
`renderNode`.

```js
window.TrajTree.mount(host, {
  // --- engine adapter (host-provided) ---
  engine,            // { successors(s,a) -> [{ sNext, p, reward }],
                     //   isTerminal(s), stateKey(s) }   // = Battle.successors / .stateKey
  rootState,
  expandPolicy,      // (state, depth) -> actionId   // fixes the action per node (chance-only)
  rootAction,        // optional: force action a at depth 0 (renders Q*(s,a)); expandPolicy after

  // --- size / honesty controls ---
  maxDepth,          // default 2
  maxLeaves,         // default 12  (overflow -> single aggregated "rare" leaf, residual p kept)
  pPrune,            // default 0.02
  merge,             // default true (DAG: collapse equal stateKey within a depth, sum p)
  gamma,             // default 1

  // --- bootstrap (Bellman view) ---
  valueFn,           // (state) -> number, for bootstrapped frontier leaves; null = no bootstrap
  bootstrapFrontier, // default !!valueFn

  // --- rendering (host-provided node renderer) ---
  renderNode,        // (state, { role:'root'|'inner'|'terminal'|'frontier', el }) -> void  [HOST]
  edgeLabel,         // (edge, { depth }) -> string         // default: action . p . r
  layout,            // 'v' (default, mobile-first) | 'h' (projector horizontal)
  sfx,               // optional window.Sfx
}) -> {
  update(opts),      // rebuild with new options
  highlightLeaf(id), // light a root-to-leaf path + its ledger row
  samplePath(rng),   // walk one sampled path (engine.successors draw); returns { edges, leafState, G }
  getTree(),         // computed tree, for tests
  getEG(),           // computed E[G_t], for tests
  destroy(),
}
```

Pure-data sub-API (also callable directly; `build` is what `render` and
the tests use):

```js
window.TrajTree.build(rootState, {
  successors, expandPolicy, rootAction, maxDepth, maxLeaves, pPrune,
  merge, gamma, valueFn, bootstrapFrontier,
}) -> { root, nodes, leaves }
   // node  = { state, move, role, gPartial, bootV, children:[{ p, reward, node }] }
   // leaf  = { state, P, G, edges:[{ move, p, reward }], aggregated? }

window.TrajTree.enumeratePaths(tree) -> [{ leafState, P, G, edges }]
```

`expandPolicy(state)` is `() => 'thunder'` for the fixed hero tree, or
`s => Bellman.policy[Battle.stateIndex(s)]` for "act optimally."
Cold-entry safe: everything derives from `window.Battle` +
`window.Bellman` at mount, no `fetch`, no relative imports, no `DATA`
dependency beyond the engine.

**Tests (assert in code, per the skill).** `getTree()`: `sum of leaf P ==
1` (within 1e-6). `getEG()`: equals `Bellman.qFromV(V,1)` at
`[stateIndex*3 + moveIdx]` for a constant-action root (within 1e-6), or
`V[stateIndex]` for the optimal-policy root. These are the same assertions
the build does at mount.

---

## How it generalizes to the other 4 retro vizzes

The whole design is built on two host-supplied callbacks, a `successors`
function and a state-icon `renderNode`, so each viz adopts it by writing a
tiny adapter. The reframe (tape to tree, ledger, depth-1-backup) carries
over wherever the viz teaches `G_t`, `E[G_t]`/value, or a Bellman backup.

- **`engine` adapter:** every viz's MDP already exposes a one-ply
  enumerator equivalent to `successors(s,a) -> [{ sNext, p, reward }]`
  (and `isTerminal`/`stateKey`). Wrap it; that is the tree primitive.
- **`renderNode`:** pass the viz's existing state-icon renderer (the
  compact form). No new icon art.
- **Near-terminal hero root:** pick, per viz, the smallest root where the
  optimal action genuinely branches **and** leaves mix outcomes (so
  `E[G_t]` is interesting, not degenerate) **and** the fixed action is
  actually optimal there. **Verify against that viz's engine**, do not
  reuse pokemon's `LOW/MID`. (See the rejected-root note below for why a
  degenerate root is worse than no tree.)
- **Bootstrap leaves** only where the viz has a value function (`valueFn`)
  and a Bellman scene to host the depth-1 tree.
- **Layout token** `'v'` everywhere for mobile; `'h'` only where a viz is
  predominantly projected.

Because `build`/`render` are split and the cap/prune/merge logic is shared,
a viz with a larger fan-out (more chance outcomes per ply) still lands
inside the leaf cap with an honest aggregate leaf, with no per-viz tuning.

---

## Verified engine numbers

Computed by recursing the live `pokemon-battle` engine (`moves.js` +
`battle.js` + `bellman.js`, `gamma = 1`). These are the ground truth the
build asserts against.

**Hero root, `LOW/MID` `(your=3, opp=2)`, fixed action `THUNDER`** (the
chosen near-terminal root): 4 leaves, depth <= 2, `sum of p = 1.0000`,
`E[G_t] = -3.4875 = Q*(LOW/MID, THUNDER) = V(LOW/MID)`, and `THUNDER` **is**
the optimal action there. Leaves:

```
  LOSS   P=0.5000  G=-10.000
  WIN    P=0.2750  G=+10.000
  LOSS   P=0.1631  G=-11.000   (via CRIT/MID at depth 1)
  WIN    P=0.0619  G= +9.000   (via CRIT/MID at depth 1)
```

This is the unique near-terminal root that simultaneously (i) keeps the
full tree to terminal at depth <= 2 with <= 4 leaves, (ii) mixes wins and
losses, and (iii) has the fixed action equal to the optimal action.

**Depth-1 Bellman backup, `FULL/MID` `(0,2)`, action `THUNDER`,
bootstrapped leaves:** 5 children, `sum of p = 1.0000`,
`E = 5.7735 = Q*(FULL/MID, THUNDER)`, and `THUNDER` is optimal there (this
is the cell sceneDp already details). Leaves:

```
  WIN       P=0.2750  G=+10.000
  MID/CRIT  P=0.1375  G= +9.000  (boot: r=-1 + V=+10)
  LOW/CRIT  P=0.1375  G= +9.000  (boot)
  HIGH/MID  P=0.2250  G= +3.073  (boot)
  MID/MID   P=0.2250  G= -0.635  (boot)
```

**Rejected roots (cautionary).** The "near-terminal" roots `FULL/LOW`
`(0,3)` and `HIGH/LOW` `(1,3)` under `THUNDERBOLT` are **degenerate**: all
3 leaves are WINS, `E[G_t] = +9.5`, and, fatally, the optimal action there
is `quick_attack`, **not** thunderbolt. Fixing `THUNDERBOLT` would render
a non-optimal `Q` while implying it is the value, a pedagogical liability.
A degenerate or non-optimal-action root is worse than no tree; this is why
the hero-root choice must be verified, not guessed.

---

## Risks

- **Drawing edges without SVG (vertical mode).** The parent-to-children
  "elbow" is fiddly in pure CSS. Mitigation: a left-border spine per
  child-group plus a short horizontal pseudo-element per node; never
  attempt curved/diagonal lines.
- **SVG edges over reflowing HTML nodes (horizontal mode).** The single
  hardest engineering part: elbow endpoints must re-derive from
  `getBoundingClientRect` after layout/theme/font load and recompute on
  resize, or edges detach from nodes (the classic headless-vs-live
  divergence). Mitigation: lay out HTML first, measure in a
  `requestAnimationFrame` pass, paint SVG, repaint on `ResizeObserver`.
  Verify headless at 390px **and** 1400px in both themes.
- **The stepped weighted-sum reveal staying legible, the pedagogical
  payload.** Three things animate at once (the leaf lighting, its ledger
  row appearing, the running `E[G_t]` ticking), across two themes and two
  widths, with the final `= Q*` landing cleanly. If it reads busy or laggy
  the scene fails even though the math is right. Getting that one moment to
  read as a single causal story (*this leaf, times its probability, adds
  this much to the expectation*) is the whole point. Gate any motion
  behind `prefers-reduced-motion`; make path-highlight an instant class
  swap, never a transition.
- **Honesty under pruning/bootstrap.** The aggregate "rare" leaf and the
  bootstrap term must keep `sum of P*G` exactly equal to the true value,
  asserted in code (`getTree`/`getEG` vs `Bellman`), not by eye.
- **KaTeX width under Press Start 2P.** Keep the display formula short;
  put numbers in plain HTML; keep edge chips ASCII and abbreviated.
- **Root validity if the engine is retuned.** Compute the tree from
  `successors` live and assert "all leaves terminal at depth <= 2" at
  mount; fall back to the depth-2 bootstrap view if it fails. Never
  hard-code the leaf probabilities.

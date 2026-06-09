# Plan — Repair or Replace (manager-gallery MDP) visualization

Target folder: `classic_rl/repair-or-replace/` (sibling to `last-minute-pricing/`, `churn-rescue/`, `pipeline-climb/`).
Style guide: `.claude/skills/course-viz/SKILL.md` (multi-file editorial click-step pattern).
Reference model (verified): `repair-or-replace/precompute/value_iteration.py` — run it; it asserts the policy below.
Curriculum slot: manager gallery, alongside Last-Minute Pricing / Press-Your-Luck / Pipeline Climb / Churn Rescue.

This is a **new** viz (no predecessor). Status: design locked & value-iteration-verified; not yet built.

---

## 0. Why this example exists (the brief)

The manager gallery already has four pieces, but the flagship-quality slot wants something that beats
**both** Pokemon (fun, tiny state space) and **Last-Minute Pricing** (relatable, but the optimal action
barely moves with state). The author's explicit requirement:

> A manager-relatable MDP with a *simple* state space and a *simple* action space, where the optimal
> policy is **not obvious** and genuinely depends on **both the state and the action** — not a near-fixed
> lever like pricing.

**Repair or Replace** is the pick. One delivery van — "OLD BESSIE" — wears out a little each week; each
week you **run it, shop it, or buy new**. It is:

- **Maximally manager-relatable, not gambling-flavored.** Every fleet/plant/IT manager has lived
  "repair or replace." It's the manager analog of Howard's classic automobile-replacement MDP.
- **Tiny.** 4 states x 3 actions = a **12-cell** Q* table, smaller than Pokemon.
- **Genuinely state-dependent with a surprise.** The optimal policy carves three bands and **scraps the
  van while it still starts every morning** — the "wait, *really?*" beat Pricing never had.

### Why not the alternatives (brainstorm record)
- **(s,S) inventory reorder** — strong (the order-up-to band is beautiful) but too close to Pricing's
  supply-chain world; would feel less *new* sitting next to it.
- **Blackjack** strategy card is the canonical state-dependent policy, but it's a casino game and the
  gallery already has Casino + Press-Your-Luck.
- Collections / stop-the-line / kill-the-project were also-rans; maintenance has the cleanest control-limit
  policy + the best discount-factor story.

---

## 1. What this viz must convey (pedagogy)

Five messages, and the design is the **structural minimum** that carries all five (see §3):

1. **MDP framing** — state / action / transition / reward named on screen.
2. **Policy is a state -> action MAP** — the argmax visibly changes with state.
3. **Two frontiers / three regions** — there is a genuine *middle* option (SERVICE), not just
   "use it or bin it." This is what beats Pricing and the single-threshold Press-Your-Luck.
4. **The surprise** — REPLACE is optimal at SHAKY, a state that *still works* (FAILING sits visibly below it).
5. **The gamma story** — patience moves the scrap line; short-termists run the van into the ground.

The same DP-then-SARSA arc as the rest of the gallery (value iteration fills Q*, then SARSA rediscovers
the bands from experience with no model of breakdown odds).

---

## 2. The MDP (locked & verified)

States: `HEALTHY -> WORN -> SHAKY -> FAILING` (one wear axis).
Actions: `RUN · SERVICE · REPLACE`.

| state | RUN profit | breakdown risk (RUN) | SERVICE outcome |
|-------|-----------:|---------------------:|-----------------|
| HEALTHY | 95 | 2%  | (no need) |
| WORN    | 72 | 8%  | reliably restores toward HEALTHY/WORN |
| SHAKY   | 40 | 28% | **often fails to help** (45% no change) — the cliff |
| FAILING | 16 | 55% | mostly stuck |

- **RUN**: earn RUN-profit, van degrades 0–2 levels; a breakdown costs **−280** and dumps it to FAILING.
- **SERVICE**: **−50**, a week offline (no profit); strong on a worn van, weak on a clapped-out one.
- **REPLACE**: **−130**, a week offline, condition resets to HEALTHY.
- gamma default **0.9** (slider in the discount scene).

Two deliberate design choices make the surprise land cleanly at the 4-state floor:
- **A revenue/risk cliff WORN(72, 8%) -> SHAKY(40, 28%)** so SHAKY clearly *wants a reset*.
- **SERVICE is realistically weak on bad vans** so REPLACE decisively beats SERVICE at SHAKY (not a tie).

### Verified Q* (gamma = 0.9) — symmetric ±23 margins

```
state        RUN   SERVICE  REPLACE     pi*
HEALTHY    311.0    229.9    149.9     RUN
WORN       203.4    226.1    149.9     SERVICE   <- service wins by +23
SHAKY       96.5    126.4    149.9     REPLACE   <- replace wins by +23  (still runs!)
FAILING     -3.1     86.9    149.9     REPLACE
V = [311.0, 226.1, 149.9, 149.9]
```

Note **RUN at FAILING is negative (−3.1)**: running a dead van *loses* money on average (breakdowns eat
the profit) — same "the lever is good here, destructive there" beat as pipeline-climb's COLD-close.

### The gamma story — BOTH frontiers slide left as patience rises

```
gamma=0.4  RUN  RUN  SERVICE  SERVICE   <- myopic: never scrap, patch it forever
gamma=0.6  RUN  RUN  SERVICE  REPLACE
gamma=0.8  RUN  SERVICE REPLACE REPLACE  <- patient: service sooner AND scrap while it runs
```

Headline: *short-term operators run the van into the ground; patient owners maintain earlier and replace
before it dies.* gamma is not an abstract knob — it's how far ahead the operator looks.

---

## 3. Minimality (why exactly 4 states and 3 actions)

Worked out and verified — this is the structural floor for the full message set, **not** padded.

**States = 4 (every one load-bearing).**
- 3 states are forced just to make all three actions optimal somewhere (RUN/SERVICE/REPLACE bands).
- A 4th is forced by **the surprise**: there must be a *visibly worse* state (FAILING) sitting *below* the
  one where REPLACE first wins (SHAKY). With only 3 states, REPLACE lands on the worst state and
  "replace the dead one" surprises nobody.
- A 5th state (splitting HEALTHY) is **polish only** — wider RUN band, prettier table. We **dropped it**:
  once WORN and SHAKY are properly distinct, the 4-state floor already has confident ±23 margins, so the
  5th state would be filler. Ship 4.
- Resulting band shape is `1·1·2` (RUN·SERVICE·REPLACE·REPLACE). The asymmetry is itself a lesson:
  *the scrap zone is wide — once it's bad enough, stop fiddling and replace.*

**Actions = 3 (SERVICE earns its slot).**
- Drop SERVICE -> 2 actions = a single RUN|REPLACE threshold. Still state-dependent, can even keep the
  surprise, **but** it throws away message #3 (the middle option / two-frontier map) — the exact thing
  that makes this better than Pricing and the single-threshold Press-Your-Luck. So 3 is the floor for the
  *distinctive* viz; 2 is only the floor for "a state-dependent policy at all."

---

## 4. Scene workflow (13 scenes, mirrors the gallery arc)

Same arc and concept badges as `pipeline-climb` (`scene3=mdp, scene4=policy, scene6=return,
scene7=qstar, scene9=dp, scene11=sarsa`). Click-step, not scrollytelling.

| # | Title | Badge | What happens |
|---|-------|-------|--------------|
| 0 | **REPAIR OR REPLACE** | — | Van wordmark, title music |
| 1 | How it works | — | The three levers; the breakdown risk |
| 2 | You run the fleet | — *(playtest)* | Manually pick RUN/SERVICE/REPLACE each week; watch Bessie degrade across the 4 wear states; eat a breakdown |
| 3 | What makes this an MDP? | **mdp** | Name state / action / transition / reward on screen |
| 4 | Policy: your maintenance playbook | **policy** | The 4-cell state -> action map |
| 5 | The trajectory | — | One signed week-by-week run (HEALTHY -> run -> WORN -> service -> ... -> SHAKY -> replace -> HEALTHY cycle) |
| 6 | Return over the van's life | **return** | Discounted sum; **gamma slider** -> both frontiers move |
| 7 | Q*: the action scorecard | **qstar** | The 4x3 table; reveal both frontiers + the SHAKY surprise |
| 8 | The Bellman equation | — | The recursion behind the table |
| 9 | Filling Q* with DP | **dp** | Value-iteration sweep converges the bands |
| 10 | Why DP doesn't scale | — | Real state = (odometer, age, weeks-since-service, load) x a whole fleet -> blow-up |
| 11 | SARSA: learn from the logbook | **sarsa** | Q-table fills from experience; rediscovers the three bands, no breakdown odds given |
| 12 | Recap | — | Concept cards in Bessie's voice |

---

## 5. Visual / theme notes

- Side-view van with a **health gauge** (green -> amber -> red) + an odometer ticking up; exhaust gets
  smokier with wear; a satisfying **breakdown animation** (hazard lights, smoke, tow icon) when RUN rolls
  a failure. Same charm budget as Pokemon, ops frame.
- Tone alternative if a lighter touch is wanted: swap the van for an **office espresso machine** (sputters,
  leaks steam) — identical math, more comedy. Decide before building.
- Reuse the gallery's editorial palette / KaTeX-vendored-per-folder / `t`=theme, arrows=navigate conventions.

---

## 6. Build steps (when picking this up)

1. **Port the model to JS** under `repair-or-replace/precompute/build-datasets.js`, mirroring the
   pipeline-climb pattern: load the engine, run value iteration, and **ASSERT the exact Q* grid above**
   before writing `data/datasets.js`. The Python file `precompute/value_iteration.py` is the contract —
   keep the JS in lockstep with it.
2. Scaffold `index.html` + `js/` from a sibling gallery viz (pipeline-climb is the closest structurally:
   5-state -> 4-state, 3 levers -> 3 actions, same DP+SARSA arc).
3. Build the 13 scenes per §4; the gamma slider (scene 6) must show **both** frontiers sliding.
4. Add the gallery entry to root `index.html` (copy below).
5. Verify with the `verify` / `run` skills before pushing.

### Gallery entry (drop-in for root `index.html`)

> **Repair or Replace** — One van, four states of wear; run it, shop it, or buy new. The optimal call
> splits into three bands and scraps the van *while it still starts* — and how early depends on your
> patience (gamma). Asset replacement as an MDP, solved by DP then SARSA.

---

## 7. Open decisions for the author
- **Van vs espresso machine** theme (charm vs ops-seriousness).
- Wordmark / van name ("OLD BESSIE" is a placeholder).
- Whether to localize (the gallery's churn-rescue has an i18n layer; pricing/pipeline mostly don't).

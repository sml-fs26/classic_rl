# Windy Treasure Cave

> Navigate a 5x5 cave to the gold while a gusting draft randomly shoves you — and the safe heading changes cell by cell.

## Why this lands with managers
Every manager has committed to a heading and watched the market, a supplier, or a regulator shove the project sideways anyway. This cave makes that feeling literal: you pick a direction, a gust rolls, and sometimes you do not go where you aimed. The lesson a manager leaves with is the one that matters most for capital allocation under uncertainty — **the right move is not fixed; it depends on where you are standing.** Near the cliff edge you steer around the danger even though it is the longer road; in safe territory you head straight for the payoff. That is portfolio thinking, made visual on a 5x5 floor plan.

## The MDP at a glance
- **State (S):** the explorer's tile on a 5x5 floor plan — `(row, col)` with `row, col ∈ {0,1,2,3,4}`. That is **25 tiles**; two are terminal (the gold tile and the pit tile), leaving **23 non-terminal states**. The state literally *is* the position, so the entire state space is the cave map you are looking at.
- **Actions (A):** four compass headings — **UP, DOWN, LEFT, RIGHT** — the direction the explorer *attempts* to walk. (Trimmable to three if a cleaner arrow field is wanted; see Risks.)
- **Transition (P) — the visible dice:** each step, a **wind die (a d10)** is rolled on screen. Faces **1–7 (p = 0.7)**: you go where you aimed. Faces **8–9 (p = 0.15)**: a side gust shoves you one tile to the left of your heading. Face **10 (p = 0.15)**: a gust shoves you to the right of your heading. Walking into a wall keeps you in place (the step still costs you). Blowing-leaves sweep across the cave and a die popup snaps up whenever the wind overrode your choice.
- **Reward (R):** **−1 per step** (find the gold fast — every step burns a torch), **+10** on the gold tile, **−10** in the pit. Undiscounted (γ = 1); the cave is small enough that every path terminates, so returns are finite and hand-summable.
- **Terminal:** the episode ends the instant you land on the **gold** (+10) or fall in the **pit** (−10). Episodic — then you respawn at the start tile.
- **The twist (state-dependent optimal action):** because a side gust can shove you into the pit, **the best heading depends entirely on which tile you are on.** The tile directly below the pit must aim *sideways* — aiming straight up (toward where the gold lives) lands you in the pit 70% of the time. The four tiles bracketing the pit each point a *different* safe direction. Tiles far from the hazard point straight at the gold. The per-tile arrow field **visibly bends around the pit** — this is the cave's "evolution moment," the reason the value table is interesting instead of uniform.
- **State-space size:** **25 tiles (23 non-terminal).** It fits on one screen because the table and the map are the *same object* — every value, every optimal arrow, is drawn directly on the floor plan.

## Visual language
- **The cave floor plan:** a 5x5 grid of stone tiles, top-down dungeon-crawler view, rendered in the same retro pixel idiom as the Pokemon piece (the `crt` and `light` themes carry straight over). This board is the recurring **state-icon** — it appears in every scene, and the explorer's current tile glows.
- **Sprites:** a pixel **explorer** (torch-in-hand) for the agent; a glittering **gold chest** on the goal tile; a black, jagged **pit** with a faint updraft shimmer on the hazard tile; a green **start flag** on the entry tile.
- **The wind die:** a chunky pixel **d10** that tumbles in the corner each step. It lands on a number; 1–7 lights the tile you aimed at, 8–10 lights a side tile and fires the **blowing-leaves** animation (translucent leaf glyphs streaking in the gust direction) plus a small "WIND!" toast.
- **Per-tile overlays (reused across scenes):**
  - **Arrow overlay** — one big arrow per tile showing the current/optimal heading; this is the field that bends around the pit.
  - **Value overlay** — a number painted on each tile (V* or Q*), color-coded on a cold-to-warm ramp (deep blue = near −10, bright gold = near +10) so the "basin of safety" around the gold and the "danger crater" around the pit are visible at a glance.
- **Signature animations:** torch-flicker on the explorer; gold sparkle on a win; a stomach-drop fall + screen shake on a pit loss; the value ramp **flooding outward from the gold tile** during the DP sweep, region by region, mirroring how the Pokemon Q-grid filled column by column.

## Scene-by-scene plan

### 0. Title / hook
A dark cave mouth, torchlight, the title **WINDY TREASURE CAVE** dropping in letter by letter, a glittering chest deep in the dark, and leaves gusting across a PRESS START prompt. **Manager framing:** "You will commit to a direction. The wind gets a vote. Let's see if you can still reach the gold." One sentence sets the whole frame — decision-making when you do not fully control the outcome.

### 1. Tutorial - how to play
A guided walk-through (no theory): here is the floor plan, here is **you** (the explorer), here is the **gold** (+10) and the **pit** (−10). Here are your four headings. And here is the catch — press a direction and watch the **wind die** roll: most rolls you go where you aimed, some rolls a gust shoves you sideways. The learner makes two or three throwaway moves just to *see* the die and the leaves. **Takeaway / vocabulary:** tile = where you are, heading = the move you pick, the die = the part you do not control. **Manager framing:** "This is the situation board and the lever. Now learn what the lever actually does."

### 2. Playtest - you run it
The learner plays a full episode: pick headings, the wind die rolls each step, leaves blow, the torch burns down (−1 a step), until they hit gold or fall in the pit. They will almost certainly get gusted into a wall or toward the pit at least once and *feel* it. **Takeaway:** the same heading does not always give the same result — that is the stochastic part. **Manager framing:** "You just *were* the decision-maker. You committed to headings, the world pushed back, and your payoff was the sum of what happened — exactly the position you are in every quarter." This sets up scene 4's "you were a policy."

### 3. Formalization - what makes this an MDP
Reveal the four parts one click at a time, each pinned to the board. **S — state:** your tile, a `(row, col)` pair → 25 tiles, 23 non-terminal. **A — action:** `A = {UP, DOWN, LEFT, RIGHT}`. **P — transition:** `P(s, a) → (s′, r)`, *probabilistic* — the wind die means one `(s, a)` can yield different `s′`. **R — reward:** −1 per step, +10 gold, −10 pit. **Takeaway / notation:** the tuple `⟨S, A, P, R⟩`; the Markov point — the die only cares about your *current* tile and heading, not how you got there. **Manager framing:** "Strip any decision to four parts: the situation now, your levers, the part you don't control, and the payoff. Everything else is detail."

### 4. Policy - a rule from states to actions
Define a **policy π**: a rule that assigns one heading to *every* tile. Make the callback explicit: "when you played in scene 2, your gut *was* a policy." Show **two hand policies** painted as arrow fields on the board: (a) **"always aim at the gold"** — every tile points toward the chest, including the tile below the pit (which therefore marches you straight in); (b) a **"hug the walls"** policy that detours around the hazard. Let the learner eyeball which looks safer. **Takeaway / notation:** `π: S → A`; a policy is a complete playbook, not a single move. **Manager framing:** "A policy is your SOP — the standing rule for *every* situation, not a one-off call. Two playbooks, two very different risk profiles."

### 5. Trajectory
Play one episode under a chosen policy and record the run as a sequence: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)`. Each step lights up on the board and appends to a trajectory ribbon below it; the capital letters flag that every entry is a **random variable** (re-run it and the gusts differ). Click any `Rₜ` to see which die roll produced it. **Takeaway / notation:** a trajectory is one *realized* sample path of `(state, action, reward)` triples. **Manager framing:** "One trajectory is one run of the plan as it actually unfolded — one history out of the many that could have happened."

### 6. Return G_t
Define the **return from step i**: `Gᵢ(τ) = Σⱼ≥ᵢ rⱼ` — the sum of every reward from here to the end. A **"SAMPLE 20 RUNS"** button fires twenty episodes from the *same* start tile under the *same* chosen heading; a little histogram of their returns fans out — same starting move, a *spread* of outcomes, because the wind differs each time. **Takeaway / notation:** `Gᵢ` is a number per trajectory; its **variance** is real and visible. A fast safe path returns ≈ +4 to +7; a gusted run into the pit returns −10-ish. **Manager framing:** "Payoff is the sum over the whole journey, not the next step — and from one decision you get a *distribution* of payoffs, not a guarantee. Manage the spread, not just the average."

### 7. Optimal action-value Q*(s,a)
Pick one tile (say the one **directly below the pit**) and show its **state-icon** (the board with that tile glowing) beside a two-column table: **`action a | Q*(s, a)`**. Reveal `Q*(s, a) = max E[Gᵢ(τ)]` — the best expected return if you take heading `a` now and then play optimally forever after. The numbers tell the story: `UP = −6.66`, `RIGHT = +0.97`, `LEFT = −2.25`, `DOWN = +0.66`; **RIGHT is starred** as the argmax. **Takeaway / notation:** `Q*` ranks levers *from a given situation* by expected payoff; the star is the optimal heading there. **Manager framing:** "Q\* is the scorecard for each lever in this exact situation — and from this tile, aiming straight at the prize is the *worst* option."

### 8. Bellman optimality equation
Show `Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]` and unpack it on the board: from the below-the-pit tile, aiming UP yields 70% → land on the pit (`R = −10`, done), 15% → gust left, 15% → gust right, each landing on a tile whose own best-future value you read off the map. Average them and you recover the −6.66 from scene 7, **by hand**. **Takeaway / notation:** every cell's value equals "expected immediate reward + best value of wherever you land next" — a self-consistency condition tying neighboring tiles together. **Manager framing:** "Today's right call already prices in the best you can do tomorrow from wherever today lands you. The future is folded into the present number."

### 9. Dynamic programming - fill Q*
Because we *wrote down* P, we can solve it: repeatedly apply the Bellman backup to every tile and watch the value overlay converge. Buttons: **STEP** (one sweep) and **RUN ALL**. The warm color **floods outward from the gold tile**; a cold **danger crater** sets around the pit; after a handful of sweeps the arrow field locks in — and it **visibly bends around the pit** (the four pit-adjacent tiles each pointing a different safe way). On this grid it converges cleanly. **Takeaway / notation:** iterate Bellman to a fixed point → exact `Q*` and the optimal policy `π* = argmax_a Q*`. **Manager framing:** "If you have a perfect model of the world, you can compute the optimal playbook for every situation up front — and the playbook is *not* uniform, it bends around your hazards."

### 10. Why DP does not scale
Two killers, each pinned to a stat card. **(1) You rarely KNOW P.** The sweep only worked because *we* wrote the wind table. A real cave (a real market, a real supply chain) never hands you the gust probabilities — you only ever *sample* what happens. **(2) The state space explodes.** This cave is 25 tiles; a 100x100 cave with fog, items, and a moving hazard is astronomically larger — a sweep over every `(tile, heading)` is hopeless. **Takeaway:** DP needs both a known model and a tiny world; reality usually denies both. **Manager framing:** "The 'compute it all up front' dream dies on two rocks: you don't have the odds, and the real board is far too big to enumerate."

### 11. SARSA - learn Q* by playing
Derive the fix from Bellman by swapping the *expectation* for **one sample**: after each `(s, a, r, s′, a′)`, nudge the estimate `q[s, a] ← q[s, a] + α · ( r + q[s′, a′] − q[s, a] )`. Introduce **ε** for exploration — most steps take the current-best heading, occasionally try an unproven one to keep learning. Then a live demo: the explorer plays thousands of episodes, the value overlay and arrows **fill in from experience alone** (never reading P), converging to the DP oracle from scene 9 — the same bend appears around the pit. **Takeaway / notation:** SARSA learns `Q*` model-free, touching only tiles the explorer actually visits. **Manager framing:** "Run many small, cheap experiments; after each, adjust your estimate of each lever's worth. Sometimes deliberately try the unproven option to learn. Over time the playbook converges — *without* anyone ever handing you the odds."

### 12. Recap
One card per concept, each with its cave icon. **MDP** — the four-part frame (tiles, headings, the wind die, the −1/+10/−10 rewards). **Policy** — a heading for every tile; your SOP. **Return** — the summed payoff over the whole run, with real variance. **Q\*** — the best expected return per lever per situation; its argmax is the optimal policy. **DP** — fill Q\* by Bellman backups *if* you know P. **SARSA** — learn Q\* by playing when you do not. **Manager framing:** the closing line — "The safe heading depends on where you stand. Good strategy is a *map* of decisions, not a single bet."

## Numbers (concrete, small)
**Board.** 5x5 tiles, `row` 0 (top) to 4 (bottom), `col` 0 (left) to 4 (right). **Gold** at `(0, 4)` = +10 terminal. **Pit** at `(2, 2)` = −10 terminal. **Start** at `(4, 0)` (far corner). Step reward −1, γ = 1.

**Actions.** `{UP, DOWN, LEFT, RIGHT}` = the attempted heading.

**Transitions (the wind die, a d10).** With **p = 0.7** you move one tile in your chosen heading; with **p = 0.15** you are shoved one tile to the *left-perpendicular* of that heading, and **p = 0.15** to the *right-perpendicular*. A move into a wall keeps you in place (still −1). Example from `(3, 2)` (directly below the pit) aiming **UP**: 0.7 → `(2, 2)` = **pit, −10, done**; 0.15 → `(3, 1)`; 0.15 → `(3, 3)`.

**Value iteration is hand-checkable.** With these clean tenths it converges to a stable arrow field, and the optimal policy is:

```
 →  →  →  →  G        V*:   4.1   5.8   7.5   9.3  GOLD
 ↑  ↑  ↑  ↑  ↑              3.0   4.4   6.1   7.8   9.3
 ↑  ↑  X  →  ↑              1.5   1.0   PIT   6.1   7.5
 ↑  →  →  →  ↑              0.0  -0.2   1.0   4.4   5.8
 →  →  →  →  ↑             -1.2   0.0   1.5   3.0   4.1
```

The arrow field **bends around the pit** — the four tiles touching it (`(1,2)`, `(3,2)`, `(2,1)`, `(2,3)`) each point a *different* safe way, never inward.

**Three Q\* intuitions:**
1. **Below the pit, `(3,2)`** — `Q*(UP) = −6.66` vs `Q*(RIGHT) = +0.97`. Aiming straight at where the gold lives is the *worst* option: 70% of UP-steps drop you in the pit. The optimal heading is *sideways*. This single cell carries the whole twist.
2. **Far corner, `(0,2)` (top row, safe)** — `Q*(RIGHT) = +7.52` is the clear argmax; with no pit nearby, the best lever is simply "head straight for the gold."
3. **Pit's left and right neighbors disagree** — `(2,1)` aims **UP** (Q ≈ +0.97), but `(2,3)` aims **RIGHT** (Q ≈ +6.10). Same distance to the pit, opposite safe headings, because the gold sits on the right side of the cave. The optimal lever is genuinely *local*.

## Manager translation of the RL ideas
- **State = the situation now** (which tile / where the project stands).
- **Action = the lever** (the heading you commit to this step).
- **Policy = the playbook / SOP** (a standing rule for *every* situation, not one call).
- **Return = payoff summed over time** (total torch-cost plus the prize, not the next step alone).
- **Stochastic transition = the part you do not control** (the wind die — markets, suppliers, weather).
- **Exploration (ε) = try the unproven option to learn** (occasionally take the heading you are unsure about, to map its value).
- **Model-free learning (SARSA) = learn the playbook from experience / many small experiments** (you never get handed the gust odds; you infer each lever's worth by running it).
- **The DP caveat = "optimize it all up front" only works when you both know the odds and the world is tiny** — almost never true off the whiteboard.
- **The headline:** the optimal lever is **state-dependent**. Steer around your hazards even when it is the longer road; sprint for the payoff only where the ground is safe. Strategy is a *map of decisions*, not a single bet.

## Risks / open questions
- **Four actions vs Pokemon's three.** A compass arrow field is busier than three move-columns; the bend around the pit must read as *signal*, not clutter. Mitigation: trim to **3 actions (UP, DOWN, RIGHT)** — the gold is up-and-right of the start, so DOWN/LEFT are rarely optimal and the field stays legible — or pre-highlight only the four pit-adjacent tiles in scenes 7–9.
- **Wall-bump semantics.** "Hit a wall → stay put, still −1" must be taught in scene 1 or the edge-tile values look wrong to a sharp learner. A one-line tooltip on edge tiles fixes it.
- **Negative-value tiles.** A couple of bottom-left tiles sit slightly below 0 (e.g. `−1.2` at the start corner — it is genuinely far from the gold). Fine pedagogically (shows torch-cost), but the color ramp must not read those as "pit-level danger." Use a distinct hue for terminal-pit vs merely-low.
- **Gust direction convention.** "Left/right perpendicular to your heading" needs an unambiguous on-screen depiction (the leaves must clearly streak the way you were *shoved*), or learners will mis-predict the die outcomes.
- **Does the four-neighbor twist out-teach Pokemon's column twist?** The cave's "four adjacent tiles, four different safe headings" is arguably *more* vivid than evolution-by-column — worth user-testing which framing managers internalize faster.

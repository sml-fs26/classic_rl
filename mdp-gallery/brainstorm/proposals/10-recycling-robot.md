# Recycling Robot

> A cleaning robot decides when to keep working and when to crawl back to the charger — the textbook RL toy, redrawn as a battery gauge.

## Why this lands with managers

Every manager has run this exact trade-off without naming it: a resource is producing value *right now* (a sales rep on the road, a machine mid-run, a consultant on a billable engagement), but pushing it too hard risks a breakdown that costs far more than the upside you were chasing. The recycling robot makes that tension physical and tiny — a single **battery gauge** with five rungs, three obvious levers (keep working, idle, go recharge), and a drain die you watch roll every step. The lesson is one a manager already half-knows but rarely sees proven: **the right call is not a fixed rule, it flips as the situation changes** — push hard while you have headroom, pull back to protect the asset before you strand it. There is no code, no jargon: it is a battery bar, three buttons, and a die, and the optimal button changes as the bar empties.

## The MDP at a glance

- **State (S):** the situation right now = the robot's **battery level**, a 5-rung gauge `s ∈ {empty, low, mid, high, full}`. That is **5 states** — a single-column Q-table, one row per rung, the whole thing on one screen with room to spare. `empty` is the terminal "stranded" state, leaving **4 playable rungs** — small enough to backup every cell by hand. (The canonical Sutton–Barto version is just `{low, high}` = 2 rungs; stretching to 5 gives a properly drawable, gradient-rich table while staying hand-computable.)
- **Actions (A):** three levers, one per step. **SEARCH** (go collect trash — pays well, drains the battery, small chance of stranding), **WAIT** (idle on the spot — a tiny crumb of payoff, no drain, no risk), **RECHARGE** (crawl back to the dock — pays nothing now, returns the battery to full).
- **Transition (P) — the visible dice:** the moment the robot SEARCHes, a **battery-drain die** rolls on screen — a chunky popup die that lands on **−1 rung** most of the time (probability 0.7) or **−2 rungs** on a bad roll (0.3). The rung pips on the gauge drop to match, with a little spark animation. WAIT and RECHARGE are deterministic and show no die — WAIT holds the gauge, RECHARGE snaps it up to full. Crucially, **from `low` either drain outcome lands on `empty`** — so searching on a near-dead battery is the gamble that can strand you. Probabilities are printed right on the SEARCH lever so the randomness is transparent.
- **Reward (R):** the trash collected on a successful SEARCH = **+3 at full/high battery**, **+2 at mid/low** (the riskier low reach hauls less). **WAIT pays +1** (a token: the robot tidied its own dock). **RECHARGE pays 0** (pure investment in future capacity). The penalty is the sting: **stranding at `empty` costs −10** (a technician has to drive out and rescue the robot). Returns over a shift are bounded and hand-summable.
- **Terminal:** an episode ends when the robot **strands at `empty`** (absorbing, the −10 already paid) **or** when the **work shift of `N` steps runs out** (we use `N = 8`). Both give bounded returns; with the shift as the horizon, no discount factor is needed (`γ = 1`).
- **The twist (state-dependent optimal action) — the "evolution" analogue:** the best lever **marches up the gauge**. At **full and high** battery, SEARCH dominates — you have the headroom to take the high-paying reach and a bad drain only knocks you to mid. At **mid and low**, the expected cost of stranding flips the answer to **RECHARGE** — protect the asset, refill, come back swinging. The robot is identical at every rung; only the battery differs, and the right answer reverses. And there is an endgame wrinkle managers will recognise: **on the very last step of the shift**, with no future left to protect, the safe crumb of WAIT beats both — so all three levers are genuinely optimal somewhere.
- **State-space size:** 5 rungs (4 playable). It fits on one screen as a single tall column, value iteration converges in **2 sweeps** (the policy is stable from the second backup; only the final-step column differs), and an instructor can check any cell by hand in seconds.

## Visual language

The recurring **state-icon** is a **little robot with a 5-segment battery gauge** rising beside it — a vertical stack of five pips, lit from the bottom: `empty` (no pips, robot slumped and greyed, an "SOS" bubble), `low` (one red pip, robot leaning), `mid` (two amber pips), `high` (three green pips), `full` (four/all green pips, robot upright and bright). This same robot-plus-gauge appears in every scene so the learner builds one mental picture: *how much charge is in the tank right now*. Because the state is one variable, the Q-table is a **single tall column** — one row per rung, three lever-cells per row — which makes the "optimal-lever overlay" read as a clean stripe down the gauge: green SEARCH at the top, blue RECHARGE at the bottom, with the seam between high and mid as the visual punchline.

The three levers use the editorial colour-blind-safe categorical palette: **SEARCH** in green (`#009E73`), **WAIT** in amber (`#E6A817`), **RECHARGE** in blue (`#0072B2`). The signature animation is the **drain die**: tap SEARCH and a die tumbles into a small popup, lands on −1 or −2, and the corresponding battery pips drain downward with a spark; a `+3`/`+2` trash counter flashes in green as a bag of recyclables fills. A bad roll that hits `empty` triggers the strand animation — the robot powers down, the gauge greys, a red `−10` "RESCUE" tag drops with a muted alarm. RECHARGE plays a dock-and-refill sweep (pips fill bottom-to-top in blue, no payoff). The running **return** tape sits beneath the robot in mono type; the shift clock (`N` steps remaining) ticks down in a corner. Light mode (cream `#f9f7f1`, ink `#1a1a1a`, hairline cards) is the lecture default; a warm-dark "retro" mode is the study companion. Math lives in bordered `.formula-block` KaTeX cards so the notation reads as a distinct "control-panel readout."

## Scene-by-scene plan

### 0. Title / hook
Full-bleed title card: the little robot trundling across a floor strewn with recyclables, its battery gauge ticking down pip by pip, the tagline *"Keep working, or crawl back to the charger?"* A single **START** prompt. **Manager framing:** "You manage a resource that earns while it runs — but runs down. Today you'll see why deciding *when to push and when to protect it* is a sequence of choices under uncertainty, not a one-time setting." One click drops the robot onto the empty board with its gauge full, teasing the decisions to come. No theory yet — just the stakes.

### 1. Tutorial - how to play
A guided panel walks the controls with zero math: here is your **robot and its battery gauge** (the situation), here are the **three levers** — SEARCH, WAIT, RECHARGE — and here is the **drain die** that decides how much charge a SEARCH costs. The learner is shown one slow demo step: tap SEARCH, watch the die land on −1, one battery pip drains, a `+3` trash bag fills. Then a demo RECHARGE snaps the gauge back to full. **Takeaway/notation:** vocabulary only — *situation* (the gauge), *lever* (the button), *the die* (the drain you don't control), *the shift* (how many steps remain). **Manager framing:** "This is your repeated decision and the part you don't control — drawn as one gauge you can read at a glance."

### 2. Playtest - you run it
The learner *is* the robot's operator. Starting from a full battery with an 8-step shift, they pick a lever each step, roll the drain die on every SEARCH, and feel the outcome — sometimes a lucky −1 lets them search again, sometimes a −2 plunges them toward danger, and a greedy SEARCH on a `low` battery strands the robot for a brutal −10. They play to the end of the shift and see their total trash collected. **Takeaway:** the stochastic outcome is *felt*, not described — two identical openings can end with a full bag or a stranded robot. **Manager framing:** "You just ran the asset by gut. Notice you were already following *some* rule — push while full, recharge when it gets scary? Hold that thought."

### 3. Formalization - what makes this an MDP
The four parts slide in over the gauge the learner just played. **State** `s ∈ {empty, low, mid, high, full}`, shown as the robot-and-gauge icon. **Action** `a ∈ {SEARCH, WAIT, RECHARGE}`. **Transition** `P(s', r | s, a)`: the drain die — printed probabilities on the SEARCH lever — sends you to the next rung and pays you `r`; WAIT and RECHARGE move you deterministically. **Reward** `r`: trash collected (+3 high/full, +2 mid/low for SEARCH), +1 for WAIT, 0 for RECHARGE, and −10 on stranding. **Takeaway/notation:** the 4-tuple `(S, A, P, R)`. **Manager framing:** "Your gut playthrough was an MDP all along: the *situation* (charge), the *lever*, the *part you don't control* (the drain), and the *payoff*."

### 4. Policy - a rule from states to actions
A **policy** `π: S → A` is a complete playbook — one lever pre-assigned to *every* rung of the gauge. The scene paints two hand-policies down the single-column gauge so the learner sees a policy as a coloured stripe: **(a) "Always SEARCH"** — the whole gauge green, the greedy workhorse that earns big but strands often; **(b) a cautious "recharge below half"** — blue RECHARGE at low and mid, green SEARCH at high and full. **Takeaway/notation:** `π(s)` is *the lever you pull at charge level s*; "when you played in scene 2, you *were* a policy — you just hadn't written it down." **Manager framing:** "A policy is your SOP — the rule your whole operation could follow without you in the room: *at this battery level, do this*. The rest of this is about finding the *best* one."

### 5. Trajectory
One full shift is replayed as a tape of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …, S_T)`, capital letters because every entry was a roll of the die before it happened. The robot-and-gauge icon marches left along a rollout tape — charge level, lever chosen, trash collected, next charge level — until the shift ends (or the robot strands). **Takeaway/notation:** a run is a *sequence*, `τ`; the same policy from a full battery yields a *different* `τ` each time the dice fall differently. **Manager framing:** "One shift of operating, written down step by step — and it would read differently if the drain die had rolled another way."

### 6. Return G_t
The return is the payoff summed from a point onward: `G_i(τ) = Σ_{j ≥ i} r_j` — total trash collected from step `i` to the end of the shift, minus any rescue cost. The scene fixes one situation and one chosen lever — **start at `mid` battery, force SEARCH** — runs it many times, and stacks the returns into a **histogram**. The shape is the lesson: a cluster near **+14/+15** (good drains, the robot survives and finishes the shift) *and* a fat, scary spike at **−8** about 30% of the time (a −2 drain strands it). **Takeaway/notation:** `G_i` is a *random* number — show its spread, not just its average; the average (≈ 7.7) hides a one-in-three disaster. **Manager framing:** "Don't judge a lever by its average payoff. SEARCH-from-mid *averages* fine, but a third of the time it strands the asset. Variance is the risk you're carrying."

### 7. Optimal action-value Q*(s,a)
`Q*(s, a) = max_π E[G_i(τ)]` — the true long-run value of pulling lever `a` at charge level `s`, *assuming you operate smart afterward*. The scene shows the robot-and-gauge icon for one rung beside a clean **two-column table (action a | Q\*(s, a))**, the best row **starred**. At `high`: **SEARCH 15.44 ★**, WAIT 14.89, RECHARGE 14.54 — a close, real call. Flip to `mid`: SEARCH 7.71, WAIT 13.44, **RECHARGE 14.54 ★** — the star *moves to the safe lever*. At `low`: SEARCH **−8.00**, WAIT 13.44, **RECHARGE 14.54 ★** — searching is honestly negative. **Takeaway/notation:** `Q*` ranks the levers at *this* charge; argmax is the optimal lever there. **Manager framing:** "The honest long-run value of each lever, played out to the end of the shift — and the best lever is not the same at every battery level."

### 8. Bellman optimality equation
The recursive definition appears as a formula card: `Q*(s, a) = E[ R + max_{a'} Q*(S', a') ]`. The scene reads it in plain English over the gauge: *the value of a lever now = the payoff it pays this step, plus the value of whatever charge level it leaves you in next, assuming you again pull the best lever there.* A worked one-step backup on `low` makes the stranding shadow concrete: SEARCH from `low` collects `+2`, then **both** drain outcomes land on `empty` for `−10`, so `Q = 2 + 0.7·(−10) + 0.3·(−10) = −8.00`. **Takeaway/notation:** today's value is *defined in terms of* tomorrow's. **Manager framing:** "Smart operating is recursive: the right move now depends on the value of the situation it lands you in next."

### 9. Dynamic programming - fill Q*
Because the drain probabilities are *known here*, we can compute `Q*` exactly by sweeping the Bellman backup. The single-column Q-table fills **bottom-up in time**: the scene starts at the **last step of the shift** (no future — pure one-step payoffs, where the safe `+1` WAIT wins at low/mid), then backs up one step at a time, reusing the answers it just locked in. After just **2 sweeps** the policy stabilises: the optimal-lever overlay paints the gauge **green at the top, blue at the bottom**, and the seam between `high` and `mid` snaps into place — the whole "march up the gauge" surface drawn in two passes. **Takeaway/notation:** known `P` ⇒ exact `Q*` by backups to a fixed point. **Manager framing:** "If you had a perfect model of how the battery drains, you could compute the entire optimal playbook for every charge level — exactly, no guessing. Watch the rule draw itself: push at the top, protect at the bottom."

### 10. Why DP does not scale
Two reasons, on a two-panel card. **(a) You rarely know `P`.** The neat printed drain probabilities are a fiction — real wear depends on terrain, load, temperature, battery age; nobody hands you the die. **(b) The state space explodes.** This toy has 5 rungs; a real fleet has the charge of *every* robot × its location × the trash map × maintenance state × the other robots — billions of situations, impossible to enumerate or sweep. **Takeaway:** DP is the *ideal*, not the *method*. **Manager framing:** "Perfect-model operating is a fantasy: you never truly know how the asset degrades, and the real problem is far too big to compute cell by cell. So how does anyone actually find the playbook?"

### 11. SARSA - learn Q* by playing
We *learn* the table from experience instead of computing it. Derive the update from Bellman by replacing the expectation with **one observed sample**: after pulling lever `a` at charge `s`, seeing payoff `r`, landing at `s'` and choosing next lever `a'`, nudge `Q(s,a)` toward `r + Q(s', a')`. Add **ε** — occasionally try an unproven lever to keep learning, instead of always exploiting today's best guess (here ε is what lets the robot *discover* that SEARCH-from-low is a trap, by occasionally — and ruefully — trying it). The scene runs live: the robot works shift after shift with *no* drain model, the single-column Q-table fills in, and its green-top / blue-bottom stripe **converges to the DP oracle** from scene 9, tracked by a convergence bar. **Takeaway/notation:** model-free learning — trial, outcome, adjust; `ε` is the explore/exploit dial. **Manager framing:** "Run many small operating experiments, learn from what actually happened to the battery, and the playbook emerges on its own — landing on the same answer the perfect-model calculation gave, but without ever needing the model."

### 12. Recap
Six cards, one concept each, in the robot-and-gauge visual language. **MDP** — the situation (charge), the lever, the part you don't control (the drain), the payoff. **Policy** — your operating SOP, a lever for every charge level. **Return `G_t`** — payoff summed over the shift, and its risk (that −8 tail). **Q\*** — the honest long-run value of each lever, the star that moves up the gauge. **DP** — the exact playbook *if* you knew the drain. **SARSA** — learn the playbook from experience when you don't. Closing line: *"You've learned the bones of managing an asset under uncertainty — and of reinforcement learning."* **Manager framing:** the boardroom-ready summary; the bridge from a robot's battery to any push-it-or-protect-it decision made over time.

## Numbers (concrete, small)

**State set.** `s ∈ {empty, low, mid, high, full}` → 5 rungs. Terminal: `empty` (stranded). 4 playable rungs. Shift horizon `N = 8`, discount `γ = 1` (finite horizon, so returns are bounded without it).

**Actions, transitions, rewards.**

| Lever | Reward this step | Next charge (the visible dice) |
|---|---|---|
| **SEARCH** | +3 at full/high, +2 at mid/low | drain die: **−1 rung w.p. 0.70**, **−2 rungs w.p. 0.30** (clamped at `empty` → strand, **−10**) |
| **WAIT** | +1 (idle crumb) | stays on the same rung, no die |
| **RECHARGE** | 0 | jumps to **full**, no die |

**Hand-computable backup (last step of the shift, all futures = 0).** Pure one-step payoffs:
- `full`/`high`: SEARCH = **+3 ★**, WAIT = +1, RECHARGE = 0.
- `mid`: SEARCH = +2 (no strand from mid this step, future 0) but ties low rungs — here SEARCH = +2, **WAIT = +1**, RECHARGE = 0 → SEARCH actually still wins the *single* step at mid; the flip to RECHARGE appears once the *future* matters (see next backup).
- `low`: SEARCH = `2 + (−10) = −8`, **WAIT = +1 ★**, RECHARGE = 0 → on the final step, the safe crumb wins.

**Second backup at `low` (futures now `V₁`: low 1, mid 1, high 3, full 3).** This is where protecting the asset takes over:
- SEARCH = `2 + 0.7·(−10) + 0.3·(−10) = −8.00`
- WAIT = `1 + V₁(low) = 1 + 1 = 2.00`
- RECHARGE = `0 + V₁(full) = 0 + 3 = 3.00 ★` — recharging to bank a high-value future now beats idling.

**The converged optimal policy** (stable after 2 sweeps; rows = rungs, the single Q-column the viz renders):

```
rung    SEARCH    WAIT   RECHARGE    best
full    16.45    15.54    14.54      SEARCH   ★
high    15.44    14.89    14.54      SEARCH   ★   (the closest call)
mid      7.71    13.44    14.54      RECHARGE ★
low     -8.00    13.44    14.54      RECHARGE ★
empty    —  terminal (stranded), value 0; entering it costs -10
```

Lever usage across the 4 rungs × 8 shift-steps (32 cells): SEARCH 16, RECHARGE 14, WAIT 2 — **all three levers are genuinely optimal somewhere**, and every winner beats the runner-up by a real margin. The tightest call sits at `high` (SEARCH 15.44 vs WAIT 14.89, gap **0.55**) — exactly the seam between "push" and "protect," which is where the decision is hardest and DP earns its keep.

**Three `Q*` intuitions a manager can feel:**
1. **`high` → SEARCH** (15.44 / 14.89 / 14.54). Three pips of headroom: take the high-paying reach. Even a bad −2 drain only drops you to mid, where you can safely recharge. *Push while you have buffer.*
2. **`mid` → RECHARGE** (7.71 / 13.44 / **14.54**). Two pips left: a −2 drain would strand you. The expected −10 swamps the +2 haul — bank the future by refilling now. *Protect the asset before it's at risk, not after.*
3. **`low` → RECHARGE** (**−8.00** / 13.44 / 14.54). One pip: *any* drain strands you. SEARCH here has a genuinely negative value; the only sane moves are to recharge (best) or, on the very last step, grab the safe +1. *Never gamble the asset for a small reward.*

## Manager translation of the RL ideas

- **State = the situation now** → how much charge is in the tank (one battery gauge).
- **Action = the lever** → SEARCH (work), WAIT (idle), or RECHARGE (protect) this step.
- **Policy = the playbook / SOP** → a pre-set lever for every charge level, the rule your operation follows without you: *at this battery, do this.*
- **Return = payoff summed over time** → total trash collected over the whole shift, net of rescue costs — not just this step's haul.
- **Stochastic transition = the part you don't control** → the drain die; you choose to search, the world decides how much battery it costs.
- **Exploration (ε) = try the unproven option to learn** → occasionally test a lever you're unsure about (even the risky SEARCH-from-low) to discover its true value, instead of always banking on today's favourite.
- **Q\* = the honest long-run value of a lever in a situation** → assuming you keep operating smart afterward; the star that climbs the gauge — RECHARGE at the bottom, SEARCH at the top — *is* the insight.
- **DP caveat = perfect-model operating is a fantasy** → you never truly know how the asset degrades (reason a), and a real fleet's situations are far too many to enumerate (reason b).
- **Model-free learning (SARSA) = learn the playbook from experience** → run many shifts, adjust from what actually happened to the battery, and converge on the optimal SOP without ever owning a wear model.

## Risks / open questions

- **The marginal cell is `high`, not `mid` (a correction to the seed).** The seed sketch guessed "mid is marginal," but the physics of a single absorbing penalty terminal makes the value function monotonic, so the SEARCH→RECHARGE crossover lands cleanly *between* `high` and `mid`, with `mid` a comfortable RECHARGE. The genuinely close call is therefore at `high` (SEARCH 15.44 vs WAIT 14.89 vs RECHARGE 14.54, gap 0.55). This is arguably *richer* — the seam is the marginal cell — but the build's precompute must **assert that argmax is stable** at `high` and not a floating-point coin-flip: pin the model, snapshot the policy, and verify all three levers stay optimal somewhere.
- **From `low`, SEARCH always strands.** With a 1-rung floor above `empty`, both drain outcomes (−1 and −2) hit `empty` from `low`, so SEARCH-from-low is a *certain* −8, not a gamble. This is a clean, vivid lesson ("never gamble the asset for a crumb") and makes the Bellman backup trivially hand-checkable — but it means the *drama* of the dice lives at `mid` (where SEARCH is a real 70/30 gamble: survive to low, or a −2 strands you). Scene 6's histogram should therefore start from **`mid`** to show the bimodal +15 / −8 spread; a caption should note that low is the "certain-loss" cell, not a coin-flip.
- **RECHARGE jumps straight to `full`.** Modelling RECHARGE as "return to dock = full charge" (rather than a gradual +1 rung) is what gives the value function a clean single threshold with **no ties** — a gradual +1 recharge produces an exact, fragile tie at `high`. The full-jump is also more physically intuitive (you dock, it charges). The trade-off: it slightly understates the real cost of recharging from a near-empty battery (in reality, more steps to fill). Worth a one-line caption; recommend keeping the full-jump for clean numbers.
- **WAIT's niche is only the last step.** WAIT is optimal in just 2 of 32 cells (low/mid on the final shift step), where there is no future to protect and a safe +1 beats a 0-payoff recharge. This is a nice "endgame" wrinkle that justifies the third lever and mirrors a real manager's instinct ("on the last day, stop investing, just bank what's safe") — but it is subtle. The DP fill scene (#9) should call it out explicitly as the *one* column that differs, or a reviewer may wonder why WAIT exists at all.
- **`γ = 1` vs a discount slider.** The 8-step shift makes returns bounded without discounting, keeping the arithmetic clean (Pokémon used a `γ` "patience" knob; here the *shift length itself* is the horizon). A discount slider could be added as an optional "how much do you value future charge" knob, but it muddies the hand-computable numbers — recommend keeping `γ = 1` and letting the shift clock do the work. Optionally, a short-shift vs long-shift toggle (`N = 4` vs `N = 8`) is a cheap way to show the horizon shaping the endgame column.
- **Asset/skin choice.** A floor-cleaning robot reads instantly and is the literal textbook example, which is a plus for credibility with a technical lecturer; for a pure-management audience the same gauge could re-skin as a delivery EV, a field rep's "energy," or a machine's maintenance meter. The robot is recommended (it makes "stranding" concrete and is faithful to Sutton–Barto), but confirm the skin with the lecturer before building.

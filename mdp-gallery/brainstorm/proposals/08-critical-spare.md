# Critical Spare

> One aging machine, one spare-parts bin — run it down, pre-order a part, or swap it now?

## Why this lands with managers
Every operations leader has lived this exact decision: a critical asset is getting old, cash is tight, and the spare-parts budget is a perennial fight. Hold too few spares and a failure idles the line for days; hold too many and you bleed working capital on shelves that may never move. *Critical Spare* turns that boardroom tension — inventory cost vs. downtime risk, "run it to failure" vs. "replace on a schedule" — into a tiny game whose entire optimal playbook fits on one screen. The lesson lands because the right answer is **not** a slogan ("always pre-stock," "never over-order"); it visibly *changes with the situation*, which is exactly the intuition reliability and maintenance managers are paid to have.

## The MDP at a glance
- **State (S):** Two readings any plant manager already tracks. **Machine health** ∈ {HEALTHY, AGING, FAILING} (a condition-monitoring gauge) × **spares in the bin** ∈ {0, 1, 2} (an inventory count). That is **3 × 3 = 9 states** — the whole world fits in a 3×3 grid, and each cell carries up to 3 action-values, so the *entire* Q-table is one compact board.
- **Actions (A):** Three levers. **RUN** — keep producing this turn (earn revenue, spend nothing, but risk a breakdown). **ORDER** — buy one spare into the bin (pay an order cost + ongoing holding cost; buys you protection, earns nothing this turn). **REPLACE NOW** — consume a spare to refurbish the machine back to HEALTHY (a *planned* swap; only available when a spare is on hand).
- **Transition (P) — the visible dice:** RUN spins an on-screen **failure die** whose **red slice grows as health degrades**: 0% red when HEALTHY, ~30% when AGING, ~70% when FAILING. If the die lands red **with an empty bin**, a "WAITING FOR PART" downtime timer animates and a heavy penalty is booked. If it lands red **with a spare in the bin**, the spare is auto-consumed in a rushed emergency swap and the machine springs back to HEALTHY — protected, but at a worse cost than a planned REPLACE. On a non-failing RUN the machine *ages one notch* on a coin flip (HEALTHY→AGING, AGING→FAILING), shown as the gauge ticking down. ORDER and REPLACE are deterministic.
- **Reward (R):** Per turn, single-digit and additive. **+3** revenue for a surviving RUN turn; **−1 holding** per spare sitting in the bin (charged every turn); **−2** to ORDER; **−8 downtime** when RUN fails with an empty bin; **−3 emergency** when RUN fails with a spare on hand (rushed swap). REPLACE costs nothing beyond consuming the spare.
- **Terminal:** A fixed 12-turn operating horizon (the quarter), after which the cycle resets. A failure with no spare is a heavy hit but **recoverable** — the timer runs out, the machine comes back FAILING, and play continues. No "game over," just a bad quarter.
- **The twist (state-dependent optimal action):** This MDP's "evolution." The best lever flips along **two** dimensions. Down the health axis: RUN while HEALTHY, but stop running as you degrade. Across the spares axis at the *same* health: with an **empty** bin an AGING/FAILING machine says **ORDER** (go get protection before the risk peaks); with a **spare already in hand** the same AGING/FAILING machine says **REPLACE NOW** (cash in the protection — a planned swap beats absorbing a 70% failure). Same gauge reading, opposite call, decided entirely by the bin.
- **State-space size:** 9 states. A 3×3 grid (health as rows, spares as columns) renders every state, every action-value, and the greedy arrow simultaneously — the most compact board in the slate.

## Visual language
- **The recurring state-icon:** a small factory-machine sprite whose colour and posture encode health — green & humming (HEALTHY), amber with a rattle/steam wisp (AGING), red with sparks (FAILING) — sitting above a **3-slot spares bin** drawn as up to two boxed gears (empty slots are dashed outlines). This single icon (machine + bin) appears in every scene so the learner builds one mental picture, exactly as the Pokémon sprites-under-HP-bars did.
- **The failure die:** a large pie/d-style die with a growing **red "FAIL" slice** and green "RUNS FINE" slice; the red wedge visibly enlarges as the machine ages. On a roll it spins and lands with a click.
- **The board:** a 3×3 **maintenance grid**, health labelling the rows (green/amber/red bands), spares labelling the columns (0/1/2). Each cell shows the state-icon in miniature plus, when relevant, a 3-row action chip stack (RUN / ORDER / REPLACE) with their values; the greedy action is highlighted with a glowing border and an arrow.
- **Colour coding:** green = revenue/uptime/healthy; red = downtime/failure/penalty; blue = inventory/holding/order; gold = a planned REPLACE (the "use your protection" move). Money flows animate as green coins (in) or red coins (out).
- **Signature animations:** the "WAITING FOR PART" downtime timer (a red hourglass draining while the machine sits dark), the **gear sliding from bin into machine** on REPLACE (machine flashes green, one bin slot empties), and a delivery-truck dropping a gear into the bin on ORDER.

## Scene-by-scene plan

### 0. Title / hook
A lone factory machine hums on a dark shop floor, its health gauge slowly amber-ing while a spares bin glints beside it; the title **CRITICAL SPARE** and a "PRESS START" prompt pulse. *Manager framing:* "Your most important machine is getting old. Cash is tight. When do you buy the spare — and when do you use it?" One click starts the shift. The hook frames the whole deck as a familiar capital-and-uptime trade-off, not a CS lecture.

### 1. Tutorial - how to play
Three labelled panels introduce the vocabulary with zero theory: the **health gauge** (HEALTHY → AGING → FAILING), the **spares bin** (0/1/2), and the **turn counter** (12 turns = one quarter). The three lever buttons are shown with one-line plain-English captions ("RUN = produce now, risk a breakdown"; "ORDER = stock a spare"; "REPLACE = swap in a fresh part"). Critically, the tutorial spells out the one rule the twist depends on: *if the machine breaks and you have a spare, you survive — it auto-swaps you back to HEALTHY, just at emergency cost; if you have none, the line goes down.* No decisions yet; the learner just learns the dashboard, the way the Pokémon tutorial taught HP bars before any battle.

### 2. Playtest - you run it
The learner takes the wheel for a 12-turn shift and clicks levers themselves. They feel the core tension first-hand: RUN earns green coins but the failure die's red slice keeps growing; the first time they RUN on a FAILING machine with an empty bin, the red wedge wins, the downtime timer drains, and −8 stings. They learn viscerally that **the outcome of RUN is partly out of their hands** — they pull the lever, the world rolls the die. *Manager framing:* "You just *were* the decision-maker. Notice you couldn't control the breakdown — only the odds you walked into."

### 3. Formalization - what makes this an MDP
The shift the learner just played is replayed and labelled with the four MDP parts, each glossed in business terms first. **State s** = "the situation now" = (health, spares). **Action a** = "the lever" = RUN / ORDER / REPLACE. **Transition P(s′, r | s, a)** = "the part you don't control" = the failure die + the aging coin flip, drawn explicitly as branching arrows out of a cell. **Reward r** = "this turn's cash" = the +3 / −1 / −2 / −3 / −8 numbers. Takeaway: an MDP is just *situation → lever → (partly random) next situation + payoff*, the formal skeleton of any operational decision.

### 4. Policy - a rule from states to actions
The 3×3 grid appears and the learner is told: a **policy π** is "your standing operating procedure" — a rule that, for *every* situation, names the lever. "When you played, you *were* a policy, even if an inconsistent one." Two hand-policies are illustrated on the grid as arrow overlays: **"Always RUN"** (run-to-failure — every cell says RUN) and **"Always keep the bin full"** (ORDER whenever spares < 2). *Manager framing:* these are two real maintenance doctrines you've heard defended in meetings; the grid lets you *see* an entire doctrine at a glance. Neither is obviously best — which sets up the search for the optimal one.

### 5. Trajectory
Following one policy from a start state produces a **rollout tape**: τ = (S₁, A₁, R₁, S₂, A₂, R₂, …), laid out as a filmstrip of state-icons, lever chips, and coin amounts. Capital letters are stressed: each Sᵢ, Aᵢ, Rᵢ is a **random variable** because the dice make the same policy produce a different tape each shift. *Manager framing:* "Run the same playbook twice and you get two different quarters — that's the randomness, not bad management." The tape is the unit of experience SARSA will later learn from.

### 6. Return G_t
The tape's coins are summed from a point onward: **Gᵢ(τ) = Σ_{j≥i} rⱼ** — "the payoff summed over the rest of the horizon, not just this turn." The scene fixes a start state and a single first action (say RUN on an AGING machine with an empty bin), runs it many times, and builds a **histogram of returns**: most shifts cluster nicely, but a fat red tail appears whenever the failure die hits an empty bin. *Manager framing:* "Two managers, same call, same situation — wildly different quarters. You can't judge the playbook by one outcome; you judge it by the *distribution*." This motivates optimizing the *expected* return.

### 7. Optimal action-value Q*(s,a)
For a chosen state — its state-icon shown large — a two-column table lists **(action a | Q*(s, a))**, where **Q*(s, a) = max E[Gᵢ(τ)]** = "the true long-run value of pulling lever a here, assuming you play smart forever after." The argmax row is **starred**. Example: in (AGING, 0 spares), ORDER's row outscores RUN's and earns the star; in (FAILING, 1 spare), REPLACE's row takes it. *Manager framing:* Q* is the number you wish you had next to every lever on every dashboard — the lever's lifetime value, not its this-turn cash. Stepping the state-picker across cells previews the twist.

### 8. Bellman optimality equation
One formula card, read in plain English first: **Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]** — "the value of a lever = the cash it pays now, plus the value of being smart in whatever situation it lands you in." The expectation is drawn over the very dice from Scene 3 (failure die + aging coin). The card animates one cell's backup: branch out along the dice, grab the best downstream value in each landing cell, average, add this turn's reward. *Manager framing:* good decisions are recursive — today's choice is only as good as the position it leaves you in tomorrow.

### 9. Dynamic programming - fill Q*
"Suppose you *did* have a perfect model of the failure odds and aging" (the dice from Scene 3). Then you can compute the whole playbook by repeatedly applying the Bellman backup until nothing changes. The 3×3 grid **fills in region by region** across a handful of sweeps: HEALTHY cells lock to RUN almost immediately, the empty-bin AGING/FAILING cells settle on ORDER, the spare-in-hand AGING/FAILING cells settle on REPLACE. The final picture is the **twist made visible** — a clean 2D heat-map of levers. *Manager framing:* "With a perfect model, the optimal maintenance policy is computable, exactly. Here it is." A few sweeps, fully hand-checkable.

### 10. Why DP does not scale
Two blunt reason-cards. **(a) You rarely know P.** "Did anyone hand you the exact probability this machine fails next week? No — that's the whole problem." **(b) Real state spaces explode.** Our toy has 9 states; a real plant has dozens of machines, multiple part types, lead times, and shared spares — the grid balloons past anything you could enumerate or fill by hand. *Manager framing:* DP is the textbook ideal that quietly assumes away the two things that actually make your job hard. So we need a method that learns the playbook **from experience**, without a model and without enumerating everything.

### 11. SARSA - learn Q* by playing
The Bellman equation is turned into a learning rule by replacing the unknown expectation with **one observed sample** per turn: nudge Q(s, a) toward [r + Q(s′, a′)] — "after each lever-pull, compare what you expected to what actually happened, and adjust." **ε for exploration** is glossed as "every so often, deliberately try the unproven lever so you actually learn whether it's better, instead of forever trusting today's favourite." A live demo plays shift after shift: the rollout tape streams, the on-screen Q-grid updates cell by cell, and a convergence bar shows it **homing in on the exact DP grid from Scene 9** — including reproducing the 2D twist — with *no model ever given*. *Manager framing:* this is learning a playbook the way a seasoned operator does: many small experiments, trial → outcome → adjust.

### 12. Recap
Six badge-cards, one per concept, each with its one-line business gloss: **MDP** (situation → lever → random outcome + payoff), **Policy** (your standing playbook over all situations), **Return** (payoff summed over the horizon, judged as a distribution), **Q\*** (a lever's true lifetime value), **DP** (compute the optimal playbook *if* you had a perfect model), **SARSA** (learn it from experience when you don't). A closing line ties back to the twist: "The right call flipped with the situation — RUN it, pre-order, or swap now. You've learned the bones of how a machine can learn that for you." A "replay the optimal policy" button loops the gold-arrow grid.

## Numbers (concrete, small)
Discount **γ = 0.9** (keeps every value single-digit and hand-checkable).

**States (9):** (health, spares) for health ∈ {HEALTHY (H), AGING (A), FAILING (F)} and spares ∈ {0, 1, 2}.

**Actions:** RUN, ORDER (always); REPLACE (only when spares ≥ 1).

**Failure die on RUN (the growing red slice):** P(fail) = 0% if H, **30%** if A, **70%** if F.

**Transitions:**
- **RUN, no failure** (earn +3): machine ages on a coin flip — H → H or A (50/50); A → A or F (50/50); F → F. Spares unchanged.
- **RUN, failure with spare ≥ 1:** spare consumed, machine → HEALTHY, reward **−3** (rushed emergency swap).
- **RUN, failure with 0 spares:** downtime, machine → FAILING, spares stay 0, reward **−8**.
- **ORDER** (reward **−2**): spares → min(spares+1, 2); health unchanged (you didn't run it).
- **REPLACE** (reward **0**): spare consumed (spares−1), machine → HEALTHY; health unchanged otherwise.
- **Holding cost −1 × (spares in bin)** is added to *every* turn's reward, whatever the action.

**Resulting optimal policy grid (verified by value iteration, the twist):**

| health \ spares | 0 | 1 | 2 |
|---|---|---|---|
| **HEALTHY** | RUN | RUN | RUN |
| **AGING** | **ORDER** | **REPLACE** | REPLACE |
| **FAILING** | **ORDER** | **REPLACE** | REPLACE |

The bold cells are the pedagogical jewel: at the *same* AGING or FAILING health, an **empty** bin → **ORDER** (go acquire protection), a **stocked** bin → **REPLACE** (spend the protection now). HEALTHY → RUN regardless.

**Three Q\* intuitions (γ = 0.9, hand-checkable):**
- **Q\*(HEALTHY, 0, RUN) ≈ 9.1**, the cell's best. By hand: 0.5·(3 + 0.9·V\*(HEALTHY,0)) + 0.5·(3 + 0.9·V\*(AGING,0)) with V\*(HEALTHY,0)≈9.14, V\*(AGING,0)≈4.50 → ≈ 9.1. *Don't waste cash stocking spares while the machine is fine — just run it.*
- **Q\*(AGING, 0, ORDER) ≈ 4.5 > Q\*(AGING, 0, RUN) ≈ 3.8.** Paying −2 now to stock a spare beats running into a 30%-and-rising failure risk with no protection. *Pre-position the part before the risk peaks.*
- **Q\*(FAILING, 1, REPLACE) ≈ 7.2 > Q\*(FAILING, 1, RUN) ≈ 5.5.** With a 70% breakdown looming, a planned swap (refresh to HEALTHY, cost 0) beats gambling on a rushed −3 emergency swap. *Once you hold the protection and the machine is on its last legs, use it.*

(Value iteration converges in a handful of sweeps; the qualitative regions appear in the very first sweep, and the policy is stable well before the values fully settle — easy to demo and to check any cell by hand.)

## Manager translation of the RL ideas
- **State / "the situation now"** → the two gauges you already watch: machine condition and spares on hand.
- **Action / "the lever"** → run it, buy a spare, or swap one in.
- **Policy / "the playbook (SOP)"** → your maintenance doctrine, drawn as one heat-map over all 9 situations; "run-to-failure" and "always-stocked" are two such doctrines.
- **Return / "payoff over time"** → the quarter's cumulative cash, judged as a *distribution* (Scene 6's histogram), not a single lucky or unlucky shift.
- **Stochastic transition / "the part you don't control"** → the failure die. You pick the odds you walk into; the world rolls.
- **Q\*** → each lever's true lifetime value in a given situation — the number you wish sat on every dashboard.
- **Exploration (ε-greedy) / "try the unproven option to learn"** → occasionally test a lever you've written off, so your playbook is based on evidence, not habit.
- **DP / "perfect-model optimization"** → if someone handed you exact failure-and-aging odds, you could compute the optimal policy outright — and we do, in Scene 9.
- **Why DP fails** → you never get those exact odds, and a real plant's situations are far too many to enumerate.
- **SARSA / model-free learning / "learn the playbook from experience"** → run shifts, compare expected vs. actual after each lever, adjust — many small experiments converging to the same optimal heat-map, with no model handed to you.

## Risks / open questions
- **The auto-repair rule is load-bearing.** The whole RUN-vs-REPLACE distinction rests on "a failure *with* a spare auto-swaps you back to HEALTHY at emergency cost (−3), worse than a planned REPLACE (cost 0)." If the tutorial doesn't make this dead-obvious, the spare-in-hand column of the twist can feel arbitrary. Mitigation: show the emergency auto-swap animation explicitly in Scene 1 and contrast it side-by-side with a planned REPLACE.
- **Two penalty tiers to teach (−8 downtime vs −3 emergency).** Managers must hold both in mind for the twist to read. Risk of one number too many; consider a single on-screen legend that stays pinned.
- **ORDER earns nothing this turn**, which is realistic (you can't both produce and take the day to restock here) but is a modelling choice; a reviewer may want ORDER to overlap with running. Keeping them mutually exclusive is what makes the empty-bin AGING/FAILING cell choose ORDER decisively — worth a note that this is a deliberate simplification.
- **Spares cap at 2 and a 12-turn horizon** are chosen to keep the grid 3×3 and values single-digit; both are tunable, but raising either quickly erodes the "whole Q-table on one screen" property that makes the example beautiful.
- **REPLACE availability is state-conditional** (needs a spare), so two cells (HEALTHY/AGING/FAILING × 0 spares) show only two action chips. Minor visual asymmetry; the board must handle 2- vs 3-chip cells gracefully.
- **Discount vs. finite horizon.** The numbers above use γ = 0.9 on an effectively ongoing process for clean Q-values; the on-screen "12-turn quarter" is the narrative wrapper. If the build instead uses a strict 12-step finite horizon, the late-horizon cells shift slightly (less reason to ORDER on turn 11). Decide one framing and keep the displayed Q* consistent with it.

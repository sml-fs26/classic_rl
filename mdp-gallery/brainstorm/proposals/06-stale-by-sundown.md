# Stale by Sundown

> A bakery's croissants age every hour — hold the full price, slash it, or write them off — and the right move flips as the batch gets older.

## Why this lands with managers

Every manager has owned a depreciating asset on a clock: perishable inventory, an aging lead, a software licence burning toward renewal, an ad budget that expires at midnight. "Sell now at full price, discount to move it, or cut losses" is the *markdown decision*, and it is pure decision-making under uncertainty — you do not control whether the next customer walks in. The croissant is a friendly, hand-held stand-in for the entire revenue-management discipline (airline seats, hotel rooms, fashion end-of-season) that managers already half-know. The punchline is the part they usually get wrong by gut: **the correct lever is not fixed — it flips as the asset ages**, and that flip is exactly what an optimal long-run playbook discovers for you.

## The MDP at a glance

- **State (S):** the situation on the shelf = `(units on shelf, freshness tier)`. Units in `{1, 2, 3}` (how many of this batch are left). Freshness tier in `{FRESH, OK, AGING, OLD, STALE}` (a baked good's age clock, one tick per hour). That is `3 × 5 = 15` non-terminal states, plus two terminals: **CLEARED** (shelf empty — the goal) and **SPOILED** (a stale unit aged out unsold — the failure). Fifteen cells fit on one screen as a 5-row (age) × 3-column (stock) board.
- **Actions (A):** three levers, the same three a real shop owner has. **HOLD** — keep the full price (best margin, but the slowest to sell). **DISCOUNT** — cut the price (thinner margin, but demand jumps). **DUMP** — write off the whole batch and put out a fresh one (a guaranteed small loss now, age clock reset to FRESH).
- **Transition (P) — the visible dice:** each hour a single customer slot resolves with a "**did a customer buy?**" spinner. Its green fill-bar is the buy-probability, and it visibly **rises when you DISCOUNT and shrinks as the tier ages** — managers watch demand respond to both levers at once. Buy → one unit sells, the rest of the batch keeps its age. No buy → nothing sells *and the whole batch ages one tier* (FRESH→OK→…→STALE; a STALE batch that ages again falls into SPOILED). DUMP is deterministic: pay the write-off, the spinner resets to a FRESH batch.
- **Reward (R):** `+5` on a full-price (HOLD) sale, `+2` on a DISCOUNT sale, `−3` to DUMP a batch (write-off cost), and a `−6` spoilage hit if a unit tips into SPOILED. CLEARED pays 0 (you are simply done, with the sale revenue already banked). Every number is single-digit; a full day's return is hand-summable.
- **Terminal:** the episode ends when the shelf is **CLEARED** (all units sold — the win) or a unit goes **SPOILED** (aged out unsold — the loss). A patience/discount factor γ = 0.75 supplies the "by sundown" deadline pressure: a sale tomorrow is worth less than a sale now, so you cannot dawdle.
- **The twist (state-dependent optimal action):** the freshness tier is the croissant's **evolution stage**, and like a Pokemon that resists a different move at each form, the *best lever changes with the tier*. The verified optimal playbook reads, almost purely down the age axis: **HOLD when FRESH or OK → DISCOUNT once AGING or OLD → DUMP when STALE.** Stock barely matters — 4 of the 5 age-rows pick the same action regardless of how many units are left. **Age drives the policy; that is the whole lesson.**
- **State-space size:** 15 non-terminal states + 2 terminals = 17. The full Q-table is `15 × 3 = 45` numbers — drawable in its entirety, every cell checkable by hand, value iteration converges in ~32 sweeps.

## Visual language

A warm bakery-case aesthetic — think a pastry shop's glass display, not a casino. The **recurring state-icon** is a **croissant on a little price tag**, and it is the visual spine across every scene:

- **Freshness as colour + crust.** The croissant sprite ripens through five frames: FRESH (golden, steam wisp) → OK (golden, no steam) → AGING (matte tan) → OLD (pale, slightly flat) → STALE (grey-green tint, a tiny fly). The same five frames recur everywhere, so the learner builds one mental picture of "the asset getting worse."
- **Stock as a tray.** 1–3 croissants on a wooden tray; empty tray = CLEARED (a cheerful "SOLD OUT" card), a croissant in a bin = SPOILED.
- **The board.** A 5×3 display case: rows are freshness (FRESH at the warm top, STALE at the grey bottom), columns are units (1–3). Each cell holds the croissant-icon plus, depending on the scene, a value number and/or the recommended-lever chip.
- **The dice.** A horizontal **"customer buy chance" meter** with a green fill and a needle, plus an animated little customer who walks up and either buys (cha-ching, a coin pops) or shrugs and leaves (the batch's crust visibly darkens one frame). The fill grows on DISCOUNT, shrinks with age — the randomness is *felt*, not abstract.
- **Lever colour coding (consistent across all scenes):** HOLD = **green** (premium, hold the line), DISCOUNT = **amber** (act now, cut the price), DUMP = **red** (write it off). The optimal-action chip in a cell is tinted with its lever colour, so the converged board literally shows a **green cap, an amber middle band, and a red floor** — the three-way flip you can see from across the room.
- **Signature animations:** the hourly "age tick" (crust darkens, a clock chimes), the buy-spinner resolve, the price tag flipping from CHF to a slashed DISCOUNT tag, and in the DP scene the case filling in colour band by band as backups propagate.

## Scene-by-scene plan

### 0. Title / hook
A pastry case at dawn, a single FRESH croissant steaming under a hanging "OPEN" sign; the title *Stale by Sundown* and a blinking **"OPEN THE SHOP"** prompt. A one-line teaser: *"You run a bakery for one day. Every hour your croissants get older. Sell, slash, or scrap — what's the playbook?"* Clicking opens to the floor. **Manager framing:** this is the markdown decision — depreciating inventory on a deadline, a problem you have made by instinct a hundred times.

### 1. Tutorial - how to play
A guided panel walks the controls with no theory: here is the **shelf** (units × freshness), here are your **three levers** (HOLD/DISCOUNT/DUMP with their colour and margin), here is the **customer-buy meter** and the **clock** that ages the batch each hour. One scripted hour plays: HOLD a FRESH tray, a customer buys, cha-ching `+5`. **Takeaway:** vocabulary only — shelf = the situation, lever = your move, the meter = the part you do not control. **Manager framing:** "Here's your shop and your dashboard; nothing about strategy yet."

### 2. Playtest - you run it
The learner *is* the shop owner. They start with 3 units FRESH and a full day's clock, and click a lever each hour; the spinner resolves live, units sell or the batch ages, the running till total ticks. Most players over-HOLD a premium tray, watch it drift to STALE, and eat a `−6` spoilage — or panic-DUMP too early. **Takeaway:** the outcome is stochastic and the right call is not obvious; you *feel* the trade-off between margin and the aging clock. **Manager framing:** "You just ran the playbook by gut. Hold that feeling — we'll now find the playbook that beats it."

### 3. Formalization - what makes this an MDP
The four parts slide in over the same shop screen. **State** `s` = `(units, freshness)`, highlighted on the shelf. **Action** `a` ∈ {HOLD, DISCOUNT, DUMP}, the three lever buttons. **Transition** `P(s′, r | s, a)` = the buy-meter (a sale clears one unit; a no-sale ages the batch a tier), shown as the spinner with its probability bar. **Reward** `r` = the till change (+5 / +2 / −3 / −6). A small formula box names γ = 0.75 as "your impatience — money now beats money at closing." **Takeaway/notation:** `S, A, P, R, γ`. **Manager framing:** "Every situation-lever-outcome-payoff problem has these four parts; naming them is step one of treating it as a *decision* instead of a hunch."

### 4. Policy - a rule from states to actions
A **policy π : S → A** is "a playbook — for every situation, which lever." The shelf re-renders as a board of lever chips. Two hand-policies are shown side by side: **Always-HOLD** (every cell green — "premium pride") and **Discount-when-old** (green on top, amber below). The viz notes: *"When you played in scene 2, you* were *a policy — maybe an inconsistent one."* **Takeaway/notation:** π is a function from states to actions; the board *is* the policy. **Manager framing:** "A playbook is just 'if the situation is X, pull lever Y' written down for every X — that is the thing we want to get right, not a single decision."

### 5. Trajectory
One day's run is replayed as a tape: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)`, capital letters because each is a **random variable** until the dice land. The croissant-icon, lever chip, and till change scroll left to right: `(2,FRESH) → HOLD → +5 → (1,FRESH) → HOLD → no-sale, age → (1,OK) → …`. **Takeaway/notation:** τ is a sequence of states, actions, rewards — the whole story of one day. **Manager framing:** "A quarter, a campaign, a customer's lifetime — it's a chain of situations and choices, and the early levers shape every situation that follows."

### 6. Return G_t
Define the payoff-over-time: `Gᵢ(τ) = Σ_{j≥i} γ^{j−i} rⱼ` — "everything you bank from here to closing, with later money discounted." Then the key move: fix the *same* start `(2 units, FRESH)` and the *same* first lever, replay 20 000 days, and draw the **histogram of returns**. HOLD-first: mean ≈ **5.8**, but a wide spread (sd ≈ 2.8, a fat tail down to −1.2 when the tray rots). DISCOUNT-first: mean ≈ **4.5**, tight (sd ≈ 1.6) — the safe play. DUMP-first: a low, locked ≈ **1.3**. **Takeaway:** one action does not give one payoff; it gives a *distribution*. **Manager framing:** "ROI is not a number, it's a spread — HOLD has the higher average *and* the scary downside; the right metric is the long-run average payoff, not last quarter's lucky draw."

### 7. Optimal action-value Q*(s,a)
`Q*(s, a) = max E[Gᵢ(τ)]` — "the true long-run value of pulling lever a in situation s, assuming you play smart from then on." Pick a state, show its croissant-icon and a clean two-column table `(action a | Q*(s, a))` with the argmax **starred**. E.g. at **(2, OLD)**: HOLD 1.73, **DISCOUNT 2.17** ★, DUMP 1.33 — the amber lever wins. Step the same panel through tiers and watch the star **march**: FRESH/OK → HOLD ★, AGING/OLD → DISCOUNT ★, STALE → DUMP ★. **Takeaway/notation:** Q* scores every lever per situation; the best playbook is "pick the starred lever." **Manager framing:** "Imagine a perfect scorecard: for every situation, the honest long-run value of each lever. The star is your move."

### 8. Bellman optimality equation
The recursive definition appears as a single card: `Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]` — "the value of a lever = the payoff it pays now, plus the value of the *best* lever in whatever situation you land in next." Anchor it with the croissant icons: pulling DISCOUNT on an OLD tray pays `+2` *and* lands you in a situation (one fewer unit, or a STALE batch) whose own best-lever value rolls back in. **Takeaway/notation:** value is defined *in terms of itself* — now-payoff plus discounted best-next-value. **Manager framing:** "A lever's worth isn't just this hour's till — it's this hour plus the value of the position it leaves you in. Bellman is just that sentence, made exact."

### 9. Dynamic programming - fill Q*
Because here we *do* know the dice (the buy-probabilities are posted), we can compute the scorecard exactly. "Run the backups" sweeps the Bellman equation over all 15 states repeatedly; the display case **fills in colour band by band** — STALE locks red first (the spoilage cliff is obvious), then the OLD/AGING amber band, then the FRESH/OK green cap. A max-change chip ticks toward zero; it settles in ~32 sweeps. The final board: **green top, amber middle, red floor — the three-way flip, computed.** **Takeaway:** with a known model, iterate Bellman to the fixed point and the optimal playbook falls out. **Manager framing:** "Given a trustworthy model of demand, you can *derive* the optimal markdown playbook — no guessing, every cell justified."

### 10. Why DP does not scale
A two-reason card, each with a bakery face. **(a) You rarely know the dice.** The posted buy-probabilities were a gift; real demand shifts with weather, a competitor, a TikTok — you do not get `P` handed to you. **(b) The board explodes.** Add real stock (0–40), 24 hourly ticks, three product lines, a weekend flag, a weather state — the 15-cell case becomes millions of cells no one can sweep or even store. **Takeaway:** DP is the right idea but needs a known model and a small world; reality offers neither. **Manager framing:** "The clean optimization works on the toy. Your actual market has no published odds and far too many situations to enumerate — so what do you do?"

### 11. SARSA - learn Q* by playing
Derive the fix from Bellman: replace the *expectation you cannot compute* with *one real sample from a day on the floor*. The update — "nudge this lever's score toward (the payoff you just saw + the score of the lever you actually picked next)" — is shown in words, no code. A small **ε** knob is "every so often, try an unproven lever just to learn" (exploration). Then a live demo: the shop plays itself across thousands of days, the 5×3 board's chips flicker and **settle into the same green-cap / amber-middle / red-floor pattern the DP oracle computed** in scene 9, with a convergence bar tracking agreement. **Takeaway/notation:** SARSA learns Q* from experience alone — trial, outcome, adjust — no model required. **Manager framing:** "Run many small, cheap experiments, keep score, occasionally test the unproven option — and the optimal playbook emerges from experience, even when nobody handed you the odds."

### 12. Recap
Six cards, each a pastry-case panel pointing back at one concept. **MDP** — the shop is `(S, A, P, R, γ)`. **Policy** — your playbook, a lever per situation. **Return** — payoff summed over the day, a spread not a point. **Q*** — the honest long-run scorecard; pick the star. **DP** — with a known model, sweep Bellman to the answer. **SARSA** — when you do not know the odds, learn the playbook by playing. Closing line: *"The croissant was tiny on purpose. The same six ideas price airline seats, hotel rooms, ad budgets, and end-of-season racks — anything that goes stale by sundown."* **Manager framing:** "You now have the bones of how machines (and good operators) optimize decisions under uncertainty."

## Numbers (concrete, small)

**States.** `(units ∈ {1,2,3}) × (freshness ∈ {FRESH, OK, AGING, OLD, STALE})` = 15, plus terminals CLEARED and SPOILED.

**Actions.** HOLD, DISCOUNT, DUMP.

**The dice (buy-probability per hour, the meter fill):**

| tier | HOLD (full price) | DISCOUNT (cut price) |
|---|---|---|
| FRESH | 0.55 | 0.80 |
| OK | 0.42 | 0.78 |
| AGING | 0.28 | 0.74 |
| OLD | 0.15 | 0.62 |
| STALE | 0.05 | 0.25 |

Buy → sell one unit, batch keeps its tier. No buy → batch ages one tier; a STALE no-sale falls into **SPOILED**. DUMP is deterministic → batch resets to FRESH, same unit count.

**Rewards.** HOLD sale `+5`, DISCOUNT sale `+2`, DUMP `−3`, SPOILED `−6`, CLEARED `0`. Discount γ = 0.75.

**Converged optimal playbook** (value iteration, ~32 sweeps — the on-screen board):

| freshness ↓ \ units → | 1 | 2 | 3 |
|---|---|---|---|
| **FRESH** | HOLD | HOLD | HOLD |
| **OK** | HOLD | HOLD | HOLD |
| **AGING** | HOLD | DISCOUNT | DISCOUNT |
| **OLD** | DISCOUNT | DISCOUNT | DISCOUNT |
| **STALE** | DUMP | DUMP | DUMP |

Four of five rows ignore stock entirely; only AGING wiggles. **Age drives the policy.**

**Three Q* intuitions (hand-checkable):**

1. **(1 unit, STALE) → DUMP.** With a sale clearing the shelf (terminal value 0) and a no-sale spoiling it (−6):
   - HOLD = `0.05·(5) + 0.95·(−6) = −5.45`
   - DISCOUNT = `0.25·(2) + 0.75·(−6) = −4.00`
   - DUMP = `−3 + 0.75·V(1,FRESH) = −3 + 0.75·(3.76) = −0.18` ★
   A stale single is a near-certain spoilage loss; eating the `−3` write-off to reset to a sellable FRESH unit is the least-bad move. Cut your losses.

2. **(2 units, OLD) → DISCOUNT.** HOLD 1.73 vs **DISCOUNT 2.17** ★ vs DUMP 1.33. The full-price buy chance has collapsed to 0.15, so gambling on a slow HOLD sale risks aging into the spoilage cliff; the amber lever's 0.62 buy chance locks the sale in. The bird in hand beats the premium gamble.

3. **(2 units, FRESH) → HOLD.** HOLD **5.77** ★ vs DISCOUNT 4.51 vs DUMP 1.33. Plenty of clock left and a healthy 0.55 full-price buy chance — no reason to give away margin yet. Hold the line while the asset is fresh.

**Return spread from (2, FRESH)** under a fixed first lever (20 000 simulated days): HOLD mean 5.79 / sd 2.82 (down to −1.2), DISCOUNT mean 4.50 / sd 1.62, DUMP mean 1.34 — the safe-vs-risky contrast managers live with.

## Manager translation of the RL ideas

- **State = the situation now.** How much stock, how fresh — your shelf right now.
- **Action / lever.** Hold price, discount, or write off. Three things you can actually do.
- **Policy = the playbook / SOP.** "If the tray is OLD, discount." A rule for every situation, not one heroic call.
- **Return = payoff summed over time.** The day's till, with later money discounted — average over many days, never one lucky afternoon.
- **Stochastic transition = the part you do not control.** Whether the next customer buys. You set the price; the market rolls the die.
- **Q\* = the honest scorecard.** The true long-run value of each lever in each situation, assuming you keep playing smart. Pick the starred lever.
- **DP = compute the playbook from a known model.** If you genuinely knew demand, you could derive the optimal markdown rule exactly, every cell justified.
- **Why DP fails = no published odds, too many situations.** Real demand is unknown and shifting, and the real state space (stock × hours × products × weather × season) is far too big to enumerate.
- **Exploration (ε) = try the unproven option to learn.** Occasionally discount a fresh tray just to *measure* how customers respond, instead of always doing what looked best yesterday.
- **SARSA / model-free learning = learn the playbook from experience.** Many small experiments — trial, outcome, adjust — converge to the same optimal playbook DP would compute, with no demand model handed to you. This is how you actually get there.

## Risks / open questions

- **SARSA board coverage.** Learning from a single `(2, FRESH)` start recovered 11/15 cells; all 4 misses sit in the rarely-visited 3-units column (a greedy day from 2 units almost never reaches 3). The live scene-11 demo should use **randomized/exploring starts** (or seed a few high-stock days) so the whole board fills and visibly matches the DP oracle — otherwise the convergence story has a soft corner.
- **The lone stock-sensitive cell.** Only `(AGING, 1 unit)` breaks the "age alone decides" story (it picks HOLD while 2–3 units pick DISCOUNT). It is defensible (one fresh-ish unit is worth one more full-price gamble) and can be taught as a nuance, but if a perfectly clean three-band board is wanted, a small tweak to γ or the AGING buy-probabilities flattens it.
- **γ is doing real work.** The clean HOLD→DISCOUNT→DUMP flip lives around γ = 0.75; at high γ (very patient) the DISCOUNT band shrinks toward HOLD, and at low γ it widens. A γ slider would be a great scene-3/9 control, but the headline three-band claim should be pinned to the stated γ and labelled as such.
- **"Sale keeps the batch's tier" is a modelling simplification.** In reality the remaining units would also be aging; collapsing the batch to one shared freshness tier is what keeps the state space at 15. Worth a one-line on-screen caveat (à la Pokemon's HP-bucket note) so the model is honest.
- **DUMP-resets-to-FRESH framing.** Modelling DUMP as "write off and immediately restock a fresh batch of the same size" keeps the state space closed and gives DUMP a sensible upside. If a manager reads DUMP as "throw away and walk away," the −3-then-reset value needs a clear gloss ("the cost already nets the fresh restock").

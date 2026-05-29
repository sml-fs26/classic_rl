# Last-Minute Pricing

> Empty seats expire worthless at midnight — when do you hold the line, and when do you slash the price?

## Why this lands with managers

Every manager has lived this trade-off: a perishable thing — an airline seat, a hotel night, an event ticket, a slot of factory time — that is worth real money today and worth *zero* the moment the deadline passes. The question is never "what is the right price" in the abstract; it is "given how much stock I have and how little time is left, do I hold out for the premium or dump it now?" That is a sequence of decisions under uncertainty with a hard terminal date, which is exactly an MDP. The example needs no programming literacy: it is a 5-by-5 board of business situations, three pricing levers, and a coin-flip for demand — and the *optimal lever changes as you move across the board*, which is the whole lesson of revenue management compressed onto one screen.

## The MDP at a glance

- **State (S):** the situation right now = (**units left** `u ∈ {1,2,3,4,5}`) × (**days to deadline** `d ∈ {0,1,2,3,4}`). A 5×5 grid = **25 states**. The whole Q-table is one screen. The bottom row (`d = 0`, the deadline) and any sold-out state (`u = 0`) are terminal, leaving **20 playable cells** — small enough to fill by hand.
- **Actions (A):** three price levers. **PREMIUM** (high price, few buyers), **STANDARD** (middle), **FIRE-SALE** (deep cut, many buyers). One lever per day.
- **Transition (P) — the visible dice:** each day you set a lever, then a **DEMAND DRAW** is resolved on screen — a card flipped from a small deck, or a row of coins, one face shown per possible buyer. The draw says *how many units sell today* (0, 1, 2, or up to 3 in a fire-sale), capped at what you have left. The probabilities are printed right on the lever, so the randomness is transparent: PREMIUM rarely moves stock, FIRE-SALE almost always clears several units. Time always ticks down one day; inventory drops only by what sold.
- **Reward (R):** the cash you collect today = **price × units sold today** (PREMIUM 5/unit, STANDARD 3/unit, FIRE-SALE 2/unit). No per-step cost is needed; the penalty is implicit and brutal — **units still unsold at the deadline are worth 0**. Returns are just summed revenue, all positive, all small.
- **Terminal:** the episode ends when the deadline arrives (`d = 0`) — leftover units score nothing — or early if you sell out (`u = 0`). Bounded either way: most cells return single-digit dollars.
- **The twist (state-dependent optimal action) — the "evolution" analogue:** the best lever flips across the board, and it flips in *both* directions. Hold **PREMIUM** when you have **one unit and lots of time** (it is scarce, you can afford to wait for a high-paying buyer). Switch to **FIRE-SALE** when you have **a full shelf and almost no time** (you physically cannot move five units at a premium in one day — dump them at 2 before they expire at 0). Cruise at **STANDARD** in the broad middle (a healthy shelf with comfortable runway). Same inventory wants a different price depending on the clock; same clock wants a different price depending on the inventory. That is the classic revenue-management surface, and it is what makes the Q-table genuinely interesting rather than uniform.
- **State-space size:** 25 cells (20 playable). It fits on one screen *and* value iteration converges in exactly 4 sweeps — one per day-to-deadline — so an instructor can check any cell by hand.

## Visual language

The recurring **state-icon** is a small "shelf card": a **stack of `u` ticket/seat sprites** on the left (five slots, filled ones bright, sold/empty ones greyed) and a **countdown ribbon** of `d` day-pips on the right (a little calendar tear-off, days remaining lit). This same icon appears in every scene so the learner builds one mental picture: *how much stock, how much time*. The board is a **5×5 grid** — rows are units-left (5 at top down to 1 at bottom), columns are days-left (4 at left down to the deadline `d=0` at right, drawn as a dark "MIDNIGHT" gutter where everything left over goes dark).

The three levers are **price tags** colour-coded by the editorial categorical palette: **PREMIUM** in deep blue (`#2f6cb1`), **STANDARD** in amber (`#c08a3e`), **FIRE-SALE** in burnt orange (`#a05a2c`). The optimal-lever overlay paints each grid cell with its winning tag colour, so the revenue-management surface reads as three coloured regions with a diagonal seam between them — the visual punchline. The **DEMAND DRAW** is a signature animation: a deck fans out, a card flips with a soft snap, and the sold units animate off the shelf (a seat sprite slides away with a small "+$" flash in the tag colour). Unsold units at midnight crumble to grey with a muted thud. Money collected ticks up in a top corner counter in mono type; the running **return** tape sits beneath the board. Light mode is the lecture default (cream `#f9f7f1`, ink `#1a1a1a`, hairline cards); dark mode is the warm-dark study companion. The math lives in bordered `.formula-block` cards in KaTeX so the notation reads as "a different kind of in-game text box."

## Scene-by-scene plan

### 0. Title / hook
Full-bleed title card: a clock ticking toward **MIDNIGHT** over a shelf of five glowing tickets, the tagline *"Empty seats expire worthless at midnight."* A single **START** prompt. **Manager framing:** "You sell something that rots — a seat, a room, a slot. Today you'll see why pricing it is a decision *made over time, under uncertainty*, not a single number." One click dissolves the clock into the empty 5×5 board, teasing the situations to come. No theory yet — just the stakes.

### 1. Tutorial - how to play
A guided panel walks the controls with no math: here is your **shelf** (units left), here is the **countdown** (days to deadline), here are the **three price tags** you can pull, and here is the **demand deck** that decides how many sell. The learner is shown one slow demo day — set STANDARD, flip a card, watch one seat slide off with a "+$3" flash, the calendar tears off a day. **Takeaway/notation:** vocabulary only — *situation* (shelf + clock), *lever* (price tag), *the draw* (demand). **Manager framing:** "This is your daily decision and the thing you don't control — written as a board you can read at a glance."

### 2. Playtest - you run it
The learner *is* the pricing manager. Starting from a fresh shelf (5 units, 4 days), they pick a lever each day, flip the demand card, and feel the outcome — sometimes PREMIUM sells nothing and a day evaporates; sometimes FIRE-SALE clears three at once. They play to the deadline and see their total revenue, including the sting of units crumbling to grey at midnight. **Takeaway:** the stochastic outcome is *felt*, not described; two identical openings can end very differently. **Manager framing:** "You just ran the business by gut. Notice you were already following *some* rule — hold high early, panic-cut late? Hold that thought."

### 3. Formalization - what makes this an MDP
The four parts slide in over the board the learner just played. **State** `s = (u, d)`: units left and days to deadline, shown as the shelf-card icon. **Action** `a ∈ {PREMIUM, STANDARD, FIRE-SALE}`. **Transition** `P(s', r | s, a)`: the demand draw — printed probabilities per lever — sends you to the next situation and pays you `r`. **Reward** `r = price × units sold today`, with the deadline paying 0 for leftovers. **Takeaway/notation:** the 4-tuple `(S, A, P, R)`. **Manager framing:** "Your gut playthrough was an MDP all along: the *situation*, the *lever*, the *part you don't control*, and the *payoff*."

### 4. Policy - a rule from states to actions
A **policy** `π: S → A` is a complete playbook — one lever pre-assigned to *every* cell of the board. The scene paints two hand-policies over the 5×5 grid so the learner sees a policy as a coloured map: **(a) "Always STANDARD"** — the whole board amber, the safe default; **(b) a naive "hold-then-dump"** — PREMIUM everywhere there are ≥2 days left, FIRE-SALE on the last day. **Takeaway/notation:** `π(s)` is *the lever you pull in situation s*; "when you played in scene 2, you *were* a policy, you just hadn't written it down." **Manager framing:** "A policy is your SOP — the pricing playbook your whole team could follow without you in the room. The rest of this is about finding the *best* one."

### 5. Trajectory
One full episode is replayed as a tape of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …, S_T)`, capital letters because every entry was a roll of the dice before it happened. The shelf-card icon marches left along a rollout tape — situation, lever chosen, cash collected, next situation — until MIDNIGHT. **Takeaway/notation:** a run is a *sequence*, `τ`; the same policy from the same start yields a *different* `τ` each time. **Manager framing:** "One quarter of selling, written down move by move — and it would have read differently if the demand cards had fallen another way."

### 6. Return G_t
The return is the payoff summed from a point onward: `G_i(τ) = Σ_{j ≥ i} r_j` — total revenue collected from day `i` to the deadline. The scene fixes one situation and one chosen lever, runs it many times, and stacks the returns into a **histogram**: PREMIUM from `(5 units, 1 day)` mostly returns 0 or 5 (you rarely move enough); FIRE-SALE from the same cell clusters higher because it clears stock before midnight. **Takeaway/notation:** `G_i` is a *random* number — show its spread, not just its average. **Manager framing:** "Don't judge a lever by one good night. The payoff is a *distribution* — variance is the risk you're carrying into the deadline."

### 7. Optimal action-value Q*(s,a)
`Q*(s, a) = max_π E[G_i(τ)]` — the true long-run value of pulling lever `a` in situation `s`, *assuming you price smart every day afterward*. The scene shows the shelf-card icon for one state beside a clean **two-column table (action a | Q\*(s, a))**, the best row **starred**. Example for `(5 units, 1 day left)`: PREMIUM 2.00, STANDARD 3.30, **FIRE-SALE 4.40 ★**. Flip to `(1 unit, 4 days)`: **PREMIUM 4.44 ★**, STANDARD 3.21, FIRE-SALE 2.00 — the star *moves*. **Takeaway/notation:** `Q*` ranks the levers in *this* situation; argmax is the optimal lever there. **Manager framing:** "The honest dollar value of each lever, played out to the deadline — and the best lever is not the same in every situation."

### 8. Bellman optimality equation
The recursive definition appears as a formula card: `Q*(s, a) = E[ R + max_{a'} Q*(S', a') ]`. The scene reads it in plain English over the board: *the value of a lever today = the cash it pays now, plus the value of being in whatever situation it leaves you in tomorrow, assuming you again pull the best lever there.* A worked one-step backup on a corner cell — e.g. `(3 units, 1 day)`, where every "tomorrow" is the worthless deadline, so `Q* = price × E[units sold]`: FIRE-SALE = `2 × (0.2·1 + 0.4·2 + 0.4·3) = 4.40`. **Takeaway/notation:** today's value is *defined in terms of* tomorrow's. **Manager framing:** "Smart pricing is recursive: today's right move depends on the value of where it lands you tomorrow."

### 9. Dynamic programming - fill Q*
Because the demand probabilities are *known here*, we can compute `Q*` exactly by sweeping the Bellman backup. The 5×5 grid fills **column by column, right to left**: first the deadline-adjacent column `d=1` (pure one-day payoffs, no future), then `d=2` reusing the `d=1` answers, and so on — converged in exactly **4 sweeps**, one per day. As cells lock in, the optimal-lever overlay paints them, and the three coloured regions with their diagonal seam emerge before the learner's eyes. **Takeaway/notation:** known `P` ⇒ exact `Q*` by backward sweeps to a fixed point. **Manager framing:** "If you had a perfect demand model, you could compute the entire optimal playbook for every situation — exactly, no guessing. Watch the revenue-management surface draw itself."

### 10. Why DP does not scale
Two reasons, on a two-panel card. **(a) You rarely know `P`.** Real demand depends on competitors, weather, a viral post — the neat printed probabilities are a fiction; nobody hands you the deck. **(b) The board explodes.** This toy has 25 cells; a real fleet has dozens of fare classes × hundreds of departure dates × seat maps × competitor prices — billions of situations, impossible to enumerate or sweep. **Takeaway:** DP is the *ideal*, not the *method*. **Manager framing:** "Perfect-model pricing is a fantasy: you never truly know demand, and the real problem is far too big to compute cell by cell. So how does anyone actually find the playbook?"

### 11. SARSA - learn Q* by playing
We *learn* the table from experience instead of computing it. Derive the update from Bellman by replacing the expectation with **one observed sample**: after pulling lever `a` in `s`, seeing reward `r`, landing in `s'` and choosing next lever `a'`, nudge `Q(s,a)` toward `r + Q(s', a')`. Add **ε** — occasionally try an unproven lever to keep learning, instead of always exploiting today's best guess. The scene runs live: the manager plays season after season with *no* demand model, the Q-grid fills in and its coloured regions **converge to the DP oracle** from scene 9, tracked by a convergence bar. **Takeaway/notation:** model-free learning — trial, outcome, adjust; `ε` is the explore/exploit dial. **Manager framing:** "Run many small pricing experiments, learn from what actually sold, and the playbook emerges on its own — landing on the same answer the perfect-model calculation gave, but without ever needing the model."

### 12. Recap
Six cards, one concept each, in the shelf-card visual language. **MDP** — the situation, the lever, the part you don't control, the payoff. **Policy** — your pricing SOP, a lever for every situation. **Return `G_t`** — payoff summed to the deadline, and its risk. **Q\*** — the honest long-run value of each lever, the star that moves across the board. **DP** — exact playbook *if* you knew demand. **SARSA** — learn the playbook from experience when you don't. Closing line: *"You've learned the bones of revenue management — and of reinforcement learning."* **Manager framing:** the boardroom-ready summary; the bridge from a ticket shelf to any sequential decision under uncertainty.

## Numbers (concrete, small)

**State set.** `(u, d)` with `u ∈ {1..5}`, `d ∈ {0..4}` → 25 states. Terminal: `d = 0` (deadline; leftover units worth 0) or `u = 0` (sold out). 20 playable cells.

**Action set + demand draw** (units sold today, capped at `u`; probabilities printed on each lever). Discount `γ = 1` (finite horizon, so returns are bounded without it):

| Lever | Price / unit | Units sold today (the visible draw) | Expected units/day |
|---|---|---|---|
| **PREMIUM** | 5 | 0 w.p. 0.60 · 1 w.p. 0.40 | 0.40 |
| **STANDARD** | 3 | 0 w.p. 0.20 · 1 w.p. 0.50 · 2 w.p. 0.30 | 1.10 |
| **FIRE-SALE** | 2 | 1 w.p. 0.20 · 2 w.p. 0.40 · 3 w.p. 0.40 | 2.20 |

**Reward.** `r = price × (units sold today)`. Terminal value 0.

**Hand-computable backup (last day, `d = 1`).** All futures are the worthless deadline, so `Q*(s,1) = price × E[units sold, capped at u]`. For `u ≥ 3`:
- PREMIUM = `5 × (0.40)` = **2.00**
- STANDARD = `3 × (0.50·1 + 0.30·2)` = `3 × 1.10` = **3.30**
- FIRE-SALE = `2 × (0.20·1 + 0.40·2 + 0.40·3)` = `2 × 2.20` = **4.40 ★**

**The converged optimal policy** (4 backward sweeps; rows = units 5→1, cols = days 1→4):

```
        d=1        d=2        d=3        d=4
u=5 | FIRE-SALE  FIRE-SALE  STANDARD   STANDARD
u=4 | FIRE-SALE  FIRE-SALE  STANDARD   STANDARD
u=3 | FIRE-SALE  STANDARD   STANDARD   PREMIUM
u=2 | FIRE-SALE  STANDARD   PREMIUM    PREMIUM
u=1 | STANDARD   PREMIUM    PREMIUM    PREMIUM
```

Lever usage across the 20 cells: STANDARD 8, PREMIUM 6, FIRE-SALE 6 — all three levers are genuinely optimal somewhere, and every cell's winner beats the runner-up by a real margin (smallest gaps, ~0.10–0.14, sit right on the diagonal seam, which is exactly where the decision is hardest and DP earns its keep).

**Three `Q*` intuitions a manager can feel:**
1. **`(5 units, 1 day)` → FIRE-SALE** (2.00 / 3.30 / **4.40**). Five units, one day: you *cannot* move them at a premium. Dumping at 2 beats watching them expire at 0. *Use it or lose it.*
2. **`(1 unit, 4 days)` → PREMIUM** (**4.44** / 3.21 / 2.00). One scarce unit, four chances to sell it. Hold out for the 5; even if it doesn't sell today, you carry it and try again. *Scarcity + runway = patience.*
3. **`(5 units, 4 days)` → STANDARD** (11.29 / **11.55** / 9.77). Full shelf, comfortable runway: neither panic nor greed — the steady mid price clears stock at the best blended yield. *The boring middle is usually right.*

## Manager translation of the RL ideas

- **State = the situation now** → how much stock you hold and how little time is left (the shelf + the clock).
- **Action = the lever** → the price tag you pull today: PREMIUM, STANDARD, or FIRE-SALE.
- **Policy = the playbook / SOP** → a pre-set lever for every situation, the rule your team follows without you.
- **Return = payoff summed over time** → total revenue collected from now to midnight, not just today's sale.
- **Stochastic transition = the part you don't control** → the demand draw; you set the price, the market decides how many buy.
- **Exploration (ε) = try the unproven option to learn** → occasionally test a price you're unsure about, to discover its true value instead of always banking on today's favourite.
- **Q\* = the honest long-run value of a lever in a situation** → assuming you keep pricing smart afterward; the star that moves across the board *is* the insight.
- **DP caveat = perfect-model pricing is a fantasy** → you never truly know demand (reason a), and real fare/date/seat combinations are far too many to enumerate (reason b).
- **Model-free learning (SARSA) = learn the playbook from experience** → run many small pricing experiments, adjust from what actually sold, and converge on the optimal SOP without ever owning a demand model.

## Risks / open questions

- **Reward parity between STANDARD and FIRE-SALE on the last day.** With the chosen numbers FIRE-SALE (4.40) cleanly beats STANDARD (3.30) at `d=1, u≥3`, but the diagonal-seam cells win by only ~0.10. That tight margin is *pedagogically* good (it shows where the decision is genuinely close), but the build's precompute must assert the argmax is stable and not a floating-point coin-flip — pin the seed, snapshot the policy, and verify all three levers remain optimal somewhere.
- **"Units sold per day" vs "a coin per unit."** The seed sketch floated a coin per remaining unit (binomial demand). That collapses the twist: with a per-unit coin, a big shelf still clears comfortably and FIRE-SALE never wins. The capacity-limited draw above (a small deck capping daily sales) is what makes "you physically can't move five units in a day" true — and is also closer to real revenue management. Worth a one-line caption acknowledging the simplification.
- **`γ = 1` vs a discount slider.** The finite horizon makes returns bounded without discounting, which keeps the arithmetic clean. Pokémon used a `γ` slider as a "patience" knob; here the *deadline itself* is the patience mechanism. We could add a small per-day holding cost as an optional slider to give the same knob, but it muddies the hand-computable numbers — recommend keeping `γ = 1` and letting the clock do the work.
- **Three coloured regions vs a clean diagonal.** The optimal surface is three regions (PREMIUM / STANDARD / FIRE-SALE) with a stepped seam, not a single clean line. That is richer than Pokémon's two-move flip and a touch busier to read — the colour overlay and the "the star moves" framing must carry it. Verify in a headless screenshot that the three regions are legible at projector scale.
- **Sprite/asset choice.** Tickets vs seats vs hotel keys vs factory-time blocks — the shelf icon should be instantly "a perishable thing." Tickets read fastest for a general manager audience; confirm with the lecturer before building.

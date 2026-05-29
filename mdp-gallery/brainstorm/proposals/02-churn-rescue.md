# Churn Rescue

> A customer drifts toward the exit — do you spend a discount to save them, or save your margin?

## Why this lands with managers

Every manager has lived this decision: an account is cooling, the renewal clock is ticking, and someone wants to throw a discount at it. Churn Rescue turns that exact judgement call into a board on screen — the situation is a health bar and a countdown, the levers are *do nothing / a human check-in / a deep discount*, and the payoff is a renewal you either bank or lose. It is decision-making under uncertainty, ROI, and brand-vs-margin trade-offs rendered as a game you can actually play, and the punchline — *the right move changes with the situation* — is something every seasoned operator already half-knows but has never seen proven on a single screen.

## The MDP at a glance

- **State (S):** the situation the account is in right now — a pair `s = (engagement tier, months-left)`. **Engagement tier** ∈ {on-the-cliff, at-risk, lukewarm, healthy, thriving} (5 levels, a health bar). **Months-left** ∈ {1, 2, 3, 4, 5} — months until the contract comes up for renewal (a countdown). **5 × 5 = 25 non-terminal states**, plus two terminals (RENEWED, CHURNED). The whole thing is a 5×5 board.
- **Actions (A):** three levers you pull at the start of each month. **DO NOTHING** (cost 0 — protect margin), **CHECK-IN** (cost 1 — a low-cost human touch / success email / QBR nudge), **BIG OFFER** (cost 4 — a deep discount or free upgrade). Left→right: cheaper/passive → expensive/aggressive. This mirrors Pokémon's weak-reliable → strong-risky ordering.
- **Transition (P) — the visible dice:** after you pull the lever, two objects animate on screen. **The RETENTION COIN** flips first — heads = STAYS, tails = CHURNS (terminal). The coin is *weighted* by the engagement tier (healthier = more heads) plus a lift from your lever (a check-in adds a little, a big offer adds a lot — but only where there is headroom). **The ENGAGEMENT DIE** (a d6) then rolls *if they stayed* and nudges the health bar up or down for next month — a check-in tends to roll high (it grows the relationship), do-nothing tends to sag. Both are shown as a literal coin + d6 with their weighted faces, so "the part you don't control" is concrete, not abstract.
- **Reward (R):** **per month**, the negative cost of the lever you pulled: `0 / −1 / −4`. **Terminal:** `+20` when the contract reaches month 0 still subscribed (a successful **RENEWAL** — the lump you are playing for), `−20` if the account **CHURNS**. No discounting (`γ = 1`): every episode terminates at renewal or churn, so the return is just the sum of the lever costs plus the one terminal lump — fully hand-computable.
- **Terminal:** the episode ends the instant the retention coin comes up CHURN (`−20`), or the instant months-left ticks to 0 while still subscribed (RENEWAL, `+20`). Clean and episodic.
- **The twist (state-dependent optimal action):** this is the jewel, and it flips on **both** axes. **Down the tier axis:** for a **thriving** account DO NOTHING is optimal (a discount just burns margin and cheapens the brand when they were going to renew anyway); in the **lukewarm/healthy middle** the cheap CHECK-IN is optimal (it grows the relationship for almost nothing); **near the cliff** the BIG OFFER finally pays for itself. **Across the months-left axis, *inside the same tier*:** an **at-risk** account with the renewal **imminent** (1–3 months) is worth the BIG OFFER — there is no time to recover, so lock it in — but the *same* at-risk account with a **long runway** (4–5 months) is better served by a CHECK-IN, because over many months the cheaper growth lever can drift them back to safety on its own and a one-shot discount is wasted. The answer genuinely depends on *where on the board you are* — a real two-dimensional flip, richer than a single gradient.
- **State-space size:** 25 non-terminal states. The entire Q-table is a 5×5 grid with three little lever-values per cell — it fits on one screen with room to spare, exactly like the Pokémon Q-grid.

## Visual language

The recurring **state-icon** is an **account card**: a customer avatar (a simple company-logo glyph) with a **5-segment ENGAGEMENT BAR** above it (green when thriving → amber → red at the cliff, the same segmented-bar idiom as the Pokémon HP bar) and a **RENEWAL COUNTDOWN** badge beside it ("3 mo. to renewal"). This card *is* the state and it appears identically in every scene, so the learner builds one mental picture.

The board is a **5×5 grid (a "retention map")** — rows are engagement tier (thriving at the top, cliff at the bottom), columns are months-left (1 on the left = renewal imminent, 5 on the right = long runway). Each cell holds a tiny account card plus three lever chips.

**Colour coding for levers** is consistent everywhere: **DO NOTHING** = grey, **CHECK-IN** = blue, **BIG OFFER** = gold. So the optimal-policy grid reads at a glance as a *map of coloured regions* — grey corner top, a blue band through the middle, a gold wedge in the bottom-left where the cliff meets the imminent renewal, and a small blue notch biting into the gold where at-risk-with-runway prefers the cheaper touch. That notch is the visual payoff of the two-axis twist.

**Signature animations:** the **retention coin** spins and lands STAY/CHURN with a satisfying thunk; on CHURN the account card greys out and slides off ("lost"); the **engagement die** tumbles and the health bar ticks up or down a segment; on RENEWAL the card flashes gold and a `+20` confetti pop fires. Money read-outs use a running **margin ledger** at the bottom (each lever debits it; the terminal lump credits/debits it), so the learner literally watches the payoff accumulate.

## Scene-by-scene plan

### 0. Title / hook
A single cooling account card sits centre-stage: engagement bar sliding from green toward amber, "3 months to renewal" ticking, a faint "PRESS START" beneath it. The hook line: *"This customer is drifting. You have three levers and five months. What do you spend?"* One click starts the experience. Manager framing: this is the renewal-save decision you make every quarter — now you get to see the math behind your gut.

### 1. Tutorial - how to play
Three labelled panels teach the vocabulary with zero theory: (1) **the account card** — the engagement bar (5 levels, thriving→cliff) and the renewal countdown; (2) **the three levers** and their costs (0 / −1 / −4), with the blue/grey/gold colour code introduced here; (3) **the two dice** — a worked example showing the retention coin landing STAY, then the engagement die nudging the bar up a notch, and the calendar ticking down one month. The learner clicks once to flip a demo coin. Takeaway: I pull a lever, the world flips a (weighted) coin and rolls a die, the month advances. Manager framing: the controls are exactly the choices and the uncertainty you already manage.

### 2. Playtest - you run it
The learner is dropped onto a single account (say lukewarm, 4 months left) and **runs it to renewal or churn by clicking levers**, month by month. The retention coin and engagement die animate every turn; the margin ledger ticks; the episode ends in a gold RENEWAL or a grey CHURN. They are encouraged to replay and feel that the *same* choices give *different* outcomes — and that over-spending (big offers on a healthy account) wins the renewal but wrecks the ledger. Takeaway: you cannot control the coin, only which coin you flip. Manager framing: when you played, you were already running a retention *playbook* — we will name that next.

### 3. Formalization - what makes this an MDP
The screen freezes mid-game and labels the four parts on the live board. **State `s`** = (engagement tier, months-left) — highlight the account card. **Action `a`** = the lever you chose. **Transition `P(s′, r | s, a)`** = the weighted coin + die that produced the next card and the cost — the two dice are circled as *the part you don't control*. **Reward `r`** = the ledger entry (−cost now; ±20 at the end). The "Markov" point in plain words: the right move depends only on the card in front of you, not on how you got here. Takeaway: state / action / transition / reward. Manager framing: every recurring business decision with uncertainty and a payoff has this skeleton.

### 4. Policy - a rule from states to actions
Define a **policy `π: S → A`** — a complete playbook that names one lever for *every* cell of the 5×5 board. Show two hand-built playbooks side by side on the grid, coloured by lever: **"Never discount"** (all grey) and **"Always big-offer the moment they cool"** (gold everywhere below healthy). The learner toggles between them and sees the margin ledger and renewal rate each would produce. The key line: *"when you played in scene 2, you* were *a policy — you just hadn't written it down."* Takeaway: `π(s)` is a rule from situation to lever; a policy is a full-board object. Manager framing: this is your SOP / retention playbook — and a bad blanket SOP is exactly what we want to beat.

### 5. Trajectory
Replay one episode as a **rollout tape**: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)` laid left to right, each step a little card + lever chip + reward, ending at RENEWED or CHURNED. The variables are capitalised on purpose — they are *random*: rerun the same starting card under the same playbook and a *different* tape unspools (a different coin here, a different die there). Takeaway: a run is a sequence of random variables, not a fixed script. Manager framing: two identical accounts handled the identical way can still end differently — that is the coin, and it is why single anecdotes lie.

### 6. Return G_t
Sum the tape: `G_i(τ) = Σ_{j≥i} r_j` — the **total payoff from month i onward**, costs plus the terminal lump, summed over time (no discount, so it is just addition). Fix one starting card and one lever, run it many times, and draw the **histogram of returns**: a spike at +20-minus-a-few-costs (renewals) and a spike down near −20 (churns). The learner sees the *spread*, not a single number. Takeaway: from one situation-and-lever you get a *distribution* of payoffs; the return is the whole-horizon score, not this month's cost. Manager framing: ROI is a distribution, and "what's the average payoff if I play this way?" is the only fair question.

### 7. Optimal action-value Q*(s,a)
Define `Q*(s, a) = max E[ G_i(τ) ]` — *the true long-run payoff of pulling lever a in this exact situation, assuming you play smart afterwards.* Show the recurring **account-icon** for one chosen state next to a **two-column table** (`lever a | Q*(s, a)`), the argmax row **starred** and gold/blue/grey-tinted. Step the icon through three contrasting states to *show the flip*: thriving-m1 stars DO NOTHING, lukewarm-m3 stars CHECK-IN, cliff-m1 stars BIG OFFER. Takeaway: Q* scores each lever per situation; the best lever is the argmax, and it *moves*. Manager framing: this is the number you wish you had on every account — the honest long-run value of each lever, not its sticker cost.

### 8. Bellman optimality equation
One formula card: `Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]`, read in business English under it: *"the value of a lever = the immediate cost/payoff, plus the value of playing optimally from wherever the coin and die land you next."* Animate it on one cell: the lever's cost, branch on the coin (CHURN → the −20 terminal; STAY → the engagement die spreads you across next-month cards), and at each next card take the *best* lever's Q*. Takeaway: today's best move is defined recursively in terms of tomorrow's best move. Manager framing: a lever is only as good as the situation it leaves you in — the discipline of thinking past this quarter, written as one line.

### 9. Dynamic programming - fill Q*
*If* we know the coin and die weights `P`, we can **compute** the whole playbook. Start the 5×5 Q-grid blank and sweep Bellman backups; watch values flow inward from the terminals — the renewal-imminent column and the extreme tiers lock in first, then the interior fills, and after a few sweeps the colours stop changing. With these numbers it **converges in 5 sweeps**. The final coloured map *is* `π*`: grey thriving corner, blue middle band, gold cliff wedge — and the small **blue notch** at at-risk × long-runway where the offer stops being worth it. Takeaway: known model ⇒ exact optimal playbook, computable. Manager framing: with a perfect model of how customers respond, you could hand every rep the provably best move for every account — and there's the catch, next.

### 10. Why DP does not scale
Two honest caveats on one card. **(a) You rarely know P.** Nobody hands you the true retention-coin weights — how a discount *actually* shifts churn for *your* customers is unknown until you try. **(b) Real state spaces explode.** Our board is 25 cells because we used 5 tiers × 5 months; a real account has dozens of signals (usage, tickets, sentiment, seat count, NPS, tenure…) and the grid becomes astronomically large — you cannot enumerate it, let alone sweep it. Takeaway: DP is the ideal we cannot run in practice. Manager framing: the perfect model is a fantasy, and the real world is too big to spreadsheet — so how do we get a good playbook anyway?

### 11. SARSA - learn Q* by playing
Derive the update from Bellman by replacing the expectation with **one observed sample**: you pulled lever a in situation s, saw cost/payoff r, landed in s′ and (under your current playbook) would pull a′ — so nudge your estimate `q[s,a]` toward `r + q[s′,a′]` by a small step `α`. Add **ε-greedy**: most months play the lever you currently believe is best, but occasionally (probability ε) **try an unproven lever to learn** what it really does. Then run it live: a trajectory tape feeds a learning Q-grid that, month after simulated month, **fills in toward the same coloured map the DP oracle produced** — including the blue notch — with a convergence bar tracking the gap. Takeaway: you can learn the optimal playbook from experience alone, no model required. Manager framing: this is disciplined experimentation — run many small retention experiments, watch what actually happens, and let the playbook write itself, occasionally betting on an unproven move so you keep learning.

### 12. Recap
Six badge cards, one concept each, each anchored to its Churn Rescue artifact: **MDP** (account card + dice + ledger), **Policy** (the coloured 5×5 playbook), **Return** (the cost-plus-lump tape and its histogram), **Q\*** (the two-column lever table with the star), **DP** (the grid filling from the terminals), **SARSA** (the live grid converging to the oracle through experiments). Closing line: *"You've learned the bones of reinforcement learning — and you already make these calls every quarter."* Manager framing: the vocabulary now has hooks onto decisions they own.

## Numbers (concrete, small)

**States.** `s = (tier, m)` with tier ∈ {cliff=0, at-risk=1, lukewarm=2, healthy=3, thriving=4} and months-left `m` ∈ {1,…,5}. 25 non-terminal states; terminals RENEWED (+20) and CHURNED (−20).

**Actions & costs.** DO NOTHING (0), CHECK-IN (−1), BIG OFFER (−4). Undiscounted, `γ = 1`.

**Retention coin — P(STAY | tier, lever)** = base(tier) + lift(lever, tier), capped at 0.99:

| tier | base | +CHECK-IN | +BIG OFFER |
|---|---|---|---|
| thriving | 0.985 | +0.01 | +0.01 |
| healthy | 0.93 | +0.05 | +0.05 |
| lukewarm | 0.82 | +0.10 | +0.12 |
| at-risk | 0.68 | +0.12 | +0.26 |
| cliff | 0.50 | +0.08 | +0.38 |

The offer's lift is large only where there is headroom (low tiers); on a thriving account it adds essentially nothing — the −4 is pure waste.

**Engagement die — next-tier nudge if they STAY** (else clamp at the ends): DO NOTHING → up 0.12 / same 0.48 / down 0.40 (tends to sag); CHECK-IN → up 0.40 / same 0.45 / down 0.15 (the *growth* lever — it climbs tiers); BIG OFFER → up 0.25 / same 0.60 / down 0.15 (a stay-spike, only a modest climb — it is a panic button, not a growth lever).

**Transition.** Each month: pull lever (debit its cost) → flip the retention coin; tails ⇒ CHURNED (−20, done). Heads ⇒ roll the engagement die for the new tier and decrement `m`; if the new `m = 0` ⇒ RENEWED (+20, done), else continue.

**Hand-computable check (m = 1, so STAY ⇒ instant +20):**
- **cliff, m=1, BIG OFFER:** stay = 0.50 + 0.38 = 0.88. `Q = −4 + 0.12·(−20) + 0.88·(+20) = +11.2`. ✓
- **at-risk, m=1, BIG OFFER:** stay = 0.68 + 0.26 = 0.94. `Q = −4 + 0.06·(−20) + 0.94·(+20) = +13.6`. ✓
- **thriving, m=1, DO NOTHING:** stay = 0.985. `Q = 0 + 0.015·(−20) + 0.985·(+20) = +19.4`; same state, BIG OFFER = `−4 + 0.01·(−20) + 0.99·(+20) = +15.6` → **DO NOTHING wins** (the discount burns 3.8 of margin for nothing). ✓

Value iteration converges in **5 sweeps** to this optimal map:

| tier ↓ \ months-left → | m=1 | m=2 | m=3 | m=4 | m=5 |
|---|---|---|---|---|---|
| **thriving** | NOTHING | NOTHING | NOTHING | NOTHING | NOTHING |
| **healthy** | CHECK-IN | CHECK-IN | CHECK-IN | CHECK-IN | CHECK-IN |
| **lukewarm** | CHECK-IN | CHECK-IN | CHECK-IN | CHECK-IN | CHECK-IN |
| **at-risk** | OFFER | OFFER | OFFER | **CHECK-IN** | **CHECK-IN** |
| **cliff** | OFFER | OFFER | OFFER | OFFER | OFFER |

**Three Q\* intuitions to narrate:**
1. **The brand/margin guardrail (tier flip):** thriving DO NOTHING (19.4) beats BIG OFFER (15.6) — when they were going to renew anyway, a discount is value *destroyed*. Top of the map is grey.
2. **The cheap-touch sweet spot:** lukewarm-m3 CHECK-IN (≈8.5) beats both DO NOTHING (≈5.3) and BIG OFFER (≈7.2) — one cheap human touch both lifts the coin and *climbs the tier* via the engagement die, compounding over the runway. The middle band is blue.
3. **The two-axis jewel (months flip inside one tier):** at-risk-m3 BIG OFFER (≈2.68) edges CHECK-IN (≈2.28) — renewal is close, lock it in — but at-risk-m4 *reverses*: CHECK-IN (≈−1.16) beats BIG OFFER (≈−1.69), because with a long runway the cheaper growth lever can drift them back to safety and a one-shot discount is wasted. That crossover is the **blue notch** in the gold wedge, and it is the whole pedagogical point: *the right lever depends on the calendar, not just the health bar.*

## Manager translation of the RL ideas

- **State / action / policy →** the account's situation / the lever you pull / your retention playbook (the SOP that names a lever for every account profile).
- **Stochastic transition (the dice) →** the part you don't control: whether they actually stay, and how their engagement drifts. You choose the coin; you don't choose how it lands.
- **Return G_t →** total ROI over the whole renewal horizon — costs plus the renewal lump — not this month's discount line. A *distribution*, not a point.
- **Q\*(s, a) →** the honest long-run value of a lever in a given situation, assuming you keep playing smart. The number that says "spend here, hold there."
- **Bellman / thinking recursively →** a lever is only as good as the situation it leaves you in next month — discipline against quarter-by-quarter myopia.
- **Dynamic programming →** *if* you had a perfect model of how customers respond to each lever, you could compute the provably optimal playbook for every situation.
- **Why DP fails →** you never have that model (real customer response is unknown until you act), and the real state space — every signal you track — is far too large to enumerate.
- **ε-greedy / exploration →** mostly do what looks best, but occasionally run the unproven play (offer where you'd normally hold, hold where you'd normally offer) so you actually learn its true effect instead of guessing forever.
- **SARSA / model-free learning →** build the playbook from experience: try a lever, watch the real outcome, nudge your belief, repeat — many small retention experiments that converge on the same answer the all-knowing oracle would have computed.

## Risks / open questions

- **The two-axis twist must survive tuning.** The at-risk **m=3 → m=4 crossover** (OFFER 2.68 → CHECK-IN −1.16, with OFFER 2.68 vs CHECK-IN 2.28 *just* before the flip) is the single most valuable thing in the whole example and also the most fragile. The retention-coin and engagement-die weights above produce it; they should be **frozen as authored** and any later balance change re-validated, because if the notch collapses the example degrades to a one-axis tier gradient no richer than a colour ramp.
- **Margin numbers vs. units.** Costs 0/−1/−4 and lumps ±20 are deliberately abstract "value units," not dollars. We should decide whether to keep them unit-less (cleaner math, easier hand-checks) or skin them as money (more visceral for managers, but invites "are these realistic?" debates that distract from the lesson). Recommendation: keep them unit-less on the math screens, gloss them as "value points" in prose.
- **Two dice may read as more random than Pokémon's.** A coin *and* a die per step is slightly busier than Pokémon's damage-roll-plus-accuracy. The tutorial (scene 1) must land the "coin decides stay/churn, die only nudges next month's health" split crisply, or scene 2 feels noisy. Consider animating them strictly in sequence (coin resolves fully, then die) rather than together.
- **"Discount cheapens the brand" is encoded only as zero headroom.** The reason a big offer is bad on a thriving account is, in the model, simply that the coin is already near 1.0 so the −4 is wasted — there is no explicit brand-damage penalty. That is enough to make DO NOTHING win, but if reviewers want the *brand* story to bite harder we could add a small negative engagement-die effect for offering to a thriving account (a discount trains them to wait for discounts). It is not needed for the twist, so treat it as optional flavour, not core mechanics.
- **Does the middle really want CHECK-IN for the right reason?** The blue band is driven as much by the engagement die (CHECK-IN climbs tiers) as by the coin. We should make sure scene 9/11 narration credits *both* effects, or a sharp manager will ask why a near-free touch beats doing nothing when the coin lift looks tiny — the answer ("it compounds the relationship over the runway") is exactly the lesson, so surface it rather than hide it.

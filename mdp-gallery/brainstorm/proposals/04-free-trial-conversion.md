# Trial Clock

> The free trial is ticking — guide them to the 'aha' moment, or show the paywall before they're hooked?

## Why this lands with managers

Every manager who has shipped a SaaS, an app, or a freemium product has lived this exact tension: a new user is on a 5-day free trial, the clock is running, and you have a small set of levers — nudge them deeper into the product, leave them alone, or ask for the credit card. Push too early and you scare off someone who would have converted; wait too long and the trial expires for nothing. It is a pure decision-under-uncertainty problem with real ROI on the line, and the "right move" is obviously *not* the same on day 5 as on day 1, nor the same for a cold user as for a hooked one. That is precisely what makes it the perfect skin for an MDP: the optimal playbook is a function of the situation, and the visualization lets a non-technical leader *feel* that before a single symbol appears.

## The MDP at a glance

- **State (S):** the situation a single trial user is in, on two axes. **Adoption tier** = how many "core features" they have started using: `{none, 1 feature, 2 features, 3 features, ACTIVATED}` (5 levels; ACTIVATED = a genuinely hooked power user who has hit the product's "aha" moment). **Days left** on the trial: `{5, 4, 3, 2, 1}` (5 levels). One state = (tier, days-left). **Total: 5 × 5 = 25 states** — plus three terminal outcomes. The whole thing is one 5×5 board.
- **Actions (A):** three levers, the same three a growth team actually has. **ONBOARD NUDGE** — a guided in-product prompt steering them toward the next feature (costs a little: a touch / an email / friction). **DO NOTHING** — let the trial ride, spend nothing. **PAYWALL PUSH** — surface the upgrade offer with a countdown ("your trial ends soon — upgrade now").
- **Transition (P) — the visible dice:** two on-screen randomizers. On an **ONBOARD NUDGE**, the **Adoption Coin** flips: heads (½) the user adopts the next feature (tier +1), tails (½) it does not land and they stay put — either way a day burns. On a **PAYWALL PUSH**, the **Conversion Wheel** spins into one of three wedges — **BUY** (→ paid, terminal), **IGNORE** (they dismiss it, stay same tier, a day burns), or **ABANDON** (the early ask annoyed them, they bail — terminal). The wedge sizes are drawn proportional to the tier: a cold user's wheel is mostly ABANDON and IGNORE with a sliver of BUY; an ACTIVATED user's wheel is mostly BUY. DO NOTHING is deterministic — a day simply ticks off. The odds are always printed on the wheel, and the dreaded "pushed-too-early → ABANDON" wedge is large and red so the danger is visible.
- **Reward (R):** **+20** when they convert to paid (terminal — the lifetime-value payoff). **−1** for each ONBOARD NUDGE (guidance is not free). **0** for DO NOTHING. **−5** for an early ABANDON (a burned, soured user costs you more than a quiet expiry). **0** if the trial simply expires with no conversion (a lost-but-not-poisoned user).
- **Terminal:** an episode (one user's trial) ends on **CONVERT (+20)**, **ABANDON (−5)**, or **EXPIRY (0)** when days-left hits 0. Strictly episodic with a hard 5-day horizon.
- **The twist (state-dependent optimal action):** the best lever flips across the board on *both* axes — this is the "evolution that resists different moves" jewel. **Down the adoption axis:** when adoption is low you must build value first (NUDGE), but once the user is ACTIVATED the very same PAYWALL PUSH that would have been a disaster becomes the best move in the game. **Across the time axis:** for a mid-adoption user you can afford to keep nudging on day 5, but as the clock runs down you eventually *have to ask* — PUSH wins on the late days even at the same tier where NUDGE won on the early days. The signature cell: **PAYWALL PUSH on a cold user (tier none) on day 5 is the worst thing you can do** (it triggers the ABANDON wedge, value ≈ −0.8 vs +5.2 for nudging), while **the identical PAYWALL PUSH on an ACTIVATED user is the best thing you can do** (value ≈ +20). Same lever, opposite verdict — the situation decides.
- **State-space size:** 25 non-terminal cells (5 tiers × 5 days) + 3 terminals. Small enough to render the entire Q-table — three Q-values per cell — as a labelled 5×5 grid on a single screen, with no scrolling and every number checkable by hand.

## Visual language

The recurring **state-icon** is a **Trial Card**: a little user avatar with two read-outs that appear in every scene so the learner builds one mental picture.
- **Adoption ladder** — a vertical 5-rung ladder on the left of the card; rungs light up green as the user climbs `none → 1 → 2 → 3 → ACTIVATED`. The top rung (ACTIVATED) gets a small glow / "aha" spark so a hooked user is visually unmistakable.
- **Trial Clock** — a circular countdown dial (or a 5-pip strip) at the top-right that empties one pip per day; it tints from calm blue (5 days) through amber to urgent red (1 day) so time pressure is felt, not read.
- **The board** is a 5×5 grid: columns = days-left (5 on the left → 1 on the right), rows = adoption tier (ACTIVATED on top → none on the bottom). Each cell holds a mini Trial Card and, in later scenes, its three Q-values.
- **Lever colour coding** (consistent everywhere): ONBOARD NUDGE = teal (build/grow), DO NOTHING = grey (hold), PAYWALL PUSH = gold (ask for money). Terminals: CONVERT = a green "PAID" stamp + coin-drop animation, ABANDON = a red door-slam, EXPIRY = a faded grey "trial over".
- **Signature animations:** the **Adoption Coin** flips and lands with a satisfying clink; the **Conversion Wheel** spins and ratchets into a wedge; on the policy/DP grids, the optimal lever in each cell is shown as a coloured chip with a small star, and the green NUDGE region (top-left), the gold PUSH region (right + top), and the grey corner form a clear "staircase" you can see at a glance.

## Scene-by-scene plan

### 0. Title / hook
A single Trial Card center-screen: a new user, adoption ladder at the bottom rung, the Trial Clock ticking down from 5 with an audible tick. Big title **TRIAL CLOCK** and the line "They signed up for the free trial. The clock is running. What do you do?" A pulsing **START** button. **Manager framing:** this is the most common growth decision in software — you have a stranger, a deadline, and a few levers; the payoff is whether they ever pay you.

### 1. Tutorial - how to play
A guided walkthrough of the Trial Card and the three lever buttons — no theory, no math. The panel names the vocabulary in plain business terms: "the situation" = where this user is on the adoption ladder and how many days are left; "your levers" = NUDGE / DO NOTHING / PUSH; "the dice you don't control" = the Adoption Coin and the Conversion Wheel. It animates one harmless example: click NUDGE, watch the coin flip and a rung maybe light up, watch a day tick off. **Takeaway:** the controls and the read-outs. **Manager framing:** "you are the growth PM running this account."

### 2. Playtest - you run it
The learner *is* the decision-maker for one full trial: they click levers day by day and feel the randomness bite. They will discover the trap firsthand — many will PUSH a cold user early, watch the Conversion Wheel land on the big red ABANDON wedge, and eat the −5. A running tape shows each day's situation, lever, dice result, and reward, ending in CONVERT / ABANDON / EXPIRY with the total payoff. **Takeaway:** outcomes are stochastic; the same lever feels great or terrible depending on the situation. **Manager framing:** "your gut playbook, stress-tested — notice the early paywall backfiring."

### 3. Formalization - what makes this an MDP
Now name the four parts over the game they just played. **State `s`** = (adoption tier, days-left) — the situation. **Action `a`** ∈ {NUDGE, NOTHING, PUSH} — the lever. **Transition `P(s′, r | s, a)`** = the Adoption Coin and Conversion Wheel — the part you don't control, with its odds. **Reward `r`** = −1 nudge / 0 nothing / +20 convert / −5 abandon / 0 expire — the payoff signal. Each is revealed by highlighting the on-screen element it corresponds to. **Takeaway:** the tuple `⟨S, A, P, R⟩`. **Manager framing:** "every business decision-under-uncertainty has these same four parts; we are just writing them down."

### 4. Policy - a rule from states to actions
Define a **policy `π`: a rule that says, for every situation, which lever to pull** — your SOP / playbook. Crucial line: "when you played, you *were* a policy, even if an inconsistent one." Show two hand-policies painted onto the 5×5 board: **Always-Push** (gold everywhere) and **Always-Nudge** (teal everywhere), then a sensible hand-crafted one ("nudge while cold, push once hooked"). The learner can click any cell to see what each policy would do there. **Takeaway:** `π: S → A`; a policy is a *full map* over situations, not a single choice. **Manager framing:** "a playbook isn't one decision — it's the rule you'd hand a new hire for every situation they'll face."

### 5. Trajectory
Replay one trial as an explicit sequence of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)` running until a terminal. The rollout tape from scene 2 is relabelled with capital letters to stress these are *random* until they happen — a different coin/wheel result gives a different tape. **Takeaway:** a run is a sequence `τ`; the capitals mean "random until realized." **Manager framing:** "one customer's journey is one sample path; run the same playbook on the next user and you get a different path."

### 6. Return G_t
Define the **return** `G_i(τ) = Σ_{j≥i} r_j` — the payoff summed over the rest of the trial, not just today's. Fix a start state and one lever, then run it many times; show the **histogram of returns**: e.g. PUSH on a mid-adoption user yields a spike at +20 (BUY), a cluster of small/zero outcomes (IGNORE then later), and a −5 tail (ABANDON). The spread is the point. **Takeaway:** `G` is a random number with a *distribution*; we care about its long-run average. **Manager framing:** "ROI isn't one number — it's a distribution across customers; a good lever wins *on average over time*, and you must respect the downside tail."

### 7. Optimal action-value Q*(s,a)
Define **`Q*(s, a) = max E[G_i(τ)]`** — the true long-run value of pulling lever `a` in situation `s`, *assuming you play smart afterward*. Pick one Trial Card (say tier ACTIVATED) and show a clean two-column table: `action a | Q*(s,a)` with the argmax **starred** (PUSH ≈ +20 ★). Then flip to a cold-user card: NUDGE is starred, PUSH is negative. The contrast between the two cards is the whole lesson. **Takeaway:** `Q*` ranks levers per situation; the star is the best move there. **Manager framing:** "the honest, fully-loaded value of each lever for this exact customer — the number you wish you had on every account."

### 8. Bellman optimality equation
Reveal the recursive definition: **`Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]`** — today's payoff plus the best you can do from wherever the dice land you. Animate it on one cell: from (tier 3, day 2), PUSH = (BUY → +20) or (IGNORE → land in (tier 3, day 1) and play best there) or (ABANDON → −5), averaged by the wheel's odds. **Takeaway:** value today is *this reward* plus the *value of the next situation, played optimally* — a self-referential definition. **Manager framing:** "the worth of a move = its immediate payoff plus the worth of the position it leaves you in. Same logic as any multi-step plan."

### 9. Dynamic programming - fill Q*
Because the trial has a hard deadline, we solve it **right-to-left**: the last-day column (days = 1) is trivial — every non-terminal next state just expires at 0, so each Q-value is one line of arithmetic — and each earlier column is computed from the column to its right via the Bellman equation. Watch the 5×5 Q-grid **fill in column by column**, day 1 → day 5, the starred optimal lever appearing in each cell until the full **staircase** emerges: a teal NUDGE region top-left, a gold PUSH region on the right and top, a grey corner. **Takeaway:** if you *know* `P` (the dice odds), you can compute the optimal playbook exactly — here by backward induction. **Manager framing:** "with a perfect model of how customers respond, you could hand-compute the optimal playbook for every situation — and you can literally watch it being built."

### 10. Why DP does not scale
Two blunt cards. **(a) You rarely *know* `P`.** We *assumed* the Adoption Coin is 50/50 and the Conversion Wheel's wedges by tier — in reality nobody hands you those odds; they differ by segment, channel, and season, and they drift. **(b) Real state spaces explode.** Our board is 25 cells because we kept two coarse axes; add plan type, company size, referral source, the last three features touched, weekday — and the grid blows past anything you could enumerate or hand-fill. **Takeaway:** DP is the gold standard *when it applies*, and it usually doesn't. **Manager framing:** "you never get the true response curves, and the real customer space is astronomically larger than any spreadsheet — so 'just compute it' is off the table."

### 11. SARSA - learn Q* by playing
Derive the fix from Bellman: replace the unknown expectation with **one observed sample** — pull a lever, see the dice, see the reward, see the next situation and next lever, and nudge the estimate toward what you saw: `Q(s,a) ← Q(s,a) + α[ r + Q(s′,a′) − Q(s,a) ]`. Introduce **ε** as the discipline of occasionally trying an unproven lever to keep learning. Run a live demo: an empty Q-grid fills in from simulated trials, the policy staircase emerging trial by trial, with a convergence bar showing it approaching the DP oracle from scene 9 — *without ever being told the dice odds*. **Takeaway:** learn the playbook from experience, one trial at a time; explore a little to avoid getting stuck. **Manager framing:** "you don't need the true response curves — run many small experiments, watch what converts, and let the playbook learn itself; budget a little 'try the unproven option' to keep improving."

### 12. Recap
One card per concept, each tied back to the trial. **MDP** = the situation/lever/dice/payoff frame. **Policy** = your playbook over every situation. **Return** = payoff summed over the whole trial, as a distribution. **Q\*** = the honest long-run value of each lever per situation. **DP** = compute it exactly *if* you know the world (you usually don't). **SARSA** = learn it from experience with a dash of exploration. Close: "You've learned the bones — the same frame fits pricing, retention, inventory, and every other call you make under uncertainty." **Manager framing:** the vocabulary is now yours; the next time someone says "should we push the upgrade now?", you have a structured answer.

## Numbers (concrete, small)

**States:** tier ∈ {0=none, 1, 2, 3, 4=ACTIVATED}, days ∈ {1, 2, 3, 4, 5}. Terminals: CONVERT (+20), ABANDON (−5), EXPIRY (0 when days hits 0). Discount γ = 1 (the trial is short; no need to discount within five days).

**Actions & transitions:**
- **DO NOTHING** — reward 0; deterministic: (tier, days) → (tier, days−1).
- **ONBOARD NUDGE** — reward −1; **Adoption Coin** p = ½: (tier, days) → (tier+1, days−1) on heads, (tier, days−1) on tails (at tier 4 it just stays tier 4). One fair coin keeps every value hand-computable.
- **PAYWALL PUSH** — reward 0 on the push itself; **Conversion Wheel** by tier, (p_BUY, p_IGNORE, p_ABANDON): tier 0 → (0, ½, ½); tier 1 → (.2, .6, .2); tier 2 → (.4, .5, .1); tier 3 → (.6, .4, 0); tier 4 → (.8, .2, 0). BUY → CONVERT (+20); IGNORE → (tier, days−1); ABANDON → (−5). Willingness-to-pay rises with adoption; the early-push ABANDON risk falls to zero only once the user is genuinely hooked.

**Hand-computable check — the last-day column (days = 1)** is one multiplication each, since every non-terminal next state expires at 0:
- tier 0: PUSH = 0·20 + ½·(−5) = **−2.5**; NUDGE = −1; NOTHING = 0 → **best DO NOTHING (0)**.
- tier 1: PUSH = .2·20 + .2·(−5) = **+3.0** → best PUSH.
- tier 2: PUSH = .4·20 + .1·(−5) = **+7.5** → best PUSH.
- tier 3: PUSH = .6·20 = **+12.0** → best PUSH.
- tier 4: PUSH = .8·20 = **+16.0** → best PUSH.

Backward induction then fills the rest (each cell uses only the column to its right). The resulting **optimal-lever staircase** (rows tier 4→0, columns days 5→1):

| tier \ days | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|
| **4 = ACTIVATED** | PUSH | PUSH | PUSH | PUSH | PUSH |
| **3** | PUSH | PUSH | PUSH | PUSH | PUSH |
| **2** | NUDGE | NUDGE | PUSH | PUSH | PUSH |
| **1** | NUDGE | NUDGE | NUDGE | PUSH | PUSH |
| **0 = none** | NUDGE | NUDGE | NUDGE | NUDGE | NOTHING |

**Example Q\* intuitions:**
1. **The headline flip (adoption axis), day 5.** `Q*((tier 0, 5), PUSH) ≈ −0.8` (the worst lever in that cell — it courts the ABANDON wedge) while `Q*((tier 0, 5), NUDGE) ≈ +5.2` (the star). The *same* PUSH at tier 4 is `≈ +20` and is the star. One lever, opposite verdict — the situation decides.
2. **The time-axis flip, tier 2.** On days 5–4 the star is NUDGE (`Q*((tier 2, 5), NUDGE) ≈ 16.2`, beating PUSH's ≈ 16.0 — barely, so "build value first" wins while time remains); by day 3 PUSH overtakes (`≈ 13.1` vs NUDGE's ≈ 13.0) and stays best — "you're out of runway, you must ask."
3. **All three levers are optimal somewhere.** NUDGE owns the cold-but-early top-left, PUSH owns the hooked / late-clock region, and DO NOTHING wins exactly one dead cell — (tier 0, day 1) — where nudging only burns −1 with no time to pay off and pushing only risks the ABANDON penalty, so the value-maximizing move is to spend nothing (value 0). That single grey cell is a nice talking point: sometimes the best lever is to not spend.

## Manager translation of the RL ideas

- **State = the situation now** — where this user sits on the adoption ladder and how much trial time is left.
- **Action = the lever** — nudge, hold, or ask for the sale.
- **Policy = the playbook / SOP** — the rule you'd hand a new growth hire covering *every* situation, not a one-off call.
- **Return = payoff summed over time** — lifetime value of the outcome minus the costs along the way, viewed as a distribution across customers, downside tail included.
- **Stochastic transition = the part you don't control** — whether a nudge lands, whether a push converts; you set the lever, the customer (the coin and the wheel) decides.
- **Q\* = the honest long-run value of a lever in a situation, assuming you play smart afterward** — the number that tells you when "ask now" beats "build more value first."
- **Exploration (ε) = try the unproven option to learn** — deliberately spend a slice of your trials testing levers that don't look best yet, so your playbook keeps improving instead of ossifying around last quarter's habits.
- **DP = if you had a perfect model of customer response, you could compute the optimal playbook exactly** — beautiful, and here you watch it built by backward induction.
- **Why DP fails = you never have the true response curves, and the real customer space is far too big to enumerate** — which is exactly why real teams run experiments.
- **SARSA / model-free learning = learn the playbook from experience** — many small experiments: pull a lever, see the result, adjust the estimate, repeat, and converge toward the same answer DP would give without ever being handed the odds.

## Risks / open questions

- **Finite horizon → no single stationary policy.** Because the clock counts down, the optimal lever depends on days-left, so the Q-table is genuinely per-(tier, day) and the "DP" scene is *backward induction*, not the repeated whole-grid sweeps of the Pokemon original. This is great for the "the answer changes as the deadline nears" story, but the DP-fill animation should sweep **column by column (day 1 → day 5)** rather than flooding from a terminal region, and the script must be clear that each column is final once filled. (Mitigation if a stationary version is wanted: drop the clock to a single "trial pressure" flag, but that costs the vivid time-axis flip — not recommended.)
- **The day-5, tier-2 flip is close** (NUDGE 16.2 vs PUSH 16.0). That razor's-edge cell is pedagogically lovely ("it's genuinely a close call") but fragile to tuning; if a crisper boundary is wanted, nudging the tier-2 wheel slightly toward IGNORE widens the NUDGE region without breaking the staircase. Worth deciding before build.
- **SARSA on a finite-horizon MDP** must include days-left in the state for the learned Q to match the DP oracle (otherwise it averages over horizons and won't converge to the staircase). The live-demo convergence bar should compare against the backward-induction table, state-for-state.
- **"DO NOTHING is optimal" in exactly one cell** is a delightful insight but could read as a bug to a skeptical viewer ("why would the best move be nothing?"). The recap should pre-empt it: with no runway and no adoption, every spend has negative expected value, so 0 wins — a real and intuitive business lesson, not a glitch.
- **Reward calibration is illustrative, not empirical.** +20 / −5 / −1 are chosen for clean hand-arithmetic and a clear twist; the proposal should flag that the *shape* (push-early-hurts, value-first-then-ask) is the lesson, not the literal magnitudes, so no manager walks away thinking −5 is a measured churn cost.

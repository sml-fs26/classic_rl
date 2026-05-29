# Gambler's Ruin

> You must double a stake to a hard $10 target against a coin rigged against you — and the smartest bet size zig-zags up and down with how much cash you hold.

## Why this lands with managers

Every manager has faced a situation where the odds are quietly against them and there is a hard line they *must* clear: a turnaround that has to hit a survival number before the cash runway burns out, a fund that must reach a buffer before a margin call, a project that has to clear a go/no-go threshold by a fixed gate. The instinct is to play it safe and grind forward in small, careful steps. This example shows — concretely, on one screen, with no math literacy required — that when the odds are *unfavorable*, small careful steps are often the *worst* thing you can do, because each extra step is one more turn for the rigged coin to grind you down. The counterintuitive answer is that the right bet size is not a single habit; it **changes with your situation**, betting bold in the dangerous middle and timid only near the edges. That "the right lever depends on where you stand" is the entire lesson of decision-making under uncertainty, compressed into an eleven-rung ladder and a tilted coin.

## The MDP at a glance

- **State (S):** the situation right now = your **current capital in whole dollars**, `s ∈ {0, 1, 2, …, 10}` — **11 states**. `s = 0` (RUIN) and `s = 10` (GOAL) are terminal, leaving **9 interior states** you actually decide from. The whole Q-table is **9 rows on one screen**, and because we cap the target at $10 (not the textbook $100), every number is hand-checkable.
- **Actions (A):** the **stake size** — bet **$1**, **$2**, or **$3** — clamped so you can never bet more than you hold (`a ≤ s`) nor more than you need to reach the goal (`a ≤ 10 − s`). Three clean levers per situation: timid, medium, bold.
- **Transition (P) — the visible dice:** a single **biased coin**, drawn on screen tilted, wearing a **"40 / 60" odds badge**. Each turn you set a stake, then **flip**: **heads (40%)** → capital `+a`, the token climbs the ladder; **tails (60%)** → capital `−a`, the token drops. The coin animation *is* the randomness — no hidden model, the bias is printed on the coin face.
- **Reward (R):** sparse and bounded. **+1 the instant you reach $10**, **0 on ruin**, **0 on every other step**; no discount (`γ = 1`). Because the only payoff is a +1 at the goal, the **return equals the probability of eventually hitting the goal** — so every Q-value is literally a **win-probability between 0 and 1**, the most manager-legible number imaginable.
- **Terminal:** the episode ends at **$0 (ruin, a loss)** or **$10 (goal, a win)**. Episodic, short, always terminates.
- **The twist (state-dependent optimal action) — the "evolution" analogue:** with an *unfavorable* coin (`p = 0.4 < 0.5`) the optimal stake is famously **non-monotone in capital**. It does not rise smoothly and it does not sit at one threshold — it **zig-zags**: timid at the bottom, bold through the dangerous middle, then forced back to timid near the goal. The best lever literally changes rung by rung as you climb, and the colour overlay paints a *staircase that refuses to climb straight*. Crucially, flip the coin to *favorable* (`p ≥ 0.5`) and the whole pattern collapses to "always bet $1" — proving the bold middle is a direct consequence of the odds being against you. That contrast is the pedagogical jewel.
- **State-space size:** 11 states (9 playable). It fits trivially on one screen as a vertical ladder, *and* value iteration converges to three-decimal stability in about **19 sweeps** (exactly in 85, but it *looks* done in under 20), so an instructor can recompute any cell by hand.

## Visual language

The recurring **state-icon is a vertical "cash ladder"**: eleven rungs stacked from **$0 at the bottom** to **$10 at the top**, with a single bright **coin token** resting on the rung equal to your current capital. The two ends are terminal caps: **$0 is a dark "RUIN" slab** (cracked, greyed), **$10 is a gold "GOAL" plate** (glowing). This same ladder appears in every scene so the learner builds one mental picture: *how far from the cliff, how close to the prize*. The board for the Q-table and policy scenes is simply this ladder widened into rows — one row per capital level — so "the state grid" and "the state icon" are the *same object*, which keeps the mental load tiny.

The three levers are **stake chips** colour-coded by the editorial categorical palette: **BET $1** in calm blue (`#2f6cb1`, "timid"), **BET $2** in amber (`#c08a3e`, "medium"), **BET $3** in burnt orange (`#a05a2c`, "bold"). The optimal-stake overlay paints each ladder rung with its winning chip colour, so the optimal policy reads as a **column of colours that zig-zags** — blue, amber, orange, orange, orange, orange, orange, amber, blue from $1 up to $9 — the visual punchline. Greyed-out chips show where a stake is clamped (you cannot bet $3 when you hold only $2, or when you are $1 from goal).

The **coin flip** is the signature animation: a tilted coin with a **40/60 odds badge** spins and lands; **heads** flashes green and the token *climbs* `a` rungs with a soft chime; **tails** flashes red and the token *slides down* `a` rungs with a low thud. Hitting the gold $10 plate triggers a **"+1 / GOAL"** burst; hitting the dark $0 slab triggers a muted **"RUIN"** crack. A small **odds slider** (the coin's win-probability `p`) lets the lecturer drag the bias across 0.5 and watch the colour overlay flip between "zig-zag bold" and "uniform timid." The running **return** tape and a win/loss counter sit beside the ladder in mono type. Light mode (cream `#f9f7f1`, ink `#1a1a1a`) is the lecture default; the math lives in bordered KaTeX `.formula-block` cards so the notation reads as a different kind of in-game text box.

## Scene-by-scene plan

### 0. Title / hook
Full-bleed title card: the cash ladder rising from a dark **RUIN** slab to a glowing gold **$10 GOAL**, a coin token sitting halfway, and a tilted coin spinning with its **40/60** badge. Tagline: *"Double your stake to $10 — but the coin is rigged against you."* A single **START** prompt. **Manager framing:** "You have a hard target you must hit and the odds are not on your side. Today you'll see why *how much you bet* should change with *how much you hold* — and why playing it safe can be the riskiest move of all." One click drops the token onto a fresh starting rung.

### 1. Tutorial - how to play
A guided panel walks the controls with zero theory: here is your **capital** (the rung your token sits on), here are the **three stake chips** ($1 / $2 / $3) you can pull, here is the **biased coin** that decides each flip, and here are the two ends — **RUIN at $0**, **GOAL at $10**. The learner is shown one slow demo flip: place **BET $2** at $5, the coin spins, lands **tails**, the token slides to $3 with a thud. **Takeaway/notation:** vocabulary only — *capital* (the situation), *stake* (the lever), *the flip* (the part you don't control), *ruin / goal* (the terminals). **Manager framing:** "This is your decision, the thing you can't control, and the two ways it can end — laid out so you can read your whole position at a glance."

### 2. Playtest - you run it
The learner *is* the gambler. Starting at, say, **$5**, they pick a stake each turn, flip the coin, and feel the swing — a bold $3 win rockets you to $8, two unlucky tails wipe a careful position to ruin. They play to the goal or to ruin, then see the outcome. Most first-time players grind with small safe bets and **lose**, because the unfavorable coin has many turns to bite. **Takeaway:** the stochastic outcome is *felt*, not described; two identical openings end very differently, and "play it safe" quietly loses. **Manager framing:** "You just ran it by gut. Notice you were already following *some* betting rule — and notice how often the careful rule got ground down. Hold that thought."

### 3. Formalization - what makes this an MDP
The four parts slide in over the ladder the learner just played. **State** `s ∈ {0,…,10}`: current capital, shown as the token's rung. **Action** `a ∈ {1, 2, 3}` (clamped to what you hold and what you need). **Transition** `P(s', r | s, a)`: the coin — with probability `p = 0.4` you go to `s + a`, with `1 − p = 0.6` to `s − a`. **Reward** `r`: `+1` only on landing exactly at `$10`, `0` everywhere else. **Takeaway/notation:** the 4-tuple `(S, A, P, R)`. **Manager framing:** "Your gut playthrough was an MDP all along: the *situation* (your cash), the *lever* (your stake), the *part you don't control* (the coin), and the *payoff* (hitting target)."

### 4. Policy - a rule from states to actions
A **policy** `π: S → A` is a complete betting playbook — one stake pre-assigned to *every* rung of the ladder. The scene paints two hand-policies as coloured columns: **(a) "Always BET $1"** — the whole ladder blue, the cautious default most people reach for; **(b) "Always go BOLD"** — every rung orange (BET $3, clamped near the edges). The learner sees a policy as a colour map over the ladder, *before* anyone says which is better. **Takeaway/notation:** `π(s)` is *the stake you place at capital s*; "when you played in scene 2, you *were* a policy — you just hadn't written it down." **Manager framing:** "A policy is your SOP — the betting rule your whole team could follow without you in the room. The rest of this is about finding the *best* column of colours."

### 5. Trajectory
One full episode replays as a tape of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …, S_T)`, capital letters because every entry was a flip-of-the-coin away before it happened. The ladder icon marches across a rollout tape — capital, stake chosen, reward (0 until the very end), next capital — until it hits GOAL or RUIN. **Takeaway/notation:** a run is a *sequence*, `τ`; the same policy from the same $5 start produces a *different* `τ` every time. **Manager framing:** "One attempt at the target, written down move by move — and it would have read completely differently if the coin had fallen the other way even once."

### 6. Return G_t
The return is the payoff summed from a point onward: `G_i(τ) = Σ_{j ≥ i} r_j`. Here that sum is **0 or 1** — you either reach the goal eventually (1) or you don't (0) — so the *expected* return is exactly a **win-probability**. The scene fixes a start (**$5**) and one chosen first stake, runs it many times, and stacks the 0/1 outcomes into a **bar**: starting bold from $5 lands at the goal about **32%** of the time; starting timid from $5 lands a hair *lower*. **Takeaway/notation:** `G_i` is a *random* 0/1 number; its average *is* your odds — show the spread, not a single run. **Manager framing:** "Don't judge a strategy by one attempt. The payoff is a coin-flip-of-coin-flips — what matters is the probability you hit target across many tries."

### 7. Optimal action-value Q*(s,a)
`Q*(s, a) = max_π E[G_i(τ)]` — the true long-run value of placing stake `a` at capital `s`, *assuming you bet smart on every flip afterward*. Because returns are win-probabilities, **each Q\* value is your honest odds of reaching $10**. The scene shows the ladder icon for one capital beside a clean **two-column table (stake a | Q\*(s, a))**, the best row **starred**. At **$3**: BET $1 → 0.154, BET $2 → 0.150, **BET $3 → 0.166 ★**. At **$5**: BET $1 → 0.311, BET $2 → 0.318, **BET $3 → 0.318 ★** (a genuine tie — flagged on screen). At **$8**: BET $1 → 0.643, **BET $2 → 0.649 ★**. **Takeaway/notation:** `Q*` ranks the stakes *in this situation*; argmax is the optimal stake there, and the star **moves** as you climb. **Manager framing:** "The honest probability each stake gives you of hitting target, played out smart to the end — and the best stake is not the same at $3, $5, and $8."

### 8. Bellman optimality equation
The recursive definition appears as a formula card: `Q*(s, a) = E[ R + max_{a'} Q*(S', a') ]`. Read in plain English over the ladder: *the value of a stake now = the chance it pays off this flip, plus the value of wherever it leaves you, assuming you again place the best stake there.* A worked one-step backup on an edge rung makes it concrete — at **$1**, BET $1 wins to $2 or loses to ruin, and ruin is worth 0, so `Q*($1,1) = 0.4 · V*($2) + 0.6 · 0 = 0.4 · 0.0964 = 0.0386`. At **$9**, BET $1 wins straight to the goal: `Q*($9,1) = 0.4 · 1 + 0.6 · V*($8) = 0.4 + 0.6 · 0.649 = 0.7896`. **Takeaway/notation:** today's value is *defined in terms of* the value of where the flip lands you. **Manager framing:** "Smart betting is recursive: this turn's right stake depends on how valuable each landing spot is — which depends on the right stake *there*."

### 9. Dynamic programming - fill Q*
Because the coin's bias is *known here* (it is printed on the coin), we compute `Q*` exactly by sweeping the Bellman backup. The ladder fills **from the goal outward**: in the first sweep only rungs that can reach $10 in one flip light up (`$7,$8,$9 → 0.4`); each later sweep pushes value *down* the ladder toward ruin (`$3,$2` get value by sweep 3, the bottom rungs by sweep 4), settling to three-decimal stability in **~19 sweeps**. As each rung locks in, the optimal-stake overlay paints it — and the **zig-zag of colours** (blue, amber, then a band of orange, then amber, blue) emerges before the learner's eyes. **Takeaway/notation:** known `P` ⇒ exact `Q*` by repeated backups to a fixed point. **Manager framing:** "If you truly knew the odds, you could compute the entire optimal betting playbook — exactly, no guessing. Watch the bold-in-the-middle pattern draw itself, and watch value spread from the prize back toward the cliff."

### 10. Why DP does not scale
Two reasons, on a two-panel card. **(a) You rarely know the coin.** This toy prints `p = 0.4` on the coin face; in the real world the "win probability" of a turnaround step, a trade, or a project gate depends on competitors, markets, and luck — nobody hands you the true odds. **(b) The ladder explodes.** Eleven rungs and three stakes is a screen; a real decision has capital *and* time *and* market regime *and* commitments — millions of situations, with far more than three levers each. Enumerating and sweeping them all is hopeless. **Takeaway:** DP is the *ideal*, not the *method*. **Manager framing:** "Perfect-odds planning is a fantasy: you never truly know your win probability, and the real problem is far too big to solve cell by cell. So how does anyone actually find the playbook?"

### 11. SARSA - learn Q* by playing
We *learn* the table from experience instead of computing it. Derive the update from Bellman by replacing the expectation with **one observed flip**: after staking `a` at `s`, seeing reward `r`, landing at `s'` and choosing next stake `a'`, nudge `Q(s,a)` toward `r + Q(s', a')`. Add **ε** — occasionally place an *unproven* stake to keep learning, instead of always exploiting today's best guess. The scene runs live: the gambler plays attempt after attempt with **no knowledge of the coin's bias**, the Q-ladder fills in, and its colour overlay **converges to the DP oracle** from scene 9 — the same bold-middle zig-zag — tracked by a convergence bar. **Takeaway/notation:** model-free learning — flip, outcome, adjust; `ε` is the explore/exploit dial. **Manager framing:** "Run many small attempts, learn from how they actually turned out, and the optimal playbook emerges on its own — landing on the very answer the perfect-odds calculation gave, without ever being told the odds."

### 12. Recap
Six cards, one concept each, in the cash-ladder visual language. **MDP** — your capital, your stake, the coin you don't control, the +1 at goal. **Policy** — your betting SOP, a stake for every rung. **Return `G_t`** — a 0/1 outcome whose average *is* your odds of hitting target. **Q\*** — the honest win-probability of each stake, the star that zig-zags up the ladder. **DP** — the exact playbook *if* you knew the coin. **SARSA** — learn the playbook from experience when you don't. Closing line: *"You've learned the bones of decision-making under unfavorable odds — and of reinforcement learning."* **Manager framing:** the boardroom-ready summary, and the bridge from a coin-and-ladder to any high-stakes target you must hit against the odds.

## Numbers (concrete, small)

**State set.** `s ∈ {0, 1, …, 10}` → 11 states. Terminal: `$0` (ruin, value 0) and `$10` (goal, value 1). 9 playable interior rungs.

**Actions + the visible coin.** Stakes `a ∈ {1, 2, 3}`, clamped to `a ≤ s` and `a ≤ 10 − s`. Coin: **heads (win) w.p. p = 0.4 → s + a; tails (loss) w.p. 0.6 → s − a.** Discount `γ = 1` (every episode terminates, so returns are bounded without it).

**Reward.** `r = +1` on reaching `$10`, `0` otherwise. Hence `V*(s) = Q*(s, π*(s))` is **exactly the probability of eventually reaching the goal from `s`**.

**Which stakes are even available** (the rest are clamped, greyed on screen):

| Capital `s` | Stakes you can place |
|---|---|
| $1 | $1 only |
| $2 | $1, $2 |
| $3 – $7 | $1, $2, $3 (free choice) |
| $8 | $1, $2 |
| $9 | $1 only |

**The exact optimal values and policy** (value iteration, `p = 0.4`; `V*` are exact win-probabilities). Stars mark the optimal stake; ties broken toward the larger bet:

```
 s  | bet$1    bet$2    bet$3   | V*(s)   | best stake
 1  | 0.0386*    --       --    | 0.0386  | $1   (timid — forced)
 2  | 0.0896   0.0964*    --    | 0.0964  | $2   (forced ceiling)
 3  | 0.1542   0.1502   0.1662* | 0.1662  | $3   (BOLD)
 4  | 0.2268   0.2241   0.2410* | 0.2410  | $3   (BOLD)
 5  | 0.3108   0.3176   0.3176* | 0.3176  | $3 ≡ $2 (TIE — bold or medium)
 6  | 0.4084   0.4043   0.4156* | 0.4156  | $3   (BOLD)
 7  | 0.5091   0.5064   0.5446* | 0.5446  | $3   (BOLD)
 8  | 0.6426   0.6494*    --    | 0.6494  | $2   (forced ceiling)
 9  | 0.7896*    --       --    | 0.7896  | $1   (timid — forced, you only need $1)
```

The optimal-stake column reading $1→$9: **$1, $2, $3, $3, ($3≡$2), $3, $3, $2, $1** — a clear **non-monotone zig-zag**: timid at the edges, **bold through the middle**, never a single clean threshold.

**Hand-computable checks (one line each, both edge rungs are one flip from a terminal):**
- `Q*($1, 1) = 0.4 · V*($2) + 0.6 · 0 = 0.4 · 0.0964 = 0.0386` ✓ (matches `V*($1)`).
- `Q*($9, 1) = 0.4 · 1 + 0.6 · V*($8) = 0.4 + 0.6 · 0.6494 = 0.7896` ✓ (matches `V*($9)`).

**Three `Q*` intuitions a manager can feel:**
1. **At $5 → go BOLD (bet $3), not timid.** Bold gives ~0.318 odds, timid only ~0.311. Against a coin that bites you 60% of the time, *fewer, bigger* bets give the unfavorable coin fewer chances to grind you to ruin. *When the odds are against you, don't dawdle.*
2. **At $9 → bet $1 (timid), and it's not even close.** You only need one more dollar to win — staking more would risk the lead for nothing. Odds of hitting target from here: ~0.79. *When you're almost home, protect the lead.*
3. **The whole pattern inverts with a fair-or-better coin.** Drag the odds slider to `p ≥ 0.55` and the optimal policy collapses to **bet $1 on every rung** — with the odds on your side, you *want* many small bets so the favorable coin compounds in your favour. *The bold-middle strategy is a direct symptom of bad odds, not a universal rule.*

## Manager translation of the RL ideas

- **State = the situation now** → how much capital you currently hold (your rung on the ladder).
- **Action = the lever** → the stake you place this turn: $1 (timid), $2 (medium), or $3 (bold).
- **Policy = the playbook / SOP** → a pre-set stake for every capital level, the betting rule your team follows without you.
- **Return = payoff summed over time** → here a 0/1 outcome (miss / hit the target); its average is your *probability of hitting target*, not this turn's swing.
- **Stochastic transition = the part you don't control** → the biased coin; you set the stake, the coin decides whether you climb or fall.
- **Exploration (ε) = try the unproven option to learn** → occasionally place a stake you're unsure about, to discover its true odds instead of always banking on today's favourite.
- **Q\* = the honest long-run value of a lever in a situation** → assuming you keep betting smart afterward; because the payoff is just "hit the goal," `Q*` *is* your win-probability — the star that zig-zags up the ladder is the insight.
- **DP caveat = perfect-odds planning is a fantasy** → you almost never know your true win probability (reason a), and the real decision space is far too large to enumerate (reason b).
- **Model-free learning (SARSA) = learn the playbook from experience** → run many attempts, adjust from how they actually turned out, and converge on the optimal betting SOP — landing on the same answer the perfect-odds calculation gives, without ever knowing the coin.

## Risks / open questions

- **The $5 tie is real and structural — embrace it, don't hide it.** Betting $2 and betting $3 at $5 give *identical* win-probability (0.317572…), verified to differ by ~5·10⁻¹⁷ (pure floating-point zero). This is a property of the geometry, not a precompute bug. It is *pedagogically valuable* ("sometimes two levers are genuinely equivalent"), but the build must (a) adopt a fixed tie-break rule (recommend "larger stake wins" so the middle reads as a clean bold band), (b) label the $5 row as a tie on screen, and (c) assert in precompute that the only exact tie is at $5 so a snapshot diff doesn't flap.
- **The edge rungs are clamp-forced, the middle is a free choice — the narration must say so.** At $1/$2/$8/$9 the "timid" optimum is partly *mechanical* (you cannot bet $3 with $2 in hand, and at $9 you only need $1). The genuinely strategic, free-choice non-monotonicity lives at $3–$7 (bold $3 beats timid $1 there even though all three stakes are legal). If the script implies the *whole* zig-zag is a strategic choice, a sharp manager will rightly object. Frame it honestly: bold-in-the-middle is the strategic insight; timid-at-the-edges is part insight (at $9), part arithmetic (at $1).
- **"Double the stake to $10" vs the textbook "$100."** Capping the goal at $10 is what makes the table fit on one screen and the numbers hand-checkable — but it also shrinks the classic dramatic sawtooth into a single bold band. That is the right trade for this audience; just don't over-promise a "wild" sawtooth. The honest headline is "the best bet is non-monotone — small, then big, then small," which the data fully supports.
- **Bet sizes {1,2,3} vs the textbook "any amount up to min(s, N−s)."** Restricting to three stakes is required to draw three Q-values per row (the Pokémon "≤3 actions" constraint). It does mildly distort the unconstrained gambler's optimum, but it *preserves* the non-monotone qualitative story and keeps the table legible. Worth a one-line caption that we discretised the stake for clarity.
- **`p = 0.4` is the recommended bias; verify the odds slider behaves at the boundaries.** The zig-zag is stable for every sub-fair `p` tested (0.25, 0.35, 0.40, 0.45); at `p = 0.5` it gets knife-edge-y, and at `p ≥ 0.55` it cleanly collapses to all-$1. Pin `p = 0.4` as the default, and in the slider scene verify the overlay flips crisply to uniform blue once `p` crosses ~0.5 — that flip *is* the "bad odds cause bold play" lesson and must read clearly at projector scale.
- **Reward `+1` vs `+10` at the goal.** `+1` makes every Q-value a probability in [0,1], which is the cleanest possible thing to show managers ("these are your odds"). A `+10` payoff is purely cosmetic (it rescales every cell by 10 and changes nothing about the policy); recommend keeping `+1` and labelling the column "win probability," but the build could offer `+10` as a toggle if the lecturer prefers dollar-flavoured numbers.
- **Framing the theme for a boardroom.** "Gambler's Ruin" risks sounding like a casino lark. Lead every scene with the *business* gloss — a hard target you must clear against unfavorable odds (turnaround survival number, margin buffer, project gate) — so the coin-and-ladder reads as a model of high-stakes thresholds, not a roulette tutorial. Confirm the preferred real-world anchor with the lecturer before building.

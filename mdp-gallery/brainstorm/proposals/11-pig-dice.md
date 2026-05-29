# Press Your Luck

> Keep rolling to pile up points or bank them before a 1 wipes the turn — and whether to push depends on both your pot and the scoreboard.

## Why this lands with managers

Every manager knows the feeling of a winning streak that could turn at any moment: the deal that keeps getting sweeter if you hold out, the project that keeps paying off if you let it run — until one bad roll wipes the unbanked gains to zero. Press Your Luck is that feeling distilled to a single die. You keep rolling to grow a pot, but a rolled **1** erases the whole pot and ends your turn; **HOLD** banks it safely. The decision is never "is rolling good or bad" in the abstract — it is "given how much I have riding *and* whether I am ahead or behind on the scoreboard, do I push or do I lock it in?" That is a textbook sequential decision under uncertainty, and the punchline managers feel in their gut is the whole lesson: **when you are behind you rationally take more risk; when you are ahead you protect the lead.** No programming literacy required — it is one six-sided die, two buttons, and a small grid of situations where the right button visibly changes as you move across it.

## The MDP at a glance

- **State (S):** the situation right now = (**turn-pot bucket** `p ∈ {0, 1–5, 6–10, 11–15, 16–20, 21+}`) × (**standing** `c ∈ {BEHIND, EVEN, AHEAD}`). A **6 × 3 grid = 18 states** — the entire Q-table on one screen. The pot is what you have *at risk this turn but not yet banked*; the standing is whether your *banked* score trails, matches, or leads the rival's. (Bucketing the pot is what keeps the table tiny; raw scores 0–49 would be ~50 values and undrawable. The buckets are chosen around the famous break-even pot of 20.)
- **Actions (A):** two clean levers. **ROLL** (risk the pot for more) and **HOLD** (bank the pot into your score, ending your turn safely). One binary choice per situation — even simpler than Pokémon's three moves, which makes the state-dependent flip the *only* thing the learner has to track.
- **Transition (P) — the visible dice:** you press ROLL, and a literal **six-sided die tumbles on screen**. A **2–6** adds its face value to the pot and you may roll again (you move up a pot bucket). A **1** is the bust: the pot crashes to 0 with a hard shake, and the turn passes to the rival. HOLD adds the pot to your banked score, then passes the turn. The die *is* the randomness — front and centre, no hidden probabilities (each face is a flat 1/6, printed right on the die).
- **Reward (R):** the game is a **race to a target score (50 by default, 25 for a fast demo)**. The genuine reward is terminal and binary: **+1 for winning the game, 0 for losing.** So a state's value is literally a **win probability** — the most manager-legible number there is. (No per-step penalty is needed; the rival racing you is the hurry-up. A small −0.01-per-turn "tempo cost" is available as an optional slider but is off by default to keep the arithmetic clean.)
- **Terminal:** the episode ends when a player's *banked* score reaches the target (you win, or the rival wins). Your *turn* ends on HOLD or on a rolled 1 — but the game continues until someone crosses the line.
- **The twist (state-dependent optimal action) — the "evolution" analogue:** the ROLL/HOLD frontier *slides with your standing*. **When BEHIND, you roll well past a pot of 20** — desperation is rational, because banking a safe-but-small pot still leaves you losing, so you push for the catch-up. **When AHEAD, you HOLD earlier (around a pot of 14–17)** — you are winning, so you protect the lead rather than risk it on a 1. **When EVEN, you sit right on the classic break-even of ~20.** Concretely, at a fixed pot of **18** the optimal lever *flips on standing alone*: HOLD if ahead, ROLL if even or behind. Same pot, different best lever — a true state-dependent twist, not a single global threshold. This is the jewel that makes the Q-table interesting rather than uniform, and it is the documented optimal-Pig result, not an artefact.
- **State-space size:** 18 cells. It fits on one screen, the whole optimal policy is two coloured regions with a stepped seam, and (against the fixed rival below) value iteration converges in a handful of sweeps so an instructor can sanity-check the corner cells by hand.

## Visual language

The recurring **state-icon** is a small "table card": on the left, a **pot meter** — a vertical stack of glowing chips whose height shows the turn-pot bucket (empty at the bottom, a hot orange glow that climbs into a "danger" red band past 20); on the right, a **standing badge** — a two-bar mini-scoreboard (your bar vs. the rival's bar) tinted by status: **BEHIND** in cool blue, **EVEN** in neutral grey, **AHEAD** in confident green. This same icon appears in every scene, so the learner builds one mental picture: *how much is in the pot, and am I winning?*

The board is the **6 × 3 grid** — rows are pot buckets (0 at the bottom up to 21+ at the top), columns are the three standings (BEHIND | EVEN | AHEAD). The optimal-lever overlay paints each cell by its winning lever: **ROLL** cells in burnt orange (`#a05a2c`, the "push" colour), **HOLD** cells in deep blue-green (`#2f6cb1`, the "bank it" colour). The punchline reads instantly as **two regions with a staircase seam that climbs from left to right** — the frontier sits low (hold early) on the AHEAD column and high (roll on) on the BEHIND column. That climbing staircase *is* the twist, drawn.

The signature animation is **the roll**: the die leaps, tumbles with a soft clatter, and settles. On a 2–6 the pot meter pops up a bucket with a bright "+N" chip flying onto the stack; on a **1**, the whole stack collapses with a screen-shake and a muted thud as the chips grey out and slide away — the bust is felt, not just read. HOLD plays a satisfying "chunk" as the pot chips slide into the banked-score counter (mono type, top corner) and the standing badge re-tints if the lead changes hands. The running **return** sits as a tape beneath the board. Light mode (cream `#f9f7f1`, ink `#1a1a1a`, hairline cards) is the lecture default; a warm dark mode is the study companion. Math lives in bordered KaTeX `.formula-block` cards, styled as a different "in-game text box."

## Scene-by-scene plan

### 0. Title / hook
Full-bleed title card: a single die mid-tumble over a glowing pot of chips, the danger-red band pulsing at the top of the meter, tagline *"Keep rolling for more — or bank it before a 1 wipes it out."* One **PRESS START** prompt. **Manager framing:** "You are on a streak that grows if you let it ride and vanishes on one bad roll. Today you will see why knowing *when to stop* is a decision made over time, under uncertainty — and why the answer changes with the scoreboard." One click dissolves the die into the empty 6 × 3 board, teasing the situations to come. No theory yet — just the stakes.

### 1. Tutorial - how to play
A guided panel walks the controls with no math: here is your **pot meter** (what is riding this turn), here is the **standing badge** (are you ahead or behind your rival), here are the **two buttons** — ROLL and HOLD — and here is the **die** that decides each roll. The learner is shown one slow demo turn: ROLL → a 4 lands, the pot climbs to 4; ROLL → a 6, pot is 10; ROLL → a **1**, the pot crashes to zero and the turn passes with a shake. Then a clean turn that ends on HOLD, banking the pot with a chunk. **Takeaway/notation:** vocabulary only — *situation* (pot + standing), *lever* (ROLL/HOLD), *the die* (the part you do not control). **Manager framing:** "This is your decision each turn, and the thing you cannot control — laid out as a board you can read at a glance."

### 2. Playtest - you run it
The learner *is* the player. Starting from 0–0 in a race to 25 (fast mode), they press ROLL or HOLD each turn against a visible **house rival** that plays a fixed, simple rule, and feel the outcome — a euphoric run that piles the pot to 22, the gut-punch of a 1 at pot 19, the relief of banking at the right moment. They play a full game to a win or a loss. **Takeaway:** the stochastic outcome is *felt*, not described; two identical openings can end very differently, and pushing a fat pot is a real risk. **Manager framing:** "You just played by instinct. Notice you were already following *some* rule — bank around 20, but gamble harder when you were losing? Hold that thought; you were running a playbook without writing it down."

### 3. Formalization - what makes this an MDP
The four parts slide in over the board the learner just played. **State** `s = (p, c)`: pot bucket and standing, shown as the table-card icon. **Action** `a ∈ {ROLL, HOLD}`. **Transition** `P(s', r | s, a)`: ROLL resolves the die (2–6 grows the pot, 1 busts and passes the turn); HOLD banks the pot and passes the turn — the probabilities are just the six faces, printed on the die. **Reward** `r`: 0 every turn until the game ends, then +1 for a win and 0 for a loss. **Takeaway/notation:** the 4-tuple `(S, A, P, R)`. **Manager framing:** "Your instinct game was an MDP all along: the *situation*, the *lever*, the *part you do not control* (the die), and the *payoff* (did you win)."

### 4. Policy - a rule from states to actions
A **policy** `π: S → A` is a complete playbook — one lever pre-assigned to *every* cell of the 6 × 3 board. The scene paints two hand-policies as coloured maps: **(a) "Always HOLD at 20"** — ROLL (orange) on every cell with pot ≤ 20, HOLD (blue) above, identical across all three standing columns; the famous folk wisdom, drawn as a flat horizontal seam. **(b) "Scaredy-cat"** — HOLD as soon as the pot reaches 6, the whole upper board blue. **Takeaway/notation:** `π(s)` is *the lever you pull in situation s*; "when you played in scene 2, you *were* a policy — you just had not written it down." **Manager framing:** "A policy is your SOP — the rule your whole team could follow without you in the room. Notice policy (a) ignores the scoreboard entirely. The rest of this is about finding the *best* playbook — and whether ignoring the scoreboard is a mistake."

### 5. Trajectory
One full game is replayed as a tape of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …, S_T)`, capital letters because every entry was a roll of the die before it happened. The table-card icon marches left along a rollout tape — situation, lever chosen, reward (mostly 0 until the final +1), next situation — through busts and banks until someone crosses the target. **Takeaway/notation:** a run is a *sequence*, `τ`; the same policy from the same start yields a *different* `τ` every time the die falls differently. **Manager framing:** "One whole game, written down move by move — and it would have read completely differently if a single 1 had landed a turn earlier."

### 6. Return G_t
The return is the payoff summed from a point onward: `G_i(τ) = Σ_{j ≥ i} r_j`. Because reward is 0 until the terminal win/loss, `G_i` is simply **1 if this game is eventually won, 0 if lost** — so the return *is* the win/loss outcome from here on. The scene fixes one situation — say **(pot 18, EVEN)** — forces one chosen lever, and runs it hundreds of times, stacking the 0/1 outcomes into a **histogram** that collapses to a single win-rate bar. ROLL from here wins about **77%** of the time; HOLD about **76%** — close, with real spread game to game. **Takeaway/notation:** `G_i` is a *random* 0/1; its average *is* the win probability, and one game tells you almost nothing. **Manager framing:** "Do not judge a lever by one lucky game. The payoff is a *distribution* — and the honest figure is the win rate over many games, not the last result."

### 7. Optimal action-value Q*(s,a)
`Q*(s, a) = max E[G_i(τ)]` — the true long-run **win probability** of pulling lever `a` in situation `s`, *assuming you play smart every turn afterward*. The scene shows the table-card icon for one state beside a clean **two-column table (action a | Q\*(s, a))**, the best row **starred**. The headline example holds the pot at **18** and flips the standing:
- **(pot 18, BEHIND):** ROLL **0.531 ★**, HOLD 0.326 — roll, you must catch up.
- **(pot 18, EVEN):** ROLL **0.773 ★**, HOLD 0.765 — still roll, but barely.
- **(pot 18, AHEAD):** ROLL 0.909, HOLD **0.914 ★** — hold; protect the lead.

The star *moves across the standing axis at the very same pot.* **Takeaway/notation:** `Q*` ranks the two levers in *this* situation; argmax is the optimal lever there. **Manager framing:** "The honest win-odds of each lever, played out to the end — and the best lever is not the same when you are ahead as when you are behind, even with the exact same chips on the table."

### 8. Bellman optimality equation
The recursive definition appears as a formula card: `Q*(s, a) = E[ R + max_{a'} Q*(S', a') ]`. The scene reads it in plain English over the board: *the value of a lever now = whatever it pays immediately, plus the value of the situation it leaves you in next, assuming you again pull the best lever there.* A worked one-step backup on **ROLL from (pot 20, EVEN)**: with probability 1/6 the die is a 1 → the pot busts and you pass the turn (value of being even with nothing in the pot); with probability 5/6 it is 2–6 → the pot grows to the 21+ bucket and it is your move again. The arithmetic shows the famous knife-edge — at pot 20 the expected pot *gain* per roll, `(2+3+4+5+6)/6 = 3.33`, exactly equals the expected *loss* from busting, `20 × 1/6 = 3.33` — so for an even game pot 20 is the break-even point, net zero. **Takeaway/notation:** today's value is *defined in terms of* tomorrow's. **Manager framing:** "Knowing when to stop is recursive: the value of one more roll depends on the value of wherever it lands you next — and at a pot of 20 in an even game, those two forces cancel exactly."

### 9. Dynamic programming - fill Q*
Because the die's odds are *known* (a flat 1/6 each) and we pin the rival to a fixed, named rule ("the **house bot holds at 20**"), the problem becomes a single-agent MDP and we can compute `Q*` exactly by sweeping the Bellman backup. The 6 × 3 grid fills in over a few sweeps — high-pot cells (where one more roll is obviously too risky) lock to HOLD first, low-pot cells lock to ROLL, and the contested middle settles last. As cells lock, the optimal-lever overlay paints them, and the **climbing staircase seam** emerges: the HOLD region reaches *down* to ~pot 14 in the AHEAD column but only kicks in *above* pot 20 in the BEHIND column. **Takeaway/notation:** known `P` ⇒ exact `Q*` by repeated backups to a fixed point. **Manager framing:** "If you truly knew the odds and the rival's habits, you could compute the entire optimal playbook — exactly, no guessing. Watch the 'bank earlier when ahead, push harder when behind' rule draw itself."

### 10. Why DP does not scale
Two reasons, on a two-panel card. **(a) You rarely know `P` — including the rival.** Here we *assumed* the rival always holds at 20; a real opponent (or a real market, or a real competitor) does not hand you their rule, and the die in real life is demand, churn, a competitor's move — odds nobody prints for you. **(b) The board explodes.** This toy buckets the pot into 6 bins and the standing into 3; the *true* game tracks both exact scores (0–49 each) and the exact pot — tens of thousands of situations — and any richer game (more players, more dice, partial information) explodes far beyond what you can sweep cell by cell. **Takeaway:** DP is the *ideal*, not the *method*. **Manager framing:** "Perfect-odds planning is a fantasy: you never truly know the dice *or* the other player, and the real problem is far too big to compute exhaustively. So how does anyone actually find the playbook?"

### 11. SARSA - learn Q* by playing
We *learn* the table from experience instead of computing it. Derive the update from Bellman by replacing the expectation with **one observed sample**: after pulling lever `a` in `s`, seeing reward `r`, landing in `s'` and choosing the next lever `a'`, nudge `Q(s,a)` toward `r + Q(s', a')`. Add **ε** — occasionally try the lever you are *unsure* about (roll a fat pot you would normally bank, just to learn what happens) instead of always exploiting today's best guess. The scene runs live: the player grinds game after game against the rival with **no knowledge of the odds**, the Q-grid fills in, and its coloured regions **converge to the DP oracle** from scene 9 — the same climbing staircase — tracked by a convergence bar. **Takeaway/notation:** model-free learning — trial, outcome, adjust; `ε` is the explore/exploit dial. **Manager framing:** "Play many games, learn from what actually happened, and the playbook — including 'press your luck when behind, bank it when ahead' — emerges on its own, landing on the same answer the perfect-odds calculation gave, but without ever needing to know the odds."

### 12. Recap
Six cards, one concept each, in the table-card visual language. **MDP** — the situation (pot + standing), the lever (roll/bank), the part you do not control (the die), the payoff (win or lose). **Policy** — your SOP, a lever for every situation; the naive one ignores the scoreboard. **Return `G_t`** — the win/loss outcome from here, judged as a rate over many games, not one. **Q\*** — the honest win-odds of each lever, the star that *moves across the standing axis*. **DP** — the exact playbook *if* you knew the odds and the rival. **SARSA** — learn the playbook from experience when you do not. Closing line: *"You have learned when to press your luck — and the bones of reinforcement learning."* **Manager framing:** the boardroom-ready summary; the bridge from a single die to any sequential bet under uncertainty, and the durable insight that *your risk appetite should depend on whether you are ahead or behind*.

## Numbers (concrete, small)

**State set.** `s = (p, c)` with pot bucket `p ∈ {0, 1–5, 6–10, 11–15, 16–20, 21+}` and standing `c ∈ {BEHIND, EVEN, AHEAD}` → **18 states**. Terminal when a banked score reaches the target (default 50; 25 for fast demos).

**Action set + the die** (each face 1/6, printed on the die). Discount `γ = 1` (the rival's race bounds the game, so no discount needed):

| Lever | Die outcome | Effect |
|---|---|---|
| **ROLL** | 2, 3, 4, 5, or 6 (prob 5/6 total) | pot += face; you may roll again |
| **ROLL** | 1 (prob 1/6) | pot → 0; turn passes to rival (the bust) |
| **HOLD** | — | banked score += pot; turn passes to rival |

**Reward.** `r = 0` on every turn; `r = +1` on the turn you reach the target, `r = 0` if the rival reaches it first. A state's value is therefore a **win probability**.

**The hand-computable anchor (the break-even roll).** Ignore the scoreboard for a moment and ask: is one more roll worth it? One roll **gains** the average of 2–6, `(2+3+4+5+6)/6 = 20/6 = 3.33`, and **risks** busting the pot, costing `pot × 1/6`. Setting gain = risk: `3.33 = pot/6 ⇒ pot = 20`. So **pot 20 is break-even for an even game** — below it the expected gain beats the risk (ROLL), above it the risk wins (HOLD). This single line gives the whole EVEN column.

**How the scoreboard moves that anchor** (optimal play vs. a fixed "house holds at 20" rival; HOLD-first pot threshold — the smallest pot at which banking beats rolling):

```
 own score    AHEAD        EVEN         BEHIND
   ~10        hold @ 18    hold @ 21    roll on (never holds; chase the catch-up)
   ~15        hold @ 17    hold @ 21    roll to ~35
   ~20        hold @ 15    hold @ 20    roll to ~30
   ~25        hold @ 14    hold @ 19    roll to ~25
```

The frontier **slides monotonically with standing**: bank early (~14–17) when AHEAD, sit on ~20 when EVEN, and push your luck far past 20 when BEHIND. Drawn on the 6 × 3 grid this is two regions (ROLL orange / HOLD blue) with a **staircase seam that climbs from the AHEAD column to the BEHIND column** — richer than a single flat threshold, and the visual punchline.

**Three `Q*` intuitions a manager can feel** (values are win probabilities):

1. **(pot 18, AHEAD) → HOLD** (ROLL 0.909 / **HOLD 0.914**). You are winning with a healthy pot. One more roll mostly helps, but the 1-in-6 bust can hand momentum to the rival; banking nails down your edge. *Protect the lead.*
2. **(pot 18, BEHIND) → ROLL** (**ROLL 0.531** / HOLD 0.326). Same eighteen chips, but you are losing. Banking a safe 18 still leaves you behind — so you push for the catch-up even though it is risky. *Desperation is rational.*
3. **(pot 18, EVEN) → ROLL, barely** (**ROLL 0.773** / HOLD 0.765). Neck and neck: the levers are within a percentage point because you are right on the break-even of 20. *The close calls live exactly where the scoreboard is tied — which is precisely where good judgment earns its keep.*

These three rows are the same pot at three standings, and the optimal lever flips across them — the state-dependent twist in three numbers.

## Manager translation of the RL ideas

- **State = the situation now** → how much you have riding this turn (the pot) and whether you are ahead or behind (the standing).
- **Action = the lever** → ROLL (let it ride) or HOLD (bank it and lock it in).
- **Policy = the playbook / SOP** → a pre-set choice of roll-or-bank for every situation, the rule your team follows without you. A *good* policy reads the scoreboard; a naive one ignores it.
- **Return = payoff summed over time** → the eventual win or loss from here on, judged as a win rate across many games — not the result of the one game in front of you.
- **Stochastic transition = the part you do not control** → the die; you choose to roll, the die decides whether you grow the pot or bust it.
- **Exploration (ε) = try the unproven option to learn** → occasionally take the bet you would normally avoid (roll a pot you would usually bank), to discover its true value instead of always trusting today's habit.
- **Q\* = the honest long-run value of a lever in a situation** → the real win-odds of rolling vs. banking *here*, assuming you keep playing smart; the star that *moves with the scoreboard* is the whole insight.
- **DP caveat = perfect-odds planning is a fantasy** → you never truly know the dice *or* the rival's habits (reason a), and the real game is far too large to compute exhaustively (reason b).
- **Model-free learning (SARSA) = learn the playbook from experience** → play many games, adjust from what actually happened, and converge on the optimal "press when behind, bank when ahead" rule without ever owning a model of the dice or the opponent.

## Risks / open questions

- **Opponent model — the load-bearing simplification.** The clean, monotone twist (and a single-pass DP) relies on pinning the rival to a **fixed, named rule ("the house bot holds at 20")**, which makes the problem a single-agent MDP with a genuinely 2-D state. A *fully zero-sum optimal* opponent couples the value both ways — passing the turn references the opponent's value, which references yours — so the recursion no longer bottoms out into a clean backward sweep, and the same-pot ROLL/HOLD flip gets muddied by proximity-to-winning effects at high scores. **Recommendation:** commit to the fixed-rival framing, show the rival's rule on screen ("Rival: holds at 20"), and add a one-line caption that a smarter rival would shift the frontier — honest, and it sets up scene 10's "you rarely know `P`, including the other player" point perfectly.
- **Bucketing must preserve the argmax.** The true state is exact scores × exact pot; the viz buckets pot into 6 bins and standing into 3. The build's precompute must verify the *bucketed* optimal policy matches the *exact* policy on the cells we display (especially the contested EVEN column near pot 20, where ROLL and HOLD differ by under a percentage point). Pin the seed, snapshot the policy grid, and assert the staircase seam is stable, not a floating-point coin-flip.
- **Target score: 50 vs. 25.** To-50 gives a richer mid-game and a more dramatic "roll forever when far behind," but lengthens demo games. To-25 is snappier for the live SARSA scene but compresses the frontier. **Recommendation:** to-25 for the interactive scenes (2, 11) and the to-50 numbers in the static tables, with a clear label; verify the twist is qualitatively identical at both targets (it is — the frontier slides the same direction, just scaled).
- **"Standing" as three buckets vs. a continuous lead.** Collapsing the score gap to {BEHIND, EVEN, AHEAD} is what keeps the table at 18 cells, but it hides that *how far* behind matters (down by 2 is not down by 20). A caption should note the buckets are a deliberate simplification; optionally a tooltip can show the lead in points behind each badge. Do not add a fourth standing bucket — it breaks the clean two-region picture.
- **The EVEN column is intentionally a near-tie.** Several EVEN cells have ROLL and HOLD within ~0.01 (the break-even is genuinely at pot 20). That is *pedagogically excellent* — it shows where judgment matters most — but the overlay colour and the "the star moves" narration must carry it, since the coloured regions there are a close call. Verify in a headless screenshot that the seam is legible at projector scale and that the EVEN-column near-ties are annotated rather than looking like noise.

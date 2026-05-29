# Pipeline Climb

> A lead climbs from cold to hot — push too hard too early and you scare it back down.

## Why this lands with managers

Every manager who has owned a number has watched a promising deal die because someone sent the contract three weeks too early. Pipeline Climb turns that exact instinct — *read the situation, then pick the right lever* — into a five-rung ladder with three buttons. There is no jargon and no code: just a lead warming up or cooling down, a rep's time ticking away, and the payoff of a signature at the end. It is decision-making under uncertainty in the one setting this audience already argues about in every Monday forecast call, which makes the leap to "this is reinforcement learning" feel like a relabeling of something they already know rather than a new subject.

## The MDP at a glance

- **State (S):** the lead's **pipeline stage**, one of five rungs: `COLD → CURIOUS → ENGAGED → EVALUATING → READY`. That is **5 living states**. Two terminal states sit off the ladder: `SIGNED` (deal won) and `LOST` (lead went fully cold and exited). Default build is this clean 1-D ladder. An optional richer build adds a **deal-size** flag `{small, large}` for `5 × 2 = 10` living states (large deals cool faster on a premature close) — still tiny, still drawable, but the 1-D version is recommended for the very first pass because the Q-table is just five rows.
- **Actions (A):** three levers the rep can pull. **NURTURE** (send content, a soft touch — low commitment), **DEMO** (book the call, show value — mid commitment), **HARD CLOSE** (send the contract, ask for signature — high commitment). The business meaning: *how hard do I push right now?*
- **Transition (P) — the visible dice:** after every lever the screen rolls a three-faced **STAGE DIE** that reads **UP a rung / STAY / DOWN a rung**. The full up/stay/down table (per stage × lever) is printed right next to the die so the randomness is honest, including the ugly branch: a **HARD CLOSE on a cold-ish lead lands DOWN 75% of the time** (you burned it), and a DOWN roll from `COLD` doesn't just cool the lead — it **drops out to `LOST`**. The "part you do not control" is a literal die you watch land.
- **Reward (R):** **−1 per touch** (the rep's time — every lever costs a unit of effort, so dawdling is penalized). **+30** when a HARD CLOSE from `READY` succeeds (signature → `SIGNED`). **−10** when the lead drops out (`COLD` rolls down → `LOST`). The +30 and −10 are paid *instead of* the −1 on the terminating touch, so returns stay small and bounded.
- **Terminal:** an episode ends on a **win** (`SIGNED`, +30) or a **loss** (`LOST`, −10). Episodic — every run terminates.
- **The twist (state-dependent optimal action):** the best lever **walks up the ladder with the lead**. `NURTURE` a `COLD` lead (a hard close just incinerates it); `DEMO` through the warming middle (`CURIOUS / ENGAGED / EVALUATING`); `HARD CLOSE` **only** when `READY`. The same "close" lever is the single most valuable move in the deck at `READY` (Q\* = **+29**) and an actively *destructive* move when `COLD` (Q\* = **−3.28**, the only negative cell on the board). This is the "evolution" analogue: the lead's stage is its form, and each form responds to a different lever. The policy is *felt* as a rule that changes with the situation, not a constant.
- **State-space size:** **5** (or 10 with deal-size). The entire Q-table is a **5-row × 3-column grid** — even smaller than the Pokémon 5×5. Every cell is visible on one screen and checkable by hand.

## Visual language

A clean CRM/sales-deck skin, reusing the repo's retro option (the existing `crt` black/orange-neon theme reads as a terminal-style sales dashboard; the `light` Pokémon-paper theme reads as a printed pipeline report). The recurring **state-icon** is a **thermometer-on-a-ladder**: five stacked rungs, the lead's avatar (a small contact card / silhouette) sitting on its current rung, and a warmth bar that fills cold-blue → orange → hot-red as you climb. `SIGNED` shows a green stamped contract; `LOST` shows a greyed, struck-through card drifting off the bottom. This icon is the same glyph used everywhere a "state" appears — in the trajectory boxes, atop the Q\* table, on each Q-table cell — so the learner builds exactly one mental picture, the way the two-sprites-under-HP-bars icon recurs in Pokémon.

- **Levers** are three chunky buttons, colour-coded by aggression: NURTURE = calm blue, DEMO = amber, HARD CLOSE = hot red. The same three colours mark the three action columns of the Q-table and the action box in the trajectory tape, so "the red lever" is identifiable at a glance.
- **The STAGE DIE** is a three-faced token that flips up with an arrow: **↑ green** (UP), **= grey** (STAY), **↓ red** (DOWN). On a `COLD`-down it cracks and the card slides off into `LOST`; on a `READY` hard-close success it stamps the contract green. Signature animations: a confetti/stamp burst on `SIGNED`, a card-fade on `LOST`.
- **Reward chips** float up from each touch: a small `−1` time-chip every move, a big `+30` on signature, a big `−10` on churn — colour identity (red border = state, blue = action, purple = reward) matches the existing trajectory-box hues so the cross-scene vocabulary is consistent.
- **The Q-table** is a 5-row ladder (rung names down the left, hottest at top) × 3 lever columns, each cell showing one Q-value with the argmax cell starred and tinted by lever colour — so the optimal "staircase" (blue at the bottom, amber in the middle, red at the top) is literally visible as a diagonal of stars climbing the board.

## Scene-by-scene plan

### 0. Title / hook
Full-bleed title: **PIPELINE CLIMB**, a single lead card resting on the bottom rung of a five-rung ladder, the warmth bar pulsing cold-blue. Tagline: *"Cold to signed in five rungs — but push too hard, too early, and you'll watch it slide back down."* A **START** prompt invites the click. The manager framing is set in one breath: this is about *timing your push*, the thing they coach reps on every week.

### 1. Tutorial - how to play
Three annotated panels, no theory. Panel 1 names the ladder and the warmth bar ("**the situation now** — which rung your lead is on"). Panel 2 introduces the three levers as the only buttons ("**your levers** — NURTURE, DEMO, HARD CLOSE; each costs the rep one touch"). Panel 3 shows the STAGE DIE rolling once and the card hopping up a rung, plus the two endings — green `SIGNED`, grey `LOST`. Takeaway: you pick a lever, the die decides how the lead reacts, the round ends in a signature or a drop-out. Vocabulary only: *stage, lever, touch, die, signed/lost*.

### 2. Playtest - you run it
The learner **is** the rep. Live board: pick a lever, watch the STAGE DIE land, see the card climb or cool and a reward chip float up; the running touch-count and total payoff tick along the top. A soft **touch budget** (e.g. the meter visibly draining) keeps a one-lever ramble from running forever and quietly teaches that dithering bleeds −1s. Most managers will instinctively HARD CLOSE early once, watch the lead crater toward `LOST`, and *feel* the twist before it is ever named. Takeaway: the outcome is part skill, part dice — and the right lever clearly depends on the rung.

### 3. Formalization - what makes this an MDP
Lead with the business meaning, then bolt on the symbols. Four reveals over the board: **state `s`** = the rung the lead is on (the icon); **action `a`** = the lever you pulled; **transition `P(s', r | s, a)`** = the STAGE DIE's printed up/stay/down odds (the part you do not control); **reward `r`** = the touch cost / signature / churn payoff. The honest transition table is shown in full so nothing is hidden. Manager framing: "your CRM has been an MDP this whole time — situation, lever, the odds, the payoff."

### 4. Policy - a rule from states to actions
A **policy `π: S → A`** is your **playbook / SOP** — one chosen lever for each rung. Reveal: *"When you were clicking in the playtest, you were a policy — you just hadn't written it down."* Two hand-policies are painted onto the ladder side by side: **"Always HARD CLOSE"** (the eager-rep playbook — red on every rung) and **"Climb-aware"** (blue-low, amber-mid, red-only-at-top). A quick eyeball comparison foreshadows scene 6: the flat playbook never reaches a signature. Takeaway: a policy is a column of lever-choices, one per situation — and a *good* policy is allowed to change its mind as the lead warms.

### 5. Trajectory
A run is a tape of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)`. The scene emits, per touch, three side-by-side boxes — the ladder-icon `Sᵢ`, the lever `Aᵢ`, the chip `Rᵢ` — fading in `S → A → R` so the eye traces see-act-get-paid. STEP/PLAY rolls forward; the tape scrolls; a terminal touch caps it with a final `SIGNED`/`LOST` state box. Capital letters because, before you fix a policy and the dice, each is **random**. Manager framing: this tape is one deal's *history* — what happened, lever by lever.

### 6. Return G_t
**`Gᵢ(τ) = Σ_{j ≥ i} rⱼ`** — the **payoff summed over the whole deal, not just this touch**. A concrete signed run is shown with state/action boxes greyed so only the reward chips (which actually feed `G`) catch the eye, and the `G_t` sum expands term by term. Then the jewel of this scene: hold the **start fixed at `COLD` and the lever fixed at one choice**, sample many runs, and plot the histogram of `G`. Under "always NURTURE" the spread sits entirely in the red (it *never* reaches +30 — max return is the −10 churn floor); under the climb-aware play the mass shifts positive with a real spread from churned losses to +26 signatures. Takeaway: one lever from one situation gives a *distribution* of payoffs — variance is the manager's "this is why one deal isn't proof."

### 7. Optimal action-value Q*(s,a)
**`Q*(s, a) = max E[Gᵢ(τ)]`** — the **true long-run value of pulling lever `a` in situation `s`, assuming you play smart afterward**. The state-icon for the current rung sits atop a two-column table (`lever a | Q*(s, a)`) with the argmax row **starred**. Step the rung selector down the ladder and watch the star **walk across columns**: NURTURE starred at `COLD`, DEMO starred through the middle, HARD CLOSE starred at `READY`. The `COLD` row is the showpiece — HARD CLOSE shows a lonely **negative** Q\*. Manager framing: this column is the *scorecard for each lever in this exact situation* — and the best lever is not the same lever everywhere.

### 8. Bellman optimality equation
**`Q*(s, a) = E[ R + max_{a'} Q*(S', a') ]`**: the value of a lever now is *today's payoff plus the value of playing optimally from wherever the die lands you.* The formula sits in a card; below it, the `COLD`/NURTURE cell is expanded over its three die-faces against the printed odds, each branch reading "land here → best you can do from there." Manager framing: a lever is worth *today's result plus the door it opens* — the essence of not over-optimizing the current quarter.

### 9. Dynamic programming - fill Q*
*If you knew the odds* (you do — they're printed), you can compute the whole scorecard by repeated Bellman backups. STEP/RUN sweeps fill the 5×3 grid region by region: the `READY` row first (HARD CLOSE = **+29**, the only path to the +30), then the obviously-doomed `COLD`/HARD CLOSE cell, then the middle band resolving to DEMO. A side panel shows the full hand-arithmetic for the detail cell `Q*(COLD, NURTURE) = 0.60·(−1+22.65) + 0.30·(−1+16.70) + 0.10·(−10) = +16.70`. The **greedy policy stabilises in about three sweeps**, so the star-staircase snaps into place fast. Manager framing: with a perfect model, the optimal playbook is *computable*, not guessed.

### 10. Why DP does not scale
A two-reason card. **(a) You almost never know the odds.** The printed STAGE-DIE table was a gift; in the real world no one hands you the exact probability that a `CURIOUS` enterprise lead with a champion on PTO warms after a demo. **(b) The board explodes.** Add industry, deal size, seniority, region, last-touch-age, competitor-in-play… and the five tidy rungs become millions of situations no one can enumerate or fill by hand. Manager framing: "the spreadsheet model only exists in the slide; reality is bigger and partly hidden."

### 11. SARSA - learn Q* by playing
Derive the update by replacing the Bellman *expectation* with **one sample** from an actual touch: `q[s,a] ← q[s,a] + α·( r + q[s',a'] − q[s,a] )` — nudge each lever's score toward what just happened. A short pager builds it line by line (table appears → one trajectory paints its path → the "one-sample-of-an-expectation" idea → a number-line nudge), then a **live demo**: the agent plays deals with **ε for exploration** (sometimes try the unproven lever to *learn*, instead of always exploiting today's best guess), the 5×3 q-grid fills, and a **convergence bar** tracks how close the learned scorecard is to the DP oracle from scene 9. Crucially, SARSA *discovers on its own* that it must switch levers up the ladder — the star-staircase emerges from experience, no printed odds required. Manager framing: **learn the playbook from many small experiments** — trial, outcome, adjust.

### 12. Recap
Six badge cards, one per concept, each tied back to the ladder. **MDP** = situation/lever/odds/payoff. **Policy** = your playbook, one lever per rung. **Return** = payoff over the whole deal, with variance. **Q\*** = the per-situation lever scorecard (the star-staircase). **DP** = compute it if you know the odds (you usually don't). **SARSA** = learn it by playing, exploring a little. Close: *"You started by burning a cold lead with a contract. You're leaving with the playbook — and a feel for why the best move depends on the moment."*

## Numbers (concrete, small)

**States** `S = {COLD, CURIOUS, ENGAGED, EVALUATING, READY}` (indices 0–4) plus terminals `SIGNED`, `LOST`. **Actions** `A = {NURTURE, DEMO, HARD CLOSE}`. **Discount** γ = 1 (every episode terminates). **Reward** = −1 per touch; +30 on `READY`+HARD CLOSE success (→ `SIGNED`); −10 when `COLD` rolls down (→ `LOST`).

**STAGE-DIE transition table (P), as up / stay / down per stage × lever.** A "down" from `COLD` is the −10 drop-out. HARD CLOSE below `READY` is the burn branch; HARD CLOSE at `READY` is success / cool / stall.

| Stage | NURTURE (up/stay/down) | DEMO (up/stay/down) | HARD CLOSE |
|---|---|---|---|
| COLD | 0.60 / 0.30 / **0.10→LOST** | 0.25 / 0.30 / **0.45→LOST** | 0.05 / 0.20 / **0.75→LOST** |
| CURIOUS | 0.45 / 0.40 / 0.15 | 0.65 / 0.25 / 0.10 | 0.05 / 0.20 / 0.75 (burn) |
| ENGAGED | 0.35 / 0.45 / 0.20 | 0.65 / 0.25 / 0.10 | 0.05 / 0.20 / 0.75 (burn) |
| EVALUATING | 0.25 / 0.50 / 0.25 | 0.60 / 0.30 / 0.10 | 0.05 / 0.20 / 0.75 (burn) |
| READY | 0.10 / 0.60 / 0.30 | 0.25 / 0.55 / 0.20 | **0.70→SIGNED** / 0.10 stay / 0.20 cool |

**Resulting Q\*** (value iteration, γ = 1; argmax starred). The greedy policy stabilises in ~3 sweeps:

| Stage | NURTURE | DEMO | HARD CLOSE | π\* |
|---|---|---|---|---|
| COLD | **+16.70**★ | +5.62 | **−3.28** | NURTURE |
| CURIOUS | +21.86 | **+22.65**★ | +17.31 | DEMO |
| ENGAGED | +24.28 | **+25.10**★ | +22.36 | DEMO |
| EVALUATING | +26.04 | **+27.02**★ | +24.68 | DEMO |
| READY | +27.41 | +27.61 | **+29.00**★ | HARD CLOSE |

**Q\* intuitions to read aloud:**
1. **`Q*(COLD, NURTURE) = +16.70`**, computed by hand in three branches: `0.60·(−1 + V*(CURIOUS)=22.65) + 0.30·(−1 + V*(COLD)=16.70) + 0.10·(−10) = 12.99 + 4.71 − 1.00`. The fixed point even reproduces itself (the COLD self-loop), which is a satisfying thing to point at.
2. **`Q*(COLD, HARD CLOSE) = −3.28`** — the only negative cell on the board: `0.05·(−1+22.65) + 0.20·(−1+16.70) + 0.75·(−10) = +1.08 + 3.14 − 7.50`. The 0.75 burn branch dominates. *Same lever, +29 at READY, −3.28 here.*
3. **A flat playbook never signs:** Monte-Carlo from `COLD` under "always NURTURE" or "always DEMO" yields a max return of −10 (the churn floor) and a deeply negative mean, because **only HARD CLOSE at READY reaches +30**. The climb-aware policy averages **+16.7** (matching V\*(COLD)) with returns spread from −33 to +26 — the variance the histogram in scene 6 shows.

## Manager translation of the RL ideas

- **State `s`** → "the situation now" — which rung the lead is on.
- **Action `a`** → "the lever" — how hard you push (nurture / demo / close).
- **Policy `π`** → "the playbook / SOP" — your chosen lever for each rung; a good one changes with the lead's warmth.
- **Return `G`** → "payoff summed over the whole deal," not just this touch; it varies run to run.
- **Stochastic transition `P`** → "the part you do not control" — the STAGE DIE; the lead might warm, stall, or cool no matter how clean your move.
- **`Q*(s, a)`** → "the true long-run value of pulling lever `a` in situation `s`, if you play smart afterward" — the per-situation scorecard.
- **Exploration (ε)** → "sometimes try the unproven lever to *learn*," instead of always running today's apparent best play.
- **DP** → "with a perfect model of the odds you could *compute* the optimal playbook" — exactly, in a few sweeps.
- **Why DP fails** → "you never have the exact odds, and once you add real attributes the situations explode beyond enumeration."
- **SARSA / model-free learning** → "learn the playbook from experience — many small experiments, each one a touch with an outcome you adjust to" — no printed odds needed.

## Risks / open questions

- **Undiscounted self-loops can ramble.** Under a poor single-lever playbook an episode self-loops on a rung, racking up −1 touches before it terminates (Monte-Carlo means of −49 / −26 for always-NURTURE / always-DEMO). Mitigation: a visible **touch budget / soft turn cap** in the playtest and a capped horizon in the variance sampler, so returns stay bounded and hand-computable without hiding the real churn risk. Worth deciding the cap value during build.
- **Full numeric convergence vs. policy convergence.** The *greedy policy* (the star-staircase students watch) locks in after ~3 sweeps, but exact value convergence to 1e-9 takes ~77 sweeps because of the self-loops. The DP scene should narrate "the policy is already stable" early and treat further sweeps as decimal polish, mirroring how the Pokémon DP scene frames it.
- **The 1-D ladder may feel *too* easy for some audiences.** The 5×3 board is wonderfully readable but has only one starred cell per row. The optional `5 × 2` deal-size variant (large deals cool harder on a premature close, shifting where HARD CLOSE becomes safe) adds a second axis of state-dependence and a richer 10-row Q-table — recommended as a "level 2" toggle, not the default.
- **Skin authenticity.** Pokémon's pull was partly cultural nostalgia; a CRM/sales-dashboard skin is *relevant* but less charming. The retro `crt` theme buys back some delight; consider light character animation on the lead card (warming up, getting cold feet) so the board has personality rather than reading like a real CRM the audience is tired of.
- **HARD CLOSE odds are a modeling choice.** The 0.70 success at `READY` and 0.75 burn elsewhere are tuned for a clean twist; if a sales-leader audience wants to argue the numbers, that is a *feature* (it invites them to set the odds), but the build should make the table editable enough to host that conversation without breaking the hand-computability of the headline cells.

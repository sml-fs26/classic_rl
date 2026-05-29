# Machine Doctor

> A production machine slowly wears out — keep running it, pay to service it, or replace it — and the right call shifts as it ages.

## Why this lands with managers

Every operations leader has lived this decision: the line is still running, but for how long? Do you squeeze another quarter of output out of an aging asset, book the maintenance window now, or sign off the capital request for a replacement? It is a pure capex-versus-opex trade-off under uncertainty — you do not control when the machine actually breaks, only which lever you pull beforehand. Machine Doctor turns that boardroom dilemma into a five-rung gauge a manager can read at a glance, and the punchline is the one every seasoned operator already feels in their gut: *the right answer is not a number, it is a rule that changes with the condition of the asset.*

## The MDP at a glance

- **State (S):** The machine's condition on a 5-rung gauge: `{new, good, worn, failing, broken}` = **5 states**. One variable, one row per rung — the entire Q-table is a single column of five cells. `broken` is a costly trap: it produces nothing until you pay to get out of it.
- **Actions (A):** Three levers, available in every state:
  - **RUN** — produce now. Earns output this shift, but the machine may degrade a rung, and a worn-or-worse machine may suffer a costly breakdown.
  - **SERVICE** — pay a maintenance fee to step the condition *up* one rung (refresh before failure). Cannot revive a fully broken machine.
  - **REPLACE** — pay capital expenditure to reset the machine to `new`.
- **Transition (P) — the visible dice:** Only **RUN** is risky, and the screen shows it. Pulling RUN rolls a chunky on-screen **wear die**: most faces mean "condition holds," some mean "drop one rung," and on a `worn`/`failing` machine certain faces are painted red — a **breakdown**. A red face triggers a spark animation, a klaxon, and a "DOWNTIME!" popup as the gauge slams to `broken`. SERVICE and REPLACE are deterministic (no die — you are *buying* certainty), which itself teaches that paying money removes risk.
- **Reward (R):** Per step — `+5` output for a successful RUN; `−3` for SERVICE; `−10` for REPLACE; and a `−15` downtime penalty when a RUN causes a breakdown (the `+5` output is forfeited that shift). All small whole numbers, bounded per step.
- **Terminal:** Two honest framings, toggleable. **Fixed shift-plan horizon** (headline): you are planning the next *H* shifts (e.g. H = 6); the episode ends when the shifts run out. **Discounted infinite horizon** (optional): the plant runs forever, future payoffs discounted by γ = 0.9. `broken` is absorbing-until-fixed: you cannot produce from `broken`, you must SERVICE (ineffective) or REPLACE out of it.
- **The twist (state-dependent optimal action):** The optimal lever **marches down the gauge**: **RUN** while `new`/`good` (the asset is earning and degradation is slow), **SERVICE** when `worn` (a cheap refresh right before breakdown risk spikes — the classic "do the maintenance *now*"), and **REPLACE** when `failing`/`broken` (the asset is past saving; servicing only delays the inevitable, so eat the capex). Same machine, three different right answers by condition. This is the capex/opex jewel and the direct analogue of the Pokémon "evolution resists different moves."
- **State-space size:** **5 states × 3 actions = 15 Q-values.** A 5×3 table fits on one screen with room for sprites and the argmax stars. Value iteration is hand-computable; the finite-horizon version is exact in 6 backups you can trace with a pencil.

## Visual language

The recurring **state-icon** is a single machine sprite — a stylised industrial press or CNC unit — wearing its condition on its sleeve, paired with a vertical **5-segment condition gauge** to its left (green at top → amber → red → dark "broken" at bottom). The sprite visibly ages across rungs: `new` gleams with a shine glint, `good` is clean, `worn` shows scuff marks and a faint rattle wobble, `failing` leaks a wisp of smoke and flickers, `broken` is dark and slumped with a single hazard-tape "X."

- **Three lever buttons** styled like a factory control panel: RUN (green, a play/gear icon), SERVICE (amber, a wrench), REPLACE (blue, a forklift/swap icon). Each carries its price tag (`+5`, `−3`, `−10`).
- **The wear die** is a large physical-looking cube that tumbles in from the side on every RUN; its faces are colour-coded (green = hold, amber = drop a rung, red = breakdown). On `worn`/`failing` the die *visibly grows red faces*, so the audience watches risk increase with age.
- **Signature animations:** the **spark + DOWNTIME klaxon** on a breakdown; a **wrench-turn + "+1 rung" lift** on SERVICE; a **fresh-machine swoosh** on REPLACE; coins ticking up on a good RUN.
- **Colour coding stays consistent everywhere:** condition uses the green→red gauge palette; money is green for earned, red for spent; the optimal action in any table is marked with a gold star and the lever's signature colour. The same machine-plus-gauge icon heads every formal scene so managers anchor to one mental picture.

## Scene-by-scene plan

### 0. Title / hook
A lone machine sprite idles on a factory floor, gauge full and green, a coin counter ticking up with each shift — then the shine fades, the gauge drops a rung, and a faint rattle begins. Big title: **MACHINE DOCTOR**, subtitle "Keep it running, fix it, or replace it?", and a pulsing **PRESS START**. The hook for a manager: *this asset is making you money right now and quietly dying at the same time — your move.*

### 1. Tutorial - how to play
A guided walkthrough with no theory: here is the **condition gauge** (five rungs, what each looks like), here are your **three levers** and their price tags, and here is the **wear die** that rolls only when you RUN. The learner is walked through one of each action on a fresh machine and watches the gauge and the coin counter respond. Takeaway vocabulary, in plain terms: *the situation* (the gauge), *the levers* (the three buttons), *the part you don't control* (the die). Manager framing: this is your dashboard and your controls — nothing else.

### 2. Playtest - you run it
The learner takes over a machine for a run of shifts and clicks RUN / SERVICE / REPLACE freely, watching condition drift down, dice roll, the occasional breakdown klaxon, and a running **net payoff** tally. They *feel* the core tension: RUN keeps earning but courts a breakdown; SERVICE and REPLACE cost money up front. **The learner IS the decision-maker — they are already executing a playbook, they just haven't named it.** Manager framing: you just ran the asset for two weeks; was your gut rule actually the best one?

### 3. Formalization - what makes this an MDP
The four parts are named over the live game, each with a business gloss first. **State `s`** = the situation now (which rung). **Action `a`** = the lever you pull. **Transition `P(s′, r | s, a)`** = the part you don't control — given the rung and the lever, the die decides the next rung and the payoff (SERVICE/REPLACE have a degenerate, certain die). **Reward `r`** = the payoff this shift (`+5 / −3 / −10`, minus `15` on a breakdown). Takeaway: a decision, an uncertain consequence, a payoff, repeated. Manager framing: this is just a clean name for "decision under uncertainty with a running scorecard."

### 4. Policy - a rule from states to actions
A **policy `π: S → A`** is introduced as your **standard operating procedure** — one chosen lever for each of the five rungs, shown as arrows from each gauge-rung to a lever button. Two hand-policies are displayed side by side on the gauge: a naive **"Always RUN"** SOP (run it into the ground) and a cautious **"SERVICE the moment it's worn"** SOP. The learner sees their own playtest re-expressed as a policy. Key point: **when you played, you *were* a policy** — every operator already has an implicit playbook; the question is whether it is the *right* one. Manager framing: a policy is your maintenance SOP, written as "in situation X, pull lever Y."

### 5. Trajectory
One run is replayed as a tape of random variables: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)`, capital letters because before the dice land each is uncertain. The tape shows, e.g., `good → RUN → +5 → worn → RUN → (red die!) → broken → −15 → …`. Each die roll is highlighted as the moment chance entered. Takeaway: a trajectory is the **shift-by-shift log** of one possible future. Manager framing: this is the operations diary for one quarter — and rolling the clock again gives a *different* diary.

### 6. Return G_t
The **return** `G_i(τ) = Σ_{j≥i} r_j` is defined as the **total payoff from here to the end of the plan** (discounted by γ if the infinite-horizon toggle is on). The same starting state and *the same chosen action* are simulated many times; a histogram of returns builds up, visibly spread out. Anchoring example: RUN from `worn` sometimes pays `+5` and holds, sometimes detonates into `−15` and downtime — same lever, a *distribution* of outcomes. Takeaway: judge a lever by its **expected return over time**, not one lucky shift. Manager framing: payoff summed over the whole plan, with its risk shown — exactly how you would evaluate an asset strategy, not a single month.

### 7. Optimal action-value Q*(s,a)
`Q*(s, a) = max E[G_i(τ)]` is the **true long-run value of pulling lever `a` in condition `s`, assuming you play smart forever after.** The state-icon for one rung (say `worn`) appears beside a two-column table — `action a | Q*(s, a)` — with the argmax starred. For `worn`: SERVICE ≈ `27` (starred) edges out RUN ≈ `24` and REPLACE ≈ `25`. Stepping through all five rungs reveals the column of best levers. Takeaway: Q* is the scorecard that already accounts for the future; the best lever is just the row with the star. Manager framing: the honest, future-aware ROI of each lever in each situation.

### 8. Bellman optimality equation
The recursive heart: `Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]` — *the value of a lever now = the payoff it pays this shift, plus the value of playing optimally from whatever rung the die lands you on.* Shown as a one-card diagram: pull a lever → collect `R` → the die fans out to next-rungs → from each, take the best future value, average by the die's odds. Takeaway: today's best decision is defined in terms of tomorrow's best decision. Manager framing: a good call values not just this shift's cash but the *position it leaves the asset in* for the next call.

### 9. Dynamic programming - fill Q*
Because `P` is fully known here, we **sweep Bellman backups until the table stops changing.** The 5×3 Q-grid fills in live: the first sweep knows only immediate payoffs, so it stars RUN almost everywhere; over the next few sweeps the `worn` cell flips to **SERVICE** and `failing`/`broken` flip to **REPLACE** as the cost of future breakdowns propagates upward. The audience watches the **optimal lever march down the gauge** in real time. Takeaway: with a perfect model, the optimal playbook is *computed*, not guessed. Manager framing: if you had a flawless model of how this asset fails, you could derive the exact maintenance SOP — and here is that SOP appearing.

### 10. Why DP does not scale
Two blockers, each with a factory face. **(a) You rarely know `P`.** The real breakdown odds of *your* machine aren't printed on a die — they depend on load, age, supplier, the operator on shift; the wear die is an idealisation. **(b) Real state spaces explode.** Our gauge has 5 rungs, but a real asset's state is temperature, vibration, hours-since-service, ambient humidity, batch material… and a whole *fleet* of machines, multiplying into billions of situations no one can enumerate. Takeaway: DP is the right idea and the wrong tool for the real plant. Manager framing: you never get the perfect model, and the real world is far too big to tabulate — so what do you do?

### 11. SARSA - learn Q* by playing
The answer: **learn the playbook from experience.** Starting from Bellman, replacing the unknown expectation with a single observed transition gives the SARSA update — glossed as "after each shift, nudge your estimate of the lever you pulled toward what actually happened plus what you now think the next move is worth." **`ε` (exploration)** is introduced as *deliberately trying an unproven lever now and then so you actually learn its value* — e.g. occasionally SERVICE a `failing` machine just to confirm it's a waste. A live demo runs many shifts with no model; the 5×3 Q-table fills from scratch and a convergence bar shows it homing in on the **DP oracle** from scene 9 — same starred column, RUN/RUN/SERVICE/REPLACE/REPLACE. Manager framing: run many small, cheap experiments on the floor, adjust after each, and the right SOP emerges *without* ever needing a perfect model.

### 12. Recap
One card per concept, each tied back to the machine: **MDP** (situations, levers, uncontrolled outcomes, payoffs) · **Policy** (your maintenance SOP) · **Return** (payoff over the whole plan, risk and all) · **Q\*** (future-aware ROI of each lever in each condition) · **DP** (compute the SOP if you have a perfect model) · **SARSA** (learn the SOP from experience when you don't). Closing line: *you now know how to turn "keep it, fix it, or replace it" from a gut call into a learnable playbook — and the punchline is that the right call depends on the situation.*

## Numbers (concrete, small)

**States:** `S = {new(0), good(1), worn(2), failing(3), broken(4)}`.
**Actions:** `A = {RUN, SERVICE, REPLACE}`.

**Transitions & rewards** (only RUN rolls the die):

| State | RUN — wear die outcomes (prob → next, reward) | SERVICE (→, reward) | REPLACE (→, reward) |
|---|---|---|---|
| new | 0.8 → new, +5 · 0.2 → good, +5 | → new, −3 | → new, −10 |
| good | 0.7 → good, +5 · 0.3 → worn, +5 | → new, −3 | → new, −10 |
| worn | 0.5 → worn, +5 · 0.3 → failing, +5 · **0.2 → broken, −15** | → good, −3 | → new, −10 |
| failing | 0.3 → failing, +5 · **0.7 → broken, −15** | → worn, −3 | → new, −10 |
| broken | (cannot produce) | → broken, −3 *(ineffective)* | → new, −10 |

SERVICE and REPLACE are deterministic — paying money buys a certain outcome (no die). The red die-faces (breakdown) appear only at `worn` and `failing`, and there are *more* of them at `failing` — risk visibly rises with age.

**Hand-computable DP (finite shift-plan, no discount, exact in H backups).** With `V₀(s) = 0`, one backup is `Vₕ(s) = maxₐ Σ p·(r + Vₕ₋₁(s′))`. The first backup uses only this shift's reward, so it stars RUN nearly everywhere; by H = 3 the mature policy locks in:

| Shifts left H | new | good | worn | failing | broken |
|---|---|---|---|---|---|
| 1 | RUN (5) | RUN (5) | RUN (1) | SERVICE (−3) | SERVICE (−3) |
| 2 | RUN | RUN | **SERVICE** | SERVICE | **REPLACE** |
| 3 | RUN | RUN | **SERVICE** | **REPLACE** | **REPLACE** |
| 6 | RUN (27.3) | RUN (21.3) | **SERVICE (15.1)** | **REPLACE (13.3)** | **REPLACE (13.3)** |

**Discounted infinite-horizon oracle** (γ = 0.9), the target the SARSA demo converges to — same starred column:

| State | Q*(·, RUN) | Q*(·, SERVICE) | Q*(·, REPLACE) | best |
|---|---|---|---|---|
| new | **39.1** | 32.2 | 25.2 | RUN |
| good | **33.0** | 32.2 | 25.2 | RUN |
| worn | 24.3 | **26.7** | 25.2 | SERVICE |
| failing | 13.6 | 21.0 | **25.2** | REPLACE |
| broken | — | 19.6 | **25.2** | REPLACE |

**Three Q\* intuitions to narrate:**
1. **`good`: RUN ≈ 33 just edges SERVICE ≈ 32.** A close call — the asset is still earning, so squeeze it; but the margin is thin, which is exactly why a slightly worse machine flips the decision. The boundary between "run it" and "fix it" is *narrow*, and that is the whole art of maintenance timing.
2. **`worn`: SERVICE ≈ 27 beats RUN ≈ 24.** Running a worn machine courts the `−15` breakdown; a `−3` refresh that buys back a rung is the cheap insurance. This is the textbook "do the preventive maintenance *now*, before the risk cliff."
3. **`failing`: REPLACE ≈ 25 dominates SERVICE ≈ 21 and RUN ≈ 14.** The asset is past saving — servicing only postpones a near-certain breakdown, so eat the capex and reset. **Bonus lesson from the H = 1 row:** with almost no future left you'd *skip* the capex and just SERVICE — REPLACE only pays off because its benefit is spread over many future shifts. A perfect, concrete illustration of "capex is a long-horizon bet."

## Manager translation of the RL ideas

- **State / action / policy → situation / lever / SOP.** The gauge is the situation, the three buttons are the levers, and a policy is your written maintenance SOP: "in condition X, pull lever Y."
- **Stochastic transition → the part you don't control.** You choose the lever; the wear die — load, wear, luck — chooses the breakdown. Paying for SERVICE or REPLACE is literally buying away the die.
- **Return / Q\* → payoff over the whole plan / future-aware ROI.** Q* is the number a good asset manager already estimates in their head: the true long-run value of a lever, breakdowns and capex included — not this month's output.
- **DP → the SOP you could compute with a perfect failure model.** Beautiful, exact, and unavailable in practice.
- **Why DP fails → no perfect model, and the real state explodes.** Real machines aren't five rungs and a clean die; they're sensor streams across a whole fleet.
- **Exploration (ε) → try the unproven lever to learn.** Occasionally service a failing machine — or run a worn one — *on purpose*, so you actually learn what those levers are worth instead of trusting folklore.
- **SARSA / model-free learning → learn the SOP from experience.** Many small experiments on the floor, adjust after each shift, and the right "run / service / replace" rulebook emerges with no model required — the data-driven maintenance program, in miniature.

## Risks / open questions

- **Horizon honesty.** The infinite-horizon discounted version needs ~50-80 Bellman sweeps to converge at γ = 0.9 — too many to call "a few sweeps." Mitigation: make the **finite shift-plan** version (exact in 5-6 hand-traceable backups, identical policy) the headline for scenes 8-9, and offer discounting as a toggle, not the default.
- **`broken` self-loop under SERVICE.** Modelling SERVICE as ineffective on `broken` (self-loop, −3) is realistic but can confuse if shown as a "move"; the UI must clearly signal "wrench fails — still broken" so it reads as *learning that this lever is wrong here*, not a bug.
- **Three sprite-distinct conditions vs five.** Five visually separable machine states (especially `good` vs `worn`) is an art ask; if they blur, the gauge segments and scuff/smoke cues must carry the distinction.
- **Determinism of SERVICE/REPLACE.** Having two of three actions be dice-free is pedagogically clean ("paying buys certainty") but means the *only* visible randomness rides on RUN — fine here, but worth flagging so the "visible dice" ingredient isn't read as thin. The rising count of red die-faces at `worn`→`failing` is what keeps the randomness vivid.
- **Reward calibration is a knob, not a law.** The `+5 / −3 / −10 / −15` set was chosen so the twist is robust across γ ∈ {0.8, 0.85, 0.9}; if a stakeholder wants different economics (e.g. cheaper capex), the SERVICE↔REPLACE boundary can move, which is itself a teachable sensitivity demo but should be tuned before build.
- **"Marching policy" must be legible in the DP fill.** The payoff of the whole example is watching the starred column change from all-RUN to RUN/RUN/SERVICE/REPLACE/REPLACE over sweeps; if the animation flips cells too fast or all at once, the jewel is lost. Pacing and per-cell highlight on each flip are essential.

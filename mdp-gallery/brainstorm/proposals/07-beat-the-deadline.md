# Beat the Deadline

> Pallets pile up, the clock ticks down — wait to fill the truck, or send it half-empty?

## Why this lands with managers

Every operations manager has lived this exact decision: the truck is half-full, the cut-off is approaching, and you have to choose between *paying for a wasteful half-empty dispatch now* or *waiting to consolidate and risking a blown deadline*. It is decision-making under uncertainty, fixed-vs-variable cost, and timing risk — the boardroom's three favourite words — compressed into a single click. And the punchline is the part managers feel in their gut but rarely see proven: the right call is **not** a fixed rule like "always ship at 80% full." It flips depending on how the two pressures interact. The visualization makes that flip visible, exact, and hand-checkable on a single screen.

## The MDP at a glance

- **State (S):** `(p, h)` where `p` = pallets waiting on the dock `∈ {0,1,2,3,4}` (4 means "a full truck-load") and `h` = hours left until the deadline `∈ {0,1,2,3,4}`. **Total: 5 × 5 = 25 states** — the exact Pokémon footprint, drawable as one full grid.
- **Actions (A):** **WAIT** (hold the load one more hour to consolidate — the clock ticks down, maybe another pallet arrives, but you expose the load to the risk of missing the cut-off) and **SEND** (dispatch the current load now; pay the fixed truck cost regardless of fullness; the shipment is guaranteed on time). At `h = 0` the clock has expired, so WAIT is gone and you are forced to SEND (late). At `p = 0` the dock is empty, so there is nothing to send. Two real levers in the interior — the Pokémon "weak/strong" pairing.
- **Transition (P) — the visible dice:** WAIT rolls **two dice the learner can see**. (1) An **arrival die**: with probability 0.6 a new pallet slides onto the dock (`p → p+1`, capped at 4), otherwise the dock is unchanged — shown as a pallet animating onto the dock, or not. (2) A **deadline-risk die**: with a probability that *climbs as the clock runs down* — 0% at `h = 4`, then **20% / 40% / 60%** at `h = 3 / 2 / 1` — the carrier no-shows or the road gridlocks and the shipment is *blown this hour*, stranding the whole load. The clock itself ticks deterministically (`h → h-1`); the two dice are the part you don't control. SEND has no dice — it is the safe, deterministic lever.
- **Reward (R):** **+5 per pallet delivered** on a successful dispatch, **−10 fixed truck cost** per dispatch (so a half-empty truck is a bad unit economics — you paid the same 10 to move fewer pallets), and **−5 per held pallet** if the deadline is blown or you ship late (the late penalty scales with how much you were holding). No per-hour fee — the *deadline*, not a meter, is the pressure.
- **Terminal:** The episode (one order window) ends the moment you SEND, the moment a WAIT is blown, or when the clock hits `h = 0` and you ship late. Then a fresh order window begins.
- **The twist (state-dependent optimal action) — the "evolution" analogue:** The optimal lever flips along a clean **diagonal frontier**. SEND when the truck is **full** (any amount of time left) OR when the deadline is **imminent** (any fullness); WAIT to consolidate only when you have **both slack time AND an unfilled truck**. Verified by value iteration, the SEND threshold steps down exactly **1 → 2 → 3 → 4** as hours-left grows — a perfect 45° staircase across the grid. The best lever depends on the *interaction* of two state variables, exactly the way each Pokémon evolution resists a *different* move.
- **State-space size:** **25**, a 5×5 grid. The entire Q-table (two values per cell) renders on one screen, and value iteration converges in **6 sweeps**.

## Visual language

A loading-dock diorama, top-down and warm, in the gallery's editorial register (cream paper / retro-CRT theme to match the existing decks). The **recurring state-icon** — the artifact that appears in every scene the way the two Pokémon sprites do — is a small **dock tile**: a stack of pallet sprites (0–4, growing upward) beside a **countdown clock** showing hours-left (4 down to 0), with a battered delivery truck waiting at the bay door. One glance reads the full state `(p, h)`.

- **Pallets** are chunky stacked crates; the truck's cargo bay shows 4 slots that fill as pallets load.
- **The clock** is a segmented dial, 4 wedges, draining like an HP bar — green at `h = 4`, amber at `h = 2`, red at `h = 1`, black/empty at `h = 0`.
- **The two dice are physical objects on screen.** The arrival die is a green cube that tumbles when you WAIT; a pallet slides in on a hit. The deadline-risk die is a red cube whose "blown" faces visibly *increase* as the clock reddens — the learner sees risk grow.
- **Board layout:** the 5×5 grid is the dock map — rows = pallets (4 at top), columns = hours-left (0 at left, 4 at right). **SEND cells glow truck-blue; WAIT cells glow hold-amber.** The diagonal frontier between them is the signature image — a clean staircase of colour.
- **Signature animation:** a dispatched truck rolls off-screen with a satisfying *thunk* and a floating `+value / −cost` tally; a blown deadline flashes the whole tile red with a stranded-pallets `−penalty`.
- **Colour code, reused everywhere:** truck-blue = SEND, hold-amber = WAIT, red = late/blown, green = a pallet arrived.

## Scene-by-scene plan

### 0. Title / hook
A loading dock at dusk, pallets stacked, the countdown clock ticking. The wordmark **BEAT THE DEADLINE** with a single blinking prompt: *"PRESS START — the truck is waiting."* A pallet slides onto the dock on a loop. **Manager framing:** one line dissolves in — *"You've made this call a hundred times. Today you'll see the exact rule behind it."* The click reveals nothing technical yet; it just sets the scene and invites the first decision.

### 1. Tutorial - how to play
A guided walkthrough of the controls and the vocabulary, no theory. Highlight the dock tile and name its two readings — **pallets waiting** and **hours to deadline** — then the two buttons, **WAIT** and **SEND**. One demo WAIT click shows both dice tumble: "the green die might bring a pallet; the red die might blow the deadline — and the red die gets nastier as the clock runs down." **Takeaway:** what the situation is (the state), what levers exist (the actions), and that WAIT is the move with dice attached. **Manager framing:** "WAIT buys consolidation but borrows against the clock; SEND is safe but you pay the full truck either way."

### 2. Playtest - you run it
The learner **is** the dispatcher. Starting from, say, `(p = 2, h = 4)`, they click WAIT or SEND and feel the outcome: a WAIT tumbles the dice — sometimes a pallet arrives (great, fuller truck), sometimes the deadline blows (the load is stranded, a red `−penalty` flashes). They run a few order windows and watch their cumulative payoff. **Takeaway:** the outcome of a lever is *partly out of your hands* — the same WAIT can pay off or punish. **Manager framing:** "You just ran the playbook by instinct. Notice you already wait when there's time and ship when the clock is red — that instinct is a policy, and we're about to make it exact."

### 3. Formalization - what makes this an MDP
Freeze the screen and label the four parts over the live dock. **State `s = (p, h)`** — "the situation right now." **Action `a ∈ {WAIT, SEND}`** — "the lever." **Transition `P(s′, r | s, a)`** — "what the dice do: where you land and what you're paid, the part you don't control." **Reward `r`** — "+5 a pallet delivered, −10 the truck, −5 a stranded pallet." A side note names the 25 states and the bounded rewards. **Manager framing:** "An MDP is just: situation → lever → a payoff and a new situation, with some of it left to chance. That is every operating decision you make."

### 4. Policy - a rule from states to actions
"When you played, you **were** a policy." A policy `π : S → A` is a complete playbook — one lever pre-chosen for every one of the 25 situations. Show **two hand-policies painted on the grid**: *Always-SEND* (the whole grid blue — "never let inventory sit") and *Always-WAIT-until-forced* (mostly amber — "always consolidate"). Let the learner toggle between them and watch the average payoff. **Takeaway:** a policy is a function from the whole state space to actions, drawable as a colouring of the grid. **Manager framing:** "Your SOP is a colouring of this map. The question of the whole talk is: *which colouring is best* — and is one flat rule even good enough?"

### 5. Trajectory
Roll one order window forward under a chosen policy and lay it out as a tape: `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)`. Concretely the deck shows a real run — `(2,4) → WAIT → (3,3) → SEND → +5` — with the dock tile redrawn at each step and the dice results inline. Emphasise the **capital letters**: each `Sₜ, Aₜ, Rₜ` is a *random variable*, because the dice make the next tile uncertain before you roll. **Takeaway:** a run is a sequence of random variables, not a fixed script. **Manager framing:** "Run the same playbook twice and you get two different stories — that's the dice. We summarise a story by its total payoff next."

### 6. Return G_t
Define the **return** `G_i(τ) = Σ_{j ≥ i} r_j` — "the payoff summed over the rest of the window, not just this step." Pick one start, say `(2, 4)`, fix one action (WAIT), and roll it **many times**, dropping each total into a histogram. The learner sees a *distribution*: most runs end +5 (a pallet arrives, you ship a fuller truck), some end −10 (the deadline blew). **Takeaway:** from one situation under one lever you get a spread of returns; the return is random and we'll care about its *average*. **Manager framing:** "One decision, many possible payoffs. A good rule isn't the one that wins once — it's the one with the best *expected* total over many windows."

### 7. Optimal action-value Q*(s,a)
Define `Q*(s, a) = max E[G_i(τ)]` — "the true long-run value of pulling lever `a` in situation `s`, assuming you play smart afterwards." For one chosen tile — say `(p = 2, h = 3)` — show the state-icon beside a **two-column table**: `WAIT | +0.40` and `SEND | 0.00`, with the **WAIT row starred** as the argmax. Then the same for `(p = 2, h = 2)`, where the star jumps to **SEND**. **Takeaway:** the action-value scores each lever in each situation; the best action is the argmax. **Manager framing:** "Two near-identical situations, opposite best moves — that's the twist, and `Q*` is the scoreboard that proves it."

### 8. Bellman optimality equation
Reveal the recursion: `Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]` — "the value of a lever = the immediate payoff plus the best you can do from wherever the dice land you." Walk it on one cell using the on-screen numbers: WAIT at `(2,3)` = (with prob 0.2 the deadline blows → −10) + (with prob 0.8 you survive → average over the arrival die of the best next-tile value). **Takeaway:** value is defined *self-referentially* — today's score leans on tomorrow's best score. **Manager framing:** "Good long-run thinking is recursive: today's payoff plus the value of the position you leave yourself in. Bellman just writes that down exactly."

### 9. Dynamic programming - fill Q*
"If you knew the dice exactly, you could compute the perfect playbook." Press **Run**: sweep the Bellman backup across all 25 tiles and watch the Q-grid fill in, region by region, converging in **6 sweeps**. The deadline-wall column (`h = 0`) locks first to a flat **−10**; the SEND region snaps blue; the WAIT region snaps amber; the **diagonal staircase frontier (threshold 1→2→3→4)** emerges as the headline image. **Takeaway:** with a known model, repeated Bellman backups converge to `Q*` and hand you the optimal policy. **Manager framing:** "Perfect model in hand, the optimal SOP is computable — and look, it's not a flat rule. It's a diagonal: ship when full *or* when time's short, hold only when you have both room and runway."

### 10. Why DP does not scale
A two-reason card. **(a) You rarely know the dice.** The real arrival rate and the real odds a carrier no-shows aren't handed to you — they drift by season, lane, and weather. **(b) The grid explodes.** Add SKUs, multiple trucks, several destinations, a week-long horizon, and 25 tiles become millions — too many to enumerate, let alone fill by hand. **Takeaway:** DP is the *gold standard you usually can't run*. **Manager framing:** "Two reasons the textbook optimum stays on the whiteboard: you don't have a perfect forecast, and the real problem is far too big to lay out as a grid. So how do you get the playbook anyway?"

### 11. SARSA - learn Q* by playing
Derive the fix from Bellman by replacing the expectation with **one observed sample**: pull a lever, see the real payoff and the real next tile, and nudge that cell's score toward `r + Q(S′, A′)`. Introduce **ε** as "every so often, deliberately try the lever that doesn't look best — to keep learning." Then a **live demo**: a dispatcher with a blank Q-grid runs window after window; updated cells flash; a convergence bar tracks how close the learned grid is to the DP oracle from scene 9. It lands on the **same diagonal frontier** — learned purely from experience, no dice-model required. **Takeaway:** SARSA learns `Q*` from trial-outcome-adjust, the model-free counterpart to DP. **Manager framing:** "No perfect forecast needed. Run many small experiments — try, observe, adjust — and the playbook converges to the same diagonal the math derived. Occasionally try the unproven lever, or you'll never discover it was better."

### 12. Recap
One card per concept, each a dock-themed tile: **MDP** (situation → lever → payoff, with dice), **Policy** (a colouring of the 25-tile map / your SOP), **Return** (payoff summed over the window, averaged over many windows), **Q\*** (the scoreboard for every lever in every situation), **DP** (compute the optimum *if* you knew the dice), **SARSA** (learn it from experience when you don't). Closing line: *"The half-empty-truck call has an exact answer — and you can learn it without ever knowing the odds."* **Manager framing:** the six ideas are the bones of every sequential decision under uncertainty, not just this dock.

## Numbers (concrete, small)

**States.** `(p, h)` with `p ∈ {0,1,2,3,4}`, `h ∈ {0,1,2,3,4}` → 25 states. Truck capacity = 4 (so `p = 4` is "a full load").

**Actions.** `{WAIT, SEND}`. At `h = 0`: only SEND (forced, late). At `p = 0`: dock empty, nothing to ship.

**Rewards.** Deliver value `+5` per pallet; truck cost `−10` per dispatch; blown/late penalty `−5` per held pallet. So a successful SEND of `p` pallets pays `5p − 10`, and a blown deadline or a forced late ship pays `5p − 10 − 5p = −10`.

**Transitions on WAIT (the two dice).** Arrival probability `0.6` (`p → min(p+1, 4)`). Deadline-blown probability by hour: `h = 4 → 0`, `h = 3 → 0.2`, `h = 2 → 0.4`, `h = 1 → 0.6`. The clock always ticks `h → h − 1`. (γ = 1; the deadline bounds the horizon, so no discount is needed.)

**Bellman backups (closed form, used in scenes 8–9).**
- Deadline wall: `V*(p, 0) = 5p − 10 − 5p = −10` for every `p ≥ 1`; `V*(0, ·) = 0`.
- SEND value: `SEND(p) = 5·min(p,4) − 10`.
- WAIT value: `WAIT(p,h) = miss(h)·(−5p) + (1 − miss(h))·[ 0.6·V*(min(p+1,4), h−1) + 0.4·V*(p, h−1) ]`.

**Value iteration converges in 6 sweeps to V\* (rows `p = 4` top → `0` bottom; columns `h = 0 … 4`):**

| p \ h | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| **4** | −10 | **10** | **10** | **10** | **10** |
| **3** | −10 | **5** | **5** | **5** | 8.00 |
| **2** | −10 | **0** | **0** | 0.40 | 3.16 |
| **1** | −10 | **−5** | −3.20 | −2.02 | −0.57 |
| **0** | 0 | 0 | 0 | 0 | 0 |

**The optimal policy is the diagonal staircase** (SEND-threshold per hour `p*(h) = 1, 2, 3, 4` for `h = 1, 2, 3, 4`):

| p \ h | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| **4** | SEND* | SEND | SEND | SEND | SEND |
| **3** | SEND* | SEND | SEND | SEND | WAIT |
| **2** | SEND* | SEND | SEND | WAIT | WAIT |
| **1** | SEND* | SEND | WAIT | WAIT | WAIT |
| **0** | — | — | — | — | — |

(*forced late ship at the `h = 0` wall.) SEND fills the upper-left triangle (full **or** imminent); WAIT fills the lower-right (room **and** runway). Clean 45° frontier.

**Three Q\* intuitions, each hand-checkable:**
1. **`(p = 4, h = 4)`:** `SEND = 5·4 − 10 = +10`. Waiting can't add a 5th pallet (capacity is 4) and only risks the load — so SEND, value **+10**. *Full truck → ship, even with all the time in the world.*
2. **The diagonal flip at `p = 2`:** at **`h = 3`**, `WAIT = 0.2·(−10) + 0.8·[0.6·V*(3,2) + 0.4·V*(2,2)] = −2 + 0.8·[0.6·5 + 0.4·0] = +0.40 > SEND(2) = 0` → **WAIT**. At **`h = 2`**, `WAIT = 0.4·(−10) + 0.6·[0.6·V*(3,1) + 0.4·V*(2,1)] = −4 + 0.6·[0.6·5 + 0.4·0] = −2.20 < SEND(2) = 0` → **SEND**. *Same half-full truck, one hour of slack apart, opposite calls — the twist in one line of arithmetic.*
3. **`(p = 1, h = 4)`:** `SEND = −5` (you'd pay the full truck for one pallet), so you WAIT and hope to consolidate; `V* = −0.57` — still slightly negative, the honest cost of a thin order. *Near-empty + lots of time → hold, because dispatching one pallet wastes the truck.*

A Monte-Carlo of 200,000 windows under this policy reproduces the table (e.g. start `(2,3)` averages **+0.41** vs `V* = 0.40`; start `(1,4)` averages **−0.56** vs `V* = −0.57`), confirming the values and the policy are mutually consistent.

## Manager translation of the RL ideas

- **State** → the situation on the dock right now: how full, how much time. **Action** → the lever: ship or hold. **Policy** → your dispatch SOP, a single colouring of all 25 situations.
- **Stochastic transition** → the part you don't control: whether another pallet shows up, and whether the carrier actually makes the cut-off. The viz puts both on dice you can watch.
- **Return / Q\*** → payoff summed over the whole order window, averaged over many windows — and `Q*` is the scoreboard that says, for each situation, exactly what each lever is worth long-run.
- **The DP caveat** → if you had a perfect forecast of arrivals and carrier reliability you could compute the optimal SOP outright (scene 9). In reality you don't, and at full scale (SKUs × trucks × lanes × days) the grid is far too big to enumerate (scene 10).
- **Exploration (ε) vs exploitation** → keep occasionally trying the lever that doesn't look best — hold a load you'd normally ship — so you actually *learn* whether the conventional rule is leaving money on the table, instead of forever exploiting yesterday's habit.
- **Model-free learning (SARSA)** → you don't need the odds. Run many small experiments — try, observe the payoff, adjust the playbook one notch — and you converge to the same diagonal the math would have derived. This is the manager's real path to a good SOP: disciplined trial-and-adjust, not a perfect model.

## Risks / open questions

- **Two dice, not one.** The seed proposed a single arrival die; I verified that with only an arrival die the frontier provably collapses to an **L-shape** (SEND only when full or at the last safe hour) because the SEND value is flat in `h`. The gorgeous **diagonal** the seed wants requires the SEND/WAIT comparison to tilt with `h`, which the second die — a **deadline-risk die whose odds climb as the clock runs down** — supplies cleanly and realistically. The trade-off: slightly more mechanism to teach in scene 1. I judge the diagonal worth it (it *is* the pedagogical jewel), but a one-die L-shape variant is a viable fallback if playtesting finds two dice too busy.
- **Explaining graded risk.** "The red die gets nastier as the clock reddens" must be crystal-clear in the tutorial, or the diagonal looks arbitrary. The red cube literally growing its blown-faces as `h` drops is the mitigation; verify it reads at projector scale.
- **`p = 0` and the `h = 0` wall are edge rows.** The dock-empty row and the forced-late column are not "interesting" decisions; keep them visually muted so the eye goes to the diagonal in the interior. Make sure learners don't mistake the flat −10 wall for the main result.
- **Capacity = 4 saturation.** Because a full truck caps at 4, WAIT at `p = 4` is never optimal (no upside, only risk) — good and intuitive, but it means the top row is uniformly SEND; confirm that reads as "full → always ship" rather than as a bug.
- **SARSA convergence to the exact diagonal.** With only 25 states SARSA should recover the frontier reliably, but the thin-order cells (`p = 1`) have small value gaps; the precompute must assert the learned policy matches the DP oracle on well-visited states and that the visible frontier is the 1→2→3→4 staircase.
- **Naming.** "Beat the Deadline" is punchy; double-check it doesn't over-promise (the optimal policy still *loses* money on thin orders — that honesty is a feature, but the title shouldn't read as "always win").

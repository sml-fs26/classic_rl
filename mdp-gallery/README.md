# MDP Gallery — candidate examples for a Pokémon-style RL explainer

This gallery collects **12 fully-designed MDP examples**, each a candidate for a single interactive, Pokémon-style reinforcement-learning visualization. The audience is **managers with 5–10 years of industry experience and very little programming background** — so every example is built around decision-making under uncertainty, ROI, and trade-offs, shows **no code**, and gives each RL idea a plain business gloss (state = "the situation now", action = "the lever", policy = "the playbook/SOP", return = "payoff summed over time", stochastic transition = "the part you don't control", exploration = "try the unproven option to learn", model-free learning = "learn the playbook from experience").

Every proposal walks the **same 13-scene arc** (title → tutorial → playtest → formalization → policy → trajectory → return → Q* → Bellman → DP → DP caveat → SARSA → recap) and must supply an analogue for all seven ingredients that made the reference work — most importantly a **tiny drawable state space**, **visible dice**, and a **state-dependent-optimal "evolution" twist**. The DNA those are measured against lives in [`reference/pokemon-arc.md`](reference/pokemon-arc.md). Detailed per-proposal plans (overview + scene-by-scene + hand-computable numbers) live in their own files — this page is just the map.

Scores are 1–10 on three axes: **Mgr** (manager appeal), **Visual** (visualizability à la Pokémon), **Pedagogy** (teaching richness).

| Proposal | Bucket | Mgr | Visual | Pedagogy | The twist (short phrase) | File |
|---|---|:--:|:--:|:--:|---|---|
| Last-Minute Pricing | revenue (yield) | 10 | 9 | 10 | Optimal price flips 3 ways across one 5×5 board — PREMIUM, STANDARD, FIRE-SALE | [brainstorm/proposals/01-perishable-pricing.md](brainstorm/proposals/01-perishable-pricing.md) |
| Churn Rescue | revenue (retention) | 10 | 9 | 9 | Best lever flips on both axes — even *within* "at-risk" (BIG OFFER vs CHECK-IN) | [brainstorm/proposals/02-churn-rescue.md](brainstorm/proposals/02-churn-rescue.md) |
| Pipeline Climb | revenue (sales funnel) | 9 | 10 | 9 | Same HARD CLOSE is +29 when READY, −3.28 when COLD | [brainstorm/proposals/03-lead-nurturing.md](brainstorm/proposals/03-lead-nurturing.md) |
| Trial Clock | revenue (SaaS growth) | 8 | 9 | 9 | Same PAYWALL PUSH is the worst cell cold and the best cell activated | [brainstorm/proposals/04-free-trial-conversion.md](brainstorm/proposals/04-free-trial-conversion.md) |
| Machine Doctor | operations (asset maintenance) | 9 | 8 | 9 | Lever marches down the gauge — RUN, SERVICE, REPLACE | [brainstorm/proposals/05-machine-maintenance.md](brainstorm/proposals/05-machine-maintenance.md) |
| Stale by Sundown | operations (perishables) | 9 | 9 | 9 | Lever marches down the freshness axis — HOLD, DISCOUNT, DUMP (stock barely matters) | [brainstorm/proposals/06-stale-by-sundown.md](brainstorm/proposals/06-stale-by-sundown.md) |
| Beat the Deadline | operations (logistics) | 9 | 9 | 9 | SEND/WAIT frontier cuts a clean diagonal across the 5×5 grid | [brainstorm/proposals/07-beat-the-deadline.md](brainstorm/proposals/07-beat-the-deadline.md) |
| Critical Spare | operations (spares inventory) | 8 | 8 | 9 | Same machine health → ORDER (empty bin) vs REPLACE (spare in hand) | [brainstorm/proposals/08-critical-spare.md](brainstorm/proposals/08-critical-spare.md) |
| Gambler's Ruin | classic textbook (finance/risk) | 9 | 8 | 9 | Optimal stake zig-zags up the cash ladder (bold in the middle, timid at edges) | [brainstorm/proposals/09-gamblers-problem.md](brainstorm/proposals/09-gamblers-problem.md) |
| Recycling Robot | classic textbook (canonical MDP) | 8 | 9 | 9 | Lever marches up the battery gauge — RECHARGE low, SEARCH high | [brainstorm/proposals/10-recycling-robot.md](brainstorm/proposals/10-recycling-robot.md) |
| Press Your Luck | classic playful (dice) | 8 | 8 | 8 | At one pot size, ROLL/HOLD flips purely on whether you're ahead | [brainstorm/proposals/11-pig-dice.md](brainstorm/proposals/11-pig-dice.md) |
| Windy Treasure Cave | classic playful (gridworld) | 7 | 10 | 9 | Optimal-heading arrows visibly bend *around* the pit | [brainstorm/proposals/12-windy-treasure-grid.md](brainstorm/proposals/12-windy-treasure-grid.md) |

## How to use this gallery

Read this table to shortlist, then open the individual `brainstorm/proposals/NN-slug.md` files for the full scene-by-scene plan and the hand-computable numbers that prove each twist is real (not asserted). The buckets group the slate by business flavor — **revenue** examples land most immediately with a manager audience, **operations** examples show capex/opex and logistics trade-offs, and the **classic** examples are familiar RL textbook MDPs reskinned for the boardroom. To choose what to build, optimize for **manager appeal first** (does it feel like a real boardroom decision?), then for a twist that is *felt rather than memorized* — a lever whose right answer visibly changes with the situation — and pick the single example whose state space, dice, and evolution analogue you can render on one screen.

## Recommended first builds (top 3)

1. **Last-Minute Pricing** — [`01-perishable-pricing.md`](brainstorm/proposals/01-perishable-pricing.md)

   Top combined manager + pedagogy scores (10/9/10) and the most boardroom-native topic in the slate: revenue management / yield, a trade-off every manager has lived. Its three-way optimal-price flip across a single 5×5 board (PREMIUM / STANDARD / FIRE-SALE) is the richest verified twist here — proven by exact value iteration that all three levers genuinely win somewhere — and it is already the fully-built reference proposal, so it is the lowest-risk, highest-payoff first build.

2. **Pipeline Climb** — [`03-lead-nurturing.md`](brainstorm/proposals/03-lead-nurturing.md)

   Best visual score in the slate (10) and the single cleanest state-dependent lesson: the exact same HARD CLOSE lever is worth +29 when the lead is READY but −3.28 when it is COLD. Every sales manager has felt a deal burned by closing too early, so the 'the answer depends on the situation' insight needs zero translation — maximal relatability with minimal cognitive load, the ideal teaching example.

3. **Churn Rescue** — [`02-churn-rescue.md`](brainstorm/proposals/02-churn-rescue.md)

   Tied for the highest manager appeal (10) and squarely about retention ROI — discount margin burn versus saving an account, a P&L decision managers make constantly. Its twist is the most sophisticated of the trio: the optimal lever flips on both axes and, crucially, even within a single 'at-risk' row it switches from BIG OFFER (renewal imminent) to CHECK-IN (long runway), making state-dependence something the audience feels rather than memorizes.


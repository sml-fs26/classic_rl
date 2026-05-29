# The Pokémon reference arc — design DNA

This is the spec every gallery proposal is measured against. The
`pokemon-battle/` viz in this repo is the reference implementation; this
document distills *why it works* and *what scenes it walks through* so a
new MDP example can reuse the same skeleton with a different skin.

## What made the Pokémon example beautiful

1. **A tiny, drawable state space.** State = (your HP bucket, opponent HP
   bucket) → 5×5 = 25 states. Small enough to render the *entire* Q-table
   as a 5×5 grid of cells on one screen. If you can't draw all the states
   at once, the DP scene loses its punch.
2. **A handful of intuitive actions.** Three moves (weak/reliable,
   medium, strong/risky). Few enough to show one Q-value per action per
   state without clutter.
3. **Visible dice.** Transitions are stochastic and the learner *sees*
   the randomness: a damage roll and an accuracy check. The "world rolls
   a die" is concrete, not abstract.
4. **A state-dependent-optimal twist.** The opponent *evolves*
   (Charmander → Charmeleon → Charizard) and each form resists/weakens
   different moves. So the optimal action is **not** constant across
   states — it changes with the state. This is the pedagogical jewel: it
   makes "the policy is a function of state" *felt*, and it makes the
   Q-table genuinely interesting rather than uniform.
5. **A clear terminal + reward.** −1 per turn (hurry up), +10 win, −10
   loss. Returns are bounded and hand-computable.
6. **A consistent visual language.** Sprites + segmented HP bars + a
   Pokédex-style grid. The *same* state-icon (two sprites under HP bars)
   recurs across scenes so the learner builds one mental picture.
7. **Hand-computable numbers.** The whole MDP is small enough that DP /
   value iteration converges in a few sweeps and the instructor can check
   any cell by hand.

A new example must supply an analogue for **each** of these seven.

## The canonical scene arc (0–12)

The new **Policy** scene (#4) sits between the formalization and the
trajectory scene — this is a deliberate addition over the original
Pokémon deck.

| # | Scene | Purpose | Key artifact |
|---|-------|---------|--------------|
| 0 | **Title / hook** | Set the theme, invite a click | Animated title, "PRESS START" |
| 1 | **Tutorial — how to play** | Teach the controls + the state/HP/turn vocabulary, no theory | Walkthrough panels |
| 2 | **Playtest — you run it** | The learner *is* the decision-maker; they click actions and feel the stochastic outcome | Live interactive MDP |
| 3 | **Formalization — what makes this an MDP** | Name the four parts: state `s`, action `a`, transition `P(s′, r \| s, a)`, reward `r` | S / A / P / R reveal |
| 4 | **Policy** *(new)* | A policy `π` is a rule from states to actions. "When you played, you *were* a policy." Show a couple of hand-policies (always-X, greedy-ish) on the state grid | π: S → A, illustrated on the grid |
| 5 | **Trajectory** | A run is a sequence of random variables `τ = (S₁, A₁, R₁, S₂, A₂, R₂, …)` | Rollout tape |
| 6 | **Return G_t** | `G_i(τ) = Σ_{j≥i} r_j`. Variance across runs from the same start; one chosen action → a distribution of returns | Reward tape + histogram |
| 7 | **Optimal action-value Q\*(s, a)** | `Q*(s, a) = max E[G_i(τ)]`. The state-icon + a two-column table (action a \| Q\*(s, a)), argmax starred | Per-state Q row |
| 8 | **Bellman optimality equation** | `Q*(s, a) = E[ R + max_{a′} Q*(S′, a′) ]`. The recursive definition | Formula card |
| 9 | **Dynamic programming — fill Q\*** | If `P` is known, sweep Bellman backups to a fixed point; watch the Q-table fill in, region by region | Animated Q-grid fill |
| 10 | **Why DP doesn't scale** | Two caveats: (a) we rarely *know* `P`; (b) even if we did, real state spaces explode | Two-reason card |
| 11 | **SARSA — learn Q\* by playing** | Derive the update from Bellman + one-sample estimate; ε for exploration; live demo that converges to the DP oracle | Trajectory tape + live Q-table + convergence bar |
| 12 | **Recap** | One card per concept (MDP, policy, return, Q\*, DP, SARSA); a "you've learned the bones" close | Badge/recap cards |

## Manager-audience translation layer

Target learners are managers with 5–10 years of industry experience and
**very little programming background**. Every RL concept needs a plain
business gloss:

- **State** → "the situation you're in right now."
- **Action** → "the lever you can pull."
- **Policy** → "your standard operating procedure / playbook."
- **Reward / return** → "the payoff, summed over time — not just this
  quarter."
- **Stochastic transition** → "the part of the outcome you don't
  control."
- **Q\*** → "the true long-run value of pulling lever a in situation s,
  assuming you play smart afterwards."
- **DP** → "if you had a perfect model of the world, you could compute
  the optimal playbook exactly."
- **Why DP fails** → "you never have a perfect model, and the world is
  too big to enumerate."
- **ε-greedy / exploration** → "sometimes try the unproven option to
  learn, instead of always exploiting what looks best today."
- **SARSA / model-free learning** → "learn the playbook from experience —
  trial, outcome, adjust — like running many small experiments."

No code on screen. Decisions, trade-offs, and payoffs — the language of
the boardroom.

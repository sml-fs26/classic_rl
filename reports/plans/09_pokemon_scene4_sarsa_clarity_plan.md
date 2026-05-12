# Plan — make Pokemon scene 4 (SARSA) easier to follow

Target: `classic_rl/pokemon-battle/js/scenes/scene4.js` + `js/qtable.js` + `css/style.css`.
User report: *"I'm not following what is happening in this scene 5. Can you come up with more pedagogical explanations of how the table is being filled?"*

This is the SARSA scene (deck index 5, key `scene4`). Same pedagogical treatment we just did for scene 2 (value iteration) — diagnose the confusion, propose layered fixes.

## What's there now

The scene currently has:
- A header row of params (ε, α, γ, episodes) shown read-only
- A scrubber over precomputed snapshots `[0, 1, 5, 25, 100, 500, 2000]`
- A 5×5 Q-table render via `QTable.mount`. Each state cell has:
  - A small battle-thumbnail with HP-bar mock for that state
  - Four Q-bars (one per move), bar-length scaled within the cell
  - ▶ next to the argmax move's bar
- Floating ±δ chips rising from cells whose argmax-Q moved between snapshots
- A learning-curve graph below the grid (win-rate per episode, with a cursor at the current snapshot)
- A one-paragraph caption explaining bars and "unreached states stay '—'"

So a lot of information is already on screen. The pedagogical problem is *interpretive*, not visual: students don't know what to focus on or why the values are changing the way they are.

## Three pedagogical leaks

1. **"Episode" is undefined.** The scrubber says EP 0, 1, 5, 25, 100, 500, 2000 — but a student new to RL might think "episode" means "VI sweep" (continuous with scene 2). It's actually one full battle, and each turn within a battle is one Q-update. Without naming this, the connection between "battles played" and "table filled" is invisible.
2. **The SARSA update rule isn't on screen.** Scene 2 puts the Bellman formula above the grid. Scene 4 has no equivalent — students see Q values change but don't see the rule that generates the change. The connection to the prior viz (`r + γQ' − Q` from Darts' Robbins-Monro form) is implicit and lost.
3. **No way to inspect one cell's update history.** Tiny Q-bars per cell are good for at-a-glance comparison, but useless for "why did THIS cell's Q for THIS action just jump?". Scene 2's click-cell inspector solved exactly this for VI. SARSA needs the same.

## The fix, in three layers

### A. Define "episode" + show what changed between snapshots

- **Narrator dialog above the grid**, same pattern as scene 2. Per-snapshot story:
  - EP 0: *"Episode 0 — PIKACHU has played zero battles. Q = 0 everywhere."*
  - EP 1: *"After 1 battle, every (state, move) pair the agent visited got one Q-update. The rest stay at 0."*
  - EP 5: *"4 more battles, more coverage. Cells near WIN-states are getting positive Q."*
  - EP 25: *"Patterns emerging. The reliable Thunderbolt is starting to dominate."*
  - EP 100: *"Q is stable in the most-visited region (your HP healthy). Rare states still wobble."*
  - EP 500: *"Almost converged. Compare to scene 2's V — same policy, learned the slow way."*
  - EP 2000: *"Q stable. The optimal policy is locked in."*
- **A "what one episode does" callout** explaining the relationship: *one episode = one battle ≈ 4-10 turns ≈ 4-10 Q-updates*. Spell this out so the jump from EP 25 to EP 100 = "75 more battles, ~400 more updates" makes intuitive sense.
- **Heatmap on max-Q** per cell (same green→red gradient as scene 2's V). The "filling" becomes visible as colour spreading across the grid, not just bar-length growth.

### B. Show the SARSA update — connect it to the prior viz

- **Move the SARSA formula above the grid**, KaTeX-rendered:
  > `Q(s, a) ← Q(s, a) + α [ r + γ Q(s', a') − Q(s, a) ]`
- Colour-code each chunk back to its prior-viz origin:
  - `Q(s, a)` in **ANYmal-red** (the MDP frame's action-value)
  - `α` in **Darts-amber** (Robbins-Monro learning rate)
  - `r + γQ(s', a')` in **Spooky-purple** (Bellman target, sampled not enumerated)
  - `(s, a, r, s', a')` indexing in **Casino-blue** (ε-greedy chose a, a')
- Caption explicitly names this as "the same lesson from the previous four viz, fused into one update".
- *Optional flourish:* a single-trajectory mini-replay panel that scrolls through one example battle's `(s, a, r, s', a')` transitions, with each Q-update highlighted on the grid as it happens. Most honest demonstration of "table filling = many updates from many battles".

### C. Click-cell inspector — the centrepiece

Same load-bearing piece as scene 2. Click any state cell → side panel:

```
STATE (YOUR=MID, OPP=LOW)        Visits at this snap: 47
─────────────────────────
Q-values (this episode snap):
  QUICK ATTACK   3.42
  THUNDERBOLT    8.71  ◀ ARGMAX (would pick if greedy)
  IRON TAIL      7.05
  THUNDER        7.83
─────────────────────────
Compare to last snapshot (EP 100):
  QUICK ATTACK   3.42 → 3.42  (unchanged)
  THUNDERBOLT    8.21 → 8.71  (Δ +0.50)
  IRON TAIL      6.98 → 7.05  (Δ +0.07)
  THUNDER        7.83 → 7.83  (unchanged)
─────────────────────────
Compare to VI (scene 2):  V(MID,LOW) = 9.00
  → SARSA's argmax-Q = 8.71. Same policy, slightly lower value
    because SARSA's policy is ε-greedy, not pure greedy.
```

The inspector is computed from the precomputed Q snapshots — no live simulation needed.

This panel does three pedagogical jobs at once:
1. Names the *number of times the agent reached this state* (visit count), so students see "more visits = more updates = more stable Q."
2. Shows the per-move Q-deltas between consecutive snapshots, so they see *what changed* rather than just *what is*.
3. Cross-references to scene 2's converged V, making the "VI and SARSA give the same answer" point concrete.

### D. (Nice-to-have) Visit-count overlay

A toggle/checkbox above the grid that flips between two views:
- **Q view** (default): the existing 4-bar-per-cell render.
- **Visit view**: each cell shows just the *number of times* the agent reached that state across training. Some cells are visited 1000+ times (start-state, common transitions); others are visited 0 times (unreachable from FULL/FULL via the learned policy).

This makes the "rare cells stay '—'" caption visual rather than verbal. Students see at a glance that learning is uneven across the state space — a real RL property the existing caption only mentions in passing.

## Sequence the student experiences

1. Land on scene 4. See: section title, narrator dialog (*"Episode 0 — PIKACHU has played zero battles. Q = 0 everywhere."*), SARSA formula above the grid colour-coded to prior viz, scrubber at EP=0, all-grey Q-table (zeros), learning curve flat at 0.
2. Scrub to EP 1. Narrator: *"After 1 battle…"*. A handful of cells show non-zero Q-bars. Their colours just barely tint green. Click any cell with a non-zero Q → inspector shows the four Q-values + "visits at this snap: 1".
3. Scrub to EP 25. More cells filled. The "start" cell (FULL, FULL) starts showing a clear argmax — Thunderbolt. Inspector at (FULL, FULL): visits 23, Q-Thunderbolt = 2.4, Q-Thunder = 1.9, etc. Compare-to-last-snap shows positive deltas.
4. Scrub to EP 500. Most cells coloured. Argmax stable across most of the grid. Click rare cell (CRITICAL, FULL) → inspector shows "visits at this snap: 3" (rare state) + still-noisy Q values.
5. Scrub to EP 2000. Grid colour-gradient matches scene 2's V gradient. Inspector at any cell: "Compare to VI: argmax matches" (or "argmax matches; values 0.1 lower because SARSA is on-policy").
6. Toggle visit-view → see the histogram of state visits. Cells the agent never reached are blank.

## Scope

About 250–350 lines:
- ~150 in `scene4.js`: narrator dialog, SARSA-formula card, click-cell handler, inspector panel rendering, visit-view toggle.
- ~80 in `qtable.js`: heatmap colour layer, visit-view alternate render, axis sprites (consistent with scenes 2 + 3).
- ~80 in `style.css`: heatmap classes, inspector panel layout, narrator above grid, formula-card positioning.

No new precompute *if* `DATA.sarsa.snapshots[i]` already contains visit counts. If it doesn't (likely the case — the snapshots are just Q arrays), add `visits` arrays to the precompute. ~20 lines in `precompute/build-datasets.js`.

## Phasing if the full plan is too much

**Minimum viable (≈ 1 hr):**
- A (narrator + heatmap colour + define "episode" in the caption)
- B without the optional trajectory replay

This already addresses *"what is happening when I scrub forward"*. The inspector is what closes the loop on *"why did THIS cell's Q for THIS move just change"*.

**Full plan** = A + B + C + D. ~2–3 hr including the visit-count precompute extension.

## Recommendation

Do the **full plan**. The minimum-viable cut skips the inspector, which is the same load-bearing piece I just shipped in scene 2 — and it's the *only* piece that explains "the table is being filled because each (s,a,r,s',a') tuple from one turn drives one Q-update." Without it the scene becomes prettier but no more comprehensible.

If you say go, I'll execute A + B + C + D, screenshot every snapshot, commit + push.

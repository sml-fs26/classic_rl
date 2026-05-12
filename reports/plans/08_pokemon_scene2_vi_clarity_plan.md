# Plan — make Pokemon scene 2 (value iteration) clearer

Target: `classic_rl/pokemon-battle/js/scenes/scene2.js` + `css/style.css`.
User report: *"I don't understand what the cells contain and what they mean and how the algorithm works."*

## What's there now

The current scene 2 has:

- A 5×5 grid of state cells (rows = your HP bucket, cols = opp HP bucket)
- Each cell shows `V(s)` as a bare number; after convergence it adds the optimal move label
- HUD strip with ITER counter, max-ΔV chip, γ readout
- RUN / STEP / RESET buttons
- A separate KaTeX card with the Bellman formula
- A one-paragraph caption explaining that V starts at 0

It animates correctly — values do propagate and the iteration converges — but pedagogically it lands flat for three concrete reasons.

## Three pedagogical leaks

1. **Bare numbers carry no story.** A cell that reads `−2.34` doesn't tell the eye anything. Without a colour scale, the 5×5 grid doesn't say "this corner is good, that corner is bad" at a glance.
2. **Iteration animates without explanation.** The student sees values change; they don't see *why*. There's no inspection mechanism for "where did V(MID, LOW) come from this iteration?"
3. **The Bellman formula is decorative.** It sits in a separate KaTeX card disconnected from the grid. Students see math + grid as two separate things, not "the math IS what's happening in the cells."

## The fix, in three layers

### A. Cell content + meaning (high-impact, low-cost)

- **Heatmap colour V**. Green (positive — you're winning) → cream (≈0 — neutral) → red (negative — you're losing). Cell colour intensity scales with `|V|` so the gradient is readable at a glance. The 5×5 grid becomes a *map*.
- **V interpretation strip** below the grid (or in the HUD): a permanent legend reading *"V(s) = expected total reward from state s, if you play optimally from here onward."* The meaning is always present, not buried in a caption.
- **Mark the start state.** Put a small "▶ BATTLE START" badge on the (FULL, FULL) cell — the state every fresh battle begins at. Its V is the *expected return from scratch*. That cell is the headline number.
- **Show the off-grid terminal anchors.** Add two strips at the grid edges:
  - Right side: a vertical green "+10 WIN" strip representing the implicit terminal state when opp faints.
  - Bottom: a horizontal red "−10 LOSS" strip for when you faint.
  These are the values V propagates *from*. Without them visible, students can't see where the gradient starts.

### B. Algorithm intuition (the centrepiece)

- **Per-iteration narration in a Pokemon dialog box** above the grid. Updates each step in plain English:
  - *Iter 0:* "V starts at 0 everywhere. We don't know anything yet."
  - *Iter 1:* "States next to WIN/LOSS pick up the terminal reward."
  - *Iter 2:* "Their neighbours pick it up from them. The reward propagates inward."
  - … etc, then at convergence: "V stopped changing. We know how much every state is worth."
- **Slow RUN to ~800 ms per iteration** (currently 500 ms). Give the eye time to read the narration and watch the gradient build.
- **Click-cell to inspect** (the load-bearing piece). Clicking any state cell opens a side panel showing the actual Bellman expansion for *that* cell at the *current* iteration:

  ```
  V(MID, LOW) at iter 5:
    QUICK ATTACK:  −1 + 0.95 × E[V(s')]  =  0.42
    THUNDERBOLT:   −1 + 0.95 × E[V(s')]  = +7.31  ◀ argmax
    IRON TAIL:     −1 + 0.95 × E[V(s')]  = +6.85
    THUNDER:       −1 + 0.95 × E[V(s')]  = +8.04
  ```

  The expected value is recomputed live from `Battle.successors(s, moveId)` + the current iteration's V snapshot, so as RUN progresses the inspector updates with it. Students literally see "the max of these four numbers becomes V(MID, LOW) next iteration."

  (Optional drill-down: click any move to expand the outcome tree — `50% Δ2 → terminal WIN +10 · 50% Δ1 → (MID, CRITICAL) → opponent counter-attacks: 20%/55%/25% over Δ0/Δ1/Δ2 → three possible successor states with these V values …`. Most honest about how the expectation is formed, but adds UI. Keep optional.)

### C. Connect the formula to the cells

- **Move the Bellman KaTeX card above the grid**, not below. Make it the "what we're computing" anchor.
- **Brighter glow on changed cells** each iteration. Already partially in code (`.flash` class); make it more visible — yellow pixel border that fades over ~500 ms so the propagation is impossible to miss.
- **Per-cell optimal move displayed during iteration**, not just at convergence. Shows the policy crystallising alongside V.

## Sequence the student experiences

1. Land on scene 2. See: title, narrator dialog (*"V = 0 everywhere — we don't know anything yet"*), grayscale 5×5 grid (all 0.00), green +10 WIN strip on the right edge, red −10 LOSS strip on the bottom edge, Bellman formula card above the grid.
2. Click **STEP**. Narrator: *"Iter 1. Terminal-adjacent cells now see WIN/LOSS."* Cells in the rightmost column and bottom row pick up colour. Other cells stay 0.
3. Click **STEP** again. *"Iter 2. Their neighbours pick up info from them."* Second-from-edge cells now have non-zero V.
4. … and so on. After 5–10 STEPs, the full gradient is visible. The student sees information *flow* into the grid.
5. Click any cell (say, the start FULL/FULL). Inspector opens: *"If I'm here, my expected return is V = +X. The best move is Y. Here's the math for all four moves at this iteration…"*
6. Click **RUN** to fast-forward to convergence and watch the same propagation in motion.
7. (Optional) Click a move inside the inspector → see its outcome tree (probabilities + successor states with their V values).

## Scope

About 250–350 lines of JS/CSS changes:

- ~80 lines in `scene2.js`: inspector panel, narrator dialog, cell-click handler, heatmap colour logic, slower RUN tick.
- ~60 lines in `style.css`: heatmap colours, glow animation, inspector panel layout, edge strips for terminals, start-state badge.
- ~40 lines of new helper for Bellman-expansion-for-one-cell (inline in scene2.js or a small `scene2_inspector.js`). Uses `Battle.successors(s, moveId)` (already exists) + current V snapshot.

No new precompute. The viz reads `DATA.valueIteration.byGamma` and that's already complete.

## Phasing if the full plan is too much

**Minimum viable improvement (≈ 1 hour):**
- A (heatmap + interpretation strip + start-state badge + terminal edges)
- B' (narrator dialog + slow RUN, *no inspector yet*)

This alone resolves "what do the cells mean" and "what's happening per iteration" — about 60% of the confusion. The inspector is what closes the loop on "how does the algorithm work."

**Full plan** = A + B + C. ~2–3 hours.

## Open question for the user

The inspector panel has two levels of depth:

1. Show V(s) decomposition over the 4 moves with expected values (above).
2. ...plus a drill-down on click into the outcome tree (probabilities + successor states with their V values).

Option 2 is more honest about how the expectation is computed — students see actual probabilities and successor V values being summed. But it adds significant UI density.

I'd start with option 1 alone (gives the "which move is best at this state and by how much" intuition) and add 2 only if invited.

## Recommendation

Do the **full plan**. The minimum viable cut skips the inspector, which is *the* piece that explains how the algorithm actually computes each cell's value. Without it the student still has to take "the iteration filled in the table" on faith — the grid becomes prettier but not more comprehensible.

If you say go, I'll execute A + B + C, screenshot every state, commit + push.

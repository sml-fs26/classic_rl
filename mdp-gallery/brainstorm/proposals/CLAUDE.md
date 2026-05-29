# proposals — instructions

One file per fully-fleshed MDP proposal: `NN-<slug>.md`. Each follows the
same template so they're comparable side by side:

1. **Title + one-line pitch**
2. **Why this lands with managers**
3. **The MDP at a glance** — S, A, P (the visible dice), R, terminal, the
   state-dependent-optimal *twist*, and the state-space size (must be
   small enough to draw the whole Q-table).
4. **Visual language** — sprites/icons, bars, board, colour coding.
5. **Scene-by-scene plan** — all 13 scenes of the canonical arc (see
   [`../../reference/pokemon-arc.md`](../../reference/pokemon-arc.md)),
   each with: what's on screen, what the learner does, the key
   takeaway/notation, and the manager framing.
6. **Numbers** — a concrete tiny instance (state set, action set, a few
   transition probabilities, rewards) so DP is hand-computable.
7. **Risks / open questions.**

## Discipline

The numbering `NN` is just reading order, not a ranking — the ranking
lives in `../README.md` and `../../README.md`. If you add, remove, or
renumber a proposal, update both READMEs and the brainstorm slate row.

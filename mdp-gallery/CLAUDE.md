# mdp-gallery — instructions

This folder collects **candidate MDP examples** for a Pokémon-style
interactive RL visualization, aimed at a **manager audience** (5–10
years industry experience, very little programming background). Nothing
here is implemented yet — these are design plans, kept for posterity so
we can pick one and build it the way `pokemon-battle/` was built.

## Layout

```
mdp-gallery/
  README.md              ← index: the slate, the recommendation, how to use
  CLAUDE.md              ← this file
  reference/
    pokemon-arc.md       ← the design DNA every proposal must follow (the 13-scene arc + what made Pokémon work)
  brainstorm/
    CLAUDE.md
    README.md            ← the full candidate slate (all ideas, scored), for posterity
    proposals/
      CLAUDE.md
      NN-<slug>.md       ← one fully-fleshed proposal per file (overview + scene-by-scene plan)
```

## The canonical arc

Every proposal walks the **same 13-scene arc** (0–12) defined in
[`reference/pokemon-arc.md`](reference/pokemon-arc.md). The order is:
title → tutorial → playtest → formalization → **policy (new)** →
trajectory → return G_t → Q\*(s,a) → Bellman → DP → DP caveat → SARSA →
recap. When a proposal deviates, it must say why.

## Discipline: keep the CLAUDE.md files current

**After any major change in this folder, update the relevant CLAUDE.md
and README.** "Major" means: adding/removing a proposal, changing the
canonical arc, renaming or restructuring folders, or picking a winner to
build. The CLAUDE.md files are the source of truth for *how this folder
is organized and why*; if they drift from reality they actively mislead.
A change is not "done" until its CLAUDE.md/README reflects it.

## When we pick a winner

The chosen proposal graduates from a `.md` plan to a real viz folder at
the repo root (a sibling of `pokemon-battle/`). At that point: add a
CLAUDE.md to the new viz folder, mark the winner in this README, and
keep the losing proposals here as the idea bank.

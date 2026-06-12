# The canonical <EXAMPLE-NAME> example (shared spec)

This file is the **single source of truth** for the running example used across
every downstream teaching artifact for `<TOPIC>`: the lecture notes, the
interactive site, and the notebook. All of them MUST use the instance, the
parameters, and the numbers defined here, so a student sees the *same* example
everywhere. This skeleton is generalized from
`agentic-research/LATS/lecture-notes/example-spec.md`; fill every bracket.

Every number in this document was produced by actually running the reference
implementation at [`../<notebook-dir>/reference-impl.py`](../<notebook-dir>/reference-impl.py)
(Python 3.x, fixed seed `<SEED>`, `<N>` iterations). Re-running the file
reproduces the trace below verbatim; the run is fully deterministic.

Audience: `<the workshop audience>`, with **no** prior exposure to `<TOPIC>`.
Every symbol is defined the first time it appears.

The example and its machinery are grounded in the source-paper briefs in
[`sources-digest.md`](./sources-digest.md). `<state which definitions / rules
come verbatim from which bar-clearing paper, with the citation>`.

> Punctuation note for downstream LaTeX: this Markdown file uses ASCII hyphens
> throughout. Do not paste Unicode em/en dashes into any artifact; the repo
> write hook rejects them, and the goal is dash-free RENDERED output.


## 1. The instance (picture + legend)

`<An ASCII picture or compact table of the concrete instance: the grid, the
graph, the documents, the matrix. Small enough that every number below can be
checked by hand. Call out the feature(s) that make the example TEACH something
rather than be trivial, e.g. the trap, the deceptive branch, the near-duplicate
document.>`


## 2. The formal object

`<Define the formal object the notes build on: an MDP tuple, a Markov chain, an
attention computation, a retrieval scoring function. Define EVERY symbol on
first use. State every pinned hyperparameter (budget, discount, temperature,
top-k) and JUSTIFY each choice in one sentence, citing the paper default where
there is one. The audience must not have to look anything up.>`


## 3. The method, step by step

`<State the algorithm the notes teach, as it appears in the bar-clearing
source, with each rule written once and cited. Keep notation identical to the
shared LaTeX preamble macros so the notes and this spec agree symbol-for-symbol.>`


## 4. Why this is not trivially solved another way

`<The honest objection a sharp student raises ("why not just brute-force / sort
/ enumerate?") and the honest answer. For a toy instance, say plainly that the
toy is a traceable proxy and name what disappears at scale. If you use a cheap
oracle to VALIDATE the toy (e.g. BFS reachability), say so: that is exactly the
role the oracle cannot play once the problem is large.>`


## 5. Worked trace of the first few steps (real numbers)

`<Paste the first few steps EXACTLY as the reference run prints them. Every
intermediate number a reader could recompute must appear. This is the section
that proves the example is hand-checkable.>`

```
<paste the literal printed trace here>
```


## 6. Converged / final result

`<Paste the converged or final result the reference run prints (the table, the
best path, the final distribution). Then read the result aloud: what is the
PAYOFF the student should take away?>`

```
<paste the literal printed final result here>
```


## 7. How this maps onto <TOPIC / the paper> (the bridge)

`<The correspondence table: each piece of the toy mapped to its counterpart in
the real method the weekend teaches. State the single substitution to highlight
(what the toy replaces with something heavier at the frontier).>`


## 8. Optional variant (for the site / notebook)

`<Any optional toggle the interactive artifacts may enable to show the method
under a harder regime, defined precisely, with its default value stated. Keep
the by-hand trace on the clean case; use the variant only for the demo.>`


## 9. Notation table

Every symbol used above, defined once.

| Symbol | Meaning |
|--------|---------|
| `<sym>` | `<meaning>` |


## 10. Shared LaTeX preamble

Both (all) lecture-note documents `\input` the shared preamble. See
[`notes-preamble.tex`](../../.claude/skills/lecture-notes/templates/notes-preamble.tex)
in the skill (copy it next to the notes and rename the colors / examplebox
title / macros to this topic). It defines: `dsfont` for the `\mathds{1}`
indicator (amssymb has no blackboard-bold digit 1), the `amsthm`
theorem/definition/example environments, the running-example `tcolorbox`, the
shared TikZ tree styles, and the key-formula macros typed ONCE so every
document renders the identical symbol.


## 11. Reproducing the numbers

```
cd <notebook-dir>
python3 reference-impl.py
```
Seed `<SEED>`, `<other pinned params>`, `<N>` iterations. The printed trace of
the first few steps and the converged result match Sections 5 and 6 of this
document exactly. At import the script also runs a semantic-validity assertion
(`<name it>`), so a broken example never produces a misleading run.

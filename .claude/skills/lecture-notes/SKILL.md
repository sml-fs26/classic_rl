---
name: lecture-notes
description: Build a self-contained LaTeX lecture-notes set (plus an interactive companion site and a runnable notebook) for a frontier research topic in this repo, the way the LATS notes were built. Use when the user asks to "teach", "write lecture notes", "build teaching materials / a deep-dive", or "explain a paper from scratch" for a weekend's frontier topic (planning-as-search, RAG, agents, an ICML/NeurIPS paper, ...) and wants a rigorous, self-contained, hand-checkable artifact anchored on one worked example. Covers the phased multi-agent workflow (gather sources + brainstorm examples, co-decide the anchor, spec a runnable reference impl, build notes/site/notebook in parallel, verify by rendering), the shared LaTeX preamble, semantic-validity assertions, the dsfont indicator trap, and the dash rule.
---

# lecture-notes

Conventions for building a **self-contained LaTeX lecture-notes set** for a frontier research topic in this repo, together with an **interactive companion site** and a **runnable notebook**, all anchored on one **worked example** whose numbers are pinned by a runnable reference implementation. The proven exemplar is `agentic-research/LATS/` (MCTS / LATS for Weekend 7): two LaTeX documents (`mcts.tex`, `lats.tex`), a single-file offline site (`mcts-website/index.html`), a notebook (`mcts-notebook/mcts.ipynb`), all citing the same numbers from `lecture-notes/example-spec.md`. Read that folder once; then apply the patterns here.

This skill is the **teach-from-a-paper** sibling of `course-viz`. `course-viz` builds a standalone interactive visualization; this builds a full teaching SET (notes + site + notebook) where the LaTeX notes are the primary deliverable and the worked example is the spine. When the companion site grows into a full multi-file editorial scrollytale, follow `course-viz` for that one artifact; the single-file site form documented here is the LATS pattern for a notes companion.

Inherit `RESEARCH_CONVENTIONS.md` (binding): the provenance bar (only bar-clearing venues or top-lab preprints may be cited), 4 to 8 h project framing, currency policy, solo-on-main commits with the co-author trailer. The notes teach a paper that already cleared the bar in the dossier; do not re-source it from the web, read the vendored PDF.

## When to use

- The lead asks to build teaching materials, lecture notes, a deep-dive, or a "teach this paper from scratch" artifact for a weekend's frontier topic.
- The deliverable must be **self-contained for the audience** (a bachelor / professional with ML fundamentals but no depth in the paper's subfield): every symbol defined on first use, dense paper sections expanded.
- There is **one paper or method** at the center, and you can anchor everything on **one small worked example** a reader can check by hand.

Do **not** use this for: curating the dossier itself (that is `RESEARCH_CONVENTIONS.md` + the dossier `CLAUDE.md`); a standalone interactive viz with no notes (`course-viz` / `teaching-viz`); a one-page reading brief (the dossier's `teaching-brief.md` pattern).

## The orchestration shape (the durable rule)

A phased multi-agent workflow: **OWN-THE-LINCHPIN, then PARALLEL BUILD, then VERIFY-WITH-CRITIQUE.** Scout and spec inline yourself; delegate gathering and per-artifact building to parallel agents; keep the canonical example, the theme/preamble, the bar/winner decisions, the voice, and the verification **single-threaded**. The two workflow templates encode this:

- `templates/gather-brainstorm.workflow.py` (Phase 1)
- `templates/spec-build-verify.workflow.py` (Phases 2 to 4)

Both model the shape this repo's LATS session used: a batch of parallel `agent()` calls with strict output schemas, then single-threaded synthesis by the orchestrator.

## Hard requirements

1. **Folder layout.** Mirror `agentic-research/LATS/`:
   ```
   <topic>-research/<PAPER-or-TOPIC>/
     lecture-notes/
       preamble.tex        <- the shared, smoke-tested LaTeX preamble (linchpin)
       notes.tex           <- one or more documents that \input preamble.tex
       notes.pdf           <- COMMITTED (the readable deliverable)
       example-spec.md     <- single source of truth: instance + real trace + numbers
       sources-digest.md   <- the source-paper briefs grounding the notes
       .gitignore          <- ignores *.aux/*.log/*.toc/*.out/... (PDF is committed)
     <notebook-dir>/
       reference-impl.py   <- runnable, deterministic, asserts validity, prints the trace
       _build_notebook.py  <- builds the .ipynb via nbformat (valid JSON guaranteed)
       <topic>.ipynb       <- COMMITTED (runnable deliverable)
     <site-dir>/
       index.html          <- single-file, offline, dependency-free; reproduces the trace
     <example-dir>/
       brainstorm.md        <- the ~20 curated example candidates + the chosen winner
   ```

2. **One worked example, co-decided with the lead.** Everything (notes, site, notebook) anchors on the SAME example. The pick is pivotal; co-decide it (see Phase 1c).

3. **Single source of truth for numbers.** A runnable `reference-impl.py` pins the canonical worked example; `example-spec.md` quotes its REAL printed output; every artifact cites the SAME numbers. Bake in-file assertions so drift fails loudly.

4. **Semantic validity is asserted, not assumed.** The reference impl asserts at IMPORT that the example is structurally valid (see §Semantic validity). This is not optional.

5. **Self-contained for the audience.** Define every symbol on first use; expand every dense paper passage. Err long, not terse.

6. **Dash-free RENDERED output.** See §The dash rule. Verify the rendered PDF / HTML, not just that the bytes passed the write hook.

7. **Verify by rendering and reading, not just compiling.** See §Verification. The critic agent renders all pages and READS them.

## Smoke-test the linchpin first

The shared LaTeX preamble is the linchpin. **Author it first, compile a 2-page test, render it to PNG, and EYEBALL it BEFORE fanning out the build.** A broken preamble fanned out in parallel wastes every parallel artifact.

Start from `templates/notes-preamble.tex` (it compiles standalone; see the smoke-test command in §Verification). Rename the colors, the `examplebox` title, and the convenience macros to your topic. Confirm by looking that:

- the `\mathds{1}` indicator renders a real double-struck digit one (NOT the `\mathbb{1}` junk glyph; see §The mathds trap);
- the theorem (italic) and definition/example (upright) environments look right;
- the `examplebox` tcolorbox and the shared TikZ tree styles render.

LATS lesson, learned the hard way: the **slide** Beamer theme WAS smoke-tested and it paid off; the **notes** preamble was NOT pre-tested and shipped a broken indicator glyph that a human caught later. Do not repeat that. If you also build a slide deck, its Beamer preamble is its own separate linchpin: smoke-test the slide theme (compile a 2-slide test, render, READ it) before fanning out slides, and watch for dark-background label collisions.

## The shared LaTeX preamble

`templates/notes-preamble.tex` is the generalized version of the preamble at the top of `agentic-research/LATS/lecture-notes/lats.tex` (and quoted in §10 of that folder's `example-spec.md`). It provides, in one `\input`-able block:

- **`dsfont`** for the `\mathds{1}` indicator (the reason is in §The mathds trap).
- **`amsthm`** theorem/lemma/proposition (plain, italic, shared counter) and definition/example/remark (definition style, upright, shared counter) environments.
- **`tcolorbox`** (`[most]`) with an `examplebox` that visually sets off the running example; rename its title per topic.
- **`tikz`** with shared tree-figure styles (`treenode`, `rootnode`, `termnode`, `ghost`, `treeedge`, `ghostedge`) so every diagram across documents matches.
- **`xcolor`** calm low-saturation palette (`calmblue`, `calmteal`, `calmsand`, `calmgray`, `calmbg`); the companion site reuses these as CSS variables so the set looks unified.
- **Convenience macros for the key formulas, typed ONCE**, so every document and every cross-reference renders the identical symbol (single source of truth for notation).

Both (all) lecture-note documents `\input` this one file. Do not let a build agent modify it after the smoke test.

## Semantic validity is not numeric consistency

The headline lesson of this skill. The first LATS grid passed **every** compile, number, and dash check and was still wrong: it had **unreachable cells** (a dead region the agent could never stand on), caught only when a human eyeballed the rendered diagram. Numeric consistency (the notes, site, and notebook all agreeing) does not catch a structurally invalid example.

The guard: the reference implementation **asserts the example actually works, at import time**, before any run. For the LATS grid this is a breadth-first flood-fill from the start asserting that every special cell (treasure, clue, pit) is reachable and there is no dead space; importing a broken grid raises immediately. `templates/reference-impl.py` ships this pattern (a BFS reachability assert). For your example, encode the analogous structural invariant as code and call it at import:

- a graph / gridworld: every special node reachable, no dead region;
- a probability example: the distribution sums to 1, no negative mass;
- a linear-algebra example: the matrix has the rank / shape the notes claim;
- a search tree: no orphan node, the claimed optimum is actually reachable.

Then, separately, also render the example's diagram and have the critic agent LOOK at it (§Verification). The assert is the cheap guard; the human/critic eyeballing the picture is the backstop.

## The mathds trap

`amssymb` has **no blackboard-bold digit 1**, so `\mathbb{1}` renders a junk glyph (it looks like a logic / turnstile symbol, not a one). For an indicator function use **`\mathds{1}`** via `\usepackage{dsfont}` (already in the preamble). More generally: **render the math and eyeball it.** A wrong glyph compiles cleanly and is invisible to every numeric check; only looking at the PNG catches it. (This exact bug shipped in the first LATS notes.)

## Figure hygiene (the awkward-graphics traps)

Sibling lesson to the mathds trap: a TikZ figure can compile cleanly, carry every correct number, and pass every dash check while being visually broken in ways no numeric check sees. The Weekend 0 NumPy/linalg notes shipped SIX such figures past the full-page critic; each was caught only by a per-figure high-DPI audit (Verification step 4b). They fell into a handful of recurring traps. PREVENT them at authoring time; the notes/figure build agent should treat this as a checklist:

1. **A label can be wider or taller than the slot you imagined.** Column headers wider than their cells collided into one unreadable run (`oatsp.butterwheybanana`). If a label may exceed its slot, ROTATE it (`anchor=south west, rotate=35`) so it fans over its own column, or widen the slot. Never assume text fits.
2. **A label at an absolute coordinate grazes the border and reads as glued.** Weight labels placed at a hand-tuned coordinate sat exactly on the cell's top edge. Give every label an explicit gap from what it labels (`above=1.5mm of <node>`), not a coordinate that happens to graze an edge.
3. **Connectors must route AROUND content, not through it.** Dotted row-to-vector connectors left via `.south` and cut diagonally across unrelated cells and their numbers. Leave and enter via the nearest FREE edge (here `.north`, arcing over the grid) so a line never crosses a cell or label it does not reference.
4. **Align grouped objects on ONE shared axis; do not top-pin.** Three matrices with different row counts (3, 2, 3) were each pinned at the same TOP coordinate, so they staggered and the `@` and arrow operators floated a row too high. Center every member of a visual group, and the operators between them, on a single shared axis; compute the half-cell offsets, do not eyeball them.
5. **Never draw an arrow between two anchors that can coincide.** `\draw (a.east) -- (b.west)` where `b` is `right=0pt of a` is a ZERO-LENGTH segment: only a stray arrowhead renders, stuck on the shared border. Use spanning anchors (`a.north east -- b.north east`) or give the arrow real length.

The backstop is the same as for the mathds glyph: RENDER each figure and LOOK (Verification step 4b). The checklist is the cheap guard; the eyeball is what actually catches these.

## Self-contained-for-the-audience discipline

The audience has ML fundamentals but no depth in the paper's subfield. Define **every** symbol the first time it appears. **Expand** dense paper sections: the LATS notes inflated a roughly 2-page method section (paper §4.2) to about 5 pages, unpacking every sentence a bachelor would not grasp. When in doubt, write the extra paragraph. A reader should never need to open the paper to follow the notes.

## The dash rule

This repo has a PreToolUse write hook that REJECTS Unicode em/en dashes (U+2014, U+2013) in files you write. But bytes passing the hook is **necessary, not sufficient**: the real goal is **dash-free RENDERED output**.

- **In LaTeX:** NEVER type a triple-hyphen run (it typesets an em dash) or a prose double-hyphen run (it typesets an en dash). Use a comma, colon, parentheses, or the word "to". The ONLY exempt double-hyphen is a TikZ line segment inside a `tikzpicture` (an edge between two named coordinates).
- **In HTML:** never the `mdash` or `ndash` named entities, nor a numeric dash entity (decimal `8212` / `8211`, or their hex forms).
- **Verify the RENDERED output, every time.** The authoritative check greps the PDF text for the two Unicode dash codepoints using PCRE hex escapes (so the command itself contains no dash byte):
  ```bash
  pdftotext notes.pdf - | grep -cP '\x{2014}|\x{2013}'   # MUST print 0
  grep -nE -- '---|[^-]--[^-]' notes.tex                 # find prose hyphen runs in source
  ```
  A TikZ `(a) -- (b)` segment is a legitimate source hit; a prose one is a bug.

## Parallel-agent fan-out

### Phase 1 (parallel): gather sources + brainstorm examples

Two concurrent fan-outs, then single-threaded synthesis. Full script: `templates/gather-brainstorm.workflow.py`.

- **1a, source reads (one agent per paper).** Deep-read the anchor paper and its key antecedents into one `sources-digest.md`. Vendoring brief for each agent: **WebFetch to arxiv is blocked, but `curl` works** ::
  ```bash
  curl -sL -o papers/<slug>_<arxiv-id>.pdf https://arxiv.org/pdf/<id>
  ```
  then **ALWAYS title-verify** (a past download was silently truncated):
  ```bash
  pdftotext -f 1 -l 1 papers/<slug>_<arxiv-id>.pdf - | head -3
  ```
  Agents return venue + year + senior author + lab as **evidence**; YOU adjudicate the provenance bar centrally (do not let subagents rule on it).
- **1b, example brainstorm (one agent per cluster).** Generate candidates by cluster (games / puzzles-planning / real-world / abstract worked for LATS), rate each against the "good anchor" rubric, then curate down to **about 20** in `brainstorm.md`.
- **1c, co-decide the winner WITH THE LEAD.** Present the shortlist + your recommendation + rationale and PAUSE. Every downstream artifact builds on this pick; do not choose silently. (LATS: the grid treasure-hunt was chosen with Carlos.)

### Phase 3 (parallel): build the artifacts

One agent per artifact, each handed `example-spec.md` and the smoke-tested `preamble.tex`. Full script with all three briefs: `templates/spec-build-verify.workflow.py`.

**Notes agent prompt template** (copy and fill the bracketed fields):

> Write the LaTeX lecture notes `notes.tex` for `[TOPIC]`, audience `[AUDIENCE]`, anchored on `[ANCHOR-EXAMPLE]`.
>
> **Preamble.** `\input` the smoke-tested `preamble.tex` already in `lecture-notes/`. Do NOT modify it. Use the `examplebox` tcolorbox for the running example and the shared TikZ tree styles for figures.
>
> **Numbers.** Every number you state must be the number in `example-spec.md`. Quote its worked trace verbatim. Do not compute or recall numbers yourself.
>
> **Self-contained discipline.** Define every symbol on first use. EXPAND every dense source passage so a `[AUDIENCE]` reader needs no external lookup. Err long, not terse.
>
> **Dash rule.** Dash-free RENDERED output. NEVER a triple-hyphen run (em dash) or a prose double-hyphen run (en dash); use a comma, colon, parentheses, or "to". The only exempt double-hyphen is a TikZ line segment inside a tikzpicture.
>
> **Section narrative** (the pedagogical arc): `[3 to 6 SENTENCES, what the reader should understand by the end]`
>
> **Verification.** `pdflatex` compiles clean; the rendered-PDF dash grep prints 0; numbers match the spec; render every page to PNG and confirm the indicator is a real `\mathds{1}` and no glyph is garbled.

**Site agent** (single-file, offline, no CDN / fetch / build): port the reference implementation's logic to JS so the first few steps reproduce the spec's trace exactly; reuse the lecture-notes palette as CSS variables; step the method one phase at a time. HTML dash rule: no `mdash` / `ndash` named or numeric dash entities. (For a full editorial multi-file site, defer to `course-viz`.)

**Notebook agent**: generate the `.ipynb` PROGRAMMATICALLY with `nbformat` (a `_build_notebook.py`) so the JSON is valid; import / embed the SAME `reference-impl.py` (do not fork the algorithm); reproduce the canonical trace plus convergence / explore-exploit / variant plots; verify with `jupyter nbconvert --execute`.

### Phase 4 (verify with critique)

Mechanical checks (you), then a dedicated **style/consistency critic agent** that renders ALL pages to PNG and the site via headless Chrome and READS every image. See §Verification. When the notes carry more than a couple of TikZ figures, add the **per-figure aesthetic audit** (`templates/figure-audit.workflow.py`): full pages at 130 DPI are too coarse to catch figure-level layout bugs, so crop each figure tight at 200 DPI and read it alone (§Verification 4b).

## Reference implementations

When you have access to `agentic-research/LATS/`, these are the canonical examples to match. When you don't, the templates here are sufficient to start.

| Pattern | Reference path (in `agentic-research/LATS/`) | Template here |
|---|---|---|
| Shared LaTeX preamble (dsfont, amsthm, tcolorbox, tikz, palette, macros) | top of `lecture-notes/lats.tex`; `example-spec.md` §10 | `templates/notes-preamble.tex` |
| Runnable reference impl with import-time validity assert + trace printer | `mcts-notebook/reference_mcts.py` | `templates/reference-impl.py` |
| Single-source-of-truth spec doc quoting the real trace | `lecture-notes/example-spec.md` | `templates/example-spec.md` |
| Programmatic notebook builder (nbformat) | `mcts-notebook/_build_notebook.py` | (model on the LATS file) |
| Single-file offline interactive site reusing the notes palette | `mcts-website/index.html` | (model on the LATS file; or `course-viz`) |
| Example-candidate brainstorm + chosen winner | `mcts-toy-examples/brainstorm.md` | (model on the LATS file) |
| Source-paper digest grounding the notes | `lecture-notes/sources-digest.md` | (model on the LATS file) |
| Beamer slide preamble (if a deck is built) | `slides/beamer-preamble.tex` | (model on the LATS file) |
| gitignore (commit PDFs / ipynb, ignore aux) | `lecture-notes/.gitignore`, `slides/.gitignore` | `templates/gitignore-template` |
| Phase-1 orchestration (gather + brainstorm) | (the LATS build session) | `templates/gather-brainstorm.workflow.py` |
| Phase-2-to-4 orchestration (spec + build + verify) | (the LATS build session) | `templates/spec-build-verify.workflow.py` |
| Per-figure awkward-graphics audit (crop high-DPI, read, fix, verify, loop) | (the Weekend 0 NumPy/linalg session) | `templates/figure-audit.workflow.py` |

## Verification

### 1. Reference implementation runs and self-asserts

```bash
python3 <notebook-dir>/reference-impl.py    # exit 0; import-time validity assert + drift guard pass
```
A non-zero exit means either the example is structurally broken (the import assert fired) or the canonical numbers drifted from what the spec expects (the drift guard fired). Reconcile both before continuing.

### 2. Preamble smoke test (BEFORE the build fan-out)

```bash
pdflatex -interaction=nonstopmode templates/notes-preamble.tex   # or your renamed preamble.tex
pdftoppm -png -r 130 notes-preamble.pdf /tmp/preamble_smoke
```
Then **Read** `/tmp/preamble_smoke-1.png` and look: is `\mathds{1}` a real double-struck one? Do the theorem/definition boxes and the `examplebox` render? (The template ships with a tiny smoke-test body; once you split the preamble out into `preamble.tex` for `\input`, drop the `\begin{document}` block.)

### 3. Notes compile and render dash-free

```bash
pdflatex -interaction=nonstopmode lecture-notes/notes.tex   # run twice for the TOC / refs
pdftotext lecture-notes/notes.pdf - | grep -cP '\x{2014}|\x{2013}'   # MUST print 0
```

### 4. Render EVERY page and READ it (the critic pass)

The agent has no eyes; exit-0 and matching numbers do not catch invisible / garbled glyphs, label collisions, off-page clipping, or invalid example states. Render all pages and look:

```bash
pdftoppm -png -r 130 lecture-notes/notes.pdf /tmp/notes_page
# then Read /tmp/notes_page-*.png, every one
```
For the site, screenshot via headless Chrome (see `course-viz` §Verification for the flag set and the iframe-scroll workaround). **Open the PNGs. Don't skip this.** Every real bug the LATS session hit (an unreachable example region, the `\mathbb{1}` junk glyph, dark-background label collisions on slides) was caught by rendering, not by compiling.

### 4b. Per-figure aesthetic audit (high-DPI crops, one figure at a time)

Step 4 renders FULL pages at 130 DPI, which is too coarse to judge figures: the Read tool downsamples a letter page to ~1568 px, so a figure a third of a page tall lands at ~500 px and a label grazing a border, a connector clipping a cell, an off-center matrix, or a zero-length arrow are all sub-visible. Audit figures SEPARATELY, each cropped tight and rendered high, against the figure-hygiene traps:

```bash
grep -n 'begin{tikzpicture}\|caption{' notes.tex          # map each figure to its page
# For a figure on page PG, vertical band [YS%, height YH%] of the page, at 200 DPI.
# Page is 1700 x 2200 px, so -y is YS*22 and -H is YH*22; -singlefile = no suffix:
pdftoppm -png -singlefile -r 200 -f <PG> -l <PG> -x 0 -y <YS*22> -W 1700 -H <YH*22> notes.pdf /tmp/figN
# then Read /tmp/figN.png and judge it against the figure-hygiene traps.
```

Resolution gotcha: keep BOTH crop dimensions under **2000 px** or the Read tool rejects the image. At `-r 200` the width is 1700 px (safe); only a near-full-page-tall band exceeds 2000 px tall (then drop to `-r 170`). Loop per figure: crop, read, and if awkward make a POSITIONING-ONLY fix, rebuild, re-crop, re-read, until clean; keep a before/after crop. This is parallelizable (one agent per figure) and shipped as `templates/figure-audit.workflow.py`: diagnose-per-figure in parallel, then ONE serial apply+rebuild agent (the notes file is edited serially so parallel edits never conflict), then verify-per-figure in parallel, looping until clean. Run it whenever a notes set has more than a couple of TikZ figures.

### 5. Notebook executes top to bottom

```bash
python3 <notebook-dir>/_build_notebook.py
jupyter nbconvert --execute --to notebook --inplace <notebook-dir>/<topic>.ipynb
```

### 6. Cross-check numbers

The trace in the notes, the site's first few steps, and the notebook's output must all equal the spec's numbers (which equal the reference run's). Spot-check at least the first few steps and the final result across all three.

## Verification checklist (the order matters)

1. `reference-impl.py` runs, exit 0 (import validity assert + drift guard pass).
2. **Smoke-test the preamble**: compile, render to PNG, READ it (indicator + envs + box).
3. Notes compile clean (`pdflatex` twice).
4. **Dash check on the rendered PDF**: the `pdftotext | grep -cP` hex-escape check prints 0; `grep` the source for prose hyphen runs.
5. **Render EVERY page to PNG and READ each one** (the critic pass): glyphs, collisions, clipping, and the example's diagram is structurally valid.
   - **Per-figure high-DPI audit:** crop each TikZ figure tight at 200 DPI and READ it ALONE against the figure-hygiene traps; full-page 130 DPI is too coarse to see a label grazing a border, a connector clipping a cell, an off-center matrix, or a zero-length arrow. Use `templates/figure-audit.workflow.py` when there are more than a couple of figures.
6. Notebook builds and `nbconvert --execute` runs top to bottom.
7. Site opens from `file://`, reproduces the spec trace, has no dash entities in source.
8. Cross-check the numbers across notes / site / notebook against the spec.
9. Only then commit (solo on main, small logical commits, co-author trailer).

Step 5, actually looking at the rendered pages, is what makes the rest work. Do not skip it.

## Things to never do

- **Assume numeric consistency implies a valid example.** A sealed / dead / degenerate example passes every number and dash check. Assert the structural invariant at import AND eyeball the rendered diagram. (The first LATS grid shipped with unreachable cells.)
- **Use `\mathbb{1}` for an indicator.** `amssymb` has no blackboard-bold one; it renders a junk glyph. Use `\mathds{1}` via `dsfont`. And render the math to confirm.
- **Fan out the build before smoke-testing the preamble.** A broken shared preamble wastes every parallel artifact. Compile a 2-page test, render it, READ it first.
- **Type a triple-hyphen run or a prose double-hyphen run in LaTeX**, or an `mdash`/`ndash` (named or numeric) entity in HTML. The rendered output must be dash-free; the only exempt double-hyphen is a TikZ line segment inside a `tikzpicture`. Bytes passing the write hook is necessary, not sufficient: verify the RENDERED pdf with the `pdftotext | grep -cP` hex-escape check.
- **Let any number live anywhere but the reference impl.** No artifact computes or recalls its own numbers; all quote the spec, which quotes the reference run. Bake a drift assert so a stale number fails loudly.
- **Ship a paper section at the paper's density.** Expand every dense passage; define every symbol on first use. A reader must not need the paper open.
- **Choose the anchor example silently.** It is pivotal; co-decide it with the lead before building anything.
- **Verify by compiling / exit-0 alone.** Render and READ. Use the style/consistency critic agent; it renders all pages and reads them.
- **Verify figures by full-page render alone.** A full page at 130 DPI is too coarse to see a label grazing a border, a connector clipping a cell, an off-center matrix, or a zero-length arrow; the Read tool downsamples a page to ~1568 px. Crop each figure tight at 200 DPI and READ it in isolation (Verification step 4b; `templates/figure-audit.workflow.py`). Six Weekend 0 figures shipped awkward because the critic only skimmed full pages.
- **Leave the awkward-graphics traps unchecked** (see Figure hygiene): a label wider than its slot, a label grazing a border, a connector routed through an unrelated cell, a group top-pinned instead of centered on a shared axis, or an arrow between coincident `right=0pt` anchors. Each compiles clean and passes every numeric check; only rendering the figure catches it.
- **Hand-write the `.ipynb` JSON.** Generate it with `nbformat` via a `_build_notebook.py` so it is valid by construction; import the same reference impl rather than re-implementing the algorithm.
- **Let a build agent edit the shared preamble after the smoke test**, or fork the algorithm between the notebook and the reference impl. One linchpin, one source of truth.
- **Commit LaTeX aux files** (`*.aux/*.log/*.nav/*.snm/*.toc/*.out/*.vrb`) or `__pycache__/`. Use `templates/gitignore-template`. DO commit the compiled `.pdf` and the `.ipynb`: they are the readable deliverables.
- **Cite below the provenance bar**, or let a subagent adjudicate the bar. Subagents return venue + year + senior author + lab as evidence; you rule centrally (see `RESEARCH_CONVENTIONS.md`).

## Recipe for a new topic

1. **Read the exemplar and the conventions.** Skim `agentic-research/LATS/CLAUDE.md`, its `lecture-notes/example-spec.md`, and `mcts-notebook/reference_mcts.py`. Read `RESEARCH_CONVENTIONS.md`. Confirm the paper clears the provenance bar and is already vendored in the dossier `papers/` (read the local PDF; do not re-source).

2. **Phase 1, gather + brainstorm (parallel).** Run `templates/gather-brainstorm.workflow.py`: fan out source reads into `sources-digest.md` (curl + title-verify any non-local PDF), and fan out example candidates by cluster into `brainstorm.md`, curated to about 20.

3. **Phase 1c, co-decide the anchor example with the lead.** Present the shortlist + recommendation; PAUSE for the pick.

4. **Phase 2, spec the linchpin (you, single-threaded).**
   a. Copy `templates/reference-impl.py`; make it embody the anchor example; ensure it is deterministic, asserts semantic validity at import, and prints a hand-checkable trace. Run it; its stdout is law.
   b. Copy `templates/example-spec.md`; paste the reference run's REAL output; define every symbol; write the bridge to the frontier method.
   c. Copy `templates/notes-preamble.tex`; rename colors / macros / `examplebox` title; **smoke-test it** (compile, render, READ the PNG). Copy `templates/gitignore-template` into the notes folder.

5. **Phase 3, build in parallel.** Dispatch the notes, site, and notebook agents with the prompt templates (`templates/spec-build-verify.workflow.py`), each handed the spec and the smoke-tested preamble, each told every number comes from the spec and the output must be dash-free.

6. **Phase 4, verify with critique.** Run the mechanical checks (reference impl exit 0; notes compile; rendered dash count 0; notebook executes; numbers cross-checked), then the style/consistency critic agent that renders ALL pages + the site and READS them. Fix what it flags, re-render, re-read. If the notes carry more than a couple of TikZ figures, also run the per-figure aesthetic audit (`templates/figure-audit.workflow.py`): crop each figure tight at 200 DPI and read it alone against the figure-hygiene traps (full-page 130 DPI is too coarse).

7. **Commit.** Solo on main, small logical commits, co-author trailer per the repo `CLAUDE.md`. gitignore the build artifacts; commit the PDFs and the notebook. Update the dossier `CLAUDE.md` status / open-tasks.

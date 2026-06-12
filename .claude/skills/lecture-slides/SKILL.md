---
name: lecture-slides
description: Build animated, minimal-text, diagram-driven Beamer slide decks from existing lecture notes in a light, projection-first Metropolis style with the standard LaTeX fonts, then publish them to GitHub Pages. Use when the user asks for "slides", a "deck", a "Beamer presentation", "lecture slides", or to "turn the notes into slides" and/or to "put the slides online" / "deploy to Pages" for a course topic. Defines the pdflatex light theme (dark is a screen-only variant on explicit request: it washes out on projectors), the overlay-animation patterns (one click per piece, one formula built term by term, a diagram on every slide), the render-and-eyeball style critic that catches TikZ label collisions, the words-not-argmax rule for manager audiences, and the no-LaTeX-in-CI Pages deploy of pre-compiled PDFs.
---

# lecture-slides

Conventions for building **animated, minimal-text, diagram-driven Beamer decks** from existing lecture notes, in a light, projection-first Metropolis style with the standard LaTeX fonts, and **publishing** them to GitHub Pages. Audience: the same professionals the notes target. Deliverable: one PDF deck per source lecture note, each a click-to-advance presentation, plus a small Pages site that serves the pre-compiled PDFs (and any interactive page) behind a mobile-first landing index.

These rules were extracted from the session that built the **LATS teaching materials** (`agentic-research/LATS/slides/`): two decks (`mcts-slides.tex`, `lats-slides.tex`) sharing one preamble (`beamer-preamble.tex`), deployed via `.github/workflows/deploy-pages.yml` behind `site/index.html`. When you have access to that folder, those are the canonical examples for STRUCTURE, animation, and voice; do NOT match their dark colors, which predate the projection lesson below (the classic_rl RL deck is the canonical light example). The reusable scaffolding is vendored next to this file in `templates/`.

This skill is the **slide-deck** counterpart to the sibling `course-viz` skill (browser-only interactive viz). A deck and an interactive page often ship together on the same Pages site (the LATS site does). The decks are derived from lecture notes; the viz is built separately. Read whichever matches the deliverable.

**A note on shared rules.** Several rules below are cross-cutting lessons from the build session and apply equally to a sibling notes/viz/notebook build: the dash rule, verify-by-rendering-and-eyeballing, smoke-test-the-linchpin-first, single-source-of-truth-for-numbers, the phased orchestration shape, co-deciding pivotal picks, and commit discipline. If you sharpen one of these here, sharpen it in the sibling skills too.

## When to use this skill

- "Make slides from the lecture notes for <topic>." / "Turn `<note>.tex` into a deck."
- "Build a Beamer deck like the LATS slides." (If the ask names the dark style explicitly, that selects the screen-only dark variant.)
- "Put the slides / notes online." / "Deploy the teaching materials to GitHub Pages."
- Any time the deliverable is a presentation PDF and/or a Pages site that serves it.

If the ask is an interactive browser visualization (not a PDF deck), use `course-viz` instead. If the ask is the lecture notes themselves (the long-form LaTeX document the deck is derived from), that is a separate notes build, not this skill, though rules 3, 4, and 5 below still apply.

## Hard requirements

1. **One deck per source lecture note.** Follow the structure of the note: a Beamer `\section` per note section, in the same order. Don't invent a narrative the note doesn't have; the deck is the note, distilled to clicks and diagrams.

2. **Shared preamble, inherited not copied.** Every deck does `\documentclass[aspectratio=169]{beamer}` then `\input{beamer-preamble}`. The theme, colors, and TikZ styles live in ONE `beamer-preamble.tex` (see `templates/beamer-preamble.tex`); decks never redefine them. Compile each deck FROM the directory holding the preamble so `\input` resolves.

3. **Minimal text.** A few words per slide. No paragraphs. No bullet walls (3 to 4 short items max, each a phrase, not a sentence). If a slide needs prose to make sense, the diagram is doing too little.

4. **A diagram on essentially every content slide.** TikZ, styled via the shared styles. A slide that is only text and a formula is the exception, not the rule.

5. **Every piece appears on its own click.** Reveal incrementally: `[<+->]` on lists, `\pause` between blocks, `\only<n->` / `\onslide<n->` on TikZ elements and on formula terms. A slide that shows everything at once on the first click is a bug (see the animation check in Verification).

6. **At most one big formula per slide, built up term by term.** Use a chain of `\only<n>` that each REPLACES the previous, with `\underbrace{...}_{\text{name}}` naming each term as it lands. Never dump a multi-line derivation onto one slide.

7. **Engine matches the fonts.** The standard light theme compiles with plain `pdflatex`. Only the explicit-request dark Fira variant needs LuaLaTeX (see the engine rule below).

8. **Dash-free RENDERED output.** No prose `---` (em dash) or `--` (en dash) in any `.tex`; the only allowed `--` is a TikZ `(a) -- (b)` line segment. Verify the PDF, not just the source (see the dash rule).

9. **Verify by rendering and eyeballing, then publish.** Compile, dash-check the PDF, run the style critic that renders ALL pages to PNG, then deploy. See Verification.

10. **Words before operator notation for manager audiences.** No `argmax` (and no similar operator shorthand) on a slide for a non-mathematical audience: say "keep the call with the largest value" in words. Symbols the source notes define and gloss (pi-star, Q-star, gamma) are fine.

## Engine: match the fonts

- **Standard light theme (the default): plain `pdflatex`.** It uses `lmodern` / Computer Modern; no fontspec, nothing to go wrong. Compile twice, for the nav bar and section toc:

```bash
cd /abs/path/to/slides
pdflatex <deck>.tex && pdflatex <deck>.tex
```

- **Dark Fira variant (only on explicit request): LuaLaTeX, never pdflatex or xelatex.** `luaotfload` (LuaLaTeX's font loader) finds the TeX-tree-installed Fira fonts reliably; `pdflatex` has no `fontspec` / no Fira (Metropolis falls back or errors) and `xelatex`'s `fontconfig` path may miss the `texmf`-installed Fira. If a Fira build cannot find the font, the fix is the engine, not the preamble.

## The light, projection-first theme

**The load-bearing lesson, learned in front of a real projector: dark themes do not project.** Light-on-dark slides wash out in a lit lecture hall, and the lead also rejected designer fonts. The default is therefore LIGHT Metropolis with the standard LaTeX fonts:

```latex
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usefonttheme[onlymath]{serif}   % math in the classic Computer Modern italic
\usetheme{metropolis}
```

Two fixes are mandatory, both already in `templates/beamer-preamble.tex`:

1. **Frametitle as a pale panel.** Style the title strip as a light gray band with near-black text so the whole deck stays light:
   ```latex
   \setbeamercolor{frametitle}{fg=black!88, bg=panel}   % panel = black!8
   \setbeamercolor{frametitle right}{fg=black!88, bg=panel}
   ```

2. **Keep the muted color dark enough.** On the light canvas, `muted` must survive a projector:
   ```latex
   \colorlet{muted}{black!55}   % the legible floor
   ```
   Lighter grays wash out under projection. Do not raise it above `black!55` toward white.

The accent palette (deep sky blue `accent`, dark amber `accent2`, dark green `good`, dark rose `bad`, plus a `panel` slightly darker than the bg) is the "style". Retune the hues per course if you like, but keep the structure: one primary accent for emphasis (`\alert`, progress bar, separators), a second for secondary highlights, green/rose for success/failure states, box fills as soft tints (`good!14!white` and friends). Style **every** TikZ element through the shared `fg`/`muted` colors and the `edge` / `nodebox` / `treenode` / `good fill` / `bad fill` / `acc fill` styles, never with hardcoded colors in a deck.

**Dark "fancy dimmer" variant: screen-only, explicit request only.** The original dark look (`\metroset{background=dark}` + Fira via LuaLaTeX) is reserved for decks that will only ever be read on a screen, and only when the lead asks for it by name. Its two mandatory fixes: override the default LIGHT frametitle band that Metropolis dark still ships (`fg=white!95!black, bg=panel` with a dark panel), and keep `muted` at `white!66!black` or LIGHTER (`white!48!black` made captions nearly invisible). Never pick dark silently; projection is the default reality of a lecture.

## Animation patterns

These are the five patterns the LATS decks use. `templates/deck-skeleton.tex` is a compilable skeleton that demonstrates all five with placeholder content; start from it.

**A. Diagram then takeaway.** Draw the diagram; reveal the one-line `\takeaway{...}` on the next click. Hide a connecting edge until its click so the relation assembles piece by piece:
```latex
\only<2->{\draw[edge] (a) -- (b);}
\only<2->{\takeaway{the one idea, a few words}}
```

**B. `[<+->]` bullet reveal with a live diagram.** Each bullet on its own click; a labelled detail in the diagram appears in sync:
```latex
\begin{itemize}[<+->]
  \item first point
  \item \textbf{contrast}: second point
\end{itemize}
% in the tikzpicture:
\only<2->{\node[text=muted] at (1,-0.05) {detail};}
```

**C. One formula, built term by term.** A chain of `\only<n>` that each replaces the previous. The trailing `%` after each `\only` suppresses a stray space so the formula does not jump horizontally between clicks:
```latex
\only<1>{\Large $\mathrm{SCORE}(x) = \bar V(x)$}%
\only<2>{\Large $\mathrm{SCORE}(x) = \underbrace{\bar V(x)}_{\text{exploit}}$}%
\only<3->{\Large $\mathrm{SCORE}(x) = \underbrace{\bar V(x)}_{\text{exploit}}
    + \underbrace{w\sqrt{\dfrac{\ln N}{n(x)}}}_{\text{explore}}$}
```

**D. A multi-step diagram (phases).** ONE fixed diagram; layer each phase with `\only<n>` on TikZ, synchronized to a `\begin{description}` whose items use `\item<n->`. Build each item to match its `\only`:
```latex
\only<1>{\draw[edge, accent, line width=1.4pt] (r) -- (m);}   % step 1 highlight
\only<2->{\node[treenode, good fill, below=9mm of m] (leaf) {};}  % step 2 adds a node
...
\item<1->[\alert{1 step}] a few words
\item<2->[\alert{2 step}] a few words
```

**E. A worked example with REAL numbers, two columns.** `\begin{columns}` with the figure on one side, `[<+->]` facts on the other; build the figure click by click with `\only`. Every number must match the source spec exactly (see the single-source-of-truth rule).

Reach for the helper `\newcommand{\takeaway}[1]{...}` (in the preamble) for the one big centered line that closes many slides.

## TikZ label collisions (the recurring bug)

This is the bug that bit the LATS build most often, and the one the style critic exists to catch. It is background-independent: it bit again, three times, when the RL deck switched fonts (changed text metrics shift every label).

**Captions placed `below=Nmm of <node>` land on top of other labels, or run through other nodes.** On a dense diagram, a label you positioned relative to one node frequently overlaps a sibling node or another caption. It compiles clean and looks fine in the source. It is only visible when you render the page to PNG and look.

Defensive habits:
- Prefer placing a caption where there is clearly empty canvas, not mechanically `below` of its node.
- For per-click captions on the same node, use `\only<n>{...}` so only one shows at a time (two captions stacked under one node is a classic collision).
- For an action arrow with a label (a rollout, a transition), aim the arrow at empty space and label the arrow tip, e.g. `... -- ++(0.9,-1.1) node[right]{...}`.
- When two bars/labels must coexist, draw both in ONE `tikzpicture` with explicit coordinates so a label can never collide with the frame edge or the other bar (the LATS "punchline" slide does this).
- Style every element through the shared styles; a node whose colors blend into the background is an invisibility bug.
- A label can be wider than the slot you imagined: a header wider than its column collides with its neighbour. Rotate it over its own column or widen the slot; never assume text fits.
- Align grouped objects on ONE shared axis; do not top-pin. Matrices of different row counts pinned at the same TOP coordinate stagger, and the operators between them float a row too high. Center every member of the group, and the operators, on a single axis.
- Never draw an arrow between two anchors that can coincide: `\draw (a.east) -- (b.west)` where `b` is `right=0pt of a` is ZERO-LENGTH and renders a stray arrowhead on the shared border. Use spanning anchors (`a.north east -- b.north east`) or give the arrow real length.
- Check the TERMINAL overlay page of each frame (every piece revealed): a piece shown by one `\only<n>` often lands on a piece from another overlay, a collision that exists on no single earlier click.

You will not catch these by reading the source. The render-all-pages style critic catches them, but ONLY if it renders high enough: a 16:9 slide at 130 DPI is ~820 px wide and a label kissing a node is sub-visible. Render the collision-prone (terminal-overlay) pages at 250 to 300 DPI and read them one at a time (Verification 4b; `templates/slide-figure-audit.workflow.py`). Budget for one audit pass to surface a handful, then fix and re-render.

## The dash rule (verify the RENDERED output)

This repo has a PreToolUse write hook that REJECTS Unicode em/en dashes (U+2014 / U+2013) in files you write. **Passing the hook is necessary but NOT sufficient**: the real goal is dash-free RENDERED output.

- In **LaTeX**, `---` renders an em dash and a prose `--` renders an en dash, even though both are plain ASCII and sail past the byte hook. NEVER use them in prose. Use a comma, colon, parentheses, or the word "to". The ONLY allowed `--` is a TikZ line segment `\draw (a) -- (b)`.
- In **HTML**, never use the dash entities (m-dash, n-dash) or their numeric forms; use a comma, "to", parentheses, or a middot.
- A subtle hook gotcha: even writing the literal entity strings inside an HTML comment (to say "do not use them") trips the hook, because it scans rendered output. Name them in words instead. The same trap applies in shell: write the grep below with the codepoint (`\x{2014}`), never with a pasted dash, or the hook rejects your own SKILL/script file.

**Always verify the rendered PDF, not the bytes.** Use `grep -P` with the codepoint so the verification command is itself dash-free:
```bash
pdftotext <deck>.pdf - | grep -cP '\x{2014}'   # em dashes in rendered output: must be 0
pdftotext <deck>.pdf - | grep -cP '\x{2013}'   # en dashes: must be 0
grep -nE -- '---|[^-]--[^-]' <deck>.tex         # prose dashes in source (TikZ "--" also matches; eyeball hits)
```
The `grep` over source will also flag legitimate TikZ `(a) -- (b)` segments; eyeball each hit and confirm it is a line segment, not prose.

## The animation check

The overlay-expanded PDF has one page per overlay step, so its page count should be **much larger** than the number of `frame`s. A frame that shows everything at once contributes only one page and is an un-animated bug.

```bash
FRAMES=$(grep -c '\\begin{frame}' <deck>.tex)
PAGES=$(pdfinfo <deck>.pdf | awk '/^Pages:/{print $2}')
echo "frames=$FRAMES  overlay-pages=$PAGES"   # expect PAGES much greater than FRAMES
```

For calibration, the real LATS decks each have **13 frames** that expand to **60** (`mcts`) and **76** (`lats`) PDF pages: roughly 4 to 6 overlay steps per frame. If your ratio is near 1.0, you forgot to animate. Render the suspect frame's pages and confirm each click adds exactly one piece.

## Parallel-agent fan-out

The build follows a phased shape: **OWN-THE-LINCHPIN, then PARALLEL BUILD, then VERIFY-WITH-CRITIQUE.** Scout and spec inline yourself; delegate gathering and per-deck building to parallel agents; keep the canonical example, the theme/preamble, the voice, and the verification single-threaded.

**Phase 0 (sequential, you): smoke-test the linchpin.** Author `beamer-preamble.tex`. Compile a tiny 2-slide test deck against it with the deck engine (plain `pdflatex` for the standard light theme), render both pages to PNG, and EYEBALL them before fanning out. A broken preamble fanned out in parallel wastes all the parallel work. (In the LATS session the slide theme WAS smoke-tested and it paid off; the notes preamble was NOT pre-tested and shipped a broken indicator glyph a human caught later. Smoke-test the linchpin.)

```bash
cd /abs/path/to/slides
cat > _smoketest.tex <<'EOF'
\documentclass[aspectratio=169]{beamer}
\input{beamer-preamble}
\begin{document}
\begin{frame}{Theme smoke test}
  \centering
  \begin{tikzpicture}[node distance=10mm and 18mm]
    \node[acc fill, nodebox] (a) {accent};
    \node[good fill, nodebox, right=of a] (b) {good};
    \node[bad fill, nodebox, right=of b] (c) {bad};
    \draw[edge] (a) -- (b); \draw[dimedge] (b) -- (c);
  \end{tikzpicture}
  \only<2->{\takeaway{muted text must stay legible: black!55}}
\end{frame}
\begin{frame}{One formula, one term at a time}
  \centering
  \only<1>{\Large $f = a$}%
  \only<2->{\Large $f = \underbrace{a}_{\text{base}} + \underbrace{b}_{\text{bonus}}$}
\end{frame}
\end{document}
EOF
pdflatex -interaction=nonstopmode _smoketest.tex >/dev/null && \
  pdftoppm -png -r 130 _smoketest.pdf /tmp/smoke && echo "rendered /tmp/smoke-*.png"
```
Then `Read` `/tmp/smoke-*.png`. Check: pale panel frametitle, legible muted text, tinted nodes with dark borders, the formula building in two steps. `_smoketest.*` is gitignored.

**Phase 1 (deck agents, parallel after Phase 0):** one agent per source lecture note, each building one deck that inherits the shared preamble. Bundle by source note, not by slide; a deck is a coherent voice and should not be split across agents.

**Phase 2 (verify-with-critique, you):** compile all decks, run the dash check and the animation check, then dispatch ONE style-critic agent that renders ALL pages of ALL decks to PNG and reads them for collisions / invisible glyphs / off-slide clipping. Fix centrally. For a deck with dense diagrams, add the per-diagram high-DPI audit (`templates/slide-figure-audit.workflow.py`): 130 DPI is too coarse, so render the collision-prone terminal-overlay pages at 250 to 300 DPI and read each alone (see Verification 4b). Then publish.

### Deck-agent prompt template

Copy and fill the bracketed fields:

> Build the slide deck `[DECK-FILE].tex` from the lecture note `[NOTE-PATH]`, in the light, projection-first Metropolis style with the standard LaTeX fonts. Write it to `[SLIDES-DIR]/[DECK-FILE].tex`.
>
> **Inherit the shared theme.** First line after `\documentclass[aspectratio=169]{beamer}` is `\input{beamer-preamble}`. Do NOT redefine colors, TikZ styles, or the theme; they live in `beamer-preamble.tex` in the same directory. Available styles: `edge`, `dimedge`, `nodebox`, `accentbox`, `treenode`, `gridcell`, `good fill`, `bad fill`, `acc fill`; colors `accent`, `accent2`, `good`, `bad`, `panel`, `fg`, `muted`; helper `\takeaway{...}`.
>
> **Engine.** Plain `pdflatex`, twice, from `[SLIDES-DIR]` so `\input` resolves. (Only the explicit-request dark Fira variant uses LuaLaTeX.)
>
> **Structure.** One `\section` per section of `[NOTE-PATH]`, in the same order. Mirror the note; do not invent a narrative.
>
> **Deck principles (hard rules).**
> - Minimal text: a few words per slide, no paragraphs, at most 3 to 4 short bullet phrases.
> - A TikZ diagram on essentially every content slide, styled with the shared styles.
> - Every piece on its own click: `[<+->]` on lists, `\only<n->`/`\onslide<n->` on TikZ and formula terms.
> - At most ONE big formula per slide, built term by term with a chain of `\only<n>` and `\underbrace{...}_{\text{name}}`.
> - Place TikZ labels where there is empty canvas; never stack two captions under one node; aim labelled arrows at empty space. (Label collisions are the recurring bug.)
> - NO prose `---` or `--`; the only allowed `--` is a TikZ `(a) -- (b)` segment.
> - Words before operator notation: no argmax on any slide; selections are said in words ("keep the call with the largest value").
>
> **Numbers.** Every value, every worked-example state, must come verbatim from `[SPEC-PATH]` (the source-of-truth spec the notes also cite). Do not invent or round numbers.
>
> **Verify before reporting done.** Compile clean; run the animation check (overlay pages must be much greater than frame count); `pdftotext ... | grep -cP '\x{2014}'` and `'\x{2013}'` the Unicode dashes (must be 0); render 2 to 3 representative pages to PNG with `pdftoppm` and READ them to confirm the pale panel frametitle, legible muted text, and no label collisions.
>
> **Output:** the single `[DECK-FILE].tex` plus its compiled `[DECK-FILE].pdf`.

## Single source of truth for numbers

Every number on a slide must trace to the same source the lecture notes use. In the LATS build a small RUNNABLE reference implementation (`reference_mcts.py`) pinned the canonical worked example, a spec file (`lecture-notes/example-spec.md`) quoted its REAL printed output, and every artifact (notes, slides, notebook, site) cited the SAME numbers. Bake in-file assertions in the reference so drift fails loudly (the LATS reference asserts the grid is reachable, so a sealed/dead example can never ship).

For a deck: read the numbers from the spec, not from memory; if the deck states a value the notes do not, it is either wrong or the spec is incomplete. Do not "improve" a number to make a slide cleaner.

## Co-decide pivotal picks with the human

When a phase produces a fork the downstream artifacts build on, present the curated options plus a recommendation and PAUSE for the lead. The LATS worked example (the 4x2 grid treasure-hunt) was chosen this way: a brainstorm of candidates, then the lead picked, then every artifact anchored on the choice. For slides specifically, the pivotal picks are: which worked example anchors the deck, and the accent palette if it departs from the default. Don't pick silently.

## Publishing to GitHub Pages

The Pages setup here is **build_type=workflow with NO pre-existing workflow**, so you ADD a deploy workflow. **No LaTeX runs in CI:** the PDFs are compiled locally and committed (they are the readable deliverable), and the workflow only gathers files into `_site` and deploys.

Use `templates/deploy-pages.yml` and `templates/landing-index.html`:

1. **Commit the pre-compiled PDFs** (decks and notes). Gitignore the LaTeX aux files (see the gitignore line in Things to never do).
2. **Write `site/index.html`** from `templates/landing-index.html`: a mobile-first dark landing page whose cards link to each PDF and to any interactive page. Fill the placeholders; keep it dash-free (HTML entities included).
3. **Add `.github/workflows/deploy-pages.yml`** from the template. PATH-FILTER the `on.push.paths` trigger to the deliverables (the slide PDFs, the notes PDFs, the interactive `index.html`, `site/**`, and the workflow file itself) so unrelated commits do not redeploy. The job copies those into `_site`, runs `touch _site/.nojekyll`, then `configure-pages` / `upload-pages-artifact` / `deploy-pages`.
4. **Commit and push.** Pushing to `main` on a matching path triggers the deploy.

### Watching the deploy and verifying it live

```bash
# A NEWLY-ADDED workflow can 404 on a name-filtered query for a few seconds
# (registration lag). Query ALL runs, not --workflow=<file>:
gh run list --limit 5

# Then block on the run until it finishes (grab the id from the list):
gh run watch <run-id> --exit-status

# VERIFY LIVE: expect HTTP 200 and content-type application/pdf.
SITE="https://<org>.github.io/<repo>"
curl -o /dev/null -s -w '%{http_code}\n'                 "$SITE/"
curl -o /dev/null -s -w '%{http_code} %{content_type}\n' "$SITE/<deck>.pdf"
```
A `200` plus `application/pdf` on a deck URL is the proof the deploy worked. A `200` on `/` with the landing page is the proof the site is up. Don't report "published" off the workflow's green check alone; curl the live URLs.

## Reference implementations

The patterns above were extracted from the LATS slides build. When you have access to that folder these are the canonical examples; match their TikZ shapes, theme, and voice.

| Pattern | Reference path (in `agentic-research/LATS/`) | Template here |
|---|---|---|
| Shared Metropolis preamble (light here; the LATS one is the dark variant) | `slides/beamer-preamble.tex` | `templates/beamer-preamble.tex` |
| Full animated deck (structure + all 5 animation patterns) | `slides/mcts-slides.tex` | `templates/deck-skeleton.tex` |
| Second deck sharing the same preamble | `slides/lats-slides.tex` | (same skeleton) |
| Built-up formula (UCB1 / UCT term by term) | `slides/mcts-slides.tex` (UCB1, UCT frames) | skeleton Pattern C |
| Four-phase layered diagram | `slides/mcts-slides.tex` ("four phases" frame) | skeleton Pattern D |
| Two-bar punchline drawn in one tikzpicture (collision-safe) | `slides/mcts-slides.tex` ("punchline" frame) | (collision rule) |
| No-LaTeX-in-CI Pages deploy | `.github/workflows/deploy-pages.yml` | `templates/deploy-pages.yml` |
| Mobile-first dark landing page | `site/index.html` | `templates/landing-index.html` |
| Per-diagram awkward-graphics audit (render high-DPI, read, fix, verify, loop) | (the collision-bug lesson) | `templates/slide-figure-audit.workflow.py` |
| Build-artifact gitignore (commit the PDFs) | `slides/.gitignore` | (Things to never do) |

## Verification

### 1. Compile clean (the deck engine, twice)
```bash
cd /abs/path/to/slides
pdflatex -interaction=nonstopmode <deck>.tex && pdflatex -interaction=nonstopmode <deck>.tex
```
(Use `lualatex` instead only for the explicit-request dark Fira variant.)
Exit 0 is necessary, not sufficient. It does NOT catch invisible glyphs, label collisions, off-slide clipping, or an un-animated frame.

### 2. Dash check on the RENDERED PDF
```bash
pdftotext <deck>.pdf - | grep -cP '\x{2014}'   # em dashes: must be 0
pdftotext <deck>.pdf - | grep -cP '\x{2013}'   # en dashes: must be 0
```

### 3. Animation check
```bash
FRAMES=$(grep -c '\\begin{frame}' <deck>.tex)
PAGES=$(pdfinfo <deck>.pdf | awk '/^Pages:/{print $2}')
echo "frames=$FRAMES overlay-pages=$PAGES"   # expect PAGES much greater than FRAMES (LATS: 13 to 60 and 76)
```

### 4. Style critic: render ALL pages and READ them
The agent has no eyes; compiling proves nothing about how a slide LOOKS. Render every overlay page and look at them. This is what catches the label collisions, invisible muted text, garbled glyphs, and off-slide clipping. Every real visual bug in the LATS session was caught by rendering, not by compiling.
```bash
pdftoppm -png -r 130 <deck>.pdf /tmp/<deck>_page
# then Read /tmp/<deck>_page-*.png  (open them; a screenshot you do not look at is not verification)
```
For a multi-deck build this is the dedicated style-critic agent's job (Phase 2): render all pages of all decks, read them, return a list of collisions/clipping to fix centrally.

### 4b. Per-diagram high-DPI audit (the collision-prone pages, rendered high)

Step 4 at `-r 130` is too coarse to judge a dense diagram: a 16:9 slide is only ~820 x 461 px at 130 DPI, so a caption grazing a node is sub-visible. Slides are small enough that the FULL slide fits under the Read tool's 2000 px cap even at 300 DPI (a 169 slide is ~1890 x 1063 px at `-r 300`), so render the collision-prone pages HIGH and read them one at a time. The collision-prone page of a frame is its TERMINAL overlay (every piece revealed, the most ink on the canvas).

```bash
# render ONE collision-prone page (the terminal overlay of a frame) at 300 DPI:
pdftoppm -png -singlefile -r 300 -f <PAGE> -l <PAGE> <deck>.pdf /tmp/slideN
# then Read /tmp/slideN.png and judge it against the collision traps.
# only for an unusually dense diagram, crop to it: add  -x <X> -y <Y> -W <W> -H <H>
```

Resolution gotcha: keep BOTH dimensions under 2000 px. A full 169 slide at `-r 300` is ~1890 x 1063 (safe); a 4:3 slide is ~1510 x 1130 (safe); push DPI higher only on a crop. Loop per page: render, read, and if awkward make a POSITIONING-ONLY fix (never a number, label text, or an overlay `<n->` spec), rebuild with the deck engine twice, re-render, re-read, until clean. Shipped as `templates/slide-figure-audit.workflow.py`: diagnose-per-page in parallel, then ONE serial apply+rebuild agent (the deck is edited serially so parallel edits never conflict), then verify-per-page in parallel, looping until clean. Run it whenever a deck has dense diagrams.

### 5. Publish, then verify LIVE
After the deploy workflow runs (watch via `gh run list` then `gh run watch <id> --exit-status`):
```bash
curl -o /dev/null -s -w '%{http_code}\n'                 "$SITE/"
curl -o /dev/null -s -w '%{http_code} %{content_type}\n' "$SITE/<deck>.pdf"   # expect 200 application/pdf
```

## Verification checklist (the order matters)

1. Author `beamer-preamble.tex`; smoke-test it (2-slide deck, render to PNG, READ it).
2. Build each deck (one per note), inheriting the preamble.
3. **Compile** each deck clean with the deck engine, plain `pdflatex` (twice).
4. **Dash-check** each rendered PDF (`pdftotext ... | grep -cP '\x{2014}'` and `'\x{2013}'`, both 0).
5. **Animation-check** each deck (overlay pages much greater than frame count).
6. **Style critic**: render ALL pages of ALL decks to PNG and READ them; fix collisions / invisible text / clipping centrally.
   - **Per-diagram high-DPI audit:** render each collision-prone (terminal-overlay) page at 250 to 300 DPI and READ it alone; 130 DPI is too coarse to see a caption grazing a node. Use `templates/slide-figure-audit.workflow.py` for a deck with dense diagrams.
7. Commit the pre-compiled PDFs; gitignore LaTeX aux files.
8. Write `site/index.html` (dash-free) and add the path-filtered `deploy-pages.yml`.
9. Commit + push; watch the run (`gh run list`, then `gh run watch <id> --exit-status`).
10. **Verify LIVE** with `curl` (200 on `/`; 200 + `application/pdf` on a deck URL).

Step 6, actually looking at the rendered pages, is what makes the rest work. Don't skip it.

## Things to never do

- **Build dark for a lecture.** Dark themes wash out on real projectors; dark is screen-only and explicit-request-only. Default to light.
- **Compile the dark Fira variant with `pdflatex` or `xelatex`.** No Fira / wrong rendering / fontconfig miss; that variant is LuaLaTeX only. (The standard light theme compiles with plain `pdflatex`.)
- **Redefine the theme inside a deck.** Colors and TikZ styles live in `beamer-preamble.tex`; `\input` it, don't fork it.
- **Leave the frametitle unstyled.** Set `\setbeamercolor{frametitle}{fg=black!88, bg=panel}` (and `frametitle right`); on the dark variant, override its default LIGHT bar the same way with a dark panel.
- **Let `muted` drift toward the background.** Light theme: keep it `black!55` or darker (lighter grays wash out under a projector). Dark variant: keep it `white!66!black` or lighter (`white!48!black` made captions nearly invisible).
- **Write a paragraph or a bullet wall on a slide.** A few words; a diagram does the work.
- **Show everything on the first click.** Every piece gets its own overlay (`[<+->]`, `\only<n->`). An overlay-page-count near the frame count is the symptom.
- **Put more than one big formula on a slide, or dump a multi-line derivation.** One formula, built term by term.
- **Place a caption mechanically `below` of its node without checking the render.** It lands on another label or runs through a node. Render and look.
- **Run the style critic at 130 DPI and call it done.** A 16:9 slide at 130 DPI is only ~820 px wide; a caption grazing a node is sub-visible. Render the collision-prone (terminal-overlay) pages at 250 to 300 DPI (a slide stays under the 2000 px Read cap even at 300) and read them one at a time. See Verification 4b; `templates/slide-figure-audit.workflow.py`.
- **Leave the other awkward-graphics traps unchecked** (see TikZ label collisions): a label wider than its slot, a group top-pinned instead of centered on a shared axis, an arrow between coincident `right=0pt` anchors (a stray zero-length arrowhead), or an `\only<n>` piece overlapping a piece from another overlay on the terminal page. Each compiles clean; only rendering the page high catches it.
- **Use hardcoded node colors instead of the shared styles.** Every element goes through `fg`/`muted` and the named styles, whichever theme is active.
- **Use prose `---` or `--` in LaTeX, or dash entities in HTML.** The only allowed `--` is a TikZ `(a) -- (b)` segment. Verify the RENDERED output, not the bytes.
- **Trust the byte hook as proof of a dash-free deck.** `---`/`--` are ASCII and pass the hook but render as dashes. `pdftotext | grep -P` the PDF for the codepoints.
- **Invent or round a number on a slide.** Every value traces to the source spec the notes cite.
- **Put `argmax` (or similar operator notation) on a manager-facing slide.** Selections are said in words: "keep the call with the largest value".
- **Report "compiled" or "published" without rendering / curling.** Exit 0 and a green CI check do not prove the slides look right or the URL serves. Render and read; curl the live URL.
- **Run LaTeX in CI.** PDFs are compiled locally and committed; the workflow only gathers and deploys.
- **Commit LaTeX aux files.** Gitignore `*.aux *.log *.nav *.snm *.toc *.out *.vrb *.synctex.gz *.fls *.fdb_latexmk` and the `_smoketest.*` scratch; DO commit the `.pdf` deliverables.
- **Query a freshly-added workflow with `gh run list --workflow=<file>`.** It can 404 for a few seconds (registration lag). Query `gh run list` (all) instead.
- **Smoke-skip the preamble.** A broken linchpin fanned out in parallel wastes all the parallel decks. Compile + render + eyeball a 2-slide test first.
- **Split one deck across agents.** A deck is one coherent voice; one agent per source note.

## Recipe for a slide build

0. **Read the source lecture notes and the numbers spec.** The deck is the note distilled; the section order and every number come from there. If there is a runnable reference implementation pinning the worked example, read its REAL output, not your memory of it.

1. **Author the shared preamble** from `templates/beamer-preamble.tex` (light, standard fonts). Retune the accent palette per course if desired; keep the two mandatory fixes (pale panel frametitle, `muted` at `black!55` or darker).

2. **Smoke-test the preamble** (Phase 0): compile the 2-slide `_smoketest.tex`, render to PNG, READ it. Fix the theme here, before any deck exists.

3. **Co-decide the pivotal picks** with the lead if there is a fork (which worked example anchors the deck; a non-default palette). Present options + a recommendation; pause.

4. **Build one deck per source note** from `templates/deck-skeleton.tex`. Direct (1 to 2 notes) or fan out (3+ notes) using the deck-agent prompt template. Mirror the note's section order; apply the five animation patterns; pull every number from the spec.

5. **Verify each deck**: compile (the deck engine, twice), dash-check the PDF, animation-check (overlay pages much greater than frames).

6. **Style critic** (Phase 2): render ALL pages of ALL decks to PNG and READ them. Fix label collisions, invisible muted text, clipping, un-animated frames centrally. For dense diagrams, run the per-diagram high-DPI audit (`templates/slide-figure-audit.workflow.py`): render the collision-prone terminal-overlay pages at 250 to 300 DPI and read each alone (full-slide 130 DPI is too coarse).

7. **Commit** the pre-compiled PDFs; gitignore the aux files. Solo on `main`, small logical commits, end each message with the co-author trailer from the repo `CLAUDE.md`.

8. **Publish**: write `site/index.html` (dash-free) from the landing template; add the path-filtered `deploy-pages.yml`; commit + push.

9. **Watch + verify live**: `gh run list` then `gh run watch <id> --exit-status`; then `curl` the live URLs (200 on `/`; 200 + `application/pdf` on a deck).

10. **Iterate on feedback.** Common asks: fix a collision a viewer caught (render that page, reposition the label, re-render), add a slide for a note section that was thin, retune an accent for projector contrast, add a deck for a new note (one agent, inherits the same preamble).

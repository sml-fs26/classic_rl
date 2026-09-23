---
name: lecture-slides
description: Build animated, minimal-text, diagram-driven Beamer slide decks from existing lecture notes in a light, projection-first Metropolis style with the Libertinus serif font, then publish them to GitHub Pages. Use when the user asks for "slides", a "deck", a "Beamer presentation", "lecture slides", or to "turn the notes into slides" and/or to "put the slides online" / "deploy to Pages" for a course topic. Defines the pdflatex light theme (dark is a screen-only variant on explicit request: it washes out on projectors), the two named lecture styles (Modern Editorial, and the Paper and Grid warm-paper theme picked for CAS BMAI HS26), the overlay-animation patterns (one click per piece, one formula built term by term, a diagram on every slide), the render-and-eyeball style critic that catches TikZ label collisions, the words-not-argmax rule for manager audiences, and the no-LaTeX-in-CI Pages deploy of pre-compiled PDFs.
---

# lecture-slides

Conventions for building **animated, minimal-text, diagram-driven Beamer decks** from existing lecture notes, in a light, projection-first Metropolis style with the Libertinus serif font, and **publishing** them to GitHub Pages. Audience: the same professionals the notes target. Deliverable: one PDF deck per source lecture note, each a click-to-advance presentation, plus a small Pages site that serves the pre-compiled PDFs (and any interactive page) behind a mobile-first landing index.

These rules were extracted from the session that built the **LATS teaching materials** (`agentic-research/LATS/slides/`): two decks (`mcts-slides.tex`, `lats-slides.tex`) sharing one preamble (`beamer-preamble.tex`), deployed via `.github/workflows/deploy-pages.yml` behind `site/index.html`. When you have access to that folder, those are the canonical examples for STRUCTURE, animation, and voice; do NOT match their dark colors, which predate the projection lesson below (the classic_rl RL deck is the canonical light example). The reusable scaffolding is vendored next to this file in `templates/`.

This skill is the **slide-deck** counterpart to the sibling `course-viz` skill (browser-only interactive viz). A deck and an interactive page often ship together on the same Pages site (the LATS site does). The decks are derived from lecture notes; the viz is built separately. Read whichever matches the deliverable.

**A note on shared rules.** Several rules below are cross-cutting lessons from the build session and apply equally to a sibling notes/viz/notebook build: the dash rule, verify-by-rendering-and-eyeballing, smoke-test-the-linchpin-first, single-source-of-truth-for-numbers, the phased orchestration shape, co-deciding pivotal picks, and commit discipline. If you sharpen one of these here, sharpen it in the sibling skills too.

## When to use this skill

- "Make slides from the lecture notes for <topic>." / "Turn `<note>.tex` into a deck."
- "Build a Beamer deck like the LATS slides." (If the ask names the dark style explicitly, that selects the screen-only dark variant.)
- "Put the slides / notes online." / "Deploy the teaching materials to GitHub Pages."
- Any time the deliverable is a presentation PDF and/or a Pages site that serves it.
- "Build a deck for CAS BMAI." That course settled on the Paper and Grid style on 2026-09-01; see "The Paper and Grid style" below, and start from `templates/paper-grid-preamble.tex`.
- "Make INTRO / ADMIN / overview slides", "set the tone / give an overview / excite participants", or "make the deck look designed / corporate / it looks bland". That is the Modern Editorial style, which also dresses up a lecture-content deck (not only intro decks); see "The Modern Editorial style" below.

If the ask is an interactive browser visualization (not a PDF deck), use `course-viz` instead. If the ask is the lecture notes themselves (the long-form LaTeX document the deck is derived from), that is a separate notes build, not this skill, though rules 3, 4, and 5 below still apply.

## Hard requirements

1. **One deck per source lecture note.** Follow the structure of the note: a Beamer `\section` per note section, in the same order. Don't invent a narrative the note doesn't have; the deck is the note, distilled to clicks and diagrams.

2. **Shared preamble, inherited not copied.** Every deck does `\documentclass[aspectratio=169]{beamer}` then `\input{beamer-preamble}`. The theme, colors, and TikZ styles live in ONE `beamer-preamble.tex` (see `templates/beamer-preamble.tex`); decks never redefine them. Compile each deck FROM the directory holding the preamble so `\input` resolves.

3. **Minimal text.** A few words per slide. No paragraphs. No bullet walls (3 to 4 short items max, a few words each, never a paragraph). If a slide needs prose to make sense, the diagram is doing too little.

4. **A diagram on essentially every content slide.** TikZ, styled via the shared styles. A slide that is only text and a formula is the exception, not the rule.

5. **Every piece appears on its own click.** Reveal incrementally: `[<+->]` on lists, `\pause` between blocks, `\only<n->` / `\onslide<n->` on TikZ elements and on formula terms. A slide that shows everything at once on the first click is a bug (see the animation check in Verification). **Exception, the brand/intro deck variant:** an intro / admin / overview deck (not derived from a lecture note) may be deliberately STATIC, and the lead may ask for no transitions. The per-click rule is for teaching CONTENT, where progressive reveal aids comprehension; on an overview slide a static layout is not a bug, and an animation-check ratio near 1.0 is EXPECTED there. See "The Modern Editorial style" below.

6. **At most one big formula per slide, built up term by term.** Use a chain of `\only<n>` that each REPLACES the previous, with `\underbrace{...}_{\text{name}}` naming each term as it lands. Never dump a multi-line derivation onto one slide.

7. **Engine matches the fonts.** The standard light theme compiles with plain `pdflatex`. Only the explicit-request dark Fira variant needs LuaLaTeX (see the engine rule below).

8. **Dash-free RENDERED output.** No prose `---` (em dash) or `--` (en dash) in any `.tex`; the only allowed `--` is a TikZ `(a) -- (b)` line segment. Verify the PDF, not just the source (see the dash rule).

9. **Verify by rendering and eyeballing, then publish.** Compile, dash-check the PDF, run the style critic that renders ALL pages to PNG, then deploy. See Verification.

10. **The slide is for the room, never for the build. A slide carries the
    CITATION and never the EDITORIAL APPARATUS.** Nothing addressed to the
    person building the deck may appear on a projection surface. Two families,
    and both are banned: build state (a repository path, `SOURCES.md`,
    "not pinned", "located", "TBD", "placeholder") and editorial apparatus
    ("English original", "the muted line is this deck's own reading",
    "this deck's paraphrase, not a translation", "English gloss: this deck's
    own", "modernised spelling"). See the section below; it is checked
    mechanically, like the dash rule.

11. **Words before operator notation for manager audiences.** No `argmax` (and no similar operator shorthand) on a slide for a non-mathematical audience: say "keep the call with the largest value" in words. Symbols the source notes define and gloss (pi-star, Q-star, gamma) are fine.

## Engine: match the fonts

- **Light theme (the default): plain `pdflatex`.** It uses Libertinus (or `lmodern` if a course wants sans); no fontspec, nothing to go wrong. Compile twice, for the nav bar and section toc:

```bash
cd /abs/path/to/slides
pdflatex <deck>.tex && pdflatex <deck>.tex
```

- **Dark Fira variant (only on explicit request): LuaLaTeX, never pdflatex or xelatex.** `luaotfload` (LuaLaTeX's font loader) finds the TeX-tree-installed Fira fonts reliably; `pdflatex` has no `fontspec` / no Fira (Metropolis falls back or errors) and `xelatex`'s `fontconfig` path may miss the `texmf`-installed Fira. If a Fira build cannot find the font, the fix is the engine, not the preamble.

## The light, projection-first theme

**The load-bearing lesson, learned in front of a real projector: dark themes do not project.** Light-on-dark slides wash out in a lit lecture hall, so the default is LIGHT Metropolis: a white background with near-black text. The default font is **Libertinus**, an elegant old-style book serif whose matching Libertinus Math puts text and formulas in one voice (chosen by the lead over Fira, CM Bright, and a field of sans alternatives):

```latex
\usepackage[T1]{fontenc}
\usepackage{libertinus}   % Libertinus Serif + Biolinum + matching Libertinus Math
\usefonttheme{serif}      % body, headings, and math all in the serif
\usetheme{metropolis}
```

A sans course can instead use `\usepackage{lmodern}` with `\usefonttheme[onlymath]{serif}` (Computer Modern math), but Libertinus is the default; do not pick a designer webfont (Fira and the like were rejected). Three fixes are mandatory, all already in `templates/beamer-preamble.tex`:

0. **White background, dark text.** `\setbeamercolor{normal text}{fg=black!87, bg=white}` (dark-on-light is what survives a projector).

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

## The Modern Editorial style (applies to ANY deck, lectures included)

The Modern Editorial design system is a STYLE, not a deck type: it can dress up any deck, a lecture distilled from notes just as much as a participant-facing intro. The clean light Metropolis above is the lighter-weight default, and Paper and Grid below is the third named option; reach for editorial whenever the lead wants a deck to look DESIGNED (a brand color, a display font, big-number section dividers, a unified diagram kit), or asks to "give it more style / make it look less bland". It runs in TWO modes:

- **Lecture mode** (a deck distilled from a lecture note, e.g. a NumPy or sklearn deck): KEEP everything that makes a teaching deck work, the projection-first LIGHT theme and the per-click teaching animations (hard rule 5 still holds, an editorial lecture deck is NOT static), and ADD the editorial polish on top: the Biolinum display font, one brand color, the eyebrow+rule frametitle, the brand stripe and footer, big-number section pages, and the unified flow kit. Use a CLEAN editorial title page (wordmark + big title + a brand rule + a small square motif), NOT the photo hero. Each section still opens with its motivating story (see "Lecture decks: open each section with a story" below).
- **Brand / intro mode** (a participant-facing INTRO / ADMIN / OVERVIEW deck, not from one note): may additionally be STATIC, use the photo hero, and be synthesized from prior intro decks plus the course's authoritative facts.

Reach for editorial when the ask is "intro slides", "admin slides", "set the tone / give an overview", "make it look designed / corporate / it is bland", or "give this lecture deck more style". Extracted from the "From Data to Solutions" intro deck (`admin/intro-deck/`); the reusable preamble is `templates/editorial-preamble.tex` (a CUSTOM theme kept in the deck's own dir). For a lecture deck, copy it next to the deck, set the brand / wordmark / icons, drop the photo title page, and ADD the deck's content styles (e.g. the matrix grid cells) just as you would extend the Metropolis preamble.

### Brand / intro mode specifics (intro / admin / overview decks only)
- **Source.** Synthesize the prior intro decks plus the course facts, not one lecture note. EXTRACT and reuse the real images out of the old decks (`pdfimages`, below) instead of leaving photo placeholders.
- **Facts are anchored, like numbers are.** Anchor every date, deadline, and structural fact on the AUTHORITATIVE source (the participant-facing structure doc, the planning spreadsheet), NOT a stale repo README or docx. This is the single-source-of-truth rule applied to admin facts. (In the FDS build the repo README's weekend order was stale; the spreadsheet-derived doc was right.)
- **Static is fine.** An overview deck does not need within-slide reveals, and the lead may explicitly want none. Hard-rule 5 is a teaching-CONTENT rule; on an overview slide a static layout is not a bug, and an animation-check ratio near 1.0 is EXPECTED. Do not fight a "fewer transitions" request.
- **Structure.** A typical arc is: About us, then the big picture / what is X, then the journey / overview, then what you build, then administration, then questions. Mirror the prior intro deck, not a note's sections.

### The Modern Editorial design system
The levers that buy "designed / corporate" personality, all pdflatex-safe (in `templates/editorial-preamble.tex`):
- **Display vs body font contrast.** Libertinus serif body + **Biolinum sans** (`\sffamily` with the `libertinus` package, free, no fontspec) for titles and structure. This ONE change does the most for "designed".
- **One brand color + one accent**, used everywhere (FDS used ETH blue `#215CAF` + dark amber). Unify the DIAGRAM fills to the brand so nothing looks ad hoc.
- **Frametitle = an uppercase section EYEBROW + the title + a short accent RULE**, a thin brand LEFT STRIPE on every slide (`\setbeamertemplate{background}`), and a branded FOOTER (wordmark left, page right).
- **Big-number SECTION PAGES**: `\AtBeginSection[]{\begin{frame}[plain]\usebeamertemplate{section page}\end{frame}}` with a giant ghosted `\insertsectionnumber` and a per-section ICON.
- **Section ICONS** from `fontawesome5` (pdflatex-native), keyed by number: `\newcommand{\sectionicon}{\ifcase\insertsectionnumber\or\faUsers\or\faBrain\or\faRoute\or\faClipboardCheck\fi}`; show it big on the divider and small in the eyebrow.
- **A HERO title page**: the institutional photo full-bleed under a left-to-right brand SCRIM, keeping the wordmark; or, with no photo, a wordmark + a small square motif.
- **A UNIFIED diagram kit**: one tonal flow language, `flowdim` (neutral) to `flowbox` (light) to `flowstrong` (solid) plus `flowarrow`, on EVERY box-and-arrow slide, and concentric tonal boxes for a nesting figure. Pick ONE node-style set and use it everywhere so diagrams cohere.
- **Image treatment**: hairline-FRAME every photo (`\framedimg`); DUOTONE a set of mismatched photos to the brand color so they read as one set (recipe below). A schedule reads better as a horizontal TIMELINE RIBBON (colored blocks + group brackets) than as a date list.

This is a CUSTOM theme (no metropolis), kept in the deck's OWN dir; it is not the shared lecture preamble.

### Lecture decks: motivate with a concrete EXAMPLE, but title FACTUALLY

A lecture deck should TEACH through a concrete worked EXAMPLE (real numbers from the spec): the recipe / coffee / coins running objects, "you mixed three scoops of oats ...; how many calories?" Reuse those objects so the deck coheres, and present each operation on real numbers before generalizing.

**BUT titles and prose must be DRY, FACTUAL, ACADEMIC, never poetic** (Carlos, hard rule, 2026-06-25). "This is a lecture." Section and slide titles name the thing: "The matrix-vector product", "Building arrays", "Matrices as transformations", NOT "The one picture: a machine that turns amounts into totals" or "The spine: amounts in, a table of rates, totals out". DROP purple-prose taglines and closing question lines (he deleted "almost every array bug is a shape mismatch in disguise"). Keep the worked example; cut the poetry. The earlier "open every section with a vivid STORY plus a question" guidance is RETIRED in favour of this: concrete example yes, romantic framing/titles no.

### No closing punchline, and NO LINE UNDER THE DIAGRAM AT ALL

A frame ends on its final reveal. Nothing goes underneath the figure.

**Carlos, 2026-09-01, deleting one from every frame of a deck: "remove this
behaviour that is causing this from the skill, that there is some weird
punchline at the bottom. I don't like them."** The earlier wording here allowed
"a closing thought that is real content, as the last ordinary line in body
text", and that escape hatch is what produced them. It is RETIRED. There is no
version of a trailing line that is acceptable: no brand-coloured punchline, no
plain body sentence, no "and this is why it matters".

The rule bites twice, and the second bite is the one people miss:

1. It is a TASTE rule. He does not want the lecturer's summary printed under
   the picture; he says it out loud.
2. It is a LAYOUT rule. A two-line trailing sentence is about 0.9 cm of a 6.3 cm
   body, so it is the difference between a diagram that breathes and one that
   looks crammed. Every time he asked for a bottom line to go, the next sentence
   was "it is eating too much space and that is why the diagram looks very
   crowded". When you delete one, GIVE THE SPACE TO THE FIGURE and redraw it
   bigger, rather than leaving a gap.

Where the content actually belongs, in order of preference:
- **Nowhere.** Most of these sentences are the lecturer's script, not the slide.
- **A short annotation inside the figure**, on a leader line pointing at the
  thing it is about.
- **A muted note in the empty margin beside the figure**, if the figure does not
  use the full width.

And when you remove one, renumber the overlays: it usually consumed the frame's
last click.

### The slide is for the room, never for the build

**Carlos, 2026-09-02, on a deck that had been live on the course site: "May I
ask why you think it is appropriate to put remarks like this in slides for a
lecture?"** The Friday 08:00 cold open projected this under a Popper quotation,
in muted type, on four consecutive pages, to a room of managers:

```text
Located, not pinned: two punctuation variants circulate. See SOURCES.md.
```

That is the deck talking to its own builder. Delete it, and never write another.

**It happened twice in one session, and the second time is the more instructive
one.** After the first was fixed, the same deck was still printing this under
the Turing and Whewell quotations, on eight more pages:

```text
English original; the muted line is this deck's own reading.
```

Carlos: "Again, this type of clarifications are not needed." Same class, and the
first fix had missed it because the grep looked for repository paths and not for
editorial apparatus. **A slide carries the citation and never the editorial
apparatus.** The room does not need to be told which line is a quotation and
which is the lecturer's summary: muted type under a quotation already reads as
the lecturer, and if it does not, the fix is the typography, not a footnote
explaining it.

The forms this takes, all of them seen in one course line:

```text
English original.
English original; the muted line is this deck's own reading.
English original. The muted line is this deck's paraphrase, not a translation.
English gloss: this deck's own.
..., modernised spelling.
```

**The distinction that matters, because one of these is right and the other is
the bug.**

| On a slide | Verdict |
|---|---|
| A dashed box standing in for a MISSING image or an unpinned quotation, naming the file or the locus (`\plateh`, `\quoteslot`, `\origslot`) | **Correct.** It stands in for something ABSENT. It is loud and ugly on purpose, nobody would project it, and it forces the gap closed before the lecture |
| A note about something that IS on the slide: how confident the build is in it, where its provenance table lives, what still has to be checked, which line is the deck's own words, whether the gloss is a translation or a paraphrase, whether the spelling was modernised | **Banned.** The room needs the citation. It does not need this deck's opinion of its own footnotes, nor an account of its editorial method |

An ordinary citation is not build metadata. `Karl Popper, The Logic of
Scientific Discovery, chapter 10, section 85 (1959).` is exactly right. The
second sentence about punctuation variants is not.

**Where the caveat goes instead:** the provenance file (`SOURCES.md` or the
README's provenance table), and a `%` comment at the frame. Both are read by
whoever edits the deck, which is the only audience that caveat ever had.

**How this one got onto a live deck, because the failure mode is worth knowing.**
It was hand-written prose, not a macro, so no macro rule prevented it. It came
from reading a house rule, "where a build session cannot reach a source, make
the gap visible", more widely than it was meant: that rule is about something
ABSENT. It then survived a deck merge, and the receiving deck's own CLAUDE.md
recorded it as deliberate, which would have propagated it to every deck copied
from that one. **A slip that gets written down as a convention stops being a
slip.** When you inherit a line you did not write, ask what audience it is for
before you reformat it to fit.

### Checking it

Grep the RENDERED PDF, the same way the dash rule is checked. Source-level greps
miss text that a macro assembles.

```bash
pdftotext deck.pdf - | grep -nEi \
  "SOURCES\.md|README\.md|IMAGE-SOURCES|CLAUDE\.md|not pinned|not yet pinned|Located, not|\bTBD\b|placeholder|to be decided|FIXME|XXX|deck's own|own reading|paraphrase|not a translation|English original|the muted line|modernised spelling|English gloss"
```

Expect zero. Two legitimate exceptions, and they are the only two:

1. A deliberate `\plateh` / `\quoteslot` / `\origslot` box, which prints
   "Plate not present" or "not yet pinned" and is there to be seen and closed.
   If one is still in the deck on the morning of the lecture, that is a
   different bug.
2. A deck whose SUBJECT is those files or those words. The Claude Code lecture
   prints `CLAUDE.md` 37 times in a project-folder listing, and says
   "placeholder text, dead links" in a sentence describing the demo website.
   Both are lecture content. `placeholder` and `CLAUDE.md` are the two terms
   that produce false positives in practice; read the hit, do not just count it.

### Section dividers carry the section name and nothing else (taste rule)

**Carlos, 2026-08-11: "the section slides have subtitles. I want them gone."**

A section page is an icon, "Section N", the section title, and the amber rule. **No subtitle, no
running question, no tagline underneath.** The one-line italic question ("Why can we not just look
at every option?") is the same poetic register as a punchline, one level up.

This one did not come from this skill: it came from **copying an older deck's preamble wholesale**.
`weekend-00-reintroduction/numpy-linalg/slides/beamer-preamble.tex` defines a "running question"
mechanism (`\newcommand{\cursub}{}` / `\newcommand{\sectionsub}[1]{...}` plus a `\cursub` line in the
`section page` template), and every deck told to "copy the preamble from the newest deck" inherits it
silently. `weekend-05-rag-research/carlos-lectures/reranking/slides/beamer-preamble.tex` does NOT
have it, and is the better one to copy.

**When you inherit a preamble, diff its `section page` and `title page` templates against what this
skill prescribes, and strip anything extra before writing a single frame.** The chrome you copy is
chrome you are shipping.

### No red/green. Ever. (accessibility rule, not a taste rule)

**Carlos, 2026-08-11: "red and green balls are a no go."** Roughly 1 in 12 men has some
red/green colour vision deficiency, so in any lecture room somebody cannot read a
red-versus-green contrast. This is not negotiable and does not depend on the deck.

Use the **Okabe-Ito colour-blind-safe pair** for the good/bad axis:

```latex
\definecolor{good}{HTML}{0072B2}   % blue: a win, the option we pick
\definecolor{bad}{HTML}{D55E00}    % vermillion: a loss, a blunder
```

- **Need a third level?** Use plain `ink` for the neutral middle rather than inventing a
  hue. Blue / black / vermillion stays readable for everyone.
- **`good` is now blue, and so is the ETH-blue brand `accent`.** Wherever the two would
  share an overlay they read as one colour, so make the neutral element `ink` or `muted`
  there. Real cases this bit: interval bars drawn in `accent` with the pick in `good`
  (bars became `ink`), and a neutral tinted cell in `accent` next to a winning cell in
  `good` (neutral became grey).
- **The colour pair is the answer. Do NOT also swap the shape.** Carlos, 2026-08-11:
  "I understand we should be colour blind friendly, but not to that extreme. Just use
  balls, don't use different shapes." A redundant shape channel is a real accessibility
  technique, but it must never fight the object being drawn: an urn holds balls, so every
  ball is a circle and only the colour differs. Blue and vermillion are far enough apart
  that the second channel buys nothing here and costs the metaphor. Reach for shape only
  where the marks are already abstract (scatter points, legend keys in a dense chart) and
  the picture does not depend on them all looking alike.
- Amber `accent2` (#B45309) is chrome only (eyebrow, rules). Keep it off the good/bad
  axis or it competes with vermillion.

### Every bullet, caption and box label starts with a CAPITAL letter

Carlos, 2026-08-12: lowercase openings "look unprofessional". No exceptions to judge:
capitalise anything in `\item`, `\convnote`, `\runparams`, `\srcline`, a prose `\onslide`,
and any labelled diagram box. Bare arrow annotations ("one shot", "and again") stay
lowercase, and notation keeps its real case (`$w$`, `c3`, `exf4`); rephrase if a line
would open with one.

### Never write in ALL CAPS (taste rule)

Carlos: "writing everything in capital shows lack of style, lack of taste." In the editorial preamble, the footer wordmark, the frametitle eyebrow (`\insertsection`), the section-page label ("Section N"), the title-page institute, and any column/row headers are **title case**, not uppercase. Remove every `\MakeTextUppercase` and literal-uppercase string. (This retires the old "`\MakeUppercase` trips expl3 on the title page" gotcha: do not uppercase at all.) Sign lecture decks with the lead's name (`\author{Carlos Cotrini}`).

### Matrix products: draw them in FALK'S SCHEME

Whenever you display a matrix-vector OR matrix-matrix product (Carlos's hand drawing, IMG_7372), lay it out so the axes visibly align:
- **A** at the bottom-left.
- the second operand (**x** or **X**) STACKED ABOVE THE RESULT: a column vector above `y`; for a matrix, X sits directly above Y, sharing Y's columns (X's columns are Y's columns).
- the result (**y** or **Y**) to the RIGHT of A, below the operand, sharing A's rows.
- so `Y[i,j]` lands exactly where A's row i (extended right) meets X's column j (extended down). Teach one cell by highlighting A's row i (green `rowfill`) against X's column j (amber `colfill`), giving the result cell (brand `cellfill`).
- LABEL the columns ONCE atop X and the rows ONCE on A's left; do NOT also draw Y's own headers (they collide with X's bottom row). A wide product fits a `\begin{columns}[c]` (diagram left, bullets right) to control height.
- **Never the counterintuitive `X @ A.T`.** Orient the batch as `(features, samples)` so `A @ X` works directly; introduce the transpose (`.T` swaps rows and columns, `(m,n)` to `(n,m)`) on its own short slide. (NB: this makes a linalg lecture's data matrix the TRANSPOSE of the ML convention "one row per example"; a deliberate split.)
- Introduce the concrete matrix **A** with real numbers EARLY, and show the A for each example before its product.
- **DRAW THE SHAPES TO SCALE: one length per dimension, everywhere it appears, on EITHER axis.** In a schematic where blocks stand for matrices, a dimension is a length, and the same dimension must be the same length every time it is drawn, including when it changes axis. The trap is a transposed block: if `W` is `d` by `p` and is drawn on its side, its WIDTH is `d` and its HEIGHT is `p`, so its height has to equal the WIDTH of the block it produces. Get that wrong and the picture asserts something false while looking fine. Carlos, 2026-09-01, on a deck where `W` was 0.95 cm tall against an `X'` that was 1.80 cm wide: "the width of the W matrices does not match the width of the output X' matrices. Make sure the measurements of each matrix are correct. I want this slide geometrically accurate."
  - Write the length table as a comment at the head of the frame (`U1`, `Ld`, `Lp`, `Lq`, `Ln`), list every block with the two lengths its sides must take, and note that changing one length moves everything.
  - **Then CHECK it with a script, not by eye.** Parse the `rectangle` coordinates back out of the source and assert each block's width and height against the table and each chain of equal lengths against itself. This is one of the few slide defects a machine can catch outright, and eyes miss it: it survived a full 300 DPI style-critic pass.
  - Row and column counts inside a block get one shared pitch too, so "one row of `W` makes one column of `X'`" can be counted off the drawing.
  - Budget the frame from the LARGEST dimension: it appears once as a height, and that height plus the row height plus about 2.7 cm of chrome has to fit a 5.7 cm body. That cap, not taste, is what sets how large the blocks can be.

- These are the lecture default (editorial or Metropolis); apply whenever building or restyling a lecture deck, not only when asked.

### Dimension braces point the WRONG WAY unless you order the path

**This is the single most repeated visual defect in this course line.** Carlos
has caught it on four separate decks. The third time he asked for it to be
written down here ("the braces appear inverted, I have seen this happening very
often"); the fourth time, on the AML kernel deck on 2026-09-23, he asked for the
skill itself to be fixed so it stops recurring, and for the fix to be propagated
to every copy of this skill.

**Writing the rule down was not enough, because the rule is checked by eye and a
brace is about 40 px on a slide.** So it is now MECHANICAL: run
`templates/brace-check.py` on every deck you touch, before you commit. It pairs
each `dimbrace` path with the label node that follows it, and reports any brace
whose tip points away from its own label.

```bash
python3 <skill>/templates/brace-check.py <deck>.tex   # must print "0 brace(s) to fix"
```

It reads literal coordinates only, so a brace drawn between named anchors is
reported as not checkable and still has to be looked at on a rendered page.

`decoration={brace}` puts the brace's central tip on the **left-hand side of the
direction of travel**. So the SAME two coordinates give opposite braces
depending only on which one you write first, both compile clean, and the source
looks right either way. A brace whose tip points INTO the object it measures,
away from its own label, is the bug.

Order the path so that "left of travel" is the side the label is on:

| The label sits | Draw the path | Because walking that way puts your left hand |
|---|---|---|
| BELOW a horizontal brace | right to left | downward |
| ABOVE a horizontal brace | left to right | upward |
| LEFT of a vertical brace | bottom to top | to the left |
| RIGHT of a vertical brace | top to bottom | to the right |

```latex
% label below: RIGHT to LEFT
\draw[dimbrace] (4.45,1.96) to (1.55,1.96);   \node[dimlab] at (3.00,1.62) {$d$};
% label left: BOTTOM to TOP
\draw[dimbrace] (0.81,1.60) to (0.81,2.55);   \node[dimlab, left] at (0.63,2.08) {$p$};
```

Two follow-on traps:

- **Flipping a brace moves its tip toward its label**, so the label needs MORE
  clearance than it did when the brace was wrong. The tip reaches
  `amplitude + raise` past the path (about 0.15 cm at the default 3.2pt and
  1pt), so put the label at least 0.18 cm beyond the path, not 0.08 cm.
- **The script is the first line of defence, your eyes are the second.** After
  it passes, still render the page and look: the two ARMS must curl toward the
  thing being measured and the middle TIP must point at the label. Put it on the
  per-diagram high-DPI audit list (Verification 4b) for every frame that carries
  a brace.

### A frame body that OPENS with a brace group loses that group, SILENTLY

**Carlos, 2026-09-02, asking for this to be written down: "This is happening
often."** It is the worst of the invisible traps in this file, because the other
ones make a page look wrong and this one DELETES CONTENT. No error, no warning,
no change in the page count, and a sentence you wrote is simply absent from the
PDF.

Beamer's frame signature carries **two** optional braced arguments:

```latex
\begin{frame}<overlays>[options]{title}{subtitle}
```

So a frame whose body begins with a group hands that group to beamer as the
SUBTITLE. Almost every custom template in this course line prints no subtitle,
so the group is read, accepted and thrown away:

```latex
% BROKEN. The caption never reaches the PDF.
\begin{frame}[fragile]{The network, as blocks}
  {\footnotesize The same picture as yesterday, with the notebook's own widths.}
  \begin{columns}[T,onlytextwidth]
  ...
```

With no braced title at all it is worse: the leading group becomes the frame
TITLE, so a caption silently promotes itself into the title bar.

**What shields it, measured on the Paper and Grid template, 2026-09-02.** The
argument scan skips spaces and comments, so only a real token stops it:

| In front of the group | Result |
|---|---|
| nothing | **swallowed** |
| a comment line, with no blank line after it | **swallowed** |
| a blank line (it makes a `\par`) | survives |
| `\centering` | survives |
| `\vspace{0mm}` | survives |

That table is why the bug hides for months and then appears out of nowhere. A
frame that opens `\vspace{-2mm}` then `{\footnotesize ...}` is correct only by
accident, and the caption vanishes the day someone retunes that `\vspace` away
for an unrelated reason. That is exactly how it was found: removing a `-2mm`
pull to win top clearance deleted a caption from five overlay pages of a built,
reviewed deck.

**It is already in the wild.** Running the scanner below across both course
repositories on 2026-09-02 found one live instance outside the deck that
prompted this: `weekend-01-info-theory/carlos-lectures/active-learning/slides/`
opens a frame with `{\footnotesize\textcolor{muted}{H\"ubotter et al., 2024}}`,
and that credit appears nowhere in the shipped `slides.pdf`. It is the only
citation on that deck, so the paper it rests on currently goes uncredited.

**The style critic will not catch this.** A frame missing its caption looks like
a frame that never had one. Scan the SOURCE instead, once per deck, right after
it compiles:

```bash
python3 - <<'EOF'
import glob, io, re
pat = re.compile(r'\\begin\{frame\}(<[^>]*>)?(\[[^\]]*\])?(<[^>]*>)?')
# Strip each line's comment tail, but keep the RAW line too. The distinction is
# the whole point: a COMMENT is transparent to the argument scan (so the group
# after it is still swallowed), while a genuine BLANK LINE makes a \par, which
# is a real token and shields the group. Collapsing the two hides half the bug.
uncomment = lambda l: re.split(r'(?<!\\)%', l, 1)[0]
def past_group(r):                      # step over one balanced {...}
    d = 0
    for k, ch in enumerate(r):
        d += (ch == '{') - (ch == '}')
        if d == 0: return r[k+1:].lstrip()
    return ''
hits = 0
for f in sorted(glob.glob('**/*.tex', recursive=True)):
    if 'preamble' in f: continue
    raw  = io.open(f, encoding='utf-8', errors='replace').read().split('\n')
    code = [uncomment(l) for l in raw]
    for i, l in enumerate(code):
        m = pat.search(l)
        if not m: continue
        rest = l[m.end():].lstrip()
        if rest.startswith('{'): rest = past_group(rest)      # the braced title
        if rest.startswith('{'):
            print('RISK', f, i + 1, rest[:60]); hits += 1; continue
        if rest: continue                    # a real token follows: shielded
        for j in range(i + 1, min(i + 40, len(raw))):
            if not raw[j].strip(): break     # genuine blank line: \par, shielded
            t = code[j].strip()
            if not t: continue               # comment only: transparent, keep going
            if t.startswith('{'): print('RISK', f, j + 1, t[:60]); hits += 1
            break
print(f'{hits} at-risk frame(s)')
EOF
```

It must print nothing. When a frame body genuinely has to open with a group, put
`\vspace{0mm}` in front of it and a comment saying the `\vspace` is load bearing,
because the next person to tidy it away will delete a sentence.

### Co-decide the design DIRECTION with rendered mockups
When the ask is "make it look better / corporate / it is bland", do NOT silently restyle. Build 2 to 3 distinct design SYSTEMS as REAL rendered title-and-content slides (not ASCII mockups), send them, let the lead pick, then roll the winner out across all slides and iterate in render-verified waves. (FDS offered A ETH-official photo-hero, B modern-editorial, C bold-keynote; the lead picked B.) This is the design analog of "co-decide pivotal picks".

### Design and theme gotchas (custom-template decks)
- **Metropolis `[standout]` ignores `\setbeamercolor{standout}{bg=...}`** and renders DARK. For a colored full-bleed statement slide, wrap a `[plain]` frame: `{\setbeamercolor{background canvas}{bg=BRAND}\begin{frame}[plain]\centering\color{white}\vfill ... \vfill\end{frame}}`. And `\setbeamercolor{normal text}{fg=white}` inside that group does NOT recolor the body; use explicit `\color{white}`. (Shipped as `\statementframe` in the template.)
- **NEVER name a colour `fg` or `bg`.** Both are RESERVED Beamer colour names, rebound to whatever beamer colour is currently active. So `\color{fg}` inside a frametitle / title page / section page template comes out STRUCTURE BLUE, and `\setbeamercolor{normal text}{fg=fg}` is self referential and turns the WHOLE BODY blue. It compiles clean and the source looks right; you only see it when you render. Name the near black `ink`. (This blued four of the six style board candidates on their first render, 2026-09-01.)
- **A TikZ node with `text width` set plus `align=left` SHRINKS the interword space** until the words touch: `align=left` justifies, so TeX is free to squeeze the spaces. Use `align=flush left` on every node that also sets `text width`. Isolated 2026-09-01 with a four way test (`align=left`, `align=flush left`, a forced `\spaceskip`, and a `minipage` inside the node); the last three are all correct, and `flush left` is the cheapest. The symptom is a display sized title reading as one long word.
- **The footer `\hbox` needs a width** or `\hfill` collapses and the page number jams against the wordmark: `\hbox to\paperwidth{... \hfill ...}`.
- **A custom frametitle (eyebrow + rule) is TALLER than the pale-panel band**, so it eats body height: dense slides that fit under the thin band can OVERFLOW after the theme swap. Re-render EVERY dense slide after a theme change, and trim the frametitle's top `\vspace` to reclaim a few mm.
- **`current page` templates** (the left stripe, the hero scrim, the giant section number) use `remember picture` and need TWO compiles to position.
- **`kpsewhich` can report a theme NOT FOUND** even when `pdflatex \usetheme{...}` compiles it fine (committed PDFs may have been built elsewhere). The smoke-test compile is the real availability check, not `kpsewhich`.
- **Beamer frames default to vertical CENTER (`c`).** A LONE trailing `\vfill` (no matching leading one) shoves the body to the TOP, so the slide looks top-heavy; a lone leading `\vfill` shoves it to the BOTTOM. To center deterministically use a PAIR (`\vfill ... \vfill`) or NO `\vfill` at all. (This was the one defect a polish-review workflow left behind: an agent added a single trailing `\vfill` to "center" a slide and made it top-heavy instead.)

### Reusing images from a source PDF (extract, identify, recolor)
- Pull embedded rasters: `pdfimages -png -f P -l P source.pdf /tmp/x`; identify them with a labelled `montage`. Logos are often vector (not extracted), so a content page yields just the photo you want.
- A SOFT-MASKED image extracts as an RGB PLUS a separate gray smask. ImageMagick `-compose CopyOpacity` uses IM "opacity" (INVERTED: white = transparent), so it can knock the subject OUT (an all-white file). For a subject on a PURE-BLACK background, the robust fix is `convert in.png -fuzz 12% -fill white -opaque black out.png`.
- DUOTONE to the brand (to make a mismatched set cohere): `convert in.png -colorspace Gray -auto-level +level-colors '#16335f','#e9eff9' out.png` (dark brand for shadows, pale for highlights).
- A left-to-right brand SCRIM over a hero photo (so overlaid text reads): `\tikzfading[name=scrim, left color=transparent!6, right color=transparent!94]` then `\fill[brand, path fading=scrim] (sw) rectangle (ne);` over the `\includegraphics`.

### Publishing an ADDED deck to an existing Pages site
When the site already exists, do NOT re-add the workflow. Add a `cp <deck>.pdf _site/<name>.pdf` to the assemble step, add the deck's path to `on.push.paths`, and add a landing-page card. Verify live by BYTE-MATCHING the served PDF to the local one (stronger than a 200 alone):
```bash
LOCAL=$(stat -f%z <deck>.pdf)
curl -o /dev/null -s -w '%{http_code} %{size_download}\n' "$SITE/<name>.pdf"   # expect 200, and size == LOCAL
```

## The Paper and Grid style (the CAS BMAI HS26 lecture default)

**Carlos picked this on 2026-09-01** from a six candidate style board built for CAS BMAI HS26 weekend 1:
A the plain light Metropolis control, B Modern Editorial, C a Swiss monochrome grid with colour reserved
for the data, D Paper and Grid, E a bold keynote with a reversed brand band, F a hairline card data panel.
All six were REAL compiled four slide decks rendering the SAME content from one shared body file, which is
what "Co-decide the design DIRECTION with rendered mockups" above asks for. He picked D.

Libertinus Serif on a warm paper ground with a faint squared grid and a sepia margin rule: the register of
a mathematician working something out in a notebook. For a course that spends its first weekend fitting
lines to points, the squared page is the subject. This is a CUSTOM theme (no metropolis), kept next to the
deck that uses it. The reusable file is `templates/paper-grid-preamble.tex`, smoke tested on 2026-09-01.

**The palette.** Ground `paper` #FBF8F2, near black `ink` at `black!87`, `muted` at `black!55` (the legible
floor, do not lighten it), brand ink blue `brand` #26456E, sepia `accent2` #8A6D3B for chrome only, and the
Okabe-Ito pair `good` #0072B2 with `bad` #D55E00 for the win/loss axis. Keep the sepia off that axis.

**The chrome, all of it.**
- **The squared page**: a 5mm grid at `black!7` over the paper fill, plus one sepia vertical margin rule at
  `xshift=0.72cm`. Both live in `\setbeamertemplate{background}`, so they sit behind everything and need
  TWO compiles to position.
- **Frame title**: the title, then a full width sepia rule. It is barely taller than the pale panel band,
  so it costs the body almost no height. That is the advantage it has over the editorial eyebrow.
- **Footer**: an italic `\deckslug` on the left, the page number on the right. Redefine `\deckslug` per deck.
- **Title page**: title, short sepia rule, subtitle, author, then institute and date in muted italic. No
  photo hero.
- **Section divider**: a circled numeral, "Section N" in muted italic, the title, a sepia rule. Nothing else.
- **Diagram kit**: ink outlines with NO fills, and the emphasised box DOUBLE RULED in brand rather than
  filled. A solid fill fights the grid showing through; a double rule leaves it visible.

**Two things to test before committing a whole course to it.** Both are real, both are cheap.
1. **Project it in the actual room.** A warm ground can pick up a yellow cast from a badly calibrated
   projector. Paper #FBF8F2 survives a desk check; the hall is the real check.
2. **Put your densest TikZ figure on the grid.** The grid is faint and stays behind the figure, but a
   diagram carrying many hairlines of its own can shimmer against it. If it does, lighten the grid rather
   than darken the figure, and never take the grid past `black!8`.

**Do not "improve" it with fills.** `flowstrong` is a double rule and plates are hairline framed for one
reason: this theme's ground already carries texture, and every solid area added to a slide competes with it.

## Every hyperlink must LOOK like one (Carlos, 2026-09-02)

Default LaTeX sets a link in body black with no mark on it at all, so on a projected slide an address is
indistinguishable from ordinary prose and nobody in the room knows there is anything to go to. Every link
is therefore marked TWICE, by colour and by shape, and `templates/paper-grid-preamble.tex` does it for you.

| | |
|---|---|
| Colour | brand ink blue `#26456E`. **Never** the sepia, which is chrome, and **never** the `good`/`bad` pair, which is the win/loss axis and already means something else |
| Shape | a raw URL keeps the **mono** face. No body text on any slide is mono, so a monospaced run reads as machine text from the back of the hall |

```latex
\hypersetup{colorlinks=true, urlcolor=brand, linkcolor=brand,
            citecolor=brand, breaklinks=true, pdfborder={0 0 0}}
\urlstyle{tt}
\renewcommand{\UrlFont}{\ttfamily\color{brand}}
```

`pdfborder` cleared removes hyperref's coloured rectangle, which prints as a box around every link.

**Which macro to reach for.**
- `\url{https://...}` when the address itself is the content. Blue and mono.
- `\weblink{https://...}{the words the room reads}` when the visible text is prose. Colour alone marks
  this one: swapping the face mid sentence is worse than the problem it solves.
- `\qrlink{<height>}{https://...}` when the room has to reach the link **from its seats**.

### The QR block, and its two invisible traps

`\qrlink{3cm}{https://...}` draws a vector QR on a white card. Height first, then the address, so it reads
like `\framedimgh`. The code is generated FROM the URL at compile time, so it can never drift from the
address printed beside it.

**Always print the address next to the code.** A QR alone tells nobody where they are about to go, and
anyone following on a laptop cannot use it at all.

Both traps compile clean and neither is visible in the source:

1. **`qrcode` makes the whole code an `\href` by DEFAULT** (`\qr@hyperlinktrue` in `qrcode.sty`), so the
   moment you turn on `colorlinks` above, hyperref paints the modules `urlcolor` and the code comes out
   **brand blue**. It still scans on a good phone and fails on a poor one, and it looks like a rendering
   bug either way. Pass `nolink`.
2. **`qrcode` draws its modules in the CURRENT colour**, so on a full bleed statement frame, where
   `\color{white}` is active, the code comes out white on white and scans as nothing at all. Set
   `\color{black}` inside the node.

The white card is deliberate for the same family of reasons: the ground is `#FBF8F2`, and a scanner
reading a low contrast code across a lit hall is a coin flip.

**Verify the code by DECODING THE RENDERED PDF, never by looking at it.** A QR that is subtly wrong looks
exactly like one that is right, and the failure happens in front of the room:

```bash
pdftoppm -png -r 400 -f <page> -l <page> -singlefile deck.pdf /tmp/qr
python3 -c "import cv2;print(cv2.QRCodeDetector().detectAndDecode(cv2.imread('/tmp/qr.png'))[0])"
```

It must print the address character for character, including the trailing slash.

## Animation patterns

These are the five patterns the LATS decks use. `templates/deck-skeleton.tex` is a compilable skeleton that demonstrates all five with placeholder content; start from it.

**A. Diagram assembled piece by piece.** Hide each element until its click so the relation builds in front of the room. The frame ENDS on its final diagram reveal; it never gets a closing line (see "NO blue punchlines" above):
```latex
\node[nodebox, visible on=<1->] (a) {};
\node[nodebox, visible on=<2->] (b) {};
\draw[edge, visible on=<3->] (a) -- (b);
```

**B. `[<+->]` bullet reveal with a live diagram.** Each bullet on its own click; a labelled detail in the diagram appears in sync:
```latex
\begin{itemize}[<+->]
  \item First point
  \item \textbf{Contrast}: second point
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
\item<1->[\alert{1 step}] A few words
\item<2->[\alert{2 step}] A few words
```

**E. A worked example with REAL numbers, two columns.** `\begin{columns}` with the figure on one side, `[<+->]` facts on the other; build the figure click by click with `\only`. Every number must match the source spec exactly (see the single-source-of-truth rule).

The frame ends when the last fact lands. There is no closing line.

**F. Reveal a diagram piece WITHOUT reflowing the rest (the no-shift rule).** A `\only<n->{\node...}` inside a `tikzpicture` adds the node to the bounding box only from overlay n on, so the picture's SIZE changes between clicks and `\centering` re-centers it: the WHOLE diagram jumps every time a piece appears. That is disruptive and is a BUG. Fix: reserve every piece's space on every overlay so the layout is constant, and only toggle its VISIBILITY, with `visible on=<n->` (from `\usetikzlibrary{overlay-beamer-styles}`) on the node / edge / fill instead of wrapping it in `\only`:
```
% WRONG (the diagram re-centers when y appears):
\only<2->{\node[ycell] at (5,0){339};}
% RIGHT (space reserved on overlay 1, y just fades in, nothing else moves):
\node[ycell, visible on=<2->] at (5,0){339};
```
`visible on=<n->` works on a node, a `\draw`, and a `\fill`. Because every element is PLACED on every overlay, the bounding box is constant and a revealed piece never shifts its neighbours. (Fallback if you must keep `\only`: a fixed `\useasboundingbox (min) rectangle (max);` as the FIRST line of the tikzpicture, sized to the terminal overlay, so later pieces cannot grow the box. Prefer `visible on`.) Verify with the consecutive-overlay no-shift check in Verification.

The SAME settle hits any block whose reveal carries `\vfill` glue (an `\only<n->` at the bottom of a frame): the glue lands only on the last click and re-balances the frame, nudging the body UP on the final overlay. Use `\onslide<n->{...}`, which reserves the slot on every overlay so the final click adds the ink without any shift.

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
- A matrix and its operand / result vectors must align CELL FOR CELL. In a `y = A x` figure, the input vector `x` sits with each entry directly aligned to the matrix COLUMN it weights, and the output vector `y` with each entry directly aligned to the matrix ROW it comes from, drawn from ONE shared coordinate system (same cell size, same row and column lines), never positioned independently. If `x` or `y` floats half a cell off, the "row dotted with x" and "column weighted by x" intuition the figure exists to convey breaks. This is the most common alignment bug in a linear-algebra deck: render every matrix-times-vector slide and confirm the operands line up before shipping.
- LABEL what every ROW and every COLUMN of a matrix MEANS, and keep those labels across the whole sequence of slides that use that matrix. A bare grid of numbers teaches nothing. Put the column headers (what each column IS: oats, peanut butter, whey, banana) above the columns, rotated (`anchor=south west, rotate=30`) when they are wider than a cell, and the row labels (what each row IS: kcal, protein, fat) to the left of the rows. Label the operand and result vectors too (scoops `x`, totals `y`). A reader must be able to read off the picture alone what each number is a rate OF and a total OF.
- Never draw an arrow between two anchors that can coincide: `\draw (a.east) -- (b.west)` where `b` is `right=0pt of a` is ZERO-LENGTH and renders a stray arrowhead on the shared border. Use spanning anchors (`a.north east -- b.north east`) or give the arrow real length.
- **A right angle followed by a short final segment reads as a KINK, not an arrow.** An elbowed wire that runs a long way and then turns for 0.2 cm into its arrowhead looks like the line bent by mistake. Carlos, 2026-09-02: "some arrow pointers bend awkwardly near the end." Keep every arrow's LAST segment at about 0.45 cm or more. Two fixes, in order of preference: aim the wire at the ARROW entering the next block rather than at the block's own edge, which buys the whole gap between blocks and also makes every input join the stream the same way; or move the lane the wire runs along further from its target. This is scriptable, so check it rather than eyeballing it: parse each `\draw[...arrow]` path out of the source, take the last two coordinates, and flag any final segment under the threshold.
```bash
# every arrow whose last segment is too short to read as a direction
python3 - <<'EOF'
import re
s = open('deck.tex').read()
for m in re.finditer(r'\\draw\[(?:wirearrow|backarrow)[^\]]*\]\s*'
                     r'((?:\([-\d.]+,[-\d.]+\)\s*--\s*)+\([-\d.]+,[-\d.]+\));', s):
    p = [tuple(map(float, q)) for q in re.findall(r'\(([-\d.]+),([-\d.]+)\)', m.group(1))]
    (a, b), (c, d) = p[-2], p[-1]
    L = ((c - a) ** 2 + (d - b) ** 2) ** 0.5
    if L < 0.45:
        print(f"{L:.2f} cm  ({a},{b}) to ({c},{d})")
EOF
```
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

**The consecutive-overlay no-shift check.** A high overlay ratio proves pieces appear, but NOT that the diagram stays still. Render two CONSECUTIVE overlays of each animated figure (the first overlay and the terminal one) and compare: a fixed element (the matrix, an axis, an early node) must sit at the EXACT same pixel position on both. If it moved, the figure is reflowing as pieces appear (see Pattern F); switch that figure's `\only` reveals to `visible on=<n->`. A square appearing must never nudge the rest of the diagram.

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
  \onslide<2->{\centering\footnotesize muted text must stay legible: black!55\par}
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

> Build the slide deck `[DECK-FILE].tex` from the lecture note `[NOTE-PATH]`, in the light, projection-first Metropolis style with the Libertinus serif font. Write it to `[SLIDES-DIR]/[DECK-FILE].tex`.
>
> **Inherit the shared theme.** First line after `\documentclass[aspectratio=169]{beamer}` is `\input{beamer-preamble}`. Do NOT redefine colors, TikZ styles, or the theme; they live in `beamer-preamble.tex` in the same directory. Available styles: `edge`, `dimedge`, `nodebox`, `accentbox`, `treenode`, `gridcell`, `good fill`, `bad fill`, `acc fill`; colors `accent`, `accent2`, `good`, `bad`, `panel`, `fg`, `muted`.
>
> **Engine.** Plain `pdflatex`, twice, from `[SLIDES-DIR]` so `\input` resolves. (Only the explicit-request dark Fira variant uses LuaLaTeX.)
>
> **Structure.** One `\section` per section of `[NOTE-PATH]`, in the same order. Mirror the note; do not invent a narrative.
>
> **Deck principles (hard rules).**
> - Minimal text: a few words per slide, no paragraphs, at most 3 to 4 short bullets, a few words each, each starting with a capital.
> - A TikZ diagram on essentially every content slide, styled with the shared styles.
> - Every piece on its own click: `[<+->]` on lists, `\only<n->`/`\onslide<n->` on TikZ and formula terms.
> - **A frame ends on its final reveal.** Never put ANY line under the diagram: not a brand-coloured punchline and not a plain body sentence either. Put the thought inside the figure as an annotation, or in the margin beside it, or leave it to the lecturer to say.
> - **Section dividers carry the icon, "Section N", the title and the rule. No subtitle, no running question underneath.** If the preamble you inherited defines `\sectionsub` / `\cursub`, strip it.
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
| Brand / intro-deck variant (Modern Editorial: Biolinum, icons, flow kit, photo hero, ribbon) | `admin/intro-deck/` (From Data to Solutions) | `templates/editorial-preamble.tex` |
| Paper and Grid lecture theme (warm ground, squared grid, sepia chrome, no fills) | `w1-lecture-material/robbins-monro/` in `eth-bmai-hs26` (CAS BMAI HS26) | `templates/paper-grid-preamble.tex` |
| Full animated deck (structure + all 5 animation patterns) | `slides/mcts-slides.tex` | `templates/deck-skeleton.tex` |
| Second deck sharing the same preamble | `slides/lats-slides.tex` | (same skeleton) |
| Built-up formula (UCB1 / UCT term by term) | `slides/mcts-slides.tex` (UCB1, UCT frames) | skeleton Pattern C |
| Four-phase layered diagram | `slides/mcts-slides.tex` ("four phases" frame) | skeleton Pattern D |
| Two comparison bars drawn in one tikzpicture (collision-safe) | `slides/mcts-slides.tex` (blind-vs-guided frame) | (collision rule) |
| No-LaTeX-in-CI Pages deploy | `.github/workflows/deploy-pages.yml` | `templates/deploy-pages.yml` |
| Mobile-first dark landing page | `site/index.html` | `templates/landing-index.html` |
| Per-diagram awkward-graphics audit (render high-DPI, read, fix, verify, loop) | (the collision-bug lesson) | `templates/slide-figure-audit.workflow.py` |
| Brace-orientation check (mechanical, run before every commit) | (the brace lesson, caught four times) | `templates/brace-check.py` |
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

### 2b. Build-metadata check on the RENDERED PDF

```bash
pdftotext deck.pdf - | grep -nEi \
  "SOURCES\.md|README\.md|IMAGE-SOURCES|not pinned|Located, not|\bTBD\b|placeholder|deck's own|paraphrase|not a translation|English original|the muted line|modernised spelling"
```

Expect zero, or only a deliberate placeholder box you are about to close. Run it
on EVERY deck in the repository, not just the one you touched: this defect
spreads by copying, and in the course line that produced the rule it was sitting
in four decks at once. See "The slide is for the room, never for the build".

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

**Check every BRACE on this pass, one by one, and crop in on it.** A brace is
the one element whose orientation is invisible in the source and wrong half the
time: its arms must curl toward the thing it measures and its middle tip must
point at its own label. At full-slide 300 DPI a brace is only about 40 px, which
is too small to judge, so crop:
```bash
pdftoppm -png -singlefile -r 400 -f <PAGE> -l <PAGE> <deck>.pdf /tmp/braceN
magick /tmp/braceN.png -crop <W>x<H>+<X>+<Y> +repage -resize 1400x /tmp/braceN_zoom.png
```
See "Dimension braces point the WRONG WAY unless you order the path".

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
   - **Scan the source for frame bodies that open with a brace group.** Beamer eats them as the frame subtitle and the text never reaches the PDF, silently. The style critic cannot catch it, because a frame missing its caption looks like a frame that never had one. Run the scanner in "A frame body that OPENS with a brace group"; it must print 0.
4. **Dash-check** each rendered PDF (`pdftotext ... | grep -cP '\x{2014}'` and `'\x{2013}'`, both 0).
   - **Brace-check the source**: `python3 <skill>/templates/brace-check.py <deck>.tex` must print 0. A reversed brace compiles clean and is too small to catch by eye at slide scale.
   - **Decode every QR** off the rendered PDF at 400 DPI and check it character for character against the address printed beside it. Looking at a QR proves nothing. See "The QR block, and its two invisible traps".
5. **Animation-check** each deck (overlay pages much greater than frame count).
6. **Style critic**: render ALL pages of ALL decks to PNG and READ them; fix collisions / invisible text / clipping centrally.
   - **Per-diagram high-DPI audit:** render each collision-prone (terminal-overlay) page at 250 to 300 DPI and READ it alone; 130 DPI is too coarse to see a caption grazing a node. Use `templates/slide-figure-audit.workflow.py` for a deck with dense diagrams.
7. Commit the pre-compiled PDFs; gitignore LaTeX aux files.
8. Write `site/index.html` (dash-free) and add the path-filtered `deploy-pages.yml`.
9. Commit + push; watch the run (`gh run list`, then `gh run watch <id> --exit-status`).
10. **Verify LIVE** with `curl` (200 on `/`; 200 + `application/pdf` on a deck URL).

Step 6, actually looking at the rendered pages, is what makes the rest work. Don't skip it.

## Things to never do

- **Leave a hyperlink looking like body text.** Default LaTeX gives a link no mark at all, so the room never learns there is anything to go to. Brand blue for every link, and the mono face for a raw URL. See "Every hyperlink must LOOK like one".
- **Project a QR you have not DECODED from the rendered PDF.** A subtly wrong code looks exactly like a right one and fails in front of the room. Two defaults are against you: `qrcode` links its own output, so `colorlinks` turns the modules brand blue, and it draws in the current colour, so on a full bleed frame they come out white on white. Pass `nolink` and set `\color{black}`.
- **Build dark for a lecture.** Dark themes wash out on real projectors; dark is screen-only and explicit-request-only. Default to light.
- **Compile the dark Fira variant with `pdflatex` or `xelatex`.** No Fira / wrong rendering / fontconfig miss; that variant is LuaLaTeX only. (The standard light theme compiles with plain `pdflatex`.)
- **Redefine the theme inside a deck.** Colors and TikZ styles live in `beamer-preamble.tex`; `\input` it, don't fork it.
- **Name a colour `fg` or `bg`.** Beamer reserves both and rebinds them, so your near black silently becomes structure blue inside every template. Name it `ink`.
- **Set `align=left` on a TikZ node that also has `text width`.** TeX shrinks the interword space until the words touch. Use `align=flush left`.
- **Add a solid fill to a Paper and Grid diagram.** The ground already carries texture; emphasise with a double rule instead.
- **Leave the frametitle unstyled.** Set `\setbeamercolor{frametitle}{fg=black!88, bg=panel}` (and `frametitle right`); on the dark variant, override its default LIGHT bar the same way with a dark panel.
- **Let `muted` drift toward the background.** Light theme: keep it `black!55` or darker (lighter grays wash out under a projector). Dark variant: keep it `white!66!black` or lighter (`white!48!black` made captions nearly invisible).
- **Write a paragraph or a bullet wall on a slide.** A few words; a diagram does the work.
- **Show everything on the first click.** Every piece gets its own overlay (`[<+->]`, `\only<n->`). An overlay-page-count near the frame count is the symptom.
- **Let a diagram REFLOW as pieces appear.** Wrapping a tikz node in `\only<n->` grows the bounding box on click n, so `\centering` re-centers and the whole figure jumps. Reserve the space on every overlay with `visible on=<n->` so a revealed piece never shifts its neighbours (Pattern F; the consecutive-overlay no-shift check).
- **Put any line under the diagram.** Not a big centred brand-coloured punchline, and not a plain body sentence either. Carlos deleted fourteen by hand from the Weekend 5 deck, three more from Weekend 6, and one from every frame of the HS26 14:00 deck on 2026-09-01, each time because it was eating the space that made the figure look crammed. See "No closing punchline".
- **Open a frame body with a brace group.** `\begin{frame}` takes a SECOND optional braced argument, the subtitle, so `{\footnotesize Some caption.}` as the first thing in the body is handed to beamer and thrown away by any template that prints no subtitle. No error, no warning, no page count change, and the sentence is gone from the PDF. A comment in front does NOT shield it; a blank line, a `\centering` or a `\vspace{0mm}` does. See "A frame body that OPENS with a brace group".
- **Ship a deck without running `templates/brace-check.py` on it.** The rule below has been written down since 2026-09-02 and was still violated on 2026-09-23; the check is mechanical for that reason.
- **Draw a dimension brace without ordering its path.** `decoration={brace}` puts the tip on the LEFT of the direction of travel, so the same two coordinates give opposite braces and the wrong one compiles clean. Label below, draw right to left; label left, draw bottom to top. See "Dimension braces point the WRONG WAY".
- **Write a transpose sign on a manager-facing slide.** Carlos, 2026-09-01: "my students do not understand what a transpose is." A vector or matrix drawn on its side is labelled with its plain letter ROTATED 90 degrees, which is the notation: the label is turned because the object is turned.
- **Put a subtitle or a running question on a section divider.** The divider is icon, "Section N", title, rule. Nothing else (see "Section dividers carry the section name and nothing else").
- **Copy an older deck's preamble without diffing it against the template here.** Older preambles carry retired macros and chrome, which is how they keep re-entering decks that never asked for them.
- **Delete a closing line without renumbering the overlays.** It usually consumed the frame's last click, so removing it leaves a trailing overlay that reveals nothing.
- **Ship a bare grid of numbers with no row / column labels.** Every matrix and vector marks what each row and each column MEANS (kcal/protein/fat down the rows, oats/PB/whey/banana across the columns), kept consistent across the whole sequence of slides that use it.
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
- **Silently restyle a deck when the ask is the VAGUE "make it look better / it is bland".** When the lead NAMES the direction (e.g. "use the editorial style", "give this lecture deck more style"), that IS the pick: apply it directly and verify by rendering, no mockups. Otherwise co-decide the DIRECTION first: build 2 to 3 design SYSTEMS as REAL rendered title-and-content slides, let the lead pick, then roll the winner out. See "The Modern Editorial style".
- **Animate an intro / admin / overview deck just to satisfy the per-click rule.** That rule is for teaching content; an overview deck may be static, and "fewer transitions" is a legitimate ask.
- **Trust `kpsewhich` for theme availability.** It can report a theme NOT FOUND even when `pdflatex \usetheme{...}` compiles it fine; the smoke-test compile is the real check.
- **Use metropolis `[standout]` for a colored full-bleed slide.** It ignores `\setbeamercolor{standout}{bg=...}` and renders dark; wrap a `[plain]` frame with `background canvas` set to the brand color + explicit `\color{white}` (see `\statementframe` in `templates/editorial-preamble.tex`).

## Recipe for a slide build

0. **Read the source lecture notes and the numbers spec.** The deck is the note distilled; the section order and every number come from there. If there is a runnable reference implementation pinning the worked example, read its REAL output, not your memory of it.

1. **Author the shared preamble** from `templates/beamer-preamble.tex` (light, Libertinus serif). Retune the accent palette per course if desired; keep the mandatory fixes (white bg with dark text, pale panel frametitle, `muted` at `black!55` or darker).

2. **Smoke-test the preamble** (Phase 0): compile the 2-slide `_smoketest.tex`, render to PNG, READ it. Fix the theme here, before any deck exists.

3. **Co-decide the pivotal picks** with the lead if there is a fork (which worked example anchors the deck; a non-default palette). Present options + a recommendation; pause.

4. **Build one deck per source note** from `templates/deck-skeleton.tex`. Direct (1 to 2 notes) or fan out (3+ notes) using the deck-agent prompt template. Mirror the note's section order; apply the five animation patterns; pull every number from the spec.

5. **Verify each deck**: compile (the deck engine, twice), dash-check the PDF, animation-check (overlay pages much greater than frames).

6. **Style critic** (Phase 2): render ALL pages of ALL decks to PNG and READ them. Fix label collisions, invisible muted text, clipping, un-animated frames centrally. For dense diagrams, run the per-diagram high-DPI audit (`templates/slide-figure-audit.workflow.py`): render the collision-prone terminal-overlay pages at 250 to 300 DPI and read each alone (full-slide 130 DPI is too coarse).

7. **Commit** the pre-compiled PDFs; gitignore the aux files. Solo on `main`, small logical commits, end each message with the co-author trailer from the repo `CLAUDE.md`.

8. **Publish**: write `site/index.html` (dash-free) from the landing template; add the path-filtered `deploy-pages.yml`; commit + push.

9. **Watch + verify live**: `gh run list` then `gh run watch <id> --exit-status`; then `curl` the live URLs (200 on `/`; 200 + `application/pdf` on a deck).

10. **Iterate on feedback.** Common asks: fix a collision a viewer caught (render that page, reposition the label, re-render), add a slide for a note section that was thin, retune an accent for projector contrast, add a deck for a new note (one agent, inherits the same preamble).

"""
slide-figure-audit.workflow.py : per-diagram awkward-graphics audit for decks
(a Phase-2 sub-pass, the slide-deck sibling of the notes figure-audit).

WHY THIS EXISTS. A Beamer slide can compile, animate correctly, and pass every
dash check while a TikZ diagram on it is visually broken: a caption landing on a
sibling node, a label kissing a box on the dark canvas, a connector crossing an
unrelated node, matrices staggered off a shared axis, a zero-length arrow that
renders a stray arrowhead, or a piece from one overlay landing on a piece from
another. THE LESSON (the bug that bit the LATS build most): dark-background label
collisions are invisible in the source and invisible to every numeric/dash check;
only RENDERING the page and looking catches them.

The catch the full-page critic misses: it renders at -r 130, but a 16:9 slide is
only ~820 x 461 px at 130 DPI, so a label grazing a node is sub-visible. Slides
are small enough that the FULL slide fits under the Read tool's 2000 px cap even
at 300 DPI (a 169 slide is ~1890 x 1063 px at -r 300), so the fix is simply to
render the collision-prone pages HIGH and read them one at a time. (Contrast the
notes audit, where a letter page exceeds 2000 px at 300 DPI and you must crop.)

SHAPE (the same OWN-THE-LINCHPIN / PARALLEL / VERIFY rhythm, on slides):
  Diagnose  one agent PER collision-prone page, in parallel: render at 300 DPI,
            READ, judge against the slide-figure traps, propose a positioning-only
            fix.
  Apply     ONE serial agent edits the single deck .tex (parallel edits to one
            file would conflict), rebuilding with LuaLaTeX (twice) after each fix
            and reverting any edit that breaks the build or the animation.
  Verify    one agent PER fixed page, in parallel: re-render, READ, confirm the
            collision is gone and no NEW overlay collision appeared.
  Loop      re-diagnose only the still-awkward pages; stop when clean (cap ~3).

It is POSITIONING-ONLY: never change a number, a label's text, the slide content,
or the overlay timing (the <n-> specs). Engine is LUALATEX, never pdflatex.

WHICH PAGES. Collisions concentrate on the TERMINAL OVERLAY page of each frame
(every piece revealed = the most ink on the canvas). Audit those, not all 60 to
76 overlay pages. Find them inline first (the scouting step below).

THE TRAPS to judge against (the notes figure-hygiene traps, plus the slide ones):
  general (see lecture-notes/SKILL.md Figure hygiene):
    - a label wider/taller than its slot collides with a neighbour -> rotate or widen;
    - a label at an absolute coord grazes a border -> give it an explicit gap;
    - a connector/arrow routed THROUGH an unrelated node or its text -> route around;
    - grouped objects (matrices of different row counts + their operators)
      top-pinned and staggered -> center all on ONE shared axis;
    - an arrow between coincident anchors (b is right=0pt of a) -> zero-length
      stray arrowhead; use spanning anchors or give it length.
  slide-specific (dark + animated):
    - a caption placed below= its node lands on a sibling node or another caption
      on the dense dark canvas (THE recurring LATS bug); place it on empty canvas;
    - two captions stacked under one node across clicks -> wrap each in \\only<n>;
    - a piece revealed by \\only<n> lands on a piece from another overlay -> check
      the TERMINAL overlay page where all pieces coexist;
    - a default dark-on-transparent node, or muted text below white!66!black, is
      invisible on the dark bg (a contrast bug, not just a collision);
    - a built-up formula jumping/overlapping between clicks (missing trailing %).
"""

DECK = "<slides-dir>/<deck>.tex"
PDF  = "<slides-dir>/<deck>.pdf"

# 0. Scout the collision-prone pages (you, inline). For each frame, the LAST page
#    of its overlay run is the densest. Derive the list e.g. by rendering all
#    pages once at a low DPI to triage, or by walking the overlay page ranges.
#    One entry per page: its 1-based PDF page index and the frame title (a stable
#    anchor for locating the frame's source).
pages = collision_prone_pages(DECK)   # [{"page", "frame_title"}, ...]

work = list(pages)
for round in range(1, 4):                         # cap at 3 rounds
    # ---- Diagnose: one agent per collision-prone page, parallel ----
    diagnoses = parallel([
        agent(
            name=f"diagnose-p{p['page']}",
            brief=f"""
            Audit ONE slide for AWKWARD GRAPHICS / DARK-BG COLLISIONS, not content.
            Render it HIGH and READ it (that is how you SEE collisions):
              pdftoppm -png -singlefile -r 300 -f {p['page']} -l {p['page']} {PDF} /tmp/slide{p['page']}
            A 16:9 slide at -r 300 is ~1890 x 1063 px, under the Read tool's
            2000 px cap, so the FULL slide is fine; only if a diagram is very
            dense, additionally crop to it with -x -y -W -H. Read the PNG, then
            read the frame's source in {DECK} (find it by the frame title
            "{p['frame_title']}"). Judge against the slide-figure traps: a caption
            landing on a sibling node or another caption; a label kissing a box on
            the dark canvas; a connector crossing an unrelated node; grouped
            objects staggered off a shared axis; a zero-length arrow between
            coincident anchors; an \\only<n> piece overlapping a piece from another
            overlay; muted text too dark / a dark-on-transparent node (invisible).
            Rate severity none/low/medium/high. For medium/high propose a MINIMAL,
            POSITIONING-ONLY fix (move a label to empty canvas, wrap stacked
            captions in \\only<n>, aim an arrow at empty space, center a group on a
            shared axis, give a zero-length arrow real length) that changes NO
            number, label text, slide content, or overlay timing. Cite the exact
            pixel evidence.
            """,
            schema={"page": "int", "severity": "str", "issues": "list",
                    "fix": "obj|null", "crop_path": "str"},
        )
        for p in work
    ])
    actionable = [d for d in diagnoses if d["severity"] in ("medium", "high")]
    if not actionable:
        break                                     # clean -> done

    # ---- Apply: ONE serial agent (parallel edits to one .tex would conflict) ----
    apply = agent(
        name="apply-fixes",
        brief=f"""
        Edit ONLY {DECK}. Process the actionable slides one at a time: locate the
        frame by its title, make the MINIMAL positioning edit, then rebuild with
        LUALATEX TWICE (lualatex -interaction=nonstopmode <deck>.tex, run from the
        slides dir so \\input{{beamer-preamble}} resolves). If the build fails or
        the overlay page count drops (you broke an animation), REVERT that frame's
        edit exactly and record it as failed; then self-check by rendering the
        page at -r 300 and reading it.
        HARD CONSTRAINTS: never touch beamer-preamble.tex; never change a number,
        label text, slide content, or an overlay <n-> spec; ASCII only, no Unicode
        em/en dash, no prose "---"/"--" (a TikZ "--" segment is fine; the repo
        write-hook rejects forbidden dashes). If a good fix needs a content or
        timing change, DEFER it (report, do not edit). Use judgement over the
        diagnoser's suggested coordinate if it is inconsistent or would change
        meaning. After all slides, rebuild twice more and confirm the overlay page
        count is unchanged (the animation check still passes).
        """,
        schema={"applied": "list", "failed": "list", "deferred": "list",
                "build_ok": "bool", "overlay_pages": "int"},
    )

    # ---- Verify: one agent per fixed page, parallel, INDEPENDENT ----
    verds = parallel([
        agent(
            name=f"verify-p{d['page']}",
            brief=f"""
            Independently verify slide page {d['page']} AFTER the fix (you did NOT
            make it; judge fresh). Re-render at -r 300 (-singlefile) and READ. Is
            the reported collision gone (resolved)? Is the slide now free of ANY
            awkward graphics / dark-bg collision, with nothing newly overlapping
            (now_clean)? Cite what you see.
            """,
            schema={"page": "int", "resolved": "bool", "now_clean": "bool"},
        )
        for d in actionable
    ])

    # next round: only the pages a verifier did not pass
    still = {v["page"] for v in verds if not (v["resolved"] and v["now_clean"])}
    work = [p for p in pages if p["page"] in still]
    if not work:
        break

# BACKSTOP (you, not an agent): eyeball the before/after of every changed slide
# yourself. Get the before deck PDF from git (git show HEAD:.../<deck>.pdf),
# render the matched pages at -r 300, stack them (magick before.png after.png
# -append cmp.png), and LOOK. Confirm the source diff is positioning-only (git
# diff shows coordinates / anchors / \only placement ONLY, never a number, label
# text, or an overlay <n-> spec). Re-run the animation check (overlay pages much
# greater than frames). Only then commit (solo on main, small logical commit,
# co-author trailer per the repo CLAUDE.md).

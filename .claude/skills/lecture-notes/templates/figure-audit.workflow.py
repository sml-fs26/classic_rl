"""
figure-audit.workflow.py : per-figure awkward-graphics audit (a Phase-4 sub-pass).

WHY THIS EXISTS. A TikZ figure can compile, carry every correct number, and pass
every dash check while being visually broken: a label grazing a border, a
connector clipping an unrelated cell, matrices staggered off a shared axis, an
arrow between two coincident anchors that renders a stray zero-length arrowhead.
The Phase-4 full-page critic (pdftoppm -r 130, read every page) is TOO COARSE to
see these: the Read tool downsamples a letter page to ~1568 px, so a figure a
third of a page tall lands at ~500 px and its defects are sub-visible. THE
LESSON: the Weekend 0 NumPy/linalg notes shipped SIX such figures past the
full-page critic; all six were caught only when each figure was cropped tight,
rendered high, and read IN ISOLATION. This workflow does exactly that.

SHAPE (the same OWN-THE-LINCHPIN / PARALLEL / VERIFY rhythm, applied to figures):
  Diagnose  one agent PER FIGURE, in parallel: crop tight + high-DPI, READ, judge
            against the figure-hygiene traps, propose a positioning-only fix.
  Apply     ONE serial agent edits the single notes.tex (parallel edits to one
            file would conflict), rebuilding after each figure and reverting any
            edit that breaks the build.
  Verify    one agent PER fixed figure, in parallel: re-crop, READ, confirm the
            issue is gone and nothing new broke.
  Loop      re-diagnose only the still-awkward figures; stop when clean (cap ~3).

It is POSITIONING-ONLY: it must NEVER change a number, a matrix entry, a label's
text, or prose. Run it whenever a notes set has more than a couple of TikZ
figures, after the figures compile and the full-page critic (Verification step 4)
has had its pass.

CROP RECIPE (memorize the two gotchas):
  - At -r 200 the full page is 1700 px wide (8.5 in) by 2200 px tall (11 in).
    A vertical band [YS%, YH%] of the page is  -y (YS*22)  -H (YH*22) .
  - Keep BOTH crop dimensions < 2000 px or the Read tool REJECTS the image.
    1700 wide is always safe; only a near-full-page-tall band exceeds 2000 tall
    (then drop the DPI, e.g. -r 170).
  - pdftoppm -singlefile writes exactly <name>.png (no page-number suffix), so
    each agent can use a deterministic path.
"""

NOTES = "<dossier>/lecture-notes/notes.tex"
PDF   = "<dossier>/lecture-notes/notes.pdf"

# The figure-hygiene traps every diagnose/verify agent judges against (grounded
# in the six Weekend 0 figures). Keep this verbatim in the agent briefs.
TRAPS = """
1. label collides with a neighbour (text wider than its column/slot) -> rotate it
   over its own column or widen the slot. (Wk0 Fig 2: four headers merged into
   "oatsp.butterwheybanana".)
2. label grazes a border (placed at an absolute coord sitting on the edge) -> give
   it an explicit gap with above=/below=Xmm of <node>, not a hand-tuned coord.
   (Wk0 Fig 4: weight labels glued to the cell tops.)
3. connector/arrow routed THROUGH an unrelated cell or its text -> leave and enter
   via the nearest FREE edge so no line crosses content it does not reference.
   (Wk0 Fig 3: dotted connectors cut across the 0.3/0.0 cells.)
4. grouped objects of different sizes (matrices with different row counts, plus
   the operators between them) top-pinned and staggered -> center every member on
   ONE shared axis; compute the half-cell offsets, do not eyeball them. (Wk0
   Figs 5 and 6: matrices staggered, @ / arrow riding a row too high.)
5. arrow between coincident anchors (b is right=0pt of a, so a.east == b.west) ->
   a ZERO-LENGTH segment renders only a stray arrowhead on the shared border; use
   spanning anchors (a.north east -- b.north east) or give the arrow real length.
   (Wk0 Fig 8: the stretch arrow was a degenerate arrowhead.)
"""

# 0. Map figures to pages (you, inline). One entry per tikzpicture: its page, a
#    starting crop band (ys%, yh%), and a UNIQUE caption substring as a stable
#    anchor (it survives edits; line numbers do not, because each fix shifts them).
figures = scan_figures(NOTES)   # [{"n", "page", "ys", "yh", "caption_anchor"}, ...]

work = list(figures)
for round in range(1, 4):                        # cap at 3 rounds
    # ---- Diagnose: one agent per figure, parallel ----
    diagnoses = parallel([
        agent(
            name=f"diagnose-fig{f['n']}",
            brief=f"""
            Audit ONE figure for AWKWARD GRAPHICS ONLY (layout a reader notices),
            not content. Render a TIGHT crop and READ it (that is how you SEE it):
              pdftoppm -png -singlefile -r 200 -f {f['page']} -l {f['page']} \\
                -x 0 -y {f['ys']*22} -W 1700 -H {f['yh']*22} {PDF} /tmp/fig{f['n']}-pre
            TUNE ys/yh and re-render until the whole figure + its "Figure N:"
            caption are framed with a little margin, nothing clipped; keep both
            sides < 2000 px. Then read the figure's tikzpicture in {NOTES} (find
            it by the caption substring "{f['caption_anchor']}"). Judge it against
            these traps, citing the exact pixel evidence for each:{TRAPS}
            Rate severity none/low/medium/high. For medium/high propose a MINIMAL,
            POSITIONING-ONLY fix (nudge a node, set anchor=/position=, change a
            coordinate / rotate / bend, reroute an arrow) that changes NO number,
            label text, or content, plus a unique source anchor near the edit.
            """,
            schema={"figure": "int", "severity": "str", "issues": "list",
                    "fix": "obj|null", "crop_path": "str"},
        )
        for f in work
    ])
    actionable = [d for d in diagnoses if d["severity"] in ("medium", "high")]
    if not actionable:
        break                                    # clean -> done

    # ---- Apply: ONE serial agent (parallel edits to one file would conflict) ----
    apply = agent(
        name="apply-fixes",
        brief=f"""
        Edit ONLY {NOTES}. Process the actionable figures one at a time: locate
        the figure by its caption anchor, make the MINIMAL positioning edit, then
        rebuild (pdflatex -interaction=nonstopmode -halt-on-error). If the build
        fails, REVERT that figure's edit exactly and record it as failed. Then
        self-check by rendering the figure crop and reading it.
        HARD CONSTRAINTS: never touch preamble.tex; never change a number, matrix
        entry, label text, equation, or prose; ASCII only, no Unicode em/en dash,
        no "---" and no prose "--" (the TikZ "--" segment operator is fine; the
        repo write-hook rejects forbidden dashes and your edit will fail). If a
        good fix would require a content change, DEFER it (report, do not edit).
        Use judgement over the diagnoser's suggestion: if its proposed coordinate
        is inconsistent, or its fix would change meaning (e.g. collapse a per-cell
        pairing the figure teaches), compute your own positioning-only fix that
        preserves the pedagogy. After all figures, run pdflatex twice more to
        settle refs/toc; confirm the page count is unchanged.
        """,
        schema={"applied": "list", "failed": "list", "deferred": "list", "build_ok": "bool"},
    )

    # ---- Verify: one agent per fixed figure, parallel, INDEPENDENT ----
    verds = parallel([
        agent(
            name=f"verify-fig{d['figure']}",
            brief=f"""
            Independently verify figure {d['figure']} AFTER the fix (you did NOT
            make it; judge fresh). Re-crop (same recipe, -singlefile, < 2000 px)
            and READ. Is the reported issue gone (resolved)? Is the figure now
            free of ANY awkward graphics (now_clean)? Cite what you see.
            """,
            schema={"figure": "int", "resolved": "bool", "now_clean": "bool"},
        )
        for d in actionable
    ])

    # next round: only the figures a verifier did not pass
    still = {v["figure"] for v in verds if not (v["resolved"] and v["now_clean"])}
    work = [f for f in figures if f["n"] in still]
    if not work:
        break

# BACKSTOP (you, not an agent): eyeball the before/after crop of every changed
# figure yourself. Get the before from git (git show HEAD:.../notes.pdf), render
# matched bands, stack them (magick before.png after.png -append cmp.png), and
# LOOK. Then confirm the source diff is positioning-only: git diff should show
# coordinates / anchors / rotate / bend / arrow endpoints ONLY, never a number or
# label text. Only then commit (solo on main, small logical commit, co-author
# trailer per the repo CLAUDE.md).

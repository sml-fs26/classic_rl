"""
spec-build-verify.workflow.py : Phases 2 to 4 orchestration template.

Runs AFTER the lead has co-decided the anchor example (Phase 1c). Three phases:

  Phase 2  SPEC the linchpin, single-threaded, by YOU.
  Phase 3  BUILD the artifacts in PARALLEL, all citing the spec numbers.
  Phase 4  VERIFY with a critique pass (compile, execute, assert, render+read).

Orchestration shape: OWN-THE-LINCHPIN (Phase 2, you), then PARALLEL BUILD
(Phase 3, agents), then VERIFY-WITH-CRITIQUE (Phase 4, a dedicated critic
agent that RENDERS pages and READS them). The orchestrator keeps the canonical
example, the preamble/theme, the voice, and the verification single-threaded.

Inherit RESEARCH_CONVENTIONS.md and the dash rule throughout.
"""

TOPIC = "<the frontier topic>"
DOSSIER = "<topic>-research/<PAPER-or-TOPIC>/"
AUDIENCE = "<the workshop audience>"
ANCHOR = "<the co-decided worked example>"


# ===========================================================================
# PHASE 2 (SINGLE-THREADED, YOU): spec the linchpin
# ===========================================================================
#
# Two deliverables you author yourself, because every downstream artifact pins
# to them. Do NOT delegate these.
#
# 2a. The RUNNABLE reference implementation (single source of truth for numbers)
#     Start from templates/reference-impl.py. It MUST:
#       - be fully deterministic (pin every seed);
#       - assert SEMANTIC VALIDITY at import (NOT just numeric consistency):
#         encode the structural invariant of ANCHOR as code and call it at
#         import (e.g. BFS that every special node is reachable + no dead
#         region; a distribution sums to 1; a matrix is full-rank). THE LESSON:
#         the first LATS grid passed every compile/number/dash check yet had
#         unreachable cells, caught only by a human eyeballing the diagram;
#         this assert is the guard against that.
#       - print a hand-checkable trace of the first few steps + the final result.
copy_template("templates/reference-impl.py", f"{DOSSIER}<notebook-dir>/reference-impl.py")
ref_output = run_python(f"{DOSSIER}<notebook-dir>/reference-impl.py")   # capture stdout
# Edit the reference impl until it embodies ANCHOR; re-run; this stdout is law.

# 2b. The SPEC DOC: quote the reference run's REAL printed output verbatim.
#     Start from templates/example-spec.md. Paste the literal trace from
#     `ref_output`; define every symbol; write the bridge to the frontier
#     method. SELF-CONTAINED-FOR-THE-AUDIENCE: define every symbol on first use;
#     plan to EXPAND dense paper sections (the LATS notes inflated a 2-page
#     method section to ~5 pages, every sentence a bachelor would not grasp
#     unpacked). Every NUMBER in this doc comes from `ref_output`, not memory.
copy_template("templates/example-spec.md", f"{DOSSIER}<notebook-dir>/example-spec.md")
write_spec_quoting(ref_output)

# 2c. SMOKE-TEST THE PREAMBLE BEFORE FANNING OUT (the linchpin-within-the-linchpin).
#     Copy templates/notes-preamble.tex, rename colors/macros/examplebox title,
#     compile a 2-page test, RENDER to PNG, and EYEBALL it. Confirm \mathds{1}
#     is a real digit one (not the \mathbb{1} junk glyph), the theorem/definition
#     boxes look right, the tcolorbox renders. A broken preamble fanned out in
#     parallel wastes ALL the parallel build work. (LATS lesson: the slide theme
#     WAS smoke-tested and it paid off; the notes preamble was NOT and shipped a
#     broken indicator glyph a human caught later. Do not repeat that.)
copy_template("templates/notes-preamble.tex", f"{DOSSIER}lecture-notes/preamble.tex")
compile_and_render_and_READ(f"{DOSSIER}lecture-notes/preamble.tex")   # you LOOK at the PNG
copy_template("templates/gitignore-template", f"{DOSSIER}lecture-notes/.gitignore")


# ===========================================================================
# PHASE 3 (PARALLEL): build the artifacts, all citing the SAME spec numbers
# ===========================================================================
#
# One agent per artifact. Each is handed the spec doc + the smoke-tested
# preamble and told: every number you state must be the spec's number; every
# symbol defined on first use; dash-free RENDERED output.

artifacts = parallel([
    agent(
        name="build-notes",
        brief=f"""
        Write the LaTeX lecture notes `notes.tex` for {TOPIC}, audience
        {AUDIENCE}, anchored on {ANCHOR}. \\input the smoke-tested
        `preamble.tex` (already in lecture-notes/; do NOT modify it). Walk the
        method on {ANCHOR} using the EXACT numbers from `example-spec.md`
        (quote its trace). SELF-CONTAINED discipline: define every symbol on
        first use; EXPAND every dense source passage so a {AUDIENCE} reader
        needs no external lookup (err long, not terse). Use the examplebox
        tcolorbox for the running example and the shared TikZ tree styles for
        figures.
        DASH RULE: dash-free RENDERED output. NEVER a triple-hyphen run (renders
        an em dash) or a prose double-hyphen run (renders an en dash); use a
        comma, colon, parentheses, or "to". The ONLY exempt double-hyphen is a
        TikZ line segment inside a tikzpicture.
        Verify: pdflatex compiles clean; pdftotext | grep -c the two Unicode
        dashes prints 0; numbers match the spec.
        """,
        schema={"path": "str", "compiles": "bool", "rendered_dashes": "int"},
    ),
    agent(
        name="build-website",
        brief=f"""
        Build the single-file, offline, dependency-free interactive site
        `index.html` for {TOPIC}, anchored on {ANCHOR}. No CDN, no fetch, no
        build step; opens from file://. Port the reference implementation's
        logic to JS so the FIRST FEW STEPS reproduce `example-spec.md`'s trace
        exactly (state this in the UI). Match the lecture-notes calm palette
        (reuse the calmblue/teal/sand tokens as CSS variables). Step the method
        one phase at a time; show every per-node statistic the notes show.
        DASH RULE for HTML: never &mdash; &ndash; or numeric dash entities;
        verify the SOURCE has none.
        (If your course also maintains the course-viz / teaching-viz skill and
        wants the full multi-file editorial treatment, follow that skill
        instead; this single-file form is the LATS pattern for a notes
        companion.)
        """,
        schema={"path": "str", "reproduces_trace": "bool", "dash_entities": "int"},
    ),
    agent(
        name="build-notebook",
        brief=f"""
        Build the runnable notebook for {TOPIC}, anchored on {ANCHOR}. Generate
        it PROGRAMMATICALLY with nbformat (a `_build_notebook.py` that writes
        the .ipynb) so the JSON is guaranteed valid. Import / embed the SAME
        reference implementation (do not fork the algorithm). Reproduce the
        canonical trace, then add plots (convergence, explore/exploit, the
        optional variant). Plain ASCII only.
        Verify: `python3 _build_notebook.py` then
        `jupyter nbconvert --execute --to notebook` runs top to bottom with no
        error; the printed canonical numbers match the spec.
        """,
        schema={"build_path": "str", "ipynb_path": "str", "executes": "bool"},
    ),
    # OPTIONAL 4th: a slides deck derived from the notes. If you build one, its
    # Beamer preamble is its OWN linchpin: smoke-test the slide theme (compile a
    # 2-slide test, render, READ it) BEFORE fanning out slides. Watch for
    # dark-background label collisions (a real LATS bug caught by rendering).
])


# ===========================================================================
# PHASE 4 (VERIFY WITH CRITIQUE): compile, execute, assert, render, READ
# ===========================================================================
#
# Mechanical checks first (cheap, single-threaded), then a STYLE/CONSISTENCY
# CRITIC agent that renders ALL pages to PNG and READS them. Exit-0 and matching
# numbers do NOT catch invisible/garbled glyphs, label collisions, off-page
# clipping, or invalid example states. EVERY real bug the LATS session hit (an
# unreachable example region, a junk math glyph, dark-background label
# collisions) was caught by RENDERING, not by compiling.

# 4a. mechanical (you):
assert run_python(f"{DOSSIER}<notebook-dir>/reference-impl.py").exit == 0      # import assert + drift guard pass
assert pdflatex_compiles(f"{DOSSIER}lecture-notes/notes.tex")
assert rendered_dash_count(f"{DOSSIER}lecture-notes/notes.pdf") == 0           # pdftotext | grep -c
assert source_has_no_prose_double_or_triple_hyphen(f"{DOSSIER}lecture-notes/notes.tex")
assert nbconvert_executes(f"{DOSSIER}<notebook-dir>/<notebook>.ipynb")
assert numbers_match_spec(notes="notes.pdf", site="index.html", nb="<notebook>.ipynb")

# 4b. style/consistency critic (a dedicated agent that LOOKS):
agent(
    name="render-and-read-critic",
    brief=f"""
    You are the style/consistency critic. Render EVERY page of
    lecture-notes/notes.pdf to PNG (pdftoppm -png -r 130) and screenshot the
    site (headless Chrome) and READ each image. Check, by looking:
      - no garbled / invisible math glyphs (especially the indicator: is it a
        real double-struck 1, not the \\mathbb{{1}} junk glyph?);
      - no label collisions, off-page clipping, or overfull lines;
      - the worked example's DIAGRAM is structurally VALID (e.g. no unreachable
        cell / dead region the import-assert might somehow not cover);
      - the SAME numbers appear in the notes, the site, and the notebook;
      - no Unicode dash slipped into any rendered surface.
    Report each issue with the page/scene it is on and a screenshot.
    """,
)
# Fix everything the critic flags, then re-render and re-READ. Do not ship on
# exit-0 alone; ship when a human (or the critic) has LOOKED at every page.


# ===========================================================================
# COMMIT (solo on main; small logical commits; co-author trailer)
# ===========================================================================
# gitignore build artifacts (LaTeX *.aux/*.log/*.nav/*.snm/*.toc/*.out/*.vrb,
# __pycache__/). COMMIT the compiled .pdf files and the .ipynb: they are the
# readable deliverables.

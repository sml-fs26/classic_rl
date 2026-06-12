"""
gather-brainstorm.workflow.py : Phase 1 orchestration template.

Phase 1 = GATHER SOURCES + BRAINSTORM WORKED-EXAMPLE CANDIDATES, in parallel,
then CO-DECIDE the anchor example with the lead. This is the OWN-THE-LINCHPIN
front of the build: the orchestrator keeps the bar adjudication, the dedup, and
the final pick single-threaded; only the breadth-first fan-out is delegated.

Shape (mirrors how the LATS session ran it): a batch of parallel agent() calls,
each with a STRICT output schema; then single-threaded synthesis by the
orchestrator. Adapt `agent(...)` to your harness's subagent-spawn primitive.
Pseudocode: treat agent() as "spawn a subagent with this brief, get its text
back"; run the calls in a batch so they execute in PARALLEL.

Inherit RESEARCH_CONVENTIONS.md: the provenance bar (only bar-clearing venues /
top-lab preprints), curl-not-WebFetch for arxiv PDFs, title-verify every
download, solo-on-main commits with the co-author trailer.
"""

TOPIC = "<the weekend's frontier topic, e.g. LATS / planning-as-search>"
DOSSIER = "<topic>-research/<PAPER-or-TOPIC>/"   # where artifacts will live
AUDIENCE = "<the workshop audience, e.g. CS bachelor / MAS-AID professionals>"


# ===========================================================================
# PHASE 1a (PARALLEL): gather + deep-read the source papers into a digest
# ===========================================================================
#
# The anchor paper is usually already vendored + title-verified in the dossier
# `papers/`. The job here is to deep-read it AND its key antecedents (the papers
# it builds on) into one digest the notes will cite. Fan these reads out: one
# agent per paper, each returning a fixed-shape brief.
#
# VENDORING (each agent, for any paper not already local): WebFetch to arxiv is
# blocked, but curl works:
#     curl -sL -o {DOSSIER}papers/<slug>_<arxiv-id>.pdf https://arxiv.org/pdf/<id>
# THEN ALWAYS title-verify (a past download was silently truncated):
#     pdftotext -f 1 -l 1 <file> - | head -3
# Only deep-read a paper whose title verified.

SOURCE_PAPERS = [
    # (slug, arxiv_id_or_local_path, why_it_matters_for_the_notes)
    ("<anchor-paper>", "<arxiv-id>", "the paper the weekend teaches"),
    ("<antecedent-1>", "<arxiv-id>", "the method the anchor builds on"),
    ("<antecedent-2>", "<arxiv-id>", "the value/eval idea the anchor reuses"),
    # ... typically 6 to 9 papers total
]

paper_briefs = parallel([
    agent(
        name=f"read-{slug}",
        brief=f"""
        Deep-read the paper {slug} (arxiv {arxiv_id}) for a lecture-notes build
        on {TOPIC}, audience {AUDIENCE}. If no local PDF exists, vendor it with
        curl into {DOSSIER}papers/ and title-verify with pdftotext before
        reading (WebFetch to arxiv is blocked; curl works).

        Return a brief with EXACTLY these fields:
          - bibliographic header (authors, venue, year, arxiv id)
          - one-paragraph TL;DR
          - the precise definitions / equations the notes will need, quoted
            with their equation numbers and section references
          - every headline NUMBER (with its table/figure provenance) the notes
            might cite
          - the 2 to 4 antecedent papers this one leans on (so the digest is
            self-contained for {AUDIENCE})
          - dense passages that a {AUDIENCE} reader would NOT grasp unpacked
            (flag them; the notes will inflate these)
        Cite-or-label discipline: every claim either cites the paper or is
        marked an inference. Do NOT adjudicate the provenance bar yourself;
        return venue + year + senior-author + lab as EVIDENCE.
        """,
        schema={
            "header": "str", "tldr": "str", "definitions": "list[str]",
            "numbers": "list[{value, provenance}]",
            "antecedents": "list[{slug, why}]", "dense_passages": "list[str]",
            "bar_evidence": "{venue, year, senior_author, lab}",
        },
    )
    for (slug, arxiv_id, _why) in SOURCE_PAPERS
])

# Single-threaded synthesis (YOU, the orchestrator):
#   - Adjudicate the provenance bar centrally on each paper's bar_evidence.
#   - Stitch the briefs into ONE `sources-digest.md` in the dossier, in the
#     consistent house voice, deduped, self-contained for the audience.
write_file(f"{DOSSIER}sources-digest.md", synthesize(paper_briefs))


# ===========================================================================
# PHASE 1b (PARALLEL, concurrent with 1a): brainstorm worked-example candidates
# ===========================================================================
#
# Fan out by CLUSTER so the candidates are diverse (the LATS run used game /
# puzzle / real-world / abstract clusters and got ~32 raw candidates). Each
# agent rates every candidate against the "good anchor" rubric so the curation
# is comparable across clusters.

CANDIDATE_RUBRIC = """
A strong anchor worked-example should:
  1. make all the method's moving parts VISIBLE on a small instance;
  2. be HAND-COMPUTABLE (every key number checkable with a calculator);
  3. ANIMATE well in a browser (the interactive site rides on it);
  4. be RELATABLE to {AUDIENCE};
  5. ideally BRIDGE to the frontier method with nothing to unlearn.
Note the tensions that will decide the pick (e.g. deterministic vs uncertain,
abstract vs alive, single-agent vs two-player) explicitly per candidate.
""".format(AUDIENCE=AUDIENCE)

CLUSTERS = ["games", "puzzles-planning", "real-world-analogies", "abstract-pedagogical"]

candidate_sets = parallel([
    agent(
        name=f"brainstorm-{cluster}",
        brief=f"""
        Brainstorm worked-example candidates for teaching {TOPIC} to {AUDIENCE},
        in the cluster: {cluster}. Generate 6 to 10 candidates. For EACH, fill:
          - name + one-line description
          - how each moving part of the method shows up in it
          - is it hand-computable? animates well? relatable? bridges to the
            frontier method?
          - its single biggest WEAKNESS as an anchor (be honest)
        Rubric to rate against:
        {CANDIDATE_RUBRIC}
        """,
        schema={"candidates": "list[{name, desc, visible, hand, animates, "
                "relatable, bridges, weakness}]"},
    )
    for cluster in CLUSTERS
])

# Single-threaded synthesis (YOU):
#   - Merge all clusters, dedup, CURATE DOWN TO ABOUT 20 with rationale.
#   - Write `<example-dir>/brainstorm.md`: the curated 20, an analysis of the
#     tensions, a shortlist of the top ~4, and YOUR recommended winner.
write_file(f"{DOSSIER}<example-dir>/brainstorm.md", curate_to_20(candidate_sets))


# ===========================================================================
# PHASE 1c (SINGLE-THREADED): CO-DECIDE the anchor example WITH THE LEAD
# ===========================================================================
#
# This is a PIVOTAL pick: every downstream artifact builds on it. Do NOT choose
# silently. Present the curated shortlist + your recommendation + the rationale
# and PAUSE for the lead. (LATS: the grid treasure-hunt was chosen with Carlos.)
present_to_lead(
    shortlist=top_4(candidate_sets),
    recommendation="<your pick + one paragraph why it wins on the rubric>",
    note="downstream notes/site/notebook all anchor on this; confirm before Phase 2",
)
# WAIT for the lead's decision before starting spec-build-verify.workflow.py.

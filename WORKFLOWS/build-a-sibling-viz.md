# Workflow: Build a Sibling Viz

Reusable autonomous workflow for spawning a new sibling viz in the
SML classic-RL curriculum (anymal, casino, spooky, darts, cliff-walk,
snakes-ladders, pokemon-battle, markov-kombat …).

This workflow was extracted from the autonomous build of
`markov-kombat/` (the MARKOV KOMBAT II re-skin of `pokemon-battle/`).
It is intended to be cheaper each time it runs.

---

## When to use this workflow

You want to build a new RL viz whose **pedagogical content is
identical** to an existing one (the "donor" viz), but whose
**presentation** — characters, story, palette, sprites, music — is
different.

If you want NEW pedagogy, this isn't the workflow.  Treat the new
content like the original pokemon-battle was: open-ended iteration.

---

## The mental model

The donor viz is the **spec**.  The new viz is a **translation
project**.  Every design decision the donor made is locked.  The
only question per element is "how does this read in the new skin's
voice?"

The cost of this workflow is dominated by:
1. **Spec writing** (~3-4h once)
2. **Sprite art / asset generation** (~3-6h depending on source)
3. **Per-scene CSS sweeps** (~2-3h)
4. **QA pass** (~2-3h)

Total: 12-20 hours for a polished v1.

---

## Seven phases, gated

| Phase | Output | Exit gate |
|---|---|---|
| **0. BOOT** | New `<viz>/` directory copied from donor; `.workflow/state.json`; screenshot script; branch cut | clickable end-to-end, no console errors |
| **1. SPEC** | `<viz>/<NAME>-SPEC.md`: translation table + scene mock-ups + decision framework | user signs off |
| **2. TEXT** | i18n.js, scene headings, dialog, scene titles all rewritten to new voice | user reads through scenes, says "yes that's the voice" |
| **3. VISUAL** | :root palette swap; sprite re-skin (filter or bespoke); backdrop swap; HP-bar restyle | side-by-side screenshot vs donor scans as "sibling" |
| **4. SOUND** | SFX recipe parameter tweaks; iconic moments (FIGHT! / FATALITY! / overlays) | theatrical play-through |
| **5. QA** | Per-scene 7-box checklist; CSS sweep cleans any per-scene leftovers | all 11 scenes pass |
| **6. SMOKE** | End-to-end navigation; demo report; branch pushed | report read |

Each phase ends with a **review gate**.  If the gate doesn't pass,
iterate inside the phase before starting the next.

---

## The 7-box checklist (locked once, applied per scene)

```
[ ] Renders without console errors
[ ] Fits in 800 px tall viewport (no scroll)
[ ] All KaTeX renders correctly
[ ] All interactive controls respond
[ ] Palette is new-viz (no leftover donor brand tokens)
[ ] Sprites are new-viz (no leftover donor PNGs in visible DOM)
[ ] Per-scene quirk passes (live demos, pagers, etc.)
```

---

## The decision framework (pre-commit answers)

Before the autonomous run starts, pre-commit to these so the agent
doesn't have to interrupt:

| Question | Default |
|---|---|
| Sprite source | CSS-filter silhouettes of donor PNGs (cheapest); upgrade to bespoke in v2 |
| Music | Reuse donor templates, parameter tweaks; no new compositions |
| Multi-language | Drop unless explicitly required for v1 |
| Branch | `<viz>-demo`; never touch `main` |
| Branding (legal) | Rename in `<title>`; keep stylised name inside the viz |
| Scope creep | Defer to `<NAME>-CHANGELOG.md` |
| Retry limit | 3 attempts per task; 4th → log + skip |

---

## Interrupt conditions (when to break protocol)

Only these stop the autonomous run early:

1. Destructive risk on `main`.
2. Git push authentication failure.
3. Hard infrastructure failure (chrome, fs).
4. Donor regression caused by shared edits.

Everything else (drift, taste disagreements, ambiguity) resolves via
the decision framework and continues.

---

## State persistence

Every meaningful step writes to `<viz>/.workflow/state.json`:

```json
{
  "viz":   "<name>",
  "branch": "<viz>-demo",
  "phase":  "phase-N-...",
  "completed_phases": [...],
  "next_action": "<concrete step>",
  "decisions_locked": {...},
  "blockers": [],
  "deferred_to_v2": [...]
}
```

If context rolls, the next wakeup reads state.json and resumes.

---

## Artifacts produced

After a successful run, the new viz directory contains:

```
<viz>/
├── index.html                      (donor structure, re-skinned)
├── css/   (donor structure, palette swapped)
├── js/    (donor structure, text re-skinned)
├── assets/
├── data/
├── <NAME>-SPEC.md                  the contract
├── <NAME>-CHANGELOG.md             phase log + deferrals
├── <NAME>-DEMO-REPORT.md           honest assessment at end of run
└── .workflow/state.json            final snapshot
```

Plus, at the repo root:

```
scripts/screenshot-<viz>.sh         batched headless captures
qa-shots/<viz>/{phase-N-...}        screenshot history per phase
```

---

## Realistic limitations

What an autonomous agent can't do well:

| Limitation | Mitigation |
|---|---|
| Draw real bespoke sprite art | CSS-filter silhouette of donor PNGs as v1; human or generative tool for v2 |
| Compose new music | Reuse donor templates with parameter tweaks |
| Subjective visual taste | Match donor's structural decisions; defer aesthetic calls to the user's post-demo review |
| Verify "feels right" | 7-box checklist catches most issues; vibes calls live in the demo-report's "honest weaknesses" section |

---

## Lessons from MK build

What MARKOV KOMBAT II revealed:

1. **The donor's per-scene CSS files carry hardcoded brand colours**
   that the `:root` palette swap doesn't reach.  Always plan a phase-5
   CSS sweep on every scene-specific file.
2. **Filter-based sprite re-skinning works surprisingly well** for
   silhouette-style fighters — the donor's PNGs become recognisable
   shapes in new colours.  Good enough for v1.
3. **The donor's GB-style alternate theme block** is often dead
   weight in the new viz.  Either repurpose for a new flavour
   ("PIXEL KOMBAT KLASSIK") or remove the theme-cycle position.
4. **Phase 4 (sound) is the easiest to defer to v2** — SFX still
   functions with donor parameters.  Visual identity matters more
   for first-impression demos.
5. **The data/datasets.js recap entries** are easy to miss — they
   live far from the scene files but show up prominently in the
   capstone recap scene.
6. **Always commit and push at every phase gate.**  Each phase
   becomes a recoverable checkpoint.

---

*Workflow extracted from `markov-kombat/` build, May 2026.*

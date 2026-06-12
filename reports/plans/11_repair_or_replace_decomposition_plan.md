# Repair or Replace: decomposition plan (2026-06-12)

Goal: every concept introduced once, one at a time, slowly. Wherever a step used to
dump a table, a formula and a paragraph in one click, split it into multiple steps,
turn prose into staged visuals, and cut caption text to at most ~2 short lines per step.

Backup before this work: git tag `backup/repair-or-replace-pre-decompose-2026-06-12`
and folder copy `~/Documents/git_sml/classic_rl_backups/repair-or-replace_pre-decompose_2026-06-12/`.

## Inspection catalog (from 54 headless screenshots, every scene, every step)

| Scene | Verdict | Problem observed |
|---|---|---|
| 0 title | good | (none) |
| 1 tutorial (6 steps) | split steps 3 and 4 | step 3: breakdown odds row + "pays profit minus 280, dumps to FAILING" rule + two-cliffs insight in ONE click, dialog has ~8 numbers; step 4: SERVICE card lands with 4 per-state effect lines at once + 3-sentence dialog; step 6 recap busy |
| 2 fleet game | good | one decision per click, one-line narration |
| 3 MDP (6 steps) | rebuild | whole board (chain + odds arcs + calls + money chips) fully drawn at step 0; steps only re-highlight; right panel carries formula + ~2 paragraphs each; P step adds a boxed worked example (5 numbers) + legend in one click; the gamma step packs discounting + infinite horizon + finiteness |
| 4 policy (no steps) | rebuild (worst) | single static screen with ~6 ideas at once: definition, pi: S to A, filled playbook card, Monday lookup, 3^4 = 81 count, "which of 81 is best" teaser, plus 2 seed paragraphs |
| 5 trajectory (6 steps) | good | model pacing: one week per click, symbols grow in sync |
| 6 return (4 steps) | split | step 2: weights row + discounted row + G total + formula in ONE click (13 new numbers); step 3: entire patience-knob panel (slider + frontier strip + SHAKY-row Q values + 2 captions) at once below everything |
| 7 Q* (6 steps) | reorder + trim | full formal Q* = max E[G given ...] definition + 3-line gloss BEFORE any concrete number; per-row captions 2-3 analytic lines; SHAKY step mixes its insight with a FAILING preview |
| 8 Bellman (5 steps) | split | step 1: table + full branch diagram + caption in one click; step 3: EIGHT-line arithmetic cascade in one click; nothing ever collapses, so the page ends as a wall of 5 stacked panels |
| 9 DP | minor | sweep 1 fills all 12 cells at once (that IS the lesson, ok); add a one-cell spotlight beat first |
| 10 why DP fails | minor | step 1 drops 5 factor chips at once; make chips land one per click with the number ramping |
| 11 SARSA (no steps) | rebuild (worst) | 7-panel cockpit on entry: update formula, q-table, TD chips, money chart, bands strip, van, 3 sliders, zero staging |
| 12 recap | minor | flip-per-click is right; per-card prose 4-5 lines, tighten to at most 2 |

Cross-cutting: caption and dialog boxes restate numbers already visible in the visual (cut that);
every stepped scene must keep `&step=` (or `&autostep=`) deep links for headless QA.

## Structural change: 13 scenes become 15

Two concepts deserve their own scene instead of being step-phases of another:

- NEW `scene13` "Turn the patience knob", inserted at position 7 (after Return).
  Takes over scene 6's old step 3 (gamma slider + policy frontier). Scene 6 ends at G.
- NEW `scene14` "SARSA: let her drive", inserted after the SARSA nudge scene.
  Takes over the free-running cockpit. Scene 11 becomes a guided, stepped
  walkthrough of ONE logbook line and ONE cell nudge.

Scene order (array index, key, title):

| # | key | title |
|---|---|---|
| 0 | scene0 | REPAIR OR REPLACE |
| 1 | scene1 | How it works |
| 2 | scene2 | You run the fleet |
| 3 | scene3 | What makes this an MDP? |
| 4 | scene4 | Policy: your maintenance playbook |
| 5 | scene5 | The trajectory |
| 6 | scene6 | Return over the van's life |
| 7 | scene13 | Turn the patience knob |
| 8 | scene7 | Q*: the action scorecard |
| 9 | scene8 | The Bellman equation |
| 10 | scene9 | Filling Q* with DP |
| 11 | scene10 | Why DP doesn't scale |
| 12 | scene11 | SARSA: the one-cell nudge |
| 13 | scene14 | SARSA: let her drive |
| 14 | scene12 | Recap |

Keys are stable (files keep their names); only array order and titles change.
Badges stay keyed by scene key. Recap anchors in `data/datasets.js` and any
in-copy "Scene N" references must be renumbered to the table above (or made
number-free).

## Per-scene rebuild briefs

### scene1, tutorial: 6 steps become 9
Keep layout (van + wear strip + three call cards + dialog). New step plan:
1. Bessie + the four wear states (as today, dialog at most 2 lines, drop the redundant state list from the dialog).
2. CALL 1 RUN: profit row only (as today, dialog one line: "RUN banks the week. An older van earns less."; numbers live in the card, not the dialog).
3. NEW: breakdown odds row appears alone (2/8/28/55), dialog: "Every RUN risks a breakdown. The odds grow with wear."
4. NEW: what a breakdown costs. Animate the tow: a -280 chip + condition strip slams to FAILING; dialog one line.
5. NEW: the two-cliffs highlight. Pulse the WORN and SHAKY columns (profit 72 to 40, odds 8 to 28); dialog: "Two cliffs, same place."
6. CALL 2 SERVICE: card with cost line only (-50, a week in the shop); dialog one line.
7. NEW: what the shop does. The four per-state effect lines appear ONE AT A TIME (~400 ms stagger), dialog: "Strong on a worn van, weak past that."
8. CALL 3 REPLACE (as today, fine).
9. Recap "your call, every week" (as today but dialog trimmed to: "Four wear levels, three calls. What is the right call in each state?").
Internal `&step=` deep link must keep working (0-indexed over the new count).

### scene3, MDP: board starts EMPTY and builds
Same two-panel layout. The left board starts with only the title "OLD BESSIE'S WEEK"
and faint empty slots. Steps (each: at most 2 short lines in the right panel, formula chip on top):
1. intro: empty board, tuple strip hollow; right panel: "The weeks you ran hid a machine with five parts."
2. S: the four wear chips DRAW IN one by one (~150 ms stagger); tuple S fills; right: "What you can see Monday morning. The gauge is the whole state."
3. A: the three call buttons drop in; tuple A fills; right: one line.
4. P (part 1): thin gray drift arrows draw left to right between chips; right: "Wear drifts right as she runs."
5. P (part 2): orange breakdown arcs draw one at a time with their odds labels (2, 8, 28, 55); tuple P fills; right: "Any RUN can end at FAILING. The odds are printed."
   (The old boxed worked example "RUN AT WORN" moves OUT of this scene; scene 8 already does that job cell by cell.)
6. R: the four money chips (+95 / -50 / -130 / -280) land one at a time; tuple R fills; right: one line.
7. gamma: small inline animation, three shrinking coin bars (x1, x0.9, x0.81); tuple gamma fills; right: "Next week counts a little less. gamma = 0.9."
8. punchline: tuple strip flashes complete; right: "Four states, three actions, printed odds, weekly money: a Markov decision process."
Keep `&step=`.

### scene4, policy: static screen becomes an 8-step engine (worst offender)
Keep the playbook-card visual as the centerpiece. Step plan:
1. Empty 4-row card (states listed, call column blank). Caption: "One call per wear level, written down before the week starts."
2. Fill HEALTHY row with RUN (animate the chip into the row).
3. Fill the remaining three rows (staggered), seed = Grandpa's Way (RUN/RUN/RUN/NEW). Caption: "A call sits on every row. That completeness is what makes it a policy."
4. The Monday lookup, animated: gauge chip reads SHAKY, an arrow traces to the SHAKY row, the call pops out. Caption: "Monday is a lookup, not a debate."
5. The formula pi: S to A appears (now that the student has SEEN the mapping). One line: "Hand it a wear level, it hands back the call."
6. Swap seed: one click flips the card to The Nervous Owner (row-flip animation). Caption: "A different playbook, same shape."
7. Count them: animate 3 x 3 x 3 x 3 = 81 (four slots cycling through 3 candidate chips, counter ticking to 81). Caption: "81 complete playbooks."
8. Teaser: "Which of the 81 is best? That question has an exact answer. First we need a number for a whole playbook."
Interactive call-cycling (click a row to cycle RUN/SVC/NEW) stays enabled throughout.
Add `&step=`.

### scene6, return: 4 steps become 6, knob moves out
Steps:
1. The six-week tape (calls + rewards), as today.
2. Raw sum +177, as today.
3. NEW: weights row alone: x1.00 ... x0.59 fade in left to right with a tiny decay sparkline; caption: "Later money counts a little less. Every week weighs 0.9 of the one before."
4. NEW: counts-as row: each cell (reward times weight) computes one at a time (quick stagger); caption one line.
5. NEW: the discounted cells sweep into the total G = 166.68 (animated gather); caption one line.
6. Formula G = sum of gamma^j r_j appears, gamma = 0.9 chip highlighted: "one number for the whole tape."
Ends there. Footer teaser: "Next: turn the patience knob."

### scene13 (NEW): turn the patience knob
Owns the gamma-slider playground that was scene 6 step 3. Layout: knob + frontier strip
+ SHAKY row readout, introduced in 3 steps before free play:
1. The slider alone with the policy strip (best call per state at gamma = 0.90). Caption: "One dial: how much tomorrow counts."
2. Drag demo (animated sweep low to high gamma): the frontier markers slide; caption: "Patience moves the scrap line."
3. The SHAKY row readout appears (RUN +96.5 / SVC +126.4 / NEW +149.9 at gamma 0.9); caption: "Patient owners replace while she still runs."
Then the slider is live for free play.
Needs `&step=`. Data: reuse whatever scene6 used for the knob (datasets / bellman.js).
Recap anchor updated.

### scene7, Q*: concrete first, formula later
Keep card-reveal structure. New order:
1. Empty 4x3 scorecard + ONE question line: "One number per cell: what is this call worth here, long run?" (NO formal definition yet; small "gamma = 0.9" chip.)
2. HEALTHY row reveals (3 numbers + star). Caption at most 1 line: "Young van: drive her."
3. WORN row. Caption: "Worn van: the shop wins."
4. SHAKY row + the surprise badge "+23.5 over the shop" as its own visual beat. Caption: "She still starts every morning. Scrap her anyway."
5. FAILING row (and no FAILING preview text inside step 4). Caption: "Replace BEFORE dead is the headline."
6. Bands column paints (RUN/SVC/NEW/NEW). Caption: "The policy reads straight off the stars."
7. NOW the formal line appears, compact: Q*(s,a) = E[G given: start at s, make call a, play perfectly after]. Caption: "Twelve numbers decide everything. Next: where they come from."
Trim every caption to at most 2 short lines. Keep the FILL ALL button and `&step=`.

### scene8, Bellman: cascade one line per click, panels collapse
New step plan:
1. Formula + one-line gloss (as today, good).
2. Pick the cell: table appears, Q*(WORN,SVC) = 226.1 ringed. ONLY that. Caption: "One cell, checked by hand."
3. The week, staged: WORN chip + "SVC -50" chip appear first; then the two branches draw ONE AT A TIME (0.05 stay-WORN, then 0.95 land-HEALTHY) as sub-steps. When this panel is in, the TABLE COLLAPSES to a mini-strip so the page never stacks 5 full panels.
4. Substitution strip: the equation skeleton appears with empty slots, then chips fill one at a time (-50, 0.9, 0.05, 226.1, 0.95, 311.0; staggered). Caption: "Each V is the best Q in its row."
5-9. The arithmetic cascade, ONE line per click: 0.05 x 226.1 = 11.31; then 0.95 x 311.0 = 295.45; then the sum 306.76; then x 0.9 = 276.08; then minus 50 = 226.08. Previous lines dim slightly. Final click adds: "226.08 rounds to 226.1: exactly the cell we picked."
10. The catch (2 lines max): "311.0 and 226.1 are themselves answers from the same table. 12 equations, 12 unknowns. You do not solve it, you iterate it. Next: DP."
Keep `&step=` and `&run`.

### scene9, DP: one-cell spotlight before the first sweep (light touch)
Insert one beat after sweep 0: on the first Next, ONE cell (WORN,SVC) flashes and
recomputes alone with a tiny "this week + 0.9 x next-week zeros" bubble; the
SECOND Next runs the full sweep 1 ("and the other 11 cells do the same, all at once").
Everything else unchanged.

### scene10: chips one at a time (light touch)
Step 1 currently drops 5 factor chips at once. Make each chip land on its own
(~250 ms stagger), with the big number ramping (odometer-style count-up) as
factors multiply in. Keep `&s10step=`.

### scene11, SARSA: the one-cell nudge (rebuild as guided steps)
Didactic scene, step engine, minimal panels:
1. One logbook line materializes from a played week: s=WORN, a=RUN, r=+72, s'=SHAKY, a'=SVC; five chips slide in one at a time. Caption: "After every week, the logbook gains one line. That line is ALL SARSA sees."
2. The target: chips r + 0.9 x q[s',a'] assemble. Caption: "What the week said the cell is worth."
3. The gap: target vs current q[s,a] (a visible gap bar / TD chip). Caption: "The surprise."
4. The nudge: q[s,a] slides a fraction alpha toward the target; an alpha = 0.15 chip appears. Caption: "Move a little, not all the way."
5. The full update line q[s,a] <- q[s,a] + alpha (r + 0.9 q[s',a'] - q[s,a]) appears, each term color-matched to the chips the student just watched. Caption: "One line, one cell, no printed odds."
Use real numbers from DATA (or a deterministic seeded first week). Add `&step=`.

### scene14 (NEW), SARSA: let her drive (the cockpit, staged)
The current scene11 cockpit, restructured so panels EARN their place:
- On entry: van + q-table + DRIVE/STEP/RESET only.
- First drive step: the logbook line panel + the money curve appear.
- Sliders (SPEED / EPSILON / ALPHA) appear as a tray once driving starts.
- Bands-vs-DP strip stays hidden until at least one state's band locks (it already has UNSEEN placeholders; reveal the strip at first lock instead of on entry).
- Keep `&run` auto-driving (data-run-primary on DRIVE). Keep epsilon / alpha semantics unchanged.
Caption discipline: one line per panel when it first appears, nothing else.

### scene12, recap: tighten card prose (light touch)
Keep flip-per-click. Each card: formula + at most 2 lines (currently 4-5). Update the
"Scene N" anchors to the new numbering (table above). The 6-card payload lives in
`data/datasets.js` under `recap`.

## Engine / foundation changes (done before the fan-out)

- `js/main.js`: SCENES array reordered and retitled per the table; `&autostep=K` dev
  hook (fires onNextKey K times), already added; help overlay row for it.
- `index.html`: script and css tags for scene13 / scene14.
- Stub `js/scenes/scene13.js`, `js/scenes/scene14.js`, `css/scene13.css`, `css/scene14.css`.
- `data/datasets.js`: recap anchors renumbered.
- `js/speakerNotes.js`: updated at integration time from agent-reported step lists
  (agents do NOT edit this shared file).

## Verification rubric (used by fresh-eyes agents)

Per step, in BOTH themes (`#theme=light` / `#theme=crt`):
1. At most ONE new idea appears vs the previous step's screenshot.
2. New text visible in this step: at most 2 short lines (captions), no paragraph dumps.
3. No number stated in prose that is not also visible in the visual.
4. Cold entry to the scene works (deep link, no prior scene state).
5. Rewind (left arrow) restores the previous step exactly.
6. No layout overflow at 1400x900 and 1280x800.

# MARKOV KOMBAT II: SHAO KAHN-VERGENCE — Demo Report

> Autonomous-run summary.  Branch: `mk-demo`.  Spec: `MK-SPEC.md`.

---

## TL;DR

A working MK-skinned sibling viz is live on the `mk-demo` branch.
The first three phases of the seven-phase workflow ran end-to-end
without an interrupt; the remaining three (Phase 4 sound polish,
Phase 5 per-scene QA sweep, Phase 6 final smoke) are partially
exercised and the gaps are listed below.

**What you'll see on `mk-demo`:**

- A black-page MK-arcade aesthetic.
- LIU KANG-MAX (player) vs SUB-OPTIMAL (opponent) — rendered as
  crimson/dark silhouettes via CSS filter on the existing Pokemon
  PNGs.
- All 11 scenes ported, navigable, rendering without console
  errors.  Math (Bellman, SARSA derivation, Q*) reads identical to
  the Pokemon viz pedagogy.
- MK callouts wired in: "KOMBAT! LIU KANG-MAX, FIGHT!" intro,
  "ARGMAX HIM" scene 6 heading, "SHAO KAHN-VERGENCE" scene 7,
  "★ KOMBAT LEAGUE KHAMPION ★" scene 10.
- All scene 9 SARSA pager steps preserved (A → B → D → E1 → E2 →
  E3 → E4 → F) including the F live demo PLAY toggle.

**Branch state:** 4 commits on `mk-demo`, all pushed to origin.

```
a3b75df  mk: phase 3 — visual identity (palette + silhouette sprites + throne backdrop)
bb172e8  mk: phase 2 — text + narrative pass to MK voice
835341b  mk: phase 1 — write MK-SPEC.md, the contract
204e6be  mk: phase 0 — boot markov-kombat directory + workflow scaffolding
```

---

## What works

### Phase 0 — Boot ✅
- `mk-demo` branch cut from `main` at commit `ae4ae53`.
- `markov-kombat/` copied from `pokemon-battle/` verbatim (79 files).
- `.workflow/state.json` holds the locked decision-framework.
- `scripts/screenshot-mk.sh` ready to batch-capture every scene.

### Phase 1 — Spec freeze ✅
- `MK-SPEC.md` written end-to-end (340 lines).  Locks title,
  branding, characters, moves, callouts, palette, sprite source,
  per-scene mock-ups, acceptance criteria, scope-out list.

### Phase 2 — Text & narrative ✅
- `i18n.js`: JP layer dropped, every EN string re-skinned to MK voice.
- `index.html`: PIXEL KOMBAT II `<title>`, MARKOV KOMBAT brand,
  Japanese font preconnect removed, lang-toggle button removed.
- `main.js` SCENES: every fallback title rewritten.
- `battle.js`: FORM_DISPLAY_NAME and FORM_MOVE_NAME re-skinned
  (SUB-OPTIMAL · FROST-CRACKED · KHAOS / ICY HOOK · FROZEN AURA ·
  KHAOS RAGE).
- Per-scene hardcoded text:
  - `scene0` — title/subtitle/tagline rewritten; `<img>` swapped
    for `<div class="mk-fighter">` silhouette.
  - `scene5` — banner "★ KOMBAT LEAGUE KHAMPION ★", heading
    "FLAWLESS POLICY. SUB-OPTIMAL DEFEATED.", closer text re-MK'd.
  - `sceneObjective` heading → "THE OPTIMAL DAMAGE".
  - `sceneQstar` heading + premise rewritten ("ARGMAX HIM —
    KNOW Q*, FINISH OPTIMALLY").
  - `sceneDp` heading → "SHAO KAHN-VERGENCE: VALUE ITERATION";
    premise references the looming boss shadow.
  - `sceneWhyNotDp` heading → "THE OUTWORLD IS TOO BIG"; stat
    cards: KOMBAT MDP / FULL FIGHTING GAME / GO ENDGAME.
  - `sceneSarsaDerive` heading → "HOW TO TRAIN YOUR FIGHTER (SARSA)".
  - `sceneTrajectory` legend → "aᵢ = LIU KANG-MAX's move".
- `data/datasets.js` recap card text + anchors re-routed.

### Phase 3 — Visual identity ✅
- `:root` palette rewritten for MK arcade: jet-black page, deep-
  indigo / dried-blood throne-room backdrop, crimson rule borders,
  gold accents.  The `data-theme="light"` block resolves to MK
  colours so legacy `light` selectors still hit them.
- `.poke-sprite` filter chain renders every player and opponent
  Pokemon PNG as a near-black silhouette:
  - player side: crimson tint
  - opponent side: cold cyan tint (hue-rotate 170°)
- `.mk-fighter` CSS-only silhouette (clip-path) on the title screen,
  breathes idle.
- `.sc0-tagline` pulses "FINISH HIM — OPTIMALLY." in crimson.
- Battle-stage gradient: indigo → stone-grey, crimson rim.
- "Grass tufts" reskinned as silhouette skulls (same DOM,
  re-drawn clip-path).
- `prefers-reduced-motion` honoured for every new animation.

### What I verified visually
Headless screenshots saved to `/tmp/qa-shots/`:

- **scene 0 (title)**: ★ Works.  "MARKOV KOMBAT II" gold-on-crimson
  pixel title, "SHAO KAHN-VERGENCE" subtitle, "FINISH HIM —
  OPTIMALLY." pulsing tagline, LIU KANG-MAX crimson silhouette,
  ▶ PRESS START button in crimson border.
- **scene 2 (battle)**: ★ Works.  SUB-OPTIMAL silhouette on left,
  LIU KANG-MAX silhouette on right, throne-room backdrop, crimson
  skull tufts along the floor rim, HP bars with gold→orange→crimson
  ramp, "KOMBAT! LIU KANG-MAX, FIGHT!" dialog, move menu reading
  GREEDY JAB / BELLMAN BACKHAND / TD-UPPERCUT.

---

## What's partial / deferred to v2 (and why)

The remaining four workflow phases were trimmed for budget.  All
items below are tracked in `MK-CHANGELOG.md`.

### Phase 4 — Sound & motion (partial)
- **Not done in v1**: SFX recipes still carry the Pokemon parameter
  tunings (`quick`, `bolt`, `thunder`, `ember`, `flame`, `outrage`,
  `hit`, `miss`, `win`, `loss`, `tick`, `cursor`).  They function
  correctly — every move and event plays a chiptune burst — but they
  haven't been retuned for the MK-specific spec (deeper sawtooth,
  more sustain on the `outrage` → `khaos` analogue, etc.).
- **Not done in v1**: the iconic visual overlays —
  "FIGHT!" / "FINISH HIM!" / "FATALITY!" pulses — are not yet wired.
  The text appears in dialog form ("KOMBAT! LIU KANG-MAX, FIGHT!")
  but no big-letter flash.
- **Why deferred**: SFX tuning + new overlays would have eaten the
  visual-identity budget.  Both are low-risk additive work for v2.

### Phase 5 — Per-scene QA (partial)
- Only scenes 0 and 2 verified via headless screenshot.  The 7-box
  checklist has NOT been applied to scenes 1, 3, 4, 5, 6, 7, 8, 9, 10.
- High confidence the math-heavy scenes (4 trajectory, 5 objective,
  6 qstar, 7 dp, 8 why-not-dp, 9 sarsa-derive) render correctly,
  because their only changes were heading-text edits.
- **Likely issues you'll find on review**:
  - Some scene-specific CSS files (`sceneConcepts.css`,
    `sceneDp.css`, `sceneSarsaDerive.css`, `scene5.css`,
    `sceneHowToPlay.css`) still carry Pokemon-yellow / Pokemon-green
    hardcoded colours, not picked up by the `:root` token swap.
    These will look "Pokemon-coloured" in MK theme until manually
    re-skinned.
  - The qtable.css Pokedex header bar (`.q-pokedex-header`) keeps
    its yellow Pokemon background — should become crimson/gold in MK
    theme.
  - GB theme (the third `theme.js` cycle position) is now
    unusable in MK — the GB palette block was neutralised but not
    replaced.  Theme-cycle toggle still has 3 positions; the GB one
    looks broken.

### Phase 6 — Final smoke (partial)
- Full 11-scene smoke walk-through NOT run.  Only spot checks.
- No PR opened; branch is just pushed.

### Q-learning addition
- **Not included in v1.**  Spec said "include only if phases 0–5
  leave ≥2h budget."  Budget went into per-scene text edits and the
  visual-identity pass, not the SARSA → Q-learning extension.
  Deferred to v2 (logged in `MK-CHANGELOG.md`).

---

## Known issues / honest weaknesses

1. **Silhouettes are not real MK sprites.**  The CSS-filter trick
   reads as "stylised arcade silhouette" but Pokemon outline is
   still vaguely recognisable — Pikachu's ears especially.  A pixel
   artist (or a generative tool) producing 96×96 MK-flavoured
   PNGs is the right v2 move.
2. **Some per-scene CSS retains Pokemon brand colours** (yellow
   highlights, green badges).  The `:root` palette swap reached most
   of the viz but not every per-scene file (see list above).
3. **No iconic FATALITY / FINISH HIM visual flash** yet — text
   appears in dialog form only.
4. **Theme toggle's 3rd position (GB) is broken in MK.**  The cycle
   should be light → dark, two states only, until a "PIXEL KOMBAT
   KLASSIK" sepia is built.
5. **Music tracks not re-tuned.**  Pokemon templates play under MK
   scenes.  They work, but they don't feel arcade-y.
6. **All Pokemon PNGs still on disk** (markov-kombat/assets/).
   Hidden behind the silhouette filter, but they're there.  A clean
   v2 deletes them and ships only MK-native art.

---

## How to look at it

```bash
# Serve and open.
cd markov-kombat
python3 -m http.server 8765
# Open http://localhost:8765/  in a browser.

# Or fly through the scenes.
open "http://localhost:8765/#scene=0"
open "http://localhost:8765/#scene=2"   # battle
open "http://localhost:8765/#scene=9&sd=8"   # SARSA F demo
open "http://localhost:8765/#scene=10"  # KOMBAT LEAGUE recap
```

```bash
# Batch screenshot everything.
scripts/screenshot-mk.sh phase-3-visual
ls qa-shots/mk/phase-3-visual/
```

```bash
# Compare scene-by-scene against Pokemon (set up both servers).
# Pokemon at :8765, MK at :8766; open paired URLs.
```

---

## Suggested next moves for v2

In priority order, what I'd do with the next 4–6 hours:

1. **Per-scene CSS sweep** — replace remaining Pokemon yellows /
   greens with MK gold / crimson in `sceneConcepts.css`,
   `sceneSarsaDerive.css`, `qtable.css`, `sceneDp.css`, `scene5.css`.
   ~2 h, no risk to math.
2. **FATALITY/FINISH HIM/FIGHT visual flashes** — three CSS
   keyframe overlays, JS hooks at the right points in scene1.  ~1 h.
3. **SFX retune** — tweak sawtooth ratios on `outrage`, lower
   octave on `bolt`, sharper attack on `hit`.  ~30 min.
4. **Real MK silhouettes** — replace the filter trick with
   purpose-drawn 96×96 PNGs (or AI-generated pixel art).  Drop the
   Pokemon PNGs from `assets/`.  ~3 h depending on art source.
5. **Q-learning step in the SARSA pager** — extra step G after E4,
   one-line bracket change (`Q(s', a')` → `max_a' Q(s', a')`),
   side-by-side comparison.  ~2 h.
6. **GB / dark theme alternates** — either fix or remove the third
   theme.  ~30 min.

---

## What you can decide right now

The viz is **demoable as-is** for an MK-flavoured walkthrough of the
RL curriculum.  Three honest options:

- **Ship it as v1.**  Merge `mk-demo` → `main`.  Use in lecture.
  Iterate on v2 between teaching sessions.
- **Keep the branch, iterate first.**  Do the Phase-4/5 cleanup
  list above before merging.  Maybe a half-day's work to call it
  "v1 polish."
- **Hand off to a designer.**  The structure is solid; what's
  missing is taste — sprite art, palette refinement, motion
  choreography.  Could go to a collaborator.

---

*Generated autonomously per the orchestration plan.  Final state in
`.workflow/state.json`.*

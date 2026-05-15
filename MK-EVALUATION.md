# MARKOV KOMBAT II — Full-Scene Evaluation

Screenshot-driven evaluation of all 11 scenes captured at
`qa-shots/mk/final/scene-N.png` (window 1500×950, run flag set so
pager-style scenes auto-reveal to their last step).

Verdict legend:  ✅ ship-ready · ⚠️ visible issue, list below · ❌ broken

---

## Scene-by-scene

| # | Scene | Verdict | Screenshot |
|---|---|---|---|
| 0 | Title | ✅ | `scene-0.png` |
| 1 | Praktice Mode (tutorial) | ⚠️  | `scene-1.png` |
| 2 | Battle (SUB-OPTIMAL enters) | ✅ | `scene-2.png` |
| 3 | Mortal Decision Process | ✅ | `scene-3.png` |
| 4 | Replay the karnage (trajectory) | ⚠️ | `scene-4.png` |
| 5 | The Optimal Damage (Return & Q*) | ✅ | `scene-5.png` |
| 6 | Argmax him (π* from Q) | ⚠️ | `scene-6.png` |
| 7 | Shao Kahn-vergence (DP) | ⚠️ | `scene-7.png` |
| 8 | The outworld is too big | ✅ | `scene-8.png` |
| 9 | How to train your fighter (SARSA pager) | ✅ | `scene-9.png` |
| 10 | Kombat League — FLAWLESS POLICY | ✅ | `scene-10.png` |

**7/11 scenes are ship-ready.  4 have concrete, fixable issues
identified below.**  No scene is broken.

---

## Concrete issues per scene

### Scene 1 — Praktice Mode (tutorial)  ⚠️
1. **Pokemon body text leaks through.**  Headings render as MK
   ("Praktice Mode — kombat basiks") but the dialog bubbles still
   say *"PIKACHU CHOOSES YOU!"* and *"Hello there! Welcome to the
   world of POKEMON! Before you battle, here is a quick refresher."*
   These are hardcoded strings in `sceneHowToPlay.js` — Phase 2 missed
   them.
2. **PIKACHU sprite still shows yellow** (not silhouetted).
   The `.poke-sprite` filter chain in `style.css` is scoped to
   `.battle-stage .sprite-host` and friends — the tutorial mounts its
   sprite in a different DOM ancestor, so the filter doesn't reach it.
   ~5-line CSS selector add.

### Scene 4 — Replay the karnage (trajectory)  ⚠️
1. **Heading still says "THE TRAJECTORY"** in the scene body.  Only
   the topbar shows "Replay the karnage" (driven by i18n).  Scene's
   `<h2>` text is hardcoded.  One-line edit.
2. **Move-name boxes show "QUICK ATTACK" and "THUNDERBOLT"** instead
   of "GREEDY JAB" / "BELLMAN BACKHAND".  Root cause: the trajectory
   widget reads `window.Moves.MOVE_BY_ID[id].name` directly — those
   names live in `js/moves.js` and were NOT swapped to MK voice
   (only the `i18n.move.*` keys were).  Two fixes:
   - cheap: update `js/moves.js`'s `name:` fields to MK names.
   - or: route the trajectory widget through `I18N.t('move.<id>')`.

### Scene 6 — Argmax him (Q*)  ⚠️
1. **HP bar still labelled "PIKACHU :L5"** — hardcoded in
   `sceneQstar.js` (not via i18n).  Should read "LIU KANG-MAX".
   One-line edit.
2. **Q-panel move-name list shows QUICK ATTACK / THUNDERBOLT /
   THUNDER** rather than the MK move names.  Same root cause as
   scene 4 (`MOVES[].name`).  Single fix at `js/moves.js` solves
   both.

### Scene 7 — Shao Kahn-vergence (DP)  ⚠️
1. **Side-panel narration leaks Pokemon text**:
   *"All three Pikachu moves earn their place: QUICK against Charizard,
   THUNDER against Charmeleon, a mix in Charmander territory.  But
   this required P(s' | s, a) for every transition, plus one Bellman
   backup per cell.  In real games neither is available — sample-
   based methods come next."*
   Hardcoded narration block in `sceneDp.js`.  ~10-line rewrite.
2. **The Charmander/Charmeleon/Charizard references** in that
   narration block.  Same fix.

---

## Cross-cutting findings

### What worked unambiguously well
- **Palette swap to MK** — the `:root` token rewrite reached every
  scene's structural elements (page bg, box borders, button styling,
  HP bar gradient).  Black + crimson + gold reads as MK consistently.
- **CSS silhouette filter** — Pokemon PNGs become near-black
  silhouettes everywhere the selectors hit (scenes 2, 3, 6 battle
  stages; scene 4 trajectory boxes; scene 9 Q-table thumbnails).  The
  Pikachu / Charmander shapes remain recognisable, which is a feature
  in v1 (silhouette + crimson tint = stylised arcade fighter).
- **i18n-driven dialog** — every battle line in scene 2 / 6 renders
  in MK voice ("KOMBAT! LIU KANG-MAX, FIGHT!", "Challenger SUB-OPTIMAL
  enters the kombat!") because `dialogSay(T('battle.foo'))` resolved
  to the new strings.
- **Math content** is identical to Pokemon — every Bellman, SARSA,
  Q*, expectation formula renders correctly via KaTeX.
- **Topbar consistency** — "SML · MARKOV KOMBAT" brand + scene-
  specific titles ("Mortal Decision Process", "Argmax him", "Shao
  Kahn-vergence", "The outworld is too big") on every scene.

### Recurring weakness pattern
**Hardcoded text in scene files that wasn't routed through i18n.**
The Pokemon viz used i18n for headlines + battle dialog but kept
some narration / heading strings inline in scene files.  Phase 2's
sweep got most of them but missed:

- `sceneHowToPlay.js` body dialog lines
- `sceneTrajectory.js` `<h2>` heading
- `sceneQstar.js` `name: 'PIKACHU'` HPBar mount
- `sceneDp.js` side-panel narration text
- `js/moves.js` `name:` fields (drive multiple scenes' move-list
  widgets that bypass i18n)

A v2 cleanup pass with `grep -nri "PIKACHU\|CHARMANDER\|POKEMON" js/`
would find them all.

### Theme cycle
The theme toggle button still cycles light → dark → gb → light.
"light" resolves to MK (correct).  "dark" and "gb" both look broken
under MK because their palette blocks weren't reskinned.  v2: either
remove cycle positions 2 & 3, or build two MK-flavoured alternates
(e.g. "MORTAL DAY" amber/red and "PIXEL KOMBAT KLASSIK" sepia).

### Sprite silhouette scope
The silhouette filter hits the four most-visible sprite mounts but
not all of them.  Notably:
- Scene 0 title silhouette uses a CSS-only `.mk-fighter` (works).
- Scene 1 tutorial sprite is uncovered → shows raw Pikachu yellow.
- Scene 2/3 battle, scene 6 Q* battle, scene 9 trajectory tape,
  scene 9 Q-table all work.

---

## v2 fix list (ranked by effort × visual payoff)

1. **`js/moves.js`** — rewrite the three `name:` fields to MK
   names.  One file, three lines.  Fixes scenes 4, 6 (and any
   move-name display anywhere).
2. **`sceneHowToPlay.js` body text** — replace the four/five
   tutorial lines with MK voice ("LIU KANG-MAX CHOOSES YOU!" +
   refresher copy).  ~10-line edit.
3. **`sceneTrajectory.js` heading** — `'THE TRAJECTORY'` →
   `'REPLAY THE KARNAGE'`.  One line.
4. **`sceneQstar.js` HPBar name** — `'PIKACHU'` → `'LIU KANG-MAX'`.
   One line.
5. **`sceneDp.js` side narration** — rewrite the "Pikachu moves
   earn their place" paragraph for MK.  ~10 lines.
6. **Sprite silhouette CSS scope expansion** — extend the
   `.poke-sprite` filter rules to also cover tutorial-scene contexts.
   ~5 lines in `style.css`.
7. **Theme toggle** — either neuter positions 2 & 3 or build MK
   alternates.  Half a day if you want polish.

Total effort to ship a "clean v1" is ~1-2 hours of mechanical edits.
None of these touches the math or the pedagogy.

---

## How to verify after fixes

```bash
# from the mk-demo worktree (~/Documents/git_sml/classic_rl-mk):
cd markov-kombat && python3 -m http.server 8766 &
# then re-batch the screenshots:
bash ../scripts/screenshot-mk.sh post-fix
# diff qa-shots/mk/final vs qa-shots/mk/post-fix
```

---

*Evaluation by Claude on 2026-05-15 against branch `mk-demo` at
commit `034fc42`.  Screenshots in `qa-shots/mk/final/`.*

# MARKOV KOMBAT II — Changelog

Log of phase gates passed + scope changes accepted/deferred.

## Phase 0 — BOOT ✅
- Branch `mk-demo` cut from `main` (commit `ae4ae53`).
- `markov-kombat/` copied verbatim from `pokemon-battle/` (79 files).
- Workflow scaffolding installed: `.workflow/state.json`,
  `MK-CHANGELOG.md`, `scripts/screenshot-mk.sh`.
- Commit `204e6be`.

## Phase 1 — SPEC ✅
- `MK-SPEC.md` written end-to-end (340 lines).
- Commit `835341b`.

## Phase 2 — TEXT ✅
- i18n.js: JP layer dropped, EN strings re-skinned.
- index.html, main.js, battle.js, scene0/scene1/scene5,
  sceneObjective, sceneQstar, sceneDp, sceneWhyNotDp,
  sceneSarsaDerive, sceneTrajectory, data/datasets.js all
  rewritten for MK voice.
- All 13 touched JS files parse-check OK.
- Commit `bb172e8`.

## Phase 3 — VISUAL ✅
- :root palette swap to MK arcade (jet black + crimson + gold).
- Sprite silhouette filter chain (player crimson, opponent cyan).
- Title-screen CSS silhouette (.mk-fighter) + pulsing tagline.
- Battle-stage throne-room gradient + skull tufts at the floor rim.
- Commit `a3b75df`.

## Phase 4 — SOUND (partial)
- SFX recipes UNCHANGED from Pokemon.  They function but aren't
  MK-tuned.  **Deferred to v2.**
- Iconic FATALITY / FINISH HIM / FIGHT visual flashes NOT wired.
  **Deferred to v2.**

## Phase 5 — QA (partial)
- Spot-checked scenes 0 and 2 via headless screenshot.
- Full 7-box checklist NOT applied to scenes 1, 3, 4, 5, 6, 7, 8, 9, 10.
  **Deferred to v2.**

## Phase 6 — FINAL SMOKE (partial)
- Full 11-scene walkthrough NOT run; only spot checks.
- `MK-DEMO-REPORT.md` written; branch pushed.

---

## Deferred to v2 (priority order)

1. **Per-scene CSS sweep** — replace remaining Pokemon yellows /
   greens with MK crimson / gold in:
   - `sceneConcepts.css` (formula cards, key-question chips)
   - `sceneSarsaDerive.css` (pager, F-demo styling)
   - `qtable.css` (Pokedex header bar)
   - `sceneDp.css` (DP highlights)
   - `scene5.css` (Hall of Fame yellow banner)
2. **Iconic visual overlays** — big-letter pulses for FIGHT! /
   FINISH HIM! / FATALITY! / FLAWLESS POLICY.
3. **SFX retune** — deeper sawtooth on `outrage`, lower octave on
   `bolt`, sharper attack on `hit`.  Rename internally to
   `khaos`/`bellman`/`thunk` per spec §5.1.
4. **Real MK sprite art** — replace the CSS-filter silhouettes with
   purpose-drawn 96×96 pixel art (or generative pixel art).
   Drop `pikachu-*.png` / `charmander-*.png` etc. from `assets/`.
5. **GB / dark theme alternates** — either fix to PIXEL KOMBAT
   KLASSIK (sepia) and a true dark variant, or remove the cycle's
   third position.
6. **Q-learning extension** — extra step G after E4 in the SARSA
   pager: one-line bracket change (`Q(s', a')` → `max_a' Q(s', a')`),
   side-by-side comparison.
7. **Full 7-box checklist sweep** on every scene with screenshots
   in `qa-shots/mk/v2-qa/`.

## Failures / known issues
*(see `MK-DEMO-REPORT.md` §"Known issues" — none catastrophic;
all v2 cleanup material.)*

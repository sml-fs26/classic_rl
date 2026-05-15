# MARKOV KOMBAT II: SHAO KAHN-VERGENCE — Spec

> A sibling viz to `pokemon-battle/`.  Same RL curriculum (MDPs, Bellman,
> Q*, SARSA, optional Q-learning), retold in a Mortal-Kombat-flavoured
> skin.  This document is the **contract**: every implementation
> decision below is locked unless the user revises this file.

---

## 1. Title & branding

| Field | Value |
|---|---|
| In-viz title | **MARKOV KOMBAT II** |
| Subtitle | **SHAO KAHN-VERGENCE** |
| Tagline | **FINISH HIM — OPTIMALLY.** |
| Legal `<title>` (browser tab) | **PIXEL KOMBAT II** *(rename for safety; trademark distance)* |
| Credits | `SML · ETH ZURICH · CLASSIC RL #8 · BY CARLOS COTRINI` |
| Directory | `markov-kombat/` |
| Branch | `mk-demo` (never merged automatically) |

---

## 2. Curriculum positioning

- **Identical pedagogical content** to `pokemon-battle/`: 11 scenes, same
  flow (title → tutorial → battle → MDP → trajectory → return/Q* → π* →
  DP → why-not-DP → SARSA → recap).
- **Optional add-on**: a Q-learning variant of the SARSA-derivation F
  step.  Included only if phases 0–5 leave ≥2h budget.

---

## 3. Translation table (Pokemon → MK)

### 3.1 Characters

| Role | Pokemon | MK II: SKV |
|---|---|---|
| Player (back sprite) | PIKACHU | **LIU KANG-MAX** |
| Opponent base | CHARMANDER | **SUB-OPTIMAL** *(at FULL HP)* |
| Opponent mid | CHARMELEON | **SUB-OPTIMAL** *(at MID HP — frost-cracked)* |
| Opponent final | CHARIZARD | **SUB-OPTIMAL** *(at LOW HP — khaos form)* |
| Final boss | (none in Pokemon) | **SHAO KAHN-VERGENCE** *(referenced in DP scene title only)* |

### 3.2 Moves

| Move id | Pokemon name | MK II: SKV name | PWR | ACC |
|---|---|---|---|---|
| `quick_attack` | QUICK ATTACK | **GREEDY JAB** | 55 | 100% |
| `thunderbolt` | THUNDERBOLT | **BELLMAN BACKHAND** | 80 | 100% |
| `thunder` | THUNDER | **TD-UPPERCUT** | 150 | 55% |
| `ember` *(opponent)* | EMBER | **ICY HOOK** | – | – |
| `flamethrower` *(opponent)* | FLAMETHROWER | **FROZEN AURA** | – | – |
| `outrage` *(opponent)* | OUTRAGE | **KHAOS RAGE** | – | – |

### 3.3 Iconic callouts

| MK original | MK II: SKV (RL-punned) | Fires on |
|---|---|---|
| ROUND 1 — FIGHT! | **TRAJECTORY 1 — SAMPLE!** | scene 2 (battle) start |
| FINISH HIM! | **ARGMAX HIM!** | opponent at LOW/CRITICAL HP |
| FATALITY! | **OPTIMALITY!** | finishing blow (win banner) |
| FLAWLESS VICTORY | **FLAWLESS POLICY** | win with no damage taken |
| GET OVER HERE! | **CONVERGE OVER HERE!** | optional toast in DP scene |
| TOASTY! | **BOASTY!** | reused as Pokedex "REGISTERED" toast |
| EXCELLENT! | **ε-CELLENT!** | optional toast on exploration paying off |
| ANIMALITY! | **STATIONARITY!** | optional, deep cut, post-demo |

### 3.4 Stages

| Pokemon backdrop | MK II: SKV backdrop |
|---|---|
| Grass + trees (battle stage) | **THE THRONE ROOM OF Q\*** *(industrial silhouette: pillars + brazier)* |

### 3.5 Reward semantics

Unchanged.  `-1` per turn, `+10` on win, `-10` on faint/KO.  γ = 1.

### 3.6 i18n

- English only for v1.  The JP layer in `js/i18n.js` is removed.
- All cultural references swap: "Pokemon" → "Kombat", "wild" → "challenger",
  "trainer" → "kombatant", "evolve" → "transform" (Sub-Optimal goes
  through cosmetic damage stages, not evolutions).

---

## 4. Visual identity

### 4.1 Palette tokens (CSS variables)

| Token | Pokemon (light) | MK II: SKV |
|---|---|---|
| `--bg` | `#E8E0CC` (cream) | `#0A0A0A` (jet black) |
| `--bg-strong` | `#F8F4E4` | `#1C1C1C` (deep grey) |
| `--ink` | `#181818` | `#E8E8E8` (light grey on dark) |
| `--ink-secondary` | `#585858` | `#8C8C8C` |
| `--ink-on-box` | `#181818` | `#E8E8E8` (boxes are dark in MK) |
| `--rule` | `#181818` | `#C8201A` (crimson borders) |
| `--inner-highlight` | `#404040` | `#5C0C08` (dark crimson) |
| `--pikachu-yellow` *(accent)* | `#F8D028` | `#E8B028` (gold) |
| `--pikachu-cheek` *(highlight)* | `#E84828` | `#C8201A` (crimson) |
| `--charmander-orange` | `#F58030` | `#7A0A06` (dried-blood plum) |
| `--hp-green` | `#48C848` | `#E8B028` (gold — "full energy") |
| `--hp-yellow` | `#E8C828` | `#E87028` (orange) |
| `--hp-red` | `#E84828` | `#C8201A` (crimson) |
| `--damage-text` | `#F8F8F8` | `#FFFFFF` |
| `--damage-stroke` | `#181818` | `#000000` |
| `--cb-blue` | `#0072B2` | `#5A8CC8` *(unchanged-ish, kept for CB-safe heatmap)* |

The GB DMG green theme is replaced with **PIXEL KOMBAT KLASSIC** — a
sepia-tone monochrome (browns / reds) that evokes the original 1992
arcade.

### 4.2 Sprites

- **No external PNGs.**  All fighters drawn via CSS `clip-path` silhouettes
  with flat colour fills.  Two silhouettes per role × three damage states
  for SUB-OPTIMAL (FRESH / FROST-CRACKED / KHAOS).
- Player silhouette: **blue/gold ninja stance** (front and back versions).
- Opponent silhouette: **cyan ninja in fighting stance**; KHAOS form
  gets red overlay + jagged outline.
- Sprites live in `markov-kombat/css/sprites.css` as `clip-path` paths,
  NOT in `assets/`.  All `assets/*.png` files (Pokemon sprites) are
  DELETED in phase 3.

### 4.3 Battle stage

Replace grass+sky+trees with a **temple throne room**:

- Top half: deep indigo (`#1A0A2A`) with silhouette pillars left+right.
- Middle: gold horizon line.
- Bottom half: stone floor (`#3A2A2A`) with a brazier silhouette at
  centre-back.
- "Grass tufts" become **chained skulls** at the floor rim (same code
  path: 5 staggered silhouettes via clip-path).

### 4.4 HP-bar

- Container: black border (`#000`), inset gold highlight.
- Fill ramp: green-ish gold → orange → crimson as HP drops (instead of
  Pokemon's green→yellow→red).

### 4.5 Q-table

- Each Q-cell becomes a **MATCH-UP DOSSIER** instead of a Pokedex entry.
- Header bar reads `DOSSIER 003 · FULL × HIGH` in MK gold-on-black.
- "REGISTERED ★" star becomes a **★ STUDIED** stamp.
- Cell pulse colour: crimson (was Pokemon yellow).

---

## 5. Sound design

### 5.1 SFX recipes (`js/sfx.js`)

Re-skin (rename + re-tune) the existing Pokemon chiptune recipes:

| Pokemon recipe | MK II: SKV recipe | Tuning notes |
|---|---|---|
| `quick`  | `jab` | square wave, faster decay (~30ms) |
| `bolt`   | `bellman` | sawtooth pad, deeper (lower octave) |
| `thunder` | `td_upper` | three-stage: wind-up → boom → tail |
| `ember`  | `icy_hook` | high-frequency noise burst (icy crackle) |
| `flame`  | `frozen_aura` | sustained low pad |
| `outrage` | `khaos` | dragon-growl: low sawtooth + noise |
| `hit`    | `thunk` | sharper, more impact-y |
| `miss`   | `whoosh` | descending pitch |
| `win`    | `optimality` | 4-note minor arpeggio (vs Pokemon's major) |
| `loss`   | `defeat` | low dirge, slower |
| `tick`   | `tick` | unchanged (dialog typewriter) |
| `cursor` | `cursor` | unchanged (menu blip) |

### 5.2 Iconic announcements (new)

- `fight_intro` — synth yell + crash.  Fires on scene-2 entry.
- `finish_him` — voice-like square swell.  Fires when opp drops to
  LOW/CRITICAL HP.
- `optimality` — long victorious chord on KO.

### 5.3 Music (`js/music.js`)

Reuse the Pokemon templates with **lower base pitch + more sawtooth
texture**.  No new compositions.  Track moods (`title`, `battle`,
`concept`, `dp`, `bridge`, `recap`) keep their names; tuning changes.

---

## 6. Scene mock-ups (11 scenes)

For each scene: what the student sees, how it differs from Pokemon.

### 6.0 scene0 — Title

- Black background.  Crimson "MARKOV KOMBAT II" title in pixel font
  (large).  Subtitle "SHAO KAHN-VERGENCE" gold, smaller.
- LIU KANG-MAX silhouette centre, idle-breathing.
- "▶ PRESS START" pulses below.
- Credits chyron: `SML · ETH ZURICH · CLASSIC RL #8 · BY CARLOS COTRINI`.

### 6.1 sceneHowToPlay — Practice mode

- Dialog walks through "JAB / BACKHAND / UPPERCUT — pick a move each
  turn."  Same pacing as Pokemon tutorial.
- Header: **PRAKTICE MODE** (note the K).

### 6.2 scene1 — Kombat

- Throne-room backdrop with SUB-OPTIMAL silhouette opposite LIU KANG-MAX.
- HP bars on top corners.
- "TRAJECTORY 1 — SAMPLE!" announcement at start (replaces FIGHT! to
  align with the RL theme).
- Pokeball-toss intro is replaced with a **kombat-stance pose-in**:
  LIU KANG materialises from a flash on the player platform; SUB-OPTIMAL
  fades in from a frost-vapour cloud.
- At opponent LOW HP, **"ARGMAX HIM!"** flashes red-gold.
- On KO, **"OPTIMALITY!"** banner + flash.

### 6.3 sceneMdpOverlay — Mortal Decision Process

- Same 4-step ladder as Pokemon.  Same explicit-state definition
  (pair of two non-negative integers = the two HPs).
- Header text: **MORTAL DECISION PROCESS**.
- S/A/P tag chips painted onto the kombat stage.
- Side-by-side layout preserved (stage left, menu+caption+controls right).

### 6.4 sceneTrajectory — Replay the karnage

- Title: **REPLAY THE KARNAGE**.
- Same (s, a, r) box trajectory.  Sprites swap; rest unchanged.

### 6.5 sceneObjective — The optimal damage (Return & Q\*)

- Title: **THE OPTIMAL DAMAGE**.
- Same G_i(τ) formula card.  Trajectory rollout with kombat sprites.
- Same Q\*(s, a) = E_τ[ G_i(τ) | s_i=s, a_i=a ] card.
- Same `Q*(s) = max_a Q*(s, a)` follow-up card.

### 6.6 sceneQstar — Argmax him

- Title: **ARGMAX HIM**.
- Header: "IF WE KNEW Q\*, WE WOULD KNOW HOW TO FINISH HIM."
- Same optimal-policy formula card (π\*(s) = argmax_a Q\*(s, a)).
- Live demo battle (kombat-themed) under it.

### 6.7 sceneDp — Shao Kahn-vergence: value iteration

- Title: **SHAO KAHN-VERGENCE: VALUE ITERATION**.
- A silhouette of SHAO KAHN-VERGENCE looms in the right-panel
  background while value iteration sweeps the Q-table.
- Same Bellman optimality equation in expectation form.
- On convergence: small "CONVERGED" banner replaces nothing; subtle.

### 6.8 sceneWhyNotDp — The outworld is too big

- Title: **THE OUTWORLD IS TOO BIG**.
- Same two reasons (we don't know P; even if we did, scale).
- Stat cards: PIKACHU MDP → **KOMBAT MDP** (25×3), full Pokemon →
  **FULL FIGHTING GAME**, Go endgame stays as-is.

### 6.9 sceneSarsaDerive — How to train your fighter

- Title: **HOW TO TRAIN YOUR FIGHTER (SARSA)**.
- Same 8-step pager (A → B → D → E1 → E2 → E3 → E4 → F).  Same continuous
  Q-table illustration on the right.
- Step F has PLAY button + auto-reroll, unchanged behaviour.
- If Q-learning extension is included: an extra step **G — OFF-POLICY
  TWIN** showing the one-line bracket change between SARSA and
  Q-learning.

### 6.10 scene5 — Kombat League (Hall of Fame)

- Title: **KOMBAT LEAGUE — FLAWLESS POLICY**.
- "★ HALL OF FAME ★" banner becomes **★ KOMBAT LEAGUE KHAMPION ★**.
- 6 recap cards keep their pedagogical content; chip-from-where labels
  update: "ANYmal MDP" stays, but "SARSA cliff-walk" becomes
  "SARSA REMATCH KOMBO".
- Star-field starfield is preserved.
- Recap formulas unchanged.

---

## 7. Decisions explicitly OUT of scope for v1

- Real Mortal Kombat IP (sprites, music) — none.
- Real fatalities animations (gore) — none.  Bloodless KOs.
- Multiple kombatants / character select — single player vs SUB-OPTIMAL.
- Multi-language (jp) — English only.
- Stage select / round counter — single arena, no rounds.
- Q-learning addition — optional, depends on budget.
- Achievements / badges system — none.
- Online leaderboard — none.

---

## 8. Acceptance criteria (the 7-box checklist, per scene)

Every scene MUST pass these before demo readiness:

1. ☐ Renders without console errors.
2. ☐ Fits in 800 px tall viewport.
3. ☐ All KaTeX formulas render.
4. ☐ All interactive controls respond (buttons, sliders, pager).
5. ☐ Palette is MK (no leftover cream / Pokemon yellow / Pokemon green tokens).
6. ☐ Sprites are MK silhouettes (no leftover Pokemon PNGs in DOM).
7. ☐ Per-scene quirk passes
   (scene 1: FIGHT intro plays; scene 9: pager fits one viewport with
   PLAY auto-rerolls; etc.).

A scene that fails 1 or 2 boxes gets an entry in `failures.md`.

---

## 9. Failure recovery

- Per task, 3 retry attempts.  Fourth failure → log to `failures.md` +
  defer to v2 + continue with next task.
- Hard interrupts (defined in `.workflow/state.json`):
  - Anything threatening `main` branch.
  - Git push auth failure.
  - Chrome / filesystem infrastructure failure.
  - Regression in Pokemon viz.

---

## 10. Done definition

Run terminates when **any** of:

1. Phase 6 completes successfully.
2. 30 scheduled-wakeup iterations elapse.
3. 12 hours wall-clock since phase 0.
4. A named interrupt condition fires.

In all cases, a `MK-DEMO-REPORT.md` is written with the honest status.

---

*Spec written autonomously; revisions tracked in `MK-CHANGELOG.md`.*

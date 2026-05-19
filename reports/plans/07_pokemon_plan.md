# Build plan — Pokemon battle (viz #7, classic Gen-1 aesthetic)

Target folder: `classic_rl/pokemon-battle/` (new).
Style guide: `.claude/skills/course-viz/SKILL.md` — **explicitly overridden** in §"Visual specification" below per user permission ("Override the visual skill if necessary for this classic feel").
Curriculum slot: viz #7 of 7. **Second integrative review** (Snakes & Ladders was the first). Same lessons, different cultural artefact.

## 1. Why this viz exists

The student arrives at viz #7 with the curriculum's five concepts already cemented:
- MDP frame · ε-greedy · Bellman + γ · Robbins-Monro · SARSA

Snakes & Ladders (viz #6) replayed them on an abstract board. Pokemon battles replay them on a **narrative game almost everyone has played**. The student doesn't need to learn what an MDP "feels like" — they've been making MDP decisions in Pokemon since they were 8 years old. The viz makes that subconscious knowledge explicit.

**The visual override is the whole point.** A Pokemon viz in NYT-editorial cream serif would land flat. The Gen-1 Red/Blue Game Boy look is the cultural anchor — it does emotional work the SKILL's editorial palette cannot. The user has explicitly authorized this override.

## 2. The MDP

**Battle:** Pikachu (yours, back sprite) vs Charmander (wild, front sprite). Fight until one Pokemon faints.

**State** `s`:
- `(your_HP_bucket, opp_HP_bucket)`
- HP buckets per Pokemon: `{full, mid, low}` → 3 buckets each
- Total non-terminal states: `3 × 3 = 9`
- Terminal states: any side at 0 HP (win or lose)

**Action** `a`: choose one of 4 Pikachu moves.

| Move         | Power | Accuracy | Note                            |
|--------------|-------|----------|---------------------------------|
| Quick Attack | 40    | 100%     | priority — always strikes first |
| Thunderbolt  | 90    | 100%     | reliable workhorse              |
| Iron Tail    | 75    | 75%      | medium-risk                     |
| Thunder      | 110   | 70%      | high risk, high reward          |

**Opponent AI:** Charmander uses **Ember** every turn (40 power, 100% acc). Fully deterministic. Keeps the lesson on Pikachu's decisions, not on outwitting an opponent.

**Transition** `P(s' | s, a)`:
- Pikachu's move resolves first if it's Quick Attack OR Pikachu is faster (it is — base speed 90 vs Charmander 65). So Pikachu always moves first.
- Damage roll: `move_power × roll_uniform[0.85, 1.0]`, applied to opp_HP if move hits (accuracy check).
- Then Charmander hits Pikachu with Ember (always lands, ~40 damage to your_HP).
- Both HP changes are rounded to buckets via thresholds.

**Reward** `R`:
- `−1` per turn (encourages fast wins)
- `+10` on opp_HP = 0 (you win) — terminal
- `−10` on your_HP = 0 (you faint) — terminal

**Discount** `γ`: 0.90 default. Slider in scene 3 with range `[0.70, 0.99]`.

Q-table size: `9 × 4 = 36 entries`. Tiny. Easy to show as a literal numerical table in scene 4.

## 3. Visual specification — **override of SKILL §"Aesthetic — editorial"**

The SKILL itself explicitly allows this:

> If a course needs a fundamentally different look (e.g. a hand-drawn whiteboard aesthetic for an intro CS course), see the sibling `teaching-viz` skill — that one defines the casual single-file pattern.

The Pokemon viz is closer to the casual-game aesthetic than the editorial one. Override the following:

### Palette (Pokemon Gen-1 Red/Blue era)

- **Battle sky** (top half): linear-gradient `#9CC8E8 → #C0DEF0` (light blue)
- **Grass platform** (bottom half): `#5BA85B` with darker rim `#3A8A3A`
- **Dialog box background:** `#FFFFFF`
- **Dialog box border:** `#000000` 4px solid, with `#404040` 2px inner highlight (Pokemon dialog box detail)
- **HP bar fill:** green `#48C848` → yellow `#E8C828` (when < 50%) → red `#E84828` (when < 20%). Background of the bar is `#F8F8F8` with `#000000` 1px border.
- **HP box background:** `#F8F8F8` with `#000000` 2px border
- **Text:** `#000000` on light backgrounds, `#FFFFFF` on dark
- **Pikachu yellow accent** (for branding): `#F8D028`
- **Damage number flash:** white text with 2px black stroke

### Typography

- **Headlines, UI, dialog:** `"Press Start 2P", monospace` (vendored from Google Fonts, SIL OFL licensed)
- **KaTeX (math formulas):** retain default KaTeX rendering — Press Start 2P does not have math glyphs and forcing it would break the formulas. Wrap KaTeX in a `.poke-formula` block with a thick black border + white interior so the editorial math reads as "a different kind of in-game text box".
- **Damage numbers:** Press Start 2P, 24px, with a 2px white outline stroke for legibility against any background.

### Borders + boxes

- Replace SKILL's hairline `1px solid var(--rule)` with **Pokemon's 4px black borders with 2px inner highlight**. This is the iconic look.
- All `.card` instances become `.poke-box` (white interior, thick black border).

### Light + dark theme

Retain the toggle but re-skin both modes for Pokemon (not editorial cream/dark-warm):
- **Light = Day battle:** as specified above — bright sky, green grass.
- **Dark = Night battle:** sky `#2A3A6E` with white-pinprick stars; grass `#2A5A2A` (darker green); dialog box stays `#FFFFFF` with `#000000` border (Game Boy contrast). The Pokemon sprites themselves don't change — Gen-1 sprites are night-agnostic.

### What stays from the SKILL

- Click-step scene engine + hash routing + dot pager
- `&run` and `&instant` URL flags
- Headless screenshot verification
- KaTeX for math
- All shared modules (`history.js`, `chart.js`, `qtable.js` patterns)

## 4. Assets — fetching real Pokemon sprites

The user explicitly asked for **real Pokemon images**. Vendor them locally; no runtime fetch.

### Sprites (download via curl during Phase 0)

Gen-1 Red/Blue sprite mirror at PokeAPI's GitHub. Download to `assets/`:

```bash
SPRITE_BASE="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue"
curl -sL "$SPRITE_BASE/back/25.png" -o assets/pikachu-back.png
curl -sL "$SPRITE_BASE/4.png"        -o assets/charmander-front.png
# also fetch front sprites for the title-screen carousel
curl -sL "$SPRITE_BASE/25.png"       -o assets/pikachu-front.png
curl -sL "$SPRITE_BASE/back/4.png"   -o assets/charmander-back.png
```

If gen-1 sprites are too low-resolution at projector scale, fall back to:

```bash
SPRITE_BASE_HD="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
curl -sL "$SPRITE_BASE_HD/back/25.png" -o assets/pikachu-back.png      # default colored
curl -sL "$SPRITE_BASE_HD/4.png"        -o assets/charmander-front.png
```

Default-style sprites are still 96×96 pixel art but in full color. Acceptable Pokemon vibe either way.

Apply `image-rendering: pixelated;` CSS so the sprites scale up cleanly to display size (~192px or 288px).

### Font (download once, vendor permanently)

Press Start 2P from Google Fonts, SIL OFL licensed — free to redistribute:

```bash
curl -sL "https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK0nWP-9DnUJB.woff2" \
  -o assets/fonts/PressStart2P-Regular.woff2
```

(If the version-tagged URL changes, search `fonts.googleapis.com/css2?family=Press+Start+2P` and copy the WOFF2 URL from the returned `@font-face` block — that's the canonical way.)

Reference via `@font-face` in `css/style.css`:

```css
@font-face {
  font-family: 'Press Start 2P';
  src: url('../assets/fonts/PressStart2P-Regular.woff2') format('woff2');
  font-display: block; /* avoid FOUT for the pixel font */
}
```

### Type icons (optional, draw inline as SVG)

Four type pills next to the move buttons. Cheap inline SVG, no asset download:
- **Electric** (yellow lightning bolt on yellow background)
- **Normal** (gray oval on gray background)
- **Steel** (silver gear on gray-silver background)
- *(Fire is opponent-only — Ember — not shown to the user)*

### License note

Pokemon sprites are © Nintendo / Game Freak / The Pokemon Company. Vendoring them for an unmonetized educational visualization at ETH Zurich falls within standard educational fair-use practice (and the user has explicitly authorized it). No commercial redistribution.

Press Start 2P is © Cody "CodeMan38" Boisclair under the SIL Open Font License — fully redistributable.

## 5. Driving model

| Scene | Mode                                             |
|-------|--------------------------------------------------|
| 0     | static (title screen → MDP frame mapping)        |
| 1     | manual (full battle, click-to-attack)            |
| 2     | autoplay (value iteration over the 9-state grid) |
| 3     | direct (γ slider; policy re-renders)             |
| 4     | autoplay scrubber (precomputed SARSA training)   |
| 5     | static (recap)                                   |

`&run` triggers Play; `&instant` skips fades.

## 6. Scene list (6 scenes, click-step)

| # | Title                           | What the student sees and does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Step engine?                                  |
|---|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| 0 | **POKEMON** (title)             | Classic title-screen aesthetic: pixel-art "POKEMON" wordmark (rendered as styled `<h1>`, not a copyrighted logo image), "Press START to begin" subtitle, animated Pikachu sprite blinking. Click "START" or press → to dissolve to the MDP-frame overlay: a sliding panel that names S/A/P/R/γ over the battle screen. KaTeX teaser: *"You've played this game. Today you'll see why it's a Markov decision process."*                                                                                                                                                                   | No                                            |
| 1 | **A wild CHARMANDER appeared!** | Full battle screen — sky/grass background, Pikachu back-sprite lower-left, Charmander front-sprite upper-right, HP boxes for both, dialog box at bottom. Dialog typewriter-types: *"A wild CHARMANDER appeared!"* → *"Go, PIKACHU!"* → 4-move menu fades in. Click a move → dialog *"PIKACHU used THUNDERBOLT!"* → Charmander sprite shakes → damage number rises → HP bar drains → opponent counter-attack (Ember) → Pikachu sprite shakes → HP bar drains. Repeat until one faints. HUD: turn count, last-move result. Step engine: ← rewind to previous turn, → replay/advance scene. | Yes                                           |
| 2 | **Value iteration**             | Compact 3×3 state grid (rows = your HP bucket: full/mid/low; cols = opp HP bucket). Each cell shows V(state) (initially 0). "Run value iteration" button + iteration counter + max-ΔV chip. Click Run → V values propagate cell-by-cell, max-ΔV drops, convergence at ~20-30 iterations. After convergence: each cell shows V + the optimal-move name. Caption: *"For each (your HP, opp HP) combo, what's the best move? Bellman iteration tells you."* Pokemon-styled: cells are little dialog-box panels with Press Start 2P numbers.                                                 | Yes (iteration scrubber)                      |
| 3 | **γ as patience**               | Same 3×3 state grid, plus a γ slider styled as a Pokemon menu option (`▶ γ: 0.90`). Drag slider → V re-converges (from precomputed grid of 7 γ values, snapped). Watch the optimal-move-per-state shift. Caption: *"γ low (impatient) → Thunder, big risk. γ high (patient) → Thunderbolt, slow steady wins."* Annotation strip below: distribution of moves across the 9 states at current γ.                                                                                                                                                                                           | Yes (slider; values snap to precomputed grid) |
| 4 | **SARSA learns it**             | Battle screen + side panel. Pikachu plays battles autonomously (precomputed). Scrubber over episodes `[0, 1, 5, 25, 100, 500, 2000]`. **Below the battle:** the literal 9×4 Q-table as numbers (row = state, col = move). Updated cells flash with a Pokemon yellow border. Below the table: learning curve (win rate per 100 episodes) styled as a pixel-graph in a black-bordered box. Side card: ε and α as Pokemon menu items (`▶ ε: 0.10`, `▶ α: 0.10`). Caption: *"Same algorithm as cliff-walk and Snakes & Ladders. No Bellman shortcut. Just sample-update."*                   | Yes (scrubber)                                |
| 5 | **You've trained PIKACHU.**     | Five recap cards, each Pokemon-style dialog boxes pointing back to the prior viz:<br>• **MDP** (ANYmal-red box icon) — "the battle is a 5-tuple"<br>• **ε-greedy** (Casino-blue) — "scene 4's ε is straight from the Casino"<br>• **Bellman + γ** (Spooky-purple) — "scene 2 + 3, same recursion as Spooky House"<br>• **Robbins-Monro** (Darts-amber) — "scene 4's α is the RM step"<br>• **SARSA** (cliff-red) — "the same TD update everywhere"<br>Closing line: *"Other RL methods scale this. Pokemon AI in real games does too — Z-Move selection, EV-spread tuning, all of it."*  | No                                            |

## 7. Pitfalls and invariants

1. **Pixel rendering.** All Pokemon sprites need `image-rendering: pixelated; image-rendering: crisp-edges;` to avoid blurring on retina/projector. Verify in scene-1 screenshot.
2. **Press Start 2P density.** This font has 8×8 pixel glyphs at base size; setting it to 14-16px reads cleanly. Don't go below 12px (illegible on projector).
3. **HP-bar animation.** The bar should drain smoothly over ~600ms, not pop. The Pokemon Gen-1 visual is a tick-tick-tick drain.
4. **Dialog typewriter.** Text reveals ~30ms/character. Click to skip (reveal-all-at-once). After full reveal, a small ▼ blink in the corner before continuing.
5. **HP bucket discretization is a model simplification.** Acknowledge in scene 2's caption: *"Real HP is 1-100; we use 3 buckets so the policy fits on screen."*
6. **Optimal policy diversity.** Data-prep agent asserts the converged optimal policy at γ=0.90 uses ≥ 2 different moves across the 9 states.
7. **γ shift invariant.** Optimal policy at γ=0.70 must differ from γ=0.99 in ≥ 3 of the 9 states.
8. **SARSA convergence.** Mean reward (eps 1500-2000) > 0 AND mean win rate ≥ 0.85 in the last 500 episodes (the policy should consistently win after training).
9. **Don't reveal optimal policy before scene 2.** Scene 1 is feel-it.
10. **Pokemon sprite alignment.** Pikachu back-sprite should appear to *stand on* the grass platform, not float. Use CSS `transform: translateY(...)` to anchor the sprite's feet to the platform edge.

## 8. File layout

```
classic_rl/pokemon-battle/
  index.html
  css/
    style.css            ← Pokemon palette, pixel font, dialog boxes, HP bars, sprite anchoring
    scene0.css … scene5.css
  js/
    theme.js             ← day/night (light/dark) toggle, Pokemon-skinned
    main.js              ← scene engine
    katex-helpers.js     ← copied verbatim
    history.js           ← copied
    chart.js             ← styled into a pixel-box variant for the win-rate chart
    battle.js            ← MDP step + opponent AI + damage rolls
    moves.js             ← move definitions: { id, name, power, accuracy, type }
    sprite.js            ← <img> wrapper with image-rendering: pixelated + shake animation
    dialog.js            ← typewriter dialog box
    hpbar.js             ← animated HP bar with color phases
    bellman.js           ← value iteration over the 9-state space
    sarsa.js             ← SARSA update
    qtable.js            ← 9×4 numerical Q-table render
    scenes/
      scene0.js … scene5.js
  data/
    datasets.js          ← precomputed V at 7 γ values; SARSA snapshots; opponent script
  precompute/
    build-datasets.js    ← Mulberry32; runs VI + SARSA; asserts invariants
  vendor/
    katex/...            ← copied
  assets/
    pikachu-back.png
    pikachu-front.png
    charmander-front.png
    charmander-back.png
    fonts/
      PressStart2P-Regular.woff2
```

## 9. Phased build

### Phase 0 — Foundation (sequential, lead agent)

- Copy `snakes-ladders/` as scaffold (closest sibling that has both VI + SARSA + scrubber). Strip; rename brand and keys.
- **Download assets via curl** (URLs in §4 above). Verify each file exists and is non-empty.
- Replace editorial style tokens in `css/style.css` with the Pokemon palette + the @font-face declaration for Press Start 2P.
- Write `js/moves.js`, `js/battle.js`, `js/sprite.js`, `js/dialog.js`, `js/hpbar.js`.
- Write `js/bellman.js` (small 9-state value iteration).
- Adapt `js/sarsa.js` from the sarsa-anymal/snakes-ladders one.
- Stub `scenes/sceneN.js`.

### Phase 0.5 — Data prep (one sub-agent, parallel with Phase 0)

`precompute/build-datasets.js`:

- Mulberry32 seeded.
- Computes V and optimal policy at 7 γ values: `[0.70, 0.80, 0.85, 0.90, 0.93, 0.96, 0.99]`. Value iteration with synchronous backups, cap 100 iters.
- Runs SARSA for 2000 episodes with `α=0.15, ε=0.15, γ=0.90`. Q-snapshots at log-spaced indices `[0, 1, 5, 25, 100, 500, 2000]`. Per-episode reward + win indicator full series.
- **Invariants asserted in code:**
  1. VI converges (max-ΔV < 1e-3) within 30 iterations at every γ.
  2. Optimal policy at γ=0.90 uses ≥ 2 different moves across the 9 states.
  3. Optimal policy at γ=0.70 vs γ=0.99 differs in ≥ 3 states.
  4. SARSA: mean reward (eps 1500-2000) > mean reward (eps 0-50) by ≥ 5.
  5. SARSA: win rate in last 500 episodes ≥ 0.85.
  6. SARSA-vs-VI policy agreement on visited states (≥ 5 visits) ≥ 70%.
  7. Byte-identical regen.

### Phase 1 — Scene fan-out (parallel after Phase 0 + 0.5)

Three sub-agents:

- **Agent A — bookends:** scenes **0, 5**. Title screen + recap. Owns the Pokemon-themed title-card rendering, the "Press START" interaction, and the 5-card recap with cross-viz hue mapping.
- **Agent B — battle + value iteration:** scenes **1, 2**. The battle mechanic (dialog, typewriter, sprite shake, HP drain, opponent counter-attack) + the value-iteration animation. Highest interactive density. Owns `battle.js`, `dialog.js`, `hpbar.js`.
- **Agent C — γ + SARSA:** scenes **3, 4**. Both consume precomputed data. Owns the Q-table render + the win-rate chart + the γ slider menu.

3-2-2 split.

### Phase 2 — Aggregation + verification (sequential, lead agent)

- Link all `scene*.css`. Parse-check every JS file.
- Headless screenshot every scene at 1280×800 and 1920×1080 in both themes (Day/Night) with `&instant`. Add `&run` for scenes 2 and 4. `--headless=new`.
- **Read every PNG.** Verify pixel-art rendering (`image-rendering: pixelated` worked — no blur on the sprites). Verify Press Start 2P is loaded (no fallback to monospace serif).
- **Manual walk-through** (or honest "couldn't run" caveat):
  - Scene 0: click START → dissolve to MDP frame.
  - Scene 1: click Thunderbolt → dialog → Charmander shakes → HP drains → Ember → Pikachu shakes → HP drains.
  - Scene 2: click Run → V iteration animates → optimal-move labels appear.
  - Scene 3: drag γ slider → policy labels shift.
  - Scene 4: scrub episode slider → Q-table updates → win-rate curve highlights.
- Spot-check Phase 0.5 invariants by re-running `build-datasets.js`.
- **Update `classic_rl/index.html`** (root landing page) — add a 7th `<li class="viz">` for Pokemon between Snakes & Ladders and the footer. Description: one line, *"A wild Charmander appeared! Same lesson, classic Pokemon palette."*.
- Update `<title>` to "Classic RL · seven visualizations" and the lede to mention Pokemon.
- **Commit + push.** One commit covering the viz + landing-page update. HEREDOC message ending with the standard Co-Authored-By trailer.

## 10. Open questions (answer at run time or before kickoff)

1. **Pokemon roster** — plan: Pikachu (yours) vs Charmander (wild). Iconic + neutral matchup. Want a type-disadvantage scenario (e.g., Pikachu vs Geodude — Electric vs Ground, forces Iron Tail use)?
2. **Sprite generation** — plan: Gen-1 Red/Blue sprites (most nostalgic, 8-bit feel). Alternative: default modern sprites (sharper, more colour). Gen-1 wins on vibes but Geodude/etc may look chunky.
3. **HP buckets** — plan: 3 per Pokemon → 9 states total. Want 4? (16 states; more nuance, but the Q-table doubles.)
4. **Move set** — plan: 4 moves (Quick Attack, Thunderbolt, Iron Tail, Thunder). Want 3? (Simpler bandit but loses the Iron Tail / Thunder risk tier.)
5. **Day/night theme toggle** — plan: keep it, re-skin both for Pokemon. Drop it entirely?

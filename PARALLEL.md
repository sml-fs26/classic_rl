# Parallel waves: how multiple Claude sessions work this repo without colliding

The problem: every session shares one working tree on one branch, so uncommitted
edits, commits, and even headless-Chrome QA step on each other. The fix is one
**git worktree (separate dir + branch) per session**, plus a file layout where the
three kinds of work never touch the same file.

## The three lanes (no two share a file)

| Lane | Branch | Worktree dir | Touches ONLY | Never touches |
|---|---|---|---|---|
| **Games** | `wave-games` (or `game/<slug>`) | `../classic_rl-games` | new `*/` viz folders (e.g. `fare-wars/`) | `index.html`, `css/`, `cartridges.js` |
| **Design** | `wave-design` | `../classic_rl-design` | `index.html`, `css/`, arcade chrome/theme/engine | game folders, `cartridges.js` |
| **Integrate** | `main` | the original checkout | `cartridges.js`, `list.html`, merges | other lanes' in-progress files |

- A **game** is a self-contained folder. Two game sessions never edit the same file.
- The **arcade registry** (content) lives in `cartridges.js`, separate from the
  chrome/engine in `index.html` (design). So games, design, and integration are
  three different files.
- Only **one integrator** registers finished games and publishes (see below).

## Setup (run once, from the main checkout)

```bash
git worktree add -b wave-games  ../classic_rl-games  main
git worktree add -b wave-design ../classic_rl-design main
git worktree list
```

Start a separate Claude session in each dir: `cd ../classic_rl-games && claude`.
When a branch is merged, retire it: `git worktree remove ../classic_rl-games`.

## Adding a game (the only shared-file edit)

A game session builds `*/` (its folder) and **does not touch `cartridges.js` or
`index.html`**. When it is done and on `main`, the **integrator** registers it by
editing **only `cartridges.js`** (4 steps documented at the top of that file):
add a `GAMES` entry, a `SPRITES` sprite, the `SPR` key, and put it in
`VIEWS.extra`. The arcade counts (the `N - IN - 1` badge, the `EXTRA +N` tag, the
bundle blurb) auto-derive, so no other edit is needed.

## Publishing

Only **`main`** deploys (GitHub Pages builds the whole repo on push to `main`).
Worktree branches are safe staging; nothing goes live until the integrator merges
to `main`. Make "merge to `main`" the one deliberate publish step.

## QA hygiene (avoid the known footguns)

- **Headless screenshots:** always launch detached with a FRESH `--user-data-dir`
  (mktemp) and kill the process after the PNG is written. Parallel sessions sharing
  a Chrome profile collide on `SingletonLock`; a stale lock then blocks your real
  Chrome too.
- **Never commit QA scratch:** `qa-shots/`, `.shots_tmp/` are gitignored. Keep it
  that way.
- **Rebase before integrating:** the integrator should `git merge main` (or rebase)
  a wave branch before resolving `cartridges.js`, so registry additions stack cleanly.

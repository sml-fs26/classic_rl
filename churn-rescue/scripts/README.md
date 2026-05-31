# Scripts

## regress-screenshots.sh

Headless-Chrome screenshot regression test.  Captures every scene at
`1500×820` (typical laptop viewport with browser chrome) and compares
against committed baselines under `tests/shots/baseline/`.

Comparison is by file-size delta (catches the bulk of layout breaks
without requiring ImageMagick).  Threshold: 6 % size change vs
baseline.  Above that, the scene is flagged for human eyeballing.

### Workflow

1. Run the dev server (in a separate terminal):

   ```
   cd pokemon-battle
   python3 -m http.server 8765
   ```

2. Capture fresh baselines on a known-good `main`:

   ```
   scripts/regress-screenshots.sh --baseline
   git add tests/shots/baseline/
   git commit -m "lock screenshot baselines"
   ```

3. Before a refactor that might break layout (CSS rewrites, large
   scene moves), re-run **without** `--baseline` to compare:

   ```
   scripts/regress-screenshots.sh
   ```

   Exit code 0 → all good.  Exit code 1 → at least one scene drifted;
   inspect `tests/shots/diff/sN.txt` and visually compare
   `tests/shots/current/sN.png` vs `tests/shots/baseline/sN.png`.

4. Clean up:

   ```
   scripts/regress-screenshots.sh --clean
   ```

### Origin story

This catches the kind of bug we had when `scene4.css` was deleted —
the Q-table base styles vanished and the SARSA F-step grid collapsed
to one column, but no test caught it.  A simple file-size delta on a
headless screenshot of scene 9 would have flagged the regression
immediately.

### What it does NOT catch

* Animations mid-flight (we capture a single snapshot per scene).
* Dynamic content that depends on time / RNG / localStorage state.
* Differences invisible at the file-size scale (pixel-level drift).
  For pixel-precise comparison, install ImageMagick and run
  `magick compare current/sN.png baseline/sN.png diff/sN.png` in a
  follow-up step.

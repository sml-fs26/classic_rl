#!/usr/bin/env bash
# Batch headless-screenshot every scene in markov-kombat.  Output goes
# to qa-shots/mk/$LABEL/  where $LABEL is the first arg (default: latest).
#
# Usage:
#   scripts/screenshot-mk.sh                # → qa-shots/mk/latest/
#   scripts/screenshot-mk.sh phase-3-visual # → qa-shots/mk/phase-3-visual/
#
# Requires:
#   - python3 (used to spin up a static server on :8766)
#   - macOS Chrome at /Applications/Google Chrome.app
set -euo pipefail

LABEL="${1:-latest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/qa-shots/mk/$LABEL"
mkdir -p "$OUT"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8766

# Spin up a static server in the background.
pushd "$ROOT/markov-kombat" >/dev/null
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
popd >/dev/null
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1

# Scenes 0..10 (same count as pokemon-battle after gym-archive).
for i in 0 1 2 3 4 5 6 7 8 9 10; do
  echo "==> Capturing scene $i"
  PROFILE=$(mktemp -d)
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1500,950 --virtual-time-budget=5500 \
    --user-data-dir="$PROFILE" \
    --screenshot="$OUT/scene-$i.png" \
    "http://localhost:$PORT/index.html?nocache=$(date +%s)#scene=$i&run" \
    >/dev/null 2>&1 || true
  rm -rf "$PROFILE"
  sleep 1
done

# Step-snapshots for the SARSA-derivation pager (scene 9 in MK = 9 in Pokemon).
for sd in 1 2 3 4 5 6 7 8; do
  echo "==> Capturing scene 9 step $sd"
  PROFILE=$(mktemp -d)
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1500,950 --virtual-time-budget=5500 \
    --user-data-dir="$PROFILE" \
    --screenshot="$OUT/scene-9-step-$sd.png" \
    "http://localhost:$PORT/index.html?nocache=$(date +%s)#scene=9&sd=$sd" \
    >/dev/null 2>&1 || true
  rm -rf "$PROFILE"
  sleep 1
done

echo
echo "Done.  Screenshots written to: $OUT"
ls "$OUT"

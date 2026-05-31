#!/usr/bin/env bash
# regress-screenshots.sh
#
# Headless screenshot regression for the Pokemon-battle viz.
#
# Usage:
#   scripts/regress-screenshots.sh              # capture current/ + diff vs baseline/
#   scripts/regress-screenshots.sh --baseline   # overwrite baselines (use on a known-good main)
#   scripts/regress-screenshots.sh --clean      # blow away current/ + diff/
#
# Output:
#   tests/shots/baseline/sN.png   committed images for each scene 0..10
#   tests/shots/current/sN.png    fresh shots from this run
#   tests/shots/diff/sN.txt       per-scene size delta vs baseline
#
# The diff is intentionally simple (file size) — catches the bulk of
# layout breaks (cells reflow, badges vanish, scenes collapse) without
# pulling in imagemagick.  For pixel-precise comparison run
# `magick compare current/sN.png baseline/sN.png diff/sN.png` if you
# have ImageMagick installed.
#
# Requires:
#   - Google Chrome at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
#   - A local server at http://localhost:8765/index.html (python3 -m http.server 8765
#     from inside pokemon-battle/ does it).

set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VIZ_ROOT="$( dirname "${SCRIPT_DIR}" )"
SHOTS_DIR="${VIZ_ROOT}/tests/shots"
BASELINE_DIR="${SHOTS_DIR}/baseline"
CURRENT_DIR="${SHOTS_DIR}/current"
DIFF_DIR="${SHOTS_DIR}/diff"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SERVER_URL="http://localhost:8765/index.html"
SIZE="1500,820"
NUM_SCENES=11   # scenes 0..10

mkdir -p "${BASELINE_DIR}" "${CURRENT_DIR}" "${DIFF_DIR}"

# Quick sanity: chrome + server available.
if [ ! -x "${CHROME}" ]; then
  echo "ERROR: Chrome not found at ${CHROME}" >&2
  exit 2
fi
if ! curl -fsS "${SERVER_URL}" >/dev/null 2>&1; then
  echo "ERROR: dev server not reachable at ${SERVER_URL}" >&2
  echo "       run:  cd pokemon-battle && python3 -m http.server 8765" >&2
  exit 2
fi

case "${1:-}" in
  --clean)
    rm -rf "${CURRENT_DIR}" "${DIFF_DIR}"
    echo "cleaned current/ and diff/"
    exit 0
    ;;
esac

MODE="diff"
if [ "${1:-}" = "--baseline" ]; then
  MODE="baseline"
  echo "Capturing baselines into ${BASELINE_DIR}/"
fi

# Capture each scene.
for n in $(seq 0 $((NUM_SCENES - 1))); do
  PROFILE="$(mktemp -d -t regress-chrome-XXXX)"
  OUT="${CURRENT_DIR}/s${n}.png"
  URL="${SERVER_URL}?nocache=$(date +%s%N)#scene=${n}&skipboot"
  "${CHROME}" \
    --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size="${SIZE}" \
    --virtual-time-budget=4500 \
    --user-data-dir="${PROFILE}" \
    --screenshot="${OUT}" \
    "${URL}" >/dev/null 2>&1
  rm -rf "${PROFILE}"
  if [ ! -f "${OUT}" ]; then
    echo "  scene ${n}: FAILED to capture"
    continue
  fi
  bytes=$(stat -f%z "${OUT}" 2>/dev/null || stat -c%s "${OUT}" 2>/dev/null)
  printf "  scene %2d  %7d bytes\n" "${n}" "${bytes}"

  if [ "${MODE}" = "baseline" ]; then
    cp "${OUT}" "${BASELINE_DIR}/s${n}.png"
  fi
done

if [ "${MODE}" = "baseline" ]; then
  echo ""
  echo "Baselines updated.  Commit tests/shots/baseline/*.png to lock the layout."
  exit 0
fi

# Diff mode: compare each current/ to baseline/ by file size.
echo ""
echo "Comparing current/ to baseline/ ..."
mkdir -p "${DIFF_DIR}"
exitcode=0
for n in $(seq 0 $((NUM_SCENES - 1))); do
  CUR="${CURRENT_DIR}/s${n}.png"
  BASE="${BASELINE_DIR}/s${n}.png"
  DIFF="${DIFF_DIR}/s${n}.txt"
  if [ ! -f "${CUR}" ]; then
    printf "  scene %2d  MISSING current\n" "${n}"
    exitcode=1
    continue
  fi
  if [ ! -f "${BASE}" ]; then
    printf "  scene %2d  no baseline (run with --baseline to capture)\n" "${n}"
    continue
  fi
  cur_b=$(stat -f%z "${CUR}" 2>/dev/null || stat -c%s "${CUR}" 2>/dev/null)
  base_b=$(stat -f%z "${BASE}" 2>/dev/null || stat -c%s "${BASE}" 2>/dev/null)
  delta=$(( cur_b - base_b ))
  abs_delta=${delta#-}
  # Threshold: more than 6 % file-size change is suspicious.
  threshold=$(( base_b / 16 ))
  if [ "${abs_delta}" -gt "${threshold}" ]; then
    printf "  scene %2d  DELTA %+d bytes (%d → %d)   ⚠ over threshold\n" "${n}" "${delta}" "${base_b}" "${cur_b}"
    exitcode=1
  else
    printf "  scene %2d  ok  Δ%+d bytes\n" "${n}" "${delta}"
  fi
  cat > "${DIFF}" <<EOF
scene ${n}
baseline bytes: ${base_b}
current  bytes: ${cur_b}
delta:          ${delta}
threshold:      ${threshold}
EOF
done

if [ "${exitcode}" -eq 0 ]; then
  echo ""
  echo "All ${NUM_SCENES} scenes within tolerance of baseline."
else
  echo ""
  echo "One or more scenes regressed.  Eyeball the diff:"
  echo "  open tests/shots/current/ tests/shots/baseline/"
fi
exit "${exitcode}"

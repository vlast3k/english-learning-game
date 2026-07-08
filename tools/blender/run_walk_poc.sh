#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

BLENDER_BIN="${BLENDER_BIN:-}"
if [[ -z "$BLENDER_BIN" ]]; then
  if command -v blender >/dev/null 2>&1; then
    BLENDER_BIN="$(command -v blender)"
  elif [[ -x "/Applications/Blender.app/Contents/MacOS/Blender" ]]; then
    BLENDER_BIN="/Applications/Blender.app/Contents/MacOS/Blender"
  else
    echo "Blender not found. Install Blender or set BLENDER_BIN=/path/to/blender." >&2
    exit 127
  fi
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/english-game-blender-poc.XXXXXX")"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

FRAMES_DIR="$TMP_DIR/frames"
"$BLENDER_BIN" --background --python tools/blender/render_walk_poc.py -- --output-dir "$FRAMES_DIR" --frame-count 8
python3 tools/blender/pack_walk_poc.py --frames-dir "$FRAMES_DIR" --output-dir assets/james-bond/level-01-briefing/blender-poc --frame-count 8
python3 tools/blender/validate_walk_poc.py

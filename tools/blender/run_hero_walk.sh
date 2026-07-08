#!/usr/bin/env bash
# Render the layered painted hero puppet in Blender and publish the walk into the
# production hero sprite assets consumed by the Phaser game.
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

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/english-game-hero-walk.XXXXXX")"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

FRAMES_DIR="$TMP_DIR/frames"
python3 tools/blender/build_hero_puppet_articulated.py
"$BLENDER_BIN" --background --python tools/blender/render_hero_articulated_walk.py -- --output-dir "$FRAMES_DIR" --frame-count 8
python3 tools/blender/publish_hero_walk.py --frames-dir "$FRAMES_DIR"

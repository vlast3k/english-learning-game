#!/usr/bin/env bash
# Build the production hero side-walk assets from the artist's hand-drawn walk
# cycle in the source panel.
#
# The panel `hero-spy-source-panel.png` already contains a complete, professional
# 8-frame side walk. Earlier we tried to synthesise a walk by posing a 2D puppet
# in Blender (see tools/blender/*), but that produced occlusion "sliver" legs and
# a "doubled feet" look. Slicing the artist's real frames is cleaner, faster and
# needs no Blender.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/english-game-hero-walk.XXXXXX")"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

FRAMES_DIR="$TMP_DIR/frames"
python3 tools/extract_hero_walk_from_panel.py --output-dir "$FRAMES_DIR"
python3 tools/blender/publish_hero_walk.py --frames-dir "$FRAMES_DIR"

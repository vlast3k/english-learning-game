"""Publish the Blender puppet walk into the production hero sprite assets.

This replaces the flattened-panel slicer path for the walk row. The walk frames
come from `render_hero_puppet_walk.py`, which poses the layered painted hero and
renders shadeless frames with true colors and a stable foot baseline. The idle
front/back/side poses are still taken from the painted source panel, because
those single poses are clean and do not need animating.

Output (matching the existing runtime layout):
- hero-spy-natural-walk-row.png       (1536x220)
- hero-spy-natural-spritesheet.png    (1536x1320)
- hero-spy-natural-walk-preview.gif   (192x220)
"""

import argparse
import importlib.util
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets/james-bond/level-01-briefing/generated"
WALK_ROW_OUT = OUT_DIR / "hero-spy-natural-walk-row.png"
SHEET_OUT = OUT_DIR / "hero-spy-natural-spritesheet.png"
PREVIEW_OUT = OUT_DIR / "hero-spy-natural-walk-preview.gif"

FRAME_W = 192
FRAME_H = 220
COLS = 8


def load_walk_builder():
    """Reuse the painted-pose extraction from the existing builder."""
    spec = importlib.util.spec_from_file_location(
        "walk", ROOT / "tools/build_spy_walk_cycle.py"
    )
    walk = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(walk)
    return walk


def load_idle_poses():
    walk = load_walk_builder()
    source = Image.open(ROOT / walk.SRC).convert("RGBA")
    front = walk.fit_to_frame(source.crop(walk.FRONT_BOX))
    side = walk.fit_to_frame(source.crop(walk.SIDE_BOX))
    back = walk.fit_to_frame(source.crop(walk.BACK_BOX))
    return front, side, back


def load_walk_frames(frames_dir):
    frames = []
    for index in range(COLS):
        path = frames_dir / f"walk_{index + 1:02d}.png"
        frame = Image.open(path).convert("RGBA")
        if frame.size != (FRAME_W, FRAME_H):
            raise RuntimeError(
                f"Expected {path} to be {(FRAME_W, FRAME_H)}, got {frame.size}"
            )
        frames.append(frame)
    return frames


def write_row(frames, path):
    row = Image.new("RGBA", (FRAME_W * COLS, FRAME_H), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        row.alpha_composite(frame, (index * FRAME_W, 0))
    row.save(path)


def write_sheet(front, back, side, walk_frames, path):
    sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * 6), (0, 0, 0, 0))
    rows = [
        [front] * COLS,
        [back] * COLS,
        walk_frames,
        [front] * COLS,
        [back] * COLS,
        [side] * COLS,
    ]
    for row_index, row_frames in enumerate(rows):
        for col, frame in enumerate(row_frames):
            sheet.alpha_composite(frame, (col * FRAME_W, row_index * FRAME_H))
    sheet.save(path)


def write_preview(frames, path):
    bg = Image.new("RGBA", (FRAME_W, FRAME_H), (210, 218, 200, 255))
    gif_frames = [
        Image.alpha_composite(bg, frame).convert("P", palette=Image.Palette.ADAPTIVE)
        for frame in frames
    ]
    gif_frames[0].save(
        path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=105,
        loop=0,
        disposal=2,
    )


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames-dir", type=Path, required=True)
    return parser.parse_args()


def main():
    args = parse_args()
    front, side, back = load_idle_poses()
    walk_frames = load_walk_frames(args.frames_dir)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_row(walk_frames, WALK_ROW_OUT)
    write_sheet(front, back, side, walk_frames, SHEET_OUT)
    write_preview(walk_frames, PREVIEW_OUT)

    print(f"Wrote {WALK_ROW_OUT}")
    print(f"Wrote {SHEET_OUT}")
    print(f"Wrote {PREVIEW_OUT}")


if __name__ == "__main__":
    main()

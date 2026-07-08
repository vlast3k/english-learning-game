"""Pack Blender POC frames into Phaser-compatible sprite rows/sheets."""

import argparse
import shutil
from pathlib import Path
from PIL import Image


FRAME_W = 192
FRAME_H = 220
COLS = 8

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ROOT = REPO_ROOT / "assets/james-bond/level-01-briefing/blender-poc"


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames-dir", type=Path, default=DEFAULT_ROOT / "frames")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--frame-count", type=int, default=COLS)
    return parser.parse_args()


def load_frame(path):
    frame = Image.open(path).convert("RGBA")
    if frame.size != (FRAME_W, FRAME_H):
        raise RuntimeError(f"Expected {path} to be {(FRAME_W, FRAME_H)}, got {frame.size}")
    return frame


def write_row(frames, path):
    row = Image.new("RGBA", (FRAME_W * COLS, FRAME_H), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        row.alpha_composite(frame, (index * FRAME_W, 0))
    row.save(path)


def write_sheet(frames, path):
    sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * 6), (0, 0, 0, 0))
    rows = [
        [frames[0]] * COLS,
        [frames[4]] * COLS,
        frames,
        [frames[0]] * COLS,
        [frames[4]] * COLS,
        [frames[0]] * COLS,
    ]
    for row_index, row_frames in enumerate(rows):
        for col, frame in enumerate(row_frames):
            sheet.alpha_composite(frame, (col * FRAME_W, row_index * FRAME_H))
    sheet.save(path)


def write_preview(frames, path):
    bg = Image.new("RGBA", (FRAME_W, FRAME_H), (32, 38, 46, 255))
    gif_frames = []
    for frame in frames:
        composed = bg.copy()
        composed.alpha_composite(frame)
        gif_frames.append(composed.convert("P", palette=Image.Palette.ADAPTIVE))
    gif_frames[0].save(path, save_all=True, append_images=gif_frames[1:], duration=105, loop=0, disposal=2)


def publish_frames(frames_dir, output_frames_dir):
    if output_frames_dir.exists():
        shutil.rmtree(output_frames_dir)
    output_frames_dir.mkdir(parents=True, exist_ok=True)
    for frame_path in sorted(frames_dir.glob("walk_*.png")):
        shutil.copy2(frame_path, output_frames_dir / frame_path.name)


def main():
    args = parse_args()
    if args.frame_count != COLS:
        raise RuntimeError(f"This Phaser POC expects exactly {COLS} frames, got {args.frame_count}")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    frames = [load_frame(args.frames_dir / f"walk_{index + 1:02d}.png") for index in range(COLS)]
    published_frames = args.output_dir / "frames"
    row_out = args.output_dir / "agent-walk-row.png"
    sheet_out = args.output_dir / "agent-phaser-spritesheet.png"
    preview_out = args.output_dir / "agent-walk-preview.gif"
    publish_frames(args.frames_dir, published_frames)
    write_row(frames, row_out)
    write_sheet(frames, sheet_out)
    write_preview(frames, preview_out)
    print(f"Wrote {published_frames}")
    print(f"Wrote {row_out}")
    print(f"Wrote {sheet_out}")
    print(f"Wrote {preview_out}")


if __name__ == "__main__":
    main()

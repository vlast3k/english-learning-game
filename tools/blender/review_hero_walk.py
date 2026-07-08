"""Render the articulated hero walk and build review artifacts.

Outputs into test-results/hero-walk-iter/:
- walk_XX.png       individual frames
- row.png           frames side by side on the game background tone
- row_labeled.png   same row with frame numbers
- preview.gif       looping animation at game speed
- onion.png         overlay of all frames to reveal motion range
"""

import glob
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "test-results/hero-walk-iter"
BG = (210, 218, 200, 255)
FRAME_W = 192
FRAME_H = 220


def blender_bin():
    import shutil

    for candidate in ("blender", "/Applications/Blender.app/Contents/MacOS/Blender"):
        found = shutil.which(candidate) or (candidate if Path(candidate).exists() else None)
        if found:
            return found
    raise SystemExit("Blender not found")


def render():
    frames_dir = OUT / "frames"
    if frames_dir.exists():
        for f in frames_dir.glob("walk_*.png"):
            f.unlink()
    frames_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            blender_bin(),
            "--background",
            "--python",
            str(ROOT / "tools/blender/render_hero_articulated_walk.py"),
            "--",
            "--output-dir",
            str(frames_dir),
            "--frame-count",
            "8",
        ],
        check=True,
        cwd=ROOT,
    )
    return sorted(glob.glob(str(frames_dir / "walk_*.png")))


def build(paths):
    frames = [Image.open(p).convert("RGBA") for p in paths]
    bg = Image.new("RGBA", (FRAME_W, FRAME_H), BG)
    comp = [Image.alpha_composite(bg, f) for f in frames]

    row = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), BG)
    for i, f in enumerate(comp):
        row.alpha_composite(f, (i * FRAME_W, 0))
    row.convert("RGB").save(OUT / "row.png")

    labeled = row.copy()
    draw = ImageDraw.Draw(labeled)
    for i in range(len(frames)):
        draw.rectangle((i * FRAME_W, 0, i * FRAME_W + 22, 16), fill=(20, 20, 20, 255))
        draw.text((i * FRAME_W + 4, 3), str(i + 1), fill=(255, 255, 255, 255))
        draw.line((i * FRAME_W, 0, i * FRAME_W, FRAME_H), fill=(0, 0, 0, 90))
    # ground baseline reference
    draw.line((0, 211, labeled.width, 211), fill=(200, 60, 60, 160))
    labeled.convert("RGB").save(OUT / "row_labeled.png")

    onion = Image.new("RGBA", (FRAME_W, FRAME_H), BG)
    for f in frames:
        faded = f.copy()
        alpha = faded.getchannel("A").point(lambda a: a // 3)
        faded.putalpha(alpha)
        onion.alpha_composite(faded)
    onion.convert("RGB").save(OUT / "onion.png")

    gif = [c.convert("P", palette=Image.Palette.ADAPTIVE) for c in comp]
    gif[0].save(
        OUT / "preview.gif",
        save_all=True,
        append_images=gif[1:],
        duration=110,
        loop=0,
        disposal=2,
    )
    print(f"Wrote review artifacts to {OUT}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    paths = render()
    if len(paths) != 8:
        raise SystemExit(f"Expected 8 frames, got {len(paths)}")
    build(paths)


if __name__ == "__main__":
    main()

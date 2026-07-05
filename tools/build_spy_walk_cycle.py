"""Build a natural side-walk cycle from the generated spy hero source panel.

The generated source panel's bottom walk row repeats nearly the same triangle
leg pose. This tool uses the cleaner right-facing side idle pose instead,
splits legs and visible arms into simple rigged layers, and renders an
8-frame cycle with alternating foot lift and arm counter-swing.
"""

from collections import deque
from pathlib import Path
import math

from PIL import Image, ImageFilter


SRC = Path("assets/james-bond/level-01-briefing/generated/hero-spy-source-panel.png")
OUT_DIR = Path("assets/james-bond/level-01-briefing/generated")
WALK_ROW_OUT = OUT_DIR / "hero-spy-natural-walk-row.png"
SHEET_OUT = OUT_DIR / "hero-spy-natural-spritesheet.png"
PREVIEW_OUT = OUT_DIR / "hero-spy-natural-walk-preview.gif"

FRAME_W = 192
FRAME_H = 220
COLS = 8

# Approximate source-panel crop boxes.
FRONT_BOX = (70, 60, 370, 585)
SIDE_BOX = (460, 55, 765, 580)
BACK_BOX = (820, 55, 1090, 580)

# Rig coordinates after fitting the side crop into a 192x220 frame.
HIP_Y = 128
LEG_SPLIT_X = 96
ALPHA_MIN = 36
SWING_DEG = 31.0
FOOT_LIFT = 13
ARM_SWING_DEG = 18.0


def remove_paper_background(image):
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    seen = set()
    queue = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    def is_background(r, g, b):
        saturation = max(r, g, b) - min(r, g, b)
        bright = (r + g + b) / 3
        return bright > 180 and saturation < 55

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
            continue
        r, g, b, a = pixels[x, y]
        if a == 0 or not is_background(r, g, b):
            continue
        seen.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    alpha = Image.new("L", image.size, 255)
    alpha_pixels = alpha.load()
    for x, y in seen:
        alpha_pixels[x, y] = 0
    image.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.45)))
    return image


def fit_to_frame(crop, bottom=208):
    crop = remove_paper_background(crop)
    bbox = crop.getbbox()
    if not bbox:
        return Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    crop = crop.crop(bbox)
    scale = min((FRAME_W - 16) / crop.width, (bottom - 8) / crop.height)
    new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(new_size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    frame.alpha_composite(crop, ((FRAME_W - crop.width) // 2, bottom - crop.height))
    return frame


def copy_region(base, predicate):
    layer = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    src = base.load()
    dst = layer.load()
    for y in range(FRAME_H):
        for x in range(FRAME_W):
            if src[x, y][3] >= ALPHA_MIN and predicate(x, y):
                dst[x, y] = src[x, y]
    return layer


def erase_region(base, predicate):
    image = base.copy()
    pixels = image.load()
    for y in range(FRAME_H):
        for x in range(FRAME_W):
            if pixels[x, y][3] >= ALPHA_MIN and predicate(x, y):
                pixels[x, y] = (0, 0, 0, 0)
    return image


def rotate(layer, angle, pivot, lift=0, x_shift=0):
    return layer.rotate(
        angle,
        resample=Image.Resampling.BICUBIC,
        center=pivot,
        translate=(x_shift, -lift),
    )


def build_walk_frames(side_idle):
    # Region choices are intentionally simple and visible. They split the
    # trousers and boots even when the source art has both legs close together.
    back_leg = copy_region(
        side_idle,
        lambda x, y: y >= HIP_Y - 3 and x <= LEG_SPLIT_X + 4 and x >= 66,
    )
    front_leg = copy_region(
        side_idle,
        lambda x, y: y >= HIP_Y - 3 and x >= LEG_SPLIT_X - 8 and x <= 129,
    )
    rear_arm = copy_region(
        side_idle,
        lambda x, y: 80 <= y <= 154 and 68 <= x <= 94,
    )
    front_hand = copy_region(
        side_idle,
        lambda x, y: 98 <= y <= 154 and 101 <= x <= 119,
    )

    torso = side_idle
    for predicate in (
        lambda x, y: y >= HIP_Y - 3 and 66 <= x <= 129,
        lambda x, y: 80 <= y <= 154 and 68 <= x <= 94,
        lambda x, y: 98 <= y <= 154 and 101 <= x <= 119,
    ):
        torso = erase_region(torso, predicate)

    frames = []
    for i in range(8):
        phase = i / 8.0
        s = math.sin(2 * math.pi * phase)
        c = math.cos(2 * math.pi * phase)

        front_angle = -SWING_DEG * s
        back_angle = SWING_DEG * s
        front_lift = max(0.0, c) * FOOT_LIFT
        back_lift = max(0.0, -c) * FOOT_LIFT

        # Arm motion is opposite the leading leg. The visible near arm gets the
        # stronger swing; the partly visible far hand gets a smaller echo.
        rear_arm_angle = ARM_SWING_DEG * s
        front_hand_angle = -ARM_SWING_DEG * 0.72 * s

        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        frame.alpha_composite(rotate(back_leg, back_angle, (86, HIP_Y - 2), back_lift))
        frame.alpha_composite(rotate(rear_arm, rear_arm_angle, (78, 84)))
        frame.alpha_composite(torso)
        frame.alpha_composite(rotate(front_leg, front_angle, (105, HIP_Y - 2), front_lift))
        frame.alpha_composite(rotate(front_hand, front_hand_angle, (105, 90)))
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
        [front] * 8,
        [back] * 8,
        walk_frames,
        [front] * 8,
        [back] * 8,
        [side] * 8,
    ]
    for row_index, frames in enumerate(rows):
        for col, frame in enumerate(frames):
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


def main():
    source = Image.open(SRC).convert("RGBA")
    front = fit_to_frame(source.crop(FRONT_BOX))
    side = fit_to_frame(source.crop(SIDE_BOX))
    back = fit_to_frame(source.crop(BACK_BOX))
    walk_frames = build_walk_frames(side)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_row(walk_frames, WALK_ROW_OUT)
    write_sheet(front, back, side, walk_frames, SHEET_OUT)
    write_preview(walk_frames, PREVIEW_OUT)
    print(f"Wrote {WALK_ROW_OUT}")
    print(f"Wrote {SHEET_OUT}")
    print(f"Wrote {PREVIEW_OUT}")


if __name__ == "__main__":
    main()

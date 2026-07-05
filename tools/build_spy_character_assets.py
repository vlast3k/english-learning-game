"""Build Phaser-compatible spy character support assets.

This complements build_spy_walk_cycle.py:
- extracts hero portrait frames from the generated hero source panel
- extracts a 4x3 director guide spritesheet from the generated green-screen panel
"""

from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter


HERO_SOURCE = Path("assets/james-bond/level-01-briefing/generated/hero-spy-source-panel.png")
GUIDE_SOURCE = Path("assets/james-bond/level-01-briefing/generated/director-guide-source-panel.png")
OUT_DIR = Path("assets/james-bond/level-01-briefing/generated")
HERO_PORTRAITS_OUT = OUT_DIR / "hero-spy-portraits.png"
GUIDE_SHEET_OUT = OUT_DIR / "director-guide-spritesheet.png"

FRAME_W = 192
FRAME_H = 220
PORTRAIT = 128


def remove_edge_background(image, mode="paper"):
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    visited = set()
    queue = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    def is_background(r, g, b):
        if mode == "green":
            return g > 145 and g > r * 1.25 and g > b * 1.25
        saturation = max(r, g, b) - min(r, g, b)
        bright = (r + g + b) / 3
        return bright > 180 and saturation < 55

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        r, g, b, a = pixels[x, y]
        if a == 0 or not is_background(r, g, b):
            continue
        visited.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    alpha = Image.new("L", image.size, 255)
    alpha_pixels = alpha.load()
    for x, y in visited:
        alpha_pixels[x, y] = 0
    image.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.45)))
    return image


def fit_to_frame(crop, frame_w=FRAME_W, frame_h=FRAME_H, bottom=208, padding=8):
    bbox = crop.getbbox()
    if not bbox:
        return Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    crop = crop.crop(bbox)
    scale = min((frame_w - padding * 2) / crop.width, (bottom - padding) / crop.height)
    crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    frame.alpha_composite(crop, ((frame_w - crop.width) // 2, bottom - crop.height))
    return frame


def fit_center(crop, size=PORTRAIT, padding=4):
    crop = remove_edge_background(crop, "paper")
    bbox = crop.getbbox()
    if not bbox:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    crop = crop.crop(bbox)
    scale = min((size - padding * 2) / crop.width, (size - padding * 2) / crop.height)
    crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    frame.alpha_composite(crop, ((size - crop.width) // 2, (size - crop.height) // 2))
    return frame


def build_hero_portraits():
    source = Image.open(HERO_SOURCE).convert("RGBA")
    boxes = [
        (1076, 54, 1274, 236),
        (1292, 54, 1496, 236),
        (1076, 284, 1274, 466),
        (1292, 284, 1496, 466),
        (1076, 506, 1274, 688),
        (1292, 506, 1496, 688),
    ]
    sheet = Image.new("RGBA", (PORTRAIT * len(boxes), PORTRAIT), (0, 0, 0, 0))
    for index, box in enumerate(boxes):
        frame = fit_center(source.crop(box))
        sheet.alpha_composite(frame, (index * PORTRAIT, 0))
    sheet.save(HERO_PORTRAITS_OUT)


def build_guide_spritesheet():
    source = Image.open(GUIDE_SOURCE).convert("RGBA")
    cell_w = source.width / 4
    cell_h = source.height / 3
    sheet = Image.new("RGBA", (FRAME_W * 4, FRAME_H * 3), (0, 0, 0, 0))
    for row in range(3):
        for col in range(4):
            crop = source.crop((
                round(col * cell_w),
                round(row * cell_h),
                round((col + 1) * cell_w),
                round((row + 1) * cell_h),
            ))
            frame = fit_to_frame(remove_edge_background(crop, "green"))
            sheet.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))
    sheet.save(GUIDE_SHEET_OUT)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_hero_portraits()
    build_guide_spritesheet()
    print(f"Wrote {HERO_PORTRAITS_OUT}")
    print(f"Wrote {GUIDE_SHEET_OUT}")


if __name__ == "__main__":
    main()

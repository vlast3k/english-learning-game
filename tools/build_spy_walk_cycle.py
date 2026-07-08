"""Build the spy hero sprite sheet from the generated source panel.

The source panel provides front/back/side poses and a painted right-facing walk
row. This builder extracts that painted walk row and normalizes it into the
Phaser frame grid, avoiding the old procedural limb rig that created duplicate
feet from a flattened side pose.
"""

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


SRC = Path("assets/james-bond/level-01-briefing/generated/hero-spy-source-panel.png")
GEMINI_WALK_SRC = Path("assets/james-bond/level-01-briefing/generated/hero-spy-gemini-walk-source.jpeg")
OUT_DIR = Path("assets/james-bond/level-01-briefing/generated")
WALK_ROW_OUT = OUT_DIR / "hero-spy-natural-walk-row.png"
SHEET_OUT = OUT_DIR / "hero-spy-natural-spritesheet.png"
PREVIEW_OUT = OUT_DIR / "hero-spy-natural-walk-preview.gif"

FRAME_W = 192
FRAME_H = 220
COLS = 8
WALK_BAND_TOP = 660
GEMINI_CROP_W = 176
WALK_BASELINE = 211

# Approximate source-panel crop boxes.
FRONT_BOX = (70, 60, 370, 585)
SIDE_BOX = (460, 55, 765, 580)
BACK_BOX = (820, 55, 1090, 580)


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


def is_paper_or_shadow(r, g, b):
    saturation = max(r, g, b) - min(r, g, b)
    brightness = (r + g + b) / 3
    return (brightness > 172 and saturation < 70) or (brightness > 120 and saturation < 38)


def alpha_components(image, min_alpha=36):
    alpha = image.getchannel("A")
    width, height = image.size
    seen = set()
    components = []
    for y in range(height):
        for x in range(width):
            if (x, y) in seen or alpha.getpixel((x, y)) < min_alpha:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            xs = []
            ys = []
            count = 0
            while queue:
                cx, cy = queue.popleft()
                xs.append(cx)
                ys.append(cy)
                count += 1
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (
                        0 <= nx < width
                        and 0 <= ny < height
                        and (nx, ny) not in seen
                        and alpha.getpixel((nx, ny)) >= min_alpha
                    ):
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            components.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1, count))
    return components


def alpha_components_with_points(alpha, min_alpha=28):
    width, height = alpha.size
    seen = set()
    components = []
    for y in range(height):
        for x in range(width):
            if (x, y) in seen or alpha.getpixel((x, y)) < min_alpha:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            points = []
            while queue:
                cx, cy = queue.popleft()
                points.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (
                        0 <= nx < width
                        and 0 <= ny < height
                        and (nx, ny) not in seen
                        and alpha.getpixel((nx, ny)) >= min_alpha
                    ):
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            xs = [point[0] for point in points]
            ys = [point[1] for point in points]
            components.append({
                "points": points,
                "bbox": (min(xs), min(ys), max(xs) + 1, max(ys) + 1),
                "area": len(points),
                "cx": sum(xs) / len(xs),
                "cy": sum(ys) / len(ys),
            })
    return components


def rough_remove_walk_background(image):
    image = image.copy()
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a and is_paper_or_shadow(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
    return image


def remove_border_paper(crop):
    crop = crop.convert("RGBA")
    pixels = crop.load()
    width, height = crop.size
    seen = set()
    queue = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    background = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
            continue
        seen.add((x, y))
        r, g, b, a = pixels[x, y]
        if not a or not is_paper_or_shadow(r, g, b):
            continue
        background.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    matte = Image.new("L", crop.size, 255)
    matte_pixels = matte.load()
    for x, y in background:
        matte_pixels[x, y] = 0
    matte = matte.filter(ImageFilter.GaussianBlur(0.55))

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            matte_alpha = matte.getpixel((x, y))
            if matte_alpha < 245:
                a = min(a, matte_alpha)
            saturation = max(r, g, b) - min(r, g, b)
            brightness = (r + g + b) / 3
            if brightness > 160 and saturation < 55 and a < 230:
                a = min(a, max(0, matte_alpha - 40))
            pixels[x, y] = (0, 0, 0, 0) if a < 24 else (r, g, b, a)
    return crop


def remove_tiny_alpha_islands(frame):
    frame = frame.copy()
    alpha = frame.getchannel("A")
    pixels = frame.load()
    components = []
    for x0, y0, x1, y1, count in alpha_components(frame, min_alpha=24):
        components.append((x0, y0, x1, y1, count))
    if not components:
        return frame
    components.sort(key=lambda item: item[4], reverse=True)
    keep_boxes = components[:1] + [item for item in components[1:] if item[4] >= 50]
    keep = set()
    for x0, y0, x1, y1, _count in keep_boxes:
        for y in range(y0, y1):
            for x in range(x0, x1):
                if alpha.getpixel((x, y)) >= 24:
                    keep.add((x, y))
    for y in range(frame.height):
        for x in range(frame.width):
            if alpha.getpixel((x, y)) and (x, y) not in keep:
                pixels[x, y] = (0, 0, 0, 0)
    return frame


def padded_crop(image, center_x, width):
    x0 = round(center_x - width / 2)
    x1 = x0 + width
    crop = Image.new("RGBA", (width, image.height), (255, 255, 255, 255))
    sx0 = max(0, x0)
    sx1 = min(image.width, x1)
    if sx1 > sx0:
        crop.alpha_composite(image.crop((sx0, 0, sx1, image.height)), (sx0 - x0, 0))
    return crop


def is_white_jpeg_background(r, g, b):
    saturation = max(r, g, b) - min(r, g, b)
    brightness = (r + g + b) / 3
    return brightness > 225 and saturation < 34


def is_pale_ground_shadow(r, g, b):
    saturation = max(r, g, b) - min(r, g, b)
    brightness = (r + g + b) / 3
    return brightness > 172 and saturation < 48


def gemini_alpha_matte(crop):
    pixels = crop.load()
    alpha = Image.new("L", crop.size, 255)
    alpha_pixels = alpha.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, _a = pixels[x, y]
            if is_white_jpeg_background(r, g, b) or (y > 178 and is_pale_ground_shadow(r, g, b)):
                alpha_pixels[x, y] = 0
    return alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.35))


def remove_white_matte(r, g, b, alpha):
    factor = alpha / 255
    if factor >= 0.98:
        return r, g, b
    divisor = max(factor, 0.01)
    return tuple(
        round(max(0, min(255, (channel - 255 * (1 - factor)) / divisor)))
        for channel in (r, g, b)
    )


def extract_main_gemini_component(crop):
    crop = crop.convert("RGBA")
    alpha = gemini_alpha_matte(crop)
    components = alpha_components_with_points(alpha)
    if not components:
        raise RuntimeError("Gemini walk frame has no foreground component")

    center = crop.width / 2
    main = max(components, key=lambda item: item["area"] - abs(item["cx"] - center) * 70)
    mx0, my0, mx1, my1 = main["bbox"]
    keep = set(main["points"])
    for component in components:
        if component is main:
            continue
        x0, y0, x1, y1 = component["bbox"]
        close_to_main = x0 >= mx0 - 8 and x1 <= mx1 + 8 and y0 >= my0 - 8 and y1 <= my1 + 8
        sizeable_near_main = (
            component["area"] > 85
            and abs(component["cx"] - main["cx"]) < 42
            and my0 - 12 <= component["cy"] <= my1 + 12
        )
        if close_to_main or sizeable_near_main:
            keep.update(component["points"])

    output = crop.copy()
    pixels = output.load()
    for y in range(output.height):
        for x in range(output.width):
            if (x, y) not in keep:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            r, g, b, _a = pixels[x, y]
            a = alpha.getpixel((x, y))
            if a < 18:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            pixels[x, y] = (*remove_white_matte(r, g, b, a), a)
    return output


def strong_character_bbox(image):
    pixels = image.load()
    points = []
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a < 42:
                continue
            saturation = max(r, g, b) - min(r, g, b)
            brightness = (r + g + b) / 3
            if brightness > 178 and saturation < 45:
                continue
            points.append((x, y))
    if not points:
        return image.getbbox()
    return (
        min(point[0] for point in points),
        min(point[1] for point in points),
        max(point[0] for point in points) + 1,
        max(point[1] for point in points) + 1,
    )


def build_walk_frames_from_gemini_strip(source):
    source = source.convert("RGBA")
    column_width = source.width / COLS
    raw_frames = []
    for index in range(COLS):
        center_x = (index + 0.5) * column_width
        crop = padded_crop(source, center_x, GEMINI_CROP_W)
        clean = extract_main_gemini_component(crop)
        bbox = strong_character_bbox(clean)
        if not bbox:
            raise RuntimeError(f"Gemini walk frame {index + 1} became empty")
        raw_frames.append((clean, bbox))

    max_width = max(x1 - x0 for _frame, (x0, _y0, x1, _y1) in raw_frames)
    max_height = max(y1 - y0 for _frame, (_x0, y0, _x1, y1) in raw_frames)
    scale = min((FRAME_W - 16) / max_width, (FRAME_H - 12) / max_height)
    frames = []
    for clean, bbox in raw_frames:
        visual_bbox = clean.getbbox()
        crop = clean.crop(visual_bbox)
        new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        crop = crop.resize(new_size, Image.Resampling.LANCZOS)
        x0, y0, x1, y1 = bbox
        vx0, vy0, _vx1, _vy1 = visual_bbox
        center_x = ((x0 + x1) / 2 - vx0) * scale
        bottom = (y1 - vy0) * scale
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        frame.alpha_composite(crop, (round(FRAME_W / 2 - center_x), round(WALK_BASELINE - bottom)))
        frames.append(frame.filter(ImageFilter.UnsharpMask(radius=0.35, percent=35, threshold=3)))
    return frames


def build_walk_frames_from_source(source):
    band = source.crop((0, WALK_BAND_TOP, source.width, source.height)).convert("RGBA")
    rough = rough_remove_walk_background(band)
    components = []
    for x0, y0, x1, y1, count in alpha_components(rough):
        if count > 8000 and (y1 - y0) > 180 and (x1 - x0) > 80:
            components.append((x0, y0, x1, y1, count))
    components = sorted(components, key=lambda item: item[0])[:COLS]
    if len(components) != COLS:
        raise RuntimeError(f"Expected {COLS} walk frames in source panel, found {len(components)}")

    frames = []
    for x0, y0, x1, y1, _count in components:
        pad = 10
        crop = band.crop(
            (
                max(0, x0 - pad),
                max(0, y0 - pad),
                min(band.width, x1 + pad),
                min(band.height, y1 + pad),
            )
        )
        crop = remove_border_paper(crop)
        bbox = crop.getbbox()
        if not bbox:
            raise RuntimeError("Walk frame crop became empty after background removal")
        crop = crop.crop(bbox)
        scale = min((FRAME_W - 14) / crop.width, (FRAME_H - 16) / crop.height)
        new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        crop = crop.resize(new_size, Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        frame.alpha_composite(crop, ((FRAME_W - crop.width) // 2, 211 - crop.height))
        frames.append(remove_tiny_alpha_islands(frame))
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
    if GEMINI_WALK_SRC.exists():
        walk_frames = build_walk_frames_from_gemini_strip(Image.open(GEMINI_WALK_SRC))
    else:
        walk_frames = build_walk_frames_from_source(source)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_row(walk_frames, WALK_ROW_OUT)
    write_sheet(front, back, side, walk_frames, SHEET_OUT)
    write_preview(walk_frames, PREVIEW_OUT)
    print(f"Wrote {WALK_ROW_OUT}")
    print(f"Wrote {SHEET_OUT}")
    print(f"Wrote {PREVIEW_OUT}")


if __name__ == "__main__":
    main()

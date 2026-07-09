"""Extract alpha puppet parts and rig metadata from the generated parts sheet."""

from collections import deque
import json
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
RIG_DIR = ROOT / "assets/james-bond/level-01-briefing/rig-v2"
SOURCE = RIG_DIR / "source/hero-puppet-parts-chromakey.png"
PARTS_DIR = RIG_DIR / "parts"
METADATA_OUT = RIG_DIR / "hero-rig-v2.json"

MIN_COMPONENT_AREA = 1500


PART_NAMES_13 = [
    "head",
    "torso",
    "bag",
    "rear_upper_arm",
    "rear_forearm",
    "front_upper_arm",
    "front_forearm",
    "rear_thigh",
    "rear_shin",
    "front_thigh",
    "front_shin",
    "rear_boot",
    "front_boot",
]

PART_NAMES_11 = [
    "head",
    "torso",
    "bag",
    "rear_forearm",
    "front_upper_arm",
    "front_forearm",
    "rear_upper_arm",
    "rear_upper_leg",
    "front_upper_leg",
    "rear_lower_leg_boot",
    "front_lower_leg_boot",
]


def remove_green_key(image):
    image = image.convert("RGBA")
    pixels = image.load()
    alpha = Image.new("L", image.size, 255)
    alpha_pixels = alpha.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _a = pixels[x, y]
            green_dominant = g > 150 and g - r > 65 and g - b > 65
            bright_key = g > 205 and r < 90 and b < 90
            if green_dominant or bright_key:
                alpha_pixels[x, y] = 0
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.4))
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _a = pixels[x, y]
            a = alpha.getpixel((x, y))
            if a < 18:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            # Despill green from antialiased edges.
            if a < 245 and g > r and g > b:
                g = round(min(g, max(r, b) * 1.05))
            pixels[x, y] = (r, g, b, a)
    return image


def alpha_components(image, min_alpha=32):
    alpha = image.getchannel("A")
    seen = set()
    components = []
    for y in range(image.height):
        for x in range(image.width):
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
                        0 <= nx < image.width
                        and 0 <= ny < image.height
                        and (nx, ny) not in seen
                        and alpha.getpixel((nx, ny)) >= min_alpha
                    ):
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(points) < MIN_COMPONENT_AREA:
                continue
            xs = [point[0] for point in points]
            ys = [point[1] for point in points]
            components.append({
                "bbox": (min(xs), min(ys), max(xs) + 1, max(ys) + 1),
                "area": len(points),
            })
    return components


def sorted_components(components):
    top = sorted([item for item in components if item["bbox"][1] < 430], key=lambda item: item["bbox"][0])
    bottom = sorted([item for item in components if item["bbox"][1] >= 430], key=lambda item: item["bbox"][0])
    return top + bottom


def component_center(component):
    x0, y0, x1, y1 = component["bbox"]
    return ((x0 + x1) / 2, (y0 + y1) / 2)


def classify_generated_13_components(components):
    named = {}

    def pick(name, predicate, key=None):
        matches = [component for component in components if component not in named.values() and predicate(component)]
        if not matches:
            raise RuntimeError(f"Could not find component for {name}")
        named[name] = min(matches, key=key or (lambda component: component["bbox"][0]))

    pick("head", lambda c: c["bbox"][0] < 400 and c["bbox"][1] < 430)
    pick("torso", lambda c: 400 <= component_center(c)[0] < 720 and c["bbox"][1] < 520)
    pick("bag", lambda c: 720 <= component_center(c)[0] < 960 and c["bbox"][1] < 520)

    arm_sleeves = [
        component for component in components
        if 960 <= component_center(component)[0] < 1185 and component["bbox"][1] < 650
    ]
    arm_sleeves = sorted(arm_sleeves, key=lambda component: component["bbox"][1])
    if len(arm_sleeves) < 2:
        raise RuntimeError("Could not find both upper-arm sleeve components")
    named["rear_upper_arm"] = arm_sleeves[0]
    named["front_upper_arm"] = arm_sleeves[1]

    forearms = [
        component for component in components
        if component_center(component)[0] >= 1185 and component["bbox"][1] < 650
    ]
    forearms = sorted(forearms, key=lambda component: component["bbox"][1])
    if len(forearms) < 2:
        raise RuntimeError("Could not find both forearm components")
    named["rear_forearm"] = forearms[0]
    named["front_forearm"] = forearms[1]

    pick("rear_thigh", lambda c: component_center(c)[0] < 320 and c["bbox"][1] >= 520)
    pick("rear_shin", lambda c: 320 <= component_center(c)[0] < 500 and c["bbox"][1] >= 650)
    pick("rear_boot", lambda c: 500 <= component_center(c)[0] < 760 and c["bbox"][1] >= 700)
    pick("front_thigh", lambda c: 760 <= component_center(c)[0] < 1030 and c["bbox"][1] >= 560)
    pick("front_shin", lambda c: 1030 <= component_center(c)[0] < 1200 and c["bbox"][1] >= 650)
    pick("front_boot", lambda c: component_center(c)[0] >= 1200 and c["bbox"][1] >= 700)

    return [(name, named[name]) for name in PART_NAMES_13]


def relative_pivot(name, width, height):
    pivots = {
        "head": (0.52, 0.92),
        "torso": (0.52, 0.11),
        "rear_upper_arm": (0.50, 0.12),
        "rear_forearm": (0.12, 0.54),
        "front_upper_arm": (0.50, 0.12),
        "front_forearm": (0.12, 0.54),
        "bag": (0.50, 0.16),
        "rear_thigh": (0.50, 0.07),
        "rear_shin": (0.50, 0.08),
        "rear_boot": (0.22, 0.18),
        "front_thigh": (0.50, 0.07),
        "front_shin": (0.50, 0.08),
        "front_boot": (0.22, 0.18),
        "rear_upper_leg": (0.50, 0.07),
        "rear_lower_leg_boot": (0.48, 0.06),
        "front_upper_leg": (0.50, 0.07),
        "front_lower_leg_boot": (0.48, 0.06),
    }
    rx, ry = pivots.get(name, (0.5, 0.5))
    return [round(width * rx, 2), round(height * ry, 2)]


def is_skin_tone(r, g, b):
    return r > 150 and g > 85 and b > 45 and r > g * 1.15 and g > b * 1.08


def remove_connector_pegs(name, part):
    if name in {"head", "torso", "bag", "front_forearm", "rear_forearm"}:
        return part
    output = part.copy()
    pixels = output.load()
    top_limit = round(output.height * 0.18)
    bottom_start = round(output.height * 0.78)
    for y in range(output.height):
        in_connector_zone = y <= top_limit or (
            name in {"front_upper_arm", "rear_upper_arm"} and y >= bottom_start
        )
        if not in_connector_zone:
            continue
        for x in range(output.width):
            r, g, b, a = pixels[x, y]
            if a and is_skin_tone(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
    return output


def main():
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    keyed = Image.open(SOURCE)
    alpha_sheet = remove_green_key(keyed)
    alpha_sheet.save(RIG_DIR / "source/hero-puppet-parts-alpha-preview.png")

    components = alpha_components(alpha_sheet)
    if len(components) == len(PART_NAMES_13):
        named_components = classify_generated_13_components(components)
    elif len(components) >= len(PART_NAMES_13):
        ordered = sorted_components(components)
        named_components = list(zip(PART_NAMES_13, ordered))
    elif len(components) >= len(PART_NAMES_11):
        ordered = sorted_components(components)
        named_components = list(zip(PART_NAMES_11, ordered))
    else:
        raise RuntimeError(f"Expected at least {len(PART_NAMES_11)} components, found {len(components)}")

    parts = []
    for name, component in named_components:
        bbox = component["bbox"]
        part = remove_connector_pegs(name, alpha_sheet.crop(bbox))
        path = PARTS_DIR / f"{name}.png"
        part.save(path)
        parts.append({
            "name": name,
            "path": str(path.relative_to(ROOT)),
            "source_bbox": list(bbox),
            "size": [part.width, part.height],
            "pivot": relative_pivot(name, part.width, part.height),
        })

    metadata = {
        "source": str(SOURCE.relative_to(ROOT)),
        "frame": {"width": 192, "height": 220, "baseline": 211},
        "parts": parts,
        "notes": [
            "Generated as a layered puppet kit on chroma key, then extracted to alpha PNGs.",
            "spare_boot_* parts are retained for manual refinement but not used by the default walk rig.",
        ],
    }
    METADATA_OUT.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Wrote {METADATA_OUT}")
    for part in parts:
        print(part["name"], part["size"], part["source_bbox"])


if __name__ == "__main__":
    main()
